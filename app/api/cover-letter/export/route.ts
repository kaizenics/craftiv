import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { coverLetters } from "@/db/schema";
import { launchPdfBrowser } from "@/lib/server/launch-pdf-browser";
import {
  buildInsufficientCreditsPayload,
  consumeCredits,
  COVER_LETTER_DOWNLOAD_COST,
  InsufficientCreditsError,
  refundCredits,
} from "@/lib/credits";
import { enforceApiRouteGuards } from "@/lib/security/guards";
import { MAX_PDF_HTML_BYTES, hardenPdfPage, sanitizeHtmlForPdf } from "@/lib/security/pdf";
import { parseJsonWithLimit } from "@/lib/security/request";
import { hashForLogs, securityLog } from "@/lib/security/logging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ExportFormat = "pdf" | "docx" | "txt";

interface CoverLetterExportRequestBody {
  coverLetterId: string;
  requestId: string;
  format: ExportFormat;
  fileName?: string;
  html?: string;
  plainText?: string;
}

function toSafeFileName(value?: string) {
  return (value || "cover-letter").replace(/[^\w.-]/g, "_");
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
      route: "/api/cover-letter/export",
      category: "pdf_export",
      userId: session.user.id,
    });
    if (!guard.ok) {
      return guard.response;
    }

    const body = await parseJsonWithLimit<CoverLetterExportRequestBody>(request, MAX_PDF_HTML_BYTES + 120_000);
    const format = body?.format;
    const coverLetterId = body?.coverLetterId?.trim();
    const requestId = body?.requestId?.trim();
    const fileName = toSafeFileName(body?.fileName);

    if (!coverLetterId) {
      return NextResponse.json({ error: "coverLetterId is required." }, { status: 400 });
    }
    if (!requestId) {
      return NextResponse.json({ error: "requestId is required." }, { status: 400 });
    }
    if (format !== "pdf" && format !== "docx" && format !== "txt") {
      return NextResponse.json({ error: "Invalid export format." }, { status: 400 });
    }

    const ownedLetter = await db.query.coverLetters.findFirst({
      columns: { id: true },
      where: and(
        eq(coverLetters.id, coverLetterId),
        eq(coverLetters.userId, session.user.id),
      ),
    });
    if (!ownedLetter) {
      return NextResponse.json({ error: "Cover letter not found." }, { status: 404 });
    }

    if (format === "pdf" || format === "docx") {
      const html = body?.html;
      if (!html || typeof html !== "string") {
        return NextResponse.json({ error: "html is required for PDF/DOCX export." }, { status: 400 });
      }
      if (Buffer.byteLength(html, "utf8") > MAX_PDF_HTML_BYTES) {
        return NextResponse.json({ error: "HTML payload exceeds max size." }, { status: 413 });
      }
    } else {
      const plainText = body?.plainText;
      if (!plainText || typeof plainText !== "string") {
        return NextResponse.json({ error: "plainText is required for TXT export." }, { status: 400 });
      }
    }

    const chargeIdempotencyKey = `cl_download:${session.user.id}:${coverLetterId}:${format}:${requestId}`;
    const chargeResult = await consumeCredits({
      userId: session.user.id,
      eventType: "cover_letter_download",
      costUnits: COVER_LETTER_DOWNLOAD_COST,
      idempotencyKey: chargeIdempotencyKey,
      metadata: {
        coverLetterId,
        format,
        requestId,
      },
    });
    chargedRequest = { userId: session.user.id, idempotencyKey: chargeIdempotencyKey };

    securityLog("credits_consumed", {
      requestId: guard.requestId,
      route: "/api/cover-letter/export",
      userIdHash: hashForLogs(session.user.id),
      eventType: "cover_letter_download",
      costUnits: COVER_LETTER_DOWNLOAD_COST,
      replayed: chargeResult.replayed,
      balanceUnits: chargeResult.balanceUnits,
    });

    let outputBuffer: Uint8Array;
    let contentType: string;
    let extension: ExportFormat;

    if (format === "pdf") {
      const html = body?.html as string;
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

      outputBuffer = new Uint8Array(pdf);
      contentType = "application/pdf";
      extension = "pdf";
    } else if (format === "docx") {
      const html = body?.html as string;
      const sanitizedHtml = sanitizeHtmlForPdf(html);
      outputBuffer = new TextEncoder().encode(sanitizedHtml);
      contentType = "application/msword";
      extension = "docx";
    } else {
      const plainText = body?.plainText as string;
      outputBuffer = new TextEncoder().encode(plainText);
      contentType = "text/plain;charset=utf-8";
      extension = "txt";
    }

    return new NextResponse(new Blob([Buffer.from(outputBuffer)], { type: contentType }), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${fileName}.${extension}"`,
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
          reason: "export_failed",
        },
      });
    }
    if (error instanceof InsufficientCreditsError) {
      return NextResponse.json(buildInsufficientCreditsPayload(error), { status: 402 });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Failed to export cover letter. ${message}` }, { status: 500 });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
