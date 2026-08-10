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
import { TopicParser } from "./topic-parser";

export default class NutEggPlugin extends Plugin {
  declare settings: NutEggSettings;
  aiClient!: AIClient;
  server!: NutEggServer;
  aiProcessor!: AIProcessor;
  knowledgeBase!: KnowledgeBase;
  indexReader!: IndexReader;
  topicParser!: TopicParser;

  async onload(): Promise<void> {
    await this.loadSettings();

    // Initialize AI client (shared across subsystems)
    this.aiClient = new AIClient(this.settings);

    // Initialize subsystems
    this.aiProcessor = new AIProcessor(this);
    this.knowledgeBase = new KnowledgeBase(this);
    this.indexReader = new IndexReader(this);
    this.topicParser = new TopicParser(this);

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
      } else {
        // Create default nutegg/_index.md
        // Also ensure nutegg/ folder exists
        await this.ensureFolder("nutegg");

        const defaultIndex = [
          "# NutEgg Topic Index",
          "# Add your topic mappings below.",
          "# Format: path/to/topic-file.md: description of what topics it covers",
          "# Topic files go under nutegg/ alongside _index.md.",
          "# Examples:",
          "#   nutegg/invest_strategy.md: investment strategies, market analysis, portfolio management",
          "#   nutegg/psychology.md: cognitive biases, mental models, behavioral psychology",
          "#   nutegg/ai_ml.md: artificial intelligence, machine learning, LLMs, AGI",
          "",
        ].join("\n");
        await this.app.vault.create(indexPath, defaultIndex);
        new Notice(`NutEgg: Created ${indexPath}. Add your topic mappings there.`);
      }
    });

    // Command: Create sample topic file
    this.addCommand({
      id: "nutegg-new-topic",
      name: "Create a new topic file",
      callback: async () => {
        // Ask for topic name via a simple prompt
        const topicName = await this.promptForTopicName();
        if (!topicName) return;

        const fileName = `nutegg/${topicName}.md`;
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

  private async ensureFolder(folder: string): Promise<void> {
    const parts = folder.split("/");
    let currentPath = "";
    for (const part of parts) {
      currentPath += (currentPath ? "/" : "") + part;
      const exists = this.app.vault.getAbstractFileByPath(currentPath);
      if (!exists) {
        await this.app.vault.createFolder(currentPath);
      }
    }
  }

  /**
   * Simple prompt modal for getting a topic name.
   */
  private async promptForTopicName(): Promise<string | null> {
    const { SuggestModal } = await import("obsidian");

    return new Promise((resolve) => {
      const modal = new (class extends SuggestModal<{ text: string }> {
        constructor(app: any) {
          super(app);
          this.setPlaceholder("Enter topic name (e.g., invest, ai, design)...");
        }

        getSuggestions(query: string): { text: string }[] {
          if (!query) return [];
          return [{ text: query.toLowerCase().replace(/\s+/g, "-") }];
        }

        renderSuggestion(item: { text: string }, el: HTMLElement): void {
          el.createEl("div", {
            text: `Create topic file: ${item.text}.md`,
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
