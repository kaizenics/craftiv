import { capDescription, htmlToPlainText } from "./normalize";

/**
 * HTML parsing for OnlineJobs.ph, kept pure so it is testable without a network.
 *
 * Deliberately built on two things that do not change when a site is restyled:
 * the job URL pattern, and schema.org JobPosting JSON-LD. CSS class names are
 * used only as a last-resort fallback, because a scraper keyed on class names
 * breaks on the first redesign and breaks silently -- it returns zero jobs,
 * which is indistinguishable from "no new jobs today".
 */

/** Every href on the page, so job links are found however they are nested. */
const HREF = /href\s*=\s*["']([^"']+)["']/gi;

/**
 * /jobseekers/job/<Slug>-<numericId>, anchored to the end of the path.
 *
 * Anchoring matters: an earlier version terminated on `/?#` or end-of-string,
 * which never matched in real markup because an href ends at a quote, and it
 * could also split a slug mid-number. Matching the extracted path in full
 * avoids both.
 */
const JOB_PATH = /\/jobseekers\/job\/(?:(.+?)-)?(\d+)\/?$/;

export type SearchHit = {
  externalId: string;
  slug: string;
  titleHint: string;
  url: string;
};

function decodeSlug(slug: string): string {
  let decoded = slug;
  try {
    decoded = decodeURIComponent(slug);
  } catch {
    // A malformed escape sequence is not worth failing a whole page over.
  }

  return decoded.replace(/[-_+]+/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Pulls every job link out of a search or category listing page.
 *
 * Works off hrefs rather than result-card markup, so it keeps working when the
 * listing layout changes, and it naturally ignores navigation chrome because
 * nothing else on the site matches the job URL shape.
 */
export function parseSearchResults(html: string, baseUrl = "https://www.onlinejobs.ph"): SearchHit[] {
  const seen = new Map<string, SearchHit>();

  for (const attr of html.matchAll(HREF)) {
    const href = attr[1];
    if (!href || !href.includes("/jobseekers/job/")) continue;

    // Resolving against the base handles relative and absolute hrefs the same
    // way, and drops any query or fragment before the path is matched.
    let path: string;
    try {
      path = new URL(href, baseUrl).pathname;
    } catch {
      continue;
    }

    const match = JOB_PATH.exec(path);
    if (!match) continue;

    const [, slug, externalId] = match;
    if (!externalId) continue;

    // The same job usually appears more than once per page (title link, image
    // link, "apply" link). First occurrence wins.
    if (seen.has(externalId)) continue;

    seen.set(externalId, {
      externalId,
      slug: slug ?? "",
      titleHint: slug ? decodeSlug(slug) : "",
      url: new URL(path, baseUrl).toString(),
    });
  }

  return [...seen.values()];
}

type JsonLdJobPosting = {
  title?: string;
  description?: string;
  datePosted?: string;
  employmentType?: string | string[];
  hiringOrganization?: { name?: string } | string;
  jobLocation?: unknown;
  baseSalary?: unknown;
};

/** Walks a JSON-LD payload, which may be a graph or an array, for a JobPosting. */
function findJobPosting(node: unknown): JsonLdJobPosting | null {
  if (!node || typeof node !== "object") return null;

  if (Array.isArray(node)) {
    for (const entry of node) {
      const found = findJobPosting(entry);
      if (found) return found;
    }
    return null;
  }

  const record = node as Record<string, unknown>;
  const type = record["@type"];
  const isJobPosting = Array.isArray(type)
    ? type.includes("JobPosting")
    : type === "JobPosting";

  if (isJobPosting) return record as JsonLdJobPosting;

  if (record["@graph"]) return findJobPosting(record["@graph"]);
  return null;
}

export function extractJsonLdJobPosting(html: string): JsonLdJobPosting | null {
  const blocks = html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );

  for (const block of blocks) {
    const raw = block[1]?.trim();
    if (!raw) continue;

    try {
      const found = findJobPosting(JSON.parse(raw));
      if (found) return found;
    } catch {
      // A malformed JSON-LD block is common and not fatal; try the next one.
    }
  }

  return null;
}

function firstString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map(firstString).find(Boolean) ?? "";
  return "";
}

function organizationName(value: JsonLdJobPosting["hiringOrganization"]): string {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object" && typeof value.name === "string") {
    return value.name.trim();
  }
  return "";
}

function locationName(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value.trim();

  if (Array.isArray(value)) return locationName(value[0]);

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const address = record.address;
    if (address && typeof address === "object") {
      const addr = address as Record<string, unknown>;
      return [addr.addressLocality, addr.addressRegion, addr.addressCountry]
        .map(firstString)
        .filter(Boolean)
        .join(", ");
    }
    return firstString(record.name);
  }

  return "";
}

/** Falls back to the document title when there is no JSON-LD and no <h1>. */
function extractHeading(html: string): string {
  const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html);
  if (h1?.[1]) {
    const text = htmlToPlainText(h1[1]);
    if (text) return text.slice(0, 200);
  }

  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  if (title?.[1]) {
    // Titles are usually "Role - Company | OnlineJobs.ph"; keep the first part.
    return htmlToPlainText(title[1]).split(/\s+[|–-]\s+/)[0]?.slice(0, 200) ?? "";
  }

  return "";
}

/**
 * Strips chrome and returns the longest coherent block of prose on the page.
 *
 * Used only when JSON-LD is absent. A job advert is by far the largest text
 * block on its own page, so picking the biggest block is more durable than
 * guessing at a container class.
 */
function extractLikelyDescription(html: string): string {
  const body = html
    .replace(/<(script|style|nav|header|footer|form|noscript)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");

  const blocks = body
    .split(/<\/(?:div|section|article|main|td)>/i)
    .map((block) => htmlToPlainText(block))
    .filter((text) => text.length > 0);

  if (blocks.length === 0) return htmlToPlainText(body);

  return blocks.reduce((longest, block) => (block.length > longest.length ? block : longest), "");
}

export type ParsedJobDetail = {
  title: string;
  company: string;
  location: string;
  employmentType: string;
  salaryText: string;
  description: string;
  descriptionTruncated: boolean;
  postedAt: Date | null;
  /** True when the structured JSON-LD path was used rather than the fallback. */
  structured: boolean;
};

export function parseJobDetail(html: string): ParsedJobDetail {
  const posting = extractJsonLdJobPosting(html);

  if (posting) {
    const { description, descriptionTruncated } = capDescription(
      htmlToPlainText(posting.description ?? ""),
    );
    const posted = posting.datePosted ? new Date(posting.datePosted) : null;

    return {
      title: firstString(posting.title) || extractHeading(html),
      company: organizationName(posting.hiringOrganization),
      location: locationName(posting.jobLocation),
      employmentType: firstString(posting.employmentType),
      salaryText: "",
      description,
      descriptionTruncated,
      postedAt: posted && !Number.isNaN(posted.getTime()) ? posted : null,
      structured: true,
    };
  }

  const { description, descriptionTruncated } = capDescription(extractLikelyDescription(html));

  return {
    title: extractHeading(html),
    company: "",
    location: "",
    employmentType: "",
    salaryText: "",
    description,
    descriptionTruncated,
    postedAt: null,
    structured: false,
  };
}

/** Builds the category search URL for a keyword-free category browse. */
export function buildCategoryUrl(category: string): string {
  return `https://www.onlinejobs.ph/jobseekers/search/c/${encodeURIComponent(category)}`;
}

/** Builds the keyword search URL. */
export function buildSearchUrl(keyword: string, page = 1): string {
  const url = new URL("https://www.onlinejobs.ph/jobseekers/jobsearch");
  if (keyword.trim()) url.searchParams.set("jobkeyword", keyword.trim());
  if (page > 1) url.searchParams.set("page", String(page));
  return url.toString();
}
