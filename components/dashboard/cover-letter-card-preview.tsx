"use client";

import { useEffect, useRef, useState } from "react";
import { CoverLetterPreview } from "@/components/cover-letter/cover-letter-preview";
import type { CoverLetterData } from "@/lib/types/cover-letter";

const A4_WIDTH_PX = (210 / 25.4) * 96;
const A4_HEIGHT_PX = (297 / 25.4) * 96;

interface CoverLetterCardPreviewProps {
  data: CoverLetterData;
}

export function CoverLetterCardPreview({ data }: CoverLetterCardPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.15);

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
          <CoverLetterPreview
            data={data}
            className="h-full max-w-none rounded-none border-0 shadow-none"
          />
        </div>
      </div>
    </div>
  );
}
