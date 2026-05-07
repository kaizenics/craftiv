import ResumeUploadPageClient from "./client";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Upload Resume for AI Review",
  description:
    "Upload an existing resume to Craftiv, scan your content, and turn it into a cleaner ATS-friendly resume template.",
  path: "/resume/upload",
});

export default function ResumeUploadPage() {
  return <ResumeUploadPageClient />;
}
