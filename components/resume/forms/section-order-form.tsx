'use client';

import { ResumeSectionKey } from '@/lib/types/resume';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from '@/components/ui/icons';
import { useMemo, useState } from 'react';

interface SectionOrderFormProps {
  order: ResumeSectionKey[];
  onChange: (nextOrder: ResumeSectionKey[]) => void;
}

const SECTION_LABELS: Record<ResumeSectionKey, string> = {
  summary: 'Summary',
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  languages: 'Languages',
  certifications: 'Certifications',
  awards: 'Awards',
  websites: 'Websites',
  references: 'References',
  hobbies: 'Hobbies',
  custom: 'Custom Sections',
};

export function SectionOrderForm({ order, onChange }: SectionOrderFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draggedKey, setDraggedKey] = useState<ResumeSectionKey | null>(null);

  const visibleOrder = useMemo(() => order, [order]);

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= visibleOrder.length || fromIndex === toIndex) return;
    const next = [...visibleOrder];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    onChange(next);
  };

  const moveByDirection = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    moveItem(index, targetIndex);
  };

  return (
    <div className="rounded-lg border bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div>
          <h3 className="font-semibold">Section Order</h3>
          <p className="text-xs text-muted-foreground">Drag sections or use arrows to reorder resume flow.</p>
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {isOpen && (
        <div className="border-t p-3">
          <div className="space-y-2">
            {visibleOrder.map((key, index) => (
              <div
                key={key}
                draggable
                onDragStart={() => setDraggedKey(key)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (!draggedKey || draggedKey === key) return;
                  const fromIndex = visibleOrder.indexOf(draggedKey);
                  const toIndex = visibleOrder.indexOf(key);
                  moveItem(fromIndex, toIndex);
                  setDraggedKey(null);
                }}
                onDragEnd={() => setDraggedKey(null)}
                className="flex items-center justify-between rounded-md border bg-background px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="cursor-grab text-sm text-muted-foreground">::</span>
                  <span className="text-sm font-medium">{SECTION_LABELS[key]}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => moveByDirection(index, 'up')}
                    disabled={index === 0}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => moveByDirection(index, 'down')}
                    disabled={index === visibleOrder.length - 1}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

