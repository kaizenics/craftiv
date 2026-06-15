// Single source of truth for the homepage FAQ.
// Consumed by both the visible accordion (components/faq.tsx) and the
// FAQPage JSON-LD (app/page.tsx) so structured data always matches the page.
// Google requires FAQ rich-result markup to match the visible content.

export interface Faq {
  question: string;
  answer: string;
}

export const homeFaqs: Faq[] = [
  {
    question: "How long does it take to create a resume?",
    answer:
      "Most users complete their resume in under 10 minutes. Our intuitive builder guides you through each section, and AI-powered suggestions help you write compelling content quickly.",
  },
  {
    question: "Is Craftiv free to use?",
    answer:
      "Yes. You can start with a free credit, then buy one-time credit packs when you need more optimizations. There is no monthly subscription and credits do not expire.",
  },
  {
    question: "Are the resumes ATS-friendly?",
    answer:
      "Absolutely. Every template is designed to pass through Applicant Tracking Systems. We use clean formatting, proper heading structures, and standard fonts to ensure your resume gets seen by recruiters.",
  },
  {
    question: "Can I edit my resume after downloading?",
    answer:
      "Yes! Your resumes are saved to your account and can be edited anytime. You can also download in multiple formats including PDF, DOCX, and plain text.",
  },
  {
    question: "Do you offer templates for different industries?",
    answer:
      "We have professionally designed templates tailored for various industries including tech, finance, healthcare, creative fields, and more. Each template is customizable to match your personal brand.",
  },
  {
    question: "How does the AI resume optimization work?",
    answer:
      "Our AI analyzes your experience and the job description you're targeting. It suggests improvements to your bullet points, identifies missing keywords, and helps you quantify your achievements for maximum impact.",
  },
];
