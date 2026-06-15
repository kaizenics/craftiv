import assert from "node:assert/strict";
import { test } from "vitest";

import {
  analyzeResumeData,
  analyzeResumeText,
  ATS_SCORING_VERSION,
  buildAtsImpact,
  extractJobKeywords,
  findPlaceholderWarnings,
  formatResumeDataForAts,
} from "@/lib/ats";
import type { ResumeDataJSON } from "@/db/schema";

function createResumeData(): ResumeDataJSON {
  return {
    contact: {
      firstName: "Taylor",
      lastName: "Nguyen",
      desiredJobTitle: "Senior Frontend Engineer",
      phone: "555-111-2222",
      email: "taylor@example.com",
    },
    summary:
      "Frontend engineer with experience building React and Next.js products, improving accessibility, and partnering with cross-functional teams to ship customer-facing features.",
    experiences: [
      {
        id: "exp-1",
        jobTitle: "Frontend Engineer",
        employer: "Craftiv",
        location: "Remote",
        startDate: "2022-01",
        endDate: "",
        isCurrentJob: true,
        description:
          "• Built React and Next.js features for a job-search platform.\n• Improved page speed by 28% and reduced support tickets.\n• Collaborated with design and product on accessibility fixes.",
      },
    ],
    educations: [
      {
        id: "edu-1",
        schoolName: "State University",
        location: "Taipei",
        degree: "Bachelor of Science in Computer Science",
        startDate: "2016",
        endDate: "2020",
        description: "Graduated with honors.",
      },
    ],
    skills: [
      { id: "skill-1", name: "React", level: "Expert", showLevel: true },
      { id: "skill-2", name: "Next.js", level: "Advanced", showLevel: true },
      { id: "skill-3", name: "TypeScript", level: "Advanced", showLevel: true },
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
  };
}

test("extractJobKeywords keeps important phrases and canonical keywords", () => {
  const keywords = extractJobKeywords(`
    We need a React.js engineer with strong project management, stakeholder management,
    JavaScript expertise, and experience with Next.js and cross-functional teams.
  `);

  assert.equal(keywords.includes("project management"), true);
  assert.equal(keywords.includes("stakeholder management"), true);
  assert.equal(keywords.includes("react"), true);
  // Characterizes current behavior: extractJobKeywords splits "Next.js" into the token
  // "next" (the "." is normalized to a space and "js" is dropped as too short). The
  // "next.js" synonym only applies in the matching path (analyzeResumeText), not here.
  assert.equal(keywords.includes("next"), true);
});

test("analyzeResumeText matches synonym variants and returns scoring metadata", () => {
  const report = analyzeResumeText({
    resumeText: `
      Summary
      Senior engineer focused on React.js applications and Amazon Web Services deployments.

      Experience
      • Led cross-functional delivery for customer-facing products.

      Skills
      JS, React.js, AWS

      Education
      Bachelor of Science 2020
    `,
    jobDescription: "React AWS JavaScript cross-functional delivery",
  });

  assert.equal(report.matchedKeywords.includes("react"), true);
  assert.equal(report.matchedKeywords.includes("aws"), true);
  assert.equal(report.matchedKeywords.includes("javascript"), true);
  assert.equal(report.scoringVersion, ATS_SCORING_VERSION);
});

test("placeholder warnings are detected and cap high scores", () => {
  const placeholderWarnings = findPlaceholderWarnings("Improved conversion by [X%] across [X users].");
  assert.equal(placeholderWarnings.length > 0, true);

  const report = analyzeResumeText({
    resumeText: `
      Contact
      Taylor Nguyen
      taylor@example.com

      Summary
      Built scalable platforms with [X%] growth.

      Experience
      • Built products with [X users].
      • Improved results by 25%.

      Skills
      React, Next.js, TypeScript, AWS, SQL

      Education
      Bachelor degree 2020
    `,
    jobDescription: "React Next.js TypeScript AWS SQL leadership",
  });

  assert.equal(report.placeholderWarnings.length > 0, true);
  assert.equal(report.overallScore < 80, true);
  assert.notEqual(report.atsCompatibility, "High");
});

test("structured resume analysis stays aligned with ATS text formatting", () => {
  const data = createResumeData();
  const fromData = analyzeResumeData(data, "React Next.js accessibility product collaboration");
  const fromText = analyzeResumeText({
    resumeText: formatResumeDataForAts(data),
    jobDescription: "React Next.js accessibility product collaboration",
  });

  assert.equal(Math.abs(fromData.overallScore - fromText.overallScore) <= 2, true);
  assert.deepEqual(fromData.missingKeywords, fromText.missingKeywords);
});

test("buildAtsImpact reports score delta, section changes, and new keyword matches", () => {
  const before = analyzeResumeData(createResumeData(), "React Next.js accessibility leadership");
  const improved = createResumeData();
  improved.summary = `${improved.summary} Leadership in accessibility and stakeholder management.`;
  const after = analyzeResumeData(improved, "React Next.js accessibility leadership stakeholder management");

  const impact = buildAtsImpact(before, after);

  assert.equal(impact.afterScore >= impact.beforeScore, true);
  assert.equal(impact.changedSections.includes("Keyword Match") || impact.changedSections.includes("Summary"), true);
  assert.equal(
    impact.matchedKeywordsAdded.includes("leadership") || impact.matchedKeywordsAdded.includes("stakeholder management"),
    true,
  );
});
