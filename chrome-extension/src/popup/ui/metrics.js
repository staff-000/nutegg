// ============================================================
// NutEgg Popup UI — Metrics & Footer Component
// ============================================================

class MetricsComponent {
  constructor(root = document) {
    this.root = root;
    this.metricNuts = root.getElementById('metric-nuts');
    this.metricEggs = root.getElementById('metric-eggs');
    this.metricTime = root.getElementById('metric-time');
    this.obsidianPluginLink = root.getElementById('obsidian-plugin-link');
    this.reportBugLink = root.getElementById('report-bug-link');
  }

  render(data = {}) {
    if (!data) return;
    if (this.metricNuts && data.nuts != null) this.metricNuts.textContent = data.nuts;
    if (this.metricEggs && data.eggs != null) this.metricEggs.textContent = data.eggs;
    if (this.metricTime && data.timeSaved != null) this.metricTime.textContent = data.timeSaved;
  }

  showPluginLink(visible) {
    if (!this.obsidianPluginLink) return;
    if (visible) {
      this.obsidianPluginLink.classList.remove('hidden');
    } else {
      this.obsidianPluginLink.classList.add('hidden');
    }
  }

  renderDebug(info, enabled, context = {}) {
    const panel = this.root.getElementById('debug-info');
    if (!panel) return;
    panel.classList.toggle('hidden', !enabled);
    if (!enabled) {
      panel.textContent = '';
      return;
    }
    const { view, settings } = context;
    const statsText =
      !info || info.unavailable
        ? t('debugInfoUnavailable')
        : t('debugInfoStats', {
            backend: info.mode === 'chrome' ? 'Chrome' : 'Obsidian',
            running: info.activeCalls,
            calls: info.totalCalls,
            words: info.promptWords?.toLocaleString(),
            last: info.lastPromptWords?.toLocaleString(),
          });

    const counts = value => ({
      running: value.activeCalls,
      waiting: value.waitingCalls,
      completed: value.completedCalls,
      failed: value.failedCalls,
      cancelled: value.cancelledCalls,
    });
    const lines = [
      info?.panel?.available ? t('debugPanelAIStats', counts(info.panel)) : t('debugPanelAIUnavailable'),
      ...(info?.panel?.reset ? [t('debugAICountersReset')] : []),
      statsText,
      ...(info?.diagnosticsVersion === 2 ? [t('debugTabAIStats', counts(info))] : []),
    ];

    if (settings) {
      // Connection details
      const cParts = [];
      const isChrome = settings.isChromeMode
        ? settings.isChromeMode(view?.analysisResult)
        : settings.connectionMode !== 'obsidian';
      cParts.push(t('debugMode', { value: isChrome ? 'Chrome' : 'Obsidian' }));

      if (settings.serverOnline) {
        const ver = settings.obsidianPluginVersion ? ` (v${settings.obsidianPluginVersion})` : '';
        const ai = t(settings.obsidianAiConfigured ? 'debugAiReady' : 'debugAiUnconfigured');
        cParts.push(`Obsidian: ${t('debugConnected')}${ver} [${ai}]`);
      } else {
        const obsStatus = t(settings.connectionMode === 'obsidian' ? 'debugDisconnected' : 'debugOffline');
        cParts.push(`Obsidian: ${obsStatus}`);
      }

      if (settings.chromeAiConfigured !== false) {
        const provider = settings.chromeAiProvider || 'Gemini';
        const model = settings.chromeAiModel ? ` / ${settings.chromeAiModel}` : '';
        const auth = settings.chromeAiAuthMethod === 'subscription' ? ` [${t('subscriptionLabel')}]` : '';
        cParts.push(t('debugChromeReady', { details: `${provider}${model}${auth}` }));
      } else {
        cParts.push(t('debugChromeUnconfigured'));
      }

      lines.push(`🔌 ${t('debugConnection', { details: cParts.join(' · ') })}`);

      // Settings details
      const sParts = [];
      if (isChrome) {
        const provider = settings.chromeAiProvider || 'Gemini';
        const model = settings.chromeAiModel ? ` / ${settings.chromeAiModel}` : '';
        sParts.push(t('debugBackend', { details: `Chrome (${provider}${model})` }));
      } else {
        const status = t(settings.serverOnline ? 'debugOnline' : 'debugOffline');
        sParts.push(t('debugBackend', { details: `Obsidian (${status})` }));
      }
      if (settings.analysisMode) {
        sParts.push(
          t('debugAnalysis', {
            value:
              settings.analysisMode === 'fast'
                ? t('modeFast')
                : settings.analysisMode === 'confirm'
                  ? t('modeConfirm')
                  : settings.analysisMode,
          })
        );
      }
      const optConv = view?.optimizeForConversation ?? settings.optimizeForConversation;
      if (optConv != null) {
        sParts.push(t('debugDialogue', { value: t(optConv !== false ? 'debugOn' : 'debugOff') }));
      }
      const sections = view?.enabledSections || settings.enabledSections || {};
      const activeSecs = [];
      if (sections.titleVerdict !== false) activeSecs.push(t('chipVerdict'));
      if (sections.coreSummary !== false) activeSecs.push(t('chipSummary'));
      if (sections.mindMap !== false) activeSecs.push(t('chipMindmap'));
      if (sections.discussion === true) activeSecs.push(t('discussionSection'));
      if (view?.generateKnowledgeEntries || settings.generateKnowledgeEntries) activeSecs.push(t('knowledgePanel'));
      if (activeSecs.length) {
        sParts.push(t('debugSections', { value: activeSecs.join(', ') }));
      }
      if (settings.outputLanguage && settings.outputLanguage !== 'same-as-content') {
        sParts.push(t('debugLanguage', { value: settings.outputLanguage }));
      }
      if (sParts.length) {
        lines.push(`⚙️ ${t('debugSettings', { details: sParts.join(' · ') })}`);
      }
    }

    if (view) {
      const stParts = [];
      if (view.operations?.analysis?.running) {
        const phase = view.operations.analysis.phase ? ` (${view.operations.analysis.phase})` : '';
        stParts.push(t('debugPipeline', { state: t('debugRunning'), details: phase }));
      } else if (view.analysisResult) {
        const stage = view.analysisResult.stage ? ` (${view.analysisResult.stage})` : '';
        const resMode = view.analysisResult.mode ? ` [${view.analysisResult.mode}]` : '';
        stParts.push(t('debugPipeline', { state: t('debugComplete'), details: `${stage}${resMode}` }));
      } else {
        stParts.push(t('debugPipeline', { state: t('debugIdle'), details: '' }));
      }

      const content = view.extractedContent;
      if (content?.content) {
        const len = content.content.length;
        const chunkCount = len <= 30000 ? 1 : Math.ceil(len / 30000);
        const type = content.isVideo ? t('debugVideo') : content.sourceType || t('debugPageContent');
        stParts.push(t('debugContent', { chars: len.toLocaleString(), chunks: chunkCount, type }));
      }

      if (content?.sourceType === 'bilibili') {
        try {
          const provenance = JSON.parse(content.metadata?.subtitle_provenance || 'null');
          if (provenance?.version !== 1)
            lines.push(`🎬 ${t('debugCaptionIdentity', { details: t('debugNotAssessed') })}`);
          else {
            const id = value => (/^(?:BV[A-Za-z0-9]{10}|[0-9]{1,30})$/.test(String(value)) ? String(value) : '-');
            const outcome = ['verified', 'rejected', 'unavailable'].includes(provenance.outcome)
              ? provenance.outcome
              : 'unavailable';
            const route = ['signed_player', 'wbi_player', 'legacy_player'].includes(provenance.route)
              ? provenance.route
              : '-';
            lines.push(
              `🎬 ${t('debugCaptionIdentity', { details: t('debugCaptionDetails', { outcome, route, requested: `${id(provenance.requestedVideoId)}/${id(provenance.requestedCid)}`, returned: `${id(provenance.validatedBvid || provenance.validatedAid)}/${id(provenance.validatedCid)}`, track: id(provenance.trackId) }) })}`
            );
            const routes = Array.isArray(provenance.routes) ? provenance.routes.slice(0, 3) : [];
            const trace = routes
              .filter(
                item =>
                  ['signed_player', 'wbi_player', 'legacy_player'].includes(item?.route) &&
                  [
                    'verified',
                    'video_mismatch',
                    'cid_mismatch',
                    'missing_identity',
                    'provider_error',
                    'request_failed',
                  ].includes(item.outcome)
              )
              .map(
                item =>
                  `${item.route}:${item.outcome}/${Number.isSafeInteger(item.tracks) && item.tracks >= 0 ? item.tracks : 0}`
              );
            if (trace.length) lines.push(`🎬 ${t('debugCaptionDiscovery', { details: trace.join(' · ') })}`);
          }
        } catch {
          lines.push(`🎬 ${t('debugCaptionIdentity', { details: t('debugNotAssessed') })}`);
        }
      }

      if (view.analysisResult?.conversation?.format) {
        stParts.push(t('debugFormat', { value: t(`conversationFormat_${view.analysisResult.conversation.format}`) }));
      }

      const eggs = view.analysisResult?.matchedEggs || (view.selectedEggs?.length ? view.selectedEggs : null);
      if (eggs?.length) {
        const eggList = Array.isArray(eggs) ? eggs : [...eggs];
        stParts.push(t('debugEggs', { count: eggList.length, names: eggList.join(', ') }));
      }

      if (stParts.length) {
        lines.push(`📊 ${t('debugStatus', { details: stParts.join(' · ') })}`);
      }
    }

    panel.textContent = lines.join('\n');
  }
}

const _metricsScope = typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : this;
_metricsScope.NutEggUI = _metricsScope.NutEggUI || {};
_metricsScope.NutEggUI.MetricsComponent = MetricsComponent;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MetricsComponent };
}
