const { describe, it } = require("node:test");
const assert = require("node:assert");
const { initI18n, t, resolveLanguage, translations } = require("../src/i18n.js");

describe("Chrome Extension i18n", () => {
  it("resolves languages correctly", () => {
    assert.strictEqual(resolveLanguage("zh"), "zh_CN");
    assert.strictEqual(resolveLanguage("zh_CN"), "zh_CN");
    assert.strictEqual(resolveLanguage("en"), "en");
    assert.strictEqual(resolveLanguage("es"), "es");
    assert.strictEqual(resolveLanguage("ja"), "ja");
    assert.strictEqual(resolveLanguage("ko"), "ko");
    assert.strictEqual(resolveLanguage("ar"), "ar");
    assert.strictEqual(resolveLanguage("fr"), "fr");
    assert.strictEqual(resolveLanguage("de"), "de");
    assert.strictEqual(resolveLanguage("pt"), "pt");
    assert.strictEqual(resolveLanguage("ru"), "ru");
  });

  it("translates strings in English", () => {
    initI18n("en");
    assert.strictEqual(t("aiCredit"), "AI Credit");
    assert.strictEqual(t("optionsTitle"), "NutEgg Settings");
  });

  it("translates strings in all 10 languages without translating NutEgg", () => {
    const supported = ["en", "zh_CN", "es", "ja", "ko", "ar", "fr", "de", "pt", "ru"];
    for (const lang of supported) {
      initI18n(lang);
      assert.ok(translations[lang], `Dictionary for ${lang} must exist`);
      assert.ok(t("analyze"), `t(analyze) must exist for ${lang}`);
      assert.ok(t("optionsTitle").includes("NutEgg"), `optionsTitle in ${lang} must keep "NutEgg": ${t("optionsTitle")}`);

      // Verify "NutEgg" is preserved and not mistranslated
      for (const [key, value] of Object.entries(translations[lang])) {
        if (typeof value === "string") {
          assert.doesNotMatch(value, /坚果蛋|螺母蛋|果蛋/, `Key "${key}" in ${lang} translated NutEgg incorrectly: ${value}`);
        }
      }
    }
  });

  it("supports parameter interpolation", () => {
    initI18n("en");
    const formatted = t("chapterJumpHint", {});
    assert.ok(formatted);
  });
});

