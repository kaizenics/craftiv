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
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/trpc/client";
import type { ResumeDataJSON } from "@/db/schema";

type Goal = "summary" | "experience" | "full";

const GOALS: { id: Goal; label: string; description: string; icon: typeof ScrollText }[] = [
  {
    id: "summary",
    label: "Rewrite Summary",
    description: "Make your professional summary more compelling and ATS-friendly",
    icon: ScrollText,
  },
  {
    id: "experience",
    label: "Improve Experience",
    description: "Strengthen your work experience bullets with action verbs and metrics",
    icon: Briefcase,
  },
  {
    id: "full",
    label: "Improve Full Resume",
    description: "Get a complete AI rewrite of all resume content at once",
    icon: FileText,
  },
];

export default function AIAssistantPage() {
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [goal, setGoal] = useState<Goal>("summary");
  const [targetRole, setTargetRole] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [fullResumeImproved, setFullResumeImproved] = useState<Record<string, any> | null>(null);
  const [originalContent, setOriginalContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);
  const [copied, setCopied] = useState(false);

  const [selectorOpen, setSelectorOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const selectorRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: resumes = [], isLoading: resumesLoading } = trpc.resume.list.useQuery();

  const activeResumeId = selectedResumeId ?? resumes[0]?.id ?? null;
  const activeResume = resumes.find((r) => r.id === activeResumeId);

  const filteredResumes = useMemo(() => {
    if (!searchQuery.trim()) return resumes;
    const q = searchQuery.toLowerCase();
    return resumes.filter((r) => r.title.toLowerCase().includes(q));
  }, [resumes, searchQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (selectorRef.current && !selectorRef.current.contains(e.target as Node)) {
        setSelectorOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: resumeData, isLoading: resumeLoading } = trpc.resume.getById.useQuery(
    { id: activeResumeId! },
    { enabled: !!activeResumeId },
  );

  const data = resumeData?.data as ResumeDataJSON | null | undefined;

  const improveSection = trpc.ai.improveSection.useMutation();
  const improveFullResume = trpc.ai.improveFullResume.useMutation();
  const utils = trpc.useUtils();
  const updateResume = trpc.resume.update.useMutation({
    onSuccess: () => {
      utils.resume.getById.invalidate({ id: activeResumeId! });
      utils.resume.list.invalidate();
    },
  });

  const isGenerating = improveSection.isPending || improveFullResume.isPending;

  const currentContent = useMemo(() => {
    if (!data) return null;
    if (goal === "summary") {
      return data.summary || null;
    }
    if (goal === "experience") {
      const descriptions = (data.experiences ?? [])
        .filter((e) => e.description?.trim())
        .map((e) => `${e.jobTitle} at ${e.employer}:\n${e.description}`)
        .join("\n\n");
      return descriptions || null;
    }
    if (goal === "full") {
      const parts: string[] = [];
      if (data.summary) parts.push(`Summary:\n${data.summary}`);
      for (const exp of data.experiences ?? []) {
        if (exp.description?.trim()) {
          parts.push(`${exp.jobTitle} at ${exp.employer}:\n${exp.description}`);
        }
      }
      for (const edu of data.educations ?? []) {
        if (edu.description?.trim()) {
          parts.push(`${edu.degree} at ${edu.schoolName}:\n${edu.description}`);
        }
      }
      return parts.length > 0 ? parts.join("\n\n") : null;
    }
    return null;
  }, [data, goal]);

  function formatResumeDataAsText(d: Record<string, any>): string {
    const parts: string[] = [];
    if (d.summary) parts.push(`Summary:\n${d.summary}`);
    if (Array.isArray(d.experiences)) {
      for (const exp of d.experiences) {
        if (exp.description?.trim()) {
          parts.push(`${exp.jobTitle || "Role"} at ${exp.employer || "Company"}:\n${exp.description}`);
        }
      }
    }
    if (Array.isArray(d.educations)) {
      for (const edu of d.educations) {
        if (edu.description?.trim()) {
          parts.push(`${edu.degree || "Degree"} at ${edu.schoolName || "School"}:\n${edu.description}`);
        }
      }
    }
    return parts.join("\n\n");
  }

  function formatDate(date: Date | string): string {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  const canGenerate = !!activeResumeId && !!currentContent && !isGenerating;

  const handleGenerate = async () => {
    if (!activeResumeId || !currentContent) return;

    setError(null);
    setResult(null);
    setFullResumeImproved(null);
    setApplied(false);
    setOriginalContent(currentContent);

    try {
      if (goal === "summary") {
        const res = await improveSection.mutateAsync({
          resumeId: activeResumeId,
          section: "summary",
          content: data!.summary,
          targetRole: targetRole || undefined,
        });
        setResult(res.improved);
      } else if (goal === "experience") {
        const allDescriptions = (data!.experiences ?? [])
          .filter((e) => e.description?.trim())
          .map((e) => e.description)
          .join("\n\n---\n\n");
        const res = await improveSection.mutateAsync({
          resumeId: activeResumeId,
          section: "experience",
          content: allDescriptions,
          targetRole: targetRole || undefined,
        });
        setResult(res.improved);
      } else {
        const res = await improveFullResume.mutateAsync({
          resumeId: activeResumeId,
          targetRole: targetRole || undefined,
        });
        setFullResumeImproved(res.improved);
        setResult(formatResumeDataAsText(res.improved));
      }
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
    }
  };

  const handleApply = async () => {
    if (!activeResumeId || !result || !data) return;

    try {
      if (goal === "summary") {
        await updateResume.mutateAsync({
          id: activeResumeId,
          data: { ...data, summary: result },
        });
      } else if (goal === "experience") {
        const parts = result.split(/\n\n---\n\n|\n\n(?=[A-Z])/);
        const updatedExperiences = data.experiences.map((exp, i) => {
          if (!exp.description?.trim()) return exp;
          const improved = parts.shift();
          return improved ? { ...exp, description: improved } : exp;
        });
        await updateResume.mutateAsync({
          id: activeResumeId,
          data: { ...data, experiences: updatedExperiences },
        });
      } else if (fullResumeImproved) {
        await updateResume.mutateAsync({
          id: activeResumeId,
          data: { ...data, ...fullResumeImproved },
        });
      }
      setApplied(true);
    } catch (e: any) {
      setError(e.message || "Failed to apply changes.");
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (resumesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Image
            src="/cv.gif"
            alt="Loading"
            width={80}
            height={80}
            className="mx-auto mb-4"
            unoptimized
          />
          <p className="text-muted-foreground">Loading your resumes...</p>
        </div>
      </div>
    );
  }

  if (resumes.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground lg:text-3xl">AI Resume Assistant</h1>
          <p className="mt-1 text-muted-foreground">
            AI-powered improvements for your resume content.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-12 text-center">
          <Sparkles className="h-10 w-10 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold text-foreground">No resumes yet</h2>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            Create your first resume to start using the AI Resume Assistant.
          </p>
          <Link href="/resume/templates">
            <Button className="mt-4">Create Resume</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground lg:text-3xl">AI Resume Assistant</h1>
        <p className="mt-1 text-muted-foreground">
          Select a resume, choose what to improve, and let AI enhance your content.
        </p>
      </div>

      {/* Configuration Card */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-5">
        {/* Resume Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Resume</label>
          <div className="relative" ref={selectorRef}>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={selectorOpen ? searchQuery : (activeResume?.title ?? "")}
                placeholder="Search your resumes..."
                onFocus={() => {
                  setSelectorOpen(true);
                  setSearchQuery("");
                }}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-9 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring"
              />
              {selectorOpen && searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {activeResume && !selectorOpen && (
              <p className="mt-1.5 flex items-center gap-1 px-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatDate(activeResume.updatedAt)}
                <span className="mx-0.5">·</span>
                <span className="capitalize">{activeResume.status}</span>
              </p>
            )}

            {selectorOpen && (
              <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
                {filteredResumes.length === 0 ? (
                  <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                    No resumes matching &ldquo;{searchQuery}&rdquo;
                  </div>
                ) : (
                  filteredResumes.map((r) => {
                    const isActive = r.id === activeResumeId;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          setSelectedResumeId(r.id);
                          setSelectorOpen(false);
                          setSearchQuery("");
                          setResult(null);
                          setFullResumeImproved(null);
                          setApplied(false);
                          setError(null);
                        }}
                        className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${
                          isActive ? "bg-muted/20" : "hover:bg-muted/10"
                        }`}
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/20">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-foreground">{r.title}</p>
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDate(r.updatedAt)}
                            <span className="mx-0.5">·</span>
                            <span className="capitalize">{r.status}</span>
                          </p>
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

        {/* Goal Tabs */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Goal</label>
          <div className="grid gap-3 sm:grid-cols-3">
            {GOALS.map((g) => {
              const active = goal === g.id;
              return (
                <button
                  key={g.id}
                  onClick={() => {
                    setGoal(g.id);
                    setResult(null);
                    setFullResumeImproved(null);
                    setApplied(false);
                    setError(null);
                  }}
                  className={`flex flex-col items-start rounded-lg border p-3 text-left transition-colors ${
                    active
                      ? "border-foreground bg-foreground/5"
                      : "border-border hover:bg-muted/10"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <g.icon className={`h-4 w-4 ${active ? "text-foreground" : "text-muted-foreground"}`} />
                    <span className={`text-sm font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>
                      {g.label}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{g.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Target Role */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Target Role <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <Input
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g. Senior Frontend Engineer"
          />
        </div>

        {/* Generate Button */}
        <Button onClick={handleGenerate} disabled={!canGenerate} className="w-full sm:w-auto">
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Improvement
            </>
          )}
        </Button>
      </div>

      {/* Current Content Preview — hidden once results are showing */}
      {activeResumeId && !resumeLoading && !result && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            Current Content
          </h2>
          {currentContent ? (
            <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans leading-relaxed">
              {currentContent}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground">
              No content found for this section. Fill in your resume first before using AI improvements.
            </p>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Panel */}
      {result && (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Before */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Before</h3>
              <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans leading-relaxed">
                {originalContent}
              </pre>
            </div>

            {/* After */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-2">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">After</h3>
              <pre className="whitespace-pre-wrap text-sm text-foreground font-sans leading-relaxed">
                {result}
              </pre>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleApply}
              disabled={applied || updateResume.isPending}
            >
              {updateResume.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Applying...
                </>
              ) : applied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Applied to Resume
                </>
              ) : (
                "Apply to Resume"
              )}
            </Button>

            <Button variant="outline" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </>
              )}
            </Button>

            <Button variant="outline" onClick={handleGenerate} disabled={isGenerating}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
              Regenerate
            </Button>
          </div>

          {applied && (
            <p className="text-sm text-muted-foreground">
              Changes saved. You can view the updated resume in{" "}
              <Link href="/dashboard/documents" className="underline text-foreground">
                Documents
              </Link>.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
