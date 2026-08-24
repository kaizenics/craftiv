-- Better Auth 1.6 added a required `issuer` column to the account table and
-- looks accounts up by it: sign-in matches
--   providerId = 'credential' AND issuer = 'local:credential'
-- and OAuth callbacks resolve the owner by (issuer, accountId). Existing rows
-- predate the column, so they MUST be backfilled in the same migration that
-- adds it — an empty issuer locks every existing user out of their account.
--
-- Issuer values are fixed by Better Auth:
--   email/password -> 'local:credential'  (createLocalAccountIssuer)
--   google         -> 'https://accounts.google.com'  (the provider's accountIssuer)
--   other OAuth    -> 'local:oauth:<providerId>'     (createOAuthAccountIssuer)

-- SQLite only accepts a NOT NULL column added to a populated table when it has
-- a non-null default. The default is a placeholder for the backfill below;
-- Better Auth always supplies an issuer on insert.
ALTER TABLE accounts ADD COLUMN issuer text DEFAULT '' NOT NULL;
--> statement-breakpoint
UPDATE accounts SET issuer = 'local:credential' WHERE provider_id = 'credential';
--> statement-breakpoint
UPDATE accounts SET issuer = 'https://accounts.google.com' WHERE provider_id = 'google';
--> statement-breakpoint
-- Defensive: any provider added before this migration that is neither of the
-- above still gets the namespaced issuer Better Auth would generate for it.
UPDATE accounts SET issuer = 'local:oauth:' || provider_id WHERE issuer = '';
--> statement-breakpoint
-- The key Better Auth resolves an account's owner by. Creating it after the
-- backfill means a pre-existing duplicate fails the migration loudly rather
-- than silently allowing two accounts to claim one provider identity.
CREATE UNIQUE INDEX IF NOT EXISTS accounts_issuer_account_id_idx ON accounts (issuer, account_id);
