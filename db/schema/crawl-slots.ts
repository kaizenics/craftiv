import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * One row per crawled host: the earliest time the next request to it may go out.
 *
 * Every server reserves its turn here with a single atomic upsert
 * (lib/job-sources/crawl-clock.ts), so a host's crawl delay holds across all
 * replicas, not just within one process.
 */
export const crawlSlots = sqliteTable("crawl_slots", {
  host: text("host").primaryKey(),
  nextAtMs: integer("next_at_ms").notNull(),
});
