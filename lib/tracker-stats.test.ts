import assert from "node:assert/strict";
import { test } from "vitest";

import { daysWaiting, followUpDue, trackerStats } from "@/lib/tracker-stats";

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
