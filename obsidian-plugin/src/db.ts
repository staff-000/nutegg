import type NutEggPlugin from "./main";
import type { AnalysisResult } from "./ai-processor";
import type { DatabaseSync as DatabaseSyncClass } from "node:sqlite";

/**
 * Obsidian's renderer blocks dynamic `import()` of node: builtins — the web
 * loader tries to fetch `node:sqlite` as a URL and CORS kills it. Node
 * builtins must be loaded through CommonJS `require`, which the plugin
 * runtime shims. Wrapped in try/catch so older Obsidian degrades gracefully.
 */
declare function require(name: string): any;

function loadSqliteModule(): typeof DatabaseSyncClass | null {
  try {
    return require("node:sqlite").DatabaseSync;
  } catch (err) {
    return null;
  }
}

/** One row from the nuts table (JSON columns parsed back into objects). */
export interface NutRow {
  /** Row id — identifies one capture of a URL (URLs are versioned over time). */
  id: number;
  url: string;
  title: string;
  sourceType: string;
  content: string;
  savedAt: string;
  publishedAt: string;
  author: string;
  timeEstimateMinutes: number;
  /** "analyzed" = processed but never saved; "saved" = knowledge added; "skip" = raw only. */
  processingResult: "saved" | "skip" | "analyzed" | "unprocessed";
  summary: string;
  matchedEggs: string[];
  fileName: string;
  analysisResult: AnalysisResult | null;
}

/**
 * SQLite persistence via `node:sqlite` — SQLite compiled into Node >= 22.13,
 * which current Obsidian desktop ships through Electron. No native deps.
 *
 * Stores:
 *   - `nuts` — one row per processed nut (dedup, replay, and the RAG corpus)
 *
 * Keyword retrieval (search) is a JS BM25 ranker over the corpus — Node's
 * bundled SQLite has no FTS5, and shipping extension binaries per platform
 * would defeat the zero-dependency design. Embeddings can later live in the
 * same table as BLOBs with cosine ranking in JS.
 *
 * If node:sqlite is unavailable (older Obsidian), `available` stays false and
 * the plugin degrades gracefully: no dedup/replay/search.
 */
export class NutEggDatabase {
  private plugin: NutEggPlugin;
  private db: DatabaseSyncClass | null = null;
  /** Tokenized corpus cache for search — invalidated on upsert. */
  private corpusCache: Array<{
    title: string;
    url: string;
    text: string;
    tokens: string[];
    termSet: Set<string>;
  }> | null = null;

  get available(): boolean {
    return this.db !== null;
  }

  constructor(plugin: NutEggPlugin) {
    this.plugin = plugin;
  }

  /** Database file inside the vault: `nutegg/.nutegg.db`. */
  private get dbPath(): string {
    return `${this.plugin.settings.rawFolder}/../.nutegg.db`;
  }

  /** Open the DB and create schema. Never throws — see `available`. */
  async init(): Promise<void> {
    try {
      const DatabaseSync = loadSqliteModule();
      if (!DatabaseSync) {
        throw new Error("node:sqlite is not available in this Obsidian version");
      }
      await this.ensureFolder(this.dbPath.split("/").slice(0, -1).join("/"));
      // DatabaseSync needs an absolute path — adapter paths are vault-relative.
      // getBasePath() exists at runtime but is missing from Obsidian's typings.
      const basePath = (this.plugin.app.vault.adapter as any).getBasePath() as string;
      this.db = new DatabaseSync(`${basePath}/${this.dbPath}`);
      // Single-file journal (not WAL) — safer for synced vault folders
      this.db.exec("PRAGMA journal_mode = DELETE;");
      this.createSchema();
      console.log("[NutEgg] SQLite database ready:", this.dbPath);
    } catch (err) {
      console.error(
        "[NutEgg] SQLite unavailable — dedup cache, replay and search disabled:",
        err
      );
      this.db = null;
    }
  }

  close(): void {
    try {
      this.db?.close();
    } catch { /* already closed */ }
    this.db = null;
  }

  // --- Schema ---

  private createSchema(): void {
    this.db!.exec(`
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
  insertNut(row: Omit<NutRow, "id">): number | null {
    if (!this.db) return null;
    this.corpusCache = null;
    try {
      const res = this.db
        .prepare(
          `INSERT INTO nuts (url, title, source_type, content, saved_at, published_at, author,
             time_estimate_minutes, processing_result, summary, matched_eggs, file_name, analysis_result)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
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
      // A DB write must never break analysis — log and continue
      console.error("[NutEgg] insertNut failed:", err);
      return null;
    }
  }

  /** Latest capture of a URL (newest first history entry). */
  getNutByUrl(url: string): NutRow | null {
    if (!this.db) return null;
    const row = this.db
      .prepare("SELECT * FROM nuts WHERE url = ? ORDER BY id DESC LIMIT 1")
      .get(url) as Record<string, any> | undefined;
    return row ? this.mapRow(row) : null;
  }

  /** All captures of a URL, newest first. */
  getNutHistory(url: string): NutRow[] {
    if (!this.db) return [];
    const rows = this.db
      .prepare("SELECT * FROM nuts WHERE url = ? ORDER BY id DESC")
      .all(url) as Array<Record<string, any>>;
    return rows.map((r) => this.mapRow(r));
  }

  /** Captures of a URL matching a LIKE pattern (e.g. YouTube video ID or status ID). */
  getNutHistoryByPattern(pattern: string): NutRow[] {
    if (!this.db) return [];
    const rows = this.db
      .prepare("SELECT * FROM nuts WHERE url LIKE ? ORDER BY id DESC")
      .all(pattern) as Array<Record<string, any>>;
    return rows.map((r) => this.mapRow(r));
  }

  getNutById(id: number): NutRow | null {
    if (!this.db) return null;
    const row = this.db
      .prepare("SELECT * FROM nuts WHERE id = ?")
      .get(id) as Record<string, any> | undefined;
    return row ? this.mapRow(row) : null;
  }

  /** Update the save state of one capture row (called by /confirm). */
  updateNut(
    id: number,
    patch: {
      processingResult?: "saved" | "skip" | "analyzed";
      fileName?: string;
    }
  ): void {
    if (!this.db) return;
    this.corpusCache = null;
    const sets: string[] = [];
    const params: Array<string | number> = [];
    if (patch.processingResult) {
      sets.push("processing_result = ?");
      params.push(patch.processingResult);
    }
    if (patch.fileName !== undefined) {
      sets.push("file_name = ?");
      params.push(patch.fileName);
    }
    if (sets.length === 0) return;
    params.push(id);
    try {
      this.db
        .prepare(`UPDATE nuts SET ${sets.join(", ")} WHERE id = ?`)
        .run(...params);
    } catch (err) {
      // A DB write must never break the confirm flow — log and continue
      console.error("[NutEgg] updateNut failed:", err);
    }
  }

  /** Aggregate stats over the nuts table (RAG corpus size + time saved). */
  getStats(): { nuts: number; timeSavedMinutes: number } {
    if (!this.db) return { nuts: 0, timeSavedMinutes: 0 };
    const row = this.db
      .prepare(
        "SELECT COUNT(*) AS nuts, COALESCE(SUM(time_estimate_minutes), 0) AS timeSavedMinutes FROM nuts"
      )
      .get() as { nuts: number; timeSavedMinutes: number };
    return { nuts: row.nuts, timeSavedMinutes: row.timeSavedMinutes };
  }

  /** BM25 keyword retrieval over saved nuts, ranked, with text snippets. */
  search(
    query: string,
    limit = 10
  ): Array<{ title: string; url: string; snippet: string }> {
    if (!this.db) return [];

    const qTerms = tokenize(query);
    if (qTerms.length === 0) return [];

    const docs = this.getCorpus();
    if (docs.length === 0) return [];

    // Document frequency per query term
    const df = new Map<string, number>();
    for (const term of qTerms) {
      let count = 0;
      for (const doc of docs) {
        if (doc.termSet.has(term)) count++;
      }
      df.set(term, count);
    }

    const n = docs.length;
    const scored = docs
      .map((doc) => {
        let score = 0;
        for (const term of qTerms) {
          const dft = df.get(term) || 0;
          if (dft === 0) continue;
          const idf = Math.log((n - dft + 0.5) / (dft + 0.5) + 1);
          let tf = 0;
          for (const t of doc.tokens) {
            if (t === term) tf++;
          }
          score += idf * tf;
        }
        return { title: doc.title, url: doc.url, score, text: doc.text };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored.map((s) => ({
      title: s.title,
      url: s.url,
      snippet: makeSnippet(s.text, qTerms),
    }));
  }

  private getCorpus(): Array<{
    title: string;
    url: string;
    text: string;
    tokens: string[];
    termSet: Set<string>;
  }> {
    if (this.corpusCache) return this.corpusCache;
    const rows = this.db!.prepare("SELECT title, url, summary, content FROM nuts").all() as Array<{
      title: string;
      url: string;
      summary: string;
      content: string;
    }>;
    this.corpusCache = rows.map((r) => {
      const text = `${r.title}\n${r.summary || ""}\n${r.content || ""}`;
      const tokens = tokenize(text);
      return { title: r.title, url: r.url, text, tokens, termSet: new Set(tokens) };
    });
    return this.corpusCache;
  }

  // --- Helpers ---

  private mapRow(row: Record<string, any>): NutRow {
    let matchedEggs: string[] = [];
    try {
      matchedEggs = row.matched_eggs ? JSON.parse(row.matched_eggs) : [];
    } catch { /* corrupted — ignore */ }

    let analysisResult: AnalysisResult | null = null;
    try {
      analysisResult = row.analysis_result ? JSON.parse(row.analysis_result) : null;
    } catch { /* corrupted — ignore */ }

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
      analysisResult,
    };
  }

  private async ensureFolder(folder: string): Promise<void> {
    const parts = folder.split("/");
    let cur = "";
    for (const part of parts) {
      cur += (cur ? "/" : "") + part;
      if (!(await this.plugin.app.vault.adapter.exists(cur))) {
        await this.plugin.app.vault.createFolder(cur);
      }
    }
  }
}

/** Lowercase word tokens (length > 1) for BM25 indexing. */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1);
}

/** Text window around the first query-term occurrence. */
function makeSnippet(text: string, terms: string[]): string {
  const lower = text.toLowerCase();
  let idx = -1;
  for (const term of terms) {
    const i = lower.indexOf(term);
    if (i !== -1) {
      idx = i;
      break;
    }
  }
  if (idx === -1) return text.slice(0, 120);
  const start = Math.max(0, idx - 60);
  const end = Math.min(text.length, idx + 60);
  return (
    (start > 0 ? "..." : "") +
    text.slice(start, end).replace(/\s+/g, " ").trim() +
    (end < text.length ? "..." : "")
  );
}
