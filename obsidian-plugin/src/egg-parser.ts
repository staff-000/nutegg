import type NutEggPlugin from "./main";
import type { IndexEntry } from "./index-reader";

/**
 * Parsed egg file content.
 */
export interface EggContent {
  fileName: string;
  instructions: string;
  rejectCriteria: string;
  sections: EggSection[];
}

export interface EggSection {
  heading: string;  // e.g. "knowledge", "ideas"
  content: string;
}

/**
 * Reads and parses egg markdown files.
 * Egg file format:
 *   instruct:
 *     * key questions: ...
 *     * reject criteria: ...
 *   ---
 *   # knowledge
 *   (content)
 *   # ideas
 *   (content)
 */
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

  formatEggsForPrompt(eggs: EggContent[]): string {
    if (eggs.length === 0) return "(No egg files found)";

    return eggs
      .map((e) => {
        const sectionsText = e.sections
          .map((s) => `### ${s.heading}\n${s.content || "(empty)"}`)
          .join("\n\n");
        return `## Egg: ${e.fileName}\n**Instructions:** ${e.instructions}\n\n**Current Content:**\n${sectionsText}`;
      })
      .join("\n\n---\n\n");
  }

  async appendToEgg(
    fileName: string,
    section: string,
    content: string,
    sourceUrl: string
  ): Promise<void> {
    const file = this.plugin.app.vault.getAbstractFileByPath(fileName);
    if (!file) {
      console.warn(`[NutEgg] Cannot append — egg file not found: ${fileName}`);
      return;
    }

    const existingContent = await this.plugin.app.vault.read(file as any);
    const timestamp = new Date().toISOString().slice(0, 10);
    const appendBlock = [
      "",
      `- **${timestamp}** — ${content} ([source](${sourceUrl}))`,
    ].join("\n");

    const sectionRegex = new RegExp(
      `(^#+\\s+${this.escapeRegex(section)}\\s*\\n)`,
      "im"
    );

    if (sectionRegex.test(existingContent)) {
      const updated = existingContent.replace(
        sectionRegex,
        `$1${appendBlock}\n`
      );
      await this.plugin.app.vault.modify(file as any, updated);
    } else {
      const newSection = `\n\n# ${section}\n${appendBlock}\n`;
      await this.plugin.app.vault.modify(
        file as any,
        existingContent + newSection
      );
    }

    console.log(`[NutEgg] Appended to ${fileName}#${section}`);
  }

  parseEggFile(fileName: string, content: string): EggContent {
    let instructions = "";
    let rejectCriteria = "";

    const instructMatch = content.match(/^instruct:\s*\n([\s\S]*?)(?:\n---|$)/);
    if (instructMatch) {
      instructions = instructMatch[1].trim();

      const rejectMatch = instructions.match(
        /\*\s*reject\s*criteria\s*:\s*(.+)/i
      );
      if (rejectMatch) {
        rejectCriteria = rejectMatch[1].trim();
      }
    }

    const bodyMatch = content.match(/^---\s*\n([\s\S]*)$/m);
    const body = bodyMatch ? bodyMatch[1] : content;
    const sections = this.parseSections(body);

    return { fileName, instructions, rejectCriteria, sections };
  }

  private parseSections(body: string): EggSection[] {
    const sections: EggSection[] = [];
    const headingRegex = /^#+\s+(.+)$/gm;
    let match: RegExpExecArray | null;
    const headings: Array<{ title: string; index: number }> = [];

    while ((match = headingRegex.exec(body)) !== null) {
      headings.push({ title: match[1].toLowerCase(), index: match.index });
    }

    for (let i = 0; i < headings.length; i++) {
      const start = headings[i].index;
      const end = i + 1 < headings.length ? headings[i + 1].index : body.length;
      const sectionContent = body
        .substring(start, end)
        .replace(/^#+\s+.+\n/, "")
        .trim();

      sections.push({
        heading: headings[i].title,
        content: sectionContent,
      });
    }

    return sections;
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
