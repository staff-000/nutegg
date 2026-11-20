const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const Rules = require('../src/panel/rules');
const { webcrypto } = require('node:crypto');
const flush = () => new Promise(resolve => setImmediate(resolve));
async function fixture(saved) {
  const local = saved ? { panelSettings: structuredClone(saved) } : {},
    session = {},
    messages = [],
    events = {};
  const event = name => ({
    addListener: fn => {
      (events[name] ||= []).push(fn);
    },
  });
  const area = values => ({
    get: async keys =>
      Object.fromEntries(
        (keys == null ? Object.keys(values) : Array.isArray(keys) ? keys : [keys])
          .filter(key => key in values)
          .map(key => [key, structuredClone(values[key])])
      ),
    set: async patch => {
      Object.assign(values, structuredClone(patch));
    },
    remove: async keys => {
      for (const key of Array.isArray(keys) ? keys : [keys]) delete values[key];
    },
  });
  const tabs = new Map([
    [1, { id: 1, url: 'https://www.youtube.com/watch?v=one', active: true, windowId: 1 }],
    [2, { id: 2, url: 'https://example.com/article', active: false, windowId: 1 }],
  ]);
  const chrome = {
    storage: { local: area(local), session: area(session), onChanged: event('storage') },
    sidePanel: {
      setPanelBehavior: async () => {},
      setOptions: async () => {},
      open: async () => {},
      onClosed: event('nativeClosed'),
    },
    action: { onClicked: event('click') },
    tabs: {
      get: async id => structuredClone(tabs.get(id)),
      query: async () => [...tabs.values()],
      sendMessage: async (id, data) => {
        messages.push({ id, data });
        return { ok: true };
      },
      onRemoved: event('removed'),
      onUpdated: event('updated'),
    },
    offscreen: { hasDocument: async () => true, createDocument: async () => {} },
    runtime: {
      id: 'extension',
      getURL: path => 'chrome-extension://extension/' + path.replace(/^\//, ''),
      openOptionsPage: async () => {},
      onMessage: event('message'),
      sendMessage: async message => ({ result: Rules.decide(...message.args) }),
    },
  };
  const context = vm.createContext({
    chrome,
    URL,
    crypto: webcrypto,
    NutEggRules: Rules,
    NutEggPageIdentity: { capturePageKey: url => url?.split('#')[0] },
    console,
  });
  vm.runInContext(fs.readFileSync(require.resolve('../src/panel/background.js'), 'utf8'), context);
  await context.NutEggPanels.ready;
  const content = (id = 1) => ({
    id: 'extension',
    tab: tabs.get(id),
    frameId: 0,
    documentId: tabs.get(id).documentId || 'first-document',
    url: tabs.get(id).url,
  });
  const extension = (id = 1, frameId = 7) => ({
    id: 'extension',
    tab: tabs.get(id),
    frameId,
    url: 'chrome-extension://extension/src/popup/popup.html',
  });
  const send = (message, sender = content()) => new Promise(resolve => events.message[0](message, sender, resolve));
  const signals = {
    author: 'Dan Koe',
    minutes: 4,
    contentAvailable: true,
    listing: false,
    searchText: 'Creative business',
  };
  const inspect = async (id = 1, captureOverride) => {
    const res = await send({ action: 'panel-signals', url: tabs.get(id).url, signals }, content(id));
    if (res?.shouldPrefetch) {
      await send(
        {
          action: 'panel-prefetch-complete',
          url: tabs.get(id).url,
          key: res.key,
          capture: captureOverride || { url: tabs.get(id).url, content: 'word '.repeat(650), extractionStatus: 'ready' },
        },
        content(id)
      );
    }
    return res;
  };
  const register = id => send({ action: 'panel-register', grant: session[`panel:${id}`]?.grant }, extension(id));
  return { chrome, local, session, messages, events, tabs, send, inspect, register, content, extension, context };
}
test('migration is once-only and automatic opening never starts in background tabs', async () => {
  const f = await fixture();
  assert.equal(f.local.panelSettings.mode, 'injected');
  assert.equal(f.local.panelSettings.autoAnalyze, false);
  await f.inspect(2);
  assert.equal(f.messages.length, 0);
  await f.inspect(1);
  assert.equal(f.messages[0].data.automatic, true);
  assert.equal((await fixture({ ...Rules.defaults, rules: [] })).local.panelSettings.rules.length, 0);
});
test('registration binds a single-use grant to its actual tab and frame', async () => {
  const f = await fixture();
  await f.inspect();
  const grant = f.session['panel:1'].grant;
  assert.equal((await f.send({ action: 'panel-register', grant }, f.extension(2))).error, 'forbidden');
  assert.equal((await f.send({ action: 'panel-register', grant }, f.content())).error, 'forbidden');
  assert.equal((await f.register(1)).tabId, 1);
  assert.equal((await f.register(1)).error, 'forbidden');
  assert.equal(await f.context.NutEggPanels.authorized(f.extension(1)), true);
  assert.equal(await f.context.NutEggPanels.authorized(f.extension(1, 8)), false);
  assert.equal((await f.send({ action: 'panel-get-settings' }, f.content())).error, 'forbidden');
});
test('closing revokes authority and suppresses reopening until navigation, including same-URL reload', async () => {
  const f = await fixture();
  await f.inspect();
  await f.register(1);
  await f.send({ action: 'panel-close' }, f.extension());
  const shown = f.messages.filter(m => m.data.action === 'nutegg-panel-show').length;
  await f.inspect();
  assert.equal(f.messages.filter(m => m.data.action === 'nutegg-panel-show').length, shown);
  assert.equal(await f.context.NutEggPanels.authorized(f.extension()), false);
  f.tabs.get(1).documentId = 'reloaded-document';
  f.events.updated[0](1, { status: 'loading' }, f.tabs.get(1));
  await flush();
  await f.inspect();
  assert.equal(f.messages.filter(m => m.data.action === 'nutegg-panel-show').length, shown + 1);
});
test('automatic analysis can be claimed once only on an automatically opened active injected panel', async () => {
  const f = await fixture({ ...Rules.defaults, autoAnalyze: true });
  await f.inspect();
  await f.register(1);
  assert.equal((await f.send({ action: 'panel-auto-claim' }, f.extension())).allowed, true);
  assert.equal((await f.send({ action: 'panel-auto-claim' }, f.extension())).allowed, false);
  const native = await fixture({ ...Rules.defaults, autoAnalyze: true, mode: 'native' });
  await native.inspect();
  assert.equal(native.messages.length, 0);
});
test('suggestions derive a website and author, require top-level sender, and save only on Yes', async () => {
  const f = await fixture();
  await f.inspect();
  const before = f.local.panelSettings.rules.length;
  assert.equal(
    (await f.send({ action: 'panel-suggest-save', url: f.tabs.get(1).url, allow: false }, f.extension())).error,
    'forbidden'
  );
  assert.equal(f.local.panelSettings.rules.length, before);
  await f.send({ action: 'panel-suggest-save', url: f.tabs.get(1).url, allow: false });
  const saved = f.local.panelSettings.rules.at(-1);
  assert.deepEqual(saved.topics, ['Dan Koe']);
  assert.equal(saved.action, 'block');
  assert.equal(new RegExp(saved.website).test('https://youtube.com.evil.test/'), false);
});
test('stale page signals and foreign frame commands are rejected', async () => {
  const f = await fixture();
  assert.equal((await f.send({ action: 'panel-signals', url: 'https://old.test/', signals: {} })).error, 'stale');
  const forged = { ...f.content(), frameId: 3 };
  assert.equal(
    (await f.send({ action: 'panel-signals', url: f.tabs.get(1).url, signals: {} }, forged)).error,
    'forbidden'
  );
  assert.equal(f.messages.length, 0);
});

test('accepting an opposite suggestion replaces the earlier identical scope', async () => {
  const f = await fixture();
  await f.inspect();
  const message = { action: 'panel-suggest-save', url: f.tabs.get(1).url };
  await f.send({ ...message, allow: false });
  await f.send({ ...message, allow: true });
  const matching = f.local.panelSettings.rules.filter(rule => rule.topics?.includes('Dan Koe'));
  assert.equal(matching.length, 1);
  assert.equal(matching[0].action, 'allow');
});

test('UI handoff snapshots preserve drafts and are consumed once', async () => {
  const f = await fixture(); await f.inspect(); await f.register(1);
  const transfer = { url: f.tabs.get(1).url, customQuestions: 'Why?', extractedContent: { content: 'Captured source' } };
  await f.send({ action: 'panel-switch', mode: 'native', transfer }, f.extension());
  const nativeSender = { id: 'extension', url: 'chrome-extension://extension/src/popup/popup.html' };
  const restored = await f.send({ action: 'panel-transfer-get', tabId: 1 }, nativeSender);
  assert.equal(restored.transfer.customQuestions, 'Why?');
  assert.equal((await f.send({ action: 'panel-transfer-get', tabId: 1 }, nativeSender)).transfer, null);
});


test('settings preview targets the requested website tab rather than the options tab', async () => {
  const f = await fixture(); await f.inspect();
  const options = { id: 'extension', frameId: 0, url: 'chrome-extension://extension/src/options/options.html', tab: { id: 99, url: 'chrome-extension://extension/src/options/options.html' } };
  const result = await f.send({ action: 'panel-test-rules', tabId: 1 }, options);
  assert.equal(result.signals.author, 'Dan Koe');
  assert.equal(result.decision.open, true);
});

test('accepting a suggestion creates customized rules with the preset fallback', async () => {
  for (const policy of ['open', 'closed']) {
    const f = await fixture({ ...Rules.defaults, openingPolicy: policy }); await f.inspect();
    await f.send({ action: 'panel-suggest-save', url: f.tabs.get(1).url, allow: policy === 'closed' });
    assert.equal(f.local.panelSettings.openingPolicy, 'custom');
    assert.equal(f.local.panelSettings.defaultOpen, policy === 'open');
    assert.equal(f.local.panelSettings.rules.length, 1);
    assert.deepEqual(f.local.panelSettings.rules[0].topics, ['Dan Koe']);
  }
});

test('fetched reading metrics survive later passive probes and reject stale captures', async () => {
  const f = await fixture(); await f.inspect(); await f.register(1);
  const key = f.tabs.get(1).url;
  assert.equal((await f.send({ action: 'panel-capture-metrics', key, minutes: 8, contentAvailable: true }, f.extension())).ok, true);
  await f.send({ action: 'panel-signals', url: key, signals: { minutes: null, contentAvailable: false } });
  assert.equal(f.session['panel:1'].signals.minutes, 8);
  assert.equal(f.session['panel:1'].signals.contentAvailable, true);
  assert.equal((await f.send({ action: 'panel-capture-metrics', key: 'https://old.test', minutes: 9, contentAvailable: true }, f.extension())).error, 'stale');
});

test('immediate rules open without prefetch; rules needing content/video signals stay closed if fetch fails or returns empty', async () => {
  const f = await fixture();
  const immediate = await f.send({
    action: 'panel-signals',
    url: f.tabs.get(1).url,
    signals: { author: 'Dan Koe', minutes: null, contentAvailable: false, listing: false },
  });
  assert.equal(immediate.opened, true);
  assert.equal(immediate.shouldPrefetch, false);
  assert.equal(f.messages.filter(m => m.data.action === 'nutegg-panel-show').length, 1);

  const f2 = await fixture();
  f2.tabs.get(1).url = 'https://www.tiktok.com/@alice/video/123';
  const deferred = await f2.send({
    action: 'panel-signals',
    url: f2.tabs.get(1).url,
    signals: { mediaKind: 'video', videoDurationSeconds: 181, contentAvailable: true, listing: false },
  });
  assert.equal(deferred.opened, undefined);
  assert.equal(deferred.shouldPrefetch, true);
  assert.equal(f2.messages.filter(m => m.data.action === 'nutegg-panel-show').length, 0);
  await f2.send({
    action: 'panel-prefetch-complete',
    url: f2.tabs.get(1).url,
    key: deferred.key,
    capture: { url: f2.tabs.get(1).url, content: '', extractionStatus: 'unavailable' },
  });
  assert.equal(f2.messages.filter(m => m.data.action === 'nutegg-panel-show').length, 0);
});

test('pending higher-rank block rule with video length defers immediate auto-open', async () => {
  const f = await fixture({
    ...Rules.defaults,
    openingPolicy: 'custom',
    rules: [
      { id: 'allow-yt', enabled: true, action: 'allow', hostname: 'youtube.com', website: Rules.websiteRegex('youtube.com'), excludeListings: true },
      { id: 'block-long-yt', enabled: true, action: 'block', hostname: 'youtube.com', website: Rules.websiteRegex('youtube.com'), videoLongerThanSeconds: 600 },
    ],
  });
  const res = await f.send({
    action: 'panel-signals',
    url: f.tabs.get(1).url,
    signals: { mediaKind: 'unknown', contentAvailable: false, listing: false },
  });
  assert.equal(res.decision.open, true);
  assert.equal(res.decision.needsContentSignals, true);
  assert.equal(res.opened, undefined);
  assert.equal(res.shouldPrefetch, true);
  assert.equal(f.messages.filter(m => m.data.action === 'nutegg-panel-show').length, 0);
});

test('switching from native chrome panel to web panel closes the chrome side panel only on success', async () => {
  const f = await fixture({ ...Rules.defaults, mode: 'native' });
  const closedTabs = [];
  f.chrome.sidePanel.close = async ({ tabId }) => { closedTabs.push(tabId); };
  const nativeSender = { id: 'extension', url: 'chrome-extension://extension/src/popup/popup.html' };
  const res = await f.send({ action: 'panel-switch', tabId: 1, mode: 'injected' }, nativeSender);
  assert.equal(res.ok, true);
  assert.deepEqual(closedTabs, [1]);

  f.tabs.set(3, { id: 3, url: 'chrome://settings', active: true, windowId: 1 });
  const restricted = await f.send({ action: 'panel-switch', tabId: 3, mode: 'injected' }, nativeSender);
  assert.equal(restricted.error, 'panelRestricted');
  assert.deepEqual(closedTabs, [1]);
});

test('social short/unknown videos cannot open from cached history; long captionless videos open without automatic analysis', async () => {
  const f = await fixture({ ...Rules.defaults, autoAnalyze: true });
  f.tabs.get(1).url = 'https://www.tiktok.com/@alice/video/123';
  let historyCalls = 0;
  f.context.fetchHistory = async () => { historyCalls++; return { latest: { content:'Cached body', result:{coreSummary:['Cached']} } }; };
  for (const duration of [null, 179, 180]) {
    const response = await f.send({ action:'panel-signals',url:f.tabs.get(1).url,
      signals:{mediaKind:'video',videoDurationSeconds:duration,contentAvailable:true} });
    assert.equal(response.shouldPrefetch,false);
    assert.equal(response.decision.open,false);
  }
  assert.equal(historyCalls,0);
  delete f.context.fetchHistory;
  const response = await f.send({action:'panel-signals',url:f.tabs.get(1).url,
    signals:{mediaKind:'video',videoDurationSeconds:181,contentAvailable:true}});
  assert.equal(response.shouldPrefetch,true);
  const result = await f.send({action:'panel-prefetch-complete',url:f.tabs.get(1).url,key:response.key,
    capture:{url:f.tabs.get(1).url,content:'Owned description',extractionStatus:'ready',transcriptAvailable:false,
      mediaType:'video',metadata:{media_kind:'video',video_duration_seconds:181}}});
  assert.equal(result.opened,true);
  await f.register(1);
  assert.equal((await f.send({action:'panel-auto-claim'},f.extension())).allowed,false);
});
