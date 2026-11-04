/** Shared by the browser (capturing ?ref=) and the server (minting and checking codes). */

// No 0/O, 1/I/L: invite codes get read aloud and typed by hand.
export const REFERRAL_CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
export const REFERRAL_CODE_LENGTH = 8;
const REFERRAL_CODE_PATTERN = new RegExp(`^[${REFERRAL_CODE_ALPHABET}]{${REFERRAL_CODE_LENGTH}}$`);

/** Where a visitor's ?ref= code waits until they have an account to claim it with. */
export const REFERRAL_STORAGE_KEY = "craftiv:referral";

export function normalizeReferralCode(value: string | null | undefined): string | null {
  const code = (value ?? "").trim().toUpperCase();
  return REFERRAL_CODE_PATTERN.test(code) ? code : null;
}
