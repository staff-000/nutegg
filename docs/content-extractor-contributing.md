# Contributing a content extractor

Use this guide when adding a website or fixing capture. NutEgg uses classic scripts in Chrome's isolated world: functions declared at script scope are shared by later scripts. The manifest controls loading order. There is no extractor bundling or self-registration step.

## Architecture and ownership

```text
Popup PageExtractor (originating tab ID, request ID, deadline)
  → content-script.js (ordered registry and per-document capture runtime)
  → extractor.extract(context) (platform parsing and bounded discovery)
  → capture result (body, metadata, readiness, coverage)
  → originating tabStateManager state / existing cache and persistence
```

| Responsibility | Source, relative to repository root |
| --- | --- |
| Ordered selection, fallback, active capture ownership | `chrome-extension/src/content/content-script.js` |
| Capture context, cancellation, bounded fetch/wait helpers | `chrome-extension/src/content/utils.js` |
| Canonical URL and application-route identity | `shared/src/page-identity.ts` |
| Body selection, shadow roots/frames, serialization, readiness | `chrome-extension/src/content/dom-reader.js` |
| Per-platform extraction and captions | `chrome-extension/src/content/extractors/<platform>.js` |
| Shared platform state, subtitle parsing, transport client | `chrome-extension/src/content/extractors/chinese-common.js` |
| Restricted platform transport and cancellation in worker | `chrome-extension/src/background/chinese-fetch.js` |
| Passive/explicit discussion collection | `chrome-extension/src/content/extractors/discussion.js` |
| Heading/quote/discussion navigation | `chrome-extension/src/content/source-navigation.js` |
| Tab messaging, reinjection, capture retries | `chrome-extension/src/popup/services/page-extractor.js` |
| Fixtures and contract examples | `chrome-extension/tests/helpers/extractor-harness.js`, `chrome-extension/tests/extractor-contract.test.js` |

Keep platform-specific detection, identity, metadata, and parsing together. Use shared helpers for behavior used by multiple platforms. Discussion collection is separate from primary body extraction. YouTube's snapshot and caption code stays together in `youtube.js`: it is also loaded by the background worker, so avoid DOM-dependent work at file initialization.

## Add a website

1. Create `chrome-extension/src/content/extractors/<platform>.js`. Define a synchronous detector and an extractor accepting `context`. Start with the example below for ordinary articles.
2. Add an entry to `BUILTIN_EXTRACTORS` in `content-script.js`, before article/generic fallback. Set `bodyReadiness` and `onError` explicitly. The built-in registry refreshes function references during reinjection; do not add a message listener in the extractor.
3. Add the file once to the capture declaration's `js` array in `chrome-extension/manifest.json`, after its helpers and before `content-script.js`. The popup derives reinjection files from this declaration. **Do not add a popup script list.** Exactly one declaration must include `src/content/content-script.js`.
4. Add targeted fixture tests using the harness below. Cover routing, realistic output, missing content, failure, cancellation, navigation, and relevant coverage limitations. Add platform-specific identity and caption tests where applicable.
5. Run the affected test files individually and build the extension using the commands below.
6. Reload the unpacked extension and verify a representative page. Exercise initial loading and reinjection into a page opened before the reload, then navigate during a capture. Check text, readiness, warnings, elapsed time, and originating tab isolation.

Example registry entry:

```js
{ name: 'example', detect: window.detectExampleArticle, extract: window.extractExampleArticle,
  bodyReadiness: true, onError: 'stop' },
```

`bodyReadiness: true` invokes shared accessible-root discovery and body settling (300 ms unchanged, at most one second, bounded by the attempt deadline). It expects the synchronous extraction style used by article/generic and the example. Set it to `false` for asynchronous/video extractors that implement their own readiness. `onError: 'continue'` allows ordinary errors to fall through; `stop` prevents capturing an unrelated feed or login page. A `null` result declines extraction regardless of this policy. Cancellation, deadline, changed-frame, and stale-navigation errors always stop.

Generic is always last. The final generic fallback uses the same context, readiness, discussion decoration, and coverage checks as a normal registry entry.

## Minimal executable article example

This exact code lives in `chrome-extension/tests/fixtures/example-article.js`; the contract test verifies this documentation and fixture stay identical. Copy it into a platform file and adjust the host/path and site metadata. Existing DOM helpers select the strongest accessible content container, preserve supported Markdown structures, exclude hidden/navigation content, and report known limits.

```js
function detectExampleArticle() {
  const url = new URL(window.location.href);
  const host = url.hostname;
  return (host === 'example.org' || host.endsWith('.example.org')) && /^\/articles\/[^/]+\/?$/.test(url.pathname);
}

function extractExampleArticle(context) {
  context?.check();
  const container = findCaptureContainer(context);
  const body = captureTextResult(container, context);
  const title = document.querySelector('h1')?.textContent?.trim() || document.title;
  return applyTextCaptureResult({
    url: window.location.href,
    title,
    content: `# ${title}\n\n${body.text}`,
    sourceType: 'webpage',
  }, body);
}
```

## Runtime contract

### Detection and output

Detectors must be synchronous, read-only, and free of network requests. Parse `new URL(window.location.href)` and match the exact hostname or its subdomains plus supported paths. Never use full-URL substring checks: query strings and lookalike domains can contain platform names.

Extractors return `null` or a capture containing `url`, `title`, `content`, `sourceType`, and optional `metadata`. `url` must identify the requested page. Preserve existing output shapes, attribution, and source references. Optional fields include `chapters`, `mediaType`, `transcriptAvailable`, `discussion`, and `captureCoverage`.

| `extractionStatus` | Meaning and retry behavior |
| --- | --- |
| `ready` | Usable current content. No readiness retry is required. A valid transcript is marked ready by the dispatcher. |
| `not_ready` | Body/player absent or still loading. Eligible for the existing configured retries within the overall deadline. |
| `transient` | Partial capture or temporarily missing captions. Eligible for retries. |
| `unavailable` | Recognized access restriction or explicitly unavailable content. Stops ordinary readiness retries; available partial text remains usable. |

A missing transcript must set `transcriptAvailable: false`; description text is not a transcript. With no explicit status, this becomes `transient`. The existing retry predicate also retries missing transcripts unless status is `unavailable`. Do not label a title, description, or loading shell as ready body content. Do not force short but stable articles to retry based on word count.

For article bodies use `captureTextResult()` and `applyTextCaptureResult()`. These preserve body readiness and optional `captureCoverage` with reasons `truncated`, `loading_timeout`, `access_restricted`, or `traversal_limit`, and character counts only when known. Absent coverage means not assessed. Keep the existing 60,000-character article and 100,000-character transcript limits. Do not silently remove coverage warnings.

Bilibili provenance remains JSON in `metadata.subtitle_provenance`, recording versioned requested/validated IDs, route and track information, and ownership outcome. Preserve that representation. It validates ownership, not the semantic correctness of the provider's captions. Never add signed URLs, cookies, accounts, or transcript text to provenance or diagnostics.

### Context and asynchronous operations

`context` belongs to one request/attempt and captures document, canonical URL, and navigation generation. Its public helpers are `check()`, `wait(promise)`, `signal`, `deadline`, `abort(code)`, `isCurrent()`, and `dispose()`. The runtime owns disposal. `url`, `requestId`, and `attempt` identify the request; `partial` retains the best available partial capture for deadline handling.

- Call `context.check()` after asynchronous work and immediately before DOM interactions or accepting results. Keep the same context through all helpers; never substitute the active tab or a newer capture's context.
- Use `captureFetchText(url, options, ceilingMs, context)` for bounded text downloads, `capturePause(ms, context)` for delays, and `waitFor(getter, timeoutMs, context)` for bounded DOM polling. Helpers clamp their waits to the attempt budget. Pass cancellation to any new underlying operation and remove its listeners/timers in `finally`.
- `context.wait(promise)` rejects promptly on cancellation but **does not cancel the underlying promise**. Starting a fetch and wrapping it in `wait()` alone is insufficient. Avoid new uses of the older independent `fetchWithTimeout()` helper for capture work.
- Never swallow cancellation, stale navigation, deadline, or changed-frame errors and then perform a fallback click/fetch.
- Verify response video/part identity independently of its outgoing request URL. Accept Bilibili captions only through the existing validated WBI policy; do not reintroduce legacy-only discovery. Preserve manual → Chinese AI → other AI preference.
- Use shared DOM traversal for open shadow roots and accessible same-origin frames. Respect its limits and revalidate frame document identity before accepting content. Do not add cross-origin access or permissions.
- If UI interaction is necessary, scope it to the owned content and restore only NutEgg changes while the same navigation remains active. Never close a user's unrelated panel.

All popup results, warnings, and errors go through `tabStateManager`. Extractors return data; they do not manipulate the side panel. Internal diagnostics may contain route, attempt, elapsed time, outcome and coverage reasons, never captured text, credentials, or signed URLs.

## Tests and harness

`createExtractorPage(t, options)` creates a disposable JSDOM fixture. Without `scripts`, it loads the manifest's full production order. Supply `scripts` for isolated unit tests and `registry: []` to install fixture extractors. Paths are relative to `chrome-extension/`.

Options include `url`, `html`, `readyState`, `fetch`, and `onMessage` (outbound worker messages). Unexpected network requests fail locally. Returned helpers include:

- `load(file)`, `capture(overrides)`, and `send(message)` for reinjection and runtime messages.
- `context(options)` for a real capture context; cleanup automatically aborts/disposes it.
- `cancel(requestId)` and `navigate(url)` for ownership tests; navigate away and back to test generation changes.
- `hydrate(html, delayMs, selector)` for delayed content replacement.
- `requests`, `messages`, and `listeners` for assertions. `deferred()` and `flush()` provide controlled async gates.

The harness closes fixture windows and aborts active contexts after each test. Lightweight platform unit tests can use `createPlatformContext(url, options)` with custom document/session stubs; ownership and cancellation contracts should use the real DOM/runtime harness.

Example test setup (the complete scenarios are in `extractor-contract.test.js`):

```js
const { createExtractorPage } = require('./helpers/extractor-harness');
const page = createExtractorPage(t, {
  url: 'https://example.org/articles/intro',
  html: '<main><h1>Introduction</h1><p>A short useful article.</p></main>',
  registry: [],
});
page.load('tests/fixtures/example-article.js');
page.win.EXTRACTORS.push({
  name: 'example', detect: page.win.detectExampleArticle, extract: page.win.extractExampleArticle,
  bodyReadiness: true, onError: 'stop',
});
const response = await page.capture();
assert.equal(response.content.extractionStatus, 'ready');
```

Run these commands from the repository root after installing workspace dependencies. `NODE_PATH` exposes the existing plugin's JSDOM dependency to extension DOM tests; no additional dependency installation is needed in a configured checkout.

```bash
npm run build:extension
cd chrome-extension
NODE_PATH=../obsidian-plugin/node_modules node --test tests/extractor-contract.test.js
NODE_PATH=../obsidian-plugin/node_modules node --test tests/capture-runtime.test.js
node --test tests/page-extractor.test.js
node --test tests/chinese-common.test.js
node --test tests/bilibili.test.js
node --test tests/douyin.test.js
node --test tests/weibo.test.js
node --test tests/zhihu.test.js
NODE_PATH=../obsidian-plugin/node_modules node --test tests/article.test.js
NODE_PATH=../obsidian-plugin/node_modules node --test tests/dom-reader.test.js
NODE_PATH=../obsidian-plugin/node_modules node --test tests/youtube.test.js
NODE_PATH=../obsidian-plugin/node_modules node --test tests/twitter.test.js
NODE_PATH=../obsidian-plugin/node_modules node --test tests/discussion-extraction.test.js
NODE_PATH=../obsidian-plugin/node_modules node --test tests/source-navigation.test.js
```

Run only files affected by your change, each individually. If shared code changes, rebuild the extension and plugin from the root with `npm run build:extension` and `npm run build:plugin`. Never edit generated `dist/ai-core.js` or plugin `main.js`. Do not deploy to a live vault as part of capture validation.

## Troubleshooting

| Symptom | Inspect and verify |
| --- | --- |
| Loading shell captured as content | Body readiness and selected container, not headings/metadata or unrelated page loaders. Use delayed hydration and persistent-loader fixtures. |
| Description without captions | Player identity, validated track discovery, caption availability, deadline/phase budget, and `transcriptAvailable`. Preserve the missing-caption warning. |
| Old content after navigation | Same context after every await, navigation generation including away-and-back, frame document identity, and originating request/tab token. |
| Wrong extractor selected | Parsed hostname/path and ordered registry; include lookalike and query-string false positives in tests. |
| Works only after refreshing | Manifest dependency order, runtime manifest declaration, and reinjection regression. Never create a second popup list. |
| Caption request succeeds with unrelated data | Validate returned video/part IDs independently; never infer ownership from the requested URL. Preserve provenance. |
| Missing text or duplicated paragraphs | Use shared composed-DOM selection/serialization and existing article/DOM fixtures before writing another parser. |

For past capture reliability checks and live-site limitations, see [content-fetch verification](content-fetch-verification.md). For popup ownership rules, see [popup developer documentation](../chrome-extension/src/popup/README.md).
