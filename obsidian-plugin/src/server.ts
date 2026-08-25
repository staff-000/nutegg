import * as http from "http";
import type NutEggPlugin from "./main";
import { AIError } from "./ai-client";
import type { AnalysisResult, MergeResult } from "./ai-processor";

interface AnalyzeRequest {
  url: string;
  title: string;
  content: string;
  sourceType: string;
  metadata?: Record<string, string>;
  /** Video chapter markers with timestamps (YouTube) — used for the Chapter Map. */
  chapters?: Array<{ time: string; title: string }>;
  /** Custom questions from the popup — answered alongside the eggs' key questions. */
  questions?: string[];
  /** Force a fresh analysis even when cached captures exist for this URL. */
  force?: boolean;
  /** Manual egg selection from the popup — skips AI routing when non-empty. */
  eggs?: string[];
}

interface AskRequest {
  url: string;
  title: string;
  content: string;
  sourceType: string;
  /** New follow-up questions to answer. */
  questions: string[];
  /** Previously answered Q&A (egg key questions + custom + earlier follow-ups). */
  priorQa?: Array<{ question: string; answer: string }>;
}

interface CreateEggRequest {
  name: string;
  description?: string;
}

interface ConfirmRequest {
  url: string;
  title: string;
  content: string;
  sourceType: string;
  metadata?: Record<string, string>;
  summary?: string;
  matchedEggs?: string[];
  newKnowledge: Array<{
    egg: string;
    parent?: string;
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
}

export class NutEggServer {
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
    return db.getNutHistory(this.normalizeUrl(url)).map((row) => ({
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
    }));
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

  /** Count egg files (markdown under nutegg/, excluding _raw and _index). */
  private countEggs(): number {
    return this.plugin.app.vault.getMarkdownFiles()
      .filter((f) => f.path.startsWith("nutegg/") &&
        !f.path.startsWith(this.plugin.settings.rawFolder) &&
        !f.path.endsWith("/_index.md")).length;
  }

  /** Strip trailing slashes, fragment, and common tracking params. */
  private normalizeUrl(url: string): string {
    try {
      const u = new URL(url);
      u.hash = "";
      // Common tracking params
      const stripParams = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ref", "source", "fbclid", "gclid"];
      for (const p of stripParams) {
        u.searchParams.delete(p);
      }
      u.searchParams.sort();
      return u.toString().replace(/\/$/, "");
    } catch {
      return url.replace(/#.*$/, "").replace(/\/$/, "");
    }
  }

  async start(): Promise<void> {
    if (this.server) {
      console.log("[NutEgg] Server is already running");
      return;
    }

    this.server = http.createServer((req, res) => {
      // CORS headers for Chrome extension
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");

      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }

      if (req.method === "GET" && req.url === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok", port: this.port, timestamp: Date.now() }));
        return;
      }

      if (req.method === "GET" && req.url === "/config-status") {
        this.handleConfigStatus(res);
        return;
      }

      if (req.method === "GET" && req.url === "/credit") {
        this.handleCredit(res);
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
        this.handleGetEggs(req, res);
        return;
      }

      if (req.method === "POST" && req.url === "/ask") {
        this.handleAsk(req, res);
        return;
      }

      if (req.method === "POST" && req.url === "/analyze") {
        this.handleAnalyze(req, res);
        return;
      }

      if (req.method === "POST" && req.url === "/confirm") {
        this.handleConfirm(req, res);
        return;
      }

      if (req.method === "POST" && req.url === "/create-egg") {
        this.handleCreateEgg(req, res);
        return;
      }

      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
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

  /**
   * GET /config-status — Returns AI configuration status for the popup to show warnings and credit info.
   */
  private async handleConfigStatus(res: http.ServerResponse): Promise<void> {
    const settings = this.plugin.settings;
    const issues: string[] = [];
    let status: "ok" | "warning" | "error" = "ok";

    if (!settings.aiApiKey) {
      issues.push("No API key configured. Open Obsidian Settings → NutEgg, enable Developer Mode, and add your API key.");
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
    res.end(JSON.stringify({ status, issues, port: this.port, credit }));
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

      const answers = await this.plugin.aiProcessor.askFollowUp(
        ask,
        ask.questions,
        ask.priorQa || []
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
   * GET /metrics — nuts + time saved from SQLite aggregates, eggs from a file scan.
   */
  private handleMetrics(_req: http.IncomingMessage, res: http.ServerResponse): void {
    try {
      const db = this.plugin.db;
      const stats = db?.available ? db.getStats() : { nuts: 0, timeSavedMinutes: 0 };
      const eggs = this.countEggs();
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
      const hasEggOverride = !!capture.eggs && capture.eggs.length > 0;
      if (!hasQuestions && !capture.force && !hasEggOverride) {
        const history = this.getCaptureHistory(capture.url);
        if (history.length > 0) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ history, latest: history[0] }));
          return;
        }
      }

      // Step 1: Read _index.md and match content to relevant egg files.
      // A manual egg selection from the popup skips AI routing entirely.
      const indexContent = await this.plugin.indexReader.getIndexContent();
      const index = this.plugin.indexReader.parseIndexContent(indexContent);
      const matchedEggs = hasEggOverride
        ? capture.eggs!.map((fileName) => ({ fileName, description: "" }))
        : await this.plugin.indexReader.matchEggs(capture, index);

      // Step 2: Read and parse the matched egg files (scope, action guide, knowledge)
      const eggs = await this.plugin.eggParser.readEggs(matchedEggs);

      // Step 3: Two-phase AI analysis — content summary + per-egg delta.
      // Custom questions are deduplicated by the AI against the eggs' key questions.
      const result = await this.plugin.aiProcessor.analyze(capture, eggs);

      // Record EVERY processed result in SQLite — one NEW row per capture, so
      // re-analysis creates a new version instead of overwriting history.
      const nutId = this.plugin.db?.insertNut({
        url: this.normalizeUrl(capture.url),
        title: capture.title,
        sourceType: capture.sourceType,
        content: capture.content || "",
        savedAt: new Date().toISOString(),
        publishedAt: capture.metadata?.published || "",
        author: capture.metadata?.author ||
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
      }) ?? undefined;

      console.log(
        `[NutEgg] Analyzed: ${capture.title} — shouldRead=${result.shouldRead}, newKnowledge=${result.newKnowledge.length}`
      );

      // When no egg matched, suggest one so the popup can offer to create it
      let suggestedEgg = null;
      if (result.matchedEggs.length === 0) {
        suggestedEgg = await this.plugin.aiProcessor.suggestEgg(
          capture,
          [result.titleVerdict, ...(result.coreSummary || [])].join(" ")
        );
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ...result, nutId, suggestedEgg }));
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
            isLongForm: false,
            chapterMap: [],
            shouldRead: false,
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
          isLongForm: false,
          chapterMap: [],
          shouldRead: false,
          shouldReadReason: "",
          matchedEggs: [],
          eggResults: [],
          newKnowledge: [],
        })
      );
    }
  }

  /**
   * POST /confirm — User confirmed adding knowledge. Save raw content and update egg files.
   */
  private async handleConfirm(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): Promise<void> {
    try {
      const body = await this.readBody(req);
      const confirm: ConfirmRequest = JSON.parse(body);

      if (!confirm.url || !confirm.title) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({ error: "Missing required fields: url, title" })
        );
        return;
      }

      const hasKnowledge = confirm.newKnowledge && confirm.newKnowledge.length > 0;
      const saved = hasKnowledge ? "saved" as const : "skip" as const;

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
      if (!confirm.skipRaw) {
        fileName = await this.plugin.knowledgeBase.saveRaw({
          url: confirm.url,
          title: confirm.title,
          content: confirm.content,
          sourceType: confirm.sourceType,
          metadata: confirm.metadata,
          summary,
          matchedEggs: eggNames,
          processingResult: saved,
        });
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
      }

      // Update THIS capture's row in SQLite (identified by nutId from
      // /analyze or the history). Fall back to the latest row for the URL.
      const db = this.plugin.db;
      const normalizedUrl = this.normalizeUrl(confirm.url);
      const targetId =
        confirm.nutId ?? db?.getNutByUrl(normalizedUrl)?.id ?? null;
      if (targetId != null) {
        db?.updateNut(targetId, {
          processingResult: saved,
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
          summary: summary || "",
          matchedEggs: eggNames,
          fileName,
          analysisResult: confirm.analysis ?? null,
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
    } catch (err) {
      console.error("[NutEgg] Confirm error:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Failed to save content" }));
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

      const safeName = String(name || "")
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 60);
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
        })
      );
    } catch (err) {
      console.error("[NutEgg] Create egg error:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Failed to create egg" }));
    }
  }

  private readBody(req: http.IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      let data = "";
      req.on("data", (chunk) => (data += chunk));
      req.on("end", () => resolve(data));
      req.on("error", reject);
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
