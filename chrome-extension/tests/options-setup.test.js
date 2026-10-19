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
  win.structuredClone=structuredClone;
  const values = { ...initial };
  const requests = [];
  const creditCalls = [];
  const messages = [];
  const state = initial.obsidianExecutionState || {instanceId:'vault-test',protocolVersion:3,revision:1,transition:'ready',subscriptionAvailable:initial.subscriptionFeatureEnabled!==false,mode:initial.chromeAiAuthMethod==='subscription' && initial.subscriptionFeatureEnabled!==false?'subscription':'apiKey',subscription:{provider:'google',model:'auto'}};
  if(initial.connectionMode==='obsidian')values.obsidianExecutionState=state;
  win.chrome = {
    storage: { local: { get: async keys => keys == null ? ({ ...values }) : Object.fromEntries(keys.map(key => [key, values[key]])), set: async data => Object.assign(values, data) } },
    runtime: { sendMessage: async message => { messages.push(message);
      if(message.action==='get-chrome-cache-info')return {count:values.chromeTabCache?.length||0,limit:values.chromeCacheTabLimit??100};
      if(message.action==='set-chrome-cache-limit'){values.chromeCacheTabLimit=message.limit;values.chromeTabCache=(values.chromeTabCache||[]).slice(0,message.limit);return {success:true,count:values.chromeTabCache.length,limit:message.limit};}
      if(message.action==='clear-chrome-cache'){values.chromeTabCache=[];return {success:true,count:0,limit:values.chromeCacheTabLimit??100};}
      if(message.action==='set-execution-mode') {state.mode=message.mode;state.revision++;values.obsidianExecutionState={...state};return {state:{...state}};}
      if(message.action==='sync-obsidian-api')return {synced:true};
      if(message.action==='get-obsidian-ai-config')return {state:{...state},matches:true,aiConfig:{aiAuthMethod:state.mode,aiProvider:state.mode==='chatgpt'?'openai':state.mode==='subscription'?state.subscription.provider:values.chromeAiProvider||'google',aiModel:state.mode==='chatgpt'?state.chatgpt?.model:state.mode==='subscription'?state.subscription.model:values.chromeAiModel||'gemini-default',chunkWindowChars:values.chunkWindowChars||30000,contentAnalysisMaxTokens:values.contentAnalysisMaxTokens||16384}};
      if(message.action==='chatgpt-control') return {state:{...state}, ...(message.operation==='models'?{models:[{slug:'chatgpt-model',displayName:'ChatGPT model'}]}:{})};
      if(message.operation==='status')return {state:'unverified',model:state.subscription.model};
      return {}; }, getManifest: () => ({ version: '1.0' }) },
    tabs: { create: () => {} },
  };
  win.fetch = async url => { requests.push(url); if (String(url).endsWith('/health')) return { ok: true, json: async () => ({ subscriptionEnabled: initial.subscriptionFeatureEnabled !== false }) }; throw new Error('Offline'); };
  win.eval(fs.readFileSync(require.resolve('../dist/ai-core.js'), 'utf8'));
  const core = win.NutEggAI;
  win.NutEggAI = {
    normalizeAISettings: core.normalizeAISettings,
    restoreChromeApiPreferences:core.restoreChromeApiPreferences,
    reduceSharedExecutionState:core.reduceSharedExecutionState,
    selectEffectiveExecution:core.selectEffectiveExecution,
    supportsSubscription: core.supportsSubscription,
    PROVIDER_CATALOG: {
      google: { label: 'Google Gemini', models: ['gemini-default', 'gemini-pro'], defaultModel: 'gemini-default', keyPlaceholder: 'AIza...' },
      openai: { label: 'OpenAI', models: ['openai-default'], defaultModel: 'openai-default' },
      local: { label: 'Local', models: ['local-model'], defaultModel: 'local-model' },
    },
    PROMPTS: { contentAnalysis: 'Default prompt', followUp: 'Default follow-up', chromeKnowledge: 'Default Chrome knowledge prompt' },
    checkCreditAI: async settings => {
      creditCalls.push(settings);
      if (credit.throwError) throw new Error(credit.throwError);
      return { providerLabel: 'Local', statusText: 'Ready', ...credit };
    },
  };
  for (const file of ['i18n', 'popup/state/settings-state', 'options/options', 'tooltips']) {
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
  assert.equal(el('ai-provider-select').value, 'google');
  assert.equal(el('ai-model-select').value, 'gemini-default');
  assert.equal(el('section-mindmap').checked, true);
  assert.equal(el('section-knowledge').checked, false);
  assert.equal(el('section-discussion').checked, false);
  assert.deepEqual(requests, []);
  assert.deepEqual(values, {});
});

test('subscription stays visible with hover, click, and keyboard hints until Using Obsidian is selected', async t => {
  const { win, el, change, messages, values } = await setup(t);
  const row = el('ai-auth-row');
  const toggle = el('use-subscription-toggle');
  const label = row.querySelector('label');
  const hint = el('nutegg-tooltip');
  assert.equal(row.hidden, false);
  assert.equal(toggle.disabled, true);
  assert.equal(row.getAttribute('aria-disabled'), 'true');
  assert.equal(row.tabIndex, 0);
  label.dispatchEvent(new win.MouseEvent('pointerover', { bubbles: true }));
  assert.equal(hint.hidden, false);
  assert.match(hint.textContent, /Turn on “Connect Obsidian” to use subscriptions/);
  label.dispatchEvent(new win.MouseEvent('pointerdown', { bubbles: true }));
  assert.equal(hint.hidden, true);
  label.click();
  assert.equal(hint.hidden, false, 'attempting to click the disabled switch shows its hint');
  assert.equal(toggle.checked, false);
  row.focus();
  assert.equal(hint.hidden, false);
  assert.equal(row.getAttribute('aria-describedby'), 'nutegg-tooltip');
  toggle.checked = true;
  change('use-subscription-toggle');
  await flush();
  assert.equal(toggle.checked, false, 'a disabled change cannot select subscription');
  assert.equal(messages.some(message => message.action === 'set-execution-mode'), false);
  assert.deepEqual(values, {});

  el('obsidian-mode-enabled').checked = true;
  change('obsidian-mode-enabled');
  await flush();
  assert.equal(row.hidden, false);
  assert.equal(toggle.disabled, false);
  assert.equal(row.getAttribute('aria-disabled'), 'false');
  assert.equal(row.hasAttribute('data-tooltip'), false);
  assert.equal(hint.hidden, true);

  el('obsidian-mode-enabled').checked = false;
  change('obsidian-mode-enabled');
  await flush();
  assert.equal(row.hidden, false);
  assert.equal(toggle.disabled, true);
  label.click();
  assert.match(hint.textContent, /Turn on “Connect Obsidian”/);
});

test('subscription shares its provider and preserves API credentials while hiding Chrome model edits', async t => {
  const { values, el, change, creditCalls, messages } = await setup(t, { connectionMode: 'obsidian', chromeAiProvider: 'google', chromeAiApiKey: 'cloud-key', chromeAiModel: 'gemini-pro' });
  el('use-subscription-toggle').checked = true; change('use-subscription-toggle'); await flush();
  assert.equal(el('ai-key-input').value, 'cloud-key');
  assert.equal(el('ai-key-row').hidden, true);
  assert.equal(el('ai-model-row').hidden, true);
  assert.equal(el('ai-save-btn').hidden, true);
  assert.equal(el('ai-provider-select').disabled, true);
  assert.equal(el('subscription-model-badge').textContent, 'auto');
  el('use-subscription-toggle').checked = false; change('use-subscription-toggle'); await flush();
  assert.equal(el('ai-key-row').hidden, false);
  assert.equal(el('ai-model-row').hidden, false);
  assert.equal(el('ai-save-btn').hidden, false);
  assert.equal(el('ai-provider-select').disabled, false);
  assert.equal(el('ai-key-input').value, 'cloud-key');
  assert.equal(el('ai-model-select').value, 'gemini-pro');
});

test('switching to non-subscription provider in apiKey mode keeps use-subscription enabled and toggling switches to subscription', async t => {
  const { values, el, change } = await setup(t, { connectionMode: 'obsidian', subscriptionFeatureEnabled: true, chromeAiProvider: 'google', chromeAiApiKey: 'gemini-key' });
  el('ai-provider-select').value = 'local'; change('ai-provider-select');
  assert.equal(el('use-subscription-toggle').disabled, false);
  assert.equal(el('use-subscription-toggle').checked, false);
  el('ai-test-result').textContent = 'Saved. ✅ Connected: DeepSeek · Balance: ¥8.23';
  el('ai-test-result').className = 'test-result ok';
  el('use-subscription-toggle').checked = true; change('use-subscription-toggle'); await flush();
  assert.equal(el('ai-test-result').textContent, '');
  assert.equal(el('ai-test-result').classList.contains('hidden'), true);
  assert.equal(el('use-subscription-toggle').checked, true);
  assert.equal(el('ai-provider-select').disabled, true);
  assert.equal(el('ai-key-row').hidden, true);
  el('use-subscription-toggle').checked = false; change('use-subscription-toggle'); await flush();
  assert.equal(el('use-subscription-toggle').checked, false);
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
  assert.equal(values.chromeAiProvider, 'google');
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

test('opening or saving Chrome settings performs read-only refreshes without changing mode', async t => {
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
  const aiConfig = { aiProvider: 'google', aiModel: 'gemini-default', chunkWindowChars: 30000, contentAnalysisMaxTokens: 16384 };
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


test('Chrome keeps the subscription switch visible but disabled when Obsidian has not enabled the feature', async t => {
  const { el } = await setup(t, { connectionMode: 'obsidian', subscriptionFeatureEnabled: false, chromeAiProvider: 'google', chromeAiApiKey: 'api-key' });
  assert.equal(el('use-subscription-toggle').disabled, true);
  assert.equal(el('ai-auth-row').hidden, false);
  assert.equal(el('subscription-card').hidden, true);
  assert.equal(el('subscription-guide'), null);
  assert.equal(el('subscription-login'), null);
});


test('Obsidian opt-in exposes the Chrome connection selector with no account setup instructions', async t => {
  const { el } = await setup(t, { connectionMode: 'obsidian', subscriptionFeatureEnabled: true, chromeAiProvider: 'google', chromeAiApiKey: 'key' });
  assert.equal(el('ai-auth-row').hidden, false);
  assert.equal(el('use-subscription-toggle').disabled, false);
  assert.equal(el('subscription-guide'), null);
  assert.equal(el('subscription-install'), null);
  assert.equal(el('subscription-login'), null);
  assert.equal(el('subscription-test'), null);
});


test('disabling the feature restores the saved API configuration and disables the switch', async t => {
  const { el, values } = await setup(t, { connectionMode: 'obsidian', subscriptionFeatureEnabled: false, chromeAiProvider: 'google', chromeAiAuthMethod: 'subscription', chromeAiModel: 'cli-custom', aiProfiles: { 'google:apiKey': { apiKey: 'retained-key', model: 'gemini-pro' } } });
  assert.equal(el('ai-auth-row').hidden, false);
  assert.equal(el('ai-key-row').hidden, false);
  assert.equal(el('ai-key-input').value, 'retained-key');
  assert.equal(values.obsidianExecutionState.mode, 'apiKey');
  assert.equal(el('ai-model-select').value, 'gemini-pro');
  assert.equal(el('subscription-card').hidden, true);
});

test('API settings survive a different subscription provider and reopening settings', async t => {
  const first = await setup(t, { connectionMode: 'obsidian', chromeAiProvider: 'openai', chromeAiApiKey: 'original-key', chromeAiModel: 'custom-api-model', chromeAiEndpoint: 'https://api.example/v1' });
  first.win.chrome.runtime.sendMessage = async message => message.action === 'get-obsidian-ai-config'
    ? {state:{...first.values.obsidianExecutionState,mode:'subscription',subscription:{provider:'google',model:'custom-cli-model'}},aiConfig:{aiProvider:'google',aiAuthMethod:'subscription',aiModel:'custom-cli-model'},matches:true} : message.action==='set-execution-mode'? {state:{...first.values.obsidianExecutionState,mode:message.mode,subscription:{provider:'google',model:'custom-cli-model'}}}:{};
  first.el('use-subscription-toggle').checked = true; first.change('use-subscription-toggle');
  await flush(); await flush();
  assert.equal(first.values.chromeAiProvider, 'openai');
  assert.equal(first.values.chromeAiApiKey, 'original-key');
  assert.equal(first.el('subscription-provider-badge').textContent, 'Google Gemini');
  assert.equal(first.el('subscription-model-badge').textContent, 'custom-cli-model');
  const reopened = await setup(t, first.values);
  reopened.el('use-subscription-toggle').checked = false; reopened.change('use-subscription-toggle');
  await flush(); await flush();
  assert.equal(reopened.values.chromeAiProvider, 'openai');
  assert.equal(reopened.values.chromeAiApiKey, 'original-key');
  assert.equal(reopened.values.chromeAiModel, 'custom-api-model');
  assert.equal(reopened.values.chromeAiEndpoint, 'https://api.example/v1');
});

test('an offline or failed health check never restores API billing', async t => {
  const app = await setup(t, { connectionMode: 'obsidian', chromeAiAuthMethod: 'subscription', chromeAiProvider: 'google', chromeAiModel: 'cli-custom' });
  for (const response of [() => { throw new Error('offline'); }, () => ({ error:'Offline' })]) {
    app.win.chrome.runtime.sendMessage = async () => response();
    await app.win.eval('refreshSubscriptionAccess()');
    assert.equal(app.values.obsidianExecutionState.mode, 'subscription');
    assert.equal(app.el('ai-key-row').hidden, true);
  }
});

test('Chrome refreshes AI readiness after Obsidian setup completes without overlapping slow checks', async t => {
  const { win, el, change } = await setup(t, { connectionMode: 'obsidian', subscriptionFeatureEnabled: true, chromeAiProvider: 'google', chromeAiApiKey: 'key' });
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
    if(message.action==='get-chrome-cache-info')return {count:values.chromeTabCache?.length||0,limit:values.chromeCacheTabLimit??100};
      if(message.action==='set-chrome-cache-limit'){values.chromeCacheTabLimit=message.limit;values.chromeTabCache=(values.chromeTabCache||[]).slice(0,message.limit);return {success:true,count:values.chromeTabCache.length,limit:message.limit};}
      if(message.action==='clear-chrome-cache'){values.chromeTabCache=[];return {success:true,count:0,limit:values.chromeCacheTabLimit??100};}
      if(message.action==='set-execution-mode')return {state:{...win.chromeSharedState,mode:'subscription',subscriptionAvailable:true,subscription:{provider:'google',model:'auto'},transition:'ready'}};
    return {};
  };
  el('use-subscription-toggle').checked = true; change('use-subscription-toggle'); await flush();
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

test('authoritative state reads preserve the enabled connection selector without direct health mutation', async t => {
  const {win,el,values}=await setup(t,{connectionMode:'obsidian',subscriptionFeatureEnabled:true});
  await Promise.all([win.refreshSubscriptionAccess(),win.refreshSubscriptionAccess()]);
  assert.equal(el('ai-auth-row').hidden,false);
  assert.equal(el('use-subscription-toggle').disabled,false);
  assert.equal(values.obsidianExecutionState.mode,'apiKey');
});

test('save and continue button is removed on chrome AI setting when using subscription', async t => {
  const { el, change } = await setup(t, { connectionMode: 'obsidian', chromeAiAuthMethod: 'subscription' });
  assert.equal(el('ai-save-btn').hidden, true);
  assert.equal(el('ai-save-btn').classList.contains('hidden'), true);
  el('use-subscription-toggle').checked = false; change('use-subscription-toggle'); await flush();
  assert.equal(el('ai-save-btn').hidden, false);
  assert.equal(el('ai-save-btn').classList.contains('hidden'), false);
  el('use-subscription-toggle').checked = true; change('use-subscription-toggle'); await flush();
  assert.equal(el('ai-save-btn').hidden, true);
  assert.equal(el('ai-save-btn').classList.contains('hidden'), true);
});

test('chromeKnowledge prompt option is selectable, editable, and resets to default in settings', async t => {
  const { win, el, change, values } = await setup(t, { chromeAiApiKey: 'test-key' });
  const select = el('ai-prompt-select');
  const textarea = el('ai-prompt-textarea');
  const resetBtn = el('ai-prompt-reset-btn');

  // Verify chromeKnowledge option exists
  const chromeOpt = select.querySelector('option[value="chromeKnowledge"]');
  assert.ok(chromeOpt, 'chromeKnowledge option exists in select');

  // Select chromeKnowledge
  select.value = 'chromeKnowledge';
  change('ai-prompt-select');
  assert.equal(textarea.value, 'Default Chrome knowledge prompt');

  // Edit prompt
  textarea.value = 'My custom Chrome knowledge prompt';
  textarea.dispatchEvent(new win.Event('input', { bubbles: true }));

  // Save AI preferences
  el('ai-advanced-save-btn').click();
  await flush();
  assert.equal(values.chromeAiPromptOverrides?.chromeKnowledge, 'My custom Chrome knowledge prompt');

  // Reset to default
  resetBtn.click();
  await flush();
  assert.equal(textarea.value, 'Default Chrome knowledge prompt');
  assert.equal(values.chromeAiPromptOverrides?.chromeKnowledge, undefined);
});


test('Save and continue explicitly syncs Obsidian AI in connected mode; advanced save stays local', async t => {
  const app = await setup(t, {connectionMode: 'obsidian', chromeAiProvider: 'google', chromeAiModel: 'gemini-pro', chromeAiApiKey: 'profile-private'});
  app.messages.length = 0;
  app.el('ai-config-section').dispatchEvent(new app.win.Event('submit', {bubbles: true, cancelable: true}));
  await flush();
  const initialization = app.messages.filter(message => message.action === 'sync-obsidian-api');
  assert.equal(initialization.length, 1);
  assert.deepEqual(Object.keys(initialization[0]), ['action'], 'options must not supply arbitrary initialization credentials');
  app.messages.length = 0;
  app.el('ai-advanced-save-btn').click(); await flush();
  assert.equal(app.messages.some(message => message.action === 'sync-obsidian-api'), false);
  app.el('use-chrome-btn').click(); await flush(); app.messages.length = 0;
  app.el('ai-config-section').dispatchEvent(new app.win.Event('submit', {bubbles: true, cancelable: true})); await flush();
  assert.equal(app.messages.some(message => message.action === 'sync-obsidian-api'), false);
});

test('API edits survive leaving subscription, standalone edits, and rejoining either shared mode', async t => {
  for (const saveDraft of [false, true]) {
    for (const sharedMode of ['apiKey', 'subscription']) {
      const { win, el, change, values } = await setup(t, {
        connectionMode: 'obsidian', chromeAiProvider: 'google', chromeAiModel: 'gemini-pro', chromeAiApiKey: 'old-key',
      });
      el('use-subscription-toggle').checked = true;
      change('use-subscription-toggle'); await flush();
      el('use-chrome-btn').click(); await flush();
      el('ai-provider-select').value = 'openai'; change('ai-provider-select');
      el('ai-key-input').value = 'new-key';
      el('ai-model-select').value = '__custom__'; change('ai-model-select');
      el('ai-model-custom').value = 'new-custom-model';
      el('chunk-window-chars').value = '24000';
      el('max-completion-tokens').value = '2048';
      if (saveDraft) { el('ai-save-btn').click(); await flush(); }
      if (sharedMode === 'apiKey') await win.chrome.runtime.sendMessage({ action: 'set-execution-mode', mode: 'apiKey' });
      el('obsidian-mode-enabled').checked = true; change('obsidian-mode-enabled'); await flush();
      if (sharedMode === 'subscription') {
        el('use-subscription-toggle').checked = false; change('use-subscription-toggle'); await flush();
      }
      assert.equal(el('ai-provider-select').value, 'openai');
      assert.equal(el('ai-key-input').value, 'new-key');
      assert.equal(el('ai-model-custom').value, 'new-custom-model');
      assert.equal(el('chunk-window-chars').value, '24000');
      assert.equal(el('max-completion-tokens').value, '2048');
      el('ai-save-btn').click(); await flush();
      assert.equal(values.chromeAiProvider, 'openai');
      assert.equal(values.chromeAiApiKey, 'new-key');
      assert.equal(values.chromeAiModel, 'new-custom-model');
    }
  }
});

test('Save and continue reports a failed Obsidian sync even when the Chrome connection check succeeds', async t => {
  const { win, el, values } = await setup(t, { connectionMode: 'obsidian', chromeAiApiKey: 'profile-key' });
  const send = win.chrome.runtime.sendMessage;
  win.chrome.runtime.sendMessage = async message => message.action === 'sync-obsidian-api' ? { synced: false } : send(message);
  el('ai-save-btn').click(); await flush();
  assert.equal(values.chromeAiApiKey, 'profile-key');
  assert.match(el('ai-test-result').textContent, /AI connection unavailable/);
  assert.equal(el('ai-test-result').classList.contains('error'), true);
});

test('dialogue enhance (optimizeForConversation) checkbox saves to storage and restores on reload', async t => {
  // 1. Initial state defaults to checked
  const app1 = await setup(t, {});
  const cb1 = app1.el('optimize-conversation');
  assert.equal(cb1.checked, true);

  // 2. Uncheck and verify storage update
  cb1.checked = false;
  cb1.dispatchEvent(new app1.win.Event('change', { bubbles: true }));
  await flush();
  assert.equal(app1.values.optimizeForConversation, false);

  // 3. Reload with optimizeForConversation: false in storage
  const app2 = await setup(t, { optimizeForConversation: false });
  const cb2 = app2.el('optimize-conversation');
  assert.equal(cb2.checked, false, 'Checkbox must stay unchecked when restored from storage');
});


test('ChatGPT is available with CLI disabled, preserves API settings, and hides API controls', async t => {
  const state = {
    instanceId: 'vault-test',
    protocolVersion: 3,
    revision: 1,
    transition: 'ready',
    subscriptionAvailable: false,
    mode: 'chatgpt',
    subscription: { provider: 'openai', model: 'codex-model' },
    chatgpt: {
      available: true,
      state: 'ready',
      revision: 1,
      accountLabel: 'person@example.com',
      model: 'chatgpt-model',
    },
  };
  const { el, values, messages, change } = await setup(t, {
    connectionMode: 'obsidian',
    obsidianExecutionState: state,
    chromeAiProvider: 'google',
    chromeAiApiKey: 'saved-key',
    chromeAiModel: 'gemini-pro',
  });
  await flush();
  assert.equal(el('use-subscription-toggle').checked, true);
  assert.equal(el('ai-auth-row').hidden, false);
  assert.equal(el('chatgpt-card').hidden, false);
  assert.equal(el('subscription-card').hidden, true);
  assert.equal(el('ai-key-row').hidden, true);
  assert.equal(el('ai-save-btn').hidden, true);
  assert.match(el('chatgpt-status').textContent, /person@example.com/);
  assert.equal(el('chatgpt-model-badge').textContent, 'chatgpt-model');
  assert.equal(el('chatgpt-model'), null);
  assert.equal(el('chatgpt-refresh'), null);
  assert.equal(values.chromeAiApiKey, 'saved-key');
  assert.ok(!messages.some(message => message.action === 'chatgpt-control' && message.operation === 'models'));
  el('use-subscription-toggle').checked = false;
  change('use-subscription-toggle');
  await flush();
  await flush();
  assert.equal(el('ai-key-input').value, 'saved-key');
  assert.equal(el('ai-model-select').value, 'gemini-pro');
});

test('signed-out ChatGPT remains selected and Chrome-only mode has no ChatGPT option', async t => {
  const state = {
    instanceId: 'vault-test',
    protocolVersion: 3,
    revision: 1,
    transition: 'ready',
    subscriptionAvailable: false,
    mode: 'chatgpt',
    subscription: { provider: 'openai', model: 'auto' },
    chatgpt: { available: true, state: 'signed_out', revision: 1, accountLabel: '', model: '' },
  };
  const { el, values, messages } = await setup(t, {
    connectionMode: 'obsidian',
    obsidianExecutionState: state,
    chromeAiApiKey: 'saved-key',
  });
  assert.equal(el('use-subscription-toggle').checked, true);
  assert.equal(el('chatgpt-signin').hidden, false);
  assert.equal(el('chatgpt-model-badge').textContent, '—');
  assert.equal(el('chatgpt-model'), null);
  assert.equal(el('chatgpt-refresh'), null);
  assert.ok(!messages.some(message => message.action === 'set-execution-mode'));
  assert.equal(values.chromeAiApiKey, 'saved-key');
  const chromeOnly = await setup(t, {
    connectionMode: 'chrome',
    obsidianExecutionState: state,
    chromeAiApiKey: 'saved-key',
  });
  assert.equal(chromeOnly.el('chatgpt-card').hidden, true);
  assert.equal(chromeOnly.el('ai-auth-row').hidden, false);
  assert.equal(chromeOnly.el('use-subscription-toggle').checked, false);
});

test('cache settings use worker commands and ignore an obsolete settings response', async t => {
  const { win, el, values } = await setup(t, { chromeTabCache: [{ url: 'https://example.test/old' }] });
  const pending = [];
  win.chrome.runtime.sendMessage = message => new Promise(resolve => pending.push({ message, resolve }));
  win.chrome.storage.local.set = async data => { assert.equal('chromeTabCache' in data, false, 'only the worker may write the cache'); Object.assign(values, data); };
  el('chrome-cache-limit-input').value = '1'; el('chrome-cache-save-btn').click();
  el('chrome-cache-clear-btn').click();
  assert.deepEqual(pending.map(p => p.message.action), ['set-chrome-cache-limit', 'clear-chrome-cache']);
  pending[1].resolve({ success: true, count: 0, limit: 1 }); await flush();
  pending[0].resolve({ success: true, count: 1, limit: 1 }); await flush();
  assert.match(el('chrome-cache-count').textContent, /0/);
});

test('cache settings show a failure instead of claiming a failed clear succeeded', async t => {
  const { win, el } = await setup(t, { chromeTabCache: [{ url: 'https://example.test/old' }] });
  win.chrome.runtime.sendMessage = async () => ({ error: 'Storage unavailable' });
  el('chrome-cache-clear-btn').click(); await flush();
  assert.equal(el('chrome-cache-status').classList.contains('error'), true);
  assert.match(el('chrome-cache-count').textContent, /1/);
});

test('local base URL and protocol survive provider changes and are saved together', async t => {
  const { el, change, values, creditCalls } = await setup(t, {
    chromeAiProvider: 'local', chromeAiModel: 'installed-model',
    chromeAiEndpoint: 'http://localhost:11434', localApiType: 'ollama',
  });
  assert.equal(el('ai-local-api').value, 'ollama');
  el('ai-provider-select').value = 'openai';
  change('ai-provider-select');
  el('ai-provider-select').value = 'local';
  change('ai-provider-select');
  assert.equal(el('ai-local-api').value, 'ollama');
  assert.equal(el('ai-local-endpoint').value, 'http://localhost:11434');
  el('ai-save-btn').click();
  await flush();
  assert.equal(values.localApiType, 'ollama');
  assert.equal(values.chromeApiConfig.localApiType, 'ollama');
  assert.equal(creditCalls[0].localApiType, 'ollama');
});
