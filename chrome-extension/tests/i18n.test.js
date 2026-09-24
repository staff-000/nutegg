const { describe, it } = require("node:test");
const assert = require("node:assert");
const { initI18n, t, resolveLanguage, translations } = require("../src/i18n.js");

describe("Chrome Extension i18n", () => {
  it("resolves languages correctly", () => {
    assert.strictEqual(resolveLanguage("zh"), "zh_CN");
    assert.strictEqual(resolveLanguage("zh_CN"), "zh_CN");
    assert.strictEqual(resolveLanguage("en"), "en");
  });

  it("translates strings in English", () => {
    initI18n("en");
    assert.strictEqual(t("aiCredit"), "AI Credit");
    assert.strictEqual(t("optionsTitle"), "NutEgg Settings");
  });

  it("translates strings in Simplified Chinese without translating NutEgg", () => {
    initI18n("zh_CN");
    assert.strictEqual(t("aiCredit"), "AI 额度");
    assert.strictEqual(t("optionsTitle"), "NutEgg 设置");

    // CRITICAL: Ensure "NutEgg" is never translated in Chinese
    for (const [key, value] of Object.entries(translations.zh_CN)) {
      if (typeof value === "string") {
        assert.doesNotMatch(value, /坚果蛋|螺母蛋|果蛋/, `Key "${key}" translated NutEgg incorrectly: ${value}`);
      }
    }
  });

  it("supports parameter interpolation", () => {
    initI18n("en");
    const formatted = t("chapterJumpHint", {});
    assert.ok(formatted);
  });
});

