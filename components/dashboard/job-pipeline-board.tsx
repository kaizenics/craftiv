"use client";

import { useState } from "react";

import type { JobMatchCardData } from "@/components/dashboard/job-match-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Target } from "@/components/ui/icons";
import { bandStyle } from "@/lib/ats-display";
import {
  APPLICATION_PIPELINE_ORDER,
  APPLICATION_STATUS_LABELS,
  type ApplicationStatus,
} from "@/lib/types/job-hunter";
import { cn } from "@/lib/utils";

type PipelineMatch = JobMatchCardData & { applicationStatus: ApplicationStatus };

type JobPipelineBoardProps = {
  matches: PipelineMatch[];
  busyMatchId: string | null;
  fullscreen?: boolean;
  onStatusChange: (matchId: string, status: ApplicationStatus) => void;
};

export function JobPipelineBoard({
  matches,
  busyMatchId,
  fullscreen = false,
  onStatusChange,
}: JobPipelineBoardProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropStatus, setDropStatus] = useState<ApplicationStatus | null>(null);

  function finishDrop(status: ApplicationStatus) {
    if (draggedId) {
      const match = matches.find((item) => item.id === draggedId);
      if (match && match.applicationStatus !== status) onStatusChange(draggedId, status);
    }
    setDraggedId(null);
    setDropStatus(null);
  }

  return (
    <div className={cn("overflow-x-auto pb-2", fullscreen && "min-h-0 flex-1")}>
      <div
        className={cn(
          "grid min-w-[1120px] grid-cols-6 gap-3",
          fullscreen && "min-h-full",
        )}
        aria-label="Application pipeline"
      >
        {APPLICATION_PIPELINE_ORDER.map((status) => {
          const columnMatches = matches.filter((match) => match.applicationStatus === status);
          return (
            <section
              key={status}
              aria-labelledby={`pipeline-${status}`}
              onDragOver={(event) => {
                event.preventDefault();
                setDropStatus(status);
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropStatus(null);
              }}
              onDrop={(event) => {
                event.preventDefault();
                finishDrop(status);
              }}
              className={cn(
                "min-h-[360px] rounded-lg border border-border bg-muted/25 p-2 transition-colors",
                fullscreen && "min-h-[calc(100dvh-12rem)]",
                dropStatus === status && "border-primary bg-primary/5",
              )}
            >
              <div className="flex h-8 items-center justify-between gap-2 px-1">
                <h3 id={`pipeline-${status}`} className="text-xs font-semibold">
                  {APPLICATION_STATUS_LABELS[status]}
                </h3>
                <span className="text-xs tabular-nums text-muted-foreground">{columnMatches.length}</span>
              </div>

              <div className="mt-1 space-y-2">
                {columnMatches.map((match) => {
                  const band = bandStyle(match.score);
                  return (
                    <article
                      key={match.id}
                      draggable={busyMatchId !== match.id}
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData("text/plain", match.id);
                        setDraggedId(match.id);
                      }}
                      onDragEnd={() => {
                        setDraggedId(null);
                        setDropStatus(null);
                      }}
                      className={cn(
                        "cursor-grab rounded-lg border border-border bg-card p-3 shadow-sm active:cursor-grabbing",
                        draggedId === match.id && "opacity-50",
                        busyMatchId === match.id && "pointer-events-none opacity-60",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="line-clamp-2 text-sm font-semibold leading-5">{match.posting.title}</h4>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {match.posting.company || "No company listed"}
                          </p>
                        </div>
                        <span className={cn("shrink-0 rounded-md border px-1.5 py-1 text-xs font-semibold tabular-nums", band.surface, band.border, band.text)}>
                          {match.score}
                        </span>
                      </div>

                      {match.topActions[0] ? (
                        <p className="mt-2 flex gap-1.5 text-[11px] leading-4 text-muted-foreground">
                          <Target className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                          <span className="line-clamp-2">{match.topActions[0]}</span>
                        </p>
                      ) : null}

                      <div className="mt-2 text-[11px] text-muted-foreground">
                        {match.matchedKeywords.length} matched · {match.missingKeywords.length} missing
                      </div>

                      <Select
                        value={match.applicationStatus}
                        onValueChange={(value) => onStatusChange(match.id, value as ApplicationStatus)}
                        disabled={busyMatchId === match.id}
                      >
                        <SelectTrigger className="mt-2 h-8 w-full text-xs" aria-label={`Move ${match.posting.title} to another stage`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {APPLICATION_PIPELINE_ORDER.map((nextStatus) => (
                            <SelectItem key={nextStatus} value={nextStatus}>
                              {APPLICATION_STATUS_LABELS[nextStatus]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </article>
                  );
                })}

                {columnMatches.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border px-2 py-6 text-center text-xs text-muted-foreground">
                    Drop a job here
                  </div>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
