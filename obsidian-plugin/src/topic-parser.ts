import type NutEggPlugin from "./main";
import type { IndexEntry } from "./index-reader";

/**
 * Parsed topic file content.
 */
export interface TopicContent {
  fileName: string;
  instructions: string;    // The instruct: section content
  rejectCriteria: string;  // Extracted from instruct: bullet points
  sections: TopicSection[];
}

export interface TopicSection {
  heading: string;  // e.g. "knowledge", "ideas"
  content: string;  // Everything under that heading
}

/**
 * Reads and parses topic markdown files.
 * Topic file format:
 *   instruct:
 *     * key questions: ...
 *     * reject criteria: ...
 *   ---
 *   # knowledge
 *   (content)
 *   # ideas
 *   (content)
 */
export class TopicParser {
  private plugin: NutEggPlugin;

  constructor(plugin: NutEggPlugin) {
    this.plugin = plugin;
  }

  /**
   * Read and parse a topic file.
   */
  async readTopic(fileName: string): Promise<TopicContent | null> {
    const file = this.plugin.app.vault.getAbstractFileByPath(fileName);
    if (!file) {
      console.warn(`[NutEgg] Topic file not found: ${fileName}`);
      return null;
    }

    const content = await this.plugin.app.vault.read(file as any);
    return this.parseTopicFile(fileName, content);
  }

  /**
   * Read and parse all matched topic files.
   */
  async readTopics(entries: IndexEntry[]): Promise<TopicContent[]> {
    const topics: TopicContent[] = [];
    for (const entry of entries) {
      const topic = await this.readTopic(entry.fileName);
      if (topic) topics.push(topic);
    }
    return topics;
  }

  /**
   * Format topic contexts for the Claude prompt.
   */
  formatTopicsForPrompt(topics: TopicContent[]): string {
    if (topics.length === 0) return "(No topic files found)";

    return topics
      .map((t) => {
        const sectionsText = t.sections
          .map((s) => `### ${s.heading}\n${s.content || "(empty)"}`)
          .join("\n\n");
        return `## Topic: ${t.fileName}\n**Instructions:** ${t.instructions}\n\n**Current Content:**\n${sectionsText}`;
      })
      .join("\n\n---\n\n");
  }

  /**
   * Append new knowledge to a topic file under the specified section heading.
   */
  async appendToTopic(
    fileName: string,
    section: string,
    content: string,
    sourceUrl: string
  ): Promise<void> {
    const file = this.plugin.app.vault.getAbstractFileByPath(fileName);
    if (!file) {
      console.warn(`[NutEgg] Cannot append — topic file not found: ${fileName}`);
      return;
    }

    const existingContent = await this.plugin.app.vault.read(file as any);
    const timestamp = new Date().toISOString().slice(0, 10);
    const appendBlock = [
      "",
      `- **${timestamp}** — ${content} ([source](${sourceUrl}))`,
    ].join("\n");

    // Find the section heading and append after it
    const sectionRegex = new RegExp(
      `(^#+\\s+${this.escapeRegex(section)}\\s*\\n)`,
      "im"
    );

    if (sectionRegex.test(existingContent)) {
      // Append after the section heading, before the next heading
      const updated = existingContent.replace(
        sectionRegex,
        `$1${appendBlock}\n`
      );
      await this.plugin.app.vault.modify(file as any, updated);
    } else {
      // Section doesn't exist — add it at the end
      const newSection = `\n\n# ${section}\n${appendBlock}\n`;
      await this.plugin.app.vault.modify(
        file as any,
        existingContent + newSection
      );
    }

    console.log(`[NutEgg] Appended to ${fileName}#${section}`);
  }

  parseTopicFile(fileName: string, content: string): TopicContent {
    let instructions = "";
    let rejectCriteria = "";

    // Extract instruct: section (before ---)
    const instructMatch = content.match(/^instruct:\s*\n([\s\S]*?)(?:\n---|$)/);
    if (instructMatch) {
      instructions = instructMatch[1].trim();

      // Extract reject criteria from instruct
      const rejectMatch = instructions.match(
        /\*\s*reject\s*criteria\s*:\s*(.+)/i
      );
      if (rejectMatch) {
        rejectCriteria = rejectMatch[1].trim();
      }
    }

    // Parse sections after ---
    const bodyMatch = content.match(/^---\s*\n([\s\S]*)$/m);
    const body = bodyMatch ? bodyMatch[1] : content;
    const sections = this.parseSections(body);

    return {
      fileName,
      instructions,
      rejectCriteria,
      sections,
    };
  }

  private parseSections(body: string): TopicSection[] {
    const sections: TopicSection[] = [];
    const headingRegex = /^#+\s+(.+)$/gm;
    let match: RegExpExecArray | null;
    const headings: Array<{ title: string; index: number }> = [];

    while ((match = headingRegex.exec(body)) !== null) {
      headings.push({ title: match[1].toLowerCase(), index: match.index });
    }

    for (let i = 0; i < headings.length; i++) {
      const start = headings[i].index;
      const end =
        i + 1 < headings.length ? headings[i + 1].index : body.length;
      const sectionContent = body
        .substring(start, end)
        .replace(/^#+\s+.+\n/, "") // Remove the heading line
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
