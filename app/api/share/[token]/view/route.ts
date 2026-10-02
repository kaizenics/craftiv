import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { headers } from "next/headers";

import { db } from "@/db";
import { resumeShareViews, resumes } from "@/db/schema";
import { auth } from "@/lib/auth";
import { enforceRouteRateLimits } from "@/lib/security/guards";
import { securityRequestId } from "@/lib/security/logging";
import { getClientIpFromHeaders } from "@/lib/security/request";
import { isLikelyBot, isValidShareToken, shareVisitorHash, utcDay } from "@/lib/share";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE = "/api/share/view";

/**
 * Records one view of a shared resume. Called once by the public page on load.
 * The owner's own views, crawlers and repeat visits on the same day don't count.
 */
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!isValidShareToken(token)) {
    return Response.json({ counted: false }, { status: 404 });
  }

  const requestId = securityRequestId(request.headers.get("x-request-id"));
  const rateLimit = await enforceRouteRateLimits({
    category: "global",
    route: ROUTE,
    requestHeaders: request.headers,
    requestId,
  });
  if (!rateLimit.allowed) {
    return Response.json({ counted: false }, { status: 429 });
  }

  const userAgent = request.headers.get("user-agent");
  if (isLikelyBot(userAgent)) {
    return Response.json({ counted: false });
  }

  const resume = await db.query.resumes.findFirst({
    columns: { id: true, userId: true },
    where: and(eq(resumes.shareToken, token), eq(resumes.shareEnabled, true)),
  });
  if (!resume) {
    return Response.json({ counted: false }, { status: 404 });
  }

  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user?.id === resume.userId) {
    return Response.json({ counted: false });
  }

  const now = new Date();
  const day = utcDay(now);
  await db
    .insert(resumeShareViews)
    .values({
      id: randomUUID(),
      resumeId: resume.id,
      visitorHash: shareVisitorHash({
        ip: getClientIpFromHeaders(request.headers),
        userAgent: userAgent ?? "",
        day,
      }),
      viewedOn: day,
      createdAt: now,
    })
    .onConflictDoNothing();

  return Response.json({ counted: true });
}
