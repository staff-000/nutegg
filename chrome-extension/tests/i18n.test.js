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
    assert.strictEqual(t("countMatched", { count: 3 }), "— 3 matched");
    assert.strictEqual(t("unprocessedParent", { parent: "Tech" }), "🐣 → Unprocessed · suggested under: <strong>Tech</strong>");
  });

  it("translates all required popup keys across all 10 languages", () => {
    const supported = ["en", "zh_CN", "es", "ja", "ko", "ar", "fr", "de", "pt", "ru"];
    const requiredKeys = [
      "hatchEgg",
      "hatchEggSelectEgg",
      "chipVerdictSummary", "toggleVerdictSummaryTooltip",
      "activityRunningCount", "activityUnreadCount", "activityUnread", "activityRunning", "activityUntitled",
      "collectNutOnly",
      "collectNut",
      "nutCollected",
      "eggHatched",
      "eggResultsHeading",
      "viewCovered",
      "hideCovered",
      "badgeCovered",
      "currentKnowledgeInEgg",
      "viewTree",
      "hideTree",
      "questionsAndAnswers",
      "askAQuestion",
      "askQuestionPlaceholder",
      "verdictWorthReading",
      "verdictSkipIt",
      "analyze",
      "analyzeBtn",
      "analyzeAgain",
      "viewAnalysis",
      "analyzingEggs",
      "cachedEggAnalysisShown",
      "hatchAlreadySaved", "hatchWaitForOperation",
      "eggCreationHint", "eggCreatedSelected", "hatchAnalyzeSelectedEggs",
      "reanalyze",
      "loadAndReanalyze",
      "countMatched",
      "noneMatched",
      "readingUncertain",
      "unprocessedOnly",
      "unprocessedParent",
      "readingHighlights",
      "stage1NutSavedNotice",
      "stage1NoEggsNotice",
      "stage1NoSelectedNotice",
      "stage1SelectedNotice",
      "selectEggWarning",
      "couldNotRetrieveContent",
      "atLeastOneSection",
      "errorHintNoApiKey",
      "errorHintAuthFailed",
    ];

    for (const lang of supported) {
      initI18n(lang);
      for (const key of requiredKeys) {
        const val = t(key, { count: 2, parent: "X", reason: "Y", extra: "Z" });
        assert.ok(val, `Missing or empty translation for key "${key}" in language "${lang}"`);
        assert.notStrictEqual(val, key, `Untranslated fallback key returned for "${key}" in language "${lang}"`);
      }
    }
  });
});

it('all discussion and debug UI keys are translated in every supported locale', () => {
  const { translations } = require('../src/i18n.js');
  for (const key of Object.keys(translations.en).filter(key => key.startsWith('discussion') || key.startsWith('debugInfo') || key.startsWith('captureRetry'))) {
    for (const [locale, dictionary] of Object.entries(translations)) assert.ok(dictionary[key], `${locale}: ${key}`);
  }
});

it('Chrome setup and reader copy is available in every supported locale', () => {
  const keys = Object.keys(translations.en).filter(key => key.startsWith('settings') || key.startsWith('reader'));
  for (const [locale, dictionary] of Object.entries(translations)) {
    for (const key of keys) assert.ok(dictionary[key], `${locale}: ${key}`);
  }
});

it('applies localized accessible labels to settings controls', () => {
  const { JSDOM } = require('jsdom');
  const { applyI18n } = require('../src/i18n.js');
  const dom = new JSDOM('<input data-i18n-aria-label="settingsModelLabel">');
  try {
    initI18n('zh_CN');
    applyI18n(dom.window.document);
    assert.equal(dom.window.document.querySelector('input').getAttribute('aria-label'), 'AI 模型');
  } finally { initI18n('en'); dom.window.close(); }
});

it('every settings and popup markup label resolves to translated copy', () => {
  const fs = require('node:fs');
  for (const file of ['../src/options/options.html', '../src/popup/popup.html']) {
    const html = fs.readFileSync(require.resolve(file), 'utf8');
    for (const [, key] of html.matchAll(/data-i18n(?:-html|-placeholder|-title|-aria-label)?="([^"]+)"/g)) {
      assert.ok(translations.en[key], `${file}: ${key}`);
    }
  }
});

it('popup and settings buttons have localized hints unless explicitly disabled', () => {
  const fs = require('node:fs');
  const { JSDOM } = require('jsdom');
  for (const file of ['../src/options/options.html', '../src/popup/popup.html']) {
    const dom = new JSDOM(fs.readFileSync(require.resolve(file), 'utf8'));
    try {
      for (const button of dom.window.document.querySelectorAll('button')) {
        if (button.closest('[data-hints="off"]')) {
          assert.ok(!button.title && !button.dataset.i18nTitle, `${file}: ${button.id} opts out of hints`);
          continue;
        }
        const key = button.dataset.i18nTitle;
        assert.ok(button.title && key, `${file}: ${button.id} needs a hint`);
        for (const [locale, dictionary] of Object.entries(translations)) {
          assert.ok(dictionary[key], `${locale}: ${key}`);
        }
      }
    } finally { dom.window.close(); }
  }
  for (const [locale, dictionary] of Object.entries(translations)) {
    for (const key of Object.keys(translations.en).filter(key => key.startsWith('button'))) {
      assert.ok(dictionary[key], `${locale}: ${key}`);
    }
  }
});
