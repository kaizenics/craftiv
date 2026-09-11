"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import { AiResultActions } from "@/components/dashboard/ai-result-actions";
import { AiSuggestionBlock } from "@/components/dashboard/ai-suggestion-block";
import { AtsImpactSummary } from "@/components/dashboard/ats-impact-summary";
import { ResumeCombobox } from "@/components/dashboard/resume-combobox";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Briefcase,
  Check,
  FileText,
  Loader2,
  ScrollText,
  Sparkles,
  Target,
  Trophy,
} from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/trpc/client";
import { PageTour, useTourPending } from "@/components/onboarding/page-tour";
import { SampleBanner } from "@/components/onboarding/sample-banner";
import { SAMPLE_REWRITE } from "@/lib/tour-samples";
import type { ResumeDataJSON } from "@/db/schema";
import type { AtsImpact } from "@/lib/ats";
import { saveJobTargetDraft, useJobTargetDraft } from "@/lib/ats-client-store";
import {
  formatResumeDataAsText,
  parseContentBlocks,
  type ImprovedResume,
} from "@/lib/ai-resume-content";
import { EXP_SPLIT_TOKEN } from "@/lib/prompts";
import { cn } from "@/lib/utils";

type Tool = "improver" | "keywords" | "achievements";
type Goal = "summary" | "experience" | "full";

type FullImprovedBlock = {
  key: string;
  label: string;
  value: string;
  before: string;
  type: "summary" | "experience" | "education";
};

const TOOLS: {
  id: Tool;
  label: string;
  description: string;
  icon: typeof Sparkles;
  credits: string;
}[] = [
  {
    id: "improver",
    label: "Resume Improver",
    description: "Rewrite your summary, experience, or the whole resume.",
    icon: Sparkles,
    credits: "0.5",
  },
  {
    id: "keywords",
    label: "Keyword Booster",
    description: "Find terms the job description wants that your resume is missing.",
    icon: Target,
    credits: "0.25",
  },
  {
    id: "achievements",
    label: "Achievement Builder",
    description: "Turn duty-style bullets into measurable accomplishments.",
    icon: Trophy,
    credits: "0.25",
  },
];

const GOALS: { id: Goal; label: string; hint: string; icon: typeof ScrollText }[] = [
  {
    id: "summary",
    label: "Rewrite summary",
    hint: "Sharpen the opening paragraph.",
    icon: ScrollText,
  },
  {
    id: "experience",
    label: "Improve experience",
    hint: "Rewrite every role's bullets.",
    icon: Briefcase,
  },
  {
    id: "full",
    label: "Improve full resume",
    hint: "Summary, experience, and education.",
    icon: FileText,
  },
];

const IMPORTANCE_STYLES: Record<string, string> = {
  high: "border-destructive-border bg-destructive-surface text-destructive-surface-foreground",
  medium: "border-warning-border bg-warning-surface text-warning-surface-foreground",
  low: "border-border bg-muted text-muted-foreground",
};

function ResultSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {[0, 1].map((key) => (
        <div key={key} className="overflow-hidden rounded-xl border border-border">
          <div className="h-10 animate-pulse bg-muted/60" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-full animate-pulse rounded bg-muted" />
            <div className="h-3 w-11/12 animate-pulse rounded bg-muted" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AIAssistantPage() {
  const [activeTool, setActiveTool] = useState<Tool>("improver");
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);

  // One job target for the whole page. These used to be four separate fields
  // (role and description duplicated per tool) that were seeded from the same
  // draft and then silently diverged, so a description pasted in one tool went
  // missing in the next and the last-writer-wins save dropped edits.
  const persistedTarget = useJobTargetDraft();
  const [roleDraft, setRoleDraft] = useState<string | null>(null);
  const [jobDescriptionDraft, setJobDescriptionDraft] = useState<string | null>(null);
  const targetRole = roleDraft ?? persistedTarget.role;
  const jobDescription = jobDescriptionDraft ?? persistedTarget.jobDescription;

  // Improver state
  const [goal, setGoal] = useState<Goal>("summary");
  const [improverResult, setImproverResult] = useState<string | null>(null);
  const [improvedExperienceParts, setImprovedExperienceParts] = useState<string[] | null>(
    null
  );
  const [selectedExperienceBlocks, setSelectedExperienceBlocks] = useState<number[]>([]);
  const [fullResumeImproved, setFullResumeImproved] = useState<ImprovedResume | null>(null);
  const [fullImprovedBlocks, setFullImprovedBlocks] = useState<FullImprovedBlock[]>([]);
  const [selectedFullKeys, setSelectedFullKeys] = useState<string[]>([]);
  const [improverOriginal, setImproverOriginal] = useState<string | null>(null);
  const [improverApplied, setImproverApplied] = useState(false);
  const [improverImpact, setImproverImpact] = useState<AtsImpact | null>(null);

  // Keyword Booster state
  const [keywordResults, setKeywordResults] = useState<Array<{
    keyword: string;
    importance: string;
    section: string;
    suggestion: string;
  }> | null>(null);

  // Achievement Builder state
  const [selectedExpIndex, setSelectedExpIndex] = useState(0);
  const [achievementResult, setAchievementResult] = useState<string | null>(null);
  const [achievementApplied, setAchievementApplied] = useState(false);
  const [achievementImpact, setAchievementImpact] = useState<AtsImpact | null>(null);

  // Shared
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const resultsRef = useRef<HTMLDivElement>(null);

  const { data: resumes = [], isLoading: resumesLoading } = trpc.resume.listSummary.useQuery();
  const activeResumeId = selectedResumeId ?? resumes[0]?.id ?? null;

  const { data: resumeData, isLoading: resumeLoading } = trpc.resume.getById.useQuery(
    { id: activeResumeId! },
    { enabled: !!activeResumeId }
  );
  const data = resumeData?.data as ResumeDataJSON | null | undefined;

  const improveSection = trpc.ai.improveSection.useMutation();
  const improveFullResume = trpc.ai.improveFullResume.useMutation();
  const keywordBooster = trpc.ai.keywordBooster.useMutation();
  const achievementBuilder = trpc.ai.achievementBuilder.useMutation();
  const utils = trpc.useUtils();
  const updateResume = trpc.resume.update.useMutation({
    onSuccess: () => {
      utils.resume.getById.invalidate({ id: activeResumeId! });
      utils.resume.listSummary.invalidate();
    },
  });

  const isGenerating =
    improveSection.isPending ||
    improveFullResume.isPending ||
    keywordBooster.isPending ||
    achievementBuilder.isPending;

  useEffect(() => {
    if (roleDraft === null && jobDescriptionDraft === null) return;
    saveJobTargetDraft({
      role: roleDraft ?? undefined,
      jobDescription: jobDescriptionDraft ?? undefined,
    });
  }, [roleDraft, jobDescriptionDraft]);

  const currentContent = useMemo(() => {
    if (!data) return null;
    if (goal === "summary") return data.summary || null;
    if (goal === "experience") {
      const desc = (data.experiences ?? [])
        .filter((e) => e.description?.trim())
        .map((e) => `${e.jobTitle} at ${e.employer}:\n${e.description}`)
        .join("\n\n");
      return desc || null;
    }
    const parts: string[] = [];
    if (data.summary) parts.push(`Summary:\n${data.summary}`);
    for (const exp of data.experiences ?? []) {
      if (exp.description?.trim()) parts.push(`${exp.jobTitle} at ${exp.employer}:\n${exp.description}`);
    }
    for (const edu of data.educations ?? []) {
      if (edu.description?.trim()) parts.push(`${edu.degree} at ${edu.schoolName}:\n${edu.description}`);
    }
    return parts.length > 0 ? parts.join("\n\n") : null;
  }, [data, goal]);

  const experienceApplyTargets = useMemo(() => {
    if (!data?.experiences) return [];
    return data.experiences
      .filter((exp) => exp.description?.trim())
      .map((exp, blockIndex) => ({ ...exp, blockIndex }));
  }, [data]);

  function buildFullImprovedBlocks(improved: ImprovedResume): FullImprovedBlock[] {
    const blocks: FullImprovedBlock[] = [];

    if (typeof improved.summary === "string" && improved.summary.trim()) {
      blocks.push({
        key: "summary",
        label: "Summary",
        value: improved.summary.trim(),
        before: data?.summary ?? "",
        type: "summary",
      });
    }

    if (Array.isArray(improved.experiences)) {
      improved.experiences.forEach((exp, index) => {
        if (!exp?.description?.trim()) return;
        const title = exp.jobTitle || data?.experiences?.[index]?.jobTitle || `Experience ${index + 1}`;
        blocks.push({
          key: `experience:${index}`,
          label: `Experience ${index + 1} · ${title}`,
          value: exp.description.trim(),
          before: data?.experiences?.[index]?.description ?? "",
          type: "experience",
        });
      });
    }

    if (Array.isArray(improved.educations)) {
      improved.educations.forEach((edu, index) => {
        if (!edu?.description?.trim()) return;
        const title = edu.degree || data?.educations?.[index]?.degree || `Education ${index + 1}`;
        blocks.push({
          key: `education:${index}`,
          label: `Education ${index + 1} · ${title}`,
          value: edu.description.trim(),
          before: data?.educations?.[index]?.description ?? "",
          type: "education",
        });
      });
    }

    return blocks;
  }

  function clearResults() {
    setImproverResult(null);
    setFullResumeImproved(null);
    setImproverOriginal(null);
    setImproverApplied(false);
    setImproverImpact(null);
    setImprovedExperienceParts(null);
    setSelectedExperienceBlocks([]);
    setFullImprovedBlocks([]);
    setSelectedFullKeys([]);
    setKeywordResults(null);
    setAchievementResult(null);
    setAchievementApplied(false);
    setAchievementImpact(null);
    setError(null);
    setCopied(false);
    setStatusMessage("");
  }

  function announceResult(message: string) {
    setStatusMessage(message);
    if (window.matchMedia("(max-width: 1023px)").matches) {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      resultsRef.current?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    }
  }

  function selectResume(id: string) {
    setSelectedResumeId(id);
    clearResults();
  }

  async function handleImproverGenerate() {
    if (!activeResumeId || !currentContent || !data) return;
    setError(null);
    setImproverResult(null);
    setFullResumeImproved(null);
    setImproverApplied(false);
    setImproverImpact(null);
    setImprovedExperienceParts(null);
    setFullImprovedBlocks([]);
    setSelectedFullKeys([]);
    setImproverOriginal(currentContent);
    setStatusMessage("Generating improvements.");

    try {
      if (goal === "summary") {
        const res = await improveSection.mutateAsync({
          resumeId: activeResumeId,
          section: "summary",
          content: data.summary,
          targetRole: targetRole || undefined,
          jobDescription: jobDescription.trim() || undefined,
        });
        setImproverResult(res.improved);
        setImproverImpact(res.atsImpact);
      } else if (goal === "experience") {
        const all = (data.experiences ?? [])
          .filter((e) => e.description?.trim())
          .map((e) => e.description)
          .join(`\n\n${EXP_SPLIT_TOKEN}\n\n`);
        const res = await improveSection.mutateAsync({
          resumeId: activeResumeId,
          section: "experience",
          content: all,
          targetRole: targetRole || undefined,
          jobDescription: jobDescription.trim() || undefined,
        });
        setImproverImpact(res.atsImpact);
        const parts = res.improved
          .split(EXP_SPLIT_TOKEN)
          .map((p) => p.trim())
          .filter(Boolean);
        if (parts.length > 0) {
          setImprovedExperienceParts(parts);
          setSelectedExperienceBlocks(parts.map((_, index) => index));
          setImproverResult(parts.join("\n\n"));
        } else {
          setImprovedExperienceParts(null);
          setSelectedExperienceBlocks([]);
          setImproverResult(res.improved.replaceAll(EXP_SPLIT_TOKEN, "").trim());
        }
      } else {
        const res = await improveFullResume.mutateAsync({
          resumeId: activeResumeId,
          targetRole: targetRole || undefined,
          jobDescription: jobDescription.trim() || undefined,
        });
        const improved = res.improved as ImprovedResume;
        setFullResumeImproved(improved);
        setImproverImpact(res.atsImpact);
        const blocks = buildFullImprovedBlocks(improved);
        setFullImprovedBlocks(blocks);
        setSelectedFullKeys(blocks.map((block) => block.key));
        setImproverResult(formatResumeDataAsText(improved));
      }
      announceResult("Improvements ready. Review the suggested blocks below.");
    } catch (e) {
      const message = (e instanceof Error ? e.message : "") || "Something went wrong. Please try again.";
      setError(message);
      setStatusMessage(`Generation failed. ${message}`);
    }
  }

  async function handleImproverApply() {
    if (!activeResumeId || !improverResult || !data) return;
    try {
      if (improverImpact?.warnings.length) {
        setError("Resolve the ATS warnings before applying this output.");
        return;
      }
      if (goal === "summary") {
        await updateResume.mutateAsync({
          id: activeResumeId,
          data: { ...data, summary: improverResult },
        });
      } else if (goal === "experience") {
        const parts =
          improvedExperienceParts && improvedExperienceParts.length > 0
            ? [...improvedExperienceParts]
            : improverResult
                .split(/\n\n---\n\n|\n{2,}/)
                .map((p) => p.trim())
                .filter(Boolean);
        const selectedSet = new Set(selectedExperienceBlocks);
        if (selectedSet.size === 0) {
          setError("Select at least one experience block to apply.");
          return;
        }

        let partIndex = 0;
        const updated = data.experiences.map((exp) => {
          if (!exp.description?.trim()) return exp;
          const improved = parts[partIndex];
          const shouldApply = selectedSet.has(partIndex);
          partIndex += 1;
          return shouldApply && improved ? { ...exp, description: improved } : exp;
        });
        await updateResume.mutateAsync({
          id: activeResumeId,
          data: { ...data, experiences: updated },
        });
      } else if (fullResumeImproved) {
        if (selectedFullKeys.length === 0) {
          setError("Select at least one output block to apply.");
          return;
        }
        const selected = new Set(selectedFullKeys);
        const improved = fullResumeImproved;
        const nextData: ResumeDataJSON = { ...data };

        if (selected.has("summary") && typeof improved.summary === "string") {
          nextData.summary = improved.summary;
        }

        const improvedExperiences = improved.experiences;
        if (Array.isArray(improvedExperiences) && Array.isArray(data.experiences)) {
          nextData.experiences = data.experiences.map((exp, index) => {
            if (!selected.has(`experience:${index}`)) return exp;
            const improvedExp = improvedExperiences[index];
            if (!improvedExp?.description) return exp;
            return { ...exp, description: improvedExp.description };
          });
        }

        const improvedEducations = improved.educations;
        if (Array.isArray(improvedEducations) && Array.isArray(data.educations)) {
          nextData.educations = data.educations.map((edu, index) => {
            if (!selected.has(`education:${index}`)) return edu;
            const improvedEdu = improvedEducations[index];
            if (!improvedEdu?.description) return edu;
            return { ...edu, description: improvedEdu.description };
          });
        }

        await updateResume.mutateAsync({ id: activeResumeId, data: nextData });
      }
      setImproverApplied(true);
      setStatusMessage("Changes applied to your resume.");
    } catch (e) {
      setError((e instanceof Error ? e.message : "") || "Failed to apply changes.");
    }
  }

  async function handleKeywordGenerate() {
    if (!activeResumeId || !jobDescription.trim()) return;
    setError(null);
    setKeywordResults(null);
    setStatusMessage("Scanning the job description.");
    try {
      const res = await keywordBooster.mutateAsync({
        resumeId: activeResumeId,
        jobDescription,
      });
      setKeywordResults(res.keywords);
      announceResult(
        res.keywords.length === 0
          ? "No missing keywords found."
          : `${res.keywords.length} missing keywords found.`
      );
    } catch (e) {
      const message = (e instanceof Error ? e.message : "") || "Something went wrong.";
      setError(message);
      setStatusMessage(`Scan failed. ${message}`);
    }
  }

  async function handleAchievementGenerate() {
    if (!activeResumeId) return;
    setError(null);
    setAchievementResult(null);
    setAchievementApplied(false);
    setAchievementImpact(null);
    setStatusMessage("Building achievement bullets.");
    try {
      const res = await achievementBuilder.mutateAsync({
        resumeId: activeResumeId,
        experienceIndex: selectedExpIndex,
        targetRole: targetRole || undefined,
      });
      setAchievementResult(res.bullets);
      setAchievementImpact(res.atsImpact);
      announceResult("Achievement bullets ready.");
    } catch (e) {
      const message = (e instanceof Error ? e.message : "") || "Something went wrong.";
      setError(message);
      setStatusMessage(`Generation failed. ${message}`);
    }
  }

  async function handleAchievementApply() {
    if (!activeResumeId || !achievementResult || !data) return;
    try {
      if (achievementImpact?.warnings.length) {
        setError("Resolve the ATS warnings before applying these bullets.");
        return;
      }
      const updated = [...data.experiences];
      updated[selectedExpIndex] = {
        ...updated[selectedExpIndex],
        description: achievementResult,
      };
      await updateResume.mutateAsync({
        id: activeResumeId,
        data: { ...data, experiences: updated },
      });
      setAchievementApplied(true);
      setStatusMessage("Bullets applied to your resume.");
    } catch (e) {
      setError((e instanceof Error ? e.message : "") || "Failed to apply changes.");
    }
  }

  async function handleCopy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Called above the early returns so the hook order never changes.
  const tourPending = useTourPending("ai-assistant");

  if (resumesLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center" role="status">
          <Spinner className="mx-auto mb-4 size-12 text-muted-foreground" />
          <p className="text-muted-foreground">Loading your resumes...</p>
        </div>
      </div>
    );
  }

  // Held back while the tour is owed: this screen replaces the whole layout,
  // so for a brand-new account the tour had nothing to point at and never ran.
  if (resumes.length === 0 && !tourPending) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground lg:text-3xl">
            AI Assistant
          </h1>
          <p className="mt-1 text-muted-foreground">
            AI-powered tools to improve your resume and job applications.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-12 text-center">
          <Sparkles className="mb-4 h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-foreground">No resumes yet</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Create your first resume to start using the AI Assistant.
          </p>
          <Button asChild className="mt-4">
            <Link href="/resume/templates">Create resume</Link>
          </Button>
        </div>
      </div>
    );
  }

  const activeToolMeta = TOOLS.find((tool) => tool.id === activeTool)!;
  const canImprove = !!activeResumeId && !!currentContent && !isGenerating;
  const canKeyword = !!activeResumeId && !!jobDescription.trim() && !isGenerating;
  const canAchievement =
    !!activeResumeId &&
    !!data?.experiences?.[selectedExpIndex]?.description?.trim() &&
    !isGenerating;

  const improverSelectionEmpty =
    (goal === "experience" &&
      improvedExperienceParts !== null &&
      selectedExperienceBlocks.length === 0) ||
    (goal === "full" && fullImprovedBlocks.length > 0 && selectedFullKeys.length === 0);

  const improverSelectedCount =
    goal === "experience" && improvedExperienceParts
      ? selectedExperienceBlocks.length
      : goal === "full"
        ? selectedFullKeys.length
        : 1;

  return (
    <div className="space-y-6">
      <PageTour tour="ai-assistant" />
      <header>
        <h1 className="font-display text-2xl font-bold text-foreground lg:text-3xl">
          AI Assistant
        </h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          AI-powered tools to improve your resume and job applications.
        </p>
      </header>

      <div role="status" aria-live="polite" className="sr-only">
        {statusMessage}
      </div>

      <div className="grid gap-6 lg:grid-cols-5 lg:items-start">
        {/* Shared context: one resume and one job target for every tool. */}
        <section
          data-tour="assistant-context"
          aria-labelledby="ai-context-heading"
          className="space-y-5 rounded-xl border border-border bg-card p-5 lg:sticky lg:top-6 lg:col-span-2"
        >
          <h2 id="ai-context-heading" className="sr-only">
            Choose what to work on
          </h2>

          <ResumeCombobox
            label="Working on"
            resumes={resumes}
            selectedId={activeResumeId}
            onSelect={selectResume}
          />

          <div className="space-y-2">
            <label htmlFor="target-role" className="text-sm font-medium text-foreground">
              Target role{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <Input
              id="target-role"
              value={targetRole}
              onChange={(event) => setRoleDraft(event.target.value)}
              placeholder="e.g. Senior Frontend Engineer"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="job-description"
              className="text-sm font-medium text-foreground"
            >
              Job description{" "}
              <span className="font-normal text-muted-foreground">
                {activeTool === "keywords" ? "(required)" : "(optional)"}
              </span>
            </label>
            <textarea
              id="job-description"
              value={jobDescription}
              onChange={(event) => setJobDescriptionDraft(event.target.value)}
              placeholder="Paste the job description to tailor the output..."
              rows={6}
              aria-describedby="job-description-hint"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
            <p id="job-description-hint" className="text-xs text-muted-foreground">
              Shared by all three tools and the ATS Checker.
            </p>
          </div>
        </section>

        <div data-tour="assistant-results" className="space-y-4 lg:col-span-3">
          <Tabs
            value={activeTool}
            onValueChange={(value) => {
              setActiveTool(value as Tool);
              setError(null);
            }}
            className="gap-4"
          >
            <div className="space-y-2">
              <TabsList data-tour="assistant-tools" className="w-full">
                {TOOLS.map((tool) => (
                  <TabsTrigger key={tool.id} value={tool.id}>
                    <tool.icon aria-hidden="true" />
                    <span className="hidden sm:inline">{tool.label}</span>
                    <span className="sm:hidden">{tool.label.split(" ")[0]}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
              {/* TOOLS carried a description field that the old UI never rendered. */}
              <p className="text-sm text-muted-foreground">{activeToolMeta.description}</p>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-destructive-border bg-destructive-surface p-3 text-sm text-destructive-surface-foreground"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            {/* TOOL 1: Resume Improver */}
            <TabsContent value="improver" className="space-y-4">
              <div className="space-y-4 rounded-xl border border-border bg-card p-5">
                <div className="space-y-2">
                  <p id="improver-goal-label" className="text-sm font-medium text-foreground">
                    Goal
                  </p>
                  <div
                    role="radiogroup"
                    aria-labelledby="improver-goal-label"
                    className="grid gap-2 sm:grid-cols-3"
                  >
                    {GOALS.map((option, index) => {
                      const isActive = goal === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          role="radio"
                          aria-checked={isActive}
                          tabIndex={isActive ? 0 : -1}
                          onKeyDown={(event) => {
                            if (event.key !== "ArrowRight" && event.key !== "ArrowLeft" && event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
                            event.preventDefault();
                            const forward = event.key === "ArrowRight" || event.key === "ArrowDown";
                            const next = GOALS[(index + (forward ? 1 : GOALS.length - 1)) % GOALS.length];
                            setGoal(next.id);
                            clearResults();
                          }}
                          onClick={() => {
                            setGoal(option.id);
                            clearResults();
                          }}
                          className={cn(
                            "flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors",
                            "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                            isActive
                              ? "border-primary bg-primary/5"
                              : "border-border hover:bg-muted/40"
                          )}
                        >
                          <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <option.icon
                              className={cn(
                                "h-4 w-4",
                                isActive ? "text-primary" : "text-muted-foreground"
                              )}
                              aria-hidden="true"
                            />
                            {option.label}
                          </span>
                          <span className="text-xs text-muted-foreground">{option.hint}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Button
                  onClick={handleImproverGenerate}
                  disabled={!canImprove}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  {improveSection.isPending || improveFullResume.isPending ? (
                    <>
                      <Loader2 className="animate-spin" aria-hidden="true" />
                      Improving...
                    </>
                  ) : (
                    <>
                      <Sparkles aria-hidden="true" />
                      {improverResult ? "Regenerate" : "Improve resume"} &middot;{" "}
                      {activeToolMeta.credits} credits
                    </>
                  )}
                </Button>

                {!canImprove && !isGenerating && (
                  <p className="text-xs text-muted-foreground">
                    {currentContent
                      ? "Select a resume to continue."
                      : "This section is empty. Fill it in on your resume first."}
                  </p>
                )}
              </div>

              <div ref={resultsRef} className="scroll-mt-6 space-y-4">
                {isGenerating ? (
                  <ResultSkeleton />
                ) : improverResult ? (
                  <>
                    <div className="space-y-3">
                      {goal === "experience" && improvedExperienceParts ? (
                        improvedExperienceParts.map((value, index) => {
                          const meta = experienceApplyTargets[index];
                          return (
                            <AiSuggestionBlock
                              key={`exp-${index}`}
                              label={`Experience ${index + 1}${meta?.jobTitle ? ` · ${meta.jobTitle}` : ""}`}
                              before={meta?.description}
                              after={value}
                              applyChecked={selectedExperienceBlocks.includes(index)}
                              onToggleApply={() =>
                                setSelectedExperienceBlocks((prev) =>
                                  prev.includes(index)
                                    ? prev.filter((item) => item !== index)
                                    : [...prev, index].sort((a, b) => a - b)
                                )
                              }
                            />
                          );
                        })
                      ) : goal === "full" && fullImprovedBlocks.length > 0 ? (
                        fullImprovedBlocks.map((block) => (
                          <AiSuggestionBlock
                            key={block.key}
                            label={block.label}
                            before={block.before}
                            after={block.value}
                            applyChecked={selectedFullKeys.includes(block.key)}
                            onToggleApply={() =>
                              setSelectedFullKeys((prev) =>
                                prev.includes(block.key)
                                  ? prev.filter((item) => item !== block.key)
                                  : [...prev, block.key]
                              )
                            }
                          />
                        ))
                      ) : (
                        parseContentBlocks(
                          improverResult,
                          goal === "summary" ? "Summary" : "Section"
                        ).map((block, index) => (
                          <AiSuggestionBlock
                            key={`block-${index}`}
                            label={block.label}
                            before={index === 0 ? improverOriginal : null}
                            after={block.value}
                          />
                        ))
                      )}
                    </div>

                    <AtsImpactSummary impact={improverImpact} />

                    <AiResultActions
                      onApply={handleImproverApply}
                      applyDisabled={
                        improverApplied ||
                        updateResume.isPending ||
                        !!improverImpact?.warnings.length ||
                        improverSelectionEmpty
                      }
                      applyLabel={
                        improverSelectedCount > 1
                          ? `Apply ${improverSelectedCount} blocks`
                          : "Apply to resume"
                      }
                      isApplying={updateResume.isPending}
                      applied={improverApplied}
                      appliedMessage="Changes saved."
                      onCopy={() => handleCopy(improverResult)}
                      copied={copied}
                      onRegenerate={handleImproverGenerate}
                      isGenerating={isGenerating}
                      credits={activeToolMeta.credits}
                      blockedReason={
                        improverSelectionEmpty
                          ? "Tick at least one block above to apply it."
                          : null
                      }
                    />
                  </>
                ) : tourPending ? (
                  <>
                    <SampleBanner title="Sample rewrite.">
                      This is what an improvement looks like. Nothing here is saved, and it
                      disappears when the tour ends.
                    </SampleBanner>
                    <div className="space-y-3">
                      {SAMPLE_REWRITE.blocks.map((block) => (
                        <AiSuggestionBlock
                          key={block.label}
                          label={block.label}
                          before={block.before}
                          after={block.after}
                        />
                      ))}
                    </div>
                    <AtsImpactSummary impact={SAMPLE_REWRITE.impact} />
                  </>
                ) : activeResumeId && !resumeLoading ? (
                  <div className="rounded-xl border border-border bg-card p-5">
                    <h2 className="text-base font-semibold text-foreground">
                      Current content
                    </h2>
                    {currentContent ? (
                      <div className="mt-3 space-y-3">
                        {parseContentBlocks(
                          currentContent,
                          goal === "summary"
                            ? "Summary"
                            : goal === "experience"
                              ? "Experience"
                              : "Section"
                        ).map((block, index) => (
                          <div
                            key={`cur-${index}`}
                            className="rounded-lg border border-border bg-muted/30 p-3"
                          >
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {block.label}
                            </p>
                            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                              {block.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">
                        No content found for this section. Fill in your resume first.
                      </p>
                    )}
                  </div>
                ) : null}
              </div>
            </TabsContent>

            {/* TOOL 2: Keyword Booster */}
            <TabsContent value="keywords" className="space-y-4">
              <div className="space-y-3 rounded-xl border border-border bg-card p-5">
                <Button
                  onClick={handleKeywordGenerate}
                  disabled={!canKeyword}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  {keywordBooster.isPending ? (
                    <>
                      <Loader2 className="animate-spin" aria-hidden="true" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Target aria-hidden="true" />
                      Find missing keywords &middot; 0.25 credits
                    </>
                  )}
                </Button>
                {!canKeyword && !isGenerating && (
                  <p className="text-xs text-muted-foreground">
                    Paste a job description on the left to run this tool.
                  </p>
                )}
              </div>

              <div className="scroll-mt-6 space-y-3">
                {keywordBooster.isPending ? (
                  <ResultSkeleton />
                ) : keywordResults ? (
                  keywordResults.length === 0 ? (
                    <div className="rounded-xl border border-success-border bg-success-surface p-6 text-center">
                      <Check
                        className="mx-auto h-8 w-8 text-success-surface-foreground"
                        aria-hidden="true"
                      />
                      <p className="mt-2 font-medium text-success-surface-foreground">
                        Your resume already covers all the key terms.
                      </p>
                      <p className="mt-1 text-sm text-success-surface-foreground/80">
                        No missing keywords detected for this job description.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-base font-semibold text-foreground">
                          {keywordResults.length} missing{" "}
                          {keywordResults.length === 1 ? "keyword" : "keywords"}
                        </h2>
                        <ul className="flex gap-2 text-xs">
                          {(["high", "medium", "low"] as const).map((level) => (
                            <li
                              key={level}
                              className={cn(
                                "rounded-4xl border px-2 py-0.5 capitalize",
                                IMPORTANCE_STYLES[level]
                              )}
                            >
                              {level}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <ul className="space-y-3">
                        {keywordResults.map((keyword, index) => (
                          <li
                            key={`kw-${index}`}
                            className="rounded-xl border border-border bg-card p-4"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-foreground">
                                {keyword.keyword}
                              </span>
                              <span
                                className={cn(
                                  "rounded-4xl border px-2 py-0.5 text-xs font-medium capitalize",
                                  IMPORTANCE_STYLES[keyword.importance] ??
                                    IMPORTANCE_STYLES.low
                                )}
                              >
                                {keyword.importance} priority
                              </span>
                            </div>
                            <p className="mt-1.5 text-sm text-muted-foreground">
                              <span className="font-medium text-foreground">Place in:</span>{" "}
                              <span className="capitalize">{keyword.section}</span>
                            </p>
                            <p className="mt-2 rounded-lg border border-border bg-muted/40 p-3 text-sm leading-relaxed text-foreground">
                              {keyword.suggestion}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </>
                  )
                ) : null}
              </div>
            </TabsContent>

            {/* TOOL 3: Achievement Builder */}
            <TabsContent value="achievements" className="space-y-4">
              <div className="space-y-4 rounded-xl border border-border bg-card p-5">
                {data?.experiences && data.experiences.length > 0 ? (
                  <>
                    <div className="space-y-2">
                      <p
                        id="achievement-role-label"
                        className="text-sm font-medium text-foreground"
                      >
                        Which role?
                      </p>
                      <div
                        role="radiogroup"
                        aria-labelledby="achievement-role-label"
                        className="max-h-64 space-y-2 overflow-y-auto pr-1"
                      >
                        {data.experiences.map((exp, index) => {
                          const isActive = selectedExpIndex === index;
                          return (
                            <button
                              key={exp.id}
                              type="button"
                              role="radio"
                              aria-checked={isActive}
                              tabIndex={isActive ? 0 : -1}
                              onKeyDown={(event) => {
                                if (!["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(event.key)) return;
                                event.preventDefault();
                                const forward = event.key === "ArrowDown" || event.key === "ArrowRight";
                                const total = data.experiences.length;
                                const next = (index + (forward ? 1 : total - 1)) % total;
                                setSelectedExpIndex(next);
                                setAchievementResult(null);
                                setAchievementApplied(false);
                                setAchievementImpact(null);
                                setError(null);
                              }}
                              onClick={() => {
                                setSelectedExpIndex(index);
                                setAchievementResult(null);
                                setAchievementApplied(false);
                                setAchievementImpact(null);
                                setError(null);
                              }}
                              className={cn(
                                "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                                "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                                isActive
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:bg-muted/40"
                              )}
                            >
                              <span
                                className={cn(
                                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                                  isActive ? "bg-primary/10" : "bg-muted/60"
                                )}
                              >
                                <Briefcase
                                  className={cn(
                                    "h-4 w-4",
                                    isActive ? "text-primary" : "text-muted-foreground"
                                  )}
                                  aria-hidden="true"
                                />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium text-foreground">
                                  {exp.jobTitle || "Untitled role"}
                                </span>
                                <span className="block truncate text-xs text-muted-foreground">
                                  {exp.employer || "Unknown company"}
                                  {exp.startDate ? ` · ${exp.startDate}` : ""}
                                </span>
                              </span>
                              {isActive && (
                                <Check
                                  className="h-4 w-4 shrink-0 text-primary"
                                  aria-hidden="true"
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <Button
                      onClick={handleAchievementGenerate}
                      disabled={!canAchievement}
                      size="lg"
                      className="w-full sm:w-auto"
                    >
                      {achievementBuilder.isPending ? (
                        <>
                          <Loader2 className="animate-spin" aria-hidden="true" />
                          Building...
                        </>
                      ) : (
                        <>
                          <Trophy aria-hidden="true" />
                          Build achievement bullets &middot; 0.25 credits
                        </>
                      )}
                    </Button>

                    {!canAchievement && !isGenerating && (
                      <p className="text-xs text-muted-foreground">
                        This role has no description yet. Add one on your resume first.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No experiences found. Add work experience to your resume first.
                  </p>
                )}
              </div>

              <div className="scroll-mt-6 space-y-4">
                {achievementBuilder.isPending ? (
                  <ResultSkeleton />
                ) : achievementResult ? (
                  <>
                    <AiSuggestionBlock
                      label={`${data?.experiences?.[selectedExpIndex]?.jobTitle ?? "Role"} · achievement bullets`}
                      before={data?.experiences?.[selectedExpIndex]?.description}
                      after={achievementResult}
                    />

                    <AtsImpactSummary impact={achievementImpact} />

                    <AiResultActions
                      onApply={handleAchievementApply}
                      applyDisabled={
                        achievementApplied ||
                        updateResume.isPending ||
                        !!achievementImpact?.warnings.length
                      }
                      applyLabel="Apply to resume"
                      isApplying={updateResume.isPending}
                      applied={achievementApplied}
                      appliedMessage="Bullets applied."
                      onCopy={() => handleCopy(achievementResult)}
                      copied={copied}
                      onRegenerate={handleAchievementGenerate}
                      isGenerating={isGenerating}
                      credits="0.25"
                    />
                  </>
                ) : data?.experiences?.[selectedExpIndex]?.description ? (
                  <div className="rounded-xl border border-border bg-card p-5">
                    <h2 className="text-base font-semibold text-foreground">
                      Current description
                    </h2>
                    <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {data.experiences[selectedExpIndex].jobTitle} at{" "}
                        {data.experiences[selectedExpIndex].employer}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                        {data.experiences[selectedExpIndex].description}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
