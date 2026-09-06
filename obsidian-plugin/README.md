# 🌰/🥚 NutEgg for Obsidian

> **Read less, hatch more, save time.**  
> Capture web content, evaluate novelty with AI, and grow structured knowledge trees inside your Obsidian vault.

**NutEgg** is a two-part system designed to turn mindless browsing into an active, structured knowledge base:

- **Chrome Extension** — Grabs content from any webpage, tweet, or YouTube video (with transcripts). We call these raw captures **nuts** 🌰. 
- **Obsidian Plugin** — Analyzes content with AI, evaluates novelty against your existing notes, and curates your knowledge base. We call these organized knowledge trees **eggs** 🥚.

> 💬 Feedback and ideas are always welcome via [GitHub Issues](https://github.com/staff-000/nutegg/issues) or email at [staffhacker.000@gmail.com](mailto:staffhacker.000@gmail.com).

---

## ✨ Features

- **Smart Content Extraction**:
  - **YouTube**: Full timestamped transcripts (including auto-generated captions) and clickable chapter maps.
  - **Twitter / X**: Full threads, authors, media badges, and engagement metrics.
  - **Articles & Blogs**: Medium, Substack, and generic web articles with ads and sidebars stripped.
- **"Should You Read It?" Verdict**:
  - Delivers a 3-sentence executive summary.
  - Gives a concrete recommendation on whether the content is worth your time based on your existing knowledge.
- **Title Verdict (Anti-Clickbait)**:
  - Directly answers the headline's question or hook in one sentence to save you time.
- **Novelty Highlighting**:
  - Compares extracted entries against your existing Obsidian knowledge trees ("Eggs").
  - Highlights **✨ New Insights** in one view and identifies **✅ Already in Tree** items so you don't waste time re-learning known concepts.
- **Quick Capture Actions**:
  - **🥚 Hatch Egg**: Extracts fresh insights and attaches them hierarchically into your structured knowledge trees in Obsidian.
  - **🌰 Collect Nut**: Saves a clean, raw markdown copy of the web page or video transcript into your vault archive (`nutegg/_raw/`).
- **Knowledge Tree Curation**:
  - Keeps knowledge organized by structuring new insights under matching concepts, filtering out duplicates, and maintaining clean topic trees.

---

## What You Should Not Expect

1. **No magic**: You won't get smarter just by clicking a button. Truly mastering knowledge still requires active reading, critical thinking, and practice.
2. **Built for fluff and clickbait, not structured textbooks**: NutEgg is designed to save you time on bloated clickbait videos, repetitive blog posts, and AI-generated articles puffed up from a few simple ideas. It is not intended for deeply structured long-form material like textbooks or online courses—doing so will give you fragmented knowledge snippets rather than an organized learning system.
3. **Not tailored for entertainment**: NutEgg is built for information density and insight extraction, not for summarizing comedy, movies, or entertainment videos (though you may make custom prompts that might work).
4. **Work in progress**: Support for podcasts, PDF files, and additional formats is actively in development.

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
1. Install the [BRAT](https://github.com/tfthacker/obsidian42-brat) plugin in Obsidian.
2. Open **Settings → BRAT → Add Beta plugin**.
3. Enter repository: `staff-000/nutegg-obsidian-release`.
4. Enable NutEgg once installed.

---

## 🚀 Quick Start

1. **Enable the Plugin**:
   - In Obsidian, go to **Settings → Community Plugins** and toggle **NutEgg** on.
2. **Configure AI Provider**:
   - Open **Settings → NutEgg**.
   - Choose your preferred provider (Google Gemini, Anthropic Claude, OpenAI, DeepSeek, etc.) and enter your API key.
3. **Local Sync Server (Zero Setup)**:
   - NutEgg starts the local sync server automatically in the background on port `27123`.
   - No extra setup required — you can verify the connection status anytime via the Chrome extension popup indicator.
4. **Set Up Knowledge Eggs**:
   - All knowledge files live in the `nutegg/` folder in your vault.
   - Starter template files are generated automatically on first launch.
   - Customize or add files to fit your personal knowledge areas:
     - `nutegg/_index.md` — *(Required)* Routing guide that maps topics and keywords to egg files.
     - `nutegg/invest_strategy.md` — *(Sample)* Investment and portfolio knowledge tree.
     - `nutegg/psychology.md` — *(Sample)* Cognitive biases and mental models.
     - `nutegg/ai_ml.md` — *(Sample)* AI & Machine Learning knowledge tree.
5. **Install Chrome Extension**:
   - Install the companion [NutEgg Chrome Extension](https://github.com/staff-000/nutegg-chrome-extension-release).
   - Browse the web, click **Analyze**, and watch insights stream into Obsidian!

---

## 📂 Vault Structure

Everything managed by NutEgg lives cleanly within a single `nutegg/` folder:

```
vault/
└── nutegg/
    ├── _raw/                          # Captured nuts (raw web content with metadata)
    │   └── 2026-09-04-14-30-youtube-dankoe-the-art-of-strategic-thinking.md
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

GNU General Public License v3.0
