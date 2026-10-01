import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { TRPCError } from "@trpc/server";

import { AI_PROVIDERS, findProviderModel, type AiProviderId } from "@/lib/ai-providers";

/**
 * Calls a user's own AI provider with their key ("bring your own AI").
 *
 * OpenAI, Gemini and OpenRouter speak the OpenAI chat-completions shape, so one
 * client covers all three with a different base URL. Claude goes through the
 * official Anthropic SDK: its OpenAI-compatible endpoint is a shim for trying
 * things out, not for production traffic.
 *
 * Failures never fall back to Craftiv's own AI. That would quietly spend
 * credits the user turned this on to avoid -- they get an error that says what
 * to fix instead.
 */

export type OwnAiConnection = {
  provider: AiProviderId;
  model: string;
  apiKey: string;
};

export type OwnAiMessage = { role: string; content: string };

export type OwnAiRequest = {
  messages: OwnAiMessage[];
  maxTokens: number;
  temperature: number;
};

/** Fixed per provider and never user-supplied -- see lib/ai-providers.ts. */
const OPENAI_COMPATIBLE_BASE_URLS: Record<Exclude<AiProviderId, "anthropic">, string> = {
  openai: "https://api.openai.com/v1",
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai/",
  openrouter: "https://openrouter.ai/api/v1",
};

/**
 * Output ceiling for models that think before answering. Craftiv's prompts are
 * sized for its own non-thinking model; on a reasoning model the same small cap
 * gets spent on thinking and the answer comes back cut off. It is a ceiling, not
 * a target -- the user pays for what the model actually writes.
 */
const REASONING_MAX_OUTPUT_TOKENS = 16_000;

/**
 * OpenRouter checks the key's balance can cover max_tokens before it runs a
 * request, so a 16k ceiling would reject users with a few cents left.
 */
const OPENROUTER_MIN_OUTPUT_TOKENS = 8_000;

const REQUEST_TIMEOUT_MS = 120_000;

/** Claude models that take `effort` and the server-side refusal fallback. */
const CLAUDE_EFFORT_MODELS = new Set(["claude-opus-5-5", "claude-sonnet-5-5"]);

export class OwnAiError extends TRPCError {
  constructor(message: string, cause?: unknown) {
    super({ code: "BAD_REQUEST", message, cause });
    this.name = "OwnAiError";
  }
}

const SETTINGS_PATH = "Settings → Integrations";

function statusOf(error: unknown): number | "connection" | null {
  if (error instanceof OpenAI.APIConnectionError || error instanceof Anthropic.APIConnectionError) {
    return "connection";
  }
  if (error instanceof OpenAI.APIError || error instanceof Anthropic.APIError) {
    return error.status ?? null;
  }
  return null;
}

/**
 * Turns a provider failure into something the user can act on. Provider
 * messages for auth failures can echo part of the key, so those are replaced
 * outright rather than passed through.
 */
export function toOwnAiError(error: unknown, connection: Pick<OwnAiConnection, "provider" | "model">): OwnAiError {
  if (error instanceof OwnAiError) return error;

  const label = AI_PROVIDERS[connection.provider].label;
  const status = statusOf(error);

  if (status === "connection") {
    return new OwnAiError(`Couldn't reach ${label}. Please try again in a moment.`, error);
  }
  if (status === 401 || status === 403) {
    return new OwnAiError(
      `${label} rejected your API key. Check or replace it in ${SETTINGS_PATH}.`,
      error,
    );
  }
  if (status === 404) {
    return new OwnAiError(
      `${label} doesn't offer the model "${connection.model}" to your key. Pick another model in ${SETTINGS_PATH}.`,
      error,
    );
  }
  if (status === 402 || status === 429) {
    return new OwnAiError(
      `${label} says your key is rate-limited or out of quota. Check your ${label} billing, or switch back to Craftiv credits in ${SETTINGS_PATH}.`,
      error,
    );
  }

  const detail = error instanceof Error ? error.message.slice(0, 200) : "Unknown error";
  return new OwnAiError(`${label} returned an error: ${detail}`, error);
}

function openAiCompatibleClient(connection: OwnAiConnection): OpenAI {
  const provider = connection.provider as Exclude<AiProviderId, "anthropic">;
  return new OpenAI({
    apiKey: connection.apiKey,
    baseURL: OPENAI_COMPATIBLE_BASE_URLS[provider],
    timeout: REQUEST_TIMEOUT_MS,
    maxRetries: 1,
    defaultHeaders:
      provider === "openrouter"
        ? {
            "HTTP-Referer": process.env.BETTER_AUTH_URL || "http://localhost:3000",
            "X-Title": "Craftiv",
          }
        : undefined,
  });
}

function openAiCompatibleParams(connection: OwnAiConnection, request: OwnAiRequest) {
  const known = findProviderModel(connection.provider, connection.model);
  const messages = request.messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[];

  // A model ID the user typed in may be a reasoning model that rejects a
  // temperature, so only send one for models known to accept it.
  const temperature = known?.temperature ? { temperature: request.temperature } : {};

  if (connection.provider === "openai") {
    return {
      model: connection.model,
      messages,
      // Current OpenAI models reject `max_tokens`; this one counts reasoning too.
      max_completion_tokens: REASONING_MAX_OUTPUT_TOKENS,
      ...(known ? { reasoning_effort: "low" as const } : {}),
      ...temperature,
    };
  }

  if (connection.provider === "gemini") {
    return {
      model: connection.model,
      messages,
      max_tokens: REASONING_MAX_OUTPUT_TOKENS,
      reasoning_effort: "low" as const,
      ...temperature,
    };
  }

  return {
    model: connection.model,
    messages,
    max_tokens: Math.max(request.maxTokens, OPENROUTER_MIN_OUTPUT_TOKENS),
    ...temperature,
  };
}

function anthropicClient(connection: OwnAiConnection): Anthropic {
  return new Anthropic({
    apiKey: connection.apiKey,
    timeout: REQUEST_TIMEOUT_MS,
    maxRetries: 1,
  });
}

function anthropicParams(
  connection: OwnAiConnection,
  request: OwnAiRequest,
): Anthropic.Beta.Messages.MessageCreateParamsNonStreaming {
  const system = request.messages
    .filter((message) => message.role === "system")
    .map((message) => message.content)
    .join("\n\n");
  const messages: Anthropic.Beta.Messages.BetaMessageParam[] = request.messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: message.content,
    }));

  const known = findProviderModel("anthropic", connection.model);
  const takesEffort = CLAUDE_EFFORT_MODELS.has(connection.model);

  return {
    model: connection.model,
    max_tokens: REASONING_MAX_OUTPUT_TOKENS,
    messages,
    ...(system ? { system } : {}),
    // Opus 5.5 and Sonnet 5.5 reject a non-default temperature.
    ...(known?.temperature ? { temperature: request.temperature } : {}),
    ...(takesEffort
      ? {
          // Rewrites, scoring notes and short letters are routine work, so low
          // effort keeps them fast and cheap on the user's bill.
          output_config: { effort: "low" as const },
          // If a safety classifier declines, the API retries on another
          // model inside the same call instead of failing the action.
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default" as const,
        }
      : {}),
  };
}

function claudeText(response: Anthropic.Beta.Messages.BetaMessage): string {
  if (response.stop_reason === "refusal") {
    throw new OwnAiError("Claude declined this request. Try rephrasing it, or pick another model.");
  }
  return response.content
    .filter((block): block is Anthropic.Beta.Messages.BetaTextBlock => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();
}

/** One completion from the user's provider. Throws OwnAiError on any failure. */
export async function ownAiComplete(connection: OwnAiConnection, request: OwnAiRequest): Promise<string> {
  let content: string;
  try {
    if (connection.provider === "anthropic") {
      const response = await anthropicClient(connection).beta.messages.create(
        anthropicParams(connection, request),
      );
      content = claudeText(response);
    } else {
      const response = await openAiCompatibleClient(connection).chat.completions.create(
        openAiCompatibleParams(connection, request),
      );
      content = response.choices[0]?.message?.content?.trim() ?? "";
    }
  } catch (error) {
    throw toOwnAiError(error, connection);
  }

  if (!content) {
    throw new OwnAiError(
      `${AI_PROVIDERS[connection.provider].label} returned an empty response. Please try again, or pick another model.`,
    );
  }
  return content;
}

/** Streams text tokens from the user's provider. Throws OwnAiError on any failure. */
export async function* ownAiStream(
  connection: OwnAiConnection,
  request: OwnAiRequest,
): AsyncGenerator<string> {
  try {
    if (connection.provider === "anthropic") {
      const stream = anthropicClient(connection).beta.messages.stream(
        anthropicParams(connection, request),
      );
      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          yield event.delta.text;
        }
      }
      const final = await stream.finalMessage();
      if (final.stop_reason === "refusal") {
        throw new OwnAiError("Claude declined this request. Try rephrasing it, or pick another model.");
      }
      return;
    }

    const stream = await openAiCompatibleClient(connection).chat.completions.create({
      ...openAiCompatibleParams(connection, request),
      stream: true,
    });
    for await (const chunk of stream) {
      const token = chunk.choices?.[0]?.delta?.content ?? "";
      if (token) yield token;
    }
  } catch (error) {
    throw toOwnAiError(error, connection);
  }
}

/** Proves a key and model work before they are saved. */
export async function testOwnAi(connection: OwnAiConnection): Promise<void> {
  await ownAiComplete(connection, {
    messages: [{ role: "user", content: "Reply with the single word: ok" }],
    maxTokens: 16,
    temperature: 0,
  });
}
