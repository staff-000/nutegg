import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { renderSetupBanner } from "../src/index-widget";
import { isAIConfigured } from "../src/ai-client";
import { makeFakePlugin } from "./helpers";
import { t } from "../src/i18n";

const dom = new JSDOM("<!doctype html><html><body></body></html>");
(globalThis as any).document = dom.window.document;
(globalThis as any).HTMLElement = dom.window.HTMLElement;

describe("AI Setup Hints", () => {
  describe("renderSetupBanner", () => {
    it("returns null when AI is configured", () => {
      const plugin = makeFakePlugin({
        settings: {
          aiApiKey: "sk-valid-key",
          aiProvider: "anthropic",
        },
      });

      assert.strictEqual(isAIConfigured(plugin.settings), true);
      const banner = renderSetupBanner(plugin as any);
      assert.strictEqual(banner, null);
    });

    it("renders callout banner when AI is unconfigured (empty key)", () => {
      let openSettingsCalled = false;
      const plugin = makeFakePlugin({
        settings: {
          aiApiKey: "",
          aiProvider: "anthropic",
        },
        openSettings: () => {
          openSettingsCalled = true;
        },
      });

      assert.strictEqual(isAIConfigured(plugin.settings), false);
      const banner = renderSetupBanner(plugin as any);
      assert.ok(banner !== null, "Expected banner to be rendered");
      assert.ok(banner.classList.contains("nutegg-setup-callout"));
      assert.strictEqual(banner.getAttribute("data-callout"), "warning");

      const title = banner.querySelector(".callout-title-inner");
      assert.ok(title);
      assert.strictEqual(title.textContent, t("setupAiBannerTitle"));

      const btn = banner.querySelector("button.nutegg-setup-btn") as HTMLButtonElement;
      assert.ok(btn, "Expected button to be in banner");
      assert.ok(btn.textContent?.includes(t("configureAiBtn")));

      // Clicking button should call plugin.openSettings()
      btn.click();
      assert.strictEqual(openSettingsCalled, true);
    });
  });

  describe("Status Bar unconfigured behavior", () => {
    it("recognizes unconfigured settings via isAIConfigured", () => {
      const unconfiguredPlugin = makeFakePlugin({
        settings: { aiApiKey: "", aiProvider: "gemini" },
      });
      assert.strictEqual(isAIConfigured(unconfiguredPlugin.settings), false);

      const configuredPlugin = makeFakePlugin({
        settings: { aiApiKey: "valid-key", aiProvider: "gemini" },
      });
      assert.strictEqual(isAIConfigured(configuredPlugin.settings), true);

      // Local provider without key is considered configured if default/custom endpoint is valid
      const localPlugin = makeFakePlugin({
        settings: {
          aiApiKey: "",
          aiProvider: "local",
          localEndpoint: "http://127.0.0.1:11434/api/chat",
        },
      });
      assert.strictEqual(isAIConfigured(localPlugin.settings), true);
    });
  });
});
