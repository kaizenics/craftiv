
"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeInfo,
  Copy,
  Download,
  Edit,
  FileText,
  MoreVertical,
  ScanSearch,
  CheckCircle2,
  Sparkles,
  SpellCheck,
  Trash2,
} from "@/components/ui/icons";
import { useRouter } from "next/navigation";
import { CreateResumeCard } from "@/components/dashboard/create-resume-card";
import { ResumeCardPreview } from "@/components/dashboard/resume-card-preview";
import { CoverLetterCardPreview } from "@/components/dashboard/cover-letter-card-preview";
import { CoverLetterDownloadDialog } from "@/components/dashboard/cover-letter-download-dialog";
import { DownloadDialog } from "@/components/resume/download-dialog";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { TipsCard } from "@/components/dashboard/tips-card";
import { PremiumUpgradeVisual } from "@/components/dashboard/premium-upgrade-visual";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { trpc } from "@/trpc/client";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";
import type { ResumeDataJSON } from "@/db/schema";
import type { CoverLetterData } from "@/lib/types/cover-letter";
import type { ResumeData } from "@/lib/types/resume";

type ResumeListItem = {
  id: string;
  title: string;
  templateId: string;
  data?: ResumeDataJSON | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type CoverLetterListItem = {
  id: string;
  title: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  data: CoverLetterData;
};

function buildResumeDataForDownload(resume: ResumeListItem): ResumeData {
  const data = resume.data ?? ({} as ResumeDataJSON);

  return {
    templateId: resume.templateId,
    contact: data.contact ?? {
      firstName: "",
      lastName: "",
      desiredJobTitle: "",
      phone: "",
      email: "",
    },
    experiences: data.experiences ?? [],
    educations: data.educations ?? [],
    skills: data.skills ?? [],
    summary: data.summary ?? "",
    finalize: data.finalize ?? {
      languages: [],
      certifications: [],
      awards: [],
      websites: [],
      references: [],
      hobbies: [],
      customSections: [],
    },
  };
}

function ResumeRowActions({ resume }: { resume: ResumeListItem }) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const downloadData = useMemo(() => buildResumeDataForDownload(resume), [resume]);

  const updateResume = trpc.resume.update.useMutation({
    onSuccess: () => {
      utils.resume.list.invalidate();
      utils.user.stats.invalidate();
    },
  });
  const deleteResume = trpc.resume.delete.useMutation({
    onSuccess: () => {
      utils.resume.list.invalidate();
      utils.user.stats.invalidate();
    },
  });
  const duplicateResume = trpc.resume.duplicate.useMutation({
    onSuccess: () => {
      utils.resume.list.invalidate();
      utils.user.stats.invalidate();
    },
  });

  const handleRename = async () => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    await updateResume.mutateAsync({ id: resume.id, title: trimmed });
    setShowRenameDialog(false);
  };

  const handleDelete = async () => {
    await deleteResume.mutateAsync({ id: resume.id });
    setShowDeleteDialog(false);
  };

  const handleDuplicate = async () => {
    await duplicateResume.mutateAsync({ id: resume.id });
  };

  return (
    <>
      <div className="flex items-center gap-1.5 md:justify-end">
        <button
          type="button"
          onClick={() => setShowDownloadDialog(true)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-primary transition-colors hover:border-primary/20 hover:bg-primary/10"
          aria-label="Download resume"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Download className="h-4 w-4" />
              </span>
            </TooltipTrigger>
            <TooltipContent>Download</TooltipContent>
          </Tooltip>
        </button>
        <button
          type="button"
          onClick={() => {
            router.push(`/resume/section/${resume.id}`);
          }}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-primary transition-colors hover:border-primary/20 hover:bg-primary/10"
          aria-label="Edit resume"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Edit className="h-4 w-4" />
              </span>
            </TooltipTrigger>
            <TooltipContent>Edit</TooltipContent>
          </Tooltip>
        </button>
        <button
          type="button"
          onClick={() => {
            setNewTitle(resume.title);
            setShowRenameDialog(true);
          }}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-primary transition-colors hover:border-primary/20 hover:bg-primary/10"
          aria-label="Rename resume"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <FileText className="h-4 w-4" />
              </span>
            </TooltipTrigger>
            <TooltipContent>Rename</TooltipContent>
          </Tooltip>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-primary transition-colors hover:border-primary/20 hover:bg-primary/10"
              aria-label="More resume actions"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => void handleDuplicate()} disabled={duplicateResume.isPending}>
              <Copy className="h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={deleteResume.isPending}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <DownloadDialog
        data={downloadData}
        isOpen={showDownloadDialog}
        onClose={() => setShowDownloadDialog(false)}
        customFileName={resume.title}
      />

      <AlertDialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename Resume</AlertDialogTitle>
            <AlertDialogDescription>Enter a new title for this resume.</AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Resume title"
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleRename();
            }}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleRename()} disabled={updateResume.isPending || !newTitle.trim()}>
              {updateResume.isPending ? "Renaming..." : "Rename"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resume</AlertDialogTitle>
            <AlertDialogDescription>
              {`Are you sure you want to delete "${resume.title}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              disabled={deleteResume.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteResume.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function CoverLetterRowActions({ letter }: { letter: CoverLetterListItem }) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const updateCoverLetter = trpc.coverLetter.update.useMutation({
    onSuccess: () => {
      utils.coverLetter.list.invalidate();
    },
  });
  const deleteCoverLetter = trpc.coverLetter.delete.useMutation({
    onSuccess: () => {
      utils.coverLetter.list.invalidate();
    },
  });
  const duplicateCoverLetter = trpc.coverLetter.duplicate.useMutation({
    onSuccess: () => {
      utils.coverLetter.list.invalidate();
    },
  });

  const handleRename = async () => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    await updateCoverLetter.mutateAsync({
      id: letter.id,
      title: trimmed,
      data: letter.data,
    });
    setShowRenameDialog(false);
  };

  const handleDelete = async () => {
    await deleteCoverLetter.mutateAsync({ id: letter.id });
    setShowDeleteDialog(false);
  };

  const handleDuplicate = async () => {
    await duplicateCoverLetter.mutateAsync({ id: letter.id });
  };

  return (
    <>
      <div className="flex items-center gap-1.5 md:justify-end">
        <button
          type="button"
          onClick={() => setShowDownloadDialog(true)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-primary transition-colors hover:border-primary/20 hover:bg-primary/10"
          aria-label="Download cover letter"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Download className="h-4 w-4" />
              </span>
            </TooltipTrigger>
            <TooltipContent>Download</TooltipContent>
          </Tooltip>
        </button>
        <button
          type="button"
          onClick={() => {
            router.push(`/cover-letter/write?id=${letter.id}`);
          }}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-primary transition-colors hover:border-primary/20 hover:bg-primary/10"
          aria-label="Edit cover letter"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Edit className="h-4 w-4" />
              </span>
            </TooltipTrigger>
            <TooltipContent>Edit</TooltipContent>
          </Tooltip>
        </button>
        <button
          type="button"
          onClick={() => {
            setNewTitle(letter.title);
            setShowRenameDialog(true);
          }}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-primary transition-colors hover:border-primary/20 hover:bg-primary/10"
          aria-label="Rename cover letter"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <FileText className="h-4 w-4" />
              </span>
            </TooltipTrigger>
            <TooltipContent>Rename</TooltipContent>
          </Tooltip>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-primary transition-colors hover:border-primary/20 hover:bg-primary/10"
              aria-label="More cover letter actions"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => void handleDuplicate()} disabled={duplicateCoverLetter.isPending}>
              <Copy className="h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={deleteCoverLetter.isPending}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CoverLetterDownloadDialog
        data={letter.data}
        fileName={letter.title}
        isOpen={showDownloadDialog}
        onClose={() => setShowDownloadDialog(false)}
      />

      <AlertDialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename Cover Letter</AlertDialogTitle>
            <AlertDialogDescription>Enter a new title for this cover letter.</AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Cover letter title"
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleRename();
            }}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleRename()}
              disabled={updateCoverLetter.isPending || !newTitle.trim()}
            >
              {updateCoverLetter.isPending ? "Renaming..." : "Rename"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Cover Letter</AlertDialogTitle>
            <AlertDialogDescription>
              {`Are you sure you want to delete "${letter.title}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDelete()}
              disabled={deleteCoverLetter.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteCoverLetter.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [recentDocumentsTab, setRecentDocumentsTab] = useState<"resume" | "cover-letter">("resume");
  const [lockedFeature, setLockedFeature] = useState<"ATS Checker" | "AI Resume Assistant" | null>(null);
  const { data: subscription } = trpc.user.subscription.useQuery();
  const subscriptionPlan = subscription?.plan ?? "free";

  // Replace mock data with real tRPC query
  const { data: resumes = [], isLoading } = trpc.resume.list.useQuery();
  const hasResumes = resumes.length > 0;
  const { data: coverLetters = [], isLoading: isCoverLettersLoading } =
    trpc.coverLetter.list.useQuery(undefined, { enabled: hasResumes });

  const checklistItems = [
    {
      title: "Build your resume",
      label: "Step 1",
      detail: "Pick a template and complete each section with clear, role-relevant achievements.",
      cta: "Start building",
      href: "/resume/templates",
      icon: FileText,
    },
    {
      title: "Make it ATS-friendly",
      label: "Step 2",
      detail: "Improve keywords, structure, and formatting so ATS systems can parse it correctly.",
      cta: "Optimize for ATS",
      href: "/resume/upload",
      icon: ScanSearch,
    },
    {
      title: "Check and improve",
      label: "Step 3",
      detail: "Review weak bullets, tighten wording, and increase overall impact before applying.",
      cta: "Run quality check",
      href: "/dashboard/ats-checker",
      premiumFeature: "ATS Checker" as const,
      icon: SpellCheck,
    },
    {
      title: "Write a cover letter",
      label: "Step 4",
      detail: "Generate a tailored cover letter that aligns with the role and your resume.",
      cta: "Create letter",
      href: "/cover-letter/write",
      icon: Sparkles,
    },
    {
      title: "Track your job applications",
      label: "Step 5",
      detail: "Keep your documents organized so each application is ready to send quickly.",
      cta: "Manage applications",
      href: "/dashboard/documents/resume",
      icon: BadgeInfo,
    },
  ];

  const handlePremiumNavigation = (
    href: string,
    featureName: "ATS Checker" | "AI Resume Assistant"
  ) => {
    if (subscriptionPlan === "free") {
      setLockedFeature(featureName);
      return;
    }
    router.push(href);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Spinner className="mx-auto mb-4 size-12 text-muted-foreground" />
          <p className="text-muted-foreground">Loading your resumes...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground lg:text-3xl">
            Welcome back
          </h1>
          <p className="text-muted-foreground">
            {hasResumes
              ? "Continue working on your resumes or create a new one."
              : "Get started by creating your first resume."}
          </p>
        </div>
      </div>

      {/* Stats - Only show if user has resumes */}
      {hasResumes && (
        <div className="w-full">
          <div className="relative overflow-hidden rounded-3xl border border-sky-200/60 bg-sky-50 to-white p-4 sm:p-6">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-16 -right-12 h-44 w-44 rounded-full bg-sky-200/50 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-20 left-8 h-52 w-52 rounded-full bg-cyan-200/40 blur-3xl"
            />

            <div className="relative mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700/80">Action Plan</p>
                <h3 className="font-display text-lg font-semibold text-slate-900 sm:text-xl">
                  Land interviews faster
                </h3>
              </div>
              <span className="inline-flex items-center rounded-full border border-sky-300/70 bg-white/90 px-3 py-1 text-xs font-medium text-sky-800 shadow-sm">
                5-step workflow
              </span>
            </div>

            <Accordion type="single" collapsible className="relative space-y-3">
              {checklistItems.map((item, index) => (
                <AccordionItem
                  key={item.title}
                  value={`item-${index}`}
                  className="overflow-hidden rounded-2xl border border-sky-200/70 bg-white/90 shadow-[0_10px_30px_-20px_rgba(2,132,199,0.65)] backdrop-blur-sm transition-colors data-[state=open]:border-sky-400/80 data-[state=open]:bg-white"
                >
                  <AccordionTrigger className="px-4 py-4 text-md text-foreground hover:no-underline sm:px-5 [&>svg]:text-sky-700/70">
                    <span className="flex items-center gap-3 sm:gap-4">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-200 bg-sky-100/80 text-sky-700">
                        <item.icon className="h-5 w-5" />
                      </span>
                      <span className="space-y-0.5 text-left">
                        <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-700/80">
                          {item.label}
                        </span>
                        <span className="block text-base font-semibold leading-tight text-slate-900">
                          {item.title}
                        </span>
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pt-0 pb-4 sm:px-5">
                    <button
                      type="button"
                      onClick={() => {
                        if (item.premiumFeature) {
                          handlePremiumNavigation(item.href, item.premiumFeature);
                          return;
                        }
                        router.push(item.href);
                      }}
                      className="group flex w-full cursor-pointer items-center justify-between gap-4 rounded-xl border border-sky-200/80 bg-gradient-to-r from-sky-50 to-white px-4 py-3 text-left transition-all hover:border-sky-300 hover:from-sky-100 hover:to-cyan-50"
                    >
                      <div className="space-y-2">
                        <p className="text-sm leading-relaxed text-slate-700 sm:text-[15px]">
                          {item.detail}
                        </p>
                        <span className="inline-flex items-center text-xs font-semibold uppercase tracking-[0.12em] text-sky-800">
                          {item.cta}
                        </span>
                      </div>
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-600 text-white transition-transform group-hover:translate-x-0.5">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </button>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <QuickActions />

      {/* Resume Tips */}
      <TipsCard />

      {/* Recent Resumes Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-foreground">
            {hasResumes
              ? recentDocumentsTab === "resume"
                ? "Recent Resumes"
                : "Recent Cover Letters"
              : "My Resumes"}
          </h2>
          {hasResumes && (
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

        {hasResumes ? (
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
              <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
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
                      <div className="flex min-w-0 items-center gap-3">
                        <button
                          type="button"
                          onClick={() => router.push(`/resume/section/${resume.id}`)}
                          className="h-28 w-20 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition-transform hover:scale-[1.02]"
                        >
                          <ResumeCardPreview templateId={resume.templateId} data={resume.data} />
                        </button>
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => router.push(`/resume/section/${resume.id}`)}
                            className="line-clamp-1 text-left text-[18px] leading-tight font-semibold text-foreground hover:text-primary"
                          >
                            {resume.title}
                          </button>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Created{" "}
                            {new Date(resume.createdAt).toLocaleDateString(undefined, {
                              month: "2-digit",
                              day: "2-digit",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() =>
                            handlePremiumNavigation("/dashboard/ats-checker", "ATS Checker")
                          }
                          className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-background px-3 text-left font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                        >
                          <ScanSearch className="h-4 w-4" />
                          <span>Check</span>
                        </button>
                      </div>

                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() =>
                            handlePremiumNavigation(
                              "/dashboard/ai-resume",
                              "AI Resume Assistant"
                            )
                          }
                          className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-background px-3 text-left font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                        >
                          <SpellCheck className="h-4 w-4" />
                          <span>Get Review</span>
                        </button>
                      </div>

                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => router.push("/resume/upload")}
                          className="inline-flex h-10 items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 text-left font-medium text-primary transition-colors hover:bg-primary/10"
                        >
                          <Sparkles className="h-4 w-4" />
                          <span>Tailor for a job</span>
                        </button>
                      </div>

                      <ResumeRowActions resume={resume} />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="cover-letter" className="mt-0">
              {isCoverLettersLoading ? (
                <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
                  Loading recent cover letters...
                </div>
              ) : coverLetters.length > 0 ? (
                <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
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
                            className="h-28 w-20 shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition-transform hover:scale-[1.02]"
                          >
                            <CoverLetterCardPreview data={letter.data} />
                          </button>
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => router.push(`/cover-letter/write?id=${letter.id}`)}
                              className="line-clamp-1 text-left text-[18px] leading-tight font-semibold text-foreground hover:text-primary"
                            >
                              {letter.title}
                            </button>
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
                          {letter.data.employer.jobTitle || "Not set"}
                        </p>

                        <p className="line-clamp-1 text-sm text-foreground/90">
                          {letter.data.employer.companyName || "Not set"}
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
                <div className="rounded-xl border border-border bg-card p-8 text-center">
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
      {!hasResumes && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            Getting Started
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-muted/10 dark:bg-muted/800">
                <span className="text-lg font-bold text-foreground">1</span>
              </div>
              <h3 className="font-medium text-foreground">Choose a Template</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Pick from our collection of professional, ATS-friendly resume templates.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-muted/10 dark:bg-muted/800">
                <span className="text-lg font-bold text-foreground">2</span>
              </div>
              <h3 className="font-medium text-foreground">Fill in Your Details</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Add your experience, skills, and education with our easy-to-use editor.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
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
    <AlertDialog open={lockedFeature !== null} onOpenChange={(open) => !open && setLockedFeature(null)}>
      <AlertDialogContent className="max-h-[92vh] w-[calc(100vw-1.25rem)] max-w-xl overflow-y-auto overflow-x-hidden p-0 xl:max-h-[92vh] xl:overflow-y-auto">
        <PremiumUpgradeVisual />
        <div className="space-y-2 px-4 pb-3 sm:px-5 sm:pb-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-[2.1rem] leading-tight text-slate-800 xl:text-3xl">
              Boost your career
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-600">
              <span className="xl:hidden">
                {lockedFeature} is premium. Upgrade to Plus or Pro.
              </span>
              <span className="hidden xl:inline">
                {lockedFeature} is available on Plus and Pro. Upgrade to unlock AI-driven optimization and better application outcomes.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="hidden text-xs font-semibold uppercase tracking-wide text-slate-700 xl:block">
              You will get access to
            </p>
            <div className="mt-1 grid gap-1.5 text-sm text-slate-700 sm:grid-cols-2">
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />ATS Checker</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />AI Resume Assistant</span>
              <span className="hidden items-center gap-2 xl:flex"><CheckCircle2 className="h-4 w-4 text-primary" />AI-powered features</span>
              <span className="hidden items-center gap-2 xl:flex"><CheckCircle2 className="h-4 w-4 text-primary" />Advanced AI optimization</span>
            </div>
          </div>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel onClick={() => setLockedFeature(null)}>Maybe later</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push("/pricing")}>Upgrade Now</AlertDialogAction>
          </AlertDialogFooter>
        </div>
      </AlertDialogContent>
    </AlertDialog>
    </TooltipProvider>
  );
}
