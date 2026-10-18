import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, chmod, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { request as httpRequest } from 'node:http';
import { EventEmitter } from 'node:events';
import { SubscriptionService } from '../src/subscription-service';
import { ConnectionAccess, NUTEGG_CHROME_ORIGIN } from '../src/connection-access';
import { NutEggServer } from '../src/server';
import { makeFakePlugin } from './helpers';

const origin = `chrome-extension://${'a'.repeat(32)}`;
const nonce = 'b'.repeat(64);
const flush = () => new Promise(resolve => setImmediate(resolve));

test('connection status counts recent authenticated clients, expires activity, and never exposes credentials', t => {
  t.mock.timers.enable({ apis: ['Date'], now: 1000 });
  const access = new ConnectionAccess({ [origin]: ['private-key-one', 'private-key-two'] }, async () => false, async () => {});
  assert.deepEqual(access.getStatus(), { recentClients: 0, pendingApprovals: 0, conflictingMethods: false });
  access.recordConfiguration(origin, 'Bearer wrong', 'subscription');
  assert.equal(access.getStatus().recentClients, 0);
  access.recordConfiguration(origin, 'Bearer private-key-one', 'subscription');
  t.mock.timers.tick(1000);
  access.recordConfiguration(origin, 'Bearer private-key-two', 'apiKey');
  assert.deepEqual(access.getStatus(), { recentClients: 2, pendingApprovals: 0, conflictingMethods: true });
  assert.doesNotMatch(JSON.stringify(access.getStatus()), /private-key|chrome-extension/);
  t.mock.timers.tick(89000);
  assert.deepEqual(access.getStatus(), { recentClients: 1, pendingApprovals: 0, conflictingMethods: false });
  t.mock.timers.tick(1000);
  assert.equal(access.getStatus().recentClients, 0);
});

test('connection status reports pending approval separately from connected clients', async t => {
  t.mock.timers.enable({ apis: ['Date'], now: 1000 });
  const access = new ConnectionAccess({}, () => new Promise(() => {}), async () => {});
  access.start(origin, nonce);
  assert.deepEqual(access.getStatus(), { recentClients: 0, pendingApprovals: 1, conflictingMethods: false });
  t.mock.timers.tick(120001);
  assert.equal(access.getStatus().pendingApprovals, 0);
});

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
  plugin.settings.aiAuthMethod = 'subscription';
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
  plugin.settings.aiAuthMethod = 'apiKey';
  for (const path of ['/subscription/status', '/subscription/models', '/subscription/login/start', '/subscription/test']) assert.equal((await request(path, { Authorization: 'Bearer secret' })).status, 403);
  assert.equal(calls, 1);
  plugin.settings.aiAuthMethod = 'subscription';
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

test('Codex models settle on the protocol response even when the CLI ignores SIGTERM', { timeout: 3000 }, async t => {
  const { service } = await fixture(t, `
process.on('SIGTERM', () => {});
require('node:readline').createInterface({input:process.stdin}).on('line', line => {
 const m = JSON.parse(line);
 if (m.method === 'initialize') console.log(JSON.stringify({id:m.id,result:{}}));
 if (m.method === 'model/list') console.log(JSON.stringify({id:m.id,result:{data:[{model:'supported-model'}]}}));
});`);
  assert.deepEqual(await service.models('openai'), ['auto', 'supported-model']);
  assert.equal(service.getRuntimeStatus().models, 0);
  assert.equal(service['discovery'].size, 0);
});

test('cancelling a stalled discovery settles it and allows a fresh provider check', { timeout: 3000 }, async t => {
  const { service, command } = await fixture(t, `process.on('SIGTERM', () => {}); setInterval(() => {}, 1000);`);
  const pending = service.models('gemini');
  while (!service['discovery'].size) await flush();
  await service.cancelWork();
  await pending;
  assert.equal(service.getRuntimeStatus().models, 0);
  assert.equal(service['modelTimes'].has('gemini'), false, 'cancelled probes do not create a fresh cache');
  await writeFile(command, `#!${process.execPath}\nconsole.log('gemini-current');`);
  assert.deepEqual(await service.models('gemini'), ['auto', 'gemini-current']);
});

test('model cache avoids repeated discovery on settings refresh but explicit refresh bypasses it', async t => {
  const { service } = await fixture(t, '');
  let discoveries = 0;
  service['discoverModels'] = async () => { discoveries++; return ['auto']; };
  await service.models('gemini');
  // Model lists are much less volatile than account status.
  service['modelTimes'].set('gemini', Date.now() - 120000);
  await service.models('gemini');
  assert.equal(discoveries, 1);
  await service.models('gemini', true);
  assert.equal(discoveries, 2);
});

test('a model discovery timeout settles without waiting for child close', async t => {
  const { service } = await fixture(t, 'setInterval(() => {}, 1000);');
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const pending = service.models('gemini');
  while (!service['discovery'].size) await flush();
  t.mock.timers.tick(10000);
  assert.deepEqual(await pending, ['auto']);
  assert.equal(service.getRuntimeStatus().models, 0);
  assert.equal(service['discovery'].size, 0);
});

test('quota checks are not reported as model discovery', async t => {
  const { service } = await fixture(t, 'setInterval(() => {}, 1000);');
  delete service['codexUsage'];
  const pending = service['codexUsage']();
  while (!service['discovery'].size) await flush();
  assert.equal(service.getRuntimeStatus().models, 0);
  await service.cancelWork();
  await pending;
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


test('switching to API cancels running and queued work and permits subscription reuse later', async t => {
  const marker = join(tmpdir(), `nutegg-api-switch-${process.pid}-${Date.now()}`);
  t.after(() => rm(marker, { force: true }));
  const { service } = await fixture(t, `
if (process.argv.includes('status')) { console.error('Logged in using ChatGPT'); process.exit(0); }
const fs = require('node:fs');
if (!fs.existsSync(${JSON.stringify(marker)})) { fs.writeFileSync(${JSON.stringify(marker)}, 'started'); setInterval(()=>{},1000); }
else { console.log(JSON.stringify({type:'item.completed',item:{type:'agent_message',text:'OK'}})); console.log(JSON.stringify({type:'turn.completed'})); }
`);
  let active = true;
  service['enabled'] = () => active;
  const results = Promise.allSettled([service.chat('openai', 'auto', 'first'), service.chat('openai', 'auto', 'second')]);
  assert.equal(service.getRuntimeStatus().requests, 2);
  for (let i=0; i<100; i++) { try { await readFile(marker); break; } catch { await new Promise(resolve => setTimeout(resolve, 10)); } }
  let loginCanceled = false, discoveryKilled = false;
  service['logins'].set('openai', { id: 'owned-test', state: 'signing_in', command: '', child: { kill() { loginCanceled = true; } } } as any);
  const discovery=new EventEmitter() as any;discovery.exitCode=null;discovery.kill=()=>{discoveryKilled=true;discovery.emit('close');};
  service['discovery'].set(discovery, () => { discovery.kill(); service['discovery'].delete(discovery); });
  active = false;
  await service.cancelWork();
  assert.deepEqual(service.getRuntimeStatus(), { active: false, requests: 0, logins: 0, models: 0 });
  assert((await results).every(result => result.status === 'rejected'));
  assert.equal(loginCanceled, true); assert.equal(discoveryKilled, true);
  assert.equal((await service.status('openai')).state, 'disabled');
  await assert.rejects(service.startLogin('openai'), /unavailable/);
  active = true;
  assert.equal(service.getRuntimeStatus().active, true);
  assert.equal(await service.chat('openai', 'auto', 'resumed'), 'OK');
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
  assert.equal((await service.status('openai',true)).state, 'error');
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

test('an explicit test rejects an unavailable selected model without trying Auto',async()=>{
 const service=new SubscriptionService({},()=>true);const requested:string[]=[];
 service.chat=async(_provider,model)=>{requested.push(model);throw Object.assign(new Error('Choose another model.'),{code:'model_not_found'});};
 await assert.rejects(service.test('openai','rejected-custom'),{code:'model_not_found'});assert.deepEqual(requested,['rejected-custom']);await service.dispose();
});

test('AI diagnostics follow actual CLI queue start and queued cancellation without duplicate calls', async t => {
  const { AIClient } = await import('../src/ai-client');
  const { getAIDebugInfo } = await import('../../shared/src/ai-diagnostics');
  const panel = crypto.randomUUID(), scope = `${panel}:1:1`;
  const marker = join(tmpdir(), `nutegg-ai-start-${process.pid}-${Date.now()}`);
  const gate = marker + '-gate';
  t.after(async () => { await rm(marker, { force: true }); await rm(gate, { force: true }); });
  const { service } = await fixture(t, `
const fs = require('node:fs');
if (process.argv.includes('status')) { console.error('Logged in using ChatGPT'); process.exit(0); }
fs.writeFileSync(${JSON.stringify(marker)}, 'started');
process.stdin.resume(); process.stdin.on('end', () => {
  const timer = setInterval(() => {
    if (!fs.existsSync(${JSON.stringify(gate)})) return;
    clearInterval(timer);
    console.log(JSON.stringify({type:'item.completed',item:{type:'agent_message',text:'OK'}}));
    console.log(JSON.stringify({type:'turn.completed'}));
  }, 10);
});`);
  const settings = { aiProvider: 'openai' as const, aiAuthMethod: 'subscription' as const, aiModel: 'auto' };
  const controller = new AbortController();
  const client = new AIClient(settings, service);
  const cancelledClient = new AIClient(settings, service, controller.signal);
  const jobs = [client.chat('First', 100, scope), client.chat('Second', 100, `${panel}:2:2`), cancelledClient.chat('Third', 100, `${panel}:3:3`)];
  const results = Promise.allSettled(jobs);
  for (let n = 0; n < 100; n++) { try { await readFile(marker); break; } catch { await new Promise(resolve => setTimeout(resolve, 10)); } }
  let stats = getAIDebugInfo(scope).panel!;
  assert.equal(stats.activeCalls, 1); assert.equal(stats.waitingCalls, 2); assert.equal(stats.totalCalls, 3);
  controller.abort();
  await flush();
  stats = getAIDebugInfo(scope).panel!;
  assert.equal(stats.waitingCalls, 1); assert.equal(stats.cancelledCalls, 1);
  await writeFile(gate, 'release');
  const settled = await results;
  assert.deepEqual(settled.map(result => result.status), ['fulfilled', 'fulfilled', 'rejected']);
  stats = getAIDebugInfo(scope).panel!;
  assert.equal(stats.activeCalls, 0); assert.equal(stats.waitingCalls, 0);
  assert.equal(stats.completedCalls, 2); assert.equal(stats.failedCalls, 0); assert.equal(stats.cancelledCalls, 1);
});
