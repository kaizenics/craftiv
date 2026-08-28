import { describe, expect, it } from "vitest";

import { buildBookmarkletUrl } from "./bookmarklet";
import { CLIP_FRAGMENT_KEY, decodeClip, encodeClip, readClipFromHash } from "./clip";

const JOB = {
  url: "https://www.onlinejobs.ph/jobseekers/job/Virtual-Assistant-1234567",
  title: "Virtual Assistant",
  company: "Acme BPO",
  location: "Remote, PH",
  description: "Manage calendars & inbox. Requires HubSpot #experience.",
};

describe("encodeClip / decodeClip", () => {
  it("round-trips a job unchanged", () => {
    expect(decodeClip(encodeClip(JOB))).toEqual(JOB);
  });

  it("survives characters that would break a query string", () => {
    // & and # would terminate or split a plain query param; base64url does not.
    const job = { ...JOB, description: "A & B #tag ?q=1 100% done\nnew line" };

    expect(decodeClip(encodeClip(job))?.description).toBe(job.description);
  });

  it("survives non-ASCII text", () => {
    const job = { ...JOB, company: "Café Ñoño 日本", description: "Tagalog: mabuhay — ok" };
    const decoded = decodeClip(encodeClip(job));

    expect(decoded?.company).toBe("Café Ñoño 日本");
    expect(decoded?.description).toBe("Tagalog: mabuhay — ok");
  });

  it("caps the description at the prompt input limit", () => {
    const encoded = encodeClip({ ...JOB, description: "x".repeat(20_000) });

    expect(decodeClip(encoded)!.description.length).toBe(5000);
  });

  it("caps the short fields", () => {
    const decoded = decodeClip(encodeClip({ ...JOB, title: "t".repeat(1000) }));

    expect(decoded!.title.length).toBe(200);
  });

  /**
   * The fragment is attacker-controllable: anyone can send someone a link with
   * a payload in it. It is treated as untrusted input, returns null on anything
   * malformed, and only ever prefills a form the user must submit themselves.
   */
  it("returns null rather than throwing on malformed input", () => {
    expect(decodeClip("")).toBeNull();
    expect(decodeClip("not-base64!!")).toBeNull();
    expect(decodeClip(Buffer.from("not json").toString("base64url"))).toBeNull();
    expect(decodeClip(Buffer.from('{"a":1}').toString("base64url"))).toBeNull();
  });

  it("rejects a payload with neither a description nor a URL", () => {
    const empty = Buffer.from(JSON.stringify({ title: "x" })).toString("base64url");

    expect(decodeClip(empty)).toBeNull();
  });

  it("coerces non-string fields instead of trusting them", () => {
    const hostile = Buffer.from(
      JSON.stringify({ description: "real text here", title: { evil: true }, url: 42 }),
    ).toString("base64url");

    const decoded = decodeClip(hostile);
    expect(decoded?.title).toBe("");
    expect(decoded?.url).toBe("");
  });
});

describe("readClipFromHash", () => {
  it("reads a clip from a location hash", () => {
    const hash = `#${CLIP_FRAGMENT_KEY}=${encodeClip(JOB)}`;

    expect(readClipFromHash(hash)?.title).toBe("Virtual Assistant");
  });

  it("tolerates a missing leading hash", () => {
    expect(readClipFromHash(`${CLIP_FRAGMENT_KEY}=${encodeClip(JOB)}`)?.company).toBe("Acme BPO");
  });

  it("ignores an unrelated fragment", () => {
    expect(readClipFromHash("#section-2")).toBeNull();
    expect(readClipFromHash("")).toBeNull();
  });
});

describe("buildBookmarkletUrl", () => {
  const url = buildBookmarkletUrl("https://craftiv.app");

  it("produces a javascript: URL with no raw newlines", () => {
    expect(url.startsWith("javascript:")).toBe(true);
    expect(url).not.toContain("\n");
  });

  it("targets the job hunter page with the clip fragment", () => {
    const decoded = decodeURIComponent(url.slice("javascript:".length));

    expect(decoded).toContain("/dashboard/job-hunter#" + CLIP_FRAGMENT_KEY);
  });

  it("tolerates a trailing slash on the app URL", () => {
    const decoded = decodeURIComponent(
      buildBookmarkletUrl("https://craftiv.app/").slice("javascript:".length),
    );

    expect(decoded).not.toContain("craftiv.app//dashboard");
  });

  it("prefers the user's selection over any heuristic", () => {
    const decoded = decodeURIComponent(url.slice("javascript:".length));

    // Precedence lives in the fallback chain, not in declaration order:
    // selection first, then JSON-LD, then the largest block.
    expect(decoded).toContain("var desc=sel||");
    expect(decoded).toMatch(/var desc=sel\|\|.*ld\.description.*\|\|biggest\(\)/);
  });

  it("never contacts a Craftiv server itself", () => {
    const decoded = decodeURIComponent(url.slice("javascript:".length));

    // The clipper hands off by navigation, so nothing of ours fetches the page
    // and no cross-origin request is made from the source site.
    expect(decoded).not.toContain("fetch(");
    expect(decoded).not.toContain("XMLHttpRequest");
  });
});
