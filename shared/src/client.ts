// ============================================================
// NutEgg Unified AI Client & Transport
// ============================================================

import {
  PROVIDER_CATALOG,
  resolveConfig,
} from "./catalog";
import type {
  AIProviderId,
  AISource,
  NutEggAISettings,
  ResolvedConfig,
} from "./types";

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
export function classifyError(statusCode: number, body: string): AIError {
  const lower = body.toLowerCase();

  if (statusCode === 401) {
    return new AIError(
      "auth_failed",
      "API key is invalid or missing. Check your API key in NutEgg settings.",
      statusCode
    );
  }
  if (statusCode === 403) {
    return new AIError(
      "forbidden",
      "Access denied. Your API key may not have permission for this model, or your account needs a funded billing plan.",
      statusCode
    );
  }
  if (
    statusCode === 404 ||
    lower.includes("model not found") ||
    lower.includes("model_not_found")
  ) {
    return new AIError(
      "model_not_found",
      "The selected model was not found. The model name may be incorrect or not available on this endpoint.",
      statusCode
    );
  }
  if (statusCode === 429) {
    return new AIError(
      "rate_limited",
      "Rate limit exceeded. Wait a moment and try again.",
      statusCode
    );
  }
  if (statusCode >= 500) {
    return new AIError(
      "server_error",
      `The AI service returned a server error (${statusCode}). It may be temporarily down — try again shortly.`,
      statusCode
    );
  }
  if (
    lower.includes("quota") ||
    lower.includes("insufficient") ||
    lower.includes("balance") ||
    lower.includes("billing")
  ) {
    return new AIError(
      "quota_exceeded",
      "API quota exceeded or insufficient funds. Check your account balance or billing settings.",
      statusCode
    );
  }

  const snippet = body.slice(0, 300);
  return new AIError("unknown", `API error (${statusCode}): ${snippet}`, statusCode);
}

export interface AICreditInfo {
  provider: AIProviderId;
  providerLabel: string;
  source?: AISource;
  model: string;
  hasBalance: boolean;
  balanceFormatted?: string;
  currency?: string;
  totalCredits?: number;
  totalUsage?: number;
  statusText: string;
  error?: string;
}

/**
 * Execute chat completion with Anthropic API format.
 */
async function chatAnthropic(
  prompt: string,
  maxTokens: number,
  config: ResolvedConfig & { extraHeaders?: Record<string, string> }
): Promise<string> {
  let response: Response;
  try {
    response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
        ...(config.extraHeaders || {}),
      },
      body: JSON.stringify({
        model: config.model,
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

/**
 * Execute chat completion with Ollama API format (/api/chat).
 */
async function chatOllama(
  prompt: string,
  maxTokens: number,
  config: ResolvedConfig & { extraHeaders?: Record<string, string> }
): Promise<string> {
  let response: Response;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(config.extraHeaders || {}),
  };
  if (config.apiKey && config.apiKey.trim().length > 0) {
    headers["Authorization"] = `Bearer ${config.apiKey}`;
  }

  const bodyPayload: Record<string, any> = {
    model: config.model || "default",
    messages: [{ role: "user", content: prompt }],
    stream: false,
    options: {
      num_predict: maxTokens,
      temperature: 0.3,
    },
  };

  try {
    response = await fetch(config.endpoint, {
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

/**
 * Execute chat completion with OpenAI-compatible API format.
 */
async function chatOpenAICompatible(
  prompt: string,
  maxTokens: number,
  config: ResolvedConfig & { extraHeaders?: Record<string, string> }
): Promise<string> {
  let response: Response;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(config.extraHeaders || {}),
  };
  if (config.apiKey && config.apiKey.trim().length > 0) {
    headers["Authorization"] = `Bearer ${config.apiKey}`;
  }

  const bodyPayload: Record<string, any> = {
    model: config.model,
    messages: [{ role: "user", content: prompt }],
  };
  if (config.provider === "openai") {
    bodyPayload.max_completion_tokens = maxTokens;
  } else {
    bodyPayload.max_tokens = maxTokens;
  }

  try {
    response = await fetch(config.endpoint, {
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
  const choice = data?.choices?.[0];
  const content = choice?.message?.content || "";
  const reasoning = choice?.message?.reasoning_content || "";
  const finishReason = choice?.finish_reason;

  if (finishReason === "length") {
    const reasoningTokens =
      data?.usage?.completion_tokens_details?.reasoning_tokens || 0;
    const completionTokens = data?.usage?.completion_tokens || 0;
    console.warn(
      `[NutEgg] AI response was cut off by max_tokens limit (finish_reason: "length"). ` +
      `Reasoning tokens: ${reasoningTokens}, Completion tokens: ${completionTokens}, Content length: ${content.length}`
    );
    if (!content.trim() && reasoning) {
      throw new AIError(
        "rate_limited",
        `The AI model (${config.model}) spent all its tokens on internal reasoning before writing the answer. Try increasing Max Tokens in settings.`
      );
    }
  }

  return content;
}

/**
 * Chat with configured AI backend.
 */
export async function chatAI(
  prompt: string,
  maxTokens: number,
  config: ResolvedConfig & { extraHeaders?: Record<string, string> }
): Promise<string> {
  if (config.provider !== "local" && !config.apiKey) {
    throw new AIError(
      "no_api_key",
      "No AI API key configured. Open settings and enter your API key."
    );
  }

  if (config.apiFormat === "anthropic") {
    return chatAnthropic(prompt, maxTokens, config);
  }
  if ((config as any).apiFormat === "ollama") {
    return chatOllama(prompt, maxTokens, config);
  }
  return chatOpenAICompatible(prompt, maxTokens, config);
}

/**
 * Check remaining credit/balance for the configured provider.
 */
export async function checkCreditAI(settings: NutEggAISettings): Promise<AICreditInfo> {
  const providerId = (settings.chromeAiProvider || settings.aiProvider || "gemini") as AIProviderId;
  const provider = PROVIDER_CATALOG[providerId];
  const source: AISource = providerId === "openrouter" ? "openrouter" : "official";
  const apiKey = (settings.chromeAiApiKey !== undefined ? settings.chromeAiApiKey : settings.aiApiKey) || "";
  const model = settings.chromeAiModel || settings.aiModel || provider?.defaultModel || "";

  const baseInfo: AICreditInfo = {
    provider: providerId,
    providerLabel: provider?.label || providerId,
    source,
    model,
    hasBalance: false,
    statusText: "Checking...",
  };

  // 0. Local LLM (Ollama, LM Studio, etc.) — ping endpoint
  if (providerId === "local") {
    const isOllama = settings.localApiType === "ollama";
    const defaultEndpoint = isOllama
      ? "http://127.0.0.1:11434/api/chat"
      : "http://127.0.0.1:11434/v1/chat/completions";
    const endpoint = settings.chromeAiEndpoint || settings.localEndpoint || settings.aiEndpoint || defaultEndpoint;
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
        const typeLabel = isOllama ? "Ollama Native" : "OpenAI-compatible";
        return {
          ...baseInfo,
          hasBalance: false,
          statusText: `Connected [${typeLabel}]`,
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
  if (providerId === "openrouter") {
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
  if (providerId === "deepseek") {
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
  if (providerId === "kimi") {
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

  // 4. Anthropic / OpenAI / Gemini / Zhipu / Qwen
  return {
    ...baseInfo,
    hasBalance: false,
    statusText: `${provider?.label || providerId} (Pay-as-you-go / Direct)`,
  };
}

export class AIClient {
  private config: ResolvedConfig & { extraHeaders: Record<string, string> };

  constructor(settings: NutEggAISettings) {
    this.config = resolveConfig(settings);
  }

  async checkCredit(settings: NutEggAISettings): Promise<AICreditInfo> {
    return checkCreditAI(settings);
  }

  async chat(prompt: string, maxTokens: number): Promise<string> {
    return chatAI(prompt, maxTokens, this.config);
  }
}

