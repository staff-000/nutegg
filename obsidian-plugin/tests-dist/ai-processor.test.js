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
2. Novel Delta: identify genuinely NEW insights vs the Current Knowledge. If the content is entirely redundant, return an empty array.
3. Apply the Rejection Criteria \u2014 if the content should be rejected, set rejected to true and give a one-line reason.
4. Decide: should the user spend time reading/watching this fully? Consider the reject criteria and whether it adds new insight.

For each Novel Delta entry:
- "parent": copy the EXACT text of the existing bullet or heading in the Current Knowledge tree that the new information nests under. Use "" if no suitable parent exists.
- "content": the new information as markdown nested bullets, written relative to that parent (top-level lines are children of the parent). Follow the Formatting Rules.

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
- For each Novel Delta entry: "parent" is the EXACT text of the existing bullet or heading it nests under ("" if none), "content" follows the Formatting Rules.
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
  actionGuideDefault: action_guide_default_default.trim()
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
