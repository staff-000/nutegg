import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { IndexSync } from "../src/index-sync";
import { IndexReader } from "../src/index-reader";
import { EggParser } from "../src/egg-parser";
import { makeFakePlugin, makeFakeVault } from "./helpers";

function makeSync(files: Record<string, string>) {
  const store = makeFakeVault(files);
  const plugin = makeFakePlugin({ vault: store.vault });
  plugin.indexReader = new IndexReader(plugin as any);
  plugin.eggParser = new EggParser(plugin as any);
  return { sync: new IndexSync(plugin as any), files: store.files };
}

const INDEX = [
  "# NutEgg Egg Index",
  "",
  "* nutegg/investment.md: investment strategies",
  "* nutegg/ai_ml.md: artificial intelligence",
  "",
].join("\n");

function egg(topic: string): string {
  return [
    "---",
    `topic: "${topic}"`,
    'status: "active"',
    "---",
    "",
    "> [!abstract]- Instructions:",
    "> **Scope:** high-signal data",
    "",
    "# Knowledge",
    "",
    "# Unprocessed",
    "",
  ].join("\n");
}

describe("IndexSync.checkAndFix", () => {
  it("appends an index entry for an egg file that isn't indexed", async () => {
    const { sync, files } = makeSync({
      "nutegg/_index.md": INDEX,
      "nutegg/investment.md": egg("Investment"),
      "nutegg/psychology.md": egg("Psychology"),
    });
    const result = await sync.checkAndFix();
    assert.deepEqual(result.addedIndexEntries, ["nutegg/psychology.md"]);
    assert.ok(
      files.get("nutegg/_index.md")!.includes(
        "* nutegg/psychology.md: Psychology"
      )
    );
    // Existing entries untouched
    assert.ok(
      files.get("nutegg/_index.md")!.includes(
        "* nutegg/investment.md: investment strategies"
      )
    );
  });

  it("appends a bare entry (no description) for an egg without a topic", async () => {
    const { sync, files } = makeSync({
      "nutegg/_index.md": INDEX,
      "nutegg/investment.md": egg("Investment"),
      "nutegg/x.md": "# Knowledge\n",
    });
    await sync.checkAndFix();
    assert.ok(files.get("nutegg/_index.md")!.includes("* nutegg/x.md\n"));
  });

  it("creates a missing egg file from the index description", async () => {
    const { sync, files } = makeSync({
      "nutegg/_index.md": INDEX,
      "nutegg/ai_ml.md": egg("AI/ML"),
    });
    const result = await sync.checkAndFix();
    assert.deepEqual(result.createdEggs, ["nutegg/investment.md"]);
    const created = files.get("nutegg/investment.md")!;
    assert.ok(created.includes('topic: "investment strategies"'));
    assert.ok(created.includes("> **Scope:** investment strategies"));
    assert.ok(created.includes("# Knowledge"));
    assert.ok(created.includes("# Unprocessed"));
    assert.match(created, /last_updated: "\d{4}-\d{2}-\d{2}"/);
  });

  it("creates nested egg files (missing parent folder)", async () => {
    const { sync, files } = makeSync({
      "nutegg/_index.md": "* nutegg/sub/deep.md: deep topics\n",
    });
    await sync.checkAndFix();
    assert.ok(files.has("nutegg/sub/deep.md"));
    assert.ok(files.get("nutegg/sub/deep.md")!.includes('topic: "deep topics"'));
  });

  it("leaves a consistent vault untouched", async () => {
    const { sync, files } = makeSync({
      "nutegg/_index.md": INDEX,
      "nutegg/investment.md": egg("Investment"),
      "nutegg/ai_ml.md": egg("AI/ML"),
    });
    const before = { ...Object.fromEntries(files) };
    const result = await sync.checkAndFix();
    assert.deepEqual(result, {
      addedIndexEntries: [],
      fixedIndexPaths: [],
      createdEggs: [],
    });
    assert.deepEqual(Object.fromEntries(files), before);
  });

  it("upgrades relative index paths to the full vault path", async () => {
    const { sync, files } = makeSync({
      "nutegg/_index.md":
        "# index\n\n* investment.md: investment strategies\n",
      "nutegg/investment.md": egg("Investment"),
    });
    const result = await sync.checkAndFix();
    assert.deepEqual(result.fixedIndexPaths, ["nutegg/investment.md"]);
    assert.deepEqual(result.createdEggs, [], "no duplicate egg created");
    const index = files.get("nutegg/_index.md")!;
    assert.ok(index.includes("* nutegg/investment.md: investment strategies"));
    assert.ok(!index.includes("* investment.md"));
  });

  it("createEgg builds the file from the description and adds the index entry", async () => {
    const { sync, files } = makeSync({
      "nutegg/_index.md": "* nutegg/investment.md: investment strategies\n",
      "nutegg/investment.md": egg("Investment"),
    });
    const result = await sync.createEgg(
      "productivity",
      "productivity and systems"
    );
    assert.deepEqual(result, {
      path: "nutegg/productivity.md",
      alreadyExists: false,
    });
    const created = files.get("nutegg/productivity.md")!;
    assert.ok(created.includes('topic: "productivity and systems"'));
    assert.ok(created.includes("> **Scope:** productivity and systems"));
    assert.ok(
      files
        .get("nutegg/_index.md")!
        .includes("* nutegg/productivity.md: productivity and systems")
    );
  });

  it("createEgg reports alreadyExists without overwriting", async () => {
    const { sync, files } = makeSync({
      "nutegg/_index.md": "",
      "nutegg/productivity.md": egg("P"),
    });
    const result = await sync.createEgg("productivity", "x");
    assert.equal(result.alreadyExists, true);
    assert.ok(files.get("nutegg/productivity.md")!.includes('topic: "P"'));
  });

  it("does nothing when _index.md is missing", async () => {
    const { sync, files } = makeSync({ "nutegg/eg.md": egg("EG") });
    const result = await sync.checkAndFix();
    assert.deepEqual(result, {
      addedIndexEntries: [],
      fixedIndexPaths: [],
      createdEggs: [],
    });
    assert.deepEqual([...files.keys()], ["nutegg/eg.md"]);
  });
});
