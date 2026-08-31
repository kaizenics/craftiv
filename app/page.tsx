
import { Hero } from "@/components/hero";
import { NavbarComponent } from "@/components/navbar";
import { About } from "@/components/about";
import { Works } from "@/components/works";
import { FAQ } from "@/components/faq";
import { Footer } from "@/components/footer";
import { Testimonials } from "@/components/testimonials";
import { CompanyMarquee } from "@/components/company-marquee";
import { FeatureDemo } from "@/components/feature-demo";
import {
  organizationJsonLd,
  softwareApplicationJsonLd,
  websiteJsonLd,
  faqPageJsonLd,
  createPageMetadata,
} from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "AI Resume Builder, ATS Checker & Job Hunter | Craftiv",
  description:
    "Find relevant jobs, check your resume against ATS requirements, and improve every application with Craftiv's AI resume assistant and ATS-friendly templates.",
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
      <NavbarComponent />
      <Hero />
      <CompanyMarquee />
      <FeatureDemo />
      <About />
      <Works />
      <Testimonials />
      <FAQ />
      <Footer />
    </>
  );
}
