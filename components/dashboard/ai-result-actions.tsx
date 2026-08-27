"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Check, Copy, Loader2, RefreshCw } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

type AiResultActionsProps = {
  onApply: () => void;
  applyDisabled: boolean;
  applyLabel: string;
  isApplying: boolean;
  applied: boolean;
  appliedMessage: string;
  onCopy: () => void;
  copied: boolean;
  onRegenerate: () => void;
  isGenerating: boolean;
  credits: string;
  /** Shown under the buttons when apply is blocked by an empty selection. */
  blockedReason?: string | null;
};

/** Apply / Copy / Regenerate, shared by the Improver and Achievement Builder. */
export function AiResultActions({
  onApply,
  applyDisabled,
  applyLabel,
  isApplying,
  applied,
  appliedMessage,
  onCopy,
  copied,
  onRegenerate,
  isGenerating,
  credits,
  blockedReason,
}: AiResultActionsProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={onApply} disabled={applyDisabled}>
          {isApplying ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              Applying...
            </>
          ) : applied ? (
            <>
              <Check aria-hidden="true" />
              Applied
            </>
          ) : (
            applyLabel
          )}
        </Button>

        <Button variant="outline" onClick={onCopy}>
          {copied ? (
            <>
              <Check aria-hidden="true" />
              Copied
            </>
          ) : (
            <>
              <Copy aria-hidden="true" />
              Copy
            </>
          )}
        </Button>

        {/* Regenerate spends another credit, so the cost is on the button. */}
        <Button variant="outline" onClick={onRegenerate} disabled={isGenerating}>
          <RefreshCw className={cn(isGenerating && "animate-spin")} aria-hidden="true" />
          Regenerate &middot; {credits} credits
        </Button>
      </div>

      {blockedReason && <p className="text-sm text-muted-foreground">{blockedReason}</p>}

      {applied && (
        <p className="text-sm text-muted-foreground">
          {appliedMessage}{" "}
          <Link
            href="/dashboard/documents/resume"
            className="rounded-sm text-foreground underline underline-offset-2 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            View in Documents
          </Link>
          .
        </p>
      )}
    </div>
  );
}
