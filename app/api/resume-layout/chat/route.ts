import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { generateResumeLayoutResponse } from "@/lib/resume-layout-assistant";
import type { ResumeLayoutChatRequest } from "@/lib/types/resume-layout-chat";
import {
  buildInsufficientCreditsPayload,
  consumeCredits,
  InsufficientCreditsError,
  RESUME_LAYOUT_CHAT_COST,
  refundCredits,
} from "@/lib/credits";
import { enforceApiRouteGuards } from "@/lib/security/guards";
import { parseJsonWithLimit } from "@/lib/security/request";
import { hashForLogs, securityLog } from "@/lib/security/logging";

const MAX_PROMPT_CHARS = 1400;
export async function POST(request: NextRequest) {
  let chargedRequest: { userId: string; idempotencyKey: string } | null = null;
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const guard = await enforceApiRouteGuards({
      request,
      route: "/api/resume-layout/chat",
      category: "ai_heavy",
      userId: session.user.id,
    });
    if (!guard.ok) {
      return guard.response;
    }

    const body = await parseJsonWithLimit<ResumeLayoutChatRequest>(request, 40_000);
    const message = body.message?.trim() ?? "";
    const history = (body.history ?? []).filter((item) => item?.content?.trim());

    if (!message) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    if (message.length > MAX_PROMPT_CHARS) {
      return NextResponse.json(
        { error: `Prompt is too long. Keep it under ${MAX_PROMPT_CHARS} characters.` },
        { status: 400 },
      );
    }

    const requestId = crypto.randomUUID();
    const chargeIdempotencyKey = `resume_layout_chat:${session.user.id}:${requestId}`;
    const chargeResult = await consumeCredits({
      userId: session.user.id,
      eventType: "resume_layout_chat",
      costUnits: RESUME_LAYOUT_CHAT_COST,
      idempotencyKey: chargeIdempotencyKey,
      metadata: {
        requestId,
      },
    });
    chargedRequest = { userId: session.user.id, idempotencyKey: chargeIdempotencyKey };

    securityLog("credits_consumed", {
      requestId: guard.requestId,
      route: "/api/resume-layout/chat",
      userIdHash: hashForLogs(session.user.id),
      eventType: "resume_layout_chat",
      costUnits: RESUME_LAYOUT_CHAT_COST,
      replayed: chargeResult.replayed,
      balanceUnits: chargeResult.balanceUnits,
    });

    const { reply, meta } = await generateResumeLayoutResponse({
      message,
      history,
    });

    return NextResponse.json({
      ok: true,
      reply,
      meta,
      creditCharge: {
        replayed: chargeResult.replayed,
        chargedCredits: RESUME_LAYOUT_CHAT_COST / 100,
        balanceCredits: chargeResult.balanceUnits / 100,
        balanceUnits: chargeResult.balanceUnits,
      },
    });
  } catch (error) {
    if (chargedRequest) {
      await refundCredits({
        userId: chargedRequest.userId,
        eventType: "resume_layout_chat_refund",
        refundUnits: RESUME_LAYOUT_CHAT_COST,
        idempotencyKey: `refund:${chargedRequest.idempotencyKey}`,
        metadata: {
          reason: "layout_generation_failed",
        },
      });
    }
    if (error instanceof InsufficientCreditsError) {
      return NextResponse.json(buildInsufficientCreditsPayload(error), { status: 402 });
    }
    console.error("[resume-layout-chat] unexpected error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error while generating layout recommendation.",
      },
      { status: 500 },
    );
  }
}
