import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "../init";
import { coverLetters, users } from "@/db/schema";
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
  data: coverLetterDataSchema,
  title: z.string().min(1).optional(),
});

async function assertCanCreateCoverLetter(db: any, userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "User not found",
    });
  }

  const plan = user.plan ?? "free";
  const createdCount = user.coverLetterCreatedCount ?? 0;
  const limit = plan === "free" ? 1 : plan === "plus" ? 20 : null;

  if (limit !== null && createdCount >= limit) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `You've reached your ${plan.toUpperCase()} plan limit. Upgrade your plan to create more cover letter templates.`,
    });
  }

  return user;
}

export const coverLetterRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.query.coverLetters.findMany({
      where: eq(coverLetters.userId, ctx.user.id),
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
        where: eq(coverLetters.id, input.id),
      });
      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Cover letter not found" });
      }
      if (row.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You don't have access to this cover letter" });
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

      const data = normalizeCoverLetterData(input.data as Partial<CoverLetterData>);
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
      const user = await assertCanCreateCoverLetter(ctx.db, ctx.user.id);
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
