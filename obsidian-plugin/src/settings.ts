import { App, PluginSettingTab, Setting } from "obsidian";
import type NutEggPlugin from "./main";
import {
  type AIProviderId,
  type AISource,
  PROVIDER_CATALOG,
  findOpenRouterFamily,
} from "./ai-client";
import { t } from "./i18n";

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
  /** Max completion tokens for Stage 1 content analysis and chapter map (default: 2500) */
  contentAnalysisMaxTokens: number;
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
  contentAnalysisMaxTokens: 16384,
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
    containerEl.createEl("h2", { text: t("settingsTitle") });

    // Companion Chrome Extension Card
    new Setting(containerEl)
      .setName(t("chromeCompanionName"))
      .setDesc(t("chromeCompanionDesc"))
      .addButton((btn) =>
        btn
          .setButtonText(t("getChromeExtension"))
          .setCta()
          .onClick(() => {
            window.open(
              "https://chromewebstore.google.com/detail/nutegg/bmdmdiicembobejibggoeiahaonphcol",
              "_blank"
            );
          })
      );

    // Bug Report & Feedback Card
    new Setting(containerEl)
      .setName(t("reportBugName"))
      .setDesc(t("reportBugDesc"))
      .addButton((btn) =>
        btn
          .setButtonText(t("reportBugBtn"))
          .onClick(() => {
            this.plugin.openBugReport();
          })
      );

    // ==========================================
    // Vault Paths (always visible)
    // ==========================================
    containerEl.createEl("h3", { text: t("vaultPathsHeader") });

    new Setting(containerEl)
      .setName(t("rawFolder"))
      .setDesc(t("rawFolderDesc"))
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
      .setName(t("indexFile"))
      .setDesc(t("indexFileDesc"))
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
      .setName(t("workflowFolder"))
      .setDesc(t("workflowFolderDesc"))
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
      .setName(t("useDefaultWorkflows"))
      .setDesc(t("useDefaultWorkflowsDesc"))
      .addButton((btn) =>
        btn
          .setButtonText(t("useDefaultsBtn"))
          .setWarning()
          .onClick(async () => {
            await this.plugin.workflowManager.resetToDefaults();
          })
      );

    // ==========================================
    // Developer Mode toggle
    // ==========================================
    new Setting(containerEl)
      .setName(t("devMode"))
      .setDesc(
        settings.developerMode
          ? t("devModeOn")
          : t("devModeOff")
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
    containerEl.createEl("h3", { text: isLocal ? t("localModelConfig") : t("aiModelConfig") });

    // 1. AI Provider
    new Setting(containerEl)
      .setName(t("aiProvider"))
      .setDesc(t("aiProviderDesc"))
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
        .setName(t("localApiType"))
        .setDesc(t("localApiTypeDesc"))
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
        .setName(t("localEndpoint"))
        .setDesc(
          settings.localApiType === "ollama"
            ? t("localEndpointOllamaDesc")
            : t("localEndpointOpenAiDesc")
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
        text: t("localPresets"),
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
        .setName(t("aiApiKey"))
        .setDesc(t("localApiKeyDesc"))
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
        .setName(t("aiModelFamily"))
        .setDesc(t("aiModelFamilyDesc"))
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
        .setName(t("modelVersion"))
        .setDesc(t("modelVersionDesc", { model: settings.aiModel }));

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
        .setName(t("aiApiKey"))
        .setDesc(t("openRouterApiKeyDesc"))
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
        .setName(t("aiModel"))
        .setDesc(t("aiModelDesc", { provider: provider.label }));

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
        .setName(t("aiApiKey"))
        .setDesc(t("providerApiKeyDesc", { provider: provider.label }))
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
      .setName(isLocal ? t("creditStatusTitleLocal") : t("creditStatusTitleCloud"))
      .setDesc(isLocal ? t("creditCheckingLocal") : t("creditCheckingCloud"))
      .addButton((btn) => {
        btn
          .setButtonText(t("refresh"))
          .setCta()
          .onClick(async () => {
            btn.setDisabled(true);
            btn.setButtonText(t("checking"));
            await updateCreditDisplay();
            btn.setDisabled(false);
            btn.setButtonText(t("refresh"));
          });
        return btn;
      });

    const updateCreditDisplay = async () => {
      try {
        const credit = await this.plugin.aiClient.checkCredit(settings);
        if (credit.hasBalance && credit.balanceFormatted) {
          creditSetting.setDesc(
            t("remainingBalance", { balance: credit.balanceFormatted, status: credit.statusText })
          );
        } else {
          creditSetting.setDesc(
            t("providerStatus", { provider: credit.providerLabel, status: credit.statusText })
          );
        }
      } catch (err) {
        creditSetting.setDesc(t("creditCheckFailed", { error: String(err) }));
      }
    };

    updateCreditDisplay();

    // ==========================================
    // Processing & Chunking
    // ==========================================
    containerEl.createEl("h3", { text: t("processingHeader") });

    new Setting(containerEl)
      .setName(t("chunkWindowChars"))
      .setDesc(t("chunkWindowCharsDesc"))
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
      .setName(t("sectionGridSeconds"))
      .setDesc(t("sectionGridSecondsDesc"))
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

    new Setting(containerEl)
      .setName(t("maxTokens"))
      .setDesc(t("maxTokensDesc"))
      .addText((text) =>
        text
          .setPlaceholder("16384")
          .setValue(String(settings.contentAnalysisMaxTokens || 16384))
          .onChange(async (value) => {
            const num = parseInt(value, 10);
            if (!isNaN(num) && num >= 500) {
              settings.contentAnalysisMaxTokens = num;
              await this.plugin.saveSettings();
            }
          })
      );

    // ==========================================
    // Server
    // ==========================================
    containerEl.createEl("h3", { text: t("serverHeader") });

    new Setting(containerEl)
      .setName(t("serverPort"))
      .setDesc(t("serverPortDesc"))
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
    containerEl.createEl("h3", { text: t("linksHeader") });

    new Setting(containerEl)
      .setName(t("nuteggChromeStoreName"))
      .setDesc(t("nuteggChromeStoreDesc"))
      .addButton((btn) =>
        btn
          .setButtonText(t("openChromeWebStore"))
          .onClick(() => {
            window.open(
              "https://chromewebstore.google.com/detail/nutegg/bmdmdiicembobejibggoeiahaonphcol",
              "_blank"
            );
          })
      );

    new Setting(containerEl)
      .setName(t("nuteggObsidianPluginName"))
      .setDesc(t("nuteggObsidianPluginDesc"))
      .addButton((btn) =>
        btn
          .setButtonText(t("openObsidianDirectory"))
          .onClick(() => {
            window.open("https://community.obsidian.md/plugins/nutegg", "_blank");
          })
      );
  }

  private displayLanguageSettings(
    containerEl: HTMLElement,
    settings: NutEggSettings
  ): void {
  }
}


