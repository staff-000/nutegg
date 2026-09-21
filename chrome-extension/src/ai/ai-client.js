// ============================================================
// NutEgg Chrome Extension AI Client (Standalone Mode)
// ============================================================
//
// Minimal, zero-dependency AI client for direct browser-to-LLM API calls.
// Compatible with Chrome Manifest V3 service workers (importScripts) and options page.

const PROVIDER_CATALOG = {
  gemini: {
    id: "gemini",
    label: "Google Gemini",
    officialEndpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    apiFormat: "openai-compatible",
    defaultModel: "gemini-2.5-flash",
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
  openai: {
    id: "openai",
    label: "OpenAI",
    officialEndpoint: "https://api.openai.com/v1/chat/completions",
    apiFormat: "openai-compatible",
    defaultModel: "gpt-6-astra",
    models: [
      "gpt-6-astra",
      "gpt-5.6-sol",
      "gpt-5.6-terra",
      "gpt-5.6-luna",
      "o3-mini",
      "o1",
      "gpt-4o",
      "gpt-4o-mini",
    ],
    keyPlaceholder: "sk-...",
    openrouterPrefix: "openai/",
  },
  anthropic: {
    id: "anthropic",
    label: "Anthropic (Claude)",
    officialEndpoint: "https://api.anthropic.com/v1/messages",
    apiFormat: "anthropic",
    defaultModel: "claude-sonnet-5",
    models: [
      "claude-fable-5-1",
      "claude-opus-5",
      "claude-sonnet-5",
      "claude-haiku-4-5-20251001",
      "claude-3-7-sonnet-20250219",
      "claude-3-5-sonnet-20241022",
    ],
    keyPlaceholder: "sk-ant-...",
    openrouterPrefix: "anthropic/",
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
    ],
    keyPlaceholder: "sk-...",
    openrouterPrefix: "deepseek/",
  },
  openrouter: {
    id: "openrouter",
    label: "OpenRouter (Multi-Provider)",
    officialEndpoint: "https://openrouter.ai/api/v1/chat/completions",
    apiFormat: "openai-compatible",
    defaultModel: "openai/gpt-6-astra",
    families: [
      {
        id: "openai",
        label: "OpenAI GPT & Reasoning",
        defaultModel: "openai/gpt-6-astra",
        models: ["openai/gpt-6-astra", "openai/gpt-5.6-sol", "openai/o3-mini", "openai/gpt-4o"],
      },
      {
        id: "anthropic",
        label: "Anthropic Claude",
        defaultModel: "anthropic/claude-sonnet-5",
        models: ["anthropic/claude-fable-5-1", "anthropic/claude-opus-5", "anthropic/claude-sonnet-5"],
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
        models: ["google/gemini-2.5-flash", "google/gemini-2.5-pro"],
      },
      {
        id: "meta",
        label: "Meta Llama",
        defaultModel: "meta-llama/llama-3.3-70b-instruct",
        models: ["meta-llama/llama-3.3-70b-instruct"],
      },
      {
        id: "qwen",
        label: "Qwen",
        defaultModel: "qwen/qwen-2.5-72b-instruct",
        models: ["qwen/qwen-2.5-72b-instruct"],
      },
      {
        id: "custom",
        label: "Custom OpenRouter Model",
        defaultModel: "openai/gpt-6-astra",
        models: [],
      },
    ],
    models: [
      "openai/gpt-6-astra",
      "openai/gpt-5.6-sol",
      "openai/o3-mini",
      "openai/gpt-4o",
      "anthropic/claude-fable-5-1",
      "anthropic/claude-opus-5",
      "anthropic/claude-sonnet-5",
      "deepseek/deepseek-r1",
      "deepseek/deepseek-chat",
      "google/gemini-2.5-flash",
      "google/gemini-2.5-pro",
      "meta-llama/llama-3.3-70b-instruct",
      "qwen/qwen-2.5-72b-instruct",
    ],
    keyPlaceholder: "sk-or-...",
    openrouterPrefix: "",
  },
  kimi: {
    id: "kimi",
    label: "Kimi (Moonshot)",
    officialEndpoint: "https://api.moonshot.cn/v1/chat/completions",
    apiFormat: "openai-compatible",
    defaultModel: "kimi-k3",
    models: ["kimi-k3", "kimi-k2.7-code", "kimi-k2.7-code-highspeed", "moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k"],
    keyPlaceholder: "sk-...",
    openrouterPrefix: "moonshot/",
  },
  zhipu: {
    id: "zhipu",
    label: "Zhipu (GLM)",
    officialEndpoint: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    apiFormat: "openai-compatible",
    defaultModel: "glm-5.3",
    models: ["glm-5.3", "glm-5", "glm-5-turbo", "glm-4.7", "glm-4-plus", "glm-4-air", "glm-4-flash"],
    keyPlaceholder: "...",
    openrouterPrefix: "zhipu/",
  },
  qwen: {
    id: "qwen",
    label: "Qwen (Tongyi)",
    officialEndpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    apiFormat: "openai-compatible",
    defaultModel: "qwen3-max",
    models: ["qwen3-max", "qwen3-plus", "qwen3-flash", "qwen-max", "qwen-plus", "qwen-turbo"],
    keyPlaceholder: "sk-...",
    openrouterPrefix: "qwen/",
  },
  local: {
    id: "local",
    label: "Local LLM (Ollama, LM Studio)",
    officialEndpoint: "http://127.0.0.1:11434/v1/chat/completions",
    apiFormat: "openai-compatible",
    keyPlaceholder: "Optional for local LLMs",
    openrouterPrefix: "",
  },
};

class AIError extends Error {
  constructor(code, message, statusCode = null) {
    super(message);
    this.name = "AIError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

function classifyError(statusCode, body) {
  const lower = (body || "").toLowerCase();

  if (statusCode === 401) {
    return new AIError("auth_failed", "API key is invalid or missing. Check your API key in NutEgg settings.", statusCode);
  }
  if (statusCode === 403) {
    return new AIError("forbidden", "Access denied. Your API key may not have permission for this model, or account needs billing setup.", statusCode);
  }
  if (statusCode === 404 || lower.includes("model not found") || lower.includes("model_not_found")) {
    return new AIError("model_not_found", "The selected model was not found on this endpoint.", statusCode);
  }
  if (statusCode === 429) {
    return new AIError("rate_limited", "Rate limit exceeded or quota exhausted. Wait a moment and try again.", statusCode);
  }
  if (statusCode >= 500) {
    return new AIError("server_error", `The AI service returned a server error (${statusCode}). Try again shortly.`, statusCode);
  }
  if (lower.includes("quota") || lower.includes("insufficient") || lower.includes("balance") || lower.includes("billing")) {
    return new AIError("quota_exceeded", "API quota exceeded or insufficient funds. Check your account billing balance.", statusCode);
  }

  const snippet = body ? body.slice(0, 200) : `HTTP ${statusCode}`;
  return new AIError("unknown", `API error (${statusCode}): ${snippet}`, statusCode);
}

function resolveConfig(settings) {
  const providerId = settings.chromeAiProvider || "gemini";
  const isLocal = providerId === "local";
  const isOpenRouter = providerId === "openrouter";

  if (isLocal) {
    const isOllama = settings.chromeAiLocalType === "ollama";
    const defaultEndpoint = isOllama
      ? "http://127.0.0.1:11434/api/chat"
      : "http://127.0.0.1:11434/v1/chat/completions";
    return {
      provider: "local",
      endpoint: settings.chromeAiLocalEndpoint || defaultEndpoint,
      apiKey: settings.chromeAiApiKey || "",
      model: (settings.chromeAiModel || "default").trim(),
      apiFormat: isOllama ? "ollama" : "openai-compatible",
      extraHeaders: {},
    };
  }

  if (isOpenRouter) {
    return {
      provider: "openrouter",
      endpoint: "https://openrouter.ai/api/v1/chat/completions",
      apiKey: settings.chromeAiApiKey || "",
      model: settings.chromeAiModel || "openai/gpt-6-astra",
      apiFormat: "openai-compatible",
      extraHeaders: {
        "HTTP-Referer": "https://nutegg.org",
        "X-Title": "NutEgg Chrome Extension",
      },
    };
  }

  const provider = PROVIDER_CATALOG[providerId] || PROVIDER_CATALOG.gemini;
  return {
    provider: providerId,
    endpoint: provider.officialEndpoint,
    apiKey: settings.chromeAiApiKey || "",
    model: settings.chromeAiModel || provider.defaultModel || "",
    apiFormat: provider.apiFormat,
    extraHeaders:
      provider.apiFormat === "anthropic"
        ? { "anthropic-version": "2023-06-01" }
        : {},
  };
}

/**
 * Execute a chat completion call directly from the browser.
 */
async function chatAI(prompt, maxTokens = 16384, settings = {}) {
  const config = resolveConfig(settings);

  if (config.provider !== "local" && !config.apiKey) {
    throw new AIError(
      "no_api_key",
      "No AI API key configured in Chrome extension settings. Open NutEgg Settings to add your key."
    );
  }

  if (config.apiFormat === "anthropic") {
    return chatAnthropic(prompt, maxTokens, config);
  }
  if (config.apiFormat === "ollama") {
    return chatOllama(prompt, maxTokens, config);
  }
  return chatOpenAICompatible(prompt, maxTokens, config);
}

async function chatAnthropic(prompt, maxTokens, config) {
  let response;
  try {
    response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
        ...config.extraHeaders,
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }],
      }),
    });
  } catch (err) {
    throw new AIError(
      "network_error",
      `Cannot reach Anthropic API: ${err?.message || "Network error"}`
    );
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw classifyError(response.status, errText);
  }

  const data = await response.json();
  return data?.content?.[0]?.text || "";
}

async function chatOllama(prompt, maxTokens, config) {
  let response;
  const headers = {
    "Content-Type": "application/json",
    ...config.extraHeaders,
  };
  if (config.apiKey) {
    headers["Authorization"] = `Bearer ${config.apiKey}`;
  }

  try {
    response = await fetch(config.endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: config.model || "default",
        messages: [{ role: "user", content: prompt }],
        stream: false,
        options: {
          num_predict: maxTokens,
          temperature: 0.3,
        },
      }),
    });
  } catch (err) {
    throw new AIError(
      "network_error",
      `Cannot reach local Ollama server: ${err?.message || "Ensure Ollama is running"}`
    );
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw classifyError(response.status, errText);
  }

  const data = await response.json();
  return data?.message?.content || "";
}

async function chatOpenAICompatible(prompt, maxTokens, config) {
  let response;
  const headers = {
    "Content-Type": "application/json",
    ...config.extraHeaders,
  };
  if (config.apiKey) {
    headers["Authorization"] = `Bearer ${config.apiKey}`;
  }

  const bodyPayload = {
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
  } catch (err) {
    throw new AIError(
      "network_error",
      `Cannot reach ${config.provider} API: ${err?.message || "Network error"}`
    );
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw classifyError(response.status, errText);
  }

  const data = await response.json();
  const choice = data?.choices?.[0];
  const content = choice?.message?.content || "";
  const finishReason = choice?.finish_reason;

  if (finishReason === "length" && !content.trim()) {
    throw new AIError(
      "rate_limited",
      `The model (${config.model}) exhausted tokens before writing a response. Try a model with larger output limits.`
    );
  }

  return content;
}

/**
 * Check credit/balance for a provider in Chrome settings.
 */
async function checkCreditAI(settings) {
  const providerId = settings.chromeAiProvider || "gemini";
  const provider = PROVIDER_CATALOG[providerId] || PROVIDER_CATALOG.gemini;
  const apiKey = settings.chromeAiApiKey || "";
  const model = settings.chromeAiModel || provider.defaultModel || "";

  const baseInfo = {
    provider: providerId,
    providerLabel: provider.label,
    model,
    hasBalance: false,
    statusText: "Checking...",
  };

  if (providerId === "local") {
    const isOllama = settings.chromeAiLocalType === "ollama";
    const endpoint = settings.chromeAiLocalEndpoint || (isOllama ? "http://127.0.0.1:11434/api/tags" : "http://127.0.0.1:11434/v1/models");
    try {
      const resp = await fetch(endpoint, { method: "GET" });
      if (resp.ok) {
        return { ...baseInfo, statusText: "Connected (Local LLM)" };
      }
      return { ...baseInfo, statusText: `Local server returned ${resp.status}`, error: "Status " + resp.status };
    } catch {
      return { ...baseInfo, statusText: "Offline — ensure local runner is running", error: "Offline" };
    }
  }

  if (!apiKey) {
    return {
      ...baseInfo,
      statusText: "No API key configured",
      error: "No API key",
    };
  }

  // OpenRouter credit check
  if (providerId === "openrouter") {
    try {
      const resp = await fetch("https://openrouter.ai/api/v1/credits", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (resp.ok) {
        const json = await resp.json();
        const total = Number(json?.data?.total_credits ?? 0);
        const usage = Number(json?.data?.total_usage ?? 0);
        const remaining = Math.max(0, total - usage);
        const formatted = `$${remaining.toFixed(2)}`;
        return {
          ...baseInfo,
          hasBalance: true,
          balanceFormatted: formatted,
          statusText: `${formatted} left ($${usage.toFixed(2)} used / $${total.toFixed(2)} total)`,
        };
      } else if (resp.status === 401) {
        return { ...baseInfo, statusText: "Invalid API key", error: "Auth failed" };
      }
    } catch (err) {
      return { ...baseInfo, statusText: "Network error", error: String(err) };
    }
  }

  // DeepSeek balance check
  if (providerId === "deepseek") {
    try {
      const resp = await fetch("https://api.deepseek.com/user/balance", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (resp.ok) {
        const json = await resp.json();
        const info = json?.balance_infos?.[0];
        const balance = parseFloat(info?.total_balance || "0");
        const formatted = `¥${balance.toFixed(2)}`;
        return {
          ...baseInfo,
          hasBalance: true,
          balanceFormatted: formatted,
          statusText: `${formatted} available`,
        };
      } else if (resp.status === 401) {
        return { ...baseInfo, statusText: "Invalid API key", error: "Auth failed" };
      }
    } catch {}
  }

  // Fallback for providers without public balance endpoint (Gemini, OpenAI, Anthropic, Kimi, Qwen, Zhipu)
  return {
    ...baseInfo,
    hasBalance: false,
    statusText: `${provider.label} (Ready / Direct billing)`,
  };
}

// Export for Node/testing or attach to global for browser
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    PROVIDER_CATALOG,
    AIError,
    classifyError,
    resolveConfig,
    chatAI,
    checkCreditAI,
  };
}

