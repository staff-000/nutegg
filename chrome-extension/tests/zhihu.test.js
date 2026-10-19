const test = require('node:test');
const assert = require('node:assert/strict');
const { context } = require('./helpers/platform-fixtures');

test('Zhihu captures question and loaded answers without sidebar content', async () => {
  const body = { textContent: '答案正文' };
  const answer = { querySelector: sel => sel.includes('.RichText') ? body : { textContent: '答主' }, getAttribute: () => '{"itemId":"321"}' };
  const ctx = context('https://www.zhihu.com/question/1945573503303685016', { document: {
    querySelector: sel => sel.startsWith('h1.') ? { textContent: '问题标题' } : sel === '.QuestionRichText' ? { textContent: '问题描述' } : null,
    querySelectorAll: sel => sel === '.AnswerItem' ? [answer] : [],
  } });
  ctx.extractText = el => el.textContent;
  const capture = await ctx.extractZhihu();
  assert.match(capture.content, /问题描述/);
  assert.doesNotMatch(capture.content, /答案正文/);
  assert.equal(capture.discussion.kind, "forum");
  assert.match(capture.discussion.items[0].text, /答案正文/);
  assert.equal(capture.metadata.answer_count, 1);
  assert.equal(capture.metadata.capture_scope, 'question_and_loaded_answers');
});

test('Zhihu answer permalink excludes sibling answers', async () => {
  const answer = id => ({ querySelector: sel => sel.includes('.RichText') ? { textContent: `Answer ${id}` } : null,
    getAttribute: () => JSON.stringify({ itemId: id }) });
  const ctx = context('https://www.zhihu.com/question/100/answer/321', { document: {
    querySelector: sel => sel.startsWith('h1.') ? { textContent: 'Question' } : null,
    querySelectorAll: sel => sel === '.AnswerItem' ? [answer('999'), answer('321')] : [],
  } });
  ctx.extractText = el => el.textContent;
  const capture = await ctx.extractZhihu();
  assert.match(capture.content, /Answer 321/);
  assert.doesNotMatch(capture.content, /Answer 999/);
  assert.equal(capture.metadata.answer_count, 1);
});
