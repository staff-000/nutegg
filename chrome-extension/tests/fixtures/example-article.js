function detectExampleArticle() {
  const url = new URL(window.location.href);
  const host = url.hostname;
  return (host === 'example.org' || host.endsWith('.example.org')) && /^\/articles\/[^/]+\/?$/.test(url.pathname);
}

function extractExampleArticle(context) {
  context?.check();
  const container = findCaptureContainer(context);
  const body = captureTextResult(container, context);
  const title = document.querySelector('h1')?.textContent?.trim() || document.title;
  return applyTextCaptureResult({
    url: window.location.href,
    title,
    content: `# ${title}\n\n${body.text}`,
    sourceType: 'webpage',
  }, body);
}
