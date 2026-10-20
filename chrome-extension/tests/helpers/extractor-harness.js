const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const extensionRoot = path.resolve(__dirname, '../..');
const manifest = require('../../manifest.json');
const captureScripts = () => manifest.content_scripts.find(entry => entry.js?.includes('src/content/content-script.js')).js;
const code = file => fs.readFileSync(path.join(extensionRoot, file), 'utf8');
const flush = () => new Promise(resolve => setImmediate(resolve));
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

/** Real capture runtime in a disposable DOM. Paths are relative to chrome-extension/. */
function createExtractorPage(t, options = {}) {
  const { JSDOM } = require('jsdom');
  const dom = new JSDOM(options.html || '<main></main>', {
    url: options.url || 'https://example.com/article', runScripts: 'outside-only',
  });
  const win = dom.window, listeners = [], contexts = new Set(), timers = new Set();
  const messages = [], requests = [];
  win.chrome = { runtime: {
    getManifest: () => manifest,
    sendMessage: async message => { messages.push(message); return options.onMessage?.(message) ?? { success: true }; },
    onMessage: { addListener: listener => listeners.push(listener),
      removeListener: listener => { const index = listeners.indexOf(listener); if (index >= 0) listeners.splice(index, 1); } },
  } };
  // Unexpected network work must fail locally, never reach a live provider.
  win.fetch = async (url, init) => {
    requests.push({ url, init });
    if (!options.fetch) throw new Error(`Unexpected fixture request: ${new URL(url, win.location.href).pathname}`);
    return options.fetch(url, init);
  };
  if (options.readyState) Object.defineProperty(win.document, 'readyState', { get: () => options.readyState });
  if (options.registry) win.EXTRACTORS = options.registry;
  const load = file => win.eval(code(file));
  for (const file of options.scripts || captureScripts()) load(file);
  function context(input) {
    const value = win.createCaptureContext(input);
    contexts.add(value);
    return value;
  }
  function send(message) {
    return new Promise(resolve => {
      let answered = false, pending = false;
      const reply = value => { if (!answered) { answered = true; resolve(value); } };
      for (const listener of listeners) pending = listener(message, {}, reply) === true || pending;
      if (!pending && !answered) resolve(undefined);
    });
  }
  let sequence = 0;
  const capture = (input = {}) => send({ action: 'extract-content', requestId: `fixture:${++sequence}`, ...input });
  const cancel = requestId => send({ action: 'cancel-extraction', requestId });
  function navigate(url) {
    dom.reconfigure({ url: new URL(url, win.location.href).href });
    win.syncCaptureNavigation?.();
  }
  function hydrate(html, delay = 0, selector = 'main') {
    return new Promise(resolve => {
      const timer = win.setTimeout(() => {
        timers.delete(timer);
        win.document.querySelector(selector).innerHTML = html;
        resolve();
      }, delay);
      timers.add(timer);
    });
  }
  t.after(() => {
    const active = win.__nuteggCaptureState?.active?.context;
    active?.abort(); active?.dispose();
    for (const value of contexts) { value.abort(); value.dispose(); }
    for (const timer of timers) win.clearTimeout(timer);
    win.NutEggDiscussion?.stop();
    dom.window.close();
  });
  return { dom, win, load, send, capture, cancel, context, navigate, hydrate, messages, requests, listeners };
}

/** Lightweight platform unit fixtures retain custom document/session stubs without duplicating loaders. */
function createPlatformContext(url, options = {}) {
  const document = { title: 'Page', querySelector: () => null, querySelectorAll: () => [], ...options.document };
  const ctx = vm.createContext({ URL, console, document, window: { location: { href: url } },
    performance: { getEntriesByType: () => options.resources || [] },
    chrome: { runtime: { sendMessage: async message => ({ success: true, text: JSON.stringify(await options.api(message.url)) }) } },
    ...options.globals });
  for (const file of captureScripts().filter(file => file === 'dist/page-identity.js' || file === 'src/content/utils.js' ||
    /\/extractors\/(?:chinese-common|bilibili|douyin|weibo|zhihu)\.js$/.test(file)))
    vm.runInContext(code(file), ctx, { filename: file });
  return ctx;
}
module.exports = { createExtractorPage, createPlatformContext, captureScripts, code, deferred, flush };
