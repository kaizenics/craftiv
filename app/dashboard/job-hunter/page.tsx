"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import {
  JobImportPanel,
  type BulkImportResult,
  type JobImportValues,
} from "@/components/dashboard/job-import-panel";
import { JobMatchCard } from "@/components/dashboard/job-match-card";
import { JobPipelineBoard } from "@/components/dashboard/job-pipeline-board";
import {
  ResumeComparisonDialog,
  type ResumeComparisonResult,
} from "@/components/dashboard/resume-comparison-dialog";
import {
  JobTailorDialog,
  type TailorOutcome,
  type TailorTone,
} from "@/components/dashboard/job-tailor-dialog";
import { HuntManager, type HuntDraft, type HuntSummary } from "@/components/dashboard/hunt-manager";
import { readClipFromHash, type ClippedJob } from "@/lib/job-hunter/clip";
import { buildDemoHunts, buildDemoMatches, isDemoId } from "@/lib/job-hunter/demo";
import { cn } from "@/lib/utils";
import { ResumeCombobox, type ComboboxResume } from "@/components/dashboard/resume-combobox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageTour, useTourPending } from "@/components/onboarding/page-tour";
import { SampleBanner } from "@/components/onboarding/sample-banner";
import {
  ChevronLeft,
  ChevronRight,
  Grid,
  Filter,
  List,
  Maximize,
  Minimize,
  Plus,
  RefreshCw,
  Search,
  Target,
  X,
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
  const jobHunterTourPending = useTourPending("job-hunter");
  const sourcesQuery = trpc.jobHunter.listSources.useQuery();

  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">("all");
  const [importError, setImportError] = useState<string | null>(null);
  const [restrictionNote, setRestrictionNote] = useState<string | null>(null);
  const [busyMatchId, setBusyMatchId] = useState<string | null>(null);
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
  const [jobSearch, setJobSearch] = useState("");
  const [minimumScore, setMinimumScore] = useState("all");
  const [resumeFilter, setResumeFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"score" | "newest" | "title" | "company">("score");
  const [bulkImportResult, setBulkImportResult] = useState<BulkImportResult | null>(null);
  const [compareMatchId, setCompareMatchId] = useState<string | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ResumeComparisonResult | null>(null);
  const [mobileAddJobsOpen, setMobileAddJobsOpen] = useState(false);
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

  const bulkImportJobs = trpc.jobHunter.bulkImportJobs.useMutation({
    onSuccess: async (result) => {
      setBulkImportResult(result);
      await refresh();
      toast.success(
        `${result.imported} imported, ${result.duplicates} already saved, ${result.failed} failed.`,
      );
    },
    onError: (error) => toast.error(error.message),
  });

  const compareResumes = trpc.jobHunter.compareResumes.useMutation({
    onSuccess: (result) => setComparisonResult(result as ResumeComparisonResult),
    onError: (error) => toast.error(error.message),
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

  function handleBulkImport(urls: string[]) {
    if (!activeResumeId) {
      setImportError("Create a resume first so jobs have something to be scored against.");
      return;
    }
    setBulkImportResult(null);
    bulkImportJobs.mutate({ resumeId: activeResumeId, urls });
  }

  const realMatches = useMemo(() => matchesQuery.data ?? [], [matchesQuery.data]);

  /**
   * Sample jobs stand in for an empty pipeline while the Job Hunter tour is
   * still owed to this account, so the tour has something real-looking to point
   * at instead of an empty state.
   *
   * Only ever when the real pipeline is empty: sample data must never sit
   * alongside, or hide, jobs the person actually added. Nothing here is written
   * anywhere -- it exists only in this render.
   */
  const demoMode = jobHunterTourPending && matchesQuery.isSuccess && realMatches.length === 0;
  const demoMatches = useMemo(() => buildDemoMatches(), []);
  const demoHunts = useMemo(() => buildDemoHunts(), []);
  const matches = demoMode ? demoMatches : realMatches;
  const hunts =
    demoMode && (huntsQuery.data?.length ?? 0) === 0 ? demoHunts : (huntsQuery.data ?? []);

  /**
   * Refuses any action aimed at a sample record. Keyed on the id rather than on
   * demoMode, so a sample can never reach the API even if that flag were ever
   * computed wrong.
   */
  function refuseDemo(id: string | null | undefined): boolean {
    if (!isDemoId(id)) return false;
    toast.info("That's a sample job. Add a real one to try this.");
    return true;
  }
  const availableSources = useMemo(
    () => [...new Set(matches.map((match) => match.posting.source))].sort(),
    [matches],
  );
  const filteredMatches = useMemo(() => {
    const query = jobSearch.trim().toLowerCase();
    const scoreFloor = minimumScore === "all" ? 0 : Number(minimumScore);
    const filtered = matches.filter((match) => {
      const searchable = [
        match.posting.title,
        match.posting.company,
        match.posting.location,
        ...match.matchedKeywords,
        ...match.missingKeywords,
      ]
        .join(" ")
        .toLowerCase();
      return (
        (!query || searchable.includes(query)) &&
        match.score >= scoreFloor &&
        (resumeFilter === "all" || match.resumeId === resumeFilter) &&
        (sourceFilter === "all" || match.posting.source === sourceFilter)
      );
    });

    return filtered.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "title") return a.posting.title.localeCompare(b.posting.title);
      if (sortBy === "company") return a.posting.company.localeCompare(b.posting.company);
      return b.score - a.score;
    });
  }, [jobSearch, matches, minimumScore, resumeFilter, sortBy, sourceFilter]);
  const visibleMatches =
    statusFilter === "all"
      ? filteredMatches
      : filteredMatches.filter((match) => match.applicationStatus === statusFilter);
  const matchesForCurrentView = matchesLayout === "board" ? filteredMatches : visibleMatches;
  const totalJobPages = Math.max(1, Math.ceil(matchesForCurrentView.length / JOBS_PER_PAGE));
  const currentJobsPage = Math.min(jobsPage, totalJobPages);
  const paginatedMatches = matchesForCurrentView.slice(
    (currentJobsPage - 1) * JOBS_PER_PAGE,
    currentJobsPage * JOBS_PER_PAGE,
  );

  const counts = useMemo(() => {
    const map = new Map<ApplicationStatus, number>();
    for (const match of filteredMatches) {
      map.set(match.applicationStatus, (map.get(match.applicationStatus) ?? 0) + 1);
    }
    return map;
  }, [filteredMatches]);

  const tailorJobLabel = useMemo(() => {
    const match = matches.find((item) => item.id === tailorMatchId);
    if (!match) return "this job";
    return [match.posting.title, match.posting.company].filter(Boolean).join(" at ") || "this job";
  }, [matches, tailorMatchId]);

  const comparisonMatch = matches.find((match) => match.id === compareMatchId) ?? null;
  const activeFilterCount = [
    Boolean(jobSearch.trim()),
    minimumScore !== "all",
    resumeFilter !== "all",
    sourceFilter !== "all",
  ].filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0;

  function clearFilters() {
    setJobSearch("");
    setMinimumScore("all");
    setResumeFilter("all");
    setSourceFilter("all");
    setJobsPage(1);
  }

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
      <PageTour tour="job-hunter" />
      <header>
        <div className="flex items-center gap-2.5">
          <h1 className="font-heading text-2xl font-semibold sm:text-3xl">Job Hunter</h1>
          <Badge className="h-5 border-transparent bg-primary px-1.5 text-[10px] text-primary-foreground hover:bg-primary">
            Beta
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Bring in jobs you find, see how your resume really scores against each one, and track
          them through to applied.
        </p>
      </header>

      {/* A brand-new account has no resume, and that branch replaced the whole
          layout -- so the Job Hunter tour had nothing to point at and never
          ran. The samples are shown regardless while it is pending. */}
      {hasNoResumes && !demoMode ? (
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
          <div className="rounded-xl border border-border bg-card p-3 lg:hidden">
            <div className="flex items-end gap-2">
              <label className="min-w-0 flex-1">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">
                  Score against
                </span>
                <Select value={activeResumeId ?? undefined} onValueChange={setSelectedResumeId}>
                  <SelectTrigger className="h-10 w-full rounded-lg bg-background" aria-label="Score jobs against resume">
                    <SelectValue placeholder="Select a resume" />
                  </SelectTrigger>
                  <SelectContent>
                    {resumes.map((resume) => (
                      <SelectItem key={resume.id} value={resume.id}>
                        {resume.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <Button
                type="button"
                className="h-10 shrink-0 px-4"
                onClick={() => setMobileAddJobsOpen(true)}
              >
                <Plus className="size-4" aria-hidden="true" />
                Add jobs
              </Button>
            </div>
          </div>

          <aside data-tour="jobhunter-intake" className="hidden space-y-4 lg:sticky lg:top-6 lg:col-span-2 lg:block">
            <div className="rounded-xl border border-border bg-card p-4">
              <ResumeCombobox
                resumes={resumes}
                selectedId={activeResumeId}
                onSelect={setSelectedResumeId}
                label="Score against"
              />
            </div>

            <JobImportPanel
              disabled={!activeResumeId}
              pending={importJob.isPending || bulkImportJobs.isPending}
              searchPending={searchSource.isPending}
              platformSearchAvailable={onlineJobsPollable}
              error={importError}
              restrictionNote={restrictionNote}
              prefill={incomingClip}
              bulkResult={bulkImportResult}
              onDetectUrl={handleDetectUrl}
              onSubmit={handleImport}
              onBulkSubmit={handleBulkImport}
              onPlatformSearch={(query) => {
                if (!activeResumeId) return;
                searchSource.mutate({ resumeId: activeResumeId, query, limit: 5 });
              }}
            />
          </aside>

          <Drawer open={mobileAddJobsOpen} onOpenChange={setMobileAddJobsOpen}>
            <DrawerContent className="h-[85dvh] max-h-[85dvh] p-0 before:inset-0 before:rounded-b-none before:rounded-t-2xl lg:hidden">
              <DrawerHeader className="sr-only">
                <DrawerTitle>Add jobs</DrawerTitle>
                <DrawerDescription>
                  Search a job platform or import jobs into your pipeline.
                </DrawerDescription>
              </DrawerHeader>
              <JobImportPanel
                embedded
                disabled={!activeResumeId}
                pending={importJob.isPending || bulkImportJobs.isPending}
                searchPending={searchSource.isPending}
                platformSearchAvailable={onlineJobsPollable}
                error={importError}
                restrictionNote={restrictionNote}
                prefill={incomingClip}
                bulkResult={bulkImportResult}
                onDetectUrl={handleDetectUrl}
                onSubmit={handleImport}
                onBulkSubmit={handleBulkImport}
                onPlatformSearch={(query) => {
                  if (!activeResumeId) return;
                  searchSource.mutate({ resumeId: activeResumeId, query, limit: 5 });
                }}
              />
            </DrawerContent>
          </Drawer>

          <section className="lg:col-span-3 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Tabs data-tour="jobhunter-views" value={view} onValueChange={(value) => setView(value as "matches" | "hunts")}>
                <TabsList>
                  <TabsTrigger value="matches">Jobs</TabsTrigger>
                  <TabsTrigger value="hunts">
                    Scheduled hunts ({hunts.length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Rows saved by an older parser keep whatever it read. This
                  re-fetches them in place rather than making anyone delete and
                  re-add every job. */}
              {onlineJobsPollable && view === "matches" && realMatches.length > 0 ? (
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
                hunts={hunts as HuntSummary[]}
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
                onToggleActive={(hunt, isActive) => {
                  if (refuseDemo(hunt.id)) return;
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
                  });
                }}
                onRunNow={(huntId) => {
                  if (refuseDemo(huntId)) return;
                  setRunningHuntId(huntId);
                  runHuntNow.mutate({ id: huntId });
                }}
                onDelete={(huntId) => {
                  if (refuseDemo(huntId)) return;
                  deleteHunt.mutate({ id: huntId });
                }}
              />
            ) : (
            <div
              data-tour="jobhunter-pipeline"
              className={cn(
                "space-y-4",
                boardFullscreen &&
                  "fixed inset-0 z-50 flex flex-col overflow-hidden bg-background p-4 transition-[opacity,transform] duration-200 ease-out sm:p-6",
                boardFullscreen &&
                  (boardFullscreenActive ? "scale-100 opacity-100" : "scale-[0.985] opacity-0"),
              )}
            >
              {demoMode ? (
                <SampleBanner title="Sample jobs.">
                  These show how Job Hunter scores and tracks roles. They are not saved, and they
                  disappear when the tour ends.
                </SampleBanner>
              ) : null}
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
                  {filteredMatches.length === matches.length
                    ? `${matches.length} ${matches.length === 1 ? "job" : "jobs"} in your pipeline`
                    : `${filteredMatches.length} of ${matches.length} jobs`}
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

              <section
                aria-label="Filter and sort jobs"
                className="overflow-hidden rounded-lg border border-border bg-card"
              >
                <div className="grid gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
                  <div className="relative">
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      value={jobSearch}
                      onChange={(event) => {
                        setJobSearch(event.target.value);
                        setJobsPage(1);
                      }}
                      className="h-10 rounded-lg bg-background pl-9 pr-9"
                      placeholder="Search title, company, location, or keyword"
                      aria-label="Search jobs"
                    />
                    {jobSearch ? (
                      <button
                        type="button"
                        onClick={() => {
                          setJobSearch("");
                          setJobsPage(1);
                        }}
                        className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label="Clear job search"
                      >
                        <X className="size-3.5" aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">Sort</span>
                    <Select
                      value={sortBy}
                      onValueChange={(value) => {
                        setSortBy(value as typeof sortBy);
                        setJobsPage(1);
                      }}
                    >
                      <SelectTrigger className="h-10 w-full rounded-lg bg-background" aria-label="Sort jobs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="score">Best match</SelectItem>
                        <SelectItem value="newest">Newest added</SelectItem>
                        <SelectItem value="title">Job title</SelectItem>
                        <SelectItem value="company">Company</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-border bg-muted/20 p-3 xl:flex-row xl:items-end xl:justify-between">
                  <div className="flex flex-wrap items-end gap-2.5">
                    <div className="mr-1 flex h-9 items-center gap-2 text-sm font-medium">
                      <Filter className="size-4 text-muted-foreground" aria-hidden="true" />
                      <span>Filters</span>
                      {hasActiveFilters ? (
                        <span className="flex size-5 items-center justify-center rounded-md bg-primary text-[11px] font-semibold text-primary-foreground tabular-nums">
                          {activeFilterCount}
                        </span>
                      ) : null}
                    </div>

                    <label className="grid gap-1">
                      <span className="text-[11px] font-medium text-muted-foreground">Match score</span>
                      <Select
                        value={minimumScore}
                        onValueChange={(value) => {
                          setMinimumScore(value);
                          setJobsPage(1);
                        }}
                      >
                        <SelectTrigger className="w-32 rounded-lg bg-background" aria-label="Minimum match score">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any score</SelectItem>
                          <SelectItem value="60">60+ match</SelectItem>
                          <SelectItem value="70">70+ match</SelectItem>
                          <SelectItem value="80">80+ match</SelectItem>
                          <SelectItem value="90">90+ match</SelectItem>
                        </SelectContent>
                      </Select>
                    </label>

                    <label className="grid min-w-40 flex-1 gap-1 sm:flex-none">
                      <span className="text-[11px] font-medium text-muted-foreground">Resume</span>
                      <Select
                        value={resumeFilter}
                        onValueChange={(value) => {
                          setResumeFilter(value);
                          setJobsPage(1);
                        }}
                      >
                        <SelectTrigger className="w-full rounded-lg bg-background sm:w-44" aria-label="Filter by resume">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All resumes</SelectItem>
                          {resumes.map((resume) => (
                            <SelectItem key={resume.id} value={resume.id}>
                              {resume.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </label>

                    <label className="grid min-w-36 flex-1 gap-1 sm:flex-none">
                      <span className="text-[11px] font-medium text-muted-foreground">Source</span>
                      <Select
                        value={sourceFilter}
                        onValueChange={(value) => {
                          setSourceFilter(value);
                          setJobsPage(1);
                        }}
                      >
                        <SelectTrigger className="w-full rounded-lg bg-background sm:w-40" aria-label="Filter by source">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All sources</SelectItem>
                          {availableSources.map((source) => (
                            <SelectItem key={source} value={source}>
                              {sourcesQuery.data?.find((item) => item.id === source)?.label ?? source}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </label>
                  </div>

                  {hasActiveFilters ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-9 self-start text-muted-foreground xl:self-auto"
                      onClick={clearFilters}
                    >
                      <X className="size-4" aria-hidden="true" />
                      Clear all
                    </Button>
                  ) : null}
                </div>
              </section>

              {matchesLayout === "board" ? (
                matchesQuery.isLoading ? (
                  <div className="h-80 animate-pulse rounded-lg bg-muted/60" aria-hidden="true" />
                ) : filteredMatches.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-8 text-center">
                    <p className="font-heading text-base font-semibold">
                      {matches.length === 0 ? "No jobs yet" : "No jobs match your filters"}
                    </p>
                    <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                      {matches.length === 0
                        ? "Paste a job description on the left to add your first pipeline card."
                        : "Clear or adjust the filters to see more jobs."}
                    </p>
                  </div>
                ) : (
                  <JobPipelineBoard
                    matches={paginatedMatches}
                    busyMatchId={busyMatchId}
                    fullscreen={boardFullscreen}
                    onStatusChange={(matchId, status) => {
                      if (refuseDemo(matchId)) return;
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
                <TabsTrigger value="all">All ({filteredMatches.length})</TabsTrigger>
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
                      canCompare={resumes.length >= 2}
                      onStatusChange={(status) => {
                        if (refuseDemo(match.id)) return;
                        setBusyMatchId(match.id);
                        updateMatch.mutate({ matchId: match.id, applicationStatus: status });
                      }}
                      onRescore={() => {
                        if (refuseDemo(match.id)) return;
                        setBusyMatchId(match.id);
                        rescore.mutate({
                          matchId: match.id,
                          resumeId: activeResumeId ?? undefined,
                        });
                      }}
                      onTailor={() => {
                        if (refuseDemo(match.id)) return;
                        // Fresh dialog state per job, so a previous result is
                        // never shown against a different posting.
                        setTailorOutcome(null);
                        setSavedKinds([]);
                        setTailorMatchId(match.id);
                      }}
                      onCompare={() => {
                        if (refuseDemo(match.id)) return;
                        setComparisonResult(null);
                        setCompareMatchId(match.id);
                      }}
                      onDelete={() => {
                        if (refuseDemo(match.id)) return;
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
        // The buttons that open this dialog already refuse samples; these repeat
        // the check where the request is actually sent, so a sample id cannot
        // reach the API however the dialog came to be open.
        onRun={() => {
          if (!tailorMatchId || refuseDemo(tailorMatchId)) return;
          setTailorOutcome(null);
          tailor.mutate({ matchId: tailorMatchId, tone: tailorTone });
        }}
        onSave={(kind) => {
          if (!tailorMatchId || refuseDemo(tailorMatchId)) return;
          setSavingKind(kind);
          saveToDocuments.mutate({ matchId: tailorMatchId, kind });
        }}
      />

      {comparisonMatch ? (
        <ResumeComparisonDialog
          key={comparisonMatch.id}
          open={compareMatchId !== null}
          matchResumeId={comparisonMatch.resumeId}
          resumes={resumes}
          pending={compareResumes.isPending}
          result={comparisonResult}
          onOpenChange={(open) => {
            if (!open) {
              setCompareMatchId(null);
              setComparisonResult(null);
            }
          }}
          onCompare={(resumeIds) => {
            if (refuseDemo(comparisonMatch.id)) return;
            compareResumes.mutate({ matchId: comparisonMatch.id, resumeIds });
          }}
        />
      ) : null}
    </div>
  );
}
