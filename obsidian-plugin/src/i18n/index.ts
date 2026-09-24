import { en, type TranslationKey } from "./en";
import { zh } from "./zh";

export type { TranslationKey };

const translations: Record<string, Record<TranslationKey, string>> = {
  en,
  zh,
};

/**
 * Detect current Obsidian language or fallback to 'en'.
 */
export function getLanguage(): string {
  try {
    const lang = (window?.localStorage?.getItem("language") || navigator?.language || "en").toLowerCase();
    if (lang.startsWith("zh")) {
      return "zh";
    }
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

