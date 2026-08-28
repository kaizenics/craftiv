import { describe, expect, it } from "vitest";

import { buildJobDigestEmail, escapeHtml } from "./digest";

const BASE = {
  huntName: "Virtual Assistant roles",
  appUrl: "https://craftiv.app",
  newJobs: [],
  movedJobs: [],
  staleCount: 0,
};

describe("escapeHtml", () => {
  it("neutralises every character that can break out of markup", () => {
    expect(escapeHtml(`<script>alert('x')&"`)).toBe(
      "&lt;script&gt;alert(&#39;x&#39;)&amp;&quot;",
    );
  });
});

describe("buildJobDigestEmail", () => {
  /**
   * An empty digest trains people to ignore the next one, and complaints would
   * degrade delivery of the password-reset mail sharing this sending domain.
   */
  it("returns null when there is nothing to say", () => {
    expect(buildJobDigestEmail(BASE)).toBeNull();
  });

  it("builds a digest for new matches", () => {
    const built = buildJobDigestEmail({
      ...BASE,
      newJobs: [
        { title: "Virtual Assistant", company: "Acme BPO", score: 78, url: "https://x.test/1" },
      ],
    });

    expect(built).not.toBeNull();
    expect(built!.subject).toBe("1 new job for Virtual Assistant roles");
    expect(built!.html).toContain("Virtual Assistant");
    expect(built!.text).toContain("match 78");
  });

  it("pluralises the subject correctly", () => {
    const built = buildJobDigestEmail({
      ...BASE,
      newJobs: [
        { title: "A", company: "X", score: 70, url: "https://x.test/1" },
        { title: "B", company: "Y", score: 60, url: "https://x.test/2" },
      ],
    });

    expect(built!.subject).toBe("2 new jobs for Virtual Assistant roles");
  });

  /**
   * Job titles and company names come from a job board or a paste box. They are
   * third-party text going into HTML, which is a real injection vector.
   */
  it("escapes a script tag in a company name", () => {
    const built = buildJobDigestEmail({
      ...BASE,
      newJobs: [
        {
          title: "VA",
          company: "<script>alert(1)</script>",
          score: 50,
          url: "https://x.test/1",
        },
      ],
    });

    expect(built!.html).not.toContain("<script>");
    expect(built!.html).toContain("&lt;script&gt;");
  });

  it("refuses to link a javascript: URL", () => {
    const built = buildJobDigestEmail({
      ...BASE,
      newJobs: [{ title: "VA", company: "X", score: 50, url: "javascript:alert(1)" }],
    });

    expect(built!.html).not.toContain("javascript:");
    // The job is still listed, just as plain text rather than a link. Asserted
    // on the list item specifically -- the "Open Job Hunter" CTA below is a
    // legitimate link and must survive.
    expect(built!.html).toContain("<li style=\"margin:6px 0\">VA — X ");
    expect(built!.html).not.toMatch(/<li[^>]*><a /);
  });

  it("reports re-scored jobs with their direction of travel", () => {
    const built = buildJobDigestEmail({
      ...BASE,
      movedJobs: [{ title: "VA", company: "Acme", beforeScore: 62, afterScore: 81 }],
    });

    expect(built!.subject).toBe('Your hunt "Virtual Assistant roles" has updates');
    expect(built!.html).toContain("62");
    expect(built!.html).toContain("81");
    expect(built!.text).toContain("62 -> 81");
  });

  it("mentions stale postings", () => {
    const built = buildJobDigestEmail({ ...BASE, staleCount: 3 });

    expect(built!.text).toContain("3 saved jobs are over 45 days old");
  });

  it("leads with a problem when the run could not proceed", () => {
    const built = buildJobDigestEmail({
      ...BASE,
      problem: "This hunt has no resume to score against.",
    });

    expect(built!.subject).toContain("needs attention");
    expect(built!.html).toContain("no resume to score against");
  });

  it("always tells the reader how to stop receiving it", () => {
    const built = buildJobDigestEmail({ ...BASE, staleCount: 1 });

    expect(built!.html).toContain("Turn them off");
  });
});
