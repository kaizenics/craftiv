import { z } from "zod";
import { and, count, desc, eq, gte, max } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "../init";
import { resumeShareViews, resumes } from "@/db/schema";
import type { Database } from "@/db";
import { generateShareToken, utcDay } from "@/lib/share";
import { isUniqueConstraintError } from "@/lib/db-errors";

const STATS_DAYS = 30;

async function getOwnedResume(db: Database, resumeId: string, userId: string) {
  const resume = await db.query.resumes.findFirst({
    columns: { id: true, shareToken: true, shareEnabled: true },
    where: and(eq(resumes.id, resumeId), eq(resumes.userId, userId)),
  });
  if (!resume) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Resume not found" });
  }
  return resume;
}

/** Writes a fresh token, retrying on the (astronomically unlikely) collision. */
async function assignNewToken(db: Database, resumeId: string, userId: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const token = generateShareToken();
    try {
      await db
        .update(resumes)
        .set({ shareToken: token, updatedAt: new Date() })
        .where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId)));
      return token;
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;
    }
  }
  throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Couldn't create a share link. Please try again." });
}

/**
 * Public share links for resumes. The link is /r/<token>; the owner can switch
 * it off (token kept) or regenerate it (old token stops working).
 */
export const resumeShareRouter = createTRPCRouter({
  get: protectedProcedure
    .input(z.object({ resumeId: z.string() }))
    .query(async ({ ctx, input }) => {
      const resume = await getOwnedResume(ctx.db, input.resumeId, ctx.user.id);

      const since = utcDay(new Date(Date.now() - (STATS_DAYS - 1) * 24 * 60 * 60 * 1000));
      const [totals] = await ctx.db
        .select({ views: count(), lastViewedAt: max(resumeShareViews.createdAt) })
        .from(resumeShareViews)
        .where(eq(resumeShareViews.resumeId, resume.id));
      const daily = await ctx.db
        .select({ day: resumeShareViews.viewedOn, views: count() })
        .from(resumeShareViews)
        .where(and(eq(resumeShareViews.resumeId, resume.id), gte(resumeShareViews.viewedOn, since)))
        .groupBy(resumeShareViews.viewedOn)
        .orderBy(desc(resumeShareViews.viewedOn));

      return {
        enabled: resume.shareEnabled,
        token: resume.shareEnabled ? resume.shareToken : null,
        totalViews: totals?.views ?? 0,
        lastViewedAt: totals?.lastViewedAt ?? null,
        viewsLast30Days: daily.reduce((sum, row) => sum + row.views, 0),
        daily,
      };
    }),

  setEnabled: protectedProcedure
    .input(z.object({ resumeId: z.string(), enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const resume = await getOwnedResume(ctx.db, input.resumeId, ctx.user.id);
      let token = resume.shareToken;
      if (input.enabled && !token) {
        token = await assignNewToken(ctx.db, resume.id, ctx.user.id);
      }
      await ctx.db
        .update(resumes)
        .set({ shareEnabled: input.enabled, updatedAt: new Date() })
        .where(and(eq(resumes.id, resume.id), eq(resumes.userId, ctx.user.id)));
      return { enabled: input.enabled, token: input.enabled ? token : null };
    }),

  regenerate: protectedProcedure
    .input(z.object({ resumeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const resume = await getOwnedResume(ctx.db, input.resumeId, ctx.user.id);
      const token = await assignNewToken(ctx.db, resume.id, ctx.user.id);
      return { token };
    }),
});
