# 🌰/🥚 NutEgg Chrome Extension

> **Read less, hatch more, save time.**  
> Understand web pages, tweets, and YouTube videos with summaries, mind maps, and answers in Chrome.

NutEgg works directly in Chrome. Open Settings, choose your AI provider, paste your API key, and click **Save & continue**. Return to a page and click **Analyze** in the NutEgg side panel. The model and reading preferences are ready to use; you can customize them in the expandable settings sections.

For optional knowledge curation, connect the [NutEgg Obsidian Plugin](https://github.com/staff-000/nutegg-obsidian-release):

- **Chrome Extension** — Grabs content from any webpage, tweet, or YouTube video (with transcripts). We call these raw captures **nuts** 🌰. 
- **Obsidian Plugin** — Analyzes content with AI, answers your egg-specific questions and recommends what to read, and curates your knowledge base. We call these organized knowledge trees **eggs** 🥚.

> 💬 Feedback and ideas are always welcome via [GitHub Issues](https://github.com/staff-000/nutegg/issues) or email at [staffhacker.000@gmail.com](mailto:staffhacker.000@gmail.com).

---

## ✨ Features

- **Smart Content Extraction**:
  - **YouTube**: Full timestamped transcripts (including auto-generated captions) and clickable mind maps with clickable timestamps.
  - **Twitter / X**: Full threads, authors, media badges, and engagement metrics.
  - **Articles & Blogs**: Medium, Substack, and generic web articles with ads and sidebars stripped.
  - **Bilibili**: Video pages and watch-later lists, current multipart selection, chapters, and timestamped subtitles (manual before AI).
  - **Douyin**: Video descriptions and available subtitles (manual before AI), plus image-post descriptions. Videos require an accessible transcript for analysis.
  - **Weibo**: Current post text, accessible full long posts, author, and repost context.
  - **Zhihu**: Questions with loaded answers, single-answer permalinks, and articles.

- **"Should You Read It?" Verdict**:
  - Delivers a 3-sentence executive summary.
  - Gives a concrete recommendation on whether the content is worth your time based on your existing knowledge.
  
- **Title Verdict (Anti-Clickbait)**:
  - Directly answers the headline's question or hook in one sentence to save you time.
- **🔍 Dual-Scope Q&A (Within vs. Beyond Content)**:
  - **Within Content**: Strict grounding to the text/video with exact citation references and clickable YouTube timestamps.
  - **Beyond Content**: Allows unconstrained reasoning for fact-checking, content justification, or broader background context.
- **Novelty Highlighting**:
  - Compares extracted entries against your existing Obsidian knowledge trees ("Eggs").
  - Highlights **✨ New Insights** in one view and identifies **✅ Already in Tree** items so you don't waste time re-learning known concepts.
- **⚡ Dual Modes**:
  - **Chrome Mode (default)**: Add your API key in Settings to summarize, mind-map, and ask questions directly in Chrome.
  - **Obsidian Mode (optional)**: Enable it in Settings to use Obsidian's AI configuration and save knowledge to your local vault.
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

### Option 1: Chrome Web Store (Recommended)
Install directly with 1 click from the [Chrome Web Store](https://chromewebstore.google.com/detail/nutegg/bmdmdiicembobejibggoeiahaonphcol).

### Option 2: From GitHub Release (.zip)
1. Download the latest `nutegg-chrome-extension-v*.zip` from the [Releases](https://github.com/staff-000/nutegg-chrome-extension-release/releases) page.
2. Unzip the file into a folder on your computer.
3. Open Google Chrome and navigate to `chrome://extensions`.
4. Enable **Developer mode** (toggle in the top-right corner).
5. Click **Load unpacked** in the top-left corner.
6. Select the unzipped folder containing `manifest.json`.
7. Pin NutEgg to your Chrome toolbar for quick access!

---

## 🚀 Pairing with Obsidian

Obsidian is optional. To connect your vault:

1. **Install the Obsidian Plugin**: Get [NutEgg from Obsidian Community Plugins](https://community.obsidian.md/plugins/nutegg).
2. **Keep Obsidian Running**: Ensure Obsidian is open with the NutEgg plugin enabled. The plugin automatically runs a local sync server on port `27123`.
3. **Enable Obsidian Mode**: In NutEgg Settings, expand **Connect Obsidian** and enable **Use Obsidian mode**. Configure your AI key in Obsidian → Settings → NutEgg.
4. **Check Connection**: Keep the default port `27123` unless you changed it in Obsidian, then click **Test Connection**.

Use **Use Chrome instead** to return to browser analysis. Chrome mode does not contact Obsidian, even if it is running. Obsidian mode requires the plugin to remain running and does not silently switch to another AI configuration when it disconnects. Existing Obsidian users upgrading to this version should enable **Use Obsidian mode** once.

---

## 🔗 Related Repositories

Popup developers: see [tab state, async operations and diagnostics](src/popup/README.md)
for ownership rules, race-condition tests and the concurrent-tab verification steps.

- **Main Repository (Monorepo)**: [staff-000/nutegg](https://github.com/staff-000/nutegg)
- **Obsidian Plugin Release**: [staff-000/nutegg-obsidian-release](https://github.com/staff-000/nutegg-obsidian-release)

## 📄 License

GNU General Public License v3.0
