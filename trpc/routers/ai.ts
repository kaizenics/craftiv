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
  buildKeywordBoosterPrompt,
  buildAchievementBuilderPrompt,
  buildCoverLetterPrompt,
} from "@/lib/ai";
import {
  CHATBOT_NO_CODE_REPLY,
  CHATBOT_SYSTEM_PROMPT,
  isProgrammingRelated,
  looksLikeCodeOutput,
} from "@/lib/chatbot-policy";

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

function isIgnoredSpellCheckField(field: string): boolean {
  const normalized = field.trim().toLowerCase();
  const ignoredLabels = [
    "first name",
    "last name",
    "full name",
    "email",
    "email address",
    "phone",
    "phone number",
    "mobile",
    "mobile number",
    "contact number",
    "employer",
    "company",
    "company name",
  ];

  return ignoredLabels.some((label) => normalized.includes(label));
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

const keywordBoosterInput = z.object({
  resumeId: z.string(),
  jobDescription: z.string().min(1).max(5000),
});

const achievementBuilderInput = z.object({
  resumeId: z.string(),
  experienceIndex: z.number().int().min(0),
  targetRole: z.string().optional(),
});

const coverLetterInput = z.object({
  resumeId: z.string(),
  jobDescription: z.string().min(1).max(5000),
  companyName: z.string().max(200).default(""),
  tone: z.enum(["professional", "confident", "enthusiastic"]).default("professional"),
});

const chatbotReplyInput = z.object({
  message: z.string().min(1).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2000),
      }),
    )
    .max(12)
    .optional(),
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

      const textFields = extractResumeTextFields(data).filter(
        (field) => !isIgnoredSpellCheckField(field.field),
      );
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
        }))
        .filter((issue) => !isIgnoredSpellCheckField(issue.field));

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

  keywordBooster: protectedProcedure
    .input(keywordBoosterInput)
    .mutation(async ({ ctx, input }) => {
      const resume = await getOwnedResume(ctx.db, input.resumeId, ctx.user.id);
      const data = getResumeData(resume);

      const textFields = extractResumeTextFields(data);
      const resumeText = formatFieldsForPrompt(textFields);

      const prompt = buildKeywordBoosterPrompt(resumeText, input.jobDescription);

      console.log(`[AI] keywordBooster — resumeId: ${input.resumeId}`);

      const { content, model } = await callWithFallback({
        messages: [{ role: "user", content: prompt }],
        maxTokens: 3000,
        temperature: 0.4,
      });

      const parsed = extractJsonArray(content);
      if (!parsed) {
        console.log("[AI] keywordBooster — no valid JSON array in response");
        return { keywords: [] };
      }

      const keywords = parsed
        .filter((item: any) => item.keyword && item.importance && item.section && item.suggestion)
        .map((item: any) => ({
          keyword: item.keyword,
          importance: item.importance,
          section: item.section,
          suggestion: item.suggestion,
        }));

      console.log(`[AI] keywordBooster done — ${keywords.length} keyword(s) via ${model}`);
      return { keywords };
    }),

  achievementBuilder: protectedProcedure
    .input(achievementBuilderInput)
    .mutation(async ({ ctx, input }) => {
      const resume = await getOwnedResume(ctx.db, input.resumeId, ctx.user.id);
      const data = getResumeData(resume) as any;

      const experiences = data.experiences ?? [];
      if (input.experienceIndex >= experiences.length) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Experience not found." });
      }

      const exp = experiences[input.experienceIndex];
      if (!exp.description?.trim()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Experience has no description to improve." });
      }

      const prompt = buildAchievementBuilderPrompt(
        exp.jobTitle || "",
        exp.employer || "",
        exp.description,
        input.targetRole,
      );

      console.log(`[AI] achievementBuilder — experience: ${exp.jobTitle} at ${exp.employer}`);

      const { content: bullets, model } = await callWithFallback({
        messages: [{ role: "user", content: prompt }],
        maxTokens: 1500,
        temperature: 0.7,
      });

      console.log(`[AI] achievementBuilder done — model: ${model}`);
      return { bullets };
    }),

  chatbotReply: protectedProcedure
    .input(chatbotReplyInput)
    .mutation(async ({ input }) => {

      if (isProgrammingRelated(input.message)) {
        return { reply: CHATBOT_NO_CODE_REPLY, blocked: true };
      }

      const historyMessages = (input.history ?? []).map((item) => ({
        role: item.role,
        content: item.content,
      }));

      const { content, model } = await callWithFallback({
        messages: [
          { role: "system", content: CHATBOT_SYSTEM_PROMPT },
          ...historyMessages,
          { role: "user", content: input.message },
        ],
        maxTokens: 900,
        temperature: 0.7,
      });

      console.log(`[AI] chatbotReply done - model: ${model}`);

      if (looksLikeCodeOutput(content)) {
        return { reply: CHATBOT_NO_CODE_REPLY, blocked: true };
      }

      return { reply: content, blocked: false };
    }),

  coverLetter: protectedProcedure
    .input(coverLetterInput)
    .mutation(async ({ ctx, input }) => {
      const resume = await getOwnedResume(ctx.db, input.resumeId, ctx.user.id);
      const data = getResumeData(resume);

      const textFields = extractResumeTextFields(data);
      const resumeText = formatFieldsForPrompt(textFields);

      const prompt = buildCoverLetterPrompt(
        resumeText,
        input.jobDescription,
        input.companyName,
        input.tone,
      );

      console.log(`[AI] coverLetter — resumeId: ${input.resumeId}, tone: ${input.tone}`);

      const { content: letter, model } = await callWithFallback({
        messages: [{ role: "user", content: prompt }],
        maxTokens: 2000,
        temperature: 0.7,
      });

      console.log(`[AI] coverLetter done — model: ${model}`);
      return { letter };
    }),
});
