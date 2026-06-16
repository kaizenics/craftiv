import assert from "node:assert/strict";
import { test } from "vitest";

import {
  formatResumeDataAsText,
  getBulletLines,
  parseContentBlocks,
} from "@/lib/ai-resume-content";

test("parseContentBlocks honours explicit labels and falls back otherwise", () => {
  assert.deepEqual(parseContentBlocks("Summary:\nHello world", "Section"), [
    { label: "Summary", value: "Hello world" },
  ]);
  assert.deepEqual(parseContentBlocks("one block", "Section"), [
    { label: "Section", value: "one block" },
  ]);
  assert.deepEqual(parseContentBlocks("a\n\nb", "Section"), [
    { label: "Section 1", value: "a" },
    { label: "Section 2", value: "b" },
  ]);
  assert.deepEqual(parseContentBlocks("   ", "Section"), []);
});

test("getBulletLines trims lines and strips bullet glyphs", () => {
  assert.deepEqual(getBulletLines("- first\n• second\n*third\n\n  "), ["first", "second", "third"]);
});

test("formatResumeDataAsText renders summary, experience, and education sections", () => {
  const text = formatResumeDataAsText({
    summary: "A summary",
    experiences: [
      { jobTitle: "Eng", employer: "Acme", description: "Built things" },
      { jobTitle: "", employer: "", description: "   " }, // skipped (blank description)
    ],
    educations: [{ degree: "BSc", schoolName: "Uni", description: "Graduated" }],
  });
  assert.equal(text, "Summary:\nA summary\n\nEng at Acme:\nBuilt things\n\nBSc at Uni:\nGraduated");
});
