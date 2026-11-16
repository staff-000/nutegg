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
test('conditions combine with AND, values with OR, and unknown metrics fail', () => {
  const combined = rule({
    authors: ['Unknown', 'Dan Koe'],
    topics: ['Business'],
    minMinutes: 3,
    maxMinutes: 9,
    contentAvailable: true,
  });
  assert.equal(decide([combined]).open, true);
  assert.equal(decide([combined], { ...page, minutes: null }).open, false);
  assert.equal(decide([combined], { ...page, contentAvailable: false }).open, false);
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
test('starter excludes feeds, unknown content, and short content; migration never reseeds deleted rules', () => {
  const settings = rules.normalize();
  assert.equal(settings.autoAnalyze, false);
  assert.equal(rules.decide(settings, page).open, true);
  assert.equal(rules.decide(settings, { ...page, listing: true }).open, false);
  assert.equal(rules.decide(settings, { ...page, minutes: 2 }).open, false);
  assert.equal(rules.decide(settings, { ...page, minutes: null, contentAvailable: false }).open, false);
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
  assert.equal(rules.decide({ ...withoutCustom, openingPolicy: 'nutegg' }, { ...page, minutes: 1 }).open, false);

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
