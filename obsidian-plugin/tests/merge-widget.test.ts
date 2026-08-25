import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { findUnprocessedLine, runMerge } from "../src/merge-widget";
import { makeFakePlugin, makeFakeVault } from "./helpers";

describe("merge-widget.findUnprocessedLine", () => {
  it("finds the h1 # Unprocessed heading (1-based line)", () => {
    assert.equal(findUnprocessedLine("---\ntopic: x\n---\n\n# Knowledge\n\n# Unprocessed\n\n- entry\n"), 7);
  });

  it("tolerates extra spacing and case", () => {
    assert.equal(findUnprocessedLine("#  UNPROCESSED  "), 1);
    assert.equal(findUnprocessedLine("a\n\n# unprocessed\n"), 3);
  });

  it("does not match other heading levels or names", () => {
    assert.equal(findUnprocessedLine("## Unprocessed\n"), null);
    assert.equal(findUnprocessedLine("# Knowledge\n\n- entry\n"), null);
    assert.equal(findUnprocessedLine(""), null);
  });
});

describe("merge-widget.runMerge", () => {
  function makeRunner(overrides: any = {}) {
    const { files, vault } = makeFakeVault(overrides.files || { "egg.md": "disk content" });
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
    return { plugin, files, modifies: () => modifies, mergedPath: () => mergedPath };
  }

  it("persists unsaved editor changes before merging", async () => {
    const { plugin, files, modifies, mergedPath } = makeRunner();
    const result = await runMerge(plugin as any, "egg.md", "edited buffer");
    assert.deepEqual(modifies(), ["egg.md"]);
    assert.equal(files.get("egg.md"), "edited buffer");
    assert.equal(mergedPath(), "egg.md");
    assert.deepEqual(result, { egg: "egg.md", entries: 3 });
  });

  it("skips the save when the buffer matches the disk content", async () => {
    const { plugin, files, modifies, mergedPath } = makeRunner();
    const result = await runMerge(plugin as any, "egg.md", "disk content");
    assert.deepEqual(modifies(), []);
    assert.equal(files.get("egg.md"), "disk content");
    assert.equal(mergedPath(), "egg.md");
    assert.deepEqual(result, { egg: "egg.md", entries: 3 });
  });

  it("merges without touching the file when there is no editor buffer (reading mode)", async () => {
    const { plugin, files, modifies, mergedPath } = makeRunner();
    const result = await runMerge(plugin as any, "egg.md", null);
    assert.deepEqual(modifies(), []);
    assert.equal(files.get("egg.md"), "disk content");
    assert.equal(mergedPath(), "egg.md");
    assert.deepEqual(result, { egg: "egg.md", entries: 3 });
  });

  it("skips the save and does not throw when the egg file is missing", async () => {
    const { plugin, modifies, mergedPath } = makeRunner({ files: {} });
    await runMerge(plugin as any, "missing.md", "buffer");
    assert.deepEqual(modifies(), []); // no file to read, nothing written
    assert.equal(mergedPath(), "missing.md"); // the merge still runs
  });
});
