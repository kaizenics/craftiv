import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { generateResumeLayoutResponse } from "@/lib/resume-layout-assistant";
import type { ResumeLayoutChatRequest } from "@/lib/types/resume-layout-chat";

const MAX_PROMPT_CHARS = 1400;
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = (await request.json()) as ResumeLayoutChatRequest;
    const message = body.message?.trim() ?? "";
    const history = (body.history ?? []).filter((item) => item?.content?.trim());

    if (!message) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    if (message.length > MAX_PROMPT_CHARS) {
      return NextResponse.json(
        { error: `Prompt is too long. Keep it under ${MAX_PROMPT_CHARS} characters.` },
        { status: 400 },
      );
    }

    const { reply, meta } = await generateResumeLayoutResponse({
      message,
      history,
    });

    return NextResponse.json({
      ok: true,
      reply,
      meta,
    });
  } catch (error) {
    console.error("[resume-layout-chat] unexpected error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error while generating layout recommendation.",
      },
      { status: 500 },
    );
  }
}
