// NutEgg douyin extractor.
// Classic isolated-world script; see docs/content-extractor-contributing.md.
function detectDouyin() {
  const url = new URL(window.location.href);
  return (
    chineseHost('douyin.com') && !!(url.pathname.match(/\/(?:video|note)\/\d+/) || url.searchParams.get('modal_id'))
  );
}

async function extractDouyin(context) {
  const url = new URL(window.location.href);
  const id = url.pathname.match(/\/(?:video|note)\/(\d+)/)?.[1] || url.searchParams.get('modal_id');
  let detail = null;
  for (const state of chinesePageStates()) {
    detail = chineseFind(state, item => String(item.aweme_id || item.awemeId) === id && (item.desc || item.video));
    if (detail) break;
  }
  if (!detail) {
    const request = performance
      .getEntriesByType('resource')
      .map(entry => entry.name)
      .reverse()
      .find(name => {
        try {
          const u = new URL(name);
          return (
            u.origin === url.origin &&
            u.pathname === '/aweme/v1/web/aweme/detail/' &&
            u.searchParams.get('aweme_id') === id
          );
        } catch {
          return false;
        }
      });
    try {
      detail = (
        await chineseFetch(request || `${url.origin}/aweme/v1/web/aweme/detail/?aweme_id=${id}&aid=6383`, true, context)
      ).aweme_detail;
      if (String(detail?.aweme_id || detail?.awemeId) !== id) detail = null;
    } catch {}
  }
  const tracks = [...(detail?.video?.subtitleInfos || []), ...(detail?.video?.cla_info?.caption_infos || [])];
  for (const sticker of detail?.interaction_stickers || []) {
    tracks.push(...(sticker.auto_video_caption_info?.auto_captions || []).map(track => ({ ...track, source: 'ai' })));
  }
  const transcript = await chineseSubtitles(tracks, { context });
  const description = detail?.desc || getMeta('og:description') || '';
  const title = description || getMeta('og:title') || document.title;
  if (detail?.images?.length || url.pathname.startsWith('/note/')) {
    return {
      url: url.href,
      title,
      content: `# ${title}\n\n${description}`,
      sourceType: 'douyin',
      mediaType: 'article',
      metadata: {
        platform: 'douyin',
        author: detail?.author?.nickname || '',
        image_count: detail?.images?.length || 0,
      },
    };
  }
  return chineseVideoResult(
    'douyin',
    title,
    description,
    detail?.author?.nickname || '',
    (detail?.video?.duration || 0) / 1000,
    transcript,
    { video_id: id }
  );
}
