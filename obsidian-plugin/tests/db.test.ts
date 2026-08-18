import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { NutEggDatabase, type NutRow } from "../src/db";

function sqliteAvailable(): boolean {
  try {
    require("node:sqlite");
    return true;
  } catch {
    return false;
  }
}

function capture(overrides: Partial<Omit<NutRow, "id">> = {}): Omit<NutRow, "id"> {
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
    ...overrides,
  };
}

describe("NutEggDatabase", { skip: !sqliteAvailable() }, () => {
  let tmp: string;
  let db: NutEggDatabase;

  before(async () => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "nutegg-db-test-"));
    fs.mkdirSync(path.join(tmp, "nutegg"), { recursive: true });
    const adapter = {
      exists: async () => false,
      getBasePath: () => tmp,
    };
    const plugin = {
      settings: { rawFolder: "nutegg/_raw" },
      app: {
        vault: {
          adapter,
          createFolder: async (p: string) =>
            fs.mkdirSync(path.join(tmp, p), { recursive: true }),
        },
      },
    };
    db = new NutEggDatabase(plugin as any);
    await db.init();
  });

  after(() => {
    db.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("opens and becomes available", () => {
    assert.equal(db.available, true);
    assert.ok(fs.existsSync(path.join(tmp, "nutegg/.nutegg.db")));
  });

  it("insertNut returns incremental row ids", () => {
    const id1 = db.insertNut(capture({ savedAt: "2026-08-14T10:00:00Z" }));
    const id2 = db.insertNut(capture({ savedAt: "2026-08-15T09:00:00Z", title: "V2" }));
    assert.equal(id1, 1);
    assert.equal(id2, 2);
  });

  it("versions captures: same URL yields multiple rows, newest first", () => {
    db.insertNut(capture({ savedAt: "2026-08-16T08:00:00Z", title: "V3" }));
    const history = db.getNutHistory("https://example.com/video");
    assert.equal(history.length, 3);
    assert.equal(history[0].title, "V3");
    assert.equal(history[2].title, "How transformers actually work");
  });

  it("getNutByUrl returns the latest capture", () => {
    assert.equal(db.getNutByUrl("https://example.com/video")?.title, "V3");
    assert.equal(db.getNutByUrl("https://never-seen.com"), null);
  });

  it("getNutById returns the right row and parses JSON columns", () => {
    const row = db.getNutById(1);
    assert.ok(row);
    assert.deepEqual(row!.matchedEggs, ["nutegg/ai_ml.md"]);
    assert.equal(row!.processingResult, "analyzed");
    assert.equal(row!.author, "3Blue1Brown");
  });

  it("updateNut changes only the targeted capture", () => {
    db.updateNut(3, {
      processingResult: "saved",
      fileName: "nutegg/_raw/x.md",
    });
    const updated = db.getNutById(3);
    assert.equal(updated?.processingResult, "saved");
    assert.equal(updated?.fileName, "nutegg/_raw/x.md");
    assert.equal(db.getNutById(1)?.processingResult, "analyzed");
  });

  it("updateNut ignores a missing file_name patch", () => {
    db.updateNut(2, { processingResult: "skip" });
    assert.equal(db.getNutById(2)?.fileName, "");
    assert.equal(db.getNutById(2)?.processingResult, "skip");
  });

  it("getStats counts every capture and sums time estimates", () => {
    const stats = db.getStats();
    assert.equal(stats.nuts, 3);
    assert.equal(stats.timeSavedMinutes, 54);
  });

  it("search ranks BM25 matches and misses return empty", () => {
    const hits = db.search("transformers attention");
    assert.ok(hits.length >= 1);
    // The title match on "transformers" outranks content-only matches
    assert.equal(hits[0].title, "How transformers actually work");
    const miss = db.search("quantum chromodynamics");
    assert.equal(miss.length, 0);
  });

  it("unavailable DB degrades gracefully", () => {
    const dead = new NutEggDatabase({
      settings: { rawFolder: "nutegg/_raw" },
      app: { vault: { adapter: { getBasePath: () => "/nowhere" } } },
    } as any);
    // init() with a broken path still resolves and available=false
    return dead.init().then(() => {
      assert.equal(dead.available, false);
      assert.equal(dead.getStats().nuts, 0);
      assert.deepEqual(dead.getNutHistory("x"), []);
      assert.deepEqual(dead.search("x"), []);
      assert.equal(dead.insertNut(capture()), null);
      dead.updateNut(1, { processingResult: "saved" }); // must not throw
    });
  });
});
