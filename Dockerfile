# syntax=docker/dockerfile:1

# Craftiv on Coolify.
#
# Next.js runs from its standalone output, and the PDF export drives a real
# Chromium — Playwright's own build, installed during the build stage and
# copied in. A distro Chromium will not do: Debian's dies on startup because
# its crashpad handler rejects the flags Playwright passes.

FROM node:22-bookworm-slim AS base
ENV PNPM_HOME="/pnpm" \
    PATH="/pnpm:$PATH" \
    NEXT_TELEMETRY_DISABLED=1 \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /app


# ── Dependencies ────────────────────────────────────────────────────────────
FROM base AS deps
# The browser is installed explicitly in the builder stage, so skip the
# download Playwright's own install script would do here.
# HUSKY=0 stops the repo's `prepare` hook from failing the install: the build
# context carries no .git (see .dockerignore), and husky exits non-zero without it.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    HUSKY=0
COPY package.json pnpm-lock.yaml ./
# --ignore-scripts because nothing here needs a compile step — sharp and friends
# ship prebuilt platform binaries as optional dependencies. Without it pnpm fails
# the whole install over the build scripts it declines to run unattended.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts


# ── Build ───────────────────────────────────────────────────────────────────
FROM base AS builder

# Inlined into the client bundle at build time, so these must be real values
# here — changing them later needs a rebuild, not just a restart. In Coolify,
# add them as environment variables with "Build Variable" enabled.
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_SITE_URL

# db/index.ts builds a libsql client when the module is imported, so the build
# needs *a* URL. This remote-style stub constructs lazily and never dials out,
# letting the build run without touching the real database — and a value passed
# in still wins, since a default only applies when the arg is absent.
ARG TURSO_DATABASE_URL=libsql://build-time-stub.invalid
ARG TURSO_AUTH_TOKEN=build-time-stub

ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    TURSO_DATABASE_URL=$TURSO_DATABASE_URL \
    TURSO_AUTH_TOKEN=$TURSO_AUTH_TOKEN \
    HUSKY=0 \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

COPY --from=deps /app/node_modules ./node_modules

# Ahead of the source copy so the download is not repeated on every code change.
# The version comes from the installed playwright package, which keeps the
# browser matched to playwright-core without pinning a version here. Only the
# headless shell is fetched — every launch in this app is headless.
#
# Invoked directly rather than through `pnpm exec`, which insists on a
# package.json in the working directory and there is none until `COPY . .`.
RUN node node_modules/playwright/cli.js install --only-shell chromium

COPY . .
RUN pnpm build


# ── Runtime ─────────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS runner

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Chromium's shared libraries, plus the fonts it falls back to when a template's
# Google Font cannot be fetched (ca-certificates lets it fetch them at all).
# Debian's chromium package is installed for its dependency closure only — the
# browser that actually runs is Playwright's, copied in below.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        chromium \
        ca-certificates \
        fonts-liberation \
        fonts-dejavu-core \
        fonts-noto-core \
        fonts-noto-color-emoji \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /ms-playwright /ms-playwright

# Standalone carries its own traced node_modules and server.js; static assets
# and public/ are not part of it and have to come across separately.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "require('net').connect(process.env.PORT||3000,'127.0.0.1').on('connect',()=>process.exit(0)).on('error',()=>process.exit(1))"

CMD ["node", "server.js"]
