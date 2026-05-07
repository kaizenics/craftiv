import { createPageMetadata } from "@/lib/seo";
import { PricingClient } from "./pricing-client";

export const metadata = createPageMetadata({
  title: "Pricing",
  description:
    "Compare Craftiv pricing plans for resume templates, AI resume tools, ATS checking, and cover letter generation.",
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
      name: "Free",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    {
      "@type": "Offer",
      name: "Plus",
      price: "2",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    {
      "@type": "Offer",
      name: "Pro",
      price: "5",
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
