import { describe, expect, it } from "vitest";

import { computeNextRunAt, isDue, isoWeekKey, manualRunKey, runKeyFor } from "./schedule";

describe("runKeyFor", () => {
  it("is stable within an hour and changes across the boundary", () => {
    const a = new Date("2026-08-29T06:05:00Z");
    const b = new Date("2026-08-29T06:59:59Z");
    const c = new Date("2026-08-29T07:00:00Z");

    // Two ticks in the same hour must produce one claim, not two runs.
    expect(runKeyFor("daily", a)).toBe(runKeyFor("daily", b));
    expect(runKeyFor("daily", a)).not.toBe(runKeyFor("daily", c));
  });

  it("buckets weekly runs by ISO week", () => {
    const monday = new Date("2026-08-24T06:00:00Z");
    const sunday = new Date("2026-08-30T23:00:00Z");
    const nextMonday = new Date("2026-08-31T06:00:00Z");

    expect(runKeyFor("weekly", monday)).toBe(runKeyFor("weekly", sunday));
    expect(runKeyFor("weekly", monday)).not.toBe(runKeyFor("weekly", nextMonday));
  });

  it("gives a manual run a key that cannot collide with the schedule", () => {
    const key = manualRunKey("11111111-2222-3333-4444-555555555555");

    expect(key.startsWith("m:")).toBe(true);
    expect(key).not.toBe(runKeyFor("daily", new Date("2026-08-29T06:00:00Z")));
    expect(key).not.toBe(runKeyFor("weekly", new Date("2026-08-29T06:00:00Z")));
  });
});

describe("isoWeekKey", () => {
  it("handles the year boundary without drifting a year", () => {
    // 2026-01-01 is a Thursday, so it belongs to ISO week 1 of 2026.
    expect(isoWeekKey(new Date("2026-01-01T12:00:00Z"))).toBe("2026-W01");
  });

  it("puts a late-December date in the following ISO year when the week spans it", () => {
    // 2025-12-29 is a Monday whose Thursday falls in 2026.
    expect(isoWeekKey(new Date("2025-12-29T12:00:00Z"))).toBe("2026-W01");
  });

  it("is stable across every day of one ISO week", () => {
    const keys = new Set(
      ["24", "25", "26", "27", "28", "29", "30"].map((d) =>
        isoWeekKey(new Date(`2026-08-${d}T12:00:00Z`)),
      ),
    );

    expect(keys.size).toBe(1);
  });
});

describe("computeNextRunAt", () => {
  it("schedules today when the slot is still ahead", () => {
    const next = computeNextRunAt({
      frequency: "daily",
      runAtMinuteUtc: 360, // 06:00
      from: new Date("2026-08-29T03:00:00Z"),
    });

    expect(next?.toISOString()).toBe("2026-08-29T06:00:00.000Z");
  });

  it("rolls to tomorrow once the slot has passed", () => {
    const next = computeNextRunAt({
      frequency: "daily",
      runAtMinuteUtc: 360,
      from: new Date("2026-08-29T09:00:00Z"),
    });

    expect(next?.toISOString()).toBe("2026-08-30T06:00:00.000Z");
  });

  /**
   * A hunt paused for a month must not fire thirty times catching up. The user
   * wants today's jobs, not every slot that elapsed while they were away.
   */
  it("always schedules forward, never into the past", () => {
    const from = new Date("2026-08-29T09:00:00Z");
    const next = computeNextRunAt({ frequency: "daily", runAtMinuteUtc: 360, from });

    expect(next!.getTime()).toBeGreaterThan(from.getTime());
  });

  it("crosses a month boundary correctly", () => {
    const next = computeNextRunAt({
      frequency: "daily",
      runAtMinuteUtc: 360,
      from: new Date("2026-08-31T09:00:00Z"),
    });

    expect(next?.toISOString()).toBe("2026-09-01T06:00:00.000Z");
  });

  it("crosses a year boundary correctly", () => {
    const next = computeNextRunAt({
      frequency: "daily",
      runAtMinuteUtc: 30,
      from: new Date("2026-12-31T23:00:00Z"),
    });

    expect(next?.toISOString()).toBe("2027-01-01T00:30:00.000Z");
  });

  it("picks the next occurrence of the requested weekday", () => {
    // 2026-08-29 is a Saturday; weekday 1 is Monday.
    const next = computeNextRunAt({
      frequency: "weekly",
      runAtMinuteUtc: 360,
      weekday: 1,
      from: new Date("2026-08-29T09:00:00Z"),
    });

    expect(next?.toISOString()).toBe("2026-08-31T06:00:00.000Z");
  });

  it("rolls a weekly run a full week when today's slot has passed", () => {
    // 2026-08-31 is a Monday and 06:00 has gone.
    const next = computeNextRunAt({
      frequency: "weekly",
      runAtMinuteUtc: 360,
      weekday: 1,
      from: new Date("2026-08-31T09:00:00Z"),
    });

    expect(next?.toISOString()).toBe("2026-09-07T06:00:00.000Z");
  });

  it("returns null for a manual hunt so the dispatcher never picks it up", () => {
    expect(
      computeNextRunAt({ frequency: "manual", runAtMinuteUtc: 360, from: new Date() }),
    ).toBeNull();
  });

  it("clamps an out-of-range minute rather than producing a wild date", () => {
    const next = computeNextRunAt({
      frequency: "daily",
      runAtMinuteUtc: 99_999,
      from: new Date("2026-08-29T00:00:00Z"),
    });

    // Clamped to 1439 minutes past midnight, which is 23:59.
    expect(next?.toISOString()).toBe("2026-08-29T23:59:00.000Z");
  });
});

describe("isDue", () => {
  it("is due at or after the scheduled time", () => {
    const at = new Date("2026-08-29T06:00:00Z");

    expect(isDue(at, at)).toBe(true);
    expect(isDue(at, new Date("2026-08-29T06:30:00Z"))).toBe(true);
    expect(isDue(at, new Date("2026-08-29T05:59:00Z"))).toBe(false);
  });

  it("is never due without a scheduled time", () => {
    expect(isDue(null, new Date())).toBe(false);
    expect(isDue(undefined, new Date())).toBe(false);
  });
});
