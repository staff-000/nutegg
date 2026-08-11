# 🥚 NutEgg

**Capture web content. Curate knowledge. Save time.**

NutEgg is a two-part system that helps you stop mindless browsing and start building your knowledge base:

- **Chrome Extension** — Grabs content from any webpage, tweet, or YouTube video (with captions)
- **Obsidian Plugin** — Analyzes content with AI and maintains your knowledge base

## How It Works

```
Browse Web  →  Click Analyze  →  AI Processes  →  Confirm →  Knowledge Base in Obsidian
```

1. Click the NutEgg extension on any page
2. Click **Analyze** — the AI reads your egg index and existing knowledge
3. See a 3-line summary + "Should you read it?" verdict + what new knowledge it found
4. Click **Add to Knowledge Base** to save — nuts go to `nutegg/_raw/`, insights go to your egg files

## Vault Structure

Everything lives under a `nutegg/` folder in your vault:

```
vault/
└── nutegg/
    ├── _raw/                          # Captured nuts (raw web content)
    │   └── 2026-08-10-14-30-youtube-How-AI-Works.md
    ├── _index.md                      # Egg routing guide
    ├── invest_strategy.md             # Egg: investment knowledge
    ├── psychology.md                  # Egg: psychology knowledge
    └── ai_ml.md                       # Egg: AI/ML knowledge
```

### `_index.md` format

Maps content to egg files. One entry per line:

```
nutegg/invest_strategy.md: investment strategies, market analysis, portfolio management
nutegg/psychology.md: cognitive biases, mental models, behavioral psychology
nutegg/ai_ml.md: artificial intelligence, machine learning, LLMs, AGI
```

### Egg file format

```
instruct:
  * key questions: what new insights does this add?
  * reject criteria: ignore content that repeats existing knowledge
---
# knowledge
- **2026-08-10** — Specific insight here ([source](https://...))

# ideas
- **2026-08-05** — A new idea or perspective ([source](https://...))
```

### Raw file naming

`YYYY-MM-DD-HH-MM-<sourceType>-<title>.md`

## Setup

### 1. Obsidian Plugin

```bash
cd obsidian-plugin
npm install
npm run build
```

Then copy `main.js`, `manifest.json`, and `styles.css` to your vault's `.obsidian/plugins/nutegg/` folder.

Or use the deploy script:

```bash
./deploy.sh                           # auto-detects your vault
./deploy.sh --vault "/path/to/vault"  # specify vault path
```

Configure in Obsidian Settings → NutEgg:
- Enable **Developer Mode** to see advanced settings
- Choose your **AI provider** (Anthropic, OpenAI, DeepSeek, Gemini, Kimi, Zhipu, Qwen)
- Choose **API source** (official API or OpenRouter)
- Add your **API key**

### 2. Chrome Extension

1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `chrome-extension/` folder

No build step required — all plain JavaScript.

## Supported Websites

| Site | What's Extracted |
|------|-----------------|
| **YouTube** | Title, channel, description, chapters, **captions/transcript** |
| **Twitter/X** | Tweet text, author, thread context, links, stats |
| **Medium** | Article body, author, reading time |
| **Articles/Blogs** | Content, headings structure, author, published date |
| **Generic webpages** | Main content area, metadata, description |

To add a new site extractor, edit `chrome-extension/src/content/content-script.js` and add a detect + extract pair to the `EXTRACTORS` registry.

## Privacy

All processing happens locally. Content is sent to your chosen AI provider for analysis, but your knowledge base stays in your Obsidian vault. The Chrome extension only communicates with your local Obsidian server (`127.0.0.1:27123`).

## License

MIT
