import { z } from "zod";
import { and, eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "../init";
import { coverLetters, users } from "@/db/schema";
import type { Database } from "@/db";
import {
  coverLetterTemplateIds,
  normalizeCoverLetterData,
  type CoverLetterData,
} from "@/lib/types/cover-letter";

const contactSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string(),
  address: z.string(),
  city: z.string(),
});

const employerSchema = z.object({
  hiringManagerName: z.string(),
  companyName: z.string(),
  companyAddress: z.string(),
  jobTitle: z.string(),
});

const coverLetterDataSchema = z.object({
  contact: contactSchema,
  employer: employerSchema,
  content: z.string(),
  date: z.string(),
  templateId: z.enum(coverLetterTemplateIds).optional(),
});

const updateCoverLetterSchema = z.object({
  id: z.string(),
  data: coverLetterDataSchema.optional(),
  title: z.string().min(1).optional(),
});

async function assertCanCreateCoverLetter(db: Database, userId: string) {
  const user = await db.query.users.findFirst({
    columns: {
      id: true,
      coverLetterCreatedCount: true,
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

export const coverLetterRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.query.coverLetters.findMany({
      where: and(eq(coverLetters.userId, ctx.user.id), eq(coverLetters.origin, "user")),
      orderBy: [desc(coverLetters.updatedAt)],
    });

    return rows.map((row) => ({
      ...row,
      data: normalizeCoverLetterData(row.data as Partial<CoverLetterData>),
    }));
  }),

  listSummary: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.query.coverLetters.findMany({
      columns: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        data: true,
      },
      // Job Hunter output stays out of the library until the user saves it.
      where: and(eq(coverLetters.userId, ctx.user.id), eq(coverLetters.origin, "user")),
      orderBy: [desc(coverLetters.updatedAt)],
    });

    return rows.map((row) => ({
      ...row,
      data: normalizeCoverLetterData(row.data as Partial<CoverLetterData>),
    }));
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const row = await ctx.db.query.coverLetters.findFirst({
        where: and(eq(coverLetters.id, input.id), eq(coverLetters.userId, ctx.user.id)),
      });
      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cover letter not found" });
      }

      return {
        ...row,
        data: normalizeCoverLetterData(row.data as Partial<CoverLetterData>),
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        data: coverLetterDataSchema,
        title: z.string().min(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await assertCanCreateCoverLetter(ctx.db, ctx.user.id);
      const id = crypto.randomUUID();
      const data = normalizeCoverLetterData(input.data as Partial<CoverLetterData>);

      const derivedTitle =
        input.title?.trim() ||
        (data?.employer.jobTitle.trim()
          ? `Cover letter — ${data.employer.jobTitle.trim()}`
          : data?.employer.companyName.trim()
            ? `Cover letter — ${data.employer.companyName.trim()}`
            : `Cover letter — ${new Date().toLocaleDateString()}`);

      await ctx.db.insert(coverLetters).values({
        id,
        userId: ctx.user.id,
        title: derivedTitle,
        data,
        updatedAt: new Date(),
      });

      await ctx.db
        .update(users)
        .set({
          coverLetterCreatedCount: (user.coverLetterCreatedCount ?? 0) + 1,
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id));

      return { id };
    }),

  update: protectedProcedure
    .input(updateCoverLetterSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.coverLetters.findFirst({
        columns: {
          id: true,
        },
        where: and(eq(coverLetters.id, input.id), eq(coverLetters.userId, ctx.user.id)),
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cover letter not found" });
      }
      const data = input.data
        ? normalizeCoverLetterData(input.data as Partial<CoverLetterData>)
        : null;
      const derivedTitle =
        input.title?.trim() ||
        (data?.employer.jobTitle.trim()
          ? `Cover letter — ${data.employer.jobTitle.trim()}`
          : data?.employer.companyName.trim()
            ? `Cover letter — ${data.employer.companyName.trim()}`
            : `Cover letter — ${new Date().toLocaleDateString()}`);

      await ctx.db
        .update(coverLetters)
        .set({
          title: derivedTitle,
          ...(data ? { data } : {}),
          updatedAt: new Date(),
        })
        .where(and(eq(coverLetters.id, input.id), eq(coverLetters.userId, ctx.user.id)));

      return { success: true, id: input.id };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.coverLetters.findFirst({
        columns: {
          id: true,
        },
        where: and(eq(coverLetters.id, input.id), eq(coverLetters.userId, ctx.user.id)),
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cover letter not found" });
      }
      await ctx.db
        .delete(coverLetters)
        .where(and(eq(coverLetters.id, input.id), eq(coverLetters.userId, ctx.user.id)));
      return { success: true };
    }),

  duplicate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await assertCanCreateCoverLetter(ctx.db, ctx.user.id);
      const existing = await ctx.db.query.coverLetters.findFirst({
        where: and(eq(coverLetters.id, input.id), eq(coverLetters.userId, ctx.user.id)),
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cover letter not found" });
      }
      const id = crypto.randomUUID();
      const normalizedData = normalizeCoverLetterData(
        existing.data as Partial<CoverLetterData>
      );
      await ctx.db.insert(coverLetters).values({
        id,
        userId: ctx.user.id,
        title: `${existing.title} (Copy)`,
        data: normalizedData,
        updatedAt: new Date(),
      });

      await ctx.db
        .update(users)
        .set({
          coverLetterCreatedCount: (user.coverLetterCreatedCount ?? 0) + 1,
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.user.id));

      return { id };
    }),
});
