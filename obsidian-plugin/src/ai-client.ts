import type { NutEggSettings } from "./settings";

// ============================================================
// Provider Catalog — model lists and official endpoints
// ============================================================

export type AIProviderId =
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

export const PROVIDER_CATALOG: Record<AIProviderId, ProviderInfo> = {
  anthropic: {
    id: "anthropic",
    label: "Anthropic (Claude)",
    officialEndpoint: "https://api.anthropic.com/v1/messages",
    apiFormat: "anthropic",
    models: [
      "claude-opus-5",
      "claude-sonnet-5",
      "claude-haiku-4-5-20251001",
    ],
    keyPlaceholder: "sk-ant-...",
    openrouterPrefix: "anthropic/",
  },
  deepseek: {
    id: "deepseek",
    label: "DeepSeek",
    officialEndpoint: "https://api.deepseek.com/v1/chat/completions",
    apiFormat: "openai-compatible",
    models: ["deepseek-chat", "deepseek-reasoner"],
    keyPlaceholder: "sk-...",
    openrouterPrefix: "deepseek/",
  },
  gemini: {
    id: "gemini",
    label: "Google Gemini",
    officialEndpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    apiFormat: "openai-compatible",
    models: [
      "gemini-2.5-pro",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
    ],
    keyPlaceholder: "AIza...",
    openrouterPrefix: "google/",
  },
  openai: {
    id: "openai",
    label: "OpenAI",
    officialEndpoint: "https://api.openai.com/v1/chat/completions",
    apiFormat: "openai-compatible",
    models: ["gpt-4o", "gpt-4o-mini", "o3-mini", "o1"],
    keyPlaceholder: "sk-...",
    openrouterPrefix: "openai/",
  },
  kimi: {
    id: "kimi",
    label: "Kimi (Moonshot)",
    officialEndpoint: "https://api.moonshot.cn/v1/chat/completions",
    apiFormat: "openai-compatible",
    models: [
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
    models: ["glm-4-plus", "glm-4-air", "glm-4-flash"],
    keyPlaceholder: "...",
    openrouterPrefix: "zhipu/",
  },
  qwen: {
    id: "qwen",
    label: "Qwen (Tongyi)",
    officialEndpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    apiFormat: "openai-compatible",
    models: ["qwen-max", "qwen-plus", "qwen-turbo"],
    keyPlaceholder: "sk-...",
    openrouterPrefix: "qwen/",
  },
};

// OpenRouter endpoint (used when source === "openrouter")
const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

// ============================================================
// Internal config used by AIClient
// ============================================================

interface ResolvedConfig {
  endpoint: string;
  apiKey: string;
  model: string;
  apiFormat: "anthropic" | "openai-compatible";
  /** Extra headers beyond Content-Type */
  extraHeaders: Record<string, string>;
}

function resolveConfig(settings: NutEggSettings): ResolvedConfig {
  const provider = PROVIDER_CATALOG[settings.aiProvider];
  const source = settings.aiSource;

  if (source === "openrouter") {
    // OpenRouter uses OpenAI-compatible format for all providers
    const model = provider.openrouterPrefix + settings.aiModel;
    return {
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

  // Official provider API
  return {
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

    if (!apiKey) {
      return {
        ...baseInfo,
        statusText: "No API key configured",
        error: "No API key",
      };
    }

    // 1. OpenRouter
    if (source === "openrouter") {
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
    if (!this.config.apiKey) {
      throw new AIError(
        "no_api_key",
        "No AI API key configured. Open Obsidian Settings → NutEgg, enable Developer Mode, and add your API key."
      );
    }

    if (this.config.apiFormat === "anthropic") {
      return this.chatAnthropic(prompt, maxTokens);
    }
    return this.chatOpenAICompatible(prompt, maxTokens);
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
    try {
      response = await fetch(this.config.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
          ...this.config.extraHeaders,
        },
        body: JSON.stringify({
          model: this.config.model,
          max_completion_tokens: maxTokens,
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
    return data?.choices?.[0]?.message?.content || "";
  }
}
