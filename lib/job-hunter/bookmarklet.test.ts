import { describe, expect, it } from "vitest";

import { buildBookmarkletUrl } from "./bookmarklet";
import { CLIP_FRAGMENT_KEY, decodeClip, type ClippedJob } from "./clip";

/**
 * Runs the real bookmarklet body against a minimal DOM stub.
 *
 * The project has no jsdom, and adding one to verify a hundred lines of
 * extraction is a poor trade -- but shipping the extraction untested is worse,
 * because it is the part that has to survive contact with someone else's
 * markup. The stub implements only what the bookmarklet actually touches.
 */

type StubPage = {
  title: string;
  href: string;
  h1?: string;
  jsonLd?: unknown[];
  selection?: string;
  /** Leaf blocks the "largest text block" heuristic chooses between. */
  blocks?: string[];
};

type RunResult = { opened: string | null; alerted: string | null };

function runBookmarklet(page: StubPage): RunResult {
  const source = decodeURIComponent(
    buildBookmarkletUrl("https://craftiv.app").slice("javascript:".length),
  );

  const result: RunResult = { opened: null, alerted: null };

  const scriptNodes = (page.jsonLd ?? []).map((entry) => ({
    textContent: typeof entry === "string" ? entry : JSON.stringify(entry),
  }));

  const blockNodes = (page.blocks ?? []).map((text) => ({
    innerText: text,
    // Leaf nodes only; the bookmarklet skips any element containing another.
    querySelector: () => null,
  }));

  const documentStub = {
    title: page.title,
    querySelectorAll(selector: string) {
      if (selector.includes("ld+json")) return scriptNodes;
      return blockNodes;
    },
    querySelector(selector: string) {
      if (selector === "h1") return page.h1 ? { textContent: page.h1 } : null;
      return null;
    },
    createElement() {
      // Mimics the browser's innerHTML -> textContent tag stripping, which is
      // what the bookmarklet uses to flatten a JSON-LD description.
      let text = "";
      return {
        set innerHTML(value: string) {
          text = String(value)
            .replace(/<[^>]*>/g, " ")
            .replace(/&amp;/g, "&");
        },
        get textContent() {
          return text;
        },
      };
    },
  };

  const windowStub = {
    getSelection: () => ({ toString: () => page.selection ?? "" }),
    open: (url: string) => {
      result.opened = url;
      return null;
    },
  };

  const run = new Function(
    "window",
    "document",
    "location",
    "alert",
    "btoa",
    "TextEncoder",
    source,
  );

  run(
    windowStub,
    documentStub,
    { href: page.href },
    (message: string) => {
      result.alerted = message;
    },
    (binary: string) => Buffer.from(binary, "binary").toString("base64"),
    TextEncoder,
  );

  return result;
}

function clipFrom(result: RunResult): ClippedJob | null {
  if (!result.opened) return null;
  const encoded = new URL(result.opened).hash.replace(`#${CLIP_FRAGMENT_KEY}=`, "");
  return decodeClip(encoded);
}

const JSON_LD_JOB = {
  "@context": "https://schema.org",
  "@type": "JobPosting",
  title: "Executive Virtual Assistant",
  description:
    "<p>Manage calendars &amp; inbox for three executives, book travel, and keep the CRM tidy.</p><ul><li>HubSpot</li></ul>",
  hiringOrganization: { "@type": "Organization", name: "Acme BPO" },
  jobLocation: { "@type": "Place", address: { addressLocality: "Manila", addressCountry: "PH" } },
};

const PAGE: StubPage = {
  title: "Virtual Assistant - Acme | OnlineJobs.ph",
  href: "https://www.onlinejobs.ph/jobseekers/job/Virtual-Assistant-1234567",
  h1: "Executive Virtual Assistant",
  jsonLd: [JSON_LD_JOB],
};

describe("the clipper bookmarklet", () => {
  it("extracts a job from schema.org JSON-LD", () => {
    const clip = clipFrom(runBookmarklet(PAGE));

    expect(clip).toMatchObject({
      title: "Executive Virtual Assistant",
      company: "Acme BPO",
      location: "Manila, PH",
      url: "https://www.onlinejobs.ph/jobseekers/job/Virtual-Assistant-1234567",
    });
    expect(clip!.description).toContain("Manage calendars & inbox for three executives");
    expect(clip!.description).not.toContain("<p>");
  });

  it("navigates to the job hunter page with the clip in the fragment", () => {
    const { opened } = runBookmarklet(PAGE);

    expect(opened).toContain("https://craftiv.app/dashboard/job-hunter#");
    expect(opened).toContain(CLIP_FRAGMENT_KEY);
  });

  /**
   * A user highlighting the advert is a better signal than any heuristic, and
   * it keeps working on every site regardless of markup.
   */
  it("prefers the user's selection over JSON-LD", () => {
    const clip = clipFrom(
      runBookmarklet({ ...PAGE, selection: "The advert text the user highlighted themselves." }),
    );

    expect(clip!.description).toBe("The advert text the user highlighted themselves.");
    // Structured fields are still taken from JSON-LD.
    expect(clip!.company).toBe("Acme BPO");
  });

  it("falls back to the largest text block when there is no JSON-LD", () => {
    const advert = "We need a social media manager to run campaigns. ".repeat(3);
    const clip = clipFrom(
      runBookmarklet({
        title: "Social Media Manager - Acme | OnlineJobs.ph",
        href: "https://www.onlinejobs.ph/jobseekers/job/Social-Media-Manager-99",
        h1: "Social Media Manager",
        blocks: ["Short sidebar", advert, "Footer"],
      }),
    );

    expect(clip!.description).toContain("social media manager");
    expect(clip!.title).toBe("Social Media Manager");
    expect(clip!.company).toBe("");
  });

  it("finds a JobPosting nested inside an @graph", () => {
    const clip = clipFrom(
      runBookmarklet({
        ...PAGE,
        jsonLd: [{ "@graph": [{ "@type": "Organization", name: "x" }, JSON_LD_JOB] }],
      }),
    );

    expect(clip!.title).toBe("Executive Virtual Assistant");
  });

  it("skips a malformed JSON-LD block and keeps looking", () => {
    const clip = clipFrom(runBookmarklet({ ...PAGE, jsonLd: ["{ not json }", JSON_LD_JOB] }));

    expect(clip!.company).toBe("Acme BPO");
  });

  it("asks the user to select the text rather than clipping something useless", () => {
    const result = runBookmarklet({
      title: "Some page",
      href: "https://example.com/x",
      blocks: ["tiny"],
    });

    expect(result.opened).toBeNull();
    expect(result.alerted).toContain("Select the job description");
  });

  it("falls back to the document title, trimming the site suffix", () => {
    const clip = clipFrom(
      runBookmarklet({
        title: "Bookkeeper - Acme | OnlineJobs.ph",
        href: "https://www.onlinejobs.ph/jobseekers/job/Bookkeeper-5",
        blocks: ["Reconcile accounts and manage AR and AP for a growing team every month."],
      }),
    );

    expect(clip!.title).toBe("Bookkeeper");
  });
});
