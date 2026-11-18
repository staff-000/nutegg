const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { NotesComponent } = require('../src/popup/ui/notes');
const { TabStateManager } = require('../src/popup/state/tab-state');

function setupNotesDom(t) {
  const dom = new JSDOM(
    `<div id="user-notes-section" data-obsidian-only class="result-section hidden">
      <div class="section-header">
        <div class="section-label"><span>📝 Your Notes</span><span id="user-notes-count"></span></div>
        <button type="button" id="user-notes-copy-all" class="hidden">📋</button>
      </div>
      <div class="section-content">
        <div id="user-notes-list"></div>
        <div class="user-notes-input-row">
          <textarea id="user-note-input" rows="1"></textarea>
          <button id="user-note-add-btn" type="button">Add</button>
        </div>
      </div>
    </div>`,
    { url: 'https://extension.test/popup' }
  );
  t.after(() => dom.window.close());
  global.document = dom.window.document;
  global.t = k => k;
  return dom.window;
}

test('NotesComponent is Obsidian-mode only and respects userNotesEnabled setting', t => {
  const win = setupNotesDom(t);
  const notesUI = new NotesComponent(win.document);

  notesUI.render({ analysisResult: { titleVerdict: 'Ok' }, userNotes: [] }, { connectionMode: 'chrome', userNotesEnabled: true });
  assert.equal(notesUI.section.classList.contains('hidden'), true);

  notesUI.render({ analysisResult: { titleVerdict: 'Ok' }, userNotes: [] }, { connectionMode: 'obsidian', userNotesEnabled: false });
  assert.equal(notesUI.section.classList.contains('hidden'), true);

  notesUI.render({ analysisResult: { titleVerdict: 'Ok' }, userNotes: [] }, { connectionMode: 'obsidian', userNotesEnabled: true });
  assert.equal(notesUI.section.classList.contains('hidden'), false);
});

test('NotesComponent supports adding with timestamp, editing, and deleting entries', async t => {
  const win = setupNotesDom(t);
  const notesUI = new NotesComponent(win.document);
  let savedNotes = [];
  notesUI.init({
    getPlaybackSeconds: () => 125,
    onSaveNotes: async (nextNotes) => {
      savedNotes = nextNotes;
      notesUI.render(
        { analysisResult: { titleVerdict: 'Ok' }, userNotes: savedNotes },
        { connectionMode: 'obsidian', userNotesEnabled: true }
      );
    },
  });

  notesUI.render(
    { analysisResult: { titleVerdict: 'Ok' }, userNotes: [] },
    { connectionMode: 'obsidian', userNotesEnabled: true }
  );

  notesUI.inputEl.value = 'Great insight about caching';
  await notesUI.handleAdd();
  assert.equal(savedNotes.length, 1);
  assert.equal(savedNotes[0].text, 'Great insight about caching');
  assert.equal(savedNotes[0].time, '02:05');
  assert.equal(notesUI.countBadge.textContent, '(1)');
  assert.equal(notesUI.listEl.querySelectorAll('.user-note-item').length, 1);

  // Edit note
  notesUI.listEl.querySelector('.user-note-icon-btn').click();
  const editBox = notesUI.listEl.querySelector('.user-note-edit-input');
  assert.ok(editBox);
  editBox.value = 'Updated insight about KV caching';
  await notesUI.listEl.querySelector('.user-note-save-btn').click();
  assert.equal(savedNotes[0].text, 'Updated insight about KV caching');

  // Delete note
  await notesUI.listEl.querySelector('.user-note-delete-btn').click();
  assert.equal(savedNotes.length, 0);
  assert.equal(notesUI.countBadge.textContent, '');
});

test('TabStateManager stores and restores userNotes cleanly', () => {
  const store = new TabStateManager();
  store.ensure(1, 'https://example.com/article');
  store.dispatch({
    type: 'cachedResult',
    tabId: 1,
    result: {
      titleVerdict: 'Done',
      userNotes: [{ id: 'n1', text: 'Remember this', createdAt: '2026-11-18T00:00:00Z' }],
    },
    eggs: [],
  });
  assert.equal(store.getTab(1).userNotes.length, 1);
  assert.equal(store.getTab(1).userNotes[0].text, 'Remember this');

  store.dispatch({
    type: 'notesUpdated',
    tabId: 1,
    userNotes: [
      { id: 'n1', text: 'Remember this', createdAt: '2026-11-18T00:00:00Z' },
      { id: 'n2', text: 'Second note', createdAt: '2026-11-18T00:01:00Z' },
    ],
    clearDraft: true,
  });
  assert.equal(store.getTab(1).userNotes.length, 2);
  assert.equal(store.getTab(1).analysisResult.userNotes.length, 2);

  // Page refresh / historySelected restores userNotes via applyHistory
  const store2 = new TabStateManager();
  store2.ensure(2, 'https://example.com/article');
  store2.dispatch({
    type: 'historySelected',
    tabId: 2,
    entry: {
      nutId: 10,
      url: 'https://example.com/article',
      title: 'Title',
      sourceType: 'article',
      content: 'Body',
      saved: 'skip',
      result: { titleVerdict: 'Done', userNotes: [{ id: 'n9', text: 'Persisted note', createdAt: '2026-11-18T00:00:00Z' }] },
      userNotes: [{ id: 'n9', text: 'Persisted note', createdAt: '2026-11-18T00:00:00Z' }],
    },
  });
  assert.equal(store2.getTab(2).userNotes.length, 1);
  assert.equal(store2.getTab(2).userNotes[0].text, 'Persisted note');
});

