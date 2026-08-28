import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { creditEvents, users } from "@/db/schema";
import { isUniqueConstraintError } from "@/lib/db-errors";
import {
  AI_ACHIEVEMENT_BUILDER_COST,
  AI_COVER_LETTER_COST,
  AI_KEYWORD_BOOSTER_COST,
  AI_RESUME_IMPROVER_COST,
  AI_SPELL_CHECK_COST,
  AI_SUGGESTION_COST,
  ATS_CHECK_COST,
  CHATBOT_STREAM_COST,
  COVER_LETTER_AI_SESSION_COST,
  JOB_TAILOR_COST,
  RESUME_LAYOUT_CHAT_COST,
  RESUME_PARSE_COST,
  fromCreditUnits,
} from "@/lib/credit-costs";

// Costs and conversions live in a module free of server-only imports, so the
// settings UI can price actions from the same numbers the API charges with.
export {
  AI_ACHIEVEMENT_BUILDER_COST,
  AI_COVER_LETTER_COST,
  AI_KEYWORD_BOOSTER_COST,
  AI_RESUME_IMPROVER_COST,
  AI_SPELL_CHECK_COST,
  AI_SUGGESTION_COST,
  ATS_CHECK_COST,
  CHATBOT_STREAM_COST,
  COVER_LETTER_AI_SESSION_COST,
  CREDIT_UNITS_PER_CREDIT,
  JOB_TAILOR_COST,
  RESUME_LAYOUT_CHAT_COST,
  RESUME_PARSE_COST,
  formatCreditValue,
  fromCreditUnits,
  toCreditUnits,
} from "@/lib/credit-costs";

export const SERVER_CREDIT_COSTS = {
  ats_check: ATS_CHECK_COST,
  cover_letter_ai_session: COVER_LETTER_AI_SESSION_COST,
  resume_parse: RESUME_PARSE_COST,
  resume_layout_chat: RESUME_LAYOUT_CHAT_COST,
  chatbot_stream: CHATBOT_STREAM_COST,
  ai_resume_improver: AI_RESUME_IMPROVER_COST,
  ai_keyword_booster: AI_KEYWORD_BOOSTER_COST,
  ai_achievement_builder: AI_ACHIEVEMENT_BUILDER_COST,
  ai_spell_check: AI_SPELL_CHECK_COST,
  ai_suggestion: AI_SUGGESTION_COST,
  ai_cover_letter: AI_COVER_LETTER_COST,
  job_tailor: JOB_TAILOR_COST,
} as const;

export type ServerCreditEventType = keyof typeof SERVER_CREDIT_COSTS;

/**
 * Mints the idempotency key for a fresh credit charge.
 *
 * Always call this rather than assembling a key from request input. consumeCredits
 * treats a repeated key as an already-settled charge and skips the deduction, so a
 * key the caller can choose is a caller-chosen "don't charge me" — replay one value
 * and every subsequent call is free while the work still runs. Client-supplied
 * request IDs are for log correlation and belong in metadata, not here.
 *
 * The one legitimate exception is a charge that is deliberately not per-request —
 * the cover-letter day session, whose key is derived from server-owned values
 * (an ownership-checked letter ID and a server clock bucket).
 */
export function newChargeIdempotencyKey(eventType: string, userId: string): string {
  return `${eventType}:${userId}:${randomUUID()}`;
}

export class InsufficientCreditsError extends Error {
  code = "INSUFFICIENT_CREDITS" as const;
  requiredUnits: number;
  currentUnits: number;

  constructor(requiredUnits: number, currentUnits: number) {
    super("You do not have enough credits for this action.");
    this.requiredUnits = requiredUnits;
    this.currentUnits = currentUnits;
  }
}

type CreditEventMetadata = Record<string, unknown> | null | undefined;

type ConsumeCreditsInput = {
  userId: string;
  eventType: string;
  costUnits: number;
  idempotencyKey: string;
  metadata?: CreditEventMetadata;
};

type AddCreditsInput = {
  userId: string;
  eventType: string;
  addUnits: number;
  idempotencyKey: string;
  metadata?: CreditEventMetadata;
};

type DeductWithFloorInput = {
  userId: string;
  eventType: string;
  maxUnitsToDeduct: number;
  idempotencyKey: string;
  metadata?: CreditEventMetadata;
};

type CreditMutationResult = {
  replayed: boolean;
  balanceUnits: number;
  deltaUnits: number;
};

function asSafeMetadata(metadata?: CreditEventMetadata): Record<string, unknown> | null {
  if (!metadata) return null;
  return metadata;
}

async function getReplayByIdempotencyKey(idempotencyKey: string): Promise<CreditMutationResult | null> {
  const existing = await db.query.creditEvents.findFirst({
    where: eq(creditEvents.idempotencyKey, idempotencyKey),
    columns: {
      deltaUnits: true,
      balanceAfterUnits: true,
    },
  });

  if (!existing) return null;
  return {
    replayed: true,
    balanceUnits: existing.balanceAfterUnits,
    deltaUnits: existing.deltaUnits,
  };
}

export function buildInsufficientCreditsPayload(error: InsufficientCreditsError) {
  return {
    code: error.code,
    message: error.message,
    requiredCredits: fromCreditUnits(error.requiredUnits),
    currentBalance: fromCreditUnits(error.currentUnits),
  };
}

export async function consumeCredits(input: ConsumeCreditsInput): Promise<CreditMutationResult> {
  const costUnits = Math.trunc(input.costUnits);
  if (costUnits <= 0) {
    throw new Error("costUnits must be greater than zero.");
  }

  try {
    return await db.transaction(async (tx) => {
      const replay = await tx.query.creditEvents.findFirst({
        where: eq(creditEvents.idempotencyKey, input.idempotencyKey),
        columns: {
          deltaUnits: true,
          balanceAfterUnits: true,
        },
      });
      if (replay) {
        return {
          replayed: true,
          balanceUnits: replay.balanceAfterUnits,
          deltaUnits: replay.deltaUnits,
        };
      }

      const user = await tx.query.users.findFirst({
        where: eq(users.id, input.userId),
        columns: {
          creditBalance: true,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      const currentUnits = user.creditBalance ?? 0;
      if (currentUnits < costUnits) {
        throw new InsufficientCreditsError(costUnits, currentUnits);
      }

      const nextUnits = currentUnits - costUnits;

      await tx
        .update(users)
        .set({ creditBalance: nextUnits, updatedAt: new Date() })
        .where(eq(users.id, input.userId));

      await tx.insert(creditEvents).values({
        id: randomUUID(),
        userId: input.userId,
        eventType: input.eventType,
        deltaUnits: -costUnits,
        balanceAfterUnits: nextUnits,
        idempotencyKey: input.idempotencyKey,
        metadataJson: asSafeMetadata(input.metadata),
        createdAt: new Date(),
      });

      return {
        replayed: false,
        balanceUnits: nextUnits,
        deltaUnits: -costUnits,
      };
    });
  } catch (error) {
    if (error instanceof InsufficientCreditsError) throw error;
    if (isUniqueConstraintError(error)) {
      const replay = await getReplayByIdempotencyKey(input.idempotencyKey);
      if (replay) return replay;
    }
    throw error;
  }
}

export async function addCredits(input: AddCreditsInput): Promise<CreditMutationResult> {
  const addUnits = Math.trunc(input.addUnits);
  if (addUnits <= 0) {
    throw new Error("addUnits must be greater than zero.");
  }

  try {
    return await db.transaction(async (tx) => {
      const replay = await tx.query.creditEvents.findFirst({
        where: eq(creditEvents.idempotencyKey, input.idempotencyKey),
        columns: {
          deltaUnits: true,
          balanceAfterUnits: true,
        },
      });
      if (replay) {
        return {
          replayed: true,
          balanceUnits: replay.balanceAfterUnits,
          deltaUnits: replay.deltaUnits,
        };
      }

      const user = await tx.query.users.findFirst({
        where: eq(users.id, input.userId),
        columns: {
          creditBalance: true,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      const currentUnits = user.creditBalance ?? 0;
      const nextUnits = currentUnits + addUnits;

      await tx
        .update(users)
        .set({ creditBalance: nextUnits, updatedAt: new Date() })
        .where(eq(users.id, input.userId));

      await tx.insert(creditEvents).values({
        id: randomUUID(),
        userId: input.userId,
        eventType: input.eventType,
        deltaUnits: addUnits,
        balanceAfterUnits: nextUnits,
        idempotencyKey: input.idempotencyKey,
        metadataJson: asSafeMetadata(input.metadata),
        createdAt: new Date(),
      });

      return {
        replayed: false,
        balanceUnits: nextUnits,
        deltaUnits: addUnits,
      };
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const replay = await getReplayByIdempotencyKey(input.idempotencyKey);
      if (replay) return replay;
    }
    throw error;
  }
}

export async function deductCreditsWithFloor(input: DeductWithFloorInput): Promise<CreditMutationResult> {
  const maxUnitsToDeduct = Math.max(0, Math.trunc(input.maxUnitsToDeduct));
  if (maxUnitsToDeduct <= 0) {
    throw new Error("maxUnitsToDeduct must be greater than zero.");
  }

  try {
    return await db.transaction(async (tx) => {
      const replay = await tx.query.creditEvents.findFirst({
        where: eq(creditEvents.idempotencyKey, input.idempotencyKey),
        columns: {
          deltaUnits: true,
          balanceAfterUnits: true,
        },
      });
      if (replay) {
        return {
          replayed: true,
          balanceUnits: replay.balanceAfterUnits,
          deltaUnits: replay.deltaUnits,
        };
      }

      const user = await tx.query.users.findFirst({
        where: eq(users.id, input.userId),
        columns: {
          creditBalance: true,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      const currentUnits = user.creditBalance ?? 0;
      const deductedUnits = Math.min(currentUnits, maxUnitsToDeduct);
      const nextUnits = currentUnits - deductedUnits;

      await tx
        .update(users)
        .set({ creditBalance: nextUnits, updatedAt: new Date() })
        .where(eq(users.id, input.userId));

      await tx.insert(creditEvents).values({
        id: randomUUID(),
        userId: input.userId,
        eventType: input.eventType,
        deltaUnits: -deductedUnits,
        balanceAfterUnits: nextUnits,
        idempotencyKey: input.idempotencyKey,
        metadataJson: asSafeMetadata(input.metadata),
        createdAt: new Date(),
      });

      return {
        replayed: false,
        balanceUnits: nextUnits,
        deltaUnits: -deductedUnits,
      };
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const replay = await getReplayByIdempotencyKey(input.idempotencyKey);
      if (replay) return replay;
    }
    throw error;
  }
}

export async function refundCredits(input: {
  userId: string;
  eventType: string;
  refundUnits: number;
  idempotencyKey: string;
  metadata?: CreditEventMetadata;
}) {
  return addCredits({
    userId: input.userId,
    eventType: input.eventType,
    addUnits: Math.max(0, Math.trunc(input.refundUnits)),
    idempotencyKey: input.idempotencyKey,
    metadata: input.metadata,
  });
}
