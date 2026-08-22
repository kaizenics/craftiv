# syntax=docker/dockerfile:1

# Craftiv on Coolify.
#
# Next.js runs from its standalone output, and the PDF export drives a real
# Chromium, so the runtime image installs one from Debian.

FROM node:22-bookworm-slim AS base
ENV PNPM_HOME="/pnpm" \
    PATH="/pnpm:$PATH" \
    NEXT_TELEMETRY_DISABLED=1 \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /app


# ── Dependencies ────────────────────────────────────────────────────────────
FROM base AS deps
# The runtime image supplies Chromium, so skip Playwright's browser download.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile


# ── Build ───────────────────────────────────────────────────────────────────
FROM base AS builder

# Inlined into the client bundle at build time, so they must be real values
# here — changing them later needs a rebuild, not just a restart. In Coolify,
# add them as environment variables with "Build Variable" enabled.
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

# db/index.ts builds a libsql client when the module is imported. A remote-style
# URL constructs lazily and never dials out, which lets the build run without
# touching the real database. Actual credentials arrive at runtime.
ENV TURSO_DATABASE_URL=libsql://build-time-stub.invalid \
    TURSO_AUTH_TOKEN=build-time-stub

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build


# ── Runtime ─────────────────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    # lib/server/launch-pdf-browser.ts hands this to playwright-core.
    PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium

# Chromium for the resume/cover-letter PDF routes, plus the fonts it falls back
# to when a template's Google Font cannot be fetched. ca-certificates lets it
# fetch them over HTTPS in the first place.
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
