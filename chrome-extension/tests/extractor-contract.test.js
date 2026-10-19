const test = require('node:test');
const assert = require('node:assert/strict');
const { createExtractorPage, captureScripts, code, deferred, flush } = require('./helpers/extractor-harness');
const scripts = ['dist/page-identity.js', 'src/content/utils.js', 'src/content/dom-reader.js',
  'src/content/extractors/generic.js', 'src/content/content-script.js'];
function example(t, options = {}) {
  const page = createExtractorPage(t, { url: 'https://example.org/articles/intro',
    html: '<title>Example</title><main><h1>Introduction</h1><p>A short useful article.</p></main>',
    scripts, registry: [], ...options });
  page.load('tests/fixtures/example-article.js');
  page.win.EXTRACTORS.push({ name: 'example', detect: page.win.detectExampleArticle,
    extract: page.win.extractExampleArticle, bodyReadiness: true, onError: 'stop' });
  return page;
}

test('contributor example detects only supported hosts and article paths', t => {
  for (const [url, expected] of [
    ['https://example.org/articles/intro', true], ['https://docs.example.org/articles/intro', true],
    ['https://example.org/', false], ['https://example.org.evil.test/articles/intro', false],
    ['https://other.test/articles/intro?q=example.org', false],
  ]) {
    const page = example(t, { url });
    assert.equal(page.win.detectExampleArticle(), expected, url);
  }
});

test('contributor example captures stable short body without network requests', async t => {
  const page = example(t);
  const result = await page.capture();
  assert.equal(result.success, true);
  assert.equal(result.content.extractionStatus, 'ready');
  assert.match(result.content.content, /A short useful article/);
  assert.equal(page.requests.length, 0);
});

for (const body of ['', '<p>Loading…</p>', '<p>Partial body</p><div role="progressbar"></div>']) {
  test(`contributor example rejects a loading shell: ${body || 'empty'}`, async t => {
    const page = example(t, { html: `<title>Only metadata</title><main>${body}</main>` });
    const result = await page.capture();
    assert.equal(result.content.extractionStatus, 'not_ready');
    assert.ok(result.content.captureCoverage.reasons.includes('loading_timeout'));
  });
}

test('contributor example waits for delayed body hydration', async t => {
  const page = example(t, { html: '<main aria-busy="true">Loading…</main>' });
  const pending = page.capture();
  await page.hydrate('<p>The hydrated body.</p>', 40);
  page.win.document.querySelector('main').removeAttribute('aria-busy');
  const result = await pending;
  assert.equal(result.content.extractionStatus, 'ready');
  assert.match(result.content.content, /hydrated body/);
});

for (const action of ['cancel', 'navigate']) {
  test(`contributor example stops delayed DOM work after ${action}`, async t => {
    const page = example(t), gate = deferred();
    let writes = 0;
    page.win.EXTRACTORS[0].bodyReadiness = false;
    page.win.EXTRACTORS[0].extract = async context => {
      await context.wait(gate.promise);
      context.check();
      writes++;
      return page.win.extractExampleArticle(context);
    };
    const pending = page.capture({ requestId: 'delayed' });
    await flush();
    if (action === 'cancel') await page.cancel('delayed');
    else { page.navigate('/articles/next'); page.navigate('/articles/intro'); }
    gate.resolve();
    const result = await pending;
    assert.equal(result.success, false);
    assert.equal(result.errorCode, action === 'cancel' ? 'cancelled' : 'stale');
    assert.equal(writes, 0);
  });
}

test('contributor example retains truncation and access restriction coverage', async t => {
  for (const [body, reason] of [
    [`<p>${'Content '.repeat(9000)}</p>`, 'truncated'],
    ['<div class="paywall">Subscribe to continue reading.</div>', 'access_restricted'],
  ]) {
    const page = example(t, { html: `<main>${body}</main>` });
    const result = await page.capture();
    assert.ok(result.content.captureCoverage.reasons.includes(reason));
    if (reason === 'truncated') assert.equal(result.content.captureCoverage.capturedCharacters, 60000);
    else assert.equal(result.content.extractionStatus, 'unavailable');
  }
});

for (const policy of ['continue', 'stop']) {
  test(`ordinary extractor errors respect onError=${policy}`, async t => {
    const page = example(t);
    page.win.EXTRACTORS.unshift({ name: 'broken', detect: () => true, onError: policy,
      extract: () => { throw new Error('Fixture unavailable'); } });
    const result = await page.capture();
    assert.equal(result.success, policy === 'continue');
    if (policy === 'continue') assert.match(result.content.content, /short useful article/);
  });
}

for (const errorCode of ['cancelled', 'stale', 'timeout', 'embedded_changed']) {
  test(`${errorCode} never falls through to a different extractor`, async t => {
    const page = example(t);
    let calls = 0;
    page.win.EXTRACTORS[0].extract = () => { calls++; return { content: 'Wrong fallback' }; };
    page.win.EXTRACTORS.unshift({ name: 'interrupted', detect: () => true, onError: 'continue',
      extract: () => { throw Object.assign(new Error(errorCode), { code: errorCode }); } });
    const result = await page.capture();
    assert.equal(result.success, false);
    assert.equal(result.errorCode, errorCode);
    assert.equal(calls, 0);
  });
}

test('ultimate generic fallback retains context, body readiness, diagnostics and coverage', async t => {
  const page = example(t, { html: '<main><div class="paywall">Subscribe to read</div></main>' });
  page.win.EXTRACTORS.length = 0;
  let owner;
  const original = page.win.extractGeneric;
  page.win.extractGeneric = context => { owner = context; return original(context); };
  const result = await page.capture({ requestId: 'ultimate' });
  assert.equal(owner.requestId, 'ultimate');
  assert.equal(result.content.extractionStatus, 'unavailable');
  assert.ok(result.content.captureCoverage.reasons.includes('access_restricted'));
  assert.equal(page.win.__nuteggCaptureState.diagnostics.at(-1).extractor, 'generic');
});

test('production loading and reinjection refresh every built-in without duplicating listeners', t => {
  const page = createExtractorPage(t);
  const previous = new Map(page.win.EXTRACTORS.map(entry => [entry.name, entry.extract]));
  for (const entry of page.win.EXTRACTORS) delete entry._nuteggBuiltIn; // Pre-refactor registry.
  const { PageExtractor } = require('../src/popup/services/page-extractor');
  for (const file of new PageExtractor().contentScriptFiles) page.load(file);
  assert.equal(page.listeners.length, 1);
  assert.equal(page.win.EXTRACTORS.at(-1).name, 'generic');
  for (const entry of page.win.EXTRACTORS) {
    assert.equal(typeof entry.detect, 'function', entry.name);
    assert.equal(typeof entry.extract, 'function', entry.name);
    assert.notEqual(entry.extract, previous.get(entry.name), entry.name);
    assert.equal(entry.extract, page.win[entry.extract.name]);
  }
});

test('reinjection preserves an active invocation and its original policy', async t => {
  const page = createExtractorPage(t, { html: '<main><p>Body</p></main>' }), gate = deferred();
  const entry = page.win.EXTRACTORS.at(-1);
  entry.bodyReadiness = false;
  entry.extract = async context => { await context.wait(gate.promise); return { content: 'Admitted capture', extractionStatus: 'ready' }; };
  const pending = page.capture({ requestId: 'survive' });
  await flush();
  const active = page.win.__nuteggCaptureState.active;
  for (const file of captureScripts()) page.load(file);
  assert.equal(page.win.__nuteggCaptureState.active, active);
  gate.resolve();
  assert.equal((await pending).content.content, 'Admitted capture');
  assert.equal(page.listeners.length, 1);
});

test('ultimate generic fallback cannot accept a late result after cancellation', async t => {
  const page = example(t), gate = deferred();
  page.win.EXTRACTORS.length = 0;
  let calls = 0;
  const original = page.win.extractGeneric;
  page.win.extractGeneric = context => {
    calls++;
    if (calls === 1) return gate.promise.then(() => { context.check(); return original(context); });
    return original(context);
  };
  const pending = page.capture({ requestId: 'fallback-cancel' });
  await flush();
  await page.cancel('fallback-cancel');
  gate.resolve();
  const result = await pending;
  assert.equal(result.success, false);
  assert.equal(result.errorCode, 'cancelled');
  assert.equal(calls, 1, 'No settling or repeated DOM extraction after cancellation');
});

test('documented example exactly matches the executable fixture', () => {
  const guide = code('../docs/content-extractor-contributing.md');
  const example = code('tests/fixtures/example-article.js').trim();
  assert.ok(guide.includes('```js\n' + example + '\n```'));
});
