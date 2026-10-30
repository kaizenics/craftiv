import { describe, expect, it } from "vitest";

import { safeRedirectPath } from "./safe-redirect";

describe("safeRedirectPath", () => {
  it("keeps an in-app path with its query and hash", () => {
    expect(safeRedirectPath("/resume/templates?from=upload#top")).toBe("/resume/templates?from=upload#top");
  });

  it.each([
    "//evil.com/fake-login",
    "/\\evil.com",
    "/\t/evil.com",
    // Dot segments collapse into a "//host" path after parsing.
    "/.//evil.com",
    "/..//evil.com",
    "/%2e//evil.com",
    "https://evil.com",
    "javascript:alert(1)",
    "dashboard",
    "",
    null,
  ])("sends %j home instead of off-site", (value) => {
    expect(safeRedirectPath(value)).toBe("/");
  });
});
