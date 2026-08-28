/**
 * Shared detection helpers for libSQL/SQLite driver errors.
 *
 * These match on the driver's error message because the libSQL client does not
 * expose structured error codes for these cases. Centralized here so the same
 * detection is used everywhere (credits, rate limiting, ...).
 */

/**
 * Flattens an error and everything it wraps into one searchable string.
 *
 * Drizzle raises its own error for a failed statement and puts the driver's
 * error in `cause`, so the top-level message reads "Failed query: insert into
 * ..." and contains none of the words below. Matching on `message` alone
 * therefore missed every constraint violation raised through Drizzle -- which
 * silently broke insert-to-dedupe and insert-to-claim, the idiom this codebase
 * uses in place of the row locks Turso does not have.
 */
function errorMessage(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;

  // Bounded, because an error chain can in principle be circular.
  for (let depth = 0; current && depth < 5; depth += 1) {
    if (current instanceof Error) {
      parts.push(current.message);
      current = current.cause;
      continue;
    }
    parts.push(String(current));
    break;
  }

  return parts.join(" | ");
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
