import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtemp, writeFile, chmod, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { AIError } from '../../shared/src/client';
import type { SubscriptionExecutor, SubscriptionProvider, SubscriptionStatus } from '../../shared/src/types';
import { checkSubscriptionCli, resolveSubscriptionCommand, runSubscription, subscriptionEnvironment } from './subscription-cli.mjs';
import { resolveAgyCommand, runGemini } from './subscription-gemini.mjs';

const cli = { openai: 'codex', anthropic: 'claude', gemini: 'agy' };
const docs = { openai: 'https://learn.chatgpt.com/docs/cli', anthropic: 'https://code.claude.com/docs/en/quickstart', gemini: 'https://antigravity.google/docs/cli/install' };
type Login = { id: string; child?: ChildProcess; state: 'signing_in' | 'unverified'; directory?: string; command: string; timer?: ReturnType<typeof setTimeout> };

export class SubscriptionService implements SubscriptionExecutor {
  private tail = Promise.resolve();
  private controllers = new Set<AbortController>();
  private logins = new Map<SubscriptionProvider, Login>();
  private verified = new Set<SubscriptionProvider>();
  private failures = new Map<SubscriptionProvider, { message: string; errorCode: string }>();
  private closed = false;
  private pending = 0;
  private modelCache = new Map<SubscriptionProvider, string[]>();
  private discovery = new Set<ChildProcess>();
  private loginStarts = new Map<SubscriptionProvider, Promise<SubscriptionStatus>>();
  private usageCache?: { expires: number; value?: string; exhausted: boolean };
  private usageTask?: Promise<{ value?: string; exhausted: boolean }>;
  private loginGeneration = new Map<SubscriptionProvider, number>();
  constructor(private paths: Partial<Record<SubscriptionProvider, string>> = {}, private enabled: () => boolean = () => false) {}
  private requireEnabled() {
    if (!this.enabled()) throw new AIError('forbidden', 'AI connection unavailable.');
  }

  private resolve(provider: SubscriptionProvider) {
    return provider === 'gemini' ? resolveAgyCommand(this.paths[provider]) : resolveSubscriptionCommand(cli[provider], this.paths[provider]);
  }

  async status(provider: SubscriptionProvider): Promise<SubscriptionStatus> {
    if (!this.enabled()) return { state: 'disabled', message: 'AI connection unavailable.' };
    if (this.closed) return { state: 'error', message: 'Obsidian subscription service stopped.' };
    try { await this.resolve(provider); }
    catch { return { state: 'missing', message: `Install ${cli[provider]} to continue.`, installUrl: docs[provider],
      installCommand: provider === 'openai' ? 'npm install -g @openai/codex' : provider === 'anthropic'
        ? (process.platform === 'win32' ? 'irm https://claude.ai/install.ps1 | iex' : 'curl -fsSL https://claude.ai/install.sh | bash')
        : (process.platform === 'win32' ? 'irm https://antigravity.google/cli/install.ps1 | iex' : 'curl -fsSL https://antigravity.google/cli/install.sh | bash') }; }
    if (!this.enabled()) return this.status(provider);
    const login = this.logins.get(provider);
    if (provider !== 'gemini') {
      try {
        const controller = new AbortController();
        this.controllers.add(controller);
        try { await checkSubscriptionCli(cli[provider], this.paths[provider], { signal: controller.signal }); }
        finally { this.controllers.delete(controller); }
        this.verified.add(provider);
        if (login) await this.cancelLogin(provider);
      } catch (error: any) {
        return { state: login ? 'signing_in' : error.status === 401 && !this.verified.has(provider) && !this.failures.has(provider) ? 'login_required' : 'error',
          message: login ? 'Finish signing in in your browser or terminal.' : error.message,
          errorCode: error.status === 401 ? 'auth_failed' : 'server_error', loginId: login?.id, command: login?.command };
      }
    }
    const failure = this.failures.get(provider);
    if (failure) return { state: 'error', ...failure };
    if (provider === 'gemini' && !this.verified.has(provider)) return {
      state: login?.state || 'unverified', message: login ? 'Finish signing in, then test connection.' : 'Sign-in needs verification. Test connection uses a small amount of subscription quota.',
      loginId: login?.id, command: login?.command,
    };
    const usage = provider === 'openai' ? await this.codexUsage() : undefined;
    if (!this.enabled()) return this.status(provider);
    if (usage?.exhausted) return { state: 'error', errorCode: 'quota_exceeded', message: 'Subscription usage limit reached. Retry after the provider resets your limit.', usageRemaining: usage.value };
    return { state: 'ready', usageRemaining: usage?.value, message: `Connected through ${cli[provider]} · quota managed by your subscription` };
  }

  async chat(provider: SubscriptionProvider, model: string, prompt: string): Promise<string> {
    this.requireEnabled();
    if (this.closed) throw new AIError('server_error', 'Obsidian subscription service stopped.');
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,127}$/.test(model)) throw new AIError('model_not_found', 'Invalid model ID. Choose another model.');
    if (this.pending >= 32) throw new AIError('rate_limited', 'Subscription queue is full. Retry shortly.');
    const controller = new AbortController();
    this.controllers.add(controller); this.pending++;
    const previous = this.tail;
    let release!: () => void;
    this.tail = new Promise<void>(resolve => { release = resolve; });
    try {
      await previous;
      this.requireEnabled();
      if (controller.signal.aborted) throw new Error('Subscription request cancelled.');
      const options = { command: this.paths[provider], signal: controller.signal };
      const result = provider === 'gemini' ? await runGemini(prompt, model, options) : await runSubscription(cli[provider], prompt, model, options);
      this.verified.add(provider); this.failures.delete(provider); this.usageCache = undefined;
      return result;
    } catch (error: any) {
      const code = error.status === 401 ? 'auth_failed' : error.status === 429 ? 'quota_exceeded' : error.status === 400 ? 'model_not_found' : 'server_error';
      const message = error.status === 400 ? `${error.message} Choose another model.` : error.message;
      this.failures.set(provider, { message, errorCode: code });
      throw new AIError(code, message, error.status);
    } finally { release(); this.pending--; this.controllers.delete(controller); }
  }

  async test(provider: SubscriptionProvider, model: string) {
    await this.chat(provider, model, 'Reply with exactly OK.');
    await this.cancelLogin(provider);
    return this.status(provider);
  }

  async models(provider: SubscriptionProvider): Promise<string[]> {
    this.requireEnabled();
    if (this.closed) return this.modelCache.get(provider) || ['auto'];
    try {
      let models: string[];
      if (provider === 'anthropic') models = ['sonnet', 'opus', 'haiku'];
      else if (provider === 'gemini') {
        const executable = await this.resolve(provider);
        this.requireEnabled();
        if (this.closed) return this.modelCache.get(provider) || ['auto'];
        const output = await new Promise<string>((resolve, reject) => {
          const child = spawn(executable, ['models'], { env: this.environment(provider), stdio: ['ignore', 'pipe', 'pipe'], shell: false });
          this.discovery.add(child);
          let text = ''; const timer = setTimeout(() => child.kill(), 10000);
          child.stdout.on('data', chunk => { text += chunk; if (text.length > 1024 * 1024) child.kill(); });
          child.on('error', reject); child.on('close', code => { this.discovery.delete(child); clearTimeout(timer); code === 0 ? resolve(text) : reject(new Error('Model discovery unavailable')); });
        });
        models = [...new Set(output.replace(/\x1b\[[0-9;]*m/g, '').split(/\s+/).filter(id => /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(id) && /gemini|claude|gpt|^auto$/.test(id)))];
      } else models = await this.codexModels();
      this.modelCache.set(provider, ['auto', ...models.filter(id => id !== 'auto')]);
    } catch { /* Retain the last successful list; custom IDs always remain available. */ }
    return this.modelCache.get(provider) || ['auto'];
  }

  private async codexModels(): Promise<string[]> {
    const executable = await this.resolve('openai');
    this.requireEnabled();
    if (this.closed) throw new Error('Obsidian subscription service stopped.');
    return new Promise((resolve, reject) => {
      const child = spawn(executable, ['app-server'], { env: this.environment('openai'), stdio: ['pipe', 'pipe', 'pipe'], shell: false });
      this.discovery.add(child);
      let buffer = '', models: string[] = [], pages = 0;
      const timer = setTimeout(() => { child.kill(); reject(new Error('Model discovery timed out')); }, 10000);
      const send = (data: unknown) => child.stdin.write(JSON.stringify(data) + '\n');
      child.stdin.on('error', () => {});
      child.on('error', reject);
      child.on('close', () => { this.discovery.delete(child); clearTimeout(timer); models.length ? resolve(models) : reject(new Error('Model discovery unavailable')); });
      child.stdout.on('data', chunk => {
        buffer += chunk; if (buffer.length > 1024 * 1024) { child.kill(); return; }
        const lines = buffer.split('\n'); buffer = lines.pop() || '';
        for (const line of lines) {
          try {
            const message = JSON.parse(line);
            if (message.id === 1) { send({ method: 'initialized' }); send({ id: 2, method: 'model/list', params: {} }); }
            if (message.id === 2) {
              models.push(...(message.result?.data || []).map((m: any) => m.model || m.id));
              if (message.result?.nextCursor && ++pages < 20) send({ id: 2, method: 'model/list', params: { cursor: message.result.nextCursor } });
              else child.kill();
            }
          } catch { /* Ignore non-protocol log lines. */ }
        }
      });
      send({ id: 1, method: 'initialize', params: { clientInfo: { name: 'nutegg', version: '1' } } });
    });
  }


  private codexUsage(): Promise<{ value?: string; exhausted: boolean }> {
    if (this.usageCache && this.usageCache.expires > Date.now()) return Promise.resolve(this.usageCache);
    if (this.usageTask) return this.usageTask;
    this.usageTask = (async () => {
      const fallback = { exhausted: false };
      try {
        const executable = await this.resolve('openai');
        this.requireEnabled(); if (this.closed) return fallback;
        const result = await new Promise<any>((resolve, reject) => {
          const child = spawn(executable, ['app-server'], { env: this.environment('openai'), stdio: ['pipe', 'pipe', 'pipe'], shell: false });
          this.discovery.add(child);
          let buffer = '', total = 0;
          const timer = setTimeout(() => { child.kill(); reject(new Error('Usage unavailable')); }, 5000);
          const send = (message: unknown) => child.stdin.write(JSON.stringify(message) + '\n');
          child.stdin.on('error', () => {}); child.on('error', reject);
          child.on('close', () => { this.discovery.delete(child); clearTimeout(timer); reject(new Error('Usage unavailable')); });
          child.stdout.on('data', chunk => {
            total += chunk.length; buffer += chunk;
            if (total > 1024 * 1024) { child.kill(); return; }
            const lines = buffer.split('\n'); buffer = lines.pop() || '';
            for (const line of lines) try {
              const message = JSON.parse(line);
              if (message.id === 1 && !message.error) { send({ method: 'initialized' }); send({ id: 2, method: 'account/rateLimits/read' }); }
              if (message.id === 2) { message.error ? reject(new Error('Usage unavailable')) : resolve(message.result); child.kill(); }
            } catch {}
          });
          send({ id: 1, method: 'initialize', params: { clientInfo: { name: 'nutegg', version: '1' } } });
        });
        const bucket = result?.rateLimitsByLimitId?.codex || result?.rateLimits;
        const windows = [bucket?.primary, bucket?.secondary].filter(window => Number.isFinite(window?.usedPercent));
        const value = windows.map(window => `${Math.max(0, Math.min(100, 100 - window.usedPercent))}% left (${window.windowDurationMins >= 1440 ? `${Math.round(window.windowDurationMins / 1440)}d` : window.windowDurationMins >= 60 ? `${window.windowDurationMins / 60}h` : `${window.windowDurationMins || '?'}m`})`).join(' · ') || undefined;
        const usage = { value, exhausted: windows.some(window => window.usedPercent >= 100) || !!bucket?.rateLimitReachedType };
        this.usageCache = { ...usage, expires: Date.now() + 30000 }; return usage;
      } catch { this.usageCache = { ...fallback, expires: Date.now() + 30000 }; return fallback; }
    })().finally(() => { this.usageTask = undefined; });
    return this.usageTask;
  }

  private environment(provider: SubscriptionProvider) {
    if (provider !== 'gemini') return subscriptionEnvironment(cli[provider]);
    const env = { ...process.env };
    for (const key of ['GEMINI_API_KEY', 'GOOGLE_API_KEY', 'GOOGLE_GENAI_USE_VERTEXAI', 'GOOGLE_APPLICATION_CREDENTIALS', 'GOOGLE_GEMINI_BASE_URL']) delete env[key];
    return env;
  }

  startLogin(provider: SubscriptionProvider, device = false): Promise<SubscriptionStatus> {
    try { this.requireEnabled(); } catch (error) { return Promise.reject(error); }
    const pending = this.loginStarts.get(provider); if (pending) return pending;
    const generation = this.loginGeneration.get(provider) || 0;
    const task = this.launchLogin(provider, device, generation).catch(async error => { await this.cancelLogin(provider); throw error; }).finally(() => { this.loginStarts.delete(provider); });
    this.loginStarts.set(provider, task);
    return task;
  }

  private async launchLogin(provider: SubscriptionProvider, device: boolean, generation: number): Promise<SubscriptionStatus> {
    if (this.closed) throw new Error('Obsidian subscription service stopped.');
    const existing = this.logins.get(provider);
    if (existing) return { state: existing.state, message: 'Finish signing in in your browser or terminal.', loginId: existing.id, command: existing.command };
    const executable = await this.resolve(provider);
    if (!this.enabled() || this.closed || generation !== (this.loginGeneration.get(provider) || 0)) throw new Error('Login cancelled.');
    const args = provider === 'openai' ? ['login', ...(device ? ['--device-auth'] : [])] : provider === 'anthropic' ? ['auth', 'login', '--claudeai'] : [];
    const quote = (value: string) => "'" + value.replace(/'/g, process.platform === 'win32' ? "''" : "'\\''") + "'";
    const command = (process.platform === 'win32' ? '& ' : '') + [executable, ...args].map(quote).join(' ');
    const login: Login = { id: randomBytes(16).toString('hex'), state: 'signing_in', command };
    this.logins.set(provider, login); this.failures.delete(provider); this.verified.delete(provider); this.usageCache = undefined;
    // A real terminal supports provider prompts and device codes without exposing auth output to Chrome.
    const directory = await mkdtemp(join(tmpdir(), 'nutegg-login-')); login.directory = directory;
    if (!this.enabled() || this.closed || generation !== (this.loginGeneration.get(provider) || 0)) { await rm(directory, { recursive: true, force: true }); throw new Error('Login cancelled.'); }
    const script = join(directory, process.platform === 'win32' ? 'login.ps1' : 'login.command');
    const unset = Object.keys(process.env).filter(key => /^[A-Za-z_][A-Za-z0-9_]*$/.test(key) && !(key in this.environment(provider)));
    const pidFile = join(directory, 'pid');
    const activeFile = join(directory, 'active');
    await writeFile(activeFile, 'active');
    const body = process.platform === 'win32'
      ? unset.map(key => `Remove-Item Env:${key} -ErrorAction SilentlyContinue`).join('\n')
        + `\nif (!(Test-Path ${quote(activeFile)})) { exit }\n$cliProcess = Start-Process -FilePath ${quote(executable)} ${args.length ? '-ArgumentList @(' + args.map(quote).join(',') + ')' : ''} -NoNewWindow -PassThru\n$cliProcess.Id | Set-Content ${quote(pidFile)}\nif (!(Test-Path ${quote(activeFile)})) { $cliProcess.Kill(); exit }\n$cliProcess.WaitForExit()\nRemove-Item ${quote(pidFile)} -ErrorAction SilentlyContinue\n`
      : '#!/bin/sh\n' + unset.map(key => `unset ${key}`).join('\n')
        + `\ncleanup() { rm -f ${quote(pidFile)}; }\ntrap cleanup EXIT\ntrap 'kill "$cli_pid" 2>/dev/null; exit' HUP INT TERM\n[ -f ${quote(activeFile)} ] || exit\n${[executable, ...args].map(quote).join(' ')} < /dev/tty &\ncli_pid=$!\necho "$cli_pid" > ${quote(pidFile)}\n[ -f ${quote(activeFile)} ] || { kill "$cli_pid" 2>/dev/null; exit; }\nwait "$cli_pid"\n`;
    await writeFile(script, body, { mode: 0o700 }); await chmod(script, 0o700);
    if (!this.enabled() || this.closed || generation !== (this.loginGeneration.get(provider) || 0)) { await this.cancelLogin(provider); throw new Error('Login cancelled.'); }
    let child: ChildProcess;
    if (process.platform === 'darwin') child = spawn('/usr/bin/open', ['-a', 'Terminal', script], { shell: false });
    else if (process.platform === 'win32') child = spawn('powershell.exe', ['-NoProfile', '-NoExit', '-File', script], { shell: false, windowsHide: false });
    else {
      let terminal = 'x-terminal-emulator';
      for (const candidate of ['x-terminal-emulator', 'gnome-terminal', 'konsole', 'xterm']) {
        try { terminal = await resolveSubscriptionCommand('codex', candidate); break; } catch {}
      }
      if (!this.enabled() || this.closed || generation !== (this.loginGeneration.get(provider) || 0)) { await this.cancelLogin(provider); throw new Error('Login cancelled.'); }
      child = spawn(terminal, terminal.endsWith('gnome-terminal') ? ['--', script] : ['-e', script], { shell: false });
    }
    login.child = child;
    child.on('error', () => { login.state = 'unverified'; });
    child.on('close', () => { login.state = 'unverified'; });
    login.timer = setTimeout(() => { void this.cancelLogin(provider); }, 10 * 60 * 1000);
    return { state: 'signing_in', message: 'Finish signing in in your browser or terminal, then check again.', loginId: login.id, command };
  }

  async cancelLogin(provider: SubscriptionProvider) {
    this.loginGeneration.set(provider, (this.loginGeneration.get(provider) || 0) + 1);
    const login = this.logins.get(provider); if (!login) return;
    clearTimeout(login.timer);
    if (login.directory) {
      await rm(join(login.directory, 'active'), { force: true });
      try {
        const pid = Number((await readFile(join(login.directory, 'pid'), 'utf8')).trim());
        if (Number.isSafeInteger(pid) && pid > 1) process.kill(pid, 'SIGTERM');
      } catch { /* The login process already exited, or terminal launch failed. */ }
    }
    login.child?.kill(); this.logins.delete(provider);
    if (login.directory) await rm(login.directory, { recursive: true, force: true });
  }
  async cancelWork() {
    for (const controller of this.controllers) controller.abort();
    for (const child of this.discovery) child.kill();
    await Promise.all([...new Set([...this.logins.keys(), ...this.loginStarts.keys()])].map(provider => this.cancelLogin(provider)));
    await Promise.allSettled([...this.loginStarts.values()]);
    await this.tail;
    this.usageCache = undefined;
    this.failures.clear();
  }
  async dispose() { this.closed = true; await this.cancelWork(); }

  clearModelFailure(provider: SubscriptionProvider) {
    if (this.failures.get(provider)?.errorCode === 'model_not_found') this.failures.delete(provider);
  }
}
