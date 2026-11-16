/* Shared by the background, settings, and the bounded regex worker. */
(function (root) {
  const starter = {
    id: 'long-content',
    name: 'panelStarter',
    enabled: true,
    action: 'allow',
    website: '.*',
    minMinutes: 3,
    contentAvailable: true,
    excludeListings: true,
  };
  const defaults = {
    version: 2,
    openingPolicy: 'nutegg',
    mode: 'injected',
    side: 'right',
    layoutMode: 'auto',
    width: 420,
    defaultOpen: false,
    autoAnalyze: false,
    migrationHint: false,
    dismissedSuggestions: [],
    rules: [],
  };
  const list = value =>
    Array.isArray(value)
      ? value
          .filter(v => typeof v === 'string' && v.trim())
          .map(v => v.trim())
          .slice(0, 20)
      : [];
  function normalize(value) {
    const saved = value && typeof value === 'object' ? value : {};
    const migratedRules = (Array.isArray(saved.rules) ? saved.rules.slice(0, 200) : []).map(rule => {
      const { authors, ...rest } = rule;
      return {
        ...rest,
        ...(authors?.length ? { topics: [...new Set([...list(rule.topics), ...list(authors)])] } : {}),
      };
    });
    const originalDefault =
      saved.rules?.length === 1 &&
      !saved.defaultOpen &&
      Object.entries(starter).every(([key, value]) => saved.rules[0]?.[key] === value) &&
      !list(saved.rules[0].authors).length &&
      !list(saved.rules[0].topics).length &&
      saved.rules[0].maxMinutes == null;
    return {
      ...defaults,
      ...saved,
      version: 2,
      openingPolicy: ['open', 'closed', 'nutegg', 'custom'].includes(saved.openingPolicy)
        ? saved.openingPolicy
        : !value || originalDefault
          ? 'nutegg'
          : 'custom',
      mode: saved.mode === 'native' ? 'native' : 'injected',
      side: saved.side === 'left' ? 'left' : 'right',
      layoutMode: ['auto', 'floating', 'push'].includes(saved.layoutMode) ? saved.layoutMode : 'auto',
      width: Math.max(280, Math.min(900, Number(saved.width) || 420)),
      dismissedSuggestions: Array.isArray(saved.dismissedSuggestions)
        ? [...new Set(saved.dismissedSuggestions.filter(v => typeof v === 'string' && v.trim()).map(v => v.trim().toLowerCase()))].slice(-200)
        : [],
      rules: originalDefault && !saved.openingPolicy ? [] : migratedRules,
    };
  }
  function readingMinutes(text) {
    if (!text?.trim()) return null;
    const cjk = (text.match(/[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/g) || []).length;
    const words = (text.replace(/[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/g, ' ').match(/[\p{L}\p{N}]+/gu) || [])
      .length;
    return Math.max(1, Math.ceil(words / 200 + cjk / 400));
  }
  const fold = text =>
    String(text || '')
      .normalize('NFKC')
      .toLocaleLowerCase()
      .trim();
  function contains(text, label) {
    const needle = fold(label);
    if (!needle) return false;
    if (/[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/.test(needle)) return fold(text).includes(needle);
    const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}($|[^\\p{L}\\p{N}])`, 'iu').test(fold(text));
  }
  function websiteRegex(host) {
    const hostname = new URL(host.includes('://') ? host : `https://${host}`).hostname.replace(/^www\./, '');
    if (!hostname) throw new Error('Invalid website');
    return `^https?://(?:[^/]+\\.)?${hostname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?::[0-9]+)?(?:/|$)`;
  }
  function validate(rule) {
    if (!rule || !['allow', 'block'].includes(rule.action)) throw new Error('Invalid action');
    if (rule.hostname) rule = { ...rule, website: websiteRegex(rule.hostname) };
    if (typeof rule.website !== 'string' || rule.website.length > 500) throw new Error('Invalid website regex');
    new RegExp(rule.website, 'i');
    for (const key of ['minMinutes', 'maxMinutes'])
      if (rule[key] != null && (!Number.isFinite(rule[key]) || rule[key] < 0)) throw new Error('Invalid reading time');
    if (rule.minMinutes != null && rule.maxMinutes != null && rule.minMinutes > rule.maxMinutes)
      throw new Error('Invalid reading range');
    if (rule.contentAvailable != null && typeof rule.contentAvailable !== 'boolean')
      throw new Error('Invalid content availability');
    return rule;
  }
  function websiteHostname(rule) {
    if (rule?.hostname) return rule.hostname;
    const prefix = '^https?://(?:[^/]+\\.)?',
      suffix = '(?::[0-9]+)?(?:/|$)';
    if (!rule?.website?.startsWith(prefix) || !rule.website.endsWith(suffix)) return '';
    const host = rule.website.slice(prefix.length, -suffix.length).replace(/\\\./g, '.');
    try {
      return websiteRegex(host) === rule.website ? host : '';
    } catch {
      return '';
    }
  }
  function activeRules(settings) {
    const custom = Array.isArray(settings.rules) ? settings.rules : [];
    if (settings.openingPolicy === 'nutegg') return [...custom, { ...starter, _starter: true }];
    return custom;
  }
  function hasCustomRegex(settings) {
    return activeRules(settings).some(rule => {
      if (!rule || rule.enabled === false || rule.hostname || !rule.website || rule.website === '.*') return false;
      return !websiteHostname(rule);
    });
  }
  function decide(settings, signals, cached) {
    const matches = [];
    for (const raw of activeRules(settings)) {
      if (raw.enabled === false) continue;
      let rule;
      try {
        rule = validate(raw);
      } catch {
        continue;
      }
      if (!new RegExp(rule.website, 'i').test(signals.url)) continue;
      const authors = list(rule.authors),
        topics = list(rule.topics);
      const author = cached?.author || signals.author;
      if (authors.length && !authors.some(a => fold(a) === fold(author))) continue;
      const knownTopics = cached?.topics;
      const topicMatch = topics.find(topic => {
        const aliasEntry = Object.entries(rule.aliases || {}).find(([key]) => fold(key) === fold(topic));
        const aliases = [topic, ...list(aliasEntry?.[1])];
        return aliases.some(
          alias =>
            fold(alias) === fold(author) ||
            knownTopics?.some(t => fold(t) === fold(alias) || contains(t, alias)) ||
            contains(signals.searchText, alias)
        );
      });
      if (topics.length && !topicMatch) continue;
      if (rule.minMinutes != null && (signals.minutes == null || signals.minutes < rule.minMinutes)) continue;
      if (rule.maxMinutes != null && (signals.minutes == null || signals.minutes > rule.maxMinutes)) continue;
      if (typeof rule.contentAvailable === 'boolean' && signals.contentAvailable !== rule.contentAvailable) continue;
      if (rule.excludeListings && signals.listing) continue;
      const conditional = !!(
        authors.length ||
        topics.length ||
        rule.minMinutes != null ||
        rule.maxMinutes != null ||
        rule.contentAvailable != null ||
        rule.excludeListings
      );
      const rank = (rule.website === '.*' ? 0 : 2) + (conditional ? 1 : 0) + (raw._starter ? 0 : 0.5);
      matches.push({ rule, rank, topic: topicMatch, author });
    }
    matches.sort((a, b) => b.rank - a.rank || Number(b.rule.action === 'block') - Number(a.rule.action === 'block'));
    const match = matches[0];
    return {
      open: match
        ? match.rule.action === 'allow'
        : settings.openingPolicy === 'open' ||
          (!['closed', 'nutegg'].includes(settings.openingPolicy) && settings.defaultOpen === true),
      ruleId: match?.rule.id || null,
      name: match?.rule.name || '',
      topic: match?.topic || null,
      author: match?.author || null,
      provenance: cached?.topics?.length ? 'cached' : 'local',
      minutes: signals.minutes,
      contentAvailable: signals.contentAvailable,
    };
  }
  const api = {
    defaults,
    normalize,
    readingMinutes,
    contains,
    websiteRegex,
    websiteHostname,
    validate,
    activeRules,
    hasCustomRegex,
    decide,
  };
  root.NutEggRules = api;
  if (typeof module !== 'undefined') module.exports = api;
})(globalThis);
