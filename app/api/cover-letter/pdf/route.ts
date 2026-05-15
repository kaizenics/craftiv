import { NextRequest, NextResponse } from "next/server";
import { launchPdfBrowser } from "@/lib/server/launch-pdf-browser";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { enforceApiRouteGuards } from "@/lib/security/guards";
import { MAX_PDF_HTML_BYTES, hardenPdfPage, sanitizeHtmlForPdf } from "@/lib/security/pdf";
import { parseJsonWithLimit } from "@/lib/security/request";
import {
  buildInsufficientCreditsPayload,
  consumeCredits,
  COVER_LETTER_DOWNLOAD_COST,
  InsufficientCreditsError,
  refundCredits,
} from "@/lib/credits";
import { hashForLogs, securityLog } from "@/lib/security/logging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PDFRequestBody {
  html: string;
  fileName?: string;
  requestId?: string;
}

export async function POST(request: NextRequest) {
  let browser: Awaited<ReturnType<typeof launchPdfBrowser>> | null = null;
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
      route: "/api/cover-letter/pdf",
      category: "pdf_export",
      userId: session.user.id,
    });
    if (!guard.ok) {
      return guard.response;
    }

    const body = await parseJsonWithLimit<PDFRequestBody>(request, MAX_PDF_HTML_BYTES + 50_000);
    const html = body?.html;
    const fileName = (body?.fileName || "cover-letter").replace(/[^\w.-]/g, "_");
    const requestId = body?.requestId?.trim() || crypto.randomUUID();

    if (!html || typeof html !== "string") {
      return NextResponse.json(
        { error: 'Invalid request body. Expected "html" string.' },
        { status: 400 }
      );
    }

    if (Buffer.byteLength(html, "utf8") > MAX_PDF_HTML_BYTES) {
      return NextResponse.json({ error: "HTML payload exceeds max size." }, { status: 413 });
    }

    const chargeIdempotencyKey = `cl_download:${session.user.id}:direct_pdf:${requestId}`;
    const chargeResult = await consumeCredits({
      userId: session.user.id,
      eventType: "cover_letter_download",
      costUnits: COVER_LETTER_DOWNLOAD_COST,
      idempotencyKey: chargeIdempotencyKey,
      metadata: {
        requestId,
        source: "cover-letter-pdf-route",
      },
    });
    chargedRequest = { userId: session.user.id, idempotencyKey: chargeIdempotencyKey };

    securityLog("credits_consumed", {
      requestId: guard.requestId,
      route: "/api/cover-letter/pdf",
      userIdHash: hashForLogs(session.user.id),
      eventType: "cover_letter_download",
      costUnits: COVER_LETTER_DOWNLOAD_COST,
      replayed: chargeResult.replayed,
      balanceUnits: chargeResult.balanceUnits,
    });

    const sanitizedHtml = sanitizeHtmlForPdf(html);
    browser = await launchPdfBrowser();

    const page = await browser.newPage({
      viewport: {
        width: 794,
        height: 1123,
      },
    });

    await hardenPdfPage(page, new URL(request.url).origin);

    await page.setContent(sanitizedHtml, { waitUntil: "networkidle", timeout: 12_000 });
    await page.evaluate(async () => {
      if ("fonts" in document) {
        await document.fonts.ready;
      }
    });
    await page.emulateMedia({ media: "screen" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0",
      },
    });

    const pdfBytes = new Uint8Array(pdf);

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}.pdf"`,
        "Cache-Control": "no-store",
        "x-credit-balance-units": String(chargeResult.balanceUnits),
        "x-credit-balance": String(chargeResult.balanceUnits / 100),
        "x-credit-replayed": String(chargeResult.replayed),
      },
    });
  } catch (error) {
    if (chargedRequest) {
      await refundCredits({
        userId: chargedRequest.userId,
        eventType: "cover_letter_download_refund",
        refundUnits: COVER_LETTER_DOWNLOAD_COST,
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
    return NextResponse.json({ error: `Failed to generate PDF. ${message}` }, { status: 500 });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
