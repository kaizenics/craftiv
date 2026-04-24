import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  callWithFallback,
  extractJsonObject,
  buildCoverLetterFromResumePrompt,
  buildCoverLetterFromEditorPrompt,
} from "@/lib/ai";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });
    const plan = user?.plan ?? "free";
    if (plan === "free") {
      return NextResponse.json(
        { error: "AI cover letter generation is available on Plus and Pro plans." },
        { status: 403 }
      );
    }

    const body = (await request.json()) as {
      resumeText?: string;
      mode?: "resume" | "editor";
      targetJobTitle?: string;
      companyName?: string;
      hiringManagerName?: string;
      candidateContext?: string;
      existingDraft?: string;
    };

    const mode = body.mode ?? "resume";

    if (
      mode === "resume" &&
      (!body.resumeText || body.resumeText.trim().length < 20)
    ) {
      return NextResponse.json(
        { error: "Resume text is too short to generate a cover letter." },
        { status: 400 }
      );
    }

    if (mode === "editor" && !body.targetJobTitle?.trim()) {
      return NextResponse.json(
        { error: "Target job title is required." },
        { status: 400 }
      );
    }

    const prompt =
      mode === "editor"
        ? buildCoverLetterFromEditorPrompt({
            targetJobTitle: body.targetJobTitle!.trim(),
            companyName: body.companyName,
            hiringManagerName: body.hiringManagerName,
            candidateContext: body.candidateContext || "",
            existingDraft: body.existingDraft,
          })
        : buildCoverLetterFromResumePrompt(body.resumeText!.trim());

    console.log(
      `[CoverLetter Generate] Generating in ${mode} mode`
    );

    const { content: aiContent, model } = await callWithFallback({
      messages: [{ role: "user", content: prompt }],
      maxTokens: 2000,
      temperature: 0.7,
    });

    console.log(`[CoverLetter Generate] Done — model: ${model}`);

    const parsed = extractJsonObject(aiContent);

    const normalizePlainText = (text: string) =>
      text
        .replace(/```[\s\S]*?```/g, "")
        .replace(/^["']|["']$/g, "")
        .trim();

    const content =
      mode === "editor"
        ? normalizePlainText(aiContent)
        : parsed?.content ||
          [parsed?.opening, parsed?.body, parsed?.closing]
            .filter(Boolean)
            .join("\n\n");

    if (!content) {
      console.error(
        "[CoverLetter Generate] Invalid JSON from AI:",
        aiContent.slice(0, 500)
      );
      return NextResponse.json(
        { error: "AI returned an unexpected format. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      content,
    });
  } catch (error: any) {
    console.error("[CoverLetter Generate] Error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
