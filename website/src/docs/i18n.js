// Documentation translations. Preserve HTML, code examples, paths, and product names.
// Initial non-English copy came from Google Translate, with local terminology/heading corrections
// and automated markup, code, link, brand, and placeholder checks.
const docsTranslations = {
  en: {
    docs_chromeExtension_001: 'Chrome Extension Guide — NutEgg',
    docs_chromeExtension_002: 'Chrome Web Store ↗',
    docs_chromeExtension_003: 'Obsidian Plugin ↗',
    docs_chromeExtension_004: '🎬 Promo Video ↗',
    docs_chromeExtension_005: 'Extension Releases',
    docs_chromeExtension_006: 'Privacy Policy',
    docs_chromeExtension_007: 'Chrome Extension Setup & Usage',
    docs_chromeExtension_008:
      "\n          The NutEgg Chrome extension lives in your browser's side panel, providing on-demand content extraction,\n          YouTube mind maps with clickable timestamps, and one-click capture to Obsidian.\n        ",
    docs_chromeExtension_009: 'Installation',
    docs_chromeExtension_010: 'Option 1: Chrome Web Store (Recommended)',
    docs_chromeExtension_011:
      '\n          Install NutEgg with one click directly from the official\n          <a\n            href="https://chromewebstore.google.com/detail/nutegg/bmdmdiicembobejibggoeiahaonphcol"\n            target="_blank"\n            rel="noopener"\n            >Chrome Web Store</a\n          >:\n        ',
    docs_chromeExtension_012:
      '\n            Visit the\n            <a\n              href="https://chromewebstore.google.com/detail/nutegg/bmdmdiicembobejibggoeiahaonphcol"\n              target="_blank"\n              rel="noopener"\n              >NutEgg Chrome Web Store page</a\n            >.\n          ',
    docs_chromeExtension_013: 'Click <strong>Add to Chrome</strong>.',
    docs_chromeExtension_014:
      "\n            Click the puzzle piece icon in Chrome's toolbar and pin <strong>NutEgg</strong> for convenient side panel\n            access.\n          ",
    docs_chromeExtension_015: 'Option 2: From GitHub Release (.zip)',
    docs_chromeExtension_016:
      '\n            Download the latest <code>nutegg-chrome-extension-*.zip</code> from the\n            <a\n              href="https://github.com/staff-000/nutegg-chrome-extension-release/releases"\n              target="_blank"\n              rel="noopener"\n              >Releases page</a\n            >.\n          ',
    docs_chromeExtension_017: 'Unzip the archive to a local folder on your computer.',
    docs_chromeExtension_018: 'Open Google Chrome and go to <code>chrome://extensions</code>.',
    docs_chromeExtension_019: 'Toggle <strong>Developer mode</strong> on in the upper-right corner.',
    docs_chromeExtension_020:
      '\n            Click <strong>Load unpacked</strong> and select the unzipped directory containing\n            <code>manifest.json</code>.\n          ',
    docs_chromeExtension_021:
      'Click the puzzle icon in the Chrome toolbar and pin <strong>NutEgg</strong> for easy access.',
    docs_chromeExtension_022: 'Side Panel Workflow',
    docs_chromeExtension_023: "Clicking the NutEgg extension icon opens Chrome's side panel:",
    docs_chromeExtension_024:
      '\n            <strong>Auto-Extraction</strong>: As you browse, NutEgg detects the active tab (YouTube video, Twitter/X\n            thread, or blog post) and extracts its text and structure.\n          ',
    docs_chromeExtension_025:
      '\n            <strong>Content Refresh (🔄)</strong>: Click the refresh button in content preview to re-extract the page on\n            dynamic single-page apps without unexpectedly redirecting away from the preview.\n          ',
    docs_chromeExtension_026:
      '\n            <strong>Target Egg Selector</strong>: In content preview, choose target knowledge eggs or use "Target eggs\n            (auto-select by default)" to let AI match relevant vault trees automatically.\n          ',
    docs_chromeExtension_027:
      '\n            <strong>Analysis Modes</strong>:\n            <ul>\n              <li>\n                <strong>Full Mode</strong>: Evaluates content and immediately runs knowledge matching against matching\n                eggs in a single streamlined workflow.\n              </li>\n              <li>\n                <strong>Preview Mode</strong>: Generates the Stage 1 overview first (summary, mind map, Q&amp;A,\n                discussion), letting you inspect or adjust target eggs before running egg knowledge analysis on demand.\n              </li>\n            </ul>\n          ',
    docs_chromeExtension_028:
      '\n            <strong>Status Indicator</strong>: A green dot indicates a healthy connection to your local Obsidian server\n            (<code>127.0.0.1:27123</code>). If red, ensure Obsidian is running with the NutEgg plugin enabled.\n          ',
    docs_chromeExtension_029: 'YouTube Integration & Smart Navigation',
    docs_chromeExtension_030: 'On YouTube video pages, NutEgg extracts:',
    docs_chromeExtension_031:
      '\n            <strong>Full Captions &amp; Transcripts</strong>: Automatic high-accuracy extraction from creator and\n            auto-generated transcripts.\n          ',
    docs_chromeExtension_032:
      '\n            <strong>Mind Map with Clickable Timestamps</strong>: Instant breakdown with clickable timestamp buttons that\n            seek your active YouTube video player directly to that segment. When timestamps are present, redundant\n            source tags are hidden to keep the tree clean.\n          ',
    docs_chromeExtension_033:
      '\n            <strong>Q&amp;A with Timestamp Jumping</strong>: Ask any question about the video in natural language;\n            NutEgg provides cited answers with clickable timestamp pills that jump straight to the source moment in\n            video playback.\n          ',
    docs_chromeExtension_034:
      "\n            <strong>Anti-Clickbait Verdict</strong>: An objective 1-sentence answer to the video title's premise,\n            letting you skip fluff immediately.\n          ",
    docs_chromeExtension_035: 'Text In-Page Source Navigation',
    docs_chromeExtension_036: 'When reading articles, blogs, or forums:',
    docs_chromeExtension_037:
      '\n            <strong>📍 Jump to Source</strong>: Text mind-map nodes and Q&amp;A citations include source tags. Clicking\n            a source tag automatically scrolls the live web page to the exact matching paragraph or quote and briefly\n            highlights it with an outline.\n          ',
    docs_chromeExtension_038:
      '\n            <strong>Comment Navigation</strong>: On discussion pages (Reddit, Zhihu, etc.), clicking source citations\n            scrolls directly to the specific comment or answer.\n          ',
    docs_chromeExtension_039: 'Discussion Analysis &amp; Community Perspectives',
    docs_chromeExtension_040: 'NutEgg analyzes public comments across YouTube, Reddit, Twitter/X, Zhihu, and forums:',
    docs_chromeExtension_041:
      '\n            <strong>Topic &amp; Stance Breakdown</strong>: Summarizes core debate points with stance badges (agree 👍,\n            disagree 👎, mixed 🤔, neutral ⚖️) and reaction metrics.\n          ',
    docs_chromeExtension_042:
      '\n            <strong>Extra Insights</strong>: High-value comments containing evidence, caveats, or unique experiences are\n            preserved as concise extra insights.\n          ',
    docs_chromeExtension_043: 'Chrome-Only Standalone Mode (No Obsidian Required)',
    docs_chromeExtension_044:
      "\n          Don't have Obsidian installed or currently open? NutEgg works completely standalone inside Google Chrome!\n        ",
    docs_chromeExtension_045: '⚡ Fast Web Reading Without Note Overhead',
    docs_chromeExtension_046:
      '\n            NutEgg is designed first and foremost as an ultra-fast web reading companion. You can extract, summarize, generate\n            mind maps, and ask questions about any article or YouTube video directly in Chrome without ever touching a note vault.\n          ',
    docs_chromeExtension_047: 'Features Available in Chrome Standalone:',
    docs_chromeExtension_048:
      "\n            <strong>🎯 Instant Anti-Clickbait Verdict</strong>: An objective 1-sentence answer to the headline's question.\n          ",
    docs_chromeExtension_049:
      '\n            <strong>📝 Executive 3-Sentence Summary</strong>: High-density takeaways extracted from any long article or video.\n          ',
    docs_chromeExtension_050:
      '\n            <strong>⏱️ Mind Map with Clickable Timestamps &amp; Seeking</strong>: Jump to key video segments with one click.\n          ',
    docs_chromeExtension_051:
      '\n            <strong>💬 Video Q&amp;A &amp; Timestamp Jumping</strong>: Ask questions and click cited timestamp pills to scrub video playback directly to that segment.\n          ',
    docs_chromeExtension_052:
      '\n            <strong>🧠 Collapsible Mind Maps</strong>: Multi-tier interactive thought trees breaking down core ideas visually.\n          ',
    docs_chromeExtension_053:
      '<strong>🌐 50+ Languages Support</strong>: Extract and translate foreign-language content on the fly.',
    docs_chromeExtension_054: 'How to Configure Chrome-Only Mode:',
    docs_chromeExtension_055:
      "\n            Right-click the <strong>NutEgg extension icon</strong> in Chrome's toolbar and select <strong>Options</strong>.\n          ",
    docs_chromeExtension_056:
      '\n            Select your preferred AI provider (e.g., Google Gemini, OpenAI, Claude, DeepSeek, or OpenRouter) and enter your API key.\n          ',
    docs_chromeExtension_057: "Click <strong>Save</strong>. You're ready to analyze any page!",
    docs_chromeExtension_058: 'Obsidian Connection &amp; AI Execution Modes',
    docs_chromeExtension_059:
      '\n          When you connect the Chrome extension to the optional NutEgg Obsidian plugin, Chrome seamlessly adapts depending on the selected execution mode:\n        ',
    docs_chromeExtension_060: '🔒 API Key Security: Keys Never Leave Chrome',
    docs_chromeExtension_061:
      "\n            In <strong>Connected API Mode</strong>, your API keys stay strictly inside Chrome's secure extension storage.\n            Obsidian manages knowledge templates and vault indexing, but delegates AI inference back to Chrome over an\n            authenticated local WebSocket. Chrome makes the provider API call locally and returns only the generated text.\n          ",
    docs_chromeExtension_062: 'Execution Mode',
    docs_chromeExtension_063: 'Where AI Runs',
    docs_chromeExtension_064: 'Credentials Used',
    docs_chromeExtension_065: '<strong>Chrome-Only</strong>',
    docs_chromeExtension_066: 'Directly inside Chrome',
    docs_chromeExtension_067: 'API key configured in Chrome Options',
    docs_chromeExtension_068: '<strong>Connected API Mode</strong>',
    docs_chromeExtension_069: 'Chrome (delegated via local WebSocket by Obsidian)',
    docs_chromeExtension_070: 'API key in Chrome (keys never sent to Obsidian)',
    docs_chromeExtension_071: '<strong>Shared Subscription Mode</strong>',
    docs_chromeExtension_072: 'Inside Obsidian (via local CLI or ChatGPT OAuth)',
    docs_chromeExtension_073: 'Zero API keys (uses Codex, Claude Code, Antigravity, or ChatGPT)',
    docs_chromeExtension_074: 'Multi-Profile Chrome Support',
    docs_chromeExtension_075:
      '\n          NutEgg supports multiple Chrome browser profiles (e.g. Personal and Work) connecting concurrently to the same Obsidian vault.\n          Each Chrome profile retains its own provider, model, and API key independently. Connecting or switching execution modes\n          never leaks or overwrites API keys between profiles.\n        ',
    docs_chromeExtension_076: 'Offline &amp; Disconnect Recovery',
    docs_chromeExtension_077:
      '\n          If Obsidian is closed while connected mode is enabled, NutEgg displays a clear status light and gives you a one-click\n          <strong>"Use Chrome mode instead"</strong> option. This lets you immediately continue reading and asking questions using your\n          Chrome API setup without interruption or quota risk.\n        ',
    docs_chromeExtension_078: 'Configuration &amp; Live Synchronization',
    docs_chromeExtension_079:
      'NutEgg includes real-time synchronization between the extension Options and active side panels:',
    docs_chromeExtension_080:
      '\n            <strong>Content Section Controls</strong>: Customize which sections are extracted and analyzed by default\n            (Content, Summary, Mind Map, Q&amp;A, Knowledge Entries, and Discussion) in the Options page.\n          ',
    docs_chromeExtension_081:
      '\n            <strong>Live Settings Sync</strong>: Changing your analysis models, enabled output sections, or server\n            settings immediately updates all open side panels without requiring a page refresh.\n          ',
    docs_chromeExtension_082:
      '\n            <strong>Custom Server Port</strong>: If default port <code>27123</code> conflicts with another service, open\n            extension <strong>Options</strong>, adjust the port (e.g. <code>28123</code>), and test the connection.\n          ',
    docs_index_001: 'Documentation Overview — NutEgg',
    docs_index_002: 'Chrome Web Store ↗',
    docs_index_003: 'Obsidian Plugin ↗',
    docs_index_004: '🎬 Promo Video ↗',
    docs_index_005: 'GitHub Releases',
    docs_index_006: 'Privacy Policy',
    docs_index_007: 'Issue Tracker',
    docs_index_008: 'Overview &amp; Core Concepts',
    docs_index_009:
      "\n          NutEgg is a free, open-source Chrome extension that helps you decide what's worth reading—and understand it\n          faster. It lives in Chrome's side panel and works on articles, threads, and YouTube videos. An optional\n          Obsidian plugin turns what you read into a growing knowledge vault.\n        ",
    docs_index_010: 'What You Get in Chrome',
    docs_index_011:
      '\n          Install the extension, enter your AI API key (or point it at a local model) in Options, and NutEgg works right\n          away—no account, no extra apps:\n        ',
    docs_index_012: '🎯 Instant Anti-Clickbait Title Verdict',
    docs_index_013: '📝 Executive 3-sentence summary &amp; core takeaways',
    docs_index_014: '🧠 Collapsible hierarchical Mind Maps, with clickable timestamps for YouTube',
    docs_index_015: '💬 Natural-language Q&amp;A with cited timestamp pills and in-page source links',
    docs_index_016: '🔍 Dual-scope questions: strictly within the page, or beyond it for fact-checking',
    docs_index_017: '🗣️ Comment-section digests for YouTube, Reddit, and forums',
    docs_index_018: '🌐 Multi-source extraction and translation in 50+ languages',
    docs_index_019: '💡 Why NutEgg Exists',
    docs_index_020:
      '\n            Too much of the web is padded videos, clickbait headlines, and AI-inflated articles. NutEgg answers the\n            headline upfront and tells you honestly whether the content is worth your time—so you only spend attention\n            where it pays off.\n          ',
    docs_index_021: 'Optional: Add Obsidian',
    docs_index_022:
      "\n          If you keep notes in Obsidian, install the companion plugin to connect the extension to your vault\n          (<code>127.0.0.1:27123</code>). This adds 2-stage novelty evaluation against your vault's\n          <code>_index.md</code> knowledge trees, delta synthesis, and automatic note archiving into\n          <code>nutegg/_raw/</code> and egg files. Everything in Chrome keeps working with or without it.\n        ",
    docs_index_023: 'The Metaphor',
    docs_index_024:
      'With Obsidian connected, NutEgg structures your information flow using a simple three-part metaphor:',
    docs_index_025:
      '\n            <strong>🌰 The Nut (Raw Capture)</strong>: The raw web page, tweet thread, or YouTube transcript extracted\n            from the browser. Nuts are archived untouched with full metadata into <code>nutegg/_raw/</code> in your\n            vault.\n          ',
    docs_index_026:
      '\n            <strong>🥚 The Egg (Knowledge Tree)</strong>: A living, structured markdown note in your vault representing\n            a domain of knowledge (e.g., <code>ai_architecture.md</code>, <code>invest_strategy.md</code>).\n          ',
    docs_index_027:
      '\n            <strong>🐣 The Hatch (Synthesis &amp; Delta)</strong>: When content is analyzed, the AI matches it against\n            your eggs, identifies what is novel compared to what is already documented, and weaves new insights into\n            your egg.\n          ',
    docs_index_028: 'System Architecture',
    docs_index_029: 'NutEgg has one core component and one optional companion:',
    docs_index_030:
      "\n            <strong>Chrome Extension</strong>: Lives in Chrome's side panel. Extracts text, comments, and video transcripts.\n            In standalone mode or connected API mode, it executes AI calls locally using your configured provider and API key—ensuring\n            your API keys never leave the browser.\n          ",
    docs_index_031:
      "\n            <strong>Obsidian Plugin (optional)</strong>: Runs a local sync and coordinator service on <code>127.0.0.1:27123</code>.\n            Reads your vault's <code>_index.md</code>, manages prompt templates in <code>_workflow/</code>, and archives captured\n            knowledge to disk. It supports:\n            <ul>\n              <li>\n                <strong>Connected API Mode (Default)</strong>: Coordinates knowledge matching, delegating AI inference to Chrome\n                via an authenticated local WebSocket (keys never sent to Obsidian).\n              </li>\n              <li>\n                <strong>Shared Subscription Mode</strong>: Runs inference locally via ChatGPT sign-in (OAuth) or developer CLI tools\n                (Codex, Claude Code, Antigravity) with zero API keys needed.\n              </li>\n            </ul>\n          ",
    docs_index_032:
      '<code>Chrome Extension (Side Panel)\n │\n ├── [Standalone Mode] Local AI Processing (Verdicts, Summaries, Mind Maps, Q&amp;A)\n │\n └── [Connected Mode] HTTP + WebSocket (127.0.0.1:27123/execution/socket)\n         │\n         ▼\n Obsidian Plugin (Local Server &amp; Coordinator)\n         ├── Evaluates against vault/nutegg/_index.md &amp; prompts in _workflow/\n         ├── In API Mode: Delegates AI calls back to Chrome over WebSocket (keys stay in Chrome)\n         ├── In Subscription Mode: Executes locally via CLI (Codex/Claude/agy) or ChatGPT OAuth\n         └── Writes structured notes to vault/nutegg/_raw/ and &lt;egg&gt;.md</code>',
    docs_index_033: 'Quick Start Roadmap',
    docs_index_034:
      '\n            Watch the\n            <a href="https://www.youtube.com/watch?v=_u6mDoHZSAo" target="_blank" rel="noopener"\n              >🎬 NutEgg Promo Video</a\n            >\n            for a 1-minute visual walkthrough.\n          ',
    docs_index_035:
      '\n            Install the\n            <a\n              href="https://chromewebstore.google.com/detail/nutegg/bmdmdiicembobejibggoeiahaonphcol"\n              target="_blank"\n              rel="noopener"\n              >Chrome Extension</a\n            >\n            from Chrome Web Store and add your AI key in Options (see <a href="chrome-extension.html">guide</a>).\n          ',
    docs_index_036:
      "Open the side panel on any article or YouTube video and click <strong>Analyze</strong>. That's it!",
    docs_index_037:
      '\n            <em>Optional:</em> Install the\n            <a href="https://community.obsidian.md/plugins/nutegg" target="_blank" rel="noopener">Obsidian Plugin</a>\n            (see <a href="obsidian-plugin.html">guide</a>) and define your first knowledge topics in\n            <a href="knowledge-structuring.html">_index.md</a> to start hatching.\n          ',
    docs_knowledgeStructuring_001: 'Knowledge Structuring & Eggs — NutEgg',
    docs_knowledgeStructuring_002: 'Chrome Web Store ↗',
    docs_knowledgeStructuring_003: 'Obsidian Plugin ↗',
    docs_knowledgeStructuring_004: 'Releases',
    docs_knowledgeStructuring_005: 'Privacy Policy',
    docs_knowledgeStructuring_006: 'Knowledge Structuring & Eggs',
    docs_knowledgeStructuring_007:
      '\n          Learn how NutEgg organizes your Obsidian vault, matches web content to topics using <code>_index.md</code>,\n          and merges accumulated entries into knowledge trees.\n        ',
    docs_knowledgeStructuring_008: 'The <code>nutegg/</code> Vault Layout',
    docs_knowledgeStructuring_009:
      'All NutEgg content is confined to a clean, isolated <code>nutegg/</code> folder in your Obsidian vault:',
    docs_knowledgeStructuring_010:
      '<code>vault/\n└── nutegg/\n    ├── _raw/                          # Captured nuts (raw web content + metadata)\n    │   └── 2026-09-06-14-30-youtube-author-title.md\n    ├── _index.md                      # Topic routing guide\n    ├── ai_architecture.md             # Knowledge egg\n    ├── invest_strategy.md             # Knowledge egg\n    └── productivity.md                # Knowledge egg</code>',
    docs_knowledgeStructuring_011: 'The Routing Guide: <code>_index.md</code>',
    docs_knowledgeStructuring_012:
      '\n          The <code>_index.md</code> file tells NutEgg which egg notes you maintain and what domains they cover. Each\n          line maps a relative file path to keywords and descriptions:\n        ',
    docs_knowledgeStructuring_013:
      '<code>nutegg/ai_architecture.md: LLMs, multi-agent systems, prompt engineering, RAG, embeddings\nnutegg/invest_strategy.md: value investing, index funds, asset allocation, macroeconomic indicators\nnutegg/productivity.md: deep work, time blocking, habits, personal knowledge management</code>',
    docs_knowledgeStructuring_014: '⚡ How Routing Works',
    docs_knowledgeStructuring_015:
      "\n            When you click <strong>Analyze</strong> in the browser, NutEgg's AI reads your <code>_index.md</code> and\n            determines which egg (if any) matches the content. If no existing egg matches, NutEgg offers to\n            automatically create a new egg seeded from the page's topic!\n          ",
    docs_knowledgeStructuring_016: 'Egg File Anatomy & How Instructions Work',
    docs_knowledgeStructuring_017:
      "\n          An <strong>Egg file</strong> (stored under <code>nutegg/*.md</code>) serves two crucial roles: it is both your\n          curated, evolving knowledge repository for a domain and an active prompt specification that steers NutEgg's AI\n          pipeline whenever content touches that topic.\n        ",
    docs_knowledgeStructuring_018: '1. Structural Blueprint',
    docs_knowledgeStructuring_019:
      '\n          Every egg file combines YAML metadata, an Obsidian callout block with instructions, a curated knowledge tree,\n          and an unprocessed staging buffer:\n        ',
    docs_knowledgeStructuring_020:
      '<code>---\ntopic: "AI Architecture & Multi-Agent Systems"\nstatus: "active"\nlast_updated: "2026-09-10"\n---\n\n> [!abstract]- Instructions:\n> **Scope:** Multi-agent architectures, tool calling, memory layers, and LLM evaluation.\n> **Action Guide:** Focus on actionable design patterns, scalability tradeoffs, and real failure modes.\n> **Key Questions:**\n> 1. How are agent memory loops bounded to prevent context window overflow?\n> 2. What coordination mechanism is used between subagents?\n> **Worth Reading If:**\n&gt; - Practical examples and substantive explanations.\n&gt; **Skip If:**\n> - Ignore basic beginner tutorials or high-level sales pitches without technical substance.\n> - Discard speculative claims lacking empirical benchmarks or code evidence.\n> **Formatting Rules:**\n> - Prefix each insight with a bracketed tag: `[concept]`, `[architecture]`, `[method]`, `[benchmark]`, `[explain]`, `[fact]`, `[example]`.\n> - Use the structure: `- [tag] **Concept Name**` followed by an indented explanation and concrete examples (`- 🎯 Example:`).\n\n# Knowledge\n## Agent Memory\n- [architecture] **Bounded Replay Buffers**\n    - Ephemeral short-term memory expires after session goals terminate to conserve token budget.\n    - 🎯 Example: Tool calling trace logs stored in vector stores with sliding window eviction.\n\n# Unprocessed\n(Newly hatched insights land here from captures until auto-merged)</code>',
    docs_knowledgeStructuring_021: '2. How to Write Egg Instructions',
    docs_knowledgeStructuring_022:
      '\n          The <code>&gt; [!abstract]- Instructions:</code> callout contains six specialized fields. Each one guides a\n          specific stage of the AI pipeline:\n        ',
    docs_knowledgeStructuring_023: 'Field',
    docs_knowledgeStructuring_024: 'Purpose & Best Practices',
    docs_knowledgeStructuring_025: 'Workflow Usage',
    docs_knowledgeStructuring_026: '<code>**Scope:**</code>',
    docs_knowledgeStructuring_027:
      '\n                1–2 sentences defining the topical boundaries of this egg. Explicitly state what concepts, technologies,\n                or questions are included or excluded.\n              ',
    docs_knowledgeStructuring_028:
      '\n                Injected into <code>egg-analysis.md</code> (Stage 2) so the AI extracts knowledge strictly through this\n                domain lens.\n              ',
    docs_knowledgeStructuring_029: '<code>**Action Guide:**</code>',
    docs_knowledgeStructuring_030:
      '\n                1–5 step instructions for how the AI summarizes and evaluates content (e.g. asking for specific\n                perspectives, depth, or tradeoffs). Falls back to default guide if omitted.\n              ',
    docs_knowledgeStructuring_031: 'Injected into <code>egg-analysis.md</code> (Stage 2).',
    docs_knowledgeStructuring_032: '<code>**Key Questions:**</code>',
    docs_knowledgeStructuring_033:
      '\n                Numbered list of recurring questions you want answered whenever content touches this domain (e.g.\n                <em>"What is the token cost?"</em>, <em>"What are the failure modes?"</em>).\n              ',
    docs_knowledgeStructuring_034:
      '\n                Injected into <code>egg-analysis.md</code> (Stage 2). Answered in the Chrome extension popup and saved\n                in your raw capture notes.\n              ',
    docs_knowledgeStructuring_035: '<code>**Worth Reading If:** / **Skip If:**</code>',
    docs_knowledgeStructuring_036:
      '\n                Two preference lists describing when the original deserves your time and when the summary is sufficient.\n              ',
    docs_knowledgeStructuring_037:
      '\n                Guide the Stage 2 reading action: full, highlights, summary, skip, or uncertain. They never reject\n                entries during merge.\n              ',
    docs_knowledgeStructuring_038: '<code>**Formatting Rules:**</code>',
    docs_knowledgeStructuring_039:
      '\n                Formatting standards: bracketed tags (<code>[concept]</code>, <code>[architecture]</code>,\n                <code>[method]</code>, etc.) and hierarchical bullet indentation.\n              ',
    docs_knowledgeStructuring_040:
      "\n                Injected into <code>egg-analysis.md</code> (Stage 2). Guarantees candidate entries match your notes'\n                formatting conventions.\n              ",
    docs_knowledgeStructuring_041: '3. Curated Knowledge Tree vs. Unprocessed Queue',
    docs_knowledgeStructuring_042:
      'NutEgg protects your knowledge base from AI pollution by separating curated knowledge from new captures:',
    docs_knowledgeStructuring_043:
      '\n            <strong><code># Knowledge</code> (Curated Tree):</strong>\n            Structured with markdown headings and nested bullet points. Only merge reads this tree, consolidating\n            equivalent claims while preserving distinct examples, caveats, disagreements, and sources. Stage 2 follows\n            instructions without comparing against the tree.\n          ',
    docs_knowledgeStructuring_044:
      '\n            <strong><code># Unprocessed</code> (Staging Queue):</strong>\n            When you click <strong>🥚 Hatch Egg</strong> in the browser, approved entries and supported answers are\n            safely appended to <code># Unprocessed</code> rather than directly touching your curated hierarchy.\n          ',
    docs_knowledgeStructuring_045: '4. How Each Part is Used in the Workflow',
    docs_knowledgeStructuring_046:
      'Here is how web content flows through your egg instructions from initial capture to final synthesis:',
    docs_knowledgeStructuring_047:
      '<code>[Captured Web Content]\n          │\nStage 1   ▼   _index.md (Topic routing guide)\n─────────────────────────────────────────────────────────────\n• Uses content-task-default.md\n• Generates Title Verdict, 3-Bullet Summary, Mind Map\n• egg-routing.md matches target eggs via Stage 1 summary\n          │\n          ▼\nUser Review: Confirm or select target eggs in popup\n          │\nStage 2   ▼   Target Egg File (nutegg/*.md)\n─────────────────────────────────────────────────────────────\n• Scope, Key Questions, Formatting Rules ──► egg-analysis.md\n  (Extracts candidate knowledge entries and answers questions)\n• Worth Reading If / Skip If guide the reading recommendation\n  (Full, highlights, summary, skip, or uncertain; no tree comparison)\n          │\n          ▼\nHatch Egg: Approved entries and supported answers appended to # Unprocessed\n          │\nMerge Cycle (20+ entries or manual button)\n─────────────────────────────────────────────────────────────\n• merge-unprocessed.md nests and integrates entries into # Knowledge</code>',
    docs_knowledgeStructuring_048: 'Auto-Merging Knowledge',
    docs_knowledgeStructuring_049:
      "\n          When 20 or more entries accumulate in <code># Unprocessed</code> (or when you click <strong>Merge</strong> in\n          the Obsidian reading view widget), NutEgg's AI runs an automated background synthesis using\n          <code>merge-unprocessed.md</code>. It categorizes, deduplicates, and nests pending entries under the\n          appropriate parent concepts in <code># Knowledge</code>, keeping your knowledge graph perpetually organized.\n        ",
    docs_obsidianPlugin_001: 'Obsidian Plugin Guide — NutEgg',
    docs_obsidianPlugin_002: 'Obsidian Community Plugin ↗',
    docs_obsidianPlugin_003: 'Chrome Web Store ↗',
    docs_obsidianPlugin_004: 'Plugin Releases',
    docs_obsidianPlugin_005: 'Privacy Policy',
    docs_obsidianPlugin_006: 'Obsidian Plugin Setup & Configuration',
    docs_obsidianPlugin_007:
      '\n          The NutEgg Obsidian plugin hosts the local sync server, manages AI communication, matches incoming content to\n          your knowledge trees, and maintains your vault files.\n        ',
    docs_obsidianPlugin_008: 'Installation',
    docs_obsidianPlugin_009: 'Option 1: Obsidian Community Plugins (Recommended)',
    docs_obsidianPlugin_010: 'NutEgg is officially listed in the Obsidian Community Plugins directory:',
    docs_obsidianPlugin_011: 'In Obsidian, open <strong>Settings → Community plugins</strong>.',
    docs_obsidianPlugin_012:
      'Ensure <strong>Restricted mode</strong> is turned off, then click <strong>Browse</strong>.',
    docs_obsidianPlugin_013:
      '\n            Search for <strong>NutEgg</strong> (or visit\n            <a href="https://community.obsidian.md/plugins/nutegg" target="_blank" rel="noopener"\n              >NutEgg on Obsidian Community Plugins</a\n            >).\n          ',
    docs_obsidianPlugin_014: 'Click <strong>Install</strong>, then click <strong>Enable</strong>.',
    docs_obsidianPlugin_015: 'Option 2: Manual Installation',
    docs_obsidianPlugin_016:
      '\n            Download <code>main.js</code>, <code>manifest.json</code>, and <code>styles.css</code> from the\n            <a href="https://github.com/staff-000/nutegg-obsidian-release/releases" target="_blank" rel="noopener"\n              >NutEgg Obsidian Plugin Releases</a\n            >.\n          ',
    docs_obsidianPlugin_017:
      '\n            In your Obsidian vault, open <code>.obsidian/plugins/</code> (show hidden folders in your OS if needed).\n          ',
    docs_obsidianPlugin_018:
      '\n            Create a new directory named <code>nutegg</code> and place the three files inside:\n            <pre><code>your-vault/.obsidian/plugins/nutegg/\n├── main.js\n├── manifest.json\n└── styles.css</code></pre>\n          ',
    docs_obsidianPlugin_019:
      '\n            In Obsidian, open <strong>Settings → Community plugins</strong>, click <strong>Reload</strong>, and toggle\n            <strong>NutEgg</strong> on.\n          ',
    docs_obsidianPlugin_020: 'Option 3: Using BRAT',
    docs_obsidianPlugin_021:
      '\n            Install the\n            <a href="https://github.com/tfthacker/obsidian42-brat" target="_blank" rel="noopener">BRAT</a> community\n            plugin in Obsidian.\n          ',
    docs_obsidianPlugin_022: 'Go to <strong>Settings → BRAT → Add Beta plugin</strong>.',
    docs_obsidianPlugin_023:
      'Enter <code>staff-000/nutegg-obsidian-release</code> and click <strong>Add Plugin</strong>.',
    docs_obsidianPlugin_024: 'Enable NutEgg once installed.',
    docs_obsidianPlugin_025: 'AI Execution Architecture',
    docs_obsidianPlugin_026:
      '\n          NutEgg uses an intelligent dual execution architecture (Protocol 3) that gives you full flexibility between\n          bring-your-own-API-key privacy and zero-key subscription convenience:\n        ',
    docs_obsidianPlugin_027: '🔒 Core Privacy Invariant: API Keys Never Leave Chrome',
    docs_obsidianPlugin_028:
      '\n            In <strong>Connected API Mode</strong>, Obsidian orchestrates vault operations, prompt assembly, and egg indexing,\n            but <strong>delegates all AI calls back to Chrome</strong> via an authenticated local WebSocket. Chrome executes the\n            call using its locally stored API key. Your API keys are never transmitted to Obsidian, never written to vault notes,\n            and never leave the browser.\n          ',
    docs_obsidianPlugin_029:
      '<code>┌─────────────────────────────────────────────────────────────────────────────┐\n│                           CONNECTED API MODE (Default)                      │\n│                                                                             │\n│  Chrome Profile A ──(1) HTTP /analyze /confirm──►  Obsidian Plugin          │\n│  (Holds API Key A)                                 (127.0.0.1:27123)        │\n│                                                            │                │\n│                   ◄─(2) WebSocket AI Call /socket──────────┤ Reads _index.md│\n│  Calls Provider A                                          │ Assembles prompt│\n│  (OpenAI / Claude / Gemini / DeepSeek)                     │                │\n│                   ──(3) Authenticated Result─────────────► │                │\n│                                                            ▼                │\n│  Receives Final Result ◄──────(4) HTTP Result────── Saves to Vault          │\n│                                                     (_raw/ & &lt;egg&gt;.md)      │\n└─────────────────────────────────────────────────────────────────────────────┘\n\n┌─────────────────────────────────────────────────────────────────────────────┐\n│                       SHARED SUBSCRIPTION MODE (Zero API Keys)              │\n│                                                                             │\n│  Chrome Profile A ────┐                                                     │\n│                       ├──► Obsidian Plugin (127.0.0.1:27123)                │\n│  Chrome Profile B ────┘        │                                            │\n│                                ▼                                            │\n│                       SubscriptionService (Local CLI or OAuth)              │\n│                       ├── ChatGPT Sign-In (OpenAI Responses API)            │\n│                       ├── Codex CLI (@openai/codex)                         │\n│                       ├── Claude Code CLI (claude auth login)               │\n│                       └── Google Gemini (Antigravity CLI: agy)              │\n└─────────────────────────────────────────────────────────────────────────────┘</code>',
    docs_obsidianPlugin_030: 'Mode 1: Connected API Mode (Default)',
    docs_obsidianPlugin_031:
      '\n          In this mode, you configure your AI provider and API key directly in <strong>Chrome Extension Options</strong>.\n          Obsidian coordinates the knowledge workflow while Chrome acts as the secure local AI runner.\n        ',
    docs_obsidianPlugin_032:
      '\n            <strong>Supported Cloud Providers</strong>: Anthropic (Claude 3.5 Sonnet, Claude 3.7 Sonnet), OpenAI (GPT-4o, o-series),\n            Google Gemini (2.0 Flash, 2.5 Pro), DeepSeek (V3, R1), Kimi, Qwen, Zhipu, and OpenRouter.\n          ',
    docs_obsidianPlugin_033:
      '\n            <strong>Local LLMs (Ollama, LM Studio, llama.cpp, vLLM)</strong>: Configure local endpoints directly in Chrome.\n            NutEgg connects to your local model without sending data outside your machine.\n          ',
    docs_obsidianPlugin_034:
      '\n            <strong>Independent Chrome Profiles</strong>: If you use multiple Chrome profiles (e.g. Work and Personal), each profile\n            can use its own provider, model, and API key. They connect to the same Obsidian vault without key collisions.\n          ',
    docs_obsidianPlugin_035:
      "\n            <strong>Obsidian-Native Actions</strong>: Vault-only maintenance tasks (such as manual egg merging in Obsidian) use\n            native settings safely stored in Obsidian's <code>SecretStorage</code>. Clicking <strong>Save &amp; continue</strong> in\n            a connected Chrome profile securely updates the native account in SecretStorage.\n          ",
    docs_obsidianPlugin_036: 'Mode 2: Shared Subscription Mode &amp; ChatGPT Sign-In',
    docs_obsidianPlugin_037:
      "\n          Don't want to manage API keys or pay-per-token credits? NutEgg supports direct sign-in and local developer CLI subscriptions\n          managed inside Obsidian:\n        ",
    docs_obsidianPlugin_038: 'Option A: Direct ChatGPT Sign-In (No CLI needed)',
    docs_obsidianPlugin_039: 'In Obsidian, open <strong>Settings → NutEgg</strong>.',
    docs_obsidianPlugin_040: 'Under <strong>AI connection</strong>, select <strong>ChatGPT sign-in</strong>.',
    docs_obsidianPlugin_041:
      'Click <strong>Continue with ChatGPT</strong>, complete the browser authorization flow, and allow plan usage.',
    docs_obsidianPlugin_042: 'Choose your account model (e.g. <code>gpt-4o</code>).',
    docs_obsidianPlugin_043:
      '\n            All connected Chrome profiles immediately follow this connection with zero API key setup. Credentials live securely in\n            per-installation OS keychain storage and are never sent to Chrome or stored in vault files.\n          ',
    docs_obsidianPlugin_044: 'Option B: Local CLI Subscriptions (Codex, Claude, Gemini)',
    docs_obsidianPlugin_045:
      '\n          NutEgg can run official developer CLI tools already installed and logged in on your machine:\n        ',
    docs_obsidianPlugin_046: 'Provider',
    docs_obsidianPlugin_047: 'CLI Installation',
    docs_obsidianPlugin_048: 'Authentication',
    docs_obsidianPlugin_049: 'Model Discovery',
    docs_obsidianPlugin_050: '<strong>Codex CLI</strong>',
    docs_obsidianPlugin_051: '<code>npm install -g @openai/codex</code>',
    docs_obsidianPlugin_052: '<code>codex login</code>',
    docs_obsidianPlugin_053: 'Automatic via app-server',
    docs_obsidianPlugin_054: '<strong>Anthropic Claude</strong>',
    docs_obsidianPlugin_055:
      '<a href="https://code.claude.com/docs/en/quickstart" target="_blank" rel="noopener">Claude Code</a>',
    docs_obsidianPlugin_056: '<code>claude auth login --claudeai</code>',
    docs_obsidianPlugin_057: 'Sonnet, Opus, Haiku, or custom ID',
    docs_obsidianPlugin_058: '<strong>Google Gemini</strong>',
    docs_obsidianPlugin_059:
      '<a href="https://antigravity.google/docs/cli/install" target="_blank" rel="noopener">Antigravity CLI</a>',
    docs_obsidianPlugin_060: '<code>agy</code> browser flow',
    docs_obsidianPlugin_061: 'Automatic via <code>agy models</code>',
    docs_obsidianPlugin_062:
      "\n          In Obsidian Settings → NutEgg, simply select your CLI under <strong>AI connection</strong>. NutEgg's internal\n          <code>SubscriptionService</code> runs inference in a bounded serial queue locally. No separate bridge server or port 27124 is needed.\n        ",
    docs_obsidianPlugin_063: 'Local Sync Server &amp; Security',
    docs_obsidianPlugin_064:
      '\n          When the plugin is enabled, it automatically boots a background HTTP and WebSocket listener on <code>127.0.0.1:27123</code>.\n        ',
    docs_obsidianPlugin_065: '🔒 Privacy &amp; Origin Security',
    docs_obsidianPlugin_066:
      '\n            The local server binds strictly to the localhost loopback address (<code>127.0.0.1</code>). It enforces\n            strict <code>X-NutEgg-Extension-Origin</code> and token validation, preventing ordinary web pages from accessing your vault.\n            WebSocket connections authenticate on their very first frame.\n          ',
    docs_obsidianPlugin_067: 'Workflow &amp; Prompt Customization',
    docs_obsidianPlugin_068:
      '\n          NutEgg powers its AI analysis through modular, editable Markdown prompts stored directly in your vault under\n          <code>nutegg/_workflow/</code>:\n        ',
    docs_obsidianPlugin_069:
      '\n            <strong>Editable Templates</strong>: Customize prompts for content analysis, egg comparison, routing, and\n            follow-ups.\n          ',
    docs_obsidianPlugin_070:
      '\n            <strong>Non-Destructive Updates</strong>: When NutEgg releases updated prompt templates, your customized\n            workflows are automatically preserved without being overwritten.\n          ',
    docs_workflow_001: 'AI Workflow & Prompt Engine — NutEgg',
    docs_workflow_002: 'Chrome Web Store ↗',
    docs_workflow_003: 'Obsidian Plugin ↗',
    docs_workflow_004: 'Releases',
    docs_workflow_005: 'Privacy Policy',
    docs_workflow_006: 'AI Workflow &amp; Prompt Engine',
    docs_workflow_007:
      "\n          Learn how NutEgg's modular workflow engine orchestrates content extraction, summary-based egg routing,\n          instruction-driven analysis, and user-customizable prompts.\n        ",
    docs_workflow_008: 'The Two-Stage Architecture',
    docs_workflow_009:
      '\n          Rather than running a single monolithic prompt, NutEgg uses a <strong>Two-Stage Architecture</strong> designed\n          for token efficiency, high extraction precision, and complete user control:\n        ',
    docs_workflow_010:
      '<code>                    ┌───────────────────────────────┐\n                    │      Captured Web Content     │\n                    │   (Article / YouTube / Tweet) │\n                    └───────────────┬───────────────┘\n                                    │\n                                    ▼\n       ===========================================================\n       STAGE 1: Content & Discussion Analysis + Egg Routing\n       ===========================================================\n            │                                             │\n            ├─► Content Analysis                          ├─► Discussion Analysis\n            │   (Is content >30k chars?)                  │   (When 💬 Discussion enabled\n            │    ├── No  ──► [content-analysis.md]        │    & comments captured)\n            │    └── Yes ──► Chunks + [aggregate-         │    ├── [discussion-analysis.md]\n            │                content.md]                  │    └── [aggregate-discussion.md]\n            │                                             │\n            └──────────────────────┬──────────────────────┘\n                                   │\n                                   ▼\n        Produces: Title Verdict, 3-Bullet Summary, Mind Map,\n        Timestamped Q&A, and Discussion Topics/Stances\n                                   │\n                                   ▼\n                          [egg-routing.md]\n          (Routes matched eggs from _index.md using the\n           concise Stage 1 summary instead of raw content)\n                                    │\n                                    ▼\n       ===========================================================\n       INTERACTIVE CHOICE / EXECUTION MODE (Chrome Extension)\n       ===========================================================\n                                    │\n                        Which mode is selected?\n                                    │\n            ┌───────────────────────┼───────────────────────┐\n            ▼                       ▼                       ▼\n     [Standalone Mode]         [🌞 Full Mode]      [🌛 Preview Summary]\n     Obsidian is offline.      Auto-proceeds to    User reviews matched eggs:\n     Runs Stage 1 in Chrome    Stage 2 with all    ├── "Collect Nut Only"\n     with user\'s API key.      matched eggs.       └── Add/remove eggs ──► Proceed\n     (Fast reading & Q&A)           │                       │\n            │                       └───────────┬───────────┘\n            ▼                                   ▼\n    Results in Side Panel      ===========================================================\n    (No Stage 2 analysis)    STAGE 2: Per-Egg Instruction-Driven Analysis\n                               ===========================================================\n                                                │\n                                   For each confirmed egg (1 or N):\n                                                │\n                                                ▼\n                                        [egg-analysis.md]\n                                  (Extract candidate knowledge entries\n                                   & key questions scoped to this egg)\n                                                │\n                                                ▼\n                                  (Answers + extracted entries + reading action)\n                                                │\n                                                ▼\n                                     Results returned to Popup\n                                     (Ready to Save Nut & Eggs)</code>',
    docs_workflow_011: '💡 Why Summary-Based Routing?',
    docs_workflow_012:
      '\n            Routing eggs using the Stage 1 summary instead of full raw articles or multi-hour video transcripts saves\n            tens of thousands of tokens per run and improves routing accuracy by focusing on distilled, high-signal\n            semantic themes.\n          ',
    docs_workflow_013:
      '\n          The side panel’s cross-tab indicator shows running analyses and unread completed results in the current Chrome\n          window. Click it to list tabs and switch directly to their results or progress. Results become read when their\n          analysis is visible in the active tab. Tracking lasts while the panel stays open and resets when it closes.\n        ',
    docs_workflow_014:
      '\n          Hatch archives the original analysis and appends approved entries to <code># Unprocessed</code>. Merge runs at\n          20 pending entries or on demand to assemble fragments and deduplicate claims while preserving sources,\n          caveats, examples, and disagreements. Stage 2 never receives the Knowledge tree, so the recommendation\n          assesses relevance and substance rather than novelty.\n        ',
    docs_workflow_015:
      '\n          The <strong>🍃 Knowledge</strong> section option and the Egg Analysis dropdown share one setting for the\n          current browser tab: <strong>🥚 Analysis only</strong> switches Knowledge off, and\n          <strong>🍃 Include knowledge</strong> switches it on. Switching dropdown choices updates the setting and\n          button label without auto-triggering an AI call—click the button to analyze. When switching to Include\n          Knowledge for an egg analyzed previously without knowledge entries, NutEgg reruns Stage 2 rather than simply\n          showing the cached answer-only result. Include knowledge is the initial default; your last choice becomes the\n          default for tabs without analysis. Turning the option off does not hide previously generated entries or\n          prevent saving them. Turning Knowledge off disables entries for every selected egg. Turning it on allows\n          entries only for eggs that permit them: <code>Generate Knowledge Entries: no</code> or an opt-out in the egg’s\n          Action Guide takes priority. Key answers and reading recommendations remain available either way. Analysis\n          does not save entries; <strong>🐣 Hatch Egg</strong> saves generated entries to egg files.\n        ',
    docs_workflow_016: 'Workflow Modes',
    docs_workflow_017: 'Mode',
    docs_workflow_018: 'Behavior',
    docs_workflow_019: 'Best Used For',
    docs_workflow_020: '<strong>📱 Standalone Mode</strong>',
    docs_workflow_021:
      '\n                Runs Stage 1 content analysis directly in Chrome (when Obsidian is offline or closed). Produces\n                verdicts, 3-sentence summaries, mind maps with clickable timestamps, and interactive video Q&amp;A with\n                timestamp jumping. Skips Stage 2 egg analysis.\n              ',
    docs_workflow_022:
      "\n                Fast web and video reading, quick comprehension, or when you don't need note archiving.\n              ",
    docs_workflow_023: '<strong>🌞 Full Mode</strong>',
    docs_workflow_024:
      '\n                Runs Stage 1 content analysis, routes eggs automatically via <code>_index.md</code>, and immediately\n                executes Stage 2 egg analysis in one uninterrupted pass.\n              ',
    docs_workflow_025: 'Everyday reading and quick captures when you trust automatic egg matching.',
    docs_workflow_026: '<strong>🌛 Preview Summary</strong>',
    docs_workflow_027:
      "\n                Runs Stage 1 content analysis, then pauses in the popup. Shows matched eggs alongside your vault's full\n                egg list. You can add/remove eggs, proceed with knowledge comparison, or click\n                <strong>Collect Nut Only</strong>.\n              ",
    docs_workflow_028:
      '\n                Deep research, ambiguous topics, or when you only want a quick summary without updating egg knowledge\n                trees.\n              ',
    docs_workflow_029: 'AI Execution &amp; Credential Protocol',
    docs_workflow_030:
      '\n          Regardless of whether you choose Full Mode or Preview Summary, NutEgg separates <em>workflow orchestration</em> from\n          <em>credential storage and AI inference</em>:\n        ',
    docs_workflow_031:
      '\n            <strong>Connected API Mode (Default)</strong>: Obsidian coordinates prompt template injection and knowledge comparison,\n            but sends inference requests to Chrome over an authenticated WebSocket (<code>/execution/socket</code>). Chrome runs\n            the LLM call with its local API key and sends the authenticated result back. <strong>Your API key never leaves Chrome.</strong>\n          ',
    docs_workflow_032:
      '\n            <strong>Shared Subscription Mode</strong>: Obsidian coordinates the workflow and directly executes AI calls locally\n            using official developer CLI tools (<code>codex</code>, <code>claude</code>, <code>agy</code>) or direct ChatGPT OAuth sign-in.\n            All connected Chrome profiles share this subscription without needing an API key.\n          ',
    docs_workflow_033: 'Workflow Files in Your Vault',
    docs_workflow_034: 'NutEgg seeds its prompt templates into <code>nutegg/_workflow/</code> inside your vault:',
    docs_workflow_035: '1. Shared Fragments (Injected into other prompts)',
    docs_workflow_036:
      '\n            <code>shared-output-rules.md</code>: Grounding directive (source content as sole truth) and multi-lingual\n            output language reference rules. Injected as <code>{{shared_output_rules}}</code>.\n          ',
    docs_workflow_037:
      '\n            <code>content-task-default.md</code>: Core task instructions for title verdicts, 3-bullet summaries, and\n            mind maps with clickable timestamps. Injected as <code>{{content_task_default}}</code>.\n          ',
    docs_workflow_038: '2. Content Capture &amp; Comparison Pipeline',
    docs_workflow_039:
      '\n            <code>content-analysis.md</code>: Stage 1 content summary, anti-clickbait verdict, interactive mind map with\n            clickable timestamps, and custom question answers with timestamp citations.\n          ',
    docs_workflow_040:
      '\n            <code>egg-routing.md</code>: Matches Stage 1 summaries against egg descriptions in <code>_index.md</code> to\n            select candidate eggs.\n          ',
    docs_workflow_041:
      "\n            <code>egg-analysis.md</code>: Stage 2 per-egg extraction of candidate knowledge entries and key question\n            answers scoped to one egg's instructions.\n          ",
    docs_workflow_042:
      '\n            Worth Reading If and Skip If guide full reading, highlights, summary sufficient, skip, or uncertain. Useful\n            answers remain saveable regardless of the recommendation.\n          ',
    docs_workflow_043:
      '\n            <code>aggregate-content.md</code> &amp; <code>aggregate-egg.md</code>: Long-content (>30k characters)\n            aggregation. Stage 2 combines only answer drafts, recommendation notes, and coverage; extracted entries\n            remain in source order until merge.\n          ',
    docs_workflow_044: '3. Discussion Analysis (Stage 1)',
    docs_workflow_045:
      '\n          Discussion analysis executes as part of <strong>Stage 1</strong> content analysis when the\n          <strong>💬 Discussion</strong> section is enabled in Extension Options or popup Analysis Sections, and the\n          page extractor captures reader comments or social replies (e.g. YouTube comments, Twitter replies,\n          Reddit/forum threads, Bilibili comments, or Zhihu answers).\n        ',
    docs_workflow_046:
      '\n            <code>discussion-analysis.md</code>: Analyzes comments in batches to extract 3–5 core debating topics,\n            classify commenter stances (<code>agree</code>, <code>disagree</code>, <code>mixed</code>,\n            <code>neutral</code>, <code>unclear</code>), and highlight valuable firsthand experience supplements or\n            corrections (<code>supplement: true</code>).\n          ',
    docs_workflow_047:
      '\n            <code>aggregate-discussion.md</code>: Merges and synthesizes topics and stance distributions across\n            multi-batch comment threads for large forums or video comment sections.\n          ',
    docs_workflow_048:
      '\n          <strong>Context Flow:</strong> Analyzed discussion summaries and evidence items are returned in the Stage 1\n          result and feed directly into custom Q&amp;A or forum body analysis (crucial for discussion-centric pages or\n          videos without transcripts). They are also forwarded as context signals into Stage 2\n          <code>egg-analysis.md</code> so eggs can evaluate community feedback alongside the source content.\n        ',
    docs_workflow_049: '4. Interactive &amp; Maintenance Workflows',
    docs_workflow_050:
      '\n            <code>follow-up.md</code>: Interactive natural-language Q&amp;A in the side panel with prior conversation\n            history and clickable video timestamp jumping.\n          ',
    docs_workflow_051:
      '\n            <code>merge-unprocessed.md</code>: Triggered manually or automatically at 20+ pending entries to organize\n            and nest raw items into <code># Knowledge</code>.\n          ',
    docs_workflow_052:
      '\n            <code>localize-egg.md</code>: Translates new egg templates into foreign languages while preserving English\n            structural headings.\n          ',
    docs_workflow_053: 'Safe Customization Guidelines',
    docs_workflow_054: '⚠️ What to Preserve',
    docs_workflow_055:
      '\n            You are free to customize prompt tone, perspective, and depth. However, you <strong>must preserve</strong>:\n          ',
    docs_workflow_056:
      '\n              All <code>{{placeholder}}</code> tags (e.g. <code>{{content}}</code>, <code>{{knowledge_tree}}</code>,\n              <code>{{title}}</code>).\n            ',
    docs_workflow_057:
      '\n              Exact JSON output keys (e.g. <code>titleVerdict</code>, <code>extractedEntries</code>,\n              <code>mindMap</code>) so the parser can deserialize the response.\n            ',
    docs_workflow_058:
      'Structural headings (<code># Knowledge</code>, <code># Unprocessed</code>) in markdown outputs.',
    docs_workflow_059: 'Conflict-Free Updates &amp; Reset',
    docs_workflow_060: 'When NutEgg updates to a newer version:',
    docs_workflow_061: '<strong>Unedited Prompts</strong>: Automatically updated to the latest built-in version.',
    docs_workflow_062:
      '\n            <strong>Customized Prompts</strong>: Your edits are never overwritten. NutEgg writes\n            <code>[filename].new.md</code> alongside your file so you can review new additions at your own pace.\n          ',
    docs_workflow_063:
      '\n            <strong>Factory Reset ("Use Defaults")</strong>: Need a fresh start? In\n            <strong>Obsidian Settings → NutEgg</strong>, click <strong>Use Defaults</strong>. All existing prompts are\n            safely backed up to <code>nutegg/_workflow/_backup/&lt;timestamp&gt;/</code> and pristine factory defaults\n            are restored.\n          ',
  },
  zh: {
    docs_chromeExtension_001: 'Chrome 扩展指南 — NutEgg',
    docs_chromeExtension_002: 'Chrome 网上商店 ↗',
    docs_chromeExtension_003: 'Obsidian 插件 ↗',
    docs_chromeExtension_004: '🎬 宣传视频 ↗',
    docs_chromeExtension_005: '扩展版本',
    docs_chromeExtension_006: '隐私政策',
    docs_chromeExtension_007: 'Chrome 扩展安装与使用',
    docs_chromeExtension_008:
      'NutEgg Chrome 扩展位于浏览器的侧面板中，提供按需内容提取、带有可点击时间戳的 YouTube 思维导图以及一键捕获到 Obsidian。',
    docs_chromeExtension_009: '安装',
    docs_chromeExtension_010: '选项 1：Chrome 网上商店（推荐）',
    docs_chromeExtension_011:
      '直接从官方<a\n            href="https://chromewebstore.google.com/detail/nutegg/bmdmdiicembobejibggoeiahaonphcol"\n            target="_blank"\n            rel="noopener"\n            >Chrome网上商店</a\n          >一键安装NutEgg：',
    docs_chromeExtension_012:
      '访问<a\n              href="https://chromewebstore.google.com/detail/nutegg/bmdmdiicembobejibggoeiahaonphcol"\n              target="_blank"\n              rel="noopener"\n              >NutEggChrome网上商店页面</a\n            >。',
    docs_chromeExtension_013: '单击<strong>添加到Chrome</strong>。',
    docs_chromeExtension_014: '单击Chrome工具栏中的拼图图标并固定<strong>NutEgg</strong>以方便访问侧面板。',
    docs_chromeExtension_015: '选项 2：从 GitHub 版本 (.zip)',
    docs_chromeExtension_016:
      '从<a\n              href="https://github.com/staff-000/nutegg-chrome-extension-release/releases"\n              target="_blank"\n              rel="noopener"\n              >发布页面</a\n            >下载最新的<code>nutegg-chrome-extension-*.zip</code>。',
    docs_chromeExtension_017: '将存档解压缩到计算机上的本地文件夹。',
    docs_chromeExtension_018: '打开 Google Chrome 并转到 <code>chrome://extensions</code>。',
    docs_chromeExtension_019: '打开右上角的<strong>开发者模式</strong>。',
    docs_chromeExtension_020: '点击<strong>加载解压的</strong>，选择包含<code>manifest.json</code>的解压目录。',
    docs_chromeExtension_021: '单击Chrome工具栏中的拼图图标并固定<strong>NutEgg</strong>以方便访问。',
    docs_chromeExtension_022: '侧面板工作流程',
    docs_chromeExtension_023: '单击 NutEgg 扩展图标可打开 Chrome 的侧面板：',
    docs_chromeExtension_024:
      '<strong>自动提取</strong>：当您浏览时，NutEgg会检测活动选项卡（YouTube视频、Twitter/X 线程或博客文章）并提取其文本和结构。',
    docs_chromeExtension_025:
      '<strong>内容刷新 (🔄)</strong>：单击内容预览中的刷新按钮可重新提取动态单页应用程序上的页面，而不会意外重定向离开预览。',
    docs_chromeExtension_026:
      '<strong>目标Egg选择器</strong>：在内容预览中，选择目标知识eggs或使用“目标eggs（默认自动选择）”让AI自动匹配相关的金库树。',
    docs_chromeExtension_027:
      '<strong>分析模式</strong>：<ul><li><strong>完整模式</strong>：评估内容并立即在单个简化工作流程中针对匹配eggs运行知识匹配。 </li><li><strong>预览模式</strong>：首先生成第一阶段概述（摘要、思维导图、问答、讨论），让您在按需运行egg知识分析之前检查或调整目标eggs。 </li></ul>',
    docs_chromeExtension_028:
      '<strong>状态指示器</strong>：绿点表示与本地Obsidian服务器 (<code>127.0.0.1:27123</code>) 的连接正常。如果为红色，请确保 Obsidian 正在运行且启用了 NutEgg 插件。',
    docs_chromeExtension_029: 'YouTube 集成与智能导航',
    docs_chromeExtension_030: '在YouTube视频页面上，NutEgg提取：',
    docs_chromeExtension_031: '<strong>完整字幕和脚本</strong>：从创建者和自动生成的脚本中自动高精度提取。',
    docs_chromeExtension_032:
      '<strong>带有可点击时间戳的思维导图</strong>：带有可点击时间戳按钮的即时细分，可将您的活动YouTube视频播放器直接查找到该片段。当存在时间戳时，冗余源标签将被隐藏以保持树的干净。',
    docs_chromeExtension_033:
      '<strong>时间戳跳跃问答</strong>：用自然语言询问有关视频的任何问题； NutEgg 提供引用的答案以及可点击的时间戳药丸，可直接跳转到视频播放中的源时刻。',
    docs_chromeExtension_034: '<strong>反点击诱饵判决</strong>：对视频标题前提的客观 1 句话回答，让您立即跳过废话。',
    docs_chromeExtension_035: '文本页内源导航',
    docs_chromeExtension_036: '阅读文章、博客或论坛时：',
    docs_chromeExtension_037:
      '<strong>📍跳转到源</strong>：文本思维导图节点和问答引用包含源标签。单击源标签会自动将实时网页滚动到完全匹配的段落或引用，并用轮廓简要突出显示它。',
    docs_chromeExtension_038:
      '<strong>评论导航</strong>：在讨论页面（Reddit、知乎等），点击来源引用可直接滚动到具体评论或答案。',
    docs_chromeExtension_039: '讨论分析和社区观点',
    docs_chromeExtension_040: 'NutEgg 分析了YouTube、Reddit、Twitter/X、知乎和论坛上的公众评论：',
    docs_chromeExtension_041:
      '<strong>主题和立场细分</strong>：用立场徽章（同意👍、不同意👎、混合🤔、中立⚖️）和反应指标总结核心辩论要点。',
    docs_chromeExtension_042: '<strong>额外见解</strong>：包含证据、警告或独特经验的高价值评论被保留为简洁的额外见解。',
    docs_chromeExtension_043: 'Chrome-仅独立模式（不需要Obsidian）',
    docs_chromeExtension_044: '尚未安装或当前未打开 Obsidian？ NutEgg 在 Google Chrome 内完全独立工作！',
    docs_chromeExtension_045: '⚡ 快速网络阅读，无需笔记开销',
    docs_chromeExtension_046:
      'NutEgg 首先被设计为超快速的网络阅读伴侣。您可以直接在 Chrome 中提取、总结、生成思维导图，并提出有关任何文章或 YouTube 视频的问题，而无需接触笔记库。',
    docs_chromeExtension_047: 'Chrome 独立版可用的功能：',
    docs_chromeExtension_048: '<strong>🎯即时反点击诱饵判决</strong>：对标题问题的客观一句话回答。',
    docs_chromeExtension_049: '<strong>📝执行三句话摘要</strong>：从任何长文章或视频中提取的高密度要点。',
    docs_chromeExtension_050: '<strong>⏱️ 带可点击时间戳和搜索的思维导图</strong>：一键跳转到关键视频片段。',
    docs_chromeExtension_051:
      '<strong>💬视频问答和时间戳跳转</strong>：提出问题并单击引用的时间戳丸将视频播放直接擦除到该片段。',
    docs_chromeExtension_052: '<strong>🧠 可折叠思维导图</strong>：多层交互式思维树，直观地分解核心思想。',
    docs_chromeExtension_053: '<strong>🌐 50 多种语言支持</strong>：即时提取和翻译外语内容。',
    docs_chromeExtension_054: '如何配置仅Chrome模式：',
    docs_chromeExtension_055:
      '右键单击Chrome工具栏中的<strong>NutEgg扩展图标</strong>，然后选择<strong>选项</strong>。',
    docs_chromeExtension_056:
      '选择您首选的 AI 提供商（例如 Google Gemini、OpenAI、Claude、DeepSeek 或 OpenRouter）并输入您的 API 密钥。',
    docs_chromeExtension_057: '单击<strong>保存</strong>。您已准备好分析任何页面！',
    docs_chromeExtension_058: 'Obsidian 连接与AI执行模式',
    docs_chromeExtension_059:
      '当您将 Chrome 扩展连接到可选的 NutEgg Obsidian 插件时，Chrome 会根据所选的执行模式无缝适应：',
    docs_chromeExtension_060: '🔒 API 密钥安全：密钥永不离开 Chrome',
    docs_chromeExtension_061:
      '在<strong>连接API模式</strong>中，您的API密钥严格保留在Chrome的安全扩展存储中。 Obsidian 管理知识模板和库索引，但通过经过身份验证的本地 WebSocket 将 AI 推理委托回Chrome。 Chrome 在本地调用提供者 API，并仅返回生成的文本。',
    docs_chromeExtension_062: '执行模式',
    docs_chromeExtension_063: '人工智能运行的地方',
    docs_chromeExtension_064: '使用的凭证',
    docs_chromeExtension_065: '<strong>Chrome-仅</strong>',
    docs_chromeExtension_066: '直接在里面Chrome',
    docs_chromeExtension_067: 'API密钥在Chrome选项中配置',
    docs_chromeExtension_068: '<strong>连接API模式</strong>',
    docs_chromeExtension_069: 'Chrome（由Obsidian通过本地WebSocket委托）',
    docs_chromeExtension_070: 'Chrome 中的 API 密钥（密钥从未发送到Obsidian）',
    docs_chromeExtension_071: '<strong>共享订阅模式</strong>',
    docs_chromeExtension_072: '内部Obsidian（通过本地 CLI 或 ChatGPT OAuth）',
    docs_chromeExtension_073: '零 API 密钥（使用 Codex、Claude 代码、Antigravity 或 ChatGPT）',
    docs_chromeExtension_074: '多配置文件Chrome支持',
    docs_chromeExtension_075:
      'NutEgg 支持多个 Chrome 浏览器配置文件（例如个人和工作）同时连接到同一个 Obsidian 文件库。每个 Chrome 配置文件独立保留自己的提供者、模型和 API 密钥。连接或切换执行模式绝不会泄漏或覆盖配置文件之间的 API 密钥。',
    docs_chromeExtension_076: '离线和断开连接恢复',
    docs_chromeExtension_077:
      '如果在启用连接模式时关闭Obsidian，NutEgg会显示清晰的状态指示灯，并为您提供一键<strong>“改为使用Chrome模式”</strong>选项。这使您可以使用 Chrome API 设置立即继续阅读和提问，而不会出现中断或配额风险。',
    docs_chromeExtension_078: '配置和实时同步',
    docs_chromeExtension_079: 'NutEgg 包括扩展选项和活动侧面板之间的实时同步：',
    docs_chromeExtension_080:
      '<strong>内容部分控件</strong>：在选项页面中自定义默认提取和分析哪些部分（内容、摘要、思维导图、问答、知识条目和讨论）。',
    docs_chromeExtension_081:
      '<strong>实时设置同步</strong>：更改分析模型、启用的输出部分或服务器设置会立即更新所有打开的侧面板，无需刷新页面。',
    docs_chromeExtension_082:
      '<strong>自定义服务器端口</strong>：如果默认端口<code>27123</code>与其他服务冲突，请打开扩展<strong>选项</strong>，调整端口（例如<code>28123</code>），然后测试连接。',
    docs_index_001: '文档概览 — NutEgg',
    docs_index_002: 'Chrome 网上商店 ↗',
    docs_index_003: 'Obsidian 插件 ↗',
    docs_index_004: '🎬 宣传视频 ↗',
    docs_index_005: 'GitHub 发布',
    docs_index_006: '隐私政策',
    docs_index_007: '问题跟踪器',
    docs_index_008: '概述与核心概念',
    docs_index_009:
      'NutEgg 是一个免费的开源 Chrome 扩展，可帮助您决定哪些内容值得阅读并更快地理解。它位于 Chrome 的侧面板中，适用于文章、主题和 YouTube 视频。可选的 Obsidian 插件可将您阅读的内容变成不断增长的知识库。',
    docs_index_010: '您在 Chrome 中得到什么',
    docs_index_011:
      '安装扩展程序，在选项中输入您的 AI API 密钥（或将其指向本地模型），NutEgg 即可立即运行 - 无需帐户，无需额外的应用程序：',
    docs_index_012: '🎯 即时反点击诱饵标题判决',
    docs_index_013: '📝 执行三句话总结和核心要点',
    docs_index_014: '🧠 可折叠分层思维导图，带有可点击的时间戳 YouTube',
    docs_index_015: '💬 自然语言问答，带有引用的时间戳药丸和页内源链接',
    docs_index_016: '🔍 双范围问题：严格在页面内，或超出页面进行事实检查',
    docs_index_017: '🗣️ YouTube、Reddit 和论坛的评论部分摘要',
    docs_index_018: '🌐 50多种语言的多源提取和翻译',
    docs_index_019: '💡为什么NutEgg存在',
    docs_index_020:
      '网络上有太多内容是虚假视频、标题党和人工智能夸大的文章。 NutEgg 预先回答标题并诚实地告诉您内容是否值得您花时间 - 因此您只将注意力花在有回报的地方。',
    docs_index_021: '可选：添加 Obsidian',
    docs_index_022:
      '如果您在 Obsidian 中保存笔记，请安装配套插件以将扩展连接到您的保管库 (<code>127.0.0.1:27123</code>)。这增加了针对您的 Vault 的 <code>_index.md</code> 知识树、增量合成以及自动注释归档到 <code>nutegg/_raw/</code> 和 egg 文件的 2 阶段新颖性评估。不管有没有它，Chrome 中的一切都可以正常工作。',
    docs_index_023: '比喻',
    docs_index_024: '连接 Obsidian 后，NutEgg 使用简单的三部分隐喻构建您的信息流：',
    docs_index_025:
      '<strong>🌰 Nut（原始捕获）</strong>：从浏览器提取的原始网页、推文或YouTube 记录。 Nuts 与完整元数据一起原封不动地存档到您保管库中的 <code>nutegg/_raw/</code> 中。',
    docs_index_026:
      '<strong>🥚Egg（知识树）</strong>：您的库中生动的、结构化的 Markdown 笔记，代表知识领域（例如，<code>ai_architecture.md</code>、<code>invest_strategy.md</code>）。',
    docs_index_027:
      '<strong>🐣 The Hatch（综合和增量）</strong>：分析内容时，人工智能会将其与您的eggs进行匹配，识别与已记录的内容相比的新颖之处，并将新的见解融入到您的egg中。',
    docs_index_028: '系统架构',
    docs_index_029: 'NutEgg 有 1 个核心组件和 1 个可选配套组件：',
    docs_index_030:
      '<strong>Chrome 扩展</strong>：位于Chrome的侧面板中。提取文本、评论和视频转录。在独立模式或连接的 API 模式下，它使用您配置的提供程序和 API 密钥在本地执行 AI 调用，确保您的 API 密钥永远不会离开浏览器。',
    docs_index_031:
      '<strong>Obsidian插件（可选）</strong>：在<code>127.0.0.1:27123</code>上运行本地同步和协调器服务。读取您的保管库的<code>_index.md</code>，管理<code>_workflow/</code>中的提示模板，并将捕获的知识存档到磁盘。它支持：<ul><li><strong>连接API模式（默认）</strong>：协调知识匹配，通过经过身份验证的本地WebSocket将AI推理委托给Chrome（密钥从未发送到Obsidian）。 </li> <li> <strong>共享订阅模式</strong>：通过 ChatGPT 登录 (OAuth) 或开发人员 CLI 工具（Codex、Claude 代码、Antigravity）在本地运行推理，所需 API 密钥为零。 </li></ul>',
    docs_index_032:
      '<code>Chrome Extension (Side Panel)\n │\n ├── [Standalone Mode] Local AI Processing (Verdicts, Summaries, Mind Maps, Q&amp;A)\n │\n └── [Connected Mode] HTTP + WebSocket (127.0.0.1:27123/execution/socket)\n         │\n         ▼\n Obsidian Plugin (Local Server &amp; Coordinator)\n         ├── Evaluates against vault/nutegg/_index.md &amp; prompts in _workflow/\n         ├── In API Mode: Delegates AI calls back to Chrome over WebSocket (keys stay in Chrome)\n         ├── In Subscription Mode: Executes locally via CLI (Codex/Claude/agy) or ChatGPT OAuth\n         └── Writes structured notes to vault/nutegg/_raw/ and &lt;egg&gt;.md</code>',
    docs_index_033: '快速入门路线图',
    docs_index_034:
      '观看 <a href="https://www.youtube.com/watch?v=_u6mDoHZSAo" target="_blank" rel="noopener"\n              >🎬 NutEgg 宣传视频</a\n            >，了解 1 分钟的视觉演练。',
    docs_index_035:
      '从 Chrome Web Store 安装<a\n              href="https://chromewebstore.google.com/detail/nutegg/bmdmdiicembobejibggoeiahaonphcol"\n              target="_blank"\n              rel="noopener"\n              >Chrome 扩展</a\n            >，并在选项中添加您的 AI 密钥（请参阅<a href="chrome-extension.html">指南</a>）。',
    docs_index_036: '打开任意文章或 YouTube 视频上的侧面板，然后单击 <strong>分析</strong>。就是这样！',
    docs_index_037:
      '<em>可选：</em>安装<a href="https://community.obsidian.md/plugins/nutegg" target="_blank" rel="noopener">Obsidian插件</a>（参见<a href="obsidian-plugin.html">指南</a>）并在<a href="knowledge-structuring.html">_index.md</a>中定义您的第一个知识主题以开始孵化。',
    docs_knowledgeStructuring_001: '知识结构与 Eggs — NutEgg',
    docs_knowledgeStructuring_002: 'Chrome 网上商店 ↗',
    docs_knowledgeStructuring_003: 'Obsidian 插件 ↗',
    docs_knowledgeStructuring_004: '发布',
    docs_knowledgeStructuring_005: '隐私政策',
    docs_knowledgeStructuring_006: '知识结构与 Eggs',
    docs_knowledgeStructuring_007:
      '了解 NutEgg 如何组织您的 Obsidian 库、使用 <code>_index.md</code> 将 Web 内容与主题匹配，以及如何将累积的条目合并到知识树中。',
    docs_knowledgeStructuring_008: '<code>nutegg/</code> 保险库布局',
    docs_knowledgeStructuring_009:
      '所有 NutEgg 内容都限制在 Obsidian 保管库中干净、隔离的 <code>nutegg/</code> 文件夹中：',
    docs_knowledgeStructuring_010:
      '<code>vault/\n└── nutegg/\n    ├── _raw/                          # Captured nuts (raw web content + metadata)\n    │   └── 2026-09-06-14-30-youtube-author-title.md\n    ├── _index.md                      # Topic routing guide\n    ├── ai_architecture.md             # Knowledge egg\n    ├── invest_strategy.md             # Knowledge egg\n    └── productivity.md                # Knowledge egg</code>',
    docs_knowledgeStructuring_011: '路线指南：<code>_index.md</code>',
    docs_knowledgeStructuring_012:
      '<code>_index.md</code> 文件告诉 NutEgg 您维护哪些 egg 注释以及它们涵盖哪些领域。每行将相对文件路径映射到关键字和描述：',
    docs_knowledgeStructuring_013:
      '<code>nutegg/ai_architecture.md: LLMs, multi-agent systems, prompt engineering, RAG, embeddings\nnutegg/invest_strategy.md: value investing, index funds, asset allocation, macroeconomic indicators\nnutegg/productivity.md: deep work, time blocking, habits, personal knowledge management</code>',
    docs_knowledgeStructuring_014: '⚡ 路由的工作原理',
    docs_knowledgeStructuring_015:
      '当您在浏览器中单击<strong>分析</strong>时，NutEgg的AI会读取您的<code>_index.md</code>并确定哪个egg（如果有）与内容匹配。如果没有现有的egg匹配，NutEgg会自动创建一个新的egg作为页面主题的种子！',
    docs_knowledgeStructuring_016: 'Egg 文件剖析和指令如何工作',
    docs_knowledgeStructuring_017:
      '<strong>Egg 文件</strong>（存储在 <code>nutegg/*.md</code> 下）有两个关键作用：它既是您为某个领域策划的、不断发展的知识存储库，又是一个主动提示规范，每当内容涉及该主题时，它就会引导 NutEgg 的 AI 管道。',
    docs_knowledgeStructuring_018: '1. 结构蓝图',
    docs_knowledgeStructuring_019:
      '每个 egg 文件都结合了 YAML 元数据、带有指令的 Obsidian 标注块、精心策划的知识树和未处理的暂存缓冲区：',
    docs_knowledgeStructuring_020:
      '<code>---\ntopic: "AI Architecture & Multi-Agent Systems"\nstatus: "active"\nlast_updated: "2026-09-10"\n---\n\n> [!abstract]- Instructions:\n> **Scope:** Multi-agent architectures, tool calling, memory layers, and LLM evaluation.\n> **Action Guide:** Focus on actionable design patterns, scalability tradeoffs, and real failure modes.\n> **Key Questions:**\n> 1. How are agent memory loops bounded to prevent context window overflow?\n> 2. What coordination mechanism is used between subagents?\n> **Worth Reading If:**\n&gt; - Practical examples and substantive explanations.\n&gt; **Skip If:**\n> - Ignore basic beginner tutorials or high-level sales pitches without technical substance.\n> - Discard speculative claims lacking empirical benchmarks or code evidence.\n> **Formatting Rules:**\n> - Prefix each insight with a bracketed tag: `[concept]`, `[architecture]`, `[method]`, `[benchmark]`, `[explain]`, `[fact]`, `[example]`.\n> - Use the structure: `- [tag] **Concept Name**` followed by an indented explanation and concrete examples (`- 🎯 Example:`).\n\n# Knowledge\n## Agent Memory\n- [architecture] **Bounded Replay Buffers**\n    - Ephemeral short-term memory expires after session goals terminate to conserve token budget.\n    - 🎯 Example: Tool calling trace logs stored in vector stores with sliding window eviction.\n\n# Unprocessed\n(Newly hatched insights land here from captures until auto-merged)</code>',
    docs_knowledgeStructuring_021: '2. 如何编写Egg指令',
    docs_knowledgeStructuring_022:
      '<code>&gt; [!abstract]- Instructions:</code>标注包含六个专门字段。每一个都指导人工智能管道的特定阶段：',
    docs_knowledgeStructuring_023: '领域',
    docs_knowledgeStructuring_024: '目的和最佳实践',
    docs_knowledgeStructuring_025: '工作流程使用',
    docs_knowledgeStructuring_026: '<code>**Scope:**</code>',
    docs_knowledgeStructuring_027: '1-2 个句子定义了这个 egg 的主题边界。明确说明包含或排除哪些概念、技术或问题。',
    docs_knowledgeStructuring_028:
      '注入<code>egg-analysis.md</code>（第2阶段），因此人工智能严格通过该领域镜头提取知识。',
    docs_knowledgeStructuring_029: '<code>**Action Guide:**</code>',
    docs_knowledgeStructuring_030:
      '关于人工智能如何总结和评估内容的 1-5 个步骤说明（例如询问具体观点、深度或权衡）。如果省略则返回默认指南。',
    docs_knowledgeStructuring_031: '注入<code>egg-analysis.md</code>（第2阶段）。',
    docs_knowledgeStructuring_032: '<code>**Key Questions:**</code>',
    docs_knowledgeStructuring_033:
      '每当内容涉及此领域时您希望回答的重复问题的编号列表（例如 <em>“代币成本是多少？”</em>、<em>“故障模式是什么？”</em>）。',
    docs_knowledgeStructuring_034:
      '注入<code>egg-analysis.md</code>（第2阶段）。在 Chrome 扩展弹出窗口中回答并保存在原始捕获笔记中。',
    docs_knowledgeStructuring_035: '<code>**Worth Reading If:** / **Skip If:**</code>',
    docs_knowledgeStructuring_036: '两个偏好列表描述了何时原件值得您花时间以及何时摘要已足够。',
    docs_knowledgeStructuring_037:
      '指导第二阶段的阅读行动：完整、重点、摘要、跳过或不确定。他们在合并期间从不拒绝条目。',
    docs_knowledgeStructuring_038: '<code>**Formatting Rules:**</code>',
    docs_knowledgeStructuring_039:
      '格式标准：括号标签（<code>[concept]</code>、<code>[architecture]</code>、<code>[method]</code>等）和分层项目符号缩进。',
    docs_knowledgeStructuring_040: '注入<code>egg-analysis.md</code>（第2阶段）。确保候选条目符合您笔记的格式约定。',
    docs_knowledgeStructuring_041: '3. 策划的知识树与未处理的队列',
    docs_knowledgeStructuring_042: 'NutEgg 通过将精选知识与新捕获分离来保护您的知识库免受人工智能污染：',
    docs_knowledgeStructuring_043:
      '<strong><code># Knowledge</code>（策划树）：</strong> 采用Markdown 标题和嵌套项目符号点结构。只有合并才会读取这棵树，合并等效的声明，同时保留不同的示例、警告、分歧和来源。第 2 阶段遵循指令，不与树进行比较。',
    docs_knowledgeStructuring_044:
      '<strong><code># Unprocessed</code>（暂存队列）：</strong> 当您在浏览器中单击 <strong>🥚 孵化 Egg</strong> 时，批准的条目和支持的答案将安全地附加到 <code># Unprocessed</code>，而不是直接触摸您策划的层次结构。',
    docs_knowledgeStructuring_045: '4. 各部分在工作流程中的使用方式',
    docs_knowledgeStructuring_046: '以下是网页内容如何通过 egg 指令从初始捕获到最终合成：',
    docs_knowledgeStructuring_047:
      '<code>[Captured Web Content]\n          │\nStage 1   ▼   _index.md (Topic routing guide)\n─────────────────────────────────────────────────────────────\n• Uses content-task-default.md\n• Generates Title Verdict, 3-Bullet Summary, Mind Map\n• egg-routing.md matches target eggs via Stage 1 summary\n          │\n          ▼\nUser Review: Confirm or select target eggs in popup\n          │\nStage 2   ▼   Target Egg File (nutegg/*.md)\n─────────────────────────────────────────────────────────────\n• Scope, Key Questions, Formatting Rules ──► egg-analysis.md\n  (Extracts candidate knowledge entries and answers questions)\n• Worth Reading If / Skip If guide the reading recommendation\n  (Full, highlights, summary, skip, or uncertain; no tree comparison)\n          │\n          ▼\nHatch Egg: Approved entries and supported answers appended to # Unprocessed\n          │\nMerge Cycle (20+ entries or manual button)\n─────────────────────────────────────────────────────────────\n• merge-unprocessed.md nests and integrates entries into # Knowledge</code>',
    docs_knowledgeStructuring_048: '自动合并知识',
    docs_knowledgeStructuring_049:
      '当<code># Unprocessed</code>中积累了20个或更多条目时（或者当您在Obsidian阅读视图小部件中单击<strong>合并</strong>时），NutEgg的AI会使用<code>merge-unprocessed.md</code>运行自动后台合成。它对 <code># Knowledge</code> 中适当的父概念下的待处理条目进行分类、删除重复和嵌套，从而使您的知识图永远井然有序。',
    docs_obsidianPlugin_001: 'Obsidian 插件指南 — NutEgg',
    docs_obsidianPlugin_002: 'Obsidian 社区插件 ↗',
    docs_obsidianPlugin_003: 'Chrome 网上商店 ↗',
    docs_obsidianPlugin_004: '插件发布',
    docs_obsidianPlugin_005: '隐私政策',
    docs_obsidianPlugin_006: 'Obsidian 插件安装与配置',
    docs_obsidianPlugin_007:
      'NutEgg Obsidian 插件托管本地同步服务器，管理 AI 通信，将传入内容与您的知识树匹配，并维护您的保管库文件。',
    docs_obsidianPlugin_008: '安装',
    docs_obsidianPlugin_009: '选项 1：Obsidian 社区插件（推荐）',
    docs_obsidianPlugin_010: 'NutEgg已正式列入Obsidian社区插件目录：',
    docs_obsidianPlugin_011: '在Obsidian中，打开<strong>设置→社区插件</strong>。',
    docs_obsidianPlugin_012: '确保关闭<strong>受限模式</strong>，然后单击<strong>浏览</strong>。',
    docs_obsidianPlugin_013:
      '搜索 <strong>NutEgg</strong>（或访问 <a href="https://community.obsidian.md/plugins/nutegg" target="_blank" rel="noopener"\n              >Obsidian 社区插件中的 NutEgg</a>）。',
    docs_obsidianPlugin_014: '单击<strong>安装</strong>，然后单击<strong>启用</strong>。',
    docs_obsidianPlugin_015: '选项 2：手动安装',
    docs_obsidianPlugin_016:
      '从 <a href="https://github.com/staff-000/nutegg-obsidian-release/releases" target="_blank" rel="noopener"\n              >NutEgg Obsidian 插件版本</a\n            > 下载 <code>main.js</code>、<code>manifest.json</code> 和 <code>styles.css</code>。',
    docs_obsidianPlugin_017:
      '在您的 Obsidian 保管库中，打开 <code>.obsidian/plugins/</code>（如果需要，显示操作系统中的隐藏文件夹）。',
    docs_obsidianPlugin_018:
      '创建一个名为<code>nutegg</code>的新目录，并将三个文件放入其中：<pre><code>your-vault/.obsidian/plugins/nutegg/\n├── main.js\n├── manifest.json\n└── styles.css</code></pre>',
    docs_obsidianPlugin_019:
      '在Obsidian中，打开<strong>设置→社区插件</strong>，单击<strong>重新加载</strong>，然后打开<strong>NutEgg</strong>。',
    docs_obsidianPlugin_020: '选项 3：使用 BRAT',
    docs_obsidianPlugin_021:
      '在Obsidian安装<a href="https://github.com/tfthacker/obsidian42-brat" target="_blank" rel="noopener">BRAT</a>社区插件。',
    docs_obsidianPlugin_022: '前往<strong>设置→BRAT→添加Beta插件</strong>。',
    docs_obsidianPlugin_023: '输入<code>staff-000/nutegg-obsidian-release</code>，然后点击<strong>添加插件</strong>。',
    docs_obsidianPlugin_024: '安装后启用NutEgg。',
    docs_obsidianPlugin_025: '人工智能执行架构',
    docs_obsidianPlugin_026:
      'NutEgg 使用智能双执行架构（协议 3），为您提供自带 API 密钥隐私和零密钥订阅便利性之间的充分灵活性：',
    docs_obsidianPlugin_027: '🔒 核心隐私不变：API 密钥永不离开 Chrome',
    docs_obsidianPlugin_028:
      '在<strong>连接API模式</strong>中，Obsidian协调Vault操作、提示组装和egg索引，但<strong>通过经过身份验证的本地WebSocket将所有AI调用委托回Chrome</strong>。 Chrome 使用其本地存储的 API 密钥执行调用。您的 API 密钥永远不会传输到 Obsidian，永远不会写入保管库注释，也永远不会离开浏览器。',
    docs_obsidianPlugin_029:
      '<code>┌─────────────────────────────────────────────────────────────────────────────┐\n│                           CONNECTED API MODE (Default)                      │\n│                                                                             │\n│  Chrome Profile A ──(1) HTTP /analyze /confirm──►  Obsidian Plugin          │\n│  (Holds API Key A)                                 (127.0.0.1:27123)        │\n│                                                            │                │\n│                   ◄─(2) WebSocket AI Call /socket──────────┤ Reads _index.md│\n│  Calls Provider A                                          │ Assembles prompt│\n│  (OpenAI / Claude / Gemini / DeepSeek)                     │                │\n│                   ──(3) Authenticated Result─────────────► │                │\n│                                                            ▼                │\n│  Receives Final Result ◄──────(4) HTTP Result────── Saves to Vault          │\n│                                                     (_raw/ & &lt;egg&gt;.md)      │\n└─────────────────────────────────────────────────────────────────────────────┘\n\n┌─────────────────────────────────────────────────────────────────────────────┐\n│                       SHARED SUBSCRIPTION MODE (Zero API Keys)              │\n│                                                                             │\n│  Chrome Profile A ────┐                                                     │\n│                       ├──► Obsidian Plugin (127.0.0.1:27123)                │\n│  Chrome Profile B ────┘        │                                            │\n│                                ▼                                            │\n│                       SubscriptionService (Local CLI or OAuth)              │\n│                       ├── ChatGPT Sign-In (OpenAI Responses API)            │\n│                       ├── Codex CLI (@openai/codex)                         │\n│                       ├── Claude Code CLI (claude auth login)               │\n│                       └── Google Gemini (Antigravity CLI: agy)              │\n└─────────────────────────────────────────────────────────────────────────────┘</code>',
    docs_obsidianPlugin_030: '模式1：连接API模式（默认）',
    docs_obsidianPlugin_031:
      '在此模式下，您可以直接在<strong>Chrome扩展选项</strong>中配置AI提供商和API密钥。 Obsidian 协调知识工作流程，而 Chrome 充当安全的本地 AI 运行器。',
    docs_obsidianPlugin_032:
      '<strong>支持的云提供商</strong>：Anthropic（Claude 3.5 Sonnet、Claude 3.7 Sonnet）、OpenAI（GPT-4o、o 系列）、Google Gemini（2.0 Flash、2.5 Pro）、DeepSeek（V3、R1）、 Kimi、Qwen、Zhipu 和OpenRouter。',
    docs_obsidianPlugin_033:
      '<strong>本地LLM（Ollama、LM Studio、llama.cpp、vLLM）</strong>：直接在Chrome中配置本地端点。 NutEgg 连接到您的本地模型，而不将数据发送到您的机器之外。',
    docs_obsidianPlugin_034:
      '<strong>独立Chrome配置文件</strong>：如果您使用多个Chrome配置文件（例如工作和个人），每个配置文件可以使用自己的提供商、模型和 API 密钥。它们连接到同一个 Obsidian 金库，不会发生密钥冲突。',
    docs_obsidianPlugin_035:
      '<strong>Obsidian-本机操作</strong>：仅限 Vault 的维护任务（例如手动 egg 合并到 Obsidian）使用安全存储在 Obsidian 的 <code>SecretStorage</code> 中的本机设置。在连接的 Chrome 配置文件中单击<strong>保存并继续</strong>，可以安全地更新 SecretStorage 中的本机帐户。',
    docs_obsidianPlugin_036: '模式2：共享订阅模式&amp;ChatGPT登录',
    docs_obsidianPlugin_037:
      '不想管理 API 密钥或按令牌付费积分？ NutEgg 支持直接登录和在 Obsidian 内管理的本地开发人员 CLI 订阅：',
    docs_obsidianPlugin_038: '选项 A：直接 ChatGPT 登录（无需 CLI）',
    docs_obsidianPlugin_039: '在Obsidian中，打开<strong>设置→NutEgg</strong>。',
    docs_obsidianPlugin_040: '在<strong>AI连接</strong>下，选择<strong>ChatGPT登录</strong>。',
    docs_obsidianPlugin_041: '单击<strong>继续ChatGPT</strong>，完成浏览器授权流程，并允许计划使用。',
    docs_obsidianPlugin_042: '选择您的帐户模型（例如<code>gpt-4o</code>）。',
    docs_obsidianPlugin_043:
      '所有连接的 Chrome 配置文件立即遵循此连接，且 API 密钥设置为零。凭证安全地存储在每个安装的操作系统钥匙串存储中，并且永远不会发送到 Chrome 或存储在保管库文件中。',
    docs_obsidianPlugin_044: '选项 B：本地 CLI 订阅（Codex、Claude、Gemini）',
    docs_obsidianPlugin_045: 'NutEgg 可以运行您机器上已安装并登录的官方开发人员 CLI 工具：',
    docs_obsidianPlugin_046: '提供者',
    docs_obsidianPlugin_047: '命令行安装',
    docs_obsidianPlugin_048: '认证',
    docs_obsidianPlugin_049: '模型发现',
    docs_obsidianPlugin_050: '<strong>Codex CLI</strong>',
    docs_obsidianPlugin_051: '<code>npm install -g @openai/codex</code>',
    docs_obsidianPlugin_052: '<code>codex login</code>',
    docs_obsidianPlugin_053: '通过应用程序服务器自动',
    docs_obsidianPlugin_054: '<strong>人为Claude</strong>',
    docs_obsidianPlugin_055:
      '<a href="https://code.claude.com/docs/en/quickstart" target="_blank" rel="noopener">Claude代码</a>',
    docs_obsidianPlugin_056: '<code>claude auth login --claudeai</code>',
    docs_obsidianPlugin_057: 'Sonnet、Opus、Haiku 或自定义 ID',
    docs_obsidianPlugin_058: '<strong>谷歌Gemini</strong>',
    docs_obsidianPlugin_059:
      '<a href="https://antigravity.google/docs/cli/install" target="_blank" rel="noopener">反重力 CLI</a>',
    docs_obsidianPlugin_060: '<code>agy</code> 浏览器流程',
    docs_obsidianPlugin_061: '自动通过<code>agy models</code>',
    docs_obsidianPlugin_062:
      '在Obsidian设置→NutEgg中，只需在<strong>AI连接</strong>下选择您的CLI。 NutEgg的内部<code>SubscriptionService</code>在本地有界串行队列中运行推理。不需要单独的桥接服务器或端口 27124。',
    docs_obsidianPlugin_063: '本地同步服务器和安全性',
    docs_obsidianPlugin_064:
      '启用插件后，它会自动在 <code>127.0.0.1:27123</code> 上启动后台 HTTP 和 WebSocket 侦听器。',
    docs_obsidianPlugin_065: '🔒 隐私和来源安全',
    docs_obsidianPlugin_066:
      '本地服务器严格绑定到本地主机环回地址（<code>127.0.0.1</code>）。它强制执行严格的 <code>X-NutEgg-Extension-Origin</code> 和令牌验证，防止普通网页访问您的保管库。 WebSocket 连接在其第一帧上进行身份验证。',
    docs_obsidianPlugin_067: '工作流程和提示定制',
    docs_obsidianPlugin_068:
      'NutEgg 通过直接存储在 <code>nutegg/_workflow/</code> 下的保管库中的模块化、可编辑的 Markdown 提示来支持 AI 分析：',
    docs_obsidianPlugin_069: '<strong>可编辑模板</strong>：自定义内容分析、egg比较、路由和跟进的提示。',
    docs_obsidianPlugin_070:
      '<strong>无损更新</strong>：当NutEgg发布更新的提示模板时，您的自定义工作流程将自动保留，不会被覆盖。',
    docs_workflow_001: 'AI 工作流与提示词引擎 — NutEgg',
    docs_workflow_002: 'Chrome 网上商店 ↗',
    docs_workflow_003: 'Obsidian 插件 ↗',
    docs_workflow_004: '发布',
    docs_workflow_005: '隐私政策',
    docs_workflow_006: 'AI 工作流与提示词引擎',
    docs_workflow_007:
      '了解NutEgg的模块化工作流引擎如何协调内容提取、基于摘要的egg路由、指令驱动的分析和用户可自定义的提示。',
    docs_workflow_008: '两阶段架构',
    docs_workflow_009:
      'NutEgg不是运行单个整体提示符，而是使用<strong>两阶段架构</strong>，专为令牌效率、高提取精度和完全用户控制而设计：',
    docs_workflow_010:
      '<code>                    ┌───────────────────────────────┐\n                    │      Captured Web Content     │\n                    │   (Article / YouTube / Tweet) │\n                    └───────────────┬───────────────┘\n                                    │\n                                    ▼\n       ===========================================================\n       STAGE 1: Content & Discussion Analysis + Egg Routing\n       ===========================================================\n            │                                             │\n            ├─► Content Analysis                          ├─► Discussion Analysis\n            │   (Is content >30k chars?)                  │   (When 💬 Discussion enabled\n            │    ├── No  ──► [content-analysis.md]        │    & comments captured)\n            │    └── Yes ──► Chunks + [aggregate-         │    ├── [discussion-analysis.md]\n            │                content.md]                  │    └── [aggregate-discussion.md]\n            │                                             │\n            └──────────────────────┬──────────────────────┘\n                                   │\n                                   ▼\n        Produces: Title Verdict, 3-Bullet Summary, Mind Map,\n        Timestamped Q&A, and Discussion Topics/Stances\n                                   │\n                                   ▼\n                          [egg-routing.md]\n          (Routes matched eggs from _index.md using the\n           concise Stage 1 summary instead of raw content)\n                                    │\n                                    ▼\n       ===========================================================\n       INTERACTIVE CHOICE / EXECUTION MODE (Chrome Extension)\n       ===========================================================\n                                    │\n                        Which mode is selected?\n                                    │\n            ┌───────────────────────┼───────────────────────┐\n            ▼                       ▼                       ▼\n     [Standalone Mode]         [🌞 Full Mode]      [🌛 Preview Summary]\n     Obsidian is offline.      Auto-proceeds to    User reviews matched eggs:\n     Runs Stage 1 in Chrome    Stage 2 with all    ├── "Collect Nut Only"\n     with user\'s API key.      matched eggs.       └── Add/remove eggs ──► Proceed\n     (Fast reading & Q&A)           │                       │\n            │                       └───────────┬───────────┘\n            ▼                                   ▼\n    Results in Side Panel      ===========================================================\n    (No Stage 2 analysis)    STAGE 2: Per-Egg Instruction-Driven Analysis\n                               ===========================================================\n                                                │\n                                   For each confirmed egg (1 or N):\n                                                │\n                                                ▼\n                                        [egg-analysis.md]\n                                  (Extract candidate knowledge entries\n                                   & key questions scoped to this egg)\n                                                │\n                                                ▼\n                                  (Answers + extracted entries + reading action)\n                                                │\n                                                ▼\n                                     Results returned to Popup\n                                     (Ready to Save Nut & Eggs)</code>',
    docs_workflow_011: '💡 为什么要基于摘要的路由？',
    docs_workflow_012:
      '使用第 1 阶段摘要而不是完整的原始文章或多小时视频转录来路由 eggs 每次运行可节省数万个令牌，并通过专注于精炼的高信号语义主题来提高路由准确性。',
    docs_workflow_013:
      '侧面板的交叉表指示器在当前Chrome窗口中显示正在运行的分析和未读的已完成结果。单击它可列出选项卡并直接切换到其结果或进度。当分析在活动选项卡中可见时，结果将被读取。当面板保持打开状态时，跟踪会持续进行；当面板关闭时，跟踪会重置。',
    docs_workflow_014:
      'Hatch 将原始分析存档并将批准的条目附加到<code># Unprocessed</code>。合并以 20 个待处理条目或按需运行来组装片段并删除重复声明，同时保留来源、警告、示例和分歧。第 2 阶段永远不会收到知识树，因此建议评估相关性和实质内容，而不是新颖性。',
    docs_workflow_015:
      '<strong>🍃知识</strong>部分选项和Egg分析下拉菜单共享当前浏览器选项卡的一个设置：<strong>🥚仅分析</strong>关闭知识，<strong>🍃包括知识</strong>将其打开。切换下拉选项会更新设置和按钮标签，而不会自动触发 AI 调用 - 单击按钮进行分析。当切换到之前分析的没有知识条目的 egg 包含知识时，NutEgg 重新运行第 2 阶段，而不是简单地显示缓存的仅答案结果。包含知识是初始默认值；您的最后选择将成为不进行分析的选项卡的默认选择。关闭该选项不会隐藏以前生成的条目或阻止保存它们。关闭 Knowledge 会禁用每个选定的 egg 的条目。打开它仅允许 eggs 的条目允许：<code>Generate Knowledge Entries: no</code> 或在egg 的操作指南中选择退出优先。无论哪种方式，关键答案和阅读建议仍然可用。分析不保存条目； <strong>🐣 Hatch Egg</strong> 将生成的条目保存到 egg 文件中。',
    docs_workflow_016: '工作流程模式',
    docs_workflow_017: '模式',
    docs_workflow_018: '行为',
    docs_workflow_019: '最适合用于',
    docs_workflow_020: '<strong>📱 独立模式</strong>',
    docs_workflow_021:
      '直接在Chrome中运行第1阶段内容分析（当Obsidian离线或关闭时）。生成结论、三句话摘要、带有可点击时间戳的思维导图以及带有时间戳跳跃的交互式视频问答。跳过第 2 阶段 egg 分析。',
    docs_workflow_022: '快速网络和视频阅读、快速理解，或者当您不需要笔记存档时。',
    docs_workflow_023: '<strong>🌞完整模式</strong>',
    docs_workflow_024:
      '运行第 1 阶段内容分析，通过 <code>_index.md</code> 自动路由 eggs，并立即不间断地执行第 2 阶段 egg 分析。',
    docs_workflow_025: '当您信任自动 egg 匹配时，日常阅读和快速捕获。',
    docs_workflow_026: '<strong>🌛预览总结</strong>',
    docs_workflow_027:
      '运行第一阶段内容分析，然后在弹出窗口中暂停。在您的保管库的完整 egg 列表旁边显示匹配的 eggs。您可以添加/删除eggs，进行知识比较，或点击<strong>收集Nut仅</strong>。',
    docs_workflow_028: '深入的研究、模棱两可的主题，或者当你只想快速总结而不更新egg知识树时。',
    docs_workflow_029: 'AI执行和凭证协议',
    docs_workflow_030:
      '无论您选择完整模式还是预览摘要，NutEgg都会将<em>工作流程编排</em>与<em>凭证存储和AI推理</em>分开：',
    docs_workflow_031:
      '<strong>连接API模式（默认）</strong>：Obsidian协调提示模板注入和知识比较，但通过经过身份验证的WebSocket（<code>/execution/socket</code>）向Chrome发送推理请求。 Chrome 使用其本地 API 密钥运行 LLM 调用，并将经过身份验证的结果发回。 <strong>您的API密钥永远不会离开Chrome。</strong>',
    docs_workflow_032:
      '<strong>共享订阅模式</strong>：Obsidian协调工作流程，使用官方开发者CLI工具（<code>codex</code>、<code>claude</code>、<code>agy</code>）或直接ChatGPT OAuth登录在本地直接执行AI调用。所有连接的 Chrome 配置文件共享此订阅，无需 API 密钥。',
    docs_workflow_033: 'Vault 中的工作流程文件',
    docs_workflow_034: 'NutEgg 将其提示模板播种到保管库内的 <code>nutegg/_workflow/</code> 中：',
    docs_workflow_035: '1.共享片段（注入到其他提示中）',
    docs_workflow_036:
      '<code>shared-output-rules.md</code>：接地指令（源内容为唯一真理）和多语言输出语言参考规则。注入为<code>{{shared_output_rules}}</code>。',
    docs_workflow_037:
      '<code>content-task-default.md</code>：标题判决、三项摘要和带有可点击时间戳的思维导图的核心任务说明。注入为<code>{{content_task_default}}</code>。',
    docs_workflow_038: '2. 内容捕获和比较流程',
    docs_workflow_039:
      '<code>content-analysis.md</code>：第一阶段内容摘要、反点击诱饵判决、带有可点击时间戳的交互式思维导图以及带有时间戳引用的自定义问题答案。',
    docs_workflow_040:
      '<code>egg-routing.md</code>：将第 1 阶段摘要与 <code>_index.md</code> 中的egg 描述相匹配，以选择候选eggs。',
    docs_workflow_041:
      '<code>egg-analysis.md</code>：第 2 阶段，根据egg提取候选知识条目和关键问题答案，范围为egg的指令。',
    docs_workflow_042:
      '值得一读如果和跳过如果引导全文阅读，重点突出，总结充分，跳过或不确定。无论建议如何，有用的答案仍然可以保存。',
    docs_workflow_043:
      '<code>aggregate-content.md</code> &amp; <code>aggregate-egg.md</code>：长内容（&gt;30k 字符）聚合。第二阶段仅结合答卷草稿、推荐说明和覆盖范围；提取的条目保留在源顺序中，直到合并。',
    docs_workflow_044: '3.讨论分析（第一阶段）',
    docs_workflow_045:
      '当扩展选项或弹出分析部分中启用了 <strong>💬 讨论</strong> 部分时，讨论分析将作为<strong>阶段 1</strong> 内容分析的一部分执行，并且页面提取器捕获读者评论或社交回复（例如 YouTube 评论、Twitter 回复、Reddit/论坛主题、Bilibili 评论、或知乎答案）。',
    docs_workflow_046:
      '<code>discussion-analysis.md</code>：批量分析评论，提取3-5个核心辩论话题，对评论者立场进行分类（<code>agree</code>、<code>disagree</code>、<code>mixed</code>、<code>neutral</code>、<code>unclear</code>），并突出有价值的第一手经验补充或修正（<code>supplement: true</code>）。',
    docs_workflow_047:
      '<code>aggregate-discussion.md</code>：合并和综合大型论坛或视频评论部分的多批评论线程中的主题和立场分布。',
    docs_workflow_048:
      '<strong>上下文流：</strong> 分析后的讨论摘要和证据项目将在第一阶段结果中返回，并直接输入到自定义问答或论坛正文分析中（对于以讨论为中心的页面或没有文字记录的视频至关重要）。它们还作为上下文信号转发到第 2 阶段<code>egg-analysis.md</code>，因此eggs可以评估社区反馈以及源内容。',
    docs_workflow_049: '4. 交互和维护工作流程',
    docs_workflow_050:
      '<code>follow-up.md</code>：侧面板中的交互式自然语言问答，具有先前的对话历史记录和可点击的视频时间戳跳跃。',
    docs_workflow_051:
      '<code>merge-unprocessed.md</code>：在 20 多个待处理条目处手动或自动触发，以组织原始项目并将其嵌套到 <code># Knowledge</code> 中。',
    docs_workflow_052: '<code>localize-egg.md</code>：将新的egg模板翻译成外语，同时保留英语结构标题。',
    docs_workflow_053: '安全定制指南',
    docs_workflow_054: '⚠️要保存什么',
    docs_workflow_055: '您可以自由定制提示语气、视角和深度。但是，您<strong>必须保留</strong>：',
    docs_workflow_056:
      '所有 <code>{{placeholder}}</code> 标签（例如 <code>{{content}}</code>、<code>{{knowledge_tree}}</code>、<code>{{title}}</code>）。',
    docs_workflow_057:
      '精确的 JSON 输出键（例如 <code>titleVerdict</code>、<code>extractedEntries</code>、<code>mindMap</code>），以便解析器可以反序列化响应。',
    docs_workflow_058: 'Markdown 输出中的结构标题（<code># Knowledge</code>、<code># Unprocessed</code>）。',
    docs_workflow_059: '无冲突更新和重置',
    docs_workflow_060: '当NutEgg更新到新版本时：',
    docs_workflow_061: '<strong>未编辑提示</strong>：自动更新到最新的内置版本。',
    docs_workflow_062:
      '<strong>自定义提示</strong>：您的编辑永远不会被覆盖。 NutEgg 将 <code>[filename].new.md</code> 写入您的文件旁边，以便您可以按照自己的进度查看新添加的内容。',
    docs_workflow_063:
      '<strong>恢复出厂设置（“使用默认值”）</strong>：需要重新开始？在<strong>Obsidian设置→NutEgg</strong>中，单击<strong>使用默认值</strong>。所有现有提示均安全备份至<code>nutegg/_workflow/_backup/&lt;timestamp&gt;/</code>，并恢复原始出厂默认设置。',
  },
  es: {
    docs_chromeExtension_001: 'Guía de la extensión de Chrome — NutEgg',
    docs_chromeExtension_002: 'Chrome Tienda web ↗',
    docs_chromeExtension_003: 'Obsidian Complemento ↗',
    docs_chromeExtension_004: '🎬 Vídeo promocional ↗',
    docs_chromeExtension_005: 'Lanzamientos de extensión',
    docs_chromeExtension_006: 'Política de privacidad',
    docs_chromeExtension_007: 'Instalación y uso de la extensión de Chrome',
    docs_chromeExtension_008:
      'La extensión NutEgg Chrome se encuentra en el panel lateral de su navegador y proporciona extracción de contenido bajo demanda, YouTube mapas mentales con marcas de tiempo en las que se puede hacer clic y captura con un solo clic en Obsidian.',
    docs_chromeExtension_009: 'Instalación',
    docs_chromeExtension_010: 'Opción 1: Chrome Tienda web (recomendada)',
    docs_chromeExtension_011:
      'Instale NutEgg con un clic directamente desde la tienda web oficial <a\n            href="https://chromewebstore.google.com/detail/nutegg/bmdmdiicembobejibggoeiahaonphcol"\n            target="_blank"\n            rel="noopener"\n            >Chrome</a\n          >:',
    docs_chromeExtension_012:
      'Visite la <a\n              href="https://chromewebstore.google.com/detail/nutegg/bmdmdiicembobejibggoeiahaonphcol"\n              target="_blank"\n              rel="noopener"\n              >NutEgg Chrome página de la tienda web</a\n            >.',
    docs_chromeExtension_013: 'Haga clic en <strong>Agregar a Chrome</strong>.',
    docs_chromeExtension_014:
      'Haga clic en el ícono de la pieza del rompecabezas en la barra de herramientas de Chrome y fije <strong>NutEgg</strong> para acceder cómodamente al panel lateral.',
    docs_chromeExtension_015: 'Opción 2: Desde GitHub Lanzamiento (.zip)',
    docs_chromeExtension_016:
      'Descargue la última <code>nutegg-chrome-extension-*.zip</code> desde la <a\n              href="https://github.com/staff-000/nutegg-chrome-extension-release/releases"\n              target="_blank"\n              rel="noopener"\n              >página de lanzamientos</a\n            >.',
    docs_chromeExtension_017: 'Descomprima el archivo en una carpeta local en su computadora.',
    docs_chromeExtension_018: 'Abra Google Chrome y vaya a <code>chrome://extensions</code>.',
    docs_chromeExtension_019: 'Active <strong>Modo de desarrollador</strong> en la esquina superior derecha.',
    docs_chromeExtension_020:
      'Haga clic en <strong>Cargar descomprimido</strong> y seleccione el directorio descomprimido que contiene <code>manifest.json</code>.',
    docs_chromeExtension_021:
      'Haga clic en el ícono del rompecabezas en la barra de herramientas Chrome y fije <strong>NutEgg</strong> para acceder fácilmente.',
    docs_chromeExtension_022: 'Flujo de trabajo del panel lateral',
    docs_chromeExtension_023: 'Al hacer clic en el icono de extensión NutEgg se abre el panel lateral de Chrome:',
    docs_chromeExtension_024:
      '<strong>Extracción automática</strong>: mientras navega, NutEgg detecta la pestaña activa (YouTube vídeo, hilo de Twitter/X o publicación de blog) y extrae su texto y estructura.',
    docs_chromeExtension_025:
      '<strong>Actualización de contenido (🔄)</strong>: haga clic en el botón Actualizar en la vista previa del contenido para volver a extraer la página en aplicaciones dinámicas de una sola página sin redirigir inesperadamente fuera de la vista previa.',
    docs_chromeExtension_026:
      '<strong>Destino Egg Selector</strong>: en la vista previa del contenido, elija el conocimiento de destino eggs o use "Destino eggs (selección automática de forma predeterminada)" para permitir que la IA haga coincidir los árboles de bóveda relevantes automáticamente.',
    docs_chromeExtension_027:
      '<strong>Modos de análisis</strong>: <ul> <li> <strong>Modo completo</strong>: Evalúa el contenido y ejecuta inmediatamente la comparación de conocimientos con la comparación eggs en un único flujo de trabajo optimizado. </li> <li> <strong>Modo de vista previa</strong>: genera primero la descripción general de la etapa 1 (resumen, mapa mental, preguntas y respuestas, discusión), lo que le permite inspeccionar o ajustar el objetivo eggs antes de ejecutar egg análisis de conocimiento a pedido. </li> </ul>',
    docs_chromeExtension_028:
      '<strong>Indicador de estado</strong>: un punto verde indica una conexión saludable a su servidor Obsidian local (<code>127.0.0.1:27123</code>). Si está en rojo, asegúrese de que Obsidian se esté ejecutando con el complemento NutEgg habilitado.',
    docs_chromeExtension_029: 'YouTube Integración y navegación inteligente',
    docs_chromeExtension_030: 'En YouTube páginas de vídeos, NutEgg extrae:',
    docs_chromeExtension_031:
      '<strong>Subtítulos y transcripciones completos</strong>: extracción automática de alta precisión del creador y transcripciones generadas automáticamente.',
    docs_chromeExtension_032:
      '<strong>Mapa mental con marcas de tiempo en las que se puede hacer clic</strong>: desglose instantáneo con botones de marca de tiempo en los que se puede hacer clic que buscan su reproductor de video activo YouTube directamente en ese segmento. Cuando hay marcas de tiempo presentes, las etiquetas de origen redundantes se ocultan para mantener limpio el árbol.',
    docs_chromeExtension_033:
      '<strong>Preguntas y respuestas con salto de marca de tiempo</strong>: haga cualquier pregunta sobre el video en lenguaje natural; NutEgg proporciona respuestas citadas con píldoras de marca de tiempo en las que se puede hacer clic y que saltan directamente al momento de origen en la reproducción del video.',
    docs_chromeExtension_034:
      '<strong>Veredicto anti-Clickbait</strong>: una respuesta objetiva de 1 oración a la premisa del título del video, lo que le permite omitir tonterías de inmediato.',
    docs_chromeExtension_035: 'Navegación de fuente de texto en la página',
    docs_chromeExtension_036: 'Al leer artículos, blogs o foros:',
    docs_chromeExtension_037:
      '<strong>📍 Ir a la fuente</strong>: los nodos del mapa mental de texto y las citas de preguntas y respuestas incluyen etiquetas de fuente. Al hacer clic en una etiqueta de origen, la página web en vivo se desplaza automáticamente hasta el párrafo o cita que coincide exactamente y lo resalta brevemente con un esquema.',
    docs_chromeExtension_038:
      '<strong>Navegación de comentarios</strong>: en las páginas de discusión (Reddit, Zhihu, etc.), al hacer clic en las citas de las fuentes se desplaza directamente al comentario o respuesta específica.',
    docs_chromeExtension_039: 'Análisis de discusión y perspectivas comunitarias',
    docs_chromeExtension_040: 'NutEgg analiza los comentarios públicos en YouTube, Reddit, Twitter/X, Zhihu y foros:',
    docs_chromeExtension_041:
      '<strong>Desglose de temas y posturas</strong>: Resume los puntos centrales del debate con insignias de postura (de acuerdo 👍, en desacuerdo 👎, mixta 🤔, neutral ⚖️) y métricas de reacción.',
    docs_chromeExtension_042:
      '<strong>Información adicional</strong>: los comentarios de alto valor que contienen evidencia, advertencias o experiencias únicas se conservan como información adicional concisa.',
    docs_chromeExtension_043: 'Chrome: solo modo independiente (no se requiere Obsidian)',
    docs_chromeExtension_044:
      '¿No tienes Obsidian instalado o abierto actualmente? ¡NutEgg funciona de forma completamente independiente dentro de Google Chrome!',
    docs_chromeExtension_045: '⚡ Lectura web rápida sin notas generales',
    docs_chromeExtension_046:
      'NutEgg está diseñado ante todo como un compañero de lectura web ultrarrápido. Puede extraer, resumir, generar mapas mentales y hacer preguntas sobre cualquier artículo o YouTube video directamente en Chrome sin siquiera tocar una bóveda de notas.',
    docs_chromeExtension_047: 'Funciones disponibles en Chrome Independiente:',
    docs_chromeExtension_048:
      '<strong>🎯 Veredicto instantáneo anti-Clickbait</strong>: una respuesta objetiva de 1 oración a la pregunta del titular.',
    docs_chromeExtension_049:
      '<strong>📝 Resumen ejecutivo de tres oraciones</strong>: conclusiones de alta densidad extraídas de cualquier artículo o vídeo extenso.',
    docs_chromeExtension_050:
      '<strong>⏱️ Mapa mental con marcas de tiempo en las que se puede hacer clic y búsqueda</strong>: salte a segmentos de video clave con un solo clic.',
    docs_chromeExtension_051:
      '<strong>💬 Preguntas y respuestas sobre videos y salto de marca de tiempo</strong>: haga preguntas y haga clic en las píldoras de marca de tiempo citadas para desplazar la reproducción del video directamente a ese segmento.',
    docs_chromeExtension_052:
      '<strong>🧠Mapas mentales plegables</strong>: árboles de pensamiento interactivos de varios niveles que desglosan visualmente las ideas centrales.',
    docs_chromeExtension_053:
      '<strong>🌐 Compatibilidad con más de 50 idiomas</strong>: extraiga y traduzca contenido en idiomas extranjeros sobre la marcha.',
    docs_chromeExtension_054: 'Cómo configurar el modo Chrome-Solo:',
    docs_chromeExtension_055:
      'Haga clic derecho en el icono de extensión <strong>NutEgg</strong> en la barra de herramientas de Chrome y seleccione <strong>Opciones</strong>.',
    docs_chromeExtension_056:
      'Seleccione su proveedor de IA preferido (por ejemplo, Google Gemini, OpenAI, Claude, DeepSeek o OpenRouter) e ingrese su clave API.',
    docs_chromeExtension_057: 'Haga clic en <strong>Guardar</strong>. ¡Estás listo para analizar cualquier página!',
    docs_chromeExtension_058: 'Obsidian Modos de conexión y ejecución de IA',
    docs_chromeExtension_059:
      'Cuando conecta la extensión Chrome al complemento opcional NutEgg Obsidian, Chrome se adapta perfectamente según el modo de ejecución seleccionado:',
    docs_chromeExtension_060: '🔒 Seguridad de clave API: las claves nunca salen Chrome',
    docs_chromeExtension_061:
      'En el <strong>Modo API conectado</strong>, sus claves API permanecen estrictamente dentro del almacenamiento de extensión seguro de Chrome. Obsidian gestiona las plantillas de conocimiento y la indexación de la bóveda, pero delega la inferencia de IA a Chrome a través de un WebSocket local autenticado. Chrome hace que la API del proveedor llame localmente y devuelve solo el texto generado.',
    docs_chromeExtension_062: 'Modo de ejecución',
    docs_chromeExtension_063: 'Donde corre la IA',
    docs_chromeExtension_064: 'Credenciales utilizadas',
    docs_chromeExtension_065: '<strong>Chrome-Solo</strong>',
    docs_chromeExtension_066: 'Directamente dentro Chrome',
    docs_chromeExtension_067: 'Clave API configurada en Chrome Opciones',
    docs_chromeExtension_068: '<strong>Modo API conectado</strong>',
    docs_chromeExtension_069: 'Chrome (delegado a través de WebSocket local por Obsidian)',
    docs_chromeExtension_070: 'Clave API en Chrome (las claves nunca se envían a Obsidian)',
    docs_chromeExtension_071: '<strong>Modo de suscripción compartida</strong>',
    docs_chromeExtension_072: 'Dentro de Obsidian (a través de CLI local o ChatGPT OAuth)',
    docs_chromeExtension_073: 'Claves API cero (usa Codex, Claude Code, Antigravity o ChatGPT)',
    docs_chromeExtension_074: 'Soporte multiperfil Chrome',
    docs_chromeExtension_075:
      'NutEgg admite múltiples perfiles de navegador Chrome (por ejemplo, Personal y Trabajo) que se conectan simultáneamente a la misma bóveda Obsidian. Cada perfil Chrome conserva su propio proveedor, modelo y clave API de forma independiente. Conectar o cambiar modos de ejecución nunca filtra ni sobrescribe claves API entre perfiles.',
    docs_chromeExtension_076: 'Recuperación sin conexión y desconectada',
    docs_chromeExtension_077:
      'Si Obsidian está cerrado mientras el modo conectado está habilitado, NutEgg muestra una luz de estado clara y le ofrece la opción <strong>"Usar el modo Chrome en su lugar"</strong> con un solo clic. Esto le permite continuar leyendo y haciendo preguntas inmediatamente usando su configuración de API Chrome sin interrupción ni riesgo de cuota.',
    docs_chromeExtension_078: 'Configuración y sincronización en vivo',
    docs_chromeExtension_079:
      'NutEgg incluye sincronización en tiempo real entre las Opciones de extensión y los paneles laterales activos:',
    docs_chromeExtension_080:
      '<strong>Controles de la sección de contenido</strong>: personalice qué secciones se extraen y analizan de forma predeterminada (Contenido, Resumen, Mapa mental, Preguntas y respuestas, Entradas de conocimiento y Discusión) en la página Opciones.',
    docs_chromeExtension_081:
      '<strong>Sincronización de configuración en vivo</strong>: cambiar los modelos de análisis, las secciones de salida habilitadas o la configuración del servidor actualiza inmediatamente todos los paneles laterales abiertos sin necesidad de actualizar la página.',
    docs_chromeExtension_082:
      '<strong>Puerto del servidor personalizado</strong>: si el puerto predeterminado <code>27123</code> entra en conflicto con otro servicio, abra la extensión <strong>Opciones</strong>, ajuste el puerto (por ejemplo, <code>28123</code>) y pruebe la conexión.',
    docs_index_001: 'Descripción general de la documentación — NutEgg',
    docs_index_002: 'Chrome Tienda web ↗',
    docs_index_003: 'Obsidian Complemento ↗',
    docs_index_004: '🎬 Vídeo promocional ↗',
    docs_index_005: 'GitHub Lanzamientos',
    docs_index_006: 'Política de privacidad',
    docs_index_007: 'Rastreador de problemas',
    docs_index_008: 'Descripción general y conceptos básicos',
    docs_index_009:
      'NutEgg es una extensión Chrome gratuita y de código abierto que te ayuda a decidir qué vale la pena leer y a comprenderlo más rápido. Vive en el panel lateral de Chrome y funciona en artículos, hilos y videos de YouTube. Un complemento Obsidian opcional convierte lo que lees en una bóveda de conocimientos en crecimiento.',
    docs_index_010: 'Lo que obtienes en Chrome',
    docs_index_011:
      'Instale la extensión, ingrese su clave AI API (o apúntela a un modelo local) en Opciones y NutEgg funciona de inmediato: sin cuenta, sin aplicaciones adicionales:',
    docs_index_012: '🎯 Veredicto de título instantáneo anti-Clickbait',
    docs_index_013: '📝 Resumen ejecutivo de tres oraciones y conclusiones principales',
    docs_index_014:
      '🧠 Mapas mentales jerárquicos plegables, con marcas de tiempo en las que se puede hacer clic para YouTube',
    docs_index_015:
      '💬 Preguntas y respuestas en lenguaje natural con píldoras de marca de tiempo citadas y enlaces a fuentes en la página',
    docs_index_016:
      '🔍 Preguntas de doble alcance: estrictamente dentro de la página o más allá para verificación de datos',
    docs_index_017: '🗣️ Resúmenes de la sección de comentarios para YouTube, Reddit y foros',
    docs_index_018: '🌐 Extracción y traducción de múltiples fuentes en más de 50 idiomas',
    docs_index_019: '💡 Por qué existe NutEgg',
    docs_index_020:
      'Gran parte de la web está repleta de vídeos, titulares con cebo de clics y artículos inflados con IA. NutEgg responde al título por adelantado y te dice honestamente si el contenido vale la pena, para que solo prestes atención a lo que vale la pena.',
    docs_index_021: 'Opcional: Agregar Obsidian',
    docs_index_022:
      'Si guarda notas en Obsidian, instale el complemento complementario para conectar la extensión a su bóveda (<code>127.0.0.1:27123</code>). Esto agrega una evaluación de novedades de 2 etapas contra los árboles de conocimiento <code>_index.md</code> de su bóveda, síntesis delta y archivo automático de notas en archivos <code>nutegg/_raw/</code> y egg. Todo en Chrome sigue funcionando con o sin él.',
    docs_index_023: 'La metáfora',
    docs_index_024:
      'Con Obsidian conectado, NutEgg estructura su flujo de información utilizando una metáfora simple de tres partes:',
    docs_index_025:
      '<strong>🌰 El Nut (captura sin formato)</strong>: la página web sin formato, el hilo de tweets o la transcripción YouTube extraída del navegador. Nuts se archivan intactos con metadatos completos en <code>nutegg/_raw/</code> en su bóveda.',
    docs_index_026:
      '<strong>🥚 El Egg (árbol de conocimiento)</strong>: una nota Markdown estructurada y viva en su bóveda que representa un dominio de conocimiento (por ejemplo, <code>ai_architecture.md</code>, <code>invest_strategy.md</code>).',
    docs_index_027:
      '<strong>🐣 The Hatch (Síntesis y Delta)</strong>: cuando se analiza el contenido, la IA lo compara con su eggs, identifica lo que es novedoso en comparación con lo que ya está documentado y entrelaza nuevos conocimientos en su egg.',
    docs_index_028: 'Arquitectura del sistema',
    docs_index_029: 'NutEgg tiene un componente principal y un complemento opcional:',
    docs_index_030:
      '<strong>Chrome Extensión</strong>: Vive en el panel lateral de Chrome. Extrae texto, comentarios y transcripciones de vídeo. En modo independiente o en modo API conectado, ejecuta llamadas AI localmente usando su proveedor configurado y su clave API, asegurando que sus claves API nunca abandonen el navegador.',
    docs_index_031:
      '<strong>Obsidian Complemento (opcional)</strong>: ejecuta un servicio de coordinación y sincronización local en <code>127.0.0.1:27123</code>. Lee el <code>_index.md</code> de su bóveda, administra las plantillas de mensajes en <code>_workflow/</code> y archiva el conocimiento capturado en el disco. Admite: <ul> <li> <strong>Modo API conectado (predeterminado)</strong>: coordina la coincidencia de conocimientos y delega la inferencia de IA a Chrome a través de un WebSocket local autenticado (las claves nunca se envían a Obsidian). </li> <li> <strong>Modo de suscripción compartida</strong>: ejecuta la inferencia localmente a través del inicio de sesión ChatGPT (OAuth) o herramientas CLI de desarrollador (Codex, Claude Código, Antigravity) sin necesidad de claves API. </li> </ul>',
    docs_index_032:
      '<code>Chrome Extension (Side Panel)\n │\n ├── [Standalone Mode] Local AI Processing (Verdicts, Summaries, Mind Maps, Q&amp;A)\n │\n └── [Connected Mode] HTTP + WebSocket (127.0.0.1:27123/execution/socket)\n         │\n         ▼\n Obsidian Plugin (Local Server &amp; Coordinator)\n         ├── Evaluates against vault/nutegg/_index.md &amp; prompts in _workflow/\n         ├── In API Mode: Delegates AI calls back to Chrome over WebSocket (keys stay in Chrome)\n         ├── In Subscription Mode: Executes locally via CLI (Codex/Claude/agy) or ChatGPT OAuth\n         └── Writes structured notes to vault/nutegg/_raw/ and &lt;egg&gt;.md</code>',
    docs_index_033: 'Hoja de ruta de inicio rápido',
    docs_index_034:
      'Mire el <a href="https://www.youtube.com/watch?v=_u6mDoHZSAo" target="_blank" rel="noopener"\n              >🎬 NutEgg vídeo promocional</a\n            > para ver un recorrido visual de 1 minuto.',
    docs_index_035:
      'Instale la <a\n              href="https://chromewebstore.google.com/detail/nutegg/bmdmdiicembobejibggoeiahaonphcol"\n              target="_blank"\n              rel="noopener"\n              >Chrome Extensión</a\n            > desde la Chrome Web Store y agregue su clave AI en Opciones (consulte la <a href="chrome-extension.html">guía</a>).',
    docs_index_036:
      'Abra el panel lateral de cualquier artículo o YouTube video y haga clic en <strong>Analizar</strong>. ¡Eso es todo!',
    docs_index_037:
      '<em>Opcional:</em> Instale el <a href="https://community.obsidian.md/plugins/nutegg" target="_blank" rel="noopener">Obsidian Complemento</a> (consulte la <a href="obsidian-plugin.html">guía</a>) y defina sus primeros temas de conocimiento en <a href="knowledge-structuring.html">_index.md</a> para comenzar a eclosionar.',
    docs_knowledgeStructuring_001: 'Estructuración del conocimiento y Eggs — NutEgg',
    docs_knowledgeStructuring_002: 'Chrome Tienda web ↗',
    docs_knowledgeStructuring_003: 'Obsidian Complemento ↗',
    docs_knowledgeStructuring_004: 'Lanzamientos',
    docs_knowledgeStructuring_005: 'Política de privacidad',
    docs_knowledgeStructuring_006: 'Estructuración del conocimiento y Eggs',
    docs_knowledgeStructuring_007:
      'Aprenda cómo NutEgg organiza su bóveda Obsidian, relaciona el contenido web con temas usando <code>_index.md</code> y fusiona las entradas acumuladas en árboles de conocimiento.',
    docs_knowledgeStructuring_008: 'El diseño de la bóveda <code>nutegg/</code>',
    docs_knowledgeStructuring_009:
      'Todo el contenido NutEgg está confinado a una carpeta <code>nutegg/</code> limpia y aislada en su bóveda Obsidian:',
    docs_knowledgeStructuring_010:
      '<code>vault/\n└── nutegg/\n    ├── _raw/                          # Captured nuts (raw web content + metadata)\n    │   └── 2026-09-06-14-30-youtube-author-title.md\n    ├── _index.md                      # Topic routing guide\n    ├── ai_architecture.md             # Knowledge egg\n    ├── invest_strategy.md             # Knowledge egg\n    └── productivity.md                # Knowledge egg</code>',
    docs_knowledgeStructuring_011: 'La guía de rutas: <code>_index.md</code>',
    docs_knowledgeStructuring_012:
      'El archivo <code>_index.md</code> le indica a NutEgg qué notas egg mantiene y qué dominios cubren. Cada línea asigna una ruta de archivo relativa a palabras clave y descripciones:',
    docs_knowledgeStructuring_013:
      '<code>nutegg/ai_architecture.md: LLMs, multi-agent systems, prompt engineering, RAG, embeddings\nnutegg/invest_strategy.md: value investing, index funds, asset allocation, macroeconomic indicators\nnutegg/productivity.md: deep work, time blocking, habits, personal knowledge management</code>',
    docs_knowledgeStructuring_014: '⚡ Cómo funciona el enrutamiento',
    docs_knowledgeStructuring_015:
      'Cuando haces clic en <strong>Analizar</strong> en el navegador, la IA de NutEgg lee tu <code>_index.md</code> y determina cuál egg (si corresponde) coincide con el contenido. Si no hay coincidencias de egg, NutEgg ofrece crear automáticamente un nuevo egg a partir del tema de la página.',
    docs_knowledgeStructuring_016: 'Egg Anatomía del archivo y cómo funcionan las instrucciones',
    docs_knowledgeStructuring_017:
      'Un archivo <strong>Egg</strong> (almacenado en <code>nutegg/*.md</code>) cumple dos funciones cruciales: es a la vez su repositorio de conocimientos curado y en evolución para un dominio y una especificación de aviso activo que dirige el canal de inteligencia artificial de NutEgg cada vez que el contenido toca ese tema.',
    docs_knowledgeStructuring_018: '1. Plano estructural',
    docs_knowledgeStructuring_019:
      'Cada archivo egg combina metadatos YAML, un bloque de llamada Obsidian con instrucciones, un árbol de conocimiento curado y un búfer de preparación sin procesar:',
    docs_knowledgeStructuring_020:
      '<code>---\ntopic: "AI Architecture & Multi-Agent Systems"\nstatus: "active"\nlast_updated: "2026-09-10"\n---\n\n> [!abstract]- Instructions:\n> **Scope:** Multi-agent architectures, tool calling, memory layers, and LLM evaluation.\n> **Action Guide:** Focus on actionable design patterns, scalability tradeoffs, and real failure modes.\n> **Key Questions:**\n> 1. How are agent memory loops bounded to prevent context window overflow?\n> 2. What coordination mechanism is used between subagents?\n> **Worth Reading If:**\n&gt; - Practical examples and substantive explanations.\n&gt; **Skip If:**\n> - Ignore basic beginner tutorials or high-level sales pitches without technical substance.\n> - Discard speculative claims lacking empirical benchmarks or code evidence.\n> **Formatting Rules:**\n> - Prefix each insight with a bracketed tag: `[concept]`, `[architecture]`, `[method]`, `[benchmark]`, `[explain]`, `[fact]`, `[example]`.\n> - Use the structure: `- [tag] **Concept Name**` followed by an indented explanation and concrete examples (`- 🎯 Example:`).\n\n# Knowledge\n## Agent Memory\n- [architecture] **Bounded Replay Buffers**\n    - Ephemeral short-term memory expires after session goals terminate to conserve token budget.\n    - 🎯 Example: Tool calling trace logs stored in vector stores with sliding window eviction.\n\n# Unprocessed\n(Newly hatched insights land here from captures until auto-merged)</code>',
    docs_knowledgeStructuring_021: '2. Cómo escribir Egg instrucciones',
    docs_knowledgeStructuring_022:
      'La llamada <code>&gt; [!abstract]- Instructions:</code> contiene seis campos especializados. Cada uno guía una etapa específica del proceso de IA:',
    docs_knowledgeStructuring_023: 'campo',
    docs_knowledgeStructuring_024: 'Propósito y mejores prácticas',
    docs_knowledgeStructuring_025: 'Uso del flujo de trabajo',
    docs_knowledgeStructuring_026: '<code>**Scope:**</code>',
    docs_knowledgeStructuring_027:
      '1 o 2 oraciones que definan los límites temáticos de este egg. Indique explícitamente qué conceptos, tecnologías o preguntas están incluidos o excluidos.',
    docs_knowledgeStructuring_028:
      'Inyectado en <code>egg-analysis.md</code> (Etapa 2) para que la IA extraiga conocimiento estrictamente a través de esta lente de dominio.',
    docs_knowledgeStructuring_029: '<code>**Action Guide:**</code>',
    docs_knowledgeStructuring_030:
      'Instrucciones de 1 a 5 pasos sobre cómo la IA resume y evalúa el contenido (por ejemplo, solicitando perspectivas, profundidad o compensaciones específicas). Vuelve a la guía predeterminada si se omite.',
    docs_knowledgeStructuring_031: 'Inyectado en <code>egg-analysis.md</code> (Etapa 2).',
    docs_knowledgeStructuring_032: '<code>**Key Questions:**</code>',
    docs_knowledgeStructuring_033:
      'Lista numerada de preguntas recurrentes que desea responder cada vez que el contenido toque este dominio (por ejemplo, <em> "¿Cuál es el costo del token?" </em>, <em> "¿Cuáles son los modos de falla?" </em>).',
    docs_knowledgeStructuring_034:
      'Inyectado en <code>egg-analysis.md</code> (Etapa 2). Respondido en la ventana emergente de extensión Chrome y guardado en sus notas de captura sin procesar.',
    docs_knowledgeStructuring_035: '<code>**Worth Reading If:** / **Skip If:**</code>',
    docs_knowledgeStructuring_036:
      'Dos listas de preferencias que describen cuándo el original merece su tiempo y cuándo el resumen es suficiente.',
    docs_knowledgeStructuring_037:
      'Guíe la acción de lectura de la Etapa 2: completa, destacada, resumida, omitida o incierta. Nunca rechazan entradas durante la fusión.',
    docs_knowledgeStructuring_038: '<code>**Formatting Rules:**</code>',
    docs_knowledgeStructuring_039:
      'Estándares de formato: etiquetas entre corchetes (<code>[concept]</code>, <code>[architecture]</code>, <code>[method]</code>, etc.) y sangría jerárquica de viñetas.',
    docs_knowledgeStructuring_040:
      'Inyectado en <code>egg-analysis.md</code> (Etapa 2). Garantiza que las entradas de los candidatos coincidan con las convenciones de formato de sus notas.',
    docs_knowledgeStructuring_041: '3. Árbol de conocimiento curado versus cola sin procesar',
    docs_knowledgeStructuring_042:
      'NutEgg protege su base de conocimientos de la contaminación de la IA al separar el conocimiento seleccionado de las nuevas capturas:',
    docs_knowledgeStructuring_043:
      '<strong><code># Knowledge</code> (Árbol seleccionado):</strong> Estructurado con encabezados Markdown y viñetas anidadas. Solo merge lee este árbol, consolidando afirmaciones equivalentes y al mismo tiempo preservando ejemplos, advertencias, desacuerdos y fuentes distintos. La etapa 2 sigue instrucciones sin compararlas con el árbol.',
    docs_knowledgeStructuring_044:
      '<strong><code># Unprocessed</code> (Cola de preparación):</strong> Cuando hace clic en <strong>🥚 Tramar Egg</strong> en el navegador, las entradas aprobadas y las respuestas admitidas se agregan de forma segura a <code># Unprocessed</code> en lugar de tocar directamente su jerarquía seleccionada.',
    docs_knowledgeStructuring_045: '4. Cómo se utiliza cada parte en el flujo de trabajo',
    docs_knowledgeStructuring_046:
      'Así es como el contenido web fluye a través de sus instrucciones egg desde la captura inicial hasta la síntesis final:',
    docs_knowledgeStructuring_047:
      '<code>[Captured Web Content]\n          │\nStage 1   ▼   _index.md (Topic routing guide)\n─────────────────────────────────────────────────────────────\n• Uses content-task-default.md\n• Generates Title Verdict, 3-Bullet Summary, Mind Map\n• egg-routing.md matches target eggs via Stage 1 summary\n          │\n          ▼\nUser Review: Confirm or select target eggs in popup\n          │\nStage 2   ▼   Target Egg File (nutegg/*.md)\n─────────────────────────────────────────────────────────────\n• Scope, Key Questions, Formatting Rules ──► egg-analysis.md\n  (Extracts candidate knowledge entries and answers questions)\n• Worth Reading If / Skip If guide the reading recommendation\n  (Full, highlights, summary, skip, or uncertain; no tree comparison)\n          │\n          ▼\nHatch Egg: Approved entries and supported answers appended to # Unprocessed\n          │\nMerge Cycle (20+ entries or manual button)\n─────────────────────────────────────────────────────────────\n• merge-unprocessed.md nests and integrates entries into # Knowledge</code>',
    docs_knowledgeStructuring_048: 'Conocimiento de fusión automática',
    docs_knowledgeStructuring_049:
      'Cuando se acumulan 20 o más entradas en <code># Unprocessed</code> (o cuando haces clic en <strong>Fusionar</strong> en el widget de vista de lectura Obsidian), la IA de NutEgg ejecuta una síntesis en segundo plano automatizada usando <code>merge-unprocessed.md</code>. Clasifica, deduplica y anida las entradas pendientes bajo los conceptos principales apropiados en <code># Knowledge</code>, manteniendo su gráfico de conocimiento perpetuamente organizado.',
    docs_obsidianPlugin_001: 'Guía del complemento de Obsidian — NutEgg',
    docs_obsidianPlugin_002: 'Obsidian Complemento comunitario ↗',
    docs_obsidianPlugin_003: 'Chrome Tienda web ↗',
    docs_obsidianPlugin_004: 'Lanzamientos de complementos',
    docs_obsidianPlugin_005: 'Política de privacidad',
    docs_obsidianPlugin_006: 'Instalación y configuración del complemento de Obsidian',
    docs_obsidianPlugin_007:
      'El complemento NutEgg Obsidian aloja el servidor de sincronización local, administra la comunicación de IA, relaciona el contenido entrante con sus árboles de conocimiento y mantiene sus archivos de bóveda.',
    docs_obsidianPlugin_008: 'Instalación',
    docs_obsidianPlugin_009: 'Opción 1: Obsidian Complementos comunitarios (recomendado)',
    docs_obsidianPlugin_010: 'NutEgg aparece oficialmente en el directorio de complementos de la comunidad Obsidian:',
    docs_obsidianPlugin_011: 'En Obsidian, abra <strong>Configuración → Complementos de la comunidad</strong>.',
    docs_obsidianPlugin_012:
      'Asegúrese de que <strong>Modo restringido</strong> esté desactivado y luego haga clic en <strong>Examinar</strong>.',
    docs_obsidianPlugin_013:
      'Busque <strong>NutEgg</strong> (o visite <a href="https://community.obsidian.md/plugins/nutegg" target="_blank" rel="noopener"\n              >NutEgg en Obsidian Complementos comunitarios</a\n            >).',
    docs_obsidianPlugin_014: 'Haga clic en <strong>Instalar</strong>, luego haga clic en <strong>Activar</strong>.',
    docs_obsidianPlugin_015: 'Opción 2: Instalación manual',
    docs_obsidianPlugin_016:
      'Descargue <code>main.js</code>, <code>manifest.json</code> y <code>styles.css</code> de las versiones de complementos <a href="https://github.com/staff-000/nutegg-obsidian-release/releases" target="_blank" rel="noopener"\n              >NutEgg Obsidian</a\n            >.',
    docs_obsidianPlugin_017:
      'En su bóveda Obsidian, abra <code>.obsidian/plugins/</code> (muestre las carpetas ocultas en su sistema operativo si es necesario).',
    docs_obsidianPlugin_018:
      'Cree un nuevo directorio llamado <code>nutegg</code> y coloque los tres archivos dentro: <pre><code>your-vault/.obsidian/plugins/nutegg/\n├── main.js\n├── manifest.json\n└── styles.css</code></pre>',
    docs_obsidianPlugin_019:
      'En Obsidian, abra <strong>Configuración → Complementos de la comunidad</strong>, haga clic en <strong>Recargar</strong> y active <strong>NutEgg</strong>.',
    docs_obsidianPlugin_020: 'Opción 3: usar BRAT',
    docs_obsidianPlugin_021:
      'Instale el complemento comunitario <a href="https://github.com/tfthacker/obsidian42-brat" target="_blank" rel="noopener">BRAT</a> en Obsidian.',
    docs_obsidianPlugin_022: 'Vaya a <strong>Configuración → BRAT → Agregar complemento Beta</strong>.',
    docs_obsidianPlugin_023:
      'Ingrese <code>staff-000/nutegg-obsidian-release</code> y haga clic en <strong>Agregar complemento</strong>.',
    docs_obsidianPlugin_024: 'Habilite NutEgg una vez instalado.',
    docs_obsidianPlugin_025: 'Arquitectura de ejecución de IA',
    docs_obsidianPlugin_026:
      'NutEgg utiliza una arquitectura inteligente de ejecución dual (Protocolo 3) que le brinda total flexibilidad entre la privacidad de traer su propia clave API y la conveniencia de una suscripción sin clave:',
    docs_obsidianPlugin_027: '🔒 Invariante de privacidad principal: las claves API nunca salen Chrome',
    docs_obsidianPlugin_028:
      'En el <strong>Modo API conectado</strong>, Obsidian organiza las operaciones de bóveda, el ensamblaje rápido y la egg indexación, pero <strong>delega todas las llamadas de IA a Chrome</strong> a través de un WebSocket local autenticado. Chrome ejecuta la llamada utilizando su clave API almacenada localmente. Sus claves API nunca se transmiten a Obsidian, nunca se escriben en notas de la bóveda y nunca abandonan el navegador.',
    docs_obsidianPlugin_029:
      '<code>┌─────────────────────────────────────────────────────────────────────────────┐\n│                           CONNECTED API MODE (Default)                      │\n│                                                                             │\n│  Chrome Profile A ──(1) HTTP /analyze /confirm──►  Obsidian Plugin          │\n│  (Holds API Key A)                                 (127.0.0.1:27123)        │\n│                                                            │                │\n│                   ◄─(2) WebSocket AI Call /socket──────────┤ Reads _index.md│\n│  Calls Provider A                                          │ Assembles prompt│\n│  (OpenAI / Claude / Gemini / DeepSeek)                     │                │\n│                   ──(3) Authenticated Result─────────────► │                │\n│                                                            ▼                │\n│  Receives Final Result ◄──────(4) HTTP Result────── Saves to Vault          │\n│                                                     (_raw/ & &lt;egg&gt;.md)      │\n└─────────────────────────────────────────────────────────────────────────────┘\n\n┌─────────────────────────────────────────────────────────────────────────────┐\n│                       SHARED SUBSCRIPTION MODE (Zero API Keys)              │\n│                                                                             │\n│  Chrome Profile A ────┐                                                     │\n│                       ├──► Obsidian Plugin (127.0.0.1:27123)                │\n│  Chrome Profile B ────┘        │                                            │\n│                                ▼                                            │\n│                       SubscriptionService (Local CLI or OAuth)              │\n│                       ├── ChatGPT Sign-In (OpenAI Responses API)            │\n│                       ├── Codex CLI (@openai/codex)                         │\n│                       ├── Claude Code CLI (claude auth login)               │\n│                       └── Google Gemini (Antigravity CLI: agy)              │\n└─────────────────────────────────────────────────────────────────────────────┘</code>',
    docs_obsidianPlugin_030: 'Modo 1: Modo API conectado (predeterminado)',
    docs_obsidianPlugin_031:
      'En este modo, configura su proveedor de IA y su clave API directamente en <strong>Chrome Opciones de extensión</strong>. Obsidian coordina el flujo de trabajo del conocimiento mientras que Chrome actúa como corredor de IA local seguro.',
    docs_obsidianPlugin_032:
      '<strong>Proveedores de nube compatibles</strong>: Anthropic (Claude 3.5 Sonnet, Claude 3.7 Sonnet), OpenAI (GPT-4o, serie o), Google Gemini (2.0 Flash, 2.5 Pro), DeepSeek (V3, R1), Kimi, Qwen, Zhipu y OpenRouter.',
    docs_obsidianPlugin_033:
      '<strong>LLM locales (Ollama, LM Studio, llama.cpp, vLLM)</strong>: configure puntos finales locales directamente en Chrome. NutEgg se conecta a su modelo local sin enviar datos fuera de su máquina.',
    docs_obsidianPlugin_034:
      '<strong>Perfiles de Chrome independientes</strong>: Si utilizas varios perfiles de Chrome (por ejemplo, Trabajo y Personal), cada perfil puede usar su propio proveedor, modelo y clave API. Se conectan a la misma bóveda de Obsidian sin conflictos entre claves.',
    docs_obsidianPlugin_035:
      '<strong>Obsidian-Acciones nativas</strong>: las tareas de mantenimiento exclusivas de Vault (como la fusión manual egg en Obsidian) utilizan configuraciones nativas almacenadas de forma segura en Obsidian <code>SecretStorage</code>. Al hacer clic en <strong>Guardar y continuar</strong> en un perfil Chrome conectado, se actualiza de forma segura la cuenta nativa en SecretStorage.',
    docs_obsidianPlugin_036: 'Modo 2: modo de suscripción compartida e inicio de sesión en ChatGPT',
    docs_obsidianPlugin_037:
      '¿No quieres administrar claves API o créditos de pago por token? NutEgg admite el inicio de sesión directo y las suscripciones CLI de desarrollador local administradas dentro de Obsidian:',
    docs_obsidianPlugin_038: 'Opción A: inicio de sesión directo en ChatGPT (no se necesita CLI)',
    docs_obsidianPlugin_039: 'En Obsidian, abra <strong>Configuración → NutEgg</strong>.',
    docs_obsidianPlugin_040:
      'En <strong>Conexión AI</strong>, seleccione <strong>Inicio de sesión de ChatGPT</strong>.',
    docs_obsidianPlugin_041:
      'Haga clic en <strong>Continuar con ChatGPT</strong>, complete el flujo de autorización del navegador y permita el uso del plan.',
    docs_obsidianPlugin_042: 'Elija su modelo de cuenta (por ejemplo, <code>gpt-4o</code>).',
    docs_obsidianPlugin_043:
      'Todos los perfiles Chrome conectados siguen inmediatamente esta conexión sin configuración de clave API. Las credenciales residen de forma segura en el almacenamiento de llavero del sistema operativo por instalación y nunca se envían a Chrome ni se almacenan en archivos de bóveda.',
    docs_obsidianPlugin_044: 'Opción B: Suscripciones CLI locales (Codex, Claude, Gemini)',
    docs_obsidianPlugin_045:
      'NutEgg puede ejecutar herramientas CLI oficiales de desarrollador ya instaladas e iniciadas sesión en su máquina:',
    docs_obsidianPlugin_046: 'Proveedor',
    docs_obsidianPlugin_047: 'Instalación CLI',
    docs_obsidianPlugin_048: 'Autenticación',
    docs_obsidianPlugin_049: 'Descubrimiento de modelos',
    docs_obsidianPlugin_050: '<strong>Codex CLI</strong>',
    docs_obsidianPlugin_051: '<code>npm install -g @openai/codex</code>',
    docs_obsidianPlugin_052: '<code>codex login</code>',
    docs_obsidianPlugin_053: 'Automático a través del servidor de aplicaciones',
    docs_obsidianPlugin_054: '<strong>Antrópico Claude</strong>',
    docs_obsidianPlugin_055:
      '<a href="https://code.claude.com/docs/en/quickstart" target="_blank" rel="noopener">Claude Código</a>',
    docs_obsidianPlugin_056: '<code>claude auth login --claudeai</code>',
    docs_obsidianPlugin_057: 'Soneto, Opus, Haiku o identificación personalizada',
    docs_obsidianPlugin_058: '<strong>Google Gemini</strong>',
    docs_obsidianPlugin_059:
      '<a href="https://antigravity.google/docs/cli/install" target="_blank" rel="noopener">CLI antigravedad</a>',
    docs_obsidianPlugin_060: '<code>agy</code> flujo del navegador',
    docs_obsidianPlugin_061: 'Automático vía <code>agy models</code>',
    docs_obsidianPlugin_062:
      'En Obsidian Configuración → NutEgg, simplemente seleccione su CLI en <strong>Conexión AI</strong>. El <code>SubscriptionService</code> interno de NutEgg ejecuta la inferencia en una cola en serie limitada localmente. No se necesita ningún servidor puente independiente ni el puerto 27124.',
    docs_obsidianPlugin_063: 'Servidor de sincronización local y seguridad',
    docs_obsidianPlugin_064:
      'Cuando el complemento está habilitado, inicia automáticamente un escucha HTTP y WebSocket en segundo plano en <code>127.0.0.1:27123</code>.',
    docs_obsidianPlugin_065: '🔒 Privacidad y seguridad de origen',
    docs_obsidianPlugin_066:
      'El servidor local se vincula estrictamente a la dirección de bucle invertido del host local (<code>127.0.0.1</code>). Aplica una estricta <code>X-NutEgg-Extension-Origin</code> y una validación de tokens, lo que impide que las páginas web normales accedan a su bóveda. Las conexiones WebSocket se autentican en su primer fotograma.',
    docs_obsidianPlugin_067: 'Flujo de trabajo y personalización de mensajes',
    docs_obsidianPlugin_068:
      'NutEgg potencia su análisis de IA a través de mensajes de Markdown modulares y editables almacenados directamente en su bóveda en <code>nutegg/_workflow/</code>:',
    docs_obsidianPlugin_069:
      '<strong>Plantillas editables</strong>: personalice las indicaciones para el análisis de contenido, egg comparación, enrutamiento y seguimiento.',
    docs_obsidianPlugin_070:
      '<strong>Actualizaciones no destructivas</strong>: cuando NutEgg publica plantillas de mensajes actualizadas, sus flujos de trabajo personalizados se conservan automáticamente sin sobrescribirse.',
    docs_workflow_001: 'Flujos de trabajo y motor de prompts de IA — NutEgg',
    docs_workflow_002: 'Chrome Tienda web ↗',
    docs_workflow_003: 'Obsidian Complemento ↗',
    docs_workflow_004: 'Lanzamientos',
    docs_workflow_005: 'Política de privacidad',
    docs_workflow_006: 'Flujos de trabajo y motor de prompts de IA',
    docs_workflow_007:
      'Descubra cómo el motor de flujo de trabajo modular de NutEgg organiza la extracción de contenido, el enrutamiento egg basado en resumen, el análisis basado en instrucciones y las indicaciones personalizables por el usuario.',
    docs_workflow_008: 'La arquitectura de dos etapas',
    docs_workflow_009:
      'En lugar de ejecutar un único mensaje monolítico, NutEgg utiliza una <strong>Arquitectura de dos etapas</strong> diseñada para brindar eficiencia de token, alta precisión de extracción y control total del usuario:',
    docs_workflow_010:
      '<code>                    ┌───────────────────────────────┐\n                    │      Captured Web Content     │\n                    │   (Article / YouTube / Tweet) │\n                    └───────────────┬───────────────┘\n                                    │\n                                    ▼\n       ===========================================================\n       STAGE 1: Content & Discussion Analysis + Egg Routing\n       ===========================================================\n            │                                             │\n            ├─► Content Analysis                          ├─► Discussion Analysis\n            │   (Is content >30k chars?)                  │   (When 💬 Discussion enabled\n            │    ├── No  ──► [content-analysis.md]        │    & comments captured)\n            │    └── Yes ──► Chunks + [aggregate-         │    ├── [discussion-analysis.md]\n            │                content.md]                  │    └── [aggregate-discussion.md]\n            │                                             │\n            └──────────────────────┬──────────────────────┘\n                                   │\n                                   ▼\n        Produces: Title Verdict, 3-Bullet Summary, Mind Map,\n        Timestamped Q&A, and Discussion Topics/Stances\n                                   │\n                                   ▼\n                          [egg-routing.md]\n          (Routes matched eggs from _index.md using the\n           concise Stage 1 summary instead of raw content)\n                                    │\n                                    ▼\n       ===========================================================\n       INTERACTIVE CHOICE / EXECUTION MODE (Chrome Extension)\n       ===========================================================\n                                    │\n                        Which mode is selected?\n                                    │\n            ┌───────────────────────┼───────────────────────┐\n            ▼                       ▼                       ▼\n     [Standalone Mode]         [🌞 Full Mode]      [🌛 Preview Summary]\n     Obsidian is offline.      Auto-proceeds to    User reviews matched eggs:\n     Runs Stage 1 in Chrome    Stage 2 with all    ├── "Collect Nut Only"\n     with user\'s API key.      matched eggs.       └── Add/remove eggs ──► Proceed\n     (Fast reading & Q&A)           │                       │\n            │                       └───────────┬───────────┘\n            ▼                                   ▼\n    Results in Side Panel      ===========================================================\n    (No Stage 2 analysis)    STAGE 2: Per-Egg Instruction-Driven Analysis\n                               ===========================================================\n                                                │\n                                   For each confirmed egg (1 or N):\n                                                │\n                                                ▼\n                                        [egg-analysis.md]\n                                  (Extract candidate knowledge entries\n                                   & key questions scoped to this egg)\n                                                │\n                                                ▼\n                                  (Answers + extracted entries + reading action)\n                                                │\n                                                ▼\n                                     Results returned to Popup\n                                     (Ready to Save Nut & Eggs)</code>',
    docs_workflow_011: '💡 ¿Por qué enrutamiento basado en resumen?',
    docs_workflow_012:
      'El enrutamiento eggs utilizando el resumen de la Etapa 1 en lugar de artículos completos sin procesar o transcripciones de videos de varias horas ahorra decenas de miles de tokens por ejecución y mejora la precisión del enrutamiento al centrarse en temas semánticos destilados y de alta señal.',
    docs_workflow_013:
      'El indicador de tabulación cruzada del panel lateral muestra análisis en ejecución y resultados completados no leídos en la ventana Chrome actual. Haga clic en él para enumerar las pestañas y cambiar directamente a sus resultados o progreso. Los resultados se leen cuando su análisis es visible en la pestaña activa. El seguimiento dura mientras el panel permanece abierto y se reinicia cuando se cierra.',
    docs_workflow_014:
      'Hatch archiva el análisis original y agrega las entradas aprobadas a <code># Unprocessed</code>. La combinación se ejecuta con 20 entradas pendientes o bajo demanda para ensamblar fragmentos y deduplicar reclamaciones mientras se preservan las fuentes, las advertencias, los ejemplos y los desacuerdos. La etapa 2 nunca recibe el árbol de conocimiento, por lo que la recomendación evalúa la relevancia y la sustancia en lugar de la novedad.',
    docs_workflow_015:
      'La opción de sección <strong>🍃 Conocimiento</strong> y el menú desplegable Egg Análisis comparten una configuración para la pestaña actual del navegador: <strong>🥚 Solo análisis</strong> desactiva Conocimiento y <strong>🍃 Incluir conocimiento</strong> lo activa. Al cambiar las opciones desplegables se actualiza la configuración y la etiqueta del botón sin activar automáticamente una llamada de IA; haga clic en el botón para analizar. Al cambiar a Incluir conocimiento para un egg analizado previamente sin entradas de conocimiento, NutEgg vuelve a ejecutar la Etapa 2 en lugar de simplemente mostrar el resultado almacenado en caché de solo respuesta. Incluir conocimiento es el valor predeterminado inicial; su última opción se convierte en la predeterminada para pestañas sin análisis. Desactivar la opción no oculta las entradas generadas previamente ni impide guardarlas. Desactivar Conocimiento deshabilita las entradas para cada egg seleccionado. Activarlo permite entradas solo para eggs que les permitan: <code>Generate Knowledge Entries: no</code> o una opción de exclusión voluntaria en la Guía de acción de egg tiene prioridad. Las respuestas clave y las recomendaciones de lectura siguen estando disponibles de cualquier manera. El análisis no guarda las entradas; <strong>🐣 Hatch Egg</strong> guarda las entradas generadas en archivos egg.',
    docs_workflow_016: 'Modos de flujo de trabajo',
    docs_workflow_017: 'Modo',
    docs_workflow_018: 'Comportamiento',
    docs_workflow_019: 'Mejor utilizado para',
    docs_workflow_020: '<strong>📱 Modo independiente</strong>',
    docs_workflow_021:
      'Ejecuta el análisis de contenido de la Etapa 1 directamente en Chrome (cuando Obsidian está fuera de línea o cerrado). Produce veredictos, resúmenes de tres oraciones, mapas mentales con marcas de tiempo en las que se puede hacer clic y videos interactivos de preguntas y respuestas con saltos de marcas de tiempo. Omite el análisis de la etapa 2 egg.',
    docs_workflow_022: 'Lectura rápida de videos y web, comprensión rápida o cuando no necesita archivar notas.',
    docs_workflow_023: '<strong>🌞 Modo completo</strong>',
    docs_workflow_024:
      'Ejecuta el análisis de contenido de la Etapa 1, enruta eggs automáticamente a través de <code>_index.md</code> y ejecuta inmediatamente el análisis de Etapa 2 egg en una pasada ininterrumpida.',
    docs_workflow_025: 'Lectura diaria y capturas rápidas cuando confías en la coincidencia automática egg.',
    docs_workflow_026: '<strong>🌛 Vista previa del resumen</strong>',
    docs_workflow_027:
      'Ejecuta el análisis de contenido de la Etapa 1 y luego se detiene en la ventana emergente. Muestra las coincidencias eggs junto con la lista egg completa de su bóveda. Puede agregar/eliminar eggs, continuar con la comparación de conocimientos o hacer clic en <strong>Recopilar Nut Solo</strong>.',
    docs_workflow_028:
      'Investigación profunda, temas ambiguos o cuando solo desea un resumen rápido sin actualizar egg árboles de conocimiento.',
    docs_workflow_029: 'Ejecución de IA y protocolo de credenciales',
    docs_workflow_030:
      'Independientemente de si elige el modo completo o el resumen de vista previa, NutEgg separa <em>orquestación del flujo de trabajo</em> de <em>almacenamiento de credenciales e inferencia de IA</em>:',
    docs_workflow_031:
      '<strong>Modo API conectado (predeterminado)</strong>: Obsidian coordina la inyección de plantilla de solicitud y la comparación de conocimientos, pero envía solicitudes de inferencia a Chrome a través de un WebSocket autenticado (<code>/execution/socket</code>). Chrome ejecuta la llamada LLM con su clave API local y envía el resultado autenticado. <strong>Tu clave API nunca sale Chrome.</strong>',
    docs_workflow_032:
      '<strong>Modo de suscripción compartida</strong>: Obsidian coordina el flujo de trabajo y ejecuta directamente llamadas de IA localmente utilizando las herramientas CLI oficiales del desarrollador (<code>codex</code>, <code>claude</code>, <code>agy</code>) o el inicio de sesión directo de ChatGPT OAuth. Todos los perfiles Chrome conectados comparten esta suscripción sin necesidad de una clave API.',
    docs_workflow_033: 'Archivos de flujo de trabajo en su bóveda',
    docs_workflow_034: 'NutEgg siembra sus plantillas de aviso en <code>nutegg/_workflow/</code> dentro de su bóveda:',
    docs_workflow_035: '1. Fragmentos compartidos (inyectados en otras indicaciones)',
    docs_workflow_036:
      '<code>shared-output-rules.md</code>: Directiva de base (el contenido fuente es la única verdad) y reglas de referencia del idioma de salida multilingüe. Inyectado como <code>{{shared_output_rules}}</code>.',
    docs_workflow_037:
      '<code>content-task-default.md</code>: instrucciones de tareas principales para veredictos de títulos, resúmenes de tres viñetas y mapas mentales con marcas de tiempo en las que se puede hacer clic. Inyectado como <code>{{content_task_default}}</code>.',
    docs_workflow_038: '2. Canal de captura y comparación de contenido',
    docs_workflow_039:
      '<code>content-analysis.md</code>: resumen de contenido de la etapa 1, veredicto anti-clickbait, mapa mental interactivo con marcas de tiempo en las que se puede hacer clic y respuestas a preguntas personalizadas con citas de marcas de tiempo.',
    docs_workflow_040:
      '<code>egg-routing.md</code>: compara los resúmenes de la etapa 1 con las descripciones de egg en <code>_index.md</code> para seleccionar el candidato eggs.',
    docs_workflow_041:
      '<code>egg-analysis.md</code>: Etapa 2 por-egg extracción de entradas de conocimiento del candidato y respuestas a preguntas clave enfocadas a las instrucciones de uno egg.',
    docs_workflow_042:
      'Vale la pena leer la guía If y Skip If, lectura completa, aspectos destacados, resumen suficiente, omitir o incierto. Las respuestas útiles se pueden guardar independientemente de la recomendación.',
    docs_workflow_043:
      '<code>aggregate-content.md</code> y <code>aggregate-egg.md</code>: agregación de contenido largo (&gt;30.000 caracteres). La etapa 2 combina únicamente borradores de respuestas, notas de recomendación y cobertura; las entradas extraídas permanecen en el orden de origen hasta que se fusionan.',
    docs_workflow_044: '3. Análisis de la discusión (Etapa 1)',
    docs_workflow_045:
      'El análisis de discusión se ejecuta como parte del análisis de contenido de la <strong>Etapa 1</strong> cuando la sección <strong>💬 Discusión</strong> está habilitada en Opciones de extensión o Secciones de análisis emergentes, y el extractor de páginas captura los comentarios de los lectores o las respuestas sociales (por ejemplo, YouTube comentarios, respuestas de Twitter, Reddit/hilos del foro, comentarios de Bilibili o Zhihu responde).',
    docs_workflow_046:
      '<code>discussion-analysis.md</code>: analiza comentarios en lotes para extraer de 3 a 5 temas de debate centrales, clasifica las posturas de los comentaristas (<code>agree</code>, <code>disagree</code>, <code>mixed</code>, <code>neutral</code>, <code>unclear</code>) y resalta valiosos complementos o correcciones de experiencias de primera mano (<code>supplement: true</code>).',
    docs_workflow_047:
      '<code>aggregate-discussion.md</code>: fusiona y sintetiza temas y distribuciones de posturas en hilos de comentarios de varios lotes para foros grandes o secciones de comentarios de videos.',
    docs_workflow_048:
      '<strong>Flujo de contexto:</strong> Los resúmenes de discusión analizados y los elementos de evidencia se devuelven en el resultado de la Etapa 1 y se incorporan directamente a las preguntas y respuestas personalizadas o al análisis del cuerpo del foro (crucial para páginas centradas en discusiones o videos sin transcripciones). También se reenvían como señales de contexto a la Etapa 2 <code>egg-analysis.md</code> para que eggs pueda evaluar los comentarios de la comunidad junto con el contenido original.',
    docs_workflow_049: '4. Flujos de trabajo interactivos y de mantenimiento',
    docs_workflow_050:
      '<code>follow-up.md</code>: Preguntas y respuestas interactivas en lenguaje natural en el panel lateral con historial de conversaciones anteriores y salto de marca de tiempo de video en el que se puede hacer clic.',
    docs_workflow_051:
      '<code>merge-unprocessed.md</code>: se activa manual o automáticamente en más de 20 entradas pendientes para organizar y anidar elementos sin procesar en <code># Knowledge</code>.',
    docs_workflow_052:
      '<code>localize-egg.md</code>: Traduce nuevas plantillas egg a idiomas extranjeros conservando los títulos estructurales en inglés.',
    docs_workflow_053: 'Pautas de personalización segura',
    docs_workflow_054: '⚠️ Qué conservar',
    docs_workflow_055:
      'Eres libre de personalizar el tono, la perspectiva y la profundidad de las indicaciones. Sin embargo, <strong>debes conservar</strong>:',
    docs_workflow_056:
      'Todas las etiquetas <code>{{placeholder}}</code> (por ejemplo, <code>{{content}}</code>, <code>{{knowledge_tree}}</code>, <code>{{title}}</code>).',
    docs_workflow_057:
      'Claves de salida JSON exactas (por ejemplo, <code>titleVerdict</code>, <code>extractedEntries</code>, <code>mindMap</code>) para que el analizador pueda deserializar la respuesta.',
    docs_workflow_058:
      'Los encabezados estructurales (<code># Knowledge</code>, <code># Unprocessed</code>) en las salidas Markdown.',
    docs_workflow_059: 'Actualizaciones y reinicio sin conflictos',
    docs_workflow_060: 'Cuando NutEgg se actualiza a una versión más reciente:',
    docs_workflow_061:
      '<strong>Mensajes no editados</strong>: actualizado automáticamente a la última versión integrada.',
    docs_workflow_062:
      '<strong>Mensajes personalizados</strong>: sus ediciones nunca se sobrescriben. NutEgg escribe <code>[filename].new.md</code> junto a tu archivo para que puedas revisar las nuevas incorporaciones a tu propio ritmo.',
    docs_workflow_063:
      '<strong>Restablecimiento de fábrica ("Usar valores predeterminados")</strong>: ¿Necesita un nuevo comienzo? En <strong>Obsidian Configuración → NutEgg</strong>, haga clic en <strong>Usar valores predeterminados</strong>. Se realiza una copia de seguridad de todos los mensajes existentes en <code>nutegg/_workflow/_backup/&lt;timestamp&gt;/</code> y se restauran los valores predeterminados de fábrica.',
  },
  ja: {
    docs_chromeExtension_001: 'Chrome 拡張機能ガイド — NutEgg',
    docs_chromeExtension_002: 'Chrome ウェブストア ↗',
    docs_chromeExtension_003: 'Obsidian プラグイン ↗',
    docs_chromeExtension_004: '🎬 プロモーションビデオ ↗',
    docs_chromeExtension_005: '拡張機能のリリース',
    docs_chromeExtension_006: 'プライバシーポリシー',
    docs_chromeExtension_007: 'Chrome 拡張機能の設定と使い方',
    docs_chromeExtension_008:
      'NutEgg Chrome 拡張機能はブラウザのサイド パネルに常駐し、オンデマンドのコンテンツ抽出、クリック可能なタイムスタンプ付きの YouTube マインド マップ、および Obsidian へのワンクリック キャプチャを提供します。',
    docs_chromeExtension_009: 'インストール',
    docs_chromeExtension_010: '方法 1：Chrome ウェブストア（推奨）',
    docs_chromeExtension_011:
      '公式 <a\n            href="https://chromewebstore.google.com/detail/nutegg/bmdmdiicembobejibggoeiahaonphcol"\n            target="_blank"\n            rel="noopener"\n            >Chrome Web ストア</a\n          > からワンクリックでNutEgg を直接インストールします。',
    docs_chromeExtension_012:
      '<a\n              href="https://chromewebstore.google.com/detail/nutegg/bmdmdiicembobejibggoeiahaonphcol"\n              target="_blank"\n              rel="noopener"\n              >NutEgg Chrome ウェブストアページ</a\n            > にアクセスしてください。',
    docs_chromeExtension_013: '<strong>Chrome に追加</strong>をクリックします。',
    docs_chromeExtension_014:
      'Chrome のツールバーにあるパズルのピースのアイコンをクリックし、<strong>NutEgg</strong> を固定すると、サイドパネルに簡単にアクセスできます。',
    docs_chromeExtension_015: '方法 2：GitHub リリース（.zip）からインストール',
    docs_chromeExtension_016:
      '最新の <code>nutegg-chrome-extension-*.zip</code> を <a\n              href="https://github.com/staff-000/nutegg-chrome-extension-release/releases"\n              target="_blank"\n              rel="noopener"\n              > リリース ページ</a\n            > からダウンロードします。',
    docs_chromeExtension_017: 'アーカイブをコンピュータ上のローカル フォルダに解凍します。',
    docs_chromeExtension_018: 'Google Chrome を開き、<code>chrome://extensions</code> にアクセスします。',
    docs_chromeExtension_019: '右上隅にある <strong>開発者モード</strong> をオンに切り替えます。',
    docs_chromeExtension_020:
      '<strong>解凍したものをロード</strong> をクリックし、<code>manifest.json</code> を含む解凍されたディレクトリを選択します。',
    docs_chromeExtension_021:
      'Chrome ツールバーのパズル アイコンをクリックし、<strong>NutEgg</strong> をピンで固定すると、簡単にアクセスできます。',
    docs_chromeExtension_022: 'サイドパネルのワークフロー',
    docs_chromeExtension_023: 'NutEgg 拡張機能アイコンをクリックすると、Chrome のサイドパネルが開きます。',
    docs_chromeExtension_024:
      '<strong>自動抽出</strong>: 閲覧中に、NutEgg はアクティブなタブ (YouTube ビデオ、Twitter/X スレッド、またはブログ投稿) を検出し、そのテキストと構造を抽出します。',
    docs_chromeExtension_025:
      '<strong>コンテンツ更新 (🔄)</strong>: コンテンツ プレビューの更新ボタンをクリックすると、予期せずプレビューからリダイレクトされることなく、動的単一ページ アプリでページが再抽出されます。',
    docs_chromeExtension_026:
      '<strong>ターゲット Egg セレクター</strong>: コンテンツ プレビューで、ターゲット ナレッジ eggs を選択するか、「ターゲット eggs (デフォルトで自動選択)」を使用して、AI が関連するボールト ツリーを自動的に照合します。',
    docs_chromeExtension_027:
      '<strong>分析モード</strong>: <ul> <li> <strong>フルモード</strong>: コンテンツを評価し、単一の合理化されたワークフローで、ナレッジマッチングとマッチング eggs を即座に実行します。 </li> <li> <strong> プレビュー モード</strong>: 最初にステージ 1 の概要 (概要、マインド マップ、Q&amp;A、ディスカッション) を生成し、オンデマンドで egg ナレッジ分析を実行する前にターゲット eggs を検査または調整できます。 </li> </ul>',
    docs_chromeExtension_028:
      '<strong>ステータスインジケータ</strong>: 緑色の点は、ローカルObsidianサーバー (<code>127.0.0.1:27123</code>) への接続が正常であることを示します。赤の場合は、Obsidian が NutEgg プラグインを有効にして実行されていることを確認してください。',
    docs_chromeExtension_029: 'YouTube 連携とスマートナビゲーション',
    docs_chromeExtension_030: 'YouTube の動画ページでは、NutEgg が次の情報を抽出します：',
    docs_chromeExtension_031:
      '<strong>完全なキャプションとトランスクリプト</strong>: クリエイターおよび自動生成されたトランスクリプトからの自動高精度抽出。',
    docs_chromeExtension_032:
      '<strong>クリック可能なタイムスタンプ付きマインドマップ</strong>: アクティブなYouTubeビデオプレーヤーをそのセグメントに直接検索するクリック可能なタイムスタンプボタンによるインスタントブレークダウン。タイムスタンプが存在する場合、ツリーをクリーンな状態に保つために冗長なソース タグが非表示になります。',
    docs_chromeExtension_033:
      '<strong>タイムスタンプジャンプに関する Q&amp;A</strong>: 動画に関する質問があれば自然言語で質問してください。 NutEgg では、ビデオ再生のソース瞬間に直接ジャンプするクリック可能なタイムスタンプ錠剤を使用して、引用された回答を提供します。',
    docs_chromeExtension_034:
      '<strong>アンチクリックベイト評決</strong>: 動画タイトルの前提に対する客観的な 1 文の回答で、すぐに内容をスキップできます。',
    docs_chromeExtension_035: 'ページ内の引用元への移動',
    docs_chromeExtension_036: '記事、ブログ、フォーラムを読むとき：',
    docs_chromeExtension_037:
      '<strong>📍 ソースにジャンプ</strong>: テキストのマインドマップ ノードと Q&amp;A の引用にはソース タグが含まれます。ソースタグをクリックすると、ライブ Web ページが正確に一致する段落または引用まで自動的にスクロールされ、アウトラインで簡単に強調表示されます。',
    docs_chromeExtension_038:
      '<strong>コメントナビゲーション</strong>: ディスカッションページ (Reddit、Zhihu など) で出典引用をクリックすると、特定のコメントまたは回答まで直接スクロールします。',
    docs_chromeExtension_039: 'ディスカッション分析とコミュニティの視点',
    docs_chromeExtension_040:
      'NutEgg は、YouTube、Reddit、Twitter/X、Zhihu、フォーラムにわたるパブリック コメントを分析します。',
    docs_chromeExtension_041:
      '<strong>トピックとスタンスの内訳</strong>: 議論の中心となる論点をスタンス バッジ (賛成 👍、反対 👎、混合 🤔、中立 ⚖️) と反応指標で要約します。',
    docs_chromeExtension_042:
      '<strong>追加の洞察</strong>: 証拠、警告、またはユニークな経験を含む価値の高いコメントは、簡潔な追加の洞察として保存されます。',
    docs_chromeExtension_043: 'Chrome - スタンドアロン モードのみ (Obsidian は必要ありません)',
    docs_chromeExtension_044:
      'Obsidian がインストールされていませんか、または現在開いていますか? NutEgg は Google Chrome 内で完全にスタンドアロンで動作します。',
    docs_chromeExtension_045: '⚡ メモのオーバーヘッドなしでウェブを高速に読むことができます',
    docs_chromeExtension_046:
      'NutEgg は、何よりもまず、超高速の Web 読書コンパニオンとして設計されています。 Note Vault に触れることなく、Chrome で直接、記事や YouTube ビデオについての抽出、要約、生成、質問を行うことができます。',
    docs_chromeExtension_047: 'Chrome スタンドアロンで利用可能な機能:',
    docs_chromeExtension_048:
      '<strong>🎯 即時アンチクリックベイト評決</strong>: 見出しの質問に対する客観的な 1 文の回答。',
    docs_chromeExtension_049:
      '<strong>📝 エグゼクティブ 3 文の要約</strong>: 長い記事やビデオから抽出された高密度の要点。',
    docs_chromeExtension_050:
      '<strong>⏱️ クリック可能なタイムスタンプとシークを備えたマインドマップ</strong>: ワンクリックで主要なビデオセグメントにジャンプします。',
    docs_chromeExtension_051:
      '<strong>💬 ビデオ Q&amp;A とタイムスタンプ ジャンプ</strong>: 質問し、引用されたタイムスタンプ ピルをクリックして、ビデオ再生をそのセグメントまで直接スクラブします。',
    docs_chromeExtension_052:
      '<strong>🧠折りたたみ可能なマインドマップ</strong>: 中心となるアイデアを視覚的に分解する多層のインタラクティブな思考ツリー。',
    docs_chromeExtension_053:
      '<strong>🌐 50 以上の言語サポート</strong>: 外国語コンテンツをその場で抽出して翻訳します。',
    docs_chromeExtension_054: 'Chrome 専用モードの設定方法:',
    docs_chromeExtension_055:
      'Chrome のツールバーにある <strong>NutEgg 拡張機能アイコン</strong> を右クリックし、<strong>オプション</strong> を選択します。',
    docs_chromeExtension_056:
      '希望の AI プロバイダー (例: Google Gemini、OpenAI、Claude、DeepSeek、または OpenRouter) を選択し、API キーを入力します。',
    docs_chromeExtension_057: '<strong>保存</strong>をクリックします。あらゆるページを分析する準備が整いました。',
    docs_chromeExtension_058: 'Obsidian 接続と AI 実行モード',
    docs_chromeExtension_059:
      'Chrome 拡張機能をオプションの NutEgg Obsidian プラグインに接続すると、Chrome は選択した実行モードに応じてシームレスに適応します。',
    docs_chromeExtension_060: '🔒 API キーのセキュリティ: キーは決して離れることはありません Chrome',
    docs_chromeExtension_061:
      '<strong>接続 API モード</strong> では、API キーはChrome の安全な拡張ストレージ内に厳密に保管されます。 Obsidian はナレッジ テンプレートとボールトのインデックス作成を管理しますが、AI 推論は認証されたローカル WebSocket を介して Chrome に委任されます。 Chrome はプロバイダー API 呼び出しをローカルで実行し、生成されたテキストのみを返します。',
    docs_chromeExtension_062: '実行モード',
    docs_chromeExtension_063: 'AI が実行される場所',
    docs_chromeExtension_064: '使用される認証情報',
    docs_chromeExtension_065: '<strong>Chrome-のみ</strong>',
    docs_chromeExtension_066: 'Chrome内すぐ',
    docs_chromeExtension_067: 'Chrome オプションで設定された API キー',
    docs_chromeExtension_068: '<strong>接続APIモード</strong>',
    docs_chromeExtension_069: 'Chrome (Obsidian によってローカル WebSocket 経由で委任)',
    docs_chromeExtension_070: 'Chrome の API キー (キーは Obsidian に送信されません)',
    docs_chromeExtension_071: '<strong>共有サブスクリプションモード</strong>',
    docs_chromeExtension_072: 'Obsidian 内 (ローカル CLI または ChatGPT OAuth 経由)',
    docs_chromeExtension_073: 'ゼロ API キー (Codex、Claude コード、Antigravity、または ChatGPT を使用)',
    docs_chromeExtension_074: 'マルチプロファイルChromeのサポート',
    docs_chromeExtension_075:
      'NutEgg は、同じ Obsidian コンテナーに同時に接続する複数の Chrome ブラウザ プロファイル (個人用と仕事用など) をサポートします。各 Chrome プロファイルは、独自のプロバイダー、モデル、および API キーを個別に保持します。接続または実行モードの切り替えによって、プロファイル間で API キーが漏洩したり上書きされたりすることはありません。',
    docs_chromeExtension_076: 'オフラインおよび切断からの回復',
    docs_chromeExtension_077:
      '接続モードが有効なときに Obsidian が閉じられている場合、NutEgg は明確なステータス ライトを表示し、ワンクリックで <strong>「代わりに Chrome モードを使用する」</strong> オプションを表示します。これにより、中断やクォータのリスクを伴うことなく、Chrome API セットアップを使用して、すぐに読書や質問を続けることができます。',
    docs_chromeExtension_078: '構成とライブ同期',
    docs_chromeExtension_079:
      'NutEgg には、拡張オプションとアクティブなサイド パネル間のリアルタイム同期が含まれています。',
    docs_chromeExtension_080:
      '<strong>コンテンツ セクション コントロール</strong>: [オプション] ページで、デフォルトで抽出および分析されるセクション (コンテンツ、概要、マインド マップ、Q&amp;A、ナレッジ エントリ、およびディスカッション) をカスタマイズします。',
    docs_chromeExtension_081:
      '<strong>ライブ設定同期</strong>: 解析モデル、有効な出力セクション、またはサーバー設定を変更すると、ページを更新することなく、開いているすべてのサイド パネルが即座に更新されます。',
    docs_chromeExtension_082:
      '<strong>カスタムサーバーポート</strong>: デフォルトのポート<code>27123</code>が別のサービスと競合する場合は、拡張機能<strong>オプション</strong>を開き、ポートを調整し（例：<code>28123</code>）、接続をテストします。',
    docs_index_001: 'ドキュメントの概要 — NutEgg',
    docs_index_002: 'Chrome ウェブストア ↗',
    docs_index_003: 'Obsidian プラグイン ↗',
    docs_index_004: '🎬 プロモーションビデオ ↗',
    docs_index_005: 'GitHub リリース',
    docs_index_006: 'プライバシーポリシー',
    docs_index_007: '問題追跡ツール',
    docs_index_008: '概要と基本概念',
    docs_index_009:
      'NutEgg は、何を読む価値があるかを判断し、より早く理解するのに役立つ、無料のオープンソース Chrome 拡張機能です。これは Chrome のサイドパネルに存在し、記事、スレッド、および YouTube ビデオで動作します。オプションの Obsidian プラグインを使用すると、読んだ内容が成長するナレッジ ボールトに変わります。',
    docs_index_010: '得られるもの Chrome',
    docs_index_011:
      '拡張機能をインストールし、オプションで AI API キーを入力 (またはローカル モデルを指定) すると、NutEgg がすぐに機能します。アカウントや追加のアプリは必要ありません。',
    docs_index_012: '🎯 アンチクリックベイトの即時タイトル評決',
    docs_index_013: '📝 エグゼクティブ 3 文の要約と重要なポイント',
    docs_index_014: '🧠 YouTube のクリック可能なタイムスタンプを備えた、折りたたみ可能な階層型マインド マップ',
    docs_index_015: '💬 タイムスタンプの丸薬とページ内のソースリンクを引用した自然言語 Q&amp;A',
    docs_index_016: '🔍 二重範囲の質問: 厳密にページ内、または事実確認のためにページ外で質問',
    docs_index_017: '🗣️ YouTube、Reddit、フォーラムのコメントセクションのダイジェスト',
    docs_index_018: '🌐 マルチソースの抽出と 50 以上の言語への翻訳',
    docs_index_019: '💡 NutEgg が存在する理由',
    docs_index_020:
      'ウェブには水増し動画、クリックベイトの見出し、AI を使って誇張された記事が多すぎます。 NutEgg は見出しに事前に答え、そのコンテンツが時間を費やす価値があるかどうかを正直に教えてくれるので、有益なところにのみ注意を払うことができます。',
    docs_index_021: 'オプション: Obsidian を追加します',
    docs_index_022:
      'Obsidian にメモを保存する場合は、コンパニオン プラグインをインストールして、拡張機能をボールト (<code>127.0.0.1:27123</code>) に接続します。これにより、Vault の <code>_index.md</code> ナレッジ ツリーに対する 2 段階のノベルティ評価、デルタ合成、および <code>nutegg/_raw/</code> および egg ファイルへの自動メモ アーカイブが追加されます。 Chrome のすべては、それがあってもなくても機能し続けます。',
    docs_index_023: '比喩',
    docs_index_024:
      'Obsidian が接続されると、NutEgg はシンプルな 3 部構成のメタファーを使用して情報フローを構造化します。',
    docs_index_025:
      '<strong>🌰 Nut (生キャプチャ)</strong>: ブラウザから抽出された生の Web ページ、ツイート スレッド、または YouTube トランスクリプト。 Nuts は、完全なメタデータとともにそのまま Vault 内の <code>nutegg/_raw/</code> にアーカイブされます。',
    docs_index_026:
      '<strong>🥚 Egg (知識ツリー)</strong>: 知識の領域を表す、金庫内にある生きた構造化されたMarkdown ノート (例: <code>ai_architecture.md</code>、<code>invest_strategy.md</code>)。',
    docs_index_027:
      '<strong>🐣 ハッチ (合成とデルタ)</strong>: コンテンツが分析されると、AI はそれをあなたの eggs と照合し、すでに文書化されているものと比較して何が新規であるかを特定し、新しい洞察をあなたの egg に織り込みます。',
    docs_index_028: 'システムアーキテクチャ',
    docs_index_029: 'NutEgg には 1 つのコア コンポーネントと 1 つのオプションのコンパニオンがあります。',
    docs_index_030:
      '<strong>Chrome 拡張</strong>: Chrome のサイドパネルにあります。テキスト、コメント、ビデオのトランスクリプトを抽出します。スタンドアロン モードまたは接続された API モードでは、構成されたプロバイダーと API キーを使用して AI 呼び出しをローカルで実行し、API キーがブラウザーから離れることはありません。',
    docs_index_031:
      '<strong>Obsidian プラグイン (オプション)</strong>: <code>127.0.0.1:27123</code> でローカル同期およびコーディネーター サービスを実行します。 Vault の <code>_index.md</code> を読み取り、<code>_workflow/</code> でプロンプト テンプレートを管理し、取得したナレッジをディスクにアーカイブします。以下をサポートします: <ul> <li> <strong>接続 API モード (デフォルト)</strong>: 知識マッチングを調整し、認証されたローカル WebSocket を介して AI 推論を Chrome に委任します (キーは Obsidian には送信されません)。 </li> <li> <strong> 共有サブスクリプション モード</strong>: API キーを必要とせずに、ChatGPT サインイン (OAuth) または開発者 CLI ツール (Codex、Claude コード、反重力) を介して推論をローカルで実行します。 </li> </ul>',
    docs_index_032:
      '<code>Chrome Extension (Side Panel)\n │\n ├── [Standalone Mode] Local AI Processing (Verdicts, Summaries, Mind Maps, Q&amp;A)\n │\n └── [Connected Mode] HTTP + WebSocket (127.0.0.1:27123/execution/socket)\n         │\n         ▼\n Obsidian Plugin (Local Server &amp; Coordinator)\n         ├── Evaluates against vault/nutegg/_index.md &amp; prompts in _workflow/\n         ├── In API Mode: Delegates AI calls back to Chrome over WebSocket (keys stay in Chrome)\n         ├── In Subscription Mode: Executes locally via CLI (Codex/Claude/agy) or ChatGPT OAuth\n         └── Writes structured notes to vault/nutegg/_raw/ and &lt;egg&gt;.md</code>',
    docs_index_033: 'クイックスタートロードマップ',
    docs_index_034:
      '1 分間の視覚的なウォークスルーについては、<a href="https://www.youtube.com/watch?v=_u6mDoHZSAo" target="_blank" rel="noopener"\n              >🎬 NutEgg プロモーション ビデオ</a\n            > をご覧ください。',
    docs_index_035:
      'Chrome Web ストアから <a\n              href="https://chromewebstore.google.com/detail/nutegg/bmdmdiicembobejibggoeiahaonphcol"\n              target="_blank"\n              rel="noopener"\n              >Chrome Extension</a\n            > をインストールし、オプションに AI キーを追加します (<a href="chrome-extension.html">ガイド</a> を参照)。',
    docs_index_036:
      '記事またはYouTubeビデオのサイドパネルを開き、<strong>分析</strong>をクリックします。それでおしまい！',
    docs_index_037:
      '<em>オプション:</em> <a href="https://community.obsidian.md/plugins/nutegg" target="_blank" rel="noopener">Obsidian プラグイン</a> (<a href="obsidian-plugin.html">ガイド</a> を参照) をインストールし、<a href="knowledge-structuring.html">_index.md</a> で最初の知識トピックを定義して、ハッチングを開始します。',
    docs_knowledgeStructuring_001: '知識の構造化と Eggs — NutEgg',
    docs_knowledgeStructuring_002: 'Chrome ウェブストア ↗',
    docs_knowledgeStructuring_003: 'Obsidian プラグイン ↗',
    docs_knowledgeStructuring_004: 'リリース',
    docs_knowledgeStructuring_005: 'プライバシーポリシー',
    docs_knowledgeStructuring_006: '知識の構造化と Eggs',
    docs_knowledgeStructuring_007:
      'NutEgg が Obsidian ボールトを整理し、<code>_index.md</code> を使用して Web コンテンツとトピックを照合し、蓄積されたエントリをナレッジ ツリーにマージする方法を学びましょう。',
    docs_knowledgeStructuring_008: '<code>nutegg/</code> ボールトのレイアウト',
    docs_knowledgeStructuring_009:
      'すべての NutEgg コンテンツは、Obsidian ボールト内のクリーンで隔離された <code>nutegg/</code> フォルダーに限定されます。',
    docs_knowledgeStructuring_010:
      '<code>vault/\n└── nutegg/\n    ├── _raw/                          # Captured nuts (raw web content + metadata)\n    │   └── 2026-09-06-14-30-youtube-author-title.md\n    ├── _index.md                      # Topic routing guide\n    ├── ai_architecture.md             # Knowledge egg\n    ├── invest_strategy.md             # Knowledge egg\n    └── productivity.md                # Knowledge egg</code>',
    docs_knowledgeStructuring_011: 'ルーティングガイド: <code>_index.md</code>',
    docs_knowledgeStructuring_012:
      '<code>_index.md</code> ファイルは、NutEgg にどの egg ノートを管理しているか、およびそれらがどのドメインをカバーしているかを伝えます。各行は、相対ファイル パスをキーワードと説明にマップします。',
    docs_knowledgeStructuring_013:
      '<code>nutegg/ai_architecture.md: LLMs, multi-agent systems, prompt engineering, RAG, embeddings\nnutegg/invest_strategy.md: value investing, index funds, asset allocation, macroeconomic indicators\nnutegg/productivity.md: deep work, time blocking, habits, personal knowledge management</code>',
    docs_knowledgeStructuring_014: '⚡ ルーティングの仕組み',
    docs_knowledgeStructuring_015:
      'ブラウザで [<strong>分析</strong>] をクリックすると、NutEgg の AI が<code>_index.md</code> を読み取り、どのegg (ある場合) がコンテンツに一致するかを判断します。一致する既存の egg がない場合、NutEgg は、ページのトピックからシードされた新しい egg を自動的に作成することを提案します。',
    docs_knowledgeStructuring_016: 'Egg ファイルの構造と命令の仕組み',
    docs_knowledgeStructuring_017:
      '<strong>Egg ファイル</strong> (<code>nutegg/*.md</code> に保存されている) は 2 つの重要な役割を果たします。それは、ドメインの厳選され進化するナレッジ リポジトリであり、コンテンツがそのトピックに触れるたびに NutEgg の AI パイプラインを制御するアクティブ プロンプト仕様の両方です。',
    docs_knowledgeStructuring_018: '1. 構造設計図',
    docs_knowledgeStructuring_019:
      'すべての egg ファイルは、YAML メタデータ、命令を含む Obsidian コールアウト ブロック、厳選されたナレッジ ツリー、および未処理のステージング バッファーを組み合わせます。',
    docs_knowledgeStructuring_020:
      '<code>---\ntopic: "AI Architecture & Multi-Agent Systems"\nstatus: "active"\nlast_updated: "2026-09-10"\n---\n\n> [!abstract]- Instructions:\n> **Scope:** Multi-agent architectures, tool calling, memory layers, and LLM evaluation.\n> **Action Guide:** Focus on actionable design patterns, scalability tradeoffs, and real failure modes.\n> **Key Questions:**\n> 1. How are agent memory loops bounded to prevent context window overflow?\n> 2. What coordination mechanism is used between subagents?\n> **Worth Reading If:**\n&gt; - Practical examples and substantive explanations.\n&gt; **Skip If:**\n> - Ignore basic beginner tutorials or high-level sales pitches without technical substance.\n> - Discard speculative claims lacking empirical benchmarks or code evidence.\n> **Formatting Rules:**\n> - Prefix each insight with a bracketed tag: `[concept]`, `[architecture]`, `[method]`, `[benchmark]`, `[explain]`, `[fact]`, `[example]`.\n> - Use the structure: `- [tag] **Concept Name**` followed by an indented explanation and concrete examples (`- 🎯 Example:`).\n\n# Knowledge\n## Agent Memory\n- [architecture] **Bounded Replay Buffers**\n    - Ephemeral short-term memory expires after session goals terminate to conserve token budget.\n    - 🎯 Example: Tool calling trace logs stored in vector stores with sliding window eviction.\n\n# Unprocessed\n(Newly hatched insights land here from captures until auto-merged)</code>',
    docs_knowledgeStructuring_021: '2. Egg 説明書の書き方',
    docs_knowledgeStructuring_022:
      '<code>&gt; [!abstract]- Instructions:</code> コールアウトには 6 つの専門フィールドが含まれています。それぞれが AI パイプラインの特定の段階をガイドします。',
    docs_knowledgeStructuring_023: 'フィールド',
    docs_knowledgeStructuring_024: '目的とベストプラクティス',
    docs_knowledgeStructuring_025: 'ワークフローの使用法',
    docs_knowledgeStructuring_026: '<code>**Scope:**</code>',
    docs_knowledgeStructuring_027:
      'この egg の話題の境界を定義する 1 ～ 2 文。どのような概念、テクノロジー、または質問が含まれるか除外されるかを明示的に述べます。',
    docs_knowledgeStructuring_028:
      '<code>egg-analysis.md</code> (ステージ 2) に注入されるため、AI はこのドメイン レンズを通じて厳密に知識を抽出します。',
    docs_knowledgeStructuring_029: '<code>**Action Guide:**</code>',
    docs_knowledgeStructuring_030:
      'AI がコンテンツを要約して評価する方法に関する 1 ～ 5 つのステップの指示 (例: 特定の視点、深さ、またはトレードオフを求める)。省略した場合はデフォルトのガイドに戻ります。',
    docs_knowledgeStructuring_031: '<code>egg-analysis.md</code> (ステージ 2) に注入されます。',
    docs_knowledgeStructuring_032: '<code>**Key Questions:**</code>',
    docs_knowledgeStructuring_033:
      'コンテンツがこのドメインに関わるたびに回答が必要な繰り返しの質問の番号付きリスト (例: <em>「トークンのコストはいくらですか?」</em>、<em>「障害モードは何ですか?」</em>)。',
    docs_knowledgeStructuring_034:
      '<code>egg-analysis.md</code> (ステージ 2) に注入されます。 Chrome 拡張機能ポップアップで回答し、生のキャプチャ ノートに保存しました。',
    docs_knowledgeStructuring_035: '<code>**Worth Reading If:** / **Skip If:**</code>',
    docs_knowledgeStructuring_036:
      'オリジナルに時間を費やす価値がある場合と要約で十分な場合を説明する 2 つの設定リスト。',
    docs_knowledgeStructuring_037:
      'ステージ 2 の読書アクションをガイドします: 全文、ハイライト、概要、スキップ、または不明。マージ中にエントリを拒否することはありません。',
    docs_knowledgeStructuring_038: '<code>**Formatting Rules:**</code>',
    docs_knowledgeStructuring_039:
      '書式設定の標準: 括弧で囲まれたタグ (<code>[concept]</code>、<code>[architecture]</code>、<code>[method]</code> など) および階層的な箇条書きのインデント。',
    docs_knowledgeStructuring_040:
      '<code>egg-analysis.md</code> (ステージ 2) に注入されます。候補エントリがノートの書式設定規則と一致することを保証します。',
    docs_knowledgeStructuring_041: '3. 厳選されたナレッジ ツリーと未処理のキュー',
    docs_knowledgeStructuring_042:
      'NutEgg は、厳選された知識を新しいキャプチャから分離することで、知識ベースを AI 汚染から保護します。',
    docs_knowledgeStructuring_043:
      '<strong><code># Knowledge</code> (厳選されたツリー):</strong> Markdownの見出しとネストされた箇条書きで構造化されています。マージのみがこのツリーを読み取り、個別の例、警告、意見の相違、およびソースを保持しながら同等の主張を統合します。ステージ 2 は、ツリーと比較せずに指示に従います。',
    docs_knowledgeStructuring_044:
      '<strong><code># Unprocessed</code> (ステージング キュー):</strong> ブラウザーで <strong>🥚 ハッチング Egg</strong> をクリックすると、承認されたエントリとサポートされている回答が、厳選された階層に直接触れるのではなく、安全に <code># Unprocessed</code> に追加されます。',
    docs_knowledgeStructuring_045: '4. ワークフローでの各パーツの使用方法',
    docs_knowledgeStructuring_046:
      '最初のキャプチャから最終合成まで、Web コンテンツが egg 命令に従ってどのように流れるかを次に示します。',
    docs_knowledgeStructuring_047:
      '<code>[Captured Web Content]\n          │\nStage 1   ▼   _index.md (Topic routing guide)\n─────────────────────────────────────────────────────────────\n• Uses content-task-default.md\n• Generates Title Verdict, 3-Bullet Summary, Mind Map\n• egg-routing.md matches target eggs via Stage 1 summary\n          │\n          ▼\nUser Review: Confirm or select target eggs in popup\n          │\nStage 2   ▼   Target Egg File (nutegg/*.md)\n─────────────────────────────────────────────────────────────\n• Scope, Key Questions, Formatting Rules ──► egg-analysis.md\n  (Extracts candidate knowledge entries and answers questions)\n• Worth Reading If / Skip If guide the reading recommendation\n  (Full, highlights, summary, skip, or uncertain; no tree comparison)\n          │\n          ▼\nHatch Egg: Approved entries and supported answers appended to # Unprocessed\n          │\nMerge Cycle (20+ entries or manual button)\n─────────────────────────────────────────────────────────────\n• merge-unprocessed.md nests and integrates entries into # Knowledge</code>',
    docs_knowledgeStructuring_048: '知識の自動マージ',
    docs_knowledgeStructuring_049:
      '<code># Unprocessed</code> に 20 以上のエントリが蓄積すると (または、Obsidian 読み取りビュー ウィジェットで <strong>Merge</strong> をクリックすると)、NutEgg の AI は <code>merge-unprocessed.md</code> を使用して自動バックグラウンド合成を実行します。 <code># Knowledge</code> の適切な親概念の下で保留中のエントリを分類、重複排除、ネストして、ナレッジ グラフを永続的に整理します。',
    docs_obsidianPlugin_001: 'Obsidian プラグインガイド — NutEgg',
    docs_obsidianPlugin_002: 'Obsidian コミュニティプラグイン ↗',
    docs_obsidianPlugin_003: 'Chrome ウェブストア ↗',
    docs_obsidianPlugin_004: 'プラグインのリリース',
    docs_obsidianPlugin_005: 'プライバシーポリシー',
    docs_obsidianPlugin_006: 'Obsidian プラグインの設定',
    docs_obsidianPlugin_007:
      'NutEgg Obsidian プラグインは、ローカル同期サーバーをホストし、AI 通信を管理し、受信コンテンツをナレッジ ツリーと照合し、Vault ファイルを維持します。',
    docs_obsidianPlugin_008: 'インストール',
    docs_obsidianPlugin_009: 'オプション 1: Obsidian コミュニティ プラグイン (推奨)',
    docs_obsidianPlugin_010: 'NutEgg は、Obsidian コミュニティ プラグイン ディレクトリに正式にリストされています。',
    docs_obsidianPlugin_011: 'Obsidian で、<strong>設定 → コミュニティプラグイン</strong> を開きます。',
    docs_obsidianPlugin_012:
      '<strong>制限モード</strong> がオフになっていることを確認し、<strong>参照</strong> をクリックします。',
    docs_obsidianPlugin_013:
      '<strong>NutEgg</strong> を検索します（または <a href="https://community.obsidian.md/plugins/nutegg" target="_blank" rel="noopener"\n              >Obsidian コミュニティプラグインの NutEgg</a> にアクセスします）。',
    docs_obsidianPlugin_014:
      '[<strong>インストール</strong>] をクリックし、[<strong>有効化</strong>] をクリックします。',
    docs_obsidianPlugin_015: 'オプション 2: 手動インストール',
    docs_obsidianPlugin_016:
      '<a href="https://github.com/staff-000/nutegg-obsidian-release/releases" target="_blank" rel="noopener"\n              >NutEgg Obsidian プラグイン リリース</a\n            > から <code>main.js</code>、<code>manifest.json</code>、<code>styles.css</code> をダウンロードします。',
    docs_obsidianPlugin_017:
      'Obsidian 保管庫で、<code>.obsidian/plugins/</code> を開きます (必要に応じて OS の隠しフォルダーを表示します)。',
    docs_obsidianPlugin_018:
      '<code>nutegg</code> という名前の新しいディレクトリを作成し、その中に 3 つのファイルを配置します: <pre><code>your-vault/.obsidian/plugins/nutegg/\n├── main.js\n├── manifest.json\n└── styles.css</code></pre>',
    docs_obsidianPlugin_019:
      'Obsidian で、<strong>設定 → コミュニティプラグイン</strong> を開き、<strong>再読み込み</strong> をクリックして、<strong>NutEgg</strong> をオンに切り替えます。',
    docs_obsidianPlugin_020: 'オプション 3: BRAT を使用する',
    docs_obsidianPlugin_021:
      '<a href="https://github.com/tfthacker/obsidian42-brat" target="_blank" rel="noopener">BRAT</a>コミュニティプラグインをObsidianにインストールします。',
    docs_obsidianPlugin_022: '<strong>設定 → BRAT → ベータプラグインの追加</strong> に移動します。',
    docs_obsidianPlugin_023:
      '<code>staff-000/nutegg-obsidian-release</code> と入力し、<strong>プラグインの追加</strong> をクリックします。',
    docs_obsidianPlugin_024: 'インストールしたら、NutEgg を有効にします。',
    docs_obsidianPlugin_025: 'AI 実行アーキテクチャ',
    docs_obsidianPlugin_026:
      'NutEgg はインテリジェントなデュアル実行アーキテクチャ (プロトコル 3) を使用しており、API キーの持ち込みによるプライバシーとゼロキー サブスクリプションの利便性の間で完全な柔軟性を提供します。',
    docs_obsidianPlugin_027: '🔒 コアプライバシー不変条件: API キーは決して離れない Chrome',
    docs_obsidianPlugin_028:
      '<strong>接続 API モード</strong> では、Obsidian はボールト操作、プロンプトアセンブリ、egg インデックス作成を調整しますが、<strong> は認証されたローカル WebSocket を介してすべての AI コールを Chrome</strong> に委任します。 Chrome は、ローカルに保存された API キーを使用して呼び出しを実行します。 API キーが Obsidian に送信されることはなく、Vault ノートに書き込まれることも、ブラウザーを離れることもありません。',
    docs_obsidianPlugin_029:
      '<code>┌─────────────────────────────────────────────────────────────────────────────┐\n│                           CONNECTED API MODE (Default)                      │\n│                                                                             │\n│  Chrome Profile A ──(1) HTTP /analyze /confirm──►  Obsidian Plugin          │\n│  (Holds API Key A)                                 (127.0.0.1:27123)        │\n│                                                            │                │\n│                   ◄─(2) WebSocket AI Call /socket──────────┤ Reads _index.md│\n│  Calls Provider A                                          │ Assembles prompt│\n│  (OpenAI / Claude / Gemini / DeepSeek)                     │                │\n│                   ──(3) Authenticated Result─────────────► │                │\n│                                                            ▼                │\n│  Receives Final Result ◄──────(4) HTTP Result────── Saves to Vault          │\n│                                                     (_raw/ & &lt;egg&gt;.md)      │\n└─────────────────────────────────────────────────────────────────────────────┘\n\n┌─────────────────────────────────────────────────────────────────────────────┐\n│                       SHARED SUBSCRIPTION MODE (Zero API Keys)              │\n│                                                                             │\n│  Chrome Profile A ────┐                                                     │\n│                       ├──► Obsidian Plugin (127.0.0.1:27123)                │\n│  Chrome Profile B ────┘        │                                            │\n│                                ▼                                            │\n│                       SubscriptionService (Local CLI or OAuth)              │\n│                       ├── ChatGPT Sign-In (OpenAI Responses API)            │\n│                       ├── Codex CLI (@openai/codex)                         │\n│                       ├── Claude Code CLI (claude auth login)               │\n│                       └── Google Gemini (Antigravity CLI: agy)              │\n└─────────────────────────────────────────────────────────────────────────────┘</code>',
    docs_obsidianPlugin_030: 'モード 1: 接続 API モード (デフォルト)',
    docs_obsidianPlugin_031:
      'このモードでは、<strong>Chrome 拡張オプション</strong> で AI プロバイダーと API キーを直接構成します。 Obsidian はナレッジ ワークフローを調整し、Chrome は安全なローカル AI ランナーとして機能します。',
    docs_obsidianPlugin_032:
      '<strong>サポートされているクラウドプロバイダー</strong>: Anthropic (Claude 3.5 Sonnet、Claude 3.7 Sonnet)、OpenAI (GPT-4o、o シリーズ)、Google Gemini (2.0 Flash、2.5 Pro)、DeepSeek (V3、R1)、Kimi、クウェン、ジプ、そしてOpenRouter。',
    docs_obsidianPlugin_033:
      '<strong>ローカル LLM (Ollama、LM Studio、llama.cpp、vLLM)</strong>: Chrome でローカル エンドポイントを直接構成します。 NutEgg は、マシンの外部にデータを送信せずにローカル モデルに接続します。',
    docs_obsidianPlugin_034:
      '<strong>独立した Chrome プロファイル</strong>: 複数の Chrome プロファイル (仕事用と個人用など) を使用する場合、各プロファイルは独自のプロバイダー、モデル、API キーを使用できます。これらはキーの衝突なしに同じ Obsidian ボールトに接続します。',
    docs_obsidianPlugin_035:
      '<strong>Obsidian-ネイティブ アクション</strong>: Vault のみのメンテナンス タスク (Obsidian に手動でマージするegg など) は、Obsidian の <code>SecretStorage</code> に安全に保存されているネイティブ設定を使用します。接続された Chrome プロファイルで <strong>保存して続行</strong> をクリックすると、SecretStorage のネイティブ アカウントが安全に更新されます。',
    docs_obsidianPlugin_036: 'モード 2: 共有サブスクリプション モードと ChatGPT サインイン',
    docs_obsidianPlugin_037:
      'API キーやトークンごとの支払いクレジットを管理したくないですか? NutEgg は、直接サインインと、Obsidian 内で管理されるローカル開発者 CLI サブスクリプションをサポートします。',
    docs_obsidianPlugin_038: 'オプション A: ダイレクト ChatGPT サインイン (CLI は必要ありません)',
    docs_obsidianPlugin_039: 'Obsidianで、<strong>設定→NutEgg</strong>を開きます。',
    docs_obsidianPlugin_040: '<strong>AI 接続</strong> で、<strong>ChatGPT サインイン</strong> を選択します。',
    docs_obsidianPlugin_041:
      '<strong>ChatGPT を続行</strong> をクリックし、ブラウザーの認証フローを完了し、プランの使用を許可します。',
    docs_obsidianPlugin_042: 'アカウント モデル (例: <code>gpt-4o</code>) を選択します。',
    docs_obsidianPlugin_043:
      '接続されたすべての Chrome プロファイルは、API キーのセットアップなしでこの接続の直後に続きます。資格情報はインストールごとの OS キーチェーン ストレージに安全に保存され、Chrome に送信されたり、ボールト ファイルに保存されたりすることはありません。',
    docs_obsidianPlugin_044: 'オプション B: ローカル CLI サブスクリプション (Codex、Claude、Gemini)',
    docs_obsidianPlugin_045:
      'NutEgg は、マシンにすでにインストールされログインしている公式の開発者 CLI ツールを実行できます。',
    docs_obsidianPlugin_046: 'プロバイダー',
    docs_obsidianPlugin_047: 'CLI のインストール',
    docs_obsidianPlugin_048: '認証',
    docs_obsidianPlugin_049: 'モデルの発見',
    docs_obsidianPlugin_050: '<strong>Codex CLI</strong>',
    docs_obsidianPlugin_051: '<code>npm install -g @openai/codex</code>',
    docs_obsidianPlugin_052: '<code>codex login</code>',
    docs_obsidianPlugin_053: 'アプリサーバー経由で自動',
    docs_obsidianPlugin_054: '<strong>人里離れたClaude</strong>',
    docs_obsidianPlugin_055:
      '<a href="https://code.claude.com/docs/en/quickstart" target="_blank" rel="noopener">Claude コード</a>',
    docs_obsidianPlugin_056: '<code>claude auth login --claudeai</code>',
    docs_obsidianPlugin_057: 'ソネット、オーパス、俳句、またはカスタム ID',
    docs_obsidianPlugin_058: '<strong>グーグルGemini</strong>',
    docs_obsidianPlugin_059:
      '<a href="https://antigravity.google/docs/cli/install" target="_blank" rel="noopener">反重力 CLI</a>',
    docs_obsidianPlugin_060: '<code>agy</code> ブラウザの流れ',
    docs_obsidianPlugin_061: '<code>agy models</code> 経由で自動',
    docs_obsidianPlugin_062:
      'Obsidian 設定 → NutEgg で、<strong>AI 接続</strong> で CLI を選択するだけです。 NutEgg の内部 <code>SubscriptionService</code> は、有界シリアル キューでローカルに推論を実行します。別個のブリッジ サーバーやポート 27124 は必要ありません。',
    docs_obsidianPlugin_063: 'ローカル同期サーバーとセキュリティ',
    docs_obsidianPlugin_064:
      'プラグインが有効になると、<code>127.0.0.1:27123</code> でバックグラウンド HTTP および WebSocket リスナーが自動的に起動します。',
    docs_obsidianPlugin_065: '🔒 プライバシーとオリジンのセキュリティ',
    docs_obsidianPlugin_066:
      'ローカル サーバーは、ローカルホスト ループバック アドレス (<code>127.0.0.1</code>) に厳密にバインドします。厳密な <code>X-NutEgg-Extension-Origin</code> とトークンの検証が強制され、通常の Web ページがボールトにアクセスするのを防ぎます。 WebSocket 接続は最初のフレームで認証されます。',
    docs_obsidianPlugin_067: 'ワークフローと即時カスタマイズ',
    docs_obsidianPlugin_068:
      'NutEgg は、<code>nutegg/_workflow/</code> のボールトに直接保存されているモジュール式の編集可能な Markdown プロンプトを通じて AI 分析を強化します。',
    docs_obsidianPlugin_069:
      '<strong>編集可能なテンプレート</strong>: コンテンツ分析、egg 比較、ルーティング、およびフォローアップのためのプロンプトをカスタマイズします。',
    docs_obsidianPlugin_070:
      '<strong>非破壊更新</strong>: NutEgg が更新されたプロンプト テンプレートをリリースすると、カスタマイズされたワークフローは上書きされることなく自動的に保存されます。',
    docs_workflow_001: 'AI ワークフローとプロンプトエンジン — NutEgg',
    docs_workflow_002: 'Chrome ウェブストア ↗',
    docs_workflow_003: 'Obsidian プラグイン ↗',
    docs_workflow_004: 'リリース',
    docs_workflow_005: 'プライバシーポリシー',
    docs_workflow_006: 'AI ワークフローとプロンプトエンジン',
    docs_workflow_007:
      'NutEgg のモジュラー ワークフロー エンジンが、コンテンツ抽出、概要ベースの egg ルーティング、指示主導の分析、ユーザーがカスタマイズ可能なプロンプトをどのように調整するかを学びましょう。',
    docs_workflow_008: '2 段階のアーキテクチャ',
    docs_workflow_009:
      'NutEgg は、単一のモノリシック プロンプトを実行するのではなく、トークンの効率、高い抽出精度、完全なユーザー制御を目的に設計された <strong>2 段階アーキテクチャ</strong> を使用します。',
    docs_workflow_010:
      '<code>                    ┌───────────────────────────────┐\n                    │      Captured Web Content     │\n                    │   (Article / YouTube / Tweet) │\n                    └───────────────┬───────────────┘\n                                    │\n                                    ▼\n       ===========================================================\n       STAGE 1: Content & Discussion Analysis + Egg Routing\n       ===========================================================\n            │                                             │\n            ├─► Content Analysis                          ├─► Discussion Analysis\n            │   (Is content >30k chars?)                  │   (When 💬 Discussion enabled\n            │    ├── No  ──► [content-analysis.md]        │    & comments captured)\n            │    └── Yes ──► Chunks + [aggregate-         │    ├── [discussion-analysis.md]\n            │                content.md]                  │    └── [aggregate-discussion.md]\n            │                                             │\n            └──────────────────────┬──────────────────────┘\n                                   │\n                                   ▼\n        Produces: Title Verdict, 3-Bullet Summary, Mind Map,\n        Timestamped Q&A, and Discussion Topics/Stances\n                                   │\n                                   ▼\n                          [egg-routing.md]\n          (Routes matched eggs from _index.md using the\n           concise Stage 1 summary instead of raw content)\n                                    │\n                                    ▼\n       ===========================================================\n       INTERACTIVE CHOICE / EXECUTION MODE (Chrome Extension)\n       ===========================================================\n                                    │\n                        Which mode is selected?\n                                    │\n            ┌───────────────────────┼───────────────────────┐\n            ▼                       ▼                       ▼\n     [Standalone Mode]         [🌞 Full Mode]      [🌛 Preview Summary]\n     Obsidian is offline.      Auto-proceeds to    User reviews matched eggs:\n     Runs Stage 1 in Chrome    Stage 2 with all    ├── "Collect Nut Only"\n     with user\'s API key.      matched eggs.       └── Add/remove eggs ──► Proceed\n     (Fast reading & Q&A)           │                       │\n            │                       └───────────┬───────────┘\n            ▼                                   ▼\n    Results in Side Panel      ===========================================================\n    (No Stage 2 analysis)    STAGE 2: Per-Egg Instruction-Driven Analysis\n                               ===========================================================\n                                                │\n                                   For each confirmed egg (1 or N):\n                                                │\n                                                ▼\n                                        [egg-analysis.md]\n                                  (Extract candidate knowledge entries\n                                   & key questions scoped to this egg)\n                                                │\n                                                ▼\n                                  (Answers + extracted entries + reading action)\n                                                │\n                                                ▼\n                                     Results returned to Popup\n                                     (Ready to Save Nut & Eggs)</code>',
    docs_workflow_011: '💡 サマリーベースのルーティングを使用する理由',
    docs_workflow_012:
      '完全な生の記事や数時間のビデオトランスクリプトの代わりにステージ 1 の概要を使用してルーティング eggs を行うと、実行ごとに数万のトークンが節約され、抽出された高シグナルのセマンティックテーマに焦点を当てることでルーティングの精度が向上します。',
    docs_workflow_013:
      'サイド パネルのクロスタブ インジケーターには、現在の Chrome ウィンドウで実行中の分析と未読の完了した結果が表示されます。クリックするとタブがリストされ、その結果または進行状況に直接切り替わります。結果は、分析がアクティブなタブに表示されると読み取られます。トラッキングはパネルが開いている間継続し、パネルが閉じるとリセットされます。',
    docs_workflow_014:
      'Hatch は元の分析をアーカイブし、承認されたエントリを <code># Unprocessed</code> に追加します。 Merge は 20 個の保留中のエントリで実行されるか、オンデマンドで実行され、ソース、警告、例、意見の相違を維持しながら、フラグメントを組み立ててクレームの重複を排除します。ステージ 2 はナレッジ ツリーを受け取らないため、推奨事項は新規性ではなく関連性と実質を評価します。',
    docs_workflow_015:
      '<strong>🍃 ナレッジ</strong> セクション オプションと Egg 分析ドロップダウンは、現在のブラウザ タブの 1 つの設定を共有します。 <strong>🥚 分析のみ</strong> はナレッジをオフに切り替え、<strong>🍃 ナレッジを含める</strong> はオンに切り替えます。ドロップダウンの選択肢を切り替えると、AI 呼び出しを自動トリガーせずに設定とボタンのラベルが更新されます。ボタンをクリックして分析します。ナレッジ エントリなしで以前に分析された egg のナレッジを含めるに切り替えると、NutEgg はキャッシュされた回答のみの結果を単に表示するのではなく、ステージ 2 を再実行します。 「知識を​​含める」が初期デフォルトです。最後に選択した内容が、分析を行わないタブのデフォルトになります。このオプションをオフにしても、以前に生成されたエントリが非表示になったり、保存できなくなったりすることはありません。ナレッジをオフにすると、選択したすべての egg のエントリが無効になります。これをオンにすると、許可されている eggs のエントリのみが許可されます: <code>Generate Knowledge Entries: no</code> または egg のアクション ガイドのオプトアウトが優先されます。重要な回答と推奨事項は、どちらの方法でも利用できます。分析ではエントリは保存されません。 <strong>🐣 ハッチング Egg</strong> は、生成されたエントリを egg ファイルに保存します。',
    docs_workflow_016: 'ワークフローモード',
    docs_workflow_017: 'モード',
    docs_workflow_018: '行動',
    docs_workflow_019: '最適な用途',
    docs_workflow_020: '<strong>📱 スタンドアロンモード</strong>',
    docs_workflow_021:
      'ステージ 1 のコンテンツ分析を Chrome で直接実行します (Obsidian がオフラインまたは閉じている場合)。評決、3 文の要約、クリック可能なタイムスタンプ付きのマインド マップ、タイムスタンプ ジャンプ付きのインタラクティブなビデオ Q&amp;A を作成します。ステージ 2 egg の分析をスキップします。',
    docs_workflow_022: 'ウェブやビデオの高速な読み取り、素早い理解、またはメモのアーカイブが必要ない場合。',
    docs_workflow_023: '<strong>🌞 フルモード</strong>',
    docs_workflow_024:
      'ステージ 1 のコンテンツ分析を実行し、eggs を <code>_index.md</code> 経由で自動的にルーティングし、中断のない 1 つのパスでステージ 2 egg の分析を直ちに実行します。',
    docs_workflow_025: 'egg 自動マッチングを信頼すると、毎日の読書と簡単なキャプチャが可能になります。',
    docs_workflow_026: '<strong>🌛 プレビューの概要</strong>',
    docs_workflow_027:
      'ステージ 1 のコンテンツ分析を実行し、ポップアップで一時停止します。一致した eggs を Vault の完全な egg リストと並べて表示します。 eggs を追加/削除したり、知識の比較を続行したり、<strong> Nut のみを収集</strong> をクリックしたりできます。',
    docs_workflow_028: '深い調査、曖昧なトピック、または egg ナレッジ ツリーを更新せずに簡単な概要だけが必要な場合。',
    docs_workflow_029: 'AI の実行と認証プロトコル',
    docs_workflow_030:
      'フル モードを選択するかプレビュー概要を選択するかに関係なく、NutEgg は、<em>ワークフロー オーケストレーション</em> を <em>資格情報ストレージと AI 推論</em> から分離します。',
    docs_workflow_031:
      '<strong>接続 API モード (デフォルト)</strong>: Obsidian はプロンプト テンプレートの挿入と知識の比較を調整しますが、推論リクエストは認証された WebSocket (<code>/execution/socket</code>) 経由で Chrome に送信されます。 Chrome は、ローカル API キーを使用して LLM 呼び出しを実行し、認証された結果を送り返します。 <strong>API キーが外部に残ることはありません Chrome.</strong>',
    docs_workflow_032:
      '<strong>共有サブスクリプション モード</strong>: Obsidian はワークフローを調整し、公式開発者 CLI ツール (<code>codex</code>、<code>claude</code>、<code>agy</code>) または直接 ChatGPT OAuth サインインを使用して AI 呼び出しをローカルで直接実行します。接続されているすべての Chrome プロファイルは、API キーを必要とせずにこのサブスクリプションを共有します。',
    docs_workflow_033: 'Vault 内のワークフロー ファイル',
    docs_workflow_034:
      'NutEgg は、そのプロンプト テンプレートを Vault 内の <code>nutegg/_workflow/</code> にシードします。',
    docs_workflow_035: '1. 共有フラグメント (他のプロンプトに挿入)',
    docs_workflow_036:
      '<code>shared-output-rules.md</code>: グラウンディング指令 (唯一の真実としてのソースコンテンツ) および多言語出力言語参照規則。 <code>{{shared_output_rules}}</code> として注入されます。',
    docs_workflow_037:
      '<code>content-task-default.md</code>: タイトルの評決、3 つの箇条書きの概要、クリック可能なタイムスタンプ付きのマインド マップに関する主要なタスクの指示。 <code>{{content_task_default}}</code> として注入されます。',
    docs_workflow_038: '2. コンテンツのキャプチャと比較のパイプライン',
    docs_workflow_039:
      '<code>content-analysis.md</code>: ステージ 1 のコンテンツの概要、クリックベイト対策の判定、クリック可能なタイムスタンプ付きのインタラクティブなマインド マップ、およびタイムスタンプの引用付きのカスタム質問回答。',
    docs_workflow_040:
      '<code>egg-routing.md</code>: ステージ 1 の概要を <code>_index.md</code> の egg の説明と照合して、候補 eggs を選択します。',
    docs_workflow_041:
      '<code>egg-analysis.md</code>: egg ごとのステージ 2。egg の指示の範囲内で候補となる知識エントリと重要な質問の回答を抽出します。',
    docs_workflow_042:
      '「読む価値がある場合」および「スキップする場合」ガイドの全文を読む、ハイライト、概要が十分である、スキップする、または不確実である。有用な回答は、推奨事項に関係なく保存可能です。',
    docs_workflow_043:
      '<code>aggregate-content.md</code> および <code>aggregate-egg.md</code>: 長いコンテンツ (&gt;30,000 文字) の集約。ステージ 2 では、回答の下書き、推奨事項、およびカバレッジのみを組み合わせます。抽出されたエントリは、マージされるまでソース順に残ります。',
    docs_workflow_044: '3. ディスカッション分析 (ステージ 1)',
    docs_workflow_045:
      'ディスカッション分析は、拡張オプションまたはポップアップ分析セクションで <strong>💬 ディスカッション</strong> セクションが有効になっている場合、<strong>ステージ 1</strong> コンテンツ分析の一部として実行され、ページ抽出機能が読者のコメントまたはソーシャル返信 (例: YouTube コメント、Twitter の返信、Reddit/フォーラム スレッド、Bilibili) をキャプチャします。コメント、または Zhihu の回答)。',
    docs_workflow_046:
      '<code>discussion-analysis.md</code>: コメントをバッチで分析して、3 ～ 5 つの主要な議論トピックを抽出し、コメント投稿者のスタンスを分類し (<code>agree</code>、<code>disagree</code>、<code>mixed</code>、<code>neutral</code>、<code>unclear</code>)、貴重な直接経験の補足や修正を強調表示します (<code>supplement: true</code>)。',
    docs_workflow_047:
      '<code>aggregate-discussion.md</code>: 大規模なフォーラムまたはビデオ コメント セクションのマルチバッチ コメント スレッドにわたるトピックとスタンスの分布をマージおよび合成します。',
    docs_workflow_048:
      '<strong>コンテキスト フロー:</strong> 分析されたディスカッションの概要と証拠アイテムはステージ 1 の結果で返され、カスタム Q&amp;A またはフォーラム本文の分析に直接フィードされます (ディスカッション中心のページやトランスクリプトのないビデオには重要です)。また、コンテキスト信号としてステージ 2 <code>egg-analysis.md</code> に転送されるため、eggs はソース コンテンツとともにコミュニティのフィードバックを評価できます。',
    docs_workflow_049: '4. インタラクティブなメンテナンスワークフロー',
    docs_workflow_050:
      '<code>follow-up.md</code>: 以前の会話履歴とクリック可能なビデオ タイムスタンプ ジャンプを備えたサイド パネルのインタラクティブな自然言語 Q&amp;A。',
    docs_workflow_051:
      '<code>merge-unprocessed.md</code>: 20 個以上の保留中のエントリで手動または自動でトリガーされ、生のアイテムを整理して <code># Knowledge</code> にネストします。',
    docs_workflow_052:
      '<code>localize-egg.md</code>: 英語の構造見出しを維持しながら、新しい egg テンプレートを外国語に翻訳します。',
    docs_workflow_053: '安全なカスタマイズのガイドライン',
    docs_workflow_054: '⚠️保存すべきもの',
    docs_workflow_055:
      'プロンプトのトーン、視点、深さを自由にカスタマイズできます。ただし、<strong>次の</strong> を保存する必要があります。',
    docs_workflow_056:
      'すべての <code>{{placeholder}}</code> タグ (例: <code>{{content}}</code>、<code>{{knowledge_tree}}</code>、<code>{{title}}</code>)。',
    docs_workflow_057:
      '正確な JSON 出力キー (例: <code>titleVerdict</code>、<code>extractedEntries</code>、<code>mindMap</code>)。これにより、パーサーは応答を逆シリアル化できます。',
    docs_workflow_058: 'Markdown 出力の構造見出し（<code># Knowledge</code>、<code># Unprocessed</code>）。',
    docs_workflow_059: '競合のない更新とリセット',
    docs_workflow_060: 'NutEgg が新しいバージョンに更新される場合:',
    docs_workflow_061: '<strong>未編集のプロンプト</strong>: 最新の組み込みバージョンに自動的に更新されます。',
    docs_workflow_062:
      '<strong>カスタマイズされたプロンプト</strong>: 編集内容が上書きされることはありません。 NutEgg はファイルと一緒に <code>[filename].new.md</code> を書き込むので、自分のペースで新しい追加を確認できます。',
    docs_workflow_063:
      '<strong>工場出荷時設定へのリセット (「デフォルトを使用」)</strong>: 新たにスタートする必要がありますか? <strong>Obsidian 設定 → NutEgg</strong> で、<strong>デフォルトを使用</strong> をクリックします。既存のプロンプトはすべて <code>nutegg/_workflow/_backup/&lt;timestamp&gt;/</code> に安全にバックアップされ、工場出荷時のデフォルト設定が復元されます。',
  },
  ko: {
    docs_chromeExtension_001: 'Chrome 확장 프로그램 가이드 — NutEgg',
    docs_chromeExtension_002: 'Chrome 웹 스토어 ↗',
    docs_chromeExtension_003: 'Obsidian 플러그인 ↗',
    docs_chromeExtension_004: '🎬 프로모션 영상 ↗',
    docs_chromeExtension_005: '확장 릴리스',
    docs_chromeExtension_006: '개인 정보 보호 정책',
    docs_chromeExtension_007: 'Chrome 확장 프로그램 설정 및 사용법',
    docs_chromeExtension_008:
      'NutEgg Chrome 확장 프로그램은 브라우저의 측면 패널에 위치하여 주문형 콘텐츠 추출, 클릭 가능한 타임스탬프가 포함된 YouTube 마인드 맵, Obsidian에 대한 원클릭 캡처 기능을 제공합니다.',
    docs_chromeExtension_009: '설치',
    docs_chromeExtension_010: '옵션 1: Chrome 웹 스토어(권장)',
    docs_chromeExtension_011:
      '공식 <a\n            href="https://chromewebstore.google.com/detail/nutegg/bmdmdiicembobejibggoeiahaonphcol"\n            target="_blank"\n            rel="noopener"\n            >Chrome 웹 스토어</a\n          >에서 클릭 한 번으로 NutEgg를 직접 설치하세요.',
    docs_chromeExtension_012:
      '<a\n              href="https://chromewebstore.google.com/detail/nutegg/bmdmdiicembobejibggoeiahaonphcol"\n              target="_blank"\n              rel="noopener"\n              >NutEgg Chrome 웹 스토어 페이지</a\n            >를 방문하세요.',
    docs_chromeExtension_013: '<strong>Chrome</strong>에 추가를 클릭하세요.',
    docs_chromeExtension_014:
      '편리한 측면 패널 액세스를 위해 Chrome 툴바에서 퍼즐 조각 아이콘을 클릭하고 <strong>NutEgg</strong>를 고정하세요.',
    docs_chromeExtension_015: '옵션 2: GitHub 릴리스(.zip)부터',
    docs_chromeExtension_016:
      '<a\n              href="https://github.com/staff-000/nutegg-chrome-extension-release/releases"\n              target="_blank"\n              rel="noopener"\n              >릴리스 페이지</a\n            >에서 최신 <code>nutegg-chrome-extension-*.zip</code>를 다운로드하세요.',
    docs_chromeExtension_017: '컴퓨터의 로컬 폴더에 아카이브의 압축을 풉니다.',
    docs_chromeExtension_018: 'Google Chrome을 열고 <code>chrome://extensions</code>로 이동하세요.',
    docs_chromeExtension_019: '오른쪽 상단에서 <strong>개발자 모드</strong>를 켜세요.',
    docs_chromeExtension_020:
      '<strong>Load unpacked</strong>를 클릭하고 <code>manifest.json</code>가 포함된 압축이 풀린 디렉터리를 선택합니다.',
    docs_chromeExtension_021:
      'Chrome 도구 모음에서 퍼즐 아이콘을 클릭하고 <strong>NutEgg</strong>를 고정하면 쉽게 액세스할 수 있습니다.',
    docs_chromeExtension_022: '측면 패널 워크플로',
    docs_chromeExtension_023: 'NutEgg 확장 프로그램 아이콘을 클릭하면 Chrome의 측면 패널이 열립니다.',
    docs_chromeExtension_024:
      '<strong>자동 추출</strong>: 탐색하는 동안 NutEgg는 활성 탭(YouTube 동영상, Twitter/X 스레드 또는 블로그 게시물)을 감지하고 해당 탭의 텍스트와 구조를 추출합니다.',
    docs_chromeExtension_025:
      '<strong>콘텐츠 새로고침(🔄)</strong>: 콘텐츠 미리보기에서 새로고침 버튼을 클릭하면 예기치 않게 미리보기에서 리디렉션되지 않고 동적 단일 페이지 앱의 페이지를 다시 추출할 수 있습니다.',
    docs_chromeExtension_026:
      '<strong>대상 Egg 선택기</strong>: 콘텐츠 미리보기에서 대상 지식 eggs을 선택하거나 "대상 eggs(기본적으로 자동 선택)"을 사용하여 AI가 관련 볼트 트리를 자동으로 일치시키도록 합니다.',
    docs_chromeExtension_027:
      '<strong>분석 모드</strong>: <ul> <li> <strong>전체 모드</strong>: 간소화된 단일 작업 흐름에서 콘텐츠를 평가하고 매칭에 대한 지식 매칭 eggs을 즉시 실행합니다. </li> <li> <strong>미리보기 모드</strong>: 1단계 개요(요약, 마인드맵, Q&amp;A, 토론)를 먼저 생성하여 필요에 따라 egg 지식 분석을 실행하기 전에 대상 eggs을 검사하거나 조정할 수 있습니다. </li> </ul>',
    docs_chromeExtension_028:
      '<strong>상태 표시</strong>: 녹색 점은 로컬 Obsidian 서버(<code>127.0.0.1:27123</code>)에 대한 연결 상태가 양호함을 나타냅니다. 빨간색인 경우 NutEgg 플러그인이 활성화된 상태에서 Obsidian가 실행 중인지 확인하세요.',
    docs_chromeExtension_029: 'YouTube 통합 및 스마트 내비게이션',
    docs_chromeExtension_030: 'YouTube 동영상 페이지에서 NutEgg는 다음을 추출합니다.',
    docs_chromeExtension_031: '<strong>전체 캡션 및 대본</strong>: 작성자 및 자동 생성된 대본에서 고정확도 자동 추출.',
    docs_chromeExtension_032:
      '<strong>클릭 가능한 타임스탬프가 포함된 마인드 맵</strong>: 활성 YouTube 동영상 플레이어를 해당 세그먼트로 직접 검색하는 클릭 가능한 타임스탬프 버튼이 있는 즉각적인 분석입니다. 타임스탬프가 있으면 트리를 깨끗하게 유지하기 위해 중복 소스 태그가 숨겨집니다.',
    docs_chromeExtension_033:
      '<strong>Timestamp Jumping에 대한 Q&amp;A</strong>: 동영상에 대해 자연어로 질문하세요. NutEgg 동영상 재생 시 소스 순간으로 바로 이동하는 클릭 가능한 타임스탬프 알약으로 인용 답변을 제공합니다.',
    docs_chromeExtension_034:
      '<strong>클릭베이트 방지 평결</strong>: 동영상 제목의 전제에 대한 객관적인 1문장 답변으로, 즉시 보풀이를 건너뛸 수 있습니다.',
    docs_chromeExtension_035: '텍스트 내부 소스 탐색',
    docs_chromeExtension_036: '기사, 블로그, 포럼을 읽을 때:',
    docs_chromeExtension_037:
      '<strong>📍 소스로 이동</strong>: 텍스트 마인드맵 노드와 Q&amp;A 인용에는 소스 태그가 포함됩니다. 소스 태그를 클릭하면 라이브 웹페이지가 정확하게 일치하는 단락이나 인용문으로 자동 스크롤되고 개요로 간략하게 강조표시됩니다.',
    docs_chromeExtension_038:
      '<strong>댓글 탐색</strong>: 토론 페이지(Reddit, Zhihu 등)에서 출처 인용을 클릭하면 특정 댓글이나 답변으로 직접 스크롤됩니다.',
    docs_chromeExtension_039: '토론 분석 및 커뮤니티 관점',
    docs_chromeExtension_040: 'NutEgg는 YouTube, Reddit, Twitter/X, Zhihu 및 포럼의 공개 댓글을 분석합니다.',
    docs_chromeExtension_041:
      '<strong>주제 및 입장 분석</strong>: 입장 배지(동의 👍, 반대 👎, 혼합 🤔, 중립 ⚖️)와 반응 지표를 통해 핵심 토론 요점을 요약합니다.',
    docs_chromeExtension_042:
      '<strong>추가 통찰력</strong>: 증거, 주의 사항 또는 독특한 경험이 포함된 중요한 댓글이 간결한 추가 통찰력으로 보존됩니다.',
    docs_chromeExtension_043: 'Chrome-단독 독립형 모드(Obsidian 필요 없음)',
    docs_chromeExtension_044:
      'Obsidian가 설치되어 있지 않거나 현재 열려 있지 않습니까? NutEgg Google Chrome 내에서 완전히 독립형으로 작동합니다!',
    docs_chromeExtension_045: '⚡ 노트 오버헤드 없이 빠른 웹 읽기',
    docs_chromeExtension_046:
      'NutEgg는 무엇보다도 초고속 웹 독서 동반자로 설계되었습니다. 노트 볼트를 건드리지 않고도 Chrome에서 직접 기사나 YouTube 동영상에 대한 질문을 추출, 요약, 마인드 맵 생성하고 질문할 수 있습니다.',
    docs_chromeExtension_047: 'Chrome 독립 실행형에서 사용 가능한 기능:',
    docs_chromeExtension_048:
      '<strong>🎯 즉각적인 클릭베이트 방지 판정</strong>: 헤드라인 질문에 대한 객관적인 1문장 답변입니다.',
    docs_chromeExtension_049:
      '<strong>📝 전체 3문장 요약</strong>: 긴 기사나 동영상에서 추출한 고밀도 테이크아웃입니다.',
    docs_chromeExtension_050:
      '<strong>⏱️ 클릭 가능한 타임스탬프 및 검색 기능이 포함된 마인드 맵</strong>: 한 번의 클릭으로 주요 비디오 세그먼트로 이동합니다.',
    docs_chromeExtension_051:
      '<strong>💬 동영상 Q&amp;A 및 타임스탬프 점프</strong>: 질문을 하고 인용된 타임스탬프 알약을 클릭하면 동영상 재생을 해당 세그먼트로 직접 스크러빙할 수 있습니다.',
    docs_chromeExtension_052:
      '<strong>🧠 축소 가능한 마인드 맵</strong>: 핵심 아이디어를 시각적으로 분류하는 다층 대화형 사고 트리.',
    docs_chromeExtension_053: '<strong>🌐 50개 이상의 언어 지원</strong>: 외국어 콘텐츠를 즉시 추출하고 번역합니다.',
    docs_chromeExtension_054: 'Chrome 전용 모드 구성 방법:',
    docs_chromeExtension_055:
      'Chrome 툴바에서 <strong>NutEgg 확장 프로그램 아이콘</strong>을 마우스 오른쪽 버튼으로 클릭하고 <strong>옵션</strong>을 선택합니다.',
    docs_chromeExtension_056:
      '선호하는 AI 제공업체(예: Google Gemini, OpenAI, Claude, DeepSeek 또는 OpenRouter)를 선택하고 API 키를 입력하세요.',
    docs_chromeExtension_057: '<strong>저장</strong>을 클릭하세요. 모든 페이지를 분석할 준비가 되었습니다!',
    docs_chromeExtension_058: 'Obsidian 연결 및 AI 실행 모드',
    docs_chromeExtension_059:
      'Chrome 확장을 선택적 NutEgg Obsidian 플러그인에 연결하면 Chrome는 선택한 실행 모드에 따라 원활하게 조정됩니다.',
    docs_chromeExtension_060: '🔒 API 키 보안: 키는 절대로 떠나지 않습니다 Chrome',
    docs_chromeExtension_061:
      '<strong>연결된 API 모드</strong>에서는 API 키가 Chrome의 보안 확장 저장소 내에 엄격하게 보관됩니다. Obsidian는 지식 템플릿과 볼트 인덱싱을 관리하지만 인증된 로컬 WebSocket을 통해 AI 추론을 다시 Chrome에 위임합니다. Chrome 공급자 API를 로컬로 호출하고 생성된 텍스트만 반환합니다.',
    docs_chromeExtension_062: '실행 모드',
    docs_chromeExtension_063: 'AI가 실행되는 곳',
    docs_chromeExtension_064: '사용된 자격 증명',
    docs_chromeExtension_065: '<strong>Chrome-만</strong>',
    docs_chromeExtension_066: '바로 내부 Chrome',
    docs_chromeExtension_067: 'Chrome 옵션에 구성된 API 키',
    docs_chromeExtension_068: '<strong>연결된 API 모드</strong>',
    docs_chromeExtension_069: 'Chrome(Obsidian에 의해 로컬 WebSocket을 통해 위임됨)',
    docs_chromeExtension_070: 'Chrome의 API 키(키는 Obsidian로 전송되지 않음)',
    docs_chromeExtension_071: '<strong>공유 구독 모드</strong>',
    docs_chromeExtension_072: 'Obsidian 내부(로컬 CLI 또는 ChatGPT OAuth를 통해)',
    docs_chromeExtension_073: 'API 키 없음(Codex, Claude 코드, 반중력 또는 ChatGPT 사용)',
    docs_chromeExtension_074: '다중 프로필 Chrome 지원',
    docs_chromeExtension_075:
      'NutEgg는 동일한 Obsidian 볼트에 동시에 연결되는 여러 Chrome 브라우저 프로필(예: 개인 및 업무)을 지원합니다. 각 Chrome 프로필은 자체 공급자, 모델 및 API 키를 독립적으로 유지합니다. 실행 모드를 연결하거나 전환하면 프로필 간에 API 키가 누출되거나 덮어쓰이지 않습니다.',
    docs_chromeExtension_076: '오프라인 및 연결 끊김 복구',
    docs_chromeExtension_077:
      '연결 모드가 활성화된 동안 Obsidian이 닫히면 NutEgg에 선명한 상태 표시등이 표시되고 원클릭 <strong>"대신 Chrome 모드 사용"</strong> 옵션이 제공됩니다. 이를 통해 중단이나 할당량 위험 없이 Chrome API 설정을 사용하여 즉시 계속해서 읽고 질문할 수 있습니다.',
    docs_chromeExtension_078: '구성 및 실시간 동기화',
    docs_chromeExtension_079: 'NutEgg에는 확장 옵션과 활성 측면 패널 간의 실시간 동기화가 포함됩니다.',
    docs_chromeExtension_080:
      '<strong>콘텐츠 섹션 제어</strong>: 옵션 페이지에서 기본적으로 추출 및 분석되는 섹션(콘텐츠, 요약, 마인드 맵, Q&amp;A, 지식 항목 및 토론)을 사용자 정의합니다.',
    docs_chromeExtension_081:
      '<strong>라이브 설정 동기화</strong>: 분석 모델, 활성화된 출력 섹션 또는 서버 설정을 변경하면 페이지를 새로 고칠 필요 없이 열려 있는 모든 측면 패널이 즉시 업데이트됩니다.',
    docs_chromeExtension_082:
      '<strong>사용자 정의 서버 포트</strong>: 기본 포트 <code>27123</code>가 다른 서비스와 충돌하는 경우 확장 프로그램 <strong>옵션</strong>을 열고 포트를 조정(예: <code>28123</code>)한 후 연결을 테스트하세요.',
    docs_index_001: '문서 개요 — NutEgg',
    docs_index_002: 'Chrome 웹 스토어 ↗',
    docs_index_003: 'Obsidian 플러그인 ↗',
    docs_index_004: '🎬 프로모션 영상 ↗',
    docs_index_005: 'GitHub 출시',
    docs_index_006: '개인 정보 보호 정책',
    docs_index_007: '이슈 트래커',
    docs_index_008: '개요 및 핵심 개념',
    docs_index_009:
      'NutEgg는 읽을 가치가 있는 내용을 결정하고 더 빠르게 이해하는 데 도움이 되는 무료 오픈 소스 Chrome 확장 프로그램입니다. Chrome의 측면 패널에 있으며 기사, 스레드 및 YouTube 동영상에서 작동합니다. 선택 사항인 Obsidian 플러그인은 읽은 내용을 지식 저장소로 바꿔줍니다.',
    docs_index_010: '당신이 얻는 것 Chrome',
    docs_index_011:
      '확장 프로그램을 설치하고 옵션에 AI API 키를 입력하거나 로컬 모델을 가리키면 NutEgg가 즉시 작동합니다. 계정이나 추가 앱이 필요하지 않습니다.',
    docs_index_012: '🎯 즉각적인 클릭베이트 방지 타이틀 판정',
    docs_index_013: '📝 3문장 요약 및 핵심 요약',
    docs_index_014: '🧠 YouTube에 대한 클릭 가능한 타임스탬프가 포함된 축소 가능한 계층적 마인드 맵',
    docs_index_015: '💬 타임스탬프 알약과 페이지 내 소스 링크가 포함된 자연어 Q&amp;A',
    docs_index_016: '🔍 이중 범위 질문: 엄격하게 페이지 내부 또는 사실 확인을 위해 페이지 너머',
    docs_index_017: '🗣️ YouTube, Reddit 및 포럼에 대한 댓글 섹션 다이제스트',
    docs_index_018: '🌐 50개 이상의 언어로 다중 소스 추출 및 번역',
    docs_index_019: '💡 NutEgg가 존재하는 이유',
    docs_index_020:
      '웹의 너무 많은 부분이 패딩된 비디오, 클릭베이트 헤드라인, AI로 과장된 기사입니다. NutEgg 헤드라인에 미리 답변하고 콘텐츠가 시간을 들일 가치가 있는지 여부를 솔직하게 알려줍니다. 따라서 수익이 나는 부분에만 관심을 쏟을 수 있습니다.',
    docs_index_021: '선택사항: Obsidian 추가',
    docs_index_022:
      'Obsidian에 메모를 보관하는 경우 동반 플러그인을 설치하여 확장 프로그램을 Vault(<code>127.0.0.1:27123</code>)에 연결하세요. 이는 볼트의 <code>_index.md</code> 지식 트리, 델타 합성, <code>nutegg/_raw/</code> 및 egg 파일에 대한 자동 메모 보관에 대한 2단계 신규성 평가를 추가합니다. Chrome의 모든 기능은 이 기능이 있든 없든 계속 작동합니다.',
    docs_index_023: '은유',
    docs_index_024: 'Obsidian가 연결되면 NutEgg는 간단한 세 부분으로 구성된 비유를 사용하여 정보 흐름을 구성합니다.',
    docs_index_025:
      '<strong>🌰 Nut(Raw Capture)</strong>: 브라우저에서 추출된 원시 웹페이지, 트윗 스레드 또는 YouTube 사본. Nuts는 전체 메타데이터와 함께 그대로 보관되어 볼트의 <code>nutegg/_raw/</code>에 보관됩니다.',
    docs_index_026:
      '<strong>🥚 Egg(지식 나무)</strong>: 지식 영역을 나타내는 볼트에 있는 살아있는 구조화된 Markdown 메모입니다(예: <code>ai_architecture.md</code>, <code>invest_strategy.md</code>).',
    docs_index_027:
      '<strong>🐣 The Hatch(합성 및 델타)</strong>: 콘텐츠가 분석되면 AI가 콘텐츠를 eggs와 비교하고 이미 문서화된 내용과 비교하여 새로운 것이 무엇인지 식별하고 egg에 새로운 통찰력을 엮습니다.',
    docs_index_028: '시스템 아키텍처',
    docs_index_029: 'NutEgg에는 하나의 핵심 구성요소와 하나의 선택적 컴패니언이 있습니다.',
    docs_index_030:
      '<strong>Chrome Extension</strong>: Chrome의 측면 패널에 위치합니다. 텍스트, 댓글, 비디오 스크립트를 추출합니다. 독립 실행형 모드 또는 연결된 API 모드에서는 구성된 공급자 및 API 키를 사용하여 로컬로 AI 호출을 실행하므로 API 키가 브라우저를 떠나지 않도록 합니다.',
    docs_index_031:
      '<strong>Obsidian 플러그인(선택 사항)</strong>: <code>127.0.0.1:27123</code>에서 로컬 동기화 및 코디네이터 서비스를 실행합니다. 볼트의 <code>_index.md</code>를 읽고, <code>_workflow/</code>에서 프롬프트 템플릿을 관리하며, 캡처된 지식을 디스크에 보관합니다. 지원 사항: <ul> <li> <strong>연결된 API 모드(기본값)</strong>: 지식 일치를 조정하고 인증된 로컬 WebSocket을 통해 AI 추론을 Chrome에 위임합니다(키는 Obsidian로 전송되지 않음). </li> <li> <strong>공유 구독 모드</strong>: API 키가 전혀 필요하지 않은 ChatGPT 로그인(OAuth) 또는 개발자 CLI 도구(Codex, Claude 코드, 반중력)를 통해 로컬로 추론을 실행합니다. </li> </ul>',
    docs_index_032:
      '<code>Chrome Extension (Side Panel)\n │\n ├── [Standalone Mode] Local AI Processing (Verdicts, Summaries, Mind Maps, Q&amp;A)\n │\n └── [Connected Mode] HTTP + WebSocket (127.0.0.1:27123/execution/socket)\n         │\n         ▼\n Obsidian Plugin (Local Server &amp; Coordinator)\n         ├── Evaluates against vault/nutegg/_index.md &amp; prompts in _workflow/\n         ├── In API Mode: Delegates AI calls back to Chrome over WebSocket (keys stay in Chrome)\n         ├── In Subscription Mode: Executes locally via CLI (Codex/Claude/agy) or ChatGPT OAuth\n         └── Writes structured notes to vault/nutegg/_raw/ and &lt;egg&gt;.md</code>',
    docs_index_033: '빠른 시작 로드맵',
    docs_index_034:
      '1분간의 시각적 설명을 보려면 <a href="https://www.youtube.com/watch?v=_u6mDoHZSAo" target="_blank" rel="noopener"\n              >🎬 NutEgg 프로모션 동영상</a\n            >을 시청하세요.',
    docs_index_035:
      'Chrome 웹 스토어에서 <a\n              href="https://chromewebstore.google.com/detail/nutegg/bmdmdiicembobejibggoeiahaonphcol"\n              target="_blank"\n              rel="noopener"\n              >Chrome 확장 프로그램</a\n            >을 설치하고 옵션에 AI 키를 추가하세요(<a href="chrome-extension.html">guide</a> 참조).',
    docs_index_036: '기사나 YouTube 동영상의 측면 패널을 열고 <strong>분석</strong>을 클릭하세요. 그게 다야!',
    docs_index_037:
      '<em>선택 사항:</em> <a href="https://community.obsidian.md/plugins/nutegg" target="_blank" rel="noopener">Obsidian 플러그인</a>(<a href="obsidian-plugin.html">guide</a> 참조)를 설치하고 <a href="knowledge-structuring.html">_index.md</a>에서 첫 번째 지식 주제를 정의하여 부화를 시작하세요.',
    docs_knowledgeStructuring_001: '지식 구조화 및 Eggs — NutEgg',
    docs_knowledgeStructuring_002: 'Chrome 웹 스토어 ↗',
    docs_knowledgeStructuring_003: 'Obsidian 플러그인 ↗',
    docs_knowledgeStructuring_004: '릴리스',
    docs_knowledgeStructuring_005: '개인 정보 보호 정책',
    docs_knowledgeStructuring_006: '지식 구조화 및 Eggs',
    docs_knowledgeStructuring_007:
      'NutEgg가 Obsidian 저장소를 구성하고, <code>_index.md</code>를 사용하여 웹 콘텐츠를 주제와 일치시키고, 축적된 항목을 지식 트리에 병합하는 방법을 알아보세요.',
    docs_knowledgeStructuring_008: '<code>nutegg/</code> 금고 레이아웃',
    docs_knowledgeStructuring_009:
      '모든 NutEgg 콘텐츠는 Obsidian 저장소에 있는 깨끗하고 격리된 <code>nutegg/</code> 폴더에 제한되어 있습니다.',
    docs_knowledgeStructuring_010:
      '<code>vault/\n└── nutegg/\n    ├── _raw/                          # Captured nuts (raw web content + metadata)\n    │   └── 2026-09-06-14-30-youtube-author-title.md\n    ├── _index.md                      # Topic routing guide\n    ├── ai_architecture.md             # Knowledge egg\n    ├── invest_strategy.md             # Knowledge egg\n    └── productivity.md                # Knowledge egg</code>',
    docs_knowledgeStructuring_011: '라우팅 가이드: <code>_index.md</code>',
    docs_knowledgeStructuring_012:
      '<code>_index.md</code> 파일은 귀하가 관리하는 egg 노트와 해당 노트가 다루는 도메인을 NutEgg에게 알려줍니다. 각 줄은 키워드 및 설명에 대한 상대 파일 경로를 매핑합니다.',
    docs_knowledgeStructuring_013:
      '<code>nutegg/ai_architecture.md: LLMs, multi-agent systems, prompt engineering, RAG, embeddings\nnutegg/invest_strategy.md: value investing, index funds, asset allocation, macroeconomic indicators\nnutegg/productivity.md: deep work, time blocking, habits, personal knowledge management</code>',
    docs_knowledgeStructuring_014: '⚡ 라우팅 작동 방식',
    docs_knowledgeStructuring_015:
      '브라우저에서 <strong>분석</strong>을 클릭하면 NutEgg의 AI가 <code>_index.md</code>를 읽고 내용과 일치하는 egg(있는 경우)를 결정합니다. 기존 egg와 일치하는 항목이 없으면 NutEgg는 페이지 주제에서 새로운 egg 시드를 자동으로 생성하도록 제안합니다!',
    docs_knowledgeStructuring_016: 'Egg 파일 구조 및 지침 작동 방식',
    docs_knowledgeStructuring_017:
      '<strong>Egg 파일</strong>(<code>nutegg/*.md</code>에 저장됨)은 두 가지 중요한 역할을 합니다. 즉, 도메인에 대해 선별되고 발전하는 지식 저장소이자 콘텐츠가 해당 주제에 닿을 때마다 NutEgg의 AI 파이프라인을 조종하는 활성 프롬프트 사양입니다.',
    docs_knowledgeStructuring_018: '1. 구조적 청사진',
    docs_knowledgeStructuring_019:
      '모든 egg 파일은 YAML 메타데이터, 명령이 포함된 Obsidian 콜아웃 블록, 선별된 지식 트리 및 처리되지 않은 스테이징 버퍼를 결합합니다.',
    docs_knowledgeStructuring_020:
      '<code>---\ntopic: "AI Architecture & Multi-Agent Systems"\nstatus: "active"\nlast_updated: "2026-09-10"\n---\n\n> [!abstract]- Instructions:\n> **Scope:** Multi-agent architectures, tool calling, memory layers, and LLM evaluation.\n> **Action Guide:** Focus on actionable design patterns, scalability tradeoffs, and real failure modes.\n> **Key Questions:**\n> 1. How are agent memory loops bounded to prevent context window overflow?\n> 2. What coordination mechanism is used between subagents?\n> **Worth Reading If:**\n&gt; - Practical examples and substantive explanations.\n&gt; **Skip If:**\n> - Ignore basic beginner tutorials or high-level sales pitches without technical substance.\n> - Discard speculative claims lacking empirical benchmarks or code evidence.\n> **Formatting Rules:**\n> - Prefix each insight with a bracketed tag: `[concept]`, `[architecture]`, `[method]`, `[benchmark]`, `[explain]`, `[fact]`, `[example]`.\n> - Use the structure: `- [tag] **Concept Name**` followed by an indented explanation and concrete examples (`- 🎯 Example:`).\n\n# Knowledge\n## Agent Memory\n- [architecture] **Bounded Replay Buffers**\n    - Ephemeral short-term memory expires after session goals terminate to conserve token budget.\n    - 🎯 Example: Tool calling trace logs stored in vector stores with sliding window eviction.\n\n# Unprocessed\n(Newly hatched insights land here from captures until auto-merged)</code>',
    docs_knowledgeStructuring_021: '2. 작성방법 Egg 주의사항',
    docs_knowledgeStructuring_022:
      '<code>&gt; [!abstract]- Instructions:</code> 콜아웃에는 6개의 전문 필드가 포함되어 있습니다. 각각은 AI 파이프라인의 특정 단계를 안내합니다.',
    docs_knowledgeStructuring_023: '필드',
    docs_knowledgeStructuring_024: '목적 및 모범 사례',
    docs_knowledgeStructuring_025: '워크플로 사용법',
    docs_knowledgeStructuring_026: '<code>**Scope:**</code>',
    docs_knowledgeStructuring_027:
      'egg의 주제 경계를 정의하는 1~2개의 문장입니다. 어떤 개념, 기술 또는 질문이 포함되거나 제외되는지 명시적으로 기술합니다.',
    docs_knowledgeStructuring_028:
      '<code>egg-analysis.md</code>(2단계)에 주입되어 AI는 이 도메인 렌즈를 통해 엄격하게 지식을 추출합니다.',
    docs_knowledgeStructuring_029: '<code>**Action Guide:**</code>',
    docs_knowledgeStructuring_030:
      'AI가 콘텐츠를 요약하고 평가하는 방법에 대한 1~5단계 지침(예: 특정 관점, 깊이 또는 절충점 요청) 생략하면 기본 가이드로 돌아갑니다.',
    docs_knowledgeStructuring_031: '<code>egg-analysis.md</code>(2단계)에 주입됩니다.',
    docs_knowledgeStructuring_032: '<code>**Key Questions:**</code>',
    docs_knowledgeStructuring_033:
      '콘텐츠가 이 도메인에 닿을 때마다 대답하고 싶은 반복 질문의 번호가 매겨진 목록입니다(예: <em>"토큰 비용은 얼마입니까?"</em>, <em>"실패 모드는 무엇입니까?"</em>).',
    docs_knowledgeStructuring_034:
      '<code>egg-analysis.md</code>(2단계)에 주입됩니다. Chrome 확장 팝업에 응답하고 원시 캡처 노트에 저장됩니다.',
    docs_knowledgeStructuring_035: '<code>**Worth Reading If:** / **Skip If:**</code>',
    docs_knowledgeStructuring_036:
      '원본에 시간을 투자할 가치가 있는 시점과 요약이 충분한 시점을 설명하는 두 가지 기본 설정 목록이 있습니다.',
    docs_knowledgeStructuring_037:
      '2단계 읽기 동작을 안내합니다: 전체, 하이라이트, 요약, 건너뛰기, 불확실함. 병합 중에는 항목을 거부하지 않습니다.',
    docs_knowledgeStructuring_038: '<code>**Formatting Rules:**</code>',
    docs_knowledgeStructuring_039:
      '서식 표준: 괄호 안 태그(<code>[concept]</code>, <code>[architecture]</code>, <code>[method]</code> 등) 및 계층적 글머리 기호 들여쓰기.',
    docs_knowledgeStructuring_040:
      '<code>egg-analysis.md</code>(2단계)에 주입됩니다. 후보 항목이 노트의 형식 지정 규칙과 일치하도록 보장합니다.',
    docs_knowledgeStructuring_041: '3. 선별된 지식 트리와 처리되지 않은 대기열',
    docs_knowledgeStructuring_042:
      'NutEgg 선별된 지식을 새로운 캡처와 분리하여 AI 오염으로부터 지식 기반을 보호합니다.',
    docs_knowledgeStructuring_043:
      '<strong><code># Knowledge</code> (선별 트리):</strong> Markdown 제목과 중첩된 글머리 기호로 구조화되었습니다. 병합만이 이 트리를 읽고, 뚜렷한 예, 주의 사항, 불일치 및 출처를 보존하면서 동등한 주장을 통합합니다. 2단계에서는 트리와 비교하지 않고 지침을 따릅니다.',
    docs_knowledgeStructuring_044:
      '<strong><code># Unprocessed</code>(스테이징 대기열):</strong> 브라우저에서 <strong>🥚 해치 Egg</strong>를 클릭하면 선별된 계층 구조를 직접 건드리지 않고 승인된 항목과 지원되는 답변이 <code># Unprocessed</code>에 안전하게 추가됩니다.',
    docs_knowledgeStructuring_045: '4. 워크플로에서 각 부분이 사용되는 방식',
    docs_knowledgeStructuring_046: '다음은 초기 캡처부터 최종 합성까지 egg 명령을 통해 웹 콘텐츠가 흐르는 방식입니다.',
    docs_knowledgeStructuring_047:
      '<code>[Captured Web Content]\n          │\nStage 1   ▼   _index.md (Topic routing guide)\n─────────────────────────────────────────────────────────────\n• Uses content-task-default.md\n• Generates Title Verdict, 3-Bullet Summary, Mind Map\n• egg-routing.md matches target eggs via Stage 1 summary\n          │\n          ▼\nUser Review: Confirm or select target eggs in popup\n          │\nStage 2   ▼   Target Egg File (nutegg/*.md)\n─────────────────────────────────────────────────────────────\n• Scope, Key Questions, Formatting Rules ──► egg-analysis.md\n  (Extracts candidate knowledge entries and answers questions)\n• Worth Reading If / Skip If guide the reading recommendation\n  (Full, highlights, summary, skip, or uncertain; no tree comparison)\n          │\n          ▼\nHatch Egg: Approved entries and supported answers appended to # Unprocessed\n          │\nMerge Cycle (20+ entries or manual button)\n─────────────────────────────────────────────────────────────\n• merge-unprocessed.md nests and integrates entries into # Knowledge</code>',
    docs_knowledgeStructuring_048: '자동 병합 지식',
    docs_knowledgeStructuring_049:
      '<code># Unprocessed</code>에 20개 이상의 항목이 누적되면(또는 Obsidian 읽기 보기 위젯에서 <strong>병합</strong>을 클릭하면) NutEgg의 AI는 <code>merge-unprocessed.md</code>를 사용하여 자동화된 배경 합성을 실행합니다. <code># Knowledge</code>의 적절한 상위 개념 아래 보류 중인 항목을 분류, 중복 제거 및 중첩하여 지식 그래프를 지속적으로 정리합니다.',
    docs_obsidianPlugin_001: 'Obsidian 플러그인 가이드 — NutEgg',
    docs_obsidianPlugin_002: 'Obsidian 커뮤니티 플러그인 ↗',
    docs_obsidianPlugin_003: 'Chrome 웹 스토어 ↗',
    docs_obsidianPlugin_004: '플러그인 릴리스',
    docs_obsidianPlugin_005: '개인 정보 보호 정책',
    docs_obsidianPlugin_006: 'Obsidian 플러그인 설치 및 구성',
    docs_obsidianPlugin_007:
      'NutEgg Obsidian 플러그인은 로컬 동기화 서버를 호스팅하고, AI 통신을 관리하고, 들어오는 콘텐츠를 지식 트리와 일치시키고, 볼트 파일을 유지 관리합니다.',
    docs_obsidianPlugin_008: '설치',
    docs_obsidianPlugin_009: '옵션 1: Obsidian 커뮤니티 플러그인(권장)',
    docs_obsidianPlugin_010: 'NutEgg는 공식적으로 Obsidian 커뮤니티 플러그인 디렉토리에 나열되어 있습니다.',
    docs_obsidianPlugin_011: 'Obsidian에서 <strong>설정 → 커뮤니티 플러그인</strong>을 엽니다.',
    docs_obsidianPlugin_012:
      '<strong>제한 모드</strong>가 꺼져 있는지 확인한 다음 <strong>찾아보기</strong>를 클릭하세요.',
    docs_obsidianPlugin_013:
      '<strong>NutEgg</strong>를 검색하거나 <a href="https://community.obsidian.md/plugins/nutegg" target="_blank" rel="noopener"\n              >Obsidian 커뮤니티 플러그인의 NutEgg</a>를 방문하세요.',
    docs_obsidianPlugin_014: '<strong>설치</strong>를 클릭한 다음 <strong>사용</strong>을 클릭합니다.',
    docs_obsidianPlugin_015: '옵션 2: 수동 설치',
    docs_obsidianPlugin_016:
      '<a href="https://github.com/staff-000/nutegg-obsidian-release/releases" target="_blank" rel="noopener"\n              >NutEgg Obsidian 플러그인 릴리스</a\n            >에서 <code>main.js</code>, <code>manifest.json</code> 및 <code>styles.css</code>를 다운로드하세요.',
    docs_obsidianPlugin_017:
      'Obsidian 볼트에서 <code>.obsidian/plugins/</code>를 엽니다(필요한 경우 OS에 숨겨진 폴더 표시).',
    docs_obsidianPlugin_018:
      '<code>nutegg</code>라는 새 디렉터리를 만들고 그 안에 세 개의 파일을 넣습니다: <pre><code>your-vault/.obsidian/plugins/nutegg/\n├── main.js\n├── manifest.json\n└── styles.css</code></pre>',
    docs_obsidianPlugin_019:
      'Obsidian에서 <strong>설정 → 커뮤니티 플러그인</strong>을 열고 <strong>Reload</strong>를 클릭한 다음 <strong>NutEgg</strong>를 켭니다.',
    docs_obsidianPlugin_020: '옵션 3: BRAT 사용',
    docs_obsidianPlugin_021:
      'Obsidian에 <a href="https://github.com/tfthacker/obsidian42-brat" target="_blank" rel="noopener">BRAT</a> 커뮤니티 플러그인을 설치하세요.',
    docs_obsidianPlugin_022: '<strong>설정 → BRAT → 베타 플러그인 추가</strong>로 이동하세요.',
    docs_obsidianPlugin_023:
      '<code>staff-000/nutegg-obsidian-release</code>를 입력하고 <strong>플러그인 추가</strong>를 클릭하세요.',
    docs_obsidianPlugin_024: '일단 설치되면 NutEgg를 활성화하세요.',
    docs_obsidianPlugin_025: 'AI 실행 아키텍처',
    docs_obsidianPlugin_026:
      'NutEgg 자체 API 키 개인정보 보호와 키 없는 구독 편의성 사이에서 완전한 유연성을 제공하는 지능형 이중 실행 아키텍처(프로토콜 3)를 사용합니다.',
    docs_obsidianPlugin_027: '🔒 핵심 개인 정보 보호 불변성: API 키는 절대로 떠나지 않습니다 Chrome',
    docs_obsidianPlugin_028:
      '<strong>연결된 API 모드</strong>에서 Obsidian는 볼트 작업, 프롬프트 어셈블리 및 egg 인덱싱을 조정하지만 <strong>는 인증된 로컬 WebSocket을 통해 모든 AI 호출을 다시 Chrome</strong>로 위임합니다. Chrome 로컬에 저장된 API 키를 사용하여 호출을 실행합니다. 귀하의 API 키는 Obsidian로 전송되지 않으며, 볼트 메모에 기록되지 않으며, 브라우저를 떠나지 않습니다.',
    docs_obsidianPlugin_029:
      '<code>┌─────────────────────────────────────────────────────────────────────────────┐\n│                           CONNECTED API MODE (Default)                      │\n│                                                                             │\n│  Chrome Profile A ──(1) HTTP /analyze /confirm──►  Obsidian Plugin          │\n│  (Holds API Key A)                                 (127.0.0.1:27123)        │\n│                                                            │                │\n│                   ◄─(2) WebSocket AI Call /socket──────────┤ Reads _index.md│\n│  Calls Provider A                                          │ Assembles prompt│\n│  (OpenAI / Claude / Gemini / DeepSeek)                     │                │\n│                   ──(3) Authenticated Result─────────────► │                │\n│                                                            ▼                │\n│  Receives Final Result ◄──────(4) HTTP Result────── Saves to Vault          │\n│                                                     (_raw/ & &lt;egg&gt;.md)      │\n└─────────────────────────────────────────────────────────────────────────────┘\n\n┌─────────────────────────────────────────────────────────────────────────────┐\n│                       SHARED SUBSCRIPTION MODE (Zero API Keys)              │\n│                                                                             │\n│  Chrome Profile A ────┐                                                     │\n│                       ├──► Obsidian Plugin (127.0.0.1:27123)                │\n│  Chrome Profile B ────┘        │                                            │\n│                                ▼                                            │\n│                       SubscriptionService (Local CLI or OAuth)              │\n│                       ├── ChatGPT Sign-In (OpenAI Responses API)            │\n│                       ├── Codex CLI (@openai/codex)                         │\n│                       ├── Claude Code CLI (claude auth login)               │\n│                       └── Google Gemini (Antigravity CLI: agy)              │\n└─────────────────────────────────────────────────────────────────────────────┘</code>',
    docs_obsidianPlugin_030: '모드 1: 연결된 API 모드(기본값)',
    docs_obsidianPlugin_031:
      '이 모드에서는 <strong>Chrome 확장 옵션</strong>에서 AI 공급자와 API 키를 직접 구성합니다. Obsidian는 지식 워크플로를 조정하고 Chrome는 안전한 로컬 AI 실행자 역할을 합니다.',
    docs_obsidianPlugin_032:
      '<strong>지원되는 클라우드 제공업체</strong>: Anthropic(Claude 3.5 Sonnet, Claude 3.7 Sonnet), OpenAI(GPT-4o, o-시리즈), Google Gemini(2.0 Flash, 2.5 Pro), DeepSeek(V3, R1), 키미, 퀀, 지푸, 그리고 OpenRouter.',
    docs_obsidianPlugin_033:
      '<strong>로컬 LLM(Ollama, LM Studio, llama.cpp, vLLM)</strong>: Chrome에서 직접 로컬 엔드포인트를 구성합니다. NutEgg 컴퓨터 외부로 데이터를 보내지 않고 로컬 모델에 연결합니다.',
    docs_obsidianPlugin_034:
      '<strong>독립적 Chrome 프로필</strong>: 여러 Chrome 프로필(예: 직장 및 개인)을 사용하는 경우 각 프로필은 자체 공급자, 모델 및 API 키를 사용할 수 있습니다. 키 충돌 없이 동일한 Obsidian 볼트에 연결됩니다.',
    docs_obsidianPlugin_035:
      '<strong>Obsidian-기본 작업</strong>: Vault 전용 유지 관리 작업(예: Obsidian에서 수동 egg 병합)은 Obsidian의 <code>SecretStorage</code>에 안전하게 저장된 기본 설정을 사용합니다. 연결된 Chrome 프로필에서 <strong>저장하고 계속하기</strong>를 클릭하면 SecretStorage의 기본 계정이 안전하게 업데이트됩니다.',
    docs_obsidianPlugin_036: '모드 2: 공유 구독 모드 및 ChatGPT 로그인',
    docs_obsidianPlugin_037:
      'API 키나 토큰당 지불 크레딧을 관리하고 싶지 않으신가요? NutEgg는 Obsidian 내부에서 관리되는 직접 로그인 및 로컬 개발자 CLI 구독을 지원합니다.',
    docs_obsidianPlugin_038: '옵션 A: 직접 ChatGPT 로그인(CLI 필요 없음)',
    docs_obsidianPlugin_039: 'Obsidian에서 <strong>설정 → NutEgg</strong>를 엽니다.',
    docs_obsidianPlugin_040: '<strong>AI 연결</strong>에서 <strong>ChatGPT 로그인</strong>을 선택합니다.',
    docs_obsidianPlugin_041:
      '<strong>Continue with ChatGPT</strong>을 클릭하고 브라우저 인증 절차를 완료한 후 플랜 사용을 허용하세요.',
    docs_obsidianPlugin_042: '계정 모델을 선택하세요(예: <code>gpt-4o</code>).',
    docs_obsidianPlugin_043:
      '연결된 모든 Chrome 프로필은 API 키 설정 없이 이 연결을 즉시 따릅니다. 자격 증명은 설치별 OS 키체인 저장소에 안전하게 보관되며 Chrome로 전송되거나 볼트 파일에 저장되지 않습니다.',
    docs_obsidianPlugin_044: '옵션 B: 로컬 CLI 구독(Codex, Claude, Gemini)',
    docs_obsidianPlugin_045: 'NutEgg 컴퓨터에 이미 설치되어 로그인된 공식 개발자 CLI 도구를 실행할 수 있습니다.',
    docs_obsidianPlugin_046: '공급자',
    docs_obsidianPlugin_047: 'CLI 설치',
    docs_obsidianPlugin_048: '인증',
    docs_obsidianPlugin_049: '모델 발견',
    docs_obsidianPlugin_050: '<strong>Codex CLI</strong>',
    docs_obsidianPlugin_051: '<code>npm install -g @openai/codex</code>',
    docs_obsidianPlugin_052: '<code>codex login</code>',
    docs_obsidianPlugin_053: '앱 서버를 통해 자동',
    docs_obsidianPlugin_054: '<strong>인류학 Claude</strong>',
    docs_obsidianPlugin_055:
      '<a href="https://code.claude.com/docs/en/quickstart" target="_blank" rel="noopener">Claude 코드</a>',
    docs_obsidianPlugin_056: '<code>claude auth login --claudeai</code>',
    docs_obsidianPlugin_057: 'Sonnet, Opus, Haiku 또는 맞춤 ID',
    docs_obsidianPlugin_058: '<strong>구글 Gemini</strong>',
    docs_obsidianPlugin_059:
      '<a href="https://antigravity.google/docs/cli/install" target="_blank" rel="noopener">반중력 CLI</a>',
    docs_obsidianPlugin_060: '<code>agy</code> 브라우저 흐름',
    docs_obsidianPlugin_061: '<code>agy models</code>를 통해 자동',
    docs_obsidianPlugin_062:
      'Obsidian 설정 → NutEgg의 <strong>AI 연결</strong>에서 CLI를 선택하기만 하면 됩니다. NutEgg의 내부 <code>SubscriptionService</code>는 제한된 직렬 대기열에서 로컬로 추론을 실행합니다. 별도의 브리지 서버나 포트 27124가 필요하지 않습니다.',
    docs_obsidianPlugin_063: '로컬 동기화 서버 및 보안',
    docs_obsidianPlugin_064:
      '플러그인이 활성화되면 <code>127.0.0.1:27123</code>에서 백그라운드 HTTP 및 WebSocket 리스너가 자동으로 부팅됩니다.',
    docs_obsidianPlugin_065: '🔒 개인정보 보호 및 오리진 보안',
    docs_obsidianPlugin_066:
      '로컬 서버는 localhost 루프백 주소(<code>127.0.0.1</code>)에 엄격하게 바인딩됩니다. 엄격한 <code>X-NutEgg-Extension-Origin</code> 및 토큰 검증을 시행하여 일반 웹페이지가 저장소에 액세스하는 것을 방지합니다. WebSocket 연결은 첫 번째 프레임에서 인증됩니다.',
    docs_obsidianPlugin_067: '워크플로 및 프롬프트 사용자 정의',
    docs_obsidianPlugin_068:
      'NutEgg는 <code>nutegg/_workflow/</code> 아래 볼트에 직접 저장된 편집 가능한 모듈식 Markdown 프롬프트를 통해 AI 분석을 강화합니다.',
    docs_obsidianPlugin_069:
      '<strong>편집 가능한 템플릿</strong>: 콘텐츠 분석, egg 비교, 라우팅 및 후속 조치를 위한 프롬프트를 맞춤설정하세요.',
    docs_obsidianPlugin_070:
      '<strong>비파괴 업데이트</strong>: NutEgg가 업데이트된 프롬프트 템플릿을 출시하면 사용자 정의된 작업 흐름이 덮어쓰지 않고 자동으로 보존됩니다.',
    docs_workflow_001: 'AI 워크플로 및 프롬프트 엔진 — NutEgg',
    docs_workflow_002: 'Chrome 웹 스토어 ↗',
    docs_workflow_003: 'Obsidian 플러그인 ↗',
    docs_workflow_004: '릴리스',
    docs_workflow_005: '개인 정보 보호 정책',
    docs_workflow_006: 'AI 워크플로 및 프롬프트 엔진',
    docs_workflow_007:
      'NutEgg의 모듈식 워크플로 엔진이 콘텐츠 추출, 요약 기반 egg 라우팅, 지침 중심 분석 및 사용자 맞춤형 프롬프트를 어떻게 조정하는지 알아보세요.',
    docs_workflow_008: '2단계 아키텍처',
    docs_workflow_009:
      '단일 단일 프롬프트를 실행하는 대신 NutEgg는 토큰 효율성, 높은 추출 정밀도 및 완전한 사용자 제어를 위해 설계된 <strong>2단계 아키텍처</strong>를 사용합니다.',
    docs_workflow_010:
      '<code>                    ┌───────────────────────────────┐\n                    │      Captured Web Content     │\n                    │   (Article / YouTube / Tweet) │\n                    └───────────────┬───────────────┘\n                                    │\n                                    ▼\n       ===========================================================\n       STAGE 1: Content & Discussion Analysis + Egg Routing\n       ===========================================================\n            │                                             │\n            ├─► Content Analysis                          ├─► Discussion Analysis\n            │   (Is content >30k chars?)                  │   (When 💬 Discussion enabled\n            │    ├── No  ──► [content-analysis.md]        │    & comments captured)\n            │    └── Yes ──► Chunks + [aggregate-         │    ├── [discussion-analysis.md]\n            │                content.md]                  │    └── [aggregate-discussion.md]\n            │                                             │\n            └──────────────────────┬──────────────────────┘\n                                   │\n                                   ▼\n        Produces: Title Verdict, 3-Bullet Summary, Mind Map,\n        Timestamped Q&A, and Discussion Topics/Stances\n                                   │\n                                   ▼\n                          [egg-routing.md]\n          (Routes matched eggs from _index.md using the\n           concise Stage 1 summary instead of raw content)\n                                    │\n                                    ▼\n       ===========================================================\n       INTERACTIVE CHOICE / EXECUTION MODE (Chrome Extension)\n       ===========================================================\n                                    │\n                        Which mode is selected?\n                                    │\n            ┌───────────────────────┼───────────────────────┐\n            ▼                       ▼                       ▼\n     [Standalone Mode]         [🌞 Full Mode]      [🌛 Preview Summary]\n     Obsidian is offline.      Auto-proceeds to    User reviews matched eggs:\n     Runs Stage 1 in Chrome    Stage 2 with all    ├── "Collect Nut Only"\n     with user\'s API key.      matched eggs.       └── Add/remove eggs ──► Proceed\n     (Fast reading & Q&A)           │                       │\n            │                       └───────────┬───────────┘\n            ▼                                   ▼\n    Results in Side Panel      ===========================================================\n    (No Stage 2 analysis)    STAGE 2: Per-Egg Instruction-Driven Analysis\n                               ===========================================================\n                                                │\n                                   For each confirmed egg (1 or N):\n                                                │\n                                                ▼\n                                        [egg-analysis.md]\n                                  (Extract candidate knowledge entries\n                                   & key questions scoped to this egg)\n                                                │\n                                                ▼\n                                  (Answers + extracted entries + reading action)\n                                                │\n                                                ▼\n                                     Results returned to Popup\n                                     (Ready to Save Nut & Eggs)</code>',
    docs_workflow_011: '💡 왜 요약 기반 라우팅을 사용하나요?',
    docs_workflow_012:
      '전체 원시 기사나 여러 시간의 비디오 기록 대신 1단계 요약을 사용하는 라우팅 eggs은 실행당 수만 개의 토큰을 절약하고 정제된 고신호 의미론적 주제에 초점을 맞춰 라우팅 정확도를 향상시킵니다.',
    docs_workflow_013:
      '측면 패널의 크로스탭 표시기는 현재 Chrome 창에 실행 중인 분석과 읽지 않은 완료된 결과를 표시합니다. 탭을 나열하고 해당 결과나 진행 상황으로 직접 전환하려면 클릭하세요. 활성 탭에 분석이 표시되면 결과를 읽을 수 있습니다. 패널이 열려 있는 동안 추적이 지속되고 패널이 닫힐 때 재설정됩니다.',
    docs_workflow_014:
      'Hatch는 원본 분석을 보관하고 승인된 항목을 <code># Unprocessed</code>에 추가합니다. 병합은 보류 중인 항목 20개 또는 요청 시 실행되어 소스, 주의 사항, 예시 및 불일치를 보존하면서 조각을 모으고 주장의 중복을 제거합니다. 2단계에서는 지식 트리를 수신하지 않으므로 권장 사항은 참신함보다는 관련성과 실질을 평가합니다.',
    docs_workflow_015:
      '<strong>🍃 지식</strong> 섹션 옵션과 Egg 분석 드롭다운은 현재 브라우저 탭에 대한 하나의 설정을 공유합니다: <strong>🥚 분석만</strong>는 Knowledge를 끄고, <strong>🍃 지식 포함</strong>은 켭니다. 드롭다운 선택 항목을 전환하면 AI 호출을 자동으로 트리거하지 않고 설정과 버튼 레이블이 업데이트됩니다. 분석하려면 버튼을 클릭하세요. 이전에 지식 항목 없이 분석된 egg에 대해 지식 포함으로 전환하면 NutEgg는 단순히 캐시된 답변 전용 결과를 표시하는 대신 2단계를 다시 실행합니다. 지식 포함이 초기 기본값입니다. 마지막 선택은 분석이 없는 탭의 기본값이 됩니다. 옵션을 꺼도 이전에 생성된 항목이 숨겨지거나 저장되지 않습니다. Knowledge를 끄면 선택한 모든 egg에 대한 항목이 비활성화됩니다. 이 기능을 켜면 다음을 허용하는 eggs에 대해서만 항목이 허용됩니다. <code>Generate Knowledge Entries: no</code> 또는 egg의 작업 가이드에서 선택 해제가 우선순위를 갖습니다. 주요 답변과 읽기 권장 사항은 어느 쪽이든 계속 제공됩니다. 분석에서는 항목을 저장하지 않습니다. <strong>🐣 Hatch Egg</strong>는 생성된 항목을 egg 파일에 저장합니다.',
    docs_workflow_016: '워크플로 모드',
    docs_workflow_017: '모드',
    docs_workflow_018: '행동',
    docs_workflow_019: '최고의 용도',
    docs_workflow_020: '<strong>📱 독립형 모드</strong>',
    docs_workflow_021:
      'Chrome(Obsidian가 오프라인이거나 폐쇄된 경우)에서 직접 1단계 콘텐츠 분석을 실행합니다. 평결, 3문장 요약, 클릭 가능한 타임스탬프가 포함된 마인드 맵, 타임스탬프 점프가 포함된 대화형 비디오 Q&amp;A를 생성합니다. 2단계 egg 분석을 건너뜁니다.',
    docs_workflow_022: '빠른 웹 및 비디오 읽기, 빠른 이해 또는 메모 보관이 필요하지 않은 경우.',
    docs_workflow_023: '<strong>🌞 전체 모드</strong>',
    docs_workflow_024:
      '1단계 콘텐츠 분석을 실행하고, <code>_index.md</code>를 통해 자동으로 eggs을 라우팅하고, 중단 없이 한 번에 2단계 egg 분석을 즉시 실행합니다.',
    docs_workflow_025: '자동 egg 매칭을 신뢰하면 매일 읽고 빠르게 캡처할 수 있습니다.',
    docs_workflow_026: '<strong>🌛 미리보기 요약</strong>',
    docs_workflow_027:
      '1단계 콘텐츠 분석을 실행한 후 팝업에서 일시 중지합니다. 저장소의 전체 egg 목록과 함께 일치하는 eggs을 표시합니다. 추가/삭제 eggs, 지식비교 진행, <strong>수집 Nut만</strong>를 클릭할 수 있습니다.',
    docs_workflow_028: '심층적인 연구, 모호한 주제 또는 egg 지식 트리를 업데이트하지 않고 빠른 요약만 원하는 경우.',
    docs_workflow_029: 'AI 실행 및 자격 증명 프로토콜',
    docs_workflow_030:
      '전체 모드 또는 요약 미리보기 선택 여부에 관계없이 NutEgg는 <em>워크플로 조정</em>을 <em>자격증명 저장소 및 AI 추론</em>에서 분리합니다.',
    docs_workflow_031:
      '<strong>연결된 API 모드(기본값)</strong>: Obsidian 프롬프트 템플릿 삽입과 지식 비교를 조정하지만 인증된 WebSocket(<code>/execution/socket</code>)을 통해 Chrome에 추론 요청을 보냅니다. Chrome 로컬 API 키를 사용하여 LLM 호출을 실행하고 인증된 결과를 다시 보냅니다. <strong>귀하의 API 키는 절대로 떠나지 않습니다. Chrome.</strong>',
    docs_workflow_032:
      '<strong>공유 구독 모드</strong>: Obsidian 공식 개발자 CLI 도구(<code>codex</code>, <code>claude</code>, <code>agy</code>) 또는 직접 ChatGPT OAuth 로그인을 사용하여 워크플로를 조정하고 AI 호출을 로컬에서 직접 실행합니다. 연결된 모든 Chrome 프로필은 API 키 없이도 이 구독을 공유합니다.',
    docs_workflow_033: 'Vault의 워크플로 파일',
    docs_workflow_034: 'NutEgg 프롬프트 템플릿을 볼트 내부의 <code>nutegg/_workflow/</code>에 시드합니다.',
    docs_workflow_035: '1. 공유 조각(다른 프롬프트에 삽입됨)',
    docs_workflow_036:
      '<code>shared-output-rules.md</code>: 접지 지침(소스 콘텐츠가 유일한 진실) 및 다국어 출력 언어 참조 규칙. <code>{{shared_output_rules}}</code>로 주입됩니다.',
    docs_workflow_037:
      '<code>content-task-default.md</code>: 제목 평결, 글머리 기호 3개 요약, 클릭 가능한 타임스탬프가 포함된 마인드 맵에 대한 핵심 작업 지침입니다. <code>{{content_task_default}}</code>로 주입됩니다.',
    docs_workflow_038: '2. 콘텐츠 캡처 및 비교 파이프라인',
    docs_workflow_039:
      '<code>content-analysis.md</code>: 1단계 콘텐츠 요약, 클릭베이트 방지 판정, 클릭 가능한 타임스탬프가 포함된 대화형 마인드 맵, 타임스탬프 인용이 포함된 맞춤 질문 답변.',
    docs_workflow_040:
      '<code>egg-routing.md</code>: 1단계 요약을 <code>_index.md</code>의 egg 설명과 일치시켜 후보 eggs를 선택합니다.',
    docs_workflow_041:
      '<code>egg-analysis.md</code>: egg당 2단계에서 하나의 egg 지침에 해당하는 후보 지식 항목 및 주요 질문 답변을 추출합니다.',
    docs_workflow_042:
      '읽을 가치가 있는 경우 및 건너뛰기 If는 전체 읽기, 하이라이트, 요약 충분, 건너뛰기 또는 불확실함을 안내합니다. 유용한 답변은 권장 사항에 관계없이 저장 가능한 상태로 유지됩니다.',
    docs_workflow_043:
      '<code>aggregate-content.md</code> &amp; <code>aggregate-egg.md</code>: 긴 콘텐츠(&gt;30,000자) 집계. 2단계에서는 답변 초안, 추천 메모 및 적용 범위만 결합합니다. 추출된 항목은 병합될 때까지 소스 순서대로 유지됩니다.',
    docs_workflow_044: '3. 토론분석(1단계)',
    docs_workflow_045:
      '확장 옵션 또는 팝업 분석 섹션에서 <strong>💬 토론</strong> 섹션이 활성화된 경우 토론 분석은 <strong>1단계</strong> 콘텐츠 분석의 일부로 실행되며, 페이지 추출기는 독자 댓글이나 소셜 댓글(예: YouTube 댓글, Twitter 댓글, Reddit/포럼 스레드, Bilibili 댓글 또는 Zhihu가 대답합니다).',
    docs_workflow_046:
      '<code>discussion-analysis.md</code>: 댓글을 일괄 분석하여 3~5개의 핵심 토론 주제를 추출하고, 댓글 작성자의 입장을 분류하고(<code>agree</code>, <code>disagree</code>, <code>mixed</code>, <code>neutral</code>, <code>unclear</code>), 직접 경험한 귀중한 보충 자료 또는 수정 사항을 강조합니다(<code>supplement: true</code>).',
    docs_workflow_047:
      '<code>aggregate-discussion.md</code>: 대규모 포럼이나 동영상 댓글 섹션에 대한 다중 배치 댓글 스레드에서 주제와 입장 분포를 병합하고 종합합니다.',
    docs_workflow_048:
      '<strong>컨텍스트 흐름:</strong> 분석된 토론 요약 및 증거 항목은 1단계 결과로 반환되고 사용자 정의 Q&amp;A 또는 포럼 본문 분석에 직접 제공됩니다(토론 중심 페이지 또는 대화 내용이 없는 비디오에 중요). 또한 2단계 <code>egg-analysis.md</code>에 상황 신호로 전달되므로 eggs에서는 소스 콘텐츠와 함께 커뮤니티 피드백을 평가할 수 있습니다.',
    docs_workflow_049: '4. 대화형 및 유지 관리 워크플로',
    docs_workflow_050:
      '<code>follow-up.md</code>: 이전 대화 기록 및 클릭 가능한 비디오 타임스탬프 점프 기능이 있는 측면 패널의 대화형 자연어 Q&amp;A.',
    docs_workflow_051:
      '<code>merge-unprocessed.md</code>: 20개 이상의 보류 항목에서 수동 또는 자동으로 실행되어 원시 항목을 <code># Knowledge</code>로 구성하고 중첩합니다.',
    docs_workflow_052:
      '<code>localize-egg.md</code>: 영어 구조 제목을 유지하면서 새로운 egg 템플릿을 외국어로 번역합니다.',
    docs_workflow_053: '안전한 사용자 정의 지침',
    docs_workflow_054: '⚠️ 보존해야 할 것',
    docs_workflow_055:
      '프롬프트 톤, 관점 및 깊이를 자유롭게 사용자 정의할 수 있습니다. 하지만 <strong>보존해야 합니다</strong>:',
    docs_workflow_056:
      '모든 <code>{{placeholder}}</code> 태그(예: <code>{{content}}</code>, <code>{{knowledge_tree}}</code>, <code>{{title}}</code>).',
    docs_workflow_057:
      '파서가 응답을 역직렬화할 수 있도록 정확한 JSON 출력 키(예: <code>titleVerdict</code>, <code>extractedEntries</code>, <code>mindMap</code>)입니다.',
    docs_workflow_058: 'Markdown 출력의 구조 제목(<code># Knowledge</code>, <code># Unprocessed</code>).',
    docs_workflow_059: '충돌 없는 업데이트 및 재설정',
    docs_workflow_060: 'NutEgg가 최신 버전으로 업데이트되는 경우:',
    docs_workflow_061: '<strong>편집되지 않은 프롬프트</strong>: 최신 내장 버전으로 자동 업데이트됩니다.',
    docs_workflow_062:
      '<strong>맞춤형 프롬프트</strong>: 편집 내용을 덮어쓰지 않습니다. NutEgg는 파일 옆에 <code>[filename].new.md</code>를 기록하므로 자신의 속도에 맞춰 새로 추가된 내용을 검토할 수 있습니다.',
    docs_workflow_063:
      '<strong>공장 초기화("기본값 사용")</strong>: 새로운 시작이 필요하신가요? <strong>Obsidian 설정 → NutEgg</strong>에서 <strong>기본값 사용</strong>을 클릭하세요. 기존의 모든 프롬프트는 <code>nutegg/_workflow/_backup/&lt;timestamp&gt;/</code>에 안전하게 백업되고 공장 기본값이 복원됩니다.',
  },
  ar: {
    docs_chromeExtension_001: 'دليل إضافة Chrome — NutEgg',
    docs_chromeExtension_002: 'Chrome المتجر الإلكتروني ↗',
    docs_chromeExtension_003: 'Obsidian البرنامج المساعد ↗',
    docs_chromeExtension_004: '🎬 فيديو ترويجي ↗',
    docs_chromeExtension_005: 'إصدارات التمديد',
    docs_chromeExtension_006: 'سياسة الخصوصية',
    docs_chromeExtension_007: 'إعداد إضافة Chrome واستخدامها',
    docs_chromeExtension_008:
      'يوجد الامتداد NutEgg Chrome في اللوحة الجانبية للمتصفح الخاص بك، مما يوفر استخراج المحتوى عند الطلب، وخرائط ذهنية YouTube مع طوابع زمنية قابلة للنقر، والتقاط بنقرة واحدة إلى Obsidian.',
    docs_chromeExtension_009: 'التثبيت',
    docs_chromeExtension_010: 'الخيار 1: Chrome المتجر الإلكتروني (موصى به)',
    docs_chromeExtension_011:
      'قم بتثبيت NutEgg بنقرة واحدة مباشرة من متجر الويب <a\n            href="https://chromewebstore.google.com/detail/nutegg/bmdmdiicembobejibggoeiahaonphcol"\n            target="_blank"\n            rel="noopener"\n            >Chrome الرسمي</a\n          >:',
    docs_chromeExtension_012:
      'قم بزيارة <a\n              href="https://chromewebstore.google.com/detail/nutegg/bmdmdiicembobejibggoeiahaonphcol"\n              target="_blank"\n              rel="noopener"\n              >NutEgg Chrome صفحة المتجر الإلكتروني</a\n            >.',
    docs_chromeExtension_013: 'انقر على <strong>أضف إلى Chrome</strong>.',
    docs_chromeExtension_014:
      'انقر على أيقونة قطعة اللغز في شريط أدوات Chrome وقم بتثبيت <strong>NutEgg</strong> للوصول بسهولة إلى اللوحة الجانبية.',
    docs_chromeExtension_015: 'الخيار 2: من GitHub الإصدار (.zip)',
    docs_chromeExtension_016:
      'قم بتنزيل أحدث <code>nutegg-chrome-extension-*.zip</code> من <a\n              href="https://github.com/staff-000/nutegg-chrome-extension-release/releases"\n              target="_blank"\n              rel="noopener"\n              >صفحة الإصدارات</a\n            >.',
    docs_chromeExtension_017: 'قم بفك ضغط الأرشيف إلى مجلد محلي على جهاز الكمبيوتر الخاص بك.',
    docs_chromeExtension_018: 'افتح جوجل Chrome وانتقل إلى <code>chrome://extensions</code>.',
    docs_chromeExtension_019: 'قم بتبديل <strong>وضع المطور</strong> في الزاوية العلوية اليمنى.',
    docs_chromeExtension_020:
      'انقر فوق <strong>تحميل غير مضغوط</strong> وحدد الدليل الذي تم فك ضغطه والذي يحتوي على <code>manifest.json</code>.',
    docs_chromeExtension_021:
      'انقر على أيقونة اللغز في شريط الأدوات Chrome وقم بتثبيت <strong>NutEgg</strong> لسهولة الوصول إليها.',
    docs_chromeExtension_022: 'سير عمل اللوحة الجانبية',
    docs_chromeExtension_023: 'يؤدي النقر على أيقونة الامتداد NutEgg إلى فتح اللوحة الجانبية لـ Chrome:',
    docs_chromeExtension_024:
      '<strong>الاستخراج التلقائي</strong>: أثناء التصفح، NutEgg يكتشف علامة التبويب النشطة (YouTube فيديو أو سلسلة تغريدات على Twitter/X أو منشور مدونة) ويستخرج نصها وبنيتها.',
    docs_chromeExtension_025:
      '<strong>تحديث المحتوى (🔄)</strong>: انقر على زر التحديث في معاينة المحتوى لإعادة استخراج الصفحة في التطبيقات الديناميكية ذات الصفحة الواحدة دون إعادة التوجيه بشكل غير متوقع بعيدًا عن المعاينة.',
    docs_chromeExtension_026:
      '<strong>الهدف Egg المحدد</strong>: في معاينة المحتوى، اختر المعرفة المستهدفة eggs أو استخدم "الهدف eggs (التحديد التلقائي بشكل افتراضي)" للسماح للذكاء الاصطناعي بمطابقة أشجار القبو ذات الصلة تلقائيًا.',
    docs_chromeExtension_027:
      '<strong>أوضاع التحليل</strong>: <ul> <li> <strong>الوضع الكامل</strong>: تقييم المحتوى وتشغيل مطابقة المعرفة على الفور مقابل المطابقة eggs في سير عمل واحد مبسط. </li> <li> <strong>وضع المعاينة</strong>: يُنشئ نظرة عامة على المرحلة الأولى أولاً (ملخص، خريطة ذهنية، أسئلة وأجوبة، مناقشة)، مما يتيح لك فحص الهدف أو ضبطه eggs قبل تشغيل egg تحليل المعرفة عند الطلب. </li> </ul>',
    docs_chromeExtension_028:
      '<strong>مؤشر الحالة</strong>: تشير النقطة الخضراء إلى وجود اتصال سليم بخادم Obsidian المحلي (<code>127.0.0.1:27123</code>). إذا كان اللون أحمر، فتأكد من تشغيل Obsidian مع تمكين المكون الإضافي NutEgg.',
    docs_chromeExtension_029: 'YouTube التكامل والملاحة الذكية',
    docs_chromeExtension_030: 'على YouTube صفحات الفيديو، NutEgg مقتطفات:',
    docs_chromeExtension_031:
      '<strong>التسميات التوضيحية والنصوص الكاملة</strong>: استخراج تلقائي عالي الدقة من المنشئ والنصوص التي تم إنشاؤها تلقائيًا.',
    docs_chromeExtension_032:
      '<strong>خريطة ذهنية مع طوابع زمنية قابلة للنقر</strong>: تفصيل فوري باستخدام أزرار الطوابع الزمنية القابلة للنقر والتي تبحث عن مشغل الفيديو YouTube النشط مباشرةً إلى هذا الجزء. عند وجود الطوابع الزمنية، يتم إخفاء علامات المصدر الزائدة للحفاظ على نظافة الشجرة.',
    docs_chromeExtension_033:
      '<strong>أسئلة وأجوبة مع الانتقال إلى الطابع الزمني</strong>: اطرح أي سؤال حول الفيديو باللغة الطبيعية؛ NutEgg يوفر الإجابات المذكورة مع أقراص الطوابع الزمنية القابلة للنقر والتي تنتقل مباشرة إلى لحظة المصدر في تشغيل الفيديو.',
    docs_chromeExtension_034:
      '<strong>حكم مكافحة اصطياد النقرات</strong>: إجابة موضوعية مكونة من جملة واحدة لفرضية عنوان الفيديو، مما يتيح لك تخطي الزغب على الفور.',
    docs_chromeExtension_035: 'التنقل بين مصدر النص داخل الصفحة',
    docs_chromeExtension_036: 'عند قراءة المقالات أو المدونات أو المنتديات:',
    docs_chromeExtension_037:
      '<strong>📍 انتقل إلى المصدر</strong>: تتضمن عقد الخريطة الذهنية النصية واستشهادات الأسئلة والأجوبة علامات المصدر. يؤدي النقر فوق علامة مصدر إلى تمرير صفحة الويب المباشرة تلقائيًا إلى الفقرة أو الاقتباس المطابق تمامًا وتمييزها لفترة وجيزة باستخدام مخطط تفصيلي.',
    docs_chromeExtension_038:
      '<strong>التنقل بين التعليقات</strong>: في صفحات المناقشة (Reddit، Zhihu، وما إلى ذلك)، يؤدي النقر على اقتباسات المصدر إلى التمرير مباشرة إلى التعليق أو الإجابة المحددة.',
    docs_chromeExtension_039: 'تحليل المناقشة ووجهات نظر المجتمع',
    docs_chromeExtension_040: 'NutEgg يحلل التعليقات العامة عبر YouTube وReddit وTwitter/X وZhihu والمنتديات:',
    docs_chromeExtension_041:
      '<strong>تحليل الموضوع والموقف</strong>: يلخص نقاط المناقشة الأساسية بشارات الموقف (أوافق 👍، لا أوافق 👎، مختلط 🤔، محايد ⚖️) ومقاييس رد الفعل.',
    docs_chromeExtension_042:
      '<strong>رؤى إضافية</strong>: يتم الاحتفاظ بالتعليقات عالية القيمة التي تحتوي على أدلة أو تحذيرات أو تجارب فريدة كرؤى إضافية موجزة.',
    docs_chromeExtension_043: 'Chrome- الوضع المستقل فقط (لا Obsidian مطلوب)',
    docs_chromeExtension_044:
      'ليس لديك Obsidian مثبتًا أو مفتوحًا حاليًا؟ NutEgg يعمل بشكل مستقل تمامًا داخل جوجل Chrome!',
    docs_chromeExtension_045: '⚡ قراءة سريعة للويب بدون ملاحظة علوية',
    docs_chromeExtension_046:
      'تم تصميم NutEgg أولاً وقبل كل شيء ليكون رفيقًا سريعًا لقراءة الويب. يمكنك استخراج وتلخيص وإنشاء خرائط ذهنية وطرح أسئلة حول أي مقال أو YouTube فيديو مباشرة في Chrome دون لمس قبو الملاحظات على الإطلاق.',
    docs_chromeExtension_047: 'الميزات المتوفرة في Chrome مستقل:',
    docs_chromeExtension_048:
      '<strong>🎯 حكم فوري لمكافحة محتوى Clickbait</strong>: إجابة موضوعية مكونة من جملة واحدة على سؤال العنوان الرئيسي.',
    docs_chromeExtension_049:
      '<strong>📝 ملخص 3-جمل تنفيذية</strong>: وجبات سريعة عالية الكثافة مستخرجة من أي مقال أو فيديو طويل.',
    docs_chromeExtension_050:
      '<strong>⏱️ خريطة ذهنية مع طوابع زمنية قابلة للنقر والبحث</strong>: انتقل إلى مقاطع الفيديو الرئيسية بنقرة واحدة.',
    docs_chromeExtension_051:
      '<strong>💬 فيديو أسئلة وأجوبة والقفز بالطوابع الزمنية</strong>: اطرح الأسئلة وانقر على أقراص الطوابع الزمنية المستشهد بها لمسح تشغيل الفيديو مباشرة إلى هذا الجزء.',
    docs_chromeExtension_052:
      '<strong>🧠 خرائط ذهنية قابلة للطي</strong>: أشجار فكرية تفاعلية متعددة المستويات تحطم الأفكار الأساسية بصريًا.',
    docs_chromeExtension_053: '<strong>🌐 دعم أكثر من 50 لغة</strong>: استخراج محتوى اللغة الأجنبية وترجمته بسرعة.',
    docs_chromeExtension_054: 'كيفية تكوين الوضع Chrome-فقط:',
    docs_chromeExtension_055:
      'انقر بزر الماوس الأيمن على <strong>NutEgg أيقونة الامتداد</strong> في شريط أدوات Chrome وحدد <strong>خيارات</strong>.',
    docs_chromeExtension_056:
      'حدد مزود الذكاء الاصطناعي المفضل لديك (على سبيل المثال، Google Gemini أو OpenAI أو Claude أو DeepSeek أو OpenRouter) وأدخل مفتاح API الخاص بك.',
    docs_chromeExtension_057: 'انقر على <strong>حفظ</strong>. أنت جاهز لتحليل أي صفحة!',
    docs_chromeExtension_058: 'Obsidian أوضاع الاتصال وتنفيذ الذكاء الاصطناعي',
    docs_chromeExtension_059:
      'عند توصيل الامتداد Chrome بالملحق الاختياري NutEgg Obsidian، يتكيف Chrome بسلاسة وفقًا لوضع التنفيذ المحدد:',
    docs_chromeExtension_060: '🔒 أمان مفتاح API: المفاتيح لا تترك أبدًا Chrome',
    docs_chromeExtension_061:
      'في <strong>وضع API المتصل</strong>، تظل مفاتيح API الخاصة بك بشكل صارم داخل وحدة تخزين الامتداد الآمنة لـ Chrome. Obsidian يدير قوالب المعرفة وفهرسة الخزانة، لكنه يفوض استدلال الذكاء الاصطناعي إلى Chrome عبر WebSocket محلي معتمد. Chrome يجعل استدعاء API للموفر محليًا ويعيد النص الذي تم إنشاؤه فقط.',
    docs_chromeExtension_062: 'وضع التنفيذ',
    docs_chromeExtension_063: 'حيث يعمل الذكاء الاصطناعي',
    docs_chromeExtension_064: 'أوراق الاعتماد المستخدمة',
    docs_chromeExtension_065: '<strong>Chrome-فقط</strong>',
    docs_chromeExtension_066: 'داخل مباشرة Chrome',
    docs_chromeExtension_067: 'تم تكوين مفتاح API في خيارات Chrome',
    docs_chromeExtension_068: '<strong>وضع API المتصل</strong>',
    docs_chromeExtension_069: 'Chrome (مفوض عبر WebSocket المحلي بواسطة Obsidian)',
    docs_chromeExtension_070: 'مفتاح API في Chrome (لم يتم إرسال المفاتيح مطلقًا إلى Obsidian)',
    docs_chromeExtension_071: '<strong>وضع الاشتراك المشترك</strong>',
    docs_chromeExtension_072: 'داخل Obsidian (عبر CLI المحلي أو ChatGPT OAuth)',
    docs_chromeExtension_073: 'مفاتيح Zero API (تستخدم Codex أو Claude Code أو Antigravity أو ChatGPT)',
    docs_chromeExtension_074: 'دعم متعدد الملفات الشخصية Chrome',
    docs_chromeExtension_075:
      'NutEgg يدعم ملفات تعريف المتصفح Chrome المتعددة (مثل الشخصية والعمل) التي تتصل بشكل متزامن بنفس خزنة Obsidian. يحتفظ كل ملف تعريف Chrome بمزوده الخاص ونموذجه ومفتاح واجهة برمجة التطبيقات (API) بشكل مستقل. لا يؤدي الاتصال أو تبديل أوضاع التنفيذ إلى تسرب أو استبدال مفاتيح واجهة برمجة التطبيقات (API) بين الملفات الشخصية.',
    docs_chromeExtension_076: 'غير متصل وقطع الاسترداد',
    docs_chromeExtension_077:
      'إذا تم إغلاق Obsidian أثناء تمكين الوضع المتصل، فإن NutEgg يعرض ضوء حالة واضح ويمنحك خيار <strong>"استخدام الوضع Chrome بدلاً من ذلك"</strong> بنقرة واحدة. يتيح لك هذا مواصلة القراءة وطرح الأسئلة على الفور باستخدام إعداد Chrome API الخاص بك دون انقطاع أو مخاطر الحصص.',
    docs_chromeExtension_078: 'التكوين والمزامنة المباشرة',
    docs_chromeExtension_079: 'NutEgg يتضمن المزامنة في الوقت الفعلي بين خيارات الامتداد واللوحات الجانبية النشطة:',
    docs_chromeExtension_080:
      '<strong>عناصر التحكم في قسم المحتوى</strong>: تخصيص الأقسام التي يتم استخراجها وتحليلها افتراضيًا (المحتوى والملخص والخريطة الذهنية والأسئلة والأجوبة ومدخلات المعرفة والمناقشة) في صفحة الخيارات.',
    docs_chromeExtension_081:
      '<strong>مزامنة الإعدادات المباشرة</strong>: يؤدي تغيير نماذج التحليل أو أقسام الإخراج الممكّنة أو إعدادات الخادم إلى تحديث جميع اللوحات الجانبية المفتوحة على الفور دون الحاجة إلى تحديث الصفحة.',
    docs_chromeExtension_082:
      '<strong>منفذ خادم مخصص</strong>: إذا كان المنفذ الافتراضي <code>27123</code> يتعارض مع خدمة أخرى، فافتح الامتداد <strong>Options</strong>، واضبط المنفذ (على سبيل المثال <code>28123</code>)، واختبر الاتصال.',
    docs_index_001: 'نظرة عامة على الوثائق — NutEgg',
    docs_index_002: 'Chrome المتجر الإلكتروني ↗',
    docs_index_003: 'Obsidian البرنامج المساعد ↗',
    docs_index_004: '🎬 فيديو ترويجي ↗',
    docs_index_005: 'GitHub الإصدارات',
    docs_index_006: 'سياسة الخصوصية',
    docs_index_007: 'تعقب المشكلة',
    docs_index_008: 'نظرة عامة والمفاهيم الأساسية',
    docs_index_009:
      'NutEgg هو امتداد مجاني ومفتوح المصدر Chrome يساعدك على تحديد ما يستحق القراءة وفهمه بشكل أسرع. إنه موجود في اللوحة الجانبية لـ Chrome ويعمل على المقالات والمواضيع ومقاطع الفيديو YouTube. يعمل المكوّن الإضافي Obsidian الاختياري على تحويل ما تقرأه إلى مخزن معرفي متنامٍ.',
    docs_index_010: 'ما تحصل عليه Chrome',
    docs_index_011:
      'قم بتثبيت الامتداد، وأدخل مفتاح AI API الخاص بك (أو قم بتوجيهه إلى نموذج محلي) في الخيارات، ويعمل NutEgg على الفور - بدون حساب، ولا تطبيقات إضافية:',
    docs_index_012: '🎯 حكم فوري على عنوان مكافحة Clickbait',
    docs_index_013: '📝 ملخص تنفيذي مكون من 3 جمل والوجبات السريعة الأساسية',
    docs_index_014: '🧠 خرائط ذهنية هرمية قابلة للطي، مع طوابع زمنية قابلة للنقر عليها لـ YouTube',
    docs_index_015:
      '💬 أسئلة وأجوبة باللغة الطبيعية مع أقراص الطوابع الزمنية المستشهد بها وروابط المصدر الموجودة في الصفحة',
    docs_index_016: '🔍 أسئلة ذات نطاق مزدوج: داخل الصفحة فقط، أو خارجها للتحقق من صحة المعلومات',
    docs_index_017: '🗣️ ملخصات قسم التعليقات لـ YouTube وReddit والمنتديات',
    docs_index_018: '🌐 استخراج وترجمة متعددة المصادر بأكثر من 50 لغة',
    docs_index_019: '💡لماذا NutEgg موجود',
    docs_index_020:
      'الكثير من الويب عبارة عن مقاطع فيديو مبطنة وعناوين رئيسية ومقالات متضخمة بالذكاء الاصطناعي. NutEgg يجيب على العنوان مقدمًا ويخبرك بصراحة ما إذا كان المحتوى يستحق وقتك أم لا، لذلك لا تركز إلا على المكان الذي يؤتي ثماره.',
    docs_index_021: 'اختياري: أضف Obsidian',
    docs_index_022:
      'إذا كنت تحتفظ بالملاحظات في Obsidian، فقم بتثبيت البرنامج الإضافي المصاحب لتوصيل الامتداد بخزنتك (<code>127.0.0.1:27123</code>). يضيف هذا تقييمًا جديدًا على مرحلتين مقابل أشجار المعرفة <code>_index.md</code> الخاصة بخزنتك، وتوليف دلتا، وأرشفة الملاحظات التلقائية في ملفات <code>nutegg/_raw/</code> وegg. كل شيء في Chrome يستمر في العمل به أو بدونه.',
    docs_index_023: 'الاستعارة',
    docs_index_024: 'مع اتصال Obsidian، يقوم NutEgg بتنظيم تدفق معلوماتك باستخدام استعارة بسيطة مكونة من ثلاثة أجزاء:',
    docs_index_025:
      '<strong>🌰 Nut (التقاط خام)</strong>: صفحة الويب الأولية أو سلسلة التغريدات أو YouTube النص المستخرج من المتصفح. يتم أرشفة Nuts دون تغيير مع البيانات الوصفية الكاملة في <code>nutegg/_raw/</code> في قبو الخاص بك.',
    docs_index_026:
      '<strong>🥚 Egg (شجرة المعرفة)</strong>: ملاحظة حية ومنظّمة بصيغة Markdown داخل خزنة ملاحظاتك، تمثّل مجالًا معرفيًا (مثل <code>ai_architecture.md</code> و<code>invest_strategy.md</code>).',
    docs_index_027:
      '<strong>🐣 The Hatch (التوليف والدلتا)</strong>: عندما يتم تحليل المحتوى، يطابقه الذكاء الاصطناعي مع eggs الخاص بك، ويحدد ما هو جديد مقارنة بما تم توثيقه بالفعل، وينسج رؤى جديدة في egg الخاص بك.',
    docs_index_028: 'هندسة النظام',
    docs_index_029: 'NutEgg يحتوي على مكون أساسي واحد ورفيق اختياري واحد:',
    docs_index_030:
      '<strong>Chrome الامتداد</strong>: يعيش في اللوحة الجانبية لـ Chrome. يستخرج النص والتعليقات ونصوص الفيديو. في الوضع المستقل أو وضع واجهة برمجة التطبيقات المتصلة، فإنه ينفذ مكالمات الذكاء الاصطناعي محليًا باستخدام الموفر الذي تم تكوينه ومفتاح واجهة برمجة التطبيقات، مما يضمن عدم مغادرة مفاتيح واجهة برمجة التطبيقات للمتصفح مطلقًا.',
    docs_index_031:
      '<strong>إضافة Obsidian (اختيارية)</strong>: تشغّل خدمة محلية للمزامنة والتنسيق على <code>127.0.0.1:27123</code>. تقرأ ملف <code>_index.md</code> في خزنة ملاحظاتك، وتدير قوالب التعليمات النصية داخل <code>_workflow/</code>، وتؤرشف المعرفة الملتقطة على القرص. وتدعم: <ul><li><strong>وضع API المتصل (الافتراضي)</strong>: ينسّق مطابقة المعرفة ويفوّض تنفيذ طلبات الذكاء الاصطناعي إلى Chrome عبر اتصال WebSocket محلي موثّق، ولا تُرسل المفاتيح إلى Obsidian.</li><li><strong>وضع الاشتراك المشترك</strong>: ينفّذ الطلبات محليًا عبر تسجيل الدخول إلى ChatGPT باستخدام OAuth أو أدوات سطر الأوامر للمطوّرين (Codex وClaude Code وAntigravity)، دون الحاجة إلى مفاتيح API.</li></ul>',
    docs_index_032:
      '<code>Chrome Extension (Side Panel)\n │\n ├── [Standalone Mode] Local AI Processing (Verdicts, Summaries, Mind Maps, Q&amp;A)\n │\n └── [Connected Mode] HTTP + WebSocket (127.0.0.1:27123/execution/socket)\n         │\n         ▼\n Obsidian Plugin (Local Server &amp; Coordinator)\n         ├── Evaluates against vault/nutegg/_index.md &amp; prompts in _workflow/\n         ├── In API Mode: Delegates AI calls back to Chrome over WebSocket (keys stay in Chrome)\n         ├── In Subscription Mode: Executes locally via CLI (Codex/Claude/agy) or ChatGPT OAuth\n         └── Writes structured notes to vault/nutegg/_raw/ and &lt;egg&gt;.md</code>',
    docs_index_033: 'خريطة طريق البدء السريع',
    docs_index_034:
      'شاهد <a href="https://www.youtube.com/watch?v=_u6mDoHZSAo" target="_blank" rel="noopener"\n              >🎬 NutEgg الفيديو الترويجي</a\n            > للحصول على جولة مرئية مدتها دقيقة واحدة.',
    docs_index_035:
      'قم بتثبيت <a\n              href="https://chromewebstore.google.com/detail/nutegg/bmdmdiicembobejibggoeiahaonphcol"\n              target="_blank"\n              rel="noopener"\n              >Chrome الامتداد</a\n            > من Chrome Web Store وأضف مفتاح الذكاء الاصطناعي الخاص بك في الخيارات (انظر <a href="chrome-extension.html">الدليل</a>).',
    docs_index_036: 'افتح اللوحة الجانبية لأي مقال أو YouTube فيديو وانقر على <strong>تحليل</strong>. هذا كل شيء!',
    docs_index_037:
      '<em>اختياري:</em> قم بتثبيت <a href="https://community.obsidian.md/plugins/nutegg" target="_blank" rel="noopener">Obsidian البرنامج المساعد</a> (انظر <a href="obsidian-plugin.html">الدليل</a>) وحدد موضوعاتك المعرفية الأولى في <a href="knowledge-structuring.html">_index.md</a> لبدء الفقس.',
    docs_knowledgeStructuring_001: 'هيكلة المعرفة وEggs — NutEgg',
    docs_knowledgeStructuring_002: 'Chrome المتجر الإلكتروني ↗',
    docs_knowledgeStructuring_003: 'Obsidian البرنامج المساعد ↗',
    docs_knowledgeStructuring_004: 'الإصدارات',
    docs_knowledgeStructuring_005: 'سياسة الخصوصية',
    docs_knowledgeStructuring_006: 'هيكلة المعرفة وEggs',
    docs_knowledgeStructuring_007:
      'تعرف على كيفية تنظيم NutEgg لخزنة Obsidian الخاصة بك، ومطابقة محتوى الويب مع المواضيع باستخدام <code>_index.md</code>، ودمج الإدخالات المتراكمة في أشجار المعرفة.',
    docs_knowledgeStructuring_008: '<code>nutegg/</code> تخطيط المدفن',
    docs_knowledgeStructuring_009:
      'كل محتوى NutEgg يقتصر على مجلد <code>nutegg/</code> نظيف ومعزول في قبو Obsidian الخاص بك:',
    docs_knowledgeStructuring_010:
      '<code>vault/\n└── nutegg/\n    ├── _raw/                          # Captured nuts (raw web content + metadata)\n    │   └── 2026-09-06-14-30-youtube-author-title.md\n    ├── _index.md                      # Topic routing guide\n    ├── ai_architecture.md             # Knowledge egg\n    ├── invest_strategy.md             # Knowledge egg\n    └── productivity.md                # Knowledge egg</code>',
    docs_knowledgeStructuring_011: 'دليل التوجيه: <code>_index.md</code>',
    docs_knowledgeStructuring_012:
      'يخبرك الملف <code>_index.md</code> NutEgg بالملاحظات egg التي تحتفظ بها والمجالات التي تغطيها. يقوم كل سطر بتعيين مسار ملف نسبي للكلمات الأساسية والأوصاف:',
    docs_knowledgeStructuring_013:
      '<code>nutegg/ai_architecture.md: LLMs, multi-agent systems, prompt engineering, RAG, embeddings\nnutegg/invest_strategy.md: value investing, index funds, asset allocation, macroeconomic indicators\nnutegg/productivity.md: deep work, time blocking, habits, personal knowledge management</code>',
    docs_knowledgeStructuring_014: '⚡ كيف يعمل التوجيه',
    docs_knowledgeStructuring_015:
      'عندما تنقر على <strong>تحليل</strong> في المتصفح، يقرأ الذكاء الاصطناعي الخاص بـ NutEgg <code>_index.md</code> ويحدد egg (إن وجد) الذي يطابق المحتوى. في حالة عدم وجود تطابقات egg موجودة، يعرض NutEgg إنشاء egg جديد تلقائيًا من موضوع الصفحة!',
    docs_knowledgeStructuring_016: 'Egg تشريح الملف وكيفية عمل التعليمات',
    docs_knowledgeStructuring_017:
      'يؤدّي <strong>ملف Egg</strong> (المحفوظ ضمن <code>nutegg/*.md</code>) وظيفتين أساسيتين: فهو مستودع معرفي منقّح ومتطوّر لمجال معيّن، ومواصفات فعّالة للتعليمات النصية توجّه مسار معالجة الذكاء الاصطناعي في NutEgg كلّما تناول المحتوى ذلك الموضوع.',
    docs_knowledgeStructuring_018: '1. المخطط الهيكلي',
    docs_knowledgeStructuring_019:
      'يجمع كل ملف egg بين بيانات تعريف YAML، وكتلة وسائل الشرح Obsidian مع التعليمات، وشجرة المعرفة المنسقة، والمخزن المؤقت غير المعالج:',
    docs_knowledgeStructuring_020:
      '<code>---\ntopic: "AI Architecture & Multi-Agent Systems"\nstatus: "active"\nlast_updated: "2026-09-10"\n---\n\n> [!abstract]- Instructions:\n> **Scope:** Multi-agent architectures, tool calling, memory layers, and LLM evaluation.\n> **Action Guide:** Focus on actionable design patterns, scalability tradeoffs, and real failure modes.\n> **Key Questions:**\n> 1. How are agent memory loops bounded to prevent context window overflow?\n> 2. What coordination mechanism is used between subagents?\n> **Worth Reading If:**\n&gt; - Practical examples and substantive explanations.\n&gt; **Skip If:**\n> - Ignore basic beginner tutorials or high-level sales pitches without technical substance.\n> - Discard speculative claims lacking empirical benchmarks or code evidence.\n> **Formatting Rules:**\n> - Prefix each insight with a bracketed tag: `[concept]`, `[architecture]`, `[method]`, `[benchmark]`, `[explain]`, `[fact]`, `[example]`.\n> - Use the structure: `- [tag] **Concept Name**` followed by an indented explanation and concrete examples (`- 🎯 Example:`).\n\n# Knowledge\n## Agent Memory\n- [architecture] **Bounded Replay Buffers**\n    - Ephemeral short-term memory expires after session goals terminate to conserve token budget.\n    - 🎯 Example: Tool calling trace logs stored in vector stores with sliding window eviction.\n\n# Unprocessed\n(Newly hatched insights land here from captures until auto-merged)</code>',
    docs_knowledgeStructuring_021: '2. كيفية كتابة Egg التعليمات',
    docs_knowledgeStructuring_022:
      'تحتوي وسيلة الشرح <code>&gt; [!abstract]- Instructions:</code> على ستة مجالات متخصصة. يرشد كل واحد مرحلة معينة من مسار الذكاء الاصطناعي:',
    docs_knowledgeStructuring_023: 'الميدان',
    docs_knowledgeStructuring_024: 'الغرض وأفضل الممارسات',
    docs_knowledgeStructuring_025: 'استخدام سير العمل',
    docs_knowledgeStructuring_026: '<code>**Scope:**</code>',
    docs_knowledgeStructuring_027:
      '1-2 جمل تحدد الحدود الموضعية لهذا egg. اذكر بوضوح المفاهيم أو التقنيات أو الأسئلة المضمنة أو المستبعدة.',
    docs_knowledgeStructuring_028:
      'يتم حقنه في <code>egg-analysis.md</code> (المرحلة 2) بحيث يستخرج الذكاء الاصطناعي المعرفة بدقة من خلال عدسة المجال هذه.',
    docs_knowledgeStructuring_029: '<code>**Action Guide:**</code>',
    docs_knowledgeStructuring_030:
      'تعليمات من 1 إلى 5 خطوات حول كيفية تلخيص الذكاء الاصطناعي للمحتوى وتقييمه (على سبيل المثال، السؤال عن وجهات نظر أو عمق أو مقايضات محددة). يعود إلى الدليل الافتراضي إذا تم حذفه.',
    docs_knowledgeStructuring_031: 'يتم حقنه في <code>egg-analysis.md</code> (المرحلة 2).',
    docs_knowledgeStructuring_032: '<code>**Key Questions:**</code>',
    docs_knowledgeStructuring_033:
      'قائمة مرقمة بالأسئلة المتكررة التي تريد الإجابة عليها عندما يمس المحتوى هذا المجال (على سبيل المثال <em>"ما هي تكلفة الرمز المميز؟"</em>، <em>"ما هي أوضاع الفشل؟"</em>).',
    docs_knowledgeStructuring_034:
      'يتم حقنه في <code>egg-analysis.md</code> (المرحلة 2). تم الرد عليه في النافذة المنبثقة Chrome وحفظها في ملاحظات الالتقاط الأولية.',
    docs_knowledgeStructuring_035: '<code>**Worth Reading If:** / **Skip If:**</code>',
    docs_knowledgeStructuring_036: 'قائمتان من التفضيلات تصفان متى يستحق الأصل وقتك ومتى يكون الملخص كافيًا.',
    docs_knowledgeStructuring_037:
      'قم بتوجيه إجراء القراءة في المرحلة الثانية: كامل، أو مميز، أو ملخص، أو تخطي، أو غير مؤكد. لا يرفضون الإدخالات أبدًا أثناء الدمج.',
    docs_knowledgeStructuring_038: '<code>**Formatting Rules:**</code>',
    docs_knowledgeStructuring_039:
      'معايير التنسيق: العلامات بين قوسين (<code>[concept]</code>، <code>[architecture]</code>، <code>[method]</code>، وما إلى ذلك) والمسافات البادئة الهرمية.',
    docs_knowledgeStructuring_040:
      'يتم حقنه في <code>egg-analysis.md</code> (المرحلة 2). يضمن تطابق إدخالات المرشح مع اتفاقيات تنسيق الملاحظات الخاصة بك.',
    docs_knowledgeStructuring_041: '3. شجرة المعرفة المنسقة مقابل قائمة الانتظار غير المعالجة',
    docs_knowledgeStructuring_042:
      'NutEgg يحمي قاعدة معارفك من تلوث الذكاء الاصطناعي عن طريق فصل المعرفة المنسقة عن اللقطات الجديدة:',
    docs_knowledgeStructuring_043:
      '<strong><code># Knowledge</code> (الشجرة المنقّحة):</strong> تُنظَّم بعناوين Markdown وقوائم نقطية متداخلة. وحدها عملية الدمج تقرأ هذه الشجرة، فتجمع الادعاءات المتكافئة مع الحفاظ على الأمثلة والتنبيهات والخلافات والمصادر المختلفة. تتبع المرحلة الثانية التعليمات دون المقارنة بالشجرة.',
    docs_knowledgeStructuring_044:
      '<strong><code># Unprocessed</code> (قائمة الانتظار المرحلية):</strong> عند النقر فوق <strong>🥚 يفقس Egg</strong> في المتصفح، يتم إلحاق الإدخالات المعتمدة والإجابات المدعومة بأمان بـ <code># Unprocessed</code> بدلاً من لمس التسلسل الهرمي المنسق مباشرةً.',
    docs_knowledgeStructuring_045: '4. كيف يتم استخدام كل جزء في سير العمل',
    docs_knowledgeStructuring_046:
      'إليك كيفية تدفق محتوى الويب من خلال تعليمات egg بدءًا من الالتقاط الأولي وحتى التركيب النهائي:',
    docs_knowledgeStructuring_047:
      '<code>[Captured Web Content]\n          │\nStage 1   ▼   _index.md (Topic routing guide)\n─────────────────────────────────────────────────────────────\n• Uses content-task-default.md\n• Generates Title Verdict, 3-Bullet Summary, Mind Map\n• egg-routing.md matches target eggs via Stage 1 summary\n          │\n          ▼\nUser Review: Confirm or select target eggs in popup\n          │\nStage 2   ▼   Target Egg File (nutegg/*.md)\n─────────────────────────────────────────────────────────────\n• Scope, Key Questions, Formatting Rules ──► egg-analysis.md\n  (Extracts candidate knowledge entries and answers questions)\n• Worth Reading If / Skip If guide the reading recommendation\n  (Full, highlights, summary, skip, or uncertain; no tree comparison)\n          │\n          ▼\nHatch Egg: Approved entries and supported answers appended to # Unprocessed\n          │\nMerge Cycle (20+ entries or manual button)\n─────────────────────────────────────────────────────────────\n• merge-unprocessed.md nests and integrates entries into # Knowledge</code>',
    docs_knowledgeStructuring_048: 'الدمج التلقائي للمعرفة',
    docs_knowledgeStructuring_049:
      'عندما يتراكم 20 إدخالاً أو أكثر في <code># Unprocessed</code> (أو عند النقر فوق <strong>دمج</strong> في أداة عرض القراءة Obsidian)، يقوم الذكاء الاصطناعي الخاص بـ NutEgg بتشغيل توليف الخلفية التلقائي باستخدام <code>merge-unprocessed.md</code>. فهو يقوم بتصنيف الإدخالات المعلقة وإلغاء تكرارها وإدخالها ضمن المفاهيم الرئيسية المناسبة في <code># Knowledge</code>، مع الحفاظ على الرسم البياني المعرفي الخاص بك منظمًا بشكل دائم.',
    docs_obsidianPlugin_001: 'دليل إضافة Obsidian — NutEgg',
    docs_obsidianPlugin_002: 'Obsidian البرنامج المساعد للمجتمع ↗',
    docs_obsidianPlugin_003: 'Chrome المتجر الإلكتروني ↗',
    docs_obsidianPlugin_004: 'إصدارات البرنامج المساعد',
    docs_obsidianPlugin_005: 'سياسة الخصوصية',
    docs_obsidianPlugin_006: 'تثبيت إضافة Obsidian وإعدادها',
    docs_obsidianPlugin_007:
      'يستضيف البرنامج الإضافي NutEgg Obsidian خادم المزامنة المحلي، ويدير اتصالات الذكاء الاصطناعي، ويطابق المحتوى الوارد مع أشجار المعرفة الخاصة بك، ويحافظ على ملفات المخزن الخاصة بك.',
    docs_obsidianPlugin_008: 'التثبيت',
    docs_obsidianPlugin_009: 'الخيار 1: Obsidian المكونات الإضافية للمجتمع (مستحسن)',
    docs_obsidianPlugin_010: 'NutEgg مدرج رسميًا في دليل الإضافات المجتمعية Obsidian:',
    docs_obsidianPlugin_011: 'في Obsidian، افتح <strong>الإعدادات → المكونات الإضافية للمجتمع</strong>.',
    docs_obsidianPlugin_012: 'تأكد من إيقاف تشغيل <strong>الوضع المقيد</strong>، ثم انقر فوق <strong>تصفح</strong>.',
    docs_obsidianPlugin_013:
      'ابحث عن <strong>NutEgg</strong> (أو قم بزيارة <a href="https://community.obsidian.md/plugins/nutegg" target="_blank" rel="noopener"\n              >NutEgg على Obsidian المكونات الإضافية للمجتمع</a\n            >).',
    docs_obsidianPlugin_014: 'انقر على <strong>تثبيت</strong>، ثم انقر على <strong>تمكين</strong>.',
    docs_obsidianPlugin_015: 'الخيار 2: التثبيت اليدوي',
    docs_obsidianPlugin_016:
      'قم بتنزيل <code>main.js</code> و<code>manifest.json</code> و<code>styles.css</code> من <a href="https://github.com/staff-000/nutegg-obsidian-release/releases" target="_blank" rel="noopener"\n              >NutEgg Obsidian إصدارات البرنامج المساعد</a\n            >.',
    docs_obsidianPlugin_017:
      'في خزنة Obsidian، افتح <code>.obsidian/plugins/</code> (أظهر المجلدات المخفية في نظام التشغيل لديك إذا لزم الأمر).',
    docs_obsidianPlugin_018:
      'قم بإنشاء دليل جديد باسم <code>nutegg</code> ووضع الملفات الثلاثة بداخله: <pre><code>your-vault/.obsidian/plugins/nutegg/\n├── main.js\n├── manifest.json\n└── styles.css</code></pre>',
    docs_obsidianPlugin_019:
      'في Obsidian، افتح <strong>الإعدادات → المكونات الإضافية للمجتمع</strong>، وانقر على <strong>إعادة التحميل</strong>، ثم قم بتشغيل <strong>NutEgg</strong>.',
    docs_obsidianPlugin_020: 'الخيار 3: استخدام BRAT',
    docs_obsidianPlugin_021:
      'قم بتثبيت البرنامج المساعد للمجتمع <a href="https://github.com/tfthacker/obsidian42-brat" target="_blank" rel="noopener">BRAT</a> في Obsidian.',
    docs_obsidianPlugin_022: 'انتقل إلى <strong>الإعدادات → BRAT → إضافة البرنامج المساعد التجريبي</strong>.',
    docs_obsidianPlugin_023:
      'أدخل <code>staff-000/nutegg-obsidian-release</code> وانقر على <strong>إضافة مكون إضافي</strong>.',
    docs_obsidianPlugin_024: 'تمكين NutEgg بمجرد التثبيت.',
    docs_obsidianPlugin_025: 'بنية تنفيذ الذكاء الاصطناعي',
    docs_obsidianPlugin_026:
      'NutEgg يستخدم بنية تنفيذ مزدوجة ذكية (البروتوكول 3) تمنحك مرونة كاملة بين خصوصية مفتاح API الخاص بك وراحة الاشتراك بدون مفتاح:',
    docs_obsidianPlugin_027: '🔒 متغير الخصوصية الأساسي: مفاتيح واجهة برمجة التطبيقات (API) لا تترك أبدًا Chrome',
    docs_obsidianPlugin_028:
      'في <strong>وضع API المتصل</strong>، ينسّق Obsidian عمليات خزنة الملاحظات وتجميع التعليمات النصية وفهرسة egg، لكنه <strong>يفوّض جميع طلبات الذكاء الاصطناعي إلى Chrome</strong> عبر اتصال WebSocket محلي موثّق. ينفّذ Chrome الطلب باستخدام مفتاح API المخزّن محليًا. لا تُرسل مفاتيح API إلى Obsidian، ولا تُكتب في ملاحظات الخزنة، ولا تغادر المتصفح.',
    docs_obsidianPlugin_029:
      '<code>┌─────────────────────────────────────────────────────────────────────────────┐\n│                           CONNECTED API MODE (Default)                      │\n│                                                                             │\n│  Chrome Profile A ──(1) HTTP /analyze /confirm──►  Obsidian Plugin          │\n│  (Holds API Key A)                                 (127.0.0.1:27123)        │\n│                                                            │                │\n│                   ◄─(2) WebSocket AI Call /socket──────────┤ Reads _index.md│\n│  Calls Provider A                                          │ Assembles prompt│\n│  (OpenAI / Claude / Gemini / DeepSeek)                     │                │\n│                   ──(3) Authenticated Result─────────────► │                │\n│                                                            ▼                │\n│  Receives Final Result ◄──────(4) HTTP Result────── Saves to Vault          │\n│                                                     (_raw/ & &lt;egg&gt;.md)      │\n└─────────────────────────────────────────────────────────────────────────────┘\n\n┌─────────────────────────────────────────────────────────────────────────────┐\n│                       SHARED SUBSCRIPTION MODE (Zero API Keys)              │\n│                                                                             │\n│  Chrome Profile A ────┐                                                     │\n│                       ├──► Obsidian Plugin (127.0.0.1:27123)                │\n│  Chrome Profile B ────┘        │                                            │\n│                                ▼                                            │\n│                       SubscriptionService (Local CLI or OAuth)              │\n│                       ├── ChatGPT Sign-In (OpenAI Responses API)            │\n│                       ├── Codex CLI (@openai/codex)                         │\n│                       ├── Claude Code CLI (claude auth login)               │\n│                       └── Google Gemini (Antigravity CLI: agy)              │\n└─────────────────────────────────────────────────────────────────────────────┘</code>',
    docs_obsidianPlugin_030: 'الوضع 1: وضع API المتصل (افتراضي)',
    docs_obsidianPlugin_031:
      'في هذا الوضع، يمكنك تكوين موفر الذكاء الاصطناعي ومفتاح واجهة برمجة التطبيقات مباشرةً في <strong>Chrome خيارات الامتداد</strong>. Obsidian ينسق سير عمل المعرفة بينما Chrome يعمل كمشغل AI محلي آمن.',
    docs_obsidianPlugin_032:
      '<strong> موفرو السحابة المدعومون</strong>: أنثروبي (Claude 3.5 Sonnet، Claude 3.7 Sonnet)، OpenAI (GPT-4o، o-series)، Google Gemini (2.0 Flash، 2.5 Pro)، DeepSeek (V3، R1)، Kimi، كوين، زيبو، و OpenRouter.',
    docs_obsidianPlugin_033:
      '<strong>Local LLMs (Ollama، LM Studio، llama.cpp، vLLM)</strong>: تكوين نقاط النهاية المحلية مباشرة في Chrome. NutEgg يتصل بالطراز المحلي الخاص بك دون إرسال البيانات خارج جهازك.',
    docs_obsidianPlugin_034:
      '<strong>ملفات تعريف Chrome مستقلة</strong>: إذا كنت تستخدم ملفات تعريف Chrome متعددة (مثل العمل والشخصي)، فيمكن لكل ملف تعريف استخدام الموفر والطراز ومفتاح واجهة برمجة التطبيقات (API) الخاص به. إنهم يتصلون بنفس قبو Obsidian دون تصادمات المفاتيح.',
    docs_obsidianPlugin_035:
      "<strong>Obsidian-الإجراءات الأصلية</strong>: مهام صيانة Vault فقط (مثل الدمج اليدوي egg في Obsidian) تستخدم الإعدادات الأصلية المخزنة بأمان في Obsidian's <code>SecretStorage</code>. يؤدي النقر على <strong>حفظ ومتابعة</strong> في ملف تعريف Chrome متصل إلى تحديث الحساب الأصلي في SecretStorage بشكل آمن.",
    docs_obsidianPlugin_036: 'الوضع 2: وضع الاشتراك المشترك وتسجيل الدخول إلى ChatGPT',
    docs_obsidianPlugin_037:
      'ألا ترغب في إدارة مفاتيح واجهة برمجة التطبيقات (API) أو أرصدة الدفع لكل رمز مميز؟ NutEgg يدعم تسجيل الدخول المباشر واشتراكات CLI للمطورين المحليين المُدارة داخل Obsidian:',
    docs_obsidianPlugin_038: 'الخيار أ: تسجيل الدخول المباشر إلى ChatGPT (لا حاجة إلى واجهة سطر الأوامر)',
    docs_obsidianPlugin_039: 'في Obsidian، افتح <strong>الإعدادات → NutEgg</strong>.',
    docs_obsidianPlugin_040: 'ضمن <strong>اتصال AI</strong>، حدد <strong>تسجيل الدخول إلى ChatGPT</strong>.',
    docs_obsidianPlugin_041:
      'انقر على <strong>متابعة مع ChatGPT</strong>، وأكمل عملية ترخيص المتصفح، واسمح باستخدام الخطة.',
    docs_obsidianPlugin_042: 'اختر نموذج حسابك (على سبيل المثال <code>gpt-4o</code>).',
    docs_obsidianPlugin_043:
      'جميع الملفات الشخصية Chrome المتصلة تتبع هذا الاتصال فورًا بدون إعداد مفتاح API. تعيش بيانات الاعتماد بشكل آمن في تخزين سلسلة مفاتيح نظام التشغيل لكل تثبيت ولا يتم إرسالها أبدًا إلى Chrome أو تخزينها في ملفات قبو.',
    docs_obsidianPlugin_044: 'الخيار ب: اشتراكات CLI المحلية (Codex، Claude، Gemini)',
    docs_obsidianPlugin_045: 'NutEgg يمكنه تشغيل أدوات CLI الرسمية للمطورين المثبتة بالفعل وتسجيل الدخول على جهازك:',
    docs_obsidianPlugin_046: 'مزود',
    docs_obsidianPlugin_047: 'تركيب CLI',
    docs_obsidianPlugin_048: 'المصادقة',
    docs_obsidianPlugin_049: 'اكتشاف النموذج',
    docs_obsidianPlugin_050: '<strong>Codex كلي</strong>',
    docs_obsidianPlugin_051: '<code>npm install -g @openai/codex</code>',
    docs_obsidianPlugin_052: '<code>codex login</code>',
    docs_obsidianPlugin_053: 'تلقائي عبر خادم التطبيق',
    docs_obsidianPlugin_054: '<strong>أنثروبي Claude</strong>',
    docs_obsidianPlugin_055:
      '<a href="https://code.claude.com/docs/en/quickstart" target="_blank" rel="noopener">Claude الكود</a>',
    docs_obsidianPlugin_056: '<code>claude auth login --claudeai</code>',
    docs_obsidianPlugin_057: 'Sonnet أو Opus أو Haiku أو معرف مخصص',
    docs_obsidianPlugin_058: '<strong>جوجل Gemini</strong>',
    docs_obsidianPlugin_059:
      '<a href="https://antigravity.google/docs/cli/install" target="_blank" rel="noopener">مضاد الجاذبية</a>',
    docs_obsidianPlugin_060: '<code>agy</code> تدفق المتصفح',
    docs_obsidianPlugin_061: 'تلقائي عبر <code>agy models</code>',
    docs_obsidianPlugin_062:
      'في Obsidian الإعدادات → NutEgg، ما عليك سوى تحديد واجهة سطر الأوامر ضمن <strong>اتصال AI</strong>. يعمل <code>SubscriptionService</code> الداخلي لـ NutEgg على تشغيل الاستدلال في قائمة انتظار تسلسلية محدودة محليًا. ليست هناك حاجة إلى خادم جسر منفصل أو منفذ 27124.',
    docs_obsidianPlugin_063: 'خادم المزامنة المحلية والأمن',
    docs_obsidianPlugin_064:
      'عندما يتم تمكين المكون الإضافي، فإنه يقوم تلقائيًا بتشغيل مستمع HTTP وWebSocket في الخلفية على <code>127.0.0.1:27123</code>.',
    docs_obsidianPlugin_065: '🔒 الخصوصية وأمن الأصل',
    docs_obsidianPlugin_066:
      'يرتبط الخادم المحلي بشكل صارم بعنوان استرجاع المضيف المحلي (<code>127.0.0.1</code>). فهو يفرض التحقق الصارم من صحة الرمز المميز <code>X-NutEgg-Extension-Origin</code>، مما يمنع صفحات الويب العادية من الوصول إلى مخزنك. تتم مصادقة اتصالات WebSocket في الإطار الأول.',
    docs_obsidianPlugin_067: 'تخصيص سير العمل والتعليمات النصية',
    docs_obsidianPlugin_068:
      'يشغّل NutEgg تحليله بالذكاء الاصطناعي باستخدام تعليمات نصية معيارية قابلة للتحرير بصيغة Markdown، تُحفظ مباشرة داخل خزنة ملاحظاتك في <code>nutegg/_workflow/</code>:',
    docs_obsidianPlugin_069:
      '<strong>قوالب قابلة للتحرير</strong>: خصّص التعليمات النصية لتحليل المحتوى، ومقارنة egg، والتوجيه، وأسئلة المتابعة.',
    docs_obsidianPlugin_070:
      '<strong>تحديثات تحافظ على تعديلاتك</strong>: عندما يُصدر NutEgg قوالب تعليمات نصية محدّثة، تُحفظ مسارات العمل التي خصّصتها تلقائيًا دون الكتابة فوقها.',
    docs_workflow_001: 'سير عمل الذكاء الاصطناعي ومحرّك التعليمات النصية — NutEgg',
    docs_workflow_002: 'Chrome المتجر الإلكتروني ↗',
    docs_workflow_003: 'Obsidian البرنامج المساعد ↗',
    docs_workflow_004: 'الإصدارات',
    docs_workflow_005: 'سياسة الخصوصية',
    docs_workflow_006: 'سير عمل الذكاء الاصطناعي ومحرّك التعليمات النصية',
    docs_workflow_007:
      'تعرّف على كيفية تنسيق محرّك سير العمل المعياري في NutEgg لاستخراج المحتوى، وتوجيه egg اعتمادًا على الملخّص، والتحليل المبني على التعليمات، والتعليمات النصية التي يمكن للمستخدم تخصيصها.',
    docs_workflow_008: 'العمارة ذات المرحلتين',
    docs_workflow_009:
      'بدلًا من تنفيذ تعليمة نصية واحدة ضخمة، يستخدم NutEgg <strong>بنية من مرحلتين</strong> لتحقيق كفاءة استخدام الرموز، ودقّة عالية في الاستخراج، وتحكّم كامل للمستخدم:',
    docs_workflow_010:
      '<code>                    ┌───────────────────────────────┐\n                    │      Captured Web Content     │\n                    │   (Article / YouTube / Tweet) │\n                    └───────────────┬───────────────┘\n                                    │\n                                    ▼\n       ===========================================================\n       STAGE 1: Content & Discussion Analysis + Egg Routing\n       ===========================================================\n            │                                             │\n            ├─► Content Analysis                          ├─► Discussion Analysis\n            │   (Is content >30k chars?)                  │   (When 💬 Discussion enabled\n            │    ├── No  ──► [content-analysis.md]        │    & comments captured)\n            │    └── Yes ──► Chunks + [aggregate-         │    ├── [discussion-analysis.md]\n            │                content.md]                  │    └── [aggregate-discussion.md]\n            │                                             │\n            └──────────────────────┬──────────────────────┘\n                                   │\n                                   ▼\n        Produces: Title Verdict, 3-Bullet Summary, Mind Map,\n        Timestamped Q&A, and Discussion Topics/Stances\n                                   │\n                                   ▼\n                          [egg-routing.md]\n          (Routes matched eggs from _index.md using the\n           concise Stage 1 summary instead of raw content)\n                                    │\n                                    ▼\n       ===========================================================\n       INTERACTIVE CHOICE / EXECUTION MODE (Chrome Extension)\n       ===========================================================\n                                    │\n                        Which mode is selected?\n                                    │\n            ┌───────────────────────┼───────────────────────┐\n            ▼                       ▼                       ▼\n     [Standalone Mode]         [🌞 Full Mode]      [🌛 Preview Summary]\n     Obsidian is offline.      Auto-proceeds to    User reviews matched eggs:\n     Runs Stage 1 in Chrome    Stage 2 with all    ├── "Collect Nut Only"\n     with user\'s API key.      matched eggs.       └── Add/remove eggs ──► Proceed\n     (Fast reading & Q&A)           │                       │\n            │                       └───────────┬───────────┘\n            ▼                                   ▼\n    Results in Side Panel      ===========================================================\n    (No Stage 2 analysis)    STAGE 2: Per-Egg Instruction-Driven Analysis\n                               ===========================================================\n                                                │\n                                   For each confirmed egg (1 or N):\n                                                │\n                                                ▼\n                                        [egg-analysis.md]\n                                  (Extract candidate knowledge entries\n                                   & key questions scoped to this egg)\n                                                │\n                                                ▼\n                                  (Answers + extracted entries + reading action)\n                                                │\n                                                ▼\n                                     Results returned to Popup\n                                     (Ready to Save Nut & Eggs)</code>',
    docs_workflow_011: '💡 لماذا التوجيه المبني على الملخص؟',
    docs_workflow_012:
      'التوجيه eggs باستخدام ملخص المرحلة 1 بدلاً من المقالات الأولية الكاملة أو نصوص الفيديو متعددة الساعات يوفر عشرات الآلاف من الرموز المميزة لكل تشغيل ويحسن دقة التوجيه من خلال التركيز على السمات الدلالية المقطرة وعالية الإشارة.',
    docs_workflow_013:
      'يُظهر مؤشر علامات التبويب باللوحة الجانبية التحليلات الجارية والنتائج المكتملة غير المقروءة في النافذة Chrome الحالية. انقر فوقه لسرد علامات التبويب والتبديل مباشرة إلى نتائجها أو تقدمها. تصبح النتائج مقروءة عندما يكون تحليلها مرئيًا في علامة التبويب النشطة. يستمر التتبع بينما تظل اللوحة مفتوحة ويتم إعادة ضبطها عند إغلاقها.',
    docs_workflow_014:
      'يقوم Hatch بأرشفة التحليل الأصلي وإلحاق الإدخالات المعتمدة بـ <code># Unprocessed</code>. يتم تشغيل الدمج عند 20 إدخالاً معلقًا أو عند الطلب لتجميع الأجزاء وإلغاء المطالبات المكررة مع الحفاظ على المصادر والتحذيرات والأمثلة والخلافات. لا تتلقى المرحلة الثانية شجرة المعرفة مطلقًا، لذا تقوم التوصية بتقييم الملاءمة والمضمون بدلاً من الجدة.',
    docs_workflow_015:
      'يشترك خيار قسم <strong>🍃 المعرفة</strong> والقائمة المنسدلة Egg التحليل في إعداد واحد لعلامة تبويب المتصفح الحالية: <strong>🥚 التحليل فقط</strong> يقوم بإيقاف تشغيل المعرفة، و<strong>🍃 تضمين المعرفة</strong> يقوم بتشغيلها. يؤدي تبديل اختيارات القائمة المنسدلة إلى تحديث الإعداد وتسمية الزر دون تشغيل مكالمة AI تلقائيًا - انقر فوق الزر للتحليل. عند التبديل إلى تضمين المعرفة لـ egg الذي تم تحليله مسبقًا بدون إدخالات المعرفة، NutEgg يعيد تشغيل المرحلة 2 بدلاً من مجرد إظهار نتيجة الإجابة فقط المخزنة مؤقتًا. تضمين المعرفة هو الإعداد الافتراضي الأولي؛ يصبح اختيارك الأخير هو الخيار الافتراضي لعلامات التبويب بدون تحليل. لا يؤدي إيقاف تشغيل الخيار إلى إخفاء الإدخالات التي تم إنشاؤها مسبقًا أو منع حفظها. يؤدي إيقاف تشغيل المعرفة إلى تعطيل الإدخالات لكل egg محدد. يتيح تشغيله الإدخالات فقط لـ eggs التي تسمح لهم: <code>Generate Knowledge Entries: no</code> أو إلغاء الاشتراك في دليل عمل egg يأخذ الأولوية. تظل الإجابات الرئيسية وتوصيات القراءة متاحة في كلتا الحالتين. التحليل لا يحفظ الإدخالات؛ <strong>🐣 Hatch Egg</strong> يحفظ الإدخالات التي تم إنشاؤها في egg الملفات.',
    docs_workflow_016: 'أوضاع سير العمل',
    docs_workflow_017: 'الوضع',
    docs_workflow_018: 'السلوك',
    docs_workflow_019: 'أفضل استخدام ل',
    docs_workflow_020: '<strong>📱 الوضع المستقل</strong>',
    docs_workflow_021:
      'تشغيل تحليل محتوى المرحلة الأولى مباشرةً في Chrome (عندما يكون Obsidian غير متصل بالإنترنت أو مغلقًا). يُنتج أحكامًا وملخصات من 3 جمل وخرائط ذهنية مع طوابع زمنية قابلة للنقر عليها وفيديو تفاعلي للأسئلة والأجوبة مع القفز بين الطوابع الزمنية. تخطي تحليل المرحلة الثانية egg.',
    docs_workflow_022: 'قراءة سريعة للويب والفيديو، أو الفهم السريع، أو عندما لا تحتاج إلى أرشفة الملاحظات.',
    docs_workflow_023: '<strong>🌞 الوضع الكامل</strong>',
    docs_workflow_024:
      'يشغّل تحليل محتوى المرحلة 1، ويوجّه eggs تلقائيًا عبر <code>_index.md</code>، وينفّذ فورًا تحليل egg في المرحلة 2 في عملية واحدة متواصلة.',
    docs_workflow_025: 'القراءة اليومية والتقاط الصور السريعة عندما تثق في المطابقة التلقائية egg.',
    docs_workflow_026: '<strong>🌛 ملخص المعاينة</strong>',
    docs_workflow_027:
      'يقوم بتشغيل تحليل محتوى المرحلة الأولى، ثم يتوقف مؤقتًا في النافذة المنبثقة. العروض المطابقة eggs بجانب قائمة egg الكاملة الخاصة بخزنتك. يمكنك إضافة/إزالة eggs، أو متابعة مقارنة المعرفة، أو النقر على <strong>اجمع Nut فقط</strong>.',
    docs_workflow_028: 'بحث عميق أو مواضيع غامضة أو عندما تريد فقط تلخيصًا سريعًا دون تحديث egg أشجار المعرفة.',
    docs_workflow_029: 'تنفيذ الذكاء الاصطناعي وبروتوكول الاعتماد',
    docs_workflow_030:
      'بغض النظر عما إذا اخترت الوضع الكامل أو ملخص المعاينة، NutEgg يفصل <em>تنسيق سير العمل</em> عن <em>تخزين بيانات الاعتماد واستدلال الذكاء الاصطناعي</em>:',
    docs_workflow_031:
      '<strong>وضع API المتصل (الافتراضي)</strong>: ينسّق Obsidian إدراج قوالب التعليمات النصية ومقارنة المعرفة، لكنه يرسل طلبات التنفيذ إلى Chrome عبر اتصال WebSocket موثّق (<code>/execution/socket</code>). ينفّذ Chrome طلب النموذج اللغوي باستخدام مفتاح API المحلي، ثم يعيد النتيجة الموثّقة. <strong>مفتاح API الخاص بك لا يغادر Chrome.</strong>',
    docs_workflow_032:
      '<strong>وضع الاشتراك المشترك</strong>: Obsidian ينسق سير العمل وينفذ مكالمات AI مباشرة محليًا باستخدام أدوات CLI الرسمية للمطور (<code>codex</code>، <code>claude</code>، <code>agy</code>) أو تسجيل الدخول المباشر إلى ChatGPT OAuth. تشارك جميع الملفات الشخصية Chrome المتصلة هذا الاشتراك دون الحاجة إلى مفتاح API.',
    docs_workflow_033: 'ملفات سير العمل في مخزنك',
    docs_workflow_034:
      'يضع NutEgg قوالب التعليمات النصية تلقائيًا في <code>nutegg/_workflow/</code> داخل خزنة ملاحظاتك:',
    docs_workflow_035: '1. أجزاء مشتركة (تُدرج في التعليمات النصية الأخرى)',
    docs_workflow_036:
      '<code>shared-output-rules.md</code>: التوجيه الأساسي (محتوى المصدر باعتباره الحقيقة الوحيدة) والقواعد المرجعية للغة الإخراج متعددة اللغات. تم حقنه كـ <code>{{shared_output_rules}}</code>.',
    docs_workflow_037:
      '<code>content-task-default.md</code>: تعليمات المهمة الأساسية لأحكام العنوان وملخصات مكونة من 3 نقاط وخرائط ذهنية مع طوابع زمنية قابلة للنقر عليها. تم حقنه كـ <code>{{content_task_default}}</code>.',
    docs_workflow_038: '2. التقاط المحتوى ومقارنته',
    docs_workflow_039:
      '<code>content-analysis.md</code>: ملخص محتوى المرحلة الأولى، وحكم مكافحة اصطياد النقرات، وخريطة ذهنية تفاعلية مع طوابع زمنية قابلة للنقر، وإجابات أسئلة مخصصة مع اقتباسات الطوابع الزمنية.',
    docs_workflow_040:
      '<code>egg-routing.md</code>: ملخصات المرحلة الأولى مطابقة لأوصاف egg في <code>_index.md</code> لاختيار المرشح eggs.',
    docs_workflow_041:
      '<code>egg-analysis.md</code>: المرحلة الثانية لكل egg استخراج إدخالات المعرفة للمرشح وإجابات الأسئلة الرئيسية المحددة لتعليمات egg واحدة.',
    docs_workflow_042:
      'يستحق القراءة إذا وتخطي إذا دليل القراءة الكاملة، أو النقاط البارزة، أو الملخص الكافي، أو التخطي، أو غير المؤكد. تظل الإجابات المفيدة قابلة للحفظ بغض النظر عن التوصية.',
    docs_workflow_043:
      '<code>aggregate-content.md</code> &amp; <code>aggregate-egg.md</code>: تجميع المحتوى الطويل (&gt; 30 ألف حرف). تجمع المرحلة الثانية بين مسودات الإجابات وملاحظات التوصيات والتغطية فقط؛ تظل الإدخالات المستخرجة بترتيب المصدر حتى يتم الدمج.',
    docs_workflow_044: '3. تحليل المناقشة (المرحلة 1)',
    docs_workflow_045:
      'يتم تنفيذ تحليل المناقشة كجزء من <strong>المرحلة 1</strong> تحليل المحتوى عندما يتم تمكين قسم <strong>💬 المناقشة</strong> في خيارات الامتداد أو أقسام التحليل المنبثقة، ويلتقط مستخرج الصفحة تعليقات القراء أو ردود وسائل التواصل الاجتماعي (على سبيل المثال، تعليقات YouTube، ردود Twitter، سلاسل Reddit/forum، تعليقات Bilibili، أو إجابات Zhihu).',
    docs_workflow_046:
      '<code>discussion-analysis.md</code>: تحليل التعليقات على دفعات لاستخراج 3-5 موضوعات مناقشة أساسية، وتصنيف مواقف المعلقين (<code>agree</code>، <code>disagree</code>، <code>mixed</code>، <code>neutral</code>، <code>unclear</code>)، وتسليط الضوء على مكملات أو تصحيحات التجربة المباشرة القيمة (<code>supplement: true</code>).',
    docs_workflow_047:
      '<code>aggregate-discussion.md</code>: دمج وتجميع المواضيع وتوزيعات المواقف عبر سلاسل التعليقات متعددة الدفعات للمنتديات الكبيرة أو أقسام تعليقات الفيديو.',
    docs_workflow_048:
      '<strong>تدفق السياق:</strong> يتم إرجاع ملخصات المناقشة وعناصر الأدلة التي تم تحليلها في نتيجة المرحلة الأولى ويتم إدخالها مباشرة في الأسئلة والأجوبة المخصصة أو تحليل نص المنتدى (وهو أمر حاسم للصفحات أو مقاطع الفيديو التي تتمحور حول المناقشة بدون نصوص). يتم أيضًا إعادة توجيهها كإشارات سياقية إلى المرحلة 2 <code>egg-analysis.md</code> حتى يتمكن eggs من تقييم تعليقات المجتمع جنبًا إلى جنب مع محتوى المصدر.',
    docs_workflow_049: '4. سير العمل التفاعلي والصيانة',
    docs_workflow_050:
      '<code>follow-up.md</code>: أسئلة وأجوبة تفاعلية باللغة الطبيعية في اللوحة الجانبية مع سجل المحادثة السابقة والقفز السريع للطوابع الزمنية للفيديو القابل للنقر.',
    docs_workflow_051:
      '<code>merge-unprocessed.md</code>: يتم تشغيله يدويًا أو تلقائيًا عند أكثر من 20 إدخالًا معلقًا لتنظيم العناصر الأولية وتداخلها في <code># Knowledge</code>.',
    docs_workflow_052:
      '<code>localize-egg.md</code>: يترجم قوالب egg الجديدة إلى اللغات الأجنبية مع الحفاظ على العناوين الهيكلية الإنجليزية.',
    docs_workflow_053: 'إرشادات التخصيص الآمن',
    docs_workflow_054: '⚠️ ما يجب الحفاظ عليه',
    docs_workflow_055:
      'يمكنك تخصيص أسلوب التعليمات النصية ووجهة نظرها وعمقها بحرية. لكن <strong>يجب الحفاظ على</strong>:',
    docs_workflow_056:
      'جميع العلامات <code>{{placeholder}}</code> (مثل <code>{{content}}</code>، <code>{{knowledge_tree}}</code>، <code>{{title}}</code>).',
    docs_workflow_057:
      'مفاتيح إخراج JSON الدقيقة (على سبيل المثال <code>titleVerdict</code>، <code>extractedEntries</code>، <code>mindMap</code>) حتى يتمكن المحلل اللغوي من إلغاء تسلسل الاستجابة.',
    docs_workflow_058: 'العناوين الهيكلية (<code># Knowledge</code> و<code># Unprocessed</code>) في مخرجات Markdown.',
    docs_workflow_059: 'تحديثات وإعادة تعيين خالية من الصراع',
    docs_workflow_060: 'عند تحديث NutEgg إلى إصدار أحدث:',
    docs_workflow_061: '<strong>تعليمات نصية لم تُعدَّل</strong>: تُحدَّث تلقائيًا إلى أحدث إصدار مدمج.',
    docs_workflow_062:
      '<strong>تعليمات نصية مخصّصة</strong>: لا يُكتب فوق تعديلاتك مطلقًا. يكتب NutEgg ملف <code>[filename].new.md</code> بجانب ملفك، لتتمكّن من مراجعة الإضافات الجديدة في الوقت المناسب لك.',
    docs_workflow_063:
      '<strong>إعادة ضبط المصنع ("استخدام الإعدادات الافتراضية")</strong>: هل تحتاج إلى بداية جديدة؟ من <strong>إعدادات Obsidian → NutEgg</strong>، انقر على <strong>استخدام الإعدادات الافتراضية</strong>. تُحفظ نسخة احتياطية آمنة من جميع التعليمات النصية الموجودة في <code>nutegg/_workflow/_backup/&lt;timestamp&gt;/</code>، وتُستعاد إعدادات المصنع الأصلية.',
  },
  fr: {
    docs_chromeExtension_001: 'Guide de l’extension Chrome — NutEgg',
    docs_chromeExtension_002: 'Chrome Boutique en ligne ↗',
    docs_chromeExtension_003: 'ObsidianPlugin↗',
    docs_chromeExtension_004: '🎬 Vidéo promotionnelle ↗',
    docs_chromeExtension_005: "Versions d'extension",
    docs_chromeExtension_006: 'Politique de confidentialité',
    docs_chromeExtension_007: 'Installation et utilisation de l’extension Chrome',
    docs_chromeExtension_008:
      "L'extension NutEgg Chrome se trouve dans le panneau latéral de votre navigateur, fournissant une extraction de contenu à la demande, des cartes mentales YouTube avec des horodatages cliquables et une capture en un clic vers Obsidian.",
    docs_chromeExtension_009: 'Mise en place',
    docs_chromeExtension_010: 'Option 1 : Chrome Boutique en ligne (recommandé)',
    docs_chromeExtension_011:
      'Installez NutEgg en un clic directement depuis la boutique en ligne officielle <a\n            href="https://chromewebstore.google.com/detail/nutegg/bmdmdiicembobejibggoeiahaonphcol"\n            target="_blank"\n            rel="noopener"\n            >Chrome</a\n          > :',
    docs_chromeExtension_012:
      'Visitez la page <a\n              href="https://chromewebstore.google.com/detail/nutegg/bmdmdiicembobejibggoeiahaonphcol"\n              target="_blank"\n              rel="noopener"\n              >NutEgg Chrome de la boutique en ligne</a\n            >.',
    docs_chromeExtension_013: 'Cliquez sur <strong>Ajouter à Chrome</strong>.',
    docs_chromeExtension_014:
      "Cliquez sur l'icône de la pièce de puzzle dans la barre d'outils Chrome et épinglez <strong>NutEgg</strong> pour un accès pratique au panneau latéral.",
    docs_chromeExtension_015: 'Option 2 : à partir de la version GitHub (.zip)',
    docs_chromeExtension_016:
      'Téléchargez la dernière <code>nutegg-chrome-extension-*.zip</code> depuis la page <a\n              href="https://github.com/staff-000/nutegg-chrome-extension-release/releases"\n              target="_blank"\n              rel="noopener"\n              >Releases</a\n            >.',
    docs_chromeExtension_017: "Décompressez l'archive dans un dossier local sur votre ordinateur.",
    docs_chromeExtension_018: 'Ouvrez Google Chrome et accédez à <code>chrome://extensions</code>.',
    docs_chromeExtension_019: 'Activez le <strong>Mode développeur</strong> dans le coin supérieur droit.',
    docs_chromeExtension_020:
      'Cliquez sur <strong>Load unpacked</strong> et sélectionnez le répertoire décompressé contenant <code>manifest.json</code>.',
    docs_chromeExtension_021:
      "Cliquez sur l'icône du puzzle dans la barre d'outils Chrome et épinglez <strong>NutEgg</strong> pour un accès facile.",
    docs_chromeExtension_022: 'Flux de travail du panneau latéral',
    docs_chromeExtension_023: "Cliquer sur l'icône d'extension NutEgg ouvre le panneau latéral de Chrome :",
    docs_chromeExtension_024:
      "<strong>Extraction automatique</strong> : lors de votre navigation, NutEgg détecte l'onglet actif (YouTube vidéo, fil Twitter/X ou article de blog) et extrait son texte et sa structure.",
    docs_chromeExtension_025:
      "<strong>Actualisation du contenu (🔄)</strong> : cliquez sur le bouton d'actualisation dans l'aperçu du contenu pour réextraire la page sur les applications dynamiques d'une seule page sans rediriger de manière inattendue hors de l'aperçu.",
    docs_chromeExtension_026:
      '<strong>Cible Egg Sélecteur</strong> : dans l\'aperçu du contenu, choisissez les connaissances cibles eggs ou utilisez "Cible eggs (sélection automatique par défaut)" pour permettre à l\'IA de faire correspondre automatiquement les arborescences de coffre-fort pertinentes.',
    docs_chromeExtension_027:
      "<strong>Modes d'analyse</strong> : <ul> <li> <strong>Mode complet</strong> : évalue le contenu et exécute immédiatement la correspondance des connaissances avec la correspondance eggs dans un seul flux de travail rationalisé. </li> <li> <strong>Mode Aperçu</strong> : génère d'abord l'aperçu de l'étape 1 (résumé, carte mentale, questions-réponses, discussion), vous permettant d'inspecter ou d'ajuster la cible eggs avant d'exécuter l'analyse des connaissances egg à la demande. </li> </ul>",
    docs_chromeExtension_028:
      "<strong>Indicateur d'état</strong> : Un point vert indique une connexion saine à votre serveur Obsidian local (<code>127.0.0.1:27123</code>). S'il est rouge, assurez-vous que Obsidian est en cours d'exécution avec le plugin NutEgg activé.",
    docs_chromeExtension_029: 'YouTube Intégration et navigation intelligente',
    docs_chromeExtension_030: 'Sur YouTube pages vidéo, NutEgg extraits :',
    docs_chromeExtension_031:
      '<strong>Sous-titres et transcriptions complètes</strong> : extraction automatique de haute précision du créateur et transcriptions générées automatiquement.',
    docs_chromeExtension_032:
      "<strong>Mind Map avec horodatages cliquables</strong> : répartition instantanée avec des boutons d'horodatage cliquables qui recherchent votre lecteur vidéo YouTube actif directement sur ce segment. Lorsque des horodatages sont présents, les balises source redondantes sont masquées pour garder l'arborescence propre.",
    docs_chromeExtension_033:
      "<strong>Q&amp;A avec Timestamp Jumping</strong> : posez n'importe quelle question sur la vidéo en langage naturel ; NutEgg fournit des réponses citées avec des pilules d'horodatage cliquables qui accèdent directement au moment source de la lecture vidéo.",
    docs_chromeExtension_034:
      "<strong>Verdict Anti-Clickbait</strong> : Une réponse objective en 1 phrase à la prémisse du titre de la vidéo, vous permettant d'éviter immédiatement les peluches.",
    docs_chromeExtension_035: 'Navigation dans les sources de texte dans la page',
    docs_chromeExtension_036: 'Lorsque vous lisez des articles, des blogs ou des forums :',
    docs_chromeExtension_037:
      "<strong>📍 Aller à la source</strong> : les nœuds de carte mentale de texte et les citations de questions-réponses incluent des balises source. Cliquer sur une balise source fait automatiquement défiler la page Web en direct jusqu'au paragraphe ou à la citation correspondant exactement et le met brièvement en évidence avec un aperçu.",
    docs_chromeExtension_038:
      '<strong>Navigation dans les commentaires</strong> : sur les pages de discussion (Reddit, Zhihu, etc.), en cliquant sur les citations sources, vous accédez directement au commentaire ou à la réponse spécifique.',
    docs_chromeExtension_039: 'Analyse des discussions et perspectives de la communauté',
    docs_chromeExtension_040:
      'NutEgg analyse les commentaires publics sur YouTube, Reddit, Twitter/X, Zhihu et les forums :',
    docs_chromeExtension_041:
      "<strong>Répartition des sujets et des positions</strong> : résume les principaux points du débat avec des badges de position (d'accord 👍, pas d'accord 👎, mitigé 🤔, neutre ⚖️) et des mesures de réaction.",
    docs_chromeExtension_042:
      "<strong>Extra Insights</strong> : les commentaires de grande valeur contenant des preuves, des mises en garde ou des expériences uniques sont conservés sous forme d'informations supplémentaires concises.",
    docs_chromeExtension_043: 'Chrome-Mode autonome uniquement (aucun Obsidian requis)',
    docs_chromeExtension_044:
      "Vous n'avez pas Obsidian installé ou actuellement ouvert ? NutEgg fonctionne de manière complètement autonome dans Google Chrome !",
    docs_chromeExtension_045: '⚡ Lecture Web rapide sans surcharge de notes',
    docs_chromeExtension_046:
      "NutEgg est conçu avant tout comme un compagnon de lecture web ultra-rapide. Vous pouvez extraire, résumer, générer des cartes mentales et poser des questions sur n'importe quel article ou vidéo YouTube directement dans Chrome sans jamais toucher à un coffre-fort de notes.",
    docs_chromeExtension_047: 'Fonctionnalités disponibles en Chrome autonome :',
    docs_chromeExtension_048:
      '<strong>🎯 Verdict instantané anti-Clickbait</strong> : Une réponse objective en 1 phrase à la question du titre.',
    docs_chromeExtension_049:
      '<strong>📝 Résumé exécutif en 3 phrases</strong> : points à retenir haute densité extraits de tout long article ou vidéo.',
    docs_chromeExtension_050:
      '<strong>⏱️ Carte mentale avec horodatages cliquables et recherche</strong> : accédez aux segments vidéo clés en un seul clic.',
    docs_chromeExtension_051:
      "<strong>💬 Questions et réponses vidéo et saut d'horodatage</strong> : posez des questions et cliquez sur les pilules d'horodatage citées pour parcourir la lecture vidéo directement sur ce segment.",
    docs_chromeExtension_052:
      '<strong>🧠 Cartes mentales pliables</strong> : arbres de pensée interactifs à plusieurs niveaux décomposant visuellement les idées de base.',
    docs_chromeExtension_053:
      '<strong>🌐 Prise en charge de plus de 50 langues</strong> : extrayez et traduisez du contenu en langue étrangère à la volée.',
    docs_chromeExtension_054: 'Comment configurer le mode Chrome uniquement :',
    docs_chromeExtension_055:
      "Cliquez avec le bouton droit sur l'icône d'extension <strong>NutEgg</strong> dans la barre d'outils de Chrome et sélectionnez <strong>Options</strong>.",
    docs_chromeExtension_056:
      "Sélectionnez votre fournisseur d'IA préféré (par exemple, Google Gemini, OpenAI, Claude, DeepSeek ou OpenRouter) et entrez votre clé API.",
    docs_chromeExtension_057:
      "Cliquez sur <strong>Enregistrer</strong>. Vous êtes prêt à analyser n'importe quelle page !",
    docs_chromeExtension_058: "Obsidian Modes de connexion et d'exécution de l'IA",
    docs_chromeExtension_059:
      "Lorsque vous connectez l'extension Chrome au plugin optionnel NutEgg Obsidian, Chrome s'adapte de manière transparente en fonction du mode d'exécution sélectionné :",
    docs_chromeExtension_060: '🔒 Sécurité des clés API : les clés ne partent jamais Chrome',
    docs_chromeExtension_061:
      "En <strong>Mode API connecté</strong>, vos clés API restent strictement dans le stockage d'extension sécurisé de Chrome. Obsidian gère les modèles de connaissances et l'indexation du coffre-fort, mais délègue l'inférence de l'IA à Chrome via un WebSocket local authentifié. Chrome effectue un appel local à l'API du fournisseur et renvoie uniquement le texte généré.",
    docs_chromeExtension_062: "Mode d'exécution",
    docs_chromeExtension_063: "Où fonctionne l'IA",
    docs_chromeExtension_064: "Informations d'identification utilisées",
    docs_chromeExtension_065: '<strong>Chrome-Seulement</strong>',
    docs_chromeExtension_066: "Directement à l'intérieur Chrome",
    docs_chromeExtension_067: 'Clé API configurée dans Chrome Options',
    docs_chromeExtension_068: '<strong>Mode API connecté</strong>',
    docs_chromeExtension_069: 'Chrome (délégué via WebSocket local par Obsidian)',
    docs_chromeExtension_070: 'Clé API en Chrome (clés jamais envoyées en Obsidian)',
    docs_chromeExtension_071: "<strong>Mode d'abonnement partagé</strong>",
    docs_chromeExtension_072: "À l'intérieur de Obsidian (via CLI locale ou ChatGPT OAuth)",
    docs_chromeExtension_073: 'Zéro clé API (utilise Codex, Claude Code, Antigravity ou ChatGPT)',
    docs_chromeExtension_074: 'Prise en charge multi-profils Chrome',
    docs_chromeExtension_075:
      "NutEgg prend en charge plusieurs profils de navigateur Chrome (par exemple Personnel et Travail) se connectant simultanément au même coffre-fort Obsidian. Chaque profil Chrome conserve indépendamment son propre fournisseur, modèle et clé API. La connexion ou le changement de mode d'exécution ne fuit ni n'écrase jamais les clés API entre les profils.",
    docs_chromeExtension_076: 'Récupération hors ligne et déconnexion',
    docs_chromeExtension_077:
      'Si Obsidian est fermé alors que le mode connecté est activé, NutEgg affiche un voyant d\'état clair et vous donne une option <strong> "Utilisez le mode Chrome à la place" </strong> en un seul clic. Cela vous permet de continuer immédiatement à lire et à poser des questions en utilisant la configuration de votre API Chrome sans interruption ni risque de quota.',
    docs_chromeExtension_078: 'Configuration et synchronisation en direct',
    docs_chromeExtension_079:
      "NutEgg inclut la synchronisation en temps réel entre les options d'extension et les panneaux latéraux actifs :",
    docs_chromeExtension_080:
      '<strong>Contrôles des sections de contenu</strong> : personnalisez les sections qui sont extraites et analysées par défaut (Contenu, Résumé, Carte mentale, Questions et réponses, Entrées de connaissances et Discussion) dans la page Options.',
    docs_chromeExtension_081:
      "<strong>Synchronisation des paramètres en direct</strong> : la modification de vos modèles d'analyse, des sections de sortie activées ou des paramètres du serveur met immédiatement à jour tous les panneaux latéraux ouverts sans nécessiter une actualisation de la page.",
    docs_chromeExtension_082:
      "<strong>Port du serveur personnalisé</strong> : si le port par défaut <code>27123</code> est en conflit avec un autre service, ouvrez l'extension <strong>Options</strong>, ajustez le port (par exemple <code>28123</code>) et testez la connexion.",
    docs_index_001: 'Présentation de la documentation — NutEgg',
    docs_index_002: 'Chrome Boutique en ligne ↗',
    docs_index_003: 'ObsidianPlugin↗',
    docs_index_004: '🎬 Vidéo promotionnelle ↗',
    docs_index_005: 'GitHub Sorties',
    docs_index_006: 'Politique de confidentialité',
    docs_index_007: 'Suivi des problèmes',
    docs_index_008: 'Présentation et concepts de base',
    docs_index_009:
      "NutEgg est une extension Chrome gratuite et open source qui vous aide à décider ce qui vaut la peine d'être lu et à le comprendre plus rapidement. Il se trouve dans le panneau latéral de Chrome et fonctionne sur les articles, les fils de discussion et les vidéos YouTube. Un plugin Obsidian en option transforme ce que vous lisez en un coffre-fort de connaissances croissant.",
    docs_index_010: 'Ce que vous obtenez Chrome',
    docs_index_011:
      "Installez l'extension, saisissez votre clé API AI (ou pointez-la vers un modèle local) dans Options, et NutEgg fonctionne immédiatement : pas de compte, pas d'applications supplémentaires :",
    docs_index_012: '🎯 Verdict instantané du titre anti-clickbait',
    docs_index_013: '📝 Résumé exécutif en 3 phrases et points à retenir',
    docs_index_014: '🧠 Cartes mentales hiérarchiques pliables, avec horodatages cliquables pour YouTube',
    docs_index_015:
      "💬 Questions et réponses en langage naturel avec des pilules d'horodatage citées et des liens sources dans la page",
    docs_index_016:
      "🔍 Questions à double portée : strictement à l'intérieur de la page, ou au-delà pour vérifier les faits",
    docs_index_017: '🗣️ Résumés de la section commentaires pour YouTube, Reddit et les forums',
    docs_index_018: '🌐 Extraction multi-sources et traduction dans plus de 50 langues',
    docs_index_019: '💡 Pourquoi NutEgg existe',
    docs_index_020:
      "Une trop grande partie du Web est constituée de vidéos rembourrées, de titres clickbait et d'articles gonflés par l'IA. NutEgg répond d'emblée au titre et vous indique honnêtement si le contenu vaut votre temps. Vous n'accordez donc votre attention que là où cela rapporte.",
    docs_index_021: 'Facultatif : ajoutez Obsidian',
    docs_index_022:
      "Si vous conservez des notes dans Obsidian, installez le plugin compagnon pour connecter l'extension à votre coffre-fort (<code>127.0.0.1:27123</code>). Cela ajoute une évaluation de nouveauté en 2 étapes par rapport aux arbres de connaissances <code>_index.md</code> de votre coffre-fort, à la synthèse delta et à l'archivage automatique des notes dans les fichiers <code>nutegg/_raw/</code> et egg. Tout dans Chrome continue de fonctionner avec ou sans.",
    docs_index_023: 'La métaphore',
    docs_index_024:
      "Avec Obsidian connecté, NutEgg structure votre flux d'informations à l'aide d'une métaphore simple en trois parties :",
    docs_index_025:
      '<strong>🌰 Le Nut (Raw Capture)</strong> : La page Web brute, le fil de discussion ou la transcription YouTube extraite du navigateur. Nuts sont archivés intacts avec des métadonnées complètes dans <code>nutegg/_raw/</code> dans votre coffre-fort.',
    docs_index_026:
      '<strong>🥚 Le Egg (arbre de connaissances)</strong> : une note Markdown vivante et structurée dans votre coffre-fort représentant un domaine de connaissances (par exemple, <code>ai_architecture.md</code>, <code>invest_strategy.md</code>).',
    docs_index_027:
      "<strong>🐣 The Hatch (Synthesis &amp; Delta)</strong> : lorsque le contenu est analysé, l'IA le compare à votre eggs, identifie ce qui est nouveau par rapport à ce qui est déjà documenté et tisse de nouvelles informations dans votre egg.",
    docs_index_028: 'Architecture du système',
    docs_index_029: 'NutEgg a un composant principal et un compagnon facultatif :',
    docs_index_030:
      "<strong>Chrome Extension</strong> : vit dans le panneau latéral de Chrome. Extrait du texte, des commentaires et des transcriptions vidéo. En mode autonome ou en mode API connecté, il exécute les appels IA localement à l'aide de votre fournisseur configuré et de votre clé API, garantissant ainsi que vos clés API ne quittent jamais le navigateur.",
    docs_index_031:
      "<strong>Obsidian Plugin (facultatif)</strong> : exécute un service de synchronisation et de coordination local sur <code>127.0.0.1:27123</code>. Lit le <code>_index.md</code> de votre coffre-fort, gère les modèles d'invite dans <code>_workflow/</code> et archive les connaissances capturées sur le disque. Il prend en charge : <ul> <li> <strong>Mode API connecté (par défaut)</strong> : coordonne la correspondance des connaissances, déléguant l'inférence de l'IA à Chrome via un WebSocket local authentifié (clés jamais envoyées à Obsidian). </li> <li> <strong>Mode d'abonnement partagé</strong> : exécute l'inférence localement via la connexion ChatGPT (OAuth) ou les outils CLI du développeur (Codex, Claude Code, Antigravity) sans aucune clé API requise. </li> </ul>",
    docs_index_032:
      '<code>Chrome Extension (Side Panel)\n │\n ├── [Standalone Mode] Local AI Processing (Verdicts, Summaries, Mind Maps, Q&amp;A)\n │\n └── [Connected Mode] HTTP + WebSocket (127.0.0.1:27123/execution/socket)\n         │\n         ▼\n Obsidian Plugin (Local Server &amp; Coordinator)\n         ├── Evaluates against vault/nutegg/_index.md &amp; prompts in _workflow/\n         ├── In API Mode: Delegates AI calls back to Chrome over WebSocket (keys stay in Chrome)\n         ├── In Subscription Mode: Executes locally via CLI (Codex/Claude/agy) or ChatGPT OAuth\n         └── Writes structured notes to vault/nutegg/_raw/ and &lt;egg&gt;.md</code>',
    docs_index_033: 'Feuille de route de démarrage rapide',
    docs_index_034:
      'Regardez la vidéo promotionnelle <a href="https://www.youtube.com/watch?v=_u6mDoHZSAo" target="_blank" rel="noopener"\n              >🎬 NutEgg</a\n            > pour une présentation visuelle d\'une minute.',
    docs_index_035:
      'Installez l\'extension <a\n              href="https://chromewebstore.google.com/detail/nutegg/bmdmdiicembobejibggoeiahaonphcol"\n              target="_blank"\n              rel="noopener"\n              >Chrome</a\n            > depuis le Chrome Web Store et ajoutez votre clé AI dans Options (voir <a href="chrome-extension.html">guide</a>).',
    docs_index_036:
      "Ouvrez le panneau latéral de n'importe quel article ou YouTube vidéo et cliquez sur <strong>Analyze</strong>. C'est ça!",
    docs_index_037:
      '<em>Facultatif :</em> Installez le <a href="https://community.obsidian.md/plugins/nutegg" target="_blank" rel="noopener">Obsidian Plugin</a> (voir <a href="obsidian-plugin.html">guide</a>) et définissez vos premiers sujets de connaissances dans <a href="knowledge-structuring.html">_index.md</a> pour commencer l\'éclosion.',
    docs_knowledgeStructuring_001: 'Structuration des connaissances et Eggs — NutEgg',
    docs_knowledgeStructuring_002: 'Chrome Boutique en ligne ↗',
    docs_knowledgeStructuring_003: 'ObsidianPlugin↗',
    docs_knowledgeStructuring_004: 'Sorties',
    docs_knowledgeStructuring_005: 'Politique de confidentialité',
    docs_knowledgeStructuring_006: 'Structuration des connaissances et Eggs',
    docs_knowledgeStructuring_007:
      "Découvrez comment NutEgg organise votre coffre-fort Obsidian, associe le contenu Web aux sujets à l'aide de <code>_index.md</code> et fusionne les entrées accumulées dans des arbres de connaissances.",
    docs_knowledgeStructuring_008: 'La disposition du coffre-fort <code>nutegg/</code>',
    docs_knowledgeStructuring_009:
      'Tout le contenu NutEgg est confiné dans un dossier <code>nutegg/</code> propre et isolé dans votre coffre-fort Obsidian :',
    docs_knowledgeStructuring_010:
      '<code>vault/\n└── nutegg/\n    ├── _raw/                          # Captured nuts (raw web content + metadata)\n    │   └── 2026-09-06-14-30-youtube-author-title.md\n    ├── _index.md                      # Topic routing guide\n    ├── ai_architecture.md             # Knowledge egg\n    ├── invest_strategy.md             # Knowledge egg\n    └── productivity.md                # Knowledge egg</code>',
    docs_knowledgeStructuring_011: 'Le guide de routage : <code>_index.md</code>',
    docs_knowledgeStructuring_012:
      'Le fichier <code>_index.md</code> indique à NutEgg quelles notes egg vous gérez et quels domaines elles couvrent. Chaque ligne mappe un chemin de fichier relatif aux mots-clés et descriptions :',
    docs_knowledgeStructuring_013:
      '<code>nutegg/ai_architecture.md: LLMs, multi-agent systems, prompt engineering, RAG, embeddings\nnutegg/invest_strategy.md: value investing, index funds, asset allocation, macroeconomic indicators\nnutegg/productivity.md: deep work, time blocking, habits, personal knowledge management</code>',
    docs_knowledgeStructuring_014: '⚡ Comment fonctionne le routage',
    docs_knowledgeStructuring_015:
      "Lorsque vous cliquez sur <strong>Analyze</strong> dans le navigateur, l'IA de NutEgg lit votre <code>_index.md</code> et détermine quel egg (le cas échéant) correspond au contenu. Si aucun egg existant ne correspond, NutEgg propose de créer automatiquement un nouveau egg à partir du sujet de la page !",
    docs_knowledgeStructuring_016: 'Egg Anatomie des fichiers et fonctionnement des instructions',
    docs_knowledgeStructuring_017:
      "Un fichier <strong>Egg</strong> (stocké sous <code>nutegg/*.md</code>) remplit deux rôles cruciaux : il s'agit à la fois de votre référentiel de connaissances organisé et évolutif pour un domaine et d'une spécification d'invite active qui dirige le pipeline d'IA de NutEgg chaque fois que le contenu touche ce sujet.",
    docs_knowledgeStructuring_018: '1. Plan structurel',
    docs_knowledgeStructuring_019:
      "Chaque fichier egg combine des métadonnées YAML, un bloc d'invocation Obsidian avec des instructions, un arbre de connaissances organisé et un tampon intermédiaire non traité :",
    docs_knowledgeStructuring_020:
      '<code>---\ntopic: "AI Architecture & Multi-Agent Systems"\nstatus: "active"\nlast_updated: "2026-09-10"\n---\n\n> [!abstract]- Instructions:\n> **Scope:** Multi-agent architectures, tool calling, memory layers, and LLM evaluation.\n> **Action Guide:** Focus on actionable design patterns, scalability tradeoffs, and real failure modes.\n> **Key Questions:**\n> 1. How are agent memory loops bounded to prevent context window overflow?\n> 2. What coordination mechanism is used between subagents?\n> **Worth Reading If:**\n&gt; - Practical examples and substantive explanations.\n&gt; **Skip If:**\n> - Ignore basic beginner tutorials or high-level sales pitches without technical substance.\n> - Discard speculative claims lacking empirical benchmarks or code evidence.\n> **Formatting Rules:**\n> - Prefix each insight with a bracketed tag: `[concept]`, `[architecture]`, `[method]`, `[benchmark]`, `[explain]`, `[fact]`, `[example]`.\n> - Use the structure: `- [tag] **Concept Name**` followed by an indented explanation and concrete examples (`- 🎯 Example:`).\n\n# Knowledge\n## Agent Memory\n- [architecture] **Bounded Replay Buffers**\n    - Ephemeral short-term memory expires after session goals terminate to conserve token budget.\n    - 🎯 Example: Tool calling trace logs stored in vector stores with sliding window eviction.\n\n# Unprocessed\n(Newly hatched insights land here from captures until auto-merged)</code>',
    docs_knowledgeStructuring_021: '2. Comment rédiger des instructions Egg',
    docs_knowledgeStructuring_022:
      'La légende <code>&gt; [!abstract]- Instructions:</code> contient six champs spécialisés. Chacun guide une étape spécifique du pipeline d’IA :',
    docs_knowledgeStructuring_023: 'Champ',
    docs_knowledgeStructuring_024: 'Objectif et meilleures pratiques',
    docs_knowledgeStructuring_025: 'Utilisation du flux de travail',
    docs_knowledgeStructuring_026: '<code>**Scope:**</code>',
    docs_knowledgeStructuring_027:
      '1 à 2 phrases définissant les limites thématiques de ce egg. Indiquez explicitement quels concepts, technologies ou questions sont inclus ou exclus.',
    docs_knowledgeStructuring_028:
      "Injecté dans <code>egg-analysis.md</code> (étape 2) afin que l'IA extrait les connaissances strictement à travers cette lentille de domaine.",
    docs_knowledgeStructuring_029: '<code>**Action Guide:**</code>',
    docs_knowledgeStructuring_030:
      "Instructions en 1 à 5 étapes sur la façon dont l'IA résume et évalue le contenu (par exemple en demandant des perspectives, une profondeur ou des compromis spécifiques). Revient au guide par défaut en cas d'omission.",
    docs_knowledgeStructuring_031: 'Injecté dans <code>egg-analysis.md</code> (étape 2).',
    docs_knowledgeStructuring_032: '<code>**Key Questions:**</code>',
    docs_knowledgeStructuring_033:
      'Liste numérotée de questions récurrentes auxquelles vous souhaitez répondre chaque fois que le contenu touche ce domaine (par exemple <em>"Quel est le coût du jeton ?"</em>, <em>"Quels sont les modes de défaillance ?"</em>).',
    docs_knowledgeStructuring_034:
      "Injecté dans <code>egg-analysis.md</code> (étape 2). Répondu dans la fenêtre contextuelle d'extension Chrome et enregistré dans vos notes de capture brutes.",
    docs_knowledgeStructuring_035: '<code>**Worth Reading If:** / **Skip If:**</code>',
    docs_knowledgeStructuring_036:
      "Deux listes de préférences décrivant quand l'original mérite votre temps et quand le résumé est suffisant.",
    docs_knowledgeStructuring_037:
      "Guidez l'action de lecture de l'étape 2 : complète, surlignage, résumé, ignorée ou incertaine. Ils ne rejettent jamais les entrées lors de la fusion.",
    docs_knowledgeStructuring_038: '<code>**Formatting Rules:**</code>',
    docs_knowledgeStructuring_039:
      'Normes de formatage : balises entre crochets (<code>[concept]</code>, <code>[architecture]</code>, <code>[method]</code>, etc.) et indentation hiérarchique des puces.',
    docs_knowledgeStructuring_040:
      'Injecté dans <code>egg-analysis.md</code> (étape 2). Garantit que les entrées des candidats correspondent aux conventions de formatage de vos notes.',
    docs_knowledgeStructuring_041: "3. Arbre de connaissances organisé par rapport à la file d'attente non traitée",
    docs_knowledgeStructuring_042:
      "NutEgg protège votre base de connaissances de la pollution de l'IA en séparant les connaissances conservées des nouvelles captures :",
    docs_knowledgeStructuring_043:
      "<strong><code># Knowledge</code> (Arbre organisé) :</strong> Structuré avec des titres Markdown et des puces imbriquées. Seule la fusion lit cet arbre, consolidant les affirmations équivalentes tout en préservant les exemples, les mises en garde, les désaccords et les sources distincts. L'étape 2 suit les instructions sans comparaison avec l'arbre.",
    docs_knowledgeStructuring_044:
      "<strong><code># Unprocessed</code> (File d'attente intermédiaire) :</strong> Lorsque vous cliquez sur <strong>🥚 Hatch Egg</strong> dans le navigateur, les entrées approuvées et les réponses prises en charge sont ajoutées en toute sécurité à <code># Unprocessed</code> plutôt que de toucher directement votre hiérarchie organisée.",
    docs_knowledgeStructuring_045: '4. Comment chaque pièce est utilisée dans le flux de travail',
    docs_knowledgeStructuring_046:
      'Voici comment le contenu Web circule à travers vos instructions egg, de la capture initiale à la synthèse finale :',
    docs_knowledgeStructuring_047:
      '<code>[Captured Web Content]\n          │\nStage 1   ▼   _index.md (Topic routing guide)\n─────────────────────────────────────────────────────────────\n• Uses content-task-default.md\n• Generates Title Verdict, 3-Bullet Summary, Mind Map\n• egg-routing.md matches target eggs via Stage 1 summary\n          │\n          ▼\nUser Review: Confirm or select target eggs in popup\n          │\nStage 2   ▼   Target Egg File (nutegg/*.md)\n─────────────────────────────────────────────────────────────\n• Scope, Key Questions, Formatting Rules ──► egg-analysis.md\n  (Extracts candidate knowledge entries and answers questions)\n• Worth Reading If / Skip If guide the reading recommendation\n  (Full, highlights, summary, skip, or uncertain; no tree comparison)\n          │\n          ▼\nHatch Egg: Approved entries and supported answers appended to # Unprocessed\n          │\nMerge Cycle (20+ entries or manual button)\n─────────────────────────────────────────────────────────────\n• merge-unprocessed.md nests and integrates entries into # Knowledge</code>',
    docs_knowledgeStructuring_048: 'Fusion automatique des connaissances',
    docs_knowledgeStructuring_049:
      "Lorsque 20 entrées ou plus s'accumulent dans <code># Unprocessed</code> (ou lorsque vous cliquez sur <strong>Fusionner</strong> dans le widget d'affichage de lecture Obsidian), l'IA de NutEgg exécute une synthèse automatisée en arrière-plan à l'aide de <code>merge-unprocessed.md</code>. Il catégorise, déduplique et imbrique les entrées en attente sous les concepts parents appropriés dans <code># Knowledge</code>, gardant votre graphique de connaissances perpétuellement organisé.",
    docs_obsidianPlugin_001: 'Guide du plugin Obsidian — NutEgg',
    docs_obsidianPlugin_002: 'Obsidian Plugin communautaire ↗',
    docs_obsidianPlugin_003: 'Chrome Boutique en ligne ↗',
    docs_obsidianPlugin_004: 'Versions du plugin',
    docs_obsidianPlugin_005: 'Politique de confidentialité',
    docs_obsidianPlugin_006: 'Installation et configuration du plugin Obsidian',
    docs_obsidianPlugin_007:
      "Le plugin NutEgg Obsidian héberge le serveur de synchronisation local, gère la communication de l'IA, fait correspondre le contenu entrant à vos arbres de connaissances et gère vos fichiers de coffre-fort.",
    docs_obsidianPlugin_008: 'Mise en place',
    docs_obsidianPlugin_009: 'Option 1 : Obsidian Plugins communautaires (recommandé)',
    docs_obsidianPlugin_010: 'NutEgg est officiellement répertorié dans le répertoire Obsidian Community Plugins :',
    docs_obsidianPlugin_011: 'Dans Obsidian, ouvrez <strong>Paramètres → Plugins communautaires</strong>.',
    docs_obsidianPlugin_012:
      'Assurez-vous que <strong>Mode restreint</strong> est désactivé, puis cliquez sur <strong>Parcourir</strong>.',
    docs_obsidianPlugin_013:
      'Recherchez <strong>NutEgg</strong> (ou visitez <a href="https://community.obsidian.md/plugins/nutegg" target="_blank" rel="noopener"\n              >NutEgg sur Obsidian Community Plugins</a\n            >).',
    docs_obsidianPlugin_014: 'Cliquez sur <strong>Installer</strong>, puis cliquez sur <strong>Activer</strong>.',
    docs_obsidianPlugin_015: 'Option 2 : Installation manuelle',
    docs_obsidianPlugin_016:
      'Téléchargez <code>main.js</code>, <code>manifest.json</code> et <code>styles.css</code> à partir des <a href="https://github.com/staff-000/nutegg-obsidian-release/releases" target="_blank" rel="noopener"\n              >NutEgg Obsidian versions de plug-in</a\n            >.',
    docs_obsidianPlugin_017:
      "Dans votre coffre-fort Obsidian, ouvrez <code>.obsidian/plugins/</code> (affichez les dossiers cachés dans votre système d'exploitation si nécessaire).",
    docs_obsidianPlugin_018:
      "Créez un nouveau répertoire nommé <code>nutegg</code> et placez les trois fichiers à l'intérieur : <pre><code>your-vault/.obsidian/plugins/nutegg/\n├── main.js\n├── manifest.json\n└── styles.css</code></pre>",
    docs_obsidianPlugin_019:
      'Dans Obsidian, ouvrez <strong>Paramètres → Plugins communautaires</strong>, cliquez sur <strong>Recharger</strong> et activez <strong>NutEgg</strong>.',
    docs_obsidianPlugin_020: 'Option 3 : Utiliser BRAT',
    docs_obsidianPlugin_021:
      'Installez le plugin communautaire <a href="https://github.com/tfthacker/obsidian42-brat" target="_blank" rel="noopener">BRAT</a> dans Obsidian.',
    docs_obsidianPlugin_022: 'Accédez à <strong>Paramètres → BRAT → Ajouter un plugin bêta</strong>.',
    docs_obsidianPlugin_023:
      'Entrez <code>staff-000/nutegg-obsidian-release</code> et cliquez sur <strong>Ajouter un plugin</strong>.',
    docs_obsidianPlugin_024: 'Activez NutEgg une fois installé.',
    docs_obsidianPlugin_025: "Architecture d'exécution de l'IA",
    docs_obsidianPlugin_026:
      "NutEgg utilise une architecture intelligente à double exécution (Protocole 3) qui vous offre une flexibilité totale entre la confidentialité de votre propre clé API et la commodité de l'abonnement sans clé :",
    docs_obsidianPlugin_027:
      '🔒 Invariant de base en matière de confidentialité : les clés API ne quittent jamais Chrome',
    docs_obsidianPlugin_028:
      "Dans le <strong>Mode API connecté</strong>, Obsidian orchestre les opérations de coffre-fort, l'assemblage des invites et egg l'indexation, mais <strong>délègue tous les appels d'IA à Chrome</strong> via un WebSocket local authentifié. Chrome exécute l'appel à l'aide de sa clé API stockée localement. Vos clés API ne sont jamais transmises à Obsidian, jamais écrites dans les notes du coffre-fort et ne quittent jamais le navigateur.",
    docs_obsidianPlugin_029:
      '<code>┌─────────────────────────────────────────────────────────────────────────────┐\n│                           CONNECTED API MODE (Default)                      │\n│                                                                             │\n│  Chrome Profile A ──(1) HTTP /analyze /confirm──►  Obsidian Plugin          │\n│  (Holds API Key A)                                 (127.0.0.1:27123)        │\n│                                                            │                │\n│                   ◄─(2) WebSocket AI Call /socket──────────┤ Reads _index.md│\n│  Calls Provider A                                          │ Assembles prompt│\n│  (OpenAI / Claude / Gemini / DeepSeek)                     │                │\n│                   ──(3) Authenticated Result─────────────► │                │\n│                                                            ▼                │\n│  Receives Final Result ◄──────(4) HTTP Result────── Saves to Vault          │\n│                                                     (_raw/ & &lt;egg&gt;.md)      │\n└─────────────────────────────────────────────────────────────────────────────┘\n\n┌─────────────────────────────────────────────────────────────────────────────┐\n│                       SHARED SUBSCRIPTION MODE (Zero API Keys)              │\n│                                                                             │\n│  Chrome Profile A ────┐                                                     │\n│                       ├──► Obsidian Plugin (127.0.0.1:27123)                │\n│  Chrome Profile B ────┘        │                                            │\n│                                ▼                                            │\n│                       SubscriptionService (Local CLI or OAuth)              │\n│                       ├── ChatGPT Sign-In (OpenAI Responses API)            │\n│                       ├── Codex CLI (@openai/codex)                         │\n│                       ├── Claude Code CLI (claude auth login)               │\n│                       └── Google Gemini (Antigravity CLI: agy)              │\n└─────────────────────────────────────────────────────────────────────────────┘</code>',
    docs_obsidianPlugin_030: 'Mode 1 : mode API connecté (par défaut)',
    docs_obsidianPlugin_031:
      "Dans ce mode, vous configurez votre fournisseur d'IA et votre clé API directement dans <strong>Chrome Options d'extension</strong>. Obsidian coordonne le flux de travail des connaissances tandis que Chrome agit en tant qu'exécuteur d'IA local sécurisé.",
    docs_obsidianPlugin_032:
      '<strong>Fournisseurs de cloud pris en charge</strong> : Anthropic (Claude 3.5 Sonnet, Claude 3.7 Sonnet), OpenAI (GPT-4o, o-series), Google Gemini (2.0 Flash, 2.5 Pro), DeepSeek (V3, R1), Kimi, Qwen, Zhipu et OpenRouter.',
    docs_obsidianPlugin_033:
      '<strong>LLM locaux (Ollama, LM Studio, llama.cpp, vLLM)</strong> : configurez les points de terminaison locaux directement dans Chrome. NutEgg se connecte à votre modèle local sans envoyer de données en dehors de votre machine.',
    docs_obsidianPlugin_034:
      '<strong>Profils Chrome indépendants</strong> : si vous utilisez plusieurs profils Chrome (par exemple, Travail et Personnel), chaque profil peut utiliser son propre fournisseur, modèle et clé API. Ils se connectent au même coffre-fort Obsidian sans collisions de clés.',
    docs_obsidianPlugin_035:
      '<strong>Obsidian-Actions natives</strong> : les tâches de maintenance du coffre-fort uniquement (telles que la fusion manuelle egg dans Obsidian) utilisent les paramètres natifs stockés en toute sécurité dans les <code>SecretStorage</code> de Obsidian. Cliquer sur <strong>Enregistrer et continuer</strong> dans un profil Chrome connecté met à jour en toute sécurité le compte natif dans SecretStorage.',
    docs_obsidianPlugin_036: "Mode 2 : mode d'abonnement partagé et connexion ChatGPT",
    docs_obsidianPlugin_037:
      'Vous ne souhaitez pas gérer de clés API ou de crédits de paiement par jeton ? NutEgg prend en charge la connexion directe et les abonnements CLI des développeurs locaux gérés dans Obsidian :',
    docs_obsidianPlugin_038: 'Option A : connexion directe à ChatGPT (aucune CLI nécessaire)',
    docs_obsidianPlugin_039: 'Dans Obsidian, ouvrez <strong>Paramètres → NutEgg</strong>.',
    docs_obsidianPlugin_040: 'Sous <strong>Connexion AI</strong>, sélectionnez <strong>Connexion ChatGPT</strong>.',
    docs_obsidianPlugin_041:
      "Cliquez sur <strong>Continuer avec ChatGPT</strong>, terminez le flux d'autorisation du navigateur et autorisez l'utilisation du plan.",
    docs_obsidianPlugin_042: 'Choisissez votre modèle de compte (par exemple <code>gpt-4o</code>).',
    docs_obsidianPlugin_043:
      "Tous les profils Chrome connectés suivent immédiatement cette connexion sans configuration de clé API. Les informations d'identification résident en toute sécurité dans le stockage du trousseau du système d'exploitation par installation et ne sont jamais envoyées à Chrome ni stockées dans des fichiers de coffre-fort.",
    docs_obsidianPlugin_044: 'Option B : abonnements CLI locaux (Codex, Claude, Gemini)',
    docs_obsidianPlugin_045:
      'NutEgg peut exécuter les outils CLI de développeur officiels déjà installés et connectés sur votre machine :',
    docs_obsidianPlugin_046: 'Fournisseur',
    docs_obsidianPlugin_047: 'Installation de la CLI',
    docs_obsidianPlugin_048: 'Authentification',
    docs_obsidianPlugin_049: 'Découverte de modèles',
    docs_obsidianPlugin_050: '<strong>Codex CLI</strong>',
    docs_obsidianPlugin_051: '<code>npm install -g @openai/codex</code>',
    docs_obsidianPlugin_052: '<code>codex login</code>',
    docs_obsidianPlugin_053: "Automatique via le serveur d'application",
    docs_obsidianPlugin_054: '<strong>Anthropique Claude</strong>',
    docs_obsidianPlugin_055:
      '<a href="https://code.claude.com/docs/en/quickstart" target="_blank" rel="noopener">Claude Code</a>',
    docs_obsidianPlugin_056: '<code>claude auth login --claudeai</code>',
    docs_obsidianPlugin_057: 'Sonnet, Opus, Haiku ou identifiant personnalisé',
    docs_obsidianPlugin_058: '<strong>Google Gemini</strong>',
    docs_obsidianPlugin_059:
      '<a href="https://antigravity.google/docs/cli/install" target="_blank" rel="noopener">CLI antigravité</a>',
    docs_obsidianPlugin_060: '<code>agy</code> flux du navigateur',
    docs_obsidianPlugin_061: 'Automatique via <code>agy models</code>',
    docs_obsidianPlugin_062:
      "Dans Obsidian Paramètres → NutEgg, sélectionnez simplement votre CLI sous <strong>Connexion AI</strong>. Le <code>SubscriptionService</code> interne de NutEgg exécute l'inférence dans une file d'attente série limitée localement. Aucun serveur de pont séparé ni port 27124 n'est nécessaire.",
    docs_obsidianPlugin_063: 'Serveur de synchronisation local et sécurité',
    docs_obsidianPlugin_064:
      'Lorsque le plugin est activé, il démarre automatiquement un écouteur HTTP et WebSocket en arrière-plan sur <code>127.0.0.1:27123</code>.',
    docs_obsidianPlugin_065: "🔒 Confidentialité et sécurité d'origine",
    docs_obsidianPlugin_066:
      "Le serveur local se lie strictement à l'adresse de bouclage localhost (<code>127.0.0.1</code>). Il applique une validation stricte <code>X-NutEgg-Extension-Origin</code> et des jetons, empêchant les pages Web ordinaires d'accéder à votre coffre-fort. Les connexions WebSocket s'authentifient sur leur toute première trame.",
    docs_obsidianPlugin_067: 'Flux de travail et personnalisation des invites',
    docs_obsidianPlugin_068:
      'NutEgg alimente son analyse IA grâce à des invites Markdown modulaires et modifiables stockées directement dans votre coffre-fort sous <code>nutegg/_workflow/</code> :',
    docs_obsidianPlugin_069:
      "<strong>Modèles modifiables</strong> : personnalisez les invites pour l'analyse du contenu, la comparaison egg, le routage et les suivis.",
    docs_obsidianPlugin_070:
      "<strong>Mises à jour non destructives</strong> : lorsque NutEgg publie des modèles d'invites mis à jour, vos flux de travail personnalisés sont automatiquement préservés sans être écrasés.",
    docs_workflow_001: 'Workflows et moteur de prompts IA — NutEgg',
    docs_workflow_002: 'Chrome Boutique en ligne ↗',
    docs_workflow_003: 'ObsidianPlugin↗',
    docs_workflow_004: 'Sorties',
    docs_workflow_005: 'Politique de confidentialité',
    docs_workflow_006: 'Workflows et moteur de prompts IA',
    docs_workflow_007:
      "Découvrez comment le moteur de flux de travail modulaire de NutEgg orchestre l'extraction de contenu, le routage egg basé sur des résumés, l'analyse basée sur les instructions et les invites personnalisables par l'utilisateur.",
    docs_workflow_008: "L'architecture en deux étapes",
    docs_workflow_009:
      "Plutôt que d'exécuter une seule invite monolithique, NutEgg utilise une <strong>Architecture en deux étapes</strong> conçue pour l'efficacité des jetons, une précision d'extraction élevée et un contrôle complet de l'utilisateur :",
    docs_workflow_010:
      '<code>                    ┌───────────────────────────────┐\n                    │      Captured Web Content     │\n                    │   (Article / YouTube / Tweet) │\n                    └───────────────┬───────────────┘\n                                    │\n                                    ▼\n       ===========================================================\n       STAGE 1: Content & Discussion Analysis + Egg Routing\n       ===========================================================\n            │                                             │\n            ├─► Content Analysis                          ├─► Discussion Analysis\n            │   (Is content >30k chars?)                  │   (When 💬 Discussion enabled\n            │    ├── No  ──► [content-analysis.md]        │    & comments captured)\n            │    └── Yes ──► Chunks + [aggregate-         │    ├── [discussion-analysis.md]\n            │                content.md]                  │    └── [aggregate-discussion.md]\n            │                                             │\n            └──────────────────────┬──────────────────────┘\n                                   │\n                                   ▼\n        Produces: Title Verdict, 3-Bullet Summary, Mind Map,\n        Timestamped Q&A, and Discussion Topics/Stances\n                                   │\n                                   ▼\n                          [egg-routing.md]\n          (Routes matched eggs from _index.md using the\n           concise Stage 1 summary instead of raw content)\n                                    │\n                                    ▼\n       ===========================================================\n       INTERACTIVE CHOICE / EXECUTION MODE (Chrome Extension)\n       ===========================================================\n                                    │\n                        Which mode is selected?\n                                    │\n            ┌───────────────────────┼───────────────────────┐\n            ▼                       ▼                       ▼\n     [Standalone Mode]         [🌞 Full Mode]      [🌛 Preview Summary]\n     Obsidian is offline.      Auto-proceeds to    User reviews matched eggs:\n     Runs Stage 1 in Chrome    Stage 2 with all    ├── "Collect Nut Only"\n     with user\'s API key.      matched eggs.       └── Add/remove eggs ──► Proceed\n     (Fast reading & Q&A)           │                       │\n            │                       └───────────┬───────────┘\n            ▼                                   ▼\n    Results in Side Panel      ===========================================================\n    (No Stage 2 analysis)    STAGE 2: Per-Egg Instruction-Driven Analysis\n                               ===========================================================\n                                                │\n                                   For each confirmed egg (1 or N):\n                                                │\n                                                ▼\n                                        [egg-analysis.md]\n                                  (Extract candidate knowledge entries\n                                   & key questions scoped to this egg)\n                                                │\n                                                ▼\n                                  (Answers + extracted entries + reading action)\n                                                │\n                                                ▼\n                                     Results returned to Popup\n                                     (Ready to Save Nut & Eggs)</code>',
    docs_workflow_011: '💡 Pourquoi le routage basé sur le résumé ?',
    docs_workflow_012:
      "Le routage eggs en utilisant le résumé de l'étape 1 au lieu d'articles bruts complets ou de transcriptions vidéo de plusieurs heures permet d'économiser des dizaines de milliers de jetons par exécution et améliore la précision du routage en se concentrant sur des thèmes sémantiques distillés à signal élevé.",
    docs_workflow_013:
      "L'indicateur croisé du panneau latéral affiche les analyses en cours et les résultats terminés non lus dans la fenêtre Chrome actuelle. Cliquez dessus pour répertorier les onglets et passer directement à leurs résultats ou à leur progression. Les résultats sont lus lorsque leur analyse est visible dans l'onglet actif. Le suivi dure tant que le panneau reste ouvert et se réinitialise lorsqu'il se ferme.",
    docs_workflow_014:
      "Hatch archive l'analyse originale et ajoute les entrées approuvées à <code># Unprocessed</code>. La fusion s'exécute sur 20 entrées en attente ou sur demande pour assembler des fragments et dédupliquer les revendications tout en préservant les sources, les mises en garde, les exemples et les désaccords. L’étape 2 ne reçoit jamais l’arbre des connaissances, la recommandation évalue donc la pertinence et le contenu plutôt que la nouveauté.",
    docs_workflow_015:
      "L'option de section <strong>🍃 Connaissances</strong> et la liste déroulante Egg Analyse partagent un paramètre pour l'onglet actuel du navigateur : <strong>🥚 Analyse uniquement</strong> désactive la connaissance et <strong>🍃 Inclure les connaissances</strong> l'active. Le changement de choix dans la liste déroulante met à jour le paramètre et l'étiquette du bouton sans déclencher automatiquement un appel IA : cliquez sur le bouton pour analyser. Lors du passage à Inclure les connaissances pour un egg analysé précédemment sans entrées de connaissances, NutEgg réexécute l'étape 2 plutôt que d'afficher simplement le résultat de réponse mis en cache uniquement. Inclure les connaissances est la valeur par défaut initiale ; votre dernier choix devient le choix par défaut pour les onglets sans analyse. La désactivation de l'option ne masque pas les entrées générées précédemment et n'empêche pas leur enregistrement. La désactivation de Knowledge désactive les entrées pour chaque egg sélectionné. L'activer autorise les entrées uniquement pour les eggs qui les autorisent : <code>Generate Knowledge Entries: no</code> ou une désinscription dans le guide d'action du egg est prioritaire. Les réponses clés et les recommandations de lecture restent disponibles dans les deux cas. L'analyse n'enregistre pas les entrées ; <strong>🐣 Hatch Egg</strong> enregistre les entrées générées dans egg fichiers.",
    docs_workflow_016: 'Modes de flux de travail',
    docs_workflow_017: 'Mode',
    docs_workflow_018: 'Comportement',
    docs_workflow_019: 'Idéal pour',
    docs_workflow_020: '<strong>📱 Mode autonome</strong>',
    docs_workflow_021:
      "Exécute l'analyse de contenu de l'étape 1 directement dans Chrome (lorsque Obsidian est hors ligne ou fermé). Produit des verdicts, des résumés de 3 phrases, des cartes mentales avec des horodatages cliquables et des questions-réponses vidéo interactives avec saut d'horodatage. Ignore l'analyse de l'étape 2 egg.",
    docs_workflow_022:
      "Lecture rapide du Web et des vidéos, compréhension rapide ou lorsque vous n'avez pas besoin d'archivage de notes.",
    docs_workflow_023: '<strong>🌞 Mode complet</strong>',
    docs_workflow_024:
      "Exécute l'analyse de contenu de l'étape 1, achemine automatiquement eggs via <code>_index.md</code> et exécute immédiatement l'analyse de l'étape 2 egg en une seule passe ininterrompue.",
    docs_workflow_025:
      'Lecture quotidienne et captures rapides lorsque vous faites confiance à la correspondance automatique egg.',
    docs_workflow_026: '<strong>🌛 Aperçu du résumé</strong>',
    docs_workflow_027:
      "Exécute l'analyse de contenu de l'étape 1, puis s'arrête dans la fenêtre contextuelle. Affiche la correspondance eggs à côté de la liste complète egg de votre coffre-fort. Vous pouvez ajouter/supprimer eggs, procéder à la comparaison des connaissances ou cliquer sur <strong>Collecter Nut uniquement</strong>.",
    docs_workflow_028:
      'Recherche approfondie, sujets ambigus ou lorsque vous souhaitez uniquement un résumé rapide sans mettre à jour les arbres de connaissances egg.',
    docs_workflow_029: "Protocole d'exécution et d'identification de l'IA",
    docs_workflow_030:
      "Que vous choisissiez le mode complet ou le résumé d'aperçu, NutEgg sépare <em>orchestration du flux de travail</em> de <em>stockage des informations d'identification et inférence IA</em> :",
    docs_workflow_031:
      "<strong>Mode API connecté (par défaut)</strong> : Obsidian coordonne l'injection rapide du modèle et la comparaison des connaissances, mais envoie des requêtes d'inférence à Chrome via un WebSocket authentifié (<code>/execution/socket</code>). Chrome exécute l'appel LLM avec sa clé API locale et renvoie le résultat authentifié. <strong>Votre clé API ne quitte jamais Chrome.</strong>",
    docs_workflow_032:
      "<strong>Mode d'abonnement partagé</strong> : Obsidian coordonne le flux de travail et exécute directement les appels d'IA localement à l'aide des outils CLI officiels du développeur (<code>codex</code>, <code>claude</code>, <code>agy</code>) ou de la connexion directe ChatGPT OAuth. Tous les profils Chrome connectés partagent cet abonnement sans avoir besoin de clé API.",
    docs_workflow_033: 'Fichiers de flux de travail dans votre coffre-fort',
    docs_workflow_034:
      "NutEgg place ses modèles d'invite dans <code>nutegg/_workflow/</code> à l'intérieur de votre coffre-fort :",
    docs_workflow_035: "1. Fragments partagés (injectés dans d'autres invites)",
    docs_workflow_036:
      '<code>shared-output-rules.md</code> : Directive de mise à la terre (contenu source comme seule vérité) et règles de référence du langage de sortie multilingue. Injecté comme <code>{{shared_output_rules}}</code>.',
    docs_workflow_037:
      '<code>content-task-default.md</code> : instructions de tâches principales pour les verdicts de titre, les résumés à 3 puces et les cartes mentales avec horodatages cliquables. Injecté comme <code>{{content_task_default}}</code>.',
    docs_workflow_038: '2. Pipeline de capture et de comparaison de contenu',
    docs_workflow_039:
      "<code>content-analysis.md</code> : résumé du contenu de l'étape 1, verdict anti-clickbait, carte mentale interactive avec horodatages cliquables et réponses aux questions personnalisées avec citations d'horodatage.",
    docs_workflow_040:
      "<code>egg-routing.md</code> : fait correspondre les résumés de l'étape 1 avec les descriptions egg dans <code>_index.md</code> pour sélectionner le candidat eggs.",
    docs_workflow_041:
      "<code>egg-analysis.md</code> : Étape 2 par-egg extraction des entrées de connaissances des candidats et des réponses aux questions clés définies selon les instructions d'un egg.",
    docs_workflow_042:
      "Vaut la peine d'être lu si et sauter si guider la lecture complète, les faits saillants, le résumé suffisant, sauter ou incertain. Les réponses utiles restent sauvegardées quelle que soit la recommandation.",
    docs_workflow_043:
      "<code>aggregate-content.md</code> &amp; <code>aggregate-egg.md</code> : agrégation de contenu long (&gt; 30 000 caractères). L'étape 2 combine uniquement des brouillons de réponses, des notes de recommandation et une couverture ; les entrées extraites restent dans l’ordre source jusqu’à la fusion.",
    docs_workflow_044: '3. Analyse de la discussion (étape 1)',
    docs_workflow_045:
      "L'analyse des discussions s'exécute dans le cadre de l'analyse de contenu <strong>Étape 1</strong> lorsque la section <strong>💬 Discussion</strong> est activée dans les options d'extension ou les sections d'analyse contextuelles, et que l'extracteur de page capture les commentaires des lecteurs ou les réponses sociales (par exemple, les commentaires YouTube, les réponses Twitter, les fils de discussion Reddit/forum, les commentaires Bilibili ou Zhihu réponses).",
    docs_workflow_046:
      "<code>discussion-analysis.md</code> : analyse les commentaires par lots pour extraire 3 à 5 sujets de débat principaux, classer les positions des commentateurs (<code>agree</code>, <code>disagree</code>, <code>mixed</code>, <code>neutral</code>, <code>unclear</code>) et mettre en évidence de précieux suppléments ou corrections d'expérience de première main (<code>supplement: true</code>).",
    docs_workflow_047:
      '<code>aggregate-discussion.md</code> : fusionne et synthétise les sujets et les distributions de positions sur les fils de commentaires multi-lots pour les grands forums ou les sections de commentaires vidéo.',
    docs_workflow_048:
      "<strong>Flux de contexte :</strong> Les résumés de discussion analysés et les éléments de preuve sont renvoyés dans le résultat de l'étape 1 et alimentent directement les questions-réponses personnalisées ou l'analyse du corps du forum (crucial pour les pages ou vidéos centrées sur la discussion sans transcriptions). Ils sont également transmis en tant que signaux contextuels à l'étape 2 <code>egg-analysis.md</code> afin que la eggs puisse évaluer les commentaires de la communauté parallèlement au contenu source.",
    docs_workflow_049: '4. Flux de travail interactifs et de maintenance',
    docs_workflow_050:
      "<code>follow-up.md</code> : questions et réponses interactives en langage naturel dans le panneau latéral avec historique des conversations antérieures et saut d'horodatage vidéo cliquable.",
    docs_workflow_051:
      '<code>merge-unprocessed.md</code> : déclenché manuellement ou automatiquement à plus de 20 entrées en attente pour organiser et imbriquer les éléments bruts dans <code># Knowledge</code>.',
    docs_workflow_052:
      '<code>localize-egg.md</code> : Traduit les nouveaux modèles egg en langues étrangères tout en préservant les titres structurels en anglais.',
    docs_workflow_053: 'Directives de personnalisation sécurisées',
    docs_workflow_054: '⚠️ Que conserver',
    docs_workflow_055:
      "Vous êtes libre de personnaliser le ton, la perspective et la profondeur de l'invite. Cependant, vous <strong> devez préserver </strong> :",
    docs_workflow_056:
      'Toutes les balises <code>{{placeholder}}</code> (par exemple <code>{{content}}</code>, <code>{{knowledge_tree}}</code>, <code>{{title}}</code>).',
    docs_workflow_057:
      "Clés de sortie JSON exactes (par exemple <code>titleVerdict</code>, <code>extractedEntries</code>, <code>mindMap</code>) afin que l'analyseur puisse désérialiser la réponse.",
    docs_workflow_058:
      'Les titres structurels (<code># Knowledge</code>, <code># Unprocessed</code>) dans les sorties Markdown.',
    docs_workflow_059: 'Mises à jour et réinitialisation sans conflit',
    docs_workflow_060: 'Lorsque NutEgg est mis à jour vers une version plus récente :',
    docs_workflow_061:
      '<strong>Invites non modifiées</strong> : automatiquement mis à jour vers la dernière version intégrée.',
    docs_workflow_062:
      '<strong>Invites personnalisées</strong> : vos modifications ne sont jamais écrasées. NutEgg écrit <code>[filename].new.md</code> à côté de votre fichier afin que vous puissiez consulter les nouveaux ajouts à votre rythme.',
    docs_workflow_063:
      "<strong>Réinitialisation d'usine (« Utiliser les paramètres par défaut »)</strong> : Besoin d'un nouveau départ ? Dans <strong>Obsidian Paramètres → NutEgg</strong>, cliquez sur <strong>Utiliser les paramètres par défaut</strong>. Toutes les invites existantes sont sauvegardées en toute sécurité jusqu'à <code>nutegg/_workflow/_backup/&lt;timestamp&gt;/</code> et les paramètres d'usine par défaut sont restaurés.",
  },
  de: {
    docs_chromeExtension_001: 'Anleitung zur Chrome-Erweiterung — NutEgg',
    docs_chromeExtension_002: 'Chrome Webshop ↗',
    docs_chromeExtension_003: 'Obsidian Plugin ↗',
    docs_chromeExtension_004: '🎬 Promo-Video ↗',
    docs_chromeExtension_005: 'Erweiterungsversionen',
    docs_chromeExtension_006: 'Datenschutzrichtlinie',
    docs_chromeExtension_007: 'Einrichtung und Nutzung der Chrome-Erweiterung',
    docs_chromeExtension_008:
      'Die Erweiterung NutEgg Chrome befindet sich im Seitenbereich Ihres Browsers und ermöglicht die Extraktion von Inhalten auf Abruf, YouTube Mindmaps mit anklickbaren Zeitstempeln und die Ein-Klick-Erfassung von Obsidian.',
    docs_chromeExtension_009: 'Installation',
    docs_chromeExtension_010: 'Option 1: Chrome Web Store (empfohlen)',
    docs_chromeExtension_011:
      'Installieren Sie NutEgg mit einem Klick direkt aus dem offiziellen <a\n            href="https://chromewebstore.google.com/detail/nutegg/bmdmdiicembobejibggoeiahaonphcol"\n            target="_blank"\n            rel="noopener"\n            >Chrome Web Store</a\n          >:',
    docs_chromeExtension_012:
      'Besuchen Sie die <a\n              href="https://chromewebstore.google.com/detail/nutegg/bmdmdiicembobejibggoeiahaonphcol"\n              target="_blank"\n              rel="noopener"\n              >NutEgg Chrome Web Store-Seite</a\n            >.',
    docs_chromeExtension_013: 'Klicken Sie auf <strong>Hinzufügen zu Chrome</strong>.',
    docs_chromeExtension_014:
      'Klicken Sie auf das Puzzleteil-Symbol in der Symbolleiste von Chrome und heften Sie <strong>NutEgg</strong> an, um bequem auf die Seitenleiste zugreifen zu können.',
    docs_chromeExtension_015: 'Option 2: Von GitHub Release (.zip)',
    docs_chromeExtension_016:
      'Laden Sie die neueste <code>nutegg-chrome-extension-*.zip</code> von der <a\n              href="https://github.com/staff-000/nutegg-chrome-extension-release/releases"\n              target="_blank"\n              rel="noopener"\n              >Releases-Seite</a\n            > herunter.',
    docs_chromeExtension_017: 'Entpacken Sie das Archiv in einen lokalen Ordner auf Ihrem Computer.',
    docs_chromeExtension_018: 'Öffnen Sie Google Chrome und gehen Sie zu <code>chrome://extensions</code>.',
    docs_chromeExtension_019: 'Schalten Sie <strong>Entwicklermodus</strong> in der oberen rechten Ecke ein.',
    docs_chromeExtension_020:
      'Klicken Sie auf <strong>Entpackt laden</strong> und wählen Sie das entpackte Verzeichnis mit <code>manifest.json</code> aus.',
    docs_chromeExtension_021:
      'Klicken Sie auf das Puzzle-Symbol in der Symbolleiste Chrome und heften Sie <strong>NutEgg</strong> an, um den Zugriff zu erleichtern.',
    docs_chromeExtension_022: 'Seitenpanel-Workflow',
    docs_chromeExtension_023:
      'Durch Klicken auf das Erweiterungssymbol NutEgg wird das Seitenfenster von Chrome geöffnet:',
    docs_chromeExtension_024:
      '<strong>Automatische Extraktion</strong>: Während Sie surfen, erkennt NutEgg den aktiven Tab (YouTube Video, Twitter/X-Thread oder Blog-Beitrag) und extrahiert dessen Text und Struktur.',
    docs_chromeExtension_025:
      '<strong>Inhaltsaktualisierung (🔄)</strong>: Klicken Sie in der Inhaltsvorschau auf die Schaltfläche „Aktualisieren“, um die Seite bei dynamischen Einzelseiten-Apps erneut zu extrahieren, ohne unerwartet von der Vorschau wegzuleiten.',
    docs_chromeExtension_026:
      '<strong>Ziel Egg Selektor</strong>: Wählen Sie in der Inhaltsvorschau Zielwissen eggs oder verwenden Sie „Ziel eggs (standardmäßig automatische Auswahl)“, damit die KI relevante Tresorbäume automatisch abgleichen kann.',
    docs_chromeExtension_027:
      '<strong>Analysemodi</strong>: <ul> <li> <strong>Vollmodus</strong>: Bewertet Inhalte und führt sofort einen Wissensabgleich mit einem Abgleich durch eggs in einem einzigen optimierten Workflow. </li> <li> <strong>Vorschaumodus</strong>: Erstellt zunächst die Übersicht der Stufe 1 (Zusammenfassung, Mindmap, Fragen und Antworten, Diskussion), sodass Sie das Ziel eggs überprüfen oder anpassen können, bevor Sie bei Bedarf die egg Wissensanalyse ausführen. </li> </ul>',
    docs_chromeExtension_028:
      '<strong>Statusanzeige</strong>: Ein grüner Punkt zeigt eine gesunde Verbindung zu Ihrem lokalen Obsidian Server (<code>127.0.0.1:27123</code>) an. Wenn rot, stellen Sie sicher, dass Obsidian mit aktiviertem NutEgg-Plugin ausgeführt wird.',
    docs_chromeExtension_029: 'YouTube Integration und intelligente Navigation',
    docs_chromeExtension_030: 'Auf YouTube Videoseiten extrahiert NutEgg:',
    docs_chromeExtension_031:
      '<strong>Vollständige Untertitel und Transkripte</strong>: Automatische, hochpräzise Extraktion aus dem Ersteller und automatisch generierte Transkripte.',
    docs_chromeExtension_032:
      '<strong>Mind Map mit anklickbaren Zeitstempeln</strong>: Sofortige Aufschlüsselung mit anklickbaren Zeitstempel-Schaltflächen, die Ihren aktiven YouTube Videoplayer direkt zu diesem Segment suchen. Wenn Zeitstempel vorhanden sind, werden redundante Quell-Tags ausgeblendet, um den Baum sauber zu halten.',
    docs_chromeExtension_033:
      '<strong>Fragen und Antworten mit Timestamp Jumping</strong>: Stellen Sie alle Fragen zum Video in natürlicher Sprache; NutEgg bietet zitierte Antworten mit anklickbaren Zeitstempel-Pillen, die bei der Videowiedergabe direkt zum Quellmoment springen.',
    docs_chromeExtension_034:
      '<strong>Anti-Clickbait-Urteil</strong>: Eine objektive 1-Satz-Antwort auf die Prämisse des Videotitels, die es Ihnen ermöglicht, sofort auf unnötige Diskussionen zu verzichten.',
    docs_chromeExtension_035: 'Text-In-Page-Quellennavigation',
    docs_chromeExtension_036: 'Beim Lesen von Artikeln, Blogs oder Foren:',
    docs_chromeExtension_037:
      '<strong>📍 Zur Quelle springen</strong>: Text-Mindmap-Knoten und Q&amp;A-Zitate enthalten Quell-Tags. Wenn Sie auf ein Quell-Tag klicken, scrollt die Live-Webseite automatisch zu dem genau passenden Absatz oder Zitat und hebt ihn kurz mit einer Gliederung hervor.',
    docs_chromeExtension_038:
      '<strong>Kommentarnavigation</strong>: Auf Diskussionsseiten (Reddit, Zhihu usw.) scrollt das Klicken auf Quellenzitate direkt zu dem spezifischen Kommentar oder der Antwort.',
    docs_chromeExtension_039: 'Diskussionsanalyse und Community-Perspektiven',
    docs_chromeExtension_040:
      'NutEgg analysiert öffentliche Kommentare in YouTube, Reddit, Twitter/X, Zhihu und Foren:',
    docs_chromeExtension_041:
      '<strong>Themen- und Standpunktaufschlüsselung</strong>: Fasst die wichtigsten Debattenpunkte mit Standpunktabzeichen (stimme zu 👍, stimme nicht zu 👎, gemischt 🤔, neutral ⚖️) und Reaktionsmetriken zusammen.',
    docs_chromeExtension_042:
      '<strong>Zusätzliche Einblicke</strong>: Hochwertige Kommentare mit Beweisen, Vorbehalten oder einzigartigen Erfahrungen werden als prägnante zusätzliche Einblicke gespeichert.',
    docs_chromeExtension_043: 'Chrome – Nur Standalone-Modus (kein Obsidian erforderlich)',
    docs_chromeExtension_044:
      'Sie haben Obsidian nicht installiert oder gerade geöffnet? NutEgg funktioniert völlig eigenständig in Google Chrome!',
    docs_chromeExtension_045: '⚡ Schnelles Lesen im Internet ohne Notizaufwand',
    docs_chromeExtension_046:
      'NutEgg ist in erster Linie als ultraschneller Web-Lesebegleiter konzipiert. Sie können jeden Artikel oder jedes YouTube Video direkt in Chrome extrahieren, zusammenfassen, Mindmaps erstellen und Fragen stellen, ohne jemals einen Notizentresor zu berühren.',
    docs_chromeExtension_047: 'Verfügbare Funktionen in Chrome Standalone:',
    docs_chromeExtension_048:
      '<strong>🎯 Sofortiges Anti-Clickbait-Urteil</strong>: Eine objektive Antwort in einem Satz auf die Frage in der Überschrift.',
    docs_chromeExtension_049:
      '<strong>📝 Zusammenfassung in drei Sätzen</strong>: Zusammenfassung mit hoher Dichte, die aus einem langen Artikel oder Video extrahiert wurde.',
    docs_chromeExtension_050:
      '<strong>⏱️ Mind Map mit anklickbaren Zeitstempeln und Suche</strong>: Springen Sie mit einem Klick zu wichtigen Videosegmenten.',
    docs_chromeExtension_051:
      '<strong>💬 Video-Fragen und Antworten &amp; Zeitstempel-Springen</strong>: Stellen Sie Fragen und klicken Sie auf die zitierten Zeitstempel-Pillen, um die Videowiedergabe direkt zu diesem Segment zu verschieben.',
    docs_chromeExtension_052:
      '<strong>🧠 Zusammenklappbare Mind Maps</strong>: Mehrstufige interaktive Gedankenbäume, die Kernideen visuell aufschlüsseln.',
    docs_chromeExtension_053:
      '<strong>🌐 Unterstützung für über 50 Sprachen</strong>: Extrahieren und übersetzen Sie fremdsprachige Inhalte im Handumdrehen.',
    docs_chromeExtension_054: 'So konfigurieren Sie den Nur-Chrome-Modus:',
    docs_chromeExtension_055:
      'Klicken Sie mit der rechten Maustaste auf das Erweiterungssymbol <strong>NutEgg</strong> in der Symbolleiste von Chrome und wählen Sie <strong>Optionen</strong>.',
    docs_chromeExtension_056:
      'Wählen Sie Ihren bevorzugten KI-Anbieter (z. B. Google Gemini, OpenAI, Claude, DeepSeek oder OpenRouter) und geben Sie Ihren API-Schlüssel ein.',
    docs_chromeExtension_057: 'Klicken Sie auf <strong>Speichern</strong>. Sie sind bereit, jede Seite zu analysieren!',
    docs_chromeExtension_058: 'Obsidian Verbindungs- und KI-Ausführungsmodi',
    docs_chromeExtension_059:
      'Wenn Sie die Chrome-Erweiterung mit dem optionalen NutEgg Obsidian-Plugin verbinden, passt sich Chrome je nach ausgewähltem Ausführungsmodus nahtlos an:',
    docs_chromeExtension_060: '🔒 API-Schlüsselsicherheit: Schlüssel verlassen niemals Chrome',
    docs_chromeExtension_061:
      'Im <strong>Connected API Mode</strong> bleiben Ihre API-Schlüssel ausschließlich im sicheren Erweiterungsspeicher von Chrome. Obsidian verwaltet Wissensvorlagen und die Tresorindizierung, delegiert jedoch die KI-Inferenz über einen authentifizierten lokalen WebSocket zurück an Chrome. Chrome führt den Provider-API-Aufruf lokal durch und gibt nur den generierten Text zurück.',
    docs_chromeExtension_062: 'Ausführungsmodus',
    docs_chromeExtension_063: 'Wo KI läuft',
    docs_chromeExtension_064: 'Verwendete Anmeldeinformationen',
    docs_chromeExtension_065: '<strong>Chrome-Nur</strong>',
    docs_chromeExtension_066: 'Direkt drinnen Chrome',
    docs_chromeExtension_067: 'API-Schlüssel konfiguriert in Chrome Optionen',
    docs_chromeExtension_068: '<strong>Verbundener API-Modus</strong>',
    docs_chromeExtension_069: 'Chrome (delegiert über lokalen WebSocket von Obsidian)',
    docs_chromeExtension_070: 'API-Schlüssel in Chrome (Schlüssel werden nie an Obsidian gesendet)',
    docs_chromeExtension_071: '<strong>Gemeinsamer Abonnementmodus</strong>',
    docs_chromeExtension_072: 'Innerhalb von Obsidian (über lokale CLI oder ChatGPT OAuth)',
    docs_chromeExtension_073: 'Keine API-Schlüssel (verwendet Codex, Claude Code, Antigravity oder ChatGPT)',
    docs_chromeExtension_074: 'Unterstützung für mehrere Profile Chrome',
    docs_chromeExtension_075:
      'NutEgg unterstützt mehrere Chrome Browserprofile (z. B. Privat und Arbeit), die gleichzeitig eine Verbindung zum selben Obsidian Tresor herstellen. Jedes Chrome-Profil behält unabhängig seinen eigenen Anbieter, sein eigenes Modell und seinen eigenen API-Schlüssel. Durch das Verbinden oder Wechseln des Ausführungsmodus werden API-Schlüssel zwischen Profilen nie verloren oder überschrieben.',
    docs_chromeExtension_076: 'Offline- und Trennungswiederherstellung',
    docs_chromeExtension_077:
      'Wenn Obsidian geschlossen ist, während der Verbindungsmodus aktiviert ist, zeigt NutEgg eine klare Statusleuchte an und bietet Ihnen mit einem Klick die Option <strong>„Stattdessen Chrome-Modus verwenden“</strong>. Dadurch können Sie mit Ihrem Chrome API-Setup ohne Unterbrechung oder Kontingentrisiko sofort mit dem Lesen und Stellen von Fragen fortfahren.',
    docs_chromeExtension_078: 'Konfiguration und Live-Synchronisierung',
    docs_chromeExtension_079:
      'NutEgg beinhaltet Echtzeitsynchronisierung zwischen den Erweiterungsoptionen und aktiven Seitenpanels:',
    docs_chromeExtension_080:
      '<strong>Steuerelemente für Inhaltsabschnitte</strong>: Passen Sie auf der Seite „Optionen“ an, welche Abschnitte standardmäßig extrahiert und analysiert werden (Inhalt, Zusammenfassung, Mind Map, Fragen und Antworten, Wissenseinträge und Diskussion).',
    docs_chromeExtension_081:
      '<strong>Live-Einstellungen-Synchronisierung</strong>: Wenn Sie Ihre Analysemodelle, aktivierten Ausgabeabschnitte oder Servereinstellungen ändern, werden alle geöffneten Seitenbereiche sofort aktualisiert, ohne dass eine Seitenaktualisierung erforderlich ist.',
    docs_chromeExtension_082:
      '<strong>Benutzerdefinierter Server-Port</strong>: Wenn der Standard-Port <code>27123</code> mit einem anderen Dienst in Konflikt steht, öffnen Sie die Erweiterung <strong>Optionen</strong>, passen Sie den Port an (z. B. <code>28123</code>) und testen Sie die Verbindung.',
    docs_index_001: 'Dokumentationsübersicht — NutEgg',
    docs_index_002: 'Chrome Webshop ↗',
    docs_index_003: 'Obsidian Plugin ↗',
    docs_index_004: '🎬 Promo-Video ↗',
    docs_index_005: 'GitHub Veröffentlichungen',
    docs_index_006: 'Datenschutzrichtlinie',
    docs_index_007: 'Issue-Tracker',
    docs_index_008: 'Überblick und Grundbegriffe',
    docs_index_009:
      'NutEgg ist eine kostenlose Open-Source-Erweiterung Chrome, die Ihnen hilft, zu entscheiden, was es wert ist, gelesen zu werden – und es schneller zu verstehen. Es befindet sich im Seitenbereich von Chrome und funktioniert mit Artikeln, Threads und YouTube Videos. Ein optionales Obsidian-Plugin verwandelt das, was Sie lesen, in einen wachsenden Wissensspeicher.',
    docs_index_010: 'Was Sie bekommen Chrome',
    docs_index_011:
      'Installieren Sie die Erweiterung, geben Sie Ihren AI-API-Schlüssel ein (oder verweisen Sie ihn auf ein lokales Modell) in den Optionen, und NutEgg funktioniert sofort – kein Konto, keine zusätzlichen Apps:',
    docs_index_012: '🎯 Sofortiges Anti-Clickbait-Titelurteil',
    docs_index_013: '📝 Zusammenfassung in drei Sätzen und Kernaussagen',
    docs_index_014: '🧠 Zusammenklappbare hierarchische Mind Maps mit anklickbaren Zeitstempeln für YouTube',
    docs_index_015:
      '💬 Fragen und Antworten in natürlicher Sprache mit zitierten Zeitstempel-Pillen und In-Page-Quellenlinks',
    docs_index_016:
      '🔍 Dual-Scope-Fragen: ausschließlich innerhalb der Seite oder darüber hinaus zur Faktenüberprüfung',
    docs_index_017: '🗣️ Zusammenfassungen des Kommentarbereichs für YouTube, Reddit und Foren',
    docs_index_018: '🌐 Extraktion und Übersetzung aus mehreren Quellen in über 50 Sprachen',
    docs_index_019: '💡 Warum NutEgg existiert',
    docs_index_020:
      'Zu viel im Web besteht aus aufgefüllten Videos, Clickbait-Schlagzeilen und KI-aufgeblasenen Artikeln. NutEgg geht im Vorfeld auf die Überschrift ein und sagt Ihnen ehrlich, ob der Inhalt Ihre Zeit wert ist – damit Sie Ihre Aufmerksamkeit nur dort aufwenden, wo sie sich auszahlt.',
    docs_index_021: 'Optional: Obsidian hinzufügen',
    docs_index_022:
      'Wenn Sie in Obsidian Notizen machen, installieren Sie das Begleit-Plugin, um die Erweiterung mit Ihrem Tresor zu verbinden (<code>127.0.0.1:27123</code>). Dies fügt eine zweistufige Neuheitsbewertung anhand der <code>_index.md</code>-Wissensbäume Ihres Tresors, Delta-Synthese und automatische Notizarchivierung in <code>nutegg/_raw/</code>- und egg-Dateien hinzu. Alles in Chrome funktioniert weiterhin mit oder ohne.',
    docs_index_023: 'Die Metapher',
    docs_index_024:
      'Wenn Obsidian verbunden ist, strukturiert NutEgg Ihren Informationsfluss mithilfe einer einfachen dreiteiligen Metapher:',
    docs_index_025:
      '<strong>🌰 Die Nut (Rohaufnahme)</strong>: Die rohe Webseite, der Tweet-Thread oder das YouTube Transkript, das aus dem Browser extrahiert wurde. Nuts werden unverändert mit vollständigen Metadaten in <code>nutegg/_raw/</code> in Ihrem Tresor archiviert.',
    docs_index_026:
      '<strong>🥚 Der Egg (Wissensbaum)</strong>: Eine lebendige, strukturierte Markdown-Notiz in Ihrem Tresor, die einen Wissensbereich darstellt (z. B. <code>ai_architecture.md</code>, <code>invest_strategy.md</code>).',
    docs_index_027:
      '<strong>🐣 The Hatch (Synthesis &amp; Delta)</strong>: Wenn Inhalte analysiert werden, gleicht die KI sie mit Ihrem eggs ab, identifiziert, was im Vergleich zu dem, was bereits dokumentiert ist, neu ist, und webt neue Erkenntnisse in Ihr egg ein.',
    docs_index_028: 'Systemarchitektur',
    docs_index_029: 'NutEgg hat eine Kernkomponente und einen optionalen Begleiter:',
    docs_index_030:
      '<strong>Chrome Erweiterung</strong>: Lebt im Seitenbereich von Chrome. Extrahiert Text, Kommentare und Videotranskripte. Im Standalone-Modus oder verbundenen API-Modus führt es KI-Aufrufe lokal unter Verwendung Ihres konfigurierten Anbieters und API-Schlüssels aus – so wird sichergestellt, dass Ihre API-Schlüssel niemals den Browser verlassen.',
    docs_index_031:
      '<strong>Obsidian Plugin (optional)</strong>: Führt einen lokalen Synchronisierungs- und Koordinatordienst auf <code>127.0.0.1:27123</code> aus. Liest die <code>_index.md</code> Ihres Tresors, verwaltet Eingabeaufforderungsvorlagen in <code>_workflow/</code> und archiviert erfasste Daten auf der Festplatte. Es unterstützt: <ul> <li> <strong>Verbundener API-Modus (Standard)</strong>: Koordiniert den Wissensabgleich und delegiert KI-Inferenz über einen authentifizierten lokalen WebSocket an Chrome (Schlüssel werden niemals an Obsidian gesendet). </li> <li> <strong>Gemeinsamer Abonnementmodus</strong>: Führt Inferenz lokal über ChatGPT-Anmeldung (OAuth) oder Entwickler-CLI-Tools (Codex, Claude Code, Antigravity) aus, ohne dass API-Schlüssel erforderlich sind. </li> </ul>',
    docs_index_032:
      '<code>Chrome Extension (Side Panel)\n │\n ├── [Standalone Mode] Local AI Processing (Verdicts, Summaries, Mind Maps, Q&amp;A)\n │\n └── [Connected Mode] HTTP + WebSocket (127.0.0.1:27123/execution/socket)\n         │\n         ▼\n Obsidian Plugin (Local Server &amp; Coordinator)\n         ├── Evaluates against vault/nutegg/_index.md &amp; prompts in _workflow/\n         ├── In API Mode: Delegates AI calls back to Chrome over WebSocket (keys stay in Chrome)\n         ├── In Subscription Mode: Executes locally via CLI (Codex/Claude/agy) or ChatGPT OAuth\n         └── Writes structured notes to vault/nutegg/_raw/ and &lt;egg&gt;.md</code>',
    docs_index_033: 'Schnellstart-Roadmap',
    docs_index_034:
      'Sehen Sie sich das <a href="https://www.youtube.com/watch?v=_u6mDoHZSAo" target="_blank" rel="noopener"\n              >🎬 NutEgg Promo-Video</a\n            > für einen einminütigen visuellen Rundgang an.',
    docs_index_035:
      'Installieren Sie die <a\n              href="https://chromewebstore.google.com/detail/nutegg/bmdmdiicembobejibggoeiahaonphcol"\n              target="_blank"\n              rel="noopener"\n              >Chrome Extension</a\n            > aus dem Chrome Web Store und fügen Sie Ihren AI-Schlüssel in den Optionen hinzu (siehe <a href="chrome-extension.html">Anleitung</a>).',
    docs_index_036:
      'Öffnen Sie die Seitenleiste eines beliebigen Artikels oder YouTube Videos und klicken Sie auf <strong>Analysieren</strong>. Das ist es!',
    docs_index_037:
      '<em>Optional:</em> Installieren Sie das <a href="https://community.obsidian.md/plugins/nutegg" target="_blank" rel="noopener">Obsidian Plugin</a> (siehe <a href="obsidian-plugin.html">Guide</a>) und definieren Sie Ihre ersten Wissensthemen in <a href="knowledge-structuring.html">_index.md</a>, um mit dem Schraffieren zu beginnen.',
    docs_knowledgeStructuring_001: 'Wissensstrukturierung und Eggs — NutEgg',
    docs_knowledgeStructuring_002: 'Chrome Webshop ↗',
    docs_knowledgeStructuring_003: 'Obsidian Plugin ↗',
    docs_knowledgeStructuring_004: 'Veröffentlichungen',
    docs_knowledgeStructuring_005: 'Datenschutzrichtlinie',
    docs_knowledgeStructuring_006: 'Wissensstrukturierung und Eggs',
    docs_knowledgeStructuring_007:
      'Erfahren Sie, wie NutEgg Ihren Obsidian-Tresor organisiert, Webinhalte mit <code>_index.md</code> Themen zuordnet und gesammelte Einträge in Wissensbäumen zusammenführt.',
    docs_knowledgeStructuring_008: 'Das <code>nutegg/</code> Tresor-Layout',
    docs_knowledgeStructuring_009:
      'Der gesamte NutEgg-Inhalt ist auf einen sauberen, isolierten <code>nutegg/</code>-Ordner in Ihrem Obsidian-Tresor beschränkt:',
    docs_knowledgeStructuring_010:
      '<code>vault/\n└── nutegg/\n    ├── _raw/                          # Captured nuts (raw web content + metadata)\n    │   └── 2026-09-06-14-30-youtube-author-title.md\n    ├── _index.md                      # Topic routing guide\n    ├── ai_architecture.md             # Knowledge egg\n    ├── invest_strategy.md             # Knowledge egg\n    └── productivity.md                # Knowledge egg</code>',
    docs_knowledgeStructuring_011: 'Der Routing-Guide: <code>_index.md</code>',
    docs_knowledgeStructuring_012:
      'Die <code>_index.md</code>-Datei teilt NutEgg mit, welche egg-Notizen Sie pflegen und welche Domänen sie abdecken. Jede Zeile ordnet Schlüsselwörtern und Beschreibungen einen relativen Dateipfad zu:',
    docs_knowledgeStructuring_013:
      '<code>nutegg/ai_architecture.md: LLMs, multi-agent systems, prompt engineering, RAG, embeddings\nnutegg/invest_strategy.md: value investing, index funds, asset allocation, macroeconomic indicators\nnutegg/productivity.md: deep work, time blocking, habits, personal knowledge management</code>',
    docs_knowledgeStructuring_014: '⚡ So funktioniert das Routing',
    docs_knowledgeStructuring_015:
      'Wenn Sie im Browser auf <strong>Analysieren</strong> klicken, liest die KI von NutEgg Ihre <code>_index.md</code> und bestimmt, welches egg (falls vorhanden) mit dem Inhalt übereinstimmt. Wenn kein vorhandener egg übereinstimmt, bietet NutEgg an, automatisch einen neuen egg zu erstellen, der aus dem Thema der Seite stammt!',
    docs_knowledgeStructuring_016: 'Egg Dateianatomie und Funktionsweise der Anweisungen',
    docs_knowledgeStructuring_017:
      'Eine <strong>Egg-Datei</strong> (gespeichert unter <code>nutegg/*.md</code>) erfüllt zwei entscheidende Rollen: Sie ist sowohl Ihr kuratiertes, sich entwickelndes Wissensrepository für eine Domäne als auch eine aktive Eingabeaufforderungsspezifikation, die die KI-Pipeline von NutEgg steuert, wann immer Inhalte dieses Thema berühren.',
    docs_knowledgeStructuring_018: '1. Strukturplan',
    docs_knowledgeStructuring_019:
      'Jede egg-Datei kombiniert YAML-Metadaten, einen Obsidian-Callout-Block mit Anweisungen, einen kuratierten Wissensbaum und einen unverarbeiteten Staging-Puffer:',
    docs_knowledgeStructuring_020:
      '<code>---\ntopic: "AI Architecture & Multi-Agent Systems"\nstatus: "active"\nlast_updated: "2026-09-10"\n---\n\n> [!abstract]- Instructions:\n> **Scope:** Multi-agent architectures, tool calling, memory layers, and LLM evaluation.\n> **Action Guide:** Focus on actionable design patterns, scalability tradeoffs, and real failure modes.\n> **Key Questions:**\n> 1. How are agent memory loops bounded to prevent context window overflow?\n> 2. What coordination mechanism is used between subagents?\n> **Worth Reading If:**\n&gt; - Practical examples and substantive explanations.\n&gt; **Skip If:**\n> - Ignore basic beginner tutorials or high-level sales pitches without technical substance.\n> - Discard speculative claims lacking empirical benchmarks or code evidence.\n> **Formatting Rules:**\n> - Prefix each insight with a bracketed tag: `[concept]`, `[architecture]`, `[method]`, `[benchmark]`, `[explain]`, `[fact]`, `[example]`.\n> - Use the structure: `- [tag] **Concept Name**` followed by an indented explanation and concrete examples (`- 🎯 Example:`).\n\n# Knowledge\n## Agent Memory\n- [architecture] **Bounded Replay Buffers**\n    - Ephemeral short-term memory expires after session goals terminate to conserve token budget.\n    - 🎯 Example: Tool calling trace logs stored in vector stores with sliding window eviction.\n\n# Unprocessed\n(Newly hatched insights land here from captures until auto-merged)</code>',
    docs_knowledgeStructuring_021: '2. So schreiben Sie Egg Anweisungen',
    docs_knowledgeStructuring_022:
      'Das Callout <code>&gt; [!abstract]- Instructions:</code> enthält sechs Spezialfelder. Jeder leitet eine bestimmte Phase der KI-Pipeline:',
    docs_knowledgeStructuring_023: 'Feld',
    docs_knowledgeStructuring_024: 'Zweck und Best Practices',
    docs_knowledgeStructuring_025: 'Workflow-Nutzung',
    docs_knowledgeStructuring_026: '<code>**Scope:**</code>',
    docs_knowledgeStructuring_027:
      '1–2 Sätze, die die thematischen Grenzen dieses egg definieren. Geben Sie explizit an, welche Konzepte, Technologien oder Fragen einbezogen bzw. ausgeschlossen sind.',
    docs_knowledgeStructuring_028:
      'Wird in <code>egg-analysis.md</code> (Stufe 2) injiziert, sodass die KI Wissen ausschließlich durch diese Domänenlinse extrahiert.',
    docs_knowledgeStructuring_029: '<code>**Action Guide:**</code>',
    docs_knowledgeStructuring_030:
      '1–5-stufige Anleitung, wie die KI Inhalte zusammenfasst und bewertet (z. B. nach bestimmten Perspektiven, Tiefe oder Kompromissen fragen). Falls weggelassen, wird auf die Standardanleitung zurückgegriffen.',
    docs_knowledgeStructuring_031: 'Injiziert in <code>egg-analysis.md</code> (Stufe 2).',
    docs_knowledgeStructuring_032: '<code>**Key Questions:**</code>',
    docs_knowledgeStructuring_033:
      'Nummerierte Liste wiederkehrender Fragen, die Sie beantwortet haben möchten, wenn Inhalte diese Domäne berühren (z. B. <em> „Wie hoch sind die Token-Kosten?“ </em>, <em> „Welche Fehlermodi gibt es?“ </em>).',
    docs_knowledgeStructuring_034:
      'Injiziert in <code>egg-analysis.md</code> (Stufe 2). Im Erweiterungs-Popup Chrome beantwortet und in Ihren Roherfassungsnotizen gespeichert.',
    docs_knowledgeStructuring_035: '<code>**Worth Reading If:** / **Skip If:**</code>',
    docs_knowledgeStructuring_036:
      'Zwei Präferenzlisten, die beschreiben, wann das Original Ihre Zeit verdient und wann die Zusammenfassung ausreicht.',
    docs_knowledgeStructuring_037:
      'Leiten Sie die Leseaktion der Stufe 2: vollständig, Hervorhebungen, Zusammenfassung, überspringen oder unsicher. Sie lehnen Einträge während der Zusammenführung niemals ab.',
    docs_knowledgeStructuring_038: '<code>**Formatting Rules:**</code>',
    docs_knowledgeStructuring_039:
      'Formatierungsstandards: Tags in Klammern (<code>[concept]</code>, <code>[architecture]</code>, <code>[method]</code> usw.) und hierarchische Aufzählungszeicheneinrückung.',
    docs_knowledgeStructuring_040:
      'Injiziert in <code>egg-analysis.md</code> (Stufe 2). Garantiert, dass Kandidateneinträge den Formatierungskonventionen Ihrer Notizen entsprechen.',
    docs_knowledgeStructuring_041: '3. Kuratierter Wissensbaum vs. unverarbeitete Warteschlange',
    docs_knowledgeStructuring_042:
      'NutEgg schützt Ihre Wissensdatenbank vor KI-Verschmutzung, indem kuratiertes Wissen von neuen Erfassungen getrennt wird:',
    docs_knowledgeStructuring_043:
      '<strong><code># Knowledge</code> (Kuratierter Baum):</strong> Strukturiert mit Markdown-Überschriften und verschachtelten Aufzählungspunkten. Nur Merge liest diesen Baum und konsolidiert äquivalente Behauptungen, während eindeutige Beispiele, Vorbehalte, Meinungsverschiedenheiten und Quellen erhalten bleiben. Stufe 2 folgt den Anweisungen, ohne sie mit dem Baum zu vergleichen.',
    docs_knowledgeStructuring_044:
      '<strong><code># Unprocessed</code> (Staging-Warteschlange):</strong> Wenn Sie im Browser auf <strong>🥚 Hatch Egg</strong> klicken, werden genehmigte Einträge und unterstützte Antworten sicher an <code># Unprocessed</code> angehängt, anstatt Ihre kuratierte Hierarchie direkt zu berühren.',
    docs_knowledgeStructuring_045: '4. Wie die einzelnen Teile im Workflow verwendet werden',
    docs_knowledgeStructuring_046:
      'So fließen Webinhalte durch Ihre egg-Anweisungen von der ersten Erfassung bis zur endgültigen Synthese:',
    docs_knowledgeStructuring_047:
      '<code>[Captured Web Content]\n          │\nStage 1   ▼   _index.md (Topic routing guide)\n─────────────────────────────────────────────────────────────\n• Uses content-task-default.md\n• Generates Title Verdict, 3-Bullet Summary, Mind Map\n• egg-routing.md matches target eggs via Stage 1 summary\n          │\n          ▼\nUser Review: Confirm or select target eggs in popup\n          │\nStage 2   ▼   Target Egg File (nutegg/*.md)\n─────────────────────────────────────────────────────────────\n• Scope, Key Questions, Formatting Rules ──► egg-analysis.md\n  (Extracts candidate knowledge entries and answers questions)\n• Worth Reading If / Skip If guide the reading recommendation\n  (Full, highlights, summary, skip, or uncertain; no tree comparison)\n          │\n          ▼\nHatch Egg: Approved entries and supported answers appended to # Unprocessed\n          │\nMerge Cycle (20+ entries or manual button)\n─────────────────────────────────────────────────────────────\n• merge-unprocessed.md nests and integrates entries into # Knowledge</code>',
    docs_knowledgeStructuring_048: 'Wissen automatisch zusammenführen',
    docs_knowledgeStructuring_049:
      'Wenn sich 20 oder mehr Einträge in <code># Unprocessed</code> ansammeln (oder wenn Sie im Leseansichts-Widget Obsidian auf <strong>Zusammenführen</strong> klicken), führt die KI von NutEgg eine automatisierte Hintergrundsynthese mit <code>merge-unprocessed.md</code> durch. Es kategorisiert, dedupliziert und verschachtelt ausstehende Einträge unter den entsprechenden übergeordneten Konzepten in <code># Knowledge</code> und sorgt so dafür, dass Ihr Wissensgraph ständig organisiert bleibt.',
    docs_obsidianPlugin_001: 'Anleitung zum Obsidian-Plugin — NutEgg',
    docs_obsidianPlugin_002: 'Obsidian Community-Plugin ↗',
    docs_obsidianPlugin_003: 'Chrome Webshop ↗',
    docs_obsidianPlugin_004: 'Plugin-Veröffentlichungen',
    docs_obsidianPlugin_005: 'Datenschutzrichtlinie',
    docs_obsidianPlugin_006: 'Einrichtung und Konfiguration des Obsidian-Plugins',
    docs_obsidianPlugin_007:
      'Das Plugin NutEgg Obsidian hostet den lokalen Synchronisierungsserver, verwaltet die KI-Kommunikation, ordnet eingehende Inhalte Ihren Wissensbäumen zu und verwaltet Ihre Tresordateien.',
    docs_obsidianPlugin_008: 'Installation',
    docs_obsidianPlugin_009: 'Option 1: Obsidian Community Plugins (empfohlen)',
    docs_obsidianPlugin_010: 'NutEgg ist offiziell im Obsidian Community Plugins-Verzeichnis aufgeführt:',
    docs_obsidianPlugin_011: 'Öffnen Sie in Obsidian <strong>Einstellungen → Community-Plugins</strong>.',
    docs_obsidianPlugin_012:
      'Stellen Sie sicher, dass der <strong>Eingeschränkte Modus</strong> deaktiviert ist, und klicken Sie dann auf <strong>Durchsuchen</strong>.',
    docs_obsidianPlugin_013:
      'Suchen Sie nach <strong>NutEgg</strong> (oder besuchen Sie <a href="https://community.obsidian.md/plugins/nutegg" target="_blank" rel="noopener"\n              >NutEgg auf Obsidian Community Plugins</a\n            >).',
    docs_obsidianPlugin_014: 'Klicken Sie auf <strong>Installieren</strong> und dann auf <strong>Aktivieren</strong>.',
    docs_obsidianPlugin_015: 'Option 2: Manuelle Installation',
    docs_obsidianPlugin_016:
      'Laden Sie <code>main.js</code>, <code>manifest.json</code> und <code>styles.css</code> von den <a href="https://github.com/staff-000/nutegg-obsidian-release/releases" target="_blank" rel="noopener"\n              >NutEgg Obsidian Plugin-Releases</a\n            > herunter.',
    docs_obsidianPlugin_017:
      'Öffnen Sie in Ihrem Obsidian-Tresor <code>.obsidian/plugins/</code> (zeigen Sie bei Bedarf versteckte Ordner in Ihrem Betriebssystem an).',
    docs_obsidianPlugin_018:
      'Erstellen Sie ein neues Verzeichnis mit dem Namen <code>nutegg</code> und platzieren Sie die drei Dateien darin: <pre><code>your-vault/.obsidian/plugins/nutegg/\n├── main.js\n├── manifest.json\n└── styles.css</code></pre>',
    docs_obsidianPlugin_019:
      'Öffnen Sie in Obsidian <strong>Einstellungen → Community-Plugins</strong>, klicken Sie auf <strong>Neuladen</strong> und schalten Sie <strong>NutEgg</strong> ein.',
    docs_obsidianPlugin_020: 'Option 3: Verwendung von BRAT',
    docs_obsidianPlugin_021:
      'Installieren Sie das Community-Plugin <a href="https://github.com/tfthacker/obsidian42-brat" target="_blank" rel="noopener">BRAT</a> in Obsidian.',
    docs_obsidianPlugin_022: 'Gehen Sie zu <strong>Einstellungen → BRAT → Beta-Plugin hinzufügen</strong>.',
    docs_obsidianPlugin_023:
      'Geben Sie <code>staff-000/nutegg-obsidian-release</code> ein und klicken Sie auf <strong>Plugin hinzufügen</strong>.',
    docs_obsidianPlugin_024: 'Aktivieren Sie NutEgg nach der Installation.',
    docs_obsidianPlugin_025: 'KI-Ausführungsarchitektur',
    docs_obsidianPlugin_026:
      'NutEgg verwendet eine intelligente Dual-Execution-Architektur (Protokoll 3), die Ihnen volle Flexibilität zwischen der Privatsphäre Ihres eigenen API-Schlüssels und dem Komfort eines Zero-Key-Abonnements bietet:',
    docs_obsidianPlugin_027: '🔒 Kern-Datenschutzinvariante: API-Schlüssel verlassen niemals Chrome',
    docs_obsidianPlugin_028:
      'Im <strong>Connected API Mode</strong> orchestriert Obsidian Tresorvorgänge, die Eingabeaufforderungsassemblierung und egg die Indizierung, aber <strong>delegiert alle KI-Aufrufe über einen authentifizierten lokalen WebSocket zurück an Chrome</strong>. Chrome führt den Aufruf mit seinem lokal gespeicherten API-Schlüssel aus. Ihre API-Schlüssel werden niemals an Obsidian übertragen, niemals in Tresornotizen geschrieben und verlassen niemals den Browser.',
    docs_obsidianPlugin_029:
      '<code>┌─────────────────────────────────────────────────────────────────────────────┐\n│                           CONNECTED API MODE (Default)                      │\n│                                                                             │\n│  Chrome Profile A ──(1) HTTP /analyze /confirm──►  Obsidian Plugin          │\n│  (Holds API Key A)                                 (127.0.0.1:27123)        │\n│                                                            │                │\n│                   ◄─(2) WebSocket AI Call /socket──────────┤ Reads _index.md│\n│  Calls Provider A                                          │ Assembles prompt│\n│  (OpenAI / Claude / Gemini / DeepSeek)                     │                │\n│                   ──(3) Authenticated Result─────────────► │                │\n│                                                            ▼                │\n│  Receives Final Result ◄──────(4) HTTP Result────── Saves to Vault          │\n│                                                     (_raw/ & &lt;egg&gt;.md)      │\n└─────────────────────────────────────────────────────────────────────────────┘\n\n┌─────────────────────────────────────────────────────────────────────────────┐\n│                       SHARED SUBSCRIPTION MODE (Zero API Keys)              │\n│                                                                             │\n│  Chrome Profile A ────┐                                                     │\n│                       ├──► Obsidian Plugin (127.0.0.1:27123)                │\n│  Chrome Profile B ────┘        │                                            │\n│                                ▼                                            │\n│                       SubscriptionService (Local CLI or OAuth)              │\n│                       ├── ChatGPT Sign-In (OpenAI Responses API)            │\n│                       ├── Codex CLI (@openai/codex)                         │\n│                       ├── Claude Code CLI (claude auth login)               │\n│                       └── Google Gemini (Antigravity CLI: agy)              │\n└─────────────────────────────────────────────────────────────────────────────┘</code>',
    docs_obsidianPlugin_030: 'Modus 1: Verbundener API-Modus (Standard)',
    docs_obsidianPlugin_031:
      'In diesem Modus konfigurieren Sie Ihren KI-Anbieter und API-Schlüssel direkt in <strong>Chrome Erweiterungsoptionen</strong>. Obsidian koordiniert den Wissensworkflow, während Chrome als sicherer lokaler KI-Läufer fungiert.',
    docs_obsidianPlugin_032:
      '<strong>Unterstützte Cloud-Anbieter</strong>: Anthropic (Claude 3.5 Sonnet, Claude 3.7 Sonnet), OpenAI (GPT-4o, o-series), Google Gemini (2.0 Flash, 2.5 Pro), DeepSeek (V3, R1), Kimi, Qwen, Zhipu und OpenRouter.',
    docs_obsidianPlugin_033:
      '<strong>Lokale LLMs (Ollama, LM Studio, llama.cpp, vLLM)</strong>: Lokale Endpunkte direkt in Chrome konfigurieren. NutEgg stellt eine Verbindung zu Ihrem lokalen Modell her, ohne Daten außerhalb Ihres Computers zu senden.',
    docs_obsidianPlugin_034:
      '<strong>Unabhängige Chrome Profile</strong>: Wenn Sie mehrere Chrome Profile verwenden (z. B. Geschäftlich und Persönlich), kann jedes Profil seinen eigenen Anbieter, sein eigenes Modell und seinen eigenen API-Schlüssel verwenden. Sie stellen ohne Schlüsselkollisionen eine Verbindung zum selben Obsidian-Tresor her.',
    docs_obsidianPlugin_035:
      '<strong>Obsidian-Native Aktionen</strong>: Nur Tresor-Wartungsaufgaben (z. B. manuelle egg Zusammenführung in Obsidian) verwenden native Einstellungen, die sicher in Obsidians <code>SecretStorage</code> gespeichert sind. Durch Klicken auf <strong>Speichern und fortfahren</strong> in einem verbundenen Chrome Profil wird das native Konto in SecretStorage sicher aktualisiert.',
    docs_obsidianPlugin_036: 'Modus 2: Gemeinsamer Abonnementmodus und ChatGPT-Anmeldung',
    docs_obsidianPlugin_037:
      'Sie möchten keine API-Schlüssel oder Pay-per-Token-Guthaben verwalten? NutEgg unterstützt die direkte Anmeldung und lokale Entwickler-CLI-Abonnements, die in Obsidian verwaltet werden:',
    docs_obsidianPlugin_038: 'Option A: Direkte ChatGPT-Anmeldung (keine CLI erforderlich)',
    docs_obsidianPlugin_039: 'Öffnen Sie in Obsidian <strong>Einstellungen → NutEgg</strong>.',
    docs_obsidianPlugin_040:
      'Wählen Sie unter <strong>AI-Verbindung</strong> die Option <strong>ChatGPT-Anmeldung</strong> aus.',
    docs_obsidianPlugin_041:
      'Klicken Sie auf <strong>Mit ChatGPT fortfahren</strong>, schließen Sie den Browser-Autorisierungsablauf ab und erlauben Sie die Nutzung des Plans.',
    docs_obsidianPlugin_042: 'Wählen Sie Ihr Kontomodell (z. B. <code>gpt-4o</code>).',
    docs_obsidianPlugin_043:
      'Alle verbundenen Chrome-Profile folgen dieser Verbindung sofort, ohne dass ein API-Schlüssel eingerichtet werden muss. Anmeldeinformationen werden sicher im Schlüsselbundspeicher des jeweiligen Betriebssystems gespeichert und niemals an Chrome gesendet oder in Tresordateien gespeichert.',
    docs_obsidianPlugin_044: 'Option B: Lokale CLI-Abonnements (Codex, Claude, Gemini)',
    docs_obsidianPlugin_045:
      'NutEgg kann offizielle Entwickler-CLI-Tools ausführen, die bereits auf Ihrem Computer installiert und angemeldet sind:',
    docs_obsidianPlugin_046: 'Anbieter',
    docs_obsidianPlugin_047: 'CLI-Installation',
    docs_obsidianPlugin_048: 'Authentifizierung',
    docs_obsidianPlugin_049: 'Modellerkennung',
    docs_obsidianPlugin_050: '<strong>Codex CLI</strong>',
    docs_obsidianPlugin_051: '<code>npm install -g @openai/codex</code>',
    docs_obsidianPlugin_052: '<code>codex login</code>',
    docs_obsidianPlugin_053: 'Automatisch über App-Server',
    docs_obsidianPlugin_054: '<strong>Anthropisch Claude</strong>',
    docs_obsidianPlugin_055:
      '<a href="https://code.claude.com/docs/en/quickstart" target="_blank" rel="noopener">Claude Code</a>',
    docs_obsidianPlugin_056: '<code>claude auth login --claudeai</code>',
    docs_obsidianPlugin_057: 'Sonett, Opus, Haiku oder benutzerdefinierte ID',
    docs_obsidianPlugin_058: '<strong>Google Gemini</strong>',
    docs_obsidianPlugin_059:
      '<a href="https://antigravity.google/docs/cli/install" target="_blank" rel="noopener">Antigravity CLI</a>',
    docs_obsidianPlugin_060: '<code>agy</code> Browserfluss',
    docs_obsidianPlugin_061: 'Automatisch über <code>agy models</code>',
    docs_obsidianPlugin_062:
      'Wählen Sie in Obsidian Einstellungen → NutEgg einfach Ihre CLI unter <strong>AI-Verbindung</strong> aus. NutEggs internes <code>SubscriptionService</code> führt die Inferenz lokal in einer begrenzten seriellen Warteschlange aus. Es ist kein separater Bridge-Server oder Port 27124 erforderlich.',
    docs_obsidianPlugin_063: 'Lokaler Synchronisierungsserver und Sicherheit',
    docs_obsidianPlugin_064:
      'Wenn das Plugin aktiviert ist, startet es automatisch einen HTTP- und WebSocket-Listener im Hintergrund auf <code>127.0.0.1:27123</code>.',
    docs_obsidianPlugin_065: '🔒 Datenschutz und Herkunftssicherheit',
    docs_obsidianPlugin_066:
      'Der lokale Server bindet strikt an die Localhost-Loopback-Adresse (<code>127.0.0.1</code>). Es erzwingt eine strikte <code>X-NutEgg-Extension-Origin</code>- und Token-Validierung und verhindert so, dass normale Webseiten auf Ihren Tresor zugreifen. WebSocket-Verbindungen werden bereits beim ersten Frame authentifiziert.',
    docs_obsidianPlugin_067: 'Workflow und schnelle Anpassung',
    docs_obsidianPlugin_068:
      'NutEgg unterstützt seine KI-Analyse durch modulare, bearbeitbare Markdown-Eingabeaufforderungen, die direkt in Ihrem Tresor unter <code>nutegg/_workflow/</code> gespeichert werden:',
    docs_obsidianPlugin_069:
      '<strong>Bearbeitbare Vorlagen</strong>: Passen Sie Eingabeaufforderungen für Inhaltsanalyse, egg Vergleich, Weiterleitung und Nachverfolgung an.',
    docs_obsidianPlugin_070:
      '<strong>Zerstörungsfreie Updates</strong>: Wenn NutEgg aktualisierte Eingabeaufforderungsvorlagen veröffentlicht, bleiben Ihre benutzerdefinierten Arbeitsabläufe automatisch erhalten, ohne überschrieben zu werden.',
    docs_workflow_001: 'KI-Workflows und Prompt-Engine — NutEgg',
    docs_workflow_002: 'Chrome Webshop ↗',
    docs_workflow_003: 'Obsidian Plugin ↗',
    docs_workflow_004: 'Veröffentlichungen',
    docs_workflow_005: 'Datenschutzrichtlinie',
    docs_workflow_006: 'KI-Workflows und Prompt-Engine',
    docs_workflow_007:
      'Erfahren Sie, wie die modulare Workflow-Engine von NutEgg die Inhaltsextraktion, das zusammenfassungsbasierte egg-Routing, die anweisungsgesteuerte Analyse und vom Benutzer anpassbare Eingabeaufforderungen orchestriert.',
    docs_workflow_008: 'Die zweistufige Architektur',
    docs_workflow_009:
      'Anstatt eine einzelne monolithische Eingabeaufforderung auszuführen, verwendet NutEgg eine <strong>Zweistufige Architektur</strong>, die auf Token-Effizienz, hohe Extraktionspräzision und vollständige Benutzerkontrolle ausgelegt ist:',
    docs_workflow_010:
      '<code>                    ┌───────────────────────────────┐\n                    │      Captured Web Content     │\n                    │   (Article / YouTube / Tweet) │\n                    └───────────────┬───────────────┘\n                                    │\n                                    ▼\n       ===========================================================\n       STAGE 1: Content & Discussion Analysis + Egg Routing\n       ===========================================================\n            │                                             │\n            ├─► Content Analysis                          ├─► Discussion Analysis\n            │   (Is content >30k chars?)                  │   (When 💬 Discussion enabled\n            │    ├── No  ──► [content-analysis.md]        │    & comments captured)\n            │    └── Yes ──► Chunks + [aggregate-         │    ├── [discussion-analysis.md]\n            │                content.md]                  │    └── [aggregate-discussion.md]\n            │                                             │\n            └──────────────────────┬──────────────────────┘\n                                   │\n                                   ▼\n        Produces: Title Verdict, 3-Bullet Summary, Mind Map,\n        Timestamped Q&A, and Discussion Topics/Stances\n                                   │\n                                   ▼\n                          [egg-routing.md]\n          (Routes matched eggs from _index.md using the\n           concise Stage 1 summary instead of raw content)\n                                    │\n                                    ▼\n       ===========================================================\n       INTERACTIVE CHOICE / EXECUTION MODE (Chrome Extension)\n       ===========================================================\n                                    │\n                        Which mode is selected?\n                                    │\n            ┌───────────────────────┼───────────────────────┐\n            ▼                       ▼                       ▼\n     [Standalone Mode]         [🌞 Full Mode]      [🌛 Preview Summary]\n     Obsidian is offline.      Auto-proceeds to    User reviews matched eggs:\n     Runs Stage 1 in Chrome    Stage 2 with all    ├── "Collect Nut Only"\n     with user\'s API key.      matched eggs.       └── Add/remove eggs ──► Proceed\n     (Fast reading & Q&A)           │                       │\n            │                       └───────────┬───────────┘\n            ▼                                   ▼\n    Results in Side Panel      ===========================================================\n    (No Stage 2 analysis)    STAGE 2: Per-Egg Instruction-Driven Analysis\n                               ===========================================================\n                                                │\n                                   For each confirmed egg (1 or N):\n                                                │\n                                                ▼\n                                        [egg-analysis.md]\n                                  (Extract candidate knowledge entries\n                                   & key questions scoped to this egg)\n                                                │\n                                                ▼\n                                  (Answers + extracted entries + reading action)\n                                                │\n                                                ▼\n                                     Results returned to Popup\n                                     (Ready to Save Nut & Eggs)</code>',
    docs_workflow_011: '💡 Warum zusammenfassungsbasiertes Routing?',
    docs_workflow_012:
      'Das Routing eggs unter Verwendung der Zusammenfassung der Stufe 1 anstelle vollständiger Rohartikel oder mehrstündiger Videotranskripte spart Zehntausende Token pro Lauf und verbessert die Routing-Genauigkeit, indem es sich auf destillierte, signalstarke semantische Themen konzentriert.',
    docs_workflow_013:
      'Die Kreuztabellenanzeige im Seitenbereich zeigt laufende Analysen und ungelesene abgeschlossene Ergebnisse im aktuellen Chrome-Fenster an. Klicken Sie darauf, um Registerkarten aufzulisten und direkt zu ihren Ergebnissen oder Fortschritten zu wechseln. Ergebnisse werden gelesen, wenn ihre Analyse auf der aktiven Registerkarte sichtbar ist. Die Verfolgung bleibt bestehen, solange das Bedienfeld geöffnet bleibt, und wird beim Schließen zurückgesetzt.',
    docs_workflow_014:
      'Hatch archiviert die ursprüngliche Analyse und hängt genehmigte Einträge an <code># Unprocessed</code> an. Merge wird mit 20 ausstehenden Einträgen oder bei Bedarf ausgeführt, um Fragmente zusammenzustellen und Ansprüche zu deduplizieren und gleichzeitig Quellen, Vorbehalte, Beispiele und Meinungsverschiedenheiten beizubehalten. Stufe 2 erhält nie den Wissensbaum, daher bewertet die Empfehlung eher Relevanz und Substanz als Neuheit.',
    docs_workflow_015:
      'Die Abschnittsoption <strong>🍃 Wissen</strong> und das Dropdown-Menü Egg Analyse teilen sich eine Einstellung für die aktuelle Browserregisterkarte: <strong>🥚 Nur Analyse</strong> schaltet Wissen aus und <strong>🍃 Wissen einbeziehen</strong> schaltet es ein. Durch das Wechseln der Dropdown-Auswahl werden die Einstellung und die Schaltflächenbeschriftung aktualisiert, ohne dass automatisch ein KI-Aufruf ausgelöst wird. Klicken Sie zum Analysieren auf die Schaltfläche. Beim Wechsel zu „Wissen einbeziehen“ für ein egg, das zuvor ohne Wissenseinträge analysiert wurde, führt NutEgg Stufe 2 erneut aus, anstatt einfach das zwischengespeicherte Nur-Antwort-Ergebnis anzuzeigen. „Wissen einbeziehen“ ist die anfängliche Standardeinstellung; Ihre letzte Auswahl wird zur Standardeinstellung für Registerkarten ohne Analyse. Durch das Ausschalten der Option werden zuvor erstellte Einträge nicht ausgeblendet oder deren Speicherung verhindert. Durch das Deaktivieren von Knowledge werden Einträge für alle ausgewählten egg deaktiviert. Wenn Sie es aktivieren, sind Einträge nur für eggs möglich, die dies zulassen: <code>Generate Knowledge Entries: no</code> oder ein Opt-out im Aktionsleitfaden von egg hat Vorrang. Wichtige Antworten und Leseempfehlungen bleiben in jedem Fall verfügbar. Die Analyse speichert keine Einträge; <strong>🐣 Hatch Egg</strong> speichert generierte Einträge in egg Dateien.',
    docs_workflow_016: 'Workflow-Modi',
    docs_workflow_017: 'Modus',
    docs_workflow_018: 'Verhalten',
    docs_workflow_019: 'Am besten geeignet für',
    docs_workflow_020: '<strong>📱 Standalone-Modus</strong>',
    docs_workflow_021:
      'Führt die Inhaltsanalyse der Stufe 1 direkt in Chrome durch (wenn Obsidian offline oder geschlossen ist). Erstellt Urteile, Zusammenfassungen mit drei Sätzen, Mindmaps mit anklickbaren Zeitstempeln und interaktive Video-Fragen und Antworten mit Zeitstempelsprung. Überspringt die Analyse der Stufe 2 egg.',
    docs_workflow_022:
      'Schnelles Lesen von Web- und Videoinhalten, schnelles Verstehen oder wenn Sie keine Notizenarchivierung benötigen.',
    docs_workflow_023: '<strong>🌞 Vollmodus</strong>',
    docs_workflow_024:
      'Führt die Inhaltsanalyse der Stufe 1 durch, leitet eggs automatisch über <code>_index.md</code> weiter und führt sofort die Analyse der Stufe 2 egg in einem ununterbrochenen Durchgang aus.',
    docs_workflow_025:
      'Alltägliches Lesen und schnelle Aufnahmen, wenn Sie auf den automatischen egg-Abgleich vertrauen.',
    docs_workflow_026: '<strong>🌛 Vorschau-Zusammenfassung</strong>',
    docs_workflow_027:
      'Führt die Inhaltsanalyse der Stufe 1 durch und pausiert dann im Popup. Zeigt übereinstimmende eggs neben der vollständigen egg-Liste Ihres Tresors an. Sie können eggs hinzufügen/entfernen, mit dem Wissensvergleich fortfahren oder auf <strong>Nur Nut sammeln</strong> klicken.',
    docs_workflow_028:
      'Tiefgreifende Recherche, mehrdeutige Themen oder wenn Sie nur eine kurze Zusammenfassung wünschen, ohne egg Wissensbäume zu aktualisieren.',
    docs_workflow_029: 'AI-Ausführungs- und Anmeldeinformationsprotokoll',
    docs_workflow_030:
      'Unabhängig davon, ob Sie den Vollmodus oder die Vorschauzusammenfassung wählen, NutEgg trennt <em>Workflow-Orchestrierung</em> von <em>Anmeldeinformationsspeicher und KI-Inferenz</em>:',
    docs_workflow_031:
      '<strong>Verbundener API-Modus (Standard)</strong>: Obsidian koordiniert die sofortige Vorlageninjektion und den Wissensvergleich, sendet jedoch Inferenzanfragen an Chrome über einen authentifizierten WebSocket (<code>/execution/socket</code>). Chrome führt den LLM-Aufruf mit seinem lokalen API-Schlüssel aus und sendet das authentifizierte Ergebnis zurück. <strong>Ihr API-Schlüssel verlässt niemals Chrome.</strong>',
    docs_workflow_032:
      '<strong>Freigegebener Abonnementmodus</strong>: Obsidian koordiniert den Workflow und führt KI-Aufrufe direkt lokal mithilfe offizieller Entwickler-CLI-Tools (<code>codex</code>, <code>claude</code>, <code>agy</code>) oder direkter ChatGPT-OAuth-Anmeldung aus. Alle verbundenen Chrome-Profile teilen sich dieses Abonnement, ohne dass ein API-Schlüssel erforderlich ist.',
    docs_workflow_033: 'Workflow-Dateien in Ihrem Tresor',
    docs_workflow_034:
      'NutEgg fügt seine Eingabeaufforderungsvorlagen in <code>nutegg/_workflow/</code> in Ihrem Tresor ein:',
    docs_workflow_035: '1. Geteilte Fragmente (in andere Eingabeaufforderungen eingefügt)',
    docs_workflow_036:
      '<code>shared-output-rules.md</code>: Erdungsrichtlinie (Quelleninhalt als alleinige Wahrheit) und Referenzregeln für mehrsprachige Ausgabesprachen. Injiziert als <code>{{shared_output_rules}}</code>.',
    docs_workflow_037:
      '<code>content-task-default.md</code>: Kernaufgabenanweisungen für Titelurteile, 3-Punkte-Zusammenfassungen und Mindmaps mit anklickbaren Zeitstempeln. Injiziert als <code>{{content_task_default}}</code>.',
    docs_workflow_038: '2. Content-Erfassungs- und Vergleichspipeline',
    docs_workflow_039:
      '<code>content-analysis.md</code>: Inhaltszusammenfassung der Stufe 1, Anti-Clickbait-Urteil, interaktive Mindmap mit anklickbaren Zeitstempeln und benutzerdefinierte Fragenantworten mit Zeitstempel-Zitaten.',
    docs_workflow_040:
      '<code>egg-routing.md</code>: Gleicht Zusammenfassungen der Stufe 1 mit egg Beschreibungen in <code>_index.md</code> ab, um Kandidaten eggs auszuwählen.',
    docs_workflow_041:
      '<code>egg-analysis.md</code>: Stufe 2 pro-egg Extraktion von Wissenseinträgen der Kandidaten und Antworten auf Schlüsselfragen, die auf die Anweisungen von egg abgestimmt sind.',
    docs_workflow_042:
      'Lesenswert, wenn und überspringen, wenn Leitfaden vollständig gelesen, hervorgehoben, Zusammenfassung ausreichend, übersprungen oder unsicher. Nützliche Antworten bleiben unabhängig von der Empfehlung speicherbar.',
    docs_workflow_043:
      '<code>aggregate-content.md</code> &amp; <code>aggregate-egg.md</code>: Aggregation langer Inhalte (&gt;30.000 Zeichen). Stufe 2 kombiniert nur Antwortentwürfe, Empfehlungsnotizen und Berichterstattung; Extrahierte Einträge bleiben bis zur Zusammenführung in der Quellreihenfolge.',
    docs_workflow_044: '3. Diskussionsanalyse (Stufe 1)',
    docs_workflow_045:
      'Die Diskussionsanalyse wird als Teil der Inhaltsanalyse von <strong>Stufe 1</strong> ausgeführt, wenn der Abschnitt <strong>💬 Diskussion</strong> in den Erweiterungsoptionen oder Popup-Analyseabschnitten aktiviert ist und der Seitenextraktor Leserkommentare oder soziale Antworten erfasst (z. B. YouTube Kommentare, Twitter-Antworten, Reddit/Forumsthreads, Bilibili). Kommentare oder Zhihu-Antworten).',
    docs_workflow_046:
      '<code>discussion-analysis.md</code>: Analysiert Kommentare in Stapeln, um 3–5 zentrale Debattenthemen zu extrahieren, die Standpunkte der Kommentatoren zu klassifizieren (<code>agree</code>, <code>disagree</code>, <code>mixed</code>, <code>neutral</code>, <code>unclear</code>) und wertvolle Ergänzungen oder Korrekturen aus erster Hand hervorzuheben (<code>supplement: true</code>).',
    docs_workflow_047:
      '<code>aggregate-discussion.md</code>: Führt Themen und Standpunktverteilungen über Multi-Batch-Kommentarthreads hinweg für große Foren oder Videokommentarbereiche zusammen und synthetisiert sie.',
    docs_workflow_048:
      '<strong>Kontextfluss:</strong> Analysierte Diskussionszusammenfassungen und Beweiselemente werden im Ergebnis der Stufe 1 zurückgegeben und direkt in die benutzerdefinierte Frage-und-Antwort-Analyse oder die Forum-Körperanalyse eingespeist (entscheidend für diskussionsorientierte Seiten oder Videos ohne Transkripte). Sie werden auch als Kontextsignale an Stufe 2 <code>egg-analysis.md</code> weitergeleitet, damit eggs das Community-Feedback neben dem Quellinhalt auswerten kann.',
    docs_workflow_049: '4. Interaktive und Wartungsworkflows',
    docs_workflow_050:
      '<code>follow-up.md</code>: Interaktive Fragen und Antworten in natürlicher Sprache im Seitenbereich mit vorherigem Gesprächsverlauf und anklickbarem Video-Zeitstempelspringen.',
    docs_workflow_051:
      '<code>merge-unprocessed.md</code>: Wird manuell oder automatisch bei mehr als 20 ausstehenden Einträgen ausgelöst, um Rohelemente in <code># Knowledge</code> zu organisieren und zu verschachteln.',
    docs_workflow_052:
      '<code>localize-egg.md</code>: Übersetzt neue egg-Vorlagen in Fremdsprachen und behält dabei die englischen Strukturüberschriften bei.',
    docs_workflow_053: 'Richtlinien zur sicheren Anpassung',
    docs_workflow_054: '⚠️ Was zu bewahren ist',
    docs_workflow_055:
      'Es steht Ihnen frei, den Ton, die Perspektive und die Tiefe der Aufforderung anzupassen. Sie <strong>müssen jedoch Folgendes beibehalten</strong>:',
    docs_workflow_056:
      'Alle <code>{{placeholder}}</code> Tags (z. B. <code>{{content}}</code>, <code>{{knowledge_tree}}</code>, <code>{{title}}</code>).',
    docs_workflow_057:
      'Exakte JSON-Ausgabeschlüssel (z. B. <code>titleVerdict</code>, <code>extractedEntries</code>, <code>mindMap</code>), damit der Parser die Antwort deserialisieren kann.',
    docs_workflow_058:
      'Strukturelle Überschriften (<code># Knowledge</code>, <code># Unprocessed</code>) in Markdown-Ausgaben.',
    docs_workflow_059: 'Konfliktfreie Updates und Reset',
    docs_workflow_060: 'Wenn NutEgg auf eine neuere Version aktualisiert wird:',
    docs_workflow_061:
      '<strong>Unbearbeitete Eingabeaufforderungen</strong>: Automatisch auf die neueste integrierte Version aktualisiert.',
    docs_workflow_062:
      '<strong>Benutzerdefinierte Eingabeaufforderungen</strong>: Ihre Änderungen werden niemals überschrieben. NutEgg schreibt <code>[filename].new.md</code> neben Ihre Datei, damit Sie neue Ergänzungen in Ihrem eigenen Tempo überprüfen können.',
    docs_workflow_063:
      '<strong>Werksreset („Standardeinstellungen verwenden“)</strong>: Brauchen Sie einen Neuanfang? Klicken Sie in <strong>Obsidian Einstellungen → NutEgg</strong> auf <strong>Standardeinstellungen verwenden</strong>. Alle vorhandenen Eingabeaufforderungen werden sicher auf <code>nutegg/_workflow/_backup/&lt;timestamp&gt;/</code> gesichert und die ursprünglichen Werkseinstellungen werden wiederhergestellt.',
  },
  pt: {
    docs_chromeExtension_001: 'Guia da extensão do Chrome — NutEgg',
    docs_chromeExtension_002: 'Chrome Loja Virtual ↗',
    docs_chromeExtension_003: 'Obsidian Plug-in ↗',
    docs_chromeExtension_004: '🎬 Vídeo promocional ↗',
    docs_chromeExtension_005: 'Lançamentos de extensão',
    docs_chromeExtension_006: 'Política de Privacidade',
    docs_chromeExtension_007: 'Configuração e uso da extensão do Chrome',
    docs_chromeExtension_008:
      'A extensão NutEgg Chrome fica no painel lateral do seu navegador, fornecendo extração de conteúdo sob demanda, mapas mentais YouTube com carimbos de data e hora clicáveis e captura com um clique para Obsidian.',
    docs_chromeExtension_009: 'Instalação',
    docs_chromeExtension_010: 'Opção 1: Chrome Loja virtual (recomendado)',
    docs_chromeExtension_011:
      'Instale NutEgg com um clique diretamente da <a\n            href="https://chromewebstore.google.com/detail/nutegg/bmdmdiicembobejibggoeiahaonphcol"\n            target="_blank"\n            rel="noopener"\n            >Chrome Web Store</a\n          > oficial:',
    docs_chromeExtension_012:
      'Visite a página <a\n              href="https://chromewebstore.google.com/detail/nutegg/bmdmdiicembobejibggoeiahaonphcol"\n              target="_blank"\n              rel="noopener"\n              >NutEgg Chrome da Web Store</a\n            >.',
    docs_chromeExtension_013: 'Clique em <strong>Adicionar a Chrome</strong>.',
    docs_chromeExtension_014:
      'Clique no ícone da peça do quebra-cabeça na barra de ferramentas Chrome e fixe <strong>NutEgg</strong> para acesso conveniente ao painel lateral.',
    docs_chromeExtension_015: 'Opção 2: da versão GitHub (.zip)',
    docs_chromeExtension_016:
      'Baixe o <code>nutegg-chrome-extension-*.zip</code> mais recente na <a\n              href="https://github.com/staff-000/nutegg-chrome-extension-release/releases"\n              target="_blank"\n              rel="noopener"\n              >Página de lançamentos</a\n            >.',
    docs_chromeExtension_017: 'Descompacte o arquivo em uma pasta local no seu computador.',
    docs_chromeExtension_018: 'Abra o Google Chrome e vá para <code>chrome://extensions</code>.',
    docs_chromeExtension_019: 'Ative o <strong>Modo de desenvolvedor</strong> no canto superior direito.',
    docs_chromeExtension_020:
      'Clique em <strong>Carregar descompactado</strong> e selecione o diretório descompactado contendo <code>manifest.json</code>.',
    docs_chromeExtension_021:
      'Clique no ícone do quebra-cabeça na barra de ferramentas Chrome e fixe <strong>NutEgg</strong> para facilitar o acesso.',
    docs_chromeExtension_022: 'Fluxo de trabalho do painel lateral',
    docs_chromeExtension_023: 'Clicar no ícone da extensão NutEgg abre o painel lateral de Chrome:',
    docs_chromeExtension_024:
      '<strong>Auto-Extração</strong>: À medida que você navega, NutEgg detecta a guia ativa (YouTube vídeo, tópico do Twitter/X ou postagem de blog) e extrai seu texto e estrutura.',
    docs_chromeExtension_025:
      '<strong>Atualização de conteúdo (🔄)</strong>: Clique no botão Atualizar na visualização do conteúdo para extrair novamente a página em aplicativos dinâmicos de página única sem redirecionar inesperadamente para fora da visualização.',
    docs_chromeExtension_026:
      '<strong>Alvo Egg Seletor</strong>: Na visualização do conteúdo, escolha o conhecimento alvo eggs ou use "Alvo eggs (seleção automática por padrão)" para permitir que a IA corresponda automaticamente às árvores de vault relevantes.',
    docs_chromeExtension_027:
      '<strong>Modos de análise</strong>: <ul> <li> <strong>Modo completo</strong>: Avalia o conteúdo e executa imediatamente a correspondência de conhecimento com a correspondência eggs em um único fluxo de trabalho simplificado. </li> <li> <strong>Modo de visualização</strong>: Gera primeiro a visão geral do Estágio 1 (resumo, mapa mental, perguntas e respostas, discussão), permitindo inspecionar ou ajustar o alvo eggs antes de executar a análise de conhecimento egg sob demanda. </li> </ul>',
    docs_chromeExtension_028:
      '<strong>Indicador de status</strong>: Um ponto verde indica uma conexão saudável com seu servidor Obsidian local (<code>127.0.0.1:27123</code>). Se estiver vermelho, certifique-se de que Obsidian esteja sendo executado com o plugin NutEgg ativado.',
    docs_chromeExtension_029: 'YouTube Integração e navegação inteligente',
    docs_chromeExtension_030: 'Nas páginas de vídeo YouTube, NutEgg extrai:',
    docs_chromeExtension_031:
      '<strong>Legendas completas e transcrições</strong>: Extração automática de alta precisão do criador e transcrições geradas automaticamente.',
    docs_chromeExtension_032:
      '<strong>Mapa mental com carimbos de data/hora clicáveis</strong>: detalhamento instantâneo com botões de carimbo de data/hora clicáveis que buscam seu player de vídeo YouTube ativo diretamente para esse segmento. Quando os carimbos de data e hora estão presentes, as tags de origem redundantes ficam ocultas para manter a árvore limpa.',
    docs_chromeExtension_033:
      '<strong>Perguntas e respostas com Timestamp Jumping</strong>: Faça qualquer pergunta sobre o vídeo em linguagem natural; NutEgg fornece respostas citadas com marcadores de data e hora clicáveis ​​que vão direto para o momento de origem na reprodução do vídeo.',
    docs_chromeExtension_034:
      '<strong>Veredicto anti-clickbait</strong>: Uma resposta objetiva de 1 frase à premissa do título do vídeo, permitindo que você pule o assunto imediatamente.',
    docs_chromeExtension_035: 'Navegação de origem de texto na página',
    docs_chromeExtension_036: 'Ao ler artigos, blogs ou fóruns:',
    docs_chromeExtension_037:
      '<strong>📍 Ir para a fonte</strong>: Os nós do mapa mental de texto e as citações de perguntas e respostas incluem tags de origem. Clicar em uma tag de origem rola automaticamente a página da web ativa até o parágrafo ou citação correspondente exata e destaca-o brevemente com um esboço.',
    docs_chromeExtension_038:
      '<strong>Navegação de comentários</strong>: Nas páginas de discussão (Reddit, Zhihu, etc.), clicar nas citações da fonte rola diretamente para o comentário ou resposta específica.',
    docs_chromeExtension_039: 'Análise de discussão e perspectivas da comunidade',
    docs_chromeExtension_040: 'NutEgg analisa comentários públicos em YouTube, Reddit, Twitter/X, Zhihu e fóruns:',
    docs_chromeExtension_041:
      '<strong>Detalhamento de tópicos e posturas</strong>: Resume os principais pontos de debate com emblemas de postura (concordo 👍, discordo 👎, misto 🤔, neutro ⚖️) e métricas de reação.',
    docs_chromeExtension_042:
      '<strong>Insights Extras</strong>: Comentários de alto valor contendo evidências, advertências ou experiências únicas são preservados como insights extras concisos.',
    docs_chromeExtension_043: 'Chrome-Somente Modo Autônomo (Não Obsidian Necessário)',
    docs_chromeExtension_044:
      'Não tem Obsidian instalado ou aberto no momento? NutEgg funciona de forma totalmente independente dentro do Google Chrome!',
    docs_chromeExtension_045: '⚡ Leitura rápida na Web sem sobrecarga de notas',
    docs_chromeExtension_046:
      'NutEgg foi projetado principalmente como um companheiro de leitura ultrarrápido na web. Você pode extrair, resumir, gerar mapas mentais e fazer perguntas sobre qualquer artigo ou vídeo YouTube diretamente em Chrome, sem nunca tocar no cofre de notas.',
    docs_chromeExtension_047: 'Recursos disponíveis em Chrome autônomo:',
    docs_chromeExtension_048:
      '<strong>🎯 Veredicto instantâneo anti-clickbait</strong>: Uma resposta objetiva de 1 frase à pergunta do título.',
    docs_chromeExtension_049:
      '<strong>📝 Resumo executivo de 3 frases</strong>: Conclusões de alta densidade extraídas de qualquer artigo ou vídeo longo.',
    docs_chromeExtension_050:
      '<strong>⏱️ Mapa mental com carimbos de data/hora clicáveis e busca</strong>: Vá para os principais segmentos de vídeo com um clique.',
    docs_chromeExtension_051:
      '<strong>💬 Perguntas e respostas do vídeo e salto de carimbo de data/hora</strong>: Faça perguntas e clique nos comprimidos de carimbo de data/hora citados para transferir a reprodução do vídeo diretamente para esse segmento.',
    docs_chromeExtension_052:
      '<strong>🧠 Mapas mentais dobráveis</strong>: Árvores de pensamento interativas de várias camadas que dividem visualmente as ideias principais.',
    docs_chromeExtension_053:
      '<strong>🌐 Suporte para mais de 50 idiomas</strong>: Extraia e traduza conteúdo em idioma estrangeiro instantaneamente.',
    docs_chromeExtension_054: 'Como configurar o modo somente Chrome:',
    docs_chromeExtension_055:
      'Clique com o botão direito no ícone de extensão <strong>NutEgg</strong> na barra de ferramentas Chrome e selecione <strong>Options</strong>.',
    docs_chromeExtension_056:
      'Selecione seu provedor de IA preferido (por exemplo, Google Gemini, OpenAI, Claude, DeepSeek ou OpenRouter) e insira sua chave API.',
    docs_chromeExtension_057: 'Clique em <strong>Salvar</strong>. Você está pronto para analisar qualquer página!',
    docs_chromeExtension_058: 'Obsidian Modos de conexão e execução de IA',
    docs_chromeExtension_059:
      'Quando você conecta a extensão Chrome ao plugin opcional NutEgg Obsidian, Chrome se adapta perfeitamente dependendo do modo de execução selecionado:',
    docs_chromeExtension_060: '🔒 Segurança da chave de API: as chaves nunca saem Chrome',
    docs_chromeExtension_061:
      'No <strong>Modo API conectado</strong>, suas chaves de API permanecem estritamente dentro do armazenamento de extensão seguro de Chrome. Obsidian gerencia modelos de conhecimento e indexação de cofre, mas delega a inferência de IA para Chrome por meio de um WebSocket local autenticado. Chrome faz a chamada da API do provedor localmente e retorna apenas o texto gerado.',
    docs_chromeExtension_062: 'Modo de execução',
    docs_chromeExtension_063: 'Onde a IA funciona',
    docs_chromeExtension_064: 'Credenciais usadas',
    docs_chromeExtension_065: '<strong>Chrome-Apenas</strong>',
    docs_chromeExtension_066: 'Diretamente dentro de Chrome',
    docs_chromeExtension_067: 'Chave API configurada em Chrome Opções',
    docs_chromeExtension_068: '<strong>Modo API conectado</strong>',
    docs_chromeExtension_069: 'Chrome (delegado via WebSocket local por Obsidian)',
    docs_chromeExtension_070: 'Chave API em Chrome (chaves nunca enviadas para Obsidian)',
    docs_chromeExtension_071: '<strong>Modo de assinatura compartilhada</strong>',
    docs_chromeExtension_072: 'Dentro de Obsidian (via CLI local ou ChatGPT OAuth)',
    docs_chromeExtension_073: 'Zero chaves de API (usa Codex, Claude Code, Antigravity ou ChatGPT)',
    docs_chromeExtension_074: 'Suporte multiperfil Chrome',
    docs_chromeExtension_075:
      'NutEgg suporta vários perfis de navegador Chrome (por exemplo, Pessoal e Trabalho) conectando-se simultaneamente ao mesmo cofre Obsidian. Cada perfil Chrome mantém seu próprio provedor, modelo e chave de API de forma independente. Conectar ou alternar modos de execução nunca vaza ou substitui chaves de API entre perfis.',
    docs_chromeExtension_076: 'Recuperação off-line e de desconexão',
    docs_chromeExtension_077:
      'Se Obsidian estiver fechado enquanto o modo conectado estiver ativado, NutEgg exibirá uma luz de status clara e fornecerá a opção <strong>"Usar o modo Chrome"</strong> com um clique. Isso permite que você continue lendo e fazendo perguntas imediatamente usando a configuração da API Chrome, sem interrupção ou risco de cota.',
    docs_chromeExtension_078: 'Configuração e sincronização ao vivo',
    docs_chromeExtension_079:
      'NutEgg inclui sincronização em tempo real entre as opções de extensão e os painéis laterais ativos:',
    docs_chromeExtension_080:
      '<strong>Controles de seção de conteúdo</strong>: Personalize quais seções são extraídas e analisadas por padrão (Conteúdo, Resumo, Mapa Mental, Perguntas e Respostas, Entradas de Conhecimento e Discussão) na página Opções.',
    docs_chromeExtension_081:
      '<strong>Sincronização de configurações ao vivo</strong>: Alterar seus modelos de análise, seções de saída habilitadas ou configurações do servidor atualiza imediatamente todos os painéis laterais abertos sem exigir uma atualização de página.',
    docs_chromeExtension_082:
      '<strong>Porta do servidor personalizado</strong>: Se a porta padrão <code>27123</code> entrar em conflito com outro serviço, abra a extensão <strong>Options</strong>, ajuste a porta (por exemplo, <code>28123</code>) e teste a conexão.',
    docs_index_001: 'Visão geral da documentação — NutEgg',
    docs_index_002: 'Chrome Loja Virtual ↗',
    docs_index_003: 'Obsidian Plug-in ↗',
    docs_index_004: '🎬 Vídeo promocional ↗',
    docs_index_005: 'GitHub Lançamentos',
    docs_index_006: 'Política de Privacidade',
    docs_index_007: 'Rastreador de problemas',
    docs_index_008: 'Visão geral e conceitos básicos',
    docs_index_009:
      'NutEgg é uma extensão Chrome gratuita e de código aberto que ajuda você a decidir o que vale a pena ler - e entendê-lo mais rapidamente. Ele fica no painel lateral do Chrome e funciona em artigos, tópicos e vídeos do YouTube. Um plugin Obsidian opcional transforma o que você lê em um cofre de conhecimento crescente.',
    docs_index_010: 'O que você ganha em Chrome',
    docs_index_011:
      'Instale a extensão, insira sua chave da API AI (ou aponte-a para um modelo local) em Opções e NutEgg funciona imediatamente – sem conta, sem aplicativos extras:',
    docs_index_012: '🎯 Veredicto instantâneo do título anti-clickbait',
    docs_index_013: '📝 Resumo executivo de 3 frases e conclusões principais',
    docs_index_014: '🧠 Mapas mentais hierárquicos recolhíveis, com carimbos de data e hora clicáveis para YouTube',
    docs_index_015:
      '💬 Perguntas e respostas em linguagem natural com pílulas de carimbo de data/hora citadas e links de fontes na página',
    docs_index_016:
      '🔍 Perguntas de escopo duplo: estritamente dentro da página ou além dela para verificação de fatos',
    docs_index_017: '🗣️ Resumos da seção de comentários para YouTube, Reddit e fóruns',
    docs_index_018: '🌐 Extração e tradução de várias fontes em mais de 50 idiomas',
    docs_index_019: '💡 Por que NutEgg existe',
    docs_index_020:
      'Grande parte da web é composta por vídeos preenchidos, manchetes clickbait e artigos inflados por IA. NutEgg responde ao título antecipadamente e diz honestamente se o conteúdo vale o seu tempo - para que você só preste atenção onde vale a pena.',
    docs_index_021: 'Opcional: adicione Obsidian',
    docs_index_022:
      'Se você mantém anotações em Obsidian, instale o plugin complementar para conectar a extensão ao seu cofre (<code>127.0.0.1:27123</code>). Isso adiciona avaliação de novidades em dois estágios em relação às árvores de conhecimento <code>_index.md</code> do seu vault, síntese delta e arquivamento automático de notas em arquivos <code>nutegg/_raw/</code> e egg. Tudo em Chrome continua funcionando com ou sem ele.',
    docs_index_023: 'A metáfora',
    docs_index_024:
      'Com Obsidian conectado, NutEgg estrutura seu fluxo de informações usando uma metáfora simples de três partes:',
    docs_index_025:
      '<strong>🌰 O Nut (captura bruta)</strong>: A página da web bruta, tópico de tweet ou transcrição YouTube extraída do navegador. Nuts são arquivados intactos com metadados completos em <code>nutegg/_raw/</code> em seu cofre.',
    docs_index_026:
      '<strong>🥚 A Egg (Árvore do Conhecimento)</strong>: Uma nota Markdown viva e estruturada em seu cofre representando um domínio de conhecimento (por exemplo, <code>ai_architecture.md</code>, <code>invest_strategy.md</code>).',
    docs_index_027:
      '<strong>🐣 A Escotilha (Síntese e Delta)</strong>: Quando o conteúdo é analisado, a IA compara-o com o seu eggs, identifica o que é novo em comparação com o que já está documentado e tece novos insights em seu egg.',
    docs_index_028: 'Arquitetura do sistema',
    docs_index_029: 'NutEgg possui um componente principal e um complemento opcional:',
    docs_index_030:
      '<strong>Chrome Extensão</strong>: Fica no painel lateral de Chrome. Extrai texto, comentários e transcrições de vídeo. No modo autônomo ou no modo API conectado, ele executa chamadas de IA localmente usando seu provedor configurado e a chave de API, garantindo que suas chaves de API nunca saiam do navegador.',
    docs_index_031:
      '<strong>Obsidian Plugin (opcional)</strong>: Executa um serviço de sincronização e coordenador local em <code>127.0.0.1:27123</code>. Lê o <code>_index.md</code> do seu vault, gerencia modelos de prompt em <code>_workflow/</code> e arquiva o conhecimento capturado em disco. Suporta: <ul> <li> <strong>Modo API conectado (padrão)</strong>: Coordena a correspondência de conhecimento, delegando inferência de IA para Chrome por meio de um WebSocket local autenticado (chaves nunca enviadas para Obsidian). </li> <li> <strong>Modo de assinatura compartilhada</strong>: Executa inferência localmente por meio de login do ChatGPT (OAuth) ou ferramentas CLI do desenvolvedor (Codex, Claude Código, Antigravidade) sem necessidade de nenhuma chave de API. </li> </ul>',
    docs_index_032:
      '<code>Chrome Extension (Side Panel)\n │\n ├── [Standalone Mode] Local AI Processing (Verdicts, Summaries, Mind Maps, Q&amp;A)\n │\n └── [Connected Mode] HTTP + WebSocket (127.0.0.1:27123/execution/socket)\n         │\n         ▼\n Obsidian Plugin (Local Server &amp; Coordinator)\n         ├── Evaluates against vault/nutegg/_index.md &amp; prompts in _workflow/\n         ├── In API Mode: Delegates AI calls back to Chrome over WebSocket (keys stay in Chrome)\n         ├── In Subscription Mode: Executes locally via CLI (Codex/Claude/agy) or ChatGPT OAuth\n         └── Writes structured notes to vault/nutegg/_raw/ and &lt;egg&gt;.md</code>',
    docs_index_033: 'Roteiro de início rápido',
    docs_index_034:
      'Assista ao <a href="https://www.youtube.com/watch?v=_u6mDoHZSAo" target="_blank" rel="noopener"\n              >🎬 NutEgg Vídeo Promocional</a\n            > para um passo a passo visual de 1 minuto.',
    docs_index_035:
      'Instale a <a\n              href="https://chromewebstore.google.com/detail/nutegg/bmdmdiicembobejibggoeiahaonphcol"\n              target="_blank"\n              rel="noopener"\n              >Chrome Extension</a\n            > da Chrome Web Store e adicione sua chave AI em Opções (consulte <a href="chrome-extension.html">guide</a>).',
    docs_index_036:
      'Abra o painel lateral de qualquer artigo ou vídeo YouTube e clique em <strong>Analyze</strong>. É isso!',
    docs_index_037:
      '<em>Opcional:</em> Instale o <a href="https://community.obsidian.md/plugins/nutegg" target="_blank" rel="noopener">Obsidian Plugin</a> (consulte <a href="obsidian-plugin.html">guide</a>) e defina seus primeiros tópicos de conhecimento em <a href="knowledge-structuring.html">_index.md</a> para iniciar a eclosão.',
    docs_knowledgeStructuring_001: 'Estruturação do conhecimento e Eggs — NutEgg',
    docs_knowledgeStructuring_002: 'Chrome Loja Virtual ↗',
    docs_knowledgeStructuring_003: 'Obsidian Plug-in ↗',
    docs_knowledgeStructuring_004: 'Lançamentos',
    docs_knowledgeStructuring_005: 'Política de Privacidade',
    docs_knowledgeStructuring_006: 'Estruturação do conhecimento e Eggs',
    docs_knowledgeStructuring_007:
      'Aprenda como NutEgg organiza seu cofre Obsidian, combina conteúdo da web com tópicos usando <code>_index.md</code> e mescla entradas acumuladas em árvores de conhecimento.',
    docs_knowledgeStructuring_008: 'O layout do cofre <code>nutegg/</code>',
    docs_knowledgeStructuring_009:
      'Todo o conteúdo NutEgg está confinado a uma pasta <code>nutegg/</code> limpa e isolada em seu cofre Obsidian:',
    docs_knowledgeStructuring_010:
      '<code>vault/\n└── nutegg/\n    ├── _raw/                          # Captured nuts (raw web content + metadata)\n    │   └── 2026-09-06-14-30-youtube-author-title.md\n    ├── _index.md                      # Topic routing guide\n    ├── ai_architecture.md             # Knowledge egg\n    ├── invest_strategy.md             # Knowledge egg\n    └── productivity.md                # Knowledge egg</code>',
    docs_knowledgeStructuring_011: 'O Guia de Roteamento: <code>_index.md</code>',
    docs_knowledgeStructuring_012:
      'O arquivo <code>_index.md</code> informa ao NutEgg quais notas egg você mantém e quais domínios elas cobrem. Cada linha mapeia um caminho de arquivo relativo para palavras-chave e descrições:',
    docs_knowledgeStructuring_013:
      '<code>nutegg/ai_architecture.md: LLMs, multi-agent systems, prompt engineering, RAG, embeddings\nnutegg/invest_strategy.md: value investing, index funds, asset allocation, macroeconomic indicators\nnutegg/productivity.md: deep work, time blocking, habits, personal knowledge management</code>',
    docs_knowledgeStructuring_014: '⚡ Como funciona o roteamento',
    docs_knowledgeStructuring_015:
      'Quando você clica em <strong>Analyze</strong> no navegador, a IA de NutEgg lê seu <code>_index.md</code> e determina qual egg (se houver) corresponde ao conteúdo. Se nenhum egg existente corresponder, NutEgg se oferece para criar automaticamente um novo egg propagado a partir do tópico da página!',
    docs_knowledgeStructuring_016: 'Egg Anatomia do arquivo e como funcionam as instruções',
    docs_knowledgeStructuring_017:
      'Um arquivo <strong>Egg</strong> (armazenado em <code>nutegg/*.md</code>) desempenha duas funções cruciais: é seu repositório de conhecimento curado e em evolução para um domínio e uma especificação de prompt ativa que orienta o pipeline de IA de NutEgg sempre que o conteúdo aborda esse tópico.',
    docs_knowledgeStructuring_018: '1. Projeto Estrutural',
    docs_knowledgeStructuring_019:
      'Cada arquivo egg combina metadados YAML, um bloco de texto explicativo Obsidian com instruções, uma árvore de conhecimento com curadoria e um buffer de teste não processado:',
    docs_knowledgeStructuring_020:
      '<code>---\ntopic: "AI Architecture & Multi-Agent Systems"\nstatus: "active"\nlast_updated: "2026-09-10"\n---\n\n> [!abstract]- Instructions:\n> **Scope:** Multi-agent architectures, tool calling, memory layers, and LLM evaluation.\n> **Action Guide:** Focus on actionable design patterns, scalability tradeoffs, and real failure modes.\n> **Key Questions:**\n> 1. How are agent memory loops bounded to prevent context window overflow?\n> 2. What coordination mechanism is used between subagents?\n> **Worth Reading If:**\n&gt; - Practical examples and substantive explanations.\n&gt; **Skip If:**\n> - Ignore basic beginner tutorials or high-level sales pitches without technical substance.\n> - Discard speculative claims lacking empirical benchmarks or code evidence.\n> **Formatting Rules:**\n> - Prefix each insight with a bracketed tag: `[concept]`, `[architecture]`, `[method]`, `[benchmark]`, `[explain]`, `[fact]`, `[example]`.\n> - Use the structure: `- [tag] **Concept Name**` followed by an indented explanation and concrete examples (`- 🎯 Example:`).\n\n# Knowledge\n## Agent Memory\n- [architecture] **Bounded Replay Buffers**\n    - Ephemeral short-term memory expires after session goals terminate to conserve token budget.\n    - 🎯 Example: Tool calling trace logs stored in vector stores with sliding window eviction.\n\n# Unprocessed\n(Newly hatched insights land here from captures until auto-merged)</code>',
    docs_knowledgeStructuring_021: '2. Como escrever Egg instruções',
    docs_knowledgeStructuring_022:
      'A chamada <code>&gt; [!abstract]- Instructions:</code> contém seis campos especializados. Cada um orienta um estágio específico do pipeline de IA:',
    docs_knowledgeStructuring_023: 'Campo',
    docs_knowledgeStructuring_024: 'Objetivo e melhores práticas',
    docs_knowledgeStructuring_025: 'Uso do fluxo de trabalho',
    docs_knowledgeStructuring_026: '<code>**Scope:**</code>',
    docs_knowledgeStructuring_027:
      '1–2 frases definindo os limites do tópico deste egg. Indique explicitamente quais conceitos, tecnologias ou questões estão incluídos ou excluídos.',
    docs_knowledgeStructuring_028:
      'Injetado em <code>egg-analysis.md</code> (Estágio 2) para que a IA extraia conhecimento estritamente através desta lente de domínio.',
    docs_knowledgeStructuring_029: '<code>**Action Guide:**</code>',
    docs_knowledgeStructuring_030:
      'Instruções de 1 a 5 etapas sobre como a IA resume e avalia o conteúdo (por exemplo, solicitando perspectivas, profundidade ou compensações específicas). Volta ao guia padrão se omitido.',
    docs_knowledgeStructuring_031: 'Injetado em <code>egg-analysis.md</code> (Estágio 2).',
    docs_knowledgeStructuring_032: '<code>**Key Questions:**</code>',
    docs_knowledgeStructuring_033:
      'Lista numerada de perguntas recorrentes que você deseja responder sempre que o conteúdo atinge este domínio (por exemplo, <em>"Qual é o custo do token?"</em>, <em>"Quais são os modos de falha?"</em>).',
    docs_knowledgeStructuring_034:
      'Injetado em <code>egg-analysis.md</code> (Estágio 2). Respondido no pop-up da extensão Chrome e salvo em suas notas de captura brutas.',
    docs_knowledgeStructuring_035: '<code>**Worth Reading If:** / **Skip If:**</code>',
    docs_knowledgeStructuring_036:
      'Duas listas de preferências que descrevem quando o original merece seu tempo e quando o resumo é suficiente.',
    docs_knowledgeStructuring_037:
      'Oriente a ação de leitura do Estágio 2: completa, destaques, resumo, pulada ou incerta. Eles nunca rejeitam entradas durante a mesclagem.',
    docs_knowledgeStructuring_038: '<code>**Formatting Rules:**</code>',
    docs_knowledgeStructuring_039:
      'Padrões de formatação: tags entre colchetes (<code>[concept]</code>, <code>[architecture]</code>, <code>[method]</code>, etc.) e recuo hierárquico de marcadores.',
    docs_knowledgeStructuring_040:
      'Injetado em <code>egg-analysis.md</code> (Estágio 2). Garante que as entradas dos candidatos correspondam às convenções de formatação das suas notas.',
    docs_knowledgeStructuring_041: '3. Árvore de conhecimento selecionada versus fila não processada',
    docs_knowledgeStructuring_042:
      'NutEgg protege sua base de conhecimento da poluição da IA, separando o conhecimento selecionado de novas capturas:',
    docs_knowledgeStructuring_043:
      '<strong><code># Knowledge</code> (Árvore com curadoria):</strong> Estruturado com títulos Markdown e marcadores aninhados. Apenas a mesclagem lê esta árvore, consolidando afirmações equivalentes enquanto preserva exemplos, advertências, divergências e fontes distintas. O estágio 2 segue as instruções sem comparar com a árvore.',
    docs_knowledgeStructuring_044:
      '<strong><code># Unprocessed</code> (Fila de teste):</strong> Quando você clica em <strong>🥚 Hachura Egg</strong> no navegador, as entradas aprovadas e as respostas suportadas são anexadas com segurança a <code># Unprocessed</code> em vez de tocar diretamente na hierarquia selecionada.',
    docs_knowledgeStructuring_045: '4. Como cada peça é usada no fluxo de trabalho',
    docs_knowledgeStructuring_046:
      'Veja como o conteúdo da web flui através de suas instruções egg desde a captura inicial até a síntese final:',
    docs_knowledgeStructuring_047:
      '<code>[Captured Web Content]\n          │\nStage 1   ▼   _index.md (Topic routing guide)\n─────────────────────────────────────────────────────────────\n• Uses content-task-default.md\n• Generates Title Verdict, 3-Bullet Summary, Mind Map\n• egg-routing.md matches target eggs via Stage 1 summary\n          │\n          ▼\nUser Review: Confirm or select target eggs in popup\n          │\nStage 2   ▼   Target Egg File (nutegg/*.md)\n─────────────────────────────────────────────────────────────\n• Scope, Key Questions, Formatting Rules ──► egg-analysis.md\n  (Extracts candidate knowledge entries and answers questions)\n• Worth Reading If / Skip If guide the reading recommendation\n  (Full, highlights, summary, skip, or uncertain; no tree comparison)\n          │\n          ▼\nHatch Egg: Approved entries and supported answers appended to # Unprocessed\n          │\nMerge Cycle (20+ entries or manual button)\n─────────────────────────────────────────────────────────────\n• merge-unprocessed.md nests and integrates entries into # Knowledge</code>',
    docs_knowledgeStructuring_048: 'Conhecimento de mesclagem automática',
    docs_knowledgeStructuring_049:
      'Quando 20 ou mais entradas se acumulam em <code># Unprocessed</code> (ou quando você clica em <strong>Merge</strong> no widget de visualização de leitura Obsidian), a IA de NutEgg executa uma síntese automatizada de plano de fundo usando <code>merge-unprocessed.md</code>. Ele categoriza, desduplica e aninha entradas pendentes nos conceitos pai apropriados em <code># Knowledge</code>, mantendo seu gráfico de conhecimento perpetuamente organizado.',
    docs_obsidianPlugin_001: 'Guia do plug-in do Obsidian — NutEgg',
    docs_obsidianPlugin_002: 'Obsidian Plug-in da comunidade ↗',
    docs_obsidianPlugin_003: 'Chrome Loja Virtual ↗',
    docs_obsidianPlugin_004: 'Lançamentos de plug-ins',
    docs_obsidianPlugin_005: 'Política de Privacidade',
    docs_obsidianPlugin_006: 'Instalação e configuração do plug-in do Obsidian',
    docs_obsidianPlugin_007:
      'O plug-in NutEgg Obsidian hospeda o servidor de sincronização local, gerencia a comunicação de IA, combina o conteúdo recebido com suas árvores de conhecimento e mantém seus arquivos do vault.',
    docs_obsidianPlugin_008: 'Instalação',
    docs_obsidianPlugin_009: 'Opção 1: Obsidian Plug-ins da comunidade (recomendado)',
    docs_obsidianPlugin_010: 'NutEgg está oficialmente listado no diretório Obsidian Community Plugins:',
    docs_obsidianPlugin_011: 'Em Obsidian, abra <strong>Configurações → Plug-ins da comunidade</strong>.',
    docs_obsidianPlugin_012:
      'Certifique-se de que <strong>Modo restrito</strong> esteja desligado e clique em <strong>Navegar</strong>.',
    docs_obsidianPlugin_013:
      'Pesquise <strong>NutEgg</strong> (ou visite <a href="https://community.obsidian.md/plugins/nutegg" target="_blank" rel="noopener"\n              >NutEgg em Obsidian Community Plugins</a\n            >).',
    docs_obsidianPlugin_014: 'Clique em <strong>Instalar</strong> e, em seguida, clique em <strong>Ativar</strong>.',
    docs_obsidianPlugin_015: 'Opção 2: instalação manual',
    docs_obsidianPlugin_016:
      'Baixe <code>main.js</code>, <code>manifest.json</code> e <code>styles.css</code> das versões de plug-in <a href="https://github.com/staff-000/nutegg-obsidian-release/releases" target="_blank" rel="noopener"\n              >NutEgg Obsidian</a\n            >.',
    docs_obsidianPlugin_017:
      'No seu cofre Obsidian, abra <code>.obsidian/plugins/</code> (mostre pastas ocultas em seu sistema operacional, se necessário).',
    docs_obsidianPlugin_018:
      'Crie um novo diretório chamado <code>nutegg</code> e coloque os três arquivos dentro: <pre><code>your-vault/.obsidian/plugins/nutegg/\n├── main.js\n├── manifest.json\n└── styles.css</code></pre>',
    docs_obsidianPlugin_019:
      'Em Obsidian, abra <strong>Configurações → Plug-ins da comunidade</strong>, clique em <strong>Recarregar</strong> e ative <strong>NutEgg</strong>.',
    docs_obsidianPlugin_020: 'Opção 3: usando BRAT',
    docs_obsidianPlugin_021:
      'Instale o plugin da comunidade <a href="https://github.com/tfthacker/obsidian42-brat" target="_blank" rel="noopener">BRAT</a> em Obsidian.',
    docs_obsidianPlugin_022: 'Vá para <strong>Configurações → BRAT → Adicionar plugin Beta</strong>.',
    docs_obsidianPlugin_023:
      'Digite <code>staff-000/nutegg-obsidian-release</code> e clique em <strong>Adicionar Plugin</strong>.',
    docs_obsidianPlugin_024: 'Habilite NutEgg uma vez instalado.',
    docs_obsidianPlugin_025: 'Arquitetura de execução de IA',
    docs_obsidianPlugin_026:
      'NutEgg usa uma arquitetura inteligente de execução dupla (Protocolo 3) que oferece total flexibilidade entre a privacidade de trazer sua própria chave de API e a conveniência de assinatura sem chave:',
    docs_obsidianPlugin_027: '🔒 Invariante de privacidade central: as chaves de API nunca saem Chrome',
    docs_obsidianPlugin_028:
      'No <strong>Modo API conectado</strong>, Obsidian orquestra operações de vault, prompt assembly e egg indexação, mas <strong>delega todas as chamadas de IA de volta para Chrome</strong> por meio de um WebSocket local autenticado. Chrome executa a chamada usando sua chave de API armazenada localmente. Suas chaves de API nunca são transmitidas para Obsidian, nunca são gravadas em notas do Vault e nunca saem do navegador.',
    docs_obsidianPlugin_029:
      '<code>┌─────────────────────────────────────────────────────────────────────────────┐\n│                           CONNECTED API MODE (Default)                      │\n│                                                                             │\n│  Chrome Profile A ──(1) HTTP /analyze /confirm──►  Obsidian Plugin          │\n│  (Holds API Key A)                                 (127.0.0.1:27123)        │\n│                                                            │                │\n│                   ◄─(2) WebSocket AI Call /socket──────────┤ Reads _index.md│\n│  Calls Provider A                                          │ Assembles prompt│\n│  (OpenAI / Claude / Gemini / DeepSeek)                     │                │\n│                   ──(3) Authenticated Result─────────────► │                │\n│                                                            ▼                │\n│  Receives Final Result ◄──────(4) HTTP Result────── Saves to Vault          │\n│                                                     (_raw/ & &lt;egg&gt;.md)      │\n└─────────────────────────────────────────────────────────────────────────────┘\n\n┌─────────────────────────────────────────────────────────────────────────────┐\n│                       SHARED SUBSCRIPTION MODE (Zero API Keys)              │\n│                                                                             │\n│  Chrome Profile A ────┐                                                     │\n│                       ├──► Obsidian Plugin (127.0.0.1:27123)                │\n│  Chrome Profile B ────┘        │                                            │\n│                                ▼                                            │\n│                       SubscriptionService (Local CLI or OAuth)              │\n│                       ├── ChatGPT Sign-In (OpenAI Responses API)            │\n│                       ├── Codex CLI (@openai/codex)                         │\n│                       ├── Claude Code CLI (claude auth login)               │\n│                       └── Google Gemini (Antigravity CLI: agy)              │\n└─────────────────────────────────────────────────────────────────────────────┘</code>',
    docs_obsidianPlugin_030: 'Modo 1: Modo API conectado (padrão)',
    docs_obsidianPlugin_031:
      'Neste modo, você configura seu provedor de IA e chave de API diretamente em <strong>Chrome Opções de extensão</strong>. Obsidian coordena o fluxo de trabalho de conhecimento enquanto Chrome atua como o executor local seguro de IA.',
    docs_obsidianPlugin_032:
      '<strong>Provedores de nuvem suportados</strong>: Anthropic (Claude 3.5 Sonnet, Claude 3.7 Sonnet), OpenAI (GPT-4o, série o), Google Gemini (2.0 Flash, 2.5 Pro), DeepSeek (V3, R1), Kimi, Qwen, Zhipu e OpenRouter.',
    docs_obsidianPlugin_033:
      '<strong>Local LLMs (Ollama, LM Studio, llama.cpp, vLLM)</strong>: Configure endpoints locais diretamente em Chrome. NutEgg conecta-se ao seu modelo local sem enviar dados para fora da sua máquina.',
    docs_obsidianPlugin_034:
      '<strong>Perfis Chrome independentes</strong>: Se você usar vários perfis Chrome (por exemplo, Trabalho e Pessoal), cada perfil poderá usar seu próprio provedor, modelo e chave de API. Eles se conectam ao mesmo cofre Obsidian sem colisões de teclas.',
    docs_obsidianPlugin_035:
      '<strong>Obsidian-Ações nativas</strong>: Tarefas de manutenção somente do Vault (como a fusão manual de egg em Obsidian) usam configurações nativas armazenadas com segurança em Obsidian de <code>SecretStorage</code>. Clicar em <strong>Salvar e continuar</strong> em um perfil Chrome conectado atualiza com segurança a conta nativa no SecretStorage.',
    docs_obsidianPlugin_036: 'Modo 2: modo de assinatura compartilhada e login no ChatGPT',
    docs_obsidianPlugin_037:
      'Não deseja gerenciar chaves de API ou créditos de pagamento por token? NutEgg suporta login direto e assinaturas CLI de desenvolvedor local gerenciadas dentro de Obsidian:',
    docs_obsidianPlugin_038: 'Opção A: login direto no ChatGPT (sem necessidade de CLI)',
    docs_obsidianPlugin_039: 'Em Obsidian, abra <strong>Configurações → NutEgg</strong>.',
    docs_obsidianPlugin_040: 'Em <strong>Conexão AI</strong>, selecione <strong>Login do ChatGPT</strong>.',
    docs_obsidianPlugin_041:
      'Clique em <strong>Continuar com ChatGPT</strong>, conclua o fluxo de autorização do navegador e permita o uso do plano.',
    docs_obsidianPlugin_042: 'Escolha o modelo da sua conta (por exemplo, <code>gpt-4o</code>).',
    docs_obsidianPlugin_043:
      'Todos os perfis Chrome conectados seguem imediatamente esta conexão com zero configuração de chave de API. As credenciais permanecem seguras no armazenamento de chaves do sistema operacional por instalação e nunca são enviadas para Chrome ou armazenadas em arquivos do vault.',
    docs_obsidianPlugin_044: 'Opção B: Assinaturas CLI locais (Codex, Claude, Gemini)',
    docs_obsidianPlugin_045:
      'NutEgg pode executar ferramentas CLI oficiais do desenvolvedor já instaladas e logadas em sua máquina:',
    docs_obsidianPlugin_046: 'Provedor',
    docs_obsidianPlugin_047: 'Instalação CLI',
    docs_obsidianPlugin_048: 'Autenticação',
    docs_obsidianPlugin_049: 'Descoberta de modelo',
    docs_obsidianPlugin_050: '<strong>Codex CLI</strong>',
    docs_obsidianPlugin_051: '<code>npm install -g @openai/codex</code>',
    docs_obsidianPlugin_052: '<code>codex login</code>',
    docs_obsidianPlugin_053: 'Automático via servidor de aplicativos',
    docs_obsidianPlugin_054: '<strong>Antrópico Claude</strong>',
    docs_obsidianPlugin_055:
      '<a href="https://code.claude.com/docs/en/quickstart" target="_blank" rel="noopener">Claude Código</a>',
    docs_obsidianPlugin_056: '<code>claude auth login --claudeai</code>',
    docs_obsidianPlugin_057: 'Soneto, Opus, Haiku ou ID personalizado',
    docs_obsidianPlugin_058: '<strong>Google Gemini</strong>',
    docs_obsidianPlugin_059:
      '<a href="https://antigravity.google/docs/cli/install" target="_blank" rel="noopener">CLI antigravidade</a>',
    docs_obsidianPlugin_060: '<code>agy</code> fluxo do navegador',
    docs_obsidianPlugin_061: 'Automático via <code>agy models</code>',
    docs_obsidianPlugin_062:
      'Em Obsidian Configurações → NutEgg, basta selecionar sua CLI em <strong>AI connection</strong>. O <code>SubscriptionService</code> interno do NutEgg executa inferência em uma fila serial limitada localmente. Nenhum servidor bridge separado ou porta 27124 é necessário.',
    docs_obsidianPlugin_063: 'Servidor de sincronização local e segurança',
    docs_obsidianPlugin_064:
      'Quando o plug-in está ativado, ele inicializa automaticamente um ouvinte HTTP e WebSocket em segundo plano em <code>127.0.0.1:27123</code>.',
    docs_obsidianPlugin_065: '🔒 Privacidade e segurança de origem',
    docs_obsidianPlugin_066:
      'O servidor local se liga estritamente ao endereço de loopback do host local (<code>127.0.0.1</code>). Ele impõe validação estrita de <code>X-NutEgg-Extension-Origin</code> e token, evitando que páginas da web comuns acessem seu cofre. As conexões WebSocket são autenticadas no primeiro quadro.',
    docs_obsidianPlugin_067: 'Personalização de fluxo de trabalho e prompt',
    docs_obsidianPlugin_068:
      'NutEgg potencializa sua análise de IA por meio de prompts Markdown modulares e editáveis, armazenados diretamente em seu cofre em <code>nutegg/_workflow/</code>:',
    docs_obsidianPlugin_069:
      '<strong>Modelos editáveis</strong>: personalize prompts para análise de conteúdo, egg comparação, roteamento e acompanhamento.',
    docs_obsidianPlugin_070:
      '<strong>Atualizações Não Destrutivas</strong>: Quando NutEgg lança modelos de prompt atualizados, seus fluxos de trabalho personalizados são preservados automaticamente sem serem substituídos.',
    docs_workflow_001: 'Fluxos de trabalho e mecanismo de prompts de IA — NutEgg',
    docs_workflow_002: 'Chrome Loja Virtual ↗',
    docs_workflow_003: 'Obsidian Plug-in ↗',
    docs_workflow_004: 'Lançamentos',
    docs_workflow_005: 'Política de Privacidade',
    docs_workflow_006: 'Fluxos de trabalho e mecanismo de prompts de IA',
    docs_workflow_007:
      'Saiba como o mecanismo de fluxo de trabalho modular do NutEgg orquestra a extração de conteúdo, roteamento egg baseado em resumo, análise orientada por instruções e prompts personalizáveis pelo usuário.',
    docs_workflow_008: 'A arquitetura de dois estágios',
    docs_workflow_009:
      'Em vez de executar um único prompt monolítico, NutEgg usa uma <strong>Arquitetura de dois estágios</strong> projetada para eficiência de token, alta precisão de extração e controle completo do usuário:',
    docs_workflow_010:
      '<code>                    ┌───────────────────────────────┐\n                    │      Captured Web Content     │\n                    │   (Article / YouTube / Tweet) │\n                    └───────────────┬───────────────┘\n                                    │\n                                    ▼\n       ===========================================================\n       STAGE 1: Content & Discussion Analysis + Egg Routing\n       ===========================================================\n            │                                             │\n            ├─► Content Analysis                          ├─► Discussion Analysis\n            │   (Is content >30k chars?)                  │   (When 💬 Discussion enabled\n            │    ├── No  ──► [content-analysis.md]        │    & comments captured)\n            │    └── Yes ──► Chunks + [aggregate-         │    ├── [discussion-analysis.md]\n            │                content.md]                  │    └── [aggregate-discussion.md]\n            │                                             │\n            └──────────────────────┬──────────────────────┘\n                                   │\n                                   ▼\n        Produces: Title Verdict, 3-Bullet Summary, Mind Map,\n        Timestamped Q&A, and Discussion Topics/Stances\n                                   │\n                                   ▼\n                          [egg-routing.md]\n          (Routes matched eggs from _index.md using the\n           concise Stage 1 summary instead of raw content)\n                                    │\n                                    ▼\n       ===========================================================\n       INTERACTIVE CHOICE / EXECUTION MODE (Chrome Extension)\n       ===========================================================\n                                    │\n                        Which mode is selected?\n                                    │\n            ┌───────────────────────┼───────────────────────┐\n            ▼                       ▼                       ▼\n     [Standalone Mode]         [🌞 Full Mode]      [🌛 Preview Summary]\n     Obsidian is offline.      Auto-proceeds to    User reviews matched eggs:\n     Runs Stage 1 in Chrome    Stage 2 with all    ├── "Collect Nut Only"\n     with user\'s API key.      matched eggs.       └── Add/remove eggs ──► Proceed\n     (Fast reading & Q&A)           │                       │\n            │                       └───────────┬───────────┘\n            ▼                                   ▼\n    Results in Side Panel      ===========================================================\n    (No Stage 2 analysis)    STAGE 2: Per-Egg Instruction-Driven Analysis\n                               ===========================================================\n                                                │\n                                   For each confirmed egg (1 or N):\n                                                │\n                                                ▼\n                                        [egg-analysis.md]\n                                  (Extract candidate knowledge entries\n                                   & key questions scoped to this egg)\n                                                │\n                                                ▼\n                                  (Answers + extracted entries + reading action)\n                                                │\n                                                ▼\n                                     Results returned to Popup\n                                     (Ready to Save Nut & Eggs)</code>',
    docs_workflow_011: '💡 Por que roteamento baseado em resumo?',
    docs_workflow_012:
      'O roteamento eggs usando o resumo do Estágio 1 em vez de artigos brutos completos ou transcrições de vídeo de várias horas economiza dezenas de milhares de tokens por execução e melhora a precisão do roteamento, concentrando-se em temas semânticos destilados e de alto sinal.',
    docs_workflow_013:
      'O indicador de tabela cruzada do painel lateral mostra análises em execução e resultados concluídos não lidos na janela Chrome atual. Clique nele para listar as guias e ir diretamente para seus resultados ou progresso. Os resultados tornam-se lidos quando sua análise estiver visível na guia ativa. O rastreamento dura enquanto o painel permanece aberto e é reiniciado quando ele fecha.',
    docs_workflow_014:
      'A Hatch arquiva a análise original e anexa as entradas aprovadas a <code># Unprocessed</code>. A mesclagem é executada em 20 entradas pendentes ou sob demanda para reunir fragmentos e desduplicar reivindicações, preservando fontes, advertências, exemplos e divergências. A Etapa 2 nunca recebe a árvore do Conhecimento, portanto a recomendação avalia a relevância e a substância em vez da novidade.',
    docs_workflow_015:
      'A opção da seção <strong>🍃 Conhecimento</strong> e o menu suspenso Egg Análise compartilham uma configuração para a guia atual do navegador: <strong>🥚 Somente análise</strong> desativa o Conhecimento e <strong>🍃 Incluir conhecimento</strong> o ativa. Alternar as opções suspensas atualiza a configuração e o rótulo do botão sem acionar automaticamente uma chamada de IA – clique no botão para analisar. Ao mudar para Incluir conhecimento para um egg analisado anteriormente sem entradas de conhecimento, NutEgg executa novamente o Estágio 2 em vez de simplesmente mostrar o resultado somente de resposta armazenado em cache. Incluir conhecimento é o padrão inicial; sua última escolha se torna o padrão para guias sem análise. Desativar a opção não oculta as entradas geradas anteriormente nem evita salvá-las. Desativar o Knowledge desativa as entradas para cada egg selecionado. Ativá-lo permite entradas apenas para eggs que permitem: <code>Generate Knowledge Entries: no</code> ou uma opção de exclusão no Guia de Ação de egg tem prioridade. As principais respostas e recomendações de leitura permanecem disponíveis de qualquer maneira. A análise não salva entradas; <strong>🐣 Hachura Egg</strong> salva as entradas geradas em arquivos egg.',
    docs_workflow_016: 'Modos de fluxo de trabalho',
    docs_workflow_017: 'Modo',
    docs_workflow_018: 'Comportamento',
    docs_workflow_019: 'Melhor usado para',
    docs_workflow_020: '<strong>📱 Modo autônomo</strong>',
    docs_workflow_021:
      'Executa a análise de conteúdo do Estágio 1 diretamente em Chrome (quando Obsidian está offline ou fechado). Produz veredictos, resumos de 3 frases, mapas mentais com carimbos de data/hora clicáveis ​​e perguntas e respostas em vídeo interativo com salto de carimbo de data/hora. Ignora a análise do Estágio 2 egg.',
    docs_workflow_022:
      'Leitura rápida da web e de vídeos, compreensão rápida ou quando você não precisa de arquivamento de notas.',
    docs_workflow_023: '<strong>🌞 Modo Completo</strong>',
    docs_workflow_024:
      'Executa a análise de conteúdo do Estágio 1, roteia eggs automaticamente via <code>_index.md</code> e executa imediatamente a análise do Estágio 2 egg em uma passagem ininterrupta.',
    docs_workflow_025: 'Leitura diária e capturas rápidas quando você confia na correspondência egg automática.',
    docs_workflow_026: '<strong>🌛 Resumo de visualização</strong>',
    docs_workflow_027:
      'Executa a análise de conteúdo do Estágio 1 e faz uma pausa no pop-up. Mostra a correspondência eggs ao lado da lista egg completa do seu cofre. Você pode adicionar/remover eggs, prosseguir com a comparação de conhecimento ou clicar em <strong>Coletar Nut Somente</strong>.',
    docs_workflow_028:
      'Pesquisa profunda, tópicos ambíguos ou quando você deseja apenas um resumo rápido sem atualizar egg árvores de conhecimento.',
    docs_workflow_029: 'Execução de IA e protocolo de credenciais',
    docs_workflow_030:
      'Independentemente de você escolher Modo completo ou Resumo de visualização, NutEgg separa <em>orquestração de fluxo de trabalho</em> de <em>armazenamento de credenciais e inferência de IA</em>:',
    docs_workflow_031:
      '<strong>Modo API conectado (padrão)</strong>: Obsidian coordena injeção de modelo de prompt e comparação de conhecimento, mas envia solicitações de inferência para Chrome por meio de um WebSocket autenticado (<code>/execution/socket</code>). Chrome executa a chamada LLM com sua chave de API local e envia de volta o resultado autenticado. <strong>Sua chave de API nunca sai Chrome.</strong>',
    docs_workflow_032:
      '<strong>Modo de assinatura compartilhada</strong>: Obsidian coordena o fluxo de trabalho e executa diretamente chamadas de IA localmente usando ferramentas CLI oficiais do desenvolvedor (<code>codex</code>, <code>claude</code>, <code>agy</code>) ou login direto do ChatGPT OAuth. Todos os perfis Chrome conectados compartilham esta assinatura sem precisar de uma chave API.',
    docs_workflow_033: 'Arquivos de fluxo de trabalho em seu cofre',
    docs_workflow_034: 'NutEgg propaga seus modelos de prompt em <code>nutegg/_workflow/</code> dentro do seu vault:',
    docs_workflow_035: '1. Fragmentos compartilhados (injetados em outros prompts)',
    docs_workflow_036:
      '<code>shared-output-rules.md</code>: Diretiva de base (conteúdo fonte como única verdade) e regras de referência de idioma de saída multilíngue. Injetado como <code>{{shared_output_rules}}</code>.',
    docs_workflow_037:
      '<code>content-task-default.md</code>: Instruções básicas de tarefas para veredictos de títulos, resumos de três marcadores e mapas mentais com carimbos de data e hora clicáveis. Injetado como <code>{{content_task_default}}</code>.',
    docs_workflow_038: '2. Pipeline de captura e comparação de conteúdo',
    docs_workflow_039:
      '<code>content-analysis.md</code>: Resumo do conteúdo do estágio 1, veredicto anti-clickbait, mapa mental interativo com carimbos de data e hora clicáveis e respostas de perguntas personalizadas com citações de carimbo de data e hora.',
    docs_workflow_040:
      '<code>egg-routing.md</code>: Corresponde aos resumos do Estágio 1 com as descrições de egg em <code>_index.md</code> para selecionar o candidato eggs.',
    docs_workflow_041:
      '<code>egg-analysis.md</code>: Estágio 2 por-egg extração de entradas de conhecimento do candidato e respostas a perguntas-chave com escopo definido para as instruções de um egg.',
    docs_workflow_042:
      'Vale a pena ler se e pular se guiar leitura completa, destaques, resumo suficiente, pular ou incerto. Respostas úteis permanecem salváveis, independentemente da recomendação.',
    docs_workflow_043:
      '<code>aggregate-content.md</code> e <code>aggregate-egg.md</code>: agregação de conteúdo longo (&gt;30 mil caracteres). A Fase 2 combina apenas rascunhos de respostas, notas de recomendação e cobertura; as entradas extraídas permanecem na ordem de origem até a mesclagem.',
    docs_workflow_044: '3. Análise da Discussão (Etapa 1)',
    docs_workflow_045:
      'A análise de discussão é executada como parte da análise de conteúdo <strong>Estágio 1</strong> quando a seção <strong>💬 Discussão</strong> está habilitada em Opções de extensão ou seções de análise pop-up, e o extrator de página captura comentários do leitor ou respostas sociais (por exemplo, comentários YouTube, respostas do Twitter, Reddit/tópicos de fórum, comentários Bilibili ou Zhihu responde).',
    docs_workflow_046:
      '<code>discussion-analysis.md</code>: Analisa comentários em lotes para extrair de 3 a 5 tópicos principais de debate, classifica as posições dos comentaristas (<code>agree</code>, <code>disagree</code>, <code>mixed</code>, <code>neutral</code>, <code>unclear</code>) e destaca valiosos suplementos ou correções de experiência em primeira mão (<code>supplement: true</code>).',
    docs_workflow_047:
      '<code>aggregate-discussion.md</code>: Mescla e sintetiza tópicos e distribuições de postura em tópicos de comentários de vários lotes para grandes fóruns ou seções de comentários de vídeo.',
    docs_workflow_048:
      '<strong>Fluxo de contexto:</strong> Resumos de discussão analisados e itens de evidência são retornados no resultado do Estágio 1 e alimentados diretamente em perguntas e respostas personalizadas ou análise do corpo do fórum (crucial para páginas centradas em discussão ou vídeos sem transcrições). Eles também são encaminhados como sinais de contexto para o Estágio 2 <code>egg-analysis.md</code> para que eggs possa avaliar o feedback da comunidade juntamente com o conteúdo de origem.',
    docs_workflow_049: '4. Fluxos de trabalho interativos e de manutenção',
    docs_workflow_050:
      '<code>follow-up.md</code>: Perguntas e respostas interativas em linguagem natural no painel lateral com histórico de conversas anteriores e salto de carimbo de data/hora de vídeo clicável.',
    docs_workflow_051:
      '<code>merge-unprocessed.md</code>: Acionado manual ou automaticamente em mais de 20 entradas pendentes para organizar e aninhar itens brutos em <code># Knowledge</code>.',
    docs_workflow_052:
      '<code>localize-egg.md</code>: Traduz novos modelos egg para idiomas estrangeiros, preservando os títulos estruturais do inglês.',
    docs_workflow_053: 'Diretrizes de personalização segura',
    docs_workflow_054: '⚠️ O que preservar',
    docs_workflow_055:
      'Você pode personalizar o tom, a perspectiva e a profundidade do prompt. No entanto, você <strong>deve preservar</strong>:',
    docs_workflow_056:
      'Todas as tags <code>{{placeholder}}</code> (por exemplo, <code>{{content}}</code>, <code>{{knowledge_tree}}</code>, <code>{{title}}</code>).',
    docs_workflow_057:
      'Chaves de saída JSON exatas (por exemplo, <code>titleVerdict</code>, <code>extractedEntries</code>, <code>mindMap</code>) para que o analisador possa desserializar a resposta.',
    docs_workflow_058:
      'Os títulos estruturais (<code># Knowledge</code>, <code># Unprocessed</code>) nas saídas Markdown.',
    docs_workflow_059: 'Atualizações e redefinições sem conflitos',
    docs_workflow_060: 'Quando NutEgg atualiza para uma versão mais recente:',
    docs_workflow_061:
      '<strong>Prompts não editados</strong>: Atualizado automaticamente para a versão integrada mais recente.',
    docs_workflow_062:
      '<strong>Avisos personalizados</strong>: Suas edições nunca são substituídas. NutEgg escreve <code>[filename].new.md</code> junto com seu arquivo para que você possa revisar novas adições em seu próprio ritmo.',
    docs_workflow_063:
      '<strong>Redefinição de fábrica ("Usar padrões")</strong>: Precisa de um novo começo? Em <strong>Obsidian Configurações → NutEgg</strong>, clique em <strong>Usar padrões</strong>. Todos os prompts existentes são copiados com segurança para <code>nutegg/_workflow/_backup/&lt;timestamp&gt;/</code> e os padrões originais de fábrica são restaurados.',
  },
  ru: {
    docs_chromeExtension_001: 'Руководство по расширению Chrome — NutEgg',
    docs_chromeExtension_002: 'Chrome Интернет-магазин ↗',
    docs_chromeExtension_003: 'Obsidian Плагин ↗',
    docs_chromeExtension_004: '🎬 Промо-видео ↗',
    docs_chromeExtension_005: 'Релизы расширений',
    docs_chromeExtension_006: 'Политика конфиденциальности',
    docs_chromeExtension_007: 'Настройка и использование расширения Chrome',
    docs_chromeExtension_008:
      'Расширение NutEgg Chrome находится на боковой панели вашего браузера и обеспечивает извлечение контента по требованию, YouTube интеллектуальные карты с кликабельными временными метками и захват одним щелчком мыши в Obsidian.',
    docs_chromeExtension_009: 'Установка',
    docs_chromeExtension_010: 'Вариант 1: Chrome Интернет-магазин (рекомендуется)',
    docs_chromeExtension_011:
      'Установите NutEgg одним щелчком мыши прямо из официального интернет-магазина <a\n            href="https://chromewebstore.google.com/detail/nutegg/bmdmdiicembobejibggoeiahaonphcol"\n            target="_blank"\n            rel="noopener"\n            >Chrome</a\n          >:',
    docs_chromeExtension_012:
      'Посетите страницу <a\n              href="https://chromewebstore.google.com/detail/nutegg/bmdmdiicembobejibggoeiahaonphcol"\n              target="_blank"\n              rel="noopener"\n              >NutEgg Chrome Интернет-магазина </a\n            >.',
    docs_chromeExtension_013: 'Нажмите <strong>Добавить к Chrome</strong>.',
    docs_chromeExtension_014:
      'Нажмите значок кусочка головоломки на панели инструментов Chrome и закрепите <strong>NutEgg</strong> для удобного доступа к боковой панели.',
    docs_chromeExtension_015: 'Вариант 2: из версии GitHub (.zip)',
    docs_chromeExtension_016:
      'Загрузите последнюю версию <code>nutegg-chrome-extension-*.zip</code> со страницы <a\n              href="https://github.com/staff-000/nutegg-chrome-extension-release/releases"\n              target="_blank"\n              rel="noopener"\n              >Релизы</a\n            >.',
    docs_chromeExtension_017: 'Разархивируйте архив в локальную папку на вашем компьютере.',
    docs_chromeExtension_018: 'Откройте Google Chrome и перейдите к <code>chrome://extensions</code>.',
    docs_chromeExtension_019: 'Включите <strong>Режим разработчика</strong> в правом верхнем углу.',
    docs_chromeExtension_020:
      'Нажмите <strong>Загрузить распакованный</strong> и выберите распакованный каталог, содержащий <code>manifest.json</code>.',
    docs_chromeExtension_021:
      'Нажмите значок головоломки на панели инструментов Chrome и закрепите <strong>NutEgg</strong> для быстрого доступа.',
    docs_chromeExtension_022: 'Рабочий процесс боковой панели',
    docs_chromeExtension_023: 'При нажатии на значок расширения NutEgg открывается боковая панель Chrome:',
    docs_chromeExtension_024:
      '<strong>Автоматическое извлечение</strong>: Во время просмотра NutEgg обнаруживает активную вкладку (YouTube видео, ветку Twitter/X или запись в блоге) и извлекает ее текст и структуру.',
    docs_chromeExtension_025:
      '<strong>Обновление контента (🔄)</strong>: нажмите кнопку обновления в предварительном просмотре контента, чтобы повторно извлечь страницу в динамических одностраничных приложениях без неожиданного перенаправления из предварительного просмотра.',
    docs_chromeExtension_026:
      '<strong>Цель Egg Селектор</strong>: в предварительном просмотре контента выберите целевые знания eggs или используйте «Цель eggs (автоматический выбор по умолчанию)», чтобы позволить ИИ автоматически сопоставлять соответствующие деревья хранилищ.',
    docs_chromeExtension_027:
      '<strong>Режимы анализа</strong>: <ul> <li> <strong>Полный режим</strong>: оценивает контент и немедленно выполняет сопоставление знаний с сопоставлением eggs в рамках единого оптимизированного рабочего процесса. </li> <li> <strong>Режим предварительного просмотра</strong>: сначала генерирует обзор этапа 1 (сводка, интеллектуальная карта, вопросы и ответы, обсуждение), позволяя вам проверить или скорректировать цель eggs перед запуском egg анализа знаний по запросу. </li> </ul>',
    docs_chromeExtension_028:
      '<strong>Индикатор состояния</strong>: зеленая точка указывает на работоспособное соединение с вашим локальным сервером Obsidian (<code>127.0.0.1:27123</code>). Если красный, убедитесь, что Obsidian работает с включенным плагином NutEgg.',
    docs_chromeExtension_029: 'YouTube Интеграция и умная навигация',
    docs_chromeExtension_030: 'На YouTube видеостраницах NutEgg выдержки:',
    docs_chromeExtension_031:
      '<strong>Полные подписи и стенограммы</strong>: автоматическое высокоточное извлечение из авторов и автоматически созданных стенограмм.',
    docs_chromeExtension_032:
      '<strong>Интеллектуальная карта с кликабельными временными метками</strong>: Мгновенная разбивка с помощью кликабельных кнопок с временными метками, которые перенаправляют активный YouTube видеопроигрыватель непосредственно к этому сегменту. При наличии временных меток избыточные теги источника скрыты, чтобы дерево оставалось чистым.',
    docs_chromeExtension_033:
      '<strong>Вопросы и ответы с возможностью прыжков с метками времени</strong>: задавайте любые вопросы о видео на естественном языке; NutEgg предоставляет цитируемые ответы с интерактивными табличками с временными метками, которые сразу переходят к исходному моменту при воспроизведении видео.',
    docs_chromeExtension_034:
      '<strong>Вердикт против кликбейта</strong>: объективный ответ в 1 предложении на суть названия видео, позволяющий сразу же пропустить всякую ерунду.',
    docs_chromeExtension_035: 'Текстовая навигация по источнику на странице',
    docs_chromeExtension_036: 'При чтении статей, блогов или форумов:',
    docs_chromeExtension_037:
      '<strong>📍Перейти к источнику</strong>: текстовые узлы интеллект-карты и цитаты вопросов и ответов включают теги источника. Щелчок по исходному тегу автоматически прокручивает действующую веб-страницу до точно соответствующего абзаца или цитаты и кратко выделяет ее контуром.',
    docs_chromeExtension_038:
      '<strong>Навигация по комментариям</strong>: на страницах обсуждения (Reddit, Zhihu и т. д.) нажатие на ссылку на источник приводит к переходу непосредственно к конкретному комментарию или ответу.',
    docs_chromeExtension_039: 'Анализ дискуссий и перспективы сообщества',
    docs_chromeExtension_040:
      'NutEgg анализирует публичные комментарии в YouTube, Reddit, Twitter/X, Zhihu и на форумах:',
    docs_chromeExtension_041:
      '<strong>Разбивка тем и позиций</strong>: суммирует основные пункты дебатов со значками позиций (согласен 👍, не согласен 👎, смешанный 🤔, нейтральный ⚖️) и показателями реакции.',
    docs_chromeExtension_042:
      '<strong>Дополнительная информация</strong>: ценные комментарии, содержащие доказательства, предостережения или уникальный опыт, сохраняются как краткие дополнительные сведения.',
    docs_chromeExtension_043: 'Chrome — только автономный режим (Obsidian не требуется)',
    docs_chromeExtension_044:
      'У вас не установлен или не открыт Obsidian? NutEgg работает полностью автономно внутри Google Chrome!',
    docs_chromeExtension_045: '⚡ Быстрое чтение веб-страниц без лишних заметок',
    docs_chromeExtension_046:
      'NutEgg создан, прежде всего, как сверхбыстрый помощник для чтения в Интернете. Вы можете извлекать, обобщать, создавать интеллектуальные карты и задавать вопросы по любой статье или YouTube видео прямо в Chrome, даже не прикасаясь к хранилищу заметок.',
    docs_chromeExtension_047: 'Функции, доступные в автономном режиме Chrome:',
    docs_chromeExtension_048:
      '<strong>🎯 Мгновенный вердикт против кликбейта</strong>: объективный ответ в 1 предложении на вопрос заголовка.',
    docs_chromeExtension_049:
      '<strong>📝 Резюме из 3 предложений</strong>: Подробные выводы, извлеченные из любой длинной статьи или видео.',
    docs_chromeExtension_050:
      '<strong>⏱️ Интеллектуальная карта с кликабельными временными метками и поиском</strong>: переход к ключевым фрагментам видео одним щелчком мыши.',
    docs_chromeExtension_051:
      '<strong>💬 Вопросы и ответы по видео и переход к меткам времени</strong>: задавайте вопросы и нажимайте на таблички с указанными метками времени, чтобы переключить воспроизведение видео непосредственно на этот сегмент.',
    docs_chromeExtension_052:
      '<strong>🧠 Складные интеллект-карты</strong>: Многоуровневые интерактивные деревья мыслей, визуально разбивающие основные идеи.',
    docs_chromeExtension_053:
      '<strong>🌐 Поддержка более 50 языков</strong>: Извлекайте и переводите контент на иностранных языках на лету.',
    docs_chromeExtension_054: 'Как настроить режим «Только Chrome»:',
    docs_chromeExtension_055:
      'Щелкните правой кнопкой мыши значок расширения <strong>NutEgg</strong> на панели инструментов Chrome и выберите <strong>Параметры</strong>.',
    docs_chromeExtension_056:
      'Выберите предпочитаемого поставщика ИИ (например, Google Gemini, OpenAI, Claude, DeepSeek или OpenRouter) и введите свой ключ API.',
    docs_chromeExtension_057: 'Нажмите <strong>Сохранить</strong>. Вы готовы проанализировать любую страницу!',
    docs_chromeExtension_058: 'Obsidian Режимы подключения и выполнения AI',
    docs_chromeExtension_059:
      'Когда вы подключаете расширение Chrome к дополнительному плагину NutEgg Obsidian, Chrome легко адаптируется в зависимости от выбранного режима выполнения:',
    docs_chromeExtension_060: '🔒 Безопасность ключей API: ключи никогда не оставляют Chrome',
    docs_chromeExtension_061:
      'В режиме <strong>Connected API</strong> ваши ключи API остаются строго внутри безопасного хранилища расширений Chrome. Obsidian управляет шаблонами знаний и индексацией хранилища, но делегирует выводы ИИ обратно Chrome через аутентифицированный локальный WebSocket. Chrome выполняет локальный вызов API провайдера и возвращает только сгенерированный текст.',
    docs_chromeExtension_062: 'Режим выполнения',
    docs_chromeExtension_063: 'Где работает ИИ',
    docs_chromeExtension_064: 'Используемые учетные данные',
    docs_chromeExtension_065: '<strong>Chrome-Только</strong>',
    docs_chromeExtension_066: 'Прямо внутри Chrome',
    docs_chromeExtension_067: 'Ключ API настроен в настройках Chrome.',
    docs_chromeExtension_068: '<strong>Режим подключенного API</strong>',
    docs_chromeExtension_069: 'Chrome (делегировано через локальный WebSocket Obsidian)',
    docs_chromeExtension_070: 'Ключ API в Chrome (ключи никогда не отправляются в Obsidian)',
    docs_chromeExtension_071: '<strong>Режим общей подписки</strong>',
    docs_chromeExtension_072: 'Внутри Obsidian (через локальный интерфейс командной строки или ChatGPT OAuth)',
    docs_chromeExtension_073: 'Нулевые ключи API (используется код Codex, Claude, Антигравитация или ChatGPT)',
    docs_chromeExtension_074: 'Поддержка нескольких профилей Chrome',
    docs_chromeExtension_075:
      'NutEgg поддерживает несколько профилей браузера Chrome (например, личный и рабочий), одновременно подключающихся к одному и тому же хранилищу Obsidian. Каждый профиль Chrome независимо сохраняет своего поставщика, модель и ключ API. Подключение или переключение режимов выполнения никогда не приводит к утечке или перезаписыванию ключей API между профилями.',
    docs_chromeExtension_076: 'Автономное восстановление и восстановление после отключения',
    docs_chromeExtension_077:
      'Если Obsidian закрыт, когда включен режим подключения, NutEgg отображает четкий индикатор состояния и дает возможность одним щелчком мыши <strong> «Использовать вместо этого режим Chrome»</strong>. Это позволит вам немедленно продолжить чтение и задавать вопросы, используя настройки API Chrome, без перерывов и риска нехватки квот.',
    docs_chromeExtension_078: 'Конфигурация и живая синхронизация',
    docs_chromeExtension_079:
      'NutEgg включает синхронизацию в реальном времени между опциями расширения и активными боковыми панелями:',
    docs_chromeExtension_080:
      '<strong>Управление разделом контента</strong>: на странице «Параметры» можно указать, какие разделы будут извлекаться и анализироваться по умолчанию («Содержимое», «Сводка», «Интеллект-карта», «Вопросы и ответы», «Записи знаний» и «Обсуждение»).',
    docs_chromeExtension_081:
      '<strong>Синхронизация настроек в реальном времени</strong>: изменение моделей анализа, включенных разделов вывода или настроек сервера немедленно обновляет все открытые боковые панели, не требуя обновления страницы.',
    docs_chromeExtension_082:
      '<strong>Порт пользовательского сервера</strong>: если порт по умолчанию <code>27123</code> конфликтует с другой службой, откройте расширение <strong>Параметры</strong>, настройте порт (например, <code>28123</code>) и проверьте соединение.',
    docs_index_001: 'Обзор документации — NutEgg',
    docs_index_002: 'Chrome Интернет-магазин ↗',
    docs_index_003: 'Obsidian Плагин ↗',
    docs_index_004: '🎬 Промо-видео ↗',
    docs_index_005: 'GitHub Релизы',
    docs_index_006: 'Политика конфиденциальности',
    docs_index_007: 'Трекер проблем',
    docs_index_008: 'Обзор и основные понятия',
    docs_index_009:
      'NutEgg — это бесплатное расширение Chrome с открытым исходным кодом, которое помогает вам решить, что стоит прочитать, и быстрее понять это. Он находится на боковой панели Chrome и работает со статьями, темами и видео YouTube. Дополнительный плагин Obsidian превращает то, что вы читаете, в растущее хранилище знаний.',
    docs_index_010: 'Что вы получите в Chrome',
    docs_index_011:
      'Установите расширение, введите свой ключ AI API (или укажите его на локальную модель) в настройках, и NutEgg работает сразу — ни учетной записи, ни дополнительных приложений:',
    docs_index_012: '🎯 Мгновенный вердикт по заголовку против кликбейта',
    docs_index_013: '📝 Краткое изложение из 3 предложений и основные выводы',
    docs_index_014: '🧠 Складные иерархические интеллект-карты с кликабельными временными метками для YouTube',
    docs_index_015:
      '💬 Вопросы и ответы на естественном языке с цитируемыми таблетками с отметками времени и ссылками на источники на странице.',
    docs_index_016: '🔍 Двойные вопросы: строго внутри страницы или за ее пределами для проверки фактов.',
    docs_index_017: '🗣️ Дайджесты разделов комментариев для YouTube, Reddit и форумов.',
    docs_index_018: '🌐 Извлечение из нескольких источников и перевод на более чем 50 языков.',
    docs_index_019: '💡 Почему существует NutEgg',
    docs_index_020:
      'Слишком большая часть Интернета — это дополненные видеоролики, кликбейтные заголовки и статьи, наполненные искусственным интеллектом. NutEgg заранее отвечает на заголовок и честно говорит вам, стоит ли контент вашего времени, поэтому вы тратите внимание только там, где оно окупается.',
    docs_index_021: 'Необязательно: добавьте Obsidian',
    docs_index_022:
      'Если вы ведете заметки в Obsidian, установите сопутствующий плагин, чтобы подключить расширение к вашему хранилищу (<code>127.0.0.1:27123</code>). Это добавляет двухэтапную оценку новизны на основе деревьев знаний вашего хранилища <code>_index.md</code>, дельта-синтез и автоматическое архивирование заметок в файлы <code>nutegg/_raw/</code> и egg. Все в Chrome продолжает работать как с ним, так и без него.',
    docs_index_023: 'Метафора',
    docs_index_024:
      'Когда Obsidian подключен, NutEgg структурирует ваш информационный поток, используя простую метафору из трех частей:',
    docs_index_025:
      '<strong>🌰 Nut (Необработанный захват)</strong>: необработанная веб-страница, цепочка твитов или YouTube стенограмма, извлеченная из браузера. Nuts архивируются нетронутыми с полными метаданными в <code>nutegg/_raw/</code> в вашем хранилище.',
    docs_index_026:
      '<strong>🥚 Egg (Дерево знаний)</strong>: живая, структурированная заметка Markdown в вашем хранилище, представляющая область знаний (например, <code>ai_architecture.md</code>, <code>invest_strategy.md</code>).',
    docs_index_027:
      '<strong>🐣 Люк (Синтез и Дельта)</strong>: Когда контент анализируется, ИИ сопоставляет его с вашим eggs, определяет, что является новым по сравнению с тем, что уже задокументировано, и вплетает новую информацию в ваш egg.',
    docs_index_028: 'Архитектура системы',
    docs_index_029: 'NutEgg имеет один основной компонент и один дополнительный сопутствующий компонент:',
    docs_index_030:
      '<strong>Chrome Расширение </strong>: Находится на боковой панели Chrome. Извлекает текст, комментарии и расшифровки видео. В автономном режиме или режиме подключенного API он выполняет вызовы AI локально, используя настроенного вами поставщика и ключ API, гарантируя, что ваши ключи API никогда не покинут браузер.',
    docs_index_031:
      '<strong>Obsidian Плагин (необязательно)</strong>: запускает локальную службу синхронизации и координатора на <code>127.0.0.1:27123</code>. Считывает <code>_index.md</code> вашего хранилища, управляет шаблонами подсказок в <code>_workflow/</code> и архивирует собранные знания на диск. Он поддерживает: <ul> <li> <strong>Режим подключенного API (по умолчанию)</strong>: координирует сопоставление знаний, делегируя выводы ИИ Chrome через аутентифицированный локальный WebSocket (ключи никогда не отправляются на Obsidian). </li> <li> <strong>Режим общей подписки</strong>: Запускает логические выводы локально через вход в ChatGPT (OAuth) или инструменты CLI разработчика (Codex, Claude Код, Антигравитация) без необходимости использования ключей API. </li> </ul>',
    docs_index_032:
      '<code>Chrome Extension (Side Panel)\n │\n ├── [Standalone Mode] Local AI Processing (Verdicts, Summaries, Mind Maps, Q&amp;A)\n │\n └── [Connected Mode] HTTP + WebSocket (127.0.0.1:27123/execution/socket)\n         │\n         ▼\n Obsidian Plugin (Local Server &amp; Coordinator)\n         ├── Evaluates against vault/nutegg/_index.md &amp; prompts in _workflow/\n         ├── In API Mode: Delegates AI calls back to Chrome over WebSocket (keys stay in Chrome)\n         ├── In Subscription Mode: Executes locally via CLI (Codex/Claude/agy) or ChatGPT OAuth\n         └── Writes structured notes to vault/nutegg/_raw/ and &lt;egg&gt;.md</code>',
    docs_index_033: 'Дорожная карта быстрого старта',
    docs_index_034:
      'Посмотрите <a href="https://www.youtube.com/watch?v=_u6mDoHZSAo" target="_blank" rel="noopener"\n              >🎬 NutEgg Промо-видео</a\n            >, чтобы получить 1-минутное наглядное руководство.',
    docs_index_035:
      'Установите расширение <a\n              href="https://chromewebstore.google.com/detail/nutegg/bmdmdiicembobejibggoeiahaonphcol"\n              target="_blank"\n              rel="noopener"\n              >Chrome Extension</a\n            > из интернет-магазина Chrome и добавьте ключ AI в меню «Параметры» (см. <a href="chrome-extension.html">руководство </a>).',
    docs_index_036:
      'Откройте боковую панель любой статьи или YouTube видео и нажмите <strong>Анализ</strong>. Вот и все!',
    docs_index_037:
      '<em>Необязательно:</em> Установите плагин <a href="https://community.obsidian.md/plugins/nutegg" target="_blank" rel="noopener">Obsidian </a> (см. <a href="obsidian-plugin.html">руководство </a>) и определите свои первые темы знаний в <a href="knowledge-structuring.html">_index.md</a>, чтобы начать штриховку.',
    docs_knowledgeStructuring_001: 'Структурирование знаний и Eggs — NutEgg',
    docs_knowledgeStructuring_002: 'Chrome Интернет-магазин ↗',
    docs_knowledgeStructuring_003: 'Obsidian Плагин ↗',
    docs_knowledgeStructuring_004: 'Релизы',
    docs_knowledgeStructuring_005: 'Политика конфиденциальности',
    docs_knowledgeStructuring_006: 'Структурирование знаний и Eggs',
    docs_knowledgeStructuring_007:
      'Узнайте, как NutEgg организует хранилище Obsidian, сопоставляет веб-контент с темами с помощью <code>_index.md</code> и объединяет накопленные записи в деревья знаний.',
    docs_knowledgeStructuring_008: 'План хранилища <code>nutegg/</code>',
    docs_knowledgeStructuring_009:
      'Весь контент NutEgg хранится в чистой изолированной папке <code>nutegg/</code> в вашем хранилище Obsidian:',
    docs_knowledgeStructuring_010:
      '<code>vault/\n└── nutegg/\n    ├── _raw/                          # Captured nuts (raw web content + metadata)\n    │   └── 2026-09-06-14-30-youtube-author-title.md\n    ├── _index.md                      # Topic routing guide\n    ├── ai_architecture.md             # Knowledge egg\n    ├── invest_strategy.md             # Knowledge egg\n    └── productivity.md                # Knowledge egg</code>',
    docs_knowledgeStructuring_011: 'Руководство по маршрутизации: <code>_index.md</code>',
    docs_knowledgeStructuring_012:
      'Файл <code>_index.md</code> сообщает NutEgg, какие заметки egg вы поддерживаете и какие домены они охватывают. Каждая строка сопоставляет относительный путь к файлу с ключевыми словами и описаниями:',
    docs_knowledgeStructuring_013:
      '<code>nutegg/ai_architecture.md: LLMs, multi-agent systems, prompt engineering, RAG, embeddings\nnutegg/invest_strategy.md: value investing, index funds, asset allocation, macroeconomic indicators\nnutegg/productivity.md: deep work, time blocking, habits, personal knowledge management</code>',
    docs_knowledgeStructuring_014: '⚡ Как работает маршрутизация',
    docs_knowledgeStructuring_015:
      'Когда вы нажимаете <strong>Анализ</strong> в браузере, искусственный интеллект NutEgg считывает ваш <code>_index.md</code> и определяет, какой egg (если есть) соответствует содержимому. Если ни один существующий egg не соответствует, NutEgg предлагает автоматически создать новый egg, отобранный из темы страницы!',
    docs_knowledgeStructuring_016: 'Egg Анатомия файла и как работают инструкции',
    docs_knowledgeStructuring_017:
      'Файл <strong>Egg </strong> (хранящийся в <code>nutegg/*.md</code>) выполняет две важные роли: это одновременно курируемое, развивающееся хранилище знаний для домена и активная спецификация подсказок, которая управляет конвейером ИИ NutEgg всякий раз, когда контент касается этой темы.',
    docs_knowledgeStructuring_018: '1. Структурный план',
    docs_knowledgeStructuring_019:
      'Каждый файл egg объединяет метаданные YAML, блок выносок Obsidian с инструкциями, тщательно подобранное дерево знаний и необработанный промежуточный буфер:',
    docs_knowledgeStructuring_020:
      '<code>---\ntopic: "AI Architecture & Multi-Agent Systems"\nstatus: "active"\nlast_updated: "2026-09-10"\n---\n\n> [!abstract]- Instructions:\n> **Scope:** Multi-agent architectures, tool calling, memory layers, and LLM evaluation.\n> **Action Guide:** Focus on actionable design patterns, scalability tradeoffs, and real failure modes.\n> **Key Questions:**\n> 1. How are agent memory loops bounded to prevent context window overflow?\n> 2. What coordination mechanism is used between subagents?\n> **Worth Reading If:**\n&gt; - Practical examples and substantive explanations.\n&gt; **Skip If:**\n> - Ignore basic beginner tutorials or high-level sales pitches without technical substance.\n> - Discard speculative claims lacking empirical benchmarks or code evidence.\n> **Formatting Rules:**\n> - Prefix each insight with a bracketed tag: `[concept]`, `[architecture]`, `[method]`, `[benchmark]`, `[explain]`, `[fact]`, `[example]`.\n> - Use the structure: `- [tag] **Concept Name**` followed by an indented explanation and concrete examples (`- 🎯 Example:`).\n\n# Knowledge\n## Agent Memory\n- [architecture] **Bounded Replay Buffers**\n    - Ephemeral short-term memory expires after session goals terminate to conserve token budget.\n    - 🎯 Example: Tool calling trace logs stored in vector stores with sliding window eviction.\n\n# Unprocessed\n(Newly hatched insights land here from captures until auto-merged)</code>',
    docs_knowledgeStructuring_021: '2. Как написать Egg Инструкцию',
    docs_knowledgeStructuring_022:
      'Выноска <code>&gt; [!abstract]- Instructions:</code> содержит шесть специализированных полей. Каждый из них управляет определенным этапом конвейера ИИ:',
    docs_knowledgeStructuring_023: 'Поле',
    docs_knowledgeStructuring_024: 'Цель и лучшие практики',
    docs_knowledgeStructuring_025: 'Использование рабочего процесса',
    docs_knowledgeStructuring_026: '<code>**Scope:**</code>',
    docs_knowledgeStructuring_027:
      '1–2 предложения, определяющие тематические границы этого egg. Четко укажите, какие концепции, технологии или вопросы включены или исключены.',
    docs_knowledgeStructuring_028:
      'Введен в <code>egg-analysis.md</code> (этап 2), поэтому ИИ извлекает знания строго через призму этой области.',
    docs_knowledgeStructuring_029: '<code>**Action Guide:**</code>',
    docs_knowledgeStructuring_030:
      'Инструкции из 1–5 шагов о том, как ИИ обобщает и оценивает контент (например, запрашивает конкретные точки зрения, глубину или компромиссы). Возвращается к руководству по умолчанию, если оно опущено.',
    docs_knowledgeStructuring_031: 'Введен в <code>egg-analysis.md</code> (Этап 2).',
    docs_knowledgeStructuring_032: '<code>**Key Questions:**</code>',
    docs_knowledgeStructuring_033:
      'Нумерованный список повторяющихся вопросов, на которые вы хотите получить ответы всякий раз, когда контент касается этого домена (например, <em> «Какова стоимость токена?» </em>, <em> «Каковы режимы сбоя?» </em>).',
    docs_knowledgeStructuring_034:
      'Введен в <code>egg-analysis.md</code> (Этап 2). Ответ получен во всплывающем окне расширения Chrome и сохранен в ваших необработанных заметках.',
    docs_knowledgeStructuring_035: '<code>**Worth Reading If:** / **Skip If:**</code>',
    docs_knowledgeStructuring_036:
      'Два списка предпочтений, описывающие, когда оригинал заслуживает вашего внимания, а когда достаточно краткого изложения.',
    docs_knowledgeStructuring_037:
      'Руководствуйтесь действием чтения на этапе 2: полное, выделенное, краткое изложение, пропуск или неопределенное. Они никогда не отклоняют записи во время слияния.',
    docs_knowledgeStructuring_038: '<code>**Formatting Rules:**</code>',
    docs_knowledgeStructuring_039:
      'Стандарты форматирования: теги в квадратных скобках (<code>[concept]</code>, <code>[architecture]</code>, <code>[method]</code> и т. д.) и иерархические отступы маркеров.',
    docs_knowledgeStructuring_040:
      'Введен в <code>egg-analysis.md</code> (Этап 2). Гарантирует, что записи-кандидаты соответствуют правилам форматирования ваших заметок.',
    docs_knowledgeStructuring_041: '3. Курируемое дерево знаний и необработанная очередь',
    docs_knowledgeStructuring_042:
      'NutEgg защищает вашу базу знаний от загрязнения ИИ, отделяя тщательно отобранные знания от новых:',
    docs_knowledgeStructuring_043:
      '<strong><code># Knowledge</code> (Кураторское дерево):</strong> Структурировано с заголовками Markdown и вложенными пунктами списка. Только слияние читает это дерево, объединяя эквивалентные утверждения, сохраняя при этом отдельные примеры, предостережения, разногласия и источники. Этап 2 следует инструкциям без сравнения с деревом.',
    docs_knowledgeStructuring_044:
      '<strong><code># Unprocessed</code> (Промежуточная очередь):</strong> Когда вы нажимаете <strong>🥚 Штриховка Egg</strong> в браузере, одобренные записи и поддерживаемые ответы безопасно добавляются в <code># Unprocessed</code>, а не напрямую затрагивают курируемую иерархию.',
    docs_knowledgeStructuring_045: '4. Как каждая часть используется в рабочем процессе',
    docs_knowledgeStructuring_046:
      'Вот как веб-контент проходит через ваши инструкции egg от первоначального захвата до окончательного синтеза:',
    docs_knowledgeStructuring_047:
      '<code>[Captured Web Content]\n          │\nStage 1   ▼   _index.md (Topic routing guide)\n─────────────────────────────────────────────────────────────\n• Uses content-task-default.md\n• Generates Title Verdict, 3-Bullet Summary, Mind Map\n• egg-routing.md matches target eggs via Stage 1 summary\n          │\n          ▼\nUser Review: Confirm or select target eggs in popup\n          │\nStage 2   ▼   Target Egg File (nutegg/*.md)\n─────────────────────────────────────────────────────────────\n• Scope, Key Questions, Formatting Rules ──► egg-analysis.md\n  (Extracts candidate knowledge entries and answers questions)\n• Worth Reading If / Skip If guide the reading recommendation\n  (Full, highlights, summary, skip, or uncertain; no tree comparison)\n          │\n          ▼\nHatch Egg: Approved entries and supported answers appended to # Unprocessed\n          │\nMerge Cycle (20+ entries or manual button)\n─────────────────────────────────────────────────────────────\n• merge-unprocessed.md nests and integrates entries into # Knowledge</code>',
    docs_knowledgeStructuring_048: 'Автоматическое объединение знаний',
    docs_knowledgeStructuring_049:
      'Когда в <code># Unprocessed</code> накапливается 20 или более записей (или когда вы нажимаете <strong>Объединить</strong> в виджете просмотра Obsidian), ИИ NutEgg запускает автоматический фоновый синтез с использованием <code>merge-unprocessed.md</code>. Он классифицирует, дедуплицирует и вкладывает ожидающие записи в соответствующие родительские концепции в <code># Knowledge</code>, обеспечивая постоянную организацию вашего графика знаний.',
    docs_obsidianPlugin_001: 'Руководство по плагину Obsidian — NutEgg',
    docs_obsidianPlugin_002: 'Obsidian Плагин сообщества ↗',
    docs_obsidianPlugin_003: 'Chrome Интернет-магазин ↗',
    docs_obsidianPlugin_004: 'Релизы плагинов',
    docs_obsidianPlugin_005: 'Политика конфиденциальности',
    docs_obsidianPlugin_006: 'Установка и настройка плагина Obsidian',
    docs_obsidianPlugin_007:
      'Плагин NutEgg Obsidian размещает локальный сервер синхронизации, управляет связью с искусственным интеллектом, сопоставляет входящий контент с вашими деревьями знаний и поддерживает файлы вашего хранилища.',
    docs_obsidianPlugin_008: 'Установка',
    docs_obsidianPlugin_009: 'Вариант 1: Obsidian Плагины сообщества (рекомендуется)',
    docs_obsidianPlugin_010: 'NutEgg официально указан в каталоге плагинов сообщества Obsidian:',
    docs_obsidianPlugin_011: 'В Obsidian откройте <strong>Настройки → Плагины сообщества</strong>.',
    docs_obsidianPlugin_012:
      'Убедитесь, что <strong>Ограниченный режим</strong> выключен, затем нажмите <strong>Обзор</strong>.',
    docs_obsidianPlugin_013:
      'Найдите <strong>NutEgg</strong> (или посетите <a href="https://community.obsidian.md/plugins/nutegg" target="_blank" rel="noopener"\n              >NutEgg на Obsidian Плагинах сообщества</a\n            >).',
    docs_obsidianPlugin_014: 'Нажмите <strong>Установить</strong>, затем нажмите <strong>Включить</strong>.',
    docs_obsidianPlugin_015: 'Вариант 2: Ручная установка',
    docs_obsidianPlugin_016:
      'Загрузите <code>main.js</code>, <code>manifest.json</code> и <code>styles.css</code> из версий плагинов <a href="https://github.com/staff-000/nutegg-obsidian-release/releases" target="_blank" rel="noopener"\n              >NutEgg Obsidian</a\n            >.',
    docs_obsidianPlugin_017:
      'В хранилище Obsidian откройте <code>.obsidian/plugins/</code> (при необходимости покажите скрытые папки в вашей ОС).',
    docs_obsidianPlugin_018:
      'Создайте новый каталог с именем <code>nutegg</code> и поместите внутрь три файла: <pre><code>your-vault/.obsidian/plugins/nutegg/\n├── main.js\n├── manifest.json\n└── styles.css</code></pre>.',
    docs_obsidianPlugin_019:
      'В Obsidian откройте <strong>Настройки → Плагины сообщества</strong>, нажмите <strong>Перезагрузить</strong> и включите <strong>NutEgg</strong>.',
    docs_obsidianPlugin_020: 'Вариант 3: Использование BRAT',
    docs_obsidianPlugin_021:
      'Установите плагин сообщества <a href="https://github.com/tfthacker/obsidian42-brat" target="_blank" rel="noopener">BRAT</a> в Obsidian.',
    docs_obsidianPlugin_022: 'Перейдите в <strong>Настройки → BRAT → Добавить бета-плагин</strong>.',
    docs_obsidianPlugin_023:
      'Введите <code>staff-000/nutegg-obsidian-release</code> и нажмите <strong>Добавить плагин</strong>.',
    docs_obsidianPlugin_024: 'Включите NutEgg после установки.',
    docs_obsidianPlugin_025: 'Архитектура исполнения ИИ',
    docs_obsidianPlugin_026:
      'NutEgg использует интеллектуальную архитектуру двойного выполнения (Протокол 3), которая дает вам полную гибкость между конфиденциальностью с использованием собственного ключа API и удобством подписки с нулевым ключом:',
    docs_obsidianPlugin_027: '🔒 Основной инвариант конфиденциальности: ключи API никогда не покидают Chrome',
    docs_obsidianPlugin_028:
      'В режиме <strong>Connected API</strong>, Obsidian организует операции хранилища, сборку приглашений и egg индексацию, но <strong> делегирует все вызовы ИИ обратно Chrome</strong> через аутентифицированный локальный WebSocket. Chrome выполняет вызов, используя локально сохраненный ключ API. Ваши ключи API никогда не передаются на Obsidian, никогда не записываются в заметки хранилища и никогда не покидают браузер.',
    docs_obsidianPlugin_029:
      '<code>┌─────────────────────────────────────────────────────────────────────────────┐\n│                           CONNECTED API MODE (Default)                      │\n│                                                                             │\n│  Chrome Profile A ──(1) HTTP /analyze /confirm──►  Obsidian Plugin          │\n│  (Holds API Key A)                                 (127.0.0.1:27123)        │\n│                                                            │                │\n│                   ◄─(2) WebSocket AI Call /socket──────────┤ Reads _index.md│\n│  Calls Provider A                                          │ Assembles prompt│\n│  (OpenAI / Claude / Gemini / DeepSeek)                     │                │\n│                   ──(3) Authenticated Result─────────────► │                │\n│                                                            ▼                │\n│  Receives Final Result ◄──────(4) HTTP Result────── Saves to Vault          │\n│                                                     (_raw/ & &lt;egg&gt;.md)      │\n└─────────────────────────────────────────────────────────────────────────────┘\n\n┌─────────────────────────────────────────────────────────────────────────────┐\n│                       SHARED SUBSCRIPTION MODE (Zero API Keys)              │\n│                                                                             │\n│  Chrome Profile A ────┐                                                     │\n│                       ├──► Obsidian Plugin (127.0.0.1:27123)                │\n│  Chrome Profile B ────┘        │                                            │\n│                                ▼                                            │\n│                       SubscriptionService (Local CLI or OAuth)              │\n│                       ├── ChatGPT Sign-In (OpenAI Responses API)            │\n│                       ├── Codex CLI (@openai/codex)                         │\n│                       ├── Claude Code CLI (claude auth login)               │\n│                       └── Google Gemini (Antigravity CLI: agy)              │\n└─────────────────────────────────────────────────────────────────────────────┘</code>',
    docs_obsidianPlugin_030: 'Режим 1: Режим подключенного API (по умолчанию)',
    docs_obsidianPlugin_031:
      'В этом режиме вы настраиваете своего поставщика AI и ключ API непосредственно в <strong>Chrome Параметры расширения</strong>. Obsidian координирует рабочий процесс знаний, а Chrome действует как безопасный локальный управляющий искусственным интеллектом.',
    docs_obsidianPlugin_032:
      '<strong>Поддерживаемые облачные провайдеры</strong>: Anthropic (Claude 3.5 Sonnet, Claude 3.7 Sonnet), OpenAI (GPT-4o, серия o), Google Gemini (2.0 Flash, 2.5 Pro), DeepSeek (V3, R1), Kimi, Квен, Жипу и OpenRouter.',
    docs_obsidianPlugin_033:
      '<strong>Локальные LLM (Ollama, LM Studio, llama.cpp, vLLM)</strong>: настройте локальные конечные точки непосредственно в Chrome. NutEgg подключается к вашей локальной модели без отправки данных за пределы вашего компьютера.',
    docs_obsidianPlugin_034:
      '<strong>Независимые Chrome профили</strong>: если вы используете несколько профилей Chrome (например, рабочий и личный), каждый профиль может использовать своего собственного поставщика, модель и ключ API. Они подключаются к одному и тому же хранилищу Obsidian без конфликтов ключей.',
    docs_obsidianPlugin_035:
      '<strong>Obsidian — Собственные действия</strong>: задачи обслуживания только для хранилища (например, ручное объединение egg в Obsidian) используют собственные настройки, безопасно хранящиеся в <code>SecretStorage</code> Obsidian. Нажатие кнопки <strong>Сохранить и продолжить</strong> в подключенном профиле Chrome безопасно обновит собственную учетную запись в SecretStorage.',
    docs_obsidianPlugin_036: 'Режим 2: режим общей подписки и вход в ChatGPT',
    docs_obsidianPlugin_037:
      'Не хотите управлять ключами API или кредитами с оплатой за токен? NutEgg поддерживает прямой вход и подписки CLI локального разработчика, управляемые внутри Obsidian:',
    docs_obsidianPlugin_038: 'Вариант А: прямой вход в ChatGPT (интерфейс командной строки не требуется)',
    docs_obsidianPlugin_039: 'В Obsidian откройте <strong>Настройки → NutEgg</strong>.',
    docs_obsidianPlugin_040: 'В разделе <strong>AI-соединение</strong> выберите <strong>Вход в ChatGPT</strong>.',
    docs_obsidianPlugin_041:
      'Нажмите <strong>Продолжить с ChatGPT</strong>, завершите процесс авторизации браузера и разрешите использование плана.',
    docs_obsidianPlugin_042: 'Выберите модель своей учетной записи (например, <code>gpt-4o</code>).',
    docs_obsidianPlugin_043:
      'Все подключенные профили Chrome немедленно следуют за этим соединением без настройки ключа API. Учетные данные надежно хранятся в хранилище связки ключей ОС для каждой установки и никогда не отправляются на Chrome и не сохраняются в файлах хранилища.',
    docs_obsidianPlugin_044: 'Вариант Б: локальные подписки CLI (Codex, Claude, Gemini)',
    docs_obsidianPlugin_045:
      'NutEgg может запускать официальные инструменты CLI разработчика, уже установленные и зарегистрированные на вашем компьютере:',
    docs_obsidianPlugin_046: 'Поставщик',
    docs_obsidianPlugin_047: 'Установка командной строки',
    docs_obsidianPlugin_048: 'Аутентификация',
    docs_obsidianPlugin_049: 'Модель Дискавери',
    docs_obsidianPlugin_050: '<strong>Codex CLI</strong>',
    docs_obsidianPlugin_051: '<code>npm install -g @openai/codex</code>',
    docs_obsidianPlugin_052: '<code>codex login</code>',
    docs_obsidianPlugin_053: 'Автоматически через сервер приложений',
    docs_obsidianPlugin_054: '<strong>Антропный Claude</strong>',
    docs_obsidianPlugin_055:
      '<a href="https://code.claude.com/docs/en/quickstart" target="_blank" rel="noopener">Claude Код</a>',
    docs_obsidianPlugin_056: '<code>claude auth login --claudeai</code>',
    docs_obsidianPlugin_057: 'Sonnet, Opus, Haiku или собственный идентификатор',
    docs_obsidianPlugin_058: '<strong>Google Gemini</strong>',
    docs_obsidianPlugin_059:
      '<a href="https://antigravity.google/docs/cli/install" target="_blank" rel="noopener">Антигравитационный интерфейс командной строки</a>',
    docs_obsidianPlugin_060: '<code>agy</code> поток браузера',
    docs_obsidianPlugin_061: 'Автоматически через <code>agy models</code>',
    docs_obsidianPlugin_062:
      'В Obsidian Настройки → NutEgg просто выберите свой интерфейс командной строки в разделе <strong>AI-соединение</strong>. Внутренний <code>SubscriptionService</code> NutEgg выполняет вывод в ограниченной последовательной очереди локально. Никакого отдельного мостового сервера или порта 27124 не требуется.',
    docs_obsidianPlugin_063: 'Локальный сервер синхронизации и безопасность',
    docs_obsidianPlugin_064:
      'Когда плагин включен, он автоматически загружает фоновый прослушиватель HTTP и WebSocket на <code>127.0.0.1:27123</code>.',
    docs_obsidianPlugin_065: '🔒 Конфиденциальность и безопасность происхождения',
    docs_obsidianPlugin_066:
      'Локальный сервер строго привязан к петлевому адресу локального хоста (<code>127.0.0.1</code>). Он обеспечивает строгую проверку <code>X-NutEgg-Extension-Origin</code> и токенов, предотвращая доступ обычных веб-страниц к вашему хранилищу. Соединения WebSocket аутентифицируются в самом первом кадре.',
    docs_obsidianPlugin_067: 'Рабочий процесс и быстрая настройка',
    docs_obsidianPlugin_068:
      'NutEgg обеспечивает анализ ИИ с помощью модульных, редактируемых подсказок Markdown, которые хранятся непосредственно в вашем хранилище под <code>nutegg/_workflow/</code>:',
    docs_obsidianPlugin_069:
      '<strong>Редактируемые шаблоны</strong>: настройте подсказки для анализа контента, egg сравнения, маршрутизации и последующих действий.',
    docs_obsidianPlugin_070:
      '<strong>Неразрушающие обновления</strong>: Когда NutEgg выпускает обновленные шаблоны подсказок, ваши настроенные рабочие процессы автоматически сохраняются без перезаписи.',
    docs_workflow_001: 'Рабочие процессы ИИ и механизм промптов — NutEgg',
    docs_workflow_002: 'Chrome Интернет-магазин ↗',
    docs_workflow_003: 'Obsidian Плагин ↗',
    docs_workflow_004: 'Релизы',
    docs_workflow_005: 'Политика конфиденциальности',
    docs_workflow_006: 'Рабочие процессы ИИ и механизм промптов',
    docs_workflow_007:
      'Узнайте, как модульный механизм рабочего процесса NutEgg организует извлечение контента, маршрутизацию egg на основе сводных данных, анализ на основе инструкций и настраиваемые пользователем подсказки.',
    docs_workflow_008: 'Двухэтапная архитектура',
    docs_workflow_009:
      'Вместо запуска одного монолитного приглашения NutEgg использует <strong>Двухэтапную архитектуру</strong>, предназначенную для эффективности токена, высокой точности извлечения и полного контроля пользователя:',
    docs_workflow_010:
      '<code>                    ┌───────────────────────────────┐\n                    │      Captured Web Content     │\n                    │   (Article / YouTube / Tweet) │\n                    └───────────────┬───────────────┘\n                                    │\n                                    ▼\n       ===========================================================\n       STAGE 1: Content & Discussion Analysis + Egg Routing\n       ===========================================================\n            │                                             │\n            ├─► Content Analysis                          ├─► Discussion Analysis\n            │   (Is content >30k chars?)                  │   (When 💬 Discussion enabled\n            │    ├── No  ──► [content-analysis.md]        │    & comments captured)\n            │    └── Yes ──► Chunks + [aggregate-         │    ├── [discussion-analysis.md]\n            │                content.md]                  │    └── [aggregate-discussion.md]\n            │                                             │\n            └──────────────────────┬──────────────────────┘\n                                   │\n                                   ▼\n        Produces: Title Verdict, 3-Bullet Summary, Mind Map,\n        Timestamped Q&A, and Discussion Topics/Stances\n                                   │\n                                   ▼\n                          [egg-routing.md]\n          (Routes matched eggs from _index.md using the\n           concise Stage 1 summary instead of raw content)\n                                    │\n                                    ▼\n       ===========================================================\n       INTERACTIVE CHOICE / EXECUTION MODE (Chrome Extension)\n       ===========================================================\n                                    │\n                        Which mode is selected?\n                                    │\n            ┌───────────────────────┼───────────────────────┐\n            ▼                       ▼                       ▼\n     [Standalone Mode]         [🌞 Full Mode]      [🌛 Preview Summary]\n     Obsidian is offline.      Auto-proceeds to    User reviews matched eggs:\n     Runs Stage 1 in Chrome    Stage 2 with all    ├── "Collect Nut Only"\n     with user\'s API key.      matched eggs.       └── Add/remove eggs ──► Proceed\n     (Fast reading & Q&A)           │                       │\n            │                       └───────────┬───────────┘\n            ▼                                   ▼\n    Results in Side Panel      ===========================================================\n    (No Stage 2 analysis)    STAGE 2: Per-Egg Instruction-Driven Analysis\n                               ===========================================================\n                                                │\n                                   For each confirmed egg (1 or N):\n                                                │\n                                                ▼\n                                        [egg-analysis.md]\n                                  (Extract candidate knowledge entries\n                                   & key questions scoped to this egg)\n                                                │\n                                                ▼\n                                  (Answers + extracted entries + reading action)\n                                                │\n                                                ▼\n                                     Results returned to Popup\n                                     (Ready to Save Nut & Eggs)</code>',
    docs_workflow_011: '💡 Почему маршрутизация на основе сводки?',
    docs_workflow_012:
      'Маршрутизация eggs с использованием сводки этапа 1 вместо полных необработанных статей или многочасовых видеотранскриптов экономит десятки тысяч токенов за один запуск и повышает точность маршрутизации за счет сосредоточения внимания на четких семантических темах с высоким уровнем сигнала.',
    docs_workflow_013:
      'Индикатор перекрестной таблицы на боковой панели показывает текущие анализы и непрочитанные завершенные результаты в текущем окне Chrome. Нажмите на нее, чтобы просмотреть список вкладок и перейти непосредственно к их результатам или прогрессу. Результаты становятся читаемыми, когда их анализ отображается на активной вкладке. Отслеживание продолжается, пока панель остается открытой, и сбрасывается при ее закрытии.',
    docs_workflow_014:
      'Хэтч архивирует исходный анализ и добавляет утвержденные записи к <code># Unprocessed</code>. Объединение выполняется при 20 ожидающих записях или по требованию для объединения фрагментов и дедупликации заявок с сохранением источников, предостережений, примеров и разногласий. Этап 2 никогда не получает дерево знаний, поэтому рекомендация оценивает актуальность и содержание, а не новизну.',
    docs_workflow_015:
      'Опция раздела <strong>🍃 Знания</strong> и раскрывающийся список Egg Анализ имеют одну настройку для текущей вкладки браузера: <strong>🥚 Только анализ</strong> отключает Знание, а <strong>🍃 Включить знания</strong> включает его. При переключении вариантов в раскрывающемся списке обновляются настройки и метки кнопок без автоматического запуска вызова ИИ — нажмите кнопку для анализа. При переключении на «Включить знания» для egg, проанализированного ранее без записей знаний, NutEgg повторно запускает этап 2, а не просто показывает кэшированный результат только для ответов. Включить знания — это исходное значение по умолчанию; ваш последний выбор становится значением по умолчанию для вкладок без анализа. Отключение этой опции не скрывает ранее созданные записи и не предотвращает их сохранение. Отключение Знаний отключает записи для каждого выбранного egg. Включение этой функции позволяет вводить записи только для eggs, которые это разрешают: <code>Generate Knowledge Entries: no</code> или отказ в Руководстве к действиям egg имеет приоритет. Ключевые ответы и рекомендации по чтению остаются доступными в любом случае. Анализ не сохраняет записи; <strong>🐣 Штриховка Egg</strong> сохраняет сгенерированные записи в файлы egg.',
    docs_workflow_016: 'Режимы рабочего процесса',
    docs_workflow_017: 'Режим',
    docs_workflow_018: 'Поведение',
    docs_workflow_019: 'Лучше всего использовать для',
    docs_workflow_020: '<strong>📱 Автономный режим</strong>',
    docs_workflow_021:
      'Запускает контент-анализ этапа 1 непосредственно в Chrome (когда Obsidian не в сети или закрыт). Выносит вердикты, резюме из трех предложений, интеллектуальные карты с кликабельными временными метками и интерактивные видео вопросов и ответов с возможностью перехода по временным меткам. Пропускает этап 2 egg анализа.',
    docs_workflow_022:
      'Быстрое чтение веб-страниц и видео, быстрое понимание или когда вам не нужно архивировать заметки.',
    docs_workflow_023: '<strong>🌞 Полный режим</strong>',
    docs_workflow_024:
      'Запускает анализ контента этапа 1, автоматически маршрутизирует eggs через <code>_index.md</code> и немедленно выполняет анализ этапа 2 egg за один непрерывный проход.',
    docs_workflow_025: 'Ежедневное чтение и быстрые снимки, если вы доверяете автоматическому сопоставлению egg.',
    docs_workflow_026: '<strong>🌛 Сводка предварительного просмотра</strong>',
    docs_workflow_027:
      'Запускает анализ контента этапа 1, затем приостанавливает всплывающее окно. Показывает совпадение eggs вместе с полным списком egg вашего хранилища. Вы можете добавить/удалить eggs, продолжить сравнение знаний или нажать <strong>Собрать Nut Только</strong>.',
    docs_workflow_028:
      'Глубокие исследования, неоднозначные темы или когда вам нужно только краткое изложение без обновления egg деревьев знаний.',
    docs_workflow_029: 'Выполнение искусственного интеллекта и протокол учетных данных',
    docs_workflow_030:
      'Независимо от того, выбираете ли вы «Полный режим» или «Предварительный просмотр сводки», NutEgg отделяет <em>оркестрацию рабочего процесса</em> от <em>хранения учетных данных и вывода ИИ</em>:',
    docs_workflow_031:
      '<strong>Режим подключенного API (по умолчанию)</strong>: Obsidian координирует внедрение шаблона приглашения и сравнение знаний, но отправляет запросы вывода на Chrome через аутентифицированный WebSocket (<code>/execution/socket</code>). Chrome запускает вызов LLM со своим локальным ключом API и отправляет обратно проверенный результат. <strong>Ваш ключ API никогда не покидает Chrome.</strong>',
    docs_workflow_032:
      '<strong>Режим общей подписки</strong>: Obsidian координирует рабочий процесс и напрямую выполняет вызовы AI локально, используя официальные инструменты CLI разработчика (<code>codex</code>, <code>claude</code>, <code>agy</code>) или прямой вход в ChatGPT OAuth. Все подключенные профили Chrome используют эту подписку без необходимости использования ключа API.',
    docs_workflow_033: 'Файлы рабочих процессов в вашем хранилище',
    docs_workflow_034:
      'NutEgg помещает свои шаблоны подсказок в <code>nutegg/_workflow/</code> внутри вашего хранилища:',
    docs_workflow_035: '1. Общие фрагменты (вставлены в другие подсказки)',
    docs_workflow_036:
      '<code>shared-output-rules.md</code>: Директива об обосновании (исходный контент как единственная правда) и справочные правила многоязычного выходного языка. Введено как <code>{{shared_output_rules}}</code>.',
    docs_workflow_037:
      '<code>content-task-default.md</code>: инструкции по основным задачам для вердиктов заголовков, резюме из трех пунктов и интеллект-карт с кликабельными временными метками. Введено как <code>{{content_task_default}}</code>.',
    docs_workflow_038: '2. Конвейер захвата и сравнения контента',
    docs_workflow_039:
      '<code>content-analysis.md</code>: краткое изложение контента этапа 1, вердикт против кликбейта, интерактивная карта связей с кликабельными временными метками и пользовательские ответы на вопросы с цитатами из временных меток.',
    docs_workflow_040:
      '<code>egg-routing.md</code>: Сопоставляет резюме этапа 1 с описаниями egg в <code>_index.md</code> для выбора кандидата eggs.',
    docs_workflow_041:
      '<code>egg-analysis.md</code>: Этап 2 для каждого egg извлечение записей знаний кандидата и ответов на ключевые вопросы, ограниченных инструкциями одного egg.',
    docs_workflow_042:
      'Стоит прочитать, если и пропустить Если руководство по чтению полностью, основные моменты, достаточное резюме, пропустить или неопределенное. Полезные ответы можно сохранить независимо от рекомендаций.',
    docs_workflow_043:
      '<code>aggregate-content.md</code> и <code>aggregate-egg.md</code>: агрегирование длинного контента (&gt;30 тыс. символов). Этап 2 объединяет только черновики ответов, заметки с рекомендациями и освещение; извлеченные записи остаются в исходном порядке до тех пор, пока не будут объединены.',
    docs_workflow_044: '3. Анализ обсуждения (этап 1)',
    docs_workflow_045:
      'Анализ обсуждений выполняется как часть анализа контента <strong>Этап 1</strong>, когда раздел <strong>💬 Обсуждение</strong> включен в параметрах расширения или разделах анализа всплывающих окон, а экстрактор страниц фиксирует комментарии читателей или ответы в социальных сетях (например, комментарии YouTube, ответы Twitter, Reddit/темы форума, комментарии Bilibili или Чжиху отвечает).',
    docs_workflow_046:
      '<code>discussion-analysis.md</code>: Анализирует комментарии по группам, чтобы выделить 3–5 основных тем обсуждения, классифицировать позиции комментаторов (<code>agree</code>, <code>disagree</code>, <code>mixed</code>, <code>neutral</code>, <code>unclear</code>) и выделить ценные дополнения или исправления из личного опыта (<code>supplement: true</code>).',
    docs_workflow_047:
      '<code>aggregate-discussion.md</code>: объединяет и синтезирует темы и распределения позиций по многопакетным потокам комментариев для больших форумов или разделов видеокомментариев.',
    docs_workflow_048:
      '<strong>Поток контекста:</strong> Проанализированные сводки обсуждений и элементы доказательств возвращаются в результате этапа 1 и передаются непосредственно в пользовательские вопросы и ответы или анализ основной части форума (важно для страниц, посвященных обсуждениям, или видео без стенограмм). Они также передаются в качестве контекстных сигналов на этап 2 <code>egg-analysis.md</code>, чтобы eggs мог оценивать отзывы сообщества наряду с исходным контентом.',
    docs_workflow_049: '4. Интерактивные рабочие процессы и процессы обслуживания',
    docs_workflow_050:
      '<code>follow-up.md</code>: интерактивные вопросы и ответы на естественном языке на боковой панели с историей предыдущих разговоров и кликабельным переходом по временной метке видео.',
    docs_workflow_051:
      '<code>merge-unprocessed.md</code>: активируется вручную или автоматически при наличии более 20 ожидающих записей для организации и вложения необработанных элементов в <code># Knowledge</code>.',
    docs_workflow_052:
      '<code>localize-egg.md</code>: переводит новые шаблоны egg на иностранные языки, сохраняя при этом английские структурные заголовки.',
    docs_workflow_053: 'Рекомендации по безопасной настройке',
    docs_workflow_054: '⚠️ Что сохранить',
    docs_workflow_055:
      'Вы можете настроить тон, перспективу и глубину подсказки. Однако вы <strong>должны сохранить</strong>:',
    docs_workflow_056:
      'Все теги <code>{{placeholder}}</code> (например, <code>{{content}}</code>, <code>{{knowledge_tree}}</code>, <code>{{title}}</code>).',
    docs_workflow_057:
      'Точные выходные ключи JSON (например, <code>titleVerdict</code>, <code>extractedEntries</code>, <code>mindMap</code>), чтобы синтаксический анализатор мог десериализовать ответ.',
    docs_workflow_058:
      'Структурные заголовки (<code># Knowledge</code>, <code># Unprocessed</code>) в выводе Markdown.',
    docs_workflow_059: 'Бесконфликтные обновления и сброс',
    docs_workflow_060: 'Когда NutEgg обновляется до более новой версии:',
    docs_workflow_061:
      '<strong>Неотредактированные подсказки</strong>: автоматически обновляется до последней встроенной версии.',
    docs_workflow_062:
      '<strong>Индивидуальные подсказки</strong>: ваши изменения никогда не перезаписываются. NutEgg записывает <code>[filename].new.md</code> рядом с вашим файлом, чтобы вы могли просматривать новые дополнения в удобном для вас темпе.',
    docs_workflow_063:
      '<strong>Сброс к заводским настройкам («Использовать настройки по умолчанию»)</strong>: Хотите начать все сначала? В <strong>Obsidian Настройки → NutEgg</strong> нажмите <strong>Использовать настройки по умолчанию</strong>. Все существующие запросы сохраняются в резервную копию <code>nutegg/_workflow/_backup/&lt;timestamp&gt;/</code>, и восстанавливаются исходные заводские настройки.',
  },
};
