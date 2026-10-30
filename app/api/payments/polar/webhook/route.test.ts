import { createHmac } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";

/**
 * The webhook is the only way a payment becomes credits, so these go through
 * the real route with a genuinely signed request rather than a mocked SDK.
 */

const SECRET = "test-polar-webhook-secret";

let POST: typeof import("./route").POST;

beforeAll(async () => {
  process.env.POLAR_WEBHOOK_SECRET = SECRET;
  ({ POST } = await import("./route"));
});

/** Signs the body the way Polar does (Standard Webhooks, secret used as raw bytes). */
function signedRequest(payload: unknown): Request {
  const body = JSON.stringify(payload);
  const id = "msg_test";
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = createHmac("sha256", Buffer.from(SECRET, "utf-8"))
    .update(`${id}.${timestamp}.${body}`)
    .digest("base64");

  return new Request("http://localhost/api/payments/polar/webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "webhook-id": id,
      "webhook-timestamp": timestamp,
      "webhook-signature": `v1,${signature}`,
    },
    body,
  });
}

describe("Polar webhook", () => {
  it("asks Polar to retry a signed payment it cannot read, so the order is not lost", async () => {
    // Valid signature, but a shape the SDK's schema rejects (e.g. a field Polar added later).
    const response = await POST(signedRequest({ type: "order.paid", timestamp: "now", data: { id: 42 } }));

    expect(response.status).toBe(500);
  });

  it("acknowledges a signed event type it does not handle, so Polar stops resending it", async () => {
    const response = await POST(signedRequest({ type: "something.new", timestamp: "now", data: {} }));

    expect(response.status).toBe(200);
  });
});
