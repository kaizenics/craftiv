import { z } from "zod";
import { and, eq, desc, inArray, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  protectedProcedure,
} from "../init";
import { jobMatches, resumes, users, type ResumeDataJSON } from "@/db/schema";
import type { Database } from "@/db";
import { RESUME_LIMITS, resumeDataSchema } from "@/lib/schemas/resume-data";

function splitTitleBaseAndIndex(title: string): { base: string; index: number | null } {
  const match = title.match(/^(.*?)(?:_(\d+))?$/);
  const rawBase = match?.[1]?.trim() || title.trim();
  const base = rawBase || "Resume";
  const index = match?.[2] ? parseInt(match[2], 10) : null;
  return { base, index: Number.isNaN(index) ? null : index };
}

async function getUniqueResumeTitle(args: {
  db: Database;
  userId: string;
  requestedTitle: string;
  excludeId?: string;
}): Promise<string> {
  const requested = args.requestedTitle.trim() || "Resume_1";

  const existingResumes = await args.db.query.resumes.findMany({
    columns: {
      id: true,
      title: true,
    },
    where: eq(resumes.userId, args.userId),
  });

  const existingTitles = new Set(
    existingResumes
      .filter((r) => (args.excludeId ? r.id !== args.excludeId : true))
      .map((r) => (r.title || "").trim().toLowerCase()),
  );

  if (!existingTitles.has(requested.toLowerCase())) {
    return requested;
  }

  const { base, index } = splitTitleBaseAndIndex(requested);
  let next = index ?? 1;

  while (existingTitles.has(`${base}_${next}`.toLowerCase())) {
    next += 1;
  }

  return `${base}_${next}`;
}

async function assertCanCreateResume(db: Database, userId: string) {
  const user = await db.query.users.findFirst({
    columns: {
      id: true,
      resumeCreatedCount: true,
    },
    where: eq(users.id, userId),
  });

  if (!user) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "User not found",
    });
  }

  return user;
}

const createResumeSchema = z.object({
  title: z.string().min(1, "Title is required").max(RESUME_LIMITS.short),
  templateId: z.string().min(1, "Template is required").max(RESUME_LIMITS.short),
});

const updateResumeSchema = z.object({
  id: z.string(),
  title: z.string().max(RESUME_LIMITS.short).optional(),
  templateId: z.string().max(RESUME_LIMITS.short).optional(),
  data: resumeDataSchema.optional(),
  status: z.enum(["draft", "completed"]).optional(),
  lastEditedSection: z.string().max(RESUME_LIMITS.short).optional(),
});

/**
 * Resume Router
 * Handles all resume CRUD operations
 */
export const resumeRouter = createTRPCRouter({
  /**
   * List all resumes for the current user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const userResumes = await ctx.db.query.resumes.findMany({
      where: and(eq(resumes.userId, ctx.user.id), eq(resumes.origin, "user")),
      orderBy: [desc(resumes.updatedAt)],
    });

    return userResumes;
  }),

  /**
   * Lightweight list for dashboards and selectors.
   * Includes resume data so dashboard thumbnails can render real content.
   */
  listSummary: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.query.resumes.findMany({
      columns: {
        id: true,
        title: true,
        templateId: true,
        data: true,
        status: true,
        lastEditedSection: true,
        createdAt: true,
        updatedAt: true,
      },
      // Job Hunter output is excluded until the user saves it to their
      // documents. ResumeCombobox is fed by this query and so inherits the
      // filter, which is correct: you tailor *from* a real resume.
      where: and(eq(resumes.userId, ctx.user.id), eq(resumes.origin, "user")),
      orderBy: [desc(resumes.updatedAt)],
    });

    // Resumes saved from Job Hunter keep a link to the job they were tailored for.
    const tailoredRows =
      rows.length === 0
        ? []
        : await ctx.db.query.jobMatches.findMany({
            columns: { tailoredResumeId: true },
            where: and(
              eq(jobMatches.userId, ctx.user.id),
              inArray(
                jobMatches.tailoredResumeId,
                rows.map((row) => row.id),
              ),
            ),
            with: { posting: { columns: { company: true, title: true } } },
          });
    const tailoredFor = new Map(
      tailoredRows.map((row) => [
        row.tailoredResumeId,
        row.posting.company || row.posting.title,
      ]),
    );

    return rows.map((row) => ({ ...row, tailoredFor: tailoredFor.get(row.id) ?? null }));
  }),

  /**
   * Get a single resume by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const resume = await ctx.db.query.resumes.findFirst({
        where: and(eq(resumes.id, input.id), eq(resumes.userId, ctx.user.id)),
      });

      if (!resume) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resume not found",
        });
      }

      return resume;
    }),

  /**
   * Create a new resume
   */
  create: protectedProcedure
    .input(createResumeSchema)
    .mutation(async ({ ctx, input }) => {
      await assertCanCreateResume(ctx.db, ctx.user.id);

      const id = crypto.randomUUID();
      const title = await getUniqueResumeTitle({
        db: ctx.db,
        userId: ctx.user.id,
        requestedTitle: input.title,
      });
      
      const emptyData: ResumeDataJSON = {
        contact: {
          firstName: "",
          lastName: "",
          desiredJobTitle: "",
          phone: "",
          email: "",
        },
        experiences: [],
        educations: [],
        skills: [],
        summary: "",
        finalize: {
          languages: [],
          certifications: [],
          awards: [],
          websites: [],
          references: [],
          hobbies: [],
          customSections: [],
        },
      };

      await ctx.db.insert(resumes).values({
        id,
        userId: ctx.user.id,
        title,
        templateId: input.templateId,
        data: emptyData,
        status: "draft",
      });

      await ctx.db
        .update(users)
        .set({
          resumeCreatedCount: sql`coalesce(${users.resumeCreatedCount}, 0) + 1`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id));

      return { id, title };
    }),

  /**
   * Update an existing resume
   */
  update: protectedProcedure
    .input(updateResumeSchema)
    .mutation(async ({ ctx, input }) => {
      // First, verify the resume exists and belongs to user
      const existingResume = await ctx.db.query.resumes.findFirst({
        columns: {
          id: true,
          data: true,
        },
        where: and(eq(resumes.id, input.id), eq(resumes.userId, ctx.user.id)),
      });

      if (!existingResume) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resume not found",
        });
      }

      // Build update object
      const updateData: Partial<typeof resumes.$inferInsert> = {
        updatedAt: new Date(),
      };

      if (input.title !== undefined) {
        updateData.title = await getUniqueResumeTitle({
          db: ctx.db,
          userId: ctx.user.id,
          requestedTitle: input.title,
          excludeId: input.id,
        });
      }
      if (input.templateId !== undefined) updateData.templateId = input.templateId;
      if (input.data !== undefined) {
        // Only the final editor sends the design. Saves from the section wizard
        // don't, and must not wipe the one already stored.
        const design = input.data.design ?? existingResume.data?.design;
        updateData.data = design ? { ...input.data, design } : input.data;
      }
      if (input.status !== undefined) updateData.status = input.status;
      if (input.lastEditedSection !== undefined) {
        updateData.lastEditedSection = input.lastEditedSection;
      }

      await ctx.db
        .update(resumes)
        .set(updateData)
        .where(and(eq(resumes.id, input.id), eq(resumes.userId, ctx.user.id)));

      return { success: true, title: updateData.title ?? input.title };
    }),

  /**
   * Delete a resume
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existingResume = await ctx.db.query.resumes.findFirst({
        columns: {
          id: true,
        },
        where: and(eq(resumes.id, input.id), eq(resumes.userId, ctx.user.id)),
      });

      if (!existingResume) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resume not found",
        });
      }

      await ctx.db
        .delete(resumes)
        .where(and(eq(resumes.id, input.id), eq(resumes.userId, ctx.user.id)));

      return { success: true };
    }),

  /**
   * Duplicate a resume
   */
  duplicate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await assertCanCreateResume(ctx.db, ctx.user.id);

      const existingResume = await ctx.db.query.resumes.findFirst({
        where: and(eq(resumes.id, input.id), eq(resumes.userId, ctx.user.id)),
      });

      if (!existingResume) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resume not found",
        });
      }

      const newId = crypto.randomUUID();

      await ctx.db.insert(resumes).values({
        id: newId,
        userId: ctx.user.id,
        title: `${existingResume.title} (Copy)`,
        templateId: existingResume.templateId,
        data: existingResume.data,
        status: "draft",
      });

      await ctx.db
        .update(users)
        .set({
          resumeCreatedCount: sql`coalesce(${users.resumeCreatedCount}, 0) + 1`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id));

      return { id: newId };
    }),
});
