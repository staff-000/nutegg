# Website panel and opening rules

NutEgg defaults to an extension-origin panel on the right of HTTP(S) pages. Auto mode floats only when a conservative, bounded DOM geometry check finds enough clear side space for the panel plus a 12px gap. Otherwise it reserves a page-viewing area beside NutEgg and shows a horizontal scrollbar when the original page is wider than that area. The site's column widths, minimum widths, DOM, and live player remain unchanged; no page iframe or reload is used. Trackpad horizontal scrolling, Shift+wheel, keyboard focus, and the scrollbar pan the page. Vertical document scrolling remains native. Scrolling, resizing, loading media and page changes can switch a floating panel to reserved space; it stays reserved until closed to avoid repeated layout jumps. Closing or navigating removes the scrollbar and restores the website’s styles while preserving subsequent site-owned edits. The panel is resizable and can move to the left in Settings. Both panel modes provide a switch to the other mode. Chrome controls the native panel's position under Appearance; native mode requires a user click and never automatically opens or analyzes.

The initial preset is **NutEgg default settings**: open content on the curated website list, skipping feeds and lists. The three built-in presets ignore saved custom rules and remain unchanged. Editing rules or accepting a rule suggestion switches to **Customized rules**, copying the selected preset as the starting point and retaining its fallback for unmatched pages. Entering Customized rules from a built-in preset replaces the previous custom rules with a copy of that preset. Editing within Customized rules keeps the current custom rules. Auto-analyze starts off.

## Rules

Each rule has a website URL regular expression and an Open or Keep closed action. Optional topic conditions apply. Reading-length and content-availability conditions are temporarily disabled and hidden in settings; their stored configuration is retained and does not affect matching or rule priority. Multiple topics combine with OR. Topics can be subjects, people, or channel names. Missing information cannot satisfy a condition requiring it.

For example, all Dan Koe videos on YouTube use website hostname `youtube.com`, Topics `Dan Koe`, and action Open. No regex is required. The editor generates the URL matcher internally; advanced regex is optional for specific URL paths. Structured channel names participate in topic matching alongside cached AI subjects and local page signals. Old author/channel rule fields migrate into Topics.

Aliases are optional alternate names for a topic entered above. For example, Topics `AI` plus an alias line `AI: artificial intelligence, 人工智能` matches any of those names. Each editor field includes an example and input hint.

“Skip feeds, search results, and content lists” targets individual content. It excludes pages showing many items, such as YouTube Home, search results, a channel’s video list, or a news feed.

Website-specific rules precede all-websites rules (`.*`). Within each level, conditional rules precede website-only rules. Keep closed wins ties. Otherwise the global default applies. A malformed regex is skipped; an evaluation timeout keeps the panel closed and appears in the rule tester. URL regex evaluation runs in a disposable worker with a 250 ms timeout.

Manual opening bypasses automatic rules. Closing suppresses reopening for that page visit. The Yes/No suggestion shows the exact proposed website plus author or topic scope. Yes saves that scope, replacing an opposite rule for the same scope; No saves nothing. Edit opens the full editor. A new document or application route starts a new visit; ordinary section anchors preserve the panel.

## Classification and analysis

Passive classification uses available article text or a visible transcript, structured author/channel metadata, title, headings and page metadata. It performs no network or AI requests. Reading time uses 200 words/minute and 400 CJK characters/minute, rounded up; video duration is not transcript reading time. Unavailable body/transcript content has unknown reading time.

Cached AI topics take precedence for the same page identity. Otherwise configured topic labels and aliases match local text. Classification details appear only in Debug info: opening rule, evidence, reading estimate, body availability, and topic provenance. Reading time refreshes from the fetched article or transcript after capture; later passive probes cannot overwrite it with an unknown estimate. Video descriptions without a transcript do not count as usable main text.

Auto-analyze runs only after a rule/default-triggered injected opening on an active tab, successful capture, and provider readiness. Manual openings never trigger it. A worker-owned claim prevents repeated automatic submissions, and existing completed results are recovered through the usual history/job flow.

## Implementation

- `chrome-extension/src/panel/` owns the host, broker, rule evaluator, shared rule helpers, mode controls and settings editor.
- The manifest exposes only the panel HTML as a web-accessible entry. A single-use worker grant and the actual browser sender tab/frame authorize embedded instances. Website messages cannot submit analysis or access credentials.
- Passive messages enter through the existing content dispatcher. `[data-nutegg-ui]` hosts are excluded by the shared DOM reader.
- `panelSettings` in local extension storage holds versioned preferences and rules. The bounded `panelMetadataCache` holds up to 200 page metadata records. Per-tab grants, suppression, document identity, auto-analysis claims and one-shot UI transfers live in session storage.
- `ContentAnalysis.contentMetadata` is optional: `{ topics: string[], author: string | null, answerableQuestions: string[] }`. Lists are deduplicated and capped at five. Old analyses and custom prompts may omit it. Existing JSON history storage preserves it without a database migration.

Targeted tests: `panel-rules.test.js`, `panel-background.test.js`, `panel-classification.test.js`, `tab-state.test.js`, and `analysis-rendering.test.js` in the extension; `ai-processor.test.ts` and `db.test.ts` in the plugin.
