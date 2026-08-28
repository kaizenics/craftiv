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

/**
 * Mirrors the labelled panel a real OnlineJobs.ph posting shows above the
 * advert: TYPE OF WORK, WAGE / SALARY, HOURS PER WEEK, DATE UPDATED, then
 * JOB OVERVIEW. Extraction keys on those visible labels rather than on any
 * container class, so a restyle cannot silently break it.
 */
const LABELLED_HTML = `
<html><head><title>SEO Manager - Acme | OnlineJobs.ph</title></head><body>
  <h1>SEO Manager</h1>
  <div class="whatever-class-name-today">
    <div><span>TYPE OF WORK</span><p>Full Time</p></div>
    <div><span>WAGE / SALARY</span><p>PHP 60,000 - 90,000</p><p>Per Month</p></div>
    <div><span>HOURS PER WEEK</span><p>40</p></div>
    <div><span>DATE UPDATED</span><p>Aug 28, 2026</p></div>
  </div>
  <div>
    <h2>JOB OVERVIEW</h2>
    <p>The Opportunity:</p>
    <p>We are seeking an experienced SEO Manager to own and execute SEO work across our active client portfolio.</p>
    <p>Key Responsibilities: technical SEO, on-page optimization, local search, link building.</p>
  </div>
  <div><h2>SKILL REQUIREMENTS</h2><p>Should not leak into the overview.</p></div>
</body></html>`;

describe("labelled fields on a real posting layout", () => {
  it("reads type of work, salary, hours and the overview", () => {
    const detail = parseJobDetail(LABELLED_HTML);

    expect(detail.employmentType).toBe("Full Time");
    expect(detail.hoursPerWeek).toBe("40");
    expect(detail.description).toContain("experienced SEO Manager");
  });

  it("joins a salary split across lines into one readable value", () => {
    // "PHP 60,000 - 90,000" and "Per Month" are separate elements on the page.
    expect(parseJobDetail(LABELLED_HTML).salaryText).toBe("PHP 60,000 - 90,000 Per Month");
  });

  it("takes the posted date from DATE UPDATED", () => {
    expect(parseJobDetail(LABELLED_HTML).postedAt?.getUTCFullYear()).toBe(2026);
  });

  it("stops the overview at the next section", () => {
    // Without terminator labels the overview would swallow the rest of the page.
    expect(parseJobDetail(LABELLED_HTML).description).not.toContain("Should not leak");
  });

  it("treats a labelled page as structured even with no JSON-LD", () => {
    expect(parseJobDetail(LABELLED_HTML).structured).toBe(true);
  });

  it("takes the title from the heading", () => {
    expect(parseJobDetail(LABELLED_HTML).title).toBe("SEO Manager");
  });

  it("survives the labels being restyled onto one line with the value", () => {
    const inline = `<html><body><h1>VA</h1>
      <p>TYPE OF WORK: Part Time</p>
      <p>HOURS PER WEEK: 20</p>
      <p>JOB OVERVIEW</p>
      <p>${"Manage the inbox and calendar for a small team. ".repeat(3)}</p>
    </body></html>`;

    const detail = parseJobDetail(inline);
    expect(detail.employmentType).toBe("Part Time");
    expect(detail.hoursPerWeek).toBe("20");
    expect(detail.description).toContain("Manage the inbox");
  });

  it("prefers the visible overview when JSON-LD carries only a teaser", () => {
    const withTeaser = LABELLED_HTML.replace(
      "<h1>SEO Manager</h1>",
      `<script type="application/ld+json">{"@type":"JobPosting","title":"SEO Manager",
       "description":"Short teaser.","hiringOrganization":{"name":"Acme"}}</script><h1>SEO Manager</h1>`,
    );

    const detail = parseJobDetail(withTeaser);
    expect(detail.company).toBe("Acme");
    // The fuller body wins, so a truncated teaser does not cost us the advert.
    expect(detail.description).toContain("Key Responsibilities");
  });

  it("leaves fields empty rather than guessing when the labels are absent", () => {
    const bare = `<html><body><h1>Role</h1><div><p>${"Just prose with no labels at all. ".repeat(4)}</p></div></body></html>`;
    const detail = parseJobDetail(bare);

    expect(detail.employmentType).toBe("");
    expect(detail.salaryText).toBe("");
    expect(detail.hoursPerWeek).toBe("");
    expect(detail.structured).toBe(false);
  });
});
