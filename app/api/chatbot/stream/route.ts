import { NextRequest } from "next/server";
import { headers } from "next/headers";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

import { auth } from "@/lib/auth";
import { AI_MODEL, AI_MODEL_FALLBACK, openrouter } from "@/lib/ai";
import {
  CHATBOT_NO_CODE_REPLY,
  CHATBOT_SYSTEM_PROMPT,
  isProgrammingRelated,
} from "@/lib/chatbot-policy";
import {
  formatResumeLayoutResponseForChat,
  generateResumeLayoutResponse,
  isLikelyResumeLayoutPrompt,
} from "@/lib/resume-layout-assistant";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface StreamBody {
  message?: string;
  history?: ChatMessage[];
  resumeContext?: string;
  resumeFileName?: string;
}

interface OpenRouterErrorLike {
  message?: string;
  status?: number;
  code?: number | string;
  error?: {
    message?: string;
    code?: number | string;
    metadata?: {
      raw?: string;
      provider_name?: string;
      is_byok?: boolean;
    };
  };
}

function sseData(payload: unknown): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

function getChatbotModels(): string[] {
  const configured = (process.env.OPENROUTER_CHATBOT_MODELS ?? "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);

  const defaults = [AI_MODEL, "openai/gpt-4o-mini", AI_MODEL_FALLBACK];
  return Array.from(new Set([...configured, ...defaults]));
}

function getErrorStatus(error: unknown): number | null {
  const e = error as OpenRouterErrorLike;
  if (typeof e?.status === "number") return e.status;
  if (typeof e?.code === "number") return e.code;
  if (typeof e?.error?.code === "number") return e.error.code;
  return null;
}

function getErrorDetails(error: unknown): string {
  const e = error as OpenRouterErrorLike;
  return (
    e?.error?.metadata?.raw ||
    e?.error?.message ||
    e?.message ||
    "Unknown model error"
  );
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return new Response(
        encoder.encode(sseData({ type: "error", error: "Authentication required" })),
        {
          status: 401,
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
          },
        },
      );
    }

    const body = (await request.json()) as StreamBody;
    const message = body.message?.trim() ?? "";
    const history = (body.history ?? []).slice(-12);
    const resumeContext = body.resumeContext?.trim() ?? "";
    const resumeFileName = body.resumeFileName?.trim() ?? "";

    if (!message) {
      return new Response(
        encoder.encode(sseData({ type: "error", error: "Message is required" })),
        {
          status: 400,
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
          },
        },
      );
    }

    const stream = new ReadableStream<Uint8Array>({
      start: async (controller) => {
        let isClosed = false;
        const closeSafely = () => {
          if (isClosed) return;
          isClosed = true;
          controller.close();
        };
        const send = (payload: unknown) => {
          if (isClosed) return;
          try {
            controller.enqueue(encoder.encode(sseData(payload)));
          } catch {
            isClosed = true;
          }
        };

        try {
          if (isProgrammingRelated(message)) {
            send({ type: "delta", token: CHATBOT_NO_CODE_REPLY });
            send({ type: "done", blocked: true });
            closeSafely();
            return;
          }

          if (isLikelyResumeLayoutPrompt(message)) {
            const { reply } = await generateResumeLayoutResponse({
              message,
              history,
            });
            const formatted = formatResumeLayoutResponseForChat(reply);
            send({ type: "start", model: "resume-layout-assistant" });
            send({ type: "delta", token: formatted });
            send({ type: "done", blocked: false, model: "resume-layout-assistant" });
            closeSafely();
            return;
          }

          const historyMessages: ChatCompletionMessageParam[] = history.map((item) => ({
            role: item.role,
            content: item.content,
          }));

          const messages: ChatCompletionMessageParam[] = [
            { role: "system", content: CHATBOT_SYSTEM_PROMPT },
            ...historyMessages,
            {
              role: "user",
              content: resumeContext
                ? `Attached resume${resumeFileName ? ` (${resumeFileName})` : ""}:\n${resumeContext}\n\nUser request:\n${message}`
                : message,
            },
          ];

          const models = getChatbotModels();
          let streamed = false;
          let sawRateLimit = false;
          let sawUnavailableModel = false;

          for (const model of models) {
            try {
              const timeoutController = new AbortController();
              const timeout = setTimeout(() => timeoutController.abort(), 12000);
              let completion;
              try {
                completion = await openrouter.chat.completions.create({
                  model,
                  messages,
                  temperature: 0.7,
                  max_tokens: 900,
                  stream: true,
                }, { signal: timeoutController.signal });
              } finally {
                clearTimeout(timeout);
              }

              streamed = true;
              send({ type: "start", model });

              for await (const chunk of completion) {
                const token = chunk.choices?.[0]?.delta?.content ?? "";
                if (!token) continue;
                send({ type: "delta", token });
              }

              send({ type: "done", blocked: false, model });
              break;
            } catch (modelError) {
              const status = getErrorStatus(modelError);
              const details = getErrorDetails(modelError);
              if (status === 429) sawRateLimit = true;
              if (status === 404) sawUnavailableModel = true;
              console.error(`[Chatbot Stream] Model failed: ${model}`, modelError);
              console.error(`[Chatbot Stream] Failure detail (${model}): ${details}`);
            }
          }

          if (!streamed) {
            if (sawRateLimit) {
              send({
                type: "error",
                error: "AI is temporarily rate-limited upstream. Please retry in a few seconds.",
              });
            } else if (sawUnavailableModel) {
              send({
                type: "error",
                error: "A configured AI model is currently unavailable. Please contact support.",
              });
            } else {
              send({ type: "error", error: "All AI models failed to respond. Please try again later." });
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unexpected server error";
          send({ type: "error", error: errorMessage });
        } finally {
          closeSafely();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unexpected server error";
    return new Response(encoder.encode(sseData({ type: "error", error: errorMessage })), {
      status: 500,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }
}
