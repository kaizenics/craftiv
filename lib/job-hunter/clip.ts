import { PROMPT_INPUT_LIMITS } from "@/lib/constants/prompt-limits";

/**
 * The clipper payload: a job captured in the user's own browser, on a page they
 * are already looking at, and handed to Craftiv through the URL fragment.
 *
 * Why the fragment rather than a POST to an ingest endpoint:
 *
 *   - A cross-site POST does not carry the session cookie under SameSite=Lax,
 *     so it would need either a long-lived token living in a browser extension
 *     or CORS opened to a third-party origin with credentials. Both are worse.
 *   - A top-level GET navigation *is* allowed to carry the cookie under Lax.
 *   - The fragment is never sent to the server, so the job text reaches Craftiv
 *     only through the page's own same-origin tRPC call, after the user
 *     confirms it. Nothing is written by merely following a link.
 *
 * It also keeps the ToS position clean: the user is reading the page
 * themselves, in their own session, and choosing to copy it across. No server
 * of ours ever contacts the source.
 */

export const CLIP_FRAGMENT_KEY = "craftiv-clip";

export type ClippedJob = {
  url: string;
  title: string;
  company: string;
  location: string;
  description: string;
};

/** Keeps the fragment inside what browsers reliably carry in a URL. */
const MAX_FIELD = 200;

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const base64 = typeof btoa === "function" ? btoa(binary) : Buffer.from(binary, "binary").toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary =
    typeof atob === "function" ? atob(padded) : Buffer.from(padded, "base64").toString("binary");

  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * base64url of UTF-8 JSON.
 *
 * Encoded rather than passed as plain query params so a job description
 * containing `&`, `#` or a newline survives the round trip intact.
 */
export function encodeClip(job: ClippedJob): string {
  const trimmed: ClippedJob = {
    url: job.url.slice(0, 2048),
    title: job.title.slice(0, MAX_FIELD),
    company: job.company.slice(0, MAX_FIELD),
    location: job.location.slice(0, MAX_FIELD),
    description: job.description.slice(0, PROMPT_INPUT_LIMITS.jobDescription),
  };

  return toBase64Url(new TextEncoder().encode(JSON.stringify(trimmed)));
}

/**
 * Returns null on anything malformed rather than throwing.
 *
 * The fragment is attacker-controllable -- anyone can send someone a link with
 * a payload in it -- so this is treated as untrusted input. It only ever
 * prefills a form the user must then submit, and every field is length-capped
 * here as well as at the API.
 */
export function decodeClip(encoded: string): ClippedJob | null {
  if (!encoded) return null;

  try {
    const json = new TextDecoder().decode(fromBase64Url(encoded));
    const parsed = JSON.parse(json) as Partial<ClippedJob>;

    const description = typeof parsed.description === "string" ? parsed.description : "";
    const url = typeof parsed.url === "string" ? parsed.url : "";

    if (!description.trim() && !url.trim()) return null;

    return {
      url: url.slice(0, 2048),
      title: (typeof parsed.title === "string" ? parsed.title : "").slice(0, MAX_FIELD),
      company: (typeof parsed.company === "string" ? parsed.company : "").slice(0, MAX_FIELD),
      location: (typeof parsed.location === "string" ? parsed.location : "").slice(0, MAX_FIELD),
      description: description.slice(0, PROMPT_INPUT_LIMITS.jobDescription),
    };
  } catch {
    return null;
  }
}

/** Reads a clip out of a `#craftiv-clip=...` fragment. */
export function readClipFromHash(hash: string): ClippedJob | null {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!raw) return null;

  const params = new URLSearchParams(raw);
  const encoded = params.get(CLIP_FRAGMENT_KEY);
  return encoded ? decodeClip(encoded) : null;
}
