"use client";

import { MoreVertical, Trash2, Edit, Copy, Pencil } from "@/components/ui/icons";
import { useRouter } from "next/navigation";
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
import { useState } from "react";
import { trpc } from "@/trpc/client";
import { ResumeCardPreview } from "./resume-card-preview";
import type { ResumeDataJSON } from "@/db/schema";

interface ResumeCardProps {
  id: string;
  title: string;
  updatedAt: string;
  template: string;
  data?: ResumeDataJSON | null;
}

export function ResumeCard({ id, title, updatedAt, template, data }: ResumeCardProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newTitle, setNewTitle] = useState(title);
  
  const utils = trpc.useUtils();
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
    },
  });

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking menu or buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    router.push(`/resume/section/${id}`);
  };

  const handleRename = async () => {
    await updateResume.mutateAsync({ id, title: newTitle });
    setShowRenameDialog(false);
    setShowMenu(false);
  };

  const handleEdit = () => {
    router.push(`/resume/section/${id}`);
  };

  const handleDuplicate = async () => {
    await duplicateResume.mutateAsync({ id });
    setShowMenu(false);
  };

  const handleDelete = async () => {
    await deleteResume.mutateAsync({ id });
    setShowDeleteDialog(false);
    setShowMenu(false);
  };

  return (
    <>
      <div 
        className="group relative rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md cursor-pointer"
        onClick={handleCardClick}
      >
        {/* Preview Thumbnail */}
        <div className="mb-4 w-full aspect-[calc(1*1.5+1)/3] overflow-hidden rounded-lg border border-zinc-100 bg-white">
          <ResumeCardPreview templateId={template} data={data} />
        </div>

        {/* Content */}
        <div className="space-y-1">
          <h3 className="font-medium text-foreground line-clamp-1">{title}</h3>
          <p className="text-xs text-muted-foreground">
            Updated {updatedAt}
          </p>
          <p className="text-xs text-muted-foreground">
            Template: {template}
          </p>
        </div>

        {/* Actions */}
        <div className="absolute right-2 top-2">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
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
                      handleEdit();
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/10"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDuplicate();
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/10"
                    disabled={duplicateResume.isPending}
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

      {/* Rename Dialog */}
      <AlertDialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename Resume</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a new name for your resume.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Resume name"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
            }}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRename} disabled={updateResume.isPending}>
              {updateResume.isPending ? "Renaming..." : "Rename"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resume</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
