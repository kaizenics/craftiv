import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Shared cache of public company job boards (Greenhouse, Lever, Ashby).
 *
 * One copy for the whole deployment, refreshed a few times a day by the cron
 * tick, so a board is fetched four times a day in total no matter how many
 * users hunt on it. Hunts search `ats_jobs`; per-user postings are copied into
 * job_postings exactly as for any other source. See lib/job-sources/ats-boards.ts.
 */
export const atsBoards = sqliteTable("ats_boards", {
  /** `${provider}:${slug}`, e.g. "greenhouse:airtable". */
  boardKey: text("board_key").primaryKey(),
  fetchedAt: integer("fetched_at", { mode: "timestamp" }),
  attemptedAt: integer("attempted_at", { mode: "timestamp" }),
  jobCount: integer("job_count").notNull().default(0),
  error: text("error"),
});

export const atsJobs = sqliteTable(
  "ats_jobs",
  {
    /** The posting's NormalizedJob sourceKey, so per-user copies dedupe against it. */
    sourceKey: text("source_key").primaryKey(),
    boardKey: text("board_key").notNull(),
    externalId: text("external_id").notNull(),
    title: text("title").notNull(),
    company: text("company").notNull(),
    location: text("location").notNull().default(""),
    employmentType: text("employment_type").notNull().default(""),
    salaryText: text("salary_text").notNull().default(""),
    url: text("url").notNull(),
    description: text("description").notNull(),
    descriptionTruncated: integer("description_truncated", { mode: "boolean" }).notNull().default(false),
    postedAt: integer("posted_at", { mode: "timestamp" }),
  },
  (t) => [index("ats_jobs_board_idx").on(t.boardKey), index("ats_jobs_posted_idx").on(t.postedAt)],
);
