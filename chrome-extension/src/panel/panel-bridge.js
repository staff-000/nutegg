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
      }
    });

    const controls = [modeBtn];
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

    // Quiet, dismissible in-panel smart rule bar
    const ruleBar = document.createElement('div');
    ruleBar.className = 'panel-smart-rule-bar hidden';
    ruleBar.setAttribute('data-nutegg-panel-ctrl', '');

    if (container) {
      const headerEl = container.querySelector?.('.header');
      if (headerEl) {
        headerEl.after(status, ruleBar);
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
        container.prepend(status, ruleBar);
      }
    }

    let lastRuleBarKey = '';
    const refreshRuleBar = async () => {
      const tabId = context?.tabId ?? manager.activeTabId;
      const tab = manager.getTab(tabId);
      if (!tab?.url || !/^https?:/.test(tab.url)) {
        ruleBar.classList.add('hidden');
        return;
      }
      const info = await this.send('panel-get-suggestion', { tabId }).catch(() => null);
      if (!info || !info.hostname || info.dismissed) {
        ruleBar.classList.add('hidden');
        return;
      }
      const key = `${info.hostname}|${info.author || ''}|${(info.topics || []).join(',')}|${info.automatic}|${info.decision?.ruleId || ''}`;
      if (key === lastRuleBarKey) return;
      lastRuleBarKey = key;

      // Only show if auto-opened (quick mute) or if manually opened on a site without an explicit custom rule
      const hasCustomRule = !!(info.decision?.ruleId && info.decision.name !== 'panelStarter');
      if (!info.automatic && hasCustomRule) {
        ruleBar.classList.add('hidden');
        return;
      }

      ruleBar.replaceChildren();
      const label = document.createElement('span');
      label.className = 'smart-rule-label';
      label.textContent = info.automatic ? '⚡ Auto-opened' : '⚡ Auto-open?';
      ruleBar.append(label);

      const action = info.automatic ? 'block' : 'allow';
      const prefix = info.automatic ? 'Mute' : '+';
      const saveAndConfirm = async ruleDraft => {
        const res = await this.send('panel-save-rule', { rule: ruleDraft });
        if (!res?.ok) return;
        ruleBar.replaceChildren();
        const savedMsg = document.createElement('span');
        savedMsg.className = 'smart-rule-saved';
        savedMsg.textContent = `✓ ${action === 'allow' ? 'Whitelisted' : 'Muted'}`;
        const undoBtn = document.createElement('button');
        undoBtn.type = 'button';
        undoBtn.className = 'smart-rule-chip';
        undoBtn.textContent = 'Undo';
        undoBtn.addEventListener('click', async () => {
          await this.send('panel-delete-rule', { id: res.rule.id });
          ruleBar.classList.add('hidden');
        });
        ruleBar.append(savedMsg, undoBtn);
        setTimeout(() => ruleBar.classList.add('hidden'), 6000);
      };

      if (info.author) {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'smart-rule-chip';
        chip.textContent = `${prefix} ${info.hostname} · ${info.author}`;
        chip.addEventListener('click', () =>
          void saveAndConfirm({
            action,
            hostname: info.hostname,
            website: info.website,
            name: `${info.hostname} · ${info.author}`,
            topics: [info.author],
          })
        );
        ruleBar.append(chip);
      } else {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'smart-rule-chip';
        chip.textContent = `${prefix} ${info.hostname}`;
        chip.addEventListener('click', () =>
          void saveAndConfirm({
            action,
            hostname: info.hostname,
            website: info.website,
            name: info.hostname,
          })
        );
        ruleBar.append(chip);
      }

      if (info.topics?.[0] && info.topics[0] !== info.author) {
        const topic = info.topics[0];
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'smart-rule-chip';
        chip.textContent = `${prefix} ${topic}`;
        chip.addEventListener('click', () =>
          void saveAndConfirm({
            action,
            hostname: info.hostname,
            website: info.website,
            name: `${info.hostname} · ${topic}`,
            topics: [topic],
          })
        );
        ruleBar.append(chip);
      }

      const dismiss = document.createElement('button');
      dismiss.type = 'button';
      dismiss.className = 'smart-rule-dismiss';
      dismiss.textContent = '×';
      dismiss.setAttribute('aria-label', t('panelDismiss'));
      dismiss.addEventListener('click', async () => {
        ruleBar.classList.add('hidden');
        await this.send('panel-dismiss-suggestion', { hostname: info.hostname });
      });
      ruleBar.append(dismiss);
      ruleBar.classList.remove('hidden');
    };

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
      void this.send('panel-capture-metrics', {
        tabId: tab.tabId,
        key,
        minutes: value.minutes,
        contentAvailable: value.contentAvailable,
      });
      void refreshRuleBar();
    };
    manager.subscribe(syncClassification);
    syncClassification();

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
