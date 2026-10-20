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
      URL, AbortController, setTimeout, clearTimeout, console: { log() {} }, route,
      window: { location: { href: 'https://www.youtube.com/watch?v=test' } },
      document: { querySelector() { return null; }, querySelectorAll() { return []; } },
      captureFetchText: async () => ({ text: route === 'watch_page' ? '"captionTracks":[{"route":"watch_page"}]' : '' }),
      extractBalanced: () => '[{"route":"watch_page"}]',
      truncate: text => text, estimateTime: () => 1,
    });
    vm.runInContext(code, context);
    vm.runInContext(`
      readYtInitialPlayerResponse = () => null;
      const track = source => ({route: source, baseUrl: 'https://www.youtube.com/api/timedtext?v=test&sig=one'});
      findCaptionTracksInDom = () => route === 'page_tracks' ? [track(route)] : null;
      fetchYouTubeWatchTracks = async () => route === 'watch_page' ? [track(route)] : [];
      queryYouTubePlayerSnapshot = async () => ({videoId:'test', tracks:route === 'player_tracks' ? [track(route)] : []});
      fetchInnertubePlayer = async () => route === 'innertube' ? {captions: {playerCaptionsTracklistRenderer: {captionTracks: [track(route)]}}} : null;
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
  for (const file of ['../../dist/page-identity', 'utils', 'dom-reader', 'extractors/youtube']) vm.runInContext(fs.readFileSync(require.resolve(`../src/content/${file}.js`), 'utf8'), context);
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


function youtubeFixture(t, html = '', videoId = 'new') {
  const { JSDOM } = require('jsdom');
  const fs = require('node:fs');
  const vm = require('node:vm');
  const dom = new JSDOM(html, { url: `https://www.youtube.com/watch?v=${videoId}`, runScripts: 'outside-only' });
  t.after(() => dom.window.close());
  const sandbox = vm.createContext({ URL, Date, AbortController, setTimeout, clearTimeout,
    window: dom.window, document: dom.window.document, location: dom.window.location,
    chrome: { runtime: { sendMessage: async () => ({ success: false }) } },
    console: { log() {}, warn() {} }, fetch: async () => { throw new Error('Unexpected fetch'); } });
  for (const file of ['../../dist/page-identity', 'utils', 'dom-reader', 'extractors/youtube']) {
    vm.runInContext(fs.readFileSync(require.resolve(`../src/content/${file}.js`), 'utf8'), sandbox);
  }
  return { c: sandbox, dom };
}
const ytTrack = (videoId = 'new', suffix = 'one') => ({ baseUrl: `https://www.youtube.com/api/timedtext?v=${videoId}&sig=signature&track=${suffix}`, languageCode: 'en' });
const ytPlayer = (videoId = 'new', tracks = []) => ({ videoDetails: { videoId, title: 'Current title', author: 'Author', shortDescription: 'Description', lengthSeconds: '60' }, captions: { playerCaptionsTracklistRenderer: { captionTracks: tracks } } });
const ytCaption = '<transcript><text start="1" dur="2">A real caption</text></transcript>';
const flushYoutube = () => new Promise(resolve => setImmediate(resolve));
async function advanceYoutube(t, ms) {
  for (let left = ms; left > 0; left -= 50) { t.mock.timers.tick(Math.min(50, left)); await flushYoutube(); }
}

test('duplicate tracks across every route download once per attempt and signed URLs remain unchanged', async t => {
  const { c } = youtubeFixture(t);
  const tracks = [ytTrack('new', '1'), ytTrack('new', '2'), ytTrack('new', '3')];
  c.findCaptionTracksInDom = () => tracks;
  c.queryYouTubePlayerSnapshot = async () => ({ videoId: 'new', tracks });
  c.fetchInnertubePlayer = async () => ytPlayer('new', tracks);
  c.fetchYouTubeWatchTracks = async () => tracks;
  c.readTranscriptPanel = async () => '';
  const urls = [];
  c.captureFetchText = async url => { urls.push(url); return { ok: true, text: '' }; };
  assert.equal(await c.fetchYouTubeCaptions(), '');
  assert.deepEqual(urls, tracks.map(track => track.baseUrl));
  await c.fetchYouTubeCaptions();
  assert.equal(urls.length, 6, 'a fresh retry may download the same URLs again');
});

test('concurrent consumers share one in-flight caption download', async t => {
  const { c } = youtubeFixture(t);
  let finish, calls = 0;
  c.captureFetchText = () => { calls++; return new Promise(resolve => { finish = resolve; }); };
  const map = new Map();
  const first = c.fetchTimedtext([ytTrack()], undefined, map);
  const second = c.fetchTimedtext([ytTrack()], undefined, map);
  assert.equal(calls, 1);
  finish({ ok: true, text: ytCaption });
  assert.equal(await first, '[00:01] A real caption');
  assert.equal(await second, '[00:01] A real caption');
});

test('local captions return without awaiting a slow snapshot or opening chapter panels', async t => {
  const { c } = youtubeFixture(t);
  c.queryYouTubePlayerSnapshot = () => new Promise(() => {});
  c.readYtInitialPlayerResponse = () => ytPlayer('new', [ytTrack()]);
  c.findCaptionTracksInDom = () => [ytTrack()];
  c.captureFetchText = async url => { assert.match(url, /api\/timedtext/); return { ok: true, text: ytCaption }; };
  c.readChapterPanel = () => assert.fail('Must not open chapter panel');
  const capture = await c.extractYouTube();
  assert.equal(capture.transcriptAvailable, true);
  assert.equal(capture.metadata.caption_source, 'page_tracks');
});

test('live player tracks succeed before network discovery and improve metadata and chapters', async t => {
  const { c } = youtubeFixture(t);
  const snapshot = { videoId: 'new', tracks: [ytTrack()], playerResponse: ytPlayer(), markersMap: [{ value: { chapters: [
    { chapterRenderer: { timeRangeStartMillis: 0, title: { simpleText: 'Introduction' } } },
  ] } }] };
  c.queryYouTubePlayerSnapshot = async () => snapshot;
  c.captureFetchText = async url => { assert.match(url, /api\/timedtext/); return { ok: true, text: ytCaption }; };
  const context = c.createCaptureContext();
  t.after(() => context.dispose());
  const capture = await c.extractYouTube(context);
  assert.equal(capture.title, 'Current title');
  assert.equal(capture.chapters[0].title, 'Introduction');
  assert.equal(capture.metadata.caption_source, 'player_tracks');
});

test('fast watch discovery wins over stalled API and limits active network requests to two', async t => {
  const { c } = youtubeFixture(t);
  c.queryYouTubePlayerSnapshot = async () => ({ videoId: 'new', tracks: [], client: { clientName: 'WEB', clientVersion: 'current-version' } });
  let active = 0, peak = 0, aborted = false;
  c.captureFetchText = async (url, options, timeout, context) => {
    active++; peak = Math.max(peak, active);
    try {
      if (url.includes('/youtubei/')) return await new Promise((resolve, reject) => {
        context.signal.addEventListener('abort', () => { aborted = true; reject(new Error('Aborted')); }, { once: true });
      });
      if (url.includes('/watch?')) return { ok: true, text: `var ytInitialPlayerResponse = ${JSON.stringify(ytPlayer('new', [ytTrack()]))};` };
      return { ok: true, text: ytCaption };
    } finally { active--; }
  };
  const metadata = {};
  assert.equal(await c.fetchYouTubeCaptions(metadata), '[00:01] A real caption');
  await flushYoutube();
  assert.equal(metadata.caption_source, 'watch_page');
  assert.equal(peak, 2);
  assert.equal(aborted, true);
  assert.equal(active, 0);
});

test('player API requires current configuration and validates HTTP status and video identity', async t => {
  const { c } = youtubeFixture(t);
  const client = { clientName: 'WEB', clientVersion: '2.current', hl: 'fr', gl: 'FR' };
  let calls = 0;
  c.captureFetchText = async (url, options) => {
    calls++;
    assert.deepEqual(JSON.parse(options.body).context.client, client);
    return { ok: true, text: JSON.stringify(ytPlayer('old', [ytTrack('old')])) };
  };
  assert.equal(await c.fetchInnertubePlayer('new'), null);
  assert.equal(calls, 0);
  assert.equal(await c.fetchInnertubePlayer('new', undefined, client), null);
  c.captureFetchText = async () => ({ ok: false, text: JSON.stringify(ytPlayer()) });
  assert.equal(await c.fetchInnertubePlayer('new', undefined, client), null);
  c.captureFetchText = async () => ({ ok: true, text: 'invalid JSON' });
  await assert.rejects(c.fetchInnertubePlayer('new', undefined, client), { name: 'SyntaxError' });
});

test('watch discovery rejects HTTP errors and responses for another video', async t => {
  const { c } = youtubeFixture(t);
  for (const response of [
    { ok: false, text: `var ytInitialPlayerResponse = ${JSON.stringify(ytPlayer('new', [ytTrack()]))};` },
    { ok: true, text: `var ytInitialPlayerResponse = ${JSON.stringify(ytPlayer('old', [ytTrack('old')]))};` },
    { ok: true, text: 'Consent page' },
  ]) {
    c.captureFetchText = async () => response;
    assert.equal((await c.fetchYouTubeWatchTracks('new')).length, 0);
  }
});

test('passive chapters skip ambiguous or old data and never open a panel', t => {
  const { c } = youtubeFixture(t, '<ytd-macro-markers-list-item-renderer><span id="time">00:01</span><h4>Old chapter</h4></ytd-macro-markers-list-item-renderer>');
  const chapter = { macroMarkersListItemRenderer: { title: { simpleText: 'Old chapter' }, timeDescription: { simpleText: '00:01' } } };
  c.readYtInitialData = () => ({ currentVideoEndpoint: { watchEndpoint: { videoId: 'old' } }, chapter });
  assert.equal(c.extractChapters().length, 0);
  c.readYtInitialData = () => ({ chapter });
  assert.equal(c.extractChapters().length, 0);
  c.readYtInitialData = () => ({ currentVideoEndpoint: { watchEndpoint: { videoId: 'new' } }, chapter });
  assert.equal(c.extractChapters()[0].title, 'Old chapter');
});

const ytPanel = (attrs = '', content = '') => `<ytd-engagement-panel-section-list-renderer target-id="engagement-panel-searchable-transcript" ${attrs}><button id="close-button">Close</button>${content}</ytd-engagement-panel-section-list-renderer>`;
const ytSegment = text => `<ytd-transcript-segment-renderer><span class="segment-timestamp">00:01</span><span class="segment-text">${text}</span></ytd-transcript-segment-renderer>`;

test('unverified preexisting transcript is rejected and a user-opened panel stays open', async t => {
  const { c, dom } = youtubeFixture(t, ytPanel('visibility="ENGAGEMENT_PANEL_VISIBILITY_EXPANDED"', ytSegment('Old caption')));
  let closes = 0;
  dom.window.document.querySelector('#close-button').onclick = () => closes++;
  assert.equal(await c.readTranscriptPanel(), '');
  assert.equal(closes, 0);
});

test('verified existing transcript waits for stability and preserves panel and CC settings', async t => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 1000 });
  const { c, dom } = youtubeFixture(t, '<button class="ytp-subtitles-button" aria-pressed="false"></button>' + ytPanel('video-id="new" visibility="ENGAGEMENT_PANEL_VISIBILITY_EXPANDED"', ytSegment('Caption')));
  let clicks = 0;
  dom.window.document.querySelectorAll('button').forEach(button => button.onclick = () => clicks++);
  let complete = false;
  const pending = c.readTranscriptPanel().then(text => { complete = true; return text; });
  await advanceYoutube(t, 250);
  assert.equal(complete, false);
  await advanceYoutube(t, 100);
  assert.equal(await pending, '[00:01] Caption');
  assert.equal(clicks, 0);
});

test('fresh transcript waits through incremental rendering and restores only its own panel', async t => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 1000 });
  const { c, dom } = youtubeFixture(t, '<ytd-video-description-transcript-section-renderer><button id="show">Show transcript</button></ytd-video-description-transcript-section-renderer>' + ytPanel('visibility="ENGAGEMENT_PANEL_VISIBILITY_HIDDEN"'));
  const panel = dom.window.document.querySelector('ytd-engagement-panel-section-list-renderer');
  let closes = 0;
  dom.window.document.querySelector('#show').onclick = () => { panel.setAttribute('visibility', 'ENGAGEMENT_PANEL_VISIBILITY_EXPANDED'); panel.insertAdjacentHTML('beforeend', ytSegment('First')); };
  panel.querySelector('#close-button').onclick = () => { closes++; panel.setAttribute('visibility', 'ENGAGEMENT_PANEL_VISIBILITY_HIDDEN'); };
  let complete = false;
  const pending = c.readTranscriptPanel().then(text => { complete = true; return text; });
  await advanceYoutube(t, 200);
  panel.insertAdjacentHTML('beforeend', ytSegment('Second'));
  await advanceYoutube(t, 250);
  assert.equal(complete, false);
  await advanceYoutube(t, 150);
  assert.match(await pending, /First\n\[00:01\] Second/);
  assert.equal(closes, 1);
});

test('panel loading and unknown ownership cannot be mistaken for a ready transcript', async t => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 1000 });
  const { c } = youtubeFixture(t, ytPanel('video-id="new" visibility="ENGAGEMENT_PANEL_VISIBILITY_EXPANDED"', '<span aria-busy="true"></span>' + ytSegment('Still loading')));
  const pending = c.readTranscriptPanel();
  await advanceYoutube(t, 2000);
  assert.equal(await pending, '');
});

for (const stop of ['cancel', 'timeout', 'navigation']) {
  test(`panel fallback handles ${stop} without stale results or unrelated cleanup`, async t => {
    t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 1000 });
    const { c, dom } = youtubeFixture(t, '<ytd-video-description-transcript-section-renderer><button id="show">Show transcript</button></ytd-video-description-transcript-section-renderer>' + ytPanel('visibility="ENGAGEMENT_PANEL_VISIBILITY_HIDDEN"') + '<aside><button id="unrelated-close">Close other panel</button></aside>');
    const panel = dom.window.document.querySelector('ytd-engagement-panel-section-list-renderer');
    let closes = 0, unrelated = 0;
    dom.window.document.querySelector('#show').onclick = () => panel.setAttribute('visibility', 'ENGAGEMENT_PANEL_VISIBILITY_EXPANDED');
    panel.querySelector('#close-button').onclick = () => closes++;
    dom.window.document.querySelector('#unrelated-close').onclick = () => unrelated++;
    const context = c.createCaptureContext({ deadline: Date.now() + (stop === 'timeout' ? 150 : 2000) });
    t.after(() => context.dispose());
    const pending = c.readTranscriptPanel(context);
    const rejection = assert.rejects(pending, error => error.code === (stop === 'navigation' ? 'stale' : stop === 'timeout' ? 'timeout' : 'cancelled'));
    await advanceYoutube(t, 100);
    if (stop === 'cancel') context.abort();
    if (stop === 'navigation') dom.window.dispatchEvent(new dom.window.Event('yt-navigate-start'));
    await advanceYoutube(t, 100);
    await rejection;
    assert.equal(closes, stop === 'navigation' ? 0 : 1);
    assert.equal(unrelated, 0);
  });
}

test('usable live tracks win while a different local caption URL stalls', async t => {
  const { c } = youtubeFixture(t);
  c.findCaptionTracksInDom = () => [ytTrack('new', 'stalled')];
  c.queryYouTubePlayerSnapshot = async () => ({ videoId: 'new', tracks: [ytTrack('new', 'live')] });
  let aborted = false;
  c.captureFetchText = async (url, options, timeout, context) => {
    if (url.includes('stalled')) return new Promise((resolve, reject) => {
      context.signal.addEventListener('abort', () => { aborted = true; reject(new Error('Aborted')); });
    });
    assert.match(url, /track=live/);
    return { ok: true, text: ytCaption };
  };
  const metadata = {};
  assert.equal(await c.fetchYouTubeCaptions(metadata), '[00:01] A real caption');
  assert.equal(metadata.caption_source, 'player_tracks');
  assert.equal(aborted, true);
});

test('nonce fallback after denied scripting returns validated snapshot and removes listeners', async t => {
  const { c, dom } = youtubeFixture(t);
  c.chrome.runtime.sendMessage = async () => { throw new Error('Cannot access this tab'); };
  const originalAppend = dom.window.document.head.appendChild.bind(dom.window.document.head);
  const originalAdd = dom.window.addEventListener.bind(dom.window);
  const originalRemove = dom.window.removeEventListener.bind(dom.window);
  const listeners = new Set();
  dom.window.addEventListener = (name, handler, ...rest) => { listeners.add(name); originalAdd(name, handler, ...rest); };
  dom.window.removeEventListener = (name, handler, ...rest) => { listeners.delete(name); originalRemove(name, handler, ...rest); };
  dom.window.document.head.appendChild = script => {
    const eventId = script.textContent.match(/CustomEvent\("([^"]+)"/)[1];
    const element = originalAppend(script);
    dom.window.dispatchEvent(new dom.window.CustomEvent(eventId, { detail: { videoId: 'new', tracks: [ytTrack()] } }));
    return element;
  };
  const snapshot = await c.queryYouTubePlayerSnapshot();
  assert.equal(snapshot.tracks[0].baseUrl, ytTrack().baseUrl);
  assert.equal(listeners.size, 0);
  assert.equal(dom.window.document.querySelectorAll('script').length, 0);
});

test('snapshot lookup stops within 500ms when both worker and nonce bridge are unavailable', async t => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 1000 });
  const { c, dom } = youtubeFixture(t);
  c.chrome.runtime.sendMessage = () => new Promise(() => {});
  const pending = c.queryYouTubePlayerSnapshot();
  await advanceYoutube(t, 500);
  assert.equal(await pending, null);
  assert.equal(Date.now(), 1500);
  assert.equal(dom.window.document.querySelectorAll('script').length, 0);
});

test('late worker snapshot is rejected after navigation and cancellation does not start nonce fallback', async t => {
  const { c, dom } = youtubeFixture(t);
  let finish;
  c.chrome.runtime.sendMessage = () => new Promise(resolve => { finish = resolve; });
  const context = c.createCaptureContext();
  t.after(() => context.dispose());
  const pending = c.queryYouTubePlayerSnapshot(context);
  const rejection = assert.rejects(pending, error => error.code === 'stale');
  dom.window.dispatchEvent(new dom.window.Event('yt-navigate-start'));
  finish({ snapshot: { videoId: 'new', tracks: [ytTrack()] } });
  await rejection;
  assert.equal(dom.window.document.querySelectorAll('script').length, 0);
});

test('read-only MAIN snapshot uses current video and excludes credentials and account data', t => {
  const { c, dom } = youtubeFixture(t);
  const player = dom.window.document.createElement('div');
  player.id = 'movie_player';
  player.getPlayerResponse = () => ({ ...ytPlayer('new', [ytTrack()]), account: { token: 'private' } });
  dom.window.document.body.appendChild(player);
  dom.window.ytcfg = { get: key => ({ INNERTUBE_CONTEXT: { client: { clientName: 'WEB', clientVersion: 'today', hl: 'en', gl: 'US', visitorData: 'private' } } })[key] };
  const snapshot = c.readYouTubePlayerSnapshot('new');
  assert.equal(snapshot.client.clientVersion, 'today');
  assert.equal(snapshot.tracks.length, 1);
  assert.equal(JSON.stringify(snapshot).includes('private'), false);
  assert.equal(c.readYouTubePlayerSnapshot('old'), null);
  player.getPlayerResponse = () => ytPlayer('old', [ytTrack('old')]);
  assert.equal(c.readYouTubePlayerSnapshot('new').tracks.length, 0);
});

test('stalled local URLs leave time for transcript fallback within the same attempt', async t => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 1000 });
  const { c } = youtubeFixture(t);
  c.findCaptionTracksInDom = () => [ytTrack()];
  c.queryYouTubePlayerSnapshot = async () => ({ videoId: 'new', tracks: [ytTrack()] });
  c.fetch = async (url, options) => {
    if (url.includes('/watch?')) return { ok: true, status: 200, text: async () => 'No tracks yet' };
    return { ok: true, status: 200, text: () => new Promise((resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(new Error('Aborted body')), { once: true });
    }) };
  };
  let panelCalls = 0;
  c.readTranscriptPanel = async () => { panelCalls++; return '[00:01] Panel fallback'; };
  const context = c.createCaptureContext({ deadline: Date.now() + 3000 });
  t.after(() => context.dispose());
  const pending = c.fetchYouTubeCaptions({}, context);
  await flushYoutube(); await advanceYoutube(t, 2600);
  assert.equal(await pending, '[00:01] Panel fallback');
  assert.equal(panelCalls, 1);
  assert.equal(context.signal.aborted, false);
});

test('snapshot validation drops malformed chapters and metadata and foreign-video tracks', t => {
  const { c } = youtubeFixture(t);
  assert.equal(c.validYouTubeSnapshot({ videoId: 'old' }, 'new'), null);
  assert.equal(c.validYouTubeSnapshot({ videoId: 'new', playerResponse: { videoDetails: { videoId: 'new', title: {} } } }, 'new'), null);
  const snapshot = c.validYouTubeSnapshot({ videoId: 'new', tracks: [ytTrack('old'), { baseUrl: 'https://evil.test/api/timedtext?v=new' }, ytTrack()], markersMap: [{ value: { chapters: [{ chapterRenderer: { timeRangeStartMillis: 'bad', title: {} } }] } }] }, 'new');
  assert.equal(snapshot.tracks.length, 1);
  assert.equal(c.chaptersFromMarkersMap(snapshot.markersMap).length, 0);
});

test('caption ranking retains English manual, other manual, English ASR, then other ASR', async t => {
  const { c } = youtubeFixture(t);
  const tracks = [
    { ...ytTrack('new', 'zh-ai'), languageCode: 'zh', kind: 'asr' },
    { ...ytTrack('new', 'en-ai'), languageCode: 'en', kind: 'asr' },
    { ...ytTrack('new', 'zh-manual'), languageCode: 'zh' },
    ytTrack('new', 'en-manual'),
  ];
  const requested = [];
  c.captureFetchText = async url => { requested.push(url); return { ok: false, text: '' }; };
  await c.fetchTimedtext(tracks);
  assert.deepEqual(requested, [tracks[3].baseUrl, tracks[2].baseUrl, tracks[1].baseUrl]);
});

test('description expansion is restored on timeout without changing a user-opened transcript panel', async t => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 1000 });
  const { c, dom } = youtubeFixture(t, '<div id="description-inline-expander" aria-expanded="false"><button id="expand">More</button><button id="collapse">Less</button></div>' + ytPanel('visibility="ENGAGEMENT_PANEL_VISIBILITY_EXPANDED"', ytSegment('Unverified')));
  const description = dom.window.document.querySelector('#description-inline-expander');
  let collapses = 0, closes = 0;
  description.querySelector('#expand').onclick = () => description.setAttribute('aria-expanded', 'true');
  description.querySelector('#collapse').onclick = () => { collapses++; description.setAttribute('aria-expanded', 'false'); };
  dom.window.document.querySelector('#close-button').onclick = () => closes++;
  const context = c.createCaptureContext({ deadline: Date.now() + 200 });
  t.after(() => context.dispose());
  const pending = c.readTranscriptPanel(context);
  const rejection = assert.rejects(pending, error => error.code === 'timeout');
  await advanceYoutube(t, 200);
  await rejection;
  assert.equal(collapses, 1);
  assert.equal(closes, 0);
  assert.equal(description.getAttribute('aria-expanded'), 'false');
});

test('user changes during panel fetching are preserved rather than overwritten by cleanup', async t => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 1000 });
  const { c, dom } = youtubeFixture(t, '<ytd-video-description-transcript-section-renderer><button id="show">Show transcript</button></ytd-video-description-transcript-section-renderer>' + ytPanel('visibility="ENGAGEMENT_PANEL_VISIBILITY_HIDDEN"'));
  const panel = dom.window.document.querySelector('ytd-engagement-panel-section-list-renderer');
  let userHandler, closes = 0;
  const add = dom.window.document.addEventListener.bind(dom.window.document);
  dom.window.document.addEventListener = (name, handler, ...options) => { if (name === 'click') userHandler = handler; add(name, handler, ...options); };
  dom.window.document.querySelector('#show').onclick = () => panel.setAttribute('visibility', 'ENGAGEMENT_PANEL_VISIBILITY_EXPANDED');
  panel.querySelector('#close-button').onclick = () => closes++;
  const pending = c.readTranscriptPanel();
  userHandler({ isTrusted: true, target: panel });
  await advanceYoutube(t, 100);
  assert.equal(await pending, '');
  assert.equal(closes, 0);
  assert.equal(panel.getAttribute('visibility'), 'ENGAGEMENT_PANEL_VISIBILITY_EXPANDED');
});

test('current page client configuration keeps the API fallback available when MAIN scripting is blocked', async t => {
  const { c } = youtubeFixture(t, '<script>ytcfg.set({"INNERTUBE_CONTEXT":{"client":{"clientName":"WEB","clientVersion":"current-page-version","hl":"en","visitorData":"private"}},"TOKEN":"private"});</script>');
  const config = c.readYouTubeClientConfig();
  assert.equal(config.clientVersion, 'current-page-version');
  assert.equal(JSON.stringify(config).includes('private'), false);
  c.captureFetchText = async (url, options) => {
    assert.equal(JSON.parse(options.body).context.client.clientVersion, 'current-page-version');
    return { ok: true, text: JSON.stringify(ytPlayer()) };
  };
  assert.equal((await c.fetchInnertubePlayer('new')).videoDetails.videoId, 'new');
});

test('optional chapter failures never prevent a valid transcript capture', async t => {
  const { c } = youtubeFixture(t);
  c.findCaptionTracksInDom = () => [ytTrack()];
  c.queryYouTubePlayerSnapshot = async () => null;
  c.extractChapters = () => { throw new Error('Changed chapter shape'); };
  c.captureFetchText = async () => ({ ok: true, text: ytCaption });
  const capture = await c.extractYouTube();
  assert.equal(capture.transcriptAvailable, true);
  assert.equal(capture.chapters.length, 0);
});

test('h6vY3g8LFeA: a normal 1.5-second ASR download is not cut off by fractional phase budgets', async t => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 1000 });
  const { c } = youtubeFixture(t, '', 'h6vY3g8LFeA');
  const track = { ...ytTrack('h6vY3g8LFeA'), kind: 'asr' };
  c.readYtInitialPlayerResponse = () => ytPlayer('h6vY3g8LFeA', [track]);
  c.queryYouTubePlayerSnapshot = async () => null;
  c.fetch = async (url, options) => ({ ok: true, status: 200, text: () => new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(ytCaption), 1500);
    options.signal.addEventListener('abort', () => { clearTimeout(timer); reject(new Error('Caption aborted')); }, { once: true });
  }) });
  const context = c.createCaptureContext({ deadline: Date.now() + 2650 });
  t.after(() => context.dispose());
  const pending = c.extractYouTube(context);
  await flushYoutube(); await advanceYoutube(t, 1500);
  const capture = await pending;
  assert.equal(capture.transcriptAvailable, true);
  assert.equal(capture.metadata.video_id, 'h6vY3g8LFeA');
  assert.equal(capture.metadata.caption_source, 'page_tracks');
});

test('h6vY3g8LFeA: reuse the visible ASR transcript on its original document without closing it', async t => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 1000 });
  const id = 'h6vY3g8LFeA';
  const { c, dom } = youtubeFixture(t, `<ytd-watch-flexy video-id="${id}">${ytPanel('visibility="ENGAGEMENT_PANEL_VISIBILITY_EXPANDED"', ytSegment('Visible options caption'))}</ytd-watch-flexy>`, id);
  const track = { ...ytTrack(id), kind: 'asr' };
  c.readYtInitialPlayerResponse = () => ytPlayer(id, [track]);
  c.queryYouTubePlayerSnapshot = async () => null;
  let clicks = 0, aborted = false;
  dom.window.document.querySelector('#close-button').onclick = () => clicks++;
  c.captureFetchText = (url, options, timeout, context) => new Promise((resolve, reject) => {
    context.signal.addEventListener('abort', () => { aborted = true; reject(new Error('Download aborted')); }, { once: true });
  });
  const context = c.createCaptureContext({ deadline: Date.now() + 5900 });
  t.after(() => context.dispose());
  const pending = c.extractYouTube(context);
  await flushYoutube(); await advanceYoutube(t, 350);
  const capture = await pending;
  assert.equal(capture.transcriptAvailable, true);
  assert.equal(capture.metadata.caption_source, 'transcript_panel');
  assert.match(capture.content, /Visible options caption/);
  assert.equal(clicks, 0);
  assert.equal(aborted, true);
});

test('unknown existing transcripts remain untrusted after SPA navigation, including return to the same URL', async t => {
  const { c } = youtubeFixture(t, '<ytd-watch-flexy video-id="new">' + ytPanel('visibility="ENGAGEMENT_PANEL_VISIBILITY_EXPANDED"', ytSegment('Old transcript')) + '</ytd-watch-flexy>');
  c.readYtInitialPlayerResponse = () => ytPlayer('new');
  c.window.__nuteggNavigationState.generation = 2;
  assert.equal(await c.readTranscriptPanel(undefined, { existingOnly: true }), '');
});

test('transcript fallback reads modern view-model rows and ignores hidden loading indicators', async t => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 1000 });
  const { c } = youtubeFixture(t, ytPanel('video-id="new" visibility="ENGAGEMENT_PANEL_VISIBILITY_EXPANDED"', '<tp-yt-paper-spinner active hidden></tp-yt-paper-spinner><yt-transcript-segment-view-model><span class="ytwTranscriptSegmentViewModelTimestamp">0:03</span><span class="ytwTranscriptSegmentViewModelText">Modern caption row</span></yt-transcript-segment-view-model>'));
  const pending = c.readTranscriptPanel();
  await advanceYoutube(t, 350);
  assert.equal(await pending, '[0:03] Modern caption row');
});

// MAIN-world player snapshot and background message dispatch.
const fs = require('node:fs');
const vm = require('node:vm');
function worker(t, execute) {
  let listener;
  const context = vm.createContext({ URL, Date, setTimeout, clearTimeout,
    importScripts() {}, readYouTubePlayerSnapshot: function () {},
    chrome: { runtime: { id: 'nutegg', onMessage: { addListener: fn => { listener = fn; } } }, scripting: { executeScript: execute } },
  });
  vm.runInContext(fs.readFileSync(require.resolve('../src/content/extractors/youtube.js'), 'utf8'), context);
  listener = context.handleYouTubePlayerSnapshotMessage;
  const sender = { id: 'nutegg', tab: { id: 42 }, frameId: 0, documentId: 'original-document', url: 'https://www.youtube.com/watch?v=new' };
  return { sender, request: (message = { action: 'youtube-player-snapshot', videoId: 'new' }, source = sender) => new Promise(resolve => listener(message, source, resolve)) };
}
test('MAIN lookup targets the originating tab and document, independent of active tab', async t => {
  const f = worker(t, async options => {
    assert.equal(options.target.tabId, 42);
    assert.deepEqual(Array.from(options.target.documentIds), ['original-document']);
    assert.equal(options.world, 'MAIN');
    assert.deepEqual(Array.from(options.args), ['new']);
    return [{ result: { videoId: 'new', tracks: [] } }];
  });
  assert.equal((await f.request()).snapshot.videoId, 'new');
});
test('bridge rejects other extensions, subframes, non-YouTube pages and mismatched videos', async t => {
  const f = worker(t, () => assert.fail('Must not execute script'));
  for (const patch of [{ id: 'other-extension' }, { frameId: 2 }, { documentId: undefined }, { tab: undefined },
    { url: 'https://youtube.com.evil.test/watch?v=new' }, { url: 'https://www.youtube.com/watch?v=old' },
    { url: 'http://www.youtube.com/watch?v=new' }]) {
    assert.equal((await f.request(undefined, { ...f.sender, ...patch })).success, false);
  }
});
test('missing scripting permissions are returned as a recoverable lookup failure', async t => {
  const f = worker(t, async () => { throw new Error('No permission'); });
  assert.equal((await f.request()).success, false);
});
test('worker lookup times out at 500ms without a late second response', async t => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 1000 });
  const f = worker(t, () => new Promise(() => {}));
  const pending = f.request();
  t.mock.timers.tick(500);
  assert.equal((await pending).snapshot, null);
  assert.equal(Date.now(), 1500);
});

test('worker boots with the merged extractor and dispatches one content snapshot reply', async () => {
  const path = require('node:path');
  const listeners = [], imported = [];
  const event = { addListener() {} };
  const context = vm.createContext({ URL, AbortController, AbortSignal, setTimeout, clearTimeout, setInterval, clearInterval,
    NutEggAI: {}, // AI execution is unrelated to the read-only snapshot bridge.
    console: { log() {}, warn() {}, error() {} }, fetch: () => assert.fail('Unexpected startup request'),
    chrome: {
      runtime: { id: 'nutegg', getURL: p => 'chrome-extension://nutegg/' + p.replace(/^\//, ''),
        onMessage: { addListener: listener => listeners.push(listener) }, onConnect: event },
      storage: { local: { get: async () => ({ executionSchemaVersion: 2 }), set: async () => {}, setAccessLevel: async () => {} }, onChanged: event },
      action: { setPopup() {} }, sidePanel: { setPanelBehavior: async () => {} },
      scripting: { executeScript: async options => {
        assert.equal(options.target.tabId, 42);
        assert.equal(options.world, 'MAIN');
        return [{ result: { videoId: 'h6vY3g8LFeA', tracks: [] } }];
      } },
    },
  });
  context.importScripts = (...files) => {
    for (const file of files) {
      if (file.endsWith('/ai-core.js')) continue;
      const resolved = path.resolve(__dirname, '../src/background', file);
      imported.push(path.basename(resolved));
      vm.runInContext(fs.readFileSync(resolved, 'utf8'), context, { filename: resolved });
    }
  };
  vm.runInContext(fs.readFileSync(require.resolve('../src/background/service-worker.js'), 'utf8'), context);
  const responses = [];
  for (const listener of listeners) listener({ action: 'youtube-player-snapshot', videoId: 'h6vY3g8LFeA' },
    { id: 'nutegg', tab: { id: 42 }, documentId: 'document', frameId: 0, url: 'https://www.youtube.com/watch?v=h6vY3g8LFeA' }, response => responses.push(response));
  await new Promise(resolve => setImmediate(resolve));
  assert(imported.includes('youtube.js'));
  assert.equal(imported.includes('youtube-snapshot.js'), false);
  assert.equal(responses.length, 1);
  assert.equal(responses[0].snapshot.videoId, 'h6vY3g8LFeA');
});

test('multiple stalled local tracks cannot starve fresh discovery and the panel budget', async t => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 1000 });
  const {c} = youtubeFixture(t);
  const tracks = ['a','b','c'].map(id => ytTrack('new',id));
  c.findCaptionTracksInDom = () => tracks;
  c.queryYouTubePlayerSnapshot = async () => ({videoId:'new',tracks});
  c.fetch = async (url, options) => {
    if (url.includes('/watch?')) return {ok:true,status:200,text:async()=> 'No tracks'};
    return {ok:true,status:200,text:()=>new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new Error('Aborted')),{once:true}))};
  };
  let panelStarted;
  c.readTranscriptPanel = async () => {panelStarted=Date.now();return '[00:01] Recovered transcript';};
  const ctx=c.createCaptureContext({deadline:Date.now()+6000}); t.after(()=>ctx.dispose());
  const pending=c.fetchYouTubeCaptions({},ctx);
  await flushYoutube();await advanceYoutube(t,4000);
  assert.equal(await pending,'[00:01] Recovered transcript');
  assert.ok(panelStarted<=5000);assert.equal(ctx.signal.aborted,false);
});

// Current YouTube markup has nested button rows and no panel video-id.
const currentYtSegment = (time, text) => `<ytd-transcript-segment-renderer><div class="segment" role="button"><div class="segment-start-offset">${time}</div><yt-formatted-string class="segment-text">${text}</yt-formatted-string></div></ytd-transcript-segment-renderer>`;

test('8Ij7A1VCB7I: original-document panel works without player data and preserves timestamps', async t => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 1000 });
  const id = '8Ij7A1VCB7I';
  const { c, dom } = youtubeFixture(t, `<ytd-watch-flexy video-id="${id}">${ytPanel('visibility="ENGAGEMENT_PANEL_VISIBILITY_HIDDEN"', currentYtSegment('0:01', 'Hidden template'))}${ytPanel('visibility="ENGAGEMENT_PANEL_VISIBILITY_EXPANDED"', currentYtSegment('1:00', 'economy will contract by 3% this year') + currentYtSegment('1:03', 'A separate caption'))}</ytd-watch-flexy>`, id);
  c.readYtInitialPlayerResponse = () => null;
  c.queryYouTubePlayerSnapshot = async () => null;
  let clicks = 0, downloads = 0;
  dom.window.document.querySelectorAll('button').forEach(button => button.onclick = () => clicks++);
  c.captureFetchText = async () => { downloads++; return { ok: true, text: '' }; };
  const context = c.createCaptureContext({ deadline: Date.now() + 5900 });
  t.after(() => context.dispose());
  const pending = c.extractYouTube(context);
  await flushYoutube(); await advanceYoutube(t, 350);
  const capture = await pending;
  assert.equal(capture.transcriptAvailable, true);
  assert.equal(capture.metadata.caption_source, 'transcript_panel');
  assert.match(capture.content, /\[1:00\] economy will contract by 3% this year\n\[1:03\] A separate caption/);
  assert.equal((capture.content.match(/economy will contract/g) || []).length, 1);
  assert.doesNotMatch(capture.content, /Hidden template/);
  assert.equal(downloads, 0);
  assert.equal(clicks, 0);
});

test('original-document DOM ownership rejects transcripts after navigating away and back', async t => {
  const { c, dom } = youtubeFixture(t, '<ytd-watch-flexy video-id="new">' + ytPanel('visibility="ENGAGEMENT_PANEL_VISIBILITY_EXPANDED"', currentYtSegment('1:00', 'Stale caption')) + '</ytd-watch-flexy>');
  c.readYtInitialPlayerResponse = () => null;
  dom.window.history.pushState({}, '', '/watch?v=other');
  c.syncCaptureNavigation();
  dom.window.history.pushState({}, '', '/watch?v=new');
  c.syncCaptureNavigation();
  assert.equal(await c.readTranscriptPanel(undefined, { existingOnly: true }), '');
});

test('a foreign watch renderer is rejected even with a matching panel attribute', async t => {
  const { c } = youtubeFixture(t, '<ytd-watch-flexy video-id="other">' + ytPanel('video-id="new" visibility="ENGAGEMENT_PANEL_VISIBILITY_EXPANDED"', currentYtSegment('1:00', 'Foreign caption')) + '</ytd-watch-flexy>');
  assert.equal(await c.readTranscriptPanel(), '');
});

test('hidden transcript segments are not accepted as a ready panel', async t => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 1000 });
  const { c } = youtubeFixture(t, ytPanel('video-id="new" visibility="ENGAGEMENT_PANEL_VISIBILITY_HIDDEN"', currentYtSegment('1:00', 'Hidden caption')) + '<ytd-video-description-transcript-section-renderer><button>Show transcript</button></ytd-video-description-transcript-section-renderer>');
  const pending = c.readTranscriptPanel();
  await advanceYoutube(t, 2000);
  assert.equal(await pending, '');
});

const modernTranscriptRow = (time, text, tag = 'transcript-segment-view-model') => `<${tag} class="ytwTranscriptSegmentViewModelHost"><div role="button"><span class="ytwTranscriptSegmentViewModelTimestamp">${time}</span><span class="ytwTranscriptSegmentViewModelText"><span>${text}</span></span></div></${tag}>`;
const modernTranscriptPanel = (content, attrs = '') => `<ytd-engagement-panel-section-list-renderer visibility="ENGAGEMENT_PANEL_VISIBILITY_EXPANDED" ${attrs}><yt-section-list-renderer data-target-id="PAmodern_transcript_view">${content}</yt-section-list-renderer></ytd-engagement-panel-section-list-renderer>`;

test('2uyhavEACdo: captures the modern nested-target transcript with chapter groups', async t => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 1000 });
  const id = '2uyhavEACdo';
  const html = `<ytd-watch-flexy video-id="${id}">${ytPanel('visibility="ENGAGEMENT_PANEL_VISIBILITY_HIDDEN"')}${modernTranscriptPanel('<button>Chapter 1: Intro</button><div>' + modernTranscriptRow('0:00', 'I am really worried.') + '</div><button>Chapter 2: Theory</button><div>' + modernTranscriptRow('1:14', 'Every job solves a problem.') + '</div>')}</ytd-watch-flexy>`;
  const { c, dom } = youtubeFixture(t, html, id);
  c.queryYouTubePlayerSnapshot = async () => null;
  c.captureFetchText = async () => assert.fail('Visible verified transcript needs no discovery requests');
  let clicks = 0;
  dom.window.document.querySelectorAll('button').forEach(button => button.onclick = () => clicks++);
  const ctx = c.createCaptureContext({ deadline: Date.now() + 6000 });
  t.after(() => ctx.dispose());
  const pending = c.extractYouTube(ctx);
  await flushYoutube(); await advanceYoutube(t, 350);
  const capture = await pending;
  assert.equal(capture.transcriptAvailable, true);
  assert.equal(capture.metadata.caption_source, 'transcript_panel');
  assert.match(capture.content, /\[0:00\] I am really worried.\n\[1:14\] Every job solves a problem./);
  assert.doesNotMatch(capture.content, /Chapter 1|Chapter 2/);
  assert.equal(clicks, 0);
});

for (const variant of ['renamed-tag', 'structural-rows']) {
  test(`transcript layout tolerates ${variant} using scoped semantic fields`, async t => {
    t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 1000 });
    const rows = variant === 'renamed-tag'
      ? modernTranscriptRow('0:04', 'Class-based caption', 'new-caption-component')
      : '<section role="button"><span class="caption-timestamp">0:04</span><span class="newTranscriptSegmentText">Structural caption</span></section>';
    const { c } = youtubeFixture(t, modernTranscriptPanel(rows, 'video-id="new"'));
    const pending = c.readTranscriptPanel();
    await advanceYoutube(t, 350);
    assert.match(await pending, /^\[0:04\] (Class-based|Structural) caption$/);
  });
}

test('timestamp buttons in chapters, comments and unrelated panels are never transcript candidates', async t => {
  const rows = '<div role="button"><span class="timestamp">0:04</span><span class="segment-text">Unrelated text</span></div>';
  const { c } = youtubeFixture(t, `<ytd-engagement-panel-section-list-renderer video-id="new" target-id="engagement-panel-chapters" visibility="ENGAGEMENT_PANEL_VISIBILITY_EXPANDED">${rows}</ytd-engagement-panel-section-list-renderer><main>${rows}</main>`);
  assert.equal(await c.readTranscriptPanel(), '');
});

test('modern panel ownership remains unknown after SPA navigation', async t => {
  const { c } = youtubeFixture(t, '<ytd-watch-flexy video-id="new">' + modernTranscriptPanel(modernTranscriptRow('0:00', 'Old captions')) + '</ytd-watch-flexy>');
  c.window.__nuteggNavigationState.generation = 2;
  assert.equal(await c.readTranscriptPanel(undefined, { existingOnly: true }), '');
});

test('modern fallback waits for incremental rows, ignores chapter buttons and closes only its new panel', async t => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 1000 });
  const { c, dom } = youtubeFixture(t, '<ytd-video-description-transcript-section-renderer><button id="show">Show transcript</button></ytd-video-description-transcript-section-renderer><aside><button id="unrelated">Close</button></aside>');
  let closes = 0;
  dom.window.document.querySelector('#show').onclick = () => {
    dom.window.document.body.insertAdjacentHTML('beforeend', modernTranscriptPanel('<button id="close-button">Close</button><button>Chapter 1</button>' + modernTranscriptRow('0:00', 'First')));
    dom.window.document.querySelector('#close-button').onclick = () => closes++;
  };
  dom.window.document.querySelector('#unrelated').onclick = () => assert.fail('Unrelated control clicked');
  let finished = false;
  const pending = c.readTranscriptPanel().then(text => { finished = true; return text; });
  await advanceYoutube(t, 200);
  dom.window.document.querySelector('yt-section-list-renderer').insertAdjacentHTML('beforeend', modernTranscriptRow('0:04', 'Second'));
  await advanceYoutube(t, 250);
  assert.equal(finished, false);
  await advanceYoutube(t, 150);
  assert.equal(await pending, '[0:00] First\n[0:04] Second');
  assert.equal(closes, 1);
});

test('renamed description controls can request the transcript through aria-controls', async t => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 1000 });
  const { c, dom } = youtubeFixture(t, '<div id="description-inline-expander"><button aria-controls="new-transcript-panel">Localized transcript action</button></div>');
  dom.window.document.querySelector('button').onclick = () => dom.window.document.body.insertAdjacentHTML('beforeend', modernTranscriptPanel(modernTranscriptRow('0:00', 'Requested caption')));
  const pending = c.readTranscriptPanel();
  await advanceYoutube(t, 350);
  assert.equal(await pending, '[0:00] Requested caption');
});

test('structural transcript fallback ignores untimed buttons and empty rows', async t => {
  t.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: 1000 });
  const html = '<div role="button"><span class="timestamp">Chapter 2</span><span class="segment-text">Chapter title</span></div><div role="button"><span class="timestamp">0:04</span></div>' + modernTranscriptRow('0:05', 'Actual caption');
  const { c } = youtubeFixture(t, modernTranscriptPanel(html, 'video-id="new"'));
  const pending = c.readTranscriptPanel();
  await advanceYoutube(t, 350);
  assert.equal(await pending, '[0:05] Actual caption');
});
