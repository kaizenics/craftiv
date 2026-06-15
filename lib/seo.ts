import type { Metadata } from "next";
import { homeFaqs, type Faq } from "@/lib/data/faqs";

const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
const siteUrl = configuredSiteUrl
  ? configuredSiteUrl.startsWith("http")
    ? configuredSiteUrl
    : `https://${configuredSiteUrl}`
  : "https://gocraftiv.com";

export const siteConfig = {
  name: "Craftiv",
  url: siteUrl,
  title: "Craftiv | AI Resume Builder and ATS-Friendly Resume Templates",
  description:
    "Build an ATS-friendly resume, improve your content with AI, choose professional templates, and download job-ready resume and cover letter documents.",
  // Contact + social signals used in structured data (E-E-A-T / trust).
  supportEmail: "info@gocraftiv.com",
  sameAs: ["https://facebook.com/gocraftiv"],
  keywords: [
    "AI resume builder",
    "ATS resume builder",
    "resume builder",
    "resume templates",
    "ATS-friendly resume",
    "cover letter builder",
    "cover letter templates",
    "ATS friendly resume",
    "professional resume maker",
    "resume checker",
    "job application tools",
  ],
};

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}

export function createPageMetadata({
  title,
  description,
  path = "/",
  titleAbsolute = false,
  noIndex = false,
}: {
  title: string;
  description: string;
  path?: string;
  /** When true the page title is used verbatim (no "%s | Craftiv" template). */
  titleAbsolute?: boolean;
  noIndex?: boolean;
}): Metadata {
  const url = absoluteUrl(path);

  return {
    title: titleAbsolute ? { absolute: title } : title,
    description,
    alternates: {
      canonical: url,
    },
    // openGraph / twitter images are supplied by the file-based
    // app/opengraph-image.tsx + app/twitter-image.tsx (real 1200x630 cards).
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
  };
}

/* -------------------------------------------------------------------------- */
/*  Structured data (JSON-LD)                                                  */
/* -------------------------------------------------------------------------- */

const ORG_ID = `${siteConfig.url}/#organization`;
const WEBSITE_ID = `${siteConfig.url}/#website`;

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": ORG_ID,
  name: siteConfig.name,
  url: siteConfig.url,
  description: siteConfig.description,
  logo: {
    "@type": "ImageObject",
    url: absoluteUrl("/craftiv.png"),
    width: 1024,
    height: 1024,
  },
  contactPoint: {
    "@type": "ContactPoint",
    email: siteConfig.supportEmail,
    contactType: "customer support",
    availableLanguage: ["English"],
  },
  sameAs: siteConfig.sameAs,
};

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  name: siteConfig.name,
  url: siteConfig.url,
  description: siteConfig.description,
  inLanguage: "en-US",
  publisher: { "@id": ORG_ID },
};

export const softwareApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: siteConfig.name,
  url: siteConfig.url,
  description: siteConfig.description,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  browserRequirements: "Requires JavaScript. Requires HTML5.",
  publisher: { "@id": ORG_ID },
  featureList: [
    "AI resume builder",
    "ATS-friendly resume templates",
    "AI bullet point rewriting",
    "Resume ATS score checker",
    "Cover letter builder",
    "PDF and DOCX export",
  ],
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "USD",
    lowPrice: "0",
    highPrice: "7.20",
    offerCount: 4,
  },
};

/** Build FAQPage structured data from the same data that renders on the page. */
export function buildFaqPageJsonLd(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export const faqPageJsonLd = buildFaqPageJsonLd(homeFaqs);

/** Build a BreadcrumbList from an ordered list of crumbs. */
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
