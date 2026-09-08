import { Notice, TAbstractFile, TFile } from "obsidian";
import type NutEggPlugin from "./main";
import { PROMPTS } from "./prompt-templates";
import workflowReadmeTpl from "./workflow/README.md";

export type WorkflowPromptKey =
  | "contentAnalysis"
  | "eggAnalysis"
  | "eggCombined"
  | "eggCompare"
  | "followUp"
  | "eggRouting"
  | "actionGuideDefault"
  | "mergeUnprocessed"
  | "aggregateContent"
  | "aggregateEgg"
  | "suggestEgg"
  | "localizeEgg"
  | "groundingRule";

export const WORKFLOW_FILE_MAP: Record<WorkflowPromptKey, string> = {
  contentAnalysis: "content-analysis.md",
  eggAnalysis: "egg-analysis.md",
  eggCombined: "egg-combined.md",
  eggCompare: "egg-compare.md",
  followUp: "follow-up.md",
  eggRouting: "egg-routing.md",
  actionGuideDefault: "action-guide-default.md",
  mergeUnprocessed: "merge-unprocessed.md",
  aggregateContent: "aggregate-content.md",
  aggregateEgg: "aggregate-egg.md",
  suggestEgg: "suggest-egg.md",
  localizeEgg: "localize-egg.md",
  groundingRule: "grounding-rule.md",
};

/** All built-in workflow files including README.md */
export const BUILTIN_WORKFLOW_FILES: Record<string, string> = {
  "README.md": workflowReadmeTpl,
  "content-analysis.md": PROMPTS.contentAnalysis,
  "egg-analysis.md": PROMPTS.eggAnalysis,
  "egg-combined.md": PROMPTS.eggCombined,
  "egg-compare.md": PROMPTS.eggCompare,
  "follow-up.md": PROMPTS.followUp,
  "egg-routing.md": PROMPTS.eggRouting,
  "action-guide-default.md": PROMPTS.actionGuideDefault,
  "merge-unprocessed.md": PROMPTS.mergeUnprocessed,
  "aggregate-content.md": PROMPTS.aggregateContent,
  "aggregate-egg.md": PROMPTS.aggregateEgg,
  "suggest-egg.md": PROMPTS.suggestEgg,
  "localize-egg.md": PROMPTS.localizeEgg,
  "grounding-rule.md": PROMPTS.groundingRule,
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
      const file = this.plugin.app.vault.getAbstractFileByPath(filePath);

      if (!file) {
        // File does not exist yet — create it
        await this.plugin.app.vault.create(filePath, builtinContent);
        this.cache.set(filename, builtinContent);
        this.plugin.settings.workflowHashes[filename] = builtinHash;
        settingsChanged = true;
        console.log(`[NutEgg] Seeded workflow file: ${filePath}`);
      } else {
        // File exists — read and check for updates
        const vaultContent = await this.plugin.app.vault.read(file as TFile);
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
          await this.plugin.app.vault.modify(file as TFile, builtinContent);
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

          if (!existingNew) {
            await this.plugin.app.vault.create(newPath, builtinContent);
            console.log(`[NutEgg] Saved updated workflow template to: ${newPath}`);
            new Notice(
              `[NutEgg] Workflow update available for ${filename}. Your custom file was preserved; see ${baseName}.new.md to compare.`,
              8000
            );
          }
        }
      }
    }

    if (settingsChanged) {
      await this.plugin.saveSettings();
    }
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

  /** Reset all workflow files to built-in defaults with backup */
  async resetToDefaults(): Promise<void> {
    const folder = this.workflowFolder;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const backupFolder = `${folder}/_backup/${timestamp}`;
    await this.ensureFolder(backupFolder);

    for (const [filename, builtinContent] of Object.entries(BUILTIN_WORKFLOW_FILES)) {
      const filePath = `${folder}/${filename}`;
      const file = this.plugin.app.vault.getAbstractFileByPath(filePath);

      if (file) {
        // Backup current file
        const currentContent = await this.plugin.app.vault.read(file as TFile);
        await this.plugin.app.vault.create(`${backupFolder}/${filename}`, currentContent);
        // Overwrite with default
        await this.plugin.app.vault.modify(file as TFile, builtinContent);
      } else {
        await this.plugin.app.vault.create(filePath, builtinContent);
      }

      this.cache.set(filename, builtinContent);
      this.plugin.settings.workflowHashes[filename] = simpleHash(builtinContent);
    }

    await this.plugin.saveSettings();
    new Notice(`[NutEgg] Restored default workflow files. Previous files backed up to ${backupFolder}`);
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
      const exists = await this.plugin.app.vault.adapter.exists(currentPath);
      if (!exists) {
        await this.plugin.app.vault.createFolder(currentPath);
      }
    }
  }
}

