"use client";

import { AlertTriangle, ArrowRight, Check, Target } from "@/components/ui/icons";
import type { AtsImpact } from "@/lib/ats";
import { bandStyle, bandStyleFor } from "@/lib/ats-display";
import { cn } from "@/lib/utils";

type AtsImpactSummaryProps = {
  impact: AtsImpact | null;
};

/**
 * Projected score change for a generated rewrite.
 *
 * Shares the band scale with the ATS Checker so the same number means the same
 * thing in both places, and states the direction in words as well as colour.
 */
export function AtsImpactSummary({ impact }: AtsImpactSummaryProps) {
  if (!impact) return null;

  const delta = impact.afterScore - impact.beforeScore;
  const direction = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  const deltaLabel = delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : "no change";
  const afterStyle = bandStyle(impact.afterScore);
  const blockedStyle = bandStyleFor("critical");

  return (
    <section
      aria-label="Projected ATS impact"
      className="space-y-3 rounded-xl border border-border bg-card p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Target className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            Projected ATS impact
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Scored with the same analyzer as the ATS Checker.
          </p>
        </div>

        <p className="flex items-center gap-2 text-sm">
          <span className="tabular-nums text-muted-foreground">{impact.beforeScore}</span>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          <span className={cn("font-semibold tabular-nums", afterStyle.text)}>
            {impact.afterScore}
          </span>
          <span
            className={cn(
              "rounded-4xl border px-2 py-0.5 text-xs font-semibold",
              direction === "up"
                ? "border-success-border bg-success-surface text-success-surface-foreground"
                : direction === "down"
                  ? "border-destructive-border bg-destructive-surface text-destructive-surface-foreground"
                  : "border-border bg-muted/60 text-muted-foreground"
            )}
          >
            {deltaLabel}
          </span>
        </p>
      </div>

      {impact.changedSections.length > 0 && (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Changed:</span>{" "}
          {impact.changedSections.join(", ")}
        </p>
      )}

      {impact.matchedKeywordsAdded.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-foreground">Newly matched keywords</p>
          <ul className="flex flex-wrap gap-2">
            {impact.matchedKeywordsAdded.map((keyword) => (
              <li
                key={keyword}
                className="inline-flex items-center gap-1.5 rounded-4xl border border-success-border bg-success-surface px-2.5 py-1 text-xs font-medium text-success-surface-foreground"
              >
                <Check className="h-3 w-3 shrink-0" aria-hidden="true" />
                {keyword}
              </li>
            ))}
          </ul>
        </div>
      )}

      {impact.warnings.length > 0 && (
        <div
          className={cn("rounded-lg border p-3", blockedStyle.border, blockedStyle.surface)}
        >
          <p
            className={cn(
              "flex items-center gap-1.5 text-sm font-medium",
              blockedStyle.text
            )}
          >
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            Fix these before applying
          </p>
          <ul className="mt-2 space-y-1">
            {impact.warnings.map((warning) => (
              <li
                key={warning}
                className={cn("flex gap-2 text-sm leading-relaxed", blockedStyle.text)}
              >
                <span aria-hidden="true">&middot;</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
