import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { enforceApiRouteGuards } from "@/lib/security/guards";
import {
  MAX_PDF_HTML_BYTES,
  MAX_PDF_REQUEST_BYTES,
  sanitizeHtmlForPdf,
} from "@/lib/security/pdf";
import { parseJsonWithLimit } from "@/lib/security/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface WordRequestBody {
  html: string;
  fileName?: string;
  requestId?: string;
}

export async function POST(request: NextRequest) {
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

    if (!html || typeof html !== "string") {
      return NextResponse.json({ error: 'Invalid request body. Expected "html" string.' }, { status: 400 });
    }

    if (Buffer.byteLength(html, "utf8") > MAX_PDF_HTML_BYTES) {
      return NextResponse.json({ error: "HTML payload exceeds max size." }, { status: 413 });
    }

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
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Failed to generate DOC. ${message}` }, { status: 500 });
  }
}
