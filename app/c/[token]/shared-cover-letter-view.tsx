"use client";

import { useEffect } from "react";

import { CoverLetterPreview } from "@/components/cover-letter/cover-letter-preview";
import { SharedPageShell } from "@/components/share/shared-page-shell";
import type { CoverLetterData } from "@/lib/types/cover-letter";

export function SharedCoverLetterView({ token, data }: { token: string; data: CoverLetterData }) {
  // Count this view. Fire-and-forget: a failed count must never break the page.
  useEffect(() => {
    void fetch(`/api/share/${token}/view?kind=coverLetter`, {
      method: "POST",
      keepalive: true,
    }).catch(() => {});
  }, [token]);

  return (
    <SharedPageShell>
      {/* The preview draws its own page and shadow; wrapping it adds side margins. */}
      <CoverLetterPreview data={data} />
    </SharedPageShell>
  );
}
