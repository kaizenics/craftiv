import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Cover Letter Builder",
  description: "Write, customize, and download cover letters in Craftiv.",
  path: "/cover-letter/write",
  noIndex: true,
});

export default function CoverLetterWriteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
