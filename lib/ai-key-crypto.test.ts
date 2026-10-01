import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "vitest";

import { AiKeyEncryptionConfigError, decryptApiKey, encryptApiKey } from "@/lib/ai-key-crypto";

const SECRET = "test-secret-that-is-definitely-long-enough-0123456789";
let previous: string | undefined;

beforeEach(() => {
  previous = process.env.AI_KEY_ENCRYPTION_KEY;
  process.env.AI_KEY_ENCRYPTION_KEY = SECRET;
});

afterEach(() => {
  process.env.AI_KEY_ENCRYPTION_KEY = previous;
});

test("round-trips a key", () => {
  const key = "sk-proj-abcdefghijklmnopqrstuvwxyz0123456789";
  assert.equal(decryptApiKey(encryptApiKey(key)), key);
});

test("never stores the key in readable form, and never repeats a ciphertext", () => {
  const key = "sk-ant-abcdefghijklmnopqrstuvwxyz";
  const a = encryptApiKey(key);
  const b = encryptApiKey(key);

  assert.ok(!a.includes(key));
  assert.notEqual(a, b);
});

test("rejects a tampered ciphertext instead of returning garbage", () => {
  const stored = encryptApiKey("AIzaSyAbcdefghijklmnopqrstuvwxyz");
  const parts = stored.split(".");
  const ciphertext = Buffer.from(parts[3], "base64url");
  ciphertext[0] ^= 0xff;
  parts[3] = ciphertext.toString("base64url");

  assert.throws(() => decryptApiKey(parts.join(".")));
});

test("a rotated secret cannot read keys stored under the old one", () => {
  const stored = encryptApiKey("sk-or-abcdefghijklmnopqrstuvwxyz");
  process.env.AI_KEY_ENCRYPTION_KEY = `${SECRET}-rotated`;

  assert.throws(() => decryptApiKey(stored));
});

test("refuses to run without a real secret", () => {
  process.env.AI_KEY_ENCRYPTION_KEY = "short";
  assert.throws(() => encryptApiKey("sk-anything-long-enough-here"), AiKeyEncryptionConfigError);
});
