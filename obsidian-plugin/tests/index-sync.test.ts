import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { IndexSync, isEggPath, matchesEggFormat } from "../src/index-sync";
import { IndexReader } from "../src/index-reader";
import { EggParser } from "../src/egg-parser";
import { makeFakePlugin, makeFakeVault } from "./helpers";

function makeSync(files: Record<string, string>, overrides: any = {}) {
  const store = makeFakeVault(files);
  const plugin = makeFakePlugin({ vault: store.vault, ...overrides });
  plugin.indexReader = overrides.indexReader || new IndexReader(plugin as any);
  plugin.eggParser = overrides.eggParser || new EggParser(plugin as any);
  if (overrides.aiProcessor) plugin.aiProcessor = overrides.aiProcessor;
  return { sync: new IndexSync(plugin as any), files: store.files, plugin };
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
  it("does not auto-append unindexed egg files or workflow files to _index.md", async () => {
    const { sync, files } = makeSync({
      "nutegg/_index.md": INDEX,
      "nutegg/investment.md": egg("Investment"),
      "nutegg/ai_ml.md": egg("AI/ML"),
      "nutegg/psychology.md": egg("Psychology"),
      "nutegg/_workflow/custom-prompt.md": "custom prompt",
    });
    const result = await sync.checkAndFix();
    assert.deepEqual(result.addedIndexEntries, []);
    assert.deepEqual(result.createdEggs, []);
    assert.deepEqual(result.prunedIndexEntries, []);
    // _index.md is not modified to include psychology or workflow prompt
    assert.ok(!files.get("nutegg/_index.md")!.includes("psychology.md"));
    assert.ok(!files.get("nutegg/_index.md")!.includes("custom-prompt.md"));
    // Existing entries untouched
    assert.ok(
      files.get("nutegg/_index.md")!.includes(
        "* nutegg/investment.md: investment strategies"
      )
    );
  });

  it("prunes invalid entries (workflow, raw, subdirectories, system files) from _index.md", async () => {
    const invalidIndex = [
      "# NutEgg Egg Index",
      "",
      "* nutegg/investment.md: investment strategies",
      "* nutegg/_workflow/custom.md: custom prompt",
      "* nutegg/_raw/raw.md: raw nut capture",
      "* nutegg/sub/deep.md: nested egg",
      "* nutegg/_index.md: index itself",
      "* nutegg/ai_ml.md: artificial intelligence",
      "",
    ].join("\n");

    const { sync, files } = makeSync({
      "nutegg/_index.md": invalidIndex,
      "nutegg/investment.md": egg("Investment"),
      "nutegg/ai_ml.md": egg("AI/ML"),
    });

    const result = await sync.checkAndFix();
    assert.deepEqual(result.prunedIndexEntries, [
      "nutegg/_workflow/custom.md",
      "nutegg/_raw/raw.md",
      "nutegg/sub/deep.md",
      "nutegg/_index.md",
    ]);

    const updatedIndex = files.get("nutegg/_index.md")!;
    assert.ok(updatedIndex.includes("* nutegg/investment.md: investment strategies"));
    assert.ok(updatedIndex.includes("* nutegg/ai_ml.md: artificial intelligence"));
    assert.ok(!updatedIndex.includes("_workflow"));
    assert.ok(!updatedIndex.includes("_raw"));
    assert.ok(!updatedIndex.includes("sub/deep"));
    assert.ok(!updatedIndex.includes("* nutegg/_index.md"));
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
      prunedIndexEntries: [],
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
      language: "English",
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

  it("createEgg supports Unicode Chinese name and description", async () => {
    const { sync, files } = makeSync({
      "nutegg/_index.md": "",
    });
    const result = await sync.createEgg("方法论", "介绍做事的具体方法");
    assert.deepEqual(result, {
      path: "nutegg/方法论.md",
      alreadyExists: false,
      language: "English",
    });
    const created = files.get("nutegg/方法论.md")!;
    assert.ok(created.includes('topic: "介绍做事的具体方法"'));
    assert.ok(created.includes("> **Scope:** 介绍做事的具体方法"));
    assert.ok(created.includes('language: "English"'));
    assert.ok(
      files.get("nutegg/_index.md")!.includes("* nutegg/方法论.md: 介绍做事的具体方法")
    );
  });

  it("createEgg uses localizeEggTemplate when available", async () => {
    let calledWith: any = null;
    const { sync, files } = makeSync(
      { "nutegg/_index.md": "" },
      {
        aiProcessor: {
          localizeEggTemplate: async (tpl: string, desc: string) => {
            calledWith = [tpl, desc];
            return tpl.replace("> **Scope:**", "> **Scope:** Localized");
          },
        } as any,
      }
    );
    const result = await sync.createEgg("ai_egg", "artificial intelligence");
    assert.ok(calledWith);
    assert.equal(calledWith[1], "artificial intelligence");
    assert.ok(calledWith[0].includes("artificial intelligence"));
    const created = files.get("nutegg/ai_egg.md")!;
    assert.ok(created.includes("Localized"));
    assert.ok(created.includes("# Knowledge"));
    assert.equal(result.language, "English");
  });

  it("createEgg captures language from localized egg output", async () => {
    const { sync, files } = makeSync(
      { "nutegg/_index.md": "" },
      {
        aiProcessor: {
          localizeEggTemplate: async (tpl: string) => {
            return {
              content: tpl
                .replace('language: "English"', 'language: "Chinese"')
                .replace("> **Scope:**", "> **Scope:** Localized Scope"),
              language: "Chinese",
            };
          },
        } as any,
      }
    );
    const result = await sync.createEgg("zh_egg", "介绍做事的具体方法");
    assert.equal(result.language, "Chinese");
    const created = files.get("nutegg/zh_egg.md")!;
    assert.ok(created.includes('language: "Chinese"'));
  });

  it("does nothing when _index.md is missing", async () => {
    const { sync, files } = makeSync({ "nutegg/eg.md": egg("EG") });
    const result = await sync.checkAndFix();
    assert.deepEqual(result, {
      addedIndexEntries: [],
      fixedIndexPaths: [],
      createdEggs: [],
      prunedIndexEntries: [],
    });
    assert.deepEqual([...files.keys()], ["nutegg/eg.md"]);
  });
});

describe("isEggPath", () => {
  it("allows valid direct egg files under nutegg/", () => {
    assert.equal(isEggPath("nutegg/investment.md"), true);
    assert.equal(isEggPath("nutegg/ai_ml.md"), true);
    assert.equal(isEggPath("nutegg/my-egg.md"), true);
  });

  it("rejects system files and directories", () => {
    assert.equal(isEggPath("nutegg/_index.md"), false);
    assert.equal(isEggPath("nutegg/_template.md"), false);
    assert.equal(isEggPath("nutegg/_workflow/content-analysis.md"), false);
    assert.equal(isEggPath("nutegg/_raw/article.md"), false);
    assert.equal(isEggPath("nutegg/_backup/old.md"), false);
  });

  it("rejects subdirectories (only direct files under nutegg/ are eggs)", () => {
    assert.equal(isEggPath("nutegg/tech/react.md"), false);
    assert.equal(isEggPath("nutegg/sub/nested.md"), false);
  });

  it("rejects non-markdown files and files outside vault folder", () => {
    assert.equal(isEggPath("nutegg/data.json"), false);
    assert.equal(isEggPath("outside/investment.md"), false);
    assert.equal(isEggPath("investment.md"), false);
  });
});

describe("matchesEggFormat", () => {
  it("matches egg frontmatter with topic", () => {
    assert.equal(
      matchesEggFormat('---\ntopic: "AI Research"\nstatus: "active"\n---\n# Content'),
      true
    );
  });

  it("matches canonical egg headings and callouts", () => {
    assert.equal(matchesEggFormat("# Knowledge\n- Some point"), true);
    assert.equal(matchesEggFormat("# Unprocessed\n- Some entry"), true);
    assert.equal(matchesEggFormat("> [!abstract]- Instructions:"), true);
  });

  it("rejects regular non-egg markdown notes", () => {
    assert.equal(matchesEggFormat("# Shopping List\n- Milk\n- Bread"), false);
    assert.equal(matchesEggFormat("Just a plain note without egg structure"), false);
    assert.equal(matchesEggFormat(""), false);
  });
});

describe("IndexSync diffs & event-driven operations", () => {
  it("computes getDiffStatus accurately", async () => {
    const { sync } = makeSync({
      "nutegg/_index.md": [
        "# Index",
        "* nutegg/investment.md: investment",
        "* nutegg/missing.md: missing egg file",
        "* nutegg/_workflow/prompt.md: invalid entry",
      ].join("\n"),
      "nutegg/investment.md": egg("Investment"),
      "nutegg/unindexed.md": egg("Unindexed"),
    });

    const status = await sync.getDiffStatus();
    assert.equal(status.totalDiffs, 3);
    assert.deepEqual(status.missingEggs, ["nutegg/missing.md"]);
    assert.deepEqual(status.unindexedEggs, ["nutegg/unindexed.md"]);
    assert.deepEqual(status.invalidEntries, ["nutegg/_workflow/prompt.md"]);
  });

  it("sync() resolves all diffs and reports 0 diffs afterwards", async () => {
    const { sync, files } = makeSync({
      "nutegg/_index.md": [
        "# Index",
        "* nutegg/investment.md: investment",
        "* nutegg/missing.md: missing egg file",
        "* nutegg/_workflow/prompt.md: invalid entry",
      ].join("\n"),
      "nutegg/investment.md": egg("Investment"),
      "nutegg/unindexed.md": egg("Unindexed Topic"),
    });

    const res = await sync.sync();
    assert.deepEqual(res.createdEggs, ["nutegg/missing.md"]);
    assert.deepEqual(res.addedIndexEntries, ["nutegg/unindexed.md"]);
    assert.deepEqual(res.prunedIndexEntries, ["nutegg/_workflow/prompt.md"]);

    const indexText = files.get("nutegg/_index.md")!;
    assert.ok(indexText.includes("* nutegg/investment.md"));
    assert.ok(indexText.includes("* nutegg/missing.md"));
    assert.ok(indexText.includes("* nutegg/unindexed.md"));
    assert.ok(!indexText.includes("_workflow"));

    const statusAfter = await sync.getDiffStatus();
    assert.equal(statusAfter.totalDiffs, 0);
  });

  it("onEggFileDeleted removes the entry from _index.md", async () => {
    const { sync, files } = makeSync({
      "nutegg/_index.md": [
        "# Index",
        "* nutegg/investment.md: investment",
        "* nutegg/ai_ml.md: artificial intelligence",
      ].join("\n"),
      "nutegg/investment.md": egg("Investment"),
      "nutegg/ai_ml.md": egg("AI/ML"),
    });

    await sync.onEggFileDeleted("nutegg/ai_ml.md");
    const indexText = files.get("nutegg/_index.md")!;
    assert.ok(indexText.includes("investment.md"));
    assert.ok(!indexText.includes("ai_ml.md"));
  });

  it("onEggFileCreated does not auto-edit _index.md", async () => {
    let notified = false;
    const { sync, files } = makeSync({
      "nutegg/_index.md": "* nutegg/investment.md: investment\n",
      "nutegg/investment.md": egg("Investment"),
      "nutegg/crypto.md": egg("Cryptocurrency"),
      "nutegg/groceries.md": "# Groceries\n- apples",
    });
    sync.onDiffChanged(() => {
      notified = true;
    });

    // File matching egg format does not auto-edit _index.md
    await sync.onEggFileCreated({ path: "nutegg/crypto.md" });
    assert.equal(files.get("nutegg/_index.md"), "* nutegg/investment.md: investment\n");
    assert.equal(notified, true);
  });

  it("onEggFileRenamed updates path in _index.md", async () => {
    const { sync, files } = makeSync({
      "nutegg/_index.md": "* nutegg/old_name.md: my topic\n",
      "nutegg/new_name.md": egg("my topic"),
    });

    await sync.onEggFileRenamed("nutegg/old_name.md", "nutegg/new_name.md");
    const indexText = files.get("nutegg/_index.md")!;
    assert.ok(indexText.includes("* nutegg/new_name.md: my topic"));
    assert.ok(!indexText.includes("old_name.md"));
  });

  it("onDirectIndexEdit does not auto-create template until sync is triggered", async () => {
    let diffNotified = false;
    const { sync, files } = makeSync({
      "nutegg/_index.md": "* nutegg/new_topic.md: brand new subject\n",
    });
    sync.onDiffChanged(() => {
      diffNotified = true;
    });

    await sync.onDirectIndexEdit();
    // Direct edit should NOT auto-create the egg file
    assert.equal(files.has("nutegg/new_topic.md"), false);
    assert.equal(diffNotified, true);

    // Clicking sync triggers the creation
    const syncRes = await sync.sync();
    assert.ok(syncRes.createdEggs.includes("nutegg/new_topic.md"));
    assert.ok(files.has("nutegg/new_topic.md"));
    const created = files.get("nutegg/new_topic.md")!;
    assert.ok(created.includes('topic: "brand new subject"'));
  });

  it("sync creates localized egg file when index description is provided and AI is available", async () => {
    const { sync, files } = makeSync(
      {
        "nutegg/_index.md": "* nutegg/china_history.md: 中国古代史与朝代演变\n",
      },
      {
        aiProcessor: {
          localizeEggTemplate: async (tpl: string) => {
            return {
              content: tpl
                .replace('language: "English"', 'language: "Chinese"')
                .replace("> **Scope:**", "> **Scope:** localized"),
              language: "Chinese",
            };
          },
        } as any,
      }
    );
    await sync.sync();
    assert.ok(files.has("nutegg/china_history.md"));
    const created = files.get("nutegg/china_history.md")!;
    assert.ok(created.includes('language: "Chinese"'));
    assert.ok(created.includes("> **Scope:** localized"));
  });
});
