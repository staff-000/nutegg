const test = require('node:test');
const assert = require('node:assert/strict');
const rules = require('../src/panel/rules');
const page = {
  url: 'https://www.youtube.com/watch?v=abc',
  author: 'Dan Koe',
  searchText: 'How to build a creative business',
  minutes: 5,
  contentAvailable: true,
  listing: false,
};
const rule = (overrides = {}) => ({
  id: 'r',
  name: 'YouTube',
  website: rules.websiteRegex('youtube.com'),
  action: 'allow',
  ...overrides,
});
const decide = (entries, signals = page, cached) =>
  rules.decide({ defaultOpen: false, rules: entries }, signals, cached);
test('YouTube + Dan Koe matches structured author, never body mentions', () => {
  assert.equal(decide([rule({ authors: ['Dan Koe'] })]).open, true);
  assert.equal(
    decide([rule({ authors: ['Dan Koe'] })], { ...page, author: 'Someone else', searchText: 'Dan Koe' }).open,
    false
  );
  assert.equal(
    decide([rule({ authors: ['Dan Koe'] })], { ...page, url: 'https://youtube.com.evil.test/watch' }).open,
    false
  );
});
test('website level precedes global and conditional precedes website-only; block wins ties', () => {
  const global = rule({ website: '.*', action: 'block', minMinutes: 3 });
  assert.equal(decide([global, rule()]).open, true);
  assert.equal(decide([rule({ action: 'block' }), rule({ authors: ['Dan Koe'] })]).open, true);
  assert.equal(decide([rule(), rule({ action: 'block' })]).open, false);
});
test('topic and author conditions combine; disabled length and availability conditions are ignored', () => {
  const combined = rule({
    authors: ['Unknown', 'Dan Koe'],
    topics: ['Business'],
    minMinutes: 3,
    maxMinutes: 9,
    contentAvailable: true,
  });
  assert.equal(decide([combined]).open, true);
  assert.equal(decide([combined], { ...page, minutes: null }).open, true);
  assert.equal(decide([combined], { ...page, contentAvailable: false }).open, true);
  assert.equal(decide([combined], { ...page, searchText: 'Cooking tips' }, { topics: ['Cooking'] }).open, false);
  assert.equal(decide([combined], page, { topics: ['Business'] }).provenance, 'cached');
  // Sub-topic / partial topic match against cached AI topics + local searchText fallback
  assert.equal(decide([rule({ topics: ['AI'] })], { ...page, searchText: 'Unrelated' }, { topics: ['AI Coding Agents'] }).open, true);
});
test('local topic aliases require bounded words; estimates are multilingual', () => {
  assert.equal(
    decide([rule({ topics: ['Entrepreneurship'], aliases: { Entrepreneurship: ['creative business'] } })]).open,
    true
  );
  assert.equal(rules.contains('businessman', 'business'), false);
  assert.equal(rules.readingMinutes('word '.repeat(600)), 3);
  assert.equal(rules.readingMinutes('中'.repeat(1200)), 3);
  assert.equal(rules.readingMinutes('word '.repeat(200) + '中'.repeat(400)), 2);
  assert.equal(rules.readingMinutes(''), null);
});
test('starter excludes feeds but ignores disabled content conditions; migration never reseeds deleted rules', () => {
  const settings = rules.normalize();
  assert.equal(settings.autoAnalyze, false);
  assert.equal(rules.decide(settings, page).open, true);
  assert.equal(rules.decide(settings, { ...page, listing: true }).open, false);
  assert.equal(rules.decide(settings, { ...page, minutes: 2 }).open, true);
  assert.equal(rules.decide(settings, { ...page, minutes: null, contentAvailable: false }).open, true);
  assert.deepEqual(rules.normalize({ version: 1, rules: [] }).rules, []);
});
test('invalid regex is rejected and defaults remain available', () => {
  assert.throws(() => rules.validate(rule({ website: '[' })));
  assert.equal(decide([rule({ website: '[' })]).open, false);
  assert.equal(rules.decide({ rules: [], defaultOpen: true }, page).open, true);
});

test('opening presets set fallback behavior while custom whitelist/blacklist rules always apply', () => {
  const withoutCustom = { ...rules.defaults, rules: [] };
  assert.equal(rules.decide({ ...withoutCustom, openingPolicy: 'open' }, page).open, true);
  assert.equal(rules.decide({ ...withoutCustom, openingPolicy: 'closed' }, page).open, false);
  assert.equal(rules.decide({ ...withoutCustom, openingPolicy: 'nutegg' }, page).open, true);
  assert.equal(rules.decide({ ...withoutCustom, openingPolicy: 'nutegg' }, { ...page, minutes: 1 }).open, true);

  const withBlock = { ...rules.defaults, rules: [rule({ action: 'block' })] };
  assert.equal(rules.decide({ ...withBlock, openingPolicy: 'open' }, page).open, false);
  assert.equal(rules.decide({ ...withBlock, openingPolicy: 'nutegg' }, page).open, false);

  const withAllow = { ...rules.defaults, rules: [rule({ action: 'allow' })] };
  assert.equal(rules.decide({ ...withAllow, openingPolicy: 'closed' }, page).open, true);
});
test('Topics includes channel names and aliases even when AI subjects are cached', () => {
  assert.equal(decide([rule({ topics: ['Dan Koe'] })], page, { topics: ['Cooking'] }).open, true);
  assert.equal(decide([rule({ topics: ['DK'], aliases: { DK: ['Dan Koe'] } })], page, { topics: ['Cooking'] }).open, true);
  assert.equal(decide([rule({ topics: ['AI'], aliases: { AI: ['artificial intelligence'] } })], { ...page, author: '', searchText: 'Artificial intelligence systems' }).open, true);
});
test('legacy authors migrate to Topics and friendly hostnames round-trip', () => {
  const migrated = rules.normalize({ version: 1, defaultOpen: false, rules: [rule({ authors: ['Dan Koe'], topics: ['AI'] })] });
  assert.equal(migrated.version, 2); assert.equal(migrated.openingPolicy, 'custom');
  assert.deepEqual(migrated.rules[0].topics, ['AI', 'Dan Koe']); assert.equal(migrated.rules[0].authors, undefined);
  assert.equal(rules.websiteHostname(rule()), 'youtube.com');
  assert.equal(rules.validate({ action: 'allow', hostname: 'youtube.com' }).website, rules.websiteRegex('youtube.com'));
});
test('mergeRule groups topics by site and action, and YouTube Closed + Dan Koe Open + OPC Closed resolves cleanly', () => {
  let list = [];
  list = rules.mergeRule(list, { hostname: 'youtube.com', website: rules.websiteRegex('youtube.com'), action: 'block' });
  list = rules.mergeRule(list, { hostname: 'youtube.com', website: rules.websiteRegex('youtube.com'), action: 'allow', topics: ['Dan Koe'] });
  list = rules.mergeRule(list, { hostname: 'youtube.com', website: rules.websiteRegex('youtube.com'), action: 'allow', topics: ['Lex Fridman'] });
  list = rules.mergeRule(list, { hostname: 'youtube.com', website: rules.websiteRegex('youtube.com'), action: 'block', topics: ['OPC'] });
  assert.equal(list.length, 3);
  assert.deepEqual(list.find(r => r.action === 'allow' && r.topics?.length)?.topics, ['Dan Koe', 'Lex Fridman']);
  // Other YouTube video -> Closed
  assert.equal(decide(list, { ...page, author: 'Other', searchText: 'Random' }).open, false);
  // Dan Koe video -> Open
  assert.equal(decide(list, page).open, true);
  // Dan Koe video about OPC -> Closed (block wins tie)
  assert.equal(decide(list, { ...page, searchText: 'Building an OPC business' }).open, false);
  // Moving Dan Koe to block removes it from allow
  list = rules.mergeRule(list, { hostname: 'youtube.com', website: rules.websiteRegex('youtube.com'), action: 'block', topics: ['Dan Koe'] });
  assert.deepEqual(list.find(r => r.action === 'allow' && r.topics?.length)?.topics, ['Lex Fridman']);
});
test('isListingUrl and decide skip x.com/home, root homepages, and feeds even under custom allow rules', () => {
  assert.equal(rules.isListingUrl('https://x.com/home'), true);
  assert.equal(rules.isListingUrl('https://x.com/dankoe/status/12345'), false);
  assert.equal(rules.isListingUrl('https://example.com/'), true);
  assert.equal(rules.isListingUrl('https://example.com/article'), false);
  assert.equal(rules.isListingUrl('https://news.ycombinator.com/'), true);
  assert.equal(rules.isListingUrl('https://news.ycombinator.com/item?id=123'), false);
  const xAllow = [{ id: 'x', name: 'X', hostname: 'x.com', website: rules.websiteRegex('x.com'), action: 'allow' }];
  assert.equal(decide(xAllow, { ...page, url: 'https://x.com/home' }).open, false);
  assert.equal(decide(xAllow, { ...page, url: 'https://x.com/dankoe/status/12345' }).open, true);
  // NutEgg default uses a curated whitelist (youtube.com is whitelisted; random-site.com is not)
  const defSettings = rules.normalize();
  assert.equal(rules.decide(defSettings, page).open, true);
  assert.equal(rules.decide(defSettings, { ...page, url: 'https://random-site.com/article' }).open, false);
  // rootDomain groups subdomains and sub-URLs into their root domain
  assert.equal(rules.rootDomain('https://zhuanlan.zhihu.com/p/12345'), 'zhihu.com');
  assert.equal(rules.rootDomain('https://mp.weixin.qq.com/s/abc'), 'mp.weixin.qq.com');
  assert.equal(rules.rootDomain('^https://www\\.youtube\\.com/watch'), 'youtube.com');
  // Bilibili watchlater / list and WeChat articles are allowed (not skipped as listings)
  assert.equal(rules.isListingUrl('https://www.bilibili.com/list/watchlater?bvid=BV123'), false);
  assert.equal(rules.isListingUrl('https://mp.weixin.qq.com/s/abc123'), false);
  assert.equal(rules.isListingUrl('https://mp.weixin.qq.com/'), true);
  // Domain ranking puts Global on top, custom in middle, China on bottom
  const ranked = ['weibo.com', 'myblog.com', 'arxiv.org', 'bilibili.com', 'youtube.com', 'mp.weixin.qq.com', 'reddit.com', 'zhihu.com', 'x.com', 'substack.com'].sort(
    rules.compareDomains
  );
  assert.deepEqual(ranked, [
    'youtube.com',
    'reddit.com',
    'substack.com',
    'x.com',
    'arxiv.org',
    'myblog.com',
    'bilibili.com',
    'mp.weixin.qq.com',
    'zhihu.com',
    'weibo.com',
  ]);
  assert.equal(rules.domainRegion('youtube.com'), 'global');
  assert.equal(rules.domainRegion('bilibili.com'), 'china');
  assert.equal(rules.domainRegion('myblog.com'), '');
});


test('disabled content conditions retain their config without affecting matches or priority', () => {
  const savedRule = rule({ minMinutes: 50, maxMinutes: 60, contentAvailable: true });
  const saved = rules.normalize({ openingPolicy: 'custom', rules: [savedRule] });
  assert.equal(rules.contentConditionsEnabled, false);
  assert.deepEqual(saved.rules[0], savedRule);
  for (const minutes of [null, 0, 100]) {
    assert.equal(rules.decide(saved, { ...page, minutes, contentAvailable: false }).open, true);
  }
  // Inactive conditions must not outrank a website-only block.
  assert.equal(decide([savedRule, rule({ id: 'block', action: 'block' })]).open, false);
  assert.deepEqual(rules.mergeRule([savedRule], { ...savedRule, name: 'Renamed' })[0], { ...savedRule, name: 'Renamed', enabled: true });
});
