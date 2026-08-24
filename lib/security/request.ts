import { NextRequest } from "next/server";

type HeadersLike = {
  get(name: string): string | null;
};

/** Just the settings these helpers read, so callers (and tests) need nothing more. */
export type ClientIpEnv = {
  TRUSTED_PROXY_HOPS?: string;
  TRUSTED_CLIENT_IP_HEADER?: string;
  [key: string]: string | undefined;
};

/**
 * How many reverse proxies sit between the public internet and this process.
 * Coolify's Traefik is one hop; putting Cloudflare (or another CDN) in front of
 * it makes two. Getting this wrong is not cosmetic — see resolveClientIp.
 */
const DEFAULT_TRUSTED_PROXY_HOPS = 1;
const MAX_TRUSTED_PROXY_HOPS = 10;

/** Shared bucket for requests whose origin cannot be established. */
export const UNKNOWN_CLIENT_IP = "unknown";

export function getTrustedProxyHops(env: ClientIpEnv = process.env): number {
  const raw = env.TRUSTED_PROXY_HOPS?.trim();
  if (!raw) return DEFAULT_TRUSTED_PROXY_HOPS;

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 0) return DEFAULT_TRUSTED_PROXY_HOPS;
  return Math.min(parsed, MAX_TRUSTED_PROXY_HOPS);
}

/**
 * Name of a header the edge sets and overwrites on every request (Cloudflare's
 * `cf-connecting-ip`, for example). When configured it outranks X-Forwarded-For,
 * because a header the edge always replaces cannot be spoofed by the client.
 * Leave unset unless you have confirmed your edge overwrites rather than appends.
 */
function getTrustedClientIpHeader(env: ClientIpEnv = process.env): string | null {
  return env.TRUSTED_CLIENT_IP_HEADER?.trim().toLowerCase() || null;
}

/**
 * Normalizes an address into a stable rate-limit subject.
 *
 * IPv6 is collapsed to its /64 prefix: a single residential or cloud allocation
 * hands out 2^64 addresses, so limiting per full IPv6 address limits nothing.
 * Ports and IPv4-mapped IPv6 forms are stripped so the same client always lands
 * in the same bucket.
 */
export function normalizeIp(rawValue: string): string | null {
  let value = rawValue.trim();
  if (!value) return null;

  // "[2001:db8::1]:443" — bracketed IPv6 with an optional port.
  const bracketed = value.match(/^\[([^\]]+)\](?::\d+)?$/);
  if (bracketed) {
    value = bracketed[1];
  } else if (value.split(":").length === 2) {
    // "203.0.113.5:443" — IPv4 with a port. A bare IPv6 has more than one colon.
    value = value.split(":")[0];
  }

  value = value.toLowerCase();

  // "::ffff:203.0.113.5" — IPv4-mapped IPv6.
  const mapped = value.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (mapped) {
    value = mapped[1];
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(value)) {
    const octets = value.split(".");
    if (octets.every((octet) => Number(octet) <= 255)) return value;
    return null;
  }

  if (!/^[0-9a-f:]+$/.test(value) || !value.includes(":")) return null;

  return toIpv6Prefix(value);
}

/** Expands an IPv6 address and keeps the first four groups (the /64 prefix). */
function toIpv6Prefix(value: string): string | null {
  const [head, tail, ...extra] = value.split("::");
  if (extra.length > 0) return null;

  const headGroups = head ? head.split(":") : [];
  const tailGroups = tail ? tail.split(":") : [];

  let groups: string[];
  if (tail === undefined) {
    groups = headGroups;
    if (groups.length !== 8) return null;
  } else {
    const fill = 8 - headGroups.length - tailGroups.length;
    if (fill < 0) return null;
    groups = [...headGroups, ...Array(fill).fill("0"), ...tailGroups];
  }

  if (groups.some((group) => group.length === 0 || group.length > 4)) return null;

  // Zero-padded rather than "::"-compressed: this string is a bucket key, and
  // "2001:db8::1" and "2001:db8:0:0::1" must not resolve to two different keys.
  return `${groups
    .slice(0, 4)
    .map((group) => group.padStart(4, "0"))
    .join(":")}::/64`;
}

/**
 * Resolves the client address to use as a rate-limit subject.
 *
 * X-Forwarded-For is a chain each proxy *appends* to, so any entry a trusted
 * proxy did not write is attacker-controlled. Reading the leftmost entry — the
 * usual shortcut — hands every caller a free rate-limit bucket per request: send
 * a different X-Forwarded-For each time and no per-IP limit ever applies.
 *
 * With N trusted proxies in front of us the last N entries were appended by
 * those proxies, and the real client address is the one the outermost trusted
 * proxy recorded: index `length - N`. Anything to the left of it came from the
 * client and is ignored. A chain shorter than N means the request did not
 * traverse the expected proxies, so nothing in it can be trusted.
 */
export function resolveClientIp(
  headersLike: HeadersLike,
  env: ClientIpEnv = process.env,
): string {
  const trustedHeader = getTrustedClientIpHeader(env);
  if (trustedHeader) {
    const direct = normalizeIp(headersLike.get(trustedHeader) ?? "");
    if (direct) return direct;
    return UNKNOWN_CLIENT_IP;
  }

  const hops = getTrustedProxyHops(env);
  // No proxy in front of us (local dev): every forwarding header is client-written.
  if (hops === 0) return UNKNOWN_CLIENT_IP;

  const chain = (headersLike.get("x-forwarded-for") ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  const index = chain.length - hops;
  if (index < 0) return UNKNOWN_CLIENT_IP;

  return normalizeIp(chain[index] ?? "") ?? UNKNOWN_CLIENT_IP;
}

export function getClientIpFromHeaders(headersLike: HeadersLike) {
  return resolveClientIp(headersLike);
}

/**
 * How many entries the forwarded chain actually carried, for diagnostics.
 *
 * TRUSTED_PROXY_HOPS set below the real number of proxies collapses every
 * caller into one bucket (the nearest proxy's address) and rate-limits the whole
 * site at once. That failure looks identical to a genuine flood in the logs
 * unless the depth is recorded next to it.
 */
export function getForwardedChainDepth(headersLike: HeadersLike): number {
  return (headersLike.get("x-forwarded-for") ?? "")
    .split(",")
    .filter((entry) => entry.trim().length > 0).length;
}

export function getClientIp(request: NextRequest) {
  return resolveClientIp(request.headers);
}

export function assertContentLength(request: NextRequest | Request, maxBytes: number) {
  const raw = request.headers.get("content-length");
  if (!raw) return;
  const bytes = Number(raw);
  if (!Number.isFinite(bytes)) return;
  if (bytes > maxBytes) {
    throw new Error(`Payload too large. Max ${maxBytes} bytes.`);
  }
}

export async function parseJsonWithLimit<T>(request: NextRequest | Request, maxBytes: number): Promise<T> {
  const raw = await request.text();
  const size = Buffer.byteLength(raw, "utf8");
  if (size > maxBytes) {
    throw new Error(`Payload too large. Max ${maxBytes} bytes.`);
  }
  return JSON.parse(raw) as T;
}
