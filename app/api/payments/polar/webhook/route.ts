import { and, desc, eq, ne } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks.js";

import { db } from "@/db";
import { processedTransactions, users } from "@/db/schema";
import { getProductPlanMap, type InternalPlan } from "@/lib/polar";
import { addCredits, deductCreditsWithFloor } from "@/lib/credits";
import { enforceRouteRateLimits } from "@/lib/security/guards";
import { securityLog, securityRequestId } from "@/lib/security/logging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE = "/api/payments/polar/webhook";
const PROVIDER = "polar";

/**
 * Only the two events that move credits. `order.paid` fires once the money has
 * actually settled, which is the event Polar recommends for fulfillment —
 * `order.created` can still be pending payment.
 */
type SupportedEvent = "order.paid" | "order.refunded";

function isSupportedEvent(eventType: string): eventType is SupportedEvent {
  return eventType === "order.paid" || eventType === "order.refunded";
}

/** The credits each pack grants, in credit units (100 units = 1 credit). */
function getCreditsForPlan(plan: InternalPlan): number {
  if (plan === "active") return 500;
  if (plan === "plus") return 1200;
  return 2500;
}

type OrderLike = {
  id?: string;
  productId?: string | null;
  metadata?: Record<string, unknown> | null;
  customer?: { externalId?: string | null; email?: string | null } | null;
};

/**
 * The product ID is what Polar actually charged for, so it wins. Checkout
 * metadata is only a fallback for products missing from the plan map.
 */
function resolvePlanFromOrder(order: OrderLike): InternalPlan | null {
  const productId = order.productId?.trim();
  const planFromProduct = productId ? getProductPlanMap().get(productId) : undefined;
  if (planFromProduct) return planFromProduct;

  const internalPlanRaw = order.metadata?.internal_plan;
  if (
    internalPlanRaw === "active" ||
    internalPlanRaw === "plus" ||
    internalPlanRaw === "pro"
  ) {
    return internalPlanRaw;
  }
  return null;
}

/**
 * Three ways home, in order of confidence: the metadata we set on the checkout,
 * the external customer ID we linked at checkout, then the billing email.
 */
async function resolveUserId(order: OrderLike): Promise<string | null> {
  const metadataUserId = order.metadata?.user_id;
  if (typeof metadataUserId === "string" && metadataUserId.trim()) {
    return metadataUserId.trim();
  }

  const externalId = order.customer?.externalId?.trim();
  if (externalId) return externalId;

  const email = order.customer?.email?.trim().toLowerCase();
  if (!email) return null;

  const userByEmail = await db.query.users.findFirst({
    where: eq(users.email, email),
    columns: { id: true },
  });
  return userByEmail?.id ?? null;
}

async function refundOrder(params: {
  userId: string;
  plan: InternalPlan;
  orderId: string;
  now: Date;
}) {
  await deductCreditsWithFloor({
    userId: params.userId,
    eventType: "purchase_refund",
    maxUnitsToDeduct: getCreditsForPlan(params.plan),
    idempotencyKey: `purchase_refund:${PROVIDER}:${params.orderId}`,
    metadata: { provider: PROVIDER, transactionId: params.orderId, plan: params.plan },
  });

  // The user stays paid while any other order of theirs is still standing.
  // creditBalance is deliberately not written here: deductCreditsWithFloor has
  // already committed it, and writing it again could erase a concurrent spend.
  const otherPaidOrder = await db.query.processedTransactions.findFirst({
    where: and(
      eq(processedTransactions.userId, params.userId),
      eq(processedTransactions.status, "completed"),
      ne(processedTransactions.transactionId, params.orderId),
    ),
    orderBy: desc(processedTransactions.createdAt),
    columns: { plan: true },
  });

  await db
    .update(users)
    .set({
      plan: otherPaidOrder ? (otherPaidOrder.plan as InternalPlan) : "free",
      isPaid: Boolean(otherPaidOrder),
      updatedAt: params.now,
    })
    .where(eq(users.id, params.userId));
}

export async function POST(request: Request) {
  const requestId = securityRequestId(request.headers.get("x-request-id"));
  const rateLimit = await enforceRouteRateLimits({
    category: "global",
    route: ROUTE,
    requestHeaders: request.headers,
    requestId,
  });
  if (!rateLimit.allowed) {
    return Response.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  const rawBody = await request.text();
  const webhookSecret = process.env.POLAR_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    securityLog("webhook_secret_missing", { requestId, route: ROUTE }, "error");
    return Response.json({ error: "Webhook is not configured." }, { status: 500 });
  }

  // Polar follows the Standard Webhooks spec: the signature covers the raw body
  // together with the webhook-id and webhook-timestamp headers.
  let event: { type: string; data: unknown };
  try {
    event = validateEvent(
      rawBody,
      Object.fromEntries(request.headers.entries()),
      webhookSecret,
    ) as { type: string; data: unknown };
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      securityLog("webhook_signature_invalid", { requestId, route: ROUTE }, "warn");
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }
    // Signature was fine but the payload is an event shape this SDK version does
    // not know. Acknowledge it so Polar stops retrying something we ignore.
    securityLog("webhook_payload_unrecognized", { requestId, route: ROUTE }, "warn");
    return Response.json({ received: true, ignored: true });
  }

  if (!isSupportedEvent(event.type)) {
    return Response.json({ received: true, ignored: true });
  }

  const order = event.data as OrderLike;
  const orderId = order.id?.trim();
  if (!orderId) {
    return Response.json({ error: "Missing order ID" }, { status: 400 });
  }

  const userId = await resolveUserId(order);
  if (!userId) {
    return Response.json(
      { error: "Unable to resolve user from webhook payload" },
      { status: 400 },
    );
  }

  const plan = resolvePlanFromOrder(order);
  if (!plan) {
    return Response.json({ error: "Unable to resolve plan from payload" }, { status: 400 });
  }

  const now = new Date();
  const existing = await db.query.processedTransactions.findFirst({
    where: eq(processedTransactions.transactionId, orderId),
    columns: { id: true, status: true },
  });

  // A refund always arrives after the paid event, so the order is normally
  // already on file — settle it against the existing row.
  if (existing) {
    if (event.type === "order.refunded" && existing.status !== "refunded") {
      await refundOrder({ userId, plan, orderId, now });
      await db
        .update(processedTransactions)
        .set({ status: "refunded", updatedAt: now })
        .where(eq(processedTransactions.transactionId, orderId));
      return Response.json({ received: true, refunded: true });
    }

    return Response.json({ received: true, duplicate: true });
  }

  // Fulfil first, record the order last. Every step is idempotent, so if any of
  // them fails Polar's retry finds no row and redoes the whole thing, instead
  // of seeing a "duplicate" for an order whose credits were never granted.
  if (event.type === "order.paid") {
    await addCredits({
      userId,
      eventType: "purchase",
      addUnits: getCreditsForPlan(plan),
      idempotencyKey: `purchase:${PROVIDER}:${orderId}`,
      metadata: { provider: PROVIDER, transactionId: orderId, plan },
    });

    // creditBalance is already committed by addCredits; writing it again here
    // could overwrite a spend that landed in between.
    await db
      .update(users)
      .set({ plan, isPaid: true, updatedAt: now })
      .where(eq(users.id, userId));
  }

  if (event.type === "order.refunded") {
    await refundOrder({ userId, plan, orderId, now });
  }

  await db
    .insert(processedTransactions)
    .values({
      id: randomUUID(),
      userId,
      provider: PROVIDER,
      transactionId: orderId,
      plan,
      status: event.type === "order.refunded" ? "refunded" : "completed",
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing({ target: processedTransactions.transactionId });

  return Response.json({ received: true });
}
