"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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

// tests/lightweight-stage2.test.ts
var import_node_test = require("node:test");
var import_strict = __toESM(require("node:assert/strict"));

// ../shared/src/catalog.ts
var OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
var PROVIDER_CATALOG = {
  local: {
    id: "local",
    label: "Local LLM (Ollama, LM Studio, etc.)",
    officialEndpoint: "http://127.0.0.1:11434/v1/chat/completions",
    apiFormat: "openai-compatible",
    keyPlaceholder: "Optional for local LLMs",
    openrouterPrefix: ""
  },
  openrouter: {
    id: "openrouter",
    label: "OpenRouter (Multi-Provider)",
    officialEndpoint: OPENROUTER_ENDPOINT,
    apiFormat: "openai-compatible",
    defaultModel: "openai/gpt-6-astra",
    families: [
      {
        id: "openai",
        label: "OpenAI GPT & Reasoning",
        defaultModel: "openai/gpt-6-astra",
        models: [
          "openai/gpt-6-astra",
          "openai/gpt-5.6-sol",
          "openai/o3-mini",
          "openai/gpt-4o"
        ]
      },
      {
        id: "anthropic",
        label: "Anthropic Claude",
        defaultModel: "anthropic/claude-sonnet-5",
        models: [
          "anthropic/claude-fable-5-1",
          "anthropic/claude-opus-5",
          "anthropic/claude-sonnet-5"
        ]
      },
      {
        id: "deepseek",
        label: "DeepSeek",
        defaultModel: "deepseek/deepseek-r1",
        models: ["deepseek/deepseek-r1", "deepseek/deepseek-chat"]
      },
      {
        id: "google",
        label: "Google Gemini",
        defaultModel: "google/gemini-2.5-flash",
        models: [
          "google/gemini-2.5-flash",
          "google/gemini-2.5-pro"
        ]
      },
      {
        id: "meta",
        label: "Meta Llama",
        defaultModel: "meta-llama/llama-3.3-70b-instruct",
        models: [
          "meta-llama/llama-3.3-70b-instruct"
        ]
      },
      {
        id: "qwen",
        label: "Qwen",
        defaultModel: "qwen/qwen-2.5-72b-instruct",
        models: [
          "qwen/qwen-2.5-72b-instruct"
        ]
      },
      {
        id: "custom",
        label: "Custom OpenRouter Model",
        defaultModel: "openai/gpt-6-astra",
        models: []
      }
    ],
    models: [
      "openai/gpt-6-astra",
      "openai/gpt-5.6-sol",
      "openai/o3-mini",
      "openai/gpt-4o",
      "anthropic/claude-fable-5-1",
      "anthropic/claude-opus-5",
      "anthropic/claude-sonnet-5",
      "deepseek/deepseek-r1",
      "deepseek/deepseek-chat",
      "google/gemini-2.5-flash",
      "google/gemini-2.5-pro",
      "meta-llama/llama-3.3-70b-instruct",
      "qwen/qwen-2.5-72b-instruct"
    ],
    keyPlaceholder: "sk-or-...",
    openrouterPrefix: ""
  },
  anthropic: {
    id: "anthropic",
    label: "Anthropic (Claude)",
    officialEndpoint: "https://api.anthropic.com/v1/messages",
    apiFormat: "anthropic",
    defaultModel: "claude-sonnet-5",
    models: [
      "claude-fable-5-1",
      "claude-opus-5",
      "claude-sonnet-5",
      "claude-haiku-4-5-20251001",
      "claude-3-7-sonnet-20250219",
      "claude-3-5-sonnet-20241022"
    ],
    keyPlaceholder: "sk-ant-...",
    openrouterPrefix: "anthropic/"
  },
  openai: {
    id: "openai",
    label: "OpenAI",
    officialEndpoint: "https://api.openai.com/v1/chat/completions",
    apiFormat: "openai-compatible",
    defaultModel: "gpt-6-astra",
    models: [
      "gpt-6-astra",
      "gpt-5.6-sol",
      "gpt-5.6-terra",
      "gpt-5.6-luna",
      "o3-mini",
      "o1",
      "gpt-4o",
      "gpt-4o-mini"
    ],
    keyPlaceholder: "sk-...",
    openrouterPrefix: "openai/"
  },
  gemini: {
    id: "gemini",
    label: "Google Gemini",
    officialEndpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    apiFormat: "openai-compatible",
    defaultModel: "gemini-2.5-flash",
    models: [
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-2.5-flash-lite",
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite"
    ],
    keyPlaceholder: "AIza...",
    openrouterPrefix: "google/"
  },
  deepseek: {
    id: "deepseek",
    label: "DeepSeek",
    officialEndpoint: "https://api.deepseek.com/v1/chat/completions",
    apiFormat: "openai-compatible",
    defaultModel: "deepseek-chat",
    models: [
      "deepseek-chat",
      "deepseek-reasoner",
      "deepseek-flash"
    ],
    keyPlaceholder: "sk-...",
    openrouterPrefix: "deepseek/"
  },
  kimi: {
    id: "kimi",
    label: "Kimi (Moonshot)",
    officialEndpoint: "https://api.moonshot.cn/v1/chat/completions",
    apiFormat: "openai-compatible",
    defaultModel: "kimi-k3",
    models: [
      "kimi-k3",
      "kimi-k2.7-code",
      "kimi-k2.7-code-highspeed",
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
    defaultModel: "glm-5.3",
    models: [
      "glm-5.3",
      "glm-5",
      "glm-5-turbo",
      "glm-4.7",
      "glm-4-plus",
      "glm-4-air",
      "glm-4-flash"
    ],
    keyPlaceholder: "...",
    openrouterPrefix: "zhipu/"
  },
  qwen: {
    id: "qwen",
    label: "Qwen (Tongyi)",
    officialEndpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    apiFormat: "openai-compatible",
    defaultModel: "qwen3-max",
    models: [
      "qwen3-max",
      "qwen3-plus",
      "qwen3-flash",
      "qwen-max",
      "qwen-plus",
      "qwen-turbo"
    ],
    keyPlaceholder: "sk-...",
    openrouterPrefix: "qwen/"
  }
};
function isAIConfigured(settings) {
  if (!settings)
    return false;
  const provider = settings.chromeAiProvider || settings.aiProvider || "gemini";
  const apiKey = (settings.chromeAiApiKey !== void 0 ? settings.chromeAiApiKey : settings.aiApiKey) || "";
  if (provider === "local") {
    const localEndpoint = settings.chromeAiEndpoint || settings.localEndpoint || settings.aiEndpoint;
    return Boolean(
      localEndpoint && localEndpoint.trim().length > 0 || PROVIDER_CATALOG.local.officialEndpoint
    );
  }
  return Boolean(apiKey && apiKey.trim().length > 0);
}

// ../shared/src/client.ts
var AIError = class extends Error {
  code;
  statusCode;
  constructor(code, message, statusCode) {
    super(message);
    this.name = "AIError";
    this.code = code;
    this.statusCode = statusCode ?? null;
  }
};

// ../shared/src/chunker.ts
var DEFAULT_CHUNK_WINDOW_CHARS = 3e4;
var DEFAULT_SECTION_SECS = 300;
function lineSeconds(line) {
  const m = line.trim().match(/^\[(\d{1,2}:)?(\d{1,2}):(\d{2})\]/);
  if (!m)
    return null;
  const parts = m[0].slice(1, -1).split(":").map(Number);
  if (parts.length === 3)
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2)
    return parts[0] * 60 + parts[1];
  return null;
}
function toSeconds(time) {
  const clean = (time || "").replace(/[\[\]]/g, "").trim();
  const parts = clean.split(":").map(Number);
  if (parts.some((n) => Number.isNaN(n)))
    return 0;
  if (parts.length === 3)
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2)
    return parts[0] * 60 + parts[1];
  return 0;
}
function formatSeconds(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor(sec % 3600 / 60);
  const s = Math.floor(sec % 60);
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
function partNote(chunk) {
  const at = chunk.startTime ? ` (from ${chunk.startTime})` : "";
  return `**Part:** ${chunk.index + 1} of ${chunk.total}${at}`;
}
function paragraphChunks(content, chapters, chunkSize = DEFAULT_CHUNK_WINDOW_CHARS) {
  const paras = content.split(/\n\n+/);
  const chunks = [];
  let buf = [];
  let bufChars = 0;
  const flush = () => {
    if (!buf.length)
      return;
    chunks.push({
      index: 0,
      total: 0,
      content: buf.join("\n\n"),
      chapters: [],
      startTime: "",
      sections: []
    });
    buf = [];
    bufChars = 0;
  };
  for (const p of paras) {
    if (p.length > chunkSize) {
      flush();
      for (let i = 0; i < p.length; i += chunkSize) {
        chunks.push({
          index: 0,
          total: 0,
          content: p.slice(i, i + chunkSize),
          chapters: [],
          startTime: "",
          sections: []
        });
      }
      continue;
    }
    if (bufChars + p.length > chunkSize)
      flush();
    buf.push(p);
    bufChars += p.length + 2;
  }
  flush();
  if (chunks.length === 0) {
    chunks.push({ index: 0, total: 1, content, chapters, startTime: "", sections: [] });
  }
  chunks.forEach((c, i) => {
    c.index = i;
    c.total = chunks.length;
  });
  if (chunks.length === 1)
    chunks[0].chapters = chapters;
  return chunks;
}
function timestampedChunks(lines, firstTsIdx, chapters, chunkSize = DEFAULT_CHUNK_WINDOW_CHARS, sectionGridSecs = DEFAULT_SECTION_SECS) {
  const preambleLines = lines.slice(0, firstTsIdx);
  const filteredPreamble = [];
  let inChaptersSection = false;
  for (const line of preambleLines) {
    if (line.trim().startsWith("## Chapters")) {
      inChaptersSection = true;
      continue;
    }
    if (inChaptersSection && line.trim().startsWith("#")) {
      inChaptersSection = false;
    }
    if (!inChaptersSection) {
      filteredPreamble.push(line);
    }
  }
  const cleanPreamble = filteredPreamble.join("\n").trim();
  const units = [];
  let lastCaptionSec = 0;
  for (let i = firstTsIdx; i < lines.length; i++) {
    const sec = lineSeconds(lines[i]);
    if (sec === null)
      continue;
    units.push({ sec, line: lines[i] });
    lastCaptionSec = Math.max(lastCaptionSec, sec);
  }
  const chunks = [];
  let buf = [];
  let bufChars = 0;
  let startSec = 0;
  const flush = () => {
    if (!buf.length)
      return;
    chunks.push({
      index: 0,
      total: 0,
      content: buf.join("\n"),
      chapters: [],
      startTime: formatSeconds(startSec),
      sections: []
    });
    buf = [];
    bufChars = 0;
  };
  for (const u of units) {
    if (bufChars + u.line.length > chunkSize)
      flush();
    if (!buf.length)
      startSec = u.sec;
    buf.push(u.line);
    bufChars += u.line.length + 1;
  }
  flush();
  if (chunks.length === 0) {
    return paragraphChunks(lines.join("\n"), chapters, chunkSize);
  }
  const starts = chunks.map((c) => toSeconds(c.startTime));
  for (const ch of chapters) {
    const t = toSeconds(ch.time);
    let idx = 0;
    for (let i = starts.length - 1; i >= 0; i--) {
      if (t >= starts[i]) {
        idx = i;
        break;
      }
    }
    chunks[idx].chapters.push(ch);
  }
  if (chapters.length === 0 && lastCaptionSec >= sectionGridSecs) {
    const begins = chunks.map((c) => toSeconds(c.startTime));
    for (let t = 0; t < lastCaptionSec + 1; t += sectionGridSecs) {
      let idx = 0;
      for (let i = begins.length - 1; i >= 0; i--) {
        if (t >= begins[i]) {
          idx = i;
          break;
        }
      }
      chunks[idx].sections.push(formatSeconds(t));
    }
  }
  chunks.forEach((c, i) => {
    c.index = i;
    c.total = chunks.length;
    if (chunks.length === 1) {
      c.content = `${preambleLines.join("\n")}

${c.content}`;
    } else if (cleanPreamble) {
      c.content = `${cleanPreamble}

${c.content}`;
    }
  });
  return chunks;
}
function chunkContent(content, chapters = [], chunkWindowChars = DEFAULT_CHUNK_WINDOW_CHARS, sectionGridSeconds = DEFAULT_SECTION_SECS) {
  const lines = (content || "").split("\n");
  const firstTsIdx = lines.findIndex((l) => lineSeconds(l) !== null);
  if (firstTsIdx !== -1) {
    return timestampedChunks(
      lines,
      firstTsIdx,
      chapters,
      chunkWindowChars,
      sectionGridSeconds
    );
  }
  if (content.length <= chunkWindowChars) {
    return [
      { index: 0, total: 1, content, chapters, startTime: "", sections: [] }
    ];
  }
  return paragraphChunks(content, chapters, chunkWindowChars);
}

// ../shared/src/egg-format.ts
function extractEggLanguage(content) {
  if (!content)
    return "";
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (fmMatch) {
    for (const line of fmMatch[1].split(/\r?\n/)) {
      const kv = line.match(/^(\w+):\s*(.*)$/);
      if (kv && kv[1].toLowerCase() === "language") {
        return kv[2].trim().replace(/^["'](.*)["']$/, "$1");
      }
    }
  }
  const directMatch = content.match(/^language:\s*["']?([^"'\r\n]+)["']?/im);
  return directMatch ? directMatch[1].trim() : "";
}
function formatEggInstructionsForPrompt(egg2) {
  const parts = [`**Scope:** ${egg2.scope || "(not specified)"}`];
  if (egg2.actionGuide)
    parts.push(`**Action Guide:**
${egg2.actionGuide}`);
  for (const [label, items] of [["Key Questions", egg2.keyQuestions], ["Worth Reading If", egg2.worthReadingIf], ["Skip If", egg2.skipIf]]) {
    if (items?.length)
      parts.push(`**${label}:**
${items.map((item) => `- ${item}`).join("\n")}`);
  }
  if (egg2.formattingRules)
    parts.push(`**Formatting Rules:**
${egg2.formattingRules}`);
  return parts.join("\n\n");
}
function formatEggKnowledgeForPrompt(egg2) {
  return `**Current Knowledge:**
${egg2.knowledge || "(empty)"}

**Unprocessed:**
${egg2.unprocessed || "(empty)"}`;
}
function formatEggForPrompt(egg2) {
  return formatEggInstructionsForPrompt(egg2);
}
function countUnprocessed(egg2) {
  const indentOf = (l) => (l.match(/^\s*/) || [""])[0].length;
  const bullets = (egg2.unprocessed || "").split("\n").map((l) => l.replace(/\s+$/, "")).filter((l) => /^\s*[-*]\s/.test(l));
  if (bullets.length === 0)
    return 0;
  const base = Math.min(...bullets.map(indentOf));
  return bullets.filter((l) => indentOf(l) === base).length;
}

// ../shared/src/json-repair.ts
function repairTruncatedJson(jsonStr) {
  const firstBrace = jsonStr.indexOf("{");
  if (firstBrace === -1)
    return null;
  let text = jsonStr.slice(firstBrace).trim();
  const stack = [];
  let inString = false;
  let escaped = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (c === "\\") {
        escaped = true;
      } else if (c === '"') {
        inString = false;
      }
      continue;
    }
    if (c === '"') {
      inString = true;
    } else if (c === "{" || c === "[") {
      stack.push(c);
    } else if (c === "}") {
      if (stack[stack.length - 1] === "{")
        stack.pop();
    } else if (c === "]") {
      if (stack[stack.length - 1] === "[")
        stack.pop();
    }
  }
  if (stack.length === 0 && !inString) {
    return text;
  }
  if (inString) {
    text += '"';
  }
  if (stack[stack.length - 1] === "{") {
    text = text.replace(/,?\s*"[^"]*"\s*:\s*$/, "");
    text = text.replace(/(?:\{|,)\s*"[^"]*"\s*$/, (m) => m.startsWith("{") ? "{" : "");
  }
  text = text.replace(/,\s*$/, "").trim();
  const finalStack = [];
  let inStr = false;
  let esc = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inStr) {
      if (esc)
        esc = false;
      else if (c === "\\")
        esc = true;
      else if (c === '"')
        inStr = false;
      continue;
    }
    if (c === '"')
      inStr = true;
    else if (c === "{" || c === "[")
      finalStack.push(c);
    else if (c === "}") {
      if (finalStack[finalStack.length - 1] === "{")
        finalStack.pop();
    } else if (c === "]") {
      if (finalStack[finalStack.length - 1] === "[")
        finalStack.pop();
    }
  }
  while (finalStack.length > 0) {
    const open = finalStack.pop();
    if (open === "{")
      text += "}";
    else if (open === "[")
      text += "]";
  }
  return text;
}
function sanitizeJsonString(str) {
  let result = "";
  let inString = false;
  let escaped = false;
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    if (inString) {
      if (escaped) {
        escaped = false;
        result += c;
      } else if (c === "\\") {
        escaped = true;
        result += c;
      } else if (c === '"') {
        inString = false;
        result += c;
      } else if (c === "\n") {
        result += "\\n";
      } else if (c === "\r") {
        result += "\\r";
      } else if (c === "	") {
        result += "\\t";
      } else if (c.charCodeAt(0) < 32) {
        result += "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0");
      } else {
        result += c;
      }
    } else {
      if (c === '"')
        inString = true;
      result += c;
    }
  }
  return result.replace(/,\s*([}\]])/g, "$1");
}
function parseJson(response2, context = "response") {
  let jsonStr = (response2 || "").trim();
  if (!jsonStr) {
    console.warn(`[NutEgg] Empty AI response received for (${context}).`);
    return {};
  }
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  } else if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }
  try {
    return JSON.parse(jsonStr);
  } catch {
  }
  const sanitized = sanitizeJsonString(jsonStr);
  try {
    return JSON.parse(sanitized);
  } catch {
  }
  const braceMatch = sanitized.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    try {
      return JSON.parse(braceMatch[0]);
    } catch {
    }
  }
  const repaired = repairTruncatedJson(sanitized);
  if (repaired) {
    try {
      const res = JSON.parse(repaired);
      console.warn(`[NutEgg] Recovered truncated JSON response (${context})`);
      return res;
    } catch {
    }
  }
  console.warn(
    `[NutEgg] Failed to parse AI JSON response (${context}) [length=${jsonStr.length}]:`,
    jsonStr.slice(0, 500)
  );
  return {};
}

// ../shared/workflow/content-analysis.md
var content_analysis_default = `You are a knowledge curator. Analyze the content below following the Task.

## Content to Analyze
**Title:** {{title}}
**Source:** {{url}}
**Type:** {{source_type}}
{{part_note}}{{chapters}}
{{sections}}{{questions}}

{{content}}

## Task
{{content_task_default}}

## Output Format
Respond with ONLY a valid JSON object matching this schema (no markdown, no code fence, just the JSON object):
{
  "titleVerdict": "direct answer to the title's question",
  "coreSummary": ["bullet 1", "bullet 2", "bullet 3"],
  "mindMap": [
    {
      "name": "First Main Topic / Theme",
      "detail": "Core idea or thesis of this branch",
      "children": [
        {
          "name": "Subtopic / Concept",
          "detail": "Key reasoning, mechanism, or explanation",
          "children": [
            {
              "name": "Detail / Evidence",
              "detail": "Concrete takeaway or example"
            }
          ]
        }
      ]
    },
    {
      "name": "Second Main Topic / Theme",
      "detail": "Core idea or thesis of this branch",
      "children": [
        {
          "name": "Subtopic / Concept",
          "detail": "Key reasoning, mechanism, or explanation"
        }
      ]
    }
  ],
  "isLongForm": true,
  "chapterMap": [
    {"time": "00:12:34", "title": "chapter title", "summary": "one sentence"}
  ],
  "customQuestionAnswers": [
    {
      "question": "exact question text",
      "answer": "direct answer",
      "sources": [{"ref": "12:34", "quote": "brief supporting quote"}]
    }
  ]
}

## Output Rules
- titleVerdict must be a single sentence.
- coreSummary: at most 3 bullets, plain language.
- mindMap: main branches/topics directly at the root level (do NOT wrap everything in a single overall root node; start directly with the main themes/sections), up to 3 levels deep total. Each node has a concise name and rich explanatory detail (1-2 sentences). Structure logically to form an outline/mind map of the author's ideas.
- isLongForm: true only for long articles/videos that meaningfully benefit from a chapter map.
- chapterMap: empty array when isLongForm is false. When video chapters are provided, keep their exact timestamps and titles, and only add your 1-sentence summary.
- chapterMap when Video Sections are listed above: return EXACTLY one entry per listed section, using the section's start time as "time" \u2014 give each a short title and a 1-sentence summary of what happens between that section and the next.
- chapterMap when NO chapters or sections were provided: empty array (the content is not a timestamped video).
- customQuestionAnswers: one entry per DISTINCT user question (empty array when none). Skip any user question that is equivalent in meaning to an Egg Key Question above or to another user question \u2014 answer it only once.
{{shared_output_rules}}
`;

// ../shared/workflow/egg-analysis.md
var egg_analysis_default = `Analyze this source according to the instructions for egg "{{egg_file}}". Produce the requested answers and results, not a comparison with saved knowledge.

## Egg Instructions
{{egg_instructions}}

## Stage 1 Context (not an endorsement or quality score)
{{stage1_signals}}

## Source
Title: {{title}}
URL: {{url}}
Type: {{source_type}}
{{part_note}}

{{content}}

## Task
1. Follow the Action Guide and Formatting Rules. Preserve useful AMA question\u2013answer pairs, examples, qualifications and disagreements. Do not repeat the general mind map or force every result into a concept/explanation template.
2. Answer the exact Key Questions directly with supporting source locations/brief quotes. Use "Not addressed in this content" (or "Not addressed in this part" for chunks) when there is no supported answer. Do not mistake missing coverage for an absent answer.
3. Extract concise, substantive results as markdown entries. Lists/frameworks retain all supported items and order; a chunk may contain a partial framework for later assembly. Do not invent missing fragments. Avoid repeating the same answer in both keyQuestionAnswers and extractedEntries.
4. Recommend what the user gains by opening the original AFTER reading the condensed analysis:
   - full: useful depth spans the source.
   - highlights: specific worthwhile passages; identify their source locations.
   - summary: the condensed result covers the useful substance.
   - skip: poor fit, low substance, or dominated by Skip If.
   - uncertain: insufficient evidence or coverage.
   Apply Scope, Key Questions, Worth Reading If and Skip If to the evidence. Mixed content may warrant highlights rather than skipping it all. Empty preference lists use this rubric, never an automatic yes. Explain the benefit/limitation in one concise reason. For chunks this is provisional evidence for a whole-source decision.
5. Do not claim novelty relative to the user's notes, unfamiliarity to the user, external factual verification, or unseen visual demonstrations. Preferences never prevent extracting useful results. Never include author/source URL metadata in entry bodies; it is appended mechanically.

## Output Format
JSON only:
{
  "language": "English",
  "keyQuestionAnswers": [{"question": "exact question", "answered": true, "answer": "supported answer", "sources": [{"ref": "12:34", "quote": "supporting quote"}]}],
  "extractedEntries": [{"kind": "insight", "content": "instruction-formatted markdown", "sources": [{"ref": "12:34", "quote": "supporting quote"}]}],
  "readAction": "highlights",
  "readVerdictReason": "What remains to gain from opening the source",
  "readingSources": [{"ref": "12:34", "quote": "evidence for the recommendation"}]
}
Entry kind is insight, list, or answer. Empty arrays are valid. Source ref is an available timestamp or section heading; never invent one. Keep answers and recommendation notes concise.
{{shared_output_rules}}

Set answered=false for unsupported/unaddressed answers, regardless of output language. Such answers are displayed but not hatched as insights.
`;

// ../shared/workflow/follow-up.md
var follow_up_default = `You are a knowledge curator. Answer the user's follow-up questions.

## Context / Content to Analyze
**Title:** {{title}}
**Source:** {{url}}
**Type:** {{source_type}}
{{prior_qa}}

{{content}}

## New Questions
{{questions}}

## Output Format
Respond in this EXACT JSON format (no markdown, no code fence, just the JSON object):
{
  "answers": [
    {
      "question": "exact question text",
      "answer": "direct answer",
      "sources": [{"ref": "12:34", "quote": "brief supporting quote"}]
    }
  ]
}

## Output Rules:
- One entry per question, in the same order.
- If a question is equivalent to one in Previous Questions & Answers, answer briefly with the same conclusion instead of repeating it.
{{shared_output_rules}}
`;

// ../shared/workflow/egg-routing.md
var egg_routing_default = 'Given this content and egg index, which egg file(s) does this content belong to? Return ONLY the file names, one per line. If none match, return "none".\n\n## Content\nTitle: {{title}}\nURL: {{url}}\n{{content}}\n\n## Egg Index\n{{index}}\n\nReturn matching file names (one per line):\n';

// ../shared/workflow/content-task-default.md
var content_task_default_default = "1. Title Verdict: Provide a single, direct sentence that resolves the core question posed in the title or introduction.\n2. Core Summary: Summarize the main concepts in plain language using a maximum of 3 bullet points.\n3. Chapter Map (Long-form only): If the content is a long article or lengthy video, provide a brief 1-sentence summary for each major section or topic shift. If it is short, omit this step entirely.\n4. Mind Map: Construct a hierarchical concept tree capturing the core mental model or argument flow (up to 3 levels deep). Each node must have a concise `name` and informative explanatory `detail`.\n";

// ../shared/workflow/merge-unprocessed.md
var merge_unprocessed_default = `You are a knowledge curator for the egg file "{{egg_file}}". The Unprocessed section has accumulated {{unprocessed_count}} entries \u2014 merge them into the knowledge tree below.

## Formatting Rules
{{formatting_rules}}

## Existing Knowledge Tree
{{knowledge_tree}}

## Entries to Merge
{{unprocessed}}

## Task
1. Preserve existing user-authored branches and structure. Do not delete or rename them.
2. Consolidate genuinely equivalent claims across pending entries and the tree. Retain ALL distinct author/source lines, examples, caveats and qualifications. A familiar concept is not a reason to discard its new substantive details or attribution.
3. Assemble supported complementary fragments (an early partial mention and a later explanation) into a complete entry. Do not invent missing relationships or items.
4. For frameworks/lists from the same source/version, assemble fragments, preserve source order and every distinct item. Equal titles alone do not establish equivalence: different speakers, versions, dates or contexts remain distinguishable.
5. Preserve disagreements, contradictions and counterexamples explicitly with their sources. Never silently choose a winner or average incompatible claims into agreement.
6. Place consolidated entries under relevant parents; create minimal new branches only when needed. Unresolved fragments remain Unprocessed.
7. Reading preferences/recommendations are NEVER merge rejection criteria.
8. Return the COMPLETE tree and remaining Unprocessed. Never truncate either to fit the output.

## Output Format
Respond in this EXACT JSON format (no markdown, no code fence, just the JSON object):
{
  "knowledge": "the COMPLETE updated Knowledge section content as markdown \u2014 the existing tree with the merged entries nested in. Only the section BODY: do NOT include the '# Knowledge' heading line itself.",
  "unprocessed": "the entries that could not be merged (markdown), or an empty string when all were merged. Only the section BODY: do NOT include the '# Unprocessed' heading line itself."
}

## Output Rules:
- Output Language: write ALL output text (knowledge entries, explanations) in {{output_language}}. Keep JSON keys in English.
`;

// ../shared/workflow/aggregate-content.md
var aggregate_content_default = `You are a knowledge curator. The content below was too long for one pass and was analyzed in parts. Combine the per-part results into ONE coherent result for the whole content.

## Content
**Title:** {{title}}
**Source:** {{url}}
{{chapters}}

## Per-Part Summaries
{{chunk_summaries}}

{{questions}}

## Task
{{content_task_default}}

## Output Format
Respond in this EXACT JSON format (no markdown, no code fence, just the JSON object):
{
  "titleVerdict": "direct answer to the title's question",
  "coreSummary": ["bullet 1", "bullet 2"],
  "mindMap": [
    {
      "name": "First Main Topic",
      "detail": "Core idea",
      "children": [
        {
          "name": "Subtopic",
          "detail": "Key reasoning"
        }
      ]
    },
    {
      "name": "Second Main Topic",
      "detail": "Core idea",
      "children": [
        {
          "name": "Subtopic",
          "detail": "Key reasoning"
        }
      ]
    }
  ],
  "customQuestionAnswers": [
    {
      "question": "exact question text",
      "answer": "direct answer",
      "sources": [{"ref": "00:00", "quote": "brief supporting quote"}]
    }
  ]
}

## Output Rules
- mindMap: synthesized concept tree for the entire work, up to 3 levels deep, integrating points from across the parts. Have main branches directly at the root level (do NOT wrap in a single overall root node).
- customQuestionAnswers: one entry per DISTINCT user question (empty array when none). When citing sources, use timestamps or section headers from the Part summaries.
{{shared_output_rules}}
`;

// ../shared/workflow/aggregate-egg.md
var aggregate_egg_default = `Consolidate answers and a whole-source reading recommendation for egg "{{egg_file}}". You have compact per-part drafts, not the original source. Do not extract or assemble entries here.

## Scope
{{scope}}
## Exact Key Questions
{{key_questions}}
## Worth Reading If
{{worth_reading_if}}
## Skip If
{{skip_if}}
## Stage 1 Context (not an endorsement)
{{stage1_signals}}
## Ordered Per-Part Drafts and Coverage
{{chunk_findings}}

## Task
1. Give one concise supported answer per Key Question. Combine complementary drafts, retain disagreements and their references. A part's "not addressed" cannot override a supported answer elsewhere. Missing/failed parts are incomplete coverage, not negative evidence.
2. Decide for the WHOLE source: full (depth throughout), highlights (specific valuable passages), summary (condensed results suffice), skip (poor fit/low substance), uncertain (insufficient evidence/coverage). Use scope/questions and the two lists. Empty lists do not mean automatic yes. Never infer novelty relative to saved knowledge or unseen demonstrations.
3. Identify worthwhile source locations using only supplied references. A timestamp without evidence is insufficient. Explain what remains to gain from opening the source. Failed coverage requires uncertainty.
4. Do not produce entry bodies, compare existing knowledge, or invent links between unsupported drafts.

## Output Format
JSON only:
{
  "keyQuestionAnswers": [{"question": "exact question", "answered": true, "answer": "whole-source answer", "sources": [{"ref": "12:34", "quote": "supplied evidence"}]}],
  "readAction": "highlights",
  "readVerdictReason": "one concise reason",
  "readingSources": [{"ref": "12:34", "quote": "supplied evidence"}]
}
{{shared_output_rules}}

Set answered=false for unsupported/unaddressed answers, regardless of output language. Such answers are displayed but not hatched as insights.
`;

// ../shared/workflow/localize-egg.md
var localize_egg_default = 'You are a knowledge curator for NutEgg.\n\n## Egg Description\n{{description}}\n\n## Egg Template\n{{template}}\n\n## Task\nTranslate and adapt the concrete instructions, questions, criteria, and rule descriptions in the template above so they use the SAME LANGUAGE as the egg description: "{{description}}".\n\n## Output Rules:\n1. Language: All explanations, questions, criteria, and rule guidance must be written in the same language as the egg description: "{{description}}".\n2. Egg Parser Structure: The structure and these exact labels MUST remain in English:\n   - Frontmatter (`---`, `topic: ...`, `status: ...`, `last_updated: ...`, `language: <detected language name in English, e.g. English, Chinese, Japanese, Korean, Spanish, French, German, Russian>`)\n   - Callout: `> [!abstract]- Instructions:`\n   - Bold section labels: `> **Scope:**`, `> **Action Guide:**`, `> **Key Questions:**`, `> **Worth Reading If, Skip If:**`, `> **Formatting Rules:**`\n   - Step labels in Action Guide: `1. Title Verdict:`, `2. Core Summary:`, `3. Chapter Map (Long-form only):`, `4. Novel Delta:`, `5. Decide:`\n   - Headings: `# Knowledge` and `# Unprocessed`\n   - Tag names in Formatting Rules: `[concept]`, `[architecture]`, `[method]`, `[benchmark]`, `[explain]`, `[fact]`, `[example]`\n\nOutput ONLY the complete updated egg file markdown. Do NOT wrap in markdown code fences.\n\n';

// ../shared/workflow/shared-output-rules.md
var shared_output_rules_default = '- Grounding: The content is the ONLY source of truth for every answer and summary you produce. Report what the content actually says even when it contradicts common sense or well-known facts \u2014 never correct, refute, or supplement it with outside knowledge. If the content does not address a question, say "Not covered in this content".\n- Source References: For every question you answer (customQuestionAnswers, keyQuestionAnswers, answers), include a "sources" array citing WHERE in the content the answer comes from: `[{"ref": "...", "quote": "..."}]`.\n  - For video transcripts: `ref` must be the timestamp string (e.g. "12:34" or "1:05:30") where the relevant segment begins.\n  - For articles/webpages: `ref` must be the nearest section heading (e.g. "Methodology" or "Key Findings") or short location hint.\n  - `quote`: A brief verbatim excerpt (10-25 words) from that location directly supporting the answer.\n  - If the question is not covered in the content (or answered "Not covered in this content"), omit the "sources" field or return an empty array `[]`.\n- Output Language: Write ALL output text (verdicts, summaries, answers, knowledge entries, reasons) in {{output_language}}. Keep all JSON keys in English.';

// ../shared/src/prompt-templates.ts
var PROMPTS = {
  /** Phase 1 — content summary + chapter map + custom question answers. */
  contentAnalysis: content_analysis_default,
  /** Step 1 extraction — content against one egg using instructions only. */
  eggAnalysis: egg_analysis_default,
  /** Follow-up questions after the initial analysis. */
  followUp: follow_up_default,
  /** Egg routing — match content to egg files from _index.md. */
  eggRouting: egg_routing_default,
  /** Default content analysis task (Title Verdict, Core Summary, Chapter Map). */
  contentTaskDefault: content_task_default_default.trim(),
  /** Merge 20+ Unprocessed entries into the Knowledge tree. */
  mergeUnprocessed: merge_unprocessed_default,
  /** Combine per-part results into one result for long content. */
  aggregateContent: aggregate_content_default,
  /** Per-egg recommendation + key questions for long content (compact chunk drafts). */
  aggregateEgg: aggregate_egg_default,
  /** Localize egg template matching the description language while keeping parser structure in English. */
  localizeEgg: localize_egg_default,
  /** Shared output rules (grounding + language reference) injected into prompts. */
  sharedOutputRules: shared_output_rules_default.trim()
};
function renderPrompt(template, vars = {}) {
  if (!template)
    return "";
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
    const value = vars[key];
    return value === void 0 || value === null ? "" : String(value);
  });
}

// ../shared/src/types.ts
var DEFAULT_ANALYSIS_SECTIONS = {
  titleVerdict: true,
  coreSummary: true,
  mindMap: true,
  chapterMap: true
};

// ../shared/src/ai-processor.ts
function pruneTaskContent(taskText, sections) {
  if (!taskText)
    return "";
  const lines = taskText.split("\n");
  const filtered = lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed)
      return false;
    if (!sections.titleVerdict && /title\s*verdict/i.test(line))
      return false;
    if (!sections.coreSummary && /core\s*summary/i.test(line))
      return false;
    if (!sections.chapterMap && /chapter\s*map/i.test(line))
      return false;
    if (!sections.mindMap && /mind\s*map/i.test(line))
      return false;
    return true;
  });
  return filtered.map((line, idx) => line.replace(/^\s*\d+[\.\)]\s*/, `${idx + 1}. `)).join("\n");
}
function pruneRulesFromTemplate(rulesBlock, sections) {
  if (!rulesBlock)
    return "";
  const lines = rulesBlock.split("\n");
  const result = [];
  let skippingCurrentBullet = false;
  for (const line of lines) {
    const isBulletStart = /^\s*[-*]\s+/.test(line);
    if (isBulletStart) {
      skippingCurrentBullet = false;
      if (!sections.titleVerdict && /^\s*[-*]\s*titleVerdict\b/i.test(line)) {
        skippingCurrentBullet = true;
        continue;
      }
      if (!sections.coreSummary && /^\s*[-*]\s*coreSummary\b/i.test(line)) {
        skippingCurrentBullet = true;
        continue;
      }
      if (!sections.mindMap && /^\s*[-*]\s*mindMap\b/i.test(line)) {
        skippingCurrentBullet = true;
        continue;
      }
      if (!sections.chapterMap && /^\s*[-*]\s*(chapterMap|isLongForm)\b/i.test(line)) {
        skippingCurrentBullet = true;
        continue;
      }
    }
    if (!skippingCurrentBullet) {
      result.push(line);
    }
  }
  return result.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
function pruneSchemaFromTemplate(schemaText, sections) {
  const startIdx = schemaText.indexOf("{");
  const endIdx = schemaText.lastIndexOf("}");
  if (startIdx === -1 || endIdx === -1)
    return schemaText;
  const inner = schemaText.slice(startIdx + 1, endIdx);
  const properties = [];
  let depth = 0;
  let inString = false;
  let escaped = false;
  let currentProp = "";
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i];
    if (inString) {
      currentProp += c;
      if (escaped) {
        escaped = false;
      } else if (c === "\\") {
        escaped = true;
      } else if (c === '"') {
        inString = false;
      }
      continue;
    }
    if (c === '"') {
      inString = true;
      currentProp += c;
      continue;
    }
    if (c === "{" || c === "[") {
      depth++;
      currentProp += c;
      continue;
    }
    if (c === "}" || c === "]") {
      depth--;
      currentProp += c;
      continue;
    }
    if (c === "," && depth === 0) {
      properties.push(currentProp);
      currentProp = "";
      continue;
    }
    currentProp += c;
  }
  if (currentProp.trim()) {
    properties.push(currentProp);
  }
  const filtered = properties.filter((prop) => {
    const keyMatch = prop.match(/"([^"]+)"\s*:/);
    if (!keyMatch)
      return true;
    const key = keyMatch[1];
    if (!sections.titleVerdict && key === "titleVerdict")
      return false;
    if (!sections.coreSummary && key === "coreSummary")
      return false;
    if (!sections.mindMap && key === "mindMap")
      return false;
    if (!sections.chapterMap && (key === "chapterMap" || key === "isLongForm"))
      return false;
    return true;
  });
  return "{\n  " + filtered.map((p) => p.trim()).join(",\n  ") + "\n}";
}
function applyPrunedSections(tpl, sections, _isAggregate = false) {
  const isDefault = sections.titleVerdict && sections.coreSummary && sections.mindMap && sections.chapterMap;
  if (isDefault)
    return tpl;
  let out = tpl;
  out = out.replace(
    /(## Task[^\n]*\n)([\s\S]*?)(\n##\s+|$)/,
    (match, header, taskBody, footer) => {
      if (taskBody.includes("{{content_task_default}}")) {
        return match;
      }
      const pruned = pruneTaskContent(taskBody, sections);
      return `${header}${pruned}${footer}`;
    }
  );
  const formatIdx = out.indexOf("## Output Format");
  if (formatIdx !== -1) {
    const afterFormat = formatIdx + "## Output Format".length;
    const nextHeaderMatch = out.slice(afterFormat).search(/\n##\s+/);
    const endOfFormatIdx = nextHeaderMatch !== -1 ? afterFormat + nextHeaderMatch : out.length;
    const formatSection = out.slice(formatIdx, endOfFormatIdx);
    const startBrace = formatSection.indexOf("{");
    const endBrace = formatSection.lastIndexOf("}");
    if (startBrace !== -1 && endBrace !== -1 && endBrace > startBrace) {
      const schemaBody = formatSection.slice(startBrace, endBrace + 1);
      const pruned = pruneSchemaFromTemplate(schemaBody, sections);
      out = out.slice(0, formatIdx + startBrace) + pruned + out.slice(formatIdx + endBrace + 1);
    }
  }
  out = out.replace(
    /(## Output Rules[^\n]*\n)([\s\S]*?)(\{\{shared_output_rules\}\}|\n##\s+|$)/,
    (match, header, rulesBody, footer) => {
      const pruned = pruneRulesFromTemplate(rulesBody, sections);
      return `${header}${pruned}
${footer}`;
    }
  );
  return out;
}
var MERGE_THRESHOLD = 20;
var AIProcessor = class {
  host;
  constructor(host) {
    this.host = host;
  }
  get chunkWindowChars() {
    const val = this.host?.settings?.chunkWindowChars;
    return typeof val === "number" && val > 0 ? val : DEFAULT_CHUNK_WINDOW_CHARS;
  }
  get sectionGridSeconds() {
    const val = this.host?.settings?.sectionGridSeconds;
    return typeof val === "number" && val > 0 ? val : DEFAULT_SECTION_SECS;
  }
  getPrompt(key) {
    const overrides = this.host?.settings?.promptOverrides || this.host?.settings?.chromeAiPromptOverrides;
    if (overrides && typeof overrides[key] === "string" && overrides[key].trim().length > 0) {
      return overrides[key];
    }
    return this.host?.workflowManager?.getPrompt(key) || PROMPTS[key] || "";
  }
  /** Output rules for Stage 1 content analysis (follows payload.outputLanguage or host settings.outputLanguage). */
  getContentOutputRules(capture2, scope = "within") {
    const langSetting = capture2?.outputLanguage || this.host?.settings?.outputLanguage || "same-as-content";
    const isSame = !langSetting || langSetting === "same-as-content";
    const outputLanguage = isSame ? "the same language as the captured content" : `${langSetting} (translate into ${langSetting} even if the source content is in a different language)`;
    const tpl = this.getPrompt("sharedOutputRules");
    let rendered = renderPrompt(tpl, { output_language: outputLanguage }).trim();
    if (scope === "beyond") {
      const globalModeRule = "- Mode: Global Mode (Open / External Knowledge). You are in Global Mode and are NOT restricted to the provided content. You MUST use your full external world knowledge, independent reasoning, and fact-checking capabilities to answer questions. The provided content is only reference context or the subject of inquiry, NOT an exclusive boundary or sole source of truth. Freely fact-check, verify, refute, critique, supplement, or answer open-ended questions using general world knowledge. Do NOT limit your answer to only what is stated in the content.";
      const globalSourceRule = '- Source References: In Global Mode, source references to the content are optional. If an answer draws on external knowledge, set "sources": []. Only include sources if you are directly citing or quoting a specific passage from the provided content.';
      if (/^[ \t]*- Grounding:.*(?:\r?\n|$)/m.test(rendered)) {
        rendered = rendered.replace(/^[ \t]*- Grounding:.*(?:\r?\n|$)/m, `${globalModeRule}
`);
      } else {
        rendered = `${globalModeRule}
${rendered}`;
      }
      if (/^[ \t]*- Source References:[\s\S]*?(?=\n[ \t]*- Output Language:|\Z)/m.test(rendered)) {
        rendered = rendered.replace(
          /^[ \t]*- Source References:[\s\S]*?(?=\n[ \t]*- Output Language:|\Z)/m,
          `${globalSourceRule}
`
        );
      }
      rendered = rendered.trim();
    }
    return rendered;
  }
  /** Output rules for Stage 2 egg analysis (follows the egg's language property). */
  getEggOutputRules(eggOrLanguage = "", fallbackDescription = "", capture2) {
    let lang = "";
    let desc = fallbackDescription;
    if (typeof eggOrLanguage === "object" && eggOrLanguage !== null) {
      lang = (eggOrLanguage.language || "").trim();
      desc = desc || (eggOrLanguage.indexDescription || "").trim();
    } else {
      lang = (eggOrLanguage || "").trim();
    }
    const hostSetting = capture2?.outputLanguage || this.host?.settings?.outputLanguage;
    const hostLang = hostSetting && hostSetting !== "same-as-content" ? hostSetting.trim() : "";
    const outputLanguage = lang ? lang.includes(" ") && !/^[A-Za-z]+$/.test(lang) ? `the same language as this reference: "${lang}"` : `${lang} (translate into ${lang} even if the source content is in a different language)` : hostLang ? `${hostLang} (translate into ${hostLang} even if the source content is in a different language)` : "the same language as the captured content";
    const tpl = this.getPrompt("sharedOutputRules");
    return renderPrompt(tpl, {
      output_language: outputLanguage
    }).trim();
  }
  /**
   * Run end-to-end pipeline: Stage 1 content analysis + Stage 2 egg analysis.
   */
  async analyze(capture2, eggs) {
    if (!isAIConfigured(this.host?.settings)) {
      return this.fallbackAnalysis(capture2, eggs);
    }
    const contentAnalysis = await this.analyzeContent(capture2);
    return this.analyzeEggs(capture2, eggs, contentAnalysis);
  }
  /**
   * Stage 1 — content summary + chapter map + custom question answers.
   * Handles long-form chunked content with aggregation or single-chunk content.
   */
  async analyzeContent(capture2) {
    const effectiveSections = {
      ...DEFAULT_ANALYSIS_SECTIONS,
      ...capture2.enabledSections || {}
    };
    if (!isAIConfigured(this.host?.settings)) {
      return {
        titleVerdict: effectiveSections.titleVerdict ? capture2.title : "",
        coreSummary: effectiveSections.coreSummary ? [capture2.title] : [],
        isLongForm: false,
        chapterMap: [],
        customQuestionAnswers: (capture2.questions || []).map((q) => ({
          question: q,
          answer: "No API key configured \u2014 cannot answer.",
          scope: capture2.questionsScope || "within"
        })),
        mindMap: []
      };
    }
    const chunks = this.chunkContent(capture2.content, capture2.chapters || []);
    if (chunks.length > 1) {
      const partResults = await Promise.all(
        chunks.map(
          (chunk) => this.callContentChunk(
            {
              ...capture2,
              content: chunk.content,
              chapters: chunk.chapters,
              sections: chunk.sections,
              questions: [],
              enabledSections: effectiveSections
            },
            partNote(chunk)
          )
        )
      );
      const summary = await this.aggregateContent(
        {
          ...capture2,
          enabledSections: effectiveSections
        },
        partResults.map((r, i) => ({
          part: i + 1,
          startTime: chunks[i].startTime,
          bullets: r.coreSummary,
          mindMap: effectiveSections.mindMap ? r.mindMap : void 0
        }))
      );
      const chapterMap = effectiveSections.chapterMap ? partResults.flatMap((r) => r.chapterMap) : [];
      return {
        titleVerdict: summary.titleVerdict,
        coreSummary: summary.coreSummary,
        isLongForm: true,
        chapterMap,
        customQuestionAnswers: summary.customQuestionAnswers,
        mindMap: summary.mindMap
      };
    }
    const single = chunks[0];
    const effective = {
      ...capture2,
      chapters: single?.chapters,
      sections: single?.sections,
      enabledSections: effectiveSections
    };
    return this.callContentChunk(effective, "");
  }
  /**
   * Stage 2 — follow egg instructions and synthesize reading recommendations.
   * Existing notes are only read during merge.
   */
  async analyzeEggs(capture2, eggs, contentAnalysis) {
    if (!isAIConfigured(this.host?.settings) || !eggs.length) {
      return {
        ...contentAnalysis,
        schemaVersion: 3,
        shouldRead: null,
        shouldReadReason: eggs.length ? "AI analysis unavailable." : "",
        matchedEggs: eggs.map((e) => e.fileName),
        eggResults: [],
        newKnowledge: [],
        ...eggs.length ? { readAction: "uncertain" } : {}
      };
    }
    const chunks = this.chunkContent(capture2.content, capture2.chapters || []);
    const signals = this.eggStage1Signals(capture2, contentAnalysis);
    const eggResults = await Promise.all(eggs.map(async (egg2) => {
      if (chunks.length === 1)
        return await this.analyzeAgainstEgg(capture2, egg2, "", signals) || this.failedEgg(egg2);
      const parts = await Promise.all(chunks.map((chunk) => this.analyzeAgainstEgg(
        { ...capture2, content: chunk.content },
        egg2,
        partNote(chunk),
        signals
      )));
      const entries = parts.flatMap((part) => part?.extractedEntries || []);
      try {
        const aggregate = await this.aggregateEgg(egg2, chunks.map((chunk, i) => ({
          part: i + 1,
          startTime: chunk.startTime,
          success: !!parts[i],
          keyQuestionAnswers: parts[i]?.keyQuestionAnswers || [],
          readAction: parts[i]?.readAction || "uncertain",
          readVerdictReason: parts[i]?.readVerdictReason || "Part failed to process.",
          readingSources: parts[i]?.readingSources || []
        })), signals);
        if (parts.some((p) => !p))
          Object.assign(aggregate, {
            readAction: "uncertain",
            readVerdict: null,
            readVerdictReason: "Some parts failed to process; coverage is incomplete."
          });
        return { egg: egg2.fileName, language: parts.find((p) => p?.language)?.language, extractedEntries: entries, ...aggregate };
      } catch (err) {
        console.warn(`[NutEgg] Aggregate failed for ${egg2.fileName}`, err);
        return {
          ...this.failedEgg(egg2),
          extractedEntries: entries,
          readVerdictReason: "Whole-content aggregation failed; showing available per-part answers.",
          keyQuestionAnswers: parts.flatMap((part, i) => (part?.keyQuestionAnswers || []).map((answer) => ({
            ...answer,
            question: `[Part ${i + 1}] ${answer.question}`
          })))
        };
      }
    }));
    const newKnowledge = eggResults.flatMap((result) => {
      const items = result.extractedEntries.map((entry) => ({
        egg: result.egg,
        content: this.saveEntryBody(entry.content, entry.sources || [])
      }));
      for (const answer of result.keyQuestionAnswers) {
        if (answer.answered === false || /^(?:not addressed in this content|not addressed in this part)[.!]?$/i.test(answer.answer.trim()))
          continue;
        const body = `**${answer.question}**
${answer.answer}`;
        items.push({ egg: result.egg, content: this.saveEntryBody(body, answer.sources || []) });
      }
      return items.filter((item, i) => items.findIndex((other) => other.content === item.content) === i);
    });
    return {
      ...contentAnalysis,
      schemaVersion: 3,
      ...this.mergeVerdict(eggResults),
      matchedEggs: eggs.map((e) => e.fileName),
      eggResults,
      newKnowledge
    };
  }
  saveEntryBody(body, sources) {
    const refs = sources.map((s) => `  - Source location: ${s.ref}${s.quote ? ` \u2014 ${s.quote}` : ""}`).join("\n");
    return `${body.startsWith("- ") ? body : `- ${body.replace(/\n/g, "\n  ")}`}${refs ? `
${refs}` : ""}`;
  }
  failedEgg(egg2) {
    return {
      egg: egg2.fileName,
      keyQuestionAnswers: [],
      extractedEntries: [],
      readAction: "uncertain",
      readVerdict: null,
      readVerdictReason: "Egg analysis unavailable or failed.",
      readingSources: []
    };
  }
  eggStage1Signals(capture2, analysis) {
    return [
      capture2.enabledSections?.titleVerdict !== false && analysis.titleVerdict ? `Stage 1 title answer: ${analysis.titleVerdict}` : "",
      capture2.enabledSections?.coreSummary !== false && analysis.coreSummary?.length ? `Stage 1 summary:
${analysis.coreSummary.join("\n")}` : ""
    ].filter(Boolean).join("\n\n");
  }
  /** Phase 1 — content-level summary + chapter map + custom question answers. */
  async callContentChunk(capture2, partNoteStr = "") {
    const sections = {
      ...DEFAULT_ANALYSIS_SECTIONS,
      ...capture2.enabledSections || {}
    };
    const rawTpl = this.getPrompt("contentAnalysis");
    const prunedTpl = applyPrunedSections(rawTpl, sections, false);
    const rawTask = this.getPrompt("contentTaskDefault");
    const prunedTask = pruneTaskContent(rawTask, sections);
    const prompt = renderPrompt(prunedTpl, {
      content_task_default: prunedTask,
      title: capture2.title,
      url: capture2.url,
      source_type: capture2.sourceType,
      part_note: partNoteStr,
      chapters: sections.chapterMap ? this.chaptersBlock(capture2.chapters) : "",
      sections: sections.chapterMap ? this.sectionsBlock(capture2.sections) : "",
      questions: this.questionsBlock(
        capture2.questions,
        capture2.questionsScope === "beyond" ? "User Questions \u2014 Global Mode (answer using broad external world knowledge, reasoning, and fact-checking)" : "User Questions (answer each directly and concisely)"
      ),
      content: this.truncate(capture2.content, this.chunkWindowChars),
      shared_output_rules: this.getContentOutputRules(capture2, capture2.questionsScope || "within")
    });
    const configuredMax = this.host?.settings?.contentAnalysisMaxTokens || 16384;
    const response2 = await this.callAI(prompt, configuredMax);
    const parsed = this.parseJson(response2, "content-analysis");
    return {
      titleVerdict: sections.titleVerdict ? String(parsed.titleVerdict || "Could not generate a verdict.") : "",
      coreSummary: sections.coreSummary && Array.isArray(parsed.coreSummary) ? parsed.coreSummary.map(String).slice(0, 3) : [],
      mindMap: sections.mindMap ? this.parseMindMap(parsed.mindMap) : [],
      isLongForm: sections.chapterMap ? parsed.isLongForm === true : false,
      chapterMap: !sections.chapterMap ? [] : parsed.isLongForm === false && (!capture2.chapters || capture2.chapters.length === 0) ? [] : this.completeChapterMap(
        Array.isArray(parsed.chapterMap) ? parsed.chapterMap.filter((c) => c && (c.time || c.title)).map((c) => ({
          time: String(c.time || ""),
          title: String(c.title || ""),
          summary: String(c.summary || "")
        })) : [],
        capture2.sections
      ),
      customQuestionAnswers: this.parseKeyAnswers(parsed.customQuestionAnswers).map((a) => ({
        ...a,
        scope: a.scope || capture2.questionsScope || "within"
      }))
    };
  }
  /** One instruction-driven call per egg/part, without existing knowledge. */
  async analyzeAgainstEgg(capture2, egg2, partNoteStr = "", signals = "") {
    const prompt = renderPrompt(this.getPrompt("eggAnalysis"), {
      egg_file: egg2.fileName,
      egg_instructions: formatEggInstructionsForPrompt(egg2),
      stage1_signals: signals,
      title: capture2.title,
      url: capture2.url,
      source_type: capture2.sourceType,
      part_note: partNoteStr,
      content: capture2.content,
      shared_output_rules: this.getEggOutputRules(egg2, "", capture2)
    });
    try {
      const parsed = this.parseJson(await this.callAI(prompt, this.host?.settings?.contentAnalysisMaxTokens || 16384), "egg-analysis");
      return {
        egg: egg2.fileName,
        language: typeof parsed.language === "string" ? parsed.language : egg2.language,
        keyQuestionAnswers: this.parseKeyAnswers(parsed.keyQuestionAnswers),
        extractedEntries: this.parseExtractedEntries(parsed.extractedEntries),
        ...this.parseRecommendation(parsed)
      };
    } catch (err) {
      console.warn(`[NutEgg] Egg analysis failed for ${egg2.fileName}`, err);
      return null;
    }
  }
  parseRecommendation(parsed) {
    const actions = ["full", "highlights", "summary", "skip", "uncertain"];
    const readAction = actions.includes(parsed.readAction) ? parsed.readAction : "uncertain";
    return {
      readAction,
      readVerdict: this.actionVerdict(readAction),
      readVerdictReason: typeof parsed.readVerdictReason === "string" ? parsed.readVerdictReason : "Recommendation unavailable.",
      readingSources: this.parseSources(parsed.readingSources)
    };
  }
  actionVerdict(action) {
    return action === "uncertain" ? null : action === "full" || action === "highlights";
  }
  parseSources(raw) {
    return Array.isArray(raw) ? raw.filter((s) => s && typeof s.ref === "string" && s.ref.trim()).map((s) => ({
      ref: s.ref.trim(),
      ...typeof s.quote === "string" ? { quote: s.quote } : {}
    })) : [];
  }
  parseExtractedEntries(raw) {
    return Array.isArray(raw) ? raw.filter((e) => e && typeof e.content === "string" && e.content.trim()).map((e) => ({
      kind: e.kind === "list" || e.kind === "answer" ? e.kind : "insight",
      content: e.content.trim(),
      sources: this.parseSources(e.sources)
    })) : [];
  }
  /** Aggregate the per-part content summaries into one result. */
  async aggregateContent(capture2, chunkSummaries) {
    const sections = {
      ...DEFAULT_ANALYSIS_SECTIONS,
      ...capture2.enabledSections || {}
    };
    const rawTpl = this.getPrompt("aggregateContent");
    const prunedTpl = applyPrunedSections(rawTpl, sections, true);
    const rawTask = this.getPrompt("contentTaskDefault");
    const prunedTask = pruneTaskContent(rawTask, sections);
    const prompt = renderPrompt(prunedTpl, {
      title: capture2.title,
      url: capture2.url,
      chapters: sections.chapterMap ? this.chaptersBlock(capture2.chapters) : "",
      chunk_summaries: chunkSummaries.map((c) => {
        const at = c.startTime ? ` (${c.startTime})` : "";
        const bullets = c.bullets.map((b) => `- ${b}`).join("\n");
        let mmStr = "";
        if (sections.mindMap && Array.isArray(c.mindMap) && c.mindMap.length > 0) {
          mmStr = "\n### Key Concepts/Branches from this part:\n" + c.mindMap.map(
            (n) => `- **${n.name}**${n.detail ? `: ${n.detail}` : ""}`
          ).join("\n");
        }
        return `## Part ${c.part} of ${chunkSummaries.length}${at}
${bullets || "- (no summary)"}${mmStr}`;
      }).join("\n\n"),
      questions: this.questionsBlock(
        capture2.questions,
        capture2.questionsScope === "beyond" ? "User Questions \u2014 Global Mode (answer using broad external world knowledge, reasoning, and fact-checking)" : "User Questions (answer each directly and concisely)"
      ),
      content_task_default: prunedTask,
      shared_output_rules: this.getContentOutputRules(capture2, capture2.questionsScope || "within")
    });
    const defaultMax = sections.mindMap ? 4096 : 1500;
    const budget = Math.max(defaultMax, this.host?.settings?.contentAnalysisMaxTokens || defaultMax);
    const response2 = await this.callAI(prompt, budget);
    const parsed = this.parseJson(response2, "aggregate-content");
    return {
      titleVerdict: sections.titleVerdict ? String(parsed.titleVerdict || "Could not generate a verdict.") : "",
      coreSummary: sections.coreSummary && Array.isArray(parsed.coreSummary) ? parsed.coreSummary.map(String).slice(0, 3) : [],
      customQuestionAnswers: this.parseKeyAnswers(parsed.customQuestionAnswers).map((a) => ({
        ...a,
        scope: a.scope || capture2.questionsScope || "within"
      })),
      mindMap: sections.mindMap ? this.parseMindMap(parsed.mindMap) : []
    };
  }
  /** Whole-source answers/recommendation; no raw content or entry bodies. */
  async aggregateEgg(egg2, findings, signals = "") {
    const prompt = renderPrompt(this.getPrompt("aggregateEgg"), {
      egg_file: egg2.fileName,
      scope: egg2.scope,
      key_questions: egg2.keyQuestions.join("\n"),
      worth_reading_if: egg2.worthReadingIf.join("\n"),
      skip_if: egg2.skipIf.join("\n"),
      stage1_signals: signals,
      chunk_findings: JSON.stringify(findings),
      shared_output_rules: this.getEggOutputRules(egg2)
    });
    const parsed = this.parseJson(await this.callAI(prompt, Math.max(4096, egg2.keyQuestions.length * 512)), "aggregate-egg");
    return { keyQuestionAnswers: this.parseKeyAnswers(parsed.keyQuestionAnswers), ...this.parseRecommendation(parsed) };
  }
  /**
   * Localize an egg template (from templates/egg.md) into the same language as
   * the egg description. Keeps the structure and parser keywords in English.
   * Returns null when unavailable (no API key, AI error).
   */
  async localizeEggTemplate(templateContent, description) {
    if (!isAIConfigured(this.host?.settings))
      return null;
    try {
      const prompt = renderPrompt(this.getPrompt("localizeEgg"), {
        description,
        template: templateContent
      });
      const maxTokens = Math.max(8192, this.host?.settings?.contentAnalysisMaxTokens || 8192);
      const response2 = await this.callAI(prompt, maxTokens);
      let text = response2.trim();
      text = text.replace(/^```[a-z]*\s*\n/i, "").replace(/\n```$/g, "").trim();
      if (text.includes("[!abstract]") && text.includes("**Scope:**") && text.includes("**Action Guide:**") && text.includes("# Knowledge") && text.includes("# Unprocessed")) {
        const language = extractEggLanguage(text);
        return { content: text, language };
      }
      return null;
    } catch (err) {
      console.warn("[NutEgg] AI egg template localization failed:", err);
      return null;
    }
  }
  /**
   * Split content into <=chunkWindowChars parts. Timestamped transcripts
   * (YouTube) are split at caption lines and chapters are attached to the
   * chunk covering their start time; plain text is split at paragraphs.
   */
  chunkContent(content, chapters) {
    return chunkContent(
      content,
      chapters,
      this.chunkWindowChars,
      this.sectionGridSeconds
    );
  }
  mergeVerdict(results) {
    const order = ["full", "highlights", "uncertain", "summary", "skip"];
    const readAction = order.find((action) => results.some((r) => r.readAction === action)) || "uncertain";
    return {
      readAction,
      shouldRead: this.actionVerdict(readAction),
      shouldReadReason: results.filter((r) => r.readAction === readAction).map((r) => `${r.egg}: ${r.readVerdictReason}`).join(" "),
      readingSources: results.filter((r) => r.readAction === "full" || r.readAction === "highlights").flatMap((r) => r.readingSources)
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
      mindMap: [],
      shouldRead: null,
      readAction: "uncertain",
      schemaVersion: 3,
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
  async askFollowUp(capture2, questions, priorQa = [], scope = "within") {
    if (questions.length === 0)
      return [];
    if (!isAIConfigured(this.host?.settings)) {
      const aiProvider = this.host?.settings?.chromeAiProvider || this.host?.settings?.aiProvider;
      const msg = aiProvider === "local" ? "Local LLM not configured \u2014 cannot answer." : "No API key configured \u2014 cannot answer.";
      return questions.map((q) => ({
        question: q,
        answer: msg,
        scope
      }));
    }
    let priorBlock = "";
    if (Array.isArray(priorQa) && priorQa.length > 0) {
      priorBlock = `## Previous Questions & Answers (context \u2014 refer back instead of repeating)
${priorQa.map((qa) => typeof qa === "string" ? qa : `Q: ${qa.question}
A: ${qa.answer}`).join("\n")}`;
    } else if (typeof priorQa === "string" && priorQa.trim().length > 0) {
      priorBlock = `## Previous Questions & Answers (context \u2014 refer back instead of repeating)
${priorQa.trim()}`;
    }
    const prompt = renderPrompt(this.getPrompt("followUp"), {
      title: capture2.title,
      url: capture2.url,
      source_type: capture2.sourceType,
      prior_qa: priorBlock,
      content: this.truncate(capture2.content, this.chunkWindowChars),
      questions: questions.map((q, i) => `${i + 1}. ${q}`).join("\n"),
      shared_output_rules: this.getContentOutputRules(capture2, scope)
    });
    try {
      const response2 = await this.callAI(prompt, 2e3);
      const parsed = this.parseJson(response2, "follow-up");
      const answers = this.parseKeyAnswers(parsed.answers);
      const byQuestion = new Map(answers.map((a) => [a.question, a]));
      return questions.map((q) => {
        const found = byQuestion.get(q);
        const item = {
          question: q,
          answer: found?.answer || "No answer returned \u2014 please try again.",
          scope: found?.scope || scope
        };
        if (found?.sources && found.sources.length > 0) {
          item.sources = found.sources;
        }
        return item;
      });
    } catch (err) {
      if (err instanceof AIError)
        throw err;
      console.error("[NutEgg] Follow-up question failed:", err);
      return questions.map((q) => ({
        question: q,
        answer: "Failed to answer \u2014 please try again.",
        scope
      }));
    }
  }
  /**
   * Merge an egg's Unprocessed entries into its Knowledge tree on demand.
   * Merges whenever there is at least 1 unprocessed entry.
   */
  mergeJobs = /* @__PURE__ */ new Map();
  async mergeEgg(fileName) {
    const existing = this.mergeJobs.get(fileName);
    if (existing)
      return existing;
    const job = this.performMergeEgg(fileName).finally(() => this.mergeJobs.delete(fileName));
    this.mergeJobs.set(fileName, job);
    return job;
  }
  async performMergeEgg(fileName, retried = false) {
    const egg2 = await this.host?.eggParser?.readEgg?.(fileName);
    if (!egg2)
      return null;
    const countFn = (e) => this.host?.eggParser?.countUnprocessed ? this.host.eggParser.countUnprocessed(e) : countUnprocessed(e);
    const entries = countFn(egg2);
    if (entries === 0) {
      console.log(`[NutEgg] ${fileName} has no unprocessed entries to merge`);
      return null;
    }
    if (!isAIConfigured(this.host?.settings)) {
      console.log(
        `[NutEgg] ${fileName} has ${entries} unprocessed entries \u2014 skipped merge (AI not configured)`
      );
      return null;
    }
    let fallbackDesc = "";
    if (!egg2.language && this.host?.indexReader) {
      try {
        const indexContent = await this.host.indexReader.getIndexContent?.();
        if (indexContent) {
          const indexEntries = this.host.indexReader.parseIndexContent?.(indexContent) || [];
          const indexEntry = indexEntries.find(
            (e) => e.fileName === fileName || e.fileName.endsWith("/" + fileName)
          );
          fallbackDesc = indexEntry?.description || "";
        }
      } catch {
      }
    }
    const hostSetting = this.host?.settings?.outputLanguage;
    const hostLang = hostSetting && hostSetting !== "same-as-content" ? hostSetting.trim() : "";
    const outputLanguage = egg2.language || (hostLang ? `${hostLang} (translate into ${hostLang} even if the source is in a different language)` : "") || "the same language as this egg's existing knowledge";
    const prompt = renderPrompt(this.getPrompt("mergeUnprocessed"), {
      egg_file: fileName,
      output_language: outputLanguage,
      egg_description: fallbackDesc || egg2.scope || egg2.topic || "",
      formatting_rules: egg2.formattingRules || "(none)",
      knowledge_tree: egg2.knowledge || "(empty)",
      unprocessed: egg2.unprocessed,
      unprocessed_count: entries
    });
    try {
      const needed = Math.max(4096, Math.ceil((egg2.knowledge.length + egg2.unprocessed.length) / 1.5) + 1024);
      const cap = Number(this.host?.settings?.mergeMaxTokens || this.host?.settings?.contentAnalysisMaxTokens || 16384);
      if (needed > cap) {
        console.warn(`[NutEgg] Merge deferred for ${fileName}: full tree exceeds output budget.`);
        return null;
      }
      const response2 = await this.callAI(prompt, needed);
      const raw = response2.trim().replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
      const parsed = JSON.parse(raw);
      if (typeof parsed.knowledge !== "string" || !parsed.knowledge.trim() || typeof parsed.unprocessed !== "string")
        return null;
      const knowledge = parsed.knowledge.trim();
      const unprocessed = parsed.unprocessed.trim();
      const current = await this.host?.eggParser?.readEgg?.(fileName);
      const changed = current && (egg2.sourceText ? current.sourceText !== egg2.sourceText : current.knowledge !== egg2.knowledge || current.unprocessed !== egg2.unprocessed);
      if (changed)
        return retried ? null : this.performMergeEgg(fileName, true);
      const applied = await this.host?.eggParser?.applyMerge?.(fileName, knowledge, unprocessed, egg2);
      if (applied === false)
        return retried ? null : this.performMergeEgg(fileName, true);
      console.log(`[NutEgg] Merged ${entries} unprocessed entries into ${fileName}`);
      return { egg: fileName, entries };
    } catch (err) {
      console.error(`[NutEgg] Merge failed for ${fileName}:`, err);
      return null;
    }
  }
  /**
   * Threshold-based merge helper scheduled after durable Hatch saving.
   */
  async maybeMergeEgg(fileName) {
    const egg2 = await this.host?.eggParser?.readEgg?.(fileName);
    if (!egg2)
      return null;
    const countFn = (e) => this.host?.eggParser?.countUnprocessed ? this.host.eggParser.countUnprocessed(e) : countUnprocessed(e);
    const entries = countFn(egg2);
    if (entries < MERGE_THRESHOLD)
      return null;
    return this.mergeEgg(fileName);
  }
  // --- Prompt building helpers ---
  /** `## Video Chapters (use these EXACT timestamps)` block, or "". */
  chaptersBlock(chapters) {
    if (!chapters?.length)
      return "";
    return `## Video Chapters (use these EXACT timestamps)
${chapters.map((c) => `- ${c.time} \u2014 ${c.title}`).join("\n")}`;
  }
  /** 5-minute section grid for videos without chapters, or "". */
  sectionsBlock(sections) {
    if (!sections?.length)
      return "";
    return `## Video Sections (one chapterMap entry per section, EXACT start time)
${sections.map((s) => `- [${s}]`).join("\n")}`;
  }
  /**
   * Guarantee the chapter map covers the whole video: when a section grid
   * was provided, keep one entry per section (the AI's title/summary for
   * matching times, blank for any section the model skipped).
   */
  completeChapterMap(parsed, sections) {
    if (!sections?.length)
      return parsed;
    if (!parsed || parsed.length === 0)
      return [];
    const byTime = new Map(parsed.map((e) => [toSeconds(e.time), e]));
    return sections.map((s) => {
      const e = byTime.get(toSeconds(s));
      return { time: s, title: e?.title || "", summary: e?.summary || "" };
    });
  }
  /** Numbered questions block with a heading, or "". */
  questionsBlock(questions, heading) {
    if (!questions?.length)
      return "";
    return `## ${heading}
${questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`;
  }
  async callAI(prompt, maxTokens) {
    if (!this.host?.aiClient) {
      throw new AIError("unknown", "AIClient not provided to AIProcessor host");
    }
    return await this.host.aiClient.chat(prompt, maxTokens);
  }
  /** Normalize a `[{question, answer, sources}]` array from the AI response. */
  parseKeyAnswers(raw) {
    return Array.isArray(raw) ? raw.filter((qa) => qa && qa.question && qa.answer).map((qa) => {
      const entry = {
        question: String(qa.question),
        answer: String(qa.answer)
      };
      if (typeof qa.answered === "boolean")
        entry.answered = qa.answered;
      if (qa.scope === "within" || qa.scope === "beyond") {
        entry.scope = qa.scope;
      }
      if (Array.isArray(qa.sources)) {
        const sources = qa.sources.filter((s) => s && (s.ref || s.timestamp || s.section)).map((s) => {
          const item = {
            ref: String(s.ref || s.timestamp || s.section).trim()
          };
          if (s.quote) {
            item.quote = String(s.quote).trim();
          }
          return item;
        }).filter((s) => s.ref.length > 0);
        if (sources.length > 0) {
          entry.sources = sources;
        }
      }
      return entry;
    }) : [];
  }
  /** Normalize a hierarchical mind map array from the AI response. */
  parseMindMap(raw, depth = 0) {
    if (!Array.isArray(raw) || depth > 5)
      return [];
    return raw.filter((item) => item && (item.name || item.title || item.topic)).map((item) => {
      const node = {
        name: String(item.name || item.title || item.topic).trim()
      };
      const detail = item.detail || item.description || item.summary;
      if (detail && typeof detail === "string" && detail.trim().length > 0) {
        node.detail = detail.trim();
      }
      if (Array.isArray(item.children) && item.children.length > 0) {
        const children = this.parseMindMap(item.children, depth + 1);
        if (children.length > 0) {
          node.children = children;
        }
      }
      return node;
    });
  }
  /**
   * Parse an AI response that should be JSON, stripping markdown fences.
   * Sanitizes unescaped control characters (\n, \r, \t) in strings and
   * recovers partial/truncated JSON when responses are cut off mid-stream.
   */
  parseJson(response2, context = "response") {
    return parseJson(response2, context);
  }
  truncate(text, maxChars) {
    if (text.length <= maxChars)
      return text;
    return text.substring(0, maxChars) + "\n\n[...truncated]";
  }
  toSeconds(time) {
    return toSeconds(time);
  }
  formatSeconds(sec) {
    return formatSeconds(sec);
  }
};

// ../shared/src/egg-parser.ts
var KNOWLEDGE_HEADING = "# Knowledge";
var UNPROCESSED_HEADING = "# Unprocessed";
function isEggPath(path, vaultFolder = "nutegg") {
  if (!path || typeof path !== "string")
    return false;
  const normalized = path.replace(/\\/g, "/").replace(/^\/+/, "");
  const folder = (vaultFolder || "").replace(/^\/+|\/+$/g, "");
  if (folder) {
    if (!normalized.startsWith(folder + "/"))
      return false;
    const rel = normalized.slice(folder.length + 1);
    if (rel.includes("/"))
      return false;
    if (rel.startsWith("_") || !rel.toLowerCase().endsWith(".md"))
      return false;
    return true;
  } else {
    if (normalized.includes("/"))
      return false;
    if (normalized.startsWith("_") || !normalized.toLowerCase().endsWith(".md"))
      return false;
    return true;
  }
}
function parseEggFile(fileName, content) {
  const result = {
    fileName,
    topic: "Unknown",
    language: "",
    scope: "",
    actionGuide: "",
    keyQuestions: [],
    worthReadingIf: [],
    skipIf: [],
    sourceText: content,
    formattingRules: "",
    knowledge: "",
    unprocessed: "",
    indexDescription: ""
  };
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (fmMatch) {
    for (const line of fmMatch[1].split(/\r?\n/)) {
      const kv = line.match(/^(\w+):\s*(.*)$/);
      if (!kv)
        continue;
      const key = kv[1].toLowerCase();
      const value = kv[2].trim().replace(/^"(.*)"$/, "$1");
      if (key === "topic")
        result.topic = value;
      if (key === "language")
        result.language = value;
    }
  }
  const callout = extractCallout(content);
  const sections = callout ? splitLabeledSections(callout) : /* @__PURE__ */ new Map();
  result.scope = (sections.get("scope") || "").trim();
  result.actionGuide = (sections.get("action guide") || "").trim();
  result.keyQuestions = parseListItems(sections.get("key questions") || "");
  result.worthReadingIf = parseListItems(sections.get("worth reading if") || "");
  result.skipIf = parseListItems(sections.get("skip if") || "");
  result.formattingRules = (sections.get("formatting rules") || "").trim();
  const lines = content.split(/\r?\n/);
  const knowledgeSection = findSection(lines, "knowledge");
  if (knowledgeSection) {
    result.knowledge = sectionBody(lines, knowledgeSection, "knowledge");
  }
  const unprocessedSection = findSection(lines, "unprocessed");
  if (unprocessedSection) {
    result.unprocessed = sectionBody(lines, unprocessedSection, "unprocessed");
  }
  return result;
}
function findSection(lines, name) {
  const wanted = name.toLowerCase();
  const start = lines.findIndex((l) => headingName(l) === wanted);
  if (start === -1)
    return null;
  let end = -1;
  if (wanted === "knowledge") {
    end = lines.findIndex(
      (l, i) => i > start && headingName(l) === "unprocessed"
    );
  }
  if (end === -1) {
    end = lines.findIndex((l, i) => {
      if (i <= start)
        return false;
      const head = headingName(l);
      return head !== null && head !== wanted;
    });
  }
  return { start, end: end === -1 ? lines.length : end };
}
function headingName(line) {
  const m = line.trim().match(/^#\s+(.+?)\s*#*\s*$/);
  if (!m)
    return null;
  return m[1].trim().toLowerCase();
}
function sectionBody(lines, section, name) {
  const body = lines.slice(section.start + 1, section.end);
  while (body.length > 0 && (body[0].trim() === "" || headingName(body[0]) === name.toLowerCase())) {
    body.shift();
  }
  return body.join("\n").replace(/\n+$/g, "");
}
function stripSectionHeading(body, name) {
  const lines = body.split("\n");
  const wanted = name.toLowerCase();
  while (lines.length > 0 && (lines[0].trim() === "" || headingName(lines[0]) === wanted)) {
    lines.shift();
  }
  return lines.join("\n").replace(/\s+$/g, "");
}
function extractCallout(content) {
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
function splitLabeledSections(text) {
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
function parseListItems(text) {
  return text.split("\n").map((l) => l.trim()).filter((l) => /^(?:\d+[.)]|[-*])\s+/.test(l)).map((l) => l.replace(/^(?:\d+[.)]|[-*])\s+/, ""));
}

// src/egg-parser.ts
var EggParser = class {
  plugin;
  constructor(plugin) {
    this.plugin = plugin;
  }
  async findFile(path) {
    const vault = this.plugin.app.vault;
    if (!await vault.adapter.exists(path))
      return null;
    return vault.getMarkdownFiles().find((file) => file.path === path) || null;
  }
  async readEgg(fileName, fallbackDescription) {
    let file = await this.findFile(fileName);
    if (!file && !fileName.includes("/")) {
      const parentDir = this.plugin.settings.indexFile.replace(/\/[^/]+$/, "");
      file = await this.findFile(`${parentDir}/${fileName}`);
    }
    if (!file) {
      const folder = this.plugin.vaultFolder || "nutegg";
      const allFiles = (this.plugin.app.vault.getMarkdownFiles?.() || []).filter(
        (f) => isEggPath(f.path, folder)
      );
      const base = fileName.split("/").pop().toLowerCase();
      const match = allFiles.find(
        (f) => f.path.split("/").pop().toLowerCase() === base
      );
      if (match)
        file = match;
    }
    if (!file) {
      console.warn(`[NutEgg] Egg file not found: ${fileName}`);
      return null;
    }
    const content = await this.plugin.app.vault.read(file);
    const parsed = this.parseEggFile(file.path || fileName, content);
    if (fallbackDescription && !parsed.indexDescription) {
      parsed.indexDescription = fallbackDescription;
    }
    return parsed;
  }
  async readEggs(entries) {
    const eggs = [];
    for (const entry of entries) {
      const egg2 = await this.readEgg(entry.fileName, entry.description);
      if (egg2) {
        egg2.indexDescription = entry.description;
        eggs.push(egg2);
      }
    }
    return eggs;
  }
  parseEggFile(fileName, content) {
    return parseEggFile(fileName, content);
  }
  formatEggInstructionsForPrompt(egg2) {
    return formatEggInstructionsForPrompt(egg2);
  }
  formatEggKnowledgeForPrompt(egg2) {
    return formatEggKnowledgeForPrompt(egg2);
  }
  formatEggForPrompt = (egg2) => {
    return formatEggForPrompt(egg2);
  };
  countUnprocessed(egg2) {
    return countUnprocessed(egg2);
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
    const file = await this.findFile(fileName);
    if (!file) {
      throw new Error(`Cannot append \u2014 egg file not found: ${fileName}`);
    }
    const transform = (existing) => {
      const lines = existing.replace(/\n+$/, "").split("\n");
      const section = findSection(lines, "unprocessed");
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
        lines.push("", UNPROCESSED_HEADING, "", block);
      }
      if (existing.includes(block))
        return existing;
      return lines.join("\n") + "\n";
    };
    if (this.plugin.app.vault.process)
      await this.plugin.app.vault.process(file, transform);
    else
      await this.plugin.app.vault.modify(file, transform(await this.plugin.app.vault.read(file)));
    console.log(`[NutEgg] Added unprocessed entry to ${fileName}`);
  }
  /**
   * Replace the Knowledge and Unprocessed sections with the merged output
   * from the merge AI call. Missing sections are created as needed.
   */
  async applyMerge(fileName, knowledge, unprocessed, expected) {
    const file = await this.findFile(fileName);
    if (!file) {
      console.warn(`[NutEgg] Cannot merge \u2014 egg file not found: ${fileName}`);
      return false;
    }
    knowledge = stripSectionHeading(knowledge, "knowledge");
    unprocessed = stripSectionHeading(unprocessed, "unprocessed");
    const kLines = knowledge.split("\n");
    const uIdx = kLines.findIndex((l) => headingName(l) === "unprocessed");
    if (uIdx !== -1) {
      const rest = stripSectionHeading(
        kLines.slice(uIdx).join("\n"),
        "unprocessed"
      );
      knowledge = kLines.slice(0, uIdx).join("\n").replace(/\s+$/g, "");
      if (!unprocessed)
        unprocessed = rest;
    }
    let applied = true;
    const transform = (existing) => {
      if (expected && (expected.sourceText ? existing !== expected.sourceText : parseEggFile(fileName, existing).knowledge !== expected.knowledge || parseEggFile(fileName, existing).unprocessed !== expected.unprocessed)) {
        applied = false;
        return existing;
      }
      let lines = existing.replace(/\n+$/, "").split("\n");
      const knowledgeSection = findSection(lines, "knowledge");
      if (knowledgeSection) {
        lines = [
          ...lines.slice(0, knowledgeSection.start + 1),
          "",
          ...knowledge.trim().split("\n"),
          ...lines.slice(knowledgeSection.end)
        ];
      } else {
        const unprocessedSection2 = findSection(lines, "unprocessed");
        if (unprocessedSection2) {
          lines = [
            ...lines.slice(0, unprocessedSection2.start),
            "",
            KNOWLEDGE_HEADING,
            "",
            ...knowledge.trim().split("\n"),
            "",
            ...lines.slice(unprocessedSection2.start)
          ];
        } else {
          lines = [...lines, "", KNOWLEDGE_HEADING, "", ...knowledge.trim().split("\n")];
        }
      }
      const unprocessedSection = findSection(lines, "unprocessed");
      const remainder = unprocessed.trim();
      if (unprocessedSection) {
        lines = [
          ...lines.slice(0, unprocessedSection.start + 1),
          ...remainder ? ["", ...remainder.split("\n")] : [],
          ...lines.slice(unprocessedSection.end)
        ];
      } else if (remainder) {
        lines = [...lines, "", UNPROCESSED_HEADING, "", ...remainder.split("\n")];
      }
      return lines.join("\n") + "\n";
    };
    if (this.plugin.app.vault.process)
      await this.plugin.app.vault.process(file, transform);
    else
      await this.plugin.app.vault.modify(file, transform(await this.plugin.app.vault.read(file)));
    return applied;
  }
};

// tests/obsidian-stub.ts
var TAbstractFile = class {
  path = "";
  name = "";
};
var TFile = class extends TAbstractFile {
  basename = "";
  extension = "";
};

// tests/helpers.ts
function makeFakeVault(initial = {}) {
  const files = new Map(Object.entries(initial));
  const basePath = "/fake/vault";
  const listeners = /* @__PURE__ */ new Map();
  const toTFile = (p) => Object.assign(new TFile(), {
    path: p,
    name: p.split("/").pop() || "",
    basename: (p.split("/").pop() || "").replace(/\.[^/.]+$/, ""),
    extension: p.split(".").pop() || ""
  });
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
    listeners,
    on: (event, callback) => {
      if (!listeners.has(event))
        listeners.set(event, []);
      listeners.get(event).push(callback);
    },
    trigger: (event, file) => {
      for (const cb of listeners.get(event) || []) {
        cb(file);
      }
    },
    create: async (p, content) => {
      files.set(p, content);
      vault.trigger("create", toTFile(p));
    },
    createFolder: async (_p) => {
    },
    modify: async (file, content) => {
      files.set(file.path, content);
      vault.trigger("modify", toTFile(file.path));
    },
    read: async (file) => {
      if (!files.has(file.path))
        throw new Error("File not found: " + file.path);
      return files.get(file.path);
    },
    delete: async (file) => {
      files.delete(file.path);
      vault.trigger("delete", toTFile(file.path));
    },
    getAbstractFileByPath: (p) => files.has(p) ? toTFile(p) : null,
    getFiles: () => [...files.keys()].map((p) => toTFile(p)),
    getMarkdownFiles: () => [...files.keys()].filter((k) => k.endsWith(".md")).map((p) => toTFile(p))
  };
  return { files, basePath, vault };
}
function makeFakePlugin(overrides = {}) {
  const { vault } = makeFakeVault(overrides.vaultFiles || {});
  return {
    manifest: overrides.manifest ?? { version: "0.1.0" },
    settings: {
      aiApiKey: "test-key",
      rawFolder: "nutegg/_raw",
      indexFile: "nutegg/_index.md",
      serverPort: 27123,
      chunkWindowChars: 3e4,
      sectionGridSeconds: 300,
      ...overrides.settings || {}
    },
    app: { vault: overrides.vault ?? vault },
    aiClient: overrides.aiClient ?? {
      chat: async () => "{}",
      checkCredit: async () => ({
        provider: "anthropic",
        providerLabel: "Anthropic (Claude)",
        source: "openrouter",
        model: "claude-sonnet-5",
        hasBalance: true,
        balanceFormatted: "$8.45",
        statusText: "$8.45 left"
      })
    },
    eggParser: overrides.eggParser ?? {
      formatEggForPrompt: (e) => `egg:${e.fileName}`,
      formatEggInstructionsForPrompt: (e) => `instructions:${e.fileName}`,
      formatEggKnowledgeForPrompt: (e) => `knowledge:${e.fileName}`
    },
    indexReader: overrides.indexReader ?? {
      getIndexContent: async () => "",
      parseIndexContent: () => []
    },
    knowledgeBase: overrides.knowledgeBase ?? {},
    workflowManager: overrides.workflowManager ?? {
      getPrompt: () => ""
    },
    db: overrides.db ?? null,
    ...overrides
  };
}

// tests/lightweight-stage2.test.ts
var egg = () => parseEggFile("egg.md", `> [!abstract]- Instructions:
> **Scope:** Engineering
> **Action Guide:** Highlight failures.
> **Key Questions:**
> - When does it fail?
> **Worth Reading If:**
> - Detailed tradeoffs
> **Skip If:**
> - Promotion
> **Formatting Rules:** Q&A blocks

# Knowledge
SECRET_TREE
# Unprocessed
- SECRET_PENDING
`);
var capture = { title: "Video", url: "https://example.com", content: "source", sourceType: "video" };
var stage1 = { titleVerdict: "TITLE_SIGNAL", coreSummary: ["SUMMARY_SIGNAL"], isLongForm: false, chapterMap: [], customQuestionAnswers: [] };
var response = (action = "summary", entries = [{ content: "Useful result" }]) => JSON.stringify({
  readAction: action,
  readVerdictReason: "Reason",
  extractedEntries: entries,
  keyQuestionAnswers: [],
  readingSources: [{ ref: "12:34", quote: "evidence" }]
});
(0, import_node_test.describe)("Lightweight Stage 2", () => {
  (0, import_node_test.it)("makes one call, includes instructions/signals, never existing notes; summary output is hatchable", async () => {
    const prompts = [];
    const processor = new AIProcessor(makeFakePlugin({ aiClient: { chat: async (prompt) => {
      prompts.push(prompt);
      return response();
    } } }));
    const result = await processor.analyzeEggs(capture, [egg()], stage1);
    import_strict.default.equal(prompts.length, 1);
    for (const text of ["Highlight failures.", "Detailed tradeoffs", "Promotion", "TITLE_SIGNAL", "SUMMARY_SIGNAL"])
      import_strict.default.ok(prompts[0].includes(text));
    import_strict.default.ok(!prompts[0].includes("SECRET_TREE"));
    import_strict.default.ok(!prompts[0].includes("SECRET_PENDING"));
    import_strict.default.equal(result.readAction, "summary");
    import_strict.default.equal(result.shouldRead, false);
    import_strict.default.equal(result.newKnowledge.length, 1);
    import_strict.default.equal("parent" in result.newKnowledge[0], false);
    import_strict.default.equal("novelDelta" in result.eggResults[0], false);
    import_strict.default.equal(result.schemaVersion, 3);
    import_strict.default.equal("eggCompare" in PROMPTS, false);
  });
  (0, import_node_test.it)("omits disabled Stage 1 signals", async () => {
    let prompt = "";
    const processor = new AIProcessor(makeFakePlugin({ aiClient: { chat: async (p) => {
      prompt = p;
      return response();
    } } }));
    await processor.analyzeEggs({ ...capture, enabledSections: { titleVerdict: false, coreSummary: false } }, [egg()], stage1);
    import_strict.default.ok(!prompt.includes("TITLE_SIGNAL"));
    import_strict.default.ok(!prompt.includes("SUMMARY_SIGNAL"));
  });
  (0, import_node_test.it)("saves Q&A-only skip results but not unsupported translated answers", async () => {
    const processor = new AIProcessor(makeFakePlugin({ aiClient: { chat: async () => JSON.stringify({
      readAction: "skip",
      extractedEntries: [],
      keyQuestionAnswers: [
        { question: "Q", answer: "Useful answer", answered: true, sources: [{ ref: "12:34" }] },
        { question: "Other", answer: "\u672A\u63D0\u53CA", answered: false }
      ]
    }) } }));
    const result = await processor.analyzeEggs(capture, [egg()], stage1);
    import_strict.default.equal(result.shouldRead, false);
    import_strict.default.equal(result.newKnowledge.length, 1);
    import_strict.default.match(result.newKnowledge[0].content, /Useful answer/);
    import_strict.default.match(result.newKnowledge[0].content, /12:34/);
  });
  for (const [action, verdict] of [["full", true], ["highlights", true], ["summary", false], ["skip", false], ["uncertain", null], ["invalid", null]]) {
    (0, import_node_test.it)(`maps ${action} to ${verdict}`, async () => {
      const processor = new AIProcessor(makeFakePlugin({ aiClient: { chat: async () => response(action) } }));
      const result = await processor.analyzeEggs(capture, [egg()], stage1);
      import_strict.default.equal(result.shouldRead, verdict);
    });
  }
  (0, import_node_test.it)("missing recommendations stay uncertain and no matches show no personalized recommendation", async () => {
    const processor = new AIProcessor(makeFakePlugin({ aiClient: { chat: async () => "{}" } }));
    import_strict.default.equal((await processor.analyzeEggs(capture, [egg()], stage1)).shouldRead, null);
    const none = await processor.analyzeEggs(capture, [], stage1);
    import_strict.default.equal(none.readAction, void 0);
    import_strict.default.equal(none.shouldRead, null);
  });
  (0, import_node_test.it)("uses deterministic multi-egg precedence", async () => {
    const processor = new AIProcessor(makeFakePlugin());
    const results = (actions) => actions.map((readAction, i) => ({ egg: `${i}.md`, readAction, readVerdictReason: "reason", readingSources: [] }));
    for (const [actions, expected] of [[["skip", "summary"], "summary"], [["summary", "uncertain"], "uncertain"], [["uncertain", "highlights"], "highlights"], [["highlights", "full"], "full"]]) {
      import_strict.default.equal(processor.mergeVerdict(results([...actions])).readAction, expected);
    }
  });
  (0, import_node_test.it)("slim aggregate sees drafts/coverage, not bodies/tree; same-label fragments survive", async () => {
    const prompts = [];
    const processor = new AIProcessor(makeFakePlugin({ settings: { aiApiKey: "test-key", chunkWindowChars: 100 }, aiClient: { chat: async (prompt) => {
      prompts.push(prompt);
      if (prompt.startsWith("Consolidate answers"))
        return JSON.stringify({ readAction: "highlights", keyQuestionAnswers: [{ question: "When does it fail?", answer: "Combined answer", sources: [{ ref: "02:00" }] }] });
      return JSON.stringify({ readAction: "summary", extractedEntries: [{ content: "- **Same concept** PART_BODY_MARKER " + prompts.length }], keyQuestionAnswers: [{ question: "When does it fail?", answer: "ANSWER_DRAFT", sources: [{ ref: "02:00" }] }] });
    } } }));
    const result = await processor.analyzeEggs({ ...capture, content: "word ".repeat(70) }, [egg()], stage1);
    const aggregate = prompts.find((p) => p.startsWith("Consolidate answers"));
    import_strict.default.ok(aggregate.includes("ANSWER_DRAFT"));
    for (const secret of ["PART_BODY_MARKER", "SECRET_TREE", "SECRET_PENDING"])
      import_strict.default.ok(!aggregate.includes(secret));
    import_strict.default.equal(result.eggResults[0].extractedEntries.length, prompts.length - 1);
    import_strict.default.equal(result.eggResults[0].keyQuestionAnswers[0].answer, "Combined answer");
  });
  (0, import_node_test.it)("partial chunk failure preserves successful entries and overrides a confident aggregate", async () => {
    let part = 0;
    const processor = new AIProcessor(makeFakePlugin({ settings: { aiApiKey: "test-key", chunkWindowChars: 1e3 }, aiClient: { chat: async (prompt) => {
      if (prompt.startsWith("Consolidate answers"))
        return JSON.stringify({ readAction: "full", keyQuestionAnswers: [] });
      if (++part === 2)
        throw new Error("Chunk unavailable");
      return response("full");
    } } }));
    const result = await processor.analyzeEggs({ ...capture, content: "source ".repeat(400) }, [egg()], stage1);
    import_strict.default.equal(result.readAction, "uncertain");
    import_strict.default.equal(result.shouldRead, null);
    import_strict.default.ok(result.newKnowledge.length > 0);
    import_strict.default.match(result.shouldReadReason, /incomplete/);
  });
  (0, import_node_test.it)("aggregate failure retains labeled answers and fragments with uncertainty", async () => {
    const processor = new AIProcessor(makeFakePlugin({ settings: { aiApiKey: "test-key", chunkWindowChars: 100 }, aiClient: { chat: async (prompt) => {
      if (prompt.startsWith("Consolidate"))
        throw new Error("Unavailable");
      return JSON.stringify({ readAction: "full", extractedEntries: [{ content: "fragment" }], keyQuestionAnswers: [{ question: "Q", answer: "Answer" }] });
    } } }));
    const result = await processor.analyzeEggs({ ...capture, content: "word ".repeat(50) }, [egg()], stage1);
    import_strict.default.equal(result.shouldRead, null);
    import_strict.default.ok(result.eggResults[0].extractedEntries.length > 1);
    import_strict.default.match(result.eggResults[0].keyQuestionAnswers[0].question, /Part 1/);
  });
});
(0, import_node_test.describe)("Merge safety", () => {
  const original = "# Knowledge\n- Existing\n# Unprocessed\n- New\n";
  (0, import_node_test.it)("does not repair truncated JSON or modify notes", async () => {
    const { vault } = makeFakeVault({ "egg.md": original });
    const plugin = makeFakePlugin({ vault, aiClient: { chat: async () => '{"knowledge":"- partial' } });
    plugin.app = { vault };
    plugin.eggParser = new EggParser(plugin);
    import_strict.default.equal(await new AIProcessor(plugin).mergeEgg("egg.md"), null);
    import_strict.default.equal(await vault.adapter.read("egg.md"), original);
  });
  (0, import_node_test.it)("persists consolidated claims with every source, caveat and distinct framework from a mock merge", async () => {
    const existing = "- **Claim**\n  - Useful only with supervision.\n  _source: [A](https://a.example)_";
    const pending = "- **Claim**\n  - Counterexample: unsupervised use fails.\n  _source: [B](https://b.example)_\n- **Framework v1**\n  - Step one\n- **Framework v2**\n  - Different step";
    const merged = "- **Claim**\n  - Useful only with supervision.\n  - Counterexample: unsupervised use fails.\n  _source: [A](https://a.example)_\n  _source: [B](https://b.example)_\n- **Framework v1**\n  - Step one\n- **Framework v2**\n  - Different step";
    const { vault } = makeFakeVault({ "egg.md": `> **Skip If:**
> - Tutorials

# Knowledge
${existing}
# Unprocessed
${pending}
` });
    const plugin = makeFakePlugin({ vault, aiClient: { chat: async (prompt) => {
      import_strict.default.ok(prompt.includes(existing));
      import_strict.default.ok(prompt.includes(pending));
      import_strict.default.ok(prompt.includes("Retain ALL distinct author/source"));
      import_strict.default.ok(prompt.includes("different speakers, versions, dates or contexts"));
      import_strict.default.ok(!prompt.includes("Tutorials"));
      return JSON.stringify({ knowledge: merged, unprocessed: "" });
    } } });
    plugin.eggParser = new EggParser(plugin);
    await new AIProcessor(plugin).mergeEgg("egg.md");
    const note = await vault.adapter.read("egg.md");
    import_strict.default.equal((note.match(/\*\*Claim\*\*/g) || []).length, 1);
    for (const detail of ["https://a.example", "https://b.example", "Counterexample", "supervision", "Framework v1", "Framework v2"])
      import_strict.default.ok(note.includes(detail));
  });
  (0, import_node_test.it)("scales output budget and serializes simultaneous merges of one egg", async () => {
    const { vault } = makeFakeVault({ "egg.md": original });
    let calls = 0, budget = 0;
    const plugin = makeFakePlugin({ vault, aiClient: { chat: async (_, tokens) => {
      calls++;
      budget = tokens;
      return JSON.stringify({ knowledge: "- Existing\n- New", unprocessed: "" });
    } } });
    plugin.app = { vault };
    plugin.eggParser = new EggParser(plugin);
    const processor = new AIProcessor(plugin);
    await Promise.all([processor.mergeEgg("egg.md"), processor.mergeEgg("egg.md")]);
    import_strict.default.equal(calls, 1);
    import_strict.default.ok(budget >= 4096);
  });
  (0, import_node_test.it)("defers oversized output without an AI call or changes", async () => {
    const { vault } = makeFakeVault({ "egg.md": "# Knowledge\n" + "\u6982\u5FF5".repeat(5e3) + "\n# Unprocessed\n- New\n" });
    let calls = 0;
    const plugin = makeFakePlugin({ vault, settings: { aiApiKey: "test-key", mergeMaxTokens: 4096 }, aiClient: { chat: async () => {
      calls++;
      return "{}";
    } } });
    const before = await vault.adapter.read("egg.md");
    plugin.app = { vault };
    plugin.eggParser = new EggParser(plugin);
    import_strict.default.equal(await new AIProcessor(plugin).mergeEgg("egg.md"), null);
    import_strict.default.equal(calls, 0);
    import_strict.default.equal(await vault.adapter.read("egg.md"), before);
  });
  (0, import_node_test.it)("retries a stale snapshot and retains concurrently appended notes", async () => {
    const { vault } = makeFakeVault({ "egg.md": original });
    let calls = 0;
    const plugin = makeFakePlugin({ vault, aiClient: { chat: async () => {
      if (++calls === 1)
        await vault.modify(vault.getAbstractFileByPath("egg.md"), original + "- Concurrent\n");
      return JSON.stringify({ knowledge: "- Existing\n- New", unprocessed: "- Concurrent" });
    } } });
    plugin.app = { vault };
    plugin.eggParser = new EggParser(plugin);
    await new AIProcessor(plugin).mergeEgg("egg.md");
    import_strict.default.equal(calls, 2);
    import_strict.default.match(await vault.adapter.read("egg.md"), /Concurrent/);
  });
});
