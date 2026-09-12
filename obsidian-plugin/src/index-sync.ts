import type NutEggPlugin from "./main";
import type { IndexEntry } from "./index-reader";
import { EGG_TEMPLATE } from "./defaults";
import { extractEggLanguage, isEggPath } from "./egg-parser";

export { isEggPath };

/** What one consistency pass changed. */
export interface IndexSyncResult {
  /** Unused / deprecated: background disk scan never auto-appends to _index.md. */
  addedIndexEntries: string[];
  /** Index entries whose path style was normalized to the full vault path. */
  fixedIndexPaths: string[];
  /** Index entries whose egg file was missing — created from the template. */
  createdEggs: string[];
  /** Invalid index entries pruned from _index.md. */
  prunedIndexEntries: string[];
}

/**
 * Keeps _index.md and egg files consistent according to two simple rules:
 * 1. Only egg files (except _index.md) directly under nutegg/ are allowed in _index.md.
 * 2. Only two ways to add entries to _index.md:
 *    - User edits _index.md directly (missing egg files are seeded from template)
 *    - User explicitly triggers egg creation (Chrome extension or Obsidian modal)
 * Background disk scans NEVER auto-append unindexed files to _index.md.
 */
/**
 * Sanitize an egg name into a valid, safe markdown file stem.
 * Supports Unicode letters and numbers while replacing invalid characters with '_'.
 */
export function sanitizeEggName(name: string): string {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_-]+/gu, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
}

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
      prunedIndexEntries: [],
    };

    const folder = this.plugin.vaultFolder || "nutegg";

    // Index entries present in _index.md
    const indexContent = await this.plugin.indexReader.getIndexContent();
    if (indexContent === "(No _index.md found)") {
      return result; // config-status already guides the user
    }
    const rawEntries = this.plugin.indexReader.parseIndexContent(indexContent);

    const norm = (p: string) =>
      p.startsWith(folder + "/") ? p : `${folder}/${p.replace(/^\/+/, "")}`;

    const indexFile = this.plugin.app.vault.getAbstractFileByPath(
      this.plugin.settings.indexFile
    );

    // Rule 1: Only direct egg files under nutegg/ are allowed in _index.md.
    // Prune any invalid entries (system folders like _workflow/, _raw/, subdirectories, etc.)
    const entries: IndexEntry[] = [];
    let updatedIndexContent = indexContent;
    for (const entry of rawEntries) {
      const target = norm(entry.fileName);
      if (!isEggPath(target, folder)) {
        const escaped = entry.fileName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const re = new RegExp(`^[\\t ]*[*\\-+]?[\\t ]*${escaped}(?:[\\t ]*:.*)?(?:\\r?\\n)?`, "m");
        updatedIndexContent = updatedIndexContent.replace(re, "");
        result.prunedIndexEntries.push(entry.fileName);
      } else {
        entries.push(entry);
      }
    }

    if (result.prunedIndexEntries.length > 0 && indexFile) {
      await this.plugin.app.vault.modify(indexFile as any, updatedIndexContent);
      console.log(`[NutEgg] Pruned ${result.prunedIndexEntries.length} invalid entries from index`);
    }

    // Rule 2: Only 2 ways to add entries to _index.md:
    // 1) User edits _index.md directly (if egg file is missing on disk, create from template)
    // 2) User triggers createEgg (handled in createEgg())
    // NOTE: We NEVER scan disk to auto-append unindexed files to _index.md.
    for (const entry of entries) {
      const target = norm(entry.fileName);
      if (await this.plugin.app.vault.adapter.exists(target)) continue;
      if (await this.plugin.app.vault.adapter.exists(entry.fileName)) continue;
      try {
        await this.createEggFromTemplate(target, entry);
        if (target !== entry.fileName) {
          await this.rewriteIndexPath(indexFile, entry.fileName, target);
          result.fixedIndexPaths.push(target);
        }
        result.createdEggs.push(target);
      } catch (err) {
        console.warn(`[NutEgg] Could not create egg from template for ${target}:`, err);
      }
    }

    // Normalize relative paths in _index.md for existing egg files too
    for (const entry of entries) {
      const target = norm(entry.fileName);
      if (entry.fileName !== target && (await this.plugin.app.vault.adapter.exists(target))) {
        await this.rewriteIndexPath(indexFile, entry.fileName, target);
        if (!result.fixedIndexPaths.includes(target)) {
          result.fixedIndexPaths.push(target);
        }
      }
    }

    if (
      result.fixedIndexPaths.length ||
      result.createdEggs.length ||
      result.prunedIndexEntries.length
    ) {
      console.log(
        `[NutEgg] Index sync: ~${result.fixedIndexPaths.length} paths normalized, ` +
          `+${result.createdEggs.length} egg files created, ` +
          `-${result.prunedIndexEntries.length} non-egg entries pruned`
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
    rawName: string,
    rawDescription: string
  ): Promise<{ path: string; alreadyExists: boolean; language?: string }> {
    const name = sanitizeEggName(rawName);
    const description = (rawDescription || "").trim();
    if (!name) {
      throw new Error("Invalid egg name");
    }
    const folder = this.plugin.vaultFolder || "nutegg";
    const fileName = `${folder}/${name}.md`;
    if (await this.plugin.app.vault.adapter.exists(fileName)) {
      const existingContent = await this.plugin.app.vault.adapter
        .read(fileName)
        .catch(() => "");
      return {
        path: fileName,
        alreadyExists: true,
        language: extractEggLanguage(existingContent),
      };
    }
    const { language } = await this.createEggFromTemplate(fileName, {
      fileName,
      description,
    });
    const indexFile = this.plugin.app.vault.getAbstractFileByPath(
      this.plugin.settings.indexFile
    );
    await this.appendIndexEntry(indexFile, fileName, description || name);
    return { path: fileName, alreadyExists: false, language };
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
   * entry's description (topic + scope). Reuses EGG_TEMPLATE and optionally
   * localizes concrete instructions to match the description's language.
   */
  private async createEggFromTemplate(
    targetPath: string,
    entry: IndexEntry
  ): Promise<{ path: string; language: string }> {
    await this.ensureParentFolders(targetPath);
    const folder = this.plugin.vaultFolder || "nutegg";
    const fallbackTopic = targetPath.replace(new RegExp(`^${folder}/`), "").replace(/\.md$/, "");
    const topic = (entry.description || fallbackTopic).trim();
    const dateStr = new Date().toISOString().slice(0, 10);

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
      `last_updated: "${dateStr}"`
    );

    let detectedLanguage = "";

    // If AI is available, adapt the template instructions to match the description's language
    if (entry.description && this.plugin.aiProcessor?.localizeEggTemplate) {
      try {
        const localized = await this.plugin.aiProcessor.localizeEggTemplate(
          content,
          entry.description
        );
        if (localized) {
          if (typeof localized === "string") {
            content = localized;
            detectedLanguage = extractEggLanguage(localized);
          } else {
            content = localized.content;
            detectedLanguage =
              localized.language || extractEggLanguage(localized.content);
          }
        }
      } catch (err) {
        console.warn("[NutEgg] Failed to localize egg template with AI:", err);
      }
    }

    if (!detectedLanguage) {
      detectedLanguage = extractEggLanguage(content);
    }

    await this.plugin.app.vault.create(targetPath, content);
    console.log(`[NutEgg] Created egg from index entry: ${targetPath}`);
    return { path: targetPath, language: detectedLanguage };
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
