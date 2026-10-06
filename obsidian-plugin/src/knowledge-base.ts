import type { DiscussionCapture, AnalysisSectionsConfig } from "../../shared/src/types";
import type NutEggPlugin from "./main";
import { EggParser } from "./egg-parser";
import { randomUUID } from "crypto";
import type { AnalysisResult } from "./ai-processor";

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
   * File naming: YYYY-MM-DD-HH-MM-Source-Author-title-UUID.md
   */
  async saveRaw(capture: {
    discussion?: DiscussionCapture;
    enabledSections?: Partial<AnalysisSectionsConfig>;
    url: string;
    title: string;
    content: string;
    sourceType: string;
    metadata?: Record<string, unknown>;
    summary?: string;
    analysis?: unknown;
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
    
    const safeAuthor = this.sanitizeFileName(author);
    const fileName = `${folder}/${timestamp}-${source}-${safeAuthor}-${safeTitle}-${randomUUID()}.md`;

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
        if (!passthroughKeys.includes(key) && value !== null && value !== undefined && value !== "") {
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
    if (capture.enabledSections?.discussion && capture.discussion) {
      frontmatterLines.push("", "# Captured Discussion", "", "```json", JSON.stringify(capture.discussion, null, 2), "```");
    }

    if (capture.analysis) {
      frontmatterLines.push("", "# NutEgg Analysis", "", "```json", JSON.stringify(capture.analysis, null, 2), "```");
    }
    const noteContent = frontmatterLines.join("\n");
    await this.plugin.app.vault.create(fileName, noteContent);
    console.log(`[NutEgg] Saved raw: ${fileName}`);
    return fileName;
  }

  /** Read the last archived Hatch when upgrading rows without a confirmation ledger. */
  async readRawAnalysis(fileName: string): Promise<AnalysisResult | null> {
    try {
      const content = await this.plugin.app.vault.adapter.read(fileName);
      const marker = "\n# NutEgg Analysis\n\n```json\n";
      const offset = content.lastIndexOf(marker);
      if (offset < 0) return null;
      return JSON.parse(content.slice(offset + marker.length).split('\n```')[0]);
    } catch { return null; }
  }

  /** Keep the original per-egg results when an already-collected nut is hatched. */
  async updateRawAnalysis(fileName: string, analysis: unknown): Promise<void> {
    const vault = this.plugin.app.vault;
    if (!(await vault.adapter.exists(fileName))) throw new Error(`Nut not found: ${fileName}`);
    const file = vault.getMarkdownFiles().find((file) => file.path === fileName);
    if (!file) throw new Error(`Nut not found: ${fileName}`);
    const transform = (content: string) => {
      const marker = "\n# NutEgg Analysis\n\n```json\n";
      const offset = content.lastIndexOf(marker);
      const original = offset < 0 ? content : content.slice(0, offset);
      return `${original}${marker}${JSON.stringify(analysis, null, 2)}\n\`\`\`\n`;
    };
    if (vault.process) await vault.process(file, transform);
    else await vault.modify(file, transform(await vault.read(file)));
  }

  /**
   * Append new knowledge entries to each egg's Unprocessed section (insight +
   * examples from the AI, plus mechanical author/source lines). Entries are
   * merged into the Knowledge tree later, once 20+ accumulate per egg.
   */
  async appendKnowledge(
    newKnowledge: Array<{
      egg: string;
      content: string;
    }>,
    sourceTitle: string,
    sourceUrl: string,
    author: string
  ): Promise<void> {
    const eggParser = this.plugin.eggParser || new EggParser(this.plugin);

    for (const item of newKnowledge) {
      await eggParser.appendUnprocessed(
        item.egg,
        this.withoutPlaybackCitations(item.content),
        author,
        sourceTitle,
        sourceUrl
      );
    }
  }

  /** Strip playback timestamps and source quotes from the copy appended to an egg. */
  private withoutPlaybackCitations(content: string): string {
    const time = "\\d{1,3}:[0-5]\\d(?::[0-5]\\d)?";
    const location = `${time}(?:\\s*[-–—]\\s*${time})?`;
    const timestampOnly = new RegExp(`^\\[?${location}\\]?$`);
    const wrapped = new RegExp(`\\[${location}\\]|\\(${location}\\)`, "g");
    const linked = new RegExp(`\\[${location}\\]\\(https?://[^\\s)]+\\)`, "g");
    const bare = new RegExp(`(?<![\\w/:?=])${location}(?![\\w/:])`, "g");
    return content.split("\n").map(line => {
      const source = line.match(/^(\s*[-*]\s+)Source location: (.*?)(?: — (.*))?$/);
      if (/^\s*[-*]\s+Source quote:/.test(line)) return "";
      if (source) {
        line = timestampOnly.test(source[2].trim())
          ? ""
          : `${source[1]}Source location: ${source[2]}`;
      }
      return line.replace(linked, "").replace(wrapped, "").replace(bare, "")
        .replace(/[ \t]+$/, "");
    }).filter(line => !/^\s*[-*]\s*$/.test(line)).join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }

  private escapeYaml(value: unknown): string {
    const text = typeof value === "object" && value !== null
      ? JSON.stringify(value)
      : String(value ?? "");
    return text.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }

  private async ensureFolder(folder: string): Promise<void> {
    const parts = folder.split("/");
    let currentPath = "";
    for (const part of parts) {
      currentPath += (currentPath ? "/" : "") + part;
      const exists = await this.plugin.app.vault.adapter.exists(currentPath);
      if (!exists) {
        try { await this.plugin.app.vault.createFolder(currentPath); }
        catch (error) { if (!await this.plugin.app.vault.adapter.exists(currentPath)) throw error; }
      }
    }
  }

  private sanitizeFileName(name: unknown): string {
    return String(name ?? "")
      .replace(/[\\/:*?"<>|#^\[\]]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 80);
  }
}
