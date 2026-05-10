import { z } from "zod";
import { and, eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import {
  createTRPCRouter,
  protectedProcedure,
} from "../init";
import { resumes, users, type ResumeDataJSON } from "@/db/schema";

function splitTitleBaseAndIndex(title: string): { base: string; index: number | null } {
  const match = title.match(/^(.*?)(?:_(\d+))?$/);
  const rawBase = match?.[1]?.trim() || title.trim();
  const base = rawBase || "Resume";
  const index = match?.[2] ? parseInt(match[2], 10) : null;
  return { base, index: Number.isNaN(index) ? null : index };
}

async function getUniqueResumeTitle(args: {
  db: any;
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
      .filter((r: any) => (args.excludeId ? r.id !== args.excludeId : true))
      .map((r: any) => (r.title || "").trim().toLowerCase()),
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

async function assertCanCreateResume(db: any, userId: string) {
  const user = await db.query.users.findFirst({
    columns: {
      id: true,
      plan: true,
      isPaid: true,
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

  const plan = user.plan ?? "free";
  const createdCount = user.resumeCreatedCount ?? 0;
  const limit =
    plan === "free" ? 1 : plan === "active" ? 2 : plan === "plus" ? 6 : 12;

  if (limit !== null && createdCount >= limit) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `You've reached your ${plan.toUpperCase()} plan limit. Upgrade your plan to create more resume templates.`,
    });
  }

  return user;
}

// Validation schemas
const contactSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  desiredJobTitle: z.string(),
  phone: z.string(),
  email: z.string().email().or(z.literal("")),
});

const experienceSchema = z.object({
  id: z.string(),
  jobTitle: z.string(),
  employer: z.string(),
  location: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  isCurrentJob: z.boolean(),
  description: z.string(),
});

const educationSchema = z.object({
  id: z.string(),
  schoolName: z.string(),
  location: z.string(),
  degree: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  description: z.string(),
});

const skillSchema = z.object({
  id: z.string(),
  name: z.string(),
  level: z.enum(["Beginner", "Intermediate", "Advanced", "Expert"]),
  showLevel: z.boolean(),
});

const languageSchema = z.object({
  id: z.string(),
  name: z.string(),
  proficiency: z.enum(["Basic", "Conversational", "Fluent", "Native"]),
});

const certificationSchema = z.object({
  id: z.string(),
  name: z.string(),
  issuer: z.string(),
  date: z.string(),
});

const awardSchema = z.object({
  id: z.string(),
  title: z.string(),
  issuer: z.string(),
  date: z.string(),
});

const websiteSchema = z.object({
  id: z.string(),
  label: z.string(),
  url: z.string(),
});

const referenceSchema = z.object({
  id: z.string(),
  name: z.string(),
  position: z.string(),
  company: z.string(),
  email: z.string(),
  phone: z.string(),
});

const hobbySchema = z.object({
  id: z.string(),
  name: z.string(),
});

const customSectionSchema = z.object({
  id: z.string(),
  sectionName: z.string(),
  description: z.string(),
});

const finalizeSchema = z.object({
  languages: z.array(languageSchema),
  certifications: z.array(certificationSchema),
  awards: z.array(awardSchema),
  websites: z.array(websiteSchema),
  references: z.array(referenceSchema),
  hobbies: z.array(hobbySchema),
  customSections: z.array(customSectionSchema),
});

const resumeDataSchema = z.object({
  contact: contactSchema,
  experiences: z.array(experienceSchema),
  educations: z.array(educationSchema),
  skills: z.array(skillSchema),
  summary: z.string(),
  finalize: finalizeSchema,
});

const createResumeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  templateId: z.string().min(1, "Template is required"),
});

const updateResumeSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  templateId: z.string().optional(),
  data: resumeDataSchema.optional(),
  status: z.enum(["draft", "completed"]).optional(),
  lastEditedSection: z.string().optional(),
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
      where: eq(resumes.userId, ctx.user.id),
      orderBy: [desc(resumes.updatedAt)],
    });

    return userResumes;
  }),

  /**
   * Lightweight list for dashboards and selectors.
   * Avoids selecting the full resume JSON payload on every page load.
   */
  listSummary: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.resumes.findMany({
      columns: {
        id: true,
        title: true,
        templateId: true,
        status: true,
        lastEditedSection: true,
        createdAt: true,
        updatedAt: true,
      },
      where: eq(resumes.userId, ctx.user.id),
      orderBy: [desc(resumes.updatedAt)],
    });
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
      const user = await assertCanCreateResume(ctx.db, ctx.user.id);

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
          resumeCreatedCount: (user.resumeCreatedCount ?? 0) + 1,
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
      if (input.data !== undefined) updateData.data = input.data;
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
      const user = await assertCanCreateResume(ctx.db, ctx.user.id);

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
          resumeCreatedCount: (user.resumeCreatedCount ?? 0) + 1,
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id));

      return { id: newId };
    }),
});
