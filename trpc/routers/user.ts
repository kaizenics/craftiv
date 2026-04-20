import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  protectedProcedure,
} from "../init";
import { users, accounts, sessions, resumes, coverLetters } from "@/db/schema";

/**
 * User Router
 * Handles user profile operations
 */
export const userRouter = createTRPCRouter({
  /**
   * Get current authenticated user
   */
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.user.id),
    });

    return user ?? null;
  }),

  /**
   * Get user's OAuth providers
   */
  getProviders: protectedProcedure.query(async ({ ctx }) => {
    const userAccounts = await ctx.db.query.accounts.findMany({
      where: eq(accounts.userId, ctx.user.id),
    });

    return userAccounts.map((account) => ({
      providerId: account.providerId,
    }));
  }),

  /**
   * Get user stats for dashboard
   */
  stats: protectedProcedure.query(async ({ ctx }) => {
    const userResumes = await ctx.db.query.resumes.findMany({
      where: (resumes, { eq }) => eq(resumes.userId, ctx.user.id),
    });

    const totalResumes = userResumes.length;
    const completedResumes = userResumes.filter(
      (r) => r.status === "completed"
    ).length;
    const draftResumes = userResumes.filter(
      (r) => r.status === "draft"
    ).length;

    return {
      totalResumes,
      completedResumes,
      draftResumes,
    };
  }),

  subscription: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.query.users.findFirst({
      where: eq(users.id, ctx.user.id),
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const plan = user.plan ?? "free";
    const resumeCreated = user.resumeCreatedCount ?? 0;
    const coverLetterCreated = user.coverLetterCreatedCount ?? 0;
    const limit = plan === "free" ? 1 : plan === "plus" ? 20 : null;

    return {
      plan,
      isPaid: !!user.isPaid,
      status: user.isPaid ? "active" : "inactive",
      resumeCreatedCount: resumeCreated,
      resumeCreationLimit: limit,
      coverLetterCreatedCount: coverLetterCreated,
      coverLetterCreationLimit: limit,
    };
  }),

  cancelPlan: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .update(users)
      .set({
        plan: "free",
        isPaid: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, ctx.user.id));

    return { success: true };
  }),

  /**
   * Delete user account and all associated data
   */
  deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.delete(coverLetters).where(eq(coverLetters.userId, ctx.user.id));

    // Delete user's resumes first (cascade should handle this, but being explicit)
    await ctx.db.delete(resumes).where(
      eq(resumes.userId, ctx.user.id)
    );

    // Delete user's accounts (OAuth connections)
    await ctx.db.delete(accounts).where(eq(accounts.userId, ctx.user.id));

    // Delete user's sessions
    await ctx.db.delete(sessions).where(
      eq(sessions.userId, ctx.user.id)
    );

    // Finally, delete the user
    await ctx.db.delete(users).where(eq(users.id, ctx.user.id));

    return { success: true };
  }),
});
