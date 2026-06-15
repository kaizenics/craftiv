import { eq } from "drizzle-orm";

import { db } from "@/db";
import { rateLimits } from "@/db/schema";
import { isMissingTableError, isUniqueConstraintError } from "@/lib/db-errors";

export type RateLimitScope =
  | "global_api"
  | "ai_heavy"
  | "pdf_export"
  | "auth_sensitive";
export type RateLimitSubjectType = "ip" | "user" | "ip_user";
export type RateLimitWindowName = "minutely" | "daily";

export interface RateLimitRule {
  scope: RateLimitScope;
  route: string;
  subjectType: RateLimitSubjectType;
  subjectId: string;
  windowName: RateLimitWindowName;
  windowSizeSeconds: number;
  limit: number;
}

export interface RateLimitDecision {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  resetAtMs: number;
  count: number;
  limit: number;
}

function buildRateLimitKey(rule: RateLimitRule) {
  return [
    rule.scope,
    rule.route,
    rule.subjectType,
    rule.subjectId,
    rule.windowName,
    String(rule.windowSizeSeconds),
  ].join(":");
}

export function evaluateFixedWindow(params: {
  nowMs: number;
  currentCount: number;
  windowStartMs: number;
  windowSizeSeconds: number;
  limit: number;
}) {
  const windowMs = params.windowSizeSeconds * 1000;
  const expired = params.nowMs >= params.windowStartMs + windowMs;
  const effectiveStart = expired ? params.nowMs : params.windowStartMs;
  const effectiveCount = expired ? 0 : params.currentCount;
  const nextCount = effectiveCount + 1;
  const allowed = nextCount <= params.limit;
  const resetAtMs = effectiveStart + windowMs;
  const retryAfterSeconds = allowed ? 0 : Math.max(1, Math.ceil((resetAtMs - params.nowMs) / 1000));

  return {
    allowed,
    nextCount,
    effectiveStart,
    resetAtMs,
    retryAfterSeconds,
    remaining: Math.max(0, params.limit - nextCount),
  };
}

async function consumeRuleInternal(rule: RateLimitRule, nowMs: number): Promise<RateLimitDecision> {
  const key = buildRateLimitKey(rule);
  const now = new Date(nowMs);

  return db.transaction(async (tx) => {
    const existing = await tx.query.rateLimits.findFirst({
      where: eq(rateLimits.key, key),
      columns: {
        key: true,
        count: true,
        windowStartMs: true,
      },
    });

    if (!existing) {
      await tx.insert(rateLimits).values({
        key,
        scope: rule.scope,
        route: rule.route,
        subjectType: rule.subjectType,
        subjectId: rule.subjectId,
        windowName: rule.windowName,
        windowSizeSeconds: rule.windowSizeSeconds,
        windowStartMs: nowMs,
        count: 1,
        createdAt: now,
        updatedAt: now,
      });

      const resetAtMs = nowMs + rule.windowSizeSeconds * 1000;
      return {
        allowed: true,
        remaining: Math.max(0, rule.limit - 1),
        retryAfterSeconds: 0,
        resetAtMs,
        count: 1,
        limit: rule.limit,
      };
    }

    const evaluation = evaluateFixedWindow({
      nowMs,
      currentCount: existing.count,
      windowStartMs: existing.windowStartMs,
      windowSizeSeconds: rule.windowSizeSeconds,
      limit: rule.limit,
    });

    if (evaluation.allowed) {
      await tx
        .update(rateLimits)
        .set({
          count: evaluation.nextCount,
          windowStartMs: evaluation.effectiveStart,
          updatedAt: now,
        })
        .where(eq(rateLimits.key, key));
    }

    return {
      allowed: evaluation.allowed,
      remaining: evaluation.remaining,
      retryAfterSeconds: evaluation.retryAfterSeconds,
      resetAtMs: evaluation.resetAtMs,
      count: evaluation.nextCount,
      limit: rule.limit,
    };
  });
}

export async function consumeRateLimitRule(rule: RateLimitRule): Promise<RateLimitDecision> {
  const nowMs = Date.now();
  try {
    return await consumeRuleInternal(rule, nowMs);
  } catch (error) {
    if (isMissingTableError(error, "rate_limits")) {
      // Fail open during bootstrap/migration windows to avoid taking down auth/API.
      return {
        allowed: true,
        remaining: Math.max(0, rule.limit - 1),
        retryAfterSeconds: 0,
        resetAtMs: nowMs + rule.windowSizeSeconds * 1000,
        count: 1,
        limit: rule.limit,
      };
    }
    if (isUniqueConstraintError(error)) {
      return consumeRuleInternal(rule, nowMs);
    }
    throw error;
  }
}
