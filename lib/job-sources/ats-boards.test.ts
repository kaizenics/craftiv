import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

// A file, not :memory: -- transactions open their own connection, and each in-memory connection is a separate, empty database.
const dir = mkdtempSync(join(tmpdir(), "craftiv-ats-"));
process.env.TURSO_DATABASE_URL = `file:${join(dir, "ats.db")}`;

const { db } = await import("@/db");
const { atsBoards, atsJobs } = await import("@/db/schema");
const { ATS_BOARDS } = await import("./ats-boards-list");
const { ATS_REFRESH_HOURS, atsBoardsAdapter, refreshAtsBoards } = await import("./ats-boards");

// Every board answers with the same small feed in its own provider's format.
function feedFor(url: string) {
  const job = (id: string, title: string, location: string) => ({ id, title, location, isRemote: location === "Remote" });
  if (url.includes("greenhouse")) {
    return {
      jobs: [
        { id: 1, title: "Customer Support Specialist", absolute_url: "https://job-boards.greenhouse.io/x/jobs/1", location: { name: "Remote" }, content: "&lt;p&gt;Zendesk&lt;/p&gt;", first_published: "2026-10-02T00:00:00Z" },
        { id: 2, title: "Office Manager", absolute_url: "https://job-boards.greenhouse.io/x/jobs/2", location: { name: "Berlin" }, content: "&lt;p&gt;Office&lt;/p&gt;", first_published: "2026-10-01T00:00:00Z" },
      ],
    };
  }
  if (url.includes("lever")) {
    return [{ id: "l1", text: "Support Engineer (100% remote)", hostedUrl: "https://jobs.lever.co/x/l1", workplaceType: "remote", categories: { location: "Lisbon" }, descriptionPlain: "Support", createdAt: 1790000000000 }];
  }
  return {
    jobs: [
      { ...job("a1", "Customer Support Lead", "Remote"), jobUrl: "https://jobs.ashbyhq.com/x/a1", descriptionPlain: "Support", publishedAt: "2026-10-03T00:00:00Z" },
      { ...job("a2", "Sales Manager", "Manila"), jobUrl: "https://jobs.ashbyhq.com/x/a2", descriptionPlain: "Sales", publishedAt: "2026-09-01T00:00:00Z" },
    ],
  };
}

beforeAll(async () => {
  // The cache tables only: what the adapter reads and writes.
  await db.$client.executeMultiple(readFileSync("db/migrations/0031_ats_boards.sql", "utf8"));
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL) => {
      const url = String(input);
      return new Response(JSON.stringify(feedFor(url)), { status: 200, headers: { "Content-Type": "application/json" } });
    }),
  );
});

afterEach(() => {
  vi.mocked(fetch).mockClear();
});

afterAll(() => {
  db.$client.close();
  // Windows can hold the file a moment after close; a leftover temp file is harmless.
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {}
});

describe("refreshAtsBoards", () => {
  it("refreshes a bounded number of boards and stores their jobs", async () => {
    const now = new Date("2026-11-04T00:00:00Z");
    const result = await refreshAtsBoards(db, { maxBoards: ATS_BOARDS.length, now });

    expect(result).toEqual({ refreshed: ATS_BOARDS.length, failed: 0 });
    expect(fetch).toHaveBeenCalledTimes(ATS_BOARDS.length);
    for (const call of vi.mocked(fetch).mock.calls) {
      expect(call[1]).toMatchObject({ redirect: "error" });
    }
    const boards = await db.select().from(atsBoards);
    expect(boards.every((board) => board.fetchedAt && board.jobCount > 0 && !board.error)).toBe(true);
  });

  it("leaves fresh boards alone until the refresh period has passed", async () => {
    const soon = new Date(Date.parse("2026-11-04T00:00:00Z") + 60 * 60 * 1000);
    expect(await refreshAtsBoards(db, { maxBoards: 5, now: soon })).toEqual({ refreshed: 0, failed: 0 });
    expect(fetch).not.toHaveBeenCalled();

    const later = new Date(Date.parse("2026-11-04T00:00:00Z") + (ATS_REFRESH_HOURS + 1) * 60 * 60 * 1000);
    expect(await refreshAtsBoards(db, { maxBoards: 5, now: later })).toEqual({ refreshed: 5, failed: 0 });
  });

  it("records a failing board and keeps its previous jobs", async () => {
    const before = await db.select().from(atsJobs);
    vi.mocked(fetch).mockImplementationOnce(async () => new Response("nope", { status: 500 }));
    const muchLater = new Date(Date.parse("2026-11-04T00:00:00Z") + 3 * ATS_REFRESH_HOURS * 60 * 60 * 1000);
    expect(await refreshAtsBoards(db, { maxBoards: 1, now: muchLater })).toEqual({ refreshed: 0, failed: 1 });
    expect((await db.select().from(atsBoards)).some((board) => board.error?.includes("HTTP 500"))).toBe(true);
    expect((await db.select().from(atsJobs)).length).toBe(before.length);
  });
});

describe("atsBoardsAdapter.search", () => {
  const search = (query: string, location = "", limit = 500) =>
    atsBoardsAdapter.search!({ query, location, limit }, AbortSignal.timeout(5_000));

  it("matches every query word in the title, newest first", async () => {
    const jobs = await search("customer support");
    expect(jobs.length).toBeGreaterThan(0);
    expect(jobs.every((job) => /customer/i.test(job.title) && /support/i.test(job.title))).toBe(true);
    const times = jobs.map((job) => job.postedAt?.getTime() ?? 0);
    expect([...times].sort((a, b) => b - a)).toEqual(times);
    expect(jobs[0]).toMatchObject({ source: "ats_boards", provenance: "feed" });
  });

  it("narrows by location but always keeps remote roles", async () => {
    const manila = await search("manager", "Manila");
    expect(manila.length).toBeGreaterThan(0);
    expect(manila.every((job) => /manila|remote/i.test(job.location))).toBe(true);
    expect(manila.some((job) => job.location === "Berlin")).toBe(false);

    const remoteOnly = await search("", "Remote");
    expect(remoteOnly.every((job) => /remote/i.test(job.location))).toBe(true);
  });

  it("treats LIKE wildcards in a query as plain text", async () => {
    expect(await search("100%")).toEqual(expect.arrayContaining([expect.objectContaining({ title: "Support Engineer (100% remote)" })]));
    expect(await search("%%")).toHaveLength(0);
    expect(await search("__")).toHaveLength(0);
  });

  it("honours the limit", async () => {
    expect(await search("", "", 3)).toHaveLength(3);
  });
});
