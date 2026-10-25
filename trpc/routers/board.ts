import { randomUUID } from "node:crypto";
import { z } from "zod";
import { and, asc, count, eq, inArray, max } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "../init";
import { applications, boardItems, boards } from "@/db/schema";
import type { Database } from "@/db";
import { TRACKER_STATUSES } from "@/lib/types/applications";
import { BOARD_ITEM_KINDS, BOARD_LIMITS, BOARD_TEMPLATES, HANDLE_SIDES, NOTE_COLORS, defaultStatusFrames, type BoardItemData } from "@/lib/types/board";

const coord = z.number().min(-BOARD_LIMITS.coord).max(BOARD_LIMITS.coord);
const size = z.number().min(40).max(BOARD_LIMITS.size);
const data = z.object({
  x: coord.optional(),
  y: coord.optional(),
  w: size.optional(),
  h: size.optional(),
  text: z.string().max(BOARD_LIMITS.text).optional(),
  color: z.enum(NOTE_COLORS).optional(),
  source: z.string().min(1).max(200).optional(),
  target: z.string().min(1).max(200).optional(),
  sourceHandle: z.enum(HANDLE_SIDES).optional(),
  targetHandle: z.enum(HANDLE_SIDES).optional(),
  members: z.array(z.string().min(1).max(200)).min(2).max(100).optional(),
  locked: z.boolean().optional(),
});
const position = z.object({ id: z.string().min(1), x: coord, y: coord });

// Deterministic ids, so two first loads racing each other cannot create the same row twice.
const statusFrameId = (boardId: string, status: string) => `${boardId}:frame:${status}`;
const boardId = z.string().min(1).max(200);
const boardName = z.string().trim().min(1).max(60);

/** The user's tabs, creating "My board" the first time. */
export async function ensureBoards(db: Database, userId: string) {
  const rows = await db.query.boards.findMany({ where: eq(boards.userId, userId), orderBy: [asc(boards.position), asc(boards.createdAt)] });
  if (rows.length) return rows;
  await db.insert(boards).values({ id: `${userId}:main`, userId, name: "My board" }).onConflictDoNothing();
  return db.query.boards.findMany({ where: eq(boards.userId, userId) });
}

/** A tab the user owns; throws otherwise, so no call can reach someone else's board. */
export async function getOwnedBoard(db: Database, userId: string, id: string) {
  const row = await db.query.boards.findFirst({ where: and(eq(boards.id, id), eq(boards.userId, userId)) });
  if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "That board was not found." });
  return row;
}

const onBoard = (userId: string, id: string) => and(eq(boardItems.userId, userId), eq(boardItems.boardId, id));
async function itemCount(db: Database, userId: string, id: string) {
  const [{ total }] = await db.select({ total: count() }).from(boardItems).where(onBoard(userId, id));
  return total;
}

export const boardRouter = createTRPCRouter({
  /** The tabs, in order. */
  boards: protectedProcedure.query(({ ctx }) => ensureBoards(ctx.db, ctx.user.id)),

  createBoard: protectedProcedure.input(z.object({ name: boardName })).mutation(async ({ ctx, input }) => {
    const existing = await ensureBoards(ctx.db, ctx.user.id);
    if (existing.length >= 20) throw new TRPCError({ code: "BAD_REQUEST", message: "You can have up to 20 boards." });
    const [{ top }] = await ctx.db.select({ top: max(boards.position) }).from(boards).where(eq(boards.userId, ctx.user.id));
    const id = randomUUID();
    await ctx.db.insert(boards).values({ id, userId: ctx.user.id, name: input.name, position: (top ?? 0) + 1 });
    return { id };
  }),

  renameBoard: protectedProcedure.input(z.object({ boardId, name: boardName })).mutation(async ({ ctx, input }) => {
    await getOwnedBoard(ctx.db, ctx.user.id, input.boardId);
    await ctx.db.update(boards).set({ name: input.name }).where(and(eq(boards.id, input.boardId), eq(boards.userId, ctx.user.id)));
    return { ok: true };
  }),

  /** Deletes a tab and its frames and notes. Its cards are not deleted: they move to the first remaining tab. */
  deleteBoard: protectedProcedure.input(z.object({ boardId })).mutation(async ({ ctx, input }) => {
    await getOwnedBoard(ctx.db, ctx.user.id, input.boardId);
    const others = (await ensureBoards(ctx.db, ctx.user.id)).filter((b) => b.id !== input.boardId);
    if (!others.length) throw new TRPCError({ code: "BAD_REQUEST", message: "You need at least one board." });
    await ctx.db
      .update(applications)
      .set({ boardId: others[0].id, canvasX: null, canvasY: null })
      .where(and(eq(applications.userId, ctx.user.id), eq(applications.boardId, input.boardId)));
    await ctx.db.delete(boards).where(and(eq(boards.id, input.boardId), eq(boards.userId, ctx.user.id)));
    return { movedTo: others[0].id };
  }),

  /** One tab's canvas items; the first call lays out its eight status frames. */
  list: protectedProcedure.input(z.object({ boardId })).query(async ({ ctx, input }) => {
    await getOwnedBoard(ctx.db, ctx.user.id, input.boardId);
    const rows = await ctx.db.query.boardItems.findMany({ where: onBoard(ctx.user.id, input.boardId) });
    if (rows.some((row) => row.kind === "frame" && row.data.status)) return rows;
    const frames = defaultStatusFrames().map((frame) => ({
      id: statusFrameId(input.boardId, frame.status!),
      userId: ctx.user.id,
      boardId: input.boardId,
      kind: "frame" as const,
      data: frame,
    }));
    await ctx.db.insert(boardItems).values(frames).onConflictDoNothing();
    return ctx.db.query.boardItems.findMany({ where: onBoard(ctx.user.id, input.boardId) });
  }),

  /** Creates a frame, note, text label or arrow, or updates one the user owns. */
  save: protectedProcedure
    .input(z.object({ id: z.string().min(1).max(200).optional(), boardId, kind: z.enum(BOARD_ITEM_KINDS), data }))
    .mutation(async ({ ctx, input }) => {
      if (input.id) {
        const existing = await ctx.db.query.boardItems.findFirst({
          where: and(eq(boardItems.id, input.id), eq(boardItems.userId, ctx.user.id)),
        });
        if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "That item was not found." });
        // A status frame keeps its status: it is what makes the frame a column.
        const merged: BoardItemData = { ...existing.data, ...input.data, status: existing.data.status };
        await ctx.db
          .update(boardItems)
          .set({ data: merged, updatedAt: new Date() })
          .where(and(eq(boardItems.id, input.id), eq(boardItems.userId, ctx.user.id)));
        return { id: input.id };
      }
      await getOwnedBoard(ctx.db, ctx.user.id, input.boardId);
      if ((await itemCount(ctx.db, ctx.user.id, input.boardId)) >= BOARD_LIMITS.items) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `A board holds up to ${BOARD_LIMITS.items} items. Delete a few first.` });
      }
      if (input.kind === "edge" && (!input.data.source || !input.data.target)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "An arrow needs two ends." });
      }
      if (input.kind === "group" && !input.data.members) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "A group needs at least two items." });
      }
      const id = randomUUID();
      // New frames are always custom: the status frames are created once, by list.
      await ctx.db.insert(boardItems).values({ id, userId: ctx.user.id, boardId: input.boardId, kind: input.kind, data: input.data });
      return { id };
    }),

  /** Lays the board out from a template: status frames move into place and the template's frames and notes are added. Nothing is deleted. */
  applyTemplate: protectedProcedure
    .input(z.object({ boardId, templateId: z.enum(BOARD_TEMPLATES.map((t) => t.id) as [string, ...string[]]) }))
    .mutation(async ({ ctx, input }) => {
      await getOwnedBoard(ctx.db, ctx.user.id, input.boardId);
      const template = BOARD_TEMPLATES.find((t) => t.id === input.templateId)!;
      if ((await itemCount(ctx.db, ctx.user.id, input.boardId)) + template.extras.length > BOARD_LIMITS.items) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `A board holds up to ${BOARD_LIMITS.items} items. Delete a few first.` });
      }
      const existing = await ctx.db.query.boardItems.findMany({ where: onBoard(ctx.user.id, input.boardId) });
      for (const status of TRACKER_STATUSES) {
        const data = { status, ...template.frames[status] };
        // Matched by status, not id: frames from before tabs existed have older ids.
        const frame = existing.find((row) => row.kind === "frame" && row.data.status === status);
        if (frame) {
          await ctx.db
            .update(boardItems)
            .set({ data, updatedAt: new Date() })
            .where(and(eq(boardItems.id, frame.id), eq(boardItems.userId, ctx.user.id)));
        } else {
          await ctx.db
            .insert(boardItems)
            .values({ id: statusFrameId(input.boardId, status), userId: ctx.user.id, boardId: input.boardId, kind: "frame", data })
            .onConflictDoNothing();
        }
      }
      if (template.extras.length) {
        // Nothing is deleted, so a second template's extras go below whatever earlier ones left behind instead of on top of them.
        const loose = existing.filter((row) => row.kind !== "edge" && row.kind !== "group" && !row.data.status);
        const bottom = Math.max(...loose.map((row) => (row.data.y ?? 0) + (row.data.h ?? 0)), -Infinity);
        const top = Math.min(...template.extras.map((extra) => extra.data.y ?? 0));
        const shift = Math.max(0, bottom + 120 - top);
        await ctx.db.insert(boardItems).values(
          template.extras.map((extra) => ({
            id: randomUUID(),
            userId: ctx.user.id,
            boardId: input.boardId,
            kind: extra.kind,
            data: { ...extra.data, y: (extra.data.y ?? 0) + shift },
          })),
        );
      }
      return { ok: true };
    }),

  /**
   * Undo and redo: puts one tab back exactly as a snapshot had it. Its canvas items are replaced by the
   * snapshot's, and its cards get their snapshot status, order and spot back. Everything is scoped to the
   * user's own tab, and runs in one transaction so a half-restored board is impossible.
   */
  restore: protectedProcedure
    .input(
      z.object({
        boardId,
        items: z
          .array(z.object({ id: z.string().min(1).max(200), kind: z.enum(BOARD_ITEM_KINDS), data: data.extend({ status: z.enum(TRACKER_STATUSES).optional() }) }))
          .max(BOARD_LIMITS.items),
        cards: z
          .array(
            z.object({
              id: z.string().min(1),
              status: z.enum(TRACKER_STATUSES),
              position: z.number(),
              canvasX: coord.nullable(),
              canvasY: coord.nullable(),
            }),
          )
          .max(500),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await getOwnedBoard(ctx.db, ctx.user.id, input.boardId);
      await ctx.db.transaction(async (tx) => {
        await tx.delete(boardItems).where(onBoard(ctx.user.id, input.boardId));
        if (input.items.length) {
          await tx
            .insert(boardItems)
            .values(input.items.map((item) => ({ id: item.id, userId: ctx.user.id, boardId: input.boardId, kind: item.kind, data: item.data })))
            // An id still held by another tab (it cannot be this one's: they were just deleted) is skipped, never stolen.
            .onConflictDoNothing();
        }
        for (const card of input.cards) {
          await tx
            .update(applications)
            .set({ status: card.status, position: card.position, canvasX: card.canvasX, canvasY: card.canvasY })
            .where(and(eq(applications.id, card.id), eq(applications.userId, ctx.user.id), eq(applications.boardId, input.boardId)));
        }
      });
      return { ok: true };
    }),

  /** Saves where things landed after a drag; a frame drag moves the cards inside it too. */
  savePositions: protectedProcedure
    .input(z.object({ items: z.array(position).max(BOARD_LIMITS.items), cards: z.array(position).max(500) }))
    .mutation(async ({ ctx, input }) => {
      const owned = input.items.length
        ? await ctx.db.query.boardItems.findMany({
            where: and(eq(boardItems.userId, ctx.user.id), inArray(boardItems.id, input.items.map((item) => item.id))),
          })
        : [];
      for (const row of owned) {
        const next = input.items.find((item) => item.id === row.id)!;
        await ctx.db
          .update(boardItems)
          .set({ data: { ...row.data, x: next.x, y: next.y }, updatedAt: new Date() })
          .where(and(eq(boardItems.id, row.id), eq(boardItems.userId, ctx.user.id)));
      }
      for (const card of input.cards) {
        await ctx.db
          .update(applications)
          .set({ canvasX: card.x, canvasY: card.y })
          .where(and(eq(applications.id, card.id), eq(applications.userId, ctx.user.id)));
      }
      return { ok: true };
    }),

  /** Deletes notes, text, custom frames and arrows. Status frames are skipped; arrows to a deleted item go with it. */
  remove: protectedProcedure.input(z.object({ ids: z.array(z.string().min(1)).min(1).max(BOARD_LIMITS.items) })).mutation(async ({ ctx, input }) => {
    const rows = await ctx.db.query.boardItems.findMany({ where: eq(boardItems.userId, ctx.user.id) });
    const removable = new Set(input.ids.filter((id) => rows.some((row) => row.id === id && !(row.kind === "frame" && row.data.status))));
    const gone = new Set([...removable, ...input.ids]);
    for (const row of rows) {
      if (row.kind === "edge" && (gone.has(row.data.source ?? "") || gone.has(row.data.target ?? ""))) removable.add(row.id);
    }
    if (removable.size) {
      await ctx.db.delete(boardItems).where(and(eq(boardItems.userId, ctx.user.id), inArray(boardItems.id, [...removable])));
    }
    return { removed: [...removable] };
  }),
});
