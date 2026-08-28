import { analyzeResumeData, buildAtsImpact, type AtsImpact, type AtsReport } from "@/lib/ats";
import type { ResumeDataJSON } from "@/db/schema/resumes";

/**
 * Match scoring.
 *
 * A thin, pure wrapper over the deterministic engine in lib/ats.ts. There is no
 * model call, no network and no credit charge anywhere in this module, and that
 * is the fact the whole feature's economics rest on: scoring two hundred
 * postings costs nothing, so tokens are spent only on the handful the user
 * chooses to tailor. Any design that asks a model to *score* a job is paying
 * for an answer this function already gives.
 *
 * It is also why scheduled background runs are free -- and therefore why the
 * hardest problem in "charge a user who is not present" never arises.
 */

export type JobMatchScore = {
  score: number;
  scoringVersion: string;
  report: AtsReport;
};

export function scoreResumeAgainstJob(
  resumeData: ResumeDataJSON,
  jobDescription: string,
): JobMatchScore {
  const report = analyzeResumeData(resumeData, jobDescription);

  return {
    score: report.overallScore,
    scoringVersion: report.scoringVersion,
    report,
  };
}

/**
 * Decides whether a tailored resume is worth keeping.
 *
 * The deterministic scorer arbitrates the model, never the reverse: a rewrite
 * that does not raise the score is discarded and the original kept. That gives
 * a property worth stating plainly -- the LLM cannot lower a user's ATS score,
 * because a function it has no influence over decides whether its output
 * survives.
 *
 * It doubles as the prompt-injection defence. A hostile job description that
 * talks the model into emitting junk produces a lower score, and the junk is
 * thrown away.
 */
export function evaluateTailoring(
  before: AtsReport,
  after: AtsReport,
): { accepted: boolean; impact: AtsImpact } {
  const impact = buildAtsImpact(before, after);
  return {
    accepted: impact.afterScore > impact.beforeScore,
    impact,
  };
}

/**
 * True when a match was scored against a resume that has since been edited.
 *
 * Drives both the "score may be out of date" label in the UI and the re-score
 * sweep in a scheduled run. Compared at second granularity because timestamps
 * round-trip through SQLite as integers.
 */
export function isScoreStale(
  scoredAgainstResumeUpdatedAt: Date,
  resumeUpdatedAt: Date,
): boolean {
  return Math.floor(resumeUpdatedAt.getTime() / 1000) >
    Math.floor(scoredAgainstResumeUpdatedAt.getTime() / 1000);
}
