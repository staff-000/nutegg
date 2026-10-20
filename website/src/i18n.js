/**
 * NutEgg Website i18n
 * Supports 10 languages without translating "NutEgg"
 */

const websiteTranslations = {
  en: {
    languageLabel: "Language",
    downloadChromeZipHint: "Download standalone .zip for Chrome",
    githubAssetsHint: "Get release assets from GitHub",
    promoVideoTitle: "NutEgg Promo Video",
    previousScreenshot: "Previous screenshot",
    nextScreenshot: "Next screenshot",
    chromeLogo: "Chrome Logo",
    obsidianLogo: "Obsidian Logo",
    nuteggIcon: "NutEgg icon",
    websiteTitle: "NutEgg — AI Reading Companion for Chrome · Read Less, Save Time",

    navTour: 'Product Tour',
    navMetaphor: 'The Metaphor',
    navHowItWorks: 'How It Works',
    navFeatures: 'Features',
    navExpectations: 'Expectations',
    navDocs: 'Documentation',
    navGitHub: 'GitHub',
    navGetStarted: 'Get Started',
    langToggle: '中文',
    heroTitle: 'Read Less. Hatch More.<br><span class="gradient-text">Save Time.</span>',
    heroSubtitle:
      "NutEgg is an AI reading companion that lives in Chrome's side panel. Get instant verdicts, summaries, mind maps, and timestamped video Q&A for any article, thread, or YouTube video—using your own AI model, with no account required.",
    chromeStoreBtn: 'Chrome Web Store',
    obsidianPluginBtn: 'Obsidian Plugin',
    downloadGithubZip: '📦 Download .zip',
    downloadGithubPlugin: '📦 GitHub Release',
    githubReleases: 'GitHub Releases',
    readDocsBtn: '📖 Read Docs',
    starGitHubBtn: '⭐ Star on GitHub',
    watchVideoBtn: '🎬 Watch Promo',
    videoBadge: '🎬 Promo Video',
    videoTitle: 'See NutEgg in Action',
    videoSubtitle:
      'Watch how NutEgg turns bloated web browsing into clean, structured knowledge in your Obsidian vault.',
    videoBannerTitle: 'youtube.com/watch?v=_u6mDoHZSAo — NutEgg Promo',
    bannerTitleText: 'youtube.com/watch?v=... — NutEgg Side Panel',
    tourBadge: '✨ Interactive Product Tour',
    tourTitle: 'Designed for Information Clarity',
    tourSubtitle: 'Turn bloated web content into structured, actionable knowledge.',
    tab0: 'Anti-Clickbait',
    tab1: 'Q&A & Timestamps',
    tab2: 'Mind Map',
    tab3: 'Skip Redundant',
    tab4: 'Grow Knowledge',
    tab5: 'Multi-Source',
    slide0Tag: '🎯 Anti-Clickbait Verdict',
    slide0Title: 'Instant Summary & Title Verdict',
    slide0Desc:
      "NutEgg cuts straight to the point: it answers the headline's core question in one punchy sentence and tells you honestly whether the video or article is worth your time.",
    slide1Tag: '⏱️ Instant Video Navigation',
    slide1Title: 'Ask Any Question & Jump to Timestamp',
    slide1Desc:
      'Ask free-form questions about video content and get cited answers with clickable timestamp pills that jump directly to the exact moment in the video playback.',
    slide2Tag: '🧠 Hierarchical Breakdown',
    slide2Title: 'Interactive Thought Trees',
    slide2Desc:
      'Turn hour-long videos and complex articles into collapsible, multi-tier mind maps. Expand key takeaways and visualize idea relationships in seconds.',
    slide3Tag: '🧩 Obsidian Add-on · Novelty Check',
    slide3Title: 'Skip What You Already Know',
    slide3Desc:
      'NutEgg checks incoming content against your Obsidian vault knowledge base and alerts you when ideas are already covered—saving you 15 to 30 minutes per video.',
    slide4Tag: '🧩 Obsidian Add-on · Knowledge Trees',
    slide4Title: 'Automatically Grow Your Obsidian Vault',
    slide4Desc:
      'Isolates the novel deltas from your browsing and weaves them directly under the right branches of your existing Obsidian egg files without manual note formatting.',
    slide5Tag: '🌐 Universal Compatibility',
    slide5Title: 'Any Platform, In Your Native Language',
    slide5Desc:
      'Extract with full fidelity from YouTube transcripts, Substack newsletters, Medium blogs, and X (Twitter) threads. Summarize and translate into 50+ languages on the fly.',
    metaphorTitle: 'The Metaphor: Nuts & Eggs',
    metaphorSubtitle: 'A sensible, intuitive mental model for personal knowledge management.',
    metaphorNutTitle: 'The Nut: Raw Captures',
    metaphorNutDesc:
      'Whenever you find an interesting article, tweet thread, or YouTube video, NutEgg extracts its raw content into a "nut". Complete with metadata, timestamps, and full context stored safely in nutegg/_raw/.',
    metaphorEggTitle: 'The Egg: Structured Knowledge',
    metaphorEggDesc:
      'An "egg" is a living, topic-specific knowledge tree in your Obsidian vault. Each egg contains defined scopes, key questions, and an organized hierarchy of concepts you actually care about.',
    metaphorHatchTitle: 'The Hatch: Novelty Synthesis',
    metaphorHatchDesc:
      'AI compares incoming nuts against your existing eggs. Instead of dumping duplicate notes into your vault, NutEgg isolates the novel deltas and weaves them directly into your knowledge structure.',
    howTitle: 'How It Works',
    howSubtitle: 'From any webpage to clear answers in seconds—right inside Chrome.',
    step1Title: 'Add NutEgg to Chrome',
    step1Desc:
      'Install it from the Chrome Web Store, then pick your AI in Options—Gemini, Claude, OpenAI, DeepSeek, or a local model. No sign-up needed.',
    step2Title: 'Open the Side Panel on Any Page',
    step2Desc:
      'Click the extension icon. NutEgg automatically grabs the article text, X thread, or YouTube transcript from the active tab.',
    step3Title: 'Get the Verdict in Seconds',
    step3Desc:
      'See a direct 1-sentence answer to the title\'s hook, a short executive summary, a collapsible mind map, and an honest "Is it worth your time?" verdict.',
    step4Title: 'Ask, Explore, Jump',
    step4Desc:
      'Ask follow-up questions grounded in the page—or beyond it for fact-checking—and click any citation to jump to the exact video moment or paragraph.',
    featTitle: 'Built for Information Clarity',
    featSubtitle: 'Everything you need to beat digital overload and stop bookmark hoarding.',
    feat0Title: 'Anti-Clickbait Verdicts',
    feat0Desc:
      "Cuts through clickbait titles immediately by answering the headline's core question upfront so you don't waste 15 minutes finding it.",
    feat1Title: 'Mind Maps with Clickable Timestamps',
    feat1Desc:
      'Extracts full YouTube transcripts and creates mind maps with clickable timestamps that jump to the exact moment in video playback.',
    feat2Title: 'Novelty-First AI Analysis',
    feat2Desc:
      "Prevents redundant notes. Compares content against your existing knowledge and highlights only what's new and genuinely insightful.",
    feat3Title: 'Private by Design',
    feat3Desc:
      'No NutEgg account and no NutEgg servers. Your API key stays in your browser, and page content goes only to the AI provider you choose.',
    feat4Title: 'Bring Your Own Model',
    feat4Desc:
      'Run completely offline with Local LLMs (Ollama, LM Studio, llama.cpp), or connect to Gemini, Claude, OpenAI, DeepSeek, Kimi, Qwen, or OpenRouter.',
    feat6Title: 'Video Q&A & Timestamp Jumping',
    feat6Desc:
      'Ask free-form questions about video content and receive cited answers with interactive timestamp pills that jump directly to the exact moment in video playback.',
    feat7Title: 'Auto-Merge Knowledge Trees',
    feat7Desc:
      'Accumulated raw insights are automatically structured and synthesized into clean branch hierarchies once threshold counts are reached.',
    expTitle: 'What You Should Not Expect',
    expSubtitle: 'Honest boundaries on where NutEgg excels and what it is not designed for.',
    exp0: "<strong>No magic buttons:</strong> You won't get smarter just by clicking a button. Truly mastering knowledge still requires active reading, critical thinking, and deliberate practice.",
    exp1: '<strong>Built for fluff & clickbait, not deep textbooks:</strong> NutEgg shines at saving time on bloated videos, repetitive posts, and AI-inflated articles. It is not intended for processing comprehensive textbooks or full online courses into instant expertise.',
    exp2: '<strong>Not tailored for entertainment:</strong> NutEgg is built for density and insight extraction, not for summarizing comedy, films, or entertainment videos.',
    exp3: '<strong>Work in progress:</strong> Support for podcasts, PDF files, and additional specialized extractors is actively under development.',
    ctaTitle: 'Start Reading Smarter Today',
    ctaSubtitle:
      "Take back your reading time in seconds. Add NutEgg to Chrome—and connect Obsidian whenever you're ready.",
    footerText: 'NutEgg — Read less, hatch more. GNU GPLv3 Licensed.',
    footerDocs: 'Docs',
    footerPrivacy: 'Privacy Policy',
    docsHeaderTitle: 'NutEgg Docs',
    backToWebsite: '← Back to Website',
    sidebarGettingStarted: 'Getting Started',
    sidebarOverview: 'Overview & Core Concepts',
    sidebarChrome: 'Chrome Extension',
    sidebarObsidian: 'Obsidian Plugin',
    sidebarKnowledge: 'Knowledge Structuring',
    sidebarWorkflow: 'AI Workflow Engine',
    sidebarResources: 'Resources',
    navObsidian: 'Obsidian Add-on',
    heroBadge: '🧩 Free & Open-Source Chrome Extension',
    heroAddonNote: 'Use Obsidian? Add the optional plugin to grow a personal knowledge vault →',
    addToChromeBtn: "Add to Chrome — It's Free",
    featScopeTitle: 'Within or Beyond the Page',
    featScopeDesc:
      'Keep answers strictly grounded in the content, or let the AI reach beyond it to fact-check claims and add missing context.',
    featDiscussTitle: 'Comment Section Digest',
    featDiscussDesc:
      "Summarizes YouTube, Reddit, and forum comments into key topics with agree/disagree stance badges, so you get the crowd's take at a glance.",
    featSourceTitle: 'Click-to-Source Navigation',
    featSourceDesc:
      'Mind-map nodes and answers link back to their source—click to scroll the live page to the exact paragraph or comment.',
    addonBadge: 'Optional Add-on',
    addonTitle: 'Use Obsidian? Let NutEgg Grow Your Vault',
    addonSubtitle:
      'Everything above works on its own in Chrome. Pair NutEgg with its free Obsidian plugin to turn what you read into an evolving, structured knowledge base.',
    addonHatchTitle: 'One-Click Hatch or Collect',
    addonHatchDesc:
      'Weave fresh insights into the matching knowledge tree, or archive the raw content as Markdown in your vault for later.',
    addonGuideBtn: '📖 Obsidian Setup Guide',
  },
  zh: {
    languageLabel: "语言",
    downloadChromeZipHint: "下载 Chrome 独立扩展 .zip",
    githubAssetsHint: "从 GitHub 获取发布文件",
    promoVideoTitle: "NutEgg 宣传视频",
    previousScreenshot: "上一张截图",
    nextScreenshot: "下一张截图",
    chromeLogo: "Chrome 标志",
    obsidianLogo: "Obsidian 标志",
    nuteggIcon: "NutEgg 图标",
    websiteTitle: "NutEgg — Chrome AI 阅读助手 · 少读一点，多省时间",

    navTour: '产品体验',
    navMetaphor: '核心隐喻',
    navHowItWorks: '工作原理',
    navFeatures: '功能特性',
    navExpectations: '预期与边界',
    navDocs: '使用文档',
    navGitHub: 'GitHub',
    navGetStarted: '立即开始',
    langToggle: 'EN',
    heroTitle: '少读水文。精炼知识。<br><span class="gradient-text">节省时间。</span>',
    heroSubtitle:
      'NutEgg 是常驻 Chrome 侧边栏的 AI 阅读助手。无论文章、长推文还是 YouTube 视频，都能即时获得阅读判断、核心摘要、思维导图和带时间戳的视频问答——使用你自己的 AI 模型，无需注册账号。',
    chromeStoreBtn: 'Chrome 应用商店',
    obsidianPluginBtn: 'Obsidian 插件',
    downloadGithubZip: '📦 下载 .zip',
    downloadGithubPlugin: '📦 GitHub Release 发布页',
    githubReleases: 'GitHub 发布页',
    readDocsBtn: '📖 阅读文档',
    starGitHubBtn: '⭐ GitHub 点赞',
    watchVideoBtn: '🎬 观看宣传片',
    videoBadge: '🎬 官方宣传片',
    videoTitle: '查看 NutEgg 实际演示',
    videoSubtitle: '观看 NutEgg 如何将冗长网页转化为精炼洞察，并自动沉淀至 Obsidian 知识库。',
    videoBannerTitle: 'youtube.com/watch?v=_u6mDoHZSAo — NutEgg 宣传视频',
    bannerTitleText: 'youtube.com/watch?v=... — NutEgg 侧边栏',
    tourBadge: '✨ 交互式产品导览',
    tourTitle: '为信息清晰度而生',
    tourSubtitle: '将冗长庞杂的网页内容转化为结构化、高价值的知识。',
    tab0: '反标题党直答',
    tab1: '问答与时间跳转',
    tab2: '思维导图',
    tab3: '跳过已知冗余',
    tab4: '知识树生长',
    tab5: '多源格式支持',
    slide0Tag: '🎯 反标题党结论直答',
    slide0Title: '一句话核心直答与精读建议',
    slide0Desc: 'NutEgg 直击重点：用一句简明有力的话直接回答标题疑问，并客观告知这篇内容是否值得你投入时间阅读。',
    slide1Tag: '⏱️ 即时视频时间定位',
    slide1Title: '随心提问并一键跳转时间戳',
    slide1Desc: '针对视频内容自由提问，AI 会给出标明出处的精准回答，点击时间标签即可直接定位跳转到视频对应播放时刻。',
    slide2Tag: '🧠 层次化结构脉络',
    slide2Title: '交互式概念思维树',
    slide2Desc: '将长达数小时的视频和万字长文拆解为可折叠的多层级思维导图。几秒钟内理清核心要点与逻辑层次。',
    slide3Tag: '🧩 Obsidian 扩展 · 增量检测',
    slide3Title: '跳过你已掌握的已知知识',
    slide3Desc:
      'NutEgg 自动比对网页内容与你的 Obsidian 知识库，如果内容已被记录则直接提醒，每条视频为你节省 15 到 30 分钟。',
    slide4Tag: '🧩 Obsidian 扩展 · 知识树',
    slide4Title: '让 Obsidian 知识库自然生长',
    slide4Desc: '精准提取浏览所得的全新增量知识，自动织入 Obsidian 中对应 Egg 文件的层级分支下，无需手动排版整理。',
    slide5Tag: '🌐 全面兼容与多语言',
    slide5Title: '跨平台提取，原生语言呈现',
    slide5Desc:
      '无损提取 YouTube 音视频文稿、Substack 通讯、Medium 博客及 X (Twitter) 长推文，支持实时总结并输出为数十种语言。',
    metaphorTitle: '核心隐喻：Nut 与 Egg',
    metaphorSubtitle: '直观易懂的个人知识管理心智模型。',
    metaphorNutTitle: '🌰 The Nut (原始素材)',
    metaphorNutDesc:
      '在浏览遇到感兴趣的文章、长推文或 YouTube 视频时，NutEgg 将原始内容提取为"Nut"，包含完整元数据、时间戳及上下文，完整存入库中 nutegg/_raw/。',
    metaphorEggTitle: '🥚 The Egg (结构化知识树)',
    metaphorEggDesc:
      '"Egg" 是存储在 Obsidian 库中活生生的领域知识树。每个 Egg 拥有明确的关注范畴、核心问题及有机的概念层级。',
    metaphorHatchTitle: '🐣 The Hatch (知识孵化与合成)',
    metaphorHatchDesc:
      'AI 将新提取的 Nut 与已有 Egg 进行知识比对。不再往库里堆积重复废弃笔记，而是精准提炼增量并将其编织入知识结构中。',
    howTitle: '工作原理',
    howSubtitle: '从任意网页到清晰答案，只需数秒——全程在 Chrome 中完成。',
    step1Title: '将 NutEgg 添加到 Chrome',
    step1Desc:
      '从 Chrome 应用商店安装，然后在设置中选择 AI 服务——Gemini、Claude、OpenAI、DeepSeek 或本地模型均可，无需注册。',
    step2Title: '在任意网页打开侧边栏',
    step2Desc: '点击扩展图标。NutEgg 会自动提取当前标签页的文章正文、X 长推文或 YouTube 视频文稿。',
    step3Title: '数秒内获得阅读判断',
    step3Desc: '立即看到针对标题的一句话直答、简明核心摘要、可折叠的思维导图，以及坦诚的"值得花时间吗？"判断。',
    step4Title: '追问、探索、一键跳转',
    step4Desc: '可基于页面内容追问，也可超出页面进行事实核查；点击任意引用即可跳转到视频对应时刻或原文段落。',
    featTitle: '为信息清晰度而生',
    featSubtitle: '告别信息过载与书签囤积症，助你建立真正属于自己的知识体系。',
    feat0Title: '反标题党结论直答',
    feat0Desc: '开门见山直接回答标题提出的问题，无需为了寻找答案而在冗余内容中浪费 15 分钟。',
    feat1Title: '带可点击时间戳的思维导图',
    feat1Desc: '提取 YouTube 完整文稿并生成带可点击时间戳的思维导图，点击即可跳转至视频中的具体时刻。',
    feat2Title: '增量优先 AI 比对',
    feat2Desc: '杜绝重复冗余笔记。将新内容与已有知识库比对，仅提取真正全新且有深度的洞察。',
    feat3Title: '隐私优先设计',
    feat3Desc:
      '无需 NutEgg 账号，没有 NutEgg 服务器。API Key 仅保存在你的浏览器中，页面内容只发送给你选择的 AI 服务商。',
    feat4Title: '自带模型，自由选择',
    feat4Desc:
      '支持通过本地大模型（Ollama、LM Studio、llama.cpp）完全离线运行；亦可连接 Gemini、Claude、OpenAI、DeepSeek、Kimi、通义千问或 OpenRouter。',
    feat6Title: '视频问答与精准时间跳转',
    feat6Desc: '针对音视频内容自由发问，获取带精准出处引用的解答，点击时间胶囊立即跳转到视频对应帧。',
    feat7Title: '知识树智能自动合并',
    feat7Desc: '积累的原始零散洞察在达到阈值后，AI 将自动分析并重组成层级清晰、脉络分明的知识树结构。',
    expTitle: '预期与边界说明',
    expSubtitle: '坦诚说明 NutEgg 的擅长领域以及它不适用的场景。',
    exp0: '<strong>没有一键变聪明的魔法：</strong> 点击按钮无法代替思考。真正掌握知识依然需要主动阅读、批判性思考与实践内化。',
    exp1: '<strong>专为水文与标题党设计，而非精深教材：</strong> NutEgg 擅长在注水视频、套话帖子和 AI 废话文章中为你节省时间，并不适合将大部头教材或在线网课直接变为知识。',
    exp2: '<strong>不适用于娱乐消遣内容：</strong> NutEgg 旨在提取高密度信息，不适合用于解说相声、搞笑喜剧或电影娱乐视频。',
    exp3: '<strong>持续迭代中：</strong> 播客音频、PDF 文件及更多专业提取器目前正在紧锣密鼓开发中。',
    ctaTitle: '今天就开始更聪明地阅读',
    ctaSubtitle: '数秒内夺回你的阅读时间。先将 NutEgg 添加到 Chrome，准备好后再随时连接 Obsidian。',
    footerText: 'NutEgg — 少读水文，精炼知识。遵循 GNU GPLv3 开源协议。',
    footerDocs: '使用文档',
    footerPrivacy: '隐私政策',
    docsHeaderTitle: 'NutEgg 文档',
    backToWebsite: '← 返回官网首页',
    sidebarGettingStarted: '快速入门',
    sidebarOverview: '概述与核心概念',
    sidebarChrome: 'Chrome 扩展',
    sidebarObsidian: 'Obsidian 插件',
    sidebarKnowledge: '知识结构化',
    sidebarWorkflow: 'AI 工作流引擎',
    sidebarResources: '相关资源',
    navObsidian: 'Obsidian 扩展',
    heroBadge: '🧩 免费开源的 Chrome 扩展',
    heroAddonNote: '在用 Obsidian？加装可选插件，打造持续生长的个人知识库 →',
    addToChromeBtn: '免费添加到 Chrome',
    featScopeTitle: '页面内或页面外，随你选',
    featScopeDesc: '既可让回答严格基于页面内容，也可让 AI 超出原文进行事实核查、补充缺失的背景信息。',
    featDiscussTitle: '评论区观点速览',
    featDiscussDesc: '将 YouTube、Reddit 及论坛评论归纳为核心话题，并标注赞同/反对立场，一眼看清大家怎么说。',
    featSourceTitle: '一键溯源定位',
    featSourceDesc: '思维导图节点和回答都链接到原文出处——点击即可在页面中滚动到对应段落或评论。',
    addonBadge: '可选扩展',
    addonTitle: '在用 Obsidian？让 NutEgg 帮你的知识库生长',
    addonSubtitle:
      '以上所有功能在 Chrome 中即可独立使用。搭配免费的 Obsidian 插件，还能把你读过的内容沉淀为持续演进的结构化知识库。',
    addonHatchTitle: '一键孵化或归档',
    addonHatchDesc: '将新见解编织进对应的知识树，或将原始内容以 Markdown 归档到知识库中备查。',
    addonGuideBtn: '📖 Obsidian 配置指南',
  },
  es: {
    languageLabel: "Idioma",
    downloadChromeZipHint: "Descargar .zip independiente para Chrome",
    githubAssetsHint: "Obtener archivos de la versión en GitHub",
    promoVideoTitle: "Vídeo de presentación de NutEgg",
    previousScreenshot: "Captura anterior",
    nextScreenshot: "Captura siguiente",
    chromeLogo: "Logotipo de Chrome",
    obsidianLogo: "Logotipo de Obsidian",
    nuteggIcon: "Icono de NutEgg",
    websiteTitle: "NutEgg — Asistente de lectura con IA para Chrome · Lee menos, ahorra tiempo",

    navTour: 'Recorrido',
    navMetaphor: 'La metáfora',
    navHowItWorks: 'Cómo funciona',
    navFeatures: 'Características',
    navExpectations: 'Qué esperar',
    navDocs: 'Documentación',
    navGitHub: 'GitHub',
    navGetStarted: 'Comenzar',
    langToggle: 'Español',
    heroTitle: 'Lee menos. Incuba más.<br><span class="gradient-text">Ahorra tiempo.</span>',
    heroSubtitle:
      'NutEgg es un asistente de lectura con IA que vive en el panel lateral de Chrome. Obtén veredictos, resúmenes, mapas mentales y preguntas y respuestas con marcas de tiempo para cualquier artículo, hilo o vídeo de YouTube, con tu propio modelo de IA y sin necesidad de cuenta.',
    chromeStoreBtn: 'Chrome Web Store',
    obsidianPluginBtn: 'Complemento de Obsidian',
    downloadGithubZip: '📦 Descargar .zip',
    downloadGithubPlugin: '📦 GitHub Release',
    githubReleases: 'Releases de GitHub',
    readDocsBtn: '📖 Leer documentación',
    starGitHubBtn: '⭐ Estrella en GitHub',
    watchVideoBtn: '🎬 Ver vídeo promocional',
    videoBadge: '🎬 Vídeo promocional',
    videoTitle: 'Descubre NutEgg en acción',
    videoSubtitle:
      'Observa cómo NutEgg transforma la navegación web en conocimiento estructurado en tu bóveda de Obsidian.',
    videoBannerTitle: 'youtube.com/watch?v=_u6mDoHZSAo — Promo de NutEgg',
    bannerTitleText: 'youtube.com/watch?v=... — Panel lateral de NutEgg',
    tourBadge: '✨ Recorrido interactivo',
    tourTitle: 'Diseñado para la claridad informativa',
    tourSubtitle: 'Convierte el contenido web excesivo en conocimiento estructurado y práctico.',
    tab0: 'Anti-Clickbait',
    tab1: 'Preguntas y marcas',
    tab2: 'Mapa mental',
    tab3: 'Omitir lo conocido',
    tab4: 'Hacer crecer ideas',
    tab5: 'Múltiples fuentes',
    slide0Tag: '🎯 Veredicto anti-clickbait',
    slide0Title: 'Resumen instantáneo y veredicto del título',
    slide0Desc:
      'NutEgg va directo al grano: responde a la pregunta central del titular en una frase contundente y te dice con franqueza si vale la pena dedicarle tiempo.',
    slide1Tag: '⏱️ Navegación instantánea por vídeo',
    slide1Title: 'Haz cualquier pregunta y salta al momento exacto',
    slide1Desc:
      'Haz preguntas abiertas sobre el contenido del vídeo y recibe respuestas fundamentadas con botones de marcas de tiempo que saltan directamente al fragmento en reproducción.',
    slide2Tag: '🧠 Desglose jerárquico',
    slide2Title: 'Árboles de ideas interactivos',
    slide2Desc:
      'Convierte vídeos de una hora y artículos densos en mapas mentales desplegables de múltiples niveles. Explora conclusiones clave y relaciones conceptuales en segundos.',
    slide3Tag: '🧩 Complemento Obsidian · Detección de novedades',
    slide3Title: 'Omite lo que ya sabes',
    slide3Desc:
      'NutEgg compara el contenido entrante con tu base de conocimiento en Obsidian y te avisa cuando las ideas ya están cubiertas, ahorrándote de 15 a 30 minutos por vídeo.',
    slide4Tag: '🧩 Complemento Obsidian · Árboles de conocimiento',
    slide4Title: 'Haz crecer automáticamente tu bóveda de Obsidian',
    slide4Desc:
      'Aísla las novedades de tu navegación y las enlaza directamente bajo las ramas correspondientes de tus archivos egg en Obsidian sin formateo manual.',
    slide5Tag: '🌐 Compatibilidad universal',
    slide5Title: 'Cualquier plataforma, en tu idioma nativo',
    slide5Desc:
      'Extrae con total fidelidad transcripciones de YouTube, boletines de Substack, artículos de Medium y hilos de X (Twitter). Resume y traduce a más de 50 idiomas al instante.',
    metaphorTitle: 'La metáfora: Nuts y Eggs',
    metaphorSubtitle: 'Un modelo mental intuitivo y sensato para la gestión del conocimiento personal.',
    metaphorNutTitle: 'El Nut: Capturas sin procesar',
    metaphorNutDesc:
      'Cada vez que encuentras un artículo, hilo o vídeo interesante, NutEgg extrae su contenido íntegro en un "nut", con metadatos, marcas de tiempo y contexto completo guardado en nutegg/_raw/.',
    metaphorEggTitle: 'El Egg: Conocimiento estructurado',
    metaphorEggDesc:
      'Un "egg" es un árbol de conocimiento vivo y específico en tu bóveda de Obsidian. Cada egg define alcances, preguntas clave y una jerarquía organizada de conceptos que te importan.',
    metaphorHatchTitle: 'El Hatch (Incubación): Síntesis de novedades',
    metaphorHatchDesc:
      'La IA compara los nuts entrantes con tus eggs existentes. En lugar de acumular notas duplicadas, NutEgg aísla los aportes novedosos y los integra en tu estructura de conocimiento.',
    howTitle: 'Cómo funciona',
    howSubtitle: 'De cualquier página web a respuestas claras en segundos, dentro de Chrome.',
    step1Title: 'Añade NutEgg a Chrome',
    step1Desc:
      'Instálalo desde Chrome Web Store y elige tu IA en Opciones: Gemini, Claude, OpenAI, DeepSeek o un modelo local. Sin registro.',
    step2Title: 'Abre el panel lateral en cualquier página',
    step2Desc:
      'Haz clic en el icono de la extensión. NutEgg captura automáticamente el texto, el hilo de X o la transcripción de YouTube de la pestaña activa.',
    step3Title: 'Obtén el veredicto en segundos',
    step3Desc:
      'Recibe una respuesta directa de una frase al gancho del título, un breve resumen ejecutivo, un mapa mental desplegable y un veredicto honesto sobre si merece tu tiempo.',
    step4Title: 'Pregunta, explora y salta',
    step4Desc:
      'Haz preguntas basadas en la página, o más allá de ella para verificar datos, y haz clic en cualquier cita para saltar al momento exacto del vídeo o al párrafo.',
    featTitle: 'Creado para la claridad informativa',
    featSubtitle: 'Todo lo que necesitas para vencer la sobrecarga digital y dejar de acumular marcadores sin leer.',
    feat0Title: 'Veredictos anti-clickbait',
    feat0Desc:
      'Despeja titulares engañosos respondiendo de inmediato a la incógnita central para que no pierdas 15 minutos buscándola.',
    feat1Title: 'Mapas mentales con marcas de tiempo',
    feat1Desc:
      'Extrae transcripciones completas de YouTube y crea mapas mentales con marcas de tiempo para saltar al momento exacto del vídeo.',
    feat2Title: 'Análisis centrado en la novedad',
    feat2Desc:
      'Evita notas redundantes. Compara el contenido con tu conocimiento existente y resalta únicamente las ideas frescas y relevantes.',
    feat3Title: 'Privado por diseño',
    feat3Desc:
      'Sin cuenta de NutEgg ni servidores de NutEgg. Tu clave API se queda en tu navegador y el contenido solo va al proveedor de IA que elijas.',
    feat4Title: 'Usa el modelo de IA que prefieras',
    feat4Desc:
      'Funciona completamente sin conexión con LLMs locales (Ollama, LM Studio, llama.cpp), o conéctalo a Gemini, Claude, OpenAI, DeepSeek, Kimi, Qwen u OpenRouter.',
    feat6Title: 'Preguntas en vídeo y salto a marcas de tiempo',
    feat6Desc:
      'Formula preguntas en lenguaje natural sobre el contenido del vídeo y recibe respuestas con citas y marcas de tiempo interactivas que van al momento exacto.',
    feat7Title: 'Fusión automática de árboles de conocimiento',
    feat7Desc:
      'Las ideas acumuladas se estructuran y sintetizan automáticamente en ramas jerárquicas limpias en cuanto se alcanzan los umbrales configurados.',
    expTitle: 'Qué no debes esperar',
    expSubtitle: 'Límites honestos sobre dónde destaca NutEgg y para qué no está diseñado.',
    exp0: '<strong>Sin fórmulas mágicas:</strong> No te harás más sabio solo con hacer clic en un botón. Asimilar conocimiento sigue exigiendo lectura activa, juicio crítico y práctica continuada.',
    exp1: '<strong>Diseñado para contenido inflado y clickbait, no libros de texto densos:</strong> NutEgg es idóneo para ahorrar tiempo en vídeos diluidos y artículos repetitivos. No está pensado para sintetizar manuales académicos completos ni cursos extensos.',
    exp2: '<strong>No pensado para entretenimiento:</strong> NutEgg prioriza la densidad informativa y las ideas prácticas, no la síntesis de comedias, cine o vídeos de ocio.',
    exp3: '<strong>En constante desarrollo:</strong> La compatibilidad con podcasts, documentos PDF y extractores especializados adicionales está en desarrollo activo.',
    ctaTitle: 'Empieza a leer de forma más inteligente hoy',
    ctaSubtitle: 'Recupera tu tiempo de lectura en segundos. Añade NutEgg a Chrome y conecta Obsidian cuando quieras.',
    footerText: 'NutEgg — Lee menos, incuba más. Licencia GNU GPLv3.',
    footerDocs: 'Documentación',
    footerPrivacy: 'Política de privacidad',
    docsHeaderTitle: 'Documentación de NutEgg',
    backToWebsite: '← Volver al sitio web',
    sidebarGettingStarted: 'Primeros pasos',
    sidebarOverview: 'Visión general y conceptos',
    sidebarChrome: 'Extensión de Chrome',
    sidebarObsidian: 'Complemento de Obsidian',
    sidebarKnowledge: 'Estructuración del conocimiento',
    sidebarWorkflow: 'Motor de flujos de trabajo de IA',
    sidebarResources: 'Recursos',
    navObsidian: 'Complemento Obsidian',
    heroBadge: '🧩 Extensión de Chrome gratuita y de código abierto',
    heroAddonNote: '¿Usas Obsidian? Añade el complemento opcional para hacer crecer tu bóveda de conocimiento →',
    addToChromeBtn: 'Añadir a Chrome — Es gratis',
    featScopeTitle: 'Dentro o más allá de la página',
    featScopeDesc:
      'Mantén las respuestas estrictamente basadas en el contenido, o deja que la IA vaya más allá para verificar afirmaciones y añadir contexto.',
    featDiscussTitle: 'Resumen de comentarios',
    featDiscussDesc:
      'Resume los comentarios de YouTube, Reddit y foros en temas clave con insignias de postura (a favor/en contra) para ver la opinión general de un vistazo.',
    featSourceTitle: 'Navegación hasta la fuente',
    featSourceDesc:
      'Los nodos del mapa mental y las respuestas enlazan con su fuente: haz clic para desplazarte al párrafo o comentario exacto en la página.',
    addonBadge: 'Complemento opcional',
    addonTitle: '¿Usas Obsidian? Deja que NutEgg haga crecer tu bóveda',
    addonSubtitle:
      'Todo lo anterior funciona por sí solo en Chrome. Combina NutEgg con su complemento gratuito de Obsidian para convertir lo que lees en una base de conocimiento estructurada y en evolución.',
    addonHatchTitle: 'Incubar o guardar con un clic',
    addonHatchDesc:
      'Integra las nuevas ideas en el árbol de conocimiento correspondiente o archiva el contenido original en Markdown en tu bóveda.',
    addonGuideBtn: '📖 Guía de configuración de Obsidian',
  },
  ja: {
    languageLabel: "言語",
    downloadChromeZipHint: "Chrome 用の単体 .zip をダウンロード",
    githubAssetsHint: "GitHub からリリースファイルを取得",
    promoVideoTitle: "NutEgg 紹介動画",
    previousScreenshot: "前のスクリーンショット",
    nextScreenshot: "次のスクリーンショット",
    chromeLogo: "Chrome ロゴ",
    obsidianLogo: "Obsidian ロゴ",
    nuteggIcon: "NutEgg アイコン",
    websiteTitle: "NutEgg — Chrome の AI 読書アシスタント · 読む時間を節約",

    navTour: '製品ツアー',
    navMetaphor: 'コアコンセプト',
    navHowItWorks: '仕組み',
    navFeatures: '機能',
    navExpectations: '期待と境界',
    navDocs: 'ドキュメント',
    navGitHub: 'GitHub',
    navGetStarted: '使ってみる',
    langToggle: '日本語',
    heroTitle: '読む量を減らし、より多くを孵化させる。<br><span class="gradient-text">時間を節約する。</span>',
    heroSubtitle:
      'NutEgg は Chrome のサイドパネルで動く AI 読書アシスタントです。記事、スレッド、YouTube 動画の判定・要約・マインドマップ・タイムスタンプ付き動画 Q&A を瞬時に取得。お好みの AI モデルを使い、アカウント登録は不要です。',
    chromeStoreBtn: 'Chrome ウェブストア',
    obsidianPluginBtn: 'Obsidianプラグイン',
    downloadGithubZip: '📦 .zip をダウンロード',
    downloadGithubPlugin: '📦 GitHub リリース',
    githubReleases: 'GitHub リリース',
    readDocsBtn: '📖 ドキュメントを見る',
    starGitHubBtn: '⭐ GitHubでStar',
    watchVideoBtn: '🎬 プロモーション動画を見る',
    videoBadge: '🎬 公式プロモーション動画',
    videoTitle: 'NutEggの動作を動画で確認',
    videoSubtitle: '冗長なWebや動画から本質だけを抽出し、Obsidianに構造化ナレッジとして蓄積する様子をご覧ください。',
    videoBannerTitle: 'youtube.com/watch?v=_u6mDoHZSAo — NutEgg プロモーション',
    bannerTitleText: 'youtube.com/watch?v=... — NutEgg サイドパネル',
    tourBadge: '✨ インタラクティブツアー',
    tourTitle: '情報の明瞭さのために設計',
    tourSubtitle: '冗長なWebコンテンツを構造化された実践的な知識へと変換。',
    tab0: 'クリックベイト対策',
    tab1: 'Q&Aとタイムスタンプ',
    tab2: 'マインドマップ',
    tab3: '既知の内容をスキップ',
    tab4: '知識を育てる',
    tab5: 'マルチソース',
    slide0Tag: '🎯 クリックベイト対策の結論',
    slide0Title: '即時要約とタイトルの結論',
    slide0Desc:
      'NutEggは本質に直結します。見出しの核心的な問いに対して1文で明快に答え、時間を使う価値があるかを正直に示します。',
    slide1Tag: '⏱️ 動画の瞬時ナビゲーション',
    slide1Title: '自由に質問して該当箇所へジャンプ',
    slide1Desc:
      '動画について自由に質問すると、根拠となるタイムスタンプボタン付きで回答が得られ、クリックするだけで該当シーンへジャンプします。',
    slide2Tag: '🧠 階層的な構造化',
    slide2Title: 'インタラクティブな思考ツリー',
    slide2Desc:
      '1時間の動画や長文記事を展開可能な多階層マインドマップに変換。重要ポイントや概念の関係性を一瞬で把握できます。',
    slide3Tag: '🧩 Obsidian アドオン · 新規性チェック',
    slide3Title: '既に知っている内容をスキップ',
    slide3Desc:
      'NutEggはObsidian内の知識と新しいコンテンツを照合し、既にカバーされている内容を検知。動画1本あたり15〜30分の時間を節約します。',
    slide4Tag: '🧩 Obsidian アドオン · ナレッジツリー',
    slide4Title: 'Obsidianの保管庫を自動で成長させる',
    slide4Desc:
      '閲覧内容から新規性のある差分だけを抽出し、既存のEggノートの適切なブランチに自動で組み込みます。手動のノート整理は不要です。',
    slide5Tag: '🌐 普遍的な互換性',
    slide5Title: 'あらゆるプラットフォームをあなたの言語で',
    slide5Desc:
      'YouTube字幕、Substack、Medium、X（Twitter）のスレッドから正確に抽出。50以上の言語へその場で要約・翻訳します。',
    metaphorTitle: 'メタファー：Nuts と Eggs',
    metaphorSubtitle: '個人の知識管理のための直感的で明快なメンタルモデル。',
    metaphorNutTitle: 'The Nut：生のキャプチャ',
    metaphorNutDesc:
      '興味深い記事や動画を見つけたとき、NutEggはその内容を「Nut」として抽出。メタデータやタイムスタンプと共にnutegg/_raw/へ安全に保管します。',
    metaphorEggTitle: 'The Egg：構造化された知識',
    metaphorEggDesc:
      '「Egg」はObsidian保管庫内の特定のテーマに特化した生きた知識ツリーです。対象範囲、重要課題、構造化された概念の階層を含みます。',
    metaphorHatchTitle: 'The Hatch（孵化）：新規性の統合',
    metaphorHatchDesc:
      'AIが入力されたNutと既存のEggを比較。重複したノートを増やすのではなく、新しい差分だけを知識構造へと織り込みます。',
    howTitle: '仕組み',
    howSubtitle: 'どんな Web ページからでも、数秒で明快な答えを——すべて Chrome の中で。',
    step1Title: 'NutEgg を Chrome に追加',
    step1Desc:
      'Chrome ウェブストアからインストールし、オプションで AI を選択——Gemini、Claude、OpenAI、DeepSeek、ローカルモデルに対応。登録不要です。',
    step2Title: '任意のページでサイドパネルを開く',
    step2Desc:
      '拡張機能アイコンをクリック。NutEgg がアクティブなタブの記事本文、X スレッド、YouTube の文字起こしを自動取得します。',
    step3Title: '数秒で判定を確認',
    step3Desc:
      'タイトルの問いへの一文回答、簡潔な要約、折りたためるマインドマップ、そして「時間をかける価値はあるか？」の率直な判定が表示されます。',
    step4Title: '質問・探索・ジャンプ',
    step4Desc:
      'ページ内容に基づく質問も、ページを超えたファクトチェックも可能。引用をクリックすれば動画の該当シーンや段落へジャンプします。',
    featTitle: '情報の明瞭さのために構築',
    featSubtitle: '情報過多を乗り越え、読まないブックマークの山を解消するために必要なすべて。',
    feat0Title: 'クリックベイト見出しの結論',
    feat0Desc: '思わせぶりなタイトルの核心に即答。15分かけて動画を見通さなくても結論が分かります。',
    feat1Title: 'クリック可能なタイムスタンプ付きマインドマップ',
    feat1Desc:
      'YouTubeの字幕を全文抽出し、動画の該当箇所へジャンプできるタイムスタンプ付きマインドマップを作成します。',
    feat2Title: '新規性重視のAI分析',
    feat2Desc: '重複ノートの乱立を防止。既存の知識と比較し、新しく有益な洞察のみをハイライトします。',
    feat3Title: 'プライバシー重視の設計',
    feat3Desc:
      'NutEgg のアカウントもサーバーもありません。API キーはブラウザ内に保存され、ページ内容は選択した AI プロバイダーにのみ送信されます。',
    feat4Title: '好みのAIモデルを選択可能',
    feat4Desc:
      'ローカルLLM（Ollama、LM Studio、llama.cpp）で完全オフライン動作。Gemini、Claude、OpenAI、DeepSeek、Qwen等にも接続可能です。',
    feat6Title: '動画Q&Aとタイムスタンプジャンプ',
    feat6Desc: '動画について自由に質問すると、該当シーンへジャンプできるタイムスタンプボタン付きで回答を得られます。',
    feat7Title: '知識ツリーの自動統合',
    feat7Desc: '蓄積された未処理の知見は、設定した閾値に達すると自動的にきれいな階層ブランチに整理されます。',
    expTitle: '過度な期待を持たないために',
    expSubtitle: 'NutEggの得意な領域と、対象外の用途についての率直なご案内。',
    exp0: '<strong>魔法のボタンではありません：</strong> ボタンを押すだけで勝手に頭が良くなるわけではありません。知識の真の習得には能動的な読書と思考、実践が必要です。',
    exp1: '<strong>冗長なコンテンツ向けであり、体系的な専門書向けではありません：</strong> 引き延ばされた動画やAI生成の薄い記事の時短に最適です。体系的な学術書を瞬時にマスターするためのツールではありません。',
    exp2: '<strong>エンターテインメント向きではありません：</strong> 情報密度の高い知見の抽出を目的としており、映画やお笑い動画の要約には向いていません。',
    exp3: '<strong>開発途中の機能：</strong> ポッドキャストやPDFファイル、追加の専用抽出機能は現在も積極的に開発を進めています。',
    ctaTitle: '今日から、もっと賢く読もう',
    ctaSubtitle:
      '数秒で読書時間を取り戻しましょう。まず NutEgg を Chrome に追加し、準備ができたらいつでも Obsidian と接続できます。',
    footerText: 'NutEgg — 読む量を減らし、より多くを孵化させる。GNU GPLv3 ライセンス。',
    footerDocs: 'ドキュメント',
    footerPrivacy: 'プライバシーポリシー',
    docsHeaderTitle: 'NutEgg ドキュメント',
    backToWebsite: '← Webサイトへ戻る',
    sidebarGettingStarted: 'はじめに',
    sidebarOverview: '概要と基本概念',
    sidebarChrome: 'Chrome拡張機能',
    sidebarObsidian: 'Obsidianプラグイン',
    sidebarKnowledge: '知識の構造化',
    sidebarWorkflow: 'AIワークフローエンジン',
    sidebarResources: 'リソース',
    navObsidian: 'Obsidian アドオン',
    heroBadge: '🧩 無料・オープンソースの Chrome 拡張機能',
    heroAddonNote: 'Obsidian をお使いですか？オプションのプラグインで個人のナレッジ保管庫を育てましょう →',
    addToChromeBtn: 'Chrome に追加（無料）',
    featScopeTitle: 'ページ内か、ページ外か',
    featScopeDesc:
      '回答をコンテンツ内に厳密に限定するか、AI にページの外まで調べさせて主張の検証や文脈の補足を行うかを選べます。',
    featDiscussTitle: 'コメント欄ダイジェスト',
    featDiscussDesc:
      'YouTube、Reddit、フォーラムのコメントを主要トピックに整理し、賛成/反対のスタンスバッジ付きで表示。みんなの意見が一目でわかります。',
    featSourceTitle: 'ワンクリックで出典へ',
    featSourceDesc:
      'マインドマップのノードや回答は出典にリンク。クリックするとページ上の該当段落やコメントまでスクロールします。',
    addonBadge: 'オプションのアドオン',
    addonTitle: 'Obsidian ユーザーなら、NutEgg で保管庫を育てよう',
    addonSubtitle:
      '上記の機能はすべて Chrome 単体で動作します。無料の Obsidian プラグインと組み合わせれば、読んだ内容が進化し続ける構造化ナレッジベースになります。',
    addonHatchTitle: 'ワンクリックで孵化・収集',
    addonHatchDesc:
      '新しい知見を該当するナレッジツリーに織り込むか、元のコンテンツを Markdown として保管庫にアーカイブできます。',
    addonGuideBtn: '📖 Obsidian 設定ガイド',
  },
  ko: {
    languageLabel: "언어",
    downloadChromeZipHint: "Chrome 독립 실행형 .zip 다운로드",
    githubAssetsHint: "GitHub에서 릴리스 파일 받기",
    promoVideoTitle: "NutEgg 소개 영상",
    previousScreenshot: "이전 스크린샷",
    nextScreenshot: "다음 스크린샷",
    chromeLogo: "Chrome 로고",
    obsidianLogo: "Obsidian 로고",
    nuteggIcon: "NutEgg 아이콘",
    websiteTitle: "NutEgg — Chrome AI 읽기 도우미 · 읽는 시간 절약",

    navTour: '제품 투어',
    navMetaphor: '핵심 은유',
    navHowItWorks: '작동 원리',
    navFeatures: '기능',
    navExpectations: '기대와 한계',
    navDocs: '문서',
    navGitHub: 'GitHub',
    navGetStarted: '시작하기',
    langToggle: '한국어',
    heroTitle: '더 적게 읽고. 더 많이 부화시키세요.<br><span class="gradient-text">시간을 절약하세요.</span>',
    heroSubtitle:
      'NutEgg는 Chrome 사이드 패널에서 동작하는 AI 읽기 도우미입니다. 모든 기사, 스레드, YouTube 영상에 대해 판정, 요약, 마인드맵, 타임스탬프 기반 영상 Q&A를 즉시 받아 보세요. 원하는 AI 모델을 사용하며 계정이 필요 없습니다.',
    chromeStoreBtn: 'Chrome 웹 스토어',
    obsidianPluginBtn: 'Obsidian 플러그인',
    downloadGithubZip: '📦 .zip 다운로드',
    downloadGithubPlugin: '📦 GitHub 릴리스',
    githubReleases: 'GitHub 릴리스',
    readDocsBtn: '📖 문서 읽기',
    starGitHubBtn: '⭐ GitHub Star',
    watchVideoBtn: '🎬 홍보 영상 보기',
    videoBadge: '🎬 공식 홍보 영상',
    videoTitle: 'NutEgg 실제 작동 영상',
    videoSubtitle:
      '방대한 웹 콘텐츠를 정제된 인사이트로 추출하여 Obsidian 볼트에 체계적으로 축적하는 과정을 확인해보세요.',
    videoBannerTitle: 'youtube.com/watch?v=_u6mDoHZSAo — NutEgg 프로모션',
    bannerTitleText: 'youtube.com/watch?v=... — NutEgg 사이드 패널',
    tourBadge: '✨ 인터랙티브 제품 투어',
    tourTitle: '정보의 명확성을 위한 설계',
    tourSubtitle: '장황한 웹 콘텐츠를 구조화되고 실행 가능한 지식으로 변환합니다.',
    tab0: '낚시성 방지',
    tab1: 'Q&A 및 타임스탬프',
    tab2: '마인드맵',
    tab3: '아는 내용 건너뛰기',
    tab4: '지식 확장',
    tab5: '다양한 출처',
    slide0Tag: '🎯 낚시성 제목 판정',
    slide0Title: '즉각적인 요약 및 제목 판정',
    slide0Desc:
      'NutEgg는 핵심을 곧바로 짚어냅니다. 제목의 질문에 명쾌한 한 문장으로 답변하며, 영상이나 글에 시간을 쓸 가치가 있는지 솔직하게 알려줍니다.',
    slide1Tag: '⏱️ 즉각적인 영상 탐색',
    slide1Title: '자유롭게 질문하고 해당 위치로 이동',
    slide1Desc:
      '영상에 대해 무엇이든 질문하면 출처 타임스탬프 버튼과 함께 답변이 제공되며, 클릭 한 번으로 영상의 해당 순간으로 즉시 이동합니다.',
    slide2Tag: '🧠 계층적 구조화',
    slide2Title: '인터랙티브 생각 트리',
    slide2Desc:
      '1시간짜리 영상이나 긴 글을 접이식 다계층 마인드맵으로 변환합니다. 핵심 요점과 개념 간의 연결 관계를 몇 초 만에 파악하세요.',
    slide3Tag: '🧩 Obsidian 애드온 · 새로움 검사',
    slide3Title: '이미 알고 있는 내용 건너뛰기',
    slide3Desc:
      'NutEgg는 Obsidian 볼트의 기존 지식과 새로운 콘텐츠를 비교하여 이미 다룬 내용을 감지하므로 영상당 15~30분의 시간을 절약해 줍니다.',
    slide4Tag: '🧩 Obsidian 애드온 · 지식 트리',
    slide4Title: 'Obsidian 볼트를 자동으로 성장시키기',
    slide4Desc:
      '브라우징에서 새로운 차이점만을 분리하여 기존 Egg 노트의 알맞은 가지 아래에 직접 엮어 넣습니다. 수동 노트 정리가 필요 없습니다.',
    slide5Tag: '🌐 폭넓은 호환성',
    slide5Title: '어떤 플랫폼이든 모국어로',
    slide5Desc:
      'YouTube 자막, Substack 뉴스레터, Medium 블로그, X(Twitter) 스레드를 완벽하게 추출하고 50개 이상의 언어로 즉시 요약 및 번역합니다.',
    metaphorTitle: '은유: Nuts와 Eggs',
    metaphorSubtitle: '개인 지식 관리를 위한 직관적이고 합리적인 멘탈 모델.',
    metaphorNutTitle: 'The Nut: 캡처된 원본',
    metaphorNutDesc:
      '흥미로운 기사나 영상을 발견하면 NutEgg가 그 내용을 메타데이터, 타임스탬프와 함께 "nut"으로 추출하여 nutegg/_raw/에 안전하게 보관합니다.',
    metaphorEggTitle: 'The Egg: 구조화된 지식',
    metaphorEggDesc:
      '"egg"는 Obsidian 볼트 내 특정 주제의 살아있는 지식 트리입니다. 다루는 범위, 핵심 질문, 체계화된 개념 위계를 포함합니다.',
    metaphorHatchTitle: 'The Hatch(부화): 새로움의 종합',
    metaphorHatchDesc:
      'AI가 수집된 Nut과 기존 Egg를 비교합니다. 중복 노트를 쌓아두는 대신 새로운 통찰만을 지식 구조에 자연스럽게 통합합니다.',
    howTitle: '작동 원리',
    howSubtitle: '어떤 웹페이지든 몇 초 만에 명확한 답으로 — Chrome 안에서 바로.',
    step1Title: 'NutEgg를 Chrome에 추가',
    step1Desc:
      'Chrome 웹 스토어에서 설치한 뒤 옵션에서 AI를 선택하세요 — Gemini, Claude, OpenAI, DeepSeek 또는 로컬 모델. 가입이 필요 없습니다.',
    step2Title: '아무 페이지에서나 사이드 패널 열기',
    step2Desc:
      '확장 프로그램 아이콘을 클릭하세요. NutEgg가 활성 탭의 기사 본문, X 스레드, YouTube 자막을 자동으로 가져옵니다.',
    step3Title: '몇 초 만에 판정 확인',
    step3Desc:
      '제목의 질문에 대한 한 문장 답변, 짧은 핵심 요약, 접을 수 있는 마인드맵, 그리고 "시간을 들일 가치가 있는가?"에 대한 솔직한 판정을 확인하세요.',
    step4Title: '질문하고, 탐색하고, 이동하기',
    step4Desc:
      '페이지 내용에 근거한 질문은 물론, 사실 확인을 위해 페이지 밖까지 질문하고, 인용을 클릭해 영상의 정확한 순간이나 단락으로 이동하세요.',
    featTitle: '정보의 명확성을 위해 탄생',
    featSubtitle: '디지털 과부하를 극복하고 쌓여가는 북마크를 없애기 위해 필요한 모든 것.',
    feat0Title: '낚시성 방지 판정',
    feat0Desc: '제목의 핵심 질문에 먼저 명확히 답하여 15분 동안 결론을 찾아 헤매는 시간 낭비를 막아줍니다.',
    feat1Title: '클릭 가능한 타임스탬프가 있는 마인드맵',
    feat1Desc:
      'YouTube 자막을 전문 추출하고 영상의 해당 부분으로 이동할 수 있는 타임스탬프가 포함된 마인드맵을 만듭니다.',
    feat2Title: '새로움 중심의 AI 분석',
    feat2Desc: '중복 노트를 방지합니다. 기존 지식과 비교하여 참신하고 가치 있는 통찰만 선별합니다.',
    feat3Title: '프라이버시 중심 설계',
    feat3Desc:
      'NutEgg 계정도, NutEgg 서버도 없습니다. API 키는 브라우저에만 저장되고 페이지 내용은 선택한 AI 제공자에게만 전송됩니다.',
    feat4Title: '원하는 모델 선택',
    feat4Desc:
      '로컬 LLM(Ollama, LM Studio)으로 완전 오프라인 실행하거나 Gemini, Claude, OpenAI, DeepSeek, Qwen 등에 연결하세요.',
    feat6Title: '동영상 Q&A 및 타임스탬프 이동',
    feat6Desc: '영상 내용에 대해 질문하면 해당 순간으로 바로 이동할 수 있는 타임스탬프 링크가 달린 답변을 받습니다.',
    feat7Title: '지식 트리 자동 통합',
    feat7Desc: '누적된 미처리 통찰은 설정된 수량에 도달하면 깔끔한 위계 구조로 자동 합성 및 정리됩니다.',
    expTitle: '이런 기대는 피해주세요',
    expSubtitle: 'NutEgg가 뛰어난 영역과 맞지 않는 사용 목적에 대한 솔직한 안내.',
    exp0: '<strong>마법의 버튼이 아닙니다:</strong> 버튼 클릭만으로 똑똑해질 수는 없습니다. 지식의 참된 습득에는 능동적인 독서와 비판적 사고, 연습이 필수적입니다.',
    exp1: '<strong>장황한 글과 영상용이며 전문 서적용이 아닙니다:</strong> 늘어진 영상과 낚시성 글의 시간 절약에 최적입니다. 방대한 전공 서적이나 긴 강의를 요약해 즉석 전문가로 만들어주는 도구가 아닙니다.',
    exp2: '<strong>오락용 콘텐츠에는 적합하지 않습니다:</strong> 정보 밀도가 높은 지식 추출을 목적으로 하므로 예능, 영화 등 엔터테인먼트 영상 요약에는 맞지 않습니다.',
    exp3: '<strong>지속 개발 중인 프로젝트:</strong> 팟캐스트, PDF 파일 및 추가 전문 추출기 지원 기능이 활발히 개발되고 있습니다.',
    ctaTitle: '오늘부터 더 똑똑하게 읽으세요',
    ctaSubtitle:
      '몇 초 만에 읽는 시간을 되찾으세요. NutEgg를 Chrome에 추가하고, 준비되면 언제든 Obsidian을 연결하세요.',
    footerText: 'NutEgg — 더 적게 읽고, 더 많이 부화시키세요. GNU GPLv3 라이선스.',
    footerDocs: '문서',
    footerPrivacy: '개인정보 보호정책',
    docsHeaderTitle: 'NutEgg 문서',
    backToWebsite: '← 웹사이트로 돌아가기',
    sidebarGettingStarted: '시작하기',
    sidebarOverview: '개요 및 핵심 개념',
    sidebarChrome: 'Chrome 확장 프로그램',
    sidebarObsidian: 'Obsidian 플러그인',
    sidebarKnowledge: '지식 구조화',
    sidebarWorkflow: 'AI 워크플로우 엔진',
    sidebarResources: '리소스',
    navObsidian: 'Obsidian 애드온',
    heroBadge: '🧩 무료 오픈소스 Chrome 확장 프로그램',
    heroAddonNote: 'Obsidian을 쓰시나요? 선택형 플러그인으로 개인 지식 보관소를 키워 보세요 →',
    addToChromeBtn: 'Chrome에 추가 — 무료',
    featScopeTitle: '페이지 안 또는 밖',
    featScopeDesc:
      '답변을 콘텐츠에 엄격히 근거하도록 하거나, AI가 페이지 밖까지 살펴 주장을 검증하고 빠진 맥락을 보완하게 하세요.',
    featDiscussTitle: '댓글 요약',
    featDiscussDesc:
      'YouTube, Reddit, 포럼 댓글을 핵심 주제로 정리하고 찬성/반대 입장 배지를 붙여, 사람들의 반응을 한눈에 보여줍니다.',
    featSourceTitle: '클릭 한 번으로 출처 이동',
    featSourceDesc: '마인드맵 노드와 답변은 출처와 연결됩니다 — 클릭하면 페이지에서 해당 단락이나 댓글로 스크롤됩니다.',
    addonBadge: '선택형 애드온',
    addonTitle: 'Obsidian을 쓰신다면, NutEgg로 보관소를 키우세요',
    addonSubtitle:
      '위의 모든 기능은 Chrome만으로 동작합니다. 무료 Obsidian 플러그인과 함께 쓰면 읽은 내용이 계속 발전하는 구조화된 지식 베이스가 됩니다.',
    addonHatchTitle: '원클릭 부화 또는 수집',
    addonHatchDesc:
      '새로운 인사이트를 해당 지식 트리에 엮어 넣거나, 원본 콘텐츠를 Markdown으로 보관소에 저장해 두세요.',
    addonGuideBtn: '📖 Obsidian 설정 가이드',
  },
  ar: {
    languageLabel: "اللغة",
    downloadChromeZipHint: "تنزيل ملف .zip مستقل لمتصفح Chrome",
    githubAssetsHint: "الحصول على ملفات الإصدار من GitHub",
    promoVideoTitle: "فيديو تعريفي لـ NutEgg",
    previousScreenshot: "لقطة الشاشة السابقة",
    nextScreenshot: "لقطة الشاشة التالية",
    chromeLogo: "شعار Chrome",
    obsidianLogo: "شعار Obsidian",
    nuteggIcon: "أيقونة NutEgg",
    websiteTitle: "NutEgg — مساعد قراءة بالذكاء الاصطناعي لمتصفح Chrome · اقرأ أقل ووفّر الوقت",

    navTour: 'جولة في المنتج',
    navMetaphor: 'المفهوم الأساسي',
    navHowItWorks: 'كيف يعمل',
    navFeatures: 'المميزات',
    navExpectations: 'التوقعات والحدود',
    navDocs: 'التوثيق',
    navGitHub: 'GitHub',
    navGetStarted: 'ابدأ الآن',
    langToggle: 'العربية',
    heroTitle: 'اقرأ أقل. وافقس أكثر.<br><span class="gradient-text">وفّر وقتك.</span>',
    heroSubtitle:
      'NutEgg مساعد قراءة بالذكاء الاصطناعي يعمل في اللوحة الجانبية لمتصفح Chrome. احصل فورًا على أحكام وملخصات وخرائط ذهنية وأسئلة وأجوبة مرتبطة بالطوابع الزمنية لأي مقال أو سلسلة تغريدات أو فيديو على YouTube، باستخدام نموذج الذكاء الاصطناعي الخاص بك ودون الحاجة إلى حساب.',
    chromeStoreBtn: 'متجر Chrome الإلكتروني',
    obsidianPluginBtn: 'إضافة Obsidian',
    downloadGithubZip: '📦 تنزيل .zip',
    downloadGithubPlugin: '📦 إصدار GitHub',
    githubReleases: 'إصدارات GitHub',
    readDocsBtn: '📖 قراءة التوثيق',
    starGitHubBtn: '⭐ نجمة على GitHub',
    watchVideoBtn: '🎬 شاهد الفيديو الترويجي',
    videoBadge: '🎬 الفيديو الترويجي الرسمي',
    videoTitle: 'شاهد NutEgg أثناء العمل',
    videoSubtitle: 'شاهد كيف يحول NutEgg تصفح الويب المليء بالحشو إلى معرفة منظمة في خزينة Obsidian.',
    videoBannerTitle: 'youtube.com/watch?v=_u6mDoHZSAo — فيديو NutEgg الترويجي',
    bannerTitleText: 'youtube.com/watch?v=... — اللوحة الجانبية لـ NutEgg',
    tourBadge: '✨ جولة تفاعلية',
    tourTitle: 'مصمم لوضوح المعلومات',
    tourSubtitle: 'تحويل محتوى الويب المشتت إلى معرفة منظمة وقابلة للتطبيق.',
    tab0: 'مكافحة العناوين المضللة',
    tab1: 'أسئلة وتوقيتات',
    tab2: 'الخريطة الذهنية',
    tab3: 'تجاوز المألوف',
    tab4: 'تنمية المعرفة',
    tab5: 'مصادر متعددة',
    slide0Tag: '🎯 حكم مضاد للعناوين المضللة',
    slide0Title: 'ملخص فوري وحكم على العنوان',
    slide0Desc:
      'يصل NutEgg مباشرة إلى صلب الموضوع: يجيب على سؤال العنوان الأساسي بجملة حاسمة واحدة ويخبرك بصدق هل يستحق المحتوى وقتك.',
    slide1Tag: '⏱️ تنقل فوري في الفيديو',
    slide1Title: 'اطرح أي سؤال وانتقل مباشرة للوقت',
    slide1Desc:
      'اطرح أسئلة حرة حول محتوى الفيديو واحصل على إجابات مدعومة بأزرار توقيت تنقلك مباشرة إلى اللحظة المحددة في التشغيل.',
    slide2Tag: '🧠 تقسيم هرمي',
    slide2Title: 'أشجار تفكير تفاعلية',
    slide2Desc:
      'حوّل مقاطع الفيديو الطويلة والمقالات المعقدة إلى خرائط ذهنية متعددة المستويات وقابلة للطي في ثوانٍ معدودة.',
    slide3Tag: '🧩 إضافة Obsidian · فحص الجديد',
    slide3Title: 'تجاوز ما تعرفه مسبقاً',
    slide3Desc:
      'يقارن NutEgg المحتوى الجديد بما هو موجود في خزانتك بـ Obsidian وينبهك إذا كانت الأفكار مغطاة بالفعل، مما يوفر 15 إلى 30 دقيقة لكل فيديو.',
    slide4Tag: '🧩 إضافة Obsidian · أشجار المعرفة',
    slide4Title: 'نمّ خزانة Obsidian الخاصة بك تلقائياً',
    slide4Desc:
      'يعزل الإضافات والتحولات الجديدة من تصفحك وينسجها مباشرة تحت الفروع المناسبة في ملفات الـ egg دون الحاجة لتنسيق يدوي.',
    slide5Tag: '🌐 توافق شامل',
    slide5Title: 'أي منصة، بلغتك الأم',
    slide5Desc:
      'استخراج دقيق من نصوص YouTube ونشرات Substack ومقالات Medium وسلاسل X (تويتر)، مع تلخيص وترجمة لأكثر من 50 لغة فورياً.',
    metaphorTitle: 'المفهوم: Nuts و Eggs',
    metaphorSubtitle: 'نموذج ذهني بديهي وسلس لإدارة المعرفة الشخصية.',
    metaphorNutTitle: 'The Nut: الالتقاط الخام',
    metaphorNutDesc:
      'عندما تجد مقالاً أو فيديو مفيداً، يستخرج NutEgg محتواه الخام في شكل "nut" متضمناً البيانات الوصفية والفواصل الزمنية في مجلد nutegg/_raw/ بأمان.',
    metaphorEggTitle: 'The Egg: المعرفة المنظمة',
    metaphorEggDesc:
      'الـ "egg" هو شجرة معرفة حية لموضوع محدد في Obsidian. يحتوي كل egg على نطاق محدد وأسئلة جوهرية وهيكل هرمي للمفاهيم التي تهتم بها.',
    metaphorHatchTitle: 'The Hatch (التفقيس): توليف الأفكار الجديدة',
    metaphorHatchDesc:
      'يقارن الذكاء الاصطناعي الـ nuts الجديدة بالـ eggs الحالية. بدلاً من مراكمة ملاحظات مكررة، يستخلص NutEgg الفروق الجديدة ويدمجها في هيكل معرفتك.',
    howTitle: 'كيف يعمل',
    howSubtitle: 'من أي صفحة ويب إلى إجابات واضحة في ثوانٍ — داخل Chrome مباشرة.',
    step1Title: 'أضف NutEgg إلى Chrome',
    step1Desc:
      'ثبّته من سوق Chrome الإلكتروني، ثم اختر الذكاء الاصطناعي من الخيارات: Gemini أو Claude أو OpenAI أو DeepSeek أو نموذج محلي. لا حاجة للتسجيل.',
    step2Title: 'افتح اللوحة الجانبية على أي صفحة',
    step2Desc:
      'انقر على أيقونة الإضافة. يلتقط NutEgg تلقائيًا نص المقال أو سلسلة X أو نص فيديو YouTube من علامة التبويب النشطة.',
    step3Title: 'احصل على الحكم في ثوانٍ',
    step3Desc:
      'شاهد إجابة مباشرة من جملة واحدة على سؤال العنوان، وملخصًا تنفيذيًا قصيرًا، وخريطة ذهنية قابلة للطي، وحكمًا صريحًا حول ما إذا كان المحتوى يستحق وقتك.',
    step4Title: 'اسأل، استكشف، انتقل',
    step4Desc:
      'اطرح أسئلة مستندة إلى الصفحة، أو تتجاوزها للتحقق من الحقائق، وانقر على أي استشهاد للانتقال إلى اللحظة الدقيقة في الفيديو أو الفقرة.',
    featTitle: 'مصمم من أجل نقاء المعلومات',
    featSubtitle: 'كل ما تحتاجه للتغلب على الإفراط المعلوماتي والتوقف عن تكديس الإشارات المرجعية غير المقروءة.',
    feat0Title: 'أحكام مضادة للعناوين المضللة',
    feat0Desc:
      'يكشف حقيقة العناوين المشوقة بإعطاء الجواب مباشرة مقدماً حتى لا تضيع ربع ساعة في البحث عنه داخل الفيديو.',
    feat1Title: 'خرائط ذهنية بطوابع زمنية قابلة للنقر',
    feat1Desc: 'يستخرج نصوص YouTube الكاملة وينشئ خرائط ذهنية بطوابع زمنية تنقلك إلى اللحظة المطلوبة في الفيديو.',
    feat2Title: 'تحليل ذكي يركز على الجديد',
    feat2Desc: 'يمنع تكرار الملاحظات. يقارن المحتوى بمعرفتك المسجلة ويبرز فقط ما هو جديد وقيّم حقاً.',
    feat3Title: 'خصوصية منذ التصميم',
    feat3Desc:
      'لا حساب لدى NutEgg ولا خوادم لـ NutEgg. يبقى مفتاح API في متصفحك، ويُرسل محتوى الصفحة فقط إلى مزود الذكاء الاصطناعي الذي تختاره.',
    feat4Title: 'استخدم نموذج الذكاء الاصطناعي المفضل لديك',
    feat4Desc:
      'يعمل دون اتصال تماماً مع نماذج LLM المحلية (Ollama, LM Studio) أو اتصل بـ Gemini, Claude, OpenAI, DeepSeek, Qwen وغيرها.',
    feat6Title: 'أسئلة وأجوبة الفيديو مع القفز الزمني',
    feat6Desc:
      'اطرح أسئلة حول الفيديو واحصل على إجابات موثقة بمؤشرات زمنية تفاعلية تقفز بك إلى اللحظة الدقيقة في العرض.',
    feat7Title: 'دمج تلقائي لأشجار المعرفة',
    feat7Desc: 'يتم تجميع وتنظيم الرؤى غير المعالجة تلقائياً في فروع واضحة بمجرد بلوغ العدد المحدد في الإعدادات.',
    expTitle: 'ما لا يجب أن تتوقعه',
    expSubtitle: 'حدود واضحة وصادقة حول ما يتفوق فيه NutEgg وما لم يُصمم لأجله.',
    exp0: '<strong>ليس زراً سحرياً:</strong> لن تصبح أذكى بمجرد النقر على زر. إتقان المعرفة يتطلب دائماً قراءة واعية وتفكيراً نقدياً وممارسة فعلية.',
    exp1: '<strong>مصمم للحشو والعناوين الجاذبة، وليس للكتب المرجعية العميقة:</strong> يبدع NutEgg في توفير الوقت على المقاطع المشتتة والمقالات المكررة. لم يُصمم لاختزال أمهات الكتب أو المقررات التعليمية الكاملة في خبرة فورية.',
    exp2: '<strong>غير مخصص للمحتوى الترفيهي:</strong> يركز NutEgg على كثافة المعلومات واستخراج الأفكار، وليس على تلخيص الأعمال الكوميدية أو الأفلام والترفيه.',
    exp3: '<strong>المشروع قيد التطوير المستمر:</strong> نعمل بنشاط على دعم البودكاست وملفات PDF ومستخرجات متخصصة إضافية.',
    ctaTitle: 'ابدأ القراءة بذكاء اليوم',
    ctaSubtitle: 'استعد وقت قراءتك في ثوانٍ. أضف NutEgg إلى Chrome، واربط Obsidian متى شئت.',
    footerText: 'NutEgg — اقرأ أقل، وافقس أكثر. مرخص بموجب GNU GPLv3.',
    footerDocs: 'التوثيق',
    footerPrivacy: 'سياسة الخصوصية',
    docsHeaderTitle: 'توثيق NutEgg',
    backToWebsite: '← العودة إلى الموقع',
    sidebarGettingStarted: 'البدء',
    sidebarOverview: 'نظرة عامة والمفاهيم',
    sidebarChrome: 'إضافة Chrome',
    sidebarObsidian: 'إضافة Obsidian',
    sidebarKnowledge: 'هيكلة المعرفة',
    sidebarWorkflow: 'محرك سير عمل الذكاء الاصطناعي',
    sidebarResources: 'المصادر',
    navObsidian: 'إضافة Obsidian',
    heroBadge: '🧩 إضافة Chrome مجانية ومفتوحة المصدر',
    heroAddonNote: 'تستخدم Obsidian؟ أضف المكوّن الاختياري لتنمية خزنة معرفتك الشخصية ←',
    addToChromeBtn: 'أضف إلى Chrome — مجانًا',
    featScopeTitle: 'داخل الصفحة أو خارجها',
    featScopeDesc:
      'اجعل الإجابات مستندة إلى المحتوى بدقة، أو دع الذكاء الاصطناعي يتجاوزه للتحقق من الادعاءات وإضافة السياق المفقود.',
    featDiscussTitle: 'خلاصة التعليقات',
    featDiscussDesc:
      'يلخّص تعليقات YouTube وReddit والمنتديات في موضوعات رئيسية مع شارات الموقف (مؤيد/معارض)، لتعرف رأي الجمهور بنظرة واحدة.',
    featSourceTitle: 'انتقال مباشر إلى المصدر',
    featSourceDesc:
      'ترتبط عُقد الخريطة الذهنية والإجابات بمصادرها — انقر للتمرير إلى الفقرة أو التعليق المحدد في الصفحة.',
    addonBadge: 'إضافة اختيارية',
    addonTitle: 'تستخدم Obsidian؟ دع NutEgg ينمّي خزنتك',
    addonSubtitle:
      'كل ما سبق يعمل بمفرده داخل Chrome. اربط NutEgg بمكوّن Obsidian المجاني لتحويل ما تقرؤه إلى قاعدة معرفة منظمة ومتطورة.',
    addonHatchTitle: 'فقس أو جمع بنقرة واحدة',
    addonHatchDesc:
      'انسج الأفكار الجديدة في شجرة المعرفة المطابقة، أو أرشف المحتوى الخام بصيغة Markdown في خزنتك للرجوع إليه لاحقًا.',
    addonGuideBtn: '📖 دليل إعداد Obsidian',
  },
  fr: {
    languageLabel: "Langue",
    downloadChromeZipHint: "Télécharger le .zip autonome pour Chrome",
    githubAssetsHint: "Obtenir les fichiers de version sur GitHub",
    promoVideoTitle: "Vidéo de présentation de NutEgg",
    previousScreenshot: "Capture précédente",
    nextScreenshot: "Capture suivante",
    chromeLogo: "Logo Chrome",
    obsidianLogo: "Logo Obsidian",
    nuteggIcon: "Icône NutEgg",
    websiteTitle: "NutEgg — Assistant de lecture IA pour Chrome · Lisez moins, gagnez du temps",

    navTour: 'Visite du produit',
    navMetaphor: 'La métaphore',
    navHowItWorks: 'Comment ça marche',
    navFeatures: 'Fonctionnalités',
    navExpectations: 'Limites et attentes',
    navDocs: 'Documentation',
    navGitHub: 'GitHub',
    navGetStarted: 'Commencer',
    langToggle: 'Français',
    heroTitle: 'Lisez moins. Faites éclore plus.<br><span class="gradient-text">Gagnez du temps.</span>',
    heroSubtitle:
      "NutEgg est un assistant de lecture IA qui vit dans le panneau latéral de Chrome. Obtenez instantanément verdicts, résumés, cartes mentales et Q&R vidéo horodatées pour n'importe quel article, fil ou vidéo YouTube — avec votre propre modèle d'IA, sans compte.",
    chromeStoreBtn: 'Chrome Web Store',
    obsidianPluginBtn: 'Plugin Obsidian',
    downloadGithubZip: '📦 Télécharger le .zip',
    downloadGithubPlugin: '📦 Version GitHub',
    githubReleases: 'Versions GitHub',
    readDocsBtn: '📖 Lire la documentation',
    starGitHubBtn: '⭐ Étoile sur GitHub',
    watchVideoBtn: '🎬 Voir la vidéo promo',
    videoBadge: '🎬 Vidéo de présentation',
    videoTitle: 'Découvrez NutEgg en action',
    videoSubtitle:
      'Découvrez comment NutEgg transforme les pages web verbeuses en connaissances structurées dans votre coffre Obsidian.',
    videoBannerTitle: 'youtube.com/watch?v=_u6mDoHZSAo — Présentation NutEgg',
    bannerTitleText: 'youtube.com/watch?v=... — Volet latéral NutEgg',
    tourBadge: '✨ Visite interactive',
    tourTitle: "Conçu pour la clarté de l'information",
    tourSubtitle: 'Transformez le contenu web dispersé en connaissances structurées et exploitables.',
    tab0: 'Anti-Clickbait',
    tab1: 'Q&A et repères',
    tab2: 'Carte mentale',
    tab3: 'Passer le déjà-su',
    tab4: 'Faire mûrir le savoir',
    tab5: 'Multi-sources',
    slide0Tag: '🎯 Verdict anti-clickbait',
    slide0Title: 'Résumé immédiat et verdict du titre',
    slide0Desc:
      "NutEgg va droit au but : il répond à la question du titre en une phrase percutante et vous dit honnêtement si la vidéo ou l'article mérite votre attention.",
    slide1Tag: '⏱️ Navigation vidéo instantanée',
    slide1Title: 'Posez vos questions et sautez au moment précis',
    slide1Desc:
      'Interrogez librement le contenu vidéo et obtenez des réponses étayées par des repères temporels cliquables menant directement au passage dans la vidéo.',
    slide2Tag: '🧠 Décomposition hiérarchique',
    slide2Title: "Arborescences d'idées interactives",
    slide2Desc:
      "Transformez des vidéos d'une heure et des articles complexes en cartes mentales dépliables à plusieurs niveaux. Visualisez les liens logiques en quelques secondes.",
    slide3Tag: '🧩 Module Obsidian · Détection de nouveauté',
    slide3Title: 'Passez ce que vous savez déjà',
    slide3Desc:
      'NutEgg compare le contenu entrant à vos notes dans Obsidian et vous signale ce qui est déjà maîtrisé, vous faisant économiser 15 à 30 minutes par vidéo.',
    slide4Tag: '🧩 Module Obsidian · Arbres de connaissances',
    slide4Title: 'Enrichissez automatiquement votre coffre Obsidian',
    slide4Desc:
      'Isole les apports véritablement inédits de votre navigation et les tisse sous les bonnes branches de vos fichiers egg existants sans mise en page manuelle.',
    slide5Tag: '🌐 Compatibilité universelle',
    slide5Title: 'Toutes plateformes, dans votre langue maternelle',
    slide5Desc:
      'Extraction fidèle des sous-titres YouTube, newsletters Substack, blogs Medium et fils X (Twitter). Résume et traduit dans plus de 50 langues instantanément.',
    metaphorTitle: 'La métaphore : Nuts & Eggs',
    metaphorSubtitle: 'Un modèle mental intuitif et pragmatique pour la gestion des connaissances personnelles.',
    metaphorNutTitle: 'Le Nut : Captures brutes',
    metaphorNutDesc:
      'Chaque fois que vous trouvez une ressource pertinente, NutEgg en extrait le contenu brut sous forme de « nut », avec métadonnées, horodatages et contexte stockés dans nutegg/_raw/.',
    metaphorEggTitle: "L'Egg : Connaissances structurées",
    metaphorEggDesc:
      'Un « egg » est un arbre thématique vivant dans votre coffre Obsidian. Chaque egg regroupe un périmètre précis, des questions clés et une hiérarchie ordonnée de concepts.',
    metaphorHatchTitle: "L'Éclosion (Hatch) : Synthèse de nouveauté",
    metaphorHatchDesc:
      "L'IA compare les nouveaux nuts à vos eggs existants. Au lieu d'accumuler des doublons, NutEgg isole les idées nouvelles et les intègre directement dans votre structure.",
    howTitle: 'Comment ça marche',
    howSubtitle: "De n'importe quelle page web à des réponses claires en quelques secondes — directement dans Chrome.",
    step1Title: 'Ajoutez NutEgg à Chrome',
    step1Desc:
      'Installez-le depuis le Chrome Web Store, puis choisissez votre IA dans les Options : Gemini, Claude, OpenAI, DeepSeek ou un modèle local. Aucune inscription.',
    step2Title: "Ouvrez le panneau latéral sur n'importe quelle page",
    step2Desc:
      "Cliquez sur l'icône de l'extension. NutEgg récupère automatiquement le texte de l'article, le fil X ou la transcription YouTube de l'onglet actif.",
    step3Title: 'Obtenez le verdict en quelques secondes',
    step3Desc:
      "Découvrez une réponse directe en une phrase à l'accroche du titre, un court résumé, une carte mentale repliable et un verdict honnête : est-ce que ça vaut votre temps ?",
    step4Title: 'Demandez, explorez, sautez',
    step4Desc:
      'Posez des questions ancrées dans la page — ou au-delà pour vérifier les faits — et cliquez sur une citation pour sauter au moment exact de la vidéo ou au paragraphe.',
    featTitle: "Bâti pour la clarté de l'information",
    featSubtitle:
      "Tout le nécessaire pour surmonter la surcharge d'information et cesser d'accumuler des favoris sans jamais les lire.",
    feat0Title: 'Verdicts anti-clickbait',
    feat0Desc:
      "Déjoue les titres sensationnalistes en répondant d'emblée à la question centrale pour vous éviter de perdre un quart d'heure à chercher la réponse.",
    feat1Title: 'Cartes mentales avec horodatages cliquables',
    feat1Desc:
      'Extrait les transcriptions YouTube et crée des cartes mentales avec des horodatages pour accéder au moment précis de la vidéo.',
    feat2Title: 'Analyse axée sur la nouveauté',
    feat2Desc:
      'Évite les notes en doublon. Compare les contenus à vos connaissances existantes et ne retient que les réflexions originales et marquantes.',
    feat3Title: 'Confidentiel par conception',
    feat3Desc:
      "Pas de compte NutEgg ni de serveurs NutEgg. Votre clé API reste dans votre navigateur et le contenu n'est envoyé qu'au fournisseur d'IA de votre choix.",
    feat4Title: 'Apportez votre propre modèle IA',
    feat4Desc:
      'Fonctionne hors-ligne avec des LLM locaux (Ollama, LM Studio) ou connectez-vous à Gemini, Claude, OpenAI, DeepSeek, Qwen ou OpenRouter.',
    feat6Title: 'Q&A vidéo avec saut horodaté',
    feat6Desc:
      'Posez des questions sur la vidéo et obtenez des réponses avec des repères temporels cliquables menant directement au bon moment de la lecture.',
    feat7Title: 'Fusion automatique des arbres de savoir',
    feat7Desc:
      'Les idées brutes accumulées sont automatiquement synthétisées dans des branches claires dès que les seuils définis sont atteints.',
    expTitle: "Ce qu'il ne faut pas attendre",
    expSubtitle: "Des limites claires et honnêtes sur ce pour quoi NutEgg excelle et ce pour quoi il n'est pas conçu.",
    exp0: '<strong>Pas de bouton magique :</strong> Vous ne deviendrez pas plus savant en cliquant simplement sur un bouton. Assimiler un savoir demande toujours une lecture active et un esprit critique.',
    exp1: '<strong>Conçu pour le contenu bavard et le clickbait, non pour les manuels denses :</strong> Idéal pour faire le tri dans les vidéos étirées et les articles creux. Non conçu pour ingérer des traités universitaires complets en un éclair.',
    exp2: "<strong>Pas adapté au divertissement :</strong> NutEgg recherche la densité d'information et les enseignements pratiques, pas le résumé de comédies ou de fictions.",
    exp3: '<strong>Projet en constante évolution :</strong> La prise en charge des podcasts, des fichiers PDF et de nouveaux extracteurs spécialisés est activement développée.',
    ctaTitle: "Lisez plus intelligemment dès aujourd'hui",
    ctaSubtitle:
      'Reprenez votre temps de lecture en quelques secondes. Ajoutez NutEgg à Chrome — et connectez Obsidian quand vous voulez.',
    footerText: 'NutEgg — Lisez moins, faites éclore plus. Licence GNU GPLv3.',
    footerDocs: 'Documentation',
    footerPrivacy: 'Politique de confidentialité',
    docsHeaderTitle: 'Documentation NutEgg',
    backToWebsite: '← Retour au site',
    sidebarGettingStarted: 'Prise en main',
    sidebarOverview: "Vue d'ensemble et concepts",
    sidebarChrome: 'Extension Chrome',
    sidebarObsidian: 'Plugin Obsidian',
    sidebarKnowledge: 'Structuration des connaissances',
    sidebarWorkflow: 'Moteur de flux IA',
    sidebarResources: 'Ressources',
    navObsidian: 'Module Obsidian',
    heroBadge: '🧩 Extension Chrome gratuite et open source',
    heroAddonNote:
      'Vous utilisez Obsidian ? Ajoutez le plugin optionnel pour faire grandir votre coffre de connaissances →',
    addToChromeBtn: "Ajouter à Chrome — C'est gratuit",
    featScopeTitle: 'Dans la page ou au-delà',
    featScopeDesc:
      "Gardez les réponses strictement fondées sur le contenu, ou laissez l'IA aller au-delà pour vérifier les affirmations et ajouter du contexte.",
    featDiscussTitle: 'Synthèse des commentaires',
    featDiscussDesc:
      "Résume les commentaires YouTube, Reddit et des forums en thèmes clés avec badges de position (pour/contre), pour saisir l'avis général d'un coup d'œil.",
    featSourceTitle: 'Navigation vers la source',
    featSourceDesc:
      "Les nœuds de la carte mentale et les réponses renvoient à leur source — cliquez pour défiler jusqu'au paragraphe ou commentaire exact.",
    addonBadge: 'Module optionnel',
    addonTitle: 'Vous utilisez Obsidian ? Laissez NutEgg enrichir votre coffre',
    addonSubtitle:
      'Tout ce qui précède fonctionne seul dans Chrome. Associez NutEgg à son plugin Obsidian gratuit pour transformer vos lectures en une base de connaissances structurée et évolutive.',
    addonHatchTitle: 'Éclore ou collecter en un clic',
    addonHatchDesc:
      "Intégrez les nouvelles idées dans l'arbre de connaissances correspondant, ou archivez le contenu brut en Markdown dans votre coffre.",
    addonGuideBtn: '📖 Guide de configuration Obsidian',
  },
  de: {
    languageLabel: "Sprache",
    downloadChromeZipHint: "Eigenständige .zip für Chrome herunterladen",
    githubAssetsHint: "Versionsdateien von GitHub herunterladen",
    promoVideoTitle: "NutEgg-Produktvideo",
    previousScreenshot: "Vorheriger Screenshot",
    nextScreenshot: "Nächster Screenshot",
    chromeLogo: "Chrome-Logo",
    obsidianLogo: "Obsidian-Logo",
    nuteggIcon: "NutEgg-Symbol",
    websiteTitle: "NutEgg — AI-Lesehilfe für Chrome · Weniger lesen, Zeit sparen",

    navTour: 'Produkt-Tour',
    navMetaphor: 'Die Metapher',
    navHowItWorks: 'Funktionsweise',
    navFeatures: 'Funktionen',
    navExpectations: 'Erwartungen & Grenzen',
    navDocs: 'Dokumentation',
    navGitHub: 'GitHub',
    navGetStarted: 'Loslegen',
    langToggle: 'Deutsch',
    heroTitle: 'Weniger lesen. Mehr ausbrüten.<br><span class="gradient-text">Zeit sparen.</span>',
    heroSubtitle:
      'NutEgg ist ein KI-Leseassistent in der Chrome-Seitenleiste. Erhalte sofort Urteile, Zusammenfassungen, Mindmaps und Video-Q&A mit Zeitstempeln für jeden Artikel, Thread oder jedes YouTube-Video – mit deinem eigenen KI-Modell und ganz ohne Konto.',
    chromeStoreBtn: 'Chrome Web Store',
    obsidianPluginBtn: 'Obsidian-Plugin',
    downloadGithubZip: '📦 .zip herunterladen',
    downloadGithubPlugin: '📦 GitHub-Release',
    githubReleases: 'GitHub-Releases',
    readDocsBtn: '📖 Dokumentation lesen',
    starGitHubBtn: '⭐ Stern auf GitHub',
    watchVideoBtn: '🎬 Promo-Video ansehen',
    videoBadge: '🎬 Offizielles Promo-Video',
    videoTitle: 'Erlebe NutEgg in Aktion',
    videoSubtitle:
      'Erfahre, wie NutEgg unübersichtliche Webinhalte in klares, strukturiertes Wissen in deinem Obsidian-Vault verwandelt.',
    videoBannerTitle: 'youtube.com/watch?v=_u6mDoHZSAo — NutEgg Promo-Video',
    bannerTitleText: 'youtube.com/watch?v=... — NutEgg Seitenleiste',
    tourBadge: '✨ Interaktive Produkt-Tour',
    tourTitle: 'Entwickelt für Informationsklarheit',
    tourSubtitle: 'Verwandle unübersichtliche Webinhalte in strukturiertes, anwendbares Wissen.',
    tab0: 'Anti-Clickbait',
    tab1: 'Q&A & Zeitmarken',
    tab2: 'Mindmap',
    tab3: 'Bekanntes überspringen',
    tab4: 'Wissen ausbauen',
    tab5: 'Multi-Quellen',
    slide0Tag: '🎯 Anti-Clickbait-Urteil',
    slide0Title: 'Sofortige Zusammenfassung & Titelurteil',
    slide0Desc:
      'NutEgg kommt direkt zum Punkt: Es beantwortet die Kernfrage der Überschrift in einem prägnanten Satz und sagt dir ehrlich, ob sich deine Zeit lohnt.',
    slide1Tag: '⏱️ Sofortige Video-Navigation',
    slide1Title: 'Fragen stellen & zur Zeitmarke springen',
    slide1Desc:
      'Stelle freie Fragen zum Videoinhalt und erhalte belegte Antworten mit anklickbaren Zeitmarken-Buttons, die direkt zur passenden Stelle im Video führen.',
    slide2Tag: '🧠 Hierarchische Aufschlüsselung',
    slide2Title: 'Interaktive Gedankenbäume',
    slide2Desc:
      'Verwandle einstündige Videos und komplexe Artikel in aufklappbare, mehrstufige Mindmaps. Erfasse Kernaussagen und Zusammenhänge in Sekundenschnelle.',
    slide3Tag: '🧩 Obsidian-Add-on · Neuheitsprüfung',
    slide3Title: 'Überspringe, was du schon weißt',
    slide3Desc:
      'NutEgg vergleicht neue Inhalte mit deiner Obsidian-Wissensbasis und weist dich darauf hin, wenn Themen bereits abgedeckt sind — spart 15 bis 30 Minuten pro Video.',
    slide4Tag: '🧩 Obsidian-Add-on · Wissensbäume',
    slide4Title: 'Lass deinen Obsidian-Vault automatisch wachsen',
    slide4Desc:
      'Isoliert die echten Neuerungen aus deinen Recherchen und bindet sie direkt an den passenden Ästen deiner bestehenden Egg-Notizen ein — ohne manuelle Formatierung.',
    slide5Tag: '🌐 Universelle Kompatibilität',
    slide5Title: 'Jede Plattform, in deiner Muttersprache',
    slide5Desc:
      'Präzise Erfassung von YouTube-Transkripten, Substack-Newslettern, Medium-Artikeln und X-(Twitter-)Threads. Sofortige Zusammenfassung und Übersetzung in über 50 Sprachen.',
    metaphorTitle: 'Die Metapher: Nuts & Eggs',
    metaphorSubtitle: 'Ein intuitives Denkmodell für das persönliche Wissensmanagement.',
    metaphorNutTitle: 'Die Nut: Rohe Erfassungen',
    metaphorNutDesc:
      'Wann immer du auf einen interessanten Artikel oder ein Video stößt, extrahiert NutEgg den Inhalt als "Nut" — inklusive Metadaten und Zeitmarken sicher in nutegg/_raw/ gespeichert.',
    metaphorEggTitle: 'Das Egg: Strukturiertes Wissen',
    metaphorEggDesc:
      'Ein "Egg" ist ein lebendiger, themenspezifischer Wissensbaum in deinem Obsidian-Vault mit definiertem Fokus, Kernfragen und geordneter Begriffshierarchie.',
    metaphorHatchTitle: 'Das Ausbrüten (Hatch): Synthese des Neuen',
    metaphorHatchDesc:
      'KI vergleicht neue Nuts mit vorhandenen Eggs. Statt redundante Notizen anzuhäufen, filtert NutEgg die Neuerungen heraus und verwebt sie in deiner Wissensstruktur.',
    howTitle: "So funktioniert's",
    howSubtitle: 'Von jeder Webseite zu klaren Antworten in Sekunden – direkt in Chrome.',
    step1Title: 'NutEgg zu Chrome hinzufügen',
    step1Desc:
      'Installiere es aus dem Chrome Web Store und wähle in den Optionen deine KI – Gemini, Claude, OpenAI, DeepSeek oder ein lokales Modell. Keine Registrierung nötig.',
    step2Title: 'Seitenleiste auf jeder Seite öffnen',
    step2Desc:
      'Klicke auf das Erweiterungssymbol. NutEgg erfasst automatisch Artikeltext, X-Thread oder YouTube-Transkript des aktiven Tabs.',
    step3Title: 'Das Urteil in Sekunden',
    step3Desc:
      'Erhalte eine direkte Ein-Satz-Antwort auf die Frage im Titel, eine kurze Zusammenfassung, eine aufklappbare Mindmap und ein ehrliches Urteil, ob sich deine Zeit lohnt.',
    step4Title: 'Fragen, erkunden, springen',
    step4Desc:
      'Stelle Fragen auf Basis der Seite – oder darüber hinaus zum Faktencheck – und klicke auf ein Zitat, um zur exakten Videostelle oder zum Absatz zu springen.',
    featTitle: 'Entwickelt für Informationsklarheit',
    featSubtitle:
      'Alles, was du brauchst, um der digitalen Reizüberflutung zu entkommen und keine ungelesenen Lesezeichen mehr anzuhäufen.',
    feat0Title: 'Anti-Clickbait-Urteile',
    feat0Desc:
      'Durchbricht reißerische Überschriften, indem es die zentrale Frage vorab beantwortet, sodass du keine 15 Minuten mit Suchen vergeudest.',
    feat1Title: 'Mindmaps mit anklickbaren Zeitmarken',
    feat1Desc:
      'Extrahiert YouTube-Transkripte und erstellt Mindmaps mit Zeitmarken, die zur entsprechenden Stelle im Video springen.',
    feat2Title: 'Neuheitsorientierte KI-Analyse',
    feat2Desc:
      'Verhindert redundante Notizen. Vergleicht Inhalte mit deinem Bestand und hebt nur hervor, was wirklich neu und nützlich ist.',
    feat3Title: 'Privatsphäre by Design',
    feat3Desc:
      'Kein NutEgg-Konto, keine NutEgg-Server. Dein API-Schlüssel bleibt in deinem Browser, und Seiteninhalte gehen nur an den KI-Anbieter deiner Wahl.',
    feat4Title: 'Wähle dein bevorzugtes KI-Modell',
    feat4Desc:
      'Funktioniert komplett offline mit lokalen LLMs (Ollama, LM Studio) oder verbindet sich mit Gemini, Claude, OpenAI, DeepSeek, Qwen oder OpenRouter.',
    feat6Title: 'Video-Q&A mit Zeitmarken-Sprung',
    feat6Desc:
      'Stelle beliebige Fragen zum Video und erhalte belegte Antworten mit interaktiven Zeitmarken, die direkt zur passenden Abspielposition springen.',
    feat7Title: 'Automatische Wissensbaum-Zusammenführung',
    feat7Desc:
      'Angesammelte Rohnotizen werden automatisch in saubere Hierarchien zusammengeführt, sobald festgelegte Schwellenwerte erreicht sind.',
    expTitle: 'Was du nicht erwarten solltest',
    expSubtitle: 'Ehrliche Grenzen darüber, wo NutEgg glänzt und wofür es nicht gedacht ist.',
    exp0: '<strong>Kein Zauberknopf:</strong> Ein Klick macht dich nicht automatisch klüger. Echtes Verstehen erfordert nach wie vor aktives Lesen, Kritisieren und Anwenden.',
    exp1: '<strong>Für aufgeblähte Inhalte gedacht, nicht für Fachbücher:</strong> NutEgg spart Zeit bei langatmigen Videos und repetitiven Beiträgen. Es ersetzt kein gründliches Studium umfassender Lehrbücher.',
    exp2: '<strong>Nicht auf Unterhaltung ausgelegt:</strong> NutEgg zielt auf Informationsdichte und Erkenntnisse ab, nicht auf das Zusammenfassen von Comedy, Filmen oder Gaming.',
    exp3: '<strong>Laufende Weiterentwicklung:</strong> Die Unterstützung für Podcasts, PDF-Dateien und weitere spezialisierte Extraktoren wird stetig ausgebaut.',
    ctaTitle: 'Lies ab heute smarter',
    ctaSubtitle:
      'Hol dir deine Lesezeit in Sekunden zurück. Füge NutEgg zu Chrome hinzu – und verbinde Obsidian, wann immer du bereit bist.',
    footerText: 'NutEgg — Weniger lesen, mehr ausbrüten. GNU GPLv3 Lizenz.',
    footerDocs: 'Dokumentation',
    footerPrivacy: 'Datenschutzerklärung',
    docsHeaderTitle: 'NutEgg Dokumentation',
    backToWebsite: '← Zurück zur Website',
    sidebarGettingStarted: 'Erste Schritte',
    sidebarOverview: 'Überblick & Kernkonzepte',
    sidebarChrome: 'Chrome-Erweiterung',
    sidebarObsidian: 'Obsidian-Plugin',
    sidebarKnowledge: 'Wissensstrukturierung',
    sidebarWorkflow: 'KI-Workflow-Engine',
    sidebarResources: 'Ressourcen',
    navObsidian: 'Obsidian-Add-on',
    heroBadge: '🧩 Kostenlose Open-Source-Chrome-Erweiterung',
    heroAddonNote:
      'Du nutzt Obsidian? Füge das optionale Plugin hinzu und lass deinen persönlichen Wissensspeicher wachsen →',
    addToChromeBtn: 'Zu Chrome hinzufügen – kostenlos',
    featScopeTitle: 'Innerhalb oder jenseits der Seite',
    featScopeDesc:
      'Halte Antworten streng am Inhalt, oder lass die KI darüber hinausgehen, um Behauptungen zu prüfen und fehlenden Kontext zu ergänzen.',
    featDiscussTitle: 'Kommentar-Digest',
    featDiscussDesc:
      'Fasst Kommentare von YouTube, Reddit und Foren in Kernthemen mit Zustimmungs-/Ablehnungs-Badges zusammen – so siehst du die Meinung der Community auf einen Blick.',
    featSourceTitle: 'Klick zur Quelle',
    featSourceDesc:
      'Mindmap-Knoten und Antworten verlinken auf ihre Quelle – ein Klick scrollt die Seite zum genauen Absatz oder Kommentar.',
    addonBadge: 'Optionales Add-on',
    addonTitle: 'Du nutzt Obsidian? Lass NutEgg deinen Vault wachsen',
    addonSubtitle:
      'Alles oben funktioniert eigenständig in Chrome. Kombiniere NutEgg mit dem kostenlosen Obsidian-Plugin, um Gelesenes in eine wachsende, strukturierte Wissensbasis zu verwandeln.',
    addonHatchTitle: 'Mit einem Klick ausbrüten oder sammeln',
    addonHatchDesc:
      'Webe neue Erkenntnisse in den passenden Wissensbaum ein oder archiviere den Rohinhalt als Markdown in deinem Vault.',
    addonGuideBtn: '📖 Obsidian-Einrichtungsanleitung',
  },
  pt: {
    languageLabel: "Idioma",
    downloadChromeZipHint: "Baixar .zip independente para Chrome",
    githubAssetsHint: "Obter arquivos da versão no GitHub",
    promoVideoTitle: "Vídeo de apresentação do NutEgg",
    previousScreenshot: "Captura anterior",
    nextScreenshot: "Próxima captura",
    chromeLogo: "Logotipo do Chrome",
    obsidianLogo: "Logotipo do Obsidian",
    nuteggIcon: "Ícone do NutEgg",
    websiteTitle: "NutEgg — Assistente de leitura com IA para Chrome · Leia menos, economize tempo",

    navTour: 'Tour pelo produto',
    navMetaphor: 'A metáfora',
    navHowItWorks: 'Como funciona',
    navFeatures: 'Recursos',
    navExpectations: 'Limites e expectativas',
    navDocs: 'Documentação',
    navGitHub: 'GitHub',
    navGetStarted: 'Começar',
    langToggle: 'Português',
    heroTitle: 'Leia menos. Choque mais.<br><span class="gradient-text">Economize tempo.</span>',
    heroSubtitle:
      'O NutEgg é um assistente de leitura com IA que vive no painel lateral do Chrome. Obtenha veredictos, resumos, mapas mentais e perguntas e respostas com marcações de tempo para qualquer artigo, thread ou vídeo do YouTube — usando seu próprio modelo de IA, sem precisar de conta.',
    chromeStoreBtn: 'Chrome Web Store',
    obsidianPluginBtn: 'Plugin do Obsidian',
    downloadGithubZip: '📦 Baixar .zip',
    downloadGithubPlugin: '📦 Versão GitHub',
    githubReleases: 'Releases do GitHub',
    readDocsBtn: '📖 Ler documentação',
    starGitHubBtn: '⭐ Estrela no GitHub',
    watchVideoBtn: '🎬 Ver vídeo promocional',
    videoBadge: '🎬 Vídeo promocional oficial',
    videoTitle: 'Veja o NutEgg em ação',
    videoSubtitle:
      'Veja como o NutEgg transforma conteúdos longos da web em conhecimento estruturado no seu cofre do Obsidian.',
    videoBannerTitle: 'youtube.com/watch?v=_u6mDoHZSAo — Vídeo NutEgg',
    bannerTitleText: 'youtube.com/watch?v=... — Painel lateral do NutEgg',
    tourBadge: '✨ Tour interativo',
    tourTitle: 'Projetado para a clareza da informação',
    tourSubtitle: 'Transforme conteúdos extensos em conhecimento estruturado e prático.',
    tab0: 'Anti-Clickbait',
    tab1: 'Q&A e marcações',
    tab2: 'Mapa mental',
    tab3: 'Pular o já conhecido',
    tab4: 'Expandir o saber',
    tab5: 'Múltiplas fontes',
    slide0Tag: '🎯 Veredito anti-clickbait',
    slide0Title: 'Resumo instantâneo e veredito do título',
    slide0Desc:
      'O NutEgg vai direto ao ponto: responde à pergunta central do título em uma frase direta e diz com franqueza se vale a pena dedicar seu tempo.',
    slide1Tag: '⏱️ Navegação rápida em vídeos',
    slide1Title: 'Faça qualquer pergunta e pule para o momento exato',
    slide1Desc:
      'Faça perguntas livres sobre o vídeo e receba respostas embasadas com marcações de tempo clicáveis que pulam direto para o instante da reprodução.',
    slide2Tag: '🧠 Estruturação hierárquica',
    slide2Title: 'Árvores de ideias interativas',
    slide2Desc:
      'Transforme vídeos longos e artigos densos em mapas mentais recolhíveis de múltiplos níveis. Visualize relações conceituais em poucos segundos.',
    slide3Tag: '🧩 Complemento Obsidian · Detecção de novidades',
    slide3Title: 'Pule o que você já sabe',
    slide3Desc:
      'O NutEgg compara o novo conteúdo com sua base de conhecimento no Obsidian e alerta quando as ideias já foram abordadas, poupando de 15 a 30 minutos por vídeo.',
    slide4Tag: '🧩 Complemento Obsidian · Árvores de conhecimento',
    slide4Title: 'Faça seu cofre do Obsidian crescer automaticamente',
    slide4Desc:
      'Isola os aprendizados inéditos da sua navegação e os conecta sob os ramos certos dos seus arquivos egg existentes, sem necessidade de formatação manual.',
    slide5Tag: '🌐 Compatibilidade universal',
    slide5Title: 'Qualquer plataforma, no seu idioma nativo',
    slide5Desc:
      'Extração precisa de transcrições do YouTube, newsletters do Substack, artigos do Medium e tópicos do X (Twitter). Resume e traduz para mais de 50 idiomas na hora.',
    metaphorTitle: 'A metáfora: Nuts & Eggs',
    metaphorSubtitle: 'Um modelo mental intuitivo e prático para gestão do conhecimento pessoal.',
    metaphorNutTitle: 'O Nut: Capturas brutas',
    metaphorNutDesc:
      'Sempre que você encontra um artigo ou vídeo relevante, o NutEgg extrai o conteúdo em um "nut", com metadados, marcações de tempo e contexto salvos em nutegg/_raw/.',
    metaphorEggTitle: 'O Egg: Conhecimento estruturado',
    metaphorEggDesc:
      'Um "egg" é uma árvore temática viva em seu cofre do Obsidian. Cada egg define escopos, perguntas essenciais e uma hierarquia organizada de conceitos que importam para você.',
    metaphorHatchTitle: 'O Chocar (Hatch): Síntese de novidades',
    metaphorHatchDesc:
      'A IA compara os novos nuts com seus eggs já existentes. Em vez de acumular notas duplicadas, o NutEgg separa o que é novidade e integra na sua estrutura.',
    howTitle: 'Como funciona',
    howSubtitle: 'De qualquer página web a respostas claras em segundos — direto no Chrome.',
    step1Title: 'Adicione o NutEgg ao Chrome',
    step1Desc:
      'Instale pela Chrome Web Store e escolha sua IA nas Opções — Gemini, Claude, OpenAI, DeepSeek ou um modelo local. Sem cadastro.',
    step2Title: 'Abra o painel lateral em qualquer página',
    step2Desc:
      'Clique no ícone da extensão. O NutEgg captura automaticamente o texto do artigo, a thread do X ou a transcrição do YouTube da aba ativa.',
    step3Title: 'Receba o veredicto em segundos',
    step3Desc:
      'Veja uma resposta direta de uma frase à pergunta do título, um breve resumo executivo, um mapa mental recolhível e um veredicto honesto sobre se vale o seu tempo.',
    step4Title: 'Pergunte, explore, pule',
    step4Desc:
      'Faça perguntas baseadas na página — ou além dela, para checar fatos — e clique em qualquer citação para pular ao momento exato do vídeo ou ao parágrafo.',
    featTitle: 'Construído para a clareza da informação',
    featSubtitle:
      'Tudo o que você precisa para superar a sobrecarga digital e parar de acumular favoritos que nunca serão lidos.',
    feat0Title: 'Vereditos anti-clickbait',
    feat0Desc:
      'Desfaz o mistério de títulos apelativos respondendo à dúvida central logo de início, para que você não gaste 15 minutos procurando.',
    feat1Title: 'Mapas mentais com marcações de tempo clicáveis',
    feat1Desc:
      'Extrai transcrições completas do YouTube e cria mapas mentais com marcações de tempo para ir ao momento exato do vídeo.',
    feat2Title: 'Análise com foco em novidade',
    feat2Desc: 'Evita anotações repetitivas. Compara com seu acervo e evidencia apenas as ideias frescas e relevantes.',
    feat3Title: 'Privado por design',
    feat3Desc:
      'Sem conta NutEgg e sem servidores NutEgg. Sua chave de API fica no navegador e o conteúdo vai apenas para o provedor de IA que você escolher.',
    feat4Title: 'Traga seu modelo de IA preferido',
    feat4Desc:
      'Funcione offline com LLMs locais (Ollama, LM Studio) ou conecte-se a Gemini, Claude, OpenAI, DeepSeek, Qwen ou OpenRouter.',
    feat6Title: 'Q&A em vídeo com salto de tempo',
    feat6Desc:
      'Faça perguntas sobre o vídeo e receba respostas com botões interativos de tempo que saltam para o segundo exato na reprodução.',
    feat7Title: 'Mesclagem automática da árvore de saber',
    feat7Desc:
      'Insights acumulados são sintetizados e organizados automaticamente em ramificações limpas assim que atingem os limites configurados.',
    expTitle: 'O que você não deve esperar',
    expSubtitle: 'Limites transparentes sobre onde o NutEgg se destaca e para o que ele não foi criado.',
    exp0: '<strong>Não é um botão mágico:</strong> Você não ficará mais sábio apenas clicando em um botão. Dominar o conhecimento ainda requer leitura ativa, espírito crítico e prática.',
    exp1: '<strong>Feito para conteúdos inchados e clickbait, não livros densos:</strong> Ideal para poupar tempo em vídeos prolixos e artigos superficiais. Não substitui o estudo aprofundado de livros didáticos.',
    exp2: '<strong>Não voltado para entretenimento:</strong> O foco é a densidade de ideias e aprendizados práticos, não o resumo de comédias, filmes ou lazer.',
    exp3: '<strong>Projeto em evolução:</strong> O suporte para podcasts, arquivos PDF e novos extratores específicos está em pleno desenvolvimento.',
    ctaTitle: 'Comece a ler de forma mais inteligente hoje',
    ctaSubtitle:
      'Recupere seu tempo de leitura em segundos. Adicione o NutEgg ao Chrome — e conecte o Obsidian quando quiser.',
    footerText: 'NutEgg — Leia menos, choque mais. Licenciado sob GNU GPLv3.',
    footerDocs: 'Documentação',
    footerPrivacy: 'Política de privacidade',
    docsHeaderTitle: 'Documentação do NutEgg',
    backToWebsite: '← Voltar ao site',
    sidebarGettingStarted: 'Primeiros passos',
    sidebarOverview: 'Visão geral e conceitos',
    sidebarChrome: 'Extensão do Chrome',
    sidebarObsidian: 'Plugin do Obsidian',
    sidebarKnowledge: 'Estruturação de conhecimento',
    sidebarWorkflow: 'Motor de fluxos de IA',
    sidebarResources: 'Recursos',
    navObsidian: 'Complemento Obsidian',
    heroBadge: '🧩 Extensão do Chrome gratuita e de código aberto',
    heroAddonNote: 'Usa o Obsidian? Adicione o plugin opcional para fazer crescer seu cofre de conhecimento →',
    addToChromeBtn: 'Adicionar ao Chrome — É grátis',
    featScopeTitle: 'Dentro ou além da página',
    featScopeDesc:
      'Mantenha as respostas estritamente fundamentadas no conteúdo, ou deixe a IA ir além para verificar afirmações e acrescentar contexto.',
    featDiscussTitle: 'Resumo dos comentários',
    featDiscussDesc:
      'Resume comentários do YouTube, Reddit e fóruns em temas principais com selos de posição (a favor/contra), para você ver a opinião geral de relance.',
    featSourceTitle: 'Navegação até a fonte',
    featSourceDesc:
      'Nós do mapa mental e respostas apontam para a fonte — clique para rolar a página até o parágrafo ou comentário exato.',
    addonBadge: 'Complemento opcional',
    addonTitle: 'Usa o Obsidian? Deixe o NutEgg fazer seu cofre crescer',
    addonSubtitle:
      'Tudo acima funciona sozinho no Chrome. Combine o NutEgg com o plugin gratuito do Obsidian para transformar o que você lê em uma base de conhecimento estruturada e em evolução.',
    addonHatchTitle: 'Chocar ou coletar com um clique',
    addonHatchDesc:
      'Integre novos insights à árvore de conhecimento correspondente ou arquive o conteúdo bruto em Markdown no seu cofre.',
    addonGuideBtn: '📖 Guia de configuração do Obsidian',
  },
  ru: {
    languageLabel: "Язык",
    downloadChromeZipHint: "Скачать отдельный .zip для Chrome",
    githubAssetsHint: "Скачать файлы выпуска с GitHub",
    promoVideoTitle: "Презентационный ролик NutEgg",
    previousScreenshot: "Предыдущий снимок",
    nextScreenshot: "Следующий снимок",
    chromeLogo: "Логотип Chrome",
    obsidianLogo: "Логотип Obsidian",
    nuteggIcon: "Значок NutEgg",
    websiteTitle: "NutEgg — ИИ-помощник для чтения в Chrome · Читайте меньше, экономьте время",

    navTour: 'Обзор продукта',
    navMetaphor: 'Концепция',
    navHowItWorks: 'Как это работает',
    navFeatures: 'Возможности',
    navExpectations: 'Ожидания и границы',
    navDocs: 'Документация',
    navGitHub: 'GitHub',
    navGetStarted: 'Начать',
    langToggle: 'Русский',
    heroTitle: 'Меньше читайте. Больше высиживайте.<br><span class="gradient-text">Экономьте время.</span>',
    heroSubtitle:
      'NutEgg — ИИ-помощник для чтения в боковой панели Chrome. Мгновенно получайте вердикты, краткие изложения, интеллект-карты и ответы на вопросы по видео с таймкодами для любой статьи, треда или видео на YouTube — с вашей собственной ИИ-моделью и без регистрации.',
    chromeStoreBtn: 'Chrome Web Store',
    obsidianPluginBtn: 'Плагин Obsidian',
    downloadGithubZip: '📦 Скачать .zip',
    downloadGithubPlugin: '📦 Релиз на GitHub',
    githubReleases: 'Релизы GitHub',
    readDocsBtn: '📖 Читать документацию',
    starGitHubBtn: '⭐ Звезда на GitHub',
    watchVideoBtn: '🎬 Смотреть промо-видео',
    videoBadge: '🎬 Официальное промо-видео',
    videoTitle: 'NutEgg в действии',
    videoSubtitle:
      'Посмотрите, как NutEgg превращает избыточный веб-контент в структурированные знания в хранилище Obsidian.',
    videoBannerTitle: 'youtube.com/watch?v=_u6mDoHZSAo — Промо NutEgg',
    bannerTitleText: 'youtube.com/watch?v=... — Боковая панель NutEgg',
    tourBadge: '✨ Интерактивный тур',
    tourTitle: 'Создано для ясности информации',
    tourSubtitle: 'Превращайте перегруженный веб-контент в структурированные знания.',
    tab0: 'Анти-кликбейт',
    tab1: 'Q&A и таймкоды',
    tab2: 'Интеллект-карта',
    tab3: 'Пропуск знакомого',
    tab4: 'Развитие базы',
    tab5: 'Множество источников',
    slide0Tag: '🎯 Анти-кликбейтный вердикт',
    slide0Title: 'Мгновенное резюме и вердикт по заголовку',
    slide0Desc:
      'NutEgg сразу переходит к сути: отвечает на главный вопрос заголовка одним четким предложением и честно говорит, стоит ли материал вашего времени.',
    slide1Tag: '⏱️ Мгновенная навигация по видео',
    slide1Title: 'Задайте любой вопрос и перейдите к таймкоду',
    slide1Desc:
      'Задавайте вопросы по видео в свободной форме и получайте ответы с интерактивными кнопками таймкодов, переносящими прямо к нужному моменту.',
    slide2Tag: '🧠 Иерархическая структура',
    slide2Title: 'Интерактивные деревья мыслей',
    slide2Desc:
      'Превращайте часовые видеоролики и сложные статьи в многоуровневые интеллект-карты. Оценивайте ключевые выводы и связи между понятиями за секунды.',
    slide3Tag: '🧩 Дополнение Obsidian · Проверка новизны',
    slide3Title: 'Пропускайте то, что уже знаете',
    slide3Desc:
      'NutEgg сверяет материал с базой знаний в Obsidian и предупреждает, если тема уже изучена, экономя вам от 15 до 30 минут на каждом видео.',
    slide4Tag: '🧩 Дополнение Obsidian · Деревья знаний',
    slide4Title: 'Автоматический рост вашего хранилища Obsidian',
    slide4Desc:
      'Выделяет принципиально новые тезисы и встраивает их в нужные ветви существующих заметок egg без необходимости ручного форматирования.',
    slide5Tag: '🌐 Универсальная совместимость',
    slide5Title: 'Любая платформа на вашем родном языке',
    slide5Desc:
      'Точное извлечение субтитров YouTube, рассылок Substack, статей Medium и веток X (Twitter). Мгновенный перевод и саммари более чем на 50 языков.',
    metaphorTitle: 'Метафора: Nuts и Eggs',
    metaphorSubtitle: 'Интуитивная и практичная модель для управления личными знаниями.',
    metaphorNutTitle: 'The Nut: Исходный захват',
    metaphorNutDesc:
      'Каждый раз, когда вы находите полезную статью или видео, NutEgg сохраняет исходный текст в виде «nut» с метаданными и метками времени в nutegg/_raw/.',
    metaphorEggTitle: 'The Egg: Структурированное знание',
    metaphorEggDesc:
      '«Egg» — это живое тематическое дерево знаний в вашем Obsidian. Каждый egg содержит границы темы, ключевые вопросы и выстроенную иерархию понятий.',
    metaphorHatchTitle: 'The Hatch (Высиживание): Синтез новизны',
    metaphorHatchDesc:
      'ИИ сравнивает новые nuts с имеющимися eggs. Вместо накопления дубликатов NutEgg находит новые крупицы смысла и встраивает их в структуру базы.',
    howTitle: 'Как это работает',
    howSubtitle: 'От любой веб-страницы к ясным ответам за секунды — прямо в Chrome.',
    step1Title: 'Добавьте NutEgg в Chrome',
    step1Desc:
      'Установите из Интернет-магазина Chrome и выберите ИИ в настройках — Gemini, Claude, OpenAI, DeepSeek или локальную модель. Регистрация не нужна.',
    step2Title: 'Откройте боковую панель на любой странице',
    step2Desc:
      'Нажмите на значок расширения. NutEgg автоматически извлечёт текст статьи, тред X или расшифровку YouTube из активной вкладки.',
    step3Title: 'Вердикт за секунды',
    step3Desc:
      'Получите прямой ответ в одно предложение на вопрос из заголовка, короткое резюме, сворачиваемую интеллект-карту и честный вердикт: стоит ли это вашего времени.',
    step4Title: 'Спрашивайте, исследуйте, переходите',
    step4Desc:
      'Задавайте вопросы по содержимому страницы — или за её пределами для проверки фактов — и нажимайте на цитаты, чтобы перейти к нужному моменту видео или абзацу.',
    featTitle: 'Создано для ясности информации',
    featSubtitle:
      'Всё необходимое, чтобы победить информационную перегрузку и перестать копить непрочитанные закладки.',
    feat0Title: 'Вердикты против кликбейта',
    feat0Desc:
      'Разрушает интригу громких заголовков, сразу давая четкий ответ, чтобы вам не пришлось тратить 15 минут на его поиски.',
    feat1Title: 'Интеллект-карты с кликабельными временными метками',
    feat1Desc:
      'Извлекает полные транскрипты YouTube и создаёт интеллект-карты с временными метками для перехода к нужному моменту видео.',
    feat2Title: 'Анализ с упором на новизну',
    feat2Desc:
      'Предотвращает появление дубликатов. Сравнивает материал с вашим багажом знаний и подчеркивает только свежие идеи.',
    feat3Title: 'Конфиденциальность по умолчанию',
    feat3Desc:
      'Никаких аккаунтов и серверов NutEgg. Ваш API-ключ хранится в браузере, а содержимое страниц отправляется только выбранному вами ИИ-провайдеру.',
    feat4Title: 'Используйте любую модель ИИ',
    feat4Desc:
      'Работайте полностью офлайн с локальными LLM (Ollama, LM Studio) или подключайте Gemini, Claude, OpenAI, DeepSeek, Qwen или OpenRouter.',
    feat6Title: 'Q&A по видео с переходом по таймкодам',
    feat6Desc:
      'Задавайте вопросы по содержанию видео и получайте ответы со ссылками-метками, мгновенно перематывающими видео на нужный фрагмент.',
    feat7Title: 'Автоматическое объединение веток',
    feat7Desc:
      'Накопленные сырые заметки автоматически синтезируются в четкую иерархическую структуру при достижении заданного порога.',
    expTitle: 'Чего ожидать не стоит',
    expSubtitle: 'Честные границы: в чем NutEgg незаменим, а для чего он не предназначен.',
    exp0: '<strong>Это не волшебная кнопка:</strong> Нажатие кнопки не сделает вас экспертом само по себе. Для усвоения знаний по-прежнему нужны вдумчивое чтение и практика.',
    exp1: '<strong>Для раздутого контента, а не академических учебников:</strong> Идеально экономит время на растянутых роликах и поверхностных статьях. Не заменяет фундаментальное изучение учебников.',
    exp2: '<strong>Не для развлечений:</strong> Инструмент ориентирован на высокую плотность фактов и прикладную пользу, а не на пересказ комедий или кинофильмов.',
    exp3: '<strong>Проект в активной разработке:</strong> Поддержка подкастов, PDF-документов и новых специализированных парсеров находится в разработке.',
    ctaTitle: 'Начните читать умнее уже сегодня',
    ctaSubtitle:
      'Верните своё время на чтение за секунды. Добавьте NutEgg в Chrome — и подключите Obsidian, когда будете готовы.',
    footerText: 'NutEgg — Меньше читайте, больше высиживайте. Лицензия GNU GPLv3.',
    footerDocs: 'Документация',
    footerPrivacy: 'Политика конфиденциальности',
    docsHeaderTitle: 'Документация NutEgg',
    backToWebsite: '← Вернуться на сайт',
    sidebarGettingStarted: 'Начало работы',
    sidebarOverview: 'Обзор и концепция',
    sidebarChrome: 'Расширение Chrome',
    sidebarObsidian: 'Плагин Obsidian',
    sidebarKnowledge: 'Структурирование знаний',
    sidebarWorkflow: 'Движок рабочих процессов ИИ',
    sidebarResources: 'Ресурсы',
    navObsidian: 'Дополнение Obsidian',
    heroBadge: '🧩 Бесплатное расширение Chrome с открытым кодом',
    heroAddonNote: 'Пользуетесь Obsidian? Добавьте необязательный плагин, чтобы выращивать личное хранилище знаний →',
    addToChromeBtn: 'Добавить в Chrome — бесплатно',
    featScopeTitle: 'В рамках страницы или за ними',
    featScopeDesc:
      'Ограничьте ответы строго содержимым страницы или позвольте ИИ выйти за её рамки, чтобы проверить утверждения и добавить контекст.',
    featDiscussTitle: 'Сводка комментариев',
    featDiscussDesc:
      'Сводит комментарии YouTube, Reddit и форумов в ключевые темы со значками позиции (за/против), чтобы вы сразу видели мнение аудитории.',
    featSourceTitle: 'Переход к источнику',
    featSourceDesc:
      'Узлы интеллект-карты и ответы ссылаются на источник — нажмите, чтобы прокрутить страницу к нужному абзацу или комментарию.',
    addonBadge: 'Необязательное дополнение',
    addonTitle: 'Пользуетесь Obsidian? Пусть NutEgg растит ваше хранилище',
    addonSubtitle:
      'Всё перечисленное выше работает само по себе в Chrome. Подключите бесплатный плагин Obsidian, чтобы превращать прочитанное в развивающуюся структурированную базу знаний.',
    addonHatchTitle: 'Высидеть или собрать в один клик',
    addonHatchDesc:
      'Вплетайте новые идеи в подходящее дерево знаний или архивируйте исходный материал в Markdown в своём хранилище.',
    addonGuideBtn: '📖 Руководство по настройке Obsidian',
  },
};

const SUPPORTED_WEB_LANGS = ['en', 'zh', 'es', 'ja', 'ko', 'ar', 'fr', 'de', 'pt', 'ru'];

let currentWebLang = 'en';

function initWebI18n() {
  try {
    const saved = localStorage.getItem('nutegg_lang');
    if (saved && SUPPORTED_WEB_LANGS.includes(saved)) {
      currentWebLang = saved;
    } else {
      const browser = (navigator.language || 'en').toLowerCase();
      if (browser.startsWith('zh')) currentWebLang = 'zh';
      else if (browser.startsWith('es')) currentWebLang = 'es';
      else if (browser.startsWith('ja')) currentWebLang = 'ja';
      else if (browser.startsWith('ko')) currentWebLang = 'ko';
      else if (browser.startsWith('ar')) currentWebLang = 'ar';
      else if (browser.startsWith('fr')) currentWebLang = 'fr';
      else if (browser.startsWith('de')) currentWebLang = 'de';
      else if (browser.startsWith('pt')) currentWebLang = 'pt';
      else if (browser.startsWith('ru')) currentWebLang = 'ru';
      else currentWebLang = 'en';
    }
  } catch {}

  applyWebI18n();
}

function setWebLanguage(lang) {
  if (SUPPORTED_WEB_LANGS.includes(lang)) {
    currentWebLang = lang;
  } else {
    currentWebLang = 'en';
  }
  try {
    localStorage.setItem('nutegg_lang', currentWebLang);
  } catch {}
  applyWebI18n();
}

function tWeb(key) {
  const dict = websiteTranslations[currentWebLang] || websiteTranslations.en;
  const docs = typeof docsTranslations !== 'undefined' ? docsTranslations : {};
  return dict[key] || docs[currentWebLang]?.[key] || websiteTranslations.en[key] || docs.en?.[key] || key;
}

function applyWebI18n() {
  if (typeof document === 'undefined') return;

  document.documentElement.lang = currentWebLang === 'zh' ? 'zh-CN' : currentWebLang;
  document.documentElement.dir = currentWebLang === 'ar' ? 'rtl' : 'ltr';

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key) {
      el.textContent = tWeb(key);
    }
  });

  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    if (key) {
      el.innerHTML = tWeb(key);
    }
  });

  for (const attribute of ['title', 'aria-label', 'alt']) {
    document.querySelectorAll(`[data-i18n-${attribute}]`).forEach(el => {
      el.setAttribute(attribute, tWeb(el.getAttribute(`data-i18n-${attribute}`)));
    });
  }

  // Sync language dropdown selectors
  document.querySelectorAll('#lang-select, .nav-lang-select').forEach(sel => {
    sel.value = currentWebLang;
  });

  // Fallback for legacy toggle button if present
  const toggleBtn = document.getElementById('lang-toggle-btn');
  if (toggleBtn) {
    toggleBtn.innerHTML = '🌐 ' + (tWeb('langToggle') || currentWebLang.toUpperCase());
  }
}

// Attach listener on DOM ready
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initWebI18n();

    // Listen to dropdown changes
    document.querySelectorAll('#lang-select, .nav-lang-select').forEach(sel => {
      sel.addEventListener('change', e => {
        setWebLanguage(e.target.value);
      });
    });

    // Fallback toggle button
    const toggleBtn = document.getElementById('lang-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const nextIdx = (SUPPORTED_WEB_LANGS.indexOf(currentWebLang) + 1) % SUPPORTED_WEB_LANGS.length;
        setWebLanguage(SUPPORTED_WEB_LANGS[nextIdx]);
      });
    }
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { websiteTranslations, SUPPORTED_WEB_LANGS, setWebLanguage, initWebI18n, tWeb };
}
