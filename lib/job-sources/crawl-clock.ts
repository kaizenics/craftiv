import { sql } from "drizzle-orm";
import { isMissingTableError } from "@/lib/db-errors";

/**
 * Reserves this request's turn for `host` across every replica and returns how
 * long to wait before sending it, or "busy" (no turn taken) when that wait
 * would exceed `maxWaitMs`.
 *
 * One upsert does the read and the write together, so two servers can never be
 * handed the same slot. Returns null when the shared clock is unavailable (the
 * table is not migrated yet, or the database errored); callers then fall back
 * to the per-process throttle, which is still polite within one server.
 */
export async function reserveCrawlSlot(
  host: string,
  delayMs: number,
  maxWaitMs: number,
): Promise<number | "busy" | null> {
  const nowMs = Date.now();
  try {
    // Imported lazily so modules that only parse pages never need a database.
    const { db } = await import("@/db");
    // A request that would wait past maxWaitMs takes no turn (the WHERE skips the
    // update and RETURNING yields no row); otherwise turned-away requests would
    // keep pushing the clock forward and the queue could never drain.
    // all(), not get(): drizzle's get() throws on zero rows instead of returning undefined.
    const [row] = await db.all<{ next_at_ms: number }>(sql`
      INSERT INTO crawl_slots (host, next_at_ms) VALUES (${host}, ${nowMs + delayMs})
      ON CONFLICT (host) DO UPDATE SET next_at_ms = max(crawl_slots.next_at_ms, ${nowMs}) + ${delayMs}
      WHERE max(crawl_slots.next_at_ms, ${nowMs}) - ${nowMs} <= ${maxWaitMs}
      RETURNING next_at_ms
    `);
    if (!row) return "busy";
    const startAtMs = row.next_at_ms - delayMs;
    return Math.max(0, startAtMs - nowMs);
  } catch (error) {
    if (!isMissingTableError(error, "crawl_slots")) {
      console.warn("[crawl-clock] shared clock unavailable, using per-process throttle", error);
    }
    return null;
  }
}
