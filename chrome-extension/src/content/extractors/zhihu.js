// NutEgg zhihu extractor.
// Classic isolated-world script; see docs/content-extractor-contributing.md.
function detectZhihu() {
  return (
    chineseHost('zhihu.com') &&
    /^\/(?:question\/\d+(?:\/answer\/\d+)?|answer\/\d+|p\/\d+)\/?$/.test(new URL(window.location.href).pathname)
  );
}

async function extractZhihu() {
  const url = new URL(window.location.href);
  const answerId = url.pathname.match(/\/answer\/(\d+)/)?.[1];
  const title = chineseText('h1.QuestionHeader-title, h1.Post-Title') || getMeta('og:title') || document.title;
  const parts = [`# ${title}`];
  const question = document.querySelector('.QuestionRichText');
  if (question) parts.push(extractText(question));
  const states = chinesePageStates();
  let answers = Array.from(document.querySelectorAll('.AnswerItem'));
  if (answerId)
    answers = answers.filter(item => {
      try {
        return (
          String(JSON.parse(item.getAttribute('data-zop') || '{}').itemId) === answerId ||
          !!item.querySelector(`a[href$="/answer/${answerId}"], meta[itemprop="url"][content$="/answer/${answerId}"]`)
        );
      } catch {
        return false;
      }
    });
  let capturedAnswers = 0;
  const discussionAnswers = [];
  for (const answer of answers) {
    const body = answer.querySelector('.RichContent-inner .RichText, .RichText');
    if (!body) continue;
    const author = chineseText('.AuthorInfo-name', answer);
    let full = null;
    const itemId = (() => {
      try {
        return JSON.parse(answer.getAttribute('data-zop') || '{}').itemId;
      } catch {
        return null;
      }
    })();
    for (const state of states) {
      full = chineseFind(
        state,
        item => String(item.id) === String(itemId) && typeof item.content === 'string' && item.author
      );
      if (full) break;
    }
    const answerText = full ? chineseHtmlText(full.content) : extractText(body);
    if (answerId) parts.push(`## ${author || full?.author?.name || 'Answer'}\n\n${answerText}`);
    else
      discussionAnswers.push({
        id: `zhihu:answer-${itemId || capturedAnswers}`,
        text: answerText,
        author: author || full?.author?.name || undefined,
        authorId: full?.author?.url_token
          ? `https://www.zhihu.com/people/${full.author.url_token}`
          : answer.querySelector('.AuthorInfo-name a, a.UserLink-link')?.href,
        url: itemId
          ? `https://www.zhihu.com/question/${url.pathname.match(/question\/(\d+)/)?.[1]}/answer/${itemId}`
          : undefined,
        reaction: { kind: 'likes', count: Number.isFinite(full?.voteup_count) ? full.voteup_count : null },
      });
    capturedAnswers++;
  }
  // A permalink can hydrate before its AnswerItem renders.
  if (answerId && !capturedAnswers) {
    for (const state of states) {
      const full = chineseFind(
        state,
        item => String(item.id) === answerId && typeof item.content === 'string' && item.author
      );
      if (full) {
        parts.push(`## ${full.author.name || 'Answer'}\n\n${chineseHtmlText(full.content)}`);
        capturedAnswers++;
        break;
      }
    }
  }
  const article = document.querySelector('.Post-RichTextContainer, .Post-RichText');
  if (article) parts.push(extractText(article));
  if ((answerId && !capturedAnswers) || (parts.length === 1 && !document.querySelector('h1.QuestionHeader-title')))
    throw new Error('Zhihu content is unavailable');
  return {
    url: url.href,
    title,
    content: truncate(parts.join('\n\n'), 100000),
    sourceType: 'zhihu',
    ...(!answerId && !article
      ? {
          discussion: {
            kind: 'forum',
            status: discussionAnswers.length ? 'partial' : 'not_loaded',
            items: discussionAnswers,
          },
        }
      : {}),
    metadata: {
      platform: 'zhihu',
      author: chineseText('.Post-Author .AuthorInfo-name'),
      answer_count: capturedAnswers,
      capture_scope: answerId ? 'answer' : article ? 'article' : 'question_and_loaded_answers',
    },
  };
}
