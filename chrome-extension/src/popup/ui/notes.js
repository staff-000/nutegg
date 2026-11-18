// ============================================================
// NutEgg Popup UI — User Notes Component (Obsidian Mode)
// ============================================================

function _notesEscapeHtml(str) {
  if (typeof escapeHtml === 'function') return escapeHtml(str);
  if (typeof document !== 'undefined' && document.createElement) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function _formatNotePlaybackTime(seconds) {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds < 0) return '';
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

class NotesComponent {
  constructor(root = document) {
    this.root = root;
    this.editingId = null;
    this.notes = [];
    this.callbacks = {};
    this.bindElements(root);
  }

  bindElements(root = this.root || (typeof document !== 'undefined' ? document : null)) {
    if (!root) return;
    const getEl = id =>
      (root.getElementById ? root.getElementById(id) : root.querySelector ? root.querySelector(`#${id}`) : null) ||
      (typeof document !== 'undefined' ? document.getElementById(id) : null);

    this.section = getEl('user-notes-section');
    this.countBadge = getEl('user-notes-count');
    this.copyAllBtn = getEl('user-notes-copy-all');
    this.listEl = getEl('user-notes-list');
    this.inputEl = getEl('user-note-input');
    this.addBtn = getEl('user-note-add-btn');
  }

  init(callbacks = {}) {
    this.callbacks = callbacks;
    this.bindElements(this.root);

    if (this.addBtn && !this.addBtn._notesBound) {
      this.addBtn._notesBound = true;
      this.addBtn.addEventListener('click', () => void this.handleAdd());
    }
    if (this.inputEl && !this.inputEl._notesBound) {
      this.inputEl._notesBound = true;
      this.inputEl.addEventListener('input', () => {
        this.callbacks.onDraftChange?.(this.inputEl.value);
      });
      this.inputEl.addEventListener('keydown', e => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
          e.preventDefault();
          void this.handleAdd();
        }
      });
    }
    if (this.copyAllBtn && !this.copyAllBtn._notesBound) {
      this.copyAllBtn._notesBound = true;
      this.copyAllBtn.addEventListener('click', e => {
        e.stopPropagation();
        if (!this.notes.length) return;
        const markdown = this.notes
          .map(n => `- ${n.time ? `[${n.time}] ` : ''}${n.text}`)
          .join('\n');
        navigator.clipboard?.writeText?.(markdown);
        const orig = this.copyAllBtn.textContent;
        this.copyAllBtn.textContent = '✓';
        setTimeout(() => {
          if (this.copyAllBtn) this.copyAllBtn.textContent = orig;
        }, 1200);
      });
    }
  }

  async handleAdd() {
    if (!this.inputEl) return;
    const text = this.inputEl.value.trim();
    if (!text) {
      this.inputEl.focus();
      return;
    }
    const sec = this.callbacks.getPlaybackSeconds?.();
    const time = _formatNotePlaybackTime(sec);
    const entry = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `note-${Date.now()}`,
      text,
      ...(time ? { time } : {}),
      createdAt: new Date().toISOString(),
    };
    const nextNotes = [...this.notes, entry];
    this.inputEl.value = '';
    await this.callbacks.onSaveNotes?.(nextNotes, true);
  }

  async addQaNote(qa) {
    if (!qa?.question || !qa?.answer) return;
    const text = `Q: ${qa.question}\nA: ${qa.answer}`;
    const firstTime = qa.sources?.find(s => s?.ref && /^\d{1,3}:\d{2}/.test(String(s.ref).trim()))?.ref;
    const entry = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `note-${Date.now()}`,
      text,
      ...(firstTime ? { time: String(firstTime).trim() } : {}),
      createdAt: new Date().toISOString(),
    };
    const nextNotes = [...this.notes, entry];
    await this.callbacks.onSaveNotes?.(nextNotes, false);
  }

  render(view = {}, settings = {}, callbacks = {}) {
    if (Object.keys(callbacks).length > 0) this.callbacks = { ...this.callbacks, ...callbacks };
    this.bindElements(this.root);
    if (!this.section) return;

    const obsidianMode = settings.isChromeMode ? !settings.isChromeMode() : settings.connectionMode === 'obsidian';
    const enabled = settings.userNotesEnabled !== false;
    const visible = Boolean(obsidianMode && enabled && view.analysisResult);
    this.section.classList.toggle('hidden', !visible);
    if (!visible) return;

    this.notes = Array.isArray(view.userNotes) ? view.userNotes : [];
    if (this.countBadge) {
      this.countBadge.textContent = this.notes.length > 0 ? `(${this.notes.length})` : '';
    }
    if (this.copyAllBtn) {
      this.copyAllBtn.classList.toggle('hidden', this.notes.length === 0);
    }
    if (this.inputEl && document.activeElement !== this.inputEl && typeof view.noteDraft === 'string') {
      if (this.inputEl.value !== view.noteDraft) this.inputEl.value = view.noteDraft;
    }
    this.renderList();
  }

  renderList() {
    if (!this.listEl) return;
    this.listEl.replaceChildren();
    for (const note of this.notes) {
      const card = document.createElement('div');
      card.className = 'user-note-item';

      if (this.editingId === note.id) {
        const editBox = document.createElement('textarea');
        editBox.className = 'user-note-edit-input';
        editBox.rows = 2;
        editBox.value = note.text;

        const actions = document.createElement('div');
        actions.className = 'user-note-edit-actions';
        const saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.className = 'user-note-save-btn';
        saveBtn.textContent = typeof t === 'function' ? t('saveBtn') : 'Save';
        saveBtn.addEventListener('click', async () => {
          const updatedText = editBox.value.trim();
          this.editingId = null;
          if (!updatedText) return;
          const nextNotes = this.notes.map(n =>
            n.id === note.id ? { ...n, text: updatedText, updatedAt: new Date().toISOString() } : n
          );
          await this.callbacks.onSaveNotes?.(nextNotes, false);
        });
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'user-note-cancel-btn';
        cancelBtn.textContent = typeof t === 'function' ? t('cancelBtn') : 'Cancel';
        cancelBtn.addEventListener('click', () => {
          this.editingId = null;
          this.renderList();
        });
        actions.append(saveBtn, cancelBtn);
        card.append(editBox, actions);
        this.listEl.append(card);
        continue;
      }

      const body = document.createElement('div');
      body.className = 'user-note-body';
      if (note.time) {
        const timeBtn = document.createElement('button');
        timeBtn.type = 'button';
        timeBtn.className = 'user-note-time timestamp-link';
        timeBtn.dataset.time = note.time;
        timeBtn.textContent = `[${note.time}]`;
        timeBtn.addEventListener('click', () => {
          this.callbacks.onSeekTimestamp?.(note.time);
        });
        body.append(timeBtn, ' ');
      }
      const textSpan = document.createElement('span');
      textSpan.className = 'user-note-text';
      textSpan.innerHTML = _notesEscapeHtml(note.text);
      body.append(textSpan);

      const controls = document.createElement('div');
      controls.className = 'user-note-controls';

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'user-note-icon-btn';
      editBtn.title = 'Edit note';
      editBtn.textContent = '✎';
      editBtn.addEventListener('click', () => {
        this.editingId = note.id;
        this.renderList();
      });

      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'user-note-icon-btn';
      copyBtn.title = 'Copy note';
      copyBtn.textContent = '📋';
      copyBtn.addEventListener('click', () => {
        const formatted = `${note.time ? `[${note.time}] ` : ''}${note.text}`;
        navigator.clipboard?.writeText?.(formatted);
        copyBtn.textContent = '✓';
        setTimeout(() => {
          copyBtn.textContent = '📋';
        }, 1000);
      });

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'user-note-icon-btn user-note-delete-btn';
      delBtn.title = 'Delete note';
      delBtn.textContent = '×';
      delBtn.addEventListener('click', async () => {
        const nextNotes = this.notes.filter(n => n.id !== note.id);
        await this.callbacks.onSaveNotes?.(nextNotes, false);
      });

      controls.append(editBtn, copyBtn, delBtn);
      card.append(body, controls);
      this.listEl.append(card);
    }
  }
}

const _notesScope = typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : this;
_notesScope.NutEggUI = _notesScope.NutEggUI || {};
_notesScope.NutEggUI.NotesComponent = NotesComponent;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { NotesComponent };
}

