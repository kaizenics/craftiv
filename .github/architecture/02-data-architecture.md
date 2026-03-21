# Data Architecture

## Database Platform

- Engine: Turso (libSQL)
- ORM: Drizzle ORM
- Migration Tooling: drizzle-kit

## Schema Organization

- db/schema/users.ts
  - User identity and profile records.
- db/schema/resumes.ts
  - Resume metadata and JSON content.
- db/schema/index.ts
  - Aggregated schema export.

## Data Domains

1. Identity and Access Data
   - Users, sessions, linked accounts, verification artifacts.
2. Resume Content Data
   - Structured sections: contact, experience, education, skills, finalization data.
3. Operational Metadata
   - Timestamps, ownership links, template identifiers.

## Migration Workflow

1. Update schema files under db/schema.
2. Run drizzle-kit generate to create SQL migration files.
3. Review migration SQL under db/migrations.
4. Apply migration with drizzle-kit migrate or push in controlled environments.

## Data Integrity and Ownership

- Resume records are tied to authenticated user identity.
- Server-side checks ensure users can only access their own records.
- Typed schema definitions reduce runtime field mismatch errors.

## Backup and Recovery Notes

- Treat Turso as source of truth for transactional data.
- Keep migration history in version control.
- Use environment-specific database URLs and tokens.
