"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// tests/language-detector.test.ts
var import_node_test = require("node:test");
var import_strict = __toESM(require("node:assert/strict"));

// src/language-detector.ts
function detectLanguage(text) {
  if (!text || !text.trim())
    return "";
  const trimmed = text.trim();
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(trimmed)) {
    return "Japanese";
  }
  if (/[\uAC00-\uD7AF\u1100-\u11FF]/.test(trimmed)) {
    return "Korean";
  }
  if (/[\u4E00-\u9FFF]/.test(trimmed)) {
    return "Chinese";
  }
  if (/[\u0400-\u04FF]/.test(trimmed)) {
    return "Russian";
  }
  if (/[\u0600-\u06FF]/.test(trimmed)) {
    return "Arabic";
  }
  if (/[a-zA-Z]/.test(trimmed)) {
    return "English";
  }
  return "";
}

// tests/language-detector.test.ts
(0, import_node_test.describe)("detectLanguage", () => {
  (0, import_node_test.it)("detects Chinese from CJK characters", () => {
    import_strict.default.equal(detectLanguage("\u4ECB\u7ECD\u505A\u4E8B\u7684\u5177\u4F53\u65B9\u6CD5"), "Chinese");
    import_strict.default.equal(detectLanguage("\u65B9\u6CD5\u8BBA"), "Chinese");
    import_strict.default.equal(detectLanguage("AI Architecture & Multi-Agent \u67B6\u6784\u8BBE\u8BA1"), "Chinese");
  });
  (0, import_node_test.it)("detects Japanese when Kana is present", () => {
    import_strict.default.equal(detectLanguage("\u30BD\u30D5\u30C8\u30A6\u30A7\u30A2\u958B\u767A\u306E\u5B9F\u8DF5\u7684\u306A\u65B9\u6CD5"), "Japanese");
    import_strict.default.equal(detectLanguage("\u30C7\u30B6\u30A4\u30F3\u30D1\u30BF\u30FC\u30F3"), "Japanese");
  });
  (0, import_node_test.it)("detects Korean when Hangul is present", () => {
    import_strict.default.equal(detectLanguage("\uC18C\uD504\uD2B8\uC6E8\uC5B4 \uAC1C\uBC1C \uC2E4\uBB34 \uBC29\uBC95"), "Korean");
  });
  (0, import_node_test.it)("detects Russian from Cyrillic", () => {
    import_strict.default.equal(detectLanguage("\u041C\u0435\u0442\u043E\u0434\u044B \u0440\u0430\u0437\u0440\u0430\u0431\u043E\u0442\u043A\u0438 \u041F\u041E"), "Russian");
  });
  (0, import_node_test.it)("detects Arabic from Arabic script", () => {
    import_strict.default.equal(detectLanguage("\u062A\u0637\u0648\u064A\u0631 \u0627\u0644\u0628\u0631\u0645\u062C\u064A\u0627\u062A"), "Arabic");
  });
  (0, import_node_test.it)("detects English from Latin text", () => {
    import_strict.default.equal(detectLanguage("Practical software engineering methods"), "English");
  });
  (0, import_node_test.it)("returns empty string for whitespace or empty", () => {
    import_strict.default.equal(detectLanguage(""), "");
    import_strict.default.equal(detectLanguage("   "), "");
    import_strict.default.equal(detectLanguage("12345 !@#"), "");
  });
});
