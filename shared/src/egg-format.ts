// ============================================================
// NutEgg Egg Formatting & Prompt Building Utilities
// ============================================================

import type { EggContent } from "./types";

/**
 * Sanitize an egg name into a valid, safe markdown file stem.
 * Supports Unicode letters and numbers while replacing invalid characters with '_'.
 */
export function sanitizeEggName(name: string): string {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_-]+/gu, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
}

/** Extract language frontmatter from egg markdown content. */
export function extractEggLanguage(content: string): string {
  if (!content) return "";
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

/**
 * Inserts or updates the frontmatter language property in an egg file's content.
 * If the egg already has a non-empty language property, content is returned unchanged.
 */
export function insertEggLanguage(
  content: string,
  language: string,
  options?: { overwrite?: boolean }
): string {
  if (!content || !language) return content;
  const existing = extractEggLanguage(content);
  if (existing && !options?.overwrite) return content;

  if (existing && options?.overwrite) {
    return content.replace(/^language:\s*["']?[^"'\r\n]*["']?/im, `language: "${language}"`);
  }

  // If an empty language property already exists, update it in place
  if (/^language:\s*["']?["']?\s*$/m.test(content)) {
    return content.replace(/^language:\s*["']?["']?\s*$/m, `language: "${language}"`);
  }

  // If YAML frontmatter exists, insert before the closing delimiter
  const fmRegex = /^(---\r?\n)([\s\S]*?)(\r?\n---)/;
  const match = content.match(fmRegex);
  if (match) {
    const opening = match[1];
    const body = match[2];
    const closing = match[3];
    const separator = body.endsWith("\n") || body.length === 0 ? "" : "\n";
    const newBody = `${body}${separator}language: "${language}"`;
    return content.replace(fmRegex, `${opening}${newBody}${closing}`);
  }

  // If no frontmatter exists, prepend frontmatter with language
  return `---\nlanguage: "${language}"\n---\n\n${content}`;
}

/** Format instructions only: existing notes never enter Stage 2. */
export function formatEggInstructionsForPrompt(egg: EggContent): string {
  const parts = [`**Scope:** ${egg.scope || "(not specified)"}`];
  parts.push(`**Generate Knowledge Entries:** ${egg.generateKnowledgeEntries === false ? "no" : "yes"}`);
  if (egg.actionGuide) parts.push(`**Action Guide:**\n${egg.actionGuide}`);
  for (const [label, items] of [["Key Questions", egg.keyQuestions], ["Worth Reading If", egg.worthReadingIf], ["Skip If", egg.skipIf]] as const) {
    if (items?.length) parts.push(`**${label}:**\n${items.map(item => `- ${item}`).join("\n")}`);
  }
  if (egg.formattingRules) parts.push(`**Formatting Rules:**\n${egg.formattingRules}`);
  return parts.join("\n\n");
}

export function formatEggKnowledgeForPrompt(egg: EggContent): string {
  return `**Current Knowledge:**\n${egg.knowledge || "(empty)"}\n\n**Unprocessed:**\n${egg.unprocessed || "(empty)"}`;
}

export function formatEggForPrompt(egg: EggContent): string {
  return formatEggInstructionsForPrompt(egg);
}

/** Count top-level entries in the Unprocessed section (sub-bullets don't count). */
export function countUnprocessed(egg: EggContent): number {
  const indentOf = (l: string) => (l.match(/^\s*/) || [""])[0].length;
  const bullets = (egg.unprocessed || "")
    .split("\n")
    .map((l) => l.replace(/\s+$/, ""))
    .filter((l) => /^\s*[-*]\s/.test(l));
  if (bullets.length === 0) return 0;
  const base = Math.min(...bullets.map(indentOf));
  return bullets.filter((l) => indentOf(l) === base).length;
}

