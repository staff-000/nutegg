/** Application hash routes identify content; ordinary anchors identify positions. */
export function isApplicationHash(hash: string): boolean {
  return /^#!?\//.test(hash);
}

export function capturePageKey(value: string): string {
  try {
    const url = new URL(value);
    if (!isApplicationHash(url.hash)) url.hash = '';
    return url.href;
  } catch {
    return String(value || '');
  }
}

export function hostMatches(value: string, domain: string): boolean {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return host === domain || host.endsWith(`.${domain}`);
  } catch {
    return false;
  }
}
