import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "vitest";

import { MAX_TRPC_REQUEST_BYTES, PROMPT_INPUT_LIMITS } from "@/lib/constants/prompt-limits";

/**
 * Credits are charged per call, not per token, so an uncapped string that reaches
 * a prompt lets a caller buy an arbitrarily large model call for a fixed price.
 * These guard the shape rather than the exact numbers — tune the limits freely,
 * but not back to unbounded.
 */

test("every prompt limit is a sane positive bound", () => {
  for (const [name, value] of Object.entries(PROMPT_INPUT_LIMITS)) {
    assert.ok(Number.isInteger(value) && value > 0, `${name} must be a positive integer`);
    assert.ok(value <= 20_000, `${name}=${value} is large enough to defeat the point`);
  }
  assert.ok(MAX_TRPC_REQUEST_BYTES > 0 && MAX_TRPC_REQUEST_BYTES <= 5_000_000);
});

test("no string input in the AI router is left unbounded", () => {
  const source = readFileSync("trpc/routers/ai.ts", "utf8");

  // Only the schema block matters; the rest of the file is prose and logic.
  const schemas = source.slice(source.indexOf("const improveSectionInput"), source.indexOf("export const aiRouter"));
  assert.ok(schemas.length > 0, "could not locate the input schemas");

  const declarations = schemas.match(/^\s*(\w+):\s*z\.string\(\)[^,]*,$/gm) ?? [];
  assert.ok(declarations.length > 0, "expected string inputs to be present");

  for (const line of declarations) {
    const field = line.trim().split(":")[0];
    // IDs are looked up and ownership-checked, never interpolated into a prompt.
    if (field === "resumeId") continue;
    assert.match(line, /\.max\(/, `${field} reaches a prompt without a length cap: ${line.trim()}`);
  }
});

test("the tRPC handler bounds the request body it accepts", () => {
  // App Router handlers have no body limit of their own.
  const source = readFileSync("app/api/trpc/[trpc]/route.ts", "utf8");

  assert.match(source, /MAX_TRPC_REQUEST_BYTES/, "no body ceiling is applied");
  assert.match(source, /content-length/i, "the declared length is not checked");
  // A header is a claim; the bytes that arrive are the fact.
  assert.match(source, /arrayBuffer\(\)/, "the actual body size is never measured");
  assert.match(source, /413/, "an oversized body should be rejected with 413");
});

test("the cover-letter generator clamps every field it puts in a prompt", () => {
  const source = readFileSync("app/api/cover-letter/generate/route.ts", "utf8");

  for (const field of [
    "resumeText",
    "targetJobTitle",
    "companyName",
    "hiringManagerName",
    "candidateContext",
    "existingDraft",
  ]) {
    assert.ok(
      source.includes(`const ${field} = clamp(body.${field}, PROMPT_INPUT_LIMITS.`),
      `${field} is not clamped before it reaches the prompt`,
    );
  }

  // The clamped locals must be what the prompt builder actually receives.
  assert.ok(!source.includes("body.targetJobTitle!.trim()"), "prompt still reads the raw body");
  assert.ok(!source.includes("body.resumeText!.trim()"), "prompt still reads the raw body");
});
