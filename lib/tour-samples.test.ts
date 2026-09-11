import assert from "node:assert/strict";
import { test } from "vitest";

import { SAMPLE_ATS_REPORT, SAMPLE_REWRITE } from "@/lib/tour-samples";

const numbersIn = (text: string) => text.match(/\d+(?:[.,]\d+)?/g) ?? [];

test("the sample rewrite invents no figures the original did not have", () => {
  // A sample that showed the AI adding made-up metrics would teach people to
  // expect and trust exactly that.
  for (const block of SAMPLE_REWRITE.blocks) {
    const original = new Set(numbersIn(block.before));
    for (const figure of numbersIn(block.after)) {
      assert.ok(original.has(figure), `"${block.label}" rewrite introduced ${figure}`);
    }
    assert.notEqual(block.after.trim(), block.before.trim(), `"${block.label}" did not change`);
  }
});

test("the sample rewrite shows an improvement, not a regression", () => {
  const { beforeScore, afterScore, warnings } = SAMPLE_REWRITE.impact;
  assert.ok(afterScore > beforeScore);
  assert.equal(warnings.length, 0, "warnings block Apply, which a sample should not show");
});

test("the sample report is a middling, warning-free score with something to fix", () => {
  const report = SAMPLE_ATS_REPORT;
  assert.ok(report.overallScore >= 60 && report.overallScore < 80, "should land in the middle band");
  assert.equal(report.placeholderWarnings.length, 0);
  assert.equal(report.parseWarnings.length, 0);
  assert.ok(report.missingKeywords.length > 0);
  assert.ok(report.topActions.length > 0);
  assert.ok(report.improvements.every((item) => item.example.trim().length > 0));
  for (const section of report.sectionScores) {
    assert.ok(section.score >= 0 && section.score <= 100, `${section.section} out of range`);
  }
});

test("the sample report never claims a real scoring run", () => {
  assert.equal(SAMPLE_ATS_REPORT.scoringVersion, "sample");
});
