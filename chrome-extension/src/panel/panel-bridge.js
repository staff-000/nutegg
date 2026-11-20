/* The fragment is a single-use grant, never a trusted tab identifier. */
globalThis.NutEggPanel = {
  embedded: typeof window !== 'undefined' && window.top != null && window !== window.top,
  async initialize() {
    if (!this.embedded) return null;
    const grant = new URLSearchParams(location.hash.slice(1)).get('panel');
    const result = await chrome.runtime.sendMessage({ action: 'panel-register', grant });
    if (result?.error || !Number.isInteger(result?.tabId)) throw new Error('Unauthorized NutEgg panel');
    this.context = result;
    history.replaceState(null, '', location.pathname);
    return result;
  },
  send(action, extra = {}) {
    return chrome.runtime.sendMessage({ action, tabId: this.context?.tabId, ...extra });
  },
  async restore(manager, tabId) {
    const result = await this.send('panel-transfer-get', { tabId });
    const tab = manager.getTab(tabId);
    if (result?.transfer && tab && !manager.isBusy(tabId))
      manager.dispatch({
        type: 'panelTransferRestored',
        tabId,
        pageGeneration: tab.pageGeneration,
        snapshot: result.transfer,
      });
  },
  classifyCapture(capture, base = {}) {
    const available =
      !!capture?.content?.trim() &&
      capture.transcriptAvailable !== false &&
      !['not_ready', 'unavailable'].includes(capture.extractionStatus) &&
      !capture.captureCoverage?.reasons?.includes('access_restricted');
    return {
      ...base,
      minutes: available ? NutEggRules.readingMinutes(capture.content) : null,
      contentAvailable: available,
      readingProvenance: 'capture',
    };
  },
  async mount({ manager }) {
    this.manager = manager;
    const context = this.context;
    const ownerTabId =
      context?.tabId ?? manager.activeTabId ?? (await chrome.tabs.query({ active: true, currentWindow: true }))[0]?.id;
    if (!context) {
      void this.send('panel-native-opened', { tabId: manager.activeTabId ?? ownerTabId });
      window.addEventListener(
        'pagehide',
        () => void this.send('panel-native-closed', { tabId: manager.activeTabId ?? ownerTabId })
      );
    }
    if (typeof document?.createElement !== 'function') return;

    const t = (key, params) => (globalThis.NutEggI18n ? globalThis.NutEggI18n.t(key, params) : key);

    // Compact icon controls inside existing .header-actions (no extra mode bar!)
    const headerActions = document.querySelector?.('.header-actions');
    const container = document.querySelector?.('.popup-container');

    for (const existing of document.querySelectorAll?.('[data-nutegg-panel-ctrl]') || []) existing.remove();

    const modeBtn = document.createElement('button');
    modeBtn.type = 'button';
    modeBtn.className = 'panel-icon-button panel-switch-icon-btn';
    modeBtn.setAttribute('data-nutegg-panel-ctrl', '');
    const modeHint = t(context ? 'panelUseNative' : 'panelUseInjected');
    modeBtn.setAttribute('data-hint', modeHint);
    modeBtn.setAttribute('aria-label', modeHint);
    modeBtn.innerHTML =
      '<svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="2.5" y="3.5" width="15" height="13" rx="2"/><path d="M12 4v12"/></svg>';

    const status = document.createElement('div');
    status.className = 'panel-status hidden';
    status.setAttribute('role', 'status');
    status.setAttribute('data-nutegg-panel-ctrl', '');

    modeBtn.addEventListener('click', async () => {
      const tabId = context?.tabId ?? manager.activeTabId ?? ownerTabId;
      const tab = manager.getTab(tabId);
      const transfer = tab
        ? Object.fromEntries(
            [
              'url',
              'extractedContent',
              'analysisResult',
              'stage1Payload',
              'stage1ContentAnalysis',
              'currentNutId',
              'captureHistory',
              'followUpQa',
              'selectedEggs',
              'preSelectedEggs',
              'customQuestions',
              'followupDraft',
              'customQuestionsScope',
              'followupScope',
              'enabledSections',
              'generateKnowledgeEntries',
              'optimizeForConversation',
              'currentView',
              'presentation',
              'nutCollected',
              'eggHatched',
            ].map(key => [key, tab[key]])
          )
        : null;
      const result = await this.send('panel-switch', { tabId, transfer, mode: context ? 'native' : 'injected' });
      if (result?.error) {
        status.textContent = t('panelRestricted');
        status.classList.remove('hidden');
      } else if (!context) {
        window.close?.();
      }
    });

    const ruleBar = document.createElement('div');
    ruleBar.className = 'panel-smart-rule-bar';
    ruleBar.setAttribute('data-nutegg-panel-ctrl', '');

    const controls = context ? [modeBtn, ruleBar] : [modeBtn];
    if (context) {
      const close = document.createElement('button');
      close.type = 'button';
      close.className = 'panel-icon-button panel-close-button';
      close.setAttribute('data-nutegg-panel-ctrl', '');
      close.innerHTML =
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
      close.setAttribute('data-hint', t('panelClose'));
      close.setAttribute('aria-label', t('panelClose'));
      close.addEventListener('click', () => void this.send('panel-close'));
      controls.push(close);
    }

    if (headerActions) {
      headerActions.append(...controls);
    } else if (container) {
      const fallbackRow = document.createElement('div');
      fallbackRow.className = 'panel-header-fallback';
      fallbackRow.setAttribute('data-nutegg-panel-ctrl', '');
      fallbackRow.append(...controls);
      container.prepend(fallbackRow);
    }

    if (!context && (await chrome.storage.session?.get?.('panelRestrictedHint'))?.panelRestrictedHint) {
      status.textContent = t('panelRestricted');
      status.classList.remove('hidden');
      await chrome.storage.session.remove('panelRestrictedHint');
    }

    if (container) {
      const topSlot = document.createElement('div');
      topSlot.className = 'panel-top-slot';
      topSlot.setAttribute('data-nutegg-panel-ctrl', '');
      const activityEl = container.querySelector?.('#analysis-activity');
      if (activityEl) topSlot.append(activityEl);
      topSlot.append(status);
      const headerEl = container.querySelector?.('.header');
      if (headerEl) {
        headerEl.after(topSlot);
        if (context && !headerEl.hasAttribute('data-nutegg-draggable')) {
          headerEl.setAttribute('data-nutegg-draggable', '');
          let drag = null;
          const finishDrag = (event, cancel = false) => {
            if (!drag || event.pointerId !== drag.pointerId) return;
            if (drag.started) {
              headerEl.removeAttribute('data-nutegg-dragging');
              window.parent?.postMessage?.(
                { action: 'nutegg-panel-drag-end', dx: event.screenX - drag.startX, cancel },
                '*'
              );
            }
            if (headerEl.hasPointerCapture?.(event.pointerId)) headerEl.releasePointerCapture(event.pointerId);
            drag = null;
          };
          headerEl.addEventListener('pointerdown', event => {
            if (event.button !== 0 || event.target.closest?.('button, [role="button"], a, input, select, textarea'))
              return;
            drag = { pointerId: event.pointerId, startX: event.screenX, started: false };
            headerEl.setPointerCapture?.(event.pointerId);
          });
          headerEl.addEventListener('pointermove', event => {
            if (!drag || event.pointerId !== drag.pointerId) return;
            const dx = event.screenX - drag.startX;
            if (!drag.started) {
              if (Math.abs(dx) < 4) return;
              drag.started = true;
              headerEl.setAttribute('data-nutegg-dragging', '');
              window.parent?.postMessage?.({ action: 'nutegg-panel-drag-start' }, '*');
            }
            window.parent?.postMessage?.({ action: 'nutegg-panel-drag-move', dx }, '*');
          });
          headerEl.addEventListener('pointerup', event => finishDrag(event, false));
          headerEl.addEventListener('pointercancel', event => finishDrag(event, true));
        }
      } else {
        container.prepend(topSlot);
      }
    }

    let lastRuleBarKey = '';
    document.addEventListener('click', e => {
      if (!ruleBar.contains(e.target)) {
        const menuEl = ruleBar.querySelector('.smart-rule-menu');
        const triggerEl = ruleBar.querySelector('.smart-rule-trigger');
        if (menuEl && !menuEl.classList.contains('hidden')) {
          menuEl.classList.add('hidden');
          triggerEl?.setAttribute('aria-expanded', 'false');
        }
      }
    });
    const resolveHostname = rawUrl => {
      if (!rawUrl || !/^https?:/.test(rawUrl)) return '';
      try {
        return (
          globalThis.NutEggRules?.rootDomain?.(rawUrl) ||
          new URL(rawUrl).hostname.replace(/^www\./, '').toLowerCase()
        );
      } catch {
        return '';
      }
    };
    const renderRuleBar = ({ hostname = '', website = '', author = null, topics = [], isAutoOpened = false, isSiteAllowed = false, info = {} }) => {
      const key = `${hostname}|${author || ''}|${topics.join(',')}|${isAutoOpened}|${info.decision?.ruleId || ''}|${info.minutes ?? ''}|${isSiteAllowed}`;
      if (key === lastRuleBarKey) return;
      lastRuleBarKey = key;

      ruleBar.replaceChildren();
      const action = isAutoOpened ? 'block' : 'allow';
      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = `panel-icon-button smart-rule-trigger ${isAutoOpened ? 'is-muted' : 'is-active'}`;
      trigger.setAttribute('aria-expanded', 'false');
      const targetLabel = hostname || 'this site';
      const hintText = isAutoOpened
        ? `Auto-opened on ${targetLabel} (click to mute)`
        : `Manually opened on ${targetLabel} (click for auto-open rules)`;
      trigger.setAttribute('data-hint', hintText);
      trigger.setAttribute('aria-label', hintText);
      // Auto-opened / matches auto-open rule -> show Mute (bell-slash); Manually opened -> show Ring (bell)
      trigger.innerHTML = isAutoOpened
        ? '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M18.63 13A17.89 17.89 0 0 1 18 8"/><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"/><path d="M18 8a6 6 0 0 0-9.33-5"/><line x1="1" y1="1" x2="23" y2="23"/></svg>'
        : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';

      const menu = document.createElement('div');
      menu.className = 'smart-rule-menu hidden';
      const toggleMenu = (open = menu.classList.contains('hidden')) => {
        menu.classList.toggle('hidden', !open);
        trigger.setAttribute('aria-expanded', String(!!open));
      };
      trigger.addEventListener('click', e => {
        e.stopPropagation();
        toggleMenu();
      });

      const saveAndConfirm = async (ruleDraft, savedLabel) => {
        const res = await this.send('panel-save-rule', { rule: ruleDraft });
        if (!res?.ok) return;
        menu.replaceChildren();
        const confirmRow = document.createElement('div');
        confirmRow.className = 'smart-rule-confirm-row';
        const savedMsg = document.createElement('span');
        savedMsg.className = 'smart-rule-saved';
        savedMsg.textContent = `✓ ${savedLabel || (ruleDraft.action === 'allow' ? 'Auto-open saved' : 'Muted')}`;
        const undoBtn = document.createElement('button');
        undoBtn.type = 'button';
        undoBtn.className = 'smart-rule-chip';
        undoBtn.textContent = 'Undo';
        undoBtn.addEventListener('click', async () => {
          await this.send('panel-delete-rule', { id: res.rule.id });
          toggleMenu(false);
          lastRuleBarKey = '';
          void refreshRuleBar();
        });
        confirmRow.append(savedMsg, undoBtn);
        menu.append(confirmRow);
        toggleMenu(true);
        setTimeout(() => {
          toggleMenu(false);
          lastRuleBarKey = '';
          void refreshRuleBar();
        }, 3500);
      };

      const addMenuItem = (text, onClick) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'smart-rule-menu-item';
        item.textContent = text;
        item.addEventListener('click', onClick);
        menu.append(item);
      };

      if (hostname) {
        const reason = document.createElement('div');
        reason.className = 'smart-rule-reason';
        if (isAutoOpened) {
          reason.textContent = `Auto-opened on ${hostname}`;
        } else if (isSiteAllowed) {
          if (info.listing) {
            reason.textContent = `${hostname} is auto-open (skipped on feed/list URL)`;
          } else if (info.minutes != null && info.minutes < 3) {
            reason.textContent = `${hostname} is auto-open (3+ min, this page is ${info.minutes} min)`;
          } else if (info.decision?.ruleId && !info.decision?.open) {
            reason.textContent = `Blocked by rule: ${info.decision.name || hostname}`;
          } else {
            reason.textContent = `Manually opened (${hostname} auto-opens at 3+ min)`;
          }
        } else {
          reason.textContent = `Auto-open is off for ${hostname}`;
        }
        menu.append(reason);

        if (isAutoOpened) {
          addMenuItem(`🔕 Mute all of ${hostname}`, () =>
            void saveAndConfirm(
              {
                action: 'block',
                hostname,
                website,
                name: hostname,
              },
              `Muted ${hostname}`
            )
          );
          if (author) {
            addMenuItem(`🔕 Mute "${author}" on ${hostname}`, () =>
              void saveAndConfirm(
                {
                  action: 'block',
                  hostname,
                  website,
                  name: `${hostname} · ${author}`,
                  topics: [author],
                },
                `Muted ${author}`
              )
            );
          }
          if (topics[0] && topics[0] !== author) {
            const topic = topics[0];
            addMenuItem(`🔕 Mute topic "${topic}" on ${hostname}`, () =>
              void saveAndConfirm(
                {
                  action: 'block',
                  hostname,
                  website,
                  name: `${hostname} · ${topic}`,
                  topics: [topic],
                },
                `Muted ${topic}`
              )
            );
          }
        } else {
          if (isSiteAllowed) {
            if (!info.listing) {
              addMenuItem(`🔔 Allow short pages on ${hostname} (0+ min)`, () =>
                void saveAndConfirm(
                  {
                    action: 'allow',
                    hostname,
                    website,
                    name: hostname,
                    minMinutes: 0,
                    excludeListings: true,
                  },
                  'Allowed 0+ min'
                )
              );
            }
          } else {
            addMenuItem(`🔔 Auto-open all of ${hostname}`, () =>
              void saveAndConfirm(
                {
                  action: 'allow',
                  hostname,
                  website,
                  name: hostname,
                  excludeListings: true,
                },
                `Auto-open ${hostname}`
              )
            );
          }
          if (author) {
            addMenuItem(`🔔 Auto-open "${author}" on ${hostname}`, () =>
              void saveAndConfirm(
                {
                  action: 'allow',
                  hostname,
                  website,
                  name: `${hostname} · ${author}`,
                  topics: [author],
                },
                `Auto-open ${author}`
              )
            );
          }
          if (topics[0] && topics[0] !== author) {
            const topic = topics[0];
            addMenuItem(`🔔 Auto-open topic "${topic}" on ${hostname}`, () =>
              void saveAndConfirm(
                {
                  action: 'allow',
                  hostname,
                  website,
                  name: `${hostname} · ${topic}`,
                  topics: [topic],
                },
                `Auto-open ${topic}`
              )
            );
          }
          if (isSiteAllowed) {
            addMenuItem(`🔕 Mute all of ${hostname}`, () =>
              void saveAndConfirm(
                {
                  action: 'block',
                  hostname,
                  website,
                  name: hostname,
                },
                `Muted ${hostname}`
              )
            );
          }
        }
      }

      addMenuItem('⚙️ Customize in Settings…', () => {
        toggleMenu(false);
        void this.send('panel-open-rule-editor', {
          rule: {
            action,
            ...(hostname ? { hostname, website, name: hostname } : {}),
            ...(author || topics[0] ? { topics: [author || topics[0]] } : {}),
          },
        });
      });

      ruleBar.append(trigger, menu);
      ruleBar.classList.remove('hidden');
    };
    const refreshRuleBar = async () => {
      if (!context) return;
      const tabId = context.tabId ?? manager.activeTabId;
      const tab = manager.getTab(tabId);
      const rawUrl = tab?.url || context?.key || '';
      const info = (await this.send('panel-get-suggestion', { tabId }).catch(() => null)) || {};
      const hostname = info.hostname || resolveHostname(rawUrl);
      const website =
        info.website || (hostname && globalThis.NutEggRules?.websiteRegex ? globalThis.NutEggRules.websiteRegex(hostname) : hostname);
      const author = info.author || tab?.extractedContent?.metadata?.author || null;
      const topics = info.topics?.length
        ? info.topics
        : tab?.analysisResult?.topics || tab?.extractedContent?.metadata?.topics || [];
      const hasDecision = info.decision && typeof info.decision.open === 'boolean';
      const isAutoOpened = hasDecision
        ? Boolean(info.decision.open)
        : Boolean(
            info.automatic ||
              context?.automatic ||
              (typeof tab?.panelClassification?.open === 'boolean'
                ? tab.panelClassification.open
                : tab?.panelClassification?.automatic)
          );
      const isSiteAllowed = Boolean(
        info.isSiteAllowed ??
          (hostname && (globalThis.NutEggRules?.DEFAULT_WHITELIST_HOSTS || []).includes(hostname))
      );
      renderRuleBar({ hostname, website, author, topics, isAutoOpened, isSiteAllowed, info });
    };

    if (context) {
      const initialTab = manager.getTab(context.tabId ?? manager.activeTabId);
      const initialHost = resolveHostname(initialTab?.url || context?.key || '');
      const initialWebsite =
        initialHost && globalThis.NutEggRules?.websiteRegex ? globalThis.NutEggRules.websiteRegex(initialHost) : initialHost;
      // Show icon immediately: Mute if auto-opened, Ring first when manually opened.
      renderRuleBar({
        hostname: initialHost,
        website: initialWebsite,
        isAutoOpened: Boolean(context.automatic),
        isSiteAllowed: Boolean(initialHost && (globalThis.NutEggRules?.DEFAULT_WHITELIST_HOSTS || []).includes(initialHost)),
      });
    }

    const decision =
      context?.decision ||
      (await this.send('panel-test-rules', { tabId: manager.activeTabId ?? ownerTabId }))?.decision;
    const seedKey = context?.key || (await chrome.tabs.get(ownerTabId))?.url;
    let sourcePublished = '';
    const syncClassification = () => {
      const tab = manager.getTab(manager.activeTabId);
      if (!tab) return;
      const key = globalThis.NutEggPageIdentity.capturePageKey(tab.url || '');
      const initial = key === globalThis.NutEggPageIdentity.capturePageKey(seedKey || '') ? decision : null;
      const base = {
        ...(tab.panelClassification || initial || {}),
        automatic: Boolean(context?.automatic),
      };
      if (!tab.extractedContent) {
        if (!tab.panelClassification && initial)
          manager.dispatch({
            type: 'panelClassification',
            tabId: tab.tabId,
            pageGeneration: tab.pageGeneration,
            value: base,
          });
        return;
      }
      const fingerprint = JSON.stringify([
        tab.tabId,
        tab.pageGeneration,
        tab.sourceVersion,
        tab.extractedContent.content?.length,
        tab.extractedContent.transcriptAvailable,
      ]);
      if (sourcePublished === fingerprint) return;
      sourcePublished = fingerprint;
      const value = this.classifyCapture(tab.extractedContent, base);
      manager.dispatch({ type: 'panelClassification', tabId: tab.tabId, pageGeneration: tab.pageGeneration, value });
      const meta = tab.extractedContent.metadata || {};
      void this.send('panel-capture-metrics', {
        tabId: tab.tabId,
        key,
        minutes: value.minutes,
        contentAvailable: value.contentAvailable,
        ...(typeof meta.author === 'string' && meta.author.trim() ? { author: meta.author.trim() } : {}),
        ...(meta.media_kind ? { mediaKind: meta.media_kind } : {}),
        ...(Number.isFinite(meta.video_duration_seconds) ? { videoDurationSeconds: meta.video_duration_seconds } : {}),
      }).then(res => {
        if (res?.decision && manager.getTab(tab.tabId)?.pageGeneration === tab.pageGeneration) {
          manager.dispatch({
            type: 'panelClassification',
            tabId: tab.tabId,
            pageGeneration: tab.pageGeneration,
            value: { ...value, ...res.decision },
          });
        }
        return refreshRuleBar();
      });
    };
    manager.subscribe(syncClassification);
    syncClassification();
    if (context) void refreshRuleBar();

    let published = '';
    manager.subscribe(() => {
      const tab = manager.getTab(manager.activeTabId),
        metadata = tab?.analysisResult?.contentMetadata;
      if (!metadata || !tab?.url) return;
      const fingerprint = JSON.stringify([tab.url, metadata]);
      if (fingerprint === published) return;
      published = fingerprint;
      void this.send('panel-cache-metadata', {
        tabId: manager.activeTabId,
        key: globalThis.NutEggPageIdentity.capturePageKey(tab.url),
        metadata,
      }).then(() => refreshRuleBar());
    });
  },
  async maybeAutoAnalyze({ manager, analyzeAction }) {
    const context = this.context;
    if (context?.automatic && context.settings.autoAnalyze) {
      // Startup has already recovered existing results and finished extraction.
      const tab = manager.getTab(context.tabId);
      if (
        !tab?.analysisResult &&
        !manager.isBusy(context.tabId) &&
        tab?.extractedContent?.content &&
        !analyzeAction.getAnalyzeNotReadyReason()
      ) {
        const claim = await this.send('panel-auto-claim');
        if (claim?.allowed) await analyzeAction.handleAnalyze();
      }
    }
  },
};
globalThis.NutEggPanel.ready = globalThis.NutEggPanel.initialize();
