-- How many applications the user aims to send each week; 0 means no goal.
--
-- Apply this BEFORE deploying the code that reads it. Additive only: every
-- existing user starts with no goal, so nothing changes until they set one.
ALTER TABLE `users` ADD `weekly_application_goal` integer DEFAULT 0 NOT NULL;
