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
  userAiProviders,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import {
  createPolarCheckout,
  type CheckoutPlan,
  validatePolarConfig,
} from "@/lib/polar";
import { fromCreditUnits } from "@/lib/credits";
import {
  getUserPreferencesFromRecord,
  userPreferencesSchema,
} from "@/lib/user-preferences";
import {
  onboardingTourKeySchema,
  parseCompletedTours,
  serializeCompletedTours,
} from "@/lib/onboarding";

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
   * Which guided tours this account has already been offered.
   *
   * Its own query rather than a field read off `me`, so a page can ask for just
   * this without pulling the whole user row.
   */
  onboardingStatus: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.query.users.findFirst({
      columns: { onboardingToursCompleted: true },
      where: eq(users.id, ctx.user.id),
    });

    return { completed: parseCompletedTours(user?.onboardingToursCompleted) };
  }),

  /**
   * Marks one tour as done. Called both when it is finished and when it is
   * skipped: either way the person has been offered it, and replaying it after
   * a deliberate dismissal is worse than not showing it at all.
   *
   * Read-modify-write on a JSON column, so it is deliberately additive -- two
   * tours completed in quick succession must not clobber one another, and the
   * set union means a repeat call is harmless.
   */
  completeOnboarding: protectedProcedure
    .input(z.object({ tour: onboardingTourKeySchema }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({
        columns: { onboardingToursCompleted: true },
        where: eq(users.id, ctx.user.id),
      });

      const completed = new Set(parseCompletedTours(user?.onboardingToursCompleted));
      completed.add(input.tour);

      await ctx.db
        .update(users)
        .set({
          onboardingToursCompleted: serializeCompletedTours(completed),
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id));

      return { completed: [...completed] };
    }),

  preferences: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.query.users.findFirst({
      columns: {
        autoSaveDrafts: true,
        defaultSpellCheck: true,
        showResumeScore: true,
        compactEditor: true,
      },
      where: eq(users.id, ctx.user.id),
    });

    return getUserPreferencesFromRecord(user);
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
        process.env.POLAR_SUCCESS_URL?.trim() ||
        `${origin.replace(/\/$/, "")}/dashboard/settings/profile`;

      try {
        validatePolarConfig();
        const checkoutUrl = await createPolarCheckout({
          userId: ctx.user.id,
          userEmail: ctx.user.email,
          plan: input.plan as CheckoutPlan,
          successUrl,
        });

        return { checkoutUrl };
      } catch (error) {
        console.error("Failed to create Polar checkout:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to start checkout right now. Please try again in a moment.",
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
   * Profile and preferences are saved separately because they live on separate
   * settings pages. One combined mutation would make each page send the other's
   * fields, and a page that didn't know them would overwrite them with defaults.
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        firstName: z.string().trim().min(1, "First name is required").max(100),
        lastName: z.string().trim().max(100).optional().default(""),
        email: z.string().trim().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const fullName = `${input.firstName} ${input.lastName}`.trim();
      const requestedEmail = input.email.trim().toLowerCase();
      const currentEmail = ctx.user.email.trim().toLowerCase();
      const emailChangeRequested = requestedEmail !== currentEmail;

      // Everything except the address is ours to write directly.
      await ctx.db
        .update(users)
        .set({
          name: fullName,
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id));

      /**
       * The address is not. Writing `users.email` here used to move an account
       * to any address the form supplied, with no proof the user held it and
       * without clearing `emailVerified` — and the Polar webhook resolves an
       * order to a user by billing email, so an unregistered address was worth
       * claiming. Better Auth owns this transition: it emails the *current*
       * address for confirmation and only then swaps it over.
       */
      if (emailChangeRequested) {
        try {
          await auth.api.changeEmail({
            body: { newEmail: requestedEmail, callbackURL: "/dashboard/settings/profile" },
            headers: ctx.requestHeaders,
          });
        } catch (error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              error instanceof Error && error.message
                ? `Could not start the email change. ${error.message}`
                : "Could not start the email change. Please sign in again and retry.",
            cause: error,
          });
        }
      }

      return {
        name: fullName,
        // Unchanged until the confirmation link is followed, so the client is
        // told the address on file rather than the one that was requested.
        email: ctx.user.email,
        emailChangePending: emailChangeRequested,
      };
    }),

  updatePreferences: protectedProcedure
    .input(userPreferencesSchema)
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(users)
        .set({
          autoSaveDrafts: input.autoSaveDrafts,
          defaultSpellCheck: input.defaultSpellCheck,
          showResumeScore: input.showResumeScore,
          compactEditor: input.compactEditor,
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id));

      return input;
    }),

  /**
   * Delete user account and all associated data
   */
  deleteAccount: protectedProcedure
    .input(z.object({ confirmEmail: z.string().max(320) }))
    .mutation(async ({ ctx, input }) => {
      // Typing the address is the confirmation step: it works for password,
      // OTP and Google accounts alike, and a stray click or forged request
      // can't supply it.
      if (input.confirmEmail.trim().toLowerCase() !== ctx.user.email.trim().toLowerCase()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The email you typed doesn't match your account.",
        });
      }

      // One transaction, so a failure part-way never leaves a half-deleted account.
      await ctx.db.transaction(async (tx) => {
        await tx.delete(coverLetters).where(eq(coverLetters.userId, ctx.user.id));
        // Cascade should handle the rest, but being explicit
        await tx.delete(resumes).where(eq(resumes.userId, ctx.user.id));
        await tx.delete(accounts).where(eq(accounts.userId, ctx.user.id));
        await tx.delete(userAiProviders).where(eq(userAiProviders.userId, ctx.user.id));
        await tx.delete(sessions).where(eq(sessions.userId, ctx.user.id));
        await tx.delete(users).where(eq(users.id, ctx.user.id));
      });

      return { success: true };
    }),
});
