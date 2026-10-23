import { randomUUID } from "node:crypto";
import { z } from "zod";
import { and, asc, eq, inArray, max } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "../init";
import { applications, boardItems, jobMatches, jobPostings } from "@/db/schema";
import type { Database } from "@/db";
import { InsufficientCreditsError, FOLLOW_UP_EMAIL_COST, newChargeIdempotencyKey, refundCredits } from "@/lib/credits";
import type { AiConnection } from "@/lib/ai";
import { beginAiAction } from "@/lib/own-ai-access";
import { enforceRouteRateLimits } from "@/lib/security/guards";
import { generateFollowUpEmail } from "@/lib/follow-up-email";
import { ensureBoards, getOwnedBoard } from "./board";
import { enforceJobFetchRateLimit, getOwnedResume, importJobForResume, runInterviewPrep } from "./jobHunter";
import { PROMPT_INPUT_LIMITS } from "@/lib/constants/prompt-limits";
import { TRACKER_LIMITS, TRACKER_STATUS_FROM_MATCH, TRACKER_STATUSES, type TrackerStatus } from "@/lib/types/applications";

const text = z.string().trim().max(TRACKER_LIMITS.text);
const fields = z.object({
  company: text.optional(),
  title: text.optional(),
  // Only http(s) links, so a stored link can never become a javascript: URL in an <a>.
  postingUrl: z
    .string()
    .trim()
    .max(TRACKER_LIMITS.url)
    .refine((value) => value === "" || /^https?:\/\//i.test(value), "Links must start with http:// or https://")
    .optional(),
  contact: text.optional(),
  appliedOn: z
    .string()
    .regex(/^(\d{4}-\d{2}-\d{2})?$/, "Use a valid date")
    .optional(),
  interviewStage: text.optional(),
  interviewer: text.optional(),
  notes: z.string().max(TRACKER_LIMITS.notes).optional(),
  salary: text.optional(),
  location: text.optional(),
  customFields: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(TRACKER_LIMITS.customLabel),
        value: z.string().max(TRACKER_LIMITS.customValue),
      }),
    )
    .max(TRACKER_LIMITS.customFields)
    .optional(),
});
const status = z.enum(TRACKER_STATUSES);
const boardId = z.string().min(1).max(200);

/** The tab a new card goes on: the one asked for (if the user owns it), else their first tab. */
async function resolveBoard(db: Database, userId: string, requested?: string) {
  if (requested) return (await getOwnedBoard(db, userId, requested)).id;
  return (await ensureBoards(db, userId))[0].id;
}

/** Puts a card at the bottom of a column. */
async function nextPosition(db: Database, userId: string, inStatus: TrackerStatus) {
  const [row] = await db
    .select({ top: max(applications.position) })
    .from(applications)
    .where(and(eq(applications.userId, userId), eq(applications.status, inStatus)));
  return (row?.top ?? 0) + 1;
}

async function getOwned(db: Database, id: string, userId: string) {
  const row = await db.query.applications.findFirst({
    columns: { id: true, status: true, statusHistory: true },
    where: and(eq(applications.id, id), eq(applications.userId, userId)),
  });
  if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "That application was not found." });
  return row;
}

export const applicationsRouter = createTRPCRouter({
  /** One tab's cards, or every card when no tab is given. Cards from before tabs existed (no tab) show on the first one. */
  list: protectedProcedure.input(z.object({ boardId: boardId.optional() }).optional()).query(async ({ ctx, input }) => {
    const rows = await ctx.db.query.applications.findMany({
      where: eq(applications.userId, ctx.user.id),
      orderBy: [asc(applications.position), asc(applications.createdAt)],
    });
    if (!input?.boardId) return rows;
    const first = (await ensureBoards(ctx.db, ctx.user.id))[0].id;
    return rows.filter((row) => (row.boardId ?? first) === input.boardId);
  }),

  create: protectedProcedure.input(fields.extend({ status: status.default("saved"), boardId: boardId.optional() })).mutation(async ({ ctx, input }) => {
    const id = randomUUID();
    const onBoard = await resolveBoard(ctx.db, ctx.user.id, input.boardId);
    const position = await nextPosition(ctx.db, ctx.user.id, input.status);
    await ctx.db
      .insert(applications)
      .values({ ...input, boardId: onBoard, id, userId: ctx.user.id, position, statusHistory: [{ status: input.status, at: Date.now() }] });
    return { id };
  }),

  update: protectedProcedure.input(fields.extend({ id: z.string().min(1), boardId: boardId.optional() })).mutation(async ({ ctx, input }) => {
    const { id, boardId: toBoard, ...changes } = input;
    await getOwned(ctx.db, id, ctx.user.id);
    // Moving to another tab: the card restacks in that tab's frame for its status.
    const tabMove = toBoard ? { boardId: await resolveBoard(ctx.db, ctx.user.id, toBoard), canvasX: null, canvasY: null } : {};
    await ctx.db
      .update(applications)
      .set({ ...changes, ...tabMove, updatedAt: new Date() })
      .where(and(eq(applications.id, id), eq(applications.userId, ctx.user.id)));
    return { ok: true };
  }),

  /** Moves a card to a column, at `position` (the board sends a value between its new neighbours) or at the bottom. */
  move: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        status,
        position: z.number().optional(),
        // Canvas drop point. Without it a status change clears the old spot, so the card restacks in its new frame.
        // null puts the card back into its frame's stack.
        canvasX: z.number().min(-100_000).max(100_000).nullable().optional(),
        canvasY: z.number().min(-100_000).max(100_000).nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const card = await getOwned(ctx.db, input.id, ctx.user.id);
      const position = input.position ?? (await nextPosition(ctx.db, ctx.user.id, input.status));
      // Reordering inside a column is not a stage change, so it adds no history.
      const statusHistory =
        card.status === input.status ? card.statusHistory : [...card.statusHistory, { status: input.status, at: Date.now() }];
      await ctx.db
        .update(applications)
        .set({
          status: input.status,
          position,
          statusHistory,
          updatedAt: new Date(),
          ...(input.canvasX !== undefined && input.canvasY !== undefined
            ? { canvasX: input.canvasX, canvasY: input.canvasY }
            : card.status !== input.status
              ? { canvasX: null, canvasY: null }
              : {}),
        })
        .where(and(eq(applications.id, input.id), eq(applications.userId, ctx.user.id)));
      return { ok: true };
    }),

  remove: protectedProcedure.input(z.object({ id: z.string().min(1) })).mutation(async ({ ctx, input }) => {
    await getOwned(ctx.db, input.id, ctx.user.id);
    await ctx.db.delete(applications).where(and(eq(applications.id, input.id), eq(applications.userId, ctx.user.id)));
    // Arrows drawn to the card would point at nothing.
    const edges = await ctx.db.query.boardItems.findMany({ where: and(eq(boardItems.userId, ctx.user.id), eq(boardItems.kind, "edge")) });
    const dangling = edges.filter((edge) => edge.data.source === input.id || edge.data.target === input.id).map((edge) => edge.id);
    if (dangling.length) await ctx.db.delete(boardItems).where(and(eq(boardItems.userId, ctx.user.id), inArray(boardItems.id, dangling)));
    return { ok: true };
  }),

  /** Copies a Job Hunter match into the tracker; a second call returns the existing card. */
  trackMatch: protectedProcedure.input(z.object({ matchId: z.string().min(1), boardId: boardId.optional() })).mutation(async ({ ctx, input }) => {
    const match = await ctx.db.query.jobMatches.findFirst({
      columns: { id: true, jobPostingId: true, applicationStatus: true, appliedAt: true },
      where: and(eq(jobMatches.id, input.matchId), eq(jobMatches.userId, ctx.user.id)),
    });
    if (!match) throw new TRPCError({ code: "NOT_FOUND", message: "That job was not found." });

    const existing = await ctx.db.query.applications.findFirst({
      columns: { id: true },
      where: and(eq(applications.userId, ctx.user.id), eq(applications.matchId, match.id)),
    });
    if (existing) return { id: existing.id, created: false };

    const posting = await ctx.db.query.jobPostings.findFirst({
      columns: { title: true, company: true, applyUrl: true, url: true },
      where: and(eq(jobPostings.id, match.jobPostingId), eq(jobPostings.userId, ctx.user.id)),
    });
    const inStatus = TRACKER_STATUS_FROM_MATCH[match.applicationStatus];
    const link = posting?.applyUrl || posting?.url || "";
    const id = randomUUID();
    await ctx.db.insert(applications).values({
      id,
      userId: ctx.user.id,
      status: inStatus,
      position: await nextPosition(ctx.db, ctx.user.id, inStatus),
      company: (posting?.company ?? "").slice(0, TRACKER_LIMITS.text),
      title: (posting?.title ?? "").slice(0, TRACKER_LIMITS.text),
      postingUrl: /^https?:\/\//i.test(link) ? link.slice(0, TRACKER_LIMITS.url) : "",
      appliedOn: match.appliedAt ? match.appliedAt.toISOString().slice(0, 10) : "",
      matchId: match.id,
      boardId: await resolveBoard(ctx.db, ctx.user.id, input.boardId),
      statusHistory: [{ status: inStatus, at: Date.now() }],
    });
    return { id, created: true };
  }),

  /**
   * "Prep for this interview" on a card. A card tracked from Job Hunter already has its job and resume; a card typed
   * in by hand first becomes a match from the pasted job description. The prep then uses the card's stage and interviewer.
   */
  prepareInterview: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        resumeId: z.string().min(1).optional(),
        description: z.string().trim().max(PROMPT_INPUT_LIMITS.jobDescription).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await enforceJobFetchRateLimit(ctx, "prepareInterview");
      const card = await ctx.db.query.applications.findFirst({
        where: and(eq(applications.id, input.id), eq(applications.userId, ctx.user.id)),
      });
      if (!card) throw new TRPCError({ code: "NOT_FOUND", message: "That application was not found." });
      let matchId = card.matchId;
      if (!matchId) {
        if (!input.resumeId) throw new TRPCError({ code: "BAD_REQUEST", message: "Pick the resume you applied with." });
        if (!input.description || input.description.length < 80) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Paste the job description (a few lines at least) so the questions fit the role." });
        }
        const resume = await getOwnedResume(ctx.db, input.resumeId, ctx.user.id);
        const imported = await importJobForResume(ctx.db, ctx.user.id, resume, {
          resumeId: input.resumeId,
          description: input.description,
          title: card.title.slice(0, PROMPT_INPUT_LIMITS.targetRole),
          company: card.company.slice(0, PROMPT_INPUT_LIMITS.name),
          location: card.location.slice(0, PROMPT_INPUT_LIMITS.name),
          url: card.postingUrl || undefined,
        });
        matchId = imported.matchId;
        // Linked now, so a retry after a failed prep reuses the same job instead of importing it again.
        await ctx.db.update(applications).set({ matchId }).where(and(eq(applications.id, card.id), eq(applications.userId, ctx.user.id)));
      }
      return runInterviewPrep(ctx.db, ctx.user.id, matchId, { stage: card.interviewStage, interviewer: card.interviewer });
    }),

  /** Writes a follow-up email for a card with no reply. Charged up front and refunded if the model fails; the draft is saved. */
  followUpEmail: protectedProcedure.input(z.object({ id: z.string().min(1) })).mutation(async ({ ctx, input }) => {
    const limit = await enforceRouteRateLimits({
      category: "ai_heavy",
      route: "/api/trpc/applications.followUpEmail",
      requestHeaders: ctx.requestHeaders,
      userId: ctx.user.id,
    });
    if (!limit.allowed) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: `Rate limit exceeded. Retry after ${limit.retryAfterSeconds} second(s).` });
    }
    const card = await ctx.db.query.applications.findFirst({
      where: and(eq(applications.id, input.id), eq(applications.userId, ctx.user.id)),
    });
    if (!card) throw new TRPCError({ code: "NOT_FOUND", message: "That application was not found." });
    if (!card.company.trim() && !card.title.trim()) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Add the company or job title first." });
    }

    const idempotencyKey = newChargeIdempotencyKey("follow_up_email", ctx.user.id);
    let ai: AiConnection;
    let charged: boolean;
    try {
      const started = await beginAiAction({
        userId: ctx.user.id,
        eventType: "follow_up_email",
        costUnits: FOLLOW_UP_EMAIL_COST,
        idempotencyKey,
        metadata: { applicationId: card.id },
      });
      ai = started.ai;
      charged = started.charge !== null;
    } catch (error) {
      if (error instanceof InsufficientCreditsError) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not have enough credits for this action." });
      }
      throw error;
    }

    try {
      const email = await generateFollowUpEmail({
        company: card.company,
        title: card.title,
        contact: card.contact,
        appliedOn: card.appliedOn,
        status: card.status,
        notes: card.notes,
        ai,
      });
      const followUpEmail = `Subject: ${email.subject}

${email.body}`;
      await ctx.db
        .update(applications)
        .set({ followUpEmail, updatedAt: new Date() })
        .where(and(eq(applications.id, card.id), eq(applications.userId, ctx.user.id)));
      return { followUpEmail };
    } catch {
      if (charged) {
        await refundCredits({
          userId: ctx.user.id,
          eventType: "follow_up_email_refund",
          refundUnits: FOLLOW_UP_EMAIL_COST,
          idempotencyKey: `refund:${idempotencyKey}`,
          metadata: { reason: "ai_failure", applicationId: card.id },
        });
      }
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not write the email. Your credits were refunded." });
    }
  }),
});
