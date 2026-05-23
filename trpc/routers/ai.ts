import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "../init";
import { resumes } from "@/db/schema";
import {
  buildAchievementBuilderPrompt,
  buildCoverLetterPrompt,
  buildImproveFullResumePrompt,
  buildImproveSectionPrompt,
  buildKeywordBoosterPrompt,
  buildSpellCheckPrompt,
  buildSuggestionPrompt,
  callWithFallback,
  extractJsonArray,
  extractJsonObject,
  extractResumeTextFields,
  formatFieldsForPrompt,
} from "@/lib/ai";
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
  consumeCredits,
  InsufficientCreditsError,
  refundCredits,
} from "@/lib/credits";
import { enforceRouteRateLimits } from "@/lib/security/guards";
import { hashForLogs, securityLog } from "@/lib/security/logging";

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
  const idempotencyKey = `${params.eventType}:${params.userId}:${crypto.randomUUID()}`;

  try {
    const charge = await consumeCredits({
      userId: params.userId,
      eventType: params.eventType,
      costUnits: params.costUnits,
      idempotencyKey,
      metadata: params.metadata,
    });

    securityLog("credits_consumed", {
      route: "trpc.ai",
      eventType: params.eventType,
      userIdHash: hashForLogs(params.userId),
      costUnits: params.costUnits,
      replayed: charge.replayed,
      balanceUnits: charge.balanceUnits,
    });

    return { idempotencyKey, charge };
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

const improveSectionInput = z.object({
  resumeId: z.string(),
  section: z.enum(["summary", "experience", "education"]),
  content: z.string().min(1).max(3000),
  targetRole: z.string().optional(),
  jobDescription: z.string().max(5000).optional(),
});

const improveFullResumeInput = z.object({
  resumeId: z.string(),
  targetRole: z.string().optional(),
  jobDescription: z.string().max(5000).optional(),
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

export const aiRouter = createTRPCRouter({
  improveSection: protectedProcedure
    .input(improveSectionInput)
    .mutation(async ({ ctx, input }) => {
      await enforceAiMutationRateLimit(ctx, "improveSection");
      await getOwnedResume(ctx.db, input.resumeId, ctx.user.id);

      const prompt = buildImproveSectionPrompt(
        input.section,
        input.content,
        input.targetRole,
        input.jobDescription,
      );

      const charge = await prechargeAiAction({
        userId: ctx.user.id,
        eventType: "ai_resume_improver",
        costUnits: AI_RESUME_IMPROVER_COST,
        metadata: { mutation: "improveSection", resumeId: input.resumeId },
      });

      try {
        const { content: improved } = await callWithFallback({
          messages: [{ role: "user", content: prompt }],
          maxTokens: 2000,
          temperature: 0.45,
        });
        return { improved };
      } catch (error) {
        await refundAiAction({
          userId: ctx.user.id,
          eventType: "ai_resume_improver",
          costUnits: AI_RESUME_IMPROVER_COST,
          idempotencyKey: charge.idempotencyKey,
          reason: "ai_failure",
        });
        throw error;
      }
    }),

  improveFullResume: protectedProcedure
    .input(improveFullResumeInput)
    .mutation(async ({ ctx, input }) => {
      await enforceAiMutationRateLimit(ctx, "improveFullResume");
      const resume = await getOwnedResume(ctx.db, input.resumeId, ctx.user.id);
      const data = getResumeData(resume);

      const prompt = buildImproveFullResumePrompt(data, input.targetRole, input.jobDescription);

      const charge = await prechargeAiAction({
        userId: ctx.user.id,
        eventType: "ai_resume_improver",
        costUnits: AI_RESUME_IMPROVER_COST,
        metadata: { mutation: "improveFullResume", resumeId: input.resumeId },
      });

      try {
        const { content } = await callWithFallback({
          messages: [{ role: "user", content: prompt }],
          maxTokens: 4000,
          temperature: 0.45,
        });

        const improved = extractJsonObject(content);
        if (!improved) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "AI returned invalid format. Please try again.",
          });
        }
        return { improved };
      } catch (error) {
        await refundAiAction({
          userId: ctx.user.id,
          eventType: "ai_resume_improver",
          costUnits: AI_RESUME_IMPROVER_COST,
          idempotencyKey: charge.idempotencyKey,
          reason: "ai_failure",
        });
        throw error;
      }
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
      const charge = await prechargeAiAction({
        userId: ctx.user.id,
        eventType: "ai_spell_check",
        costUnits: AI_SPELL_CHECK_COST,
        metadata: { mutation: "spellCheck", resumeId: input.resumeId },
      });

      try {
        const { content } = await callWithFallback({
          messages: [{ role: "user", content: prompt }],
          maxTokens: 4000,
          temperature: 0.3,
        });

        const parsed = extractJsonArray(content);
        if (!parsed) {
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

        return { issues };
      } catch (error) {
        await refundAiAction({
          userId: ctx.user.id,
          eventType: "ai_spell_check",
          costUnits: AI_SPELL_CHECK_COST,
          idempotencyKey: charge.idempotencyKey,
          reason: "ai_failure",
        });
        throw error;
      }
    }),

  generateSuggestion: protectedProcedure
    .input(generateSuggestionInput)
    .mutation(async ({ ctx, input }) => {
      await enforceAiMutationRateLimit(ctx, "generateSuggestion");
      const resume = await getOwnedResume(ctx.db, input.resumeId, ctx.user.id);
      const d = resume.data as any;
      const jobTitle = d?.contact?.desiredJobTitle || "";

      const prompt = buildSuggestionPrompt(input.field, input.currentContent, jobTitle);
      const charge = await prechargeAiAction({
        userId: ctx.user.id,
        eventType: "ai_suggestion",
        costUnits: AI_SUGGESTION_COST,
        metadata: { mutation: "generateSuggestion", resumeId: input.resumeId },
      });

      try {
        const { content: suggestion } = await callWithFallback({
          messages: [{ role: "user", content: prompt }],
          maxTokens: 1000,
          temperature: 0.7,
        });
        return { suggestion };
      } catch (error) {
        await refundAiAction({
          userId: ctx.user.id,
          eventType: "ai_suggestion",
          costUnits: AI_SUGGESTION_COST,
          idempotencyKey: charge.idempotencyKey,
          reason: "ai_failure",
        });
        throw error;
      }
    }),

  keywordBooster: protectedProcedure
    .input(keywordBoosterInput)
    .mutation(async ({ ctx, input }) => {
      await enforceAiMutationRateLimit(ctx, "keywordBooster");
      const resume = await getOwnedResume(ctx.db, input.resumeId, ctx.user.id);
      const data = getResumeData(resume);

      const textFields = extractResumeTextFields(data);
      const resumeText = formatFieldsForPrompt(textFields);
      const prompt = buildKeywordBoosterPrompt(resumeText, input.jobDescription);

      const charge = await prechargeAiAction({
        userId: ctx.user.id,
        eventType: "ai_keyword_booster",
        costUnits: AI_KEYWORD_BOOSTER_COST,
        metadata: { mutation: "keywordBooster", resumeId: input.resumeId },
      });

      try {
        const { content } = await callWithFallback({
          messages: [{ role: "user", content: prompt }],
          maxTokens: 3000,
          temperature: 0.3,
        });

        const parsed = extractJsonArray(content);
        if (!parsed) {
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

        return { keywords };
      } catch (error) {
        await refundAiAction({
          userId: ctx.user.id,
          eventType: "ai_keyword_booster",
          costUnits: AI_KEYWORD_BOOSTER_COST,
          idempotencyKey: charge.idempotencyKey,
          reason: "ai_failure",
        });
        throw error;
      }
    }),

  achievementBuilder: protectedProcedure
    .input(achievementBuilderInput)
    .mutation(async ({ ctx, input }) => {
      await enforceAiMutationRateLimit(ctx, "achievementBuilder");
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

      const charge = await prechargeAiAction({
        userId: ctx.user.id,
        eventType: "ai_achievement_builder",
        costUnits: AI_ACHIEVEMENT_BUILDER_COST,
        metadata: { mutation: "achievementBuilder", resumeId: input.resumeId },
      });

      try {
        const { content: bullets } = await callWithFallback({
          messages: [{ role: "user", content: prompt }],
          maxTokens: 1500,
          temperature: 0.5,
        });
        return { bullets };
      } catch (error) {
        await refundAiAction({
          userId: ctx.user.id,
          eventType: "ai_achievement_builder",
          costUnits: AI_ACHIEVEMENT_BUILDER_COST,
          idempotencyKey: charge.idempotencyKey,
          reason: "ai_failure",
        });
        throw error;
      }
    }),

  chatbotReply: protectedProcedure
    .input(chatbotReplyInput)
    .mutation(async ({ ctx, input }) => {
      await enforceAiMutationRateLimit(ctx, "chatbotReply");

      if (isProgrammingRelated(input.message)) {
        return { reply: CHATBOT_NO_CODE_REPLY, blocked: true };
      }

      const charge = await prechargeAiAction({
        userId: ctx.user.id,
        eventType: "chatbot_stream",
        costUnits: CHATBOT_STREAM_COST,
        metadata: { mutation: "chatbotReply" },
      });

      const historyMessages = (input.history ?? []).map((item) => ({
        role: item.role,
        content: item.content,
      }));

      try {
        const { content } = await callWithFallback({
          messages: [
            { role: "system", content: CHATBOT_SYSTEM_PROMPT },
            ...historyMessages,
            { role: "user", content: input.message },
          ],
          maxTokens: 900,
          temperature: 0.7,
        });

        if (looksLikeCodeOutput(content)) {
          return { reply: CHATBOT_NO_CODE_REPLY, blocked: true };
        }

        return { reply: content, blocked: false };
      } catch (error) {
        await refundAiAction({
          userId: ctx.user.id,
          eventType: "chatbot_stream",
          costUnits: CHATBOT_STREAM_COST,
          idempotencyKey: charge.idempotencyKey,
          reason: "ai_failure",
        });
        throw error;
      }
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

      const charge = await prechargeAiAction({
        userId: ctx.user.id,
        eventType: "ai_cover_letter",
        costUnits: AI_COVER_LETTER_COST,
        metadata: { mutation: "coverLetter", resumeId: input.resumeId },
      });

      try {
        const { content: letter } = await callWithFallback({
          messages: [{ role: "user", content: prompt }],
          maxTokens: 2000,
          temperature: 0.7,
        });
        return { letter };
      } catch (error) {
        await refundAiAction({
          userId: ctx.user.id,
          eventType: "ai_cover_letter",
          costUnits: AI_COVER_LETTER_COST,
          idempotencyKey: charge.idempotencyKey,
          reason: "ai_failure",
        });
        throw error;
      }
    }),
});
