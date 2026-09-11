/**
 * Credit costs and conversions, kept free of server-only imports so client
 * components can price actions from the same constants the API charges with.
 *
 * `lib/credits.ts` re-exports everything here, so existing server imports are
 * unaffected and the two can never drift apart.
 */

export const CREDIT_UNITS_PER_CREDIT = 100;

// Resume and cover-letter downloads are unlimited and free on every tier, so they
// have no cost constant and no entry in SERVER_CREDIT_COSTS.
export const COVER_LETTER_AI_SESSION_COST = 50;
export const ATS_CHECK_COST = 100;
export const AI_RESUME_IMPROVER_COST = 50;
export const AI_KEYWORD_BOOSTER_COST = 25;
export const AI_ACHIEVEMENT_BUILDER_COST = 25;
export const RESUME_LAYOUT_CHAT_COST = 25;
export const CHATBOT_STREAM_COST = 10;
export const AI_SPELL_CHECK_COST = 25;
export const AI_SUGGESTION_COST = 25;
export const AI_COVER_LETTER_COST = 50;

/**
 * Tailoring one job in the Job Hunter: a resume rewrite plus a matching cover
 * letter, from a single model call.
 *
 * Priced below the 50 + 50 the two standalone tools would cost, because it is
 * one call rather than two and because a user who tailors a resume for a job
 * always wants the letter with it -- charging the sum would tax the intended
 * flow. Discovery, scoring and re-scoring stay free: they are deterministic,
 * which is what lets a user score two hundred jobs and pay only for the few
 * they act on.
 */
export const JOB_TAILOR_COST = 75;

export function toCreditUnits(credits: number): number {
  return Math.round(credits * CREDIT_UNITS_PER_CREDIT);
}

export function fromCreditUnits(units: number): number {
  return units / CREDIT_UNITS_PER_CREDIT;
}

export function formatCreditValue(units: number): string {
  const credits = fromCreditUnits(units);
  return Number.isInteger(credits) ? String(credits) : credits.toFixed(2).replace(/\.?0+$/, "");
}

/**
 * The priced actions worth showing a user, most expensive first.
 *
 * The settings page used to advertise "0.5 credit each" for every AI session,
 * but real costs span 0.10 to 1.00 credits, so anyone budgeting against that
 * single rate was told they could afford roughly twice the ATS checks they can.
 */
export const CREDIT_ACTIONS: {
  id: string;
  label: string;
  detail: string;
  costUnits: number;
}[] = [
  {
    id: "ats_check",
    label: "ATS check",
    detail: "Full report with section scores",
    costUnits: ATS_CHECK_COST,
  },
  {
    id: "job_tailor",
    label: "Tailor for a job",
    detail: "Resume rewrite plus a matching cover letter",
    costUnits: JOB_TAILOR_COST,
  },
  {
    id: "ai_resume_improver",
    label: "Resume Improver",
    detail: "Rewrite a section or the whole resume",
    costUnits: AI_RESUME_IMPROVER_COST,
  },
  {
    id: "ai_cover_letter",
    label: "Cover letter",
    detail: "Generate a tailored letter",
    costUnits: AI_COVER_LETTER_COST,
  },
  {
    id: "ai_keyword_booster",
    label: "Keyword Booster",
    detail: "Find missing job-description terms",
    costUnits: AI_KEYWORD_BOOSTER_COST,
  },
  {
    id: "ai_achievement_builder",
    label: "Achievement Builder",
    detail: "Turn duties into accomplishments",
    costUnits: AI_ACHIEVEMENT_BUILDER_COST,
  },
];

/** The priciest single action, used as the yardstick for a low balance. */
export const MOST_EXPENSIVE_ACTION_UNITS = Math.max(
  ...CREDIT_ACTIONS.map((action) => action.costUnits)
);

export type CreditBalanceState = "empty" | "low" | "healthy";

/**
 * `empty` means literally nothing left -- a balance of 0.5 can still pay for a
 * Keyword Booster, so it must not be reported as empty. `low` is deliberately
 * generous, starting once the balance no longer covers three of the priciest
 * action, which is where a user should top up rather than be surprised
 * mid-flow.
 */
export function creditBalanceState(credits: number): CreditBalanceState {
  const units = toCreditUnits(credits);
  if (units <= 0) return "empty";
  if (units < MOST_EXPENSIVE_ACTION_UNITS * 3) return "low";
  return "healthy";
}

/** How many times an action is affordable at the given balance. */
export function affordableCount(credits: number, costUnits: number): number {
  if (costUnits <= 0) return 0;
  return Math.floor(toCreditUnits(credits) / costUnits);
}
