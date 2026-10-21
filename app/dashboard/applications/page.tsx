"use client";

import { useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardCode,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { inferRouterOutputs } from "@trpc/server";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { ArrowUpRight, CalendarIcon, Link2, Plus, Target, Users } from "@/components/ui/icons";
import { ApplicationSheet, emptyDraft, type ApplicationDraft } from "@/components/dashboard/application-sheet";
import { ApplyAssistDialog } from "@/components/dashboard/apply-assist-dialog";
import { InterviewPrepDialog, interviewPrepHref } from "@/components/dashboard/interview-prep-dialog";
import { bandStyle } from "@/lib/ats-display";
import {
  positionBetween,
  TRACKER_STATUS_FROM_MATCH,
  TRACKER_STATUS_LABELS,
  TRACKER_STATUS_STYLES,
  TRACKER_STATUSES,
  type TrackerStatus,
} from "@/lib/types/applications";
import { trpc } from "@/trpc/client";
import type { AppRouter } from "@/trpc/root";
import { cn } from "@/lib/utils";

type TrackedApp = inferRouterOutputs<AppRouter>["applications"]["list"][number];

// "Show Job Hunter jobs" is off unless the user turns it on; the choice is remembered per browser.
const SHOW_HUNTER_KEY = "craftiv:tracker-show-hunter";
const hunterListeners = new Set<() => void>();
const readShowHunter = () => {
  try {
    return window.localStorage.getItem(SHOW_HUNTER_KEY) === "1";
  } catch {
    return false;
  }
};
const subscribeShowHunter = (listener: () => void) => {
  hunterListeners.add(listener);
  return () => hunterListeners.delete(listener);
};
const writeShowHunter = (value: boolean) => {
  try {
    window.localStorage.setItem(SHOW_HUNTER_KEY, value ? "1" : "0");
  } catch {
    // Storage blocked: the switch still works for this visit.
  }
  hunterListeners.forEach((listener) => listener());
};

function formatDate(value: string) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
}

const CARD_CLASS = "w-full rounded-xl bg-muted/60 p-3 text-left transition-colors hover:bg-muted";

function AppCardBody({ app }: { app: TrackedApp }) {
  return (
    <>
      <p className="truncate text-sm font-semibold text-foreground">{app.company || "No company"}</p>
      <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{app.title || "No title"}</p>
      {app.appliedOn || app.interviewStage ? (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {app.appliedOn ? (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarIcon className="size-3" aria-hidden="true" />
              {formatDate(app.appliedOn)}
            </span>
          ) : null}
          {app.interviewStage ? (
            <span className="rounded-md bg-card px-1.5 py-0.5 text-xs font-medium text-foreground">{app.interviewStage}</span>
          ) : null}
        </div>
      ) : null}
      {app.contact || app.interviewer ? (
        <p className="mt-2 flex items-center gap-1 truncate text-xs text-muted-foreground">
          <Users className="size-3 shrink-0" aria-hidden="true" />
          {[app.contact, app.interviewer].filter(Boolean).join(" · ")}
        </p>
      ) : null}
      {app.notes ? <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-foreground/80">{app.notes}</p> : null}
      {app.postingUrl || app.customFields?.length ? (
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          {app.postingUrl ? <Link2 className="size-3" aria-label="Has a posting link" /> : null}
          {app.customFields?.length ? (
            <span>
              {app.customFields.length} {app.customFields.length === 1 ? "field" : "fields"}
            </span>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

function SortableAppCard({ app, onOpen }: { app: TrackedApp; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: app.id });
  return (
    <button
      ref={setNodeRef}
      type="button"
      {...attributes}
      {...listeners}
      onClick={onOpen}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition,
      }}
      className={cn(CARD_CLASS, "cursor-grab touch-manipulation", isDragging && "opacity-40")}
    >
      <AppCardBody app={app} />
    </button>
  );
}

function BoardColumn({ status, highlighted, children }: { status: TrackerStatus; highlighted: boolean; children: ReactNode }) {
  const { setNodeRef } = useDroppable({ id: status });
  return (
    <section
      ref={setNodeRef}
      aria-label={TRACKER_STATUS_LABELS[status]}
      className={cn("flex min-h-[28rem] w-72 shrink-0 flex-col rounded-2xl bg-card p-3 transition-colors", highlighted && "bg-primary/5")}
    >
      {children}
    </section>
  );
}

export default function ApplicationsPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const appsQuery = trpc.applications.list.useQuery();
  const storedShowHunter = useSyncExternalStore(subscribeShowHunter, readShowHunter, () => false);
  const [showHunterOverride, setShowHunterOverride] = useState<boolean | null>(null);
  const showHunter = showHunterOverride ?? storedShowHunter;
  const matchesQuery = trpc.jobHunter.listMatches.useQuery({ limit: 100 }, { enabled: showHunter });
  const preppedQuery = trpc.jobHunter.preppedMatchIds.useQuery(undefined, {
    enabled: showHunter,
  });
  const preppedIds = useMemo(() => new Set(preppedQuery.data ?? []), [preppedQuery.data]);

  const [draft, setDraft] = useState<ApplicationDraft | null>(null);
  const [draftKey, setDraftKey] = useState(0);
  const [dragId, setDragId] = useState<UniqueIdentifier | null>(null);
  const [dropTarget, setDropTarget] = useState<TrackerStatus | null>(null);
  const [applyMatchId, setApplyMatchId] = useState<string | null>(null);
  const [prepMatchId, setPrepMatchId] = useState<string | null>(null);

  const openDraft = (next: ApplicationDraft) => {
    setDraftKey((k) => k + 1);
    setDraft(next);
  };

  const move = trpc.applications.move.useMutation({
    onError: (error) => toast.error(error.message),
    onSettled: () => utils.applications.list.invalidate(),
  });
  const trackMatch = trpc.applications.trackMatch.useMutation({
    onSuccess: async (result) => {
      await utils.applications.list.invalidate();
      toast.success(result.created ? "Added to your tracker." : "Already in your tracker.");
    },
    onError: (error) => toast.error(error.message),
  });
  const updateMatch = trpc.jobHunter.updateMatch.useMutation({
    onSuccess: () => utils.jobHunter.listMatches.invalidate(),
    onError: (error) => toast.error(error.message),
  });

  const apps = useMemo(() => appsQuery.data ?? [], [appsQuery.data]);
  const trackedMatchIds = useMemo(() => new Set(apps.map((app) => app.matchId).filter(Boolean)), [apps]);
  // Scraped jobs already copied into the tracker are not shown twice.
  const hunterJobs = useMemo(
    () => (showHunter ? (matchesQuery.data ?? []).filter((m) => !trackedMatchIds.has(m.id) && m.applicationStatus !== "dismissed") : []),
    [showHunter, matchesQuery.data, trackedMatchIds],
  );

  // Mouse drags after a few pixels so a click still opens the card; touch needs a short press so the board can still scroll.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      // Space picks a card up; Enter is left to open it.
      keyboardCodes: {
        start: [KeyboardCode.Space],
        cancel: [KeyboardCode.Esc],
        end: [KeyboardCode.Space, KeyboardCode.Enter],
      },
    }),
  );

  const inColumn = (status: TrackerStatus) => apps.filter((app) => app.status === status).sort((a, b) => a.position - b.position);
  const columns = TRACKER_STATUSES.map((status) => ({
    status,
    apps: inColumn(status),
    hunter: hunterJobs.filter((m) => TRACKER_STATUS_FROM_MATCH[m.applicationStatus] === status),
  }));

  // `over` is either a card (its column) or an empty part of a column (the status itself).
  const statusOf = (id: UniqueIdentifier) => apps.find((item) => item.id === id)?.status ?? (id as TrackerStatus);
  const dragApp = apps.find((item) => item.id === dragId) ?? null;

  const onDragOver = ({ over }: DragOverEvent) => setDropTarget(over ? statusOf(over.id) : null);

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDragId(null);
    setDropTarget(null);
    const app = apps.find((item) => item.id === active.id);
    if (!app || !over) return;
    const status = statusOf(over.id);
    const column = inColumn(status);
    const others = column.filter((item) => item.id !== app.id);
    let index = others.length;
    const overIndex = column.findIndex((item) => item.id === over.id);
    if (overIndex !== -1) {
      if (app.status === status) {
        // Same column: the card takes the hovered card's slot.
        index = overIndex;
      } else {
        // Other column: above or below the hovered card, comparing the two cards' centres.
        const dragged = active.rect.current.translated;
        const below = dragged ? dragged.top + dragged.height / 2 > over.rect.top + over.rect.height / 2 : false;
        index = overIndex + (below ? 1 : 0);
      }
    }
    if (app.status === status && column[index]?.id === app.id) return;
    const position = positionBetween(others[index - 1]?.position, others[index]?.position);
    // Optimistic: the card lands immediately, the server catches up.
    utils.applications.list.setData(undefined, (prev) => prev?.map((item) => (item.id === app.id ? { ...item, status, position } : item)));
    move.mutate({ id: app.id, status, position });
  };

  const labelFor = (matchId: string | null) => {
    const match = (matchesQuery.data ?? []).find((m) => m.id === matchId);
    return (match && [match.posting.title, match.posting.company].filter(Boolean).join(" at ")) || "this job";
  };
  const applyMatch = (matchesQuery.data ?? []).find((m) => m.id === applyMatchId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground lg:text-3xl">Applications</h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">
            Every job you are pursuing, from first save to offer. Drag a card to move it along.
          </p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-2.5 rounded-xl bg-card px-3 py-2">
            <Switch
              checked={showHunter}
              onCheckedChange={(next) => {
                setShowHunterOverride(next);
                writeShowHunter(next);
              }}
              aria-label="Show Job Hunter jobs"
            />
            <span className="text-sm font-medium text-foreground">Show Job Hunter jobs</span>
          </label>
          <Button onClick={() => openDraft(emptyDraft())}>
            <Plus className="size-4" aria-hidden="true" />
            <span>
              New<span className="sr-only sm:not-sr-only"> application</span>
            </span>
          </Button>
        </div>
      </div>

      {appsQuery.isLoading ? (
        <div className="flex gap-4 overflow-hidden">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-96 w-72 shrink-0 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <DndContext
            id="applications-board"
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={({ active }) => setDragId(active.id)}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
            onDragCancel={() => {
              setDragId(null);
              setDropTarget(null);
            }}
          >
            <div className="flex w-max gap-4">
              {columns.map((column) => (
                <BoardColumn
                  key={column.status}
                  status={column.status}
                  highlighted={dropTarget === column.status && dragApp?.status !== column.status}
                >
                  <div className="flex items-center justify-between gap-2 px-1 pb-3">
                    <span className={cn("rounded-md px-2 py-1 text-xs font-semibold", TRACKER_STATUS_STYLES[column.status])}>
                      {TRACKER_STATUS_LABELS[column.status]}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="text-xs tabular-nums text-muted-foreground">{column.apps.length + column.hunter.length}</span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Add an application to ${TRACKER_STATUS_LABELS[column.status]}`}
                        onClick={() => openDraft(emptyDraft(column.status))}
                      >
                        <Plus className="size-4" aria-hidden="true" />
                      </Button>
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col gap-2">
                    <SortableContext items={column.apps.map((app) => app.id)} strategy={verticalListSortingStrategy}>
                      {column.apps.map((app) => (
                        <SortableAppCard
                          key={app.id}
                          app={app}
                          onOpen={() =>
                            openDraft({
                              ...app,
                              customFields: app.customFields ?? [],
                            })
                          }
                        />
                      ))}
                    </SortableContext>

                    {column.hunter.map((match) => {
                      const band = bandStyle(match.score);
                      return (
                        <div key={match.id} className="rounded-xl bg-primary/5 p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                              <Target className="size-3" aria-hidden="true" />
                              Job Hunter
                            </span>
                            <span className={cn("rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums", band.surface, band.text)}>
                              {match.score}
                            </span>
                          </div>
                          <p className="mt-1.5 line-clamp-2 text-sm font-semibold text-foreground">{match.posting.title}</p>
                          {match.posting.company ? <p className="truncate text-xs text-muted-foreground">{match.posting.company}</p> : null}
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            <Button size="xs" onClick={() => trackMatch.mutate({ matchId: match.id })} disabled={trackMatch.isPending}>
                              <Plus className="size-3" aria-hidden="true" />
                              Track
                            </Button>
                            <Button size="xs" variant="outline" className="bg-card" onClick={() => setApplyMatchId(match.id)}>
                              Apply
                              <ArrowUpRight className="size-3" aria-hidden="true" />
                            </Button>
                            {preppedIds.has(match.id) ? (
                              <Button size="xs" variant="outline" className="bg-card" asChild>
                                <Link href={interviewPrepHref(match.id)}>Prep</Link>
                              </Button>
                            ) : (
                              <Button size="xs" variant="outline" className="bg-card" onClick={() => setPrepMatchId(match.id)}>
                                Prep
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {column.apps.length + column.hunter.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => openDraft(emptyDraft(column.status))}
                        className="flex flex-1 items-start justify-center rounded-xl px-3 py-6 text-xs text-muted-foreground transition-colors hover:bg-muted/60"
                      >
                        Drop a card here, or add one
                      </button>
                    ) : null}
                  </div>
                </BoardColumn>
              ))}
            </div>
            <DragOverlay>
              {dragApp ? (
                <div className={cn(CARD_CLASS, "cursor-grabbing bg-muted shadow-lg")}>
                  <AppCardBody app={dragApp} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}

      {!appsQuery.isLoading && apps.length === 0 && !showHunter ? (
        <p className="text-sm text-muted-foreground">
          Tip: turn on <span className="font-medium text-foreground">Show Job Hunter jobs</span> to bring in the roles you found, or add an
          application you are tracking yourself.
        </p>
      ) : null}

      <ApplicationSheet key={draftKey} draft={draft} onClose={() => setDraft(null)} />

      <ApplyAssistDialog
        key={applyMatchId ?? "none"}
        matchId={applyMatchId}
        jobLabel={labelFor(applyMatchId)}
        alreadyApplied={applyMatch?.applicationStatus === "applied"}
        onOpenChange={(open) => {
          if (!open) setApplyMatchId(null);
        }}
        onTailor={() => {
          setApplyMatchId(null);
          toast.info("Use Tailor on the job's card to write its cover letter.");
          router.push("/dashboard/job-hunter");
        }}
        onApplied={() => {
          if (applyMatch && (applyMatch.applicationStatus === "new" || applyMatch.applicationStatus === "saved")) {
            updateMatch.mutate({
              matchId: applyMatch.id,
              applicationStatus: "applied",
            });
            toast.success("Marked as applied.");
          }
        }}
      />

      <InterviewPrepDialog
        matchId={prepMatchId}
        jobLabel={labelFor(prepMatchId)}
        onOpenChange={(open) => {
          if (!open) setPrepMatchId(null);
        }}
      />
    </div>
  );
}
