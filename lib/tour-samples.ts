import type { AtsImpact } from "@/lib/ats";
import type { AtsCheckReport } from "@/lib/types/ats-report";

/**
 * Finished results shown in place of an empty results panel while a page's
 * guided tour is running, so the tour can point at what the tool produces
 * rather than at a blank "your report will appear here".
 *
 * Nothing here is saved or sent anywhere, and none of the panels it is rendered
 * into carry actions, so there is nothing a sample can trigger.
 */

/**
 * Deliberately a middling score. A near-perfect sample would show nothing
 * worth fixing; a middling one shows the parts people actually use -- the
 * "do this first", the weak sections, the missing keywords.
 */
export const SAMPLE_ATS_REPORT: AtsCheckReport = {
  overallScore: 72,
  atsCompatibility: "Medium",
  summary:
    "Organised executive assistant with remote support experience across calendars, inboxes and CRM upkeep. The resume reads cleanly, but most bullets describe duties rather than results, and several terms the role asks for never appear.",
  strengths: [
    "Clean single-column layout that tracking systems read in order",
    "Recent, relevant remote assistant experience",
    "Tools listed plainly rather than hidden in graphics",
  ],
  matchedKeywords: [
    "calendar management",
    "CRM",
    "client communication",
    "scheduling",
    "Google Workspace",
    "email management",
  ],
  missingKeywords: ["reporting", "HubSpot", "travel coordination", "meeting minutes", "project tracking"],
  topActions: [
    "Add a line on the reports you prepared, and who read them",
    "Name the CRM you used rather than saying “CRM”",
    "Mention travel or meeting coordination if you have done it",
  ],
  rewrittenSummary:
    "Executive assistant supporting remote leadership teams across calendar management, client communication and CRM upkeep, keeping weekly priorities and reporting on schedule.",
  sectionScores: [
    { section: "Keyword Match", score: 58, notes: "6 of the role's 11 key terms appear in your resume." },
    { section: "Experience", score: 69, notes: "Relevant, but described as duties rather than outcomes." },
    { section: "Skills", score: 81, notes: "Tools are listed clearly and match most of the posting." },
    { section: "Formatting", score: 92, notes: "Reads in the right order with no parsing problems." },
  ],
  improvements: [
    {
      title: "Turn duties into outcomes",
      why: "Recruiters skim for what changed because of you, not for a list of tasks.",
      example: "Kept three executives' calendars conflict-free across time zones.",
    },
    {
      title: "Use the posting's own words",
      why: "Tracking systems match terms literally, so “reports” and “reporting” can score differently.",
      example: "Prepared the weekly reporting pack for the leadership team.",
    },
    {
      title: "Name your tools",
      why: "“CRM” matches fewer searches than the product a recruiter actually filters on.",
      example: "Maintained client records in HubSpot.",
    },
  ],
  // Empty on purpose: warnings render as alarming red panels, which is not what
  // a first look at the tool should be.
  placeholderWarnings: [],
  parseWarnings: [],
  scoringVersion: "sample",
};

/**
 * A before/after from the Resume Improver. The rewrites add no figures that
 * are not in the original -- a sample that showed the AI inventing metrics
 * would teach people to expect, and trust, exactly that.
 */
export const SAMPLE_REWRITE: {
  blocks: { label: string; before: string; after: string }[];
  impact: AtsImpact;
} = {
  blocks: [
    {
      label: "Experience 1 · Executive Assistant",
      before: "Helped my manager with schedules, emails, CRM updates, and weekly tasks.",
      after:
        "Coordinated executive calendars, client communication and CRM updates for a remote leadership team, keeping weekly priorities on schedule.",
    },
    {
      label: "Experience 2 · Customer Support",
      before: "- Answered customer emails\n- Handled complaints\n- Updated the help desk",
      after:
        "- Resolved customer enquiries by email from first reply to close\n- De-escalated complaints and flagged recurring issues to the product team\n- Kept help desk records complete so any agent could pick up a case",
    },
  ],
  impact: {
    beforeScore: 64,
    afterScore: 78,
    changedSections: ["Experience"],
    matchedKeywordsAdded: ["calendar management", "client communication", "CRM"],
    warnings: [],
  },
};
