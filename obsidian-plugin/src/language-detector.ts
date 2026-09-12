/**
 * Simple script-based language detector for note titles and descriptions.
 * Detects Chinese, Japanese, Korean, Russian, Arabic, and English/Latin.
 */
export function detectLanguage(text: string): string {
  if (!text || !text.trim()) return "";
  const trimmed = text.trim();

  // Japanese Kana (Hiragana or Katakana)
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(trimmed)) {
    return "Japanese";
  }
  // Korean Hangul
  if (/[\uAC00-\uD7AF\u1100-\u11FF]/.test(trimmed)) {
    return "Korean";
  }
  // Chinese CJK Unified Ideographs
  if (/[\u4E00-\u9FFF]/.test(trimmed)) {
    return "Chinese";
  }
  // Cyrillic / Russian
  if (/[\u0400-\u04FF]/.test(trimmed)) {
    return "Russian";
  }
  // Arabic
  if (/[\u0600-\u06FF]/.test(trimmed)) {
    return "Arabic";
  }
  // Latin / English
  if (/[a-zA-Z]/.test(trimmed)) {
    return "English";
  }
  return "";
}

