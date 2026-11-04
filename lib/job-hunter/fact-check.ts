import type { ResumeDataJSON } from "@/db/schema";
import { formatResumeDataForAts } from "@/lib/ats";

/**
 * Catches figures an AI rewrite invented.
 *
 * A tailored resume may reword anything, but every number in it -- a percentage, an amount, a team
 * size -- has to already be somewhere in the user's own resume. "Grew revenue 40%" is a claim the
 * user will be asked about in an interview; if the original never said 40%, it is a fabrication,
 * however much it helps the score. Deterministic and free, like the scorer it sits beside.
 *
 * Idea from career-ops' verify-cv-facts (MIT), reduced to the part that matters most: numbers.
 */

// A figure: optional currency, digits with thousands separators and decimals, then an optional
// scale or unit. Letters or a slash on either side mean it is part of a word or date ("B2B", "Q3",
// "24/7"), not a claim. Note "10x" is allowed: "x" is consumed as a unit.
const FIGURE =
  /(?<![\p{L}\p{N}./])[$€£₱]?\s?(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d+))?\s?(%|x|k|m|mm|bn|b|thousand|million|billion)?(?![\p{L}\p{N}/])/giu;

const SCALE: Record<string, number> = { k: 1e3, thousand: 1e3, m: 1e6, mm: 1e6, million: 1e6, b: 1e9, bn: 1e9, billion: 1e9 };

// Number words a person writes in prose; the rewrite turning "five" into "5" is not an invention.
const WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, fifteen: 15, twenty: 20, thirty: 30, fifty: 50, hundred: 100, dozen: 12,
};

type Figure = { raw: string; value: number };

function figures(text: string): Figure[] {
  const found: Figure[] = [];
  for (const match of text.matchAll(FIGURE)) {
    const [raw, whole, fraction, unit] = match;
    const base = Number(`${whole.replace(/,/g, "")}${fraction ? `.${fraction}` : ""}`);
    const scale = unit ? SCALE[unit.toLowerCase()] ?? 1 : 1;
    if (Number.isFinite(base)) found.push({ raw: raw.trim(), value: Math.round(base * scale * 1e6) / 1e6 });
  }
  return found;
}

/** Every number the user's own resume states, including the ones written as words. */
export function knownFigures(original: ResumeDataJSON): Set<number> {
  const text = formatResumeDataForAts(original);
  const known = new Set(figures(text).map((figure) => figure.value));
  // Dates are stored as "03/2021", which FIGURE skips as a date; the years in them are still facts.
  for (const year of text.match(/(?<!\d)(?:19|20)\d{2}(?!\d)/g) ?? []) known.add(Number(year));
  for (const word of text.toLowerCase().match(/\p{L}+/gu) ?? []) {
    if (word in WORDS) known.add(WORDS[word]);
  }
  return known;
}

/** Figures in `text` that the original resume never states, as written in `text`. */
export function unsupportedFigures(text: string, known: Set<number>): string[] {
  const unsupported = figures(text).filter((figure) => !known.has(figure.value)).map((figure) => figure.raw);
  return [...new Set(unsupported)];
}
