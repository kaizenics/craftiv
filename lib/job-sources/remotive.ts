import { z } from "zod";

import type { JobSearchQuery, JobSourceAdapter, NormalizedJob, UserJobInput } from "./types";
import { JobSourceError } from "./types";
import { buildSourceKey, capDescription, htmlToPlainText } from "./normalize";
import type { JobProvenance } from "@/lib/types/job-hunter";

/**
 * Remotive: worldwide remote roles, no API key, keyless in dev and CI.
 *
 * Their free tier asks for at most a handful of requests per day across the
 * whole deployment -- not per user -- and requires attribution with a link back
 * to the Remotive listing. Both shape the design:
 *
 *   - The daily budget is global, so postings are fetched once by a scheduled
 *     sync and then materialised per user. Per-user fetching would blow the
 *     allowance with a dozen users.
 *   - `attribution` is surfaced through the adapter capability and rendered on
 *     every card, and `url` always points back at the Remotive listing.
 */

const ENDPOINT = "https://remotive.com/api/remote-jobs";
const REQUEST_TIMEOUT_MS = 12_000;

/**
 * Deliberately lenient: unknown keys are ignored and a row that fails is
 * dropped rather than failing the run. A third-party feed changing shape must
 * degrade to "fewer jobs", never to a 500 inside a cron tick.
 */
const remotiveJobSchema = z.object({
  id: z.union([z.number(), z.string()]),
  url: z.string().optional(),
  title: z.string(),
  company_name: z.string().optional(),
  category: z.string().optional(),
  job_type: z.string().optional(),
  publication_date: z.string().optional(),
  candidate_required_location: z.string().optional(),
  salary: z.string().optional(),
  description: z.string().optional(),
});

const remotiveResponseSchema = z.object({
  jobs: z.array(z.unknown()).default([]),
});

function toNormalizedJob(raw: unknown): NormalizedJob | null {
  const parsed = remotiveJobSchema.safeParse(raw);
  if (!parsed.success) return null;

  const job = parsed.data;
  const externalId = String(job.id);
  const { description, descriptionTruncated } = capDescription(
    htmlToPlainText(job.description ?? ""),
  );

  const posted = job.publication_date ? new Date(job.publication_date) : null;

  return {
    source: "remotive",
    externalId,
    sourceKey: buildSourceKey("remotive", externalId),
    provenance: "feed",
    title: job.title.trim(),
    company: job.company_name?.trim() ?? "",
    location: job.candidate_required_location?.trim() ?? "",
    employmentType: job.job_type?.trim() ?? "",
    salaryText: job.salary?.trim() ?? "",
    url: job.url ?? "",
    applyUrl: job.url ?? "",
    description,
    descriptionTruncated,
    postedAt: posted && !Number.isNaN(posted.getTime()) ? posted : null,
    raw: null,
  };
}

/** Exported for tests: the pure parse step, with no network involved. */
export function parseRemotiveResponse(body: unknown): NormalizedJob[] {
  const parsed = remotiveResponseSchema.safeParse(body);
  if (!parsed.success) return [];

  return parsed.data.jobs
    .map(toNormalizedJob)
    .filter((job): job is NormalizedJob => job !== null && job.description.length > 0);
}

export const remotiveAdapter: JobSourceAdapter = {
  id: "remotive",
  label: "Remotive",

  capabilities: {
    pollable: true,
    identifiableFromUrl: false,
    fetchableOnDemand: false,
    crawlDelaySeconds: 1,
    // Contractual, not decorative. Rendered on every card from this source.
    attribution: "Job data by Remotive",
    restrictionNote: null,
  },

  async search(query: JobSearchQuery, signal: AbortSignal): Promise<NormalizedJob[]> {
    const url = new URL(ENDPOINT);
    if (query.query.trim()) url.searchParams.set("search", query.query.trim());
    url.searchParams.set("limit", String(Math.min(Math.max(query.limit, 1), 50)));

    const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
    const combined = AbortSignal.any([signal, timeout]);

    let response: Response;
    try {
      response = await fetch(url, {
        signal: combined,
        headers: { Accept: "application/json", "User-Agent": "Craftiv/1.0 (+https://craftiv.app)" },
      });
    } catch (error) {
      throw new JobSourceError(
        "remotive",
        "TRANSIENT",
        `Remotive request failed: ${error instanceof Error ? error.message : "unknown"}`,
      );
    }

    if (response.status === 429) {
      throw new JobSourceError("remotive", "RATE_LIMITED", "Remotive rate limit reached.");
    }
    if (!response.ok) {
      throw new JobSourceError("remotive", "TRANSIENT", `Remotive returned ${response.status}.`);
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      // A malformed payload is "no jobs this run", not a crashed run.
      return [];
    }

    return parseRemotiveResponse(body).slice(0, query.limit);
  },

  fromUserInput(input: UserJobInput, provenance: JobProvenance): NormalizedJob {
    // Remotive postings normally arrive through search; this exists so the
    // adapter satisfies the same interface as every other source.
    const { description, descriptionTruncated } = capDescription(input.description ?? "");
    const externalId = input.url ?? String(Date.now());

    return {
      source: "remotive",
      externalId,
      sourceKey: buildSourceKey("remotive", externalId),
      provenance,
      title: input.title?.trim() || "Untitled role",
      company: input.company?.trim() ?? "",
      location: input.location?.trim() ?? "",
      employmentType: "",
      salaryText: "",
      url: input.url ?? "",
      applyUrl: input.url ?? "",
      description,
      descriptionTruncated,
      postedAt: null,
      raw: null,
    };
  },
};
