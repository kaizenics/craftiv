import { JobSourceError } from "./types";
import type { JobSourceId } from "@/lib/types/job-hunter";

/**
 * The polite HTTP client every scraping source goes through.
 *
 * Deliberately minimal and deliberately honest. It identifies itself, obeys the
 * host's declared crawl delay, caps what it will read, and stops when a site
 * says stop. There is no proxy rotation, no browser fingerprint spoofing and no
 * CAPTCHA handling here, and none should be added: the moment a source has to be
 * tricked into answering, the answer is to stop asking it, not to try harder.
 */

/** Identifies the crawler and points at somewhere a site owner can reach us. */
export const CRAWLER_USER_AGENT =
  "CraftivJobHunter/1.0 (+https://craftiv.app/contact; imports jobs for our own signed-in users)";

const MAX_RESPONSE_BYTES = 1_500_000;
const REQUEST_TIMEOUT_MS = 15_000;

/**
 * Last request time per host, so the crawl delay holds across concurrent
 * callers in this process.
 *
 * Process-local, which is honest about its limit: at two replicas each would
 * keep its own clock and the effective rate would double. The scheduled path
 * runs single-flight behind the hunt_runs claim, so that is not reachable
 * today -- but if this is ever called outside that claim, move the gate to the
 * DB-backed limiter in lib/security/rate-limit.ts, which is cross-replica.
 */
const lastRequestAt = new Map<string, number>();
const pending = new Map<string, Promise<void>>();

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/** Serialises per host so two concurrent callers cannot both skip the delay. */
async function waitForTurn(host: string, crawlDelaySeconds: number) {
  const delayMs = Math.max(0, crawlDelaySeconds * 1000);
  if (delayMs === 0) return;

  const previous = pending.get(host) ?? Promise.resolve();

  const turn = previous.then(async () => {
    const last = lastRequestAt.get(host);
    if (last !== undefined) {
      const waitMs = last + delayMs - Date.now();
      if (waitMs > 0) await sleep(waitMs);
    }
    lastRequestAt.set(host, Date.now());
  });

  pending.set(
    host,
    turn.catch(() => undefined),
  );

  await turn;
}

export type PoliteFetchOptions = {
  source: JobSourceId;
  crawlDelaySeconds: number;
  signal?: AbortSignal;
};

/**
 * Fetches one public page as text.
 *
 * Throws a typed JobSourceError so callers can distinguish "back off and retry"
 * from "this will never work" without parsing messages.
 */
export async function politeFetchText(
  url: URL,
  options: PoliteFetchOptions,
): Promise<string> {
  if (url.protocol !== "https:") {
    throw new JobSourceError(options.source, "PERMANENT", "Only https URLs are fetched.");
  }

  await waitForTurn(url.hostname, options.crawlDelaySeconds);

  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const signal = options.signal
    ? AbortSignal.any([options.signal, timeout])
    : timeout;

  let response: Response;
  try {
    response = await fetch(url, {
      signal,
      redirect: "follow",
      headers: {
        "User-Agent": CRAWLER_USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en",
      },
    });
  } catch (error) {
    throw new JobSourceError(
      options.source,
      "TRANSIENT",
      `Request failed: ${error instanceof Error ? error.message : "unknown error"}`,
    );
  }

  // 403 and 429 are the site telling us to stop. Treat them as such rather than
  // as something to retry around.
  if (response.status === 403) {
    throw new JobSourceError(
      options.source,
      "AUTH",
      "The source refused the request (403). Automated access appears to be blocked.",
    );
  }

  if (response.status === 429) {
    throw new JobSourceError(options.source, "RATE_LIMITED", "Rate limited by the source (429).");
  }

  if (response.status >= 500) {
    throw new JobSourceError(options.source, "TRANSIENT", `Source error ${response.status}.`);
  }

  if (!response.ok) {
    throw new JobSourceError(options.source, "PERMANENT", `Unexpected status ${response.status}.`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!/text\/html|text\/plain|application\/xhtml/i.test(contentType)) {
    throw new JobSourceError(options.source, "PERMANENT", `Unexpected content type: ${contentType}`);
  }

  const body = await response.text();
  return body.length > MAX_RESPONSE_BYTES ? body.slice(0, MAX_RESPONSE_BYTES) : body;
}

/** Test seam: clears the per-host crawl-delay clock. */
export function __resetCrawlDelayState() {
  lastRequestAt.clear();
  pending.clear();
}
