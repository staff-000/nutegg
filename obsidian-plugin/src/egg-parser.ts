import type NutEggPlugin from "./main";
import type { IndexEntry } from "./index-reader";
import {
  KNOWLEDGE_HEADING,
  UNPROCESSED_HEADING,
  isEggPath,
  matchesEggFormat,
  parseEggFile,
  findSection,
  stripSectionHeading,
  headingName,
  insertEggLanguage,
  formatEggInstructionsForPrompt,
  formatEggKnowledgeForPrompt,
  formatEggForPrompt,
  countUnprocessed,
  type EggContent,
} from "@shared/egg-parser";

// Re-export everything from shared egg-parser for backward compatibility
export * from "@shared/egg-parser";

export class EggParser {
  private plugin: NutEggPlugin;

  constructor(plugin: NutEggPlugin) {
    this.plugin = plugin;
  }

  async readEgg(
    fileName: string,
    fallbackDescription?: string
  ): Promise<EggContent | null> {
    let file = this.plugin.app.vault.getAbstractFileByPath(fileName);
    if (!file && !fileName.includes("/")) {
      const parentDir = this.plugin.settings.indexFile.replace(/\/[^/]+$/, "");
      file = this.plugin.app.vault.getAbstractFileByPath(`${parentDir}/${fileName}`);
    }
    if (!file) {
      const folder = this.plugin.vaultFolder || "nutegg";
      const allFiles = (this.plugin.app.vault.getMarkdownFiles?.() || []).filter(
        (f) => isEggPath(f.path, folder)
      );
      const base = fileName.split("/").pop()!.toLowerCase();
      const match = allFiles.find(
        (f) => f.path.split("/").pop()!.toLowerCase() === base
      );
      if (match) file = match;
    }
    if (!file) {
      console.warn(`[NutEgg] Egg file not found: ${fileName}`);
      return null;
    }

    const content = await this.plugin.app.vault.read(file as any);
    const parsed = this.parseEggFile(file.path || fileName, content);
    if (fallbackDescription && !parsed.indexDescription) {
      parsed.indexDescription = fallbackDescription;
    }

    return parsed;
  }

  async readEggs(entries: IndexEntry[]): Promise<EggContent[]> {
    const eggs: EggContent[] = [];
    for (const entry of entries) {
      const egg = await this.readEgg(entry.fileName, entry.description);
      if (egg) {
        egg.indexDescription = entry.description;
        eggs.push(egg);
      }
    }
    return eggs;
  }

  parseEggFile(fileName: string, content: string): EggContent {
    return parseEggFile(fileName, content);
  }

  formatEggInstructionsForPrompt(egg: EggContent): string {
    return formatEggInstructionsForPrompt(egg);
  }

  formatEggKnowledgeForPrompt(egg: EggContent): string {
    return formatEggKnowledgeForPrompt(egg);
  }

  formatEggForPrompt = (egg: EggContent): string => {
    return formatEggForPrompt(egg);
  };

  countUnprocessed(egg: EggContent): number {
    return countUnprocessed(egg);
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
    const section = findSection(lines, "unprocessed");

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
    knowledge = stripSectionHeading(knowledge, "knowledge");
    unprocessed = stripSectionHeading(unprocessed, "unprocessed");
    // If the model dumped the whole file into `knowledge`, cut at the embedded
    // Unprocessed heading and treat the rest as the leftovers.
    const kLines = knowledge.split("\n");
    const uIdx = kLines.findIndex((l) => headingName(l) === "unprocessed");
    if (uIdx !== -1) {
      const rest = stripSectionHeading(
        kLines.slice(uIdx).join("\n"),
        "unprocessed"
      );
      knowledge = kLines.slice(0, uIdx).join("\n").replace(/\s+$/g, "");
      if (!unprocessed) unprocessed = rest;
    }

    const existing = await this.plugin.app.vault.read(file as any);
    let lines = existing.replace(/\n+$/, "").split("\n");

    const knowledgeSection = findSection(lines, "knowledge");
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
      const unprocessedSection = findSection(lines, "unprocessed");
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

    const unprocessedSection = findSection(lines, "unprocessed");
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
}
