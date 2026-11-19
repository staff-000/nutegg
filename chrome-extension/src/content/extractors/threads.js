function detectThreads() { const r = NutEggSocial.route(); return r?.platform === 'threads' && !!r.id; }
async function extractThreads(context) {
  const result = await NutEggSocial.capture(context);
  context?.check();
  const info = NutEggSocial.inspect();
  // Include continuations only with explicit parent identity and same author.
  const included = new Set([info.id]);
  for (const post of NutEggSocial.continuations(info)) {
    result.content += `\n\n${post.text}`;
    included.add(post.id);
  }
  for (const post of document.querySelectorAll('[data-post-id][data-reply-to]')) {
    if (post.closest('[data-nutegg-ui]') || !included.has(post.getAttribute('data-reply-to')) ||
        !info.author || post.getAttribute('data-author') !== info.author) continue;
    const id = post.getAttribute('data-post-id');
    if (included.has(id)) continue;
    const body = post.querySelector('[data-post-text]');
    if (body?.textContent?.trim()) { result.content += `\n\n${body.textContent.trim()}`; included.add(id); }
  }
  const quote = info.root?.querySelector('[data-quoted-post]');
  if (quote && !quote.closest('[data-nutegg-ui]')) {
    const author = quote.getAttribute('data-author') || '';
    const text = quote.querySelector('[data-post-text]')?.textContent?.trim();
    if (text) result.content += `\n\n> ${author ? author + ': ' : ''}${text.replace(/\n/g, '\n> ')}`;
  }
  if (result.content.length > 60000) {
    result.captureCoverage = { reasons: ['truncated'], originalCharacters: result.content.length, capturedCharacters: 60000 };
    result.content = result.content.slice(0, 60000);
  }
  return result;
}
