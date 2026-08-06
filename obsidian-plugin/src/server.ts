import * as http from "http";
import type NutEggPlugin from "./main";

interface AnalyzeRequest {
  url: string;
  title: string;
  content: string;
  sourceType: string;
  metadata?: Record<string, string>;
}

interface ConfirmRequest {
  url: string;
  title: string;
  content: string;
  sourceType: string;
  metadata?: Record<string, string>;
  newKnowledge: Array<{
    topic: string;
    section: string;
    content: string;
  }>;
}

export class NutEggServer {
  private server: http.Server | null = null;
  private plugin: NutEggPlugin;
  private port: number;

  constructor(plugin: NutEggPlugin, port: number) {
    this.plugin = plugin;
    this.port = port;
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
        res.end(JSON.stringify({ status: "ok", timestamp: Date.now() }));
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

      // Step 1: Read _index.md
      const indexContent = await this.plugin.indexReader.getIndexContent();
      const index = this.plugin.indexReader.parseIndexContent(indexContent);

      // Step 2: Match content to relevant topic files
      const matchedTopics = await this.plugin.indexReader.matchTopics(
        capture,
        index
      );

      // Step 3: Read and parse matched topic files
      const topicContents = await this.plugin.topicParser.readTopics(
        matchedTopics
      );
      const topicsContext =
        this.plugin.topicParser.formatTopicsForPrompt(topicContents);

      // Step 4: Run AI analysis
      const result = await this.plugin.aiProcessor.analyze(
        capture,
        indexContent,
        topicsContext
      );

      console.log(
        `[NutEgg] Analyzed: ${capture.title} — shouldRead=${result.shouldRead}, newKnowledge=${result.newKnowledge.length}`
      );

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
    } catch (err) {
      console.error("[NutEgg] Analyze error:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "Analysis failed",
          summary: "Error during analysis. Please try again.",
          shouldRead: true,
          shouldReadReason: "Analysis error.",
          matchedTopics: [],
          newKnowledge: [],
        })
      );
    }
  }

  /**
   * POST /confirm — User confirmed adding knowledge. Save raw content and update topic files.
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

      // Save raw content to _raw/
      const fileName = await this.plugin.knowledgeBase.saveRaw({
        url: confirm.url,
        title: confirm.title,
        content: confirm.content,
        sourceType: confirm.sourceType,
        metadata: confirm.metadata,
      });

      // Append new knowledge to topic files
      if (confirm.newKnowledge && confirm.newKnowledge.length > 0) {
        await this.plugin.knowledgeBase.appendKnowledge(
          confirm.newKnowledge,
          confirm.url
        );
      }

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
