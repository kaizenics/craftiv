import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { MAX_UPLOAD_BYTES } from "@/lib/constants/files";
import { extractTextFromFile, getUploadKind } from "@/lib/file-parsing";
import { hasImportableContent, parseResumeText } from "@/lib/resume-import/parse-resume-text";
import {
  aiParseResumeText,
  isThinImport,
  looksLikeLinkedInExport,
} from "@/lib/resume-import/ai-parse";
import { enforceApiRouteGuards } from "@/lib/security/guards";
import { assertContentLength } from "@/lib/security/request";

/**
 * Turns an uploaded PDF or Word resume into resume data. Always free.
 *
 * The file's text layer is structured by the rule-based parser in
 * lib/resume-import first, which handles clean resumes well at no cost. Only
 * when that isn't enough -- a LinkedIn "Save to PDF" export, or a file the rules
 * found little in -- does it fall back to Craftiv's AI (ai-parse.ts), still with
 * no credit charge. If the AI fails, the rules' result is used.
 *
 * The ai_heavy rate limit bounds how often an account can reach the AI path.
 */

/** Far beyond any real resume; bounds the parser's work on hostile input. */
const MAX_IMPORT_CHARS = 60_000;

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
      route: "/api/resume/parse",
      category: "ai_heavy",
      userId: session.user.id,
    });
    if (!guard.ok) {
      return guard.response;
    }

    assertContentLength(request, 11_000_000);
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const requestedSource = formData.get("source") === "linkedin" ? "linkedin" : "file";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "File size exceeds 10MB limit" }, { status: 400 });
    }

    const { isPDF, isSupported } = getUploadKind(file.name);

    if (!isSupported) {
      return NextResponse.json({ error: "Only PDF and DOCX files are supported" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let extractedText: string;
    try {
      extractedText = await extractTextFromFile(buffer, isPDF, { fieldGaps: true });
    } catch (parseError) {
      console.error("[Resume Import] File extraction error:", parseError);
      return NextResponse.json(
        { error: "Failed to read file content. The file may be corrupted or password-protected." },
        { status: 422 },
      );
    }

    if (!extractedText || extractedText.trim().length < 20) {
      return NextResponse.json(
        {
          error:
            "We couldn't find any text in this file. It may be a scanned image — try the original PDF or a Word file instead.",
        },
        { status: 422 },
      );
    }

    const text = extractedText.slice(0, MAX_IMPORT_CHARS);
    let data = parseResumeText(text, { source: isPDF ? "pdf" : "docx" });
    let parsedBy: "rules" | "ai" = "rules";

    const isLinkedIn = requestedSource === "linkedin" || looksLikeLinkedInExport(text);
    if (isLinkedIn || isThinImport(data)) {
      const aiData = await aiParseResumeText(text);
      if (aiData && hasImportableContent(aiData)) {
        data = aiData;
        parsedBy = "ai";
      }
    }

    if (!hasImportableContent(data)) {
      return NextResponse.json(
        {
          error:
            "We read the file but couldn't find resume sections in it. Check it uses headings like Experience, Education and Skills, or build your resume from a template instead.",
        },
        { status: 422 },
      );
    }

    return NextResponse.json({ data, parsedBy });
  } catch (error) {
    console.error("[Resume Import] Error:", error);
    return NextResponse.json(
      { error: "Something went wrong while reading your resume. Please try again." },
      { status: 500 },
    );
  }
}
