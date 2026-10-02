import { createHmac, randomBytes } from "node:crypto";

const TOKEN_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
export const SHARE_TOKEN_LENGTH = 10;
const SHARE_TOKEN_PATTERN = new RegExp(`^[0-9A-Za-z]{${SHARE_TOKEN_LENGTH}}$`);

/**
 * A random, URL-safe id for /r/<token>. 62^10 ≈ 8e17 values, so links can't be
 * enumerated. Rejection sampling keeps every character equally likely.
 */
export function generateShareToken(): string {
  let token = "";
  while (token.length < SHARE_TOKEN_LENGTH) {
    for (const byte of randomBytes(SHARE_TOKEN_LENGTH * 2)) {
      // 248 = 62 * 4: bytes at or above it would skew toward the first letters.
      if (byte >= 248) continue;
      token += TOKEN_ALPHABET[byte % 62];
      if (token.length === SHARE_TOKEN_LENGTH) break;
    }
  }
  return token;
}

export function isValidShareToken(value: string): boolean {
  return SHARE_TOKEN_PATTERN.test(value);
}

/** UTC calendar day as YYYY-MM-DD. */
export function utcDay(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Identifies a visitor for one day without storing their IP. The day is part of
 * the key, so the same visitor gets an unrelated hash tomorrow.
 */
export function shareVisitorHash(params: { ip: string; userAgent: string; day: string }): string {
  const secret = process.env.BETTER_AUTH_SECRET ?? "craftiv-share-views";
  return createHmac("sha256", `${secret}:share-views:${params.day}`)
    .update(`${params.ip}\n${params.userAgent}`)
    .digest("hex");
}

const BOT_USER_AGENT = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|whatsapp|telegram|discord|slack|headless|curl|wget|python-requests/i;

/** Link unfurlers and crawlers fetch shared pages too; they aren't views. */
export function isLikelyBot(userAgent: string | null | undefined): boolean {
  if (!userAgent?.trim()) return true;
  return BOT_USER_AGENT.test(userAgent);
}
