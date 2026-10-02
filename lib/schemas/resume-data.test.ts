import assert from "node:assert/strict";
import { test } from "vitest";

import { resumeDataSchema } from "@/lib/schemas/resume-data";

const base = {
  contact: { firstName: "Ada", lastName: "Lovelace", desiredJobTitle: "", phone: "", email: "" },
  experiences: [],
  educations: [],
  skills: [],
  summary: "",
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

const design = {
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: 11,
  sectionSpacing: 16,
  paragraphSpacing: 8,
  lineSpacing: 1.5,
  color: "#1e3a5f",
  showPhoto: true,
};

test("template, section order, photo and design survive a save", () => {
  const parsed = resumeDataSchema.parse({
    ...base,
    templateId: "harvard",
    sectionOrder: ["skills", "summary"],
    contact: { ...base.contact, photoUrl: "data:image/jpeg;base64,AAAA" },
    design,
  });

  assert.equal(parsed.templateId, "harvard");
  assert.deepEqual(parsed.sectionOrder, ["skills", "summary"]);
  assert.equal(parsed.contact.photoUrl, "data:image/jpeg;base64,AAAA");
  assert.deepEqual(parsed.design, design);
});

test("photo must be an image data URL or https", () => {
  const result = resumeDataSchema.safeParse({
    ...base,
    contact: { ...base.contact, photoUrl: "http://169.254.169.254/latest" },
  });
  assert.equal(result.success, false);
});

test("unknown section keys are rejected", () => {
  const result = resumeDataSchema.safeParse({ ...base, sectionOrder: ["projects"] });
  assert.equal(result.success, false);
});
