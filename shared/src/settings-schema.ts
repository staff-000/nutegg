// ============================================================
// NutEgg Settings Schema & AI Configuration Assistant Engine
// ============================================================
// Single source of truth for configurable NutEgg settings, live
// schema-driven prompt generation, and validated state mutation.

import { PROVIDER_CATALOG } from './catalog';
import { parseJson } from './json-repair';
import { PROMPTS } from './prompt-templates';

export interface SettingSchemaEntry {
  key: string;
  label: string;
  type: 'enum' | 'boolean' | 'integer' | 'number' | 'object' | 'string';
  values?: readonly string[];
  min?: number;
  max?: number;
  defaultValue: unknown;
  description: string;
  controlIds: readonly string[];
}

export const PROMPT_TARGET_DESCRIPTIONS: Record<keyof typeof PROMPTS, string> = {
  verdictSummary: 'Standalone Verdict & Summary (+ custom question answers)',
  mindMapAnalysis: 'Standalone Mind Map analysis',
  contentAnalysis: 'Combined Content Analysis (Stage 1 Summary & Mind Map)',
  aggregateContent: 'Combine long-content summaries across chunks',
  contentTaskDefault: 'Default content analysis task instructions',
  chromeKnowledge: 'Knowledge Extraction in Chrome Mode',
  followUp: 'Follow-up Q&A prompt',
  discussionAnalysis: 'Community discussion / comments analysis',
  aggregateDiscussion: 'Aggregate discussion across chunks',
  conversationRules: 'Conversation formatting rules for AMA/podcasts',
  eggAnalysis: 'Stage 2 Egg analysis',
  eggRouting: 'Egg routing against vault _index.md',
  mergeUnprocessed: 'Merge 20+ Unprocessed entries into Knowledge tree',
  aggregateEgg: 'Aggregate long-content egg analysis',
  localizeEgg: 'Localize egg template',
  localizeWorkflow: 'Localize workflow prompt templates',
  sharedOutputRules: 'Shared grounding and output language rules',
};

export const USER_EDITABLE_PROMPT_TARGETS = [
  'verdictSummary',
  'mindMapAnalysis',
  'aggregateContent',
  'contentAnalysis',
  'contentTaskDefault',
  'chromeKnowledge',
  'followUp',
  'discussionAnalysis',
  'aggregateDiscussion',
  'conversationRules',
] as const;

export const OUTPUT_LANGUAGES = [
  'same-as-content',
  'English',
  'Chinese',
  'Spanish',
  'Japanese',
  'Korean',
  'Arabic',
  'French',
  'German',
  'Portuguese',
  'Russian',
] as const;

/**
 * Controls in options.html that are intentionally NOT AI-configurable
 * (secrets, action buttons, read-only displays, and the AI assistant itself).
 * Checked by scripts/lint.js so newly added setting controls are never forgotten.
 */
export const NON_AI_CONFIGURABLE_CONTROLS = [
  'use-subscription-toggle',
  'ai-model-custom',
  'ai-local-api',
  'ai-local-endpoint',
  'ai-key-input',
  'ai-key-toggle',
  'ai-save-btn',
  'ai-test-btn',
  'use-chrome-btn',
  'chatgpt-signin',
  'chatgpt-cancel',
  'chatgpt-signout',
  'panel-position-settings-btn',
  'sections-save-btn',
  'save-btn',
  'test-btn',
  'ai-prompt-select',
  'ai-prompt-textarea',
  'ai-prompt-save-btn',
  'ai-prompt-reset-btn',
  'ai-advanced-save-btn',
  'chrome-cache-save-btn',
  'chrome-cache-clear-btn',
  'capture-retry-save',
  'export-config-top-btn',
  'export-config-bottom-btn',
  'report-bug-btn',
  'ai-assistant-input',
  'ai-assistant-apply-btn',
  'ai-assistant-undo-btn',
] as const;

export const SETTINGS_SCHEMA: readonly SettingSchemaEntry[] = [
  {
    key: 'connectionMode',
    label: 'Connection Mode',
    type: 'enum',
    values: ['chrome', 'obsidian'],
    defaultValue: 'chrome',
    description:
      'Use "obsidian" to connect to the local Obsidian plugin (vault sync, eggs, DB history), or "chrome" to run standalone in Chrome.',
    controlIds: ['obsidian-mode-enabled'],
  },
  {
    key: 'serverPort',
    label: 'Obsidian Server Port',
    type: 'integer',
    min: 1,
    max: 65535,
    defaultValue: 27123,
    description: 'Local HTTP port for the Obsidian NutEgg plugin (1-65535).',
    controlIds: ['port-input'],
  },
  {
    key: 'analysisMode',
    label: 'Obsidian Analysis Mode',
    type: 'enum',
    values: ['preview', 'full'],
    defaultValue: 'preview',
    description: '"preview" pauses to review matched eggs before Stage 2; "full" auto-proceeds through egg analysis.',
    controlIds: ['mode-select'],
  },
  {
    key: 'chromeAiProvider',
    label: 'AI Provider',
    type: 'enum',
    values: Object.keys(PROVIDER_CATALOG),
    defaultValue: 'google',
    description: 'AI provider ID for Chrome mode (e.g. google, openai, anthropic, openrouter, deepseek, local).',
    controlIds: ['ai-provider-select'],
  },
  {
    key: 'chromeAiModel',
    label: 'AI Model',
    type: 'string',
    defaultValue: PROVIDER_CATALOG.google?.defaultModel || 'gemini-2.5-flash',
    description: 'Model ID for the selected AI provider.',
    controlIds: ['ai-model-select'],
  },
  {
    key: 'uiDensity',
    label: 'UI Density',
    type: 'enum',
    values: ['margin', 'compact', 'ultra-compact'],
    defaultValue: 'compact',
    description: 'Spacing density for the NutEgg side panel.',
    controlIds: ['ui-density-select'],
  },
  {
    key: 'outputLanguage',
    label: 'Preferred Language',
    type: 'enum',
    values: OUTPUT_LANGUAGES,
    defaultValue: 'same-as-content',
    description: 'Language used for generated summaries, mind maps, and answers.',
    controlIds: ['output-lang-select'],
  },
  {
    key: 'enabledSections.titleVerdict_coreSummary',
    label: 'Verdict & Summary Section',
    type: 'boolean',
    defaultValue: true,
    description: 'Show Verdict & Core Summary section (coupled with coreSummary; at least one section must stay enabled).',
    controlIds: ['section-verdict-summary'],
  },
  {
    key: 'enabledSections.mindMap',
    label: 'Mind Map Section',
    type: 'boolean',
    defaultValue: true,
    description: 'Show Mind Map concept tree section (at least one section must stay enabled).',
    controlIds: ['section-mindmap'],
  },
  {
    key: 'enabledSections.discussion',
    label: 'Discussion Section',
    type: 'boolean',
    defaultValue: false,
    description: 'Analyze community comments, user debates, and counterarguments.',
    controlIds: ['section-discussion'],
  },
  {
    key: 'generateKnowledgeEntries',
    label: 'Knowledge Extraction',
    type: 'boolean',
    defaultValue: false,
    description: 'Extract structured knowledge entries and compare against matched eggs.',
    controlIds: ['section-knowledge'],
  },
  {
    key: 'optimizeForConversation',
    label: 'Optimize for AMA & Podcast',
    type: 'boolean',
    defaultValue: true,
    description: 'Structure mind maps by topics, questions, and discussion flow for interviews/podcasts.',
    controlIds: ['optimize-conversation'],
  },
  {
    key: 'userNotesEnabled',
    label: 'User Notes (Obsidian Mode)',
    type: 'boolean',
    defaultValue: true,
    description: 'Show the multi-entry Your Notes section on Results view in Obsidian mode.',
    controlIds: ['section-notes'],
  },
  {
    key: 'videoSpeedEnabled',
    label: 'Video Speed Adjuster',
    type: 'boolean',
    defaultValue: true,
    description: 'Enable the 0.25x-16x video speed adjuster in the NutEgg panel and + / - keyboard shortcuts.',
    controlIds: ['video-speed-enabled'],
  },
  {
    key: 'videoSpeedOnPageEnabled',
    label: 'On-Page Video Speed Slider',
    type: 'boolean',
    defaultValue: true,
    description: 'Show the speed slider overlay on YouTube and Bilibili video players.',
    controlIds: ['video-speed-on-page'],
  },
  {
    key: 'videoSpeedAllSitesEnabled',
    label: 'On-Page Video Speed Slider (All Videos)',
    type: 'boolean',
    defaultValue: false,
    description: 'Show the speed slider overlay in the top-right corner of videos on all websites.',
    controlIds: ['video-speed-all-sites'],
  },
  {
    key: 'chunkWindowChars',
    label: 'General Chunk Window Size',
    type: 'integer',
    min: 1000,
    max: 500000,
    defaultValue: 30000,
    description: 'Maximum characters per chunk before splitting long content.',
    controlIds: ['chunk-window-chars'],
  },
  {
    key: 'contentAnalysisMaxTokens',
    label: 'Max Completion Tokens',
    type: 'integer',
    min: 500,
    max: 200000,
    defaultValue: 16384,
    description: 'Output token budget for AI calls.',
    controlIds: ['max-completion-tokens'],
  },
  {
    key: 'chromeCacheTabLimit',
    label: 'Tabs Cache Limit',
    type: 'integer',
    min: 0,
    max: 1000,
    defaultValue: 100,
    description: 'Number of analyzed tabs cached in Chrome mode (0-1000).',
    controlIds: ['chrome-cache-limit-input'],
  },
  {
    key: 'captureRetryCount',
    label: 'Content Loading Max Retries',
    type: 'integer',
    min: 0,
    max: 10,
    defaultValue: 3,
    description: 'Maximum retries when captions or dynamic content are not ready yet (0-10).',
    controlIds: ['capture-retry-count'],
  },
  {
    key: 'captureRetryDelayMs',
    label: 'Content Loading Retry Delay (ms)',
    type: 'integer',
    min: 100,
    max: 10000,
    defaultValue: 3000,
    description: 'Delay before each content retry in milliseconds (100-10000; 1 second = 1000ms).',
    controlIds: ['capture-retry-delay'],
  },
  {
    key: 'debugInfo',
    label: 'Debug Info',
    type: 'boolean',
    defaultValue: false,
    description: 'Show active AI calls, topics, questions, and rule info in the panel.',
    controlIds: ['debug-info-enabled'],
  },
  {
    key: 'panelSettings.mode',
    label: 'Panel Display Mode',
    type: 'enum',
    values: ['injected', 'native'],
    defaultValue: 'injected',
    description: '"injected" renders the in-page NutEgg side panel; "native" uses Chrome built-in side panel.',
    controlIds: [],
  },
  {
    key: 'panelSettings.side',
    label: 'Panel Side',
    type: 'enum',
    values: ['left', 'right'],
    defaultValue: 'right',
    description: 'Which side of the viewport the injected panel attaches to.',
    controlIds: [],
  },
  {
    key: 'panelSettings.layoutMode',
    label: 'Page Overlap Mode',
    type: 'enum',
    values: ['auto', 'floating', 'push'],
    defaultValue: 'auto',
    description: 'Whether the injected panel floats over or pushes page content.',
    controlIds: [],
  },
  {
    key: 'panelSettings.openingPolicy',
    label: 'Auto-Popup Default Policy',
    type: 'enum',
    values: ['nutegg', 'open', 'closed'],
    defaultValue: 'nutegg',
    description: '"nutegg" auto-opens on whitelisted sites (3+ min); "open" opens on all 3+ min pages; "closed" only opens on explicit allow rules.',
    controlIds: [],
  },
  {
    key: 'panelSettings.autoAnalyze',
    label: 'Auto-Analyze on Auto-Open',
    type: 'boolean',
    defaultValue: false,
    description: 'Automatically start analyzing when NutEgg auto-opens a page.',
    controlIds: [],
  },
];

export const CUSTOM_INSTRUCTION_START = '<!-- NUTEGG_CUSTOM_INSTRUCTION_START -->';
export const CUSTOM_INSTRUCTION_END = '<!-- NUTEGG_CUSTOM_INSTRUCTION_END -->';

export interface SettingsSnapshot {
  connectionMode?: string;
  serverPort?: number;
  analysisMode?: string;
  chromeAiProvider?: string;
  chromeAiModel?: string;
  uiDensity?: string;
  outputLanguage?: string;
  enabledSections?: {
    titleVerdict?: boolean;
    coreSummary?: boolean;
    mindMap?: boolean;
    discussion?: boolean;
  };
  generateKnowledgeEntries?: boolean;
  optimizeForConversation?: boolean;
  userNotesEnabled?: boolean;
  videoSpeedEnabled?: boolean;
  videoSpeedOnPageEnabled?: boolean;
  videoSpeedAllSitesEnabled?: boolean;
  chunkWindowChars?: number;
  contentAnalysisMaxTokens?: number;
  chromeCacheTabLimit?: number;
  captureRetryCount?: number;
  captureRetryDelayMs?: number;
  debugInfo?: boolean;
  chromeAiPromptOverrides?: Record<string, string>;
  panelSettings?: {
    mode?: string;
    side?: string;
    layoutMode?: string;
    openingPolicy?: string;
    autoAnalyze?: boolean;
    rules?: Array<Record<string, any>>;
    [key: string]: any;
  };
}

export interface AppliedChange {
  key: string;
  label: string;
  summary: string;
}

export interface UnsupportedRequest {
  request: string;
  reason: string;
}

export interface ApplySettingsPlanResult {
  status: 'applied' | 'partial' | 'unsupported' | 'invalid';
  message: string;
  appliedChanges: AppliedChange[];
  unsupported: UnsupportedRequest[];
  nextStoragePatch: Record<string, any>;
  undoStoragePatch: Record<string, any>;
}

/**
 * Safely appends or replaces a user preference block inside a prompt template
 * without disturbing required {{placeholders}} or JSON schema instructions.
 */
export function applyCustomPromptInstruction(baseTemplate: string, instruction: string): string {
  const cleanInstruction = instruction.trim();
  if (!cleanInstruction) return baseTemplate;
  const cleanedBase = removeCustomPromptInstruction(baseTemplate).trimEnd();
  const block = [
    CUSTOM_INSTRUCTION_START,
    '## Additional User Preferences',
    cleanInstruction,
    CUSTOM_INSTRUCTION_END,
  ].join('\n');
  return `${cleanedBase}\n\n${block}\n`;
}

export function removeCustomPromptInstruction(template: string): string {
  if (!template) return '';
  const pattern = new RegExp(
    `\\s*${CUSTOM_INSTRUCTION_START}[\\s\\S]*?${CUSTOM_INSTRUCTION_END}\\s*`,
    'g'
  );
  return template.replace(pattern, '\n').trim();
}

function escapeWebsiteRegex(host: string): string {
  const normalized = host.trim().toLowerCase().replace(/^www\./, '');
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return `^https?://(?:[^/]+\\.)?${escaped}(?::[0-9]+)?(?:[/?#]|$)`;
}

function normalizeHostname(raw: string): string {
  const cleaned = String(raw || '').trim().toLowerCase();
  if (!cleaned) return '';
  try {
    const url = new URL(cleaned.includes('://') ? cleaned : `https://${cleaned}`);
    return url.hostname.replace(/^www\./, '');
  } catch {
    return cleaned.replace(/^https?:\/\//, '').replace(/^www\./, '').split(/[/?#]/)[0];
  }
}

/**
 * Build a live, schema-driven prompt for the Settings AI Configuration Assistant.
 * Every setting in SETTINGS_SCHEMA, live PROVIDER_CATALOG, and PROMPTS is injected dynamically.
 */
export function buildSettingsAssistantPrompt(currentSnapshot: SettingsSnapshot, userRequest: string): string {
  const schemaLines = SETTINGS_SCHEMA.map(entry => {
    const constraints = entry.values
      ? `allowed: [${entry.values.map(v => JSON.stringify(v)).join(', ')}]`
      : entry.min !== undefined || entry.max !== undefined
        ? `range: ${entry.min ?? '-inf'}..${entry.max ?? 'inf'}`
        : `type: ${entry.type}`;
    return `- "${entry.key}" (${constraints}, default: ${JSON.stringify(entry.defaultValue)}): ${entry.description}`;
  }).join('\n');

  const promptTargetLines = USER_EDITABLE_PROMPT_TARGETS.map(
    key => `- "${key}": ${PROMPT_TARGET_DESCRIPTIONS[key]}`
  ).join('\n');

  const providerSummary = Object.values(PROVIDER_CATALOG)
    .map(p => `- ${p.id} (${p.label}): models=[${(p.models || []).slice(0, 8).join(', ')}]`)
    .join('\n');

  const compactSnapshot = {
    connectionMode: currentSnapshot.connectionMode || 'chrome',
    serverPort: currentSnapshot.serverPort ?? 27123,
    analysisMode: currentSnapshot.analysisMode || 'preview',
    chromeAiProvider: currentSnapshot.chromeAiProvider || 'google',
    chromeAiModel: currentSnapshot.chromeAiModel || '',
    uiDensity: currentSnapshot.uiDensity || 'compact',
    outputLanguage: currentSnapshot.outputLanguage || 'same-as-content',
    enabledSections: currentSnapshot.enabledSections || {
      titleVerdict: true,
      coreSummary: true,
      mindMap: true,
      discussion: false,
    },
    generateKnowledgeEntries: Boolean(currentSnapshot.generateKnowledgeEntries),
    optimizeForConversation: currentSnapshot.optimizeForConversation !== false,
    userNotesEnabled: currentSnapshot.userNotesEnabled !== false,
    videoSpeedEnabled: currentSnapshot.videoSpeedEnabled !== false,
    videoSpeedOnPageEnabled: currentSnapshot.videoSpeedOnPageEnabled !== false,
    videoSpeedAllSitesEnabled: Boolean(currentSnapshot.videoSpeedAllSitesEnabled),
    chunkWindowChars: currentSnapshot.chunkWindowChars ?? 30000,
    contentAnalysisMaxTokens: currentSnapshot.contentAnalysisMaxTokens ?? 16384,
    chromeCacheTabLimit: currentSnapshot.chromeCacheTabLimit ?? 100,
    captureRetryCount: currentSnapshot.captureRetryCount ?? 3,
    captureRetryDelayMs: currentSnapshot.captureRetryDelayMs ?? 3000,
    debugInfo: Boolean(currentSnapshot.debugInfo),
    activePromptOverrides: Object.keys(currentSnapshot.chromeAiPromptOverrides || {}),
    panelSettings: currentSnapshot.panelSettings
      ? {
          mode: currentSnapshot.panelSettings.mode || 'injected',
          side: currentSnapshot.panelSettings.side || 'right',
          layoutMode: currentSnapshot.panelSettings.layoutMode || 'auto',
          openingPolicy: currentSnapshot.panelSettings.openingPolicy || 'nutegg',
          autoAnalyze: Boolean(currentSnapshot.panelSettings.autoAnalyze),
          customRulesCount: Array.isArray(currentSnapshot.panelSettings.rules)
            ? currentSnapshot.panelSettings.rules.length
            : 0,
        }
      : {},
  };

  return `You are the NutEgg Settings Configuration Assistant.
Translate the user's natural-language request into safe, validated configuration changes.

### CRITICAL RULES
1. ONLY modify settings that the user explicitly or clearly asked to change. Never modify unrelated settings.
2. NEVER invent setting keys, enum values, or capabilities that are not listed below.
3. If the user's request (or any part of it) CANNOT be satisfied by the settings below — for example, asking for a feature NutEgg does not support, asking to set an API key secret without entering it in the API Key field, or asking for an unsupported provider/language/action — do NOT make random or guessed changes. Put that part in "unsupported" with a clear, honest reason.
4. For custom prompt requests (e.g., "include feedback from Charlie Munger", "summarize in bullet points", "be more critical"):
   - Add entries in "promptChanges" with "mode": "append" (or "mode": "reset" if asked to reset prompts).
   - Pick the right target(s):
     - For summary/verdict style or persona feedback: update BOTH "verdictSummary" and "contentAnalysis".
     - For mind map style: update BOTH "mindMapAnalysis" and "contentAnalysis".
     - For Q&A: update "followUp".
     - For knowledge extraction: update "chromeKnowledge".
   - Write a concise, clear instruction in "instruction" (NutEgg preserves all required {{placeholders}} and JSON format automatically).
5. Reply in the same language as the user's request.
6. Return ONLY valid JSON matching the exact schema below — no markdown commentary outside the JSON.

### CONFIGURABLE SETTINGS SCHEMA
${schemaLines}

### AI PROVIDERS & MODELS
${providerSummary}

### CUSTOM PROMPT TARGETS
${promptTargetLines}

### PANEL AUTO-OPEN RULE ACTIONS ("panelRuleChanges")
Each item supports:
- { "op": "allow_site", "hostname": "example.com" }
- { "op": "mute_site", "hostname": "example.com" }
- { "op": "allow_topic", "hostname": "youtube.com", "topic": "AI" }
- { "op": "mute_topic", "hostname": "x.com", "topic": "politics" }
- { "op": "remove_site", "hostname": "example.com" }

### CURRENT SETTINGS SNAPSHOT
${JSON.stringify(compactSnapshot, null, 2)}

### REQUIRED JSON RESPONSE FORMAT
{
  "settings": {
    // Only include keys from CONFIGURABLE SETTINGS SCHEMA that should change.
    // Nested objects like "enabledSections" or "panelSettings" can be flat dotted keys OR nested objects.
  },
  "promptChanges": [
    {
      "target": "verdictSummary",
      "mode": "append",
      "instruction": "Include brief critical feedback from Charlie Munger's mental-model perspective."
    }
  ],
  "panelRuleChanges": [
    {
      "op": "allow_site",
      "hostname": "arxiv.org"
    }
  ],
  "unsupported": [
    {
      "request": "text of any part that cannot be satisfied",
      "reason": "honest explanation why NutEgg Settings cannot do this"
    }
  ],
  "summary": "Brief human-readable summary of what was changed or why it could not be changed."
}

### USER REQUEST
${userRequest}`;
}

/**
 * Parse, validate, and compute the exact storage patch and Undo patch
 * for an AI Settings Assistant response.
 */
export function validateAndApplySettingsPlan(
  rawResponseText: string,
  currentSnapshot: SettingsSnapshot
): ApplySettingsPlanResult {
  const parsed = parseJson(rawResponseText, 'ai-settings-assistant');
  if (!parsed || typeof parsed !== 'object' || Object.keys(parsed).length === 0) {
    return {
      status: 'invalid',
      message: 'AI returned an unreadable response. No settings were changed.',
      appliedChanges: [],
      unsupported: [],
      nextStoragePatch: {},
      undoStoragePatch: {},
    };
  }

  const nextPatch: Record<string, any> = {};
  const undoPatch: Record<string, any> = {};
  const appliedChanges: AppliedChange[] = [];
  const unsupported: UnsupportedRequest[] = Array.isArray(parsed.unsupported)
    ? parsed.unsupported
        .filter((u: any) => u && (u.request || u.reason))
        .map((u: any) => ({
          request: String(u.request || 'Requested option'),
          reason: String(u.reason || 'Not supported in NutEgg Settings.'),
        }))
    : [];

  // Flatten parsed.settings so both { "panelSettings.mode": "native" } and { panelSettings: { mode: "native" } } work.
  const rawSettings = parsed.settings && typeof parsed.settings === 'object' ? parsed.settings : {};
  const flatSettings: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(rawSettings)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      for (const [subK, subV] of Object.entries(v as Record<string, unknown>)) {
        flatSettings[`${k}.${subK}`] = subV;
      }
    } else {
      flatSettings[k] = v;
    }
  }

  // Normalize coupled verdict/coreSummary aliases if LLM used enabledSections.titleVerdict or coreSummary
  if (flatSettings['enabledSections.titleVerdict'] !== undefined || flatSettings['enabledSections.coreSummary'] !== undefined) {
    const val = Boolean(
      flatSettings['enabledSections.titleVerdict'] ?? flatSettings['enabledSections.coreSummary']
    );
    flatSettings['enabledSections.titleVerdict_coreSummary'] = val;
    delete flatSettings['enabledSections.titleVerdict'];
    delete flatSettings['enabledSections.coreSummary'];
  }

  const nextSections = {
    titleVerdict: true,
    coreSummary: true,
    mindMap: true,
    discussion: false,
    ...(currentSnapshot.enabledSections || {}),
  };
  let sectionsModified = false;

  const nextPanelSettings: Record<string, any> = currentSnapshot.panelSettings
    ? { ...currentSnapshot.panelSettings, rules: [...(currentSnapshot.panelSettings.rules || [])] }
    : {};
  let panelModified = false;

  const schemaMap = new Map(SETTINGS_SCHEMA.map(s => [s.key, s]));

  for (const [key, rawValue] of Object.entries(flatSettings)) {
    const entry = schemaMap.get(key);
    if (!entry) {
      unsupported.push({
        request: `${key} = ${JSON.stringify(rawValue)}`,
        reason: `Unknown or non-configurable setting "${key}".`,
      });
      continue;
    }

    let validated: any = rawValue;
    if (entry.type === 'enum') {
      const strVal = String(rawValue);
      if (entry.values && !entry.values.includes(strVal)) {
        unsupported.push({
          request: `${entry.label}: ${strVal}`,
          reason: `Invalid value "${strVal}". Allowed: ${entry.values.join(', ')}.`,
        });
        continue;
      }
      validated = strVal;
    } else if (entry.type === 'boolean') {
      if (typeof rawValue === 'boolean') validated = rawValue;
      else if (rawValue === 'true') validated = true;
      else if (rawValue === 'false') validated = false;
      else {
        unsupported.push({
          request: `${entry.label}: ${String(rawValue)}`,
          reason: 'Expected a true/false boolean value.',
        });
        continue;
      }
    } else if (entry.type === 'integer') {
      const num = Math.round(Number(rawValue));
      if (!Number.isFinite(num)) {
        unsupported.push({
          request: `${entry.label}: ${String(rawValue)}`,
          reason: 'Expected an integer value.',
        });
        continue;
      }
      const clamped = Math.min(
        entry.max ?? Number.MAX_SAFE_INTEGER,
        Math.max(entry.min ?? Number.MIN_SAFE_INTEGER, num)
      );
      validated = clamped;
    } else if (entry.type === 'string') {
      validated = String(rawValue ?? '').trim();
      if (!validated) {
        unsupported.push({
          request: entry.label,
          reason: 'Value cannot be empty.',
        });
        continue;
      }
    }

    if (key === 'enabledSections.titleVerdict_coreSummary') {
      if (nextSections.titleVerdict !== validated || nextSections.coreSummary !== validated) {
        nextSections.titleVerdict = validated;
        nextSections.coreSummary = validated;
        sectionsModified = true;
        appliedChanges.push({
          key,
          label: entry.label,
          summary: `${entry.label}: ${validated ? 'enabled' : 'disabled'}`,
        });
      }
    } else if (key === 'enabledSections.mindMap') {
      if (nextSections.mindMap !== validated) {
        nextSections.mindMap = validated;
        sectionsModified = true;
        appliedChanges.push({
          key,
          label: entry.label,
          summary: `${entry.label}: ${validated ? 'enabled' : 'disabled'}`,
        });
      }
    } else if (key === 'enabledSections.discussion') {
      if (nextSections.discussion !== validated) {
        nextSections.discussion = validated;
        sectionsModified = true;
        appliedChanges.push({
          key,
          label: entry.label,
          summary: `${entry.label}: ${validated ? 'enabled' : 'disabled'}`,
        });
      }
    } else if (key.startsWith('panelSettings.')) {
      const subKey = key.slice('panelSettings.'.length);
      if (nextPanelSettings[subKey] !== validated) {
        nextPanelSettings[subKey] = validated;
        panelModified = true;
        appliedChanges.push({
          key,
          label: entry.label,
          summary: `${entry.label}: ${String(validated)}`,
        });
      }
    } else {
      const currentVal = (currentSnapshot as Record<string, any>)[key];
      if (currentVal !== validated) {
        undoPatch[key] = currentVal;
        nextPatch[key] = validated;
        appliedChanges.push({
          key,
          label: entry.label,
          summary: `${entry.label}: ${String(validated)}`,
        });
      }
    }
  }

  if (sectionsModified) {
    const anySectionOn =
      nextSections.titleVerdict !== false || nextSections.mindMap !== false || nextSections.discussion === true;
    if (!anySectionOn) {
      unsupported.push({
        request: 'Disable all content analysis sections',
        reason: 'At least one Content Analysis section (Verdict & Summary, Mind Map, or Discussion) must stay enabled.',
      });
    } else {
      undoPatch.enabledSections = currentSnapshot.enabledSections
        ? { ...currentSnapshot.enabledSections }
        : { titleVerdict: true, coreSummary: true, mindMap: true, discussion: false };
      nextPatch.enabledSections = nextSections;
    }
  }

  // Validate and apply custom prompt changes
  if (Array.isArray(parsed.promptChanges) && parsed.promptChanges.length > 0) {
    const currentOverrides = { ...(currentSnapshot.chromeAiPromptOverrides || {}) };
    const nextOverrides = { ...currentOverrides };
    let promptModified = false;

    for (const change of parsed.promptChanges) {
      if (!change || typeof change !== 'object') continue;
      const target = String(change.target || '');
      const mode = String(change.mode || 'append');
      const instruction = String(change.instruction || '').trim();
      if (!(USER_EDITABLE_PROMPT_TARGETS as readonly string[]).includes(target)) {
        unsupported.push({
          request: `Custom prompt "${target}"`,
          reason: `Unknown prompt target "${target}".`,
        });
        continue;
      }

      if (mode === 'reset') {
        if (nextOverrides[target] !== undefined) {
          delete nextOverrides[target];
          promptModified = true;
          appliedChanges.push({
            key: `prompt.${target}`,
            label: `Prompt (${target})`,
            summary: `Reset ${target} prompt to default`,
          });
        }
      } else {
        if (!instruction) continue;
        const base =
          typeof nextOverrides[target] === 'string' && nextOverrides[target].trim().length > 0
            ? nextOverrides[target]
            : PROMPTS[target as keyof typeof PROMPTS] || '';
        const updated = applyCustomPromptInstruction(base, instruction);
        if (updated !== nextOverrides[target]) {
          nextOverrides[target] = updated;
          promptModified = true;
          appliedChanges.push({
            key: `prompt.${target}`,
            label: `Prompt (${target})`,
            summary: `Updated ${target} prompt: "${instruction}"`,
          });
        }
      }
    }

    if (promptModified) {
      undoPatch.chromeAiPromptOverrides = currentOverrides;
      nextPatch.chromeAiPromptOverrides = nextOverrides;
    }
  }

  // Validate and apply panel auto-open rule changes
  if (Array.isArray(parsed.panelRuleChanges) && parsed.panelRuleChanges.length > 0) {
    const rules = [...(nextPanelSettings.rules || [])];
    for (const ruleChange of parsed.panelRuleChanges) {
      if (!ruleChange || typeof ruleChange !== 'object') continue;
      const op = String(ruleChange.op || '');
      const hostname = normalizeHostname(ruleChange.hostname || '');
      if (!hostname) {
        unsupported.push({
          request: `Panel rule (${op})`,
          reason: 'Missing valid hostname for panel rule.',
        });
        continue;
      }
      const website = escapeWebsiteRegex(hostname);
      const topic = String(ruleChange.topic || '').trim();

      if (op === 'remove_site') {
        const before = rules.length;
        const remaining = rules.filter(r => r.website !== website && r.hostname !== hostname);
        if (remaining.length !== before) {
          rules.length = 0;
          rules.push(...remaining);
          panelModified = true;
          appliedChanges.push({
            key: `panelRule.${hostname}`,
            label: `Panel rule (${hostname})`,
            summary: `Removed custom rule(s) for ${hostname}`,
          });
        }
      } else if (op === 'allow_site' || op === 'mute_site') {
        const action = op === 'allow_site' ? 'allow' : 'block';
        const filtered = rules.filter(
          r => !((r.website === website || r.hostname === hostname) && !r.topics?.length)
        );
        filtered.push({
          id: `ai-${hostname}-${action}`,
          name: hostname,
          enabled: true,
          action,
          hostname,
          website,
          ...(action === 'allow' ? { excludeListings: true } : {}),
        });
        rules.length = 0;
        rules.push(...filtered);
        panelModified = true;
        appliedChanges.push({
          key: `panelRule.${hostname}`,
          label: `Panel rule (${hostname})`,
          summary: `${action === 'allow' ? 'Auto-open' : 'Mute'} ${hostname}`,
        });
      } else if ((op === 'allow_topic' || op === 'mute_topic') && topic) {
        const action = op === 'allow_topic' ? 'allow' : 'block';
        rules.push({
          id: `ai-${hostname}-${topic.toLowerCase().replace(/\W+/g, '-')}-${action}`,
          name: `${hostname} · ${topic}`,
          enabled: true,
          action,
          hostname,
          website,
          topics: [topic],
        });
        panelModified = true;
        appliedChanges.push({
          key: `panelRule.${hostname}.${topic}`,
          label: `Panel rule (${hostname})`,
          summary: `${action === 'allow' ? 'Auto-open' : 'Mute'} "${topic}" on ${hostname}`,
        });
      } else {
        unsupported.push({
          request: `Panel rule (${op} for ${hostname})`,
          reason: `Unsupported panel rule operation "${op}".`,
        });
      }
    }
    nextPanelSettings.rules = rules;
  }

  if (panelModified) {
    undoPatch.panelSettings = currentSnapshot.panelSettings
      ? JSON.parse(JSON.stringify(currentSnapshot.panelSettings))
      : {};
    nextPatch.panelSettings = nextPanelSettings;
  }

  const hasChanges = appliedChanges.length > 0;
  const hasUnsupported = unsupported.length > 0;
  const status: ApplySettingsPlanResult['status'] =
    hasChanges && hasUnsupported
      ? 'partial'
      : hasChanges
        ? 'applied'
        : 'unsupported';

  const message =
    typeof parsed.summary === 'string' && parsed.summary.trim()
      ? parsed.summary.trim()
      : hasChanges
        ? `Updated ${appliedChanges.length} setting(s).`
        : 'No supported setting changes were found for that request.';

  return {
    status,
    message,
    appliedChanges,
    unsupported,
    nextStoragePatch: nextPatch,
    undoStoragePatch: undoPatch,
  };
}

