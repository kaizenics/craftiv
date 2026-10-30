import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

// A real SQLite file: the clock is one upsert, and its correctness lives in that SQL.
process.env.TURSO_DATABASE_URL = `file:${join(mkdtempSync(join(tmpdir(), "craftiv-crawl-")), "crawl.db")}`;

let reserveCrawlSlot: typeof import("./crawl-clock").reserveCrawlSlot;

beforeAll(async () => {
  const { db } = await import("@/db");
  await db.$client.executeMultiple(readFileSync("db/migrations/0020_crawl_slots.sql", "utf-8"));
  ({ reserveCrawlSlot } = await import("./crawl-clock"));
});

afterEach(() => vi.useRealTimers());

describe("reserveCrawlSlot", () => {
  it("does not spend a turn on a request it turns away, so the queue drains once traffic slows", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(1_000_000);
    const reserve = () => reserveCrawlSlot("board.example", 5_000, 6_000);

    expect(await reserve()).toBe(0);
    expect(await reserve()).toBe(5_000);
    // A burst past the 6s limit is turned away...
    expect(await reserve()).toBe("busy");
    expect(await reserve()).toBe("busy");
    expect(await reserve()).toBe("busy");

    // ...and the turned-away requests left no trace: 5s later the next turn is
    // right after the two that were actually taken.
    vi.setSystemTime(1_005_000);
    expect(await reserve()).toBe(5_000);
  });
});
