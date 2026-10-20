import { spawn, type ChildProcess } from 'node:child_process';
import { mkdtemp, writeFile, chmod, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { AIError, type AIErrorCode } from '../../shared/src/client';
import type { SubscriptionExecutor, SubscriptionProvider, SubscriptionStatus } from '../../shared/src/types';
import {
  checkSubscriptionCli,
  resolveSubscriptionCommand,
  runSubscription,
  subscriptionEnvironment,
} from './subscription-cli.mjs';
import { resolveAgyCommand, runGemini } from './subscription-gemini.mjs';

const cli = { openai: 'codex', anthropic: 'claude', google: 'agy' };
export function subscriptionErrorCode(error: { code?: string; status?: number }): AIErrorCode {
  if (error.code === 'invalid_response' || error.code === 'response_too_large') return error.code;
  if (error.status === 504) return 'timeout';
  if (error.status === 503) return 'cli_unavailable';
  if (error.status === 401) return 'auth_failed';
  if (error.status === 403) return 'forbidden';
  if (error.status === 429) return 'quota_exceeded';
  if (error.status === 400) return 'model_not_found';
  return 'server_error';
}
const docs: Record<SubscriptionProvider, string> = {
  openai: 'https://learn.chatgpt.com/docs/cli',
  anthropic: 'https://code.claude.com/docs/en/quickstart',
  google: 'https://antigravity.google/docs/cli/install',
};

type Login = {
  id: string;
  child?: ChildProcess;
  state: 'signing_in' | 'unverified';
  directory?: string;
  command: string;
  timer?: ReturnType<typeof setTimeout>;
};

export class SubscriptionService implements SubscriptionExecutor {
  private tail = Promise.resolve();
  private controllers = new Set<AbortController>();
  private logins = new Map<SubscriptionProvider, Login>();
  private verified = new Set<SubscriptionProvider>();
  private failures = new Map<SubscriptionProvider, { message: string; errorCode: string }>();
  private closed = false;
  private pending = 0;
  private modelCache = new Map<SubscriptionProvider, string[]>();
  private discovery = new Map<ChildProcess, () => void>();
  private stopping?: Promise<void>;
  private loginStarts = new Map<SubscriptionProvider, Promise<SubscriptionStatus>>();
  private usageCache?: { expires: number; value?: string; exhausted: boolean };
  private usageTask?: Promise<{ value?: string; exhausted: boolean }>;
  private loginGeneration = new Map<SubscriptionProvider, number>();
  constructor(
    private paths: Partial<Record<SubscriptionProvider, string>> = {},
    private enabled: () => boolean = () => false
  ) {}

  getRuntimeStatus() {
    return {
      active: this.enabled() && !this.closed,
      requests: this.pending,
      logins: new Set([...this.logins.keys(), ...this.loginStarts.keys()]).size,
      models: this.modelPending.size,
    };
  }
  private requireEnabled() {
    if (!this.enabled()) throw new AIError('forbidden', 'AI connection unavailable.');
    if (this.stopping) throw new AIError('cancelled', 'AI provider is changing. Retry shortly.');
  }

  resolve(provider: SubscriptionProvider) {
    return provider === 'google'
      ? resolveAgyCommand(this.paths[provider])
      : resolveSubscriptionCommand(cli[provider], this.paths[provider]);
  }

  private statusEpoch = 0;
  private statusCache = new Map<SubscriptionProvider, { at: number; value: SubscriptionStatus }>();
  private statusPending = new Map<SubscriptionProvider, Promise<SubscriptionStatus>>();
  async status(provider: SubscriptionProvider, force = false): Promise<SubscriptionStatus> {
    if (this.stopping) return { state: 'error', message: 'AI provider is changing. Retry shortly.' };
    const cached = this.statusCache.get(provider);
    if (!force && cached && Date.now() - cached.at < (cached.value.state === 'ready' ? 30000 : 5000))
      return cached.value;
    const pending = this.statusPending.get(provider);
    if (pending) return pending;
    const epoch = this.statusEpoch;
    const request = this.queryStatus(provider)
      .then(value => {
        if (epoch === this.statusEpoch) this.statusCache.set(provider, { at: Date.now(), value });
        return value;
      })
      .finally(() => {
        if (this.statusPending.get(provider) === request) this.statusPending.delete(provider);
      });
    this.statusPending.set(provider, request);
    return request;
  }
  private async queryStatus(provider: SubscriptionProvider): Promise<SubscriptionStatus> {
    const epoch = this.statusEpoch;
    if (!this.enabled()) return { state: 'disabled', message: 'AI connection unavailable.' };
    if (this.closed) return { state: 'error', message: 'Obsidian subscription service stopped.' };
    try {
      await this.resolve(provider);
    } catch {
      let installCmd: string;
      if (provider === 'openai') {
        installCmd = 'npm install -g @openai/codex';
      } else if (provider === 'anthropic') {
        installCmd =
          process.platform === 'win32'
            ? 'irm https://claude.ai/install.ps1 | iex'
            : 'curl -fsSL https://claude.ai/install.sh | bash';
      } else {
        installCmd =
          process.platform === 'win32'
            ? 'irm https://antigravity.google/cli/install.ps1 | iex'
            : 'curl -fsSL https://antigravity.google/cli/install.sh | bash';
      }
      return {
        state: 'missing',
        message: `Install ${cli[provider]} to continue.`,
        installUrl: docs[provider],
        installCommand: installCmd,
      };
    }
    if (!this.enabled()) return { state: 'disabled', message: 'AI connection unavailable.' };
    if (epoch !== this.statusEpoch || this.stopping)
      return { state: 'error', message: 'AI provider changed. Retry shortly.' };
    const login = this.logins.get(provider);
    if (provider !== 'google') {
      try {
        const controller = new AbortController();
        this.controllers.add(controller);
        try {
          await checkSubscriptionCli(cli[provider], this.paths[provider], { signal: controller.signal });
        } finally {
          this.controllers.delete(controller);
        }
        if (epoch !== this.statusEpoch) return { state: 'error', message: 'AI provider changed. Retry shortly.' };
        this.verified.add(provider);
        if (login) await this.cancelLogin(provider);
      } catch (error: any) {
        const isAuth401 = error.status === 401 && !this.verified.has(provider) && !this.failures.has(provider);
        return {
          state: login ? 'signing_in' : isAuth401 ? 'login_required' : 'error',
          message: login ? 'Finish signing in in your browser or terminal.' : error.message,
          errorCode: error.status === 401 ? 'auth_failed' : 'server_error',
          loginId: login?.id,
          command: login?.command,
        };
      }
    }
    const failure = this.failures.get(provider);
    if (failure) return { state: 'error', ...failure };
    if (provider === 'google' && !this.verified.has(provider)) {
      return {
        state: login?.state || 'unverified',
        message: login
          ? 'Finish signing in, then test connection.'
          : 'Sign-in needs verification. Test connection uses a small amount of subscription quota.',
        loginId: login?.id,
        command: login?.command,
      };
    }
    if (epoch !== this.statusEpoch || this.stopping)
      return { state: 'error', message: 'AI provider changed. Retry shortly.' };
    const usage = provider === 'openai' ? await this.codexUsage() : undefined;
    if (!this.enabled()) return { state: 'disabled', message: 'AI connection unavailable.' };
    if (usage?.exhausted) {
      return {
        state: 'error',
        errorCode: 'quota_exceeded',
        message: 'Subscription usage limit reached. Retry after the provider resets your limit.',
        usageRemaining: usage.value,
      };
    }
    return {
      state: 'ready',
      usageRemaining: usage?.value,
      message: `Connected through ${cli[provider]} · quota managed by your subscription`,
    };
  }

  async chat(
    provider: SubscriptionProvider,
    model: string,
    prompt: string,
    signal?: AbortSignal,
    onStart?: () => void
  ): Promise<string> {
    this.requireEnabled();
    if (this.closed) throw new AIError('server_error', 'Obsidian subscription service stopped.');
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,127}$/.test(model))
      throw new AIError('model_not_found', 'Invalid model ID. Choose another model.');
    if (this.pending >= 32) throw new AIError('rate_limited', 'Subscription queue is full. Retry shortly.');
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (signal?.aborted) controller.abort();
    signal?.addEventListener('abort', abort, { once: true });
    this.controllers.add(controller);
    this.pending++;
    const previous = this.tail;
    let release!: () => void;
    const gate = new Promise<void>(resolve => {
      release = resolve;
    });
    this.tail = previous.then(() => gate);
    try {
      await new Promise<void>((resolve, reject) => {
        const cancelled = () => {
          signal?.removeEventListener('abort', cancelled);
          reject(new AIError('cancelled', 'Subscription job cancelled.'));
        };
        signal?.addEventListener('abort', cancelled, { once: true });
        previous.then(() => {
          signal?.removeEventListener('abort', cancelled);
          resolve();
        });
        if (signal?.aborted) cancelled();
      });
      this.requireEnabled();
      if (controller.signal.aborted) throw new Error('Subscription request cancelled.');
      onStart?.();
      const options = { command: this.paths[provider], signal: controller.signal };
      const result =
        provider === 'google'
          ? await runGemini(prompt, model, options)
          : await runSubscription(cli[provider], prompt, model, options);
      this.verified.add(provider);
      this.failures.delete(provider);
      this.usageCache = undefined;
      this.statusCache.delete(provider);
      return result;
    } catch (error: any) {
      if (controller.signal.aborted) throw new AIError('cancelled', 'Subscription job cancelled.');
      const code = subscriptionErrorCode(error);
      const message = error.status === 400 ? `${error.message} Choose another model.` : error.message;
      this.failures.set(provider, { message, errorCode: code });
      this.statusCache.delete(provider);
      throw new AIError(code, message, error.status);
    } finally {
      release();
      this.pending--;
      this.controllers.delete(controller);
      signal?.removeEventListener('abort', abort);
    }
  }

  async test(provider: SubscriptionProvider, model: string) {
    await this.chat(provider, model, 'Reply with exactly OK.');
    await this.cancelLogin(provider);
    await this.models(provider, true);
    return this.status(provider, true);
  }

  private modelPending = new Map<SubscriptionProvider, Promise<string[]>>();
  private modelTimes = new Map<SubscriptionProvider, number>();
  async models(provider: SubscriptionProvider, force = false): Promise<string[]> {
    this.requireEnabled();
    if (!force && Date.now() - (this.modelTimes.get(provider) || 0) < 300000) {
      return this.modelCache.get(provider) || ['auto'];
    }
    const pending = this.modelPending.get(provider);
    if (pending) return pending;
    const epoch = this.statusEpoch;
    const request = this.discoverModels(provider)
      .then(models => {
        if (epoch === this.statusEpoch) this.modelTimes.set(provider, Date.now());
        return models;
      })
      .finally(() => {
        if (this.modelPending.get(provider) === request) this.modelPending.delete(provider);
      });
    this.modelPending.set(provider, request);
    return request;
  }
  private async discoverModels(provider: SubscriptionProvider): Promise<string[]> {
    const epoch = this.statusEpoch;
    this.requireEnabled();
    if (this.closed) return this.modelCache.get(provider) || ['auto'];
    try {
      let models: string[];
      if (provider === 'anthropic') models = ['sonnet', 'opus', 'haiku'];
      else if (provider === 'google') {
        const executable = await this.resolve(provider);
        this.requireEnabled();
        if (epoch !== this.statusEpoch) throw new Error('AI provider changed');
        if (this.closed) return this.modelCache.get(provider) || ['auto'];
        const output = await this.runDiscovery<string>(provider, executable, ['models'], 10000, (child, finish) => {
          child.stdin!.end();
          let text = '';
          child.stdout!.on('data', chunk => {
            text += chunk;
            if (text.length > 1024 * 1024) finish(new Error('Model list too large'));
          });
          child.on('close', code => finish(code === 0 ? undefined : new Error('Model discovery unavailable'), text));
        });
        const validModelRegex = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;
        models = [
          ...new Set(
            output
              .replace(/\x1b\[[0-9;]*m/g, '')
              .split(/\s+/)
              .filter(id => validModelRegex.test(id) && /gemini|claude|gpt|^auto$/.test(id))
          ),
        ];
      } else models = await this.codexModels();
      if (epoch === this.statusEpoch) this.modelCache.set(provider, ['auto', ...models.filter(id => id !== 'auto')]);
    } catch {
      /* Retain the last successful list; custom IDs always remain available. */
    }
    return this.modelCache.get(provider) || ['auto'];
  }

  private runDiscovery<T>(
    provider: SubscriptionProvider,
    executable: string,
    args: string[],
    timeoutMs: number,
    start: (child: ChildProcess, finish: (error?: Error, value?: T) => void) => void
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const child = spawn(executable, args, {
        env: this.environment(provider),
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: false,
      });
      let settled = false;
      const finish = (error?: Error, value?: T) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        this.discovery.delete(child);
        // A CLI (or inherited pipe) need not emit close after SIGTERM. Settle
        // explicitly and stop our read-only probe without waiting for close.
        child.kill('SIGKILL');
        child.stdin?.destroy();
        child.stdout?.destroy();
        child.stderr?.destroy();
        if (error) reject(error);
        else resolve(value as T);
      };
      const timer = setTimeout(() => finish(new Error('Subscription check timed out')), timeoutMs);
      this.discovery.set(child, () => finish(new Error('Subscription check cancelled')));
      child.stdin!.on('error', () => {});
      child.stderr!.resume();
      child.on('error', error => finish(error));
      try {
        start(child, finish);
      } catch (error) {
        finish(error as Error);
      }
      child.on('close', () => finish(new Error('Subscription check unavailable')));
    });
  }

  private async codexModels(): Promise<string[]> {
    const epoch = this.statusEpoch;
    const executable = await this.resolve('openai');
    this.requireEnabled();
    if (this.closed || epoch !== this.statusEpoch) throw new Error('Obsidian subscription service stopped.');
    return this.runDiscovery<string[]>('openai', executable, ['app-server'], 10000, (child, finish) => {
      let buffer = '',
        models: string[] = [],
        pages = 0,
        total = 0;
      const send = (data: unknown) => child.stdin!.write(JSON.stringify(data) + '\n');
      child.stdout!.on('data', chunk => {
        total += chunk.length;
        buffer += chunk;
        if (total > 1024 * 1024) {
          finish(new Error('Model list too large'));
          return;
        }
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          try {
            const message = JSON.parse(line);
            if (message.error) {
              finish(new Error('Model discovery unavailable'));
              return;
            }
            if (message.id === 1) {
              send({ method: 'initialized' });
              send({ id: 2, method: 'model/list', params: {} });
            }
            if (message.id === 2) {
              if (!Array.isArray(message.result?.data)) {
                finish(new Error('Invalid model list'));
                return;
              }
              models.push(
                ...message.result.data.map((m: any) => m.model || m.id).filter((id: unknown) => typeof id === 'string')
              );
              if (message.result?.nextCursor && ++pages < 20)
                send({ id: 2, method: 'model/list', params: { cursor: message.result.nextCursor } });
              else {
                finish(undefined, models);
                return;
              }
            }
          } catch {
            /* Ignore non-protocol log lines. */
          }
        }
      });
      send({ id: 1, method: 'initialize', params: { clientInfo: { name: 'nutegg', version: '1' } } });
    });
  }

  private codexUsage(): Promise<{ value?: string; exhausted: boolean }> {
    if (this.usageCache && this.usageCache.expires > Date.now()) return Promise.resolve(this.usageCache);
    if (this.usageTask) return this.usageTask;
    this.usageTask = (async () => {
      const epoch = this.statusEpoch;
      const fallback = { exhausted: false };
      try {
        const executable = await this.resolve('openai');
        this.requireEnabled();
        if (this.closed || epoch !== this.statusEpoch) return fallback;
        const result = await this.runDiscovery<any>('openai', executable, ['app-server'], 5000, (child, finish) => {
          let buffer = '',
            total = 0;
          const send = (message: unknown) => child.stdin!.write(JSON.stringify(message) + '\n');
          child.stdout!.on('data', chunk => {
            total += chunk.length;
            buffer += chunk;
            if (total > 1024 * 1024) {
              finish(new Error('Usage response too large'));
              return;
            }
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines)
              try {
                const message = JSON.parse(line);
                if (message.error) {
                  finish(new Error('Usage unavailable'));
                  return;
                }
                if (message.id === 1 && !message.error) {
                  send({ method: 'initialized' });
                  send({ id: 2, method: 'account/rateLimits/read' });
                }
                if (message.id === 2) {
                  finish(undefined, message.result);
                  return;
                }
              } catch {}
          });
          send({ id: 1, method: 'initialize', params: { clientInfo: { name: 'nutegg', version: '1' } } });
        });
        const bucket = result?.rateLimitsByLimitId?.codex || result?.rateLimits;
        const windows = [bucket?.primary, bucket?.secondary].filter(window => Number.isFinite(window?.usedPercent));
        const value =
          windows
            .map(window => {
              const pct = Math.max(0, Math.min(100, 100 - window.usedPercent));
              const dur =
                window.windowDurationMins >= 1440
                  ? `${Math.round(window.windowDurationMins / 1440)}d`
                  : window.windowDurationMins >= 60
                    ? `${window.windowDurationMins / 60}h`
                    : `${window.windowDurationMins || '?'}m`;
              return `${pct}% left (${dur})`;
            })
            .join(' · ') || undefined;
        const usage = {
          value,
          exhausted: windows.some(window => window.usedPercent >= 100) || !!bucket?.rateLimitReachedType,
        };
        if (epoch === this.statusEpoch) this.usageCache = { ...usage, expires: Date.now() + 30000 };
        return usage;
      } catch {
        if (epoch === this.statusEpoch) this.usageCache = { ...fallback, expires: Date.now() + 30000 };
        return fallback;
      }
    })().finally(() => {
      this.usageTask = undefined;
    });
    return this.usageTask;
  }

  private environment(provider: SubscriptionProvider) {
    if (provider !== 'google') return subscriptionEnvironment(cli[provider]);
    const env = { ...process.env };
    for (const key of [
      'GEMINI_API_KEY',
      'GOOGLE_API_KEY',
      'GOOGLE_GENAI_USE_VERTEXAI',
      'GOOGLE_APPLICATION_CREDENTIALS',
      'GOOGLE_GEMINI_BASE_URL',
    ]) {
      delete env[key];
    }
    return env;
  }

  startLogin(provider: SubscriptionProvider, device = false): Promise<SubscriptionStatus> {
    try {
      this.requireEnabled();
    } catch (error) {
      return Promise.reject(error);
    }
    const pending = this.loginStarts.get(provider);
    if (pending) return pending;
    const generation = this.loginGeneration.get(provider) || 0;
    const task = this.launchLogin(provider, device, generation)
      .catch(async error => {
        await this.cancelLogin(provider);
        throw error;
      })
      .finally(() => {
        this.loginStarts.delete(provider);
      });
    this.loginStarts.set(provider, task);
    return task;
  }

  private async launchLogin(
    provider: SubscriptionProvider,
    device: boolean,
    generation: number
  ): Promise<SubscriptionStatus> {
    if (this.closed) throw new Error('Obsidian subscription service stopped.');
    const existing = this.logins.get(provider);
    if (existing) {
      return {
        state: existing.state,
        message: 'Finish signing in in your browser or terminal.',
        loginId: existing.id,
        command: existing.command,
      };
    }
    const executable = await this.resolve(provider);
    if (!this.enabled() || this.closed || generation !== (this.loginGeneration.get(provider) || 0)) {
      throw new Error('Login cancelled.');
    }
    const args =
      provider === 'openai'
        ? ['login', ...(device ? ['--device-auth'] : [])]
        : provider === 'anthropic'
          ? ['auth', 'login', '--claudeai']
          : [];
    const quote = (value: string) => "'" + value.replace(/'/g, process.platform === 'win32' ? "''" : "'\\''") + "'";
    const command = (process.platform === 'win32' ? '& ' : '') + [executable, ...args].map(quote).join(' ');
    const login: Login = { id: randomBytes(16).toString('hex'), state: 'signing_in', command };
    this.logins.set(provider, login);
    this.failures.delete(provider);
    this.verified.delete(provider);
    this.usageCache = undefined;
    // A real terminal supports provider prompts and device codes without exposing auth output to Chrome.
    const directory = await mkdtemp(join(tmpdir(), 'nutegg-login-'));
    login.directory = directory;
    if (!this.enabled() || this.closed || generation !== (this.loginGeneration.get(provider) || 0)) {
      await rm(directory, { recursive: true, force: true });
      throw new Error('Login cancelled.');
    }
    const script = join(directory, process.platform === 'win32' ? 'login.ps1' : `nutegg-login-${login.id}.command`);
    const unset = Object.keys(process.env).filter(
      key => /^[A-Za-z_][A-Za-z0-9_]*$/.test(key) && !(key in this.environment(provider))
    );
    const pidFile = join(directory, 'pid');
    const activeFile = join(directory, 'active');
    await writeFile(activeFile, 'active');
    const body =
      process.platform === 'win32'
        ? unset.map(key => `Remove-Item Env:${key} -ErrorAction SilentlyContinue`).join('\n') +
          `\nif (!(Test-Path ${quote(activeFile)})) { exit }\n` +
          `$cliProcess = Start-Process -FilePath ${quote(executable)} ` +
          `${args.length ? '-ArgumentList @(' + args.map(quote).join(',') + ')' : ''} -NoNewWindow -PassThru\n` +
          `$cliProcess.Id | Set-Content ${quote(pidFile)}\n` +
          `if (!(Test-Path ${quote(activeFile)})) { $cliProcess.Kill(); exit }\n` +
          `$cliProcess.WaitForExit()\n` +
          `Remove-Item ${quote(pidFile)} -ErrorAction SilentlyContinue\n` +
          `if ($cliProcess.ExitCode -eq 0) { exit 0 }\n`
        : '#!/bin/sh\n' +
          unset.map(key => `unset ${key}`).join('\n') +
          `\ncleanup() { rm -f ${quote(pidFile)}; }\n` +
          `trap cleanup EXIT\n` +
          `trap 'kill "$cli_pid" 2>/dev/null; exit' HUP INT TERM\n` +
          `[ -f ${quote(activeFile)} ] || exit\n` +
          `${[executable, ...args].map(quote).join(' ')} < /dev/tty &\n` +
          `cli_pid=$!\n` +
          `echo "$cli_pid" > ${quote(pidFile)}\n` +
          `[ -f ${quote(activeFile)} ] || { kill "$cli_pid" 2>/dev/null; exit; }\n` +
          `wait "$cli_pid"\n` +
          `cli_status=$?\n` +
          `if [ $cli_status -eq 0 ]; then\n` +
          `  osascript -e 'tell application "Terminal" to close (every window whose name contains "nutegg-login-${login.id}.command")' 2>/dev/null &\n` +
          `  exit 0\n` +
          `fi\n`;
    await writeFile(script, body, { mode: 0o700 });
    await chmod(script, 0o700);
    if (!this.enabled() || this.closed || generation !== (this.loginGeneration.get(provider) || 0)) {
      await this.cancelLogin(provider);
      throw new Error('Login cancelled.');
    }
    let child: ChildProcess;
    if (process.platform === 'darwin') {
      child = spawn('/usr/bin/open', ['-a', 'Terminal', script], { shell: false });
    } else if (process.platform === 'win32') {
      child = spawn('powershell.exe', ['-NoProfile', '-File', script], { shell: false, windowsHide: false });
    } else {
      let terminal = 'x-terminal-emulator';
      for (const candidate of ['x-terminal-emulator', 'gnome-terminal', 'konsole', 'xterm']) {
        try {
          terminal = await resolveSubscriptionCommand('codex', candidate);
          break;
        } catch {}
      }
      if (!this.enabled() || this.closed || generation !== (this.loginGeneration.get(provider) || 0)) {
        await this.cancelLogin(provider);
        throw new Error('Login cancelled.');
      }
      child = spawn(terminal, terminal.endsWith('gnome-terminal') ? ['--', script] : ['-e', script], { shell: false });
    }
    login.child = child;
    child.on('error', () => {
      login.state = 'unverified';
    });
    child.on('close', () => {
      login.state = 'unverified';
    });
    login.timer = setTimeout(
      () => {
        void this.cancelLogin(provider);
      },
      10 * 60 * 1000
    );
    return {
      state: 'signing_in',
      message: 'Finish signing in in your browser or terminal, then check again.',
      loginId: login.id,
      command,
    };
  }

  async cancelLogin(provider: SubscriptionProvider) {
    this.loginGeneration.set(provider, (this.loginGeneration.get(provider) || 0) + 1);
    const login = this.logins.get(provider);
    if (!login) return;
    clearTimeout(login.timer);
    if (login.directory) {
      await rm(join(login.directory, 'active'), { force: true });
      try {
        const pid = Number((await readFile(join(login.directory, 'pid'), 'utf8')).trim());
        if (Number.isSafeInteger(pid) && pid > 1) process.kill(pid, 'SIGTERM');
      } catch {
        /* The login process already exited, or terminal launch failed. */
      }
    }
    if (process.platform === 'darwin' && login.directory) {
      try {
        const osaCmd = `tell application "Terminal" to close (every window whose name contains "nutegg-login-${login.id}.command")`;
        spawn('/usr/bin/osascript', ['-e', osaCmd], { stdio: 'ignore' });
      } catch {}
    }
    login.child?.kill();
    this.logins.delete(provider);
    if (login.directory) await rm(login.directory, { recursive: true, force: true });
  }
  cancelWork(): Promise<void> {
    if (this.stopping) return this.stopping;
    this.stopping = this.drainWork().finally(() => {
      this.stopping = undefined;
    });
    return this.stopping;
  }
  private async drainWork() {
    this.statusEpoch++;
    this.statusCache.clear();
    for (const controller of this.controllers) controller.abort();
    for (const cancel of this.discovery.values()) cancel();
    await Promise.all(
      [...new Set([...this.logins.keys(), ...this.loginStarts.keys()])].map(provider => this.cancelLogin(provider))
    );
    await Promise.allSettled([...this.loginStarts.values()]);
    await this.tail;
    await Promise.allSettled([...this.statusPending.values(), ...this.modelPending.values()]);
    this.statusCache.clear();
    this.usageCache = undefined;
    this.failures.clear();
  }
  async dispose() {
    this.closed = true;
    await this.cancelWork();
  }

  clearModelFailure(provider: SubscriptionProvider) {
    if (this.failures.get(provider)?.errorCode === 'model_not_found') {
      this.failures.delete(provider);
      this.statusCache.delete(provider);
    }
  }
}
