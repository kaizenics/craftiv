import type {
  JobSearchQuery,
  JobSourceAdapter,
  JobSourceCapabilities,
  NormalizedJob,
  UrlIdentity,
  UserJobInput,
} from "./types";
import { JobSourceError } from "./types";
import { politeFetchText } from "./http";
import { buildSearchUrl, parseJobDetail, parseSearchResults } from "./onlinejobs-ph-parse";
import {
  buildSourceKey,
  capDescription,
  guessCompanyFromText,
  guessTitleFromText,
  hashJobIdentity,
} from "./normalize";
import type { JobProvenance } from "@/lib/types/job-hunter";

/**
 * OnlineJobs.ph.
 *
 * There is no public API, no RSS feed and no partner XML feed. Their Terms of
 * Use section 7.4 states: "You are only permitted to use the Service personally
 * and agree to do so without the use of any automated means including but not
 * limited to the use of robotic tools except where permission has been expressly
 * granted by OnlineJobs." Section 7.1 limits use to "your own internal business
 * purposes", and 7.3 forbids making the Service available to third parties or
 * accessing it to "build a competitive product or service".
 *
 * Craftiv is a paid third-party product, so server-side crawling is a terms
 * violation and a real business risk (IP ban, cease and desist) regardless of
 * what robots.txt does or does not disallow -- robots.txt is not a licence.
 *
 * DEFAULT BEHAVIOUR IS IDENTITY-ONLY: parse identity out of a URL the user
 * pasted, with no request at all. That is enough to dedupe the posting, deep-link
 * back to it, and attribute the source; the job text comes from the user. This
 * needs no permission from anyone.
 *
 * SCRAPING is opt-in via ONLINEJOBS_SCRAPE_ENABLED and off unless set. It was
 * added at the product owner's explicit direction after the above was put to
 * them twice. Whoever sets that variable is accepting the terms risk on behalf
 * of the business; it is not a default and must not become one.
 *
 * When enabled the crawler identifies itself honestly (lib/job-sources/http.ts),
 * honours the Crawl-delay: 5 from their robots.txt, reads only public pages,
 * never authenticates, bounds itself to a couple of pages per search, and treats
 * 403 or 429 as a stop signal rather than an obstacle. There is deliberately no
 * proxy rotation, fingerprint spoofing or CAPTCHA handling: if the site has to
 * be tricked into answering, the right move is to stop asking and go get the
 * section 7.4 permission instead.
 */

const HOST = /(^|\.)onlinejobs\.ph$/i;

/** From their robots.txt. */
const CRAWL_DELAY_SECONDS = 5;

/** Bounds one search so a single run cannot walk the whole board. */
const MAX_SEARCH_PAGES = 2;
const MAX_DETAIL_FETCHES = 10;

/**
 * Read at call time, not module load, so toggling the variable does not need a
 * process restart and tests can flip it per case.
 */
function scrapeEnabled(): boolean {
  return process.env.ONLINEJOBS_SCRAPE_ENABLED === "true";
}

/** Job URLs look like /jobseekers/job/<Slug>-<numericId>. */
const JOB_PATH = /^\/jobseekers\/job\/(.+)-(\d+)\/?$/;

/** Some listings are linked by bare id: /jobseekers/job/<numericId>. */
const JOB_PATH_BARE_ID = /^\/jobseekers\/job\/(\d+)\/?$/;

function titleFromSlug(slug: string): string {
  return slug.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 200);
}

function safeUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function identityFromUrl(url: URL): UrlIdentity | null {
  if (!HOST.test(url.hostname)) return null;

  const slugged = JOB_PATH.exec(url.pathname);
  if (slugged) {
    const [, slug, id] = slugged;
    return {
      externalId: id,
      sourceKey: buildSourceKey("onlinejobs_ph", id),
      titleHint: titleFromSlug(slug),
    };
  }

  const bare = JOB_PATH_BARE_ID.exec(url.pathname);
  if (bare) {
    const [, id] = bare;
    return {
      externalId: id,
      sourceKey: buildSourceKey("onlinejobs_ph", id),
      titleHint: "",
    };
  }

  // A search or category page is not a job. Returning null here is what stops a
  // pasted search URL becoming a bogus single-row "job".
  return null;
}

async function fetchJobDetail(
  url: URL,
  identity: UrlIdentity,
  signal: AbortSignal | undefined,
  provenance: JobProvenance,
): Promise<NormalizedJob> {
  const html = await politeFetchText(url, {
    source: "onlinejobs_ph",
    crawlDelaySeconds: CRAWL_DELAY_SECONDS,
    signal,
  });

  const detail = parseJobDetail(html);

  return {
    source: "onlinejobs_ph",
    externalId: identity.externalId,
    sourceKey: identity.sourceKey,
    provenance,
    title: detail.title || identity.titleHint || "Untitled role",
    company: detail.company,
    location: detail.location,
    employmentType: detail.employmentType,
    salaryText: detail.salaryText,
    url: url.toString(),
    applyUrl: url.toString(),
    description: detail.description,
    descriptionTruncated: detail.descriptionTruncated,
    postedAt: detail.postedAt,
    // Records which parse path produced this row, so a silent drop in quality
    // after a redesign is visible in the data rather than only in the output.
    raw: { parsedVia: detail.structured ? "json-ld" : "heuristic" },
  };
}

export const onlineJobsPhAdapter: JobSourceAdapter = {
  id: "onlinejobs_ph",
  label: "OnlineJobs.ph",

  // A getter, so the capability follows the env flag rather than whatever it
  // happened to be at import time. `pollable` is what the scheduler reads.
  get capabilities(): JobSourceCapabilities {
    const enabled = scrapeEnabled();

    return {
      pollable: enabled,
      identifiableFromUrl: true,
      fetchableOnDemand: enabled,
      crawlDelaySeconds: CRAWL_DELAY_SECONDS,
      attribution: "Posted on OnlineJobs.ph",
      restrictionNote: enabled
        ? null
        : "OnlineJobs.ph has no public API and their terms prohibit automated access, so " +
          "Craftiv cannot search it for you. Paste a job URL or its description instead.",
    };
  },

  matchesUrl(url) {
    return HOST.test(url.hostname);
  },

  identityFromUrl,

  /**
   * Walks the public search listing and fetches each job's detail page.
   *
   * Refuses outright when the flag is off, so enabling the crawl is a single
   * deliberate act rather than something a caller can opt into.
   */
  async search(query: JobSearchQuery, signal: AbortSignal): Promise<NormalizedJob[]> {
    if (!scrapeEnabled()) {
      throw new JobSourceError(
        "onlinejobs_ph",
        "PERMANENT",
        "OnlineJobs.ph search is disabled. Set ONLINEJOBS_SCRAPE_ENABLED=true to enable it, " +
          "having accepted the terms risk documented in lib/job-sources/onlinejobs-ph.ts.",
      );
    }

    const wanted = Math.min(query.limit, MAX_DETAIL_FETCHES);
    const hits: ReturnType<typeof parseSearchResults> = [];

    for (let page = 1; page <= MAX_SEARCH_PAGES && hits.length < wanted; page += 1) {
      const listUrl = new URL(buildSearchUrl(query.query, page));
      const html = await politeFetchText(listUrl, {
        source: "onlinejobs_ph",
        crawlDelaySeconds: CRAWL_DELAY_SECONDS,
        signal,
      });

      const found = parseSearchResults(html);
      if (found.length === 0) break; // No more results, or the layout moved.

      for (const hit of found) {
        if (hits.length >= wanted) break;
        if (!hits.some((existing) => existing.externalId === hit.externalId)) {
          hits.push(hit);
        }
      }
    }

    const jobs: NormalizedJob[] = [];

    for (const hit of hits) {
      const url = safeUrl(hit.url);
      if (!url) continue;

      try {
        jobs.push(
          await fetchJobDetail(
            url,
            {
              externalId: hit.externalId,
              sourceKey: buildSourceKey("onlinejobs_ph", hit.externalId),
              titleHint: hit.titleHint,
            },
            signal,
            "feed",
          ),
        );
      } catch (error) {
        // A stop signal applies to the whole crawl, not just this page.
        if (
          error instanceof JobSourceError &&
          (error.code === "AUTH" || error.code === "RATE_LIMITED")
        ) {
          throw error;
        }
        // One unreadable posting should not lose the rest of the run.
      }
    }

    return jobs;
  },

  fromUserInput(input: UserJobInput, provenance: JobProvenance): NormalizedJob {
    const url = input.url ?? "";
    const parsed = url ? safeUrl(url) : null;
    const identity = parsed ? identityFromUrl(parsed) : null;

    const rawDescription = input.description ?? "";
    const { description, descriptionTruncated } = capDescription(rawDescription);

    // The URL slug names the job even when the user pasted nothing else, which
    // is why a URL-only import is still useful.
    const title =
      input.title?.trim() ||
      identity?.titleHint ||
      (description ? guessTitleFromText(description) : "Untitled role");

    const externalId = identity?.externalId ?? hashJobIdentity({ title, description, url });

    return {
      source: "onlinejobs_ph",
      externalId,
      sourceKey: identity?.sourceKey ?? buildSourceKey("onlinejobs_ph", externalId),
      provenance,
      title,
      company: input.company?.trim() || guessCompanyFromText(description),
      location: input.location?.trim() || "",
      employmentType: "",
      salaryText: "",
      url,
      applyUrl: url,
      description,
      descriptionTruncated,
      postedAt: null,
      raw: null,
    };
  },
};

/**
 * Fetches a single public job page the user explicitly pasted.
 *
 * Separate from the adapter surface because it is the narrower, more defensible
 * operation: one page, on the user's instruction, rather than a crawl.
 */
export async function fetchOnlineJobsPosting(
  rawUrl: string,
  signal?: AbortSignal,
): Promise<NormalizedJob> {
  if (!scrapeEnabled()) {
    throw new JobSourceError(
      "onlinejobs_ph",
      "PERMANENT",
      "Fetching OnlineJobs.ph pages is disabled. Paste the job description instead.",
    );
  }

  const url = safeUrl(rawUrl);
  if (!url || !HOST.test(url.hostname)) {
    throw new JobSourceError("onlinejobs_ph", "PERMANENT", "Not an OnlineJobs.ph URL.");
  }

  const identity = identityFromUrl(url);
  if (!identity) {
    throw new JobSourceError(
      "onlinejobs_ph",
      "PERMANENT",
      "That link is not a job posting page.",
    );
  }

  return fetchJobDetail(url, identity, signal, "url_import");
}
