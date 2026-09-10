"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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

// tests/ai-client.test.ts
var import_node_test = require("node:test");
var import_strict = __toESM(require("node:assert/strict"));

// src/ai-client.ts
var PROVIDER_CATALOG = {
  local: {
    id: "local",
    label: "Local LLM (Ollama, LM Studio, etc.)",
    officialEndpoint: "http://127.0.0.1:11434/v1/chat/completions",
    apiFormat: "openai-compatible",
    models: [],
    keyPlaceholder: "Optional for local LLMs",
    openrouterPrefix: ""
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
    models: [
      "claude-sonnet-5",
      "claude-3-7-sonnet-20250219",
      "claude-3-5-sonnet-20241022",
      "claude-haiku-4-5-20251001",
      "claude-3-5-haiku-20241022",
      "claude-opus-5",
      "claude-3-opus-20240229"
    ],
    keyPlaceholder: "sk-ant-...",
    openrouterPrefix: "anthropic/"
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
    models: ["deepseek-chat", "deepseek-reasoner", "deepseek-flash"],
    keyPlaceholder: "sk-...",
    openrouterPrefix: "deepseek/"
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
var MODEL_CATALOG = {
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
        "anthropic/claude-3.5-haiku"
      ]
    },
    {
      id: "openai",
      label: "OpenAI GPT & Reasoning",
      defaultModel: "openai/gpt-5.6-sol",
      models: [
        "openai/gpt-5.6-sol",
        "openai/gpt-4o",
        "openai/o3-mini",
        "openai/o1"
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
        "google/gemini-2.5-pro",
        "google/gemini-2.0-flash-001"
      ]
    },
    {
      id: "meta",
      label: "Meta Llama",
      defaultModel: "meta-llama/llama-3.3-70b-instruct",
      models: [
        "meta-llama/llama-3.3-70b-instruct",
        "meta-llama/llama-3.1-8b-instruct"
      ]
    },
    {
      id: "qwen",
      label: "Qwen",
      defaultModel: "qwen/qwen-2.5-72b-instruct",
      models: [
        "qwen/qwen-2.5-72b-instruct",
        "qwen/qwen-2.5-coder-32b-instruct"
      ]
    },
    {
      id: "custom",
      label: "Custom OpenRouter Model",
      defaultModel: "anthropic/claude-sonnet-5",
      models: []
    }
  ],
  anthropic: [
    {
      id: "sonnet",
      label: "Claude Sonnet",
      defaultModel: "claude-sonnet-5",
      models: [
        "claude-sonnet-5",
        "claude-3-7-sonnet-20250219",
        "claude-3-5-sonnet-20241022"
      ]
    },
    {
      id: "haiku",
      label: "Claude Haiku",
      defaultModel: "claude-haiku-4-5-20251001",
      models: [
        "claude-haiku-4-5-20251001",
        "claude-3-5-haiku-20241022"
      ]
    },
    {
      id: "opus",
      label: "Claude Opus",
      defaultModel: "claude-opus-5",
      models: [
        "claude-opus-5",
        "claude-3-opus-20240229"
      ]
    }
  ],
  openai: [
    {
      id: "gpt-5",
      label: "GPT-5 Series (Flagship)",
      defaultModel: "gpt-5.6-sol",
      models: ["gpt-5.6-sol", "gpt-5.5", "gpt-5.4-nano"]
    },
    {
      id: "reasoning",
      label: "o-Series (Reasoning)",
      defaultModel: "o3-mini",
      models: ["o3-mini", "o1"]
    },
    {
      id: "gpt-4o",
      label: "GPT-4o Series",
      defaultModel: "gpt-4o",
      models: ["gpt-4o", "gpt-4o-mini"]
    }
  ],
  gemini: [
    {
      id: "gemini-2.5",
      label: "Gemini 2.5",
      defaultModel: "gemini-2.5-flash",
      models: ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.5-flash-lite"]
    },
    {
      id: "gemini-2.0",
      label: "Gemini 2.0",
      defaultModel: "gemini-2.0-flash",
      models: ["gemini-2.0-flash", "gemini-2.0-flash-lite"]
    }
  ],
  deepseek: [
    {
      id: "deepseek-chat",
      label: "DeepSeek V3 (Chat)",
      defaultModel: "deepseek-chat",
      models: ["deepseek-chat"]
    },
    {
      id: "deepseek-reasoner",
      label: "DeepSeek R1 (Reasoner)",
      defaultModel: "deepseek-reasoner",
      models: ["deepseek-reasoner"]
    },
    {
      id: "deepseek-flash",
      label: "DeepSeek V4.1 Flash",
      defaultModel: "deepseek-flash",
      models: ["deepseek-flash"]
    }
  ],
  kimi: [
    {
      id: "kimi-k3",
      label: "Kimi K3 (Flagship)",
      defaultModel: "kimi-k3",
      models: ["kimi-k3"]
    },
    {
      id: "kimi-k2.7",
      label: "Kimi K2.7 Code",
      defaultModel: "kimi-k2.7-code",
      models: ["kimi-k2.7-code", "kimi-k2.7-code-highspeed"]
    },
    {
      id: "moonshot-legacy",
      label: "Moonshot V1 (Legacy)",
      defaultModel: "moonshot-v1-8k",
      models: ["moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k"]
    }
  ],
  zhipu: [
    {
      id: "glm-5",
      label: "GLM-5 Series (Flagship)",
      defaultModel: "glm-5.3",
      models: ["glm-5.3", "glm-5", "glm-5-turbo"]
    },
    {
      id: "glm-4",
      label: "GLM-4 Series",
      defaultModel: "glm-4-flash",
      models: ["glm-4.7", "glm-4-plus", "glm-4-air", "glm-4-flash"]
    }
  ],
  qwen: [
    {
      id: "qwen3",
      label: "Qwen3 Series (Flagship)",
      defaultModel: "qwen3-max",
      models: ["qwen3-max", "qwen3-plus", "qwen3-flash"]
    },
    {
      id: "qwen-tiered",
      label: "Qwen Tiered (Max / Plus / Turbo)",
      defaultModel: "qwen-plus",
      models: ["qwen-max", "qwen-plus", "qwen-turbo"]
    }
  ]
};
function findFamilyForModel(providerId, modelName) {
  const families = MODEL_CATALOG[providerId] || [];
  if (families.length === 0)
    return void 0;
  return families.find((f) => f.models.includes(modelName)) || families[0];
}
function isAIConfigured(settings) {
  if (settings.aiProvider === "local") {
    return Boolean(
      settings.localEndpoint && settings.localEndpoint.trim().length > 0 || PROVIDER_CATALOG.local.officialEndpoint
    );
  }
  return Boolean(settings.aiApiKey && settings.aiApiKey.trim().length > 0);
}
var OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
function resolveConfig(settings) {
  const isLocal = settings.aiProvider === "local";
  const isOpenRouter = settings.aiProvider === "openrouter" || settings.aiSource === "openrouter";
  if (isLocal) {
    const isOllama = settings.localApiType === "ollama";
    const defaultEndpoint = isOllama ? "http://127.0.0.1:11434/api/chat" : "http://127.0.0.1:11434/v1/chat/completions";
    return {
      provider: "local",
      endpoint: settings.localEndpoint || defaultEndpoint,
      apiKey: settings.aiApiKey || "",
      model: settings.aiModel?.trim() || "default",
      apiFormat: isOllama ? "ollama" : "openai-compatible",
      extraHeaders: {}
    };
  }
  if (isOpenRouter) {
    const provider2 = PROVIDER_CATALOG[settings.aiProvider] || PROVIDER_CATALOG.openrouter;
    const prefix = provider2.openrouterPrefix || "";
    const model = settings.aiModel.startsWith(prefix) ? settings.aiModel : prefix + settings.aiModel;
    return {
      provider: "openrouter",
      endpoint: OPENROUTER_ENDPOINT,
      apiKey: settings.aiApiKey,
      model,
      apiFormat: "openai-compatible",
      extraHeaders: {
        "HTTP-Referer": "nutegg-obsidian-plugin",
        "X-Title": "NutEgg"
      }
    };
  }
  const provider = PROVIDER_CATALOG[settings.aiProvider] || PROVIDER_CATALOG.anthropic;
  return {
    provider: settings.aiProvider,
    endpoint: provider.officialEndpoint,
    apiKey: settings.aiApiKey,
    model: settings.aiModel,
    apiFormat: provider.apiFormat,
    extraHeaders: provider.apiFormat === "anthropic" ? { "anthropic-version": "2023-06-01" } : {}
  };
}
var AIError = class extends Error {
  code;
  statusCode;
  constructor(code, message, statusCode) {
    super(message);
    this.name = "AIError";
    this.code = code;
    this.statusCode = statusCode ?? null;
  }
};
function classifyError(statusCode, body) {
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
    return new AIError("server_error", `The AI service returned a server error (${statusCode}). It may be temporarily down \u2014 try again shortly.`, statusCode);
  }
  if (lower.includes("quota") || lower.includes("insufficient") || lower.includes("balance") || lower.includes("billing")) {
    return new AIError("quota_exceeded", "API quota exceeded or insufficient funds. Check your account balance or billing settings.", statusCode);
  }
  const snippet = body.slice(0, 300);
  return new AIError("unknown", `API error (${statusCode}): ${snippet}`, statusCode);
}
var AIClient = class {
  config;
  constructor(settings) {
    this.config = resolveConfig(settings);
  }
  /**
   * Check remaining credit/balance for the configured provider.
   */
  async checkCredit(settings) {
    const provider = PROVIDER_CATALOG[settings.aiProvider];
    const source = settings.aiSource;
    const apiKey = settings.aiApiKey;
    const model = settings.aiModel;
    const baseInfo = {
      provider: settings.aiProvider,
      providerLabel: provider?.label || settings.aiProvider,
      source,
      model,
      hasBalance: false,
      statusText: "Checking..."
    };
    if (settings.aiProvider === "local") {
      const isOllama = settings.localApiType === "ollama";
      const defaultEndpoint = isOllama ? "http://127.0.0.1:11434/api/chat" : "http://127.0.0.1:11434/v1/chat/completions";
      const endpoint = settings.localEndpoint || defaultEndpoint;
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
          const modelTag = model && model !== "default" ? ` (${model})` : "";
          const typeLabel = isOllama ? "Ollama Native" : "OpenAI-compatible";
          return {
            ...baseInfo,
            hasBalance: false,
            statusText: `Connected${modelTag} [${typeLabel}]`
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
    if (source === "openrouter" || settings.aiProvider === "openrouter") {
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
    if (settings.aiProvider === "deepseek") {
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
    if (settings.aiProvider === "kimi") {
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
      statusText: `${provider.label} (Pay-as-you-go / Direct)`
    };
  }
  async chat(prompt, maxTokens) {
    if (this.config.provider !== "local" && !this.config.apiKey) {
      throw new AIError(
        "no_api_key",
        "No AI API key configured. Open Obsidian Settings \u2192 NutEgg, enable Developer Mode, and add your API key."
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
  async chatOllama(prompt, maxTokens) {
    let response;
    const headers = {
      "Content-Type": "application/json",
      ...this.config.extraHeaders
    };
    if (this.config.apiKey && this.config.apiKey.trim().length > 0) {
      headers["Authorization"] = `Bearer ${this.config.apiKey}`;
    }
    const bodyPayload = {
      model: this.config.model || "default",
      messages: [{ role: "user", content: prompt }],
      stream: false,
      options: {
        num_predict: maxTokens,
        temperature: 0.3
      }
    };
    try {
      response = await fetch(this.config.endpoint, {
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
  // --- Anthropic-native format ---
  async chatAnthropic(prompt, maxTokens) {
    let response;
    try {
      response = await fetch(this.config.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.config.apiKey,
          ...this.config.extraHeaders
        },
        body: JSON.stringify({
          model: this.config.model,
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
  // --- OpenAI-compatible format ---
  async chatOpenAICompatible(prompt, maxTokens) {
    let response;
    const headers = {
      "Content-Type": "application/json",
      ...this.config.extraHeaders
    };
    if (this.config.apiKey && this.config.apiKey.trim().length > 0) {
      headers["Authorization"] = `Bearer ${this.config.apiKey}`;
    }
    const bodyPayload = {
      model: this.config.model,
      messages: [{ role: "user", content: prompt }]
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
    return data?.choices?.[0]?.message?.content || "";
  }
};

// src/settings.ts
var DEFAULT_SETTINGS = {
  developerMode: false,
  aiProvider: "anthropic",
  aiSource: "official",
  aiApiKey: "",
  aiModel: "claude-sonnet-5",
  aiModelFamily: "sonnet",
  localEndpoint: "http://127.0.0.1:11434/v1/chat/completions",
  localApiType: "openai",
  serverPort: 27123,
  rawFolder: "nutegg/_raw",
  indexFile: "nutegg/_index.md",
  workflowFolder: "nutegg/_workflow",
  workflowHashes: {}
};

// tests/ai-client.test.ts
(0, import_node_test.describe)("isAIConfigured", () => {
  (0, import_node_test.it)("returns true for cloud provider when apiKey is present", () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      aiProvider: "anthropic",
      aiApiKey: "sk-ant-test"
    };
    import_strict.default.equal(isAIConfigured(settings), true);
  });
  (0, import_node_test.it)("returns false for cloud provider when apiKey is empty", () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      aiProvider: "anthropic",
      aiApiKey: ""
    };
    import_strict.default.equal(isAIConfigured(settings), false);
  });
  (0, import_node_test.it)("returns true for local provider without apiKey and even without model as long as endpoint exists", () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      aiProvider: "local",
      aiApiKey: "",
      localEndpoint: "http://127.0.0.1:11434/v1/chat/completions",
      aiModel: ""
    };
    import_strict.default.equal(isAIConfigured(settings), true);
  });
});
(0, import_node_test.describe)("AIClient Local LLM execution", () => {
  (0, import_node_test.it)("executes chat against local OpenAI-compatible endpoint without requiring an API key or explicit model", async () => {
    let capturedUrl = "";
    let capturedHeaders = {};
    let capturedBody = null;
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async (url, init) => {
        capturedUrl = url;
        capturedHeaders = init?.headers || {};
        capturedBody = JSON.parse(init?.body || "{}");
        return new Response(
          JSON.stringify({
            choices: [{ message: { content: "Response from local model" } }]
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      };
      const settings = {
        ...DEFAULT_SETTINGS,
        aiProvider: "local",
        localApiType: "openai",
        aiApiKey: "",
        localEndpoint: "http://127.0.0.1:1234/v1/chat/completions",
        aiModel: ""
      };
      const client = new AIClient(settings);
      const res = await client.chat("Hello local model", 500);
      import_strict.default.equal(res, "Response from local model");
      import_strict.default.equal(capturedUrl, "http://127.0.0.1:1234/v1/chat/completions");
      import_strict.default.equal(capturedBody.model, "default");
      import_strict.default.equal(capturedBody.max_tokens, 500);
      import_strict.default.equal(capturedBody.max_completion_tokens, void 0);
      import_strict.default.equal(capturedHeaders["Authorization"], void 0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
  (0, import_node_test.it)("executes chat against Ollama native /api/chat endpoint", async () => {
    let capturedUrl = "";
    let capturedBody = null;
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async (url, init) => {
        capturedUrl = url;
        capturedBody = JSON.parse(init?.body || "{}");
        return new Response(
          JSON.stringify({
            message: { content: "Response from Ollama native" }
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      };
      const settings = {
        ...DEFAULT_SETTINGS,
        aiProvider: "local",
        localApiType: "ollama",
        aiApiKey: "",
        localEndpoint: "http://127.0.0.1:11434/api/chat",
        aiModel: "qwen2.5:7b"
      };
      const client = new AIClient(settings);
      const res = await client.chat("Hello ollama", 400);
      import_strict.default.equal(res, "Response from Ollama native");
      import_strict.default.equal(capturedUrl, "http://127.0.0.1:11434/api/chat");
      import_strict.default.equal(capturedBody.model, "qwen2.5:7b");
      import_strict.default.equal(capturedBody.stream, false);
      import_strict.default.equal(capturedBody.options?.num_predict, 400);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
  (0, import_node_test.it)("checkCredit returns connected status when local /models responds 200", async () => {
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async (url) => {
        if (url === "http://127.0.0.1:11434/v1/models") {
          return new Response(JSON.stringify({ data: [{ id: "model-1" }] }), { status: 200 });
        }
        return new Response("Not found", { status: 404 });
      };
      const settings = {
        ...DEFAULT_SETTINGS,
        aiProvider: "local",
        localApiType: "openai",
        aiApiKey: "",
        localEndpoint: "http://127.0.0.1:11434/v1/chat/completions",
        aiModel: "custom-tag"
      };
      const client = new AIClient(settings);
      const info = await client.checkCredit(settings);
      import_strict.default.equal(info.provider, "local");
      import_strict.default.equal(info.hasBalance, false);
      import_strict.default.equal(info.statusText, "Connected (custom-tag) [OpenAI-compatible]");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
  (0, import_node_test.it)("checkCredit returns offline status when local server is unreachable", async () => {
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async () => {
        throw new Error("ECONNREFUSED");
      };
      const settings = {
        ...DEFAULT_SETTINGS,
        aiProvider: "local",
        aiApiKey: "",
        localEndpoint: "http://127.0.0.1:11434/v1/chat/completions",
        aiModel: ""
      };
      const client = new AIClient(settings);
      const info = await client.checkCredit(settings);
      import_strict.default.equal(info.provider, "local");
      import_strict.default.equal(info.hasBalance, false);
      import_strict.default.ok(info.statusText.includes("Offline"));
      import_strict.default.ok(info.error);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
(0, import_node_test.describe)("MODEL_CATALOG and 3-tier hierarchy", () => {
  (0, import_node_test.it)("defines families for all cloud providers in PROVIDER_CATALOG", () => {
    for (const providerId of Object.keys(PROVIDER_CATALOG)) {
      if (providerId === "local") {
        import_strict.default.equal(MODEL_CATALOG.local.length, 0, "Local does not require static model families");
        continue;
      }
      const families = MODEL_CATALOG[providerId];
      import_strict.default.ok(Array.isArray(families) && families.length > 0, `Provider ${providerId} must have at least one family`);
      for (const fam of families) {
        import_strict.default.ok(fam.id, `Family in ${providerId} must have an id`);
        import_strict.default.ok(fam.label, `Family in ${providerId} must have a label`);
        import_strict.default.ok(fam.defaultModel, `Family in ${providerId} must have a defaultModel`);
      }
    }
  });
  (0, import_node_test.it)("findFamilyForModel resolves matching family or defaults to first family", () => {
    const sonnetFam = findFamilyForModel("anthropic", "claude-sonnet-5");
    import_strict.default.equal(sonnetFam?.id, "sonnet");
    const haikuFam = findFamilyForModel("anthropic", "claude-haiku-4-5-20251001");
    import_strict.default.equal(haikuFam?.id, "haiku");
    const gpt5Fam = findFamilyForModel("openai", "gpt-5.6-sol");
    import_strict.default.equal(gpt5Fam?.id, "gpt-5");
    const reasoningFam = findFamilyForModel("openai", "o3-mini");
    import_strict.default.equal(reasoningFam?.id, "reasoning");
    const kimiFam = findFamilyForModel("kimi", "kimi-k3");
    import_strict.default.equal(kimiFam?.id, "kimi-k3");
    const zhipuFam = findFamilyForModel("zhipu", "glm-5.3");
    import_strict.default.equal(zhipuFam?.id, "glm-5");
    const qwenFam = findFamilyForModel("qwen", "qwen3-max");
    import_strict.default.equal(qwenFam?.id, "qwen3");
    const localFam = findFamilyForModel("local", "any");
    import_strict.default.equal(localFam, void 0);
  });
});
