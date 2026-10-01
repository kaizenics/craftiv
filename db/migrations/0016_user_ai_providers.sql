-- Bring your own AI.
--
-- One row per user holding the provider they connected, the model they chose,
-- and their API key encrypted with AES-256-GCM (see lib/ai-key-crypto.ts). The
-- plain key is never stored; key_hint is its last four characters for display.
--
-- Keyed on user_id rather than a surrogate id: a user has at most one active
-- provider, so the primary key enforces that instead of application code.
--
-- Apply this BEFORE deploying the code that reads it. Every AI action looks up
-- this table to decide between the user's key and credits, so code without the
-- table fails every AI feature. The reverse order is safe: a new, unread table
-- changes nothing for the code already running.
CREATE TABLE `user_ai_providers` (
  `user_id` text PRIMARY KEY NOT NULL REFERENCES `users`(`id`) ON DELETE cascade,
  `provider` text NOT NULL,
  `model` text NOT NULL,
  `encrypted_key` text NOT NULL,
  `key_hint` text NOT NULL,
  `enabled` integer DEFAULT 1 NOT NULL,
  `last_verified_at` integer,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);
