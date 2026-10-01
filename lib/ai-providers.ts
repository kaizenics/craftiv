/**
 * The AI providers a user can connect their own key for ("bring your own AI").
 *
 * Kept free of server-only imports so the settings UI renders the same catalog
 * the server validates against. Base URLs live server-side in lib/own-ai.ts and
 * are never user-supplied: a user-chosen URL would turn "test my key" into a
 * request our server makes to any address they like.
 */

export const AI_PROVIDER_IDS = ["openai", "anthropic", "gemini", "openrouter"] as const;
export type AiProviderId = (typeof AI_PROVIDER_IDS)[number];

export type AiProviderModel = {
  id: string;
  label: string;
  hint: string;
  /** Whether the model accepts a non-default temperature. Newer reasoning models reject one. */
  temperature: boolean;
};

export type AiProviderInfo = {
  id: AiProviderId;
  label: string;
  /** Where the user creates a key. */
  keyUrl: string;
  keyPlaceholder: string;
  models: AiProviderModel[];
  defaultModel: string;
};

/**
 * Suggested models per provider. Users can also type any model ID their key has
 * access to -- the list goes stale faster than a release cycle, and the save
 * flow tests the model before storing it, so a wrong ID never gets saved.
 */
export const AI_PROVIDERS: Record<AiProviderId, AiProviderInfo> = {
  openai: {
    id: "openai",
    label: "OpenAI",
    keyUrl: "https://platform.openai.com/api-keys",
    keyPlaceholder: "sk-...",
    defaultModel: "gpt-5-mini",
    models: [
      { id: "gpt-5-mini", label: "GPT-5 mini", hint: "Fast and low cost", temperature: false },
      { id: "gpt-5.4-mini", label: "GPT-5.4 mini", hint: "Newer small model", temperature: false },
      { id: "gpt-5.5", label: "GPT-5.5", hint: "Most capable, highest cost", temperature: false },
    ],
  },
  anthropic: {
    id: "anthropic",
    label: "Anthropic (Claude)",
    keyUrl: "https://platform.claude.com/settings/keys",
    keyPlaceholder: "sk-ant-...",
    defaultModel: "claude-opus-5-5",
    models: [
      { id: "claude-opus-5-5", label: "Claude Opus 5.5", hint: "Most capable", temperature: false },
      { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5", hint: "Balanced speed and quality", temperature: false },
      { id: "claude-haiku-4-5", label: "Claude Haiku 4.5", hint: "Fastest, lowest cost", temperature: true },
    ],
  },
  gemini: {
    id: "gemini",
    label: "Google Gemini",
    keyUrl: "https://aistudio.google.com/apikey",
    keyPlaceholder: "AIza...",
    defaultModel: "gemini-3.5-flash",
    models: [
      { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash", hint: "Stable, long-term support", temperature: true },
      { id: "gemini-3.8-flash", label: "Gemini 3.8 Flash", hint: "Newest Flash model", temperature: true },
      { id: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash-Lite", hint: "Lowest cost", temperature: true },
    ],
  },
  openrouter: {
    id: "openrouter",
    label: "OpenRouter",
    keyUrl: "https://openrouter.ai/settings/keys",
    keyPlaceholder: "sk-or-...",
    defaultModel: "google/gemini-3.5-flash",
    models: [
      { id: "google/gemini-3.5-flash", label: "Gemini 3.5 Flash", hint: "Fast and low cost", temperature: true },
      { id: "openai/gpt-5-mini", label: "GPT-5 mini", hint: "OpenAI via OpenRouter", temperature: false },
    ],
  },
};

/** Model IDs across providers: `gpt-5-mini`, `google/gemini-3.5-flash`, `claude-opus-5-5`. */
export const MODEL_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/@-]{0,99}$/;

export const API_KEY_MIN_LENGTH = 20;
export const API_KEY_MAX_LENGTH = 400;

export function isAiProviderId(value: string): value is AiProviderId {
  return (AI_PROVIDER_IDS as readonly string[]).includes(value);
}

export function findProviderModel(provider: AiProviderId, modelId: string): AiProviderModel | undefined {
  return AI_PROVIDERS[provider].models.find((model) => model.id === modelId);
}

/**
 * What the UI shows of a saved key. The full key never leaves the server after
 * it is saved, so this is computed once at save time and stored.
 */
export function apiKeyHint(apiKey: string): string {
  const trimmed = apiKey.trim();
  return `…${trimmed.slice(-4)}`;
}
