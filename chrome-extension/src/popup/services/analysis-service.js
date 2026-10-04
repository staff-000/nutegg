// ============================================================
// NutEgg Popup Services — Analysis Service
// ============================================================

/**
 * Handles communication with the Obsidian backend / Chrome AI runtime
 * for Stage 1 analysis, Stage 2 egg analysis, knowledge hatching/saving,
 * history retrieval, and follow-up Q&A.
 *
 * Strict Tab-Safety:
 * All operations take or capture a `pinnedTabId`.
 * Cache and status mutations are always applied to the specific `pinnedTabId`
 * in `tabStateManager`.
 * Active session updates and UI callbacks only execute if the tab is still
 * active (`session.activeTabId === pinnedTabId`), preventing background tab
 * completions from corrupting the active tab's view.
 */
class AnalysisService {
  constructor(options = {}) {
    this.chromeApi = options.chrome || (typeof chrome !== "undefined" ? chrome : null);
  }

  /**
   * Send an analyze request via a long-lived port connection.
   * The open port prevents Chrome from terminating the service worker
   * during extended LLM calls (>30s).
   */
  sendAnalyzeViaPort(payload) {
    const api = this.chromeApi;
    if (!api || !api.runtime || !api.runtime.connect) {
      return Promise.reject(new Error("Chrome runtime.connect unavailable"));
    }

    return new Promise((resolve, reject) => {
      try {
        let settled = false;
        const port = api.runtime.connect({ name: "nutegg-analyze" });
        const heartbeat = setInterval(() => {
          if (!settled && port) {
            try {
              port.postMessage({ action: "ping" });
            } catch {
              clearInterval(heartbeat);
            }
          } else {
            clearInterval(heartbeat);
          }
        }, 10000);

        port.onMessage.addListener((response) => {
          if (settled) return;
          settled = true;
          clearInterval(heartbeat);
          try { port.disconnect(); } catch {}
          resolve(response);
        });

        port.onDisconnect.addListener(() => {
          if (settled) return;
          settled = true;
          clearInterval(heartbeat);
          if (api.runtime.lastError) {
            reject(new Error(api.runtime.lastError.message));
          } else {
            reject(new Error("Connection closed before response received"));
          }
        });

        port.postMessage({ action: "analyze", payload });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Run Stage 1 (or re-analysis).
   * Pins pinnedTabId and strictly isolates tab cache vs active session state.
   */
  async analyze({
    session,
    settings,
    tabStateManager,
    force = false,
    eggsOverride = null,
    isReanalyze = false,
    pinnedTabId = null,
    callbacks = {},
  }) {
    const targetPinnedId = pinnedTabId || session.activeTabId;
    const isPinnedActive = () => session.activeTabId === targetPinnedId;

    const contentToAnalyze = session.extractedContent;
    if (!contentToAnalyze || !contentToAnalyze.content) {
      const msg = "The page is still loading or content is not ready yet. Please wait until it finishes loading.";
      if (callbacks.onWarning && isPinnedActive()) callbacks.onWarning(msg);
      return { error: msg };
    }

    if (isPinnedActive()) {
      session.isReanalyzing = isReanalyze;
      if (callbacks.onStart) callbacks.onStart({ isReanalyze });
    }

    try {
      const questions = callbacks.getQuestions ? callbacks.getQuestions() : [];
      const questionsScope = callbacks.getQuestionsScope ? callbacks.getQuestionsScope() : "within";

      // Check which eggs are selected on the page or pre-selected
      let targetEggs;
      if (isReanalyze) {
        targetEggs = eggsOverride !== null && eggsOverride !== undefined
          ? eggsOverride
          : [...session.selectedEggs];
      } else {
        targetEggs = eggsOverride ||
          (session.selectedEggs?.size > 0 ? [...session.selectedEggs] : null) ||
          (session.analysisResult?.matchedEggs?.length > 0 ? session.analysisResult.matchedEggs : null) ||
          (session.captureHistory?.[0]?.result?.matchedEggs?.length > 0 ? session.captureHistory[0].result.matchedEggs : null) ||
          (session.preSelectedEggs?.size > 0 ? [...session.preSelectedEggs] : null);
      }

      const payload = {
        url: contentToAnalyze.url || "",
        title: contentToAnalyze.title || "",
        content: contentToAnalyze.content || "",
        sourceType: contentToAnalyze.sourceType || "generic",
        metadata: contentToAnalyze.metadata,
        chapters: contentToAnalyze.chapters || undefined,
        questions,
        questionsScope,
        force: true,
        stage: 1,
        enabledSections: { ...(session?.enabledSections || settings.enabledSections) },
        outputLanguage: settings.outputLanguage,
        ...(Array.isArray(targetEggs) ? { eggs: targetEggs } : {}),
      };

      // Cache the analyzing state for targetPinnedId
      const existingCache = tabStateManager ? (tabStateManager.get(targetPinnedId) || {}) : {};
      if (tabStateManager) {
        tabStateManager.set(targetPinnedId, {
          ...existingCache,
          status: "analyzing",
          url: contentToAnalyze.url,
          extractedContent: contentToAnalyze,
          stage1Payload: payload,
          isReanalyzing: isReanalyze,
          analysisResult: isReanalyze ? (session.analysisResult || existingCache.analysisResult) : null,
          captureHistory: isPinnedActive() ? [...session.captureHistory] : [...(existingCache.captureHistory || [])],
          currentNutId: (isPinnedActive() ? session.currentNutId : null) || existingCache.currentNutId,
        });
      }

      const response = await this.sendAnalyzeViaPort(payload);

      if (response?.error) {
        if (tabStateManager) {
          tabStateManager.setError(targetPinnedId, response.error, response.errorCode);
        }
        if (isPinnedActive() && callbacks.onError) {
          callbacks.onError(response.error, response.errorCode);
        }
        return { error: response.error, errorCode: response.errorCode };
      }

      // Merge newly discovered allEggs
      if (isPinnedActive() && Array.isArray(response.allEggs) && response.allEggs.length > 0) {
        const currentEggs = session.allEggs || [];
        const normalized = response.allEggs.map((name) => ({
          fileName: typeof name === "string" ? name : name?.fileName,
          description: "",
          topic: "",
        }));
        for (const n of normalized) {
          if (n.fileName && !currentEggs.some((e) => e.fileName === n.fileName)) {
            currentEggs.push(n);
          }
        }
        session.allEggs = currentEggs;
      }

      if (isReanalyze && Array.isArray(targetEggs)) {
        response.matchedEggs = [...targetEggs];
      }

      const isExplicitEggReanalyze = isReanalyze && Array.isArray(eggsOverride) && eggsOverride.length > 0;
      const shouldRunStage2 = !settings.isChromeMode(response) && (settings.analysisMode === "fast" || isExplicitEggReanalyze);
      const eggsForStage2 = isReanalyze
        ? (Array.isArray(targetEggs) ? targetEggs : [])
        : ((targetEggs && targetEggs.length > 0)
            ? targetEggs
            : (response.matchedEggs && response.matchedEggs.length > 0 ? response.matchedEggs : []));

      if (shouldRunStage2) {
        // Fast mode with eggs: automatically proceed to Stage 2
        if (tabStateManager) {
          const c2 = tabStateManager.get(targetPinnedId) || {};
          tabStateManager.set(targetPinnedId, {
            ...c2,
            status: eggsForStage2.length > 0 ? "analyzing" : "done",
            url: contentToAnalyze.url,
            extractedContent: contentToAnalyze,
            analysisResult: response,
            stage1Payload: payload,
            stage1ContentAnalysis: response,
            isReanalyzing: isReanalyze,
            captureHistory: isPinnedActive() ? [...session.captureHistory] : [...(c2.captureHistory || [])],
            currentNutId: (isPinnedActive() ? session.currentNutId : null) || c2.currentNutId,
          });
        }

        if (isPinnedActive()) {
          session.stage1Payload = payload;
          session.stage1ContentAnalysis = response;
          session.cachedProcessedSaved = null;
          session.followUpQa = [];
          session.nutCollected = false;
          session.eggHatched = false;
          session.activeEggTab = null;
          session.analysisResult = response;
          if (callbacks.onStage1Interim) {
            callbacks.onStage1Interim({ response, eggsForStage2, isReanalyze, contentToAnalyze });
          }
        }

        if (eggsForStage2.length > 0) {
          await this.proceedStage2({
            session,
            settings,
            tabStateManager,
            eggsToCompare: eggsForStage2,
            autoSave: false,
            pinnedTabId: targetPinnedId,
            contentAnalysis: response,
            basePayload: payload,
            contentForProvenance: contentToAnalyze,
            callbacks,
          });
        }

        return { success: true, result: response, stage: "stage2" };
      }

      // Confirm mode or 0 eggs matched: stops at Stage 1
      if (settings.analysisMode === "confirm") {
        response.stage = "stage1";
        delete response.eggResults;
        delete response.shouldRead;
        delete response.shouldReadReason;
        delete response.newKnowledge;
      }
      const stage1NutId = response.nutId || null;

      let freshHistory = null;
      if (contentToAnalyze.url && settings.serverOnline) {
        freshHistory = await this.loadHistory(contentToAnalyze.url);
      }

      const stage1Entry = stage1NutId
        ? {
            nutId: stage1NutId,
            capturedAt: new Date().toISOString(),
            saved: "analyzed",
            result: response,
            url: contentToAnalyze.url,
            title: contentToAnalyze.title,
            content: contentToAnalyze.content,
            sourceType: contentToAnalyze.sourceType,
            author: contentToAnalyze.metadata?.author || "",
            publishedAt: contentToAnalyze.metadata?.published || "",
          }
        : null;

      const cachedBefore = tabStateManager ? (tabStateManager.get(targetPinnedId) || {}) : {};
      const priorHistory = isPinnedActive() ? session.captureHistory : (cachedBefore.captureHistory || []);
      const updatedHistory = freshHistory || (stage1Entry ? [stage1Entry, ...priorHistory] : priorHistory);

      if (tabStateManager) {
        tabStateManager.set(targetPinnedId, {
          status: "done",
          url: contentToAnalyze.url,
          extractedContent: contentToAnalyze,
          analysisResult: response,
          stage1Payload: { ...payload, nutId: stage1NutId },
          stage1ContentAnalysis: response,
          currentNutId: stage1NutId || (isPinnedActive() ? session.currentNutId : cachedBefore.currentNutId),
          captureHistory: updatedHistory,
          justReanalyzed: isReanalyze,
        });
      }

      if (isPinnedActive()) {
        session.stage1Payload = { ...payload, nutId: stage1NutId };
        session.stage1ContentAnalysis = response;
        session.currentNutId = stage1NutId || session.currentNutId;
        session.captureHistory = updatedHistory;
        session.cachedProcessedSaved = null;
        session.followUpQa = [];
        session.nutCollected = false;
        session.eggHatched = false;
        session.activeEggTab = null;
        session.analysisResult = response;
        if (Array.isArray(response.matchedEggs) && response.matchedEggs.length > 0) {
          session.selectedEggs = new Set(response.matchedEggs);
        }
        if (callbacks.onStage1Complete) {
          callbacks.onStage1Complete({ response, contentToAnalyze, isReanalyze });
        }
      }

      return { success: true, result: response, stage: "stage1" };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analysis failed";
      if (tabStateManager) {
        tabStateManager.setError(targetPinnedId, message);
      }
      if (isPinnedActive() && callbacks.onError) {
        callbacks.onError(message);
      }
      return { error: message };
    } finally {
      if (isPinnedActive()) {
        session.isReanalyzing = false;
        if (callbacks.onFinally) callbacks.onFinally();
      }
    }
  }

  /**
   * Run Stage 2 instruction-driven analysis for target eggs.
   */
  async proceedStage2({
    session,
    settings,
    tabStateManager,
    eggsToCompare = null,
    skipScroll = false,
    pinnedTabId = null,
    contentAnalysis = null,
    basePayload = null,
    contentForProvenance = null,
    callbacks = {},
  }) {
    // Analysis never saves eggs; Hatch is an explicit user action.
    const autoSave = false;
    const targetPinnedId = pinnedTabId || session.activeTabId;
    const isPinnedActive = () => session.activeTabId === targetPinnedId;

    const isExplicitEggs = Array.isArray(eggsToCompare);
    const targetEggs = [...new Set(isExplicitEggs ? eggsToCompare : [...session.selectedEggs])];
    if (!isExplicitEggs && targetEggs.length === 0) {
      if (isPinnedActive() && callbacks.onNoEggsSelected) {
        callbacks.onNoEggsSelected();
      }
      return { error: "No eggs selected" };
    }

    if (isPinnedActive() && callbacks.onProceedStart) {
      callbacks.onProceedStart({ autoSave });
    }

    try {
      const cached = tabStateManager ? tabStateManager.get(targetPinnedId) : null;
      const base = basePayload || session.stage1Payload || cached?.stage1Payload;
      const content = contentForProvenance || session.extractedContent || cached?.extractedContent;
      const analysis = contentAnalysis || session.stage1ContentAnalysis || cached?.stage1ContentAnalysis || session.analysisResult;
      const priorResult = isPinnedActive() ? session.analysisResult : cached?.analysisResult;
      // Explicit contentAnalysis is a fresh Stage 1 pass, which invalidates prior egg results.
      const captured = contentAnalysis ? [] : [...(priorResult?.eggAnalysisCache || []), ...(priorResult?.eggResults || [])];
      const resultCache = new Map(captured.filter(result => result?.egg).map(result => [result.egg, result]));
      const pendingEggs = targetEggs.filter(egg => !resultCache.has(egg));

      if (tabStateManager) {
        const existing = tabStateManager.get(targetPinnedId) || {};
        tabStateManager.set(targetPinnedId, {
          ...existing,
          status: "hatching",
          stage1Payload: base,
          stage1ContentAnalysis: analysis,
        });
      }

      const url = base?.url || content?.url || "";
      const title = base?.title || content?.title || "";
      const bodyContent = base?.content || content?.content || "";
      const sourceType = base?.sourceType || content?.sourceType || "generic";
      const metadata = base?.metadata || content?.metadata;
      const chapters = base?.chapters || content?.chapters;
      const questions = base?.questions || (callbacks.getQuestions ? callbacks.getQuestions() : []);

      const payload = {
        ...(base || {}),
        url,
        title,
        content: bodyContent,
        sourceType,
        metadata,
        chapters,
        questions,
        stage: 2,
        eggs: pendingEggs,
        ...(resultCache.size ? { cachedEggResults: [...resultCache.values()], selectedEggs: targetEggs } : {}),
        outputLanguage: settings.outputLanguage,
        nutId: base?.nutId || (isPinnedActive() ? session.currentNutId : cached?.currentNutId) || undefined,
        contentAnalysis: analysis || {
          titleVerdict: title,
          coreSummary: [],
          mindMap: [],
          customQuestionAnswers: [],
        },
      };

      let response;
      if (pendingEggs.length) {
        response = await this.sendAnalyzeViaPort(payload);
      } else {
        response = { ...priorResult, nutId: payload.nutId, eggResults: [] };
      }
      if (response?.error) {
        if (tabStateManager) {
          tabStateManager.setError(targetPinnedId, response.error, response.errorCode);
        }
        if (isPinnedActive() && callbacks.onProceedError) {
          callbacks.onProceedError(response.error, response.errorCode);
        }
        return { error: response.error, errorCode: response.errorCode };
      }

      if (resultCache.size || !pendingEggs.length) {
        for (const result of response.eggResults || []) resultCache.set(result.egg, result);
        const core = typeof NutEggAI !== "undefined" ? NutEggAI : globalThis.NutEggAI;
        response = { ...response, ...core.composeEggResults(payload.contentAnalysis,
          targetEggs.flatMap(egg => resultCache.has(egg) ? [resultCache.get(egg)] : []),
          [...resultCache.values()]) };
      }

      response.stage = "stage2";
      const newNutId = response.nutId || null;

      let freshHistory = null;
      if (pendingEggs.length && payload.url && settings.serverOnline) {
        freshHistory = await this.loadHistory(payload.url);
      }

      const newHistoryEntry = newNutId && pendingEggs.length
        ? {
            nutId: newNutId,
            capturedAt: new Date().toISOString(),
            saved: autoSave ? "saved" : "analyzed",
            result: response,
            url: payload.url || content?.url || "",
            title: payload.title || content?.title || "",
            content: payload.content || content?.content || "",
            sourceType: payload.sourceType || content?.sourceType || "webpage",
            author: payload.metadata?.author || "",
            publishedAt: payload.metadata?.published || "",
          }
        : null;

      if (tabStateManager) {
        const existing = tabStateManager.get(targetPinnedId) || {};
        const updatedHistory = freshHistory || (newHistoryEntry
          ? [newHistoryEntry, ...(existing.captureHistory || [])]
          : existing.captureHistory || []);
        tabStateManager.set(targetPinnedId, {
          ...existing,
          status: "done",
          url: payload.url,
          extractedContent: contentForProvenance || existing.extractedContent || session.extractedContent,
          analysisResult: response,
          stage1Payload: base,
          stage1ContentAnalysis: analysis,
          eggHatched: autoSave ? true : (existing.eggHatched || false),
          nutCollected: autoSave ? true : (existing.nutCollected || false),
          currentNutId: newNutId || existing.currentNutId,
          captureHistory: updatedHistory,
          justReanalyzed: isPinnedActive() ? session.isReanalyzing : existing.isReanalyzing,
        });
      }

      // Update active session ONLY if user is currently looking at this tab
      if (isPinnedActive()) {
        session.analysisResult = response;
        if (newNutId) {
          session.currentNutId = newNutId;
          if (pendingEggs.length) session.cachedProcessedSaved = null;
          session.captureHistory = freshHistory || (newHistoryEntry ? [newHistoryEntry, ...session.captureHistory] : session.captureHistory);
        } else if (freshHistory) {
          session.captureHistory = freshHistory;
        }

        if (callbacks.onProceedComplete) {
          callbacks.onProceedComplete({
            response,
            contentForProvenance,
            autoSave,
            skipScroll,
          });
        }
      }

      return { success: true, result: response };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Hatching failed";
      if (tabStateManager) {
        tabStateManager.setError(targetPinnedId, errorMsg);
      }
      if (isPinnedActive() && callbacks.onProceedError) {
        callbacks.onProceedError(errorMsg);
      }
      return { error: errorMsg };
    }
  }

  /**
   * Save content and/or hatched eggs to the Obsidian knowledge base.
   */
  async saveKnowledge({
    session,
    settings,
    tabStateManager,
    newKnowledge = [],
    isHatch = false,
    overrideContent = null,
    overrideResult = null,
    overrideNutId = null,
    targetPinnedId = null,
    extractFallback = null,
    callbacks = {},
  }) {
    const isTargetActive = () => !targetPinnedId || (session.activeTabId === targetPinnedId);
    let content = overrideContent || (isTargetActive() ? session.extractedContent : null);
    const result = overrideResult || (isTargetActive() ? session.analysisResult : null);
    const nutId = overrideNutId ?? (isTargetActive() ? session.currentNutId : null);

    try {
      if (!content && isTargetActive() && typeof extractFallback === "function") {
        content = await extractFallback(targetPinnedId || session.activeTabId);
      }

      const payload = {
        url: content?.url || result?.url || "",
        title: content?.title || result?.title || "",
        content: content?.content || "",
        sourceType: content?.sourceType || "generic",
        metadata: content?.metadata,
        summary: result?.summary || "",
        matchedEggs: result?.matchedEggs || [],
        newKnowledge,
        analysis: result || undefined,
        nutId: nutId ?? undefined,
        skipRaw: (() => {
          const cachedForSave = targetPinnedId && tabStateManager ? tabStateManager.get(targetPinnedId) : null;
          const isTargetNutCollected = isTargetActive() ? session.nutCollected : !!cachedForSave?.nutCollected;
          const isTargetCachedSaved = isTargetActive() ? session.cachedProcessedSaved : (cachedForSave?.cachedProcessedSaved ?? null);
          return (newKnowledge.length > 0 || isHatch) &&
            (isTargetNutCollected || (isTargetCachedSaved !== null && isTargetCachedSaved !== "analyzed"));
        })(),
      };

      const response = await this.sendMessage({ action: "confirm", payload });

      if (response?.success) {
        if (targetPinnedId && tabStateManager) {
          const existing = tabStateManager.get(targetPinnedId) || {};
          existing.eggHatched = (newKnowledge.length > 0 || isHatch);
          existing.nutCollected = true;
          if (existing.captureHistory && nutId != null) {
            const ce = existing.captureHistory.find((h) => String(h.nutId) === String(nutId));
            if (ce) ce.saved = (newKnowledge.length > 0 || isHatch) ? "saved" : "skip";
          }
          tabStateManager.set(targetPinnedId, existing);
        }

        if (isTargetActive()) {
          if (newKnowledge.length > 0 || isHatch) {
            session.eggHatched = true;
            session.nutCollected = true;
          } else {
            session.nutCollected = true;
          }
          if (nutId != null && session.captureHistory) {
            const entry = session.captureHistory.find((h) => String(h.nutId) === String(nutId));
            if (entry) entry.saved = (newKnowledge.length > 0 || isHatch) ? "saved" : "skip";
          }
          if (callbacks.onSaveSuccess) {
            callbacks.onSaveSuccess({ response, newKnowledge, isHatch, result });
          }
        }
        return { success: true, response };
      }

      if (isTargetActive() && callbacks.onSaveError) {
        callbacks.onSaveError(response?.error || "Failed to save");
      }
      return { error: response?.error || "Failed to save" };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save";
      if (isTargetActive() && callbacks.onSaveError) {
        callbacks.onSaveError(msg);
      }
      return { error: msg };
    }
  }

  /**
   * Ask follow-up question against analyzed content.
   */
  async askFollowUp({
    session,
    settings,
    tabStateManager,
    question,
    scope = "within",
    pinnedTabId = null,
    extractFallback = null,
    buildPriorQa = null,
  }) {
    const targetPinnedId = pinnedTabId || session.activeTabId;
    const isPinnedActive = () => session.activeTabId === targetPinnedId;

    const cached = targetPinnedId && tabStateManager ? tabStateManager.get(targetPinnedId) : null;
    let content = session.extractedContent || cached?.extractedContent;
    const result = session.analysisResult || cached?.analysisResult;

    const inFlightEntry = { question, answer: "…", scope };
    session.followUpQa.push(inFlightEntry);

    if (targetPinnedId && tabStateManager) {
      const c = tabStateManager.get(targetPinnedId) || {};
      tabStateManager.set(targetPinnedId, {
        ...c,
        followUpQa: [...session.followUpQa],
      });
    }

    try {
      if (!content && typeof extractFallback === "function") {
        content = await extractFallback(targetPinnedId);
      }

      const priorQa = typeof buildPriorQa === "function" ? buildPriorQa(result, session.followUpQa) : [];
      const payload = {
        url: content?.url || result?.url || "",
        title: content?.title || result?.title || "",
        content: content?.content || "",
        sourceType: content?.sourceType || result?.sourceType || "generic",
        questions: [question],
        priorQa,
        scope,
        outputLanguage: settings.outputLanguage,
      };

      const response = await this.sendMessage({ action: "ask", payload });
      const answers = response?.answers || [];
      const ansObj = answers[0];
      const answer = ansObj?.answer || response?.error || "No answer returned";
      const answeredEntry = {
        question,
        answer,
        scope: ansObj?.scope || scope,
        sources: ansObj?.sources,
      };

      if (targetPinnedId && tabStateManager) {
        const c = tabStateManager.get(targetPinnedId) || {};
        const currentQa = c.followUpQa ? [...c.followUpQa] : [...session.followUpQa];
        const lastIdx = currentQa.length - 1;
        if (lastIdx >= 0 && currentQa[lastIdx].question === question && currentQa[lastIdx].answer === "…") {
          currentQa[lastIdx] = answeredEntry;
        } else {
          currentQa.push(answeredEntry);
        }
        c.followUpQa = currentQa;
        tabStateManager.set(targetPinnedId, c);
      }

      if (isPinnedActive()) {
        session.followUpQa[session.followUpQa.length - 1] = answeredEntry;
      }
      return { success: true, entry: answeredEntry };
    } catch (err) {
      const errorEntry = {
        question,
        answer: `Failed to get answer: ${err instanceof Error ? err.message : "unknown error"}`,
        scope,
      };
      if (targetPinnedId && tabStateManager) {
        const c = tabStateManager.get(targetPinnedId) || {};
        const currentQa = c.followUpQa ? [...c.followUpQa] : [...session.followUpQa];
        const lastIdx = currentQa.length - 1;
        if (lastIdx >= 0 && currentQa[lastIdx].question === question && currentQa[lastIdx].answer === "…") {
          currentQa[lastIdx] = errorEntry;
        } else {
          currentQa.push(errorEntry);
        }
        c.followUpQa = currentQa;
        tabStateManager.set(targetPinnedId, c);
      }
      if (isPinnedActive()) {
        session.followUpQa[session.followUpQa.length - 1] = errorEntry;
      }
      return { error: errorEntry.answer, entry: errorEntry };
    }
  }

  /**
   * Load history for a URL.
   */
  async loadHistory(url) {
    if (!url) return null;
    try {
      const resp = await this.sendMessage({ action: "history", url });
      return resp?.history?.length ? resp.history : null;
    } catch {
      return null;
    }
  }

  /**
   * Create a new egg in the Obsidian vault.
   */
  async createEgg(name, description) {
    try {
      const resp = await this.sendMessage({ action: "create-egg", name, description });
      return resp;
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to create egg" };
    }
  }

  /** Safe message sender helper */
  sendMessage(message) {
    const api = this.chromeApi;
    if (!api || !api.runtime || !api.runtime.sendMessage) {
      return Promise.reject(new Error("Chrome runtime.sendMessage unavailable"));
    }
    return api.runtime.sendMessage(message);
  }
}

const _analysisScope = typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this);
_analysisScope.NutEggServices = _analysisScope.NutEggServices || {};
_analysisScope.NutEggServices.AnalysisService = AnalysisService;
_analysisScope.AnalysisService = AnalysisService;

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    AnalysisService,
  };
}
