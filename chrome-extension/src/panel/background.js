/* Panel broker. Website scripts can submit passive signals, never privileged commands. */
var NutEggPanels = (() => {
  let settings = NutEggRules.normalize(),
    ready,
    offscreenTask;
  const queues = new Map(),
    epochs = new Map(),
    knownKeys = new Map(),
    nativeOpen = new Set();
  const key = tabId => `panel:${tabId}`;
  const pageKey = url => NutEggPageIdentity.capturePageKey(url);
  const injectable = url =>
    /^https?:/.test(url || '') &&
    !/^https:\/\/(?:chromewebstore\.google\.com|chrome\.google\.com\/webstore)(?:[/?#]|$)/.test(url);
  async function state(tabId) {
    return (await chrome.storage.session.get(key(tabId)))[key(tabId)] || {};
  }
  async function save(tabId, value) {
    await chrome.storage.session.set({ [key(tabId)]: value });
  }
  function serial(tabId, fn) {
    const next = (queues.get(tabId) || Promise.resolve()).catch(() => {}).then(fn);
    queues.set(tabId, next);
    next
      .finally(() => {
        if (queues.get(tabId) === next) queues.delete(tabId);
      })
      .catch(() => {});
    return next;
  }
  async function initialize() {
    const saved = (await chrome.storage?.local?.get?.('panelSettings'))?.panelSettings;
    settings = NutEggRules.normalize(saved);
    if (saved?.version !== 2) await chrome.storage?.local?.set?.({ panelSettings: settings });
    await chrome.sidePanel?.setPanelBehavior?.({ openPanelOnActionClick: false });
  }
  ready = initialize();
  chrome.storage?.onChanged?.addListener?.((changes, area) => {
    if (area === 'local' && changes.panelSettings) settings = NutEggRules.normalize(changes.panelSettings.newValue);
  });
  async function evaluate(signals, cached, rules) {
    const targetSettings = rules
      ? { ...settings, openingPolicy: 'custom', defaultOpen: false, rules: rules.slice(0, 200) }
      : settings;
    if (!NutEggRules.hasCustomRegex(targetSettings)) {
      return NutEggRules.decide(targetSettings, signals, cached);
    }
    if (!offscreenTask)
      offscreenTask = (async () => {
        if (!(await chrome.offscreen.hasDocument()))
          await chrome.offscreen.createDocument({
            url: 'src/panel/regex-host.html',
            reasons: ['WORKERS'],
            justification: 'Evaluate user website rules in a terminable worker.',
          });
      })().catch(error => {
        offscreenTask = null;
        throw error;
      });
    await offscreenTask;
    const response = await chrome.runtime.sendMessage({
      action: 'panel-evaluate-regex',
      args: [targetSettings, signals, cached],
    });
    if (response?.error || !response?.result)
      return {
        open: false,
        error: response?.error || 'Rule evaluation unavailable',
        minutes: signals.minutes,
        contentAvailable: signals.contentAvailable,
      };
    return response.result;
  }
  async function send(tabId, message) {
    return chrome.tabs.sendMessage(tabId, message, { frameId: 0 }).catch(() => null);
  }
  async function open(tabId, automatic = false) {
    const tab = await chrome.tabs.get(tabId);
    if (!injectable(tab.url)) return { error: 'panelRestricted' };
    let current = await state(tabId);
    if (current.key !== pageKey(tab.url)) current = { key: pageKey(tab.url) };
    const grant = crypto.randomUUID();
    current = { ...current, grant, frameId: null, opened: true, automatic, autoClaimed: false };
    await save(tabId, current);
    const request = {
      action: 'nutegg-panel-show',
      grant,
      automatic,
      settings,
      decision: current.decision,
      suggestion: current.signals ? suggestion(current, 'allow') : null,
    };
    let result = await send(tabId, request);
    if (!result && !automatic) {
      try {
        const files = chrome.runtime.getManifest().content_scripts.find(entry => entry.js?.includes('src/content/content-script.js')).js;
        await chrome.scripting.executeScript({ target: { tabId }, files });
        result = await send(tabId, request);
      } catch { /* The browser can prohibit injection on otherwise HTTP(S) pages. */ }
    }
    if (!result) {
      await save(tabId, { ...current, opened: false, grant: null });
      return { error: 'panelRestricted' };
    }
    return { ok: true };
  }
  async function close(tabId) {
    const current = await state(tabId);
    await save(tabId, { ...current, opened: false, grant: null, frameId: null, suppressed: true });
    await send(tabId, {
      action: 'nutegg-panel-hide',
      suggest: false,
      settings,
    });
    return { ok: true };
  }
  function trusted(sender) {
    return sender?.id === chrome.runtime.id && sender.url?.startsWith(chrome.runtime.getURL('/'));
  }
  async function authorized(sender) {
    if (!trusted(sender)) return false;
    if (!sender.tab || sender.frameId === 0) return true;
    const current = await state(sender.tab.id);
    return !!(current.opened && current.frameId === sender.frameId && current.key === pageKey(sender.tab.url));
  }
  function suggestion(current, action) {
    const signals = current.signals || {},
      cached = current.cached;
    const author = cached?.author || signals.author;
    const topic = cached?.topics?.[0] || current.decision?.topic;
    return {
      id: crypto.randomUUID(),
      enabled: true,
      action,
      website: NutEggRules.websiteRegex(signals.url),
      hostname: new URL(signals.url).hostname.replace(/^www\./, ''),
      name: new URL(signals.url).hostname,
      ...(author || topic ? { topics: [author || topic] } : {}),
    };
  }
  async function upsertRule(rawRule) {
    const rule = NutEggRules.validate({
      id: rawRule.id || crypto.randomUUID(),
      enabled: rawRule.enabled !== false,
      ...rawRule,
    });
    settings = NutEggRules.customize(settings);
    settings = NutEggRules.normalize({
      ...settings,
      rules: NutEggRules.mergeRule(settings.rules, rule),
    });
    await chrome.storage.local.set({ panelSettings: settings });
    return rule;
  }
  async function handle(message, sender) {
    await ready;
    const tabId = sender.tab?.id;
    if (message.action === 'panel-register') {
      if (!trusted(sender) || tabId == null || !(sender.frameId > 0)) return { error: 'forbidden' };
      return serial(tabId, async () => {
        const current = await state(tabId);
        if (
          !current.opened ||
          !message.grant ||
          current.grant !== message.grant ||
          current.key !== pageKey(sender.tab.url) ||
          current.frameId != null
        )
          return { error: 'forbidden' };
        await save(tabId, { ...current, frameId: sender.frameId });
        return { tabId, key: current.key, automatic: current.automatic, decision: current.decision, settings };
      });
    }
    // Only the top-level isolated content script can submit signals or operate its host.
    if (
      [
        'panel-signals',
        'panel-prefetch-complete',
        'panel-host-close',
        'panel-host-open',
        'panel-suggest-save',
        'panel-suggest-edit',
        'panel-resize',
        'panel-side',
      ].includes(message.action)
    ) {
      if (sender.id !== chrome.runtime.id || tabId == null || sender.frameId !== 0 || !/^https?:/.test(sender.url))
        return { error: 'forbidden' };
      return serial(tabId, async () => {
        const tab = await chrome.tabs.get(tabId);
        if (message.url !== tab.url) return { error: 'stale' };
        let current = await state(tabId);
        if (
          current.key !== pageKey(tab.url) ||
          (current.documentId && sender.documentId && current.documentId !== sender.documentId)
        )
          current = { key: pageKey(tab.url) };
        if (message.action === 'panel-signals') {
          knownKeys.set(tabId, pageKey(tab.url));
          current.documentId = sender.documentId;
          const observedEpoch = epochs.get(tabId) || 0;
          const input = message.signals || {};
          const signals = {
            url: tab.url,
            author: String(input.author || '').slice(0, 300),
            searchText: String(input.searchText || '').slice(0, 40000),
            minutes: Number.isFinite(input.minutes) ? input.minutes : null,
            mediaKind: ['text', 'photo', 'video'].includes(input.mediaKind) ? input.mediaKind : 'unknown',
            videoDurationSeconds: Number.isFinite(input.videoDurationSeconds) && input.videoDurationSeconds > 0 ? input.videoDurationSeconds : null,
            contentAvailable: input.contentAvailable === true,
            listing: input.listing === true,
            ...current.captureMetrics,
          };
          if (!current.cached)
            current.cached = ((await chrome.storage.local.get('panelMetadataCache')).panelMetadataCache || {})[
              current.key
            ];
          const decision = await evaluate(signals, current.cached);
          const latest = await chrome.tabs.get(tabId);
          if ((epochs.get(tabId) || 0) !== observedEpoch || pageKey(latest.url) !== current.key)
            return { error: 'stale' };
          current = { ...current, signals, decision };
          await save(tabId, current);
          const blockedByRule =
            settings.openingPolicy === 'closed' ||
            (decision.ruleId && !decision.open && decision.name !== 'panelStarter' && !String(decision.ruleId).startsWith('default-'));
          if (decision.open && tab.active && settings.mode === 'injected' && !current.suppressed && !current.opened && !blockedByRule && typeof fetchHistory === 'function') {
            const historyRes = await fetchHistory(tab.url).catch(() => null);
            const cachedEntry = historyRes?.latest;
            if (cachedEntry && (cachedEntry.result || cachedEntry.content || cachedEntry.capturePayload)) {
              await open(tabId, true);
              return { decision, settings, shouldPrefetch: false, opened: true, key: current.key, suggestion: suggestion(current, 'allow') };
            }
          }
          let canOpenAfterCapture = decision.open;
          if (!canOpenAfterCapture && !signals.listing && !signals.contentAvailable) {
            const potential = await evaluate({ ...signals, contentAvailable: true, minutes: 999 }, current.cached);
            canOpenAfterCapture = Boolean(potential?.open);
          }
          const shouldPrefetch = !!(
            tab.active &&
            settings.mode === 'injected' &&
            canOpenAfterCapture &&
            !current.suppressed &&
            !current.opened
          );
          return { decision, settings, shouldPrefetch, key: current.key, suggestion: suggestion(current, 'allow') };
        }
        if (message.action === 'panel-prefetch-complete') {
          const capture = message.capture;
          const usable =
            !!capture?.content?.trim() &&
            (capture.transcriptAvailable !== false || capture.metadata?.media_kind === 'video') &&
            !['not_ready', 'unavailable'].includes(capture.extractionStatus) &&
            !capture.captureCoverage?.reasons?.includes('access_restricted');
          if (
            !usable ||
            message.key !== current.key ||
            !tab.active ||
            settings.mode !== 'injected' ||
            current.suppressed ||
            current.opened
          ) {
            return { opened: false };
          }
          const minutes = NutEggRules.readingMinutes(capture.content);
          const nextSignals = {
            ...(current.signals || { url: tab.url }),
            author: String(capture.metadata?.author || current.signals?.author || '').slice(0, 300),
            minutes,
            contentAvailable: true,
            ...(capture.metadata?.media_kind ? { mediaKind: capture.metadata.media_kind,
              videoDurationSeconds: capture.metadata.video_duration_seconds !== undefined ? capture.metadata.video_duration_seconds : current.signals?.videoDurationSeconds ?? null } : {}),
          };
          const finalDecision = await evaluate(nextSignals, current.cached);
          const latest = await chrome.tabs.get(tabId);
          if (pageKey(latest.url) !== current.key || !latest.active) return { opened: false };
          if (!finalDecision.open) {
            await save(tabId, { ...current, signals: nextSignals, decision: finalDecision });
            return { opened: false, decision: finalDecision };
          }
          await save(tabId, {
            ...current,
            signals: nextSignals,
            decision: finalDecision,
            analysisUsable: capture.transcriptAvailable !== false,
            transfer: { url: tab.url, extractedContent: capture },
          });
          await open(tabId, true);
          return { opened: true, decision: finalDecision };
        }
        if (message.action === 'panel-host-close') return close(tabId);
        if (message.action === 'panel-host-open') {
          if (settings.mode === 'native') {
            nativeOpen.add(tabId);
            return { ok: true };
          }
          return open(tabId, false);
        }
        if (message.action === 'panel-resize') {
          settings = NutEggRules.normalize({ ...settings, width: message.width });
          await chrome.storage.local.set({ panelSettings: settings });
          return { ok: true };
        }
        if (message.action === 'panel-side') {
          settings = NutEggRules.normalize({ ...settings, side: message.side });
          await chrome.storage.local.set({ panelSettings: settings });
          return { ok: true };
        }
        if (!current.signals) return { error: 'No page classification' };
        const rule = suggestion(current, message.allow ? 'allow' : 'block');
        if (message.action === 'panel-suggest-edit') {
          await chrome.storage.session.set({ panelRuleDraft: rule });
          await chrome.runtime.openOptionsPage();
        } else {
          await upsertRule(rule);
        }
        return { ok: true };
      });
    }
    if (!(await authorized(sender))) return { error: 'forbidden' };
    const target = sender.frameId > 0 && tabId != null ? tabId : message.tabId;
    if (message.action === 'panel-get-settings') return { settings };
    if (message.action === 'panel-native-opened' && target != null) {
      nativeOpen.add(target);
      return { ok: true };
    }
    if (message.action === 'panel-native-closed' && target != null) {
      nativeOpen.delete(target);
      return { ok: true };
    }
    if (message.action === 'panel-get-suggestion' && target != null) {
      const current = await state(target);
      const tabUrl = current.signals?.url || (await chrome.tabs.get(target).catch(() => null))?.url;
      if (!tabUrl || !/^https?:/.test(tabUrl)) return { suggestion: null };
      const hostname =
        NutEggRules.rootDomain?.(tabUrl) ||
        new URL(tabUrl).hostname.replace(/^www\./, '').toLowerCase();
      const dismissed = (settings.dismissedSuggestions || []).includes(hostname);
      const author =
        current.cached?.author ||
        current.signals?.author ||
        current.transfer?.extractedContent?.metadata?.author ||
        null;
      const topics = current.cached?.topics || [];
      const siteRegex = NutEggRules.websiteRegex(hostname);
      const customSiteRule = NutEggRules.activeRules(settings).find(
        r => r.enabled !== false && r.website === siteRegex && !r.topics?.length && !r.authors?.length
      );
      const isDefaultWhitelisted =
        settings.openingPolicy === 'nutegg' && (NutEggRules.DEFAULT_WHITELIST_HOSTS || []).includes(hostname);
      const isSiteAllowed = Boolean(
        customSiteRule ? customSiteRule.action === 'allow' : isDefaultWhitelisted || settings.openingPolicy === 'open'
      );
      return {
        dismissed,
        hostname,
        website: siteRegex,
        hasSiteRule: Boolean(customSiteRule),
        isSiteAllowed,
        minutes: current.signals?.minutes ?? null,
        listing: Boolean(current.signals?.listing || NutEggRules.isListingUrl?.(tabUrl)),
        contentAvailable: current.signals?.contentAvailable ?? false,
        author,
        topics,
        decision: current.decision,
        automatic: !!current.automatic,
      };
    }
    if (message.action === 'panel-open-rule-editor') {
      if (message.rule) await chrome.storage.session.set({ panelRuleDraft: message.rule });
      await chrome.runtime.openOptionsPage();
      return { ok: true };
    }
    if (message.action === 'panel-dismiss-suggestion') {
      const host = typeof message.hostname === 'string' ? message.hostname.trim().toLowerCase() : '';
      if (host) {
        const list = [...(settings.dismissedSuggestions || []).filter(h => h !== host), host].slice(-200);
        settings = NutEggRules.normalize({ ...settings, dismissedSuggestions: list });
        await chrome.storage.local.set({ panelSettings: settings });
      }
      return { ok: true };
    }
    if (message.action === 'panel-save-rule') {
      const saved = await upsertRule(message.rule);
      return { ok: true, rule: saved, settings };
    }
    if (message.action === 'panel-delete-rule') {
      settings = NutEggRules.customize(settings);
      settings = NutEggRules.normalize({
        ...settings,
        rules: (settings.rules || []).filter(item => item.id !== message.id),
      });
      await chrome.storage.local.set({ panelSettings: settings });
      return { ok: true, settings };
    }
    if (message.action === 'panel-transfer-get')
      return serial(target, async () => {
        const current = await state(target),
          transfer = current.transfer || null;
        if (transfer) {
          delete current.transfer;
          await save(target, current);
        }
        return { transfer };
      });
    if (message.action === 'panel-test-rules') {
      const tab =
        target != null
          ? await chrome.tabs.get(target)
          : (await chrome.tabs.query({ active: true, lastFocusedWindow: true }))[0];
      let current = tab ? await state(tab.id) : {};
      if (!current.signals && target == null) {
        const candidates = await chrome.tabs.query({ lastFocusedWindow: true });
        for (const candidate of candidates.sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0))) {
          const candidateState = await state(candidate.id);
          if (candidateState.signals) {
            current = candidateState;
            break;
          }
        }
      }
      if (!current.signals) return { error: 'panelNoSignals' };
      return { decision: await evaluate(current.signals, current.cached, message.rules), signals: current.signals };
    }
    if (target == null) return { error: 'No tab' };
    if (message.action === 'panel-auto-claim')
      return serial(target, async () => {
        const current = await state(target),
          tab = await chrome.tabs.get(target);
        if (
          !current.automatic ||
          current.autoClaimed ||
          !current.opened ||
          !tab.active ||
          settings.mode !== 'injected' ||
          !settings.autoAnalyze ||
          !current.decision?.open ||
          current.analysisUsable === false
        )
          return { allowed: false };
        await save(target, { ...current, autoClaimed: true });
        return { allowed: true };
      });
    if (message.action === 'panel-capture-metrics')
      return serial(target, async () => {
        const current = await state(target), tab = await chrome.tabs.get(target);
        if (pageKey(tab.url) !== message.key || current.key !== message.key) return { error: 'stale' };
        const minutes = Number.isFinite(message.minutes) && message.minutes > 0 ? Math.min(100000, Math.ceil(message.minutes)) : null;
        const metrics = { minutes, contentAvailable: message.contentAvailable === true };
        await save(target, { ...current, captureMetrics: metrics, signals: { ...current.signals, url: tab.url, ...metrics }, decision: { ...current.decision, ...metrics } });
        return { ok: true };
      });
    if (message.action === 'panel-cache-metadata')
      return serial(target, async () => {
        const current = await state(target);
        const liveTab = await chrome.tabs.get(target);
        if (pageKey(liveTab.url) !== message.key) return { error: 'stale' };
        if (current.key !== message.key) Object.assign(current, { key: message.key, cached: null });
        const metadata = message.metadata;
        if (metadata)
          await save(target, {
            ...current,
            cached: {
              author: typeof metadata.author === 'string' ? metadata.author.slice(0, 300) : null,
              topics: Array.isArray(metadata.topics)
                ? metadata.topics.filter(t => typeof t === 'string').slice(0, 5)
                : [],
            },
          });
        const cache = (await chrome.storage.local.get('panelMetadataCache')).panelMetadataCache || {};
        cache[message.key] = {
          author: typeof metadata?.author === 'string' ? metadata.author : null,
          topics: Array.isArray(metadata?.topics) ? metadata.topics.slice(0, 5) : [],
        };
        const entries = Object.entries(cache)
          .filter(([key]) => key !== message.key)
          .slice(-199);
        await chrome.storage.local.set({
          panelMetadataCache: Object.fromEntries([...entries, [message.key, cache[message.key]]]),
        });
        return { ok: true };
      });
    if (message.action === 'panel-close') return serial(target, () => close(target));
    if (message.action === 'panel-dismiss-hint') {
      settings = { ...settings, migrationHint: false };
      await chrome.storage.local.set({ panelSettings: settings });
      return { ok: true };
    }
    if (message.action === 'panel-switch') {
      if (message.transfer && target != null)
        await serial(target, async () => {
          const current = await state(target),
            tab = await chrome.tabs.get(target);
          if (pageKey(message.transfer.url) === pageKey(tab.url))
            await save(target, { ...current, key: pageKey(tab.url), transfer: message.transfer });
        });
      // Native open must happen in the gesture handler before async registration checks.
      settings = { ...settings, mode: message.mode === 'native' ? 'native' : 'injected' };
      await chrome.storage.local.set({ panelSettings: settings });
      if (settings.mode === 'native') {
        nativeOpen.add(target);
        return serial(target, () => close(target, false));
      }
      await chrome.sidePanel.setOptions({ tabId: target, enabled: false });
      await chrome.sidePanel.setOptions({ tabId: target, enabled: true, path: 'src/popup/popup.html' });
      return serial(target, () => open(target));
    }
    return { error: 'Unknown panel action' };
  }
  chrome.runtime?.onMessage?.addListener?.((message, sender, respond) => {
    if (!message.action?.startsWith('panel-') || message.action === 'panel-evaluate-regex') return;
    // Start the browser API while the click's user activation is still valid.
    if (message.action === 'panel-switch' && message.mode === 'native' && trusted(sender))
      chrome.sidePanel.open({ tabId: sender.frameId > 0 ? sender.tab?.id : message.tabId }).catch(() => {});
    if (message.action === 'panel-host-open' && settings.mode === 'native' && sender?.tab?.id != null)
      chrome.sidePanel.open({ tabId: sender.tab.id }).catch(() => {});
    handle(message, sender).then(respond, error => respond({ error: error.message }));
    return true;
  });
  chrome.action?.onClicked?.addListener?.(tab => {
    if (!injectable(tab.url)) {
      void chrome.storage.session.set({ panelRestrictedHint: true });
      chrome.sidePanel.open({ tabId: tab.id }).catch(() => chrome.runtime.openOptionsPage());
      return;
    }
    if (settings.mode === 'native') {
      if (nativeOpen.has(tab.id)) {
        nativeOpen.delete(tab.id);
        void chrome.sidePanel
          .setOptions({ tabId: tab.id, enabled: false })
          .then(() => chrome.sidePanel.setOptions({ tabId: tab.id, enabled: true, path: 'src/popup/popup.html' }));
      } else {
        nativeOpen.add(tab.id);
        chrome.sidePanel.open({ tabId: tab.id }).catch(() => nativeOpen.delete(tab.id));
      }
      return;
    }
    void serial(tab.id, async () => {
      await ready;
      const current = await state(tab.id);
      if (current.opened && current.key === pageKey(tab.url)) return close(tab.id);
      const result = await open(tab.id);
      if (result.error) {
        await chrome.storage.session.set({ panelRestrictedHint: true });
        await chrome.sidePanel.open({ tabId: tab.id }).catch(() => chrome.runtime.openOptionsPage());
      }
    });
  });
  chrome.sidePanel?.onClosed?.addListener?.(info => {
    if (info.tabId != null) nativeOpen.delete(info.tabId);
    else nativeOpen.clear();
  });
  chrome.tabs?.onUpdated?.addListener?.((tabId, change) => {
    if (!change.url) return;
    const nextKey = pageKey(change.url);
    if (knownKeys.get(tabId) === nextKey) return;
    knownKeys.set(tabId, nextKey);
    epochs.set(tabId, (epochs.get(tabId) || 0) + 1);
    void serial(tabId, async () => {
      const current = await state(tabId);
      if (current.key !== nextKey) await save(tabId, { key: nextKey });
    });
  });
  chrome.tabs?.onRemoved?.addListener?.(tabId => {
    epochs.delete(tabId);
    knownKeys.delete(tabId);
    void chrome.storage.session.remove(key(tabId));
  });
  return { authorized, ready };
})();
