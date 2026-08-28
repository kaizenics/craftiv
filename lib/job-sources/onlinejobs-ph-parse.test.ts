import { describe, expect, it } from "vitest";

import {
  buildCategoryUrl,
  buildSearchUrl,
  extractJsonLdJobPosting,
  parseJobDetail,
  parseSearchResults,
} from "./onlinejobs-ph-parse";

const LISTING_HTML = `
<html><body>
  <nav><a href="/jobseekers/search/c/web-programming">Web Programming</a></nav>
  <div class="jobpost-cat-box">
    <a href="/jobseekers/job/Virtual-Assistant-Data-Entry-1598449">
      <h4>Virtual Assistant / Data Entry</h4>
    </a>
    <a href="/jobseekers/job/Virtual-Assistant-Data-Entry-1598449">Apply</a>
  </div>
  <div class="jobpost-cat-box">
    <a href="https://www.onlinejobs.ph/jobseekers/job/Bookkeeper-Xero-1470022">Bookkeeper</a>
  </div>
  <a href="/jobseekers/job/865864">Legacy bare id</a>
  <footer><a href="/about">About</a></footer>
</body></html>
`;

describe("parseSearchResults", () => {
  it("finds every distinct job on a listing page", () => {
    const hits = parseSearchResults(LISTING_HTML);

    expect(hits.map((hit) => hit.externalId)).toEqual(["1598449", "1470022", "865864"]);
  });

  it("deduplicates a job linked more than once on the same page", () => {
    const hits = parseSearchResults(LISTING_HTML);

    expect(hits.filter((hit) => hit.externalId === "1598449")).toHaveLength(1);
  });

  it("derives a readable title hint from the slug", () => {
    const [first] = parseSearchResults(LISTING_HTML);

    expect(first.titleHint).toBe("Virtual Assistant Data Entry");
  });

  it("builds absolute URLs from relative hrefs", () => {
    const [first] = parseSearchResults(LISTING_HTML);

    expect(first.url).toBe(
      "https://www.onlinejobs.ph/jobseekers/job/Virtual-Assistant-Data-Entry-1598449",
    );
  });

  it("ignores navigation, category and footer links", () => {
    const hits = parseSearchResults(LISTING_HTML);

    // Only job URLs match the pattern, so chrome is excluded without needing to
    // know anything about the page's CSS classes.
    expect(hits.every((hit) => /^\d+$/.test(hit.externalId))).toBe(true);
  });

  it("returns nothing rather than throwing on an unrecognised page", () => {
    expect(parseSearchResults("<html><body><p>Nothing here</p></body></html>")).toEqual([]);
  });
});

const JSON_LD_HTML = `
<html><head>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "JobPosting",
  "title": "Executive Virtual Assistant",
  "description": "<p>Manage calendars and inbox.</p><ul><li>HubSpot</li></ul>",
  "datePosted": "2026-08-20",
  "employmentType": "FULL_TIME",
  "hiringOrganization": { "@type": "Organization", "name": "Acme BPO" },
  "jobLocation": {
    "@type": "Place",
    "address": { "addressLocality": "Manila", "addressCountry": "PH" }
  }
}
</script>
</head><body><h1>Executive Virtual Assistant</h1></body></html>
`;

describe("parseJobDetail with JSON-LD", () => {
  it("prefers the structured payload", () => {
    const detail = parseJobDetail(JSON_LD_HTML);

    expect(detail.structured).toBe(true);
    expect(detail.title).toBe("Executive Virtual Assistant");
    expect(detail.company).toBe("Acme BPO");
    expect(detail.location).toBe("Manila, PH");
    expect(detail.employmentType).toBe("FULL_TIME");
  });

  it("converts the HTML description to plain text", () => {
    const detail = parseJobDetail(JSON_LD_HTML);

    expect(detail.description).toContain("Manage calendars and inbox.");
    expect(detail.description).toContain("- HubSpot");
    expect(detail.description).not.toContain("<p>");
  });

  it("parses the posting date", () => {
    expect(parseJobDetail(JSON_LD_HTML).postedAt?.toISOString()).toContain("2026-08-20");
  });

  it("reads a JobPosting nested in an @graph", () => {
    const html = `<script type="application/ld+json">
      {"@graph":[{"@type":"Organization","name":"x"},{"@type":"JobPosting","title":"Bookkeeper"}]}
    </script>`;

    expect(extractJsonLdJobPosting(html)?.title).toBe("Bookkeeper");
  });

  it("skips a malformed JSON-LD block and keeps looking", () => {
    const html = `
      <script type="application/ld+json">{ not json }</script>
      <script type="application/ld+json">{"@type":"JobPosting","title":"Designer"}</script>`;

    expect(extractJsonLdJobPosting(html)?.title).toBe("Designer");
  });
});

describe("parseJobDetail fallback", () => {
  const FALLBACK_HTML = `
    <html><head><title>Social Media Manager - Acme | OnlineJobs.ph</title></head>
    <body>
      <nav><a href="/x">nav</a></nav>
      <script>var tracking = 1;</script>
      <div><p>Short sidebar</p></div>
      <div><p>${"We need a social media manager to run campaigns. ".repeat(12)}</p></div>
      <footer>footer text</footer>
    </body></html>`;

  it("flags that the heuristic path was used", () => {
    // Recorded on the row, so a redesign that drops JSON-LD is visible in the
    // data rather than only as quietly worse output.
    expect(parseJobDetail(FALLBACK_HTML).structured).toBe(false);
  });

  it("takes the title from the document title, trimming the site suffix", () => {
    expect(parseJobDetail(FALLBACK_HTML).title).toBe("Social Media Manager");
  });

  it("picks the largest prose block as the description", () => {
    const detail = parseJobDetail(FALLBACK_HTML);

    expect(detail.description).toContain("social media manager");
    expect(detail.description).not.toContain("tracking");
    expect(detail.description).not.toContain("footer text");
  });

  it("prefers an h1 over the document title when present", () => {
    const html = `<html><head><title>Ignored | OnlineJobs.ph</title></head>
      <body><h1>Real Heading</h1></body></html>`;

    expect(parseJobDetail(html).title).toBe("Real Heading");
  });

  it("does not throw on an empty document", () => {
    expect(() => parseJobDetail("")).not.toThrow();
  });
});

describe("URL builders", () => {
  it("builds a keyword search URL", () => {
    expect(buildSearchUrl("virtual assistant")).toBe(
      "https://www.onlinejobs.ph/jobseekers/jobsearch?jobkeyword=virtual+assistant",
    );
  });

  it("adds a page parameter only past the first page", () => {
    expect(buildSearchUrl("va", 1)).not.toContain("page=");
    expect(buildSearchUrl("va", 3)).toContain("page=3");
  });

  it("escapes a category path segment", () => {
    expect(buildCategoryUrl("web programming")).toBe(
      "https://www.onlinejobs.ph/jobseekers/search/c/web%20programming",
    );
  });
});
