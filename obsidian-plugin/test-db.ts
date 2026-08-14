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

async function main() {
  mkdir("nutegg");

  const db = new NutEggDatabase(plugin as any);
  await db.init();
  console.log("available:", db.available);
  console.log("db file exists:", exists("nutegg/.nutegg.db"));

  // --- Upsert + conflict update ---
  db.upsertNut({
    url: "https://example.com/video",
    title: "How transformers actually work",
    sourceType: "youtube",
    content: "Attention mechanisms and positional encodings explained with clear diagrams.",
    savedAt: "2026-08-14T10:00:00Z",
    publishedAt: "2026-08-10",
    author: "3Blue1Brown",
    timeEstimateMinutes: 18,
    processingResult: "saved",
    summary: "Clear explanation of attention.",
    matchedEggs: ["nutegg/ai_ml.md"],
    fileName: "nutegg/_raw/2026-08-14-youtube-test.md",
    analysisResult: {
      titleVerdict: "Yes — attention is weighted context lookup.",
      coreSummary: ["bullet"], isLongForm: false, chapterMap: [],
      shouldRead: true, shouldReadReason: "x", matchedEggs: ["nutegg/ai_ml.md"],
      eggResults: [], newKnowledge: [],
    },
  });
  // Re-save same URL (raw-only) → should update, not duplicate
  db.upsertNut({
    url: "https://example.com/video", title: "How transformers actually work",
    sourceType: "youtube", content: "Updated content.",
    savedAt: "2026-08-14T11:00:00Z", publishedAt: "", author: "",
    timeEstimateMinutes: 18, processingResult: "skip", summary: "",
    matchedEggs: [], fileName: "nutegg/_raw/2026-08-14-youtube-test-2.md",
    analysisResult: null,
  });
  const stats = db.getStats();
  console.log("stats:", stats.nuts, "nuts |", stats.timeSavedMinutes, "min (expect 1 | 18)");

  const replayed = db.getNutByUrl("https://example.com/video");
  console.log("re-save updated row:", replayed?.processingResult, "|", replayed?.savedAt.slice(11, 16));

  // --- BM25 search ---
  const hits = db.search("transformers attention");
  console.log("search hits:", hits.length, "| top:", hits[0]?.title, "| snippet:", hits[0]?.snippet);
  const miss = db.search("quantum chromodynamics");
  console.log("search miss:", miss.length);

  db.close();
  console.log("✅ All checks done");
}

main().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
