import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { coverLetters } from "@/db/schema";
import { launchPdfBrowser } from "@/lib/server/launch-pdf-browser";
import { enforceApiRouteGuards } from "@/lib/security/guards";
import {
  MAX_PDF_HTML_BYTES,
  MAX_PDF_REQUEST_BYTES,
  hardenPdfPage,
  sanitizeHtmlForPdf,
} from "@/lib/security/pdf";
import { parseJsonWithLimit } from "@/lib/security/request";

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

    const guard = await enforceApiRouteGuards({
      request,
      route: "/api/cover-letter/export",
      category: "pdf_export",
      userId: session.user.id,
    });
    if (!guard.ok) {
      return guard.response;
    }

    const body = await parseJsonWithLimit<CoverLetterExportRequestBody>(request, MAX_PDF_REQUEST_BYTES);
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
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Failed to export cover letter. ${message}` }, { status: 500 });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
