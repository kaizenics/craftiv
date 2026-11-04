-- Referral credits: each user's invite code, and who invited whom.
--
-- Apply this BEFORE deploying the code that reads it. Additive only: existing
-- users get a code the first time they open their invite link.
ALTER TABLE `users` ADD `referral_code` text;
CREATE UNIQUE INDEX `users_referral_code_unique` ON `users` (`referral_code`);
CREATE TABLE `referrals` (
	`id` text PRIMARY KEY NOT NULL,
	`referrer_id` text NOT NULL,
	`referred_id` text NOT NULL,
	`referrer_rewarded` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`referrer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`referred_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE UNIQUE INDEX `referrals_referred_id_unique` ON `referrals` (`referred_id`);
CREATE INDEX `referrals_referrer_created_idx` ON `referrals` (`referrer_id`, `created_at`);
