import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AIClient, isAIConfigured, PROVIDER_CATALOG } from "../src/ai-client";
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

  it("returns true for local provider without apiKey as long as endpoint and model exist", () => {
    const settings: NutEggSettings = {
      ...DEFAULT_SETTINGS,
      aiProvider: "local",
      aiApiKey: "",
      localEndpoint: "http://127.0.0.1:11434/v1/chat/completions",
      aiModel: "llama3.2",
    };
    assert.equal(isAIConfigured(settings), true);
  });

  it("returns false for local provider if model is empty", () => {
    const settings: NutEggSettings = {
      ...DEFAULT_SETTINGS,
      aiProvider: "local",
      aiApiKey: "",
      localEndpoint: "http://127.0.0.1:11434/v1/chat/completions",
      aiModel: "",
    };
    assert.equal(isAIConfigured(settings), false);
  });
});

describe("AIClient Local LLM execution", () => {
  it("executes chat against local endpoint without requiring an API key", async () => {
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
            choices: [{ message: { content: "Response from local llama3.2" } }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }) as any;

      const settings: NutEggSettings = {
        ...DEFAULT_SETTINGS,
        aiProvider: "local",
        aiApiKey: "",
        localEndpoint: "http://127.0.0.1:11434/v1/chat/completions",
        aiModel: "llama3.2",
      };

      const client = new AIClient(settings);
      const res = await client.chat("Hello local model", 500);

      assert.equal(res, "Response from local llama3.2");
      assert.equal(capturedUrl, "http://127.0.0.1:11434/v1/chat/completions");
      assert.equal(capturedBody.model, "llama3.2");
      assert.equal(capturedBody.max_tokens, 500);
      assert.equal(capturedBody.max_completion_tokens, undefined);
      assert.equal(capturedHeaders["Authorization"], undefined);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("checkCredit returns connected status when local /models responds 200", async () => {
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = (async (url: string) => {
        if (url === "http://127.0.0.1:11434/v1/models") {
          return new Response(JSON.stringify({ data: [{ id: "llama3.2" }] }), { status: 200 });
        }
        return new Response("Not found", { status: 404 });
      }) as any;

      const settings: NutEggSettings = {
        ...DEFAULT_SETTINGS,
        aiProvider: "local",
        aiApiKey: "",
        localEndpoint: "http://127.0.0.1:11434/v1/chat/completions",
        aiModel: "llama3.2",
      };

      const client = new AIClient(settings);
      const info = await client.checkCredit(settings);

      assert.equal(info.provider, "local");
      assert.equal(info.hasBalance, false);
      assert.equal(info.statusText, "Connected (llama3.2)");
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
        aiModel: "llama3.2",
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

