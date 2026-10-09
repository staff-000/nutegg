import test from 'node:test';
import assert from 'node:assert/strict';
import { chmod, mkdtemp, readFile, writeFile, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { runSubscription, parseSubscriptionOutput, subscriptionEnvironment, executeSubscriptionCli, resolveSubscriptionCommand } from '../scripts/subscription-cli.mjs';

async function fixture(t, provider, auth = 'subscription') {
  const dir = await mkdtemp(join(tmpdir(), `nutegg-${provider}-test-`));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const command = join(dir, 'cli.js');
  const capture = join(dir, 'capture.json');
  await writeFile(command, `#!${process.execPath}
const fs = require('node:fs');
const provider = ${JSON.stringify(provider)}, auth = ${JSON.stringify(auth)};
if (process.argv.includes('status')) {
  if (provider === 'codex') console.error(auth === 'subscription' ? 'Logged in using ChatGPT' : 'Logged in using an API key');
  else console.log(JSON.stringify({loggedIn:true,authMethod:auth === 'subscription' ? 'claude.ai' : 'api_key'}));
} else {
  let input=''; process.stdin.setEncoding('utf8'); process.stdin.on('data', chunk => input += chunk);
  process.stdin.on('end', () => {
    fs.writeFileSync(${JSON.stringify(capture)}, JSON.stringify({input,args:process.argv.slice(2),cwd:process.cwd()}));
    if (provider === 'codex') {
      console.log(JSON.stringify({type:'item.completed',item:{type:'agent_message',text:'{"summary":"OK"}'}}));
      console.log(JSON.stringify({type:'turn.completed'}));
    } else console.log(JSON.stringify({type:'result',subtype:'success',is_error:false,result:'{"summary":"OK"}'}));
  });
}`);
  await chmod(command, 0o700);
  return { command, capture };
}

for (const provider of ['codex', 'claude']) {
  test(`${provider} sends prompts on stdin with subscription-only authentication`, async t => {
    const { command, capture } = await fixture(t, provider);
    const prompt = 'Summarize @/private $(touch bad) without commands. 汉字';
    assert.equal(await runSubscription(provider, prompt, 'custom-model', { command }), '{"summary":"OK"}');
    const recorded = JSON.parse(await readFile(capture, 'utf8'));
    assert.ok(recorded.input.endsWith(prompt));
    assert.ok(!recorded.args.some(arg => arg.includes('touch bad')));
    assert.equal(recorded.args[recorded.args.indexOf('--model') + 1], 'custom-model');
    if (provider === 'codex') {
      assert.ok(recorded.args.includes('--ignore-user-config'));
      assert.ok(recorded.args.includes('forced_login_method="chatgpt"'));
      assert.ok(recorded.args.includes('features.shell_tool=false'));
      assert.equal(recorded.args[recorded.args.indexOf('--sandbox') + 1], 'read-only');
    } else {
      assert.equal(recorded.args[recorded.args.indexOf('--tools') + 1], '');
      assert.ok(recorded.args.includes('--safe-mode'));
      assert.ok(recorded.args.includes('--no-session-persistence'));
      assert.ok(!recorded.args.includes('--bare'), 'bare mode would disable subscription auth');
    }
    await assert.rejects(stat(recorded.cwd), { code: 'ENOENT' });
  });

  test(`${provider} rejects API login before sending content`, async t => {
    const { command, capture } = await fixture(t, provider, 'api');
    await assert.rejects(runSubscription(provider, 'private content', 'auto', { command }), error => error.status === 401);
    await assert.rejects(stat(capture), { code: 'ENOENT' });
  });
}

test('API environment credentials are excluded while native sign-in remains available', () => {
  const source = { PATH: '/bin', OPENAI_API_KEY: 'key', CODEX_API_KEY: 'key', CODEX_ACCESS_TOKEN: 'token',
    ANTHROPIC_API_KEY: 'key', ANTHROPIC_AUTH_TOKEN: 'key', ANTHROPIC_BASE_URL: 'https://example.invalid', CLAUDE_CODE_OAUTH_TOKEN: 'own-session' };
  const codex = subscriptionEnvironment('codex', source);
  assert.equal(codex.OPENAI_API_KEY, undefined);
  assert.equal(codex.CODEX_ACCESS_TOKEN, undefined);
  const claude = subscriptionEnvironment('claude', source);
  assert.equal(claude.ANTHROPIC_API_KEY, undefined);
  assert.equal(claude.ANTHROPIC_AUTH_TOKEN, undefined);
  assert.equal(claude.ANTHROPIC_BASE_URL, undefined);
  assert.equal(claude.CLAUDE_CODE_OAUTH_TOKEN, 'own-session');
});

test('provider output errors, partial responses, and quota failures are not treated as answers', () => {
  assert.throws(() => parseSubscriptionOutput('codex', '{"type":"turn.failed","error":{"message":"quota reached"}}'), error => error.status === 429);
  assert.throws(() => parseSubscriptionOutput('codex', '{"type":"item.completed","item":{"type":"agent_message","text":"partial"}}'), /before completing/);
  assert.throws(() => parseSubscriptionOutput('claude', '{"subtype":"success","is_error":true,"result":"Authentication required"}'), error => error.status === 401);
  assert.throws(() => parseSubscriptionOutput('claude', '{"subtype":"error_max_turns","result":"partial"}'), error => error.status === 502);
  assert.throws(() => parseSubscriptionOutput('claude', 'bad json'), /invalid JSON/);
});

test('missing CLI and cancellation fail without an unbounded process', async t => {
  await assert.rejects(resolveSubscriptionCommand('claude', '/nutegg-missing-command/claude'), /Claude Code was not found/);
  const { command } = await fixture(t, 'codex');
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(executeSubscriptionCli('codex', command, [], '', { signal: controller.signal }), error => error.status === 499);
});
