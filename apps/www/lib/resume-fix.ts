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

  const expMatch = normalizedField.match(/^Experience (\d+) - (.+)$/);
  if (expMatch) {
    const idx = parseInt(expMatch[1]) - 1;
    const sub = expMatch[2];
    const exp = updated.experiences[idx];
    if (exp) {
      if (sub === "Job Title") exp.jobTitle = replace(exp.jobTitle);
      else if (sub === "Employer") exp.employer = replace(exp.employer);
      else if (sub === "Description") exp.description = replace(exp.description);
    }
    return { data: updated, changed };
  }

  const eduMatch = normalizedField.match(/^Education (\d+) - (.+)$/);
  if (eduMatch) {
    const idx = parseInt(eduMatch[1]) - 1;
    const sub = eduMatch[2];
    const edu = updated.educations[idx];
    if (edu) {
      if (sub === "School") edu.schoolName = replace(edu.schoolName);
      else if (sub === "Degree") edu.degree = replace(edu.degree);
      else if (sub === "Description") edu.description = replace(edu.description);
    }
    return { data: updated, changed };
  }

  const skillMatch = normalizedField.match(/^Skill (\d+)$/);
  if (skillMatch) {
    const idx = parseInt(skillMatch[1]) - 1;
    if (updated.skills[idx]) {
      updated.skills[idx].name = replace(updated.skills[idx].name);
    }
    return { data: updated, changed };
  }

  return { data: updated, changed };
}
