import * as http from "http";
import type NutEggPlugin from "./main";
import { AIError } from "./ai-client";
import type { AnalysisResult } from "./ai-processor";

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
}

/** One processed nut, as exposed to /analyze for dedup + result replay. */
interface ProcessedEntry {
  processedAt: string;
  /** How the nut was saved last time: "saved" (knowledge added) or "skip" (raw only). */
  saved?: "saved" | "skip";
  /** Analysis result from the last process — replayed when the URL is reopened. */
  result?: AnalysisResult;
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

  /** Look up the processed entry for a URL. Null = never processed / DB unavailable. */
  private getProcessedEntry(url: string): ProcessedEntry | null {
    const db = this.plugin.db;
    if (!db?.available) return null;
    const row = db.getNutByUrl(this.normalizeUrl(url));
    if (!row) return null;
    return {
      processedAt: row.savedAt,
      saved: row.processingResult === "saved" ? "saved" : "skip",
      result: row.analysisResult ?? undefined,
    };
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

      if (req.method === "GET" && req.url === "/metrics") {
        this.handleMetrics(req, res);
        return;
      }

      if (req.method === "GET" && req.url?.startsWith("/search")) {
        this.handleSearch(req, res);
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
   * GET /config-status — Returns AI configuration status for the popup to show warnings.
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

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status, issues, port: this.port }));
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

      // Check if already processed — replay the stored result when available.
      // Custom questions bypass the replay so they get fresh answers.
      const hasQuestions = capture.questions && capture.questions.length > 0;
      const processedEntry = hasQuestions ? null : this.getProcessedEntry(capture.url);
      if (processedEntry) {
        const date = new Date(processedEntry.processedAt).toLocaleDateString();
        res.writeHead(200, { "Content-Type": "application/json" });
        if (processedEntry.result) {
          res.end(
            JSON.stringify({
              alreadyProcessed: `Processed on ${date} — showing saved result.`,
              cachedResult: processedEntry.result,
              saved: processedEntry.saved || "skip",
            })
          );
        } else {
          res.end(
            JSON.stringify({
              alreadyProcessed: `Already processed on ${date}. You can still save the raw content with "Save Raw".`,
            })
          );
        }
        return;
      }

      // Step 1: Read _index.md and match content to relevant egg files
      const indexContent = await this.plugin.indexReader.getIndexContent();
      const index = this.plugin.indexReader.parseIndexContent(indexContent);
      const matchedEggs = await this.plugin.indexReader.matchEggs(
        capture,
        index
      );

      // Step 2: Read and parse the matched egg files (scope, action guide, knowledge)
      const eggs = await this.plugin.eggParser.readEggs(matchedEggs);

      // Step 3: Two-phase AI analysis — content summary + per-egg delta.
      // Custom questions are deduplicated by the AI against the eggs' key questions.
      const result = await this.plugin.aiProcessor.analyze(capture, eggs);

      console.log(
        `[NutEgg] Analyzed: ${capture.title} — shouldRead=${result.shouldRead}, newKnowledge=${result.newKnowledge.length}`
      );

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
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
      const timeEstimate = parseInt(
        confirm.metadata?.time_estimate_minutes || "0", 10
      ) || Math.max(1, Math.ceil((confirm.content?.split(/\s+/)?.length || 0) / 200));

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

      // Insert new knowledge into egg files
      if (hasKnowledge) {
        await this.plugin.knowledgeBase.appendKnowledge(
          confirm.newKnowledge,
          confirm.url
        );
      }

      // Upsert into SQLite — dedup, replay, metrics and the RAG corpus
      this.plugin.db?.upsertNut({
        url: this.normalizeUrl(confirm.url),
        title: confirm.title,
        sourceType: confirm.sourceType,
        content: confirm.content || "",
        savedAt: new Date().toISOString(),
        publishedAt: confirm.metadata?.published || "",
        author: confirm.metadata?.author || confirm.metadata?.channel || "",
        timeEstimateMinutes: timeEstimate,
        processingResult: saved,
        summary: summary || "",
        matchedEggs: eggNames,
        fileName,
        analysisResult: confirm.analysis ?? null,
      });

      console.log(
        `[NutEgg] Confirmed: ${confirm.title}${fileName ? ` -> ${fileName}` : ""}, knowledge entries: ${confirm.newKnowledge?.length || 0}`
      );

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: true,
          fileName,
          message: fileName ? `Saved to ${fileName}` : "Added to egg files",
        })
      );
    } catch (err) {
      console.error("[NutEgg] Confirm error:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Failed to save content" }));
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
