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
  anthropic: {
    id: "anthropic",
    label: "Anthropic (Claude)",
    officialEndpoint: "https://api.anthropic.com/v1/messages",
    apiFormat: "anthropic",
    models: [
      "claude-opus-5",
      "claude-sonnet-5",
      "claude-haiku-4-5-20251001"
    ],
    keyPlaceholder: "sk-ant-...",
    openrouterPrefix: "anthropic/"
  },
  deepseek: {
    id: "deepseek",
    label: "DeepSeek",
    officialEndpoint: "https://api.deepseek.com/v1/chat/completions",
    apiFormat: "openai-compatible",
    models: ["deepseek-chat", "deepseek-reasoner"],
    keyPlaceholder: "sk-...",
    openrouterPrefix: "deepseek/"
  },
  gemini: {
    id: "gemini",
    label: "Google Gemini",
    officialEndpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    apiFormat: "openai-compatible",
    models: [
      "gemini-2.5-pro",
      "gemini-2.5-flash",
      "gemini-2.0-flash"
    ],
    keyPlaceholder: "AIza...",
    openrouterPrefix: "google/"
  },
  openai: {
    id: "openai",
    label: "OpenAI",
    officialEndpoint: "https://api.openai.com/v1/chat/completions",
    apiFormat: "openai-compatible",
    models: ["gpt-4o", "gpt-4o-mini", "o3-mini", "o1"],
    keyPlaceholder: "sk-...",
    openrouterPrefix: "openai/"
  },
  kimi: {
    id: "kimi",
    label: "Kimi (Moonshot)",
    officialEndpoint: "https://api.moonshot.cn/v1/chat/completions",
    apiFormat: "openai-compatible",
    models: [
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
    models: ["glm-4-plus", "glm-4-air", "glm-4-flash"],
    keyPlaceholder: "...",
    openrouterPrefix: "zhipu/"
  },
  qwen: {
    id: "qwen",
    label: "Qwen (Tongyi)",
    officialEndpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    apiFormat: "openai-compatible",
    models: ["qwen-max", "qwen-plus", "qwen-turbo"],
    keyPlaceholder: "sk-...",
    openrouterPrefix: "qwen/"
  },
  local: {
    id: "local",
    label: "Local LLM (Ollama, LM Studio, etc.)",
    officialEndpoint: "http://127.0.0.1:11434/v1/chat/completions",
    apiFormat: "openai-compatible",
    models: [
      "llama3.2",
      "llama3.3",
      "qwen2.5:7b",
      "qwen2.5:14b",
      "deepseek-r1:8b",
      "deepseek-r1:14b",
      "mistral",
      "phi4"
    ],
    keyPlaceholder: "Optional for local LLMs",
    openrouterPrefix: ""
  }
};
function isAIConfigured(settings) {
  if (settings.aiProvider === "local") {
    return Boolean(
      (settings.localEndpoint || PROVIDER_CATALOG.local.officialEndpoint) && settings.aiModel
    );
  }
  return Boolean(settings.aiApiKey && settings.aiApiKey.trim().length > 0);
}
var OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
function resolveConfig(settings) {
  const provider = PROVIDER_CATALOG[settings.aiProvider] || PROVIDER_CATALOG.anthropic;
  const source = settings.aiSource;
  if (settings.aiProvider === "local") {
    return {
      provider: "local",
      endpoint: settings.localEndpoint || provider.officialEndpoint,
      apiKey: settings.aiApiKey || "",
      model: settings.aiModel || "llama3.2",
      apiFormat: "openai-compatible",
      extraHeaders: {}
    };
  }
  if (source === "openrouter") {
    const model = provider.openrouterPrefix + settings.aiModel;
    return {
      provider: settings.aiProvider,
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
      const endpoint = settings.localEndpoint || provider.officialEndpoint;
      const modelsEndpoint = endpoint.replace(/\/chat\/completions\/?$/, "/models");
      try {
        const headers = { Accept: "application/json" };
        if (apiKey)
          headers["Authorization"] = `Bearer ${apiKey}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        const resp = await fetch(modelsEndpoint, {
          method: "GET",
          headers,
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (resp.ok) {
          return {
            ...baseInfo,
            hasBalance: false,
            statusText: `Connected (${model})`
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
          statusText: "Offline \u2014 ensure Ollama or LM Studio is running",
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
    if (source === "openrouter") {
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
    return this.chatOpenAICompatible(prompt, maxTokens);
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
  localEndpoint: "http://127.0.0.1:11434/v1/chat/completions",
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
  (0, import_node_test.it)("returns true for local provider without apiKey as long as endpoint and model exist", () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      aiProvider: "local",
      aiApiKey: "",
      localEndpoint: "http://127.0.0.1:11434/v1/chat/completions",
      aiModel: "llama3.2"
    };
    import_strict.default.equal(isAIConfigured(settings), true);
  });
  (0, import_node_test.it)("returns false for local provider if model is empty", () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      aiProvider: "local",
      aiApiKey: "",
      localEndpoint: "http://127.0.0.1:11434/v1/chat/completions",
      aiModel: ""
    };
    import_strict.default.equal(isAIConfigured(settings), false);
  });
});
(0, import_node_test.describe)("AIClient Local LLM execution", () => {
  (0, import_node_test.it)("executes chat against local endpoint without requiring an API key", async () => {
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
            choices: [{ message: { content: "Response from local llama3.2" } }]
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      };
      const settings = {
        ...DEFAULT_SETTINGS,
        aiProvider: "local",
        aiApiKey: "",
        localEndpoint: "http://127.0.0.1:11434/v1/chat/completions",
        aiModel: "llama3.2"
      };
      const client = new AIClient(settings);
      const res = await client.chat("Hello local model", 500);
      import_strict.default.equal(res, "Response from local llama3.2");
      import_strict.default.equal(capturedUrl, "http://127.0.0.1:11434/v1/chat/completions");
      import_strict.default.equal(capturedBody.model, "llama3.2");
      import_strict.default.equal(capturedBody.max_tokens, 500);
      import_strict.default.equal(capturedBody.max_completion_tokens, void 0);
      import_strict.default.equal(capturedHeaders["Authorization"], void 0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
  (0, import_node_test.it)("checkCredit returns connected status when local /models responds 200", async () => {
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async (url) => {
        if (url === "http://127.0.0.1:11434/v1/models") {
          return new Response(JSON.stringify({ data: [{ id: "llama3.2" }] }), { status: 200 });
        }
        return new Response("Not found", { status: 404 });
      };
      const settings = {
        ...DEFAULT_SETTINGS,
        aiProvider: "local",
        aiApiKey: "",
        localEndpoint: "http://127.0.0.1:11434/v1/chat/completions",
        aiModel: "llama3.2"
      };
      const client = new AIClient(settings);
      const info = await client.checkCredit(settings);
      import_strict.default.equal(info.provider, "local");
      import_strict.default.equal(info.hasBalance, false);
      import_strict.default.equal(info.statusText, "Connected (llama3.2)");
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
        aiModel: "llama3.2"
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
