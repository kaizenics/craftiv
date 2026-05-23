'use client';

import { useEffect, useRef, useState } from 'react';
import { ResumePreview } from '@/components/resume/resume-preview';
import { templates } from '@/lib/data/templates';
import { DEFAULT_SECTION_ORDER, normalizeSectionOrder, type ResumeData } from '@/lib/types/resume';
import type { ResumeDataJSON } from '@/db/schema';

const A4_WIDTH_PX = (210 / 25.4) * 96;
const A4_HEIGHT_PX = (297 / 25.4) * 96;

interface ResumeCardPreviewProps {
  templateId: string;
  data?: ResumeDataJSON | null;
}

export function ResumeCardPreview({ templateId, data }: ResumeCardPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.15);

  const template = templates.find((t) => t.id === templateId);
  const color = template?.primaryColor ?? '#374151';

  const resumeData: ResumeData = {
    templateId,
    contact: data?.contact ?? { firstName: '', lastName: '', desiredJobTitle: '', phone: '', email: '' },
    experiences: data?.experiences ?? [],
    educations: data?.educations ?? [],
    skills: data?.skills ?? [],
    summary: data?.summary ?? '',
    sectionOrder: normalizeSectionOrder(data?.sectionOrder ?? DEFAULT_SECTION_ORDER),
    finalize: data?.finalize ?? {
      languages: [],
      certifications: [],
      awards: [],
      websites: [],
      references: [],
      hobbies: [],
      customSections: [],
    },
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateScale = () => {
      const { width, height } = container.getBoundingClientRect();
      if (!width || !height) return;
      const fitScale = Math.min(width / A4_WIDTH_PX, height / A4_HEIGHT_PX);
      setScale(Math.max(0.05, fitScale * 0.98));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="flex h-full w-full items-start justify-center overflow-hidden bg-white">
      <div
        className="relative overflow-hidden"
        style={{
          pointerEvents: "none",
          width: `${A4_WIDTH_PX * scale}px`,
          height: `${A4_HEIGHT_PX * scale}px`,
        }}
      >
        <div
          style={{
            width: `${A4_WIDTH_PX}px`,
            height: `${A4_HEIGHT_PX}px`,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <ResumePreview
            data={resumeData}
            customColor={color}
            showPhoto={false}
            showScore={false}
            showFooter={false}
            plain
          />
        </div>
      </div>
    </div>
  );
}
