import { absoluteUrl, breadcrumbJsonLd, createPageMetadata, siteConfig } from "@/lib/seo";
import { PricingClient } from "./pricing-client";

export const metadata = createPageMetadata({
  title: "Pricing — Resume Credit Packs",
  description:
    "Compare Craftiv credit packs for resume optimization, ATS matching, AI bullet rewrites, and cover letter support. One-time payments, no subscription, credits never expire.",
  path: "/pricing",
});

const pricingUrl = absoluteUrl("/pricing");

const pricingJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Craftiv Credit Packs",
  description:
    "AI resume builder with ATS-friendly templates, resume improvement tools, and cover letter generation. Buy one-time credit packs — no subscription, credits never expire.",
  brand: {
    "@type": "Brand",
    name: siteConfig.name,
  },
  category: "Career tools / Resume builder",
  url: pricingUrl,
  offers: [
    {
      "@type": "Offer",
      name: "Active",
      price: "1.95",
      priceCurrency: "USD",
      url: pricingUrl,
      availability: "https://schema.org/InStock",
    },
    {
      "@type": "Offer",
      name: "Plus",
      price: "3.95",
      priceCurrency: "USD",
      url: pricingUrl,
      availability: "https://schema.org/InStock",
    },
    {
      "@type": "Offer",
      name: "Pro",
      price: "7.20",
      priceCurrency: "USD",
      url: pricingUrl,
      availability: "https://schema.org/InStock",
    },
  ],
};

const pricingBreadcrumbJsonLd = breadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Pricing", path: "/pricing" },
]);

export default function PricingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([pricingJsonLd, pricingBreadcrumbJsonLd]),
        }}
      />
      <PricingClient />
    </>
  );
}
