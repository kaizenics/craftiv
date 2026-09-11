import ResumeUploadPageClient from "./client";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Import Your Resume",
  description:
    "Upload an existing PDF or Word resume and Craftiv fills in the builder for you, ready to restyle with an ATS-friendly template.",
  path: "/resume/upload",
});

export default function ResumeUploadPage() {
  return <ResumeUploadPageClient />;
}
