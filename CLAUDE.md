# CLAUDE.md

> Single source of truth for AI coding agents & developers working on NutEgg.
> Optimized for token efficiency: concise rules, direct file navigation, and targeted test commands.

---

## ⚡ Fast Reference: Where Does Code Live? (Token-Saving File Map)

Do **NOT** read entire large files or recursively grep across the repo. Navigate directly to the responsible module:

| Task / Feature | Exact File Path | Notes |
|:---|:---|:---|
| **AI Analysis & Prompts** | `shared/src/ai-processor.ts`, `shared/workflow/*.md` | Single source of truth for prompts, chunking, and evaluation |
| **AI Providers & Models** | `shared/src/catalog.ts`, `shared/src/client.ts` | `PROVIDER_CATALOG`, OpenAI, Gemini, Claude, DeepSeek, Ollama |
| **Shared Types** | `shared/src/types.ts` | `QuestionScope`, `CapturePayload`, `AnalysisResult`, `KeyAnswer` |
| **Rebuilding Shared AI for Chrome** | `chrome-extension/build.js` | Bundles `shared/` into `chrome-extension/dist/ai-core.js` |
| **Popup State Management** | `chrome-extension/src/popup/state/` | `session-state.js`, `tab-state.js`, `settings-state.js` |
| **Popup Action Controllers** | `chrome-extension/src/popup/action/` | `analyze.js`, `tab.js`, `save.js`, `history.js`, `interaction.js` |
| **Popup Background Services** | `chrome-extension/src/popup/services/` | `analysis-service.js`, `env-service.js`, `page-extractor.js` |
| **Popup UI Components** | `chrome-extension/src/popup/ui/` | `banners.js`, `capture-view.js`, `verdict.js`, `mindmap.js`, `chapters.js`, `qa.js`, `eggs.js`, `actions.js`, `results-view.js`, `metrics.js`, `sections.js` |
| **Popup Entry & Event Wiring** | `chrome-extension/src/popup/popup.js` | Slim coordinator wiring UI, Actions, and State |
| **Chrome i18n & Helpers** | `chrome-extension/src/i18n.js`, `src/helpers.js` | `t(key, params)` in 10 languages; date/time formatting |
| **Content Extractors** | `chrome-extension/src/content/extractors/` | `youtube.js` (transcripts/chapters), `twitter.js`, `article.js`, `generic.js` |
| **Extension Background Worker** | `chrome-extension/src/background/service-worker.js` | Standalone AI handling, long-lived ports, keep-alive |
| **Obsidian Local Server** | `obsidian-plugin/src/server.ts` | Local HTTP API (`127.0.0.1:27123`) for `/analyze`, `/confirm`, `/ask` |
| **Obsidian SQLite & Search** | `obsidian-plugin/src/db.ts` | `node:sqlite` DB, BM25 keyword search, schema definitions |
| **Obsidian Vault & Egg Parser** | `obsidian-plugin/src/knowledge-base.ts`, `egg-parser.ts` | Egg instructions, `# Knowledge` tree, `# Unprocessed` queue |
| **Obsidian Workflows & Sync** | `obsidian-plugin/src/workflow-manager.ts`, `index-sync.ts` | Auto-seeds `nutegg/_workflow/`, keeps `_index.md` consistent |

---

## 🚨 Critical Invariants & Rules

1. **Terminology**:
   - **Nut** = raw captured content (markdown archived under `nutegg/_raw/`).
   - **Egg** = curated knowledge topic note with a hierarchical `# Knowledge` tree.
   - Do NOT use "topic" or "raw content" interchangeably with nut/egg.
2. **Shared AI as Single Source of Truth**:
   - Any change to prompts, chunking, AI parsing, or types MUST be made in `shared/src/` (or `shared/workflow/`).
   - After modifying `shared/src/`, always run `npm run build` (or `node build.js` in `chrome-extension/`) to update `chrome-extension/dist/ai-core.js`. Never edit `dist/ai-core.js`.
3. **Tab State Isolation**:
   - Chrome extension side-panel shares one popup instance while the user switches active browser tabs.
   - All tab-specific data (analysis results, warnings, errors, extraction state, questions scope) MUST be saved and restored via `tabStateManager`.
   - Never leave transient warnings or errors pinned across tab switches.
4. **Defensive Stage & Session Checks**:
   - Always call stage checks using optional chaining: `session.isStage1?.()`.
   - Guard history and list lengths: `session.captureHistory?.length > 0`.
5. **QuestionScope (`within` vs `beyond`)**:
   - `"within"`: Grounded strictly to content (`- Grounding:` rule included in prompt).
   - `"beyond"`: Grounding prompt is stripped via `getContentOutputRules(capture, "beyond")` to allow unconstrained justification, fact-checking, or external reasoning.
6. **i18n & Localization**:
   - Use `t("key")` (from `src/i18n.js` / `src/helpers.js`).
   - Supported across 10 languages: `en`, `zh-CN`, `zh-TW`, `ja`, `ko`, `es`, `de`, `fr`, `ru`, `pt-BR`.
   - **Never translate the brand name "NutEgg"** in any language.
7. **Obsidian Vault Rules**:
   - Existence checks: Use `await this.app.vault.adapter.exists(path)`, NEVER `getAbstractFileByPath()`.
   - Database: Persistence uses `node:sqlite` (`DatabaseSync`). Schema lives strictly in `db.ts`. Node SQLite has **no FTS5**; keyword retrieval uses JS BM25.
   - No dynamic `import()` of node builtins or `obsidian` in renderer context; use CommonJS `require` for node builtins.

---

## 🛠️ Build & Development Commands

```bash
# Workspace root
npm run build                       # Build all packages (@nutegg/shared -> extension & plugin & website)
npm run build:extension             # Build chrome extension bundle (ai-core.js)
npm run build:plugin                # Compile obsidian-plugin (tsc + esbuild)
npm run dev:plugin                  # Watch mode for obsidian plugin

# Deploy to local Obsidian vault
./deploy.sh                         # Build + copy to active vault
./deploy.sh --remote [version]      # Verify remote release deploy

# Chrome extension development
# Load unpacked from `chrome-extension/` at chrome://extensions (no dev server needed).
# Re-run `node build.js` inside `chrome-extension/` whenever editing `shared/`.
```

---

## 🧪 Targeted Testing (Save Tokens: Don't Run Whole Test Suites Blindly)

When testing a specific change, run ONLY the target test file to avoid massive output tokens:

```bash
# Workspace root (all packages)
npm test                            # Runs test suites across all workspaces

# Chrome Extension (Fast & Targeted)
cd chrome-extension
node --test "tests/actions.test.js"        # Action handlers (TabAction, AnalyzeAction, etc.)
node --test "tests/tab-state.test.js"      # TabStateManager & tab isolation
node --test "tests/ui-components.test.js"  # Modular UI components
node --test "tests/ai.test.js"             # Extension AI core & scopes
node --test "tests/*.test.js"              # All chrome-extension tests

# Obsidian Plugin (Fast & Targeted)
cd obsidian-plugin
node esbuild.test.mjs                      # Rebundle TS tests if test files changed
node --test "tests-dist/server.test.js"        # HTTP server & endpoints
node --test "tests-dist/ai-processor.test.js"  # AI pipeline & prompts
node --test "tests-dist/workflow.test.js"      # Workflow templates & hashes
node --test "tests-dist/*.test.js"             # All obsidian-plugin tests
```

---

## 🏗️ Architecture & Data Pipeline

NutEgg operates in two flexible modes:
1. **📱 Chrome Standalone Mode**: Extension calls cloud AI providers (or local Ollama/OpenAI endpoint) directly using keys in `chrome.storage.local`. Runs Stage 1 content analysis without Obsidian.
2. **💎 Obsidian Connected Mode**: Extension pairs with local Obsidian server on `127.0.0.1:27123`. Runs Stage 1 & Stage 2, matching against existing vault knowledge trees.

### Two-Stage Pipeline

```
Captured Content
       │
       ▼
[ Stage 1: Content Analysis & Summary Routing ]
       ├── >30k chars? -> Chunks + aggregate-content.md
       ├── Produces: Title Verdict, Core Summary, Mind Map, Chapter Map, Custom Q&A
       └── egg-routing.md matches relevant eggs using the Stage 1 summary
       │
       ├── Fast Mode: Auto-proceeds immediately to Stage 2 with matched eggs
       └── Confirm Mode: User reviews/selects eggs in side panel before proceeding
       │
       ▼
[ Stage 2: Knowledge Extraction & Comparison ]
       ├── Compares content against selected egg files
       ├── Highlights novel insights vs existing knowledge in egg tree
       └── Hatch Egg (updates egg + archives nut) or Collect Nut (archives raw nut)
```

### Local HTTP Server Endpoints (`127.0.0.1:27123`)

| Method & Path | Purpose |
|:---|:---|
| `GET /health` | Port discovery & heartbeat check |
| `GET /config-status` | Readiness check: AI API keys configured, index file present |
| `GET /credit` | Balance / credit status for AI providers |
| `POST /analyze` | Stage 1 (summary & routing) or Stage 2 (egg comparison). If history exists and no force/questions, returns cached history |
| `POST /confirm` | Archives nut to `nutegg/_raw/` + appends entries to `# Unprocessed` (auto-merges at 20+ entries) |
| `POST /ask` | Standalone follow-up Q&A (`questions`, `priorQa`, `scope: "within" \| "beyond"`) |
| `GET /eggs` | Lists all eggs from `_index.md` for the manual egg picker |
| `POST /create-egg` | Creates `nutegg/<name>.md` from template and appends to `_index.md` |
| `GET /history?url=` | Versioned capture history for a URL, newest first |
| `GET /search?q=` | BM25 keyword search over saved nuts in SQLite |

---

## 📂 Vault Structure (`nutegg/`)

- `nutegg/_raw/` — Captured nuts: `YYYY-MM-DD-HH-MM-<sourceType>-<author>-<title>.md`
- `nutegg/_index.md` — Routing guide: `* path/to/egg.md: description` (one per line)
- `nutegg/_workflow/` — User-customizable prompt templates (auto-seeded & managed by `WorkflowManager`)
- `nutegg/<egg>.md` — Structured egg note: YAML frontmatter + Instructions callout + `# Knowledge` tree + `# Unprocessed` queue
- `nutegg/.nutegg.db` — SQLite database: `nuts` table (history, dedup, replay, RAG corpus)

