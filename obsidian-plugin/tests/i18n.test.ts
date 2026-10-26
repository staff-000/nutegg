import { languageState } from './obsidian-stub';
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


it('localized status and sync messages retain every interpolation parameter', () => {
  const parameters = (value: string) => [...value.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
  for (const [lang, dictionary] of Object.entries({ en, zh, es, ja, ko, ar, fr, de, pt, ru })) {
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      if (!/^(credit|index|chatgpt|subscription|duration|createEggFailed|openWorkflowHint)/.test(key)) continue;
      assert.deepStrictEqual(parameters(dictionary[key]), parameters(en[key]), `${lang}: ${key}`);
    }
  }
});


it('language detection works without accessing browser storage, including older API fallbacks', () => {

  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const blocked = Object.defineProperty({}, 'localStorage', { get() { throw new Error('storage forbidden'); } });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: blocked });
  Object.defineProperty(globalThis, 'document', { configurable: true, value: { documentElement: { lang: 'ja' } } });
  try {
    languageState.app = 'de'; assert.equal(getLanguage(), 'de');
    languageState.app = ''; languageState.moment = 'fr'; assert.equal(getLanguage(), 'fr');
    languageState.moment = ''; assert.equal(getLanguage(), 'ja');
  } finally {
    languageState.app = languageState.moment = 'en';
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow); else delete (globalThis as any).window;
    if (previousDocument) Object.defineProperty(globalThis, 'document', previousDocument); else delete (globalThis as any).document;
  }
});
