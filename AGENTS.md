# AGENTS.md

> AI coding agent reference for NutEgg. See [CLAUDE.md](CLAUDE.md) for the complete token-saving guide.

## Quick File Map (Do Not Read Large Files Blindly)

- **AI Engine & Prompts**: `shared/src/ai-processor.ts`, `shared/workflow/*.md`
- **AI Providers & Models**: `shared/src/catalog.ts`, `shared/src/client.ts`
- **Types**: `shared/src/types.ts`
- **Chrome Extension UI**: `chrome-extension/src/popup/ui/` (`banners.js`, `capture-view.js`, `qa.js`, `eggs.js`, `actions.js`, `verdict.js`)
- **Chrome Extension Actions**: `chrome-extension/src/popup/action/` (`analyze.js`, `tab.js`, `save.js`, `history.js`, `interaction.js`)
- **Chrome Extension State**: `chrome-extension/src/popup/state/` (`session-state.js`, `tab-state.js`, `settings-state.js`)
- **Chrome Extension Extractors**: `chrome-extension/src/content/extractors/` (`youtube.js`, `twitter.js`, `article.js`, `generic.js`)
- **Obsidian Local Server**: `obsidian-plugin/src/server.ts`
- **Obsidian SQLite & Search**: `obsidian-plugin/src/db.ts`
- **Obsidian Knowledge & Workflows**: `obsidian-plugin/src/knowledge-base.ts`, `workflow-manager.ts`

## Critical Invariants

1. **Rebuild Shared Core**: After editing `shared/`, run `node build.js` in `chrome-extension/` (or `npm run build`).
2. **Tab State Isolation**: All popup tab state, errors, and warnings must be managed through `tabStateManager`.
3. **Optional Chaining on Session**: Use `session.isStage1?.()` and `session.captureHistory?.length`.
4. **QuestionScope**: `"within"` (strict grounding) vs `"beyond"` (grounding stripped for open reasoning/fact-checking).
5. **i18n**: Use `t(key, params)` from `src/i18n.js` / `src/helpers.js`. Never translate "NutEgg".
6. **Targeted Tests**: Run only the specific test file with `node --test tests/<file>.test.js`.
