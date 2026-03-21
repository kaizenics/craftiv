'use client';

import { useEffect, useRef, useState } from 'react';
import { ResumePreview } from '@/components/resume/resume-preview';
import { templates } from '@/lib/data/templates';
import type { ResumeData } from '@/lib/types/resume';
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
      setScale(Math.max(0.05, Math.min(width / A4_WIDTH_PX, height / A4_HEIGHT_PX)));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="h-full w-full overflow-hidden bg-white">
      <div
        className="origin-top"
        style={{
          position: 'relative',
          left: '50%',
          pointerEvents: 'none',
          width: `${A4_WIDTH_PX}px`,
          height: `${A4_HEIGHT_PX}px`,
          transform: `translateX(-50%) scale(${scale})`,
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
  );
}
