import { NextRequest, NextResponse } from "next/server";
import { siteConfig } from "@/lib/seo";
import { publicErrorMessage } from "@/lib/errors";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { enforceApiRouteGuards } from "@/lib/security/guards";
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


/**
 * The one app origin the PDF renderer may fetch assets from. It comes from
 * config, not the request: request.url is built from the Host header, which a
 * caller can spoof to point the renderer at an internal host.
 */
function pdfAssetOrigin(request: Request): string {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.BETTER_AUTH_URL?.trim();
  if (configured) return configured;
  // Local development has no configured URL; localhost is all there is to reach.
  if (process.env.NODE_ENV === "development") return new URL(request.url).origin;
  return siteConfig.url;
}
export interface PdfRouteConfig {
  /** Route path, used for guards and logging. */
  route: string;
  /** Fallback file name when the request omits one. */
  defaultFileName: string;
}

/**
 * Shared handler for the resume and cover-letter PDF export routes. Handles auth,
 * rate-limit guards, payload validation, headless-Chromium rendering, and the PDF
 * response — parameterized by the small set of per-route differences. Downloads are
 * unlimited on every tier, so no credits are charged here.
 */
export async function handlePdfRoute(
  request: NextRequest,
  config: PdfRouteConfig,
): Promise<NextResponse> {
  let browser: Awaited<ReturnType<typeof launchPdfBrowser>> | null = null;

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

    if (!html || typeof html !== "string") {
      return NextResponse.json(
        { error: 'Invalid request body. Expected "html" string.' },
        { status: 400 },
      );
    }

    if (Buffer.byteLength(html, "utf8") > MAX_PDF_HTML_BYTES) {
      return NextResponse.json({ error: "HTML payload exceeds max size." }, { status: 413 });
    }

    const sanitizedHtml = sanitizeHtmlForPdf(html);
    browser = await launchPdfBrowser();

    const page = await browser.newPage({
      viewport: { width: 794, height: 1123 },
    });

    await hardenPdfPage(page, pdfAssetOrigin(request));
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

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[pdf] generation failed", error);
    return NextResponse.json(
      { error: publicErrorMessage(error, "Failed to generate PDF. Please try again.") },
      { status: 500 },
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
