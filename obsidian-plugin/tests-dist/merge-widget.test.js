"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// tests/merge-widget.test.ts
var import_node_test = require("node:test");
var import_strict = __toESM(require("node:assert/strict"));

// src/merge-widget.ts
var import_view = require("@codemirror/view");
function findUnprocessedLine(docText) {
  const lines = docText.split("\n");
  const idx = lines.findIndex((l) => /^#\s*Unprocessed\s*$/i.test(l.trim()));
  return idx === -1 ? null : idx + 1;
}
async function runMerge(plugin, filePath, currentDoc) {
  if (currentDoc !== null) {
    const file = plugin.app.vault.getAbstractFileByPath(filePath);
    if (file) {
      const disk = await plugin.app.vault.read(file);
      if (disk !== currentDoc) {
        await plugin.app.vault.modify(file, currentDoc);
        console.log(`[NutEgg] Saved unsaved edits in ${filePath} before merge`);
      }
    }
  }
  return plugin.aiProcessor.mergeEgg(filePath);
}

// tests/helpers.ts
function makeFakeVault(initial = {}) {
  const files = new Map(Object.entries(initial));
  const basePath = "/fake/vault";
  const adapter = {
    exists: async (p) => files.has(p) || [...files.keys()].some((k) => k.startsWith(p + "/")),
    read: async (p) => {
      if (!files.has(p))
        throw new Error("File not found: " + p);
      return files.get(p);
    },
    remove: async (p) => {
      files.delete(p);
    },
    append: async (p, data) => {
      files.set(p, (files.get(p) ?? "") + data);
    },
    getBasePath: () => basePath
  };
  const vault = {
    adapter,
    create: async (p, content) => {
      files.set(p, content);
    },
    createFolder: async (_p) => {
    },
    modify: async (file, content) => {
      files.set(file.path, content);
    },
    read: async (file) => {
      if (!files.has(file.path))
        throw new Error("File not found: " + file.path);
      return files.get(file.path);
    },
    getAbstractFileByPath: (p) => files.has(p) ? { path: p } : null,
    getMarkdownFiles: () => [...files.keys()].filter((k) => k.endsWith(".md")).map((p) => ({ path: p }))
  };
  return { files, basePath, vault };
}
function makeFakePlugin(overrides = {}) {
  const { vault } = makeFakeVault(overrides.vaultFiles || {});
  return {
    settings: {
      aiApiKey: "test-key",
      rawFolder: "nutegg/_raw",
      indexFile: "nutegg/_index.md",
      serverPort: 27123,
      ...overrides.settings || {}
    },
    app: { vault: overrides.vault ?? vault },
    aiClient: overrides.aiClient ?? { chat: async () => "{}" },
    eggParser: overrides.eggParser ?? {
      formatEggForPrompt: (e) => `egg:${e.fileName}`
    },
    indexReader: overrides.indexReader ?? {},
    knowledgeBase: overrides.knowledgeBase ?? {},
    db: overrides.db ?? null,
    ...overrides
  };
}

// tests/merge-widget.test.ts
(0, import_node_test.describe)("merge-widget.findUnprocessedLine", () => {
  (0, import_node_test.it)("finds the h1 # Unprocessed heading (1-based line)", () => {
    import_strict.default.equal(findUnprocessedLine("---\ntopic: x\n---\n\n# Knowledge\n\n# Unprocessed\n\n- entry\n"), 7);
  });
  (0, import_node_test.it)("tolerates extra spacing and case", () => {
    import_strict.default.equal(findUnprocessedLine("#  UNPROCESSED  "), 1);
    import_strict.default.equal(findUnprocessedLine("a\n\n# unprocessed\n"), 3);
  });
  (0, import_node_test.it)("does not match other heading levels or names", () => {
    import_strict.default.equal(findUnprocessedLine("## Unprocessed\n"), null);
    import_strict.default.equal(findUnprocessedLine("# Knowledge\n\n- entry\n"), null);
    import_strict.default.equal(findUnprocessedLine(""), null);
  });
});
(0, import_node_test.describe)("merge-widget.runMerge", () => {
  function makeRunner(overrides = {}) {
    const { files, vault } = makeFakeVault(overrides.files || { "egg.md": "disk content" });
    let modifies = [];
    const spiedVault = {
      ...vault,
      modify: async (file, content) => {
        modifies.push(file.path);
        await vault.modify(file, content);
      }
    };
    let mergedPath = null;
    const plugin = makeFakePlugin({
      vault: spiedVault,
      aiProcessor: {
        mergeEgg: async (p) => {
          mergedPath = p;
          return { egg: p, entries: 3 };
        }
      }
    });
    return { plugin, files, modifies: () => modifies, mergedPath: () => mergedPath };
  }
  (0, import_node_test.it)("persists unsaved editor changes before merging", async () => {
    const { plugin, files, modifies, mergedPath } = makeRunner();
    const result = await runMerge(plugin, "egg.md", "edited buffer");
    import_strict.default.deepEqual(modifies(), ["egg.md"]);
    import_strict.default.equal(files.get("egg.md"), "edited buffer");
    import_strict.default.equal(mergedPath(), "egg.md");
    import_strict.default.deepEqual(result, { egg: "egg.md", entries: 3 });
  });
  (0, import_node_test.it)("skips the save when the buffer matches the disk content", async () => {
    const { plugin, files, modifies, mergedPath } = makeRunner();
    const result = await runMerge(plugin, "egg.md", "disk content");
    import_strict.default.deepEqual(modifies(), []);
    import_strict.default.equal(files.get("egg.md"), "disk content");
    import_strict.default.equal(mergedPath(), "egg.md");
    import_strict.default.deepEqual(result, { egg: "egg.md", entries: 3 });
  });
  (0, import_node_test.it)("merges without touching the file when there is no editor buffer (reading mode)", async () => {
    const { plugin, files, modifies, mergedPath } = makeRunner();
    const result = await runMerge(plugin, "egg.md", null);
    import_strict.default.deepEqual(modifies(), []);
    import_strict.default.equal(files.get("egg.md"), "disk content");
    import_strict.default.equal(mergedPath(), "egg.md");
    import_strict.default.deepEqual(result, { egg: "egg.md", entries: 3 });
  });
  (0, import_node_test.it)("skips the save and does not throw when the egg file is missing", async () => {
    const { plugin, modifies, mergedPath } = makeRunner({ files: {} });
    await runMerge(plugin, "missing.md", "buffer");
    import_strict.default.deepEqual(modifies(), []);
    import_strict.default.equal(mergedPath(), "missing.md");
  });
});
