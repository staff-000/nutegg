function createMockElement(id = "") {
  return {
    id,
    textContent: "",
    innerHTML: "",
    className: "",
    style: {},
    disabled: false,
    classList: {
      _classes: new Set(),
      add(c) { this._classes.add(c); },
      remove(c) { this._classes.delete(c); },
      contains(c) { return this._classes.has(c); },
      toggle(c, force) {
        if (force !== undefined) { if (force) this._classes.add(c); else this._classes.delete(c); return force; }
        if (this._classes.has(c)) { this._classes.delete(c); return false; }
        this._classes.add(c); return true;
      }
    },
    setAttribute(k, v) { this[k] = v; },
    getAttribute(k) { return this[k]; },
    addEventListener(event, fn) {
      if (!this._listeners) this._listeners = {};
      if (!this._listeners[event]) this._listeners[event] = [];
      this._listeners[event].push(fn);
    },
    removeEventListener(event, fn) {
      if (!this._listeners || !this._listeners[event]) return;
      this._listeners[event] = this._listeners[event].filter((f) => f !== fn);
    },
    click() {
      if (this._listeners?.click) {
        this._listeners.click.forEach((fn) => fn({ target: this }));
      }
    },
    children: [],
    replaceChildren() { this.children = []; },
    appendChild(child) { this.children.push(child); },
    removeAttribute(key) { delete this[key]; },
    contains() { return false; },
    scrollIntoView() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
  };
}

function createMockRoot() {
  const elements = new Map();
  return {
    body: createMockElement("body"),
    getElementById(id) {
      if (!elements.has(id)) {
        elements.set(id, createMockElement(id));
      }
      return elements.get(id);
    }
  };
}

module.exports = { createMockElement, createMockRoot };
