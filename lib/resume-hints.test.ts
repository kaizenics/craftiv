import { expect, test } from "vitest";

import { createSampleResumeForTemplate } from "@/lib/data/templates";
import { analyzeResumeWriting } from "@/lib/resume-hints";

const sample = () => createSampleResumeForTemplate("harvard");

test("flags long bullets, missing numbers, weak openers and an empty role", () => {
  const data = sample();
  data.experiences = [
    {
      ...data.experiences[0],
      jobTitle: "Designer",
      employer: "Acme",
      description: `- Responsible for the design system\n- ${"word ".repeat(32).trim()}`,
    },
    { ...data.experiences[1], jobTitle: "Intern", employer: "Globex", description: "" },
  ];
  const messages = analyzeResumeWriting(data).hints.map((hint) => `${hint.where}: ${hint.message}`);

  expect(messages.some((m) => m.startsWith("Designer at Acme: No numbers"))).toBe(true);
  expect(messages.some((m) => m.includes("32-word bullet"))).toBe(true);
  expect(messages.some((m) => m.includes('"Responsible for" describes a duty'))).toBe(true);
  expect(messages.some((m) => m.startsWith("Intern at Globex: No description yet"))).toBe(true);
});

test("a tight, quantified role and summary produce no hints", () => {
  const data = sample();
  data.summary = "Product designer with eight years shipping consumer apps. ".repeat(5);
  data.experiences = [{ ...data.experiences[0], description: "- Led a redesign that lifted sign-ups 40%\n- Cut support tickets by 25%" }];
  const { hints, wordCount } = analyzeResumeWriting(data);

  expect(hints).toEqual([]);
  expect(wordCount).toBeGreaterThan(0);
});
