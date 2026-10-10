const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { JSDOM } = require('jsdom');
const flush = () => new Promise(resolve => setImmediate(resolve));

async function setup(t, initial = {}, url = 'https://extension.test/options', credit = {}) {
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
  win.fetch = async url => { requests.push(url); if (String(url).endsWith('/health')) return { ok: true, json: async () => ({ subscriptionEnabled: initial.subscriptionFeatureEnabled !== false }) }; throw new Error('Offline'); };
  win.eval(fs.readFileSync(require.resolve('../dist/ai-core.js'), 'utf8'));
  const core = win.NutEggAI;
  win.NutEggAI = {
    migrateAISettings: core.migrateAISettings,
    supportsSubscription: core.supportsSubscription,
    isSubscriptionProvider: provider => ['gemini-cli', 'codex-cli', 'claude-cli'].includes(provider),
    PROVIDER_CATALOG: {
      gemini: { label: 'Google Gemini', models: ['gemini-default', 'gemini-pro'], defaultModel: 'gemini-default', keyPlaceholder: 'AIza...' },
      openai: { label: 'OpenAI', models: ['openai-default'], defaultModel: 'openai-default' },
      local: { label: 'Local', models: ['local-model'], defaultModel: 'local-model' },
    },
    PROMPTS: { contentAnalysis: 'Default prompt', followUp: 'Default follow-up' },
    checkCreditAI: async settings => {
      creditCalls.push(settings);
      if (credit.throwError) throw new Error(credit.throwError);
      return { providerLabel: 'Local', statusText: 'Ready', ...credit };
    },
  };
  for (const file of ['i18n', 'popup/state/settings-state', 'options/options']) {
    win.eval(fs.readFileSync(require.resolve(`../src/${file}.js`), 'utf8'));
  }
  await flush();
  const el = id => win.document.getElementById(id);
  const change = id => el(id).dispatchEvent(new win.Event('change', { bubbles: true }));
  return { win, values, requests, creditCalls, messages, el, change };
}

test('saving AI settings shows remaining credit for the saved provider in both save locations', async t => {
  for (const advanced of [false, true]) {
    const { values, creditCalls, el } = await setup(t, { chromeAiApiKey: 'saved-key' }, undefined, {
      providerLabel: 'Google Gemini', hasBalance: true, balanceFormatted: '$12.34',
    });
    el(advanced ? 'ai-advanced-save-btn' : 'ai-save-btn').click();
    await flush();
    assert.equal(creditCalls.length, 1);
    assert.equal(creditCalls[0].chromeAiApiKey, values.chromeAiApiKey);
    assert.equal(creditCalls[0].chromeAiProvider, values.chromeAiProvider);
    assert.equal(creditCalls[0].chromeAiModel, values.chromeAiModel);
    const status = el(advanced ? 'ai-advanced-status' : 'ai-test-result');
    assert.match(status.textContent, /saved/i);
    assert.match(status.textContent, /Google Gemini · Balance: \$12\.34/);
    assert.equal(status.classList.contains('ok'), true);
  }
});

test('credit lookup failures preserve the save confirmation and saved settings', async t => {
  for (const credit of [{ throwError: 'Credit service offline' }, { error: 'Invalid key', statusText: 'Unauthorized' }]) {
    const { values, el } = await setup(t, { chromeAiApiKey: 'saved-key' }, undefined, credit);
    el('ai-save-btn').click();
    await flush();
    assert.equal(values.chromeAiApiKey, 'saved-key');
    assert.match(el('ai-test-result').textContent, /saved/i);
    assert.match(el('ai-test-result').textContent, /Credit service offline|Invalid key/);
    assert.equal(el('ai-save-btn').disabled, false);
  }
});

test('saving a provider without balance support shows its status', async t => {
  const { el } = await setup(t, { chromeAiProvider: 'local' });
  el('ai-save-btn').click();
  await flush();
  assert.match(el('ai-test-result').textContent, /Local · Status: Ready/);
  assert.doesNotMatch(el('ai-test-result').textContent, /Balance:/);
});

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

test('subscription shares its provider and preserves API credentials while hiding Chrome model edits', async t => {
  const { values, el, change, creditCalls, messages } = await setup(t, { connectionMode: 'obsidian', chromeAiProvider: 'gemini', chromeAiApiKey: 'cloud-key', chromeAiModel: 'gemini-pro' });
  el('ai-auth-method').value = 'subscription'; change('ai-auth-method');
  assert.equal(el('ai-key-input').value, '');
  assert.equal(el('ai-key-row').hidden, true);
  assert.equal(el('ai-model-row').hidden, true);
  assert.equal(el('ai-save-btn').hidden, true);
  assert.equal(el('ai-provider-select').disabled, true);
  assert.equal(el('subscription-model-badge').textContent, 'gemini-pro');
  el('ai-auth-method').value = 'apiKey'; change('ai-auth-method');
  assert.equal(el('ai-key-row').hidden, false);
  assert.equal(el('ai-model-row').hidden, false);
  assert.equal(el('ai-save-btn').hidden, false);
  assert.equal(el('ai-provider-select').disabled, false);
  assert.equal(el('ai-key-input').value, 'cloud-key');
  assert.equal(el('ai-model-select').value, 'gemini-pro');
});

test('switching to non-subscription provider in apiKey mode keeps use-subscription enabled and toggling switches to subscription', async t => {
  const { values, el, change } = await setup(t, { connectionMode: 'obsidian', subscriptionFeatureEnabled: true, chromeAiProvider: 'gemini', chromeAiApiKey: 'gemini-key' });
  el('ai-provider-select').value = 'local'; change('ai-provider-select');
  assert.equal(el('ai-auth-method').querySelector('option[value="subscription"]').disabled, false);
  assert.equal(el('use-subscription-toggle').disabled, false);
  assert.equal(el('use-subscription-toggle').checked, false);
  el('ai-test-result').textContent = 'Saved. ✅ Connected: DeepSeek · Balance: ¥8.23';
  el('ai-test-result').className = 'test-result ok';
  el('use-subscription-toggle').checked = true; change('use-subscription-toggle');
  assert.equal(el('ai-test-result').textContent, '');
  assert.equal(el('ai-test-result').classList.contains('hidden'), true);
  assert.equal(el('ai-auth-method').value, 'subscription');
  assert.equal(el('ai-provider-select').disabled, true);
  assert.equal(el('ai-key-row').hidden, true);
  el('use-subscription-toggle').checked = false; change('use-subscription-toggle');
  assert.equal(el('ai-auth-method').value, 'apiKey');
  assert.equal(el('ai-provider-select').value, 'local');
  assert.equal(el('ai-provider-select').disabled, false);
  assert.equal(el('ai-key-row').hidden, false);
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
  el('ai-key-input').value = 'test-key';
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

test('legacy subscriptions migrate without exposing bridge tokens and the method is hidden in Chrome mode', async t => {
  const { values, el, change } = await setup(t, { connectionMode: 'obsidian', chromeAiProvider: 'codex-cli', chromeAiApiKey: 'pairing-token', chromeAiModel: 'custom-model' });
  assert.equal(el('ai-provider-select').value, 'openai'); assert.equal(values.chromeAiProvider, 'openai');
  assert.equal(el('ai-auth-method').value, 'subscription'); assert.equal(el('ai-key-input').value, '');
  assert.equal([...el('ai-provider-select').options].some(o => o.value.endsWith('-cli')), false);
  el('use-chrome-btn').click(); await flush();
  assert.equal(el('ai-auth-row').hidden, true); assert.equal(el('ai-auth-method').value, 'apiKey');
  assert.equal(values.chromeAiApiKey, '');
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

test('Obsidian AI card displays the actual configuration and colors matching and mismatching settings', async t => {
  const { win, el, change } = await setup(t, { connectionMode: 'obsidian', chromeAiApiKey: 'key' });
  const aiConfig = { aiProvider: 'gemini', aiModel: 'gemini-default', chunkWindowChars: 30000, contentAnalysisMaxTokens: 16384 };
  win.chrome.runtime.sendMessage = async message => ({ aiConfig, matches: message.settings.chromeAiModel === aiConfig.aiModel });
  await win.refreshObsidianAiConfig();
  assert.match(el('obsidian-ai-config-text').textContent, /Google Gemini.*gemini-default.*30000.*16384/);
  assert.equal(el('obsidian-ai-config').classList.contains('matched'), true);
  assert.equal(el('obsidian-ai-match-status').textContent, 'Matches Chrome settings');
  el('ai-model-select').value = 'gemini-pro';
  change('ai-model-select');
  await win.refreshObsidianAiConfig();
  assert.equal(el('obsidian-ai-config').classList.contains('mismatched'), true);
  assert.equal(el('obsidian-ai-match-status').textContent, 'Does not match Chrome settings');
  assert.match(el('obsidian-ai-config-text').textContent, /gemini-default/, 'Displays Obsidian’s actual model, not the unsaved Chrome model');
  win.chrome.runtime.sendMessage = async () => ({ error: 'Offline' });
  await win.refreshObsidianAiConfig();
  assert.equal(el('obsidian-ai-config').classList.contains('hidden'), true, 'Offline reads cannot retain a misleading green match');
});


test('Chrome hides every subscription control when Obsidian has not enabled the feature', async t => {
  const { el } = await setup(t, { connectionMode: 'obsidian', subscriptionFeatureEnabled: false, chromeAiProvider: 'gemini', chromeAiApiKey: 'api-key' });
  assert.equal(el('ai-auth-method').querySelector('option[value="subscription"]').disabled, true);
  assert.equal(el('ai-auth-row').hidden, true);
  assert.equal(el('subscription-card').hidden, true);
  assert.equal(el('subscription-guide'), null);
  assert.equal(el('subscription-login'), null);
});


test('Obsidian opt-in exposes the Chrome connection selector with no account setup instructions', async t => {
  const { el } = await setup(t, { connectionMode: 'obsidian', subscriptionFeatureEnabled: true, chromeAiProvider: 'gemini', chromeAiApiKey: 'key' });
  assert.equal(el('ai-auth-row').hidden, false);
  assert.equal(el('ai-auth-method').querySelector('option[value="subscription"]').disabled, false);
  assert.equal(el('subscription-guide'), null);
  assert.equal(el('subscription-install'), null);
  assert.equal(el('subscription-login'), null);
  assert.equal(el('subscription-test'), null);
});


test('disabled saved account config shows an API draft without changing saved execution or losing preferences', async t => {
  const { el, values } = await setup(t, { connectionMode: 'obsidian', subscriptionFeatureEnabled: false, chromeAiProvider: 'gemini', chromeAiAuthMethod: 'subscription', chromeAiModel: 'cli-custom', aiProfiles: { 'gemini:apiKey': { apiKey: 'retained-key', model: 'gemini-pro' } } });
  assert.equal(el('ai-auth-row').hidden, true);
  assert.equal(el('ai-key-row').hidden, false);
  assert.equal(el('ai-key-input').value, 'retained-key');
  assert.equal(values.chromeAiAuthMethod, 'subscription');
  assert.equal(el('subscription-card').hidden, true);
});

test('Chrome refreshes AI readiness after Obsidian setup completes without overlapping slow checks', async t => {
  const { win, el, change } = await setup(t, { connectionMode: 'obsidian', subscriptionFeatureEnabled: true, chromeAiProvider: 'gemini', chromeAiApiKey: 'key' });
  Object.defineProperty(win.document, 'hidden', { value: false });
  const timers = new Map(); let timerId = 0;
  win.setTimeout = (callback, delay) => { timers.set(++timerId, { callback, delay }); return timerId; };
  win.clearTimeout = id => timers.delete(id);
  let finishStatus, checks = 0;
  win.chrome.runtime.sendMessage = async message => {
    if (message.operation === 'status') {
      checks++;
      return new Promise(resolve => { finishStatus = resolve; });
    }
    return { models: ['auto', 'account-model'] };
  };
  el('ai-auth-method').value = 'subscription'; change('ai-auth-method');
  assert.equal(checks, 1);
  assert.equal([...timers.values()].filter(timer => timer.delay === 5000).length, 0);
  finishStatus({ state: 'error' }); await flush();
  assert.match(el('subscription-status').textContent, /unavailable/i);
  const poll = [...timers.values()].find(timer => timer.delay === 5000);
  assert(poll); poll.callback();
  assert.equal(checks, 2);
  finishStatus({ state: 'ready' }); await flush();
  assert.equal(el('subscription-status').textContent, 'Connected');
  assert.equal(el('subscription-card').dataset.state, 'ready');
  assert.equal(el('ai-model-select').value, 'auto');
});

test('concurrent health checks share parsed data without losing the enabled connection selector', async t => {
  const { win, el } = await setup(t, { connectionMode: 'obsidian', subscriptionFeatureEnabled: true });
  let finish, calls = 0;
  win.fetch = async () => { calls++; return new Promise(resolve => { finish = resolve; }); };
  const first = win.refreshSubscriptionAccess();
  const second = win.refreshSubscriptionAccess();
  finish(new Response(JSON.stringify({ subscriptionEnabled: true }), { status: 200 }));
  await Promise.all([first, second]);
  assert.equal(calls, 1);
  assert.equal(el('ai-auth-row').hidden, false);
  assert.equal(el('ai-auth-method').querySelector('option[value="subscription"]').disabled, false);
});
