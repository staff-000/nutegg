"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../shared/src/catalog.ts
function findOpenRouterFamily(modelName) {
  const families = PROVIDER_CATALOG.openrouter.families || [];
  if (families.length === 0)
    return void 0;
  return families.find((f) => f.models.includes(modelName)) || families[0];
}
function isAIConfigured(settings) {
  if (!settings)
    return false;
  const provider = settings.chromeAiProvider || settings.aiProvider || "gemini";
  const apiKey = (settings.chromeAiApiKey !== void 0 ? settings.chromeAiApiKey : settings.aiApiKey) || "";
  if (provider === "local") {
    const localEndpoint = settings.chromeAiEndpoint || settings.localEndpoint || settings.aiEndpoint;
    return Boolean(
      localEndpoint && localEndpoint.trim().length > 0 || PROVIDER_CATALOG.local.officialEndpoint
    );
  }
  return Boolean(apiKey && apiKey.trim().length > 0);
}
function resolveConfig(settings) {
  const providerId = settings.chromeAiProvider || settings.aiProvider || "anthropic";
  const isLocal = providerId === "local";
  const isOpenRouter = providerId === "openrouter";
  const rawKey = settings.chromeAiApiKey !== void 0 ? settings.chromeAiApiKey : settings.aiApiKey;
  const apiKey = (rawKey || "").trim();
  if (isLocal) {
    const isOllama = settings.localApiType === "ollama";
    const defaultEndpoint = isOllama ? "http://127.0.0.1:11434/api/chat" : "http://127.0.0.1:11434/v1/chat/completions";
    const rawEndpoint = settings.chromeAiEndpoint || settings.localEndpoint || settings.aiEndpoint;
    const model2 = (settings.chromeAiModel || settings.aiModel || "default").trim();
    return {
      provider: "local",
      endpoint: rawEndpoint || defaultEndpoint,
      apiKey,
      model: model2,
      apiFormat: isOllama ? "ollama" : "openai-compatible",
      isLocal: true,
      extraHeaders: {}
    };
  }
  if (isOpenRouter) {
    return {
      provider: "openrouter",
      endpoint: OPENROUTER_ENDPOINT,
      apiKey,
      model: settings.chromeAiModel || settings.openrouterModel || settings.aiModel || "openai/gpt-6-astra",
      apiFormat: "openai-compatible",
      isLocal: false,
      extraHeaders: {
        "HTTP-Referer": "https://github.com/nutegg",
        "X-Title": "NutEgg"
      }
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
    extraHeaders: catalog.apiFormat === "anthropic" ? { "anthropic-version": "2023-06-01" } : {}
  };
}
var OPENROUTER_ENDPOINT, PROVIDER_CATALOG;
var init_catalog = __esm({
  "../shared/src/catalog.ts"() {
    OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
    PROVIDER_CATALOG = {
      local: {
        id: "local",
        label: "Local LLM (Ollama, LM Studio, etc.)",
        officialEndpoint: "http://127.0.0.1:11434/v1/chat/completions",
        apiFormat: "openai-compatible",
        keyPlaceholder: "Optional for local LLMs",
        openrouterPrefix: ""
      },
      openrouter: {
        id: "openrouter",
        label: "OpenRouter (Multi-Provider)",
        officialEndpoint: OPENROUTER_ENDPOINT,
        apiFormat: "openai-compatible",
        defaultModel: "openai/gpt-6-astra",
        families: [
          {
            id: "openai",
            label: "OpenAI GPT & Reasoning",
            defaultModel: "openai/gpt-6-astra",
            models: [
              "openai/gpt-6-astra",
              "openai/gpt-5.6-sol",
              "openai/o3-mini",
              "openai/gpt-4o"
            ]
          },
          {
            id: "anthropic",
            label: "Anthropic Claude",
            defaultModel: "anthropic/claude-sonnet-5",
            models: [
              "anthropic/claude-fable-5-1",
              "anthropic/claude-opus-5",
              "anthropic/claude-sonnet-5"
            ]
          },
          {
            id: "deepseek",
            label: "DeepSeek",
            defaultModel: "deepseek/deepseek-r1",
            models: ["deepseek/deepseek-r1", "deepseek/deepseek-chat"]
          },
          {
            id: "google",
            label: "Google Gemini",
            defaultModel: "google/gemini-2.5-flash",
            models: [
              "google/gemini-2.5-flash",
              "google/gemini-2.5-pro"
            ]
          },
          {
            id: "meta",
            label: "Meta Llama",
            defaultModel: "meta-llama/llama-3.3-70b-instruct",
            models: [
              "meta-llama/llama-3.3-70b-instruct"
            ]
          },
          {
            id: "qwen",
            label: "Qwen",
            defaultModel: "qwen/qwen-2.5-72b-instruct",
            models: [
              "qwen/qwen-2.5-72b-instruct"
            ]
          },
          {
            id: "custom",
            label: "Custom OpenRouter Model",
            defaultModel: "openai/gpt-6-astra",
            models: []
          }
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
          "qwen/qwen-2.5-72b-instruct"
        ],
        keyPlaceholder: "sk-or-...",
        openrouterPrefix: ""
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
          "claude-3-5-sonnet-20241022"
        ],
        keyPlaceholder: "sk-ant-...",
        openrouterPrefix: "anthropic/"
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
          "gpt-4o-mini"
        ],
        keyPlaceholder: "sk-...",
        openrouterPrefix: "openai/"
      },
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
          "gemini-2.0-flash-lite"
        ],
        keyPlaceholder: "AIza...",
        openrouterPrefix: "google/"
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
          "deepseek-flash"
        ],
        keyPlaceholder: "sk-...",
        openrouterPrefix: "deepseek/"
      },
      kimi: {
        id: "kimi",
        label: "Kimi (Moonshot)",
        officialEndpoint: "https://api.moonshot.cn/v1/chat/completions",
        apiFormat: "openai-compatible",
        defaultModel: "kimi-k3",
        models: [
          "kimi-k3",
          "kimi-k2.7-code",
          "kimi-k2.7-code-highspeed",
          "moonshot-v1-8k",
          "moonshot-v1-32k",
          "moonshot-v1-128k"
        ],
        keyPlaceholder: "sk-...",
        openrouterPrefix: "moonshot/"
      },
      zhipu: {
        id: "zhipu",
        label: "Zhipu (GLM)",
        officialEndpoint: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
        apiFormat: "openai-compatible",
        defaultModel: "glm-5.3",
        models: [
          "glm-5.3",
          "glm-5",
          "glm-5-turbo",
          "glm-4.7",
          "glm-4-plus",
          "glm-4-air",
          "glm-4-flash"
        ],
        keyPlaceholder: "...",
        openrouterPrefix: "zhipu/"
      },
      qwen: {
        id: "qwen",
        label: "Qwen (Tongyi)",
        officialEndpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
        apiFormat: "openai-compatible",
        defaultModel: "qwen3-max",
        models: [
          "qwen3-max",
          "qwen3-plus",
          "qwen3-flash",
          "qwen-max",
          "qwen-plus",
          "qwen-turbo"
        ],
        keyPlaceholder: "sk-...",
        openrouterPrefix: "qwen/"
      }
    };
  }
});

// ../shared/src/client.ts
function classifyError(statusCode, body) {
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
  if (statusCode === 404 || lower.includes("model not found") || lower.includes("model_not_found")) {
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
      `The AI service returned a server error (${statusCode}). It may be temporarily down \u2014 try again shortly.`,
      statusCode
    );
  }
  if (lower.includes("quota") || lower.includes("insufficient") || lower.includes("balance") || lower.includes("billing")) {
    return new AIError(
      "quota_exceeded",
      "API quota exceeded or insufficient funds. Check your account balance or billing settings.",
      statusCode
    );
  }
  const snippet = body.slice(0, 300);
  return new AIError("unknown", `API error (${statusCode}): ${snippet}`, statusCode);
}
async function chatAnthropic(prompt, maxTokens, config) {
  let response;
  try {
    response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
        ...config.extraHeaders || {}
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: maxTokens,
        messages: [{ role: "user", content: prompt }]
      })
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
async function chatOllama(prompt, maxTokens, config) {
  let response;
  const headers = {
    "Content-Type": "application/json",
    ...config.extraHeaders || {}
  };
  if (config.apiKey && config.apiKey.trim().length > 0) {
    headers["Authorization"] = `Bearer ${config.apiKey}`;
  }
  const bodyPayload = {
    model: config.model || "default",
    messages: [{ role: "user", content: prompt }],
    stream: false,
    options: {
      num_predict: maxTokens,
      temperature: 0.3
    }
  };
  try {
    response = await fetch(config.endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(bodyPayload)
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
async function chatOpenAICompatible(prompt, maxTokens, config) {
  let response;
  const headers = {
    "Content-Type": "application/json",
    ...config.extraHeaders || {}
  };
  if (config.apiKey && config.apiKey.trim().length > 0) {
    headers["Authorization"] = `Bearer ${config.apiKey}`;
  }
  const bodyPayload = {
    model: config.model,
    messages: [{ role: "user", content: prompt }]
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
      body: JSON.stringify(bodyPayload)
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
    const reasoningTokens = data?.usage?.completion_tokens_details?.reasoning_tokens || 0;
    const completionTokens = data?.usage?.completion_tokens || 0;
    console.warn(
      `[NutEgg] AI response was cut off by max_tokens limit (finish_reason: "length"). Reasoning tokens: ${reasoningTokens}, Completion tokens: ${completionTokens}, Content length: ${content.length}`
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
async function chatAI(prompt, maxTokens, config) {
  if (config.provider !== "local" && !config.apiKey) {
    throw new AIError(
      "no_api_key",
      "No AI API key configured. Open settings and enter your API key."
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
async function checkCreditAI(settings) {
  const providerId = settings.chromeAiProvider || settings.aiProvider || "gemini";
  const provider = PROVIDER_CATALOG[providerId];
  const source = providerId === "openrouter" ? "openrouter" : "official";
  const apiKey = (settings.chromeAiApiKey !== void 0 ? settings.chromeAiApiKey : settings.aiApiKey) || "";
  const model = settings.chromeAiModel || settings.aiModel || provider?.defaultModel || "";
  const baseInfo = {
    provider: providerId,
    providerLabel: provider?.label || providerId,
    source,
    model,
    hasBalance: false,
    statusText: "Checking..."
  };
  if (providerId === "local") {
    const isOllama = settings.localApiType === "ollama";
    const defaultEndpoint = isOllama ? "http://127.0.0.1:11434/api/chat" : "http://127.0.0.1:11434/v1/chat/completions";
    const endpoint = settings.chromeAiEndpoint || settings.localEndpoint || settings.aiEndpoint || defaultEndpoint;
    const pingEndpoint = isOllama ? endpoint.replace(/\/api\/chat\/?$/, "/api/tags") : endpoint.replace(/\/chat\/completions\/?$/, "/models");
    try {
      const headers = { Accept: "application/json" };
      if (apiKey)
        headers["Authorization"] = `Bearer ${apiKey}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const resp = await fetch(pingEndpoint, {
        method: "GET",
        headers,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (resp.ok) {
        const typeLabel = isOllama ? "Ollama Native" : "OpenAI-compatible";
        return {
          ...baseInfo,
          hasBalance: false,
          statusText: `Connected [${typeLabel}]`
        };
      } else {
        return {
          ...baseInfo,
          hasBalance: false,
          statusText: `Local LLM (${resp.status} ${resp.statusText})`
        };
      }
    } catch {
      return {
        ...baseInfo,
        hasBalance: false,
        statusText: "Offline \u2014 ensure local runner is running",
        error: "Cannot connect to local LLM server"
      };
    }
  }
  if (!apiKey) {
    return {
      ...baseInfo,
      statusText: "No API key configured",
      error: "No API key"
    };
  }
  if (providerId === "openrouter") {
    try {
      const resp = await fetch("https://openrouter.ai/api/v1/credits", {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
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
          statusText: `${balanceFormatted} left ($${totalUsage.toFixed(2)} used / $${totalCredits.toFixed(2)} total)`
        };
      } else if (resp.status === 401) {
        return {
          ...baseInfo,
          statusText: "Invalid API key",
          error: "Authentication failed"
        };
      } else {
        return {
          ...baseInfo,
          statusText: "OpenRouter (Active)"
        };
      }
    } catch (err) {
      return {
        ...baseInfo,
        statusText: "OpenRouter (Network error)",
        error: String(err)
      };
    }
  }
  if (providerId === "deepseek") {
    try {
      const resp = await fetch("https://api.deepseek.com/user/balance", {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json"
        }
      });
      if (resp.ok) {
        const json = await resp.json();
        const info = json?.balance_infos?.[0];
        const curr = info?.currency || "CNY";
        const symbol = curr === "USD" ? "$" : "\xA5";
        const balance = parseFloat(info?.total_balance || "0");
        const balanceFormatted = `${symbol}${balance.toFixed(2)}`;
        return {
          ...baseInfo,
          hasBalance: true,
          balanceFormatted,
          currency: curr,
          statusText: `${balanceFormatted} available`
        };
      } else if (resp.status === 401) {
        return { ...baseInfo, statusText: "Invalid API key", error: "Auth failed" };
      }
    } catch {
    }
    return { ...baseInfo, statusText: "DeepSeek (Active)" };
  }
  if (providerId === "kimi") {
    try {
      const resp = await fetch("https://api.moonshot.cn/v1/users/me/balance", {
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      });
      if (resp.ok) {
        const json = await resp.json();
        const balance = json?.data?.available_balance ?? 0;
        const balanceFormatted = `\xA5${Number(balance).toFixed(2)}`;
        return {
          ...baseInfo,
          hasBalance: true,
          balanceFormatted,
          currency: "CNY",
          statusText: `${balanceFormatted} available`
        };
      } else if (resp.status === 401) {
        return { ...baseInfo, statusText: "Invalid API key", error: "Auth failed" };
      }
    } catch {
    }
    return { ...baseInfo, statusText: "Kimi (Active)" };
  }
  return {
    ...baseInfo,
    hasBalance: false,
    statusText: `${provider?.label || providerId} (Pay-as-you-go / Direct)`
  };
}
var AIError, AIClient;
var init_client = __esm({
  "../shared/src/client.ts"() {
    init_catalog();
    AIError = class extends Error {
      code;
      statusCode;
      constructor(code, message, statusCode) {
        super(message);
        this.name = "AIError";
        this.code = code;
        this.statusCode = statusCode ?? null;
      }
    };
    AIClient = class {
      config;
      constructor(settings) {
        this.config = resolveConfig(settings);
      }
      async checkCredit(settings) {
        return checkCreditAI(settings);
      }
      async chat(prompt, maxTokens) {
        return chatAI(prompt, maxTokens, this.config);
      }
    };
  }
});

// src/ai-client.ts
var ai_client_exports = {};
__export(ai_client_exports, {
  AIClient: () => AIClient,
  AIError: () => AIError,
  OPENROUTER_ENDPOINT: () => OPENROUTER_ENDPOINT,
  PROVIDER_CATALOG: () => PROVIDER_CATALOG,
  chatAI: () => chatAI,
  checkCreditAI: () => checkCreditAI,
  classifyError: () => classifyError,
  findOpenRouterFamily: () => findOpenRouterFamily,
  isAIConfigured: () => isAIConfigured,
  resolveConfig: () => resolveConfig
});
var init_ai_client = __esm({
  "src/ai-client.ts"() {
    "use strict";
    init_catalog();
    init_client();
  }
});

// tests/ai-processor.test.ts
var import_node_test = require("node:test");
var import_strict = __toESM(require("node:assert/strict"));

// ../shared/src/ai-processor.ts
init_catalog();
init_client();

// ../shared/src/chunker.ts
var DEFAULT_CHUNK_WINDOW_CHARS = 3e4;
var DEFAULT_SECTION_SECS = 300;
function lineSeconds(line) {
  const m = line.trim().match(/^\[(\d{1,2}:)?(\d{1,2}):(\d{2})\]/);
  if (!m)
    return null;
  const parts = m[0].slice(1, -1).split(":").map(Number);
  if (parts.length === 3)
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2)
    return parts[0] * 60 + parts[1];
  return null;
}
function toSeconds(time) {
  const parts = (time || "").split(":").map(Number);
  if (parts.some((n) => Number.isNaN(n)))
    return 0;
  if (parts.length === 3)
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2)
    return parts[0] * 60 + parts[1];
  return 0;
}
function formatSeconds(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor(sec % 3600 / 60);
  const s = Math.floor(sec % 60);
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
function partNote(chunk) {
  const at = chunk.startTime ? ` (from ${chunk.startTime})` : "";
  return `**Part:** ${chunk.index + 1} of ${chunk.total}${at}`;
}
function paragraphChunks(content, chapters, chunkSize = DEFAULT_CHUNK_WINDOW_CHARS) {
  const paras = content.split(/\n\n+/);
  const chunks = [];
  let buf = [];
  let bufChars = 0;
  const flush = () => {
    if (!buf.length)
      return;
    chunks.push({
      index: 0,
      total: 0,
      content: buf.join("\n\n"),
      chapters: [],
      startTime: "",
      sections: []
    });
    buf = [];
    bufChars = 0;
  };
  for (const p of paras) {
    if (p.length > chunkSize) {
      flush();
      for (let i = 0; i < p.length; i += chunkSize) {
        chunks.push({
          index: 0,
          total: 0,
          content: p.slice(i, i + chunkSize),
          chapters: [],
          startTime: "",
          sections: []
        });
      }
      continue;
    }
    if (bufChars + p.length > chunkSize)
      flush();
    buf.push(p);
    bufChars += p.length + 2;
  }
  flush();
  if (chunks.length === 0) {
    chunks.push({ index: 0, total: 1, content, chapters, startTime: "", sections: [] });
  }
  chunks.forEach((c, i) => {
    c.index = i;
    c.total = chunks.length;
  });
  if (chunks.length === 1)
    chunks[0].chapters = chapters;
  return chunks;
}
function timestampedChunks(lines, firstTsIdx, chapters, chunkSize = DEFAULT_CHUNK_WINDOW_CHARS, sectionGridSecs = DEFAULT_SECTION_SECS) {
  const preambleLines = lines.slice(0, firstTsIdx);
  const filteredPreamble = [];
  let inChaptersSection = false;
  for (const line of preambleLines) {
    if (line.trim().startsWith("## Chapters")) {
      inChaptersSection = true;
      continue;
    }
    if (inChaptersSection && line.trim().startsWith("#")) {
      inChaptersSection = false;
    }
    if (!inChaptersSection) {
      filteredPreamble.push(line);
    }
  }
  const cleanPreamble = filteredPreamble.join("\n").trim();
  const units = [];
  let lastCaptionSec = 0;
  for (let i = firstTsIdx; i < lines.length; i++) {
    const sec = lineSeconds(lines[i]);
    if (sec === null)
      continue;
    units.push({ sec, line: lines[i] });
    lastCaptionSec = Math.max(lastCaptionSec, sec);
  }
  const chunks = [];
  let buf = [];
  let bufChars = 0;
  let startSec = 0;
  const flush = () => {
    if (!buf.length)
      return;
    chunks.push({
      index: 0,
      total: 0,
      content: buf.join("\n"),
      chapters: [],
      startTime: formatSeconds(startSec),
      sections: []
    });
    buf = [];
    bufChars = 0;
  };
  for (const u of units) {
    if (bufChars + u.line.length > chunkSize)
      flush();
    if (!buf.length)
      startSec = u.sec;
    buf.push(u.line);
    bufChars += u.line.length + 1;
  }
  flush();
  if (chunks.length === 0) {
    return paragraphChunks(lines.join("\n"), chapters, chunkSize);
  }
  const starts = chunks.map((c) => toSeconds(c.startTime));
  for (const ch of chapters) {
    const t = toSeconds(ch.time);
    let idx = 0;
    for (let i = starts.length - 1; i >= 0; i--) {
      if (t >= starts[i]) {
        idx = i;
        break;
      }
    }
    chunks[idx].chapters.push(ch);
  }
  if (chapters.length === 0 && lastCaptionSec >= sectionGridSecs) {
    const begins = chunks.map((c) => toSeconds(c.startTime));
    for (let t = 0; t < lastCaptionSec + 1; t += sectionGridSecs) {
      let idx = 0;
      for (let i = begins.length - 1; i >= 0; i--) {
        if (t >= begins[i]) {
          idx = i;
          break;
        }
      }
      chunks[idx].sections.push(formatSeconds(t));
    }
  }
  chunks.forEach((c, i) => {
    c.index = i;
    c.total = chunks.length;
    if (chunks.length === 1) {
      c.content = `${preambleLines.join("\n")}

${c.content}`;
    } else if (cleanPreamble) {
      c.content = `${cleanPreamble}

${c.content}`;
    }
  });
  return chunks;
}
function chunkContent(content, chapters = [], chunkWindowChars = DEFAULT_CHUNK_WINDOW_CHARS, sectionGridSeconds = DEFAULT_SECTION_SECS) {
  const lines = (content || "").split("\n");
  const firstTsIdx = lines.findIndex((l) => lineSeconds(l) !== null);
  if (firstTsIdx !== -1) {
    return timestampedChunks(
      lines,
      firstTsIdx,
      chapters,
      chunkWindowChars,
      sectionGridSeconds
    );
  }
  if (content.length <= chunkWindowChars) {
    return [
      { index: 0, total: 1, content, chapters, startTime: "", sections: [] }
    ];
  }
  return paragraphChunks(content, chapters, chunkWindowChars);
}

// ../shared/src/egg-format.ts
function extractEggLanguage(content) {
  if (!content)
    return "";
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (fmMatch) {
    for (const line of fmMatch[1].split(/\r?\n/)) {
      const kv = line.match(/^(\w+):\s*(.*)$/);
      if (kv && kv[1].toLowerCase() === "language") {
        return kv[2].trim().replace(/^["'](.*)["']$/, "$1");
      }
    }
  }
  const directMatch = content.match(/^language:\s*["']?([^"'\r\n]+)["']?/im);
  return directMatch ? directMatch[1].trim() : "";
}
function insertEggLanguage(content, language, options) {
  if (!content || !language)
    return content;
  const existing = extractEggLanguage(content);
  if (existing && !options?.overwrite)
    return content;
  if (existing && options?.overwrite) {
    return content.replace(/^language:\s*["']?[^"'\r\n]*["']?/im, `language: "${language}"`);
  }
  if (/^language:\s*["']?["']?\s*$/m.test(content)) {
    return content.replace(/^language:\s*["']?["']?\s*$/m, `language: "${language}"`);
  }
  const fmRegex = /^(---\r?\n)([\s\S]*?)(\r?\n---)/;
  const match = content.match(fmRegex);
  if (match) {
    const opening = match[1];
    const body = match[2];
    const closing = match[3];
    const separator = body.endsWith("\n") || body.length === 0 ? "" : "\n";
    const newBody = `${body}${separator}language: "${language}"`;
    return content.replace(fmRegex, `${opening}${newBody}${closing}`);
  }
  return `---
language: "${language}"
---

${content}`;
}
function formatEggInstructionsForPrompt(egg2) {
  const parts = [];
  parts.push(`**Scope:** ${egg2.scope || "(not specified)"}`);
  if (egg2.keyQuestions && egg2.keyQuestions.length > 0) {
    parts.push(
      `**Key Questions:**
${egg2.keyQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`
    );
  }
  if (egg2.rejectionCriteria && egg2.rejectionCriteria.length > 0) {
    parts.push(
      `**Rejection Criteria:**
${egg2.rejectionCriteria.map((c) => `- ${c}`).join("\n")}`
    );
  }
  if (egg2.formattingRules) {
    parts.push(`**Formatting Rules:**
${egg2.formattingRules}`);
  }
  return parts.join("\n\n");
}
function formatEggKnowledgeForPrompt(egg2) {
  const parts = [];
  parts.push(`**Current Knowledge:**
${egg2.knowledge || "(empty)"}`);
  if (egg2.unprocessed && egg2.unprocessed.trim()) {
    parts.push(`**Unprocessed (pending merge):**
${egg2.unprocessed}`);
  }
  return parts.join("\n\n");
}
function formatEggForPrompt(egg2) {
  return [
    formatEggInstructionsForPrompt(egg2),
    formatEggKnowledgeForPrompt(egg2)
  ].join("\n\n");
}
function countUnprocessed(egg2) {
  const indentOf = (l) => (l.match(/^\s*/) || [""])[0].length;
  const bullets = (egg2.unprocessed || "").split("\n").map((l) => l.replace(/\s+$/, "")).filter((l) => /^\s*[-*]\s/.test(l));
  if (bullets.length === 0)
    return 0;
  const base = Math.min(...bullets.map(indentOf));
  return bullets.filter((l) => indentOf(l) === base).length;
}

// ../shared/src/json-repair.ts
function repairTruncatedJson(jsonStr) {
  const firstBrace = jsonStr.indexOf("{");
  if (firstBrace === -1)
    return null;
  let text = jsonStr.slice(firstBrace).trim();
  const stack = [];
  let inString = false;
  let escaped = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (c === "\\") {
        escaped = true;
      } else if (c === '"') {
        inString = false;
      }
      continue;
    }
    if (c === '"') {
      inString = true;
    } else if (c === "{" || c === "[") {
      stack.push(c);
    } else if (c === "}") {
      if (stack[stack.length - 1] === "{")
        stack.pop();
    } else if (c === "]") {
      if (stack[stack.length - 1] === "[")
        stack.pop();
    }
  }
  if (stack.length === 0 && !inString) {
    return text;
  }
  if (inString) {
    text += '"';
  }
  if (stack[stack.length - 1] === "{") {
    text = text.replace(/,?\s*"[^"]*"\s*:\s*$/, "");
    text = text.replace(/(?:\{|,)\s*"[^"]*"\s*$/, (m) => m.startsWith("{") ? "{" : "");
  }
  text = text.replace(/,\s*$/, "").trim();
  const finalStack = [];
  let inStr = false;
  let esc = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (esc)
        esc = false;
      else if (c === "\\")
        esc = true;
      else if (c === '"')
        inStr = false;
      continue;
    }
    if (c === '"')
      inStr = true;
    else if (c === "{" || c === "[")
      finalStack.push(c);
    else if (c === "}") {
      if (finalStack[finalStack.length - 1] === "{")
        finalStack.pop();
    } else if (c === "]") {
      if (finalStack[finalStack.length - 1] === "[")
        finalStack.pop();
    }
  }
  while (finalStack.length > 0) {
    const open = finalStack.pop();
    if (open === "{")
      text += "}";
    else if (open === "[")
      text += "]";
  }
  return text;
}
function sanitizeJsonString(str) {
  let result = "";
  let inString = false;
  let escaped = false;
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (inString) {
      if (escaped) {
        escaped = false;
        result += c;
      } else if (c === "\\") {
        escaped = true;
        result += c;
      } else if (c === '"') {
        inString = false;
        result += c;
      } else if (c === "\n") {
        result += "\\n";
      } else if (c === "\r") {
        result += "\\r";
      } else if (c === "	") {
        result += "\\t";
      } else if (c.charCodeAt(0) < 32) {
        result += "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0");
      } else {
        result += c;
      }
    } else {
      if (c === '"')
        inString = true;
      result += c;
    }
  }
  return result.replace(/,\s*([}\]])/g, "$1");
}
function parseJson(response, context = "response") {
  let jsonStr = (response || "").trim();
  if (!jsonStr) {
    console.warn(`[NutEgg] Empty AI response received for (${context}).`);
    return {};
  }
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  } else if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }
  try {
    return JSON.parse(jsonStr);
  } catch {
  }
  const sanitized = sanitizeJsonString(jsonStr);
  try {
    return JSON.parse(sanitized);
  } catch {
  }
  const braceMatch = sanitized.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    try {
      return JSON.parse(braceMatch[0]);
    } catch {
    }
  }
  try {
    const target = braceMatch ? braceMatch[0].trim() : sanitized.trim();
    if (target.startsWith("{") && target.endsWith("}")) {
      const obj = Function("return (" + target + ")")();
      if (obj && typeof obj === "object" && !Array.isArray(obj)) {
        return obj;
      }
    }
  } catch {
  }
  const repaired = repairTruncatedJson(sanitized);
  if (repaired) {
    try {
      const res = JSON.parse(repaired);
      console.warn(`[NutEgg] Recovered truncated JSON response (${context})`);
      return res;
    } catch {
      try {
        const repTrim = repaired.trim();
        if (repTrim.startsWith("{") && repTrim.endsWith("}")) {
          const obj = Function("return (" + repTrim + ")")();
          if (obj && typeof obj === "object" && !Array.isArray(obj)) {
            console.warn(`[NutEgg] Recovered truncated JSON expression (${context})`);
            return obj;
          }
        }
      } catch {
      }
    }
  }
  console.warn(
    `[NutEgg] Failed to parse AI JSON response (${context}) [length=${jsonStr.length}]:`,
    jsonStr.slice(0, 500)
  );
  return {};
}

// ../shared/workflow/content-analysis.md
var content_analysis_default = `You are a knowledge curator. Analyze the content below following the Task.

## Content to Analyze
**Title:** {{title}}
**Source:** {{url}}
**Type:** {{source_type}}
{{part_note}}{{chapters}}
{{sections}}{{questions}}

{{content}}

## Task
{{content_task_default}}

## Output Format
Respond with ONLY a valid JSON object matching this schema (no markdown, no code fence, just the JSON object):
{
  "titleVerdict": "direct answer to the title's question",
  "coreSummary": ["bullet 1", "bullet 2", "bullet 3"],
  "mindMap": [
    {
      "name": "First Main Topic / Theme",
      "detail": "Core idea or thesis of this branch",
      "children": [
        {
          "name": "Subtopic / Concept",
          "detail": "Key reasoning, mechanism, or explanation",
          "children": [
            {
              "name": "Detail / Evidence",
              "detail": "Concrete takeaway or example"
            }
          ]
        }
      ]
    },
    {
      "name": "Second Main Topic / Theme",
      "detail": "Core idea or thesis of this branch",
      "children": [
        {
          "name": "Subtopic / Concept",
          "detail": "Key reasoning, mechanism, or explanation"
        }
      ]
    }
  ],
  "isLongForm": true,
  "chapterMap": [
    {"time": "00:12:34", "title": "chapter title", "summary": "one sentence"}
  ],
  "customQuestionAnswers": [
    {
      "question": "exact question text",
      "answer": "direct answer",
      "sources": [{"ref": "12:34", "quote": "brief supporting quote"}]
    }
  ]
}

## Output Rules
- titleVerdict must be a single sentence.
- coreSummary: at most 3 bullets, plain language.
- mindMap: main branches/topics directly at the root level (do NOT wrap everything in a single overall root node; start directly with the main themes/sections), up to 3 levels deep total. Each node has a concise name and rich explanatory detail (1-2 sentences). Structure logically to form an outline/mind map of the author's ideas.
- isLongForm: true only for long articles/videos that meaningfully benefit from a chapter map.
- chapterMap: empty array when isLongForm is false. When video chapters are provided, keep their exact timestamps and titles, and only add your 1-sentence summary.
- chapterMap when Video Sections are listed above: return EXACTLY one entry per listed section, using the section's start time as "time" \u2014 give each a short title and a 1-sentence summary of what happens between that section and the next.
- chapterMap when NO chapters or sections were provided: empty array (the content is not a timestamped video).
- customQuestionAnswers: one entry per DISTINCT user question (empty array when none). Skip any user question that is equivalent in meaning to an Egg Key Question above or to another user question \u2014 answer it only once.
{{shared_output_rules}}
`;

// ../shared/workflow/egg-analysis.md
var egg_analysis_default = `You are a knowledge curator for the egg file "{{egg_file}}". Extract knowledge entries from the content below according to this egg's instructions.

## Egg Instructions
{{egg_instructions}}

## Content to Analyze
**Title:** {{title}}
**Source:** {{url}}
**Type:** {{source_type}}
{{part_note}}

{{content}}

## Task
1. Follow action guide in Egg Instructions
2. Answer each Key Question (if any) directly and concisely based on the content.
3. Extract Knowledge Entries: extract all substantive insights, concepts, frameworks, and findings from the content that fall within this egg's Scope, formatted strictly per the Formatting Rules:
   - Follow the concept \u2192 explanation \u2192 example structure: one top-level bullet "- [tag] **Concept**: short phrases" (without "[tag] " when the egg defines no tags), with the explanation as one indented sub-bullet and concrete examples from the content as further indented sub-bullets ("  - \u{1F3AF} Example: ...") when present. Name each Concept clearly.
   - Structured enumerations / frameworks (numbered lists, step-by-step methods, named frameworks): capture as ONE complete entry preserving EVERY item in order. Never summarize items away, never truncate.
   - Do NOT include author or source \u2014 they are appended automatically.

## Output Format
Respond in this EXACT JSON format (no markdown, no code fence, just the JSON object):
{
  "language": "English",
  "keyQuestionAnswers": [
    {
      "question": "exact question text",
      "answer": "direct answer",
      "sources": [{"ref": "12:34", "quote": "brief supporting quote"}]
    }
  ],
  "extractedEntries": [
    {"kind": "insight", "content": "- [tag] **Concept**: short phrases\\n  - explanation\\n  - \u{1F3AF} Example: ..."}
  ]
}

## Output Rules:
- language: the primary natural language of the egg note or extracted entries (e.g. "English", "Chinese", "Japanese", etc.).
- extractedEntries: empty array if the content contains no substantive knowledge matching this egg's scope. "kind" is "insight" (default) or "list" (for structured enumerations).
{{shared_output_rules}}
`;

// ../shared/workflow/follow-up.md
var follow_up_default = `You are a knowledge curator. Answer the user's follow-up questions about this content.

## Content to Analyze
**Title:** {{title}}
**Source:** {{url}}
**Type:** {{source_type}}
{{prior_qa}}

{{content}}

## New Questions (answer each directly and concisely)
{{questions}}

## Output Format
Respond in this EXACT JSON format (no markdown, no code fence, just the JSON object):
{
  "answers": [
    {
      "question": "exact question text",
      "answer": "direct answer",
      "sources": [{"ref": "12:34", "quote": "brief supporting quote"}]
    }
  ]
}

## Output Rules:
- One entry per question, in the same order.
- If a question is equivalent to one in Previous Questions & Answers, answer briefly with the same conclusion instead of repeating it.
{{shared_output_rules}}
`;

// ../shared/workflow/egg-routing.md
var egg_routing_default = 'Given this content and egg index, which egg file(s) does this content belong to? Return ONLY the file names, one per line. If none match, return "none".\n\n## Content\nTitle: {{title}}\nURL: {{url}}\n{{content}}\n\n## Egg Index\n{{index}}\n\nReturn matching file names (one per line):\n';

// ../shared/workflow/content-task-default.md
var content_task_default_default = "1. Title Verdict: Provide a single, direct sentence that resolves the core question posed in the title or introduction.\n2. Core Summary: Summarize the main concepts in plain language using a maximum of 3 bullet points.\n3. Chapter Map (Long-form only): If the content is a long article or lengthy video, provide a brief 1-sentence summary for each major section or topic shift. If it is short, omit this step entirely.\n4. Mind Map: Construct a hierarchical concept tree capturing the core mental model or argument flow (up to 3 levels deep). Each node must have a concise `name` and informative explanatory `detail`.\n";

// ../shared/workflow/merge-unprocessed.md
var merge_unprocessed_default = `You are a knowledge curator for the egg file "{{egg_file}}". The Unprocessed section has accumulated {{unprocessed_count}} entries \u2014 merge them into the knowledge tree below.

## Formatting Rules
{{formatting_rules}}

## Existing Knowledge Tree
{{knowledge_tree}}

## Entries to Merge
{{unprocessed}}

## Task
1. PRESERVE the existing tree structure as much as possible: do not rename, restructure, or delete existing branches \u2014 the user may have edited them by hand.
2. Deduplicate the entries against EACH OTHER first, comparing their Concepts: entries with the same or equivalent concept are ONE entry, even when the explanations differ \u2014 keep the clearest explanation, fold the others' examples into it, and keep every distinct _author/_source line. A near-duplicate must never appear twice in the merged tree \u2014 dropping redundant rewordings is more valuable than preserving slight wording differences.
3. Structured lists (entries holding a numbered enumeration / framework): entries with the same title are fragments of ONE list \u2014 union their items (drop exact-duplicate items), keep the source's item order. Never truncate a list: every item the source enumerated must survive the merge.
4. Nest each deduplicated entry under the most relevant existing concept as sub-bullets.
5. Only when an entry matches no existing concept, create a new minimal top-level branch for it.
6. Keep each entry's insight, concrete examples, and its _author/_source lines intact when moving it into the tree.
7. If an entry's concept duplicates existing knowledge in the tree, drop it entirely.
8. If an entry cannot be merged meaningfully, leave it in the "unprocessed" output.

## Output Format
Respond in this EXACT JSON format (no markdown, no code fence, just the JSON object):
{
  "knowledge": "the COMPLETE updated Knowledge section content as markdown \u2014 the existing tree with the merged entries nested in. Only the section BODY: do NOT include the '# Knowledge' heading line itself.",
  "unprocessed": "the entries that could not be merged (markdown), or an empty string when all were merged. Only the section BODY: do NOT include the '# Unprocessed' heading line itself."
}

## Output Rules:
- Output Language: write ALL output text (knowledge entries, explanations) in {{output_language}}. Keep JSON keys in English.
`;

// ../shared/workflow/aggregate-content.md
var aggregate_content_default = `You are a knowledge curator. The content below was too long for one pass and was analyzed in parts. Combine the per-part results into ONE coherent result for the whole content.

## Content
**Title:** {{title}}
**Source:** {{url}}
{{chapters}}

## Per-Part Summaries
{{chunk_summaries}}

{{questions}}

## Task
{{content_task_default}}

## Output Format
Respond in this EXACT JSON format (no markdown, no code fence, just the JSON object):
{
  "titleVerdict": "direct answer to the title's question",
  "coreSummary": ["bullet 1", "bullet 2"],
  "mindMap": [
    {
      "name": "First Main Topic",
      "detail": "Core idea",
      "children": [
        {
          "name": "Subtopic",
          "detail": "Key reasoning"
        }
      ]
    },
    {
      "name": "Second Main Topic",
      "detail": "Core idea",
      "children": [
        {
          "name": "Subtopic",
          "detail": "Key reasoning"
        }
      ]
    }
  ],
  "customQuestionAnswers": [
    {
      "question": "exact question text",
      "answer": "direct answer",
      "sources": [{"ref": "00:00", "quote": "brief supporting quote"}]
    }
  ]
}

## Output Rules
- mindMap: synthesized concept tree for the entire work, up to 3 levels deep, integrating points from across the parts. Have main branches directly at the root level (do NOT wrap in a single overall root node).
- customQuestionAnswers: one entry per DISTINCT user question (empty array when none). When citing sources, use timestamps or section headers from the Part summaries.
{{shared_output_rules}}
`;

// ../shared/workflow/aggregate-egg.md
var aggregate_egg_default = 'You are a knowledge curator for the egg file "{{egg_file}}". The content was too long for one pass and was analyzed against this egg in parts. Decide for the content AS A WHOLE and synthesize knowledge entries across parts.\n\n## Egg Instructions\n{{egg_instructions}}\n\n## Per-Part Findings\n{{chunk_findings}}\n\n## Task\n1. Synthesize Knowledge Entries across parts into "novelDelta":\n   - Connect and assemble related findings that spread across different parts (e.g. principles of a framework, steps of a methodology, or concepts introduced in one part and expanded in another) into complete, unified knowledge entries.\n   - When a concept was partially mentioned in an earlier part and fully explained in a later part, merge them into the single complete entry.\n   - For standalone insights from individual parts, preserve them as formatted entries.\n   - Determine "parent" in the Knowledge Tree for each entry.\n2. Answer each Key Question (if any) for the whole content, directly and concisely.\n3. Apply the Rejection Criteria to the whole content \u2014 set rejected to true with a one-line reason when it is noise for this egg.\n4. Decide: should the user spend time reading/watching this fully? Consider the reject criteria and whether the parts together add new insight.\n\n## Output Format\nRespond in this EXACT JSON format (no markdown, no code fence, just the JSON object):\n{\n  "novelDelta": [\n    {"parent": "parent heading in knowledge tree or empty string", "kind": "insight", "content": "- formatted entry text\\n  - sub bullets"}\n  ],\n  "keyQuestionAnswers": [\n    {\n      "question": "exact question text",\n      "answer": "direct answer",\n      "sources": [{"ref": "00:00", "quote": "brief supporting quote"}]\n    }\n  ],\n  "rejected": false,\n  "rejectReason": "",\n  "readVerdict": true,\n  "readVerdictReason": "one-line reason"\n}\n\n## Output Rules:\n{{shared_output_rules}}\n';

// ../shared/workflow/egg-compare.md
var egg_compare_default = `You are a knowledge curator for the egg file "{{egg_file}}".
Your task is to compare newly extracted candidate knowledge entries from a source against this egg's existing Knowledge tree and Unprocessed entries to identify genuinely NEW insights and decide if the source is worth reading.

## Existing Knowledge in Egg
### Current Knowledge Tree
{{current_knowledge}}

### Unprocessed Entries (pending merge)
{{unprocessed}}

## Rejection Criteria
{{rejection_criteria}}

## Candidate Knowledge Entries Extracted from Source
**Source Title:** {{title}}
**Source URL:** {{url}}

{{extracted_entries}}

## Task
1. Novel Delta: compare each candidate knowledge entry against the Current Knowledge Tree AND the Unprocessed entries.
   - Compare by CONCEPT: an insight is new only when its core concept is not already covered in the existing knowledge. The same concept with different wording or a different minor example is a DUPLICATE, not new.
   - Classify EVERY candidate entry into either "novelDelta" (genuinely new) or "redundantEntries" (already covered/known in the existing knowledge tree).
   - EXCEPTION \u2014 structured content: when an entry is a well-organized enumeration (a numbered list, a named framework like "Seven Principles of X", a step-by-step process), preserve the COMPLETE list intact in novelDelta unless the entire framework already exists in the tree.
   - For each kept novel entry: determine "parent" \u2014 the EXACT text of the existing bullet or heading in the Current Knowledge tree that best fits as a parent topic to nest under (use "" if no suitable parent exists in the tree).
   - For each redundant entry: determine "existingParent" \u2014 the existing concept or heading it was already covered under.
2. Rejection Criteria:
   - If the content violates the Rejection Criteria or has NO new/novel knowledge for this egg, set "rejected": true and give a one-line "rejectReason".
3. Read Verdict:
   - Decide if the user should spend time reading/watching this source fully ("readVerdict": true/false).
   - If novel, valuable insights were found, set "readVerdict": true with a one-line "readVerdictReason".
   - If redundant, superficial, or noise, set "readVerdict": false with a one-line "readVerdictReason".

## Output Format
Respond in this EXACT JSON format (no markdown, no code fence, just the JSON object):
{
  "novelDelta": [
    {"parent": "exact parent bullet text from knowledge tree or empty string", "kind": "insight", "content": "- formatted entry text\\n  - sub bullets"}
  ],
  "redundantEntries": [
    {"existingParent": "matched concept or heading in knowledge tree", "content": "- candidate entry text that was already known"}
  ],
  "rejected": false,
  "rejectReason": "",
  "readVerdict": true,
  "readVerdictReason": "one-line explanation"
}

## Output Rules:
- "parent" must match the exact text of a heading or bullet in Current Knowledge ("" if none).
- "kind" is "insight" or "list".
{{shared_output_rules}}
`;

// ../shared/workflow/localize-egg.md
var localize_egg_default = 'You are a knowledge curator for NutEgg.\n\n## Egg Description\n{{description}}\n\n## Egg Template\n{{template}}\n\n## Task\nTranslate and adapt the concrete instructions, questions, criteria, and rule descriptions in the template above so they use the SAME LANGUAGE as the egg description: "{{description}}".\n\n## Output Rules:\n1. Language: All explanations, questions, criteria, and rule guidance must be written in the same language as the egg description: "{{description}}".\n2. Egg Parser Structure: The structure and these exact labels MUST remain in English:\n   - Frontmatter (`---`, `topic: ...`, `status: ...`, `last_updated: ...`, `language: <detected language name in English, e.g. English, Chinese, Japanese, Korean, Spanish, French, German, Russian>`)\n   - Callout: `> [!abstract]- Instructions:`\n   - Bold section labels: `> **Scope:**`, `> **Action Guide:**`, `> **Key Questions:**`, `> **Rejection Criteria:**`, `> **Formatting Rules:**`\n   - Step labels in Action Guide: `1. Title Verdict:`, `2. Core Summary:`, `3. Chapter Map (Long-form only):`, `4. Novel Delta:`, `5. Decide:`\n   - Headings: `# Knowledge` and `# Unprocessed`\n   - Tag names in Formatting Rules: `[concept]`, `[architecture]`, `[method]`, `[benchmark]`, `[explain]`, `[fact]`, `[example]`\n\nOutput ONLY the complete updated egg file markdown. Do NOT wrap in markdown code fences.\n\n';

// ../shared/workflow/shared-output-rules.md
var shared_output_rules_default = '- Grounding: The content is the ONLY source of truth for every answer and summary you produce. Report what the content actually says even when it contradicts common sense or well-known facts \u2014 never correct, refute, or supplement it with outside knowledge. If the content does not address a question, say "Not covered in this content".\n- Source References: For every question you answer (customQuestionAnswers, keyQuestionAnswers, answers), include a "sources" array citing WHERE in the content the answer comes from: `[{"ref": "...", "quote": "..."}]`.\n  - For video transcripts: `ref` must be the timestamp string (e.g. "12:34" or "1:05:30") where the relevant segment begins.\n  - For articles/webpages: `ref` must be the nearest section heading (e.g. "Methodology" or "Key Findings") or short location hint.\n  - `quote`: A brief verbatim excerpt (10-25 words) from that location directly supporting the answer.\n  - If the question is not covered in the content (or answered "Not covered in this content"), omit the "sources" field or return an empty array `[]`.\n- Output Language: Write ALL output text (verdicts, summaries, answers, knowledge entries, reasons) in {{output_language}}. Keep all JSON keys in English.';

// ../shared/src/prompt-templates.ts
var PROMPTS = {
  /** Phase 1 — content summary + chapter map + custom question answers. */
  contentAnalysis: content_analysis_default,
  /** Step 1 extraction — content against one egg using instructions only. */
  eggAnalysis: egg_analysis_default,
  /** Step 2 comparison — candidate knowledge entries vs egg knowledge tree. */
  eggCompare: egg_compare_default,
  /** Follow-up questions after the initial analysis. */
  followUp: follow_up_default,
  /** Egg routing — match content to egg files from _index.md. */
  eggRouting: egg_routing_default,
  /** Default content analysis task (Title Verdict, Core Summary, Chapter Map). */
  contentTaskDefault: content_task_default_default.trim(),
  /** Merge 20+ Unprocessed entries into the Knowledge tree. */
  mergeUnprocessed: merge_unprocessed_default,
  /** Combine per-part results into one result for long content. */
  aggregateContent: aggregate_content_default,
  /** Per-egg verdict + key questions for long content (after per-part delta). */
  aggregateEgg: aggregate_egg_default,
  /** Localize egg template matching the description language while keeping parser structure in English. */
  localizeEgg: localize_egg_default,
  /** Shared output rules (grounding + language reference) injected into prompts. */
  sharedOutputRules: shared_output_rules_default.trim()
};
function renderPrompt(template, vars = {}) {
  if (!template)
    return "";
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
    const value = vars[key];
    return value === void 0 || value === null ? "" : String(value);
  });
}

// ../shared/src/ai-processor.ts
var MERGE_THRESHOLD = 20;
var AIProcessor = class {
  host;
  constructor(host) {
    this.host = host;
  }
  get chunkWindowChars() {
    const val = this.host?.settings?.chunkWindowChars;
    return typeof val === "number" && val > 0 ? val : DEFAULT_CHUNK_WINDOW_CHARS;
  }
  get sectionGridSeconds() {
    const val = this.host?.settings?.sectionGridSeconds;
    return typeof val === "number" && val > 0 ? val : DEFAULT_SECTION_SECS;
  }
  getPrompt(key) {
    const overrides = this.host?.settings?.promptOverrides || this.host?.settings?.chromeAiPromptOverrides;
    if (overrides && typeof overrides[key] === "string" && overrides[key].trim().length > 0) {
      return overrides[key];
    }
    return this.host?.workflowManager?.getPrompt(key) || PROMPTS[key] || "";
  }
  /** Output rules for Stage 1 content analysis (follows settings.contentOutputLanguage). */
  getContentOutputRules() {
    const langSetting = this.host?.settings?.contentOutputLanguage || this.host?.settings?.chromeAiOutputLanguage || "same-as-content";
    const isSame = !langSetting || langSetting === "same-as-content";
    const outputLanguage = isSame ? "the same language as the captured content" : `${langSetting} (translate into ${langSetting} even if the source content is in a different language)`;
    const tpl = this.getPrompt("sharedOutputRules");
    return renderPrompt(tpl, { output_language: outputLanguage }).trim();
  }
  /** Output rules for Stage 2 egg analysis (follows the egg's language property). */
  getEggOutputRules(eggOrLanguage = "", fallbackDescription = "") {
    let lang = "";
    let desc = fallbackDescription;
    if (typeof eggOrLanguage === "object" && eggOrLanguage !== null) {
      lang = (eggOrLanguage.language || "").trim();
      desc = desc || (eggOrLanguage.indexDescription || "").trim();
    } else {
      lang = (eggOrLanguage || "").trim();
    }
    const pluginSetting = this.host?.settings?.contentOutputLanguage || this.host?.settings?.chromeAiOutputLanguage;
    const pluginLang = pluginSetting && pluginSetting !== "same-as-content" ? pluginSetting.trim() : "";
    const outputLanguage = lang ? lang.includes(" ") && !/^[A-Za-z]+$/.test(lang) ? `the same language as this reference: "${lang}"` : `${lang} (translate into ${lang} even if the source content is in a different language)` : pluginLang ? `${pluginLang} (translate into ${pluginLang} even if the source content is in a different language)` : "the same language as this egg note's existing knowledge (or the captured content if the egg has no existing knowledge)";
    const tpl = this.getPrompt("sharedOutputRules");
    return renderPrompt(tpl, {
      output_language: outputLanguage
    }).trim();
  }
  /**
   * Run end-to-end pipeline: Stage 1 content analysis + Stage 2 egg analysis.
   */
  async analyze(capture2, eggs) {
    if (!isAIConfigured(this.host?.settings)) {
      return this.fallbackAnalysis(capture2, eggs);
    }
    const contentAnalysis = await this.analyzeContent(capture2);
    return this.analyzeEggs(capture2, eggs, contentAnalysis);
  }
  /**
   * Stage 1 — content summary + chapter map + custom question answers.
   * Handles long-form chunked content with aggregation or single-chunk content.
   */
  async analyzeContent(capture2) {
    if (!isAIConfigured(this.host?.settings)) {
      return {
        titleVerdict: capture2.title,
        coreSummary: [capture2.title],
        isLongForm: false,
        chapterMap: [],
        customQuestionAnswers: (capture2.questions || []).map((q) => ({
          question: q,
          answer: "No API key configured \u2014 cannot answer."
        })),
        mindMap: []
      };
    }
    const chunks = this.chunkContent(capture2.content, capture2.chapters || []);
    if (chunks.length > 1) {
      const partResults = await Promise.all(
        chunks.map(
          (chunk) => this.callContentChunk(
            {
              ...capture2,
              content: chunk.content,
              chapters: chunk.chapters,
              sections: chunk.sections,
              questions: []
            },
            partNote(chunk)
          )
        )
      );
      const summary = await this.aggregateContent(
        capture2,
        partResults.map((r, i) => ({
          part: i + 1,
          startTime: chunks[i].startTime,
          bullets: r.coreSummary,
          mindMap: r.mindMap
        }))
      );
      const chapterMap = partResults.flatMap((r) => r.chapterMap);
      return {
        titleVerdict: summary.titleVerdict,
        coreSummary: summary.coreSummary,
        isLongForm: true,
        chapterMap,
        customQuestionAnswers: summary.customQuestionAnswers,
        mindMap: summary.mindMap
      };
    }
    const single = chunks[0];
    const effective = {
      ...capture2,
      chapters: single?.chapters,
      sections: single?.sections
    };
    return this.callContentChunk(effective, "");
  }
  /**
   * Stage 2 — per-egg extraction, comparison against egg knowledge tree,
   * and final read verdict synthesis. Works identically for 1 or N eggs.
   */
  async analyzeEggs(capture2, eggs, contentAnalysis) {
    if (!isAIConfigured(this.host?.settings) || eggs.length === 0) {
      const aiProvider = this.host?.settings?.chromeAiProvider || this.host?.settings?.aiProvider;
      return {
        ...contentAnalysis,
        shouldRead: eggs.length === 0 ? false : true,
        shouldReadReason: eggs.length === 0 ? "No matching egg found in vault." : aiProvider === "local" ? "Local LLM not configured." : "No API key configured.",
        matchedEggs: eggs.map((e) => e.fileName),
        eggResults: [],
        newKnowledge: []
      };
    }
    const chunks = this.chunkContent(capture2.content, capture2.chapters || []);
    let eggResults = [];
    if (chunks.length > 1) {
      for (const egg2 of eggs) {
        const partEggs = await Promise.all(
          chunks.map(
            (chunk) => this.analyzeAgainstEgg(
              { ...capture2, content: chunk.content },
              egg2,
              partNote(chunk)
            )
          )
        );
        const aggregate = await this.aggregateEgg(
          egg2,
          chunks.map((chunk, i) => ({
            part: i + 1,
            startTime: chunk.startTime,
            delta: partEggs[i]?.novelDelta || []
          }))
        );
        const novelDelta = aggregate.novelDelta && aggregate.novelDelta.length > 0 ? aggregate.novelDelta : this.mergePerPartDeltas(partEggs.flatMap((r) => r?.novelDelta || []));
        const redundantEntries = partEggs.flatMap((r) => r?.redundantEntries || []);
        const existingKnowledge = partEggs.find((r) => r?.existingKnowledge)?.existingKnowledge || egg2.knowledge;
        eggResults.push({
          egg: egg2.fileName,
          keyQuestionAnswers: aggregate.keyQuestionAnswers,
          novelDelta,
          redundantEntries,
          existingKnowledge,
          rejected: aggregate.rejected,
          rejectReason: aggregate.rejectReason,
          readVerdict: aggregate.readVerdict,
          readVerdictReason: aggregate.readVerdictReason
        });
      }
    } else {
      eggResults = (await Promise.all(
        eggs.map((egg2) => this.analyzeAgainstEgg(capture2, egg2))
      )).filter((r) => r !== null);
    }
    const verdict = this.mergeVerdict(eggResults);
    const newKnowledge = eggResults.flatMap(
      (r) => r.novelDelta.map((d) => ({
        egg: r.egg,
        parent: d.parent,
        content: d.content
      }))
    );
    return {
      ...contentAnalysis,
      ...verdict,
      matchedEggs: eggs.map((e) => e.fileName),
      eggResults,
      newKnowledge
    };
  }
  /** Phase 1 — content-level summary + chapter map + custom question answers. */
  async callContentChunk(capture2, partNoteStr = "") {
    const prompt = renderPrompt(this.getPrompt("contentAnalysis"), {
      content_task_default: this.getPrompt("contentTaskDefault"),
      title: capture2.title,
      url: capture2.url,
      source_type: capture2.sourceType,
      part_note: partNoteStr,
      chapters: this.chaptersBlock(capture2.chapters),
      sections: this.sectionsBlock(capture2.sections),
      questions: this.questionsBlock(
        capture2.questions,
        "User Questions (answer each directly and concisely)"
      ),
      content: this.truncate(capture2.content, this.chunkWindowChars),
      shared_output_rules: this.getContentOutputRules()
    });
    const configuredMax = this.host?.settings?.contentAnalysisMaxTokens || 16384;
    const response = await this.callAI(prompt, configuredMax);
    const parsed = this.parseJson(response, "content-analysis");
    return {
      titleVerdict: String(parsed.titleVerdict || "Could not generate a verdict."),
      coreSummary: Array.isArray(parsed.coreSummary) ? parsed.coreSummary.map(String).slice(0, 3) : [],
      mindMap: this.parseMindMap(parsed.mindMap),
      isLongForm: parsed.isLongForm === true,
      chapterMap: parsed.isLongForm === false && (!capture2.chapters || capture2.chapters.length === 0) ? [] : this.completeChapterMap(
        Array.isArray(parsed.chapterMap) ? parsed.chapterMap.filter((c) => c && (c.time || c.title)).map((c) => ({
          time: String(c.time || ""),
          title: String(c.title || ""),
          summary: String(c.summary || "")
        })) : [],
        capture2.sections
      ),
      customQuestionAnswers: this.parseKeyAnswers(parsed.customQuestionAnswers)
    };
  }
  /**
   * Multiple eggs — per-egg analysis:
   *   Step 1: Extract candidate knowledge entries + key question answers using ONLY the egg's instructions.
   *   Step 2: Compare candidate entries against egg's Knowledge tree & Unprocessed entries to find novel delta and read verdict.
   */
  async analyzeAgainstEgg(capture2, egg2, partNoteStr = "") {
    const formatInstructions = (e) => this.host?.eggParser?.formatEggInstructionsForPrompt ? this.host.eggParser.formatEggInstructionsForPrompt(e) : formatEggInstructionsForPrompt(e);
    const prompt = renderPrompt(this.getPrompt("eggAnalysis"), {
      egg_file: egg2.fileName,
      egg_instructions: formatInstructions(egg2),
      title: capture2.title,
      url: capture2.url,
      source_type: capture2.sourceType,
      part_note: partNoteStr,
      content: this.truncate(capture2.content, this.chunkWindowChars),
      shared_output_rules: this.getEggOutputRules(egg2)
    });
    try {
      const tokenBudget = this.host?.settings?.contentAnalysisMaxTokens || 16384;
      const response = await this.callAI(prompt, tokenBudget);
      const parsed = this.parseJson(response, "egg-analysis");
      const keyQuestionAnswers = this.parseKeyAnswers(parsed.keyQuestionAnswers);
      const extractedEntries = this.parseExtractedEntries(parsed.extractedEntries);
      const detectedLanguage = typeof parsed.language === "string" ? parsed.language.trim() : "";
      if (!egg2.language && detectedLanguage) {
        egg2.language = detectedLanguage;
        try {
          const vault = this.host?.app?.vault;
          const file = vault?.getAbstractFileByPath?.(egg2.fileName);
          if (file && vault?.read && vault?.modify) {
            const content = await vault.read(file);
            const updated = insertEggLanguage(content, detectedLanguage);
            if (updated !== content) {
              await vault.modify(file, updated);
            }
          }
        } catch (err) {
          console.warn(`[NutEgg] Failed to persist LLM-detected language to ${egg2.fileName}:`, err);
        }
      }
      const diff = await this.compareEggKnowledge(capture2, egg2, extractedEntries);
      return {
        egg: egg2.fileName,
        language: detectedLanguage || egg2.language || void 0,
        keyQuestionAnswers,
        extractedEntries,
        novelDelta: diff.novelDelta,
        redundantEntries: diff.redundantEntries,
        existingKnowledge: diff.existingKnowledge,
        rejected: diff.rejected,
        rejectReason: diff.rejectReason,
        readVerdict: diff.readVerdict,
        readVerdictReason: diff.readVerdictReason
      };
    } catch (err) {
      if (err instanceof AIError)
        throw err;
      console.error(`[NutEgg] Egg analysis failed for ${egg2.fileName}:`, err);
      return null;
    }
  }
  /**
   * Step 2 — Compare extracted candidate knowledge entries against the egg's
   * existing Knowledge tree and Unprocessed entries to find novel delta and read verdict.
   */
  async compareEggKnowledge(capture2, egg2, extractedEntries) {
    const existingKnowledge = egg2.knowledge || "";
    if (extractedEntries.length === 0) {
      return {
        novelDelta: [],
        redundantEntries: [],
        existingKnowledge,
        rejected: false,
        rejectReason: "",
        readVerdict: false,
        readVerdictReason: "No knowledge entries extracted matching this egg's scope."
      };
    }
    const prompt = renderPrompt(this.getPrompt("eggCompare"), {
      egg_file: egg2.fileName,
      title: capture2.title,
      url: capture2.url,
      current_knowledge: existingKnowledge || "(empty)",
      unprocessed: egg2.unprocessed || "(empty)",
      rejection_criteria: egg2.rejectionCriteria && egg2.rejectionCriteria.length > 0 ? egg2.rejectionCriteria.map((c) => `- ${c}`).join("\n") : "(none)",
      extracted_entries: extractedEntries.map((e, i) => `### Entry ${i + 1} (${e.kind || "insight"})
${e.content}`).join("\n\n"),
      shared_output_rules: this.getEggOutputRules(egg2)
    });
    try {
      const tokenBudget = this.host?.settings?.contentAnalysisMaxTokens || 16384;
      const response = await this.callAI(prompt, tokenBudget);
      const parsed = this.parseJson(response, "egg-compare");
      const novelDelta = Array.isArray(parsed.novelDelta) ? parsed.novelDelta.filter((d) => d && d.content).map((d) => ({
        parent: String(d.parent || ""),
        content: String(d.content)
      })) : [];
      const rawRedundant = Array.isArray(parsed.redundantEntries) ? parsed.redundantEntries : Array.isArray(parsed.duplicateEntries) ? parsed.duplicateEntries : Array.isArray(parsed.duplicates) ? parsed.duplicates : [];
      const redundantEntries = rawRedundant.filter((r) => r && r.content).map((r) => ({
        existingParent: String(r.existingParent || r.parent || ""),
        content: String(r.content)
      }));
      for (const ext of extractedEntries) {
        const extClean = ext.content.trim().toLowerCase();
        const isInDelta = novelDelta.some((n) => {
          const nClean = n.content.trim().toLowerCase();
          return nClean === extClean || nClean.includes(extClean) || extClean.includes(nClean);
        });
        const isInRedundant = redundantEntries.some((r) => {
          const rClean = r.content.trim().toLowerCase();
          return rClean === extClean || rClean.includes(extClean) || extClean.includes(rClean);
        });
        if (!isInDelta && !isInRedundant) {
          redundantEntries.push({
            existingParent: "Existing Knowledge Tree",
            content: ext.content
          });
        }
      }
      return {
        novelDelta,
        redundantEntries,
        existingKnowledge,
        rejected: parsed.rejected === true,
        rejectReason: String(parsed.rejectReason || ""),
        readVerdict: parsed.readVerdict !== false,
        readVerdictReason: String(parsed.readVerdictReason || "")
      };
    } catch (err) {
      if (err instanceof AIError)
        throw err;
      console.error(`[NutEgg] Knowledge comparison failed for ${egg2.fileName}:`, err);
      return {
        novelDelta: extractedEntries.map((e) => ({ parent: "", content: e.content })),
        redundantEntries: [],
        existingKnowledge,
        rejected: false,
        rejectReason: "",
        readVerdict: true,
        readVerdictReason: "Extracted novel knowledge entries."
      };
    }
  }
  /** Normalize a candidate knowledge entries array from the AI response. */
  parseExtractedEntries(raw) {
    if (!Array.isArray(raw))
      return [];
    return raw.filter((e) => e && (typeof e === "string" || e.content)).map((e) => {
      if (typeof e === "string") {
        return { kind: "insight", content: e.trim() };
      }
      return {
        kind: e.kind === "list" ? "list" : "insight",
        content: String(e.content).trim()
      };
    }).filter((e) => e.content.length > 0);
  }
  /**
   * Deduplicate and merge per-part deltas. When multiple parts report on the same concept,
   * prefer the fuller, more comprehensive entry over a partial or stub mention.
   */
  mergePerPartDeltas(deltas) {
    const conceptMap = /* @__PURE__ */ new Map();
    const result = [];
    for (const d of deltas) {
      const match = d.content.match(/\*\*([^*]+)\*\*/);
      const conceptKey = match ? match[1].trim().toLowerCase() : "";
      if (!conceptKey) {
        if (!result.some((r) => r.parent === d.parent && r.content === d.content)) {
          result.push(d);
        }
        continue;
      }
      const existing = conceptMap.get(conceptKey);
      if (!existing) {
        conceptMap.set(conceptKey, d);
        result.push(d);
      } else if (d.content.length > existing.content.length) {
        const idx = result.indexOf(existing);
        if (idx !== -1) {
          result[idx] = d;
        }
        conceptMap.set(conceptKey, d);
      }
    }
    return result;
  }
  /** Aggregate the per-part content summaries into one result. */
  async aggregateContent(capture2, chunkSummaries) {
    const prompt = renderPrompt(this.getPrompt("aggregateContent"), {
      title: capture2.title,
      url: capture2.url,
      chapters: this.chaptersBlock(capture2.chapters),
      chunk_summaries: chunkSummaries.map((c) => {
        const at = c.startTime ? ` (${c.startTime})` : "";
        const bullets = c.bullets.map((b) => `- ${b}`).join("\n");
        let mmStr = "";
        if (Array.isArray(c.mindMap) && c.mindMap.length > 0) {
          mmStr = "\n### Key Concepts/Branches from this part:\n" + c.mindMap.map(
            (n) => `- **${n.name}**${n.detail ? `: ${n.detail}` : ""}`
          ).join("\n");
        }
        return `## Part ${c.part} of ${chunkSummaries.length}${at}
${bullets || "- (no summary)"}${mmStr}`;
      }).join("\n\n"),
      questions: this.questionsBlock(
        capture2.questions,
        "User Questions (answer each directly and concisely)"
      ),
      content_task_default: this.getPrompt("contentTaskDefault"),
      shared_output_rules: this.getContentOutputRules()
    });
    const budget = Math.max(4096, this.host?.settings?.contentAnalysisMaxTokens || 4096);
    const response = await this.callAI(prompt, budget);
    const parsed = this.parseJson(response, "aggregate-content");
    return {
      titleVerdict: String(parsed.titleVerdict || "Could not generate a verdict."),
      coreSummary: Array.isArray(parsed.coreSummary) ? parsed.coreSummary.map(String).slice(0, 3) : [],
      customQuestionAnswers: this.parseKeyAnswers(parsed.customQuestionAnswers),
      mindMap: this.parseMindMap(parsed.mindMap)
    };
  }
  /** Aggregate per-part delta findings into the egg's key answers + verdict. */
  async aggregateEgg(egg2, chunkFindings) {
    const formatEgg = (e) => this.host?.eggParser?.formatEggForPrompt ? this.host.eggParser.formatEggForPrompt(e) : formatEggForPrompt(e);
    const prompt = renderPrompt(this.getPrompt("aggregateEgg"), {
      egg_file: egg2.fileName,
      egg_instructions: formatEgg(egg2),
      chunk_findings: chunkFindings.map((f) => {
        const at = f.startTime ? ` (${f.startTime})` : "";
        const delta = f.delta.map((d) => d.content).join("\n");
        return `## Part ${f.part} of ${chunkFindings.length}${at}
${delta || "- (no novel delta)"}`;
      }).join("\n\n"),
      shared_output_rules: this.getEggOutputRules(egg2)
    });
    const response = await this.callAI(prompt, 1500);
    const parsed = this.parseJson(response, "aggregate-egg");
    const novelDelta = Array.isArray(parsed.novelDelta) ? parsed.novelDelta.filter((d) => d && d.content).map((d) => ({
      parent: String(d.parent || ""),
      content: String(d.content)
    })) : void 0;
    return {
      novelDelta,
      keyQuestionAnswers: this.parseKeyAnswers(parsed.keyQuestionAnswers),
      rejected: parsed.rejected === true,
      rejectReason: String(parsed.rejectReason || ""),
      readVerdict: parsed.readVerdict !== false,
      readVerdictReason: String(parsed.readVerdictReason || "")
    };
  }
  /**
   * Localize an egg template (from templates/egg.md) into the same language as
   * the egg description. Keeps the structure and parser keywords in English.
   * Returns null when unavailable (no API key, AI error).
   */
  async localizeEggTemplate(templateContent, description) {
    if (!isAIConfigured(this.host?.settings))
      return null;
    try {
      const prompt = renderPrompt(this.getPrompt("localizeEgg"), {
        description,
        template: templateContent
      });
      const maxTokens = Math.max(8192, this.host?.settings?.contentAnalysisMaxTokens || 8192);
      const response = await this.callAI(prompt, maxTokens);
      let text = response.trim();
      text = text.replace(/^```[a-z]*\s*\n/i, "").replace(/\n```$/g, "").trim();
      if (text.includes("[!abstract]") && text.includes("**Scope:**") && text.includes("**Action Guide:**") && text.includes("# Knowledge") && text.includes("# Unprocessed")) {
        const language = extractEggLanguage(text);
        return { content: text, language };
      }
      return null;
    } catch (err) {
      console.warn("[NutEgg] AI egg template localization failed:", err);
      return null;
    }
  }
  /**
   * Split content into <=chunkWindowChars parts. Timestamped transcripts
   * (YouTube) are split at caption lines and chapters are attached to the
   * chunk covering their start time; plain text is split at paragraphs.
   */
  chunkContent(content, chapters) {
    return chunkContent(
      content,
      chapters,
      this.chunkWindowChars,
      this.sectionGridSeconds
    );
  }
  /** Combine per-egg verdicts into one global read recommendation. */
  mergeVerdict(eggResults) {
    if (eggResults.length === 0) {
      return {
        shouldRead: true,
        shouldReadReason: "No matching egg found \u2014 review the summary above."
      };
    }
    const rejectedAll = eggResults.every((r) => r.rejected);
    if (rejectedAll) {
      return {
        shouldRead: false,
        shouldReadReason: eggResults.map((r) => r.rejectReason).filter(Boolean).join(" ") || "Rejected by all matched eggs."
      };
    }
    const forReading = eggResults.filter((r) => r.readVerdict);
    const reasons = forReading.map((r) => r.readVerdictReason).filter(Boolean);
    return {
      shouldRead: forReading.length > 0,
      shouldReadReason: reasons.join(" ") || (forReading.length > 0 ? "See key question answers and novel delta below." : "No new knowledge found \u2014 the summary above likely covers it.")
    };
  }
  /** No-API-key fallback: naive content summary, no egg analysis. */
  fallbackAnalysis(capture2, eggs) {
    const firstSentence = capture2.content.match(/^[^.!?]+[.!?]/)?.[0]?.trim() || capture2.title;
    return {
      titleVerdict: firstSentence,
      coreSummary: [
        `Source: ${capture2.title}`,
        "(Configure an API key in NutEgg settings for AI analysis)"
      ],
      isLongForm: false,
      chapterMap: [],
      customQuestionAnswers: (capture2.questions || []).map((q) => ({
        question: q,
        answer: "No API key configured \u2014 cannot answer."
      })),
      mindMap: [],
      shouldRead: true,
      shouldReadReason: "No API key configured \u2014 cannot analyze.",
      matchedEggs: eggs.map((e) => e.fileName),
      eggResults: [],
      newKnowledge: []
    };
  }
  /**
   * Answer follow-up questions after the initial analysis — one lightweight
   * call, grounded in the same content. Previous Q&A pairs are included as
   * context so the model can refer back instead of repeating answers.
   */
  async askFollowUp(capture2, questions, priorQa = []) {
    if (questions.length === 0)
      return [];
    if (!isAIConfigured(this.host?.settings)) {
      const aiProvider = this.host?.settings?.chromeAiProvider || this.host?.settings?.aiProvider;
      const msg = aiProvider === "local" ? "Local LLM not configured \u2014 cannot answer." : "No API key configured \u2014 cannot answer.";
      return questions.map((q) => ({
        question: q,
        answer: msg
      }));
    }
    const priorBlock = priorQa.length > 0 ? `## Previous Questions & Answers (context \u2014 refer back instead of repeating)
${priorQa.map((qa) => `Q: ${qa.question}
A: ${qa.answer}`).join("\n")}` : "";
    const prompt = renderPrompt(this.getPrompt("followUp"), {
      title: capture2.title,
      url: capture2.url,
      source_type: capture2.sourceType,
      prior_qa: priorBlock,
      content: this.truncate(capture2.content, this.chunkWindowChars),
      questions: questions.map((q, i) => `${i + 1}. ${q}`).join("\n"),
      shared_output_rules: this.getContentOutputRules()
    });
    try {
      const response = await this.callAI(prompt, 2e3);
      const parsed = this.parseJson(response, "follow-up");
      const answers = this.parseKeyAnswers(parsed.answers);
      const byQuestion = new Map(answers.map((a) => [a.question, a]));
      return questions.map((q) => {
        const found = byQuestion.get(q);
        const item = {
          question: q,
          answer: found?.answer || "No answer returned \u2014 please try again."
        };
        if (found?.sources && found.sources.length > 0) {
          item.sources = found.sources;
        }
        return item;
      });
    } catch (err) {
      if (err instanceof AIError)
        throw err;
      console.error("[NutEgg] Follow-up question failed:", err);
      return questions.map((q) => ({
        question: q,
        answer: "Failed to answer \u2014 please try again."
      }));
    }
  }
  /**
   * Merge an egg's Unprocessed entries into its Knowledge tree on demand.
   * Merges whenever there is at least 1 unprocessed entry.
   */
  async mergeEgg(fileName) {
    const egg2 = await this.host?.eggParser?.readEgg?.(fileName);
    if (!egg2)
      return null;
    const countFn = (e) => this.host?.eggParser?.countUnprocessed ? this.host.eggParser.countUnprocessed(e) : countUnprocessed(e);
    const entries = countFn(egg2);
    if (entries === 0) {
      console.log(`[NutEgg] ${fileName} has no unprocessed entries to merge`);
      return null;
    }
    if (!isAIConfigured(this.host?.settings)) {
      console.log(
        `[NutEgg] ${fileName} has ${entries} unprocessed entries \u2014 skipped merge (AI not configured)`
      );
      return null;
    }
    let fallbackDesc = "";
    if (!egg2.language && this.host?.indexReader) {
      try {
        const indexContent = await this.host.indexReader.getIndexContent?.();
        if (indexContent) {
          const indexEntries = this.host.indexReader.parseIndexContent?.(indexContent) || [];
          const indexEntry = indexEntries.find(
            (e) => e.fileName === fileName || e.fileName.endsWith("/" + fileName)
          );
          fallbackDesc = indexEntry?.description || "";
        }
      } catch {
      }
    }
    const pluginSetting = this.host?.settings?.contentOutputLanguage || this.host?.settings?.chromeAiOutputLanguage;
    const pluginLang = pluginSetting && pluginSetting !== "same-as-content" ? pluginSetting.trim() : "";
    const outputLanguage = egg2.language || (pluginLang ? `${pluginLang} (translate into ${pluginLang} even if the source is in a different language)` : "") || "the same language as this egg's existing knowledge";
    const prompt = renderPrompt(this.getPrompt("mergeUnprocessed"), {
      egg_file: fileName,
      output_language: outputLanguage,
      egg_description: outputLanguage,
      formatting_rules: egg2.formattingRules || "(none)",
      knowledge_tree: egg2.knowledge || "(empty)",
      unprocessed: egg2.unprocessed,
      unprocessed_count: entries
    });
    try {
      const response = await this.callAI(prompt, 2e3);
      const parsed = this.parseJson(response, "merge-unprocessed");
      const knowledge = typeof parsed.knowledge === "string" ? parsed.knowledge.trim() : "";
      if (!knowledge) {
        console.warn(
          `[NutEgg] Merge for ${fileName} returned no knowledge \u2014 egg untouched`
        );
        return null;
      }
      const unprocessed = typeof parsed.unprocessed === "string" ? parsed.unprocessed.trim() : "";
      await this.host?.eggParser?.applyMerge?.(fileName, knowledge, unprocessed);
      console.log(`[NutEgg] Merged ${entries} unprocessed entries into ${fileName}`);
      return { egg: fileName, entries };
    } catch (err) {
      console.error(`[NutEgg] Merge failed for ${fileName}:`, err);
      return null;
    }
  }
  /**
   * Threshold-based merge helper (kept for backward compatibility and testing).
   */
  async maybeMergeEgg(fileName) {
    const egg2 = await this.host?.eggParser?.readEgg?.(fileName);
    if (!egg2)
      return null;
    const countFn = (e) => this.host?.eggParser?.countUnprocessed ? this.host.eggParser.countUnprocessed(e) : countUnprocessed(e);
    const entries = countFn(egg2);
    if (entries < MERGE_THRESHOLD)
      return null;
    return this.mergeEgg(fileName);
  }
  // --- Prompt building helpers ---
  /** `## Video Chapters (use these EXACT timestamps)` block, or "". */
  chaptersBlock(chapters) {
    if (!chapters?.length)
      return "";
    return `## Video Chapters (use these EXACT timestamps)
${chapters.map((c) => `- ${c.time} \u2014 ${c.title}`).join("\n")}`;
  }
  /** 5-minute section grid for videos without chapters, or "". */
  sectionsBlock(sections) {
    if (!sections?.length)
      return "";
    return `## Video Sections (one chapterMap entry per section, EXACT start time)
${sections.map((s) => `- [${s}]`).join("\n")}`;
  }
  /**
   * Guarantee the chapter map covers the whole video: when a section grid
   * was provided, keep one entry per section (the AI's title/summary for
   * matching times, blank for any section the model skipped).
   */
  completeChapterMap(parsed, sections) {
    if (!sections?.length)
      return parsed;
    if (!parsed || parsed.length === 0)
      return [];
    const byTime = new Map(parsed.map((e) => [toSeconds(e.time), e]));
    return sections.map((s) => {
      const e = byTime.get(toSeconds(s));
      return { time: s, title: e?.title || "", summary: e?.summary || "" };
    });
  }
  /** Numbered questions block with a heading, or "". */
  questionsBlock(questions, heading) {
    if (!questions?.length)
      return "";
    return `## ${heading}
${questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`;
  }
  async callAI(prompt, maxTokens) {
    if (!this.host?.aiClient) {
      throw new AIError("unknown", "AIClient not provided to AIProcessor host");
    }
    return await this.host.aiClient.chat(prompt, maxTokens);
  }
  /** Normalize a `[{question, answer, sources}]` array from the AI response. */
  parseKeyAnswers(raw) {
    return Array.isArray(raw) ? raw.filter((qa) => qa && qa.question && qa.answer).map((qa) => {
      const entry = {
        question: String(qa.question),
        answer: String(qa.answer)
      };
      if (Array.isArray(qa.sources)) {
        const sources = qa.sources.filter((s) => s && (s.ref || s.timestamp || s.section)).map((s) => {
          const item = {
            ref: String(s.ref || s.timestamp || s.section).trim()
          };
          if (s.quote) {
            item.quote = String(s.quote).trim();
          }
          return item;
        }).filter((s) => s.ref.length > 0);
        if (sources.length > 0) {
          entry.sources = sources;
        }
      }
      return entry;
    }) : [];
  }
  /** Normalize a hierarchical mind map array from the AI response. */
  parseMindMap(raw, depth = 0) {
    if (!Array.isArray(raw) || depth > 5)
      return [];
    return raw.filter((item) => item && (item.name || item.title || item.topic)).map((item) => {
      const node = {
        name: String(item.name || item.title || item.topic).trim()
      };
      const detail = item.detail || item.description || item.summary;
      if (detail && typeof detail === "string" && detail.trim().length > 0) {
        node.detail = detail.trim();
      }
      if (Array.isArray(item.children) && item.children.length > 0) {
        const children = this.parseMindMap(item.children, depth + 1);
        if (children.length > 0) {
          node.children = children;
        }
      }
      return node;
    });
  }
  /**
   * Parse an AI response that should be JSON, stripping markdown fences.
   * Sanitizes unescaped control characters (\n, \r, \t) in strings and
   * recovers partial/truncated JSON when responses are cut off mid-stream.
   */
  parseJson(response, context = "response") {
    return parseJson(response, context);
  }
  truncate(text, maxChars) {
    if (text.length <= maxChars)
      return text;
    return text.substring(0, maxChars) + "\n\n[...truncated]";
  }
  toSeconds(time) {
    return toSeconds(time);
  }
  formatSeconds(sec) {
    return formatSeconds(sec);
  }
};

// ../shared/src/egg-parser.ts
var KNOWLEDGE_HEADING = "# Knowledge";
var UNPROCESSED_HEADING = "# Unprocessed";
function isEggPath(path, vaultFolder = "nutegg") {
  if (!path || typeof path !== "string")
    return false;
  const normalized = path.replace(/\\/g, "/").replace(/^\/+/, "");
  const folder = (vaultFolder || "").replace(/^\/+|\/+$/g, "");
  if (folder) {
    if (!normalized.startsWith(folder + "/"))
      return false;
    const rel = normalized.slice(folder.length + 1);
    if (rel.includes("/"))
      return false;
    if (rel.startsWith("_") || !rel.toLowerCase().endsWith(".md"))
      return false;
    return true;
  } else {
    if (normalized.includes("/"))
      return false;
    if (normalized.startsWith("_") || !normalized.toLowerCase().endsWith(".md"))
      return false;
    return true;
  }
}
function parseEggFile(fileName, content) {
  const result = {
    fileName,
    topic: "Unknown",
    language: "",
    scope: "",
    actionGuide: "",
    keyQuestions: [],
    rejectionCriteria: [],
    formattingRules: "",
    knowledge: "",
    unprocessed: "",
    indexDescription: ""
  };
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (fmMatch) {
    for (const line of fmMatch[1].split(/\r?\n/)) {
      const kv = line.match(/^(\w+):\s*(.*)$/);
      if (!kv)
        continue;
      const key = kv[1].toLowerCase();
      const value = kv[2].trim().replace(/^"(.*)"$/, "$1");
      if (key === "topic")
        result.topic = value;
      if (key === "language")
        result.language = value;
    }
  }
  const callout = extractCallout(content);
  const sections = callout ? splitLabeledSections(callout) : /* @__PURE__ */ new Map();
  result.scope = (sections.get("scope") || "").trim();
  result.actionGuide = (sections.get("action guide") || "").trim();
  result.keyQuestions = parseListItems(sections.get("key questions") || "");
  result.rejectionCriteria = parseListItems(sections.get("rejection criteria") || "");
  result.formattingRules = (sections.get("formatting rules") || "").trim();
  const lines = content.split(/\r?\n/);
  const knowledgeSection = findSection(lines, "knowledge");
  if (knowledgeSection) {
    result.knowledge = sectionBody(lines, knowledgeSection, "knowledge");
  }
  const unprocessedSection = findSection(lines, "unprocessed");
  if (unprocessedSection) {
    result.unprocessed = sectionBody(lines, unprocessedSection, "unprocessed");
  }
  return result;
}
function findSection(lines, name) {
  const wanted = name.toLowerCase();
  const start = lines.findIndex((l) => headingName(l) === wanted);
  if (start === -1)
    return null;
  let end = -1;
  if (wanted === "knowledge") {
    end = lines.findIndex(
      (l, i) => i > start && headingName(l) === "unprocessed"
    );
  }
  if (end === -1) {
    end = lines.findIndex((l, i) => {
      if (i <= start)
        return false;
      const head = headingName(l);
      return head !== null && head !== wanted;
    });
  }
  return { start, end: end === -1 ? lines.length : end };
}
function headingName(line) {
  const m = line.trim().match(/^#\s+(.+?)\s*#*\s*$/);
  if (!m)
    return null;
  return m[1].trim().toLowerCase();
}
function sectionBody(lines, section, name) {
  const body = lines.slice(section.start + 1, section.end);
  while (body.length > 0 && (body[0].trim() === "" || headingName(body[0]) === name.toLowerCase())) {
    body.shift();
  }
  return body.join("\n").replace(/\n+$/g, "");
}
function stripSectionHeading(body, name) {
  const lines = body.split("\n");
  const wanted = name.toLowerCase();
  while (lines.length > 0 && (lines[0].trim() === "" || headingName(lines[0]) === wanted)) {
    lines.shift();
  }
  return lines.join("\n").replace(/\s+$/g, "");
}
function extractCallout(content) {
  const calloutLines = [];
  for (const line of content.split("\n")) {
    if (line.startsWith(">")) {
      calloutLines.push(line.replace(/^>\s?/, ""));
    } else if (calloutLines.length > 0) {
      break;
    }
  }
  if (calloutLines.length === 0)
    return null;
  const marker = calloutLines.findIndex((l) => l.includes("[!abstract]"));
  const body = marker >= 0 ? calloutLines.slice(marker + 1) : calloutLines.slice(1);
  return body.join("\n");
}
function splitLabeledSections(text) {
  const map = /* @__PURE__ */ new Map();
  let current = null;
  let buffer = [];
  for (const line of text.split("\n")) {
    const labelMatch = line.match(/^\*\*([^*]+?):\*\*\s*(.*)$/);
    if (labelMatch) {
      if (current)
        map.set(current, buffer.join("\n"));
      current = labelMatch[1].toLowerCase();
      buffer = labelMatch[2] ? [labelMatch[2]] : [];
    } else {
      buffer.push(line);
    }
  }
  if (current)
    map.set(current, buffer.join("\n"));
  return map;
}
function parseListItems(text) {
  return text.split("\n").map((l) => l.trim()).filter((l) => /^(?:\d+[.)]|[-*])\s+/.test(l)).map((l) => l.replace(/^(?:\d+[.)]|[-*])\s+/, ""));
}

// src/egg-parser.ts
var EggParser = class {
  plugin;
  constructor(plugin) {
    this.plugin = plugin;
  }
  async readEgg(fileName, fallbackDescription) {
    let file = this.plugin.app.vault.getAbstractFileByPath(fileName);
    if (!file && !fileName.includes("/")) {
      const parentDir = this.plugin.settings.indexFile.replace(/\/[^/]+$/, "");
      file = this.plugin.app.vault.getAbstractFileByPath(`${parentDir}/${fileName}`);
    }
    if (!file) {
      const folder = this.plugin.vaultFolder || "nutegg";
      const allFiles = (this.plugin.app.vault.getMarkdownFiles?.() || []).filter(
        (f) => isEggPath(f.path, folder)
      );
      const base = fileName.split("/").pop().toLowerCase();
      const match = allFiles.find(
        (f) => f.path.split("/").pop().toLowerCase() === base
      );
      if (match)
        file = match;
    }
    if (!file) {
      console.warn(`[NutEgg] Egg file not found: ${fileName}`);
      return null;
    }
    const content = await this.plugin.app.vault.read(file);
    const parsed = this.parseEggFile(file.path || fileName, content);
    if (fallbackDescription && !parsed.indexDescription) {
      parsed.indexDescription = fallbackDescription;
    }
    if (!parsed.language) {
      const settingLang = this.plugin.settings?.contentOutputLanguage;
      const pluginLang = settingLang && settingLang !== "same-as-content" ? settingLang.trim() : "";
      if (pluginLang) {
        parsed.language = pluginLang;
        const updated = insertEggLanguage(content, pluginLang);
        if (updated !== content) {
          try {
            await this.plugin.app.vault.modify(file, updated);
          } catch (err) {
            console.warn(
              `[NutEgg] Could not persist filled language to ${file.path}:`,
              err
            );
          }
        }
      }
    }
    return parsed;
  }
  async readEggs(entries) {
    const eggs = [];
    for (const entry of entries) {
      const egg2 = await this.readEgg(entry.fileName, entry.description);
      if (egg2) {
        egg2.indexDescription = entry.description;
        eggs.push(egg2);
      }
    }
    return eggs;
  }
  parseEggFile(fileName, content) {
    return parseEggFile(fileName, content);
  }
  formatEggInstructionsForPrompt(egg2) {
    return formatEggInstructionsForPrompt(egg2);
  }
  formatEggKnowledgeForPrompt(egg2) {
    return formatEggKnowledgeForPrompt(egg2);
  }
  formatEggForPrompt = (egg2) => {
    return formatEggForPrompt(egg2);
  };
  countUnprocessed(egg2) {
    return countUnprocessed(egg2);
  }
  /**
   * Append one new knowledge entry to the egg's Unprocessed section.
   *
   * Entries land here first and are merged into the Knowledge tree later,
   * once 20+ accumulate (see ai-processor.maybeMergeEgg). Each entry keeps
   * its insight + examples (AI-generated `content`), plus mechanical
   * `_author` / `_source` lines for provenance.
   */
  async appendUnprocessed(fileName, content, author, sourceTitle, sourceUrl) {
    const file = this.plugin.app.vault.getAbstractFileByPath(fileName);
    if (!file) {
      console.warn(`[NutEgg] Cannot append \u2014 egg file not found: ${fileName}`);
      return;
    }
    const existing = await this.plugin.app.vault.read(file);
    const lines = existing.replace(/\n+$/, "").split("\n");
    const section = findSection(lines, "unprocessed");
    const trimmed = content.trim();
    const withBullet = /^[-*]\s/.test(trimmed) ? trimmed : `- ${trimmed}`;
    const meta = [];
    if (author)
      meta.push(`_author: ${author}_`);
    const safeTitle = sourceTitle.replace(/[[\]]/g, "");
    meta.push(`_source: [${safeTitle || "source"}](${sourceUrl})_`);
    const block = [withBullet, ...meta].join("\n");
    if (section) {
      lines.splice(section.end, 0, "", block);
    } else {
      lines.push("", UNPROCESSED_HEADING, "", block);
    }
    await this.plugin.app.vault.modify(file, lines.join("\n") + "\n");
    console.log(`[NutEgg] Added unprocessed entry to ${fileName}`);
  }
  /**
   * Replace the Knowledge and Unprocessed sections with the merged output
   * from the merge AI call. Missing sections are created as needed.
   */
  async applyMerge(fileName, knowledge, unprocessed) {
    const file = this.plugin.app.vault.getAbstractFileByPath(fileName);
    if (!file) {
      console.warn(`[NutEgg] Cannot merge \u2014 egg file not found: ${fileName}`);
      return;
    }
    knowledge = stripSectionHeading(knowledge, "knowledge");
    unprocessed = stripSectionHeading(unprocessed, "unprocessed");
    const kLines = knowledge.split("\n");
    const uIdx = kLines.findIndex((l) => headingName(l) === "unprocessed");
    if (uIdx !== -1) {
      const rest = stripSectionHeading(
        kLines.slice(uIdx).join("\n"),
        "unprocessed"
      );
      knowledge = kLines.slice(0, uIdx).join("\n").replace(/\s+$/g, "");
      if (!unprocessed)
        unprocessed = rest;
    }
    const existing = await this.plugin.app.vault.read(file);
    let lines = existing.replace(/\n+$/, "").split("\n");
    const knowledgeSection = findSection(lines, "knowledge");
    if (knowledgeSection) {
      lines = [
        ...lines.slice(0, knowledgeSection.start + 1),
        "",
        ...knowledge.trim().split("\n"),
        ...lines.slice(knowledgeSection.end)
      ];
    } else {
      const unprocessedSection2 = findSection(lines, "unprocessed");
      if (unprocessedSection2) {
        lines = [
          ...lines.slice(0, unprocessedSection2.start),
          "",
          KNOWLEDGE_HEADING,
          "",
          ...knowledge.trim().split("\n"),
          "",
          ...lines.slice(unprocessedSection2.start)
        ];
      } else {
        lines = [...lines, "", KNOWLEDGE_HEADING, "", ...knowledge.trim().split("\n")];
      }
    }
    const unprocessedSection = findSection(lines, "unprocessed");
    const remainder = unprocessed.trim();
    if (unprocessedSection) {
      lines = [
        ...lines.slice(0, unprocessedSection.start + 1),
        ...remainder ? ["", ...remainder.split("\n")] : [],
        ...lines.slice(unprocessedSection.end)
      ];
    } else if (remainder) {
      lines = [...lines, "", UNPROCESSED_HEADING, "", ...remainder.split("\n")];
    }
    await this.plugin.app.vault.modify(file, lines.join("\n") + "\n");
    console.log(`[NutEgg] Merged knowledge tree in ${fileName}`);
  }
};

// tests/obsidian-stub.ts
var TAbstractFile = class {
  path = "";
  name = "";
};
var TFile = class extends TAbstractFile {
  basename = "";
  extension = "";
};

// tests/helpers.ts
function makeFakeVault(initial = {}) {
  const files = new Map(Object.entries(initial));
  const basePath = "/fake/vault";
  const listeners = /* @__PURE__ */ new Map();
  const toTFile = (p) => Object.assign(new TFile(), {
    path: p,
    name: p.split("/").pop() || "",
    basename: (p.split("/").pop() || "").replace(/\.[^/.]+$/, ""),
    extension: p.split(".").pop() || ""
  });
  const adapter = {
    exists: async (p) => files.has(p) || [...files.keys()].some((k) => k.startsWith(p + "/")),
    read: async (p) => {
      if (!files.has(p))
        throw new Error("File not found: " + p);
      return files.get(p);
    },
    remove: async (p) => {
      files.delete(p);
    },
    append: async (p, data) => {
      files.set(p, (files.get(p) ?? "") + data);
    },
    getBasePath: () => basePath
  };
  const vault = {
    adapter,
    listeners,
    on: (event, callback) => {
      if (!listeners.has(event))
        listeners.set(event, []);
      listeners.get(event).push(callback);
    },
    trigger: (event, file) => {
      for (const cb of listeners.get(event) || []) {
        cb(file);
      }
    },
    create: async (p, content) => {
      files.set(p, content);
      vault.trigger("create", toTFile(p));
    },
    createFolder: async (_p) => {
    },
    modify: async (file, content) => {
      files.set(file.path, content);
      vault.trigger("modify", toTFile(file.path));
    },
    read: async (file) => {
      if (!files.has(file.path))
        throw new Error("File not found: " + file.path);
      return files.get(file.path);
    },
    delete: async (file) => {
      files.delete(file.path);
      vault.trigger("delete", toTFile(file.path));
    },
    getAbstractFileByPath: (p) => files.has(p) ? toTFile(p) : null,
    getFiles: () => [...files.keys()].map((p) => toTFile(p)),
    getMarkdownFiles: () => [...files.keys()].filter((k) => k.endsWith(".md")).map((p) => toTFile(p))
  };
  return { files, basePath, vault };
}
function makeFakePlugin(overrides = {}) {
  const { vault } = makeFakeVault(overrides.vaultFiles || {});
  return {
    manifest: overrides.manifest ?? { version: "0.1.0" },
    settings: {
      aiApiKey: "test-key",
      rawFolder: "nutegg/_raw",
      indexFile: "nutegg/_index.md",
      serverPort: 27123,
      chunkWindowChars: 3e4,
      sectionGridSeconds: 300,
      ...overrides.settings || {}
    },
    app: { vault: overrides.vault ?? vault },
    aiClient: overrides.aiClient ?? {
      chat: async () => "{}",
      checkCredit: async () => ({
        provider: "anthropic",
        providerLabel: "Anthropic (Claude)",
        source: "openrouter",
        model: "claude-sonnet-5",
        hasBalance: true,
        balanceFormatted: "$8.45",
        statusText: "$8.45 left"
      })
    },
    eggParser: overrides.eggParser ?? {
      formatEggForPrompt: (e) => `egg:${e.fileName}`,
      formatEggInstructionsForPrompt: (e) => `instructions:${e.fileName}`,
      formatEggKnowledgeForPrompt: (e) => `knowledge:${e.fileName}`
    },
    indexReader: overrides.indexReader ?? {
      getIndexContent: async () => "",
      parseIndexContent: () => []
    },
    knowledgeBase: overrides.knowledgeBase ?? {},
    workflowManager: overrides.workflowManager ?? {
      getPrompt: () => ""
    },
    db: overrides.db ?? null,
    ...overrides
  };
}

// tests/ai-processor.test.ts
function egg(fileName, overrides = {}) {
  return {
    fileName,
    topic: "Test",
    scope: "scope",
    actionGuide: "1. Title Verdict: one sentence.",
    keyQuestions: ["Is this new?"],
    rejectionCriteria: ["Reject noise."],
    formattingRules: "Keep the tree.",
    knowledge: "- existing\n",
    unprocessed: "",
    ...overrides
  };
}
var capture = {
  url: "https://example.com/post",
  title: "Test Title",
  content: "Some content.",
  sourceType: "article"
};
(0, import_node_test.describe)("AIProcessor.parseJson", () => {
  const p = new AIProcessor(makeFakePlugin());
  (0, import_node_test.it)("parses plain JSON", () => {
    import_strict.default.deepEqual(p.parseJson('{"a": 1}'), { a: 1 });
  });
  (0, import_node_test.it)("strips markdown fences", () => {
    import_strict.default.deepEqual(p.parseJson('```json\n{"b": 2}\n```'), { b: 2 });
  });
  (0, import_node_test.it)("extracts the outermost object from surrounding text", () => {
    import_strict.default.deepEqual(p.parseJson('Here it is: {"c": 3} thanks'), { c: 3 });
  });
  (0, import_node_test.it)("returns {} for unparseable responses", () => {
    import_strict.default.deepEqual(p.parseJson("no json here"), {});
  });
});
(0, import_node_test.describe)("AIProcessor.parseKeyAnswers", () => {
  const p = new AIProcessor(makeFakePlugin());
  (0, import_node_test.it)("filters to complete Q/A pairs and stringifies", () => {
    const out = p.parseKeyAnswers([
      { question: "q1", answer: "a1" },
      { question: "", answer: "a2" },
      { question: "q3" },
      "garbage"
    ]);
    import_strict.default.deepEqual(out, [{ question: "q1", answer: "a1" }]);
  });
  (0, import_node_test.it)("handles non-arrays", () => {
    import_strict.default.deepEqual(p.parseKeyAnswers(void 0), []);
    import_strict.default.deepEqual(p.parseKeyAnswers({}), []);
  });
  (0, import_node_test.it)("extracts and normalizes sources citations", () => {
    const out = p.parseKeyAnswers([
      {
        question: "How does it work?",
        answer: "By using attention.",
        sources: [
          { ref: " 12:34 ", quote: " attention is all you need " },
          { section: " Methodology ", quote: " we trained a transformer " },
          { ref: "" },
          null
        ]
      },
      {
        question: "Not covered?",
        answer: "Not covered in this content",
        sources: []
      }
    ]);
    import_strict.default.deepEqual(out, [
      {
        question: "How does it work?",
        answer: "By using attention.",
        sources: [
          { ref: "12:34", quote: "attention is all you need" },
          { ref: "Methodology", quote: "we trained a transformer" }
        ]
      },
      {
        question: "Not covered?",
        answer: "Not covered in this content"
      }
    ]);
  });
});
(0, import_node_test.describe)("AIProcessor.parseMindMap", () => {
  const p = new AIProcessor(makeFakePlugin());
  (0, import_node_test.it)("handles non-arrays or empty inputs", () => {
    import_strict.default.deepEqual(p.parseMindMap(void 0), []);
    import_strict.default.deepEqual(p.parseMindMap(null), []);
    import_strict.default.deepEqual(p.parseMindMap({}), []);
    import_strict.default.deepEqual(p.parseMindMap("invalid"), []);
    import_strict.default.deepEqual(p.parseMindMap([]), []);
  });
  (0, import_node_test.it)("parses flat and hierarchical mind map nodes", () => {
    const raw = [
      {
        name: " Core Problem ",
        detail: " Batch latency is too high. "
      },
      {
        title: " Architecture Design ",
        description: " Event-driven microservices. ",
        children: [
          {
            topic: " Ingestion Layer ",
            summary: " Kafka cluster for stream buffering. "
          },
          {
            name: " Processing Nodes ",
            children: [
              {
                name: " Flink Workers ",
                detail: " Real-time stateful computation. "
              }
            ]
          }
        ]
      },
      null,
      {},
      { invalid: "no name or title" }
    ];
    const out = p.parseMindMap(raw);
    import_strict.default.deepEqual(out, [
      {
        name: "Core Problem",
        detail: "Batch latency is too high."
      },
      {
        name: "Architecture Design",
        detail: "Event-driven microservices.",
        children: [
          {
            name: "Ingestion Layer",
            detail: "Kafka cluster for stream buffering."
          },
          {
            name: "Processing Nodes",
            children: [
              {
                name: "Flink Workers",
                detail: "Real-time stateful computation."
              }
            ]
          }
        ]
      }
    ]);
  });
  (0, import_node_test.it)("parses flexible branch counts up to 3 levels deep per updated prompt", () => {
    const raw = [
      {
        name: "Branch 1",
        detail: "First main branch",
        children: [
          {
            name: "Branch 1.1",
            detail: "Second level detail",
            children: [
              {
                name: "Branch 1.1.1",
                detail: "Third level leaf node"
              }
            ]
          }
        ]
      },
      {
        name: "Branch 2",
        detail: "Second main branch without sub-branches"
      }
    ];
    const out = p.parseMindMap(raw);
    import_strict.default.equal(out.length, 2);
    import_strict.default.equal(out[0].name, "Branch 1");
    import_strict.default.equal(out[0].children?.length, 1);
    import_strict.default.equal(out[0].children?.[0].children?.length, 1);
    import_strict.default.equal(out[0].children?.[0].children?.[0].name, "Branch 1.1.1");
    import_strict.default.equal(out[1].name, "Branch 2");
    import_strict.default.equal(out[1].children, void 0);
  });
  (0, import_node_test.it)("prevents runaway recursion depth", () => {
    let deepNode = { name: "level 6" };
    for (let i = 5; i >= 0; i--) {
      deepNode = { name: `level ${i}`, children: [deepNode] };
    }
    const out = p.parseMindMap([deepNode]);
    import_strict.default.equal(out.length, 1);
    let current = out[0];
    let depth = 0;
    while (current.children && current.children.length > 0) {
      depth++;
      current = current.children[0];
    }
    import_strict.default.ok(depth <= 5);
  });
});
(0, import_node_test.describe)("AIProcessor.mergeVerdict", () => {
  const p = new AIProcessor(makeFakePlugin());
  (0, import_node_test.it)("no eggs \u2192 read it, review summary", () => {
    const v = p.mergeVerdict([]);
    import_strict.default.equal(v.shouldRead, true);
    import_strict.default.ok(v.shouldReadReason.includes("No matching egg"));
  });
  (0, import_node_test.it)("all rejected \u2192 skip, with joined reject reasons", () => {
    const v = p.mergeVerdict([
      { rejected: true, rejectReason: "noise", readVerdict: false },
      { rejected: true, rejectReason: "marketing", readVerdict: false }
    ]);
    import_strict.default.equal(v.shouldRead, false);
    import_strict.default.ok(v.shouldReadReason.includes("noise"));
    import_strict.default.ok(v.shouldReadReason.includes("marketing"));
  });
  (0, import_node_test.it)("any readVerdict true \u2192 read", () => {
    const v = p.mergeVerdict([
      { rejected: false, readVerdict: false, readVerdictReason: "meh" },
      { rejected: false, readVerdict: true, readVerdictReason: "novel" }
    ]);
    import_strict.default.equal(v.shouldRead, true);
    import_strict.default.ok(v.shouldReadReason.includes("novel"));
  });
  (0, import_node_test.it)("none worth reading \u2192 skip with fallback reason", () => {
    const v = p.mergeVerdict([
      { rejected: false, readVerdict: false, readVerdictReason: "" }
    ]);
    import_strict.default.equal(v.shouldRead, false);
    import_strict.default.ok(v.shouldReadReason.includes("No new knowledge"));
  });
});
(0, import_node_test.describe)("AIProcessor.analyze", () => {
  (0, import_node_test.it)("single egg: Stage 1 content analysis + Stage 2 egg extraction and comparison", async () => {
    const responses = [
      // Stage 1: Content analysis
      JSON.stringify({
        titleVerdict: "Verdict.",
        coreSummary: ["b1", "b2", "b3", "b4"],
        // must be sliced to 3
        mindMap: [
          {
            name: "Topic 1",
            detail: "High-level concept",
            children: [
              {
                name: "Subtopic 1.1",
                detail: "Supporting rationale"
              }
            ]
          }
        ],
        isLongForm: true,
        chapterMap: [
          { time: "00:10", title: "Ch1", summary: "s1" },
          { time: "", title: "", summary: "" }
          // dropped by the filter
        ],
        customQuestionAnswers: [{ question: "custom?", answer: "custom a" }]
      }),
      // Stage 2: Step 1 Extract candidate entries using egg instructions
      JSON.stringify({
        keyQuestionAnswers: [{ question: "Is this new?", answer: "Yes" }],
        extractedEntries: [
          { kind: "insight", content: "- new stuff" },
          { kind: "insight", content: "" }
          // dropped
        ]
      }),
      // Stage 2: Step 2 Compare candidate entries against egg knowledge tree
      JSON.stringify({
        novelDelta: [{ parent: "## X", content: "- new stuff" }],
        rejected: false,
        rejectReason: "",
        readVerdict: true,
        readVerdictReason: "has delta"
      })
    ];
    let calls = 0;
    const plugin = makeFakePlugin({
      aiClient: { chat: async () => responses[Math.min(calls++, responses.length - 1)] }
    });
    const result = await new AIProcessor(plugin).analyze(
      { ...capture, chapters: [{ time: "00:10", title: "Ch1" }], questions: ["custom?"] },
      [egg("one.md")]
    );
    import_strict.default.equal(calls, 3);
    import_strict.default.equal(result.titleVerdict, "Verdict.");
    import_strict.default.deepEqual(result.coreSummary, ["b1", "b2", "b3"]);
    import_strict.default.deepEqual(result.mindMap, [
      {
        name: "Topic 1",
        detail: "High-level concept",
        children: [
          {
            name: "Subtopic 1.1",
            detail: "Supporting rationale"
          }
        ]
      }
    ]);
    import_strict.default.equal(result.chapterMap.length, 1);
    import_strict.default.equal(result.chapterMap[0].time, "00:10");
    import_strict.default.equal(result.customQuestionAnswers[0].answer, "custom a");
    import_strict.default.equal(result.eggResults.length, 1);
    import_strict.default.equal(result.eggResults[0].keyQuestionAnswers[0].answer, "Yes");
    import_strict.default.deepEqual(result.newKnowledge, [
      { egg: "one.md", parent: "## X", content: "- new stuff" }
    ]);
    import_strict.default.equal(result.shouldRead, true);
  });
  (0, import_node_test.it)("two eggs: content call + per-egg extract and compare", async () => {
    const responses = [
      // Phase 1: Content summary
      JSON.stringify({
        titleVerdict: "V.",
        coreSummary: [],
        isLongForm: false,
        chapterMap: [],
        customQuestionAnswers: []
      }),
      // Egg A Step 1: Extract (empty -> compare is skipped)
      JSON.stringify({
        keyQuestionAnswers: [{ question: "Is this new?", answer: "no" }],
        extractedEntries: []
      }),
      // Egg B Step 1: Extract
      JSON.stringify({
        keyQuestionAnswers: [],
        extractedEntries: [{ kind: "insight", content: "- fresh" }]
      }),
      // Egg B Step 2: Compare
      JSON.stringify({
        novelDelta: [{ parent: "", content: "- fresh" }],
        rejected: false,
        readVerdict: true,
        readVerdictReason: "new insight"
      })
    ];
    let calls = 0;
    const plugin = makeFakePlugin({
      aiClient: { chat: async () => responses[Math.min(calls++, responses.length - 1)] }
    });
    const result = await new AIProcessor(plugin).analyze(
      { ...capture },
      [egg("a.md"), egg("b.md")]
    );
    import_strict.default.equal(calls, 4);
    import_strict.default.equal(result.matchedEggs.length, 2);
    import_strict.default.equal(result.eggResults.length, 2);
    import_strict.default.equal(result.shouldRead, true);
    import_strict.default.deepEqual(result.newKnowledge, [
      { egg: "b.md", parent: "", content: "- fresh" }
    ]);
  });
  (0, import_node_test.it)("no API key \u2192 fallback result with unanswered questions", async () => {
    const plugin = makeFakePlugin({ settings: { aiApiKey: "" } });
    const result = await new AIProcessor(plugin).analyze(
      { ...capture, questions: ["Q?"] },
      []
    );
    import_strict.default.equal(result.shouldRead, true);
    import_strict.default.ok(result.shouldReadReason.includes("No API key"));
    import_strict.default.equal(result.customQuestionAnswers[0].answer, "No API key configured \u2014 cannot answer.");
    import_strict.default.deepEqual(result.newKnowledge, []);
  });
  (0, import_node_test.it)("typed AIError propagates out of the egg phase", async () => {
    const { AIError: AIError2 } = await Promise.resolve().then(() => (init_ai_client(), ai_client_exports));
    const plugin = makeFakePlugin({
      aiClient: {
        chat: async () => {
          throw new AIError2("auth_failed", "Bad key", 401);
        }
      }
    });
    await import_strict.default.rejects(
      new AIProcessor(plugin).analyze({ ...capture }, [egg("a.md")]),
      (err) => err instanceof AIError2 && err.code === "auth_failed"
    );
  });
});
(0, import_node_test.describe)("AIProcessor.askFollowUp", () => {
  (0, import_node_test.it)("answers every question, filling in skipped ones", async () => {
    const plugin = makeFakePlugin({
      aiClient: {
        chat: async () => JSON.stringify({ answers: [{ question: "Q1?", answer: "A1" }] })
      }
    });
    const out = await new AIProcessor(plugin).askFollowUp(
      capture,
      ["Q1?", "Q2?"],
      [{ question: "Prior?", answer: "Prior A" }]
    );
    import_strict.default.equal(out.length, 2);
    import_strict.default.equal(out[0].answer, "A1");
    import_strict.default.equal(out[1].answer, "No answer returned \u2014 please try again.");
  });
  (0, import_node_test.it)("no API key \u2192 placeholder answers", async () => {
    const plugin = makeFakePlugin({ settings: { aiApiKey: "" } });
    const out = await new AIProcessor(plugin).askFollowUp(
      capture,
      ["Q?"],
      []
    );
    import_strict.default.equal(out[0].answer, "No API key configured \u2014 cannot answer.");
  });
  (0, import_node_test.it)("empty question list \u2192 empty result, no AI call", async () => {
    let calls = 0;
    const plugin = makeFakePlugin({
      aiClient: { chat: async () => (calls++, "{}") }
    });
    const out = await new AIProcessor(plugin).askFollowUp(capture, [], []);
    import_strict.default.deepEqual(out, []);
    import_strict.default.equal(calls, 0);
  });
});
(0, import_node_test.describe)("AIProcessor.chunkContent", () => {
  const p = new AIProcessor(makeFakePlugin());
  (0, import_node_test.it)("returns one chunk for content under the limit", () => {
    const chunks = p.chunkContent("short", [{ time: "00:01", title: "C1" }]);
    import_strict.default.equal(chunks.length, 1);
    import_strict.default.deepEqual(chunks[0].chapters, [{ time: "00:01", title: "C1" }]);
  });
  (0, import_node_test.it)("splits plain text at paragraph boundaries", () => {
    const para = "x".repeat(1e4);
    const content = [para, para, para, para].join("\n\n");
    const chunks = p.chunkContent(content, []);
    import_strict.default.ok(chunks.length >= 2);
    import_strict.default.ok(chunks.every((c) => c.content.length <= 3e4));
    import_strict.default.ok(chunks[0].content.includes(para));
  });
  (0, import_node_test.it)("hard-splits a single oversized paragraph", () => {
    const chunks = p.chunkContent("y".repeat(65e3), []);
    import_strict.default.ok(chunks.length >= 3);
    import_strict.default.ok(chunks.every((c) => c.content.length <= 3e4));
  });
  (0, import_node_test.it)("splits timestamped transcripts and keeps the preamble in part 1", () => {
    const lines = ["# Title", "", "**Channel:** X", ""];
    for (let m = 0; m < 50; m++) {
      for (let s = 0; s < 20; s++) {
        lines.push(`[${String(m).padStart(2, "0")}:${String(s * 3).padStart(2, "0")}] caption text line with words`);
      }
    }
    const content = lines.join("\n");
    const chunks = p.chunkContent(content, []);
    import_strict.default.ok(chunks.length >= 2, "long timestamped content must split");
    import_strict.default.ok(chunks[0].content.includes("# Title"), "preamble in part 1");
    import_strict.default.ok(chunks.every((c) => c.startTime !== ""));
    import_strict.default.ok(chunks.every((c) => c.content.length <= 3e4 + 1e3));
  });
  (0, import_node_test.it)("attaches chapters to the chunk covering their start time", () => {
    const lines = [];
    for (let m = 0; m < 50; m++) {
      for (let s = 0; s < 20; s++) {
        lines.push(`[${String(m).padStart(2, "0")}:${String(s * 3).padStart(2, "0")}] some caption text with words`);
      }
    }
    const chapters = [
      { time: "05:00", title: "Early" },
      // The chunk boundary lands around minute 40 — pick a chapter clearly
      // inside the second chunk's time range.
      { time: "48:00", title: "Late" }
    ];
    const chunks = p.chunkContent(lines.join("\n"), chapters);
    const early = chunks.find((c) => c.chapters.some((ch) => ch.title === "Early"));
    const late = chunks.find((c) => c.chapters.some((ch) => ch.title === "Late"));
    import_strict.default.ok(early, "Early chapter assigned to some chunk");
    import_strict.default.ok(late, "Late chapter assigned to some chunk");
    import_strict.default.notEqual(
      early?.startTime,
      late?.startTime,
      "chapters in different time ranges land in different chunks"
    );
    import_strict.default.ok(chunks.every((c) => c.sections.length === 0));
  });
  (0, import_node_test.it)("gives videos WITHOUT chapters a 5-minute section grid per chunk", () => {
    const lines = [];
    for (let m = 0; m < 47; m++) {
      for (let s = 0; s < 20; s++) {
        lines.push(`[${String(m).padStart(2, "0")}:${String(s * 3).padStart(2, "0")}] some caption text with words`);
      }
    }
    const chunks = p.chunkContent(lines.join("\n"), []);
    const allSections = chunks.flatMap((c) => c.sections);
    import_strict.default.ok(allSections.length >= 8, "grid covers the whole video");
    import_strict.default.equal(allSections[0], "00:00");
    import_strict.default.ok(
      allSections.includes("40:00"),
      "sections continue past the first chunk boundary"
    );
    for (let i = 1; i < allSections.length; i++) {
      import_strict.default.equal(
        p.toSeconds(allSections[i]) - p.toSeconds(allSections[i - 1]),
        300,
        `sections are a continuous 5-minute grid (${allSections[i - 1]} \u2192 ${allSections[i]})`
      );
    }
  });
  (0, import_node_test.it)("short timestamped videos get a grid too (single chunk)", () => {
    const lines = [];
    for (let m = 0; m < 8; m++) {
      lines.push(`[0${m}:00] short caption line here`);
    }
    const chunks = p.chunkContent(lines.join("\n"), []);
    import_strict.default.equal(chunks.length, 1);
    import_strict.default.deepEqual(chunks[0].sections, ["00:00", "05:00"]);
  });
  (0, import_node_test.it)("respects custom chunkWindowChars setting", () => {
    const customPlugin = makeFakePlugin({
      settings: { chunkWindowChars: 1500 }
    });
    const customP = new AIProcessor(customPlugin);
    const text = "a".repeat(1e3) + "\n\n" + "b".repeat(1e3);
    const chunks = customP.chunkContent(text, []);
    import_strict.default.equal(chunks.length, 2);
  });
  (0, import_node_test.it)("respects custom sectionGridSeconds setting", () => {
    const customPlugin = makeFakePlugin({
      settings: { sectionGridSeconds: 120 }
    });
    const customP = new AIProcessor(customPlugin);
    const lines = [];
    for (let m = 0; m < 6; m++) {
      lines.push(`[0${m}:00] caption text line`);
    }
    const chunks = customP.chunkContent(lines.join("\n"), []);
    import_strict.default.equal(chunks.length, 1);
    import_strict.default.deepEqual(chunks[0].sections, ["00:00", "02:00", "04:00"]);
  });
});
(0, import_node_test.describe)("AIProcessor.completeChapterMap", () => {
  const p = new AIProcessor(makeFakePlugin());
  (0, import_node_test.it)("passes entries through when no section grid is provided", () => {
    const parsed = [{ time: "00:12", title: "X", summary: "s" }];
    import_strict.default.deepEqual(p.completeChapterMap(parsed, void 0), parsed);
  });
  (0, import_node_test.it)("keeps AI titles for matching sections and backfills the rest", () => {
    const parsed = [
      { time: "00:00", title: "Intro", summary: "a" },
      { time: "10:00", title: "Middle", summary: "c" }
    ];
    const out = p.completeChapterMap(parsed, [
      "00:00",
      "05:00",
      "10:00",
      "15:00"
    ]);
    import_strict.default.equal(out.length, 4, "one entry per section, guaranteed");
    import_strict.default.deepEqual(out[0], { time: "00:00", title: "Intro", summary: "a" });
    import_strict.default.deepEqual(out[1], { time: "05:00", title: "", summary: "" });
    import_strict.default.deepEqual(out[2], { time: "10:00", title: "Middle", summary: "c" });
    import_strict.default.deepEqual(out[3], { time: "15:00", title: "", summary: "" });
  });
  (0, import_node_test.it)("drops AI entries whose time is not on the grid", () => {
    const parsed = [
      { time: "00:04", title: "Off-grid", summary: "x" },
      { time: "05:00", title: "On-grid", summary: "y" }
    ];
    const out = p.completeChapterMap(parsed, ["00:00", "05:00"]);
    import_strict.default.deepEqual(out, [
      { time: "00:00", title: "", summary: "" },
      { time: "05:00", title: "On-grid", summary: "y" }
    ]);
  });
});
(0, import_node_test.describe)("repairTruncatedJson", () => {
  (0, import_node_test.it)("returns balanced json unchanged", () => {
    const input = '{"titleVerdict": "Hello", "coreSummary": ["A", "B"]}';
    import_strict.default.equal(repairTruncatedJson(input), input);
  });
  (0, import_node_test.it)("repairs JSON truncated inside an array string", () => {
    const input = '{"titleVerdict": "Done", "coreSummary": ["First", "Seco';
    const repaired = repairTruncatedJson(input);
    import_strict.default.ok(repaired);
    const parsed = JSON.parse(repaired);
    import_strict.default.equal(parsed.titleVerdict, "Done");
    import_strict.default.deepEqual(parsed.coreSummary, ["First", "Seco"]);
  });
  (0, import_node_test.it)("repairs JSON truncated inside an object within an array", () => {
    const input = '{"titleVerdict": "V", "chapterMap": [{"time": "00:00", "title": "Intro", "summary": "One"}, {"time": "05:00", "title": "Part 2"';
    const repaired = repairTruncatedJson(input);
    import_strict.default.ok(repaired);
    const parsed = JSON.parse(repaired);
    import_strict.default.equal(parsed.titleVerdict, "V");
    import_strict.default.equal(parsed.chapterMap.length, 2);
    import_strict.default.equal(parsed.chapterMap[0].title, "Intro");
    import_strict.default.equal(parsed.chapterMap[1].title, "Part 2");
  });
  (0, import_node_test.it)("repairs JSON truncated after a trailing comma", () => {
    const input = '{"titleVerdict": "V", "coreSummary": ["One"], ';
    const repaired = repairTruncatedJson(input);
    import_strict.default.ok(repaired);
    const parsed = JSON.parse(repaired);
    import_strict.default.equal(parsed.titleVerdict, "V");
    import_strict.default.deepEqual(parsed.coreSummary, ["One"]);
  });
  (0, import_node_test.it)("repairs JSON truncated mid-key", () => {
    const input = '{"titleVerdict": "V", "coreSummary": ["One"], "chapter';
    const repaired = repairTruncatedJson(input);
    import_strict.default.ok(repaired);
    const parsed = JSON.parse(repaired);
    import_strict.default.equal(parsed.titleVerdict, "V");
    import_strict.default.deepEqual(parsed.coreSummary, ["One"]);
  });
});
(0, import_node_test.describe)("sanitizeJsonString", () => {
  (0, import_node_test.it)("escapes raw newlines and tabs inside string literals", () => {
    const raw = '{"content": "- **Concept**: first line\n  - second line	with tab\r\n  - third line"}';
    const sanitized = sanitizeJsonString(raw);
    const parsed = JSON.parse(sanitized);
    import_strict.default.equal(
      parsed.content,
      "- **Concept**: first line\n  - second line	with tab\r\n  - third line"
    );
  });
  (0, import_node_test.it)("removes trailing commas before closing braces and brackets", () => {
    const raw = '{"a": 1, "b": [2, 3, ], }';
    const sanitized = sanitizeJsonString(raw);
    const parsed = JSON.parse(sanitized);
    import_strict.default.equal(parsed.a, 1);
    import_strict.default.deepEqual(parsed.b, [2, 3]);
  });
});
(0, import_node_test.describe)("AIProcessor.analyze (chunked)", () => {
  const longContent = "word ".repeat(13e3);
  function chunkResponses() {
    const contentPart = (i) => JSON.stringify({
      titleVerdict: `V${i}`,
      coreSummary: [`part${i}-b1`, `part${i}-b2`],
      isLongForm: true,
      chapterMap: [{ time: "00:00", title: `Ch${i}`, summary: `s${i}` }],
      customQuestionAnswers: []
    });
    const eggPartExtract = (i) => JSON.stringify({
      keyQuestionAnswers: [],
      extractedEntries: [{ kind: "insight", content: `- delta from part ${i}` }]
    });
    const eggPartCompare = (i) => JSON.stringify({
      novelDelta: [{ parent: "", content: `- delta from part ${i}` }],
      rejected: false,
      readVerdict: true,
      readVerdictReason: "novel"
    });
    return [
      contentPart(1),
      contentPart(2),
      contentPart(3),
      JSON.stringify({
        titleVerdict: "Overall verdict.",
        coreSummary: ["all-1", "all-2"],
        mindMap: [
          {
            name: "Overall Theme",
            detail: "Synthesized mental model across chunks",
            children: [{ name: "Combined Concept", detail: "Cross-chunk evidence" }]
          }
        ],
        customQuestionAnswers: [{ question: "Q?", answer: "A" }]
      }),
      // Egg A per-part: 3 extracts run concurrently, then 3 compares
      eggPartExtract(1),
      eggPartExtract(2),
      eggPartExtract(3),
      eggPartCompare(1),
      eggPartCompare(2),
      eggPartCompare(3),
      JSON.stringify({
        keyQuestionAnswers: [{ question: "Is this new?", answer: "Yes" }],
        rejected: false,
        readVerdict: true,
        readVerdictReason: "adds insight"
      }),
      // Egg B per-part: 3 extracts run concurrently, then 3 compares
      eggPartExtract(1),
      eggPartExtract(2),
      eggPartExtract(3),
      eggPartCompare(1),
      eggPartCompare(2),
      eggPartCompare(3),
      JSON.stringify({
        keyQuestionAnswers: [],
        rejected: true,
        rejectReason: "noise for this egg",
        readVerdict: false,
        readVerdictReason: ""
      })
    ];
  }
  (0, import_node_test.it)("runs per-part calls + aggregates and merges the results", async () => {
    const responses = chunkResponses();
    let calls = 0;
    const plugin = makeFakePlugin({
      aiClient: {
        chat: async () => responses[Math.min(calls++, responses.length - 1)]
      }
    });
    const result = await new AIProcessor(plugin).analyze(
      { ...capture, content: longContent, questions: ["Q?"] },
      [egg("a.md"), egg("b.md")]
    );
    import_strict.default.equal(calls, 18);
    import_strict.default.equal(result.titleVerdict, "Overall verdict.");
    import_strict.default.deepEqual(result.coreSummary, ["all-1", "all-2"]);
    import_strict.default.deepEqual(result.mindMap, [
      {
        name: "Overall Theme",
        detail: "Synthesized mental model across chunks",
        children: [{ name: "Combined Concept", detail: "Cross-chunk evidence" }]
      }
    ]);
    import_strict.default.equal(result.chapterMap.length, 3, "chapter maps unioned");
    import_strict.default.equal(result.customQuestionAnswers[0].answer, "A");
    import_strict.default.equal(result.eggResults.length, 2);
    import_strict.default.deepEqual(
      result.newKnowledge.map((k) => k.content).sort(),
      [
        "- delta from part 1",
        "- delta from part 2",
        "- delta from part 3",
        "- delta from part 1",
        "- delta from part 2",
        "- delta from part 3"
      ].sort()
    );
    import_strict.default.equal(result.eggResults[0].keyQuestionAnswers[0].answer, "Yes");
    import_strict.default.equal(result.eggResults[1].rejected, true);
    import_strict.default.equal(result.shouldRead, true, "one egg says read");
  });
  (0, import_node_test.it)("short content still uses the single-pass pipeline", async () => {
    let calls = 0;
    const plugin = makeFakePlugin({
      aiClient: {
        chat: async () => (calls++, JSON.stringify({ titleVerdict: "V", coreSummary: [], extractedEntries: [] }))
      }
    });
    await new AIProcessor(plugin).analyze({ ...capture }, [egg("a.md")]);
    import_strict.default.equal(calls, 2, "no chunking below the limit (1 content call + 1 egg extract call with 0 entries)");
  });
});
(0, import_node_test.describe)("AIProcessor.localizeEggTemplate", () => {
  (0, import_node_test.it)("returns stripped localized template and detected language when AI produces valid egg content", async () => {
    let sentPrompt = "";
    const plugin = makeFakePlugin({
      aiClient: {
        chat: async (prompt) => {
          sentPrompt = prompt;
          return '```markdown\n---\ntopic: "\u65B9\u6CD5\u8BBA"\nstatus: "active"\nlast_updated: "2026-09-12"\nlanguage: "Chinese"\n---\n\n> [!abstract]- Instructions:\n> **Scope:** \u4ECB\u7ECD\u505A\u4E8B\u7684\u5177\u4F53\u65B9\u6CD5\n>\n> **Action Guide:**\n> 1. Title Verdict: \u6838\u5FC3\u7ED3\u8BBA\n\n# Knowledge\n\n# Unprocessed\n```';
        }
      }
    });
    const templateInput = '---\ntopic: "Unknown"\nstatus: "active"\nlast_updated: "2026-08-14"\nlanguage: "English"\n---\n\n> [!abstract]- Instructions:\n> **Scope:** T\n>\n> **Action Guide:**\n> 1. Title Verdict: T\n\n# Knowledge\n\n# Unprocessed';
    const out = await new AIProcessor(plugin).localizeEggTemplate(
      templateInput,
      "\u4ECB\u7ECD\u505A\u4E8B\u7684\u5177\u4F53\u65B9\u6CD5"
    );
    import_strict.default.ok(out);
    import_strict.default.equal(out.language, "Chinese");
    import_strict.default.ok(out.content.includes('language: "Chinese"'));
    import_strict.default.ok(out.content.includes("**Scope:** \u4ECB\u7ECD\u505A\u4E8B\u7684\u5177\u4F53\u65B9\u6CD5"));
    import_strict.default.ok(out.content.includes("**Action Guide:**"));
    import_strict.default.ok(out.content.includes("# Knowledge"));
    import_strict.default.ok(out.content.includes("# Unprocessed"));
    import_strict.default.ok(!out.content.includes("```"));
    import_strict.default.ok(sentPrompt.includes("\u4ECB\u7ECD\u505A\u4E8B\u7684\u5177\u4F53\u65B9\u6CD5"));
    import_strict.default.ok(sentPrompt.includes(templateInput));
  });
  (0, import_node_test.it)("returns null when AI output is invalid or missing required markers", async () => {
    const plugin = makeFakePlugin({
      aiClient: {
        chat: async () => "Sorry, I cannot do that."
      }
    });
    const out = await new AIProcessor(plugin).localizeEggTemplate(
      "bad template",
      "test"
    );
    import_strict.default.equal(out, null);
  });
  (0, import_node_test.it)("returns null when no API key is configured", async () => {
    const noKey = makeFakePlugin({ settings: { aiApiKey: "" } });
    const out = await new AIProcessor(noKey).localizeEggTemplate(
      "template",
      "desc"
    );
    import_strict.default.equal(out, null);
  });
});
(0, import_node_test.describe)("AIProcessor.maybeMergeEgg", () => {
  function unprocessedEgg(n) {
    const entries = Array.from(
      { length: n },
      (_, i) => `- entry ${i + 1}`
    ).join("\n");
    return `---
language: "English"
---

# Knowledge

- existing

# Unprocessed

${entries}
`;
  }
  function makeProcessor(files, overrides = {}) {
    const store = makeFakeVault(files);
    const plugin = makeFakePlugin({ vault: store.vault, ...overrides });
    plugin.eggParser = new EggParser(plugin);
    return { p: new AIProcessor(plugin), files: store.files };
  }
  (0, import_node_test.it)("exports MERGE_THRESHOLD = 20", () => {
    import_strict.default.equal(MERGE_THRESHOLD, 20);
  });
  (0, import_node_test.it)("does nothing below the threshold (no AI call)", async () => {
    let calls = 0;
    const { p } = makeProcessor(
      { "egg.md": unprocessedEgg(19) },
      { aiClient: { chat: async () => (calls++, "{}") } }
    );
    const out = await p.maybeMergeEgg("egg.md");
    import_strict.default.equal(out, null);
    import_strict.default.equal(calls, 0);
  });
  (0, import_node_test.it)("merges 20 entries into the tree via one AI call", async () => {
    let seenPrompt = "";
    const { p, files } = makeProcessor(
      { "egg.md": unprocessedEgg(20) },
      {
        aiClient: {
          chat: async (prompt) => {
            seenPrompt = prompt;
            return JSON.stringify({
              knowledge: "- existing\n  - merged 1\n  - merged 2",
              unprocessed: ""
            });
          }
        }
      }
    );
    const out = await p.maybeMergeEgg("egg.md");
    import_strict.default.deepEqual(out, { egg: "egg.md", entries: 20 });
    const content = files.get("egg.md");
    import_strict.default.ok(
      content.includes("# Knowledge\n\n- existing\n  - merged 1\n  - merged 2"),
      "Knowledge tree replaced with the merged output"
    );
    import_strict.default.ok(!content.includes("- entry 1"), "Unprocessed entries consumed");
    import_strict.default.ok(seenPrompt.includes("- existing"));
    import_strict.default.ok(seenPrompt.includes("- entry 20"));
  });
  (0, import_node_test.it)("leaves the egg untouched when the AI returns no knowledge", async () => {
    const { p, files } = makeProcessor(
      { "egg.md": unprocessedEgg(20) },
      { aiClient: { chat: async () => JSON.stringify({ unprocessed: "x" }) } }
    );
    const before = files.get("egg.md");
    const out = await p.maybeMergeEgg("egg.md");
    import_strict.default.equal(out, null);
    import_strict.default.equal(files.get("egg.md"), before);
  });
  (0, import_node_test.it)("skips the merge without an API key", async () => {
    let calls = 0;
    const { p } = makeProcessor(
      { "egg.md": unprocessedEgg(20) },
      {
        settings: { aiApiKey: "" },
        aiClient: { chat: async () => (calls++, "{}") }
      }
    );
    import_strict.default.equal(await p.maybeMergeEgg("egg.md"), null);
    import_strict.default.equal(calls, 0);
  });
  (0, import_node_test.it)("returns null for a missing egg file", async () => {
    const { p } = makeProcessor({});
    import_strict.default.equal(await p.maybeMergeEgg("nope.md"), null);
  });
  (0, import_node_test.it)("mergeEgg merges on demand even with few entries (e.g. 3 entries)", async () => {
    const { p, files } = makeProcessor(
      { "egg.md": unprocessedEgg(3) },
      {
        aiClient: {
          chat: async () => JSON.stringify({
            knowledge: "- existing\n  - merged item",
            unprocessed: ""
          })
        }
      }
    );
    const out = await p.mergeEgg("egg.md");
    import_strict.default.deepEqual(out, { egg: "egg.md", entries: 3 });
    const content = files.get("egg.md");
    import_strict.default.ok(content.includes("- merged item"));
    import_strict.default.ok(!content.includes("- entry 1"));
  });
  (0, import_node_test.it)("mergeEgg returns null when there are 0 unprocessed entries", async () => {
    let calls = 0;
    const { p } = makeProcessor(
      { "egg.md": unprocessedEgg(0) },
      { aiClient: { chat: async () => (calls++, "{}") } }
    );
    const out = await p.mergeEgg("egg.md");
    import_strict.default.equal(out, null);
    import_strict.default.equal(calls, 0);
  });
});
(0, import_node_test.describe)("AIProcessor prompt building helpers", () => {
  const p = new AIProcessor(makeFakePlugin());
  (0, import_node_test.it)("chaptersBlock builds the timestamped list or empty", () => {
    import_strict.default.equal(
      p.chaptersBlock([{ time: "00:10", title: "Intro" }]),
      "## Video Chapters (use these EXACT timestamps)\n- 00:10 \u2014 Intro"
    );
    import_strict.default.equal(p.chaptersBlock([]), "");
    import_strict.default.equal(p.chaptersBlock(void 0), "");
  });
  (0, import_node_test.it)("questionsBlock numbers questions under a heading or empty", () => {
    import_strict.default.equal(
      p.questionsBlock(["a", "b"], "Custom"),
      "## Custom\n1. a\n2. b"
    );
    import_strict.default.equal(p.questionsBlock([], "Custom"), "");
  });
});
(0, import_node_test.describe)("EggParser prompt formatting (Step 1 vs Step 2)", () => {
  const parser = new EggParser(makeFakePlugin());
  const testEgg = egg("test.md", {
    scope: "Only AI engineering.",
    keyQuestions: ["What architecture is used?"],
    rejectionCriteria: ["Reject marketing hype."],
    formattingRules: "Use - [tag] **Concept**.",
    knowledge: "## AI\n- transformer\n",
    unprocessed: "- candidate one\n"
  });
  (0, import_node_test.it)("formatEggInstructionsForPrompt includes only instructions (no knowledge or unprocessed)", () => {
    const formatted = parser.formatEggInstructionsForPrompt(testEgg);
    import_strict.default.ok(formatted.includes("**Scope:** Only AI engineering."));
    import_strict.default.ok(formatted.includes("**Key Questions:**"));
    import_strict.default.ok(formatted.includes("1. What architecture is used?"));
    import_strict.default.ok(formatted.includes("**Rejection Criteria:**"));
    import_strict.default.ok(formatted.includes("- Reject marketing hype."));
    import_strict.default.ok(formatted.includes("**Formatting Rules:**\nUse - [tag] **Concept**."));
    import_strict.default.ok(!formatted.includes("transformer"), "Current knowledge must NOT be in instructions");
    import_strict.default.ok(!formatted.includes("candidate one"), "Unprocessed entries must NOT be in instructions");
  });
  (0, import_node_test.it)("formatEggKnowledgeForPrompt includes only knowledge tree and unprocessed", () => {
    const formatted = parser.formatEggKnowledgeForPrompt(testEgg);
    import_strict.default.ok(formatted.includes("**Current Knowledge:**\n## AI\n- transformer"));
    import_strict.default.ok(formatted.includes("**Unprocessed (pending merge):**\n- candidate one"));
    import_strict.default.ok(!formatted.includes("**Scope:**"), "Scope must not be in knowledge-only format");
    import_strict.default.ok(!formatted.includes("**Key Questions:**"), "Key questions must not be in knowledge-only format");
  });
});
(0, import_node_test.describe)("AIProcessor.compareEggKnowledge (Step 2)", () => {
  (0, import_node_test.it)("short-circuits when extracted candidate entries are empty", async () => {
    let calls = 0;
    const plugin = makeFakePlugin({
      aiClient: { chat: async () => (calls++, "{}") }
    });
    const p = new AIProcessor(plugin);
    const res = await p.compareEggKnowledge(
      { title: "T", url: "U" },
      egg("test.md"),
      []
    );
    import_strict.default.equal(calls, 0);
    import_strict.default.deepEqual(res.novelDelta, []);
    import_strict.default.equal(res.readVerdict, false);
    import_strict.default.ok(res.readVerdictReason.includes("No knowledge entries extracted"));
  });
  (0, import_node_test.it)("calls compare prompt and returns novel delta & verdict", async () => {
    let capturedPrompt = "";
    const plugin = makeFakePlugin({
      aiClient: {
        chat: async (prompt) => {
          capturedPrompt = prompt;
          return JSON.stringify({
            novelDelta: [{ parent: "## Existing", content: "- novel concept" }],
            rejected: false,
            readVerdict: true,
            readVerdictReason: "Contains novel architecture insight"
          });
        }
      }
    });
    const p = new AIProcessor(plugin);
    const res = await p.compareEggKnowledge(
      { title: "Article", url: "https://example.com" },
      egg("test.md", { knowledge: "## Existing\n- old" }),
      [{ kind: "insight", content: "- novel concept" }]
    );
    import_strict.default.ok(capturedPrompt.includes("## Existing Knowledge in Egg"));
    import_strict.default.ok(capturedPrompt.includes("## Existing\n- old"));
    import_strict.default.ok(capturedPrompt.includes("- novel concept"));
    import_strict.default.deepEqual(res.novelDelta, [{ parent: "## Existing", content: "- novel concept" }]);
    import_strict.default.equal(res.readVerdict, true);
    import_strict.default.equal(res.readVerdictReason, "Contains novel architecture insight");
  });
  (0, import_node_test.it)("parses redundant entries and reconciles non-novel candidate entries", async () => {
    const plugin = makeFakePlugin({
      aiClient: {
        chat: async () => JSON.stringify({
          novelDelta: [{ parent: "## Ideas", content: "- new insight" }],
          redundantEntries: [
            { existingParent: "## Core", content: "- already covered insight" }
          ],
          rejected: false,
          readVerdict: true,
          readVerdictReason: "Has new insight"
        })
      }
    });
    const p = new AIProcessor(plugin);
    const res = await p.compareEggKnowledge(
      { title: "Article", url: "https://example.com" },
      egg("test.md", { knowledge: "## Core\n- already covered insight" }),
      [
        { kind: "insight", content: "- new insight" },
        { kind: "insight", content: "- already covered insight" },
        { kind: "insight", content: "- another existing fact" }
      ]
    );
    import_strict.default.equal(res.novelDelta.length, 1);
    import_strict.default.equal(res.novelDelta[0].content, "- new insight");
    import_strict.default.equal(res.redundantEntries.length, 2);
    import_strict.default.equal(res.redundantEntries[0].content, "- already covered insight");
    import_strict.default.equal(res.redundantEntries[0].existingParent, "## Core");
    import_strict.default.equal(res.redundantEntries[1].content, "- another existing fact");
  });
});
(0, import_node_test.describe)("AIProcessor Output Language Rules", () => {
  (0, import_node_test.it)("content analysis follows contentOutputLanguage setting", () => {
    const pluginSame = makeFakePlugin({
      settings: { contentOutputLanguage: "same-as-content" }
    });
    const pSame = new AIProcessor(pluginSame);
    const ruleSame = pSame.getContentOutputRules();
    import_strict.default.ok(
      ruleSame.includes("the same language as the captured content"),
      `expected rule to specify same language as captured content, got: ${ruleSame}`
    );
    const pluginZh = makeFakePlugin({
      settings: { contentOutputLanguage: "Chinese" }
    });
    const pZh = new AIProcessor(pluginZh);
    const ruleZh = pZh.getContentOutputRules();
    import_strict.default.ok(
      ruleZh.includes("Chinese"),
      `expected rule to specify Chinese, got: ${ruleZh}`
    );
  });
  (0, import_node_test.it)("egg analysis follows the egg language property, falling back to plugin setting or egg knowledge", () => {
    const plugin = makeFakePlugin({
      settings: { contentOutputLanguage: "English" }
    });
    const p = new AIProcessor(plugin);
    const eggWithLang = {
      fileName: "ml.md",
      language: "Chinese",
      indexDescription: "machine learning notes"
    };
    const ruleWithLang = p.getEggOutputRules(eggWithLang);
    import_strict.default.ok(
      ruleWithLang.includes("Chinese"),
      `expected egg rule to follow egg.language, got: ${ruleWithLang}`
    );
    const ruleWithStringLang = p.getEggOutputRules("Japanese");
    import_strict.default.ok(
      ruleWithStringLang.includes("Japanese"),
      `expected rule to use language directly, got: ${ruleWithStringLang}`
    );
    const eggWithoutLang = {
      fileName: "test.md",
      language: "",
      indexDescription: "machine learning notes"
    };
    const ruleWithSetting = p.getEggOutputRules(eggWithoutLang);
    import_strict.default.ok(
      ruleWithSetting.includes("English"),
      `expected fallback to plugin setting when language is empty, got: ${ruleWithSetting}`
    );
    const pluginNoSetting = makeFakePlugin({
      settings: { contentOutputLanguage: "same-as-content" }
    });
    const pNoSetting = new AIProcessor(pluginNoSetting);
    const ruleNoSetting = pNoSetting.getEggOutputRules(eggWithoutLang);
    import_strict.default.ok(
      ruleNoSetting.includes("the same language as this egg note's existing knowledge"),
      `expected fallback to egg knowledge when setting is same-as-content, got: ${ruleNoSetting}`
    );
  });
  (0, import_node_test.it)("analyzeAgainstEgg parses language side-output and persists to egg file if missing", async () => {
    const { vault } = makeFakeVault({
      "nutegg/ml.md": `---
topic: "ML"
---

# Knowledge

# Unprocessed
`
    });
    const plugin = makeFakePlugin({
      vault,
      settings: { contentOutputLanguage: "same-as-content" }
    });
    const p = new AIProcessor(plugin);
    p.callAI = async (prompt) => {
      if (prompt.includes("You are a knowledge curator for the egg file")) {
        return JSON.stringify({
          language: "Chinese",
          keyQuestionAnswers: [],
          extractedEntries: [
            { kind: "insight", content: "- **\u6DF1\u5EA6\u5B66\u4E60**: \u795E\u7ECF\u7F51\u7EDC\u65B9\u6CD5" }
          ]
        });
      }
      return JSON.stringify({
        novelDelta: [{ parent: "", content: "- **\u6DF1\u5EA6\u5B66\u4E60**: \u795E\u7ECF\u7F51\u7EDC\u65B9\u6CD5" }],
        redundantEntries: [],
        rejected: false,
        readVerdict: true
      });
    };
    const egg2 = {
      fileName: "nutegg/ml.md",
      topic: "ML",
      language: "",
      scope: "",
      actionGuide: "",
      keyQuestions: [],
      rejectionCriteria: [],
      formattingRules: "",
      knowledge: "",
      unprocessed: "",
      indexDescription: ""
    };
    const result = await p.analyzeAgainstEgg(
      { title: "Test", url: "https://example.com", content: "Test content", sourceType: "article" },
      egg2
    );
    import_strict.default.ok(result);
    import_strict.default.equal(result.language, "Chinese");
    import_strict.default.equal(egg2.language, "Chinese");
    const fileContent = await vault.adapter.read("nutegg/ml.md");
    import_strict.default.ok(fileContent.includes('language: "Chinese"'));
  });
});
