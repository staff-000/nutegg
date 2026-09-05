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

// tests/db.test.ts
var import_node_test = require("node:test");
var import_strict = __toESM(require("node:assert/strict"));
var fs = __toESM(require("fs"));
var os = __toESM(require("os"));
var path = __toESM(require("path"));

// src/db.ts
function loadSqliteModule() {
  try {
    return require("node:sqlite").DatabaseSync;
  } catch (err) {
    return null;
  }
}
var NutEggDatabase = class {
  plugin;
  db = null;
  /** Tokenized corpus cache for search — invalidated on upsert. */
  corpusCache = null;
  get available() {
    return this.db !== null;
  }
  constructor(plugin) {
    this.plugin = plugin;
  }
  /** Database file inside the vault: `nutegg/.nutegg.db`. */
  get dbPath() {
    return `${this.plugin.settings.rawFolder}/../.nutegg.db`;
  }
  /** Open the DB and create schema. Never throws — see `available`. */
  async init() {
    try {
      const DatabaseSync = loadSqliteModule();
      if (!DatabaseSync) {
        throw new Error("node:sqlite is not available in this Obsidian version");
      }
      await this.ensureFolder(this.dbPath.split("/").slice(0, -1).join("/"));
      const basePath = this.plugin.app.vault.adapter.getBasePath();
      this.db = new DatabaseSync(`${basePath}/${this.dbPath}`);
      this.db.exec("PRAGMA journal_mode = DELETE;");
      this.createSchema();
      console.log("[NutEgg] SQLite database ready:", this.dbPath);
    } catch (err) {
      console.error(
        "[NutEgg] SQLite unavailable \u2014 dedup cache, replay and search disabled:",
        err
      );
      this.db = null;
    }
  }
  close() {
    try {
      this.db?.close();
    } catch {
    }
    this.db = null;
  }
  // --- Schema ---
  createSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS nuts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT NOT NULL,
        title TEXT NOT NULL,
        source_type TEXT NOT NULL,
        content TEXT NOT NULL DEFAULT '',
        saved_at TEXT NOT NULL,
        published_at TEXT,
        author TEXT,
        time_estimate_minutes REAL NOT NULL DEFAULT 0,
        processing_result TEXT NOT NULL DEFAULT 'unprocessed',
        summary TEXT,
        matched_eggs TEXT,
        file_name TEXT,
        analysis_result TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_nuts_url ON nuts(url);
    `);
  }
  // --- Nuts ---
  /**
   * Insert a NEW capture row. URLs are versioned — each analysis is its own
   * record; re-analyzing never overwrites earlier captures.
   */
  insertNut(row) {
    if (!this.db)
      return null;
    this.corpusCache = null;
    try {
      const res = this.db.prepare(
        `INSERT INTO nuts (url, title, source_type, content, saved_at, published_at, author,
             time_estimate_minutes, processing_result, summary, matched_eggs, file_name, analysis_result)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        row.url,
        row.title,
        row.sourceType,
        row.content,
        row.savedAt,
        row.publishedAt || null,
        row.author || null,
        row.timeEstimateMinutes,
        row.processingResult,
        row.summary || null,
        JSON.stringify(row.matchedEggs),
        row.fileName || null,
        row.analysisResult ? JSON.stringify(row.analysisResult) : null
      );
      return Number(res.lastInsertRowid);
    } catch (err) {
      console.error("[NutEgg] insertNut failed:", err);
      return null;
    }
  }
  /** Latest capture of a URL (newest first history entry). */
  getNutByUrl(url) {
    if (!this.db)
      return null;
    const row = this.db.prepare("SELECT * FROM nuts WHERE url = ? ORDER BY id DESC LIMIT 1").get(url);
    return row ? this.mapRow(row) : null;
  }
  /** All captures of a URL, newest first. */
  getNutHistory(url) {
    if (!this.db)
      return [];
    const rows = this.db.prepare("SELECT * FROM nuts WHERE url = ? ORDER BY id DESC").all(url);
    return rows.map((r) => this.mapRow(r));
  }
  /** Captures of a URL matching a LIKE pattern (e.g. YouTube video ID or status ID). */
  getNutHistoryByPattern(pattern) {
    if (!this.db)
      return [];
    const rows = this.db.prepare("SELECT * FROM nuts WHERE url LIKE ? ORDER BY id DESC").all(pattern);
    return rows.map((r) => this.mapRow(r));
  }
  getNutById(id) {
    if (!this.db)
      return null;
    const row = this.db.prepare("SELECT * FROM nuts WHERE id = ?").get(id);
    return row ? this.mapRow(row) : null;
  }
  /** Update the save state of one capture row (called by /confirm). */
  updateNut(id, patch) {
    if (!this.db)
      return;
    this.corpusCache = null;
    const sets = [];
    const params = [];
    if (patch.processingResult) {
      sets.push("processing_result = ?");
      params.push(patch.processingResult);
    }
    if (patch.fileName !== void 0) {
      sets.push("file_name = ?");
      params.push(patch.fileName);
    }
    if (sets.length === 0)
      return;
    params.push(id);
    try {
      this.db.prepare(`UPDATE nuts SET ${sets.join(", ")} WHERE id = ?`).run(...params);
    } catch (err) {
      console.error("[NutEgg] updateNut failed:", err);
    }
  }
  /** Aggregate stats over the nuts table (RAG corpus size + time saved). */
  getStats() {
    if (!this.db)
      return { nuts: 0, timeSavedMinutes: 0 };
    const row = this.db.prepare(
      "SELECT COUNT(*) AS nuts, COALESCE(SUM(time_estimate_minutes), 0) AS timeSavedMinutes FROM nuts"
    ).get();
    return { nuts: row.nuts, timeSavedMinutes: row.timeSavedMinutes };
  }
  /** BM25 keyword retrieval over saved nuts, ranked, with text snippets. */
  search(query, limit = 10) {
    if (!this.db)
      return [];
    const qTerms = tokenize(query);
    if (qTerms.length === 0)
      return [];
    const docs = this.getCorpus();
    if (docs.length === 0)
      return [];
    const df = /* @__PURE__ */ new Map();
    for (const term of qTerms) {
      let count = 0;
      for (const doc of docs) {
        if (doc.termSet.has(term))
          count++;
      }
      df.set(term, count);
    }
    const n = docs.length;
    const scored = docs.map((doc) => {
      let score = 0;
      for (const term of qTerms) {
        const dft = df.get(term) || 0;
        if (dft === 0)
          continue;
        const idf = Math.log((n - dft + 0.5) / (dft + 0.5) + 1);
        let tf = 0;
        for (const t of doc.tokens) {
          if (t === term)
            tf++;
        }
        score += idf * tf;
      }
      return { title: doc.title, url: doc.url, score, text: doc.text };
    }).filter((s) => s.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);
    return scored.map((s) => ({
      title: s.title,
      url: s.url,
      snippet: makeSnippet(s.text, qTerms)
    }));
  }
  getCorpus() {
    if (this.corpusCache)
      return this.corpusCache;
    const rows = this.db.prepare("SELECT title, url, summary, content FROM nuts").all();
    this.corpusCache = rows.map((r) => {
      const text = `${r.title}
${r.summary || ""}
${r.content || ""}`;
      const tokens = tokenize(text);
      return { title: r.title, url: r.url, text, tokens, termSet: new Set(tokens) };
    });
    return this.corpusCache;
  }
  // --- Helpers ---
  mapRow(row) {
    let matchedEggs = [];
    try {
      matchedEggs = row.matched_eggs ? JSON.parse(row.matched_eggs) : [];
    } catch {
    }
    let analysisResult = null;
    try {
      analysisResult = row.analysis_result ? JSON.parse(row.analysis_result) : null;
    } catch {
    }
    return {
      id: row.id,
      url: row.url,
      title: row.title,
      sourceType: row.source_type,
      content: row.content,
      savedAt: row.saved_at,
      publishedAt: row.published_at || "",
      author: row.author || "",
      timeEstimateMinutes: row.time_estimate_minutes || 0,
      processingResult: row.processing_result || "unprocessed",
      summary: row.summary || "",
      matchedEggs,
      fileName: row.file_name || "",
      analysisResult
    };
  }
  async ensureFolder(folder) {
    const parts = folder.split("/");
    let cur = "";
    for (const part of parts) {
      cur += (cur ? "/" : "") + part;
      if (!await this.plugin.app.vault.adapter.exists(cur)) {
        await this.plugin.app.vault.createFolder(cur);
      }
    }
  }
};
function tokenize(text) {
  return text.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 1);
}
function makeSnippet(text, terms) {
  const lower = text.toLowerCase();
  let idx = -1;
  for (const term of terms) {
    const i = lower.indexOf(term);
    if (i !== -1) {
      idx = i;
      break;
    }
  }
  if (idx === -1)
    return text.slice(0, 120);
  const start = Math.max(0, idx - 60);
  const end = Math.min(text.length, idx + 60);
  return (start > 0 ? "..." : "") + text.slice(start, end).replace(/\s+/g, " ").trim() + (end < text.length ? "..." : "");
}

// tests/db.test.ts
function sqliteAvailable() {
  try {
    require("node:sqlite");
    return true;
  } catch {
    return false;
  }
}
function capture(overrides = {}) {
  return {
    url: "https://example.com/video",
    title: "How transformers actually work",
    sourceType: "youtube",
    content: "Attention mechanisms and positional encodings explained.",
    savedAt: "2026-08-14T10:00:00Z",
    publishedAt: "2026-08-10",
    author: "3Blue1Brown",
    timeEstimateMinutes: 18,
    processingResult: "analyzed",
    summary: "Clear explanation of attention.",
    matchedEggs: ["nutegg/ai_ml.md"],
    fileName: "",
    analysisResult: null,
    ...overrides
  };
}
(0, import_node_test.describe)("NutEggDatabase", { skip: !sqliteAvailable() }, () => {
  let tmp;
  let db;
  (0, import_node_test.before)(async () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "nutegg-db-test-"));
    fs.mkdirSync(path.join(tmp, "nutegg"), { recursive: true });
    const adapter = {
      exists: async () => false,
      getBasePath: () => tmp
    };
    const plugin = {
      settings: { rawFolder: "nutegg/_raw" },
      app: {
        vault: {
          adapter,
          createFolder: async (p) => fs.mkdirSync(path.join(tmp, p), { recursive: true })
        }
      }
    };
    db = new NutEggDatabase(plugin);
    await db.init();
  });
  (0, import_node_test.after)(() => {
    db.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  });
  (0, import_node_test.it)("opens and becomes available", () => {
    import_strict.default.equal(db.available, true);
    import_strict.default.ok(fs.existsSync(path.join(tmp, "nutegg/.nutegg.db")));
  });
  (0, import_node_test.it)("insertNut returns incremental row ids", () => {
    const id1 = db.insertNut(capture({ savedAt: "2026-08-14T10:00:00Z" }));
    const id2 = db.insertNut(capture({ savedAt: "2026-08-15T09:00:00Z", title: "V2" }));
    import_strict.default.equal(id1, 1);
    import_strict.default.equal(id2, 2);
  });
  (0, import_node_test.it)("versions captures: same URL yields multiple rows, newest first", () => {
    db.insertNut(capture({ savedAt: "2026-08-16T08:00:00Z", title: "V3" }));
    const history = db.getNutHistory("https://example.com/video");
    import_strict.default.equal(history.length, 3);
    import_strict.default.equal(history[0].title, "V3");
    import_strict.default.equal(history[2].title, "How transformers actually work");
  });
  (0, import_node_test.it)("getNutByUrl returns the latest capture", () => {
    import_strict.default.equal(db.getNutByUrl("https://example.com/video")?.title, "V3");
    import_strict.default.equal(db.getNutByUrl("https://never-seen.com"), null);
  });
  (0, import_node_test.it)("getNutById returns the right row and parses JSON columns", () => {
    const row = db.getNutById(1);
    import_strict.default.ok(row);
    import_strict.default.deepEqual(row.matchedEggs, ["nutegg/ai_ml.md"]);
    import_strict.default.equal(row.processingResult, "analyzed");
    import_strict.default.equal(row.author, "3Blue1Brown");
  });
  (0, import_node_test.it)("updateNut changes only the targeted capture", () => {
    db.updateNut(3, {
      processingResult: "saved",
      fileName: "nutegg/_raw/x.md"
    });
    const updated = db.getNutById(3);
    import_strict.default.equal(updated?.processingResult, "saved");
    import_strict.default.equal(updated?.fileName, "nutegg/_raw/x.md");
    import_strict.default.equal(db.getNutById(1)?.processingResult, "analyzed");
  });
  (0, import_node_test.it)("updateNut ignores a missing file_name patch", () => {
    db.updateNut(2, { processingResult: "skip" });
    import_strict.default.equal(db.getNutById(2)?.fileName, "");
    import_strict.default.equal(db.getNutById(2)?.processingResult, "skip");
  });
  (0, import_node_test.it)("getStats counts every capture and sums time estimates", () => {
    const stats = db.getStats();
    import_strict.default.equal(stats.nuts, 3);
    import_strict.default.equal(stats.timeSavedMinutes, 54);
  });
  (0, import_node_test.it)("search ranks BM25 matches and misses return empty", () => {
    const hits = db.search("transformers attention");
    import_strict.default.ok(hits.length >= 1);
    import_strict.default.equal(hits[0].title, "How transformers actually work");
    const miss = db.search("quantum chromodynamics");
    import_strict.default.equal(miss.length, 0);
  });
  (0, import_node_test.it)("unavailable DB degrades gracefully", () => {
    const dead = new NutEggDatabase({
      settings: { rawFolder: "nutegg/_raw" },
      app: { vault: { adapter: { getBasePath: () => "/nowhere" } } }
    });
    return dead.init().then(() => {
      import_strict.default.equal(dead.available, false);
      import_strict.default.equal(dead.getStats().nuts, 0);
      import_strict.default.deepEqual(dead.getNutHistory("x"), []);
      import_strict.default.deepEqual(dead.search("x"), []);
      import_strict.default.equal(dead.insertNut(capture()), null);
      dead.updateNut(1, { processingResult: "saved" });
    });
  });
});
