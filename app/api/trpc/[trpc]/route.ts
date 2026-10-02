import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { appRouter, createTRPCContext } from "@/trpc";
import { MAX_TRPC_REQUEST_BYTES } from "@/lib/constants/prompt-limits";
import { enforceRouteRateLimits } from "@/lib/security/guards";
import { securityRequestId } from "@/lib/security/logging";

function payloadTooLarge(requestId: string) {
  return new Response(
    JSON.stringify({ error: "Request body is too large", requestId }),
    { status: 413, headers: { "Content-Type": "application/json" } },
  );
}

const handler = async (req: Request) => {
  const requestId = securityRequestId(req.headers.get("x-request-id"));

  /**
   * App Router route handlers have no body-size limit of their own — the 1MB
   * default belonged to the Pages API — so a single request could otherwise
   * stream unbounded data into a procedure. Checked before the rate limiter so
   * an oversized body is rejected without any database work.
   */
  const declaredLength = Number(req.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_TRPC_REQUEST_BYTES) {
    return payloadTooLarge(requestId);
  }
  const limitResult = await enforceRouteRateLimits({
    category: "global",
    route: "/api/trpc",
    requestHeaders: req.headers,
    requestId,
  });

  if (!limitResult.allowed) {
    return new Response(JSON.stringify({ error: "Too many requests", requestId }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(limitResult.retryAfterSeconds),
      },
    });
  }

  // A chunked request carries no content-length, and a lying one is still just
  // a header. Buffer the body against the same ceiling and hand tRPC a request
  // built from the bytes that actually arrived.
  let effectiveRequest = req;
  if (req.method !== "GET" && req.body) {
    const raw = await req.arrayBuffer();
    if (raw.byteLength > MAX_TRPC_REQUEST_BYTES) {
      return payloadTooLarge(requestId);
    }
    effectiveRequest = new Request(req.url, {
      method: req.method,
      headers: req.headers,
      body: raw,
    });
  }

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: effectiveRequest,
    router: appRouter,
    createContext: createTRPCContext,
    onError: ({ path, error }) => {
      // Expected client errors (bad input, not found, auth) are not worth a log line.
      if (error.code !== "INTERNAL_SERVER_ERROR") return;
      console.error(`tRPC failed on ${path ?? "<no-path>"} [${requestId}]:`, error.cause ?? error);
    },
  });
};

export { handler as GET, handler as POST };