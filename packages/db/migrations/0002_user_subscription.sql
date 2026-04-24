ALTER TABLE `users` ADD COLUMN `plan` text DEFAULT 'free' NOT NULL;
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `is_paid` integer DEFAULT false NOT NULL;
