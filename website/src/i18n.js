/**
 * NutEgg Website i18n
 * Supports English (en) and Simplified Chinese (zh) without translating "NutEgg"
 */

const websiteTranslations = {
  en: {
    // Nav
    navTour: "Product Tour",
    navMetaphor: "The Metaphor",
    navHowItWorks: "How It Works",
    navFeatures: "Features",
    navExpectations: "Expectations",
    navDocs: "Documentation",
    navGitHub: "GitHub",
    navGetStarted: "Get Started",
    langToggle: "中文",

    // Hero
    heroBadgeNut: "🌰 Nuts: Raw Web Content",
    heroBadgeEgg: "🥚 Eggs: Curated Knowledge",
    heroTitle: "Read Less. Hatch More.<br><span class=\"gradient-text\">Save Time.</span>",
    heroSubtitle: "NutEgg is the open-source, privacy-first bridge between web browsing and your Obsidian vault. Use standalone in Chrome for instant video Q&A, mind maps, and verdicts—or pair with Obsidian for automatic, novelty-driven knowledge curation.",
    chromeStoreBtn: "Chrome Web Store",
    obsidianPluginBtn: "Obsidian Plugin",
    readDocsBtn: "📖 Read Docs",
    starGitHubBtn: "⭐ Star on GitHub",
    bannerTitleText: "youtube.com/watch?v=... — NutEgg Side Panel",

    // Showcase
    tourBadge: "✨ Interactive Product Tour",
    tourTitle: "Designed for Information Clarity",
    tourSubtitle: "Explore how NutEgg turns bloated web content into structured, actionable knowledge.",
    tab0: "Anti-Clickbait",
    tab1: "Q&A & Timestamps",
    tab2: "Mind Map",
    tab3: "Skip Redundant",
    tab4: "Grow Knowledge",
    tab5: "Multi-Source",

    slide0Tag: "🎯 Anti-Clickbait Verdict",
    slide0Title: "Instant Summary & Title Verdict",
    slide0Desc: "NutEgg cuts straight to the point: it answers the headline's core question in one punchy sentence and tells you honestly whether the video or article is worth your time.",

    slide1Tag: "⏱️ Instant Video Navigation",
    slide1Title: "Ask Any Question & Jump to Timestamp",
    slide1Desc: "Ask free-form questions about video content and get cited answers with clickable timestamp pills that jump directly to the exact moment in the video playback.",

    slide2Tag: "🧠 Hierarchical Breakdown",
    slide2Title: "Interactive Thought Trees",
    slide2Desc: "Turn hour-long videos and complex articles into collapsible, multi-tier mind maps. Expand key takeaways and visualize idea relationships in seconds.",

    slide3Tag: "⚡ Novelty-First Evaluation",
    slide3Title: "Skip What You Already Know",
    slide3Desc: "NutEgg checks incoming content against your Obsidian vault knowledge base and alerts you when ideas are already covered—saving you 15 to 30 minutes per video.",

    slide4Tag: "🌳 Evergreen Knowledge Trees",
    slide4Title: "Automatically Grow Your Obsidian Vault",
    slide4Desc: "Isolates the novel deltas from your browsing and weaves them directly under the right branches of your existing Obsidian egg files without manual note formatting.",

    slide5Tag: "🌐 Universal Compatibility",
    slide5Title: "Any Platform, In Your Native Language",
    slide5Desc: "Extract with full fidelity from YouTube transcripts, Substack newsletters, Medium blogs, and X (Twitter) threads. Summarize and translate into 50+ languages on the fly.",

    // Metaphor
    metaphorTitle: "The Metaphor: Nuts & Eggs",
    metaphorSubtitle: "A sensible, intuitive mental model for personal knowledge management.",
    metaphorNutTitle: "The Nut: Raw Captures",
    metaphorNutDesc: "Whenever you find an interesting article, tweet thread, or YouTube video, NutEgg extracts its raw content into a \"nut\". Complete with metadata, timestamps, and full context stored safely in nutegg/_raw/.",
    metaphorEggTitle: "The Egg: Structured Knowledge",
    metaphorEggDesc: "An \"egg\" is a living, topic-specific knowledge tree in your Obsidian vault. Each egg contains defined scopes, key questions, and an organized hierarchy of concepts you actually care about.",
    metaphorHatchTitle: "The Hatch: Novelty Synthesis",
    metaphorHatchDesc: "AI compares incoming nuts against your existing eggs. Instead of dumping duplicate notes into your vault, NutEgg isolates the novel deltas and weaves them directly into your knowledge structure.",

    // How It Works
    howTitle: "How It Works",
    howSubtitle: "From browsing the open web to curated Obsidian knowledge in seconds.",
    step1Title: "Open NutEgg on Any Webpage",
    step1Desc: "Click the extension icon to summon the side panel. NutEgg automatically grabs the article text, X thread, or YouTube transcript for the active tab.",
    step2Title: "Instant Anti-Clickbait & Summary",
    step2Desc: "Get a direct 1-sentence answer to the title's hook, a 3-sentence executive summary, and an explicit \"Should You Read It?\" verdict.",
    step3Title: "AI Evaluates Against Your Existing Vault",
    step3Desc: "Your local Obsidian plugin matches the content against your _index.md eggs. It highlights truly new ideas while filtering out what you already know.",
    step4Title: "Hatch or Collect",
    step4Desc: "Click 🥚 Hatch Egg to weave insights directly into your matching knowledge tree, or 🌰 Collect Nut to archive the raw content for future reference.",

    // Features
    featTitle: "Built for Information Clarity",
    featSubtitle: "Everything you need to beat digital overload and stop bookmark hoarding.",
    feat0Title: "Anti-Clickbait Verdicts",
    feat0Desc: "Cuts through clickbait titles immediately by answering the headline's core question upfront so you don't waste 15 minutes finding it.",
    feat1Title: "Timestamped Chapter Maps",
    feat1Desc: "Extracts full YouTube transcripts and interactive chapter buttons that let you jump to the exact moment in video playback with one click.",
    feat2Title: "Novelty-First AI Analysis",
    feat2Desc: "Prevents redundant notes. Compares content against your existing knowledge and highlights only what's new and genuinely insightful.",
    feat3Title: "100% Local & Private",
    feat3Desc: "No centralized servers. Your notes and browsing stay entirely on your machine. The Chrome extension talks directly to your local Obsidian app.",
    feat4Title: "Bring Your Own Model",
    feat4Desc: "Run completely offline with Local LLMs (Ollama, LM Studio, llama.cpp), or connect to Gemini, Claude, OpenAI, DeepSeek, Kimi, Qwen, or OpenRouter.",
    feat5Title: "Chrome-Only Standalone Mode",
    feat5Desc: "No Obsidian installed? No problem. Run NutEgg standalone directly in Google Chrome for fast reading verdicts, timestamped video Q&A, and interactive mind maps powered by your own API key.",
    feat6Title: "Video Q&A & Timestamp Jumping",
    feat6Desc: "Ask free-form questions about video content and receive cited answers with interactive timestamp pills that jump directly to the exact moment in video playback.",
    feat7Title: "Auto-Merge Knowledge Trees",
    feat7Desc: "Accumulated raw insights are automatically structured and synthesized into clean branch hierarchies once threshold counts are reached.",

    // Expectations
    expTitle: "What You Should Not Expect",
    expSubtitle: "Honest boundaries on where NutEgg excels and what it is not designed for.",
    exp0: "<strong>No magic buttons:</strong> You won't get smarter just by clicking a button. Truly mastering knowledge still requires active reading, critical thinking, and deliberate practice.",
    exp1: "<strong>Built for fluff & clickbait, not deep textbooks:</strong> NutEgg shines at saving time on bloated videos, repetitive posts, and AI-inflated articles. It is not intended for processing comprehensive textbooks or full online courses into instant expertise.",
    exp2: "<strong>Not tailored for entertainment:</strong> NutEgg is built for density and insight extraction, not for summarizing comedy, films, or entertainment videos.",
    exp3: "<strong>Work in progress:</strong> Support for podcasts, PDF files, and additional specialized extractors is actively under development.",

    // CTA & Footer
    ctaTitle: "Start Hatching Knowledge Today",
    ctaSubtitle: "Take back your reading time and build an Obsidian knowledge base that actually grows with you.",
    footerText: "NutEgg — Read less, hatch more. GNU GPLv3 Licensed.",
    footerDocs: "Docs",
    footerPrivacy: "Privacy Policy",

    // Docs common
    docsHeaderTitle: "NutEgg Docs",
    backToWebsite: "← Back to Website",
    sidebarGettingStarted: "Getting Started",
    sidebarOverview: "Overview & Core Concepts",
    sidebarChrome: "Chrome Extension",
    sidebarObsidian: "Obsidian Plugin",
    sidebarKnowledge: "Knowledge Structuring",
    sidebarWorkflow: "AI Workflow Engine",
    sidebarResources: "Resources",
  },

  zh: {
    // Nav
    navTour: "产品体验",
    navMetaphor: "核心隐喻",
    navHowItWorks: "工作原理",
    navFeatures: "功能特性",
    navExpectations: "预期与边界",
    navDocs: "使用文档",
    navGitHub: "GitHub",
    navGetStarted: "立即开始",
    langToggle: "EN",

    // Hero
    heroBadgeNut: "🌰 Nut: 原始素材捕获",
    heroBadgeEgg: "🥚 Egg: 结构化知识树",
    heroTitle: "少读水文。精炼知识。<br><span class=\"gradient-text\">节省时间。</span>",
    heroSubtitle: "NutEgg 是连接网页浏览与 Obsidian 本地知识库的开源、隐私优先桥梁。可在 Chrome 中独立运行以获得即时视频 Q&A、思维导图和阅读判断；更可与 Obsidian 配套联动，按知识增量自动整理沉淀知识树。",
    chromeStoreBtn: "Chrome 应用商店",
    obsidianPluginBtn: "Obsidian 插件",
    readDocsBtn: "📖 阅读文档",
    starGitHubBtn: "⭐ GitHub 点赞",
    bannerTitleText: "youtube.com/watch?v=... — NutEgg 侧边栏",

    // Showcase
    tourBadge: "✨ 交互式产品导览",
    tourTitle: "为信息清晰度而生",
    tourSubtitle: "了解 NutEgg 如何将冗长庞杂的网页与视频转化为结构化、高价值的知识资产。",
    tab0: "反标题党直答",
    tab1: "问答与时间跳转",
    tab2: "思维导图",
    tab3: "跳过已知冗余",
    tab4: "知识树生长",
    tab5: "多源格式支持",

    slide0Tag: "🎯 反标题党结论直答",
    slide0Title: "一句话核心直答与精读建议",
    slide0Desc: "NutEgg 直击重点：用一句简明有力的话直接回答标题疑问，并客观告知这篇内容是否值得你投入时间阅读。",

    slide1Tag: "⏱️ 即时视频时间定位",
    slide1Title: "随心提问并一键跳转时间戳",
    slide1Desc: "针对视频内容自由提问，AI 会给出标明出处的精准回答，点击时间标签即可直接定位跳转到视频对应播放时刻。",

    slide2Tag: "🧠 层次化结构脉络",
    slide2Title: "交互式概念思维树",
    slide2Desc: "将长达数小时的视频和万字长文拆解为可折叠的多层级思维导图。几秒钟内理清核心要点与逻辑层次。",

    slide3Tag: "⚡ 增量优先评判",
    slide3Title: "跳过你已掌握的已知知识",
    slide3Desc: "NutEgg 自动比对网页内容与你的 Obsidian 知识库，如果内容已被记录则直接提醒，每条视频为你节省 15 到 30 分钟。",

    slide4Tag: "🌳 持续演进的长青知识树",
    slide4Title: "让 Obsidian 知识库自然生长",
    slide4Desc: "精准提取浏览所得的全新增量知识，自动织入 Obsidian 中对应 Egg 文件的层级分支下，无需手动排版整理。",

    slide5Tag: "🌐 全面兼容与多语言",
    slide5Title: "跨平台提取，原生语言呈现",
    slide5Desc: "无损提取 YouTube 音视频文稿、Substack 通讯、Medium 博客及 X (Twitter) 长推文，支持实时总结并输出为数十种语言。",

    // Metaphor
    metaphorTitle: "核心隐喻：Nut 与 Egg",
    metaphorSubtitle: "直观易懂的个人知识管理心智模型。",
    metaphorNutTitle: "🌰 The Nut (原始素材)",
    metaphorNutDesc: "在浏览遇到感兴趣的文章、长推文或 YouTube 视频时，NutEgg 将原始内容提取为\"Nut\"，包含完整元数据、时间戳及上下文，完整存入库中 nutegg/_raw/。",
    metaphorEggTitle: "🥚 The Egg (结构化知识树)",
    metaphorEggDesc: "\"Egg\" 是存储在 Obsidian 库中活生生的领域知识树。每个 Egg 拥有明确的关注范畴、核心问题及有机的概念层级。",
    metaphorHatchTitle: "🐣 The Hatch (知识孵化与合成)",
    metaphorHatchDesc: "AI 将新提取的 Nut 与已有 Egg 进行知识比对。不再往库里堆积重复废弃笔记，而是精准提炼增量并将其编织入知识结构中。",

    // How It Works
    howTitle: "工作原理",
    howSubtitle: "只需数秒，从公网浏览到知识库沉淀。",
    step1Title: "在任意网页打开 NutEgg",
    step1Desc: "点击扩展图标唤出侧边栏。NutEgg 自动提取当前标签页的文章正文、X 长推文或 YouTube 视频文稿。",
    step2Title: "瞬间获得直答与摘要",
    step2Desc: "获得针对标题的一句话直接解答、3 句话核心提炼，以及明确的\"值得精读吗？\"判断。",
    step3Title: "AI 联动比对已有知识库",
    step3Desc: "本地 Obsidian 插件自动将内容与 _index.md 中的 Egg 主题比对，高亮真正的全新增量，过滤掉已知信息。",
    step4Title: "孵化沉淀或仅作归档",
    step4Desc: "点击 🥚 孵化 Egg 将新见解自动写入知识树；或点击 🌰 归档素材将原始抓取保存在库中备查。",

    // Features
    featTitle: "为信息清晰度而生",
    featSubtitle: "告别信息过载与书签囤积症，助你建立真正属于自己的知识体系。",
    feat0Title: "反标题党结论直答",
    feat0Desc: "开门见山直接回答标题提出的问题，无需为了寻找答案而在冗余内容中浪费 15 分钟。",
    feat1Title: "带时间戳的章节脉络",
    feat1Desc: "提取 YouTube 完整文稿并生成交互式章节按钮，点击即可直达视频播放的具体时刻。",
    feat2Title: "增量优先 AI 比对",
    feat2Desc: "杜绝重复冗余笔记。将新内容与已有知识库比对，仅提取真正全新且有深度的洞察。",
    feat3Title: "100% 本地与隐私保障",
    feat3Desc: "无中心化服务器。您的笔记与浏览数据完全留存在本地设备上。Chrome 扩展直接与本地 Obsidian 插件通信。",
    feat4Title: "自带模型，自由选择",
    feat4Desc: "支持通过本地大模型（Ollama、LM Studio、llama.cpp）完全离线运行；亦可连接 Gemini、Claude、OpenAI、DeepSeek、Kimi、通义千问或 OpenRouter。",
    feat5Title: "Chrome 独立运行模式",
    feat5Desc: "未安装 Obsidian？没问题。NutEgg 支持直接在 Google Chrome 中独立运行，配置 API Key 即可享受快速阅读判断、视频 Q&A 与思维导图。",
    feat6Title: "视频问答与精准时间跳转",
    feat6Desc: "针对音视频内容自由发问，获取带精准出处引用的解答，点击时间胶囊立即跳转到视频对应帧。",
    feat7Title: "知识树智能自动合并",
    feat7Desc: "积累的原始零散洞察在达到阈值后，AI 将自动分析并重组成层级清晰、脉络分明的知识树结构。",

    // Expectations
    expTitle: "预期与边界说明",
    expSubtitle: "坦诚说明 NutEgg 的擅长领域以及它不适用的场景。",
    exp0: "<strong>没有一键变聪明的魔法：</strong> 点击按钮无法代替思考。真正掌握知识依然需要主动阅读、批判性思考与实践内化。",
    exp1: "<strong>专为水文与标题党设计，而非精深教材：</strong> NutEgg 擅长在注水视频、套话帖子和 AI 废话文章中为你节省时间，并不适合将大部头教材或在线网课直接变为知识。",
    exp2: "<strong>不适用于娱乐消遣内容：</strong> NutEgg 旨在提取高密度信息，不适合用于解说相声、搞笑喜剧或电影娱乐视频。",
    exp3: "<strong>持续迭代中：</strong> 播客音频、PDF 文件及更多专业提取器目前正在紧锣密鼓开发中。",

    // CTA & Footer
    ctaTitle: "今天就开始精炼属于你的知识树",
    ctaSubtitle: "夺回属于你的阅读时间，构建真正与你一同生长的 Obsidian 知识库。",
    footerText: "NutEgg — 少读水文，精炼知识。遵循 GNU GPLv3 开源协议。",
    footerDocs: "使用文档",
    footerPrivacy: "隐私政策",

    // Docs common
    docsHeaderTitle: "NutEgg 文档",
    backToWebsite: "← 返回官网首页",
    sidebarGettingStarted: "快速入门",
    sidebarOverview: "概述与核心概念",
    sidebarChrome: "Chrome 扩展",
    sidebarObsidian: "Obsidian 插件",
    sidebarKnowledge: "知识结构化",
    sidebarWorkflow: "AI 工作流引擎",
    sidebarResources: "相关资源",
  },
};

let currentWebLang = "en";

function initWebI18n() {
  // Check URL param first ?lang=zh / ?lang=en
  const urlParams = new URLSearchParams(window.location.search);
  const langParam = urlParams.get("lang");
  
  if (langParam === "zh" || langParam === "zh-CN") {
    currentWebLang = "zh";
  } else if (langParam === "en") {
    currentWebLang = "en";
  } else {
    // Check localStorage
    const saved = localStorage.getItem("nutegg_lang");
    if (saved === "zh" || saved === "en") {
      currentWebLang = saved;
    } else {
      // Auto detect
      currentWebLang = (navigator.language || "en").toLowerCase().startsWith("zh") ? "zh" : "en";
    }
  }

  applyWebI18n();
}

function setWebLanguage(lang) {
  currentWebLang = lang === "zh" ? "zh" : "en";
  try {
    localStorage.setItem("nutegg_lang", currentWebLang);
  } catch {}
  applyWebI18n();
}

function tWeb(key) {
  const dict = websiteTranslations[currentWebLang] || websiteTranslations.en;
  return dict[key] || websiteTranslations.en[key] || key;
}

function applyWebI18n() {
  document.documentElement.lang = currentWebLang === "zh" ? "zh-CN" : "en";

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key) {
      el.textContent = tWeb(key);
    }
  });

  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    const key = el.getAttribute("data-i18n-html");
    if (key) {
      el.innerHTML = tWeb(key);
    }
  });

  // Update language toggle button text
  const toggleBtn = document.getElementById("lang-toggle-btn");
  if (toggleBtn) {
    toggleBtn.innerHTML = `🌐 ${currentWebLang === "zh" ? "EN" : "中文"}`;
    toggleBtn.title = currentWebLang === "zh" ? "Switch to English" : "切换为中文";
  }
}

// Attach listener on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  initWebI18n();

  const toggleBtn = document.getElementById("lang-toggle-btn");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const nextLang = currentWebLang === "zh" ? "en" : "zh";
      setWebLanguage(nextLang);
    });
  }
});
