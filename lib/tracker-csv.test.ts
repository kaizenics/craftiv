import { describe, expect, it } from "vitest";

import { parseCsv, rowsToApplications, toCsv, type CsvApplication } from "@/lib/tracker-csv";

const app = (overrides: Partial<CsvApplication> = {}): CsvApplication => ({
  status: "applied",
  company: "Acme",
  title: "Designer",
  appliedOn: "2026-03-14",
  location: "",
  salary: "",
  contact: "",
  postingUrl: "",
  notes: "",
  tags: [],
  ...overrides,
});

describe("tracker CSV", () => {
  it("round-trips commas, quotes, line breaks and formula-looking cells", () => {
    const original = app({ company: 'Acme, "Inc"', notes: "line one\nline two", salary: "=1+1", contact: "+63 912", tags: ["remote", "referral"] });
    const { rows } = rowsToApplications(parseCsv(toCsv([original])));
    expect(rows).toEqual([original]);
  });

  it("neutralises formulas in the exported file", () => {
    expect(toCsv([app({ salary: "=HYPERLINK(1)" })])).toContain("'=HYPERLINK(1)");
  });

  it("reads a hand-made sheet with its own header names", () => {
    const sheet = "Employer,Position,Stage,Date Applied,URL\r\nGlobex,PM,Interview,3/14/2026,www.globex.com/jobs\r\n\r\nInitech,,,,\r\n,,,,\r\n";
    const { rows, skipped } = rowsToApplications(parseCsv(sheet));
    expect(skipped).toBe(0);
    expect(rows[0]).toMatchObject({ company: "Globex", title: "PM", status: "interview", appliedOn: "2026-03-14", postingUrl: "https://www.globex.com/jobs" });
    expect(rows[1]).toMatchObject({ company: "Initech", status: "saved" });
  });

  it("splits tags on commas or semicolons and drops duplicates", () => {
    const { rows } = rowsToApplications(parseCsv('Company,Tags\nAcme,"remote, Referral; remote"\n'));
    expect(rows[0].tags).toEqual(["remote", "Referral"]);
  });

  it("drops links that are not web links", () => {
    const { rows } = rowsToApplications(parseCsv("Company,Link\nAcme,javascript:alert(1)\n"));
    expect(rows[0].postingUrl).toBe("");
  });

  it("rejects a file without a company or role column", () => {
    expect(() => rowsToApplications(parseCsv("Name,Email\na,b\n"))).toThrow(/Company or Role/);
  });

  it("caps the rows it keeps", () => {
    const sheet = ["Company", ...Array.from({ length: 502 }, (_, i) => `Co ${i}`)].join("\n");
    const { rows, overLimit } = rowsToApplications(parseCsv(sheet));
    expect(rows).toHaveLength(500);
    expect(overLimit).toBe(2);
  });
});
