# 🥚 NutEgg

**Capture web content. Curate knowledge. Save time.**

NutEgg is a two-part system that helps you stop mindless browsing and start building your knowledge base:

- **Chrome Extension** — Grabs content from any webpage, tweet, or YouTube video
- **Obsidian Plugin** — Receives content, processes it with Claude AI, and maintains your knowledge base

## How It Works

```
Browse Web  →  Click Capture  →  Claude AI Processes  →  Knowledge Base in Obsidian
```

### Three Decision Modes

| Mode | What It Does | When to Use |
|------|-------------|-------------|
| ⚡ **Quick Drop** | One-sentence summary, discard the rest | Most content — just capture the gist |
| 📝 **Extract & Integrate** | Full extraction, highlights what's new vs. your KB | Worthwhile content with new information |
| 🧠 **Deep Digest** | Comprehensive multi-pass intellectual digestion | Truly important content (manual trigger) |

### YouTube Channel Processing

Ask NutEgg to read all videos of a YouTube channel and generate a synthesized knowledge base entry — no API key needed (uses RSS feeds).

## Setup

### 1. Obsidian Plugin

```bash
cd obsidian-plugin
npm install
npm run build    # Production build
npm run dev      # Development watch mode
```

Then copy `main.js`, `manifest.json`, and `styles.css` to your Obsidian vault's `.obsidian/plugins/nutegg/` folder.

Configure in Obsidian Settings → NutEgg:
- Add your **Anthropic API key**
- Choose your preferred **Claude model**
- Set your **default decision mode**

### 2. Chrome Extension

1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `chrome-extension/` folder

No build step required — all plain JavaScript.

### 3. Verify Connection

1. Start Obsidian with the NutEgg plugin loaded
2. You should see a notice: "NutEgg server started on port 27123"
3. Open the Chrome extension popup — the status dot should be 🟢 green

## Vault Structure

After setup, NutEgg creates this structure in your vault:

```
vault/
├── inbox/                    # Captured content awaiting processing
│   └── 2026-07-28-article-title.md
├── knowledge-base/           # Your curated knowledge
│   ├── topics/               # Knowledge organized by topic
│   │   └── machine-learning.md
│   └── sources/              # YouTube channel syntheses
│       └── veritasium.md
└── quick-drops.md            # Running log of one-sentence summaries
```

## Commands

Available in the Obsidian command palette:

| Command | Description |
|---------|-------------|
| **Process all inbox items** | Process everything in the inbox folder |
| **Quick capture from clipboard** | Capture clipboard content |
| **Open decision modal** | Choose how to process inbox items |
| **Process YouTube channel** | Enter a channel URL to generate KB |
| **Browse knowledge base** | Open the KB browser |
| **View quick drops log** | Read your one-sentence summaries |

## Keyboard Shortcut

In Chrome: `⌘/Ctrl + Shift + S` to quick-capture the current page.

(Customizable in `chrome://extensions/shortcuts`)

## Tech Stack

- **Obsidian Plugin**: TypeScript, esbuild, Obsidian API, Anthropic Claude API
- **Chrome Extension**: Plain JavaScript, Manifest V3
- **AI**: Claude (Sonnet 5 by default, configurable to Opus 5 or Haiku 4.5)

## Privacy

All processing happens locally. Content is sent to the Anthropic API for AI processing, but your knowledge base stays in your Obsidian vault. The Chrome extension only communicates with your local Obsidian server (`127.0.0.1:27123`).

## License

MIT
