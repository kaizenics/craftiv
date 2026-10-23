import { TRACKER_STATUSES, type TrackerStatus } from "@/lib/types/applications";

export const BOARD_ITEM_KINDS = ["frame", "note", "text", "edge", "group"] as const;
export type BoardItemKind = (typeof BOARD_ITEM_KINDS)[number];

export const NOTE_COLORS = ["yellow", "pink", "blue", "green", "purple"] as const;
export type NoteColor = (typeof NOTE_COLORS)[number];

/**
 * Everything on the canvas that is not an application card. Frames with a `status` are the
 * board's columns: a card dropped inside one takes that status and is stacked in it. Edges join two
 * node ids; groups list node ids that move together.
 */
export type BoardItemData = {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  text?: string;
  color?: NoteColor;
  status?: TrackerStatus;
  source?: string;
  target?: string;
  sourceHandle?: HandleSide;
  targetHandle?: HandleSide;
  // Groups: the node ids that select and move together.
  members?: string[];
};

export const HANDLE_SIDES = ["top", "right", "bottom", "left"] as const;
export type HandleSide = (typeof HANDLE_SIDES)[number];

export const BOARD_LIMITS = { items: 300, text: 2000, size: 4000, coord: 100_000 } as const;

export const CARD_WIDTH = 260;
export const CARD_GAP = 10;
export const FRAME_HEADER = 56;
export const FRAME_PAD = 16;
export const FRAME_DEFAULT = { w: 292, h: 640, gap: 40 } as const;

/** The status frames a new board starts with: the Pipeline template. */
export const defaultStatusFrames = (): BoardItemData[] =>
  TRACKER_STATUSES.map((status) => ({ status, ...BOARD_TEMPLATES[0].frames[status] }));

type Box = { x: number; y: number; w: number; h: number };
const toBox = (d: BoardItemData): Box => ({ x: d.x ?? 0, y: d.y ?? 0, w: d.w ?? FRAME_DEFAULT.w, h: d.h ?? FRAME_DEFAULT.h });

/** The status frame under a point (a dropped card's centre); the smallest wins when frames overlap. */
export function statusFrameAt(point: { x: number; y: number }, frames: BoardItemData[]): TrackerStatus | null {
  const hits = frames
    .filter((f) => f.status)
    .map((f) => ({ status: f.status!, box: toBox(f) }))
    .filter(({ box }) => point.x >= box.x && point.x <= box.x + box.w && point.y >= box.y && point.y <= box.y + box.h)
    .sort((a, b) => a.box.w * a.box.h - b.box.w * b.box.h);
  return hits[0]?.status ?? null;
}

/** Where an unplaced card sits: down its frame under the header, `offset` px below the cards stacked before it. */
export function autoPlace(frame: BoardItemData | undefined, offset: number) {
  const box = frame ? toBox(frame) : { x: 0, y: 0, w: FRAME_DEFAULT.w, h: FRAME_DEFAULT.h };
  return { x: box.x + FRAME_PAD, y: box.y + FRAME_HEADER + offset };
}

/** Sort key between two neighbours in a frame's stack, so a drop only rewrites the moved card. */
export function positionBetween(before?: number, after?: number) {
  if (before === undefined) return after === undefined ? 1 : after - 1;
  return after === undefined ? before + 1 : (before + after) / 2;
}

type FrameBox = { x: number; y: number; w: number; h: number };
type TemplateExtra = { kind: "frame" | "note" | "text"; data: BoardItemData };
export type BoardTemplate = {
  id: string;
  name: string;
  description: string;
  frames: Record<TrackerStatus, FrameBox>;
  extras: TemplateExtra[];
};

const ACTIVE: TrackerStatus[] = ["saved", "applied", "screening", "interview", "offer"];
const CLOSED: TrackerStatus[] = ["rejected", "ghosted", "dropped"];
const STEP = FRAME_DEFAULT.w + FRAME_DEFAULT.gap;
const row = (statuses: readonly TrackerStatus[], y: number, h: number = FRAME_DEFAULT.h, x0 = 0) =>
  Object.fromEntries(statuses.map((status, i) => [status, { x: x0 + i * STEP, y, w: FRAME_DEFAULT.w, h }])) as Record<TrackerStatus, FrameBox>;
const label = (text: string, x: number, y: number): TemplateExtra => ({ kind: "text", data: { text, x, y: y - 64, w: 320, h: 48 } });
const frame = (text: string, x: number, y: number, w: number, h: number): TemplateExtra => ({ kind: "frame", data: { text, x, y, w, h } });
// Notes sit under a frame's header, in a row.
const notes = (frameX: number, frameY: number, color: NoteColor, texts: string[]): TemplateExtra[] =>
  texts.map((text, i) => ({ kind: "note", data: { text, color, x: frameX + FRAME_PAD + i * 216, y: frameY + FRAME_HEADER + 8, w: 200, h: 160 } }));

const BELOW = FRAME_DEFAULT.h + 120;
const WIDE = 2 * FRAME_DEFAULT.w + FRAME_DEFAULT.gap;
const FULL_ROW = TRACKER_STATUSES.length * STEP - FRAME_DEFAULT.gap;
const THIRD = (FULL_ROW - 2 * FRAME_DEFAULT.gap) / 3;

/** One-click board layouts. Applying one moves the status frames and adds the extras; it never deletes anything. */
export const BOARD_TEMPLATES: BoardTemplate[] = [
  {
    id: "pipeline",
    name: "Pipeline",
    description: "Every stage in one row, from saved to dropped. The classic layout.",
    frames: row(TRACKER_STATUSES, 0),
    extras: [],
  },
  {
    id: "active-closed",
    name: "Active & closed",
    description: "Live stages up top, finished ones in a smaller row below, so they stay out of the way.",
    frames: { ...row(ACTIVE, 0), ...row(CLOSED, BELOW, 360) },
    extras: [label("Still in play", 0, 0), label("Closed", 0, BELOW)],
  },
  {
    id: "weekly-plan",
    name: "Weekly plan",
    description: "Your pipeline plus a planning area for this week's goals, follow-ups and dream companies.",
    frames: { ...row(ACTIVE, 0), ...row(CLOSED, 0, 300, ACTIVE.length * STEP) },
    extras: [
      frame("This week", 0, BELOW, WIDE + STEP, 300),
      ...notes(0, BELOW, "yellow", ["Apply to 5 roles that score 70+", "Tailor my resume for the top 2", "Practise one interview answer a day"]),
      frame("Follow-ups", 3 * STEP, BELOW, FRAME_DEFAULT.w, 300),
      ...notes(3 * STEP, BELOW, "pink", ["Nudge anyone quiet for 7+ days"]),
      frame("Dream companies", 4 * STEP, BELOW, WIDE + STEP, 300),
      ...notes(4 * STEP, BELOW, "green", ["Company you would love to join", "Who you know there", "A role to watch for"]),
    ],
  },
  {
    id: "interview-prep",
    name: "Interview prep",
    description: "The full pipeline plus space to prepare questions, your best stories and what to ask them.",
    frames: row(TRACKER_STATUSES, 0),
    extras: [
      frame("Questions to prepare", 0, BELOW, THIRD, 300),
      ...notes(0, BELOW, "blue", ["Tell me about yourself", "Why this company?", "A time you solved a hard problem"]),
      frame("My STAR stories", THIRD + FRAME_DEFAULT.gap, BELOW, THIRD, 300),
      ...notes(THIRD + FRAME_DEFAULT.gap, BELOW, "purple", ["Situation, task, action, result", "Biggest win, with a number", "A mistake and what I learned"]),
      frame("Questions to ask them", 2 * (THIRD + FRAME_DEFAULT.gap), BELOW, THIRD, 300),
      ...notes(2 * (THIRD + FRAME_DEFAULT.gap), BELOW, "green", ["What does success look like in 90 days?", "How is the team structured?", "What are the next steps?"]),
    ],
  },
];
