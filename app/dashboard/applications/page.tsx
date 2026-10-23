"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { ArrowUpRight, LayoutTemplate, Plus, Search, Target } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { TIMED_STAGES, trackerStats } from "@/lib/tracker-stats";
import { ApplicationSheet, emptyDraft, type ApplicationDraft } from "@/components/dashboard/application-sheet";
import { ApplicationCanvas, type TrackedApp } from "@/components/dashboard/application-canvas";
import { BoardTemplatesDialog } from "@/components/dashboard/board-templates-dialog";
import { BoardTabs } from "@/components/dashboard/board-tabs";
import { ApplyAssistDialog } from "@/components/dashboard/apply-assist-dialog";
import { InterviewPrepDialog, interviewPrepHref } from "@/components/dashboard/interview-prep-dialog";
import { bandStyle } from "@/lib/ats-display";
import { TRACKER_STATUS_FROM_MATCH, TRACKER_STATUS_LABELS, type TrackerStatus } from "@/lib/types/applications";
import { trpc } from "@/trpc/client";
import { cn } from "@/lib/utils";

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

export default function ApplicationsPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const boardsQuery = trpc.board.boards.useQuery();
  const [pickedBoard, setPickedBoard] = useState<string | null>(null);
  const boards = boardsQuery.data ?? [];
  const activeBoard = boards.find((b) => b.id === pickedBoard) ?? boards[0];
  const boardId = activeBoard?.id ?? "";
  const appsQuery = trpc.applications.list.useQuery({ boardId }, { enabled: Boolean(boardId) });
  const boardQuery = trpc.board.list.useQuery({ boardId }, { enabled: Boolean(boardId) });
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
  const [applyMatchId, setApplyMatchId] = useState<string | null>(null);
  const [prepMatchId, setPrepMatchId] = useState<string | null>(null);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [fitKey, setFitKey] = useState(0);

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

  const [filter, setFilter] = useState("");
  const needle = filter.trim().toLowerCase();
  const stats = useMemo(() => trackerStats(apps), [apps]);

  // One-click column change (the "Move to Ghosted" nudge); the card restacks in its new frame.
  const ghost = useCallback(
    (app: TrackedApp) => {
      utils.applications.list.setData({ boardId }, (prev) =>
        prev?.map((item) => (item.id === app.id ? { ...item, status: "ghosted" as const, canvasX: null, canvasY: null } : item)),
      );
      move.mutate({ id: app.id, status: "ghosted" });
    },
    [utils, move, boardId],
  );
  const hunterCards = useMemo(
    () => hunterJobs.map((m) => ({ id: m.id, status: TRACKER_STATUS_FROM_MATCH[m.applicationStatus] as TrackerStatus })),
    [hunterJobs],
  );
  const renderHunter = (id: string) => {
    const match = hunterJobs.find((m) => m.id === id);
    if (!match) return null;
    const band = bandStyle(match.score);
    return (
      <div className="rounded-xl bg-primary/5 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary">
            <Target className="size-3" aria-hidden="true" />
            Job Hunter
          </span>
          <span className={cn("rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums", band.surface, band.text)}>{match.score}</span>
        </div>
        <p className="mt-1.5 line-clamp-2 text-sm font-semibold text-foreground">{match.posting.title}</p>
        {match.posting.company ? <p className="truncate text-xs text-muted-foreground">{match.posting.company}</p> : null}
        <div className="nodrag mt-3 flex flex-wrap gap-1.5">
          <Button size="xs" onClick={() => trackMatch.mutate({ matchId: match.id, boardId })} disabled={trackMatch.isPending}>
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
  };

  const labelFor = (matchId: string | null) => {
    const match = (matchesQuery.data ?? []).find((m) => m.id === matchId);
    return (match && [match.posting.title, match.posting.company].filter(Boolean).join(" at ")) || "this job";
  };
  const applyMatch = (matchesQuery.data ?? []).find((m) => m.id === applyMatchId) ?? null;

  return (
    // Full-bleed: the board takes the whole area beside the sidebar instead of the dashboard's centred column.
    <div className="fixed inset-x-0 bottom-0 top-16 z-30 flex flex-col bg-card lg:left-64 lg:top-0">
      <header className="flex items-center gap-x-4 gap-y-2 bg-card px-4 pt-3 pb-1 sm:flex-wrap sm:px-6">
        <h1 className="font-display text-xl font-bold text-foreground">Applications</h1>
        {apps.length > 0 ? (
          <dl className="hidden flex-wrap gap-1.5 md:flex">
            {[
              { label: "Sent", value: String(stats.sent) },
              { label: "Response", value: stats.responseRate === null ? "–" : `${stats.responseRate}%` },
              { label: "Interview", value: stats.interviewRate === null ? "–" : `${stats.interviewRate}%` },
              ...TIMED_STAGES.filter((stage) => stats.avgDays[stage] !== null).map((stage) => ({
                label: `Avg. in ${TRACKER_STATUS_LABELS[stage].toLowerCase()}`,
                value: `${(stats.avgDays[stage] ?? 0) < 1 ? "<1" : stats.avgDays[stage]} d`,
              })),
            ].map((item) => (
              <div key={item.label} className="flex items-baseline gap-1.5 rounded-lg bg-muted/60 px-2.5 py-1">
                <dt className="text-xs text-muted-foreground">{item.label}</dt>
                <dd className="text-xs font-semibold tabular-nums text-foreground">{item.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        <div className="ml-auto flex items-center gap-2">
          {apps.length > 0 ? (
            <div className="relative hidden sm:block">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder="Filter cards"
                aria-label="Filter applications"
                className="h-9 w-40 pl-9 sm:w-56"
              />
            </div>
          ) : null}
          <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-muted/60 px-3 py-1.5">
            <Switch
              checked={showHunter}
              onCheckedChange={(next) => {
                setShowHunterOverride(next);
                writeShowHunter(next);
              }}
              aria-label="Show Job Hunter jobs"
            />
            {/* Phones get the icon alone so the header stays one row; the switch keeps its full accessible name. */}
            <Target className="size-4 text-primary sm:hidden" aria-hidden="true" />
            <span className="hidden text-sm font-medium text-foreground sm:inline">Show Job Hunter jobs</span>
          </label>
          <Button variant="outline" size="sm" className="size-9 p-0 sm:h-8 sm:w-auto sm:px-3" onClick={() => setTemplatesOpen(true)}>
            <LayoutTemplate className="size-4" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">Templates</span>
          </Button>
          <Button size="sm" className="size-9 p-0 sm:h-8 sm:w-auto sm:px-3" onClick={() => openDraft(emptyDraft())}>
            <Plus className="size-4" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">New application</span>
          </Button>
        </div>
      </header>

      {activeBoard ? <BoardTabs boards={boards} activeId={boardId} onSelect={setPickedBoard} /> : null}

      <div className="relative min-h-0 flex-1">
        {!boardId || appsQuery.isLoading || boardQuery.isLoading ? (
          <Skeleton className="h-full w-full rounded-none" />
        ) : (
          <ApplicationCanvas
            key={boardId}
            boardId={boardId}
            apps={apps}
            items={boardQuery.data ?? []}
            hunter={hunterCards}
            needle={needle}
            openApp={(app) => openDraft({ ...app, customFields: app.customFields ?? [] })}
            addApp={(status) => openDraft(emptyDraft(status))}
            ghost={ghost}
            renderHunter={renderHunter}
            fitKey={fitKey}
          />
        )}
      </div>

      <BoardTemplatesDialog boardId={boardId} open={templatesOpen} onOpenChange={setTemplatesOpen} onApplied={() => setFitKey((k) => k + 1)} />

      <ApplicationSheet key={draftKey} draft={draft} boardId={boardId} boards={boards} onClose={() => setDraft(null)} />

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
