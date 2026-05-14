import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { db } from "@/db";
import { processedTransactions, users } from "@/db/schema";
import {
  getVariantPlanMap,
  type InternalPlan,
} from "@/lib/lemon-squeezy";
import {
  addCredits,
  CREDIT_UNITS_PER_CREDIT,
  deductCreditsWithFloor,
} from "@/lib/credits";

type LemonWebhookPayload = {
  meta?: {
    event_name?: string;
    custom_data?: Record<string, unknown>;
  };
  data?: {
    id?: string;
    type?: string;
    attributes?: {
      user_email?: string | null;
      variant_id?: number | string | null;
      first_order_item?: {
        variant_id?: number | string | null;
      } | null;
    };
  };
};

function normalizeVariantId(value: number | string | null | undefined): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isInteger(parsed) && parsed > 0) return parsed;
  }
  return null;
}

function resolvePlanFromPayload(payload: LemonWebhookPayload): InternalPlan | null {
  const internalPlanRaw = payload.meta?.custom_data?.internal_plan;
  if (
    internalPlanRaw === "active" ||
    internalPlanRaw === "plus" ||
    internalPlanRaw === "pro"
  ) {
    return internalPlanRaw;
  }

  const variantId = normalizeVariantId(
    payload.data?.attributes?.variant_id ??
      payload.data?.attributes?.first_order_item?.variant_id
  );
  if (!variantId) return null;
  const variantPlanMap = getVariantPlanMap();
  return variantPlanMap.get(variantId) ?? null;
}

function resolveUserIdFromPayload(payload: LemonWebhookPayload): string | null {
  const userIdRaw = payload.meta?.custom_data?.user_id;
  if (typeof userIdRaw !== "string") return null;
  const normalized = userIdRaw.trim();
  return normalized.length > 0 ? normalized : null;
}

function isSupportedEvent(eventName: string): boolean {
  return eventName === "order_created" || eventName === "order_refunded";
}

function getCreditsForPlan(plan: InternalPlan): number {
  if (plan === "active") return 500;
  if (plan === "plus") return 1200;
  return 2500;
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  let payload: LemonWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as LemonWebhookPayload;
  } catch {
    return Response.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const eventName =
    payload.meta?.event_name ?? request.headers.get("x-event-name") ?? "";
  if (!isSupportedEvent(eventName)) {
    return Response.json({ received: true, ignored: true });
  }

  const transactionId = payload.data?.id?.trim();
  if (!transactionId) {
    return Response.json({ error: "Missing transaction ID" }, { status: 400 });
  }

  let userId = resolveUserIdFromPayload(payload);
  if (!userId) {
    const email = payload.data?.attributes?.user_email?.trim().toLowerCase();
    if (email) {
      const userByEmail = await db.query.users.findFirst({
        where: eq(users.email, email),
        columns: { id: true },
      });
      userId = userByEmail?.id ?? null;
    }
  }

  if (!userId) {
    return Response.json({ error: "Unable to resolve user from webhook payload" }, { status: 400 });
  }

  const plan = resolvePlanFromPayload(payload);
  if (!plan) {
    return Response.json({ error: "Unable to resolve plan from payload" }, { status: 400 });
  }

  const existing = await db.query.processedTransactions.findFirst({
    where: eq(processedTransactions.transactionId, transactionId),
    columns: { id: true, status: true },
  });

  if (existing) {
    if (eventName === "order_refunded" && existing.status !== "refunded") {
      const now = new Date();
      const refundResult = await deductCreditsWithFloor({
        userId,
        eventType: "purchase_refund",
        maxUnitsToDeduct: getCreditsForPlan(plan),
        idempotencyKey: `purchase_refund:lemonsqueezy:${transactionId}`,
        metadata: {
          provider: "lemonsqueezy",
          transactionId,
          plan,
        },
      });
      const nextPlan = refundResult.balanceUnits > CREDIT_UNITS_PER_CREDIT ? plan : "free";
      await db
        .update(processedTransactions)
        .set({ status: "refunded", updatedAt: now })
        .where(eq(processedTransactions.transactionId, transactionId));
      await db
        .update(users)
        .set({
          plan: nextPlan,
          isPaid: refundResult.balanceUnits > CREDIT_UNITS_PER_CREDIT,
          creditBalance: refundResult.balanceUnits,
          updatedAt: now,
        })
        .where(eq(users.id, userId));
      return Response.json({ received: true, refunded: true });
    }

    return Response.json({ received: true, duplicate: true });
  }

  const now = new Date();
  const status = eventName === "order_refunded" ? "refunded" : "completed";

  await db.insert(processedTransactions).values({
    id: randomUUID(),
    userId,
    provider: "lemonsqueezy",
    transactionId,
    plan,
    status,
    createdAt: now,
    updatedAt: now,
  });

  if (eventName === "order_created") {
    const purchaseResult = await addCredits({
      userId,
      eventType: "purchase",
      addUnits: getCreditsForPlan(plan),
      idempotencyKey: `purchase:lemonsqueezy:${transactionId}`,
      metadata: {
        provider: "lemonsqueezy",
        transactionId,
        plan,
      },
    });

    await db
      .update(users)
      .set({
        plan,
        isPaid: true,
        creditBalance: purchaseResult.balanceUnits,
        updatedAt: now,
      })
      .where(eq(users.id, userId));
  }

  if (eventName === "order_refunded") {
    const refundResult = await deductCreditsWithFloor({
      userId,
      eventType: "purchase_refund",
      maxUnitsToDeduct: getCreditsForPlan(plan),
      idempotencyKey: `purchase_refund:lemonsqueezy:${transactionId}`,
      metadata: {
        provider: "lemonsqueezy",
        transactionId,
        plan,
      },
    });
    const nextPlan = refundResult.balanceUnits > CREDIT_UNITS_PER_CREDIT ? plan : "free";

    await db
      .update(users)
      .set({
        plan: nextPlan,
        isPaid: refundResult.balanceUnits > CREDIT_UNITS_PER_CREDIT,
        creditBalance: refundResult.balanceUnits,
        updatedAt: now,
      })
      .where(eq(users.id, userId));
  }

  return Response.json({ received: true });
}
