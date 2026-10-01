import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../init";
import { userAiProviders, users } from "@/db/schema";
import type { Database } from "@/db";
import { AiKeyEncryptionConfigError, decryptApiKey, encryptApiKey } from "@/lib/ai-key-crypto";
import {
  AI_PROVIDER_IDS,
  API_KEY_MAX_LENGTH,
  API_KEY_MIN_LENGTH,
  MODEL_ID_PATTERN,
  apiKeyHint,
} from "@/lib/ai-providers";
import { testOwnAi } from "@/lib/own-ai";
import { isOwnAiUnlocked } from "@/lib/own-ai-access";
import { enforceRouteRateLimits } from "@/lib/security/guards";
import { hashForLogs, securityLog } from "@/lib/security/logging";

const LOCKED_MESSAGE = "Using your own AI is included with any credit pack. Buy one to unlock it.";

async function assertUnlocked(db: Database, userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { isPaid: true },
  });
  if (!isOwnAiUnlocked(user)) {
    throw new TRPCError({ code: "FORBIDDEN", message: LOCKED_MESSAGE });
  }
}

/** Saving and testing both call the provider, so they share the AI rate limits. */
async function enforceProviderCallRateLimit(
  ctx: { requestHeaders: { get(name: string): string | null }; user: { id: string } },
  mutation: string,
) {
  const result = await enforceRouteRateLimits({
    category: "ai_heavy",
    route: `/api/trpc/ownAi.${mutation}`,
    requestHeaders: ctx.requestHeaders,
    userId: ctx.user.id,
  });
  if (!result.allowed) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Rate limit exceeded. Retry after ${result.retryAfterSeconds} second(s).`,
    });
  }
}

function decryptStoredKey(encryptedKey: string): string {
  try {
    return decryptApiKey(encryptedKey);
  } catch (error) {
    if (error instanceof AiKeyEncryptionConfigError) throw toConfigError(error);
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Your saved key can no longer be read. Paste it again to reconnect.",
    });
  }
}

function toConfigError(error: AiKeyEncryptionConfigError) {
  console.error("[ownAi] encryption is not configured:", error.message);
  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Connecting your own AI isn't available right now. Please try again later.",
  });
}

async function getConnectionView(db: Database, userId: string) {
  const [user, connection] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, userId), columns: { isPaid: true } }),
    db.query.userAiProviders.findFirst({ where: eq(userAiProviders.userId, userId) }),
  ]);

  return {
    unlocked: isOwnAiUnlocked(user),
    // Never the key itself -- only which one is connected.
    connection: connection
      ? {
          provider: connection.provider,
          model: connection.model,
          keyHint: connection.keyHint,
          enabled: connection.enabled,
          lastVerifiedAt: connection.lastVerifiedAt,
        }
      : null,
  };
}

const saveInput = z.object({
  provider: z.enum(AI_PROVIDER_IDS),
  model: z.string().trim().regex(MODEL_ID_PATTERN, "Enter a valid model ID."),
  /** Optional when only the model changes on an already-connected provider. */
  apiKey: z
    .string()
    .trim()
    .min(API_KEY_MIN_LENGTH, "That doesn't look like a complete API key.")
    .max(API_KEY_MAX_LENGTH, "That doesn't look like an API key.")
    .regex(/^\S+$/, "API keys don't contain spaces.")
    .optional(),
});

export const ownAiRouter = createTRPCRouter({
  get: protectedProcedure.query(({ ctx }) => getConnectionView(ctx.db, ctx.user.id)),

  /**
   * Tests the key and model against the provider, and stores them only if the
   * test passes -- a key that was saved but never worked would turn every AI
   * action into an error.
   */
  save: protectedProcedure.input(saveInput).mutation(async ({ ctx, input }) => {
    await enforceProviderCallRateLimit(ctx, "save");
    await assertUnlocked(ctx.db, ctx.user.id);

    const existing = await ctx.db.query.userAiProviders.findFirst({
      where: eq(userAiProviders.userId, ctx.user.id),
    });

    let apiKey = input.apiKey;
    if (!apiKey) {
      // A stored key is only reused for the provider it was issued by.
      if (!existing || existing.provider !== input.provider) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Paste your API key." });
      }
      apiKey = decryptStoredKey(existing.encryptedKey);
    }

    await testOwnAi({ provider: input.provider, model: input.model, apiKey });

    let encryptedKey: string;
    try {
      encryptedKey = encryptApiKey(apiKey);
    } catch (error) {
      if (error instanceof AiKeyEncryptionConfigError) throw toConfigError(error);
      throw error;
    }

    const now = new Date();
    const values = {
      provider: input.provider,
      model: input.model,
      encryptedKey,
      keyHint: apiKeyHint(apiKey),
      enabled: true,
      lastVerifiedAt: now,
      updatedAt: now,
    };
    await ctx.db
      .insert(userAiProviders)
      .values({ userId: ctx.user.id, createdAt: now, ...values })
      .onConflictDoUpdate({ target: userAiProviders.userId, set: values });

    securityLog("own_ai_saved", {
      userIdHash: hashForLogs(ctx.user.id),
      provider: input.provider,
      model: input.model,
      keyReplaced: !!input.apiKey,
    });

    return getConnectionView(ctx.db, ctx.user.id);
  }),

  /** Re-checks the saved key, e.g. after the user topped up their provider account. */
  test: protectedProcedure.mutation(async ({ ctx }) => {
    await enforceProviderCallRateLimit(ctx, "test");

    const existing = await ctx.db.query.userAiProviders.findFirst({
      where: eq(userAiProviders.userId, ctx.user.id),
    });
    if (!existing) {
      throw new TRPCError({ code: "NOT_FOUND", message: "No AI provider is connected." });
    }

    await testOwnAi({
      provider: existing.provider,
      model: existing.model,
      apiKey: decryptStoredKey(existing.encryptedKey),
    });

    const now = new Date();
    await ctx.db
      .update(userAiProviders)
      .set({ lastVerifiedAt: now, updatedAt: now })
      .where(eq(userAiProviders.userId, ctx.user.id));

    return { lastVerifiedAt: now };
  }),

  /** Switches between the user's own AI and Craftiv credits without deleting the key. */
  setEnabled: protectedProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (input.enabled) await assertUnlocked(ctx.db, ctx.user.id);

      const updated = await ctx.db
        .update(userAiProviders)
        .set({ enabled: input.enabled, updatedAt: new Date() })
        .where(eq(userAiProviders.userId, ctx.user.id))
        .returning({ userId: userAiProviders.userId });
      if (updated.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No AI provider is connected." });
      }

      return getConnectionView(ctx.db, ctx.user.id);
    }),

  remove: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db.delete(userAiProviders).where(eq(userAiProviders.userId, ctx.user.id));
    securityLog("own_ai_removed", { userIdHash: hashForLogs(ctx.user.id) });
    return getConnectionView(ctx.db, ctx.user.id);
  }),
});
