import { App, Notice, PluginSettingTab, Setting, type ButtonComponent } from "obsidian";
import type NutEggPlugin from "./main";
import {
  AIClient,
  type AIProviderId,
  type AISource,
  PROVIDER_CATALOG,
  isAIConfigured,
} from "./ai-client";
import { AIProcessor } from "./ai-processor";
import { t } from "./i18n";
import type { SubscriptionProvider } from "../../shared/src/types";

export type LocalApiType = "openai" | "ollama";

export interface NutEggSettings {
  /** Show advanced server configuration */
  developerMode: boolean;
  subscriptionEnabled: boolean;
  aiAuthMethod?: 'apiKey' | 'subscription';
  chromeConnections?: Record<string, string>;
  subscriptionPaths?: Partial<Record<'openai' | 'anthropic' | 'gemini', string>>;
  subscriptionModels?: Partial<Record<SubscriptionProvider, string[]>>;
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
  /** Max completion tokens for Stage 1 content analysis and mind map (default: 16384) */
  contentAnalysisMaxTokens: number;
}

export const DEFAULT_SETTINGS: NutEggSettings = {
  developerMode: false,
  subscriptionEnabled: false,
  aiAuthMethod: "apiKey",
  subscriptionModels: {},
  aiProvider: "anthropic",
  aiApiKey: "",
  aiModel: PROVIDER_CATALOG.anthropic.defaultModel!,
  localEndpoint: "http://127.0.0.1:11434/v1/chat/completions",
  localApiType: "openai",
  serverPort: 27123,
  rawFolder: "nutegg/_raw",
  indexFile: "nutegg/_index.md",
  workflowFolder: "nutegg/_workflow",
  workflowHashes: {},
  chunkWindowChars: 30000,
  contentAnalysisMaxTokens: 16384,
};

const DEFAULT_SUBSCRIPTION_MODELS: Record<SubscriptionProvider, string[]> = {
  gemini: ['auto', 'gemini-2.5-flash', 'gemini-2.5-pro'],
  openai: ['auto', 'gpt-4o', 'gpt-4o-mini', 'o1', 'o3-mini', 'gpt-4.5-preview'],
  anthropic: ['auto', 'claude-3-7-sonnet', 'claude-3-5-haiku', 'claude-3-5-sonnet'],
};

export class NutEggSettingTab extends PluginSettingTab {
  plugin: NutEggPlugin;
  private aiConfigSummary: Setting | null = null;
  private aiChunkWindow: Setting | null = null;
  private aiMaxTokens: Setting | null = null;
  private aiCreditButton: ButtonComponent | null = null;
  private aiCreditRequest = 0;
  private setupTimer?: ReturnType<typeof setTimeout>;
  private setupRequest = 0;

  constructor(app: App, plugin: NutEggPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    const settings = this.plugin.settings;

    clearTimeout(this.setupTimer); ++this.setupRequest;
    containerEl.empty();
    this.aiConfigSummary = null;
    this.aiChunkWindow = null;
    this.aiMaxTokens = null;
    this.aiCreditButton = null;
    ++this.aiCreditRequest;
    containerEl.createEl("h2", { text: t("settingsTitle") });
    if (settings.subscriptionEnabled && settings.aiAuthMethod === 'subscription') {
      this.displaySubscriptionSetup(containerEl);
    } else {
      this.displaySyncedAiSettings(containerEl, settings);
    }

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

    if (settings.developerMode) {
      this.displayAdvancedSettings(containerEl, settings);
    }

    // ==========================================
    // Bug Report & Feedback (at the bottom)
    // ==========================================
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
  }

  private displaySyncedAiSettings(containerEl: HTMLElement, settings: NutEggSettings): void {
    if (!isAIConfigured(settings)) {
      const banner = containerEl.createDiv({
        cls: "callout nutegg-setup-callout",
        attr: { "data-callout": "warning" },
      });
      banner.style.cssText = "margin: 12px 0 16px 0;";
      const titleWrap = banner.createDiv({ cls: "callout-title" });
      const icon = titleWrap.createDiv({ cls: "callout-icon" });
      icon.setText("⚠️");
      const titleText = titleWrap.createDiv({ cls: "callout-title-inner" });
      titleText.setText(t("setupAiBannerTitle"));
      const content = banner.createDiv({ cls: "callout-content" });
      content.createEl("p", { text: t("aiManagedInChrome") });
    } else {
      this.aiConfigSummary = new Setting(containerEl)
        .setName(`${PROVIDER_CATALOG[settings.aiProvider]?.label || settings.aiProvider} · ${t("subscriptionApiKey")} · ${settings.aiModel}`)
        .setDesc(t("aiManagedInChrome"))
        .addButton((button) => {
          this.aiCreditButton = button;
          button
            .setButtonText(t("checking"))
            .setTooltip(t("refresh"))
            .onClick(() => {
              void this.refreshAICredit();
            });
        });
      this.refreshAISettings();
    }
  }

  refreshAISettings(): void {
    const settings = this.plugin.settings;
    const provider = PROVIDER_CATALOG[settings.aiProvider];
    this.aiConfigSummary?.setName(`${provider?.label || settings.aiProvider} · ${t(settings.aiAuthMethod === "subscription" ? settings.subscriptionEnabled ? "subscriptionLabel" : "aiConnectionUnavailable" : "subscriptionApiKey")} · ${settings.aiModel}`);
    this.aiChunkWindow?.setName(`${t("chunkWindowChars")}: ${settings.chunkWindowChars}`);
    this.aiMaxTokens?.setName(`${t("maxTokens")}: ${settings.contentAnalysisMaxTokens}`);
    if (this.aiCreditButton) void this.refreshAICredit();
  }

  async refreshAICredit(): Promise<void> {
    const button = this.aiCreditButton;
    if (!button) return;
    const request = ++this.aiCreditRequest;
    if (!isAIConfigured(this.plugin.settings)) {
      button.setButtonText(t("setupAiKeyStatusBar")).setTooltip(t("aiManagedInChrome")).setDisabled(false);
      return;
    }
    button.setDisabled(true).setButtonText(t("checking"));
    try {
      const credit = await this.plugin.aiClient.checkCredit(this.plugin.settings);
      if (request !== this.aiCreditRequest || button !== this.aiCreditButton) return;
      const label = credit.subscriptionState === 'disabled' ? t('aiConnectionUnavailable') : credit.subscriptionState ? `${credit.providerLabel} · ${t("subscriptionLabel")}${credit.usageRemaining ? ` · ${credit.usageRemaining}` : ""}` : credit.balanceFormatted || credit.statusText.split(" · ")[0];
      button.setButtonText(credit.subscriptionState ? label : `🪙 ${label}`).setTooltip(`${credit.providerLabel}: ${credit.statusText} · ${t("refresh")}`);
    } catch (error) {
      if (request !== this.aiCreditRequest || button !== this.aiCreditButton) return;
      button.setButtonText(`🪙 ${t("refresh")}`).setTooltip(t("creditCheckFailed", { error: String(error) }));
    } finally {
      if (request === this.aiCreditRequest && button === this.aiCreditButton) button.setDisabled(false);
    }
  }

  hide(): void { clearTimeout(this.setupTimer); ++this.setupRequest; }

  private displaySubscriptionSetup(containerEl: HTMLElement): void {
    const card = containerEl.createDiv({ cls: 'nutegg-subscription-card' });
    card.createEl('h3', { text: t('subscriptionEnabledTitle') });
    card.createEl('p', { text: t('subscriptionAccountSetup'), cls: 'setting-item-description' });

    let provider: SubscriptionProvider = ['openai', 'anthropic', 'gemini'].includes(this.plugin.settings.aiProvider)
      ? this.plugin.settings.aiProvider as SubscriptionProvider : 'gemini';
    if (!['openai', 'anthropic', 'gemini'].includes(this.plugin.settings.aiProvider)) {
      this.plugin.settings.aiProvider = provider;
      this.plugin.settings.aiAuthMethod = 'subscription';
      if (!this.plugin.settings.aiModel) this.plugin.settings.aiModel = 'auto';
      void this.plugin.saveSettings();
    }
    let feedback: { text: string; error?: boolean } | undefined;

    const providerRow = card.createDiv();
    const controls = card.createDiv();

    const refresh = async () => {
      clearTimeout(this.setupTimer);
      const request = ++this.setupRequest;
      const current = provider;
      providerRow.empty();
      controls.empty();
      controls.createEl('p', { text: t('checking'), cls: 'setting-item-description' });
      let status;
      try { status = await this.plugin.subscriptions.status(current); }
      catch (error) { status = { state: 'error' as const, message: String(error) }; }
      if (request !== this.setupRequest || !this.plugin.settings.subscriptionEnabled || !controls.isConnected) return;
      controls.empty();

      const buttons: ButtonComponent[] = [];
      const isMissing = status.state === 'missing';
      const isSigningIn = Boolean(status.loginId || status.state === 'signing_in');

      const providerSetting = new Setting(providerRow)
        .setName(t('subscriptionAccountProvider'))
        .addDropdown(dropdown => {
          for (const id of ['openai', 'anthropic', 'gemini'] as const) dropdown.addOption(id, PROVIDER_CATALOG[id].label);
          dropdown.setValue(provider).onChange(async value => {
            provider = value as SubscriptionProvider;
            this.plugin.settings.aiProvider = provider;
            this.plugin.settings.aiAuthMethod = 'subscription';
            this.plugin.settings.aiModel = 'auto';
            await this.plugin.saveSettings();
            this.plugin.aiClient = new AIClient(this.plugin.settings, this.plugin.subscriptions);
            this.plugin.aiProcessor = new AIProcessor(this.plugin);
            this.refreshAISettings();
            this.plugin.updateCreditStatusBar?.();
            feedback = undefined;
            void refresh();
          });
        });

      // 1. Authorize subscription (or cancel)
      if (isSigningIn) {
        providerSetting.addButton(button => {
          buttons.push(button);
          button.setButtonText(t('cancel')).onClick(async () => {
            clearTimeout(this.setupTimer);
            for (const item of buttons) item.setDisabled(true);
            await this.plugin.subscriptions.cancelLogin(current);
            await refresh();
          });
        });
      } else {
        providerSetting.addButton(button => {
          buttons.push(button);
          button.setButtonText(t('subscriptionAuthorize'));
          if (isMissing) {
            button.setDisabled(true);
          } else {
            button.onClick(async () => {
              clearTimeout(this.setupTimer);
              for (const item of buttons) item.setDisabled(true);
              const isTest = ['ready', 'unverified'].includes(status.state);
              result.setText(t(isTest ? 'subscriptionTesting' : 'checking'));
              result.style.color = 'var(--text-muted)';
              try {
                let outcome: { state?: string; message?: string } | undefined;
                if (isTest) {
                  outcome = await this.plugin.subscriptions.test(current,
                    this.plugin.settings.aiProvider === current && this.plugin.settings.aiAuthMethod === 'subscription' ? this.plugin.settings.aiModel || 'auto' : 'auto');
                  const passed = outcome?.state === 'ready';
                  if (passed) {
                    this.plugin.settings.aiProvider = current;
                    this.plugin.settings.aiAuthMethod = 'subscription';
                    if (!this.plugin.settings.aiModel) this.plugin.settings.aiModel = 'auto';
                    await this.plugin.saveSettings();
                    this.plugin.aiClient = new AIClient(this.plugin.settings, this.plugin.subscriptions);
                    this.plugin.aiProcessor = new AIProcessor(this.plugin);
                    this.refreshAISettings();
                    this.plugin.updateCreditStatusBar?.();
                  }
                  feedback = passed
                    ? { text: t('subscriptionTestPassed') }
                    : { text: outcome?.message || t('aiConnectionUnavailable'), error: true };
                  new Notice(feedback.text);
                } else {
                  outcome = await this.plugin.subscriptions.startLogin(current);
                  feedback = undefined;
                }
              } catch (error) {
                if (request !== this.setupRequest) return;
                feedback = { text: String(error), error: true };
                new Notice(feedback.text);
              } finally {
                if (request === this.setupRequest) {
                  showFeedback();
                  await refresh();
                }
              }
            });
          }
        });
      }

      // 2. Refresh button
      providerSetting.addButton(button => {
        buttons.push(button);
        button.setButtonText(t('refresh')).onClick(async () => {
          clearTimeout(this.setupTimer);
          for (const item of buttons) item.setDisabled(true);
          feedback = undefined;
          await refresh();
        });
      });

      const result = controls.createEl('p', { cls: 'setting-item-description', attr: { role: 'status', 'aria-live': 'polite' } });
      const showFeedback = () => {
        result.setText(feedback?.text || '');
        result.style.color = feedback?.error ? 'var(--text-error)' : 'var(--text-success)';
      };
      showFeedback();

      if (isMissing) {
        const missingNotice = controls.createDiv({ cls: 'callout nutegg-setup-callout' });
        missingNotice.setAttribute('data-callout', 'warning');
        missingNotice.style.cssText = 'margin: 10px 0 14px 0;';
        const noticeTitle = missingNotice.createDiv({ cls: 'callout-title' });
        noticeTitle.createDiv({ cls: 'callout-icon' }).setText('⚠️');
        noticeTitle.createDiv({ cls: 'callout-title-inner' }).setText(status.message);
        const command = status.installCommand || status.command;
        if (command) {
          const noticeBody = missingNotice.createDiv({ cls: 'callout-content' });
          noticeBody.createEl('pre').createEl('code', { text: command });
          new Setting(noticeBody).addButton(btn =>
            btn.setButtonText(t('subscriptionCopy')).onClick(() => {
              void navigator.clipboard.writeText(command).catch(() => new Notice(command));
              new Notice(command);
            })
          );
        }
      } else {
        new Setting(controls)
          .setName(t('subscriptionConnection'))
          .setDesc(status.usageRemaining ? `${status.message} · ${status.usageRemaining}` : status.message);
      }

      if (status.state === 'ready') {
        const cached = this.plugin.settings.subscriptionModels?.[current];
        let models: string[] = (cached && cached.length > 0)
          ? [...cached]
          : [...(DEFAULT_SUBSCRIPTION_MODELS[current] || ['auto'])];
        if (!models.includes('auto')) models.unshift('auto');

        const currentModel = (this.plugin.settings.aiProvider === current && this.plugin.settings.aiAuthMethod === 'subscription')
          ? (this.plugin.settings.aiModel || 'auto')
          : 'auto';
        const isCustom = !models.includes(currentModel) && currentModel !== '';

        let customInputSetting: Setting | null = null;
        let dropdownComponent: any = null;

        new Setting(controls)
          .setName(t('subscriptionModelChoice'))
          .setDesc(t('subscriptionModelChoiceDesc'))
          .addDropdown(dropdown => {
            dropdownComponent = dropdown;
            for (const m of models) {
              dropdown.addOption(m, m === 'auto' ? t('subscriptionAuto') : m);
            }
            dropdown.addOption('__custom__', t('customModelTag'));
            dropdown.setValue(isCustom ? '__custom__' : currentModel);
            dropdown.onChange(async (val) => {
              if (val === '__custom__') {
                if (customInputSetting) customInputSetting.settingEl.show();
              } else {
                if (customInputSetting) customInputSetting.settingEl.hide();
                this.plugin.settings.aiProvider = current;
                this.plugin.settings.aiAuthMethod = 'subscription';
                this.plugin.settings.aiModel = val;
                await this.plugin.saveSettings();
                this.plugin.aiClient = new AIClient(this.plugin.settings, this.plugin.subscriptions);
                this.plugin.aiProcessor = new AIProcessor(this.plugin);
                this.refreshAISettings();
              }
            });
          });

        customInputSetting = new Setting(controls)
          .setName(t('customModelTag'))
          .addText(text => {
            text.setPlaceholder('gpt-4o, claude-3-5-sonnet, etc.')
              .setValue(isCustom ? currentModel : '')
              .onChange(async (val) => {
                const trimmed = val.trim();
                if (trimmed) {
                  this.plugin.settings.aiProvider = current;
                  this.plugin.settings.aiAuthMethod = 'subscription';
                  this.plugin.settings.aiModel = trimmed;
                  await this.plugin.saveSettings();
                  this.plugin.aiClient = new AIClient(this.plugin.settings, this.plugin.subscriptions);
                  this.plugin.aiProcessor = new AIProcessor(this.plugin);
                  this.refreshAISettings();
                }
              });
          });
        if (!isCustom) {
          customInputSetting.settingEl.hide();
        }

        // Fetch fresh model list in background and update dropdown & settings
        void (async () => {
          try {
            const fetched = await this.plugin.subscriptions.models(current);
            if (request !== this.setupRequest || !controls.isConnected || !Array.isArray(fetched) || fetched.length === 0) return;
            const normalized = fetched.includes('auto') ? fetched : ['auto', ...fetched];
            const hasDiff = normalized.length !== models.length || normalized.some((m, i) => m !== models[i]);
            if (hasDiff) {
              (this.plugin.settings.subscriptionModels ||= {})[current] = normalized;
              await this.plugin.saveSettings();
              models = normalized;
              if (dropdownComponent && controls.isConnected) {
                const selectEl = dropdownComponent.selectEl;
                if (selectEl) {
                  const activeVal = dropdownComponent.getValue();
                  selectEl.innerHTML = '';
                  for (const m of normalized) {
                    dropdownComponent.addOption(m, m === 'auto' ? t('subscriptionAuto') : m);
                  }
                  dropdownComponent.addOption('__custom__', t('customModelTag'));
                  dropdownComponent.setValue(activeVal);
                }
              }
            }
          } catch {
            // Keep existing default / cached list
          }
        })();
      }

      if (status.installUrl) {
        const links = controls.createDiv({ cls: 'nutegg-subscription-links' });
        links.createEl('a', { text: t('subscriptionInstall'), href: status.installUrl, attr: { target: '_blank', rel: 'noopener noreferrer' } });
      }

      if (status.loginId || status.state === 'signing_in') this.setupTimer = setTimeout(() => { void refresh(); }, 3000);
    };

    void refresh();
  }

  private displayAdvancedSettings(
    containerEl: HTMLElement,
    settings: NutEggSettings
  ): void {
    containerEl.createEl("h3", { text: t("aiModelConfig") });
    if (!this.aiConfigSummary) {
      this.aiConfigSummary = new Setting(containerEl)
        .setDesc(t("aiManagedInChrome"))
        .addButton(button => {
          this.aiCreditButton = button;
          button.setButtonText(t("checking"))
            .setTooltip(t("refresh"))
            .onClick(() => { void this.refreshAICredit(); });
        });
    }
    this.aiChunkWindow = new Setting(containerEl);
    this.aiMaxTokens = new Setting(containerEl);
    this.refreshAISettings();

    if (settings.subscriptionEnabled) for (const provider of ['openai', 'anthropic', 'gemini'] as const) {
      new Setting(containerEl).setName(`${PROVIDER_CATALOG[provider].label} · ${t('subscriptionPath')}`)
        .setDesc(t('subscriptionPathHint')).addText(text => {
          let currentVal = settings.subscriptionPaths?.[provider] || '';
          if (!currentVal && this.plugin.subscriptions) {
            void this.plugin.subscriptions.resolve(provider).then(autoPath => {
              if (autoPath && !text.inputEl.value) {
                text.setValue(autoPath);
                (settings.subscriptionPaths ||= {})[provider] = autoPath;
                void this.plugin.saveSettings();
              }
            }).catch(() => {});
          }
          text.setValue(currentVal).onChange(async value => {
            (settings.subscriptionPaths ||= {})[provider] = value.trim();
            await this.plugin.saveSettings();
          });
        });
    }

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


