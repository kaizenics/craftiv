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
    question: "Where do the jobs come from?",
    answer:
      "Saved searches pull remote roles from Remotive automatically. For any other site, such as LinkedIn, Indeed or a company careers page, use the job clipper: a browser bookmark that copies the posting into Craftiv in one click on desktop. You can also paste a job description directly.",
  },
  {
    question: "Is Craftiv free to use?",
    answer:
      "Searching, match scoring, the application tracker, the job clipper, the resume and cover letter builders, and PDF or Word downloads are all free. Credits are only used for AI features such as ATS checks, tailoring and AI writing. New accounts get 1 free credit after confirming their email.",
  },
  {
    question: "How is the match score calculated?",
    answer:
      "Craftiv compares the job description with your resume and checks which skills and keywords appear in both. It runs on fixed rules rather than AI, which is why it is free and gives the same result every time. Each job shows its score and the keywords you are missing.",
  },
  {
    question: "Will tailoring change my work history?",
    answer:
      "No. Tailoring rewrites your summary and the descriptions under each role. Employers, dates and contact details are copied over unchanged. If the rewrite does not raise your ATS score, nothing is saved and your credits are refunded.",
  },
  {
    question: "Do credits expire?",
    answer:
      "No. Credits are one-time packs with no subscription, and they never expire.",
  },
  {
    question: "Can I use my own AI key?",
    answer:
      "Yes, on every account including free. Connect your own OpenAI, Anthropic, Gemini or OpenRouter key in settings. AI features then run on your key and use no credits.",
  },
  {
    question: "Can I send my resume as a link?",
    answer:
      "Yes. Any resume or cover letter can get a public link that you can turn off or regenerate at any time. Craftiv shows how many times it was viewed and when it was last opened.",
  },
];

// Shown on /pricing.
export const pricingFaqs: Faq[] = [
  {
    question: "Can I cancel anytime?",
    answer: "There is nothing to cancel. Credits are one-time purchases and never expire.",
  },
  {
    question: "Can I use my own AI API key?",
    answer:
      "Yes, on every account including free. Connect a key from your AI provider in Settings. AI features then run on your key and cost 0 credits, and you can switch back to credits anytime.",
  },
  {
    question: "What payment provider do you use?",
    answer: "We use Polar for secure checkout and payment processing.",
  },
  {
    question: "Are taxes included?",
    answer: "Taxes and invoicing are handled based on your billing location.",
  },
];
