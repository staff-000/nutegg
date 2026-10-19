import { App, Notice, PluginSettingTab, Setting, type ButtonComponent } from 'obsidian';
import type NutEggPlugin from './main';
import { AIClient, type AIProviderId, type AISource, PROVIDER_CATALOG, isAIConfigured } from './ai-client';
import { AIProcessor } from './ai-processor';
import { t } from './i18n';
import type { SubscriptionProvider } from '../../shared/src/types';
import type { SubscriptionStatus } from '../../shared/src/types';

export type LocalApiType = 'openai' | 'ollama';

export interface WorkflowFileMeta {
  /** Hash of the built-in English code template in BUILTIN_WORKFLOW_FILES */
  sourceHash: string;
  /** Hash of the file content NutEgg wrote to the vault (English or localized) */
  vaultHash: string;
  /** Language the file was localized to ('English' or specific language name) */
  language: string;
}

export interface NutEggSettings {
  /** Show advanced server configuration */
  developerMode: boolean;
  executionState?: import('../../shared/src/execution').SharedExecutionState;
  chromeClientBindings?: Record<string, { clientId: string; origin: string }>;
  nativeApiConfig?: Partial<NutEggSettings>;
  nativeApiKeyRef?: string;
  nativeConfigurationRevision?: number;
  legacyNativeApiCandidate?: { settings: Record<string, any>; keyRef: string };

  subscriptionEnabled: boolean;
  aiAuthMethod?: 'apiKey' | 'subscription' | 'chatgpt';
  /** Non-secret selection retained even while the credential store is unavailable. */
  chatgptModel?: string;
  chromeConnections?: Record<string, string | string[]>;
  subscriptionPaths?: Partial<Record<'openai' | 'anthropic' | 'google', string>>;
  subscriptionModels?: Partial<Record<SubscriptionProvider, string[]>>;
  /** Retained while Chrome uses an API key. */
  subscriptionSelection?: { provider: SubscriptionProvider; model: string };
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
  /** Metadata of workflow files when last synced/localized (sourceHash, vaultHash, language) */
  workflowMeta?: Record<string, WorkflowFileMeta>;
  /** Synced output language from Chrome extension (read-only in Obsidian) */
  outputLanguage?: string;
  /** General chunk window size in characters for splitting long content (default: 30000) */
  chunkWindowChars: number;
  /** Max completion tokens for Stage 1 content analysis and mind map (default: 16384) */
  contentAnalysisMaxTokens: number;
}

export const DEFAULT_SETTINGS: NutEggSettings = {
  developerMode: false,
  subscriptionEnabled: false,
  aiAuthMethod: 'apiKey',
  subscriptionModels: {},
  aiProvider: 'anthropic',
  aiApiKey: '',
  aiModel: PROVIDER_CATALOG.anthropic.defaultModel!,
  localEndpoint: 'http://127.0.0.1:11434/v1',
  localApiType: 'openai',
  serverPort: 27123,
  rawFolder: 'nutegg/_raw',
  indexFile: 'nutegg/_index.md',
  workflowFolder: 'nutegg/_workflow',
  workflowHashes: {},
  workflowMeta: {},
  outputLanguage: 'same-as-content',
  chunkWindowChars: 30000,
  contentAnalysisMaxTokens: 16384,
};

const DEFAULT_SUBSCRIPTION_MODELS: Record<SubscriptionProvider, string[]> = {
  google: ['auto'],
  openai: ['auto'],
  anthropic: ['auto', 'sonnet', 'opus', 'haiku'],
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
  private subscriptionCard?: HTMLElement;
  private profileTimer?: ReturnType<typeof setInterval>;
  private connectionTimer?: ReturnType<typeof setTimeout>;
  private connectionPanel?: HTMLElement;
  private connectionRows?: { local: HTMLElement; chrome: HTMLElement; bridge: HTMLElement; warning: HTMLElement };
  private chatgptCard?: HTMLElement;
  private chatgptView = 0;
  private accountState?: SubscriptionStatus['state'];

  constructor(app: App, plugin: NutEggPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    const settings = this.plugin.settings;

    clearInterval(this.profileTimer);
    clearTimeout(this.setupTimer);
    ++this.setupRequest;
    this.subscriptionCard = undefined;
    clearTimeout(this.connectionTimer);
    this.accountState = undefined;
    containerEl.empty();
    containerEl.classList.add('nutegg-settings');
    this.aiConfigSummary = null;
    this.aiChunkWindow = null;
    this.aiMaxTokens = null;
    this.aiCreditButton = null;
    ++this.aiCreditRequest;
    containerEl.createEl('h2', { text: t('settingsTitle') });
    this.displayConnectionStatus(containerEl);
    ++this.chatgptView;
    this.chatgptCard = undefined;
    const connectionBox = this.displayAIConnections(containerEl);
    const mode = this.aiConnectionMode();
    if (mode === 'chatgpt') {
      this.displayChatGPT(connectionBox);
    } else if (settings.subscriptionEnabled && mode === 'subscription') {
      this.displaySubscriptionSetup(connectionBox);
    }

    // ==========================================
    // Vault Paths (always visible)
    // ==========================================
    containerEl.createEl('h3', { text: t('vaultPathsHeader') });

    new Setting(containerEl)
      .setName(t('rawFolder'))
      .setDesc(t('rawFolderDesc'))
      .addText(text =>
        text
          .setPlaceholder('nutegg/_raw')
          .setValue(settings.rawFolder)
          .onChange(async value => {
            settings.rawFolder = value.trim() || 'nutegg/_raw';
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t('indexFile'))
      .setDesc(t('indexFileDesc'))
      .addText(text =>
        text
          .setPlaceholder('nutegg/_index.md')
          .setValue(settings.indexFile)
          .onChange(async value => {
            settings.indexFile = value.trim() || 'nutegg/_index.md';
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t('workflowFolder'))
      .setDesc(t('workflowFolderDesc'))
      .addText(text =>
        text
          .setPlaceholder('nutegg/_workflow')
          .setValue(settings.workflowFolder)
          .onChange(async value => {
            settings.workflowFolder = value.trim() || 'nutegg/_workflow';
            await this.plugin.saveSettings();
          })
      );

    const currentLang = (settings.outputLanguage || 'same-as-content').trim();
    const isEnglishOrSame =
      !currentLang ||
      currentLang === 'same-as-content' ||
      currentLang.toLowerCase() === 'english';
    const displayLang =
      currentLang === 'same-as-content'
        ? t('outputLanguageSameAsContent')
        : currentLang.toLowerCase() === 'english'
          ? t('outputLanguageEnglish')
          : `${currentLang} (${t('syncedFromChrome')})`;

    new Setting(containerEl)
      .setName(t('outputLanguageTitle'))
      .setDesc(t('outputLanguageDesc'))
      .addText(text => {
        text.setValue(displayLang);
        text.setDisabled(true);
        text.inputEl?.classList?.add?.('nutegg-readonly-input');
      });

    new Setting(containerEl)
      .setName(t('localizeWorkflowsTitle'))
      .setDesc(t('localizeWorkflowsDesc'))
      .addButton(btn => {
        const btnText = isEnglishOrSame
          ? t('revertToEnglishBtn')
          : t('localizeWorkflowsBtn', { language: currentLang });
        btn.setButtonText(btnText);
        if (!isEnglishOrSame) {
          btn.setCta();
        }
        btn.onClick(async () => {
          btn.setDisabled(true);
          const origText = btn.buttonEl.textContent;
          btn.setButtonText(
            isEnglishOrSame
              ? t('revertingWorkflows')
              : t('localizingWorkflows', { language: currentLang })
          );
          try {
            const res = await this.plugin.workflowManager.localizeAll(currentLang);
            if (isEnglishOrSame) {
              new Notice(`[NutEgg] ${t('revertedSuccess')}`);
            } else {
              new Notice(
                `[NutEgg] ${t('localizedSuccess', { language: currentLang })}${
                  res.newFilesCreated > 0 ? ` (${res.newFilesCreated} .new.md)` : ''
                }`
              );
            }
          } catch (err: any) {
            console.error('[NutEgg] Localization error:', err);
            new Notice(`[NutEgg] ${t('localizationFailed', { error: err?.message || String(err) })}`);
          } finally {
            btn.setDisabled(false);
            btn.setButtonText(origText || btnText);
          }
        });
      });

    new Setting(containerEl)
      .setName(t('useDefaultWorkflows'))
      .setDesc(t('useDefaultWorkflowsDesc'))
      .addButton(btn =>
        btn
          .setButtonText(t('useDefaultsBtn'))
          .setWarning()
          .onClick(async () => {
            await this.plugin.workflowManager.resetToDefaults();
          })
      );

    // ==========================================
    // Developer Mode toggle
    // ==========================================
    new Setting(containerEl)
      .setName(t('devMode'))
      .setDesc(settings.developerMode ? t('devModeOn') : t('devModeOff'))
      .addToggle(toggle => {
        toggle.setValue(settings.developerMode);
        toggle.onChange(async value => {
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
      .setName(t('reportBugName'))
      .setDesc(t('reportBugDesc'))
      .addButton(btn =>
        btn.setButtonText(t('reportBugBtn')).onClick(() => {
          this.plugin.openBugReport();
        })
      );
    this.groupSettingsSections(containerEl);
  }

  private groupSettingsSections(container: HTMLElement): void {
    // A real wrapper keeps inset spacing intact even when a theme restyles rows.
    for (const heading of Array.from(container.children)) {
      if (heading.tagName !== 'H3' || heading.parentElement !== container) continue;
      const section = container.createDiv({ cls: 'nutegg-settings-section' });
      container.insertBefore(section, heading);
      let element: Element | null = heading;
      while (
        element &&
        element.tagName !== 'H2' &&
        (element === heading || (element.tagName !== 'H3' && !element.classList.contains('nutegg-settings-section')))
      ) {
        const next: Element | null = element.nextElementSibling;
        section.appendChild(element);
        element = next;
      }
    }
  }

  private displayConnectionStatus(container: HTMLElement): void {
    const panel = container.createDiv({
      cls: 'nutegg-connection-panel',
      attr: { role: 'status', 'aria-live': 'polite' },
    });
    this.connectionPanel = panel;
    const row = (label: string) => {
      const element = panel.createDiv({ cls: 'nutegg-connection-row' });
      element.createEl('span', { text: label, cls: 'nutegg-connection-label' });
      return element.createEl('span', { cls: 'nutegg-connection-value' });
    };
    this.connectionRows = {
      local: row(t('connectionLocalLabel')),
      chrome: row(t('connectionChromeLabel')),
      bridge: row(t('executionDetails')),
      warning: panel.createEl('p', { cls: 'nutegg-connection-warning' }),
    };
    this.connectionRows.chrome.title = t('connectionActivityHint');
    const refresh = () => {
      if (panel !== this.connectionPanel || !panel.isConnected) return;
      this.refreshConnectionStatus();
      this.connectionTimer = setTimeout(refresh, 2000);
    };
    refresh();
  }

  private refreshConnectionStatus(): void {
    const rows = this.connectionRows;
    if (!rows) return;
    const connection = this.plugin.server?.getConnectionStatus();
    const paint = (element: HTMLElement, text: string, state: string) => {
      if (element.textContent !== text) element.setText(text);
      element.dataset.state = state;
    };
    paint(
      rows.local,
      t(connection?.listening ? 'connectionListening' : 'connectionStopped'),
      connection?.listening ? 'ready' : 'error'
    );
    const clients = connection?.recentClients || 0;
    const approvals = connection?.pendingApprovals || 0;
    const clientText = clients
      ? t('connectionRecentClients', { count: String(clients) })
      : t(approvals ? 'connectionApprovalPending' : 'connectionWaiting');
    paint(rows.chrome, clientText, clients ? 'ready' : 'waiting');
    const selected = this.plugin.settings.subscriptionEnabled && this.plugin.settings.aiAuthMethod === 'subscription';
    const runtime = selected ? this.plugin.subscriptions?.getRuntimeStatus() : undefined;
    if (this.plugin.settings.aiAuthMethod === 'chatgpt') {
      const state = this.plugin.chatgpt?.status().state || 'error';
      paint(
        rows.bridge,
        t(`chatgptState_${state}`),
        state === 'ready' ? 'ready' : state === 'signing_in' ? 'loading' : 'waiting'
      );
    } else if (!selected) {
      paint(rows.bridge, t('subscriptionApiKey'), 'idle');
    } else if (!runtime?.active) {
      paint(rows.bridge, t('connectionStopped'), 'error');
    } else if (runtime.requests) {
      paint(rows.bridge, t('connectionRequests', { count: String(runtime.requests) }), 'ready');
    } else if (runtime.logins) {
      paint(rows.bridge, t('connectionAuthorizing'), 'waiting');
    } else if (runtime.models) {
      paint(rows.bridge, t('connectionModelCheck'), 'loading');
    } else if (!this.accountState) {
      paint(rows.bridge, t('checking'), 'loading');
    } else if (this.accountState === 'error') {
      paint(rows.bridge, t('aiConnectionUnavailable'), 'error');
    } else if (this.accountState !== 'ready') {
      paint(rows.bridge, t('aiConnectionSetupNeeded'), 'waiting');
    } else {
      paint(rows.bridge, t('connectionIdle'), 'ready');
    }
    rows.warning.hidden = true;
    if (connection?.conflictingMethods && rows.warning.textContent !== t('connectionConflict')) {
      rows.warning.setText(t('connectionConflict'));
    }
  }

  private subscriptionLabel(provider: SubscriptionProvider): string {
    return provider === 'openai'
      ? t('codexSubscription')
      : provider === 'anthropic'
        ? t('claudeLabel')
        : PROVIDER_CATALOG.google.label;
  }

  private aiConnectionMode() {
    return this.plugin.server?.execution?.state?.mode || this.plugin.settings.executionState?.mode ||
      this.plugin.settings.aiAuthMethod || 'apiKey';
  }

  private displayAIConnections(container: HTMLElement): HTMLElement {
    const settings = this.plugin.settings;
    const mode = this.aiConnectionMode();
    const box = container.createDiv({ cls: 'nutegg-ai-connection-setting nutegg-ai-connection-box' });
    box.dataset.mode = mode;
    if (mode === 'apiKey') {
      new Setting(box)
        .setName(`${t('aiMethod')} · ${t('subscriptionApiKey')}`)
        .setDesc(t('connectedApiProfilesDescription'));
      this.displayConnectedProfiles(box);
      return box;
    }
    const view = this.chatgptView;
    const current = () => view === this.chatgptView && this.aiConnectionMode() !== 'apiKey';
    const selected =
      mode === 'chatgpt'
        ? 'chatgpt'
        : this.plugin.server?.execution?.state?.subscription.provider || settings.subscriptionSelection?.provider || settings.aiProvider;
    new Setting(box)
      .setName(`${t('aiMethod')} · ${t('subscriptionLabel')}`)
      .setDesc(t('obsidianAIConnectionsDesc'))
      .addDropdown(dropdown => {
        if (!selected) dropdown.addOption('', t('chooseAIConnection'));
        dropdown.addOption('chatgpt', t('chatgptLabel'));
        for (const provider of ['openai', 'google', 'anthropic'] as const)
          dropdown.addOption(provider, this.subscriptionLabel(provider));
        dropdown.setValue(selected);
        const placeholder = dropdown.selectEl?.querySelector('option[value=""]');
        if (placeholder) (placeholder as HTMLOptionElement).disabled = true;
        let changing = false;
        dropdown.onChange(async value => {
          if (!current() || changing || !['chatgpt', 'openai', 'google', 'anthropic'].includes(value)) return;
          changing = true;
          if (dropdown.selectEl) dropdown.selectEl.disabled = true;
          try {
            const state = this.plugin.server.execution.state;
            const provider = value as SubscriptionProvider;
            await this.plugin.server.execution.change(
              state.revision,
              crypto.randomUUID(),
              value === 'chatgpt'
                ? { mode: 'chatgpt' }
                : {
                    mode: 'subscription',
                    subscriptionAvailable: true,
                    subscription: {
                      provider,
                      model: state.subscription.provider === provider ? state.subscription.model : 'auto',
                    },
                  }
            );
          } catch {
            if (current()) {
              new Notice(t('aiConnectionChangeFailed'));
              this.display();
            }
          } finally {
            changing = false;
            if (current() && dropdown.selectEl) dropdown.selectEl.disabled = false;
          }
        });
      });
    return box;
  }

  private displayConnectedProfiles(containerEl: HTMLElement): void {
    const clients = containerEl.createDiv({ cls: 'nutegg-profile-list' });
    const paint = () => {
      clients.empty();
      const profiles = this.plugin.server?.execution.clients() || [];
      if (!profiles.length) clients.createEl('p', { text: t('connectionWaiting'), cls: 'setting-item-description' });
      for (const client of profiles) {
        const provider = PROVIDER_CATALOG[client.provider as AIProviderId];
        const card = clients.createDiv({ cls: 'nutegg-profile-card' });
        const heading = card.createDiv({ cls: 'nutegg-profile-heading' });
        heading.createEl('h4', { text: client.displayName });
        const model = card.createDiv({ cls: 'nutegg-profile-model' });
        model.createEl('span', { text: provider?.label || client.provider || '—' });
        model.createEl('code', { text: client.model || '—' });
      }
    };
    paint();
    this.profileTimer = setInterval(paint, 2000);
    this.profileTimer.unref?.();
  }

  refreshAISettings(): void {
    const settings = this.plugin.getNativeSettings();
    const provider = PROVIDER_CATALOG[settings.aiProvider as AIProviderId];
    const authMethodLabel =
      settings.aiAuthMethod === 'subscription'
        ? settings.subscriptionEnabled
          ? 'subscriptionLabel'
          : 'aiConnectionUnavailable'
        : 'subscriptionApiKey';
    this.aiConfigSummary?.setName(
      `${settings.aiAuthMethod === 'subscription' ? this.subscriptionLabel(settings.aiProvider as SubscriptionProvider) : provider?.label || settings.aiProvider} · ${t(authMethodLabel)} · ${settings.aiModel}`
    );
    this.aiChunkWindow?.setName(`${t('chunkWindowChars')}: ${settings.chunkWindowChars}`);
    this.aiMaxTokens?.setName(`${t('maxTokens')}: ${settings.contentAnalysisMaxTokens}`);
    if (settings.aiAuthMethod === 'chatgpt') {
      this.aiConfigSummary?.setName(`${t('chatgptLabel')} · ${settings.aiModel || t('chatgptChooseModel')}`);
      this.aiMaxTokens?.setDesc(t('chatgptTokenHint'));
    }
    if (this.aiCreditButton) void this.refreshAICredit();
  }

  private async boundedSettingsCheck<T>(operation: Promise<T>): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        operation,
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error(t('settingsCheckTimeout'))), 15000);
          timer.unref?.();
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  }

  async refreshAICredit(): Promise<void> {
    const button = this.aiCreditButton;
    if (!button) return;
    const request = ++this.aiCreditRequest;
    if (!isAIConfigured(this.plugin.getNativeSettings())) {
      button.setButtonText(t('setupAiKeyStatusBar')).setTooltip(t('nativeApiDescription')).setDisabled(false);
      return;
    }
    button.setDisabled(true).setButtonText(t('checking'));
    try {
      const credit = await this.boundedSettingsCheck(this.plugin.aiClient.checkCredit(this.plugin.settings));
      if (request !== this.aiCreditRequest || button !== this.aiCreditButton) return;
      let label: string;
      if (credit.subscriptionState === 'disabled') {
        label = t('aiConnectionUnavailable');
      } else if (credit.subscriptionState) {
        const usage = credit.usageRemaining ? ` · ${credit.usageRemaining}` : '';
        label = `${credit.providerLabel} · ${t('subscriptionLabel')}${usage}`;
      } else {
        label = credit.balanceFormatted || credit.statusText.split(' · ')[0];
      }
      const tooltip = `${credit.providerLabel}: ${credit.statusText} · ${t('refresh')}`;
      button.setButtonText(credit.subscriptionState ? label : `🪙 ${label}`).setTooltip(tooltip);
    } catch (error) {
      if (request !== this.aiCreditRequest || button !== this.aiCreditButton) return;
      button.setButtonText(`🪙 ${t('refresh')}`).setTooltip(t('creditCheckFailed', { error: String(error) }));
    } finally {
      if (request === this.aiCreditRequest && button === this.aiCreditButton) button.setDisabled(false);
    }
  }

  hide(): void {
    ++this.chatgptView;
    this.chatgptCard = undefined;
    ++this.aiCreditRequest;
    clearInterval(this.profileTimer);
    clearTimeout(this.setupTimer);
    clearTimeout(this.connectionTimer);
    this.connectionPanel = undefined;
    this.subscriptionCard = undefined;
    ++this.setupRequest;
  }

  private displayChatGPT(containerEl: HTMLElement): void {
    const service = this.plugin.chatgpt;
    const card = containerEl.createDiv({ cls: 'nutegg-subscription-card' });
    this.chatgptCard = card;
    const view = this.chatgptView;
    const current = () => this.chatgptCard === card && view === this.chatgptView && this.aiConnectionMode() === 'chatgpt';
    card.createEl('h3', { text: t('chatgptLabel') });
    card.createEl('p', { text: t('chatgptTokenHint'), cls: 'setting-item-description' });
    if (!service) {
      const statusLine = card.createEl('p', { cls: 'nutegg-connection-status-line' });
      statusLine.dataset.status = 'disconnected';
      statusLine.createSpan({ text: t('chatgptStorageUnavailable') });
      return;
    }
    const status = service.status();
    card.dataset.state = status.state === 'ready' ? 'ready' : status.state === 'signing_in' ? 'loading' : 'waiting';
    const statusLine = card.createEl('p', { cls: 'nutegg-connection-status-line' });
    statusLine.dataset.status =
      status.state === 'ready' ? 'connected' : status.state === 'signing_in' ? 'in-process' : 'disconnected';
    const statusText = [status.accountLabel, t(`chatgptState_${status.state}`)].filter(Boolean).join(' · ');
    statusLine.createSpan({ text: statusText });
    if (status.message) card.createEl('p', { text: status.message, cls: 'setting-item-description' });
    const action = async (task: () => Promise<unknown> | unknown) => {
      if (!current()) return;
      try {
        await task();
        if (!current()) return;
        await this.plugin.server.execution.updateChatGPT(service.status());
      } catch {
        if (current()) new Notice(t('chatgptError'));
      }
    };
    const controls = new Setting(card);
    if (status.state !== 'ready' && status.state !== 'signing_in')
      controls.addButton(button =>
        button.setButtonText(t('chatgptContinue')).onClick(() => action(() => service.signIn()))
      );
    if (status.state === 'signing_in')
      controls.addButton(button =>
        button.setButtonText(t('chatgptCancel')).onClick(() => action(() => service.cancelSignIn()))
      );
    if (status.state !== 'signed_out')
      controls.addButton(button =>
        button.setButtonText(t('chatgptSignOut')).onClick(() => action(() => service.signOut()))
      );
    controls.addButton(button =>
      button.setButtonText(t('chatgptManageUsage')).onClick(() => {
        window.open('https://chatgpt.com/#settings/Usage');
      })
    );
    if (status.state !== 'ready') return;
    const models = new Setting(card).setName(t('chatgptModel')).setDesc(t('checking'));
    let request = 0;
    const load = async (force = false) => {
      if (!current()) return;
      const generation = ++request;
      try {
        const choices = await service.models(force);
        if (!current() || request !== generation) return;
        models.setDesc('');
        models.controlEl.empty();
        models.addDropdown(dropdown => {
          if (!service.status().model) dropdown.addOption('', t('chatgptChooseModel'));
          for (const model of choices) dropdown.addOption(model.slug, model.displayName);
          dropdown.setValue(service.status().model).onChange(value => action(() => service.selectModel(value)));
        });
      } catch {
        if (current() && request === generation) models.setDesc(t('chatgptError'));
      }
    };
    controls.addButton(button => button.setButtonText(t('chatgptRefreshModels')).onClick(() => load(true)));
    void load();
  }

  private displaySubscriptionSetup(containerEl: HTMLElement): void {
    const card = containerEl.createDiv({ cls: 'nutegg-subscription-card' });
    this.subscriptionCard = card;
    card.createEl('h3', { text: this.subscriptionLabel(this.plugin.settings.aiProvider as SubscriptionProvider) });
    card.createEl('p', { text: t('subscriptionAccountSetup'), cls: 'setting-item-description' });

    let provider: SubscriptionProvider = ['openai', 'anthropic', 'google'].includes(this.plugin.settings.aiProvider)
      ? (this.plugin.settings.aiProvider as SubscriptionProvider)
      : 'google';
    if (!['openai', 'anthropic', 'google'].includes(this.plugin.settings.aiProvider)) {
      this.plugin.settings.aiProvider = provider;
      this.plugin.settings.aiAuthMethod = 'subscription';
      this.plugin.settings.aiModel = 'auto';
      void this.plugin.saveSettings();
    }
    const selectedModel = (current: SubscriptionProvider) => {
      const coordinatorState = this.plugin.server?.execution?.state?.subscription;
      const selection =
        coordinatorState ||
        this.plugin.settings.executionState?.subscription ||
        this.plugin.settings.subscriptionSelection;
      if (selection?.provider === current) return selection.model || 'auto';
      return this.plugin.settings.aiProvider === current && this.plugin.settings.aiModel !== DEFAULT_SETTINGS.aiModel
        ? this.plugin.settings.aiModel || 'auto'
        : 'auto';
    };
    let feedback: { text: string; error?: boolean } | undefined;
    let forceRefresh = false;

    const providerRow = card.createDiv();
    const controls = card.createDiv();
    const modelControls = card.createDiv({ cls: 'nutegg-subscription-models' });

    const refresh = async () => {
      // Saving a provider can rebuild the whole tab. A detached view must never
      // invalidate the replacement view's in-flight checks.
      if (this.subscriptionCard !== card || this.aiConnectionMode() !== 'subscription') return;
      clearTimeout(this.setupTimer);
      const request = ++this.setupRequest;
      const isCurrent = () => this.subscriptionCard === card && request === this.setupRequest &&
        this.aiConnectionMode() === 'subscription';
      const current = provider;
      const force = forceRefresh;
      forceRefresh = false;
      providerRow.empty();
      controls.empty();
      modelControls.empty();
      {
        const cached = this.plugin.settings.subscriptionModels?.[current];
        let models: string[] =
          cached && cached.length > 0 ? [...cached] : [...(DEFAULT_SUBSCRIPTION_MODELS[current] || ['auto'])];
        if (!models.includes('auto')) models.unshift('auto');

        const currentModel = selectedModel(current);
        const isCustom = !models.includes(currentModel) && currentModel !== '';

        let customInputSetting: Setting | null = null;
        let dropdownComponent: any = null;

        new Setting(modelControls)
          .setName(t('subscriptionModelChoice'))
          .setDesc(t('subscriptionModelChoiceDesc'))
          .addDropdown(dropdown => {
            dropdownComponent = dropdown;
            for (const m of models) {
              dropdown.addOption(m, m === 'auto' ? t('subscriptionAuto') : m);
            }
            dropdown.addOption('__custom__', t('customModelTag'));
            dropdown.setValue(isCustom ? '__custom__' : currentModel);
            dropdown.onChange(async val => {
              if (!isCurrent()) return;
              this.plugin.subscriptions.clearModelFailure?.(current);
              if (val === '__custom__') {
                if (customInputSetting?.settingEl) customInputSetting.settingEl.hidden = false;
              } else {
                if (customInputSetting?.settingEl) customInputSetting.settingEl.hidden = true;
                this.plugin.settings.aiProvider = current;
                this.plugin.settings.aiAuthMethod = 'subscription';
                this.plugin.settings.aiModel = val;
                await this.plugin.saveSettings();
                if (!isCurrent()) return;
                this.plugin.aiClient = new AIClient(this.plugin.settings, this.plugin.subscriptions);
                this.plugin.aiProcessor = new AIProcessor(this.plugin);
                this.refreshAISettings();
                feedback = undefined;
                void refresh();
              }
            });
          });

        let customDraft = isCustom ? currentModel : '';
        customInputSetting = new Setting(modelControls)
          .setName(t('customModelTag'))
          .addText(text => {
            text
              .setPlaceholder('model-id')
              .setValue(customDraft)
              .onChange(value => {
                customDraft = value.trim();
              });
          })
          .addButton(button =>
            button.setButtonText(t('saveConnectionModel')).onClick(async () => {
              if (!isCurrent()) return;
              if (!/^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,127}$/.test(customDraft)) {
                new Notice(t('customModelTag'));
                return;
              }
              button.setDisabled(true);
              try {
                this.plugin.subscriptions.clearModelFailure?.(current);
                if (this.plugin.server) {
                  await this.plugin.server.changeSubscription({ provider: current, model: customDraft });
                } else {
                  this.plugin.settings.aiModel = customDraft;
                  await this.plugin.saveSettings();
                }
                if (!isCurrent()) return;
                feedback = undefined;
                this.refreshAISettings();
                void refresh();
              } catch (error) {
                new Notice(String(error));
              } finally {
                button.setDisabled(false);
              }
            })
          );
        if (customInputSetting.settingEl) customInputSetting.settingEl.hidden = !isCustom;

        const modelHint = modelControls.createEl('p', {
          text: t('connectionModelCheck'),
          cls: 'nutegg-model-refresh-hint',
          attr: { role: 'status', 'aria-live': 'polite' },
        });
        modelHint.dataset.state = 'loading';
        // Fetch fresh model list in background and update dropdown & settings
        void (async () => {
          try {
            const fetched = await this.boundedSettingsCheck(this.plugin.subscriptions.models(current, force));
            if (request !== this.setupRequest) return;
            if (!Array.isArray(fetched) || fetched.length === 0) throw new Error(t('settingsModelsUnavailable'));
            const normalized = fetched.includes('auto') ? fetched : ['auto', ...fetched];
            const hasDiff = normalized.length !== models.length || normalized.some((m, i) => m !== models[i]);
            if (hasDiff) {
              (this.plugin.settings.subscriptionModels ||= {})[current] = normalized;
              await this.plugin.saveSettings();
              models = normalized;
              if (dropdownComponent && request === this.setupRequest) {
                const selectEl = dropdownComponent.selectEl;
                if (selectEl) {
                  const activeVal = dropdownComponent.getValue();
                  selectEl.innerHTML = '';
                  for (const m of normalized) {
                    dropdownComponent.addOption(m, m === 'auto' ? t('subscriptionAuto') : m);
                  }
                  dropdownComponent.addOption('__custom__', t('customModelTag'));
                  if (activeVal !== '__custom__' && !normalized.includes(activeVal))
                    dropdownComponent.addOption(activeVal, activeVal);
                  dropdownComponent.setValue(activeVal);
                }
              }
            }
            if (request === this.setupRequest) {
              modelHint.setText(t('settingsModelsUpdated'));
              modelHint.dataset.state = 'ready';
            }
          } catch {
            if (request === this.setupRequest) {
              modelHint.setText(t('settingsModelsUnavailable'));
              modelHint.dataset.state = 'waiting';
            }
          }
        })();
      }

      const checkingLine = controls.createEl('p', {
        text: t('checking'),
        cls: 'setting-item-description nutegg-connection-status-line',
      });
      checkingLine.dataset.status = 'in-process';
      let status;
      try {
        status = await this.boundedSettingsCheck(this.plugin.subscriptions.status(current, force));
      } catch (error) {
        status = { state: 'error' as const, message: String(error) };
      }
      const subActive =
        this.plugin.settings.subscriptionEnabled && this.plugin.settings.aiAuthMethod === 'subscription';
      if (request !== this.setupRequest || !subActive) return;
      this.accountState = status.state;
      this.refreshConnectionStatus();
      controls.empty();

      const buttons: ButtonComponent[] = [];
      const isMissing = status.state === 'missing';
      const isSigningIn = Boolean(status.loginId || status.state === 'signing_in');

      const providerSetting = new Setting(providerRow).setName(this.subscriptionLabel(current));

      // 1. Authorize subscription (or cancel)
      if (isSigningIn) {
        providerSetting.addButton(button => {
          buttons.push(button);
          button.setButtonText(t('cancel')).onClick(async () => {
            if (!isCurrent()) return;
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
              if (!isCurrent()) return;
              clearTimeout(this.setupTimer);
              for (const item of buttons) item.setDisabled(true);
              const isTest = ['ready', 'unverified'].includes(status.state) || status.errorCode === 'model_not_found';
              result.setText(t(isTest ? 'subscriptionTesting' : 'checking'));
              result.dataset.status = 'in-process';
              result.style.color = 'var(--text-muted)';
              try {
                let outcome: { state?: string; message?: string } | undefined;
                if (isTest) {
                  this.plugin.subscriptions?.clearModelFailure?.(current);
                  const testModel = selectedModel(current);
                  outcome = await this.plugin.subscriptions.test(current, testModel);
                  const subActive =
                    this.plugin.settings.subscriptionEnabled && this.plugin.settings.aiAuthMethod === 'subscription';
                  if (request !== this.setupRequest || !subActive) return;
                  const passed = outcome?.state === 'ready';
                  if (passed) {
                    this.plugin.settings.aiProvider = current;
                    this.plugin.settings.aiAuthMethod = 'subscription';
                    this.plugin.settings.aiModel = testModel;
                    await this.plugin.saveSettings();
                    if (!isCurrent()) return;
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
                const subActive =
                  this.plugin.settings.aiAuthMethod === 'subscription' && this.plugin.settings.subscriptionEnabled;
                if (request === this.setupRequest && subActive) {
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
          if (!isCurrent()) return;
          clearTimeout(this.setupTimer);
          for (const item of buttons) item.setDisabled(true);
          this.plugin.subscriptions?.clearModelFailure?.(current);
          feedback = undefined;
          forceRefresh = true;
          await refresh();
        });
      });

      const result = controls.createEl('p', {
        cls: 'setting-item-description nutegg-subscription-test-result',
        attr: { role: 'status', 'aria-live': 'polite' },
      });
      const showFeedback = () => {
        result.setText(feedback?.text || '');
        if (feedback?.text) {
          result.dataset.status = feedback.error ? 'disconnected' : 'connected';
        } else {
          delete result.dataset.status;
        }
        result.style.color = feedback?.error ? 'var(--text-error)' : 'var(--text-success)';
      };
      showFeedback();

      const isConnected = status.state === 'ready';
      const isInProcess = isSigningIn || status.state === 'signing_in';
      const statusKind = isConnected ? 'connected' : isInProcess ? 'in-process' : 'disconnected';

      if (isMissing) {
        const missingLine = controls.createEl('div', { cls: 'nutegg-connection-status-line' });
        missingLine.dataset.status = 'disconnected';
        missingLine.createSpan({ text: status.message || t('aiConnectionUnavailable') });
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
        const connSetting = new Setting(controls)
          .setName(t('subscriptionConnection'))
          .setDesc(status.usageRemaining ? `${status.message} · ${status.usageRemaining}` : status.message);
        if ((connSetting as any).settingEl) {
          (connSetting as any).settingEl.classList.add('nutegg-connection-setting-item');
          (connSetting as any).settingEl.dataset.status = statusKind;
        }
      }

      if (status.installUrl) {
        const links = controls.createDiv({ cls: 'nutegg-subscription-links' });
        links.createEl('a', {
          text: t('subscriptionInstall'),
          href: status.installUrl,
          attr: { target: '_blank', rel: 'noopener noreferrer' },
        });
      }

      if (status.loginId || status.state === 'signing_in')
        this.setupTimer = setTimeout(() => {
          void refresh();
        }, 3000);
    };

    void refresh();
  }

  private displayAdvancedSettings(containerEl: HTMLElement, settings: NutEggSettings): void {
    const modelSection = containerEl.createDiv({ cls: 'nutegg-settings-section nutegg-model-config-section' });
    modelSection.createEl('h3', { text: t('aiModelConfig') });
    if (!this.aiConfigSummary) {
      this.aiConfigSummary = new Setting(modelSection).setDesc(t(
        this.aiConnectionMode() === 'apiKey' ? 'connectedApiProfilesDescription' : 'obsidianAIConnectionsDesc'
      )).addButton(button => {
        this.aiCreditButton = button;
        button
          .setButtonText(t('checking'))
          .setTooltip(t('refresh'))
          .onClick(() => {
            void this.refreshAICredit();
          });
      });
    }
    this.aiChunkWindow = new Setting(modelSection);
    this.aiMaxTokens = new Setting(modelSection);
    this.refreshAISettings();

    if (settings.subscriptionEnabled && settings.aiAuthMethod === 'subscription') {
      for (const provider of ['openai', 'anthropic', 'google'] as const) {
        new Setting(modelSection)
          .setName(`${this.subscriptionLabel(provider)} · ${t('subscriptionPath')}`)
          .setDesc(t('subscriptionPathHint'))
          .addText(text => {
            let currentVal = settings.subscriptionPaths?.[provider] || '';
            if (!currentVal && this.plugin.subscriptions) {
              void this.plugin.subscriptions
                .resolve(provider)
                .then(autoPath => {
                  if (autoPath && !text.inputEl.value) {
                    text.setValue(autoPath);
                    (settings.subscriptionPaths ||= {})[provider] = autoPath;
                    void this.plugin.saveSettings();
                  }
                })
                .catch(() => {});
            }
            text.setValue(currentVal).onChange(async value => {
              (settings.subscriptionPaths ||= {})[provider] = value.trim();
              await this.plugin.saveSettings();
            });
          });
      }
    }

    // ==========================================
    // Server
    // ==========================================
    containerEl.createEl('h3', { text: t('serverHeader') });

    new Setting(containerEl)
      .setName(t('serverPort'))
      .setDesc(t('serverPortDesc'))
      .addText(text =>
        text
          .setPlaceholder('27123')
          .setValue(String(settings.serverPort))
          .onChange(async value => {
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
    containerEl.createEl('h3', { text: t('linksHeader') });

    new Setting(containerEl)
      .setName(t('nuteggChromeStoreName'))
      .setDesc(t('nuteggChromeStoreDesc'))
      .addButton(btn =>
        btn.setButtonText(t('openChromeWebStore')).onClick(() => {
          window.open('https://chromewebstore.google.com/detail/nutegg/bmdmdiicembobejibggoeiahaonphcol', '_blank');
        })
      );

    new Setting(containerEl)
      .setName(t('nuteggObsidianPluginName'))
      .setDesc(t('nuteggObsidianPluginDesc'))
      .addButton(btn =>
        btn.setButtonText(t('openObsidianDirectory')).onClick(() => {
          window.open('https://community.obsidian.md/plugins/nutegg', '_blank');
        })
      );
  }

  private displayLanguageSettings(containerEl: HTMLElement, settings: NutEggSettings): void {}
}
