import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ResumeDataJSON } from "@/db/schema/resumes";

const callWithFallback = vi.fn();

vi.mock("@/lib/ai", () => ({
  callWithFallback: (...args: unknown[]) => callWithFallback(...args),
  extractJsonObject: (raw: string) => {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  },
}));

const { TailorError, tailorResumeForJob } = await import("./tailor");

const JOB_DESCRIPTION = `
Virtual Assistant - Executive Support. We need calendar management, inbox triage,
travel booking and CRM data entry. HubSpot, Google Workspace and Asana required.
`;

function buildResume(): ResumeDataJSON {
  return {
    contact: {
      firstName: "Maria",
      lastName: "Santos",
      desiredJobTitle: "Virtual Assistant",
      phone: "+63 900 000 0000",
      email: "maria@example.com",
    },
    summary: "Assistant with remote support experience.",
    experiences: [
      {
        id: "exp-1",
        jobTitle: "Executive Assistant",
        employer: "Acme BPO",
        location: "Remote",
        startDate: "2021-01",
        endDate: "2025-06",
        isCurrentJob: false,
        description: "Handled scheduling.",
      },
      {
        id: "exp-2",
        jobTitle: "Admin Assistant",
        employer: "Beta Corp",
        location: "Manila",
        startDate: "2019-01",
        endDate: "2020-12",
        isCurrentJob: false,
        description: "Filed documents.",
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
    skills: [{ id: "s-1", name: "Scheduling", level: "Expert", showLevel: false }],
    finalize: {
      languages: [],
      certifications: [],
      awards: [],
      websites: [],
      references: [],
      hobbies: [],
      customSections: [],
    },
  };
}

function respond(payload: unknown) {
  callWithFallback.mockResolvedValue({
    content: JSON.stringify(payload),
    model: "test-model",
  });
}

/** A rewrite that genuinely adds the advert's keywords, so it scores higher. */
function improvingResponse() {
  return {
    resume: {
      summary:
        "Executive assistant supporting calendar management, inbox triage, travel booking and CRM data entry in HubSpot, Google Workspace and Asana.",
      experiences: [
        {
          id: "exp-1",
          description:
            "Owned calendar management and inbox triage, coordinated travel booking, and maintained CRM data entry in HubSpot across Google Workspace and Asana.",
        },
      ],
    },
    coverLetter: "I am writing to apply for the executive support role.",
    summaryOfChanges: ["Reworked the summary around the advert's tools"],
  };
}

beforeEach(() => {
  callWithFallback.mockReset();
});

describe("tailorResumeForJob", () => {
  it("accepts a rewrite that raises the score and reports the impact", async () => {
    respond(improvingResponse());

    const result = await tailorResumeForJob({
      resumeData: buildResume(),
      jobTitle: "Virtual Assistant",
      companyName: "Acme",
      jobDescription: JOB_DESCRIPTION,
    });

    expect(result.accepted).toBe(true);
    expect(result.impact.afterScore).toBeGreaterThan(result.impact.beforeScore);
    expect(result.coverLetter).toContain("executive support");
  });

  /**
   * The core guarantee: the model cannot touch employment history. The schema
   * accepts only narrative fields, so anything else it emits is discarded
   * before it can reach a stored resume.
   */
  it("ignores any attempt to rewrite employers, dates or contact details", async () => {
    respond({
      resume: {
        summary: "Calendar management, inbox triage, HubSpot, Asana, Google Workspace, CRM.",
        contact: { firstName: "Somebody", lastName: "Else", email: "attacker@evil.test" },
        experiences: [
          {
            id: "exp-1",
            employer: "Fabricated Employer",
            jobTitle: "Chief Executive",
            startDate: "2010-01",
            description: "Ran calendar management and CRM data entry in HubSpot.",
          },
        ],
      },
      coverLetter: "Letter body.",
    });

    const result = await tailorResumeForJob({
      resumeData: buildResume(),
      jobTitle: "VA",
      companyName: "Acme",
      jobDescription: JOB_DESCRIPTION,
    });

    const experience = result.resumeData.experiences[0];
    expect(experience.employer).toBe("Acme BPO");
    expect(experience.jobTitle).toBe("Executive Assistant");
    expect(experience.startDate).toBe("2021-01");
    expect(result.resumeData.contact.firstName).toBe("Maria");
    expect(result.resumeData.contact.email).toBe("maria@example.com");
    // The narrative field it was allowed to change did change.
    expect(experience.description).toContain("HubSpot");
  });

  it("matches experiences by id, so a reordered response cannot cross-contaminate", async () => {
    respond({
      resume: {
        summary: "HubSpot, Asana, Google Workspace, calendar management, CRM data entry.",
        experiences: [
          { id: "exp-2", description: "Second job rewritten." },
          { id: "exp-1", description: "First job rewritten with HubSpot and Asana." },
        ],
      },
      coverLetter: "Letter.",
    });

    const result = await tailorResumeForJob({
      resumeData: buildResume(),
      jobTitle: "VA",
      companyName: "Acme",
      jobDescription: JOB_DESCRIPTION,
    });

    expect(result.resumeData.experiences[0].description).toBe(
      "First job rewritten with HubSpot and Asana.",
    );
    expect(result.resumeData.experiences[1].description).toBe("Second job rewritten.");
  });

  it("drops an entry whose id does not exist in the resume", async () => {
    respond({
      resume: {
        summary: "HubSpot, Asana, Google Workspace, calendar management, CRM data entry.",
        experiences: [{ id: "exp-does-not-exist", description: "Injected role." }],
      },
      coverLetter: "Letter.",
    });

    const result = await tailorResumeForJob({
      resumeData: buildResume(),
      jobTitle: "VA",
      companyName: "Acme",
      jobDescription: JOB_DESCRIPTION,
    });

    expect(result.resumeData.experiences).toHaveLength(2);
    expect(JSON.stringify(result.resumeData)).not.toContain("Injected role.");
  });

  /**
   * The deterministic scorer arbitrates. A rewrite that strips the resume back
   * scores worse, and the caller refunds rather than saving it.
   */
  it("reports a rewrite that lowers the score as not accepted", async () => {
    respond({
      resume: {
        summary: "",
        experiences: [
          { id: "exp-1", description: "x" },
          { id: "exp-2", description: "x" },
        ],
      },
      coverLetter: "Letter.",
    });

    const result = await tailorResumeForJob({
      resumeData: buildResume(),
      jobTitle: "VA",
      companyName: "Acme",
      jobDescription: JOB_DESCRIPTION,
    });

    expect(result.accepted).toBe(false);
  });

  it("throws INVALID_RESPONSE when the model returns an unreadable body", async () => {
    callWithFallback.mockResolvedValue({ content: "sorry, I cannot do that", model: "m" });

    await expect(
      tailorResumeForJob({
        resumeData: buildResume(),
        jobTitle: "VA",
        companyName: "Acme",
        jobDescription: JOB_DESCRIPTION,
      }),
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });

  it("throws INVALID_RESPONSE when the JSON is missing required fields", async () => {
    respond({ resume: { summary: "ok" } }); // no coverLetter

    await expect(
      tailorResumeForJob({
        resumeData: buildResume(),
        jobTitle: "VA",
        companyName: "Acme",
        jobDescription: JOB_DESCRIPTION,
      }),
    ).rejects.toBeInstanceOf(TailorError);
  });

  it("sends the advert to the model fenced as untrusted data", async () => {
    respond(improvingResponse());

    await tailorResumeForJob({
      resumeData: buildResume(),
      jobTitle: "VA",
      companyName: "Acme",
      jobDescription: JOB_DESCRIPTION,
    });

    const prompt = callWithFallback.mock.calls[0][0].messages[0].content as string;
    expect(prompt).toContain("untrusted third-party text");
    expect(prompt).toContain("END JOB ADVERT");
  });
});
