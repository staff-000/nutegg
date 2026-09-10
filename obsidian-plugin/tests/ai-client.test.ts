import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  AIClient,
  isAIConfigured,
  PROVIDER_CATALOG,
  MODEL_CATALOG,
  findFamilyForModel,
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

describe("MODEL_CATALOG and 3-tier hierarchy", () => {
  it("defines families for all cloud providers in PROVIDER_CATALOG", () => {
    for (const providerId of Object.keys(PROVIDER_CATALOG) as AIProviderId[]) {
      if (providerId === "local") {
        assert.equal(MODEL_CATALOG.local, undefined, "Local does not have static model families in MODEL_CATALOG");
        assert.equal(PROVIDER_CATALOG.local.models, undefined, "Local does not require models array in PROVIDER_CATALOG");
        continue;
      }
      const families = MODEL_CATALOG[providerId];
      assert.ok(Array.isArray(families) && families.length > 0, `Provider ${providerId} must have at least one family`);
      for (const fam of families) {
        assert.ok(fam.id, `Family in ${providerId} must have an id`);
        assert.ok(fam.label, `Family in ${providerId} must have a label`);
        assert.ok(fam.defaultModel, `Family in ${providerId} must have a defaultModel`);
      }
    }
  });

  it("findFamilyForModel resolves matching family or defaults to first family", () => {
    // Anthropic: Fable family
    const fableFam = findFamilyForModel("anthropic", "claude-fable-5-1");
    assert.equal(fableFam?.id, "fable");

    // Anthropic: Opus family
    const opusFam = findFamilyForModel("anthropic", "claude-opus-5");
    assert.equal(opusFam?.id, "opus");

    // Anthropic: Sonnet family
    const sonnetFam = findFamilyForModel("anthropic", "claude-sonnet-5");
    assert.equal(sonnetFam?.id, "sonnet");

    // Anthropic: Haiku family
    const haikuFam = findFamilyForModel("anthropic", "claude-haiku-4-5-20251001");
    assert.equal(haikuFam?.id, "haiku");

    // OpenAI: GPT-6 family
    const gpt6Fam = findFamilyForModel("openai", "gpt-6-astra");
    assert.equal(gpt6Fam?.id, "gpt-6");

    // OpenAI: GPT-5.6 family
    const gpt5Fam = findFamilyForModel("openai", "gpt-5.6-sol");
    assert.equal(gpt5Fam?.id, "gpt-5");

    // OpenAI: Reasoning family
    const reasoningFam = findFamilyForModel("openai", "o3-mini");
    assert.equal(reasoningFam?.id, "reasoning");

    // OpenAI: GPT-4o family
    const gpt4oFam = findFamilyForModel("openai", "gpt-4o");
    assert.equal(gpt4oFam?.id, "gpt-4o");

    // Gemini: Gemini 2.5 family
    const geminiFam = findFamilyForModel("gemini", "gemini-2.5-flash");
    assert.equal(geminiFam?.id, "gemini-2.5");

    // DeepSeek: Chat family
    const deepseekFam = findFamilyForModel("deepseek", "deepseek-chat");
    assert.equal(deepseekFam?.id, "chat");

    // Kimi: K3 family
    const kimiFam = findFamilyForModel("kimi", "kimi-k3");
    assert.equal(kimiFam?.id, "kimi-k3");

    // Zhipu: GLM-5 family
    const zhipuFam = findFamilyForModel("zhipu", "glm-5.3");
    assert.equal(zhipuFam?.id, "glm-5");

    // Qwen: Qwen3 family
    const qwenFam = findFamilyForModel("qwen", "qwen3-max");
    assert.equal(qwenFam?.id, "qwen3");

    // Local returns undefined (no family list needed)
    const localFam = findFamilyForModel("local", "any");
    assert.equal(localFam, undefined);
  });
});


