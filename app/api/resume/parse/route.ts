import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { MAX_UPLOAD_BYTES } from "@/lib/constants/files";
import { extractTextFromFile, getUploadKind } from "@/lib/file-parsing";
import { hasImportableContent, parseResumeText } from "@/lib/resume-import/parse-resume-text";
import { enforceApiRouteGuards } from "@/lib/security/guards";
import { assertContentLength } from "@/lib/security/request";

/**
 * Turns an uploaded PDF or Word resume into resume data.
 *
 * Deterministic: the file's text layer is read on the server and structured by
 * lib/resume-import, with no model call and no credit charge. It used to send the
 * text to a model and bill 0.5 credits, so every upload -- including resumes
 * attached in chat and on the cover-letter page -- cost tokens, for a job rules do
 * well on text-based resumes.
 *
 * The rate-limit category is left as it was: loosening abuse limits is a separate
 * decision from dropping the charge.
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

    const data = parseResumeText(extractedText.slice(0, MAX_IMPORT_CHARS), {
      source: isPDF ? "pdf" : "docx",
    });

    if (!hasImportableContent(data)) {
      return NextResponse.json(
        {
          error:
            "We read the file but couldn't find resume sections in it. Check it uses headings like Experience, Education and Skills, or build your resume from a template instead.",
        },
        { status: 422 },
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[Resume Import] Error:", error);
    return NextResponse.json(
      { error: (error instanceof Error ? error.message : "") || "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
