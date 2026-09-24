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
import { getLanguage as getObsidianLanguage, moment } from "obsidian";

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
    let raw: string | undefined;

    // 1. Official Obsidian API: getLanguage() (available since Obsidian v1.8.7)
    try {
      if (typeof getObsidianLanguage === "function") {
        raw = getObsidianLanguage();
      }
    } catch {
      // ignore
    }

    // 2. Obsidian's persistent app language in localStorage (used in all Obsidian versions)
    if (!raw && typeof window !== "undefined" && window?.localStorage) {
      raw = window.localStorage.getItem("language") || undefined;
    }

    // 3. Obsidian's bundled Moment.js locale (set to the active language by Obsidian)
    if (!raw) {
      try {
        if (typeof moment?.locale === "function") {
          raw = moment.locale();
        } else if (typeof (window as any)?.moment?.locale === "function") {
          raw = (window as any).moment.locale();
        }
      } catch {
        // ignore
      }
    }

    // 4. HTML document element lang
    if (!raw && typeof document !== "undefined" && document.documentElement?.lang) {
      raw = document.documentElement.lang;
    }

    // 5. System/browser fallback
    if (!raw && typeof navigator !== "undefined" && navigator?.language) {
      raw = navigator.language;
    }

    const lang = (raw || "en").toLowerCase();
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
