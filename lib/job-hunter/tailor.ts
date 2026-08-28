import { z } from "zod";

import { analyzeResumeData, type AtsImpact, type AtsReport } from "@/lib/ats";
import { callWithFallback, extractJsonObject } from "@/lib/ai";
import { buildJobTailorPrompt } from "@/lib/prompts";
import type { ResumeDataJSON } from "@/db/schema/resumes";
import { evaluateTailoring } from "./scoring";

/**
 * Tailoring: the only part of the Job Hunter that calls a model.
 *
 * The deterministic scorer arbitrates the result rather than the other way
 * round. A rewrite is kept only when it raises the ATS score, which gives a
 * property worth stating plainly: the model cannot lower a user's score,
 * because a function it has no influence over decides whether its output
 * survives. That is also the prompt-injection defence -- a hostile advert that
 * talks the model into emitting junk scores worse, and the junk is discarded.
 */

export type TailorTone = "professional" | "confident" | "enthusiastic";

/**
 * Only the narrative fields are accepted back from the model.
 *
 * Everything else -- ids, employers, dates, contact details -- is taken from the
 * stored resume, so a model that ignores the "do not change" instruction, or is
 * talked into changing them, still cannot rewrite a user's employment history.
 * Validation is the enforcement; the prompt is only the request.
 */
const tailoredResumeSchema = z.object({
  summary: z.string().max(4000).optional(),
  experiences: z
    .array(z.object({ id: z.string(), description: z.string().max(4000).optional() }))
    .max(50)
    .optional(),
  educations: z
    .array(z.object({ id: z.string(), description: z.string().max(4000).optional() }))
    .max(50)
    .optional(),
});

const tailorResponseSchema = z.object({
  resume: tailoredResumeSchema,
  coverLetter: z.string().max(8000),
  summaryOfChanges: z.array(z.string().max(400)).max(20).optional(),
});

export type TailorChange = {
  label: string;
  before: string;
  after: string;
};

export type TailorResult = {
  /** The rewritten resume, safe to persist. */
  resumeData: ResumeDataJSON;
  coverLetter: string;
  changes: TailorChange[];
  summaryOfChanges: string[];
  impact: AtsImpact;
  /** False when the rewrite did not improve the score and was discarded. */
  accepted: boolean;
  beforeReport: AtsReport;
  afterReport: AtsReport;
};

function clone(data: ResumeDataJSON): ResumeDataJSON {
  return JSON.parse(JSON.stringify(data)) as ResumeDataJSON;
}

/**
 * Merges only the narrative fields onto a copy of the stored resume.
 *
 * Matching by id rather than array position means a model that reorders or
 * drops entries cannot shift one job's description onto another.
 */
function applyNarrative(
  base: ResumeDataJSON,
  patch: z.infer<typeof tailoredResumeSchema>,
): { data: ResumeDataJSON; changes: TailorChange[] } {
  const next = clone(base);
  const changes: TailorChange[] = [];

  if (typeof patch.summary === "string" && patch.summary.trim() && patch.summary !== next.summary) {
    changes.push({ label: "Summary", before: next.summary, after: patch.summary.trim() });
    next.summary = patch.summary.trim();
  }

  for (const entry of patch.experiences ?? []) {
    const target = next.experiences.find((item) => item.id === entry.id);
    const after = entry.description?.trim();
    if (!target || !after || after === target.description) continue;

    changes.push({
      label: `${target.jobTitle || "Experience"}${target.employer ? ` — ${target.employer}` : ""}`,
      before: target.description,
      after,
    });
    target.description = after;
  }

  for (const entry of patch.educations ?? []) {
    const target = next.educations.find((item) => item.id === entry.id);
    const after = entry.description?.trim();
    if (!target || !after || after === target.description) continue;

    changes.push({
      label: target.degree || target.schoolName || "Education",
      before: target.description,
      after,
    });
    target.description = after;
  }

  return { data: next, changes };
}

export class TailorError extends Error {
  code: "INVALID_RESPONSE" | "NO_IMPROVEMENT";

  constructor(code: TailorError["code"], message: string) {
    super(message);
    this.name = "TailorError";
    this.code = code;
  }
}

export async function tailorResumeForJob(params: {
  resumeData: ResumeDataJSON;
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  tone?: TailorTone;
}): Promise<TailorResult> {
  const beforeReport = analyzeResumeData(params.resumeData, params.jobDescription);

  const prompt = buildJobTailorPrompt({
    resumeData: params.resumeData,
    jobTitle: params.jobTitle,
    companyName: params.companyName,
    jobDescription: params.jobDescription,
    missingKeywords: beforeReport.missingKeywords,
    tone: params.tone ?? "professional",
  });

  const { content } = await callWithFallback({
    messages: [{ role: "user", content: prompt }],
    maxTokens: 4500,
    temperature: 0.4,
  });

  const raw = extractJsonObject(content);
  if (!raw) {
    throw new TailorError("INVALID_RESPONSE", "The model returned an unreadable response.");
  }

  const parsed = tailorResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new TailorError("INVALID_RESPONSE", "The model returned an unexpected shape.");
  }

  const { data: resumeData, changes } = applyNarrative(params.resumeData, parsed.data.resume);
  const afterReport = analyzeResumeData(resumeData, params.jobDescription);
  const { accepted, impact } = evaluateTailoring(beforeReport, afterReport);

  return {
    resumeData,
    coverLetter: parsed.data.coverLetter.trim(),
    changes,
    summaryOfChanges: parsed.data.summaryOfChanges ?? [],
    impact,
    accepted,
    beforeReport,
    afterReport,
  };
}
