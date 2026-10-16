import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { ExecutionCoordinator, type Session } from '../src/execution-coordinator';
import { publicExecutionSettings, migrateChromeApiPreferences, reduceSharedExecutionState, selectEffectiveExecution } from '../../shared/src/execution';
function setup() {
    const persisted: any[] = [];
    const c = new ExecutionCoordinator(ExecutionCoordinator.initial(undefined, true), async (s) => { persisted.push(s); }, async () => { });
    const messages: any[][] = [[], []];
    const sessions = messages.map((m, i): Session => ({ clientId: `client-${i}`, sessionId: `session-${i}`, displayName: `Chrome ${i}`, origin: 'chrome-extension://' + 'a'.repeat(32), credentialId: `credential-${i}`, connected: true, seen: Date.now(), send: x => m.push(x) }));
    sessions.forEach(s => c.attach(s));
    const envelope = (i: number) => ({ jobId: randomUUID(), clientId: sessions[i].clientId, sessionId: sessions[i].sessionId, instanceId: c.state.instanceId, revision: c.state.revision, configurationRevision: `config-${i}`, settings: { chromeAiProvider: i ? 'anthropic' : 'openai', chromeAiModel: `model-${i}` } });
    const admit = (i: number) => c.admit(envelope(i), sessions[i].origin, sessions[i].credentialId, { aiApiKey: 'native-private' }, () => ({ chat: async () => 'subscription' }));
    return { c, sessions, messages, envelope, admit, persisted };
}
test('ChatGPT uses the native executor for Chrome and Obsidian, independent of CLI capability', async () => {
  const { c, admit } = setup();
  await c.updateChatGPT({
    available: true,
    state: 'ready',
    revision: 1,
    accountLabel: 'Test account',
    model: 'chatgpt-model',
  });
  await c.change(c.state.revision, randomUUID(), { mode: 'chatgpt', subscriptionAvailable: false });
  const job = admit(0);
  assert.equal(job.metadata.authMethod, 'chatgpt');
  assert.equal(job.metadata.provider, 'openai');
  assert.equal(job.metadata.model, 'chatgpt-model');
  assert.equal(
    await job.executor.chat({ prompt: 'Q', maxTokens: 100 }, job.controller.signal),
    'subscription',
    'uses injected native executor, not Chrome API'
  );
  const native = c.native({ aiProvider: 'deepseek', aiApiKey: 'private' }, settings => ({
    chat: async () => `${settings.aiAuthMethod}:${settings.aiModel}`,
  }));
  assert.equal(
    await native.executor.chat({ prompt: 'Q', maxTokens: 100 }, native.controller.signal),
    'chatgpt:chatgpt-model'
  );
  await c.updateChatGPT({ available: true, state: 'signed_out', revision: 2, accountLabel: '', model: '' });
  assert.equal(job.controller.signal.aborted, true);
  assert.equal(native.controller.signal.aborted, true);
  assert.equal(c.state.mode, 'chatgpt', 'sign-out never enables API billing');
  assert.equal(selectEffectiveExecution('obsidian', c.state), 'chatgpt');
  assert.equal(selectEffectiveExecution('chrome', c.state), 'apiKey');
  assert.equal(reduceSharedExecutionState(undefined, c.state).mode, 'chatgpt');
  assert.equal(ExecutionCoordinator.initial(c.snapshot(), false).mode, 'chatgpt');
  await c.dispose();
});

test('ChatGPT status changes do not cancel unrelated API jobs or overwrite a newer mode transition', async () => {
  const { c, admit } = setup();
  const api = admit(0);
  const revision = c.state.revision;
  await c.updateChatGPT({ available: true, state: 'signed_out', revision: 1, accountLabel: '', model: '' });
  c.assertActive(api);
  assert.equal(c.state.revision, revision);
  await Promise.all([
    c.change(c.state.revision, randomUUID(), { mode: 'chatgpt' }),
    c.updateChatGPT({ available: true, state: 'ready', revision: 2, accountLabel: 'Test', model: 'model' }),
  ]);
  assert.equal(c.state.mode, 'chatgpt');
  assert.equal(c.state.chatgpt?.state, 'ready');
  assert.equal(c.state.transition, 'ready');
  await c.dispose();
});
test('concurrent API calls use their own Chrome executor; cross-profile answers are rejected', async () => {
    const { c, sessions, messages, admit } = setup();
    const a = admit(0), b = admit(1);
    const pa = a.executor.chat({ prompt: 'A', maxTokens: 800 }, a.controller.signal), pb = b.executor.chat({ prompt: 'B', maxTokens: 800 }, b.controller.signal);
    const ca = messages[0].find(x => x.type === 'ai-call'), cb = messages[1].find(x => x.type === 'ai-call');
    assert.equal(ca.jobId, a.metadata.jobId);
    assert.equal(cb.jobId, b.metadata.jobId);
    assert.throws(() => c.result(sessions[1].sessionId, { ...ca, text: 'stolen' }), /another job/);
    c.result(sessions[0].sessionId, { ...ca, text: 'A' });
    c.result(sessions[1].sessionId, { ...cb, text: 'B' });
    assert.deepEqual(await Promise.all([pa, pb]), ['A', 'B']);
    assert.equal(a.metadata.model, 'model-0');
    assert.equal(b.metadata.model, 'model-1');
    assert.equal(a.settings.aiApiKey, '');
    assert.ok(!JSON.stringify(messages).includes('native-private'));
    await c.dispose();
});
test('shared changes converge and fence queued/running/late work and stale admission', async () => {
    const { c, admit, messages, envelope, sessions } = setup();
    const a = admit(0), stale = envelope(1);
    const p = a.executor.chat({ prompt: 'pending', maxTokens: 800 }, a.controller.signal);
    const rejected = assert.rejects(p, { code: 'cancelled' });
    await c.change(c.state.revision, randomUUID(), { mode: 'subscription' });
    await rejected;
    assert.equal(a.controller.signal.aborted, true);
    assert.throws(() => c.assertActive(a), { code: 'cancelled' });
    for (const channel of messages)
        assert.equal(channel.filter(m => m.type === 'state').at(-1).state.mode, 'subscription');
    assert.throws(() => c.admit(stale, sessions[1].origin, sessions[1].credentialId, {}, () => ({ chat: async () => '' })), /mode changed/);
    const sub = admit(1);
    assert.equal(await sub.executor.chat({ prompt: 'sub', maxTokens: 800 }, sub.controller.signal), 'subscription');
    await c.change(c.state.revision, randomUUID(), { mode: 'apiKey' });
    assert.equal(admit(0).metadata.model, 'model-0');
    await c.change(c.state.revision, randomUUID(), { mode: 'subscription' });
    assert.equal(c.state.mode, 'subscription');
    await c.dispose();
});
test('conflicting revisions and repeated operation IDs do not overwrite newer decisions', async () => {
    const { c } = setup();
    const rev = c.state.revision, id = randomUUID();
    await c.change(rev, id, { mode: 'subscription' });
    await assert.rejects(c.change(rev, randomUUID(), { mode: 'apiKey' }), { code: 'revision_conflict' });
    await c.change(c.state.revision, randomUUID(), { mode: 'apiKey' });
    await c.change(rev, id, { mode: 'subscription' });
    assert.equal(c.state.mode, 'apiKey');
    await assert.rejects(c.change(rev, id, { mode: 'apiKey' }), { code: 'operation_conflict' });
    await c.dispose();
});
test('disconnect/config cancellation is profile-local; native jobs use a separate key', async () => {
    const { c, admit, sessions } = setup();
    const a = admit(0), b = admit(1);
    let captured: any;
    const n = c.native({ aiProvider: 'deepseek', aiApiKey: 'native-key' }, settings => { captured = settings; return { chat: async () => settings.aiApiKey! }; });
    assert.equal(captured.aiApiKey, 'native-key');
    assert.equal(n.metadata.origin, 'obsidian');
    c.detach(sessions[0].sessionId);
    assert.equal(a.controller.signal.aborted, true);
    assert.equal(b.controller.signal.aborted, false);
    assert.equal(n.controller.signal.aborted, false);
    c.cancelJobs(j => j.session === sessions[1]);
    assert.equal(b.controller.signal.aborted, true);
    c.complete(n);
    assert.equal(n.settings.aiApiKey, '');
    await c.dispose();
});
test('per-egg jobs serialize without coalescing; canceled background children cannot commit', async () => {
    const { c, admit, messages } = setup();
    const order: string[] = [];
    let unlock!: () => void;
    const gate = new Promise<void>(r => unlock = r);
    const a = c.withEggLock('egg', async () => { order.push('A'); await gate; return 'key A'; });
    const b = c.withEggLock('egg', async () => { order.push('B'); return 'key B'; });
    await new Promise(r => setImmediate(r));
    assert.deepEqual(order, ['A']);
    unlock();
    assert.deepEqual(await Promise.all([a, b]), ['key A', 'key B']);
    assert.deepEqual(order, ['A', 'B']);
    const job = admit(0);
    let release!: () => void;
    const wait = new Promise<void>(r => release = r);
    let committed = false;
    c.child(job, async () => { await wait; c.assertActive(job); committed = true; });
    c.complete(job);
    assert.equal(messages[0].some(m => m.type === 'job-finished'), false);
    await c.change(c.state.revision, randomUUID(), { mode: 'subscription' });
    release();
    await new Promise(r => setImmediate(r));
    assert.equal(committed, false);
    await c.dispose();
});
test('persistence failure does not cancel jobs; restart recovers an unfinished transition', async () => {
    const { c, admit } = setup();
    const job = admit(0), persist = (c as any).persist;
    (c as any).persist = async () => { throw new Error('disk failed'); };
    await assert.rejects(c.change(c.state.revision, randomUUID(), { mode: 'subscription' }), /disk failed/);
    assert.equal(job.controller.signal.aborted, false);
    (c as any).persist = persist;
    await c.dispose();
    let cleaned = false;
    const state = ExecutionCoordinator.initial({ instanceId: 'vault', revision: 7, mode: 'subscription', transition: 'changing' }, true);
    const restored = new ExecutionCoordinator(state, async () => { }, async () => { cleaned = true; });
    await restored.recover();
    assert.equal(cleaned, true);
    assert.equal(restored.state.transition, 'ready');
    assert.equal(restored.state.instanceId, 'vault');
    await restored.dispose();
});
test('capability defaults off; enable does not select subscription and disable preserves the model', async () => {
    const c = new ExecutionCoordinator(ExecutionCoordinator.initial(undefined, false), async () => { }, async () => { });
    await assert.rejects(c.change(c.state.revision, randomUUID(), { mode: 'subscription' }), { code: 'subscription_disabled' });
    await c.change(c.state.revision, randomUUID(), { subscriptionAvailable: true });
    assert.equal(c.state.mode, 'apiKey');
    await c.change(c.state.revision, randomUUID(), { mode: 'subscription', subscription: { provider: 'openai', model: 'custom' } });
    await c.change(c.state.revision, randomUUID(), { subscriptionAvailable: false, mode: 'apiKey' });
    assert.equal(c.state.mode, 'apiKey');
    assert.equal(c.state.subscription.model, 'custom');
    await c.dispose();
});
test('public configuration strips secrets/endpoints; API migration preserves backups and is idempotent', () => {
    assert.deepEqual(publicExecutionSettings({ chromeAiApiKey: 'private', aiApiKey: 'native', chromeAiEndpoint: 'url', bridgePairToken: 'token', chromeAiProvider: 'openai', chromeAiModel: 'custom' }), { chromeAiProvider: 'openai', chromeAiModel: 'custom' });
    const old = { chromeAiAuthMethod: 'subscription', chromeAiProvider: 'gemini', chromeApiConfig: { chromeAiProvider: 'deepseek', chromeAiApiKey: 'saved', chromeAiModel: 'api-model' }, aiProfiles: { 'openai:apiKey': { apiKey: 'other' } } };
    const migrated = migrateChromeApiPreferences(old);
    assert.equal(migrated.chromeAiApiKey, 'saved');
    assert.equal(migrated.chromeAiModel, 'api-model');
    assert.deepEqual(migrated.aiProfiles, old.aiProfiles);
    assert.deepEqual(migrateChromeApiPreferences(migrated), migrated);
});
test('late results after cancellation cannot resurrect a job or executor', async () => {
    const { c, admit, messages, sessions } = setup();
    const job = admit(0);
    const response = job.executor.chat({ prompt: 'pending', maxTokens: 100 }, job.controller.signal);
    const rejected = assert.rejects(response, { code: 'cancelled' });
    const call = messages[0].find(m => m.type === 'ai-call');
    c.cancelJobs(() => true);
    await rejected;
    c.result(sessions[0].sessionId, { ...call, text: 'late' });
    assert.throws(() => c.assertActive(job), { code: 'cancelled' });
    await assert.rejects(job.executor.chat({ prompt: 'late', maxTokens: 100 }, job.controller.signal), { code: 'cancelled' });
    await c.dispose();
});

test('the shared reducer rejects stale observations and disabled subscriptions cannot become effective',()=>{
 const current=ExecutionCoordinator.initial(undefined,true);current.revision=9;current.mode='subscription';
 assert.equal(reduceSharedExecutionState(current,{...current,revision:8,mode:'apiKey'}).mode,'subscription');
 const disabled=reduceSharedExecutionState(current,{...current,revision:10,subscriptionAvailable:false});assert.equal(disabled.mode,'apiKey');assert.equal(selectEffectiveExecution('obsidian',disabled),'apiKey');assert.equal(selectEffectiveExecution('chrome',current),'apiKey');
});

test('job admission rejects wrong credentials, instance identity and duplicate IDs',async()=>{
 const {c,envelope,sessions}=setup();const request=envelope(0),executor=()=>({chat:async()=>''});
 assert.throws(()=>c.admit(request,sessions[0].origin,sessions[1].credentialId,{},executor),{code:'session_required'});
 assert.throws(()=>c.admit({...request,instanceId:'other-vault'},sessions[0].origin,sessions[0].credentialId,{},executor),{code:'revision_conflict'});
 c.admit(request,sessions[0].origin,sessions[0].credentialId,{},executor);assert.throws(()=>c.admit(request,sessions[0].origin,sessions[0].credentialId,{},executor),{code:'duplicate_job'});await c.dispose();
});

test('profile metadata exposes current processing settings without native defaults or credentials', () => {
    const { c, sessions, envelope } = setup();
    const request = envelope(0);
    Object.assign(request.settings, { chunkWindowChars: 24000, contentAnalysisMaxTokens: 8192 });
    c.admit(request, sessions[0].origin, sessions[0].credentialId, { aiApiKey: 'native-secret', chunkWindowChars: 99999 }, () => ({ chat: async () => 'unused' }));
    const profile = c.clients().find(client => client.clientId === sessions[0].clientId)!;
    assert.equal(profile.chunkWindowChars, 24000);
    assert.equal(profile.contentAnalysisMaxTokens, 8192);
    assert.equal(profile.model, 'model-0');
    assert.doesNotMatch(JSON.stringify(c.clients()), /native-secret|99999|aiApiKey/);
    c.dispose();
});
