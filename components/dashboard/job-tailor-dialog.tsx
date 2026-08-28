"use client";

import Link from "next/link";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AtsImpactSummary } from "@/components/dashboard/ats-impact-summary";
import { AiSuggestionBlock } from "@/components/dashboard/ai-suggestion-block";
import { AlertCircle, ArrowUpRight, Loader2, Sparkles } from "@/components/ui/icons";
import { formatCreditValue, JOB_TAILOR_COST } from "@/lib/credit-costs";
import type { AtsImpact } from "@/lib/ats";

export type TailorTone = "professional" | "confident" | "enthusiastic";

export type TailorOutcome =
  | {
      accepted: true;
      impact: AtsImpact;
      changes: { label: string; before: string; after: string }[];
      summaryOfChanges: string[];
      tailoredResumeId: string;
      tailoredCoverLetterId: string | null;
    }
  | { accepted: false; impact: AtsImpact; message: string };

type JobTailorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobLabel: string;
  tone: TailorTone;
  onToneChange: (tone: TailorTone) => void;
  pending: boolean;
  outcome: TailorOutcome | null;
  savingKind: "resume" | "cover_letter" | null;
  savedKinds: ("resume" | "cover_letter")[];
  onRun: () => void;
  onSave: (kind: "resume" | "cover_letter") => void;
};

export function JobTailorDialog({
  open,
  onOpenChange,
  jobLabel,
  tone,
  onToneChange,
  pending,
  outcome,
  savingKind,
  savedKinds,
  onRun,
  onSave,
}: JobTailorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tailor for this job</DialogTitle>
          <DialogDescription>
            Rewrites your resume for {jobLabel} and writes a matching cover letter.
          </DialogDescription>
        </DialogHeader>

        {!outcome ? (
          <div className="space-y-4">
            <div>
              <label htmlFor="tailor-tone" className="text-sm font-medium">
                Cover letter tone
              </label>
              <Select
                value={tone}
                onValueChange={(value) => onToneChange(value as TailorTone)}
                disabled={pending}
              >
                <SelectTrigger id="tailor-tone" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="confident">Confident</SelectItem>
                  <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Stating the guarantee up front, because it is the reason this is
                worth paying for: the score cannot go down. */}
            <p className="flex gap-2 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                Your resume is re-scored afterwards. If the rewrite does not improve your match,
                nothing is saved and your credits are returned.
              </span>
            </p>

            <Button onClick={onRun} disabled={pending} className="w-full">
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Tailoring...
                </>
              ) : (
                <>
                  <Sparkles className="size-4" aria-hidden="true" />
                  Tailor — {formatCreditValue(JOB_TAILOR_COST)} credits
                </>
              )}
            </Button>
          </div>
        ) : !outcome.accepted ? (
          <div className="space-y-4">
            <AtsImpactSummary impact={outcome.impact} />
            <p className="rounded-lg border border-warning-border bg-warning-surface p-3 text-sm text-warning-surface-foreground">
              {outcome.message}
            </p>
            <Button variant="outline" onClick={onRun} disabled={pending} className="w-full">
              Try again
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <AtsImpactSummary impact={outcome.impact} />

            {outcome.summaryOfChanges.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {outcome.summaryOfChanges.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : null}

            {outcome.changes.map((change) => (
              <AiSuggestionBlock
                key={change.label}
                label={change.label}
                before={change.before}
                after={change.after}
              />
            ))}

            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
              <Button
                variant="outline"
                onClick={() => onSave("resume")}
                disabled={savingKind !== null || savedKinds.includes("resume")}
              >
                {savingKind === "resume" ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : null}
                {savedKinds.includes("resume") ? "Resume saved" : "Save resume to documents"}
              </Button>

              {outcome.tailoredCoverLetterId ? (
                <Button
                  variant="outline"
                  onClick={() => onSave("cover_letter")}
                  disabled={savingKind !== null || savedKinds.includes("cover_letter")}
                >
                  {savingKind === "cover_letter" ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : null}
                  {savedKinds.includes("cover_letter")
                    ? "Cover letter saved"
                    : "Save cover letter"}
                </Button>
              ) : null}

              {savedKinds.length > 0 ? (
                <Button variant="ghost" asChild>
                  <Link href="/dashboard/documents/resume">
                    Open documents
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
