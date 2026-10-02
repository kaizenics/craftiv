import assert from "node:assert/strict";
import { test } from "vitest";

import {
  generateShareToken,
  isLikelyBot,
  isValidShareToken,
  SHARE_TOKEN_LENGTH,
  shareVisitorHash,
  utcDay,
} from "@/lib/share";

test("share tokens are fixed-length base62 and unique", () => {
  const tokens = new Set(Array.from({ length: 500 }, () => generateShareToken()));
  assert.equal(tokens.size, 500);
  for (const token of tokens) {
    assert.equal(token.length, SHARE_TOKEN_LENGTH);
    assert.ok(isValidShareToken(token), token);
  }
});

test("token validation rejects anything else", () => {
  assert.equal(isValidShareToken("short"), false);
  assert.equal(isValidShareToken("abc-def_gh"), false);
  assert.equal(isValidShareToken("../../etc/"), false);
});

test("visitor hash is stable within a day and changes across days", () => {
  const visitor = { ip: "203.0.113.7", userAgent: "Mozilla/5.0" };
  const a = shareVisitorHash({ ...visitor, day: "2026-10-02" });
  const b = shareVisitorHash({ ...visitor, day: "2026-10-02" });
  const c = shareVisitorHash({ ...visitor, day: "2026-10-03" });
  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.ok(!a.includes("203.0.113.7"));
});

test("utcDay formats as YYYY-MM-DD", () => {
  assert.equal(utcDay(new Date("2026-10-02T23:59:59Z")), "2026-10-02");
});

test("crawlers and empty user agents are not counted", () => {
  assert.equal(isLikelyBot("Mozilla/5.0 (compatible; Googlebot/2.1)"), true);
  assert.equal(isLikelyBot("Slackbot-LinkExpanding 1.0"), true);
  assert.equal(isLikelyBot(""), true);
  assert.equal(
    isLikelyBot("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36"),
    false,
  );
});
