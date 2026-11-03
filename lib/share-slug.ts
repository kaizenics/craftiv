/** Custom resume links (/r/john-smith). Kept free of node imports so the share dialog can validate as you type. */
export const SHARE_SLUG_LIMITS = { min: 3, max: 40 } as const;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** "John Smith!" → "john-smith": lowercase letters and digits joined by single hyphens. */
export function normalizeShareSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, SHARE_SLUG_LIMITS.max)
    .replace(/^-+|-+$/g, "");
}

// Share tokens are exactly 10 letters or digits (lib/share.ts). A custom link of that shape could stand in for
// someone's token once their sharing is off, so the two kinds of link never overlap.
const TOKEN_SHAPED = /^[a-z0-9]{10}$/;

export function isValidShareSlug(value: string): boolean {
  return (
    value.length >= SHARE_SLUG_LIMITS.min &&
    value.length <= SHARE_SLUG_LIMITS.max &&
    SLUG_PATTERN.test(value) &&
    !TOKEN_SHAPED.test(value)
  );
}
