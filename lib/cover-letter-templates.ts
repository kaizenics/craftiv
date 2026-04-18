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
  accentColor?: string;
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
  {
    id: "executive",
    name: "Executive",
    description:
      "Senior-level cover letter style with measured hierarchy, formal spacing, and ATS-safe structure.",
    badge: "Leadership",
    accentColor: "#0f766e",
  },
  {
    id: "minimal-serif",
    name: "Minimal Serif",
    description:
      "A restrained serif presentation that feels polished while keeping a simple single-column ATS layout.",
    badge: "Refined",
    accentColor: "#7c2d12",
  },
  {
    id: "clean-block",
    name: "Clean Block",
    description:
      "Modern contact block and crisp section rhythm for applicants who want a contemporary ATS-ready look.",
    badge: "Modern",
    accentColor: "#1d4ed8",
  },
  {
    id: "sidebar-contact",
    name: "Sidebar Contact",
    description:
      "Distinctive left rail for contact details in preview and export while maintaining readable letter flow.",
    badge: "Structured",
    accentColor: "#4338ca",
  },
  {
    id: "elegant-line",
    name: "Elegant Line",
    description:
      "Light editorial styling with disciplined dividers and conservative typography for ATS compatibility.",
    badge: "Editorial",
    accentColor: "#be123c",
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
