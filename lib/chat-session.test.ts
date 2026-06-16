import assert from "node:assert/strict";
import { test } from "vitest";

import {
  buildResumeAttachmentContext,
  cleanMessages,
  getSessionTitle,
  LEGACY_STARTER_TEXT,
} from "@/lib/chat-session";

test("cleanMessages drops blanks, bad roles, and the legacy starter line", () => {
  const cleaned = cleanMessages([
    { role: "user", text: "  hello  " },
    { role: "assistant", text: "" },
    { role: "user", text: LEGACY_STARTER_TEXT },
    // @ts-expect-error exercising a bad role at runtime
    { role: "system", text: "nope" },
    { role: "assistant", text: "hi there" },
  ]);
  assert.deepEqual(cleaned, [
    { role: "user", text: "  hello  " },
    { role: "assistant", text: "hi there" },
  ]);
});

test("getSessionTitle uses the first user message, truncating long ones", () => {
  assert.equal(getSessionTitle([{ role: "assistant", text: "hi" }]), "New Chat");
  assert.equal(getSessionTitle([{ role: "user", text: "Fix my resume" }]), "Fix my resume");
  const long = "a".repeat(60);
  assert.equal(getSessionTitle([{ role: "user", text: long }]), `${"a".repeat(48)}...`);
});

test("buildResumeAttachmentContext assembles labelled sections", () => {
  const ctx = buildResumeAttachmentContext({
    contact: { firstName: "Ada", lastName: "Lovelace", desiredJobTitle: "Engineer" },
    summary: "Builds things",
    skills: [{ name: "TypeScript" }, { name: "  " }],
    experiences: [{ jobTitle: "Dev", employer: "Acme", description: "Shipped" }],
  });
  assert.ok(ctx.includes("Name: Ada Lovelace"));
  assert.ok(ctx.includes("Target role: Engineer"));
  assert.ok(ctx.includes("Summary: Builds things"));
  assert.ok(ctx.includes("Skills: TypeScript"));
  assert.ok(ctx.includes("Experience:\n- Dev | Acme | Shipped"));
});
