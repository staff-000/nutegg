# 🌰/🥚 NutEgg Chrome Extension

> **Read less, hatch more, save time.**  
> Capture web pages, tweets, and YouTube videos, analyze novelty with AI, and curate knowledge directly into Obsidian.

The NutEgg Chrome Extension works alongside your local [NutEgg Obsidian Plugin](https://github.com/staff-000/nutegg-obsidian-release) to capture what you browse and turn information overload into structured, personal knowledge.

It is a two-part system that helps you stop mindless browsing and start building your knowledge base:

- **Chrome Extension** — Grabs content from any webpage, tweet, or YouTube video (with transcripts). We call these raw captures **nuts** 🌰. 
- **Obsidian Plugin** — Analyzes content with AI, evaluates novelty against your existing notes, and curates your knowledge base. We call these organized knowledge trees **eggs** 🥚.

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

## 📦 Installation

### From GitHub Release (.zip)
1. Download the latest `nutegg-chrome-extension-v*.zip` from the [Releases](https://github.com/staff-000/nutegg-chrome-extension-release/releases) page.
2. Unzip the file into a folder on your computer.
3. Open Google Chrome and navigate to `chrome://extensions`.
4. Enable **Developer mode** (toggle in the top-right corner).
5. Click **Load unpacked** in the top-left corner.
6. Select the unzipped folder containing `manifest.json`.
7. Pin NutEgg to your Chrome toolbar for quick access!

---

## 🚀 Pairing with Obsidian

Connecting the extension to Obsidian is automatic:

1. **Keep Obsidian Running**: Ensure Obsidian is open with the [NutEgg Obsidian Plugin](https://github.com/staff-000/nutegg-obsidian-release) enabled. The plugin automatically runs a local sync server on port `27123`.
2. **Check Connection Status**: Open the NutEgg extension popup. When the status indicator in the header turns **green** (`Connected`), you're ready to capture!
3. **Settings & Custom Port** *(Optional)*: If the indicator is red or disconnected, click the ⚙️ (Settings) icon to ensure the Obsidian server port matches (default: `27123`) and click **Test Connection**.

---

## 🔗 Related Repositories

- **Main Repository (Monorepo)**: [staff-000/nutegg](https://github.com/staff-000/nutegg)
- **Obsidian Plugin Release**: [staff-000/nutegg-obsidian-release](https://github.com/staff-000/nutegg-obsidian-release)

## 📄 License

GNU General Public License v3.0
