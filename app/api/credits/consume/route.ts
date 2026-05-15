import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  buildInsufficientCreditsPayload,
  consumeCredits,
  InsufficientCreditsError,
  SERVER_CREDIT_COSTS,
  type ServerCreditEventType,
} from "@/lib/credits";
import { enforceApiRouteGuards } from "@/lib/security/guards";
import { parseJsonWithLimit } from "@/lib/security/request";
import { hashForLogs, securityLog } from "@/lib/security/logging";

type ConsumeCreditsBody = {
  eventType: ServerCreditEventType;
  cost?: number;
  requestId?: string;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const guard = await enforceApiRouteGuards({
      request,
      route: "/api/credits/consume",
      category: "global",
      userId: session.user.id,
    });
    if (!guard.ok) {
      return guard.response;
    }

    const body = await parseJsonWithLimit<ConsumeCreditsBody>(request, 32_000);
    if (!body?.eventType || !(body.eventType in SERVER_CREDIT_COSTS)) {
      return NextResponse.json({ error: "Unsupported event type" }, { status: 400 });
    }

    const fixedCostUnits = SERVER_CREDIT_COSTS[body.eventType];
    const requestId = body.requestId?.trim() || crypto.randomUUID();
    const idempotencyKey =
      body.idempotencyKey?.trim() ||
      `${body.eventType}:${session.user.id}:${requestId}`;
    const result = await consumeCredits({
      userId: session.user.id,
      eventType: body.eventType,
      costUnits: fixedCostUnits,
      idempotencyKey,
      metadata: body.metadata,
    });

    securityLog("credits_consumed", {
      requestId: guard.requestId,
      userIdHash: hashForLogs(session.user.id),
      eventType: body.eventType,
      fixedCostUnits,
      replayed: result.replayed,
      balanceUnits: result.balanceUnits,
    });

    return NextResponse.json({
      ok: true,
      replayed: result.replayed,
      creditBalanceUnits: result.balanceUnits,
      creditBalance: result.balanceUnits / 100,
      requestId: guard.requestId,
    });
  } catch (error) {
    if (error instanceof InsufficientCreditsError) {
      return NextResponse.json(buildInsufficientCreditsPayload(error), { status: 402 });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
