-- The user's own application tracker (Kanban board on /dashboard/applications).
--
-- Apply this BEFORE deploying the code that reads it: the Applications page
-- lists rows from this table on load.
CREATE TABLE `applications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'saved' NOT NULL,
	`position` real DEFAULT 0 NOT NULL,
	`company` text DEFAULT '' NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`posting_url` text DEFAULT '' NOT NULL,
	`contact` text DEFAULT '' NOT NULL,
	`applied_on` text DEFAULT '' NOT NULL,
	`interview_stage` text DEFAULT '' NOT NULL,
	`interviewer` text DEFAULT '' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`custom_fields` text DEFAULT '[]' NOT NULL,
	`match_id` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`match_id`) REFERENCES `job_matches`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE INDEX `applications_user_status_idx` ON `applications` (`user_id`,`status`,`position`);
