import type { NutEggSettings } from "./settings";

// ============================================================
// Provider Catalog — model lists and official endpoints
// ============================================================

export type AIProviderId =
  | "local"
  | "openrouter"
  | "anthropic"
  | "deepseek"
  | "gemini"
  | "openai"
  | "kimi"
  | "zhipu"
  | "qwen";

export type AISource = "official" | "openrouter";

export interface ProviderInfo {
  id: AIProviderId;
  label: string;
  /** Official API endpoint (full URL to chat endpoint) */
  officialEndpoint: string;
  /** API format: "anthropic" uses native Anthropic, everything else uses OpenAI-compatible */
  apiFormat: "anthropic" | "openai-compatible";
  /** Available models for this provider */
  models: string[];
  /** Key placeholder shown in settings */
  keyPlaceholder: string;
  /** OpenRouter model prefix (e.g. "anthropic/" becomes "anthropic/claude-sonnet-5") */
  openrouterPrefix: string;
}

export interface ModelFamily {
  id: string;
  label: string;
  defaultModel: string;
  models: string[];
}

export const PROVIDER_CATALOG: Record<AIProviderId, ProviderInfo> = {
  local: {
    id: "local",
    label: "Local LLM (Ollama, LM Studio, etc.)",
    officialEndpoint: "http://127.0.0.1:11434/v1/chat/completions",
    apiFormat: "openai-compatible",
    models: [],
    keyPlaceholder: "Optional for local LLMs",
    openrouterPrefix: "",
  },
  openrouter: {
    id: "openrouter",
    label: "OpenRouter (Multi-Provider)",
    officialEndpoint: "https://openrouter.ai/api/v1/chat/completions",
    apiFormat: "openai-compatible",
    models: [
      "anthropic/claude-sonnet-5",
      "anthropic/claude-3.7-sonnet",
      "openai/gpt-5.6-sol",
      "openai/gpt-4o",
      "openai/o3-mini",
      "deepseek/deepseek-r1",
      "deepseek/deepseek-chat",
      "google/gemini-2.5-flash",
      "meta-llama/llama-3.3-70b-instruct",
      "qwen/qwen-2.5-72b-instruct",
    ],
    keyPlaceholder: "sk-or-...",
    openrouterPrefix: "",
  },
  anthropic: {
    id: "anthropic",
    label: "Anthropic (Claude)",
    officialEndpoint: "https://api.anthropic.com/v1/messages",
    apiFormat: "anthropic",
    models: [
      "claude-sonnet-5",
      "claude-3-7-sonnet-20250219",
      "claude-3-5-sonnet-20241022",
      "claude-haiku-4-5-20251001",
      "claude-3-5-haiku-20241022",
      "claude-opus-5",
      "claude-3-opus-20240229",
    ],
    keyPlaceholder: "sk-ant-...",
    openrouterPrefix: "anthropic/",
  },
  openai: {
    id: "openai",
    label: "OpenAI",
    officialEndpoint: "https://api.openai.com/v1/chat/completions",
    apiFormat: "openai-compatible",
    models: [
      "gpt-5.6-sol",
      "gpt-5.5",
      "gpt-5.4-nano",
      "o3-mini",
      "o1",
      "gpt-4o",
      "gpt-4o-mini",
    ],
    keyPlaceholder: "sk-...",
    openrouterPrefix: "openai/",
  },
  gemini: {
    id: "gemini",
    label: "Google Gemini",
    officialEndpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    apiFormat: "openai-compatible",
    models: [
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-2.5-flash-lite",
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
    ],
    keyPlaceholder: "AIza...",
    openrouterPrefix: "google/",
  },
  deepseek: {
    id: "deepseek",
    label: "DeepSeek",
    officialEndpoint: "https://api.deepseek.com/v1/chat/completions",
    apiFormat: "openai-compatible",
    models: ["deepseek-chat", "deepseek-reasoner", "deepseek-flash"],
    keyPlaceholder: "sk-...",
    openrouterPrefix: "deepseek/",
  },
  kimi: {
    id: "kimi",
    label: "Kimi (Moonshot)",
    officialEndpoint: "https://api.moonshot.cn/v1/chat/completions",
    apiFormat: "openai-compatible",
    models: [
      "kimi-k3",
      "kimi-k2.7-code",
      "kimi-k2.7-code-highspeed",
      "moonshot-v1-8k",
      "moonshot-v1-32k",
      "moonshot-v1-128k",
    ],
    keyPlaceholder: "sk-...",
    openrouterPrefix: "moonshot/",
  },
  zhipu: {
    id: "zhipu",
    label: "Zhipu (GLM)",
    officialEndpoint: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    apiFormat: "openai-compatible",
    models: [
      "glm-5.3",
      "glm-5",
      "glm-5-turbo",
      "glm-4.7",
      "glm-4-plus",
      "glm-4-air",
      "glm-4-flash",
    ],
    keyPlaceholder: "...",
    openrouterPrefix: "zhipu/",
  },
  qwen: {
    id: "qwen",
    label: "Qwen (Tongyi)",
    officialEndpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    apiFormat: "openai-compatible",
    models: [
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

export const MODEL_CATALOG: Record<AIProviderId, ModelFamily[]> = {
  local: [],
  openrouter: [
    {
      id: "anthropic",
      label: "Anthropic Claude",
      defaultModel: "anthropic/claude-sonnet-5",
      models: [
        "anthropic/claude-sonnet-5",
        "anthropic/claude-3.7-sonnet",
        "anthropic/claude-3.5-sonnet",
        "anthropic/claude-3.5-haiku",
      ],
    },
    {
      id: "openai",
      label: "OpenAI GPT & Reasoning",
      defaultModel: "openai/gpt-5.6-sol",
      models: [
        "openai/gpt-5.6-sol",
        "openai/gpt-4o",
        "openai/o3-mini",
        "openai/o1",
      ],
    },
    {
      id: "deepseek",
      label: "DeepSeek",
      defaultModel: "deepseek/deepseek-r1",
      models: ["deepseek/deepseek-r1", "deepseek/deepseek-chat"],
    },
    {
      id: "google",
      label: "Google Gemini",
      defaultModel: "google/gemini-2.5-flash",
      models: [
        "google/gemini-2.5-flash",
        "google/gemini-2.5-pro",
        "google/gemini-2.0-flash-001",
      ],
    },
    {
      id: "meta",
      label: "Meta Llama",
      defaultModel: "meta-llama/llama-3.3-70b-instruct",
      models: [
        "meta-llama/llama-3.3-70b-instruct",
        "meta-llama/llama-3.1-8b-instruct",
      ],
    },
    {
      id: "qwen",
      label: "Qwen",
      defaultModel: "qwen/qwen-2.5-72b-instruct",
      models: [
        "qwen/qwen-2.5-72b-instruct",
        "qwen/qwen-2.5-coder-32b-instruct",
      ],
    },
    {
      id: "custom",
      label: "Custom OpenRouter Model",
      defaultModel: "anthropic/claude-sonnet-5",
      models: [],
    },
  ],
  anthropic: [
    {
      id: "sonnet",
      label: "Claude Sonnet",
      defaultModel: "claude-sonnet-5",
      models: [
        "claude-sonnet-5",
        "claude-3-7-sonnet-20250219",
        "claude-3-5-sonnet-20241022",
      ],
    },
    {
      id: "haiku",
      label: "Claude Haiku",
      defaultModel: "claude-haiku-4-5-20251001",
      models: [
        "claude-haiku-4-5-20251001",
        "claude-3-5-haiku-20241022",
      ],
    },
    {
      id: "opus",
      label: "Claude Opus",
      defaultModel: "claude-opus-5",
      models: [
        "claude-opus-5",
        "claude-3-opus-20240229",
      ],
    },
  ],
  openai: [
    {
      id: "gpt-5",
      label: "GPT-5 Series (Flagship)",
      defaultModel: "gpt-5.6-sol",
      models: ["gpt-5.6-sol", "gpt-5.5", "gpt-5.4-nano"],
    },
    {
      id: "reasoning",
      label: "o-Series (Reasoning)",
      defaultModel: "o3-mini",
      models: ["o3-mini", "o1"],
    },
    {
      id: "gpt-4o",
      label: "GPT-4o Series",
      defaultModel: "gpt-4o",
      models: ["gpt-4o", "gpt-4o-mini"],
    },
  ],
  gemini: [
    {
      id: "gemini-2.5",
      label: "Gemini 2.5",
      defaultModel: "gemini-2.5-flash",
      models: ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.5-flash-lite"],
    },
    {
      id: "gemini-2.0",
      label: "Gemini 2.0",
      defaultModel: "gemini-2.0-flash",
      models: ["gemini-2.0-flash", "gemini-2.0-flash-lite"],
    },
  ],
  deepseek: [
    {
      id: "deepseek-chat",
      label: "DeepSeek V3 (Chat)",
      defaultModel: "deepseek-chat",
      models: ["deepseek-chat"],
    },
    {
      id: "deepseek-reasoner",
      label: "DeepSeek R1 (Reasoner)",
      defaultModel: "deepseek-reasoner",
      models: ["deepseek-reasoner"],
    },
    {
      id: "deepseek-flash",
      label: "DeepSeek V4.1 Flash",
      defaultModel: "deepseek-flash",
      models: ["deepseek-flash"],
    },
  ],
  kimi: [
    {
      id: "kimi-k3",
      label: "Kimi K3 (Flagship)",
      defaultModel: "kimi-k3",
      models: ["kimi-k3"],
    },
    {
      id: "kimi-k2.7",
      label: "Kimi K2.7 Code",
      defaultModel: "kimi-k2.7-code",
      models: ["kimi-k2.7-code", "kimi-k2.7-code-highspeed"],
    },
    {
      id: "moonshot-legacy",
      label: "Moonshot V1 (Legacy)",
      defaultModel: "moonshot-v1-8k",
      models: ["moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k"],
    },
  ],
  zhipu: [
    {
      id: "glm-5",
      label: "GLM-5 Series (Flagship)",
      defaultModel: "glm-5.3",
      models: ["glm-5.3", "glm-5", "glm-5-turbo"],
    },
    {
      id: "glm-4",
      label: "GLM-4 Series",
      defaultModel: "glm-4-flash",
      models: ["glm-4.7", "glm-4-plus", "glm-4-air", "glm-4-flash"],
    },
  ],
  qwen: [
    {
      id: "qwen3",
      label: "Qwen3 Series (Flagship)",
      defaultModel: "qwen3-max",
      models: ["qwen3-max", "qwen3-plus", "qwen3-flash"],
    },
    {
      id: "qwen-tiered",
      label: "Qwen Tiered (Max / Plus / Turbo)",
      defaultModel: "qwen-plus",
      models: ["qwen-max", "qwen-plus", "qwen-turbo"],
    },
  ],
};

export function findFamilyForModel(providerId: AIProviderId, modelName: string): ModelFamily | undefined {
  const families = MODEL_CATALOG[providerId] || [];
  if (families.length === 0) return undefined;
  return families.find((f) => f.models.includes(modelName)) || families[0];
}

/**
 * Check if the user has configured enough information to make AI calls.
 * For cloud providers, requires a non-empty API key.
 * For local LLMs, requires an endpoint (model is optional).
 */
export function isAIConfigured(settings: NutEggSettings): boolean {
  if (settings.aiProvider === "local") {
    return Boolean(
      (settings.localEndpoint && settings.localEndpoint.trim().length > 0) ||
        PROVIDER_CATALOG.local.officialEndpoint
    );
  }
  return Boolean(settings.aiApiKey && settings.aiApiKey.trim().length > 0);
}

// OpenRouter endpoint (used when source === "openrouter")
const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

// ============================================================
// Internal config used by AIClient
// ============================================================

interface ResolvedConfig {
  provider: AIProviderId;
  endpoint: string;
  apiKey: string;
  model: string;
  apiFormat: "anthropic" | "openai-compatible" | "ollama";
  /** Extra headers beyond Content-Type */
  extraHeaders: Record<string, string>;
}

function resolveConfig(settings: NutEggSettings): ResolvedConfig {
  const isLocal = settings.aiProvider === "local";
  const isOpenRouter = settings.aiProvider === "openrouter" || settings.aiSource === "openrouter";

  if (isLocal) {
    const isOllama = settings.localApiType === "ollama";
    const defaultEndpoint = isOllama
      ? "http://127.0.0.1:11434/api/chat"
      : "http://127.0.0.1:11434/v1/chat/completions";
    return {
      provider: "local",
      endpoint: settings.localEndpoint || defaultEndpoint,
      apiKey: settings.aiApiKey || "",
      model: settings.aiModel?.trim() || "default",
      apiFormat: isOllama ? "ollama" : "openai-compatible",
      extraHeaders: {},
    };
  }

  if (isOpenRouter) {
    const provider = PROVIDER_CATALOG[settings.aiProvider] || PROVIDER_CATALOG.openrouter;
    const prefix = provider.openrouterPrefix || "";
    const model = settings.aiModel.startsWith(prefix) ? settings.aiModel : prefix + settings.aiModel;
    return {
      provider: "openrouter",
      endpoint: OPENROUTER_ENDPOINT,
      apiKey: settings.aiApiKey,
      model,
      apiFormat: "openai-compatible",
      extraHeaders: {
        "HTTP-Referer": "nutegg-obsidian-plugin",
        "X-Title": "NutEgg",
      },
    };
  }

  const provider = PROVIDER_CATALOG[settings.aiProvider] || PROVIDER_CATALOG.anthropic;
  return {
    provider: settings.aiProvider,
    endpoint: provider.officialEndpoint,
    apiKey: settings.aiApiKey,
    model: settings.aiModel,
    apiFormat: provider.apiFormat,
    extraHeaders:
      provider.apiFormat === "anthropic"
        ? { "anthropic-version": "2023-06-01" }
        : {},
  };
}

// ============================================================
// Structured AI Error
// ============================================================

export type AIErrorCode =
  | "no_api_key"
  | "auth_failed"
  | "forbidden"
  | "model_not_found"
  | "rate_limited"
  | "quota_exceeded"
  | "network_error"
  | "server_error"
  | "unknown";

export class AIError extends Error {
  code: AIErrorCode;
  statusCode: number | null;

  constructor(code: AIErrorCode, message: string, statusCode?: number) {
    super(message);
    this.name = "AIError";
    this.code = code;
    this.statusCode = statusCode ?? null;
  }
}

/**
 * Classify an HTTP error response into a structured AIError.
 */
function classifyError(statusCode: number, body: string): AIError {
  const lower = body.toLowerCase();

  if (statusCode === 401) {
    return new AIError("auth_failed", "API key is invalid or missing. Check your API key in NutEgg settings.", statusCode);
  }
  if (statusCode === 403) {
    return new AIError("forbidden", "Access denied. Your API key may not have permission for this model, or your account needs a funded billing plan.", statusCode);
  }
  if (statusCode === 404 || lower.includes("model not found") || lower.includes("model_not_found")) {
    return new AIError("model_not_found", "The selected model was not found. The model name may be incorrect or not available on this endpoint.", statusCode);
  }
  if (statusCode === 429) {
    return new AIError("rate_limited", "Rate limit exceeded. Wait a moment and try again.", statusCode);
  }
  if (statusCode >= 500) {
    return new AIError("server_error", `The AI service returned a server error (${statusCode}). It may be temporarily down — try again shortly.`, statusCode);
  }
  if (lower.includes("quota") || lower.includes("insufficient") || lower.includes("balance") || lower.includes("billing")) {
    return new AIError("quota_exceeded", "API quota exceeded or insufficient funds. Check your account balance or billing settings.", statusCode);
  }

  // Generic fallback with truncated body
  const snippet = body.slice(0, 300);
  return new AIError("unknown", `API error (${statusCode}): ${snippet}`, statusCode);
}

// ============================================================
// AI Credit & Balance Monitor Info
// ============================================================

export interface AICreditInfo {
  provider: AIProviderId;
  providerLabel: string;
  source: AISource;
  model: string;
  /** Whether a numeric balance was successfully fetched */
  hasBalance: boolean;
  /** Formatted remaining balance or credit string, e.g. "$7.45" or "¥15.20" */
  balanceFormatted?: string;
  /** Currency code if known (e.g. "USD", "CNY") */
  currency?: string;
  /** Total credits (if supported by provider) */
  totalCredits?: number;
  /** Total usage (if supported by provider) */
  totalUsage?: number;
  /** Status description e.g. "OpenRouter credits available" or "Pay-as-you-go / Direct billing" */
  statusText: string;
  /** Error message if balance check failed */
  error?: string;
}

// ============================================================
// AIClient
// ============================================================

export class AIClient {
  private config: ResolvedConfig;

  constructor(settings: NutEggSettings) {
    this.config = resolveConfig(settings);
  }

  /**
   * Check remaining credit/balance for the configured provider.
   */
  async checkCredit(settings: NutEggSettings): Promise<AICreditInfo> {
    const provider = PROVIDER_CATALOG[settings.aiProvider];
    const source = settings.aiSource;
    const apiKey = settings.aiApiKey;
    const model = settings.aiModel;

    const baseInfo: AICreditInfo = {
      provider: settings.aiProvider,
      providerLabel: provider?.label || settings.aiProvider,
      source,
      model,
      hasBalance: false,
      statusText: "Checking...",
    };

    // 0. Local LLM (Ollama, LM Studio, etc.) — ping endpoint without requiring apiKey or model
    if (settings.aiProvider === "local") {
      const isOllama = settings.localApiType === "ollama";
      const defaultEndpoint = isOllama
        ? "http://127.0.0.1:11434/api/chat"
        : "http://127.0.0.1:11434/v1/chat/completions";
      const endpoint = settings.localEndpoint || defaultEndpoint;
      const pingEndpoint = isOllama
        ? endpoint.replace(/\/api\/chat\/?$/, "/api/tags")
        : endpoint.replace(/\/chat\/completions\/?$/, "/models");
      try {
        const headers: Record<string, string> = { Accept: "application/json" };
        if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        const resp = await fetch(pingEndpoint, {
          method: "GET",
          headers,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (resp.ok) {
          const modelTag = model && model !== "default" ? ` (${model})` : "";
          const typeLabel = isOllama ? "Ollama Native" : "OpenAI-compatible";
          return {
            ...baseInfo,
            hasBalance: false,
            statusText: `Connected${modelTag} [${typeLabel}]`,
          };
        } else {
          return {
            ...baseInfo,
            hasBalance: false,
            statusText: `Local LLM (${resp.status} ${resp.statusText})`,
          };
        }
      } catch {
        return {
          ...baseInfo,
          hasBalance: false,
          statusText: "Offline — ensure local runner is running",
          error: "Cannot connect to local LLM server",
        };
      }
    }

    if (!apiKey) {
      return {
        ...baseInfo,
        statusText: "No API key configured",
        error: "No API key",
      };
    }

    // 1. OpenRouter
    if (source === "openrouter" || settings.aiProvider === "openrouter") {
      try {
        const resp = await fetch("https://openrouter.ai/api/v1/credits", {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        });
        if (resp.ok) {
          const json = await resp.json();
          const totalCredits = Number(json?.data?.total_credits ?? 0);
          const totalUsage = Number(json?.data?.total_usage ?? 0);
          const remaining = Math.max(0, totalCredits - totalUsage);
          const balanceFormatted = `$${remaining.toFixed(2)}`;
          return {
            ...baseInfo,
            hasBalance: true,
            balanceFormatted,
            currency: "USD",
            totalCredits,
            totalUsage,
            statusText: `${balanceFormatted} left ($${totalUsage.toFixed(2)} used / $${totalCredits.toFixed(2)} total)`,
          };
        } else if (resp.status === 401) {
          return {
            ...baseInfo,
            statusText: "Invalid API key",
            error: "Authentication failed",
          };
        } else {
          return {
            ...baseInfo,
            statusText: "OpenRouter (Active)",
          };
        }
      } catch (err) {
        return {
          ...baseInfo,
          statusText: "OpenRouter (Network error)",
          error: String(err),
        };
      }
    }

    // 2. Official DeepSeek
    if (settings.aiProvider === "deepseek") {
      try {
        const resp = await fetch("https://api.deepseek.com/user/balance", {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            Accept: "application/json",
          },
        });
        if (resp.ok) {
          const json = await resp.json();
          const info = json?.balance_infos?.[0];
          const curr = info?.currency || "CNY";
          const symbol = curr === "USD" ? "$" : "¥";
          const balance = parseFloat(info?.total_balance || "0");
          const balanceFormatted = `${symbol}${balance.toFixed(2)}`;
          return {
            ...baseInfo,
            hasBalance: true,
            balanceFormatted,
            currency: curr,
            statusText: `${balanceFormatted} available`,
          };
        } else if (resp.status === 401) {
          return { ...baseInfo, statusText: "Invalid API key", error: "Auth failed" };
        }
      } catch {}
      return { ...baseInfo, statusText: "DeepSeek (Active)" };
    }

    // 3. Official Kimi (Moonshot)
    if (settings.aiProvider === "kimi") {
      try {
        const resp = await fetch("https://api.moonshot.cn/v1/users/me/balance", {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        });
        if (resp.ok) {
          const json = await resp.json();
          const balance = json?.data?.available_balance ?? 0;
          const balanceFormatted = `¥${Number(balance).toFixed(2)}`;
          return {
            ...baseInfo,
            hasBalance: true,
            balanceFormatted,
            currency: "CNY",
            statusText: `${balanceFormatted} available`,
          };
        } else if (resp.status === 401) {
          return { ...baseInfo, statusText: "Invalid API key", error: "Auth failed" };
        }
      } catch {}
      return { ...baseInfo, statusText: "Kimi (Active)" };
    }

    // 4. Anthropic / OpenAI / Gemini / Zhipu / Qwen (Direct Pay-As-You-Go)
    return {
      ...baseInfo,
      hasBalance: false,
      statusText: `${provider.label} (Pay-as-you-go / Direct)`,
    };
  }

  async chat(prompt: string, maxTokens: number): Promise<string> {
    if (this.config.provider !== "local" && !this.config.apiKey) {
      throw new AIError(
        "no_api_key",
        "No AI API key configured. Open Obsidian Settings → NutEgg, enable Developer Mode, and add your API key."
      );
    }

    if (this.config.apiFormat === "anthropic") {
      return this.chatAnthropic(prompt, maxTokens);
    }
    if (this.config.apiFormat === "ollama") {
      return this.chatOllama(prompt, maxTokens);
    }
    return this.chatOpenAICompatible(prompt, maxTokens);
  }

  // --- Ollama-native format (/api/chat) ---

  private async chatOllama(prompt: string, maxTokens: number): Promise<string> {
    let response: Response;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...this.config.extraHeaders,
    };
    if (this.config.apiKey && this.config.apiKey.trim().length > 0) {
      headers["Authorization"] = `Bearer ${this.config.apiKey}`;
    }

    const bodyPayload: Record<string, any> = {
      model: this.config.model || "default",
      messages: [{ role: "user", content: prompt }],
      stream: false,
      options: {
        num_predict: maxTokens,
        temperature: 0.3,
      },
    };

    try {
      response = await fetch(this.config.endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(bodyPayload),
      });
    } catch {
      throw new AIError(
        "network_error",
        "Cannot reach Ollama server. Ensure Ollama is running and the endpoint is accessible."
      );
    }

    if (!response.ok) {
      const err = await response.text();
      throw classifyError(response.status, err);
    }

    const data = await response.json();
    return data?.message?.content || "";
  }

  // --- Anthropic-native format ---

  private async chatAnthropic(prompt: string, maxTokens: number): Promise<string> {
    let response: Response;
    try {
      response = await fetch(this.config.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.config.apiKey,
          ...this.config.extraHeaders,
        },
        body: JSON.stringify({
          model: this.config.model,
          max_tokens: maxTokens,
          messages: [{ role: "user", content: prompt }],
        }),
      });
    } catch {
      throw new AIError(
        "network_error",
        "Cannot reach the AI API. Check your internet connection. If using a custom endpoint, verify the URL is correct."
      );
    }

    if (!response.ok) {
      const err = await response.text();
      throw classifyError(response.status, err);
    }

    const data = await response.json();
    return data?.content?.[0]?.text || "";
  }

  // --- OpenAI-compatible format ---

  private async chatOpenAICompatible(
    prompt: string,
    maxTokens: number
  ): Promise<string> {
    let response: Response;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...this.config.extraHeaders,
    };
    if (this.config.apiKey && this.config.apiKey.trim().length > 0) {
      headers["Authorization"] = `Bearer ${this.config.apiKey}`;
    }

    const bodyPayload: Record<string, any> = {
      model: this.config.model,
      messages: [{ role: "user", content: prompt }],
    };
    if (this.config.provider === "openai") {
      bodyPayload.max_completion_tokens = maxTokens;
    } else {
      bodyPayload.max_tokens = maxTokens;
    }

    try {
      response = await fetch(this.config.endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(bodyPayload),
      });
    } catch {
      throw new AIError(
        "network_error",
        "Cannot reach the AI API. Check your network or local LLM server status. If using a custom endpoint, verify the URL is correct."
      );
    }

    if (!response.ok) {
      const err = await response.text();
      throw classifyError(response.status, err);
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content || "";
  }
}
