import { randomUUID } from 'node:crypto';
import { AIError } from '../../shared/src/client';
import { publicExecutionSettings, EXECUTION_PROTOCOL, type SharedExecutionState, type ClientSession, type ExecutionMetadata, type AIExecutor } from '../../shared/src/execution';
import type { NutEggAISettings } from '../../shared/src/types';
type Send = (message: any) => void;
export type Session = ClientSession & {
    origin: string;
    credentialId: string;
    send: Send;
    seen: number;
};
export type Job = {
    metadata: ExecutionMetadata;
    settings: NutEggAISettings;
    controller: AbortController;
    session?: Session;
    executor: AIExecutor;
    children: number;
    httpDone: boolean;
    completed?: boolean;
};
export class ExecutionProtocolError extends Error {
    constructor(public code: string, message: string, public statusCode = 409) { super(message); }
}
export class ExecutionCoordinator {
    readonly sessions = new Map<string, Session>();
    readonly jobs = new Map<string, Job>();
    private calls = new Map<string, {
        job: Job;
        resolve: (text: string) => void;
        reject: (error: Error) => void;
        timer: ReturnType<typeof setTimeout>;
        abort: () => void;
    }>();
    private operations = new Map<string, {
        signature: string;
        state: SharedExecutionState;
    }>();
    private queue: Promise<void> = Promise.resolve();
    private locks = new Map<string, Promise<void>>();
    private closed = false;
    constructor(public state: SharedExecutionState, private persist: (state: SharedExecutionState) => Promise<void>, private cleanup: () => Promise<void>) { }
    static initial(saved: Partial<SharedExecutionState> | undefined, available: boolean, selection?: SharedExecutionState['subscription'], legacyMode = 'apiKey'): SharedExecutionState {
        return { instanceId: saved?.instanceId || randomUUID(), protocolVersion: EXECUTION_PROTOCOL,
            revision: saved?.revision || 1, subscriptionAvailable: available,
            mode: available && (saved?.mode || legacyMode) === 'subscription' ? 'subscription' : 'apiKey',
            subscription: selection || saved?.subscription || { provider: 'gemini', model: 'auto' }, transition: saved?.transition === 'changing' || saved?.transition === 'error' ? saved.transition : 'ready' };
    }
    snapshot() { return structuredClone(this.state); }
    broadcast() { for (const session of this.sessions.values())
        session.send({ type: 'state', state: this.snapshot() }); }
    async recover() {
        if (this.state.transition !== 'ready') {
            await this.cleanup();
            this.state.transition = 'ready';
        }
        await this.persist(this.snapshot());
    }
    attach(session: Session) {
        if (this.closed)
            throw new ExecutionProtocolError('server_stopped', 'Obsidian stopped.', 503);
        for (const previous of this.sessions.values())
            if (previous.clientId === session.clientId) {
                this.detach(previous.sessionId);
                previous.send({ type: 'superseded' });
            }
        this.sessions.set(session.sessionId, session);
        session.send({ type: 'connected', session: { clientId: session.clientId, sessionId: session.sessionId, displayName: session.displayName }, state: this.snapshot() });
    }
    detach(sessionId: string) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return;
        this.cancelJobs(job => job.session === session);
        this.sessions.delete(sessionId);
    }
    clients(): ClientSession[] { return [...this.sessions.values()].map(({ clientId, sessionId, displayName, provider, model, configurationRevision, chunkWindowChars, contentAnalysisMaxTokens }) => ({ clientId, sessionId, displayName, provider, model, configurationRevision, chunkWindowChars, contentAnalysisMaxTokens, connected: true })); }
    change(expectedRevision: number, operationId: string, patch: Partial<Pick<SharedExecutionState, 'mode' | 'subscriptionAvailable' | 'subscription'>>) {
        const task = async () => {
            if (this.closed)
                throw new ExecutionProtocolError('server_stopped', 'Obsidian stopped.', 503);
            if (!/^[\w-]{8,100}$/.test(operationId))
                throw new ExecutionProtocolError('invalid_operation', 'Invalid operation ID.', 400);
            const signature = JSON.stringify(patch);
            const prior = this.operations.get(operationId);
            if (prior) {
                if (prior.signature !== signature)
                    throw new ExecutionProtocolError('operation_conflict', 'Operation ID already used.');
                return this.snapshot();
            }
            if (expectedRevision !== this.state.revision)
                throw new ExecutionProtocolError('revision_conflict', 'AI mode changed. Refresh and try again.');
            const next = { ...this.state, ...patch, revision: this.state.revision + 1, transition: 'changing' as const };
            if (patch.mode === 'subscription' && !next.subscriptionAvailable)
                throw new ExecutionProtocolError('subscription_disabled', 'Subscription is not enabled in Obsidian.', 403);
            if (!next.subscriptionAvailable)
                next.mode = 'apiKey';
            if (next.mode !== 'apiKey' && next.mode !== 'subscription')
                throw new ExecutionProtocolError('invalid_mode', 'Invalid AI mode.', 400);
            if (!['openai', 'anthropic', 'gemini'].includes(next.subscription.provider) || !/^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,127}$/.test(next.subscription.model))
                throw new ExecutionProtocolError('invalid_model', 'Invalid subscription selection.', 400);
            await this.persist(next); // Persist before irreversible cancellation.
            this.state = next;
            this.cancelJobs(() => true);
            this.broadcast();
            try {
                await this.cleanup();
                this.state = { ...next, transition: 'ready' };
                await this.persist(this.snapshot());
            }
            catch (error) {
                this.state = { ...next, transition: 'error' };
                this.broadcast();
                throw error;
            }
            this.operations.set(operationId, { signature, state: this.snapshot() });
            if (this.operations.size > 256)
                this.operations.delete(this.operations.keys().next().value!);
            this.broadcast();
            return this.snapshot();
        };
        const result = this.queue.then(task);
        this.queue = result.then(() => { }, () => { });
        return result;
    }
    admit(envelope: any, origin: string, credentialId: string, nativeSettings: NutEggAISettings, nativeExecutor: (settings: NutEggAISettings, signal: AbortSignal) => AIExecutor): Job {
        if (this.closed || this.state.transition !== 'ready')
            throw new ExecutionProtocolError('mode_changing', 'AI mode is changing. Try again shortly.');
        if (!envelope || envelope.instanceId !== this.state.instanceId || envelope.revision !== this.state.revision)
            throw new ExecutionProtocolError('revision_conflict', 'AI mode changed. Refresh before starting a new job.');
        const session = this.sessions.get(envelope.sessionId);
        if (!session || session.clientId !== envelope.clientId || session.origin !== origin || session.credentialId !== credentialId)
            throw new ExecutionProtocolError('session_required', 'Reconnect this Chrome profile.', 401);
        if (!/^[\w-]{8,100}$/.test(envelope.jobId || '') || typeof envelope.configurationRevision !== 'string')
            throw new ExecutionProtocolError('invalid_job', 'Invalid AI job.', 400);
        if (this.jobs.has(envelope.jobId))
            throw new ExecutionProtocolError('duplicate_job', 'This job was already submitted. Check its result instead of retrying.');
        if ([...this.jobs.values()].filter(job => !job.completed).length >= 64)
            throw new ExecutionProtocolError('queue_full', 'Too many AI jobs. Try again shortly.', 429);
        let publicSettings:NutEggAISettings;
        try {publicSettings=publicExecutionSettings(envelope.settings || {});}catch {throw new ExecutionProtocolError('invalid_configuration','Invalid public execution settings.',400);}
        const settings = { ...structuredClone(nativeSettings), ...publicSettings, aiApiKey: '', chromeAiApiKey: '', aiAuthMethod: this.state.mode, chromeAiAuthMethod: this.state.mode };
        if (this.state.mode === 'subscription')
            Object.assign(settings, { aiProvider: this.state.subscription.provider, chromeAiProvider: this.state.subscription.provider, aiModel: this.state.subscription.model, chromeAiModel: this.state.subscription.model });
        else {
            settings.aiProvider = settings.chromeAiProvider || settings.aiProvider;
            settings.aiModel = settings.chromeAiModel || settings.aiModel;
        }
        const controller = new AbortController();
        const job: Job = { metadata: { jobId: envelope.jobId, origin: session.clientId, revision: this.state.revision, configurationRevision: envelope.configurationRevision, authMethod: this.state.mode, provider: settings.aiProvider || 'gemini', model: settings.aiModel || '' }, settings, controller, session, executor: null as any, children: 0, httpDone: false };
        job.executor = this.state.mode === 'subscription' ? nativeExecutor(settings, controller.signal) : { chat: (request, signal) => this.delegate(job, request, signal) };
        if(job.metadata.authMethod==='apiKey'){session.provider = job.metadata.provider;session.model = job.metadata.model;session.chunkWindowChars=publicSettings.chunkWindowChars;session.contentAnalysisMaxTokens=publicSettings.contentAnalysisMaxTokens;}
        session.configurationRevision = envelope.configurationRevision;
        this.jobs.set(envelope.jobId, job);
        return job;
    }
    native(settings: NutEggAISettings, executor: (settings: NutEggAISettings, signal: AbortSignal) => AIExecutor): Job {
        if (this.closed || this.state.transition !== 'ready')
            throw new ExecutionProtocolError('mode_changing', 'AI mode is changing.');
        const captured = structuredClone(settings);
        if (this.state.mode === 'subscription')
            Object.assign(captured, { aiAuthMethod: 'subscription', aiProvider: this.state.subscription.provider, aiModel: this.state.subscription.model, aiApiKey: '' });
        else
            captured.aiAuthMethod = 'apiKey';
        const controller = new AbortController();
        const job: Job = { metadata: { jobId: randomUUID(), origin: 'obsidian', revision: this.state.revision, configurationRevision: String(settings.nativeConfigurationRevision || 1), authMethod: this.state.mode, provider: captured.aiProvider || 'gemini', model: captured.aiModel || '' }, settings: captured, controller, executor: executor(captured, controller.signal), children: 0, httpDone: false };
        this.jobs.set(job.metadata.jobId, job);
        return job;
    }
    assertActive(job: Job) { if (job.completed || job.controller.signal.aborted || job.metadata.revision !== this.state.revision)
        throw new AIError('cancelled', 'AI job cancelled. Retry explicitly with the current settings.'); }
    private delegate(job: Job, request: any, signal: AbortSignal): Promise<string> {
        this.assertActive(job);
        if (!job.session || this.sessions.get(job.session.sessionId) !== job.session)
            throw new AIError('cancelled', 'Originating Chrome disconnected.');
        const callId = randomUUID();
        return new Promise((resolve, reject) => {
            const abort = () => this.finishCall(callId, new AIError('cancelled', 'AI call cancelled.'));
            const timer = setTimeout(() => this.finishCall(callId, new AIError('timeout', 'AI call timed out. Retry explicitly.')), 180000);
            this.calls.set(callId, { job, resolve, reject, timer, abort });
            signal.addEventListener('abort', abort, { once: true });
            job.session!.send({ type: 'ai-call', jobId: job.metadata.jobId, callId, request: { prompt: request.prompt, maxTokens: request.maxTokens, debugScope: request.debugScope } });
            if (signal.aborted)
                abort();
        });
    }
    result(sessionId: string, message: any) {
        const call = this.calls.get(message.callId);
        if (!call)
            return;
        if (call.job.session?.sessionId !== sessionId || call.job.metadata.jobId !== message.jobId)
            throw new ExecutionProtocolError('wrong_owner', 'AI result belongs to another job.', 403);
        this.assertActive(call.job);
        this.finishCall(message.callId, message.error ? new AIError(['cancelled', 'timeout', 'auth_failed', 'model_not_found', 'quota_exceeded', 'rate_limited', 'network_error', 'no_api_key'].includes(message.error.code) ? message.error.code : 'server_error', String(message.error.message || 'AI call failed.').slice(0, 1000)) : undefined, String(message.text || ''));
    }
    private finishCall(id: string, error?: Error, text = '') {
        const call = this.calls.get(id);
        if (!call)
            return;
        clearTimeout(call.timer);
        call.job.controller.signal.removeEventListener('abort', call.abort);
        this.calls.delete(id);
        error ? call.reject(error) : call.resolve(text);
    }
    cancelJobs(predicate: (job: Job) => boolean) { for (const job of this.jobs.values())
        if (!job.completed && predicate(job)) {
            job.completed = true;
            job.controller.abort();
            job.session?.send({ type: 'cancel-job', jobId: job.metadata.jobId });
            this.release(job);
        } }
    complete(job: Job) { if (job.completed)
        return; job.httpDone = true; if (job.children === 0) {
        job.completed = true;
        this.release(job);
    } }
    child(job: Job, task: () => Promise<unknown>) {
        this.assertActive(job);
        job.children++;
        void Promise.resolve().then(() => { this.assertActive(job); return task(); }).catch(() => { }).finally(() => { job.children--; if (!job.completed && job.httpDone && job.children === 0) {
            job.completed = true;
            this.release(job);
        } });
    }
    private release(job: Job) {
        job.session?.send({ type: 'job-finished', jobId: job.metadata.jobId });
        job.settings.aiApiKey = '';
        job.settings.chromeAiApiKey = '';
        job.settings = { aiApiKey: '', chromeAiApiKey: '' };
        (job as any).prompts = undefined;
        job.executor = { chat: async () => { throw new AIError('cancelled', 'AI job finished.'); } };
        const timer = setTimeout(() => { if (this.jobs.get(job.metadata.jobId) === job)
            this.jobs.delete(job.metadata.jobId); }, 15 * 60 * 1000);
        timer.unref?.();
    }
    async withEggLock<T>(path: string, task: () => Promise<T>): Promise<T> {
        const previous = this.locks.get(path) || Promise.resolve();
        let release!: () => void;
        const gate = new Promise<void>(resolve => release = resolve);
        const tail = previous.then(() => gate);
        this.locks.set(path, tail);
        await previous;
        try {
            return await task();
        }
        finally {
            release();
            if (this.locks.get(path) === tail)
                this.locks.delete(path);
        }
    }
    async dispose() { this.closed = true; this.cancelJobs(() => true); for (const session of this.sessions.values())
        session.send({ type: 'server-stopped' }); this.sessions.clear(); await this.queue; }
}
