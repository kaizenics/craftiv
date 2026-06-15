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
