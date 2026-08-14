import * as http from "http";
import type NutEggPlugin from "./main";
import { AIError } from "./ai-client";

interface AnalyzeRequest {
  url: string;
  title: string;
  content: string;
  sourceType: string;
  metadata?: Record<string, string>;
  /** Video chapter markers with timestamps (YouTube) — used for the Chapter Map. */
  chapters?: Array<{ time: string; title: string }>;
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
}

export class NutEggServer {
  private server: http.Server | null = null;
  private plugin: NutEggPlugin;
  private port: number;
  /** URL → timestamp cache for deduplication */
  private processedUrls: Map<string, string> = new Map();
  private cacheLoaded = false;

  /** Pre-computed metrics cache */
  private metrics = { nuts: 0, eggs: 0, timeSavedMinutes: 0 };
  private metricsLoaded = false;

  constructor(plugin: NutEggPlugin, port: number) {
    this.plugin = plugin;
    this.port = port;
  }

  // --- Metrics cache ---

  private get metricsPath(): string {
    return `${this.plugin.settings.rawFolder}/../.metrics.json`;
  }

  private async loadMetrics(): Promise<void> {
    if (this.metricsLoaded) return;
    try {
      const file = this.plugin.app.vault.getAbstractFileByPath(this.metricsPath);
      if (file) {
        const content = await this.plugin.app.vault.read(file as any);
        const parsed = JSON.parse(content);
        this.metrics = {
          nuts: parsed.nuts || 0,
          eggs: parsed.eggs || 0,
          timeSavedMinutes: parsed.timeSavedMinutes || 0,
        };
      }
    } catch { /* file doesn't exist yet */ }
    this.metricsLoaded = true;
  }

  private async saveMetrics(): Promise<void> {
    const content = JSON.stringify(this.metrics, null, 2);
    const existing = this.plugin.app.vault.getAbstractFileByPath(this.metricsPath);
    if (existing) {
      await this.plugin.app.vault.modify(existing as any, content);
    } else {
      await this.plugin.app.vault.create(this.metricsPath, content);
    }
  }

  /** Call after saving a new nut to increment metrics. */
  private async incrementMetrics(timeEstimateMinutes: number): Promise<void> {
    await this.loadMetrics();
    this.metrics.nuts++;
    this.metrics.timeSavedMinutes += timeEstimateMinutes;
    await this.saveMetrics();
  }

  /** Recalculate metrics from scratch by scanning all files. */
  private async recalculateMetrics(): Promise<void> {
    const rawFolder = this.plugin.settings.rawFolder;
    const rawFiles = this.plugin.app.vault.getMarkdownFiles()
      .filter((f) => f.path.startsWith(rawFolder));
    this.metrics.nuts = rawFiles.length;

    this.metrics.timeSavedMinutes = 0;
    for (const file of rawFiles) {
      try {
        const content = await this.plugin.app.vault.read(file);
        const timeMatch = content.match(/time_estimate_minutes:\s*(\d+(?:\.\d+)?)/);
        if (timeMatch) {
          this.metrics.timeSavedMinutes += parseFloat(timeMatch[1]);
        }
      } catch { /* skip unreadable */ }
    }
    this.metrics.timeSavedMinutes = Math.round(this.metrics.timeSavedMinutes);

    // Count eggs
    const nuteggFiles = this.plugin.app.vault.getMarkdownFiles()
      .filter((f) => f.path.startsWith("nutegg/") &&
        !f.path.startsWith(rawFolder) &&
        !f.path.endsWith("/_index.md"));
    this.metrics.eggs = nuteggFiles.length;

    this.metricsLoaded = true;
    await this.saveMetrics();
  }

  // --- URL deduplication cache ---

  private get cachePath(): string {
    return `${this.plugin.settings.rawFolder}/../.processed.json`;
  }

  private async loadProcessedCache(): Promise<void> {
    if (this.cacheLoaded) return;
    try {
      const file = this.plugin.app.vault.getAbstractFileByPath(this.cachePath);
      if (file) {
        const content = await this.plugin.app.vault.read(file as any);
        const entries = JSON.parse(content);
        for (const [url, ts] of Object.entries(entries)) {
          this.processedUrls.set(url, ts as string);
        }
      }
    } catch { /* file doesn't exist yet — that's fine */ }
    this.cacheLoaded = true;
  }

  private async saveProcessedCache(): Promise<void> {
    const obj: Record<string, string> = {};
    for (const [url, ts] of this.processedUrls) {
      obj[url] = ts;
    }
    const content = JSON.stringify(obj, null, 2);
    const existing = this.plugin.app.vault.getAbstractFileByPath(this.cachePath);
    if (existing) {
      await this.plugin.app.vault.modify(existing as any, content);
    } else {
      // Ensure parent folder exists
      const parent = this.cachePath.split("/").slice(0, -1).join("/");
      if (parent && !this.plugin.app.vault.getAbstractFileByPath(parent)) {
        const parts = parent.split("/");
        let cur = "";
        for (const part of parts) {
          cur += (cur ? "/" : "") + part;
          if (!(await this.plugin.app.vault.adapter.exists(cur))) {
            await this.plugin.app.vault.createFolder(cur);
          }
        }
      }
      await this.plugin.app.vault.create(this.cachePath, content);
    }
  }

  private async isAlreadyProcessed(url: string): Promise<string | null> {
    await this.loadProcessedCache();
    url = this.normalizeUrl(url);
    return this.processedUrls.get(url) || null;
  }

  private async markProcessed(url: string): Promise<void> {
    await this.loadProcessedCache();
    url = this.normalizeUrl(url);
    this.processedUrls.set(url, new Date().toISOString());
    await this.saveProcessedCache();
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
   * GET /metrics — Returns cached usage stats.
   * Use ?recalculate=1 to force a full rescan.
   */
  private async handleMetrics(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
      const url = new URL(req.url || "/metrics", `http://127.0.0.1:${this.port}`);
      if (url.searchParams.get("recalculate") === "1") {
        await this.recalculateMetrics();
      } else {
        await this.loadMetrics();
      }

      const m = this.metrics;
      const hours = Math.floor(m.timeSavedMinutes / 60);
      const mins = Math.round(m.timeSavedMinutes % 60);
      const timeSaved = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        nuts: m.nuts,
        eggs: m.eggs,
        timeSavedMinutes: m.timeSavedMinutes,
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

      // Check if already processed
      const processedAt = await this.isAlreadyProcessed(capture.url);
      if (processedAt) {
        const date = new Date(processedAt).toLocaleDateString();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            alreadyProcessed: `Already processed on ${date}. You can still save the raw content with "Save Raw".`,
          })
        );
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

      // Step 3: Two-phase AI analysis — content summary + per-egg delta
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

      // Determine processing result from whether knowledge was added
      const processingResult = confirm.newKnowledge && confirm.newKnowledge.length > 0
        ? "saved" as const
        : "skip" as const;

      // Collect egg names from newKnowledge (deduplicated)
      const eggNames = confirm.newKnowledge && confirm.newKnowledge.length > 0
        ? [...new Set(confirm.newKnowledge.map((k) => k.egg))]
        : (confirm.matchedEggs || []);

      // Save raw content to _raw/
      const fileName = await this.plugin.knowledgeBase.saveRaw({
        url: confirm.url,
        title: confirm.title,
        content: confirm.content,
        sourceType: confirm.sourceType,
        metadata: confirm.metadata,
        summary: confirm.summary,
        matchedEggs: eggNames,
        processingResult,
      });

      // Append new knowledge to egg files
      if (confirm.newKnowledge && confirm.newKnowledge.length > 0) {
        await this.plugin.knowledgeBase.appendKnowledge(
          confirm.newKnowledge,
          confirm.url
        );
      }

      // Mark URL as processed
      await this.markProcessed(confirm.url);

      // Increment metrics (time estimate from metadata, or fallback to word count)
      const timeEstimate = parseInt(
        confirm.metadata?.time_estimate_minutes || "0", 10
      ) || Math.max(1, Math.ceil((confirm.content?.split(/\s+/)?.length || 0) / 200));
      await this.incrementMetrics(timeEstimate);

      console.log(
        `[NutEgg] Confirmed: ${confirm.title} -> ${fileName}, knowledge entries: ${confirm.newKnowledge?.length || 0}`
      );

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: true,
          fileName,
          message: `Saved to ${fileName}`,
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
