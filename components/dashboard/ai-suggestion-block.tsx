"use client";

import { useId } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { getBulletLines } from "@/lib/ai-resume-content";
import { cn } from "@/lib/utils";

const BULLET_PATTERN = /^(\s*[-•*]\s+).+/m;

function BodyText({ value, tone }: { value: string; tone: "before" | "after" }) {
  const className = cn(
    "text-sm leading-relaxed",
    tone === "after" ? "text-foreground" : "text-muted-foreground"
  );

  if (BULLET_PATTERN.test(value)) {
    return (
      <ul className={cn("list-disc space-y-1 pl-5", className)}>
        {getBulletLines(value).map((line, index) => (
          <li key={`${line}-${index}`}>{line}</li>
        ))}
      </ul>
    );
  }

  return <p className={cn("whitespace-pre-wrap", className)}>{value}</p>;
}

type AiSuggestionBlockProps = {
  label: string;
  before?: string | null;
  after: string;
  /** Omit both to render a read-only block with no apply control. */
  applyChecked?: boolean;
  onToggleApply?: () => void;
};

/**
 * One rewritten block, with its original stacked directly above it.
 *
 * Before and after used to live in two independent columns, so row N on the
 * left stopped lining up with row N on the right as soon as their heights
 * differed -- unreadable once "Improve Full Resume" returned six blocks.
 * Pairing them inside a single card makes the correspondence structural.
 */
export function AiSuggestionBlock({
  label,
  before,
  after,
  applyChecked,
  onToggleApply,
}: AiSuggestionBlockProps) {
  const checkboxId = useId();
  const selectable = typeof applyChecked === "boolean" && !!onToggleApply;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border transition-colors",
        selectable && applyChecked ? "border-primary/40" : "border-border"
      )}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/40 px-4 py-2.5">
        <p className="min-w-0 truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {selectable && (
          <div className="flex shrink-0 items-center gap-2">
            <Checkbox
              id={checkboxId}
              checked={applyChecked}
              onCheckedChange={onToggleApply}
            />
            <label
              htmlFor={checkboxId}
              className="cursor-pointer text-xs font-medium text-foreground"
            >
              Apply
            </label>
          </div>
        )}
      </div>

      <div className="divide-y divide-border">
        {before?.trim() ? (
          <div className="px-4 py-3">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-wide text-muted-foreground">
              Before
            </p>
            <div className="mt-1.5">
              <BodyText value={before} tone="before" />
            </div>
          </div>
        ) : null}

        <div className="bg-success-surface/40 px-4 py-3">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-wide text-success-surface-foreground">
            After
          </p>
          <div className="mt-1.5">
            <BodyText value={after} tone="after" />
          </div>
        </div>
      </div>
    </div>
  );
}
