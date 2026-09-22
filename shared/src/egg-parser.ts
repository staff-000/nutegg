// ============================================================
// NutEgg Pure Egg Parsing Utilities
// ============================================================

import type { EggContent } from "./types";
export type { EggContent };
export * from "./egg-format";

/**
 * Canonical headings of the two editable sections. They are h1 (`#`) — the
 * egg's top-level structure — with the knowledge tree's branches nested at
 * `##` below them.
 */
export const KNOWLEDGE_HEADING = "# Knowledge";
export const UNPROCESSED_HEADING = "# Unprocessed";

/**
 * Determines whether a given path is an egg note inside the vault.
 */
export function isEggPath(path: string, vaultFolder = "nutegg"): boolean {
  if (!path || typeof path !== "string") return false;
  const normalized = path.replace(/\\/g, "/").replace(/^\/+/, "");
  const folder = (vaultFolder || "").replace(/^\/+|\/+$/g, "");

  if (folder) {
    if (!normalized.startsWith(folder + "/")) return false;
    const rel = normalized.slice(folder.length + 1);
    if (rel.includes("/")) return false;
    if (rel.startsWith("_") || !rel.toLowerCase().endsWith(".md")) return false;
    return true;
  } else {
    if (normalized.includes("/")) return false;
    if (normalized.startsWith("_") || !normalized.toLowerCase().endsWith(".md")) return false;
    return true;
  }
}

/**
 * Tests whether a note's content matches the structure of a NutEgg egg note.
 * Checks for YAML frontmatter topic or canonical egg sections / callouts.
 */
export function matchesEggFormat(content: string): boolean {
  if (!content || typeof content !== "string") return false;
  if (/^---\r?\n[\s\S]*?\btopic:\s*["']?.+["']?[\s\S]*?\r?\n---/m.test(content)) {
    return true;
  }
  if (
    content.includes("# Knowledge") ||
    content.includes("# Unprocessed") ||
    content.includes("[!abstract]")
  ) {
    return true;
  }
  return false;
}

/**
 * Parses raw egg markdown into a structured EggContent object.
 */
export function parseEggFile(fileName: string, content: string): EggContent {
  const result: EggContent = {
    fileName,
    topic: "Unknown",
    language: "",
    scope: "",
    actionGuide: "",
    keyQuestions: [],
    rejectionCriteria: [],
    formattingRules: "",
    knowledge: "",
    unprocessed: "",
    indexDescription: "",
  };

  // Frontmatter
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (fmMatch) {
    for (const line of fmMatch[1].split(/\r?\n/)) {
      const kv = line.match(/^(\w+):\s*(.*)$/);
      if (!kv) continue;
      const key = kv[1].toLowerCase();
      const value = kv[2].trim().replace(/^"(.*)"$/, "$1");
      if (key === "topic") result.topic = value;
      if (key === "language") result.language = value;
    }
  }

  // Instructions callout (new format)
  const callout = extractCallout(content);
  const sections = callout ? splitLabeledSections(callout) : new Map<string, string>();
  result.scope = (sections.get("scope") || "").trim();
  result.actionGuide = (sections.get("action guide") || "").trim();
  result.keyQuestions = parseListItems(sections.get("key questions") || "");
  result.rejectionCriteria = parseListItems(sections.get("rejection criteria") || "");
  result.formattingRules = (sections.get("formatting rules") || "").trim();

  // Knowledge ends at the `# Unprocessed` heading; Unprocessed at the next `#` heading
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

/**
 * Locate a `# Name` section heading: `{start, end}`. Returns null when the
 * heading doesn't exist. Sections are h1; `##` lines are knowledge-tree
 * branches and are never treated as section headings.
 */
export function findSection(
  lines: string[],
  name: string
): { start: number; end: number } | null {
  const wanted = name.toLowerCase();
  const start = lines.findIndex((l) => headingName(l) === wanted);
  if (start === -1) return null;

  let end = -1;
  if (wanted === "knowledge") {
    // The Knowledge section's successor is the Unprocessed section
    end = lines.findIndex(
      (l, i) => i > start && headingName(l) === "unprocessed"
    );
  }
  if (end === -1) {
    // Generic boundary: the next `#` heading with a different name
    end = lines.findIndex((l, i) => {
      if (i <= start) return false;
      const head = headingName(l);
      return head !== null && head !== wanted;
    });
  }
  return { start, end: end === -1 ? lines.length : end };
}

/**
 * Lowercased name of an h1 (`# Name`) heading line, or null when the line is not one.
 */
export function headingName(line: string): string | null {
  const m = line.trim().match(/^#\s+(.+?)\s*#*\s*$/);
  if (!m) return null;
  return m[1].trim().toLowerCase();
}

/**
 * Section content without the surrounding blank lines. Indentation of the
 * first line is preserved so re-indented sections survive.
 */
export function sectionBody(
  lines: string[],
  section: { start: number; end: number },
  name: string
): string {
  const body = lines.slice(section.start + 1, section.end);
  while (
    body.length > 0 &&
    (body[0].trim() === "" || headingName(body[0]) === name.toLowerCase())
  ) {
    body.shift();
  }
  return body.join("\n").replace(/\n+$/g, "");
}

/**
 * Drop a leading duplicate `# Name` heading plus the blank lines around
 * it, so the body starts with the actual content.
 */
export function stripSectionHeading(body: string, name: string): string {
  const lines = body.split("\n");
  const wanted = name.toLowerCase();
  while (
    lines.length > 0 &&
    (lines[0].trim() === "" || headingName(lines[0]) === wanted)
  ) {
    lines.shift();
  }
  return lines.join("\n").replace(/\s+$/g, "");
}

/** Extract the `> [!abstract]- Instructions:` callout body (lines without `>`). */
export function extractCallout(content: string): string | null {
  const calloutLines: string[] = [];
  for (const line of content.split("\n")) {
    if (line.startsWith(">")) {
      calloutLines.push(line.replace(/^>\s?/, ""));
    } else if (calloutLines.length > 0) {
      break;
    }
  }
  if (calloutLines.length === 0) return null;

  const marker = calloutLines.findIndex((l) => l.includes("[!abstract]"));
  const body =
    marker >= 0 ? calloutLines.slice(marker + 1) : calloutLines.slice(1);
  return body.join("\n");
}

/** Split instruction text into sections by `**Label:**` lines. */
export function splitLabeledSections(text: string): Map<string, string> {
  const map = new Map<string, string>();
  let current: string | null = null;
  let buffer: string[] = [];

  for (const line of text.split("\n")) {
    const labelMatch = line.match(/^\*\*([^*]+?):\*\*\s*(.*)$/);
    if (labelMatch) {
      if (current) map.set(current, buffer.join("\n"));
      current = labelMatch[1].toLowerCase();
      buffer = labelMatch[2] ? [labelMatch[2]] : [];
    } else {
      buffer.push(line);
    }
  }
  if (current) map.set(current, buffer.join("\n"));
  return map;
}

/** Parse numbered (`1.`) or bulleted (`-`) list items, stripping markers. */
export function parseListItems(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^(?:\d+[.)]|[-*])\s+/.test(l))
    .map((l) => l.replace(/^(?:\d+[.)]|[-*])\s+/, ""));
}

