import type { ResumeData } from "@/lib/types/resume";

export interface SpellIssue {
  type: string;
  field: string;
  original: string;
  corrected: string;
  context: string;
}

export function applyFixToResume(
  resumeData: ResumeData,
  issue: SpellIssue,
): ResumeData {
  const updated = JSON.parse(JSON.stringify(resumeData)) as ResumeData;

  const replace = (str: string) => str.split(issue.original).join(issue.corrected);

  const fieldMap: Record<string, () => void> = {
    Summary: () => { updated.summary = replace(updated.summary); },
    "First Name": () => { updated.contact.firstName = replace(updated.contact.firstName); },
    "Last Name": () => { updated.contact.lastName = replace(updated.contact.lastName); },
    "Job Title": () => { updated.contact.desiredJobTitle = replace(updated.contact.desiredJobTitle); },
  };

  if (fieldMap[issue.field]) {
    fieldMap[issue.field]();
    return updated;
  }

  const expMatch = issue.field.match(/^Experience (\d+) - (.+)$/);
  if (expMatch) {
    const idx = parseInt(expMatch[1]) - 1;
    const sub = expMatch[2];
    const exp = updated.experiences[idx];
    if (exp) {
      if (sub === "Job Title") exp.jobTitle = replace(exp.jobTitle);
      else if (sub === "Employer") exp.employer = replace(exp.employer);
      else if (sub === "Description") exp.description = replace(exp.description);
    }
    return updated;
  }

  const eduMatch = issue.field.match(/^Education (\d+) - (.+)$/);
  if (eduMatch) {
    const idx = parseInt(eduMatch[1]) - 1;
    const sub = eduMatch[2];
    const edu = updated.educations[idx];
    if (edu) {
      if (sub === "School") edu.schoolName = replace(edu.schoolName);
      else if (sub === "Degree") edu.degree = replace(edu.degree);
      else if (sub === "Description") edu.description = replace(edu.description);
    }
    return updated;
  }

  const skillMatch = issue.field.match(/^Skill (\d+)$/);
  if (skillMatch) {
    const idx = parseInt(skillMatch[1]) - 1;
    if (updated.skills[idx]) {
      updated.skills[idx].name = replace(updated.skills[idx].name);
    }
    return updated;
  }

  return updated;
}
