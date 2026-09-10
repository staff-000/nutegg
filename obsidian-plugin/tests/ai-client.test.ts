import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  AIClient,
  isAIConfigured,
  PROVIDER_CATALOG,
  findOpenRouterFamily,
  type AIProviderId,
} from "../src/ai-client";
import { DEFAULT_SETTINGS, type NutEggSettings } from "../src/settings";

describe("isAIConfigured", () => {
  it("returns true for cloud provider when apiKey is present", () => {
    const settings: NutEggSettings = {
      ...DEFAULT_SETTINGS,
      aiProvider: "anthropic",
      aiApiKey: "sk-ant-test",
    };
    assert.equal(isAIConfigured(settings), true);
  });

  it("returns false for cloud provider when apiKey is empty", () => {
    const settings: NutEggSettings = {
      ...DEFAULT_SETTINGS,
      aiProvider: "anthropic",
      aiApiKey: "",
    };
    assert.equal(isAIConfigured(settings), false);
  });

  it("returns true for local provider without apiKey and even without model as long as endpoint exists", () => {
    const settings: NutEggSettings = {
      ...DEFAULT_SETTINGS,
      aiProvider: "local",
      aiApiKey: "",
      localEndpoint: "http://127.0.0.1:11434/v1/chat/completions",
      aiModel: "",
    };
    assert.equal(isAIConfigured(settings), true);
  });
});

describe("AIClient Local LLM execution", () => {
  it("executes chat against local OpenAI-compatible endpoint without requiring an API key or explicit model", async () => {
    let capturedUrl = "";
    let capturedHeaders: Record<string, string> = {};
    let capturedBody: any = null;

    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = (async (url: string, init?: any) => {
        capturedUrl = url;
        capturedHeaders = init?.headers || {};
        capturedBody = JSON.parse(init?.body || "{}");
        return new Response(
          JSON.stringify({
            choices: [{ message: { content: "Response from local model" } }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }) as any;

      const settings: NutEggSettings = {
        ...DEFAULT_SETTINGS,
        aiProvider: "local",
        localApiType: "openai",
        aiApiKey: "",
        localEndpoint: "http://127.0.0.1:1234/v1/chat/completions",
        aiModel: "",
      };

      const client = new AIClient(settings);
      const res = await client.chat("Hello local model", 500);

      assert.equal(res, "Response from local model");
      assert.equal(capturedUrl, "http://127.0.0.1:1234/v1/chat/completions");
      assert.equal(capturedBody.model, "default");
      assert.equal(capturedBody.max_tokens, 500);
      assert.equal(capturedBody.max_completion_tokens, undefined);
      assert.equal(capturedHeaders["Authorization"], undefined);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("executes chat against Ollama native /api/chat endpoint", async () => {
    let capturedUrl = "";
    let capturedBody: any = null;

    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = (async (url: string, init?: any) => {
        capturedUrl = url;
        capturedBody = JSON.parse(init?.body || "{}");
        return new Response(
          JSON.stringify({
            message: { content: "Response from Ollama native" },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }) as any;

      const settings: NutEggSettings = {
        ...DEFAULT_SETTINGS,
        aiProvider: "local",
        localApiType: "ollama",
        aiApiKey: "",
        localEndpoint: "http://127.0.0.1:11434/api/chat",
        aiModel: "",
      };

      const client = new AIClient(settings);
      const res = await client.chat("Hello ollama", 400);

      assert.equal(res, "Response from Ollama native");
      assert.equal(capturedUrl, "http://127.0.0.1:11434/api/chat");
      assert.equal(capturedBody.model, "default");
      assert.equal(capturedBody.stream, false);
      assert.equal(capturedBody.options?.num_predict, 400);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("checkCredit returns connected status when local /models responds 200", async () => {
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = (async (url: string) => {
        if (url === "http://127.0.0.1:11434/v1/models") {
          return new Response(JSON.stringify({ data: [{ id: "model-1" }] }), { status: 200 });
        }
        return new Response("Not found", { status: 404 });
      }) as any;

      const settings: NutEggSettings = {
        ...DEFAULT_SETTINGS,
        aiProvider: "local",
        localApiType: "openai",
        aiApiKey: "",
        localEndpoint: "http://127.0.0.1:11434/v1/chat/completions",
        aiModel: "",
      };

      const client = new AIClient(settings);
      const info = await client.checkCredit(settings);

      assert.equal(info.provider, "local");
      assert.equal(info.hasBalance, false);
      assert.equal(info.statusText, "Connected [OpenAI-compatible]");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("checkCredit returns offline status when local server is unreachable", async () => {
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = (async () => {
        throw new Error("ECONNREFUSED");
      }) as any;

      const settings: NutEggSettings = {
        ...DEFAULT_SETTINGS,
        aiProvider: "local",
        aiApiKey: "",
        localEndpoint: "http://127.0.0.1:11434/v1/chat/completions",
        aiModel: "",
      };

      const client = new AIClient(settings);
      const info = await client.checkCredit(settings);

      assert.equal(info.provider, "local");
      assert.equal(info.hasBalance, false);
      assert.ok(info.statusText.includes("Offline"));
      assert.ok(info.error);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe("PROVIDER_CATALOG consolidated models & OpenRouter families", () => {
  it("defines defaultModel and models for all cloud providers in PROVIDER_CATALOG", () => {
    for (const providerId of Object.keys(PROVIDER_CATALOG) as AIProviderId[]) {
      if (providerId === "local") {
        assert.equal(PROVIDER_CATALOG.local.models, undefined, "Local does not require models array in PROVIDER_CATALOG");
        continue;
      }
      const p = PROVIDER_CATALOG[providerId];
      assert.ok(p.defaultModel, `Provider ${providerId} must have a defaultModel`);
      assert.ok(Array.isArray(p.models) && p.models.length > 0, `Provider ${providerId} must have models array`);
      assert.ok(p.models.includes(p.defaultModel), `Provider ${providerId} defaultModel must be present in models array`);
    }
  });

  it("OpenRouter defines vendor families with default models", () => {
    const families = PROVIDER_CATALOG.openrouter.families;
    assert.ok(Array.isArray(families) && families.length > 0, "OpenRouter must have families");
    for (const fam of families) {
      assert.ok(fam.id, "OpenRouter family must have an id");
      assert.ok(fam.label, "OpenRouter family must have a label");
      assert.ok(fam.defaultModel, "OpenRouter family must have a defaultModel");
    }
  });

  it("findOpenRouterFamily resolves matching family or defaults to first family", () => {
    // OpenAI family
    const openaiFam = findOpenRouterFamily("openai/gpt-6-astra");
    assert.equal(openaiFam?.id, "openai");

    // Anthropic family
    const anthropicFam = findOpenRouterFamily("anthropic/claude-sonnet-5");
    assert.equal(anthropicFam?.id, "anthropic");

    // DeepSeek family
    const deepseekFam = findOpenRouterFamily("deepseek/deepseek-r1");
    assert.equal(deepseekFam?.id, "deepseek");

    // Google family
    const googleFam = findOpenRouterFamily("google/gemini-2.5-flash");
    assert.equal(googleFam?.id, "google");

    // Meta family
    const metaFam = findOpenRouterFamily("meta-llama/llama-3.3-70b-instruct");
    assert.equal(metaFam?.id, "meta");

    // Qwen family
    const qwenFam = findOpenRouterFamily("qwen/qwen-2.5-72b-instruct");
    assert.equal(qwenFam?.id, "qwen");

    // Unknown model defaults to first family (openai)
    const fallbackFam = findOpenRouterFamily("unknown-model");
    assert.equal(fallbackFam?.id, "openai");
  });
});


