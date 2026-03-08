'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ResumePreview } from '@/components/resume/resume-preview';
import { createSampleResumeForTemplate } from '@/lib/data/templates';

const A4_WIDTH_PX = (210 / 25.4) * 96;
const A4_HEIGHT_PX = (297 / 25.4) * 96;

interface TemplateLivePreviewProps {
  templateId: string;
  color: string;
  showPhoto?: boolean;
}

export function TemplateLivePreview({ templateId, color, showPhoto = false }: TemplateLivePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.2);

  const sampleData = useMemo(
    () => createSampleResumeForTemplate(templateId, showPhoto),
    [templateId, showPhoto]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateScale = () => {
      const { width, height } = container.getBoundingClientRect();
      if (!width || !height) return;

      const nextScale = Math.min(width / A4_WIDTH_PX, height / A4_HEIGHT_PX);
      setScale(Math.max(0.05, nextScale));
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
          data={sampleData}
          customColor={color}
          showPhoto={showPhoto}
          showScore={false}
          showFooter={false}
          plain
        />
      </div>
    </div>
  );
}
