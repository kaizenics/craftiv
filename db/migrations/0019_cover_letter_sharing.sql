-- Public share links for cover letters, with view tracking.
--
-- Same design as 0018 for resumes: a random share_token used in /c/<token>,
-- share_enabled to switch the link off without losing it, and one view row per
-- visitor per day keyed on a salted hash (never a raw IP).
--
-- Apply this BEFORE deploying the code that reads it. Cover-letter queries
-- select the new columns, so code without them fails every cover-letter page.
-- The reverse order is safe.
ALTER TABLE `cover_letters` ADD `share_token` text;
ALTER TABLE `cover_letters` ADD `share_enabled` integer DEFAULT 0 NOT NULL;
CREATE UNIQUE INDEX `cover_letters_share_token_unique` ON `cover_letters` (`share_token`);

CREATE TABLE `cover_letter_share_views` (
  `id` text PRIMARY KEY NOT NULL,
  `cover_letter_id` text NOT NULL REFERENCES `cover_letters`(`id`) ON DELETE cascade,
  `visitor_hash` text NOT NULL,
  `viewed_on` text NOT NULL,
  `created_at` integer NOT NULL
);

CREATE UNIQUE INDEX `cover_letter_share_views_visitor_day_unique`
  ON `cover_letter_share_views` (`cover_letter_id`, `visitor_hash`, `viewed_on`);
