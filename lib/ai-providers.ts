/**
 * The AI providers a user can connect their own key for ("bring your own AI").
 *
 * Kept free of server-only imports so the settings UI renders the same catalog
 * the server validates against. Base URLs live server-side in lib/own-ai.ts and
 * are never user-supplied: a user-chosen URL would turn "test my key" into a
 * request our server makes to any address they like.
 */

export const AI_PROVIDER_IDS = [
  "openai",
  "anthropic",
  "gemini",
  "openrouter",
  "groq",
  "deepseek",
  "mistral",
  "xai",
  "together",
  "fireworks",
  "cerebras",
  "perplexity",
  "huggingface",
  "sambanova",
  "nebius",
  "moonshot",
  "qwen",
  "novita",
  "cohere",
  "deepinfra",
  "hyperbolic",
  "zai",
  "minimax",
  "featherless",
] as const;
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
  groq: {
    id: "groq",
    label: "Groq",
    keyUrl: "https://console.groq.com/keys",
    keyPlaceholder: "gsk_...",
    defaultModel: "llama-3.3-70b-versatile",
    models: [
      { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B", hint: "Very fast", temperature: true },
      { id: "openai/gpt-oss-120b", label: "GPT-OSS 120B", hint: "Open-weight, more capable", temperature: true },
    ],
  },
  deepseek: {
    id: "deepseek",
    label: "DeepSeek",
    keyUrl: "https://platform.deepseek.com/api_keys",
    keyPlaceholder: "sk-...",
    defaultModel: "deepseek-chat",
    models: [
      { id: "deepseek-chat", label: "DeepSeek Chat", hint: "Low cost", temperature: true },
      { id: "deepseek-reasoner", label: "DeepSeek Reasoner", hint: "Thinks before answering", temperature: false },
    ],
  },
  mistral: {
    id: "mistral",
    label: "Mistral",
    keyUrl: "https://console.mistral.ai/api-keys",
    keyPlaceholder: "Your Mistral key",
    defaultModel: "mistral-small-latest",
    models: [
      { id: "mistral-small-latest", label: "Mistral Small", hint: "Fast and low cost", temperature: true },
      { id: "mistral-large-latest", label: "Mistral Large", hint: "Most capable", temperature: true },
    ],
  },
  xai: {
    id: "xai",
    label: "xAI (Grok)",
    keyUrl: "https://console.x.ai",
    keyPlaceholder: "xai-...",
    defaultModel: "grok-3-mini",
    models: [
      { id: "grok-3-mini", label: "Grok 3 mini", hint: "Fast and low cost", temperature: true },
      { id: "grok-4", label: "Grok 4", hint: "Most capable", temperature: false },
    ],
  },
  together: {
    id: "together",
    label: "Together AI",
    keyUrl: "https://api.together.xyz/settings/api-keys",
    keyPlaceholder: "Your Together key",
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    models: [
      { id: "meta-llama/Llama-3.3-70B-Instruct-Turbo", label: "Llama 3.3 70B Turbo", hint: "Fast open model", temperature: true },
      { id: "deepseek-ai/DeepSeek-V3", label: "DeepSeek V3", hint: "Capable open model", temperature: true },
    ],
  },
  fireworks: {
    id: "fireworks",
    label: "Fireworks AI",
    keyUrl: "https://fireworks.ai/account/api-keys",
    keyPlaceholder: "fw_...",
    defaultModel: "accounts/fireworks/models/llama-v3p3-70b-instruct",
    models: [
      { id: "accounts/fireworks/models/llama-v3p3-70b-instruct", label: "Llama 3.3 70B", hint: "Fast open model", temperature: true },
      { id: "accounts/fireworks/models/deepseek-v3", label: "DeepSeek V3", hint: "Capable open model", temperature: true },
    ],
  },
  cerebras: {
    id: "cerebras",
    label: "Cerebras",
    keyUrl: "https://cloud.cerebras.ai",
    keyPlaceholder: "csk-...",
    defaultModel: "llama-3.3-70b",
    models: [
      { id: "llama-3.3-70b", label: "Llama 3.3 70B", hint: "Extremely fast", temperature: true },
      { id: "gpt-oss-120b", label: "GPT-OSS 120B", hint: "Open-weight, more capable", temperature: true },
    ],
  },
  perplexity: {
    id: "perplexity",
    label: "Perplexity",
    keyUrl: "https://www.perplexity.ai/settings/api",
    keyPlaceholder: "pplx-...",
    defaultModel: "sonar",
    models: [
      { id: "sonar", label: "Sonar", hint: "Fast, searches the web", temperature: true },
      { id: "sonar-pro", label: "Sonar Pro", hint: "More capable", temperature: true },
    ],
  },
  huggingface: {
    id: "huggingface",
    label: "Hugging Face",
    keyUrl: "https://huggingface.co/settings/tokens",
    keyPlaceholder: "hf_...",
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct",
    models: [
      { id: "meta-llama/Llama-3.3-70B-Instruct", label: "Llama 3.3 70B", hint: "Open model", temperature: true },
      { id: "Qwen/Qwen2.5-72B-Instruct", label: "Qwen 2.5 72B", hint: "Open model", temperature: true },
    ],
  },
  sambanova: {
    id: "sambanova",
    label: "SambaNova",
    keyUrl: "https://cloud.sambanova.ai/apis",
    keyPlaceholder: "Your SambaNova key",
    defaultModel: "Meta-Llama-3.3-70B-Instruct",
    models: [
      { id: "Meta-Llama-3.3-70B-Instruct", label: "Llama 3.3 70B", hint: "Very fast", temperature: true },
      { id: "DeepSeek-V3-0324", label: "DeepSeek V3", hint: "Capable open model", temperature: true },
    ],
  },
  nebius: {
    id: "nebius",
    label: "Nebius AI Studio",
    keyUrl: "https://studio.nebius.com/settings/api-keys",
    keyPlaceholder: "Your Nebius key",
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct",
    models: [
      { id: "meta-llama/Llama-3.3-70B-Instruct", label: "Llama 3.3 70B", hint: "Open model", temperature: true },
      { id: "deepseek-ai/DeepSeek-V3", label: "DeepSeek V3", hint: "Capable open model", temperature: true },
    ],
  },
  moonshot: {
    id: "moonshot",
    label: "Moonshot (Kimi)",
    keyUrl: "https://platform.moonshot.ai/console/api-keys",
    keyPlaceholder: "sk-...",
    defaultModel: "kimi-k2-0905-preview",
    models: [
      { id: "kimi-k2-0905-preview", label: "Kimi K2", hint: "Capable, long context", temperature: true },
      { id: "moonshot-v1-8k", label: "Moonshot v1 8K", hint: "Low cost", temperature: true },
    ],
  },
  qwen: {
    id: "qwen",
    label: "Alibaba Qwen",
    keyUrl: "https://modelstudio.console.alibabacloud.com/?tab=playground#/api-key",
    keyPlaceholder: "sk-...",
    defaultModel: "qwen-plus",
    models: [
      { id: "qwen-plus", label: "Qwen Plus", hint: "Balanced", temperature: true },
      { id: "qwen-turbo", label: "Qwen Turbo", hint: "Fast and low cost", temperature: true },
    ],
  },
  novita: {
    id: "novita",
    label: "Novita AI",
    keyUrl: "https://novita.ai/settings/key-management",
    keyPlaceholder: "Your Novita key",
    defaultModel: "meta-llama/llama-3.3-70b-instruct",
    models: [
      { id: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B", hint: "Open model", temperature: true },
      { id: "deepseek/deepseek-v3-0324", label: "DeepSeek V3", hint: "Capable open model", temperature: true },
    ],
  },
  cohere: {
    id: "cohere",
    label: "Cohere",
    keyUrl: "https://dashboard.cohere.com/api-keys",
    keyPlaceholder: "Your Cohere key",
    defaultModel: "command-a-03-2025",
    models: [
      { id: "command-a-03-2025", label: "Command A", hint: "Most capable", temperature: true },
      { id: "command-r7b-12-2024", label: "Command R7B", hint: "Fast and low cost", temperature: true },
    ],
  },
  deepinfra: {
    id: "deepinfra",
    label: "DeepInfra",
    keyUrl: "https://deepinfra.com/dash/api_keys",
    keyPlaceholder: "Your DeepInfra key",
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    models: [
      { id: "meta-llama/Llama-3.3-70B-Instruct-Turbo", label: "Llama 3.3 70B Turbo", hint: "Low cost", temperature: true },
      { id: "deepseek-ai/DeepSeek-V3", label: "DeepSeek V3", hint: "Capable open model", temperature: true },
    ],
  },
  hyperbolic: {
    id: "hyperbolic",
    label: "Hyperbolic",
    keyUrl: "https://app.hyperbolic.xyz/settings",
    keyPlaceholder: "Your Hyperbolic key",
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct",
    models: [
      { id: "meta-llama/Llama-3.3-70B-Instruct", label: "Llama 3.3 70B", hint: "Open model", temperature: true },
      { id: "deepseek-ai/DeepSeek-V3", label: "DeepSeek V3", hint: "Capable open model", temperature: true },
    ],
  },
  zai: {
    id: "zai",
    label: "Z.ai (GLM)",
    keyUrl: "https://z.ai/manage-apikey/apikey-list",
    keyPlaceholder: "Your Z.ai key",
    defaultModel: "glm-4.5",
    models: [
      { id: "glm-4.5", label: "GLM-4.5", hint: "Most capable", temperature: true },
      { id: "glm-4.5-air", label: "GLM-4.5 Air", hint: "Fast and low cost", temperature: true },
    ],
  },
  minimax: {
    id: "minimax",
    label: "MiniMax",
    keyUrl: "https://www.minimax.io/platform/user-center/basic-information/interface-key",
    keyPlaceholder: "Your MiniMax key",
    defaultModel: "MiniMax-M1",
    models: [
      { id: "MiniMax-M1", label: "MiniMax M1", hint: "Long context", temperature: true },
      { id: "MiniMax-Text-01", label: "MiniMax Text 01", hint: "Low cost", temperature: true },
    ],
  },
  featherless: {
    id: "featherless",
    label: "Featherless",
    keyUrl: "https://featherless.ai/account/api-keys",
    keyPlaceholder: "Your Featherless key",
    defaultModel: "meta-llama/Llama-3.3-70B-Instruct",
    models: [
      { id: "meta-llama/Llama-3.3-70B-Instruct", label: "Llama 3.3 70B", hint: "Open model", temperature: true },
      { id: "Qwen/Qwen2.5-72B-Instruct", label: "Qwen 2.5 72B", hint: "Open model", temperature: true },
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
