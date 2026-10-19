# Background analysis and side-panel recovery

Submitted Stage 1 and Stage 2 requests belong to Chrome's background worker. Closing the side panel detaches its subscribers; queued and running requests continue within their existing queue/provider timeouts. Reopening restores status/results before cache/history lookup or content fetching. No AI request is submitted by restoration.

## Components and protocol

- `chrome-extension/src/background/analysis-jobs.js`: request identity, subscriber lifecycle, cancellation, terminal state and the finite-work heartbeat.
- `chrome-extension/src/background/analysis-job-store.js`: extension-owned IndexedDB transactions and retention. Chrome history remains in its existing serialized cache; connected results still use existing Obsidian history.
- `AnalysisService` and `PopupOperations`: panel transport, lazy result loading and reconstruction through `tabStateManager`. Stage 1 → Stage 2 orchestration remains here.

The existing `nutegg-analyze` port uses protocol version 2. `analyze` carries a UUID, originating tab ID, immutable capture, and restoration context. The worker persists admission before AI execution. Reuse of an ID with different inputs is rejected. Other operations are `subscribe` (window snapshot), `detail` (full request/result), `cancel`, `viewed`, and `saved` (a confirmed collection/Hatch receipt). Replies include `accepted`, `snapshot`, `job`, `partial`, `detail`, or `error`; job updates have monotonically increasing revisions. Older panel transports receive a reload message. No Obsidian endpoint or execution-protocol change is required.

The worker's tab URL/generation, browser-session identity, originating window, execution revision and request UUID guard restoration and completion. A stable logical panel-session ID per window preserves diagnostics attribution across reopening. Navigation away/back, reload, closure and incompatible execution changes cancel obsolete requests; mere tab activation and port disconnection do not. A new worker marks unfinished records interrupted rather than guessing whether to resubmit.

Navigation events received before the job manager initializes update the small generation map in session storage. Initialization waits for those writes before reading ownership. This preserves lazy loading of full source/results without accepting jobs from a previous document after a worker restart.

## Stages and persistence

An uninterrupted original panel keeps automatic Stage 2 behavior. If the panel closes before Stage 2 is submitted, Stage 1 finishes and remains available. Reopening shows **Continue to egg analysis**, using the original full capture, questions, options and Stage 1 result. Stage 2 submissions are deduplicated against their parent and request options. A submitted Stage 2 completes independently; restored results combine returned and previously cached egg results with the existing composition function.

Each terminal result is applied once per panel. Later metadata revisions and tab activation preserve follow-ups, selections and save state. Confirmed save receipts retain collection/Hatch status when reopening, validate the nut ID and page ownership, and never mark a different analysis's entries as hatched. A stopped Stage 2 restores cached successful egg results with its failure status; an explicit retry requests only missing eggs. A failed partial result does not count as an unread success.

IndexedDB stores complete submitted source text, discussion, coverage/provenance, output preferences, Stage 1 context, cached egg results, status and final response. Credentials and authentication headers are excluded. Streaming section snapshots stay in memory and are available when reconnecting to a live worker. Progress is not written per token.

Active records are never evicted to admit another request. Terminal recovery records expire after 24 hours, with a maximum of 100 and a total 50 MiB budget. Oldest terminal records are evicted first. Admission storage failure prevents provider execution. A terminal storage failure leaves the result usable in memory with a save warning; analysis is not repeated. Recovery information is supplemental to normal history, rather than an unlimited archive.

Clearing Chrome cache clears Chrome recovery records even if the manager has not previously initialized, and blocks pre-clear work from restoring those records or repopulating the ordinary Chrome cache. Disabling Chrome caching retains no detached completed Chrome result. Active jobs remain visible, and a panel that reconnects before completion still receives the result; that ephemeral result is removed when its last subscriber disconnects. Neither action deletes Obsidian history. A single 25-second extension-API heartbeat exists only while submitted jobs remain outstanding and stops after success, cancellation or failure.

## Validation

From `chrome-extension/`, run each affected file individually:

```bash
node --test tests/analysis-job-store.test.js
node --test tests/analysis-jobs.test.js
node --test tests/analysis-recovery.test.js
node --test tests/analysis-service.test.js
node --test tests/popup-operations.test.js
node --test tests/connection-mode.test.js
node --test tests/execution-session.test.js
node --test tests/tab-state.test.js
node --test tests/analysis-activity.test.js
node --test tests/actions.test.js
node --test tests/startup.test.js
node --test tests/popup-renderer.test.js
NODE_PATH=../obsidian-plugin/node_modules node --test tests/i18n.test.js
```

Build from the root with `npm run build:extension`. This feature does not modify shared code or the Obsidian plugin.

Manual acceptance: in Chrome-only and an isolated Obsidian-connected vault, submit multiple analyses, close the panel during waiting/execution, reopen both before and after completion, and check request counts and originating tabs. Verify that resumed Stage 1 waits for a click, resumed Stage 2 retains all egg results, warnings/unread state survive, and navigation cancels without cross-page restoration. Explicitly stop/restart the worker to verify interrupted states and no automatic retries. Do not perform Hatch or deployment in the live vault.

### Verification record (2026-10-19)

- All 276 targeted tests passed across 14 individually run files (the commands above plus `tests/youtube.test.js`). Extension build and `git diff --check` passed.
- Live Chrome-only capture used DeepSeek on a public Bilibili video. The panel was closed during a running provider request; reopening restored the completed analysis. A second close/reopen preserved two successful provider calls (the configured analysis pipeline) and one collected-item increment, with no extra request or metric increment.
- Live connected verification used ChatGPT sign-in in the isolated `NutEgg-ChatGPT-Test-t74kc2al` vault on port 27124 after user-approved pairing. A 36,101-character Wikipedia article survived Stage 1 closure/reopening without refetching or resubmission. Stage 1 finished with four provider calls and an explicit **Continue to egg analysis** action. Clicking once submitted Stage 2, which completed after another panel closure and restored its egg results, original summary, full source length and references (seven calls total, including consolidation). Another close/reopen preserved those seven calls and the collected-item count. The test plugin did not expose panel aggregates; the UI correctly reported those counters unavailable while retaining current-tab diagnostics. Chrome-only mode and its original server-port preference were restored afterward. No plugin deployment or live-vault analysis/Hatch was performed.
- Following review, added regressions for tab reactivation during follow-up, preserved save state across reopening, failed/cancelled/interrupted Stage 2 with cached successes, save-receipt identity and reanalysis isolation, and fresh-worker navigation/reload/closure/application routes versus ordinary anchors. All 288 targeted tests across the same 14 individually run files pass, and the extension builds. These follow-up fixes were verified with controlled fixtures; the live checks above preceded them.
