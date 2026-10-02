import { z } from "zod";
import { and, desc, eq, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "../init";
import {
  RESUME_SNAPSHOT_KINDS,
  resumeSnapshots,
  resumes,
  type ResumeSnapshotKind,
} from "@/db/schema";
import type { Database } from "@/db";
import { RESUME_LIMITS, resumeDataSchema } from "@/lib/schemas/resume-data";

/** Older snapshots beyond this are pruned whenever a new one is written. */
export const MAX_SNAPSHOTS_PER_RESUME = 50;

/** Old browser-only snapshots uploaded once by the editor. */
const MAX_IMPORTED_LOCAL_SNAPSHOTS = 20;

type DbOrTx = Database | Parameters<Parameters<Database["transaction"]>[0]>[0];

async function getOwnedResume(db: DbOrTx, resumeId: string, userId: string) {
  const resume = await db.query.resumes.findFirst({
    columns: { id: true, title: true, templateId: true, data: true },
    where: and(eq(resumes.id, resumeId), eq(resumes.userId, userId)),
  });
  if (!resume) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Resume not found" });
  }
  return resume;
}

async function insertSnapshotOfCurrent(
  db: DbOrTx,
  params: {
    resume: Awaited<ReturnType<typeof getOwnedResume>>;
    userId: string;
    kind: ResumeSnapshotKind;
  },
) {
  const { resume } = params;
  if (!resume.data) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "This resume has no content to save yet." });
  }
  const id = crypto.randomUUID();
  await db.insert(resumeSnapshots).values({
    id,
    resumeId: resume.id,
    userId: params.userId,
    kind: params.kind,
    name: resume.title,
    data: { ...resume.data, templateId: resume.data.templateId ?? resume.templateId },
    createdAt: new Date(),
  });
  return id;
}

async function pruneSnapshots(db: DbOrTx, resumeId: string) {
  const stale = await db
    .select({ id: resumeSnapshots.id })
    .from(resumeSnapshots)
    .where(eq(resumeSnapshots.resumeId, resumeId))
    .orderBy(desc(resumeSnapshots.createdAt))
    .offset(MAX_SNAPSHOTS_PER_RESUME)
    .limit(1000);
  if (stale.length === 0) return;
  await db.delete(resumeSnapshots).where(
    inArray(
      resumeSnapshots.id,
      stale.map((row) => row.id),
    ),
  );
}

/**
 * Server-side version history for resumes. Snapshots copy the resume as it is
 * stored, never data sent by the client, so a snapshot is always something the
 * user actually saved.
 */
export const resumeSnapshotRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ resumeId: z.string() }))
    .query(async ({ ctx, input }) => {
      await getOwnedResume(ctx.db, input.resumeId, ctx.user.id);
      return ctx.db.query.resumeSnapshots.findMany({
        where: eq(resumeSnapshots.resumeId, input.resumeId),
        orderBy: [desc(resumeSnapshots.createdAt)],
        limit: MAX_SNAPSHOTS_PER_RESUME,
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        resumeId: z.string(),
        kind: z.enum(RESUME_SNAPSHOT_KINDS).exclude(["before_restore"]).default("manual"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const resume = await getOwnedResume(ctx.db, input.resumeId, ctx.user.id);
      const id = await insertSnapshotOfCurrent(ctx.db, {
        resume,
        userId: ctx.user.id,
        kind: input.kind,
      });
      await pruneSnapshots(ctx.db, resume.id);
      return { id };
    }),

  restore: protectedProcedure
    .input(z.object({ snapshotId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.transaction(async (tx) => {
        const snapshot = await tx.query.resumeSnapshots.findFirst({
          where: and(
            eq(resumeSnapshots.id, input.snapshotId),
            eq(resumeSnapshots.userId, ctx.user.id),
          ),
        });
        if (!snapshot) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Snapshot not found" });
        }

        // Keep what's there now, so a restore can itself be undone.
        const current = await getOwnedResume(tx, snapshot.resumeId, ctx.user.id);
        if (current.data) {
          await insertSnapshotOfCurrent(tx, {
            resume: current,
            userId: ctx.user.id,
            kind: "before_restore",
          });
        }

        const templateId = snapshot.data.templateId ?? current.templateId;
        await tx
          .update(resumes)
          .set({ data: snapshot.data, templateId, updatedAt: new Date() })
          .where(and(eq(resumes.id, snapshot.resumeId), eq(resumes.userId, ctx.user.id)));

        await pruneSnapshots(tx, snapshot.resumeId);
        return { resumeId: snapshot.resumeId, data: snapshot.data, templateId };
      });
    }),

  delete: protectedProcedure
    .input(z.object({ snapshotId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(resumeSnapshots)
        .where(
          and(eq(resumeSnapshots.id, input.snapshotId), eq(resumeSnapshots.userId, ctx.user.id)),
        );
      return { success: true };
    }),

  /**
   * One-time upload of snapshots that older versions of the editor kept in
   * localStorage. Validated like any resume save.
   */
  importLocal: protectedProcedure
    .input(
      z.object({
        resumeId: z.string(),
        snapshots: z
          .array(
            z.object({
              name: z.string().max(RESUME_LIMITS.short),
              createdAt: z.string().datetime(),
              data: resumeDataSchema,
            }),
          )
          .max(MAX_IMPORTED_LOCAL_SNAPSHOTS),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await getOwnedResume(ctx.db, input.resumeId, ctx.user.id);
      if (input.snapshots.length === 0) return { imported: 0 };

      await ctx.db.insert(resumeSnapshots).values(
        input.snapshots.map((snapshot) => ({
          id: crypto.randomUUID(),
          resumeId: input.resumeId,
          userId: ctx.user.id,
          kind: "manual" as const,
          name: snapshot.name || "Resume",
          data: snapshot.data,
          createdAt: new Date(snapshot.createdAt),
        })),
      );
      await pruneSnapshots(ctx.db, input.resumeId);
      return { imported: input.snapshots.length };
    }),
});
