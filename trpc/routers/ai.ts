import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "../init";
import { resumes } from "@/db/schema";
import {
  callWithFallback,
  extractJsonObject,
  extractJsonArray,
  extractResumeTextFields,
  formatFieldsForPrompt,
  buildImproveSectionPrompt,
  buildImproveFullResumePrompt,
  buildSpellCheckPrompt,
  buildSuggestionPrompt,
} from "@/lib/ai";

// ── Shared helpers ──────────────────────────────────────────────────────────

async function getOwnedResume(db: any, resumeId: string, userId: string) {
  const resume = await db.query.resumes.findFirst({
    where: eq(resumes.id, resumeId),
  });

  if (!resume) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Resume not found" });
  }
  if (resume.userId !== userId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
  }

  return resume;
}

function getResumeData(resume: any): Record<string, unknown> {
  const data = resume.data as Record<string, unknown> | null;
  if (!data) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Resume has no content.",
    });
  }
  return data;
}

// ── Input schemas ───────────────────────────────────────────────────────────

const improveSectionInput = z.object({
  resumeId: z.string(),
  section: z.enum(["summary", "experience", "education"]),
  content: z.string().min(1).max(3000),
  targetRole: z.string().optional(),
});

const improveFullResumeInput = z.object({
  resumeId: z.string(),
  targetRole: z.string().optional(),
});

const spellCheckInput = z.object({
  resumeId: z.string(),
});

const generateSuggestionInput = z.object({
  resumeId: z.string(),
  field: z.string(),
  currentContent: z.string(),
  issueType: z.string(),
});

// ── Router ──────────────────────────────────────────────────────────────────

export const aiRouter = createTRPCRouter({
  improveSection: protectedProcedure
    .input(improveSectionInput)
    .mutation(async ({ ctx, input }) => {
      await getOwnedResume(ctx.db, input.resumeId, ctx.user.id);

      const prompt = buildImproveSectionPrompt(input.section, input.content, input.targetRole);

      console.log(`[AI] improveSection — section: ${input.section}, length: ${input.content.length}`);

      const { content: improved, model } = await callWithFallback({
        messages: [{ role: "user", content: prompt }],
        maxTokens: 2000,
        temperature: 0.7,
      });

      console.log(`[AI] improveSection done — model: ${model}`);
      return { improved };
    }),

  improveFullResume: protectedProcedure
    .input(improveFullResumeInput)
    .mutation(async ({ ctx, input }) => {
      const resume = await getOwnedResume(ctx.db, input.resumeId, ctx.user.id);
      const data = getResumeData(resume);

      const prompt = buildImproveFullResumePrompt(data, input.targetRole);

      console.log(`[AI] improveFullResume — resumeId: ${input.resumeId}`);

      const { content, model } = await callWithFallback({
        messages: [{ role: "user", content: prompt }],
        maxTokens: 4000,
        temperature: 0.7,
      });

      const improved = extractJsonObject(content);
      if (!improved) {
        console.error(`[AI] improveFullResume — invalid JSON from ${model}:`, content.slice(0, 300));
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "AI returned invalid format. Please try again.",
        });
      }

      console.log(`[AI] improveFullResume done — model: ${model}`);
      return { improved };
    }),

  spellCheck: protectedProcedure
    .input(spellCheckInput)
    .mutation(async ({ ctx, input }) => {
      const resume = await getOwnedResume(ctx.db, input.resumeId, ctx.user.id);
      const data = getResumeData(resume);

      const textFields = extractResumeTextFields(data);
      if (textFields.length === 0) {
        console.log("[AI] spellCheck — no text fields, skipping");
        return { issues: [] };
      }

      const fieldsText = formatFieldsForPrompt(textFields);
      const prompt = buildSpellCheckPrompt(fieldsText);

      console.log(`[AI] spellCheck — resumeId: ${input.resumeId}, fields: ${textFields.length}`);

      const { content, model } = await callWithFallback({
        messages: [{ role: "user", content: prompt }],
        maxTokens: 4000,
        temperature: 0.3,
      });

      console.log(`[AI] spellCheck raw (${model}):`, content.slice(0, 500));

      const parsed = extractJsonArray(content);
      if (!parsed) {
        console.log("[AI] spellCheck — no valid JSON array in response");
        return { issues: [] };
      }

      const issues = parsed
        .filter((item: any) => item.field && item.original && item.corrected && item.context)
        .map((item: any) => ({
          type: item.type || "spelling",
          field: item.field,
          original: item.original,
          corrected: item.corrected,
          context: item.context,
        }));

      console.log(`[AI] spellCheck done — ${issues.length} issue(s) via ${model}`);
      return { issues };
    }),

  generateSuggestion: protectedProcedure
    .input(generateSuggestionInput)
    .mutation(async ({ ctx, input }) => {
      const resume = await getOwnedResume(ctx.db, input.resumeId, ctx.user.id);
      const d = resume.data as any;
      const jobTitle = d?.contact?.desiredJobTitle || "";

      const prompt = buildSuggestionPrompt(input.field, input.currentContent, jobTitle);

      console.log(`[AI] generateSuggestion — field: ${input.field}, type: ${input.issueType}`);

      const { content: suggestion, model } = await callWithFallback({
        messages: [{ role: "user", content: prompt }],
        maxTokens: 1000,
        temperature: 0.7,
      });

      console.log(`[AI] generateSuggestion done — model: ${model}`);
      return { suggestion };
    }),
});
