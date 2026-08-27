"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { AlertCircle, Check, FileText, Sparkles } from "@/components/ui/icons";
import {
  CREDIT_ACTIONS,
  affordableCount,
  creditBalanceState,
  formatCreditValue,
} from "@/lib/credit-costs";
import { cn } from "@/lib/utils";

type CreditsOverviewProps = {
  availableCredits: number;
  resumesCreated: number;
  coverLettersCreated: number;
  benefits: string[];
};

const STATE_COPY = {
  empty: {
    label: "No credits left",
    message: "Buy a pack to start using the AI tools again.",
    surface: "border-destructive-border bg-destructive-surface",
    text: "text-destructive-surface-foreground",
  },
  low: {
    label: "Running low",
    message: "Only a few actions left at current prices. Consider topping up.",
    surface: "border-warning-border bg-warning-surface",
    text: "text-warning-surface-foreground",
  },
  healthy: {
    label: "Good to go",
    message: "",
    surface: "",
    text: "",
  },
} as const;

function pluralize(count: number, singular: string) {
  return `${count} ${count === 1 ? singular : `${singular}s`}`;
}

export function CreditsOverview({
  availableCredits,
  resumesCreated,
  coverLettersCreated,
  benefits,
}: CreditsOverviewProps) {
  const state = creditBalanceState(availableCredits);
  const copy = STATE_COPY[state];
  const needsTopUp = state !== "healthy";

  return (
    <section
      aria-labelledby="credits-heading"
      className="rounded-xl border border-border bg-card p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 id="credits-heading" className="text-base font-semibold text-foreground">
            Credits
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            One-time packs, no subscription. Credits never expire.
          </p>
        </div>

        <Button asChild variant={needsTopUp ? "default" : "outline"}>
          <Link href="/pricing">
            <Sparkles aria-hidden="true" />
            Buy credits
          </Link>
        </Button>
      </div>

      <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="font-display text-4xl font-bold leading-none tabular-nums text-foreground">
          {formatCreditValue(Math.round(availableCredits * 100))}
        </p>
        <p className="text-sm text-muted-foreground">credits available</p>
        {/* State is spelled out, not just tinted, so it survives greyscale. */}
        <span
          className={cn(
            "rounded-4xl border px-2 py-0.5 text-xs font-medium",
            state === "healthy"
              ? "border-success-border bg-success-surface text-success-surface-foreground"
              : copy.surface + " " + copy.text
          )}
        >
          {copy.label}
        </span>
      </div>

      {needsTopUp && (
        <div
          className={cn(
            "mt-3 flex items-start gap-2 rounded-lg border p-3 text-sm",
            copy.surface,
            copy.text
          )}
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{copy.message}</span>
        </div>
      )}

      <div className="mt-5">
        <h4 className="text-sm font-medium text-foreground">What your credits buy</h4>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Costs differ per action, so this is what your balance covers right now.
        </p>

        {/* Replaces a single "0.5 credit each" rate that under-counted expensive
            actions by half and over-counted cheap ones by five times. */}
        <ul className="mt-3 divide-y divide-border overflow-hidden rounded-lg border border-border">
          {CREDIT_ACTIONS.map((action) => {
            const remaining = affordableCount(availableCredits, action.costUnits);
            return (
              <li
                key={action.id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3 py-2.5"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-foreground">
                    {action.label}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {action.detail}
                  </span>
                </span>
                <span className="flex shrink-0 items-baseline gap-3 text-right">
                  <span className="text-xs text-muted-foreground">
                    {formatCreditValue(action.costUnits)} cr
                  </span>
                  <span
                    className={cn(
                      "w-16 text-sm font-semibold tabular-nums",
                      remaining === 0 ? "text-muted-foreground" : "text-foreground"
                    )}
                  >
                    {remaining === 0 ? "None" : `${remaining} left`}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-5 border-t border-border pt-4">
        <h4 className="text-sm font-medium text-foreground">Created so far</h4>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <FileText className="h-4 w-4" aria-hidden="true" />
            {pluralize(resumesCreated, "resume")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FileText className="h-4 w-4" aria-hidden="true" />
            {pluralize(coverLettersCreated, "cover letter")}
          </span>
        </p>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Downloads are unlimited and free on every pack.
        </p>
      </div>

      <div className="mt-5 border-t border-border pt-4">
        <h4 className="text-sm font-medium text-foreground">Included in your pack</h4>
        <ul className="mt-3 space-y-2">
          {benefits.map((benefit) => (
            <li key={benefit} className="flex items-start gap-2.5 text-sm">
              <Check
                className="mt-0.5 h-4 w-4 shrink-0 text-success"
                aria-hidden="true"
              />
              <span className="text-muted-foreground">{benefit}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
