import { App, PluginSettingTab, Setting } from "obsidian";
import type NutEggPlugin from "./main";
import {
  type AIProviderId,
  type AISource,
  PROVIDER_CATALOG,
} from "./ai-client";

export interface NutEggSettings {
  /** Show advanced AI/server configuration */
  developerMode: boolean;
  /** Which model family to use */
  aiProvider: AIProviderId;
  /** Official API or OpenRouter */
  aiSource: AISource;
  /** API key */
  aiApiKey: string;
  /** Model name (selected from provider's model list) */
  aiModel: string;
  /** Local LLM OpenAI-compatible endpoint URL (used when aiProvider === "local") */
  localEndpoint: string;
  /** Local HTTP server port */
  serverPort: number;
  /** Folder for saved raw content */
  rawFolder: string;
  /** File that maps eggs to markdown files */
  indexFile: string;
  /** Folder for AI workflow engine prompt definitions */
  workflowFolder: string;
  /** Hashes of default workflow files when last synced (for update conflict detection) */
  workflowHashes: Record<string, string>;
}

export const DEFAULT_SETTINGS: NutEggSettings = {
  developerMode: false,
  aiProvider: "anthropic",
  aiSource: "official",
  aiApiKey: "",
  aiModel: "claude-sonnet-5",
  localEndpoint: "http://127.0.0.1:11434/v1/chat/completions",
  serverPort: 27123,
  rawFolder: "nutegg/_raw",
  indexFile: "nutegg/_index.md",
  workflowFolder: "nutegg/_workflow",
  workflowHashes: {},
};

export class NutEggSettingTab extends PluginSettingTab {
  plugin: NutEggPlugin;

  constructor(app: App, plugin: NutEggPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    const settings = this.plugin.settings;
    const provider = PROVIDER_CATALOG[settings.aiProvider];
    const isOpenRouter = settings.aiSource === "openrouter";

    containerEl.empty();
    containerEl.createEl("h2", { text: "NutEgg Settings" });

    // Companion Chrome Extension Card
    new Setting(containerEl)
      .setName("Chrome Extension Companion")
      .setDesc("Capture and analyze articles, YouTube videos, and tweets directly from your browser into Obsidian.")
      .addButton((btn) =>
        btn
          .setButtonText("Get Chrome Extension ↗")
          .setCta()
          .onClick(() => {
            window.open(
              "https://chromewebstore.google.com/detail/nutegg/bmdmdiicembobejibggoeiahaonphcol",
              "_blank"
            );
          })
      );

    // ==========================================
    // Vault Paths (always visible)
    // ==========================================
    containerEl.createEl("h3", { text: "Vault Paths" });

    new Setting(containerEl)
      .setName("Raw Content Folder")
      .setDesc("Folder for saved raw content")
      .addText((text) =>
        text
          .setPlaceholder("nutegg/_raw")
          .setValue(settings.rawFolder)
          .onChange(async (value) => {
            settings.rawFolder = value.trim() || "nutegg/_raw";
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Index File")
      .setDesc("File that maps eggs to their markdown files")
      .addText((text) =>
        text
          .setPlaceholder("nutegg/_index.md")
          .setValue(settings.indexFile)
          .onChange(async (value) => {
            settings.indexFile = value.trim() || "nutegg/_index.md";
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Workflow Engine Folder")
      .setDesc("Folder where AI prompts, schemas, and pipeline rules are stored as editable markdown files")
      .addText((text) =>
        text
          .setPlaceholder("nutegg/_workflow")
          .setValue(settings.workflowFolder)
          .onChange(async (value) => {
            settings.workflowFolder = value.trim() || "nutegg/_workflow";
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Use Default Workflow Prompts")
      .setDesc(
        "Moves all current files in nutegg/_workflow to a timestamped backup folder under _backup/ and restores clean built-in prompt defaults."
      )
      .addButton((btn) =>
        btn
          .setButtonText("Use Defaults")
          .setWarning()
          .onClick(async () => {
            await this.plugin.workflowManager.resetToDefaults();
          })
      );

     // ==========================================
    // Developer Mode toggle
    // ==========================================
    new Setting(containerEl)
      .setName("Developer mode")
      .setDesc(
        settings.developerMode
          ? "Advanced settings are visible below"
          : "Show advanced settings (AI provider, API key, server port)"
      )
      .addToggle((toggle) => {
        toggle.setValue(settings.developerMode);
        toggle.onChange(async (value) => {
          settings.developerMode = value;
          await this.plugin.saveSettings();
          this.display(); // refresh to show/hide sections
        });
      });

    // Advanced sections — only visible when developer mode is on
    if (settings.developerMode) {
      this.displayAdvancedSettings(containerEl, settings, provider, isOpenRouter);
    }
  }

  private displayAdvancedSettings(
    containerEl: HTMLElement,
    settings: NutEggSettings,
    provider: (typeof PROVIDER_CATALOG)[AIProviderId],
    isOpenRouter: boolean
  ): void {
    // ==========================================
    // AI Provider
    // ==========================================
    containerEl.createEl("h3", { text: "AI Provider" });

    const isLocal = settings.aiProvider === "local";

    // Provider dropdown
    new Setting(containerEl)
      .setName("Model family")
      .setDesc("Which provider or model family to use")
      .addDropdown((dropdown) => {
        for (const [id, info] of Object.entries(PROVIDER_CATALOG)) {
          dropdown.addOption(id, info.label);
        }
        dropdown.setValue(settings.aiProvider);
        dropdown.onChange(async (value) => {
          settings.aiProvider = value as AIProviderId;
          const newProvider = PROVIDER_CATALOG[value as AIProviderId];
          settings.aiModel = newProvider.models[0];
          await this.plugin.saveSettings();
          this.display();
        });
        return dropdown;
      });

    // Local Server Endpoint & Presets (only shown when Local LLM is selected)
    if (isLocal) {
      new Setting(containerEl)
        .setName("Local Server Endpoint")
        .setDesc(
          "OpenAI-compatible chat completions URL for your local runner (Ollama, LM Studio, llama.cpp, etc.)"
        )
        .addText((text) => {
          text
            .setPlaceholder("http://127.0.0.1:11434/v1/chat/completions")
            .setValue(settings.localEndpoint || "http://127.0.0.1:11434/v1/chat/completions")
            .onChange(async (value) => {
              settings.localEndpoint = value.trim();
              await this.plugin.saveSettings();
            });
          return text;
        });

      // Quick preset buttons for local endpoints
      const presetContainer = containerEl.createDiv({
        cls: "setting-item",
        attr: { style: "padding-top: 0; margin-top: -10px; border-top: none;" },
      });
      const presetInfo = presetContainer.createDiv({
        cls: "setting-item-description",
        text: "Presets: ",
      });
      presetInfo.style.fontSize = "0.85em";
      presetInfo.style.color = "var(--text-muted)";

      const presets = [
        { label: "Ollama (11434)", url: "http://127.0.0.1:11434/v1/chat/completions" },
        { label: "LM Studio (1234)", url: "http://127.0.0.1:1234/v1/chat/completions" },
        { label: "llama.cpp / vLLM (8080)", url: "http://127.0.0.1:8080/v1/chat/completions" },
      ];

      for (const preset of presets) {
        const btn = presetInfo.createEl("button", {
          text: preset.label,
        });
        btn.style.marginLeft = "6px";
        btn.style.padding = "2px 8px";
        btn.style.fontSize = "0.85em";
        btn.style.cursor = "pointer";
        btn.addEventListener("click", async (e) => {
          e.preventDefault();
          settings.localEndpoint = preset.url;
          await this.plugin.saveSettings();
          this.display();
        });
      }
    }

    // Source toggle (only for cloud providers)
    if (!isLocal) {
      new Setting(containerEl)
        .setName("API source")
        .setDesc(
          isOpenRouter
            ? "Using OpenRouter as proxy — one API key for all providers"
            : `Using ${provider.label} official API directly`
        )
        .addDropdown((dropdown) => {
          dropdown.addOption("official", `${provider.label} Official API`);
          dropdown.addOption("openrouter", "OpenRouter");
          dropdown.setValue(settings.aiSource);
          dropdown.onChange(async (value) => {
            settings.aiSource = value as AISource;
            await this.plugin.saveSettings();
            this.display();
          });
          return dropdown;
        });
    }

    // API Key
    new Setting(containerEl)
      .setName(isLocal ? "API Key (Optional)" : "API Key")
      .setDesc(
        isLocal
          ? "Optional for local LLMs. Leave empty if your local server does not require authentication."
          : isOpenRouter
          ? "Your OpenRouter API key (openrouter.ai/keys)"
          : `Your ${provider.label} API key`
      )
      .addText((text) => {
        text
          .setPlaceholder(
            isLocal
              ? "Optional for local LLMs"
              : isOpenRouter
              ? "sk-or-..."
              : provider.keyPlaceholder
          )
          .setValue(settings.aiApiKey)
          .onChange(async (value) => {
            settings.aiApiKey = value.trim();
            await this.plugin.saveSettings();
          });
        return text;
      });

    // Model dropdown & custom model input
    const modelOptions = provider.models;
    const modelSetting = new Setting(containerEl)
      .setName("Model")
      .setDesc(
        isLocal
          ? "Model name (must match a model downloaded in your local server)"
          : isOpenRouter
          ? `Sent as "${provider.openrouterPrefix}${settings.aiModel}" via OpenRouter`
          : "Model to use for analysis"
      )
      .addDropdown((dropdown) => {
        for (const model of modelOptions) {
          dropdown.addOption(model, model);
        }
        if (!modelOptions.includes(settings.aiModel)) {
          dropdown.addOption(settings.aiModel, settings.aiModel + " (custom)");
        }
        dropdown.setValue(settings.aiModel);
        dropdown.onChange(async (value) => {
          settings.aiModel = value;
          await this.plugin.saveSettings();
          if (isLocal) this.display();
        });
        return dropdown;
      });

    if (isLocal) {
      modelSetting.addText((text) => {
        text
          .setPlaceholder("Custom model name (e.g. qwen2.5:7b)")
          .setValue(settings.aiModel)
          .onChange(async (value) => {
            if (value.trim()) {
              settings.aiModel = value.trim();
              await this.plugin.saveSettings();
            }
          });
        return text;
      });
    }

    // Credit & Balance / Connection Monitor Setting
    const creditSetting = new Setting(containerEl)
      .setName(isLocal ? "Local LLM connection status" : "AI credit & balance")
      .setDesc(isLocal ? "Checking local server connection..." : "Checking credit balance with provider...")
      .addButton((btn) => {
        btn
          .setButtonText("Refresh")
          .setCta()
          .onClick(async () => {
            btn.setDisabled(true);
            btn.setButtonText("Checking...");
            await updateCreditDisplay();
            btn.setDisabled(false);
            btn.setButtonText("Refresh");
          });
        return btn;
      });

    const updateCreditDisplay = async () => {
      try {
        const credit = await this.plugin.aiClient.checkCredit(settings);
        if (credit.hasBalance && credit.balanceFormatted) {
          creditSetting.setDesc(
            `💰 Remaining Balance: ${credit.balanceFormatted} (${credit.statusText})`
          );
        } else {
          creditSetting.setDesc(
            `ℹ️ Provider: ${credit.providerLabel} — ${credit.statusText}`
          );
        }
      } catch (err) {
        creditSetting.setDesc(`⚠️ Failed to check credit: ${String(err)}`);
      }
    };

    updateCreditDisplay();

    // ==========================================
    // Server
    // ==========================================
    containerEl.createEl("h3", { text: "Server" });

    new Setting(containerEl)
      .setName("Server Port")
      .setDesc("Port for the local HTTP server connecting with Chrome Extension (requires restart)")
      .addText((text) =>
        text
          .setPlaceholder("27123")
          .setValue(String(settings.serverPort))
          .onChange(async (value) => {
            const port = parseInt(value, 10);
            if (!isNaN(port) && port > 0 && port < 65536) {
              settings.serverPort = port;
              await this.plugin.saveSettings();
            }
          })
      );

    // ==========================================
    // Links & Resources
    // ==========================================
    containerEl.createEl("h3", { text: "Links & Resources" });

    new Setting(containerEl)
      .setName("NutEgg on Chrome Web Store")
      .setDesc("Install or update the NutEgg companion extension for Google Chrome.")
      .addButton((btn) =>
        btn
          .setButtonText("Open Chrome Web Store ↗")
          .onClick(() => {
            window.open(
              "https://chromewebstore.google.com/detail/nutegg/bmdmdiicembobejibggoeiahaonphcol",
              "_blank"
            );
          })
      );

    new Setting(containerEl)
      .setName("NutEgg on Obsidian Community Plugins")
      .setDesc("View NutEgg in the Obsidian Community Plugins directory.")
      .addButton((btn) =>
        btn
          .setButtonText("Open Obsidian Directory ↗")
          .onClick(() => {
            window.open("https://community.obsidian.md/plugins/nutegg", "_blank");
          })
      );
  }
}
