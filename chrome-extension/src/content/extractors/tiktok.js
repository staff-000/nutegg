function detectTikTok() { const r = NutEggSocial.route(); return r?.platform === 'tiktok' && !!r.id; }
async function extractTikTok(context) { return NutEggSocial.capture(context); }
