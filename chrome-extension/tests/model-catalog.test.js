const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const code = fs.readFileSync(path.join(__dirname, '../dist/ai-core.js'), 'utf8');
const core = new Function(code + '\nreturn NutEggAI;')();
const config = require('../../shared/byok.config.json');
const providerIds = { anthropic: 'anthropic', google: 'gemini', openai: 'openai', deepseek: 'deepseek' };

test('shipped catalog matches the pinned BYOKit query and uses real OpenRouter offering IDs', async () => {
  const byokit = await import('byokit');
  const models = byokit.getModels(config);
  for (const [byokitId, nuteggId] of Object.entries(providerIds)) {
    const selected = models.filter(model => model.providerId === byokitId);
    const catalog = core.PROVIDER_CATALOG[nuteggId];
    assert.deepEqual(catalog.models, selected.map(model => model.apiModelId));
    assert.equal(catalog.defaultModel, (selected.find(model => model.tier === 'flash') || selected[0]).apiModelId);
    for (const model of selected) {
      assert.equal(core.resolveConfig({ aiProvider: nuteggId, aiModel: model.apiModelId }).model, model.apiModelId);
    }
  }
  const routerOfferings = byokit.getModels({ ...config, providerIds: ['openrouter'], dedupe: false });
  const seen = new Set();
  const expected = routerOfferings.filter(offering => {
    if (!models.some(model => model.modelId === offering.modelId) || seen.has(offering.modelId)) return false;
    seen.add(offering.modelId);
    return true;
  });
  assert.deepEqual(core.PROVIDER_CATALOG.openrouter.models, expected.map(offering => offering.apiModelId));
  assert.equal(new Set(expected.map(model => model.modelId)).size, expected.length);
  assert.doesNotMatch(code, /node_modules\/byokit\//, 'runtime must not bundle BYOKit discovery or catalog');
});

test('removed providers are rejected and custom models remain available for supported providers', () => {
  for (const provider of ['kimi', 'zhipu', 'qwen', 'unknown']) {
    assert.equal(core.PROVIDER_CATALOG[provider], undefined);
    const settings = { aiProvider: provider, aiModel: 'saved-working-model', aiApiKey: 'own-key' };
    assert.equal(core.isAIConfigured(settings), false);
    assert.throws(() => core.resolveConfig(settings), /Unknown AI provider/);
  }
  const selected = core.resolveConfig({ aiProvider: 'openai', aiModel: 'custom-working-model', aiApiKey: 'own-key' });
  assert.equal(selected.model, 'custom-working-model');
  assert.equal(selected.apiKey, 'own-key');
  assert.equal(core.findOpenRouterFamily('some-vendor/custom-model').id, 'custom');
});

test('local setup accepts base and full endpoints offline and requires the exact served model', () => {
  for (const [endpoint, localApiType, expected, apiFormat] of [
    ['http://localhost:8000/v1', undefined, 'http://localhost:8000/v1/chat/completions', 'openai-compatible'],
    ['http://localhost:1234/', undefined, 'http://localhost:1234/v1/chat/completions', 'openai-compatible'],
    ['http://localhost:8000/v1/chat/completions/', undefined, 'http://localhost:8000/v1/chat/completions', 'openai-compatible'],
    ['http://localhost:11434', 'ollama', 'http://localhost:11434/api/chat', 'ollama'],
    ['http://localhost:11434/api/chat', undefined, 'http://localhost:11434/api/chat', 'ollama'],
    ['http://localhost:11434/v1/chat/completions', 'ollama', 'http://localhost:11434/api/chat', 'ollama'],
  ]) {
    const settings = { chromeAiProvider: 'local', chromeAiEndpoint: endpoint, localApiType, chromeAiModel: 'served:model', chromeAiApiKey: 'server-key' };
    const config = core.resolveConfig(settings);
    assert.equal(config.endpoint, expected);
    assert.equal(config.apiFormat, apiFormat);
    assert.equal(config.model, 'served:model');
    assert.equal(config.apiKey, 'server-key');
    assert.equal(core.isAIConfigured(settings), true);
  }
  assert.equal(core.isAIConfigured({ aiProvider: 'local' }), false);
  assert.throws(() => core.resolveConfig({ aiProvider: 'local' }), /exact model ID/);
  for (const endpoint of ['ftp://localhost', 'http://user:secret@localhost', 'http://localhost?key=secret']) {
    assert.equal(core.isAIConfigured({ aiProvider: 'local', localEndpoint: endpoint, aiModel: 'served' }), false);
  }
});

test('explicit local connection checks use the normalized endpoint and native protocol', async () => {
  const original = globalThis.fetch;
  const requests = [];
  try {
    globalThis.fetch = async (url, init) => {
      requests.push({ url, headers: init.headers });
      return new Response('{}', { status: 200 });
    };
    await core.checkCreditAI({ chromeAiProvider: 'local', chromeAiEndpoint: 'http://localhost:8000/v1', chromeAiApiKey: 'server-key' });
    await core.checkCreditAI({ chromeAiProvider: 'local', chromeAiEndpoint: 'http://localhost:11434/api/chat' });
    assert.deepEqual(requests.map(request => request.url), ['http://localhost:8000/v1/models', 'http://localhost:11434/api/tags']);
    assert.equal(requests[0].headers.Authorization, 'Bearer server-key');
    assert.equal(requests[1].headers.Authorization, undefined);
  } finally {
    globalThis.fetch = original;
  }
});
