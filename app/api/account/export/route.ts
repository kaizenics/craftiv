import { headers } from "next/headers";

import { db } from "@/db";
import { auth } from "@/lib/auth";
import { buildAccountExport } from "@/lib/account-export";
import { enforceRouteRateLimits } from "@/lib/security/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Downloads everything stored about the signed-in user as one JSON file. */
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return Response.json({ error: "Sign in to download your data." }, { status: 401 });
  }

  // The export reads every table the user owns, so it is limited like other heavy reads.
  const limit = await enforceRouteRateLimits({
    category: "global",
    route: "/api/account/export",
    requestHeaders: request.headers,
    userId: session.user.id,
  });
  if (!limit.allowed) {
    return Response.json(
      { error: `Too many downloads. Try again in ${limit.retryAfterSeconds} seconds.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const data = await buildAccountExport(db, session.user.id);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="craftiv-data-${new Date().toISOString().slice(0, 10)}.json"`,
      // Personal data: never store it in a shared or browser cache.
      "Cache-Control": "no-store",
    },
  });
}
