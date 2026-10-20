"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, Check, Copy, Sparkles } from "@/components/ui/icons";
import { trpc } from "@/trpc/client";

type ApplyAssistDialogProps = {
  matchId: string | null;
  jobLabel: string;
  alreadyApplied: boolean;
  onOpenChange: (open: boolean) => void;
  /** No tailored letter yet: hand over to the Tailor dialog. */
  onTailor: () => void;
  /** Called when the user opens the application page. */
  onApplied: () => void;
};

/**
 * Apply in three steps the user stays in control of: copy the tailored letter,
 * open the job's own apply page, and Craftiv marks it Applied. Each step is a
 * real click, so browsers allow both the clipboard write and the new tab.
 */
export function ApplyAssistDialog({ matchId, jobLabel, alreadyApplied, onOpenChange, onTailor, onApplied }: ApplyAssistDialogProps) {
  const [copied, setCopied] = useState(false);
  const kit = trpc.jobHunter.applyKit.useQuery({ matchId: matchId ?? "" }, { enabled: !!matchId });
  const letter = kit.data?.coverLetter ?? null;
  const applyUrl = kit.data?.applyUrl ?? null;

  const copy = () => {
    if (!letter) return;
    navigator.clipboard?.writeText(letter).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      },
      () => {},
    );
  };

  return (
    <Dialog open={!!matchId} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Apply to {jobLabel}</DialogTitle>
          <DialogDescription>
            Copy your tailored cover letter, paste it on the job page, and Craftiv tracks it for you.
          </DialogDescription>
        </DialogHeader>

        {kit.isLoading ? (
          <Skeleton className="h-56 w-full rounded-xl" />
        ) : !letter ? (
          <div className="space-y-4">
            <p className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              This job has no tailored cover letter yet. Tailor it first: you get a resume rewritten for this
              role and a matching letter, ready to paste here.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={onTailor}>
                <Sparkles className="size-4" aria-hidden="true" />
                Tailor this job first
              </Button>
              {applyUrl ? (
                <Button variant="outline" asChild>
                  <a href={applyUrl} target="_blank" rel="noopener noreferrer nofollow" onClick={onApplied}>
                    Apply without a letter
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        ) : (
          <ol className="space-y-5">
            <li>
              <p className="text-sm font-medium text-foreground">1. Copy your cover letter</p>
              <textarea
                readOnly
                value={letter}
                aria-label="Tailored cover letter"
                className="mt-2 h-48 w-full resize-y rounded-xl border border-border bg-muted/30 p-3 text-sm leading-relaxed text-foreground"
              />
              <Button variant="outline" className="mt-2" onClick={copy}>
                {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
                {copied ? "Copied" : "Copy letter"}
              </Button>
            </li>
            <li>
              <p className="text-sm font-medium text-foreground">2. Open the job and paste it in</p>
              {applyUrl ? (
                <Button asChild className="mt-2">
                  <a href={applyUrl} target="_blank" rel="noopener noreferrer nofollow" onClick={onApplied}>
                    Open application page
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </a>
                </Button>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">This job has no link. Send the letter the way the advert asks.</p>
              )}
            </li>
            <li>
              <p className="text-sm font-medium text-foreground">3. Tracked for you</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {alreadyApplied
                  ? "This job is marked Applied on your board."
                  : "Opening the job moves it to Applied on your board, so you can follow up on time."}
              </p>
            </li>
          </ol>
        )}
      </DialogContent>
    </Dialog>
  );
}
