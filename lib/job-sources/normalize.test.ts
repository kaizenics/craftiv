import { describe, expect, it } from "vitest";

import {
  buildSourceKey,
  capDescription,
  guessCompanyFromText,
  guessTitleFromText,
  hashJobContent,
  hashJobIdentity,
  htmlToPlainText,
  normalizeForHash,
  safeParseUrl,
} from "./normalize";

describe("buildSourceKey", () => {
  it("namespaces the id by source", () => {
    expect(buildSourceKey("onlinejobs_ph", "123")).toBe("onlinejobs_ph:123");
    // The same external id from two sources must not collide.
    expect(buildSourceKey("manual", "123")).not.toBe(buildSourceKey("onlinejobs_ph", "123"));
  });
});

describe("hashJobIdentity", () => {
  it("is stable across whitespace and case differences in the same advert", () => {
    const a = hashJobIdentity({ title: "Virtual Assistant", description: "Manage   the calendar." });
    const b = hashJobIdentity({ title: "virtual assistant", description: "Manage the calendar.\n" });

    expect(a).toBe(b);
  });

  it("differs for genuinely different adverts", () => {
    expect(hashJobIdentity({ title: "Bookkeeper", description: "AR and AP." })).not.toBe(
      hashJobIdentity({ title: "Designer", description: "Figma work." }),
    );
  });

  it("prefers the URL when one is present, so body edits do not fork identity", () => {
    const url = "https://example.com/jobs/9";

    expect(hashJobIdentity({ url, description: "first version" })).toBe(
      hashJobIdentity({ url, description: "a substantially rewritten version" }),
    );
  });
});

describe("hashJobContent", () => {
  it("changes only when the content changes", () => {
    const base = { title: "VA", company: "Acme", description: "Calendar management." };

    expect(hashJobContent(base)).toBe(hashJobContent({ ...base }));
    expect(hashJobContent(base)).not.toBe(
      hashJobContent({ ...base, description: "Calendar and inbox management." }),
    );
  });
});

describe("htmlToPlainText", () => {
  it("strips tags and decodes common entities", () => {
    const html = "<p>Hiring a <strong>VA</strong> &amp; bookkeeper</p><ul><li>Excel</li></ul>";
    const text = htmlToPlainText(html);

    expect(text).toContain("Hiring a VA & bookkeeper");
    expect(text).toContain("- Excel");
    expect(text).not.toContain("<");
  });

  it("drops script and style bodies entirely", () => {
    const text = htmlToPlainText("<script>alert('x')</script><p>Real copy</p>");

    expect(text).not.toContain("alert");
    expect(text).toContain("Real copy");
  });
});

describe("capDescription", () => {
  it("leaves a short description untouched", () => {
    const result = capDescription("A short job advert.");

    expect(result.descriptionTruncated).toBe(false);
    expect(result.description).toBe("A short job advert.");
  });

  it("caps an oversized description and flags it", () => {
    // Bounding at the storage layer is what stops a stored job inflating any
    // prompt built from it later, whichever code path builds it.
    const result = capDescription("word ".repeat(5000), 100);

    expect(result.descriptionTruncated).toBe(true);
    expect(result.description.length).toBeLessThanOrEqual(100);
  });

  it("cuts on a word boundary rather than mid-token", () => {
    const result = capDescription(`${"a".repeat(40)} boundary ${"b".repeat(200)}`, 60);

    expect(result.description.endsWith(" ")).toBe(false);
    expect(result.description).not.toMatch(/b{1,}$/);
  });
});

describe("text guessing", () => {
  it("takes the first usable line as the title", () => {
    expect(guessTitleFromText("\n\nVirtual Assistant\nWe need help.")).toBe("Virtual Assistant");
  });

  it("falls back rather than returning an empty title", () => {
    expect(guessTitleFromText("")).toBe("Untitled role");
  });

  it("reads a labelled company line", () => {
    expect(guessCompanyFromText("VA role\nCompany: Acme BPO\nDetails")).toBe("Acme BPO");
  });

  it("reads an 'at Company' form", () => {
    expect(guessCompanyFromText("Bookkeeper at Acme Holdings\nFull time")).toBe("Acme Holdings");
  });

  it("returns empty rather than guessing wildly", () => {
    expect(guessCompanyFromText("just some prose with no employer named")).toBe("");
  });
});

describe("safeParseUrl", () => {
  it("accepts http and https", () => {
    expect(safeParseUrl("https://example.com")?.hostname).toBe("example.com");
    expect(safeParseUrl("http://example.com")?.hostname).toBe("example.com");
  });

  it("rejects non-web schemes so they can never reach an href", () => {
    expect(safeParseUrl("javascript:alert(1)")).toBeNull();
    expect(safeParseUrl("data:text/html,<script>")).toBeNull();
    expect(safeParseUrl("file:///etc/passwd")).toBeNull();
  });

  it("returns null on junk instead of throwing", () => {
    expect(safeParseUrl("not a url")).toBeNull();
    expect(safeParseUrl("")).toBeNull();
    expect(safeParseUrl(null)).toBeNull();
  });
});

describe("normalizeForHash", () => {
  it("collapses whitespace and lowercases", () => {
    expect(normalizeForHash("  Hello   World \n")).toBe("hello world");
  });
});
