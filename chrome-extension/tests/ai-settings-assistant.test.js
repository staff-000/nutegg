const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function loadAiCore() {
  const code = fs.readFileSync(path.join(__dirname, '../dist/ai-core.js'), 'utf8');
  const sandbox = { window: {}, globalThis: {}, structuredClone, URL, console };
  vm.runInNewContext(code, sandbox);
  return sandbox.NutEggAI || sandbox.globalThis.NutEggAI || sandbox.window.NutEggAI;
}

test('buildSettingsAssistantPrompt includes live schema, providers, prompt targets, and current state', () => {
  const NutEggAI = loadAiCore();
  const prompt = NutEggAI.buildSettingsAssistantPrompt(
    {
      connectionMode: 'chrome',
      uiDensity: 'compact',
      outputLanguage: 'same-as-content',
    },
    'Use Obsidian and include Charlie Munger feedback in summary'
  );

  for (const entry of NutEggAI.SETTINGS_SCHEMA) {
    assert.ok(prompt.includes(`"${entry.key}"`), `Missing schema key ${entry.key} in prompt`);
  }
  for (const target of NutEggAI.USER_EDITABLE_PROMPT_TARGETS) {
    assert.ok(prompt.includes(`"${target}"`), `Missing prompt target ${target} in prompt`);
  }
  assert.ok(prompt.includes('Use Obsidian and include Charlie Munger feedback in summary'));
  assert.ok(prompt.includes('CONFIGURABLE SETTINGS SCHEMA'));
});

test('validateAndApplySettingsPlan applies Obsidian + Charlie Munger prompt change and preserves placeholders', () => {
  const NutEggAI = loadAiCore();
  const snapshot = {
    connectionMode: 'chrome',
    uiDensity: 'compact',
    chromeAiPromptOverrides: {},
  };

  const aiReply = JSON.stringify({
    settings: {
      connectionMode: 'obsidian',
    },
    promptChanges: [
      {
        target: 'verdictSummary',
        mode: 'append',
        instruction: 'Include brief feedback and mental-model critique from Charlie Munger.',
      },
      {
        target: 'contentAnalysis',
        mode: 'append',
        instruction: 'Include brief feedback and mental-model critique from Charlie Munger.',
      },
    ],
    unsupported: [],
    summary: 'Switched to Obsidian mode and added Charlie Munger feedback to summary prompts.',
  });

  const plan = NutEggAI.validateAndApplySettingsPlan(aiReply, snapshot);
  assert.equal(plan.status, 'applied');
  assert.equal(plan.nextStoragePatch.connectionMode, 'obsidian');
  assert.equal(plan.undoStoragePatch.connectionMode, 'chrome');

  const updatedVerdictPrompt = plan.nextStoragePatch.chromeAiPromptOverrides.verdictSummary;
  assert.ok(updatedVerdictPrompt.includes('Charlie Munger'));
  assert.ok(updatedVerdictPrompt.includes('{{content}}'));
  assert.ok(updatedVerdictPrompt.includes(NutEggAI.CUSTOM_INSTRUCTION_START));

  // Idempotent update replaces previous custom instruction block instead of duplicating it
  const secondUpdated = NutEggAI.applyCustomPromptInstruction(updatedVerdictPrompt, 'Focus on inversion thinking.');
  assert.equal(secondUpdated.split(NutEggAI.CUSTOM_INSTRUCTION_START).length - 1, 1);
  assert.ok(secondUpdated.includes('Focus on inversion thinking.'));
  assert.ok(!secondUpdated.includes('Charlie Munger'));
});

test('validateAndApplySettingsPlan honestly reports unsupported requests without modifying unrelated settings', () => {
  const NutEggAI = loadAiCore();
  const snapshot = {
    connectionMode: 'chrome',
    enabledSections: { titleVerdict: true, coreSummary: true, mindMap: true, discussion: false },
  };

  const aiReply = JSON.stringify({
    settings: {
      fakeNonExistentSetting: true,
      uiDensity: 'ultra-compact',
    },
    unsupported: [
      {
        request: 'Send me a daily email digest',
        reason: 'NutEgg does not have an email digest feature.',
      },
    ],
    summary: 'Switched UI density to ultra-compact; daily email digest is not supported.',
  });

  const plan = NutEggAI.validateAndApplySettingsPlan(aiReply, snapshot);
  assert.equal(plan.status, 'partial');
  assert.equal(plan.nextStoragePatch.uiDensity, 'ultra-compact');
  assert.equal(plan.nextStoragePatch.fakeNonExistentSetting, undefined);
  assert.equal(plan.nextStoragePatch.connectionMode, undefined);
  assert.ok(plan.unsupported.some(u => u.request.includes('daily email digest')));
  assert.ok(plan.unsupported.some(u => u.request.includes('fakeNonExistentSetting')));
});

test('validateAndApplySettingsPlan prevents disabling all Content Analysis sections', () => {
  const NutEggAI = loadAiCore();
  const snapshot = {
    enabledSections: { titleVerdict: true, coreSummary: true, mindMap: true, discussion: false },
  };

  const aiReply = JSON.stringify({
    settings: {
      enabledSections: {
        titleVerdict: false,
        coreSummary: false,
        mindMap: false,
        discussion: false,
      },
    },
  });

  const plan = NutEggAI.validateAndApplySettingsPlan(aiReply, snapshot);
  assert.equal(plan.nextStoragePatch.enabledSections, undefined);
  assert.ok(plan.unsupported.length > 0);
});

test('validateAndApplySettingsPlan applies panelRuleChanges cleanly', () => {
  const NutEggAI = loadAiCore();
  const snapshot = {
    panelSettings: {
      mode: 'injected',
      side: 'right',
      layoutMode: 'auto',
      openingPolicy: 'nutegg',
      autoAnalyze: false,
      rules: [],
    },
  };

  const aiReply = JSON.stringify({
    settings: {
      'panelSettings.autoAnalyze': true,
    },
    panelRuleChanges: [
      { op: 'allow_site', hostname: 'arxiv.org' },
      { op: 'mute_topic', hostname: 'x.com', topic: 'politics' },
    ],
  });

  const plan = NutEggAI.validateAndApplySettingsPlan(aiReply, snapshot);
  assert.equal(plan.status, 'applied');
  assert.equal(plan.nextStoragePatch.panelSettings.autoAnalyze, true);
  assert.equal(plan.nextStoragePatch.panelSettings.rules.length, 2);
  assert.equal(plan.nextStoragePatch.panelSettings.rules[0].action, 'allow');
  assert.equal(plan.nextStoragePatch.panelSettings.rules[0].hostname, 'arxiv.org');
  assert.equal(plan.nextStoragePatch.panelSettings.rules[1].action, 'block');
  assert.deepEqual([...plan.nextStoragePatch.panelSettings.rules[1].topics], ['politics']);
});
