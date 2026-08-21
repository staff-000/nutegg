import type NutEggPlugin from "./main";
import type { IndexEntry } from "./index-reader";
import { EGG_TEMPLATE } from "./defaults";

/** What one consistency pass changed. */
export interface IndexSyncResult {
  /** Egg files that had no _index.md entry — one was appended. */
  addedIndexEntries: string[];
  /** Index entries whose path style was normalized to the full vault path. */
  fixedIndexPaths: string[];
  /** Index entries whose egg file was missing — created from the template. */
  createdEggs: string[];
}

/**
 * Keeps _index.md and the egg files under nutegg/ consistent:
 *   - egg file without an index entry → append `* path: description`
 *     (description taken from the egg's frontmatter topic)
 *   - index entry without an egg file → create the egg from the template,
 *     seeded with the entry's description (topic + scope)
 * Runs on plugin load and on an interval (see main.ts).
 */
export class IndexSync {
  private plugin: NutEggPlugin;

  constructor(plugin: NutEggPlugin) {
    this.plugin = plugin;
  }

  async checkAndFix(): Promise<IndexSyncResult> {
    const result: IndexSyncResult = {
      addedIndexEntries: [],
      fixedIndexPaths: [],
      createdEggs: [],
    };

    // Egg files present in the vault (raw nuts + the index itself excluded)
    const eggFiles = this.plugin.app.vault
      .getMarkdownFiles()
      .filter(
        (f) =>
          f.path.startsWith("nutegg/") &&
          !f.path.startsWith(this.plugin.settings.rawFolder) &&
          !f.path.endsWith("/_index.md")
      )
      .map((f) => f.path);

    // Index entries present in _index.md
    const indexContent = await this.plugin.indexReader.getIndexContent();
    if (indexContent === "(No _index.md found)") {
      return result; // config-status already guides the user
    }
    const entries = this.plugin.indexReader.parseIndexContent(indexContent);

    const norm = (p: string) =>
      p.startsWith("nutegg/") ? p : `nutegg/${p.replace(/^\/+/, "")}`;

    // Fix 1: egg files without an index entry (or with a relative-path one)
    const byPath = new Map(entries.map((e) => [norm(e.fileName), e]));
    const indexFile = this.plugin.app.vault.getAbstractFileByPath(
      this.plugin.settings.indexFile
    );
    for (const eggPath of eggFiles) {
      const entry = byPath.get(eggPath);
      if (!entry) {
        const description = await this.describeEgg(eggPath);
        await this.appendIndexEntry(indexFile, eggPath, description);
        result.addedIndexEntries.push(eggPath);
      } else if (entry.fileName !== eggPath) {
        // Relative entry ("invest.md") — upgrade to the full vault path
        await this.rewriteIndexPath(indexFile, entry.fileName, eggPath);
        result.fixedIndexPaths.push(eggPath);
      }
    }

    // Fix 2: index entries whose egg file is missing
    const present = new Set(eggFiles);
    for (const entry of entries) {
      const target = norm(entry.fileName);
      if (present.has(target)) continue;
      if (await this.plugin.app.vault.adapter.exists(entry.fileName)) continue;
      await this.createEggFromTemplate(target, entry);
      if (target !== entry.fileName) {
        await this.rewriteIndexPath(indexFile, entry.fileName, target);
        result.fixedIndexPaths.push(target);
      }
      result.createdEggs.push(target);
    }

    if (
      result.addedIndexEntries.length ||
      result.fixedIndexPaths.length ||
      result.createdEggs.length
    ) {
      console.log(
        `[NutEgg] Index sync: +${result.addedIndexEntries.length} index entries, ` +
          `~${result.fixedIndexPaths.length} paths fixed, ` +
          `+${result.createdEggs.length} egg files created`
      );
    }
    return result;
  }

  /**
   * Create a new egg file from a name + description (the popup's "no egg
   * matched — create one?" flow). Seeds the template's topic/scope from the
   * description and appends the matching _index.md entry. `alreadyExists`
   * when the file was already there (nothing is overwritten).
   */
  async createEgg(
    name: string,
    description: string
  ): Promise<{ path: string; alreadyExists: boolean }> {
    const fileName = `nutegg/${name}.md`;
    if (await this.plugin.app.vault.adapter.exists(fileName)) {
      return { path: fileName, alreadyExists: true };
    }
    await this.createEggFromTemplate(fileName, { fileName, description });
    const indexFile = this.plugin.app.vault.getAbstractFileByPath(
      this.plugin.settings.indexFile
    );
    await this.appendIndexEntry(indexFile, fileName, description || name);
    return { path: fileName, alreadyExists: false };
  }

  /** Description for a new index entry — the egg's frontmatter topic, or "". */
  private async describeEgg(eggPath: string): Promise<string> {
    try {
      const egg = await this.plugin.eggParser.readEgg(eggPath);
      return egg?.topic && egg.topic !== "Unknown" ? egg.topic : "";
    } catch {
      return "";
    }
  }

  private async appendIndexEntry(
    indexFile: any,
    eggPath: string,
    description: string
  ): Promise<void> {
    if (!indexFile) return;
    const line = `* ${eggPath}${description ? `: ${description}` : ""}`;
    const content = await this.plugin.app.vault.read(indexFile);
    await this.plugin.app.vault.modify(
      indexFile,
      content.replace(/\n+$/, "") + `\n${line}\n`
    );
    console.log(`[NutEgg] Added index entry: ${line}`);
  }

  /** Rewrite one index entry's file path in place (keeps its description). */
  private async rewriteIndexPath(
    indexFile: any,
    oldPath: string,
    newPath: string
  ): Promise<void> {
    if (!indexFile) return;
    const content = await this.plugin.app.vault.read(indexFile);
    const escaped = oldPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`^(\\s*[*\\-+]?\\s*)${escaped}(\\s*:)`, "m");
    if (!re.test(content)) return;
    const updated = content.replace(re, `$1${newPath}$2`);
    if (updated === content) return;
    await this.plugin.app.vault.modify(indexFile, updated);
    console.log(`[NutEgg] Index path fixed: ${oldPath} -> ${newPath}`);
  }

  /**
   * Create the missing egg file from the template, seeded from the index
   * entry's description (topic + scope).
   */
  private async createEggFromTemplate(
    targetPath: string,
    entry: IndexEntry
  ): Promise<void> {
    await this.ensureParentFolders(targetPath);
    const fallbackTopic = targetPath.replace(/^nutegg\//, "").replace(/\.md$/, "");
    const topic = (entry.description || fallbackTopic).trim();

    let content = EGG_TEMPLATE;
    content = content.replace(
      /^topic: .*$/m,
      `topic: "${this.escapeYaml(topic)}"`
    );
    if (entry.description) {
      content = content.replace(
        /^> \*\*Scope:\*\* .*$/m,
        `> **Scope:** ${entry.description}`
      );
    }
    content = content.replace(
      /^last_updated: .*$/m,
      `last_updated: "${new Date().toISOString().slice(0, 10)}"`
    );

    await this.plugin.app.vault.create(targetPath, content);
    console.log(`[NutEgg] Created egg from index entry: ${targetPath}`);
  }

  private async ensureParentFolders(path: string): Promise<void> {
    const parts = path.split("/").slice(0, -1);
    let currentPath = "";
    for (const part of parts) {
      currentPath += (currentPath ? "/" : "") + part;
      const exists = await this.plugin.app.vault.adapter.exists(currentPath);
      if (!exists) {
        await this.plugin.app.vault.createFolder(currentPath);
      }
    }
  }

  private escapeYaml(value: string): string {
    return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }
}
