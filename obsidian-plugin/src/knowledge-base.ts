import type NutEggPlugin from "./main";

/**
 * Simplified knowledge base — saves raw content and appends to egg files.
 */
export class KnowledgeBase {
  private plugin: NutEggPlugin;

  constructor(plugin: NutEggPlugin) {
    this.plugin = plugin;
  }

  /**
   * Save the captured content to the raw folder.
   * File naming: YYYY-MM-DD-HH-MM-Source-Author-title.md
   */
  async saveRaw(capture: {
    url: string;
    title: string;
    content: string;
    sourceType: string;
    metadata?: Record<string, string>;
    summary?: string;
    matchedEggs?: string[];
    processingResult: "saved" | "skip" | "unprocessed";
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

    // 1. Published timestamp
    const publishedAt = capture.metadata?.published || "unknown";

    // 2. Saved timestamp
    const savedAt = new Date().toISOString();

    // 3. Author
    const author = capture.metadata?.author ||
      capture.metadata?.channel ||
      capture.metadata?.handle ||
      "unknown";
    
    const fileName = `${folder}/${timestamp}-${source}-${author}-${safeTitle}.md`;

    // 4. Source link
    const sourceUrl = capture.url;

    // 5. Processing result
    const processingResult = capture.processingResult;

    // 6. Time estimate
    const timeEstimate = capture.metadata?.time_estimate_minutes ||
      String(Math.max(1, Math.ceil((capture.content?.split(/\s+/)?.length || 0) / 200)));

    // 7. Summary
    const summary = capture.summary || "";

    // 8. Egg files
    const eggFiles = capture.matchedEggs || [];

    const frontmatterLines = [
      "---",
      `source_url: "${this.escapeYaml(capture.url)}"`,
      `source_type: ${capture.sourceType}`,
      `published_at: "${publishedAt === "unknown" ? "unknown" : this.escapeYaml(publishedAt)}"`,
      `saved_at: "${savedAt}"`,
      `author: "${author === "unknown" ? "unknown" : this.escapeYaml(author)}"`,
      `processing_result: ${processingResult}`,
      `time_estimate_minutes: ${timeEstimate}`,
    ];

    // Summary — use YAML folded block scalar for multi-line text
    if (summary) {
      const escapedSummary = summary
        .replace(/"/g, '\\"')
        .replace(/\n/g, "\\n");
      frontmatterLines.push(`summary: "${escapedSummary}"`);
    }

    // Egg files list
    if (eggFiles.length > 0) {
      frontmatterLines.push(`egg_files:`);
      for (const egg of eggFiles) {
        frontmatterLines.push(`  - ${egg}`);
      }
    }

    // 9. Tags
    frontmatterLines.push(`tags: []`);

    // Passthrough any additional metadata not covered above (e.g. platform, video_id)
    if (capture.metadata) {
      const passthroughKeys = ["published", "author", "channel", "handle", "time_estimate_minutes"];
      for (const [key, value] of Object.entries(capture.metadata)) {
        if (!passthroughKeys.includes(key) && value) {
          frontmatterLines.push(`${key}: "${this.escapeYaml(value)}"`);
        }
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
   * Insert new knowledge into egg files, nested under the anchor each
   * delta picked from the existing knowledge tree.
   */
  async appendKnowledge(
    newKnowledge: Array<{
      egg: string;
      parent?: string;
      content: string;
    }>,
    sourceUrl: string
  ): Promise<void> {
    const { EggParser } = await import("./egg-parser");
    const eggParser = new EggParser(this.plugin);

    for (const item of newKnowledge) {
      await eggParser.insertKnowledge(
        item.egg,
        item.parent || "",
        item.content,
        sourceUrl
      );
    }
  }

  private escapeYaml(value: string): string {
    return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
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
