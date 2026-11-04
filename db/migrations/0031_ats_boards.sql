-- Shared cache of public company job boards (Greenhouse, Lever, Ashby) for the
-- Job Hunter's "Company job boards" source. One copy for the deployment,
-- refreshed by the cron tick; hunts search it instead of the network.
--
-- Apply this BEFORE deploying the code that reads it. Additive only.
CREATE TABLE `ats_boards` (
	`board_key` text PRIMARY KEY NOT NULL,
	`fetched_at` integer,
	`attempted_at` integer,
	`job_count` integer DEFAULT 0 NOT NULL,
	`error` text
);
CREATE TABLE `ats_jobs` (
	`source_key` text PRIMARY KEY NOT NULL,
	`board_key` text NOT NULL,
	`external_id` text NOT NULL,
	`title` text NOT NULL,
	`company` text NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`employment_type` text DEFAULT '' NOT NULL,
	`salary_text` text DEFAULT '' NOT NULL,
	`url` text NOT NULL,
	`description` text NOT NULL,
	`description_truncated` integer DEFAULT false NOT NULL,
	`posted_at` integer
);
CREATE INDEX `ats_jobs_board_idx` ON `ats_jobs` (`board_key`);
CREATE INDEX `ats_jobs_posted_idx` ON `ats_jobs` (`posted_at`);
