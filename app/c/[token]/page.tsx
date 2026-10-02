import { cache } from "react";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { coverLetters } from "@/db/schema";
import { createPageMetadata } from "@/lib/seo";
import { isValidShareToken } from "@/lib/share";
import { normalizeCoverLetterData, type CoverLetterData } from "@/lib/types/cover-letter";
import { SharedCoverLetterView } from "./shared-cover-letter-view";

// Always read fresh: the owner can switch sharing off at any time.
export const dynamic = "force-dynamic";

const loadSharedCoverLetter = cache(async (token: string) => {
  if (!isValidShareToken(token)) return null;
  const row = await db.query.coverLetters.findFirst({
    columns: { data: true },
    where: and(eq(coverLetters.shareToken, token), eq(coverLetters.shareEnabled, true)),
  });
  return row ? normalizeCoverLetterData(row.data as Partial<CoverLetterData>) : null;
});

type PageProps = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { token } = await params;
  const letter = await loadSharedCoverLetter(token);
  const name = [letter?.contact.firstName, letter?.contact.lastName].filter(Boolean).join(" ");
  const company = letter?.employer.companyName;
  return createPageMetadata({
    title: name ? `${name} — Cover letter` : "Shared cover letter",
    description: company
      ? `Cover letter for ${company}. Made with Craftiv.`
      : "A cover letter made with Craftiv.",
    path: `/c/${token}`,
    // Cover letters hold personal details; keep them out of search results.
    noIndex: true,
  });
}

export default async function SharedCoverLetterPage({ params }: PageProps) {
  const { token } = await params;
  const letter = await loadSharedCoverLetter(token);
  if (!letter) notFound();

  return <SharedCoverLetterView token={token} data={letter} />;
}
