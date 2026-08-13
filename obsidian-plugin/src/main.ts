import { Notice, Plugin } from "obsidian";
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

export default class NutEggPlugin extends Plugin {
  declare settings: NutEggSettings;
  aiClient!: AIClient;
  server!: NutEggServer;
  aiProcessor!: AIProcessor;
  knowledgeBase!: KnowledgeBase;
  indexReader!: IndexReader;
  eggParser!: EggParser;

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

        const content = [
          "instruct:",
          "  * key questions: what new insights does this add?",
          "  * reject criteria: ignore content that repeats existing knowledge",
          "---",
          "",
          "# knowledge",
          "",
          "# ideas",
          "",
        ].join("\n");

        await this.app.vault.create(fileName, content);
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
      const content = [
        "# NutEgg Egg Index",
        "\tInstruct:",
        "\tAdd one line per egg file: * <path>: <description of what it covers>",
        "\tProcess only the lines beginning with *",
        "---",
        "* nutegg/investment.md: investment strategies, market analysis, portfolio management",
        "* nutegg/society.md: geopolitics, class dynamics, global conflict, political economy",
        "* nutegg/psychology.md: cognitive biases, mental models, behavioral psychology, decision making",
        "* nutegg/ai_ml.md: artificial intelligence, machine learning, LLMs, AGI, prompt engineering",
        "",
      ].join("\n");
      await this.app.vault.create(indexPath, content);
      console.log(`[NutEgg] Created ${indexPath}`);

      // Also create example egg files so the user can see the format
      const exampleEggs: Record<string, string> = {
        "nutegg/investment.md": [
          "Instruct:",
          "  * key questions: what new investment insight, strategy, or market perspective does this add?",
          "  * reject criteria: ignore basic price movements, generic financial news, or repeated advice",
          "---",
          "",
          "# knowledge",
          "",
          "# ideas",
          "",
        ].join("\n"),
        "nutegg/psychology.md": [
          "instruct:",
          "  * key questions: what cognitive bias, mental model, or psychological insight does this reveal?",
          "  * reject criteria: ignore generic self-help platitudes without specific mechanisms",
          "---",
          "",
          "# knowledge",
          "",
          "# ideas",
          "",
        ].join("\n"),
         "nutegg/society.md": [
          "instruct:",
          "  * key questions: what cognitive bias, mental model, or psychological insight does this reveal?",
          "  * reject criteria: ignore generic self-help platitudes without specific mechanisms",
          "---",
          "",
          "# knowledge",
          "",
          "# ideas",
          "",
        ].join("\n"),
         "nutegg/ai_ml.md": [
          "instruct:",
          "  * key questions: what cognitive bias, mental model, or psychological insight does this reveal?",
          "  * reject criteria: ignore generic self-help platitudes without specific mechanisms",
          "---",
          "",
          "# knowledge",
          "",
          "# ideas",
          "",
        ].join("\n"),
      };

      for (const [path, eggContent] of Object.entries(exampleEggs)) {
        if (!(await this.app.vault.adapter.exists(path))) {
          await this.app.vault.create(path, eggContent);
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
    const { SuggestModal } = await import("obsidian");

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
