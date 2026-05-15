import { NextRequest } from "next/server";

type HeadersLike = {
  get(name: string): string | null;
};

export function getClientIpFromHeaders(headersLike: HeadersLike) {
  const forwarded = headersLike.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = headersLike.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const cfIp = headersLike.get("cf-connecting-ip")?.trim();
  if (cfIp) return cfIp;

  return "unknown";
}

export function getClientIp(request: NextRequest) {
  return getClientIpFromHeaders(request.headers);
}

export function assertContentLength(request: NextRequest | Request, maxBytes: number) {
  const raw = request.headers.get("content-length");
  if (!raw) return;
  const bytes = Number(raw);
  if (!Number.isFinite(bytes)) return;
  if (bytes > maxBytes) {
    throw new Error(`Payload too large. Max ${maxBytes} bytes.`);
  }
}

export async function parseJsonWithLimit<T>(request: NextRequest | Request, maxBytes: number): Promise<T> {
  const raw = await request.text();
  const size = Buffer.byteLength(raw, "utf8");
  if (size > maxBytes) {
    throw new Error(`Payload too large. Max ${maxBytes} bytes.`);
  }
  return JSON.parse(raw) as T;
}
