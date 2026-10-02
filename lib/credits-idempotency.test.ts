import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "vitest";

import { newChargeIdempotencyKey } from "@/lib/credits";

test("each call mints a distinct key for the same user and event", () => {
  const a = newChargeIdempotencyKey("ats_check", "user-1");
  const b = newChargeIdempotencyKey("ats_check", "user-1");

  assert.notEqual(a, b);
  assert.match(a, /^ats_check:user-1:[0-9a-f-]{36}$/);
});

/**
 * consumeCredits skips the deduction when it sees a key it has already settled,
 * so a charge key assembled from request input is a caller-controlled opt-out of
 * being charged — replay one value and every later call runs the AI for free.
 * These routes must mint keys server-side.
 */
const CHARGE_SITES = [
  "app/api/ats-check/route.ts",
  "app/api/chatbot/stream/route.ts",
  "app/api/resume-layout/chat/route.ts",
  "trpc/routers/ai.ts",
];

test("no charge key is assembled from request input", () => {
  for (const path of CHARGE_SITES) {
    const source = readFileSync(path, "utf8");
    const assignments = source.match(/(?:chargeIdempotencyKey|idempotencyKey)\s*=\s*[^;]+;/g) ?? [];

    assert.ok(assignments.length > 0, `${path}: expected a charge key assignment`);

    for (const assignment of assignments) {
      // `refund:${...}` derives from an already-minted server key, which is the
      // point — a refund must settle exactly once against its charge.
      if (assignment.includes("refund:")) continue;

      assert.ok(
        assignment.includes("newChargeIdempotencyKey("),
        `${path}: charge key must come from newChargeIdempotencyKey(), got: ${assignment.trim()}`,
      );
    }
  }
});

/**
 * Resume import was a charge site until it moved to the deterministic parser in
 * lib/resume-import. It is free by design -- it runs on every upload, including
 * chat attachments and cover-letter uploads. It may now fall back to Craftiv's AI
 * for LinkedIn exports and messy files (lib/resume-import/ai-parse.ts), but that
 * path must stay free too: a charge creeping back into either file is the
 * regression to catch.
 */
test("resume import never charges credits", () => {
  for (const path of ["app/api/resume/parse/route.ts", "lib/resume-import/ai-parse.ts"]) {
    const source = readFileSync(path, "utf8");
    for (const forbidden of ["consumeCredits", "beginAiAction", "@/lib/credits", "@/lib/own-ai-access"]) {
      assert.ok(!source.includes(forbidden), `${path}: resume import must stay free, but references ${forbidden}`);
    }
  }

  const route = readFileSync("app/api/resume/parse/route.ts", "utf8");
  assert.ok(route.includes("parseResumeText("), "the free rule-based parser must still run first");
});

test("the cover-letter day session is the only exempt charge key", () => {
  // Keyed on an ownership-checked letter ID and a server clock bucket, both
  // server-owned, so one charge deliberately covers a day of regeneration.
  const source = readFileSync("app/api/cover-letter/generate/route.ts", "utf8");

  assert.match(source, /cl_ai_session:\$\{session\.user\.id\}:\$\{coverLetterId\}:\$\{bucket\}/);
  assert.match(source, /const bucket = Math\.floor\(Date\.now\(\) \/ DAY_BUCKET_MS\);/);
});
