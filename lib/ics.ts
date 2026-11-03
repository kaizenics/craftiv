/** Commas, semicolons, backslashes and line breaks are syntax in iCalendar text. */
const escapeText = (value: string) => value.replace(/[\\;,]/g, (ch) => `\\${ch}`).replace(/\r?\n/g, "\\n");

// Lines over 75 characters must be folded: continued on the next line after a leading space.
const fold = (line: string) => line.match(/.{1,74}/g)?.join("\r\n ") ?? "";

/**
 * A one-event calendar file for an all-day reminder that any calendar app imports, with an alert at 9:00
 * that morning. `date` is YYYY-MM-DD; `uid` keeps re-importing the same reminder from duplicating it.
 */
export function buildIcs({ uid, date, title, description = "" }: { uid: string; date: string; title: string; description?: string }) {
  const day = date.replace(/-/g, "");
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Craftiv//Application tracker//EN",
    "BEGIN:VEVENT",
    `UID:${uid}@craftiv`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${day}`,
    `DTEND;VALUE=DATE:${next.toISOString().slice(0, 10).replace(/-/g, "")}`,
    `SUMMARY:${escapeText(title)}`,
    `DESCRIPTION:${escapeText(description)}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeText(title)}`,
    "TRIGGER:PT9H",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .map(fold)
    .join("\r\n")
    .concat("\r\n");
}
