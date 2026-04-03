"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Copy, Mail, MoreVertical, Pencil, Plus, Trash2 } from "@/components/ui/icons";
import Image from "next/image";
import Link from "next/link";
import { CoverLetterCardPreview } from "@/components/dashboard/cover-letter-card-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { trpc } from "@/trpc/client";
import type { CoverLetterData } from "@/lib/types/cover-letter";

type CoverLetterListItem = {
  id: string;
  title: string;
  updatedAt: Date;
  data: CoverLetterData;
};

function CoverLetterCard({ letter }: { letter: CoverLetterListItem }) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const [showMenu, setShowMenu] = useState(false);
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

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) {
      return;
    }
    router.push(`/cover-letter/write?id=${letter.id}`);
  };

  const handleRename = async () => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;

    await updateCoverLetter.mutateAsync({
      id: letter.id,
      title: trimmed,
      data: letter.data,
    });
    setShowRenameDialog(false);
    setShowMenu(false);
  };

  const handleDuplicate = async () => {
    await duplicateCoverLetter.mutateAsync({ id: letter.id });
    setShowMenu(false);
  };

  const handleDelete = async () => {
    await deleteCoverLetter.mutateAsync({ id: letter.id });
    setShowDeleteDialog(false);
    setShowMenu(false);
  };

  return (
    <>
      <div
        className="group relative rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:bg-muted/5 cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="flex items-center gap-3 pr-8">
          <div className="h-24 w-16 shrink-0 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm">
            <CoverLetterCardPreview data={letter.data} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground line-clamp-2">{letter.title}</p>
            {letter.data.employer.jobTitle && (
              <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">
                {letter.data.employer.jobTitle}
                {letter.data.employer.companyName
                  ? ` - ${letter.data.employer.companyName}`
                  : ""}
              </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Updated {format(new Date(letter.updatedAt), "MMM d, yyyy")}
            </p>
          </div>
        </div>

        <div className="absolute right-2 top-2">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu((prev) => !prev);
              }}
              className="opacity-0 transition-opacity group-hover:opacity-100"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                  }}
                />
                <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-lg border border-border bg-popover p-1 shadow-lg">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setNewTitle(letter.title);
                      setShowRenameDialog(true);
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/10"
                  >
                    <Pencil className="h-4 w-4" />
                    Rename
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicate();
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/10"
                    disabled={duplicateCoverLetter.isPending}
                  >
                    <Copy className="h-4 w-4" />
                    Duplicate
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteDialog(true);
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename Cover Letter</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a new title for this cover letter.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Cover letter title"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleRename();
              }
            }}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRename}
              disabled={updateCoverLetter.isPending || !newTitle.trim()}
            >
              {updateCoverLetter.isPending ? "Renaming..." : "Rename"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Cover Letter</AlertDialogTitle>
            <AlertDialogDescription>
              {`Are you sure you want to delete "${letter.title}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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

export default function CoverLettersPage() {
  const { data: letters = [], isLoading } = trpc.coverLetter.list.useQuery();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <Image
            src="/cv.gif"
            alt="Loading"
            width={80}
            height={80}
            className="mx-auto mb-4"
            unoptimized
          />
          <p className="text-muted-foreground">Loading cover letters...</p>
        </div>
      </div>
    );
  }

  const hasLetters = letters.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground lg:text-3xl">Cover Letters</h1>
          <p className="text-muted-foreground">
            Create tailored cover letters for your job applications.
          </p>
        </div>
        <Button asChild>
          <Link href="/cover-letter/write">
            <Plus className="h-4 w-4" />
            New Cover Letter
          </Link>
        </Button>
      </div>

      {!hasLetters ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/20">
            <Mail className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 font-semibold text-foreground">No cover letters yet</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Create your first cover letter by generating one from a resume or writing from scratch.
          </p>
          <Button className="mt-6" asChild>
            <Link href="/cover-letter/write">Get Started</Link>
          </Button>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {letters.map((letter) => (
            <li key={letter.id}>
              <CoverLetterCard letter={letter} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
