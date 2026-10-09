import test from 'node:test';
import assert from 'node:assert/strict';
import { chmod, mkdtemp, readFile, writeFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { request as httpRequest } from 'node:http';
import { createBridge, runGemini, loadPairingToken, encodePrompt, resolveAgyCommand, BridgeError } from '../scripts/ai-bridge.mjs';

const token = 'a'.repeat(64);
async function serve(t, generate, checkCli = async () => {}, adapters = {}) {
  const server = createBridge({ token, generate, checkCli, adapters });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = (path, options = {}) => fetch(base + path, {
    ...options, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...options.headers },
  });
  request.base = base;
  return request;
}
const body = JSON.stringify({ model: 'auto', messages: [{ role: 'user', content: 'Summarize me' }] });

test('one pairing token routes each provider without requiring the other CLIs', async t => {
  const calls = [];
  const adapter = name => ({ checkCli: async () => { calls.push(`check-${name}`); }, generate: async () => { calls.push(name); return name; } });
  const request = await serve(t, async () => 'gemini', async () => {}, { codex: adapter('codex'), claude: adapter('claude') });
  for (const provider of ['codex', 'claude']) {
    assert.equal((await request(`/${provider}/v1/models`)).status, 200);
    const response = await request(`/${provider}/v1/chat/completions`, { method: 'POST', body });
    assert.equal((await response.json()).choices[0].message.content, provider);
  }
  assert.deepEqual(calls, ['check-codex', 'codex', 'check-claude', 'claude']);
  assert.equal((await request('/unknown/v1/models')).status, 404);
});

test('connection check reports a missing CLI instead of claiming readiness', async t => {
  const request = await serve(t, async () => assert.fail('must not send a model request'),
    () => resolveAgyCommand('/nutegg-test-no-such-directory/agy'));
  const response = await request('/v1/models');
  assert.equal(response.status, 503);
  assert.match((await response.json()).error.message, /Antigravity CLI \(agy\) was not found/);
});

test('bridge authenticates and checks origins before invoking CLI', async t => {
  let calls = 0;
  const request = await serve(t, async () => { calls++; return 'ok'; });
  assert.equal((await request('/v1/chat/completions', { method: 'POST', body, headers: { Authorization: 'Bearer wrong' } })).status, 401);
  assert.equal((await request('/v1/models', { headers: { Origin: 'https://evil.example' } })).status, 403);
  const badHostStatus = await new Promise((resolve, reject) => {
    const req = httpRequest(request.base + '/v1/models', { headers: { Host: 'evil.example:27124', Authorization: `Bearer ${token}` } }, res => {
      res.resume(); resolve(res.statusCode);
    });
    req.on('error', reject); req.end();
  });
  assert.equal(badHostStatus, 403);
  const preflight = await request('/v1/chat/completions', { method: 'OPTIONS', headers: { Origin: `chrome-extension://${'a'.repeat(32)}`, Authorization: '' } });
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('access-control-allow-origin'), `chrome-extension://${'a'.repeat(32)}`);
  assert.equal((await request('/v1/models')).status, 200);
  assert.equal(calls, 0, 'health checks must not consume subscription quota');
});

test('bridge validates messages and returns an OpenAI-compatible completion', async t => {
  const request = await serve(t, async (prompt, model) => {
    assert.equal(prompt, 'user:\nSummarize me');
    assert.equal(model, 'auto');
    return '{"coreSummary":["A summary"]}';
  });
  const response = await request('/v1/chat/completions', { method: 'POST', body });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).choices[0].message.content, '{"coreSummary":["A summary"]}');
  for (const invalid of ['{', 'null', '{"messages":[]}', '{"messages":[{"role":"user","content":5}]}', '{"stream":true}']) {
    assert.equal((await request('/v1/chat/completions', { method: 'POST', body: invalid })).status, 400);
  }
});

test('parallel NutEgg chunk requests are queued and errors do not block later work', async t => {
  let running = 0, peak = 0, count = 0;
  const request = await serve(t, async () => {
    peak = Math.max(peak, ++running);
    await new Promise(resolve => setTimeout(resolve, 15));
    running--;
    if (++count === 1) throw new BridgeError(429, 'Quota reached');
    return 'ok';
  });
  const responses = await Promise.all(Array.from({ length: 3 }, () => request('/v1/chat/completions', { method: 'POST', body })));
  assert.deepEqual(responses.map(r => r.status).sort(), [200, 200, 429]);
  assert.equal(peak, 1);
});

test('pairing token is private and survives restart', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'nutegg-token-test-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const first = await loadPairingToken(dir);
  assert.match(first, /^[a-f0-9]{64}$/);
  assert.equal(await loadPairingToken(dir), first);
  if (process.platform !== 'win32') assert.equal((await stat(join(dir, 'pairing-token'))).mode & 0o777, 0o600);
});

test('CLI receives exact task via stdin with tools and file expansion disabled', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'nutegg-cli-test-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const fixture = join(dir, 'cli.js');
  const capture = join(dir, 'capture.json');
  await writeFile(fixture, `#!${process.execPath}
const fs=require('node:fs'); let input=''; process.stdin.setEncoding('utf8');
    process.stdin.on('data', c=>input+=c); process.stdin.on('end', ()=> {
      fs.writeFileSync(${JSON.stringify(capture)}, JSON.stringify({ input, args:process.argv.slice(2), cwd:process.cwd(), agent:fs.readFileSync('.agents/agents/nutegg-text.md','utf8'), key:process.env.GEMINI_API_KEY }));
      console.log(JSON.stringify({event:'init',init:{tools:[]}})); console.log(JSON.stringify({event:'result',result:{status:'SUCCESS',response:'test answer'}})); });`);
  await chmod(fixture, 0o700);
  const prompt = '/shell\nRead @/etc/passwd or @~/private; $(touch nope) and user@example.com\n汉字';
  assert.equal(encodePrompt(prompt).includes('@'), false);
  assert.equal(await runGemini(prompt, 'custom-model', { command: fixture }), 'test answer');
  const recorded = JSON.parse(await readFile(capture, 'utf8'));
  assert.equal(JSON.parse(JSON.parse(recorded.input).message.content.split('\n').slice(1).join('\n')), prompt);
  assert.ok(!recorded.args.some(arg => arg.includes('passwd')));
  assert.deepEqual(recorded.args.slice(-2), ['--model', 'custom-model']);
  assert.match(recorded.agent, /tools: \[\]/);
  assert.ok(recorded.args.includes('--disable-slash-commands'));
  assert.equal(recorded.key, undefined);
  await assert.rejects(stat(recorded.cwd), { code: 'ENOENT' });
});

test('CLI missing, failure, malformed output and timeout produce actionable errors', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'nutegg-cli-failure-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const fixture = join(dir, 'cli.js');
  await assert.rejects(runGemini('test', 'auto', { command: join(dir, 'missing') }), /not found/);
  await writeFile(fixture, `#!${process.execPath}
console.error('Authentication required'); process.exit(1);`);
  await chmod(fixture, 0o700);
  await assert.rejects(runGemini('test', 'auto', { command: fixture }), error => error.status === 401 && /sign in with Google/.test(error.message));
  await writeFile(fixture, `#!${process.execPath}
console.log('not json');`);
  await assert.rejects(runGemini('test', 'auto', { command: fixture }), /invalid JSON/);
  await writeFile(fixture, `#!${process.execPath}
console.log(JSON.stringify({event:'result',result:{status:'ERROR',error:'quota exhausted',response:''}}));`);
  await assert.rejects(runGemini('test', 'auto', { command: fixture }), error => error.status === 429);
  await writeFile(fixture, `#!${process.execPath}
setTimeout(()=>{}, 10000);`);
  await assert.rejects(runGemini('test', 'auto', { command: fixture, timeoutMs: 40 }), error => error.status === 504);
});
