import { afterEach, describe, expect, it } from "vitest";

import {
  getAdapter,
  isPollableSource,
  listAdapters,
  pollableSources,
  resolveAdapterForUrl,
} from "./index";
import { onlineJobsPhAdapter } from "./onlinejobs-ph";
import { JobSourceError } from "./types";

afterEach(() => {
  delete process.env.ONLINEJOBS_SCRAPE_ENABLED;
});

describe("job source registry", () => {
  /**
   * OnlineJobs.ph terms 7.4 forbid automated access, so crawling it is opt-in
   * and must stay opt-in. These are the tests that keep that true as the code
   * grows -- if one starts failing, the default has drifted, which is a business
   * risk decision and not a test to relax.
   */
  it("does not treat OnlineJobs.ph as pollable by default", () => {
    expect(process.env.ONLINEJOBS_SCRAPE_ENABLED).toBeUndefined();
    expect(isPollableSource("onlinejobs_ph")).toBe(false);
    expect(pollableSources().map((adapter) => adapter.id)).not.toContain("onlinejobs_ph");
  });

  it("refuses to search OnlineJobs.ph while scraping is disabled", async () => {
    await expect(
      onlineJobsPhAdapter.search!({ query: "virtual assistant", location: "", limit: 5 },
        new AbortController().signal),
    ).rejects.toBeInstanceOf(JobSourceError);
  });

  it("explains to the user why OnlineJobs.ph cannot be searched while disabled", () => {
    expect(onlineJobsPhAdapter.capabilities.restrictionNote).toBeTruthy();
  });

  it("becomes pollable only when the operator opts in explicitly", () => {
    // Anything other than the exact opt-in string leaves it off.
    process.env.ONLINEJOBS_SCRAPE_ENABLED = "1";
    expect(isPollableSource("onlinejobs_ph")).toBe(false);

    process.env.ONLINEJOBS_SCRAPE_ENABLED = "true";
    expect(isPollableSource("onlinejobs_ph")).toBe(true);
    expect(onlineJobsPhAdapter.capabilities.restrictionNote).toBeNull();
  });

  it("keeps the manual source unpollable regardless of the flag", () => {
    process.env.ONLINEJOBS_SCRAPE_ENABLED = "true";
    expect(isPollableSource("manual")).toBe(false);
  });

  it("routes an OnlineJobs.ph URL to its own adapter", () => {
    const adapter = resolveAdapterForUrl(
      "https://www.onlinejobs.ph/jobseekers/job/Virtual-Assistant-1234567",
    );
    expect(adapter.id).toBe("onlinejobs_ph");
  });

  it("falls back to the manual adapter for unknown hosts and junk input", () => {
    expect(resolveAdapterForUrl("https://example.com/jobs/1").id).toBe("manual");
    expect(resolveAdapterForUrl("not a url").id).toBe("manual");
    expect(resolveAdapterForUrl(undefined).id).toBe("manual");
    // A lookalike host must not be mistaken for the real one.
    expect(resolveAdapterForUrl("https://onlinejobs.ph.evil.com/x").id).toBe("manual");
  });

  it("exposes an import path on every registered adapter", () => {
    for (const adapter of listAdapters()) {
      expect(typeof adapter.fromUserInput).toBe("function");
    }
  });

  it("throws on an unregistered source id", () => {
    // @ts-expect-error deliberately invalid id
    expect(() => getAdapter("nope")).toThrow();
  });
});
