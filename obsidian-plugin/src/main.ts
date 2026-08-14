import { Notice, Plugin, SuggestModal } from "obsidian";
import {
  NutEggSettings,
  DEFAULT_SETTINGS,
  NutEggSettingTab,
} from "./settings";
import { AIClient } from "./ai-client";
import { NutEggServer } from "./server";
import { AIProcessor } from "./ai-processor";
import { KnowledgeBase } from "./knowledge-base";
import { IndexReader } from "./index-reader";
import { EggParser } from "./egg-parser";
import { NutEggDatabase } from "./db";
import { INDEX_TEMPLATE, EGG_TEMPLATE, EXAMPLE_EGGS } from "./defaults";

export default class NutEggPlugin extends Plugin {
  declare settings: NutEggSettings;
  aiClient!: AIClient;
  server!: NutEggServer;
  aiProcessor!: AIProcessor;
  knowledgeBase!: KnowledgeBase;
  indexReader!: IndexReader;
  eggParser!: EggParser;
  db!: NutEggDatabase;

  async onload(): Promise<void> {
    await this.loadSettings();
    // Ensure vault structure exists on first run
    await this.initializeVault();

    // Initialize AI client (shared across subsystems)
    this.aiClient = new AIClient(this.settings);

    // Initialize subsystems
    this.aiProcessor = new AIProcessor(this);
    this.knowledgeBase = new KnowledgeBase(this);
    this.indexReader = new IndexReader(this);
    this.eggParser = new EggParser(this);

    // SQLite database (dedup cache, replay, RAG foundation). Never throws.
    this.db = new NutEggDatabase(this);
    await this.db.init();

    // Start local HTTP server
    this.server = new NutEggServer(this, this.settings.serverPort);
    try {
      await this.server.start();
      new Notice(`NutEgg server started on port ${this.settings.serverPort}`);
    } catch (err) {
      console.error("[NutEgg] Failed to start server:", err);
      new Notice("NutEgg: Failed to start server. Check console for details.");
    }

    // Add settings tab
    this.addSettingTab(new NutEggSettingTab(this.app, this));

    // Ribbon icon — opens the index file for editing
    this.addRibbonIcon("egg", "NutEgg", async () => {
      const indexPath = this.settings.indexFile;
      const file = this.app.vault.getAbstractFileByPath(indexPath);
      if (file) {
        const leaf = this.app.workspace.getLeaf(false);
        await leaf.openFile(file as any);
      }
    });

    // Command: Create a new egg file
    this.addCommand({
      id: "nutegg-new-egg",
      name: "Create a new egg file",
      callback: async () => {
        // Ask for egg name via a simple prompt
        const eggName = await this.promptForEggName();
        if (!eggName) return;

        const fileName = `nutegg/${eggName}.md`;
        await this.ensureFolder("nutegg");
        const existingFile = this.app.vault.getAbstractFileByPath(fileName);

        if (existingFile) {
          const leaf = this.app.workspace.getLeaf(false);
          await leaf.openFile(existingFile as any);
          return;
        }

        await this.app.vault.create(fileName, EGG_TEMPLATE);
        new Notice(`NutEgg: Created ${fileName}`);

        // Also remind to add to _index.md
        new Notice(
          `NutEgg: Add "${fileName}: description" to ${this.settings.indexFile}`
        );
      },
    });

    // Command: Open index file
    this.addCommand({
      id: "nutegg-open-index",
      name: "Open index file",
      callback: async () => {
        const indexPath = this.settings.indexFile;
        const file = this.app.vault.getAbstractFileByPath(indexPath);
        if (file) {
          const leaf = this.app.workspace.getLeaf(false);
          await leaf.openFile(file as any);
        } else {
          new Notice(`NutEgg: ${indexPath} not found. Click the egg icon to create it.`);
        }
      },
    });

    console.log("[NutEgg] Plugin loaded");
  }

  async onunload(): Promise<void> {
    await this.server.stop();
    this.db.close();
    console.log("[NutEgg] Plugin unloaded");
  }

  async loadSettings(): Promise<void> {
    const data = await this.loadData() || {};
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  /**
   * Create the nutegg/ directory structure and boilerplate _index.md on first run.
   */
  private async initializeVault(): Promise<void> {
    await this.ensureFolder("nutegg");
    await this.ensureFolder(this.settings.rawFolder);

    // Create boilerplate _index.md if it doesn't exist
    const indexPath = this.settings.indexFile;
    const existing = await this.app.vault.adapter.exists(indexPath);
    if (!existing) {
      await this.app.vault.create(indexPath, INDEX_TEMPLATE);
      console.log(`[NutEgg] Created ${indexPath}`);

      // Also create example egg files so the user can see the format
      for (const { path, content } of EXAMPLE_EGGS) {
        if (!(await this.app.vault.adapter.exists(path))) {
          await this.app.vault.create(path, content);
          console.log(`[NutEgg] Created ${path}`);
        }
      }
    }
  }

  private async ensureFolder(folder: string): Promise<void> {
    const parts = folder.split("/");
    let currentPath = "";
    for (const part of parts) {
      currentPath += (currentPath ? "/" : "") + part;
      const exists = await this.app.vault.adapter.exists(currentPath);
      if (!exists) {
        await this.app.vault.createFolder(currentPath);
      }
    }
  }

  /**
   * Simple prompt modal for getting an egg name.
   */
  private async promptForEggName(): Promise<string | null> {
    return new Promise((resolve) => {
      const modal = new (class extends SuggestModal<{ text: string }> {
        constructor(app: any) {
          super(app);
          this.setPlaceholder("Enter egg name (e.g., invest_strategy, psychology, ai_ml)...");
        }

        getSuggestions(query: string): { text: string }[] {
          if (!query) return [];
          return [{ text: query.toLowerCase().replace(/\s+/g, "-") }];
        }

        renderSuggestion(item: { text: string }, el: HTMLElement): void {
          el.createEl("div", {
            text: `Create egg file: ${item.text}.md`,
          });
        }

        onChooseSuggestion(item: { text: string }): void {
          resolve(item.text);
        }
      })(this.app);

      modal.onClose = () => resolve(null);
      modal.open();
    });
  }
}
