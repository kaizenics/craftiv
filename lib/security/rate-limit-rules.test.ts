import assert from "node:assert/strict";
import { test } from "vitest";

import { buildRateLimitRules } from "@/lib/security/rate-limit-rules";

test("global category emits only the baseline rules", () => {
  assert.equal(buildRateLimitRules({ category: "global", route: "/r", ipHash: "ip", userHash: null }).length, 1);
  assert.equal(buildRateLimitRules({ category: "global", route: "/r", ipHash: "ip", userHash: "u" }).length, 2);
});

test("ai_heavy with a user emits the full ordered rule set with expected limits", () => {
  const rules = buildRateLimitRules({ category: "ai_heavy", route: "/r", ipHash: "ip", userHash: "u" });

  assert.deepEqual(rules, [
    { scope: "global_api", route: "/r", subjectType: "ip", subjectId: "ip", windowName: "minutely", windowSizeSeconds: 60, limit: 120 },
    { scope: "global_api", route: "/r", subjectType: "user", subjectId: "u", windowName: "minutely", windowSizeSeconds: 60, limit: 60 },
    { scope: "ai_heavy", route: "/r", subjectType: "ip", subjectId: "ip", windowName: "minutely", windowSizeSeconds: 60, limit: 30 },
    { scope: "ai_heavy", route: "/r", subjectType: "ip", subjectId: "ip", windowName: "daily", windowSizeSeconds: 86400, limit: 600 },
    { scope: "ai_heavy", route: "/r", subjectType: "user", subjectId: "u", windowName: "minutely", windowSizeSeconds: 60, limit: 10 },
    { scope: "ai_heavy", route: "/r", subjectType: "user", subjectId: "u", windowName: "daily", windowSizeSeconds: 86400, limit: 200 },
    { scope: "ai_heavy", route: "/r", subjectType: "ip_user", subjectId: "ip:u", windowName: "minutely", windowSizeSeconds: 60, limit: 12 },
  ]);
});

test("scoped categories without a user emit only the IP rules", () => {
  for (const category of ["ai_heavy", "pdf_export", "auth_sensitive"] as const) {
    const rules = buildRateLimitRules({ category, route: "/r", ipHash: "ip", userHash: null });
    // 1 global IP + 2 scoped IP (minutely + daily) = 3
    assert.equal(rules.length, 3);
  }
});
