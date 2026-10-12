import { test } from 'node:test';
import assert from 'node:assert/strict';
import NutEggPlugin from '../src/main';
import { DEFAULT_SETTINGS } from '../src/settings';
import { Setting } from 'obsidian';
import { JSDOM } from 'jsdom';
import { NutEggServer } from '../src/server';
import { randomUUID } from 'node:crypto';

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
  assert.match(summary.name, /API key/);
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
  plugin.settings.nativeApiConfig={aiProvider:'openai',aiModel:'api-model',aiApiKey:''};
  plugin.server=new NutEggServer(plugin,0);
  (plugin as any).registerSubscriptionCommands();
  commands[0].checkCallback(false);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(plugin.settings.subscriptionEnabled, true);
  assert.equal(plugin.settings.aiAuthMethod, 'apiKey');
  assert.equal(plugin.settings.aiApiKey, '');
  assert.equal(commands[1].checkCallback(true), true);
  await plugin.server.execution.change(plugin.server.execution.state.revision,randomUUID(),{mode:'subscription',subscription:{provider:'gemini',model:'cli-custom'}});
  const beforeDisable=cancellations;
  commands[1].checkCallback(false);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(plugin.settings.subscriptionEnabled, false);
  assert.equal(plugin.settings.aiAuthMethod, 'apiKey');
  assert.deepEqual(plugin.settings.subscriptionSelection, { provider: 'gemini', model: 'cli-custom' });
  assert.equal(cancellations, beforeDisable + 1);
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
    assert.doesNotMatch(names.join(' ') + (tab as any).containerEl.textContent, /subscription/i);
    assert.deepEqual(toggles, ['Developer mode']);
    const container = (tab as any).containerEl as HTMLElement;
    assert.equal(container.querySelector('.nutegg-native-ai-section > h3')?.textContent, 'AI for Obsidian actions');
    assert.equal(container.querySelector('.nutegg-model-config-section > h3')?.textContent, 'AI Model Configuration');
    assert.ok(container.querySelector('.nutegg-native-ai-account'), 'account summary belongs in its own footer');
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
  assert.match((tab as any).containerEl.textContent, /Subscription mode enabled/);
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
  plugin.settings = { ...DEFAULT_SETTINGS, subscriptionEnabled: true, aiProvider: 'gemini', aiAuthMethod: 'subscription' };
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
  assert.equal(container.querySelector('.nutegg-model-refresh-hint')?.getAttribute('data-state'), 'waiting');
  assert.ok(!capturedOptions.includes('gemini-2.5-flash'));
  assert.ok(!capturedOptions.includes('gemini-2.5-pro'));

  // Background models resolve
  resolveModels!(['auto', 'gemini-custom-model']);
  await modelsPromise;
  await new Promise(resolve => setImmediate(resolve));

  assert.deepEqual(plugin.settings.subscriptionModels?.gemini, ['auto', 'gemini-custom-model']);
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
    { displayName: 'Chrome B', provider: 'gemini', model: 'gemini-profile-b', chunkWindowChars: 12000, contentAnalysisMaxTokens: 4096 },
  ];
  plugin.server = { execution: { clients: () => profiles } } as any;
  const tab = new NutEggSettingTab({} as any, plugin);
  t.after(() => { tab.hide(); dom.window.close(); });
  const container = dom.window.document.querySelector('main')!;
  (tab as any).displayConnectedProfiles(container);
  assert.match(container.textContent!, /Chrome AAPI keyDeepSeekdeepseek-chat/);
  assert.match(container.textContent!, /24000.*8192/);
  assert.match(container.textContent!, /Chrome BAPI keyGoogle Geminigemini-profile-b/);
  assert.doesNotMatch(container.textContent!, /native-model|subscription/i);
  profiles[0].model = 'updated-chrome-model'; profiles[0].chunkWindowChars = 32000;
  repaint();
  assert.match(container.textContent!, /updated-chrome-model/);
  assert.match(container.textContent!, /32000/);
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
    plugin.syncNativeApi({aiProvider: 'gemini', aiModel: 'profile-B'}, 'chrome-B-secret'),
  ]);
  assert.deepEqual(results, [true, true]);
  assert.equal(plugin.getNativeSettings().aiApiKey, 'chrome-B-secret');
  assert.equal(plugin.settings.nativeApiConfig!.aiProvider, 'gemini');
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
