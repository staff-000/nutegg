# 🥚 NutEgg for Obsidian

> **Read less, hatch more, save time.**  
> Capture web content, evaluate novelty with AI, and grow structured knowledge trees inside your Obsidian vault.

NutEgg for Obsidian is the local brain of the NutEgg system. It runs a lightweight, local-first HTTP server that communicates with the **NutEgg Chrome Extension** to route web captures, analyze content against your existing notes, and integrate fresh insights into your knowledge base.

---

## ✨ Features

- **Local-First Communication**: Built-in lightweight HTTP server (`http://127.0.0.1:27123`) communicates directly with the NutEgg Chrome Extension. Your notes never pass through third-party servers.
- **AI-Assisted Knowledge Routing**: Uses an egg routing index (`_index.md`) to analyze whether incoming articles, tweets, or YouTube videos contribute to your existing knowledge areas ("Eggs").
- **Knowledge Tree Curation**: Extracts novel insights and attaches them hierarchically under your existing concept trees, filtering out duplicate or already-known information.
- **Raw Capture Archive ("Nuts")**: Saves verbatim copies of web pages, threads, and timestamped transcripts to `nutegg/_raw/` with full metadata and provenance.
- **Auto-Merge Assistant**: Gathers new insights in an `# Unprocessed` inbox and merges them into your structured knowledge trees when ready.
- **Built-in Search & Cache**: Backed by `node:sqlite` with BM25 keyword search over saved nuts and deduplication of previously analyzed URLs.

---

## 📦 Installation

### Option 1: Manual Installation (Recommended)
1. Download the latest release files (`main.js`, `manifest.json`, `styles.css`) from the [Releases](https://github.com/staff-000/nutegg-obsidian-release/releases) page.
2. In your Obsidian vault, navigate to `.obsidian/plugins/` (create the directory if it doesn't exist).
3. Create a folder named `nutegg` and copy `main.js`, `manifest.json`, and `styles.css` into it:
   ```
   your-vault/.obsidian/plugins/nutegg/
   ├── main.js
   ├── manifest.json
   └── styles.css
   ```
4. In Obsidian, go to **Settings → Community Plugins**, reload installed plugins, and toggle **NutEgg** on.

### Option 2: Using BRAT
1. Install the [BRAT](https://github.com/TfTHacker/obsidian-42-brat) plugin in Obsidian.
2. Open **Settings → BRAT → Add Beta plugin**.
3. Enter repository: `staff-000/nutegg-obsidian-release`.
4. Enable NutEgg once installed.

---

## 🚀 Quick Start

1. **Configure AI Provider**:
   - Open **Settings → NutEgg**.
   - Choose your provider (Anthropic Claude, OpenAI, or Google Gemini) and enter your API key.
2. **Start the Local Server**:
   - NutEgg starts the local sync server automatically on port `27123`.
   - Verify connection in settings or check the status indicator.
3. **Set Up Knowledge Eggs**:
   - All knowledge files live in the `nutegg/` folder of your vault.
   - Example files:
     - `nutegg/_index.md` — Routing guide mapping topics to egg files.
     - `nutegg/invest_strategy.md` — Investment knowledge tree.
     - `nutegg/psychology.md` — Cognitive biases and mental models.
     - `nutegg/ai_ml.md` — AI & Machine Learning knowledge.
4. **Install Chrome Extension**:
   - Install the companion [NutEgg Chrome Extension](https://github.com/staff-000/nutegg-chrome-extension-release).
   - Browse the web, click **Analyze**, and watch insights stream into Obsidian!

---

## 📂 Vault Structure

Everything managed by NutEgg lives cleanly within a single `nutegg/` folder:

```
vault/
└── nutegg/
    ├── _raw/                          # Captured nuts (raw web content with metadata)
    │   └── 2026-09-04-14-30-youtube-LowLevelLemmy-How-I-Watched-Every-Video.md
    ├── _index.md                      # Egg routing guide
    ├── ai_ml.md                       # Knowledge egg
    ├── psychology.md                  # Knowledge egg
    └── productivity.md                # Knowledge egg
```

---

## 🔗 Related Repositories

- **Main Repository (Monorepo)**: [staff-000/nutegg](https://github.com/staff-000/nutegg)
- **Chrome Extension Release**: [staff-000/nutegg-chrome-extension-release](https://github.com/staff-000/nutegg-chrome-extension-release)

## 📄 License

MIT © [staff-000](https://github.com/staff-000)
