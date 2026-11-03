"use client";

import { useRef } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, MoreVertical, Upload } from "@/components/ui/icons";
import type { TrackedApp } from "@/components/dashboard/application-canvas";
import { parseCsv, rowsToApplications, toCsv } from "@/lib/tracker-csv";
import { trpc } from "@/trpc/client";

// Far above any real tracker; stops a wrong file from freezing the tab while it parses.
const MAX_FILE_BYTES = 2 * 1024 * 1024;

type Props = { boardId: string; boardName: string; apps: TrackedApp[] };

/** Less-used tracker actions: spreadsheet export and import for the open tab. */
export function TrackerMenu({ boardId, boardName, apps }: Props) {
  const utils = trpc.useUtils();
  const fileRef = useRef<HTMLInputElement>(null);
  const importMany = trpc.applications.importMany.useMutation({
    onSuccess: async ({ count }) => {
      await utils.applications.list.invalidate();
      toast.success(`Imported ${count} application${count === 1 ? "" : "s"}.`);
    },
    onError: (error) => toast.error(error.message),
  });

  const exportCsv = () => {
    const blob = new Blob([toCsv(apps)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${boardName.replace(/[^\w-]+/g, "-").toLowerCase() || "applications"}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importFile = async (file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      toast.error("That file is too large. Export a CSV of just your tracker sheet.");
      return;
    }
    try {
      const { rows, skipped, overLimit } = rowsToApplications(parseCsv(await file.text()));
      if (rows.length === 0) {
        toast.error("No rows with a company or role were found.");
        return;
      }
      if (skipped || overLimit) {
        toast.info(
          [skipped && `${skipped} row${skipped === 1 ? "" : "s"} without a company or role skipped`, overLimit && `${overLimit} over the ${rows.length}-row limit left out`]
            .filter(Boolean)
            .join(", ") + ".",
        );
      }
      importMany.mutate({ boardId, rows });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not read that file.");
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="size-9 p-0 sm:size-8" aria-label="More tracker actions" disabled={importMany.isPending}>
            <MoreVertical className="size-4" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled={apps.length === 0} onSelect={exportCsv}>
            <Download className="size-4" aria-hidden="true" />
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => fileRef.current?.click()}>
            <Upload className="size-4" aria-hidden="true" />
            Import from CSV
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void importFile(file);
        }}
      />
    </>
  );
}
