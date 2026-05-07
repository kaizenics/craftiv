import type { MetadataRoute } from "next";
import { absoluteUrl, siteConfig } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/pricing",
          "/resume/templates",
          "/resume/upload",
          "/cover-letter/templates",
          "/privacy",
          "/terms",
          "/refund-policy",
          "/data-deletion",
          "/contact",
        ],
        disallow: [
          "/api/",
          "/dashboard/",
          "/sign-in",
          "/sign-up",
          "/resume/section/",
          "/resume/final-resume",
          "/cover-letter/write",
          "/coming-soon",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteConfig.url,
  };
}
