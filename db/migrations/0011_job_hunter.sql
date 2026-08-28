-- Job Hunter.
--
-- Four new tables plus an `origin` discriminator on the two document tables.
--
-- Postings are user-scoped rather than a shared catalogue: a posting pasted
-- from OnlineJobs.ph must never reach another user, and a per-user row makes
-- that true by construction rather than by remembering to filter. Feed jobs are
-- fetched once centrally (the daily request budget is global, not per user) and
-- then materialised per user.
--
-- Every dedupe guarantee below is a UNIQUE index rather than a lock. Turso has
-- no SELECT ... FOR UPDATE, so ingestion INSERTs and treats a unique violation
-- as "already have it" -- the same idiom credit_events.idempotency_key uses.

CREATE TABLE `job_hunts` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE cascade,
  `name` text NOT NULL,
  `query` text DEFAULT '' NOT NULL,
  `location` text DEFAULT '' NOT NULL,
  `sources` text NOT NULL,
  `filters` text,
  `resume_id` text REFERENCES `resumes`(`id`) ON DELETE set null,
  `is_active` integer DEFAULT 1 NOT NULL,
  `frequency` text DEFAULT 'daily' NOT NULL,
  `run_at_minute_utc` integer DEFAULT 360 NOT NULL,
  `last_run_at` integer,
  `next_run_at` integer,
  `email_digest` integer DEFAULT 1 NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);
--> statement-breakpoint
-- The dispatcher's only scan: active and due.
CREATE INDEX `job_hunts_due_idx` ON `job_hunts` (`is_active`,`next_run_at`);
--> statement-breakpoint
CREATE INDEX `job_hunts_user_idx` ON `job_hunts` (`user_id`);
--> statement-breakpoint

CREATE TABLE `job_postings` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE cascade,
  `source` text NOT NULL,
  `external_id` text NOT NULL,
  `source_key` text NOT NULL,
  `content_hash` text NOT NULL,
  `provenance` text NOT NULL,
  `title` text NOT NULL,
  `company` text DEFAULT '' NOT NULL,
  `location` text DEFAULT '' NOT NULL,
  `employment_type` text DEFAULT '' NOT NULL,
  `salary_text` text DEFAULT '' NOT NULL,
  `url` text DEFAULT '' NOT NULL,
  `apply_url` text DEFAULT '' NOT NULL,
  `description` text NOT NULL,
  `description_truncated` integer DEFAULT 0 NOT NULL,
  `posted_at` integer,
  `archived_at` integer,
  `raw` text,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);
--> statement-breakpoint
-- The dedupe guarantee. Re-importing the same job is a no-op, not a second row.
CREATE UNIQUE INDEX `job_postings_user_source_key_idx` ON `job_postings` (`user_id`,`source_key`);
--> statement-breakpoint
CREATE INDEX `job_postings_user_created_idx` ON `job_postings` (`user_id`,`created_at`);
--> statement-breakpoint

CREATE TABLE `job_matches` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE cascade,
  `job_posting_id` text NOT NULL REFERENCES `job_postings`(`id`) ON DELETE cascade,
  `resume_id` text NOT NULL REFERENCES `resumes`(`id`) ON DELETE cascade,
  `hunt_id` text REFERENCES `job_hunts`(`id`) ON DELETE set null,
  `score` integer NOT NULL,
  `scoring_version` text NOT NULL,
  `report` text NOT NULL,
  `scored_at` integer NOT NULL,
  `resume_version_at` integer NOT NULL,
  `pipeline_status` text DEFAULT 'scored' NOT NULL,
  `application_status` text DEFAULT 'new' NOT NULL,
  `status_updated_at` integer,
  `tailored_resume_id` text REFERENCES `resumes`(`id`) ON DELETE set null,
  `tailored_cover_letter_id` text REFERENCES `cover_letters`(`id`) ON DELETE set null,
  `tailored_at` integer,
  `tailor_impact` text,
  `notes` text DEFAULT '' NOT NULL,
  `applied_at` integer,
  `digested_at` integer,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);
--> statement-breakpoint
-- One score per (posting, resume). Re-scoring UPDATEs; it never inserts.
CREATE UNIQUE INDEX `job_matches_posting_resume_idx` ON `job_matches` (`job_posting_id`,`resume_id`);
--> statement-breakpoint
CREATE INDEX `job_matches_user_status_score_idx` ON `job_matches` (`user_id`,`application_status`,`score`);
--> statement-breakpoint
CREATE INDEX `job_matches_pipeline_idx` ON `job_matches` (`user_id`,`pipeline_status`);
--> statement-breakpoint
CREATE INDEX `job_matches_digest_idx` ON `job_matches` (`user_id`,`digested_at`);
--> statement-breakpoint

CREATE TABLE `hunt_runs` (
  `id` text PRIMARY KEY NOT NULL,
  `hunt_id` text NOT NULL REFERENCES `job_hunts`(`id`) ON DELETE cascade,
  `user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE cascade,
  `run_key` text NOT NULL,
  `status` text DEFAULT 'claimed' NOT NULL,
  `trigger` text NOT NULL,
  `jobs_fetched` integer DEFAULT 0 NOT NULL,
  `jobs_new` integer DEFAULT 0 NOT NULL,
  `jobs_scored` integer DEFAULT 0 NOT NULL,
  `matches_rescored` integer DEFAULT 0 NOT NULL,
  `jobs_archived` integer DEFAULT 0 NOT NULL,
  `credit_units_spent` integer DEFAULT 0 NOT NULL,
  `digest_sent` integer DEFAULT 0 NOT NULL,
  `error_message` text,
  `lock_expires_at` integer NOT NULL,
  `started_at` integer NOT NULL,
  `finished_at` integer
);
--> statement-breakpoint
-- The run lock. Two overlapping cron ticks both INSERT (hunt_id, run_key);
-- exactly one wins and the loser skips. Correct even at N replicas.
CREATE UNIQUE INDEX `hunt_runs_hunt_run_key_idx` ON `hunt_runs` (`hunt_id`,`run_key`);
--> statement-breakpoint
CREATE INDEX `hunt_runs_hunt_started_idx` ON `hunt_runs` (`hunt_id`,`started_at`);
--> statement-breakpoint

-- Tailored documents are real rows in the existing tables so they inherit the
-- editor, templates and PDF/DOCX export unchanged. `origin` keeps them out of
-- the documents library and out of ResumeCombobox until the user saves one.
-- SQLite accepts a NOT NULL column added to a populated table when it has a
-- non-null default, so this is an ADD COLUMN and not a table rebuild.
ALTER TABLE `resumes` ADD COLUMN `origin` text DEFAULT 'user' NOT NULL;
--> statement-breakpoint
ALTER TABLE `cover_letters` ADD COLUMN `origin` text DEFAULT 'user' NOT NULL;
