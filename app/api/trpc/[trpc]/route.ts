import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { appRouter, createTRPCContext } from "@/trpc";
import { enforceRouteRateLimits } from "@/lib/security/guards";
import { securityRequestId } from "@/lib/security/logging";

const handler = async (req: Request) => {
  const requestId = securityRequestId(req.headers.get("x-request-id"));
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

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: createTRPCContext,
    onError:
      process.env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error(`tRPC failed on ${path ?? "<no-path>"}: ${error.message}`);
          }
        : undefined,
  });
};

export { handler as GET, handler as POST };