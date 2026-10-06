import type NutEggPlugin from "./main";
import type { IndexEntry } from "./index-reader";
import type { TFile } from "obsidian";
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

/** Basenames refer only to the configured egg folder; explicit paths must stay inside it. */
export function resolveEggPath(fileName: string, vaultFolder = "nutegg"): string | null {
  if (typeof fileName !== "string" || !fileName || fileName.includes("\\")) return null;
  const folder = (vaultFolder || "nutegg").replace(/\/+$/, "");
  const path = fileName.includes("/") ? fileName : `${folder}/${fileName}`;
  // Reject absolute paths and traversal instead of normalizing them into another note.
  if (path.split("/").some(part => !part || part === "." || part === "..")) return null;
  return isEggPath(path, folder) ? path : null;
}

export class EggParser {
  private plugin: NutEggPlugin;

  constructor(plugin: NutEggPlugin) {
    this.plugin = plugin;
  }

  private async findFile(fileName: string): Promise<{ file: TFile; path: string } | null> {
    const folder = this.plugin.vaultFolder || "nutegg";
    const path = resolveEggPath(fileName, folder);
    if (!path) return null;
    const vault = this.plugin.app.vault;
    const exists = await vault.adapter.exists(path);
    const files = vault.getMarkdownFiles().filter(file => resolveEggPath(file.path, folder) === file.path);
    const exact = exists && files.find(file => file.path === path);
    if (exact) return { file: exact, path: exact.path };
    // Keep case-insensitive aliases, but never pick arbitrarily between ambiguous names.
    const matches = files.filter(file => file.path.toLowerCase() === path.toLowerCase());
    if (matches.length !== 1) return null;
    const file = matches[0];
    const matchedPath = file.path;
    if (!(await vault.adapter.exists(matchedPath))) return null;
    this.assertEggFile(file, matchedPath);
    return { file, path: matchedPath };
  }

  private assertEggFile(file: TFile, path: string): void {
    if (file.path !== path || resolveEggPath(file.path, this.plugin.vaultFolder || "nutegg") !== path) {
      throw new Error(`Egg file moved or is outside the egg folder: ${path}`);
    }
  }

  private async processFile(target: { file: TFile; path: string }, transform: (content: string) => string): Promise<void> {
    const { file, path } = target;
    this.assertEggFile(file, path);
    const guardedTransform = (content: string) => {
      // TFile.path can change while vault.process/read waits on disk IO.
      this.assertEggFile(file, path);
      return transform(content);
    };
    const vault = this.plugin.app.vault;
    if (vault.process) await vault.process(file, guardedTransform);
    else await vault.modify(file, guardedTransform(await vault.read(file)));
  }

  /** All egg mutations, including language metadata and editor saves, use this boundary. */
  async processEgg(fileName: string, transform: (content: string) => string): Promise<void> {
    const file = await this.findFile(fileName);
    if (!file) throw new Error(`Cannot update — egg file not found or outside the egg folder: ${fileName}`);
    await this.processFile(file, transform);
  }

  async readEgg(
    fileName: string,
    fallbackDescription?: string
  ): Promise<EggContent | null> {
    const target = await this.findFile(fileName);
    if (!target) {
      console.warn(`[NutEgg] Egg file not found: ${fileName}`);
      return null;
    }

    const { file, path } = target;
    this.assertEggFile(file, path);
    const content = await this.plugin.app.vault.read(file);
    this.assertEggFile(file, path);
    const parsed = this.parseEggFile(path, content);
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
    const transform = (existing: string) => {
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

      // Exact replay should not append an already pending item.
      if (existing.includes(block)) return existing;
      return lines.join("\n") + "\n";
    };
    await this.processEgg(fileName, transform);
    console.log(`[NutEgg] Added unprocessed entry to ${fileName}`);
  }

  /**
   * Replace the Knowledge and Unprocessed sections with the merged output
   * from the merge AI call. Missing sections are created as needed.
   */
  async applyMerge(
    fileName: string,
    knowledge: string,
    unprocessed: string,
    expected?: EggContent
  ): Promise<boolean> {
    const file = await this.findFile(fileName);
    if (!file) {
      console.warn(`[NutEgg] Cannot merge — egg file not found: ${fileName}`);
      return false;
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

    let applied = true;
    const transform = (existing: string) => {
      if (expected && (expected.sourceText ? existing !== expected.sourceText :
        parseEggFile(fileName, existing).knowledge !== expected.knowledge || parseEggFile(fileName, existing).unprocessed !== expected.unprocessed)) {
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

      return lines.join("\n") + "\n";
    };
    await this.processFile(file, transform);
    return applied;
  }
}
