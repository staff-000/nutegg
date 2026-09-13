import { Notice, TAbstractFile } from "obsidian";
import type NutEggPlugin from "./main";
import type { IndexEntry } from "./index-reader";
import { EGG_TEMPLATE } from "./defaults";
import {
  extractEggLanguage,
  insertEggLanguage,
  isEggPath,
  matchesEggFormat,
} from "./egg-parser";

export { isEggPath, matchesEggFormat };

/** What one consistency pass changed. */
export interface IndexSyncResult {
  /** Egg files on disk without an index entry that were added to _index.md. */
  addedIndexEntries: string[];
  /** Index entries whose path style was normalized to the full vault path. */
  fixedIndexPaths: string[];
  /** Index entries whose egg file was missing — created from the template. */
  createdEggs: string[];
  /** Invalid index entries pruned from _index.md. */
  prunedIndexEntries: string[];
}

/** Differences between _index.md entries and egg notes on disk. */
export interface IndexDiffStatus {
  /** Entries in _index.md whose egg note does not exist on disk. */
  missingEggs: string[];
  /** Valid egg notes on disk that are not listed in _index.md. */
  unindexedEggs: string[];
  /** Entries in _index.md that are not valid egg notes (e.g. system files, subdirectories). */
  invalidEntries: string[];
  /** Total number of discrepancies. */
  totalDiffs: number;
}

/**
 * Keeps _index.md and egg files consistent:
 * 1. Only direct egg files under nutegg/ are allowed in _index.md.
 * 2. Event-driven synchronization:
 *    - When an egg file is removed from nutegg/, it is removed from _index.md.
 *    - When an egg file is dropped into nutegg/ and matches egg format, it is added to _index.md.
 *    - When _index.md is edited directly, missing egg notes are seeded from template.
 *    - Manual sync button triggers full two-way diff resolution.
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
  private initialized = false;
  private isUpdatingIndex = false;
  private directEditTimer: any = null;
  private diffListeners: Set<() => void> = new Set();

  constructor(plugin: NutEggPlugin) {
    this.plugin = plugin;
  }

  /** Subscribe to index diff status changes. Returns unsubscribe function. */
  onDiffChanged(listener: () => void): () => void {
    this.diffListeners.add(listener);
    return () => this.diffListeners.delete(listener);
  }

  notifyDiffChanged(): void {
    for (const listener of this.diffListeners) {
      try {
        listener();
      } catch {}
    }
  }

  /** Register vault event listeners for egg additions, deletions, renames, and direct index edits. */
  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    const vault = this.plugin.app?.vault;
    if (!vault?.on) return;

    const hook = (event: string, cb: any) => {
      const ref = vault.on(event as any, cb);
      if (typeof (this.plugin as any).registerEvent === "function") {
        (this.plugin as any).registerEvent(ref);
      }
    };

    hook("create", async (file: TAbstractFile) => {
      if (this.isUpdatingIndex) return;
      if (file && (file as any).path) {
        await this.onEggFileCreated(file as any);
      }
    });

    hook("delete", async (file: TAbstractFile) => {
      if (this.isUpdatingIndex) return;
      if (file && (file as any).path) {
        await this.onEggFileDeleted((file as any).path);
      }
    });

    hook("rename", async (file: TAbstractFile, oldPath: string) => {
      if (this.isUpdatingIndex) return;
      if (file && (file as any).path && oldPath) {
        await this.onEggFileRenamed(oldPath, (file as any).path);
      }
    });

    hook("modify", async (file: TAbstractFile) => {
      if (this.isUpdatingIndex) return;
      if (file && (file as any).path === this.plugin.settings?.indexFile) {
        this.debounceDirectIndexEdit();
      }
    });
  }

  /** Handle an egg file being created or dropped into nutegg/ */
  async onEggFileCreated(file: { path: string }): Promise<void> {
    const folder = this.plugin.vaultFolder || "nutegg";
    if (!isEggPath(file.path, folder)) return;

    const indexContent = await this.plugin.indexReader.getIndexContent();
    if (indexContent === "(No _index.md found)") return;

    const entries = this.plugin.indexReader.parseIndexContent(indexContent);
    const norm = (p: string) =>
      p.startsWith(folder + "/") ? p : `${folder}/${p.replace(/^\/+/, "")}`;
    const byPath = new Set(entries.map((e) => norm(e.fileName)));
    if (byPath.has(file.path)) return;

    const content = await this.plugin.app.vault.read(file as any).catch(() => "");
    if (!matchesEggFormat(content)) return;

    let topic = "";
    try {
      const egg = await this.plugin.eggParser.readEgg(file.path);
      if (egg?.topic && egg.topic !== "Unknown") {
        topic = egg.topic;
      }
    } catch {}
    if (!topic) {
      topic = file.path.split("/").pop()!.replace(/\.md$/, "");
    }

    const indexFile = this.plugin.app.vault.getAbstractFileByPath(
      this.plugin.settings.indexFile
    );
    if (indexFile) {
      this.isUpdatingIndex = true;
      try {
        await this.appendIndexEntry(indexFile, file.path, topic);
        new Notice(`[NutEgg] Added ${file.path} to egg index`);
        this.notifyDiffChanged();
      } finally {
        this.isUpdatingIndex = false;
      }
    }
  }

  /** Handle an egg file being deleted from nutegg/ */
  async onEggFileDeleted(filePath: string): Promise<void> {
    const folder = this.plugin.vaultFolder || "nutegg";
    if (!isEggPath(filePath, folder)) return;

    const indexFile = this.plugin.app.vault.getAbstractFileByPath(
      this.plugin.settings.indexFile
    );
    if (!indexFile) return;

    this.isUpdatingIndex = true;
    try {
      const fileName = filePath.split("/").pop() || "";
      let modified = await this.removeIndexEntry(indexFile, filePath);
      if (fileName && fileName !== filePath) {
        const mod2 = await this.removeIndexEntry(indexFile, fileName);
        modified = modified || mod2;
      }
      if (modified) {
        new Notice(`[NutEgg] Removed ${filePath} from egg index`);
      }
      this.notifyDiffChanged();
    } finally {
      this.isUpdatingIndex = false;
    }
  }

  /** Handle an egg file being renamed */
  async onEggFileRenamed(oldPath: string, newPath: string): Promise<void> {
    const folder = this.plugin.vaultFolder || "nutegg";
    const wasEgg = isEggPath(oldPath, folder);
    const isEgg = isEggPath(newPath, folder);
    if (!wasEgg && !isEgg) return;

    const indexFile = this.plugin.app.vault.getAbstractFileByPath(
      this.plugin.settings.indexFile
    );
    if (!indexFile) return;

    this.isUpdatingIndex = true;
    try {
      if (wasEgg && isEgg) {
        await this.rewriteIndexPath(indexFile, oldPath, newPath);
        const oldBase = oldPath.split("/").pop() || "";
        if (oldBase) {
          await this.rewriteIndexPath(indexFile, oldBase, newPath);
        }
        new Notice(`[NutEgg] Renamed index path: ${oldPath} -> ${newPath}`);
      } else if (wasEgg && !isEgg) {
        await this.removeIndexEntry(indexFile, oldPath);
      } else if (!wasEgg && isEgg) {
        const file = this.plugin.app.vault.getAbstractFileByPath(newPath);
        if (file) {
          await this.onEggFileCreated(file as any);
        }
      }
      this.notifyDiffChanged();
    } finally {
      this.isUpdatingIndex = false;
    }
  }

  /** Debounce direct edits on _index.md before creating missing templates */
  debounceDirectIndexEdit(): void {
    if (this.directEditTimer) {
      clearTimeout(this.directEditTimer);
    }
    this.directEditTimer = setTimeout(async () => {
      this.directEditTimer = null;
      await this.onDirectIndexEdit();
    }, 800);
  }

  /** Handle direct user edits on _index.md: create template for newly added entries */
  async onDirectIndexEdit(): Promise<void> {
    if (this.isUpdatingIndex) return;
    const indexContent = await this.plugin.indexReader.getIndexContent();
    if (indexContent === "(No _index.md found)") return;

    const rawEntries = this.plugin.indexReader.parseIndexContent(indexContent);
    const folder = this.plugin.vaultFolder || "nutegg";
    const norm = (p: string) =>
      p.startsWith(folder + "/") ? p : `${folder}/${p.replace(/^\/+/, "")}`;

    for (const entry of rawEntries) {
      const target = norm(entry.fileName);
      if (!isEggPath(target, folder)) continue;

      const exists =
        (await this.plugin.app.vault.adapter.exists(target)) ||
        Boolean(this.plugin.app.vault.getAbstractFileByPath(target));
      if (!exists) {
        try {
          await this.createEggFromTemplate(target, entry);
          new Notice(`[NutEgg] Created egg template for ${target}`);
        } catch (err) {
          console.warn(`[NutEgg] Could not create egg from template for ${target}:`, err);
        }
      }
    }
    this.notifyDiffChanged();
  }

  /** Calculate discrepancies between _index.md and disk */
  async getDiffStatus(): Promise<IndexDiffStatus> {
    const folder = this.plugin.vaultFolder || "nutegg";
    const norm = (p: string) =>
      p.startsWith(folder + "/") ? p : `${folder}/${p.replace(/^\/+/, "")}`;

    const eggFilesOnDisk = (this.plugin.app.vault.getMarkdownFiles?.() || [])
      .filter((f) => isEggPath(f.path, folder))
      .map((f) => f.path);
    const diskSet = new Set(eggFilesOnDisk);

    const indexContent = await this.plugin.indexReader.getIndexContent();
    if (indexContent === "(No _index.md found)") {
      return { missingEggs: [], unindexedEggs: [], invalidEntries: [], totalDiffs: 0 };
    }

    const rawEntries = this.plugin.indexReader.parseIndexContent(indexContent);
    const missingEggs: string[] = [];
    const invalidEntries: string[] = [];
    const indexedEggPaths = new Set<string>();

    for (const entry of rawEntries) {
      const target = norm(entry.fileName);
      if (!isEggPath(target, folder)) {
        invalidEntries.push(entry.fileName);
      } else {
        indexedEggPaths.add(target);
        if (!diskSet.has(target)) {
          const exists =
            (await this.plugin.app.vault.adapter.exists(target)) ||
            Boolean(this.plugin.app.vault.getAbstractFileByPath(target));
          if (!exists) {
            missingEggs.push(target);
          }
        }
      }
    }

    const unindexedEggs: string[] = [];
    for (const eggPath of eggFilesOnDisk) {
      if (!indexedEggPaths.has(eggPath)) {
        unindexedEggs.push(eggPath);
      }
    }

    return {
      missingEggs,
      unindexedEggs,
      invalidEntries,
      totalDiffs: missingEggs.length + unindexedEggs.length + invalidEntries.length,
    };
  }

  /** Trigger full manual sync from the Sync button */
  async sync(): Promise<IndexSyncResult> {
    this.isUpdatingIndex = true;
    try {
      const result = await this.checkAndFix({ syncUnindexed: true });
      this.notifyDiffChanged();
      return result;
    } finally {
      this.isUpdatingIndex = false;
    }
  }

  async checkAndFix(options?: { syncUnindexed?: boolean }): Promise<IndexSyncResult> {
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
      return result;
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

    // If syncUnindexed is enabled (e.g. from user Sync button), add valid unindexed egg files
    if (options?.syncUnindexed && indexFile) {
      const diskEggFiles = (this.plugin.app.vault.getMarkdownFiles?.() || [])
        .filter((f) => isEggPath(f.path, folder));
      const indexedTargets = new Set(entries.map((e) => norm(e.fileName)));

      for (const file of diskEggFiles) {
        if (!indexedTargets.has(file.path)) {
          const content = await this.plugin.app.vault.read(file as any).catch(() => "");
          if (matchesEggFormat(content)) {
            let topic = "";
            try {
              const egg = await this.plugin.eggParser.readEgg(file.path);
              if (egg?.topic && egg.topic !== "Unknown") {
                topic = egg.topic;
              }
            } catch {}
            if (!topic) {
              topic = file.path.split("/").pop()!.replace(/\.md$/, "");
            }
            await this.appendIndexEntry(indexFile, file.path, topic);
            result.addedIndexEntries.push(file.path);
            indexedTargets.add(file.path);
          }
        }
      }
    }

    // Create missing egg notes for entries in _index.md
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
      result.addedIndexEntries.length ||
      result.fixedIndexPaths.length ||
      result.createdEggs.length ||
      result.prunedIndexEntries.length
    ) {
      console.log(
        `[NutEgg] Index sync: +${result.addedIndexEntries.length} entries added, ` +
          `~${result.fixedIndexPaths.length} paths normalized, ` +
          `+${result.createdEggs.length} egg files created, ` +
          `-${result.prunedIndexEntries.length} non-egg entries pruned`
      );
    }
    this.notifyDiffChanged();
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
    this.isUpdatingIndex = true;
    try {
      await this.appendIndexEntry(indexFile, fileName, description || name);
      this.notifyDiffChanged();
    } finally {
      this.isUpdatingIndex = false;
    }
    return { path: fileName, alreadyExists: false, language };
  }

  async removeIndexEntry(
    indexFile: any,
    entryPath: string
  ): Promise<boolean> {
    if (!indexFile) return false;
    const content = await this.plugin.app.vault.read(indexFile);
    const escaped = entryPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`^[\\t ]*[*\\-+]?[\\t ]*${escaped}(?:[\\t ]*:.*)?(?:\\r?\\n)?`, "m");
    if (!re.test(content)) return false;
    const updated = content.replace(re, "");
    if (updated === content) return false;
    await this.plugin.app.vault.modify(indexFile, updated);
    console.log(`[NutEgg] Removed index entry: ${entryPath}`);
    return true;
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

    const settingLang = this.plugin.settings?.contentOutputLanguage;
    const pluginLang =
      settingLang && settingLang !== "same-as-content" ? settingLang.trim() : "";

    if (!detectedLanguage) {
      detectedLanguage = pluginLang || extractEggLanguage(content) || "English";
    }

    if (detectedLanguage) {
      content = insertEggLanguage(content, detectedLanguage, { overwrite: true });
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
