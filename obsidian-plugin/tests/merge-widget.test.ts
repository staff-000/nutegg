import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { findInstructionTargetLine, findUnprocessedLine, runMerge } from "../src/merge-widget";
import { makeFakePlugin, makeFakeVault } from "./helpers";
import { EggParser } from "../src/egg-parser";

describe("merge-widget.findInstructionTargetLine", () => {
  it("finds the end line of a callout block with instructions", () => {
    const doc = [
      "---",
      "topic: x",
      "---",
      "",
      "> [!abstract]- Instructions:",
      "> **Scope:** ...",
      "> **Action Guide:** ...",
      "",
      "# Knowledge",
      "",
      "# Unprocessed",
    ].join("\n");
    assert.equal(findInstructionTargetLine(doc), 7);
  });

  it("finds the # Instructions heading line", () => {
    const doc = ["---", "topic: x", "---", "", "# Instructions", "", "# Knowledge"].join("\n");
    assert.equal(findInstructionTargetLine(doc), 5);
  });

  it("falls back to # Unprocessed when no instructions block is found", () => {
    assert.equal(findInstructionTargetLine("---\ntopic: x\n---\n\n# Knowledge\n\n# Unprocessed\n\n- entry\n"), 7);
  });

  it("tolerates extra spacing and case", () => {
    assert.equal(findInstructionTargetLine("#  INSTRUCTIONS  "), 1);
    assert.equal(findInstructionTargetLine("a\n\n# unprocessed\n"), 3);
  });

  it("returns null for completely empty or unrelated files", () => {
    assert.equal(findInstructionTargetLine(""), null);
    assert.equal(findInstructionTargetLine("Just plain text without headers"), null);
  });
});

describe("merge-widget.runMerge", () => {
  function makeRunner(overrides: any = {}) {
    const { files, vault } = makeFakeVault(overrides.files || { "nutegg/egg.md": "disk content" });
    let modifies: string[] = [];
    const spiedVault = {
      ...vault,
      modify: async (file: { path: string }, content: string) => {
        modifies.push(file.path);
        await vault.modify(file, content);
      },
    };
    let mergedPath: string | null = null;
    const plugin = makeFakePlugin({
      vault: spiedVault,
      aiProcessor: {
        mergeEgg: async (p: string) => {
          mergedPath = p;
          return { egg: p, entries: 3 };
        },
      },
    });
    plugin.eggParser = new EggParser(plugin as any);
    return { plugin, files, modifies: () => modifies, mergedPath: () => mergedPath };
  }

  it("persists unsaved editor changes before merging", async () => {
    const { plugin, files, modifies, mergedPath } = makeRunner();
    const result = await runMerge(plugin as any, "nutegg/egg.md", "edited buffer");
    assert.deepEqual(modifies(), ["nutegg/egg.md"]);
    assert.equal(files.get("nutegg/egg.md"), "edited buffer");
    assert.equal(mergedPath(), "nutegg/egg.md");
    assert.deepEqual(result, { egg: "nutegg/egg.md", entries: 3 });
  });

  it("skips the save when the buffer matches the disk content", async () => {
    const { plugin, files, modifies, mergedPath } = makeRunner();
    const result = await runMerge(plugin as any, "nutegg/egg.md", "disk content");
    assert.deepEqual(modifies(), []);
    assert.equal(files.get("nutegg/egg.md"), "disk content");
    assert.equal(mergedPath(), "nutegg/egg.md");
    assert.deepEqual(result, { egg: "nutegg/egg.md", entries: 3 });
  });

  it("merges without touching the file when there is no editor buffer (reading mode)", async () => {
    const { plugin, files, modifies, mergedPath } = makeRunner();
    const result = await runMerge(plugin as any, "nutegg/egg.md", null);
    assert.deepEqual(modifies(), []);
    assert.equal(files.get("nutegg/egg.md"), "disk content");
    assert.equal(mergedPath(), "nutegg/egg.md");
    assert.deepEqual(result, { egg: "nutegg/egg.md", entries: 3 });
  });

  it("skips the save and does not throw when the egg file is missing", async () => {
    const { plugin, modifies, mergedPath } = makeRunner({ files: {} });
    await runMerge(plugin as any, "nutegg/missing.md", "buffer");
    assert.deepEqual(modifies(), []); // no file to read, nothing written
    assert.equal(mergedPath(), "nutegg/missing.md"); // the merge still runs
  });

  it("never saves or merges a note outside the egg folder, even if it has egg headings", async () => {
    const { plugin, files, modifies, mergedPath } = makeRunner({ files: { "outside/egg.md": "# Unprocessed\n- private" } });
    assert.equal(await runMerge(plugin as any, "outside/egg.md", "editor buffer"), null);
    assert.equal(await runMerge(plugin as any, "outside/egg.md", null), null);
    assert.equal(files.get("outside/egg.md"), "# Unprocessed\n- private");
    assert.deepEqual(modifies(), []);
    assert.equal(mergedPath(), null);
  });
});
