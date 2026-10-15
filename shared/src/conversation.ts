import type { CapturePayload, ConversationFormat, ConversationMeta, MindMapNode, Participant, SourceRef } from "./types";
import { toSeconds } from "./chunker";

/** Keywords in title/description suggesting conversational formats (English + Chinese). */
const CONVERSATION_KEYWORD_PATTERNS: Array<{ pattern: RegExp; format: ConversationFormat }> = [
  { pattern: /\b(?:ama|ask\s+me\s+anything)\b|问答|答疑/i, format: "ama" },
  { pattern: /\b(?:podcast|ep\.?\s*\d+|episode\s+\d+)\b|播客/i, format: "podcast" },
  { pattern: /\b(?:interview|fireside\s+chat|in\s+conversation\s+with|talks?\s+(?:with|to)|speaks?\s+with|discuss(?:es)?\s+.*?\s+with|sits?\s+down\s+with|joins?\s+us|joined\s+by)\b|专访|访谈|对谈|对话/i, format: "interview" },
  { pattern: /\b(?:panel|roundtable)\b|圆桌|座谈/i, format: "panel" },
  { pattern: /\b(?:debate)\b|辩论/i, format: "debate" },
  { pattern: /\bq\s*&\s*a\b/i, format: "ama" },
];

/**
 * Builds a format hint block for the AI model.
 * If an AI-detected format is supplied from the summary classification, it is used directly.
 * Otherwise, falls back to advisory text clues.
 */
export function conversationHints(capture: CapturePayload, detectedFormat?: ConversationFormat): string {
  const format = detectedFormat || capture.detectedFormat;
  if (format) {
    if (format === "monologue") {
      return "Content format: Verified monologue / solo presentation (use standard concept tree rules; do not apply conversational kind tags or speaker roles).";
    }
    return `Content format: Verified ${format} (conversational dialogue). Structure topics and Q&A accordingly.`;
  }

  const isVideoOrTranscript =
    capture.sourceType === "youtube" ||
    capture.sourceType === "video" ||
    capture.sourceType === "bilibili" ||
    capture.sourceType === "tiktok" ||
    Boolean(capture.transcriptAvailable) ||
    Boolean(capture.mediaType === "video");

  // Check title and actual description (for video: from ## Description; for text: title only)
  let descText = "";
  if (isVideoOrTranscript) {
    const descMatch = (capture.content || "").match(/## Description\s*\n+([\s\S]*?)(?=\n+## (?:Chapters|Transcript)|$)/);
    descText = descMatch ? descMatch[1].slice(0, 3000) : "";
  }
  const scanTarget = `${capture.title || ""}\n${descText}`.trim();
  const matchedKeywords: Array<{ label: string; format: ConversationFormat }> = [];
  for (const { pattern, format } of CONVERSATION_KEYWORD_PATTERNS) {
    const match = scanTarget.match(pattern);
    if (match) {
      matchedKeywords.push({ label: match[0], format });
    }
  }

  // Check chapters for Q&A / conversation indicators
  let chapterHint = "";
  if (Array.isArray(capture.chapters) && capture.chapters.length > 0) {
    const qChapters = capture.chapters.filter(ch =>
      /\b(?:q\s*&\s*a|ama|question|interview|panel|audience)\b|问答|提问/i.test(ch.title)
    );
    if (qChapters.length > 0) {
      chapterHint = `${qChapters.length} Q&A/interview chapter(s)`;
    }
  }

  // Count caption turn indicators and question stems in the opening transcript/content (first ~500 lines)
  const transcriptIdx = (capture.content || "").indexOf("## Transcript");
  const targetText = transcriptIdx !== -1
    ? (capture.content || "").slice(transcriptIdx)
    : (capture.content || "");
  const lines = targetText.split("\n").slice(0, 500);
  let speakerTurnCount = 0;
  let questionLineCount = 0;
  let conversationalGreeting = false;

  const greetingRegex = /\b(?:thank\s+you\s+(?:for\s+joining|for\s+having\s+me|for\s+coming(?:\s+on)?)|welcome\s+(?:to\s+(?:the\s+show|the\s+podcast|our\s+(?:show|podcast|discussion|program|interview|conversation)|today's\s+(?:show|podcast|discussion|episode))|our\s+guest)|great\s+to\s+(?:have\s+you|be\s+here)|thanks\s+for\s+(?:coming(?:\s+on)?|having\s+me|joining))\b/i;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^(?:>>|--|\b(?:speaker\s*\d+|host|guest|interviewer|interviewee|q|a|问|答)\s*[:：]|\[[^\]]{2,20}\]\s*[:：])/i.test(trimmed)) {
      speakerTurnCount++;
    }
    // Only check spoken question stems and conversational greetings on video transcripts
    if (isVideoOrTranscript) {
      if (/[?？]\s*$/.test(trimmed) || /^(?:\[[\d:]+\]\s*)?(?:so\s+)?\b(?:why\s+did\s+you|how\s+do\s+you|what\s+do\s+you|can\s+you\s+explain|could\s+you|tell\s+us|in\s+your\s+book\s+you|do\s+you\s+think|do\s+you\s+believe|is\s+it\s+possible)\b/i.test(trimmed)) {
        questionLineCount++;
      }
      if (!conversationalGreeting && greetingRegex.test(trimmed)) {
        conversationalGreeting = true;
      }
    }
  }

  const clues: string[] = [];
  if (matchedKeywords.length > 0) {
    const unique = [...new Set(matchedKeywords.map(m => `"${m.label}" (${m.format})`))];
    clues.push(`Title/description mentions ${unique.join(", ")}`);
  }
  if (chapterHint) {
    clues.push(chapterHint);
  }
  if (speakerTurnCount >= 3) {
    clues.push(`${speakerTurnCount} speaker-turn markers detected in transcript`);
  }
  if (conversationalGreeting) {
    clues.push("Conversational dialogue / interview opening detected");
  }
  // Question patterns require corroboration (keywords, chapters, greetings, or turn markers) to prevent false positives on solo tutorials
  const hasCorroboration = matchedKeywords.length > 0 || Boolean(chapterHint) || conversationalGreeting || speakerTurnCount > 0;
  if (questionLineCount >= 3 && hasCorroboration) {
    clues.push(`Interactive question patterns detected (${questionLineCount} question turns)`);
  }

  if (clues.length === 0) return "";
  return `Format clues (advisory — verify against content): ${clues.join("; ")}.`;
}

/**
 * Validates and sanitizes the model-generated ConversationMeta object against source text.
 */
export function sanitizeConversationMeta(
  raw: any,
  sourceText = ""
): ConversationMeta | undefined {
  if (!raw || typeof raw !== "object") return undefined;

  const validFormats: ConversationFormat[] = ["monologue", "interview", "podcast", "ama", "panel", "debate"];
  const format: ConversationFormat = validFormats.includes(raw.format) ? raw.format : "monologue";

  if (format === "monologue") {
    return { format: "monologue", participants: [], confidence: "high" };
  }

  const confidence = raw.confidence === "high" || raw.confidence === "medium" || raw.confidence === "low"
    ? raw.confidence
    : "medium";

  const participants: Participant[] = [];
  if (Array.isArray(raw.participants)) {
    const validRoles = ["host", "guest", "audience", "moderator", "panelist", "speaker", "unknown"] as const;
    for (let i = 0; i < raw.participants.length && i < 12; i++) {
      const p = raw.participants[i];
      if (!p || typeof p !== "object") continue;
      const id = String(p.id || `p${i + 1}`).trim();
      let label = String(p.label || p.name || p.role || "").trim();
      if (!label) label = `p${i + 1}`;

      const role = validRoles.includes(p.role) ? p.role : "unknown";
      let named = Boolean(p.named);
      let name = p.name ? String(p.name).trim() : (named && label !== role ? label : undefined);
      let evidence: SourceRef | undefined;

      if (p.evidence && typeof p.evidence === "object") {
        const ref = String(p.evidence.ref || "").trim();
        const quote = String(p.evidence.quote || "").trim();
        if (quote && sourceText && !sourceText.includes(quote)) {
          // If the model cited a fabricated quote for a person's name, downgrade to unnamed
          named = false;
          name = undefined;
          label = role !== "unknown" ? role : label;
        } else if (quote || ref) {
          evidence = { ref, quote };
        }
      } else if (named && sourceText && name && !sourceText.includes(name)) {
        // If named but no evidence and name not in source text
        named = false;
        name = undefined;
        label = role !== "unknown" ? role : label;
      }

      participants.push({
        id,
        label,
        ...(name ? { name } : {}),
        role,
        named,
        ...(evidence ? { evidence } : {}),
      });
    }
  }

  return {
    format,
    participants,
    confidence,
  };
}

/**
 * Strips conversational attributes (kind, askedBy, speakers, stance) from nodes,
 * returning a pure, clean hierarchical concept tree for monologues and articles.
 */
export function stripConversationFields(nodes: MindMapNode[]): MindMapNode[] {
  return nodes.map(node => {
    const clean: MindMapNode = { name: node.name };
    if (node.detail) clean.detail = node.detail;
    if (node.time) clean.time = node.time;
    if (node.sources && node.sources.length > 0) clean.sources = node.sources;
    if (node.children && node.children.length > 0) {
      clean.children = stripConversationFields(node.children);
    }
    return clean;
  });
}

/**
 * Validates conversation structure, sorts topics chronologically if timed, and enforces budget caps.
 */
export function normalizeConversationMindMap(
  nodes: MindMapNode[],
  conversation?: ConversationMeta
): { mindMap: MindMapNode[]; conversation?: ConversationMeta } {
  if (!conversation || conversation.format === "monologue") {
    return { mindMap: stripConversationFields(nodes), conversation };
  }

  // Check if any question nodes or participant interactions actually exist
  let questionCount = 0;
  function countQuestions(list: MindMapNode[]) {
    for (const n of list) {
      if (n.kind === "question" || n.askedBy) questionCount++;
      if (n.children?.length) countQuestions(n.children);
    }
  }
  countQuestions(nodes);

  if (questionCount === 0 && (!conversation.participants || conversation.participants.length <= 1)) {
    // Downgrade to monologue if claimed conversation has no questions and 0-1 speakers
    return {
      mindMap: stripConversationFields(nodes),
      conversation: { format: "monologue", participants: [], confidence: "high" },
    };
  }

  // Sort level-1 topics chronologically if all topics have valid timestamps
  let sortedNodes = [...nodes];
  const allHaveTime = sortedNodes.length > 0 && sortedNodes.every(n => Boolean(n.time && toSeconds(n.time) !== null));
  if (allHaveTime) {
    sortedNodes.sort((a, b) => (toSeconds(a.time!) || 0) - (toSeconds(b.time!) || 0));
  }

  // Budget cap: max 8 topics; group remainder into a summary node
  if (sortedNodes.length > 8) {
    const top8 = sortedNodes.slice(0, 8);
    const excess = sortedNodes.slice(8);
    const excessSummary = excess.map(n => n.name).join("; ");
    top8.push({
      kind: "topic",
      name: `+${excess.length} more topics`,
      detail: excessSummary,
      children: excess.flatMap(n => n.children || []).slice(0, 6),
    });
    sortedNodes = top8;
  }

  // Budget cap: max 6 questions per topic
  for (const topic of sortedNodes) {
    if (Array.isArray(topic.children) && topic.children.length > 6) {
      const top6 = topic.children.slice(0, 6);
      const excessQ = topic.children.slice(6);
      const excessQSummary = excessQ.map(q => q.name).join("; ");
      top6.push({
        kind: "question",
        name: `+${excessQ.length} more questions`,
        detail: excessQSummary,
      });
      topic.children = top6;
    }
  }

  return { mindMap: sortedNodes, conversation };
}
