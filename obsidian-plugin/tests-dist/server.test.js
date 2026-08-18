"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// tests/server.test.ts
var import_node_test = require("node:test");
var import_strict = __toESM(require("node:assert/strict"));

// src/server.ts
var http = __toESM(require("http"));

// src/ai-client.ts
var AIError = class extends Error {
  code;
  statusCode;
  constructor(code, message, statusCode) {
    super(message);
    this.name = "AIError";
    this.code = code;
    this.statusCode = statusCode ?? null;
  }
};

// src/server.ts
var NutEggServer = class {
  server = null;
  plugin;
  port;
  constructor(plugin, port) {
    this.plugin = plugin;
    this.port = port;
  }
  // --- Dedup + metrics helpers (backed by SQLite) ---
  /** All captures of a URL, newest first. Empty = never processed / DB unavailable. */
  getCaptureHistory(url) {
    const db = this.plugin.db;
    if (!db?.available)
      return [];
    return db.getNutHistory(this.normalizeUrl(url)).map((row) => ({
      nutId: row.id,
      capturedAt: row.savedAt,
      saved: row.processingResult === "saved" || row.processingResult === "skip" ? row.processingResult : "analyzed",
      result: row.analysisResult
    }));
  }
  /** Reading/watch time estimate from metadata, or word-count fallback. */
  estimateTime(metadata, content) {
    return parseInt(metadata?.time_estimate_minutes || "0", 10) || Math.max(1, Math.ceil((content?.split(/\s+/)?.length || 0) / 200));
  }
  /** Count egg files (markdown under nutegg/, excluding _raw and _index). */
  countEggs() {
    return this.plugin.app.vault.getMarkdownFiles().filter((f) => f.path.startsWith("nutegg/") && !f.path.startsWith(this.plugin.settings.rawFolder) && !f.path.endsWith("/_index.md")).length;
  }
  /** Strip trailing slashes, fragment, and common tracking params. */
  normalizeUrl(url) {
    try {
      const u = new URL(url);
      u.hash = "";
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
  async start() {
    if (this.server) {
      console.log("[NutEgg] Server is already running");
      return;
    }
    this.server = http.createServer((req, res) => {
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
      if (req.method === "GET" && req.url?.startsWith("/history")) {
        this.handleHistory(req, res);
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
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
    });
    return new Promise((resolve, reject) => {
      this.server.listen(this.port, "127.0.0.1", () => {
        console.log(`[NutEgg] Server running on http://127.0.0.1:${this.port}`);
        resolve();
      });
      this.server.on("error", (err) => {
        console.error("[NutEgg] Server error:", err);
        reject(err);
      });
    });
  }
  /**
   * GET /config-status — Returns AI configuration status for the popup to show warnings.
   */
  async handleConfigStatus(res) {
    const settings = this.plugin.settings;
    const issues = [];
    let status = "ok";
    if (!settings.aiApiKey) {
      issues.push("No API key configured. Open Obsidian Settings \u2192 NutEgg, enable Developer Mode, and add your API key.");
      status = "error";
    }
    const indexExists = await this.plugin.app.vault.adapter.exists(settings.indexFile);
    if (!indexExists) {
      issues.push(`Index file "${settings.indexFile}" not found. Click the egg icon in Obsidian to create it.`);
      status = status === "error" ? "error" : "warning";
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status, issues, port: this.port }));
  }
  /**
   * POST /ask — answer follow-up questions about already-analyzed content.
   * One lightweight AI call; no saving, no dedup cache interaction.
   */
  async handleAsk(req, res) {
    try {
      const body = await this.readBody(req);
      const ask = JSON.parse(body);
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
            answers: []
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
  handleHistory(req, res) {
    const url = new URL(req.url || "/history", `http://127.0.0.1:${this.port}`);
    const target = url.searchParams.get("url")?.trim() || "";
    const history = target ? this.getCaptureHistory(target) : [];
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ history, latest: history[0] ?? null }));
  }
  /**
   * GET /search?q=... — BM25 keyword retrieval over saved nuts (RAG foundation).
   */
  handleSearch(req, res) {
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
  handleMetrics(_req, res) {
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
        timeSaved
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
  async handleAnalyze(req, res) {
    try {
      const body = await this.readBody(req);
      const capture = JSON.parse(body);
      if (!capture.url || !capture.title) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({ error: "Missing required fields: url, title" })
        );
        return;
      }
      const hasQuestions = capture.questions && capture.questions.length > 0;
      if (!hasQuestions && !capture.force) {
        const history = this.getCaptureHistory(capture.url);
        if (history.length > 0) {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ history, latest: history[0] }));
          return;
        }
      }
      const indexContent = await this.plugin.indexReader.getIndexContent();
      const index = this.plugin.indexReader.parseIndexContent(indexContent);
      const matchedEggs = await this.plugin.indexReader.matchEggs(
        capture,
        index
      );
      const eggs = await this.plugin.eggParser.readEggs(matchedEggs);
      const result = await this.plugin.aiProcessor.analyze(capture, eggs);
      const nutId = this.plugin.db?.insertNut({
        url: this.normalizeUrl(capture.url),
        title: capture.title,
        sourceType: capture.sourceType,
        content: capture.content || "",
        savedAt: (/* @__PURE__ */ new Date()).toISOString(),
        publishedAt: capture.metadata?.published || "",
        author: capture.metadata?.author || capture.metadata?.channel || "",
        timeEstimateMinutes: this.estimateTime(capture.metadata, capture.content),
        processingResult: "analyzed",
        summary: [result.titleVerdict, ...result.coreSummary || []].filter(Boolean).join("\n"),
        matchedEggs: result.matchedEggs || [],
        fileName: "",
        analysisResult: result
      }) ?? void 0;
      console.log(
        `[NutEgg] Analyzed: ${capture.title} \u2014 shouldRead=${result.shouldRead}, newKnowledge=${result.newKnowledge.length}`
      );
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ...result, nutId }));
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
            newKnowledge: []
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
          newKnowledge: []
        })
      );
    }
  }
  /**
   * POST /confirm — User confirmed adding knowledge. Save raw content and update egg files.
   */
  async handleConfirm(req, res) {
    try {
      const body = await this.readBody(req);
      const confirm = JSON.parse(body);
      if (!confirm.url || !confirm.title) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({ error: "Missing required fields: url, title" })
        );
        return;
      }
      const hasKnowledge = confirm.newKnowledge && confirm.newKnowledge.length > 0;
      const saved = hasKnowledge ? "saved" : "skip";
      const eggNames = hasKnowledge ? [...new Set(confirm.newKnowledge.map((k) => k.egg))] : confirm.matchedEggs || [];
      const summary = confirm.summary || (confirm.analysis ? [confirm.analysis.titleVerdict, ...confirm.analysis.coreSummary || []].filter(Boolean).join("\n") : void 0);
      const timeEstimate = this.estimateTime(confirm.metadata, confirm.content);
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
          processingResult: saved
        });
      }
      if (hasKnowledge) {
        await this.plugin.knowledgeBase.appendKnowledge(
          confirm.newKnowledge,
          confirm.url
        );
      }
      const db = this.plugin.db;
      const normalizedUrl = this.normalizeUrl(confirm.url);
      const targetId = confirm.nutId ?? db?.getNutByUrl(normalizedUrl)?.id ?? null;
      if (targetId != null) {
        db?.updateNut(targetId, {
          processingResult: saved,
          ...fileName ? { fileName } : {}
        });
      } else {
        db?.insertNut({
          url: normalizedUrl,
          title: confirm.title,
          sourceType: confirm.sourceType,
          content: confirm.content || "",
          savedAt: (/* @__PURE__ */ new Date()).toISOString(),
          publishedAt: confirm.metadata?.published || "",
          author: confirm.metadata?.author || confirm.metadata?.channel || "",
          timeEstimateMinutes: timeEstimate,
          processingResult: saved,
          summary: summary || "",
          matchedEggs: eggNames,
          fileName,
          analysisResult: confirm.analysis ?? null
        });
      }
      console.log(
        `[NutEgg] Confirmed: ${confirm.title}${fileName ? ` -> ${fileName}` : ""}, knowledge entries: ${confirm.newKnowledge?.length || 0}`
      );
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: true,
          fileName,
          message: fileName ? `Saved to ${fileName}` : "Added to egg files"
        })
      );
    } catch (err) {
      console.error("[NutEgg] Confirm error:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Failed to save content" }));
    }
  }
  readBody(req) {
    return new Promise((resolve, reject) => {
      let data = "";
      req.on("data", (chunk) => data += chunk);
      req.on("end", () => resolve(data));
      req.on("error", reject);
    });
  }
  async stop() {
    if (!this.server)
      return;
    return new Promise((resolve) => {
      this.server.close(() => {
        console.log("[NutEgg] Server stopped");
        this.server = null;
        resolve();
      });
    });
  }
  isRunning() {
    return this.server !== null;
  }
};

// tests/helpers.ts
function makeFakeVault(initial = {}) {
  const files = new Map(Object.entries(initial));
  const basePath = "/fake/vault";
  const adapter = {
    exists: async (p) => files.has(p) || [...files.keys()].some((k) => k.startsWith(p + "/")),
    read: async (p) => {
      if (!files.has(p))
        throw new Error("File not found: " + p);
      return files.get(p);
    },
    remove: async (p) => {
      files.delete(p);
    },
    append: async (p, data) => {
      files.set(p, (files.get(p) ?? "") + data);
    },
    getBasePath: () => basePath
  };
  const vault = {
    adapter,
    create: async (p, content) => {
      files.set(p, content);
    },
    createFolder: async (_p) => {
    },
    modify: async (file, content) => {
      files.set(file.path, content);
    },
    read: async (file) => {
      if (!files.has(file.path))
        throw new Error("File not found: " + file.path);
      return files.get(file.path);
    },
    getAbstractFileByPath: (p) => files.has(p) ? { path: p } : null,
    getMarkdownFiles: () => [...files.keys()].filter((k) => k.endsWith(".md")).map((p) => ({ path: p }))
  };
  return { files, basePath, vault };
}
function makeFakePlugin(overrides = {}) {
  const { vault } = makeFakeVault(overrides.vaultFiles || {});
  return {
    settings: {
      aiApiKey: "test-key",
      rawFolder: "nutegg/_raw",
      indexFile: "nutegg/_index.md",
      serverPort: 27123,
      ...overrides.settings || {}
    },
    app: { vault: overrides.vault ?? vault },
    aiClient: overrides.aiClient ?? { chat: async () => "{}" },
    eggParser: overrides.eggParser ?? {
      formatEggForPrompt: (e) => `egg:${e.fileName}`
    },
    indexReader: overrides.indexReader ?? {},
    knowledgeBase: overrides.knowledgeBase ?? {},
    db: overrides.db ?? null,
    ...overrides
  };
}

// tests/server.test.ts
function makeServer(overrides = {}) {
  const plugin = makeFakePlugin(overrides);
  return new NutEggServer(plugin, 27123);
}
(0, import_node_test.describe)("NutEggServer.normalizeUrl", () => {
  (0, import_node_test.it)("strips fragments and trailing slashes", () => {
    const s = makeServer();
    import_strict.default.equal(s.normalizeUrl("https://x.com/a/#frag"), "https://x.com/a");
    import_strict.default.equal(s.normalizeUrl("https://x.com/a/"), "https://x.com/a");
  });
  (0, import_node_test.it)("strips common tracking params and sorts the rest", () => {
    const s = makeServer();
    const out = s.normalizeUrl(
      "https://x.com/a?utm_source=tw&b=2&a=1&fbclid=zz&ref=r"
    );
    import_strict.default.equal(out, "https://x.com/a?a=1&b=2");
  });
  (0, import_node_test.it)("falls back to naive cleaning for invalid URLs", () => {
    const s = makeServer();
    import_strict.default.equal(s.normalizeUrl("not a url#frag/"), "not a url");
  });
});
(0, import_node_test.describe)("NutEggServer.estimateTime", () => {
  (0, import_node_test.it)("prefers metadata time_estimate_minutes", () => {
    const s = makeServer();
    import_strict.default.equal(s.estimateTime({ time_estimate_minutes: "25" }, ""), 25);
  });
  (0, import_node_test.it)("falls back to word count (200 wpm, min 1)", () => {
    const s = makeServer();
    import_strict.default.equal(s.estimateTime({}, Array(600).fill("word").join(" ")), 3);
    import_strict.default.equal(s.estimateTime({}, ""), 1);
  });
});
(0, import_node_test.describe)("NutEggServer.getCaptureHistory", () => {
  (0, import_node_test.it)("maps DB rows to capture entries with saved-state normalization", () => {
    const db = {
      available: true,
      getNutHistory: () => [
        {
          id: 7,
          savedAt: "2026-08-16T10:00:00Z",
          processingResult: "saved",
          analysisResult: { titleVerdict: "x" }
        },
        {
          id: 3,
          savedAt: "2026-08-15T09:00:00Z",
          processingResult: "analyzed",
          analysisResult: null
        },
        {
          id: 1,
          savedAt: "2026-08-14T08:00:00Z",
          processingResult: "skip",
          analysisResult: null
        }
      ]
    };
    const s = makeServer({ db });
    const history = s.getCaptureHistory("https://x.com/a");
    import_strict.default.equal(history.length, 3);
    import_strict.default.equal(history[0].nutId, 7);
    import_strict.default.equal(history[0].saved, "saved");
    import_strict.default.equal(history[1].saved, "analyzed");
    import_strict.default.equal(history[2].saved, "skip");
    import_strict.default.equal(history[1].result, null);
  });
  (0, import_node_test.it)("returns empty when the DB is unavailable", () => {
    const s = makeServer({ db: { available: false } });
    import_strict.default.deepEqual(s.getCaptureHistory("https://x.com/a"), []);
  });
});
(0, import_node_test.describe)("NutEggServer.countEggs", () => {
  (0, import_node_test.it)("counts markdown under nutegg/ excluding _raw and _index", () => {
    const { vault } = makeFakeVault({
      "nutegg/_index.md": "# index",
      "nutegg/investment.md": "## Knowledge",
      "nutegg/ai.md": "## Knowledge",
      "nutegg/_raw/2026-08-16-x.md": "raw",
      "outside.md": "outside"
    });
    const s = makeServer({ vault });
    import_strict.default.equal(s.countEggs(), 2);
  });
});
