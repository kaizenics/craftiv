-- There is now a tour per area, not one for the dashboard alone, so a single
-- timestamp can no longer answer "has this person seen *this* tour" -- finishing
-- any one of them would suppress the rest.
--
-- Completed tours are stored as a JSON array of keys, matching how filters and
-- reports are already stored elsewhere in this schema. A row per tour would be
-- the textbook answer, but this is a handful of short keys read on page load
-- and never queried across users, so a table would buy nothing.
--
-- Expand half of an expand/contract pair: the old column stays until the code
-- has stopped reading it, so neither order of deploy leaves the app querying a
-- column that is not there. 0015 drops it.
ALTER TABLE `users` ADD COLUMN `onboarding_tours_completed` text DEFAULT '[]' NOT NULL;
--> statement-breakpoint
-- Anyone who had already finished the dashboard tour keeps that fact.
UPDATE `users`
SET `onboarding_tours_completed` = '["dashboard"]'
WHERE `onboarding_completed_at` IS NOT NULL;
