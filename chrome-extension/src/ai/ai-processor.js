// ============================================================
// NutEgg Chrome Extension AI Processor (Standalone Mode)
// ============================================================
//
// Stage 1 content analysis & follow-up Q&A directly in Chrome.
// Uses prompt templates from prompts.js and chatAI from ai-client.js.

const DEFAULT_CHUNK_WINDOW = 30000;
const DEFAULT_SECTION_SECS = 300;

/** Substitute {{placeholder}} variables in a template. */
function renderPrompt(template, vars = {}) {
  if (!template) return "";
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
    const value = vars[key];
    return value === undefined || value === null ? "" : String(value);
  });
}

/** Sanitize JSON strings with unescaped control characters. */
function sanitizeJsonString(raw) {
  let inString = false;
  let escaped = false;
  let out = "";
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (inString) {
      if (escaped) {
        escaped = false;
        out += ch;
      } else if (ch === "\\") {
        escaped = true;
        out += ch;
      } else if (ch === '"') {
        inString = false;
        out += ch;
      } else if (ch === "\n") {
        out += "\\n";
      } else if (ch === "\r") {
        out += "\\r";
      } else if (ch === "\t") {
        out += "\\t";
      } else {
        out += ch;
      }
    } else {
      if (ch === '"') inString = true;
      out += ch;
    }
  }
  return out;
}

/** Parse JSON response with robust cleanup and regex fallback. */
function parseJson(text) {
  if (!text) return null;
  let cleaned = text.trim();

  // Strip markdown code fences (```json ... ``` or ``` ...)
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

  // Attempt 1: Direct JSON.parse
  try {
    return JSON.parse(cleaned);
  } catch {}

  // Attempt 2: Sanitize control chars and trailing commas
  try {
    const sanitized = sanitizeJsonString(cleaned)
      .replace(/,\s*([}\]])/g, "$1");
    return JSON.parse(sanitized);
  } catch {}

  // Attempt 3: Find the outermost { ... }
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(sanitizeJsonString(match[0]).replace(/,\s*([}\]])/g, "$1"));
    } catch {}
  }

  return null;
}

/** Split timestamped captions or plain text into manageable chunks. */
function chunkContent(content, chapters = [], chunkWindow = DEFAULT_CHUNK_WINDOW, sectionGridSecs = DEFAULT_SECTION_SECS) {
  if (!content || content.length <= chunkWindow) {
    return [{
      index: 1,
      total: 1,
      content: content || "",
      chapters: chapters || [],
      startTime: "00:00",
      sections: generateSections(content, sectionGridSecs),
    }];
  }

  // Check if content has timestamps (e.g. YouTube [MM:SS] or [H:MM:SS])
  const hasTimestamps = /\[\d{1,2}:\d{2}(?::\d{2})?\]/.test(content);
  if (hasTimestamps) {
    return chunkTimestamped(content, chapters, chunkWindow, sectionGridSecs);
  }

  return chunkPlainText(content, chunkWindow);
}

function parseSeconds(ts) {
  const parts = ts.replace(/[[\]]/g, "").split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

function formatSec(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function generateSections(content, stepSecs) {
  const matches = [...content.matchAll(/\[(\d{1,2}:\d{2}(?::\d{2})?)\]/g)];
  if (matches.length < 5) return [];

  const lastSec = parseSeconds(matches[matches.length - 1][1]);
  if (lastSec < stepSecs) return [];

  const sections = [];
  for (let s = 0; s <= lastSec; s += stepSecs) {
    sections.push(formatSec(s));
  }
  return sections;
}

function chunkTimestamped(content, chapters, chunkWindow, sectionGridSecs) {
  const lines = content.split("\n");
  const chunks = [];
  let currentLines = [];
  let currentLen = 0;
  let chunkStartTime = "00:00";

  for (const line of lines) {
    const tsMatch = line.match(/^\[(\d{1,2}:\d{2}(?::\d{2})?)\]/);
    if (tsMatch && currentLen >= chunkWindow) {
      const chunkText = currentLines.join("\n");
      chunks.push({
        content: chunkText,
        startTime: chunkStartTime,
        sections: generateSections(chunkText, sectionGridSecs),
      });
      currentLines = [];
      currentLen = 0;
      chunkStartTime = tsMatch[1];
    }
    currentLines.push(line);
    currentLen += line.length + 1;
  }

  if (currentLines.length > 0) {
    const chunkText = currentLines.join("\n");
    chunks.push({
      content: chunkText,
      startTime: chunkStartTime,
      sections: generateSections(chunkText, sectionGridSecs),
    });
  }

  const total = chunks.length;
  return chunks.map((c, i) => ({
    index: i + 1,
    total,
    content: c.content,
    startTime: c.startTime,
    sections: c.sections,
    chapters: (chapters || []).filter((ch) => {
      const chSec = parseSeconds(ch.time);
      const startSec = parseSeconds(c.startTime);
      const nextStartSec = chunks[i + 1] ? parseSeconds(chunks[i + 1].startTime) : Infinity;
      return chSec >= startSec && chSec < nextStartSec;
    }),
  }));
}

function chunkPlainText(content, chunkWindow) {
  const paragraphs = content.split(/\n\n+/);
  const chunks = [];
  let current = [];
  let currentLen = 0;

  for (const p of paragraphs) {
    if (currentLen + p.length > chunkWindow && current.length > 0) {
      chunks.push(current.join("\n\n"));
      current = [];
      currentLen = 0;
    }
    current.push(p);
    currentLen += p.length + 2;
  }
  if (current.length > 0) {
    chunks.push(current.join("\n\n"));
  }

  const total = chunks.length;
  return chunks.map((text, i) => ({
    index: i + 1,
    total,
    content: text,
    chapters: [],
    startTime: "",
    sections: [],
  }));
}

/** Build Stage 1 output rules string following configured output language. */
function getContentOutputRules(settings) {
  const lang = settings.chromeAiOutputLanguage || "same-as-content";
  const outputLanguage = lang === "same-as-content"
    ? "the same language as the captured content"
    : lang;

  return renderPrompt(PROMPTS.sharedOutputRules, { output_language: outputLanguage });
}

/**
 * Execute Stage 1 content analysis directly in Chrome.
 */
async function analyzeContentChrome(capture, settings = {}) {
  const maxTokens = settings.chromeAiMaxTokens || 16384;
  const chunks = chunkContent(capture.content, capture.chapters || []);

  if (chunks.length > 1) {
    // Multi-chunk map-reduce
    const partResults = await Promise.all(
      chunks.map((chunk) => callChunk(capture, chunk, settings, maxTokens))
    );

    // Aggregate summaries
    const bulletsForAggregate = partResults.map((r, i) => ({
      part: i + 1,
      startTime: chunks[i].startTime,
      bullets: r.coreSummary || [],
    }));

    const aggregated = await aggregateContentParts(capture, bulletsForAggregate, settings, maxTokens);
    const chapterMap = partResults.flatMap((r) => r.chapterMap || []);

    return {
      titleVerdict: aggregated.titleVerdict || capture.title,
      coreSummary: (aggregated.coreSummary && aggregated.coreSummary.length > 0)
        ? aggregated.coreSummary
        : partResults[0]?.coreSummary || [capture.title],
      isLongForm: true,
      chapterMap,
      customQuestionAnswers: aggregated.customQuestionAnswers || [],
      mode: "chrome",
      stage: "stage1",
    };
  }

  // Single chunk execution
  const single = chunks[0];
  const effective = {
    ...capture,
    chapters: single.chapters,
    sections: single.sections,
  };
  const result = await callChunk(effective, single, settings, maxTokens);

  return {
    ...result,
    mode: "chrome",
    stage: "stage1",
  };
}

async function callChunk(capture, chunk, settings, maxTokens) {
  const chaptersFormatted = (chunk.chapters || []).length > 0
    ? `\n## Video Chapters (use these EXACT timestamps)\n` +
      chunk.chapters.map((c) => `- ${c.time} — ${c.title}`).join("\n")
    : "";

  const sectionsFormatted = (chunk.sections || []).length > 0
    ? `\n## Video Sections (one chapterMap entry per section, EXACT start time)\n` +
      chunk.sections.map((s) => `- [${s}]`).join("\n")
    : "";

  const questionsFormatted = (capture.questions || []).length > 0
    ? `\n## User Questions (answer each directly and concisely)\n` +
      capture.questions.map((q, i) => `${i + 1}. ${q}`).join("\n")
    : "";

  const partNote = chunk.total > 1
    ? `**Part:** ${chunk.index} of ${chunk.total}${chunk.startTime ? ` (from ${chunk.startTime})` : ""}\n`
    : "";

  const outputRules = getContentOutputRules(settings);

  const prompt = renderPrompt(PROMPTS.contentAnalysis, {
    title: capture.title,
    url: capture.url,
    source_type: capture.sourceType || "webpage",
    part_note: partNote,
    chapters: chaptersFormatted,
    sections: sectionsFormatted,
    questions: questionsFormatted,
    content: chunk.content,
    content_task_default: PROMPTS.contentTaskDefault,
    shared_output_rules: outputRules,
  });

  const responseText = await chatAI(prompt, maxTokens, settings);
  const parsed = parseJson(responseText);

  if (!parsed) {
    return {
      titleVerdict: capture.title,
      coreSummary: [capture.title],
      isLongForm: false,
      chapterMap: [],
      customQuestionAnswers: [],
    };
  }

  // If short content without author chapters, enforce empty chapter map
  const hasAuthorChapters = (capture.chapters || []).length > 0;
  if (!parsed.isLongForm && !hasAuthorChapters) {
    parsed.chapterMap = [];
  }

  return {
    titleVerdict: parsed.titleVerdict || capture.title,
    coreSummary: Array.isArray(parsed.coreSummary) ? parsed.coreSummary.slice(0, 3) : [capture.title],
    isLongForm: Boolean(parsed.isLongForm),
    chapterMap: Array.isArray(parsed.chapterMap) ? parsed.chapterMap : [],
    customQuestionAnswers: Array.isArray(parsed.customQuestionAnswers) ? parsed.customQuestionAnswers : [],
  };
}

async function aggregateContentParts(capture, partBullets, settings, maxTokens) {
  const partsText = partBullets
    .map((p) => {
      const header = p.startTime ? `Part ${p.part} (${p.startTime})` : `Part ${p.part}`;
      return `### ${header}\n` + (p.bullets || []).map((b) => `- ${b}`).join("\n");
    })
    .join("\n\n");

  const questionsFormatted = (capture.questions || []).length > 0
    ? `\n## User Questions (answer each directly based on the aggregated summary)\n` +
      capture.questions.map((q, i) => `${i + 1}. ${q}`).join("\n")
    : "";

  const outputRules = getContentOutputRules(settings);

  const prompt = renderPrompt(PROMPTS.aggregateContent, {
    title: capture.title,
    url: capture.url,
    source_type: capture.sourceType || "webpage",
    parts: partsText,
    questions: questionsFormatted,
    shared_output_rules: outputRules,
  });

  const responseText = await chatAI(prompt, maxTokens, settings);
  const parsed = parseJson(responseText);

  return {
    titleVerdict: parsed?.titleVerdict || capture.title,
    coreSummary: Array.isArray(parsed?.coreSummary) ? parsed.coreSummary.slice(0, 3) : [],
    customQuestionAnswers: Array.isArray(parsed?.customQuestionAnswers) ? parsed.customQuestionAnswers : [],
  };
}

/**
 * Handle follow-up Q&A directly in Chrome when Obsidian is offline.
 */
async function askFollowUpChrome(capture, question, priorQa = [], settings = {}) {
  const maxTokens = settings.chromeAiMaxTokens || 4096;
  const outputRules = getContentOutputRules(settings);

  const priorQaText = (priorQa || []).length > 0
    ? `## Prior Questions and Answers\n` +
      priorQa.map((qa) => `**Q:** ${qa.question}\n**A:** ${qa.answer}`).join("\n\n") + "\n\n"
    : "";

  const prompt = renderPrompt(PROMPTS.followUp, {
    title: capture.title || "",
    url: capture.url || "",
    source_type: capture.sourceType || "webpage",
    content: capture.content ? capture.content.slice(0, 30000) : "",
    prior_qa: priorQaText,
    question: question,
    shared_output_rules: outputRules,
  });

  const responseText = await chatAI(prompt, maxTokens, settings);
  const parsed = parseJson(responseText);

  if (parsed && parsed.answer) {
    return parsed.answer;
  }
  // Fallback if model answered as plain text
  return responseText.trim() || "No answer generated.";
}

// Export for Node/testing or attach to global for browser
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    renderPrompt,
    chunkContent,
    parseJson,
    analyzeContentChrome,
    askFollowUpChrome,
  };
}

