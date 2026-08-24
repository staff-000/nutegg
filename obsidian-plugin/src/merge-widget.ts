import { MarkdownPostProcessorContext, Notice } from "obsidian";
import type NutEggPlugin from "./main";

/**
 * Registers the Markdown post-processor that injects an interactive merge
 * widget above the "# Unprocessed" section when viewing egg files.
 */
export function registerMergeWidget(plugin: NutEggPlugin): void {
  plugin.registerMarkdownPostProcessor(async (el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
    // Only process markdown files that could be egg files
    if (!ctx.sourcePath || ctx.sourcePath.includes("/_raw/") || ctx.sourcePath.endsWith("_index.md")) {
      return;
    }

    // Find any h1 heading that represents the Unprocessed section
    const headings = el.querySelectorAll("h1, h2, h3");
    let unprocessedHeading: HTMLElement | null = null;

    for (let i = 0; i < headings.length; i++) {
      const h = headings[i] as HTMLElement;
      const text = h.textContent?.trim().toLowerCase() || "";
      if (text === "unprocessed" || text.startsWith("unprocessed")) {
        unprocessedHeading = h;
        break;
      }
    }

    if (!unprocessedHeading) return;

    // Check if a widget has already been inserted next to this heading
    if (unprocessedHeading.parentElement?.querySelector(".nutegg-merge-container")) {
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
          const result = await plugin.aiProcessor.mergeEgg(ctx.sourcePath);
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

    // Insert widget right after the "# Unprocessed" heading
    unprocessedHeading.insertAdjacentElement("afterend", container);
  });
}
