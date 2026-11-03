"use client";

import { useMemo, type KeyboardEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpRight, Maximize, Plus } from "@/components/ui/icons";
import { matchesNeedle, type TrackedApp } from "@/components/dashboard/application-canvas";
import { TRACKER_LIMITS, TRACKER_STATUSES, TRACKER_STATUS_LABELS, TRACKER_STATUS_STYLES, type TrackerStatus } from "@/lib/types/applications";
import { trpc } from "@/trpc/client";
import { cn } from "@/lib/utils";

type Field = "company" | "title" | "location" | "salary" | "contact" | "appliedOn" | "postingUrl";

const COLUMNS: { field: Field; label: string; width: string; type?: "date" | "url" }[] = [
  { field: "company", label: "Company", width: "w-48" },
  { field: "title", label: "Role", width: "w-60" },
  { field: "appliedOn", label: "Applied on", width: "w-40", type: "date" },
  { field: "location", label: "Location", width: "w-40" },
  { field: "salary", label: "Salary", width: "w-32" },
  { field: "contact", label: "Contact", width: "w-40" },
  { field: "postingUrl", label: "Link", width: "w-56", type: "url" },
];

type Props = {
  boardId: string;
  apps: TrackedApp[];
  needle: string;
  openApp: (app: TrackedApp) => void;
  addApp: () => void;
};

/** Spreadsheet view of one tab: every cell edits in place and saves when it loses focus. */
export function ApplicationTable({ boardId, apps, needle, openApp, addApp }: Props) {
  const utils = trpc.useUtils();
  const onError = (error: { message: string }) => toast.error(error.message);
  const onSettled = () => utils.applications.list.invalidate();
  const update = trpc.applications.update.useMutation({ onError, onSettled });
  const move = trpc.applications.move.useMutation({ onError, onSettled });

  // Grouped in board column order, so the table reads like the board top to bottom.
  const rows = useMemo(
    () =>
      apps
        .filter((app) => matchesNeedle(app, needle))
        .sort((a, b) => TRACKER_STATUSES.indexOf(a.status) - TRACKER_STATUSES.indexOf(b.status)),
    [apps, needle],
  );

  const patch = (id: string, changes: Partial<TrackedApp>) =>
    utils.applications.list.setData({ boardId }, (prev) => prev?.map((item) => (item.id === id ? { ...item, ...changes } : item)));

  const commit = (app: TrackedApp, field: Field, value: string) => {
    const next = field === "appliedOn" ? value : value.trim();
    if (next === app[field]) return;
    patch(app.id, { [field]: next });
    update.mutate({ id: app.id, [field]: next });
  };

  const setStatus = (app: TrackedApp, status: TrackerStatus) => {
    patch(app.id, { status, canvasX: null, canvasY: null });
    move.mutate({ id: app.id, status });
  };

  // Enter moves down a row like a spreadsheet; Escape throws the edit away.
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>, row: number, col: number, original: string) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const below = document.querySelector<HTMLInputElement>(`[data-cell="${row + 1}:${col}"]`);
      if (below) below.focus();
      else event.currentTarget.blur();
    } else if (event.key === "Escape") {
      event.currentTarget.value = original;
      event.currentTarget.blur();
    }
  };

  const cell = "border-b border-r border-border";
  return (
    <div className="h-full overflow-auto bg-card">
      <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
        <thead className="sticky top-0 z-10 bg-muted">
          <tr>
            <th className={cn(cell, "sticky left-0 z-10 w-10 bg-muted")} aria-label="Row" />
            <th className={cn(cell, "w-44 px-3 py-2 text-left text-xs font-semibold text-muted-foreground")}>Status</th>
            {COLUMNS.map((column) => (
              <th key={column.field} className={cn(cell, column.width, "px-3 py-2 text-left text-xs font-semibold text-muted-foreground")}>
                {column.label}
              </th>
            ))}
            <th className={cn(cell, "w-12")} aria-label="Details" />
          </tr>
        </thead>
        <tbody>
          {rows.map((app, row) => (
            <tr key={app.id} className="group">
              <td className={cn(cell, "sticky left-0 bg-muted text-center text-xs tabular-nums text-muted-foreground")}>{row + 1}</td>
              <td className={cn(cell, "px-1.5")}>
                <Select value={app.status} onValueChange={(value) => setStatus(app, value as TrackerStatus)}>
                  <SelectTrigger size="sm" aria-label={`Status of ${app.company || "application"}`} className="h-7 w-full border-0 bg-transparent px-1.5 dark:bg-transparent">
                    <SelectValue>
                      <span className={cn("rounded-md px-2 py-0.5 text-xs font-semibold", TRACKER_STATUS_STYLES[app.status])}>
                        {TRACKER_STATUS_LABELS[app.status]}
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {TRACKER_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {TRACKER_STATUS_LABELS[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </td>
              {COLUMNS.map((column, col) => {
                const value = app[column.field];
                return (
                  <td key={column.field} className={cn(cell, "relative p-0")}>
                    <input
                      // Remounts when saved data changes, so the cell never shows a stale value.
                      key={value}
                      data-cell={`${row}:${col}`}
                      type={column.type === "date" ? "date" : "text"}
                      defaultValue={value}
                      maxLength={column.type === "url" ? TRACKER_LIMITS.url : TRACKER_LIMITS.text}
                      aria-label={`${column.label} for ${app.company || "application"}`}
                      onBlur={(event) => commit(app, column.field, event.target.value)}
                      onKeyDown={(event) => onKeyDown(event, row, col, value)}
                      className={cn(
                        "h-9 w-full bg-transparent px-3 text-foreground outline-none focus:bg-background focus:ring-2 focus:ring-inset focus:ring-primary",
                        column.type === "url" && value && "pr-8 text-primary",
                      )}
                    />
                    {column.type === "url" && /^https?:\/\//i.test(value) ? (
                      <a
                        href={value}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Open the posting"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                      >
                        <ArrowUpRight className="size-3.5" aria-hidden="true" />
                      </a>
                    ) : null}
                  </td>
                );
              })}
              <td className={cn(cell, "text-center")}>
                <Button variant="ghost" size="icon-sm" aria-label={`Open all details for ${app.company || "application"}`} onClick={() => openApp(app)}>
                  <Maximize className="size-3.5" aria-hidden="true" />
                </Button>
              </td>
            </tr>
          ))}
          <tr>
            <td className={cn(cell, "sticky left-0 bg-muted")} />
            <td colSpan={COLUMNS.length + 2} className={cell}>
              <button
                type="button"
                onClick={addApp}
                className="flex h-9 w-full items-center gap-1.5 px-3 text-left text-sm text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              >
                <Plus className="size-4" aria-hidden="true" />
                {needle && rows.length === 0 ? "No rows match the filter. Add an application" : "New application"}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
