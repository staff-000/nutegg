# Browsing rules implementation plan

Status: proposed design; no runtime behavior implemented.

## Product contract

Let users decide where NutEgg offers help, then refine those choices while browsing. The feature is opt-in and defaults to off. Settings name: **When to show NutEgg**.

Chrome requires a user gesture for `sidePanel.open()`. Navigation alone cannot reliably open a closed native panel. In this plan, **Show** means automatically display a small **Open NutEgg** page button; clicking it opens the existing native panel. Do not label this “auto-open.” Existing native panel persistence remains Chrome-managed. A rule does not automatically close an already-open panel or prevent manual opening. True automatic panel opening would require a separately designed in-page panel and is outside this implementation.

Reference: https://developer.chrome.com/docs/extensions/reference/api/sidePanel

Opening or showing the button must not initiate capture, AI analysis, transcript requests, or saving. Existing explicit capture actions retain their behavior.

## Example: YouTube off, Dan Koe on

The user saves these settings:

- Website default: YouTube → Hide.
- Exception within YouTube: Author is Dan Koe → Show.

On a Dan Koe video, the button appears with the explanation “Shown because you enabled videos by Dan Koe on YouTube.” Other YouTube videos remain quiet. Another creator mentioning Dan Koe in the title does not match the author exception.

Prefer a platform-scoped channel ID captured from the current video's verified owner data. Display the creator name beside that ID in settings. If an ID is unavailable, offer an explicitly labeled exact author-name match; do not silently treat a display name as a verified identity. A stable-ID rule must not fall back to a name match when the page ID is temporarily missing.

Users can also intentionally create a broader rule: “On YouTube, show when title or description contains ‘Dan Koe’.” This includes videos about him, rather than only videos by him.

## Settings and browsing interaction

### Settings card

1. Master switch: **Show NutEgg on matching pages**.
2. Optional general page types: Articles, Videos, Discussions, Social posts. Default all off. Offer only types supported by tested metadata adapters; do not classify an entire domain as one page type.
3. Website rows showing hostname, default Show/Hide, and exception count. An expanded row lists readable exceptions and Edit/Delete controls.
4. **Add website** accepts a URL or hostname and previews the normalized host scope. No regex or glob syntax in the normal UI.
5. **Test current page** shows detected metadata, effective decision, and winning rule. Explicitly distinguish “No match,” “Metadata still loading,” and “Author unavailable.”

Example website row:

```text
YouTube                         Hide by default
  Show videos by Dan Koe        Edit · Delete
  Hide title containing "giveaway"   Edit · Delete
  Add exception
```

### Rule editor

- Action: Show / Hide.
- Scope: This website / All websites. Default to the current website.
- Optional page type.
- Optional Author: current creator identity, or an exact name typed by the user.
- Optional **Text contains** chips and **Text excludes** chips.
- Text fields: Title, Description, Author name. Defaults to Title + Description; author identity remains a separate control.
- Contains mode: Any phrase (default) / Every phrase.
- A live sentence summarizes the complete rule before saving.

All conditions within a rule are ANDed. “Any phrase” means any included phrase in any selected field. “Every phrase” means each included phrase occurs in at least one selected field. Any excluded phrase in any selected field disqualifies that rule. Excluding a phrase does not create a separate Hide rule; the preview explains the resulting fallback.

Example: “Show YouTube videos by Dan Koe when title or description contains any of ‘focus’, ‘writing’, except ‘sponsored’.”

### Adjust while browsing

Expose **When to show NutEgg…** in the page button's overflow menu and the existing panel menu. It remains accessible through the panel even when the current page's button is hidden.

Offer readable shortcuts when metadata supports them:

- Show / Hide on this website.
- Show / Hide from this author on this website.
- Show / Hide only on this page.
- More conditions…

Show the selected scope before Save. Prefill author and website from the current page, but never save a rule inferred solely from dismissal. After saving, show a confirmation with **Undo**. Undo reverts just that operation, not a snapshot of all settings; detect intervening edits to the same rule rather than overwriting them.

Closing the page button dismisses it for this visit. Re-evaluation on the same document/route must not bring it back. Navigating to a different canonical content item starts a new visit. Settings edits may explicitly clear the dismissal after Save. Switching tabs alone does not clear it. A master switch off takes effect immediately on every tab without removing saved rules.

## Deterministic rule resolution

Evaluate from strongest to weakest tier:

1. Exact-page overrides.
2. Website-scoped conditional exceptions: author, text, and/or page type.
3. Website default.
4. Global conditional exceptions: author, text, and/or page type.
5. General page-type preferences.
6. Default Hide.

Within a tier, an exact hostname takes precedence over a matching parent-domain scope; among parent domains, the longest hostname wins. At equal scope and tier, **Hide wins over Show**. This handles a Dan Koe Show exception and a giveaway Hide exception predictably. If that particular giveaway video should still appear, an exact-page Show overrides both. Avoid hidden “most recently edited wins” or rule scores based on the number of conditions.

Explain conflicts in the editor: “Another exception hides this page. Page-specific choices take priority.” The preview lists matching rules and identifies the winner. Stable rule IDs break ties only for explanation ordering, not the decision.

Missing metadata uses a three-state match: match / no match / unknown. An unavailable author never satisfies author-equals, and an unavailable description never proves a negative text condition. While a higher-priority rule remains unknown and could change the result, keep the button hidden pending bounded metadata discovery. At the deadline use known matching rules for the reported decision, but keep the button suppressed if unresolved conditions could reverse that decision; show that limitation in the preview. Re-evaluate if a later relevant metadata update arrives. This avoids flashing the button before a pending Hide exception can be checked.

## Matching semantics

- Text matching is local and literal, with Unicode NFKC normalization, whitespace collapsing, and consistent case normalization. Preserve accents; do not use stemming, fuzzy matching, semantic AI classification, or regex in v1.
- A phrase must occur inside one field; do not concatenate fields into artificial matches. “AI” is a substring under this simple policy and could match “daily”; label the operator **contains text**, include this behavior in preview tests, and consider a separate whole-word operator later.
- Name rules use normalized equality, not substring matching. Stable author identifiers use platform + identifier equality.
- Host matching uses parsed URL hostnames and domain boundaries, never substring checks. `youtube.com.evil.test` must not match `youtube.com`.
- Website rules default to the exact hostname. Present an explicit Include subdomains choice. Known YouTube aliases can be a curated site scope covering youtube.com and its supported subdomains, with the actual scope shown in the editor. Do not invent registrable-domain handling by removing the first hostname label.
- Page overrides reuse `NutEggPageIdentity.capturePageKey`; preserve content-identifying parameters such as YouTube `v` and meaningful application routes. Ignore tracking only according to that existing contract.
- Read only current content metadata, excluding related-video titles, comment authors, navigation headings, and recommendations.

## Metadata collection

Add a lightweight metadata path separate from full capture. Existing YouTube code already reads title, description, and channel name; its player snapshot currently omits channel ID. Extend the bounded snapshot allowlists and validators to preserve channel ID, and associate it with the verified current video ID. Reuse parsing helpers where possible without invoking transcript extraction or full capture readiness.

Suggested record:

```js
{
  pageKey, navigationGeneration, platform, pageType,
  title, description,
  author: { id, name, profileUrl },
  availability: { title, description, author },
  // availability values: loading | available | unavailable
}
```

An available empty description is different from unavailable description data. Each asynchronous response must retain and recheck the page key and navigation generation. Clear previous metadata immediately on SPA navigation; a stale YouTube player response must never make the next video inherit the previous author.

Start with YouTube watch pages and conservative article metadata (owned structured data, heading, description, author). Treat unsupported page types as unknown. Shorts, feeds, playlists, and platform-specific social/discussion pages require their own ownership fixtures before enabling type/author matching. Website defaults and page overrides still work on ordinary supported HTTP(S) documents without metadata.

Use a short debounced discovery window (initial proposal: 250 ms debounce, 3 second initial deadline). Observe relevant metadata roots rather than rescanning the whole document for every mutation. Stop retries at the deadline; later platform navigation or relevant metadata events can trigger a fresh bounded read. Pause UI work in hidden documents. Keep one observer/controller per top-level document across reinjection and dispose it on teardown.

## Storage and architecture

Store a versioned `browsingRules` object in `chrome.storage.local` containing the master switch, page-type defaults, rules, and revision. Rules contain ID, enabled flag, action, scope, optional conditions, and a display label. Keep current metadata and per-visit dismissal ephemeral; do not persist descriptions or browsing history. Version validation rejects unsupported or malformed rules safely without losing valid settings.

Suggested new modules, all under `chrome-extension/src/`:

| Module | Responsibility |
| --- | --- |
| `browsing/rules.js` | Pure validation, normalization, matching, precedence, explanation codes; usable in worker and settings |
| `background/browsing-rules.js` | Trusted storage ownership, serialized mutations, revision checking, sender validation, rule evaluation and panel-open requests |
| `content/page-metadata.js` | Passive metadata adapters, page ownership and navigation lifecycle |
| `content/browsing-prompt.js` | Isolated page button, dismissal and accessible rule controls |
| `options/browsing-rules.js` | Settings editor and preview, imported/wired by existing options entry |
| `popup/ui/browsing-rules.js` | Current-page rule entry and editor integration |

Do not grant content scripts broad storage access: the current worker restricts local storage to trusted contexts. Use narrowly scoped messages for metadata evaluation and rule edits. Return only the current decision and relevant rule display data to the page controller. Validate sender extension ID, top frame, document identity, HTTP(S) tab URL, bounds, and operation schema; derive tab/host from the sender rather than trusting payload scope. Arbitrary cross-site rule management remains in extension settings. No page-window message bridge may mutate preferences.

The existing worker rejects content-script messages after its special YouTube handler. Add explicit handlers for this feature before that guard, with their own checks; preserve the privileged guard for other actions. Serialize changes and attach a revision so simultaneous settings/page edits cannot silently overwrite each other. After a successful change, invalidate affected active decisions and notify open settings/panel views.

For **Open NutEgg**, call `chrome.sidePanel.open()` directly in the click-triggered message handler without intervening asynchronous storage or metadata work. Derive the target tab from the validated sender. Verify gesture preservation in real Chrome; if opening fails, show a short fallback instructing the user to click the toolbar icon. Do not try to open on unrelated website clicks.

Manifest wiring follows the existing classic-script loading order. Keep the single capture declaration and reinjection contract. Existing sidePanel/tabs/storage permissions should suffice; verify during implementation. No context-menu integration or additional permission is required for v1.

All tab-specific panel metadata, decisions, errors, and editing state must flow through `tabStateManager`. Background decisions remain keyed by document/page generation and cannot use whichever tab happens to be active when an async operation finishes.

## Presentation and accessibility

Use a compact page-edge button, not a banner or modal on page load. Isolate styles with Shadow DOM, provide keyboard focus, accessible names, sufficient contrast, and Escape dismissal for its menu. Avoid covering player controls; suppress the prompt during fullscreen playback. Hide it while the NutEgg panel is known to be open, using feature-detected lifecycle APIs where supported and an explicit panel connection on older Chrome. Restore according to the current rule after the panel closes, respecting dismissal.

All text uses NutEgg's existing i18n system and supported locale dictionaries. Pass only the required localized UI messages to content scripts instead of exposing settings or credentials. Render metadata as text, never HTML. Do not log raw page titles/descriptions or author identifiers in routine diagnostics.

## Implementation sequence

1. **Rule engine and schema.** Implement pure matching and three-state evaluation, host/page identity, validation, explanations, and revision-safe mutations. Unit-test the Dan Koe scenario before any UI integration.
2. **Passive metadata.** Add YouTube author ID extraction and lightweight article adapter. Test stale SPA metadata, missing fields, and no network/transcript side effects.
3. **Settings editor and preview.** Build website defaults, author/text exceptions, page overrides, explanations, and undo. Keep the feature off by default; preserve existing user settings.
4. **Browsing controls.** Add the page button and panel menu, explicit scope selection, dismissals, validated messages, and click-to-open behavior. Wire navigation, reinjection, and settings updates.
5. **Localization and verification.** Add all supported translations, targeted integration tests, extension build, and real Chrome checks. Ship without automatic AI processing or an embedded panel.

## Validation and completion criteria

New targeted test files: `browsing-rules.test.js`, `page-metadata.test.js`, and `browsing-prompt.test.js`. Extend `youtube.test.js`, `options-setup.test.js`, and relevant worker/message tests only where changed. Run individual affected files as required by repository guidance; build with `node build.js` in `chrome-extension/`.

Required cases:

- YouTube Hide plus Dan Koe stable-ID Show shows only that author's videos.
- Other authors mentioning Dan Koe match text rules but not the author rule.
- Display-name collision and rename do not change a stable-ID rule's identity.
- Matching Hide exception defeats Show at equal tier; exact-page Show overrides both.
- Include-any/include-all/exclude semantics, selected fields, Unicode, empty and unknown data.
- Host lookalikes, explicit subdomains, tracking parameters, and distinct video IDs.
- Delayed author loading and SPA navigation never show a prompt using the previous video's metadata.
- Two tabs with different decisions and background worker restart do not leak state.
- Dismissal, undo, concurrent edits, master switch, settings refresh, and reinjection behave consistently.
- Missing content-script access and restricted Chrome pages degrade quietly; manual panel access continues.
- Forged/malformed/stale messages cannot write unrelated rules or open a different tab's panel.
- Localized keyboard-accessible controls, narrow viewport, zoom, fullscreen video, and no page layout shift.
- Rule evaluation causes zero AI, transcript, or external classification requests.

Real Chrome acceptance: visit a Dan Koe video and a different creator, navigate between them without reload, edit rules from the current page, restart the browser, test two windows, and verify the page-button click opens the native panel. Exercise both modern Chrome and a supported older-version fallback where feasible; document any untested versions. Mock tests validate rule logic and messaging, but do not substitute for the actual Chrome user-gesture check.

Done means a user can configure the example entirely through UI, understand why a page is shown/hidden, reverse a choice, and retain manual access on hidden sites. A rule saying Show never promises that Chrome will automatically open its native panel.
