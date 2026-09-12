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

    contentEl.createEl("h2", { text: "🐣 Create New Egg" });

    // Name field
    const nameGroup = contentEl.createEl("div", {
      cls: "nutegg-modal-field-group",
    });
    nameGroup.style.marginBottom = "14px";
    nameGroup.createEl("label", {
      text: "Egg Name (file name):",
      cls: "nutegg-modal-label",
    }).style.cssText = "display: block; font-weight: 600; margin-bottom: 4px;";
    const nameInput = nameGroup.createEl("input", {
      type: "text",
      value: this.defaultName,
      placeholder: "e.g. methodology, invest_strategy, 方法论...",
    });
    nameInput.style.cssText = "width: 100%; box-sizing: border-box; padding: 6px 10px;";

    // Description field
    const descGroup = contentEl.createEl("div", {
      cls: "nutegg-modal-field-group",
    });
    descGroup.style.marginBottom = "10px";
    descGroup.createEl("label", {
      text: "Description (scope of what it covers):",
      cls: "nutegg-modal-label",
    }).style.cssText = "display: block; font-weight: 600; margin-bottom: 4px;";
    const descInput = descGroup.createEl("textarea", {
      placeholder: "e.g. 介绍做事的具体方法 / practical methods and tactics...",
    });
    descInput.value = this.defaultDescription;
    descInput.rows = 3;
    descInput.style.cssText =
      "width: 100%; box-sizing: border-box; padding: 6px 10px; resize: vertical;";

    // Language hint
    const hint = contentEl.createEl("p", {
      cls: "nutegg-modal-hint",
      text: "🌐 Language of instructions and knowledge output will match the description language.",
    });
    hint.style.cssText = "font-size: 0.85em; opacity: 0.75; margin: 4px 0 10px 0;";

    // Button row
    const btnRow = contentEl.createEl("div", {
      cls: "nutegg-modal-buttons",
    });
    btnRow.style.cssText = "display: flex; justify-content: flex-end; gap: 8px;";

    const cancelBtn = btnRow.createEl("button", { text: "Cancel" });
    cancelBtn.addEventListener("click", () => this.close());

    const submitBtn = btnRow.createEl("button", {
      cls: "mod-cta",
      text: "Create Egg",
    });

    const submit = async () => {
      const safeName = sanitizeEggName(nameInput.value);
      const description = descInput.value.trim();

      if (!safeName) {
        new Notice("NutEgg: Please enter a valid egg name.");
        nameInput.focus();
        return;
      }

      submitBtn.disabled = true;
      cancelBtn.disabled = true;
      const originalText = submitBtn.textContent;
      submitBtn.textContent = "⏳ Creating egg...";

      try {
        const result = await this.plugin.indexSync.createEgg(
          safeName,
          description
        );
        this.close();

        const detected = result.language;
        const currentSetting =
          this.plugin.settings.contentOutputLanguage || "same-as-content";

        const isDifferent =
          detected &&
          detected.toLowerCase() !== currentSetting.toLowerCase() &&
          !(currentSetting === "same-as-content" && detected.toLowerCase() === "english");

        if (isDifferent) {
          const notice = new Notice("", 8000);
          const frag = notice.noticeEl.createDiv();
          frag.createSpan({
            text: `NutEgg: Created ${result.path} (${detected}). `,
          });
          const switchBtn = frag.createEl("button", {
            text: `Set Content Language to ${detected}`,
          });
          switchBtn.style.cssText = "margin-left: 6px; padding: 2px 6px; font-size: 0.85em;";
          switchBtn.addEventListener("click", async () => {
            this.plugin.settings.contentOutputLanguage = detected;
            await this.plugin.saveSettings();
            notice.hide();
            new Notice(
              `NutEgg: Content analysis output language set to ${detected}`
            );
          });
        } else if (result.alreadyExists) {
          new Notice(`NutEgg: ${result.path} already exists.`);
        } else {
          new Notice(`NutEgg: Created ${result.path}`);
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
      btn.textContent = "🥚 + New Egg";
      btn.title = "Create a new egg file and add to index";
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        new CreateEggModal(plugin.app, plugin).open();
      });

      bar.appendChild(btn);
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
      "margin: 10px 0 14px 0; display: block; width: 100%;";

    const btn = document.createElement("button");
    btn.className = "nutegg-new-egg-btn mod-cta";
    btn.textContent = "🐣 + New Egg";
    btn.title = "Create a new egg file and add to index";
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      new CreateEggModal(this.plugin.app, this.plugin).open();
    });

    wrap.appendChild(btn);
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

