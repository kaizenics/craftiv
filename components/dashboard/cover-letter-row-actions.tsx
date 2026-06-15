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
import { CoverLetterDownloadDialog } from "@/components/dashboard/cover-letter-download-dialog";
import { trpc } from "@/trpc/client";
import type { CoverLetterData } from "@/lib/types/cover-letter";

export type CoverLetterListItem = {
  id: string;
  title: string;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export function CoverLetterRowActions({ letter }: { letter: CoverLetterListItem }) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [downloadData, setDownloadData] = useState<CoverLetterData | null>(null);
  const [isPreparingDownload, setIsPreparingDownload] = useState(false);

  const updateCoverLetter = trpc.coverLetter.update.useMutation({
    onSuccess: () => {
      utils.coverLetter.listSummary.invalidate();
    },
  });
  const deleteCoverLetter = trpc.coverLetter.delete.useMutation({
    onSuccess: () => {
      utils.coverLetter.listSummary.invalidate();
    },
  });
  const duplicateCoverLetter = trpc.coverLetter.duplicate.useMutation({
    onSuccess: () => {
      utils.coverLetter.listSummary.invalidate();
    },
  });

  const handleRename = async () => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    await updateCoverLetter.mutateAsync({
      id: letter.id,
      title: trimmed,
    });
    setShowRenameDialog(false);
  };

  const handlePrepareDownload = async () => {
    setIsPreparingDownload(true);
    try {
      const fullLetter = await utils.coverLetter.getById.fetch({ id: letter.id });
      setDownloadData(fullLetter.data);
      setShowDownloadDialog(true);
    } finally {
      setIsPreparingDownload(false);
    }
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
          onClick={() => void handlePrepareDownload()}
          disabled={isPreparingDownload}
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

      {downloadData && (
        <CoverLetterDownloadDialog
          coverLetterId={letter.id}
          data={downloadData}
          fileName={letter.title}
          isOpen={showDownloadDialog}
          onClose={() => setShowDownloadDialog(false)}
        />
      )}

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
