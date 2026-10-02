import { z } from "zod";

/**
 * Size caps for stored resume data. Generous for real resumes, but they stop a
 * single save from storing megabytes that then get pasted into AI prompts.
 */
export const RESUME_LIMITS = {
  short: 200,
  url: 2000,
  /** Rich-text fields hold editor HTML, so they get more room than plain text. */
  richText: 20_000,
  listItems: 50,
  customSections: 20,
} as const;

const short = () => z.string().max(RESUME_LIMITS.short);
const richText = () => z.string().max(RESUME_LIMITS.richText);
const list = <T extends z.ZodTypeAny>(item: T, max: number = RESUME_LIMITS.listItems) =>
  z.array(item).max(max);

const contactSchema = z.object({
  firstName: short(),
  lastName: short(),
  desiredJobTitle: short(),
  phone: short(),
  email: z.string().max(RESUME_LIMITS.short).email().or(z.literal("")),
});

const experienceSchema = z.object({
  id: short(),
  jobTitle: short(),
  employer: short(),
  location: short(),
  startDate: short(),
  endDate: short(),
  isCurrentJob: z.boolean(),
  description: richText(),
});

const educationSchema = z.object({
  id: short(),
  schoolName: short(),
  location: short(),
  degree: short(),
  startDate: short(),
  endDate: short(),
  description: richText(),
});

const skillSchema = z.object({
  id: short(),
  name: short(),
  level: z.enum(["Beginner", "Intermediate", "Advanced", "Expert"]),
  showLevel: z.boolean(),
});

const languageSchema = z.object({
  id: short(),
  name: short(),
  proficiency: z.enum(["Basic", "Conversational", "Fluent", "Native"]),
});

const certificationSchema = z.object({
  id: short(),
  name: short(),
  issuer: short(),
  date: short(),
});

const awardSchema = z.object({
  id: short(),
  title: short(),
  issuer: short(),
  date: short(),
});

const websiteSchema = z.object({
  id: short(),
  label: short(),
  url: z.string().max(RESUME_LIMITS.url),
});

const referenceSchema = z.object({
  id: short(),
  name: short(),
  position: short(),
  company: short(),
  email: short(),
  phone: short(),
});

const hobbySchema = z.object({
  id: short(),
  name: short(),
});

const customSectionSchema = z.object({
  id: short(),
  sectionName: short(),
  description: richText(),
});

const finalizeSchema = z.object({
  languages: list(languageSchema),
  certifications: list(certificationSchema),
  awards: list(awardSchema),
  websites: list(websiteSchema),
  references: list(referenceSchema),
  hobbies: list(hobbySchema),
  customSections: list(customSectionSchema, RESUME_LIMITS.customSections),
});

export const resumeDataSchema = z.object({
  contact: contactSchema,
  experiences: list(experienceSchema),
  educations: list(educationSchema),
  skills: list(skillSchema),
  summary: richText(),
  finalize: finalizeSchema,
});
