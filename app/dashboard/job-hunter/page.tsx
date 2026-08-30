"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { JobImportPanel, type JobImportValues } from "@/components/dashboard/job-import-panel";
import { JobMatchCard } from "@/components/dashboard/job-match-card";
import { JobPipelineBoard } from "@/components/dashboard/job-pipeline-board";
import {
  JobTailorDialog,
  type TailorOutcome,
  type TailorTone,
} from "@/components/dashboard/job-tailor-dialog";
import { HuntManager, type HuntDraft, type HuntSummary } from "@/components/dashboard/hunt-manager";
import { readClipFromHash, type ClippedJob } from "@/lib/job-hunter/clip";
import { cn } from "@/lib/utils";
import { ResumeCombobox, type ComboboxResume } from "@/components/dashboard/resume-combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  ChevronRight,
  Grid,
  List,
  Loader2,
  Maximize,
  Minimize,
  RefreshCw,
  Search,
  Target,
} from "@/components/ui/icons";
import { trpc } from "@/trpc/client";
import { saveJobTargetDraft } from "@/lib/ats-client-store";
import {
  APPLICATION_PIPELINE_ORDER,
  APPLICATION_STATUS_LABELS,
  type ApplicationStatus,
} from "@/lib/types/job-hunter";

/**
 * Job Hunter.
 *
 * Everything on this page is free: importing a job is deterministic parsing and
 * scoring runs the ATS engine in lib/ats.ts, which makes no model call. Tailoring
 * -- the part that costs credits -- lands in the next phase.
 */
export default function JobHunterPage() {
  const JOBS_PER_PAGE = 6;
  const utils = trpc.useUtils();

  const resumesQuery = trpc.resume.listSummary.useQuery();
  const matchesQuery = trpc.jobHunter.listMatches.useQuery({ limit: 50 });
  const sourcesQuery = trpc.jobHunter.listSources.useQuery();

  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");
  const [importError, setImportError] = useState<string | null>(null);
  const [restrictionNote, setRestrictionNote] = useState<string | null>(null);
  const [busyMatchId, setBusyMatchId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tailorMatchId, setTailorMatchId] = useState<string | null>(null);
  const [tailorTone, setTailorTone] = useState<TailorTone>("professional");
  const [tailorOutcome, setTailorOutcome] = useState<TailorOutcome | null>(null);
  const [savingKind, setSavingKind] = useState<"resume" | "cover_letter" | null>(null);
  const [savedKinds, setSavedKinds] = useState<("resume" | "cover_letter")[]>([]);
  const [runningHuntId, setRunningHuntId] = useState<string | null>(null);
  const [view, setView] = useState<"matches" | "hunts">("matches");
  const [matchesLayout, setMatchesLayout] = useState<"list" | "board">("list");
  const [jobsPage, setJobsPage] = useState(1);
  const [boardFullscreen, setBoardFullscreen] = useState(false);
  const [boardFullscreenActive, setBoardFullscreenActive] = useState(false);
  /**
   * A clipped job arrives in the URL fragment, which never reaches the server.
   *
   * It only prefills the import form -- the user still presses the button --
   * so following a link someone sent can never write to their pipeline.
   *
   * Read in a lazy initialiser rather than an effect: the fragment is already
   * there on first render, and this avoids a setState-driven second pass. It
   * does not affect rendered markup, so server and client still agree.
   */
  const [incomingClip] = useState<ClippedJob | null>(() =>
    typeof window === "undefined" ? null : readClipFromHash(window.location.hash),
  );

  // Clearing the address bar is a side effect on an external system, so it
  // belongs here. Stops a reload resurrecting the clip and keeps the job text
  // out of the URL.
  useEffect(() => {
    if (incomingClip && window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [incomingClip]);

  useEffect(() => {
    if (!boardFullscreen) return;

    const animationFrame = window.requestAnimationFrame(() => {
      setBoardFullscreenActive(true);
    });
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeBoardFullscreen();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [boardFullscreen]);

  function openBoardFullscreen() {
    setBoardFullscreenActive(false);
    setBoardFullscreen(true);
  }

  function closeBoardFullscreen() {
    setBoardFullscreenActive(false);
    window.setTimeout(() => setBoardFullscreen(false), 200);
  }

  const resumes: ComboboxResume[] = useMemo(
    () =>
      (resumesQuery.data ?? []).map((resume) => ({
        id: resume.id,
        title: resume.title,
        status: resume.status,
        updatedAt: resume.updatedAt,
      })),
    [resumesQuery.data],
  );

  // Default to the most recently edited resume so the page is usable on arrival.
  const activeResumeId = selectedResumeId ?? resumes[0]?.id ?? null;

  const resumeUpdatedAt = useMemo(() => {
    const resume = (resumesQuery.data ?? []).find((item) => item.id === activeResumeId);
    return resume ? new Date(resume.updatedAt).getTime() : null;
  }, [resumesQuery.data, activeResumeId]);

  const attributionBySource = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const source of sourcesQuery.data ?? []) {
      map.set(source.id, source.attribution);
    }
    return map;
  }, [sourcesQuery.data]);

  async function refresh() {
    await Promise.all([utils.jobHunter.listMatches.invalidate(), utils.jobHunter.stats.invalidate()]);
  }

  const importJob = trpc.jobHunter.importJob.useMutation({
    onSuccess: async (result) => {
      setImportError(null);
      await refresh();
      toast.success(result.deduped ? "Already in your pipeline — score updated." : "Job scored.");
    },
    onError: (error) => setImportError(error.message),
  });

  const updateMatch = trpc.jobHunter.updateMatch.useMutation({
    onSuccess: refresh,
    onError: (error) => toast.error(error.message),
    onSettled: () => setBusyMatchId(null),
  });

  const rescore = trpc.jobHunter.rescore.useMutation({
    onSuccess: async (result) => {
      await refresh();
      const delta = result.score - result.previousScore;
      toast.success(
        delta === 0
          ? `Score unchanged at ${result.score}.`
          : `Score moved ${result.previousScore} → ${result.score}.`,
      );
    },
    onError: (error) => toast.error(error.message),
    onSettled: () => setBusyMatchId(null),
  });

  const searchSource = trpc.jobHunter.searchSource.useMutation({
    onSuccess: async (result) => {
      await refresh();
      toast.success(
        result.found === 0
          ? "No jobs found for that search."
          : `Found ${result.found} — ${result.imported} new, ${result.deduped} already saved.`,
      );
    },
    onError: (error) => toast.error(error.message),
  });

  const tailor = trpc.jobHunter.tailor.useMutation({
    onSuccess: async (result) => {
      setTailorOutcome(result as TailorOutcome);
      await refresh();
      // A refunded, rejected rewrite is not an error -- the guarantee worked --
      // so it is reported as information rather than a failure toast.
      if (!result.accepted) toast.info("Credits returned — the rewrite did not improve the score.");
    },
    onError: (error) => toast.error(error.message),
  });

  const saveToDocuments = trpc.jobHunter.saveToDocuments.useMutation({
    onSuccess: async (_result, variables) => {
      setSavedKinds((current) => [...current, variables.kind]);
      await Promise.all([
        utils.resume.listSummary.invalidate(),
        utils.resume.list.invalidate(),
        utils.coverLetter.listSummary.invalidate(),
      ]);
      toast.success("Saved to your documents.");
    },
    onError: (error) => toast.error(error.message),
    onSettled: () => setSavingKind(null),
  });

  const huntsQuery = trpc.jobHunter.listHunts.useQuery();

  const upsertHunt = trpc.jobHunter.upsertHunt.useMutation({
    onSuccess: async () => {
      await utils.jobHunter.listHunts.invalidate();
      toast.success("Hunt saved.");
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteHunt = trpc.jobHunter.deleteHunt.useMutation({
    onSuccess: async () => {
      await utils.jobHunter.listHunts.invalidate();
      toast.success("Hunt deleted.");
    },
    onError: (error) => toast.error(error.message),
  });

  const runHuntNow = trpc.jobHunter.runHuntNow.useMutation({
    onSuccess: async (result) => {
      await Promise.all([refresh(), utils.jobHunter.listHunts.invalidate()]);

      if (!result.claimed) {
        // The unique run key did its job: another tick already holds this slot.
        toast.info("That hunt is already running.");
        return;
      }
      if (result.status === "failed") {
        toast.error("The hunt failed. Check the run history.");
        return;
      }
      toast.success(
        `${result.jobsNew} new job${result.jobsNew === 1 ? "" : "s"}, ${result.matchesRescored} re-scored.`,
      );
    },
    onError: (error) => toast.error(error.message),
    onSettled: () => setRunningHuntId(null),
  });

  const refreshPostings = trpc.jobHunter.refreshPostings.useMutation({
    onSuccess: async (result) => {
      await refresh();
      toast.success(
        result.refreshed === 0
          ? "Nothing needed refreshing."
          : `Refreshed ${result.refreshed} job${result.refreshed === 1 ? "" : "s"}, re-scored ${result.rescored}.` +
              (result.failed > 0 ? ` ${result.failed} could not be read.` : ""),
      );
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMatch = trpc.jobHunter.deleteMatch.useMutation({
    onSuccess: refresh,
    onError: (error) => toast.error(error.message),
    onSettled: () => setBusyMatchId(null),
  });

  function handleDetectUrl(value: string) {
    const trimmed = value.trim();
    if (!trimmed) {
      setRestrictionNote(null);
      return;
    }

    // Host-based, so the note appears as soon as the user pastes an
    // OnlineJobs.ph link and explains why Craftiv cannot search it for them.
    const isOnlineJobs = /(^|\/\/|\.)onlinejobs\.ph(\/|$)/i.test(trimmed);
    const source = (sourcesQuery.data ?? []).find((item) => item.id === "onlinejobs_ph");
    setRestrictionNote(isOnlineJobs ? source?.restrictionNote ?? null : null);
  }

  function handleImport(values: JobImportValues) {
    if (!activeResumeId) {
      setImportError("Create a resume first so jobs have something to be scored against.");
      return;
    }

    importJob.mutate({ resumeId: activeResumeId, ...values });

    // Keep the shared job target in step, so "Use in ATS Checker" and the AI
    // assistant pick this job up on their next visit. Writing through
    // saveJobTargetDraft is the supported path into that localStorage clipboard.
    if (values.description) {
      saveJobTargetDraft({
        role: values.title ?? "",
        jobDescription: values.description,
      });
    }
  }

  const matches = useMemo(() => matchesQuery.data ?? [], [matchesQuery.data]);
  const visibleMatches =
    statusFilter === "all"
      ? matches
      : matches.filter((match) => match.applicationStatus === statusFilter);
  const matchesForCurrentView = matchesLayout === "board" ? matches : visibleMatches;
  const totalJobPages = Math.max(1, Math.ceil(matchesForCurrentView.length / JOBS_PER_PAGE));
  const currentJobsPage = Math.min(jobsPage, totalJobPages);
  const paginatedMatches = matchesForCurrentView.slice(
    (currentJobsPage - 1) * JOBS_PER_PAGE,
    currentJobsPage * JOBS_PER_PAGE,
  );

  const counts = useMemo(() => {
    const map = new Map<ApplicationStatus, number>();
    for (const match of matches) {
      map.set(match.applicationStatus, (map.get(match.applicationStatus) ?? 0) + 1);
    }
    return map;
  }, [matches]);

  const tailorJobLabel = useMemo(() => {
    const match = matches.find((item) => item.id === tailorMatchId);
    if (!match) return "this job";
    return [match.posting.title, match.posting.company].filter(Boolean).join(" at ") || "this job";
  }, [matches, tailorMatchId]);

  const hasNoResumes = resumesQuery.isSuccess && resumes.length === 0;

  // Only true when the operator has opted into scraping. Otherwise the search
  // panel stays hidden and paste/URL import is the whole surface.
  const onlineJobsPollable = Boolean(
    (sourcesQuery.data ?? []).find((source) => source.id === "onlinejobs_ph")?.pollable,
  );

  // Only sources the scheduler is allowed to poll can back a scheduled hunt.
  const pollableSources = useMemo(
    () =>
      (sourcesQuery.data ?? [])
        .filter((source) => source.pollable)
        .map((source) => ({ id: source.id, label: source.label })),
    [sourcesQuery.data],
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">Job Hunter</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bring in jobs you find, see how your resume really scores against each one, and track
          them through to applied.
        </p>
      </header>

      {hasNoResumes ? (
        <section className="rounded-xl border border-border bg-card p-8 text-center">
          <Target className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-3 font-heading text-lg font-semibold">Create a resume first</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Job Hunter scores every job against one of your resumes, so you need at least one
            before you can start.
          </p>
          <Button asChild className="mt-4">
            <Link href="/resume/templates">Build a resume</Link>
          </Button>
        </section>
      ) : (
        <div className="grid gap-6 lg:grid-cols-5 lg:items-start">
          <aside className="space-y-4 lg:sticky lg:top-6 lg:col-span-2">
            <div className="rounded-xl border border-border bg-card p-4">
              <ResumeCombobox
                resumes={resumes}
                selectedId={activeResumeId}
                onSelect={setSelectedResumeId}
                label="Score against"
              />
            </div>

            {onlineJobsPollable ? (
              <section
                aria-labelledby="job-search-heading"
                className="rounded-xl border border-border bg-card p-4"
              >
                <h2 id="job-search-heading" className="font-heading text-base font-semibold">
                  Search OnlineJobs.ph
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Fetches public postings and scores each one. Bounded per search and rate
                  limited.
                </p>
                <div className="mt-3 flex gap-2">
                  <label htmlFor="job-search" className="sr-only">
                    Search keyword
                  </label>
                  <Input
                    id="job-search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="virtual assistant"
                    disabled={searchSource.isPending}
                  />
                  <Button
                    onClick={() => {
                      if (!activeResumeId || searchQuery.trim().length < 2) return;
                      searchSource.mutate({
                        resumeId: activeResumeId,
                        query: searchQuery.trim(),
                        limit: 5,
                      });
                    }}
                    disabled={
                      !activeResumeId || searchQuery.trim().length < 2 || searchSource.isPending
                    }
                  >
                    {searchSource.isPending ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Search className="size-4" aria-hidden="true" />
                    )}
                    <span className="sr-only">Search</span>
                  </Button>
                </div>
              </section>
            ) : null}

            <JobImportPanel
              disabled={!activeResumeId}
              pending={importJob.isPending}
              error={importError}
              restrictionNote={restrictionNote}
              prefill={incomingClip}
              onDetectUrl={handleDetectUrl}
              onSubmit={handleImport}
            />
          </aside>

          <section className="lg:col-span-3 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Tabs value={view} onValueChange={(value) => setView(value as "matches" | "hunts")}>
                <TabsList>
                  <TabsTrigger value="matches">Jobs</TabsTrigger>
                  <TabsTrigger value="hunts">
                    Scheduled hunts ({huntsQuery.data?.length ?? 0})
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Rows saved by an older parser keep whatever it read. This
                  re-fetches them in place rather than making anyone delete and
                  re-add every job. */}
              {onlineJobsPollable && view === "matches" && matches.length > 0 ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refreshPostings.mutate({ limit: 25 })}
                  disabled={refreshPostings.isPending}
                >
                  <RefreshCw
                    className={cn("size-4", refreshPostings.isPending && "animate-spin")}
                    aria-hidden="true"
                  />
                  {refreshPostings.isPending ? "Refreshing…" : "Refresh job details"}
                </Button>
              ) : null}
            </div>

            {view === "hunts" ? (
              <HuntManager
                hunts={(huntsQuery.data ?? []) as HuntSummary[]}
                loading={huntsQuery.isLoading}
                pollableSources={pollableSources}
                savingHunt={upsertHunt.isPending}
                runningHuntId={runningHuntId}
                canCreate={Boolean(activeResumeId)}
                onCreate={(draft: HuntDraft) => {
                  if (!activeResumeId) return;
                  upsertHunt.mutate({
                    ...draft,
                    resumeId: activeResumeId,
                    // Only pollable sources are offered, so a hunt can never be
                    // configured to search something its terms forbid.
                    sources: pollableSources.map((source) => source.id) as never,
                    location: "",
                    minScore: 0,
                    isActive: true,
                  });
                }}
                onToggleActive={(hunt, isActive) =>
                  upsertHunt.mutate({
                    id: hunt.id,
                    name: hunt.name,
                    query: hunt.query,
                    location: "",
                    sources: pollableSources.map((source) => source.id) as never,
                    resumeId: activeResumeId ?? "",
                    frequency: hunt.frequency,
                    runAtMinuteUtc: hunt.runAtMinuteUtc,
                    minScore: 0,
                    emailDigest: hunt.emailDigest,
                    isActive,
                  })
                }
                onRunNow={(huntId) => {
                  setRunningHuntId(huntId);
                  runHuntNow.mutate({ id: huntId });
                }}
                onDelete={(huntId) => deleteHunt.mutate({ id: huntId })}
              />
            ) : (
            <div
              className={cn(
                "space-y-4",
                boardFullscreen &&
                  "fixed inset-0 z-50 flex flex-col overflow-hidden bg-background p-4 transition-[opacity,transform] duration-200 ease-out sm:p-6",
                boardFullscreen &&
                  (boardFullscreenActive ? "scale-100 opacity-100" : "scale-[0.985] opacity-0"),
              )}
            >
              {boardFullscreen ? (
                <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
                  <div>
                    <h2 className="font-heading text-lg font-semibold">Application pipeline</h2>
                    <p className="text-sm text-muted-foreground">
                      Drag jobs between stages to keep your search organized.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={closeBoardFullscreen}
                  >
                    <Minimize className="size-4" aria-hidden="true" />
                    Exit full screen
                  </Button>
                </div>
              ) : null}

              <div
                className={cn(
                  "flex items-center justify-between gap-3",
                  boardFullscreen && "hidden",
                )}
              >
                <p className="text-sm text-muted-foreground">
                  {matches.length} {matches.length === 1 ? "job" : "jobs"} in your pipeline
                </p>
                <div className="flex rounded-lg border border-border bg-muted/30 p-0.5" aria-label="Pipeline layout">
                  <Button
                    type="button"
                    variant={matchesLayout === "list" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => {
                      setMatchesLayout("list");
                      setJobsPage(1);
                      setBoardFullscreen(false);
                    }}
                    aria-pressed={matchesLayout === "list"}
                  >
                    <List className="size-3.5" aria-hidden="true" />
                    List
                  </Button>
                  <Button
                    type="button"
                    variant={matchesLayout === "board" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => {
                      setMatchesLayout("board");
                      setJobsPage(1);
                    }}
                    aria-pressed={matchesLayout === "board"}
                  >
                    <Grid className="size-3.5" aria-hidden="true" />
                    Board
                  </Button>
                  {matchesLayout === "board" && !boardFullscreen ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={openBoardFullscreen}
                      aria-label="Open Kanban in full screen"
                    >
                      <Maximize className="size-3.5" aria-hidden="true" />
                      Full screen
                    </Button>
                  ) : null}
                </div>
              </div>

              {matchesLayout === "board" ? (
                matchesQuery.isLoading ? (
                  <div className="h-80 animate-pulse rounded-lg bg-muted/60" aria-hidden="true" />
                ) : matches.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-8 text-center">
                    <p className="font-heading text-base font-semibold">No jobs yet</p>
                    <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                      Paste a job description on the left to add your first pipeline card.
                    </p>
                  </div>
                ) : (
                  <JobPipelineBoard
                    matches={paginatedMatches}
                    busyMatchId={busyMatchId}
                    fullscreen={boardFullscreen}
                    onStatusChange={(matchId, status) => {
                      setBusyMatchId(matchId);
                      updateMatch.mutate({ matchId, applicationStatus: status });
                    }}
                  />
                )
              ) : (
            <Tabs
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as ApplicationStatus | "all");
                setJobsPage(1);
              }}
            >
              <TabsList className="flex w-full flex-wrap">
                <TabsTrigger value="all">All ({matches.length})</TabsTrigger>
                {APPLICATION_PIPELINE_ORDER.map((status) => (
                  <TabsTrigger key={status} value={status}>
                    {APPLICATION_STATUS_LABELS[status]} ({counts.get(status) ?? 0})
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value={statusFilter} className="mt-4 space-y-3">
                {matchesQuery.isLoading ? (
                  <ul className="space-y-3" aria-hidden="true">
                    {[0, 1, 2].map((key) => (
                      <li key={key} className="h-40 animate-pulse rounded-xl bg-muted/60" />
                    ))}
                  </ul>
                ) : visibleMatches.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-8 text-center">
                    <p className="font-heading text-base font-semibold">
                      {matches.length === 0 ? "No jobs yet" : "Nothing in this column"}
                    </p>
                    <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                      {matches.length === 0
                        ? "Paste a job description on the left to see how your resume scores against it."
                        : "Move a job into this stage from its status menu."}
                    </p>
                  </div>
                ) : (
                  paginatedMatches.map((match) => (
                    <JobMatchCard
                      key={match.id}
                      match={match}
                      stale={
                        resumeUpdatedAt !== null &&
                        match.resumeId === activeResumeId &&
                        Math.floor(resumeUpdatedAt / 1000) >
                          Math.floor(new Date(match.resumeVersionAt).getTime() / 1000)
                      }
                      attribution={attributionBySource.get(match.posting.source) ?? null}
                      busy={busyMatchId === match.id}
                      onStatusChange={(status) => {
                        setBusyMatchId(match.id);
                        updateMatch.mutate({ matchId: match.id, applicationStatus: status });
                      }}
                      onRescore={() => {
                        setBusyMatchId(match.id);
                        rescore.mutate({
                          matchId: match.id,
                          resumeId: activeResumeId ?? undefined,
                        });
                      }}
                      onTailor={() => {
                        // Fresh dialog state per job, so a previous result is
                        // never shown against a different posting.
                        setTailorOutcome(null);
                        setSavedKinds([]);
                        setTailorMatchId(match.id);
                      }}
                      onDelete={() => {
                        setBusyMatchId(match.id);
                        deleteMatch.mutate({ matchId: match.id });
                      }}
                    />
                  ))
                )}
              </TabsContent>
            </Tabs>
              )}

              {!matchesQuery.isLoading && matchesForCurrentView.length > JOBS_PER_PAGE ? (
                <nav
                  className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"
                  aria-label="Jobs pagination"
                >
                  <p className="text-xs text-muted-foreground">
                    Showing {(currentJobsPage - 1) * JOBS_PER_PAGE + 1}–{Math.min(
                      currentJobsPage * JOBS_PER_PAGE,
                      matchesForCurrentView.length,
                    )} of {matchesForCurrentView.length} jobs
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => setJobsPage((page) => Math.max(1, page - 1))}
                      disabled={currentJobsPage === 1}
                    >
                      <ChevronLeft className="size-4" aria-hidden="true" />
                      Previous
                    </Button>
                    <span className="min-w-16 text-center text-xs font-medium tabular-nums">
                      {currentJobsPage} / {totalJobPages}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => setJobsPage((page) => Math.min(totalJobPages, page + 1))}
                      disabled={currentJobsPage === totalJobPages}
                    >
                      Next
                      <ChevronRight className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                </nav>
              ) : null}
            </div>
            )}
          </section>
        </div>
      )}

      <JobTailorDialog
        open={tailorMatchId !== null}
        onOpenChange={(open) => {
          if (!open) setTailorMatchId(null);
        }}
        jobLabel={tailorJobLabel}
        tone={tailorTone}
        onToneChange={setTailorTone}
        pending={tailor.isPending}
        outcome={tailorOutcome}
        savingKind={savingKind}
        savedKinds={savedKinds}
        onRun={() => {
          if (!tailorMatchId) return;
          setTailorOutcome(null);
          tailor.mutate({ matchId: tailorMatchId, tone: tailorTone });
        }}
        onSave={(kind) => {
          if (!tailorMatchId) return;
          setSavingKind(kind);
          saveToDocuments.mutate({ matchId: tailorMatchId, kind });
        }}
      />
    </div>
  );
}
