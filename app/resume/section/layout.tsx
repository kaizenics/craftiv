import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Resume Editor",
  description: "Edit resume sections in Craftiv.",
  path: "/resume/section",
  noIndex: true,
});

export default function ResumeSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
