import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

import { users } from "./users";
import { resumes } from "./resumes";
import { coverLetters } from "./cover-letters";
import type { AtsImpact, AtsReport } from "@/lib/ats";
import type { HuntFilters, JobSourceId } from "@/lib/types/job-hunter";

/**
 * Job Hunter
 *
 * Four tables: the saved search (`job_hunts`), the posting (`job_postings`),
 * the user's scored pipeline entry (`job_matches`), and the async-run ledger
 * (`hunt_runs`).
 *
 * Postings are deliberately USER-SCOPED rather than a shared catalogue. A
 * posting pasted from OnlineJobs.ph must never reach another user -- their
 * terms forbid making the Service available to third parties -- and a per-user
 * row makes that true by construction rather than by remembering to filter.
 * Feed jobs are fetched once centrally (the daily request budget is global,
 * not per user) and then materialised per user; duplicated rows are irrelevant
 * at SQLite scale, and cascade delete comes free.
 */

export const jobHunts = sqliteTable(
  "job_hunts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),

    // Search intent.
    query: text("query").notNull().default(""),
    location: text("location").notNull().default(""),
    // Only ids whose adapter reports `pollable` belong here; the router refines
    // on that, and the runner asserts it again before calling search().
    sources: text("sources", { mode: "json" }).$type<JobSourceId[]>().notNull(),
    filters: text("filters", { mode: "json" }).$type<HuntFilters | null>(),

    // set null, not cascade: deleting the resume must not delete the hunt. The
    // run then skips scoring and says so in the digest.
    resumeId: text("resume_id").references(() => resumes.id, { onDelete: "set null" }),

    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    frequency: text("frequency", { enum: ["daily", "weekly", "manual"] })
      .notNull()
      .default("daily"),
    // Minutes past UTC midnight. Avoids a timezone column in v1.
    runAtMinuteUtc: integer("run_at_minute_utc").notNull().default(360),
    lastRunAt: integer("last_run_at", { mode: "timestamp" }),
    nextRunAt: integer("next_run_at", { mode: "timestamp" }),

    emailDigest: integer("email_digest", { mode: "boolean" }).notNull().default(true),

    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    // The dispatcher's only query: active and due, oldest first.
    index("job_hunts_due_idx").on(t.isActive, t.nextRunAt),
    index("job_hunts_user_idx").on(t.userId),
  ],
);

export const jobPostings = sqliteTable(
  "job_postings",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    source: text("source").notNull().$type<JobSourceId>(),
    externalId: text("external_id").notNull(),
    // The dedupe unit, `${source}:${externalId}`, computed by the adapter.
    sourceKey: text("source_key").notNull(),
    // Identity and change detection are different questions. `sourceKey`
    // answers "is this the same listing?"; `contentHash` answers "did the
    // employer edit it?". Conflating them would create a duplicate row every
    // time a typo is fixed. A changed hash marks dependent matches stale.
    contentHash: text("content_hash").notNull(),
    // How this row was acquired. Determines what Craftiv may legally do with
    // it, so it is recorded rather than inferred.
    provenance: text("provenance", {
      enum: ["paste", "url_import", "clipper", "feed"],
    }).notNull(),

    title: text("title").notNull(),
    company: text("company").notNull().default(""),
    location: text("location").notNull().default(""),
    employmentType: text("employment_type").notNull().default(""),
    salaryText: text("salary_text").notNull().default(""),
    url: text("url").notNull().default(""),
    applyUrl: text("apply_url").notNull().default(""),

    // Capped at PROMPT_INPUT_LIMITS.jobDescription on write, so a stored job
    // can never inflate a downstream prompt. Bounded at the storage layer, not
    // just the prompt layer.
    description: text("description").notNull(),
    descriptionTruncated: integer("description_truncated", { mode: "boolean" })
      .notNull()
      .default(false),

    postedAt: integer("posted_at", { mode: "timestamp" }),
    // Set by the staleness sweep, from posting age alone. We never fetch a
    // source to confirm a posting closed.
    archivedAt: integer("archived_at", { mode: "timestamp" }),

    raw: text("raw", { mode: "json" }).$type<Record<string, unknown> | null>(),

    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    // The dedupe guarantee, and the lock. Turso has no SELECT..FOR UPDATE, so
    // ingestion INSERTs and treats a unique violation as "already have it" via
    // isUniqueConstraintError() -- the same idiom consumeCredits() uses for
    // idempotencyKey. No read-then-write race.
    uniqueIndex("job_postings_user_source_key_idx").on(t.userId, t.sourceKey),
    index("job_postings_user_created_idx").on(t.userId, t.createdAt),
  ],
);

export const jobMatches = sqliteTable(
  "job_matches",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    jobPostingId: text("job_posting_id")
      .notNull()
      .references(() => jobPostings.id, { onDelete: "cascade" }),
    // The resume this score was computed against.
    resumeId: text("resume_id")
      .notNull()
      .references(() => resumes.id, { onDelete: "cascade" }),
    huntId: text("hunt_id").references(() => jobHunts.id, { onDelete: "set null" }),

    // Deterministic, from lib/ats.ts. Free to compute and free to recompute,
    // which is why scheduled runs cost no credits.
    score: integer("score").notNull(),
    scoringVersion: text("scoring_version").notNull(),
    report: text("report", { mode: "json" }).$type<AtsReport>().notNull(),
    scoredAt: integer("scored_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    // resumes.updatedAt at scoring time. Cheap change detection for the
    // re-score sweep: WHERE resume_version_at < resumes.updated_at.
    resumeVersionAt: integer("resume_version_at", { mode: "timestamp" }).notNull(),

    // Machine-owned lifecycle, written by imports and background runs.
    pipelineStatus: text("pipeline_status", {
      enum: ["scored", "tailoring", "tailored", "stale", "failed"],
    })
      .notNull()
      .default("scored"),
    // User-owned lifecycle, only ever written in response to a user action.
    // Two columns because they change for independent reasons: a background
    // re-score must never clobber a match the user marked "interviewing".
    applicationStatus: text("application_status", {
      enum: ["new", "saved", "applied", "interviewing", "offer", "rejected", "dismissed"],
    })
      .notNull()
      .default("new"),
    statusUpdatedAt: integer("status_updated_at", { mode: "timestamp" }),

    // Tailored artifacts are real rows in the existing tables, linked here, so
    // they inherit the editor, preview, PDF/DOCX export and documents library
    // for free. set null keeps the match alive if the user deletes the doc.
    tailoredResumeId: text("tailored_resume_id").references(() => resumes.id, {
      onDelete: "set null",
    }),
    tailoredCoverLetterId: text("tailored_cover_letter_id").references(() => coverLetters.id, {
      onDelete: "set null",
    }),
    tailoredAt: integer("tailored_at", { mode: "timestamp" }),
    tailorImpact: text("tailor_impact", { mode: "json" }).$type<AtsImpact | null>(),

    notes: text("notes").notNull().default(""),
    appliedAt: integer("applied_at", { mode: "timestamp" }),
    // Set when this match first appears in a digest, so it is never re-sent.
    digestedAt: integer("digested_at", { mode: "timestamp" }),

    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    // One score per (posting, resume). Re-scoring UPDATEs; it never inserts.
    uniqueIndex("job_matches_posting_resume_idx").on(t.jobPostingId, t.resumeId),
    index("job_matches_user_status_score_idx").on(t.userId, t.applicationStatus, t.score),
    index("job_matches_pipeline_idx").on(t.userId, t.pipelineStatus),
    index("job_matches_digest_idx").on(t.userId, t.digestedAt),
  ],
);

export const huntRuns = sqliteTable(
  "hunt_runs",
  {
    id: text("id").primaryKey(),
    huntId: text("hunt_id")
      .notNull()
      .references(() => jobHunts.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // Server-derived bucket, e.g. "h:2026-08-29T06". Never caller-supplied --
    // the same rule as newChargeIdempotencyKey(): a caller-chosen key is a
    // caller-chosen "run this again".
    runKey: text("run_key").notNull(),

    status: text("status", { enum: ["claimed", "succeeded", "failed"] })
      .notNull()
      .default("claimed"),
    trigger: text("trigger", { enum: ["schedule", "manual"] }).notNull(),

    jobsFetched: integer("jobs_fetched").notNull().default(0),
    jobsNew: integer("jobs_new").notNull().default(0),
    jobsScored: integer("jobs_scored").notNull().default(0),
    matchesRescored: integer("matches_rescored").notNull().default(0),
    jobsArchived: integer("jobs_archived").notNull().default(0),
    creditUnitsSpent: integer("credit_units_spent").notNull().default(0),
    digestSent: integer("digest_sent", { mode: "boolean" }).notNull().default(false),
    errorMessage: text("error_message"),

    // Reclaim window for a run whose container died mid-flight. The next tick
    // takes it over with a compare-and-swap UPDATE checking rowsAffected.
    lockExpiresAt: integer("lock_expires_at", { mode: "timestamp" }).notNull(),
    startedAt: integer("started_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    finishedAt: integer("finished_at", { mode: "timestamp" }),
  },
  (t) => [
    // The run lock. Two overlapping cron ticks both INSERT (huntId, runKey);
    // exactly one wins and the loser skips. Correct even at N replicas.
    uniqueIndex("hunt_runs_hunt_run_key_idx").on(t.huntId, t.runKey),
    index("hunt_runs_hunt_started_idx").on(t.huntId, t.startedAt),
  ],
);

export const jobHuntsRelations = relations(jobHunts, ({ one, many }) => ({
  user: one(users, { fields: [jobHunts.userId], references: [users.id] }),
  resume: one(resumes, { fields: [jobHunts.resumeId], references: [resumes.id] }),
  matches: many(jobMatches),
  runs: many(huntRuns),
}));

export const jobPostingsRelations = relations(jobPostings, ({ one, many }) => ({
  user: one(users, { fields: [jobPostings.userId], references: [users.id] }),
  matches: many(jobMatches),
}));

export const jobMatchesRelations = relations(jobMatches, ({ one }) => ({
  user: one(users, { fields: [jobMatches.userId], references: [users.id] }),
  posting: one(jobPostings, {
    fields: [jobMatches.jobPostingId],
    references: [jobPostings.id],
  }),
  resume: one(resumes, { fields: [jobMatches.resumeId], references: [resumes.id] }),
  hunt: one(jobHunts, { fields: [jobMatches.huntId], references: [jobHunts.id] }),
}));

export const huntRunsRelations = relations(huntRuns, ({ one }) => ({
  hunt: one(jobHunts, { fields: [huntRuns.huntId], references: [jobHunts.id] }),
  user: one(users, { fields: [huntRuns.userId], references: [users.id] }),
}));
