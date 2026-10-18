# Connection signal and metrics

Each Chrome profile owns its API setup; Obsidian owns the shared execution mode and subscription setup. Native Obsidian actions use a separate secure API configuration. See [execution ownership](ai-execution.md).

## Signal colors

Hover over the signal light or focus it with the keyboard for details. Clicking it
opens Chrome options.

| Scenario | Color | Meaning / action |
| --- | --- | --- |
| Initial connection check or shared mode transition | Gray | Checking readiness. |
| Chrome mode, API key configured or local model selected | Green | Chrome reading is configured. |
| Chrome mode, missing API key | Amber | Configure an API or local provider in Chrome options. |
| Obsidian online, effective profile configuration ready | Green | Obsidian features are available. |
| Obsidian online, extension/plugin versions differ | Amber | Update the extension or plugin. |
| Obsidian online, AI key missing | Amber | Configure this profile’s API in **Chrome options**. |
| Obsidian online, other config warnings (such as a missing index) | Amber | Follow the warning in the tooltip or banner. |
| Connected mode, Obsidian offline | Red | Open Obsidian or explicitly choose **Use Chrome mode instead**. |
| Obsidian offline, no usable Chrome provider/key | Red | Configure Chrome AI or reconnect Obsidian. Subscription providers cannot fall back. |
| Subscription selected, CLI installation/sign-in/verification needed | Amber | Complete provider setup in Obsidian settings. |
| Subscription selected, authentication verified and Obsidian online | Green | Ready to analyze; quota is managed by the subscription. |
| Subscription selected, expired login, inaccessible model/provider, or exhausted quota | Red | Sign in, choose another model, or retry after quota reset. |
| Subscription selected, Obsidian offline | Red | Analysis pauses. Open Obsidian or use **Set up Chrome API key**, then explicitly save the mode change. |
| AI config sync or config-status request fails | Red | Configuration could not be verified; the tooltip shows the error. |
| A provider error is returned by the status/credit check | Red | The tooltip shows the reported error, such as invalid credentials or an offline local runner. |
| Provider reports a remaining balance of zero or less | Red | Add credit or choose another provider in Chrome settings. |
| Analysis or follow-up reports authentication, quota, rate limit, model, network or service failure | Red | The originating tab's tooltip shows the failure; retry after resolving it. |

Sync/config errors take precedence over version mismatch or setup warnings.
Subscription setup warnings are amber; confirmed errors take precedence. Otherwise, a version mismatch takes precedence over vault warnings.
Green indicates configuration readiness, not a guarantee that the next AI call
will succeed. Providers without a live credit/connection check may only reveal
authentication, model, quota or network errors during analysis. Confirmed provider
failures turn that tab's light red until retry clears the failure. Errors stay with
the originating tab and do not change another tab's light. Credit exhaustion uses
the provider's unrounded numeric balance, never its formatted display string.
An unknown balance is not treated as zero; subscription quota errors appear only when
the provider reports them; saving subscription settings performs no inference. Balances are also displayed in the credit pill.

Obsidian connectivity is checked on startup, tab activation, settings changes and
every 15 seconds while the side panel is visible in Obsidian mode. When Obsidian
returns, the selected Obsidian mode resumes automatically. Existing results retain
the backend that produced them. Saving to the vault and egg comparison require
Obsidian; an explicit switch to Chrome-only permits local reading and questions.

Connection checks read the current execution state without announcing configuration
changes or cancelling jobs. If an HTTP probe fails while the authenticated execution
WebSocket remains connected, Chrome keeps the vault connected and shows a neutral
checking state until the next successful check. It does not request vault setup or
start another provider's execution.

Connected long-running requests share a three-slot FIFO queue per extension worker,
leaving HTTP capacity for health and settings. Failures, timeouts, panel closure,
navigation and execution changes close affected transports and release their slots.
Ordinary tab switching keeps each tab's analysis running. Server errors after a
partial NDJSON response end with an error event; they never rewrite HTTP headers.
Execution cancellation closes its HTTP response even if a provider does not settle.
Successful completion allows the remaining response bytes to arrive.

### Verification (2026-10-18)

Targeted tests cover 20 queued successful analyses, 20 failing streamed responses
through a real six-socket HTTP pool, retained HTTP error bodies, stalled response
timeouts, cancellation on navigation/panel closure/execution changes, and normal
completion racing its WebSocket notification. They also check that routine health
checks never announce a configuration change, degraded probes show neutral checking,
and tab switching preserves unrelated work. Tests use fake providers and vaults;
they do not run inference or write to the live vault.

263 tests passed across the individual connection-mode, execution-session,
analysis-service, popup-operations, startup, ui-components, popup-renderer, tab-state,
server, execution-wire and execution-coordinator files. Both extension and plugin
builds passed. The running live plugin was not replaced during this verification.

## Consistent metrics across modes

The Chrome side panel uses the same combined totals in both modes:

**Chrome activity counters + the latest known Obsidian vault snapshot.**

- The extension reads `/metrics` even in Chrome mode. This is a read-only request;
  it does not send page content or route analysis through Obsidian.
- A successful response **replaces** `obsidianMetricsSnapshot` in Chrome storage.
  It is never added to the previous snapshot, so refreshes cannot repeatedly
  import the same activity.
- Offline, failed or malformed responses retain the last valid snapshot.
- New Chrome analyses increment `chromeMetrics`, including explicitly selected Chrome-only execution.
  Counter updates are serialized so simultaneous analyses cannot lose increments.
- Historical Chrome counters are retained. On installations without counters,
  existing cached analyses seed them once. The first new analysis is counted once.
- Obsidian records are counted by its SQLite aggregates. Chrome counters count
  successful reading analyses; time saved remains an estimate. These are activity
  totals, not distinct page or egg-topic counts: reanalyzing a page or analyzing it
  in both backends can contribute separate records. No URL-based deduplication is
  inferred from aggregate totals.

The snapshot represents the most recently reachable vault on the configured port.
Before its first successful refresh, only Chrome activity is available. Offline
changes in Obsidian appear after it reconnects. Clearing Chrome storage clears the
local counters and snapshot; it does not alter the vault's data.
