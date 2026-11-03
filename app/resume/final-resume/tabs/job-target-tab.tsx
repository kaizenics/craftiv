"use client";

import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import type { ResumeDataJSON } from "@/db/schema";
import { analyzeResumeData } from "@/lib/ats";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type JobTargetTabProps = {
  role: string;
  description: string;
  onRoleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onUseInAssistant: () => void;
  onUseInAts: () => void;
  resumeData: ResumeDataJSON;
};

const MIN_DESCRIPTION = 80;

export function JobTargetTab({
  role,
  description,
  onRoleChange,
  onDescriptionChange,
  onUseInAssistant,
  onUseInAts,
  resumeData,
}: JobTargetTabProps) {
  // Same matching as the ATS checker, run locally; waits for enough text to hold real keywords.
  const keywords = useMemo(() => {
    if (description.trim().length < MIN_DESCRIPTION) return null;
    const report = analyzeResumeData(resumeData, description);
    return { matched: report.matchedKeywords, missing: report.missingKeywords };
  }, [resumeData, description]);

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl sm:text-2xl font-bold">Job Target</h2>
      <p className="text-xs sm:text-sm text-muted-foreground">
        Set your target role and job description to guide optimization.
      </p>
      <div className="border-b pb-4" />

      <div className="space-y-2">
        <Label htmlFor="job-target-role">Target Role</Label>
        <Input
          id="job-target-role"
          value={role}
          onChange={(e) => onRoleChange(e.target.value)}
          placeholder="e.g. Senior Frontend Engineer"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="job-target-description">Job Description</Label>
        <textarea
          id="job-target-description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={8}
          placeholder="Paste the target job description here..."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
      </div>

      {keywords ? (
        <div className="rounded-lg border bg-card p-3">
          <p className="text-sm font-medium">
            Keyword check{" "}
            <span className="font-normal tabular-nums text-muted-foreground">
              {keywords.matched.length}/{keywords.matched.length + keywords.missing.length} found
            </span>
          </p>
          {keywords.missing.length ? (
            <>
              <p className="mt-2 text-xs text-muted-foreground">Missing from your resume. Add the ones that are true for you:</p>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {keywords.missing.map((word) => (
                  <li key={word} className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
                    {word}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          {keywords.matched.length ? (
            <>
              <p className="mt-3 text-xs text-muted-foreground">Already covered:</p>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {keywords.matched.map((word) => (
                  <li key={word} className="rounded-md bg-success-surface px-2 py-0.5 text-xs font-medium text-success-surface-foreground">
                    {word}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          <p className="mt-3 text-xs text-muted-foreground">A quick word match. The ATS Checker scores structure, sections and impact too.</p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Paste a job description to see which of its keywords your resume already covers.</p>
      )}

      <div className="space-y-2">
        <Button className="w-full" onClick={onUseInAssistant}>
          Use in AI Resume Assistant
        </Button>
        <Button className="w-full" variant="outline" onClick={onUseInAts}>
          Use in ATS Checker
        </Button>
      </div>
    </div>
  );
}

