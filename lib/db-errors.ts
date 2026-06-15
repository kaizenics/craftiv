/**
 * Shared detection helpers for libSQL/SQLite driver errors.
 *
 * These match on the driver's error message because the libSQL client does not
 * expose structured error codes for these cases. Centralized here so the same
 * detection is used everywhere (credits, rate limiting, ...).
 */

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** True when the error is a unique-constraint violation (idempotency-key races). */
export function isUniqueConstraintError(error: unknown): boolean {
  return errorMessage(error).toLowerCase().includes("unique");
}

/** True when the error is a "no such table: <tableName>" error for the given table. */
export function isMissingTableError(error: unknown, tableName: string): boolean {
  return errorMessage(error)
    .toLowerCase()
    .includes(`no such table: ${tableName.toLowerCase()}`);
}
