import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, chmod, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { request as httpRequest } from 'node:http';
import { SubscriptionService } from '../src/subscription-service';
import { ConnectionAccess, NUTEGG_CHROME_ORIGIN } from '../src/connection-access';
import { NutEggServer } from '../src/server';
import { makeFakePlugin } from './helpers';

const origin = `chrome-extension://${'a'.repeat(32)}`;
const nonce = 'b'.repeat(64);
const flush = () => new Promise(resolve => setImmediate(resolve));

test('approval is origin-bound, single-use, and saves no provider credentials', async () => {
  let approve; let saved = 0;
  const clients = {};
  const access = new ConnectionAccess(clients, () => new Promise(resolve => { approve = resolve; }), async () => { saved++; });
  assert.deepEqual(access.start(origin, nonce), { state: 'pending' });
  assert.equal(access.authorized(origin, 'Bearer wrong'), false);
  assert.throws(() => access.finish(`chrome-extension://${'c'.repeat(32)}`, nonce));
  approve(true); await flush();
  const result = access.finish(origin, nonce);
  assert.match(result.credential, /^[a-f0-9]{64}$/); assert.equal(saved, 1);
  assert.equal(access.authorized(origin, `Bearer ${result.credential}`), true);
  assert.equal(access.authorized('https://evil.example', `Bearer ${result.credential}`), false);
  assert.throws(() => access.finish(origin, nonce));
});

test('denied and expired challenges cannot authorize an extension', async t => {
  const access = new ConnectionAccess({}, async () => false, async () => {});
  access.start(origin, nonce); await flush();
  assert.deepEqual(access.finish(origin, nonce), { state: 'denied' });
  assert.equal(access.authorized(origin, 'Bearer anything'), false);
  const stalled = new ConnectionAccess({}, () => new Promise(() => {}), async () => {});
  t.mock.timers.enable({ apis: ['Date'], now: 0 });
  stalled.start(origin, nonce); t.mock.timers.tick(120001);
  assert.throws(() => stalled.finish(origin, nonce));
});

test('published NutEgg and previously approved development origins connect without another prompt', async () => {
  for (const trustedOrigin of [NUTEGG_CHROME_ORIGIN, origin]) {
    let prompts = 0, saves = 0;
    const clients = trustedOrigin === origin ? { [origin]: 'previous-credential' } : {};
    const access = new ConnectionAccess(clients, async () => { prompts++; return false; }, async () => { saves++; });
    access.start(trustedOrigin, nonce, trustedOrigin); await flush();
    const result = access.finish(trustedOrigin, nonce);
    assert.equal(result.state, 'approved');
    assert.equal(prompts, 0); assert.equal(saves, 1);
    assert.equal(access.authorized(trustedOrigin, `Bearer ${result.credential}`), true);
    assert.equal(access.authorized(trustedOrigin, undefined), false);
  }
});

test('ConnectionAccess supports multiple concurrent connections for the same origin', async () => {
  const clients: Record<string, string | string[]> = {};
  const access = new ConnectionAccess(clients, async () => false, async () => {});
  const nonce1 = '1'.repeat(64);
  const nonce2 = '2'.repeat(64);
  access.start(NUTEGG_CHROME_ORIGIN, nonce1, NUTEGG_CHROME_ORIGIN); await flush();
  const res1 = access.finish(NUTEGG_CHROME_ORIGIN, nonce1);
  assert.equal(res1.state, 'approved');

  access.start(NUTEGG_CHROME_ORIGIN, nonce2, NUTEGG_CHROME_ORIGIN); await flush();
  const res2 = access.finish(NUTEGG_CHROME_ORIGIN, nonce2);
  assert.equal(res2.state, 'approved');

  // Both credentials are concurrently authorized
  assert.equal(access.authorized(NUTEGG_CHROME_ORIGIN, `Bearer ${res1.credential}`), true);
  assert.equal(access.authorized(NUTEGG_CHROME_ORIGIN, `Bearer ${res2.credential}`), true);

  // Backward compatibility with legacy string client mapping
  const legacyOrigin = `chrome-extension://${'b'.repeat(32)}`;
  const legacyClients: Record<string, string | string[]> = { [legacyOrigin]: 'legacy-token' };
  const legacyAccess = new ConnectionAccess(legacyClients, async () => false, async () => {});
  assert.equal(legacyAccess.authorized(legacyOrigin, 'Bearer legacy-token'), true);
});


test('identity headers alone and unknown browser extension origins cannot silently gain access', async () => {
  for (const [claimed, native] of [[NUTEGG_CHROME_ORIGIN, undefined], [origin, undefined], [origin, origin], [NUTEGG_CHROME_ORIGIN, origin]]) {
    let prompts = 0;
    const access = new ConnectionAccess({}, async () => { prompts++; return false; }, async () => {});
    access.start(claimed!, nonce, native); await flush();
    assert.equal(access.finish(claimed!, nonce).state, 'denied');
    assert.equal(prompts, 1);
  }
});

test('HTTP automatic connection requires the native NutEgg Origin and still authenticates protected requests', async t => {
  const plugin = makeFakePlugin(); let prompts = 0;
  plugin.connectionAccess = new ConnectionAccess({}, async () => { prompts++; return false; }, async () => {});
  const server = new NutEggServer(plugin, 0); await server.start();
  const native = server['server'];
  t.after(async () => { native.closeAllConnections(); await server.stop(); });
  const url = `http://127.0.0.1:${native.address().port}`;
  const headers = { 'Content-Type': 'application/json', 'X-NutEgg-Extension-Origin': NUTEGG_CHROME_ORIGIN };
  const exchange = async (path: string, challenge: string, withOrigin: boolean) => {
    const response = await fetch(url + '/connection/' + path, { method: 'POST',
      headers: { ...headers, ...(withOrigin ? { Origin: NUTEGG_CHROME_ORIGIN } : {}) }, body: JSON.stringify({ nonce: challenge }) });
    assert.equal(response.status, 200); return response.json();
  };
  assert.equal((await fetch(url + '/metrics', { headers })).status, 401);
  await exchange('start', nonce, true); await flush();
  const approved = await exchange('finish', nonce, true);
  assert.equal(approved.state, 'approved'); assert.equal(prompts, 0);
  assert.equal((await fetch(url + '/metrics', { headers: { ...headers, Authorization: `Bearer ${approved.credential}` } })).status, 200);
  await exchange('start', 'c'.repeat(64), false); await flush();
  assert.equal((await exchange('finish', 'c'.repeat(64), false)).state, 'denied');
  assert.equal(prompts, 1);
});

test('local server rejects unauthorized process launch and config writes before dispatch', async t => {
  const plugin = makeFakePlugin(); let calls = 0;
  plugin.settings.subscriptionEnabled = true;
  plugin.connectionAccess = new ConnectionAccess({ [origin]: 'secret' }, async () => false, async () => {});
  plugin.subscriptions = { status: async () => { calls++; return { state: 'ready' }; } };
  const server = new NutEggServer(plugin, 0);
  await server.start();
  const native = server['server'];
  t.after(async () => { native.closeAllConnections(); await server.stop(); });
  const url = `http://127.0.0.1:${native.address().port}`;
  const request = (path, headers = {}) => fetch(url + path, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ provider: 'openai' }) });
  for (const path of ['/ai-config', '/analyze', '/ask', '/subscription/login/start', '/subscription/test']) {
    assert.equal((await request(path)).status, 401);
  }
  assert.equal((await request('/subscription/status', { Origin: 'https://evil.example', Authorization: 'Bearer secret' })).status, 403);
  const invalidHost = await new Promise(resolve => {
    const req = httpRequest(url + '/subscription/status', { method: 'POST', headers: { Host: 'evil.example', Origin: origin, Authorization: 'Bearer secret' } }, res => { res.resume(); resolve(res.statusCode); });
    req.end();
  });
  assert.equal(invalidHost, 403);
  assert.equal((await request('/subscription/status', { Authorization: 'Bearer secret' })).status, 200);
  assert.equal(calls, 1);
  // Chrome's authenticated GET requests may have no browser-generated Origin.
  const headers = { 'X-NutEgg-Extension-Origin': origin, Authorization: 'Bearer secret' };
  assert.equal((await fetch(url + '/metrics', { headers })).status, 200);
  assert.equal((await fetch(url + '/metrics', { headers: { 'X-NutEgg-Extension-Origin': origin } })).status, 401);
  assert.equal((await fetch(url + '/metrics', { headers: { ...headers, Origin: 'https://evil.example' } })).status, 403);
  assert.equal((await fetch(url + '/metrics', { headers: { ...headers, Origin: `chrome-extension://${'c'.repeat(32)}` } })).status, 403);
  assert.equal((await fetch(url + '/metrics', { headers: { ...headers, 'X-NutEgg-Extension-Origin': `chrome-extension://${'c'.repeat(32)}` } })).status, 401);
  plugin.settings.subscriptionEnabled = false;
  for (const path of ['/subscription/status', '/subscription/login/start', '/subscription/test']) assert.equal((await request(path, { Authorization: 'Bearer secret' })).status, 403);
  assert.equal(calls, 1);
});

async function fixture(t, body: string) {
  const directory = await mkdtemp(join(tmpdir(), 'nutegg-service-test-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const command = join(directory, 'cli');
  await writeFile(command, `#!${process.execPath}\n${body}`); await chmod(command, 0o700);
  const service = new SubscriptionService({ openai: command, gemini: command }, () => true);
  service['codexUsage'] = async () => ({ exhausted: false });
  t.after(() => service.dispose());
  return { service, command, directory };
}

test('Gemini status never generates inference or claims a verified login', async t => {
  const { service } = await fixture(t, 'throw new Error("Must not run inference")');
  assert.equal((await service.status('gemini')).state, 'unverified');
});

test('Codex model discovery is non-generating and preserves cache on failure', async t => {
  const { service, command } = await fixture(t, `
const readline = require('node:readline');
readline.createInterface({ input: process.stdin }).on('line', line => {
  const m = JSON.parse(line);
  if (m.method === 'initialize') console.log(JSON.stringify({ id: m.id, result: {} }));
  if (m.method === 'model/list') console.log(JSON.stringify({ id: m.id, result: { data: [{ model: 'account-model' }] } }));
});`);
  assert.deepEqual(await service.models('openai'), ['auto', 'account-model']);
  await writeFile(command, `#!${process.execPath}\nprocess.exit(1);`);
  assert.deepEqual(await service.models('openai'), ['auto', 'account-model']);
});

test('subscription requests serialize; quota failure does not block the next job', async t => {
  const counter = join(tmpdir(), `nutegg-count-${process.pid}-${Date.now()}`);
  t.after(() => rm(counter, { force: true }));
  const { service } = await fixture(t, `
const fs = require('node:fs');
if (process.argv.includes('status')) { console.error('Logged in using ChatGPT'); process.exit(0); }
let input=''; process.stdin.on('data', c => input+=c); process.stdin.on('end', () => {
  const path=${JSON.stringify(counter)};
  let n=0; try { n=Number(fs.readFileSync(path,'utf8')); } catch {}
  fs.writeFileSync(path,String(n+1));
  setTimeout(() => {
    if (!n) { console.error('quota exhausted'); process.exit(1); }
    console.log(JSON.stringify({type:'item.completed',item:{type:'agent_message',text:'OK'}}));
    console.log(JSON.stringify({type:'turn.completed'}));
  }, 25);
});`);
  const results = await Promise.allSettled([service.chat('openai', 'auto', 'first'), service.chat('openai', 'custom', 'second')]);
  assert.equal(results[0].status, 'rejected');
  assert.equal(results[0].reason.code, 'quota_exceeded');
  assert.equal(results[1].value, 'OK');
  assert.equal((await service.status('openai')).state, 'ready');
});

test('unload cancels running and queued inference and rejects later work', async t => {
  const marker = join(tmpdir(), `nutegg-running-${process.pid}-${Date.now()}`);
  t.after(() => rm(marker, { force: true }));
  const { service } = await fixture(t, `
if (process.argv.includes('status')) { console.error('Logged in using ChatGPT'); process.exit(0); }
require('node:fs').writeFileSync(${JSON.stringify(marker)}, 'started'); setInterval(()=>{},1000);`);
  const running = service.chat('openai', 'auto', 'first');
  const queued = service.chat('openai', 'auto', 'second');
  const results = Promise.allSettled([running, queued]);
  for (let i=0; i<100; i++) { try { await readFile(marker); break; } catch { await new Promise(resolve => setTimeout(resolve, 10)); } }
  await service.dispose();
  assert((await results).every(result => result.status === 'rejected'));
  await assert.rejects(service.chat('openai', 'auto', 'third'), /stopped/);
});


test('concurrent login clicks reuse one operation; cancellation prevents terminal launch', async t => {
  const { service, command } = await fixture(t, 'process.exit(0)');
  let resolvePath;
  service['resolve'] = () => new Promise(resolve => { resolvePath = resolve; });
  const first = service.startLogin('openai');
  const repeated = service.startLogin('openai');
  assert.equal(first, repeated);
  await service.cancelLogin('openai');
  resolvePath(command);
  await assert.rejects(first, /cancelled/);
  assert.equal(service['logins'].size, 0);
});

test('expired previously verified authentication is an error, not initial setup', async t => {
  const { service, command } = await fixture(t, "console.error('Logged in using ChatGPT');");
  assert.equal((await service.status('openai')).state, 'ready');
  await writeFile(command, `#!${process.execPath}\nconsole.error('Not logged in'); process.exit(1);`);
  assert.equal((await service.status('openai')).state, 'error');
});


test('subscriptions default off and require an Obsidian-owned enable decision', async t => {
  const service = new SubscriptionService();
  assert.equal((await service.status('openai')).state, 'disabled');
  await assert.rejects(service.chat('openai', 'auto', 'never send'), /AI connection unavailable/);
  await assert.rejects(service.models('openai'), /AI connection unavailable/);
  await assert.rejects(service.startLogin('openai'), /AI connection unavailable/);
  await service.dispose();
});

test('Codex quota status reads account limits without inference and labels both windows', async t => {
  const { service } = await fixture(t, `
if (!process.argv.includes('app-server')) { console.error('Logged in using ChatGPT'); process.exit(0); }
require('node:readline').createInterface({input:process.stdin}).on('line', line => {
 const m=JSON.parse(line);
 if (m.method === 'initialize') console.log(JSON.stringify({id:m.id,result:{}}));
 else if (m.method === 'account/rateLimits/read') console.log(JSON.stringify({id:m.id,result:{rateLimits:{primary:{usedPercent:25,windowDurationMins:300},secondary:{usedPercent:40,windowDurationMins:10080}}}}));
 else if (m.method !== 'initialized') throw new Error('Unexpected generating request');
});`);
  delete service['codexUsage'];
  const status = await service.status('openai');
  assert.equal(status.state, 'ready');
  assert.equal(status.usageRemaining, '75% left (5h) · 60% left (7d)');
});
