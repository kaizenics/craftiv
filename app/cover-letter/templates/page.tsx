import { absoluteUrl, createPageMetadata } from "@/lib/seo";
import CoverLetterTemplatesPageClient from "./client";

export const metadata = createPageMetadata({
  title: "Cover Letter Templates",
  description:
    "Choose polished cover letter templates for job applications, then customize your letter with Craftiv's AI-assisted cover letter builder.",
  path: "/cover-letter/templates",
});

const coverLetterTemplatesJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Cover Letter Templates",
  description:
    "A collection of professional cover letter templates for job seekers creating tailored application letters with Craftiv.",
  url: absoluteUrl("/cover-letter/templates"),
};

export default function CoverLetterTemplatesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(coverLetterTemplatesJsonLd),
        }}
      />
      <CoverLetterTemplatesPageClient />
    </>
  );
}
