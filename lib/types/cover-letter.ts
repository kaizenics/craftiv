export interface CoverLetterContact {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
}

export interface CoverLetterEmployer {
  hiringManagerName: string;
  companyName: string;
  companyAddress: string;
  jobTitle: string;
}

export const coverLetterTemplateIds = [
  "modern-ats",
  "professional",
] as const;

export type CoverLetterTemplateId = (typeof coverLetterTemplateIds)[number];

export const DEFAULT_COVER_LETTER_TEMPLATE_ID: CoverLetterTemplateId = "modern-ats";

export const isCoverLetterTemplateId = (
  value: string | undefined | null
): value is CoverLetterTemplateId =>
  !!value && (coverLetterTemplateIds as readonly string[]).includes(value);

export interface CoverLetterData {
  contact: CoverLetterContact;
  employer: CoverLetterEmployer;
  content: string;
  date: string;
  templateId: CoverLetterTemplateId;
}

export const createEmptyCoverLetterData = (): CoverLetterData => ({
  contact: {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
  },
  employer: {
    hiringManagerName: "",
    companyName: "",
    companyAddress: "",
    jobTitle: "",
  },
  content: "",
  date: new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }),
  templateId: DEFAULT_COVER_LETTER_TEMPLATE_ID,
});

export const normalizeCoverLetterData = (
  raw: Partial<CoverLetterData> | undefined | null
): CoverLetterData => {
  const fallback = createEmptyCoverLetterData();

  return {
    contact: {
      ...fallback.contact,
      ...(raw?.contact ?? {}),
    },
    employer: {
      ...fallback.employer,
      ...(raw?.employer ?? {}),
    },
    content: raw?.content ?? fallback.content,
    date: raw?.date ?? fallback.date,
    templateId: isCoverLetterTemplateId(raw?.templateId)
      ? raw.templateId
      : fallback.templateId,
  };
};
