import {
  DEFAULT_COVER_LETTER_TEMPLATE_ID,
  isCoverLetterTemplateId,
  type CoverLetterTemplateId,
} from "@/lib/types/cover-letter";

export interface CoverLetterTemplateDefinition {
  id: CoverLetterTemplateId;
  name: string;
  description: string;
  badge: string;
}

export const coverLetterTemplates: CoverLetterTemplateDefinition[] = [
  {
    id: "modern-ats",
    name: "Modern ATS",
    description:
      "Simple single-column layout with standard fonts and clean spacing for ATS parsing.",
    badge: "ATS Ready",
  },
  {
    id: "professional",
    name: "Professional",
    description:
      "Classic business presentation with formal hierarchy for leadership and client-facing roles.",
    badge: "Traditional",
  },
];

export const normalizeCoverLetterTemplateId = (
  value: string | undefined | null
): CoverLetterTemplateId =>
  isCoverLetterTemplateId(value) ? value : DEFAULT_COVER_LETTER_TEMPLATE_ID;

export const getCoverLetterTemplate = (
  value: string | undefined | null
): CoverLetterTemplateDefinition => {
  const id = normalizeCoverLetterTemplateId(value);
  return (
    coverLetterTemplates.find((template) => template.id === id) ??
    coverLetterTemplates[0]
  );
};
