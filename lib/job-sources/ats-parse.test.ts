import { describe, expect, it } from "vitest";

import { atsFeedUrl, parseAtsFeed } from "./ats-parse";

describe("atsFeedUrl", () => {
  it("builds each provider's public HTTPS endpoint", () => {
    expect(atsFeedUrl("greenhouse", "airtable")).toBe("https://boards-api.greenhouse.io/v1/boards/airtable/jobs?content=true");
    expect(atsFeedUrl("lever", "andela")).toBe("https://api.lever.co/v0/postings/andela?mode=json");
    expect(atsFeedUrl("ashby", "vercel")).toBe("https://api.ashbyhq.com/posting-api/job-board/vercel?includeCompensation=true");
  });

  it("refuses a slug that could steer the request elsewhere", () => {
    for (const slug of ["../evil", "a/b", "x?y=1", "@evil.com", "", "a b"]) {
      expect(() => atsFeedUrl("greenhouse", slug)).toThrow();
    }
  });
});

describe("parseAtsFeed", () => {
  it("decodes Greenhouse's double-encoded HTML into plain text", () => {
    const [job] = parseAtsFeed("greenhouse", "acme", "Acme", {
      jobs: [
        {
          id: 123,
          title: "Support Engineer",
          absolute_url: "https://job-boards.greenhouse.io/acme/jobs/123",
          location: { name: "Remote - Americas" },
          first_published: "2026-10-01T10:00:00Z",
          content: "&lt;p&gt;Help customers &amp;amp; teams.&lt;/p&gt;&lt;ul&gt;&lt;li&gt;Zendesk&lt;/li&gt;&lt;/ul&gt;",
        },
      ],
    });
    expect(job).toMatchObject({
      source: "ats_boards",
      externalId: "greenhouse:acme:123",
      sourceKey: "ats_boards:greenhouse:acme:123",
      title: "Support Engineer",
      company: "Acme",
      location: "Remote - Americas",
    });
    expect(job.description).toContain("Help customers & teams.");
    expect(job.description).toContain("- Zendesk");
    expect(job.description).not.toContain("<");
    expect(job.postedAt?.toISOString()).toBe("2026-10-01T10:00:00.000Z");
  });

  it("joins Lever's description sections and every listed location", () => {
    const [job] = parseAtsFeed("lever", "acme", "Acme", [
      {
        id: "abc-1",
        text: "Customer Success Manager",
        hostedUrl: "https://jobs.lever.co/acme/abc-1",
        applyUrl: "https://jobs.lever.co/acme/abc-1/apply",
        createdAt: 1793500000000,
        workplaceType: "remote",
        categories: { location: "Barcelona", allLocations: ["Barcelona", "Montevideo"], commitment: "Full-time" },
        descriptionPlain: "Own our biggest accounts.",
        lists: [{ text: "Requirements", content: "<li>HubSpot</li>" }],
        additionalPlain: "We hire everywhere.",
      },
    ]);
    expect(job.location).toBe("Barcelona; Montevideo; Remote");
    expect(job.employmentType).toBe("Full-time");
    expect(job.applyUrl).toBe("https://jobs.lever.co/acme/abc-1/apply");
    expect(job.description).toContain("Own our biggest accounts.");
    expect(job.description).toContain("Requirements");
    expect(job.description).toContain("HubSpot");
    expect(job.description).toContain("We hire everywhere.");
  });

  it("marks remote Ashby roles, keeps compensation and skips unlisted ones", () => {
    const jobs = parseAtsFeed("ashby", "acme", "Acme", {
      jobs: [
        {
          id: "j1",
          title: "Data Analyst",
          jobUrl: "https://jobs.ashbyhq.com/acme/j1",
          location: "New York",
          secondaryLocations: [{ location: "London" }],
          isRemote: true,
          employmentType: "FullTime",
          publishedAt: "2026-10-20T00:00:00Z",
          descriptionPlain: "SQL and dashboards.",
          compensation: { compensationTierSummary: "$90K – $120K" },
        },
        { id: "j2", title: "Hidden", jobUrl: "https://jobs.ashbyhq.com/acme/j2", isListed: false, descriptionPlain: "x" },
      ],
    });
    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({ location: "New York; London; Remote", salaryText: "$90K – $120K", employmentType: "FullTime" });
  });

  it("drops malformed postings instead of failing the board", () => {
    expect(
      parseAtsFeed("ashby", "acme", "Acme", {
        jobs: [null, { id: "x" }, { id: "y", title: "No link", descriptionPlain: "d" }, { id: "z", title: "Bad link", jobUrl: "javascript:alert(1)", descriptionPlain: "d" }],
      }),
    ).toEqual([]);
    expect(parseAtsFeed("lever", "acme", "Acme", { not: "an array" })).toEqual([]);
    expect(parseAtsFeed("greenhouse", "acme", "Acme", "garbage")).toEqual([]);
  });
});
