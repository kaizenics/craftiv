"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  NodeResizeControl,
  NodeResizer,
  ResizeControlVariant,
  ReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
  useReactFlow,
  type Node,
  type NodeChange,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { inferRouterOutputs } from "@trpc/server";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { CalendarIcon, Clock, Link2, Lock, Unlock, MapPin, Money, Plus, Redo2, Type, Undo2, Users, StickyNote, Frame } from "@/components/ui/icons";
import { daysWaiting, FOLLOW_UP_AFTER_DAYS, GHOSTED_AFTER_DAYS } from "@/lib/tracker-stats";
import { TRACKER_STATUS_LABELS, TRACKER_STATUS_STYLES, type TrackerStatus } from "@/lib/types/applications";
import {
  autoPlace,
  CARD_GAP,
  CARD_WIDTH,
  FRAME_HEADER,
  FRAME_PAD,
  positionBetween,
  statusFrameAt,
  type BoardItemData,
  type NoteColor,
} from "@/lib/types/board";
import { trpc } from "@/trpc/client";
import type { AppRouter } from "@/trpc/root";
import { cn } from "@/lib/utils";

type Outputs = inferRouterOutputs<AppRouter>;
export type TrackedApp = Outputs["applications"]["list"][number];
type BoardRow = Outputs["board"]["list"][number];
export type HunterCard = { id: string; status: TrackerStatus };

type Actions = {
  openApp: (app: TrackedApp) => void;
  addApp: (status: TrackerStatus) => void;
  ghost: (app: TrackedApp) => void;
  renderHunter: (id: string) => ReactNode;
  saveItem: (id: string, data: BoardItemData) => void;
  needle: string;
};
// Node components read callbacks from context, so node data stays plain and the node list only changes with real data.
const ActionsContext = createContext<Actions | null>(null);
const useActions = () => useContext(ActionsContext)!;

const NOTE_STYLES: Record<NoteColor, string> = {
  yellow: "bg-amber-100",
  pink: "bg-pink-100",
  blue: "bg-sky-100",
  green: "bg-emerald-100",
  purple: "bg-violet-100",
};
const CARD_FALLBACK_HEIGHT = 110;

function formatDate(value: string) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/** Marks an item the user has locked. */
function LockBadge() {
  return (
    <span className="absolute -right-2 -top-2 z-10 flex size-5 items-center justify-center rounded-full bg-card text-muted-foreground shadow-sm" title="Locked">
      <Lock className="size-3" aria-label="Locked" />
    </span>
  );
}

function FrameNode({ id, data, selected }: NodeProps<Node<BoardItemData & { count: number }>>) {
  const { addApp, saveItem } = useActions();
  const [editing, setEditing] = useState(false);
  return (
    <div className={cn("relative h-full w-full rounded-2xl bg-card/90 p-3", selected && "ring-2 ring-primary/40")}>
      {data.locked ? <LockBadge /> : null}
      {data.status ? (
        // Status frames keep their column width; only the bottom edge drags, to make the column taller or shorter.
        selected && !data.locked ? (
          <NodeResizeControl
            position="bottom"
            variant={ResizeControlVariant.Line}
            minHeight={160}
            resizeDirection="vertical"
            className="!border-b-2 !border-primary/50"
            onResizeEnd={(_, p) => saveItem(id, { y: p.y, h: p.height })}
          />
        ) : null
      ) : (
        <NodeResizer
          isVisible={selected && !data.locked}
          minWidth={200}
          minHeight={160}
          lineClassName="!border-primary/40"
          handleClassName="!size-2.5 !rounded-sm !border-primary !bg-card"
          onResizeEnd={(_, p) => saveItem(id, { x: p.x, y: p.y, w: p.width, h: p.height })}
        />
      )}
      <div className="flex h-8 items-center justify-between gap-2 px-1">
        {data.status ? (
          <span className={cn("rounded-md px-2 py-1 text-xs font-semibold", TRACKER_STATUS_STYLES[data.status])}>
            {TRACKER_STATUS_LABELS[data.status]}
          </span>
        ) : editing ? (
          <input
            autoFocus
            defaultValue={data.text ?? ""}
            maxLength={120}
            aria-label="Frame name"
            className="nodrag min-w-0 flex-1 rounded-md bg-muted px-2 py-1 text-sm font-semibold outline-none"
            onBlur={(event) => {
              setEditing(false);
              saveItem(id, { text: event.target.value });
            }}
            onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
          />
        ) : (
          <button type="button" className="truncate text-sm font-semibold text-foreground" onDoubleClick={() => !data.locked && setEditing(true)}>
            {data.text || "Untitled frame"}
          </button>
        )}
        {data.status ? (
          <span className="flex items-center gap-1">
            <span className="text-xs tabular-nums text-muted-foreground">{data.count}</span>
            <Button
              variant="ghost"
              size="icon-sm"
              className="nodrag"
              aria-label={`Add an application to ${TRACKER_STATUS_LABELS[data.status]}`}
              onClick={() => addApp(data.status!)}
            >
              <Plus className="size-4" aria-hidden="true" />
            </Button>
          </span>
        ) : null}
      </div>
    </div>
  );
}

function CardNode({ data }: NodeProps<Node<{ app: TrackedApp }>>) {
  const { openApp, ghost, needle } = useActions();
  const { app } = data;
  const waiting = daysWaiting(app);
  const nudge = waiting !== null && waiting >= FOLLOW_UP_AFTER_DAYS;
  const dimmed = needle && ![app.company, app.title, app.location, app.salary].some((value) => value.toLowerCase().includes(needle));
  return (
    <div className={cn("group rounded-xl bg-muted shadow-sm transition-opacity", dimmed && "opacity-25")} style={{ width: CARD_WIDTH }}>
      <button
        type="button"
        onClick={() => openApp(app)}
        className={cn("block w-full rounded-xl p-3 text-left", (nudge || app.status === "interview") && "rounded-b-none")}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-semibold text-foreground">{app.company || "No company"}</p>
          <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold", TRACKER_STATUS_STYLES[app.status])}>
            {TRACKER_STATUS_LABELS[app.status]}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{app.title || "No title"}</p>
        {app.appliedOn || app.interviewStage ? (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {app.appliedOn ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <CalendarIcon className="size-3" aria-hidden="true" />
                {formatDate(app.appliedOn)}
              </span>
            ) : null}
            {app.interviewStage ? (
              <span className="rounded-md bg-card px-1.5 py-0.5 text-xs font-medium text-foreground">{app.interviewStage}</span>
            ) : null}
          </div>
        ) : null}
        {app.contact || app.interviewer ? (
          <p className="mt-2 flex items-center gap-1 truncate text-xs text-muted-foreground">
            <Users className="size-3 shrink-0" aria-hidden="true" />
            {[app.contact, app.interviewer].filter(Boolean).join(" · ")}
          </p>
        ) : null}
        {app.location || app.salary || app.postingUrl ? (
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {app.location ? (
              <span className="inline-flex min-w-0 items-center gap-1">
                <MapPin className="size-3 shrink-0" aria-hidden="true" />
                <span className="truncate">{app.location}</span>
              </span>
            ) : null}
            {app.salary ? (
              <span className="inline-flex min-w-0 items-center gap-1">
                <Money className="size-3 shrink-0" aria-hidden="true" />
                <span className="truncate">{app.salary}</span>
              </span>
            ) : null}
            {app.postingUrl ? <Link2 className="size-3" aria-label="Has a posting link" /> : null}
          </p>
        ) : null}
      </button>
      {app.status === "interview" && !nudge ? (
        <button
          type="button"
          onClick={() => openApp(app)}
          className="nodrag flex w-full items-center gap-1.5 rounded-b-xl bg-sky-50 px-3 py-2 text-left text-xs font-medium text-sky-900 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-200"
        >
          <Users className="size-3.5" aria-hidden="true" />
          Prep for this interview
        </button>
      ) : null}
      {nudge ? (
        <div className="flex items-center justify-between gap-2 rounded-b-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" aria-hidden="true" />
            No reply in {waiting} days
          </span>
          <button
            type="button"
            onClick={() => (waiting >= GHOSTED_AFTER_DAYS ? ghost(app) : openApp(app))}
            className="nodrag font-medium underline-offset-2 hover:underline"
          >
            {waiting >= GHOSTED_AFTER_DAYS ? "Move to Ghosted" : "Follow up"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function HunterNode({ id }: NodeProps) {
  const { renderHunter } = useActions();
  return <div style={{ width: CARD_WIDTH }}>{renderHunter(id.slice("hunter:".length))}</div>;
}

/** Sticky notes and text labels: double-click to edit, saved when the field loses focus. */
function EditableNode({ id, data, selected, type }: NodeProps<Node<BoardItemData>>) {
  const { saveItem } = useActions();
  const [editing, setEditing] = useState(false);
  const note = type === "note";
  return (
    <div
      className={cn(
        "group h-full w-full",
        note ? cn("rounded-md p-4 shadow-sm", NOTE_STYLES[data.color ?? "yellow"]) : "px-1",
        selected && "ring-2 ring-primary/40",
      )}
      onDoubleClick={() => !data.locked && setEditing(true)}
    >
      {data.locked ? <LockBadge /> : null}
      {note ? (
        <NodeResizer
          isVisible={selected && !data.locked}
          minWidth={120}
          minHeight={100}
          lineClassName="!border-primary/40"
          handleClassName="!size-2.5 !rounded-sm !border-primary !bg-card"
          onResizeEnd={(_, p) => saveItem(id, { x: p.x, y: p.y, w: p.width, h: p.height })}
        />
      ) : null}
      {editing ? (
        <textarea
          autoFocus
          defaultValue={data.text ?? ""}
          maxLength={2000}
          aria-label={note ? "Note text" : "Text"}
          className={cn("nodrag nowheel h-full w-full resize-none bg-transparent outline-none", note ? "text-sm" : "text-xl font-semibold")}
          onBlur={(event) => {
            setEditing(false);
            saveItem(id, { text: event.target.value });
          }}
        />
      ) : (
        <p className={cn("h-full whitespace-pre-wrap break-words", note ? "text-sm text-zinc-800" : "text-xl font-semibold text-foreground")}>
          {data.text || <span className="text-muted-foreground">{note ? "Double-click to write" : "Double-click to edit"}</span>}
        </p>
      )}
    </div>
  );
}

const nodeTypes = { frame: FrameNode, card: CardNode, hunter: HunterNode, note: EditableNode, text: EditableNode };

type CanvasProps = {
  apps: TrackedApp[];
  items: BoardRow[];
  hunter: HunterCard[];
  /** Bump to zoom the view to the whole board, e.g. after a template is applied. */
  fitKey: number;
  /** The open tab. */
  boardId: string;
} & Omit<Actions, "saveItem">;

function Canvas({ apps, items, hunter, fitKey, boardId, ...actions }: CanvasProps) {
  const utils = trpc.useUtils();
  const flow = useReactFlow();
  useEffect(() => {
    if (!fitKey) return;
    // A beat for the new layout to render and be measured first.
    const timer = setTimeout(() => flow.fitView({ padding: 0.12, duration: 500, maxZoom: 1 }), 120);
    return () => clearTimeout(timer);
  }, [fitKey, flow]);
  const wrapper = useRef<HTMLDivElement>(null);
  const onError = (error: { message: string }) => toast.error(error.message);
  const refresh = () => Promise.all([utils.board.list.invalidate(), utils.applications.list.invalidate()]);
  const save = trpc.board.save.useMutation({ onError, onSettled: refresh });
  const savePositions = trpc.board.savePositions.useMutation({ onError, onSettled: refresh });
  const remove = trpc.board.remove.useMutation({ onError, onSettled: refresh });
  const restore = trpc.board.restore.useMutation({ onError, onSettled: refresh });

  // Undo history: a snapshot of this tab is taken before every change; undo and redo put one back.
  type Snapshot = { items: BoardRow[]; apps: TrackedApp[] };
  const [history, setHistory] = useState<{ past: Snapshot[]; future: Snapshot[] }>({ past: [], future: [] });
  const snapshot = (): Snapshot => ({
    items: utils.board.list.getData({ boardId }) ?? items,
    apps: utils.applications.list.getData({ boardId }) ?? apps,
  });
  const record = () => {
    // Taken now, before the caller's optimistic update; inside the state updater it would already see the change.
    const before = snapshot();
    setHistory((h) => ({ past: [...h.past.slice(-49), before], future: [] }));
  };
  const goTo = (snap: Snapshot) => {
    utils.board.list.setData({ boardId }, snap.items);
    utils.applications.list.setData({ boardId }, snap.apps);
    restore.mutate({
      boardId,
      items: snap.items.map((row) => ({ id: row.id, kind: row.kind, data: row.data })),
      cards: snap.apps.map((a) => ({ id: a.id, status: a.status, position: a.position, canvasX: a.canvasX, canvasY: a.canvasY })),
    });
  };
  const undo = () => {
    const prev = history.past.at(-1);
    if (!prev) return;
    setHistory({ past: history.past.slice(0, -1), future: [...history.future, snapshot()] });
    goTo(prev);
  };
  const redo = () => {
    const next = history.future.at(-1);
    if (!next) return;
    setHistory({ past: [...history.past, snapshot()], future: history.future.slice(0, -1) });
    goTo(next);
  };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      // Typing in a note, a name or the filter keeps the browser's own text undo.
      if (target?.closest("input, textarea, [contenteditable=true]") || !(event.ctrlKey || event.metaKey)) return;
      const key = event.key.toLowerCase();
      if (key === "z" && !event.shiftKey) {
        event.preventDefault();
        undo();
      } else if ((key === "z" && event.shiftKey) || key === "y") {
        event.preventDefault();
        redo();
      }
    };
    // Capture phase: the canvas handles some keys itself and would otherwise swallow the shortcut.
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  });
  const move = trpc.applications.move.useMutation({ onError, onSettled: refresh });

  const saveItem = (id: string, data: BoardItemData) => {
    record();
    utils.board.list.setData({ boardId }, (prev) => prev?.map((row) => (row.id === id ? { ...row, data: { ...row.data, ...data } } : row)));
    save.mutate({ boardId,  id, kind: items.find((row) => row.id === id)?.kind ?? "note", data });
  };

  // Measured card heights, so stacked cards never overlap however tall they are.
  const [heights, setHeights] = useState<Record<string, number>>({});

  const frames = useMemo(() => items.filter((row) => row.kind === "frame"), [items]);
  const nodesFromData = useMemo(() => {
    const statusFrames = new Map(frames.filter((f) => f.data.status).map((f) => [f.data.status!, f]));
    const offsets = new Map<TrackerStatus, number>();
    const stack = (status: TrackerStatus, id: string) => {
      const offset = offsets.get(status) ?? 0;
      offsets.set(status, offset + (heights[id] ?? CARD_FALLBACK_HEIGHT) + CARD_GAP);
      return autoPlace(statusFrames.get(status)?.data, offset);
    };
    // A card with its own spot keeps it only outside the status frames; inside one it always sits in the frame's tidy stack.
    const statusFrameData = frames.map((f) => f.data);
    const freeSpot = (app: TrackedApp) => {
      if (app.canvasX === null || app.canvasY === null) return null;
      const c = { x: app.canvasX + CARD_WIDTH / 2, y: app.canvasY + (heights[app.id] ?? CARD_FALLBACK_HEIGHT) / 2 };
      return statusFrameAt(c, statusFrameData) ? null : { x: app.canvasX, y: app.canvasY };
    };
    const cards: Node[] = [...apps]
      .sort((a, b) => a.position - b.position)
      .map((app) => ({
        id: app.id,
        type: "card",
        position: freeSpot(app) ?? stack(app.status, app.id),
        data: { app },
        zIndex: 2,
      }));
    const hunters: Node[] = hunter.map((job) => ({
      id: `hunter:${job.id}`,
      type: "hunter",
      position: stack(job.status, `hunter:${job.id}`),
      data: {},
      draggable: false,
      zIndex: 2,
    }));
    const frameNodes: Node[] = frames.map((frame) => {
      const stacked = frame.data.status ? (offsets.get(frame.data.status) ?? 0) : 0;
      return {
        id: frame.id,
        type: "frame",
        position: { x: frame.data.x ?? 0, y: frame.data.y ?? 0 },
        // A frame grows to fit the cards stacked in it.
        width: frame.data.w,
        height: Math.max(frame.data.h ?? 0, FRAME_HEADER + stacked + FRAME_PAD),
        data: { ...frame.data, count: frame.data.status ? apps.filter((a) => a.status === frame.data.status).length : 0 },
        zIndex: 0,
        draggable: !frame.data.locked,
        deletable: !frame.data.locked,
      };
    });
    const loose: Node[] = items
      .filter((row) => row.kind === "note" || row.kind === "text")
      .map((row) => ({
        id: row.id,
        type: row.kind,
        position: { x: row.data.x ?? 0, y: row.data.y ?? 0 },
        width: row.data.w ?? (row.kind === "note" ? 200 : 280),
        height: row.data.h ?? (row.kind === "note" ? 180 : 48),
        data: row.data,
        zIndex: 1,
        draggable: !row.data.locked,
        deletable: !row.data.locked,
      }));
    return [...frameNodes, ...loose, ...cards, ...hunters];
  }, [apps, items, frames, hunter, heights]);

  // Local copy for smooth dragging; replaced whenever the data underneath changes (adjusting state during render, not in an effect).
  const [nodes, setNodes] = useState<Node[]>(nodesFromData);
  const [synced, setSynced] = useState(nodesFromData);
  if (synced !== nodesFromData) {
    setSynced(nodesFromData);
    setNodes((current) =>
      nodesFromData.map((node) => {
        const prev = current.find((n) => n.id === node.id);
        return prev ? { ...node, selected: prev.selected, measured: prev.measured } : node;
      }),
    );
  }


  const groups = useMemo(() => items.filter((row) => row.kind === "group" && row.data.members?.length), [items]);
  const groupOf = (id: string) => groups.find((g) => g.data.members!.includes(id));

  const onNodesChange = (changes: NodeChange[]) => {
    // Selecting one member of a group selects the whole group, so it drags as one.
    const expanded = changes.flatMap((change) => {
      if (change.type !== "select" || !change.selected) return [change];
      const members = groupOf(change.id)?.data.members ?? [];
      return [change, ...members.filter((m) => m !== change.id).map((m) => ({ type: "select" as const, id: m, selected: true }))];
    });
    setNodes((current) => applyNodeChanges(expanded, current));
    const measured = changes.flatMap((change) =>
      change.type === "dimensions" && change.dimensions && !change.resizing && nodes.find((n) => n.id === change.id && (n.type === "card" || n.type === "hunter"))
        ? [[change.id, Math.round(change.dimensions.height)] as const]
        : [],
    );
    if (measured.some(([id, h]) => heights[id] !== h)) setHeights((prev) => ({ ...prev, ...Object.fromEntries(measured) }));
  };

  // A dragged frame carries what sits inside it, and a dragged group member carries the rest of its group, like Miro.
  const carried = useRef<{ start: Record<string, { x: number; y: number }>; children: Record<string, string[]> }>({ start: {}, children: {} });
  const centre = (n: Node) => ({ x: n.position.x + (n.measured?.width ?? 0) / 2, y: n.position.y + (n.measured?.height ?? 0) / 2 });
  const inside = (n: Node, f: Node) => {
    const c = centre(n);
    const w = f.measured?.width ?? f.width ?? 0;
    const h = f.measured?.height ?? f.height ?? 0;
    return c.x >= f.position.x && c.x <= f.position.x + w && c.y >= f.position.y && c.y <= f.position.y + h;
  };

  const onNodeDragStart = (_: unknown, __: Node, dragged: Node[]) => {
    const start: Record<string, { x: number; y: number }> = {};
    const children: Record<string, string[]> = {};
    const taken = new Set(dragged.map((n) => n.id));
    for (const n of dragged) {
      const ids: string[] = [];
      for (const member of groupOf(n.id)?.data.members ?? []) {
        // A locked member stays put even when the rest of its group moves.
        if (taken.has(member) || (nodes.find((x) => x.id === member)?.data as BoardItemData | undefined)?.locked) continue;
        ids.push(member);
        taken.add(member);
      }
      if (n.type === "frame") {
        // Cards in a status frame are stacked from the frame's position, so they follow it without being moved.
        const statusFrame = Boolean((n.data as BoardItemData).status);
        for (const child of nodes) {
          if (taken.has(child.id) || child.type === "frame" || child.type === "hunter" || (statusFrame && child.type === "card")) continue;
          if ((child.data as BoardItemData).locked) continue;
          if (!inside(child, n)) continue;
          ids.push(child.id);
          taken.add(child.id);
        }
      }
      if (ids.length) children[n.id] = ids;
    }
    for (const n of nodes) start[n.id] = { ...n.position };
    carried.current = { start, children };
  };

  const carriedMoves = (dragged: Node[]) => {
    const { start, children } = carried.current;
    const moves = new Map<string, { x: number; y: number }>();
    for (const n of dragged) {
      const dx = n.position.x - start[n.id].x;
      const dy = n.position.y - start[n.id].y;
      for (const child of children[n.id] ?? []) moves.set(child, { x: start[child].x + dx, y: start[child].y + dy });
    }
    return moves;
  };

  const onNodeDrag = (_: unknown, __: Node, dragged: Node[]) => {
    const moves = carriedMoves(dragged);
    if (moves.size) setNodes((current) => current.map((n) => (moves.has(n.id) ? { ...n, position: moves.get(n.id)! } : n)));
  };

  const onNodeDragStop = (_: unknown, __: Node, dragged: Node[]) => {
    if (dragged.some((n) => n.type !== "hunter")) record();
    // Final spots come from React Flow's own nodes for the dragged ones, and from the drag offset for what they carried.
    const latest: Node[] = [...dragged];
    for (const [id, position] of carriedMoves(dragged)) {
      const child = nodes.find((n) => n.id === id);
      if (child) latest.push({ ...child, position });
    }
    const frameData = frames.map((f) => {
      const live = latest.find((n) => n.id === f.id) ?? nodes.find((n) => n.id === f.id);
      return { ...f.data, x: live?.position.x ?? f.data.x, y: live?.position.y ?? f.data.y, w: live?.measured?.width ?? f.data.w, h: live?.measured?.height ?? f.data.h };
    });
    const itemMoves: { id: string; x: number; y: number }[] = [];
    const cardMoves: { id: string; x: number; y: number }[] = [];
    for (const n of latest) {
      const pos = { id: n.id, x: Math.round(n.position.x), y: Math.round(n.position.y) };
      if (n.type !== "card") {
        if (n.type !== "hunter") itemMoves.push(pos);
        continue;
      }
      const app = apps.find((a) => a.id === n.id)!;
      const status = statusFrameAt(centre(n), frameData);
      if (!status) {
        // Outside every status frame: the card stays exactly where it was dropped and keeps its status.
        cardMoves.push(pos);
        continue;
      }
      // Inside a status frame: take its status and slot into its stack where it was dropped.
      // The dropped card's top edge decides its slot, so a tall card dropped on a short one's top lands above it.
      const dropY = n.position.y + 24;
      const stackIds = apps.filter((a) => a.status === status && a.id !== app.id).sort((a, b) => a.position - b.position);
      const above = stackIds.filter((a) => {
        const other = nodes.find((x) => x.id === a.id);
        return other ? centre(other).y < dropY : true;
      });
      const position = positionBetween(above.at(-1)?.position, stackIds[above.length]?.position);
      utils.applications.list.setData({ boardId }, (prev) =>
        prev?.map((a) => (a.id === app.id ? { ...a, status, position, canvasX: null, canvasY: null } : a)),
      );
      move.mutate({ id: app.id, status, position, canvasX: null, canvasY: null });
    }
    if (!itemMoves.length && !cardMoves.length) return;
    utils.board.list.setData({ boardId }, (prev) =>
      prev?.map((row) => {
        const m = itemMoves.find((i) => i.id === row.id);
        return m ? { ...row, data: { ...row.data, x: m.x, y: m.y } } : row;
      }),
    );
    utils.applications.list.setData({ boardId }, (prev) =>
      prev?.map((a) => {
        const m = cardMoves.find((c) => c.id === a.id);
        return m ? { ...a, canvasX: m.x, canvasY: m.y } : a;
      }),
    );
    savePositions.mutate({ items: itemMoves, cards: cardMoves });
  };

  // Notes, text, custom frames and arrows can be deleted; cards are deleted from their panel and status frames are the board's columns.
  const deletable = (id: string) => {
    const row = items.find((r) => r.id === id);
    return Boolean(row && !row.data.locked && !(row.kind === "frame" && row.data.status));
  };

  const add = (kind: "note" | "text" | "frame") => {
    record();
    const rect = wrapper.current?.getBoundingClientRect();
    const at = flow.screenToFlowPosition({ x: (rect?.left ?? 0) + (rect?.width ?? 0) / 2, y: (rect?.top ?? 0) + (rect?.height ?? 0) / 2 });
    const size = kind === "frame" ? { w: 420, h: 320 } : kind === "note" ? { w: 200, h: 180 } : { w: 280, h: 48 };
    save.mutate({ boardId, 
      kind,
      data: { x: Math.round(at.x - size.w / 2), y: Math.round(at.y - size.h / 2), ...size, ...(kind === "note" ? { color: "yellow" as const } : {}) },
    });
  };

  const selectedNotes = nodes.filter((n) => n.selected && n.type === "note" && !(n.data as BoardItemData).locked);
  const lockable = nodes.filter((n) => n.selected && (n.type === "frame" || n.type === "note" || n.type === "text"));
  const allLocked = lockable.length > 0 && lockable.every((n) => (n.data as BoardItemData).locked);
  // Status frames and Job Hunter cards are part of the board itself, so they never join a group.
  const groupable = nodes.filter((n) => n.selected && n.type !== "hunter" && !(n.type === "frame" && (n.data as BoardItemData).status));
  const selectedGroup = groupable.length ? groupOf(groupable[0].id) : undefined;
  const isWholeGroup =
    selectedGroup && groupable.length === selectedGroup.data.members!.length && groupable.every((n) => selectedGroup.data.members!.includes(n.id));

  const group = () => {
    record();
    const ids = groupable.map((n) => n.id);
    // An item belongs to one group at a time: grouping again replaces its old group.
    const replaced = groups.filter((g) => g.data.members!.some((m) => ids.includes(m))).map((g) => g.id);
    if (replaced.length) remove.mutate({ ids: replaced });
    save.mutate({ boardId,  kind: "group", data: { members: ids } }, { onSuccess: () => toast.success("Grouped. They now move together.") });
  };
  const ungroup = () => {
    if (!selectedGroup) return;
    record();
    utils.board.list.setData({ boardId }, (prev) => prev?.filter((row) => row.id !== selectedGroup.id));
    remove.mutate({ ids: [selectedGroup.id] });
  };

  return (
    <ActionsContext.Provider value={{ ...actions, saveItem }}>
      <div ref={wrapper} className="relative h-full overflow-hidden bg-muted/60">
        <ReactFlow
          nodes={nodes}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onNodeDragStart={onNodeDragStart}
          onNodeDrag={onNodeDrag}
          onNodeDragStop={onNodeDragStop}
          onBeforeDelete={async ({ nodes: n, edges: e }) => ({ nodes: n.filter((node) => deletable(node.id)), edges: e })}
          onDelete={({ nodes: n, edges: e }) => {
            const removed = [...n.map((node) => node.id), ...e.map((edge) => edge.id)];
            if (!removed.length) return;
            record();
            utils.board.list.setData({ boardId }, (prev) => prev?.filter((row) => !removed.includes(row.id)));
            remove.mutate({ ids: removed });
          }}
          nodesConnectable={false}
          deleteKeyCode={["Backspace", "Delete"]}
          // Keep stacking fixed: a selected frame must not jump in front of the cards inside it.
          elevateNodesOnSelect={false}
          // Open at a readable zoom from the first frames, like Miro, rather than shrinking every frame to fit.
          defaultViewport={{ x: 72, y: 24, zoom: 0.9 }}
          minZoom={0.15}
          maxZoom={2}
          defaultEdgeOptions={{ type: "default" }}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} />
          <Controls showInteractive={false} position="bottom-left" />
          <MiniMap pannable zoomable position="bottom-right" className="!hidden !rounded-xl sm:!block" nodeBorderRadius={8} />
        </ReactFlow>

        <div className="absolute left-3 top-3 flex flex-col gap-1 rounded-xl bg-card p-1 shadow-sm" role="toolbar" aria-label="Add to the board">
          <Button variant="ghost" size="icon-sm" aria-label="Add a sticky note" title="Sticky note" onClick={() => add("note")}>
            <StickyNote className="size-4" aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Add text" title="Text" onClick={() => add("text")}>
            <Type className="size-4" aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Add a frame" title="Frame" onClick={() => add("frame")}>
            <Frame className="size-4" aria-hidden="true" />
          </Button>
          <span className="mx-1.5 my-0.5 h-px bg-border" aria-hidden="true" />
          <Button variant="ghost" size="icon-sm" aria-label="Undo" title="Undo (Ctrl+Z)" disabled={!history.past.length} onClick={undo}>
            <Undo2 className="size-4" aria-hidden="true" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Redo" title="Redo (Ctrl+Shift+Z)" disabled={!history.future.length} onClick={redo}>
            <Redo2 className="size-4" aria-hidden="true" />
          </Button>
        </div>

        {lockable.length || selectedNotes.length || isWholeGroup || groupable.length >= 2 ? (
          <div
            className="absolute left-1/2 top-3 flex -translate-x-1/2 items-center gap-1.5 rounded-xl bg-card p-1.5 shadow-sm"
            role="toolbar"
            aria-label="Selection"
          >
            {selectedNotes.length
              ? (Object.keys(NOTE_STYLES) as NoteColor[]).map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Make the note ${color}`}
                    className={cn("size-6 rounded-full", NOTE_STYLES[color])}
                    onClick={() => selectedNotes.forEach((n) => saveItem(n.id, { color }))}
                  />
                ))
              : null}
            {lockable.length ? (
              <Button variant="ghost" size="sm" onClick={() => lockable.forEach((n) => saveItem(n.id, { locked: !allLocked }))}>
                {allLocked ? <Unlock className="size-4" aria-hidden="true" /> : <Lock className="size-4" aria-hidden="true" />}
                {allLocked ? "Unlock" : "Lock"}
              </Button>
            ) : null}
            {isWholeGroup ? (
              <Button variant="ghost" size="sm" onClick={ungroup}>
                Ungroup
              </Button>
            ) : groupable.length >= 2 ? (
              <Button variant="ghost" size="sm" onClick={group}>
                Group {groupable.length}
              </Button>
            ) : null}
          </div>
        ) : null}

        <p className="pointer-events-none absolute bottom-3 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-card/80 px-2.5 py-1.5 text-xs text-muted-foreground xl:block">
          Drag to move around · scroll to zoom · Shift-drag to select
        </p>
      </div>
    </ActionsContext.Provider>
  );
}

export function ApplicationCanvas(props: CanvasProps) {
  return (
    <ReactFlowProvider>
      <Canvas {...props} />
    </ReactFlowProvider>
  );
}
