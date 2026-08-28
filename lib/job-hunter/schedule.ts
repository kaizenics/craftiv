/**
 * Scheduling maths for hunt runs.
 *
 * Pure and UTC-only. Every value stored on a hunt is UTC (`runAtMinuteUtc` is
 * minutes past UTC midnight), because a timezone column invites arithmetic that
 * is right in July and wrong in October.
 */

export type HuntFrequency = "daily" | "weekly" | "manual";

/** How long a claimed run may go unfinished before another tick may retake it. */
export const RUN_LEASE_MS = 10 * 60_000;

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0),
  );
}

/** ISO-8601 week key, e.g. "2026-W35". Used to bucket weekly runs. */
export function isoWeekKey(date: Date): string {
  // Shift to the Thursday of this ISO week, which always sits in the ISO year.
  const target = startOfUtcDay(date);
  const day = (target.getUTCDay() + 6) % 7; // Monday = 0
  target.setUTCDate(target.getUTCDate() - day + 3);

  const isoYear = target.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(isoYear, 0, 4));
  const firstDay = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDay + 3);

  const week = 1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * 86_400_000));
  return `${isoYear}-W${String(week).padStart(2, "0")}`;
}

/**
 * The idempotency bucket for a scheduled run.
 *
 * Server-derived only, and never built from request input -- the same rule
 * newChargeIdempotencyKey states for charge keys. Two cron ticks landing in the
 * same bucket produce the same key, and the unique index on
 * (hunt_id, run_key) means exactly one of them claims the work.
 *
 * A manual run gets its own key so it can never collide with the schedule.
 */
export function runKeyFor(frequency: HuntFrequency, now: Date): string {
  if (frequency === "weekly") return `w:${isoWeekKey(now)}`;
  // Hour granularity: a hunt is due at a specific minute, so two ticks inside
  // the same hour must not both run it.
  return `h:${now.toISOString().slice(0, 13)}`;
}

export function manualRunKey(uuid: string): string {
  return `m:${uuid}`;
}

/**
 * The next time a hunt should run after `from`.
 *
 * Always schedules forward. A hunt that was paused for a month must not fire
 * thirty times catching up -- the user wants today's jobs, not a backlog of
 * every slot that elapsed while they were away.
 */
export function computeNextRunAt(params: {
  frequency: HuntFrequency;
  runAtMinuteUtc: number;
  weekday?: number | null;
  from: Date;
}): Date | null {
  if (params.frequency === "manual") return null;

  const minute = Math.max(0, Math.min(1439, Math.floor(params.runAtMinuteUtc)));
  const candidate = startOfUtcDay(params.from);
  candidate.setUTCMinutes(minute);

  if (params.frequency === "daily") {
    if (candidate.getTime() <= params.from.getTime()) {
      candidate.setUTCDate(candidate.getUTCDate() + 1);
    }
    return candidate;
  }

  // Weekly: 0 = Sunday, matching Date.getUTCDay().
  const targetDay = ((params.weekday ?? 1) % 7 + 7) % 7;
  let delta = (targetDay - candidate.getUTCDay() + 7) % 7;
  if (delta === 0 && candidate.getTime() <= params.from.getTime()) delta = 7;
  candidate.setUTCDate(candidate.getUTCDate() + delta);

  return candidate;
}

/** True when a hunt is due, tolerating a scheduler that fires slightly late. */
export function isDue(nextRunAt: Date | null | undefined, now: Date): boolean {
  if (!nextRunAt) return false;
  return nextRunAt.getTime() <= now.getTime();
}
