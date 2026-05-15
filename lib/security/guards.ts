import { NextRequest, NextResponse } from "next/server";

import { consumeRateLimitRule, type RateLimitDecision, type RateLimitRule, type RateLimitScope } from "@/lib/security/rate-limit";
import { getClientIp, getClientIpFromHeaders } from "@/lib/security/request";
import { hashForLogs, recordSecurityAlertCounter, securityLog, securityRequestId } from "@/lib/security/logging";

export type SecurityCategory =
  | "global"
  | "ai_heavy"
  | "pdf_export"
  | "auth_sensitive";

type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
  blockedRule?: RateLimitRule;
  decisions: Array<{ rule: RateLimitRule; decision: RateLimitDecision }>;
};

function toScope(category: SecurityCategory): RateLimitScope {
  if (category === "ai_heavy") return "ai_heavy";
  if (category === "pdf_export") return "pdf_export";
  if (category === "auth_sensitive") return "auth_sensitive";
  return "global_api";
}

function buildRules(params: {
  category: SecurityCategory;
  route: string;
  ipHash: string;
  userHash: string | null;
}): RateLimitRule[] {
  const rules: RateLimitRule[] = [];
  const scope = toScope(params.category);

  rules.push({
    scope: "global_api",
    route: params.route,
    subjectType: "ip",
    subjectId: params.ipHash,
    windowName: "minutely",
    windowSizeSeconds: 60,
    limit: 120,
  });

  if (params.userHash) {
    rules.push({
      scope: "global_api",
      route: params.route,
      subjectType: "user",
      subjectId: params.userHash,
      windowName: "minutely",
      windowSizeSeconds: 60,
      limit: 60,
    });
  }

  if (scope === "ai_heavy") {
    rules.push({
      scope,
      route: params.route,
      subjectType: "ip",
      subjectId: params.ipHash,
      windowName: "minutely",
      windowSizeSeconds: 60,
      limit: 30,
    });
    rules.push({
      scope,
      route: params.route,
      subjectType: "ip",
      subjectId: params.ipHash,
      windowName: "daily",
      windowSizeSeconds: 24 * 60 * 60,
      limit: 600,
    });

    if (params.userHash) {
      rules.push({
        scope,
        route: params.route,
        subjectType: "user",
        subjectId: params.userHash,
        windowName: "minutely",
        windowSizeSeconds: 60,
        limit: 10,
      });
      rules.push({
        scope,
        route: params.route,
        subjectType: "user",
        subjectId: params.userHash,
        windowName: "daily",
        windowSizeSeconds: 24 * 60 * 60,
        limit: 200,
      });
      rules.push({
        scope,
        route: params.route,
        subjectType: "ip_user",
        subjectId: `${params.ipHash}:${params.userHash}`,
        windowName: "minutely",
        windowSizeSeconds: 60,
        limit: 12,
      });
    }
  }

  if (scope === "pdf_export") {
    rules.push({
      scope,
      route: params.route,
      subjectType: "ip",
      subjectId: params.ipHash,
      windowName: "minutely",
      windowSizeSeconds: 60,
      limit: 15,
    });
    rules.push({
      scope,
      route: params.route,
      subjectType: "ip",
      subjectId: params.ipHash,
      windowName: "daily",
      windowSizeSeconds: 24 * 60 * 60,
      limit: 100,
    });

    if (params.userHash) {
      rules.push({
        scope,
        route: params.route,
        subjectType: "user",
        subjectId: params.userHash,
        windowName: "minutely",
        windowSizeSeconds: 60,
        limit: 6,
      });
      rules.push({
        scope,
        route: params.route,
        subjectType: "user",
        subjectId: params.userHash,
        windowName: "daily",
        windowSizeSeconds: 24 * 60 * 60,
        limit: 40,
      });
      rules.push({
        scope,
        route: params.route,
        subjectType: "ip_user",
        subjectId: `${params.ipHash}:${params.userHash}`,
        windowName: "minutely",
        windowSizeSeconds: 60,
        limit: 7,
      });
    }
  }

  if (scope === "auth_sensitive") {
    rules.push({
      scope,
      route: params.route,
      subjectType: "ip",
      subjectId: params.ipHash,
      windowName: "minutely",
      windowSizeSeconds: 60,
      limit: 12,
    });
    rules.push({
      scope,
      route: params.route,
      subjectType: "ip",
      subjectId: params.ipHash,
      windowName: "daily",
      windowSizeSeconds: 24 * 60 * 60,
      limit: 120,
    });

    if (params.userHash) {
      rules.push({
        scope,
        route: params.route,
        subjectType: "user",
        subjectId: params.userHash,
        windowName: "minutely",
        windowSizeSeconds: 60,
        limit: 8,
      });
      rules.push({
        scope,
        route: params.route,
        subjectType: "user",
        subjectId: params.userHash,
        windowName: "daily",
        windowSizeSeconds: 24 * 60 * 60,
        limit: 80,
      });
      rules.push({
        scope,
        route: params.route,
        subjectType: "ip_user",
        subjectId: `${params.ipHash}:${params.userHash}`,
        windowName: "minutely",
        windowSizeSeconds: 60,
        limit: 8,
      });
    }
  }

  return rules;
}

async function consumeRules(rules: RateLimitRule[]): Promise<RateLimitResult> {
  const decisions: Array<{ rule: RateLimitRule; decision: RateLimitDecision }> = [];

  for (const rule of rules) {
    const decision = await consumeRateLimitRule(rule);
    decisions.push({ rule, decision });
    if (!decision.allowed) {
      return {
        allowed: false,
        retryAfterSeconds: decision.retryAfterSeconds,
        blockedRule: rule,
        decisions,
      };
    }
  }

  return {
    allowed: true,
    retryAfterSeconds: 0,
    decisions,
  };
}

export async function enforceRouteRateLimits(params: {
  category: SecurityCategory;
  route: string;
  requestHeaders: { get(name: string): string | null };
  userId?: string | null;
  requestId?: string;
}) {
  const requestId = securityRequestId(params.requestId);
  const ip = getClientIpFromHeaders(params.requestHeaders);
  const ipHash = hashForLogs(ip);
  const userHash = params.userId ? hashForLogs(params.userId) : null;
  const rules = buildRules({
    category: params.category,
    route: params.route,
    ipHash,
    userHash,
  });
  const result = await consumeRules(rules);

  if (!result.allowed) {
    securityLog(
      "rate_limited",
      {
        requestId,
        route: params.route,
        category: params.category,
        retryAfterSeconds: result.retryAfterSeconds,
        ipHash,
        userHash,
        blockedRule: result.blockedRule,
      },
      "warn",
    );
    recordSecurityAlertCounter({
      key: `rate_limited:${params.route}`,
      threshold: 25,
      requestId,
      details: { route: params.route, category: params.category },
    });
  }

  return {
    requestId,
    ipHash,
    userHash,
    ...result,
  };
}

export async function enforceApiRouteGuards(params: {
  request: NextRequest;
  route: string;
  category: SecurityCategory;
  userId?: string | null;
}) {
  const requestId = securityRequestId(params.request.headers.get("x-request-id"));
  const ipHash = hashForLogs(getClientIp(params.request));
  const userHash = params.userId ? hashForLogs(params.userId) : null;
  const result = await enforceRouteRateLimits({
    category: params.category,
    route: params.route,
    requestHeaders: params.request.headers,
    userId: params.userId,
    requestId,
  });

  securityLog("request_guard_checked", {
    requestId,
    route: params.route,
    category: params.category,
    ipHash,
    userHash,
    allowed: result.allowed,
  });

  if (!result.allowed) {
    return {
      ok: false as const,
      requestId,
      response: NextResponse.json(
        {
          code: "RATE_LIMITED",
          error: "Too many requests. Please try again later.",
          requestId,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(result.retryAfterSeconds),
          },
        },
      ),
    };
  }

  return {
    ok: true as const,
    requestId,
  };
}
