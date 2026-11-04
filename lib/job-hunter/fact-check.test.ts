import { expect, test } from "vitest";

import { createSampleResumeForTemplate } from "@/lib/data/templates";
import { knownFigures, unsupportedFigures } from "@/lib/job-hunter/fact-check";

const original = () => {
  const data = createSampleResumeForTemplate("harvard");
  data.summary = "Designer with five years of experience.";
  data.experiences = [
    { ...data.experiences[0], startDate: "03/2021", endDate: "", description: "- Lifted engagement 40%\n- Managed a $1,200,000 budget\n- Supported 24/7 on-call" },
  ];
  return data;
};

test("figures already in the resume pass, in any format", () => {
  const known = knownFigures(original());
  expect(unsupportedFigures("Increased engagement by 40 %, owned a $1.2M budget, 5 years in design since 2021", known)).toEqual([]);
});

test("invented numbers are caught, as written", () => {
  const known = knownFigures(original());
  expect(unsupportedFigures("Grew revenue 35% and led a team of 12, saving $50k", known)).toEqual(["35%", "12", "$50k"]);
  expect(unsupportedFigures("Shipped features 10x faster", known)).toEqual(["10x"]);
});

test("digits inside words and codes are not claims", () => {
  const known = knownFigures(original());
  expect(unsupportedFigures("B2B SaaS, Q3 roadmap, Web3, H1B, 24/7 support", known)).toEqual([]);
});
