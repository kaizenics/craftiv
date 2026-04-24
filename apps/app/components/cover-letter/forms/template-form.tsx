"use client";

import { coverLetterTemplates } from "@/lib/cover-letter-templates";
import type { CoverLetterTemplateId } from "@/lib/types/cover-letter";
import { cn } from "@/lib/utils";

interface TemplateFormProps {
  selectedTemplateId: CoverLetterTemplateId;
  onChange: (templateId: CoverLetterTemplateId) => void;
}

export function TemplateForm({ selectedTemplateId, onChange }: TemplateFormProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-lg font-bold text-foreground">Template</h2>
        <p className="text-sm text-muted-foreground">
          Choose the cover letter format you want to use.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {coverLetterTemplates.map((template) => {
          const isSelected = template.id === selectedTemplateId;

          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onChange(template.id)}
              className={cn(
                "rounded-xl border p-4 text-left transition-all",
                isSelected
                  ? "border-zinc-900 bg-zinc-50 shadow-sm dark:border-zinc-200 dark:bg-zinc-900"
                  : "border-border bg-card hover:border-zinc-400/70 hover:bg-zinc-50/70 dark:hover:bg-zinc-900/70"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-foreground">{template.name}</p>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-medium",
                    isSelected
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {template.badge}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {template.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
