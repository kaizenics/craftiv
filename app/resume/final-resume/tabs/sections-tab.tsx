"use client";

import { Button } from "@/components/ui/button";
import { ResumeSectionKey } from "@/lib/types/resume";
import { useState } from "react";
import { cn } from "@/lib/utils";

type SectionsTabProps = {
  onEditSections: () => void;
  visibleSectionOrder: ResumeSectionKey[];
  onVisibleSectionOrderChange: (nextVisibleOrder: ResumeSectionKey[]) => void;
};

const SECTION_LABELS: Record<ResumeSectionKey, string> = {
  summary: "Summary",
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  languages: "Languages",
  certifications: "Certifications",
  awards: "Awards",
  websites: "Websites",
  references: "References",
  hobbies: "Hobbies",
  custom: "Custom Sections",
};

export function SectionsTab({
  onEditSections,
  visibleSectionOrder,
  onVisibleSectionOrderChange,
}: SectionsTabProps) {
  const [draggedKey, setDraggedKey] = useState<ResumeSectionKey | null>(null);
  const [dragOverKey, setDragOverKey] = useState<ResumeSectionKey | null>(null);

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= visibleSectionOrder.length || fromIndex === toIndex) return;
    const next = [...visibleSectionOrder];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    onVisibleSectionOrderChange(next);
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl sm:text-2xl font-bold">Sections</h2>
      <p className="text-xs sm:text-sm text-muted-foreground">
        Reorder the visible sections in your resume preview.
      </p>
      <div className="border-b pb-4" />

      <div className="mt-4">        
        <div className="space-y-2">
          {visibleSectionOrder.map((key) => (
            <div
              key={key}
              draggable
              onDragStart={() => setDraggedKey(key)}
              onDragOver={(event) => {
                event.preventDefault();
                if (draggedKey && draggedKey !== key) {
                  setDragOverKey(key);
                }
              }}
              onDrop={() => {
                if (!draggedKey || draggedKey === key) return;
                const fromIndex = visibleSectionOrder.indexOf(draggedKey);
                const toIndex = visibleSectionOrder.indexOf(key);
                moveItem(fromIndex, toIndex);
                setDraggedKey(null);
                setDragOverKey(null);
              }}
              onDragLeave={() => {
                if (dragOverKey === key) setDragOverKey(null);
              }}
              onDragEnd={() => {
                setDraggedKey(null);
                setDragOverKey(null);
              }}
              className={cn(
                "flex items-center justify-between rounded-md border bg-background px-3 py-2 transition-all cursor-grab",
                draggedKey === key && "opacity-45 scale-[0.98] bg-primary/10 shadow-md",
                dragOverKey === key && draggedKey !== key && "border-primary bg-primary/5"
              )}
            >
              <span className="text-sm font-medium">{SECTION_LABELS[key]}</span>
              <span
                className={cn(
                  "cursor-grab text-sm text-muted-foreground",
                  draggedKey === key && "text-primary"
                )}
                aria-hidden
              >
                ::
              </span>
            </div>
          ))}
        </div>
      </div>

      <Button variant="outline" className="w-full mt-4" onClick={onEditSections}>
        Edit Sections
      </Button>
    </div>
  );
}
