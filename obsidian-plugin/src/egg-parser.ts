import type NutEggPlugin from "./main";
import type { IndexEntry } from "./index-reader";

/**
 * Canonical headings of the two editable sections. They are h1 (`#`) — the
 * egg's top-level structure — with the knowledge tree's branches nested at
 * `##` below them.
 */
export const KNOWLEDGE_HEADING = "# Knowledge";
export const UNPROCESSED_HEADING = "# Unprocessed";

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
 *   # Knowledge
 *   (knowledge tree)
 *   # Unprocessed
 *   (entries pending merge into the knowledge tree)
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
  /** Entries in the Unprocessed section — merged into the tree when 20+ accumulate. */
  unprocessed: string;
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
      unprocessed: "",
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
    const sections = callout ? this.splitLabeledSections(callout) : new Map();
    result.scope = (sections.get("scope") || "").trim();
    result.actionGuide = (sections.get("action guide") || "").trim();
    result.keyQuestions = this.parseListItems(sections.get("key questions") || "");
    result.rejectionCriteria = this.parseListItems(sections.get("rejection criteria") || "");
    result.formattingRules = (sections.get("formatting rules") || "").trim();

    // Knowledge ends at the `# Unprocessed` heading; Unprocessed at the next
    // `#` heading (see findSection).
    const lines = content.split("\n");
    const knowledgeSection = this.findSection(lines, "knowledge");
    if (knowledgeSection) {
      result.knowledge = this.sectionBody(lines, knowledgeSection, "knowledge");
    }
    const unprocessedSection = this.findSection(lines, "unprocessed");
    if (unprocessedSection) {
      result.unprocessed = this.sectionBody(lines, unprocessedSection, "unprocessed");
    }

    return result;
  }

  /**
   * Section content without the surrounding blank lines. Indentation of the
   * first line is preserved (unlike trim()) so re-indented sections survive.
   *
   * A stray duplicate heading of the same name (AI merge output that included
   * its own `# Knowledge`-style line) is stripped so the body starts with the
   * actual content.
   */
  private sectionBody(
    lines: string[],
    section: { start: number; end: number },
    name: string
  ): string {
    const body = lines.slice(section.start + 1, section.end);
    while (
      body.length > 0 &&
      (body[0].trim() === "" || this.headingName(body[0]) === name.toLowerCase())
    ) {
      body.shift();
    }
    return body.join("\n").replace(/\n+$/g, "");
  }

  /** Format only the egg's instructions (Scope, Key Questions, Rejection Criteria, Formatting Rules) for Step 1 extraction. */
  formatEggInstructionsForPrompt(egg: EggContent): string {
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
    return parts.join("\n\n");
  }

  /** Format only the egg's existing Knowledge tree and Unprocessed entries for Step 2 comparison. */
  formatEggKnowledgeForPrompt(egg: EggContent): string {
    const parts: string[] = [];
    parts.push(`**Current Knowledge:**\n${egg.knowledge || "(empty)"}`);
    if (egg.unprocessed.trim()) {
      parts.push(`**Unprocessed (pending merge):**\n${egg.unprocessed}`);
    }
    return parts.join("\n\n");
  }

  /** Format one egg's instructions + knowledge for an AI prompt (backward compatibility). */
  formatEggForPrompt(egg: EggContent): string {
    return [
      this.formatEggInstructionsForPrompt(egg),
      this.formatEggKnowledgeForPrompt(egg),
    ].join("\n\n");
  }

  /**
   * Append one new knowledge entry to the egg's Unprocessed section.
   *
   * Entries land here first and are merged into the Knowledge tree later,
   * once 20+ accumulate (see ai-processor.maybeMergeEgg). Each entry keeps
   * its insight + examples (AI-generated `content`), plus mechanical
   * `_author` / `_source` lines for provenance.
   */
  async appendUnprocessed(
    fileName: string,
    content: string,
    author: string,
    sourceTitle: string,
    sourceUrl: string
  ): Promise<void> {
    const file = this.plugin.app.vault.getAbstractFileByPath(fileName);
    if (!file) {
      console.warn(`[NutEgg] Cannot append — egg file not found: ${fileName}`);
      return;
    }

    const existing = await this.plugin.app.vault.read(file as any);
    const lines = existing.replace(/\n+$/, "").split("\n");
    const section = this.findSection(lines, "unprocessed");

    // One entry = the insight bullet(s) + provenance lines. Insist on a
    // top-level bullet so entry counting stays reliable.
    const trimmed = content.trim();
    const withBullet = /^[-*]\s/.test(trimmed) ? trimmed : `- ${trimmed}`;
    const meta: string[] = [];
    if (author) meta.push(`_author: ${author}_`);
    const safeTitle = sourceTitle.replace(/[[\]]/g, "");
    meta.push(`_source: [${safeTitle || "source"}](${sourceUrl})_`);
    const block = [withBullet, ...meta].join("\n");

    if (section) {
      // Blank line between the heading / previous entry and the new entry
      lines.splice(section.end, 0, "", block);
    } else {
      // No Unprocessed section yet — create it
      lines.push("", UNPROCESSED_HEADING, "", block);
    }

    await this.plugin.app.vault.modify(file as any, lines.join("\n") + "\n");
    console.log(`[NutEgg] Added unprocessed entry to ${fileName}`);
  }

  /** Count top-level entries in the Unprocessed section (sub-bullets don't count). */
  countUnprocessed(egg: EggContent): number {
    const indentOf = (l: string) => (l.match(/^\s*/) || [""])[0].length;
    const bullets = egg.unprocessed
      .split("\n")
      .map((l) => l.replace(/\s+$/, ""))
      .filter((l) => /^\s*[-*]\s/.test(l));
    if (bullets.length === 0) return 0;
    // Entries sit at the section's base indent (whatever the user uses);
    // example/detail sub-bullets are deeper.
    const base = Math.min(...bullets.map(indentOf));
    return bullets.filter((l) => indentOf(l) === base).length;
  }

  /**
   * Replace the Knowledge and Unprocessed sections with the merged output
   * from the merge AI call. Missing sections are created as needed.
   */
  async applyMerge(
    fileName: string,
    knowledge: string,
    unprocessed: string
  ): Promise<void> {
    const file = this.plugin.app.vault.getAbstractFileByPath(fileName);
    if (!file) {
      console.warn(`[NutEgg] Cannot merge — egg file not found: ${fileName}`);
      return;
    }

    // The AI sometimes includes the section headings themselves ("# Knowledge",
    // "# Unprocessed") in its output. Strip them — the file keeps exactly one
    // heading per section, written by us below.
    knowledge = this.stripSectionHeading(knowledge, "knowledge");
    unprocessed = this.stripSectionHeading(unprocessed, "unprocessed");
    // If the model dumped the whole file into `knowledge`, cut at the embedded
    // Unprocessed heading and treat the rest as the leftovers.
    const kLines = knowledge.split("\n");
    const uIdx = kLines.findIndex((l) => this.headingName(l) === "unprocessed");
    if (uIdx !== -1) {
      const rest = this.stripSectionHeading(
        kLines.slice(uIdx).join("\n"),
        "unprocessed"
      );
      knowledge = kLines.slice(0, uIdx).join("\n").replace(/\s+$/g, "");
      if (!unprocessed) unprocessed = rest;
    }

    const existing = await this.plugin.app.vault.read(file as any);
    let lines = existing.replace(/\n+$/, "").split("\n");

    const knowledgeSection = this.findSection(lines, "knowledge");
    if (knowledgeSection) {
      lines = [
        ...lines.slice(0, knowledgeSection.start + 1),
        "",
        ...knowledge.trim().split("\n"),
        ...lines.slice(knowledgeSection.end),
      ];
    } else {
      // No Knowledge section yet — insert it before Unprocessed (or append
      // at the end) so the canonical Knowledge → Unprocessed order holds.
      const unprocessedSection = this.findSection(lines, "unprocessed");
      if (unprocessedSection) {
        lines = [
          ...lines.slice(0, unprocessedSection.start),
          "",
          KNOWLEDGE_HEADING,
          "",
          ...knowledge.trim().split("\n"),
          "",
          ...lines.slice(unprocessedSection.start),
        ];
      } else {
        lines = [...lines, "", KNOWLEDGE_HEADING, "", ...knowledge.trim().split("\n")];
      }
    }

    const unprocessedSection = this.findSection(lines, "unprocessed");
    const remainder = unprocessed.trim();
    if (unprocessedSection) {
      lines = [
        ...lines.slice(0, unprocessedSection.start + 1),
        ...(remainder ? ["", ...remainder.split("\n")] : []),
        ...lines.slice(unprocessedSection.end),
      ];
    } else if (remainder) {
      lines = [...lines, "", UNPROCESSED_HEADING, "", ...remainder.split("\n")];
    }

    await this.plugin.app.vault.modify(file as any, lines.join("\n") + "\n");
    console.log(`[NutEgg] Merged knowledge tree in ${fileName}`);
  }

  /**
   * Locate a `# Name` section heading: `{start, end}`. Returns null when the
   * heading doesn't exist. Sections are h1; `##` lines are knowledge-tree
   * branches and are never treated as section headings.
   *
   * The Knowledge section runs until its successor — the `# Unprocessed`
   * heading — instead of stopping at the next `#` heading, so the tree can
   * use `##` branches as its top level. Other sections end at the next `#`
   * heading.
   *
   * A duplicate heading of the SAME name (a `# Knowledge` line that slipped
   * in below the section heading via a merge) is never treated as the
   * boundary — it stays inside the section, where sectionBody strips it.
   */
  private findSection(
    lines: string[],
    name: string
  ): { start: number; end: number } | null {
    const wanted = name.toLowerCase();
    const start = lines.findIndex(
      (l) => this.headingName(l) === wanted
    );
    if (start === -1) return null;

    let end = -1;
    if (wanted === "knowledge") {
      // The Knowledge section's successor is the Unprocessed section
      end = lines.findIndex(
        (l, i) => i > start && this.headingName(l) === "unprocessed"
      );
    }
    if (end === -1) {
      // Generic boundary: the next `#` heading with a different name
      // (same-name duplicates are corruption, not boundaries)
      end = lines.findIndex((l, i) => {
        if (i <= start) return false;
        const head = this.headingName(l);
        return head !== null && head !== wanted;
      });
    }
    return { start, end: end === -1 ? lines.length : end };
  }

  /**
   * Lowercased name of an h1 (`# Name`) heading line, or null when the line
   * is not one.
   */
  private headingName(line: string): string | null {
    const m = line.trim().match(/^#\s+(.+?)\s*#*\s*$/);
    if (!m) return null;
    return m[1].trim().toLowerCase();
  }

  /**
   * Drop a leading duplicate `# Name` heading plus the blank lines around
   * it, so the body starts with the actual content.
   */
  private stripSectionHeading(body: string, name: string): string {
    const lines = body.split("\n");
    const wanted = name.toLowerCase();
    while (
      lines.length > 0 &&
      (lines[0].trim() === "" || this.headingName(lines[0]) === wanted)
    ) {
      lines.shift();
    }
    return lines.join("\n").replace(/\s+$/g, "");
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
