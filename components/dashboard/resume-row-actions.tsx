"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Copy, Download, Edit, FileText, MoreVertical, Trash2 } from "@/components/ui/icons";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DownloadDialog } from "@/components/resume/download-dialog";
import { trpc } from "@/trpc/client";
import { ShareButton } from "@/components/share/share-button";
import type { ResumeDataJSON } from "@/db/schema";
import { DEFAULT_SECTION_ORDER, normalizeSectionOrder, type ResumeData } from "@/lib/types/resume";

export type ResumeListItem = {
  id: string;
  title: string;
  templateId: string;
  data?: ResumeDataJSON | null;
  status: "draft" | "completed";
  createdAt: Date | string;
  updatedAt: Date | string;
};

function buildResumeDataForDownload(
  resume: ResumeListItem & { data?: ResumeDataJSON | null },
): ResumeData {
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
    sectionOrder: normalizeSectionOrder(data.sectionOrder ?? DEFAULT_SECTION_ORDER),
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

export function ResumeRowActions({ resume }: { resume: ResumeListItem }) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [downloadData, setDownloadData] = useState<ResumeData | null>(null);
  const [isPreparingDownload, setIsPreparingDownload] = useState(false);

  const updateResume = trpc.resume.update.useMutation({
    onSuccess: () => {
      utils.resume.listSummary.invalidate();
      utils.user.stats.invalidate();
    },
  });
  const deleteResume = trpc.resume.delete.useMutation({
    onSuccess: () => {
      utils.resume.listSummary.invalidate();
      utils.user.stats.invalidate();
    },
  });
  const duplicateResume = trpc.resume.duplicate.useMutation({
    onSuccess: () => {
      utils.resume.listSummary.invalidate();
      utils.user.stats.invalidate();
    },
  });

  const handlePrepareDownload = async () => {
    setIsPreparingDownload(true);
    try {
      const fullResume = await utils.resume.getById.fetch({ id: resume.id });
      setDownloadData(buildResumeDataForDownload(fullResume));
      setShowDownloadDialog(true);
    } finally {
      setIsPreparingDownload(false);
    }
  };

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
          onClick={() => void handlePrepareDownload()}
          disabled={isPreparingDownload}
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
        <ShareButton kind="resume" id={resume.id} />
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

      {downloadData && (
        <DownloadDialog
          data={downloadData}
          isOpen={showDownloadDialog}
          onClose={() => setShowDownloadDialog(false)}
          customFileName={resume.title}
        />
      )}

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
