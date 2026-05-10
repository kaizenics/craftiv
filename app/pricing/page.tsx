import { createPageMetadata } from "@/lib/seo";
import { PricingClient } from "./pricing-client";

export const metadata = createPageMetadata({
  title: "Pricing",
  description:
    "Compare Craftiv credit packs for resume optimization, ATS matching, AI bullet rewrites, and cover letter support.",
  path: "/pricing",
});

const pricingJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Craftiv",
  description:
    "AI resume builder with ATS-friendly templates, resume improvement tools, and cover letter generation.",
  offers: [
    {
      "@type": "Offer",
      name: "Active",
      price: "1.95",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    {
      "@type": "Offer",
      name: "Plus",
      price: "3.95",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    {
      "@type": "Offer",
      name: "Pro",
      price: "7.20",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
  ],
};

export default function PricingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd) }}
      />
      <PricingClient />
    </>
  );
}
