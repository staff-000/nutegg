import { MarkdownPostProcessorContext, Modal, Notice, App } from "obsidian";
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import type NutEggPlugin from "./main";
import { sanitizeEggName } from "./index-sync";
import { t } from "./i18n";

/**
 * Modal dialog for quickly creating a new egg file.
 * The entered description determines the output language for AI analysis.
 */
export class CreateEggModal extends Modal {
  private plugin: NutEggPlugin;
  private defaultName: string;
  private defaultDescription: string;

  constructor(
    app: App,
    plugin: NutEggPlugin,
    defaultName = "",
    defaultDescription = ""
  ) {
    super(app);
    this.plugin = plugin;
    this.defaultName = defaultName;
    this.defaultDescription = defaultDescription;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("nutegg-create-egg-modal");

    contentEl.createEl("h2", { text: t("createEggTitle") });

    // Name field
    const nameGroup = contentEl.createEl("div", {
      cls: "nutegg-modal-field-group",
    });
    nameGroup.style.marginBottom = "14px";
    nameGroup.createEl("label", {
      text: t("eggNameLabel"),
      cls: "nutegg-modal-label",
    }).style.cssText = "display: block; font-weight: 600; margin-bottom: 4px;";
    const nameInput = nameGroup.createEl("input", {
      type: "text",
      value: this.defaultName,
      placeholder: t("eggNamePlaceholder"),
    });
    nameInput.style.cssText = "width: 100%; box-sizing: border-box; padding: 6px 10px;";

    // Description field
    const descGroup = contentEl.createEl("div", {
      cls: "nutegg-modal-field-group",
    });
    descGroup.style.marginBottom = "10px";
    descGroup.createEl("label", {
      text: t("eggDescLabel"),
      cls: "nutegg-modal-label",
    }).style.cssText = "display: block; font-weight: 600; margin-bottom: 4px;";
    const descInput = descGroup.createEl("textarea", {
      placeholder: t("eggDescPlaceholder"),
    });
    descInput.value = this.defaultDescription;
    descInput.rows = 3;
    descInput.style.cssText =
      "width: 100%; box-sizing: border-box; padding: 6px 10px; resize: vertical;";

    // Language hint
    const hint = contentEl.createEl("p", {
      cls: "nutegg-modal-hint",
      text: t("eggLangHint"),
    });
    hint.style.cssText = "font-size: 0.85em; opacity: 0.75; margin: 4px 0 10px 0;";

    // Button row
    const btnRow = contentEl.createEl("div", {
      cls: "nutegg-modal-buttons",
    });
    btnRow.style.cssText = "display: flex; justify-content: flex-end; gap: 8px;";

    const cancelBtn = btnRow.createEl("button", { text: t("cancel") });
    cancelBtn.addEventListener("click", () => this.close());

    const submitBtn = btnRow.createEl("button", {
      cls: "mod-cta",
      text: t("createEgg"),
    });

    const submit = async () => {
      const safeName = sanitizeEggName(nameInput.value);
      const description = descInput.value.trim();

      if (!safeName) {
        new Notice(t("eggNameRequired"));
        nameInput.focus();
        return;
      }

      submitBtn.disabled = true;
      cancelBtn.disabled = true;
      const originalText = submitBtn.textContent;
      submitBtn.textContent = t("creatingEgg");

      try {
        const result = await this.plugin.indexSync.createEgg(
          safeName,
          description
        );
        this.close();

        if (result.alreadyExists) {
          new Notice(t("eggAlreadyExists", { path: result.path }));
        } else {
          new Notice(t("eggCreated", { path: result.path }));
        }

        // Open newly created or existing egg file in workspace
        const file = this.app.vault.getAbstractFileByPath(result.path);
        if (file) {
          const leaf = this.app.workspace.getLeaf(false);
          await leaf.openFile(file as any);
        }
      } catch (err) {
        console.error("[NutEgg] Failed to create egg from modal:", err);
        new Notice(
          `NutEgg: Failed to create egg: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
        submitBtn.disabled = false;
        cancelBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    };

    submitBtn.addEventListener("click", submit);
    nameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        descInput.focus();
      }
    });

    setTimeout(() => nameInput.focus(), 50);
  }
}

// --- Reading mode widget -----------------------------------------------

export function renderSyncButton(
  plugin: NutEggPlugin,
  container: HTMLElement
): HTMLElement {
  const btn = container.createEl("button", {
    cls: "nutegg-sync-btn",
    text: "Checking...",
  });
  btn.style.cssText =
    "display: inline-flex; align-items: center; gap: 4px; font-size: 0.85em; padding: 4px 10px; cursor: pointer;";

  const update = async () => {
    try {
      const status = await plugin.indexSync.getDiffStatus();
      if (status.totalDiffs === 0) {
        btn.textContent = "✓ In Sync";
        btn.className = "nutegg-sync-btn mod-muted";
        btn.title = "Everything is in sync. Click to re-check.";
      } else {
        const details: string[] = [];
        if (status.missingEggs.length) {
          details.push(`${status.missingEggs.length} missing egg file(s)`);
        }
        if (status.unindexedEggs.length) {
          details.push(`${status.unindexedEggs.length} unindexed egg note(s)`);
        }
        if (status.invalidEntries.length) {
          details.push(`${status.invalidEntries.length} invalid entry(ies)`);
        }
        btn.textContent = `🔄 Sync (${status.totalDiffs} diff${status.totalDiffs > 1 ? "s" : ""})`;
        btn.className = "nutegg-sync-btn mod-warning";
        btn.title = `${details.join(", ")}. Click to sync.`;
      }
    } catch (err) {
      console.warn("[NutEgg] Failed to get index diff status:", err);
    }
  };

  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const originalText = btn.textContent;
    btn.textContent = t("syncingIndex");
    btn.disabled = true;
    try {
      const res = await plugin.indexSync.sync();
      const parts: string[] = [];
      if (res.createdEggs.length) {
        parts.push(`+${res.createdEggs.length} egg(s) created`);
      }
      if (res.addedIndexEntries.length) {
        parts.push(`+${res.addedIndexEntries.length} entry(ies) added`);
      }
      if (res.prunedIndexEntries.length) {
        parts.push(`-${res.prunedIndexEntries.length} invalid pruned`);
      }
      if (res.fixedIndexPaths.length) {
        parts.push(`${res.fixedIndexPaths.length} path(s) normalized`);
      }

      if (parts.length > 0) {
        new Notice(t("indexSynced", { summary: parts.join(", ") }));
      } else {
        new Notice(t("indexAllSynced"));
      }
      await update();
    } catch (err) {
      new Notice(t("indexSyncFailed", { error: err instanceof Error ? err.message : String(err) }));
      btn.textContent = originalText;
    } finally {
      btn.disabled = false;
    }
  });

  plugin.indexSync.onDiffChanged(() => {
    update();
  });

  // Initial status check
  update();

  return btn;
}

export function registerIndexWidget(plugin: NutEggPlugin): void {
  plugin.registerMarkdownPostProcessor(
    async (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
      if (
        !ctx.sourcePath ||
        (!ctx.sourcePath.endsWith("_index.md") &&
          ctx.sourcePath !== plugin.settings.indexFile)
      ) {
        return;
      }

      if (el.querySelector(".nutegg-index-action-bar")) return;

      // Find heading or callout to place the action bar after
      const targetElement =
        el.querySelector(".callout") ||
        el.querySelector("h1, h2") ||
        el.firstElementChild;

      if (!targetElement) return;

      const bar = document.createElement("div");
      bar.className = "nutegg-index-action-bar";
      bar.style.cssText =
        "margin: 12px 0 16px 0; display: flex; align-items: center; gap: 8px;";

      const btn = document.createElement("button");
      btn.className = "nutegg-new-egg-btn mod-cta";
      btn.textContent = `🐣 ${t("newEggButton")}`;
      btn.title = t("cmdNewEgg");
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        new CreateEggModal(plugin.app, plugin).open();
      });

      bar.appendChild(btn);
      renderSyncButton(plugin, bar);
      targetElement.insertAdjacentElement("afterend", bar);
    }
  );
}

// --- Editing mode (Live Preview) widget ---------------------------------

class IndexActionBarWidget extends WidgetType {
  constructor(private readonly plugin: NutEggPlugin) {
    super();
  }

  toDOM(): HTMLElement {
    const wrap = document.createElement("div");
    wrap.className = "nutegg-index-action-bar nutegg-index-editor-widget";
    wrap.style.cssText =
      "margin: 10px 0 14px 0; display: flex; align-items: center; gap: 8px; width: 100%;";

    const btn = document.createElement("button");
    btn.className = "nutegg-new-egg-btn mod-cta";
    btn.textContent = `🐣 ${t("newEggButton")}`;
    btn.title = t("cmdNewEgg");
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      new CreateEggModal(this.plugin.app, this.plugin).open();
    });

    wrap.appendChild(btn);
    renderSyncButton(this.plugin, wrap);
    return wrap;
  }
}

class IndexActionBarEditorPlugin {
  decorations: DecorationSet;

  constructor(
    private readonly plugin: NutEggPlugin,
    private readonly view: EditorView
  ) {
    this.decorations = this.build();
  }

  update(update: ViewUpdate): void {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = this.build();
    }
  }

  private isIndexFile(): boolean {
    let filePath = "";
    for (const leaf of this.plugin.app.workspace.getLeavesOfType("markdown")) {
      if ((leaf.view as any)?.editor?.cm === this.view) {
        filePath = (leaf.view as any).file?.path || "";
        break;
      }
    }
    if (!filePath) {
      filePath = this.plugin.app.workspace.getActiveFile()?.path || "";
    }
    return (
      filePath.endsWith("_index.md") ||
      filePath === this.plugin.settings.indexFile
    );
  }

  private build(): DecorationSet {
    if (!this.isIndexFile()) {
      return Decoration.none;
    }

    const doc = this.view.state.doc;
    const docText = doc.toString();
    const lines = docText.split("\n");

    // Place right after the callout if present, otherwise after the first heading, or line 1
    let targetLineNo = 1;
    let inCallout = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith(">")) {
        inCallout = true;
        targetLineNo = i + 1;
      } else if (inCallout) {
        break;
      } else if (line.startsWith("#")) {
        targetLineNo = i + 1;
      }
    }

    const line = doc.line(Math.min(targetLineNo, doc.lines));
    return Decoration.set([
      Decoration.widget({
        widget: new IndexActionBarWidget(this.plugin),
        side: 1,
      }).range(line.to),
    ]);
  }
}

export function registerIndexEditorExtension(plugin: NutEggPlugin): void {
  plugin.registerEditorExtension(
    ViewPlugin.fromClass(
      class extends IndexActionBarEditorPlugin {
        constructor(view: EditorView) {
          super(plugin, view);
        }
      },
      {
        decorations: (v) => v.decorations,
      }
    )
  );
}

