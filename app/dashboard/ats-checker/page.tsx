"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Check,
  FileText,
  Loader2,
  Search,
  ShieldCheck,
  Upload,
} from "@/components/ui/icons";

import { Button } from "@/components/ui/button";
import { trpc } from "@/trpc/client";
import { readSharedJobTargetDraft, writeSharedJobTargetDraft } from "@/lib/job-target";

type Atsi = {
  section: string;
  score: number;
  notes: string;
};

type Improvement = {
  title: string;
  why: string;
  example: string;
};

type AtsReport = {
  overallScore: number;
  atsCompatibility: "Low" | "Medium" | "High" | string;
  summary: string;
  strengths: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
  topActions: string[];
  rewrittenSummary: string;
  sectionScores: Atsi[];
  improvements: Improvement[];
  placeholderWarnings: string[];
  parseWarnings: string[];
  scoringVersion: string;
};

const MAX_SIZE_MB = 10;

function readInitialJobDescription() {
  if (typeof window === "undefined") return "";
  return readSharedJobTargetDraft(localStorage).jobDescription;
}

export default function AtsCheckerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState(readInitialJobDescription);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<AtsReport | null>(null);
  const [sourceLabel, setSourceLabel] = useState<string>("");
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [resumeQuery, setResumeQuery] = useState("");

  const { data: resumes = [], isLoading: resumesLoading } = trpc.resume.listSummary.useQuery();
  const activeResumeId = selectedResumeId ?? resumes[0]?.id ?? null;

  const filteredResumes = useMemo(() => {
    if (!resumeQuery.trim()) return resumes;
    const query = resumeQuery.toLowerCase();
    return resumes.filter((resume) => resume.title.toLowerCase().includes(query));
  }, [resumeQuery, resumes]);

  const isInvalidType = useMemo(() => {
    if (!file) return false;
    const name = file.name.toLowerCase();
    return !name.endsWith(".pdf") && !name.endsWith(".docx");
  }, [file]);

  const isInvalidSize = useMemo(() => {
    if (!file) return false;
    return file.size > MAX_SIZE_MB * 1024 * 1024;
  }, [file]);

  const canAnalyzeUpload = !!file && !isInvalidType && !isInvalidSize && !isAnalyzing;
  const canAnalyzeCurrent = !!activeResumeId && !isAnalyzing;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const current = readSharedJobTargetDraft(localStorage);
    writeSharedJobTargetDraft(localStorage, {
      role: current.role,
      jobDescription,
    });
  }, [jobDescription]);

  async function runAnalysis(mode: "upload" | "current") {
    if (mode === "upload" && !file) return;
    if (mode === "current" && !activeResumeId) return;

    setError(null);
    setReport(null);

    try {
      setIsAnalyzing(true);

      const formData = new FormData();
      formData.append("requestId", crypto.randomUUID());
      if (jobDescription.trim()) {
        formData.append("jobDescription", jobDescription.trim());
      }
      if (mode === "upload" && file) {
        formData.append("file", file);
      }
      if (mode === "current" && activeResumeId) {
        formData.append("resumeId", activeResumeId);
      }

      const response = await fetch("/api/ats-check", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.message || body.error || "Failed to analyze resume");
      }

      const body = await response.json();
      setReport(body.report as AtsReport);
      setSourceLabel(mode === "current" ? "Saved resume analysis" : `Uploaded file analysis: ${file?.name || ""}`);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Something went wrong while analyzing your resume.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground lg:text-3xl">ATS Checker</h1>
        <p className="mt-1 text-muted-foreground">
          Analyze your saved resume or upload an exported file to compare ATS match and recruiter impact.
        </p>
      </div>

      <div className="space-y-6 rounded-xl bg-card">
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Current Resume</label>
            {resumesLoading ? (
              <div className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">
                Loading resumes...
              </div>
            ) : resumes.length === 0 ? (
              <div className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground">
                No resumes found yet.
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={resumeQuery}
                    onChange={(e) => setResumeQuery(e.target.value)}
                    placeholder="Search your resumes..."
                    className="w-full rounded-lg border border-border bg-background py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
                  />
                </div>
                <div className="max-h-56 space-y-2 overflow-y-auto">
                  {filteredResumes.map((resume) => {
                    const isActive = resume.id === activeResumeId;
                    return (
                      <button
                        key={resume.id}
                        type="button"
                        onClick={() => {
                          setSelectedResumeId(resume.id);
                          setReport(null);
                          setError(null);
                        }}
                        className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                          isActive ? "border-foreground bg-foreground/5" : "border-border hover:bg-muted/10"
                        }`}
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/20">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{resume.title}</p>
                          <p className="text-xs text-muted-foreground capitalize">{resume.status}</p>
                        </div>
                        {isActive ? <Check className="h-4 w-4 shrink-0 text-foreground" /> : null}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="job-description" className="text-sm font-medium text-foreground">
              Target Job Description (optional, improves keyword accuracy)
            </label>
            <textarea
              id="job-description"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here for more accurate ATS matching..."
              rows={5}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-0 placeholder:text-muted-foreground focus:border-amber-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => runAnalysis("current")} disabled={!canAnalyzeCurrent} className="w-full sm:w-auto">
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Analyze Current Resume"
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            This is the canonical in-app ATS analysis because it reads your saved resume data directly.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <label
            htmlFor="ats-upload"
            className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border p-8 text-center hover:bg-muted/5"
          >
            <Upload className="h-8 w-8 text-primary" />
            <div>
              <p className="font-medium text-foreground">Upload exported resume (PDF or DOCX)</p>
              <p className="text-sm text-muted-foreground">Max file size {MAX_SIZE_MB}MB</p>
            </div>
          </label>

          <input
            id="ats-upload"
            type="file"
            accept=".pdf,.docx"
            className="hidden"
            onChange={(e) => {
              const nextFile = e.target.files?.[0] ?? null;
              setFile(nextFile);
              setReport(null);
              setError(null);
            }}
          />

          {file && (
            <div className="rounded-lg border border-border px-3 py-2 text-sm">
              <span className="font-medium text-foreground">Selected:</span> {file.name}
            </div>
          )}

          {isInvalidType && (
            <p className="text-sm text-red-600">Only PDF and DOCX files are supported.</p>
          )}

          {isInvalidSize && (
            <p className="text-sm text-red-600">File size must be under {MAX_SIZE_MB}MB.</p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => runAnalysis("upload")} disabled={!canAnalyzeUpload} className="w-full sm:w-auto">
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Analyze Uploaded File"
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Use PDF when re-checking a Craftiv export. Word export is still delivered as `DOC`, so file parity is most reliable with PDF right now.
          </p>
          <p className="text-xs text-muted-foreground">
            ATS Checker uses 1 credit &middot;{" "}
            <Link href="/pricing" className="text-foreground underline underline-offset-2">
              Get more credits
            </Link>
          </p>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {report && (
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Source:</span> {sourceLabel}
            <span className="mx-2">·</span>
            <span className="font-medium text-foreground">Scoring version:</span> {report.scoringVersion}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Overall ATS Score</p>
              <p className="mt-1 text-3xl font-bold text-foreground">{report.overallScore}/100</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Compatibility</p>
              <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
                <ShieldCheck className="h-4 w-4" />
                {report.atsCompatibility}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Top Priority</p>
              <p className="mt-1 text-sm text-foreground">{report.topActions?.[0] || "Improve work impact bullets"}</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Score is computed using the same deterministic ATS analyzer that powers AI Resume Assistant impact previews.
          </p>

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold text-foreground">Recruiter Summary</h2>
            <p className="mt-2 text-sm text-muted-foreground">{report.summary}</p>
          </div>

          {(report.placeholderWarnings.length > 0 || report.parseWarnings.length > 0) && (
            <div className="grid gap-4 lg:grid-cols-2">
              {report.placeholderWarnings.length > 0 && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                  <h3 className="text-base font-semibold text-foreground">Blocking Placeholders</h3>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-red-700">
                    {report.placeholderWarnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
              {report.parseWarnings.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                  <h3 className="text-base font-semibold text-foreground">Parse Notes</h3>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-amber-700">
                    {report.parseWarnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-base font-semibold text-foreground">Strengths</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {(report.strengths || []).map((item, idx) => (
                  <li key={`${item}-${idx}`} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-base font-semibold text-foreground">Matched Keywords</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {(report.matchedKeywords || []).map((keyword, idx) => (
                  <span
                    key={`${keyword}-${idx}`}
                    className="rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs text-green-700"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-base font-semibold text-foreground">Missing Keywords</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {(report.missingKeywords || []).map((keyword, idx) => (
                <span
                  key={`${keyword}-${idx}`}
                  className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs text-amber-700"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-base font-semibold text-foreground">Section Scores</h3>
            <div className="mt-3 space-y-3">
              {(report.sectionScores || []).map((s, idx) => (
                <div key={`${s.section}-${idx}`} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground">{s.section}</p>
                    <p className="text-sm font-semibold text-foreground">{s.score}/100</p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{s.notes}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-base font-semibold text-foreground">How To Improve</h3>
            <div className="mt-3 space-y-3">
              {(report.improvements || []).map((item, idx) => (
                <div key={`${item.title}-${idx}`} className="rounded-lg border border-border p-3">
                  <p className="font-medium text-foreground">{item.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.why}</p>
                  <p className="mt-2 rounded-md bg-muted/40 px-2 py-2 text-sm text-foreground">
                    Example: {item.example}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <h3 className="text-base font-semibold text-foreground">Improved Summary Suggestion</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{report.rewrittenSummary}</p>
          </div>
        </div>
      )}
    </div>
  );
}
