"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "@/components/ui/icons";
import type { DesignOptions } from "@/components/resume/resume-preview";

const fontFamilies = [
  { name: "Inter", value: "Inter, system-ui, sans-serif" },
  { name: "Roboto", value: "Roboto, system-ui, sans-serif" },
  { name: "Open Sans", value: '"Open Sans", system-ui, sans-serif' },
  { name: "Lato", value: "Lato, system-ui, sans-serif" },
  { name: "Montserrat", value: "Montserrat, system-ui, sans-serif" },
  { name: "Poppins", value: "Poppins, system-ui, sans-serif" },
  { name: "Source Sans Pro", value: '"Source Sans Pro", system-ui, sans-serif' },
  { name: "Nunito", value: "Nunito, system-ui, sans-serif" },
  { name: "Raleway", value: "Raleway, system-ui, sans-serif" },
  { name: "Merriweather", value: "Merriweather, Georgia, serif" },
];

type DesignTabProps = {
  designOptions: DesignOptions;
  onChange: (next: DesignOptions) => void;
  onReset: () => void;
};

export function DesignTab({ designOptions, onChange, onReset }: DesignTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl sm:text-2xl font-bold">
          Design & Formatting
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="text-muted-foreground text-xs sm:text-sm"
        >
          <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
          Reset
        </Button>
      </div>
      <div className="border-b pb-4" />

      <div className="space-y-2">
        <Label>Font Family</Label>
        <Select
          value={designOptions.fontFamily}
          onValueChange={(value: string) =>
            onChange({ ...designOptions, fontFamily: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {fontFamilies.map((font) => (
              <SelectItem key={font.value} value={font.value}>
                <span style={{ fontFamily: font.value }}>{font.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm">Font Size</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={8}
            max={16}
            value={designOptions.fontSize}
            onChange={(e) =>
              onChange({
                ...designOptions,
                fontSize: parseInt(e.target.value, 10) || 11,
              })
            }
            className="w-16 sm:w-20 text-sm"
          />
          <span className="text-sm text-muted-foreground">pt</span>
          <Slider
            min={8}
            max={16}
            step={1}
            value={[designOptions.fontSize]}
            onValueChange={(value) =>
              onChange({
                ...designOptions,
                fontSize: value[0],
              })
            }
            className="flex-1"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm">Section Spacing</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={8}
            max={32}
            value={designOptions.sectionSpacing}
            onChange={(e) =>
              onChange({
                ...designOptions,
                sectionSpacing: parseInt(e.target.value, 10) || 16,
              })
            }
            className="w-16 sm:w-20 text-sm"
          />
          <span className="text-sm text-muted-foreground">px</span>
          <Slider
            min={8}
            max={32}
            step={1}
            value={[designOptions.sectionSpacing]}
            onValueChange={(value) =>
              onChange({
                ...designOptions,
                sectionSpacing: value[0],
              })
            }
            className="flex-1"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm">Paragraph Spacing</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={4}
            max={24}
            value={designOptions.paragraphSpacing}
            onChange={(e) =>
              onChange({
                ...designOptions,
                paragraphSpacing: parseInt(e.target.value, 10) || 8,
              })
            }
            className="w-16 sm:w-20 text-sm"
          />
          <span className="text-sm text-muted-foreground">px</span>
          <Slider
            min={4}
            max={24}
            step={1}
            value={[designOptions.paragraphSpacing]}
            onValueChange={(value) =>
              onChange({
                ...designOptions,
                paragraphSpacing: value[0],
              })
            }
            className="flex-1"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm">Line Spacing</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={1}
            max={3}
            step={0.1}
            value={designOptions.lineSpacing}
            onChange={(e) =>
              onChange({
                ...designOptions,
                lineSpacing: parseFloat(e.target.value) || 1.5,
              })
            }
            className="w-16 sm:w-20 text-sm"
          />
          <Slider
            min={1}
            max={3}
            step={0.1}
            value={[designOptions.lineSpacing]}
            onValueChange={(value) =>
              onChange({
                ...designOptions,
                lineSpacing: value[0],
              })
            }
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
}

