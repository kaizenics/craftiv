"use client";

import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { CircleCheck } from "@/components/ui/icons";
import type { ResumeDataJSON } from "@/db/schema";
import { analyzeResumeWriting } from "@/lib/resume-hints";

type ContentQualityTabProps = {
  stats: { complete: number; total: number };
  resumeData: ResumeDataJSON;
  onOpenAssistant: () => void;
  onOpenAts: () => void;
  onRunSpellCheck: () => void;
};

// A one-page resume usually lands here; outside it, a short note rather than a warning.
const WORD_RANGE = { min: 250, max: 800 };

export function ContentQualityTab({
  stats,
  resumeData,
  onOpenAssistant,
  onOpenAts,
  onRunSpellCheck,
}: ContentQualityTabProps) {
  const { wordCount, hints } = useMemo(() => analyzeResumeWriting(resumeData), [resumeData]);

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl sm:text-2xl font-bold">
        Content Quality
      </h2>
      <p className="text-xs sm:text-sm text-muted-foreground">
        Run quick quality checks and jump into AI tools for targeted improvements.
      </p>
      <div className="border-b pb-4" />

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border bg-card p-3">
          <p className="text-sm font-medium">Core completeness</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {stats.complete}/{stats.total} core sections filled
          </p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <p className="text-sm font-medium tabular-nums">{wordCount} words</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {wordCount < WORD_RANGE.min
              ? "On the short side"
              : wordCount > WORD_RANGE.max
                ? "Long for one page"
                : "A good length"}
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-3">
        <p className="text-sm font-medium">Writing hints</p>
        {hints.length === 0 ? (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CircleCheck className="size-3.5 text-success-surface-foreground" aria-hidden="true" />
            No issues found in your summary or experience.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {hints.map((hint, index) => (
              <li key={index} className="text-xs leading-relaxed">
                <span className="font-medium text-foreground">{hint.where}:</span>{" "}
                <span className="text-muted-foreground">{hint.message}</span>
              </li>
            ))}
          </ul>
        )}
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
