import assert from "node:assert/strict";
import { test } from "vitest";

import {
  isThinImport,
  looksLikeLinkedInExport,
  normalizeAiResume,
} from "@/lib/resume-import/ai-parse";
import { parseResumeText } from "@/lib/resume-import/parse-resume-text";

const LINKEDIN_EXPORT = `Contact
ada@example.com
www.linkedin.com/in/ada-lovelace (LinkedIn)
Top Skills
Analysis
Mathematics
Ada Lovelace
Analyst at Analytical Engines Ltd
London
Summary
First programmer.
Experience
Analytical Engines Ltd
Analyst
January 1842 - Present
Education
University of London
Mathematics`;

test("recognises a LinkedIn Save-to-PDF export", () => {
  assert.equal(looksLikeLinkedInExport(LINKEDIN_EXPORT), true);
});

test("an ordinary resume that only links to LinkedIn is not an export", () => {
  const text = `Ada Lovelace\nada@example.com · linkedin.com/in/ada\nEXPERIENCE\nAnalyst, Engines Ltd\nEDUCATION\nUniversity of London`;
  assert.equal(looksLikeLinkedInExport(text), false);
});

test("a resume with no work history counts as thin", () => {
  const data = parseResumeText("Ada Lovelace\nada@example.com\nSkills\nMathematics", { source: "pdf" });
  assert.equal(isThinImport(data), true);
});

test("normalizes model output into the import shape", () => {
  const data = normalizeAiResume({
    contact: { firstName: "Ada", lastName: "Lovelace", email: "ada@example.com", desiredJobTitle: "Analyst" },
    summary: "First programmer.",
    experiences: [
      {
        jobTitle: "Analyst",
        employer: "Analytical Engines Ltd",
        startDate: "Jan 2019",
        endDate: "2020-05",
        isCurrentJob: true,
        description: "• Wrote the first algorithm",
      },
    ],
    educations: [{ schoolName: "University of London", degree: "Mathematics", startDate: "2015" }],
    skills: [{ name: "Mathematics" }, { name: "" }],
    languages: [{ name: "French", proficiency: "Expert" }],
    websites: [{ label: "LinkedIn", url: "https://linkedin.com/in/ada" }],
  });

  assert.ok(data);
  assert.equal(data.contact.firstName, "Ada");
  assert.equal(data.experiences[0].startDate, "2019-01");
  // A current role has no end date, whatever the model said.
  assert.equal(data.experiences[0].endDate, "");
  assert.equal(data.educations[0].startDate, "2015");
  assert.deepEqual(data.skills.map((skill) => skill.name), ["Mathematics"]);
  // Unknown proficiency levels fall back to a valid one.
  assert.equal(data.finalize.languages[0].proficiency, "Fluent");
  assert.ok(data.experiences[0].id && data.skills[0].id);
});

test("drops an invalid email instead of failing the import", () => {
  const data = normalizeAiResume({ contact: { firstName: "Ada", email: "not an email" } });
  assert.ok(data);
  assert.equal(data.contact.email, "");
});

test("rejects output that isn't an object", () => {
  assert.equal(normalizeAiResume(null), null);
  assert.equal(normalizeAiResume("resume"), null);
});
