
"use client";

import { useState } from "react";
import {
  BadgeInfo,
  ScanSearch,
  Sparkles,
  SpellCheck,
} from "@/components/ui/icons";
import { useRouter } from "next/navigation";
import { CreateResumeCard } from "@/components/dashboard/create-resume-card";
import { ResumeCardPreview } from "@/components/dashboard/resume-card-preview";
import { CoverLetterCardPreview } from "@/components/dashboard/cover-letter-card-preview";
import { ActionPlan } from "@/components/dashboard/action-plan";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { TipsCard } from "@/components/dashboard/tips-card";
import { PageTour } from "@/components/onboarding/page-tour";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { trpc } from "@/trpc/client";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { ResumeRowActions } from "@/components/dashboard/resume-row-actions";
import { CoverLetterRowActions } from "@/components/dashboard/cover-letter-row-actions";
import { PublicBadge } from "@/components/share/public-badge";

/** Placeholder rows shaped like the recent-documents table while it loads. */
function DocumentRowsSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-2xl bg-card shadow-sm"
      aria-busy="true"
      aria-label="Loading documents"
    >
      <div className="hidden items-center gap-4 border-b border-border/70 bg-muted/30 px-5 py-3 md:grid md:grid-cols-[minmax(0,2.6fr)_170px_185px_190px_110px]">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-28" />
        <span />
      </div>
      {Array.from({ length: 3 }, (_, i) => (
        <div
          key={i}
          className="grid gap-4 border-b border-border/70 px-4 py-4 last:border-b-0 sm:px-5 md:grid-cols-[minmax(0,2.6fr)_170px_185px_190px_110px] md:items-center"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-20 w-14 shrink-0 rounded-lg md:h-28 md:w-20" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/5" />
              <Skeleton className="h-4 w-2/5" />
            </div>
          </div>
          <Skeleton className="hidden h-10 w-24 rounded-full md:block" />
          <Skeleton className="hidden h-10 w-32 rounded-full md:block" />
          <Skeleton className="hidden h-10 w-36 rounded-full md:block" />
          <Skeleton className="ml-auto hidden h-8 w-8 rounded-full md:block" />
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [recentDocumentsTab, setRecentDocumentsTab] = useState<"resume" | "cover-letter">("resume");

  // Replace mock data with real tRPC query
  const { data: resumes = [], isLoading } = trpc.resume.listSummary.useQuery();
  const hasResumes = resumes.length > 0;
  // Keep the tabbed layout up while loading so the skeleton sits where the rows will.
  const showRecentDocuments = isLoading || hasResumes;
  const { data: coverLetters = [], isLoading: isCoverLettersLoading } =
    trpc.coverLetter.listSummary.useQuery(undefined, {
      enabled: hasResumes && recentDocumentsTab === "cover-letter",
    });


  return (
    <TooltipProvider>
    <PageTour tour="dashboard" />
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground lg:text-3xl">
            Welcome back
          </h1>
          <p className="text-muted-foreground">
            {showRecentDocuments
              ? "Continue working on your resumes or create a new one."
              : "Get started by creating your first resume."}
          </p>
        </div>
      </div>

      <ActionPlan resumeCount={resumes.length} resumesLoading={isLoading} />

      {/* Quick Actions */}
      <div data-tour="quick-actions">
        <QuickActions />
      </div>

      {/* Resume Tips */}
      <TipsCard />

      {/* Recent Resumes Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">
            {showRecentDocuments
              ? recentDocumentsTab === "resume"
                ? "Recent Resumes"
                : "Recent Cover Letters"
              : "My Resumes"}
          </h2>
          {showRecentDocuments && (
            <Link
              href={
                recentDocumentsTab === "resume"
                  ? "/dashboard/documents/resume"
                  : "/dashboard/documents/cover-letters"
              }
              className="text-sm text-foreground hover:underline"
            >
              View all
            </Link>
          )} 
        </div>

        {showRecentDocuments ? (
          <Tabs
            value={recentDocumentsTab}
            onValueChange={(value) => setRecentDocumentsTab(value as "resume" | "cover-letter")}
            className="space-y-4"
          >
            <TabsList className="h-9">
              <TabsTrigger value="resume">Resume</TabsTrigger>
              <TabsTrigger value="cover-letter">Cover Letter</TabsTrigger>
            </TabsList>

            <TabsContent value="resume" className="mt-0">
              {isLoading ? (
                <DocumentRowsSkeleton />
              ) : (
              <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
                <div className="hidden items-center gap-4 border-b border-border/70 bg-muted/30 px-5 py-3 text-[13px] font-semibold text-foreground/90 md:grid md:grid-cols-[minmax(0,2.6fr)_170px_185px_190px_110px]">
                  <p className="tracking-tight">Resume</p>
                  <p className="flex items-center gap-1.5 tracking-tight">
                    ATS Status
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex">
                          <BadgeInfo className="h-4 w-4 text-muted-foreground/70" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>Check ATS match quality for this resume.</TooltipContent>
                    </Tooltip>
                  </p>
                  <p className="flex items-center gap-1.5 tracking-tight">
                    Review Status
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex">
                          <BadgeInfo className="h-4 w-4 text-muted-foreground/70" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>Track expert review progress to boost your hiring potential.</TooltipContent>
                    </Tooltip>
                  </p>
                  <p className="flex items-center gap-1.5 tracking-tight">
                    Tailored Version
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex">
                          <BadgeInfo className="h-4 w-4 text-muted-foreground/70" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>Create a tailored resume version for a specific job.</TooltipContent>
                    </Tooltip>
                  </p>
                  <p aria-hidden className="text-right text-transparent">
                    Actions
                  </p>
                </div>

                <div>
                  {resumes.slice(0, 4).map((resume) => (
                    <div
                      key={resume.id}
                      className="grid gap-4 border-b border-border/70 px-4 py-4 transition-colors hover:bg-muted/15 last:border-b-0 sm:px-5 md:grid-cols-[minmax(0,2.6fr)_170px_185px_190px_110px] md:items-center"
                    >
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-start gap-3">
                          <button
                            type="button"
                            onClick={() => router.push(`/resume/section/${resume.id}`)}
                            className="h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-white shadow-sm transition-transform hover:scale-[1.02] md:h-28 md:w-20"
                          >
                            <ResumeCardPreview templateId={resume.templateId} data={resume.data} />
                          </button>
                          <div className="min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => router.push(`/resume/section/${resume.id}`)}
                              className="line-clamp-1 text-left text-base leading-tight font-semibold text-foreground hover:text-primary md:text-[18px]"
                            >
                              {resume.title}
                            </button>
                            {resume.shareEnabled ? <PublicBadge className="mt-1" /> : null}
                            <p className="mt-1 text-sm text-muted-foreground">
                              Created{" "}
                              {new Date(resume.createdAt).toLocaleDateString(undefined, {
                                month: "2-digit",
                                day: "2-digit",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                          <div className="shrink-0 md:hidden">
                            <ResumeRowActions resume={resume} />
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2 md:hidden">
                          <button
                            type="button"
                            onClick={() => router.push("/dashboard/ats-checker")}
                            className="inline-flex h-9 items-center gap-2 rounded-full bg-muted/60 px-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                          >
                            <ScanSearch className="h-4 w-4" />
                            <span>Check</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => router.push("/dashboard/ai-resume")}
                            className="inline-flex h-9 items-center gap-2 rounded-full bg-muted/60 px-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                          >
                            <SpellCheck className="h-4 w-4" />
                            <span>Get Review</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => router.push("/resume/upload")}
                            className="inline-flex h-9 items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                          >
                            <Sparkles className="h-4 w-4" />
                            <span>Tailor</span>
                          </button>
                        </div>
                      </div>

                      <div className="hidden items-center md:flex">
                        <button
                          type="button"
                          onClick={() => router.push("/dashboard/ats-checker")}
                          className="inline-flex h-10 items-center gap-2 rounded-full bg-muted/60 px-3 text-left font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                        >
                          <ScanSearch className="h-4 w-4" />
                          <span>Check</span>
                        </button>
                      </div>

                      <div className="hidden items-center md:flex">
                        <button
                          type="button"
                          onClick={() => router.push("/dashboard/ai-resume")}
                          className="inline-flex h-10 items-center gap-2 rounded-full bg-muted/60 px-3 text-left font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                        >
                          <SpellCheck className="h-4 w-4" />
                          <span>Get Review</span>
                        </button>
                      </div>

                      <div className="hidden items-center md:flex">
                        <button
                          type="button"
                          onClick={() => router.push("/resume/upload")}
                          className="inline-flex h-10 items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 text-left font-medium text-primary transition-colors hover:bg-primary/10"
                        >
                          <Sparkles className="h-4 w-4" />
                          <span>Tailor for a job</span>
                        </button>
                      </div>

                      <div className="hidden md:block">
                        <ResumeRowActions resume={resume} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              )}
            </TabsContent>

            <TabsContent value="cover-letter" className="mt-0">
              {isCoverLettersLoading ? (
                <DocumentRowsSkeleton />
              ) : coverLetters.length > 0 ? (
                <div className="overflow-hidden rounded-2xl bg-card shadow-sm">
                  <div className="hidden items-center gap-4 border-b border-border/70 bg-muted/30 px-5 py-3 text-[13px] font-semibold text-foreground/90 md:grid md:grid-cols-[minmax(0,2.6fr)_170px_185px_190px_110px]">
                    <p className="tracking-tight">Cover Letter</p>
                    <p className="tracking-tight">Job Title</p>
                    <p className="tracking-tight">Company</p>
                    <p className="tracking-tight">Last Updated</p>
                    <p aria-hidden className="text-right text-transparent">
                      Actions
                    </p>
                  </div>

                  <div>
                    {coverLetters.slice(0, 4).map((letter) => (
                      <div
                        key={letter.id}
                        className="grid gap-4 border-b border-border/70 px-4 py-4 transition-colors hover:bg-muted/15 last:border-b-0 sm:px-5 md:grid-cols-[minmax(0,2.6fr)_170px_185px_190px_110px] md:items-center"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <button
                            type="button"
                            onClick={() => router.push(`/cover-letter/write?id=${letter.id}`)}
                            className="h-28 w-20 shrink-0 overflow-hidden rounded-lg bg-white shadow-sm transition-transform hover:scale-[1.02]"
                          >
                            <CoverLetterCardPreview />
                          </button>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => router.push(`/cover-letter/write?id=${letter.id}`)}
                              className="line-clamp-1 text-left text-[18px] leading-tight font-semibold text-foreground hover:text-primary"
                            >
                              {letter.title}
                            </button>
                            {letter.shareEnabled ? <PublicBadge className="mt-1" /> : null}
                            <p className="mt-1 text-sm text-muted-foreground">
                              Created{" "}
                              {new Date(letter.createdAt).toLocaleDateString(undefined, {
                                month: "2-digit",
                                day: "2-digit",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>

                        <p className="line-clamp-1 text-sm font-medium text-foreground">
                          Open to view
                        </p>

                        <p className="line-clamp-1 text-sm text-foreground/90">
                          Open to view
                        </p>

                        <p className="text-sm text-muted-foreground">
                          {new Date(letter.updatedAt).toLocaleDateString(undefined, {
                            month: "2-digit",
                            day: "2-digit",
                            year: "numeric",
                          })}
                        </p>

                        <CoverLetterRowActions letter={letter} />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-card p-8 text-center">
                  <p className="font-medium text-foreground">No cover letters yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Create your first cover letter to see it here.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <CreateResumeCard />
        )}
      </div>

      {/* Getting Started - Only show if no resumes */}
      {!showRecentDocuments && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            Getting Started
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl bg-card p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-muted/10 dark:bg-muted/800">
                <span className="text-lg font-bold text-foreground">1</span>
              </div>
              <h3 className="font-medium text-foreground">Choose a Template</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Pick from our collection of professional, ATS-friendly resume templates.
              </p>
            </div>
            <div className="rounded-xl bg-card p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-muted/10 dark:bg-muted/800">
                <span className="text-lg font-bold text-foreground">2</span>
              </div>
              <h3 className="font-medium text-foreground">Fill in Your Details</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Add your experience, skills, and education with our easy-to-use editor.
              </p>
            </div>
            <div className="rounded-xl bg-card p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-muted/10 dark:bg-muted/800">
                <span className="text-lg font-bold text-foreground">3</span>
              </div>
              <h3 className="font-medium text-foreground">Download & Apply</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Export your resume as PDF and start applying to your dream jobs.
              </p>
            </div> 
          </div>
        </div>
      )}
    </div>
    </TooltipProvider>
  );
}
