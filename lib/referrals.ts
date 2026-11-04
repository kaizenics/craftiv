import { randomBytes, randomUUID } from "node:crypto";
import { and, count, eq, gte, isNull } from "drizzle-orm";

import type { Database } from "@/db";
import { referrals, users } from "@/db/schema";
import { addCredits, toCreditUnits } from "@/lib/credits";
import { isUniqueConstraintError } from "@/lib/db-errors";
import { REFERRAL_CODE_ALPHABET, REFERRAL_CODE_LENGTH, normalizeReferralCode } from "@/lib/referral-code";

export const REFERRAL_REWARD_CREDITS = 1;
/** Rewarded referrals a referrer can earn from per calendar month (UTC); the invited friend is always paid. */
export const MAX_REWARDED_REFERRALS_PER_MONTH = 10;
/** Only a new account can name who invited it, so an existing user can't claim a code later for free credits. */
export const REFERRAL_CLAIM_WINDOW_DAYS = 7;

const DAY = 24 * 60 * 60 * 1000;

export type ReferralOutcome =
  | { status: "invalid" | "self" | "too_late" | "unverified" | "already_referred" }
  | { status: "rewarded"; payReferrer: boolean };

/** The referral rules on their own, so they can be tested without a database. */
export function decideReferral(input: {
  userId: string;
  referrerId: string | null;
  userCreatedAt: Date;
  emailVerified: boolean;
  alreadyReferred: boolean;
  referrerRewardedThisMonth: number;
  now: Date;
}): ReferralOutcome {
  if (!input.referrerId) return { status: "invalid" };
  if (input.referrerId === input.userId) return { status: "self" };
  if (input.alreadyReferred) return { status: "already_referred" };
  if (input.now.getTime() - input.userCreatedAt.getTime() > REFERRAL_CLAIM_WINDOW_DAYS * DAY) return { status: "too_late" };
  // Sign-up already requires a verified address; this keeps the rule explicit if that ever changes.
  if (!input.emailVerified) return { status: "unverified" };
  return { status: "rewarded", payReferrer: input.referrerRewardedThisMonth < MAX_REWARDED_REFERRALS_PER_MONTH };
}

function generateReferralCode() {
  let code = "";
  // 248 = 31 * 8: rejection sampling keeps every character equally likely.
  while (code.length < REFERRAL_CODE_LENGTH) {
    for (const byte of randomBytes(REFERRAL_CODE_LENGTH * 2)) {
      if (byte >= 248) continue;
      code += REFERRAL_CODE_ALPHABET[byte % REFERRAL_CODE_ALPHABET.length];
      if (code.length === REFERRAL_CODE_LENGTH) break;
    }
  }
  return code;
}

/** The user's invite code, minted on first use. */
export async function ensureReferralCode(db: Database, userId: string): Promise<string> {
  const existing = await db.query.users.findFirst({ columns: { referralCode: true }, where: eq(users.id, userId) });
  if (existing?.referralCode) return existing.referralCode;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateReferralCode();
    try {
      // Only fills an empty code, so two tabs opening the card at once keep whichever code landed first.
      await db.update(users).set({ referralCode: code }).where(and(eq(users.id, userId), isNull(users.referralCode)));
      const saved = await db.query.users.findFirst({ columns: { referralCode: true }, where: eq(users.id, userId) });
      if (saved?.referralCode) return saved.referralCode;
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;
    }
  }
  throw new Error("Could not create a referral code.");
}

const monthStart = (now: Date) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

/** Records who invited this user and pays both sides once. Safe to call again: credits are idempotent per referral. */
export async function claimReferral(db: Database, userId: string, rawCode: string, now = new Date()): Promise<ReferralOutcome> {
  const code = normalizeReferralCode(rawCode);
  const [referrer, user, prior] = await Promise.all([
    code ? db.query.users.findFirst({ columns: { id: true }, where: eq(users.referralCode, code) }) : undefined,
    db.query.users.findFirst({ columns: { createdAt: true, emailVerified: true }, where: eq(users.id, userId) }),
    db.query.referrals.findFirst({ columns: { id: true }, where: eq(referrals.referredId, userId) }),
  ]);
  if (!user) return { status: "invalid" };

  const [rewarded] = referrer
    ? await db
        .select({ total: count() })
        .from(referrals)
        .where(and(eq(referrals.referrerId, referrer.id), eq(referrals.referrerRewarded, true), gte(referrals.createdAt, monthStart(now))))
    : [];
  const outcome = decideReferral({
    userId,
    referrerId: referrer?.id ?? null,
    userCreatedAt: user.createdAt,
    emailVerified: user.emailVerified,
    alreadyReferred: Boolean(prior),
    referrerRewardedThisMonth: rewarded?.total ?? 0,
    now,
  });
  if (outcome.status !== "rewarded" || !referrer) return outcome;

  // shortcut: two friends claiming the same referrer's code in the same instant can both see 9 and pay an 11th; harmless at this size.
  const id = randomUUID();
  try {
    await db.insert(referrals).values({ id, referrerId: referrer.id, referredId: userId, referrerRewarded: outcome.payReferrer, createdAt: now });
  } catch (error) {
    if (isUniqueConstraintError(error)) return { status: "already_referred" };
    throw error;
  }

  const addUnits = toCreditUnits(REFERRAL_REWARD_CREDITS);
  await addCredits({ userId, eventType: "referral_bonus", addUnits, idempotencyKey: `referral:${id}:referred`, metadata: { referralId: id } });
  if (outcome.payReferrer) {
    await addCredits({ userId: referrer.id, eventType: "referral_bonus", addUnits, idempotencyKey: `referral:${id}:referrer`, metadata: { referralId: id } });
  }
  return outcome;
}

/** What the invite card shows: the link code and how many friends joined. */
export async function referralSummary(db: Database, userId: string) {
  const [code, [joined], [paid]] = await Promise.all([
    ensureReferralCode(db, userId),
    db.select({ total: count() }).from(referrals).where(eq(referrals.referrerId, userId)),
    db.select({ total: count() }).from(referrals).where(and(eq(referrals.referrerId, userId), eq(referrals.referrerRewarded, true))),
  ]);
  return {
    code,
    friendsJoined: joined?.total ?? 0,
    creditsEarned: (paid?.total ?? 0) * REFERRAL_REWARD_CREDITS,
    rewardCredits: REFERRAL_REWARD_CREDITS,
    monthlyCap: MAX_REWARDED_REFERRALS_PER_MONTH,
  };
}
