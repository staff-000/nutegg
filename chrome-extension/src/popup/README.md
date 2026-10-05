# Popup state and async operations

`state/tab-state.js` is the authoritative store for this panel session. Its tab
records and operation contexts are immutable. Actions dispatch named events;
they never synchronize a writable session with a cache or restore DOM snapshots.
`SettingsState` belongs to the store's global settings and persists defaults.
Activating an existing tab does not change those defaults.

## Ownership

| Module | Responsibility |
| --- | --- |
| `state/tab-state.js` | Records, reducers, tokens, views, activity, receipts and diagnostics |
| `services/popup-operations.js` | Async extraction, history, analysis, save, follow-up and creation |
| `services/analysis-service.js` | Backend and Chrome message transport |
| `services/environment-service.js` | Versioned shared status, credit and metrics requests |
| `action/` | Capture user inputs synchronously and start operations or dispatch events |
| `ui/popup-renderer.js` | Render the selected record and reset controls |
| `popup.js` | Compose these modules and wire browser/UI events |

## Tab and operation lifecycle

`activateTab(tabId)` selects and renders synchronously. Its activation lease
contains an epoch and page generation. Every awaited activation setup step
validates this lease before continuing. An activation epoch applies only to
hydration; switching tabs does not cancel background operations.

`beginOperation(tabId, kind, inputs, dependencies)` captures an immutable context
before the first await. Operation code uses that context for every payload and
target. After an await, it may validate its token, but must not read the active
tab pointer, DOM inputs or fresh tab data to construct a request.

`commitOperation(token, event)` validates the page generation, request ID,
running state and dependency versions before applying the reducer. Success,
failure and cleanup use the same validation. History depends on source and
result-selection revisions; Stage 2 depends on source and Stage 1 versions;
follow-up and saving depend on the captured result revision. Questions also have
request-specific IDs. New source/result revisions invalidate dependent jobs.

URL updates, reloads and explicit content refresh replace the page record
immediately, even in background tabs. Closure removes it. Generations and request
IDs are never reused within the session, including when a tab ID is recreated.

Analysis, saving, follow-up and creation cannot overlap on the same tab. They can
run concurrently on different tabs. Extraction and history have independent
operation records and errors. Shared catalog/status requests have their own
versions; egg creation supersedes older catalog responses.

## Views and rendering

`currentView` is explicitly `capture` or `results`. A successful analysis
atomically stores the result, clears running state, records completion and selects
results, including in background tabs. Back selects capture; View Analysis selects
results. A failed operation preserves the last successful result and view.

Fast Stage 1 → Stage 2 uses one continuous operation. Confirmation pauses complete
Stage 1; subsequent Stage 2 completes separately. Egg caches belong to the current
Stage 1 result. Cached-only selection changes make no AI request or activity.
An explicit Egg Analysis click that uses cached results shows a confirmation message;
cached composition failures show an error and preserve the previous result.
Knowledge-disabled cached entries remain visible; requesting knowledge reruns only
eggs that still need it, subject to the egg's own generation instruction.

The renderer reads the current store, never a captured record. Tab-specific
background events do not render the selected tab. Each pass explicitly sets
controls' disabled states, labels, titles, visibility and availability. Large
content/list updates are keyed, and unchanged input values are not reassigned, so
typing, selection and focus survive unrelated renders. Scroll, section expansion
and input drafts belong to each tab. The egg-analysis dropdown closes on tab
switch, selection, outside click or Escape.

Running and unread counts derive from the same records. Only displaying the latest
results in the active, visible panel marks them read. These counts cover the current
Chrome window and reset when the panel closes. There is no browser-wide job
persistence, toolbar badge, backend cancellation or additional Chrome permission.

## Save receipts and diagnostics

A save targets the captured result. Navigation prevents its UI commit, but an
accepted backend write can still finish. The store keeps the latest 50 save
receipts, including results received after navigation or closure, without
recreating the page. A disconnected response has an `unknown` outcome, since the
client cannot determine whether the backend accepted the write.

Diagnostics are opt-in. In extension DevTools, enable them with:

```js
chrome.storage.local.set({ popupDiagnostics: true });
```

In side-panel DevTools, inspect `NutEggPopupDiagnostics()`. The buffer contains at
most 200 event records: tab ID, generation, operation kind, request ID and accepted
or discarded reason. It excludes page content, URLs, questions, credentials and
error text. The buffer resets when the panel closes. Disable it with the same
setting set to `false`.

## Verification

From `chrome-extension/`, run the relevant files with `node --test`:
`tests/tab-state.test.js`, `tests/popup-operations.test.js`, `tests/actions.test.js`,
`tests/popup-renderer.test.js`, `tests/analysis-activity.test.js`,
`tests/analysis-service.test.js`, `tests/startup.test.js`, `tests/state.test.js`,
`tests/ui-components.test.js` and `tests/i18n.test.js`.

The deferred-promise tests exercise both completion orders, activation races,
navigation, closure, stale errors/cleanup, result-dependent requests and actual
controller/component rendering. The startup test loads the declared popup script
graph in browser order.

For a manual check, reload the unpacked extension and reopen its panel. Start
analysis on A, then B, then return to A before completion. Both tabs should show
their own results when ready. Repeat with Stage 2: B's egg-analysis button must
remain enabled while A runs. Navigate or reload A during a request and verify its
old response cannot replace the new page or leave a loading button behind.

## Discussion capture

Discussion is off by default, except Reddit threads, which enable it on initial
capture even before comments load. Other short-body forum threads with at least
three substantial replies (800 non-whitespace characters, and at least three
times the body length) enable it for that page. An explicit off choice survives
refresh; a short body shows a nonblocking warning.
Auto-enable never changes global defaults.

Load discussion opens or scrolls toward the discussion and performs at most three
scroll steps. The panel polls for up to ten snapshots, one second apart; it does
not delay Analyze. A DOM observer retains comments removed by virtualized lists
for up to two minutes; Refresh reads the retained buffer. Turning Discussion off
or changing the page disconnects the watcher. No next-page or paginated-reply
traversal is performed. Captures are capped at 300 items, 150k text characters,
and 6k characters per item. Quiet loading never means the discussion is complete.

Adapters cover Reddit, YouTube, TikTok, Douyin, Bilibili open shadow roots, Zhihu,
Discourse and traditional forum markup, with a generic comments fallback.
Zhihu question answers belong to discussion; answer permalinks keep the selected
answer in the body. Unrecognized layouts and unloaded comments are distinct from
an analyzed discussion with no substantive content. Site layout changes and
closed shadow roots may require adapter updates; verify actual logged-in pages
before releasing.

Analysis freezes the selected sources. Later captures update the draft only;
saving and follow-up use the analysis snapshot. History persists the structured
capture through a nullable SQLite capture_payload column, migrated additively.
Stances refer to a specific claim. Counts come from deduplicated source IDs;
commenter counts require stable identities. Likes and net vote scores are
separate reactions, never extra people. All metrics describe the captured sample.

Targeted tests: tests/discussion.test.js and tests/discussion-extraction.test.js,
plus the existing settings, store, operations, renderer, transport, startup and
localization tests. Live browser QA was unavailable in the implementation session.

Discussion selectors use a 2×2 grid. Results contain paraphrased highlights without comment quotations or outbound comment links. Bilibili capture traverses the nested open roots for comment text, user info and reactions, and preserves loaded reply ownership. On Zhihu question pages, comments are linked to their own answer (including explicitly identified external panels); unowned floating panels are excluded rather than attributed to another answer.

Discussion output is grouped into short titles and up to three concise highlights per group. Stances use inline badges with comment counts and available likes (or net scores on vote-based forums); missing reactions and commenter counts are omitted. Detailed claim/argument/source explanations are not displayed.

Insightful or detail-rich comments can appear as up to two brief extra insights per group, retaining useful details as supplements to the content while ordinary comment groups stay compact.
