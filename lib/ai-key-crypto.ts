import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * Encryption at rest for users' own AI provider keys.
 *
 * AES-256-GCM, so a tampered or truncated ciphertext fails to decrypt rather
 * than decrypting to garbage that would then be sent to a provider. The key is
 * derived from AI_KEY_ENCRYPTION_KEY with SHA-256, which lets ops paste any
 * long random string (e.g. `openssl rand -base64 32`) without caring about
 * encoding.
 *
 * A leaked database dump alone does not expose anyone's keys; it takes the dump
 * and this secret together. Rotating the secret makes every stored key
 * unreadable, which lib/own-ai-access.ts reports to the user as "re-enter your
 * key" rather than failing silently.
 */

const VERSION = "v1";
const IV_BYTES = 12;
const MIN_SECRET_LENGTH = 32;

export class AiKeyEncryptionConfigError extends Error {}

function getEncryptionKey(): Buffer {
  const secret = process.env.AI_KEY_ENCRYPTION_KEY?.trim() ?? "";
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new AiKeyEncryptionConfigError(
      `AI_KEY_ENCRYPTION_KEY must be set to at least ${MIN_SECRET_LENGTH} characters.`,
    );
  }
  return createHash("sha256").update(secret).digest();
}

export function encryptApiKey(plaintext: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv, tag, ciphertext].map((part) =>
    typeof part === "string" ? part : part.toString("base64url"),
  ).join(".");
}

/** Throws when the value was not produced by encryptApiKey with the current secret. */
export function decryptApiKey(stored: string): string {
  const [version, iv, tag, ciphertext] = stored.split(".");
  if (version !== VERSION || !iv || !tag || ciphertext === undefined) {
    throw new Error("Unrecognised encrypted key format.");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(iv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
