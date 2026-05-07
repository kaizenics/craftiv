import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Finalize Resume",
  description: "Review and download your Craftiv resume.",
  path: "/resume/final-resume",
  noIndex: true,
});

export default function FinalResumeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
