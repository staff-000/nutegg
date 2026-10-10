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
  assert.equal(bar.text, 'Subscription');
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
  assert.equal(button.text, 'Subscription');
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
  let testButton = buttons.find(button => button.text === 'Test connection');
  const pending = testButton.click();
  assert.match(container.textContent!, /Testing AI connection.*three minutes/);
  assert.equal(testButton.disabled, true);
  assert.equal(model, 'auto');
  resolveTest!({ state: 'ready' }); await pending;
  assert.match(container.textContent!, /AI connection test passed/);
  testButton = buttons.filter(button => button.text === 'Test connection').at(-1);
  const failed = testButton.click(); rejectTest!(new Error('Selected model is unavailable. Choose another model.')); await failed;
  assert.match(container.textContent!, /Selected model is unavailable.*Choose another model/);
  assert.doesNotMatch(container.textContent!, /test passed/);
});
