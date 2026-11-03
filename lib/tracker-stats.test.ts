import assert from "node:assert/strict";
import { test } from "vitest";

import { daysWaiting, followUpDue, sentThisWeek, trackerStats } from "@/lib/tracker-stats";

const DAY = 24 * 60 * 60 * 1000;

test("trackerStats counts replies and interviews among sent applications", () => {
  const stats = trackerStats([
    { status: "saved", appliedOn: "", statusHistory: [{ status: "saved", at: 0 }] },
    {
      status: "applied",
      appliedOn: "",
      statusHistory: [
        { status: "saved", at: 0 },
        { status: "applied", at: 2 * DAY },
      ],
    },
    {
      status: "rejected",
      appliedOn: "",
      statusHistory: [
        { status: "applied", at: 0 },
        { status: "rejected", at: 4 * DAY },
      ],
    },
    {
      status: "offer",
      appliedOn: "",
      statusHistory: [
        { status: "applied", at: 0 },
        { status: "interview", at: 6 * DAY },
        { status: "offer", at: 9 * DAY },
      ],
    },
  ]);
  assert.equal(stats.sent, 3);
  assert.equal(stats.responseRate, 67);
  assert.equal(stats.interviewRate, 33);
  assert.equal(stats.avgDays.applied, 5);
  assert.equal(stats.avgDays.saved, 2);
  assert.equal(stats.avgDays.interview, 3);
  assert.equal(stats.avgDays.screening, null);
});

test("trackerStats has no rates before anything is sent", () => {
  assert.equal(trackerStats([]).responseRate, null);
});

test("daysWaiting prefers the typed application date and ignores other columns", () => {
  const now = new Date("2026-10-20T12:00:00").getTime();
  assert.equal(daysWaiting({ status: "applied", appliedOn: "2026-10-10", statusHistory: [] }, now), 10);
  assert.equal(daysWaiting({ status: "applied", appliedOn: "", statusHistory: [{ status: "applied", at: now - 3 * DAY }] }, now), 3);
  assert.equal(daysWaiting({ status: "interview", appliedOn: "2026-10-10", statusHistory: [] }, now), null);
});

test("followUpDue is a week after the typed application date, and only while still in Applied", () => {
  const due = followUpDue({ status: "applied", appliedOn: "2026-03-14", statusHistory: [{ status: "applied", at: 0 }] });
  assert.equal(due?.toDateString(), new Date(2026, 2, 21).toDateString());
  assert.equal(followUpDue({ status: "interview", appliedOn: "2026-03-14", statusHistory: [] }), null);
});

test("sentThisWeek counts cards sent since Monday, by typed date or first sent column", () => {
  const wednesday = new Date(2026, 10, 4, 12); // Wed 4 Nov 2026
  const monday = new Date(2026, 10, 2, 8).getTime();
  const sunday = new Date(2026, 10, 1, 20).getTime();
  const count = sentThisWeek(
    [
      { status: "applied", appliedOn: "2026-11-02", statusHistory: [] },
      { status: "interview", appliedOn: "", statusHistory: [{ status: "saved", at: sunday }, { status: "applied", at: monday }] },
      { status: "applied", appliedOn: "", statusHistory: [{ status: "applied", at: sunday }] },
      { status: "saved", appliedOn: "", statusHistory: [{ status: "saved", at: monday }] },
    ],
    wednesday,
  );
  assert.equal(count, 2);
});
