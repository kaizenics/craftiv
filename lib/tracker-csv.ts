import { TRACKER_LIMITS, TRACKER_STATUSES, TRACKER_STATUS_LABELS, type TrackerStatus } from "@/lib/types/applications";

/** One application as it travels through a CSV file. */
export type CsvApplication = {
  status: TrackerStatus;
  company: string;
  title: string;
  appliedOn: string;
  location: string;
  salary: string;
  contact: string;
  postingUrl: string;
  notes: string;
};

type TextField = Exclude<keyof CsvApplication, "status">;

// Export order, plus the header names people use in their own trackers so an existing sheet imports as is.
const COLUMNS: { field: keyof CsvApplication; label: string; aliases: string[] }[] = [
  { field: "company", label: "Company", aliases: ["employer", "organization", "organisation"] },
  { field: "title", label: "Role", aliases: ["title", "job title", "position", "job"] },
  { field: "status", label: "Status", aliases: ["stage"] },
  { field: "appliedOn", label: "Applied on", aliases: ["date applied", "applied", "application date", "date"] },
  { field: "location", label: "Location", aliases: ["city"] },
  { field: "salary", label: "Salary", aliases: ["pay", "compensation"] },
  { field: "contact", label: "Contact", aliases: ["recruiter"] },
  { field: "postingUrl", label: "Link", aliases: ["url", "posting", "job link", "posting url"] },
  { field: "notes", label: "Notes", aliases: ["note", "comments"] },
];

const norm = (value: string) => value.trim().toLowerCase();
const HEADER_TO_FIELD = new Map(COLUMNS.flatMap((c) => [c.label, ...c.aliases].map((name) => [norm(name), c.field] as const)));
const STATUS_BY_NAME = new Map(
  TRACKER_STATUSES.flatMap((status) => [
    [status, status],
    [norm(TRACKER_STATUS_LABELS[status]), status],
  ]),
);

// A cell starting with one of these runs as a formula in Excel; the leading quote keeps it text.
const FORMULA_START = /^[=+\-@\t\r]/;

function escapeCell(value: string) {
  const safe = FORMULA_START.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** A CSV file Excel and Google Sheets open directly; the BOM makes Excel read it as UTF-8. */
export function toCsv(rows: CsvApplication[]) {
  const lines = [COLUMNS.map((c) => c.label), ...rows.map((row) => COLUMNS.map((c) => (c.field === "status" ? TRACKER_STATUS_LABELS[row.status] : row[c.field])))];
  return `﻿${lines.map((line) => line.map(escapeCell).join(",")).join("\r\n")}\r\n`;
}

/** RFC 4180 cells: quoted fields may hold commas, quotes and line breaks. Blank lines are dropped. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const input = text.replace(/^﻿/, "");
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (quoted) {
      if (ch === '"' && input[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && input[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

function toDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toUrl(value: string) {
  if (/^https?:\/\//i.test(value)) return value.slice(0, TRACKER_LIMITS.url);
  // "www.acme.com/jobs" is a link the user meant; anything with spaces is not.
  return /^[^\s]+\.[^\s]+$/.test(value) ? `https://${value}`.slice(0, TRACKER_LIMITS.url) : "";
}

/**
 * Turns a parsed sheet into applications. The first row is the header; unknown columns are ignored,
 * rows with neither a company nor a role are skipped, and only the first TRACKER_LIMITS.importRows rows are kept.
 */
export function rowsToApplications(table: string[][]) {
  const [header = [], ...body] = table;
  const fields = header.map((name) => HEADER_TO_FIELD.get(norm(name)));
  if (!fields.includes("company") && !fields.includes("title")) {
    throw new Error("The file needs a Company or Role column in its first row.");
  }

  const rows: CsvApplication[] = [];
  let skipped = 0;
  for (const cells of body) {
    const value = (field: keyof CsvApplication) => {
      const raw = (cells[fields.indexOf(field)] ?? "").trim();
      return /^'[=+\-@]/.test(raw) ? raw.slice(1) : raw;
    };
    const text = (field: TextField) => value(field).slice(0, field === "notes" ? TRACKER_LIMITS.notes : TRACKER_LIMITS.text);
    const row: CsvApplication = {
      company: text("company"),
      title: text("title"),
      appliedOn: toDate(value("appliedOn")),
      location: text("location"),
      salary: text("salary"),
      contact: text("contact"),
      postingUrl: toUrl(value("postingUrl")),
      notes: text("notes"),
      status: "saved",
    };
    if (!row.company && !row.title) {
      skipped++;
      continue;
    }
    // No status column, or a value we do not know: a dated row was sent, an undated one is still an idea.
    row.status = STATUS_BY_NAME.get(norm(value("status"))) ?? (row.appliedOn ? "applied" : "saved");
    rows.push(row);
  }
  const limit = TRACKER_LIMITS.importRows;
  return { rows: rows.slice(0, limit), skipped, overLimit: Math.max(0, rows.length - limit) };
}
