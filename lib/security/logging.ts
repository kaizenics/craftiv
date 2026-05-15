import { createHash, randomUUID } from "node:crypto";

type SecurityEventLevel = "info" | "warn" | "error";

const inMemoryAlertCounters = new Map<string, { count: number; windowStartMs: number }>();
const ALERT_WINDOW_MS = 5 * 60 * 1000;

export function hashForLogs(value: string | null | undefined) {
  if (!value) return "unknown";
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

export function securityRequestId(existing: string | null | undefined) {
  const id = existing?.trim();
  return id && id.length > 0 ? id : randomUUID();
}

export function securityLog(event: string, payload: Record<string, unknown>, level: SecurityEventLevel = "info") {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    scope: "security",
    level,
    event,
    ...payload,
  });

  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.log(line);
}

export function recordSecurityAlertCounter(params: {
  key: string;
  threshold: number;
  requestId: string;
  details?: Record<string, unknown>;
}) {
  const nowMs = Date.now();
  const current = inMemoryAlertCounters.get(params.key);

  if (!current || nowMs - current.windowStartMs > ALERT_WINDOW_MS) {
    inMemoryAlertCounters.set(params.key, { count: 1, windowStartMs: nowMs });
    return;
  }

  current.count += 1;
  inMemoryAlertCounters.set(params.key, current);

  if (current.count === params.threshold) {
    securityLog(
      "threshold_reached",
      {
        alertKey: params.key,
        count: current.count,
        windowMs: ALERT_WINDOW_MS,
        requestId: params.requestId,
        ...(params.details ?? {}),
      },
      "warn",
    );
  }
}

