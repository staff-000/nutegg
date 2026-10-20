const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');
// Reuse the DOM test dependency already installed in this workspace.
const { JSDOM } = createRequire(require.resolve('../../obsidian-plugin/package.json'))('jsdom');
const source = path.join(__dirname, '../src');
const websiteScript = fs.readFileSync(path.join(source, 'i18n.js'), 'utf8');
const docsScript = fs.readFileSync(path.join(source, 'docs/i18n.js'), 'utf8');
const languages = ['en', 'zh', 'es', 'ja', 'ko', 'ar', 'fr', 'de', 'pt', 'ru'];

function page(file) {
  const dom = new JSDOM(fs.readFileSync(path.join(source, file), 'utf8'), {
    url: 'https://nutegg.test/' + file,
    runScripts: 'dangerously',
  });
  const install = code => {
    const script = dom.window.document.createElement('script');
    script.textContent = code;
    dom.window.document.body.appendChild(script);
  };
  if (file.startsWith('docs/')) {
    const style = dom.window.document.createElement('style');
    style.textContent = fs.readFileSync(path.join(source, 'docs/docs.css'), 'utf8');
    dom.window.document.head.appendChild(style);
    install(docsScript);
  }
  install(websiteScript);
  return dom;
}

test('website attributes and titles follow language changes and restore to English', () => {
  const dom = page('index.html');
  try {
    const win = dom.window,
      doc = win.document;
    for (const lang of languages) {
      win.setWebLanguage(lang);
      assert.equal(doc.documentElement.dir, lang === 'ar' ? 'rtl' : 'ltr');
      for (const attr of ['title', 'aria-label', 'alt']) {
        for (const el of doc.querySelectorAll(`[data-i18n-${attr}]`)) {
          const key = el.getAttribute(`data-i18n-${attr}`);
          assert.equal(el.getAttribute(attr), win.tWeb(key));
          assert.notEqual(el.getAttribute(attr), key);
        }
      }
      assert.equal(doc.title, win.tWeb('websiteTitle'));
      assert.ok(doc.title.includes('NutEgg'));
    }
    win.setWebLanguage('en');
    assert.equal(doc.querySelector('#showcase-next').getAttribute('aria-label'), 'Next screenshot');
  } finally {
    dom.window.close();
  }
});

test('documentation switching preserves links and code examples and resolves every message', () => {
  for (const file of fs.readdirSync(path.join(source, 'docs')).filter(file => file.endsWith('.html'))) {
    const dom = page('docs/' + file);
    try {
      const doc = dom.window.document;
      const links = () => [...doc.querySelectorAll('main a')].map(el => el.getAttribute('href')).sort();
      const codes = () => [...doc.querySelectorAll('main pre, main code')].map(el => el.textContent).sort();
      const originalLinks = links(),
        originalCodes = codes(),
        englishHeading = doc.querySelector('main h1').textContent;
      for (const lang of [...languages, 'en']) {
        dom.window.setWebLanguage(lang);
        assert.deepEqual(links(), originalLinks, file + ': links');
        assert.doesNotMatch(doc.title, /&(?:amp|lt|gt|quot);/, file + ': plain-text title');
        if (lang !== 'en')
          assert.notEqual(doc.querySelector('main h1').textContent, englishHeading, file + ': translated heading');
        assert.deepEqual(codes(), originalCodes, file + ': code examples');
        if (lang === 'ar') {
          assert.equal(doc.documentElement.dir, 'rtl');
          for (const code of doc.querySelectorAll('main pre, main code')) {
            const style = dom.window.getComputedStyle(code);
            assert.equal(style.direction, 'ltr', file + ': code direction');
            assert.equal(style.unicodeBidi, 'isolate', file + ': code isolation');
          }
        }
        for (const el of doc.querySelectorAll('[data-i18n], [data-i18n-html]')) {
          const key = el.dataset.i18n || el.dataset.i18nHtml;
          assert.notEqual(dom.window.tWeb(key), key, file + ': ' + key);
        }
      }
      assert.doesNotMatch(doc.querySelector('main').innerHTML, /⟦\d+⟧|⟪\d+⟫/);
    } finally {
      dom.window.close();
    }
  }
});

test('documentation has complete dictionaries with valid markup in every supported language', () => {
  const { runInNewContext } = require('node:vm');
  const dictionaries = runInNewContext(docsScript + '\n;docsTranslations;');
  const englishKeys = Object.keys(dictionaries.en).sort();
  const voidTags = new Set(['br', 'hr', 'img', 'input', 'meta', 'link', 'wbr', 'source']);
  const elements = html => {
    const fragment = JSDOM.fragment(html);
    return [...fragment.querySelectorAll('*')]
      .map(el => JSON.stringify([el.tagName, [...el.attributes].map(attr => [attr.name, attr.value]).sort()]))
      .sort();
  };
  const balanced = (html, label) => {
    const stack = [];
    for (const match of html.matchAll(/<!--[\s\S]*?-->|<\/?([a-z][\w:-]*)\b[^>]*>/gi)) {
      if (!match[1]) continue;
      const tag = match[1].toLowerCase();
      if (voidTags.has(tag) || /\/>$/.test(match[0])) continue;
      if (match[0].startsWith('</')) assert.equal(stack.pop(), tag, label);
      else stack.push(tag);
    }
    assert.deepEqual(stack, [], label);
  };
  const englishElements = Object.fromEntries(englishKeys.map(key => [key, elements(dictionaries.en[key])]));
  for (const lang of languages) {
    assert.ok(dictionaries[lang], lang);
    assert.deepEqual(Object.keys(dictionaries[lang]).sort(), englishKeys, lang);
    for (const key of englishKeys) {
      const value = dictionaries[lang][key];
      assert.ok(value.trim(), `${lang}: ${key}`);
      if (/\bmarkdown\b/i.test(dictionaries.en[key]))
        assert.match(value, /\bMarkdown\b/i, `${lang}: ${key} format name`);
      balanced(value, `${lang}: ${key}`);
      assert.deepEqual(elements(value), englishElements[key], `${lang}: ${key} markup`);
      assert.equal(
        (value.match(/NutEgg/g) || []).length,
        (dictionaries.en[key].match(/NutEgg/g) || []).length,
        `${lang}: ${key} brand`
      );
      assert.doesNotMatch(value, /⟦\s*\d+\s*⟧|⟪\s*\d+\s*⟫/, `${lang}: ${key} placeholder`);
    }
  }
});
