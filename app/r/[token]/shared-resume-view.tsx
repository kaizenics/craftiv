"use client";

import { useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";

import type { ResumeDataJSON } from "@/db/schema";
import {
  defaultDesignOptions,
  ResumePreview,
  type DesignOptions,
} from "@/components/resume/resume-preview";
import {
  createEmptyResumeData,
  normalizeSectionOrder,
  type ResumeData,
} from "@/lib/types/resume";

export function SharedResumeView({
  token,
  templateId,
  data,
}: {
  token: string;
  templateId: string;
  data: ResumeDataJSON;
}) {
  const { resumeData, designOptions, color, showPhoto } = useMemo(() => {
    const { design, ...content } = data as ResumeData;
    const merged: ResumeData = {
      ...createEmptyResumeData(templateId),
      ...content,
      templateId,
      sectionOrder: normalizeSectionOrder(content.sectionOrder),
    };
    const options: DesignOptions = design
      ? {
          fontFamily: design.fontFamily,
          fontSize: design.fontSize,
          sectionSpacing: design.sectionSpacing,
          paragraphSpacing: design.paragraphSpacing,
          lineSpacing: design.lineSpacing,
        }
      : defaultDesignOptions;
    return {
      resumeData: merged,
      designOptions: options,
      color: design?.color,
      showPhoto: design?.showPhoto ?? false,
    };
  }, [data, templateId]);

  // Count this view. Fire-and-forget: a failed count must never break the page.
  useEffect(() => {
    void fetch(`/api/share/${token}/view`, { method: "POST", keepalive: true }).catch(() => {});
  }, [token]);

  return (
    <div className="min-h-screen bg-zinc-100 font-sans">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/craftiv.png" alt="Craftiv" width={28} height={28} className="h-7 w-7" />
            <span className="text-sm font-semibold text-zinc-900">Craftiv</span>
          </Link>
          <Link
            href="/resume/templates"
            className="inline-flex items-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          >
            Make your own resume
          </Link>
        </div>
      </header>

      <main className="overflow-x-auto px-4 py-8">
        <div className="mx-auto w-fit rounded-sm bg-white shadow-xl">
          <ResumePreview
            data={resumeData}
            designOptions={designOptions}
            customColor={color}
            showPhoto={showPhoto}
            showScore={false}
            showFooter={false}
            renderAllPages
            plain
          />
        </div>
      </main>
    </div>
  );
}
