import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { afterEach, test } from "vitest";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks.js";

import { getPolarServer, getProductIdForPlan, getProductPlanMap } from "@/lib/polar";

const ACTIVE = "11111111-1111-4111-8111-111111111111";
const PLUS = "22222222-2222-4222-8222-222222222222";
const PRO = "33333333-3333-4333-8333-333333333333";

function setProductEnv() {
  process.env.POLAR_PRODUCT_ID_ACTIVE = ACTIVE;
  process.env.POLAR_PRODUCT_ID_PLUS = PLUS;
  process.env.POLAR_PRODUCT_ID_PRO = PRO;
}

afterEach(() => {
  delete process.env.POLAR_SERVER;
  delete process.env.POLAR_PRODUCT_ID_ACTIVE;
  delete process.env.POLAR_PRODUCT_ID_PLUS;
  delete process.env.POLAR_PRODUCT_ID_PRO;
});

test("POLAR_SERVER defaults to sandbox and rejects anything but the two environments", () => {
  assert.equal(getPolarServer(), "sandbox");

  process.env.POLAR_SERVER = "production";
  assert.equal(getPolarServer(), "production");

  process.env.POLAR_SERVER = "prod";
  assert.throws(() => getPolarServer(), /POLAR_SERVER/);
});

test("product IDs must be UUIDs", () => {
  setProductEnv();
  assert.equal(getProductIdForPlan("plus"), PLUS);

  // The usual mistake: pasting the checkout link or the product slug.
  process.env.POLAR_PRODUCT_ID_PLUS = "https://buy.polar.sh/polar_cl_abc123";
  assert.throws(() => getProductIdForPlan("plus"), /POLAR_PRODUCT_ID_PLUS/);
});

test("getProductPlanMap resolves every pack back to its plan", () => {
  setProductEnv();
  const map = getProductPlanMap();

  assert.equal(map.get(ACTIVE), "active");
  assert.equal(map.get(PLUS), "plus");
  assert.equal(map.get(PRO), "pro");
  assert.equal(map.get("44444444-4444-4444-8444-444444444444"), undefined);
});

// Polar signs webhooks per the Standard Webhooks spec, but its secret is a plain
// string rather than the base64 the spec assumes — the SDK base64-encodes it on
// the way in. This locks that handshake down: the webhook route passes the raw
// dashboard secret straight through, and a tampered body must not verify.
test("a Standard Webhooks signature made with the raw dashboard secret verifies", () => {
  const secret = "polar_whs_raw_dashboard_secret";
  const body = JSON.stringify({ type: "order.paid", data: { id: "order_123" } });
  const webhookId = "msg_2Yn8k1";
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const signature = createHmac("sha256", Buffer.from(secret, "utf-8"))
    .update(`${webhookId}.${timestamp}.${body}`)
    .digest("base64");

  const headers = {
    "webhook-id": webhookId,
    "webhook-timestamp": timestamp,
    "webhook-signature": `v1,${signature}`,
  };

  // The minimal body above fails schema parsing, which is fine — what matters is
  // that it gets that far, i.e. the signature itself was accepted.
  assert.throws(
    () => validateEvent(body, headers, secret),
    (error: unknown) => !(error instanceof WebhookVerificationError),
  );

  assert.throws(
    () => validateEvent(`${body} `, headers, secret),
    (error: unknown) => error instanceof WebhookVerificationError,
  );
});
