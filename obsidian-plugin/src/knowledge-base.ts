import type NutEggPlugin from "./main";

/**
 * Simplified knowledge base — saves raw content and appends to topic files.
 */
export class KnowledgeBase {
  private plugin: NutEggPlugin;

  constructor(plugin: NutEggPlugin) {
    this.plugin = plugin;
  }

  /**
   * Save the captured content to the raw folder.
   * File naming: YYYY-MM-DD-HH-MM-Source-title.md
   */
  async saveRaw(capture: {
    url: string;
    title: string;
    content: string;
    sourceType: string;
    metadata?: Record<string, string>;
  }): Promise<string> {
    const folder = this.plugin.settings.rawFolder;
    await this.ensureFolder(folder);

    const safeTitle = this.sanitizeFileName(capture.title);
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const timestamp = [
      now.getFullYear(),
      pad(now.getMonth() + 1),
      pad(now.getDate()),
      pad(now.getHours()),
      pad(now.getMinutes()),
    ].join("-");
    const source = this.sanitizeFileName(capture.sourceType);
    const fileName = `${folder}/${timestamp}-${source}-${safeTitle}.md`;

    const frontmatterLines = [
      "---",
      `source_url: "${capture.url}"`,
      `source_type: ${capture.sourceType}`,
      `captured_at: "${new Date().toISOString()}"`,
      `saved_at: "${new Date().toISOString()}"`,
    ];

    if (capture.metadata) {
      for (const [key, value] of Object.entries(capture.metadata)) {
        frontmatterLines.push(`${key}: "${value}"`);
      }
    }

    frontmatterLines.push("---");
    frontmatterLines.push("");
    frontmatterLines.push(`# ${capture.title}`);
    frontmatterLines.push("");
    frontmatterLines.push(`**Source:** ${capture.url}`);
    frontmatterLines.push("");
    frontmatterLines.push(capture.content);

    const noteContent = frontmatterLines.join("\n");
    await this.plugin.app.vault.create(fileName, noteContent);
    console.log(`[NutEgg] Saved raw: ${fileName}`);
    return fileName;
  }

  /**
   * Append new knowledge to topic files.
   */
  async appendKnowledge(
    newKnowledge: Array<{
      topic: string;
      section: string;
      content: string;
    }>,
    sourceUrl: string
  ): Promise<void> {
    const { TopicParser } = await import("./topic-parser");
    const topicParser = new TopicParser(this.plugin);

    for (const item of newKnowledge) {
      await topicParser.appendToTopic(
        item.topic,
        item.section,
        item.content,
        sourceUrl
      );
    }
  }

  private async ensureFolder(folder: string): Promise<void> {
    const parts = folder.split("/");
    let currentPath = "";
    for (const part of parts) {
      currentPath += (currentPath ? "/" : "") + part;
      const exists = await this.plugin.app.vault.adapter.exists(currentPath);
      if (!exists) {
        await this.plugin.app.vault.createFolder(currentPath);
      }
    }
  }

  private sanitizeFileName(name: string): string {
    return name
      .replace(/[\\/:*?"<>|#^\[\]]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 80);
  }
}
