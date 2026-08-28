"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Loader2, Play, Plus, Trash2 } from "@/components/ui/icons";

export type HuntSummary = {
  id: string;
  name: string;
  query: string;
  frequency: "daily" | "weekly" | "manual";
  runAtMinuteUtc: number;
  isActive: boolean;
  emailDigest: boolean;
  lastRunAt: Date | string | null;
  nextRunAt: Date | string | null;
};

export type HuntDraft = {
  name: string;
  query: string;
  frequency: "daily" | "weekly" | "manual";
  runAtMinuteUtc: number;
  emailDigest: boolean;
};

type HuntManagerProps = {
  hunts: HuntSummary[];
  loading: boolean;
  /** Sources the scheduler is actually allowed to poll. */
  pollableSources: { id: string; label: string }[];
  savingHunt: boolean;
  runningHuntId: string | null;
  canCreate: boolean;
  onCreate: (draft: HuntDraft) => void;
  onToggleActive: (hunt: HuntSummary, isActive: boolean) => void;
  onRunNow: (huntId: string) => void;
  onDelete: (huntId: string) => void;
};

function formatMinute(minute: number): string {
  const h = String(Math.floor(minute / 60)).padStart(2, "0");
  const m = String(minute % 60).padStart(2, "0");
  return `${h}:${m} UTC`;
}

function formatWhen(value: Date | string | null): string {
  if (!value) return "not scheduled";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HuntManager({
  hunts,
  loading,
  pollableSources,
  savingHunt,
  runningHuntId,
  canCreate,
  onCreate,
  onToggleActive,
  onRunNow,
  onDelete,
}: HuntManagerProps) {
  const [draft, setDraft] = useState<HuntDraft>({
    name: "",
    query: "",
    frequency: "daily",
    runAtMinuteUtc: 360,
    emailDigest: true,
  });

  const canSubmit = canCreate && draft.name.trim().length > 0 && !savingHunt;

  return (
    <div className="space-y-4">
      {pollableSources.length === 0 ? (
        <p className="flex gap-2 rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            No source can be searched automatically right now, so a scheduled hunt will only
            re-score the jobs you have already saved and tell you when your resume changes their
            match. That is still useful, but it will not find new jobs on its own.
          </span>
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Scheduled hunts search {pollableSources.map((source) => source.label).join(", ")},
          re-score your saved jobs when your resume changes, and email you a digest. They never
          spend credits.
        </p>
      )}

      <section className="rounded-xl border border-border bg-card p-4">
        <h3 className="font-heading text-base font-semibold">New hunt</h3>

        <div className="mt-3 space-y-3">
          <div>
            <label htmlFor="hunt-name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="hunt-name"
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              placeholder="Virtual assistant roles"
              maxLength={80}
              className="mt-1.5"
            />
          </div>

          <div>
            <label htmlFor="hunt-query" className="text-sm font-medium">
              Search keywords
            </label>
            <Input
              id="hunt-query"
              value={draft.query}
              onChange={(event) => setDraft({ ...draft, query: event.target.value })}
              placeholder="virtual assistant"
              maxLength={200}
              className="mt-1.5"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="hunt-frequency" className="text-sm font-medium">
                Runs
              </label>
              <Select
                value={draft.frequency}
                onValueChange={(value) =>
                  setDraft({ ...draft, frequency: value as HuntDraft["frequency"] })
                }
              >
                <SelectTrigger id="hunt-frequency" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="manual">Only when I ask</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="hunt-time" className="text-sm font-medium">
                At
              </label>
              <Select
                value={String(draft.runAtMinuteUtc)}
                onValueChange={(value) =>
                  setDraft({ ...draft, runAtMinuteUtc: Number(value) })
                }
              >
                <SelectTrigger id="hunt-time" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 180, 360, 540, 720, 900, 1080, 1260].map((minute) => (
                    <SelectItem key={minute} value={String(minute)}>
                      {formatMinute(minute)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">Email me a digest</p>
              <p className="text-xs text-muted-foreground">
                Only sent when there is something to report.
              </p>
            </div>
            <Switch
              checked={draft.emailDigest}
              onCheckedChange={(checked) => setDraft({ ...draft, emailDigest: checked })}
              aria-label="Email me a digest"
            />
          </div>

          <Button
            onClick={() => {
              onCreate(draft);
              setDraft({ ...draft, name: "", query: "" });
            }}
            disabled={!canSubmit}
            className="w-full"
          >
            {savingHunt ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Plus className="size-4" aria-hidden="true" />
            )}
            Create hunt
          </Button>
          {!canCreate ? (
            <p className="text-xs text-muted-foreground">
              Pick a resume above first — a hunt scores against one.
            </p>
          ) : null}
        </div>
      </section>

      {loading ? (
        <ul className="space-y-3" aria-hidden="true">
          {[0, 1].map((key) => (
            <li key={key} className="h-24 animate-pulse rounded-xl bg-muted/60" />
          ))}
        </ul>
      ) : hunts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No saved hunts yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {hunts.map((hunt) => (
            <li key={hunt.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-heading text-base font-semibold">{hunt.name}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {hunt.frequency === "manual"
                      ? "Runs only when you ask"
                      : `${hunt.frequency === "daily" ? "Daily" : "Weekly"} at ${formatMinute(hunt.runAtMinuteUtc)}`}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Last run {formatWhen(hunt.lastRunAt)} · next {formatWhen(hunt.nextRunAt)}
                  </p>
                </div>

                <Switch
                  checked={hunt.isActive}
                  onCheckedChange={(checked) => onToggleActive(hunt, checked)}
                  aria-label={`${hunt.isActive ? "Pause" : "Resume"} ${hunt.name}`}
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRunNow(hunt.id)}
                  disabled={runningHuntId !== null}
                >
                  {runningHuntId === hunt.id ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Play className="size-4" aria-hidden="true" />
                  )}
                  Run now
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(hunt.id)}
                  disabled={runningHuntId !== null}
                  className="ml-auto text-muted-foreground hover:text-destructive-surface-foreground"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  <span className="sr-only">Delete {hunt.name}</span>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
