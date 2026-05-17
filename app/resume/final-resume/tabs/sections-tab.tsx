"use client";

import { Button } from "@/components/ui/button";
import { Check } from "@/components/ui/icons";

type ActiveSection = {
  id: string;
  label: string;
  active: boolean;
};

type SectionsTabProps = {
  sections: ActiveSection[];
  onEditSections: () => void;
};

export function SectionsTab({ sections, onEditSections }: SectionsTabProps) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl sm:text-2xl font-bold">Sections</h2>
      <p className="text-xs sm:text-sm text-muted-foreground">
        These are the sections included in your resume based on the information
        you provided.
      </p>
      <div className="border-b pb-4" />

      <div className="space-y-2">
        {sections.map((section) => (
          <div
            key={section.id}
            className="flex items-center gap-3 p-3 border rounded-lg bg-card"
          >
            <div className="h-8 w-8 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <Check className="h-4 w-4 text-zinc-900 dark:text-zinc-100" />
            </div>
            <span className="font-medium">{section.label}</span>
          </div>
        ))}
      </div>

      <Button variant="outline" className="w-full mt-4" onClick={onEditSections}>
        Edit Sections
      </Button>
    </div>
  );
}

