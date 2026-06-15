import {
  DAY_SECONDS,
  GLOBAL_RATE_LIMITS,
  MINUTE_SECONDS,
  SCOPED_RATE_LIMITS,
} from "@/lib/constants/rate-limits";
import type { RateLimitRule, RateLimitScope } from "@/lib/security/rate-limit";

export type SecurityCategory =
  | "global"
  | "ai_heavy"
  | "pdf_export"
  | "auth_sensitive";

function toScope(category: SecurityCategory): RateLimitScope {
  if (category === "ai_heavy") return "ai_heavy";
  if (category === "pdf_export") return "pdf_export";
  if (category === "auth_sensitive") return "auth_sensitive";
  return "global_api";
}

/**
 * Builds the ordered list of rate-limit rules for a request. Rules are evaluated
 * in order and the first block wins, so order is significant: global limits
 * first, then the category's scoped limits.
 */
export function buildRateLimitRules(params: {
  category: SecurityCategory;
  route: string;
  ipHash: string;
  userHash: string | null;
}): RateLimitRule[] {
  const { route, ipHash, userHash } = params;
  const scope = toScope(params.category);
  const rules: RateLimitRule[] = [];

  // Global limits apply to every request.
  rules.push({
    scope: "global_api",
    route,
    subjectType: "ip",
    subjectId: ipHash,
    windowName: "minutely",
    windowSizeSeconds: MINUTE_SECONDS,
    limit: GLOBAL_RATE_LIMITS.ipPerMinute,
  });
  if (userHash) {
    rules.push({
      scope: "global_api",
      route,
      subjectType: "user",
      subjectId: userHash,
      windowName: "minutely",
      windowSizeSeconds: MINUTE_SECONDS,
      limit: GLOBAL_RATE_LIMITS.userPerMinute,
    });
  }

  const scoped = scope === "global_api" ? null : SCOPED_RATE_LIMITS[scope];
  if (scoped) {
    rules.push({
      scope,
      route,
      subjectType: "ip",
      subjectId: ipHash,
      windowName: "minutely",
      windowSizeSeconds: MINUTE_SECONDS,
      limit: scoped.ipPerMinute,
    });
    rules.push({
      scope,
      route,
      subjectType: "ip",
      subjectId: ipHash,
      windowName: "daily",
      windowSizeSeconds: DAY_SECONDS,
      limit: scoped.ipPerDay,
    });

    if (userHash) {
      rules.push({
        scope,
        route,
        subjectType: "user",
        subjectId: userHash,
        windowName: "minutely",
        windowSizeSeconds: MINUTE_SECONDS,
        limit: scoped.userPerMinute,
      });
      rules.push({
        scope,
        route,
        subjectType: "user",
        subjectId: userHash,
        windowName: "daily",
        windowSizeSeconds: DAY_SECONDS,
        limit: scoped.userPerDay,
      });
      rules.push({
        scope,
        route,
        subjectType: "ip_user",
        subjectId: `${ipHash}:${userHash}`,
        windowName: "minutely",
        windowSizeSeconds: MINUTE_SECONDS,
        limit: scoped.ipUserPerMinute,
      });
    }
  }

  return rules;
}
