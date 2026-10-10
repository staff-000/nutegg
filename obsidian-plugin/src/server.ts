import { ConnectionAccess } from './connection-access';
import { supportsSubscription } from '../../shared/src/catalog';
import type { SubscriptionProvider } from '../../shared/src/types';
import { normalizeDiscussion } from "../../shared/src/discussion";
import { getVideoIdentity, normalizeContentUrl } from "../../shared/src/content-url";
import { getAIDebugInfo, normalizeAIDebugScope } from "../../shared/src/ai-diagnostics";
import type { CapturePayload, DiscussionCapture } from "../../shared/src/types";
import * as http from "http";
import { createHash } from "crypto";
import type NutEggPlugin from "./main";
import { AIClient, AIError, isAIConfigured, PROVIDER_CATALOG } from "./ai-client";
import {
  AIProcessor,
  type AnalysisResult,
  type AnalysisSectionsConfig,
  type ContentAnalysis,
  type MergeResult,
  type QuestionScope,
} from "./ai-processor";
import { sanitizeEggName } from "./index-sync";
import { composeEggResults } from "../../shared/src/analysis-results";
import type { EggAnalysis } from "../../shared/src/types";
import { isEggPath, insertEggLanguage, resolveEggPath } from "./egg-parser";

interface AnalyzeRequest {
  debugScope?: string;
  discussion?: DiscussionCapture;
  enabledSections?: Partial<AnalysisSectionsConfig>;
  transcriptAvailable?: boolean;
  mediaType?: string;
  generateKnowledgeEntries?: boolean;
  /** Captured results reused when only newly selected eggs need analysis. */
  cachedEggResults?: EggAnalysis[];
  selectedEggs?: string[];
  url: string;
  title: string;
  content: string;
  sourceType: string;
  metadata?: Record<string, string>;
  /** Video chapter markers with timestamps (YouTube) — used for the Mind Map. */
  chapters?: Array<{ time: string; title: string }>;
  /** Custom questions from the popup — answered alongside the eggs' key questions. */
  questions?: string[];
  /** Question scope: "within" (default) or "beyond" */
  questionsScope?: QuestionScope;
  /** Force a fresh analysis even when cached captures exist for this URL. */
  force?: boolean;
  /** Manual egg selection from the popup — skips AI routing when non-empty. */
  eggs?: string[];
  /** Analysis stage: 1 (summary & routing only), 2 (egg knowledge compare only), or omitted/full */
  stage?: number | string;
  /** Content analysis from stage 1 when executing stage 2 */
  contentAnalysis?: ContentAnalysis;
  /** Row id of the capture (when completing stage 2 for an existing stage 1 capture). */
  nutId?: number;
  /** Content analysis sections to include (sent from Chrome as single source of truth). */
  /** Output language for content analysis and summaries (sent from Chrome as single source of truth). */
  outputLanguage?: string;
}

interface AskRequest {
  debugScope?: string;
  discussion?: DiscussionCapture;
  enabledSections?: Partial<AnalysisSectionsConfig>;
  transcriptAvailable?: boolean;
  mediaType?: string;
  url: string;
  title: string;
  content: string;
  sourceType: string;
  /** New follow-up questions to answer. */
  questions: string[];
  /** Previously answered Q&A (egg key questions + custom + earlier follow-ups). */
  priorQa?: Array<{ question: string; answer: string }>;
  /** Output language for follow-up answers (sent from Chrome). */
  outputLanguage?: string;
  /** Question scope: "within" (default) or "beyond" */
  scope?: QuestionScope;
}

interface CreateEggRequest {
  name: string;
  description?: string;
}

interface ConfirmRequest {
  debugScope?: string;
  discussion?: DiscussionCapture;
  enabledSections?: Partial<AnalysisSectionsConfig>;
  transcriptAvailable?: boolean;
  mediaType?: string;
  url: string;
  title: string;
  content: string;
  sourceType: string;
  metadata?: Record<string, string>;
  summary?: string;
  matchedEggs?: string[];
  newKnowledge: Array<{
    egg: string;
    content: string;
  }>;
  /** Full analysis result — stored in the dedup cache for replay. */
  analysis?: AnalysisResult;
  /** Skip saving the raw nut (it was already saved) — only apply knowledge. */
  skipRaw?: boolean;
  /** Row id of the capture this confirm belongs to (from /analyze or history). */
  nutId?: number;
}

/** One capture of a URL, as exposed to /analyze for history + result replay. */
interface CaptureEntry {
  capturePayload?: CapturePayload | null;
  nutId: number;
  /** When this capture was analyzed (ISO timestamp). */
  capturedAt: string;
  /** "saved" (knowledge added), "skip" (raw only), "analyzed" (never saved). */
  saved: "saved" | "skip" | "analyzed";
  result: AnalysisResult | null;
  /** Provenance stored with the capture (content title, author, publish time). */
  title: string;
  author: string;
  publishedAt: string;
  url?: string;
  sourceType?: string;
  content?: string;
}

export class NutEggServer {
  private aiConfigQueue: Promise<void> = Promise.resolve();
  private confirmationQueues = new Map<string, Promise<void>>();
  private server: http.Server | null = null;
  private plugin: NutEggPlugin;
  private port: number;

  constructor(plugin: NutEggPlugin, port: number) {
    this.plugin = plugin;
    this.port = port;
  }

  // --- Dedup + metrics helpers (backed by SQLite) ---

  /** All captures of a URL, newest first. Empty = never processed / DB unavailable. */
  private getCaptureHistory(url: string): CaptureEntry[] {
    const db = this.plugin.db;
    if (!db?.available) return [];
    const normalized = this.normalizeUrl(url);
    let rows = db.getNutHistory(normalized);
    const video = getVideoIdentity(normalized);
    if (video) {
      // Include earlier captures stored under raw URLs even when a canonical row already exists.
      // LIKE narrows candidates; exact parsed identity rejects partial IDs and unrelated domains.
      const legacy = (db.getNutHistoryByPattern?.(`%${video.id}%`) || [])
        .filter(row => this.normalizeUrl(row.url) === normalized);
      rows = [...new Map([...rows, ...legacy].map(row => [row.id, row])).values()].sort((a, b) => b.id - a.id);
    } else if (rows.length === 0) {
      const twMatch = normalized.match(/x\.com\/[^/]+\/status\/(\d+)/);
      if (twMatch) {
        rows = db.getNutHistoryByPattern(`%/status/${twMatch[1]}%`);
      }
    }

    return rows.filter(row => (row.analysisResult as any)?.schemaVersion === 3).map((row) => ({
      nutId: row.id,
      capturedAt: row.savedAt,
      saved:
        row.processingResult === "saved" || row.processingResult === "skip"
          ? row.processingResult
          : "analyzed",
      result: row.analysisResult,
      title: row.title,
      author: row.author,
      publishedAt: row.publishedAt,
      url: row.url,
      sourceType: row.sourceType,
      content: row.content,
      capturePayload: row.capturePayload,
    }));
  }

  private captureSnapshot(capture: AnalyzeRequest | ConfirmRequest): CapturePayload & { metadata?: Record<string, string> } {
    return { url: capture.url, title: capture.title, content: capture.content || '', sourceType: capture.sourceType,
      metadata: capture.metadata, enabledSections: capture.enabledSections, transcriptAvailable: capture.transcriptAvailable, mediaType: capture.mediaType,
      ...('chapters' in capture ? { chapters: capture.chapters } : {}),
      ...('outputLanguage' in capture ? { outputLanguage: capture.outputLanguage } : {}),
      discussion: capture.enabledSections?.discussion === true ? normalizeDiscussion(capture.discussion) : undefined };
  }

  /** Reading/watch time estimate from metadata, or word-count fallback. */
  private estimateTime(
    metadata: Record<string, string> | undefined,
    content: string
  ): number {
    return (
      parseInt(metadata?.time_estimate_minutes || "0", 10) ||
      Math.max(1, Math.ceil((content?.split(/\s+/)?.length || 0) / 200))
    );
  }

  /** Count egg files (direct markdown notes under vaultFolder/, excluding system files). */
  private countEggs(): number {
    const folder = this.plugin.vaultFolder || "nutegg";
    return this.plugin.app.vault
      .getMarkdownFiles()
      .filter((f) => isEggPath(f.path, folder)).length;
  }

  /** Insert a capture entry into the SQLite DB if available. */
  private recordNut(capture: AnalyzeRequest, result: AnalysisResult): number | undefined {
    return (
      this.plugin.db?.insertNut({
        url: this.normalizeUrl(capture.url),
        title: capture.title,
        sourceType: capture.sourceType,
        content: capture.content || "",
        savedAt: new Date().toISOString(),
        publishedAt: capture.metadata?.published || "",
        author:
          capture.metadata?.author ||
          capture.metadata?.channel ||
          capture.metadata?.handle ||
          "",
        timeEstimateMinutes: this.estimateTime(capture.metadata, capture.content),
        processingResult: "analyzed",
        summary: [result.titleVerdict, ...(result.coreSummary || [])]
          .filter(Boolean)
          .join("\n"),
        matchedEggs: result.matchedEggs || [],
        fileName: "",
        analysisResult: result,
        capturePayload: this.captureSnapshot(capture),
      }) ?? undefined
    );
  }

  /** Strip trailing slashes, fragment, and common tracking/session params. */
  normalizeUrl(url: string): string {
    return normalizeContentUrl(url);
  }

  async start(): Promise<void> {
    if (this.server) {
      console.log("[NutEgg] Server is already running");
      return;
    }

    this.server = http.createServer(async (req, res) => {
      // Validate Host and Origin before dispatch, including preflight.
      const requestOrigin = req.headers.origin;
      const extensionOrigin = req.headers['x-nutegg-extension-origin'];
      if (!/^127\.0\.0\.1:\d+$/.test(req.headers.host || '') ||
        (extensionOrigin !== undefined && (typeof extensionOrigin !== 'string' || !ConnectionAccess.validOrigin(extensionOrigin) || (requestOrigin && extensionOrigin !== requestOrigin))) ||
        (requestOrigin && !ConnectionAccess.validOrigin(requestOrigin) && requestOrigin !== 'app://obsidian.md')) {
        res.writeHead(403); res.end('Forbidden host or origin'); return;
      }
      // CORS headers for Chrome extension and local tooling only
      const origin = req.headers.origin as string | undefined;
      const isAllowedOrigin =
        !origin ||
        origin.startsWith("chrome-extension://") ||
        origin.startsWith("http://127.0.0.1:") ||
        origin.startsWith("http://localhost:") ||
        origin.startsWith("app://obsidian.md");

      if (origin && isAllowedOrigin) {
        res.setHeader("Access-Control-Allow-Origin", origin);
      } else if (!origin) {
        res.setHeader("Access-Control-Allow-Origin", "*");
      }

      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-NutEgg-Extension-Version, X-NutEgg-Extension-Origin");

      if (req.method === "OPTIONS") {
        if (origin && !isAllowedOrigin) {
          res.writeHead(403);
          res.end("Forbidden origin");
          return;
        }
        res.writeHead(204);
        res.end();
        return;
      }

      try {
        const clientOrigin = requestOrigin || extensionOrigin as string | undefined;
        if (req.method === 'POST' && ['/connection/start', '/connection/finish'].includes(req.url || '')) {
          if (!ConnectionAccess.validOrigin(clientOrigin) || !req.headers['content-type']?.startsWith('application/json')) {
            res.writeHead(403); res.end('Chrome connection required'); return;
          }
          const data = JSON.parse(await this.readBody(req, 4096));
          const access = this.plugin.connectionAccess;
          const result = req.url === '/connection/start' ? access.start(clientOrigin, data.nonce, requestOrigin) : access.finish(clientOrigin, data.nonce);
          res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(result)); return;
        }
        if (req.url !== '/health' && !this.plugin.connectionAccess?.authorized(clientOrigin, req.headers.authorization)) {
          res.writeHead(401, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Connect NutEgg Chrome in Obsidian first.', errorCode: 'connection_required' })); return;
        }
        if (req.method === 'POST' && req.url?.startsWith('/subscription/')) {
          const data = JSON.parse(await this.readBody(req, 4096));
          if (!supportsSubscription(data.provider)) { res.writeHead(400); res.end('Invalid provider'); return; }
          const provider = data.provider as SubscriptionProvider;
          if (!this.plugin.settings.subscriptionEnabled) {
            res.writeHead(403); res.end(JSON.stringify({ state: 'disabled', errorCode: 'subscription_disabled', error: 'AI connection unavailable.' })); return;
          }
          const service = this.plugin.subscriptions;
          let result: any;
          switch (req.url) {
            case '/subscription/status': result = await service.status(provider); break;
            case '/subscription/models': result = { models: await service.models(provider) }; break;
            case '/subscription/login/start': result = await service.startLogin(provider, data.device === true); break;
            case '/subscription/login/status': result = await service.status(provider); break;
            case '/subscription/login/cancel': await service.cancelLogin(provider); result = await service.status(provider); break;
            case '/subscription/test': result = await service.test(provider, data.model || 'auto'); break;
            default: res.writeHead(404); res.end('Not found'); return;
          }
          res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(result)); return;
        }
        if (req.method === "GET" && req.url === "/health") {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({
            status: "ok",
            capabilities: ["subscription-v1", "connection-approval-v1"],
            subscriptionEnabled: this.plugin.settings.subscriptionEnabled === true,
            port: this.port,
            version: this.plugin.manifest?.version || "",
            timestamp: Date.now(),
          }));
          return;
        }

        if (req.method === "POST" && req.url === "/ai-config-status") {
          await this.handleAiConfigComparison(req, res);
          return;
        }

        if (req.method === "POST" && req.url === "/ai-config") {
          await this.handleAiConfig(req, res);
          return;
        }

        if (req.method === "GET" && req.url === "/config-status") {
          await this.handleConfigStatus(res);
          return;
        }

        if (req.method === "GET" && req.url === "/credit") {
          await this.handleCredit(res);
          return;
        }

        if (req.method === "GET" && req.url?.split("?")[0] === "/debug-info") {
          this.handleDebugInfo(req, res);
          return;
        }

        if (req.method === "GET" && req.url === "/metrics") {
          this.handleMetrics(req, res);
          return;
        }

        if (req.method === "GET" && req.url?.startsWith("/search")) {
          this.handleSearch(req, res);
          return;
        }

        if (req.method === "GET" && req.url?.startsWith("/history")) {
          this.handleHistory(req, res);
          return;
        }

        if (req.method === "GET" && req.url === "/eggs") {
          await this.handleGetEggs(req, res);
          return;
        }

        if (req.method === "POST" && req.url === "/ask") {
          await this.handleAsk(req, res);
          return;
        }

        if (req.method === "POST" && req.url === "/analyze") {
          await this.handleAnalyze(req, res);
          return;
        }

        if (req.method === "POST" && req.url === "/confirm") {
          await this.handleConfirm(req, res);
          return;
        }

        if (req.method === "POST" && req.url === "/create-egg") {
          await this.handleCreateEgg(req, res);
          return;
        }

        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Not found" }));
      } catch (err: any) {
        console.error("[NutEgg] Unhandled server error:", err);
        if (!res.headersSent) {
          res.writeHead(err?.statusCode || err?.status || 500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: err?.message || "Internal server error", errorCode: err?.code || "server_error" }));
        }
      }
    });

    return new Promise((resolve, reject) => {
      this.server!.listen(this.port, "127.0.0.1", () => {
        console.log(`[NutEgg] Server running on http://127.0.0.1:${this.port}`);
        resolve();
      });
      this.server!.on("error", (err) => {
        console.error("[NutEgg] Server error:", err);
        reject(err);
      });
    });
  }

  private async handleAiConfigComparison(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    if (!req.headers.origin?.startsWith("chrome-extension://") || !req.headers["content-type"]?.startsWith("application/json")) {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "AI settings must be read from Chrome" }));
      return;
    }
    let chromeConfig: any;
    try {
      chromeConfig = JSON.parse(await this.readBody(req, 64 * 1024));
      if (chromeConfig && typeof chromeConfig === "object") chromeConfig.aiAuthMethod ||= "apiKey";
      if (!chromeConfig || typeof chromeConfig !== "object" || Array.isArray(chromeConfig)) throw new Error("Invalid configuration");
    } catch {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid AI configuration" }));
      return;
    }
    // Wait for any active sync before comparing; never return credentials.
    await this.aiConfigQueue;
    const settings = this.plugin.settings;
    const aiConfig = {
      aiProvider: settings.aiProvider,
      aiAuthMethod: settings.aiAuthMethod || "apiKey",
      aiModel: settings.aiModel,
      chunkWindowChars: settings.chunkWindowChars,
      contentAnalysisMaxTokens: settings.contentAnalysisMaxTokens,
    };
    const isSub = settings.aiAuthMethod === "subscription" && chromeConfig.aiAuthMethod === "subscription";
    const matches = isSub || (
      Object.entries(aiConfig).every(([key, value]) => chromeConfig[key] === value)
      && typeof chromeConfig.aiApiKey === "string" && chromeConfig.aiApiKey.trim() === settings.aiApiKey.trim()
      && (settings.aiProvider !== "local" || (chromeConfig.localEndpoint === settings.localEndpoint && chromeConfig.localApiType === settings.localApiType))
    );
    res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
    res.end(JSON.stringify({ aiConfig, matches }));
  }

  private async handleAiConfig(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    // Only the extension can replace the mirrored AI config.
    if (!req.headers.origin?.startsWith("chrome-extension://") || !req.headers["content-type"]?.startsWith("application/json")) {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "AI settings must be synced from Chrome" }));
      return;
    }
    let config: any;
    try {
      config = JSON.parse(await this.readBody(req, 64 * 1024));
      if (config && typeof config === "object") config.aiAuthMethod ||= "apiKey";
      if (!config || !["apiKey", "subscription"].includes(config.aiAuthMethod)
        || !Object.hasOwn(PROVIDER_CATALOG, config.aiProvider)
        || typeof config.aiApiKey !== "string" || typeof config.aiModel !== "string"
        || typeof config.localEndpoint !== "string" || config.localApiType !== "openai"
        || !Number.isSafeInteger(config.chunkWindowChars) || config.chunkWindowChars < 1000
        || !Number.isSafeInteger(config.contentAnalysisMaxTokens) || config.contentAnalysisMaxTokens < 500) {
        throw new Error("Invalid AI configuration");
      }
    } catch {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid AI configuration" }));
      return;
    }
    if (config.aiAuthMethod === 'subscription' && !this.plugin.settings.subscriptionEnabled) {
      res.writeHead(403); res.end(JSON.stringify({ error: 'AI connection unavailable.', errorCode: 'subscription_disabled' })); return;
    }
    const settings = this.plugin.settings;
    let targetProvider = config.aiProvider;
    let targetModel = config.aiModel.trim();
    if (config.aiAuthMethod === 'subscription') {
      if (!supportsSubscription(targetProvider)) {
        targetProvider = supportsSubscription(settings.aiProvider) ? settings.aiProvider : 'gemini';
        targetModel = targetProvider === settings.aiProvider && settings.aiModel ? settings.aiModel : 'auto';
      } else if (supportsSubscription(settings.aiProvider) && targetProvider === 'gemini' && settings.aiProvider !== 'gemini' && (!config.aiModel || config.aiModel === 'auto')) {
        targetProvider = settings.aiProvider;
        targetModel = settings.aiModel || 'auto';
      }
      if (!targetModel) targetModel = 'auto';
    }
    const next = {
      aiProvider: targetProvider,
      aiAuthMethod: config.aiAuthMethod,
      aiApiKey: config.aiAuthMethod === "subscription" ? "" : config.aiApiKey.trim(),
      aiModel: targetModel,
      localEndpoint: config.localEndpoint.trim(),
      localApiType: config.localApiType,
      chunkWindowChars: config.chunkWindowChars,
      contentAnalysisMaxTokens: config.contentAnalysisMaxTokens,
    };
    const update = this.aiConfigQueue.then(async () => {
      if (Object.entries(next).some(([key, value]) => (settings as any)[key] !== value)) {
        const previous = Object.fromEntries(Object.keys(next).map(key => [key, (settings as any)[key]]));
        // Keep the settings object used by AIClient and AIProcessor alive.
        Object.assign(settings, next);
        if (previous.aiModel !== next.aiModel && supportsSubscription(next.aiProvider)) this.plugin.subscriptions?.clearModelFailure(next.aiProvider as SubscriptionProvider);
        try {
          await this.plugin.saveSettings();
          this.plugin.aiClient = new AIClient(this.plugin.settings, this.plugin.subscriptions);
          this.plugin.aiProcessor = new AIProcessor(this.plugin);
          this.plugin.refreshSettingsTab?.();
          this.plugin.updateCreditStatusBar?.();
        }
        catch (error) { Object.assign(settings, previous); throw error; }
      }
    });
    this.aiConfigQueue = update.catch(() => {});
    await update;
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: true }));
  }

  /**
   * GET /config-status — Returns AI configuration status for the popup to show warnings and credit info.
   */
  private async handleConfigStatus(res: http.ServerResponse): Promise<void> {
    try {
      const settings = this.plugin.settings;
      const issues: string[] = [];
      let status: "ok" | "warning" | "error" = "ok";

      if (!isAIConfigured(settings)) {
        issues.push("AI is not configured. Open NutEgg settings in Chrome to choose a provider and configure AI.");
        status = "error";
      }

      // Check if _index.md exists
      const indexExists = await this.plugin.app.vault.adapter.exists(settings.indexFile);
      if (!indexExists) {
        issues.push(`Index file "${settings.indexFile}" not found. Click the egg icon in Obsidian to create it.`);
        status = status === "error" ? "error" : "warning";
      }

      let credit = null;
      try {
        credit = await this.plugin.aiClient.checkCredit(settings);
      } catch {}

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        status,
        issues,
        port: this.port,
        version: this.plugin.manifest?.version || "",
        credit,
      }));
    } catch (err: any) {
      console.error("[NutEgg] Config status error:", err);
      if (!res.headersSent) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "error", issues: ["Failed to check configuration"] }));
      }
    }
  }

  /**
   * GET /credit — Returns live balance and credit status for the current AI provider.
   */
  private async handleCredit(res: http.ServerResponse): Promise<void> {
    try {
      const credit = await this.plugin.aiClient.checkCredit(this.plugin.settings);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(credit));
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: String(err) }));
    }
  }

  private handleDebugInfo(req: http.IncomingMessage, res: http.ServerResponse): void {
    const url = new URL(req.url || "/debug-info", `http://127.0.0.1:${this.port}`);
    const scope = normalizeAIDebugScope(url.searchParams.get("scope"));
    res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
    res.end(JSON.stringify(getAIDebugInfo(scope || "")));
  }

  private processorForDebugScope(scope?: string) {
    return this.plugin.aiProcessor?.withDebugScope?.(normalizeAIDebugScope(scope)) || this.plugin.aiProcessor;
  }

  /**
   * POST /ask — answer follow-up questions about already-analyzed content.
   * One lightweight AI call; no saving, no dedup cache interaction.
   */
  private async handleAsk(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
      const body = await this.readBody(req);
      const ask: AskRequest = JSON.parse(body);

      if (!ask.title || !ask.content || !ask.questions?.length) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Missing required fields: title, content, questions" }));
        return;
      }

      let normalizedPriorQa: any = ask.priorQa;
      if (typeof normalizedPriorQa !== "string" && !Array.isArray(normalizedPriorQa)) {
        normalizedPriorQa = [];
      }

      const processor = this.processorForDebugScope(ask.debugScope);
      const answers = await processor.askFollowUp(
        ask,
        ask.questions,
        normalizedPriorQa,
        ask.scope || "within"
      );

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ answers }));
    } catch (err) {
      console.error("[NutEgg] Ask error:", err);

      if (err instanceof AIError) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: err.message,
            errorCode: err.code,
            answers: [],
          })
        );
        return;
      }

      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Failed to answer. Please try again.", answers: [] }));
    }
  }

  /**
   * GET /history?url=... — cached captures for a URL, newest first.
   * The popup loads this on open so processed URLs show their result immediately.
   */
  private handleHistory(req: http.IncomingMessage, res: http.ServerResponse): void {
    const url = new URL(req.url || "/history", `http://127.0.0.1:${this.port}`);
    const target = url.searchParams.get("url")?.trim() || "";
    const history = target ? this.getCaptureHistory(target) : [];
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ history, latest: history[0] ?? null }));
  }

  /**
   * GET /search?q=... — BM25 keyword retrieval over saved nuts (RAG foundation).
   */
  private handleSearch(req: http.IncomingMessage, res: http.ServerResponse): void {
    const url = new URL(req.url || "/search", `http://127.0.0.1:${this.port}`);
    const q = url.searchParams.get("q")?.trim() || "";
    const db = this.plugin.db;

    if (!q || !db?.available) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ results: [] }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ results: db.search(q, 10) }));
  }

  /**
   * GET /metrics — nuts, knowledge generated (eggs), and time saved from SQLite aggregates.
   */
  private handleMetrics(_req: http.IncomingMessage, res: http.ServerResponse): void {
    try {
      const db = this.plugin.db;
      const stats = db?.available ? db.getStats() : { nuts: 0, eggs: 0, timeSavedMinutes: 0 };
      const eggs = stats.eggs ?? 0;
      const totalMinutes = Math.round(stats.timeSavedMinutes);
      const hours = Math.floor(totalMinutes / 60);
      const mins = Math.round(totalMinutes % 60);
      const timeSaved = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        nuts: stats.nuts,
        eggs,
        timeSavedMinutes: totalMinutes,
        timeSaved,
      }));
    } catch (err) {
      console.error("[NutEgg] Metrics error:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ nuts: 0, eggs: 0, timeSavedMinutes: 0, timeSaved: "0m" }));
    }
  }

  /**
   * GET /eggs — all eggs from _index.md (name, routing description, topic).
   * The popup uses this for the manual egg picker.
   */
  private async handleGetEggs(
    _req: http.IncomingMessage,
    res: http.ServerResponse
  ): Promise<void> {
    try {
      const indexContent = await this.plugin.indexReader.getIndexContent();
      const entries =
        indexContent === "(No _index.md found)"
          ? []
          : this.plugin.indexReader.parseIndexContent(indexContent);

      const eggs = [];
      for (const entry of entries) {
        let topic = "Unknown";
        try {
          const egg = await this.plugin.eggParser.readEgg(entry.fileName);
          if (egg?.topic && egg.topic !== "Unknown") topic = egg.topic;
        } catch {
          // Egg file unreadable — keep Unknown
        }
        eggs.push({
          fileName: entry.fileName,
          description: entry.description,
          topic,
        });
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ eggs }));
    } catch (err) {
      console.error("[NutEgg] Get eggs error:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ eggs: [] }));
    }
  }

  /**
   * POST /analyze — Analyze content against knowledge base, return results.
   * Does NOT save anything — the user must confirm via /confirm first.
   */
  private async handleAnalyze(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): Promise<void> {
    try {
      const body = await this.readBody(req);
      const capture: AnalyzeRequest = JSON.parse(body);
      capture.debugScope = normalizeAIDebugScope(capture.debugScope);
      const processor = this.processorForDebugScope(capture.debugScope);
      capture.discussion = capture.enabledSections?.discussion === true ? normalizeDiscussion(capture.discussion) : undefined;

      if (!capture.url || !capture.title) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({ error: "Missing required fields: url, title" })
        );
        return;
      }

      // If this URL has cached captures (and no fresh analysis was forced,
      // no custom questions asked, no manual egg selection), return the
      // capture history — the popup shows the latest result with its
      // timestamp and offers "Re-analyze".
      const hasQuestions = capture.questions && capture.questions.length > 0;
      const hasEggOverride = Array.isArray(capture.eggs);
      if (!capture.stage && !hasQuestions && !capture.force && !(hasEggOverride && capture.eggs!.length > 0)) {
        const history = this.getCaptureHistory(capture.url);
        if (history.length > 0) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ history, latest: history[0] }));
          return;
        }
      }

      // Stage 2: user confirmed eggs from Stage 1
      if (capture.stage === 2 || capture.stage === "2") {
        const indexContent = await this.plugin.indexReader.getIndexContent();
        const index = this.plugin.indexReader.parseIndexContent(indexContent);
        const targetEggs = (capture.eggs || []).map((fileName) => {
          const entry = index.find(
            (e) => e.fileName === fileName || e.fileName.endsWith("/" + fileName)
          );
          return { fileName, description: entry?.description || "" };
        });
        const eggs = await this.plugin.eggParser.readEggs(targetEggs);
        const contentAnalysis = capture.contentAnalysis || {
          titleVerdict: capture.title,
          coreSummary: [],
          mindMap: [],
          customQuestionAnswers: [],
        };
        let result = await processor.analyzeEggs(
          capture,
          eggs,
          contentAnalysis
        );
        if (Array.isArray(capture.selectedEggs)) {
          const allResults = new Map(
            (capture.cachedEggResults || []).map(egg => [egg.egg, egg])
          );
          for (const egg of result.eggResults) allResults.set(egg.egg, egg);
          result = composeEggResults(contentAnalysis,
            capture.selectedEggs.flatMap(egg => allResults.has(egg) ? [allResults.get(egg)!] : []),
            [...allResults.values()],
            capture.generateKnowledgeEntries !== false);
          result.generateKnowledgeEntries = capture.generateKnowledgeEntries !== false;
        }
        delete (result as any).stage;

        let nutId = capture.nutId;
        if (nutId && this.plugin.db?.getNutById(nutId)) {
          this.plugin.db.updateNut(nutId, {
            summary: [result.titleVerdict, ...(result.coreSummary || [])]
              .filter(Boolean)
              .join("\n"),
            matchedEggs: result.matchedEggs || [],
            analysisResult: result,
          });
        } else {
          nutId = this.recordNut(capture, result);
        }

        console.log(
          `[NutEgg] Analyzed (Stage 2): ${capture.title} — shouldRead=${result.shouldRead}, newKnowledge=${result.newKnowledge.length}`
        );
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ...result, stage: "stage2", nutId }));
        return;
      }

      // Stage 1 (default): content summary + egg routing via concise summary
      const contentAnalysis = await processor.analyzeContent(capture);
      const indexContent = await this.plugin.indexReader.getIndexContent();
      const index = this.plugin.indexReader.parseIndexContent(indexContent);

      let matchedEggs: string[] = [];
      if (hasEggOverride) {
        matchedEggs = capture.eggs!;
      } else {
        const summaryText = [
          contentAnalysis.titleVerdict,
          ...(contentAnalysis.coreSummary || []),
          ...(contentAnalysis.discussion?.topics.map(topic => `${topic.title}: ${topic.summary}`) || []),
        ]
          .filter(Boolean)
          .join("\n");
        const matchedIndex = await this.plugin.indexReader.matchEggs(
          { title: capture.title, url: capture.url, content: summaryText },
          index,
          capture.debugScope
        );
        matchedEggs = matchedIndex.map((e) => e.fileName);
      }

      const stage1Result = {
        ...contentAnalysis,
        matchedEggs,
        allEggs: index.map((e) => e.fileName),
        stage: "stage1" as const,
        schemaVersion: 3,
        shouldRead: null,
        shouldReadReason: "",
        eggResults: [],
        newKnowledge: [],
      };

      const nutId = this.recordNut(capture, stage1Result as any);

      console.log(
        `[NutEgg] Analyzed (Stage 1): ${capture.title} — matchedEggs=${matchedEggs.length}, nutId=${nutId}`
      );
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          ...stage1Result,
          nutId,
        })
      );
    } catch (err) {
      console.error("[NutEgg] Analyze error:", err);

      if (err instanceof AIError) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: err.message,
            errorCode: err.code,
            statusCode: err.statusCode,
            titleVerdict: "",
            coreSummary: [],
            schemaVersion: 3,
            shouldRead: null,
            shouldReadReason: "",
            matchedEggs: [],
            eggResults: [],
            newKnowledge: [],
          })
        );
        return;
      }

      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "Analysis failed. Please try again.",
          errorCode: "unknown",
          titleVerdict: "",
          coreSummary: [],
          schemaVersion: 3,
          shouldRead: null,
          shouldReadReason: "",
          matchedEggs: [],
          eggResults: [],
          newKnowledge: [],
        })
      );
    }
  }

  /** Serialize confirmations for a capture so retries observe its latest save ledger. */
  private async lockConfirmation(key: string): Promise<() => void> {
    const previous = this.confirmationQueues.get(key);
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    this.confirmationQueues.set(key, gate);
    await previous;
    return () => {
      release();
      if (this.confirmationQueues.get(key) === gate) this.confirmationQueues.delete(key);
    };
  }

  private knowledgeFingerprint(entry: { egg: string; content: string }): string {
    // Eggs are direct files in nutegg/; both basename and full-path selections occur.
    return createHash('sha256').update(JSON.stringify([entry.egg.split('/').pop(), entry.content.trim()])).digest('hex');
  }

  /** POST /confirm — archive the nut and append knowledge not previously hatched. */
  private async handleConfirm(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): Promise<void> {
    let releaseConfirmation: (() => void) | undefined;
    try {
      const body = await this.readBody(req);
      const confirm: ConfirmRequest = JSON.parse(body);
      confirm.discussion = confirm.enabledSections?.discussion === true ? normalizeDiscussion(confirm.discussion) : undefined;

      if (!confirm.url || !confirm.title) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({ error: "Missing required fields: url, title" })
        );
        return;
      }

      // Reject unsafe destinations before archiving, deduplicating, or writing any eggs.
      if ((confirm.newKnowledge || []).some(entry => !resolveEggPath(entry.egg, this.plugin.vaultFolder || "nutegg"))) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Knowledge destination must be an egg in the configured egg folder" }));
        return;
      }

      const normalizedUrl = this.normalizeUrl(confirm.url);
      releaseConfirmation = await this.lockConfirmation(confirm.nutId ? `nut:${confirm.nutId}` : `url:${normalizedUrl}`);
      const prior = confirm.nutId ? this.plugin.db?.getNutById?.(confirm.nutId) : this.plugin.db?.getNutByUrl?.(normalizedUrl);
      let confirmed = prior?.confirmedKnowledge;
      if (confirmed == null && prior?.processingResult === 'saved') {
        // Legacy rows have no ledger. The archive still holds the last Hatch,
        // whereas the DB analysis may already have been replaced by Stage 2.
        const archived = prior.fileName ? await this.plugin.knowledgeBase.readRawAnalysis?.(prior.fileName) : null;
        confirmed = (archived?.newKnowledge || prior.analysisResult?.newKnowledge || []).map(entry => this.knowledgeFingerprint(entry));
      }
      const fingerprints = new Set(confirmed || []);
      const pending = new Map<string, ConfirmRequest['newKnowledge'][number]>();
      for (const entry of confirm.newKnowledge || []) {
        const fingerprint = this.knowledgeFingerprint(entry);
        if (!fingerprints.has(fingerprint)) pending.set(fingerprint, entry);
      }
      confirm.newKnowledge = [...pending.values()];
      if (prior?.processingResult === "saved" && !pending.size) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, fileName: prior.fileName, alreadySaved: true }));
        return;
      }
      const hasKnowledge = confirm.newKnowledge && confirm.newKnowledge.length > 0;
      const saved = hasKnowledge || prior?.processingResult === 'saved' ? "saved" as const : "skip" as const;

      // Collect egg names from newKnowledge (deduplicated)
      const eggNames = hasKnowledge
        ? [...new Set(confirm.newKnowledge.map((k) => k.egg))]
        : (confirm.matchedEggs || []);

      // Frontmatter summary: explicit value, or rebuilt from the analysis result
      const summary = confirm.summary ||
        (confirm.analysis
          ? [confirm.analysis.titleVerdict, ...(confirm.analysis.coreSummary || [])]
              .filter(Boolean)
              .join("\n")
          : undefined);

      // Time estimate from metadata, or fallback to word count
      const timeEstimate = this.estimateTime(confirm.metadata, confirm.content);

      // Save raw content to _raw/ (skipped when the nut was already saved)
      let fileName = "";
      const rawAlreadySaved = prior?.fileName && ['saved', 'skip'].includes(prior.processingResult);
      if (!confirm.skipRaw && !rawAlreadySaved) {
        fileName = await this.plugin.knowledgeBase.saveRaw({
          url: confirm.url,
          title: confirm.title,
          content: confirm.content,
          discussion: confirm.discussion,
          enabledSections: confirm.enabledSections,
          sourceType: confirm.sourceType,
          metadata: confirm.metadata,
          summary,
          matchedEggs: eggNames,
          processingResult: saved,
          analysis: confirm.analysis,
        });
      } else if (prior?.fileName) {
        fileName = prior.fileName;
      }

      // Insert new knowledge into the eggs' Unprocessed sections. Entries
      // carry the insight + examples from the AI, plus author and source.
      const mergedEggs: MergeResult[] = [];
      if (hasKnowledge) {
        const author =
          confirm.metadata?.author ||
          confirm.metadata?.channel ||
          confirm.metadata?.handle ||
          "";
        await this.plugin.knowledgeBase.appendKnowledge(
          confirm.newKnowledge,
          confirm.title,
          confirm.url,
          author
        );

        // Ensure confirmed eggs have language frontmatter set if known from analysis
        const perEggList = confirm.analysis?.eggResults;
        if (Array.isArray(perEggList)) {
          for (const perEgg of perEggList) {
            if (perEgg?.egg && perEgg?.language) {
              try {
                const egg = await this.plugin.eggParser.readEgg(perEgg.egg);
                if (egg && !egg.language) {
                  await this.plugin.eggParser.processEgg(egg.fileName, content => insertEggLanguage(content, perEgg.language!));
                }
              } catch (err) {
                console.warn(`[NutEgg] Failed to persist egg language on confirm:`, err);
              }
            }
          }
        }
      }

      // Do not let a failed append make the legacy archive claim a successful Hatch.
      if (fileName && fileName === prior?.fileName && confirm.analysis) {
        await this.plugin.knowledgeBase.updateRawAnalysis(fileName, confirm.analysis);
      }

      // Update THIS capture's row in SQLite (identified by nutId from
      // /analyze or the history). Fall back to the latest row for the URL.
      const db = this.plugin.db;
      const targetId =
        confirm.nutId ?? prior?.id ?? null;
      const confirmedKnowledge = [...new Set([...fingerprints, ...pending.keys()])];
      if (targetId != null) {
        db?.updateNut(targetId, {
          processingResult: saved,
          confirmedKnowledge,
          ...(confirm.analysis ? { analysisResult: confirm.analysis } : {}),
          ...(fileName ? { fileName } : {}),
        });
      } else {
        // No prior row (e.g. DB was down during analyze) — record the save now
        db?.insertNut({
          url: normalizedUrl,
          title: confirm.title,
          sourceType: confirm.sourceType,
          content: confirm.content || "",
          savedAt: new Date().toISOString(),
          publishedAt: confirm.metadata?.published || "",
          author: confirm.metadata?.author ||
            confirm.metadata?.channel ||
            confirm.metadata?.handle ||
            "",
          timeEstimateMinutes: timeEstimate,
          processingResult: saved,
          confirmedKnowledge,
          summary: summary || "",
          matchedEggs: eggNames,
          fileName,
          analysisResult: confirm.analysis ?? null,
          capturePayload: this.captureSnapshot(confirm),
        });
      }

      console.log(
        `[NutEgg] Confirmed: ${confirm.title}${fileName ? ` -> ${fileName}` : ""}, knowledge entries: ${confirm.newKnowledge?.length || 0}` +
          (mergedEggs.length > 0
            ? `, merged: ${mergedEggs.map((m) => `${m.egg} (${m.entries})`).join(", ")}`
            : "")
      );

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: true,
          fileName,
          message: fileName ? `Saved to ${fileName}` : "Added to egg files",
          merged: mergedEggs,
        })
      );
      if (hasKnowledge) setTimeout(() => {
        for (const egg of eggNames) void this.processorForDebugScope(confirm.debugScope)?.maybeMergeEgg?.(egg)
          ?.catch(err => console.warn(`[NutEgg] Background merge failed for ${egg}`, err));
      }, 0);
    } catch (err) {
      console.error("[NutEgg] Confirm error:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Failed to save content" }));
    } finally {
      releaseConfirmation?.();
    }
  }

  /**
   * POST /create-egg — create a new egg file + index entry. Used by the
   * popup's "no egg matched — create one?" flow.
   */
  private async handleCreateEgg(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): Promise<void> {
    try {
      const body = await this.readBody(req);
      const { name, description }: CreateEggRequest = JSON.parse(body);
      const safeName = sanitizeEggName(name);
      if (!safeName) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Missing egg name" }));
        return;
      }

      const result = await this.plugin.indexSync.createEgg(
        safeName,
        String(description || "")
      );
      console.log(
        `[NutEgg] Created egg via popup: ${result.path}` +
          (result.alreadyExists ? " (already existed)" : "")
      );

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: true,
          path: result.path,
          alreadyExists: result.alreadyExists,
          language: result.language,
        })
      );
    } catch (err) {
      console.error("[NutEgg] Create egg error:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Failed to create egg" }));
    }
  }

  private readBody(req: http.IncomingMessage, maxBytes = 25 * 1024 * 1024): Promise<string> {
    return new Promise((resolve, reject) => {
      let data = "";
      let bytes = 0;
      let settled = false;
      req.on("data", (chunk) => {
        bytes += chunk.length;
        if (bytes > maxBytes) {
          settled = true;
          req.destroy(new Error("Request body too large (exceeds 25MB)"));
          reject(new Error("Request body too large (exceeds 25MB)"));
          return;
        }
        data += chunk;
      });
      req.on("end", () => {
        if (!settled) {
          settled = true;
          resolve(data);
        }
      });
      req.on("error", (err) => {
        if (!settled) {
          settled = true;
          reject(err);
        }
      });
    });
  }

  async stop(): Promise<void> {
    if (!this.server) return;
    return new Promise((resolve) => {
      this.server!.close(() => {
        console.log("[NutEgg] Server stopped");
        this.server = null;
        resolve();
      });
    });
  }

  isRunning(): boolean {
    return this.server !== null;
  }
}
