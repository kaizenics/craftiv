-- Resume version history, stored on the server.
--
-- Snapshots used to live only in the browser's localStorage, so clearing the
-- browser or switching devices lost them. Each row is a full copy of a resume's
-- data and title at one moment. `kind` records why it was taken: the user's
-- "Save snapshot" button, or an automatic safety copy before a restore or an AI
-- rewrite. The app keeps the newest 50 per resume.
--
-- Apply this BEFORE deploying the code that reads it. The editor's Version
-- History tab queries this table, so code without it fails that tab. The
-- reverse order is safe: an unread table changes nothing for running code.
CREATE TABLE `resume_snapshots` (
  `id` text PRIMARY KEY NOT NULL,
  `resume_id` text NOT NULL REFERENCES `resumes`(`id`) ON DELETE cascade,
  `user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE cascade,
  `kind` text NOT NULL,
  `name` text NOT NULL,
  `data` text NOT NULL,
  `created_at` integer NOT NULL
);

CREATE INDEX `resume_snapshots_resume_created_idx`
  ON `resume_snapshots` (`resume_id`, `created_at`);
