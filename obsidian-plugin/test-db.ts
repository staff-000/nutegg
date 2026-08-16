/**
 * Standalone test harness for NutEggDatabase — bundles db.ts with a stub
 * plugin and runs it against real node:sqlite. Not part of the plugin build.
 */
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { NutEggDatabase } from "./src/db";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "nutegg-db-test-"));

// Fake Obsidian vault adapter backed by the temp dir
const adapter = {
  exists: async (p: string) => fs.existsSync(path.join(tmp, p)),
  read: async (p: string) => fs.readFileSync(path.join(tmp, p), "utf8"),
  remove: async (p: string) => fs.unlinkSync(path.join(tmp, p)),
  getBasePath: () => tmp,
};
const vault = {
  adapter,
  createFolder: async (p: string) => fs.mkdirSync(path.join(tmp, p), { recursive: true }),
};
const plugin = {
  settings: { rawFolder: "nutegg/_raw" },
  app: { vault },
};

const mkdir = (p: string) => fs.mkdirSync(path.join(tmp, p), { recursive: true });
const exists = (p: string) => fs.existsSync(path.join(tmp, p));

function capture(content: string, savedAt: string) {
  return {
    url: "https://example.com/video",
    title: "How transformers actually work",
    sourceType: "youtube",
    content,
    savedAt,
    publishedAt: "2026-08-10",
    author: "3Blue1Brown",
    timeEstimateMinutes: 18,
    processingResult: "analyzed" as const,
    summary: "Clear explanation of attention.",
    matchedEggs: ["nutegg/ai_ml.md"],
    fileName: "",
    analysisResult: {
      titleVerdict: "Yes — attention is weighted context lookup.",
      coreSummary: ["bullet"], isLongForm: false, chapterMap: [],
      customQuestionAnswers: [],
      shouldRead: true, shouldReadReason: "x", matchedEggs: ["nutegg/ai_ml.md"],
      eggResults: [], newKnowledge: [],
    },
  };
}

async function main() {
  mkdir("nutegg");

  const db = new NutEggDatabase(plugin as any);
  await db.init();
  console.log("available:", db.available);
  console.log("db file exists:", exists("nutegg/.nutegg.db"));

  // --- Versioned captures: same URL captured twice → two rows ---
  const id1 = db.insertNut(capture("Original content about attention.", "2026-08-14T10:00:00Z"));
  const id2 = db.insertNut(capture("Updated content about attention and MLX.", "2026-08-15T09:00:00Z"));
  console.log("insert ids:", id1, id2, "(expect 1 2)");

  const history = db.getNutHistory("https://example.com/video");
  console.log("history count:", history.length, "(expect 2)");
  console.log("newest first:", history[0].id === id2 && history[1].id === id1 ? "OK" : "WRONG");
  console.log("latest by url:", db.getNutByUrl("https://example.com/video")?.id, "(expect", id2, ")");
  console.log("by id:", db.getNutById(id1 ?? 0)?.processingResult, "(expect analyzed)");

  // --- updateNut (confirm flow) touches only the targeted capture ---
  db.updateNut(id2 ?? 0, { processingResult: "saved", fileName: "nutegg/_raw/x.md" });
  const updated = db.getNutById(id2 ?? 0);
  console.log("updated state:", updated?.processingResult, "| file:", updated?.fileName, "(expect saved)");
  console.log("older capture untouched:", db.getNutById(id1 ?? 0)?.processingResult, "(expect analyzed)");

  // --- Stats count every capture ---
  const stats = db.getStats();
  console.log("stats:", stats.nuts, "nuts |", stats.timeSavedMinutes, "min (expect 2 | 36)");

  // --- BM25 search ---
  const hits = db.search("transformers attention");
  console.log("search hits:", hits.length, "| top:", hits[0]?.title);
  const miss = db.search("quantum chromodynamics");
  console.log("search miss:", miss.length);

  db.close();
  console.log("✅ All checks done");
}

main().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
