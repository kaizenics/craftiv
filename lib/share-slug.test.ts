import { expect, test } from "vitest";

import { isValidShareSlug, normalizeShareSlug } from "@/lib/share-slug";

test("normalizeShareSlug turns a name into a clean link", () => {
  expect(normalizeShareSlug("  John Smith! ")).toBe("john-smith");
  expect(normalizeShareSlug("Ana--María_Cruz")).toBe("ana-mar-a-cruz");
  expect(normalizeShareSlug("-x".repeat(30))).toHaveLength(39);
});

test("isValidShareSlug accepts only lowercase words joined by single hyphens", () => {
  expect(isValidShareSlug("john-smith")).toBe(true);
  expect(isValidShareSlug("js2026")).toBe(true);
  for (const bad of ["jo", "John-Smith", "john--smith", "-john", "john-", "john_smith", "a".repeat(41), "../admin"]) {
    expect(isValidShareSlug(bad)).toBe(false);
  }
});
