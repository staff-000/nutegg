(function (root, factory) {
  if (typeof module !== "undefined" && module.exports) {
    module.exports = factory();
  } else {
    root.NutEggI18n = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : (typeof window !== "undefined" ? window : this), function () {
const translations = {
  en: {
    // Header
    aiCredit: "AI Credit",
    obsidianOffline: "Obsidian is offline",
    obsidianOnline: "Obsidian is online",
    startObsidian: "Start Obsidian with NutEgg",
    settingsTooltip: "Settings",

    // Page info & questions
    loading: "Loading...",
    loadingContent: "Loading content…",
    refreshTooltip: "Refresh content extraction",
    askQuestionsToggle: "💭 Ask your own questions",
    customQuestionsPlaceholder: "One question per line — answered along with the egg's key questions.",
    modeFast: "⚡ Fast",
    modeFastTooltip: "Full analysis in 1 click (fastest)",
    modeConfirm: "🎯 Confirm Eggs",
    modeConfirmTooltip: "Review matching eggs before comparing knowledge (saves tokens)",

    // Banners
    aiKeyMissing: "AI Key Required: Obsidian is offline and no AI API key is configured in Chrome.",
    openSettingsKeyBtn: "⚙️ Open Settings to Add Key",
    orStartObsidian: "or start Obsidian",
    standaloneTip: "Standalone Mode: Analyzing directly in Chrome.",
    useObsidianUnlock: "Use Obsidian to unlock knowledge tree curation!",
    duplicateFound: "Already processed in your vault",

    // Analysis sections
    analysisSections: "Analysis Sections",
    chipVerdict: "Verdict",
    chipSummary: "Summary",
    chipMindmap: "Mind Map",
    chipChapters: "Chapters",

    // Buttons
    analyze: "Analyze",
    reanalyze: "🔄 Re-analyze",
    hatchEgg: "🐣 Hatch Egg",
    collectNutOnly: "🌰 Collect Nut Only",
    collectNut: "🌰 Collect Nut",
    discard: "Discard",
    back: "← Back",

    // Results state
    standaloneResult: "📱 Standalone Analysis — Stage 1 content summary.",
    startObsidianToMatch: "Start Obsidian to save & match eggs ↗",
    stage1Complete: "Stage 1 Complete: Review matching eggs below to hatch into the vault and decide if worth reading.",
    eggsHeader: "Eggs",
    createNewEgg: "➕ Create a new egg",
    eggNamePlaceholder: "egg name (e.g. productivity)",
    eggDescPlaceholder: "what this egg captures (one line)",
    createEggBtn: "Create Egg",
    reanalyzeEggsBtn: "🔄 Re-analyze with selected eggs",
    verdictReadSection: "📖 Should you read it?",
    titleVerdictSection: "🎯 Title Verdict",
    coreSummarySection: "📋 Core Summary",
    mindmapSection: "🧠 Mind Map",
    chapterSection: "🗺️ Chapter Map",
    chapterJumpHint: "(click to jump)",
    yourQuestionsSection: "💭 Your Questions",
    followupPlaceholder: "Ask a follow-up question about this content…",
    askBtn: "Ask",
    eggKnowledgeSection: "🥚 Egg Knowledge",
    eggKnowledgeHint: "(by egg)",
    noEggMatched: "🐣 No egg matched — create one?",
    curatePitch: "✨ Want to curate this into your knowledge base? Start Obsidian with the NutEgg plugin to compare against your knowledge eggs and record insights into your vault.",

    // Metrics & Footer
    metricNuts: "Collected 🌰",
    metricEggs: "Hatched 🥚",
    metricTime: "Saved ⏱️",
    reportBug: "🐛 Report Bug",
    getObsidianPlugin: "Get Obsidian Plugin",

    // Options Page
    optionsTitle: "NutEgg Settings",
    uiLanguageSection: "Interface Language",
    uiLanguageDesc: "Choose extension display language.",
    uiLanguageLabel: "Language",
    uiLangAuto: "Auto (Follow Browser)",
    uiLangEn: "English",
    uiLangZh: "简体中文 (Chinese)",

    workflowSection: "Analysis Workflow",
    defaultAnalysisMode: "Default Analysis Mode",
    fastModeOpt: "⚡ Fast Mode (Auto-proceed)",
    confirmModeOpt: "🎯 Confirm Eggs Mode (Interactive)",
    fastDescText: "NutEgg summarizes page content and chapter map, automatically matches relevant eggs from your vault, and immediately proceeds to knowledge comparison so you get your reading verdict without extra clicks.",
    confirmDescText: "NutEgg summarizes the page and identifies relevant eggs, then pauses so you can review matched eggs, select or uncheck topics, or skip comparison before proceeding.",

    outputLanguageSection: "Output Language",
    outputLanguageDesc: "Choose the language used for generated verdicts, summaries, and mind maps.",
    preferredLanguage: "Preferred Language",
    sameAsContent: "Same as content (follow captured text)",

    sectionsConfigSection: "Content Analysis Sections",
    sectionsConfigDesc: "Configure which sections are generated during Content Analysis. Disabling unused sections completely removes them from the AI prompt and output schema, saving tokens and cutting latency.",
    sectionVerdictOpt: "Title Verdict — Direct 1-sentence answer to the title's question",
    sectionSummaryOpt: "Key Takeaways / Core Summary — Top 3 bullet points of core insights",
    sectionMindmapOpt: "Mind Map — Concept tree & outline",
    sectionMindmapSaving: "saves ~1,000–2,500 tokens & 5–15s",
    sectionChaptersOpt: "Chapter Map — Timestamped breakdown for videos and long articles",
    saveSectionsBtn: "Save Section Preferences",

    obsidianCompanionSection: "Obsidian Plugin Companion",
    obsidianCompanionDesc: "NutEgg is a two-part system: this Chrome Extension captures content from your browser, while the Obsidian plugin handles AI analysis and knowledge tree curation in your vault.",
    getObsidianPluginBtn: "📥 Get NutEgg on Obsidian Community Plugins ↗",

    serverConnSection: "Server Connection",
    serverPortLabel: "Obsidian Server Port",
    serverPortHint: "Must match the port configured in Obsidian → NutEgg → Developer Mode → Server Port.",
    dontHavePlugin: "Don't have the plugin yet?",
    installNutEggObsidian: "Install NutEgg for Obsidian ↗",
    saveBtn: "Save",
    testConnBtn: "Test Connection",

    standaloneSection: "Standalone Mode (Optional)",
    useChromeOnlyAi: "Use Chrome-only AI (when Obsidian is offline)",
    standaloneHint: "Allows Chrome to run Stage 1 content analysis and summaries directly in the browser when Obsidian is closed.",
    aiConfigSection: "AI Configuration (Standalone Mode)",
    aiProviderLabel: "1. AI Provider",
    aiProviderHint: "Choose your preferred provider for direct in-browser analysis when Obsidian is closed.",
    aiModelLabel: "2. Model",
    localEndpointLabel: "Local Server Endpoint",
    aiKeyLabel: "3. API Key",
    aiKeyHint: "API keys are stored securely in Chrome local storage and sent only to the provider endpoint.",
    customPromptsLabel: "4. Custom Prompts",
    resetDefaultPrompt: "Reset to Default",
    promptHint: "Customize the template used by Chrome standalone AI. Variables like {{title}}, {{url}}, {{content}} are dynamically replaced during analysis.",
    saveAiBtn: "Save AI Settings",
    testAiBtn: "Test AI Connection",

    keyboardShortcutSection: "Keyboard Shortcut",
    keyboardShortcutDesc: "Configure the quick-capture shortcut at",
    helpSection: "Help & Feedback",
    helpDesc: "Encountered an issue or unexpected behavior? Let us know on GitHub.",
    reportBugBtn: "🐛 Report Bug on GitHub ↗",

    // Dynamic Notices
    saved: "Saved!",
    connected: "Connected!",
    connectionFailed: "Connection failed",
    analyzing: "Analyzing...",
    analyzingStage1: "Stage 1: Extracting insights & matching eggs...",
    analyzingStage2: "Stage 2: Hatching knowledge into eggs...",
    copySuccess: "Copied!",
    eggCreatedNotice: "Egg created!",
    pleaseEnterEggName: "Please enter an egg name",
  },

  zh_CN: {
    // Header
    aiCredit: "AI 额度",
    obsidianOffline: "Obsidian 未连接",
    obsidianOnline: "Obsidian 已连接",
    startObsidian: "请启动带有 NutEgg 插件的 Obsidian",
    settingsTooltip: "设置",

    // Page info & questions
    loading: "加载中...",
    loadingContent: "正在提取网页内容…",
    refreshTooltip: "重新提取网页内容",
    askQuestionsToggle: "💭 提出您的问题",
    customQuestionsPlaceholder: "每行一个问题 — 将与知识卡片的核心问题一起回答。",
    modeFast: "⚡ 快速",
    modeFastTooltip: "一键完整分析（最快）",
    modeConfirm: "🎯 确认主题",
    modeConfirmTooltip: "在比对知识前确认匹配的 Egg 主题（节省 Token）",

    // Banners
    aiKeyMissing: "需要配置 AI Key：Obsidian 未连接，且 Chrome 中尚未配置 AI API Key。",
    openSettingsKeyBtn: "⚙️ 打开设置添加 Key",
    orStartObsidian: "或 启动 Obsidian",
    standaloneTip: "独立模式：直接在 Chrome 中分析。",
    useObsidianUnlock: "配合 Obsidian 解锁知识树构建！",
    duplicateFound: "Obsidian 知识库中已存在此内容",

    // Analysis sections
    analysisSections: "分析模块",
    chipVerdict: "标题结论",
    chipSummary: "核心摘要",
    chipMindmap: "思维导图",
    chipChapters: "章节脉络",

    // Buttons
    analyze: "开始分析",
    reanalyze: "🔄 重新分析",
    hatchEgg: "🐣 孵化 Egg",
    collectNutOnly: "🌰 仅归档素材",
    collectNut: "🌰 归档素材",
    discard: "放弃",
    back: "← 返回",

    // Results state
    standaloneResult: "📱 独立分析模式 — 第一阶段内容总结。",
    startObsidianToMatch: "启动 Obsidian 以保存素材并匹配 Egg 知识 ↗",
    stage1Complete: "第一阶段完成：在下方查看匹配的 Egg 主题，选择孵化存入知识库或决定是否精读。",
    eggsHeader: "匹配的 Egg",
    createNewEgg: "➕ 创建新 Egg",
    eggNamePlaceholder: "Egg 名称（如：productivity）",
    eggDescPlaceholder: "涵盖的知识范畴（简短一句话）",
    createEggBtn: "创建 Egg",
    reanalyzeEggsBtn: "🔄 使用选中的 Egg 重新分析",
    verdictReadSection: "📖 值得读吗？",
    titleVerdictSection: "🎯 标题直答",
    coreSummarySection: "📋 核心摘要",
    mindmapSection: "🧠 思维导图",
    chapterSection: "🗺️ 章节脉络",
    chapterJumpHint: "（点击跳转时间）",
    yourQuestionsSection: "💭 自定义提问",
    followupPlaceholder: "追问关于此内容的问题…",
    askBtn: "提问",
    eggKnowledgeSection: "🥚 知识卡片",
    eggKnowledgeHint: "（按 Egg 归类）",
    noEggMatched: "🐣 未匹配到已有 Egg — 创建一个？",
    curatePitch: "✨ 想将这些内容沉淀入知识库？启动带有 NutEgg 插件的 Obsidian，即可比对知识增量并将洞察自动保存至库中。",

    // Metrics & Footer
    metricNuts: "已收集 🌰",
    metricEggs: "已孵化 🥚",
    metricTime: "已节省 ⏱️",
    reportBug: "🐛 反馈问题",
    getObsidianPlugin: "获取 Obsidian 插件",

    // Options Page
    optionsTitle: "NutEgg 设置",
    uiLanguageSection: "界面语言",
    uiLanguageDesc: "选择扩展界面的显示语言。",
    uiLanguageLabel: "语言设置",
    uiLangAuto: "自动（跟随浏览器）",
    uiLangEn: "English",
    uiLangZh: "简体中文",

    workflowSection: "分析流程",
    defaultAnalysisMode: "默认分析模式",
    fastModeOpt: "⚡ 快速模式（自动推进）",
    confirmModeOpt: "🎯 确认主题模式（交互选择）",
    fastDescText: "NutEgg 提炼页面内容与章节脉络，自动从 Obsidian 库中匹配关联 Egg 主题，并立即进行知识比对给出精读判断，无需额外点击。",
    confirmDescText: "NutEgg 提炼页面并推荐相关 Egg 后暂停，方便您检查匹配的主题、勾选/取消关注领域，或在比对前跳过。",

    outputLanguageSection: "AI 输出语言",
    outputLanguageDesc: "选择 AI 生成标题结论、核心摘要和思维导图时的目标语言。",
    preferredLanguage: "首选语言",
    sameAsContent: "与原文一致（跟随提取的内容语言）",

    sectionsConfigSection: "内容分析模块设置",
    sectionsConfigDesc: "自定义在内容分析中需要生成的模块。关闭未使用的模块将彻底从 AI 提示词和输出 Schema 中移除，节省 Token 并降低延迟。",
    sectionVerdictOpt: "标题直答 — 一句话直接回答标题提出的问题",
    sectionSummaryOpt: "核心摘要 — 提取 3 条最重要的核心洞察",
    sectionMindmapOpt: "思维导图 — 概念树与大纲",
    sectionMindmapSaving: "禁用可节省约 1,000–2,500 tokens 与 5–15 秒",
    sectionChaptersOpt: "章节脉络 — 针对视频与长文带时间戳的关键段落",
    saveSectionsBtn: "保存模块偏好",

    obsidianCompanionSection: "Obsidian 插件配套",
    obsidianCompanionDesc: "NutEgg 是双端联动系统：Chrome 扩展负责从浏览器提取网页内容，Obsidian 插件在本地库中进行 AI 分析和知识树沉淀。",
    getObsidianPluginBtn: "📥 在 Obsidian 社区插件市场安装 NutEgg ↗",

    serverConnSection: "本地服务连接",
    serverPortLabel: "Obsidian 服务端口",
    serverPortHint: "必须与 Obsidian → NutEgg → 开发者模式 → 本地服务端口 一致。",
    dontHavePlugin: "尚未安装插件？",
    installNutEggObsidian: "前往安装 NutEgg Obsidian 插件 ↗",
    saveBtn: "保存",
    testConnBtn: "测试连接",

    standaloneSection: "独立模式（可选）",
    useChromeOnlyAi: "使用 Chrome 独立 AI（当 Obsidian 未连接时）",
    standaloneHint: "允许在未打开 Obsidian 时，直接在浏览器中运行第一阶段内容分析与摘要。",
    aiConfigSection: "AI 模型配置（独立模式）",
    aiProviderLabel: "1. AI 供应商",
    aiProviderHint: "选择当 Obsidian 关闭时用于浏览器内直接分析的供应商。",
    aiModelLabel: "2. 模型",
    localEndpointLabel: "本地服务接口地址",
    aiKeyLabel: "3. API Key",
    aiKeyHint: "API Key 安全保存在 Chrome 本地存储中，仅直接发送至对应的模型供应商。",
    customPromptsLabel: "4. 自定义提示词",
    resetDefaultPrompt: "恢复默认",
    promptHint: "自定义 Chrome 独立 AI 使用的模板。变量如 {{title}}、{{url}}、{{content}} 将在分析时动态替换。",
    saveAiBtn: "保存 AI 设置",
    testAiBtn: "测试 AI 连接",

    keyboardShortcutSection: "快捷键",
    keyboardShortcutDesc: "前往配置快速捕获快捷键：",
    helpSection: "帮助与反馈",
    helpDesc: "遇到异常或问题？欢迎在 GitHub 提交反馈。",
    reportBugBtn: "🐛 在 GitHub 反馈问题 ↗",

    // Dynamic Notices
    saved: "保存成功！",
    connected: "连接成功！",
    connectionFailed: "连接失败",
    analyzing: "分析中...",
    analyzingStage1: "第一阶段：提炼洞察并匹配 Egg 主题...",
    analyzingStage2: "第二阶段：比对增量并孵化 Egg 笔记...",
    copySuccess: "已复制！",
    eggCreatedNotice: "Egg 已创建！",
    pleaseEnterEggName: "请输入有效的 Egg 名称",
  },
};

let currentLocale = "en";

/**
 * Determine effective language.
 */
function resolveLanguage(preferred) {
  if (preferred === "zh" || preferred === "zh_CN") return "zh_CN";
  if (preferred === "en") return "en";
  const browserLang = (
    (typeof chrome !== "undefined" && chrome?.i18n?.getUILanguage?.()) ||
    (typeof navigator !== "undefined" && navigator.language) ||
    "en"
  ).toLowerCase();
  return browserLang.startsWith("zh") ? "zh_CN" : "en";
}

/**
 * Initialize i18n with user-configured UI language or auto-detected language.
 */
function initI18n(userPreference) {
  currentLocale = resolveLanguage(userPreference);
  return currentLocale;
}

/**
 * Get translated text for a key.
 */
function t(key, params) {
  const dict = translations[currentLocale] || translations.en;
  let str = dict[key] || translations.en[key] || key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return str;
}

/**
 * Apply i18n translations to elements within the root container.
 */
function applyI18n(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key) {
      el.textContent = t(key);
    }
  });

  root.querySelectorAll("[data-i18n-html]").forEach((el) => {
    const key = el.getAttribute("data-i18n-html");
    if (key) {
      el.innerHTML = t(key);
    }
  });

  root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (key) {
      el.placeholder = t(key);
    }
  });

  root.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title");
    if (key) {
      el.title = t(key);
    }
  });
}

  return {
    translations,
    resolveLanguage,
    initI18n,
    t,
    applyI18n,
    getLocale: () => currentLocale,
  };
});

