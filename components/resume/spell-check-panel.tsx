"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/client";
import { cn } from "@/lib/utils";
import { applyFixToResume, type SpellIssue } from "@/lib/resume-fix";
import type { ResumeData } from "@/lib/types/resume";
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Check,
} from "lucide-react";

// ── Type badge styles ───────────────────────────────────────────────────────

const TYPE_STYLES: Record<string, string> = {
  spelling: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  grammar: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  placeholder: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  content: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

function typeBadgeClass(type: string) {
  return TYPE_STYLES[type] ?? "bg-muted text-muted-foreground";
}

function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

// ── Component ───────────────────────────────────────────────────────────────

interface SpellCheckPanelProps {
  resumeId: string | null;
  resumeData: ResumeData;
  onResumeDataChange: (data: ResumeData) => void;
}

export function SpellCheckPanel({
  resumeId,
  resumeData,
  onResumeDataChange,
}: SpellCheckPanelProps) {
  const [issues, setIssues] = useState<SpellIssue[]>([]);
  const [hasScanned, setHasScanned] = useState(false);
  const [appliedFixes, setAppliedFixes] = useState<Set<number>>(new Set());
  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null);

  const spellCheck = trpc.ai.spellCheck.useMutation();
  const generateSuggestion = trpc.ai.generateSuggestion.useMutation();

  const handleScan = async () => {
    if (!resumeId) return;
    setHasScanned(false);
    setAppliedFixes(new Set());
    try {
      const result = await spellCheck.mutateAsync({ resumeId });
      setIssues(result.issues);
    } catch {
      setIssues([]);
    } finally {
      setHasScanned(true);
    }
  };

  const handleApplyFix = (index: number) => {
    const issue = issues[index];
    if (!issue) return;

    const updated = applyFixToResume(resumeData, issue);
    onResumeDataChange(updated);
    setAppliedFixes((prev) => new Set(prev).add(index));
  };

  const handleApplyAll = () => {
    let current = resumeData;
    const newFixed = new Set(appliedFixes);

    for (let i = 0; i < issues.length; i++) {
      if (!newFixed.has(i)) {
        current = applyFixToResume(current, issues[i]);
        newFixed.add(i);
      }
    }

    onResumeDataChange(current);
    setAppliedFixes(newFixed);
  };

  const handleGenerateSuggestion = async (index: number) => {
    if (!resumeId) return;
    const issue = issues[index];
    if (!issue) return;

    setGeneratingIndex(index);
    try {
      const result = await generateSuggestion.mutateAsync({
        resumeId,
        field: issue.field,
        currentContent: issue.original,
        issueType: issue.type,
      });
      setIssues((prev) =>
        prev.map((item, i) =>
          i === index ? { ...item, corrected: result.suggestion } : item,
        ),
      );
    } catch {
      // keep existing suggestion
    } finally {
      setGeneratingIndex(null);
    }
  };

  const unfixedCount = issues.length - appliedFixes.size;

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl sm:text-2xl font-bold">AI Review</h2>
      <p className="text-xs sm:text-sm text-muted-foreground">
        Scans your resume for spelling errors, grammar issues, placeholder text,
        and inappropriate content — then suggests fixes.
      </p>
      <div className="border-b pb-4" />

      {/* Scan button */}
      <Button
        onClick={handleScan}
        disabled={spellCheck.isPending || !resumeId}
        className="w-full"
      >
        {spellCheck.isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Scanning resume…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            {hasScanned ? "Re-scan Resume" : "Scan Resume with AI"}
          </>
        )}
      </Button>

      {!resumeId && (
        <p className="text-xs text-muted-foreground text-center">
          Sign in and save your resume to use AI review.
        </p>
      )}

      {/* Error */}
      {spellCheck.error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{spellCheck.error.message}</span>
        </div>
      )}

      {/* No issues */}
      {hasScanned && issues.length === 0 && (
        <div className="text-center py-6">
          <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-3" />
          <p className="font-medium text-green-700 dark:text-green-400">
            No issues found!
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Your resume looks great — no errors detected.
          </p>
        </div>
      )}

      {/* Issues list */}
      {hasScanned && issues.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {issues.length} issue{issues.length !== 1 ? "s" : ""} found
            </p>
            {unfixedCount > 1 && (
              <Button size="sm" variant="outline" onClick={handleApplyAll} className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                Fix All
              </Button>
            )}
          </div>

          {issues.map((issue, index) => (
            <IssueCard
              key={index}
              issue={issue}
              isFixed={appliedFixes.has(index)}
              isGenerating={generatingIndex === index}
              onApplyFix={() => handleApplyFix(index)}
              onGenerateSuggestion={() => handleGenerateSuggestion(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Issue card ──────────────────────────────────────────────────────────────

interface IssueCardProps {
  issue: SpellIssue;
  isFixed: boolean;
  isGenerating: boolean;
  onApplyFix: () => void;
  onGenerateSuggestion: () => void;
}

function IssueCard({
  issue,
  isFixed,
  isGenerating,
  onApplyFix,
  onGenerateSuggestion,
}: IssueCardProps) {
  const needsSuggestion = ["placeholder", "content"].includes(issue.type);

  return (
    <div
      className={cn(
        "border rounded-lg overflow-hidden transition-colors",
        isFixed
          ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
          : "bg-card",
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <span
          className={cn(
            "shrink-0 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded",
            typeBadgeClass(issue.type),
          )}
        >
          {issue.type || "spelling"}
        </span>
        <span className="text-xs font-medium text-muted-foreground truncate">
          {issue.field}
        </span>
        {isFixed && (
          <span className="ml-auto shrink-0 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Fixed
          </span>
        )}
      </div>

      {/* Body */}
      <div className="px-3 pb-2 space-y-2">
        <div>
          <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">
            Original
          </p>
          <p className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded px-2 py-1.5 line-through wrap-break-word">
            {truncate(issue.original, 120)}
          </p>
        </div>

        <div>
          <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-1">
            Suggested Fix
          </p>
          {isGenerating ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 border rounded px-2 py-1.5">
              <Loader2 className="h-3 w-3 animate-spin" />
              Generating suggestion…
            </div>
          ) : (
            <p className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded px-2 py-1.5 wrap-break-word">
              {truncate(issue.corrected, 200)}
            </p>
          )}
        </div>

        <p className="text-xs text-muted-foreground italic">
          &ldquo;{truncate(issue.context, 80)}&rdquo;
        </p>
      </div>

      {/* Actions */}
      {!isFixed && (
        <div className="flex border-t">
          {needsSuggestion && (
            <button
              onClick={onGenerateSuggestion}
              disabled={isGenerating}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2.5 text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors border-r disabled:opacity-50"
            >
              <Sparkles className="h-3 w-3" />
              AI Suggest
            </button>
          )}
          <button
            onClick={onApplyFix}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2.5 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
          >
            <Check className="h-3 w-3" />
            Apply Fix
          </button>
        </div>
      )}
    </div>
  );
}
