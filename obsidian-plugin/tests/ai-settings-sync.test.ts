import { test } from 'node:test';
import assert from 'node:assert/strict';
import NutEggPlugin from '../src/main';
import { DEFAULT_SETTINGS } from '../src/settings';
import { Setting } from 'obsidian';
import { JSDOM } from 'jsdom';
import { NutEggServer } from '../src/server';
import { randomUUID } from 'node:crypto';
import { ExecutionCoordinator } from '../src/execution-coordinator';
import { isAIConfigured, aiConnectionLabel } from '../../shared/src/catalog';

test('plugin unload releases ChatGPT ownership before waiting for server shutdown', async () => {
  const plugin = new NutEggPlugin();
  const events: string[] = [];
  let release!: () => void;
  plugin.chatgpt = { dispose: () => events.push('chatgpt-disposed') } as any;
  plugin.server = { stop: () => new Promise<void>(resolve => { release = resolve; }) } as any;
  plugin.subscriptions = { dispose: async () => events.push('cli-disposed') } as any;
  plugin.db = { close: () => events.push('db-closed') } as any;
  const unloading = plugin.onunload();
  assert.deepEqual(events, ['chatgpt-disposed']);
  release();
  await unloading;
  assert.deepEqual(events, ['chatgpt-disposed', 'cli-disposed', 'db-closed']);
});

test('unavailable ChatGPT stays labeled as ChatGPT and signing in is neutral', async () => {
  const plugin = new NutEggPlugin();
  plugin.settings = { ...DEFAULT_SETTINGS, aiAuthMethod: 'chatgpt' };
  const classes = new Set<string>();
  const bar: any = { text: '', attrs: {} as Record<string, string>, style: {},
    setText(text: string) { this.text = text; },
    setAttribute(key: string, value: string) { this.attrs[key] = value; },
    addClass(value: string) { classes.add(value); },
    removeClass(value: string) { classes.delete(value); },
  };
  plugin.creditStatusBarItem = bar;
  plugin.aiClient = { checkCredit: async () => ({}) } as any;
  await plugin.updateCreditStatusBar();
  assert.match(bar.text, /ChatGPT sign-in/);
  assert.doesNotMatch(bar.text, /Setup AI Key/);
  assert.match(bar.attrs['aria-label'], /credential storage/i);
  plugin.chatgpt = { status: () => ({ state: 'signing_in' }) } as any;
  await plugin.updateCreditStatusBar();
  assert.equal(classes.has('mod-warning'), false);
  assert.match(bar.attrs['aria-label'], /Signing in/);
});

test('native ChatGPT selection preserves API and Codex profiles across persistence and sign-out', async () => {
  const plugin = new NutEggPlugin();
  plugin.settings = {
    ...DEFAULT_SETTINGS,
    subscriptionEnabled: false,
    nativeApiConfig: { aiProvider: 'deepseek', aiModel: 'native-model', aiApiKey: '' },
    subscriptionSelection: { provider: 'openai', model: 'saved-codex-model' },
  };
  let status: any = { available: true, state: 'ready', revision: 1, accountLabel: 'Test', model: 'chatgpt-model' };
  plugin.chatgpt = { status: () => status } as any;
  const writes: any[] = [];
  plugin.saveData = async value => {
    writes.push(structuredClone(value));
  };
  plugin.updateCreditStatusBar = async () => {};
  const state = ExecutionCoordinator.initial(undefined, false, plugin.settings.subscriptionSelection);
  state.mode = 'chatgpt';
  state.chatgpt = status;
  await plugin.persistExecutionState(state);
  assert.equal(plugin.settings.aiAuthMethod, 'chatgpt');
  assert.equal(plugin.getNativeSettings().aiModel, 'chatgpt-model');
  assert.equal(isAIConfigured(plugin.getNativeSettings()), true);
  assert.equal(plugin.settings.nativeApiConfig?.aiModel, 'native-model');
  assert.equal(plugin.settings.subscriptionSelection?.model, 'saved-codex-model');
  assert.equal(plugin.settings.chatgptModel, 'chatgpt-model');
  await plugin.persistExecutionState({ ...state, chatgpt: { ...status, available: false, model: '' } });
  assert.equal(plugin.settings.chatgptModel, 'chatgpt-model', 'storage failure must not erase the saved selection');
  status = { ...status, state: 'signed_out', revision: 2, model: '' };
  await plugin.persistExecutionState({ ...state, chatgpt: status });
  assert.equal(plugin.settings.aiAuthMethod, 'chatgpt');
  assert.equal(isAIConfigured(plugin.getNativeSettings()), false);
  assert.equal(plugin.settings.nativeApiConfig?.aiModel, 'native-model');
  await plugin.persistExecutionState({ ...state, mode: 'apiKey', chatgpt: status });
  assert.equal(plugin.getNativeSettings().aiModel, 'native-model');
  assert.doesNotMatch(JSON.stringify(writes), /accessToken|refreshToken/);
  assert.equal(aiConnectionLabel('openai', 'subscription'), 'Codex CLI');
  assert.equal(aiConnectionLabel('openai', 'chatgpt'), 'ChatGPT sign-in');
  assert.equal(aiConnectionLabel('openai', 'apiKey'), 'OpenAI');
});

test('a delayed balance response from the previous provider cannot overwrite the synced provider', async () => {
  const plugin = new NutEggPlugin();
  plugin.settings = { ...DEFAULT_SETTINGS, aiProvider: 'deepseek', aiApiKey: 'key' };
  const bar: any = { text: '', attrs: {} as Record<string, string>,
    setText(text: string) { this.text = text; },
    setAttribute(key: string, value: string) { this.attrs[key] = value; },
    removeClass() {}, addClass() {}, style: {},
  };
  plugin.creditStatusBarItem = bar;
  const pending: Array<(credit: any) => void> = [];
  plugin.aiClient = { checkCredit: () => new Promise(resolve => pending.push(resolve)) } as any;
  const old = plugin.updateCreditStatusBar();
  Object.assign(plugin.settings, { aiProvider: 'google', aiAuthMethod: 'subscription', subscriptionEnabled: true });
  const current = plugin.updateCreditStatusBar();
  pending[1]({ hasBalance: false, subscriptionState: 'ready', providerLabel: 'Google Gemini', statusText: 'Connected' });
  await current;
  pending[0]({ hasBalance: true, providerLabel: 'DeepSeek', balanceFormatted: '¥8.33', statusText: 'Available' });
  await old;
  assert.equal(bar.text, 'Google Gemini · Subscription');
  assert.match(bar.attrs['aria-label'], /Connected/);
});

import { NutEggSettingTab } from '../src/settings';

function connectionTestDom(t: any) {
  const dom = new JSDOM('<main></main>');
  const proto = dom.window.HTMLElement.prototype as any;
  proto.empty = function () { this.replaceChildren(); };
  proto.setText = function (value: string) { this.textContent = value; };
  proto.createEl = function (tag: string, options: any = {}) {
    const element = dom.window.document.createElement(tag);
    element.textContent = options.text || '';
    if (options.cls) element.className = options.cls;
    for (const [key, value] of Object.entries(options.attr || {})) element.setAttribute(key, String(value));
    this.appendChild(element);
    return element;
  };
  proto.createDiv = function (options: any) { return this.createEl('div', options); };
  proto.createSpan = function (options: any) { return this.createEl('span', options); };
  t.after(() => dom.window.close());
  return dom;
}

test('API connection box only shows Chrome profiles without subscription controls', t => {
  const dom = connectionTestDom(t);
  let editableControls = 0, selectors = 0, refresh!: () => void;
  for (const method of ['addText', 'addButton', 'addToggle'] as const) {
    t.mock.method(Setting.prototype, method, function () { editableControls++; return this; });
  }
  t.mock.method(Setting.prototype, 'addDropdown', function () { selectors++; return this; });
  t.mock.method(globalThis, 'setInterval', (callback: () => void) => {
    refresh = callback;
    return { unref() {} } as any;
  });
  const plugin = new NutEggPlugin();
  plugin.settings = { ...DEFAULT_SETTINGS, aiProvider: 'anthropic', aiModel: 'native-only-model' };
  let profiles: any[] = [
    { displayName: 'Work Chrome', provider: 'openai', model: 'chrome-openai-model' },
    { displayName: 'Personal Chrome', provider: 'google', model: 'chrome-gemini-model' },
  ];
  plugin.server = { execution: { state: { mode: 'apiKey' }, clients: () => profiles } } as any;
  const tab = new NutEggSettingTab({} as any, plugin);
  t.after(() => tab.hide());
  const container = dom.window.document.querySelector('main')!;
  const before = structuredClone(plugin.settings);
  const box = (tab as any).displayAIConnections(container);
  assert.equal(box.dataset.mode, 'apiKey');
  assert.match(box.textContent, /OpenAI.*chrome-openai-model/);
  assert.match(box.textContent, /Google.*chrome-gemini-model/);
  assert.doesNotMatch(box.textContent, /native-only-model/);
  assert.equal(editableControls, 0);
  assert.equal(selectors, 0);
  assert.deepEqual(plugin.settings, before);
  profiles = [{ displayName: 'Work Chrome', provider: 'deepseek', model: 'new-chrome-model' }];
  refresh();
  assert.match(box.textContent, /DeepSeek.*new-chrome-model/);
  assert.doesNotMatch(box.textContent, /chrome-openai-model|chrome-gemini-model/);
  profiles = [];
  refresh();
  assert.match(box.textContent, /Waiting for Chrome/);
  assert.doesNotMatch(box.textContent, /native-only-model|new-chrome-model/);
});

test('subscription connection choices hide during API execution and stale selectors cannot override Chrome', async t => {
  const dom = connectionTestDom(t);
  const choices: any[] = [];
  t.mock.method(Setting.prototype, 'addDropdown', function (configure: any) {
    const dropdown = { options: new Map<string, string>(), value: '', change: undefined as any,
      selectEl: dom.window.document.createElement('select'),
      addOption(value: string, label: string) { this.options.set(value, label); return this; },
      setValue(value: string) { this.value = value; return this; },
      onChange(callback: any) { this.change = callback; return this; },
    };
    configure(dropdown); choices.push(dropdown); return this;
  });
  const plugin = new NutEggPlugin();
  plugin.settings = { ...DEFAULT_SETTINGS, subscriptionEnabled: true, aiAuthMethod: 'subscription',
    nativeApiConfig: { aiProvider: 'deepseek', aiModel: 'saved-api-model' },
    subscriptionSelection: { provider: 'openai', model: 'saved-codex-model' } };
  plugin.saveData = async () => {};
  plugin.subscriptions = { cancelWork: async () => {} } as any;
  plugin.server = new NutEggServer(plugin, 0);
  const tab = new NutEggSettingTab({} as any, plugin);
  const container = dom.window.document.querySelector('main')!;
  t.after(() => tab.hide());
  const box = (tab as any).displayAIConnections(container);
  const first = choices[0];
  assert.equal(box.dataset.mode, 'subscription');
  assert.equal(first.value, 'openai');
  assert.deepEqual([...first.options], [
    ['chatgpt', 'ChatGPT sign-in'], ['openai', 'Codex CLI'], ['google', 'Google'], ['anthropic', 'Claude'],
  ]);
  await first.change('anthropic');
  assert.equal(plugin.server.execution.state.mode, 'subscription');
  assert.equal(plugin.settings.aiProvider, 'anthropic');
  assert.equal(plugin.settings.aiModel, 'auto');
  ++(tab as any).chatgptView;
  (tab as any).displayAIConnections(container);
  assert.equal(choices[1].value, 'anthropic');
  await first.change('google');
  assert.equal(plugin.settings.aiProvider, 'anthropic', 'detached controls cannot switch the connection');
  await choices[1].change('chatgpt');
  assert.equal(plugin.settings.aiAuthMethod, 'chatgpt');
  assert.equal(plugin.settings.nativeApiConfig?.aiModel, 'saved-api-model');
  assert.deepEqual(plugin.settings.subscriptionSelection, { provider: 'anthropic', model: 'auto' });
  await plugin.server.execution.change(plugin.server.execution.state.revision, randomUUID(), { mode: 'apiKey' });
  await choices[1].change('openai');
  assert.equal(plugin.server.execution.state.mode, 'apiKey', 'a Chrome mode switch invalidates subscription controls immediately');
  container.replaceChildren();
  (tab as any).displayAIConnections(container);
  assert.equal(choices.length, 2, 'API mode hides the connection selector');
  assert.equal(container.querySelector('[data-mode="apiKey"]')?.textContent, 'Waiting for Chrome');
  assert.equal(plugin.server.execution.state.subscriptionAvailable, true, 'Chrome can still turn on subscriptions');
});

test('provider switching cannot restart a detached settings card and strand the new status', async t => {
  const dom = new JSDOM('<main></main>');
  const proto = dom.window.HTMLElement.prototype as any;
  proto.empty = function () { this.replaceChildren(); };
  proto.setText = function (value: string) { this.textContent = value; };
  proto.createEl = function (tag: string, options: any = {}) {
    const element = dom.window.document.createElement(tag);
    element.textContent = options.text || '';
    if (options.cls) element.className = options.cls;
    this.appendChild(element); return element;
  };
  proto.createDiv = function (options: any) { return this.createEl('div', options); };
  const dropdowns: any[] = [];
  t.mock.method(Setting.prototype, 'addDropdown', function (configure: any) {
    const component = { options: [] as string[], value: '', change: undefined as any,
      addOption(value: string) { this.options.push(value); return this; },
      setValue(value: string) { this.value = value; return this; },
      getValue() { return this.value; },
      onChange(fn: any) { this.change = fn; return this; } };
    configure(component); dropdowns.push(component); return this;
  });
  const plugin = new NutEggPlugin();
  plugin.settings = { ...DEFAULT_SETTINGS, subscriptionEnabled: true, aiProvider: 'google', aiAuthMethod: 'subscription', aiModel: 'auto' };
  const pending: Array<{provider: string; resolve: (value: any) => void}> = [];
  plugin.subscriptions = { cancelWork: async () => {}, models: async () => ['auto'],
    status: (provider: string) => new Promise(resolve => pending.push({provider, resolve})) } as any;
  plugin.server = new NutEggServer(plugin, 0);
  const tab = new NutEggSettingTab({} as any, plugin);
  const container = dom.window.document.querySelector('main')!;
  t.after(() => { tab.hide(); dom.window.close(); });
  const render = () => { container.replaceChildren(); ++(tab as any).chatgptView; (tab as any).displayAIConnections(container); (tab as any).displaySubscriptionSetup(container); };
  // Execution persistence rebuilds settings before the onChange save returns.
  plugin.saveSettings = async () => { if (plugin.settings.executionState?.transition === 'ready') render(); };
  render();
  pending[0].resolve({state: 'ready', message: 'Gemini ready'});
  await new Promise(resolve => setImmediate(resolve));
  const provider = dropdowns.find(item => item.options.includes('google'));
  await provider.change('openai');
  assert.equal(pending.length, 2, 'only the replacement view starts the Codex check');
  assert.equal(pending[1].provider, 'openai');
  pending[1].resolve({state: 'ready', message: 'Codex ready'});
  await new Promise(resolve => setImmediate(resolve));
  assert.doesNotMatch(container.textContent!, /Checking/);
  assert.equal((tab as any).accountState, 'ready');
  // Old controls cannot switch the current provider again.
  await provider.change('google');
  assert.equal(plugin.settings.aiProvider, 'openai');
  const model = dropdowns.filter(item => item.options.includes('__custom__')).at(-1);
  plugin.server.execution.state.mode = 'apiKey';
  plugin.settings.aiAuthMethod = 'apiKey';
  await model.change('stale-subscription-model');
  assert.equal(plugin.settings.aiAuthMethod, 'apiKey');
  assert.notEqual(plugin.settings.aiModel, 'stale-subscription-model');
});

test('execution persistence starts settings probes only after provider cleanup completes', async () => {
  const plugin = new NutEggPlugin();
  plugin.settings = { ...DEFAULT_SETTINGS };
  let displays = 0, refreshes = 0, creditChecks = 0;
  plugin.settingsTab = { display() { displays++; }, refreshAISettings() { refreshes++; } } as any;
  plugin.updateCreditStatusBar = async () => { creditChecks++; };
  const state: any = { instanceId: 'test', protocolVersion: 2, revision: 2, mode: 'subscription',
    subscriptionAvailable: true, subscription: {provider: 'openai', model: 'auto'}, transition: 'changing' };
  await plugin.persistExecutionState(state);
  assert.equal(displays + refreshes + creditChecks, 0);
  await plugin.persistExecutionState({...state, transition: 'ready'});
  assert.equal(displays, 1);
  assert.equal(creditChecks, 1);
});

test('read-only AI settings display received Chrome values and update after sync', () => {
  const plugin = new NutEggPlugin();
  plugin.settings = { ...DEFAULT_SETTINGS, aiProvider: 'deepseek', aiModel: 'deepseek-chat',
    chunkWindowChars: 24000, contentAnalysisMaxTokens: 8192 };
  const tab = new NutEggSettingTab({} as any, plugin);
  const row = () => ({ name: '', desc: '', settingEl: { hidden: false },
    setName(name: string) { this.name = name; return this; },
    setDesc(desc: string) { this.desc = desc; return this; },
  });
  const summary = row(), chunk = row(), tokens = row();
  Object.assign(tab, { aiConfigSummary: summary, aiChunkWindow: chunk, aiMaxTokens: tokens });
  tab.refreshAISettings();
  assert.equal(summary.name, 'DeepSeek · API key · deepseek-chat');
  assert.equal(chunk.name, 'General chunk window size: 24000');
  assert.equal(tokens.name, 'Max completion tokens: 8192');
  assert.equal(chunk.desc, '');
  assert.equal(tokens.desc, '');
  Object.assign(plugin.settings, { aiProvider: 'local', aiModel: 'local-model',
    chunkWindowChars: 12000, contentAnalysisMaxTokens: 4096, localEndpoint: 'http://localhost:1234/v1' });
  tab.refreshAISettings();
  assert.match(summary.name, /local-model/);
  assert.equal(chunk.name, 'General chunk window size: 12000');
  assert.equal(tokens.name, 'Max completion tokens: 4096');
});

test('model settings show credit, refresh it, and ignore results for the previous configuration', async () => {
  const plugin = new NutEggPlugin();
  plugin.settings = { ...DEFAULT_SETTINGS, aiProvider: 'deepseek', aiApiKey: 'key' };
  const pending: Array<(credit: any) => void> = [];
  plugin.aiClient = { checkCredit: () => new Promise(resolve => pending.push(resolve)) } as any;
  const tab = new NutEggSettingTab({} as any, plugin);
  const button: any = { text: '', tooltip: '', disabled: false,
    setButtonText(text: string) { this.text = text; return this; },
    setTooltip(text: string) { this.tooltip = text; return this; },
    setDisabled(disabled: boolean) { this.disabled = disabled; return this; },
  };
  (tab as any).aiCreditButton = button;
  const initial = tab.refreshAICredit();
  assert.equal(button.disabled, true);
  pending[0]({ balanceFormatted: '¥8.33', providerLabel: 'DeepSeek', statusText: 'Available' });
  await initial;
  assert.equal(button.text, '🪙 ¥8.33');
  assert.equal(button.disabled, false);
  const old = tab.refreshAICredit();
  Object.assign(plugin.settings, { aiProvider: 'google', aiAuthMethod: 'subscription', subscriptionEnabled: true });
  const latest = tab.refreshAICredit();
  pending[2]({ subscriptionState: 'ready', providerLabel: 'Google Gemini', statusText: 'Connected · Quota managed by CLI' });
  await latest;
  pending[1]({ balanceFormatted: '¥8.30', providerLabel: 'DeepSeek', statusText: 'Available' });
  await old;
  assert.equal(button.text, 'Google Gemini · Subscription');
  assert.match(button.tooltip, /Google Gemini.*Refresh/);
  assert.equal(button.disabled, false);
});


test('legacy disabled availability migrates without replacing saved execution choices', async () => {
  for (const mode of ['apiKey', 'subscription', 'chatgpt'] as const) {
    const plugin = new NutEggPlugin();
    plugin.loadData = async () => ({ subscriptionEnabled: false, aiAuthMethod: mode,
      executionState: { mode, subscriptionAvailable: false },
      aiProvider: 'openai', aiModel: 'saved-model', subscriptionSelection: { provider: 'openai', model: 'saved-model' } });
    plugin.saveData = async () => {};
    await plugin.loadSettings();
    assert.equal(plugin.settings.subscriptionEnabled, true);
    assert.equal(plugin.settings.aiAuthMethod, mode);
    plugin.server = new NutEggServer(plugin, 0);
    assert.equal(plugin.server.execution.snapshot().subscriptionAvailable, true);
    assert.equal(plugin.server.execution.snapshot().mode, mode);
    assert.deepEqual(plugin.server.execution.snapshot().subscription, { provider: 'openai', model: 'saved-model' });
  }
});

test('Chrome can switch execution while subscription availability stays on', async () => {
  const plugin = new NutEggPlugin();
  plugin.settings = { ...DEFAULT_SETTINGS, subscriptionEnabled: false, aiAuthMethod: 'apiKey' };
  plugin.saveData = async () => {};
  plugin.subscriptions = { cancelWork: async () => {} } as any;
  plugin.server = new NutEggServer(plugin, 0);
  await plugin.server.execution.change(plugin.server.execution.state.revision, randomUUID(), {
    mode: 'subscription', subscription: { provider: 'google', model: 'cli-custom' },
  });
  await plugin.server.execution.change(plugin.server.execution.state.revision, randomUUID(), { mode: 'apiKey' });
  assert.equal(plugin.server.execution.state.mode, 'apiKey');
  assert.equal(plugin.server.execution.state.subscriptionAvailable, true);
  assert.equal(plugin.settings.subscriptionEnabled, true);
  assert.deepEqual(plugin.settings.subscriptionSelection, { provider: 'google', model: 'cli-custom' });
});

test('subscription tests show progress and preserve success or failure after status refresh', async t => {
  const dom = new JSDOM('<body><main></main></body>');
  const proto = dom.window.HTMLElement.prototype as any;
  proto.empty = function () { this.replaceChildren(); };
  proto.setText = function (value: string) { this.textContent = value; };
  proto.createEl = function (tag: string, options: any = {}) {
    const element = dom.window.document.createElement(tag);
    element.textContent = options.text || '';
    if (options.cls) element.className = options.cls;
    for (const [name, value] of Object.entries(options.attr || {})) element.setAttribute(name, String(value));
    this.appendChild(element); return element;
  };
  proto.createDiv = function (options: any) { return this.createEl('div', options); };
  const buttons: any[] = [];
  const setting = Setting.prototype as any;
  t.mock.method(setting, 'setName', function () { return this; });
  t.mock.method(setting, 'setDesc', function () { return this; });
  t.mock.method(setting, 'addDropdown', function (configure: any) {
    const dropdown = { addOption() { return this; }, setValue() { return this; }, onChange() { return this; } };
    configure(dropdown); return this;
  });
  t.mock.method(setting, 'addButton', function (configure: any) {
    const button = { text: '', disabled: false, click: undefined as any,
      setButtonText(text: string) { this.text = text; return this; },
      setDisabled(value: boolean) { this.disabled = value; return this; },
      onClick(callback: any) { this.click = callback; return this; } };
    configure(button); buttons.push(button); return this;
  });
  const plugin = new NutEggPlugin();
  plugin.settings = { ...DEFAULT_SETTINGS, subscriptionEnabled: true, aiProvider: 'google', aiAuthMethod: 'subscription', aiModel: '' };
  let resolveTest: (value: any) => void, rejectTest: (error: Error) => void;
  let model = '';
  plugin.subscriptions = { status: async () => ({ state: 'unverified', message: 'Needs verification' }),
    test: async (_provider: string, selected: string) => {
      model = selected;
      return new Promise((resolve, reject) => { resolveTest = resolve; rejectTest = reject; });
    } } as any;
  const tab = new NutEggSettingTab({} as any, plugin);
  t.after(() => { tab.hide(); dom.window.close(); });
  const container = dom.window.document.querySelector('main')!;
  (tab as any).displaySubscriptionSetup(container);
  await new Promise(resolve => setImmediate(resolve));
  let testButton = buttons.find(button => button.text === 'Authorize subscription');
  const pending = testButton.click();
  assert.match(container.textContent!, /Testing AI connection.*three minutes/);
  assert.equal(testButton.disabled, true);
  assert.equal(model, 'auto');
  resolveTest!({ state: 'ready' }); await pending;
  assert.match(container.textContent!, /AI connection test passed/);
  testButton = buttons.filter(button => button.text === 'Authorize subscription').at(-1);
  const failed = testButton.click(); rejectTest!(new Error('Selected model is unavailable. Choose another model.')); await failed;
  assert.match(container.textContent!, /Selected model is unavailable.*Choose another model/);
  assert.doesNotMatch(container.textContent!, /test passed/);
  testButton = buttons.filter(button => button.text === 'Authorize subscription').at(-1);
  const stale = testButton.click();
  Object.assign(plugin.settings, { aiAuthMethod: 'apiKey', aiProvider: 'openai', aiModel: 'api-model', aiApiKey: 'api-secret' });
  resolveTest!({ state: 'ready' }); await stale;
  assert.equal(plugin.settings.aiAuthMethod, 'apiKey');
  assert.equal(plugin.settings.aiProvider, 'openai');
  assert.equal(plugin.settings.aiModel, 'api-model');
});

test('settings hide subscription controls during API execution without an availability toggle', async t => {
  const dom = new JSDOM('<body><main></main></body>');
  const proto = dom.window.HTMLElement.prototype as any;
  proto.empty = function () { this.replaceChildren(); };
  proto.setText = function (value: string) { this.textContent = value; };
  proto.createEl = function (tag: string, options: any = {}) {
    const element = dom.window.document.createElement(tag);
    element.textContent = options.text || '';
    if (options.cls) element.className = options.cls;
    this.appendChild(element); return element;
  };
  proto.createDiv = function (options: any) { return this.createEl('div', options); };
  const names: string[] = [], toggles: string[] = [];
  const setting = Setting.prototype as any;
  t.mock.method(setting, 'setName', function (name: string) { this.name = name; names.push(name); return this; });
  t.mock.method(setting, 'setDesc', function () { return this; });
  for (const method of ['addButton', 'addText', 'addDropdown', 'addToggle']) {
    t.mock.method(setting, method, function (configure: any) {
      if (method === 'addToggle') toggles.push(this.name);
      const component: any = new Proxy({ inputEl: dom.window.document.createElement('input'), selectEl: dom.window.document.createElement('select') },
        { get(target, key) { return key in target ? target[key] : () => component; } });
      configure(component); return this;
    });
  }
  const plugin = new NutEggPlugin();
  plugin.settings = { ...DEFAULT_SETTINGS, aiAuthMethod: 'apiKey', aiProvider: 'openai', aiApiKey: 'api-secret', aiModel: 'api-model', developerMode: true };
  plugin.aiClient = { checkCredit: async () => ({ statusText: 'Ready' }) } as any;
  let connection = { listening: true, recentClients: 2, pendingApprovals: 0, conflictingMethods: true };
  let runtime = { active: true, requests: 0, logins: 0, models: 0 };
  plugin.app = {} as any;
  plugin.saveSettings=async()=>{};
  plugin.server = { getConnectionStatus: () => connection, execution: {sessions:new Map(),clients:()=>[]} } as any;
  plugin.subscriptions = { status: async () => ({ state: 'unverified' }), resolve: async () => '/cli', getRuntimeStatus: () => runtime } as any;
  const tab = new NutEggSettingTab({secretStorage:undefined} as any, plugin);
  (tab as any).app={};
  (tab as any).containerEl = dom.window.document.querySelector('main');
  t.after(() => { tab.hide(); dom.window.close(); });
  for (const enabled of [false, true]) {
    plugin.settings.subscriptionEnabled = enabled;
    names.length = toggles.length = 0; tab.display();
    await new Promise(resolve => setImmediate(resolve));
    assert.doesNotMatch(names.join(' ') + (tab as any).containerEl.textContent, /subscription mode|experimental AI connections/i);
    assert.deepEqual(toggles, ['Developer mode']);
    const container = (tab as any).containerEl as HTMLElement;
    assert.ok(container.querySelector('.nutegg-ai-connection-box[data-mode="apiKey"]'));
    assert.equal(container.querySelector('.nutegg-subscription-card'), null);
    for (const provider of ['Codex CLI', 'Claude', 'Google'])
      assert.ok(names.includes(`${provider} · Subscription CLI executable`), `${provider} path stays visible in API mode`);
    assert.equal(container.querySelector('.nutegg-native-ai-section'), null, 'API editing belongs only in Chrome');
    assert.equal(container.querySelector('.nutegg-model-config-section > h3')?.textContent, 'AI Model Configuration');
    assert.equal(container.querySelector('input[type="password"]'), null);
    assert.ok(!names.includes('AI provider') && !names.includes('API Key'));
    const headings = [...container.querySelectorAll('.nutegg-settings-section > h3')].map(heading => heading.textContent);
    assert.ok(headings.includes('Vault Paths'), 'vault paths have a padded section wrapper');
    assert.equal(container.querySelectorAll(':scope > h3').length, 0, 'section headings cannot remain outside padding');
    const rows = (tab as any).connectionRows;
    assert.equal(rows.local.textContent, 'Listening');
    assert.equal(rows.chrome.textContent, '2 recently active');
    assert.equal(rows.bridge.textContent, 'API key');
    assert.equal(rows.warning.hidden, true);
  }
  plugin.settings.aiAuthMethod = 'subscription';
  names.length = toggles.length = 0; tab.display();
  await new Promise(resolve => setImmediate(resolve));
  assert.match((tab as any).containerEl.textContent, /Codex CLI/);
  assert.ok((tab as any).containerEl.querySelector('.nutegg-ai-connection-box[data-mode="subscription"] > .nutegg-subscription-card'));
  assert.deepEqual(toggles, ['Developer mode']);
  const rows = (tab as any).connectionRows;
  assert.equal(rows.bridge.textContent, 'Authorize subscription in Obsidian');
  runtime.requests = 2;
  (tab as any).refreshConnectionStatus();
  assert.equal(rows.bridge.textContent, '2 active/queued requests');
  runtime.requests = 0; runtime.logins = 1;
  (tab as any).refreshConnectionStatus();
  assert.equal(rows.bridge.textContent, 'Authorizing');
  runtime.logins = 0; (tab as any).accountState = 'ready';
  (tab as any).refreshConnectionStatus();
  assert.equal(rows.bridge.textContent, 'Idle');
  connection = { listening: false, recentClients: 0, pendingApprovals: 1, conflictingMethods: false };
  (tab as any).refreshConnectionStatus();
  assert.equal(rows.local.textContent, 'Off');
  assert.equal(rows.chrome.textContent, 'Approval pending');
  assert.equal(rows.warning.hidden, true);
});

test('subscription models render Auto/custom before status resolves, including a detached settings panel', async t => {
  const dom = new JSDOM('<body><main></main></body>');
  const proto = dom.window.HTMLElement.prototype as any;
  proto.empty = function () { this.replaceChildren(); };
  proto.setText = function (value: string) { this.textContent = value; };
  proto.createEl = function (tag: string, options: any = {}) {
    const element = dom.window.document.createElement(tag);
    element.textContent = options.text || '';
    if (options.cls) element.className = options.cls;
    for (const [name, value] of Object.entries(options.attr || {})) element.setAttribute(name, String(value));
    this.appendChild(element); return element;
  };
  proto.createDiv = function (options: any) { return this.createEl('div', options); };
  const capturedOptions: string[] = [];
  const selectedValues: string[] = [];
  const setting = Setting.prototype as any;
  t.mock.method(setting, 'setName', function () { return this; });
  t.mock.method(setting, 'setDesc', function () { return this; });
  t.mock.method(setting, 'addDropdown', function (configure: any) {
    const dropdown = {
      selectEl: dom.window.document.createElement('select'),
      addOption(val: string) { capturedOptions.push(val); return this; },
      setValue(value: string) { selectedValues.push(value); return this; },
      getValue() { return 'auto'; },
      onChange() { return this; },
    };
    configure(dropdown); return this;
  });
  t.mock.method(setting, 'addButton', function (configure: any) {
    const button = { text: '', disabled: false, click: undefined as any,
      setButtonText(text: string) { this.text = text; return this; },
      setDisabled(value: boolean) { this.disabled = value; return this; },
      onClick(callback: any) { this.click = callback; return this; } };
    configure(button); return this;
  });
  t.mock.method(setting, 'addText', function (configure: any) {
    const text = { setPlaceholder() { return this; }, setValue() { return this; }, onChange() { return this; } };
    configure(text); return this;
  });

  const plugin = new NutEggPlugin();
  plugin.settings = { ...DEFAULT_SETTINGS, subscriptionEnabled: true, aiProvider: 'google', aiAuthMethod: 'subscription' };
  let resolveStatus!: (value: any) => void;
  const statusPromise = new Promise<any>(resolve => { resolveStatus = resolve; });
  let resolveModels: (val: string[]) => void;
  const modelsPromise = new Promise<string[]>(resolve => { resolveModels = resolve; });
  plugin.subscriptions = {
    status: async () => statusPromise,
    models: async () => modelsPromise,
  } as any;

  const tab = new NutEggSettingTab({} as any, plugin);
  t.after(() => { tab.hide(); dom.window.close(); });
  const container = dom.window.document.querySelector('main')!;
  container.remove(); // Obsidian can build the settings pane before attaching it.
  (tab as any).displaySubscriptionSetup(container);

  // Default models should be rendered immediately without waiting for modelsPromise
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(capturedOptions.includes('auto'));
  assert.ok(capturedOptions.includes('__custom__'));
  assert.ok(selectedValues.includes('auto'), 'first setup selects Auto before status or model discovery completes');
  assert.equal(container.querySelector('.nutegg-model-refresh-hint')?.getAttribute('data-state'), 'loading');
  assert.ok(!capturedOptions.includes('gemini-2.5-flash'));
  assert.ok(!capturedOptions.includes('gemini-2.5-pro'));

  // Background models resolve
  resolveModels!(['auto', 'gemini-custom-model']);
  await modelsPromise;
  await new Promise(resolve => setImmediate(resolve));

  assert.deepEqual(plugin.settings.subscriptionModels?.google, ['auto', 'gemini-custom-model']);
  assert.equal(container.querySelector('.nutegg-model-refresh-hint')?.getAttribute('data-state'), 'ready');
  resolveStatus({state: 'unverified', message: 'Sign-in needs verification'});
  await statusPromise;
  await new Promise(resolve => setImmediate(resolve));
  assert.doesNotMatch(container.textContent!, /Checking/);
  assert.equal((tab as any).accountState, 'unverified');
});

test('legacy mirrored API key becomes an inactive SecretStorage candidate and migration repeats safely',async()=>{
  const plugin=new NutEggPlugin();const secrets=new Map<string,string>();let stored:any={...DEFAULT_SETTINGS,aiProvider:'openai',aiApiKey:'legacy-private',aiModel:'legacy-model'};
  plugin.manifest={id:'nutegg'} as any;plugin.app={secretStorage:{setSecret:(id:string,key:string)=>secrets.set(id,key),getSecret:(id:string)=>secrets.get(id)}} as any;
  plugin.loadData=async()=>structuredClone(stored);plugin.saveData=async data=>{stored=structuredClone(data);};
  await plugin.loadSettings();assert.equal(plugin.getNativeSettings().aiApiKey,'');assert.equal(stored.aiApiKey,'');assert.equal(secrets.get(plugin.settings.legacyNativeApiCandidate!.keyRef),'legacy-private');assert.ok(!JSON.stringify(stored).includes('legacy-private'));
  const candidate=structuredClone(plugin.settings.legacyNativeApiCandidate);await plugin.loadSettings();assert.deepEqual(plugin.settings.legacyNativeApiCandidate,candidate);
  await plugin.saveNativeConfig(candidate!.settings,secrets.get(candidate!.keyRef));assert.equal(plugin.getNativeSettings().aiApiKey,'legacy-private');assert.ok(!JSON.stringify(stored).includes('legacy-private'));
});

test('old Obsidian preserves the original inactive legacy file while connected execution remains available',async()=>{
 const plugin=new NutEggPlugin();let stored:any={...DEFAULT_SETTINGS,aiApiKey:'legacy-private'};const renamed:any[]=[];
 plugin.manifest={id:'nutegg',dir:'.obsidian/plugins/nutegg'} as any;plugin.app={vault:{configDir:'.obsidian',adapter:{exists:async()=>false,rename:async(a:string,b:string)=>renamed.push([a,b])}}} as any;
 plugin.loadData=async()=>stored;plugin.saveData=async data=>{stored=structuredClone(data);};
 await plugin.loadSettings();assert.equal(renamed.length,1);assert.equal(plugin.getNativeSettings().aiApiKey,'');assert.match(plugin.settings.legacyNativeApiCandidate!.keyRef,/legacy-file:/);assert.ok(!JSON.stringify(stored).includes('legacy-private'));
 await assert.rejects(plugin.saveNativeConfig({aiProvider:'openai'},'new-key'),/1.11.4/);
});

test('connected profile settings show Chrome values independently of native settings and refresh live', t => {
  const dom = new JSDOM('<body><main></main></body>');
  const proto = dom.window.HTMLElement.prototype as any;
  proto.empty = function () { this.replaceChildren(); };
  proto.createEl = function (tag: string, options: any = {}) {
    const element = dom.window.document.createElement(tag);
    element.textContent = options.text || '';
    if (options.cls) element.className = options.cls;
    this.appendChild(element); return element;
  };
  proto.createDiv = function (options: any) { return this.createEl('div', options); };
  let repaint: () => void = () => {};
  t.mock.method(globalThis, 'setInterval', ((callback: () => void) => { repaint = callback; return { unref() {} }; }) as any);
  t.mock.method(globalThis, 'clearInterval', (() => {}) as any);
  const plugin = new NutEggPlugin();
  plugin.settings = { ...DEFAULT_SETTINGS, nativeApiConfig: { aiProvider: 'anthropic', aiModel: 'native-model' } };
  const profiles = [
    { displayName: 'Chrome A', provider: 'deepseek', model: 'deepseek-chat', chunkWindowChars: 24000, contentAnalysisMaxTokens: 8192 },
    { displayName: 'Chrome B', provider: 'google', model: 'gemini-profile-b', chunkWindowChars: 12000, contentAnalysisMaxTokens: 4096 },
  ];
  plugin.server = { execution: { clients: () => profiles } } as any;
  const tab = new NutEggSettingTab({} as any, plugin);
  t.after(() => { tab.hide(); dom.window.close(); });
  const container = dom.window.document.querySelector('main')!;
  (tab as any).displayConnectedProfiles(container);
  assert.match(container.textContent!, /Chrome ADeepSeekdeepseek-chat/);
  assert.match(container.textContent!, /Chrome BGooglegemini-profile-b/);
  assert.doesNotMatch(container.textContent!, /24000|8192|12000|4096/);
  assert.doesNotMatch(container.textContent!, /native-model|subscription/i);
  profiles[0].model = 'updated-chrome-model'; profiles[0].chunkWindowChars = 32000;
  repaint();
  assert.match(container.textContent!, /updated-chrome-model/);
  assert.doesNotMatch(container.textContent!, /deepseek-chat/);
  profiles.length = 0; repaint();
  assert.match(container.textContent!, /Waiting for Chrome/);
  assert.equal(plugin.settings.nativeApiConfig!.aiModel, 'native-model');
});

test('explicit Chrome saves replace the native SecretStorage account in order', async () => {
  const plugin = new NutEggPlugin();
  const secrets = new Map<string, string>(); const saved: any[] = [];
  plugin.app = {secretStorage: {getSecret: (ref: string) => secrets.get(ref), setSecret: (ref: string, key: string) => secrets.set(ref, key)}} as any;
  plugin.settings = {...DEFAULT_SETTINGS, aiApiKey: '', nativeApiConfig: {aiProvider: 'anthropic', aiModel: 'old-model'}};
  plugin.saveData = async data => { saved.push(structuredClone(data)); };
  const results = await Promise.all([
    plugin.syncNativeApi({aiProvider: 'deepseek', aiModel: 'deepseek-chat', chunkWindowChars: 24000}, 'chrome-A-secret'),
    plugin.syncNativeApi({aiProvider: 'google', aiModel: 'profile-B'}, 'chrome-B-secret'),
  ]);
  assert.deepEqual(results, [true, true]);
  assert.equal(plugin.getNativeSettings().aiApiKey, 'chrome-B-secret');
  assert.equal(plugin.settings.nativeApiConfig!.aiProvider, 'google');
  assert.equal(plugin.settings.nativeApiConfig!.chunkWindowChars, 24000);
  assert.doesNotMatch(JSON.stringify(saved), /chrome-A-secret|chrome-B-secret/);
  assert.equal(await plugin.syncNativeApi({aiProvider: 'openai', aiModel: 'other'}, 'replacement-secret'), true);
  assert.equal(secrets.get(plugin.settings.nativeApiKeyRef!), 'replacement-secret');
});

test('initializing a native account without SecretStorage does not persist a plaintext key', async () => {
  const plugin = new NutEggPlugin(); plugin.app = {} as any;
  plugin.settings = {...DEFAULT_SETTINGS, aiApiKey: ''};
  let saved = false; plugin.saveData = async () => { saved = true; };
  await assert.rejects(plugin.syncNativeApi({aiProvider: 'deepseek', aiModel: 'deepseek-chat'}, 'private-key'), /1.11.4/);
  assert.equal(saved, false);
  assert.equal(plugin.settings.aiApiKey, '');
});

test('keyless local sync replaces the active cloud account without needing SecretStorage', async () => {
  const plugin = new NutEggPlugin();
  plugin.app = {} as any;
  plugin.settings = { ...DEFAULT_SETTINGS, aiApiKey: '', nativeApiKeyRef: 'previous-secret',
    nativeApiConfig: { aiProvider: 'openai', aiModel: 'cloud-model' } };
  let persisted: any;
  plugin.saveData = async data => { persisted = structuredClone(data); };
  assert.equal(await plugin.syncNativeApi({ aiProvider: 'local', aiModel: 'installed-model', localEndpoint: 'http://localhost:11434', localApiType: 'ollama' }, ''), true);
  assert.equal(plugin.getNativeSettings().aiProvider, 'local');
  assert.equal(plugin.getNativeSettings().aiModel, 'installed-model');
  assert.equal(plugin.getNativeSettings().aiApiKey, '');
  assert.equal(plugin.settings.nativeApiKeyRef, undefined);
  assert.equal(persisted.nativeApiKeyRef, undefined);
});


test('a stalled credit check times out, enables refresh, and ignores its late result', async t => {
  t.mock.timers.enable({apis: ['setTimeout']});
  const plugin = new NutEggPlugin();
  plugin.settings = {...DEFAULT_SETTINGS, aiProvider: 'deepseek', aiApiKey: 'key'};
  let finish!: (value: any) => void;
  plugin.aiClient = {checkCredit: () => new Promise(resolve => {finish = resolve;})} as any;
  const tab = new NutEggSettingTab({} as any, plugin);
  const button = {text: '', tooltip: '', disabled: false,
    setButtonText(value: string) {this.text = value; return this;},
    setTooltip(value: string) {this.tooltip = value; return this;},
    setDisabled(value: boolean) {this.disabled = value; return this;}};
  (tab as any).aiCreditButton = button;
  const check = tab.refreshAICredit();
  assert.equal(button.disabled, true);
  t.mock.timers.tick(15000);
  await check;
  assert.equal(button.disabled, false);
  assert.doesNotMatch(button.text, /checking/i);
  assert.match(button.tooltip, /timed out/);
  finish({statusText: 'Available', balanceFormatted: '$999', providerLabel: 'Old account'});
  await new Promise(resolve => queueMicrotask(resolve));
  assert.doesNotMatch(button.text, /999/);
});

test('syncOutputLanguage updates settings, saves, and refreshes the settings tab', async () => {
  const plugin = new NutEggPlugin();
  plugin.settings = { ...DEFAULT_SETTINGS, outputLanguage: 'Chinese' };
  let saved = 0;
  plugin.saveSettings = async () => { saved++; };
  let displays = 0;
  plugin.settingsTab = { display() { displays++; } } as any;

  const server = new NutEggServer(plugin, 27123);
  server.syncOutputLanguage('Japanese');
  assert.equal(plugin.settings.outputLanguage, 'Japanese');
  assert.equal(saved, 1);
  assert.equal(displays, 1);

  // Identical value does not re-trigger save or display
  server.syncOutputLanguage('Japanese');
  assert.equal(saved, 1);
  assert.equal(displays, 1);

  // Empty or whitespace-only ignored
  server.syncOutputLanguage('   ');
  assert.equal(plugin.settings.outputLanguage, 'Japanese');
  assert.equal(saved, 1);
});



test('unavailable ChatGPT exposes its startup diagnostic in settings and connected Chrome state', t => {
  const dom = connectionTestDom(t);
  const plugin = new NutEggPlugin();
  plugin.settings = { ...DEFAULT_SETTINGS, aiAuthMethod: 'chatgpt' };
  plugin.chatgptStartupError = 'EPERM / fsync';
  plugin.server = new NutEggServer(plugin, 27123);
  const tab = new NutEggSettingTab({} as any, plugin);
  t.after(() => tab.hide());
  const container = dom.window.document.querySelector('main')!;
  (tab as any).displayChatGPT(container);
  assert.match(container.textContent!, /Startup diagnostic: EPERM \/ fsync/);
  assert.equal(container.querySelectorAll('button').length, 0);
  const state = plugin.server.execution.snapshot();
  assert.equal(state.chatgpt?.available, false);
  assert.match(state.chatgpt?.message || '', /EPERM \/ fsync/);
});
