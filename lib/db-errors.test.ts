import assert from "node:assert/strict";
import { test } from "vitest";

import { isMissingTableError, isUniqueConstraintError } from "@/lib/db-errors";

test("isUniqueConstraintError matches unique-constraint messages", () => {
  assert.equal(
    isUniqueConstraintError(new Error("SQLITE_CONSTRAINT: UNIQUE constraint failed")),
    true,
  );
  assert.equal(isUniqueConstraintError("UNIQUE constraint failed: credit_events.idempotency_key"), true);
  assert.equal(isUniqueConstraintError(new Error("some other failure")), false);
});

test("isMissingTableError matches the named table only", () => {
  const error = new Error("LibsqlError: SQLITE_ERROR: no such table: rate_limits");
  assert.equal(isMissingTableError(error, "rate_limits"), true);
  assert.equal(isMissingTableError(error, "credit_events"), false);
  assert.equal(isMissingTableError(new Error("no such table: users"), "rate_limits"), false);
});

/**
 * Drizzle raises its own error for a failed statement and puts the driver error
 * in `cause`. Matching on the top-level message alone missed every constraint
 * violation raised through Drizzle, which silently broke insert-to-dedupe and
 * insert-to-claim -- the idiom this codebase uses instead of row locks.
 */
test("detects a unique violation wrapped by drizzle in error.cause", () => {
  const driver = new Error("SQLITE_CONSTRAINT: UNIQUE constraint failed: job_postings.source_key");
  const wrapped = new Error('Failed query: insert into "job_postings" ...', { cause: driver });

  assert.equal(isUniqueConstraintError(wrapped), true);
});

test("detects a unique violation nested two levels deep", () => {
  const driver = new Error("UNIQUE constraint failed: hunt_runs.run_key");
  const middle = new Error("libsql error", { cause: driver });
  const wrapped = new Error("Failed query: insert into hunt_runs", { cause: middle });

  assert.equal(isUniqueConstraintError(wrapped), true);
});

test("does not mistake an unrelated wrapped error for a unique violation", () => {
  const wrapped = new Error("Failed query: insert", {
    cause: new Error("SQLITE_BUSY: database is locked"),
  });

  assert.equal(isUniqueConstraintError(wrapped), false);
});

test("detects a missing table wrapped in error.cause", () => {
  const wrapped = new Error("Failed query: select", {
    cause: new Error("SQLITE_ERROR: no such table: job_matches"),
  });

  assert.equal(isMissingTableError(wrapped, "job_matches"), true);
  assert.equal(isMissingTableError(wrapped, "resumes"), false);
});

test("survives a circular cause chain", () => {
  const a = new Error("outer") as Error & { cause?: unknown };
  const b = new Error("inner") as Error & { cause?: unknown };
  a.cause = b;
  b.cause = a;

  assert.equal(isUniqueConstraintError(a), false);
});
