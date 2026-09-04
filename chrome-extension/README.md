# 🥚 NutEgg Chrome Extension

> **Read less, hatch more, save time.**  
> Capture web pages, tweets, and YouTube videos, analyze novelty with AI, and curate knowledge directly into Obsidian.

The NutEgg Chrome Extension works with your local [NutEgg Obsidian Plugin](https://github.com/staff-000/nutegg-obsidian-release) to capture what you browse and turn information overload into structured, personal knowledge.

---

## ✨ Features

- **Smart Content Extraction**:
  - **YouTube**: Full timestamped transcripts (including auto-generated captions) and clickable chapter maps.
  - **Twitter / X**: Full threads, authors, media badges, and engagement metrics.
  - **Articles & Blogs**: Medium, Substack, and generic web articles with ads and sidebars stripped.
- **AI-Powered "Should You Read It?" Analysis**:
  - Delivers a 3-sentence executive summary.
  - Gives a concrete verdict: whether the content is worth your time based on your existing knowledge.
- **Novelty vs. Redundancy Detection**:
  - Compares extracted entries against your existing Obsidian knowledge trees ("Eggs").
  - Highlights **✨ New Insights** in one view and shows **✅ Already in Tree** items so you don't waste time re-learning known concepts.
- **Quick Capture Actions**:
  - **🥚 Hatch Egg**: Extracts fresh insights and attaches them into your structured knowledge trees in Obsidian.
  - **🌰 Collect Nut**: Saves a raw markdown copy of the web page or video transcript into your vault archive (`nutegg/_raw/`).
- **Interactive Side Panel & Popup**:
  - Works seamlessly in both Chrome Side Panel mode and standard popup mode.

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

1. Ensure your [NutEgg Obsidian Plugin](https://github.com/staff-000/nutegg-obsidian-release) is installed and enabled in your Obsidian vault.
2. Click the ⚙️ settings button in the NutEgg extension popup.
3. Verify that the Obsidian server port matches (default: `27123`).
4. Click **Test Connection** — when the status indicator turns green, you're ready to capture!

---

## 🔗 Related Repositories

- **Main Repository (Monorepo)**: [staff-000/nutegg](https://github.com/staff-000/nutegg)
- **Obsidian Plugin Release**: [staff-000/nutegg-obsidian-release](https://github.com/staff-000/nutegg-obsidian-release)

## 📄 License

MIT © [staff-000](https://github.com/staff-000)
