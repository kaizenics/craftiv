import { eq } from "drizzle-orm";

import { db } from "@/db";
import { userAiProviders, users } from "@/db/schema";
import { CRAFTIV_AI, type AiConnection } from "@/lib/ai";
import { decryptApiKey } from "@/lib/ai-key-crypto";
import { AI_PROVIDERS } from "@/lib/ai-providers";
import {
  consumeCredits,
  fromCreditUnits,
  type ConsumeCreditsInput,
  type CreditMutationResult,
} from "@/lib/credits";
import { OwnAiError } from "@/lib/own-ai";
import { hashForLogs, securityLog } from "@/lib/security/logging";

/**
 * Own AI is unlocked by buying any credit pack. A refund that leaves no paid
 * order behind clears `isPaid`, which locks it again -- the same flag the plan
 * badge reads, so the two can never disagree.
 */
export function isOwnAiUnlocked(user: { isPaid: boolean | null } | undefined): boolean {
  return !!user?.isPaid;
}

/**
 * The AI a request for this user should run on.
 *
 * Craftiv's own AI unless the user has a saved, switched-on provider and has
 * unlocked the feature. A saved key that no longer decrypts (the encryption
 * secret was rotated) is an error, not a quiet switch to credits: the user
 * turned this on to stop spending credits, so they must be told rather than
 * charged.
 */
export async function resolveUserAi(userId: string): Promise<AiConnection> {
  const connection = await db.query.userAiProviders.findFirst({
    where: eq(userAiProviders.userId, userId),
  });
  if (!connection?.enabled) return CRAFTIV_AI;

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { isPaid: true },
  });
  if (!isOwnAiUnlocked(user)) return CRAFTIV_AI;

  let apiKey: string;
  try {
    apiKey = decryptApiKey(connection.encryptedKey);
  } catch (error) {
    throw new OwnAiError(
      `Your saved ${AI_PROVIDERS[connection.provider].label} key can no longer be read. Re-enter it in Settings → Integrations, or switch it off to use credits.`,
      error,
    );
  }

  return {
    source: "own",
    provider: connection.provider,
    model: connection.model,
    apiKey,
  };
}

/** The `creditCharge` block AI routes return alongside their result. */
export function describeAiCharge(charge: CreditMutationResult | null) {
  if (!charge) {
    return { ownAi: true, chargedCredits: 0, balanceCredits: null, balanceUnits: null, replayed: false };
  }
  return {
    ownAi: false,
    chargedCredits: fromCreditUnits(-charge.deltaUnits),
    balanceCredits: fromCreditUnits(charge.balanceUnits),
    balanceUnits: charge.balanceUnits,
    replayed: charge.replayed,
  };
}

/**
 * Starts an AI action: picks the AI to run it on, and charges credits only when
 * that is Craftiv's own. `charge` is null for a user's own AI -- callers must
 * treat that as "nothing to refund".
 */
export async function beginAiAction(
  input: ConsumeCreditsInput,
): Promise<{ ai: AiConnection; charge: CreditMutationResult | null }> {
  const ai = await resolveUserAi(input.userId);

  if (ai.source === "own") {
    securityLog("own_ai_used", {
      eventType: input.eventType,
      userIdHash: hashForLogs(input.userId),
      provider: ai.provider,
      model: ai.model,
    });
    return { ai, charge: null };
  }

  const charge = await consumeCredits(input);
  return { ai, charge };
}
