"use client";

import { useState } from "react";

import type { ComboboxResume } from "@/components/dashboard/resume-combobox";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "@/components/ui/icons";
import { bandStyle } from "@/lib/ats-display";
import { cn } from "@/lib/utils";

export type ResumeComparisonResult = {
  posting: { title: string; company: string };
  comparisons: Array<{
    resumeId: string;
    resumeTitle: string;
    error?: string;
    score?: number;
    matchedKeywords?: string[];
    missingKeywords?: string[];
    weakestSection?: { section: string; score: number; notes: string };
  }>;
};

type ResumeComparisonDialogProps = {
  open: boolean;
  matchResumeId: string;
  resumes: ComboboxResume[];
  pending: boolean;
  result: ResumeComparisonResult | null;
  onOpenChange: (open: boolean) => void;
  onCompare: (resumeIds: string[]) => void;
};

export function ResumeComparisonDialog({
  open,
  matchResumeId,
  resumes,
  pending,
  result,
  onOpenChange,
  onCompare,
}: ResumeComparisonDialogProps) {
  const initialIds = [
    matchResumeId,
    ...resumes.filter((resume) => resume.id !== matchResumeId).map((resume) => resume.id),
  ].slice(0, Math.min(3, resumes.length));
  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds);

  function toggleResume(resumeId: string, checked: boolean) {
    setSelectedIds((current) => {
      if (checked) return current.length >= 5 ? current : [...current, resumeId];
      return current.filter((id) => id !== resumeId);
    });
  }

  const successful = result?.comparisons.filter((item) => item.score !== undefined) ?? [];
  const bestScore = successful.reduce((best, item) => Math.max(best, item.score ?? 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Compare resumes</DialogTitle>
          <DialogDescription>
            Score the same job against two to five resumes. Comparison is free and does not add duplicate pipeline cards.
          </DialogDescription>
        </DialogHeader>

        <fieldset>
          <legend className="text-sm font-medium">Choose resumes</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {resumes.map((resume) => {
              const checked = selectedIds.includes(resume.id);
              const disabled = !checked && selectedIds.length >= 5;
              return (
                <label
                  key={resume.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2.5",
                    checked && "border-primary bg-primary/5",
                    disabled && "cursor-not-allowed opacity-50",
                  )}
                >
                  <Checkbox
                    checked={checked}
                    disabled={disabled || pending}
                    onCheckedChange={(value) => toggleResume(resume.id, value === true)}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{resume.title}</span>
                    <span className="text-xs capitalize text-muted-foreground">{resume.status}</span>
                  </span>
                </label>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{selectedIds.length} of 5 selected</p>
        </fieldset>

        {result ? (
          <section aria-label="Resume comparison results">
            <div className="mb-3">
              <h3 className="text-sm font-semibold">{result.posting.title}</h3>
              {result.posting.company ? (
                <p className="text-xs text-muted-foreground">{result.posting.company}</p>
              ) : null}
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {result.comparisons.map((comparison) => {
                const band = bandStyle(comparison.score ?? 0);
                const isBest = comparison.score !== undefined && comparison.score === bestScore;
                return (
                  <article key={comparison.resumeId} className="rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="truncate text-sm font-semibold">{comparison.resumeTitle}</h4>
                        {isBest ? <p className="text-xs font-medium text-success-surface-foreground">Best match</p> : null}
                      </div>
                      {comparison.score !== undefined ? (
                        <span className={cn("rounded-md border px-2 py-1 text-sm font-semibold tabular-nums", band.surface, band.border, band.text)}>
                          {comparison.score}
                        </span>
                      ) : null}
                    </div>

                    {comparison.error ? (
                      <p className="mt-3 text-xs text-destructive-surface-foreground">{comparison.error}</p>
                    ) : (
                      <dl className="mt-3 space-y-2 text-xs">
                        <div className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">Matched keywords</dt>
                          <dd className="font-medium">{comparison.matchedKeywords?.length ?? 0}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">Missing keywords</dt>
                          <dd className="font-medium">{comparison.missingKeywords?.length ?? 0}</dd>
                        </div>
                        {comparison.weakestSection ? (
                          <div className="border-t border-border pt-2">
                            <dt className="text-muted-foreground">Weakest area</dt>
                            <dd className="mt-0.5 font-medium">
                              {comparison.weakestSection.section} ({comparison.weakestSection.score})
                            </dd>
                            <dd className="mt-1 leading-4 text-muted-foreground">{comparison.weakestSection.notes}</dd>
                          </div>
                        ) : null}
                      </dl>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            onClick={() => onCompare(selectedIds)}
            disabled={selectedIds.length < 2 || pending}
          >
            {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            {pending ? "Comparing..." : "Compare selected"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
