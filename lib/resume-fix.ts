import type { ResumeData } from "@/lib/types/resume";

export interface SpellIssue {
  type: string;
  field: string;
  original: string;
  corrected: string;
  context: string;
}

export interface ApplyFixResult {
  data: ResumeData;
  changed: boolean;
}

function normalizeIssueField(field: string): string {
  return field
    .trim()
    .replace(/^[\[\("'\s]+/, "")
    .replace(/[\]\)"'\s]+$/, "")
    .trim();
}

function normalizeLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function applyFixToResume(
  resumeData: ResumeData,
  issue: SpellIssue,
): ApplyFixResult {
  const updated = JSON.parse(JSON.stringify(resumeData)) as ResumeData;
  const normalizedField = normalizeIssueField(issue.field);
  let changed = false;

  const replace = (str: string) => {
    if (!str || !issue.original) return str;

    if (str.includes(issue.original)) {
      const next = str.split(issue.original).join(issue.corrected);
      if (next !== str) changed = true;
      return next;
    }

    const pattern = escapeRegExp(issue.original.trim());
    if (!pattern) return str;

    const re = new RegExp(pattern, "i");
    if (!re.test(str)) return str;

    const next = str.replace(re, issue.corrected);
    if (next !== str) changed = true;
    return next;
  };

  const fieldMap: Record<string, () => void> = {
    Summary: () => { updated.summary = replace(updated.summary); },
    "First Name": () => { updated.contact.firstName = replace(updated.contact.firstName); },
    "Last Name": () => { updated.contact.lastName = replace(updated.contact.lastName); },
    "Job Title": () => { updated.contact.desiredJobTitle = replace(updated.contact.desiredJobTitle); },
  };

  if (fieldMap[normalizedField]) {
    fieldMap[normalizedField]();
    return { data: updated, changed };
  }

  const expMatch = normalizedField.match(/^Experience (\d+)\s*[-:]\s*(.+)$/i);
  if (expMatch) {
    const idx = parseInt(expMatch[1]) - 1;
    const sub = normalizeLabel(expMatch[2]);
    const exp = updated.experiences[idx];
    if (exp) {
      if (sub === "job title" || sub === "title") exp.jobTitle = replace(exp.jobTitle);
      else if (sub === "employer" || sub === "company") exp.employer = replace(exp.employer);
      else if (sub === "description" || sub === "details") exp.description = replace(exp.description);
    }
    if (changed) return { data: updated, changed };
  }

  const eduMatch = normalizedField.match(/^Education (\d+)\s*[-:]\s*(.+)$/i);
  if (eduMatch) {
    const idx = parseInt(eduMatch[1]) - 1;
    const sub = normalizeLabel(eduMatch[2]);
    const edu = updated.educations[idx];
    if (edu) {
      if (sub === "school" || sub === "school name") edu.schoolName = replace(edu.schoolName);
      else if (sub === "degree") edu.degree = replace(edu.degree);
      else if (sub === "description" || sub === "details") edu.description = replace(edu.description);
    }
    if (changed) return { data: updated, changed };
  }

  const skillMatch = normalizedField.match(/^Skill (\d+)$/i);
  if (skillMatch) {
    const idx = parseInt(skillMatch[1]) - 1;
    if (updated.skills[idx]) {
      updated.skills[idx].name = replace(updated.skills[idx].name);
    }
    if (changed) return { data: updated, changed };
  }

  // Robust fallback: if field labels don't map cleanly, still apply a single text replacement
  // across known resume text fields so "Apply Fix" reflects immediately in preview.
  if (!changed) {
    updated.summary = replace(updated.summary);
    updated.contact.firstName = replace(updated.contact.firstName);
    updated.contact.lastName = replace(updated.contact.lastName);
    updated.contact.desiredJobTitle = replace(updated.contact.desiredJobTitle);
    updated.contact.email = replace(updated.contact.email);
    updated.contact.phone = replace(updated.contact.phone);

    for (const exp of updated.experiences) {
      exp.jobTitle = replace(exp.jobTitle);
      exp.employer = replace(exp.employer);
      exp.location = replace(exp.location);
      exp.description = replace(exp.description);
    }
    for (const edu of updated.educations) {
      edu.schoolName = replace(edu.schoolName);
      edu.location = replace(edu.location);
      edu.degree = replace(edu.degree);
      edu.description = replace(edu.description);
    }
    for (const skill of updated.skills) {
      skill.name = replace(skill.name);
    }
  }

  return { data: updated, changed };
}
