import assert from "node:assert/strict";
import { test } from "vitest";

import { UNKNOWN_CLIENT_IP, normalizeIp, resolveClientIp } from "@/lib/security/request";

function headers(values: Record<string, string>) {
  const lower = new Map(Object.entries(values).map(([k, v]) => [k.toLowerCase(), v]));
  return { get: (name: string) => lower.get(name.toLowerCase()) ?? null };
}

const ONE_HOP = { TRUSTED_PROXY_HOPS: "1" };
const TWO_HOPS = { TRUSTED_PROXY_HOPS: "2" };

test("takes the entry the trusted proxy appended, not the client-supplied one", () => {
  // Client sent "1.2.3.4"; the proxy appended the address it actually saw.
  const ip = resolveClientIp(headers({ "x-forwarded-for": "1.2.3.4, 203.0.113.9" }), ONE_HOP);
  assert.equal(ip, "203.0.113.9");
});

test("a spoofed chain cannot manufacture a fresh bucket per request", () => {
  const real = "203.0.113.9";
  const seen = new Set<string>();

  for (const spoof of ["9.9.9.9", "8.8.8.8, 7.7.7.7", "1.1.1.1, 2.2.2.2, 3.3.3.3"]) {
    seen.add(resolveClientIp(headers({ "x-forwarded-for": `${spoof}, ${real}` }), ONE_HOP));
  }

  assert.deepEqual([...seen], [real]);
});

test("counts back from the right by the configured hop count", () => {
  const ip = resolveClientIp(
    headers({ "x-forwarded-for": "1.2.3.4, 203.0.113.9, 198.51.100.7" }),
    TWO_HOPS,
  );
  assert.equal(ip, "203.0.113.9");
});

test("a chain shorter than the hop count is not trusted", () => {
  assert.equal(resolveClientIp(headers({ "x-forwarded-for": "1.2.3.4" }), TWO_HOPS), UNKNOWN_CLIENT_IP);
  assert.equal(resolveClientIp(headers({}), ONE_HOP), UNKNOWN_CLIENT_IP);
});

test("hops=0 ignores forwarding headers entirely", () => {
  const ip = resolveClientIp(headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }), {
    TRUSTED_PROXY_HOPS: "0",
  });
  assert.equal(ip, UNKNOWN_CLIENT_IP);
});

test("legacy single-value headers are no longer trusted on their own", () => {
  // x-real-ip / cf-connecting-ip are client-writable unless the edge overwrites
  // them, which is what TRUSTED_CLIENT_IP_HEADER is for.
  const ip = resolveClientIp(
    headers({ "x-real-ip": "1.2.3.4", "cf-connecting-ip": "5.6.7.8" }),
    ONE_HOP,
  );
  assert.equal(ip, UNKNOWN_CLIENT_IP);
});

test("an explicitly trusted edge header outranks the forwarded chain", () => {
  const env = { TRUSTED_CLIENT_IP_HEADER: "cf-connecting-ip" };
  const ip = resolveClientIp(
    headers({ "cf-connecting-ip": "203.0.113.9", "x-forwarded-for": "1.2.3.4" }),
    env,
  );
  assert.equal(ip, "203.0.113.9");
});

test("IPv6 addresses collapse to their /64 prefix", () => {
  // One allocation must not yield 2^64 rate-limit buckets.
  const a = normalizeIp("2001:db8:abcd:0012:0000:0000:0000:0001");
  const b = normalizeIp("2001:db8:abcd:12::ffff");
  assert.equal(a, "2001:0db8:abcd:0012::/64");
  assert.equal(a, b);
});

test("ports and IPv4-mapped forms normalize to the bare address", () => {
  assert.equal(normalizeIp("203.0.113.9:44321"), "203.0.113.9");
  assert.equal(normalizeIp("[2001:db8::1]:443"), "2001:0db8:0000:0000::/64");
  assert.equal(normalizeIp("::ffff:203.0.113.9"), "203.0.113.9");
});

test("garbage never becomes a rate-limit subject", () => {
  for (const value of ["", "   ", "not-an-ip", "999.1.1.1", "2001:db8::1::2"]) {
    assert.equal(normalizeIp(value), null, `expected null for ${JSON.stringify(value)}`);
  }
  assert.equal(resolveClientIp(headers({ "x-forwarded-for": "not-an-ip" }), ONE_HOP), UNKNOWN_CLIENT_IP);
});
