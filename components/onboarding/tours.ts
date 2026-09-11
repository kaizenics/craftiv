import type { TourStep } from "@/components/onboarding/spotlight-tour";
import type { OnboardingTourKey } from "@/lib/onboarding";

/**
 * Steps are matched by `data-tour` attributes rather than class names or
 * structure, so restyling a page cannot silently leave a tour spotlighting the
 * wrong box -- it drops the step instead, which is visible in review.
 *
 * Copy is about what a thing is for and what it costs, not where it is: the
 * highlight already answers "where". Anything a person could have worked out by
 * reading the label is a step worth cutting.
 */
export const TOURS: Record<OnboardingTourKey, TourStep[]> = {
  dashboard: [
    {
      target: '[data-tour="action-plan"]',
      title: "Start here",
      body: "Five steps from a blank page to a sent application. Open any one to see what it involves and jump straight to it.",
    },
    {
      target: '[data-tour="quick-actions"]',
      title: "Shortcuts to the tools",
      body: "Once you have a resume, these take you straight to the ATS check, the AI rewrites, and cover letters.",
    },
    {
      target: '[data-tour="sidebar-nav"]',
      title: "Everything you make lives here",
      body: "Resumes, cover letters and tracked applications are all reachable from this menu at any time.",
    },
    {
      // Deliberately last, and deliberately specific about price: the starter
      // grant covers exactly one ATS check, so a user who learns the costs only
      // at the point of spending them has already been surprised.
      target: '[data-tour="credits"]',
      title: "What things cost",
      body: "Building, editing and downloading are free and unlimited. AI actions spend credits — an ATS check is 1, most rewrites are 0.25 to 0.5. You start with 1 credit.",
      // The pill sits in the sidebar; beside it keeps the bubble off the nav.
      placement: "right",
    },
  ],

  documents: [
    {
      target: '[data-tour="documents-new"]',
      title: "Every document starts here",
      body: "New resumes begin from a template. Cover letters are written against a resume you already have.",
    },
    {
      target: '[data-tour="documents-toolbar"]',
      title: "Find one fast",
      body: "Search by title, or filter to drafts and finished documents. Handy once you are tailoring a separate resume per role.",
    },
    {
      target: '[data-tour="documents-list"]',
      title: "Open, duplicate or export",
      body: "Each card has its own menu. Duplicating is the usual way to tailor a copy for one job without touching the original.",
    },
  ],

  "job-hunter": [
    {
      target: '[data-tour="jobhunter-intake"]',
      title: "Add jobs to score",
      body: "Paste a posting or a link, pick which resume to score it against, and Craftiv rates the match. Scoring is free and unlimited.",
    },
    {
      target: '[data-tour="jobhunter-views"]',
      title: "Jobs and scheduled hunts",
      body: "Scheduled hunts go and find postings for you on a timer, then score them the same way. There is a sample one under this tab; its results would land under Jobs.",
    },
    {
      target: '[data-tour="jobhunter-pipeline"]',
      title: "Every job, scored against your resume",
      body: "These are sample jobs. Open \u201cWhy this score?\u201d on any card to see matched and missing keywords, then move it through its status as you apply. Tailoring a resume and cover letter for one job costs 0.75 credits — only the jobs you act on.",
    },
  ],

  "ats-checker": [
    {
      target: '[data-tour="ats-setup"]',
      title: "Check a saved resume, or a file",
      body: "A saved resume is the more accurate route: it reads your structured data with no export or parsing step in between.",
    },
    {
      target: '[data-tour="ats-jobdesc"]',
      title: "Paste the job description",
      body: "Optional, but it is what turns a generic score into a match against the role you actually want. Shared with the AI Assistant.",
    },
    {
      target: '[data-tour="ats-report"]',
      title: "Your report appears here",
      body: "This one is a sample. A real report scores your resume overall and section by section, lists matched and missing keywords, and suggests specific rewrites. One check costs 1 credit.",
    },
  ],

  "ai-assistant": [
    {
      target: '[data-tour="assistant-context"]',
      title: "Set the target once",
      body: "The resume, role and job description here apply to all three tools, and carry over to the ATS Checker.",
    },
    {
      target: '[data-tour="assistant-tools"]',
      title: "Three tools, one target",
      body: "Rewrite sections, find keywords the posting wants, or turn duties into achievements. Each button shows what it costs before you spend it.",
    },
    {
      target: '[data-tour="assistant-results"]',
      title: "Nothing changes until you apply it",
      body: "This one is a sample. Real suggestions arrive as before-and-after blocks like these, with the projected ATS impact. Tick the ones you want and apply — the rest are discarded.",
    },
  ],
};
