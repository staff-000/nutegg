import { SubscriptionService } from './subscription-service';
import { ConnectionAccess } from './connection-access';
import { approveChromeConnection } from './connection-modal';
import { migrateAISettings } from '../../shared/src/catalog';
import { MarkdownView, Notice, Plugin } from "obsidian";
import {
  NutEggSettings,
  DEFAULT_SETTINGS,
  NutEggSettingTab,
} from "./settings";
import { AIClient, isAIConfigured } from "./ai-client";
import { NutEggServer } from "./server";
import { AIProcessor } from "./ai-processor";
import { KnowledgeBase } from "./knowledge-base";
import { IndexReader } from "./index-reader";
import { EggParser, isEggPath } from "./egg-parser";
import { IndexSync } from "./index-sync";
import { NutEggDatabase } from "./db";
import { INDEX_TEMPLATE, EGG_TEMPLATE, EXAMPLE_EGGS } from "./defaults";
import { registerMergeWidget, registerMergeEditorExtension, runMerge } from "./merge-widget";
import { CreateEggModal, registerIndexWidget, registerIndexEditorExtension } from "./index-widget";
import { WorkflowManager } from "./workflow-manager";
import { t } from "./i18n";

export default class NutEggPlugin extends Plugin {
  declare settings: NutEggSettings;
  aiClient!: AIClient;
  subscriptions!: SubscriptionService;
  connectionAccess!: ConnectionAccess;
  server!: NutEggServer;
  aiProcessor!: AIProcessor;
  knowledgeBase!: KnowledgeBase;
  indexReader!: IndexReader;
  eggParser!: EggParser;
  indexSync!: IndexSync;
  workflowManager!: WorkflowManager;
  db!: NutEggDatabase;
  creditStatusBarItem: HTMLElement | null = null;
  private settingsTab: NutEggSettingTab | null = null;
  private creditStatusVersion = 0;

  get vaultFolder(): string {
    return this.settings?.indexFile
      ? this.settings.indexFile.replace(/\/[^/]+$/, "")
      : "nutegg";
  }

  async onload(): Promise<void> {
    await this.loadSettings();

    // Initialize workflow manager and subsystems
    this.workflowManager = new WorkflowManager(this);
    this.subscriptions = new SubscriptionService(this.settings.subscriptionPaths, () => this.settings.subscriptionEnabled === true);
    this.connectionAccess = new ConnectionAccess(this.settings.chromeConnections ||= {},
      origin => approveChromeConnection(this.app, origin), () => this.saveSettings());
    this.aiClient = new AIClient(this.settings, this.subscriptions);
    this.aiProcessor = new AIProcessor(this);
    this.knowledgeBase = new KnowledgeBase(this);
    this.indexReader = new IndexReader(this);
    this.eggParser = new EggParser(this);
    this.indexSync = new IndexSync(this);
    this.indexSync.init();

    // SQLite database (dedup cache, replay, RAG foundation). Never throws.
    this.db = new NutEggDatabase(this);
    try {
      await this.db.init();
    } catch (err) {
      console.warn("[NutEgg] DB init warning:", err);
    }

    // Start local HTTP server
    this.server = new NutEggServer(this, this.settings.serverPort);
    try {
      await this.server.start();
      new Notice(t("serverStarted", { port: this.settings.serverPort }));
    } catch (err) {
      console.error("[NutEgg] Failed to start server:", err);
      new Notice(t("serverFailed"));
    }

    // Add settings tab
    this.settingsTab = new NutEggSettingTab(this.app, this);
    this.addSettingTab(this.settingsTab);

    // Vault-dependent initializations (folder/file creation, index consistency)
    // MUST wait until onLayoutReady. On cold Obsidian startup, vault indexing
    // is not ready during onload, which caused getAbstractFileByPath / getMarkdownFiles
    // to return null/empty and fail with "File already exists".
    const runPostLayoutInit = async () => {
      try {
        await this.initializeVault();
      } catch (err) {
        console.error("[NutEgg] Vault initialization failed:", err);
      }

      try {
        await this.indexSync.checkAndFix();
      } catch (err) {
        console.error("[NutEgg] Index sync check failed:", err);
      }

      this.updateCreditStatusBar();
    };

    if (this.app?.workspace?.onLayoutReady) {
      this.app.workspace.onLayoutReady(runPostLayoutInit);
    } else {
      runPostLayoutInit();
    }

    // Ribbon icon — opens the index file for editing
    this.addRibbonIcon("egg", t("ribbonOpenIndex"), async () => {
      const indexPath = this.settings.indexFile;
      const file = this.app.vault.getAbstractFileByPath(indexPath);
      if (file) {
        const leaf = this.app.workspace.getLeaf(false);
        await leaf.openFile(file as any);
      }
    });

    // Ribbon icon — 1-click AI credit & balance check
    this.addRibbonIcon("coins", t("ribbonCheckCredit"), async () => {
      await this.updateCreditStatusBar(true);
    });

    this.registerSubscriptionCommands();

    // Command: Create a new egg file
    this.addCommand({
      id: "nutegg-new-egg",
      name: t("cmdNewEgg"),
      callback: () => {
        new CreateEggModal(this.app, this).open();
      },
    });

    // Command: Open index file
    this.addCommand({
      id: "nutegg-open-index",
      name: t("cmdOpenIndex"),
      callback: async () => {
        const indexPath = this.settings.indexFile;
        const file = this.app.vault.getAbstractFileByPath(indexPath);
        if (file) {
          const leaf = this.app.workspace.getLeaf(false);
          await leaf.openFile(file as any);
        } else {
          new Notice(t("indexNotFound", { path: indexPath }));
        }
      },
    });

    // Command: Merge unprocessed entries in current egg file
    this.addCommand({
      id: "nutegg-merge-current-egg",
      name: t("cmdMergeCurrent"),
      callback: async () => {
        const activeFile = this.app.workspace.getActiveFile();
        if (!activeFile) {
          new Notice(t("noActiveFile"));
          return;
        }
        if (!isEggPath(activeFile.path, this.vaultFolder)) {
          new Notice(t("notEggNote"));
          return;
        }

        new Notice(t("mergingEntries", { name: activeFile.basename }));
        // Merge against the editor's live buffer (saved first when dirty)
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        const cm = (activeView as any)?.editor?.cm;
        const docText = cm ? cm.state.doc.toString() : null;
        const result = await runMerge(this, activeFile.path, docText);
        if (result && result.entries > 0) {
          new Notice(t("mergedEntries", { count: result.entries }));
        } else {
          new Notice(t("noUnprocessed"));
        }
      },
    });

    // Command: Check AI credit & balance
    this.addCommand({
      id: "nutegg-check-credit",
      name: t("cmdCheckCredit"),
      callback: async () => {
        await this.updateCreditStatusBar(true);
      },
    });

    // Command: Use default workflow prompts (backup existing)
    this.addCommand({
      id: "nutegg-use-default-workflow-prompts",
      name: t("cmdUseDefaultWorkflowPrompts"),
      callback: async () => {
        await this.workflowManager.resetToDefaults();
      },
    });

    // Command: Report a bug on GitHub
    this.addCommand({
      id: "nutegg-report-bug",
      name: t("cmdReportBug"),
      callback: () => {
        this.openBugReport();
      },
    });

    // Status Bar Item for AI Credit / Balance
    this.creditStatusBarItem = this.addStatusBarItem();
    this.creditStatusBarItem.addClass("nutegg-statusbar-credit");
    this.creditStatusBarItem.setText("🪙 NutEgg AI");
    this.creditStatusBarItem.addEventListener("click", () => {
      if (!isAIConfigured(this.settings)) {
        this.openSettings();
      } else {
        this.updateCreditStatusBar(true);
      }
    });
    this.updateCreditStatusBar();

    // Periodically update credit status (every 10 minutes)
    this.registerInterval(
      window.setInterval(() => {
        this.updateCreditStatusBar();
      }, 10 * 60 * 1000)
    );

    // Register Markdown post-processor for interactive merge button in egg notes (reading mode)
    registerMergeWidget(this);

    // Editor extension: merge button next to `# Unprocessed` in editing mode / Live Preview
    registerMergeEditorExtension(this);

    // Register UI button on _index.md (reading mode)
    registerIndexWidget(this);

    // Register UI button on _index.md (editing mode / Live Preview)
    registerIndexEditorExtension(this);

    console.log("[NutEgg] Plugin loaded");
  }

  /**
   * Open the NutEgg settings tab in Obsidian settings.
   */
  openSettings(): void {
    const setting = (this.app as any).setting;
    if (setting) {
      setting.open();
      setting.openTabById(this.manifest.id);
    }
  }

  private registerSubscriptionCommands(): void {
    // Off-state activation stays an advanced, generic command.
    for (const enabled of [true, false]) this.addCommand({
      id: enabled ? 'nutegg-enable-subscriptions' : 'nutegg-disable-subscriptions',
      name: t(enabled ? 'subscriptionEnableCommand' : 'subscriptionDisableCommand'),
      checkCallback: checking => {
        if (this.settings.subscriptionEnabled === enabled) return false;
        if (!checking) void (async () => {
          this.settings.subscriptionEnabled = enabled;
          if (!enabled) await this.subscriptions.cancelWork();
          await this.saveSettings();
          this.settingsTab?.display();
          new Notice(t(enabled ? 'subscriptionSetupInstructions' : 'subscriptionDisabledTitle'), 12000);
          if (enabled) this.openSettings();
        })();
        return true;
      },
    });
  }

  refreshSettingsTab(): void {
    this.settingsTab?.display();
  }

  /** Update the status bar with live balance or connection status. */
  async updateCreditStatusBar(showNotice = false): Promise<void> {
    if (!this.creditStatusBarItem) return;
    const version = ++this.creditStatusVersion;

    if (!isAIConfigured(this.settings)) {
      this.creditStatusBarItem.setText(t("setupAiKeyStatusBar"));
      this.creditStatusBarItem.setAttribute(
        "aria-label",
        t("setupAiKeyTooltip")
      );
      this.creditStatusBarItem.addClass("mod-warning");
      this.creditStatusBarItem.style.cursor = "pointer";
      if (showNotice) {
        new Notice(t("setupAiKeyTooltip"));
        this.openSettings();
      }
      return;
    }

    this.creditStatusBarItem.removeClass("mod-warning");
    try {
      const credit = await this.aiClient.checkCredit(this.settings);
      if (version !== this.creditStatusVersion) return;
      if (credit.subscriptionState === 'disabled') {
        this.creditStatusBarItem.setText(t('aiConnectionUnavailable'));
        this.creditStatusBarItem.setAttribute('aria-label', t('aiConnectionUnavailable'));
      } else if (credit.subscriptionState) {
        this.creditStatusBarItem.setText(`${credit.providerLabel} · ${t('subscriptionLabel')}${credit.usageRemaining ? ` · ${credit.usageRemaining}` : ''}`);
        this.creditStatusBarItem.setAttribute('aria-label', `${credit.providerLabel}: ${credit.statusText} · ${credit.usageRemaining || t('subscriptionUsageUnavailable')} · ${t('refresh')}`);
        if (credit.subscriptionState !== 'ready') this.creditStatusBarItem.addClass('mod-warning');
        if (showNotice) new Notice(`${credit.statusText} · ${credit.usageRemaining || t('subscriptionUsageUnavailable')}`);
      } else if (credit.hasBalance && credit.balanceFormatted) {
        this.creditStatusBarItem.setText(`🪙 ${credit.balanceFormatted}`);
        this.creditStatusBarItem.setAttribute(
          "aria-label",
          `NutEgg AI (${credit.providerLabel}): ${credit.statusText} (Click to refresh)`
        );
        if (showNotice) {
          new Notice(`[NutEgg] ${credit.providerLabel}: ${credit.statusText}`);
        }
      } else {
        const label =
          this.settings.aiProvider === "openrouter"
            ? "OpenRouter"
            : credit.providerLabel;
        this.creditStatusBarItem.setText(`🪙 ${label}`);
        this.creditStatusBarItem.setAttribute(
          "aria-label",
          `NutEgg AI: ${credit.statusText} (Click to refresh)`
        );
        if (showNotice) {
          new Notice(`[NutEgg] AI Provider: ${credit.statusText}`);
        }
      }
    } catch {
      if (version !== this.creditStatusVersion) return;
      this.creditStatusBarItem.setText("🪙 AI");
    }
  }

  /**
   * Redirect to GitHub issues prefilled with bug report template.
   */
  openBugReport(contentUrl: string = "", errorContext: string = ""): void {
    const version = this.manifest.version || "0.0.0";
    const osInfo =
      typeof process !== "undefined"
        ? `${process.platform} ${process.arch}`
        : navigator.userAgent || "Desktop";
    const observed = errorContext
      ? `Encountered error: ${errorContext}`
      : "<!-- Describe what actually happened (e.g. error message, unexpected output, failed merge, sync issue) -->";

    const body = [
      "### URL of the content",
      contentUrl || "[Enter the URL of the article, video, or webpage here if applicable]",
      "",
      "### Expected behavior",
      "<!-- A clear description of what you expected to happen -->",
      "",
      "",
      "### Observed behavior",
      observed,
      "",
      "",
      "### Environment",
      `- NutEgg Obsidian Plugin Version: v${version}`,
      `- OS / Platform: ${osInfo}`,
      `- AI Provider: ${this.settings.aiProvider}`,
      `- AI Model: ${this.settings.aiModel}`,
    ].join("\n");

    const title = errorContext ? `[Bug]: ${errorContext.slice(0, 60)}` : "[Bug]: ";
    const issueUrl = `https://github.com/staff-000/nutegg/issues/new?title=${encodeURIComponent(
      title
    )}&body=${encodeURIComponent(body)}`;
    window.open(issueUrl, "_blank");
  }

  async onunload(): Promise<void> {
    await this.subscriptions?.dispose();
    await this.server.stop();
    this.db.close();
    console.log("[NutEgg] Plugin unloaded");
  }

  async loadSettings(): Promise<void> {
    const data = await this.loadData() || {};
    this.settings = migrateAISettings(Object.assign({}, DEFAULT_SETTINGS, data));
  }

  async saveSettings(): Promise<void> {
    if (typeof this.saveData === 'function') await this.saveData(this.settings);
    this.settingsTab?.refreshAISettings();
    this.updateCreditStatusBar();
  }

  /**
   * Create the nutegg/ directory structure and boilerplate _index.md on first run.
   */
  private async initializeVault(): Promise<void> {
    try {
      await this.ensureFolder(this.vaultFolder);
      await this.ensureFolder(this.settings.rawFolder);
      await this.workflowManager.init();

      // Create boilerplate _index.md if it doesn't exist
      const indexPath = this.settings.indexFile;
      const existing = await this.app.vault.adapter.exists(indexPath);
      if (!existing) {
        await this.app.vault.create(indexPath, INDEX_TEMPLATE);
        console.log(`[NutEgg] Created ${indexPath}`);

        // Also create example egg files so the user can see the format
        for (const { path, content } of EXAMPLE_EGGS) {
          if (!(await this.app.vault.adapter.exists(path))) {
            try {
              await this.app.vault.create(path, content);
              console.log(`[NutEgg] Created ${path}`);
            } catch {
              // Ignore if already created concurrently
            }
          }
        }
      }
    } catch (err) {
      console.error("[NutEgg] Vault initialization error:", err);
    }
  }

  private async ensureFolder(folder: string): Promise<void> {
    const parts = folder.split("/");
    let currentPath = "";
    for (const part of parts) {
      if (!part) continue;
      currentPath += (currentPath ? "/" : "") + part;
      try {
        const exists = await this.app.vault.adapter.exists(currentPath);
        if (!exists) {
          await this.app.vault.createFolder(currentPath);
        }
      } catch {
        // Ignore "Folder already exists" errors
      }
    }
  }
}
