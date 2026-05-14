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
} from "@/lib/credits";

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

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = (await request.json()) as CoverLetterExportRequestBody;
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

    let outputBuffer: Uint8Array;
    let contentType: string;
    let extension: ExportFormat;

    if (format === "pdf") {
      const html = body?.html;
      if (!html || typeof html !== "string") {
        return NextResponse.json({ error: "html is required for PDF export." }, { status: 400 });
      }

      browser = await launchPdfBrowser();
      const page = await browser.newPage({
        viewport: {
          width: 794,
          height: 1123,
        },
      });

      await page.setContent(html, { waitUntil: "networkidle" });
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
      const html = body?.html;
      if (!html || typeof html !== "string") {
        return NextResponse.json({ error: "html is required for DOCX export." }, { status: 400 });
      }
      outputBuffer = new TextEncoder().encode(html);
      contentType = "application/msword";
      extension = "docx";
    } else {
      const plainText = body?.plainText;
      if (!plainText || typeof plainText !== "string") {
        return NextResponse.json({ error: "plainText is required for TXT export." }, { status: 400 });
      }
      outputBuffer = new TextEncoder().encode(plainText);
      contentType = "text/plain;charset=utf-8";
      extension = "txt";
    }

    const chargeResult = await consumeCredits({
      userId: session.user.id,
      eventType: "cover_letter_download",
      costUnits: COVER_LETTER_DOWNLOAD_COST,
      idempotencyKey: `cl_download:${session.user.id}:${coverLetterId}:${format}:${requestId}`,
      metadata: {
        coverLetterId,
        format,
        requestId,
      },
    });

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
