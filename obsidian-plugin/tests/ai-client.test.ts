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

  it("requires the exact local model ID, but does not require an API key", () => {
    const settings: NutEggSettings = {
      ...DEFAULT_SETTINGS,
      aiProvider: "local",
      aiApiKey: "",
      localEndpoint: "http://127.0.0.1:11434/v1",
      aiModel: "",
    };
    assert.equal(isAIConfigured(settings), false);
    assert.equal(isAIConfigured({ ...settings, aiModel: 'installed-model' }), true);
  });
});

describe("AIClient settings changes", () => {
  it("keeps an existing job immutable and uses a newly entered key only in a new executor", async () => {
    const settings: NutEggSettings = { ...DEFAULT_SETTINGS, aiProvider: "openrouter", aiApiKey: "" };
    const client = new AIClient(settings);
    const originalFetch = globalThis.fetch;
    const requests: string[] = [];
    try {
      globalThis.fetch = (async (url: string, init?: any) => {
        requests.push(url);
        assert.equal(init.headers.Authorization, "Bearer new-user-key");
        if (url === "https://openrouter.ai/api/v1/credits") {
          return new Response(JSON.stringify({ data: { total_credits: 10, total_usage: 2 } }), { status: 200 });
        }
        assert.equal(url, "https://openrouter.ai/api/v1/chat/completions");
        return new Response(JSON.stringify({ choices: [{ message: { content: "Summary" } }] }), { status: 200 });
      }) as any;

      settings.aiApiKey = "new-user-key";
      const credit = await client.checkCredit(settings);
      assert.equal(credit.hasBalance, true);
      await assert.rejects(client.chat("Summarize this article", 500), {code:"no_api_key"});
      const updated = new AIClient(settings);
      assert.equal(await updated.chat("Summarize this article", 500), "Summary");
      assert.equal(requests.length, 2);

      settings.aiApiKey = "";
      await assert.rejects(client.chat("Summarize again", 500), { code: "no_api_key" });
      assert.equal(requests.length, 2, "clearing the key prevents further API calls");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("captures provider, model and key independently from subsequent settings edits", async () => {
    const settings: NutEggSettings = { ...DEFAULT_SETTINGS, aiProvider:"openai",aiModel:"captured-model", aiApiKey: "old-key" };
    const client = new AIClient(settings);
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = (async (url: string, init?: any) => {
        assert.equal(url, "https://api.openai.com/v1/chat/completions");
        assert.equal(init.headers.Authorization, "Bearer old-key");
        const body = JSON.parse(init.body);
        assert.equal(body.model, "captured-model");
        assert.equal(body.max_completion_tokens, 500);
        return new Response(JSON.stringify({ choices: [{ message: { content: "Updated response" } }] }), { status: 200 });
      }) as any;

      settings.aiProvider = "openai";
      settings.aiModel = "selected-model";
      settings.aiApiKey = "updated-key";
      assert.equal(await client.chat("Hello", 500), "Updated response");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe("AIClient Local LLM execution", () => {
  it("executes chat against local OpenAI-compatible endpoint using the exact model without an API key", async () => {
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
        localEndpoint: "http://127.0.0.1:1234/v1",
        aiModel: "installed-local-model",
      };

      const client = new AIClient(settings);
      const res = await client.chat("Hello local model", 500);

      assert.equal(res, "Response from local model");
      assert.equal(capturedUrl, "http://127.0.0.1:1234/v1/chat/completions");
      assert.equal(capturedBody.model, "installed-local-model");
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
        localEndpoint: "http://127.0.0.1:11434",
        aiModel: "installed-ollama-model",
      };

      const client = new AIClient(settings);
      const res = await client.chat("Hello ollama", 400);

      assert.equal(res, "Response from Ollama native");
      assert.equal(capturedUrl, "http://127.0.0.1:11434/api/chat");
      assert.equal(capturedBody.model, "installed-ollama-model");
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
        localEndpoint: "http://127.0.0.1:11434/v1",
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
        localEndpoint: "http://127.0.0.1:11434/v1",
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
  it("Obsidian initial settings use the shared provider default", () => {
    assert.equal(DEFAULT_SETTINGS.aiModel, PROVIDER_CATALOG[DEFAULT_SETTINGS.aiProvider].defaultModel);
  });

  it("sends the selected default through each cloud provider's API format", async () => {
    const originalFetch = globalThis.fetch;
    try {
      for (const providerId of Object.keys(PROVIDER_CATALOG) as AIProviderId[]) {
        if (providerId === "local") continue;
        const provider = PROVIDER_CATALOG[providerId];
        globalThis.fetch = (async (url: string, init?: any) => {
          const body = JSON.parse(init.body);
          const protocol = provider.connection.protocol;
          const path = protocol === 'gemini' ? `/models/${provider.defaultModel}:generateContent` :
            protocol === 'claude' ? '/messages' : '/chat/completions';
          assert.equal(url, provider.connection.baseUrl + path);
          if (protocol === 'gemini') {
            assert.equal(body.contents[0].parts[0].text, 'Summarize this article');
            assert.equal(body.generationConfig.maxOutputTokens, 500);
            assert.equal(init.headers['x-goog-api-key'], 'test-key');
          } else {
            assert.equal(body.model, provider.defaultModel);
            assert.equal(protocol === 'claude' ? body.messages[0].content[0].text : body.messages[0].content, 'Summarize this article');
            assert.equal(providerId === 'openai' ? body.max_completion_tokens : body.max_tokens, 500);
          }
          const response = protocol === "claude"
            ? { content: [{ type: "text", text: "Summary" }] }
            : protocol === 'gemini' ? { candidates: [{ content: { parts: [{ text: 'Summary' }] }, finishReason: 'STOP' }] }
            : { choices: [{ message: { content: "Summary" } }] };
          return new Response(JSON.stringify(response), { status: 200 });
        }) as any;
        const client = new AIClient({ ...DEFAULT_SETTINGS, aiProvider: providerId, aiModel: "", aiApiKey: "test-key" });
        assert.equal(await client.chat("Summarize this article", 500), "Summary");
      }
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

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
      if (fam.id !== "custom") {
        assert.ok(fam.models.includes(fam.defaultModel));
      }
      for (const model of fam.models) {
        assert.ok(PROVIDER_CATALOG.openrouter.models?.includes(model));
        assert.equal(findOpenRouterFamily(model)?.id, fam.id);
      }
    }
  });

  it("findOpenRouterFamily resolves matching families and preserves custom model selection", () => {
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

    // Vendors outside the selected four remain usable as custom model IDs.
    const metaFam = findOpenRouterFamily("meta-llama/llama-3.3-70b-instruct");
    assert.equal(metaFam?.id, "custom");

    // Qwen family
    const qwenFam = findOpenRouterFamily("qwen/qwen-2.5-72b-instruct");
    assert.equal(qwenFam?.id, "custom");

    // Unknown models belong to the custom family.
    const fallbackFam = findOpenRouterFamily("unknown-model");
    assert.equal(fallbackFam?.id, "custom");
  });
});

describe('job cancellation and credential redaction',()=>{
 it('aborts the provider fetch and returns a structured cancellation',async()=>{
  const original=globalThis.fetch;const controller=new AbortController();let requestSignal:AbortSignal;
  try {
   globalThis.fetch=async(_url:any,options:any)=>{requestSignal=options.signal;return new Promise((_resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new Error('aborted')),{once:true}));};
   const client=new AIClient({...DEFAULT_SETTINGS,aiProvider:'openai',aiApiKey:'private'},undefined,controller.signal);
   const pending=client.chat('Q',100);controller.abort();await assert.rejects(pending,{code:'cancelled'});assert.equal(requestSignal!.aborted,true);
  }finally{globalThis.fetch=original;}
 });
 it('redacts provider-echoed keys from chat errors and credit failures',async()=>{
  const original=globalThis.fetch;const client=new AIClient({...DEFAULT_SETTINGS,aiProvider:'openrouter',aiApiKey:'sensitive-key'});
  try {
   globalThis.fetch=async()=>new Response(JSON.stringify({error:{message:'invalid sensitive-key request'}}),{status:400});
   await assert.rejects(client.chat('Q',100),(error:any)=>!JSON.stringify(error).includes('sensitive-key'));
   globalThis.fetch=async()=>{throw new Error('network sensitive-key');};
   const credit=await client.checkCredit({...DEFAULT_SETTINGS,aiProvider:'openrouter',aiApiKey:'sensitive-key'});assert.ok(!JSON.stringify(credit).includes('sensitive-key'));
  }finally{globalThis.fetch=original;}
 });
});

describe('BYOKit structured provider failures', () => {
  it('distinguishes exhausted quota from retryable rate limits without parsing raw provider messages', async () => {
    const original = globalThis.fetch;
    const client = new AIClient({ ...DEFAULT_SETTINGS, aiProvider: 'openai', aiApiKey: 'private-key' });
    try {
      for (const [providerCode, expected] of [['insufficient_quota', 'quota_exceeded'], ['rate_limit_exceeded', 'rate_limited']]) {
        globalThis.fetch = async () => new Response(JSON.stringify({ error: { code: providerCode, message: 'private-key' } }), { status: 429 });
        await assert.rejects(client.chat('Hi', 100), (error: any) => {
          assert.equal(error.code, expected);
          assert.equal(error.statusCode, 429);
          assert.ok(!JSON.stringify(error).includes('private-key'));
          return true;
        });
      }
    } finally { globalThis.fetch = original; }
  });
});

it('credit descriptors can be localized without mutating transport values or unknown diagnostics', async () => {
  const { checkCreditAI, localizeCreditInfo } = await import('../../shared/src/client');
  const { zh } = await import('../src/i18n/zh');
  const settings = { ...DEFAULT_SETTINGS, aiProvider: 'openrouter' as const, aiApiKey: '' };
  const credit = await checkCreditAI(settings);
  assert.equal(credit.statusText, 'No API key configured');
  assert.equal(credit.statusKey, 'creditNoKey');
  const localized = localizeCreditInfo(credit, (key, params) =>
    zh[key].replace(/\{(\w+)\}/g, (match, name) => String(params?.[name] ?? match))
  );
  assert.equal(localized.statusText, zh.creditNoKey);
  assert.equal(localized.error, zh.creditNoKey);
  assert.equal(credit.statusText, 'No API key configured');
  assert.equal(localized.provider, 'openrouter');
  const unknown = { statusText: 'Provider diagnostic', error: 'Diagnostic 123', statusKey: 'future_key' as any, errorKey: 'toString' as any };
  assert.deepEqual(localizeCreditInfo(unknown, () => 'unused'), unknown);
});

it('credit interpolation metadata cannot retain provider-echoed API keys', async () => {
  const { checkCreditAI, localizeCreditInfo } = await import('../../shared/src/client');
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response('', { status: 503, statusText: 'sensitive-key' });
    const credit = await checkCreditAI({ ...DEFAULT_SETTINGS, aiProvider: 'local', aiApiKey: 'sensitive-key', aiModel: 'local-model' });
    assert.doesNotMatch(JSON.stringify(credit), /sensitive-key/);
    const localized = localizeCreditInfo(credit, (_key, params) => String(params?.status));
    assert.doesNotMatch(JSON.stringify(localized), /sensitive-key/);
  } finally { globalThis.fetch = originalFetch; }
});
