import { expect, test } from "vitest";

import { decideReferral, MAX_REWARDED_REFERRALS_PER_MONTH, REFERRAL_CLAIM_WINDOW_DAYS } from "@/lib/referrals";
import { normalizeReferralCode } from "@/lib/referral-code";

const now = new Date("2026-11-04T12:00:00Z");
const base = {
  userId: "friend",
  referrerId: "inviter",
  userCreatedAt: new Date(now.getTime() - 60_000),
  emailVerified: true,
  alreadyReferred: false,
  referrerRewardedThisMonth: 0,
  now,
};

test("a new, verified friend pays out to both sides", () => {
  expect(decideReferral(base)).toEqual({ status: "rewarded", payReferrer: true });
});

test("the referrer stops earning at the monthly cap, the friend is still paid", () => {
  expect(decideReferral({ ...base, referrerRewardedThisMonth: MAX_REWARDED_REFERRALS_PER_MONTH })).toEqual({
    status: "rewarded",
    payReferrer: false,
  });
});

test("blocks unknown codes, self-referral, repeat claims, old accounts and unverified email", () => {
  expect(decideReferral({ ...base, referrerId: null }).status).toBe("invalid");
  expect(decideReferral({ ...base, referrerId: "friend" }).status).toBe("self");
  expect(decideReferral({ ...base, alreadyReferred: true }).status).toBe("already_referred");
  const old = new Date(now.getTime() - (REFERRAL_CLAIM_WINDOW_DAYS + 1) * 24 * 60 * 60 * 1000);
  expect(decideReferral({ ...base, userCreatedAt: old }).status).toBe("too_late");
  expect(decideReferral({ ...base, emailVerified: false }).status).toBe("unverified");
});

test("normalizeReferralCode accepts only well-formed codes", () => {
  expect(normalizeReferralCode(" k7m2pq9x ")).toBe("K7M2PQ9X");
  expect(normalizeReferralCode("K7M2PQ9")).toBeNull();
  expect(normalizeReferralCode("K7M2PQ0X")).toBeNull(); // 0 is not in the alphabet
  expect(normalizeReferralCode("<script>")).toBeNull();
});
