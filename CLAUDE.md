# CLAUDE.md

## Build

```bash
./deploy.sh                         # build plugin + copy to vault
cd obsidian-plugin && npm run build # tsc + esbuild
npm run dev                         # watch mode
```
Chrome extension: no build — load unpacked from `chrome-extension/` at `chrome://extensions`.

## Architecture

Two-part system: **Obsidian plugin** ↔ local HTTP (`127.0.0.1:27123`) ↔ **Chrome extension**.

### Composition

`NutEggPlugin` ([main.ts](obsidian-plugin/src/main.ts)) is the service locator. Every subsystem accesses others via `this.plugin.<subsystem>`. Subsystems: `aiClient`, `server`, `aiProcessor`, `knowledgeBase`, `indexReader`, `topicParser`.

### Data flow

```
popup → content-script (extract) → POST /analyze (AI) → popup (show results) → POST /confirm (save)
                                    ↑ reads _index.md + topic files
```

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Server online check |
| `GET /config-status` | Returns `{status, issues[]}` — missing API key, missing index |
| `POST /analyze` | AI analysis, returns `{summary, shouldRead, shouldReadReason, matchedTopics, newKnowledge[]}` — does NOT save |
| `POST /confirm` | Saves to `nutegg/_raw/YYYY-MM-DD-HH-MM-source-title.md` + appends to topic files |

### Vault structure (all under `nutegg/`)

- `nutegg/_raw/*` — raw captures
- `nutegg/_index.md` — topic routing: `path/to/topic.md: description` (one per line, `#` for comments)
- `nutegg/<topic>.md` — format: `instruct:` section, `---`, then `# knowledge` / `# ideas` sections

### Source files

| File | Role |
|------|------|
| [server.ts](obsidian-plugin/src/server.ts) | Node HTTP server with CORS |
| [ai-client.ts](obsidian-plugin/src/ai-client.ts) | Multi-provider AI client (`PROVIDER_CATALOG`: 7 providers × 2 sources). Two formats: Anthropic-native + OpenAI-compatible. Structured `AIError` with typed error codes. |
| [ai-processor.ts](obsidian-plugin/src/ai-processor.ts) | Analysis prompt → Claude → parses JSON `{summary, shouldRead, newKnowledge}` with fallback |
| [index-reader.ts](obsidian-plugin/src/index-reader.ts) | Parses `_index.md`, matches content to topics (Claude call for multi-topic case) |
| [topic-parser.ts](obsidian-plugin/src/topic-parser.ts) | Parses topic files (`instruct:` + sections), appends knowledge bullets under headings |
| [knowledge-base.ts](obsidian-plugin/src/knowledge-base.ts) | `saveRaw()` + `appendKnowledge()` |
| [settings.ts](obsidian-plugin/src/settings.ts) | Settings tab with developer mode toggle hiding AI/server config |
| [content-script.js](chrome-extension/src/content/content-script.js) | Extractor registry: `detect()` → `extract()`. youtube (captions via timedtext API), twitter (threads), article (Medium-specific), generic. Async-aware. |
