import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  WorkflowManager,
  BUILTIN_WORKFLOW_FILES,
  WORKFLOW_FILE_MAP,
  simpleHash,
  WorkflowPromptKey,
} from "../src/workflow-manager";
import { makeFakePlugin, makeFakeVault } from "./helpers";

function makeManager(files: Record<string, string> = {}, settingsOverrides: any = {}) {
  const store = makeFakeVault(files);
  const plugin = makeFakePlugin({
    vault: store.vault,
    settings: {
      workflowFolder: "nutegg/_workflow",
      workflowHashes: {},
      ...settingsOverrides,
    },
    saveSettings: async () => {},
  });
  const manager = new WorkflowManager(plugin as any);
  return { manager, plugin, store, files: store.files };
}

describe("WorkflowManager", () => {
  it("seeds all built-in workflow files and populates settings.workflowHashes on initial run", async () => {
    const { manager, files, plugin } = makeManager();
    await manager.init();

    // Verify all built-in workflow files were created
    for (const [filename, expectedContent] of Object.entries(BUILTIN_WORKFLOW_FILES)) {
      const fullPath = `nutegg/_workflow/${filename}`;
      assert.equal(files.has(fullPath), true, `Missing seeded file: ${fullPath}`);
      assert.equal(files.get(fullPath), expectedContent);
      assert.equal(
        plugin.settings.workflowHashes[filename],
        simpleHash(expectedContent),
        `Hash mismatch for ${filename}`
      );
    }

    // Verify README.md is present
    assert.equal(files.has("nutegg/_workflow/README.md"), true);
  });

  it("retrieves seeded prompts dynamically via getPrompt", async () => {
    const { manager } = makeManager();
    await manager.init();

    for (const [key, filename] of Object.entries(WORKFLOW_FILE_MAP)) {
      const prompt = manager.getPrompt(key as WorkflowPromptKey);
      assert.equal(
        prompt,
        BUILTIN_WORKFLOW_FILES[filename],
        `Prompt mismatch for key: ${key}`
      );
    }
  });

  it("returns customized prompt when user edits a file", async () => {
    const { manager, store } = makeManager();
    await manager.init();

    const customPrompt = "You are a custom NutEgg content analyzer. Output JSON only.";
    await store.vault.modify(
      { path: "nutegg/_workflow/content-analysis.md" },
      customPrompt
    );

    assert.equal(manager.getPrompt("contentAnalysis"), customPrompt);
  });

  it("falls back to built-in default when file is deleted or empty", async () => {
    const { manager, store } = makeManager();
    await manager.init();

    // Modify to empty string
    await store.vault.modify(
      { path: "nutegg/_workflow/content-analysis.md" },
      "   \n  "
    );
    assert.equal(
      manager.getPrompt("contentAnalysis"),
      BUILTIN_WORKFLOW_FILES["content-analysis.md"]
    );

    // Delete file
    store.vault.trigger("delete", { path: "nutegg/_workflow/content-analysis.md" });
    assert.equal(
      manager.getPrompt("contentAnalysis"),
      BUILTIN_WORKFLOW_FILES["content-analysis.md"]
    );
  });

  it("auto-updates unmodified file when built-in version changes", async () => {
    const oldBuiltin = "Old default prompt";
    const oldHash = simpleHash(oldBuiltin);

    // Vault has the old content, and settings hash recorded that it was unmodified
    const { manager, files, plugin } = makeManager(
      {
        "nutegg/_workflow/content-analysis.md": oldBuiltin,
      },
      {
        workflowHashes: {
          "content-analysis.md": oldHash,
        },
      }
    );

    await manager.init();

    // Should have auto-updated to latest built-in version because recordedHash === currentVaultHash
    const expected = BUILTIN_WORKFLOW_FILES["content-analysis.md"];
    assert.equal(files.get("nutegg/_workflow/content-analysis.md"), expected);
    assert.equal(plugin.settings.workflowHashes["content-analysis.md"], simpleHash(expected));
    assert.equal(files.has("nutegg/_workflow/content-analysis.new.md"), false);
  });

  it("preserves user customized file and writes *.new.md on version update conflict", async () => {
    const userCustomizedContent = "My very special customized analysis prompt.";
    const originalDefault = "Some older default";
    const originalHash = simpleHash(originalDefault);

    // User customized the file, so current vault content hash differs from recorded original hash
    const { manager, files } = makeManager(
      {
        "nutegg/_workflow/content-analysis.md": userCustomizedContent,
      },
      {
        workflowHashes: {
          "content-analysis.md": originalHash,
        },
      }
    );

    await manager.init();

    // User custom file MUST be preserved untouched!
    assert.equal(
      files.get("nutegg/_workflow/content-analysis.md"),
      userCustomizedContent
    );

    // New version MUST be written to content-analysis.new.md
    assert.equal(files.has("nutegg/_workflow/content-analysis.new.md"), true);
    assert.equal(
      files.get("nutegg/_workflow/content-analysis.new.md"),
      BUILTIN_WORKFLOW_FILES["content-analysis.md"]
    );

    // getPrompt returns the user's customized prompt
    assert.equal(manager.getPrompt("contentAnalysis"), userCustomizedContent);
  });

  it("resetToDefaults moves all existing files to backup and restores built-in defaults", async () => {
    const customContent = "Custom prompt before reset";
    const obsoletePrompt = "Deprecated prompt that is no longer in code";
    const { manager, files, plugin } = makeManager({
      "nutegg/_workflow/content-analysis.md": customContent,
      "nutegg/_workflow/obsolete-prompt.md": obsoletePrompt,
    });
    await manager.init();

    await manager.resetToDefaults();

    // Built-in file should now be reset to default
    assert.equal(
      files.get("nutegg/_workflow/content-analysis.md"),
      BUILTIN_WORKFLOW_FILES["content-analysis.md"]
    );

    // Obsolete prompt should be deleted from active workflow folder
    assert.equal(files.has("nutegg/_workflow/obsolete-prompt.md"), false);

    // Both files should be safely preserved in _backup/
    const customBackup = [...files.keys()].find((k) =>
      k.startsWith("nutegg/_workflow/_backup/") && k.endsWith("content-analysis.md")
    );
    assert.ok(customBackup);
    assert.equal(files.get(customBackup), customContent);

    const obsoleteBackup = [...files.keys()].find((k) =>
      k.startsWith("nutegg/_workflow/_backup/") && k.endsWith("obsolete-prompt.md")
    );
    assert.ok(obsoleteBackup);
    assert.equal(files.get(obsoleteBackup), obsoletePrompt);

    // Hashes in settings should match built-in defaults only
    assert.equal(
      plugin.settings.workflowHashes["content-analysis.md"],
      simpleHash(BUILTIN_WORKFLOW_FILES["content-analysis.md"])
    );
    assert.equal(plugin.settings.workflowHashes["obsolete-prompt.md"], undefined);
  });

  it("ensureWorkflowFiles auto-removes unmodified obsolete prompts from prior versions", async () => {
    const oldPromptContent = "Old unmodified prompt from prior version";
    const oldHash = simpleHash(oldPromptContent);

    const { manager, files, plugin } = makeManager(
      {
        "nutegg/_workflow/deprecated.md": oldPromptContent,
      },
      {
        workflowHashes: {
          "deprecated.md": oldHash,
        },
      }
    );

    await manager.init();

    // Because recordedHash === currentHash and 'deprecated.md' is not in BUILTIN_WORKFLOW_FILES,
    // ensureWorkflowFiles automatically cleans it up!
    assert.equal(files.has("nutegg/_workflow/deprecated.md"), false);
    assert.equal(plugin.settings.workflowHashes["deprecated.md"], undefined);
  });
});
