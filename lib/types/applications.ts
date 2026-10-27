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
// A colour per stage in both themes. Dark mode remaps blues to grey, so Interview uses violet there instead of sky.
export const TRACKER_STATUS_STYLES: Record<TrackerStatus, string> = {
  saved: "bg-muted text-muted-foreground",
  applied: "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200",
  screening: "bg-lime-100 text-lime-900 dark:bg-lime-950/60 dark:text-lime-200",
  interview: "bg-sky-100 text-sky-900 dark:bg-violet-950/60 dark:text-violet-200",
  offer: "bg-success-surface text-success-surface-foreground",
  rejected: "bg-destructive-surface text-destructive-surface-foreground",
  ghosted: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-200",
  dropped: "bg-zinc-200 text-zinc-700 dark:bg-foreground/10 dark:text-muted-foreground",
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

/** One column change on a card; `at` is epoch milliseconds. */
export type StatusEntry = { status: TrackerStatus; at: number };

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

