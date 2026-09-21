// ============================================================
// NutEgg Content Chunker & Timestamp Utilities
// ============================================================

import type { ContentChunk } from "./types";

export const DEFAULT_CHUNK_WINDOW_CHARS = 30000;
export const DEFAULT_SECTION_SECS = 300;

/** Seconds of a `[MM:SS]` / `[H:MM:SS]` caption line, or null. */
export function lineSeconds(line: string): number | null {
  const m = line.trim().match(/^\[(\d{1,2}:)?(\d{1,2}):(\d{2})\]/);
  if (!m) return null;
  const parts = m[0].slice(1, -1).split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return null;
}

/** "MM:SS" / "H:MM:SS" -> seconds (0 when unparseable). */
export function toSeconds(time: string): number {
  const parts = (time || "").split(":").map(Number);
  if (parts.some((n) => Number.isNaN(n))) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

/** Seconds -> "MM:SS" / "H:MM:SS". */
export function formatSeconds(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** `**Part:** i of N (from MM:SS)` label for per-part calls. */
export function partNote(chunk: ContentChunk): string {
  const at = chunk.startTime ? ` (from ${chunk.startTime})` : "";
  return `**Part:** ${chunk.index + 1} of ${chunk.total}${at}`;
}

/**
 * Split plain text content into chunks by paragraphs.
 */
export function paragraphChunks(
  content: string,
  chapters: Array<{ time: string; title: string }>,
  chunkSize: number = DEFAULT_CHUNK_WINDOW_CHARS
): ContentChunk[] {
  const paras = content.split(/\n\n+/);
  const chunks: ContentChunk[] = [];
  let buf: string[] = [];
  let bufChars = 0;

  const flush = () => {
    if (!buf.length) return;
    chunks.push({
      index: 0,
      total: 0,
      content: buf.join("\n\n"),
      chapters: [],
      startTime: "",
      sections: [],
    });
    buf = [];
    bufChars = 0;
  };

  for (const p of paras) {
    if (p.length > chunkSize) {
      flush();
      // One oversized paragraph — hard-split by chars
      for (let i = 0; i < p.length; i += chunkSize) {
        chunks.push({
          index: 0,
          total: 0,
          content: p.slice(i, i + chunkSize),
          chapters: [],
          startTime: "",
          sections: [],
        });
      }
      continue;
    }
    if (bufChars + p.length > chunkSize) flush();
    buf.push(p);
    bufChars += p.length + 2;
  }
  flush();

  if (chunks.length === 0) {
    chunks.push({ index: 0, total: 1, content, chapters, startTime: "", sections: [] });
  }

  chunks.forEach((c, i) => {
    c.index = i;
    c.total = chunks.length;
  });
  if (chunks.length === 1) chunks[0].chapters = chapters;
  return chunks;
}

/**
 * Split timestamped transcript into chunks aligned to captions.
 */
export function timestampedChunks(
  lines: string[],
  firstTsIdx: number,
  chapters: Array<{ time: string; title: string }>,
  chunkSize: number = DEFAULT_CHUNK_WINDOW_CHARS,
  sectionGridSecs: number = DEFAULT_SECTION_SECS
): ContentChunk[] {
  // Title/meta/description lines before the first caption
  const preambleLines = lines.slice(0, firstTsIdx);
  const filteredPreamble: string[] = [];
  let inChaptersSection = false;

  for (const line of preambleLines) {
    if (line.trim().startsWith("## Chapters")) {
      inChaptersSection = true;
      continue;
    }
    if (inChaptersSection && line.trim().startsWith("#")) {
      inChaptersSection = false;
    }
    if (!inChaptersSection) {
      filteredPreamble.push(line);
    }
  }
  const cleanPreamble = filteredPreamble.join("\n").trim();

  const units: Array<{ sec: number; line: string }> = [];
  let lastCaptionSec = 0;
  for (let i = firstTsIdx; i < lines.length; i++) {
    const sec = lineSeconds(lines[i]);
    if (sec === null) continue;
    units.push({ sec, line: lines[i] });
    lastCaptionSec = Math.max(lastCaptionSec, sec);
  }

  const chunks: ContentChunk[] = [];
  let buf: string[] = [];
  let bufChars = 0;
  let startSec = 0;

  const flush = () => {
    if (!buf.length) return;
    chunks.push({
      index: 0,
      total: 0,
      content: buf.join("\n"),
      chapters: [],
      startTime: formatSeconds(startSec),
      sections: [],
    });
    buf = [];
    bufChars = 0;
  };

  for (const u of units) {
    if (bufChars + u.line.length > chunkSize) flush();
    if (!buf.length) startSec = u.sec;
    buf.push(u.line);
    bufChars += u.line.length + 1;
  }
  flush();

  if (chunks.length === 0) {
    return paragraphChunks(lines.join("\n"), chapters, chunkSize);
  }

  // Attach each chapter to the chunk covering its start time
  const starts = chunks.map((c) => toSeconds(c.startTime));
  for (const ch of chapters) {
    const t = toSeconds(ch.time);
    let idx = 0;
    for (let i = starts.length - 1; i >= 0; i--) {
      if (t >= starts[i]) {
        idx = i;
        break;
      }
    }
    chunks[idx].chapters.push(ch);
  }

  // Videos WITHOUT chapter markers: build continuous section grid
  if (chapters.length === 0 && lastCaptionSec >= sectionGridSecs) {
    const begins = chunks.map((c) => toSeconds(c.startTime));
    for (let t = 0; t < lastCaptionSec + 1; t += sectionGridSecs) {
      let idx = 0;
      for (let i = begins.length - 1; i >= 0; i--) {
        if (t >= begins[i]) {
          idx = i;
          break;
        }
      }
      chunks[idx].sections.push(formatSeconds(t));
    }
  }

  chunks.forEach((c, i) => {
    c.index = i;
    c.total = chunks.length;
    if (chunks.length === 1) {
      c.content = `${preambleLines.join("\n")}\n\n${c.content}`;
    } else if (cleanPreamble) {
      c.content = `${cleanPreamble}\n\n${c.content}`;
    }
  });

  return chunks;
}

/**
 * Split content into <=chunkWindowChars parts. Timestamped transcripts
 * (YouTube) are split at caption lines and chapters are attached to the
 * chunk covering their start time; plain text is split at paragraphs.
 */
export function chunkContent(
  content: string,
  chapters: Array<{ time: string; title: string }> = [],
  chunkWindowChars: number = DEFAULT_CHUNK_WINDOW_CHARS,
  sectionGridSeconds: number = DEFAULT_SECTION_SECS
): ContentChunk[] {
  const lines = (content || "").split("\n");
  const firstTsIdx = lines.findIndex((l) => lineSeconds(l) !== null);
  if (firstTsIdx !== -1) {
    return timestampedChunks(
      lines,
      firstTsIdx,
      chapters,
      chunkWindowChars,
      sectionGridSeconds
    );
  }
  if (content.length <= chunkWindowChars) {
    return [
      { index: 0, total: 1, content, chapters, startTime: "", sections: [] },
    ];
  }
  return paragraphChunks(content, chapters, chunkWindowChars);
}

