import type NutEggPlugin from "./main";
import type { IndexEntry } from "./index-reader";

/**
 * Parsed egg file content.
 *
 * New format (see src/templates/egg.md):
 *   ---
 *   topic: "..."
 *   status: "active"
 *   ---
 *   > [!abstract]- Instructions:
 *   > **Scope:** ...
 *   > **Action Guide:** ...
 *   > **Key Questions:** ...
 *   > **Rejection Criteria:** ...
 *   > **Formatting Rules:** ...
 *   ## Knowledge
 *   (knowledge tree)
 *
 */
export interface EggContent {
  fileName: string;
  /** Frontmatter topic, or "Unknown". */
  topic: string;
  /** What this egg captures. */
  scope: string;
  /** Steps 1-5 telling the AI what to produce for the popup. */
  actionGuide: string;
  /** Specific questions the user wants answered for this content type. */
  keyQuestions: string[];
  rejectionCriteria: string[];
  /** Rules for how new knowledge must be formatted when appended. */
  formattingRules: string;
  /** Current content of the Knowledge section (the knowledge tree). */
  knowledge: string;
}

export class EggParser {
  private plugin: NutEggPlugin;

  constructor(plugin: NutEggPlugin) {
    this.plugin = plugin;
  }

  async readEgg(fileName: string): Promise<EggContent | null> {
    const file = this.plugin.app.vault.getAbstractFileByPath(fileName);
    if (!file) {
      console.warn(`[NutEgg] Egg file not found: ${fileName}`);
      return null;
    }

    const content = await this.plugin.app.vault.read(file as any);
    return this.parseEggFile(fileName, content);
  }

  async readEggs(entries: IndexEntry[]): Promise<EggContent[]> {
    const eggs: EggContent[] = [];
    for (const entry of entries) {
      const egg = await this.readEgg(entry.fileName);
      if (egg) eggs.push(egg);
    }
    return eggs;
  }

  parseEggFile(fileName: string, content: string): EggContent {
    const result: EggContent = {
      fileName,
      topic: "Unknown",
      scope: "",
      actionGuide: "",
      keyQuestions: [],
      rejectionCriteria: [],
      formattingRules: "",
      knowledge: "",
    };

    // Frontmatter
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (fmMatch) {
      for (const line of fmMatch[1].split("\n")) {
        const kv = line.match(/^(\w+):\s*(.*)$/);
        if (!kv) continue;
        const key = kv[1].toLowerCase();
        const value = kv[2].trim().replace(/^"(.*)"$/, "$1");
        if (key === "topic") result.topic = value;
      }
    }

    // Instructions callout (new format)
    const callout = this.extractCallout(content);
    const sections = this.splitLabeledSections(callout);
    result.scope = (sections.get("scope") || "").trim();
    result.actionGuide = (sections.get("action guide") || "").trim();
    result.keyQuestions = this.parseListItems(sections.get("key questions") || "");
    result.rejectionCriteria = this.parseListItems(sections.get("rejection criteria") || "");
    result.formattingRules = (sections.get("formatting rules") || "").trim();

    // Knowledge section — `## Knowledge` (new) or `# knowledge` (legacy)
    const knowledgeMatch = content.match(
      /^#{1,6}\s*knowledge\s*\n([\s\S]*)$/im
    );
    if (knowledgeMatch) {
      result.knowledge = knowledgeMatch[1].trim();
    }

    return result;
  }

  /** Format one egg's instructions + knowledge for an AI prompt. */
  formatEggForPrompt(egg: EggContent): string {
    const parts: string[] = [];
    parts.push(`**Scope:** ${egg.scope || "(not specified)"}`);
    if (egg.keyQuestions.length > 0) {
      parts.push(
        `**Key Questions:**\n${egg.keyQuestions
          .map((q, i) => `${i + 1}. ${q}`)
          .join("\n")}`
      );
    }
    if (egg.rejectionCriteria.length > 0) {
      parts.push(
        `**Rejection Criteria:**\n${egg.rejectionCriteria
          .map((c) => `- ${c}`)
          .join("\n")}`
      );
    }
    if (egg.formattingRules) {
      parts.push(`**Formatting Rules:**\n${egg.formattingRules}`);
    }
    parts.push(
      `**Current Knowledge:**\n${egg.knowledge || "(empty)"}`
    );
    return parts.join("\n\n");
  }

  /**
   * Insert new knowledge into the egg's Knowledge section.
   *
   * If `parentAnchor` matches a line in the knowledge tree, the new content is
   * inserted beneath it as nested sub-bullets (indent = anchor indent + 2).
   * Otherwise the content is appended to the end of the section.
   */
  async insertKnowledge(
    fileName: string,
    parentAnchor: string,
    content: string,
    sourceUrl: string
  ): Promise<void> {
    const file = this.plugin.app.vault.getAbstractFileByPath(fileName);
    if (!file) {
      console.warn(`[NutEgg] Cannot insert — egg file not found: ${fileName}`);
      return;
    }

    const existing = await this.plugin.app.vault.read(file as any);
    const lines = existing.split("\n");

    const sectionIdx = lines.findIndex((l) =>
      /^#{1,6}\s*knowledge\s*$/i.test(l.trim())
    );
    // The Knowledge section contains sub-headings (### concepts), so it ends
    // only at a heading of the same-or-higher level (## or #).
    const sectionLevel =
      sectionIdx >= 0
        ? (lines[sectionIdx].match(/^#+/) || [""])[0].length
        : 2;
    const sectionEnd =
      sectionIdx >= 0
        ? lines.findIndex((l, i) => {
            if (i <= sectionIdx) return false;
            const m = l.trim().match(/^(#{1,6})\s/);
            return m !== null && m[1].length <= sectionLevel;
          })
        : -1;
    const endIdx = sectionEnd === -1 ? lines.length : sectionEnd;

    // Locate the parent anchor inside the Knowledge section
    let anchorIdx = -1;
    let anchorIndent = 0;
    if (parentAnchor && sectionIdx >= 0) {
      const anchorText = parentAnchor.replace(/^#+\s*/, "").trim().toLowerCase();
      for (let i = sectionIdx + 1; i < endIdx; i++) {
        if (lines[i].trim().toLowerCase().includes(anchorText)) {
          anchorIdx = i;
          anchorIndent = (lines[i].match(/^\s*/) || [""])[0].length;
          break;
        }
      }
    }

    // Nest new content under the anchor (or at section top level)
    const baseIndent = anchorIdx >= 0 ? anchorIndent + 2 : 0;
    const indented = content
      .split("\n")
      .map((l) => (l.trim() ? " ".repeat(baseIndent) + l.trim() : ""))
      .join("\n");
    const block =
      indented + `\n${" ".repeat(baseIndent)}_source: [link](${sourceUrl})_`;

    if (anchorIdx >= 0) {
      // Insert after the anchor's block (deeper-indented lines belong to it)
      let insertIdx = anchorIdx + 1;
      while (insertIdx < endIdx) {
        const l = lines[insertIdx];
        if (!l.trim()) { insertIdx++; continue; }
        const indent = (l.match(/^\s*/) || [""])[0].length;
        if (indent <= anchorIndent) break;
        insertIdx++;
      }
      lines.splice(insertIdx, 0, block);
    } else if (sectionIdx >= 0) {
      // No anchor found — append at end of Knowledge section
      const insertAt = endIdx;
      const prev = lines[insertAt - 1];
      lines.splice(insertAt, 0, ...(prev && prev.trim() ? [""] : []), block);
    } else {
      // No Knowledge section at all — create one
      lines.push("", "## Knowledge", "", block);
    }

    await this.plugin.app.vault.modify(file as any, lines.join("\n"));
    console.log(`[NutEgg] Inserted knowledge into ${fileName}`);
  }

  /** Extract the `> [!abstract]- Instructions:` callout body (lines without `>`). */
  private extractCallout(content: string): string | null {
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

  /** Split instruction text into sections by `**Label:**` lines (content may follow on the same line). */
  private splitLabeledSections(text: string): Map<string, string> {
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
  private parseListItems(text: string): string[] {
    return text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => /^(?:\d+[.)]|[-*])\s+/.test(l))
      .map((l) => l.replace(/^(?:\d+[.)]|[-*])\s+/, ""));
  }
}
