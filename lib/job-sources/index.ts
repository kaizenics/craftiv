import type { JobSourceAdapter } from "./types";
import { manualAdapter } from "./manual";
import { onlineJobsPhAdapter } from "./onlinejobs-ph";
import { remotiveAdapter } from "./remotive";
import { safeParseUrl } from "./normalize";
import type { JobSourceId } from "@/lib/types/job-hunter";

/**
 * The source registry.
 *
 * Adding a source is one entry here plus one file. Nothing else in the pipeline
 * knows a source by name.
 */
const ADAPTERS: Partial<Record<JobSourceId, JobSourceAdapter>> = {
  manual: manualAdapter,
  onlinejobs_ph: onlineJobsPhAdapter,
  remotive: remotiveAdapter,
  // clipper reuses whichever adapter owns the clipped page's host, so it has no
  // adapter of its own -- see resolveAdapterForUrl.
};

export function getAdapter(id: JobSourceId): JobSourceAdapter {
  const adapter = ADAPTERS[id];
  if (!adapter) {
    throw new Error(`Unknown job source: ${id}`);
  }
  return adapter;
}

export function listAdapters(): JobSourceAdapter[] {
  return Object.values(ADAPTERS).filter((a): a is JobSourceAdapter => Boolean(a));
}

/**
 * The only list the scheduler may iterate.
 *
 * This is the enforcement point for the ingestion ladder: a source whose terms
 * forbid automated access reports `pollable: false` and therefore cannot be
 * scheduled, no matter how a hunt is configured. `lib/job-sources/registry.test.ts`
 * asserts OnlineJobs.ph is absent from this list -- do not delete that test, it
 * is what keeps the legal position true as the code grows.
 */
export function pollableSources(): JobSourceAdapter[] {
  return listAdapters().filter((adapter) => adapter.capabilities.pollable);
}

export function isPollableSource(id: JobSourceId): boolean {
  return ADAPTERS[id]?.capabilities.pollable ?? false;
}

/**
 * Routes a pasted URL to whichever adapter claims its host, falling back to the
 * manual adapter.
 *
 * Resolution is by host, not by the caller's claimed source, so a job clipped
 * from OnlineJobs.ph dedupes against the same job pasted as a URL.
 */
export function resolveAdapterForUrl(rawUrl: string | undefined | null): JobSourceAdapter {
  const url = safeParseUrl(rawUrl);
  if (!url) return manualAdapter;

  const owner = listAdapters().find((adapter) => adapter.matchesUrl?.(url));
  return owner ?? manualAdapter;
}

export * from "./types";
export {
  buildSourceKey,
  capDescription,
  hashJobContent,
  hashJobIdentity,
  htmlToPlainText,
  safeParseUrl,
} from "./normalize";
