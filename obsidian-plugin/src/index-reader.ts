import type NutEggPlugin from "./main";

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

    const prompt = `Given this content and egg index, which egg file(s) does this content belong to? Return ONLY the file names, one per line. If none match, return "none".

## Content
Title: ${content.title}
URL: ${content.url}
${this.truncate(content.content, 2000)}

## Egg Index
${indexText}

Return matching file names (one per line):`;

    try {
      const response = await this.plugin.aiClient.chat(prompt, 100);
      const matchedNames = response
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.endsWith(".md"));

      if (matchedNames.length === 0) return [];

      return index.filter((e) =>
        matchedNames.some((name) => name === e.fileName)
      );
    } catch {
      // On failure, return all index entries
      return index;
    }
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
