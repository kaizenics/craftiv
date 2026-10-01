import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "../init";
import { resumes, type ResumeDataJSON } from "@/db/schema";
import {
  type AiConnection,
  callWithFallback,
  extractJsonArray,
  extractJsonObject,
  extractResumeTextFields,
  formatFieldsForPrompt,
} from "@/lib/ai";
import {
  EXP_SPLIT_TOKEN,
  buildAchievementBuilderPrompt,
  buildCoverLetterPrompt,
  buildImproveFullResumePrompt,
  buildImproveSectionPrompt,
  buildKeywordSuggestionPrompt,
  buildSpellCheckPrompt,
  buildSuggestionPrompt,
} from "@/lib/prompts";
import { analyzeResumeData, buildAtsImpact } from "@/lib/ats";
import {
  CHATBOT_NO_CODE_REPLY,
  CHATBOT_SYSTEM_PROMPT,
  isProgrammingRelated,
  looksLikeCodeOutput,
} from "@/lib/chatbot-policy";
import {
  AI_ACHIEVEMENT_BUILDER_COST,
  AI_COVER_LETTER_COST,
  AI_KEYWORD_BOOSTER_COST,
  AI_RESUME_IMPROVER_COST,
  AI_SPELL_CHECK_COST,
  AI_SUGGESTION_COST,
  CHATBOT_STREAM_COST,
  InsufficientCreditsError,
  newChargeIdempotencyKey,
  refundCredits,
} from "@/lib/credits";
import { PROMPT_INPUT_LIMITS } from "@/lib/constants/prompt-limits";
import { beginAiAction } from "@/lib/own-ai-access";
import { enforceRouteRateLimits } from "@/lib/security/guards";
import { hashForLogs, securityLog } from "@/lib/security/logging";
import type { Database } from "@/db";

type ResumeRow = typeof resumes.$inferSelect;

/** Shape of a spell-check issue as returned by the AI (fields validated by filtering). */
interface RawSpellIssue {
  type?: string;
  field: string;
  original: string;
  corrected: string;
  context: string;
}

/** Shape of a keyword suggestion as returned by the AI (fields validated by filtering). */
interface RawKeyword {
  keyword: string;
  importance: string;
  section: string;
  suggestion: string;
}

async function getOwnedResume(db: Database, resumeId: string, userId: string): Promise<ResumeRow> {
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

function getResumeData(resume: ResumeRow): ResumeDataJSON {
  const data = resume.data;
  if (!data) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Resume has no content.",
    });
  }
  return data;
}

function cloneResumeData(data: ResumeDataJSON) {
  return JSON.parse(JSON.stringify(data)) as ResumeDataJSON;
}

function applyDelimitedDescriptions<T extends { description: string }>(
  items: T[],
  improvedText: string,
  splitToken: string,
) {
  const parts = improvedText
    .split(splitToken)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return items;
  }

  let partIndex = 0;
  return items.map((item) => {
    if (!item.description?.trim()) return item;
    const nextDescription = parts[partIndex];
    partIndex += 1;
    return nextDescription ? { ...item, description: nextDescription } : item;
  });
}

function getChangedContentSections(before: ResumeDataJSON, after: ResumeDataJSON) {
  const changed = new Set<string>();

  if (before.summary !== after.summary) changed.add("Summary");
  if (
    before.experiences.some(
      (experience, index) => experience.description !== after.experiences[index]?.description,
    )
  ) {
    changed.add("Experience");
  }
  if (
    before.educations.some(
      (education, index) => education.description !== after.educations[index]?.description,
    )
  ) {
    changed.add("Education");
  }

  return [...changed];
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

async function enforceAiMutationRateLimit(
  ctx: { requestHeaders: { get(name: string): string | null }; user: { id: string } },
  mutation: string,
) {
  const result = await enforceRouteRateLimits({
    category: "ai_heavy",
    route: `/api/trpc/ai.${mutation}`,
    requestHeaders: ctx.requestHeaders,
    userId: ctx.user.id,
  });

  if (!result.allowed) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Rate limit exceeded. Retry after ${result.retryAfterSeconds} second(s).`,
    });
  }
}

async function prechargeAiAction(params: {
  userId: string;
  eventType: string;
  costUnits: number;
  metadata?: Record<string, unknown>;
}) {
  const idempotencyKey = newChargeIdempotencyKey(params.eventType, params.userId);

  try {
    const { ai, charge } = await beginAiAction({
      userId: params.userId,
      eventType: params.eventType,
      costUnits: params.costUnits,
      idempotencyKey,
      metadata: params.metadata,
    });

    if (charge) {
      securityLog("credits_consumed", {
        route: "trpc.ai",
        eventType: params.eventType,
        userIdHash: hashForLogs(params.userId),
        costUnits: params.costUnits,
        replayed: charge.replayed,
        balanceUnits: charge.balanceUnits,
      });
    }

    return { idempotencyKey, ai, charged: charge !== null };
  } catch (error) {
    if (error instanceof InsufficientCreditsError) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have enough credits for this action.",
      });
    }
    throw error;
  }
}

async function refundAiAction(params: {
  userId: string;
  eventType: string;
  costUnits: number;
  idempotencyKey: string;
  reason: string;
}) {
  await refundCredits({
    userId: params.userId,
    eventType: `${params.eventType}_refund`,
    refundUnits: params.costUnits,
    idempotencyKey: `refund:${params.idempotencyKey}`,
    metadata: {
      reason: params.reason,
    },
  });
}

/**
 * Precharges credits for an AI action, runs it, and refunds automatically if it
 * throws. Callers do their rate-limit check and prompt building first, then wrap
 * the model call so a failure never leaves the user charged.
 *
 * `run` receives the AI to call. On the user's own AI nothing is charged, so
 * there is nothing to refund either.
 */
async function chargeAndRun<T>(
  params: {
    userId: string;
    eventType: string;
    costUnits: number;
    metadata?: Record<string, unknown>;
  },
  run: (ai: AiConnection) => Promise<T>,
): Promise<T> {
  const charge = await prechargeAiAction(params);
  try {
    return await run(charge.ai);
  } catch (error) {
    if (!charge.charged) throw error;
    await refundAiAction({
      userId: params.userId,
      eventType: params.eventType,
      costUnits: params.costUnits,
      idempotencyKey: charge.idempotencyKey,
      reason: "ai_failure",
    });
    throw error;
  }
}

const improveSectionInput = z.object({
  resumeId: z.string(),
  section: z.enum(["summary", "experience", "education"]),
  content: z.string().min(1).max(PROMPT_INPUT_LIMITS.content),
  targetRole: z.string().max(PROMPT_INPUT_LIMITS.targetRole).optional(),
  jobDescription: z.string().max(PROMPT_INPUT_LIMITS.jobDescription).optional(),
});

const improveFullResumeInput = z.object({
  resumeId: z.string(),
  targetRole: z.string().max(PROMPT_INPUT_LIMITS.targetRole).optional(),
  jobDescription: z.string().max(PROMPT_INPUT_LIMITS.jobDescription).optional(),
});

const spellCheckInput = z.object({
  resumeId: z.string(),
});

const generateSuggestionInput = z.object({
  resumeId: z.string(),
  field: z.string().max(PROMPT_INPUT_LIMITS.fieldLabel),
  currentContent: z.string().max(PROMPT_INPUT_LIMITS.content),
  issueType: z.string().max(PROMPT_INPUT_LIMITS.issueType),
});

const keywordBoosterInput = z.object({
  resumeId: z.string(),
  jobDescription: z.string().min(1).max(PROMPT_INPUT_LIMITS.jobDescription),
});

const achievementBuilderInput = z.object({
  resumeId: z.string(),
  experienceIndex: z.number().int().min(0),
  targetRole: z.string().max(PROMPT_INPUT_LIMITS.targetRole).optional(),
});

const coverLetterInput = z.object({
  resumeId: z.string(),
  jobDescription: z.string().min(1).max(PROMPT_INPUT_LIMITS.jobDescription),
  companyName: z.string().max(PROMPT_INPUT_LIMITS.name).default(""),
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

export const aiRouter = createTRPCRouter({
  improveSection: protectedProcedure
    .input(improveSectionInput)
    .mutation(async ({ ctx, input }) => {
      await enforceAiMutationRateLimit(ctx, "improveSection");
      const resume = await getOwnedResume(ctx.db, input.resumeId, ctx.user.id);
      const resumeData = getResumeData(resume);

      const prompt = buildImproveSectionPrompt(
        input.section,
        input.content,
        input.targetRole,
        input.jobDescription,
      );

      return chargeAndRun(
        {
          userId: ctx.user.id,
          eventType: "ai_resume_improver",
          costUnits: AI_RESUME_IMPROVER_COST,
          metadata: { mutation: "improveSection", resumeId: input.resumeId },
        },
        async (ai) => {
          const { content: improved } = await callWithFallback({
            messages: [{ role: "user", content: prompt }],
            maxTokens: 2000,
            temperature: 0.45,
          }, ai);

          const beforeReport = analyzeResumeData(resumeData, input.jobDescription);
          const nextData = cloneResumeData(resumeData);

          if (input.section === "summary") {
            nextData.summary = improved.trim();
          } else if (input.section === "experience") {
            nextData.experiences = applyDelimitedDescriptions(
              nextData.experiences,
              improved,
              EXP_SPLIT_TOKEN,
            );
          } else {
            nextData.educations = applyDelimitedDescriptions(
              nextData.educations,
              improved,
              EXP_SPLIT_TOKEN,
            );
          }

          const afterReport = analyzeResumeData(nextData, input.jobDescription);
          const atsImpact = buildAtsImpact(beforeReport, afterReport);
          if (atsImpact.changedSections.length === 0) {
            atsImpact.changedSections = [input.section[0].toUpperCase() + input.section.slice(1)];
          }

          return { improved, atsImpact };
        },
      );
    }),

  improveFullResume: protectedProcedure
    .input(improveFullResumeInput)
    .mutation(async ({ ctx, input }) => {
      await enforceAiMutationRateLimit(ctx, "improveFullResume");
      const resume = await getOwnedResume(ctx.db, input.resumeId, ctx.user.id);
      const data = getResumeData(resume);

      const prompt = buildImproveFullResumePrompt(data, input.targetRole, input.jobDescription);

      return chargeAndRun(
        {
          userId: ctx.user.id,
          eventType: "ai_resume_improver",
          costUnits: AI_RESUME_IMPROVER_COST,
          metadata: { mutation: "improveFullResume", resumeId: input.resumeId },
        },
        async (ai) => {
          const { content } = await callWithFallback({
            messages: [{ role: "user", content: prompt }],
            maxTokens: 4000,
            temperature: 0.45,
          }, ai);

          const improved = extractJsonObject(content);
          if (!improved) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "AI returned invalid format. Please try again.",
            });
          }

          const nextData = {
            ...cloneResumeData(data),
            ...improved,
          } as ResumeDataJSON;
          const beforeReport = analyzeResumeData(data, input.jobDescription);
          const afterReport = analyzeResumeData(nextData, input.jobDescription);
          const atsImpact = buildAtsImpact(beforeReport, afterReport);
          if (atsImpact.changedSections.length === 0) {
            atsImpact.changedSections = getChangedContentSections(data, nextData);
          }

          return { improved, atsImpact };
        },
      );
    }),

  spellCheck: protectedProcedure
    .input(spellCheckInput)
    .mutation(async ({ ctx, input }) => {
      await enforceAiMutationRateLimit(ctx, "spellCheck");
      const resume = await getOwnedResume(ctx.db, input.resumeId, ctx.user.id);
      const data = getResumeData(resume);

      const textFields = extractResumeTextFields(data).filter(
        (field) => !isIgnoredSpellCheckField(field.field),
      );
      if (textFields.length === 0) {
        return { issues: [] };
      }

      const prompt = buildSpellCheckPrompt(formatFieldsForPrompt(textFields));
      return chargeAndRun(
        {
          userId: ctx.user.id,
          eventType: "ai_spell_check",
          costUnits: AI_SPELL_CHECK_COST,
          metadata: { mutation: "spellCheck", resumeId: input.resumeId },
        },
        async (ai) => {
          const { content } = await callWithFallback({
            messages: [{ role: "user", content: prompt }],
            maxTokens: 4000,
            temperature: 0.3,
          }, ai);

          const parsed = extractJsonArray(content);
          if (!parsed) {
            return { issues: [] };
          }

          const issues = (parsed as RawSpellIssue[])
            .filter((item) => item.field && item.original && item.corrected && item.context)
            .map((item) => ({
              type: item.type || "spelling",
              field: item.field,
              original: item.original,
              corrected: item.corrected,
              context: item.context,
            }))
            .filter((issue) => !isIgnoredSpellCheckField(issue.field));

          return { issues };
        },
      );
    }),

  generateSuggestion: protectedProcedure
    .input(generateSuggestionInput)
    .mutation(async ({ ctx, input }) => {
      await enforceAiMutationRateLimit(ctx, "generateSuggestion");
      const resume = await getOwnedResume(ctx.db, input.resumeId, ctx.user.id);
      const d = resume.data;
      const jobTitle = d?.contact?.desiredJobTitle || "";

      const prompt = buildSuggestionPrompt(input.field, input.currentContent, jobTitle);
      return chargeAndRun(
        {
          userId: ctx.user.id,
          eventType: "ai_suggestion",
          costUnits: AI_SUGGESTION_COST,
          metadata: { mutation: "generateSuggestion", resumeId: input.resumeId },
        },
        async (ai) => {
          const { content: suggestion } = await callWithFallback({
            messages: [{ role: "user", content: prompt }],
            maxTokens: 1000,
            temperature: 0.7,
          }, ai);
          return { suggestion };
        },
      );
    }),

  keywordBooster: protectedProcedure
    .input(keywordBoosterInput)
    .mutation(async ({ ctx, input }) => {
      await enforceAiMutationRateLimit(ctx, "keywordBooster");
      const resume = await getOwnedResume(ctx.db, input.resumeId, ctx.user.id);
      const data = getResumeData(resume);

      const textFields = extractResumeTextFields(data);
      const resumeText = formatFieldsForPrompt(textFields);
      const analyzerReport = analyzeResumeData(data, input.jobDescription);
      const missingKeywords = analyzerReport.missingKeywords.slice(0, 12);

      return chargeAndRun(
        {
          userId: ctx.user.id,
          eventType: "ai_keyword_booster",
          costUnits: AI_KEYWORD_BOOSTER_COST,
          metadata: { mutation: "keywordBooster", resumeId: input.resumeId },
        },
        async (ai) => {
          if (missingKeywords.length === 0) {
            return { keywords: [] };
          }

          const prompt = buildKeywordSuggestionPrompt(
            resumeText,
            input.jobDescription,
            missingKeywords,
          );
          const { content } = await callWithFallback({
            messages: [{ role: "user", content: prompt }],
            maxTokens: 3000,
            temperature: 0.3,
          }, ai);

          const parsed = extractJsonArray(content);
          if (!parsed) {
            return { keywords: [] };
          }

          const keywords = (parsed as RawKeyword[])
            .filter((item) => item.keyword && item.importance && item.section && item.suggestion)
            .filter((item) =>
              missingKeywords.some(
                (keyword) => keyword.toLowerCase() === String(item.keyword).toLowerCase(),
              ),
            )
            .map((item) => ({
              keyword: item.keyword,
              importance: item.importance,
              section: item.section,
              suggestion: item.suggestion,
            }));

          return { keywords };
        },
      );
    }),

  achievementBuilder: protectedProcedure
    .input(achievementBuilderInput)
    .mutation(async ({ ctx, input }) => {
      await enforceAiMutationRateLimit(ctx, "achievementBuilder");
      const resume = await getOwnedResume(ctx.db, input.resumeId, ctx.user.id);
      const data = getResumeData(resume);

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

      return chargeAndRun(
        {
          userId: ctx.user.id,
          eventType: "ai_achievement_builder",
          costUnits: AI_ACHIEVEMENT_BUILDER_COST,
          metadata: { mutation: "achievementBuilder", resumeId: input.resumeId },
        },
        async (ai) => {
          const { content: bullets } = await callWithFallback({
            messages: [{ role: "user", content: prompt }],
            maxTokens: 1500,
            temperature: 0.5,
          }, ai);
          const beforeReport = analyzeResumeData(data);
          const nextData = cloneResumeData(data);
          nextData.experiences[input.experienceIndex] = {
            ...nextData.experiences[input.experienceIndex],
            description: bullets.trim(),
          };
          const afterReport = analyzeResumeData(nextData);
          const atsImpact = buildAtsImpact(beforeReport, afterReport);
          if (atsImpact.changedSections.length === 0) {
            atsImpact.changedSections = ["Experience"];
          }

          return { bullets, atsImpact };
        },
      );
    }),

  chatbotReply: protectedProcedure
    .input(chatbotReplyInput)
    .mutation(async ({ ctx, input }) => {
      await enforceAiMutationRateLimit(ctx, "chatbotReply");

      if (isProgrammingRelated(input.message)) {
        return { reply: CHATBOT_NO_CODE_REPLY, blocked: true };
      }

      const historyMessages = (input.history ?? []).map((item) => ({
        role: item.role,
        content: item.content,
      }));

      return chargeAndRun(
        {
          userId: ctx.user.id,
          eventType: "chatbot_stream",
          costUnits: CHATBOT_STREAM_COST,
          metadata: { mutation: "chatbotReply" },
        },
        async (ai) => {
          const { content } = await callWithFallback({
            messages: [
              { role: "system", content: CHATBOT_SYSTEM_PROMPT },
              ...historyMessages,
              { role: "user", content: input.message },
            ],
            maxTokens: 900,
            temperature: 0.7,
          }, ai);

          if (looksLikeCodeOutput(content)) {
            return { reply: CHATBOT_NO_CODE_REPLY, blocked: true };
          }

          return { reply: content, blocked: false };
        },
      );
    }),

  coverLetter: protectedProcedure
    .input(coverLetterInput)
    .mutation(async ({ ctx, input }) => {
      await enforceAiMutationRateLimit(ctx, "coverLetter");
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

      return chargeAndRun(
        {
          userId: ctx.user.id,
          eventType: "ai_cover_letter",
          costUnits: AI_COVER_LETTER_COST,
          metadata: { mutation: "coverLetter", resumeId: input.resumeId },
        },
        async (ai) => {
          const { content: letter } = await callWithFallback({
            messages: [{ role: "user", content: prompt }],
            maxTokens: 2000,
            temperature: 0.7,
          }, ai);
          return { letter };
        },
      );
    }),
});
