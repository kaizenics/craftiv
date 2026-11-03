import type { ResumeDataJSON } from "@/db/schema";
import { formatResumeDataForAts } from "@/lib/ats";

export type ResumeHint = { where: string; message: string };

const LONG_BULLET_WORDS = 30;
const SUMMARY_WORDS = { min: 30, max: 90 };
// Openers that describe duties rather than results.
const WEAK_OPENER = /^(responsible for|helped|helping|worked on|assisted|tasked with|duties included|in charge of)\b/i;
const BULLET_MARK = /^\s*(?:-|•|\*)\s*/;

const countWords = (text: string) => text.split(/\s+/).filter(Boolean).length;

/** Plain-language writing checks run in the browser: no AI, no network, just rules a recruiter would apply. */
export function analyzeResumeWriting(data: ResumeDataJSON): { wordCount: number; hints: ResumeHint[] } {
  const hints: ResumeHint[] = [];

  const summaryWords = countWords(data.summary ?? "");
  if (summaryWords > 0 && summaryWords < SUMMARY_WORDS.min) {
    hints.push({ where: "Summary", message: `Only ${summaryWords} words. Two or three sentences on what you do and your strongest result reads better.` });
  } else if (summaryWords > SUMMARY_WORDS.max) {
    hints.push({ where: "Summary", message: `${summaryWords} words. Recruiters skim, so aim for under ${SUMMARY_WORDS.max}.` });
  }

  for (const exp of data.experiences) {
    const where = [exp.jobTitle, exp.employer].filter(Boolean).join(" at ") || "Experience";
    const lines = (exp.description ?? "")
      .split(/\r?\n/)
      .map((line) => line.replace(BULLET_MARK, "").trim())
      .filter(Boolean);

    if (lines.length === 0) {
      hints.push({ where, message: "No description yet. Add two to four bullets on what you achieved." });
      continue;
    }
    if (!/\d/.test(exp.description)) {
      hints.push({ where, message: "No numbers. A %, an amount, a count or a time saved makes impact concrete." });
    }
    for (const line of lines) {
      const words = countWords(line);
      if (words > LONG_BULLET_WORDS) {
        hints.push({ where, message: `A ${words}-word bullet ("${line.slice(0, 40)}…"). Split it or trim to under ${LONG_BULLET_WORDS} words.` });
      }
      const weak = line.match(WEAK_OPENER);
      if (weak) {
        hints.push({ where, message: `"${weak[0]}" describes a duty. Start with what you did, e.g. "Led", "Cut", "Built".` });
      }
    }
  }

  return { wordCount: countWords(formatResumeDataForAts(data)), hints };
}
