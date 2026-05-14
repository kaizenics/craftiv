import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "../init";
import {
  users,
  accounts,
  sessions,
  resumes,
  coverLetters,
} from "@/db/schema";
import {
  createLemonSqueezyCheckout,
  type CheckoutPlan,
  validateLemonSqueezyConfig,
} from "@/lib/lemon-squeezy";
import { fromCreditUnits } from "@/lib/credits";

function getEffectivePlan(user: {
  plan: "free" | "active" | "plus" | "pro" | null;
  isPaid: boolean | null;
}) {
  if (!user.isPaid) return "free" as const;
  return user.plan ?? "free";
}

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
      columns: {
        status: true,
      },
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
      columns: {
        id: true,
        plan: true,
        isPaid: true,
        creditBalance: true,
        resumeCreatedCount: true,
        coverLetterCreatedCount: true,
      },
      where: eq(users.id, ctx.user.id),
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const plan = getEffectivePlan(user);
    const creditBalance = user.creditBalance ?? 0;
    const resumeCreated = user.resumeCreatedCount ?? 0;
    const coverLetterCreated = user.coverLetterCreatedCount ?? 0;

    return {
      plan,
      isPaid: !!user.isPaid,
      status: user.isPaid ? "active" : "inactive",
      creditBalance: fromCreditUnits(creditBalance),
      creditBalanceUnits: creditBalance,
      resumeCreatedCount: resumeCreated,
      coverLetterCreatedCount: coverLetterCreated,
    };
  }),

  createCheckout: protectedProcedure
    .input(
      z.object({
        plan: z.enum(["active", "plus", "pro"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User email is required to start checkout",
        });
      }

      const origin =
        process.env.NEXT_PUBLIC_APP_URL?.trim() ||
        process.env.BETTER_AUTH_URL?.trim() ||
        "http://localhost:3000";

      const successUrl =
        process.env.LEMON_SQUEEZY_SUCCESS_URL?.trim() ||
        `${origin.replace(/\/$/, "")}/dashboard/settings`;

      try {
        validateLemonSqueezyConfig();
        const checkoutUrl = await createLemonSqueezyCheckout({
          userId: ctx.user.id,
          userEmail: ctx.user.email,
          plan: input.plan as CheckoutPlan,
          successUrl,
        });

        return { checkoutUrl };
      } catch (error) {
        console.error("Failed to create Lemon Squeezy checkout:", error);
        const details =
          error instanceof Error
            ? error.message
            : "Unknown checkout error";
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Unable to start checkout right now. ${details}`,
        });
      }
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
