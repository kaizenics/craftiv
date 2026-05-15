import assert from "node:assert/strict";
import test from "node:test";

import { computeHmacSha256Hex, verifyHmacSignature } from "@/lib/security/webhook";

test("verifyHmacSignature accepts valid signatures", () => {
  const secret = "test-secret";
  const payload = JSON.stringify({ hello: "world" });
  const signature = computeHmacSha256Hex(secret, payload);

  const ok = verifyHmacSignature({
    payload,
    signature,
    secret,
  });

  assert.equal(ok, true);
});

test("verifyHmacSignature rejects invalid signatures", () => {
  const ok = verifyHmacSignature({
    payload: "{\"a\":1}",
    signature: "bad-signature",
    secret: "test-secret",
  });

  assert.equal(ok, false);
});

