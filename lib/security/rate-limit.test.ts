import assert from "node:assert/strict";
import test from "node:test";

import { evaluateFixedWindow } from "@/lib/security/rate-limit";

test("evaluateFixedWindow allows request within the active window", () => {
  const result = evaluateFixedWindow({
    nowMs: 1_000,
    currentCount: 2,
    windowStartMs: 0,
    windowSizeSeconds: 60,
    limit: 5,
  });

  assert.equal(result.allowed, true);
  assert.equal(result.nextCount, 3);
  assert.equal(result.remaining, 2);
});

test("evaluateFixedWindow blocks when limit is exceeded", () => {
  const result = evaluateFixedWindow({
    nowMs: 10_000,
    currentCount: 5,
    windowStartMs: 0,
    windowSizeSeconds: 60,
    limit: 5,
  });

  assert.equal(result.allowed, false);
  assert.equal(result.retryAfterSeconds > 0, true);
});

test("evaluateFixedWindow resets after window expiry", () => {
  const result = evaluateFixedWindow({
    nowMs: 61_000,
    currentCount: 5,
    windowStartMs: 0,
    windowSizeSeconds: 60,
    limit: 5,
  });

  assert.equal(result.allowed, true);
  assert.equal(result.nextCount, 1);
});

