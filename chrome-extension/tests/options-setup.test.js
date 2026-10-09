const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const flush = () => new Promise(resolve => setImmediate(resolve));

async function setup(t, initial = {}, url = 'https://extension.test/options') {
  const html = fs.readFileSync(require.resolve('../src/options/options.html'), 'utf8');
  const dom = new JSDOM(html, { url, runScripts: 'outside-only' });
  t.after(() => dom.window.close());
  const win = dom.window;
  const values = { ...initial };
  const requests = [];
  const creditCalls = [];
  const messages = [];
  win.chrome = {
    storage: { local: { get: async () => ({ ...values }), set: async data => Object.assign(values, data) } },
    runtime: { sendMessage: async message => { messages.push(message); return {}; }, getManifest: () => ({ version: '1.0' }) },
    tabs: { create: () => {} },
  };
  win.fetch = async url => { requests.push(url); throw new Error('Offline'); };
  win.NutEggAI = {
    isSubscriptionProvider: provider => ['gemini-cli', 'codex-cli', 'claude-cli'].includes(provider),
    PROVIDER_CATALOG: {
      'gemini-cli': { label: 'Gemini subscription (local bridge)', models: ['auto'], defaultModel: 'auto', subscription: { cli: 'Antigravity CLI', login: 'agy' } },
      'codex-cli': { label: 'ChatGPT subscription (Codex CLI)', models: ['auto'], defaultModel: 'auto', subscription: { cli: 'Codex CLI', login: 'codex login' } },
      'claude-cli': { label: 'Claude subscription (Claude Code)', models: ['auto'], defaultModel: 'auto', subscription: { cli: 'Claude Code', login: 'claude auth login' } },
      gemini: { label: 'Google Gemini', models: ['gemini-default', 'gemini-pro'], defaultModel: 'gemini-default', keyPlaceholder: 'AIza...' },
      openai: { label: 'OpenAI', models: ['openai-default'], defaultModel: 'openai-default' },
      local: { label: 'Local', models: ['local-model'], defaultModel: 'local-model' },
    },
    PROMPTS: { contentAnalysis: 'Default prompt', followUp: 'Default follow-up' },
    checkCreditAI: async settings => { creditCalls.push(settings); return { providerLabel: 'Local', statusText: 'Ready' }; },
  };
  for (const file of ['i18n', 'popup/state/settings-state', 'options/options']) {
    win.eval(fs.readFileSync(require.resolve(`../src/${file}.js`), 'utf8'));
  }
  await flush();
  const el = id => win.document.getElementById(id);
  const change = id => el(id).dispatchEvent(new win.Event('change', { bubbles: true }));
  return { win, values, requests, creditCalls, messages, el, change };
}

test('a fresh install shows Chrome setup and sensible defaults without contacting Obsidian', async t => {
  const { values, requests, el } = await setup(t);
  assert.equal(el('ai-config-section').classList.contains('hidden'), false);
  assert.equal(el('obsidian-mode-enabled').checked, false);
  assert.equal(el('obsidian-config').classList.contains('hidden'), true);
  assert.equal(el('obsidian-active-card').classList.contains('hidden'), true);
  for (const id of ['reading-preferences', 'advanced-settings', 'obsidian-settings']) assert.equal(el(id).open, false);
  assert.equal(el('ai-provider-select').value, 'gemini');
  assert.equal(el('ai-model-select').value, 'gemini-default');
  assert.equal(el('section-mindmap').checked, true);
  assert.equal(el('section-knowledge').checked, false);
  assert.equal(el('section-discussion').checked, false);
  assert.deepEqual(requests, []);
  assert.deepEqual(values, {});
});

test('subscription setup uses a pairing token and clears credentials across provider boundaries', async t => {
  const { win, values, el, change } = await setup(t, { connectionMode: 'obsidian', chromeAiProvider: 'gemini', chromeAiApiKey: 'cloud-key' });
  el('ai-provider-select').value = 'gemini-cli';
  change('ai-provider-select');
  assert.equal(el('ai-key-input').value, '');
  assert.equal(el('ai-model-select').value, 'auto');
  assert.equal(el('gemini-bridge-help').hidden, false);
  assert.equal(win.document.querySelector('label[for="ai-key-input"]').textContent, 'Local pairing token');
  el('ai-save-btn').click();
  await flush();
  assert.match(el('ai-test-result').textContent, /pairing token/);
  el('ai-key-input').value = 'local-pairing-token';
  el('ai-save-btn').click();
  await flush();
  assert.equal(values.chromeAiProvider, 'gemini-cli');
  assert.equal(values.chromeAiApiKey, 'local-pairing-token');
  for (const provider of ['codex-cli', 'claude-cli']) {
    el('ai-provider-select').value = provider;
    change('ai-provider-select');
    assert.equal(el('ai-key-input').value, 'local-pairing-token');
    assert.equal(el('ai-model-select').value, 'auto');
    assert.match(el('ai-key-hint').textContent, provider === 'codex-cli' ? /codex login/ : /claude auth login/);
    assert.doesNotMatch(el('ai-key-hint').textContent, /\{cli\}|\{login\}/);
  }
  el('ai-provider-select').value = 'openai';
  change('ai-provider-select');
  assert.equal(el('ai-key-input').value, '');
  assert.equal(el('gemini-bridge-help').hidden, true);
});

test('saving setup rejects an empty key, then persists an immediately usable Chrome configuration', async t => {
  const { values, requests, el } = await setup(t, { chromeAiEnabled: false });
  el('ai-save-btn').click();
  await flush();
  assert.equal(values.chromeAiApiKey, undefined);
  assert.equal(el('ai-test-result').classList.contains('error'), true);
  el('ai-key-input').value = '  test-key  ';
  el('ai-save-btn').click();
  await flush();
  assert.equal(values.chromeAiApiKey, 'test-key');
  assert.equal(values.chromeAiProvider, 'gemini');
  assert.equal(values.chromeAiModel, 'gemini-default');
  assert.equal(values.chromeAiEnabled, true);
  assert.equal(values.connectionMode, 'chrome');
  assert.equal(el('ai-test-result').classList.contains('ok'), true);
  assert.equal(el('ai-save-btn').disabled, false);
  assert.deepEqual(requests, []);
});

test('Obsidian is an explicit opt-in and switching back restores the saved Chrome key', async t => {
  const { values, requests, el, change } = await setup(t, { chromeAiApiKey: 'saved-key' });
  el('obsidian-mode-enabled').checked = true;
  change('obsidian-mode-enabled');
  await flush();
  assert.equal(values.connectionMode, 'obsidian');
  assert.equal(el('ai-config-section').classList.contains('hidden'), false);
  assert.equal(el('obsidian-active-card').classList.contains('hidden'), false);
  assert.equal(el('obsidian-config').classList.contains('hidden'), false);
  assert.equal(el('chrome-advanced-settings').classList.contains('hidden'), false);
  assert.equal(el('chrome-cache-group').classList.contains('hidden'), true);
  assert.deepEqual(requests, ['http://127.0.0.1:27123/health']);
  el('use-chrome-btn').click();
  await flush();
  assert.equal(values.connectionMode, 'chrome');
  assert.equal(el('obsidian-mode-enabled').checked, false);
  assert.equal(el('ai-key-input').value, 'saved-key');
  assert.equal(el('ai-config-section').classList.contains('hidden'), false);
  assert.equal(el('chrome-advanced-settings').classList.contains('hidden'), false);
  assert.equal(requests.length, 1);
});

test('saved Obsidian mode exposes its connection settings on reload', async t => {
  const { requests, el } = await setup(t, { connectionMode: 'obsidian', serverPort: 28001 });
  assert.equal(el('obsidian-mode-enabled').checked, true);
  assert.equal(el('obsidian-settings').open, true);
  assert.equal(el('obsidian-active-card').classList.contains('hidden'), false);
  assert.deepEqual(requests, ['http://127.0.0.1:28001/health']);
});

test('old standalone enable links select Chrome directly without contacting Obsidian', async t => {
  const { values, requests, el } = await setup(t, { connectionMode: 'obsidian' }, 'https://extension.test/options?enableAi=1');
  assert.equal(values.connectionMode, 'chrome');
  assert.equal(el('obsidian-mode-enabled').checked, false);
  assert.equal(el('ai-config-section').classList.contains('hidden'), false);
  assert.deepEqual(requests, []);
});

test('a provider change chooses its default model and custom models require a value', async t => {
  const { values, el, change } = await setup(t, { chromeAiApiKey: 'test-key' });
  el('ai-provider-select').value = 'openai';
  change('ai-provider-select');
  assert.equal(el('ai-model-select').value, 'openai-default');
  el('ai-model-select').value = '__custom__';
  change('ai-model-select');
  el('ai-save-btn').click();
  assert.equal(values.chromeAiModel, undefined);
  assert.equal(el('ai-test-result').classList.contains('error'), true);
  el('ai-model-custom').value = 'custom-model';
  el('ai-save-btn').click();
  await flush();
  assert.equal(values.chromeAiModel, 'custom-model');
  assert.equal(el('ai-test-result').classList.contains('ok'), true);
});

test('local endpoint settings migrate from the previous storage name and use the canonical field for connection checks', async t => {
  const { values, creditCalls, el } = await setup(t, { chromeAiProvider: 'local', chromeAiLocalEndpoint: 'http://localhost:11434/v1/chat/completions' });
  assert.equal(el('ai-local-endpoint').value, 'http://localhost:11434/v1/chat/completions');
  el('ai-save-btn').click();
  await flush();
  assert.equal(values.chromeAiEndpoint, 'http://localhost:11434/v1/chat/completions');
  assert.equal(values.chromeAiApiKey, '');
  el('ai-test-btn').click();
  await flush();
  assert.equal(creditCalls[0].chromeAiEndpoint, values.chromeAiEndpoint);
  assert.equal(el('ai-advanced-status').classList.contains('ok'), true);
});

test('reading preferences preserve the last content section and save independently of vault preferences', async t => {
  const { values, el, change } = await setup(t, { generateKnowledgeEntries: false });
  el('section-mindmap').checked = false;
  change('section-mindmap');
  el('section-verdict-summary').checked = false;
  change('section-verdict-summary');
  assert.equal(el('section-verdict-summary').checked, true);
  el('output-lang-select').value = 'Japanese';
  el('sections-save-btn').click();
  await flush();
  assert.equal(values.outputLanguage, 'Japanese');
  assert.equal(values.enabledSections.mindMap, false);
  assert.equal(values.enabledSections.coreSummary, true);
  assert.equal(values.generateKnowledgeEntries, false);
});

test('chrome cache options load defaults, display cached count, save custom limit, and clear cache', async t => {
  const cachedEntries = [{ url: 'https://example.com/1' }, { url: 'https://example.com/2' }];
  const { values, el } = await setup(t, { chromeCacheTabLimit: 50, chromeTabCache: cachedEntries });
  
  assert.equal(el('chrome-cache-limit-input').value, '50');
  assert.match(el('chrome-cache-count').textContent, /2/);

  // Update limit to 1
  el('chrome-cache-limit-input').value = '1';
  el('chrome-cache-save-btn').click();
  await flush();
  assert.equal(values.chromeCacheTabLimit, 1);
  assert.equal(values.chromeTabCache.length, 1);
  assert.match(el('chrome-cache-count').textContent, /1/);
  assert.equal(el('chrome-cache-status').classList.contains('ok'), true);

  // Clear cache
  el('chrome-cache-clear-btn').click();
  await flush();
  assert.equal(values.chromeTabCache.length, 0);
  assert.match(el('chrome-cache-count').textContent, /0/);
  assert.equal(el('chrome-cache-status').classList.contains('ok'), true);
});

test('subscription providers appear only in Obsidian mode and pairing tokens never become API keys', async t => {
  const { values, el, change } = await setup(t, { chromeAiProvider: 'codex-cli', chromeAiApiKey: 'pairing-token', chromeAiModel: 'auto' });
  assert.equal(el('ai-provider-select').value, 'gemini');
  assert.equal(el('ai-key-input').value, '');
  assert.equal([...el('ai-provider-select').options].some(option => option.value.endsWith('-cli')), false);
  el('obsidian-mode-enabled').checked = true;
  change('obsidian-mode-enabled');
  await flush();
  assert.equal([...el('ai-provider-select').options].filter(option => option.value.endsWith('-cli')).length, 3);
  assert.equal(el('ai-provider-select').value, 'codex-cli');
  assert.equal(el('ai-key-input').value, 'pairing-token');
  el('ai-provider-select').value = 'codex-cli';
  change('ai-provider-select');
  el('ai-key-input').value = 'new-pairing-token';
  el('ai-save-btn').click();
  await flush();
  assert.equal(values.connectionMode, 'obsidian');
  assert.equal(values.chromeAiProvider, 'codex-cli');
  el('use-chrome-btn').click();
  await flush();
  assert.equal(el('ai-provider-select').value, 'gemini');
  assert.equal(el('ai-key-input').value, '');
});

test('processing limits load and save in Chrome for both modes and reject invalid values', async t => {
  const { values, el, change } = await setup(t, { chromeAiApiKey: 'key', chunkWindowChars: 20000, contentAnalysisMaxTokens: 8000 });
  assert.equal(el('chunk-window-chars').value, '20000');
  assert.equal(el('max-completion-tokens').value, '8000');
  el('chunk-window-chars').value = '999';
  el('ai-advanced-save-btn').click();
  await flush();
  assert.equal(values.chunkWindowChars, 20000);
  el('chunk-window-chars').value = '12000';
  el('max-completion-tokens').value = '6000';
  el('obsidian-mode-enabled').checked = true;
  change('obsidian-mode-enabled');
  await flush();
  el('ai-advanced-save-btn').click();
  await flush();
  assert.equal(values.chunkWindowChars, 12000);
  assert.equal(values.contentAnalysisMaxTokens, 6000);
  assert.equal(values.connectionMode, 'obsidian');
});

test('opening or saving Chrome settings mirrors AI to Obsidian even with vault mode off', async t => {
  const { messages, values, el } = await setup(t, { chromeAiApiKey: 'key' });
  assert.equal(messages.some(message => message.action === 'sync-ai-config'), true);
  messages.length = 0;
  el('ai-save-btn').click();
  await flush();
  assert.equal(messages.some(message => message.action === 'sync-ai-config'), true);
  assert.equal(values.connectionMode, 'chrome');
});
