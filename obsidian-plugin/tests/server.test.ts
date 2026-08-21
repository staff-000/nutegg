import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { NutEggServer } from "../src/server";
import { makeFakePlugin, makeFakeVault } from "./helpers";

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
  it("maps DB rows to capture entries with saved-state normalization", () => {
    const db = {
      available: true,
      getNutHistory: () => [
        {
          id: 7,
          savedAt: "2026-08-16T10:00:00Z",
          processingResult: "saved",
          analysisResult: { titleVerdict: "x" },
        },
        {
          id: 3,
          savedAt: "2026-08-15T09:00:00Z",
          processingResult: "analyzed",
          analysisResult: null,
        },
        {
          id: 1,
          savedAt: "2026-08-14T08:00:00Z",
          processingResult: "skip",
          analysisResult: null,
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
    assert.equal(history[1].result, null);
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

describe("NutEggServer.countEggs", () => {
  it("counts markdown under nutegg/ excluding _raw and _index", () => {
    const { vault } = makeFakeVault({
      "nutegg/_index.md": "# index",
      "nutegg/investment.md": "## Knowledge",
      "nutegg/ai.md": "## Knowledge",
      "nutegg/_raw/2026-08-16-x.md": "raw",
      "outside.md": "outside",
    });
    const s = makeServer({ vault });
    assert.equal(s.countEggs(), 2);
  });
});

describe("NutEggServer.handleConfirm", () => {
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

  const baseConfirm = {
    url: "https://x.com/a",
    title: "Article Title",
    content: "content",
    sourceType: "article",
    metadata: { author: "Jane Doe" },
    skipRaw: true,
  };

  it("appends entries with author/source and triggers the merge for crossed eggs", async () => {
    let appended: any = null;
    const s = makeServer({
      knowledgeBase: {
        saveRaw: async () => "nutegg/_raw/x.md",
        appendKnowledge: async (...args: any[]) => {
          appended = args;
        },
      },
      aiProcessor: {
        maybeMergeEgg: async (egg: string) =>
          egg === "egg.md" ? { egg, entries: 20 } : null,
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
    assert.deepEqual(body.merged, [{ egg: "egg.md", entries: 20 }]);
    // appendKnowledge got (newKnowledge, sourceTitle, sourceUrl, author)
    assert.deepEqual(appended[0], newKnowledge);
    assert.equal(appended[1], "Article Title");
    assert.equal(appended[2], "https://x.com/a");
    assert.equal(appended[3], "Jane Doe");
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
