import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { NutEggServer } from "../src/server";
import { makeFakePlugin, makeFakeVault } from "./helpers";
import { KnowledgeBase } from "../src/knowledge-base";
import { EggParser } from "../src/egg-parser";
import { AIProcessor } from "../src/ai-processor";
import { IndexReader } from "../src/index-reader";
import { getAIDebugInfo, trackAIRequest } from "../../shared/src/ai-diagnostics";

function makeServer(overrides: any = {}) {
  const plugin = makeFakePlugin(overrides);
  return new NutEggServer(plugin as any, 27123) as any;
}

describe("NutEggServer.normalizeUrl", () => {
  it("strips fragments and trailing slashes", () => {
    const s = makeServer();
    assert.equal(s.normalizeUrl("https://x.com/a/#frag"), "https://x.com/a");
    assert.equal(s.normalizeUrl("https://x.com/a/"), "https://x.com/a");
  });

  it("strips common tracking params and sorts the rest", () => {
    const s = makeServer();
    const out = s.normalizeUrl(
      "https://x.com/a?utm_source=tw&b=2&a=1&fbclid=zz&ref=r"
    );
    assert.equal(out, "https://x.com/a?a=1&b=2");
  });

  it("falls back to naive cleaning for invalid URLs", () => {
    const s = makeServer();
    assert.equal(s.normalizeUrl("not a url#frag/"), "not a url");
  });

  it("normalizes YouTube watch, shorts, and youtu.be URLs to canonical watch URL", () => {
    const s = makeServer();
    assert.equal(
      s.normalizeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s&feature=youtu.be"),
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    );
    assert.equal(
      s.normalizeUrl("https://m.youtube.com/watch?v=dQw4w9WgXcQ&list=PL123"),
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    );
    assert.equal(
      s.normalizeUrl("https://youtu.be/dQw4w9WgXcQ?t=10"),
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    );
    assert.equal(
      s.normalizeUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ"),
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    );
  });

  it("normalizes Twitter/X status URLs", () => {
    const s = makeServer();
    assert.equal(
      s.normalizeUrl("https://twitter.com/elonmusk/status/123456789?s=20&t=abc"),
      "https://x.com/elonmusk/status/123456789"
    );
  });

  it("normalizes Bilibili watch-later and tracked video URLs by bvid, keeping multipart videos distinct", () => {
    const s = makeServer();
    const canonical = "https://www.bilibili.com/video/BV1jc8e6vEKk";
    for (const url of [
      "https://www.bilibili.com/list/watchlater/?bvid=BV1jc8e6vEKk&oid=117147766360158&watchlater_cfg=%7B%22viewed%22%3A0%7D&spm_id_from=333.881.0.0&vd_source=tracking",
      "https://www.bilibili.com/video/BV1jc8e6vEKk/?spm_id_from=333.1245.0.0",
      "https://www.bilibili.com/video/BV1jc8e6vEKk/?spm_id_from=333.788.top_right_bar_window_custom_collection.content.click&vd_source=tracking",
      "https://m.bilibili.com/video/BV1jc8e6vEKk?p=1&t=40",
    ]) assert.equal(s.normalizeUrl(url), canonical);
    assert.equal(s.normalizeUrl(canonical + "?p=2&vd_source=tracking"), canonical + "?p=2");
    assert.equal(s.normalizeUrl("https://www.bilibili.com/list/watchlater/?p=2&bvid=BV1jc8e6vEKk"), canonical + "?p=2");
  });

  it("normalizes YouTube live and embed variants while preserving channel and playlist identities", () => {
    const s = makeServer();
    for (const url of [
      "https://www.youtube.com/live/dQw4w9WgXcQ?si=tracking",
      "https://www.youtube.com/embed/dQw4w9WgXcQ?start=20",
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
      "https://music.youtube.com/watch?v=dQw4w9WgXcQ&list=playlist",
    ]) assert.equal(s.normalizeUrl(url), "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    assert.equal(s.normalizeUrl("https://www.youtube.com/@DanKoeTalks/videos"), "https://www.youtube.com/@DanKoeTalks/videos");
    assert.equal(s.normalizeUrl("https://www.youtube.com/playlist?list=PL123"), "https://www.youtube.com/playlist?list=PL123");
  });
});

describe("NutEggServer.estimateTime", () => {
  it("prefers metadata time_estimate_minutes", () => {
    const s = makeServer();
    assert.equal(s.estimateTime({ time_estimate_minutes: "25" }, ""), 25);
  });

  it("falls back to word count (200 wpm, min 1)", () => {
    const s = makeServer();
    assert.equal(s.estimateTime({}, Array(600).fill("word").join(" ")), 3);
    assert.equal(s.estimateTime({}, ""), 1);
  });
});

describe("NutEggServer.getCaptureHistory", () => {
  it("stores the canonical video key while preserving the original capture URL", () => {
    let inserted: any;
    const s = makeServer({ db: { available: true, insertNut: (row: any) => { inserted = row; return 1; } } });
    const original = "https://www.bilibili.com/list/watchlater/?bvid=BV1jc8e6vEKk&oid=117147766360158";
    assert.equal(s.recordNut({ url: original, title: "Video", sourceType: "bilibili", content: "Transcript" }, { schemaVersion: 3 }), 1);
    assert.equal(inserted.url, "https://www.bilibili.com/video/BV1jc8e6vEKk");
    assert.equal(inserted.capturePayload.url, original);
  });

  it("combines existing canonical and legacy Bilibili captures, excluding other parts and lookalike URLs", () => {
    const canonical = "https://www.bilibili.com/video/BV1jc8e6vEKk";
    const row = (id: number, url: string) => ({ id, url, savedAt: `2026-10-0${id}T00:00:00Z`, analysisResult: { schemaVersion: 3 } });
    const rows = [row(1, canonical + "/?spm_id_from=tracking"),
      row(2, "https://www.bilibili.com/list/watchlater/?oid=123&bvid=BV1jc8e6vEKk"),
      row(3, canonical), row(4, canonical + "?p=2"),
      row(5, "https://example.com/video/BV1jc8e6vEKk"), row(6, canonical + "extra"),
      { ...row(7, canonical + "?t=5"), analysisResult: { schemaVersion: 2 } }];
    const s = makeServer({ db: { available: true,
      getNutHistory: (url: string) => rows.filter(row => row.url === url),
      getNutHistoryByPattern: () => rows } });
    for (const url of [canonical, rows[0].url, rows[1].url]) {
      assert.deepEqual(s.getCaptureHistory(url).map((entry: any) => entry.nutId), [3, 2, 1]);
    }
    assert.deepEqual(s.getCaptureHistory(canonical + "?p=2").map((entry: any) => entry.nutId), [4]);
  });

  it("combines legacy YouTube watch, short, live and embed links even when canonical history exists", () => {
    const canonical = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    const urls = [canonical, "https://youtu.be/dQw4w9WgXcQ?t=20", "https://www.youtube.com/shorts/dQw4w9WgXcQ",
      "https://www.youtube.com/live/dQw4w9WgXcQ", "https://www.youtube.com/embed/dQw4w9WgXcQ",
      "https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ", canonical + "extra"];
    const rows = urls.map((url, index) => ({ id: index + 1, url, analysisResult: { schemaVersion: 3 } }));
    const s = makeServer({ db: { available: true,
      getNutHistory: (url: string) => rows.filter(row => row.url === url), getNutHistoryByPattern: () => rows } });
    for (const url of urls.slice(0, 5)) assert.deepEqual(s.getCaptureHistory(url).map((entry: any) => entry.nutId), [5, 4, 3, 2, 1]);
  });
  it("maps DB rows to capture entries with saved-state normalization", () => {
    const db = {
      available: true,
      getNutHistory: () => [
        {
          id: 7,
          savedAt: "2026-08-16T10:00:00Z",
          processingResult: "saved",
          analysisResult: { schemaVersion: 3, titleVerdict: "x" },
        },
        {
          id: 3,
          savedAt: "2026-08-15T09:00:00Z",
          processingResult: "analyzed",
          analysisResult: { schemaVersion: 3 },
        },
        {
          id: 1,
          savedAt: "2026-08-14T08:00:00Z",
          processingResult: "skip",
          analysisResult: { schemaVersion: 3 },
        },
      ],
    };
    const s = makeServer({ db });
    const history = s.getCaptureHistory("https://x.com/a");
    assert.equal(history.length, 3);
    assert.equal(history[0].nutId, 7);
    assert.equal(history[0].saved, "saved");
    assert.equal(history[1].saved, "analyzed");
    assert.equal(history[2].saved, "skip");
    assert.equal(history[1].result.schemaVersion, 3);
  });

  it("returns empty when the DB is unavailable", () => {
    const s = makeServer({ db: { available: false } });
    assert.deepEqual(s.getCaptureHistory("https://x.com/a"), []);
  });
});

describe("NutEggServer.handleCreateEgg", () => {
  function makeReq(body: string) {
    const req: any = {
      on(ev: string, cb: (...a: any[]) => void) {
        if (ev === "data") cb(body);
        if (ev === "end") cb();
        return req;
      },
    };
    return req;
  }

  function makeRes() {
    return {
      statusCode: 0,
      body: "",
      writeHead(code: number) {
        this.statusCode = code;
      },
      end(body: string) {
        this.body = body;
      },
    };
  }

  it("sanitizes the name and creates the egg via indexSync", async () => {
    let createdWith: any = null;
    const s = makeServer({
      indexSync: {
        createEgg: async (name: string, description: string) => {
          createdWith = [name, description];
          return { path: `nutegg/${name}.md`, alreadyExists: false };
        },
      },
    });
    const req = makeReq(
      JSON.stringify({ name: "Productivity 101", description: "systems" })
    );
    const res = makeRes();
    await s.handleCreateEgg(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(JSON.parse(res.body), {
      success: true,
      path: "nutegg/productivity_101.md",
      alreadyExists: false,
    });
    assert.deepEqual(createdWith, ["productivity_101", "systems"]);
  });

  it("sanitizes and preserves Unicode Chinese names", async () => {
    let createdWith: any = null;
    const s = makeServer({
      indexSync: {
        createEgg: async (name: string, description: string) => {
          createdWith = [name, description];
          return { path: `nutegg/${name}.md`, alreadyExists: false };
        },
      },
    });
    const req = makeReq(
      JSON.stringify({ name: "方法论", description: "做事的方法" })
    );
    const res = makeRes();
    await s.handleCreateEgg(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(JSON.parse(res.body), {
      success: true,
      path: "nutegg/方法论.md",
      alreadyExists: false,
    });
    assert.deepEqual(createdWith, ["方法论", "做事的方法"]);
  });

  it("rejects a blank name with 400", async () => {
    const s = makeServer({
      indexSync: {
        createEgg: async () => ({ path: "x.md", alreadyExists: false }),
      },
    });
    const req = makeReq(JSON.stringify({ name: "   " }));
    const res = makeRes();
    await s.handleCreateEgg(req, res);
    assert.equal(res.statusCode, 400);
  });
});

describe("NutEggServer.handleGetEggs", () => {
  function makeRes() {
    return {
      statusCode: 0,
      body: "",
      writeHead(code: number) {
        this.statusCode = code;
      },
      end(body: string) {
        this.body = body;
      },
    };
  }

  it("lists index entries enriched with their frontmatter topics", async () => {
    const s = makeServer({
      indexReader: {
        getIndexContent: async () =>
          "* nutegg/a.md: desc a\n* nutegg/b.md: desc b\n",
        parseIndexContent: () => [
          { fileName: "nutegg/a.md", description: "desc a" },
          { fileName: "nutegg/b.md", description: "desc b" },
        ],
      },
      eggParser: {
        readEgg: async (path: string) =>
          path.endsWith("a.md") ? { topic: "Alpha" } : null,
      },
    });
    const req = {} as any;
    const res = makeRes();
    await s.handleGetEggs(req, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(JSON.parse(res.body), {
      eggs: [
        { fileName: "nutegg/a.md", description: "desc a", topic: "Alpha" },
        { fileName: "nutegg/b.md", description: "desc b", topic: "Unknown" },
      ],
    });
  });

  it("returns an empty list when the index is missing", async () => {
    const s = makeServer({
      indexReader: { getIndexContent: async () => "(No _index.md found)" },
    });
    const req = {} as any;
    const res = makeRes();
    await s.handleGetEggs(req, res);
    assert.deepEqual(JSON.parse(res.body), { eggs: [] });
  });
});

describe("NutEggServer.countEggs", () => {
  it("counts direct markdown under nutegg/ excluding system files, _workflow, and subdirectories", () => {
    const { vault } = makeFakeVault({
      "nutegg/_index.md": "# index",
      "nutegg/investment.md": "# Knowledge",
      "nutegg/ai.md": "# Knowledge",
      "nutegg/_raw/2026-08-16-x.md": "raw",
      "nutegg/_workflow/content-analysis.md": "prompt",
      "nutegg/sub/nested.md": "nested",
      "outside.md": "outside",
    });
    const s = makeServer({ vault });
    assert.equal(s.countEggs(), 2);
  });
});

function makeReq(body: string) {
  const req: any = {
    on(ev: string, cb: (...a: any[]) => void) {
      if (ev === "data") cb(body);
      if (ev === "end") cb();
      return req;
    },
  };
  return req;
}

function makeRes() {
  return {
    statusCode: 0,
    headers: {} as any,
    body: "",
    writeHead(code: number, headers?: any) {
      this.statusCode = code;
      if (headers) this.headers = headers;
    },
    end(body: string) {
      this.body = body;
    },
  };
}

describe("NutEggServer tab-scoped AI diagnostics", () => {
  it("isolates overlapping follow-ups and includes summary/routing calls for their originating tab", async () => {
    const scopeA = "server-tab-a", scopeB = "server-tab-b";
    const pending = new Map<string, (value: string) => void>();
    let started!: () => void;
    const bothStarted = new Promise<void>(resolve => { started = resolve; });
    let blocking = true;
    const plugin: any = makeFakePlugin();
    plugin.aiClient.chat = (prompt: string, _maxTokens: number, scope: string) => trackAIRequest(prompt, () => {
      if (!blocking) return Promise.resolve(JSON.stringify({ titleVerdict: "Summary", coreSummary: ["Point"], mindMap: [] }));
      return new Promise<string>(resolve => { pending.set(scope, resolve); if (pending.size === 2) started(); });
    }, scope);
    plugin.aiProcessor = new AIProcessor(plugin);
    plugin.indexReader = new IndexReader(plugin);
    plugin.indexReader.getIndexContent = async () => "tech.md: Technology\nscience.md: Science";
    const s: any = new NutEggServer(plugin, 27123);
    const capture = { url: "https://example.test", title: "Article", content: "Article text", sourceType: "article" };
    const resA = makeRes(), resB = makeRes();
    const first = s.handleAsk(makeReq(JSON.stringify({ ...capture, debugScope: scopeA, questions: ["Why?"] })), resA);
    const second = s.handleAsk(makeReq(JSON.stringify({ ...capture, debugScope: scopeB, questions: ["How?"] })), resB);
    await bothStarted;
    assert.equal(getAIDebugInfo(scopeA).activeCalls, 1);
    assert.equal(getAIDebugInfo(scopeB).activeCalls, 1);
    pending.get(scopeB)!(JSON.stringify({ answers: [{ answer: "B" }] })); await second;
    assert.equal(getAIDebugInfo(scopeB).activeCalls, 0);
    assert.equal(getAIDebugInfo(scopeA).activeCalls, 1);
    pending.get(scopeA)!(JSON.stringify({ answers: [{ answer: "A" }] })); await first;
    assert.equal(resA.statusCode, 200); assert.equal(resB.statusCode, 200);
    blocking = false;
    const analyzed = makeRes();
    await s.handleAnalyze(makeReq(JSON.stringify({ ...capture, debugScope: scopeA, stage: 1, force: true })), analyzed);
    assert.equal(analyzed.statusCode, 200);
    assert.equal(getAIDebugInfo(scopeA).totalCalls, 3, "follow-up, content summary and egg routing");
    assert.equal(getAIDebugInfo(scopeB).totalCalls, 1);
    assert.equal(getAIDebugInfo(scopeA).activeCalls, 0);
    assert.equal(s.captureSnapshot({ ...capture, debugScope: scopeA }).debugScope, undefined);

    const response = makeRes();
    s.handleDebugInfo({ url: `/debug-info?scope=${scopeB}` }, response);
    assert.equal(JSON.parse(response.body).totalCalls, 1);
    assert.equal(response.headers["Cache-Control"], "no-store");
    for (const url of ["/debug-info", "/debug-info?scope=unknown-tab"]) {
      const empty = makeRes(); s.handleDebugInfo({ url }, empty);
      assert.equal(JSON.parse(empty.body).totalCalls, 0, "never expose global totals for a missing/unknown scope");
    }
  });
});

describe("NutEggServer.handleConfirm", () => {
  const baseConfirm = {
    url: "https://x.com/a",
    title: "Article Title",
    content: "content",
    sourceType: "article",
    metadata: { author: "Jane Doe" },
    skipRaw: true,
  };

  it("hatches Bilibili captures with numeric metadata through the real save path", async () => {
    const { vault, files } = makeFakeVault({ "nutegg/ai_ml.md": "# Knowledge\n\n# Unprocessed\n" });
    let saved: any;
    const plugin = makeFakePlugin({ vault,
      db: { getNutById: () => null, getNutByUrl: () => null, insertNut: (row: any) => { saved = row; } },
    });
    plugin.eggParser = new EggParser(plugin as any);
    plugin.knowledgeBase = new KnowledgeBase(plugin as any);
    const s = new NutEggServer(plugin as any, 27123) as any;
    const res = makeRes();
    await s.handleConfirm(makeReq(JSON.stringify({
      ...baseConfirm, skipRaw: false, sourceType: "bilibili",
      url: "https://www.bilibili.com/video/BV1eVgA64EbW", metadata: { author: "作者", cid: 117091965343752, part: 1, time_estimate_minutes: 12 },
      newKnowledge: [{ egg: "nutegg/ai_ml.md", content: "- Useful answer" }],
      analysis: { schemaVersion: 3, eggResults: [] },
    })), res);
    assert.equal(res.statusCode, 200, res.body);
    assert.equal(JSON.parse(res.body).success, true);
    assert.equal(saved.processingResult, "saved");
    assert.ok(files.get(saved.fileName)!.includes('cid: "117091965343752"'));
    assert.ok(files.get("nutegg/ai_ml.md")!.includes("Useful answer"));
  });

  it("appends entries with author/source upon confirmation", async () => {
    let appended: any = null;
    const s = makeServer({
      knowledgeBase: {
        saveRaw: async () => "nutegg/_raw/x.md",
        appendKnowledge: async (...args: any[]) => {
          appended = args;
        },
      },
    });
    const newKnowledge = [
      { egg: "egg.md", parent: "p", content: "- one" },
      { egg: "other.md", content: "- two" },
    ];
    const req = makeReq(JSON.stringify({ ...baseConfirm, newKnowledge }));
    const res = makeRes();
    await s.handleConfirm(req, res);

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.success, true);
    assert.deepEqual(body.merged, []);
    // appendKnowledge got (newKnowledge, sourceTitle, sourceUrl, author)
    assert.deepEqual(appended[0], newKnowledge);
    assert.equal(appended[1], "Article Title");
    assert.equal(appended[2], "https://x.com/a");
    assert.equal(appended[3], "Jane Doe");
  });

  it("rejects unsafe egg destinations before any archive, append or database write", async () => {
    const effects: string[] = [];
    const s = makeServer({
      knowledgeBase: {
        saveRaw: async () => { effects.push("archive"); return "raw.md"; },
        appendKnowledge: async () => { effects.push("append"); },
      },
      db: { insertNut: () => effects.push("database") },
    });
    for (const path of ["outside/egg.md", "../egg.md", "/nutegg/egg.md", "nutegg/_index.md", "nutegg/_raw/egg.md"]) {
      const res = makeRes();
      await s.handleConfirm(makeReq(JSON.stringify({ ...baseConfirm, skipRaw: false,
        newKnowledge: [{ egg: "nutegg/valid.md", content: "valid" }, { egg: path, content: "unsafe" }],
      })), res);
      assert.equal(res.statusCode, 400, path);
      assert.match(JSON.parse(res.body).error, /configured egg folder/);
    }
    assert.deepEqual(effects, []);
  });

  it("hatches basename selections and language metadata only into the actual egg folder", async () => {
    const rootNote = "# Knowledge\n- private root note";
    const externalNote = "# Knowledge\n- private external note";
    const { vault, files } = makeFakeVault({
      "egg.md": rootNote,
      "outside/egg.md": externalNote,
      "nutegg/egg.md": "# Knowledge\n- tree",
    });
    const plugin = makeFakePlugin({ vault });
    plugin.eggParser = new EggParser(plugin as any);
    plugin.knowledgeBase = new KnowledgeBase(plugin as any);
    const s = new NutEggServer(plugin as any, 27123) as any;
    const res = makeRes();
    await s.handleConfirm(makeReq(JSON.stringify({ ...baseConfirm,
      newKnowledge: [{ egg: "egg.md", content: "new insight" }],
      analysis: { eggResults: [{ egg: "egg.md", language: "English" }, { egg: "outside/egg.md", language: "Chinese" }] },
    })), res);
    assert.equal(res.statusCode, 200, res.body);
    assert.ok(files.get("nutegg/egg.md")!.includes("- new insight"));
    assert.ok(files.get("nutegg/egg.md")!.includes('language: "English"'));
    assert.equal(files.get("egg.md"), rootNote);
    assert.equal(files.get("outside/egg.md"), externalNote);
  });

  it("archives Stage 2 originals on an already-collected nut and schedules merge after acknowledgement", async () => {
    const events: string[] = [];
    const analysis = { schemaVersion: 3, readAction: "skip", eggResults: [{ egg: "egg.md", language: "English" }] };
    const s = makeServer({
      db: { getNutById: () => ({ id: 42, fileName: "nutegg/_raw/original.md", processingResult: "unprocessed" }), updateNut: () => events.push("db") },
      knowledgeBase: {
        updateRawAnalysis: async (path: string, value: any) => { assert.equal(path, "nutegg/_raw/original.md"); assert.deepEqual(value, analysis); events.push("archive"); },
        appendKnowledge: async () => { events.push("append"); },
      },
      eggParser: { readEgg: async () => null },
      aiProcessor: { maybeMergeEgg: async () => { events.push("merge"); return null; } },
    });
    const res = makeRes();
    await s.handleConfirm(makeReq(JSON.stringify({ ...baseConfirm, nutId: 42, analysis, newKnowledge: [{ egg: "egg.md", content: "Useful answer" }] })), res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(events, ["append", "archive", "db"]);
    await new Promise(resolve => setTimeout(resolve, 5));
    assert.deepEqual(events, ["append", "archive", "db", "merge"]);
  });

  it("does not append a second Hatch for a saved result", async () => {
    const s = makeServer({ db: { getNutById: () => ({ processingResult: "saved", fileName: "original.md", analysisResult: { newKnowledge: [{ egg: 'egg.md', content: 'one' }] } }) },
      knowledgeBase: { appendKnowledge: async () => { assert.fail("duplicate append"); } } });
    const res = makeRes();
    await s.handleConfirm(makeReq(JSON.stringify({ ...baseConfirm, nutId: 42, newKnowledge: [{ egg: "egg.md", content: "one" }] })), res);
    assert.equal(res.statusCode, 200);
    assert.equal(JSON.parse(res.body).alreadySaved, true);
  });

  it('hatches additional eggs without replaying confirmed entries, even after analysis changes and a restart', async () => {
    const row: any = { id: 42, processingResult: 'analyzed', fileName: '', confirmedKnowledge: null };
    const appended: any[] = []; let archives = 0;
    const plugin = makeFakePlugin({
      db: { getNutById: () => structuredClone(row), updateNut: (_id: number, patch: any) => Object.assign(row, patch) },
      knowledgeBase: {
        saveRaw: async () => { archives++; return 'nutegg/_raw/original.md'; },
        updateRawAnalysis: async () => {},
        appendKnowledge: async (entries: any[]) => { appended.push(...entries); },
      },
    });
    const first = { egg: 'nutegg/first.md', content: 'First insight' };
    const second = { egg: 'nutegg/second.md', content: 'Second insight' };
    const s: any = new NutEggServer(plugin as any, 27123);
    const payload = { ...baseConfirm, nutId: 42, skipRaw: false };
    const resA = makeRes();
    await s.handleConfirm(makeReq(JSON.stringify({ ...payload, newKnowledge: [first], analysis: { newKnowledge: [first] } })), resA);
    assert.equal(resA.statusCode, 200);
    // Stage 2 updates this same nut's analysis, independently of its save ledger.
    row.analysisResult = { newKnowledge: [first, second] };
    const resB = makeRes();
    await s.handleConfirm(makeReq(JSON.stringify({ ...payload, newKnowledge: [first, second], analysis: row.analysisResult })), resB);
    assert.equal(resB.statusCode, 200);
    assert.deepEqual(appended, [first, second]); assert.equal(archives, 1);
    assert.equal(row.confirmedKnowledge.length, 2);
    const restarted: any = new NutEggServer(plugin as any, 27123), repeated = makeRes();
    await restarted.handleConfirm(makeReq(JSON.stringify({ ...payload, newKnowledge: [{ ...first, egg: 'first.md' }, second] })), repeated);
    assert.equal(JSON.parse(repeated.body).alreadySaved, true);
    assert.equal(appended.length, 2);
  });

  it('legacy saved nuts use archived Hatch entries rather than their newer Stage 2 analysis', async () => {
    const first = { egg: 'first.md', content: 'First insight' }, second = { egg: 'second.md', content: 'Second insight' };
    const row: any = { id: 42, processingResult: 'saved', fileName: 'original.md', analysisResult: { newKnowledge: [first, second] } };
    let appended: any;
    const s = makeServer({
      db: { getNutById: () => row, updateNut: (_id: number, patch: any) => Object.assign(row, patch) },
      knowledgeBase: {
        readRawAnalysis: async () => ({ newKnowledge: [first] }), updateRawAnalysis: async () => {},
        appendKnowledge: async (entries: any[]) => { appended = entries; },
      },
    });
    const res = makeRes();
    await s.handleConfirm(makeReq(JSON.stringify({ ...baseConfirm, nutId: 42, newKnowledge: [first, second], analysis: row.analysisResult })), res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(appended, [second]); assert.equal(row.confirmedKnowledge.length, 2);
  });

  it('concurrent confirmations for one nut append once and release the queue', async () => {
    const row: any = { id: 42, processingResult: 'analyzed', fileName: 'original.md', confirmedKnowledge: [] };
    let release!: () => void, started!: () => void, appends = 0;
    const waiting = new Promise<void>(resolve => { release = resolve; });
    const began = new Promise<void>(resolve => { started = resolve; });
    const s = makeServer({
      db: { getNutById: () => structuredClone(row), updateNut: (_id: number, patch: any) => Object.assign(row, patch) },
      knowledgeBase: { appendKnowledge: async () => { appends++; started(); await waiting; } },
    });
    const payload = JSON.stringify({ ...baseConfirm, nutId: 42, newKnowledge: [{ egg: 'egg.md', content: 'One insight' }] });
    const first = makeRes(), second = makeRes();
    const a = s.handleConfirm(makeReq(payload), first); await began;
    const b = s.handleConfirm(makeReq(payload), second);
    release(); await Promise.all([a, b]);
    assert.equal(first.statusCode, 200); assert.equal(second.statusCode, 200);
    assert.equal(appends, 1); assert.equal(JSON.parse(second.body).alreadySaved, true);
    assert.equal(s.confirmationQueues.size, 0);
  });

  it('a failed confirmation does not block a retry', async () => {
    let appends = 0;
    const s = makeServer({ knowledgeBase: { appendKnowledge: async () => { if (++appends === 1) throw new Error('Temporary write failure'); } } });
    const payload = JSON.stringify({ ...baseConfirm, newKnowledge: [{ egg: 'egg.md', content: 'One insight' }] });
    const first = makeRes(), second = makeRes();
    await s.handleConfirm(makeReq(payload), first);
    await s.handleConfirm(makeReq(payload), second);
    assert.equal(first.statusCode, 500); assert.equal(second.statusCode, 200);
    assert.equal(s.confirmationQueues.size, 0);
  });

  it("resolves the author from channel metadata when author is absent", async () => {
    let appended: any = null;
    const s = makeServer({
      knowledgeBase: {
        saveRaw: async () => "f",
        appendKnowledge: async (...args: any[]) => {
          appended = args;
        },
      },
      aiProcessor: { maybeMergeEgg: async () => null },
    });
    const req = makeReq(
      JSON.stringify({
        ...baseConfirm,
        metadata: { channel: "TechChannel" },
        newKnowledge: [{ egg: "egg.md", content: "- one" }],
      })
    );
    const res = makeRes();
    await s.handleConfirm(req, res);
    assert.equal(appended[3], "TechChannel");
    assert.deepEqual(JSON.parse(res.body).merged, []);
  });
});

describe("NutEggServer.handleCredit & handleConfigStatus", () => {
  it("returns credit info via handleCredit", async () => {
    const s = makeServer({
      aiClient: {
        checkCredit: async () => ({
          provider: "anthropic",
          providerLabel: "Anthropic (Claude)",
          source: "openrouter",
          model: "claude-sonnet-5",
          hasBalance: true,
          balanceFormatted: "$8.45",
          currency: "USD",
          totalCredits: 10,
          totalUsage: 1.55,
          statusText: "$8.45 left",
        }),
      },
    });
    const res = {
      statusCode: 0,
      headers: {},
      body: "",
      writeHead(code: number, headers: any) {
        this.statusCode = code;
        this.headers = headers;
      },
      end(data: string) {
        this.body = data;
      },
    };
    await s.handleCredit(res);
    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.hasBalance, true);
    assert.equal(body.balanceFormatted, "$8.45");
  });

  it("includes credit info in handleConfigStatus", async () => {
    const s = makeServer({
      settings: {
        aiApiKey: "sk-test",
        indexFile: "nutegg/_index.md",
      },
      app: {
        vault: {
          adapter: {
            exists: async () => true,
          },
        },
      },
      aiClient: {
        checkCredit: async () => ({
          provider: "deepseek",
          providerLabel: "DeepSeek",
          source: "official",
          model: "deepseek-chat",
          hasBalance: true,
          balanceFormatted: "¥10.00",
          statusText: "¥10.00 available",
        }),
      },
    });
    const res = {
      statusCode: 0,
      headers: {},
      body: "",
      writeHead(code: number, headers: any) {
        this.statusCode = code;
        this.headers = headers;
      },
      end(data: string) {
        this.body = data;
      },
    };
    await s.handleConfigStatus(res);
    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.status, "ok");
    assert.equal(body.version, "0.1.0");
    assert.equal(body.credit?.balanceFormatted, "¥10.00");
  });
});

describe("NutEggServer.handleAnalyze stages & summary routing", () => {
  const baseCapture = {
    url: "https://example.com/article",
    title: "Article Title",
    content: "Full content text here",
    sourceType: "article",
    force: true,
  };

  it("stage 1: generates content analysis and routes eggs using summary", async () => {
    let routedWithContent = "";
    const s = makeServer({
      aiProcessor: {
        analyzeContent: async () => ({
          titleVerdict: "Core verdict answer.",
          coreSummary: ["Bullet 1", "Bullet 2"],
          customQuestionAnswers: [],
        }),
      },
      indexReader: {
        getIndexContent: async () => "- [[tech.md]]: Tech topics\n- [[finance.md]]: Finance",
        parseIndexContent: () => [
          { fileName: "tech.md", description: "Tech topics", topic: "Tech" },
          { fileName: "finance.md", description: "Finance", topic: "Finance" },
        ],
        matchEggs: async (contentObj: any) => {
          routedWithContent = contentObj.content;
          return [{ fileName: "tech.md", description: "Tech topics", topic: "Tech" }];
        },
      },
    });

    const req = makeReq(JSON.stringify({ ...baseCapture, stage: 1 }));
    const res = makeRes();
    await s.handleAnalyze(req, res);

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.stage, "stage1");
    assert.equal(body.titleVerdict, "Core verdict answer.");
    assert.deepEqual(body.matchedEggs, ["tech.md"]);
    // Verified: routing received the concise summary instead of 30k raw characters!
    assert.ok(routedWithContent.includes("Core verdict answer."));
    assert.ok(routedWithContent.includes("Bullet 1"));
    assert.equal(routedWithContent.includes("Full content text here"), false);
  });

  it("stage 2: persists selected cached results alongside newly analyzed eggs", async () => {
    const eggResult = (egg: string, readAction: string) => ({ egg, readAction, readVerdict: readAction === "full", readVerdictReason: egg,
      readingSources: [], keyQuestionAnswers: [], extractedEntries: [{ content: `Insight ${egg}` }] });
    const cachedA = eggResult("A.md", "full");
    const cachedC = eggResult("C.md", "skip");
    let processedEggs: any[] = [], stored: any;
    const s = makeServer({
      indexReader: { getIndexContent: async () => "index", parseIndexContent: () => [] },
      eggParser: { readEggs: async (eggs: any[]) => eggs },
      aiProcessor: { analyzeEggs: async (_capture: any, eggs: any[], contentAnalysis: any) => {
        processedEggs = eggs;
        return { ...contentAnalysis, eggResults: [eggResult("B.md", "summary")], newKnowledge: [] };
      } },
      db: { getNutById: () => ({ id: 42 }), updateNut: (_id: number, changes: any) => { stored = changes.analysisResult; } },
    });
    const req = makeReq(JSON.stringify({ ...baseCapture, stage: 2, nutId: 42,
      eggs: ["B.md"], selectedEggs: ["A.md", "B.md"], cachedEggResults: [cachedA, cachedC],
      contentAnalysis: { titleVerdict: "Existing verdict", coreSummary: [], customQuestionAnswers: [] },
    }));
    const res = makeRes();
    await s.handleAnalyze(req, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(processedEggs.map(egg => egg.fileName), ["B.md"]);
    assert.deepEqual(stored.matchedEggs, ["A.md", "B.md"]);
    assert.deepEqual(stored.eggResults.map((egg: any) => egg.egg), ["A.md", "B.md"]);
    assert.equal(stored.shouldRead, true);
    assert.deepEqual(stored.newKnowledge.map((entry: any) => entry.egg), ["A.md", "B.md"]);
    assert.deepEqual(stored.eggAnalysisCache.map((egg: any) => egg.egg), ["A.md", "C.md", "B.md"]);
    assert.equal(JSON.parse(res.body).nutId, 42);
  });

  it("stage 2: analyzes instructions for confirmed eggs", async () => {
    let analyzeEggsCalledWith: any = null;
    const s = makeServer({
      indexReader: {
        getIndexContent: async () => "- [[tech.md]]: Tech",
        parseIndexContent: () => [{ fileName: "tech.md", description: "Tech", topic: "Tech" }],
      },
      eggParser: {
        readEggs: async (matched: any[]) =>
          matched.map((m) => ({ fileName: m.fileName, knowledge: "", unprocessed: "" })),
      },
      aiProcessor: {
        analyzeEggs: async (_cap: any, eggs: any[], contentAnalysis: any) => {
          analyzeEggsCalledWith = { eggs, contentAnalysis };
          return {
            ...contentAnalysis,
            matchedEggs: eggs.map((e: any) => e.fileName),
            eggResults: [],
            newKnowledge: [{ egg: "tech.md", content: "- novel insight" }],
            shouldRead: true,
            shouldReadReason: "Novel insights found",
          };
        },
      },
    });

    const contentAnalysis = {
      titleVerdict: "Core verdict answer.",
      coreSummary: ["Bullet 1"],
      customQuestionAnswers: [],
    };
    const req = makeReq(
      JSON.stringify({
        ...baseCapture,
        stage: 2,
        eggs: ["tech.md"],
        contentAnalysis,
      })
    );
    const res = makeRes();
    await s.handleAnalyze(req, res);

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.shouldRead, true);
    assert.equal(body.newKnowledge.length, 1);
    assert.equal(analyzeEggsCalledWith.eggs[0].fileName, "tech.md");
    assert.equal(analyzeEggsCalledWith.contentAnalysis.titleVerdict, "Core verdict answer.");
  });

  it("stage 1: executes even when cached history exists for the URL", async () => {
    let analyzeContentCalled = false;
    const s = makeServer({
      aiProcessor: {
        analyzeContent: async () => {
          analyzeContentCalled = true;
          return {
            titleVerdict: "Fresh stage 1 verdict.",
            coreSummary: ["New summary"],
            customQuestionAnswers: [],
          };
        },
      },
      indexReader: {
        getIndexContent: async () => "- [[tech.md]]: Tech",
        parseIndexContent: () => [{ fileName: "tech.md", description: "Tech", topic: "Tech" }],
        matchEggs: async () => [{ fileName: "tech.md", description: "Tech", topic: "Tech" }],
      },
    });

    // Mock getCaptureHistory returning a cached entry
    (s as any).getCaptureHistory = () => [
      {
        nutId: 99,
        url: baseCapture.url,
        capturedAt: "2026-01-01T00:00:00.000Z",
        saved: "analyzed",
        result: { titleVerdict: "Old cached verdict" },
      },
    ];

    const req = makeReq(JSON.stringify({ ...baseCapture, stage: 1, force: false }));
    const res = makeRes();
    await s.handleAnalyze(req, res);

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(analyzeContentCalled, true);
    assert.equal(body.stage, "stage1");
    assert.equal(body.titleVerdict, "Fresh stage 1 verdict.");
    assert.equal(body.history, undefined);
  });

  it("stage 1: records nut in database and returns nutId", async () => {
    let insertedRow: any = null;
    const s = makeServer({
      db: {
        available: true,
        insertNut: (row: any) => {
          insertedRow = row;
          return 42;
        },
      },
      aiProcessor: {
        analyzeContent: async () => ({
          titleVerdict: "Stage 1 summary verdict",
          coreSummary: ["Bullet A"],
          customQuestionAnswers: [],
        }),
      },
      indexReader: {
        getIndexContent: async () => "- [[tech.md]]: Tech",
        parseIndexContent: () => [{ fileName: "tech.md", description: "Tech", topic: "Tech" }],
        matchEggs: async () => [{ fileName: "tech.md", description: "Tech", topic: "Tech" }],
      },
    });

    const req = makeReq(JSON.stringify({ ...baseCapture, stage: 1 }));
    const res = makeRes();
    await s.handleAnalyze(req, res);

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.stage, "stage1");
    assert.equal(body.nutId, 42);
    assert.equal(insertedRow?.analysisResult?.stage, "stage1");
    assert.equal(insertedRow?.processingResult, "analyzed");
    assert.equal(insertedRow?.matchedEggs[0], "tech.md");
  });

  it("stage 2: updates existing row when nutId from stage 1 is provided", async () => {
    let updatedNutId: number | null = null;
    let updatePatch: any = null;
    const s = makeServer({
      db: {
        available: true,
        getNutById: (id: number) => ({ id, url: baseCapture.url }),
        updateNut: (id: number, patch: any) => {
          updatedNutId = id;
          updatePatch = patch;
        },
      },
      aiProcessor: {
        analyzeEggs: async () => ({
          titleVerdict: "Verdict",
          coreSummary: ["Summary"],
          eggResults: [],
          newKnowledge: [],
          shouldRead: true,
          shouldReadReason: "Good read",
        }),
      },
      indexReader: {
        getIndexContent: async () => "- [[tech.md]]: Tech",
        parseIndexContent: () => [{ fileName: "tech.md", description: "Tech", topic: "Tech" }],
      },
      eggParser: {
        readEggs: async () => [],
      },
    });

    const req = makeReq(
      JSON.stringify({
        ...baseCapture,
        stage: 2,
        nutId: 42,
        eggs: ["tech.md"],
      })
    );
    const res = makeRes();
    await s.handleAnalyze(req, res);

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.stage, "stage2");
    assert.equal(body.nutId, 42);
    assert.equal(updatedNutId, 42);
    assert.equal(updatePatch?.analysisResult?.shouldRead, true);
  });
});


it('discussion capture snapshot excludes unselected comments and preserves selected source records', () => {
  const s = makeServer();
  const payload = { url: 'https://forum.test', title: 'Thread', content: 'Question', sourceType: 'forum', enabledSections: { discussion: false }, discussion: { kind: 'forum', status: 'partial', items: [{ id: 'a', text: 'Experience' }] } };
  assert.equal(s.captureSnapshot(payload).discussion, undefined);
  payload.enabledSections.discussion = true;
  assert.equal(s.captureSnapshot(payload).discussion.items[0].id, 'a');
});

describe("Chrome AI configuration sync", () => {
  const config = {
    aiProvider: "codex-cli", aiApiKey: " pairing-token ", aiModel: " auto ",
    localEndpoint: "http://localhost:11434/v1/chat/completions", localApiType: "openai",
    chunkWindowChars: 12000, contentAnalysisMaxTokens: 6000,
    serverPort: 1234, rawFolder: "other-folder", developerMode: true,
  };
  const request = { headers: { origin: "chrome-extension://nutegg", "content-type": "application/json" } };
  const response = () => ({ statusCode: 0, body: "", writeHead(code: number) { this.statusCode = code; }, end(data: string) { this.body = data; } });

  it("mirrors only AI fields, preserves settings references, and skips repeated saves", async () => {
    let saves = 0;
    const s = makeServer({ saveSettings: async () => { saves++; } });
    const original = s.plugin.settings;
    s.readBody = async () => JSON.stringify(config);
    const res = response();
    await s.handleAiConfig(request, res);
    assert.equal(res.statusCode, 200);
    assert.equal(s.plugin.settings, original);
    assert.equal(original.aiProvider, "codex-cli");
    assert.equal(original.aiApiKey, "pairing-token");
    assert.equal(original.aiModel, "auto");
    assert.equal(original.chunkWindowChars, 12000);
    assert.equal(original.contentAnalysisMaxTokens, 6000);
    assert.equal(original.localApiType, "openai");
    assert.equal(original.rawFolder, "nutegg/_raw");
    assert.equal(original.serverPort, 27123);
    assert.doesNotMatch(res.body, /pairing-token/);
    await s.handleAiConfig(request, response());
    assert.equal(saves, 1);
    s.readBody = async () => JSON.stringify({ ...config, aiProvider: "local", aiApiKey: "", aiModel: "local-model" });
    await s.handleAiConfig(request, response());
    assert.equal(original.aiApiKey, "");
    assert.equal(original.aiProvider, "local");
    assert.equal(saves, 2);
  });

  it("rejects invalid providers and limits without changing configuration", async () => {
    const s = makeServer({ saveSettings: async () => { throw new Error("Must not save"); } });
    const before = JSON.stringify(s.plugin.settings);
    for (const change of [{ aiProvider: "__proto__" }, { aiApiKey: 3 }, { chunkWindowChars: 999 }, { chunkWindowChars: 1200.5 }, { contentAnalysisMaxTokens: 499 }, { localApiType: "invalid" }]) {
      s.readBody = async () => JSON.stringify({ ...config, ...change });
      const res = response();
      await s.handleAiConfig(request, res);
      assert.equal(res.statusCode, 400);
      assert.equal(JSON.stringify(s.plugin.settings), before);
    }
  });

  it("rejects non-extension origins and non-JSON requests before reading credentials", async () => {
    const s = makeServer();
    s.readBody = async () => { throw new Error("Must not read"); };
    for (const headers of [{}, { origin: "https://example.com", "content-type": "application/json" }, { origin: "http://localhost:1234", "content-type": "application/json" }, { origin: "chrome-extension://nutegg", "content-type": "text/plain" }]) {
      const res = response();
      await s.handleAiConfig({ headers }, res);
      assert.equal(res.statusCode, 403);
    }
  });

  it("restores old settings when saving fails and allows a later retry", async () => {
    let fail = true;
    const s = makeServer({ saveSettings: async () => { if (fail) throw new Error("Disk failure"); } });
    const before = { ...s.plugin.settings };
    s.readBody = async () => JSON.stringify(config);
    await assert.rejects(s.handleAiConfig(request, response()), /Disk failure/);
    assert.equal(s.plugin.settings.aiApiKey, before.aiApiKey);
    assert.equal(s.plugin.settings.chunkWindowChars, before.chunkWindowChars);
    fail = false;
    const res = response();
    await s.handleAiConfig(request, res);
    assert.equal(res.statusCode, 200);
    assert.equal(s.plugin.settings.aiProvider, "codex-cli");
  });
});
