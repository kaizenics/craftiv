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
  processedTransactions,
} from "@/db/schema";

function getEffectivePlan(user: {
  plan: "free" | "plus" | "pro" | null;
  isPaid: boolean | null;
}) {
  if (!user.isPaid) return "free" as const;
  return user.plan ?? "free";
}

function findValueDeep(
  value: unknown,
  predicate: (key: string, val: unknown) => boolean
): boolean {
  if (Array.isArray(value)) {
    return value.some((entry) => findValueDeep(entry, predicate));
  }
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).some(
      ([key, val]) => predicate(key, val) || findValueDeep(val, predicate)
    );
  }
  return false;
}

function extractPaddleTransaction(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== "object") return {};
  const root = data as Record<string, unknown>;
  if (root.data && typeof root.data === "object") return root.data as Record<string, unknown>;
  return root;
}

function collectPriceIds(value: unknown): string[] {
  const found = new Set<string>();
  const visit = (node: unknown) => {
    if (Array.isArray(node)) {
      for (const item of node) visit(item);
      return;
    }
    if (!node || typeof node !== "object") return;
    for (const [key, nested] of Object.entries(node as Record<string, unknown>)) {
      if (typeof nested === "string") {
        const normalizedKey = key.toLowerCase();
        if (
          nested.startsWith("pri_") &&
          (normalizedKey === "price_id" ||
            normalizedKey === "priceid" ||
            normalizedKey === "id")
        ) {
          found.add(nested);
        }
      } else {
        visit(nested);
      }
    }
  };
  visit(value);
  return [...found];
}

function isTransactionUniqueConstraintError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const message = "message" in error ? String((error as { message?: unknown }).message) : "";
  return message.includes("processed_transactions.transaction_id");
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

    const plan = getEffectivePlan(user);
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

  confirmCheckout: protectedProcedure
    .input(
      z.object({
        plan: z.enum(["plus", "pro"]),
        transactionId: z.string().min(3),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const alreadyProcessed = await ctx.db.query.processedTransactions.findFirst({
        where: eq(processedTransactions.transactionId, input.transactionId),
      });
      if (alreadyProcessed) {
        if (alreadyProcessed.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "This transaction is already linked to another account.",
          });
        }
        return {
          success: true,
          plan: alreadyProcessed.plan as "plus" | "pro",
          alreadyProcessed: true,
        };
      }

      const paddleApiKey = process.env.PADDLE_API_KEY;
      const paddleEnv =
        (process.env.NEXT_PUBLIC_PADDLE_ENV as "sandbox" | "production" | undefined) ??
        "sandbox";
      const expectedPriceId =
        input.plan === "plus"
          ? process.env.NEXT_PUBLIC_PADDLE_PRICE_PLUS_USD
          : process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_USD;

      if (!paddleApiKey) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Missing PADDLE_API_KEY on server.",
        });
      }

      if (!expectedPriceId) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `Missing Paddle price ID for ${input.plan}.`,
        });
      }

      const baseUrl =
        paddleEnv === "production"
          ? "https://api.paddle.com"
          : "https://sandbox-api.paddle.com";

      const fetchPaddleTransaction = async () => {
        let lastStatus = 0;
        for (let attempt = 0; attempt < 3; attempt += 1) {
          const response = await fetch(`${baseUrl}/transactions/${input.transactionId}`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${paddleApiKey}`,
              "Content-Type": "application/json",
            },
          });
          lastStatus = response.status;
          if (response.ok) {
            return (await response.json()) as unknown;
          }
          // Paddle can be eventually consistent right after checkout.complete
          await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
        }
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Unable to verify Paddle transaction (status ${lastStatus}).`,
        });
      };

      const payload = await fetchPaddleTransaction();
      const tx = extractPaddleTransaction(payload);

      const statusMatches = findValueDeep(tx, (key, val) => {
        if (typeof val !== "string") return false;
        const normalizedKey = key.toLowerCase();
        const normalizedVal = val.toLowerCase();
        if (normalizedKey !== "status" && normalizedKey !== "transaction_status") return false;
        return (
          normalizedVal.includes("complete") ||
          normalizedVal.includes("paid") ||
          normalizedVal.includes("billed")
        );
      });

      const priceIds = collectPriceIds(tx);
      const priceMatches = priceIds.includes(expectedPriceId);

      if (!statusMatches || !priceMatches) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Paddle transaction did not match the selected plan. expected=${expectedPriceId} found=${priceIds.join(",") || "none"}`,
        });
      }

      const applyPlanUpgrade = async () => {
        return ctx.db.transaction(async (tx) => {
          const existing = await tx.query.processedTransactions.findFirst({
            where: eq(processedTransactions.transactionId, input.transactionId),
          });

          if (existing) {
            if (existing.userId !== ctx.user.id) {
              throw new TRPCError({
                code: "FORBIDDEN",
                message: "This transaction is already linked to another account.",
              });
            }
            return {
              success: true,
              plan: existing.plan as "plus" | "pro",
              alreadyProcessed: true,
            };
          }

          await tx.insert(processedTransactions).values({
            id: crypto.randomUUID(),
            userId: ctx.user.id,
            provider: "paddle",
            transactionId: input.transactionId,
            plan: input.plan,
            status: "completed",
          });

          await tx
            .update(users)
            .set({
              plan: input.plan,
              isPaid: true,
              updatedAt: new Date(),
            })
            .where(eq(users.id, ctx.user.id));

          return {
            success: true,
            plan: input.plan as "plus" | "pro",
            alreadyProcessed: false,
          };
        });
      };

      try {
        return await applyPlanUpgrade();
      } catch (error) {
        if (!isTransactionUniqueConstraintError(error)) {
          throw error;
        }

        const existing = await ctx.db.query.processedTransactions.findFirst({
          where: eq(processedTransactions.transactionId, input.transactionId),
        });

        if (!existing) {
          throw error;
        }
        if (existing.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "This transaction is already linked to another account.",
          });
        }

        return {
          success: true,
          plan: existing.plan as "plus" | "pro",
          alreadyProcessed: true,
        };
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
