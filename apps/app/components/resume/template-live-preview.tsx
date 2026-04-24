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
      // Use layout size (clientWidth/clientHeight) so 3D transforms from CardSwap
      // do not shrink the measured dimensions for back cards.
      const width = container.clientWidth;
      const height = container.clientHeight;
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
    <div
      ref={containerRef}
      className="flex h-full w-full items-start justify-center overflow-hidden bg-white"
    >
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
            data={sampleData}
            customColor={color}
            showPhoto={showPhoto}
            showScore={false}
            showFooter={false}
            plain
          />
        </div>
      </div>
    </div>
  );
}
