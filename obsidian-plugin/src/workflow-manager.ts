import { Notice, TAbstractFile, TFile } from "obsidian";
import type NutEggPlugin from "./main";
import { PROMPTS } from "./prompt-templates";
import workflowReadmeTpl from "./workflow/README.md";

export type WorkflowPromptKey =
  | "contentAnalysis"
  | "eggAnalysis"
  | "eggCompare"
  | "followUp"
  | "eggRouting"
  | "contentTaskDefault"
  | "mergeUnprocessed"
  | "aggregateContent"
  | "aggregateEgg"
  | "localizeEgg"
  | "sharedOutputRules";

export const WORKFLOW_FILE_MAP: Record<WorkflowPromptKey, string> = {
  contentAnalysis: "content-analysis.md",
  eggAnalysis: "egg-analysis.md",
  eggCompare: "egg-compare.md",
  followUp: "follow-up.md",
  eggRouting: "egg-routing.md",
  contentTaskDefault: "content-task-default.md",
  mergeUnprocessed: "merge-unprocessed.md",
  aggregateContent: "aggregate-content.md",
  aggregateEgg: "aggregate-egg.md",
  localizeEgg: "localize-egg.md",
  sharedOutputRules: "shared-output-rules.md",
};

/** All built-in workflow files including README.md */
export const BUILTIN_WORKFLOW_FILES: Record<string, string> = {
  "README.md": workflowReadmeTpl,
  "content-analysis.md": PROMPTS.contentAnalysis,
  "egg-analysis.md": PROMPTS.eggAnalysis,
  "egg-compare.md": PROMPTS.eggCompare,
  "follow-up.md": PROMPTS.followUp,
  "egg-routing.md": PROMPTS.eggRouting,
  "content-task-default.md": PROMPTS.contentTaskDefault,
  "merge-unprocessed.md": PROMPTS.mergeUnprocessed,
  "aggregate-content.md": PROMPTS.aggregateContent,
  "aggregate-egg.md": PROMPTS.aggregateEgg,
  "localize-egg.md": PROMPTS.localizeEgg,
  "shared-output-rules.md": PROMPTS.sharedOutputRules,
};

/** Fast deterministic DJB2 hash for string comparison */
export function simpleHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

export class WorkflowManager {
  private plugin: NutEggPlugin;
  private cache = new Map<string, string>();
  private initialized = false;

  constructor(plugin: NutEggPlugin) {
    this.plugin = plugin;
  }

  get workflowFolder(): string {
    if (this.plugin.settings?.workflowFolder) {
      return this.plugin.settings.workflowFolder;
    }
    const base = this.plugin.vaultFolder || "nutegg";
    return `${base}/_workflow`;
  }

  /** Initialize watcher, seed files, and load cache */
  async init(): Promise<void> {
    if (!this.initialized && this.plugin.app?.vault?.on) {
      this.plugin.app.vault.on("modify", (file: TAbstractFile) => {
        this.onFileChanged(file);
      });
      this.plugin.app.vault.on("create", (file: TAbstractFile) => {
        this.onFileChanged(file);
      });
      this.plugin.app.vault.on("delete", (file: TAbstractFile) => {
        this.onFileDeleted(file);
      });
      this.initialized = true;
    }

    await this.ensureWorkflowFiles();
  }

  /**
   * Ensure the workflow folder and all built-in files exist in the vault.
   * Detects version updates non-destructively:
   * - Unmodified files are updated cleanly.
   * - User-customized files are preserved, and new versions are written as `*.new.md`.
   */
  async ensureWorkflowFiles(): Promise<void> {
    const folder = this.workflowFolder;
    await this.ensureFolder(folder);

    if (!this.plugin.settings.workflowHashes) {
      this.plugin.settings.workflowHashes = {};
    }

    let settingsChanged = false;

    for (const [filename, builtinContent] of Object.entries(BUILTIN_WORKFLOW_FILES)) {
      const filePath = `${folder}/${filename}`;
      const builtinHash = simpleHash(builtinContent);
      let file = this.plugin.app.vault.getAbstractFileByPath(filePath);
      const existsOnDisk = await this.plugin.app.vault.adapter.exists(filePath);

      if (!file && !existsOnDisk) {
        // File does not exist yet — create it
        try {
          await this.plugin.app.vault.create(filePath, builtinContent);
          this.cache.set(filename, builtinContent);
          this.plugin.settings.workflowHashes[filename] = builtinHash;
          settingsChanged = true;
          console.log(`[NutEgg] Seeded workflow file: ${filePath}`);
        } catch (err) {
          console.warn(`[NutEgg] Could not create ${filePath}:`, err);
        }
      } else {
        // File exists on disk or in vault cache!
        try {
          let vaultContent: string;
          if (file instanceof TFile) {
            vaultContent = await this.plugin.app.vault.read(file);
          } else {
            vaultContent = await this.plugin.app.vault.adapter.read(filePath);
          }
          this.cache.set(filename, vaultContent);

          const currentVaultHash = simpleHash(vaultContent);
          const recordedHash = this.plugin.settings.workflowHashes[filename];

          if (currentVaultHash === builtinHash) {
            // Vault content already matches current built-in default
            if (recordedHash !== builtinHash) {
              this.plugin.settings.workflowHashes[filename] = builtinHash;
              settingsChanged = true;
            }
          } else if (recordedHash && recordedHash === currentVaultHash) {
            // User never customized the file; vault holds the older default.
            // Safe to auto-update to latest built-in version!
            if (file instanceof TFile) {
              await this.plugin.app.vault.modify(file, builtinContent);
            } else {
              await this.plugin.app.vault.adapter.write(filePath, builtinContent);
            }
            this.cache.set(filename, builtinContent);
            this.plugin.settings.workflowHashes[filename] = builtinHash;
            settingsChanged = true;
            console.log(`[NutEgg] Auto-updated unmodified workflow file: ${filePath}`);
          } else if (!recordedHash) {
            // Legacy or initial pre-existing file — record its current hash
            this.plugin.settings.workflowHashes[filename] = currentVaultHash;
            settingsChanged = true;
          } else {
            // User HAS customized this file AND built-in version is different!
            // Do NOT clobber the user's file. Write [name].new.md instead.
            const baseName = filename.replace(/\.md$/, "");
            const newPath = `${folder}/${baseName}.new.md`;
            const existingNew = this.plugin.app.vault.getAbstractFileByPath(newPath);
            const newExistsOnDisk = await this.plugin.app.vault.adapter.exists(newPath);

            if (!existingNew && !newExistsOnDisk) {
              try {
                await this.plugin.app.vault.create(newPath, builtinContent);
                console.log(`[NutEgg] Saved updated workflow template to: ${newPath}`);
                new Notice(
                  `[NutEgg] Workflow update available for ${filename}. Your custom file was preserved; see ${baseName}.new.md to compare.`,
                  8000
                );
              } catch {
                // Ignore if created concurrently
              }
            }
          }
        } catch (err) {
          console.warn(`[NutEgg] Error reading workflow file ${filePath}:`, err);
        }
      }
    }

    // Auto-remove obsolete files that were unmodified defaults from a prior version
    const localFiles = this.getWorkflowFiles();
    for (const file of localFiles) {
      const relName = file.path.slice(folder.length + 1);
      if (!(relName in BUILTIN_WORKFLOW_FILES) && !relName.endsWith(".new.md")) {
        const recordedHash = this.plugin.settings.workflowHashes[relName];
        if (recordedHash) {
          const content = await this.plugin.app.vault.read(file);
          if (simpleHash(content) === recordedHash) {
            // Unmodified prompt from an older version that is no longer in code — safe to auto-remove
            await this.plugin.app.vault.delete(file);
            delete this.plugin.settings.workflowHashes[relName];
            this.cache.delete(relName);
            settingsChanged = true;
            console.log(`[NutEgg] Auto-removed obsolete unmodified workflow file: ${file.path}`);
          }
        }
      }
    }

    if (settingsChanged) {
      await this.plugin.saveSettings();
    }
  }

  /** Retrieve all workflow files in workflowFolder, excluding _backup/ */
  getWorkflowFiles(): TFile[] {
    const folder = this.workflowFolder;
    const vault = this.plugin.app.vault;
    let allFiles: TFile[] = [];
    if (typeof vault.getFiles === "function") {
      allFiles = vault.getFiles();
    } else if (typeof vault.getMarkdownFiles === "function") {
      allFiles = vault.getMarkdownFiles();
    }
    return allFiles.filter(
      (f: TFile) =>
        f.path.startsWith(`${folder}/`) &&
        !f.path.startsWith(`${folder}/_backup/`) &&
        !f.path.endsWith("/_backup")
    );
  }

  /** Retrieve prompt text dynamically from vault cache, falling back to built-in */
  getPrompt(key: WorkflowPromptKey): string {
    const filename = WORKFLOW_FILE_MAP[key];
    if (!filename) return "";

    const cached = this.cache.get(filename);
    if (cached && cached.trim().length > 0) {
      return cached;
    }

    // Built-in fallback
    return BUILTIN_WORKFLOW_FILES[filename] || "";
  }

  /**
   * Reset workflow files to built-in defaults:
   * 1. Moves ALL current files in workflowFolder to a timestamped backup folder.
   * 2. Copies clean built-in prompt files into workflowFolder.
   * 3. Resets cache and workflow hashes.
   */
  async resetToDefaults(): Promise<void> {
    const folder = this.workflowFolder;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const backupFolder = `${folder}/_backup/${timestamp}`;
    await this.ensureFolder(backupFolder);

    // 1. Move all existing files to the backup directory
    const existingFiles = this.getWorkflowFiles();
    for (const file of existingFiles) {
      const relName = file.path.slice(folder.length + 1);
      const lastSlash = relName.lastIndexOf("/");
      if (lastSlash !== -1) {
        await this.ensureFolder(`${backupFolder}/${relName.slice(0, lastSlash)}`);
      }
      const content = await this.plugin.app.vault.read(file);
      await this.plugin.app.vault.create(`${backupFolder}/${relName}`, content);
      await this.plugin.app.vault.delete(file);
    }

    // 2. Copy clean default workflow prompts into workflowFolder
    this.cache.clear();
    this.plugin.settings.workflowHashes = {};

    for (const [filename, builtinContent] of Object.entries(BUILTIN_WORKFLOW_FILES)) {
      const filePath = `${folder}/${filename}`;
      await this.plugin.app.vault.create(filePath, builtinContent);
      this.cache.set(filename, builtinContent);
      this.plugin.settings.workflowHashes[filename] = simpleHash(builtinContent);
    }

    await this.plugin.saveSettings();
    new Notice(`[NutEgg] Reset workflow files to defaults. Previous files moved to ${backupFolder}`);
  }

  /** Alias for backward compatibility */
  async syncToDefaults(): Promise<void> {
    return this.resetToDefaults();
  }

  private async onFileChanged(file: TAbstractFile): Promise<void> {
    if (!(file instanceof TFile) || !file.path.startsWith(this.workflowFolder)) {
      return;
    }
    const filename = file.name;
    if (filename in BUILTIN_WORKFLOW_FILES) {
      const content = await this.plugin.app.vault.read(file);
      this.cache.set(filename, content);
    }
  }

  private onFileDeleted(file: TAbstractFile): void {
    if (!file.path.startsWith(this.workflowFolder)) {
      return;
    }
    const parts = file.path.split("/");
    const filename = parts[parts.length - 1];
    if (this.cache.has(filename)) {
      this.cache.delete(filename);
    }
  }

  private async ensureFolder(path: string): Promise<void> {
    const parts = path.split("/");
    let currentPath = "";
    for (const part of parts) {
      if (!part) continue;
      currentPath += (currentPath ? "/" : "") + part;
      try {
        const exists = await this.plugin.app.vault.adapter.exists(currentPath);
        if (!exists) {
          await this.plugin.app.vault.createFolder(currentPath);
        }
      } catch {
        // Ignore "Folder already exists" errors
      }
    }
  }
}

