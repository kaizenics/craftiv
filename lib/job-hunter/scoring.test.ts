import { describe, expect, it } from "vitest";

import { analyzeResumeData } from "@/lib/ats";
import type { ResumeDataJSON } from "@/db/schema/resumes";
import { evaluateTailoring, isScoreStale, scoreResumeAgainstJob } from "./scoring";

const JOB_DESCRIPTION = `
Virtual Assistant - Executive Support
We are hiring a virtual assistant to handle calendar management, inbox triage,
travel booking and CRM data entry. Experience with HubSpot, Google Workspace
and Asana is required. Strong written English and bookkeeping exposure a plus.
`;

function buildResume(overrides: Partial<ResumeDataJSON> = {}): ResumeDataJSON {
  return {
    contact: {
      firstName: "Maria",
      lastName: "Santos",
      desiredJobTitle: "Virtual Assistant",
      phone: "+63 900 000 0000",
      email: "maria@example.com",
    },
    summary: "Executive assistant with five years of remote support experience.",
    experiences: [
      {
        id: "exp-1",
        jobTitle: "Executive Assistant",
        employer: "Acme BPO",
        location: "Remote",
        startDate: "2021-01",
        endDate: "2025-06",
        isCurrentJob: false,
        description: "Managed calendars and booked travel for three executives.",
      },
    ],
    educations: [
      {
        id: "edu-1",
        schoolName: "University of the Philippines",
        location: "Manila",
        degree: "BS Business Administration",
        startDate: "2015-06",
        endDate: "2019-04",
        description: "",
      },
    ],
    skills: [
      { id: "s-1", name: "Calendar management", level: "Expert", showLevel: false },
    ],
    finalize: {
      languages: [],
      certifications: [],
      awards: [],
      websites: [],
      references: [],
      hobbies: [],
      customSections: [],
    },
    ...overrides,
  };
}

describe("scoreResumeAgainstJob", () => {
  it("returns the deterministic engine's own numbers without drift", () => {
    const resume = buildResume();

    const scored = scoreResumeAgainstJob(resume, JOB_DESCRIPTION);
    const direct = analyzeResumeData(resume, JOB_DESCRIPTION);

    expect(scored.score).toBe(direct.overallScore);
    expect(scored.report.matchedKeywords).toEqual(direct.matchedKeywords);
  });

  it("is deterministic - the same inputs always give the same score", () => {
    const resume = buildResume();

    expect(scoreResumeAgainstJob(resume, JOB_DESCRIPTION).score).toBe(
      scoreResumeAgainstJob(resume, JOB_DESCRIPTION).score,
    );
  });

  it("stamps the scoring version so old scores can be labelled, not silently mixed", () => {
    const scored = scoreResumeAgainstJob(buildResume(), JOB_DESCRIPTION);

    expect(scored.scoringVersion).toBe(scored.report.scoringVersion);
    expect(scored.scoringVersion).toBeTruthy();
  });

  it("scores a resume carrying the job's keywords above one that does not", () => {
    const aligned = buildResume({
      skills: [
        { id: "s-1", name: "HubSpot", level: "Advanced", showLevel: false },
        { id: "s-2", name: "Google Workspace", level: "Expert", showLevel: false },
        { id: "s-3", name: "Asana", level: "Advanced", showLevel: false },
        { id: "s-4", name: "Bookkeeping", level: "Intermediate", showLevel: false },
      ],
    });
    const unrelated = buildResume({
      summary: "Line cook with a decade in high-volume kitchens.",
      skills: [{ id: "s-1", name: "Knife skills", level: "Expert", showLevel: false }],
      experiences: [
        {
          id: "exp-1",
          jobTitle: "Line Cook",
          employer: "Bistro",
          location: "Cebu",
          startDate: "2019-01",
          endDate: "2025-01",
          isCurrentJob: false,
          description: "Prepared covers on the grill station.",
        },
      ],
    });

    expect(scoreResumeAgainstJob(aligned, JOB_DESCRIPTION).score).toBeGreaterThan(
      scoreResumeAgainstJob(unrelated, JOB_DESCRIPTION).score,
    );
  });

  it("surfaces job keywords the resume is missing", () => {
    const scored = scoreResumeAgainstJob(buildResume(), JOB_DESCRIPTION);

    expect(Array.isArray(scored.report.missingKeywords)).toBe(true);
    expect(scored.report.missingKeywords.length).toBeGreaterThan(0);
  });
});

describe("evaluateTailoring", () => {
  it("keeps a rewrite that raises the score", () => {
    const before = analyzeResumeData(buildResume(), JOB_DESCRIPTION);
    const after = analyzeResumeData(
      buildResume({
        skills: [
          { id: "s-1", name: "HubSpot", level: "Advanced", showLevel: false },
          { id: "s-2", name: "Google Workspace", level: "Expert", showLevel: false },
          { id: "s-3", name: "Asana", level: "Advanced", showLevel: false },
        ],
      }),
      JOB_DESCRIPTION,
    );

    const result = evaluateTailoring(before, after);

    expect(result.accepted).toBe(true);
    expect(result.impact.afterScore).toBeGreaterThan(result.impact.beforeScore);
  });

  /**
   * The property this guarantees: the model cannot lower a user's ATS score,
   * because a deterministic function it has no influence over decides whether
   * its output survives. It is also the prompt-injection defence.
   */
  it("discards a rewrite that lowers the score", () => {
    const before = analyzeResumeData(
      buildResume({
        skills: [
          { id: "s-1", name: "HubSpot", level: "Advanced", showLevel: false },
          { id: "s-2", name: "Google Workspace", level: "Expert", showLevel: false },
          { id: "s-3", name: "Asana", level: "Advanced", showLevel: false },
        ],
      }),
      JOB_DESCRIPTION,
    );
    const after = analyzeResumeData(
      buildResume({ summary: "", skills: [], experiences: [] }),
      JOB_DESCRIPTION,
    );

    expect(evaluateTailoring(before, after).accepted).toBe(false);
  });

  it("discards a rewrite that merely matches the original score", () => {
    const report = analyzeResumeData(buildResume(), JOB_DESCRIPTION);

    // No improvement is not worth spending the user's credits to keep.
    expect(evaluateTailoring(report, report).accepted).toBe(false);
  });
});

describe("isScoreStale", () => {
  it("is stale once the resume has been edited since scoring", () => {
    expect(isScoreStale(new Date("2026-08-01T00:00:00Z"), new Date("2026-08-02T00:00:00Z"))).toBe(
      true,
    );
  });

  it("is fresh when the resume has not changed", () => {
    const at = new Date("2026-08-01T00:00:00Z");
    expect(isScoreStale(at, at)).toBe(false);
  });

  it("ignores sub-second differences from SQLite timestamp rounding", () => {
    expect(
      isScoreStale(new Date("2026-08-01T00:00:00.000Z"), new Date("2026-08-01T00:00:00.400Z")),
    ).toBe(false);
  });
});
