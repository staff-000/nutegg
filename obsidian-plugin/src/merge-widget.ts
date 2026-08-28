import { MarkdownPostProcessorContext, Notice } from "obsidian";
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import type NutEggPlugin from "./main";
import type { MergeResult } from "./ai-processor";

/**
 * Merge UI in both modes:
 *   - Reading mode: a Markdown post-processor injects a badge + merge button
 *     below the `# Unprocessed` heading.
 *   - Editing mode: a CodeMirror ViewPlugin shows a compact badge + button
 *     at the end of the `# Unprocessed` heading line.
 *
 * Both paths share runMerge(), which persists unsaved editor changes before
 * merging — the merge rewrites the file on disk and would otherwise clobber
 * a dirty editor buffer.
 */

/** Line number (1-based) where the instruction block or heading ends. */
export function findInstructionTargetLine(docText: string): number | null {
  const lines = docText.split("\n");

  // 1. Check for callout: > [!...]- Instructions or > [!abstract]
  const calloutStart = lines.findIndex((l) =>
    /^>\s*\[!\w+\]-?\s*(?:instructions?|scope)?/i.test(l.trim())
  );
  if (calloutStart !== -1) {
    // Scan downwards for the end of the callout (the last line starting with '>')
    let calloutEnd = calloutStart;
    for (let i = calloutStart + 1; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed.startsWith(">")) {
        calloutEnd = i;
      } else if (trimmed === "") {
        // Empty lines can be inside callouts if followed by more '>' lines
        let moreCallout = false;
        for (let j = i + 1; j < Math.min(lines.length, i + 10); j++) {
          const nextTrimmed = lines[j].trim();
          if (nextTrimmed === "") continue;
          if (nextTrimmed.startsWith(">")) moreCallout = true;
          break;
        }
        if (moreCallout) continue;
        break;
      } else {
        break;
      }
    }
    return calloutEnd + 1;
  }

  // 2. Check for heading: # Instructions or ## Instructions
  const headingIdx = lines.findIndex((l) =>
    /^#+\s*instructions?\s*:?$/i.test(l.trim())
  );
  if (headingIdx !== -1) {
    return headingIdx + 1;
  }

  // 3. Fallback: # Unprocessed
  const unprocIdx = lines.findIndex((l) => /^#\s*Unprocessed\s*$/i.test(l.trim()));
  if (unprocIdx !== -1) {
    return unprocIdx + 1;
  }

  return null;
}

/**
 * Run the AI merge for an egg file. When `currentDoc` is given (the editor's
 * live buffer), unsaved changes are written to disk first so the merge sees
 * them and its rewrite doesn't destroy the buffer.
 */
export async function runMerge(
  plugin: NutEggPlugin,
  filePath: string,
  currentDoc: string | null
): Promise<MergeResult | null> {
  if (currentDoc !== null) {
    const file = plugin.app.vault.getAbstractFileByPath(filePath);
    if (file) {
      const disk = await plugin.app.vault.read(file as any);
      if (disk !== currentDoc) {
        await plugin.app.vault.modify(file as any, currentDoc);
        console.log(`[NutEgg] Saved unsaved edits in ${filePath} before merge`);
      }
    }
  }
  return plugin.aiProcessor.mergeEgg(filePath);
}

/** Appends the asynchronous AI credit badge to a badge container element. */
function appendCreditPill(plugin: NutEggPlugin, targetBadge: HTMLElement): void {
  if (typeof plugin.aiClient?.checkCredit !== "function") return;
  const creditPill = document.createElement("span");
  creditPill.className = "nutegg-merge-credit";
  creditPill.style.opacity = "0.75";
  creditPill.style.marginLeft = "8px";
  creditPill.style.fontSize = "0.85em";
  plugin.aiClient
    .checkCredit(plugin.settings)
    .then((credit) => {
      if (credit.hasBalance && credit.balanceFormatted) {
        creditPill.textContent = `• 🪙 ${credit.providerLabel}: ${credit.balanceFormatted}`;
        creditPill.title = `NutEgg AI: ${credit.statusText}`;
        targetBadge.appendChild(creditPill);
      } else if (credit.providerLabel) {
        const label =
          plugin.settings.aiSource === "openrouter"
            ? "OpenRouter"
            : credit.providerLabel;
        creditPill.textContent = `• 🪙 ${label}`;
        creditPill.title = `NutEgg AI: ${credit.statusText}`;
        targetBadge.appendChild(creditPill);
      }
    })
    .catch(() => {});
}

// --- Reading mode ------------------------------------------------------

export function registerMergeWidget(plugin: NutEggPlugin): void {
  plugin.registerMarkdownPostProcessor(async (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
    // Only process markdown files that could be egg files
    if (!ctx.sourcePath || ctx.sourcePath.includes("/_raw/") || ctx.sourcePath.endsWith("_index.md")) {
      return;
    }

    // Look for instruction callout or heading first, then fallback to unprocessed
    let targetElement: HTMLElement | null = null;

    // 1. Callout (e.g. [!abstract]- Instructions)
    const callouts = el.querySelectorAll(".callout");
    for (let i = 0; i < callouts.length; i++) {
      const c = callouts[i] as HTMLElement;
      const title = c.querySelector(".callout-title, .callout-title-inner")?.textContent?.toLowerCase() || "";
      const type = c.getAttribute("data-callout")?.toLowerCase() || "";
      if (title.includes("instruction") || type === "abstract" || type === "info") {
        targetElement = c;
        break;
      }
    }

    // 2. Headings (h1, h2, h3)
    if (!targetElement) {
      const headings = el.querySelectorAll("h1, h2, h3");
      for (let i = 0; i < headings.length; i++) {
        const h = headings[i] as HTMLElement;
        const text = h.textContent?.trim().toLowerCase() || "";
        if (text.startsWith("instruction") || text.includes("instruction")) {
          targetElement = h;
          break;
        }
      }
    }

    // 3. Fallback: # Unprocessed heading
    if (!targetElement) {
      const headings = el.querySelectorAll("h1, h2, h3");
      for (let i = 0; i < headings.length; i++) {
        const h = headings[i] as HTMLElement;
        const text = h.textContent?.trim().toLowerCase() || "";
        if (text === "unprocessed" || text.startsWith("unprocessed")) {
          targetElement = h;
          break;
        }
      }
    }

    if (!targetElement) return;

    // Check if a widget has already been inserted next to this element
    if (targetElement.parentElement?.querySelector(".nutegg-merge-container")) {
      return;
    }

    // Read the egg file to obtain the exact unprocessed count
    const egg = await plugin.eggParser.readEgg(ctx.sourcePath);
    if (!egg) return;

    const count = plugin.eggParser.countUnprocessed(egg);

    // Create the widget container
    const container = document.createElement("div");
    container.className = "nutegg-merge-container";

    const badge = document.createElement("div");
    badge.className = "nutegg-merge-badge";
    badge.textContent =
      count > 0
        ? `🥚 ${count} unprocessed ${count === 1 ? "entry" : "entries"}`
        : "✅ Knowledge tree is up to date";

    appendCreditPill(plugin, badge);
    container.appendChild(badge);

    if (count > 0) {
      const button = document.createElement("button");
      button.className = "nutegg-merge-btn mod-cta";
      button.textContent = "⚡ Merge into Knowledge Tree";

      button.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (button.disabled) return;
        button.disabled = true;
        const originalText = button.textContent;
        button.textContent = "⏳ Merging with AI...";

        try {
          const result = await runMerge(plugin, ctx.sourcePath, null);
          if (result && result.entries > 0) {
            new Notice(`[NutEgg] Merged ${result.entries} entries into knowledge tree`);
            button.textContent = "✅ Merged!";
            badge.textContent = "✅ Knowledge tree is up to date";
            setTimeout(() => {
              button.remove();
            }, 2000);
          } else {
            new Notice("[NutEgg] Merge returned no changes or failed. Check console.");
            button.disabled = false;
            button.textContent = originalText;
          }
        } catch (err) {
          console.error("[NutEgg] Merge button click failed:", err);
          new Notice(`[NutEgg] Merge failed: ${err instanceof Error ? err.message : String(err)}`);
          button.disabled = false;
          button.textContent = originalText;
        }
      });

      container.appendChild(button);
    }

    // Insert widget right after the target element (instruction block or heading)
    targetElement.insertAdjacentElement("afterend", container);
  });
}

// --- Editing mode ------------------------------------------------------

/** Inline badge + merge button rendered at the end of the heading line. */
class MergeButtonWidget extends WidgetType {
  constructor(
    private readonly plugin: NutEggPlugin,
    private readonly view: EditorView,
    private readonly filePath: string,
    private readonly count: number
  ) {
    super();
  }

  toDOM(): HTMLElement {
    // Same classes as the reading-mode widget, so the two look identical
    const wrap = document.createElement("div");
    wrap.className = "nutegg-merge-container nutegg-merge-editor-widget";

    const badge = document.createElement("div");
    badge.className = "nutegg-merge-badge";
    badge.textContent =
      this.count > 0
        ? `🥚 ${this.count} unprocessed ${this.count === 1 ? "entry" : "entries"}`
        : "✅ Knowledge tree is up to date";
    appendCreditPill(this.plugin, badge);
    wrap.appendChild(badge);

    if (this.count > 0) {
      const button = document.createElement("button");
      button.className = "nutegg-merge-btn mod-cta";
      button.textContent = "⚡ Merge into Knowledge Tree";
      button.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (button.disabled) return;
        button.disabled = true;
        const originalText = button.textContent;
        button.textContent = "⏳ Merging...";
        try {
          // The live buffer may hold edits made since the widget was built —
          // read it fresh at click time.
          const result = await runMerge(
            this.plugin,
            this.filePath,
            this.view.state.doc.toString()
          );
          if (result && result.entries > 0) {
            new Notice(`[NutEgg] Merged ${result.entries} entries into knowledge tree`);
            // The merge rewrites the file; the editor reloads it and the
            // widget flips to the up-to-date badge.
          } else {
            new Notice("[NutEgg] Merge returned no changes or failed. Check console.");
            button.disabled = false;
            button.textContent = originalText;
          }
        } catch (err) {
          console.error("[NutEgg] Editor merge failed:", err);
          new Notice(`[NutEgg] Merge failed: ${err instanceof Error ? err.message : String(err)}`);
          button.disabled = false;
          button.textContent = originalText;
        }
      });
      wrap.appendChild(button);
    }
    return wrap;
  }
}

/** One decorations set per editor — the widget tracks the live document. */
class EggMergeEditorPlugin {
  decorations: DecorationSet;
  /** Last built state — logged once per transition, not per keystroke. */
  private lastState = "";

  constructor(
    private readonly plugin: NutEggPlugin,
    private readonly view: EditorView
  ) {
    this.decorations = this.build();
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = this.build();
    }
  }

  /** The vault path of the file rendered by this editor view. */
  private filePath(): string {
    for (const leaf of this.plugin.app.workspace.getLeavesOfType("markdown")) {
      if ((leaf.view as any)?.editor?.cm === this.view) {
        return (leaf.view as any).file?.path || "";
      }
    }
    return this.plugin.app.workspace.getActiveFile()?.path || "";
  }

  private build(): DecorationSet {
    const docText = this.view.state.doc.toString();
    const lineNo = findInstructionTargetLine(docText);
    if (lineNo === null) {
      return this.logState("no-target", Decoration.none);
    }

    // Count from the LIVE document (reflects unsaved edits). The badge
    // always shows (so the widget is discoverable); the button only when
    // there is something to merge.
    const egg = this.plugin.eggParser.parseEggFile(this.filePath(), docText);
    const count = this.plugin.eggParser.countUnprocessed(egg);
    const state = count === 0 ? "up-to-date" : `count-${count}`;

    const line = this.view.state.doc.line(lineNo);
    return this.logState(
      state,
      Decoration.set([
        Decoration.widget({
          widget: new MergeButtonWidget(this.plugin, this.view, this.filePath(), count),
          // CM block widgets can't come from plugins — an inline decoration
          // whose DOM displays as a block is the portable equivalent (the
          // CSS gives it width:100% so it sits on its own line).
          side: 1,
        }).range(line.to),
      ])
    );
  }

  private logState(state: string, decorations: DecorationSet): DecorationSet {
    if (state !== this.lastState) {
      this.lastState = state;
      const detail =
        state === "no-target"
          ? "no instruction block or heading in this file"
          : state === "up-to-date"
            ? "0 entries — showing up-to-date badge"
            : `${state.replace("count-", "")} entries — showing merge button`;
      console.log(`[NutEgg] Editor merge widget (${this.filePath() || "?"}): ${detail}`);
    }
    return decorations;
  }
}

/** The editor extension itself (exported so tests can mount it). */
export function mergeEditorExtension(plugin: NutEggPlugin) {
  return ViewPlugin.fromClass(
    class extends EggMergeEditorPlugin {
      constructor(view: EditorView) {
        super(plugin, view);
      }
    },
    // Required: fromClass only wires decorations into the editor when the
    // spec declares them — an instance `decorations` field alone is ignored.
    { decorations: (v) => v.decorations }
  );
}

/** Editor extension: merge button & credit bar under instructions in editing mode. */
export function registerMergeEditorExtension(plugin: NutEggPlugin): void {
  plugin.registerEditorExtension(mergeEditorExtension(plugin));
}
