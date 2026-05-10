
import { Hero } from "@/components/hero";
import { NavbarComponent } from "@/components/navbar";
import { About } from "@/components/about";
import { FAQ } from "@/components/faq";
import { Footer } from "@/components/footer";
import { Testimonials } from "@/components/testimonials";
import {
  organizationJsonLd,
  softwareApplicationJsonLd,
  websiteJsonLd,
  createPageMetadata,
} from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "AI Resume Builder and ATS-Friendly Resume Templates - Go with Craftiv",
  description:
    "Create professional resumes with Craftiv's AI resume builder, ATS-friendly templates, resume upload tools, and cover letter templates built for job seekers.",
});

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How long does it take to create a resume?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Most users complete their resume in under 10 minutes using the guided builder and AI-powered writing suggestions.",
      },
    },
    {
      "@type": "Question",
      name: "Is Craftiv free to use?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Craftiv has a free starter credit, and paid features are unlocked through one-time credit packs. Credits never expire and there is no subscription.",
      },
    },
    {
      "@type": "Question",
      name: "Are the resumes ATS-friendly?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Craftiv templates are designed with clean formatting, clear headings, and readable structures for Applicant Tracking Systems.",
      },
    },
    {
      "@type": "Question",
      name: "Can I edit my resume after downloading?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Resumes are saved to your account and can be edited again before downloading updated files.",
      },
    },
  ],
};

const homeJsonLd = [
  organizationJsonLd,
  websiteJsonLd,
  softwareApplicationJsonLd,
  faqJsonLd,
];

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />
      <NavbarComponent />
      <Hero />
      <About />
      <Testimonials />
      <FAQ />
      <Footer />
    </>
  );
}
