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
import {
  buildInsufficientCreditsPayload,
  CHATBOT_STREAM_COST,
  InsufficientCreditsError,
  newChargeIdempotencyKey,
  refundCredits,
} from "@/lib/credits";
import { ownAiStream, type OwnAiMessage } from "@/lib/own-ai";
import { beginAiAction } from "@/lib/own-ai-access";
import { enforceRouteRateLimits } from "@/lib/security/guards";
import { parseJsonWithLimit } from "@/lib/security/request";
import { hashForLogs, securityLog, securityRequestId } from "@/lib/security/logging";

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
  let chargedRequest: { userId: string; idempotencyKey: string } | null = null;

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

    const requestId = securityRequestId(request.headers.get("x-request-id"));
    const limitResult = await enforceRouteRateLimits({
      category: "ai_heavy",
      route: "/api/chatbot/stream",
      requestHeaders: request.headers,
      userId: session.user.id,
      requestId,
    });
    if (!limitResult.allowed) {
      return new Response(
        encoder.encode(sseData({ type: "error", error: "Too many requests. Please try again later." })),
        {
          status: 429,
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "Retry-After": String(limitResult.retryAfterSeconds),
          },
        },
      );
    }

    const body = await parseJsonWithLimit<StreamBody>(request, 60_000);
    const message = body.message?.trim() ?? "";
    const history = (body.history ?? [])
      .filter(
        (item): item is ChatMessage =>
          (item?.role === "user" || item?.role === "assistant") &&
          typeof item?.content === "string" &&
          item.content.length > 0 &&
          item.content.length <= 2000,
      )
      .slice(-12);
    const resumeContext = (body.resumeContext?.trim() ?? "").slice(0, 20_000);
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
    if (message.length > 2_000) {
      return new Response(
        encoder.encode(sseData({ type: "error", error: "Message is too long." })),
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

    if (isProgrammingRelated(message)) {
      return new Response(
        encoder.encode(
          `${sseData({ type: "delta", token: CHATBOT_NO_CODE_REPLY })}${sseData({ type: "done", blocked: true })}`,
        ),
        {
          status: 200,
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
          },
        },
      );
    }

    // Server-owned, deliberately not `requestId`: that one echoes the caller's
    // x-request-id header for log correlation, and keying the charge on it lets
    // a client replay a single key forever and never be charged again.
    const chargeIdempotencyKey = newChargeIdempotencyKey("chatbot_stream", session.user.id);
    const { ai, charge: chargeResult } = await beginAiAction({
      userId: session.user.id,
      eventType: "chatbot_stream",
      costUnits: CHATBOT_STREAM_COST,
      idempotencyKey: chargeIdempotencyKey,
      metadata: {
        requestId,
      },
    });
    if (chargeResult) {
      chargedRequest = { userId: session.user.id, idempotencyKey: chargeIdempotencyKey };

      securityLog("credits_consumed", {
        requestId,
        route: "/api/chatbot/stream",
        userIdHash: hashForLogs(session.user.id),
        eventType: "chatbot_stream",
        costUnits: CHATBOT_STREAM_COST,
        replayed: chargeResult.replayed,
        balanceUnits: chargeResult.balanceUnits,
      });
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
          if (isLikelyResumeLayoutPrompt(message)) {
            const { reply } = await generateResumeLayoutResponse({
              message,
              history,
              ai,
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

          // The user's own provider: one model, no fallback list, and no
          // first-token timeout -- their model may think before it answers.
          // A failure throws to the catch below, which reports it.
          if (ai.source === "own") {
            send({ type: "start", model: ai.model });
            for await (const token of ownAiStream(ai, {
              messages: messages as OwnAiMessage[],
              maxTokens: 900,
              temperature: 0.7,
            })) {
              send({ type: "delta", token });
            }
            send({ type: "done", blocked: false, model: ai.model });
            return;
          }

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
              if (chargedRequest) {
                await refundCredits({
                  userId: chargedRequest.userId,
                  eventType: "chatbot_stream_refund",
                  refundUnits: CHATBOT_STREAM_COST,
                  idempotencyKey: `refund:${chargedRequest.idempotencyKey}`,
                  metadata: {
                    reason: "upstream_rate_limited",
                  },
                });
              }
            } else if (sawUnavailableModel) {
              send({
                type: "error",
                error: "A configured AI model is currently unavailable. Please contact support.",
              });
              if (chargedRequest) {
                await refundCredits({
                  userId: chargedRequest.userId,
                  eventType: "chatbot_stream_refund",
                  refundUnits: CHATBOT_STREAM_COST,
                  idempotencyKey: `refund:${chargedRequest.idempotencyKey}`,
                  metadata: {
                    reason: "model_unavailable",
                  },
                });
              }
            } else {
              send({ type: "error", error: "All AI models failed to respond. Please try again later." });
              if (chargedRequest) {
                await refundCredits({
                  userId: chargedRequest.userId,
                  eventType: "chatbot_stream_refund",
                  refundUnits: CHATBOT_STREAM_COST,
                  idempotencyKey: `refund:${chargedRequest.idempotencyKey}`,
                  metadata: {
                    reason: "all_models_failed",
                  },
                });
              }
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unexpected server error";
          send({ type: "error", error: errorMessage });
          if (chargedRequest) {
            await refundCredits({
              userId: chargedRequest.userId,
              eventType: "chatbot_stream_refund",
              refundUnits: CHATBOT_STREAM_COST,
              idempotencyKey: `refund:${chargedRequest.idempotencyKey}`,
              metadata: {
                reason: "stream_exception",
              },
            });
          }
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
    if (error instanceof InsufficientCreditsError) {
      return new Response(encoder.encode(sseData(buildInsufficientCreditsPayload(error))), {
        status: 402,
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }
    if (chargedRequest) {
      await refundCredits({
        userId: chargedRequest.userId,
        eventType: "chatbot_stream_refund",
        refundUnits: CHATBOT_STREAM_COST,
        idempotencyKey: `refund:${chargedRequest.idempotencyKey}`,
        metadata: {
          reason: "route_exception",
        },
      });
    }
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
