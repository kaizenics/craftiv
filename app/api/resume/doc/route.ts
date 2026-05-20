import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  buildInsufficientCreditsPayload,
  consumeCredits,
  InsufficientCreditsError,
  refundCredits,
  RESUME_DOWNLOAD_COST,
} from "@/lib/credits";
import { enforceApiRouteGuards } from "@/lib/security/guards";
import {
  MAX_PDF_HTML_BYTES,
  MAX_PDF_REQUEST_BYTES,
  sanitizeHtmlForPdf,
} from "@/lib/security/pdf";
import { parseJsonWithLimit } from "@/lib/security/request";
import { hashForLogs, securityLog } from "@/lib/security/logging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface WordRequestBody {
  html: string;
  fileName?: string;
  requestId?: string;
}

export async function POST(request: NextRequest) {
  let chargedRequest: { userId: string; idempotencyKey: string } | null = null;

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const guard = await enforceApiRouteGuards({
      request,
      route: "/api/resume/doc",
      category: "pdf_export",
      userId: session.user.id,
    });
    if (!guard.ok) {
      return guard.response;
    }

    const body = await parseJsonWithLimit<WordRequestBody>(request, MAX_PDF_REQUEST_BYTES);
    const html = body?.html;
    const fileName = (body?.fileName || "resume").replace(/[^\w.-]/g, "_");
    const requestId = body?.requestId?.trim() || crypto.randomUUID();

    if (!html || typeof html !== "string") {
      return NextResponse.json({ error: 'Invalid request body. Expected "html" string.' }, { status: 400 });
    }

    if (Buffer.byteLength(html, "utf8") > MAX_PDF_HTML_BYTES) {
      return NextResponse.json({ error: "HTML payload exceeds max size." }, { status: 413 });
    }

    const chargeIdempotencyKey = `resume_download:${session.user.id}:${requestId}`;
    const chargeResult = await consumeCredits({
      userId: session.user.id,
      eventType: "resume_download",
      costUnits: RESUME_DOWNLOAD_COST,
      idempotencyKey: chargeIdempotencyKey,
      metadata: {
        requestId,
        fileName,
        format: "doc",
      },
    });
    chargedRequest = { userId: session.user.id, idempotencyKey: chargeIdempotencyKey };

    securityLog("credits_consumed", {
      requestId: guard.requestId,
      route: "/api/resume/doc",
      userIdHash: hashForLogs(session.user.id),
      eventType: "resume_download",
      costUnits: RESUME_DOWNLOAD_COST,
      replayed: chargeResult.replayed,
      balanceUnits: chargeResult.balanceUnits,
    });

    const sanitizedHtml = sanitizeHtmlForPdf(html);
    const wordBytes = new TextEncoder().encode(sanitizedHtml);

    return new NextResponse(wordBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/msword",
        "Content-Disposition": `attachment; filename="${fileName}.doc"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (chargedRequest) {
      await refundCredits({
        userId: chargedRequest.userId,
        eventType: "resume_download_refund",
        refundUnits: RESUME_DOWNLOAD_COST,
        idempotencyKey: `refund:${chargedRequest.idempotencyKey}`,
        metadata: {
          reason: "render_failed",
        },
      });
    }

    if (error instanceof InsufficientCreditsError) {
      return NextResponse.json(buildInsufficientCreditsPayload(error), { status: 402 });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Failed to generate DOC. ${message}` }, { status: 500 });
  }
}
