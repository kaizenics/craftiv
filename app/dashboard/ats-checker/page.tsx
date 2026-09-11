"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

import { AtsReportPanel } from "@/components/dashboard/ats-report-panel";
import { AtsResumePicker } from "@/components/dashboard/ats-resume-picker";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  FileText,
  Loader2,
  ScanSearch,
  Sparkles,
  Upload,
  X,
} from "@/components/ui/icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/trpc/client";
import { PageTour, useTourPending } from "@/components/onboarding/page-tour";
import { SampleBanner } from "@/components/onboarding/sample-banner";
import { SAMPLE_ATS_REPORT } from "@/lib/tour-samples";
import {
  saveAtsReport,
  saveJobDescriptionDraft,
  useJobDescriptionDraft,
  useLastAtsReport,
} from "@/lib/ats-client-store";
import { bandStyle } from "@/lib/ats-display";
import type { AtsCheckReport, PersistedAtsReport } from "@/lib/types/ats-report";
import { cn } from "@/lib/utils";

const MAX_SIZE_MB = 10;
const ACCEPTED_EXTENSIONS = [".pdf", ".docx"];

type InputMode = "saved" | "upload";

function fileRejectionReason(file: File | null): string | null {
  if (!file) return null;
  const name = file.name.toLowerCase();
  if (!ACCEPTED_EXTENSIONS.some((extension) => name.endsWith(extension))) {
    return "Only PDF and DOCX files are supported.";
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return `File size must be under ${MAX_SIZE_MB}MB.`;
  }
  return null;
}

function ReportSkeleton() {
  return (
    <div className="space-y-5" aria-hidden="true">
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-8">
          <div className="h-36 w-36 shrink-0 animate-pulse rounded-full bg-muted" />
          <div className="w-full space-y-3">
            <div className="h-3 w-28 animate-pulse rounded bg-muted" />
            <div className="h-7 w-32 animate-pulse rounded-4xl bg-muted" />
            <div className="h-16 w-full animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
      </div>
      <div className="h-9 w-full animate-pulse rounded-4xl bg-muted" />
      <div className="space-y-3 rounded-xl border border-border bg-card p-5">
        <div className="h-4 w-40 animate-pulse rounded bg-muted" />
        {[0, 1, 2].map((key) => (
          <div key={key} className="h-16 w-full animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  );
}

function EmptyReportState() {
  return (
    <div className="flex min-h-[24rem] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 p-8 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-4xl bg-primary/10">
        <ScanSearch className="h-6 w-6 text-primary" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-base font-semibold text-foreground">
        Your report will appear here
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
        Pick a resume on the left and run the check. You will get an overall score, a
        section-by-section breakdown, matched and missing keywords, and specific rewrites.
      </p>
    </div>
  );
}

export default function AtsCheckerPage() {
  const [mode, setMode] = useState<InputMode>("saved");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  const resultsRef = useRef<HTMLDivElement>(null);

  // The last report lives in localStorage and is read through an external store,
  // so a finished run and a page reload both render from the same source.
  const lastReport = useLastAtsReport();
  // A real report always wins; the sample only fills an empty results panel.
  const tourPending = useTourPending("ats-checker");

  const persistedJobDescription = useJobDescriptionDraft();
  const [jobDescriptionDraft, setJobDescriptionDraft] = useState<string | null>(null);
  const jobDescription = jobDescriptionDraft ?? persistedJobDescription;

  const { data: resumes = [], isLoading: resumesLoading } = trpc.resume.listSummary.useQuery();
  const activeResumeId = selectedResumeId ?? resumes[0]?.id ?? null;

  useEffect(() => {
    if (jobDescriptionDraft === null) return;
    saveJobDescriptionDraft(jobDescriptionDraft);
  }, [jobDescriptionDraft]);

  const rejectionReason = fileRejectionReason(file);
  const canAnalyze = isAnalyzing
    ? false
    : mode === "saved"
      ? !!activeResumeId
      : !!file && !rejectionReason;

  const acceptFile = useCallback((nextFile: File | null) => {
    setFile(nextFile);
    setError(null);
  }, []);

  function handleDrop(event: React.DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    const dropped = event.dataTransfer.files?.[0] ?? null;
    if (dropped) acceptFile(dropped);
  }

  async function runAnalysis() {
    if (!canAnalyze) return;

    setError(null);
    setIsAnalyzing(true);
    setStatusMessage("Analyzing your resume. This usually takes a few seconds.");

    try {
      const formData = new FormData();
      formData.append("requestId", crypto.randomUUID());
      if (jobDescription.trim()) {
        formData.append("jobDescription", jobDescription.trim());
      }
      if (mode === "upload" && file) {
        formData.append("file", file);
      }
      if (mode === "saved" && activeResumeId) {
        formData.append("resumeId", activeResumeId);
      }

      const response = await fetch("/api/ats-check", {
        method: "POST",
        body: formData,
      });

      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.message || body.error || "Failed to analyze resume");
      }

      const report = body.report as AtsCheckReport;
      const activeTitle =
        resumes.find((resume) => resume.id === activeResumeId)?.title ?? "Untitled";
      const persisted: PersistedAtsReport = {
        report,
        sourceLabel:
          mode === "saved"
            ? `Saved resume: ${activeTitle}`
            : `Uploaded file: ${file?.name ?? ""}`,
        savedAt: new Date().toISOString(),
      };

      saveAtsReport(persisted);

      const band = bandStyle(report.overallScore);
      setStatusMessage(
        `Analysis complete. Score ${report.overallScore} out of 100. ${band.label}.`
      );

      // On stacked layouts the report renders below the fold, so bring it into
      // view instead of leaving the user staring at an unchanged form.
      if (window.matchMedia("(max-width: 1023px)").matches) {
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        resultsRef.current?.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start",
        });
      }
    } catch (analysisError: unknown) {
      const message =
        analysisError instanceof Error
          ? analysisError.message
          : "Something went wrong while analyzing your resume.";
      setError(message);
      setStatusMessage(`Analysis failed. ${message}`);
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageTour tour="ats-checker" />
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground lg:text-3xl">
            ATS Checker
          </h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">
            See how a tracking system reads your resume, and what to change before you apply.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-4xl border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          1 credit per check
        </span>
      </header>

      {/* Screen readers get the outcome announced; sighted users get the gauge. */}
      <div role="status" aria-live="polite" className="sr-only">
        {statusMessage}
      </div>

      <div className="grid gap-6 lg:grid-cols-5 lg:items-start">
        <section
          data-tour="ats-setup"
          aria-labelledby="ats-setup-heading"
          className="space-y-5 rounded-xl border border-border bg-card p-5 lg:sticky lg:top-6 lg:col-span-2"
        >
          <h2 id="ats-setup-heading" className="sr-only">
            Set up your ATS check
          </h2>

          <div className="space-y-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span
                className="flex h-5 w-5 items-center justify-center rounded-4xl bg-primary/10 text-[0.6875rem] font-bold text-primary"
                aria-hidden="true"
              >
                1
              </span>
              What should we check?
            </p>

            <Tabs
              value={mode}
              onValueChange={(value) => {
                setMode(value as InputMode);
                setError(null);
              }}
            >
              <TabsList className="w-full">
                <TabsTrigger value="saved">
                  <FileText aria-hidden="true" />
                  Saved resume
                </TabsTrigger>
                <TabsTrigger value="upload">
                  <Upload aria-hidden="true" />
                  Upload a file
                </TabsTrigger>
              </TabsList>

              <TabsContent value="saved" className="mt-1">
                <AtsResumePicker
                  resumes={resumes}
                  isLoading={resumesLoading}
                  selectedId={activeResumeId}
                  onSelect={(id) => {
                    setSelectedResumeId(id);
                    setError(null);
                  }}
                />
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  Most accurate option: it reads your structured resume data directly, with
                  no export or parsing step in between.
                </p>
              </TabsContent>

              <TabsContent value="upload" className="mt-1 space-y-3">
                {/* sr-only (not `hidden`) keeps the input in the tab order, so the
                    file picker stays reachable by keyboard. `hidden` removed it entirely. */}
                <input
                  id="ats-upload"
                  type="file"
                  accept=".pdf,.docx"
                  className="peer sr-only"
                  onChange={(event) => acceptFile(event.target.files?.[0] ?? null)}
                />
                <label
                  htmlFor="ats-upload"
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors",
                    "peer-focus-visible:border-ring peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50",
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/40"
                  )}
                >
                  <Upload className="h-7 w-7 text-primary" aria-hidden="true" />
                  <span className="text-sm font-medium text-foreground">
                    Drop a file here, or browse
                  </span>
                  <span className="text-xs text-muted-foreground">
                    PDF or DOCX &middot; up to {MAX_SIZE_MB}MB
                  </span>
                </label>

                {file && (
                  <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
                    <FileText
                      className="h-4 w-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                      {file.name}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => acceptFile(null)}
                      aria-label={`Remove ${file.name}`}
                    >
                      <X aria-hidden="true" />
                    </Button>
                  </div>
                )}

                {rejectionReason && (
                  <p role="alert" className="text-sm text-destructive">
                    {rejectionReason}
                  </p>
                )}

                <p className="text-xs leading-relaxed text-muted-foreground">
                  Use PDF when re-checking a Craftiv export. Word export is still delivered
                  as DOC, so file parity is most reliable with PDF right now.
                </p>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="job-description"
              className="flex items-center gap-2 text-sm font-semibold text-foreground"
            >
              <span
                className="flex h-5 w-5 items-center justify-center rounded-4xl bg-primary/10 text-[0.6875rem] font-bold text-primary"
                aria-hidden="true"
              >
                2
              </span>
              Target job description
              <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <textarea
              id="job-description"
              data-tour="ats-jobdesc"
              value={jobDescription}
              onChange={(event) => setJobDescriptionDraft(event.target.value)}
              placeholder="Paste the job description for sharper keyword matching..."
              rows={5}
              aria-describedby="job-description-hint"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
            <p id="job-description-hint" className="text-xs text-muted-foreground">
              Applies to both saved resumes and uploaded files.
            </p>
          </div>

          <div className="space-y-2 border-t border-border pt-4">
            <Button
              onClick={runAnalysis}
              disabled={!canAnalyze}
              size="lg"
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden="true" />
                  Analyzing...
                </>
              ) : (
                <>
                  <ScanSearch aria-hidden="true" />
                  Run ATS check &middot; 1 credit
                </>
              )}
            </Button>

            {!canAnalyze && !isAnalyzing && (
              <p className="text-center text-xs text-muted-foreground">
                {mode === "saved"
                  ? "Select a saved resume to continue."
                  : "Add a PDF or DOCX file to continue."}
              </p>
            )}

            <p className="text-center text-xs text-muted-foreground">
              <Link
                href="/pricing"
                className="rounded-sm underline underline-offset-2 hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                Get more credits
              </Link>
            </p>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-destructive-border bg-destructive-surface p-3 text-sm text-destructive-surface-foreground"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </section>

        <div ref={resultsRef} data-tour="ats-report" className="scroll-mt-6 lg:col-span-3">
          {isAnalyzing ? (
            <ReportSkeleton />
          ) : lastReport ? (
            <AtsReportPanel
              report={lastReport.report}
              sourceLabel={lastReport.sourceLabel}
              savedAt={lastReport.savedAt}
            />
          ) : tourPending ? (
            <div className="space-y-4">
              <SampleBanner title="Sample report.">
                This is what a check produces. Nothing here is saved, and it disappears when the
                tour ends.
              </SampleBanner>
              <AtsReportPanel report={SAMPLE_ATS_REPORT} sourceLabel="Sample resume" savedAt="" />
            </div>
          ) : (
            <EmptyReportState />
          )}
        </div>
      </div>
    </div>
  );
}
