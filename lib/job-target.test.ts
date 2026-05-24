import assert from "node:assert/strict";
import test from "node:test";

import { readSharedJobTargetDraft, writeSharedJobTargetDraft } from "@/lib/job-target";

function createStorage(seed: Record<string, string> = {}) {
  const data = new Map(Object.entries(seed));

  return {
    getItem(key: string) {
      return data.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      data.set(key, value);
    },
  };
}

test("readSharedJobTargetDraft falls back to legacy assistant storage", () => {
  const storage = createStorage({
    resumeAiJobTarget: JSON.stringify({
      role: "Frontend Engineer",
      jobDescription: "React Next.js accessibility",
    }),
  });

  const draft = readSharedJobTargetDraft(storage);
  assert.equal(draft.role, "Frontend Engineer");
  assert.equal(draft.jobDescription, "React Next.js accessibility");
});

test("writeSharedJobTargetDraft stores normalized shared job target data", () => {
  const storage = createStorage();
  writeSharedJobTargetDraft(storage, {
    role: "  Product Designer ",
    jobDescription: "  Accessibility systems ",
  });

  const draft = readSharedJobTargetDraft(storage);
  assert.equal(draft.role, "Product Designer");
  assert.equal(draft.jobDescription, "Accessibility systems");
});
