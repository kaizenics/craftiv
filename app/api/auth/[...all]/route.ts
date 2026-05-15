import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { enforceRouteRateLimits } from "@/lib/security/guards";
import { securityRequestId } from "@/lib/security/logging";

const authHandler = toNextJsHandler(auth.handler);

async function withRateLimit(request: Request, handler: (request: Request) => Promise<Response>) {
  const requestId = securityRequestId(request.headers.get("x-request-id"));
  const limitResult = await enforceRouteRateLimits({
    category: "global",
    route: "/api/auth",
    requestHeaders: request.headers,
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
  return handler(request);
}

export const GET = async (request: Request) => withRateLimit(request, authHandler.GET);
export const POST = async (request: Request) => withRateLimit(request, authHandler.POST);

