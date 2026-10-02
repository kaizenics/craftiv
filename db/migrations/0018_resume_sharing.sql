-- Public share links for resumes, with view tracking.
--
-- share_token is a random, unguessable id used in /r/<token>. It is minted the
-- first time the owner turns sharing on and replaced when they regenerate the
-- link, which kills the old one. share_enabled lets the owner switch the link
-- off without losing the token.
--
-- resume_share_views holds one row per visitor per day. visitor_hash is a
-- SHA-256 of IP + user agent + a per-day salt, so raw IPs are never stored and
-- the same person can't be linked across days. The unique index is what makes
-- repeat views on the same day count once.
--
-- Apply this BEFORE deploying the code that reads it. Resume queries select
-- the new columns, so code without them fails every resume page. The reverse
-- order is safe: new nullable/defaulted columns and an unread table change
-- nothing for the code already running.
ALTER TABLE `resumes` ADD `share_token` text;
ALTER TABLE `resumes` ADD `share_enabled` integer DEFAULT 0 NOT NULL;
CREATE UNIQUE INDEX `resumes_share_token_unique` ON `resumes` (`share_token`);

CREATE TABLE `resume_share_views` (
  `id` text PRIMARY KEY NOT NULL,
  `resume_id` text NOT NULL REFERENCES `resumes`(`id`) ON DELETE cascade,
  `visitor_hash` text NOT NULL,
  `viewed_on` text NOT NULL,
  `created_at` integer NOT NULL
);

CREATE UNIQUE INDEX `resume_share_views_visitor_day_unique`
  ON `resume_share_views` (`resume_id`, `visitor_hash`, `viewed_on`);
