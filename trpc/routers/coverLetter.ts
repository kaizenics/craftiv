import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "../init";
import { coverLetters } from "@/db/schema";
import type { CoverLetterData } from "@/lib/types/cover-letter";

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
});

const updateCoverLetterSchema = z.object({
  id: z.string(),
  data: coverLetterDataSchema,
  title: z.string().min(1).optional(),
});

export const coverLetterRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.coverLetters.findMany({
      where: eq(coverLetters.userId, ctx.user.id),
      orderBy: [desc(coverLetters.updatedAt)],
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const row = await ctx.db.query.coverLetters.findFirst({
        where: eq(coverLetters.id, input.id),
      });
      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cover letter not found" });
      }
      if (row.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You don't have access to this cover letter" });
      }
      return row;
    }),

  create: protectedProcedure
    .input(
      z.object({
        data: coverLetterDataSchema,
        title: z.string().min(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = crypto.randomUUID();
      const data = input.data as CoverLetterData;

      const derivedTitle =
        input.title?.trim() ||
        (data.employer.jobTitle.trim()
          ? `Cover letter — ${data.employer.jobTitle.trim()}`
          : data.employer.companyName.trim()
            ? `Cover letter — ${data.employer.companyName.trim()}`
            : `Cover letter — ${new Date().toLocaleDateString()}`);

      await ctx.db.insert(coverLetters).values({
        id,
        userId: ctx.user.id,
        title: derivedTitle,
        data,
        updatedAt: new Date(),
      });

      return { id };
    }),

  update: protectedProcedure
    .input(updateCoverLetterSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.coverLetters.findFirst({
        where: eq(coverLetters.id, input.id),
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cover letter not found" });
      }
      if (existing.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this cover letter",
        });
      }

      const data = input.data as CoverLetterData;
      const derivedTitle =
        input.title?.trim() ||
        (data.employer.jobTitle.trim()
          ? `Cover letter — ${data.employer.jobTitle.trim()}`
          : data.employer.companyName.trim()
            ? `Cover letter — ${data.employer.companyName.trim()}`
            : `Cover letter — ${new Date().toLocaleDateString()}`);

      await ctx.db
        .update(coverLetters)
        .set({
          title: derivedTitle,
          data,
          updatedAt: new Date(),
        })
        .where(eq(coverLetters.id, input.id));

      return { success: true, id: input.id };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.coverLetters.findFirst({
        where: eq(coverLetters.id, input.id),
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cover letter not found" });
      }
      if (existing.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this cover letter",
        });
      }

      await ctx.db.delete(coverLetters).where(eq(coverLetters.id, input.id));
      return { success: true };
    }),

  duplicate: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.coverLetters.findFirst({
        where: eq(coverLetters.id, input.id),
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cover letter not found" });
      }
      if (existing.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this cover letter",
        });
      }

      const id = crypto.randomUUID();
      await ctx.db.insert(coverLetters).values({
        id,
        userId: ctx.user.id,
        title: `${existing.title} (Copy)`,
        data: existing.data as CoverLetterData,
        updatedAt: new Date(),
      });

      return { id };
    }),
});
