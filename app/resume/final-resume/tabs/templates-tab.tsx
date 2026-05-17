"use client";

import { Label } from "@/components/ui/label";
import { Check } from "@/components/ui/icons";
import { TemplateLivePreview } from "@/components/resume/template-live-preview";
import { resumeTemplates } from "@/lib/resume-templates";
import { cn } from "@/lib/utils";
import type { ResumeData } from "@/lib/types/resume";

type TemplatesTabProps = {
  resumeData: ResumeData;
  selectedColor: string;
  availableTemplateColors: string[];
  templateColors: string[];
  isColorLockedTemplate: boolean;
  onColorChange: (color: string) => void;
  onTemplateChange: (templateId: string) => void;
};

export function TemplatesTab({
  resumeData,
  selectedColor,
  availableTemplateColors,
  templateColors,
  isColorLockedTemplate,
  onColorChange,
  onTemplateChange,
}: TemplatesTabProps) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl sm:text-2xl font-bold">Templates</h2>
      <div className="border-b pb-4" />

      <div className="space-y-2">
        <Label className="text-sm font-medium">Template Color</Label>
        <div className="flex gap-2 items-center flex-wrap">
          {availableTemplateColors.map((color) => (
            <button
              key={color}
              onClick={() => onColorChange(color)}
              className={cn(
                "w-9 h-9 rounded-full border-2 transition-all hover:scale-110",
                selectedColor === color
                  ? "border-zinc-900 ring-2 ring-zinc-300 dark:border-zinc-100 dark:ring-zinc-700"
                  : "border-zinc-200 hover:border-zinc-400",
              )}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
          {!isColorLockedTemplate && (
            <div className="relative group">
              <label
                className={cn(
                  "w-9 h-9 rounded-full border-2 cursor-pointer flex items-center justify-center transition-all hover:scale-110",
                  !templateColors.includes(selectedColor)
                    ? "border-zinc-900 ring-2 ring-zinc-300 dark:border-zinc-100 dark:ring-zinc-700"
                    : "border-zinc-200 hover:border-zinc-400",
                )}
                style={{
                  backgroundColor: !templateColors.includes(selectedColor)
                    ? selectedColor
                    : "transparent",
                  backgroundImage: templateColors.includes(selectedColor)
                    ? "conic-gradient(from 90deg, red, yellow, lime, aqua, blue, magenta, red)"
                    : "none",
                }}
                title="Custom color"
              >
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => onColorChange(e.target.value)}
                  className="opacity-0 w-0 h-0 absolute"
                />
              </label>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Selected: {selectedColor}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {resumeTemplates.map((template) => (
          <button
            key={template.id}
            onClick={() => onTemplateChange(template.id)}
            className={cn(
              "relative aspect-3/4 border-2 rounded-lg overflow-hidden transition-all hover:shadow-lg text-left",
              resumeData.templateId === template.id
                ? "border-zinc-900 ring-2 ring-zinc-300 dark:border-zinc-100 dark:ring-zinc-700"
                : "border-gray-200 hover:border-gray-300",
            )}
          >
            <div className="absolute inset-0 text-left">
              <TemplateLivePreview
                templateId={template.id}
                color={
                  resumeData.templateId === template.id
                    ? selectedColor
                    : template.primaryColor
                }
              />
            </div>
            {resumeData.templateId === template.id && (
              <div className="absolute top-1 right-1 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-full p-0.5">
                <Check className="h-3 w-3" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
