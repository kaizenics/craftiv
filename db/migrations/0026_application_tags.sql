-- Free-form tags on tracked applications ("remote", "referral", "dream job").
--
-- Apply this BEFORE deploying the code that reads it. Additive only: existing
-- cards start with no tags.
ALTER TABLE `applications` ADD `tags` text DEFAULT '[]' NOT NULL;
