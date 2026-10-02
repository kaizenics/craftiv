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
  /** Cropped profile photos are stored inline as JPEG data URLs. */
  photoUrl: 1_200_000,
} as const;

export const RESUME_SECTION_KEYS = [
  "summary",
  "experience",
  "education",
  "skills",
  "languages",
  "certifications",
  "awards",
  "websites",
  "references",
  "hobbies",
  "custom",
] as const;

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
  photoUrl: z
    .string()
    .max(RESUME_LIMITS.photoUrl)
    .refine((value) => value === "" || /^(data:image\/|https:\/\/)/.test(value), {
      message: "Photo must be an image data URL or an https URL.",
    })
    .optional(),
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

/**
 * How the resume looks: the editor's design panel, the chosen color, and
 * whether the photo shows. Stored with the data so a share link or a restored
 * snapshot renders exactly what the owner saw.
 */
export const resumeDesignSchema = z.object({
  fontFamily: z.string().max(RESUME_LIMITS.short),
  fontSize: z.number().min(6).max(24),
  sectionSpacing: z.number().min(0).max(64),
  paragraphSpacing: z.number().min(0).max(64),
  lineSpacing: z.number().min(0.8).max(3),
  color: z.string().max(32),
  showPhoto: z.boolean(),
});

export const resumeDataSchema = z.object({
  templateId: short().optional(),
  sectionOrder: z.array(z.enum(RESUME_SECTION_KEYS)).max(RESUME_SECTION_KEYS.length).optional(),
  design: resumeDesignSchema.optional(),
  contact: contactSchema,
  experiences: list(experienceSchema),
  educations: list(educationSchema),
  skills: list(skillSchema),
  summary: richText(),
  finalize: finalizeSchema,
});

export type ResumeDesign = z.infer<typeof resumeDesignSchema>;
