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

export interface CoverLetterData {
  contact: CoverLetterContact;
  employer: CoverLetterEmployer;
  opening: string;
  body: string;
  closing: string;
  date: string;
}

export type CoverLetterStep = "contact" | "employer" | "letter";

export const COVER_LETTER_STEPS: { id: CoverLetterStep; label: string }[] = [
  { id: "contact", label: "Your Info" },
  { id: "employer", label: "Employer" },
  { id: "letter", label: "Letter Body" },
];

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
  opening: "",
  body: "",
  closing: "",
  date: new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }),
});
