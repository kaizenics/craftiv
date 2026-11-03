-- Custom public links for shared resumes (/r/john-smith), alongside the random
-- token. A link stays reserved to the user who claimed it, even once it is off
-- every resume or the account is gone, so a link already sent out can never
-- start showing someone else's resume. resume_id is the resume it opens now.
--
-- Apply this BEFORE deploying the code that reads it. Additive only.
CREATE TABLE `share_slugs` (
	`slug` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`resume_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`resume_id`) REFERENCES `resumes`(`id`) ON UPDATE no action ON DELETE set null
);
CREATE UNIQUE INDEX `share_slugs_resume_unique` ON `share_slugs` (`resume_id`);
CREATE INDEX `share_slugs_user_idx` ON `share_slugs` (`user_id`);
