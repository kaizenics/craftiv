import type { AtsSectionScore } from "@/lib/ats";

/**
 * Presentation helpers for ATS results.
 *
 * Every band carries a text `label` alongside its colour classes so meaning is
 * never encoded in hue alone -- required for colour-blind users and greyscale
 * printing, and the reason the old page's unconditional amber pill was wrong.
 */
export type AtsBand = "critical" | "attention" | "strong";

export type AtsBandStyle = {
  band: AtsBand;
  /** Short label rendered next to the number. */
  label: string;
  /** One sentence telling the user what the band means for them. */
  hint: string;
  /** Foreground colour for text and icons. */
  text: string;
  /** Tinted panel background. */
  surface: string;
  /** Panel border to pair with `surface`. */
  border: string;
  /** Solid fill for gauges and progress indicators. */
  fill: string;
  /** Combined pill classes. */
  pill: string;
};

const BANDS: Record<AtsBand, Omit<AtsBandStyle, "band">> = {
  critical: {
    label: "Needs work",
    hint: "Most tracking systems will drop or misread this resume. Fix the flagged items before applying.",
    text: "text-destructive-surface-foreground",
    surface: "bg-destructive-surface",
    border: "border-destructive-border",
    fill: "bg-destructive",
    pill: "border-destructive-border bg-destructive-surface text-destructive-surface-foreground",
  },
  attention: {
    label: "Getting there",
    hint: "This parses, but a stronger keyword match would move you up the shortlist.",
    text: "text-warning-surface-foreground",
    surface: "bg-warning-surface",
    border: "border-warning-border",
    fill: "bg-warning",
    pill: "border-warning-border bg-warning-surface text-warning-surface-foreground",
  },
  strong: {
    label: "Strong match",
    hint: "This reads cleanly for both tracking systems and recruiters.",
    text: "text-success-surface-foreground",
    surface: "bg-success-surface",
    border: "border-success-border",
    fill: "bg-success",
    pill: "border-success-border bg-success-surface text-success-surface-foreground",
  },
};

export function scoreBand(score: number): AtsBand {
  if (score >= 80) return "strong";
  if (score >= 60) return "attention";
  return "critical";
}

export function bandStyle(score: number): AtsBandStyle {
  const band = scoreBand(score);
  return { band, ...BANDS[band] };
}

export function bandStyleFor(band: AtsBand): AtsBandStyle {
  return { band, ...BANDS[band] };
}

/**
 * The API may widen `atsCompatibility` to a bare string, so treat anything
 * unrecognised as "needs attention" rather than silently rendering it as good.
 */
export function compatibilityBand(compatibility: string): AtsBand {
  const normalized = compatibility.trim().toLowerCase();
  if (normalized === "high") return "strong";
  if (normalized === "low") return "critical";
  return "attention";
}

/** Weakest sections first, so the most useful row is the one read first. */
export function sortSectionsByNeed(sections: AtsSectionScore[]): AtsSectionScore[] {
  return [...sections].sort((a, b) => a.score - b.score);
}

export function formatSavedAt(iso: string): string {
  if (!iso) return "";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
