const test = require('node:test');
const assert = require('node:assert/strict');
const { createExtractorPage } = require('./helpers/extractor-harness');
async function classify(t, html, url = 'https://example.com/article') {
  let done;
  const result = new Promise(resolve => {
    done = resolve;
  });
  const page = createExtractorPage(t, {
    html,
    url,
    onMessage: message => {
      if (message.action === 'panel-signals') done(message.signals);
      return { settings: { mode: 'injected' } };
    },
  });
  const timeout = setTimeout(() => done(null), 2500);
  t.after(() => clearTimeout(timeout));
  return { page, signals: await result };
}
test('passive article classification uses main text, author and CJK time without NutEgg UI', async t => {
  const { signals, page } = await classify(
    t,
    '<meta name="author" content="Dan Koe"><article><h1>Ideas</h1><p>' +
      '中'.repeat(1190) +
      '</p><div data-nutegg-ui><p>' +
      'noise '.repeat(1000) +
      '</p></div><div class="comments">Comment text</div></article>'
  );
  assert.equal(signals.minutes, 3);
  assert.equal(signals.author, 'Dan Koe');
  assert.equal(signals.contentAvailable, true);
  assert.equal(signals.searchText.includes('noise'), false);
  assert.equal(signals.searchText.includes('Comment text'), false);
  assert.equal(page.requests.length, 0);
});
test('feeds stay closed even with long visible text', async t => {
  const { signals } = await classify(
    t,
    '<main role="feed"><article>' + 'word '.repeat(800) + '</article></main>',
    'https://example.com/feed'
  );
  assert.equal(signals.listing, true);
  assert.equal(signals.contentAvailable, false);
  assert.equal(signals.minutes, null);
});
test('video title and description are insufficient, but local transcript is usable', async t => {
  const url = 'https://www.youtube.com/watch?v=abc123def45';
  const missing = await classify(
    t,
    '<meta name="author" content="Dan Koe"><video></video><h1>Business</h1><main>' +
      'description '.repeat(800) +
      '</main>',
    url
  );
  assert.equal(missing.signals.contentAvailable, false);
  assert.equal(missing.signals.minutes, null);
  assert.equal(missing.page.requests.length, 0);
  const available = await classify(t, '<video></video><div data-transcript>' + 'word '.repeat(600) + '</div>', url);
  assert.equal(available.signals.contentAvailable, true);
  assert.equal(available.signals.minutes, 3);
  assert.equal(available.page.requests.length, 0);
});
test('main-only documentation is readable and SPA routes get fresh signals', async t => {
  const { page, signals } = await classify(t, '<main><h1>Documentation</h1><p>' + 'word '.repeat(650) + '</p></main>');
  assert.equal(signals.listing, false);
  assert.equal(signals.contentAvailable, true);
  page.win.history.pushState(null, '', '/second');
  await new Promise(resolve => setTimeout(resolve, 1600));
  const latest = page.messages.filter(m => m.action === 'panel-signals').at(-1);
  assert.equal(latest.url, 'https://example.com/second');
});

test('an incidental embedded video does not hide available article text', async t => {
  const { signals } = await classify(t, '<article><h1>Essay</h1><video></video><p>' + 'word '.repeat(650) + '</p></article>');
  assert.equal(signals.contentAvailable, true);
  assert.equal(signals.minutes, 4);
});
