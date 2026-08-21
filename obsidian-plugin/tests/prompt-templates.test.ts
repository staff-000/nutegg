import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PROMPTS, renderPrompt } from "../src/prompt-templates";

describe("renderPrompt", () => {
  it("substitutes {{placeholders}} with values", () => {
    const out = renderPrompt("Hello {{name}}, you are {{age}}.", {
      name: "NutEgg",
      age: 2,
    });
    assert.equal(out, "Hello NutEgg, you are 2.");
  });

  it("renders missing variables as empty strings", () => {
    const out = renderPrompt("A{{missing}}B", {});
    assert.equal(out, "AB");
  });

  it("replaces repeated placeholders everywhere", () => {
    const out = renderPrompt("{{x}}-{{x}}", { x: "y" });
    assert.equal(out, "y-y");
  });

  it("leaves unknown syntax untouched", () => {
    assert.equal(renderPrompt("{{a}} {{a.b}} {a}", { a: "1" }), "1 {{a.b}} {a}");
  });

  it("coerces numeric values to strings", () => {
    assert.equal(renderPrompt("{{n}}", { n: 42 }), "42");
  });
});

describe("PROMPTS", () => {
  it("every template bundle is loaded and non-empty", () => {
    for (const [name, tpl] of Object.entries(PROMPTS)) {
      assert.ok(tpl.length > 10, `${name} should be non-empty`);
    }
  });

  it("templates use the documented placeholder names", () => {
    const all = Object.values(PROMPTS).join("\n");
    const used = new Set([...all.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]));
    const known = [
      "action_guide", "title", "url", "source_type", "chapters", "questions",
      "egg_key_questions", "content", "grounding_rule", "egg_file",
      "egg_instructions", "prior_qa", "index",
      // merge-unprocessed.md
      "formatting_rules", "knowledge_tree", "unprocessed", "unprocessed_count",
      // chunked analysis (per-part labels + aggregates)
      "part_note", "chunk_summaries", "chunk_findings",
    ];
    for (const v of used) {
      assert.ok(known.includes(v), `unknown placeholder {{${v}}}`);
    }
  });
});
