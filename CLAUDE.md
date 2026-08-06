# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development

```bash
# Deploy everything to Obsidian vault in one command
./deploy.sh                        # auto-detects vault
./deploy.sh --vault "/path/to/vault"

# Obsidian plugin (TypeScript + esbuild)
cd obsidian-plugin
npm install
npm run build          # tsc typecheck + esbuild production bundle
npm run dev            # esbuild watch mode (no typecheck)

# Chrome extension — no build step; plain JS loaded unpacked directly
# Open chrome://extensions → "Load unpacked" → select chrome-extension/
```

## Architecture

This is a two-part system: an Obsidian plugin and a Chrome extension that communicate over a local HTTP server on `127.0.0.1:27123`.

### Composition root

`NutEggPlugin` in `obsidian-plugin/src/main.ts` acts as composition root and service locator. Each subsystem receives the plugin instance and accesses others through `this.plugin.<subsystem>`. Subsystems: `aiClient`, `server`, `aiProcessor`, `knowledgeBase`, `indexReader`, `topicParser`.

### Capture → Analyze → Confirm flow (cross-codebase)

1. **Chrome content script** (`chrome-extension/src/content/content-script.js`) — Detects page type and extracts content. Single-file with all extractors inline (no bundler needed).
2. **Chrome popup** — Two-state UI: (1) shows page info + "Analyze" button, (2) shows 3-line summary + should-read verdict + new knowledge preview with "Add to Knowledge Base" confirm button.
3. **POST /analyze** — Server reads `_index.md` to find topic file mappings, uses Claude to match content to topics, reads matched topic files (parsing their `instruct:` sections), then makes one Claude call with content + index + topic context. Returns structured JSON: `{summary, shouldRead, shouldReadReason, matchedTopics, newKnowledge[]}`. Nothing is saved yet.
4. **POST /confirm** — User confirmed. Saves raw content to `_raw/` folder, appends new knowledge entries to the relevant topic files under the specified sections.
5. **GET /health** — Returns `{status: "ok"}` — popup uses this for the online/offline indicator.

### Vault knowledge structure

```
vault/
├── _raw/                    # Saved raw content (after user confirms)
├── _index.md                # Topic mapping: `file.md: description of topics`
├── invest.md                # Topic file with instruct: header, # knowledge, # ideas
└── ai.md
```

**`_index.md` format** — One entry per line: `topic-file.md: description of topics covered`. Lines starting with `#` are comments.

**Topic file format**:
```
instruct:
  * key questions: what new insights does this add?
  * reject criteria: ignore content that repeats existing knowledge
---
# knowledge
(existing knowledge entries)
# ideas
(existing idea entries)
```

### Key subsystems

- **`IndexReader`** (`obsidian-plugin/src/index-reader.ts`) — Parses `_index.md`, matches content to topic files (uses a lightweight Claude call when there are multiple topics to choose from).
- **`TopicParser`** (`obsidian-plugin/src/topic-parser.ts`) — Parses topic files: extracts `instruct:` section, parses `# sections` below the `---` separator. Handles appending new knowledge bullets under the correct section heading.
- **`AIProcessor`** (`obsidian-plugin/src/ai-processor.ts`) — Single unified Claude call. Prompt includes index + topic contexts + instructions, asks for JSON output with summary/shouldRead/newKnowledge. Parses Claude's JSON response with fallback handling for malformed output.
- **`KnowledgeBase`** (`obsidian-plugin/src/knowledge-base.ts`) — `saveRaw()` writes markdown to `_raw/` folder. `appendKnowledge()` delegates to `TopicParser.appendToTopic()`.
- **`Server`** (`obsidian-plugin/src/server.ts`) — Plain Node HTTP server with CORS. Three endpoints: `/health`, `/analyze`, `/confirm`.

### Chrome extension content script

Single-file (`chrome-extension/src/content/content-script.js`) with all extractors inline. Detects page type (twitter/youtube/article/webpage), uses platform-specific DOM selectors. Listens for `{action: "extract-content"}` messages, returns `{success, content}` where content shape is `{url, title, content, sourceType, metadata?}`.

### AI Provider System (`obsidian-plugin/src/ai-client.ts`)

`AIClient` is a unified client supporting 7 model families × 2 API sources:

- **Providers**: Anthropic, DeepSeek, Google Gemini, OpenAI, Kimi (Moonshot), Zhipu (GLM), Qwen (Tongyi) — each with a curated model list in `PROVIDER_CATALOG`
- **API sources**: `"official"` (provider's own endpoint) or `"openrouter"` (proxied through openrouter.ai)
- **Two wire formats**: Anthropic-native (for Anthropic official) and OpenAI-compatible (everything else, including Gemini's OpenAI-compatible endpoint)
- OpenRouter prefixes model names with the provider (e.g., `anthropic/claude-sonnet-5`)
- Settings auto-migrate old format keys (`anthropicApiKey` → `aiApiKey`, old `aiProvider="openrouter"` → `aiSource="openrouter"`)
