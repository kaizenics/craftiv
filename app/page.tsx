
import { Hero } from "@/components/hero";
import { NavbarComponent } from "@/components/navbar";
import { HowItWorks } from "@/components/how-it-works";
import { Documents } from "@/components/documents";
import { PricingTeaser } from "@/components/pricing-teaser";
import { FAQ } from "@/components/faq";
import { Footer } from "@/components/footer";
import { FeatureDemo } from "@/components/feature-demo";
import { SmoothScroll } from "@/components/smooth-scroll";
import {
  organizationJsonLd,
  softwareApplicationJsonLd,
  websiteJsonLd,
  faqPageJsonLd,
  createPageMetadata,
} from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Job Matching, ATS Checker & AI Resume Builder | Craftiv",
  description:
    "Find jobs that match your resume, tailor every application with AI, and track each one from saved to offer. Free job search tools with an ATS checker and resume builder.",
  titleAbsolute: true,
});

// FAQPage data is generated from the same source that renders the visible
// accordion (lib/data/faqs.ts) so structured data always matches the page.
const homeJsonLd = [
  organizationJsonLd,
  websiteJsonLd,
  softwareApplicationJsonLd,
  faqPageJsonLd,
];

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />
      <SmoothScroll>
      <NavbarComponent />
      <Hero />
      <FeatureDemo />
      <HowItWorks />
      <Documents />
      <PricingTeaser />
      <FAQ />
      <Footer />
      </SmoothScroll>
    </>
  );
}
