<div align="center">
  <img src="public/craftiv.png" alt="Craftiv" width="72" height="72" />

  <h1>Craftiv</h1>

  <p><strong>Job matching, an ATS checker and an AI resume builder, in one workspace for the whole job search.</strong></p>

  <p>
    <a href="https://gocraftiv.com">Website</a>
    ·
    <a href="https://github.com/kaizenics/craftiv/releases">Releases</a>
    ·
    <a href="https://github.com/kaizenics/craftiv/issues">Report a bug</a>
  </p>

  <p>
    <img alt="Version" src="https://img.shields.io/github/package-json/v/kaizenics/craftiv?label=version" />
    <img alt="Status" src="https://img.shields.io/badge/status-beta-orange" />
    <img alt="License" src="https://img.shields.io/badge/license-MIT-blue" />
    <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" />
  </p>
</div>

---

## What it does

Craftiv takes a job seeker from "which jobs fit me?" to "I got the offer", without juggling five tools.

| | |
|---|---|
| **Resume builder** | 19 templates, matching cover letters, PDF and Word export that never cost credits, and import from an existing PDF or Word file. |
| **ATS checker** | Scores a resume against a job ad and shows what a screening system would miss. |
| **Job Hunter** | Finds roles that match your resume, scores each one and drafts a tailored application. |
| **Application tracker** | Board, spreadsheet-style table or calendar view. Tags, archive, follow-up reminders, CSV import/export and a weekly goal. |
| **Interview prep** | Likely questions with answers drawn from your own resume. |
| **Share links** | Send a resume as a link and see when it was opened. |
| **Bring your own AI** | Use your own OpenAI, Anthropic or OpenRouter key instead of credits. Keys are encrypted at rest. |

> [!NOTE]
> Craftiv is in **beta** (`0.x`). Features and data shapes may still change between releases.

## Tech stack

- **Framework:** [Next.js 16](https://nextjs.org) (App Router), React 19, TypeScript
- **UI:** Tailwind CSS v4, [shadcn/ui](https://ui.shadcn.com), Hugeicons, Motion
- **API:** [tRPC](https://trpc.io) with React Query
- **Database:** [Turso](https://turso.tech) (libSQL) with [Drizzle ORM](https://orm.drizzle.team)
- **Auth:** [Better Auth](https://better-auth.com) with email OTP and Google
- **AI:** OpenRouter by default; per-user OpenAI and Anthropic keys
- **Payments:** [Polar](https://polar.sh)
- **Email:** [Resend](https://resend.com)
- **PDF:** Playwright (Chromium) for exports, pdf.js for parsing uploads
- **Tests:** Vitest

## Getting started

### Prerequisites

- Node.js 22+
- [pnpm](https://pnpm.io)
- A [Turso](https://turso.tech) database (a local libSQL file also works for development)

### Setup

```bash
git clone https://github.com/kaizenics/craftiv.git
cd craftiv
pnpm install
cp .env.example .env.local   # then fill in the values below
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

`.env.example` lists every variable with comments. The ones you need to get running:

| Variable | Purpose |
|---|---|
| `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` | Session signing and the app's own URL |
| `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` | Database connection |
| `OPENROUTER_API_KEY` | AI features on credits |
| `RESEND_API_KEY`, `AUTH_EMAIL_FROM` | Sign-up codes and password resets |

Optional, per feature:

| Variable | Feature |
|---|---|
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google sign-in. Add `<app-url>/api/auth/callback/google` as a redirect URI. |
| `AI_KEY_ENCRYPTION_KEY` | "Your own AI" keys. 32+ random characters; changing it makes saved keys unreadable. |
| `POLAR_*` | Credit purchases. Sandbox and production use separate tokens and product IDs. |
| `CRON_SECRET` | Scheduled Job Hunter runs via `POST /api/cron/job-hunter`. |
| `TRUSTED_PROXY_HOPS` | How many proxies sit in front of the app, for per-IP rate limits. |

<details>
<summary><strong>Polar webhook</strong></summary>

Point a Polar webhook at `/api/payments/polar/webhook`, format **Raw**, with the `order.paid` and `order.refunded` events. `POLAR_WEBHOOK_SECRET` is shown once when you create it. `POLAR_SUCCESS_URL` defaults to `/dashboard/settings`.

</details>

### Database migrations

Migrations live in [`db/migrations`](db/migrations) as plain SQL. Each one says whether to apply it before deploying the code that reads it. Apply new files in order against your database, for example:

```bash
turso db shell <database> < db/migrations/0028_application_archive.sql
```

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` / `pnpm start` | Production build and server |
| `pnpm test` | Run the Vitest suite |
| `pnpm lint` | ESLint |
| `pnpm db:studio` | Browse the database with Drizzle Studio |

## Project structure

```
app/          Routes (App Router): landing, auth, dashboard, resume and cover-letter editors, API routes
components/   UI, grouped by area (dashboard, resume, ui = shadcn primitives)
db/           Drizzle schema and SQL migrations
lib/          Domain logic: ATS scoring, credits, tracker stats, CSV, security
trpc/         tRPC routers, one per area
public/       Static assets and template previews
```

## Deployment

The repo ships a [`Dockerfile`](Dockerfile) that builds Next.js in `standalone` mode with Chromium for PDF export. It runs on any container host (production uses Coolify). Apply pending migrations before deploying.

## Releases

Versions follow [Semantic Versioning](https://semver.org) and are automated by [`.github/workflows/version.yml`](.github/workflows/version.yml). Every push to `main` bumps the version from the commit messages since the last tag, updates `package.json`, tags it and publishes a GitHub prerelease:

| Commit | During the `0.x` beta | From `1.0.0` |
|---|---|---|
| `fix:`, `docs:`, `chore:`, `feat:` … | patch (`0.2.0` → `0.2.1`) | `feat` → minor, others → patch |
| `feat!:` / `fix!:` or a `BREAKING CHANGE:` footer | minor (`0.2.0` → `0.3.0`) | minor until a deliberate `1.0`/`2.0` |

Commits follow [Conventional Commits](https://www.conventionalcommits.org): `feat(scope): …`, `fix(scope): …`, `chore: …`.

## Contributing

1. Branch from `staging`.
2. Keep commits conventional so releases are versioned correctly.
3. Run `pnpm test` and `pnpm lint` before opening a pull request. The pre-push hook runs a full build.

## License

[MIT](LICENSE) © 2026 Niko
