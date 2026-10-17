import { Notice, TAbstractFile, TFile } from 'obsidian';
import type NutEggPlugin from './main';
import { PROMPTS } from './prompt-templates';
import { t } from './i18n';
import workflowReadmeTpl from '../../shared/workflow/README.md';
import { isEggPath, extractEggLanguage, insertEggLanguage } from './egg-parser';
import type { WorkflowFileMeta } from './settings';

export type WorkflowPromptKey =
  | 'discussionAnalysis'
  | 'aggregateDiscussion'
  | 'contentAnalysis'
  | 'verdictSummary'
  | 'mindMapAnalysis'
  | 'eggAnalysis'
  | 'followUp'
  | 'eggRouting'
  | 'contentTaskDefault'
  | 'mergeUnprocessed'
  | 'aggregateContent'
  | 'aggregateEgg'
  | 'localizeEgg'
  | 'localizeWorkflow'
  | 'sharedOutputRules'
  | 'conversationRules'
  | 'chromeKnowledge';

export const WORKFLOW_FILE_MAP: Record<WorkflowPromptKey, string> = {
  discussionAnalysis: 'discussion-analysis.md',
  aggregateDiscussion: 'aggregate-discussion.md',
  contentAnalysis: 'content-analysis.md',
  verdictSummary: 'verdict-summary.md',
  mindMapAnalysis: 'mindmap-analysis.md',
  eggAnalysis: 'egg-analysis.md',
  followUp: 'follow-up.md',
  eggRouting: 'egg-routing.md',
  contentTaskDefault: 'content-task-default.md',
  mergeUnprocessed: 'merge-unprocessed.md',
  aggregateContent: 'aggregate-content.md',
  aggregateEgg: 'aggregate-egg.md',
  localizeEgg: 'localize-egg.md',
  localizeWorkflow: 'localize-workflow.md',
  sharedOutputRules: 'shared-output-rules.md',
  conversationRules: 'conversation-rules.md',
  chromeKnowledge: 'chrome-knowledge.md',
};

/** All built-in workflow files including README.md */
export const BUILTIN_WORKFLOW_FILES: Record<string, string> = {
  'README.md': workflowReadmeTpl,
  'discussion-analysis.md': PROMPTS.discussionAnalysis,
  'aggregate-discussion.md': PROMPTS.aggregateDiscussion,
  'content-analysis.md': PROMPTS.contentAnalysis,
  'verdict-summary.md': PROMPTS.verdictSummary,
  'mindmap-analysis.md': PROMPTS.mindMapAnalysis,
  'egg-analysis.md': PROMPTS.eggAnalysis,
  'follow-up.md': PROMPTS.followUp,
  'egg-routing.md': PROMPTS.eggRouting,
  'content-task-default.md': PROMPTS.contentTaskDefault,
  'merge-unprocessed.md': PROMPTS.mergeUnprocessed,
  'aggregate-content.md': PROMPTS.aggregateContent,
  'aggregate-egg.md': PROMPTS.aggregateEgg,
  'localize-egg.md': PROMPTS.localizeEgg,
  'localize-workflow.md': PROMPTS.localizeWorkflow,
  'shared-output-rules.md': PROMPTS.sharedOutputRules,
  'conversation-rules.md': PROMPTS.conversationRules,
  'chrome-knowledge.md': PROMPTS.chromeKnowledge,
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
    const base = this.plugin.vaultFolder || 'nutegg';
    return `${base}/_workflow`;
  }

  /** Initialize watcher, seed files, and load cache */
  async init(): Promise<void> {
    if (!this.initialized && this.plugin.app?.vault?.on) {
      this.plugin.app.vault.on('modify', (file: TAbstractFile) => {
        this.onFileChanged(file);
      });
      this.plugin.app.vault.on('create', (file: TAbstractFile) => {
        this.onFileChanged(file);
      });
      this.plugin.app.vault.on('delete', (file: TAbstractFile) => {
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
  /**
   * Helper to retrieve or initialize WorkflowFileMeta for a given workflow file.
   */
  getWorkflowMeta(filename: string, builtinHash: string, vaultHash?: string): WorkflowFileMeta {
    if (!this.plugin.settings.workflowMeta) {
      this.plugin.settings.workflowMeta = {};
    }
    let meta = this.plugin.settings.workflowMeta[filename];
    if (!meta) {
      const recordedHash = this.plugin.settings.workflowHashes?.[filename];
      meta = {
        sourceHash: recordedHash || builtinHash,
        vaultHash: recordedHash || vaultHash || builtinHash,
        language: 'English',
      };
      this.plugin.settings.workflowMeta[filename] = meta;
    }
    return meta;
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
    if (!this.plugin.settings.workflowMeta) {
      this.plugin.settings.workflowMeta = {};
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
          this.plugin.settings.workflowMeta[filename] = {
            sourceHash: builtinHash,
            vaultHash: builtinHash,
            language: 'English',
          };
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
          const meta = this.getWorkflowMeta(filename, builtinHash, currentVaultHash);
          const isUnmodified = currentVaultHash === meta.vaultHash;
          const isBuiltinUpdated = meta.sourceHash !== builtinHash;

          if (currentVaultHash === builtinHash) {
            // Vault content matches current built-in default
            if (meta.sourceHash !== builtinHash || meta.vaultHash !== builtinHash) {
              meta.sourceHash = builtinHash;
              meta.vaultHash = builtinHash;
              meta.language = 'English';
              this.plugin.settings.workflowHashes[filename] = builtinHash;
              settingsChanged = true;
            }
          } else if (isUnmodified && isBuiltinUpdated) {
            // User never customized the file; vault holds older default.
            // Safe to auto-update to latest built-in version!
            await this.writeWorkflowFile(filename, builtinContent);
            this.cache.set(filename, builtinContent);
            meta.sourceHash = builtinHash;
            meta.vaultHash = builtinHash;
            meta.language = 'English';
            this.plugin.settings.workflowHashes[filename] = builtinHash;
            settingsChanged = true;
            console.log(`[NutEgg] Auto-updated unmodified workflow file: ${filePath}`);
          } else if (!meta.vaultHash) {
            meta.sourceHash = builtinHash;
            meta.vaultHash = currentVaultHash;
            this.plugin.settings.workflowHashes[filename] = currentVaultHash;
            settingsChanged = true;
          } else if (!isUnmodified && isBuiltinUpdated) {
            // User HAS customized this file AND built-in version is different!
            // Do NOT clobber the user's file. Write [name].new.md instead.
            const baseName = filename.replace(/\.md$/, '');
            const newPath = `${folder}/${baseName}.new.md`;
            const existingNew = this.plugin.app.vault.getAbstractFileByPath(newPath);
            const newExistsOnDisk = await this.plugin.app.vault.adapter.exists(newPath);

            if (!existingNew && !newExistsOnDisk) {
              try {
                await this.plugin.app.vault.create(newPath, builtinContent);
                console.log(`[NutEgg] Saved updated workflow template to: ${newPath}`);
                new Notice(`[NutEgg] ${t('workflowUpdateNotice', { files: `${baseName}.new.md` })}`, 10000);
              } catch {
                // Ignore if created concurrently
              }
            }
            meta.sourceHash = builtinHash;
            settingsChanged = true;
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
      if (!(relName in BUILTIN_WORKFLOW_FILES) && !relName.endsWith('.new.md')) {
        const meta = this.plugin.settings.workflowMeta?.[relName];
        const recordedHash = meta?.vaultHash || this.plugin.settings.workflowHashes[relName];
        if (recordedHash) {
          const content = await this.plugin.app.vault.read(file);
          if (simpleHash(content) === recordedHash) {
            // Unmodified prompt from an older version that is no longer in code — safe to auto-remove
            await this.plugin.app.vault.delete(file);
            delete this.plugin.settings.workflowHashes[relName];
            if (this.plugin.settings.workflowMeta) {
              delete this.plugin.settings.workflowMeta[relName];
            }
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
    if (typeof vault.getFiles === 'function') {
      allFiles = vault.getFiles();
    } else if (typeof vault.getMarkdownFiles === 'function') {
      allFiles = vault.getMarkdownFiles();
    }
    return allFiles.filter(
      (f: TFile) =>
        f.path.startsWith(`${folder}/`) && !f.path.startsWith(`${folder}/_backup/`) && !f.path.endsWith('/_backup')
    );
  }

  /**
   * Returns list of filenames for pending workflow updates (*.new.md) in workflow folder.
   * If all *.new.md files are deleted or moved, returns an empty array.
   */
  getPendingWorkflowUpdates(): string[] {
    const folder = this.workflowFolder;
    const files = this.getWorkflowFiles();
    return files.filter(f => f.path.startsWith(`${folder}/`) && f.name.endsWith('.new.md')).map(f => f.name);
  }

  /** Retrieve prompt text dynamically from vault cache, falling back to built-in */
  getPrompt(key: WorkflowPromptKey): string {
    const filename = WORKFLOW_FILE_MAP[key];
    if (!filename) return '';

    const cached = this.cache.get(filename);
    if (cached && cached.trim().length > 0) {
      return cached;
    }

    // Built-in fallback
    return BUILTIN_WORKFLOW_FILES[filename] || '';
  }

  /**
   * Reset workflow files to built-in defaults:
   * 1. Moves ALL current files in workflowFolder to a timestamped backup folder.
   * 2. Copies clean built-in prompt files into workflowFolder.
   * 3. Resets cache and workflow hashes.
   */
  async resetToDefaults(): Promise<void> {
    const folder = this.workflowFolder;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupFolder = `${folder}/_backup/${timestamp}`;
    await this.ensureFolder(backupFolder);

    // 1. Move all existing files to the backup directory
    const existingFiles = this.getWorkflowFiles();
    for (const file of existingFiles) {
      const relName = file.path.slice(folder.length + 1);
      const lastSlash = relName.lastIndexOf('/');
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
    this.plugin.settings.workflowMeta = {};

    for (const [filename, builtinContent] of Object.entries(BUILTIN_WORKFLOW_FILES)) {
      const filePath = `${folder}/${filename}`;
      await this.plugin.app.vault.create(filePath, builtinContent);
      this.cache.set(filename, builtinContent);
      const hash = simpleHash(builtinContent);
      this.plugin.settings.workflowHashes[filename] = hash;
      this.plugin.settings.workflowMeta[filename] = {
        sourceHash: hash,
        vaultHash: hash,
        language: 'English',
      };
    }

    await this.plugin.saveSettings();
    new Notice(`[NutEgg] Reset workflow files to defaults. Previous files moved to ${backupFolder}`);
  }

  /** Alias for backward compatibility */
  async syncToDefaults(): Promise<void> {
    return this.resetToDefaults();
  }

  private localizing = false;

  /**
   * Localize workflow prompts and egg files in the vault to targetLanguage,
   * or revert them to English built-in defaults if targetLanguage is 'same-as-content' or 'English'.
   *
   * Rules:
   * - Unmodified workflow files (diskHash === meta.vaultHash) are localized in place.
   * - User-customized workflow files (diskHash !== meta.vaultHash) generate *.new.md side-by-side
   *   and reuse the workflow update warning banner.
   * - Egg files preserve # Knowledge and # Unprocessed byte-for-byte; only instructions are updated.
   */
  async localizeAll(targetLanguage?: string): Promise<{
    workflowsUpdated: number;
    eggsUpdated: number;
    newFilesCreated: number;
    errors: string[];
  }> {
    if (this.localizing) {
      throw new Error('Localization is already in progress.');
    }
    this.localizing = true;
    const errors: string[] = [];
    let workflowsUpdated = 0;
    let eggsUpdated = 0;
    let newFilesCreated = 0;

    try {
      const folder = this.workflowFolder;
      await this.ensureFolder(folder);
      const effectiveLang = (targetLanguage || this.plugin.settings.outputLanguage || 'same-as-content').trim();
      const isEnglishOrSame =
        !effectiveLang ||
        effectiveLang === 'same-as-content' ||
        effectiveLang.toLowerCase() === 'english';

      const nonLocalizable = new Set([
        'README.md',
        'localize-egg.md',
        'localize-workflow.md',
      ]);

      if (isEnglishOrSame) {
        // Revert unmodified workflows to built-in English defaults
        for (const [filename, builtinContent] of Object.entries(BUILTIN_WORKFLOW_FILES)) {
          if (nonLocalizable.has(filename)) continue;
          const filePath = `${folder}/${filename}`;
          const builtinHash = simpleHash(builtinContent);
          let currentContent = '';
          const file = this.plugin.app.vault.getAbstractFileByPath(filePath);
          if (file instanceof TFile) {
            currentContent = await this.plugin.app.vault.read(file);
          } else if (await this.plugin.app.vault.adapter.exists(filePath)) {
            currentContent = await this.plugin.app.vault.adapter.read(filePath);
          } else {
            continue;
          }

          const currentHash = simpleHash(currentContent);
          const meta = this.getWorkflowMeta(filename, builtinHash, currentHash);
          const isUnmodified = currentHash === meta.vaultHash;

          if (isUnmodified) {
            if (currentHash !== builtinHash || meta.language !== 'English') {
              await this.writeWorkflowFile(filename, builtinContent);
              this.cache.set(filename, builtinContent);
              meta.sourceHash = builtinHash;
              meta.vaultHash = builtinHash;
              meta.language = 'English';
              this.plugin.settings.workflowHashes[filename] = builtinHash;
              workflowsUpdated++;
            }
          } else {
            // User customized this file! As per requirement 3:
            // update with .new.md suffix and trigger warning
            const baseName = filename.replace(/\.md$/, '');
            const newPath = `${folder}/${baseName}.new.md`;
            if (!(await this.plugin.app.vault.adapter.exists(newPath))) {
              await this.plugin.app.vault.create(newPath, builtinContent);
              newFilesCreated++;
            }
          }
        }

        // Revert eggs with non-English language tag to English
        const eggFiles = this.getEggFiles();
        for (const eggFile of eggFiles) {
          try {
            const content = await this.plugin.app.vault.read(eggFile);
            const currentEggLang = extractEggLanguage(content);
            if (currentEggLang && currentEggLang.toLowerCase() !== 'english') {
              const updated = insertEggLanguage(content, 'English', { overwrite: true });
              await this.plugin.app.vault.modify(eggFile, updated);
              eggsUpdated++;
            }
          } catch (err: any) {
            errors.push(`Egg ${eggFile.name}: ${err?.message || String(err)}`);
          }
        }
      } else {
        // Localize to effectiveLang (e.g. 'Chinese', 'Japanese', 'Spanish')
        const processor = this.plugin.aiProcessor;
        if (!processor) {
          throw new Error('AI Processor not available.');
        }

        for (const [filename, builtinContent] of Object.entries(BUILTIN_WORKFLOW_FILES)) {
          if (nonLocalizable.has(filename)) continue;
          const filePath = `${folder}/${filename}`;
          const builtinHash = simpleHash(builtinContent);
          let currentContent = '';
          const file = this.plugin.app.vault.getAbstractFileByPath(filePath);
          if (file instanceof TFile) {
            currentContent = await this.plugin.app.vault.read(file);
          } else if (await this.plugin.app.vault.adapter.exists(filePath)) {
            currentContent = await this.plugin.app.vault.adapter.read(filePath);
          } else {
            continue;
          }

          const currentHash = simpleHash(currentContent);
          const meta = this.getWorkflowMeta(filename, builtinHash, currentHash);
          const isUnmodified = currentHash === meta.vaultHash;

          if (isUnmodified) {
            if (meta.language === effectiveLang && meta.sourceHash === builtinHash) {
              // Already localized to target language
              continue;
            }
            const localized = await processor.localizeWorkflowTemplate(
              builtinContent,
              effectiveLang,
              filename
            );
            if (localized) {
              await this.writeWorkflowFile(filename, localized);
              this.cache.set(filename, localized);
              const locHash = simpleHash(localized);
              meta.sourceHash = builtinHash;
              meta.vaultHash = locHash;
              meta.language = effectiveLang;
              this.plugin.settings.workflowHashes[filename] = locHash;
              workflowsUpdated++;
            } else {
              errors.push(`Failed to localize ${filename}`);
            }
          } else {
            // User customized this file! As per requirement 3:
            // update with .new.md suffix and trigger warning
            const localized = await processor.localizeWorkflowTemplate(
              builtinContent,
              effectiveLang,
              filename
            );
            if (localized) {
              const baseName = filename.replace(/\.md$/, '');
              const newPath = `${folder}/${baseName}.new.md`;
              if (await this.plugin.app.vault.adapter.exists(newPath)) {
                await this.plugin.app.vault.adapter.write(newPath, localized);
              } else {
                await this.plugin.app.vault.create(newPath, localized);
              }
              newFilesCreated++;
            }
          }
        }

        // Localize egg instructions in vault
        const eggFiles = this.getEggFiles();
        for (const eggFile of eggFiles) {
          try {
            const content = await this.plugin.app.vault.read(eggFile);
            const currentEggLang = extractEggLanguage(content);
            if (currentEggLang && currentEggLang.toLowerCase() === effectiveLang.toLowerCase()) {
              continue;
            }

            const knowledgeIdx = content.indexOf('\n# Knowledge');
            const topPart = knowledgeIdx !== -1 ? content.slice(0, knowledgeIdx) : content;
            const bottomPart = knowledgeIdx !== -1 ? content.slice(knowledgeIdx) : '';

            // Run localization on template header only
            const templateToLocalize = `${topPart}\n\n# Knowledge\n\n# Unprocessed\n`;
            const localizedResult = await processor.localizeEggTemplate(
              templateToLocalize,
              `Target language: ${effectiveLang}`,
              effectiveLang
            );

            if (localizedResult?.content) {
              let localizedTop = localizedResult.content;
              const locKnowledgeIdx = localizedTop.indexOf('\n# Knowledge');
              if (locKnowledgeIdx !== -1) {
                localizedTop = localizedTop.slice(0, locKnowledgeIdx);
              }
              localizedTop = insertEggLanguage(localizedTop, effectiveLang, { overwrite: true });
              const finalContent = bottomPart ? `${localizedTop}${bottomPart}` : localizedTop;
              await this.plugin.app.vault.modify(eggFile, finalContent);
              eggsUpdated++;
            }
          } catch (err: any) {
            errors.push(`Egg ${eggFile.name}: ${err?.message || String(err)}`);
          }
        }
      }

      await this.plugin.saveSettings();

      if (newFilesCreated > 0) {
        const pending = this.getPendingWorkflowUpdates();
        if (pending.length > 0) {
          new Notice(`[NutEgg] ${t('workflowUpdateNotice', { files: pending.join(', ') })}`, 10000);
        }
      }

      return { workflowsUpdated, eggsUpdated, newFilesCreated, errors };
    } finally {
      this.localizing = false;
    }
  }

  /** Retrieve all egg files in vaultFolder */
  getEggFiles(): TFile[] {
    const folder = this.plugin.vaultFolder || 'nutegg';
    const vault = this.plugin.app.vault;
    let allFiles: TFile[] = [];
    if (typeof vault.getMarkdownFiles === 'function') {
      allFiles = vault.getMarkdownFiles();
    } else if (typeof vault.getFiles === 'function') {
      allFiles = vault.getFiles();
    }
    return allFiles.filter((f: TFile) => isEggPath(f.path, folder));
  }

  /** Helper to write or modify a workflow file */
  async writeWorkflowFile(filename: string, content: string): Promise<void> {
    const filePath = `${this.workflowFolder}/${filename}`;
    const file = this.plugin.app.vault.getAbstractFileByPath(filePath);
    if (file instanceof TFile) {
      await this.plugin.app.vault.modify(file, content);
    } else if (await this.plugin.app.vault.adapter.exists(filePath)) {
      await this.plugin.app.vault.adapter.write(filePath, content);
    } else {
      await this.plugin.app.vault.create(filePath, content);
    }
  }

  private async onFileChanged(file: TAbstractFile): Promise<void> {
    if (!(file instanceof TFile) || !file.path.startsWith(this.workflowFolder)) {
      return;
    }
    const filename = file.name;
    if (filename in BUILTIN_WORKFLOW_FILES) {
      try {
        const content = await this.plugin.app.vault.read(file);
        this.cache.set(filename, content);
      } catch (err) {
        console.warn(`[NutEgg] Error reading changed workflow file ${file.path}:`, err);
      }
    }
  }

  private onFileDeleted(file: TAbstractFile): void {
    if (!file.path.startsWith(this.workflowFolder)) {
      return;
    }
    const parts = file.path.split('/');
    const filename = parts[parts.length - 1];
    if (this.cache.has(filename)) {
      this.cache.delete(filename);
    }
  }

  private async ensureFolder(path: string): Promise<void> {
    const parts = path.split('/');
    let currentPath = '';
    for (const part of parts) {
      if (!part) continue;
      currentPath += (currentPath ? '/' : '') + part;
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
