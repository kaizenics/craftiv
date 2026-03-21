# Deployment and Operations

## Target Runtime

- Platform: Vercel-compatible Next.js deployment
- Build command: npm run build
- Start command: npm run start (non-serverless local/prod runs)

## Required Environment Variables

- BETTER_AUTH_SECRET
- BETTER_AUTH_URL
- TURSO_DATABASE_URL
- TURSO_AUTH_TOKEN
- OPENROUTER_API_KEY (or equivalent AI provider key)
- OAuth provider keys currently used by auth configuration

## CI/CD Expectations

1. Install dependencies.
2. Type-check and build application.
3. Deploy artifacts only on successful build.

## Operational Checks

- Health check by loading key routes:
  - /
  - /sign-in
  - /dashboard (authenticated)
- Validate API routes:
  - /api/trpc
  - resume parse and pdf endpoints
- Validate auth flows in production environment.

## Common Failure Modes and Fixes

- Dependency peer conflict during install
  - Align dependency versions in package.json and lockfile.
- Build-time type errors
  - Run npm run build locally before push.
- Environment mismatch
  - Confirm deployment env vars match local required set.

## Release Checklist

1. Pull latest main and rebase/merge feature branch.
2. Run npm install and npm run build locally.
3. Verify migrations are generated and committed if schema changed.
4. Confirm no secrets were committed.
5. Deploy and smoke test critical flows.
