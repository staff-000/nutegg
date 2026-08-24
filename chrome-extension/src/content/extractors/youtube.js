// ============================================================
// NutEgg Extractor: YouTube (video pages)
// ============================================================
//
// Detects youtube.com/watch pages and extracts title, channel,
// description, chapters, and captions/transcript.
//
// Depends on: utils.js (extractText, getMeta, truncate, estimateTime,
//   waitFor, extractBalanced, formatTime, parseTimestamp)

function detectYouTube() {
  return window.location.href.includes("youtube.com/watch");
}

async function extractYouTube() {
  const url = window.location.href;

  const title =
    document.querySelector("h1.ytd-watch-metadata yt-formatted-string")?.textContent?.trim() ||
    document.querySelector("h1 yt-formatted-string")?.textContent?.trim() ||
    document.querySelector('meta[name="title"]')?.getAttribute("content")?.trim() ||
    document.title.replace(" - YouTube", "").trim();

  const channelName =
    document.querySelector("#channel-name yt-formatted-string a")?.textContent?.trim() ||
    document.querySelector("ytd-channel-name yt-formatted-string a")?.textContent?.trim() ||
    document.querySelector("#owner-name a")?.textContent?.trim() || "";

  // Description
  const descEl = document.querySelector("#description-inline-expander, ytd-expander#description");
  let description = "";
  if (descEl) {
    const snippet = descEl.querySelector("yt-formatted-string, #snippet") ||
      descEl.querySelector('[slot="content"]');
    if (snippet) description = snippet.textContent?.trim() || "";
  }
  if (!description) description = getMeta("og:description");

  // Stats
  const viewCount = document.querySelector("#info .view-count")?.textContent?.trim() || "";
  const date = document.querySelector("#info yt-formatted-string.date")?.textContent?.trim() ||
    getMeta("datePublished") || "";

  // Chapters (with timestamps, for the clickable Chapter Map)
  const chapters = await extractChapters();

  // Captions / transcript via YouTube timedtext API
  let transcript = "";
  try {
    transcript = await fetchYouTubeCaptions();
  } catch {
    // Captions not available — that's fine
  }

  const videoId = new URL(url).searchParams.get("v") || "";
  const parts = [`# ${title}`];
  if (channelName) parts.push(`**Channel:** ${channelName}`);
  if (viewCount) parts.push(`**Views:** ${viewCount}`);
  if (date) parts.push(`**Published:** ${date}`);
  if (videoId) parts.push(`**Video ID:** ${videoId}`);

  if (description) {
    parts.push(`\n## Description\n\n${description}`);
  }
  if (chapters.length > 0) {
    parts.push(`\n## Chapters\n\n${chapters.map((c) => `- ${c.time} — ${c.title}`).join("\n")}`);
  }
  if (transcript) {
    // 100k chars ≈ 2 hours of speech — only a sanity cap, so long videos
    // keep their full transcript (the AI trims its own prompt window).
    parts.push(`\n## Transcript\n\n${truncate(transcript, 100000)}`);
  } else {
    parts.push(`\n## Transcript\n\n*No transcript available for this video.*`);
  }

  return {
    url, title,
    content: parts.join("\n"),
    sourceType: "youtube",
    chapters,
    // False when captions could not be fetched — the popup refuses to
    // analyze, because description-only analysis would be misleading.
    transcriptAvailable: !!transcript,
    metadata: {
      platform: "YouTube",
      ...(channelName && { channel: channelName }),
      ...(date && { published: date }),
      ...(videoId && { video_id: videoId }),
      time_estimate_minutes: estimateTime(parts.join(" "), "youtube"),
    },
  };
}

/**
 * Fetch YouTube captions via the timedtext API (no auth required).
 *
 * Three layers, in order:
 *   1. `ytInitialPlayerResponse` parsed from the page's own <script> tag
 *      (page globals are NOT visible to the isolated content-script world,
 *      but the script tag's text is plain DOM).
 *   2. The watch-page HTML (same-origin fetch) — `captionTracks` extracted
 *      with balanced-bracket scanning, not a truncating regex.
 *   3. The on-page transcript panel ("Show transcript" → segments), which
 *      works even when the player response is missing (consent walls, ...).
 */
async function fetchYouTubeCaptions() {
  const videoId = new URL(window.location.href).searchParams.get("v");
  if (!videoId) return "";

  // Layer 1: ytInitialPlayerResponse from the page's <script> tag
  let tracks =
    readYtInitialPlayerResponse()?.captions?.playerCaptionsTracklistRenderer
      ?.captionTracks;
  if (tracks?.length) {
    const transcript = await fetchTimedtext(tracks);
    if (transcript) return transcript;
  }

  // Layer 2: watch-page HTML
  try {
    const resp = await fetch(
      `https://www.youtube.com/watch?v=${videoId}&gl=US&hl=en`
    );
    const html = await resp.text();
    const raw = extractBalanced(html, html.indexOf('"captionTracks"'));
    if (raw) {
      tracks = JSON.parse(raw);
      if (Array.isArray(tracks) && tracks.length > 0) {
        const transcript = await fetchTimedtext(tracks);
        if (transcript) return transcript;
      }
    }
  } catch {
    // Fall through to the transcript panel
  }

  // Layer 3: the on-page transcript panel
  return readTranscriptPanel();
}

/**
 * Pick the best caption track and fetch its timedtext XML.
 * English is preferred, then non-auto-generated, then whatever exists.
 */
async function fetchTimedtext(tracks) {
  if (!Array.isArray(tracks) || tracks.length === 0) return "";
  const pick =
    tracks.find((t) => t.languageCode === "en" && t.kind !== "asr") ||
    tracks.find((t) => t.languageCode === "en") ||
    tracks.find((t) => t.kind !== "asr") ||
    tracks[0];
  if (!pick?.baseUrl) return "";
  // baseUrl escapes & as \u0026 — normalize before fetching
  const url = pick.baseUrl.replace(/\\u0026/g, "&");
  const resp = await fetch(url);
  if (!resp.ok) return "";
  return parseYouTubeCaptionXML(await resp.text());
}

/**
 * Video chapters — four layers, in order:
 *   1. ytInitialPlayerResponse → multiMarkersPlayerBarRenderer (chapter ring)
 *   2. ytInitialData → macroMarkersListItemRenderer (description chapters)
 *   3. the chapter list already visible in the DOM
 *   4. open the on-page chapter panel, read its items, close it again
 * Each layer logs which one produced the list, for easy debugging.
 */
function extractChapters() {
  // Layer 1: player response — the source the chapter ring renders from
  const pr = readYtInitialPlayerResponse();
  const markerPaths = [
    pr?.playerOverlays?.playerOverlayRenderer?.decoratedPlayerBarRenderer
      ?.decoratedPlayerBarRenderer?.playerBar?.multiMarkersPlayerBarRenderer
      ?.markersMap,
    pr?.playerOverlays?.playerOverlayRenderer?.decoratedPlayerBarRenderer
      ?.playerBar?.multiMarkersPlayerBarRenderer?.markersMap,
  ];
  for (const markers of markerPaths) {
    const chapters = chaptersFromMarkersMap(markers);
    if (chapters.length > 0) {
      console.log(`[NutEgg] Chapters: ${chapters.length} from player response`);
      return chapters;
    }
  }

  // Layer 2: ytInitialData — macro markers (description chapter list)
  const initialData = readYtInitialData();
  const macroChapters = chaptersFromMacroMarkers(initialData);
  if (macroChapters.length > 0) {
    console.log(`[NutEgg] Chapters: ${macroChapters.length} from ytInitialData`);
    return macroChapters;
  }

  // Layer 3: chapter list already rendered in the DOM
  const domChapters = readChapterListDom();
  if (domChapters.length > 0) {
    console.log(`[NutEgg] Chapters: ${domChapters.length} from DOM list`);
    return domChapters;
  }

  // Layer 4: open the chapter panel, read, close (async — handled below)
  return readChapterPanel().then((chapters) => {
    if (chapters.length > 0) {
      console.log(`[NutEgg] Chapters: ${chapters.length} from chapter panel`);
    } else {
      console.log("[NutEgg] Chapters: none found (player response parsed:", pr !== null, ")");
    }
    return chapters;
  });
}

/** Chapters from a multiMarkersPlayerBarRenderer markersMap array. */
function chaptersFromMarkersMap(markers) {
  if (!Array.isArray(markers)) return [];
  for (const m of markers) {
    const list = m?.value?.chapters;
    if (!Array.isArray(list) || list.length === 0) continue;
    const out = [];
    for (const c of list) {
      const ms = c?.chapterRenderer?.timeRangeStartMillis;
      const title =
        c?.chapterRenderer?.title?.simpleText ||
        (c?.chapterRenderer?.title?.runs || []).map((x) => x.text).join("");
      if (ms != null && title) out.push({ time: formatTime(ms / 1000), title: cleanChapterTitle(title) });
    }
    const deduped = dedupChapters(out);
    if (deduped.length > 0) return deduped;
  }
  return [];
}

/** Chapters from macroMarkersListItemRenderer objects anywhere in the data. */
function chaptersFromMacroMarkers(data) {
  const found = [];
  if (!data || typeof data !== "object") return found;
  (function walk(node) {
    if (!node || typeof node !== "object" || found.length >= 500) return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    if ("macroMarkersListItemRenderer" in node) {
      const r = node.macroMarkersListItemRenderer;
      const title =
        r?.title?.simpleText || (r?.title?.runs || []).map((x) => x.text).join("");
      const timeDesc =
        r?.timeDescription?.simpleText ||
        (r?.timeDescription?.runs || []).map((x) => x.text).join("");
      if (title && timeDesc) {
        found.push({
          time: timeDesc,
          title: cleanChapterTitle(title),
        });
      }
      return;
    }
    for (const v of Object.values(node)) walk(v);
  })(data);
  return dedupChapters(found);
}

/** `ytd-macro-markers-list-item-renderer` items currently in the DOM. */
function readChapterListDom() {
  const chapters = [];
  document.querySelectorAll("ytd-macro-markers-list-item-renderer").forEach((el) => {
    const time = el.querySelector("#time")?.textContent?.trim();
    // YouTube's h4 contains both #title and child yt-formatted-string or spans, which causes textContent to repeat if we query `h4` directly
    const titleEl = el.querySelector("h4 yt-formatted-string, h4 [id='title'], h4 #endpoint") || el.querySelector("h4");
    const rawTitle = titleEl?.textContent?.trim() || "";
    const title = cleanChapterTitle(rawTitle);
    if (time && title) chapters.push({ time, title });
  });
  return dedupChapters(chapters);
}

/** Clean chapter title: strip timestamps and eliminate duplicated repeated strings. */
function cleanChapterTitle(raw) {
  if (!raw) return "";
  let title = raw.replace(/\r?\n+/g, " ").replace(/\s+/g, " ").trim();
  // Strip leading timestamp if present: e.g. "0:00 - Intro", "[01:23] Intro", "0:00 Intro"
  title = title.replace(/^\[?\d{1,2}:\d{2}(?::\d{2})?\]?\s*[-—–:]?\s*/, "").trim();

  // Check for duplicated halves:
  // Case A: "Introduction - Introduction"
  const midDash = title.split(/\s*[-—–]\s*/);
  if (midDash.length === 2 && midDash[0].trim() && midDash[0].trim() === midDash[1].trim()) {
    title = midDash[0].trim();
  } else {
    // Case B: "Introduction Introduction" (even split by words)
    const words = title.split(" ");
    if (words.length >= 2 && words.length % 2 === 0) {
      const half1 = words.slice(0, words.length / 2).join(" ");
      const half2 = words.slice(words.length / 2).join(" ");
      if (half1 === half2) {
        title = half1;
      }
    } else {
      // Case C: "IntroductionIntroduction" (no space, exact even string split)
      const len = title.length;
      if (len >= 4 && len % 2 === 0) {
        const half1 = title.slice(0, len / 2);
        const half2 = title.slice(len / 2);
        if (half1 === half2) {
          title = half1;
        }
      }
    }
  }

  return title.trim();
}

/** Deduplicate chapters array by timestamp and eliminate looped/duplicated sequences. */
function dedupChapters(chapters) {
  if (!Array.isArray(chapters) || chapters.length === 0) return [];
  const out = [];
  const seenTimes = new Set();
  let lastSeconds = -1;

  for (const c of chapters) {
    const time = (c.time || "").trim();
    const title = cleanChapterTitle(c.title || "");
    if (!time || !title) continue;

    const seconds = parseTimestamp(`[${time.replace(/^\[|\]$/g, "")}]`);
    // If the list starts repeating from 0 or earlier time, or duplicate timestamp
    if (seenTimes.has(time) || (seconds >= 0 && seconds <= lastSeconds && seenTimes.size >= 2)) {
      if (seconds >= 0 && seconds <= 0 && seenTimes.size >= 2) break;
      continue;
    }

    seenTimes.add(time);
    if (seconds >= 0) lastSeconds = seconds;
    out.push({ time, title });
  }

  return out;
}

/** Open the chapter-list panel (player chapter button), read it, close it. */
async function readChapterPanel() {
  try {
    const button = [...document.querySelectorAll("button")].find((b) => {
      const label = (b.getAttribute("aria-label") || "").toLowerCase();
      return label === "chapters" || label.includes("chapters");
    });
    if (button) button.click();

    const items = await waitFor(() => {
      const els = document.querySelectorAll("ytd-macro-markers-list-item-renderer");
      return els.length > 0 ? els : null;
    }, 3000);
    if (!items) return [];

    const chapters = readChapterListDom();

    const closeBtn = document.querySelector(
      "ytd-engagement-panel-title-header-renderer #close-button"
    );
    closeBtn?.click();

    return chapters;
  } catch {
    return [];
  }
}

/**
 * Parse a top-level `var ytXxx = {...}` JSON object from the page's <script>
 * tags. Content scripts cannot see page globals (isolated world), but the
 * script tag text is regular DOM — extract with balanced-brace scanning.
 */
function readYtVar(name) {
  for (const script of document.querySelectorAll("script")) {
    const text = script.textContent || "";
    const marker = text.indexOf(name);
    if (marker === -1) continue;
    const eq = text.indexOf("=", marker);
    if (eq === -1) continue;
    const json = extractBalanced(text, eq + 1);
    if (!json) continue;
    try {
      return JSON.parse(json);
    } catch {
      // Try the next script tag
    }
  }
  return null;
}

/** The page's `ytInitialPlayerResponse` (captions, chapters, ...). */
function readYtInitialPlayerResponse() {
  return readYtVar("ytInitialPlayerResponse");
}

/** The page's `ytInitialData` (description chapter markers, ...). */
function readYtInitialData() {
  return readYtVar("ytInitialData");
}

/**
 * Open the "Show transcript" panel, read its segments, and close it again.
 * The last resort — works even when the player response and page HTML are
 * unavailable (consent walls, A/B layouts, ...).
 */
async function readTranscriptPanel() {
  try {
    let button = document.querySelector(
      "ytd-video-description-transcript-section-renderer button"
    );
    if (!button) {
      button = [...document.querySelectorAll("button")].find((b) => {
        const label = (b.getAttribute("aria-label") || "").toLowerCase();
        const text = (b.textContent || "").trim().toLowerCase();
        return label.includes("transcript") || text === "show transcript";
      });
    }
    if (button) button.click();

    const segments = await waitFor(() => {
      const els = document.querySelectorAll("ytd-transcript-segment-renderer");
      return els.length > 0 ? els : null;
    }, 3000);
    if (!segments) return "";

    const lines = [...segments]
      .map((s) => {
        const t = s.querySelector(".segment-timestamp")?.textContent?.trim() || "";
        const text = s.querySelector(".segment-text, yt-formatted-string")?.textContent?.trim() || "";
        return text ? (t ? `[${t}] ${text}` : text) : "";
      })
      .filter(Boolean);

    // Restore the panel state when we opened it
    const closeBtn = document.querySelector(
      "ytd-engagement-panel-title-header-renderer #close-button"
    );
    closeBtn?.click();

    return dedupTranscriptLines(lines).join("\n");
  } catch {
    return "";
  }
}

function parseYouTubeCaptionXML(xml) {
  const raw = [];
  const regex = /<text\b([^>]*)>([\s\S]*?)<\/text>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    const startAttr = (match[1].match(/\bstart="([\d.]+)"/) || [])[1];
    const start = startAttr !== undefined ? parseFloat(startAttr) : NaN;
    const text = match[2]
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
    if (!text) continue;
    // One line per caption with its timestamp — powers the chapter-aware
    // chunking and the clickable chapter map.
    raw.push(Number.isFinite(start) ? `[${formatTime(start)}] ${text}` : text);
  }
  const out = dedupTranscriptLines(raw);
  if (out.length < raw.length) {
    console.log(
      `[NutEgg] Captions: ${raw.length} raw segments → ${out.length} after dedup (YouTube duplication)`
    );
  }
  return out.join("\n");
}

/**
 * Remove repeated caption lines. YouTube serves duplicated caption spans for
 * long videos — sometimes with identical timestamps, sometimes as a verbatim
 * second copy of the whole track (different or missing start times). Rules:
 *   - drop any line whose text was already seen (normalized)
 *   - drop any line that doesn't advance the timeline
 *   - once several consecutive lines repeat, treat the REST of the track as
 *     a duplicate copy and stop (keeps legit repeated phrases intact)
 */
function dedupTranscriptLines(lines) {
  const out = [];
  const seen = new Set();
  let lastStart = -1;
  let repeatedRun = 0;

  for (const line of lines) {
    const timeMatch = line.trim().match(/^\[(\d{1,2}:)?(\d{1,2}):(\d{2})\]/);
    const start = timeMatch ? parseTimestamp(timeMatch[0]) : -1;
    const text = line.replace(/^\[[^\]]*\]\s*/, "").trim();
    const key = text.toLowerCase().replace(/\s+/g, " ").replace(/[^a-z0-9 ]/g, "");

    const isRepeat = (key && seen.has(key)) || (start >= 0 && start <= lastStart);
    if (isRepeat) {
      repeatedRun++;
      if (repeatedRun >= 3) break; // the rest is a duplicate copy of the track
      continue; // skip this duplicated line, keep scanning
    }
    repeatedRun = 0;
    if (key) seen.add(key);
    if (start >= 0) lastStart = start;
    out.push(line);
  }
  return out;
}
