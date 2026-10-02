"use client";

import { useEffect, useMemo } from "react";

import type { ResumeDataJSON } from "@/db/schema";
import { SharedPageShell } from "@/components/share/shared-page-shell";
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
    <SharedPageShell>
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
    </SharedPageShell>
  );
}
