import { DEFAULT_SECTION_ORDER, ResumeData, TemplateLayout } from '../types/resume';

export interface TemplateData {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  primaryColor: string;
  category: string[];
  layout: TemplateLayout;
  /** Pinned to the front of the gallery and badged as the most-used template. */
  featured?: boolean;
}

// Sample resume data for template previews
export const sampleResumeData = {
  name: "John Smith",
  title: "Senior Product Designer",
  email: "john.s@email.com",
  phone: "(555) 123-4567",
  location: "San Francisco, CA",
  summary: "Innovative product designer with 8+ years of experience crafting user-centered digital experiences. Passionate about creating intuitive interfaces that solve real-world problems and enhance user satisfaction.",
  experience: [
    {
      title: "Senior Product Designer",
      company: "TechCorp Inc.",
      date: "2021 - Present",
      location: "San Francisco, CA",
      description: "Led the design of flagship products, resulting in a 40% increase in user engagement. Collaborated with cross-functional teams including engineering, marketing, and product management to deliver innovative solutions. Conducted user research, created wireframes and prototypes, and implemented design systems that improved consistency across platforms."
    },
    {
      title: "UI/UX Designer",
      company: "StartupXYZ",
      date: "2018 - 2021",
      location: "San Francisco, CA",
      description: "Designed user interfaces for mobile and web applications, focusing on usability and accessibility. Conducted user research and usability testing to enhance product usability. Worked closely with developers to ensure pixel-perfect implementation of designs."
    },
    {
      title: "Junior Designer",
      company: "DesignStudio",
      date: "2016 - 2018",
      location: "Palo Alto, CA",
      description: "Assisted in creating visual designs for various client projects. Learned industry-standard tools and best practices in user experience design. Contributed to team brainstorming sessions and design critiques."
    }
  ],
  education: {
    degree: "B.A. in Design",
    school: "Stanford University",
    date: "2014 - 2018",
    location: "Stanford, CA",
    description: "Graduated Magna Cum Laude with a GPA of 3.8. Focused on digital design, user experience, and graphic design. Completed capstone project on mobile app design trends."
  },
  skills: ["Figma", "React", "User Research", "Prototyping", "Design Systems", "Adobe Creative Suite", "Sketch", "InVision"],
  languages: [
    { name: "English", proficiency: "Native" },
    { name: "Spanish", proficiency: "Conversational" },
    { name: "French", proficiency: "Basic" }
  ],
  certifications: [
    { name: "Certified Scrum Master", issuer: "Scrum Alliance", date: "2020" },
    { name: "Google UX Design Certificate", issuer: "Google", date: "2019" },
    { name: "Adobe Certified Expert in XD", issuer: "Adobe", date: "2018" }
  ],
  awards: [
    { title: "Design Excellence Award", issuer: "TechCorp Inc.", date: "2022" },
    { title: "Best UI/UX Design", issuer: "StartupXYZ", date: "2020" },
    { title: "Student Design Competition Winner", issuer: "Stanford University", date: "2017" }
  ],
  websites: [
    { label: "Portfolio", url: "https://johnsmith.design" },
    { label: "LinkedIn", url: "https://linkedin.com/in/johnsmith" },
    { label: "GitHub", url: "https://github.com/johnsmith" }
  ],
  references: [
    { name: "Jane Doe", position: "Product Manager", company: "TechCorp Inc.", email: "jane.doe@techcorp.com", phone: "(555) 987-6543" },
    { name: "Bob Johnson", position: "CTO", company: "StartupXYZ", email: "bob.johnson@startupxyz.com", phone: "(555) 456-7890" },
    { name: "Alice Brown", position: "Design Director", company: "DesignStudio", email: "alice.brown@designstudio.com", phone: "(555) 321-0987" }
  ],
  hobbies: ["Photography", "Hiking", "Reading Science Fiction", "Playing Guitar", "Cooking"]
};

export function createSampleResumeForTemplate(templateId: string, withPhoto = false): ResumeData {
  const nameParts = sampleResumeData.name.split(' ');
  const firstName = nameParts[0] || 'John';
  const lastName = nameParts.slice(1).join(' ') || 'Smith';

  return {
    templateId,
    contact: {
      firstName,
      lastName,
      desiredJobTitle: sampleResumeData.title,
      phone: sampleResumeData.phone,
      email: sampleResumeData.email,
      photoUrl: withPhoto ? '/sample.png' : '',
    },
    experiences: sampleResumeData.experience.map((exp, index) => ({
      id: `sample-exp-${index + 1}`,
      jobTitle: exp.title,
      employer: exp.company,
      location: exp.location || '',
      startDate: exp.date.split(' - ')[0] || exp.date,
      endDate: exp.date.split(' - ')[1] || '',
      isCurrentJob: exp.date.toLowerCase().includes('present'),
      description: exp.description || '',
    })),
    educations: [
      {
        id: 'sample-edu-1',
        schoolName: sampleResumeData.education.school,
        location: sampleResumeData.education.location || '',
        degree: sampleResumeData.education.degree,
        startDate: sampleResumeData.education.date.split(' - ')[0] || sampleResumeData.education.date,
        endDate: sampleResumeData.education.date.split(' - ')[1] || '',
        description: sampleResumeData.education.description || '',
      },
    ],
    skills: sampleResumeData.skills.map((skill, index) => ({
      id: `sample-skill-${index + 1}`,
      name: skill,
      level: 'Advanced',
      showLevel: false,
    })),
    summary: sampleResumeData.summary,
    sectionOrder: [...DEFAULT_SECTION_ORDER],
    finalize: {
      languages: (sampleResumeData.languages || []).map((lang, index) => ({
        id: `sample-lang-${index + 1}`,
        name: lang.name,
        proficiency: lang.proficiency as ResumeData['finalize']['languages'][number]['proficiency'],
      })),
      certifications: (sampleResumeData.certifications || []).map((cert, index) => ({
        id: `sample-cert-${index + 1}`,
        name: cert.name,
        issuer: cert.issuer,
        date: cert.date,
      })),
      awards: (sampleResumeData.awards || []).map((award, index) => ({
        id: `sample-award-${index + 1}`,
        title: award.title,
        issuer: award.issuer,
        date: award.date,
      })),
      websites: (sampleResumeData.websites || []).map((website, index) => ({
        id: `sample-site-${index + 1}`,
        label: website.label,
        url: website.url,
      })),
      references: (sampleResumeData.references || []).map((ref, index) => ({
        id: `sample-ref-${index + 1}`,
        name: ref.name,
        position: ref.position,
        company: ref.company,
        email: ref.email,
        phone: ref.phone,
      })),
      hobbies: (sampleResumeData.hobbies || []).map((hobby, index) => ({
        id: `sample-hobby-${index + 1}`,
        name: hobby,
      })),
      customSections: [],
    },
  };
}

// Template category definitions
export const templateCategories = [
  { id: "all", name: "All Templates" },
  { id: "simple", name: "Simple" },
  { id: "modern", name: "Modern" },
  { id: "professional", name: "Professional" },
  { id: "ats", name: "ATS Friendly" },
  { id: "creative", name: "Creative" },
] as const;

// All resume templates
export const templates: TemplateData[] = [
  {
    id: "harvard",
    name: "Harvard",
    description: "The gold standard resume format used by Harvard Business School. Clean, professional, and universally accepted.",
    thumbnail: "/templates/harvard.png",
    primaryColor: "#1e1e1e",
    category: ["all", "professional", "ats", "simple"],
    layout: "harvard",
    featured: true,
  },
  {
    id: "celestial",
    name: "Celestial",
    description: "Soft neutral tones with refined typography for a sophisticated and professional feel.",
    thumbnail: "/templates/celestial.png",
    primaryColor: "#1e3a5f",
    category: ["all", "professional", "ats"],
    layout: "classic",
  },
  {
    id: "galaxy",
    name: "Galaxy",
    description: "A visually striking resume template, perfect for illustrating the breadth and depth of your expertise.",
    thumbnail: "/templates/galaxy.png",
    primaryColor: "#2563eb",
    category: ["all", "modern"],
    layout: "modern",
  },
  {
    id: "astral",
    name: "Astral",
    description: "Includes a prominent profile image for a personal touch while maintaining professionalism.",
    thumbnail: "/templates/astral.png",
    primaryColor: "#57534e",
    category: ["all", "professional", "creative"],
    layout: "sidebar",
  },
  {
    id: "nova",
    name: "Nova",
    description: "Clean and minimal design optimized for ATS systems with maximum readability.",
    thumbnail: "/templates/nova.png",
    primaryColor: "#374151",
    category: ["all", "simple", "ats"],
    layout: "minimal",
  },
  {
    id: "orbit",
    name: "Orbit",
    description: "Modern layout with creative elements that stand out while remaining professional.",
    thumbnail: "/templates/orbit.png",
    primaryColor: "#3f3f46",
    category: ["all", "modern", "creative"],
    layout: "bold",
  },
  {
    id: "stellar",
    name: "Stellar",
    description: "Bold typography and structured sections for maximum impact and clarity.",
    thumbnail: "/templates/stellar.png",
    primaryColor: "#059669",
    category: ["all", "simple", "ats"],
    layout: "classic",
  },
  {
    id: "aurora",
    name: "Aurora",
    description: "Refined two-column layout with clean dividers and balanced hierarchy for ATS-safe modern resumes.",
    thumbnail: "/templates/aurora.png",
    primaryColor: "#4f46e5",
    category: ["all", "modern", "professional", "ats"],
    layout: "sidebar",
  },
  {
    id: "zenith",
    name: "Zenith",
    description: "Executive single-column layout led by employer and tenure, with core competencies set for fast scanning.",
    thumbnail: "/templates/zenith.png",
    primaryColor: "#0f766e",
    category: ["all", "professional", "ats"],
    layout: "executive",
  },
  {
    id: "pulse",
    name: "Pulse",
    description: "Modern two-column resume with a timeline of roles and a compact reference rail, ATS-ready throughout.",
    thumbnail: "/templates/pulse.png",
    primaryColor: "#ea580c",
    category: ["all", "modern", "professional", "ats"],
    layout: "modern",
  },
  {
    id: "classic",
    name: "Classic",
    description: "Timeless traditional format trusted by hiring managers across all industries.",
    thumbnail: "/templates/classic.png",
    primaryColor: "#1f2937",
    category: ["all", "simple", "ats", "professional"],
    layout: "classic",
  },
  {
    id: "metro",
    name: "Metro",
    description: "Ledger layout where every role hangs off a date rail, so dates and employers line up down the page.",
    thumbnail: "/templates/metro.png",
    primaryColor: "#0d9488",
    category: ["all", "professional", "modern"],
    layout: "minimal",
  },
  {
    id: "bold",
    name: "Bold",
    description: "Confident visual identity with disciplined spacing and ATS-friendly single-column reading flow.",
    thumbnail: "/templates/bold.png",
    primaryColor: "#b91c1c",
    category: ["all", "modern", "professional", "ats"],
    layout: "bold",
  },
  {
    id: "summit",
    name: "Summit",
    description: "Straightforward recruiter-friendly layout with understated accents and strong scannability.",
    thumbnail: "/templates/summit.png",
    primaryColor: "#334155",
    category: ["all", "simple", "professional", "ats"],
    layout: "classic",
  },
  {
    id: "horizon",
    name: "Horizon",
    description: "Minimal two-column structure that keeps key details visible while preserving ATS readiness.",
    thumbnail: "/templates/horizon.png",
    primaryColor: "#0f766e",
    category: ["all", "modern", "professional", "ats"],
    layout: "minimal",
  },
  {
    id: "apex",
    name: "Apex",
    description: "Leadership-focused format with measured accents for senior, operations, and strategy roles.",
    thumbnail: "/templates/apex.png",
    primaryColor: "#1d4ed8",
    category: ["all", "professional", "ats"],
    layout: "executive",
  },
  {
    id: "clarity",
    name: "Clarity",
    description: "Clean no-friction template designed for ATS parsing and high readability across industries.",
    thumbnail: "/templates/clarity.png",
    primaryColor: "#475569",
    category: ["all", "simple", "ats", "professional"],
    layout: "minimal",
  },
  {
    id: "forge",
    name: "Forge",
    description: "Structured modern resume with durable hierarchy for technical and project-based roles.",
    thumbnail: "/templates/forge.png",
    primaryColor: "#7c3aed",
    category: ["all", "modern", "professional", "ats"],
    layout: "classic",
  },
  {
    id: "boardroom",
    name: "Boardroom",
    description: "A polished grayscale layout inspired by modern corporate resumes with photo, timeline experience, and a crisp two-column structure.",
    thumbnail: "/templates/boardroom.png",
    primaryColor: "#6b7280",
    category: ["all", "professional", "ats"],
    layout: "classic",
  },
];
