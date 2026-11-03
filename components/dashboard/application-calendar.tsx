"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "@/components/ui/icons";
import { matchesNeedle, type TrackedApp } from "@/components/dashboard/application-canvas";
import { followUpDue } from "@/lib/tracker-stats";
import { TRACKER_STATUS_STYLES } from "@/lib/types/applications";
import { cn } from "@/lib/utils";

type Event = { app: TrackedApp; kind: "applied" | "followUp" };

const pad = (n: number) => String(n).padStart(2, "0");
const dayKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const WEEKDAYS = Array.from({ length: 7 }, (_, i) => new Date(2026, 0, 4 + i).toLocaleDateString(undefined, { weekday: "short" }));

type Props = { apps: TrackedApp[]; needle: string; openApp: (app: TrackedApp) => void };

/** Month view of the dates already on the cards: when each application went out and when to chase it. */
export function ApplicationCalendar({ apps, needle, openApp }: Props) {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const today = dayKey(new Date());

  const events = useMemo(() => {
    const byDay = new Map<string, Event[]>();
    const add = (key: string, event: Event) => byDay.set(key, [...(byDay.get(key) ?? []), event]);
    for (const app of apps) {
      if (!matchesNeedle(app, needle)) continue;
      if (app.appliedOn) add(app.appliedOn, { app, kind: "applied" });
      const due = followUpDue(app);
      if (due) add(dayKey(due), { app, kind: "followUp" });
    }
    return byDay;
  }, [apps, needle]);

  // Six rows from the Sunday on or before the 1st covers every month.
  const days = Array.from({ length: 42 }, (_, i) => new Date(month.getFullYear(), month.getMonth(), 1 - month.getDay() + i));
  const shift = (delta: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="flex items-center gap-2 px-4 py-2 sm:px-6">
        <h2 className="text-base font-semibold text-foreground">
          {month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </h2>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>
            Today
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Previous month" onClick={() => shift(-1)}>
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Next month" onClick={() => shift(1)}>
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-4 pb-4 sm:px-6">
        <div className="grid min-w-[44rem] grid-cols-7 overflow-hidden rounded-xl border-l border-t border-border">
          {WEEKDAYS.map((name) => (
            <div key={name} className="border-b border-r border-border bg-muted px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              {name}
            </div>
          ))}
          {days.map((date) => {
            const key = dayKey(date);
            const inMonth = date.getMonth() === month.getMonth();
            return (
              <div key={key} className={cn("flex min-h-28 flex-col gap-1 border-b border-r border-border p-1.5", !inMonth && "bg-muted/40")}>
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-xs tabular-nums",
                    key === today ? "bg-primary font-semibold text-primary-foreground" : inMonth ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {date.getDate()}
                </span>
                <div className="flex max-h-24 flex-col gap-1 overflow-y-auto">
                  {(events.get(key) ?? []).map(({ app, kind }) => (
                    <button
                      key={`${app.id}-${kind}`}
                      type="button"
                      onClick={() => openApp(app)}
                      className={cn(
                        "truncate rounded-md px-1.5 py-0.5 text-left text-xs font-medium",
                        kind === "applied" ? TRACKER_STATUS_STYLES.applied : "bg-muted text-foreground",
                      )}
                    >
                      {kind === "followUp" ? "Follow up: " : ""}
                      {app.company || app.title || "Application"}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Shows the application date on each card, and a follow-up reminder a week later for anything still in Applied.
        </p>
      </div>
    </div>
  );
}
