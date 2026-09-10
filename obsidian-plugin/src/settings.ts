import { App, PluginSettingTab, Setting } from "obsidian";
import type NutEggPlugin from "./main";
import {
  type AIProviderId,
  type AISource,
  PROVIDER_CATALOG,
  findOpenRouterFamily,
} from "./ai-client";

export type LocalApiType = "openai" | "ollama";

export interface NutEggSettings {
  /** Show advanced AI/server configuration */
  developerMode: boolean;
  /** Which model family to use */
  aiProvider: AIProviderId;
  /** Legacy API source (kept optional for backwards compatibility with saved data) */
  aiSource?: AISource;
  /** API key */
  aiApiKey: string;
  /** Model name (selected from provider's model list, optional for local) */
  aiModel: string;
  /** Model family / vendor (used when aiProvider === "openrouter") */
  aiModelFamily?: string;
  /** Local LLM endpoint URL (used when aiProvider === "local") */
  localEndpoint: string;
  /** Local LLM API format: "openai" (LM Studio, llama.cpp, Ollama /v1) or "ollama" (native /api/chat) */
  localApiType: LocalApiType;
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
  /** General chunk window size in characters for splitting long content (default: 30000) */
  chunkWindowChars: number;
  /** Section grid interval in seconds for videos without chapters (default: 300) */
  sectionGridSeconds: number;
}

export const DEFAULT_SETTINGS: NutEggSettings = {
  developerMode: false,
  aiProvider: "anthropic",
  aiApiKey: "",
  aiModel: "claude-sonnet-5",
  localEndpoint: "http://127.0.0.1:11434/v1/chat/completions",
  localApiType: "openai",
  serverPort: 27123,
  rawFolder: "nutegg/_raw",
  indexFile: "nutegg/_index.md",
  workflowFolder: "nutegg/_workflow",
  workflowHashes: {},
  chunkWindowChars: 30000,
  sectionGridSeconds: 300,
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
    const isOpenRouter = settings.aiProvider === "openrouter";

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
    const isLocal = settings.aiProvider === "local";

    // ==========================================
    // AI Model Configuration
    // ==========================================
    containerEl.createEl("h3", { text: isLocal ? "Local LLM Configuration" : "AI Model Configuration" });

    // 1. AI Provider
    new Setting(containerEl)
      .setName("1. AI Provider")
      .setDesc("Choose a local runner (Ollama, LM Studio), OpenRouter, or cloud AI provider")
      .addDropdown((dropdown) => {
        for (const [id, info] of Object.entries(PROVIDER_CATALOG)) {
          dropdown.addOption(id, info.label);
        }
        dropdown.setValue(settings.aiProvider);
        dropdown.onChange(async (value) => {
          settings.aiProvider = value as AIProviderId;
          if (settings.aiProvider === "local") {
            settings.aiModel = "";
            settings.aiModelFamily = undefined;
          } else if (settings.aiProvider === "openrouter") {
            const families = PROVIDER_CATALOG.openrouter.families || [];
            const firstFamily = families[0];
            settings.aiModelFamily = firstFamily?.id || "openai";
            settings.aiModel = firstFamily?.defaultModel || "openai/gpt-6-astra";
          } else {
            const newProvider = PROVIDER_CATALOG[settings.aiProvider];
            settings.aiModelFamily = undefined;
            settings.aiModel = newProvider?.defaultModel || newProvider?.models?.[0] || "";
          }
          await this.plugin.saveSettings();
          this.display();
        });
        return dropdown;
      });

    if (isLocal) {
      // Local LLM API Type
      new Setting(containerEl)
        .setName("API Type")
        .setDesc("Protocol format used by your local runner")
        .addDropdown((dropdown) => {
          dropdown.addOption("openai", "OpenAI-compatible (LM Studio, llama.cpp, vLLM, Ollama /v1)");
          dropdown.addOption("ollama", "Ollama Native (/api/chat)");
          dropdown.setValue(settings.localApiType || "openai");
          dropdown.onChange(async (value) => {
            settings.localApiType = value as LocalApiType;
            if (settings.localApiType === "ollama") {
              if (!settings.localEndpoint || settings.localEndpoint.includes("/v1/chat/completions")) {
                settings.localEndpoint = "http://127.0.0.1:11434/api/chat";
              }
            } else {
              if (!settings.localEndpoint || settings.localEndpoint.includes("/api/chat")) {
                settings.localEndpoint = "http://127.0.0.1:11434/v1/chat/completions";
              }
            }
            await this.plugin.saveSettings();
            this.display();
          });
          return dropdown;
        });

      // Local Server Endpoint
      new Setting(containerEl)
        .setName("Local Server Endpoint")
        .setDesc(
          settings.localApiType === "ollama"
            ? "Ollama native chat URL (default: http://127.0.0.1:11434/api/chat)"
            : "OpenAI-compatible chat completions URL for your local runner"
        )
        .addText((text) => {
          text
            .setPlaceholder(
              settings.localApiType === "ollama"
                ? "http://127.0.0.1:11434/api/chat"
                : "http://127.0.0.1:11434/v1/chat/completions"
            )
            .setValue(
              settings.localEndpoint ||
                (settings.localApiType === "ollama"
                  ? "http://127.0.0.1:11434/api/chat"
                  : "http://127.0.0.1:11434/v1/chat/completions")
            )
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

      const presets =
        settings.localApiType === "ollama"
          ? [
              { label: "Ollama Native (11434)", url: "http://127.0.0.1:11434/api/chat" },
            ]
          : [
              { label: "Ollama /v1 (11434)", url: "http://127.0.0.1:11434/v1/chat/completions" },
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

      // API Key (Optional)
      new Setting(containerEl)
        .setName("API Key (Optional)")
        .setDesc("Optional for local LLMs. Leave empty if your local server does not require authentication.")
        .addText((text) => {
          text
            .setPlaceholder("Optional for local LLMs")
            .setValue(settings.aiApiKey)
            .onChange(async (value) => {
              settings.aiApiKey = value.trim();
              await this.plugin.saveSettings();
            });
          return text;
        });
    } else if (isOpenRouter) {
      // ==========================================
      // OpenRouter (Multi-Provider)
      // ==========================================
      const families = PROVIDER_CATALOG.openrouter.families || [];
      let currentFamily = families.find((f) => f.id === settings.aiModelFamily);
      if (!currentFamily) {
        currentFamily = findOpenRouterFamily(settings.aiModel) || families[0];
        if (currentFamily) {
          settings.aiModelFamily = currentFamily.id;
        }
      }

      // 2. Model Family (Vendor filter on OpenRouter)
      new Setting(containerEl)
        .setName("2. Model Family")
        .setDesc("Choose model vendor or architecture group on OpenRouter")
        .addDropdown((dropdown) => {
          for (const fam of families) {
            dropdown.addOption(fam.id, fam.label);
          }
          if (currentFamily) {
            dropdown.setValue(currentFamily.id);
          }
          dropdown.onChange(async (value) => {
            settings.aiModelFamily = value;
            const selectedFam = families.find((f) => f.id === value);
            if (selectedFam) {
              settings.aiModel = selectedFam.defaultModel;
            }
            await this.plugin.saveSettings();
            this.display();
          });
          return dropdown;
        });

      // 3. Model Version
      const versionSetting = new Setting(containerEl)
        .setName("3. Model Version")
        .setDesc(`Sent to OpenRouter as "${settings.aiModel}"`);

      const familyModels = currentFamily?.models || [];
      if (familyModels.length > 0) {
        versionSetting.addDropdown((dropdown) => {
          for (const model of familyModels) {
            dropdown.addOption(model, model);
          }
          if (!familyModels.includes(settings.aiModel)) {
            dropdown.addOption(settings.aiModel, `${settings.aiModel} (custom)`);
          }
          dropdown.setValue(settings.aiModel);
          dropdown.onChange(async (value) => {
            settings.aiModel = value;
            await this.plugin.saveSettings();
            this.display();
          });
          return dropdown;
        });
      }

      versionSetting.addText((text) => {
        text
          .setPlaceholder(currentFamily?.defaultModel || "Custom model tag (e.g. vendor/model-name)")
          .setValue(settings.aiModel)
          .onChange(async (value) => {
            const trimmed = value.trim();
            if (trimmed) {
              settings.aiModel = trimmed;
              await this.plugin.saveSettings();
            }
          });
        return text;
      });

      // API Key
      new Setting(containerEl)
        .setName("API Key")
        .setDesc("Your OpenRouter API key (openrouter.ai/keys)")
        .addText((text) => {
          text
            .setPlaceholder("sk-or-...")
            .setValue(settings.aiApiKey)
            .onChange(async (value) => {
              settings.aiApiKey = value.trim();
              await this.plugin.saveSettings();
            });
          return text;
        });
    } else {
      // ==========================================
      // Direct Cloud Providers (Anthropic, OpenAI, Gemini, DeepSeek, Kimi, Zhipu, Qwen)
      // Direct Model selection without artificial family middleman
      // ==========================================
      const providerModels = provider.models || [];
      const versionSetting = new Setting(containerEl)
        .setName("2. Model")
        .setDesc(`Model to use for analysis (${provider.label})`);

      if (providerModels.length > 0) {
        versionSetting.addDropdown((dropdown) => {
          for (const model of providerModels) {
            dropdown.addOption(model, model);
          }
          if (!providerModels.includes(settings.aiModel)) {
            dropdown.addOption(settings.aiModel, `${settings.aiModel} (custom)`);
          }
          dropdown.setValue(settings.aiModel);
          dropdown.onChange(async (value) => {
            settings.aiModel = value;
            await this.plugin.saveSettings();
            this.display();
          });
          return dropdown;
        });
      }

      versionSetting.addText((text) => {
        text
          .setPlaceholder(provider.defaultModel || "Custom model tag")
          .setValue(settings.aiModel)
          .onChange(async (value) => {
            const trimmed = value.trim();
            if (trimmed) {
              settings.aiModel = trimmed;
              await this.plugin.saveSettings();
            }
          });
        return text;
      });

      // API Key
      new Setting(containerEl)
        .setName("API Key")
        .setDesc(`Your ${provider.label} API key`)
        .addText((text) => {
          text
            .setPlaceholder(provider.keyPlaceholder)
            .setValue(settings.aiApiKey)
            .onChange(async (value) => {
              settings.aiApiKey = value.trim();
              await this.plugin.saveSettings();
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
    // Processing & Chunking
    // ==========================================
    containerEl.createEl("h3", { text: "Processing & Chunking" });

    new Setting(containerEl)
      .setName("General chunk window size")
      .setDesc(
        "Maximum character length per chunk (~30,000 chars ≈ 8,000 tokens). Long content exceeding this threshold is split into parts and processed with multi-stage map-reduce aggregation."
      )
      .addText((text) =>
        text
          .setPlaceholder("30000")
          .setValue(String(settings.chunkWindowChars || 30000))
          .onChange(async (value) => {
            const num = parseInt(value, 10);
            if (!isNaN(num) && num >= 1000) {
              settings.chunkWindowChars = num;
              await this.plugin.saveSettings();
            }
          })
      );

    new Setting(containerEl)
      .setName("Section grid interval")
      .setDesc(
        "Time interval in seconds (default: 300s / 5 minutes) used to generate section lattice points and chapter maps for videos lacking native chapter markers."
      )
      .addText((text) =>
        text
          .setPlaceholder("300")
          .setValue(String(settings.sectionGridSeconds || 300))
          .onChange(async (value) => {
            const num = parseInt(value, 10);
            if (!isNaN(num) && num >= 10) {
              settings.sectionGridSeconds = num;
              await this.plugin.saveSettings();
            }
          })
      );

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
