"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, RefreshCw, Sparkles, Trash2 } from "@/components/ui/icons";
import { bandStyle } from "@/lib/ats-display";
import {
  APPLICATION_STATUSES,
  APPLICATION_STATUS_LABELS,
  type ApplicationStatus,
} from "@/lib/types/job-hunter";
import { cn } from "@/lib/utils";

export type JobMatchCardData = {
  id: string;
  score: number;
  applicationStatus: ApplicationStatus;
  matchedKeywords: string[];
  missingKeywords: string[];
  scoredAt: Date | string;
  resumeVersionAt: Date | string;
  pipelineStatus: string;
  posting: {
    title: string;
    company: string;
    location: string;
    source: string;
    url: string;
    applyUrl: string;
    salaryText: string;
  };
};

type JobMatchCardProps = {
  match: JobMatchCardData;
  /** Set when the resume has been edited since this score was computed. */
  stale: boolean;
  attribution: string | null;
  busy: boolean;
  onStatusChange: (status: ApplicationStatus) => void;
  onRescore: () => void;
  onTailor: () => void;
  onDelete: () => void;
};

export function JobMatchCard({
  match,
  stale,
  attribution,
  busy,
  onStatusChange,
  onRescore,
  onTailor,
  onDelete,
}: JobMatchCardProps) {
  const band = bandStyle(match.score);
  const { posting } = match;

  return (
    <article className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate font-heading text-base font-semibold">{posting.title}</h3>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">
            {[posting.company, posting.location].filter(Boolean).join(" · ") || "No company listed"}
          </p>
          {posting.salaryText ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{posting.salaryText}</p>
          ) : null}
        </div>

        {/* The band label carries the meaning in text as well as colour, so it
            still reads for colour-blind users and in greyscale. */}
        <div
          className={cn(
            "flex shrink-0 flex-col items-center rounded-lg border px-3 py-2",
            band.surface,
            band.border,
          )}
        >
          <span className={cn("font-heading text-2xl font-semibold leading-none", band.text)}>
            {match.score}
          </span>
          <span className={cn("mt-1 text-[11px] font-medium", band.text)}>{band.label}</span>
        </div>
      </div>

      {stale ? (
        <p className="mt-3 rounded-lg border border-warning-border bg-warning-surface px-3 py-2 text-xs text-warning-surface-foreground">
          Your resume changed since this was scored. Re-score for an up-to-date match.
        </p>
      ) : null}

      {match.missingKeywords.length > 0 ? (
        <div className="mt-3">
          <p className="text-xs font-medium text-muted-foreground">Missing keywords</p>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {match.missingKeywords.slice(0, 6).map((keyword) => (
              <li
                key={keyword}
                className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground"
              >
                {keyword}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Select
          value={match.applicationStatus}
          onValueChange={(value) => onStatusChange(value as ApplicationStatus)}
          disabled={busy}
        >
          <SelectTrigger className="h-9 w-[150px]" aria-label={`Status for ${posting.title}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {APPLICATION_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {APPLICATION_STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button size="sm" onClick={onTailor} disabled={busy} className="h-9">
          <Sparkles className="size-4" aria-hidden="true" />
          {match.pipelineStatus === "tailored" ? "View tailored" : "Tailor"}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onRescore}
          disabled={busy}
          className="h-9"
        >
          <RefreshCw className={cn("size-4", busy && "animate-spin")} aria-hidden="true" />
          Re-score
        </Button>

        {posting.applyUrl ? (
          <Button variant="outline" size="sm" asChild className="h-9">
            <a
              href={posting.applyUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              aria-label={`Open ${posting.title} on the employer site (opens in a new tab)`}
            >
              Open posting
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </a>
          </Button>
        ) : null}

        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          disabled={busy}
          className="ml-auto h-9 text-muted-foreground hover:text-destructive-surface-foreground"
        >
          <Trash2 className="size-4" aria-hidden="true" />
          <span className="sr-only">Remove {posting.title}</span>
        </Button>
      </div>

      {attribution ? (
        <p className="mt-3 text-[11px] text-muted-foreground">{attribution}</p>
      ) : null}
    </article>
  );
}
