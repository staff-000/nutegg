import { test } from 'node:test';
import assert from 'node:assert/strict';
import NutEggPlugin from '../src/main';
import { DEFAULT_SETTINGS } from '../src/settings';
import { Setting } from 'obsidian';
import { JSDOM } from 'jsdom';

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
  Object.assign(plugin.settings, { aiProvider: 'gemini', aiAuthMethod: 'subscription', subscriptionEnabled: true });
  const current = plugin.updateCreditStatusBar();
  pending[1]({ hasBalance: false, subscriptionState: 'ready', providerLabel: 'Google Gemini', statusText: 'Connected' });
  await current;
  pending[0]({ hasBalance: true, providerLabel: 'DeepSeek', balanceFormatted: '¥8.33', statusText: 'Available' });
  await old;
  assert.equal(bar.text, 'Google Gemini · Subscription');
  assert.match(bar.attrs['aria-label'], /Connected/);
});

import { NutEggSettingTab } from '../src/settings';

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
    chunkWindowChars: 12000, contentAnalysisMaxTokens: 4096, localEndpoint: 'http://localhost:1234/v1/chat/completions' });
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
  Object.assign(plugin.settings, { aiProvider: 'gemini', aiAuthMethod: 'subscription', subscriptionEnabled: true });
  const latest = tab.refreshAICredit();
  pending[2]({ subscriptionState: 'ready', providerLabel: 'Google Gemini', statusText: 'Connected · Quota managed by CLI' });
  await latest;
  pending[1]({ balanceFormatted: '¥8.30', providerLabel: 'DeepSeek', statusText: 'Available' });
  await old;
  assert.equal(button.text, 'Google Gemini · Subscription');
  assert.match(button.tooltip, /Google Gemini.*Refresh/);
  assert.equal(button.disabled, false);
});


test('off-state read-only settings do not name the hidden connection method', async () => {
  const plugin = new NutEggPlugin();
  plugin.settings = { ...DEFAULT_SETTINGS, subscriptionEnabled: false, aiProvider: 'openai', aiAuthMethod: 'subscription', aiModel: 'auto' };
  plugin.aiClient = { checkCredit: async () => ({ subscriptionState: 'disabled', providerLabel: 'OpenAI', statusText: 'AI connection unavailable' }) } as any;
  const tab = new NutEggSettingTab({} as any, plugin);
  const summary = { name: '', setName(value: string) { this.name = value; return this; } };
  const button = { text: '', tooltip: '', setButtonText(value: string) { this.text = value; return this; }, setTooltip(value: string) { this.tooltip = value; return this; }, setDisabled() { return this; } };
  Object.assign(tab, { aiConfigSummary: summary, aiCreditButton: button });
  tab.refreshAISettings(); await tab.refreshAICredit();
  assert.doesNotMatch(summary.name + button.text + button.tooltip, /subscription/i);
  assert.match(summary.name, /unavailable/i);
});


test('off-state command palette has only a generic opt-in; feature commands appear after enable', () => {
  const plugin = new NutEggPlugin(); plugin.settings = { ...DEFAULT_SETTINGS };
  const commands: any[] = []; plugin.addCommand = (command: any) => { commands.push(command); return command; };
  (plugin as any).registerSubscriptionCommands();
  const visible = () => commands.filter(command => command.checkCallback(true)).map(command => command.name);
  assert.equal(visible().length, 1);
  assert.doesNotMatch(visible().join(' '), /subscription/i);
  plugin.settings.subscriptionEnabled = true;
  assert.deepEqual(visible(), ['Disable subscription mode']);
});

test('commands control availability without selecting subscription; disabling saves selection and stops work', async () => {
  const plugin = new NutEggPlugin();
  plugin.settings = { ...DEFAULT_SETTINGS, aiProvider: 'openai', aiAuthMethod: 'apiKey', aiApiKey: 'api-secret', aiModel: 'api-model' };
  const commands: any[] = []; let cancellations = 0;
  plugin.addCommand = (command: any) => { commands.push(command); return command; };
  plugin.subscriptions = { cancelWork: async () => { cancellations++; } } as any;
  plugin.openSettings = () => {};
  (plugin as any).registerSubscriptionCommands();
  commands[0].checkCallback(false);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(plugin.settings.subscriptionEnabled, true);
  assert.equal(plugin.settings.aiAuthMethod, 'apiKey');
  assert.equal(plugin.settings.aiApiKey, 'api-secret');
  assert.equal(commands[1].checkCallback(true), true);
  Object.assign(plugin.settings, { aiAuthMethod: 'subscription', aiProvider: 'gemini', aiModel: 'cli-custom', aiApiKey: '' });
  commands[1].checkCallback(false);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(plugin.settings.subscriptionEnabled, false);
  assert.equal(plugin.settings.aiAuthMethod, 'apiKey');
  assert.deepEqual(plugin.settings.subscriptionSelection, { provider: 'gemini', model: 'cli-custom' });
  assert.equal(cancellations, 1);
});

test('legacy subscription settings remain inactive until Chrome selects them after command enable', async () => {
  const plugin = new NutEggPlugin();
  plugin.loadData = async () => ({ aiProvider: 'claude-cli', aiModel: 'legacy-custom', aiApiKey: 'old-bridge-token' });
  await plugin.loadSettings();
  assert.equal(plugin.settings.subscriptionEnabled, false);
  assert.equal(plugin.settings.aiAuthMethod, 'apiKey');
  assert.equal(plugin.settings.aiApiKey, '');
  assert.deepEqual(plugin.settings.subscriptionSelection, { provider: 'anthropic', model: 'legacy-custom' });
});

test('subscription tests show progress and preserve success or failure after status refresh', async t => {
  const dom = new JSDOM('<body><main></main></body>');
  const proto = dom.window.HTMLElement.prototype as any;
  proto.empty = function () { this.replaceChildren(); };
  proto.setText = function (value: string) { this.textContent = value; };
  proto.createEl = function (tag: string, options: any = {}) {
    const element = dom.window.document.createElement(tag);
    element.textContent = options.text || '';
    for (const [name, value] of Object.entries(options.attr || {})) element.setAttribute(name, String(value));
    this.appendChild(element); return element;
  };
  proto.createDiv = function () { return this.createEl('div'); };
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
  plugin.settings = { ...DEFAULT_SETTINGS, subscriptionEnabled: true, aiProvider: 'gemini', aiAuthMethod: 'subscription', aiModel: '' };
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

test('settings never offer a subscription toggle and hide subscription details while using API', async t => {
  const dom = new JSDOM('<body><main></main></body>');
  const proto = dom.window.HTMLElement.prototype as any;
  proto.empty = function () { this.replaceChildren(); };
  proto.setText = function (value: string) { this.textContent = value; };
  proto.createEl = function (tag: string, options: any = {}) {
    const element = dom.window.document.createElement(tag);
    element.textContent = options.text || '';
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
  plugin.subscriptions = { status: async () => ({ state: 'unverified' }), resolve: async () => '/cli' } as any;
  const tab = new NutEggSettingTab({} as any, plugin);
  (tab as any).containerEl = dom.window.document.querySelector('main');
  t.after(() => { tab.hide(); dom.window.close(); });
  for (const enabled of [false, true]) {
    plugin.settings.subscriptionEnabled = enabled;
    names.length = toggles.length = 0; tab.display();
    await new Promise(resolve => setImmediate(resolve));
    assert.doesNotMatch(names.join(' ') + (tab as any).containerEl.textContent, /subscription/i);
    assert.deepEqual(toggles, ['Developer mode']);
  }
  plugin.settings.aiAuthMethod = 'subscription';
  names.length = toggles.length = 0; tab.display();
  await new Promise(resolve => setImmediate(resolve));
  assert.match((tab as any).containerEl.textContent, /Subscription mode enabled/);
  assert.deepEqual(toggles, ['Developer mode']);
});

test('ready subscription renders default models immediately and updates in background', async t => {
  const dom = new JSDOM('<body><main></main></body>');
  const proto = dom.window.HTMLElement.prototype as any;
  proto.empty = function () { this.replaceChildren(); };
  proto.setText = function (value: string) { this.textContent = value; };
  proto.createEl = function (tag: string, options: any = {}) {
    const element = dom.window.document.createElement(tag);
    element.textContent = options.text || '';
    for (const [name, value] of Object.entries(options.attr || {})) element.setAttribute(name, String(value));
    this.appendChild(element); return element;
  };
  proto.createDiv = function () { return this.createEl('div'); };
  const capturedOptions: string[] = [];
  const setting = Setting.prototype as any;
  t.mock.method(setting, 'setName', function () { return this; });
  t.mock.method(setting, 'setDesc', function () { return this; });
  t.mock.method(setting, 'addDropdown', function (configure: any) {
    const dropdown = {
      selectEl: dom.window.document.createElement('select'),
      addOption(val: string) { capturedOptions.push(val); return this; },
      setValue() { return this; },
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
  plugin.settings = { ...DEFAULT_SETTINGS, subscriptionEnabled: true, aiProvider: 'gemini', aiAuthMethod: 'subscription' };
  let resolveModels: (val: string[]) => void;
  const modelsPromise = new Promise<string[]>(resolve => { resolveModels = resolve; });
  plugin.subscriptions = {
    status: async () => ({ state: 'ready', message: 'Ready' }),
    models: async () => modelsPromise,
  } as any;

  const tab = new NutEggSettingTab({} as any, plugin);
  t.after(() => { tab.hide(); dom.window.close(); });
  const container = dom.window.document.querySelector('main')!;
  (tab as any).displaySubscriptionSetup(container);

  // Default models should be rendered immediately without waiting for modelsPromise
  await new Promise(resolve => setImmediate(resolve));
  assert.ok(capturedOptions.includes('auto'));
  assert.ok(capturedOptions.includes('gemini-2.5-flash'));
  assert.ok(capturedOptions.includes('gemini-2.5-pro'));

  // Background models resolve
  resolveModels!(['auto', 'gemini-custom-model']);
  await modelsPromise;
  await new Promise(resolve => setImmediate(resolve));

  assert.deepEqual(plugin.settings.subscriptionModels?.gemini, ['auto', 'gemini-custom-model']);
});
