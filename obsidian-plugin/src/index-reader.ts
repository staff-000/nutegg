import type NutEggPlugin from "./main";
import { PROMPTS, renderPrompt } from "./prompt-templates";

/**
 * Parsed entry from _index.md.
 * Format: `egg-file.md: description of what the egg covers`
 */
export interface IndexEntry {
  fileName: string;    // e.g. "invest.md"
  description: string; // e.g. "investment strategies and market analysis"
}

/**
 * Reads and parses _index.md to understand egg-to-file mappings.
 */
export class IndexReader {
  private plugin: NutEggPlugin;

  constructor(plugin: NutEggPlugin) {
    this.plugin = plugin;
  }

  /**
   * Parse _index.md and return all egg entries.
   * Each non-empty line should be in format: `file.md: description`
   * Lines starting with `#` are comments, skipped.
   */
  async getIndex(): Promise<IndexEntry[]> {
    const indexPath = this.plugin.settings.indexFile;
    const file = this.plugin.app.vault.getAbstractFileByPath(indexPath);
    if (!file) {
      console.warn(`[NutEgg] Index file not found: ${indexPath}`);
      return [];
    }

    const content = await this.plugin.app.vault.read(file as any);
    return this.parseIndexContent(content);
  }

  /**
   * Use AI to determine which egg files are relevant to the content.
   * Returns the matched index entries.
   */
  async matchEggs(
    content: { title: string; content: string; url: string },
    index: IndexEntry[]
  ): Promise<IndexEntry[]> {
    if (index.length === 0) return [];
    if (index.length === 1) return index;

    if (!this.plugin.settings.aiApiKey) {
      // Without API, return first entry as fallback
      return [index[0]];
    }

    const indexText = index
      .map((e) => `- ${e.fileName}: ${e.description}`)
      .join("\n");

    const prompt = renderPrompt(PROMPTS.eggRouting, {
      title: content.title,
      url: content.url,
      content: this.truncate(content.content, 8000),
      index: indexText,
    });

    try {
      // Allow 800 tokens for routing output so reasoning/thinking tokens don't truncate filenames
      const response = await this.plugin.aiClient.chat(prompt, 800);
      return this.parseMatchedEggs(response, index);
    } catch (err) {
      console.warn("[NutEgg] Egg routing failed, falling back to all index entries:", err);
      // On failure, return all index entries
      return index;
    }
  }

  /**
   * Parse matching egg files from the AI routing response.
   * Tolerates JSON arrays, bullet points (- / *), numbering, backticks,
   * quotes, path prefixes (nutegg/file.md vs file.md), and conversational text.
   */
  parseMatchedEggs(response: string, index: IndexEntry[]): IndexEntry[] {
    if (!response || !response.trim() || index.length === 0) return [];

    const text = response.trim();

    // Explicit negative check: "none", "no match", "[]" when no egg is mentioned
    const isExplicitNone = /^\s*(\[\]|none|no\s+match|no\s+matching\s+eggs?)\.?\s*$/i.test(text);

    // Build index lookup maps: full path, basename, and stem
    // e.g. "nutegg/investment.md" -> full="nutegg/investment.md", base="investment.md", stem="investment"
    const entryMap = new Map<IndexEntry, { full: string; base: string; stem: string }>();
    for (const entry of index) {
      const full = entry.fileName.trim().toLowerCase();
      const base = entry.fileName.split("/").pop()!.trim().toLowerCase();
      const stem = base.replace(/\.md$/, "");
      entryMap.set(entry, { full, base, stem });
    }

    const matchedEntries = new Set<IndexEntry>();

    // Strategy 1: JSON array extraction
    const jsonMatch = text.match(/\[[\s\S]*?\]/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            const str = String(item).trim().toLowerCase();
            for (const [entry, names] of entryMap.entries()) {
              if (str === names.full || str === names.base || str.endsWith("/" + names.base)) {
                matchedEntries.add(entry);
              }
            }
          }
        }
      } catch {
        // Fall through to regex and line parsing
      }
    }

    // Strategy 2: Extract all .md references via regex
    // Matches "nutegg/investment.md", "investment.md", etc.
    const mdMatches = text.match(/[\w\-./\\]+\.md\b/gi) || [];
    for (const rawMatch of mdMatches) {
      const clean = rawMatch.replace(/^[\\/]+/, "").trim().toLowerCase();
      for (const [entry, names] of entryMap.entries()) {
        if (clean === names.full || clean === names.base || clean.endsWith("/" + names.base)) {
          matchedEntries.add(entry);
        }
      }
    }

    // Strategy 3: Clean lines (stripping bullets, numbers, markdown formatting)
    const lines = text.split("\n");
    for (const rawLine of lines) {
      let line = rawLine.trim();
      if (!line) continue;
      // Strip markdown code fences, bullets, numbering
      line = line
        .replace(/^```[a-z]*\s*/i, "")
        .replace(/```$/, "")
        .replace(/^[\s*\-•+]+/, "")
        .replace(/^\d+[.)]\s*/, "")
        .replace(/^[`"']+|[`"']+$/g, "")
        .replace(/[.:;,!?]+$/, "")
        .trim()
        .toLowerCase();

      if (!line) continue;

      for (const [entry, names] of entryMap.entries()) {
        if (line === names.full || line === names.base || line.endsWith("/" + names.base)) {
          matchedEntries.add(entry);
        }
      }
    }

    // Strategy 4: If still no match and NOT explicitly "none", search for the basename in the text
    if (matchedEntries.size === 0 && !isExplicitNone) {
      for (const [entry, names] of entryMap.entries()) {
        const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const basePattern = new RegExp(`(^|[^a-z0-9_-])${escapeRegExp(names.base)}($|[^a-z0-9_-])`, "i");
        const fullPattern = new RegExp(`(^|[^a-z0-9_-])${escapeRegExp(names.full)}($|[^a-z0-9_-])`, "i");
        if (basePattern.test(text) || fullPattern.test(text)) {
          matchedEntries.add(entry);
        }
      }
    }

    return Array.from(matchedEntries);
  }

  /**
   * Get the full content of _index.md as a string, for passing to the main analysis prompt.
   */
  async getIndexContent(): Promise<string> {
    const indexPath = this.plugin.settings.indexFile;
    const file = this.plugin.app.vault.getAbstractFileByPath(indexPath);
    if (!file) return "(No _index.md found)";
    return await this.plugin.app.vault.read(file as any);
  }

  parseIndexContent(content: string): IndexEntry[] {
    const entries: IndexEntry[] = [];

    for (const rawLine of content.split("\n")) {
      const trimmed = rawLine.trim();
      // Skip empty lines, markdown headings, and callout blocks
      if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith(">")) continue;

      // Strip optional list bullet prefix: `* path/file.md: description`
      const line = trimmed.replace(/^[*\-+]\s+/, "");

      // Parse format: `file.md: description`
      const colonIdx = line.indexOf(":");
      if (colonIdx === -1) continue;

      const fileName = line.substring(0, colonIdx).trim();
      const description = line.substring(colonIdx + 1).trim();

      if (fileName.endsWith(".md")) {
        entries.push({ fileName, description });
      }
    }

    return entries;
  }

  private truncate(text: string, maxChars: number): string {
    if (text.length <= maxChars) return text;
    return text.substring(0, maxChars) + "\n\n[...truncated]";
  }
}
