import { en, type TranslationKey } from "./en";
import { zh } from "./zh";
import { es } from "./es";
import { ja } from "./ja";
import { ko } from "./ko";
import { ar } from "./ar";
import { fr } from "./fr";
import { de } from "./de";
import { pt } from "./pt";
import { ru } from "./ru";

export type { TranslationKey };

const translations: Record<string, Record<TranslationKey, string>> = {
  en,
  zh,
  es,
  ja,
  ko,
  ar,
  fr,
  de,
  pt,
  ru,
};

/**
 * Detect current Obsidian language or fallback to 'en'.
 */
export function getLanguage(): string {
  try {
    const lang = (window?.localStorage?.getItem("language") || navigator?.language || "en").toLowerCase();
    if (lang.startsWith("zh")) return "zh";
    if (lang.startsWith("es")) return "es";
    if (lang.startsWith("ja")) return "ja";
    if (lang.startsWith("ko")) return "ko";
    if (lang.startsWith("ar")) return "ar";
    if (lang.startsWith("fr")) return "fr";
    if (lang.startsWith("de")) return "de";
    if (lang.startsWith("pt")) return "pt";
    if (lang.startsWith("ru")) return "ru";
  } catch {
    // ignore
  }
  return "en";
}

/**
 * Get translated text for a key with optional variable interpolation.
 */
export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  const lang = getLanguage();
  const dict = translations[lang] || translations.en;
  let str = dict[key] || translations.en[key] || key;

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }

  return str;
}
