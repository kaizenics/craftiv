# Craftiv Architecture

This folder contains architecture documentation for Craftiv.

## Document Map

1. [00-system-context.md](00-system-context.md)
   - Product scope, actors, and high-level boundaries.
2. [01-application-architecture.md](01-application-architecture.md)
   - Internal application layers, modules, and request flow.
3. [02-data-architecture.md](02-data-architecture.md)
   - Data model, storage decisions, and migration workflow.
4. [03-auth-and-security.md](03-auth-and-security.md)
   - Authentication model, session handling, and security controls.
5. [04-deployment-and-operations.md](04-deployment-and-operations.md)
   - Runtime environments, deployment pipeline, monitoring, and runbooks.

## Tech Stack Snapshot

- Framework: Next.js App Router
- Language: TypeScript
- API Layer: tRPC and Next.js Route Handlers
- Authentication: Better Auth
- ORM: Drizzle ORM
- Database: Turso (libSQL)
- Styling/UI: Tailwind CSS and shadcn/ui

## Updating These Docs

Update this folder when one of these changes:

- A new external integration is added.
- Authentication/session behavior changes.
- Database schema or migration process changes.
- Deployment environment or CI/CD behavior changes.
- Core module boundaries are refactored.
