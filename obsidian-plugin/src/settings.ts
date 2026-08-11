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
  /** Local HTTP server port */
  serverPort: number;
  /** Folder for saved raw content */
  rawFolder: string;
  /** File that maps eggs to markdown files */
  indexFile: string;
}

export const DEFAULT_SETTINGS: NutEggSettings = {
  developerMode: false,
  aiProvider: "anthropic",
  aiSource: "official",
  aiApiKey: "",
  aiModel: "claude-sonnet-5",
  serverPort: 27123,
  rawFolder: "nutegg/_raw",
  indexFile: "nutegg/_index.md",
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

    // Provider dropdown
    new Setting(containerEl)
      .setName("Model family")
      .setDesc("Which company's models to use")
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

    // Source toggle
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

    // API Key
    new Setting(containerEl)
      .setName("API Key")
      .setDesc(
        isOpenRouter
          ? "Your OpenRouter API key (openrouter.ai/keys)"
          : `Your ${provider.label} API key`
      )
      .addText((text) => {
        text
          .setPlaceholder(
            isOpenRouter ? "sk-or-..." : provider.keyPlaceholder
          )
          .setValue(settings.aiApiKey)
          .onChange(async (value) => {
            settings.aiApiKey = value.trim();
            await this.plugin.saveSettings();
          });
        return text;
      });

    // Model dropdown
    const modelOptions = provider.models;
    new Setting(containerEl)
      .setName("Model")
      .setDesc(
        isOpenRouter
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
        });
        return dropdown;
      });

    // ==========================================
    // Server
    // ==========================================
    containerEl.createEl("h3", { text: "Server" });

    new Setting(containerEl)
      .setName("Server Port")
      .setDesc("Port for the local HTTP server (requires restart)")
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
  }
}
