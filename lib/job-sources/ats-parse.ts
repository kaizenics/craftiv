import type { NormalizedJob } from "./types";
import { buildSourceKey, capDescription } from "./normalize";

/**
 * Parsers for the public job-board feeds of Greenhouse, Lever and Ashby.
 *
 * Pure: a feed body in, NormalizedJob[] out, no network. Field handling follows
 * career-ops' providers (github.com/career-ops-hq/career-ops, MIT), which
 * learned each feed's quirks the hard way: Greenhouse double-encodes its HTML,
 * Lever spreads a posting across several fields, and both Lever and Ashby keep
 * extra cities outside the primary location.
 *
 * Deliberately lenient: a malformed posting is dropped, never thrown, so a feed
 * changing shape degrades to "fewer jobs" rather than a failed refresh.
 */

export type AtsProvider = "greenhouse" | "lever" | "ashby";

const API_HOSTS: Record<AtsProvider, string> = {
  greenhouse: "boards-api.greenhouse.io",
  lever: "api.lever.co",
  ashby: "api.ashbyhq.com",
};

const SLUG = /^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/;

/**
 * The feed URL for one board. Built only from a provider and a slug, on a fixed
 * HTTPS host per provider: with redirects refused by the caller, a request can
 * only ever reach that provider's public API.
 */
export function atsFeedUrl(provider: AtsProvider, slug: string): string {
  if (!SLUG.test(slug)) throw new Error(`Invalid ${provider} board slug: ${slug}`);
  const host = API_HOSTS[provider];
  if (provider === "greenhouse") return `https://${host}/v1/boards/${slug}/jobs?content=true`;
  if (provider === "lever") return `https://${host}/v0/postings/${slug}?mode=json`;
  return `https://${host}/posting-api/job-board/${slug}?includeCompensation=true`;
}

const str = (value: unknown) => (typeof value === "string" ? value.trim() : "");

function toDate(value: unknown): Date | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Joins locations, dropping blanks and case-insensitive repeats. */
function joinLocations(values: unknown[]): string {
  const out: string[] = [];
  for (const value of values) {
    const location = str(value);
    if (location && !out.some((seen) => seen.toLowerCase() === location.toLowerCase())) out.push(location);
  }
  return out.join("; ");
}

/** Greenhouse sends HTML entity-encoded inside JSON: one decode reveals the real tags. */
function decodeEntitiesOnce(value: string): string {
  return value
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&amp;/gi, "&");
}

type Fields = Pick<NormalizedJob, "title" | "location" | "employmentType" | "salaryText" | "url" | "applyUrl" | "postedAt"> & {
  id: string;
  text: string;
};

function build(provider: AtsProvider, slug: string, company: string, fields: Fields): NormalizedJob | null {
  if (!fields.id || !fields.title || !/^https:\/\//i.test(fields.url)) return null;
  const { description, descriptionTruncated } = capDescription(fields.text);
  if (!description) return null;
  const externalId = `${provider}:${slug}:${fields.id}`;
  return {
    source: "ats_boards",
    externalId,
    sourceKey: buildSourceKey("ats_boards", externalId),
    provenance: "feed",
    company,
    hoursPerWeek: "",
    description,
    descriptionTruncated,
    raw: null,
    title: fields.title,
    location: fields.location,
    employmentType: fields.employmentType,
    salaryText: fields.salaryText,
    url: fields.url,
    applyUrl: fields.applyUrl || fields.url,
    postedAt: fields.postedAt,
  };
}

function parseGreenhouse(body: unknown, slug: string, company: string) {
  const jobs = (body as { jobs?: unknown })?.jobs;
  return (Array.isArray(jobs) ? jobs : []).map((j) =>
    build("greenhouse", slug, company, {
      id: String(j?.id ?? ""),
      title: str(j?.title),
      location: str(j?.location?.name),
      employmentType: "",
      salaryText: "",
      url: str(j?.absolute_url),
      applyUrl: str(j?.absolute_url),
      postedAt: toDate(j?.first_published ?? j?.updated_at),
      text: decodeEntitiesOnce(str(j?.content)),
    }),
  );
}

function parseLever(body: unknown, slug: string, company: string) {
  return (Array.isArray(body) ? body : []).map((j) => {
    // The intro, then each requirements list, then the closing copy: Lever's own page order.
    const lists = Array.isArray(j?.lists)
      ? j.lists.map((list: { text?: unknown; content?: unknown }) => [str(list?.text), str(list?.content)].filter(Boolean).join("\n"))
      : [];
    const text = [str(j?.descriptionPlain) || str(j?.description), ...lists, str(j?.additionalPlain)].filter(Boolean).join("\n\n");
    const remote = str(j?.workplaceType).toLowerCase() === "remote" ? "Remote" : "";
    return build("lever", slug, company, {
      id: str(j?.id),
      title: str(j?.text),
      location: joinLocations([j?.categories?.location, ...(Array.isArray(j?.categories?.allLocations) ? j.categories.allLocations : []), remote]),
      employmentType: str(j?.categories?.commitment),
      salaryText: "",
      url: str(j?.hostedUrl),
      applyUrl: str(j?.applyUrl),
      postedAt: toDate(j?.createdAt),
      text,
    });
  });
}

function parseAshby(body: unknown, slug: string, company: string) {
  const jobs = (body as { jobs?: unknown })?.jobs;
  return (Array.isArray(jobs) ? jobs : [])
    .filter((j) => j?.isListed !== false)
    .map((j) => {
      const secondary = Array.isArray(j?.secondaryLocations)
        ? j.secondaryLocations.map((l: { location?: unknown }) => l?.location)
        : [];
      // Ashby keeps naming the office city for a fully remote role; say it is remote.
      const remote = j?.isRemote === true || str(j?.workplaceType).toLowerCase() === "remote" ? "Remote" : "";
      return build("ashby", slug, company, {
        id: str(j?.id),
        title: str(j?.title),
        location: joinLocations([j?.location, ...secondary, remote]),
        employmentType: str(j?.employmentType),
        salaryText: str(j?.compensation?.compensationTierSummary),
        url: str(j?.jobUrl),
        applyUrl: str(j?.applyUrl),
        postedAt: toDate(j?.publishedAt),
        text: str(j?.descriptionPlain) || str(j?.descriptionHtml),
      });
    });
}

/** One board's feed body → its jobs. Unknown or malformed postings are skipped. */
export function parseAtsFeed(provider: AtsProvider, slug: string, company: string, body: unknown): NormalizedJob[] {
  const parse = provider === "greenhouse" ? parseGreenhouse : provider === "lever" ? parseLever : parseAshby;
  return parse(body, slug, company).filter((job): job is NormalizedJob => job !== null);
}
