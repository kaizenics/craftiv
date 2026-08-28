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

/**
 * The labelled fields an OnlineJobs.ph posting shows above the advert body:
 * TYPE OF WORK, WAGE / SALARY, HOURS PER WEEK, DATE UPDATED, JOB OVERVIEW.
 *
 * Extracted by their visible label text rather than by any container class.
 * The labels are what the page promises a reader, so they are far more stable
 * than markup -- a restyle changes classes constantly and label wording almost
 * never. It also means one function handles both the flat text of a fallback
 * parse and a fully marked-up page, because htmlToPlainText puts each label and
 * its value on their own lines either way.
 */
const OJ_LABELS = [
  "TYPE OF WORK",
  "WAGE / SALARY",
  "HOURS PER WEEK",
  "DATE UPDATED",
  "JOB OVERVIEW",
  // Not read, but needed as terminators so a value never runs into the next
  // section.
  "SKILL REQUIREMENTS",
  "ID PROOF INDEX",
  "JOB ID",
  "SHARE THIS JOB",
  "APPLY FOR THIS JOB",
] as const;

/** Uppercases, collapses whitespace and drops a trailing colon or slash spacing. */
function normalizeLabel(line: string): string {
  return line
    .toUpperCase()
    .replace(/\s*\/\s*/g, " / ")
    .replace(/\s+/g, " ")
    .replace(/[:：]\s*$/, "")
    .trim();
}

export type OnlineJobsFields = Partial<Record<(typeof OJ_LABELS)[number], string>>;

export function extractLabelledFields(text: string): OnlineJobsFields {
  const labels = new Set<string>(OJ_LABELS);
  const fields: OnlineJobsFields = {};

  let current: (typeof OJ_LABELS)[number] | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (current && buffer.length > 0) {
      // First value wins: a label repeated lower down the page (in a footer or
      // a "similar jobs" block) must not overwrite the real one.
      if (!fields[current]) fields[current] = buffer.join("\n").trim();
    }
    buffer = [];
  };

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) {
      // Blank lines are structure inside a body, so keep them there.
      if (current === "JOB OVERVIEW" && buffer.length > 0) buffer.push("");
      continue;
    }

    const normalized = normalizeLabel(line);
    if (labels.has(normalized)) {
      flush();
      current = normalized as (typeof OJ_LABELS)[number];
      continue;
    }

    // Some layouts put the value on the same line as the label, separated by a
    // colon, dash or just a space.
    const inline = OJ_LABELS.find(
      (label) => normalized.startsWith(label) && /^[\s:：|-]/.test(normalized.slice(label.length)),
    );
    if (inline) {
      flush();
      current = inline;
      // Slice the raw line, not the normalised one, so the value keeps its
      // original casing -- "Part Time", not "PART TIME".
      buffer.push(line.slice(inline.length).replace(/^[\s:：|-]+/, ""));
      continue;
    }

    if (current) buffer.push(line);
  }

  flush();
  return fields;
}

/** Collapses a multi-line value, e.g. "PHP 60,000 - 90,000" + "Per Month". */
function singleLine(value: string | undefined): string {
  return (value ?? "").replace(/\s*\n\s*/g, " ").replace(/\s+/g, " ").trim().slice(0, 200);
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
  hoursPerWeek: string;
  description: string;
  descriptionTruncated: boolean;
  postedAt: Date | null;
  /** True when the structured JSON-LD path was used rather than the fallback. */
  structured: boolean;
};

/** "Aug 28, 2026" and similar, as shown under DATE UPDATED. */
function parseLabelDate(value: string | undefined): Date | null {
  if (!value?.trim()) return null;
  const parsed = new Date(value.trim());
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function parseJobDetail(html: string): ParsedJobDetail {
  // Read the labelled panel first. It is the page's own summary of the job, so
  // where it and JSON-LD disagree the visible label is what the user saw.
  const fields = extractLabelledFields(htmlToPlainText(html));

  const labelledOverview = fields["JOB OVERVIEW"]?.trim() ?? "";
  const employmentType = singleLine(fields["TYPE OF WORK"]);
  const salaryText = singleLine(fields["WAGE / SALARY"]);
  const hoursPerWeek = singleLine(fields["HOURS PER WEEK"]);
  const labelledDate = parseLabelDate(fields["DATE UPDATED"]);

  const posting = extractJsonLdJobPosting(html);

  if (posting) {
    const jsonLdDescription = htmlToPlainText(posting.description ?? "");
    // Prefer whichever body is fuller: JSON-LD is sometimes a truncated teaser
    // while the visible JOB OVERVIEW carries the whole advert.
    const body =
      labelledOverview.length > jsonLdDescription.length ? labelledOverview : jsonLdDescription;

    const { description, descriptionTruncated } = capDescription(body);
    const posted = posting.datePosted ? new Date(posting.datePosted) : null;

    return {
      title: firstString(posting.title) || extractHeading(html),
      company: organizationName(posting.hiringOrganization),
      location: locationName(posting.jobLocation),
      employmentType: employmentType || firstString(posting.employmentType),
      salaryText,
      hoursPerWeek,
      description,
      descriptionTruncated,
      postedAt: (posted && !Number.isNaN(posted.getTime()) ? posted : null) ?? labelledDate,
      structured: true,
    };
  }

  const { description, descriptionTruncated } = capDescription(
    labelledOverview || extractLikelyDescription(html),
  );

  return {
    title: extractHeading(html),
    company: "",
    location: "",
    employmentType,
    salaryText,
    hoursPerWeek,
    description,
    descriptionTruncated,
    postedAt: labelledDate,
    // The labelled panel is structured data even without JSON-LD, so a page
    // that yields it is not really the blind heuristic path.
    structured: Boolean(labelledOverview),
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
