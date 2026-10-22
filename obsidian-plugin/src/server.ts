import { trackAIRequest } from '../../shared/src/ai-diagnostics';
import { ExecutionCoordinator, ExecutionProtocolError, type Job } from './execution-coordinator';
import { EXECUTION_PROTOCOL, publicExecutionSettings } from '../../shared/src/execution';
import { randomUUID } from 'node:crypto';
import { PROMPTS } from './prompt-templates';
import { t } from './i18n';
import { ConnectionAccess } from './connection-access';
import { supportsSubscription, resolveLocalEndpoint } from '../../shared/src/catalog';
import type { SubscriptionProvider } from '../../shared/src/types';
import { normalizeDiscussion } from '../../shared/src/discussion';
import { getVideoIdentity, normalizeContentUrl } from '../../shared/src/content-url';
import { getAIDebugInfo, normalizeAIDebugScope } from '../../shared/src/ai-diagnostics';
import { normalizeCaptureCoverage } from '../../shared/src/capture-coverage';
import type { CaptureCoverage, CapturePayload, DiscussionCapture } from '../../shared/src/types';
import * as http from 'http';
import { createHash } from 'crypto';
import type NutEggPlugin from './main';
import { AIClient, AIError, isAIConfigured, PROVIDER_CATALOG } from './ai-client';
import {
  AIProcessor,
  type AnalysisResult,
  type AnalysisSectionsConfig,
  type ContentAnalysis,
  type MergeResult,
  type QuestionScope,
} from './ai-processor';
import { sanitizeEggName } from './index-sync';
import { composeEggResults } from '../../shared/src/analysis-results';
import type { EggAnalysis } from '../../shared/src/types';
import { isEggPath, insertEggLanguage, resolveEggPath } from './egg-parser';

interface AnalyzeRequest {
  debugScope?: string;
  discussion?: DiscussionCapture;
  enabledSections?: Partial<AnalysisSectionsConfig>;
  transcriptAvailable?: boolean;
  captureCoverage?: CaptureCoverage;
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
  stream?: boolean;
}

interface AskRequest {
  debugScope?: string;
  discussion?: DiscussionCapture;
  enabledSections?: Partial<AnalysisSectionsConfig>;
  transcriptAvailable?: boolean;
  captureCoverage?: CaptureCoverage;
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
  captureCoverage?: CaptureCoverage;
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
  saved: 'saved' | 'skip' | 'analyzed';
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
  readonly execution: ExecutionCoordinator;
  private requestJobs = new WeakMap<http.IncomingMessage, Job>();
  private requestBodies = new WeakMap<http.IncomingMessage, string>();
  private sockets = new Set<any>();
  private heartbeat?: ReturnType<typeof setInterval>;
  private wss: any;

  private confirmationQueues = new Map<string, Promise<void>>();
  private server: http.Server | null = null;
  private plugin: NutEggPlugin;
  private port: number;

  constructor(plugin: NutEggPlugin, port: number) {
    this.plugin = plugin;
    this.port = port;
    this.execution = new ExecutionCoordinator(
      ExecutionCoordinator.initial(
        plugin.settings.executionState,
        true,
        plugin.settings.subscriptionSelection,
        plugin.settings.aiAuthMethod
      ),
      state => plugin.persistExecutionState(state),
      async () => {
        await plugin.subscriptions.cancelWork();
      }
    );
    this.execution.state.chatgpt = plugin.chatgpt?.status() || {
      available: false,
      state: 'error',
      revision: 1,
      accountLabel: '',
      model: '',
      message: [t('chatgptStorageUnavailable'), plugin.chatgptStartupError
        ? t('chatgptStartupDiagnostic', { code: plugin.chatgptStartupError }) : ''].filter(Boolean).join(' '),
    };
  }

  private executor(settings: any, signal: AbortSignal) {
    if (settings.aiAuthMethod === 'chatgpt')
      return {
        chat: (request: any) => {
          if (!this.plugin.chatgpt)
            throw new AIError('auth_failed', 'ChatGPT sign-in is unavailable. Open NutEgg settings in Obsidian.');
          return trackAIRequest(
            request.prompt,
            () => this.plugin.chatgpt!.chat(settings.aiModel, request.prompt, signal),
            request.debugScope,
            { signal }
          );
        },
      };
    const client = new AIClient(settings, this.plugin.subscriptions, signal);
    return { chat: (request: any) => client.chat(request.prompt, request.maxTokens, request.debugScope) };
  }
  private processor(job: Job, scope?: string): AIProcessor {
    const prompts = (job as any).prompts || { ...PROMPTS };
    if (!(job as any).prompts) {
      for (const key of Object.keys(prompts)) {
        (prompts as any)[key] = this.plugin.workflowManager?.getPrompt(key as any) || (prompts as any)[key];
      }
    }
    (job as any).prompts = prompts;
    const assertActive = () => this.execution.assertActive(job);
    const host = {
      settings: job.settings,
      signal: job.controller.signal,
      assertActive,
      isConfigured: () => (job.metadata.authMethod === 'apiKey' && !!job.session) || isAIConfigured(job.settings),
      workflowManager: { getPrompt: (key: string) => (prompts as any)[key] },
      aiClient: {
        chat: async (prompt: string, maxTokens = 16384, debugScope?: string) => {
          assertActive();
          const result = await job.executor.chat({ prompt, maxTokens, debugScope }, job.controller.signal);
          assertActive();
          return result;
        },
      },
      eggParser: this.plugin.eggParser,
      indexReader: this.plugin.indexReader,
      app: this.plugin.app,
      withEggLock: <T>(path: string, task: () => Promise<T>) =>
        this.execution.withEggLock(resolveEggPath(path, this.plugin.vaultFolder) || path, async () => {
          assertActive();
          return task();
        }),
    };
    return new AIProcessor(host, normalizeAIDebugScope(scope));
  }
  private requireChatGPTReady() {
    if (this.execution.state.mode !== 'chatgpt') return;
    const status = this.plugin.chatgpt?.status();
    if (!status?.available || status.state !== 'ready')
      throw new AIError('auth_failed', 'Reconnect ChatGPT sign-in in NutEgg settings in Obsidian.');
    if (!status.model) throw new AIError('model_not_found', 'Choose an available ChatGPT model in NutEgg settings.');
  }
  async runNative<T>(task: (processor: AIProcessor) => Promise<T>, scope?: string, allowNoAI = false): Promise<T> {
    this.requireChatGPTReady();
    if (!allowNoAI && this.execution.state.mode === 'apiKey' && !isAIConfigured(this.plugin.getNativeSettings())) {
      throw new AIError('no_api_key', 'Configure AI for Obsidian actions in NutEgg settings.');
    }
    const job = this.execution.native(this.plugin.getNativeSettings(), (settings, signal) =>
      this.executor(settings, signal)
    );
    try {
      return await task(this.processor(job, scope));
    } finally {
      this.execution.complete(job);
    }
  }
  async nativeChat(prompt: string, maxTokens: number, debugScope?: string) {
    this.requireChatGPTReady();
    const job = this.execution.native(this.plugin.getNativeSettings(), (settings, signal) =>
      this.executor(settings, signal)
    );
    try {
      const text = await job.executor.chat({ prompt, maxTokens, debugScope }, job.controller.signal);
      this.execution.assertActive(job);
      return text;
    } finally {
      this.execution.complete(job);
    }
  }
  async changeSubscription(selection: any) {
    return this.execution.change(this.execution.state.revision, randomUUID(), { subscription: selection });
  }
  cancelNative() {
    this.execution.cancelJobs(job => !job.session);
  }
  private async prepareJob(req: http.IncomingMessage, res: http.ServerResponse, origin: string) {
    const body = await this.readBody(req);
    const payload = JSON.parse(body);
    if (
      Object.keys(payload.execution?.settings || {}).some(key => /apiKey|pair.*token|credential|endpoint/i.test(key))
    ) {
      throw new ExecutionProtocolError('credential_payload', 'Credentials must stay in Chrome.', 400);
    }
    const settings = publicExecutionSettings(this.plugin.getNativeSettings());
    // Saving existing results remains available, but unavailable managed execution
    // must never turn an analysis into an empty successful result.
    if (req.url !== '/confirm') this.requireChatGPTReady();
    const credentialId = this.plugin.connectionAccess.credentialId(origin, req.headers.authorization!);
    const job = this.execution.admit(payload.execution, origin, credentialId, settings, (captured, signal) =>
      this.executor(captured, signal)
    );
    this.requestJobs.set(req, job);
    this.requestBodies.set(req, body);
    const aborted = () => {
      // Closing the transport releases browser HTTP capacity even if a provider
      // does not settle promptly after cancellation. Never rewrite sent headers.
      if (!res.writableEnded) res.destroy();
    };
    job.controller.signal.addEventListener('abort', aborted, { once: true });
    const end = res.end.bind(res);
    const writeHead = res.writeHead.bind(res);
    let contentType = '';
    (res as any).writeHead = (status: any, ...args: any[]) => {
      const headers = args.find(value => value && typeof value === 'object');
      contentType =
        headers?.['Content-Type'] || headers?.['content-type'] || String(res.getHeader('Content-Type') || '');
      return (writeHead as any)(status, ...args);
    };
    (res as any).end = (chunk: any, ...args: any[]) => {
      if (chunk && contentType === 'application/json') {
        try {
          const data = JSON.parse(String(chunk));
          data.execution = job.metadata;
          chunk = JSON.stringify(data);
        } catch {}
      }
      return (end as any)(chunk, ...args);
    };
    res.on('finish', () => {
      job.controller.signal.removeEventListener('abort', aborted);
      this.execution.complete(job);
    });
    res.on('close', () => {
      job.controller.signal.removeEventListener('abort', aborted);
      if (!res.writableFinished) this.execution.cancelJobs(candidate => candidate === job);
    });
    this.processor(job, payload.debugScope);
  }
  private attachWebSocket() {
    const { WebSocketServer } = require('ws');
    this.wss = new WebSocketServer({ noServer: true, maxPayload: 25 * 1024 * 1024, perMessageDeflate: false });
    this.server!.on('upgrade', (req: any, socket: any, head: any) => {
      const origin = req.headers.origin;
      if (
        req.url !== '/execution/socket' ||
        !/^127\.0\.0\.1:\d+$/.test(req.headers.host || '') ||
        !ConnectionAccess.validOrigin(origin)
      ) {
        socket.destroy();
        return;
      }
      this.wss.handleUpgrade(req, socket, head, (ws: any) => {
        this.sockets.add(ws);
        let sessionId: string | undefined;
        const authTimer = setTimeout(() => ws.close(1008, 'Authentication required'), 5000);
        ws.on('message', async (raw: any) => {
          try {
            const message = JSON.parse(String(raw));
            if (!sessionId) {
              if (
                message.type !== 'authenticate' ||
                message.protocolVersion !== EXECUTION_PROTOCOL ||
                message.instanceId !== this.execution.state.instanceId
              ) {
                throw new Error('Invalid session.');
              }
              const credentialId = await this.plugin.connectionAccess.bindClient(
                origin,
                `Bearer ${message.credential}`,
                message.clientId
              );
              if (ws.readyState !== 1) return;
              sessionId = randomUUID();
              clearTimeout(authTimer);
              const configuration = publicExecutionSettings(message.configuration || {});
              this.syncOutputLanguage(configuration.outputLanguage);
              this.execution.attach({
                chunkWindowChars: configuration.chunkWindowChars,
                contentAnalysisMaxTokens: configuration.contentAnalysisMaxTokens,
                provider: configuration.chromeAiProvider || configuration.aiProvider,
                model: configuration.chromeAiModel || configuration.aiModel,
                configurationRevision: String(message.configurationRevision || 'initial'),
                clientId: message.clientId,
                sessionId,
                origin,
                credentialId,
                displayName: String(message.displayName || 'Chrome').slice(0, 80),
                connected: true,
                seen: Date.now(),
                send: data => {
                  if (ws.readyState === 1) ws.send(JSON.stringify(data));
                },
              });
            } else {
              const session = this.execution.sessions.get(sessionId);
              if (!session) throw new Error('Session expired.');
              session.seen = Date.now();
              if (message.type === 'heartbeat') {
                ws.send(JSON.stringify({ type: 'heartbeat' }));
              } else if (message.type === 'ai-result') {
                this.execution.result(sessionId, message);
              } else if (message.type === 'configuration-changed') {
                const configuration = publicExecutionSettings(message.configuration || {});
                if (typeof message.configurationRevision !== 'string' || message.configurationRevision.length > 100) {
                  throw new Error('Invalid configuration revision.');
                }
                this.syncOutputLanguage(configuration.outputLanguage);
                session.provider = configuration.chromeAiProvider || configuration.aiProvider;
                session.model = configuration.chromeAiModel || configuration.aiModel;
                session.configurationRevision = message.configurationRevision;
                session.chunkWindowChars = configuration.chunkWindowChars;
                session.contentAnalysisMaxTokens = configuration.contentAnalysisMaxTokens;
                this.execution.cancelJobs(
                  job => job.session === session && job.metadata.configurationRevision !== message.configurationRevision
                );
              } else if (message.type === 'cancel-job') {
                this.execution.cancelJobs(job => job.session === session && job.metadata.jobId === message.jobId);
              } else {
                throw new Error('Unknown message.');
              }
            }
          } catch {
            ws.close(1008, 'Invalid execution message');
          }
        });
        ws.on('close', () => {
          clearTimeout(authTimer);
          this.sockets.delete(ws);
          if (sessionId) this.execution.detach(sessionId);
        });
        ws.on('error', () => {});
      });
    });
    this.heartbeat = setInterval(() => {
      const now = Date.now();
      for (const session of this.execution.sessions.values()) {
        if (now - session.seen > 60000) this.execution.detach(session.sessionId);
      }
      for (const ws of this.sockets) {
        if (ws.readyState === 1) ws.send(JSON.stringify({ type: 'heartbeat' }));
      }
    }, 20000);
    this.heartbeat.unref?.();
  }

  getConnectionStatus() {
    return {
      listening: this.server?.listening === true,
      ...this.plugin.connectionAccess?.getStatus(),
      recentClients: this.execution.sessions.size,
      clients: this.execution.clients(),
      execution: this.execution.snapshot(),
    };
  }

  syncOutputLanguage(lang?: string): void {
    if (!lang) return;
    const trimmed = lang.trim();
    if (!trimmed || trimmed === this.plugin.settings.outputLanguage || trimmed.length > 100) return;
    this.plugin.settings.outputLanguage = trimmed;
    void this.plugin.saveSettings().catch(() => {});
    try {
      this.plugin.settingsTab?.display();
    } catch {}
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
      const legacy = (db.getNutHistoryByPattern?.(`%${video.id}%`) || []).filter(
        row => this.normalizeUrl(row.url) === normalized
      );
      rows = [...new Map([...rows, ...legacy].map(row => [row.id, row])).values()].sort((a, b) => b.id - a.id);
    } else if (rows.length === 0) {
      const twMatch = normalized.match(/x\.com\/[^/]+\/status\/(\d+)/);
      if (twMatch) {
        rows = db.getNutHistoryByPattern(`%/status/${twMatch[1]}%`);
      }
    }

    return rows
      .filter(row => (row.analysisResult as any)?.schemaVersion === 3)
      .map(row => ({
        nutId: row.id,
        capturedAt: row.savedAt,
        saved: row.processingResult === 'saved' || row.processingResult === 'skip' ? row.processingResult : 'analyzed',
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

  private captureSnapshot(
    capture: AnalyzeRequest | ConfirmRequest
  ): CapturePayload & { metadata?: Record<string, string> } {
    return {
      url: capture.url,
      title: capture.title,
      content: capture.content || '',
      sourceType: capture.sourceType,
      metadata: capture.metadata,
      enabledSections: capture.enabledSections,
      transcriptAvailable: capture.transcriptAvailable,
      captureCoverage: normalizeCaptureCoverage(capture.captureCoverage),
      mediaType: capture.mediaType,
      ...('chapters' in capture ? { chapters: capture.chapters } : {}),
      ...('outputLanguage' in capture ? { outputLanguage: capture.outputLanguage } : {}),
      discussion: capture.enabledSections?.discussion === true ? normalizeDiscussion(capture.discussion) : undefined,
    };
  }

  /** Reading/watch time estimate from metadata, or word-count fallback. */
  private estimateTime(metadata: Record<string, string> | undefined, content: string): number {
    return (
      parseInt(metadata?.time_estimate_minutes || '0', 10) ||
      Math.max(1, Math.ceil((content?.split(/\s+/)?.length || 0) / 200))
    );
  }

  /** Count egg files (direct markdown notes under vaultFolder/, excluding system files). */
  private countEggs(): number {
    const folder = this.plugin.vaultFolder || 'nutegg';
    return this.plugin.app.vault.getMarkdownFiles().filter(f => isEggPath(f.path, folder)).length;
  }

  /** Insert a capture entry into the SQLite DB if available. */
  private recordNut(capture: AnalyzeRequest, result: AnalysisResult): number | undefined {
    const job = this.execution.jobs.get((capture as any).execution?.jobId);
    if (job) {
      this.execution.assertActive(job);
      (result as any).execution = structuredClone(job.metadata);
    }
    return (
      this.plugin.db?.insertNut({
        url: this.normalizeUrl(capture.url),
        title: capture.title,
        sourceType: capture.sourceType,
        content: capture.content || '',
        savedAt: new Date().toISOString(),
        publishedAt: capture.metadata?.published || '',
        author: capture.metadata?.author || capture.metadata?.channel || capture.metadata?.handle || '',
        timeEstimateMinutes: this.estimateTime(capture.metadata, capture.content),
        processingResult: 'analyzed',
        summary: [result.titleVerdict, ...(result.coreSummary || [])].filter(Boolean).join('\n'),
        matchedEggs: result.matchedEggs || [],
        fileName: '',
        analysisResult: result,
        capturePayload: this.captureSnapshot(capture),
      }) ?? undefined
    );
  }

  private syncCaptureLanguage(req: http.IncomingMessage, language?: string): void {
    const header = req.headers?.['x-nutegg-output-language'];
    if (language) this.syncOutputLanguage(language);
    else if (typeof header === 'string') {
      try {
        this.syncOutputLanguage(decodeURIComponent(header));
      } catch {}
    }
  }

  private captureRecord(capture: { nutId?: number }) {
    return Number.isSafeInteger(capture.nutId) && capture.nutId! > 0
      ? this.plugin.db?.getNutById(capture.nutId!)
      : undefined;
  }

  /** Never trust a capture row ID without checking the originating page. */
  private captureRecordMatches(capture: { url: string; metadata?: Record<string, string> }, row: any): boolean {
    if (!row?.url || this.normalizeUrl(row.url) !== this.normalizeUrl(capture.url)) return false;
    const oldCid = row.capturePayload?.metadata?.cid;
    const newCid = capture.metadata?.cid;
    return oldCid == null || newCid == null || String(oldCid) === String(newCid);
  }

  private rejectCaptureIdentity(res: http.ServerResponse): void {
    res.writeHead(409, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        error: t('captureIdentityMismatch'),
        errorCode: 'capture_identity_mismatch',
      })
    );
  }

  /** Canonical content identity, preserving application routes and video parts. */
  normalizeUrl(url: string): string {
    return normalizeContentUrl(url);
  }

  async start(): Promise<void> {
    await this.execution.recover();
    if (this.server) {
      console.log('[NutEgg] Server is already running');
      return;
    }

    this.server = http.createServer(async (req, res) => {
      // Validate Host and Origin before dispatch, including preflight.
      const requestOrigin = req.headers.origin;
      const extensionOrigin = req.headers['x-nutegg-extension-origin'];
      const isBadExtensionOrigin =
        extensionOrigin !== undefined &&
        (typeof extensionOrigin !== 'string' ||
          !ConnectionAccess.validOrigin(extensionOrigin) ||
          (requestOrigin && extensionOrigin !== requestOrigin));
      const isBadHost = !/^127\.0\.0\.1:\d+$/.test(req.headers.host || '');
      const isBadOrigin = Boolean(
        requestOrigin && !ConnectionAccess.validOrigin(requestOrigin) && requestOrigin !== 'app://obsidian.md'
      );

      if (isBadHost || isBadExtensionOrigin || isBadOrigin) {
        res.writeHead(403);
        res.end('Forbidden host or origin');
        return;
      }
      // CORS headers for Chrome extension and local tooling only
      const origin = req.headers.origin as string | undefined;
      const isAllowedOrigin =
        !origin ||
        origin.startsWith('chrome-extension://') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('app://obsidian.md');

      if (origin && isAllowedOrigin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      } else if (!origin) {
        res.setHeader('Access-Control-Allow-Origin', '*');
      }

      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-NutEgg-Extension-Version, X-NutEgg-Extension-Origin, X-NutEgg-Output-Language'
      );

      if (req.method === 'OPTIONS') {
        if (origin && !isAllowedOrigin) {
          res.writeHead(403);
          res.end('Forbidden origin');
          return;
        }
        res.writeHead(204);
        res.end();
        return;
      }

      try {
        const headerLang = req.headers['x-nutegg-output-language'];
        if (!['/analyze', '/confirm'].includes(req.url || '') && typeof headerLang === 'string' && headerLang.trim()) {
          try {
            this.syncOutputLanguage(decodeURIComponent(headerLang.trim()));
          } catch {}
        }
        const clientOrigin = requestOrigin || (extensionOrigin as string | undefined);
        if (req.method === 'POST' && ['/connection/start', '/connection/finish'].includes(req.url || '')) {
          if (
            !ConnectionAccess.validOrigin(clientOrigin) ||
            !req.headers['content-type']?.startsWith('application/json')
          ) {
            res.writeHead(403);
            res.end('Chrome connection required');
            return;
          }
          const data = JSON.parse(await this.readBody(req, 4096));
          const access = this.plugin.connectionAccess;
          const result =
            req.url === '/connection/start'
              ? access.start(clientOrigin, data.nonce, requestOrigin)
              : access.finish(clientOrigin, data.nonce);
          res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
          res.end(JSON.stringify(result));
          return;
        }
        if (
          req.url !== '/health' &&
          !this.plugin.connectionAccess?.authorized(clientOrigin, req.headers.authorization)
        ) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              error: 'Connect NutEgg Chrome in Obsidian first.',
              errorCode: 'connection_required',
            })
          );
          return;
        }
        if (req.method === 'GET' && req.url === '/execution/state') {
          res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
          res.end(JSON.stringify({ state: this.execution.snapshot(), clients: this.execution.clients() }));
          return;
        }
        if (req.method === 'POST' && req.url === '/execution/native-api/sync') {
          const data = JSON.parse(await this.readBody(req, 16384));
          const session = this.execution.sessions.get(data.sessionId);
          if (
            !session ||
            session.clientId !== data.clientId ||
            session.origin !== clientOrigin ||
            session.credentialId !==
              this.plugin.connectionAccess.credentialId(clientOrigin!, req.headers.authorization!)
          ) {
            throw new ExecutionProtocolError('session_required', 'Reconnect this Chrome profile.', 401);
          }
          if (data.instanceId !== this.execution.state.instanceId) {
            throw new ExecutionProtocolError('instance_changed', 'Reconnect to this Obsidian instance.');
          }
          if (
            data.expectedRevision !== this.execution.state.revision ||
            this.execution.state.mode !== 'apiKey' ||
            this.execution.state.transition !== 'ready'
          ) {
            throw new ExecutionProtocolError('stale_revision', 'AI mode changed. Refresh before saving again.');
          }
          const config = data.config || {};
          if (
            !Object.hasOwn(PROVIDER_CATALOG, config.aiProvider) ||
            typeof config.aiModel !== 'string' ||
            !config.aiModel.trim() ||
            config.aiModel.length > 512 ||
            typeof data.key !== 'string' ||
            (config.aiProvider !== 'local' && !data.key.trim()) ||
            data.key.length > 8192
          ) {
            throw new ExecutionProtocolError('invalid_configuration', 'Invalid API configuration.', 400);
          }
          if (
            config.localEndpoint !== undefined &&
            (typeof config.localEndpoint !== 'string' ||
              config.localEndpoint.length > 2048)
          ) {
            throw new ExecutionProtocolError('invalid_configuration', 'Invalid API endpoint.', 400);
          }
          const safe = {
            aiProvider: config.aiProvider,
            aiModel: config.aiModel,
            aiSource: config.aiSource === 'openrouter' ? ('openrouter' as const) : ('official' as const),
            aiModelFamily: typeof config.aiModelFamily === 'string' ? config.aiModelFamily.slice(0, 512) : undefined,
            ...(config.localEndpoint ? { localEndpoint: config.localEndpoint } : {}),
            localApiType: config.localApiType === 'ollama' ? ('ollama' as const) : ('openai' as const),
            ...publicExecutionSettings({
              chunkWindowChars: config.chunkWindowChars,
              contentAnalysisMaxTokens: config.contentAnalysisMaxTokens,
            }),
          };
          if (safe.aiProvider === 'local') {
            try {
              resolveLocalEndpoint({ ...safe, aiApiKey: data.key });
            } catch {
              throw new ExecutionProtocolError('invalid_configuration', 'Invalid or insecure local API endpoint.', 400);
            }
          }
          try {
            const synced = await this.plugin.syncNativeApi(safe, data.key.trim());
            res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
            res.end(JSON.stringify({ synced }));
          } catch {
            // Never expose a SecretStorage error or a request containing a key.
            res.writeHead(503, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
            res.end(
              JSON.stringify({
                error: 'Could not securely sync Obsidian AI. Check SecretStorage availability (Obsidian 1.11.4+).',
              })
            );
          }
          return;
        }
        if (req.method === 'POST' && req.url === '/execution/mode') {
          const data = JSON.parse(await this.readBody(req, 4096));
          const session = this.execution.sessions.get(data.sessionId);
          if (
            !session ||
            session.clientId !== data.clientId ||
            session.credentialId !==
              this.plugin.connectionAccess.credentialId(clientOrigin!, req.headers.authorization!)
          ) {
            throw new ExecutionProtocolError('session_required', 'Reconnect this Chrome profile.', 401);
          }
          if (data.instanceId !== this.execution.state.instanceId) {
            throw new ExecutionProtocolError('instance_changed', 'Reconnect to this Obsidian instance.');
          }
          const state = await this.execution.change(data.expectedRevision, data.operationId, { mode: data.mode });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ state }));
          return;
        }
        if (req.method === 'POST' && ['/ai-config', '/ai-config-status'].includes(req.url || '')) {
          throw new ExecutionProtocolError(
            'update_required',
            'Update NutEgg Chrome to use the execution protocol.',
            426
          );
        }
        if (req.method === 'POST' && ['/analyze', '/ask', '/confirm', '/create-egg'].includes(req.url || '')) {
          await this.prepareJob(req, res, clientOrigin!);
        }
        if (req.method === 'POST' && req.url?.startsWith('/chatgpt/')) {
          const service = this.plugin.chatgpt;
          if (!service)
            throw new ExecutionProtocolError(
              'chatgpt_unavailable',
              'Open NutEgg settings in Obsidian to check local credential storage.',
              503
            );
          const data = JSON.parse(await this.readBody(req, 4096));
          if (
            ['/chatgpt/signin', '/chatgpt/cancel', '/chatgpt/signout', '/chatgpt/model'].includes(req.url!) &&
            data.expectedConnectionRevision !== service.status().revision
          ) {
            throw new ExecutionProtocolError(
              'revision_conflict',
              'ChatGPT connection changed. Refresh before trying again.'
            );
          }
          let result: any;
          switch (req.url) {
            case '/chatgpt/status':
              result = service.status();
              break;
            case '/chatgpt/signin':
              result = await service.signIn();
              break;
            case '/chatgpt/cancel':
              result = service.cancelSignIn();
              break;
            case '/chatgpt/signout':
              result = await service.signOut();
              break;
            case '/chatgpt/models':
              result = { models: await service.models(data.refresh === true) };
              break;
            case '/chatgpt/model':
              result = service.selectModel(data.model);
              break;
            default:
              throw new ExecutionProtocolError('invalid_operation', 'Invalid ChatGPT operation.', 400);
          }
          await this.execution.updateChatGPT(service.status());
          res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
          res.end(JSON.stringify({ ...result, state: this.execution.snapshot() }));
          return;
        }
        if (req.method === 'POST' && req.url?.startsWith('/subscription/')) {
          const data = JSON.parse(await this.readBody(req, 4096));
          if (!supportsSubscription(data.provider)) {
            res.writeHead(400);
            res.end('Invalid provider');
            return;
          }
          const provider = data.provider as SubscriptionProvider;
          if (this.plugin.settings.aiAuthMethod !== 'subscription') {
            res.writeHead(403);
            res.end(
              JSON.stringify({
                state: 'disabled',
                errorCode: 'subscription_disabled',
                error: 'AI connection unavailable.',
              })
            );
            return;
          }
          const service = this.plugin.subscriptions;
          let result: any;
          switch (req.url) {
            case '/subscription/status':
              result = {
                ...(await service.status(this.execution.state.subscription.provider)),
                model: this.execution.state.subscription.model,
              };
              break;
            case '/subscription/models':
              throw new ExecutionProtocolError('obsidian_only', 'Manage models in Obsidian.', 403);
            case '/subscription/login/start':
              throw new ExecutionProtocolError('obsidian_only', 'Authorize in Obsidian.', 403);
            case '/subscription/login/status':
              throw new ExecutionProtocolError('obsidian_only', 'Authorize in Obsidian.', 403);
            case '/subscription/login/cancel':
              throw new ExecutionProtocolError('obsidian_only', 'Authorize in Obsidian.', 403);
            case '/subscription/test':
              throw new ExecutionProtocolError('obsidian_only', 'Test the connection in Obsidian.', 403);
            default:
              res.writeHead(404);
              res.end('Not found');
              return;
          }
          res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
          res.end(JSON.stringify(result));
          return;
        }
        if (req.method === 'GET' && req.url === '/health') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              status: 'ok',
              capabilities: [
                'subscription-v1',
                'connection-approval-v1',
                'execution-v3',
                'native-api-sync-v1',
                'chatgpt-v1',
              ],
              instanceId: this.execution.state.instanceId,
              protocolVersion: EXECUTION_PROTOCOL,
              subscriptionEnabled: true,
              port: this.port,
              version: this.plugin.manifest?.version || '',
              timestamp: Date.now(),
            })
          );
          return;
        }

        if (req.method === 'POST' && req.url === '/ai-config-status') {
          throw new ExecutionProtocolError('update_required', 'Update NutEgg Chrome.', 426);
          return;
        }

        if (req.method === 'POST' && req.url === '/ai-config') {
          throw new ExecutionProtocolError('update_required', 'Update NutEgg Chrome.', 426);
          return;
        }

        if (req.method === 'GET' && req.url === '/config-status') {
          await this.handleConfigStatus(res);
          return;
        }

        if (req.method === 'GET' && req.url === '/credit') {
          await this.handleCredit(res);
          return;
        }

        if (req.method === 'GET' && req.url?.split('?')[0] === '/debug-info') {
          this.handleDebugInfo(req, res);
          return;
        }

        if (req.method === 'GET' && req.url === '/metrics') {
          this.handleMetrics(req, res);
          return;
        }

        if (req.method === 'GET' && req.url?.startsWith('/search')) {
          this.handleSearch(req, res);
          return;
        }

        if (req.method === 'GET' && req.url?.startsWith('/history')) {
          this.handleHistory(req, res);
          return;
        }

        if (req.method === 'GET' && req.url === '/eggs') {
          await this.handleGetEggs(req, res);
          return;
        }

        if (req.method === 'POST' && req.url === '/ask') {
          await this.handleAsk(req, res);
          return;
        }

        if (req.method === 'POST' && req.url === '/analyze') {
          await this.handleAnalyze(req, res);
          return;
        }

        if (req.method === 'POST' && req.url === '/confirm') {
          await this.handleConfirm(req, res);
          return;
        }

        if (req.method === 'POST' && req.url === '/create-egg') {
          await this.handleCreateEgg(req, res);
          return;
        }

        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      } catch (err: any) {
        console.error('[NutEgg] Unhandled server error:', err);
        if (!res.headersSent) {
          res.writeHead(err?.statusCode || err?.status || 500, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              error: err?.message || 'Internal server error',
              errorCode: err?.code || 'server_error',
              state: this.execution.snapshot(),
            })
          );
        } else if (!res.writableEnded) {
          res.destroy();
        }
      }
    });

    this.attachWebSocket();
    return new Promise((resolve, reject) => {
      this.server!.listen(this.port, '127.0.0.1', () => {
        console.log(`[NutEgg] Server running on http://127.0.0.1:${this.port}`);
        resolve();
      });
      this.server!.on('error', err => {
        console.error('[NutEgg] Server error:', err);
        reject(err);
      });
    });
  }

  /**
   * GET /config-status — Returns AI configuration status for the popup to show warnings and credit info.
   */
  private async handleConfigStatus(res: http.ServerResponse): Promise<void> {
    try {
      const settings = this.plugin.getNativeSettings();
      if (settings.aiAuthMethod === 'chatgpt')
        settings.chatgptReady =
          this.plugin.chatgpt?.status().state === 'ready' && !!this.plugin.chatgpt?.status().model;
      const issues: string[] = [];
      let status: 'ok' | 'warning' | 'error' = 'ok';

      if (!isAIConfigured(settings)) {
        issues.push(
          settings.aiAuthMethod === 'chatgpt'
            ? this.plugin.chatgpt?.status().state === 'ready'
              ? t('chatgptChooseModel')
              : t(`chatgptState_${this.plugin.chatgpt?.status().state || 'error'}`)
            : 'AI is not configured. Open NutEgg settings in Chrome to choose a provider and configure AI.'
        );
        status = 'error';
      }

      // Check if _index.md exists
      const indexExists = await this.plugin.app.vault.adapter.exists(settings.indexFile);
      if (!indexExists) {
        issues.push(`Index file "${settings.indexFile}" not found. Click the egg icon in Obsidian to create it.`);
        status = status === 'error' ? 'error' : 'warning';
      }

      // Check for pending workflow updates (*.new.md)
      const pendingWorkflows = this.plugin.workflowManager?.getPendingWorkflowUpdates() || [];
      if (pendingWorkflows.length > 0) {
        issues.push(t('workflowUpdateNotice', { files: pendingWorkflows.join(', ') }));
        status = status === 'error' ? 'error' : 'warning';
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status,
          issues,
          port: this.port,
          version: this.plugin.manifest?.version || '',
          // Account/CLI checks are handled independently by /credit. They must
          // not hold the local configuration/connection check open.
          aiConfigured: isAIConfigured(settings),
          workflowUpdates: pendingWorkflows,
          credit: null,
        })
      );
    } catch (err: any) {
      console.error('[NutEgg] Config status error:', err);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', issues: ['Failed to check configuration'] }));
      }
    }
  }

  /**
   * GET /credit — Returns live balance and credit status for the current AI provider.
   */
  private async handleCredit(res: http.ServerResponse): Promise<void> {
    try {
      const credit = await this.plugin.aiClient.checkCredit(this.plugin.settings);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(credit));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: String(err) }));
    }
  }

  private handleDebugInfo(req: http.IncomingMessage, res: http.ServerResponse): void {
    const url = new URL(req.url || '/debug-info', `http://127.0.0.1:${this.port}`);
    const scope = normalizeAIDebugScope(url.searchParams.get('scope'));
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(getAIDebugInfo(scope || '')));
  }

  private routingClient(req: http.IncomingMessage) {
    const job = this.requestJobs.get(req);
    if (!job) return this.plugin.aiClient;
    return {
      getPrompt: () => job.settings.promptOverrides?.eggRouting || (job as any).prompts?.eggRouting,
      chat: async (prompt: string, maxTokens: number, debugScope?: string) => {
        this.execution.assertActive(job);
        const text = await job.executor.chat({ prompt, maxTokens, debugScope }, job.controller.signal);
        this.execution.assertActive(job);
        return text;
      },
    };
  }
  private processorForDebugScope(scope?: string, req?: http.IncomingMessage) {
    const job = req && this.requestJobs.get(req);
    return job
      ? this.processor(job, scope)
      : this.plugin.aiProcessor?.withDebugScope?.(scope) || this.plugin.aiProcessor;
  }

  /**
   * POST /ask — answer follow-up questions about already-analyzed content.
   * One lightweight AI call; no saving, no dedup cache interaction.
   */
  private async handleAsk(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
      const body = await this.readBody(req);
      const ask: AskRequest = JSON.parse(body);
      this.syncOutputLanguage(ask.outputLanguage);

      if (!ask.title || !ask.content || !ask.questions?.length) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing required fields: title, content, questions' }));
        return;
      }

      let normalizedPriorQa: any = ask.priorQa;
      if (typeof normalizedPriorQa !== 'string' && !Array.isArray(normalizedPriorQa)) {
        normalizedPriorQa = [];
      }

      const processor = this.processorForDebugScope(ask.debugScope, req);
      const answers = await processor.askFollowUp(ask, ask.questions, normalizedPriorQa, ask.scope || 'within');

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ answers }));
    } catch (err) {
      console.error('[NutEgg] Ask error:', err);

      if (err instanceof AIError) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            error: err.message,
            errorCode: err.code,
            answers: [],
          })
        );
        return;
      }

      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to answer. Please try again.', answers: [] }));
    }
  }

  /**
   * GET /history?url=... — cached captures for a URL, newest first.
   * The popup loads this on open so processed URLs show their result immediately.
   */
  private handleHistory(req: http.IncomingMessage, res: http.ServerResponse): void {
    const url = new URL(req.url || '/history', `http://127.0.0.1:${this.port}`);
    const target = url.searchParams.get('url')?.trim() || '';
    const history = target ? this.getCaptureHistory(target) : [];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ history, latest: history[0] ?? null }));
  }

  /**
   * GET /search?q=... — BM25 keyword retrieval over saved nuts (RAG foundation).
   */
  private handleSearch(req: http.IncomingMessage, res: http.ServerResponse): void {
    const url = new URL(req.url || '/search', `http://127.0.0.1:${this.port}`);
    const q = url.searchParams.get('q')?.trim() || '';
    const db = this.plugin.db;

    if (!q || !db?.available) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ results: [] }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
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

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          nuts: stats.nuts,
          eggs,
          timeSavedMinutes: totalMinutes,
          timeSaved,
        })
      );
    } catch (err) {
      console.error('[NutEgg] Metrics error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ nuts: 0, eggs: 0, timeSavedMinutes: 0, timeSaved: '0m' }));
    }
  }

  /**
   * GET /eggs — all eggs from _index.md (name, routing description, topic).
   * The popup uses this for the manual egg picker.
   */
  private async handleGetEggs(_req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
      const indexContent = await this.plugin.indexReader.getIndexContent();
      const entries =
        indexContent === '(No _index.md found)' ? [] : this.plugin.indexReader.parseIndexContent(indexContent);

      const eggs = [];
      for (const entry of entries) {
        let topic = 'Unknown';
        try {
          const egg = await this.plugin.eggParser.readEgg(entry.fileName);
          if (egg?.topic && egg.topic !== 'Unknown') topic = egg.topic;
        } catch {
          // Egg file unreadable — keep Unknown
        }
        eggs.push({
          fileName: entry.fileName,
          description: entry.description,
          topic,
        });
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ eggs }));
    } catch (err) {
      console.error('[NutEgg] Get eggs error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ eggs: [] }));
    }
  }

  /**
   * POST /analyze — Analyze content against knowledge base, return results.
   * Does NOT save anything — the user must confirm via /confirm first.
   */
  private async handleAnalyze(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
      const body = await this.readBody(req);
      const capture: AnalyzeRequest = JSON.parse(body);
      capture.debugScope = normalizeAIDebugScope(capture.debugScope);
      capture.discussion =
        capture.enabledSections?.discussion === true ? normalizeDiscussion(capture.discussion) : undefined;

      if (!capture.url || !capture.title) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing required fields: url, title' }));
        return;
      }

      if (
        (capture.stage === 2 || capture.stage === '2') &&
        capture.nutId != null &&
        !this.captureRecordMatches(capture, this.captureRecord(capture))
      ) {
        this.rejectCaptureIdentity(res);
        return;
      }
      this.syncCaptureLanguage(req, capture.outputLanguage);
      const processor = this.processorForDebugScope(capture.debugScope, req);

      // If this URL has cached captures (and no fresh analysis was forced,
      // no custom questions asked, no manual egg selection), return the
      // capture history — the popup shows the latest result with its
      // timestamp and offers "Re-analyze".
      const hasQuestions = capture.questions && capture.questions.length > 0;
      const hasEggOverride = Array.isArray(capture.eggs);
      if (!capture.stage && !hasQuestions && !capture.force && !(hasEggOverride && capture.eggs!.length > 0)) {
        const history = this.getCaptureHistory(capture.url);
        if (history.length > 0) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ history, latest: history[0] }));
          return;
        }
      }

      // Stage 2: user confirmed eggs from Stage 1
      if (capture.stage === 2 || capture.stage === '2') {
        const indexContent = await this.plugin.indexReader.getIndexContent();
        const index = this.plugin.indexReader.parseIndexContent(indexContent);
        const targetEggs = (capture.eggs || []).map(fileName => {
          const entry = index.find(e => e.fileName === fileName || e.fileName.endsWith('/' + fileName));
          return { fileName, description: entry?.description || '' };
        });
        const eggs = await this.plugin.eggParser.readEggs(targetEggs);
        const contentAnalysis = capture.contentAnalysis || {
          titleVerdict: capture.title,
          coreSummary: [],
          mindMap: [],
          customQuestionAnswers: [],
        };
        let result = await processor.analyzeEggs(capture, eggs, contentAnalysis);
        if (Array.isArray(capture.selectedEggs)) {
          const allResults = new Map((capture.cachedEggResults || []).map(egg => [egg.egg, egg]));
          for (const egg of result.eggResults) allResults.set(egg.egg, egg);
          result = composeEggResults(
            contentAnalysis,
            capture.selectedEggs.flatMap(egg => (allResults.has(egg) ? [allResults.get(egg)!] : [])),
            [...allResults.values()],
            capture.generateKnowledgeEntries !== false
          );
          result.generateKnowledgeEntries = capture.generateKnowledgeEntries !== false;
        }
        delete (result as any).stage;
        const job = this.requestJobs.get(req);
        if (job) {
          this.execution.assertActive(job);
          (result as any).execution = structuredClone(job.metadata);
        }

        let nutId = capture.nutId;
        if (nutId != null) {
          // Recheck after asynchronous generation, before accepting a late result.
          if (!this.captureRecordMatches(capture, this.captureRecord(capture))) {
            this.rejectCaptureIdentity(res);
            return;
          }
          this.plugin.db.updateNut(nutId, {
            summary: [result.titleVerdict, ...(result.coreSummary || [])].filter(Boolean).join('\n'),
            matchedEggs: result.matchedEggs || [],
            analysisResult: result,
          });
        } else {
          nutId = this.recordNut(capture, result);
        }

        console.log(
          `[NutEgg] Analyzed (Stage 2): ${capture.title} — shouldRead=${result.shouldRead}, newKnowledge=${result.newKnowledge.length}`
        );
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ...result, stage: 'stage2', nutId }));
        return;
      }

      // Stage 1 (default): content summary + egg routing via concise summary
      const isStreaming = Boolean(req.headers?.accept?.includes('application/x-ndjson') || capture.stream);
      if (isStreaming) {
        res.writeHead(200, {
          'Content-Type': 'application/x-ndjson',
          'Transfer-Encoding': 'chunked',
          'Cache-Control': 'no-cache',
        });
        const sendEvent = (obj: any) => {
          const job = this.requestJobs.get(req);
          if (job) {
            this.execution.assertActive(job);
            if (obj.type === 'complete') obj.result = { ...obj.result, execution: job.metadata };
          }
          try {
            res.write(JSON.stringify(obj) + '\n');
          } catch {}
        };

        const indexContentPromise = this.plugin.indexReader.getIndexContent();
        let eggMatchingPromise: Promise<string[]> | null = null;
        let matchedEggs: string[] = [];

        const startEggMatching = (summaryText: string) => {
          if (eggMatchingPromise) return eggMatchingPromise;
          eggMatchingPromise = (async () => {
            if (hasEggOverride) {
              matchedEggs = capture.eggs!;
            } else {
              const indexContent = await indexContentPromise;
              const index = this.plugin.indexReader.parseIndexContent(indexContent);
              const matchedIndex = await this.plugin.indexReader.matchEggs(
                { title: capture.title, url: capture.url, content: summaryText },
                index,
                capture.debugScope,
                this.routingClient(req)
              );
              matchedEggs = matchedIndex.map(e => e.fileName);
            }
            sendEvent({ type: 'partial', section: 'matchedEggs', data: { matchedEggs } });
            return matchedEggs;
          })();
          return eggMatchingPromise;
        };

        const contentAnalysis = await processor.analyzeContent(capture, event => {
          sendEvent(event);
          if (event.type === 'partial' && event.section === 'summary') {
            const summaryText = [event.data.titleVerdict, ...(event.data.coreSummary || [])].filter(Boolean).join('\n');
            startEggMatching(summaryText);
          }
        });

        if (!eggMatchingPromise) {
          const summaryText = [
            contentAnalysis.titleVerdict,
            ...(contentAnalysis.coreSummary || []),
            ...(contentAnalysis.discussion?.topics.map(t => `${t.title}: ${t.summary}`) || []),
          ]
            .filter(Boolean)
            .join('\n');
          await startEggMatching(summaryText);
        } else {
          await eggMatchingPromise;
        }

        const indexContent = await indexContentPromise;
        const index = this.plugin.indexReader.parseIndexContent(indexContent);

        const stage1Result = {
          ...contentAnalysis,
          matchedEggs,
          allEggs: index.map(e => e.fileName),
          stage: 'stage1' as const,
          schemaVersion: 3,
          shouldRead: null,
          shouldReadReason: '',
          eggResults: [],
          newKnowledge: [],
        };

        const job = this.requestJobs.get(req);
        if (job) this.execution.assertActive(job);
        const nutId = this.recordNut(capture, stage1Result as any);
        console.log(
          `[NutEgg] Analyzed (Stage 1 streamed): ${capture.title} — matchedEggs=${matchedEggs.length}, nutId=${nutId}`
        );
        sendEvent({
          type: 'complete',
          result: {
            ...stage1Result,
            nutId,
          },
        });
        res.end();
        return;
      }

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
          .join('\n');
        const matchedIndex = await this.plugin.indexReader.matchEggs(
          { title: capture.title, url: capture.url, content: summaryText },
          index,
          capture.debugScope,
          this.routingClient(req)
        );
        matchedEggs = matchedIndex.map(e => e.fileName);
      }

      const stage1Result = {
        ...contentAnalysis,
        matchedEggs,
        allEggs: index.map(e => e.fileName),
        stage: 'stage1' as const,
        schemaVersion: 3,
        shouldRead: null,
        shouldReadReason: '',
        eggResults: [],
        newKnowledge: [],
      };

      const job = this.requestJobs.get(req);
      if (job) this.execution.assertActive(job);
      const nutId = this.recordNut(capture, stage1Result as any);

      console.log(`[NutEgg] Analyzed (Stage 1): ${capture.title} — matchedEggs=${matchedEggs.length}, nutId=${nutId}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          ...stage1Result,
          nutId,
        })
      );
    } catch (err) {
      console.error('[NutEgg] Analyze error:', err);

      if (res.destroyed || res.writableEnded) return;
      if (res.headersSent) {
        // A stream is already HTTP 200; report a terminal NDJSON error and end it.
        res.end(
          JSON.stringify({
            type: 'error',
            error: err instanceof AIError ? err.message : 'Analysis failed. Please try again.',
            errorCode: err instanceof AIError ? err.code : 'server_error',
          }) + '\n'
        );
        return;
      }

      if (err instanceof AIError) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            error: err.message,
            errorCode: err.code,
            statusCode: err.statusCode,
            titleVerdict: '',
            coreSummary: [],
            schemaVersion: 3,
            shouldRead: null,
            shouldReadReason: '',
            matchedEggs: [],
            eggResults: [],
            newKnowledge: [],
          })
        );
        return;
      }

      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: 'Analysis failed. Please try again.',
          errorCode: 'unknown',
          titleVerdict: '',
          coreSummary: [],
          schemaVersion: 3,
          shouldRead: null,
          shouldReadReason: '',
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
    const gate = new Promise<void>(resolve => {
      release = resolve;
    });
    this.confirmationQueues.set(key, gate);
    await previous;
    return () => {
      release();
      if (this.confirmationQueues.get(key) === gate) this.confirmationQueues.delete(key);
    };
  }

  private knowledgeFingerprint(entry: { egg: string; content: string }): string {
    // Eggs are direct files in nutegg/; both basename and full-path selections occur.
    return createHash('sha256')
      .update(JSON.stringify([entry.egg.split('/').pop(), entry.content.trim()]))
      .digest('hex');
  }

  /** POST /confirm — archive the nut and append knowledge not previously hatched. */
  private async handleConfirm(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    let releaseConfirmation: (() => void) | undefined;
    try {
      const body = await this.readBody(req);
      const confirm: ConfirmRequest = JSON.parse(body);
      confirm.discussion =
        confirm.enabledSections?.discussion === true ? normalizeDiscussion(confirm.discussion) : undefined;

      if (!confirm.url || !confirm.title) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing required fields: url, title' }));
        return;
      }

      // Reject unsafe destinations before archiving, deduplicating, or writing any eggs.
      if ((confirm.newKnowledge || []).some(entry => !resolveEggPath(entry.egg, this.plugin.vaultFolder || 'nutegg'))) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Knowledge destination must be an egg in the configured egg folder' }));
        return;
      }

      const normalizedUrl = this.normalizeUrl(confirm.url);
      releaseConfirmation = await this.lockConfirmation(
        confirm.nutId != null ? `nut:${confirm.nutId}` : `url:${normalizedUrl}`
      );
      const job = this.requestJobs.get(req);
      if (job) this.execution.assertActive(job);
      const prior = confirm.nutId != null ? this.captureRecord(confirm) : this.plugin.db?.getNutByUrl?.(normalizedUrl);
      if (confirm.nutId != null && !this.captureRecordMatches(confirm, prior)) {
        this.rejectCaptureIdentity(res);
        return;
      }
      this.syncCaptureLanguage(req, (confirm as any).outputLanguage);
      let confirmed = prior?.confirmedKnowledge;
      if (confirmed == null && prior?.processingResult === 'saved') {
        // Legacy rows have no ledger. The archive still holds the last Hatch,
        // whereas the DB analysis may already have been replaced by Stage 2.
        const archived = prior.fileName ? await this.plugin.knowledgeBase.readRawAnalysis?.(prior.fileName) : null;
        confirmed = (archived?.newKnowledge || prior.analysisResult?.newKnowledge || []).map(entry =>
          this.knowledgeFingerprint(entry)
        );
      }
      const fingerprints = new Set(confirmed || []);
      const pending = new Map<string, ConfirmRequest['newKnowledge'][number]>();
      for (const entry of confirm.newKnowledge || []) {
        const fingerprint = this.knowledgeFingerprint(entry);
        if (!fingerprints.has(fingerprint)) pending.set(fingerprint, entry);
      }
      confirm.newKnowledge = [...pending.values()];
      if (prior?.processingResult === 'saved' && !pending.size) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, fileName: prior.fileName, alreadySaved: true }));
        return;
      }
      const hasKnowledge = confirm.newKnowledge && confirm.newKnowledge.length > 0;
      const saved = hasKnowledge || prior?.processingResult === 'saved' ? ('saved' as const) : ('skip' as const);

      // Collect egg names from newKnowledge (deduplicated)
      const eggNames = hasKnowledge ? [...new Set(confirm.newKnowledge.map(k => k.egg))] : confirm.matchedEggs || [];

      // Frontmatter summary: explicit value, or rebuilt from the analysis result
      const summary =
        confirm.summary ||
        (confirm.analysis
          ? [confirm.analysis.titleVerdict, ...(confirm.analysis.coreSummary || [])].filter(Boolean).join('\n')
          : undefined);

      // Time estimate from metadata, or fallback to word count
      const timeEstimate = this.estimateTime(confirm.metadata, confirm.content);

      // Save raw content to _raw/ (skipped when the nut was already saved)
      let fileName = '';
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
          captureCoverage: normalizeCaptureCoverage(confirm.captureCoverage),
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
        const author = confirm.metadata?.author || confirm.metadata?.channel || confirm.metadata?.handle || '';
        await this.plugin.knowledgeBase.appendKnowledge(confirm.newKnowledge, confirm.title, confirm.url, author);

        // Ensure confirmed eggs have language frontmatter set if known from analysis
        const perEggList = confirm.analysis?.eggResults;
        if (Array.isArray(perEggList)) {
          for (const perEgg of perEggList) {
            if (perEgg?.egg && perEgg?.language) {
              try {
                const egg = await this.plugin.eggParser.readEgg(perEgg.egg);
                if (egg && !egg.language) {
                  await this.plugin.eggParser.processEgg(egg.fileName, content =>
                    insertEggLanguage(content, perEgg.language!)
                  );
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
      const targetId = confirm.nutId ?? prior?.id ?? null;
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
          content: confirm.content || '',
          savedAt: new Date().toISOString(),
          publishedAt: confirm.metadata?.published || '',
          author: confirm.metadata?.author || confirm.metadata?.channel || confirm.metadata?.handle || '',
          timeEstimateMinutes: timeEstimate,
          processingResult: saved,
          confirmedKnowledge,
          summary: summary || '',
          matchedEggs: eggNames,
          fileName,
          analysisResult: confirm.analysis ?? null,
          capturePayload: this.captureSnapshot(confirm),
        });
      }

      console.log(
        `[NutEgg] Confirmed: ${confirm.title}${fileName ? ` -> ${fileName}` : ''}, ` +
          `knowledge entries: ${confirm.newKnowledge?.length || 0}` +
          (mergedEggs.length > 0 ? `, merged: ${mergedEggs.map(m => `${m.egg} (${m.entries})`).join(', ')}` : '')
      );

      if (hasKnowledge) {
        const job = this.requestJobs.get(req);
        if (job && !job.controller.signal.aborted) {
          for (const egg of eggNames) {
            this.execution.child(job, () => this.processor(job, confirm.debugScope).maybeMergeEgg(egg));
          }
        }
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: true,
          fileName,
          message: fileName ? `Saved to ${fileName}` : 'Added to egg files',
          merged: mergedEggs,
        })
      );
    } catch (err) {
      console.error('[NutEgg] Confirm error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to save content' }));
    } finally {
      releaseConfirmation?.();
    }
  }

  /**
   * POST /create-egg — create a new egg file + index entry. Used by the
   * popup's "no egg matched — create one?" flow.
   */
  private async handleCreateEgg(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
      const body = await this.readBody(req);
      const { name, description }: CreateEggRequest = JSON.parse(body);
      const safeName = sanitizeEggName(name);
      if (!safeName) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing egg name' }));
        return;
      }

      const result = await this.plugin.indexSync.createEgg(
        safeName,
        String(description || ''),
        this.processorForDebugScope(undefined, req)
      );
      console.log(
        `[NutEgg] Created egg via popup: ${result.path}` + (result.alreadyExists ? ' (already existed)' : '')
      );

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          success: true,
          path: result.path,
          alreadyExists: result.alreadyExists,
          language: result.language,
        })
      );
    } catch (err) {
      console.error('[NutEgg] Create egg error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to create egg' }));
    }
  }

  private readBody(req: http.IncomingMessage, maxBytes = 25 * 1024 * 1024): Promise<string> {
    const cached = this.requestBodies.get(req);
    if (cached !== undefined) return Promise.resolve(cached);
    return new Promise((resolve, reject) => {
      let data = '';
      let bytes = 0;
      let settled = false;
      req.on('data', chunk => {
        bytes += chunk.length;
        if (bytes > maxBytes) {
          settled = true;
          req.destroy(new Error('Request body too large (exceeds 25MB)'));
          reject(new Error('Request body too large (exceeds 25MB)'));
          return;
        }
        data += chunk;
      });
      req.on('end', () => {
        if (!settled) {
          settled = true;
          resolve(data);
        }
      });
      req.on('error', err => {
        if (!settled) {
          settled = true;
          reject(err);
        }
      });
    });
  }

  async stop(): Promise<void> {
    clearInterval(this.heartbeat);
    await this.execution.dispose();
    for (const ws of this.sockets) ws.terminate();
    this.wss?.close();
    if (!this.server) return;
    return new Promise(resolve => {
      this.server!.close(() => {
        console.log('[NutEgg] Server stopped');
        this.server = null;
        resolve();
      });
    });
  }

  isRunning(): boolean {
    return this.server !== null;
  }
}
