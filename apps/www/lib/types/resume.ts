// Resume Types and Interfaces

export interface ContactInfo {
  firstName: string;
  lastName: string;
  desiredJobTitle: string;
  phone: string;
  email: string;
  photoUrl?: string;
}

export interface Experience {
  id: string;
  jobTitle: string;
  employer: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrentJob: boolean;
  description: string;
}

export interface Education {
  id: string;
  schoolName: string;
  location: string;
  degree: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Skill {
  id: string;
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  showLevel: boolean;
}

export interface Language {
  id: string;
  name: string;
  proficiency: 'Basic' | 'Conversational' | 'Fluent' | 'Native';
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
}

export interface Award {
  id: string;
  title: string;
  issuer: string;
  date: string;
}

export interface Website {
  id: string;
  label: string;
  url: string;
}

export interface Reference {
  id: string;
  name: string;
  position: string;
  company: string;
  email: string;
  phone: string;
}

export interface Hobby {
  id: string;
  name: string;
}

export interface CustomSection {
  id: string;
  sectionName: string;
  description: string;
}

export interface FinalizeOptions {
  languages: Language[];
  certifications: Certification[];
  awards: Award[];
  websites: Website[];
  references: Reference[];
  hobbies: Hobby[];
  customSections: CustomSection[];
}

export interface ResumeData {
  templateId: string;
  contact: ContactInfo;
  experiences: Experience[];
  educations: Education[];
  skills: Skill[];
  summary: string;
  finalize: FinalizeOptions;
}

export type TemplateLayout = 'classic' | 'modern' | 'sidebar' | 'bold' | 'minimal' | 'executive' | 'harvard';

export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  primaryColor: string;
  category: 'professional' | 'creative' | 'modern' | 'simple';
  layout: TemplateLayout;
}

export type ResumeStep = 'contacts' | 'experience' | 'education' | 'skills' | 'summary' | 'finalize';

export const RESUME_STEPS: { id: ResumeStep; label: string }[] = [
  { id: 'contacts', label: 'Contacts' },
  { id: 'experience', label: 'Experience' },
  { id: 'education', label: 'Education' },
  { id: 'skills', label: 'Skills' },
  { id: 'summary', label: 'Summary' },
  { id: 'finalize', label: 'Finalize' },
];

export const createEmptyResumeData = (templateId: string): ResumeData => ({
  templateId,
  contact: {
    firstName: '',
    lastName: '',
    desiredJobTitle: '',
    phone: '',
    email: '',
  },
  experiences: [],
  educations: [],
  skills: [],
  summary: '',
  finalize: {
    languages: [],
    certifications: [],
    awards: [],
    websites: [],
    references: [],
    hobbies: [],
    customSections: [],
  },
});

export const generateId = () => Math.random().toString(36).substring(2, 9);
