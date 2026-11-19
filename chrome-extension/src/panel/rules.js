/* Shared by the background, settings, and the bounded regex worker. */
(function (root) {
  // Retain stored length/availability conditions for future use, but keep them inactive.
  const contentConditionsEnabled = false;
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
  const GLOBAL_DOMAINS = ['youtube.com', 'reddit.com', 'substack.com', 'x.com', 'threads.com', 'instagram.com', 'tiktok.com', 'arxiv.org', 'medium.com'];
  const CHINA_DOMAINS = ['bilibili.com', 'mp.weixin.qq.com', 'qq.com', 'zhihu.com', 'weibo.com', 'douyin.com', 'xiaohongshu.com'];
  // Single source of truth for the built-in preset. Saved custom rules are snapshots.
  const NUTEGG_DEFAULT_RULES = Object.freeze([
    { hostname: 'youtube.com' },
    { hostname: 'reddit.com' },
    { hostname: 'substack.com' },
    { hostname: 'x.com' },
    { hostname: 'threads.com' },
    { hostname: 'instagram.com', videoLongerThanSeconds: 180 },
    { hostname: 'tiktok.com', videoLongerThanSeconds: 180 },
    { hostname: 'douyin.com', videoLongerThanSeconds: 180 },
    { hostname: 'arxiv.org' },
    { hostname: 'medium.com' },
    { hostname: 'bilibili.com' },
    { hostname: 'mp.weixin.qq.com' },
    { hostname: 'zhihu.com' },
    { hostname: 'weibo.com' },
  ].map(rule => Object.freeze(rule)));
  const DEFAULT_WHITELIST_HOSTS = Object.freeze(NUTEGG_DEFAULT_RULES.map(rule => rule.hostname));
  const DOMAIN_PATH_HINTS = {
    'youtube.com': ['/watch', '/live/*'],
    'reddit.com': ['/comments/*'],
    'substack.com': ['/p/*'],
    'x.com': ['/*/status/*', '/*/article/*'],
    'threads.com': ['/@*/post/*'],
    'instagram.com': ['/p/*', '/reel/*'],
    'tiktok.com': ['/@*/video/*', '/@*/photo/*'],
    'douyin.com': ['/video/*', '/note/*'],
    'arxiv.org': ['/abs/*', '/html/*', '/pdf/*'],
    'medium.com': ['/*/*'],
    'bilibili.com': ['/video/*', '/read/*', '/bangumi/play/*', '/list/*'],
    'mp.weixin.qq.com': ['/s/*'],
    'zhihu.com': ['/question/*', '/p/*'],
    'weibo.com': ['/detail/*', '/*/*'],
  };
  function domainDefaultPaths(host) {
    return DOMAIN_PATH_HINTS[String(host || '').toLocaleLowerCase()] || [];
  }
  function domainScopeHint(host) {
    const h = String(host || '').toLocaleLowerCase();
    if (!h) return '';
    const paths = DOMAIN_PATH_HINTS[h];
    return paths ? `*.${h} (${paths.join(', ')})` : `*.${h}/*`;
  }
  function subUrlRegex(rootHost, rawInput) {
    const raw = String(rawInput || '').trim();
    if (!raw) throw new Error('Invalid website');
    const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (raw.startsWith('/')) {
      const cleanPath = raw.replace(/\/\*+$/, '').replace(/\/+$/, '') || '/';
      return `^https?://(?:[^/]+\\.)?${esc(rootHost)}(?::[0-9]+)?${esc(cleanPath).replace(/\\\*/g, '[^/]+')}(?:[/?#]|$)`;
    }
    const url = new URL(raw.includes('://') ? raw : `https://${raw}`);
    const host = url.hostname.replace(/^www\./, '').toLocaleLowerCase();
    const cleanPath = url.pathname.replace(/\/\*+$/, '').replace(/\/+$/, '');
    if (!cleanPath || cleanPath === '/') return websiteRegex(host);
    const hostPattern = host === rootHost ? `(?:[^/]+\\.)?${esc(host)}` : `(?:www\\.)?${esc(host)}`;
    return `^https?://${hostPattern}(?::[0-9]+)?${esc(cleanPath).replace(/\\\*/g, '[^/]+')}(?:[/?#]|$)`;
  }
  function friendlyUrlLabel(rule) {
    const host = websiteHostname(rule);
    if (host) return host;
    const raw = String(rule?.website || '');
    // Generated path rules contain an optional port group before the path.
    // Parse that group explicitly so the label cannot silently collapse to the host.
    const port = '(?::[0-9]+)?', boundary = '(?:[/?#]|$)';
    const portAt = raw.indexOf(port);
    if (raw.startsWith('^https?://') && portAt !== -1 && raw.endsWith(boundary)) {
      const hostPattern = raw.slice('^https?://'.length, portAt)
        .replace('(?:[^/]+\\.)?', '').replace('(?:www\\.)?', '');
      const hostname = hostPattern.replace(/\\\./g, '.');
      const path = raw.slice(portAt + port.length, -boundary.length).replace(/\[\^\/\]\+/g, '*').replace(/\\(.)/g, '$1');
      if (/^[a-z0-9.-]+$/i.test(hostname) && path.startsWith('/'))
        return `${hostname}${path === '/' ? '' : path}/*`;
    }
    const m = raw.match(
      /^\^https\??:\/\/(?:\(\?:[^)]+\)\??)?(?:www\\\.)?([a-z0-9\\.-]+)(?:\(\?:\[0-9\]\+\)\?)?(\/[^($]+)?/i
    );
    if (m) {
      const h = m[1].replace(/\\\./g, '.');
      const p = (m[2] || '').replace(/\\\//g, '/').replace(/\\\./g, '.');
      return p ? `${h}${p}` : h;
    }
    return raw;
  }
  function domainRegion(host) {
    const h = String(host || '').toLocaleLowerCase();
    if (GLOBAL_DOMAINS.includes(h)) return 'global';
    if (CHINA_DOMAINS.includes(h)) return 'china';
    return '';
  }
  function compareDomains(a, b) {
    const ha = String(a || '').toLocaleLowerCase(),
      hb = String(b || '').toLocaleLowerCase();
    const rank = h => {
      const gi = GLOBAL_DOMAINS.indexOf(h);
      if (gi !== -1) return [0, gi];
      const ci = CHINA_DOMAINS.indexOf(h);
      if (ci !== -1) return [2, ci];
      return [1, 0];
    };
    const [ga, ia] = rank(ha),
      [gb, ib] = rank(hb);
    if (ga !== gb) return ga - gb;
    if (ia !== ib) return ia - ib;
    return ha.localeCompare(hb);
  }
  function rootDomain(rawInput) {
    if (!rawInput || typeof rawInput !== 'string') return '';
    let host = rawInput.trim();
    if (!host || host === '*' || host === '.*') return '';
    try {
      const url = new URL(host.includes('://') ? host : `https://${host}`);
      host = url.hostname;
    } catch {
      const m = host
        .replace(/\\\./g, '.')
        .match(/(?:https?:\/\/)?(?:[^/]+\.)?([a-z0-9-]+(?:\.[a-z0-9-]+)+)/i);
      host = m ? m[1] : '';
    }
    host = host.replace(/^www\./i, '').toLocaleLowerCase();
    if (!host || !host.includes('.')) return '';
    if (host === 'mp.weixin.qq.com') return host;
    const parts = host.split('.');
    if (parts.length <= 2) return host;
    const sld = parts.at(-2),
      tld = parts.at(-1);
    if (/^(?:co|com|org|net|gov|edu|ac)$/.test(sld) && tld.length === 2 && parts.length >= 3) {
      return parts.slice(-3).join('.');
    }
    return parts.slice(-2).join('.');
  }
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
    if (contentConditionsEnabled) for (const key of ['minMinutes', 'maxMinutes'])
      if (rule[key] != null && (!Number.isFinite(rule[key]) || rule[key] < 0)) throw new Error('Invalid reading time');
    if (contentConditionsEnabled && rule.minMinutes != null && rule.maxMinutes != null && rule.minMinutes > rule.maxMinutes)
      throw new Error('Invalid reading range');
    if (contentConditionsEnabled && rule.contentAvailable != null && typeof rule.contentAvailable !== 'boolean')
      throw new Error('Invalid content availability');
    if (rule.videoLongerThanSeconds != null && (!Number.isFinite(rule.videoLongerThanSeconds) || rule.videoLongerThanSeconds < 0))
      throw new Error('Invalid video duration');
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
  function buildDefaultRules() {
    return NUTEGG_DEFAULT_RULES.map(({ hostname: host, ...conditions }) => ({
      id: `default-${host}`,
      name: host,
      hostname: host,
      website: websiteRegex(host),
      enabled: true,
      action: 'allow',
      minMinutes: 3,
      contentAvailable: true,
      excludeListings: true,
      _starter: true,
      ...conditions,
    }));
  }
  function activeRules(settings) {
    const custom = Array.isArray(settings.rules) ? settings.rules : [];
    if (settings.openingPolicy === 'nutegg') return buildDefaultRules();
    if (settings.openingPolicy === 'open' || settings.openingPolicy === 'closed') return [];
    return custom;
  }
  function customize(settings) {
    if (settings.openingPolicy === 'custom') return settings;
    return {
      ...settings,
      openingPolicy: 'custom',
      defaultOpen: settings.openingPolicy === 'open',
      customRulesInitialized: true,
      rules: activeRules(settings).map(rule => structuredClone(rule)),
    };
  }
  function hasCustomRegex(settings) {
    return activeRules(settings).some(rule => {
      if (!rule || rule.enabled === false || rule.hostname || !rule.website || rule.website === '.*') return false;
      return !websiteHostname(rule);
    });
  }
  function isListingUrl(rawUrl) {
    try {
      const url = new URL(rawUrl);
      const rawHost = url.hostname.replace(/^www\./, '').toLocaleLowerCase();
      const host = ['youtube.com', 'reddit.com', 'x.com', 'twitter.com', 'bilibili.com', 'threads.com', 'threads.net', 'instagram.com', 'tiktok.com', 'douyin.com']
        .find(domain => rawHost === domain || rawHost.endsWith('.' + domain)) || rawHost;
      const path = url.pathname.replace(/\/+$/, '') || '/';
      const hasItemQuery = /[?&](?:v|id|p|post|article|story|doc|status|item|modal_id)=/i.test(url.search);
      if (path === '/' && !hasItemQuery) return true;
      if (
        /^\/(?:home|index(?:\.[a-z0-9]+)?|feed|feeds|discover|explore|trending|popular|all|latest|new|top|hot|following|for-you|subscriptions|notifications|messages|bookmarks|lists|communities|search|results|shorts|reels|channels|categories|tags|topics|archive|directory)(?:\/|$)/i.test(
          path
        )
      )
        return true;
      if ((host === 'youtube.com' || host.endsWith('.youtube.com')) && path !== '/watch' && !path.startsWith('/live/'))
        return true;
      if (
        (host === 'x.com' || host.endsWith('.x.com') || host === 'twitter.com' || host.endsWith('.twitter.com')) &&
        !/\/(?:status|article)\//.test(path)
      )
        return true;
      if ((host === 'reddit.com' || host.endsWith('.reddit.com')) && !/\/comments\//.test(path)) return true;
      if (
        (host === 'bilibili.com' || host.endsWith('.bilibili.com')) &&
        !/^\/(?:video|read|bangumi\/play|list)\//.test(path)
      )
        return true;
      if (['threads.com', 'threads.net'].includes(host) && !/^\/@[^/]+\/post\/[\w-]+(?:\/|$)/.test(path)) return true;
      if (host === 'instagram.com' && !/^\/(?:p|reel|reels|tv)\/[\w-]+(?:\/|$)/.test(path)) return true;
      if (host === 'tiktok.com' && !/^\/@[^/]+\/(?:video|photo)\/\d+(?:\/|$)/.test(path)) return true;
      if (host === 'douyin.com' && !/^\/(?:video|note)\/\d+(?:\/|$)/.test(path) && !/^\d+$/.test(url.searchParams.get('modal_id') || '')) return true;
      if (host === 'mp.weixin.qq.com' && !/^\/s(?:\/|$)/.test(path)) return true;
      if (host === 'news.ycombinator.com' && path !== '/item') return true;
      return false;
    } catch {
      return false;
    }
  }
  function decide(settings, signals, cached) {
    const isListing = Boolean(signals.listing || isListingUrl(signals.url));
    const matches = [];
    let mediaPending = false;
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
      if (contentConditionsEnabled && rule.minMinutes != null && (signals.minutes == null || signals.minutes < rule.minMinutes)) continue;
      if (contentConditionsEnabled && rule.maxMinutes != null && (signals.minutes == null || signals.minutes > rule.maxMinutes)) continue;
      if (contentConditionsEnabled && typeof rule.contentAvailable === 'boolean' && signals.contentAvailable !== rule.contentAvailable) continue;
      if (rule.excludeListings !== false && isListing) continue;
      if (rule.videoLongerThanSeconds != null) {
        if (!['text', 'photo', 'video'].includes(signals.mediaKind)) { mediaPending = true; continue; }
        if (signals.mediaKind === 'video' && !Number.isFinite(signals.videoDurationSeconds)) { mediaPending = true; continue; }
        if (signals.mediaKind === 'video' && signals.videoDurationSeconds <= rule.videoLongerThanSeconds) continue;
      }
      const conditional = !!(
        authors.length ||
        topics.length ||
        (contentConditionsEnabled && (rule.minMinutes != null || rule.maxMinutes != null || rule.contentAvailable != null)) ||
        rule.excludeListings || rule.videoLongerThanSeconds != null
      );
      const rank = raw._starter ? 1 : (rule.website === '.*' ? 0 : 2) + (conditional ? 1 : 0) + 0.5;
      matches.push({ rule, rank, topic: topicMatch, author });
    }
    matches.sort((a, b) => b.rank - a.rank || Number(b.rule.action === 'block') - Number(a.rule.action === 'block'));
    const match = matches[0];
    return {
      open: match
        ? match.rule.action === 'allow'
        : !isListing &&
          (settings.openingPolicy === 'open' ||
            (!['closed', 'nutegg'].includes(settings.openingPolicy) && settings.defaultOpen === true)),
      mediaPending: !match && mediaPending,
      videoDurationSeconds: signals.videoDurationSeconds ?? null,
      mediaKind: signals.mediaKind || 'unknown',
      ruleId: match?.rule.id || null,
      name: match?.rule.name || '',
      topic: match?.topic || null,
      author: match?.author || null,
      provenance: cached?.topics?.length ? 'cached' : 'local',
      minutes: signals.minutes,
      contentAvailable: signals.contentAvailable,
    };
  }
  function isSimpleSiteRule(rule) {
    return (
      rule &&
      !list(rule.topics).length &&
      !list(rule.authors).length &&
      rule.videoLongerThanSeconds == null &&
      rule.minMinutes == null &&
      rule.maxMinutes == null &&
      rule.contentAvailable == null &&
      rule.excludeListings !== true &&
      (!rule.aliases || !Object.keys(rule.aliases).length) &&
      (rule.website === '.*' || !!websiteHostname(rule))
    );
  }
  function isSimpleTopicRule(rule) {
    return (
      rule &&
      list(rule.topics).length > 0 &&
      !list(rule.authors).length &&
      rule.videoLongerThanSeconds == null &&
      rule.minMinutes == null &&
      rule.maxMinutes == null &&
      rule.contentAvailable == null &&
      rule.excludeListings !== true &&
      (!rule.aliases || !Object.keys(rule.aliases).length) &&
      (rule.website === '.*' || !!websiteHostname(rule))
    );
  }
  function mergeRule(existingRules, rawRule) {
    const rule = validate({
      id: rawRule.id || crypto.randomUUID(),
      enabled: rawRule.enabled !== false,
      ...rawRule,
    });
    const rules = Array.isArray(existingRules) ? existingRules.map(r => ({ ...r })) : [];
    const host = websiteHostname(rule);
    if (isSimpleTopicRule(rule)) {
      const incoming = list(rule.topics);
      const cleaned = [];
      for (const item of rules) {
        if (item.website === rule.website && isSimpleTopicRule(item) && item.action !== rule.action) {
          const remaining = list(item.topics).filter(t => !incoming.some(n => fold(n) === fold(t)));
          if (remaining.length) cleaned.push({ ...item, topics: remaining });
        } else {
          cleaned.push(item);
        }
      }
      const target = cleaned.find(
        item => item.website === rule.website && isSimpleTopicRule(item) && item.action === rule.action && item.enabled !== false
      );
      if (target) {
        const merged = [...list(target.topics)];
        for (const t of incoming) {
          if (!merged.some(m => fold(m) === fold(t))) merged.push(t);
        }
        target.topics = merged.slice(0, 20);
        return cleaned;
      }
      return [...cleaned, { ...rule, ...(host ? { hostname: host } : {}), topics: incoming }];
    }
    if (isSimpleSiteRule(rule)) {
      const filtered = rules.filter(item => !(item.website === rule.website && isSimpleSiteRule(item)));
      return [...filtered, { ...rule, ...(host ? { hostname: host } : {}) }];
    }
    return [...rules.filter(item => item.id !== rule.id), rule];
  }
  const api = {
    contentConditionsEnabled,
    defaults,
    defaultRules: Object.freeze(buildDefaultRules().map(rule => Object.freeze(rule))),
    DEFAULT_WHITELIST_HOSTS,
    domainRegion,
    domainDefaultPaths,
    domainScopeHint,
    subUrlRegex,
    friendlyUrlLabel,
    compareDomains,
    rootDomain,
    normalize,
    readingMinutes,
    contains,
    websiteRegex,
    websiteHostname,
    validate,
    activeRules,
    customize,
    hasCustomRegex,
    isListingUrl,
    decide,
    isSimpleSiteRule,
    isSimpleTopicRule,
    mergeRule,
  };
  root.NutEggRules = api;
  if (typeof module !== 'undefined') module.exports = api;
})(globalThis);
