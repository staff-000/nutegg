# CLAUDE.md

## Rules

- **Existence checks** — Use `await this.app.vault.adapter.exists(path)`, not `getAbstractFileByPath()`.
- **Terminology** — "nut" = raw content, "egg" = processed knowledge file. Don't use "topic" or "raw content".
- **Database** — Persistence goes through `node:sqlite` (`DatabaseSync`, built into Node ≥ 22.13 / Obsidian desktop ≥ 1.9). Schema lives in `db.ts` only. Node's bundled SQLite has **no FTS5** — keyword retrieval is JS BM25 over the corpus. `db.available` gates graceful degradation.
- **No dynamic `import()` of node builtins or `obsidian`** — Obsidian's renderer blocks them (CORS fetch). Use CommonJS `require` for node builtins (see `db.ts`) and static imports for `obsidian`.

## Build & Deploy

```bash
# From workspace root:
npm run build                       # build all packages with build script
npm run dev:plugin                  # watch mode for obsidian plugin

# Deploy to Obsidian vault:
./deploy.sh                         # local build + copy to vault
./deploy.sh --remote [version]      # download from remote release repo & sanity check

# Release (tags, triggers GitHub Actions, and optionally deploys):
./release.sh 0.0.4                  # publish release 0.0.4
./release.sh 0.0.4 --deploy         # publish and run remote deploy sanity check

# Or within obsidian-plugin/:
cd obsidian-plugin && npm run build # tsc + esbuild
npm run dev                         # watch mode
```
Chrome extension: no build — load unpacked from `chrome-extension/` at `chrome://extensions`.

## Testing

```bash
# From workspace root:
npm test                            # run tests across all workspace packages
npm run test:plugin                 # run obsidian-plugin tests

# Or within obsidian-plugin/:
cd obsidian-plugin && npm test      # esbuild-bundle tests/*.test.ts → tests-dist/, run node --test
node --test "tests-dist/*.test.js"  # re-run without rebundling
```

- Tests use Node's built-in test runner (`node:test`) — no test framework deps.
- One file per module under `obsidian-plugin/tests/`: prompt-templates, index-reader, egg-parser, knowledge-base, db (skips when `node:sqlite` is unavailable), ai-processor, server.
- `tests/helpers.ts` provides an in-memory fake vault + plugin stub — no Obsidian runtime needed.
- Add a new test as `tests/<module>.test.ts` next to the module it covers; it's picked up automatically.
- `.md` prompt/template files are bundled as text in tests too (see `esbuild.test.mjs`).

## Architecture

Two-part system: **Obsidian plugin** ↔ local HTTP (`127.0.0.1:*`) ↔ **Chrome extension**.

### Composition

`NutEggPlugin` ([main.ts](obsidian-plugin/src/main.ts)) is the service locator. Subsystems: `aiClient`, `server`, `aiProcessor`, `knowledgeBase`, `indexReader`, `eggParser`, `indexSync`.

### Data flow

```
popup → content-script → POST /analyze (AI) → popup (results) → POST /confirm (save)
                              ↑ reads _index.md + egg files
```

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Server check + port sync |
| `GET /config-status` | `{status, issues[]}` — missing API key, missing index |
| `POST /analyze` | AI analysis, returns `{titleVerdict, coreSummary[], chapterMap[], customQuestionAnswers[], shouldRead, eggResults[], newKnowledge[], nutId}`. If the URL has cached captures (and no `force`/`questions`), returns `{history[], latest}` instead — each capture is its own versioned DB row |
| `POST /confirm` | Saves to `nutegg/_raw/YYYY-MM-DD-HH-MM-source-title.md` + appends new entries (insight + examples + mechanical `_author`/`_source` lines) to each egg's `# Unprocessed` + upserts into SQLite. Eggs with ≥20 unprocessed entries are auto-merged into their `# Knowledge` tree by an AI call; response carries `merged` |
| `POST /create-egg` | Creates `nutegg/<name>.md` from the template (topic/scope seeded from `description`) + appends the `_index.md` entry. Used by the popup's "no egg matched" flow; `/analyze` also returns `suggestedEgg` for unmatched content |
| `GET /eggs` | All eggs from `_index.md` (`{fileName, description, topic}`) — feeds the popup's manual egg picker. `/analyze` accepts an `eggs: string[]` override that skips AI routing and analyzes against exactly those eggs |
| `GET /search?q=` | BM25 keyword retrieval over saved nuts (RAG foundation) |
| `GET /history?url=` | Cached captures for a URL, newest first — popup auto-loads the latest result on open |

### Vault structure (all under `nutegg/`)

- `nutegg/_raw/*` — collected nuts (raw web content)
- `nutegg/_index.md` — egg routing: `* path/to/egg.md: description` (one per line, `#`/`>` lines skipped)
- `nutegg/<egg-name>.md` — egg file: YAML frontmatter + `> [!abstract]- Instructions:` callout (Scope, Action Guide, Key Questions, Rejection Criteria, Formatting Rules) + `# Knowledge` tree (h1; tree branches nest at `##`) + `# Unprocessed` (new entries land here first and are auto-merged into the tree at 20+; entries keep `_author`/`_source` provenance lines). Entry structure is concept → explanation → example: `- [tag] **Concept**: short phrases` + indented + `[EXPLAIN]: explanation` + indented `- 🎯 Example:` bullets — the Concept is the dedup/novelty key for analysis and merge prompts
- `nutegg/.nutegg.db` — SQLite: `nuts` table (dedup + replay + RAG corpus, JSON columns for results).

### Source files

| File | Role |
|------|------|
| [server.ts](obsidian-plugin/src/server.ts) | HTTP server, `/analyze` + `/confirm` + `/search`, metrics aggregation |
| [db.ts](obsidian-plugin/src/db.ts) | SQLite via `node:sqlite`: nuts table, BM25 search |
| [ai-client.ts](obsidian-plugin/src/ai-client.ts) | `PROVIDER_CATALOG`: 7 providers × 2 sources (official/OpenRouter). Two formats. `AIError` with typed codes. |
| [ai-processor.ts](obsidian-plugin/src/ai-processor.ts) | Two-phase AI pipeline: content analysis (verdict/summary/chapters) + per-egg delta (key questions, novel delta, reject, verdict). 1 egg = 1 combined call; N eggs = 1 + N parallel calls. Content >30k chars is **chunked** (chapter-aware for timestamped transcripts, paragraph-based otherwise) — one call per part + `aggregate-content.md`/`aggregate-egg.md` calls. `maybeMergeEgg()`: merge 20+ `# Unprocessed` entries into the knowledge tree (`MERGE_THRESHOLD = 20`). `suggestEgg()`: name/description suggestion for unmatched content |
| [prompt-templates.ts](obsidian-plugin/src/prompt-templates.ts) | Loads `src/prompts/*.md` (user-editable, translatable) + `renderPrompt()` for `{{placeholder}}` substitution |
| [index-reader.ts](obsidian-plugin/src/index-reader.ts) | Parses `_index.md`, `matchEggs()` to route content to egg files |
| [index-sync.ts](obsidian-plugin/src/index-sync.ts) | Consistency check (on load + every 5 min): egg without index entry → append `* path: topic`; index entry without egg → create from template seeded with the description; relative index paths upgraded to full vault paths |
| [egg-parser.ts](obsidian-plugin/src/egg-parser.ts) | Parses egg callout instructions (scope/action guide/key questions/formatting rules) + `# Knowledge`/`# Unprocessed` sections (h1; the tree nests `##` branches under `# Knowledge`). `appendUnprocessed()` adds entries with author/source, `countUnprocessed()`, `applyMerge()` rewrites both sections from the merge AI output |
| [knowledge-base.ts](obsidian-plugin/src/knowledge-base.ts) | `saveRaw()` (frontmatter with published/saved/author/verdict/etc.) + `appendKnowledge()` |
| [settings.ts](obsidian-plugin/src/settings.ts) | Settings tab, developer mode toggle |
| [content-script.js](chrome-extension/src/content/content-script.js) | Slim entry point: `EXTRACTORS` registry, `extractContent()`, and `chrome.runtime.onMessage` listener. Extractors live in separate files under `extractors/`. |
| [utils.js](chrome-extension/src/content/utils.js) | Shared utilities: `extractText`, `getMeta`, `truncate`, `estimateTime`, `readingTime`, `waitFor`, `extractBalanced`, `formatTime`, `parseTimestamp` |
| [extractors/youtube.js](chrome-extension/src/content/extractors/youtube.js) | YouTube: captions via timedtext/script-tag/panel with dedup, chapters from `multiMarkersPlayerBarRenderer` |
| [extractors/twitter.js](chrome-extension/src/content/extractors/twitter.js) | Twitter/X: tweet text, threads, author info |
| [extractors/article.js](chrome-extension/src/content/extractors/article.js) | Article: Medium, Substack, blogs, news (og:type, schema.org) |
| [extractors/generic.js](chrome-extension/src/content/extractors/generic.js) | Generic fallback for any webpage |
| [options.html/js/css](chrome-extension/src/options/) | Standalone settings page (port config, test connection) |
