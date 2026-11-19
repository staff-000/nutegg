function detectInstagram() { const r = NutEggSocial.route(); return r?.platform === 'instagram' && !!r.id; }
async function extractInstagram(context) { return NutEggSocial.capture(context); }
