import { absoluteUrl, breadcrumbJsonLd, createPageMetadata } from "@/lib/seo";
import { templates } from "@/lib/data/templates";
import ResumeTemplatesPageClient from "./client";

export const metadata = createPageMetadata({
  title: "ATS-Friendly Resume Templates",
  description:
    "Browse professional, modern, simple, and ATS-friendly resume templates. Choose a Craftiv template and build a polished resume in minutes.",
  path: "/resume/templates",
});

const templatesUrl = absoluteUrl("/resume/templates");

const templatesJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "ATS-Friendly Resume Templates",
  description:
    "A collection of professional resume templates for job seekers building ATS-friendly resumes with Craftiv.",
  url: templatesUrl,
  mainEntity: {
    "@type": "ItemList",
    name: "ATS-Friendly Resume Templates",
    numberOfItems: templates.length,
    itemListElement: templates.map((template, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: `${template.name} resume template`,
    })),
  },
};

const templatesBreadcrumbJsonLd = breadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Resume Templates", path: "/resume/templates" },
]);

export default function ResumeTemplatesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([templatesJsonLd, templatesBreadcrumbJsonLd]),
        }}
      />
      <ResumeTemplatesPageClient />
    </>
  );
}
