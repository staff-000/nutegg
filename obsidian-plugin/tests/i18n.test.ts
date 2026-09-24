import { describe, it } from "node:test";
import assert from "node:assert";
import { t, getLanguage } from "../src/i18n/index";
import { en } from "../src/i18n/en";
import { zh } from "../src/i18n/zh";
import { es } from "../src/i18n/es";
import { ja } from "../src/i18n/ja";
import { ko } from "../src/i18n/ko";
import { ar } from "../src/i18n/ar";
import { fr } from "../src/i18n/fr";
import { de } from "../src/i18n/de";
import { pt } from "../src/i18n/pt";
import { ru } from "../src/i18n/ru";

describe("Obsidian Plugin i18n", () => {
  const dicts = { en, zh, es, ja, ko, ar, fr, de, pt, ru };
  const enKeys = Object.keys(en);

  it("has identical keys across all 10 language dictionaries", () => {
    for (const [lang, dict] of Object.entries(dicts)) {
      const keys = Object.keys(dict);
      assert.strictEqual(
        keys.length,
        enKeys.length,
        `Dictionary for ${lang} has ${keys.length} keys, expected ${enKeys.length}`
      );
      for (const k of enKeys) {
        assert.ok(k in dict, `Missing key "${k}" in ${lang}`);
      }
    }
  });

  it("never translates NutEgg in any language", () => {
    for (const [lang, dict] of Object.entries(dicts)) {
      for (const [k, v] of Object.entries(dict)) {
        if (typeof v === "string") {
          assert.doesNotMatch(
            v,
            /坚果蛋|螺母蛋|果蛋/,
            `Key "${k}" in ${lang} mistranslated NutEgg: ${v}`
          );
        }
      }
    }
  });

  it("supports parameter interpolation via t()", () => {
    const formatted = t("serverStarted", { port: 27123 });
    assert.ok(formatted.includes("27123"));
  });
});

