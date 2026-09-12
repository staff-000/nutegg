import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { detectLanguage } from "../src/language-detector";

describe("detectLanguage", () => {
  it("detects Chinese from CJK characters", () => {
    assert.equal(detectLanguage("介绍做事的具体方法"), "Chinese");
    assert.equal(detectLanguage("方法论"), "Chinese");
    assert.equal(detectLanguage("AI Architecture & Multi-Agent 架构设计"), "Chinese");
  });

  it("detects Japanese when Kana is present", () => {
    assert.equal(detectLanguage("ソフトウェア開発の実践的な方法"), "Japanese");
    assert.equal(detectLanguage("デザインパターン"), "Japanese");
  });

  it("detects Korean when Hangul is present", () => {
    assert.equal(detectLanguage("소프트웨어 개발 실무 방법"), "Korean");
  });

  it("detects Russian from Cyrillic", () => {
    assert.equal(detectLanguage("Методы разработки ПО"), "Russian");
  });

  it("detects Arabic from Arabic script", () => {
    assert.equal(detectLanguage("تطوير البرمجيات"), "Arabic");
  });

  it("detects English from Latin text", () => {
    assert.equal(detectLanguage("Practical software engineering methods"), "English");
  });

  it("returns empty string for whitespace or empty", () => {
    assert.equal(detectLanguage(""), "");
    assert.equal(detectLanguage("   "), "");
    assert.equal(detectLanguage("12345 !@#"), "");
  });
});

