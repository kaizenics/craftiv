import { createHash } from "node:crypto";

import { PROMPT_INPUT_LIMITS } from "@/lib/constants/prompt-limits";
import type { JobSourceId } from "@/lib/types/job-hunter";

/**
 * Normalization shared by every source adapter.
 *
 * Kept free of DB and network imports so adapters stay pure and unit-testable.
 */

/** `${source}:${externalId}` -- the dedupe unit stored on job_postings. */
export function buildSourceKey(source: JobSourceId, externalId: string): string {
  return `${source}:${externalId}`;
}

/**
 * Collapses whitespace and case so that the same advert pasted twice, with
 * different indentation or a trailing newline, hashes identically.
 */
export function normalizeForHash(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

/**
 * Stable id for a job that has no source-assigned one -- a raw paste.
 *
 * Derived from the content itself, so re-pasting the same advert reuses the
 * existing row instead of creating a second.
 */
export function hashJobIdentity(parts: {
  title?: string;
  company?: string;
  description?: string;
  url?: string;
}): string {
  // A URL, when present, is the strongest identity signal available and is
  // stable across edits to the body text.
  const basis = parts.url
    ? normalizeForHash(parts.url)
    : normalizeForHash(
        [parts.title ?? "", parts.company ?? "", (parts.description ?? "").slice(0, 500)].join("\n"),
      );

  return createHash("sha256").update(basis).digest("hex").slice(0, 32);
}

/**
 * Change detection, deliberately separate from identity.
 *
 * `sourceKey` answers "is this the same listing?"; this answers "did the
 * employer edit it?". Conflating them would create a duplicate row every time
 * a typo is fixed.
 */
export function hashJobContent(parts: {
  title: string;
  company: string;
  description: string;
}): string {
  return createHash("sha256")
    .update(normalizeForHash([parts.title, parts.company, parts.description].join("\n")))
    .digest("hex")
    .slice(0, 32);
}

/**
 * Strips markup and decodes the handful of entities that survive a copy-paste
 * from a job board.
 *
 * Deliberately regex-based rather than a new HTML-parser dependency: the input
 * is a job advert destined for keyword extraction, not a document to render,
 * and it never reaches the DOM. Anything that does get rendered goes through
 * the existing isomorphic-dompurify path instead.
 */
export function htmlToPlainText(input: string): string {
  return input
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n")
    .replace(/<li\b[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/[ \t ]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();
}

export type CappedDescription = {
  description: string;
  descriptionTruncated: boolean;
};

/**
 * Caps a description at the storage layer, not just the prompt layer.
 *
 * Credit costs are per call rather than per token, so an uncapped stored job is
 * a way to buy an arbitrarily large model call for a fixed price. Bounding it
 * here means no prompt built from a stored job can ever exceed the limit,
 * whichever code path builds it.
 */
export function capDescription(
  input: string,
  limit: number = PROMPT_INPUT_LIMITS.jobDescription,
): CappedDescription {
  const text = htmlToPlainText(input);
  if (text.length <= limit) {
    return { description: text, descriptionTruncated: false };
  }

  // Trim back to a word boundary so the cut does not land mid-token and
  // invent a keyword that was never in the advert.
  const clipped = text.slice(0, limit);
  const lastBreak = clipped.lastIndexOf(" ");
  return {
    description: (lastBreak > limit * 0.8 ? clipped.slice(0, lastBreak) : clipped).trimEnd(),
    descriptionTruncated: true,
  };
}

/**
 * Best-effort title when the user pasted a body with no title field.
 *
 * Deterministic on purpose -- this is the free path. The LLM parse is an
 * opt-in upgrade, not a prerequisite for importing a job.
 */
export function guessTitleFromText(text: string): string {
  const firstLine = text
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length >= 3 && line.length <= 120);

  return firstLine ?? "Untitled role";
}

/** Matches "at Acme", "Company: Acme", "Employer: Acme" in the first few lines. */
export function guessCompanyFromText(text: string): string {
  const head = text.split("\n").slice(0, 8).join("\n");
  const labelled = /(?:company|employer|organisation|organization)\s*[:\-]\s*(.+)/i.exec(head);
  if (labelled?.[1]) return labelled[1].trim().slice(0, 120);

  // Horizontal whitespace only: \s would cross the newline and swallow the
  // first capitalised word of the following line into the company name.
  const atForm = /\bat[ \t]+([A-Z][\w&.,'-]*(?:[ \t]+[A-Z][\w&.,'-]*){0,3})/.exec(head);
  if (atForm?.[1]) return atForm[1].trim().slice(0, 120);

  return "";
}

/** Parses a URL, returning null rather than throwing on junk input. */
export function safeParseUrl(value: string | undefined | null): URL | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    // Only web URLs. Keeps javascript:, data: and file: out of every path that
    // consumes this, including anything later rendered as an href.
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url;
  } catch {
    return null;
  }
}
