import { describe, expect, it } from "vitest";

import { onlineJobsPhAdapter } from "./onlinejobs-ph";

function identity(url: string) {
  return onlineJobsPhAdapter.identityFromUrl?.(new URL(url)) ?? null;
}

describe("onlinejobs.ph adapter", () => {
  it("is identity-only until an operator opts into scraping", () => {
    // The default path makes no network request at all; crawling is gated on
    // ONLINEJOBS_SCRAPE_ENABLED, which is unset here.
    expect(process.env.ONLINEJOBS_SCRAPE_ENABLED).toBeUndefined();
    expect(onlineJobsPhAdapter.capabilities.pollable).toBe(false);
    expect(onlineJobsPhAdapter.capabilities.fetchableOnDemand).toBe(false);
  });

  it("extracts the numeric id and a title hint from a job URL", () => {
    const result = identity(
      "https://www.onlinejobs.ph/jobseekers/job/Virtual-Assistant-Data-Entry-1598449",
    );

    expect(result).toEqual({
      externalId: "1598449",
      sourceKey: "onlinejobs_ph:1598449",
      titleHint: "Virtual Assistant Data Entry",
    });
  });

  it("handles a bare-id job URL", () => {
    expect(identity("https://www.onlinejobs.ph/jobseekers/job/865864")).toEqual({
      externalId: "865864",
      sourceKey: "onlinejobs_ph:865864",
      titleHint: "",
    });
  });

  it("accepts the apex domain as well as www", () => {
    expect(identity("https://onlinejobs.ph/jobseekers/job/Bookkeeper-42")?.externalId).toBe("42");
  });

  it("returns null for a search or category page", () => {
    // A pasted search URL is not a job. Without this, one would become a bogus
    // single-row "job" with no description.
    expect(identity("https://www.onlinejobs.ph/jobseekers/search/c/web-programming")).toBeNull();
    expect(identity("https://www.onlinejobs.ph/")).toBeNull();
  });

  it("does not claim a lookalike host", () => {
    expect(onlineJobsPhAdapter.matchesUrl?.(new URL("https://onlinejobs.ph.evil.com/x"))).toBe(
      false,
    );
    expect(identity("https://notonlinejobs.ph/jobseekers/job/Test-1")).toBeNull();
  });

  it("builds a job from a URL alone, naming it from the slug", () => {
    const job = onlineJobsPhAdapter.fromUserInput!(
      { url: "https://www.onlinejobs.ph/jobseekers/job/Social-Media-Manager-778899" },
      "url_import",
    );

    expect(job.source).toBe("onlinejobs_ph");
    expect(job.externalId).toBe("778899");
    expect(job.title).toBe("Social Media Manager");
    expect(job.provenance).toBe("url_import");
    expect(job.applyUrl).toContain("onlinejobs.ph");
  });

  it("dedupes the same posting whether pasted with or without body text", () => {
    const url = "https://www.onlinejobs.ph/jobseekers/job/Virtual-Assistant-1234567";

    const urlOnly = onlineJobsPhAdapter.fromUserInput!({ url }, "url_import");
    const withText = onlineJobsPhAdapter.fromUserInput!(
      { url, description: "We are hiring a virtual assistant for calendar management." },
      "paste",
    );

    // Identity comes from the posting id, so the description is free to differ.
    expect(withText.sourceKey).toBe(urlOnly.sourceKey);
  });

  it("prefers a user-supplied title over the slug hint", () => {
    const job = onlineJobsPhAdapter.fromUserInput!(
      {
        url: "https://www.onlinejobs.ph/jobseekers/job/Generic-Slug-99",
        title: "Senior Executive Assistant",
      },
      "paste",
    );

    expect(job.title).toBe("Senior Executive Assistant");
  });

  it("still produces a stable key for a paste with no URL", () => {
    const input = { description: "Bookkeeper\nCompany: Acme BPO\nManage AR and AP." };

    const first = onlineJobsPhAdapter.fromUserInput!(input, "paste");
    const second = onlineJobsPhAdapter.fromUserInput!(input, "paste");

    expect(first.sourceKey).toBe(second.sourceKey);
    expect(first.sourceKey).toMatch(/^onlinejobs_ph:[0-9a-f]{32}$/);
  });
});
