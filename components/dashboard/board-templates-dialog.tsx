"use client";

import { toast } from "sonner";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "@/components/ui/icons";
import { TRACKER_STATUSES, type TrackerStatus } from "@/lib/types/applications";
import { BOARD_TEMPLATES, type BoardTemplate, type NoteColor } from "@/lib/types/board";
import { trpc } from "@/trpc/client";

// Header tints in the preview, matching each status pill on the board.
const STATUS_FILL: Record<TrackerStatus, string> = {
  saved: "fill-zinc-300",
  applied: "fill-amber-300",
  screening: "fill-lime-300",
  interview: "fill-sky-300",
  offer: "fill-emerald-300",
  rejected: "fill-red-300",
  ghosted: "fill-rose-200",
  dropped: "fill-zinc-400",
};
const NOTE_FILL: Record<NoteColor, string> = {
  yellow: "fill-amber-200",
  pink: "fill-pink-200",
  blue: "fill-sky-200",
  green: "fill-emerald-200",
  purple: "fill-violet-200",
};

/** A to-scale sketch of the layout, drawn from the same data the template applies. */
function Preview({ template }: { template: BoardTemplate }) {
  const frames = [
    ...TRACKER_STATUSES.map((status) => ({ ...template.frames[status], status })),
    ...template.extras.filter((e) => e.kind === "frame").map((e) => ({ x: e.data.x!, y: e.data.y!, w: e.data.w!, h: e.data.h!, status: undefined })),
  ];
  const noteBoxes = template.extras.filter((e) => e.kind === "note");
  const minY = Math.min(...frames.map((f) => f.y), ...template.extras.map((e) => e.data.y ?? 0));
  const maxX = Math.max(...frames.map((f) => f.x + f.w));
  const maxY = Math.max(...frames.map((f) => f.y + f.h));
  const pad = 40;
  return (
    <svg viewBox={`${-pad} ${minY - pad} ${maxX + 2 * pad} ${maxY - minY + 2 * pad}`} className="h-28 w-full" aria-hidden="true">
      {frames.map((f, i) => (
        <g key={i}>
          <rect x={f.x} y={f.y} width={f.w} height={f.h} rx={24} className="fill-card" />
          <rect x={f.x + 18} y={f.y + 18} width={f.status ? 110 : 160} height={28} rx={8} className={f.status ? STATUS_FILL[f.status] : "fill-zinc-300"} />
        </g>
      ))}
      {noteBoxes.map((n, i) => (
        <rect key={i} x={n.data.x} y={n.data.y} width={n.data.w} height={n.data.h} rx={10} className={NOTE_FILL[n.data.color ?? "yellow"]} />
      ))}
    </svg>
  );
}

type Props = { boardId: string; open: boolean; onOpenChange: (open: boolean) => void; onApplied: () => void };

export function BoardTemplatesDialog({ boardId, open, onOpenChange, onApplied }: Props) {
  const utils = trpc.useUtils();
  const apply = trpc.board.applyTemplate.useMutation({
    onSuccess: async (_, { templateId }) => {
      await utils.board.list.invalidate();
      onOpenChange(false);
      onApplied();
      toast.success(`${BOARD_TEMPLATES.find((t) => t.id === templateId)?.name} layout applied.`);
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Board templates</DialogTitle>
          <DialogDescription>
            Pick a layout and your board is set up in one click. Your cards, notes and arrows stay; the status frames move into place and the
            template&apos;s frames and notes are added.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          {BOARD_TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              disabled={apply.isPending}
              onClick={() => apply.mutate({ boardId, templateId: template.id })}
              className="group rounded-2xl bg-muted/60 p-3 text-left transition-colors hover:bg-primary/10 disabled:opacity-60"
            >
              <div className="rounded-xl bg-muted p-2 transition-colors group-hover:bg-primary/5">
                <Preview template={template} />
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 px-1">
                <p className="font-semibold text-foreground">{template.name}</p>
                {apply.isPending && apply.variables?.templateId === template.id ? (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden="true" />
                ) : null}
              </div>
              <p className="mt-1 px-1 text-sm leading-relaxed text-muted-foreground">{template.description}</p>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
