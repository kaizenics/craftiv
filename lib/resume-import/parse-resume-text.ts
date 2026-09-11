import type { ResumeDataJSON } from "@/db/schema";

type SectionKey =
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "languages"
  | "certifications"
  | "awards"
  | "profiles"
  | "references"
  | "interests"
  | "projects"
  | "volunteer"
  | "publications";

type Segment = { key: SectionKey | null; title: string; lines: string[] };

export type Period = { start: string; end: string; current: boolean };

type RawEntry = { period: Period | null; headerParts: string[]; body: string[] };

export type ImportSource = "pdf" | "docx" | "text";

const MAX_HEADING_WORDS = 4;
const MAX_HEADING_LENGTH = 48;
const MAX_ENTRY_HEADER_WORDS = 8;
const MAX_LIST_ITEMS = 60;
const MIN_PHONE_DIGITS = 7;
const MAX_PHONE_DIGITS = 15;
const HEADER_SCAN_LINES = 6;
const ENTRY_PREAMBLE_LOOKAHEAD = 4;
/** Longer lines are prose; capping them bounds every regex below on hostile input. */
const MAX_LINE_LENGTH = 400;

const SECTION_ALIASES: Readonly<Record<string, SectionKey>> = {
  summary: "summary",
  "professional summary": "summary",
  "career summary": "summary",
  "executive summary": "summary",
  profile: "summary",
  "professional profile": "summary",
  "personal profile": "summary",
  about: "summary",
  "about me": "summary",
  objective: "summary",
  "career objective": "summary",
  experience: "experience",
  "work experience": "experience",
  "professional experience": "experience",
  "relevant experience": "experience",
  employment: "experience",
  "employment history": "experience",
  "work history": "experience",
  "career history": "experience",
  internships: "experience",
  education: "education",
  "education history": "education",
  "academic background": "education",
  "academic qualifications": "education",
  "education and training": "education",
  qualifications: "education",
  skills: "skills",
  "technical skills": "skills",
  "key skills": "skills",
  "core skills": "skills",
  "skills and abilities": "skills",
  "skill set": "skills",
  "core competencies": "skills",
  competencies: "skills",
  expertise: "skills",
  "tools and technologies": "skills",
  technologies: "skills",
  projects: "projects",
  "personal projects": "projects",
  "selected projects": "projects",
  "side projects": "projects",
  languages: "languages",
  "language skills": "languages",
  interests: "interests",
  hobbies: "interests",
  "hobbies and interests": "interests",
  awards: "awards",
  honors: "awards",
  honours: "awards",
  "awards and honors": "awards",
  achievements: "awards",
  accomplishments: "awards",
  certifications: "certifications",
  certificates: "certifications",
  licenses: "certifications",
  "licenses and certifications": "certifications",
  training: "certifications",
  trainings: "certifications",
  publications: "publications",
  papers: "publications",
  research: "publications",
  volunteer: "volunteer",
  volunteering: "volunteer",
  "volunteer experience": "volunteer",
  "community involvement": "volunteer",
  references: "references",
  profiles: "profiles",
  links: "profiles",
  "social profiles": "profiles",
  "online profiles": "profiles",
};

const BULLET_PATTERN = /^\s*[-–—•*◦‣·▪●]\s+/;
const EMAIL_PATTERN = /[\w.+-]+@[\w-]+\.[\w.-]*\w/;
const URL_PATTERN =
  /\b(?:https?:\/\/|www\.)[^\s,;|•·]+|\b(?:linkedin\.com|github\.com|gitlab\.com|behance\.net|dribbble\.com)\/[^\s,;|•·]+/gi;
const PHONE_CANDIDATE = /[+(]?\d[\d\s().+-]{5,}\d/g;
const STRONG_SEPARATOR = /\s*[|•·]\s*|\s{2,}|\s+[–—]\s+/;
const SENTENCE_END = /[.!?:;]$/;

const MONTHS: Readonly<Record<string, number>> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
  may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9,
  september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};
const PRESENT_WORDS = "present|current|currently|now|today|ongoing";
const PRESENT = new RegExp(`^(?:${PRESENT_WORDS})$`, "i");
/** One date as resumes write it: "Jan 2020", "01/2020", "2020-01" or a bare year. */
const DATE_TOKEN =
  "(?:\\p{L}{3,}\\.?\\s+(?:19|20)\\d{2}|\\d{1,2}[/.](?:19|20)\\d{2}|(?:19|20)\\d{2}[-/.]\\d{1,2}|(?:19|20)\\d{2})";
const PERIOD_CANDIDATE = new RegExp(
  `${DATE_TOKEN}\\s*(?:[-–—~]|\\bto\\b|\\buntil\\b|\\bthrough\\b|\\btill\\b)\\s*(?:${DATE_TOKEN}|${PRESENT_WORDS})`,
  "giu",
);
const TRAILING_DATE = new RegExp(`${DATE_TOKEN}$`, "u");

/** Job-title vocabulary, used to tell "Title | Company" from "Company | Title". */
const TITLE_WORDS =
  /\b(?:engineer|developer|programmer|manager|assistant|analyst|designer|specialist|coordinator|director|lead|intern|consultant|officer|associate|representative|administrator|architect|scientist|teacher|tutor|instructor|trainer|nurse|accountant|head|president|executive|agent|technician|supervisor|writer|editor|marketer|owner|founder|freelancer|clerk|cashier|receptionist|advisor|adviser|strategist|researcher|operator|planner|recruiter|buyer|chef|virtual assistant)\b/i;
const DEGREE_WORDS =
  /\b(?:bachelor|master|ph\.?d|doctorate|b\.?sc|m\.?sc|b\.?eng|m\.?eng|mba|diploma|degree|certificate|associate of|high school|b\.?a\.?|m\.?a\.?|b\.?s\.?|m\.?s\.?)\b/i;
const SCHOOL_WORDS = /\b(?:university|college|school|institute|academy|polytechnic|conservatory)\b/i;

const LANGUAGE_LEVELS: ReadonlyArray<[RegExp, "Basic" | "Conversational" | "Fluent" | "Native"]> = [
  [/\b(?:native|mother tongue|first language|bilingual)\b/i, "Native"],
  [/\b(?:fluent|c1|c2|advanced|proficient|professional|full professional)\b/i, "Fluent"],
  [/\b(?:conversational|intermediate|b1|b2|working|limited working)\b/i, "Conversational"],
  [/\b(?:basic|beginner|elementary|a1|a2|novice)\b/i, "Basic"],
];

const pad = (value: number) => String(value).padStart(2, "0");

const generateId = () => Math.random().toString(36).substring(2, 9);

/* ------------------------------------------------------------------------ */
/* Dates                                                                    */
/* ------------------------------------------------------------------------ */

/**
 * A single date, normalised to "YYYY-MM" when the month is known and "YYYY" when it is
 * not -- the same format the builder has always received. Null when it is not a date.
 */
export function parseSingleDate(text: string): string | null {
  const value = text.trim().replace(/[.,]$/, "").replace(/^(?:since|from)\s+/i, "");

  let match = /^(\p{L}{3,})\.?\s+((?:19|20)\d{2})$/u.exec(value);
  if (match) {
    const month = MONTHS[match[1].toLowerCase()];
    return month ? `${match[2]}-${pad(month)}` : null;
  }

  match = /^(\d{1,2})[/.]((?:19|20)\d{2})$/.exec(value);
  if (match) {
    const month = Number(match[1]);
    return month >= 1 && month <= 12 ? `${match[2]}-${pad(month)}` : null;
  }

  match = /^((?:19|20)\d{2})[-/.](\d{1,2})$/.exec(value);
  if (match) {
    const month = Number(match[2]);
    return month >= 1 && month <= 12 ? `${match[1]}-${pad(month)}` : null;
  }

  match = /^((?:19|20)\d{2})$/.exec(value);
  return match ? match[1] : null;
}

/**
 * A date range. Separators are tried loosest-last: a spaced dash first, then an
 * unspaced en/em dash, and only then a bare hyphen -- otherwise "2020-01" would read as
 * the range 2020 to "01".
 */
export function parsePeriod(text: string): Period | null {
  const separators = [
    /\s+(?:[-–—~]|to|until|through|till)\s+/i,
    /\s*[–—~]\s*/,
    /-/,
  ];

  for (const separator of separators) {
    const parts = text.trim().split(separator);
    if (parts.length !== 2) continue;

    const start = parseSingleDate(parts[0]);
    if (!start) continue;

    const endText = parts[1].trim().replace(/[.,]$/, "");
    if (PRESENT.test(endText)) return { start, end: "Present", current: true };

    const end = parseSingleDate(endText);
    // A range that runs backwards is a phone fragment or an ID, not a period.
    if (end && end.slice(0, 4) >= start.slice(0, 4)) return { start, end, current: false };
  }

  return null;
}

/**
 * A date may open with a month name, so the patterns let any leading word in -- and
 * then "Amazon 2021" or "Berlin 2016 - 2019" matches with the word attached, fails to
 * parse, and the real date behind it is never tried. A failed match is retried without
 * its leading word before being given up on.
 */
const LEADING_WORD = /^\p{L}{3,}\.?\s+/u;

function findPeriod(line: string): { text: string; period: Period } | null {
  PERIOD_CANDIDATE.lastIndex = 0;
  for (const match of line.match(PERIOD_CANDIDATE) ?? []) {
    for (const candidate of [match, match.replace(LEADING_WORD, "")]) {
      const period = parsePeriod(candidate);
      if (period) return { text: candidate.trim(), period };
    }
  }
  return null;
}

function findSingleDate(line: string): { text: string; period: Period } | null {
  const match = TRAILING_DATE.exec(line.trim())?.[0];
  if (!match) return null;

  for (const candidate of [match, match.replace(LEADING_WORD, "")]) {
    const value = parseSingleDate(candidate);
    if (value) return { text: candidate, period: { start: value, end: "", current: false } };
  }
  return null;
}

/* ------------------------------------------------------------------------ */
/* Line classification                                                      */
/* ------------------------------------------------------------------------ */

const normalizeHeading = (line: string) =>
  line
    .replace(/[:：]\s*$/, "")
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

function knownHeading(line: string): SectionKey | null {
  const normalized = normalizeHeading(line);
  if (!normalized || normalized.split(" ").length > MAX_HEADING_WORDS) return null;
  return SECTION_ALIASES[normalized] ?? null;
}

function looksLikeHeading(line: string): boolean {
  const trimmed = line.trim().replace(/[:：]$/, "");
  if (!trimmed || trimmed.length > MAX_HEADING_LENGTH || /\d/.test(trimmed)) return false;
  if (trimmed.split(/\s+/).length > MAX_HEADING_WORDS) return false;

  const letters = trimmed.replace(/[^\p{L}]/gu, "");
  if (letters.length < 3) return false;
  return letters === letters.toLocaleUpperCase() && letters !== letters.toLocaleLowerCase();
}

function looksLikeTitleCaseHeading(line: string): boolean {
  const trimmed = line.trim().replace(/[:：]$/, "");
  if (!trimmed || trimmed.length > MAX_HEADING_LENGTH || /\d/.test(trimmed)) return false;
  const words = trimmed.split(/\s+/);
  if (words.length > MAX_HEADING_WORDS) return false;

  return words.every((word) => {
    const letters = word.replace(/[^\p{L}]/gu, "");
    if (letters.length === 0) return false;
    return (
      letters[0] === letters[0]?.toLocaleUpperCase() &&
      letters.slice(1) === letters.slice(1).toLocaleLowerCase()
    );
  });
}

/**
 * Whether a line could head an entry rather than continue the previous one's prose.
 * Without it, a sentence sitting just above the next role's dates is promoted to a
 * header, stealing the current entry's description.
 */
function looksLikeEntryHeader(line: string): boolean {
  const trimmed = line.trim();
  if (STRONG_SEPARATOR.test(trimmed)) return true;
  if (SENTENCE_END.test(trimmed)) return false;
  return trimmed.split(/\s+/).length <= MAX_ENTRY_HEADER_WORDS;
}

function extractPhone(text: string): string {
  for (const candidate of text.match(PHONE_CANDIDATE) ?? []) {
    const digits = candidate.replace(/\D/g, "");
    if (digits.length < MIN_PHONE_DIGITS || digits.length > MAX_PHONE_DIGITS) continue;
    if (findPeriod(candidate)) continue;
    return candidate.trim();
  }
  return "";
}

function isDateLine(line: string, allowSingleDate = true): boolean {
  if (findPeriod(line)) return true;
  // A section grouped without single dates reads a bare "2022" as text, so the
  // lookahead must agree, or that line closes an entry that is never reopened.
  if (!allowSingleDate) return false;
  const bare = line.replace(BULLET_PATTERN, "").trim();
  return bare !== "" && parseSingleDate(bare) !== null;
}

function introducesEntry(lines: readonly string[], index: number, allowSingleDate = true): boolean {
  for (let offset = 1; offset <= ENTRY_PREAMBLE_LOOKAHEAD; offset++) {
    const line = lines[index + offset];
    if (line === undefined || BULLET_PATTERN.test(line)) return false;
    if (isDateLine(line, allowSingleDate)) return true;
  }
  return false;
}

function headerBoundary(lines: string[]): number {
  let boundary = 0;
  for (const [index, line] of lines.slice(0, HEADER_SCAN_LINES).entries()) {
    if (knownHeading(line)) break;
    if (EMAIL_PATTERN.test(line) || new RegExp(URL_PATTERN.source, "i").test(line) || extractPhone(line)) {
      boundary = index;
    }
  }
  return boundary;
}

function splitHeaderParts(text: string): string[] {
  return text
    .split(STRONG_SEPARATOR)
    .map((part) => part.replace(/^[\s,;|•·–—-]+|[\s,;|•·–—-]+$/g, "").trim())
    .filter(Boolean);
}

/* ------------------------------------------------------------------------ */
/* Text output                                                              */
/* ------------------------------------------------------------------------ */

/**
 * Plain text for a description or summary. A PDF's text layer breaks lines where the
 * page wrapped them, not where the writer did, so a line that does not start a bullet
 * and follows one that did not end a sentence is joined back on -- which also rejoins a
 * bullet that ran onto a second line.
 */
function toPlainText(lines: string[]): string {
  const out: string[] = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (BULLET_PATTERN.test(line)) {
      out.push(`• ${line.replace(BULLET_PATTERN, "")}`);
      continue;
    }

    const previous = out[out.length - 1];
    if (previous !== undefined && !SENTENCE_END.test(previous)) {
      out[out.length - 1] = `${previous} ${line}`;
    } else {
      out.push(line);
    }
  }

  return out.join("\n");
}

function splitList(lines: string[]): string[] {
  const values: string[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    for (const piece of line.replace(BULLET_PATTERN, "").split(/[,;|•·]|\s{3,}/)) {
      // "Languages: TypeScript" -- the label is a category, not a skill.
      const value = piece.replace(/^[^:]{1,30}:\s*/, "").trim();
      const key = value.toLowerCase();
      if (!value || seen.has(key)) continue;
      seen.add(key);
      values.push(value);
    }
  }

  return values.slice(0, MAX_LIST_ITEMS);
}

/* ------------------------------------------------------------------------ */
/* Entries                                                                  */
/* ------------------------------------------------------------------------ */

/**
 * Every entry needs header text: a section that opens with its dates starts an entry
 * whose header is empty, so the first body line is promoted instead.
 */
function withHeaderText(entry: RawEntry): RawEntry {
  if (entry.headerParts.length > 0) return entry;
  const [first, ...rest] = entry.body;
  return { ...entry, headerParts: splitHeaderParts(first ?? ""), body: rest };
}

function groupEntries(lines: string[], allowSingleDate = false): RawEntry[] {
  const cleaned = lines.map((line) => line.trim()).filter(Boolean);
  const entries: RawEntry[] = [];
  let current: RawEntry | null = null;

  const dateOf = (line: string) => {
    if (BULLET_PATTERN.test(line)) return null;
    return findPeriod(line) ?? (allowSingleDate ? findSingleDate(line) : null);
  };

  for (const [index, line] of cleaned.entries()) {
    const date = dateOf(line);

    if (date) {
      const remainder = splitHeaderParts(line.replace(date.text, " "));
      if (current && !current.period) {
        current.period = date.period;
        current.headerParts.push(...remainder);
        continue;
      }
      if (current) entries.push(current);
      current = { period: date.period, headerParts: remainder, body: [] };
      continue;
    }

    if (!current) {
      current = { period: null, headerParts: splitHeaderParts(line), body: [] };
      continue;
    }

    const isBullet = BULLET_PATTERN.test(line);
    const leadsToDate =
      !isBullet && looksLikeEntryHeader(line) && introducesEntry(cleaned, index, allowSingleDate);

    if (leadsToDate && !current.period && current.body.length === 0) {
      current.headerParts.push(...splitHeaderParts(line));
      continue;
    }

    if (leadsToDate) {
      entries.push(current);
      current = { period: null, headerParts: splitHeaderParts(line), body: [] };
      continue;
    }

    current.body.push(line);
  }

  if (current) entries.push(current);
  return entries.map(withHeaderText).filter((entry) => entry.headerParts.length > 0);
}

/** Header fields that were not mapped onto a field are kept, not dropped. */
function entryDescription(entry: RawEntry, usedParts: number): string {
  const leftover = entry.headerParts.slice(usedParts);
  return toPlainText([...(leftover.length ? [leftover.join(" · ")] : []), ...entry.body]);
}

/** "Senior Engineer at Acme" as one header part becomes two. */
function splitTitleAtCompany(parts: string[]): string[] {
  if (parts.length !== 1) return parts;
  const match = /^(.+?)\s+(?:at|@)\s+(.+)$/i.exec(parts[0]);
  return match && TITLE_WORDS.test(match[1]) ? [match[2], match[1]] : parts;
}

/** Orders experience header parts as [employer, jobTitle, location, ...rest]. */
function experienceParts(raw: string[]): string[] {
  const parts = splitTitleAtCompany(raw);
  const [first, second] = parts;
  if (first && second && TITLE_WORDS.test(first) && !TITLE_WORDS.test(second)) {
    return [second, first, ...parts.slice(2)];
  }
  return parts;
}

/** Orders education header parts as [school, degree, location, ...rest]. */
function educationParts(parts: string[]): string[] {
  const [first, second] = parts;
  if (
    first &&
    second &&
    DEGREE_WORDS.test(first) &&
    !SCHOOL_WORDS.test(first) &&
    SCHOOL_WORDS.test(second)
  ) {
    return [second, first, ...parts.slice(2)];
  }
  return parts;
}

function languageLevel(text: string): "Basic" | "Conversational" | "Fluent" | "Native" {
  for (const [pattern, level] of LANGUAGE_LEVELS) {
    if (pattern.test(text)) return level;
  }
  return "Fluent";
}

function labelForUrl(url: string): string {
  const host = url.replace(/^https?:\/\//i, "").replace(/^www\./i, "").toLowerCase();
  if (host.startsWith("linkedin.com")) return "LinkedIn";
  if (host.startsWith("github.com")) return "GitHub";
  if (host.startsWith("gitlab.com")) return "GitLab";
  if (host.startsWith("behance.net")) return "Behance";
  if (host.startsWith("dribbble.com")) return "Dribbble";
  return "Website";
}

function toTitleCaseIfShouting(value: string): string {
  const letters = value.replace(/[^\p{L}]/gu, "");
  if (!letters || letters !== letters.toLocaleUpperCase()) return value;
  return value.toLocaleLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (_, lead, char) => lead + char.toLocaleUpperCase());
}

/* ------------------------------------------------------------------------ */
/* Segmentation                                                             */
/* ------------------------------------------------------------------------ */

function segment(lines: string[], blankLinesMeaningful: boolean): { header: string[]; segments: Segment[] } {
  const records = lines
    .map((line, index) => ({
      line: line.trim().slice(0, MAX_LINE_LENGTH),
      precededByBlank: blankLinesMeaningful && index > 0 && !lines[index - 1]?.trim(),
    }))
    .filter((record) => record.line);
  const cleaned = records.map((record) => record.line);
  const boundary = headerBoundary(cleaned);
  const header: string[] = [];
  const segments: Segment[] = [];
  let current: Segment | null = null;

  for (const [index, { line, precededByBlank }] of records.entries()) {
    const key = knownHeading(line);
    const isolatedTitleCase = precededByBlank && looksLikeTitleCaseHeading(line);
    // With no section open the preamble guard has nothing to protect: skipping it keeps
    // a dated custom section that opens the body from being swallowed into the header.
    const unknown =
      key === null &&
      index > boundary &&
      (looksLikeHeading(line) || isolatedTitleCase) &&
      (current === null || isolatedTitleCase || !introducesEntry(cleaned, index));

    if (key !== null || unknown) {
      if (current) segments.push(current);
      current = { key, title: line.replace(/[:：]\s*$/, "").trim(), lines: [] };
      continue;
    }

    if (current) current.lines.push(line);
    else header.push(line);
  }

  if (current) segments.push(current);
  return { header, segments };
}

function parseHeader(lines: string[]) {
  const joined = lines.join(" ");
  const email = joined.match(EMAIL_PATTERN)?.[0] ?? "";
  const phone = extractPhone(joined);
  const urls = [...new Set(joined.match(URL_PATTERN) ?? [])];

  const strip = (value: string) => {
    let result = value;
    if (email) result = result.replace(email, " ");
    if (phone) result = result.replace(phone, " ");
    for (const url of urls) result = result.replace(url, " ");
    return result.replace(/\s+/g, " ").trim();
  };

  const remaining = lines.map(strip).filter(Boolean);
  const name = toTitleCaseIfShouting(splitHeaderParts(remaining[0] ?? "")[0] ?? "");
  const rest = remaining.slice(1).flatMap(splitHeaderParts).filter(Boolean);
  const locationIndex = rest.findIndex((part) => /,/.test(part) && !/\d{4}/.test(part));
  const headline = locationIndex === 0 ? (rest[1] ?? "") : (rest[0] ?? "");

  return { name, headline, email, phone, urls };
}

/* ------------------------------------------------------------------------ */
/* Public API                                                               */
/* ------------------------------------------------------------------------ */

function emptyResume(): ResumeDataJSON {
  return {
    contact: { firstName: "", lastName: "", desiredJobTitle: "", phone: "", email: "" },
    experiences: [],
    educations: [],
    skills: [],
    summary: "",
    finalize: {
      languages: [],
      certifications: [],
      awards: [],
      websites: [],
      references: [],
      hobbies: [],
      customSections: [],
    },
  };
}

export function parseResumeText(text: string, options: { source?: ImportSource } = {}): ResumeDataJSON {
  const source = options.source ?? "text";
  const normalized = text
    .replace(/\r\n?/g, "\n")
    .replace(/[   ]/g, " ")
    .replace(/[​-‍﻿]/g, "")
    .replace(/\t+/g, "  ");
  // Word's raw text puts a blank line after every paragraph, so there a blank line says
  // nothing about layout -- treating it as one made every short line a heading.
  const blankLinesMeaningful = source !== "docx";
  const lines = normalized.split("\n");

  const { header, segments } = segment(lines, blankLinesMeaningful);
  const contact = parseHeader(header);
  const data = emptyResume();

  const [firstName = "", ...lastNames] = contact.name.split(/\s+/).filter(Boolean);
  data.contact = {
    firstName,
    lastName: lastNames.join(" "),
    desiredJobTitle: contact.headline,
    phone: contact.phone,
    email: contact.email,
  };
  for (const url of contact.urls) {
    data.finalize.websites.push({ id: generateId(), label: labelForUrl(url), url });
  }

  for (const item of segments) {
    if (item.lines.length === 0) continue;

    switch (item.key) {
      case "summary": {
        const content = toPlainText(item.lines);
        data.summary = data.summary ? `${data.summary}\n${content}` : content;
        break;
      }

      case "experience":
        for (const entry of groupEntries(item.lines)) {
          const parts = experienceParts(entry.headerParts);
          data.experiences.push({
            id: generateId(),
            employer: parts[0] ?? "",
            jobTitle: parts[1] ?? "",
            location: parts[2] ?? "",
            startDate: entry.period?.start ?? "",
            endDate: entry.period?.end ?? "",
            isCurrentJob: entry.period?.current ?? false,
            description: entryDescription({ ...entry, headerParts: parts }, 3),
          });
        }
        break;

      case "education":
        for (const entry of groupEntries(item.lines)) {
          const parts = educationParts(entry.headerParts);
          data.educations.push({
            id: generateId(),
            schoolName: parts[0] ?? "",
            degree: parts[1] ?? "",
            location: parts[2] ?? "",
            startDate: entry.period?.start ?? "",
            endDate: entry.period?.end ?? "",
            description: entryDescription({ ...entry, headerParts: parts }, 3),
          });
        }
        break;

      case "skills":
        for (const name of splitList(item.lines)) {
          // No level is stated in a resume's text, so none is shown rather than invented.
          data.skills.push({ id: generateId(), name, level: "Intermediate", showLevel: false });
        }
        break;

      case "languages":
        for (const raw of item.lines) {
          const line = raw.replace(BULLET_PATTERN, "").trim();
          if (!line) continue;
          const match = /^(.+?)\s*[:([–—-]\s*(.+?)\s*[)\]]?$/.exec(line);
          data.finalize.languages.push({
            id: generateId(),
            name: (match?.[1] ?? line).trim(),
            proficiency: languageLevel(match?.[2] ?? line),
          });
        }
        break;

      case "certifications":
        for (const entry of groupEntries(item.lines, true)) {
          data.finalize.certifications.push({
            id: generateId(),
            name: entry.headerParts[0] ?? "",
            issuer: entry.headerParts[1] ?? "",
            date: entry.period?.start ?? "",
          });
        }
        break;

      case "awards":
        for (const entry of groupEntries(item.lines, true)) {
          data.finalize.awards.push({
            id: generateId(),
            title: entry.headerParts[0] ?? "",
            issuer: entry.headerParts[1] ?? "",
            date: entry.period?.start ?? "",
          });
        }
        break;

      case "profiles":
        for (const raw of item.lines) {
          const line = raw.replace(BULLET_PATTERN, "").trim();
          const url = line.match(URL_PATTERN)?.[0] ?? "";
          if (!url) continue;
          const label = splitHeaderParts(line.replace(url, " ").replace(/:\s*$/, ""))[0];
          data.finalize.websites.push({ id: generateId(), label: label || labelForUrl(url), url });
        }
        break;

      case "interests":
        for (const name of splitList(item.lines)) {
          data.finalize.hobbies.push({ id: generateId(), name });
        }
        break;

      case "references":
        for (const entry of groupEntries(item.lines)) {
          const joined = [...entry.headerParts, ...entry.body].join(" ");
          if (/available\s+(?:up)?on\s+request/i.test(joined)) continue;
          data.finalize.references.push({
            id: generateId(),
            name: entry.headerParts[0] ?? "",
            position: entry.headerParts[1] ?? "",
            company: entry.headerParts[2] ?? "",
            email: joined.match(EMAIL_PATTERN)?.[0] ?? "",
            phone: extractPhone(joined),
          });
        }
        break;

      default:
        // Projects, volunteering, publications and anything unrecognised keep their own
        // heading as a custom section, so nothing in the file is silently dropped.
        data.finalize.customSections.push({
          id: generateId(),
          sectionName: item.title,
          description: toPlainText(item.lines),
        });
    }
  }

  return data;
}

/** Whether a parse found anything worth creating a resume from. */
export function hasImportableContent(data: ResumeDataJSON): boolean {
  return Boolean(
    data.contact.firstName ||
      data.contact.email ||
      data.summary ||
      data.experiences.length ||
      data.educations.length ||
      data.skills.length ||
      data.finalize.customSections.length,
  );
}
