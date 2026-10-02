import type { inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "@/trpc/root";

type RouterOutputs = inferRouterOutputs<AppRouter>;

/**
 * Typed by what the API actually returns, not by a hand-copied interface, so a
 * change to `listMatches` or `listHunts` breaks the sample data at compile time
 * instead of leaving it rendering stale fields in production.
 */
export type DemoMatch = RouterOutputs["jobHunter"]["listMatches"][number];
export type DemoHunt = RouterOutputs["jobHunter"]["listHunts"][number];

/**
 * Every sample record carries this prefix. Guards check the id rather than a
 * page-level "demo mode" flag, so an action on a sample job is refused even if
 * that flag were ever computed wrong -- a sample id must never reach the API.
 */
export const DEMO_ID_PREFIX = "demo-";

export function isDemoId(id: string | null | undefined): boolean {
  return typeof id === "string" && id.startsWith(DEMO_ID_PREFIX);
}

const DEMO_RESUME_ID = `${DEMO_ID_PREFIX}resume`;

type Seed = {
  title: string;
  company: string;
  location: string;
  employmentType: string;
  salaryText: string;
  hoursPerWeek: string;
  score: number;
  applicationStatus: DemoMatch["applicationStatus"];
  hoursAgo: number;
  matched: string[];
  missing: string[];
  strengths: string[];
  topActions: string[];
  description: string;
};

/**
 * Chosen to show the range a real pipeline has: a strong match, a middling one
 * and a weak one, spread across several stages so the status tabs and the board
 * both have something in more than one place. The companies are invented, and
 * none of them links anywhere.
 */
const SEEDS: Seed[] = [
  {
    title: "Executive Virtual Assistant",
    company: "Northstar Commerce",
    location: "Remote",
    employmentType: "Full-time",
    salaryText: "$6–8 / hour",
    hoursPerWeek: "40",
    score: 86,
    applicationStatus: "new",
    hoursAgo: 3,
    matched: ["calendar management", "CRM", "client communication", "reporting", "Google Workspace", "scheduling"],
    missing: ["HubSpot", "travel booking"],
    strengths: ["Direct executive support experience", "Tooling overlaps almost entirely"],
    topActions: ["Mention any HubSpot or similar CRM you have used", "Add one line on travel coordination"],
    description:
      "Support a small leadership team with calendar management, inbox triage, CRM updates and a weekly status report. You will coordinate across time zones and keep priorities moving without close supervision.",
  },
  {
    title: "Project Coordinator",
    company: "Lumen Studio",
    location: "Remote",
    employmentType: "Full-time",
    salaryText: "$1,200 / month",
    hoursPerWeek: "40",
    score: 81,
    applicationStatus: "interviewing",
    hoursAgo: 96,
    matched: ["project tracking", "stakeholder updates", "Asana", "deadlines", "documentation"],
    missing: ["budget tracking", "Jira"],
    strengths: ["Clear record of keeping projects on schedule"],
    topActions: ["Quantify how many projects you ran at once"],
    description:
      "Keep client projects on track across a design team: maintain timelines in Asana, run weekly check-ins, and make sure nothing slips between handoffs.",
  },
  {
    title: "Customer Support Specialist",
    company: "Brightline Health",
    location: "Remote (US hours)",
    employmentType: "Part-time",
    salaryText: "$5 / hour",
    hoursPerWeek: "20–30",
    score: 74,
    applicationStatus: "saved",
    hoursAgo: 30,
    matched: ["customer support", "email support", "ticketing", "empathy"],
    missing: ["Zendesk", "live chat", "healthcare"],
    strengths: ["Strong written communication"],
    topActions: ["Name the ticketing tools you have used", "Add response-time or satisfaction numbers"],
    description:
      "Answer patient questions by email and chat, log every conversation in the help desk, and escalate billing issues to the right team.",
  },
  {
    title: "Operations Coordinator",
    company: "Harbor & Finch",
    location: "Hybrid · Manila",
    employmentType: "Full-time",
    salaryText: "",
    hoursPerWeek: "40",
    score: 68,
    applicationStatus: "applied",
    hoursAgo: 168,
    matched: ["operations", "vendor coordination", "spreadsheets"],
    missing: ["inventory management", "SAP", "logistics", "purchase orders"],
    strengths: ["Organised, process-minded background"],
    topActions: ["Show any inventory or supply-chain exposure", "Add the systems you have administered"],
    description:
      "Coordinate vendors, track purchase orders and keep inventory records accurate for a growing retail operation.",
  },
  {
    title: "Data Entry Associate",
    company: "Pinecrest Logistics",
    location: "Remote",
    employmentType: "Contract",
    salaryText: "$4 / hour",
    hoursPerWeek: "flexible",
    score: 52,
    applicationStatus: "new",
    hoursAgo: 8,
    matched: ["data entry", "accuracy"],
    missing: ["shipping documents", "10-key", "WMS", "customs forms", "EDI"],
    strengths: ["Attention to detail"],
    topActions: ["Only worth tailoring if you have logistics paperwork experience"],
    description:
      "Enter shipment and customs data from scanned documents into the warehouse system with a high accuracy target.",
  },
];

/** Sample matches, dated relative to now so they read as recent. */
export function buildDemoMatches(now: Date = new Date()): DemoMatch[] {
  return SEEDS.map((seed, index) => {
    const created = new Date(now.getTime() - seed.hoursAgo * 3_600_000);
    const applied =
      seed.applicationStatus === "applied" || seed.applicationStatus === "interviewing"
        ? created
        : null;

    return {
      id: `${DEMO_ID_PREFIX}match-${index + 1}`,
      score: seed.score,
      pipelineStatus: "scored",
      applicationStatus: seed.applicationStatus,
      matchedKeywords: seed.matched,
      missingKeywords: seed.missing,
      sectionScores: [
        { section: "Keyword Match", score: Math.min(100, seed.score + 4), notes: `${seed.matched.length} of the posting's terms appear in your resume.` },
        { section: "Experience", score: seed.score, notes: "Measured against the responsibilities in the posting." },
        { section: "Formatting", score: 90, notes: "Reads cleanly for applicant tracking systems." },
      ],
      strengths: seed.strengths,
      topActions: seed.topActions,
      resumeId: DEMO_RESUME_ID,
      tailoredResumeId: null,
      tailoredCoverLetterId: null,
      scoredAt: created,
      resumeVersionAt: created,
      notes: "",
      appliedAt: applied,
      createdAt: created,
      posting: {
        id: `${DEMO_ID_PREFIX}posting-${index + 1}`,
        title: seed.title,
        company: seed.company,
        location: seed.location,
        source: "manual",
        // Deliberately empty: a sample card must not link to a real site.
        url: "",
        applyUrl: "",
        salaryText: seed.salaryText,
        hoursPerWeek: seed.hoursPerWeek,
        employmentType: seed.employmentType,
        description: seed.description,
        descriptionTruncated: false,
        postedAt: created,
        archivedAt: null,
      },
    };
  });
}

/** One scheduled hunt, so the "Scheduled hunts" tab is not empty either. */
export function buildDemoHunts(now: Date = new Date()): DemoHunt[] {
  return [
    {
      id: `${DEMO_ID_PREFIX}hunt-1`,
      name: "Remote assistant roles",
      query: "virtual assistant",
      location: "",
      sources: [],
      resumeId: DEMO_RESUME_ID,
      isActive: true,
      frequency: "daily",
      runAtMinuteUtc: 360,
      emailDigest: true,
      lastRunAt: new Date(now.getTime() - 18 * 3_600_000),
      nextRunAt: new Date(now.getTime() + 6 * 3_600_000),
      minScore: 60,
    },
  ];
}
