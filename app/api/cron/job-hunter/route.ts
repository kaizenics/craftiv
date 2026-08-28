import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { dispatchDueHunts } from "@/lib/job-hunter/runner";
import { securityLog } from "@/lib/security/logging";

/**
 * The scheduler entry point.
 *
 * This is a dispatcher, not a worker: it claims a bounded batch of due hunts,
 * stops once its wall-clock budget is spent, and reports what remains. A deep
 * queue drains across ticks rather than holding one request open past the proxy
 * timeout. Schedule it every few minutes.
 *
 * Not covered by proxy.ts (its matcher is /dashboard, /cover-letter/write and
 * /resume/section), so the shared secret is the only gate here.
 *
 * Trigger it from a Coolify scheduled task. Note the runtime image is
 * node:22-bookworm-slim and ships no curl, so use node's global fetch:
 *
 *   node -e "fetch('http://127.0.0.1:3000/api/cron/job-hunter',{method:'POST',
 *     headers:{authorization:'Bearer '+process.env.CRON_SECRET}})
 *     .then(r=>r.text()).then(t=>{console.log(t);process.exit(0)})
 *     .catch(e=>{console.error(e);process.exit(1)})"
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const WALL_CLOCK_BUDGET_MS = 45_000;
const MAX_HUNTS_PER_TICK = 5;
const MIN_SECRET_LENGTH = 32;

/**
 * Compares over SHA-256 digests so the comparison is constant-length, and
 * fails closed when the secret is unset or too short. An empty environment
 * variable must never mean "this endpoint is open".
 */
function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < MIN_SECRET_LENGTH) return false;

  const header = request.headers.get("authorization") ?? "";
  const presented = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!presented) return false;

  const a = createHash("sha256").update(presented).digest();
  const b = createHash("sha256").update(secret).digest();
  return timingSafeEqual(a, b);
}

async function handle(request: NextRequest) {
  if (!isAuthorized(request)) {
    securityLog("cron_unauthorized", { route: "/api/cron/job-hunter" }, "warn");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();

  try {
    const result = await dispatchDueHunts({
      limit: MAX_HUNTS_PER_TICK,
      budgetMs: WALL_CLOCK_BUDGET_MS,
    });

    securityLog("job_hunter_cron_tick", { ...result, elapsedMs: Date.now() - startedAt });

    return NextResponse.json({ ...result, elapsedMs: Date.now() - startedAt });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    securityLog("job_hunter_cron_failed", { message }, "error");

    return NextResponse.json({ error: "Dispatch failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return handle(request);
}

/** Some schedulers can only issue GET. The secret still travels in the header. */
export async function GET(request: NextRequest) {
  return handle(request);
}
