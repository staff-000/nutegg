export interface VideoIdentity {
  platform: "youtube" | "bilibili";
  id: string;
  canonicalUrl: string;
}

/** Recognize video identities locally; tracking and playback position do not identify content. */
export function getVideoIdentity(url: string): VideoIdentity | null {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    const host = u.hostname.toLowerCase();
    const segments = u.pathname.split("/").filter(Boolean);
    const youtube = ["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com"];
    let id: string | null = null;
    if (youtube.includes(host)) {
      if (segments[0] === "watch" && segments.length === 1) id = u.searchParams.get("v");
      else if (["shorts", "live", "embed", "v"].includes(segments[0])) id = segments[1];
    } else if (host === "youtu.be" || host === "www.youtu.be") id = segments[0];
    else if (["youtube-nocookie.com", "www.youtube-nocookie.com"].includes(host) && segments[0] === "embed") id = segments[1];
    if (id && /^[A-Za-z0-9_-]{11}$/.test(id)) return { platform: "youtube", id, canonicalUrl: `https://www.youtube.com/watch?v=${id}` };

    if (["bilibili.com", "www.bilibili.com", "m.bilibili.com", "player.bilibili.com"].includes(host)) {
      id = segments[0] === "video" ? segments[1] : u.searchParams.get("bvid");
      if (id && /^BV[A-Za-z0-9]{10}$/.test(id)) {
        // Multipart videos share a bvid but have different transcripts. Missing p means part 1.
        const part = Number(u.searchParams.get("p") || (host === "player.bilibili.com" ? u.searchParams.get("page") : null) || 1);
        return { platform: "bilibili", id, canonicalUrl: `https://www.bilibili.com/video/${id}${Number.isSafeInteger(part) && part > 1 ? `?p=${part}` : ""}` };
      }
    }
  } catch {}
  return null;
}

/** Stable archive/history key; capture payloads keep the original URL for source navigation. */
export function normalizeContentUrl(url: string): string {
  const video = getVideoIdentity(url);
  if (video) return video.canonicalUrl;
  try {
    const u = new URL(url);
    u.hash = "";
    if (["twitter.com", "www.twitter.com", "mobile.twitter.com", "x.com", "www.x.com"].includes(u.hostname.toLowerCase())) {
      u.hostname = "x.com";
      if (/\/status\/\d+/.test(u.pathname)) {
        u.search = "";
        return u.toString().replace(/\/$/, "");
      }
    }
    for (const param of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ref", "source", "fbclid", "gclid", "si", "pp", "feature", "spm"]) u.searchParams.delete(param);
    u.searchParams.sort();
    return u.toString().replace(/\/$/, "");
  } catch {
    return url.replace(/#.*$/, "").replace(/\/$/, "");
  }
}
