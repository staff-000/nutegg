# Content fetch reliability verification

The content reader now uses exact platform host/path detection, application-route-aware identity, cancellation-aware X interactions, and a shared composed-DOM text reader. The runtime remains bounded by the existing 20-second overall deadline and saved retry settings.

## Runtime behavior

- Opening a page or activating its tab checks saved history before starting page extraction, independently of connection readiness. A cached body avoids a fresh capture; a miss, lookup failure, or analysis-only entry falls through to extraction. Explicit refresh bypasses saved history. Navigation generations and user intent still guard late lookups, and a pending manual extraction takes precedence over automatic history selection.
- Article/generic readiness observes the selected body for 300 ms of stable text, for at most one second per attempt. Short complete bodies remain usable. Missing bodies and loaders remain retryable; explicit access restrictions preserve available text and report a warning.
- The reader preserves headings, links, code whitespace, lists, quotes, captions, and simple tables. Merged tables use row text. Hidden controls and comment/sidebar/navigation regions are excluded.
- Open shadow roots, slots, and accessible same-origin frames participate in selection and serialization. Limits: 64 roots, 16 frames, four boundary levels, 100,000 visited nodes; candidate scoring inspects at most 128 candidates per root. A reached limit records partial coverage.
- `captureCoverage` records only known reasons and available character counts. Absence does not assert completeness. Warnings remain separate from source text and AI-generation status, and persist through Chrome history and Obsidian snapshots/raw archives.
- Hashes beginning `#/` or `#!/` identify different documents. Ordinary anchors retain the same identity. Legacy cache entries need a matching original route URL before reuse.
- YouTube retains immediate local downloads and concurrent read-only snapshots. Local network work is bounded to 2.5 seconds, and the attempt reserves up to two seconds for the transcript panel without shortening ordinary successful 1.5-second downloads. The overall deadline and two-request network limit still apply.

## Automated checks

Run individual files with `NODE_PATH=../obsidian-plugin/node_modules node --test tests/<file>.test.js` from `chrome-extension`. Affected files include dom-reader, article, twitter, youtube, capture-runtime, capture-retries, page-extractor, source-navigation, chinese-extractors, discussion-extraction, content-url, connection-mode, actions, popup-renderer, helpers, ui-components, tab-state, startup, and i18n.

For Obsidian, run `node esbuild.test.mjs` and then each of server, knowledge-base, and i18n under `tests-dist` individually. Both extension and plugin builds are required because shared URL/types changed. The focused checks passed 382 Chrome tests across 19 files and 61 plugin tests across three files (443 total). After live testing exposed another X readiness issue, twitter and capture-runtime were rerun individually with five added cases. Both builds and whitespace checks passed. Startup verification also exposed an existing out-of-scope `state` reference in environment initialization/error handling; those guards now use the current settings authentication method.

## Manual Chrome checks (2026-10-16)

An isolated loopback fixture page loaded the actual updated reader sources as ordinary browser scripts. This verifies browser DOM behavior independently of extension reload and authentication; it does not replace a live extension smoke test.

| Case | Observed outcome | Approximate elapsed |
| --- | --- | --- |
| Technical article | Code, table, and one copy of the quotation retained | 320 ms |
| Delayed content | Placeholder replaced with the hydrated body | 548 ms |
| Open shadow root + slot | Shadow and slotted text retained | 338 ms |
| Same-origin `srcdoc` iframe | Embedded article retained | 324 ms |
| Application hash navigation | Previous capture invalidated | Immediate |
| Access wall | Available introduction retained; access warning returned | 4 ms |

A fixed synthetic tutorial compared the old/new synchronous article reader: the old version omitted code/table text and duplicated its nested quotation; the new version retained both and emitted the quotation once. Five-read averages in jsdom were roughly 7 ms versus 22 ms. These are illustrative local measurements, not live-site performance guarantees. Stable-body observation adds approximately 300 ms to ordinary text captures; fast successful YouTube caption paths do not acquire that wait. No AI calls are added.

Live YouTube testing on `h6vY3g8LFeA` captured 5,237 words through the transcript-panel route. The existing player transcript panel remained open and captions stayed enabled. Switching from X back to YouTube restored the correct YouTube history without the X loading warning. NutEgg reported zero new AI calls throughout these capture checks.

Live X testing on `2104198133928390984` exposed a false loading warning and repeated retries while replies were still loading. Post extraction now declares readiness from the requested post body, excludes reply loaders and reply article cards, and refuses disconnected/quoted expansion controls. Added runtime fixtures cover reply loading, an actively loading post, an empty post, a collapsed quoted post, and an expansion that has not completed; the complete-body fixture also checks text beyond 500 characters.

After the follow-up extension reload and page refresh, the live X capture showed 101 words / 587 characters with no loading warning, correct author attribution, and zero AI calls. Visual comparison confirmed the complete post, including its final sentence, in the fetched-content box. The apparent 500-character cutoff in earlier accessibility observations was the accessibility text representation being shortened; the visible content box retained the ending. This verifies the requested post without expanding or capturing unrelated replies.

Obsidian persistence is covered by snapshot and archive-path tests; no plugin was deployed into the live vault. Cross-origin frames, closed shadow roots, PDF/OCR, additional YouTube routes, and new video-transcription providers remain out of scope.
