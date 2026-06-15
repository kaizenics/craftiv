/**
 * Fixed-window rate-limit configuration.
 *
 * Every request is subject to the global limits. Heavier request categories add
 * the scoped limits on top (per-IP, per-user, and a combined per-IP+user window).
 * Centralized here so the numbers are reviewable in one place.
 */

export const MINUTE_SECONDS = 60;
export const DAY_SECONDS = 24 * 60 * 60;

/** Baseline limits applied to every request regardless of category. */
export const GLOBAL_RATE_LIMITS = {
  ipPerMinute: 120,
  userPerMinute: 60,
} as const;

export interface ScopedRateLimits {
  ipPerMinute: number;
  ipPerDay: number;
  userPerMinute: number;
  userPerDay: number;
  ipUserPerMinute: number;
}

/** Categories that add stricter limits on top of the global baseline. */
export type ScopedRateLimitCategory = "ai_heavy" | "pdf_export" | "auth_sensitive";

export const SCOPED_RATE_LIMITS: Record<ScopedRateLimitCategory, ScopedRateLimits> = {
  ai_heavy: { ipPerMinute: 30, ipPerDay: 600, userPerMinute: 10, userPerDay: 200, ipUserPerMinute: 12 },
  pdf_export: { ipPerMinute: 15, ipPerDay: 100, userPerMinute: 6, userPerDay: 40, ipUserPerMinute: 7 },
  auth_sensitive: { ipPerMinute: 12, ipPerDay: 120, userPerMinute: 8, userPerDay: 80, ipUserPerMinute: 8 },
};
