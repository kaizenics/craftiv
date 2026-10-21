import type { ApplicationStatus } from "@/lib/types/job-hunter";

/**
 * The stages of a tracked application, in board order. Mirrors the columns job
 * seekers already use in spreadsheet trackers.
 */
export const TRACKER_STATUSES = ["saved", "applied", "screening", "interview", "offer", "rejected", "ghosted", "dropped"] as const;
export type TrackerStatus = (typeof TRACKER_STATUSES)[number];

export const TRACKER_STATUS_LABELS: Record<TrackerStatus, string> = {
  saved: "Saved",
  applied: "Applied",
  screening: "Recruiter screen",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  ghosted: "Ghosted",
  dropped: "Dropped",
};

/** Soft fills only (no tinted borders), so each stage reads at a glance. */
export const TRACKER_STATUS_STYLES: Record<TrackerStatus, string> = {
  saved: "bg-muted text-muted-foreground",
  applied: "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200",
  screening: "bg-lime-100 text-lime-900 dark:bg-lime-950/50 dark:text-lime-200",
  interview: "bg-sky-100 text-sky-900 dark:bg-sky-950/50 dark:text-sky-200",
  offer: "bg-success-surface text-success-surface-foreground",
  rejected: "bg-destructive-surface text-destructive-surface-foreground",
  ghosted: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200",
  dropped: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

export const TRACKER_LIMITS = {
  text: 200,
  url: 2048,
  notes: 4000,
  customFields: 12,
  customLabel: 60,
  customValue: 500,
} as const;

export type CustomField = { label: string; value: string };

/** Job Hunter stages mapped onto the tracker's columns. */
export const TRACKER_STATUS_FROM_MATCH: Record<ApplicationStatus, TrackerStatus> = {
  new: "saved",
  saved: "saved",
  applied: "applied",
  interviewing: "interview",
  offer: "offer",
  rejected: "rejected",
  dismissed: "dropped",
};

/**
 * Sort key for a card dropped between two neighbours, so only the moved card is written.
 * shortcut: about 50 drops into the same gap exhaust float precision and the two cards tie (then createdAt orders them); renumber the column if that ever shows up.
 */
export function positionBetween(before?: number, after?: number) {
  if (before === undefined) return after === undefined ? 1 : after - 1;
  return after === undefined ? before + 1 : (before + after) / 2;
}
