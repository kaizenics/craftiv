"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  Sparkles,
  Loader2,
  AlertCircle,
  Check,
  Copy,
  RefreshCw,
  FileText,
  Briefcase,
  ScrollText,
  Clock,
  Search,
  X,
  Target,
  Trophy,
  ArrowUp,
  ArrowRight,
  ChevronRight,
} from "@/components/ui/icons";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/trpc/client";
import type { ResumeDataJSON } from "@/db/schema";

// ── Types ───────────────────────────────────────────────────────────────────

type Tool = "improver" | "keywords" | "achievements";
type Goal = "summary" | "experience" | "full";

const TOOLS: { id: Tool; label: string; description: string; icon: typeof Sparkles }[] = [
  { id: "improver", label: "Resume Improver", description: "AI-rewrite your summary, experience, or full resume", icon: Sparkles },
  { id: "keywords", label: "Keyword Booster", description: "Find missing keywords from a job description", icon: Target },
  { id: "achievements", label: "Achievement Builder", description: "Turn responsibilities into accomplishment bullets", icon: Trophy },
];

const GOALS: { id: Goal; label: string; icon: typeof ScrollText }[] = [
  { id: "summary", label: "Rewrite Summary", icon: ScrollText },
  { id: "experience", label: "Improve Experience", icon: Briefcase },
  { id: "full", label: "Improve Full Resume", icon: FileText },
];

// ── Shared helpers ──────────────────────────────────────────────────────────

function formatDate(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function parseContentBlocks(content: string, fallbackLabel: string): Array<{ label: string; value: string }> {
  const normalized = content.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];
  const chunks = normalized.split(/\n{2,}/).map((c) => c.trim()).filter(Boolean);
  return chunks.map((chunk, i) => {
    const labeled = chunk.match(/^([^:\n]{2,100}):\s*\n([\s\S]*)$/);
    if (labeled) return { label: labeled[1].trim(), value: labeled[2].trim() };
    return { label: chunks.length === 1 ? fallbackLabel : `${fallbackLabel} ${i + 1}`, value: chunk };
  });
}

function formatResumeDataAsText(d: Record<string, any>): string {
  const parts: string[] = [];
  if (d.summary) parts.push(`Summary:\n${d.summary}`);
  if (Array.isArray(d.experiences)) {
    for (const exp of d.experiences) {
      if (exp.description?.trim()) parts.push(`${exp.jobTitle || "Role"} at ${exp.employer || "Company"}:\n${exp.description}`);
    }
  }
  if (Array.isArray(d.educations)) {
    for (const edu of d.educations) {
      if (edu.description?.trim()) parts.push(`${edu.degree || "Degree"} at ${edu.schoolName || "School"}:\n${edu.description}`);
    }
  }
  return parts.join("\n\n");
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function AIAssistantPage() {
  const [activeTool, setActiveTool] = useState<Tool>("improver");

  // Resume selector state
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const selectorRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Improver state
  const [goal, setGoal] = useState<Goal>("summary");
  const [targetRole, setTargetRole] = useState("");
  const [jobDescriptionImprover, setJobDescriptionImprover] = useState("");
  const [improverResult, setImproverResult] = useState<string | null>(null);
  const [fullResumeImproved, setFullResumeImproved] = useState<Record<string, any> | null>(null);
  const [improverOriginal, setImproverOriginal] = useState<string | null>(null);
  const [improverApplied, setImproverApplied] = useState(false);

  // Keyword Booster state
  const [jobDescriptionKw, setJobDescriptionKw] = useState("");
  const [keywordResults, setKeywordResults] = useState<Array<{ keyword: string; importance: string; section: string; suggestion: string }> | null>(null);

  // Achievement Builder state
  const [selectedExpIndex, setSelectedExpIndex] = useState<number>(0);
  const [achievementTargetRole, setAchievementTargetRole] = useState("");
  const [achievementResult, setAchievementResult] = useState<string | null>(null);
  const [achievementApplied, setAchievementApplied] = useState(false);

  // Shared
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Data
  const { data: resumes = [], isLoading: resumesLoading } = trpc.resume.listSummary.useQuery();
  const activeResumeId = selectedResumeId ?? resumes[0]?.id ?? null;
  const activeResume = resumes.find((r) => r.id === activeResumeId);
  const filteredResumes = useMemo(() => {
    if (!searchQuery.trim()) return resumes;
    const q = searchQuery.toLowerCase();
    return resumes.filter((r) => r.title.toLowerCase().includes(q));
  }, [resumes, searchQuery]);

  const { data: resumeData, isLoading: resumeLoading } = trpc.resume.getById.useQuery(
    { id: activeResumeId! },
    { enabled: !!activeResumeId },
  );
  const data = resumeData?.data as ResumeDataJSON | null | undefined;

  // Mutations
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
    improveSection.isPending || improveFullResume.isPending ||
    keywordBooster.isPending || achievementBuilder.isPending;

  // Click outside handler for selector
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (selectorRef.current && !selectorRef.current.contains(e.target as Node)) setSelectorOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Current content for improver
  const currentContent = useMemo(() => {
    if (!data) return null;
    if (goal === "summary") return data.summary || null;
    if (goal === "experience") {
      const desc = (data.experiences ?? []).filter((e) => e.description?.trim()).map((e) => `${e.jobTitle} at ${e.employer}:\n${e.description}`).join("\n\n");
      return desc || null;
    }
    if (goal === "full") {
      const parts: string[] = [];
      if (data.summary) parts.push(`Summary:\n${data.summary}`);
      for (const exp of data.experiences ?? []) { if (exp.description?.trim()) parts.push(`${exp.jobTitle} at ${exp.employer}:\n${exp.description}`); }
      for (const edu of data.educations ?? []) { if (edu.description?.trim()) parts.push(`${edu.degree} at ${edu.schoolName}:\n${edu.description}`); }
      return parts.length > 0 ? parts.join("\n\n") : null;
    }
    return null;
  }, [data, goal]);

  const consumeCredits = async (cost: number, eventType: string) => {
    const response = await fetch("/api/credits/consume", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType, cost }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const message = payload?.message || payload?.error || "Insufficient credits.";
      throw new Error(message);
    }
  };

  // ── Handlers ────────────────────────────────────────────────────────────────

  function clearResults() {
    setImproverResult(null); setFullResumeImproved(null); setImproverOriginal(null); setImproverApplied(false);
    setKeywordResults(null);
    setAchievementResult(null); setAchievementApplied(false);
    setError(null); setCopied(false);
  }

  function selectResume(id: string) {
    setSelectedResumeId(id);
    setSelectorOpen(false);
    setSearchQuery("");
    clearResults();
  }

  async function handleImproverGenerate() {
    if (!activeResumeId || !currentContent || !data) return;
    setError(null); setImproverResult(null); setFullResumeImproved(null); setImproverApplied(false);
    setImproverOriginal(currentContent);
    try {
      await consumeCredits(0.5, "ai_resume_improver");
      if (goal === "summary") {
        const res = await improveSection.mutateAsync({
          resumeId: activeResumeId,
          section: "summary",
          content: data.summary,
          targetRole: targetRole || undefined,
          jobDescription: jobDescriptionImprover.trim() || undefined,
        });
        setImproverResult(res.improved);
      } else if (goal === "experience") {
        const all = (data.experiences ?? []).filter((e) => e.description?.trim()).map((e) => e.description).join("\n\n---\n\n");
        const res = await improveSection.mutateAsync({
          resumeId: activeResumeId,
          section: "experience",
          content: all,
          targetRole: targetRole || undefined,
          jobDescription: jobDescriptionImprover.trim() || undefined,
        });
        setImproverResult(res.improved);
      } else {
        const res = await improveFullResume.mutateAsync({
          resumeId: activeResumeId,
          targetRole: targetRole || undefined,
          jobDescription: jobDescriptionImprover.trim() || undefined,
        });
        setFullResumeImproved(res.improved);
        setImproverResult(formatResumeDataAsText(res.improved));
      }
    } catch (e: any) { setError(e.message || "Something went wrong. Please try again."); }
  }

  async function handleImproverApply() {
    if (!activeResumeId || !improverResult || !data) return;
    try {
      if (goal === "summary") {
        await updateResume.mutateAsync({ id: activeResumeId, data: { ...data, summary: improverResult } });
      } else if (goal === "experience") {
        const parts = improverResult.split(/\n\n---\n\n|\n\n(?=[A-Z])/);
        const updated = data.experiences.map((exp) => {
          if (!exp.description?.trim()) return exp;
          const improved = parts.shift();
          return improved ? { ...exp, description: improved } : exp;
        });
        await updateResume.mutateAsync({ id: activeResumeId, data: { ...data, experiences: updated } });
      } else if (fullResumeImproved) {
        await updateResume.mutateAsync({ id: activeResumeId, data: { ...data, ...fullResumeImproved } });
      }
      setImproverApplied(true);
    } catch (e: any) { setError(e.message || "Failed to apply changes."); }
  }

  async function handleKeywordGenerate() {
    if (!activeResumeId || !jobDescriptionKw.trim()) return;
    setError(null); setKeywordResults(null);
    try {
      await consumeCredits(0.25, "ai_keyword_booster");
      const res = await keywordBooster.mutateAsync({ resumeId: activeResumeId, jobDescription: jobDescriptionKw });
      setKeywordResults(res.keywords);
    } catch (e: any) { setError(e.message || "Something went wrong."); }
  }

  async function handleAchievementGenerate() {
    if (!activeResumeId) return;
    setError(null); setAchievementResult(null); setAchievementApplied(false);
    try {
      await consumeCredits(0.25, "ai_achievement_builder");
      const res = await achievementBuilder.mutateAsync({ resumeId: activeResumeId, experienceIndex: selectedExpIndex, targetRole: achievementTargetRole || undefined });
      setAchievementResult(res.bullets);
    } catch (e: any) { setError(e.message || "Something went wrong."); }
  }

  async function handleAchievementApply() {
    if (!activeResumeId || !achievementResult || !data) return;
    try {
      const updated = [...data.experiences];
      updated[selectedExpIndex] = { ...updated[selectedExpIndex], description: achievementResult };
      await updateResume.mutateAsync({ id: activeResumeId, data: { ...data, experiences: updated } });
      setAchievementApplied(true);
    } catch (e: any) { setError(e.message || "Failed to apply changes."); }
  }

  async function handleCopy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Loading / Empty ───────────────────────────────────────────────────────

  if (resumesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Spinner className="mx-auto mb-4 size-12 text-muted-foreground" />
          <p className="text-muted-foreground">Loading your resumes...</p>
        </div>
      </div>
    );
  }

  if (resumes.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground lg:text-3xl">AI Assistant</h1>
          <p className="mt-1 text-muted-foreground">AI-powered tools to improve your resume and job applications.</p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-12 text-center">
          <Sparkles className="h-10 w-10 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold text-foreground">No resumes yet</h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">Create your first resume to start using the AI Assistant.</p>
          <Link href="/resume/templates"><Button className="mt-4">Create Resume</Button></Link>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const canImprove = !!activeResumeId && !!currentContent && !isGenerating;
  const canKeyword = !!activeResumeId && !!jobDescriptionKw.trim() && !isGenerating;
  const canAchievement = !!activeResumeId && !!data?.experiences?.[selectedExpIndex]?.description?.trim() && !isGenerating;
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground lg:text-3xl">AI Assistant</h1>
        <p className="mt-1 text-muted-foreground">AI-powered tools to improve your resume and job applications.</p>
      </div>

      {/* Resume Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Working on</label>
        <div className="relative" ref={selectorRef}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchInputRef}
              type="text"
              value={selectorOpen ? searchQuery : (activeResume?.title ?? "")}
              placeholder="Search your resumes..."
              onFocus={() => { setSelectorOpen(true); setSearchQuery(""); }}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-9 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring"
            />
            {selectorOpen && searchQuery && (
              <button type="button" onClick={() => { setSearchQuery(""); searchInputRef.current?.focus(); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {activeResume && !selectorOpen && (
            <p className="mt-1.5 flex items-center gap-1 px-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" /> {formatDate(activeResume.updatedAt)} <span className="mx-0.5">·</span> <span className="capitalize">{activeResume.status}</span>
            </p>
          )}
          {selectorOpen && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
              {filteredResumes.length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">No resumes matching &ldquo;{searchQuery}&rdquo;</div>
              ) : (
                filteredResumes.map((r) => {
                  const isActive = r.id === activeResumeId;
                  return (
                    <button key={r.id} type="button" onClick={() => selectResume(r.id)} className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${isActive ? "bg-muted/20" : "hover:bg-muted/10"}`}>
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/20"><FileText className="h-4 w-4 text-muted-foreground" /></div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-foreground">{r.title}</p>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" /> {formatDate(r.updatedAt)} <span className="mx-0.5">·</span> <span className="capitalize">{r.status}</span></p>
                      </div>
                      {isActive && <Check className="h-4 w-4 shrink-0 text-foreground" />}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tool Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TOOLS.map((t) => {
          const active = activeTool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => { setActiveTool(t.id); setError(null); }}
              className={`flex shrink-0 items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-primary text-primary hover:border-primary/40 hover:bg-primary/10"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ═══════════ TOOL 1: Resume Improver ═══════════ */}
      {activeTool === "improver" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Goal</label>
              <div className="grid gap-3 sm:grid-cols-3">
                {GOALS.map((g) => {
                  const active = goal === g.id;
                  return (
                    <button key={g.id} onClick={() => { setGoal(g.id); setImproverResult(null); setFullResumeImproved(null); setImproverApplied(false); setError(null); }}
                      className={`flex items-center gap-2 rounded-lg border p-3 text-left text-sm font-medium transition-colors ${active ? "border-foreground bg-foreground/5 text-foreground" : "border-border hover:bg-muted/10 text-muted-foreground"}`}>
                      <g.icon className="h-4 w-4" /> {g.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Target Role <span className="text-muted-foreground font-normal">(optional)</span></label>
              <Input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="e.g. Senior Frontend Engineer" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Job Description <span className="text-muted-foreground font-normal">(optional)</span></label>
              <textarea
                value={jobDescriptionImprover}
                onChange={(e) => setJobDescriptionImprover(e.target.value)}
                placeholder="Paste the job description to tailor improvements..."
                rows={5}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={handleImproverGenerate} disabled={!canImprove}>
                {improveSection.isPending || improveFullResume.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Improving...</> : <><Sparkles className="mr-2 h-4 w-4" /> Improve Resume</>}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Resume Improver uses 0.50 credits &middot;{" "}
              <Link href="/pricing" className="text-foreground underline underline-offset-2">
                Get more credits
              </Link>
            </p>
          </div>

          {/* Current content (hidden when results show) */}
          {!improverResult && activeResumeId && !resumeLoading && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <h2 className="text-base font-semibold text-foreground">Current Content</h2>
              {currentContent ? (
                <div className="space-y-3">
                  {parseContentBlocks(currentContent, goal === "summary" ? "Summary" : goal === "experience" ? "Experience" : "Section").map((block, i) => (
                    <div key={`cur-${i}`} className="rounded-lg border border-border bg-muted/10 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{block.label}</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{block.value}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground">No content found for this section. Fill in your resume first.</p>}
            </div>
          )}

          {/* Before / After */}
          {improverResult && (
            <div className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Before</h3>
                  {parseContentBlocks(improverOriginal ?? "", goal === "summary" ? "Summary" : goal === "experience" ? "Experience" : "Section").map((block, i) => (
                    <div key={`bef-${i}`} className="rounded-lg border border-border bg-muted/10 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{block.label}</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{block.value}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-green-300 bg-green-50 p-5 space-y-3">
                  <h3 className="text-sm font-semibold text-green-900 uppercase tracking-wide">After</h3>
                  {parseContentBlocks(improverResult, goal === "summary" ? "Summary" : goal === "experience" ? "Experience" : "Section").map((block, i) => (
                    <div key={`aft-${i}`} className="rounded-lg border border-green-200 bg-white/80 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-green-800">{block.label}</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-green-950">{block.value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleImproverApply} disabled={improverApplied || updateResume.isPending}>
                  {updateResume.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Applying...</> : improverApplied ? <><Check className="mr-2 h-4 w-4" /> Applied</> : "Apply to Resume"}
                </Button>
                <Button variant="outline" onClick={() => handleCopy(improverResult)} className="hover:bg-muted/10 hover:text-foreground">
                  {copied ? <><Check className="mr-2 h-4 w-4" /> Copied</> : <><Copy className="mr-2 h-4 w-4" /> Copy</>}
                </Button>
                <Button variant="outline" onClick={handleImproverGenerate} disabled={isGenerating} className="hover:bg-muted/10 hover:text-foreground">
                  <RefreshCw className={`mr-2 h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} /> Regenerate
                </Button>
              </div>
              {improverApplied && (
                <p className="text-sm text-muted-foreground">Changes saved. View in <Link href="/dashboard/documents/resume" className="underline text-foreground">Documents</Link>.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══════════ TOOL 2: Keyword Booster ═══════════ */}
      {activeTool === "keywords" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Job Description</label>
              <textarea
                value={jobDescriptionKw}
                onChange={(e) => setJobDescriptionKw(e.target.value)}
                placeholder="Paste the full job description here..."
                rows={6}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={handleKeywordGenerate} disabled={!canKeyword}>
                {keywordBooster.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</> : <><Target className="mr-2 h-4 w-4" /> Find Missing Keywords</>}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Keyword Booster uses 0.25 credits &middot;{" "}
              <Link href="/pricing" className="text-foreground underline underline-offset-2">
                Get more credits
              </Link>
            </p>
          </div>

          {keywordResults && (
            <div className="space-y-4">
              {keywordResults.length === 0 ? (
                <div className="rounded-xl border border-green-300 bg-green-50 p-5 text-center">
                  <Check className="mx-auto h-8 w-8 text-green-600" />
                  <p className="mt-2 font-medium text-green-900">Your resume already covers all the key terms.</p>
                  <p className="text-sm text-green-700">No missing keywords detected for this job description.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold text-foreground">{keywordResults.length} Missing Keywords Found</h2>
                    <div className="flex gap-2 text-xs">
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-red-700">High</span>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">Medium</span>
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-600">Low</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {keywordResults.map((kw, i) => (
                      <div key={`kw-${i}`} className="rounded-xl border border-border bg-card p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground">{kw.keyword}</span>
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                kw.importance === "high" ? "bg-red-100 text-red-700" :
                                kw.importance === "medium" ? "bg-amber-100 text-amber-700" :
                                "bg-zinc-100 text-zinc-600"
                              }`}>{kw.importance}</span>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              <span className="font-medium text-foreground">Place in:</span> <span className="capitalize">{kw.section}</span>
                            </p>
                            <div className="mt-2 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-2.5">
                              <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
                              <p className="text-sm text-green-900">{kw.suggestion}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══════════ TOOL 3: Achievement Builder ═══════════ */}
      {activeTool === "achievements" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            {data?.experiences && data.experiences.length > 0 ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Select Experience</label>
                  <div className="space-y-2">
                    {data.experiences.map((exp, i) => (
                      <button key={exp.id} onClick={() => { setSelectedExpIndex(i); setAchievementResult(null); setAchievementApplied(false); setError(null); }}
                        className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                          selectedExpIndex === i ? "border-foreground bg-foreground/5" : "border-border hover:bg-muted/10"
                        }`}>
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/20">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-medium truncate ${selectedExpIndex === i ? "text-foreground" : "text-muted-foreground"}`}>{exp.jobTitle || "Untitled Role"}</p>
                          <p className="text-xs text-muted-foreground">{exp.employer || "Unknown Company"} {exp.startDate && `· ${exp.startDate}`}</p>
                        </div>
                        {selectedExpIndex === i && <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-foreground" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Target Role <span className="text-muted-foreground font-normal">(optional)</span></label>
                  <Input value={achievementTargetRole} onChange={(e) => setAchievementTargetRole(e.target.value)} placeholder="e.g. Engineering Manager" />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={handleAchievementGenerate} disabled={!canAchievement}>
                    {achievementBuilder.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Building...</> : <><Trophy className="mr-2 h-4 w-4" /> Build Achievement Bullets</>}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Achievement Builder uses 0.25 credits &middot;{" "}
                  <Link href="/pricing" className="text-foreground underline underline-offset-2">
                    Get more credits
                  </Link>
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No experiences found. Add work experience to your resume first.</p>
            )}
          </div>

          {/* Current description */}
          {!achievementResult && data?.experiences?.[selectedExpIndex]?.description && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <h2 className="text-base font-semibold text-foreground">Current Description</h2>
              <div className="rounded-lg border border-border bg-muted/10 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {data.experiences[selectedExpIndex].jobTitle} at {data.experiences[selectedExpIndex].employer}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{data.experiences[selectedExpIndex].description}</p>
              </div>
            </div>
          )}

          {/* Achievement results */}
          {achievementResult && (
            <div className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Original</h3>
                  <div className="rounded-lg border border-border bg-muted/10 p-3">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{data?.experiences?.[selectedExpIndex]?.description}</p>
                  </div>
                </div>
                <div className="rounded-xl border border-green-300 bg-green-50 p-5 space-y-3">
                  <h3 className="text-sm font-semibold text-green-900 uppercase tracking-wide">Achievement Bullets</h3>
                  <div className="space-y-2">
                    {achievementResult.split("\n").filter((l) => l.trim()).map((line, i) => (
                      <div key={`bullet-${i}`} className="flex items-start gap-2 rounded-lg border border-green-200 bg-white/80 p-3">
                        <ArrowUp className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                        <p className="text-sm leading-relaxed text-green-950">{line.replace(/^[-•]\s*/, "")}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleAchievementApply} disabled={achievementApplied || updateResume.isPending}>
                  {updateResume.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Applying...</> : achievementApplied ? <><Check className="mr-2 h-4 w-4" /> Applied</> : "Apply to Resume"}
                </Button>
                <Button variant="outline" onClick={() => handleCopy(achievementResult)} className="hover:bg-muted/10 hover:text-foreground">
                  {copied ? <><Check className="mr-2 h-4 w-4" /> Copied</> : <><Copy className="mr-2 h-4 w-4" /> Copy</>}
                </Button>
                <Button variant="outline" onClick={handleAchievementGenerate} disabled={isGenerating} className="hover:bg-muted/10 hover:text-foreground">
                  <RefreshCw className={`mr-2 h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} /> Regenerate
                </Button>
              </div>
              {achievementApplied && (
                <p className="text-sm text-muted-foreground">Bullets applied. View in <Link href="/dashboard/documents/resume" className="underline text-foreground">Documents</Link>.</p>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
