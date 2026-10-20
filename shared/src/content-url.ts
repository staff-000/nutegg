import { isApplicationHash } from './page-identity';
import { getVideoIdentity } from './video-identity';
export { getVideoIdentity } from './video-identity';
export type { VideoIdentity } from './video-identity';

/** Stable archive/history key; capture payloads keep the original URL for source navigation. */
export function normalizeContentUrl(url: string): string {
  const video = getVideoIdentity(url);
  if (video) return video.canonicalUrl;
  try {
    const u = new URL(url);
    if (!isApplicationHash(u.hash)) u.hash = '';
    if (
      ['twitter.com', 'www.twitter.com', 'mobile.twitter.com', 'x.com', 'www.x.com'].includes(u.hostname.toLowerCase())
    ) {
      u.hostname = 'x.com';
      if (/\/status\/\d+/.test(u.pathname)) {
        u.search = '';
        return u.toString().replace(/\/$/, '');
      }
    }
    for (const param of [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_content',
      'utm_term',
      'ref',
      'source',
      'fbclid',
      'gclid',
      'si',
      'pp',
      'feature',
      'spm',
    ])
      u.searchParams.delete(param);
    u.searchParams.sort();
    return u.toString().replace(/\/$/, '');
  } catch {
    return url.replace(/#.*$/, '').replace(/\/$/, '');
  }
}
