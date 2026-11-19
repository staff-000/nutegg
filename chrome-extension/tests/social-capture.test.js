const test = require('node:test');
const assert = require('node:assert/strict');
const { createExtractorPage } = require('./helpers/extractor-harness');
const Rules = require('../src/panel/rules');
const state = data => `<script type="application/json">${JSON.stringify(data)}</script>`;
const urls = {
  tiktok: 'https://www.tiktok.com/@alice/video/123', douyin: 'https://www.douyin.com/video/123',
  instagram: 'https://www.instagram.com/reel/ABC/', threads: 'https://www.threads.com/@alice/post/ABC', twitter: 'https://x.com/alice/status/123',
};
for (const [platform, url] of Object.entries(urls)) test(`${platform}: owned video duration, captions and metadata exclude other posts`, async t => {
  const id = platform === 'instagram' || platform === 'threads' ? { code: 'ABC' } : platform === 'douyin' ? { aweme_id: '123' } : { id: '123' };
  const data = { ...id, desc: 'Primary body', author: { nickname: 'Alice' }, createTime: 1700000000,
    video: { duration: platform === 'douyin' ? 181000 : 181, subtitleInfos: [{ Url: 'https://captions.example/owned.vtt' }] } };
  const page = createExtractorPage(t, { url, html: state([{ ...data, ...('code' in id ? { code: 'OTHER' } : 'aweme_id' in id ? { aweme_id: '999' } : { id: '999' }), desc: 'Unrelated' }, data]),
    fetch: async () => ({ ok: true, status: 200, text: async () => 'WEBVTT\n\n00:01.000 --> 00:03.000\nOwned caption' }) });
  const info = page.win.NutEggSocial.inspect();
  assert.equal(info.videoDurationSeconds, 181);
  assert.equal(info.mediaKind, 'video');
  assert.equal(page.requests.length, 0, 'passive inspection never fetches captions');
  const capture = await page.win.NutEggSocial.capture(page.context());
  assert.equal(capture.metadata.author, 'Alice');
  assert.equal(capture.transcriptAvailable, true);
  assert.match(capture.content, /Owned caption/);
  assert.doesNotMatch(capture.content, /Unrelated/);
  assert.equal(capture.metadata.video_duration_seconds, 181);
});

test('Instagram mixed carousel uses longest individual video and missing captions remain explicit', async t => {
  const page = createExtractorPage(t, { url: 'https://www.instagram.com/p/ABC/', html: state({ shortcode:'ABC', caption:{text:'Carousel'},
    owner:{username:'alice'}, carousel_media:[{media_type:1},{media_type:2,video_duration:90},{media_type:2,video_duration:100}] }) });
  const info = page.win.NutEggSocial.inspect();
  assert.equal(info.mediaKind, 'video'); assert.equal(info.videoDurationSeconds, 100);
  const capture = await page.win.extractInstagram(page.context());
  assert.equal(capture.transcriptAvailable, false);
  assert.equal(capture.extractionStatus, 'ready');
  assert.match(capture.content, /Carousel/);
  assert.equal(Rules.decide(Rules.normalize(), {url:page.win.location.href,mediaKind:info.mediaKind,videoDurationSeconds:info.videoDurationSeconds}).open, false);
});

test('Threads captures text, attributable continuation and quote, excluding replies and unrelated videos', async t => {
  const page = createExtractorPage(t, { url: urls.threads, html: `<article data-post-id="ABC" data-author="Alice"><a href="/@alice/post/ABC"><time datetime="2026-01-01"></time></a><div data-post-text>Primary idea</div><aside data-quoted-post data-author="Bob"><div data-post-text>Quoted idea</div><video></video></aside></article>
    <article data-post-id="DEF" data-reply-to="ABC" data-author="Alice"><div data-post-text>Continuation</div></article>
    <article data-post-id="GHI" data-reply-to="ABC" data-author="Someone else"><div data-post-text>Other reply</div><video></video></article><div data-nutegg-ui>NutEgg noise</div>` });
  const info = page.win.NutEggSocial.inspect();
  assert.equal(info.mediaKind, 'text'); assert.equal(info.videoDurationSeconds,null);
  const capture = await page.win.extractThreads(page.context());
  assert.match(capture.content,/Primary idea/); assert.match(capture.content,/Continuation/); assert.match(capture.content,/> Bob: Quoted idea/);
  assert.doesNotMatch(capture.content,/Other reply|NutEgg noise/);
  assert.equal(capture.metadata.author,'Alice');
});

test('text/photo posts open but unknown media and login shells do not', async t => {
  const page = createExtractorPage(t, { url:'https://www.tiktok.com/@alice/photo/123', html:state({id:'123',desc:'Photos',imagePost:{images:[{},{}]},author:{nickname:'Alice'}}) });
  const capture = await page.win.extractTikTok(page.context());
  assert.equal(capture.mediaType,'article'); assert.equal(capture.transcriptAvailable,undefined);
  assert.equal(capture.metadata.image_count,2);
  const login = createExtractorPage(t,{url:urls.instagram,html:'<form action="/login"><input type="password"></form>'});
  const result = await login.win.extractInstagram(login.context());
  assert.equal(result.extractionStatus,'unavailable');
  assert.deepEqual(Array.from(result.captureCoverage.reasons),['access_restricted']);
});

test('delayed hydration waits, navigation and cancellation stop capture', async t => {
  const page = createExtractorPage(t,{url:urls.tiktok,html:'<main></main>'});
  const pending = page.win.extractTikTok(page.context());
  setTimeout(()=>{page.win.document.body.innerHTML=state({id:'123',desc:'Hydrated',video:{duration:190}})},80);
  assert.match((await pending).content,/Hydrated/);
  for (const action of ['cancel','navigate']) {
    const other = createExtractorPage(t,{url:urls.instagram,html:'<main></main>'});
    const context = other.context();
    const capture = other.win.extractInstagram(context);
    if(action==='cancel') context.abort('cancelled'); else other.navigate('https://www.instagram.com/reel/OTHER/');
    await assert.rejects(capture);
  }
});

test('owned playback selects the requested post video, not quoted or recommended video', t => {
  const page=createExtractorPage(t,{url:urls.twitter,html:'<article data-testid="tweet"><a href="/alice/status/123"><time></time></a><div data-testid="tweetText">Post</div><div role="link"><video id="quote"></video></div><video id="owned"></video></article><video id="recommendation"></video>'});
  const video=page.win.document.querySelector('#owned');Object.defineProperty(video,'duration',{value:181});
  assert.equal(page.win.nuteggPlaybackPlayer(),video);
  assert.equal(page.win.NutEggSocial.inspect().videoDurationSeconds,181);
});

test('reinjection adds new social extractors to an older production registry without duplicating listeners', t => {
  const page=createExtractorPage(t,{url:urls.threads,html:state({code:'ABC',caption:{text:'Post'},media_type:1})});
  const count=page.listeners.length;
  page.win.EXTRACTORS=page.win.EXTRACTORS.filter(e=>!['threads','instagram'].includes(e.name));
  page.load('src/content/content-script.js');
  assert.equal(page.win.EXTRACTORS.filter(e=>e.name==='threads').length,1);
  assert.equal(page.win.EXTRACTORS.filter(e=>e.name==='instagram').length,1);
  assert.equal(page.listeners.length,count);
});

test('social detectors reject lookalike domains, unsupported routes and query-string impostors', t => {
  for (const url of ['https://threads.com.evil.test/@alice/post/ABC','https://instagram.com/alice','https://tiktok.com/search?q=/@alice/video/123','https://example.com/?q=https://threads.com/@alice/post/ABC']) {
    const page=createExtractorPage(t,{url});
    assert.equal(page.win.detectThreads(),false);assert.equal(page.win.detectInstagram(),false);assert.equal(page.win.detectTikTok(),false);
  }
});

test('nested serialized Douyin state and live duration are handled without fetching', t => {
  const page=createExtractorPage(t,{url:urls.douyin,html:state({app:{payload:JSON.stringify({aweme_id:'123',desc:'Nested',is_live:true,video:{duration:190000}})}})});
  const info=page.win.NutEggSocial.inspect();
  assert.equal(info.description,'Nested');assert.equal(info.mediaKind,'video');assert.equal(info.videoDurationSeconds,null);
  assert.equal(page.requests.length,0);
});

test('caption downloads are aborted on navigation and captures remain isolated across tabs', async t => {
  let started;
  const waiting=new Promise(resolve=>started=resolve);
  let transportSignal;
  const first=createExtractorPage(t,{url:urls.tiktok,html:state({id:'123',desc:'First',video:{duration:190,subtitleInfos:[{Url:'https://captions.example/a.vtt'}]}}),
    fetch:async(_url,init)=>{transportSignal=init.signal;started();return new Promise((_,reject)=>init.signal.addEventListener('abort',()=>reject(new Error('Aborted')),{once:true}))}});
  const second=createExtractorPage(t,{url:'https://www.tiktok.com/@other/photo/456',html:state({id:'456',desc:'Second',imagePost:{images:[{}]}})});
  const pending=first.capture({requestId:'owned-captions'});
  await waiting;
  first.navigate('https://www.tiktok.com/@other/video/789');
  const aborted=await pending;
  assert.equal(aborted.success,false);
  assert.equal(aborted.errorCode,'stale');
  assert.equal(transportSignal.aborted,true);
  const capture=await second.win.extractTikTok(second.context());
  assert.equal(capture.metadata.post_id,'456');assert.match(capture.content,/Second/);assert.doesNotMatch(capture.content,/First/);
});

test('production dispatcher selects all five platforms and retains missing-caption flags', async t => {
  const data = {
    tiktok: {id:'123',desc:'TikTok primary',video:{duration:181}},
    douyin: {aweme_id:'123',desc:'Douyin primary',video:{duration:181000}},
    instagram: {shortcode:'ABC',caption:{text:'Instagram primary'},is_video:true,video_duration:181},
    threads: {code:'ABC',caption:{text:'Threads primary'},media_type:1},
    twitter: {id_str:'123',full_text:'X primary',user:{name:'Alice'},extended_entities:{media:[{type:'video',video_info:{duration_millis:181000}}]}},
  };
  for(const platform of Object.keys(urls)) {
    const html=(platform==='twitter'?'<article data-testid="tweet"><a href="/alice/status/123"><time></time></a><div data-testid="tweetText">X primary</div></article>':'')+
      (platform==='douyin'?`<script id="RENDER_DATA">${encodeURIComponent(JSON.stringify(data[platform]))}</script>`:state(data[platform]));
    const page=createExtractorPage(t,{url:urls[platform],html});
    const response=await page.capture();
    assert.equal(response.success,true,platform);
    assert.equal(response.content.sourceType,platform);
    if(platform!=='threads')assert.equal(response.content.transcriptAvailable,false);
    if(platform==='twitter')assert.match(response.content.metadata.author,/^alice$/i);
  }
});

test('Threads serialized thread groups include same-author continuations but not a separate group or replies', async t => {
  const post=(code,author,text)=>({code,media_type:1,user:{pk:author,username:author},caption:{text}});
  const page=createExtractorPage(t,{url:urls.threads,html:state({groups:[
    {thread_items:[{post:post('ABC','alice','Primary')},{post:post('DEF','alice','Connected')},{post:post('GHI','bob','Other reply')}]},
    {thread_items:[{post:post('ZZZ','alice','Unrelated same author')}]},
  ]})});
  const capture=await page.win.extractThreads(page.context());
  assert.match(capture.content,/Connected/);assert.doesNotMatch(capture.content,/Other reply|Unrelated same author/);
});
