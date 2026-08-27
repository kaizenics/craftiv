import type { AtsSectionScore } from "@/lib/ats";

export type AtsImprovement = {
  title: string;
  why: string;
  example: string;
};

/**
 * Shape returned by POST /api/ats-check. It is the deterministic `AtsReport`
 * from `lib/ats` plus the AI-written narrative fields, and `atsCompatibility`
 * is widened to `string` because the response is not schema-validated client side.
 */
export type AtsCheckReport = {
  overallScore: number;
  atsCompatibility: "Low" | "Medium" | "High" | string;
  summary: string;
  strengths: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
  topActions: string[];
  rewrittenSummary: string;
  sectionScores: AtsSectionScore[];
  improvements: AtsImprovement[];
  placeholderWarnings: string[];
  parseWarnings: string[];
  scoringVersion: string;
};

export type PersistedAtsReport = {
  report: AtsCheckReport;
  sourceLabel: string;
  savedAt: string;
};
