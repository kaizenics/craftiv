import { NextRequest, NextResponse } from "next/server";
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
  consumeCredits,
  COVER_LETTER_AI_SESSION_COST,
  InsufficientCreditsError,
  refundCredits,
} from "@/lib/credits";
import {
  createEmptyCoverLetterData,
  isCoverLetterTemplateId,
} from "@/lib/types/cover-letter";
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
      throw new Error("Cover letter not found.");
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

    if (mode === "resume" && (!body.resumeText || body.resumeText.trim().length < 20)) {
      return NextResponse.json(
        { error: "Resume text is too short to generate a cover letter." },
        { status: 400 },
      );
    }

    if (mode === "editor" && !body.targetJobTitle?.trim()) {
      return NextResponse.json({ error: "Target job title is required." }, { status: 400 });
    }

    const prompt =
      mode === "editor"
        ? buildCoverLetterFromEditorPrompt({
            targetJobTitle: body.targetJobTitle!.trim(),
            companyName: body.companyName,
            hiringManagerName: body.hiringManagerName,
            candidateContext: body.candidateContext || "",
            existingDraft: body.existingDraft,
          })
        : buildCoverLetterFromResumePrompt(body.resumeText!.trim());

    console.log(`[CoverLetter Generate] Generating in ${mode} mode`);

    const coverLetterId = await resolveCoverLetterId({
      requestedCoverLetterId: body.coverLetterId,
      requestedTemplateId: body.templateId,
      userId: session.user.id,
    });

    const bucket = Math.floor(Date.now() / DAY_BUCKET_MS);
    const chargeIdempotencyKey = `cl_ai_session:${session.user.id}:${coverLetterId}:${bucket}`;
    const chargeResult = await consumeCredits({
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
    chargedRequest = { userId: session.user.id, idempotencyKey: chargeIdempotencyKey };

    securityLog("credits_consumed", {
      requestId: guard.requestId,
      route: "/api/cover-letter/generate",
      userIdHash: hashForLogs(session.user.id),
      eventType: "cover_letter_ai_session",
      costUnits: COVER_LETTER_AI_SESSION_COST,
      replayed: chargeResult.replayed,
      balanceUnits: chargeResult.balanceUnits,
    });

    const { content: aiContent, model } = await callWithFallback({
      messages: [{ role: "user", content: prompt }],
      maxTokens: 2000,
      temperature: 0.7,
    });

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
      throw new Error("AI returned an unexpected format. Please try again.");
    }

    return NextResponse.json({
      content,
      coverLetterId,
      creditCharge: {
        replayed: chargeResult.replayed,
        chargedCredits: 0.5,
        balanceCredits: chargeResult.balanceUnits / 100,
        balanceUnits: chargeResult.balanceUnits,
      },
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
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
