"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/ai-client.ts
var ai_client_exports = {};
__export(ai_client_exports, {
  AIClient: () => AIClient,
  AIError: () => AIError,
  PROVIDER_CATALOG: () => PROVIDER_CATALOG
});
function resolveConfig(settings) {
  const provider = PROVIDER_CATALOG[settings.aiProvider];
  const source = settings.aiSource;
  if (source === "openrouter") {
    const model = provider.openrouterPrefix + settings.aiModel;
    return {
      endpoint: OPENROUTER_ENDPOINT,
      apiKey: settings.aiApiKey,
      model,
      apiFormat: "openai-compatible",
      extraHeaders: {
        "HTTP-Referer": "nutegg-obsidian-plugin",
        "X-Title": "NutEgg"
      }
    };
  }
  return {
    endpoint: provider.officialEndpoint,
    apiKey: settings.aiApiKey,
    model: settings.aiModel,
    apiFormat: provider.apiFormat,
    extraHeaders: provider.apiFormat === "anthropic" ? { "anthropic-version": "2023-06-01" } : {}
  };
}
function classifyError(statusCode, body) {
  const lower = body.toLowerCase();
  if (statusCode === 401) {
    return new AIError("auth_failed", "API key is invalid or missing. Check your API key in NutEgg settings.", statusCode);
  }
  if (statusCode === 403) {
    return new AIError("forbidden", "Access denied. Your API key may not have permission for this model, or your account needs a funded billing plan.", statusCode);
  }
  if (statusCode === 404 || lower.includes("model not found") || lower.includes("model_not_found")) {
    return new AIError("model_not_found", "The selected model was not found. The model name may be incorrect or not available on this endpoint.", statusCode);
  }
  if (statusCode === 429) {
    return new AIError("rate_limited", "Rate limit exceeded. Wait a moment and try again.", statusCode);
  }
  if (statusCode >= 500) {
    return new AIError("server_error", `The AI service returned a server error (${statusCode}). It may be temporarily down \u2014 try again shortly.`, statusCode);
  }
  if (lower.includes("quota") || lower.includes("insufficient") || lower.includes("balance") || lower.includes("billing")) {
    return new AIError("quota_exceeded", "API quota exceeded or insufficient funds. Check your account balance or billing settings.", statusCode);
  }
  const snippet = body.slice(0, 300);
  return new AIError("unknown", `API error (${statusCode}): ${snippet}`, statusCode);
}
var PROVIDER_CATALOG, OPENROUTER_ENDPOINT, AIError, AIClient;
var init_ai_client = __esm({
  "src/ai-client.ts"() {
    "use strict";
    PROVIDER_CATALOG = {
      anthropic: {
        id: "anthropic",
        label: "Anthropic (Claude)",
        officialEndpoint: "https://api.anthropic.com/v1/messages",
        apiFormat: "anthropic",
        models: [
          "claude-opus-5",
          "claude-sonnet-5",
          "claude-haiku-4-5-20251001"
        ],
        keyPlaceholder: "sk-ant-...",
        openrouterPrefix: "anthropic/"
      },
      deepseek: {
        id: "deepseek",
        label: "DeepSeek",
        officialEndpoint: "https://api.deepseek.com/v1/chat/completions",
        apiFormat: "openai-compatible",
        models: ["deepseek-chat", "deepseek-reasoner"],
        keyPlaceholder: "sk-...",
        openrouterPrefix: "deepseek/"
      },
      gemini: {
        id: "gemini",
        label: "Google Gemini",
        officialEndpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        apiFormat: "openai-compatible",
        models: [
          "gemini-2.5-pro",
          "gemini-2.5-flash",
          "gemini-2.0-flash"
        ],
        keyPlaceholder: "AIza...",
        openrouterPrefix: "google/"
      },
      openai: {
        id: "openai",
        label: "OpenAI",
        officialEndpoint: "https://api.openai.com/v1/chat/completions",
        apiFormat: "openai-compatible",
        models: ["gpt-4o", "gpt-4o-mini", "o3-mini", "o1"],
        keyPlaceholder: "sk-...",
        openrouterPrefix: "openai/"
      },
      kimi: {
        id: "kimi",
        label: "Kimi (Moonshot)",
        officialEndpoint: "https://api.moonshot.cn/v1/chat/completions",
        apiFormat: "openai-compatible",
        models: [
          "moonshot-v1-8k",
          "moonshot-v1-32k",
          "moonshot-v1-128k"
        ],
        keyPlaceholder: "sk-...",
        openrouterPrefix: "moonshot/"
      },
      zhipu: {
        id: "zhipu",
        label: "Zhipu (GLM)",
        officialEndpoint: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
        apiFormat: "openai-compatible",
        models: ["glm-4-plus", "glm-4-air", "glm-4-flash"],
        keyPlaceholder: "...",
        openrouterPrefix: "zhipu/"
      },
      qwen: {
        id: "qwen",
        label: "Qwen (Tongyi)",
        officialEndpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
        apiFormat: "openai-compatible",
        models: ["qwen-max", "qwen-plus", "qwen-turbo"],
        keyPlaceholder: "sk-...",
        openrouterPrefix: "qwen/"
      }
    };
    OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
    AIError = class extends Error {
      code;
      statusCode;
      constructor(code, message, statusCode) {
        super(message);
        this.name = "AIError";
        this.code = code;
        this.statusCode = statusCode ?? null;
      }
    };
    AIClient = class {
      config;
      constructor(settings) {
        this.config = resolveConfig(settings);
      }
      async chat(prompt, maxTokens) {
        if (!this.config.apiKey) {
          throw new AIError(
            "no_api_key",
            "No AI API key configured. Open Obsidian Settings \u2192 NutEgg, enable Developer Mode, and add your API key."
          );
        }
        if (this.config.apiFormat === "anthropic") {
          return this.chatAnthropic(prompt, maxTokens);
        }
        return this.chatOpenAICompatible(prompt, maxTokens);
      }
      // --- Anthropic-native format ---
      async chatAnthropic(prompt, maxTokens) {
        let response;
        try {
          response = await fetch(this.config.endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": this.config.apiKey,
              ...this.config.extraHeaders
            },
            body: JSON.stringify({
              model: this.config.model,
              max_tokens: maxTokens,
              messages: [{ role: "user", content: prompt }]
            })
          });
        } catch {
          throw new AIError(
            "network_error",
            "Cannot reach the AI API. Check your internet connection. If using a custom endpoint, verify the URL is correct."
          );
        }
        if (!response.ok) {
          const err = await response.text();
          throw classifyError(response.status, err);
        }
        const data = await response.json();
        return data?.content?.[0]?.text || "";
      }
      // --- OpenAI-compatible format ---
      async chatOpenAICompatible(prompt, maxTokens) {
        let response;
        try {
          response = await fetch(this.config.endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${this.config.apiKey}`,
              ...this.config.extraHeaders
            },
            body: JSON.stringify({
              model: this.config.model,
              max_completion_tokens: maxTokens,
              messages: [{ role: "user", content: prompt }]
            })
          });
        } catch {
          throw new AIError(
            "network_error",
            "Cannot reach the AI API. Check your internet connection. If using a custom endpoint, verify the URL is correct."
          );
        }
        if (!response.ok) {
          const err = await response.text();
          throw classifyError(response.status, err);
        }
        const data = await response.json();
        return data?.choices?.[0]?.message?.content || "";
      }
    };
  }
});

// tests/ai-processor.test.ts
var import_node_test = require("node:test");
var import_strict = __toESM(require("node:assert/strict"));

// src/ai-processor.ts
init_ai_client();

// src/prompts/content-analysis.md
var content_analysis_default = `You are a knowledge curator. Analyze the content below following this Action Guide.

## Action Guide
{{action_guide}}

## Content to Analyze
**Title:** {{title}}
**Source:** {{url}}
**Type:** {{source_type}}
{{chapters}}
{{questions}}
{{egg_key_questions}}

{{content}}

Respond in this EXACT JSON format (no markdown, no code fence, just the JSON object):
{
  "titleVerdict": "direct answer to the title's question",
  "coreSummary": ["bullet 1", "bullet 2", "bullet 3"],
  "isLongForm": true,
  "chapterMap": [
    {"time": "00:12:34", "title": "chapter title", "summary": "one sentence"}
  ],
  "customQuestionAnswers": [
    {"question": "exact question text", "answer": "direct answer"}
  ]
}

IMPORTANT:
- Grounding: {{grounding_rule}}
- titleVerdict must be a single sentence.
- coreSummary: at most 3 bullets, plain language.
- isLongForm: true only for long articles/videos that meaningfully benefit from a chapter map.
- chapterMap: empty array when isLongForm is false. When video chapters are provided, keep their exact timestamps and titles, and only add your 1-sentence summary.
- customQuestionAnswers: one entry per DISTINCT user question (empty array when none). Skip any user question that is equivalent in meaning to an Egg Key Question above or to another user question \u2014 answer it only once.
`;

// src/prompts/egg-analysis.md
var egg_analysis_default = `You are a knowledge curator for the egg file "{{egg_file}}". Analyze the content below against this egg's instructions.

## Egg Instructions
{{egg_instructions}}

## Content to Analyze
**Title:** {{title}}
**Source:** {{url}}
**Type:** {{source_type}}

{{content}}

## Task
1. Answer each Key Question (if any) directly and concisely. Grounding: {{grounding_rule}}
2. Novel Delta: identify genuinely NEW insights vs the Current Knowledge AND the Unprocessed entries. If the content is entirely redundant, return an empty array.
3. Apply the Rejection Criteria \u2014 if the content should be rejected, set rejected to true and give a one-line reason.
4. Decide: should the user spend time reading/watching this fully? Consider the reject criteria and whether it adds new insight.

For each Novel Delta entry:
- "parent": the EXACT text of the existing bullet or heading in the Current Knowledge tree that best fits the new information \u2014 used as a suggestion when the entry is merged into the tree later. Use "" if no suitable parent exists.
- "content": ONE insight per entry, as a single top-level bullet with optional indented sub-bullets. Include concrete examples from the content that illustrate the insight (e.g. "  - \u{1F3AF} Example: ...") when present. Follow the Formatting Rules. Do NOT include author or source \u2014 they are appended automatically.

Respond in this EXACT JSON format (no markdown, no code fence, just the JSON object):
{
  "keyQuestionAnswers": [
    {"question": "exact question text", "answer": "direct answer"}
  ],
  "novelDelta": [
    {"parent": "exact anchor text from the knowledge tree", "content": "- nested bullet\\n  - sub bullet"}
  ],
  "rejected": false,
  "rejectReason": "",
  "readVerdict": true,
  "readVerdictReason": "one-line reason"
}
`;

// src/prompts/egg-combined.md
var egg_combined_default = `You are a knowledge curator for the egg file "{{egg_file}}". Analyze the content below against this egg's instructions.

## Egg Instructions
{{egg_instructions}}

## Content to Analyze
**Title:** {{title}}
**Source:** {{url}}
**Type:** {{source_type}}
{{chapters}}
{{questions}}

{{content}}

## Task
Follow the Action Guide steps, answer the Key Questions, answer the User Questions, and extract the Novel Delta against the Current Knowledge.

Respond in this EXACT JSON format (no markdown, no code fence, just the JSON object):
{
  "titleVerdict": "direct answer to the title's question",
  "coreSummary": ["bullet 1", "bullet 2", "bullet 3"],
  "isLongForm": true,
  "chapterMap": [
    {"time": "00:12:34", "title": "chapter title", "summary": "one sentence"}
  ],
  "keyQuestionAnswers": [
    {"question": "exact question text", "answer": "direct answer"}
  ],
  "customQuestionAnswers": [
    {"question": "exact question text", "answer": "direct answer"}
  ],
  "novelDelta": [
    {"parent": "exact anchor text from the knowledge tree", "content": "- nested bullet\\n  - sub bullet"}
  ],
  "rejected": false,
  "rejectReason": "",
  "readVerdict": true,
  "readVerdictReason": "one-line reason"
}

IMPORTANT:
- Grounding: {{grounding_rule}}
- coreSummary: at most 3 bullets. chapterMap: empty array when isLongForm is false; keep exact timestamps from the video chapters when provided.
- customQuestionAnswers: one entry per DISTINCT user question (empty array when none). Skip any user question that is equivalent in meaning to the egg's Key Questions above or to another user question \u2014 answer it only once.
- For each Novel Delta entry: "parent" is the EXACT text of the existing bullet or heading it best fits under ("" if none) \u2014 a suggestion used when the entry is merged into the tree later. "content" is ONE insight per entry: a single top-level bullet, plus concrete examples from the content as indented sub-bullets (e.g. "  - \u{1F3AF} Example: ...") when present. Follow the Formatting Rules. Do NOT include author or source \u2014 they are appended automatically.
- Novel Delta must be genuinely NEW vs the Current Knowledge AND the Unprocessed entries.
- Apply the Rejection Criteria strictly \u2014 set rejected to true when the content is noise for this egg.
`;

// src/prompts/follow-up.md
var follow_up_default = `You are a knowledge curator. Answer the user's follow-up questions about this content.

## Content to Analyze
**Title:** {{title}}
**Source:** {{url}}
**Type:** {{source_type}}
{{prior_qa}}

{{content}}

## New Questions (answer each directly and concisely)
{{questions}}

Respond in this EXACT JSON format (no markdown, no code fence, just the JSON object):
{
  "answers": [
    {"question": "exact question text", "answer": "direct answer"}
  ]
}

IMPORTANT:
- One entry per question, in the same order.
- Grounding: {{grounding_rule}}
- If a question is equivalent to one in Previous Questions & Answers, answer briefly with the same conclusion instead of repeating it.
`;

// src/prompts/egg-routing.md
var egg_routing_default = 'Given this content and egg index, which egg file(s) does this content belong to? Return ONLY the file names, one per line. If none match, return "none".\n\n## Content\nTitle: {{title}}\nURL: {{url}}\n{{content}}\n\n## Egg Index\n{{index}}\n\nReturn matching file names (one per line):\n';

// src/prompts/action-guide-default.md
var action_guide_default_default = "1. Title Verdict: Provide a single, direct sentence that resolves the core question posed in the title or introduction.\n2. Core Summary: Summarize the main concepts in plain language using a maximum of 3 bullet points.\n3. Chapter Map (Long-form only): If the content is a long article or lengthy video, provide a brief 1-sentence summary for each major section or topic shift. If it is short, omit this step entirely.\n";

// src/prompts/merge-unprocessed.md
var merge_unprocessed_default = `You are a knowledge curator for the egg file "{{egg_file}}". The Unprocessed section has accumulated {{unprocessed_count}} entries \u2014 merge them into the knowledge tree below.

## Formatting Rules
{{formatting_rules}}

## Existing Knowledge Tree
{{knowledge_tree}}

## Unprocessed Entries
{{unprocessed}}

## Task
1. PRESERVE the existing tree structure as much as possible: do not rename, restructure, or delete existing branches \u2014 the user may have edited them by hand.
2. Nest each unprocessed entry under the most relevant existing concept as sub-bullets.
3. Only when an entry matches no existing concept, create a new minimal top-level branch for it.
4. Keep each entry's insight, concrete examples, and its _author/_source lines intact when moving it into the tree.
5. If an entry duplicates existing knowledge, drop it entirely.
6. If an entry cannot be merged meaningfully, leave it in the "unprocessed" output.

Respond in this EXACT JSON format (no markdown, no code fence, just the JSON object):
{
  "knowledge": "the COMPLETE updated Knowledge section content as markdown \u2014 the existing tree with the merged entries nested in",
  "unprocessed": "the entries that could not be merged (markdown), or an empty string when all were merged"
}
`;

// src/prompt-templates.ts
var PROMPTS = {
  /** Phase 1 — content summary + chapter map + custom question answers. */
  contentAnalysis: content_analysis_default,
  /** Phase 2 — content against one egg (key questions, delta, reject, verdict). */
  eggAnalysis: egg_analysis_default,
  /** Single-egg combined call (phases 1 + 2 in one prompt). */
  eggCombined: egg_combined_default,
  /** Follow-up questions after the initial analysis. */
  followUp: follow_up_default,
  /** Egg routing — match content to egg files from _index.md. */
  eggRouting: egg_routing_default,
  /** Default Action Guide when no egg provides one. */
  actionGuideDefault: action_guide_default_default.trim(),
  /** Merge 20+ Unprocessed entries into the Knowledge tree. */
  mergeUnprocessed: merge_unprocessed_default
};
function renderPrompt(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = vars[key];
    return value === void 0 ? "" : String(value);
  });
}

// src/prompts/grounding-rule.md
var grounding_rule_default = 'The content is the ONLY source of truth for every answer and summary you produce. Report what the content actually says even when it contradicts common sense or well-known facts \u2014 never correct, refute, or supplement it with outside knowledge. If the content does not address a question, say "Not covered in this content".\n';

// src/ai-processor.ts
var GROUNDING_RULE = grounding_rule_default.trim();
var MERGE_THRESHOLD = 20;
var AIProcessor = class {
  plugin;
  constructor(plugin) {
    this.plugin = plugin;
  }
  async analyze(capture2, eggs) {
    if (!this.plugin.settings.aiApiKey) {
      return this.fallbackAnalysis(capture2, eggs);
    }
    let contentAnalysis;
    let eggResults = [];
    if (eggs.length === 1) {
      const combined = await this.analyzeSingleEgg(capture2, eggs[0]);
      contentAnalysis = {
        titleVerdict: combined.titleVerdict,
        coreSummary: combined.coreSummary,
        isLongForm: combined.isLongForm,
        chapterMap: combined.chapterMap,
        customQuestionAnswers: combined.customQuestionAnswers
      };
      eggResults = [combined];
    } else {
      const guide = (eggs[0]?.actionGuide || PROMPTS.actionGuideDefault).trim();
      contentAnalysis = await this.analyzeContent(
        capture2,
        guide,
        eggs.flatMap((e) => e.keyQuestions)
      );
      eggResults = (await Promise.all(
        eggs.map((egg2) => this.analyzeAgainstEgg(capture2, egg2))
      )).filter((r) => r !== null);
    }
    const verdict = this.mergeVerdict(eggResults);
    const newKnowledge = eggResults.flatMap(
      (r) => r.novelDelta.map((d) => ({
        egg: r.egg,
        parent: d.parent,
        content: d.content
      }))
    );
    return {
      ...contentAnalysis,
      ...verdict,
      matchedEggs: eggs.map((e) => e.fileName),
      eggResults,
      newKnowledge
    };
  }
  /** Phase 1 — content-level summary + chapter map + custom question answers. */
  async analyzeContent(capture2, actionGuide, eggKeyQuestions) {
    const prompt = renderPrompt(PROMPTS.contentAnalysis, {
      action_guide: actionGuide,
      title: capture2.title,
      url: capture2.url,
      source_type: capture2.sourceType,
      chapters: this.chaptersBlock(capture2.chapters),
      questions: this.questionsBlock(
        capture2.questions,
        "User Questions (answer each directly and concisely)"
      ),
      egg_key_questions: this.questionsBlock(
        eggKeyQuestions,
        "Egg Key Questions (answered separately \u2014 skip equivalent user questions)"
      ),
      content: this.truncate(capture2.content, 8e3),
      grounding_rule: GROUNDING_RULE
    });
    const response = await this.callAI(prompt, 800);
    const parsed = this.parseJson(response);
    return {
      titleVerdict: String(parsed.titleVerdict || "Could not generate a verdict."),
      coreSummary: Array.isArray(parsed.coreSummary) ? parsed.coreSummary.map(String).slice(0, 3) : [],
      isLongForm: parsed.isLongForm === true,
      chapterMap: Array.isArray(parsed.chapterMap) ? parsed.chapterMap.filter((c) => c && (c.time || c.title)).map((c) => ({
        time: String(c.time || ""),
        title: String(c.title || ""),
        summary: String(c.summary || "")
      })) : [],
      customQuestionAnswers: this.parseKeyAnswers(parsed.customQuestionAnswers)
    };
  }
  /** Phase 2 — content against one egg: key questions, delta, reject, verdict. */
  async analyzeAgainstEgg(capture2, egg2) {
    const prompt = renderPrompt(PROMPTS.eggAnalysis, {
      egg_file: egg2.fileName,
      egg_instructions: this.plugin.eggParser.formatEggForPrompt(egg2),
      title: capture2.title,
      url: capture2.url,
      source_type: capture2.sourceType,
      content: this.truncate(capture2.content, 6e3),
      grounding_rule: GROUNDING_RULE
    });
    try {
      const response = await this.callAI(prompt, 800);
      const parsed = this.parseJson(response);
      return {
        egg: egg2.fileName,
        keyQuestionAnswers: this.parseKeyAnswers(parsed.keyQuestionAnswers),
        novelDelta: Array.isArray(parsed.novelDelta) ? parsed.novelDelta.filter((d) => d && d.content).map((d) => ({
          parent: String(d.parent || ""),
          content: String(d.content)
        })) : [],
        rejected: parsed.rejected === true,
        rejectReason: String(parsed.rejectReason || ""),
        readVerdict: parsed.readVerdict !== false,
        readVerdictReason: String(parsed.readVerdictReason || "")
      };
    } catch (err) {
      if (err instanceof AIError)
        throw err;
      console.error(`[NutEgg] Egg analysis failed for ${egg2.fileName}:`, err);
      return null;
    }
  }
  /** Single combined call — used when exactly one egg matches. */
  async analyzeSingleEgg(capture2, egg2) {
    const prompt = renderPrompt(PROMPTS.eggCombined, {
      egg_file: egg2.fileName,
      egg_instructions: this.plugin.eggParser.formatEggForPrompt(egg2),
      title: capture2.title,
      url: capture2.url,
      source_type: capture2.sourceType,
      chapters: this.chaptersBlock(capture2.chapters),
      questions: this.questionsBlock(
        capture2.questions,
        "User Questions (answer each directly and concisely)"
      ),
      content: this.truncate(capture2.content, 8e3),
      grounding_rule: GROUNDING_RULE
    });
    const response = await this.callAI(prompt, 1e3);
    const parsed = this.parseJson(response);
    return {
      titleVerdict: String(parsed.titleVerdict || "Could not generate a verdict."),
      coreSummary: Array.isArray(parsed.coreSummary) ? parsed.coreSummary.map(String).slice(0, 3) : [],
      isLongForm: parsed.isLongForm === true,
      chapterMap: Array.isArray(parsed.chapterMap) ? parsed.chapterMap.filter((c) => c && (c.time || c.title)).map((c) => ({
        time: String(c.time || ""),
        title: String(c.title || ""),
        summary: String(c.summary || "")
      })) : [],
      customQuestionAnswers: this.parseKeyAnswers(parsed.customQuestionAnswers),
      egg: egg2.fileName,
      keyQuestionAnswers: this.parseKeyAnswers(parsed.keyQuestionAnswers),
      novelDelta: Array.isArray(parsed.novelDelta) ? parsed.novelDelta.filter((d) => d && d.content).map((d) => ({
        parent: String(d.parent || ""),
        content: String(d.content)
      })) : [],
      rejected: parsed.rejected === true,
      rejectReason: String(parsed.rejectReason || ""),
      readVerdict: parsed.readVerdict !== false,
      readVerdictReason: String(parsed.readVerdictReason || "")
    };
  }
  /** Combine per-egg verdicts into one global read recommendation. */
  mergeVerdict(eggResults) {
    if (eggResults.length === 0) {
      return {
        shouldRead: true,
        shouldReadReason: "No matching egg found \u2014 review the summary above."
      };
    }
    const rejectedAll = eggResults.every((r) => r.rejected);
    if (rejectedAll) {
      return {
        shouldRead: false,
        shouldReadReason: eggResults.map((r) => r.rejectReason).filter(Boolean).join(" ") || "Rejected by all matched eggs."
      };
    }
    const forReading = eggResults.filter((r) => r.readVerdict);
    const reasons = forReading.map((r) => r.readVerdictReason).filter(Boolean);
    return {
      shouldRead: forReading.length > 0,
      shouldReadReason: reasons.join(" ") || (forReading.length > 0 ? "See key question answers and novel delta below." : "No new knowledge found \u2014 the summary above likely covers it.")
    };
  }
  /** No-API-key fallback: naive content summary, no egg analysis. */
  fallbackAnalysis(capture2, eggs) {
    const firstSentence = capture2.content.match(/^[^.!?]+[.!?]/)?.[0]?.trim() || capture2.title;
    return {
      titleVerdict: firstSentence,
      coreSummary: [
        `Source: ${capture2.title}`,
        "(Configure an API key in NutEgg settings for AI analysis)"
      ],
      isLongForm: false,
      chapterMap: [],
      customQuestionAnswers: (capture2.questions || []).map((q) => ({
        question: q,
        answer: "No API key configured \u2014 cannot answer."
      })),
      shouldRead: true,
      shouldReadReason: "No API key configured \u2014 cannot analyze.",
      matchedEggs: eggs.map((e) => e.fileName),
      eggResults: [],
      newKnowledge: []
    };
  }
  /**
   * Answer follow-up questions after the initial analysis — one lightweight
   * call, grounded in the same content. Previous Q&A pairs are included as
   * context so the model can refer back instead of repeating answers.
   */
  async askFollowUp(capture2, questions, priorQa) {
    if (questions.length === 0)
      return [];
    if (!this.plugin.settings.aiApiKey) {
      return questions.map((q) => ({
        question: q,
        answer: "No API key configured \u2014 cannot answer."
      }));
    }
    const priorBlock = priorQa.length > 0 ? `## Previous Questions & Answers (context \u2014 refer back instead of repeating)
${priorQa.map((qa) => `Q: ${qa.question}
A: ${qa.answer}`).join("\n")}` : "";
    const prompt = renderPrompt(PROMPTS.followUp, {
      title: capture2.title,
      url: capture2.url,
      source_type: capture2.sourceType,
      prior_qa: priorBlock,
      content: this.truncate(capture2.content, 8e3),
      questions: questions.map((q, i) => `${i + 1}. ${q}`).join("\n"),
      grounding_rule: GROUNDING_RULE
    });
    try {
      const response = await this.callAI(prompt, 500);
      const parsed = this.parseJson(response);
      const answers = this.parseKeyAnswers(parsed.answers);
      const byQuestion = new Map(answers.map((a) => [a.question, a]));
      return questions.map((q) => ({
        question: q,
        answer: byQuestion.get(q)?.answer || "No answer returned \u2014 please try again."
      }));
    } catch (err) {
      if (err instanceof AIError)
        throw err;
      console.error("[NutEgg] Follow-up question failed:", err);
      return questions.map((q) => ({
        question: q,
        answer: "Failed to answer \u2014 please try again."
      }));
    }
  }
  /**
   * Merge an egg's Unprocessed entries into its Knowledge tree once
   * MERGE_THRESHOLD is reached. Best-effort: on any failure the egg is left
   * untouched and the entries stay in Unprocessed for the next attempt.
   */
  async maybeMergeEgg(fileName) {
    const egg2 = await this.plugin.eggParser.readEgg(fileName);
    if (!egg2)
      return null;
    const entries = this.plugin.eggParser.countUnprocessed(egg2);
    if (entries < MERGE_THRESHOLD)
      return null;
    if (!this.plugin.settings.aiApiKey) {
      console.log(
        `[NutEgg] ${fileName} has ${entries} unprocessed entries \u2014 skipped merge (no API key)`
      );
      return null;
    }
    const prompt = renderPrompt(PROMPTS.mergeUnprocessed, {
      egg_file: fileName,
      formatting_rules: egg2.formattingRules || "(none)",
      knowledge_tree: egg2.knowledge || "(empty)",
      unprocessed: egg2.unprocessed,
      unprocessed_count: entries
    });
    try {
      const response = await this.callAI(prompt, 2e3);
      const parsed = this.parseJson(response);
      const knowledge = typeof parsed.knowledge === "string" ? parsed.knowledge.trim() : "";
      if (!knowledge) {
        console.warn(
          `[NutEgg] Merge for ${fileName} returned no knowledge \u2014 egg untouched`
        );
        return null;
      }
      const unprocessed = typeof parsed.unprocessed === "string" ? parsed.unprocessed.trim() : "";
      await this.plugin.eggParser.applyMerge(fileName, knowledge, unprocessed);
      console.log(`[NutEgg] Merged ${entries} unprocessed entries into ${fileName}`);
      return { egg: fileName, entries };
    } catch (err) {
      console.error(`[NutEgg] Merge failed for ${fileName}:`, err);
      return null;
    }
  }
  // --- Prompt building helpers ---
  /** `## Video Chapters (use these EXACT timestamps)` block, or "". */
  chaptersBlock(chapters) {
    if (!chapters?.length)
      return "";
    return `## Video Chapters (use these EXACT timestamps)
${chapters.map((c) => `- ${c.time} \u2014 ${c.title}`).join("\n")}`;
  }
  /** Numbered questions block with a heading, or "". */
  questionsBlock(questions, heading) {
    if (!questions?.length)
      return "";
    return `## ${heading}
${questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`;
  }
  async callAI(prompt, maxTokens) {
    return await this.plugin.aiClient.chat(prompt, maxTokens);
  }
  /** Normalize a `[{question, answer}]` array from the AI response. */
  parseKeyAnswers(raw) {
    return Array.isArray(raw) ? raw.filter((qa) => qa && qa.question && qa.answer).map((qa) => ({
      question: String(qa.question),
      answer: String(qa.answer)
    })) : [];
  }
  /** Parse an AI response that should be JSON, stripping markdown fences. */
  parseJson(response) {
    let jsonStr = response.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
    }
    try {
      return JSON.parse(jsonStr);
    } catch {
      const braceMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (braceMatch) {
        try {
          return JSON.parse(braceMatch[0]);
        } catch {
        }
      }
      console.warn("[NutEgg] Failed to parse AI JSON response");
      return {};
    }
  }
  truncate(text, maxChars) {
    if (text.length <= maxChars)
      return text;
    return text.substring(0, maxChars) + "\n\n[...truncated]";
  }
};

// src/egg-parser.ts
var EggParser = class {
  plugin;
  constructor(plugin) {
    this.plugin = plugin;
  }
  async readEgg(fileName) {
    const file = this.plugin.app.vault.getAbstractFileByPath(fileName);
    if (!file) {
      console.warn(`[NutEgg] Egg file not found: ${fileName}`);
      return null;
    }
    const content = await this.plugin.app.vault.read(file);
    return this.parseEggFile(fileName, content);
  }
  async readEggs(entries) {
    const eggs = [];
    for (const entry of entries) {
      const egg2 = await this.readEgg(entry.fileName);
      if (egg2)
        eggs.push(egg2);
    }
    return eggs;
  }
  parseEggFile(fileName, content) {
    const result = {
      fileName,
      topic: "Unknown",
      scope: "",
      actionGuide: "",
      keyQuestions: [],
      rejectionCriteria: [],
      formattingRules: "",
      knowledge: "",
      unprocessed: ""
    };
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (fmMatch) {
      for (const line of fmMatch[1].split("\n")) {
        const kv = line.match(/^(\w+):\s*(.*)$/);
        if (!kv)
          continue;
        const key = kv[1].toLowerCase();
        const value = kv[2].trim().replace(/^"(.*)"$/, "$1");
        if (key === "topic")
          result.topic = value;
      }
    }
    const callout = this.extractCallout(content);
    const sections = callout ? this.splitLabeledSections(callout) : /* @__PURE__ */ new Map();
    result.scope = (sections.get("scope") || "").trim();
    result.actionGuide = (sections.get("action guide") || "").trim();
    result.keyQuestions = this.parseListItems(sections.get("key questions") || "");
    result.rejectionCriteria = this.parseListItems(sections.get("rejection criteria") || "");
    result.formattingRules = (sections.get("formatting rules") || "").trim();
    const lines = content.split("\n");
    const knowledgeSection = this.findSection(lines, "knowledge");
    if (knowledgeSection) {
      result.knowledge = this.sectionBody(lines, knowledgeSection);
    }
    const unprocessedSection = this.findSection(lines, "unprocessed");
    if (unprocessedSection) {
      result.unprocessed = this.sectionBody(lines, unprocessedSection);
    }
    return result;
  }
  /**
   * Section content without the surrounding blank lines. Indentation of the
   * first line is preserved (unlike trim()) so re-indented sections survive.
   */
  sectionBody(lines, section) {
    return lines.slice(section.start + 1, section.end).join("\n").replace(/^\n+|\n+$/g, "");
  }
  /** Format one egg's instructions + knowledge for an AI prompt. */
  formatEggForPrompt(egg2) {
    const parts = [];
    parts.push(`**Scope:** ${egg2.scope || "(not specified)"}`);
    if (egg2.keyQuestions.length > 0) {
      parts.push(
        `**Key Questions:**
${egg2.keyQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`
      );
    }
    if (egg2.rejectionCriteria.length > 0) {
      parts.push(
        `**Rejection Criteria:**
${egg2.rejectionCriteria.map((c) => `- ${c}`).join("\n")}`
      );
    }
    if (egg2.formattingRules) {
      parts.push(`**Formatting Rules:**
${egg2.formattingRules}`);
    }
    parts.push(
      `**Current Knowledge:**
${egg2.knowledge || "(empty)"}`
    );
    if (egg2.unprocessed.trim()) {
      parts.push(
        `**Unprocessed (pending merge):**
${egg2.unprocessed}`
      );
    }
    return parts.join("\n\n");
  }
  /**
   * Append one new knowledge entry to the egg's Unprocessed section.
   *
   * Entries land here first and are merged into the Knowledge tree later,
   * once 20+ accumulate (see ai-processor.maybeMergeEgg). Each entry keeps
   * its insight + examples (AI-generated `content`), plus mechanical
   * `_author` / `_source` lines for provenance.
   */
  async appendUnprocessed(fileName, content, author, sourceTitle, sourceUrl) {
    const file = this.plugin.app.vault.getAbstractFileByPath(fileName);
    if (!file) {
      console.warn(`[NutEgg] Cannot append \u2014 egg file not found: ${fileName}`);
      return;
    }
    const existing = await this.plugin.app.vault.read(file);
    const lines = existing.replace(/\n+$/, "").split("\n");
    const section = this.findSection(lines, "unprocessed");
    const trimmed = content.trim();
    const withBullet = /^[-*]\s/.test(trimmed) ? trimmed : `- ${trimmed}`;
    const meta = [];
    if (author)
      meta.push(`_author: ${author}_`);
    const safeTitle = sourceTitle.replace(/[[\]]/g, "");
    meta.push(`_source: [${safeTitle || "source"}](${sourceUrl})_`);
    const block = [withBullet, ...meta].join("\n");
    if (section) {
      lines.splice(section.end, 0, "", block);
    } else {
      lines.push("", "## Unprocessed", "", block);
    }
    await this.plugin.app.vault.modify(file, lines.join("\n") + "\n");
    console.log(`[NutEgg] Added unprocessed entry to ${fileName}`);
  }
  /** Count top-level entries in the Unprocessed section (sub-bullets don't count). */
  countUnprocessed(egg2) {
    const indentOf = (l) => (l.match(/^\s*/) || [""])[0].length;
    const bullets = egg2.unprocessed.split("\n").map((l) => l.replace(/\s+$/, "")).filter((l) => /^\s*[-*]\s/.test(l));
    if (bullets.length === 0)
      return 0;
    const base = Math.min(...bullets.map(indentOf));
    return bullets.filter((l) => indentOf(l) === base).length;
  }
  /**
   * Replace the Knowledge and Unprocessed sections with the merged output
   * from the merge AI call. Missing sections are created as needed.
   */
  async applyMerge(fileName, knowledge, unprocessed) {
    const file = this.plugin.app.vault.getAbstractFileByPath(fileName);
    if (!file) {
      console.warn(`[NutEgg] Cannot merge \u2014 egg file not found: ${fileName}`);
      return;
    }
    const existing = await this.plugin.app.vault.read(file);
    let lines = existing.replace(/\n+$/, "").split("\n");
    const knowledgeSection = this.findSection(lines, "knowledge");
    if (knowledgeSection) {
      lines = [
        ...lines.slice(0, knowledgeSection.start + 1),
        "",
        ...knowledge.trim().split("\n"),
        ...lines.slice(knowledgeSection.end)
      ];
    } else {
      lines = [...lines, "", "## Knowledge", "", ...knowledge.trim().split("\n")];
    }
    const unprocessedSection = this.findSection(lines, "unprocessed");
    const remainder = unprocessed.trim();
    if (unprocessedSection) {
      lines = [
        ...lines.slice(0, unprocessedSection.start + 1),
        ...remainder ? ["", ...remainder.split("\n")] : [],
        ...lines.slice(unprocessedSection.end)
      ];
    } else if (remainder) {
      lines = [...lines, "", "## Unprocessed", "", ...remainder.split("\n")];
    }
    await this.plugin.app.vault.modify(file, lines.join("\n") + "\n");
    console.log(`[NutEgg] Merged knowledge tree in ${fileName}`);
  }
  /**
   * Locate a `## Name`-style section: `{start, level, end}`. `end` is the
   * index of the next heading of the same-or-higher level (or lines.length).
   * Returns null when the heading doesn't exist.
   */
  findSection(lines, name) {
    const start = lines.findIndex((l) => {
      const m = l.trim().match(/^(#{1,6})\s*(.*)$/);
      return m !== null && m[2].trim().toLowerCase() === name.toLowerCase();
    });
    if (start === -1)
      return null;
    const level = (lines[start].match(/^#+/) || [""])[0].length;
    const end = lines.findIndex((l, i) => {
      if (i <= start)
        return false;
      const m = l.trim().match(/^(#{1,6})\s/);
      return m !== null && m[1].length <= level;
    });
    return { start, level, end: end === -1 ? lines.length : end };
  }
  /** Extract the `> [!abstract]- Instructions:` callout body (lines without `>`). */
  extractCallout(content) {
    const calloutLines = [];
    for (const line of content.split("\n")) {
      if (line.startsWith(">")) {
        calloutLines.push(line.replace(/^>\s?/, ""));
      } else if (calloutLines.length > 0) {
        break;
      }
    }
    if (calloutLines.length === 0)
      return null;
    const marker = calloutLines.findIndex((l) => l.includes("[!abstract]"));
    const body = marker >= 0 ? calloutLines.slice(marker + 1) : calloutLines.slice(1);
    return body.join("\n");
  }
  /** Split instruction text into sections by `**Label:**` lines (content may follow on the same line). */
  splitLabeledSections(text) {
    const map = /* @__PURE__ */ new Map();
    let current = null;
    let buffer = [];
    for (const line of text.split("\n")) {
      const labelMatch = line.match(/^\*\*([^*]+?):\*\*\s*(.*)$/);
      if (labelMatch) {
        if (current)
          map.set(current, buffer.join("\n"));
        current = labelMatch[1].toLowerCase();
        buffer = labelMatch[2] ? [labelMatch[2]] : [];
      } else {
        buffer.push(line);
      }
    }
    if (current)
      map.set(current, buffer.join("\n"));
    return map;
  }
  /** Parse numbered (`1.`) or bulleted (`-`) list items, stripping markers. */
  parseListItems(text) {
    return text.split("\n").map((l) => l.trim()).filter((l) => /^(?:\d+[.)]|[-*])\s+/.test(l)).map((l) => l.replace(/^(?:\d+[.)]|[-*])\s+/, ""));
  }
};

// tests/helpers.ts
function makeFakeVault(initial = {}) {
  const files = new Map(Object.entries(initial));
  const basePath = "/fake/vault";
  const adapter = {
    exists: async (p) => files.has(p) || [...files.keys()].some((k) => k.startsWith(p + "/")),
    read: async (p) => {
      if (!files.has(p))
        throw new Error("File not found: " + p);
      return files.get(p);
    },
    remove: async (p) => {
      files.delete(p);
    },
    append: async (p, data) => {
      files.set(p, (files.get(p) ?? "") + data);
    },
    getBasePath: () => basePath
  };
  const vault = {
    adapter,
    create: async (p, content) => {
      files.set(p, content);
    },
    createFolder: async (_p) => {
    },
    modify: async (file, content) => {
      files.set(file.path, content);
    },
    read: async (file) => {
      if (!files.has(file.path))
        throw new Error("File not found: " + file.path);
      return files.get(file.path);
    },
    getAbstractFileByPath: (p) => files.has(p) ? { path: p } : null,
    getMarkdownFiles: () => [...files.keys()].filter((k) => k.endsWith(".md")).map((p) => ({ path: p }))
  };
  return { files, basePath, vault };
}
function makeFakePlugin(overrides = {}) {
  const { vault } = makeFakeVault(overrides.vaultFiles || {});
  return {
    settings: {
      aiApiKey: "test-key",
      rawFolder: "nutegg/_raw",
      indexFile: "nutegg/_index.md",
      serverPort: 27123,
      ...overrides.settings || {}
    },
    app: { vault: overrides.vault ?? vault },
    aiClient: overrides.aiClient ?? { chat: async () => "{}" },
    eggParser: overrides.eggParser ?? {
      formatEggForPrompt: (e) => `egg:${e.fileName}`
    },
    indexReader: overrides.indexReader ?? {},
    knowledgeBase: overrides.knowledgeBase ?? {},
    db: overrides.db ?? null,
    ...overrides
  };
}

// tests/ai-processor.test.ts
function egg(fileName, overrides = {}) {
  return {
    fileName,
    topic: "Test",
    scope: "scope",
    actionGuide: "1. Title Verdict: one sentence.",
    keyQuestions: ["Is this new?"],
    rejectionCriteria: ["Reject noise."],
    formattingRules: "Keep the tree.",
    knowledge: "- existing\n",
    unprocessed: "",
    ...overrides
  };
}
var capture = {
  url: "https://example.com/post",
  title: "Test Title",
  content: "Some content.",
  sourceType: "article"
};
(0, import_node_test.describe)("AIProcessor.parseJson", () => {
  const p = new AIProcessor(makeFakePlugin());
  (0, import_node_test.it)("parses plain JSON", () => {
    import_strict.default.deepEqual(p.parseJson('{"a": 1}'), { a: 1 });
  });
  (0, import_node_test.it)("strips markdown fences", () => {
    import_strict.default.deepEqual(p.parseJson('```json\n{"b": 2}\n```'), { b: 2 });
  });
  (0, import_node_test.it)("extracts the outermost object from surrounding text", () => {
    import_strict.default.deepEqual(p.parseJson('Here it is: {"c": 3} thanks'), { c: 3 });
  });
  (0, import_node_test.it)("returns {} for unparseable responses", () => {
    import_strict.default.deepEqual(p.parseJson("no json here"), {});
  });
});
(0, import_node_test.describe)("AIProcessor.parseKeyAnswers", () => {
  const p = new AIProcessor(makeFakePlugin());
  (0, import_node_test.it)("filters to complete Q/A pairs and stringifies", () => {
    const out = p.parseKeyAnswers([
      { question: "q1", answer: "a1" },
      { question: "", answer: "a2" },
      { question: "q3" },
      "garbage"
    ]);
    import_strict.default.deepEqual(out, [{ question: "q1", answer: "a1" }]);
  });
  (0, import_node_test.it)("handles non-arrays", () => {
    import_strict.default.deepEqual(p.parseKeyAnswers(void 0), []);
    import_strict.default.deepEqual(p.parseKeyAnswers({}), []);
  });
});
(0, import_node_test.describe)("AIProcessor.mergeVerdict", () => {
  const p = new AIProcessor(makeFakePlugin());
  (0, import_node_test.it)("no eggs \u2192 read it, review summary", () => {
    const v = p.mergeVerdict([]);
    import_strict.default.equal(v.shouldRead, true);
    import_strict.default.ok(v.shouldReadReason.includes("No matching egg"));
  });
  (0, import_node_test.it)("all rejected \u2192 skip, with joined reject reasons", () => {
    const v = p.mergeVerdict([
      { rejected: true, rejectReason: "noise", readVerdict: false },
      { rejected: true, rejectReason: "marketing", readVerdict: false }
    ]);
    import_strict.default.equal(v.shouldRead, false);
    import_strict.default.ok(v.shouldReadReason.includes("noise"));
    import_strict.default.ok(v.shouldReadReason.includes("marketing"));
  });
  (0, import_node_test.it)("any readVerdict true \u2192 read", () => {
    const v = p.mergeVerdict([
      { rejected: false, readVerdict: false, readVerdictReason: "meh" },
      { rejected: false, readVerdict: true, readVerdictReason: "novel" }
    ]);
    import_strict.default.equal(v.shouldRead, true);
    import_strict.default.ok(v.shouldReadReason.includes("novel"));
  });
  (0, import_node_test.it)("none worth reading \u2192 skip with fallback reason", () => {
    const v = p.mergeVerdict([
      { rejected: false, readVerdict: false, readVerdictReason: "" }
    ]);
    import_strict.default.equal(v.shouldRead, false);
    import_strict.default.ok(v.shouldReadReason.includes("No new knowledge"));
  });
});
(0, import_node_test.describe)("AIProcessor.analyze", () => {
  (0, import_node_test.it)("single egg: one combined call, all fields parsed", async () => {
    const responses = [
      JSON.stringify({
        titleVerdict: "Verdict.",
        coreSummary: ["b1", "b2", "b3", "b4"],
        // must be sliced to 3
        isLongForm: true,
        chapterMap: [
          { time: "00:10", title: "Ch1", summary: "s1" },
          { time: "", title: "", summary: "" }
          // dropped by the filter
        ],
        keyQuestionAnswers: [{ question: "Is this new?", answer: "Yes" }],
        customQuestionAnswers: [{ question: "custom?", answer: "custom a" }],
        novelDelta: [
          { parent: "## X", content: "- new stuff" },
          { parent: "## Y", content: "" }
          // dropped
        ],
        rejected: false,
        readVerdict: true,
        readVerdictReason: "has delta"
      })
    ];
    let calls = 0;
    const plugin = makeFakePlugin({
      aiClient: { chat: async () => responses[Math.min(calls++, responses.length - 1)] }
    });
    const result = await new AIProcessor(plugin).analyze(
      { ...capture, chapters: [{ time: "00:10", title: "Ch1" }], questions: ["custom?"] },
      [egg("one.md")]
    );
    import_strict.default.equal(calls, 1);
    import_strict.default.equal(result.titleVerdict, "Verdict.");
    import_strict.default.deepEqual(result.coreSummary, ["b1", "b2", "b3"]);
    import_strict.default.equal(result.chapterMap.length, 1);
    import_strict.default.equal(result.chapterMap[0].time, "00:10");
    import_strict.default.equal(result.customQuestionAnswers[0].answer, "custom a");
    import_strict.default.equal(result.eggResults.length, 1);
    import_strict.default.equal(result.eggResults[0].keyQuestionAnswers[0].answer, "Yes");
    import_strict.default.deepEqual(result.newKnowledge, [
      { egg: "one.md", parent: "## X", content: "- new stuff" }
    ]);
    import_strict.default.equal(result.shouldRead, true);
  });
  (0, import_node_test.it)("two eggs: one content call + one call per egg", async () => {
    const responses = [
      JSON.stringify({
        titleVerdict: "V.",
        coreSummary: [],
        isLongForm: false,
        chapterMap: [],
        customQuestionAnswers: []
      }),
      JSON.stringify({
        keyQuestionAnswers: [{ question: "Is this new?", answer: "no" }],
        novelDelta: [],
        rejected: false,
        readVerdict: false,
        readVerdictReason: "redundant"
      }),
      JSON.stringify({
        keyQuestionAnswers: [],
        novelDelta: [{ parent: "", content: "- fresh" }],
        rejected: false,
        readVerdict: true,
        readVerdictReason: "new insight"
      })
    ];
    let calls = 0;
    const plugin = makeFakePlugin({
      aiClient: { chat: async () => responses[Math.min(calls++, responses.length - 1)] }
    });
    const result = await new AIProcessor(plugin).analyze(
      { ...capture },
      [egg("a.md"), egg("b.md")]
    );
    import_strict.default.equal(calls, 3);
    import_strict.default.equal(result.matchedEggs.length, 2);
    import_strict.default.equal(result.eggResults.length, 2);
    import_strict.default.equal(result.shouldRead, true);
    import_strict.default.deepEqual(result.newKnowledge, [
      { egg: "b.md", parent: "", content: "- fresh" }
    ]);
  });
  (0, import_node_test.it)("no API key \u2192 fallback result with unanswered questions", async () => {
    const plugin = makeFakePlugin({ settings: { aiApiKey: "" } });
    const result = await new AIProcessor(plugin).analyze(
      { ...capture, questions: ["Q?"] },
      []
    );
    import_strict.default.equal(result.shouldRead, true);
    import_strict.default.ok(result.shouldReadReason.includes("No API key"));
    import_strict.default.equal(result.customQuestionAnswers[0].answer, "No API key configured \u2014 cannot answer.");
    import_strict.default.deepEqual(result.newKnowledge, []);
  });
  (0, import_node_test.it)("typed AIError propagates out of the egg phase", async () => {
    const { AIError: AIError2 } = await Promise.resolve().then(() => (init_ai_client(), ai_client_exports));
    const plugin = makeFakePlugin({
      aiClient: {
        chat: async () => {
          throw new AIError2("auth_failed", "Bad key", 401);
        }
      }
    });
    await import_strict.default.rejects(
      new AIProcessor(plugin).analyze({ ...capture }, [egg("a.md")]),
      (err) => err instanceof AIError2 && err.code === "auth_failed"
    );
  });
});
(0, import_node_test.describe)("AIProcessor.askFollowUp", () => {
  (0, import_node_test.it)("answers every question, filling in skipped ones", async () => {
    const plugin = makeFakePlugin({
      aiClient: {
        chat: async () => JSON.stringify({ answers: [{ question: "Q1?", answer: "A1" }] })
      }
    });
    const out = await new AIProcessor(plugin).askFollowUp(
      capture,
      ["Q1?", "Q2?"],
      [{ question: "Prior?", answer: "Prior A" }]
    );
    import_strict.default.equal(out.length, 2);
    import_strict.default.equal(out[0].answer, "A1");
    import_strict.default.equal(out[1].answer, "No answer returned \u2014 please try again.");
  });
  (0, import_node_test.it)("no API key \u2192 placeholder answers", async () => {
    const plugin = makeFakePlugin({ settings: { aiApiKey: "" } });
    const out = await new AIProcessor(plugin).askFollowUp(
      capture,
      ["Q?"],
      []
    );
    import_strict.default.equal(out[0].answer, "No API key configured \u2014 cannot answer.");
  });
  (0, import_node_test.it)("empty question list \u2192 empty result, no AI call", async () => {
    let calls = 0;
    const plugin = makeFakePlugin({
      aiClient: { chat: async () => (calls++, "{}") }
    });
    const out = await new AIProcessor(plugin).askFollowUp(capture, [], []);
    import_strict.default.deepEqual(out, []);
    import_strict.default.equal(calls, 0);
  });
});
(0, import_node_test.describe)("AIProcessor.maybeMergeEgg", () => {
  function unprocessedEgg(n) {
    const entries = Array.from(
      { length: n },
      (_, i) => `- entry ${i + 1}`
    ).join("\n");
    return `## Knowledge

- existing

## Unprocessed

${entries}
`;
  }
  function makeProcessor(files, overrides = {}) {
    const store = makeFakeVault(files);
    const plugin = makeFakePlugin({ vault: store.vault, ...overrides });
    plugin.eggParser = new EggParser(plugin);
    return { p: new AIProcessor(plugin), files: store.files };
  }
  (0, import_node_test.it)("exports MERGE_THRESHOLD = 20", () => {
    import_strict.default.equal(MERGE_THRESHOLD, 20);
  });
  (0, import_node_test.it)("does nothing below the threshold (no AI call)", async () => {
    let calls = 0;
    const { p } = makeProcessor(
      { "egg.md": unprocessedEgg(19) },
      { aiClient: { chat: async () => (calls++, "{}") } }
    );
    const out = await p.maybeMergeEgg("egg.md");
    import_strict.default.equal(out, null);
    import_strict.default.equal(calls, 0);
  });
  (0, import_node_test.it)("merges 20 entries into the tree via one AI call", async () => {
    let seenPrompt = "";
    const { p, files } = makeProcessor(
      { "egg.md": unprocessedEgg(20) },
      {
        aiClient: {
          chat: async (prompt) => {
            seenPrompt = prompt;
            return JSON.stringify({
              knowledge: "- existing\n  - merged 1\n  - merged 2",
              unprocessed: ""
            });
          }
        }
      }
    );
    const out = await p.maybeMergeEgg("egg.md");
    import_strict.default.deepEqual(out, { egg: "egg.md", entries: 20 });
    const content = files.get("egg.md");
    import_strict.default.ok(
      content.includes("## Knowledge\n\n- existing\n  - merged 1\n  - merged 2"),
      "Knowledge tree replaced with the merged output"
    );
    import_strict.default.ok(!content.includes("- entry 1"), "Unprocessed entries consumed");
    import_strict.default.ok(seenPrompt.includes("- existing"));
    import_strict.default.ok(seenPrompt.includes("- entry 20"));
  });
  (0, import_node_test.it)("leaves the egg untouched when the AI returns no knowledge", async () => {
    const { p, files } = makeProcessor(
      { "egg.md": unprocessedEgg(20) },
      { aiClient: { chat: async () => JSON.stringify({ unprocessed: "x" }) } }
    );
    const before = files.get("egg.md");
    const out = await p.maybeMergeEgg("egg.md");
    import_strict.default.equal(out, null);
    import_strict.default.equal(files.get("egg.md"), before);
  });
  (0, import_node_test.it)("skips the merge without an API key", async () => {
    let calls = 0;
    const { p } = makeProcessor(
      { "egg.md": unprocessedEgg(20) },
      {
        settings: { aiApiKey: "" },
        aiClient: { chat: async () => (calls++, "{}") }
      }
    );
    import_strict.default.equal(await p.maybeMergeEgg("egg.md"), null);
    import_strict.default.equal(calls, 0);
  });
  (0, import_node_test.it)("returns null for a missing egg file", async () => {
    const { p } = makeProcessor({});
    import_strict.default.equal(await p.maybeMergeEgg("nope.md"), null);
  });
});
(0, import_node_test.describe)("AIProcessor prompt building helpers", () => {
  const p = new AIProcessor(makeFakePlugin());
  (0, import_node_test.it)("chaptersBlock builds the timestamped list or empty", () => {
    import_strict.default.equal(
      p.chaptersBlock([{ time: "00:10", title: "Intro" }]),
      "## Video Chapters (use these EXACT timestamps)\n- 00:10 \u2014 Intro"
    );
    import_strict.default.equal(p.chaptersBlock([]), "");
    import_strict.default.equal(p.chaptersBlock(void 0), "");
  });
  (0, import_node_test.it)("questionsBlock numbers questions under a heading or empty", () => {
    import_strict.default.equal(
      p.questionsBlock(["a", "b"], "Custom"),
      "## Custom\n1. a\n2. b"
    );
    import_strict.default.equal(p.questionsBlock([], "Custom"), "");
  });
});
