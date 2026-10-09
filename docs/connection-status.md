# Connection signal and metrics

Chrome is the source of AI settings. Obsidian uses the synced provider, model,
credentials, chunk window size and completion token limit. Subscription providers
require Obsidian mode and its local bridge.

## Signal colors

Hover over the signal light or focus it with the keyboard for details. Clicking it
opens Chrome options.

| Scenario | Color | Meaning / action |
| --- | --- | --- |
| Initial connection check | Gray | Checking readiness. |
| Chrome mode, API key configured or local model selected | Green | Chrome reading is configured. |
| Chrome mode, missing API key or subscription provider selected | Amber | Configure an API or local provider in Chrome options. |
| Obsidian online, config synced and AI configured | Green | Obsidian features are available. |
| Obsidian online, extension/plugin versions differ | Amber | Update the extension or plugin. |
| Obsidian online, AI key missing | Amber | Configure AI in **Chrome options**, then sync. |
| Obsidian online, other config warnings (such as a missing index) | Amber | Follow the warning in the tooltip or banner. |
| Obsidian offline, Chrome AI configured | Amber | Temporarily reading in Chrome; vault features need Obsidian. |
| Obsidian offline, no usable Chrome provider/key | Red | Configure Chrome AI or reconnect Obsidian. Subscription providers cannot fall back. |
| AI config sync or config-status request fails | Red | Configuration could not be verified; the tooltip shows the error. |
| A provider/bridge error is returned by the credit check | Red | The tooltip shows the reported error, such as invalid credentials or an offline local runner. |
| Provider reports a remaining balance of zero or less | Red | Add credit or choose another provider in Chrome settings. |
| Analysis or follow-up reports authentication, quota, rate limit, model, network or service failure | Red | The originating tab's tooltip shows the failure; retry after resolving it. |

Sync/config errors take precedence over version mismatch or setup warnings.
Otherwise, a version mismatch takes precedence over other Obsidian warnings.
Green indicates configuration readiness, not a guarantee that the next AI call
will succeed. Providers without a live credit/connection check may only reveal
authentication, model, quota or network errors during analysis. Confirmed provider
failures turn that tab's light red until retry clears the failure. Errors stay with
the originating tab and do not change another tab's light. Credit exhaustion uses
the provider's unrounded numeric balance, never its formatted display string.
An unknown balance is not treated as zero; subscription quota is checked only when
the provider actually reports it. Balances are also displayed in the credit pill.

Obsidian connectivity is checked on startup, tab activation, settings changes and
every 15 seconds while the side panel is visible in Obsidian mode. When Obsidian
returns, the selected Obsidian mode resumes automatically. Existing results retain
the backend that produced them. Saving to the vault and egg comparison require
Obsidian; fallback only performs Chrome reading and questions.

## Consistent metrics across modes

The Chrome side panel uses the same combined totals in both modes:

**Chrome activity counters + the latest known Obsidian vault snapshot.**

- The extension reads `/metrics` even in Chrome mode. This is a read-only request;
  it does not send page content or route analysis through Obsidian.
- A successful response **replaces** `obsidianMetricsSnapshot` in Chrome storage.
  It is never added to the previous snapshot, so refreshes cannot repeatedly
  import the same activity.
- Offline, failed or malformed responses retain the last valid snapshot.
- New Chrome analyses increment `chromeMetrics`, including offline fallback.
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
