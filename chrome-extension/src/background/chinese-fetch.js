// Allowlisted read-only API/subtitle bridge for isolated content scripts.
function chineseFetchAllowed(raw, senderUrl) {
  try {
    const url = new URL(raw);
    const sender = new URL(senderUrl);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return false;
    const belongs = (host, domain) => host === domain || host.endsWith(`.${domain}`);
    if (belongs(sender.hostname, 'bilibili.com')) {
      return (url.hostname === 'api.bilibili.com' &&
        ['/x/web-interface/view', '/x/player/v2', '/x/player/wbi/v2'].includes(url.pathname)) ||
        (belongs(url.hostname, 'hdslb.com') && /\/bfs\/(?:ai_subtitle|subtitle)\//.test(url.pathname));
    }
    if (belongs(sender.hostname, 'douyin.com')) {
      return ['douyin.com', 'douyinvod.com', 'bytecdn.cn', 'ibytedtos.com', 'bytedance.com']
        .some(domain => belongs(url.hostname, domain));
    }
  } catch {}
  return false;
}
const chineseCaptureRequests = new Map();
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const requestKey = sender.tab && message.requestId ? `${sender.tab.id}:${sender.frameId || 0}:${sender.documentId || ''}:${message.requestId}` : null;
  if (message.action === 'chinese-content-cancel') {
    if (requestKey) for (const controller of chineseCaptureRequests.get(requestKey) || []) controller.abort();
    sendResponse({ success: true });
    return false;
  }
  if (message.action !== 'chinese-content-fetch') return false;
  if (!sender.tab || !chineseFetchAllowed(message.url, sender.url)) {
    sendResponse({ success: false, error: 'Unsupported content URL' });
    return false;
  }
  const controller = new AbortController();
  if (requestKey) {
    if (!chineseCaptureRequests.has(requestKey)) chineseCaptureRequests.set(requestKey, new Set());
    chineseCaptureRequests.get(requestKey).add(controller);
  }
  const timer = setTimeout(() => controller.abort(), Math.max(1, Math.min(4000, (message.deadline || Infinity) - Date.now())));
  fetch(message.url, { credentials: new URL(message.url).hostname === 'api.bilibili.com' ? 'include' : 'omit',
    signal: controller.signal, redirect: 'error' })
    .then(async response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      // Bound responses: this bridge is for text, never video downloads.
      const reader = response.body.getReader();
      const chunks = [];
      let size = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 2 * 1024 * 1024) { await reader.cancel(); throw new Error('Content too large'); }
        chunks.push(value);
      }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
      sendResponse({ success: true, text: new TextDecoder().decode(bytes) });
    })
    .catch(error => sendResponse({ success: false, error: error.message }))
    .finally(() => {
      clearTimeout(timer);
      if (requestKey) {
        const requests = chineseCaptureRequests.get(requestKey);
        requests?.delete(controller);
        if (!requests?.size) chineseCaptureRequests.delete(requestKey);
      }
    });
  return true;
});
