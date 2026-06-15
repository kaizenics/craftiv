import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import {
  buildInsufficientCreditsPayload,
  consumeCredits,
  InsufficientCreditsError,
  refundCredits,
  type ServerCreditEventType,
} from "@/lib/credits";
import { enforceApiRouteGuards } from "@/lib/security/guards";
import { hashForLogs, securityLog } from "@/lib/security/logging";
import {
  MAX_PDF_HTML_BYTES,
  MAX_PDF_REQUEST_BYTES,
  hardenPdfPage,
  sanitizeHtmlForPdf,
} from "@/lib/security/pdf";
import { parseJsonWithLimit } from "@/lib/security/request";
import { launchPdfBrowser } from "@/lib/server/launch-pdf-browser";

interface PdfRequestBody {
  html: string;
  fileName?: string;
  requestId?: string;
}

export interface PdfRouteConfig {
  /** Route path, used for guards and logging. */
  route: string;
  /** Fallback file name when the request omits one. */
  defaultFileName: string;
  /** Credit event charged for a successful render. */
  eventType: ServerCreditEventType;
  costUnits: number;
  /** Builds the idempotency key for the charge (each route keys differently). */
  buildIdempotencyKey: (userId: string, requestId: string) => string;
  /** Builds the credit-event metadata. */
  buildMetadata: (params: { requestId: string; fileName: string }) => Record<string, unknown>;
  /** When true, echo the post-charge balance on the response headers. */
  includeCreditHeaders?: boolean;
}

/**
 * Shared handler for the resume and cover-letter PDF export routes. Handles auth,
 * rate-limit guards, payload validation, credit charge (with refund on failure),
 * headless-Chromium rendering, and the PDF response — parameterized by the small
 * set of per-route differences.
 */
export async function handlePdfRoute(
  request: NextRequest,
  config: PdfRouteConfig,
): Promise<NextResponse> {
  let browser: Awaited<ReturnType<typeof launchPdfBrowser>> | null = null;
  let chargedRequest: { userId: string; idempotencyKey: string } | null = null;

  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const guard = await enforceApiRouteGuards({
      request,
      route: config.route,
      category: "pdf_export",
      userId: session.user.id,
    });
    if (!guard.ok) {
      return guard.response;
    }

    const body = await parseJsonWithLimit<PdfRequestBody>(request, MAX_PDF_REQUEST_BYTES);
    const html = body?.html;
    const fileName = (body?.fileName || config.defaultFileName).replace(/[^\w.-]/g, "_");
    const requestId = body?.requestId?.trim() || crypto.randomUUID();

    if (!html || typeof html !== "string") {
      return NextResponse.json(
        { error: 'Invalid request body. Expected "html" string.' },
        { status: 400 },
      );
    }

    if (Buffer.byteLength(html, "utf8") > MAX_PDF_HTML_BYTES) {
      return NextResponse.json({ error: "HTML payload exceeds max size." }, { status: 413 });
    }

    const chargeIdempotencyKey = config.buildIdempotencyKey(session.user.id, requestId);
    const chargeResult = await consumeCredits({
      userId: session.user.id,
      eventType: config.eventType,
      costUnits: config.costUnits,
      idempotencyKey: chargeIdempotencyKey,
      metadata: config.buildMetadata({ requestId, fileName }),
    });
    chargedRequest = { userId: session.user.id, idempotencyKey: chargeIdempotencyKey };

    securityLog("credits_consumed", {
      requestId: guard.requestId,
      route: config.route,
      userIdHash: hashForLogs(session.user.id),
      eventType: config.eventType,
      costUnits: config.costUnits,
      replayed: chargeResult.replayed,
      balanceUnits: chargeResult.balanceUnits,
    });

    const sanitizedHtml = sanitizeHtmlForPdf(html);
    browser = await launchPdfBrowser();

    const page = await browser.newPage({
      viewport: { width: 794, height: 1123 },
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
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });

    const pdfBytes = new Uint8Array(pdf);

    const responseHeaders: Record<string, string> = {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}.pdf"`,
      "Cache-Control": "no-store",
    };
    if (config.includeCreditHeaders) {
      responseHeaders["x-credit-balance-units"] = String(chargeResult.balanceUnits);
      responseHeaders["x-credit-balance"] = String(chargeResult.balanceUnits / 100);
      responseHeaders["x-credit-replayed"] = String(chargeResult.replayed);
    }

    return new NextResponse(pdfBytes, { status: 200, headers: responseHeaders });
  } catch (error) {
    if (chargedRequest) {
      await refundCredits({
        userId: chargedRequest.userId,
        eventType: `${config.eventType}_refund`,
        refundUnits: config.costUnits,
        idempotencyKey: `refund:${chargedRequest.idempotencyKey}`,
        metadata: { reason: "render_failed" },
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
