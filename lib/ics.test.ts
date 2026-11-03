import { expect, test } from "vitest";

import { buildIcs } from "@/lib/ics";

test("buildIcs writes an all-day event ending the next day, with escaped, folded text", () => {
  const ics = buildIcs({ uid: "a1", date: "2026-12-31", title: "Follow up: Designer, Acme; Inc", description: `Line one\nhttps://acme.com/${"x".repeat(80)}` });
  expect(ics).toContain("DTSTART;VALUE=DATE:20261231");
  expect(ics).toContain("DTEND;VALUE=DATE:20270101");
  expect(ics).toContain("SUMMARY:Follow up: Designer\\, Acme\\; Inc");
  expect(ics).toContain("Line one\\nhttps://");
  expect(ics.split("\r\n").every((line) => line.length <= 75)).toBe(true);
  expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
});
