import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { enforceRouteRateLimits } from "@/lib/security/guards";
import { hashForLogs, securityLog, securityRequestId } from "@/lib/security/logging";
import { isDisposableEmail } from "@/lib/security/disposable-email";

const authHandler = toNextJsHandler(auth.handler);

const AUTH_SENSITIVE_PATHS = new Set([
  "/api/auth/sign-up/email",
  "/api/auth/sign-in/email",
  "/api/auth/sign-in/email-otp",
  "/api/auth/email-otp/send-verification-otp",
  "/api/auth/email-otp/check-verification-otp",
  "/api/auth/email-otp/request-password-reset",
  "/api/auth/email-otp/reset-password",
]);

const DISPOSABLE_EMAIL_ENFORCED_PATHS = new Set([
  "/api/auth/sign-up/email",
  "/api/auth/sign-in/email-otp",
  "/api/auth/email-otp/send-verification-otp",
]);

async function extractEmailFromJsonBody(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) return null;

    const body = (await request.clone().json()) as {
      email?: unknown;
      newEmail?: unknown;
    };
    const rawEmail = typeof body.email === "string" ? body.email : body.newEmail;
    return typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : null;
  } catch {
    return null;
  }
}

function rateLimitedResponse(requestId: string, retryAfterSeconds: number) {
  return new Response(JSON.stringify({ error: "Too many requests", requestId }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(retryAfterSeconds),
    },
  });
}

async function withRateLimit(request: Request, handler: (request: Request) => Promise<Response>) {
  const requestId = securityRequestId(request.headers.get("x-request-id"));
  const pathname = new URL(request.url).pathname;
  const isPost = request.method.toUpperCase() === "POST";

  if (isPost && AUTH_SENSITIVE_PATHS.has(pathname)) {
    const sensitiveLimitResult = await enforceRouteRateLimits({
      category: "auth_sensitive",
      route: pathname,
      requestHeaders: request.headers,
      requestId,
    });
    if (!sensitiveLimitResult.allowed) {
      return rateLimitedResponse(requestId, sensitiveLimitResult.retryAfterSeconds);
    }
  }

  if (isPost && DISPOSABLE_EMAIL_ENFORCED_PATHS.has(pathname)) {
    const email = await extractEmailFromJsonBody(request);
    if (email && isDisposableEmail(email)) {
      securityLog(
        "disposable_email_blocked",
        {
          requestId,
          route: pathname,
          emailHash: hashForLogs(email),
        },
        "warn",
      );
      return new Response(
        JSON.stringify({
          code: "DISPOSABLE_EMAIL_NOT_ALLOWED",
          error: "Please use a non-disposable email address.",
          requestId,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }
  }

  const limitResult = await enforceRouteRateLimits({
    category: "global",
    route: "/api/auth",
    requestHeaders: request.headers,
    requestId,
  });
  if (!limitResult.allowed) {
    return rateLimitedResponse(requestId, limitResult.retryAfterSeconds);
  }
  return handler(request);
}

export const GET = async (request: Request) => withRateLimit(request, authHandler.GET);
export const POST = async (request: Request) => withRateLimit(request, authHandler.POST);
