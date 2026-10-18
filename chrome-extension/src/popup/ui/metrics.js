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
      cParts.push(`Mode: ${isChrome ? 'Chrome' : 'Obsidian'}`);

      if (settings.serverOnline) {
        const ver = settings.obsidianPluginVersion ? ` (v${settings.obsidianPluginVersion})` : '';
        const ai = settings.obsidianAiConfigured ? 'AI ready' : 'AI unconfigured';
        cParts.push(`Obsidian: Connected${ver} [${ai}]`);
      } else {
        const obsStatus = settings.connectionMode === 'obsidian' ? 'Disconnected (offline)' : 'Offline';
        cParts.push(`Obsidian: ${obsStatus}`);
      }

      if (settings.chromeAiConfigured !== false) {
        const provider = settings.chromeAiProvider || 'Gemini';
        const model = settings.chromeAiModel ? ` / ${settings.chromeAiModel}` : '';
        const auth = settings.chromeAiAuthMethod === 'subscription' ? ' [sub]' : '';
        cParts.push(`Chrome AI: Ready (${provider}${model}${auth})`);
      } else {
        cParts.push('Chrome AI: Not configured');
      }

      lines.push(`🔌 Connection: ${cParts.join(' · ')}`);

      // Settings details
      const sParts = [];
      if (isChrome) {
        const provider = settings.chromeAiProvider || 'Gemini';
        const model = settings.chromeAiModel ? ` / ${settings.chromeAiModel}` : '';
        sParts.push(`Backend: Chrome (${provider}${model})`);
      } else {
        const status = settings.serverOnline ? 'online' : 'offline';
        sParts.push(`Backend: Obsidian (${status})`);
      }
      if (settings.analysisMode) {
        sParts.push(`Analysis: ${settings.analysisMode}`);
      }
      const optConv = view?.optimizeForConversation ?? settings.optimizeForConversation;
      if (optConv != null) {
        sParts.push(`Dialogue enhance: ${optConv !== false ? 'ON' : 'OFF'}`);
      }
      const sections = view?.enabledSections || settings.enabledSections || {};
      const activeSecs = [];
      if (sections.titleVerdict !== false) activeSecs.push('Verdict');
      if (sections.coreSummary !== false) activeSecs.push('Summary');
      if (sections.mindMap !== false) activeSecs.push('MindMap');
      if (sections.discussion === true) activeSecs.push('Discussion');
      if (view?.generateKnowledgeEntries || settings.generateKnowledgeEntries) activeSecs.push('Knowledge');
      if (activeSecs.length) {
        sParts.push(`Sections: ${activeSecs.join(', ')}`);
      }
      if (settings.outputLanguage && settings.outputLanguage !== 'same-as-content') {
        sParts.push(`Lang: ${settings.outputLanguage}`);
      }
      if (sParts.length) {
        lines.push(`⚙️ Settings: ${sParts.join(' · ')}`);
      }
    }

    if (view) {
      const stParts = [];
      if (view.operations?.analysis?.running) {
        const phase = view.operations.analysis.phase ? ` (${view.operations.analysis.phase})` : '';
        stParts.push(`Pipeline: running${phase}`);
      } else if (view.analysisResult) {
        const stage = view.analysisResult.stage ? ` (${view.analysisResult.stage})` : '';
        const resMode = view.analysisResult.mode ? ` [${view.analysisResult.mode} mode]` : '';
        stParts.push(`Pipeline: complete${stage}${resMode}`);
      } else {
        stParts.push('Pipeline: idle');
      }

      const content = view.extractedContent;
      if (content?.content) {
        const len = content.content.length;
        const chunkCount = len <= 30000 ? 1 : Math.ceil(len / 30000);
        const type = content.isVideo ? 'Video' : content.sourceType || 'Content';
        stParts.push(
          `Content: ${len.toLocaleString()} chars (${chunkCount} ${chunkCount === 1 ? 'chunk' : 'chunks'}) · ${type}`
        );
      }

      if (content?.sourceType === 'bilibili') {
        try {
          const provenance = JSON.parse(content.metadata?.subtitle_provenance || 'null');
          if (provenance?.version !== 1) lines.push('🎬 Bilibili caption identity: not assessed');
          else {
            const id = value => (/^(?:BV[A-Za-z0-9]{10}|[0-9]{1,30})$/.test(String(value)) ? String(value) : '-');
            const outcome = ['verified', 'rejected', 'unavailable'].includes(provenance.outcome)
              ? provenance.outcome
              : 'unavailable';
            const route = ['signed_player', 'wbi_player', 'legacy_player'].includes(provenance.route)
              ? provenance.route
              : '-';
            lines.push(
              `🎬 Bilibili caption identity: ${outcome} · ${route} · requested ${id(provenance.requestedVideoId)}/${id(provenance.requestedCid)} · returned ${id(provenance.validatedBvid || provenance.validatedAid)}/${id(provenance.validatedCid)} · track ${id(provenance.trackId)}`
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
            if (trace.length) lines.push(`🎬 Caption discovery: ${trace.join(' · ')}`);
          }
        } catch {
          lines.push('🎬 Bilibili caption identity: not assessed');
        }
      }

      if (view.analysisResult?.conversation?.format) {
        stParts.push(`Format: ${view.analysisResult.conversation.format}`);
      }

      const eggs = view.analysisResult?.matchedEggs || (view.selectedEggs?.length ? view.selectedEggs : null);
      if (eggs?.length) {
        const eggList = Array.isArray(eggs) ? eggs : [...eggs];
        stParts.push(`Eggs: ${eggList.length} matched (${eggList.join(', ')})`);
      }

      if (stParts.length) {
        lines.push(`📊 Status: ${stParts.join(' · ')}`);
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
