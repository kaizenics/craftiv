import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

const routes = [
  { path: "/", priority: 1 },
  { path: "/resume/templates", priority: 0.95 },
  { path: "/resume/upload", priority: 0.8 },
  { path: "/cover-letter/templates", priority: 0.8 },
  { path: "/pricing", priority: 0.75 },
  { path: "/contact", priority: 0.45 },
  { path: "/privacy", priority: 0.3 },
  { path: "/terms", priority: 0.3 },
  { path: "/refund-policy", priority: 0.3 },
  { path: "/data-deletion", priority: 0.25 },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return routes.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified,
    changeFrequency: route.path === "/" ? "weekly" : "monthly",
    priority: route.priority,
  }));
}
