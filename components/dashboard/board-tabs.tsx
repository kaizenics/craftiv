"use client";

import { useState } from "react";
import { toast } from "sonner";

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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, Plus } from "@/components/ui/icons";
import { trpc } from "@/trpc/client";
import { cn } from "@/lib/utils";

type Board = { id: string; name: string };
type Props = { boards: Board[]; activeId: string; onSelect: (id: string) => void };

/** Folder-style tabs above the canvas: one board per tab. Double-click a tab to rename it. */
export function BoardTabs({ boards, activeId, onSelect }: Props) {
  const utils = trpc.useUtils();
  const [renaming, setRenaming] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Board | null>(null);
  const onError = (error: { message: string }) => toast.error(error.message);
  const create = trpc.board.createBoard.useMutation({
    onSuccess: async ({ id }) => {
      await utils.board.boards.invalidate();
      onSelect(id);
      setRenaming(id);
    },
    onError,
  });
  const rename = trpc.board.renameBoard.useMutation({ onSettled: () => utils.board.boards.invalidate(), onError });
  const remove = trpc.board.deleteBoard.useMutation({
    onSuccess: async ({ movedTo }) => {
      await Promise.all([utils.board.boards.invalidate(), utils.applications.list.invalidate()]);
      onSelect(movedTo);
      toast.success("Board deleted. Its cards moved to your first board.");
    },
    onError,
  });

  const commitRename = (board: Board, name: string) => {
    setRenaming(null);
    const next = name.trim();
    if (!next || next === board.name) return;
    utils.board.boards.setData(undefined, (prev) => prev?.map((b) => (b.id === board.id ? { ...b, name: next } : b)));
    rename.mutate({ boardId: board.id, name: next });
  };

  return (
    <nav aria-label="Boards" className="flex items-end gap-1 overflow-x-auto bg-card px-3 pt-1 sm:px-5">
      {boards.map((board) => {
        const active = board.id === activeId;
        return (
          <div
            key={board.id}
            className={cn(
              "flex shrink-0 items-center rounded-t-xl transition-colors",
              // The open tab shares the canvas colour, so it reads as the folder's front sheet.
              active ? "bg-muted/60 text-foreground" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
            )}
          >
            {renaming === board.id ? (
              <input
                autoFocus
                defaultValue={board.name}
                maxLength={60}
                aria-label="Board name"
                className="w-36 rounded-md bg-card px-2 py-1 my-1.5 ml-2 text-sm font-medium outline-none ring-1 ring-primary/40"
                onBlur={(event) => commitRename(board, event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.currentTarget.blur();
                  if (event.key === "Escape") setRenaming(null);
                }}
              />
            ) : (
              <button
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => onSelect(board.id)}
                onDoubleClick={() => setRenaming(board.id)}
                className={cn("max-w-48 truncate py-2.5 pl-4 text-sm", active ? "pr-1 font-semibold" : "pr-4 font-medium")}
              >
                {board.name}
              </button>
            )}
            {active && renaming !== board.id ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" aria-label={`${board.name} options`} className="mr-2 rounded-md p-1 text-muted-foreground hover:bg-card">
                    <ChevronDown className="size-3.5" aria-hidden="true" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onSelect={() => setRenaming(board.id)}>Rename</DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={boards.length < 2}
                    className="text-destructive-surface-foreground"
                    onSelect={() => setDeleting(board)}
                  >
                    Delete board
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        );
      })}
      <button
        type="button"
        aria-label="New board"
        title="New board"
        disabled={create.isPending}
        onClick={() => create.mutate({ name: `Board ${boards.length + 1}` })}
        className="mb-1 ml-1 flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      >
        <Plus className="size-4" aria-hidden="true" />
      </button>

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{deleting?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              Its notes and frames are deleted. Its application cards are kept and move to your first board.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => deleting && remove.mutate({ boardId: deleting.id })}>
              Delete board
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </nav>
  );
}
