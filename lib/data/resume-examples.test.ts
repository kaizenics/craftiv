import { describe, expect, it } from "vitest";

import { resumeExamples } from "./resume-examples";
import { templates } from "./templates";

describe("resumeExamples", () => {
  it("has unique slugs and known templates", () => {
    const slugs = resumeExamples.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const e of resumeExamples) expect(templates.some((t) => t.id === e.templateId)).toBe(true);
  });

  it("keeps meta descriptions within the search snippet length", () => {
    for (const e of resumeExamples) expect(e.description.length).toBeLessThanOrEqual(160);
  });

  it("stores dates in the builder's MM/YYYY format", () => {
    for (const e of resumeExamples) {
      for (const exp of e.resume.experiences) {
        expect(exp.startDate).toMatch(/^\d{2}\/\d{4}$/);
        expect(exp.endDate).toMatch(exp.isCurrentJob ? /^$/ : /^\d{2}\/\d{4}$/);
      }
    }
  });
});
