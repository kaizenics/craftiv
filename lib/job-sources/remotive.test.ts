import { describe, expect, it } from "vitest";

import { parseRemotiveResponse, remotiveAdapter } from "./remotive";

const FIXTURE = {
  "0-legal-notice": "Remotive legal notice",
  jobs: [
    {
      id: 1234567,
      url: "https://remotive.com/remote-jobs/customer-support/va-1234567",
      title: "Executive Virtual Assistant",
      company_name: "Acme Remote",
      category: "Customer Service",
      job_type: "full_time",
      publication_date: "2026-08-20T10:00:00",
      candidate_required_location: "Philippines",
      salary: "$1,500 - $2,000/month",
      description: "<p>Manage calendars and inbox.</p><ul><li>HubSpot</li></ul>",
    },
    {
      id: "7654321",
      url: "https://remotive.com/remote-jobs/x/bookkeeper-7654321",
      title: "Bookkeeper",
      company_name: "Beta Corp",
      description: "<p>Reconcile accounts and manage AR/AP for a growing team.</p>",
    },
  ],
};

describe("parseRemotiveResponse", () => {
  it("normalises a feed payload", () => {
    const jobs = parseRemotiveResponse(FIXTURE);

    expect(jobs).toHaveLength(2);
    expect(jobs[0]).toMatchObject({
      source: "remotive",
      externalId: "1234567",
      sourceKey: "remotive:1234567",
      provenance: "feed",
      title: "Executive Virtual Assistant",
      company: "Acme Remote",
      location: "Philippines",
      employmentType: "full_time",
      salaryText: "$1,500 - $2,000/month",
    });
  });

  it("accepts a numeric or string id and keys on it consistently", () => {
    const jobs = parseRemotiveResponse(FIXTURE);

    expect(jobs[1].externalId).toBe("7654321");
    expect(jobs[1].sourceKey).toBe("remotive:7654321");
  });

  it("converts the HTML description to plain text", () => {
    const [first] = parseRemotiveResponse(FIXTURE);

    expect(first.description).toContain("Manage calendars and inbox.");
    expect(first.description).toContain("- HubSpot");
    expect(first.description).not.toContain("<p>");
  });

  it("parses the publication date", () => {
    const [first] = parseRemotiveResponse(FIXTURE);

    expect(first.postedAt?.getUTCFullYear()).toBe(2026);
  });

  /**
   * A third-party feed changing shape must degrade to "fewer jobs", never to a
   * thrown error inside a cron tick.
   */
  it("drops a malformed row and keeps the rest", () => {
    const jobs = parseRemotiveResponse({
      jobs: [{ nonsense: true }, FIXTURE.jobs[1]],
    });

    expect(jobs).toHaveLength(1);
    expect(jobs[0].title).toBe("Bookkeeper");
  });

  it("returns an empty list rather than throwing on a wholly unexpected payload", () => {
    expect(parseRemotiveResponse({ unexpected: "shape" })).toEqual([]);
    expect(parseRemotiveResponse(null)).toEqual([]);
    expect(parseRemotiveResponse("not json")).toEqual([]);
  });

  it("skips a job with no description, since it cannot be scored", () => {
    const jobs = parseRemotiveResponse({
      jobs: [{ id: 1, title: "Empty", description: "" }],
    });

    expect(jobs).toEqual([]);
  });
});

describe("remotive adapter", () => {
  it("is pollable, which is what lets a scheduled run use it", () => {
    expect(remotiveAdapter.capabilities.pollable).toBe(true);
  });

  it("carries the attribution their terms require", () => {
    // Contractual, not decorative -- the UI renders this on every card.
    expect(remotiveAdapter.capabilities.attribution).toBe("Job data by Remotive");
  });
});
