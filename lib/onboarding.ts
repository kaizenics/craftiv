import { z } from "zod";

/**
 * One key per guided tour. Stored on the account as a JSON array of the tours
 * a person has finished or skipped, so each area can introduce itself once
 * without the others being suppressed along with it.
 */
export const ONBOARDING_TOUR_KEYS = [
  "dashboard",
  "documents",
  "job-hunter",
  "ats-checker",
  "ai-assistant",
] as const;

export type OnboardingTourKey = (typeof ONBOARDING_TOUR_KEYS)[number];

export const onboardingTourKeySchema = z.enum(ONBOARDING_TOUR_KEYS);

/**
 * Reads the stored column defensively. A tour that fails to show is a small
 * loss; a dashboard that fails to render because a JSON column was hand-edited
 * is not, so anything unparseable is treated as "nothing completed yet".
 * Unrecognised keys are dropped so a removed tour cannot linger forever.
 */
export function parseCompletedTours(raw: string | null | undefined): OnboardingTourKey[] {
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is OnboardingTourKey =>
      ONBOARDING_TOUR_KEYS.includes(value as OnboardingTourKey),
    );
  } catch {
    return [];
  }
}

export function serializeCompletedTours(keys: Iterable<OnboardingTourKey>): string {
  return JSON.stringify([...new Set(keys)]);
}
