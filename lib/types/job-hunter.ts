/**
 * Job Hunter shared types.
 *
 * Client-safe: no server-only imports, so the dashboard can price actions and
 * render status labels from the same constants the server writes.
 */

/**
 * Registered job sources.
 *
 * `onlinejobs_ph` is present but deliberately not pollable -- see
 * lib/job-sources/onlinejobs-ph.ts for why. The registry's `pollableSources()`
 * is the enforcement point.
 */
export const JOB_SOURCE_IDS = ["manual", "clipper", "onlinejobs_ph", "remotive"] as const;
export type JobSourceId = (typeof JOB_SOURCE_IDS)[number];

/** How a posting was acquired. Determines what Craftiv may legally do with it. */
export const JOB_PROVENANCES = ["paste", "url_import", "clipper", "feed"] as const;
export type JobProvenance = (typeof JOB_PROVENANCES)[number];

/**
 * Machine-owned lifecycle. Written by the import path and by background runs.
 *
 * Kept separate from `applicationStatus` because the two change for entirely
 * independent reasons. Conflating them means the first background re-score that
 * touches a match the user marked "interviewing" either clobbers that or needs a
 * special case -- and special cases in a state machine multiply.
 */
export const PIPELINE_STATUSES = ["scored", "tailoring", "tailored", "stale", "failed"] as const;
export type PipelineStatus = (typeof PIPELINE_STATUSES)[number];

/** User-owned lifecycle. Only ever written in response to a user action. */
export const APPLICATION_STATUSES = [
  "new",
  "saved",
  "applied",
  "interviewing",
  "offer",
  "rejected",
  "dismissed",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  new: "New",
  saved: "Saved",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
  dismissed: "Dismissed",
};

/** The pipeline columns, in the order a user moves through them. */
export const APPLICATION_PIPELINE_ORDER: ApplicationStatus[] = [
  "new",
  "saved",
  "applied",
  "interviewing",
  "offer",
  "rejected",
];

export type HuntFilters = {
  minScore: number;
  keywords: string[];
};

export const DEFAULT_HUNT_FILTERS: HuntFilters = {
  minScore: 0,
  keywords: [],
};

/**
 * The superset of `SharedJobTargetDraft` (lib/job-target.ts).
 *
 * That draft is a localStorage clipboard shared by the ATS checker, the AI
 * assistant and the resume editor's Job Target tab. It stays exactly as it is;
 * this is the durable server-side record that supersedes it additively. Its
 * first two fields are structurally identical, which is what lets the two
 * adapters below be lossless in the direction that matters.
 */
export type JobTargetSpec = {
  role: string;
  jobDescription: string;
  keywords: string[];
  locations: string[];
  remoteOnly: boolean;
};

export const EMPTY_JOB_TARGET_SPEC: JobTargetSpec = {
  role: "",
  jobDescription: "",
  keywords: [],
  locations: [],
  remoteOnly: false,
};

/** Posting age, in days, past which the staleness sweep archives a match. */
export const STALE_POSTING_DAYS = 45;
