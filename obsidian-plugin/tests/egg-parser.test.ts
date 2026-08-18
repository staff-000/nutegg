import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { EggParser } from "../src/egg-parser";
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
> **Rejection Criteria:**
> - Reject price predictions.
> - Reject FOMO content.
>
> **Formatting Rules:**
> - Respect the existing knowledge tree.

## Knowledge

- Risk Management
  - tail hedging
`;

describe("EggParser.parseEggFile (new format)", () => {
  const parser = new EggParser(makeFakePlugin() as any);

  it("parses frontmatter topic", () => {
    const egg = parser.parseEggFile("inv.md", NEW_FORMAT_EGG);
    assert.equal(egg.topic, "Investment Strategy");
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

  it("parses rejection criteria as a list", () => {
    const egg = parser.parseEggFile("inv.md", NEW_FORMAT_EGG);
    assert.deepEqual(egg.rejectionCriteria, [
      "Reject price predictions.",
      "Reject FOMO content.",
    ]);
  });

  it("extracts the Knowledge section content", () => {
    const egg = parser.parseEggFile("inv.md", NEW_FORMAT_EGG);
    assert.equal(egg.knowledge, "- Risk Management\n  - tail hedging");
  });

  it("defaults topic to Unknown when frontmatter is missing", () => {
    const egg = parser.parseEggFile("x.md", "## Knowledge\n\n- stuff\n");
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

  it("includes scope, questions, criteria, rules and knowledge", () => {
    const egg = parser.parseEggFile("inv.md", NEW_FORMAT_EGG);
    const out = parser.formatEggForPrompt(egg);
    assert.ok(out.includes("**Scope:** High-signal financial data."));
    assert.ok(out.includes("1. Is this a structural shift?"));
    assert.ok(out.includes("- Reject price predictions."));
    assert.ok(out.includes("- Respect the existing knowledge tree."));
    assert.ok(out.includes("**Current Knowledge:**\n- Risk Management"));
  });

  it("marks empty knowledge as (empty)", () => {
    const egg = parser.parseEggFile("x.md", "## Knowledge\n");
    assert.ok(parser.formatEggForPrompt(egg).includes("(empty)"));
  });
});

describe("EggParser.insertKnowledge", () => {
  const baseEgg = [
    "## Knowledge",
    "",
    "### Risk Management",
    "  - tail hedging",
    "    - OTM puts",
    "### Psychology",
    "  - loss aversion",
  ].join("\n");

  async function insert(
    files: Record<string, string>,
    parent: string,
    content: string,
    source = "https://example.com"
  ) {
    const store = makeFakeVault(files);
    const fake = makeFakePlugin({ vault: store.vault });
    const parser = new EggParser(fake as any);
    await parser.insertKnowledge("egg.md", parent, content, source);
    return store;
  }

  it("nests new content under the parent anchor (indent = anchor + 2)", async () => {
    const store = await insert(
      { "egg.md": baseEgg },
      "tail hedging",
      "- crash-proofing study (2026)"
    );
    const out = store.files.get("egg.md")!;
    const anchorLine = out.split("\n").find((l) => l.includes("tail hedging"))!;
    const anchorIndent = anchorLine.match(/^\s*/)![0].length;
    const added = out
      .split("\n")
      .find((l) => l.includes("crash-proofing study"))!;
    assert.equal(
      added.match(/^\s*/)![0].length,
      anchorIndent + 2,
      "new bullet must be nested one level under the anchor"
    );
    // Still inside the anchor's block (before the next ### heading)
    const addedIdx = out.split("\n").indexOf(added);
    const psychIdx = out.split("\n").findIndex((l) => l.includes("### Psychology"));
    assert.ok(addedIdx < psychIdx, "inserted inside the anchor block");
  });

  it("appends at the end of Knowledge when no anchor is given", async () => {
    const store = await insert({ "egg.md": baseEgg }, "", "- orphan bullet");
    const lines = store.files.get("egg.md")!.trimEnd().split("\n");
    assert.ok(lines.includes("- orphan bullet"));
    // Source link line closes the inserted block
    assert.equal(
      lines[lines.length - 1],
      "_source: [link](https://example.com)_"
    );
  });

  it("appends at the end when the anchor doesn't match anything", async () => {
    const store = await insert(
      { "egg.md": baseEgg },
      "no such concept",
      "- new stuff"
    );
    assert.ok(store.files.get("egg.md")!.includes("- new stuff"));
  });

  it("creates a Knowledge section when the egg has none", async () => {
    const store = await insert({ "egg.md": "---\ntopic: X\n---\n" }, "", "- first");
    const out = store.files.get("egg.md")!;
    assert.ok(out.includes("## Knowledge"));
    assert.ok(out.includes("- first"));
  });

  it("adds a source link under the inserted content", async () => {
    const store = await insert(
      { "egg.md": baseEgg },
      "",
      "- bullet",
      "https://src.example/x"
    );
    assert.ok(store.files.get("egg.md")!.includes("_source: [link](https://src.example/x)_"));
  });

  it("does nothing when the egg file is missing", async () => {
    const store = await insert({}, "", "- bullet");
    assert.equal(store.files.size, 0);
  });
});
