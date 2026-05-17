"use client";

import { Button } from "@/components/ui/button";

type ContentQualityTabProps = {
  stats: { complete: number; total: number };
  onOpenAssistant: () => void;
  onOpenAts: () => void;
  onRunSpellCheck: () => void;
};

export function ContentQualityTab({
  stats,
  onOpenAssistant,
  onOpenAts,
  onRunSpellCheck,
}: ContentQualityTabProps) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl sm:text-2xl font-bold">
        Content Quality
      </h2>
      <p className="text-xs sm:text-sm text-muted-foreground">
        Run quick quality checks and jump into AI tools for targeted improvements.
      </p>
      <div className="border-b pb-4" />

      <div className="rounded-lg border bg-card p-3">
        <p className="text-sm font-medium">Core completeness</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {stats.complete}/{stats.total} core sections filled
        </p>
      </div>

      <div className="space-y-2">
        <Button className="w-full" onClick={onOpenAssistant}>
          Open AI Resume Assistant
        </Button>
        <Button className="w-full" variant="outline" onClick={onOpenAts}>
          Open ATS Checker
        </Button>
        <Button className="w-full" variant="outline" onClick={onRunSpellCheck}>
          Run Spell Check
        </Button>
      </div>
    </div>
  );
}

