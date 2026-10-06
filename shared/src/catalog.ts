// ============================================================
// NutEgg Provider Catalog & Configuration Resolver
// ============================================================

import type {
  AIProviderId,
  ModelFamily,
  NutEggAISettings,
  ProviderInfo,
  ResolvedConfig,
} from "./types";

export const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

// Reviewed 2026-10-05 against provider pricing and OpenRouter's live catalog.
// Prefer economical general-purpose models; keep stronger and useful legacy
// choices available. Direct-provider aliases and OpenRouter IDs can differ.
const OPENROUTER_FAMILIES: ModelFamily[] = [
  {
    id: "openai",
    label: "OpenAI GPT & Reasoning",
    defaultModel: "openai/gpt-6.1-sol",
    models: [
      "openai/gpt-6-luna",
      "openai/gpt-6.1-sol",
      "openai/gpt-6-astra",
    ],
  },
  {
    id: "anthropic",
    label: "Anthropic Claude",
    defaultModel: "anthropic/claude-sonnet-5",
    models: [
      "anthropic/claude-sonnet-5.5",
      "anthropic/claude-opus-5.5",
      "anthropic/claude-fable-5.1",
      "anthropic/claude-sonnet-5",
      "anthropic/claude-opus-5",
    ],
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    defaultModel: "deepseek/deepseek-chat",
    models: [
      "deepseek/deepseek-v4.1-flash",
      "deepseek/deepseek-v4-pro",
      "deepseek/deepseek-chat",
    ],
  },
  {
    id: "google",
    label: "Google Gemini",
    defaultModel: "google/gemini-3.8-flash",
    models: [
      "google/gemini-3.8-flash",
    ],
  },
  {
    id: "meta",
    label: "Meta Llama",
    defaultModel: "meta-llama/llama-4-scout",
    models: [
      "meta-llama/llama-4-scout",
      "meta-llama/llama-4-maverick",
      "meta-llama/llama-3.3-70b-instruct",
    ],
  },
  {
    id: "qwen",
    label: "Qwen",
    defaultModel: "qwen/qwen3.7-flash",
    models: [
      "qwen/qwen3.7-flash",
      "qwen/qwen3.8-flash",
      "qwen/qwen3.7-plus",
      "qwen/qwen3.8-max-0902",
    ],
  },
  {
    id: "custom",
    label: "Custom OpenRouter Model",
    defaultModel: "openai/gpt-6-luna",
    models: [],
  },
];

export const PROVIDER_CATALOG: Record<AIProviderId, ProviderInfo> = {
  local: {
    id: "local",
    label: "Local LLM (Ollama, LM Studio, etc.)",
    officialEndpoint: "http://127.0.0.1:11434/v1/chat/completions",
    apiFormat: "openai-compatible",
    keyPlaceholder: "Optional for local LLMs",
    openrouterPrefix: "",
  },
  openrouter: {
    id: "openrouter",
    label: "OpenRouter (Multi-Provider)",
    officialEndpoint: OPENROUTER_ENDPOINT,
    apiFormat: "openai-compatible",
    defaultModel: "openai/gpt-6-luna",
    families: OPENROUTER_FAMILIES,
    models: OPENROUTER_FAMILIES.flatMap((family) => family.models),
    keyPlaceholder: "sk-or-...",
    openrouterPrefix: "",
  },
  anthropic: {
    id: "anthropic",
    label: "Anthropic (Claude)",
    officialEndpoint: "https://api.anthropic.com/v1/messages",
    apiFormat: "anthropic",
    defaultModel: "claude-haiku-4-5-20251001",
    models: [
      "claude-haiku-4-5-20251001",
      "claude-sonnet-5-5",
      "claude-opus-5-5",
      "claude-fable-5-1",
      "claude-sonnet-5",
      "claude-opus-5",
    ],
    keyPlaceholder: "sk-ant-...",
    openrouterPrefix: "anthropic/",
  },
  openai: {
    id: "openai",
    label: "OpenAI",
    officialEndpoint: "https://api.openai.com/v1/chat/completions",
    apiFormat: "openai-compatible",
    defaultModel: "gpt-6-luna",
    models: [
      "gpt-6-luna",
      "gpt-6.1-sol",
      "gpt-6-astra",
      "gpt-5.6-sol",
      "gpt-5.6-terra",
      "gpt-5.6-luna",
    ],
    keyPlaceholder: "sk-...",
    openrouterPrefix: "openai/",
  },
  gemini: {
    id: "gemini",
    label: "Google Gemini",
    officialEndpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    apiFormat: "openai-compatible",
    defaultModel: "gemini-3.1-flash-lite",
    models: [
      "gemini-3.1-flash-lite",
      "gemini-3.5-flash-lite",
      "gemini-3.8-flash",
    ],
    keyPlaceholder: "AIza...",
    openrouterPrefix: "google/",
  },
  deepseek: {
    id: "deepseek",
    label: "DeepSeek",
    officialEndpoint: "https://api.deepseek.com/v1/chat/completions",
    apiFormat: "openai-compatible",
    defaultModel: "deepseek-chat",
    models: [
      "deepseek-chat",
      "deepseek-reasoner",
      "deepseek-flash",
      "deepseek-v4-pro",
    ],
    keyPlaceholder: "sk-...",
    openrouterPrefix: "deepseek/",
  },
  kimi: {
    id: "kimi",
    label: "Kimi (Moonshot)",
    officialEndpoint: "https://api.moonshot.cn/v1/chat/completions",
    apiFormat: "openai-compatible",
    defaultModel: "kimi-k2.6",
    models: [
      "kimi-k2.6",
      "kimi-k3",
      "kimi-k2.7-code",
      "kimi-k2.7-code-highspeed",
    ],
    keyPlaceholder: "sk-...",
    openrouterPrefix: "moonshot/",
  },
  zhipu: {
    id: "zhipu",
    label: "Zhipu (GLM)",
    officialEndpoint: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    apiFormat: "openai-compatible",
    defaultModel: "glm-5.3-flash",
    models: [
      "glm-5.3-flash",
      "glm-5.3",
      "glm-5",
      "glm-5-turbo",
      "glm-4.7",
      "glm-4.7-flash",
    ],
    keyPlaceholder: "...",
    openrouterPrefix: "zhipu/",
  },
  qwen: {
    id: "qwen",
    label: "Qwen (Tongyi)",
    officialEndpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    apiFormat: "openai-compatible",
    defaultModel: "qwen3.7-flash",
    models: [
      "qwen3.7-flash",
      "qwen3.8-flash",
      "qwen3.7-plus",
      "qwen3.8-max",
      "qwen3-max",
      "qwen3-plus",
      "qwen3-flash",
      "qwen-max",
      "qwen-plus",
      "qwen-turbo",
    ],
    keyPlaceholder: "sk-...",
    openrouterPrefix: "qwen/",
  },
};

export function findOpenRouterFamily(modelName: string): ModelFamily | undefined {
  const families = PROVIDER_CATALOG.openrouter.families || [];
  if (families.length === 0) return undefined;
  const exact = families.find((f) => f.models.includes(modelName));
  if (exact) return exact;
  const byPrefix = families.find((f) => {
    if (f.id === "custom") return false;
    if (f.id === "meta") return modelName.startsWith("meta-llama/") || modelName.startsWith("meta/");
    return modelName.startsWith(f.id + "/");
  });
  return byPrefix || families[0];
}

/**
 * Check if the user has configured enough information to make AI calls.
 * For cloud providers, requires a non-empty API key.
 * For local LLMs, requires an endpoint or default local catalog.
 */
export function isAIConfigured(settings?: NutEggAISettings): boolean {
  if (!settings) return false;
  const provider = (settings.chromeAiProvider || settings.aiProvider || "gemini") as AIProviderId;
  const apiKey = (settings.chromeAiApiKey !== undefined ? settings.chromeAiApiKey : settings.aiApiKey) || "";

  if (provider === "local") {
    const localEndpoint = settings.chromeAiEndpoint || settings.localEndpoint || settings.aiEndpoint;
    return Boolean(
      (localEndpoint && localEndpoint.trim().length > 0) ||
        PROVIDER_CATALOG.local.officialEndpoint
    );
  }
  return Boolean(apiKey && apiKey.trim().length > 0);
}

/**
 * Resolve settings into actionable API call parameters.
 * Normalizes both Obsidian settings format and Chrome settings format.
 */
export function resolveConfig(settings: NutEggAISettings): ResolvedConfig & {
  extraHeaders: Record<string, string>;
} {
  const providerId = (settings.chromeAiProvider || settings.aiProvider || "anthropic") as AIProviderId;
  const isLocal = providerId === "local";
  const isOpenRouter = providerId === "openrouter";

  const rawKey = settings.chromeAiApiKey !== undefined ? settings.chromeAiApiKey : settings.aiApiKey;
  const apiKey = (rawKey || "").trim();

  if (isLocal) {
    const isOllama = settings.localApiType === "ollama";
    const defaultEndpoint = isOllama
      ? "http://127.0.0.1:11434/api/chat"
      : "http://127.0.0.1:11434/v1/chat/completions";
    const rawEndpoint = settings.chromeAiEndpoint || settings.localEndpoint || settings.aiEndpoint;
    const model = (settings.chromeAiModel || settings.aiModel || "default").trim();

    return {
      provider: "local",
      endpoint: rawEndpoint || defaultEndpoint,
      apiKey,
      model,
      apiFormat: isOllama ? "ollama" : "openai-compatible",
      isLocal: true,
      extraHeaders: {},
    };
  }

  if (isOpenRouter) {
    return {
      provider: "openrouter",
      endpoint: OPENROUTER_ENDPOINT,
      apiKey,
      model: settings.chromeAiModel || settings.openrouterModel || settings.aiModel || PROVIDER_CATALOG.openrouter.defaultModel!,
      apiFormat: "openai-compatible",
      isLocal: false,
      extraHeaders: {
        "HTTP-Referer": "https://github.com/nutegg",
        "X-Title": "NutEgg",
      },
    };
  }

  const catalog = PROVIDER_CATALOG[providerId] || PROVIDER_CATALOG.anthropic;
  const model = (settings.chromeAiModel || settings.aiModel || catalog.defaultModel || "").trim();

  return {
    provider: providerId,
    endpoint: catalog.officialEndpoint,
    apiKey,
    model,
    apiFormat: catalog.apiFormat,
    isLocal: false,
    extraHeaders:
      catalog.apiFormat === "anthropic"
        ? { "anthropic-version": "2023-06-01" }
        : {},
  };
}
