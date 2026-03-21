# Auth and Security

## Authentication Model

- Provider: Better Auth
- Supported flows:
  - Email/password
  - Social provider sign-in (currently configured providers)

## Session Handling

- Session retrieval is performed on server side for protected operations.
- Client session state is used for UX decisions only, not trust boundaries.
- Cookie-based session handling is enabled via Better Auth Next.js integration.

## Authorization

- Protected tRPC procedures and route handlers validate authenticated user context.
- User-scoped resources (resumes, settings) enforce ownership checks before read/write.

## Route Protection Strategy

- Sensitive routes require session checks at server boundary.
- API endpoints that mutate or access private data require authenticated context.

## Security Controls

- Secrets and tokens are provided via environment variables.
- No secrets are hardcoded in application code.
- Input validation and typed procedures reduce malformed payload risks.
- Error messages avoid leaking internal implementation details.

## Security Improvement Backlog

- Add centralized audit logging for auth events and critical mutations.
- Add rate limiting for upload and parsing endpoints.
- Add optional CSRF review for critical form posts.
- Add dependency vulnerability monitoring in CI.
