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
