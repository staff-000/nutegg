// ============================================================
// NutEgg Chrome Extension YouTube Extractor Tests
// ============================================================

const test = require("node:test");
const assert = require("node:assert/strict");

// Provide globals needed by youtube.js
global.parseTimestamp = function (ts) {
  const parts = ts.slice(1, -1).split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return -1;
};

const {
  decodeHtmlEntities,
  dedupChapters,
} = require("../src/content/extractors/youtube.js");

test("decodeHtmlEntities - decodes HTML entities and non-BMP unicode (emojis)", () => {
  assert.equal(
    decodeHtmlEntities("&amp; &quot; &#39; &lt; &gt;"),
    "& \" ' < >"
  );
  // Decimal emoji 😀 (128512 / 0x1F600)
  assert.equal(decodeHtmlEntities("Hello &#128512; world"), "Hello 😀 world");
  // Hex emoji 🚀 (0x1F680)
  assert.equal(decodeHtmlEntities("Blast off &#x1F680;!"), "Blast off 🚀!");
  // Regular unicode
  assert.equal(decodeHtmlEntities("&#x2014;"), "—");
});

test("dedupChapters - removes duplicates and stops on loop restart", () => {
  const chapters = [
    { time: "0:00", title: "Intro" },
    { time: "01:30", title: "Chapter 1" },
    { time: "05:00", title: "Chapter 2" },
    // Loop restart to earlier time (e.g. 0:10 or 0:00)
    { time: "0:10", title: "Intro again" },
    { time: "01:30", title: "Chapter 1 again" },
  ];

  const deduped = dedupChapters(chapters);
  assert.equal(deduped.length, 3);
  assert.equal(deduped[0].title, "Intro");
  assert.equal(deduped[1].title, "Chapter 1");
  assert.equal(deduped[2].title, "Chapter 2");
});


test('caption metadata records the successful fallback route and is included in the capture', async () => {
  const vm = require('node:vm');
  const fs = require('node:fs');
  const code = fs.readFileSync(require.resolve('../src/content/extractors/youtube.js'), 'utf8');
  for (const route of ['page_tracks', 'watch_page', 'innertube', 'player_tracks', 'transcript_panel', 'none']) {
    const context = vm.createContext({
      URL, console: { log() {} }, route,
      window: { location: { href: 'https://www.youtube.com/watch?v=test' } },
      document: { querySelector() { return null; } },
      captureFetchText: async () => ({ text: route === 'watch_page' ? '"captionTracks":[{"route":"watch_page"}]' : '' }),
      extractBalanced: () => '[{"route":"watch_page"}]',
      truncate: text => text, estimateTime: () => 1,
    });
    vm.runInContext(code, context);
    vm.runInContext(`
      readYtInitialPlayerResponse = () => null;
      findCaptionTracksInDom = () => route === 'page_tracks' ? [{route}] : null;
      fetchInnertubePlayer = async () => route === 'innertube' ? {captions: {playerCaptionsTracklistRenderer: {captionTracks: [{route}]}}} : null;
      queryPlayerCaptionTracks = async () => route === 'player_tracks' ? [{route}] : null;
      fetchTimedtext = async tracks => tracks?.[0]?.route === route ? '[00:01] Caption' : '';
      readTranscriptPanel = async () => route === 'transcript_panel' ? '[00:01] Caption' : '';
      extractYouTubeMetadata = () => ({title: 'Test', videoId: 'test', durationSeconds: 60});
      extractChapters = async () => [];
    `, context);
    const metadata = { caption_source: 'stale_route' };
    await context.fetchYouTubeCaptions(metadata);
    const capture = await context.extractYouTube();
    if (route === 'none') {
      assert.equal('caption_source' in metadata, false);
      assert.equal('caption_source' in capture.metadata, false);
    } else {
      assert.equal(metadata.caption_source, route);
      assert.equal(capture.metadata.caption_source, route);
    }
  }
});

test('stale player response and caption tracks from the previous video are ignored', () => {
  const vm = require('node:vm');
  const fs = require('node:fs');
  const oldResponse = { videoDetails: { videoId: 'old' }, captions: { playerCaptionsTracklistRenderer: { captionTracks: [{ baseUrl: 'https://www.youtube.com/api/timedtext?v=old' }] } } };
  const scripts = [{ textContent: `var ytInitialPlayerResponse = ${JSON.stringify(oldResponse)};` }];
  const context = vm.createContext({ URL, window: { location: { href: 'https://www.youtube.com/watch?v=new' } }, document: { querySelectorAll: () => scripts } });
  for (const file of ['utils', 'extractors/youtube']) vm.runInContext(fs.readFileSync(require.resolve(`../src/content/${file}.js`), 'utf8'), context);
  assert.equal(context.readYtInitialPlayerResponse(), null);
  assert.equal(context.findCaptionTracksInDom(), null);
  scripts.push({ textContent: '"captionTracks":[{"baseUrl":"https://www.youtube.com/api/timedtext?v=new"}]' });
  assert.equal(context.findCaptionTracksInDom()[0].baseUrl, 'https://www.youtube.com/api/timedtext?v=new');
});

test('confirmed unavailable videos finish without repeated network or DOM caption attempts', async () => {
  const vm = require('node:vm');
  const fs = require('node:fs');
  const context = vm.createContext({ URL, window: { location: { href: 'https://www.youtube.com/watch?v=one' } }, document: {} });
  vm.runInContext(fs.readFileSync(require.resolve('../src/content/extractors/youtube.js'), 'utf8'), context);
  context.readYtInitialPlayerResponse = () => ({ videoDetails: { videoId: 'one' }, playabilityStatus: { status: 'UNPLAYABLE' } });
  context.captureFetchText = () => assert.fail('Must not fetch unavailable captions');
  const metadata = {};
  assert.equal(await context.fetchYouTubeCaptions(metadata), '');
  assert.equal(metadata.caption_unavailable, true);
});

test('readTranscriptPanel never clicks Download or Share action buttons', async () => {
  const { JSDOM } = require('jsdom');
  const dom = new JSDOM(`
    <ytd-watch-metadata>
      <div id="actions">
        <ytd-menu-renderer>
          <div id="top-level-buttons-computed">
            <ytd-download-button-renderer>
              <yt-button-shape>
                <button id="download-btn" aria-label="Download">Download</button>
              </yt-button-shape>
            </ytd-download-button-renderer>
            <ytd-button-renderer>
              <yt-button-shape>
                <button id="share-btn" aria-label="Share">Share</button>
              </yt-button-shape>
            </ytd-button-renderer>
          </div>
        </ytd-menu-renderer>
      </div>
    </ytd-watch-metadata>
  `);
  let clickedDownload = false;
  let clickedShare = false;
  dom.window.document.getElementById('download-btn').addEventListener('click', () => { clickedDownload = true; });
  dom.window.document.getElementById('share-btn').addEventListener('click', () => { clickedShare = true; });

  const vm = require('node:vm');
  const fs = require('node:fs');
  const context = vm.createContext({
    URL,
    window: dom.window,
    document: dom.window.document,
    console: { log() {}, warn() {} },
    setTimeout,
    clearTimeout,
    Promise,
    decodeHtmlEntities: s => s,
    dedupTranscriptLines: lines => lines,
    waitFor: async () => null,
  });
  vm.runInContext(fs.readFileSync(require.resolve('../src/content/extractors/youtube.js'), 'utf8'), context);

  await context.readTranscriptPanel();
  assert.equal(clickedDownload, false);
  assert.equal(clickedShare, false);
});

