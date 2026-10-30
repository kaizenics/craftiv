import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { resumeExamples } from "@/lib/data/resume-examples";

const routes = [
  { path: "/", priority: 1 },
  { path: "/resume/templates", priority: 0.95 },
  { path: "/resume-examples", priority: 0.9 },
  ...resumeExamples.map((e) => ({ path: `/resume-examples/${e.slug}`, priority: 0.8 })),
  { path: "/resume/upload", priority: 0.8 },
  { path: "/cover-letter/templates", priority: 0.8 },
  { path: "/pricing", priority: 0.75 },
  { path: "/contact", priority: 0.45 },
  { path: "/privacy", priority: 0.3 },
  { path: "/terms", priority: 0.3 },
  { path: "/refund-policy", priority: 0.3 },
  { path: "/data-deletion", priority: 0.25 },
];

// No lastModified: stamping every build as "now" teaches Google to ignore the field.
export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: absoluteUrl(route.path),
    changeFrequency: route.path === "/" ? "weekly" : "monthly",
    priority: route.priority,
  }));
}
