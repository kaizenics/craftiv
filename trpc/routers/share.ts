import { z } from "zod";
import { and, count, desc, eq, gte, max } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "../init";
import { coverLetterShareViews, coverLetters, resumeShareViews, resumes } from "@/db/schema";
import type { Database } from "@/db";
import { generateShareToken, utcDay } from "@/lib/share";
import { isUniqueConstraintError } from "@/lib/db-errors";

const STATS_DAYS = 30;

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
 * stops working).
 */
export const shareRouter = createTRPCRouter({
  get: protectedProcedure.input(target).query(async ({ ctx, input }) => {
    const row = await getOwned(ctx.db, input, ctx.user.id);
    return {
      enabled: row.shareEnabled,
      token: row.shareEnabled ? row.shareToken : null,
      ...(await viewStats(ctx.db, input)),
    };
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
    return { token };
  }),
});
