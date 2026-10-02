import { cache } from "react";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { resumes } from "@/db/schema";
import { createPageMetadata } from "@/lib/seo";
import { isValidShareToken } from "@/lib/share";
import { SharedResumeView } from "./shared-resume-view";

// Always read fresh: the owner can switch sharing off at any time.
export const dynamic = "force-dynamic";

const loadSharedResume = cache(async (token: string) => {
  if (!isValidShareToken(token)) return null;
  return db.query.resumes.findFirst({
    columns: { title: true, templateId: true, data: true },
    where: and(eq(resumes.shareToken, token), eq(resumes.shareEnabled, true)),
  });
});

type PageProps = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { token } = await params;
  const resume = await loadSharedResume(token);
  const contact = resume?.data?.contact;
  const name = [contact?.firstName, contact?.lastName].filter(Boolean).join(" ");
  return createPageMetadata({
    title: name ? `${name} — Resume` : "Shared resume",
    description: contact?.desiredJobTitle
      ? `${name || "A candidate"}, ${contact.desiredJobTitle}. Made with Craftiv.`
      : "A resume made with Craftiv.",
    path: `/r/${token}`,
    // Shared resumes hold personal details; keep them out of search results.
    noIndex: true,
  });
}

export default async function SharedResumePage({ params }: PageProps) {
  const { token } = await params;
  const resume = await loadSharedResume(token);
  if (!resume?.data) notFound();

  return (
    <SharedResumeView
      token={token}
      templateId={resume.data.templateId ?? resume.templateId}
      data={resume.data}
    />
  );
}
