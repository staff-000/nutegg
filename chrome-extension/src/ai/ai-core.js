var NutEggAI = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
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
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // ../shared/src/index.ts
  var src_exports = {};
  __export(src_exports, {
    AIClient: () => AIClient,
    AIError: () => AIError,
    AIProcessor: () => AIProcessor,
    DEFAULT_CHUNK_WINDOW_CHARS: () => DEFAULT_CHUNK_WINDOW_CHARS,
    DEFAULT_SECTION_SECS: () => DEFAULT_SECTION_SECS,
    KNOWLEDGE_HEADING: () => KNOWLEDGE_HEADING,
    MERGE_THRESHOLD: () => MERGE_THRESHOLD,
    OPENROUTER_ENDPOINT: () => OPENROUTER_ENDPOINT,
    PROMPTS: () => PROMPTS,
    PROVIDER_CATALOG: () => PROVIDER_CATALOG,
    UNPROCESSED_HEADING: () => UNPROCESSED_HEADING,
    analyzeContentStandalone: () => analyzeContentStandalone,
    askFollowUpStandalone: () => askFollowUpStandalone,
    chatAI: () => chatAI,
    checkCreditAI: () => checkCreditAI,
    chunkContent: () => chunkContent,
    classifyError: () => classifyError,
    countUnprocessed: () => countUnprocessed,
    extractCallout: () => extractCallout,
    extractEggLanguage: () => extractEggLanguage,
    findOpenRouterFamily: () => findOpenRouterFamily,
    findSection: () => findSection,
    formatEggForPrompt: () => formatEggForPrompt,
    formatEggInstructionsForPrompt: () => formatEggInstructionsForPrompt,
    formatEggKnowledgeForPrompt: () => formatEggKnowledgeForPrompt,
    formatSeconds: () => formatSeconds,
    headingName: () => headingName,
    insertEggLanguage: () => insertEggLanguage,
    isAIConfigured: () => isAIConfigured,
    isEggPath: () => isEggPath,
    lineSeconds: () => lineSeconds,
    matchesEggFormat: () => matchesEggFormat,
    paragraphChunks: () => paragraphChunks,
    parseEggFile: () => parseEggFile,
    parseJson: () => parseJson,
    parseListItems: () => parseListItems,
    partNote: () => partNote,
    renderPrompt: () => renderPrompt,
    repairTruncatedJson: () => repairTruncatedJson,
    resolveConfig: () => resolveConfig,
    sanitizeEggName: () => sanitizeEggName,
    sanitizeJsonString: () => sanitizeJsonString,
    sectionBody: () => sectionBody,
    splitLabeledSections: () => splitLabeledSections,
    stripSectionHeading: () => stripSectionHeading,
    timestampedChunks: () => timestampedChunks,
    toSeconds: () => toSeconds
  });

  // ../shared/src/catalog.ts
  var OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
  var PROVIDER_CATALOG = {
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

  // ../shared/src/client.ts
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
  var AIClient = class {
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

  // ../shared/src/egg-format.ts
  function sanitizeEggName(name) {
    return String(name || "").trim().toLowerCase().replace(/[^\p{L}\p{N}_-]+/gu, "_").replace(/^_+|_+$/g, "").slice(0, 60);
  }
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
  function formatEggInstructionsForPrompt(egg) {
    const parts = [];
    parts.push(`**Scope:** ${egg.scope || "(not specified)"}`);
    if (egg.keyQuestions && egg.keyQuestions.length > 0) {
      parts.push(
        `**Key Questions:**
${egg.keyQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`
      );
    }
    if (egg.rejectionCriteria && egg.rejectionCriteria.length > 0) {
      parts.push(
        `**Rejection Criteria:**
${egg.rejectionCriteria.map((c) => `- ${c}`).join("\n")}`
      );
    }
    if (egg.formattingRules) {
      parts.push(`**Formatting Rules:**
${egg.formattingRules}`);
    }
    return parts.join("\n\n");
  }
  function formatEggKnowledgeForPrompt(egg) {
    const parts = [];
    parts.push(`**Current Knowledge:**
${egg.knowledge || "(empty)"}`);
    if (egg.unprocessed && egg.unprocessed.trim()) {
      parts.push(`**Unprocessed (pending merge):**
${egg.unprocessed}`);
    }
    return parts.join("\n\n");
  }
  function formatEggForPrompt(egg) {
    return [
      formatEggInstructionsForPrompt(egg),
      formatEggKnowledgeForPrompt(egg)
    ].join("\n\n");
  }
  function countUnprocessed(egg) {
    const indentOf = (l) => (l.match(/^\s*/) || [""])[0].length;
    const bullets = (egg.unprocessed || "").split("\n").map((l) => l.replace(/\s+$/, "")).filter((l) => /^\s*[-*]\s/.test(l));
    if (bullets.length === 0)
      return 0;
    const base = Math.min(...bullets.map(indentOf));
    return bullets.filter((l) => indentOf(l) === base).length;
  }

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
  function matchesEggFormat(content) {
    if (!content || typeof content !== "string")
      return false;
    if (/^---\r?\n[\s\S]*?\btopic:\s*["']?.+["']?[\s\S]*?\r?\n---/m.test(content)) {
      return true;
    }
    if (content.includes("# Knowledge") || content.includes("# Unprocessed") || content.includes("[!abstract]")) {
      return true;
    }
    return false;
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
  var content_task_default_default = "1. Title Verdict: Provide a single, direct sentence that resolves the core question posed in the title or introduction.\n2. Core Summary: Summarize the main concepts in plain language using a maximum of 3 bullet points.\n3. Chapter Map (Long-form only): If the content is a long article or lengthy video, provide a brief 1-sentence summary for each major section or topic shift. If it is short, omit this step entirely.\n";

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
  "customQuestionAnswers": [
    {
      "question": "exact question text",
      "answer": "direct answer",
      "sources": [{"ref": "00:00", "quote": "brief supporting quote"}]
    }
  ]
}

## Output Rules
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
    async analyze(capture, eggs) {
      if (!isAIConfigured(this.host?.settings)) {
        return this.fallbackAnalysis(capture, eggs);
      }
      const contentAnalysis = await this.analyzeContent(capture);
      return this.analyzeEggs(capture, eggs, contentAnalysis);
    }
    /**
     * Stage 1 — content summary + chapter map + custom question answers.
     * Handles long-form chunked content with aggregation or single-chunk content.
     */
    async analyzeContent(capture) {
      if (!isAIConfigured(this.host?.settings)) {
        return {
          titleVerdict: capture.title,
          coreSummary: [capture.title],
          isLongForm: false,
          chapterMap: [],
          customQuestionAnswers: (capture.questions || []).map((q) => ({
            question: q,
            answer: "No API key configured \u2014 cannot answer."
          }))
        };
      }
      const chunks = this.chunkContent(capture.content, capture.chapters || []);
      if (chunks.length > 1) {
        const partResults = await Promise.all(
          chunks.map(
            (chunk) => this.callContentChunk(
              {
                ...capture,
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
          capture,
          partResults.map((r, i) => ({
            part: i + 1,
            startTime: chunks[i].startTime,
            bullets: r.coreSummary
          }))
        );
        const chapterMap = partResults.flatMap((r) => r.chapterMap);
        return {
          titleVerdict: summary.titleVerdict,
          coreSummary: summary.coreSummary,
          isLongForm: true,
          chapterMap,
          customQuestionAnswers: summary.customQuestionAnswers
        };
      }
      const single = chunks[0];
      const effective = {
        ...capture,
        chapters: single?.chapters,
        sections: single?.sections
      };
      return this.callContentChunk(effective, "");
    }
    /**
     * Stage 2 — per-egg extraction, comparison against egg knowledge tree,
     * and final read verdict synthesis. Works identically for 1 or N eggs.
     */
    async analyzeEggs(capture, eggs, contentAnalysis) {
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
      const chunks = this.chunkContent(capture.content, capture.chapters || []);
      let eggResults = [];
      if (chunks.length > 1) {
        for (const egg of eggs) {
          const partEggs = await Promise.all(
            chunks.map(
              (chunk) => this.analyzeAgainstEgg(
                { ...capture, content: chunk.content },
                egg,
                partNote(chunk)
              )
            )
          );
          const aggregate = await this.aggregateEgg(
            egg,
            chunks.map((chunk, i) => ({
              part: i + 1,
              startTime: chunk.startTime,
              delta: partEggs[i]?.novelDelta || []
            }))
          );
          const novelDelta = aggregate.novelDelta && aggregate.novelDelta.length > 0 ? aggregate.novelDelta : this.mergePerPartDeltas(partEggs.flatMap((r) => r?.novelDelta || []));
          const redundantEntries = partEggs.flatMap((r) => r?.redundantEntries || []);
          const existingKnowledge = partEggs.find((r) => r?.existingKnowledge)?.existingKnowledge || egg.knowledge;
          eggResults.push({
            egg: egg.fileName,
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
          eggs.map((egg) => this.analyzeAgainstEgg(capture, egg))
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
    async callContentChunk(capture, partNoteStr = "") {
      const prompt = renderPrompt(this.getPrompt("contentAnalysis"), {
        content_task_default: this.getPrompt("contentTaskDefault"),
        title: capture.title,
        url: capture.url,
        source_type: capture.sourceType,
        part_note: partNoteStr,
        chapters: this.chaptersBlock(capture.chapters),
        sections: this.sectionsBlock(capture.sections),
        questions: this.questionsBlock(
          capture.questions,
          "User Questions (answer each directly and concisely)"
        ),
        content: this.truncate(capture.content, this.chunkWindowChars),
        shared_output_rules: this.getContentOutputRules()
      });
      const configuredMax = this.host?.settings?.contentAnalysisMaxTokens || 16384;
      const response = await this.callAI(prompt, configuredMax);
      const parsed = this.parseJson(response, "content-analysis");
      return {
        titleVerdict: String(parsed.titleVerdict || "Could not generate a verdict."),
        coreSummary: Array.isArray(parsed.coreSummary) ? parsed.coreSummary.map(String).slice(0, 3) : [],
        isLongForm: parsed.isLongForm === true,
        chapterMap: parsed.isLongForm === false && (!capture.chapters || capture.chapters.length === 0) ? [] : this.completeChapterMap(
          Array.isArray(parsed.chapterMap) ? parsed.chapterMap.filter((c) => c && (c.time || c.title)).map((c) => ({
            time: String(c.time || ""),
            title: String(c.title || ""),
            summary: String(c.summary || "")
          })) : [],
          capture.sections
        ),
        customQuestionAnswers: this.parseKeyAnswers(parsed.customQuestionAnswers)
      };
    }
    /**
     * Multiple eggs — per-egg analysis:
     *   Step 1: Extract candidate knowledge entries + key question answers using ONLY the egg's instructions.
     *   Step 2: Compare candidate entries against egg's Knowledge tree & Unprocessed entries to find novel delta and read verdict.
     */
    async analyzeAgainstEgg(capture, egg, partNoteStr = "") {
      const formatInstructions = (e) => this.host?.eggParser?.formatEggInstructionsForPrompt ? this.host.eggParser.formatEggInstructionsForPrompt(e) : formatEggInstructionsForPrompt(e);
      const prompt = renderPrompt(this.getPrompt("eggAnalysis"), {
        egg_file: egg.fileName,
        egg_instructions: formatInstructions(egg),
        title: capture.title,
        url: capture.url,
        source_type: capture.sourceType,
        part_note: partNoteStr,
        content: this.truncate(capture.content, this.chunkWindowChars),
        shared_output_rules: this.getEggOutputRules(egg)
      });
      try {
        const tokenBudget = this.host?.settings?.contentAnalysisMaxTokens || 16384;
        const response = await this.callAI(prompt, tokenBudget);
        const parsed = this.parseJson(response, "egg-analysis");
        const keyQuestionAnswers = this.parseKeyAnswers(parsed.keyQuestionAnswers);
        const extractedEntries = this.parseExtractedEntries(parsed.extractedEntries);
        const detectedLanguage = typeof parsed.language === "string" ? parsed.language.trim() : "";
        if (!egg.language && detectedLanguage) {
          egg.language = detectedLanguage;
          try {
            const vault = this.host?.app?.vault;
            const file = vault?.getAbstractFileByPath?.(egg.fileName);
            if (file && vault?.read && vault?.modify) {
              const content = await vault.read(file);
              const updated = insertEggLanguage(content, detectedLanguage);
              if (updated !== content) {
                await vault.modify(file, updated);
              }
            }
          } catch (err) {
            console.warn(`[NutEgg] Failed to persist LLM-detected language to ${egg.fileName}:`, err);
          }
        }
        const diff = await this.compareEggKnowledge(capture, egg, extractedEntries);
        return {
          egg: egg.fileName,
          language: detectedLanguage || egg.language || void 0,
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
        console.error(`[NutEgg] Egg analysis failed for ${egg.fileName}:`, err);
        return null;
      }
    }
    /**
     * Step 2 — Compare extracted candidate knowledge entries against the egg's
     * existing Knowledge tree and Unprocessed entries to find novel delta and read verdict.
     */
    async compareEggKnowledge(capture, egg, extractedEntries) {
      const existingKnowledge = egg.knowledge || "";
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
        egg_file: egg.fileName,
        title: capture.title,
        url: capture.url,
        current_knowledge: existingKnowledge || "(empty)",
        unprocessed: egg.unprocessed || "(empty)",
        rejection_criteria: egg.rejectionCriteria && egg.rejectionCriteria.length > 0 ? egg.rejectionCriteria.map((c) => `- ${c}`).join("\n") : "(none)",
        extracted_entries: extractedEntries.map((e, i) => `### Entry ${i + 1} (${e.kind || "insight"})
${e.content}`).join("\n\n"),
        shared_output_rules: this.getEggOutputRules(egg)
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
        console.error(`[NutEgg] Knowledge comparison failed for ${egg.fileName}:`, err);
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
    async aggregateContent(capture, chunkSummaries) {
      const prompt = renderPrompt(this.getPrompt("aggregateContent"), {
        title: capture.title,
        url: capture.url,
        chunk_summaries: chunkSummaries.map((c) => {
          const at = c.startTime ? ` (${c.startTime})` : "";
          const bullets = c.bullets.map((b) => `- ${b}`).join("\n");
          return `## Part ${c.part} of ${chunkSummaries.length}${at}
${bullets || "- (no summary)"}`;
        }).join("\n\n"),
        questions: this.questionsBlock(
          capture.questions,
          "User Questions (answer each directly and concisely)"
        ),
        content_task_default: this.getPrompt("contentTaskDefault"),
        shared_output_rules: this.getContentOutputRules()
      });
      const response = await this.callAI(prompt, 800);
      const parsed = this.parseJson(response, "aggregate-content");
      return {
        titleVerdict: String(parsed.titleVerdict || "Could not generate a verdict."),
        coreSummary: Array.isArray(parsed.coreSummary) ? parsed.coreSummary.map(String).slice(0, 3) : [],
        customQuestionAnswers: this.parseKeyAnswers(parsed.customQuestionAnswers)
      };
    }
    /** Aggregate per-part delta findings into the egg's key answers + verdict. */
    async aggregateEgg(egg, chunkFindings) {
      const formatEgg = (e) => this.host?.eggParser?.formatEggForPrompt ? this.host.eggParser.formatEggForPrompt(e) : formatEggForPrompt(e);
      const prompt = renderPrompt(this.getPrompt("aggregateEgg"), {
        egg_file: egg.fileName,
        egg_instructions: formatEgg(egg),
        chunk_findings: chunkFindings.map((f) => {
          const at = f.startTime ? ` (${f.startTime})` : "";
          const delta = f.delta.map((d) => d.content).join("\n");
          return `## Part ${f.part} of ${chunkFindings.length}${at}
${delta || "- (no novel delta)"}`;
        }).join("\n\n"),
        shared_output_rules: this.getEggOutputRules(egg)
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
    fallbackAnalysis(capture, eggs) {
      const firstSentence = capture.content.match(/^[^.!?]+[.!?]/)?.[0]?.trim() || capture.title;
      return {
        titleVerdict: firstSentence,
        coreSummary: [
          `Source: ${capture.title}`,
          "(Configure an API key in NutEgg settings for AI analysis)"
        ],
        isLongForm: false,
        chapterMap: [],
        customQuestionAnswers: (capture.questions || []).map((q) => ({
          question: q,
          answer: "No API key configured \u2014 cannot answer."
        })),
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
    async askFollowUp(capture, questions, priorQa = []) {
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
        title: capture.title,
        url: capture.url,
        source_type: capture.sourceType,
        prior_qa: priorBlock,
        content: this.truncate(capture.content, this.chunkWindowChars),
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
      const egg = await this.host?.eggParser?.readEgg?.(fileName);
      if (!egg)
        return null;
      const countFn = (e) => this.host?.eggParser?.countUnprocessed ? this.host.eggParser.countUnprocessed(e) : countUnprocessed(e);
      const entries = countFn(egg);
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
      if (!egg.language && this.host?.indexReader) {
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
      const outputLanguage = egg.language || (pluginLang ? `${pluginLang} (translate into ${pluginLang} even if the source is in a different language)` : "") || "the same language as this egg's existing knowledge";
      const prompt = renderPrompt(this.getPrompt("mergeUnprocessed"), {
        egg_file: fileName,
        output_language: outputLanguage,
        egg_description: outputLanguage,
        formatting_rules: egg.formattingRules || "(none)",
        knowledge_tree: egg.knowledge || "(empty)",
        unprocessed: egg.unprocessed,
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
      const egg = await this.host?.eggParser?.readEgg?.(fileName);
      if (!egg)
        return null;
      const countFn = (e) => this.host?.eggParser?.countUnprocessed ? this.host.eggParser.countUnprocessed(e) : countUnprocessed(e);
      const entries = countFn(egg);
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

  // ../shared/src/index.ts
  async function analyzeContentStandalone(payload, settings) {
    const config = resolveConfig(settings);
    const language = settings.contentOutputLanguage || settings.chromeAiOutputLanguage || "same-as-content";
    const host = {
      settings: {
        ...settings,
        contentOutputLanguage: language,
        chromeAiOutputLanguage: language
      },
      aiClient: {
        chat: (prompt, maxTokens) => chatAI(prompt, maxTokens || 16384, config)
      }
    };
    const processor = new AIProcessor(host);
    return processor.analyzeContent(payload);
  }
  async function askFollowUpStandalone(payload, question, priorQa = [], settings) {
    const config = resolveConfig(settings);
    const language = settings.contentOutputLanguage || settings.chromeAiOutputLanguage || "same-as-content";
    const host = {
      settings: {
        ...settings,
        contentOutputLanguage: language,
        chromeAiOutputLanguage: language
      },
      aiClient: {
        chat: (prompt, maxTokens) => chatAI(prompt, maxTokens || 2e3, config)
      }
    };
    const processor = new AIProcessor(host);
    const answers = await processor.askFollowUp(payload, [question], priorQa);
    return answers[0]?.answer || "No answer returned.";
  }
  return __toCommonJS(src_exports);
})();
