import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  buildInsufficientCreditsPayload,
  consumeCredits,
  InsufficientCreditsError,
  toCreditUnits,
} from "@/lib/credits";

type ConsumeCreditsBody = {
  eventType: string;
  cost: number;
  idempotencyKey?: string;
  metadata?: Record<string, unknown>;
};

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = (await request.json()) as ConsumeCreditsBody;
    const cost = Number(body?.cost ?? 0);

    if (!Number.isFinite(cost) || cost <= 0) {
      return NextResponse.json({ error: "Invalid credit cost" }, { status: 400 });
    }
    const idempotencyKey =
      body.idempotencyKey?.trim() ||
      `${body.eventType}:${session.user.id}:${crypto.randomUUID()}`;
    const result = await consumeCredits({
      userId: session.user.id,
      eventType: body.eventType,
      costUnits: toCreditUnits(cost),
      idempotencyKey,
      metadata: body.metadata,
    });

    return NextResponse.json({
      ok: true,
      replayed: result.replayed,
      creditBalanceUnits: result.balanceUnits,
      creditBalance: result.balanceUnits / 100,
    });
  } catch (error) {
    if (error instanceof InsufficientCreditsError) {
      return NextResponse.json(buildInsufficientCreditsPayload(error), { status: 402 });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
