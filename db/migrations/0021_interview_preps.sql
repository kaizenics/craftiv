-- Saved interview prep sets, one row per generated set, so a paid result is
-- never lost and earlier sets stay readable.
--
-- Apply this BEFORE deploying the code that reads it: the Interview Prep page
-- and the "View prep" buttons query this table.
CREATE TABLE `interview_preps` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`match_id` text NOT NULL,
	`questions` text NOT NULL,
	`notes` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`match_id`) REFERENCES `job_matches`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX `interview_preps_user_match_idx` ON `interview_preps` (`user_id`,`match_id`,`created_at`);
