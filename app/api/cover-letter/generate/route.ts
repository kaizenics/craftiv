import { NextRequest, NextResponse } from "next/server";
import { publicErrorMessage, UserFacingError } from "@/lib/errors";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import {
  callWithFallback,
  extractJsonObject,
  buildCoverLetterFromResumePrompt,
  buildCoverLetterFromEditorPrompt,
} from "@/lib/ai";
import { db } from "@/db";
import { coverLetters } from "@/db/schema";
import {
  buildInsufficientCreditsPayload,
  COVER_LETTER_AI_SESSION_COST,
  InsufficientCreditsError,
  refundCredits,
  resolveSessionChargeKey,
} from "@/lib/credits";
import { beginAiAction, describeAiCharge } from "@/lib/own-ai-access";
import {
  createEmptyCoverLetterData,
  isCoverLetterTemplateId,
} from "@/lib/types/cover-letter";
import { PROMPT_INPUT_LIMITS } from "@/lib/constants/prompt-limits";
import { enforceApiRouteGuards } from "@/lib/security/guards";
import { parseJsonWithLimit } from "@/lib/security/request";
import { hashForLogs, securityLog } from "@/lib/security/logging";

const DAY_BUCKET_MS = 24 * 60 * 60 * 1000;

async function resolveCoverLetterId(params: {
  requestedCoverLetterId?: string;
  requestedTemplateId?: string;
  userId: string;
}) {
  const requestedId = params.requestedCoverLetterId?.trim();
  if (requestedId) {
    const existing = await db.query.coverLetters.findFirst({
      columns: { id: true },
      where: and(eq(coverLetters.id, requestedId), eq(coverLetters.userId, params.userId)),
    });
    if (!existing) {
      throw new UserFacingError("Cover letter not found.");
    }
    return requestedId;
  }

  const draftId = crypto.randomUUID();
  const data = createEmptyCoverLetterData();
  if (isCoverLetterTemplateId(params.requestedTemplateId)) {
    data.templateId = params.requestedTemplateId;
  }

  await db.insert(coverLetters).values({
    id: draftId,
    userId: params.userId,
    title: `Cover letter - ${new Date().toLocaleDateString()}`,
    data,
    updatedAt: new Date(),
  });

  return draftId;
}

export async function POST(request: NextRequest) {
  let chargedRequest: { userId: string; idempotencyKey: string } | null = null;

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const guard = await enforceApiRouteGuards({
      request,
      route: "/api/cover-letter/generate",
      category: "ai_heavy",
      userId: session.user.id,
    });
    if (!guard.ok) {
      return guard.response;
    }

    const body = await parseJsonWithLimit<{
      resumeText?: string;
      mode?: "resume" | "editor";
      targetJobTitle?: string;
      companyName?: string;
      hiringManagerName?: string;
      candidateContext?: string;
      existingDraft?: string;
      coverLetterId?: string;
      templateId?: string;
    }>(request, 120_000);

    const mode = body.mode ?? "resume";

    /**
     * The charge here is deliberately one per letter per day, so a caller can
     * regenerate all day on a single 0.5-credit charge. That makes the size of
     * each call the thing worth bounding: the body cap alone allowed ~120KB of
     * context per request, which is a large model call for a fixed price.
     * Truncating rather than rejecting keeps an over-long paste working.
     */
    const clamp = (value: string | undefined, max: number) => (value ?? "").trim().slice(0, max);

    const resumeText = clamp(body.resumeText, PROMPT_INPUT_LIMITS.resumeText);
    const targetJobTitle = clamp(body.targetJobTitle, PROMPT_INPUT_LIMITS.targetRole);
    const companyName = clamp(body.companyName, PROMPT_INPUT_LIMITS.name);
    const hiringManagerName = clamp(body.hiringManagerName, PROMPT_INPUT_LIMITS.name);
    const candidateContext = clamp(body.candidateContext, PROMPT_INPUT_LIMITS.candidateContext);
    const existingDraft = clamp(body.existingDraft, PROMPT_INPUT_LIMITS.existingDraft);

    if (mode === "resume" && resumeText.length < 20) {
      return NextResponse.json(
        { error: "Resume text is too short to generate a cover letter." },
        { status: 400 },
      );
    }

    if (mode === "editor" && !targetJobTitle) {
      return NextResponse.json({ error: "Target job title is required." }, { status: 400 });
    }

    const prompt =
      mode === "editor"
        ? buildCoverLetterFromEditorPrompt({
            targetJobTitle,
            companyName,
            hiringManagerName,
            candidateContext,
            existingDraft,
          })
        : buildCoverLetterFromResumePrompt(resumeText);

    console.log(`[CoverLetter Generate] Generating in ${mode} mode`);

    const coverLetterId = await resolveCoverLetterId({
      requestedCoverLetterId: body.coverLetterId,
      requestedTemplateId: body.templateId,
      userId: session.user.id,
    });

    const bucket = Math.floor(Date.now() / DAY_BUCKET_MS);
    const chargeIdempotencyKey = await resolveSessionChargeKey(
      `cl_ai_session:${session.user.id}:${coverLetterId}:${bucket}`,
    );
    const { ai, charge: chargeResult } = await beginAiAction({
      userId: session.user.id,
      eventType: "cover_letter_ai_session",
      costUnits: COVER_LETTER_AI_SESSION_COST,
      idempotencyKey: chargeIdempotencyKey,
      metadata: {
        mode,
        coverLetterId,
        bucket,
      },
    });
    if (chargeResult) {
      // A replayed charge was paid by an earlier call that already delivered a
      // letter, so a failure now must not refund it.
      if (!chargeResult.replayed) {
        chargedRequest = { userId: session.user.id, idempotencyKey: chargeIdempotencyKey };
      }

      securityLog("credits_consumed", {
        requestId: guard.requestId,
        route: "/api/cover-letter/generate",
        userIdHash: hashForLogs(session.user.id),
        eventType: "cover_letter_ai_session",
        costUnits: COVER_LETTER_AI_SESSION_COST,
        replayed: chargeResult.replayed,
        balanceUnits: chargeResult.balanceUnits,
      });
    }

    const { content: aiContent, model } = await callWithFallback({
      messages: [{ role: "user", content: prompt }],
      maxTokens: 2000,
      temperature: 0.7,
    }, ai);

    console.log(`[CoverLetter Generate] Done - model: ${model}`);

    const parsed = extractJsonObject(aiContent);

    const normalizePlainText = (text: string) =>
      text
        .replace(/```[\s\S]*?```/g, "")
        .replace(/^["']|["']$/g, "")
        .trim();

    const content =
      mode === "editor"
        ? normalizePlainText(aiContent)
        : parsed?.content || [parsed?.opening, parsed?.body, parsed?.closing].filter(Boolean).join("\n\n");

    if (!content) {
      console.error("[CoverLetter Generate] Invalid JSON from AI:", aiContent.slice(0, 500));
      throw new UserFacingError("AI returned an unexpected format. Please try again.");
    }

    return NextResponse.json({
      content,
      coverLetterId,
      creditCharge: describeAiCharge(chargeResult),
    });
  } catch (error: unknown) {
    if (chargedRequest) {
      await refundCredits({
        userId: chargedRequest.userId,
        eventType: "cover_letter_ai_session_refund",
        refundUnits: COVER_LETTER_AI_SESSION_COST,
        idempotencyKey: `refund:${chargedRequest.idempotencyKey}`,
        metadata: {
          reason: "ai_generation_failed",
        },
      });
    }

    if (error instanceof InsufficientCreditsError) {
      return NextResponse.json(buildInsufficientCreditsPayload(error), {
        status: 402,
      });
    }
    console.error("[CoverLetter Generate] Error:", error);
    const message = publicErrorMessage(error, "Something went wrong while writing your cover letter. Please try again.");
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
