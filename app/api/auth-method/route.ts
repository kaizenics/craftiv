import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { accounts, users } from "@/db/schema";
import { enforceRouteRateLimits } from "@/lib/security/guards";
import { securityRequestId } from "@/lib/security/logging";

/**
 * Which sign-in method an address uses, so the forgot-password screen can say
 * "this account uses Google" instead of hedging at everyone.
 *
 * This does disclose whether an address is registered. That is a deliberate,
 * already-paid cost: sign-up answers the same question for free by returning
 * "User already exists. Use another email.", so withholding it here bought
 * nothing but a confusing screen. The genuinely new bit is the method, and it
 * is only useful to someone who already knows the account exists.
 *
 * Guarded the same way as the auth endpoints themselves -- auth_sensitive caps
 * this at 12/min and 120/day per IP, which is the difference between answering
 * a person and letting someone grind a mailing list through it.
 */
export type AuthMethodResponse = {
  method: "google" | "password" | "none";
};

const ROUTE = "/api/auth-method";
const GOOGLE_PROVIDER = "google";
const CREDENTIAL_PROVIDER = "credential";

export async function POST(request: Request) {
  const requestId = securityRequestId(request.headers.get("x-request-id"));

  const limit = await enforceRouteRateLimits({
    category: "auth_sensitive",
    route: ROUTE,
    requestHeaders: request.headers,
    requestId,
  });

  if (!limit.allowed) {
    return Response.json(
      { error: "Too many requests", requestId },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let email: string | null = null;
  try {
    const body = (await request.json()) as { email?: unknown };
    email = typeof body.email === "string" ? body.email.trim().toLowerCase() : null;
  } catch {
    email = null;
  }

  if (!email) {
    return Response.json({ error: "An email address is required", requestId }, { status: 400 });
  }

  // Matched case-insensitively on both sides: Better Auth lowercases on the way
  // in, but rows predating that are not guaranteed to be normalised.
  const user = await db.query.users.findFirst({
    columns: { id: true },
    where: sql`lower(${users.email}) = ${email}`,
  });

  if (!user) {
    return Response.json({ method: "none" } satisfies AuthMethodResponse);
  }

  const linked = await db.query.accounts.findMany({
    columns: { providerId: true },
    where: eq(accounts.userId, user.id),
  });

  const providerIds = new Set(linked.map((account) => account.providerId));

  // A password is reported whenever one exists, including on accounts that also
  // have Google linked: for those the ordinary reset works, so sending them down
  // the "use Google" path would be wrong.
  if (providerIds.has(CREDENTIAL_PROVIDER) || providerIds.size === 0) {
    return Response.json({ method: "password" } satisfies AuthMethodResponse);
  }

  if (providerIds.has(GOOGLE_PROVIDER)) {
    return Response.json({ method: "google" } satisfies AuthMethodResponse);
  }

  return Response.json({ method: "password" } satisfies AuthMethodResponse);
}
