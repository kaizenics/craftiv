import { createHmac, timingSafeEqual } from "node:crypto";

export function computeHmacSha256Hex(secret: string, payload: string) {
  return createHmac("sha256", secret).update(payload, "utf8").digest("hex");
}

export function verifyHmacSignature(params: {
  payload: string;
  signature: string | null;
  secret: string;
}) {
  const received = params.signature?.trim().toLowerCase();
  if (!received) return false;

  const expected = computeHmacSha256Hex(params.secret, params.payload);
  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(received, "utf8");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

