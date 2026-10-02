import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { headers } from "next/headers";

import { db } from "@/db";
import { coverLetterShareViews, coverLetters, resumeShareViews, resumes } from "@/db/schema";
import { auth } from "@/lib/auth";
import { enforceRouteRateLimits } from "@/lib/security/guards";
import { securityRequestId } from "@/lib/security/logging";
import { getClientIpFromHeaders } from "@/lib/security/request";
import { isLikelyBot, isValidShareToken, shareVisitorHash, utcDay } from "@/lib/share";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE = "/api/share/view";

/**
 * Records one view of a shared resume, or cover letter with `?kind=coverLetter`.
 * Called once by the public page on load.
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

  const isCoverLetter = new URL(request.url).searchParams.get("kind") === "coverLetter";
  const shared = isCoverLetter
    ? await db.query.coverLetters.findFirst({
        columns: { id: true, userId: true },
        where: and(eq(coverLetters.shareToken, token), eq(coverLetters.shareEnabled, true)),
      })
    : await db.query.resumes.findFirst({
        columns: { id: true, userId: true },
        where: and(eq(resumes.shareToken, token), eq(resumes.shareEnabled, true)),
      });
  if (!shared) {
    return Response.json({ counted: false }, { status: 404 });
  }

  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user?.id === shared.userId) {
    return Response.json({ counted: false });
  }

  const now = new Date();
  const day = utcDay(now);
  const view = {
    id: randomUUID(),
    visitorHash: shareVisitorHash({
      ip: getClientIpFromHeaders(request.headers),
      userAgent: userAgent ?? "",
      day,
    }),
    viewedOn: day,
    createdAt: now,
  };
  if (isCoverLetter) {
    await db
      .insert(coverLetterShareViews)
      .values({ ...view, coverLetterId: shared.id })
      .onConflictDoNothing();
  } else {
    await db
      .insert(resumeShareViews)
      .values({ ...view, resumeId: shared.id })
      .onConflictDoNothing();
  }

  return Response.json({ counted: true });
}
