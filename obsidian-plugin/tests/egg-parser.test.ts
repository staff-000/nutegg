import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  EggParser,
  extractEggLanguage,
  insertEggLanguage,
  resolveEggPath,
} from "../src/egg-parser";
import { makeFakePlugin, makeFakeVault } from "./helpers";

const NEW_FORMAT_EGG = `---
topic: "Investment Strategy"
status: "active"
---

> [!abstract]- Instructions:
> **Scope:** High-signal financial data.
>
> **Action Guide:**
> 1. Title Verdict: One sentence.
> 2. Decide: should the user read this?
>
> **Key Questions:**
> 1. Is this a structural shift?
> 2. Is there new fundamental analysis?
>
> **Worth Reading If:**
> - Concrete evidence and tradeoffs.
>
> **Skip If:**
> - Reject price predictions.
> - Reject FOMO content.
>
> **Formatting Rules:**
> - Respect the existing knowledge tree.

# Knowledge

- Risk Management
  - tail hedging

# Unprocessed

- pending insight
  - 🎯 Example: a concrete case
_author: Jane Doe_
_source: [Source Title](https://e.com/p)_
`;

describe("EggParser.parseEggFile (new format)", () => {
  const parser = new EggParser(makeFakePlugin() as any);

  it("parses frontmatter topic and language", () => {
    const egg = parser.parseEggFile("inv.md", NEW_FORMAT_EGG);
    assert.equal(egg.topic, "Investment Strategy");
    assert.equal(egg.language, "");

    const withLang = parser.parseEggFile(
      "zh.md",
      `---\ntopic: "方法论"\nlanguage: "Chinese"\n---\n# Knowledge\n`
    );
    assert.equal(withLang.topic, "方法论");
    assert.equal(withLang.language, "Chinese");
  });

  it("parses scope, action guide, and formatting rules", () => {
    const egg = parser.parseEggFile("inv.md", NEW_FORMAT_EGG);
    assert.equal(egg.scope, "High-signal financial data.");
    assert.ok(egg.actionGuide.includes("Title Verdict"));
    assert.ok(egg.formattingRules.includes("knowledge tree"));
  });

  it("parses key questions as a list", () => {
    const egg = parser.parseEggFile("inv.md", NEW_FORMAT_EGG);
    assert.deepEqual(egg.keyQuestions, [
      "Is this a structural shift?",
      "Is there new fundamental analysis?",
    ]);
  });

  it("parses Worth Reading If without using legacy rejection criteria", () => {
    const egg = parser.parseEggFile("inv.md", NEW_FORMAT_EGG);
    assert.deepEqual(egg.worthReadingIf, ["Concrete evidence and tradeoffs."]);
    const legacy = parser.parseEggFile("old.md", "> **Rejection Criteria:**\n> - Old filter.\n\n# Knowledge\n");
    assert.deepEqual(legacy.skipIf, []);
  });

  it("parses Skip If as a list", () => {
    const egg = parser.parseEggFile("inv.md", NEW_FORMAT_EGG);
    assert.deepEqual(egg.skipIf, [
      "Reject price predictions.",
      "Reject FOMO content.",
    ]);
  });

  it("extracts the Knowledge section content (stops at # Unprocessed)", () => {
    const egg = parser.parseEggFile("inv.md", NEW_FORMAT_EGG);
    assert.equal(egg.knowledge, "- Risk Management\n  - tail hedging");
  });

  it("extracts the Unprocessed section content", () => {
    const egg = parser.parseEggFile("inv.md", NEW_FORMAT_EGG);
    assert.ok(egg.unprocessed.includes("- pending insight"));
    assert.ok(egg.unprocessed.includes("_author: Jane Doe_"));
    assert.ok(egg.unprocessed.includes("_source: [Source Title](https://e.com/p)_"));
    assert.ok(!egg.unprocessed.includes("tail hedging"));
  });

  it("defaults topic to Unknown when frontmatter is missing", () => {
    const egg = parser.parseEggFile("x.md", "# Knowledge\n\n- stuff\n");
    assert.equal(egg.topic, "Unknown");
    assert.equal(egg.knowledge, "- stuff");
  });

  it("parses `**Label:**` with inline content on the same line", () => {
    const content = "> [!abstract]- Instructions:\n> **Scope:** Inline scope text.\n> **Key Questions:**\n> 1. Q1\n";
    const egg = parser.parseEggFile("x.md", content);
    assert.equal(egg.scope, "Inline scope text.");
    assert.deepEqual(egg.keyQuestions, ["Q1"]);
  });
});

describe("EggParser.formatEggForPrompt", () => {
  const parser = new EggParser(makeFakePlugin() as any);

  it("includes instructions without existing knowledge", () => {
    const egg = parser.parseEggFile("inv.md", NEW_FORMAT_EGG);
    const out = parser.formatEggForPrompt(egg);
    assert.ok(out.includes("**Scope:** High-signal financial data."));
    assert.ok(out.includes("- Is this a structural shift?"));
    assert.ok(out.includes("- Reject price predictions."));
    assert.ok(out.includes("- Respect the existing knowledge tree."));
    assert.ok(!out.includes("**Current Knowledge:**"));
  });

  it("excludes Unprocessed from extraction prompts", () => {
    const egg = parser.parseEggFile("inv.md", NEW_FORMAT_EGG);
    const out = parser.formatEggForPrompt(egg);
    assert.ok(!out.includes("**Unprocessed"));
    assert.ok(!out.includes("- pending insight"));
  });

  it("marks empty knowledge as (empty)", () => {
    const egg = parser.parseEggFile("x.md", "# Knowledge\n");
    assert.ok(!parser.formatEggForPrompt(egg).includes("Current Knowledge"));
  });

  it("works when formatEggForPrompt is invoked as a detached function reference", () => {
    const egg = parser.parseEggFile("inv.md", NEW_FORMAT_EGG);
    const detached = parser.formatEggForPrompt;
    const out = detached(egg);
    assert.ok(out.includes("**Scope:** High-signal financial data."));
  });
});

describe("EggParser.appendUnprocessed", () => {
  const baseEgg = [
    "---",
    "topic: X",
    "---",
    "",
    "> [!abstract]- Instructions:",
    "> **Scope:** s",
    "",
    "# Knowledge",
    "",
    "- existing knowledge",
    "",
    "# Unprocessed",
  ].join("\n");

  async function append(
    files: Record<string, string>,
    content: string,
    author = "Jane Doe",
    title = "Post",
    url = "https://example.com/post"
  ) {
    const store = makeFakeVault(files);
    const fake = makeFakePlugin({ vault: store.vault });
    const parser = new EggParser(fake as any);
    await parser.appendUnprocessed("egg.md", content, author, title, url);
    return store;
  }

  it("appends the entry with author and source to # Unprocessed", async () => {
    const store = await append(
      { "nutegg/egg.md": baseEgg },
      "- insight\n  - 🎯 Example: case"
    );
    const out = store.files.get("nutegg/egg.md")!;
    assert.ok(out.includes("# Unprocessed\n\n- insight"));
    assert.ok(out.includes("  - 🎯 Example: case"));
    assert.ok(out.includes("_author: Jane Doe_"));
    assert.ok(out.includes("_source: [Post](https://example.com/post)_"));
  });

  it("does not touch the Knowledge tree", async () => {
    const store = await append({ "nutegg/egg.md": baseEgg }, "- insight");
    const out = store.files.get("nutegg/egg.md")!;
    const knowledge = out.split("# Unprocessed")[0];
    assert.ok(knowledge.includes("- existing knowledge"));
    assert.ok(!knowledge.includes("- insight"));
  });

  it("prefixes a bullet when the content has none", async () => {
    const store = await append({ "nutegg/egg.md": baseEgg }, "bare insight text");
    assert.ok(store.files.get("nutegg/egg.md")!.includes("- bare insight text"));
  });

  it("omits the _author line when the author is unknown", async () => {
    const store = await append({ "nutegg/egg.md": baseEgg }, "- insight", "");
    const out = store.files.get("nutegg/egg.md")!;
    assert.ok(!out.includes("_author:"));
    assert.ok(out.includes("_source: [Post](https://example.com/post)_"));
  });

  it("separates consecutive entries with a blank line", async () => {
    const store = makeFakeVault({ "nutegg/egg.md": baseEgg });
    const fake = makeFakePlugin({ vault: store.vault });
    const parser = new EggParser(fake as any);
    await parser.appendUnprocessed(
      "egg.md", "- first", "Jane Doe", "Post", "https://example.com/post"
    );
    await parser.appendUnprocessed(
      "egg.md", "- second", "Jane Doe", "Post", "https://example.com/post"
    );
    const out = store.files.get("nutegg/egg.md")!;
    assert.ok(
      /_source: \[Post\]\(https:\/\/example\.com\/post\)_\n\n- second/.test(out)
    );
  });

  it("creates the Unprocessed section when the egg has none", async () => {
    const store = await append(
      { "nutegg/egg.md": "# Knowledge\n\n- tree\n" },
      "- first"
    );
    const out = store.files.get("nutegg/egg.md")!;
    assert.ok(out.includes("# Unprocessed"));
    assert.ok(out.includes("- first"));
    assert.ok(out.includes("# Knowledge\n\n- tree\n\n# Unprocessed"));
  });

  it("sanitizes link brackets out of the source title", async () => {
    const store = await append(
      { "nutegg/egg.md": baseEgg },
      "- insight",
      "Jane",
      "A [bracket] title"
    );
    assert.ok(
      store.files.get("nutegg/egg.md")!.includes("_source: [A bracket title](https://example.com/post)_")
    );
  });

  it("reports missing eggs so Hatch cannot silently lose entries", async () => {
    await assert.rejects(append({}, "- bullet"), /egg file not found/);
  });
});

describe("EggParser.countUnprocessed", () => {
  const parser = new EggParser(makeFakePlugin() as any);

  it("counts top-level entry bullets, ignoring indented example sub-bullets", () => {
    const egg = parser.parseEggFile(
      "x.md",
      [
        "# Unprocessed",
        "",
        "- entry one",
        "  - 🎯 Example: a",
        "- entry two",
        "- entry three",
      ].join("\n")
    );
    assert.equal(parser.countUnprocessed(egg), 3);
  });

  it("returns 0 for a missing or empty section", () => {
    assert.equal(parser.countUnprocessed(parser.parseEggFile("x.md", "")), 0);
    assert.equal(
      parser.countUnprocessed(parser.parseEggFile("x.md", "# Unprocessed\n")),
      0
    );
  });

  it("counts entries at the user's base indent (re-indented section)", () => {
    const egg = parser.parseEggFile(
      "x.md",
      [
        "# Unprocessed",
        "",
        "  - entry one",
        "    - sub bullet",
        "  - entry two",
      ].join("\n")
    );
    assert.equal(parser.countUnprocessed(egg), 2);
  });
});

describe("EggParser.applyMerge", () => {
  const fullEgg = [
    "---",
    "topic: X",
    "---",
    "",
    "> [!abstract]- Instructions:",
    "> **Scope:** s",
    "",
    "# Knowledge",
    "",
    "### Old Branch",
    "  - old stuff",
    "",
    "# Unprocessed",
    "",
    "- stale entry",
  ].join("\n");

  async function merge(
    files: Record<string, string>,
    knowledge: string,
    unprocessed: string
  ) {
    const store = makeFakeVault(files);
    const fake = makeFakePlugin({ vault: store.vault });
    const parser = new EggParser(fake as any);
    await parser.applyMerge("egg.md", knowledge, unprocessed);
    return store;
  }

  it("replaces both sections while preserving frontmatter and instructions", async () => {
    const store = await merge(
      { "nutegg/egg.md": fullEgg },
      "### Old Branch\n  - old stuff\n  - merged entry",
      "- leftover entry"
    );
    const out = store.files.get("nutegg/egg.md")!;
    assert.ok(out.includes("topic: X"));
    assert.ok(out.includes("> **Scope:** s"));
    assert.ok(out.includes("### Old Branch\n  - old stuff\n  - merged entry"));
    assert.ok(out.includes("# Unprocessed\n\n- leftover entry"));
    assert.ok(!out.includes("stale entry"));
    // Sections appear exactly once each
    assert.equal(out.split("# Knowledge").length - 1, 1);
    assert.equal(out.split("# Unprocessed").length - 1, 1);
  });

  it("empties the Unprocessed section when nothing is left over", async () => {
    const store = await merge({ "nutegg/egg.md": fullEgg }, "- all merged", "");
    const out = store.files.get("nutegg/egg.md")!;
    assert.ok(out.includes("# Unprocessed"));
    assert.ok(!out.includes("- stale entry"));
  });

  it("creates missing sections", async () => {
    const store = await merge(
      { "nutegg/egg.md": "---\ntopic: X\n---\n" },
      "- new tree",
      "- leftover"
    );
    const out = store.files.get("nutegg/egg.md")!;
    assert.ok(out.includes("# Knowledge\n\n- new tree"));
    assert.ok(out.includes("# Unprocessed\n\n- leftover"));
  });

  it("does nothing when the egg file is missing", async () => {
    const store = await merge({}, "- tree", "");
    assert.equal(store.files.size, 0);
  });

  // --- Regression: merges must never break the Knowledge/Unprocessed pair ---

  it("strips a leading '# Knowledge' heading from the AI output", async () => {
    // The model sometimes includes the section heading in its answer
    const store = await merge(
      { "nutegg/egg.md": fullEgg },
      "# Knowledge\n\n- merged entry",
      ""
    );
    const out = store.files.get("nutegg/egg.md")!;
    // exactly one heading survives
    assert.equal(out.split("\n").filter((l) => l === "# Knowledge").length, 1);
    assert.ok(out.includes("# Knowledge\n\n- merged entry"));
  });

  it("strips a leading '# Unprocessed' heading from the AI leftovers", async () => {
    const store = await merge(
      { "nutegg/egg.md": fullEgg },
      "- merged entry",
      "# Unprocessed\n\n- leftover entry"
    );
    const out = store.files.get("nutegg/egg.md")!;
    assert.equal(out.split("\n").filter((l) => l === "# Unprocessed").length, 1);
    assert.ok(out.includes("- leftover entry"));
  });

  it("cuts an embedded Unprocessed section out of the knowledge field", async () => {
    const store = await merge(
      { "nutegg/egg.md": fullEgg },
      "- merged entry\n\n# Unprocessed\n- leftover entry",
      ""
    );
    const out = store.files.get("nutegg/egg.md")!;
    assert.equal(out.split("\n").filter((l) => l === "# Unprocessed").length, 1);
    assert.ok(out.includes("- merged entry"));
    assert.ok(out.includes("- leftover entry"));
    // the leftover must live under Unprocessed, not inside the tree
    assert.ok(!out.split("# Unprocessed")[0].includes("- leftover entry"));
  });

  it("self-heals a file already broken by a duplicate '# Knowledge' heading", async () => {
    const broken = fullEgg.replace(
      "# Knowledge\n",
      "# Knowledge\n\n# Knowledge\n"
    );
    const store = await merge({ "nutegg/egg.md": broken }, "- fresh tree", "");
    const out = store.files.get("nutegg/egg.md")!;
    assert.equal(out.split("\n").filter((l) => l === "# Knowledge").length, 1);
    // the old tree (under the stray heading) is replaced, not left dangling
    assert.ok(!out.includes("### Old Branch"));
    assert.ok(out.includes("- fresh tree"));
  });

  it("inserts a missing Knowledge section before Unprocessed", async () => {
    const store = await merge(
      { "nutegg/egg.md": "# Unprocessed\n\n- stale entry" },
      "- new tree",
      ""
    );
    const out = store.files.get("nutegg/egg.md")!;
    assert.ok(out.indexOf("# Knowledge") < out.indexOf("# Unprocessed"));
    assert.ok(out.includes("- new tree"));
  });
});

describe("EggParser.parseEggFile knowledge-tree structure (regression)", () => {
  const parser = new EggParser(makeFakePlugin() as any);

  it("includes same-level ## branches as part of the Knowledge tree", () => {
    const egg = parser.parseEggFile(
      "x.md",
      [
        "# Knowledge",
        "",
        "## Learning",
        "- real tree",
        "",
        "# Unprocessed",
        "",
        "- pending",
      ].join("\n")
    );
    assert.ok(egg.knowledge.includes("## Learning"));
    assert.ok(egg.knowledge.includes("- real tree"));
    assert.ok(!egg.knowledge.includes("- pending"));
    assert.ok(egg.unprocessed.includes("- pending"));
  });

  it("ignores a stray '# Knowledge' duplicate when reading a broken file", () => {
    const egg = parser.parseEggFile(
      "x.md",
      [
        "# Knowledge",
        "",
        "# Knowledge",
        "",
        "## Learning",
        "- real tree",
        "",
        "# Unprocessed",
        "",
        "- pending",
      ].join("\n")
    );
    assert.ok(egg.knowledge.includes("- real tree"));
    assert.ok(!egg.knowledge.split("\n").includes("# Knowledge"));
    assert.ok(egg.unprocessed.includes("- pending"));
  });
});

describe("extractEggLanguage", () => {
  it("extracts language from YAML frontmatter", () => {
    assert.equal(
      extractEggLanguage('---\ntopic: "T"\nlanguage: "Chinese"\n---\n'),
      "Chinese"
    );
    assert.equal(
      extractEggLanguage("---\ntopic: 'T'\nlanguage: Japanese\n---\n"),
      "Japanese"
    );
  });

  it("extracts direct language directive when frontmatter delimiters missing", () => {
    assert.equal(extractEggLanguage('language: "Korean"'), "Korean");
  });

  it("returns empty string when no language is specified", () => {
    assert.equal(extractEggLanguage('---\ntopic: "T"\n---\n'), "");
    assert.equal(extractEggLanguage(""), "");
  });
});

describe("insertEggLanguage", () => {
  it("inserts language into existing frontmatter", () => {
    const input = `---\ntopic: "Investment"\nstatus: "active"\n---\n\n# Knowledge\n`;
    const result = insertEggLanguage(input, "English");
    assert.equal(
      result,
      `---\ntopic: "Investment"\nstatus: "active"\nlanguage: "English"\n---\n\n# Knowledge\n`
    );
  });

  it("replaces empty language field in frontmatter", () => {
    const input = `---\ntopic: "AI"\nlanguage: ""\n---\n\n# Knowledge\n`;
    const result = insertEggLanguage(input, "Chinese");
    assert.equal(
      result,
      `---\ntopic: "AI"\nlanguage: "Chinese"\n---\n\n# Knowledge\n`
    );
  });

  it("leaves existing non-empty language unchanged", () => {
    const input = `---\ntopic: "AI"\nlanguage: "German"\n---\n\n# Knowledge\n`;
    const result = insertEggLanguage(input, "Chinese");
    assert.equal(result, input);
  });

  it("prepends frontmatter if missing", () => {
    const input = `# Knowledge\n\n- Some point\n`;
    const result = insertEggLanguage(input, "Spanish");
    assert.equal(
      result,
      `---\nlanguage: "Spanish"\n---\n\n# Knowledge\n\n- Some point\n`
    );
  });
});

describe("EggParser path isolation", () => {
  it("resolves only basenames and canonical paths in the configured folder", () => {
    assert.equal(resolveEggPath("egg.md"), "nutegg/egg.md");
    assert.equal(resolveEggPath("nutegg/egg.md"), "nutegg/egg.md");
    assert.equal(resolveEggPath("egg.md", "custom/eggs"), "custom/eggs/egg.md");
    for (const name of ["outside/egg.md", "/nutegg/egg.md", "../egg.md", "nutegg/../egg.md", "nutegg//egg.md", "nutegg/./egg.md", "nutegg\\egg.md", "_index.md", "nutegg/_raw/egg.md", "nutegg/_workflow/egg.md", "nutegg/sub/egg.md", "egg.txt"]) {
      assert.equal(resolveEggPath(name), null, name);
    }
  });

  it("reads, appends and merges the folder egg when a root note shares its basename", async () => {
    const original = "# Knowledge\n\n- private root note\n";
    const { vault, files } = makeFakeVault({ "egg.md": original, "nutegg/egg.md": "# Knowledge\n\n- egg tree\n" });
    const parser = new EggParser(makeFakePlugin({ vault }) as any);
    const egg = await parser.readEgg("egg.md");
    assert.equal(egg?.fileName, "nutegg/egg.md");
    assert.ok(egg?.knowledge.includes("egg tree"));
    await parser.appendUnprocessed("egg.md", "- new insight", "Author", "Title", "https://example.com");
    assert.ok(files.get("nutegg/egg.md")!.includes("new insight"));
    assert.equal(await parser.applyMerge("egg.md", "- merged tree", ""), true);
    assert.ok(files.get("nutegg/egg.md")!.includes("merged tree"));
    assert.equal(files.get("egg.md"), original);
  });

  it("does not fall back to a root note when the actual egg is missing", async () => {
    const { vault, files } = makeFakeVault({ "egg.md": "private" });
    const parser = new EggParser(makeFakePlugin({ vault }) as any);
    assert.equal(await parser.readEgg("egg.md"), null);
    await assert.rejects(parser.appendUnprocessed("egg.md", "new", "", "", ""), /egg file not found/);
    assert.equal(await parser.applyMerge("egg.md", "new", ""), false);
    assert.equal(files.get("egg.md"), "private");
  });

  it("rejects external and system paths rather than remapping their basename to a real egg", async () => {
    const paths = ["outside/egg.md", "nutegg/_index.md", "nutegg/_raw/egg.md", "nutegg/_workflow/egg.md", "nutegg/sub/egg.md"];
    const initial = Object.fromEntries(paths.map(path => [path, "private"]));
    const { vault, files } = makeFakeVault({ ...initial, "nutegg/egg.md": "# Knowledge\n- tree" });
    const parser = new EggParser(makeFakePlugin({ vault }) as any);
    for (const path of paths) {
      assert.equal(await parser.readEgg(path), null);
      await assert.rejects(parser.appendUnprocessed(path, "new", "", "", ""), /outside the egg folder/);
      assert.equal(await parser.applyMerge(path, "new", ""), false);
      assert.equal(files.get(path), "private");
    }
    assert.equal(files.get("nutegg/egg.md"), "# Knowledge\n- tree");
  });

  it("keeps case-insensitive aliases inside the configured folder", async () => {
    const { vault, files } = makeFakeVault({ "custom/eggs/Egg.md": "# Knowledge\n- tree", "egg.md": "private" });
    const parser = new EggParser(makeFakePlugin({ vault, vaultFolder: "custom/eggs" }) as any);
    assert.equal((await parser.readEgg("egg.md"))?.fileName, "custom/eggs/Egg.md");
    await parser.appendUnprocessed("egg.md", "new", "", "", "");
    assert.ok(files.get("custom/eggs/Egg.md")!.includes("- new"));
    assert.equal(files.get("egg.md"), "private");
    assert.equal(await parser.readEgg("nutegg/egg.md"), null);
  });

  it("does not choose between ambiguous case-insensitive names", async () => {
    const { vault } = makeFakeVault({ "nutegg/Egg.md": "first", "nutegg/EGG.md": "second" });
    const parser = new EggParser(makeFakePlugin({ vault }) as any);
    assert.equal(await parser.readEgg("egg.md"), null);
  });

  for (const operation of ["append", "merge", "metadata"] as const) {
    for (const atomic of [false, true]) {
      it(`blocks ${operation} if the file moves outside the folder while ${atomic ? "process" : "read"} waits`, async () => {
        const original = "# Knowledge\n- original";
        const { vault, files } = makeFakeVault({ "nutegg/egg.md": original });
        const move = (file: { path: string }) => {
          files.delete(file.path);
          file.path = "outside/egg.md";
          files.set(file.path, original);
        };
        if (atomic) {
          (vault as any).process = async (file: any, transform: (content: string) => string) => {
            await Promise.resolve();
            move(file);
            await vault.modify(file, transform(original));
          };
        } else {
          vault.read = async file => { await Promise.resolve(); move(file); return original; };
        }
        const parser = new EggParser(makeFakePlugin({ vault }) as any);
        const operationPromise = operation === "append"
          ? parser.appendUnprocessed("egg.md", "new", "", "", "")
          : operation === "merge" ? parser.applyMerge("egg.md", "new", "")
          : parser.processEgg("egg.md", () => "language: English");
        await assert.rejects(operationPromise, /moved or is outside/);
        assert.equal(files.get("outside/egg.md"), original);
      });
    }
  }

  it("discards a read if the file is moved while content loads", async () => {
    const { vault } = makeFakeVault({ "nutegg/egg.md": "# Knowledge\n- tree" });
    vault.read = async file => { file.path = "outside/egg.md"; return "private"; };
    const parser = new EggParser(makeFakePlugin({ vault }) as any);
    await assert.rejects(parser.readEgg("egg.md"), /moved or is outside/);
  });
});

describe("EggParser.readEgg language handling", () => {
  it("reads egg language from frontmatter when present", async () => {
    const original = `---\ntopic: "Trading"\nlanguage: "English"\n---\n\n# Knowledge\n- risk\n`;
    const { vault } = makeFakeVault({
      "nutegg/trading.md": original,
    });
    let modified = false;
    vault.on("modify", () => {
      modified = true;
    });
    const plugin = makeFakePlugin({ vault } as any);
    const parser = new EggParser(plugin as any);

    const egg = await parser.readEgg("nutegg/trading.md");
    assert.ok(egg);
    assert.equal(egg.language, "English");
    assert.equal(modified, false);
    assert.equal(await vault.adapter.read("nutegg/trading.md"), original);
  });

  it("leaves language unset without modifying file if no plugin language is set", async () => {
    const original = `---\ntopic: "ML"\nstatus: "active"\n---\n\n# Knowledge\n- deep learning\n`;
    const { vault } = makeFakeVault({
      "nutegg/ml.md": original,
    });
    let modified = false;
    vault.on("modify", () => {
      modified = true;
    });
    const plugin = makeFakePlugin({ vault } as any);
    const parser = new EggParser(plugin as any);

    const egg = await parser.readEgg("nutegg/ml.md");
    assert.ok(egg);
    assert.equal(egg.language, "");
    assert.equal(modified, false);
    assert.equal(await vault.adapter.read("nutegg/ml.md"), original);
  });
});
