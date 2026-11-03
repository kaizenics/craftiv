import { z } from "zod";
import { and, count, desc, eq, gte, max } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "../init";
import { coverLetterShareViews, coverLetters, resumeShareViews, resumes, shareSlugs } from "@/db/schema";
import { enforceRouteRateLimits } from "@/lib/security/guards";
import type { Database } from "@/db";
import { generateShareToken, utcDay } from "@/lib/share";
import { isUniqueConstraintError } from "@/lib/db-errors";
import { isValidShareSlug, normalizeShareSlug } from "@/lib/share-slug";

const STATS_DAYS = 30;
// Links are never released, so a cap stops one account from reserving every name.
const MAX_SLUGS_PER_USER = 10;
const SLUG_TAKEN = "That link is already taken. Try adding a word or a number.";

export const SHAREABLE_KINDS = ["resume", "coverLetter"] as const;
export type ShareableKind = (typeof SHAREABLE_KINDS)[number];

const target = z.object({ kind: z.enum(SHAREABLE_KINDS), id: z.string() });
type Target = z.infer<typeof target>;

async function getOwned(db: Database, { kind, id }: Target, userId: string) {
  const columns = { id: true, shareToken: true, shareEnabled: true } as const;
  const row =
    kind === "resume"
      ? await db.query.resumes.findFirst({
          columns,
          where: and(eq(resumes.id, id), eq(resumes.userId, userId)),
        })
      : await db.query.coverLetters.findFirst({
          columns,
          where: and(eq(coverLetters.id, id), eq(coverLetters.userId, userId)),
        });
  if (!row) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: kind === "resume" ? "Resume not found" : "Cover letter not found",
    });
  }
  return row;
}

async function updateShare(
  db: Database,
  { kind, id }: Target,
  userId: string,
  values: { shareToken?: string; shareEnabled?: boolean },
) {
  const set = { ...values, updatedAt: new Date() };
  if (kind === "resume") {
    await db.update(resumes).set(set).where(and(eq(resumes.id, id), eq(resumes.userId, userId)));
  } else {
    await db
      .update(coverLetters)
      .set(set)
      .where(and(eq(coverLetters.id, id), eq(coverLetters.userId, userId)));
  }
}

/** Writes a fresh token, retrying on the (astronomically unlikely) collision. */
async function assignNewToken(db: Database, item: Target, userId: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const token = generateShareToken();
    try {
      await updateShare(db, item, userId, { shareToken: token });
      return token;
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;
    }
  }
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Couldn't create a share link. Please try again.",
  });
}

async function viewStats(db: Database, { kind, id }: Target) {
  const since = utcDay(new Date(Date.now() - (STATS_DAYS - 1) * 24 * 60 * 60 * 1000));
  const views = kind === "resume" ? resumeShareViews : coverLetterShareViews;
  const owner = kind === "resume" ? resumeShareViews.resumeId : coverLetterShareViews.coverLetterId;

  const [totals] = await db
    .select({ views: count(), lastViewedAt: max(views.createdAt) })
    .from(views)
    .where(eq(owner, id));
  const daily = await db
    .select({ day: views.viewedOn, views: count() })
    .from(views)
    .where(and(eq(owner, id), gte(views.viewedOn, since)))
    .groupBy(views.viewedOn)
    .orderBy(desc(views.viewedOn));

  return {
    totalViews: totals?.views ?? 0,
    lastViewedAt: totals?.lastViewedAt ?? null,
    viewsLast30Days: daily.reduce((sum, row) => sum + row.views, 0),
    daily,
  };
}

/**
 * Public share links for resumes (/r/<token>) and cover letters (/c/<token>).
 * The owner can switch a link off (token kept) or regenerate it (old token
 * stops working). A resume may also have a custom link (/r/<slug>).
 */
export const shareRouter = createTRPCRouter({
  get: protectedProcedure.input(target).query(async ({ ctx, input }) => {
    const row = await getOwned(ctx.db, input, ctx.user.id);
    const slug =
      input.kind === "resume" && row.shareEnabled
        ? ((await ctx.db.query.shareSlugs.findFirst({ columns: { slug: true }, where: eq(shareSlugs.resumeId, input.id) }))?.slug ?? null)
        : null;
    return {
      enabled: row.shareEnabled,
      token: row.shareEnabled ? row.shareToken : null,
      slug,
      ...(await viewStats(ctx.db, input)),
    };
  }),

  /**
   * Points a custom link at a resume, or takes it off (empty string). A link is reserved to the user who
   * first claimed it and is never released to anyone else, so a link already sent can't be taken over.
   */
  setSlug: protectedProcedure
    .input(z.object({ id: z.string(), slug: z.string().max(200) }))
    .mutation(async ({ ctx, input }) => {
      // Also slows anyone using CONFLICT answers to find out which links exist.
      const limit = await enforceRouteRateLimits({
        category: "global",
        route: "/api/trpc/share.setSlug",
        requestHeaders: ctx.requestHeaders,
        userId: ctx.user.id,
      });
      if (!limit.allowed) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: `Too many changes. Try again in ${limit.retryAfterSeconds} seconds.` });
      }
      await getOwned(ctx.db, { kind: "resume", id: input.id }, ctx.user.id);
      const slug = normalizeShareSlug(input.slug);
      if (slug && !isValidShareSlug(slug)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Use 3 to 40 letters, numbers or hyphens." });
      }

      try {
        await ctx.db.transaction(async (tx) => {
          const existing = slug ? await tx.query.shareSlugs.findFirst({ where: eq(shareSlugs.slug, slug) }) : undefined;
          if (existing && existing.userId !== ctx.user.id) {
            throw new TRPCError({ code: "CONFLICT", message: SLUG_TAKEN });
          }
          if (slug && !existing) {
            const [owned] = await tx.select({ total: count() }).from(shareSlugs).where(eq(shareSlugs.userId, ctx.user.id));
            if ((owned?.total ?? 0) >= MAX_SLUGS_PER_USER) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: `You've used all ${MAX_SLUGS_PER_USER} custom links. Reuse one you've had before.`,
              });
            }
          }
          // Off the resume first: the link stays reserved to this user, just unused.
          await tx.update(shareSlugs).set({ resumeId: null }).where(eq(shareSlugs.resumeId, input.id));
          if (!slug) return;
          if (existing) {
            await tx.update(shareSlugs).set({ resumeId: input.id }).where(eq(shareSlugs.slug, slug));
          } else {
            await tx.insert(shareSlugs).values({ slug, userId: ctx.user.id, resumeId: input.id });
          }
        });
      } catch (error) {
        // Two people claiming the same new link at once: the loser gets the same answer as a taken link.
        if (isUniqueConstraintError(error)) throw new TRPCError({ code: "CONFLICT", message: SLUG_TAKEN });
        throw error;
      }
      return { slug: slug || null };
    }),

  setEnabled: protectedProcedure
    .input(target.extend({ enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const row = await getOwned(ctx.db, input, ctx.user.id);
      let token = row.shareToken;
      if (input.enabled && !token) {
        token = await assignNewToken(ctx.db, input, ctx.user.id);
      }
      await updateShare(ctx.db, input, ctx.user.id, { shareEnabled: input.enabled });
      return { enabled: input.enabled, token: input.enabled ? token : null };
    }),

  regenerate: protectedProcedure.input(target).mutation(async ({ ctx, input }) => {
    await getOwned(ctx.db, input, ctx.user.id);
    const token = await assignNewToken(ctx.db, input, ctx.user.id);
    // "Create a new link" means every link already sent stops working, the custom one included.
    // It stays reserved to this user, so nobody else can pick it up.
    if (input.kind === "resume") {
      await ctx.db.update(shareSlugs).set({ resumeId: null }).where(eq(shareSlugs.resumeId, input.id));
    }
    return { token };
  }),
});
