# Application Architecture

## Directory-Oriented Module Layout

- app
  - Route segments for auth, dashboard, resume flows, and API endpoints.
- components
  - Reusable UI and feature components.
- trpc
  - API routers, server/client wiring, and shared procedures.
- lib
  - Cross-cutting utilities (auth clients, AI helpers, template logic).
- db/schema
  - Drizzle table definitions and typed models.

## Runtime Layers

1. Presentation Layer
   - Next.js pages/layouts and client components.
   - Handles stateful UI interactions and local browser state.
2. API/Service Layer
   - tRPC routers and route handlers in app/api.
   - Performs input validation, auth checks, and orchestration logic.
3. Data Access Layer
   - Drizzle ORM queries against Turso.
   - Typed schema-first data access.

## Request Flow (Typical Protected Action)

1. Client component triggers mutation or fetch.
2. tRPC procedure or route handler resolves session context.
3. Auth guard validates user session.
4. Business logic executes (parse/update/generate).
5. Data persisted/retrieved through Drizzle.
6. Response returned to client.

## API Entry Points

- tRPC endpoint under app/api/trpc
  - Primary typed RPC path for application features.
- REST-like route handlers under app/api/resume
  - Parsing and PDF-specific operations.
- Better Auth catch-all route under app/api/auth
  - Session and provider auth handling.

## UI Composition Strategy

- Shared primitives under components/ui.
- Feature-specific components under components/dashboard and components/resume.
- Page-level orchestration in app route files.

## Key Architecture Decisions

- Use tRPC for strong client-server typing in feature APIs.
- Keep one Next.js codebase for frontend and backend concerns.
- Use server-side auth checks for protected routes and API calls.
