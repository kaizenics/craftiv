import type { JobProvenance, JobSourceId } from "@/lib/types/job-hunter";

/**
 * The single normalized shape every source produces. Maps onto `job_postings`.
 */
export type NormalizedJob = {
  source: JobSourceId;
  externalId: string;
  /** The dedupe unit, `${source}:${externalId}`. Built by buildSourceKey(). */
  sourceKey: string;
  provenance: JobProvenance;
  title: string;
  company: string;
  location: string;
  employmentType: string;
  salaryText: string;
  /** Free text, e.g. "40" or "20-30". Sources state this inconsistently. */
  hoursPerWeek: string;
  url: string;
  applyUrl: string;
  /** Plain text, already sanitized and capped. */
  description: string;
  descriptionTruncated: boolean;
  postedAt: Date | null;
  raw: Record<string, unknown> | null;
};

export type JobSearchQuery = {
  query: string;
  location: string;
  /** The adapter must not exceed this. Enforced by the caller too. */
  limit: number;
  postedAfter?: Date;
};

/**
 * What a source is allowed to do.
 *
 * This is the ingestion ladder encoded in types. `pollable` is the field the
 * scheduler reads, and it is why a source whose terms forbid automated access
 * cannot be scheduled no matter how a hunt is configured.
 */
export type JobSourceCapabilities = {
  /** May the scheduler call search() unattended? */
  pollable: boolean;
  /** Can a stable id be derived from a URL with no network call? */
  identifiableFromUrl: boolean;
  /** May the server fetch one user-pasted page? Gated by env for grey sources. */
  fetchableOnDemand: boolean;
  /** Seconds between any two outbound requests to this host. */
  crawlDelaySeconds: number;
  /** Rendered next to every job from this source. Some feeds require it. */
  attribution: string | null;
  /** Non-null = why this source is not pollable. Shown in the hunt editor. */
  restrictionNote: string | null;
};

/** What the user (or the clipper) supplied. */
export type UserJobInput = {
  url?: string;
  description?: string;
  /** When supplied, no LLM parse is needed -- so the import is free. */
  title?: string;
  company?: string;
  location?: string;
};

export type UrlIdentity = {
  externalId: string;
  sourceKey: string;
  /** Derived from the URL slug, so a URL-only paste still names the job. */
  titleHint: string;
};

export type JobSourceAdapter = {
  readonly id: JobSourceId;
  readonly label: string;
  readonly capabilities: JobSourceCapabilities;

  /** Scheduled or manual search. Only present when capabilities.pollable. */
  search?(query: JobSearchQuery, signal: AbortSignal): Promise<NormalizedJob[]>;

  /** Does this URL belong to this source? */
  matchesUrl?(url: URL): boolean;

  /**
   * Parse identity from a URL with NO network call. This is what lets a source
   * that must not be crawled still be deduped and deep-linked.
   */
  identityFromUrl?(url: URL): UrlIdentity | null;

  /** Turn user-supplied text into a job. */
  fromUserInput?(input: UserJobInput, provenance: JobProvenance): NormalizedJob;
};

export type JobSourceErrorCode = "RATE_LIMITED" | "AUTH" | "TRANSIENT" | "PERMANENT";

export class JobSourceError extends Error {
  code: JobSourceErrorCode;
  source: JobSourceId;

  constructor(source: JobSourceId, code: JobSourceErrorCode, message: string) {
    super(message);
    this.name = "JobSourceError";
    this.source = source;
    this.code = code;
  }
}
