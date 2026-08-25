/**
 * Length caps for caller-supplied strings that end up inside an AI prompt.
 *
 * Credit costs are per call, not per token, so an uncapped string is a way to
 * buy an arbitrarily large model call for a fixed price — megabytes of prompt
 * for a quarter of a credit. Rate limits bound the number of calls; these bound
 * the size of one. Every value is well clear of real usage: field labels are
 * short ("Experience 3 - Description"), job titles are a few words, and the
 * content limits match what the editor can produce.
 */
export const PROMPT_INPUT_LIMITS = {
  /** Field label from the spell-check panel, e.g. "Experience 3 - Description". */
  fieldLabel: 200,
  /** A job title. */
  targetRole: 200,
  /** Issue classifier from the spell-check panel, e.g. "spelling". */
  issueType: 64,
  /** A single section's text, matching the improveSection cap. */
  content: 3_000,
  /** A pasted job advert. */
  jobDescription: 5_000,
  /** Company and hiring-manager names on a cover letter. */
  name: 200,
  /** Candidate background pasted into the cover-letter generator. */
  candidateContext: 8_000,
  /** An existing draft being rewritten. */
  existingDraft: 8_000,
  /** Résumé text posted to the cover-letter generator. */
  resumeText: 12_000,
} as const;

/**
 * Ceiling on a tRPC request body.
 *
 * App Router handlers have no built-in body limit — unlike the Pages API, which
 * defaulted to 1MB — so without this a single request can stream unbounded data
 * into the process. Sized to clear the largest legitimate payload by a wide
 * margin: a resume save carries the contact photo as a base64 data URI.
 */
export const MAX_TRPC_REQUEST_BYTES = 2_000_000;
