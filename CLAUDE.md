# CLAUDE.md

## Rules

- **Existence checks** — Use `await this.app.vault.adapter.exists(path)`, not `getAbstractFileByPath()`.
- **Terminology** — "nut" = raw content, "egg" = processed knowledge file. Don't use "topic" or "raw content".

## Build

```bash
./deploy.sh                         # build plugin + copy to vault
cd obsidian-plugin && npm run build # tsc + esbuild
npm run dev                         # watch mode
```
Chrome extension: no build — load unpacked from `chrome-extension/` at `chrome://extensions`.

## Architecture

Two-part system: **Obsidian plugin** ↔ local HTTP (`127.0.0.1:*`) ↔ **Chrome extension**.

### Composition

`NutEggPlugin` ([main.ts](obsidian-plugin/src/main.ts)) is the service locator. Subsystems: `aiClient`, `server`, `aiProcessor`, `knowledgeBase`, `indexReader`, `eggParser`.

### Data flow

```
popup → content-script → POST /analyze (AI) → popup (results) → POST /confirm (save)
                              ↑ reads _index.md + egg files
```

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Server check + port sync |
| `GET /config-status` | `{status, issues[]}` — missing API key, missing index |
| `POST /analyze` | AI analysis, returns `{summary, shouldRead, matchedEggs, newKnowledge[]}` — deduped by URL |
| `POST /confirm` | Saves to `nutegg/_raw/YYYY-MM-DD-HH-MM-source-title.md` + appends to egg files |

### Vault structure (all under `nutegg/`)

- `nutegg/_raw/*` — captured nuts (raw web content)
- `nutegg/_index.md` — egg routing: `path/to/egg.md: description` (one per line, `#` for comments)
- `nutegg/<egg-name>.md` — egg file format: `instruct:` section, `---`, then `# knowledge` / `# ideas` sections
- `nutegg/.processed.json` — URL → timestamp dedup cache (auto-managed)

### Source files

| File | Role |
|------|------|
| [server.ts](obsidian-plugin/src/server.ts) | HTTP server, dedup cache, `/analyze` + `/confirm` |
| [ai-client.ts](obsidian-plugin/src/ai-client.ts) | `PROVIDER_CATALOG`: 7 providers × 2 sources (official/OpenRouter). Two formats. `AIError` with typed codes. |
| [ai-processor.ts](obsidian-plugin/src/ai-processor.ts) | Prompt → AI → parses JSON `{summary, shouldRead, matchedEggs, newKnowledge[]}` |
| [index-reader.ts](obsidian-plugin/src/index-reader.ts) | Parses `_index.md`, `matchEggs()` to route content to egg files |
| [egg-parser.ts](obsidian-plugin/src/egg-parser.ts) | Parses egg files (`instruct:` + sections), `appendToEgg()` |
| [knowledge-base.ts](obsidian-plugin/src/knowledge-base.ts) | `saveRaw()` + `appendKnowledge()` |
| [settings.ts](obsidian-plugin/src/settings.ts) | Settings tab, developer mode toggle |
| [content-script.js](chrome-extension/src/content/content-script.js) | Extractor registry: `detect()` → `extract()`. youtube (captions), twitter (threads), article, generic. |
| [options.html/js/css](chrome-extension/src/options/) | Standalone settings page (port config, test connection) |
