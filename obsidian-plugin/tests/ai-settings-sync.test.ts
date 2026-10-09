import { test } from 'node:test';
import assert from 'node:assert/strict';
import NutEggPlugin from '../src/main';
import { DEFAULT_SETTINGS } from '../src/settings';

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
  plugin.settings.aiProvider = 'gemini-cli';
  const current = plugin.updateCreditStatusBar();
  pending[1]({ hasBalance: false, providerLabel: 'Gemini subscription', statusText: 'Bridge connected' });
  await current;
  pending[0]({ hasBalance: true, providerLabel: 'DeepSeek', balanceFormatted: '¥8.33', statusText: 'Available' });
  await old;
  assert.equal(bar.text, '🪙 Gemini subscription');
  assert.match(bar.attrs['aria-label'], /Bridge connected/);
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
  assert.equal(summary.name, 'DeepSeek · deepseek-chat');
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
  plugin.settings.aiProvider = 'gemini-cli';
  const latest = tab.refreshAICredit();
  pending[2]({ providerLabel: 'Gemini subscription', statusText: 'Bridge connected · Quota managed by CLI' });
  await latest;
  pending[1]({ balanceFormatted: '¥8.30', providerLabel: 'DeepSeek', statusText: 'Available' });
  await old;
  assert.equal(button.text, '🪙 Bridge connected');
  assert.match(button.tooltip, /Gemini subscription.*Refresh/);
  assert.equal(button.disabled, false);
});
