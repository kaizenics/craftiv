"use client";

import { useState } from "react";

import { Link2 } from "@/components/ui/icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ShareLinkDialog, type ShareableKind } from "@/components/share/share-link-dialog";

/** Icon button for document rows that opens the share-link dialog. */
export function ShareButton({ kind, id }: { kind: ShareableKind; id: string }) {
  const [open, setOpen] = useState(false);
  const noun = kind === "resume" ? "resume" : "cover letter";

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          // Rows and cards open the editor on click; sharing shouldn't.
          event.stopPropagation();
          setOpen(true);
        }}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-primary transition-colors hover:border-primary/20 hover:bg-primary/10"
        aria-label={`Share ${noun}`}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex">
              <Link2 className="h-4 w-4" />
            </span>
          </TooltipTrigger>
          <TooltipContent>Share link</TooltipContent>
        </Tooltip>
      </button>
      {/* Stop clicks inside the dialog from reaching a clickable card behind it. */}
      <div onClick={(event) => event.stopPropagation()} className="contents">
        <ShareLinkDialog kind={kind} id={id} open={open} onOpenChange={setOpen} />
      </div>
    </>
  );
}
