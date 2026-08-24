// ============================================================
// NutEgg Extractor: YouTube (video pages)
// ============================================================
//
// Detects youtube.com/watch pages and extracts title, channel,
// description, chapters, and captions/transcript.
//
// Depends on: utils.js (extractText, getMeta, truncate, estimateTime,
//   waitFor, extractBalanced, formatTime, parseTimestamp, fetchWithTimeout)

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
 * Four layers, in order:
 *   1. `captionTracks` scanned from the page's `<script>` tags & player response
 *   2. The watch-page HTML (same-origin fetch) — `captionTracks` extracted
 *      (skipped when the player response parsed — it holds the same data)
 *   3. YouTube Innertube player API (`/youtubei/v1/player`) — fresh track
 *      URLs, plus tracks the page's player response omits
 *   4. The on-page transcript panel ("Show transcript" → segments)
 *
 * Every network layer has a timeout — a stalled request must never hang
 * extraction. Each layer logs its outcome for debugging.
 */
async function fetchYouTubeCaptions() {
  const videoId = new URL(window.location.href).searchParams.get("v");
  if (!videoId) return "";

  const started = Date.now();
  const pr = readYtInitialPlayerResponse();

  // Layer 1: captionTracks from DOM scripts / ytInitialPlayerResponse
  let tracks =
    findCaptionTracksInDom() ||
    pr?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (tracks?.length) {
    const transcript = await fetchTimedtext(tracks);
    if (transcript) {
      console.log(`[NutEgg] Captions: page tracks in ${Date.now() - started}ms`);
      return transcript;
    }
  }

  // Layer 2: watch-page HTML — the raw string scan can find captionTracks
  // that readYtVar missed (failed parse, renamed var, ...)
  if (!pr) {
    try {
      const resp = await fetchWithTimeout(
        `https://www.youtube.com/watch?v=${videoId}&gl=US&hl=en`,
        {},
        10000
      );
      const html = await resp.text();
      const idx = html.indexOf('"captionTracks"');
      if (idx !== -1) {
        const raw = extractBalanced(html, idx);
        if (raw) {
          tracks = JSON.parse(raw);
          if (Array.isArray(tracks) && tracks.length > 0) {
            const transcript = await fetchTimedtext(tracks);
            if (transcript) {
              console.log(`[NutEgg] Captions: watch-page HTML in ${Date.now() - started}ms`);
              return transcript;
            }
          }
        }
      }
    } catch {
      // Fall through
    }
  }

  // Layer 3: Innertube player API — always worth one (timeout-bounded) call:
  // it can succeed even when the page's own tracks are missing or stale.
  try {
    const playerResp = await fetchInnertubePlayer(videoId);
    const innertubeTracks =
      playerResp?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (Array.isArray(innertubeTracks) && innertubeTracks.length > 0) {
      const transcript = await fetchTimedtext(innertubeTracks);
      if (transcript) {
        console.log(`[NutEgg] Captions: innertube in ${Date.now() - started}ms`);
        return transcript;
      }
    }
  } catch {
    // Fall through to transcript panel
  }

  // Layer 4: the on-page transcript panel
  const panel = await readTranscriptPanel();
  console.log(
    panel
      ? `[NutEgg] Captions: transcript panel in ${Date.now() - started}ms`
      : `[NutEgg] Captions: all layers failed in ${Date.now() - started}ms (player response parsed: ${pr !== null})`
  );
  return panel;
}

/**
 * Scan all <script> tags in the current page DOM for `"captionTracks"`.
 */
function findCaptionTracksInDom() {
  for (const script of document.querySelectorAll("script")) {
    const text = script.textContent || "";
    const idx = text.indexOf('"captionTracks"');
    if (idx === -1) continue;
    const raw = extractBalanced(text, idx);
    if (raw) {
      try {
        const tracks = JSON.parse(raw);
        if (Array.isArray(tracks) && tracks.length > 0) return tracks;
      } catch {}
    }
  }
  return null;
}

/**
 * Fetch video metadata via YouTube's public web client API.
 */
async function fetchInnertubePlayer(videoId) {
  const resp = await fetchWithTimeout(
    "https://www.youtube.com/youtubei/v1/player?prettyPrint=false",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videoId,
        context: {
          client: {
            clientName: "WEB",
            clientVersion: "2.20240101.00.00",
            hl: "en",
            gl: "US",
          },
        },
      }),
    },
    8000
  );
  if (!resp.ok) return null;
  return resp.json();
}

/** "json3" / "srv3" / "default" label for a timedtext URL, for logs. */
function timedtextFormat(url) {
  if (url.includes("fmt=json3")) return "json3";
  if (url.includes("fmt=srv3")) return "srv3";
  return "default";
}

/**
 * Pick the best caption track and fetch it, each attempt timeout-bounded.
 *
 * `&fmt=json3` goes FIRST: it is the fastest-responding format and the
 * richest for parsing, while the bare default endpoint now stalls for many
 * signed URLs. The bare URL and srv3 stay as fallbacks.
 */
async function fetchTimedtext(tracks) {
  if (!Array.isArray(tracks) || tracks.length === 0) return "";
  const pick =
    tracks.find((t) => t.languageCode === "en" && t.kind !== "asr") ||
    tracks.find((t) => t.languageCode === "en") ||
    tracks.find((t) => (t.languageCode || "").startsWith("en") && t.kind !== "asr") ||
    tracks.find((t) => (t.languageCode || "").startsWith("en")) ||
    tracks.find((t) => t.kind !== "asr") ||
    tracks[0];
  if (!pick?.baseUrl) return "";

  const baseUrl = pick.baseUrl.replace(/\\u0026/g, "&");
  const urls = baseUrl.includes("fmt=")
    ? [baseUrl]
    : [`${baseUrl}&fmt=json3`, baseUrl, `${baseUrl}&fmt=srv3`];

  for (const url of urls) {
    try {
      const resp = await fetchWithTimeout(url, {}, 5000);
      if (!resp.ok) {
        console.warn(`[NutEgg] Captions: ${timedtextFormat(url)} → HTTP ${resp.status}`);
        continue;
      }
      const parsed = parseYouTubeCaptionResponse(await resp.text());
      if (parsed) return parsed;
      console.warn(`[NutEgg] Captions: ${timedtextFormat(url)} → unparseable response`);
    } catch (err) {
      console.warn(
        `[NutEgg] Captions: ${timedtextFormat(url)} → ${err.name === "AbortError" ? "timed out" : err.message}`
      );
    }
  }

  return "";
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
    // 1. Try expanding the description first if it's collapsed
    const expandBtn = document.querySelector(
      "#description-inline-expander #expand, ytd-expander#description #expand, #expand-button"
    );
    if (expandBtn && expandBtn.offsetParent !== null) {
      expandBtn.click();
      await new Promise((r) => setTimeout(r, 300));
    }

    // 2. Find and click the transcript button
    let button = document.querySelector(
      "ytd-video-description-transcript-section-renderer button, ytd-transcript-section-renderer button"
    );
    if (!button) {
      button = [...document.querySelectorAll("button")].find((b) => {
        const label = (b.getAttribute("aria-label") || "").toLowerCase();
        const text = (b.textContent || "").trim().toLowerCase();
        return (
          label.includes("transcript") ||
          text === "show transcript" ||
          text.includes("transcript")
        );
      });
    }
    if (button) button.click();

    // 3. Wait for transcript segment renderers to appear in the DOM
    const segments = await waitFor(() => {
      const els = document.querySelectorAll(
        "ytd-transcript-segment-renderer, .ytd-transcript-segment-renderer, ytd-transcript-segment-list-renderer [role='button']"
      );
      return els.length > 0 ? els : null;
    }, 4500);
    if (!segments || segments.length === 0) return "";

    const lines = [...segments]
      .map((s) => {
        const t =
          s.querySelector(".segment-timestamp, [class*='timestamp']")?.textContent?.trim() || "";
        const textEl =
          s.querySelector(".segment-text, yt-formatted-string, [class*='text']") || s;
        const text = decodeHtmlEntities(textEl.textContent?.trim() || "");
        return text ? (t ? `[${t}] ${text}` : text) : "";
      })
      .filter(Boolean);

    // Restore the panel state when we opened it
    const closeBtn = document.querySelector(
      "ytd-engagement-panel-title-header-renderer #close-button, ytd-engagement-panel-section-list-renderer #close-button"
    );
    closeBtn?.click();

    return dedupTranscriptLines(lines).join("\n");
  } catch {
    return "";
  }
}

/**
 * Parses caption responses from YouTube in JSON3, TTML / srv3, legacy XML, or WebVTT format.
 */
function parseYouTubeCaptionResponse(rawText) {
  if (!rawText || !rawText.trim()) return "";
  const trimmed = rawText.trim();

  // 1. JSON (json3 format: events array with segs)
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const data = JSON.parse(trimmed);
      const events = data.events;
      if (Array.isArray(events)) {
        const raw = [];
        for (const ev of events) {
          if (!ev.segs) continue;
          const text = decodeHtmlEntities(
            ev.segs.map((s) => s.utf8 || "").join("").trim()
          );
          if (!text || text === "\n") continue;
          const startMs = ev.tStartMs;
          if (startMs != null && !isNaN(startMs)) {
            raw.push(`[${formatTime(startMs / 1000)}] ${text}`);
          } else {
            raw.push(text);
          }
        }
        const out = dedupTranscriptLines(raw);
        if (out.length > 0) return out.join("\n");
      }
    } catch {}
  }

  // 2. XML formats
  const raw = [];

  // Format 2A: <text start="12.3">content</text>
  const textRegex = /<text\b([^>]*)>([\s\S]*?)<\/text>/gi;
  let match;
  while ((match = textRegex.exec(trimmed)) !== null) {
    const startAttr = (match[1].match(/\bstart="([\d.]+)"/i) || [])[1];
    const start = startAttr !== undefined ? parseFloat(startAttr) : NaN;
    const text = decodeHtmlEntities(match[2].replace(/<[^>]+>/g, "")).trim();
    if (text) {
      raw.push(Number.isFinite(start) ? `[${formatTime(start)}] ${text}` : text);
    }
  }

  // Format 2B: <p t="12340" d="3000">content</p> (srv3 format where t is milliseconds)
  if (raw.length === 0) {
    const pRegex = /<p\b([^>]*)>([\s\S]*?)<\/p>/gi;
    while ((match = pRegex.exec(trimmed)) !== null) {
      const tAttr = (match[1].match(/\bt="(\d+)"/i) || [])[1];
      const startMs = tAttr !== undefined ? parseInt(tAttr, 10) : NaN;
      const text = decodeHtmlEntities(match[2].replace(/<[^>]+>/g, "")).trim();
      if (text) {
        raw.push(Number.isFinite(startMs) ? `[${formatTime(startMs / 1000)}] ${text}` : text);
      }
    }
  }

  // 3. WebVTT format
  if (raw.length === 0 && trimmed.includes("-->")) {
    const vttLines = trimmed.split(/\r?\n/);
    let currentTime = "";
    for (const line of vttLines) {
      const timeMatch = line.match(/^(\d{1,2}:)?(\d{2}):(\d{2})\.\d{3}\s*-->/);
      if (timeMatch) {
        currentTime = line.split("-->")[0].trim().replace(/\.\d{3}$/, "");
      } else if (
        line.trim() &&
        !line.startsWith("WEBVTT") &&
        !line.match(/^\d+$/) &&
        currentTime
      ) {
        const text = decodeHtmlEntities(line.replace(/<[^>]+>/g, "")).trim();
        if (text) {
          raw.push(`[${currentTime}] ${text}`);
        }
      }
    }
  }

  const out = dedupTranscriptLines(raw);
  return out.join("\n");
}

/** Decodes XML and HTML entity strings into plain unicode characters. */
function decodeHtmlEntities(str) {
  if (!str) return "";
  return str
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\s+/g, " ");
}

/**
 * Remove repeated caption lines. YouTube serves duplicated caption spans for
 * long videos — sometimes with identical timestamps, sometimes as a verbatim
 * second copy of the whole track (different or missing start times). Rules:
 *   - drop any line whose text was already seen (normalized) — this also
 *     swallows a looped second copy of the track, line by line
 *   - drop any line where the timeline runs BACKWARDS (a looped copy
 *     restarting at 0:00)
 *   - drop lines whose whole text is just a timestamp ("0:01") — the ASR
 *     reading the on-screen timer / caption track markers
 *
 * Lines that share a whole-second timestamp are NOT duplicates — short
 * caption segments legitimately cluster inside one second (the timestamps
 * are quantized to whole seconds). Treating them as repeats truncated
 * transcripts mid-video (e.g. "stops at 00:38").
 */
function dedupTranscriptLines(lines) {
  const out = [];
  const seen = new Set();
  let lastStart = -1;
  let dropped = 0;

  for (const line of lines) {
    const timeMatch = line.trim().match(/^\[(\d{1,2}:)?(\d{1,2}):(\d{2})\]/);
    const start = timeMatch ? parseTimestamp(timeMatch[0]) : -1;
    const text = line.replace(/^\[[^\]]*\]\s*/, "").trim();

    // Junk: the whole caption is a timestamp (on-screen timer read by the ASR)
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(text)) {
      dropped++;
      continue;
    }

    // CJK-safe key: lowercase + collapsed whitespace only. (Stripping
    // non-Latin characters made every Chinese line's key empty, so the
    // text-dedup silently stopped working for non-English tracks.)
    const key = text.toLowerCase().replace(/\s+/g, " ").trim();

    const isRepeat =
      (key && seen.has(key)) ||
      (start >= 0 && start < lastStart); // backwards jump = looped copy
    if (isRepeat) {
      dropped++;
      continue;
    }
    if (key) seen.add(key);
    if (start >= 0) lastStart = start;
    out.push(line);
  }

  if (dropped > 0) {
    console.log(
      `[NutEgg] Captions: dedup dropped ${dropped} of ${lines.length} lines`
    );
  }
  return out;
}
