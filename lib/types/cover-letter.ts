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
  content: string;
  date: string;
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
});
