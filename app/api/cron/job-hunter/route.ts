import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { db } from "@/db";
import { dispatchDueHunts } from "@/lib/job-hunter/runner";
import { refreshAtsBoards } from "@/lib/job-sources/ats-boards";
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
// Run 5 at a time (HUNT_CONCURRENCY in the runner); the budget stops claiming early if hunts are slow.
const MAX_HUNTS_PER_TICK = 50;
// Boards are refreshed in parallel and each request times out at 20s; at a tick every
// few minutes, 3 a tick refreshes all ~70 boards well inside their 6-hour window.
const ATS_BOARDS_PER_TICK = 3;
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
    // Top up the shared company-board cache first, so this tick's hunts can find
    // what it brings in. Bounded by its own request timeouts; a failure here must
    // not cost the hunts their run.
    const atsBoards = await refreshAtsBoards(db, { maxBoards: ATS_BOARDS_PER_TICK }).catch((error: unknown) => {
      securityLog("ats_boards_refresh_failed", { message: error instanceof Error ? error.message : "unknown" }, "warn");
      return null;
    });

    const result = await dispatchDueHunts({
      limit: MAX_HUNTS_PER_TICK,
      // What the refresh used comes out of the hunts' share, so the tick stays inside maxDuration.
      budgetMs: Math.max(5_000, WALL_CLOCK_BUDGET_MS - (Date.now() - startedAt)),
    });

    securityLog("job_hunter_cron_tick", { ...result, atsBoards, elapsedMs: Date.now() - startedAt });

    return NextResponse.json({ ...result, atsBoards, elapsedMs: Date.now() - startedAt });
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
