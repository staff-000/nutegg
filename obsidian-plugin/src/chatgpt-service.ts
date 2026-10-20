import { t } from './i18n';
import * as http from 'node:http';
import { createHash, randomBytes, createPublicKey, verify } from 'node:crypto';
import { AIError } from '../../shared/src/client';
import type { ChatGPTConnection } from '../../shared/src/types';
import type { ChatGPTCredentials, ChatGPTStore } from './chatgpt-store';
import { chatgptFetch } from './chatgpt-http';

const AUTH = 'https://auth.openai.com';
const RESOURCE = 'https://api.openai.com/v1';
const TOKEN = `${AUTH}/api/accounts/oauth/token`;
const PERMISSION = 'chatgpt.tokens.use.direct';
const SCOPES = `openid profile email offline_access resource.invoke ${PERMISSION}`;
const random = () => randomBytes(32).toString('base64url');
type Model = { slug: string; displayName: string };
type Options = {
  fetch?: typeof fetch;
  openBrowser: (url: string) => void | Promise<void>;
  now?: () => number;
  authTimeoutMs?: number;
  requestTimeoutMs?: number;
};

/** The public snapshot is an explicit allowlist. OAuth responses never cross the local bridge. */
export class ChatGPTService {
  private credentials?: ChatGPTCredentials;
  private connectionState: ChatGPTConnection['state'] = 'signed_out';
  private revision = 1;
  private listeners = new Set<() => void>();
  private active = new Set<AbortController>();
  private login?: {
    controller: AbortController;
    server: http.Server;
    timer: ReturnType<typeof setTimeout>;
    nonce: string;
    state: string;
    verifier: string;
    redirect: string;
    accepted: boolean;
    clientId?: string;
  };
  private refresh?: Promise<ChatGPTCredentials>;
  private signingOut?: Promise<ChatGPTConnection>;
  private modelRequest?: Promise<Model[]>;
  private catalog: Model[] = [];
  private catalogAt = 0;
  private model = '';
  private selectionInvalid = false;
  private disposed = false;
  private message = '';
  private fetcher: typeof fetch;
  private now: () => number;
  private epoch = 0;

  constructor(
    private store: ChatGPTStore,
    private options: Options
  ) {
    this.fetcher = options.fetch || chatgptFetch;
    this.now = options.now || Date.now;
    this.credentials = store.load();
    this.connectionState = this.credentials?.refreshToken
      ? this.credentials.scopes.includes(PERMISSION)
        ? 'ready'
        : 'permission_missing'
      : 'signed_out';
  }
  onChange(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  status(): ChatGPTConnection {
    return {
      available: !this.disposed,
      state: this.connectionState,
      revision: this.revision,
      accountLabel: this.credentials?.email || '',
      model: this.model,
      message: this.message,
    };
  }
  private emit(invalidate = false) {
    if (invalidate) ++this.revision;
    for (const listener of this.listeners) listener();
  }
  private assert(epoch: number, signal?: AbortSignal) {
    if (this.disposed || this.epoch !== epoch || signal?.aborted)
      throw new AIError('cancelled', t('chatgptRequestCancelled'));
  }
  private async request(
    url: string,
    init: RequestInit = {},
    signal?: AbortSignal,
    timeoutMs = this.options.requestTimeoutMs || 15000
  ) {
    if (this.disposed || signal?.aborted) throw new AIError('cancelled', t('chatgptRequestCancelled'));
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) controller.abort();
    const timer = setTimeout(abort, timeoutMs);
    this.active.add(controller);
    const cleanup = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      this.active.delete(controller);
      controller.abort();
    };
    try {
      const response = await this.fetcher(url, { ...init, signal: controller.signal, redirect: 'error' });
      return { response, cleanup, signal: controller.signal };
    } catch {
      const wasAborted = controller.signal.aborted;
      cleanup();
      if (signal?.aborted || this.disposed) throw new AIError('cancelled', t('chatgptRequestCancelled'));
      if (wasAborted) throw new AIError('timeout', t('chatgptRequestTimeout'));
      throw new AIError('network_error', t('chatgptNetworkFailed'));
    }
  }
  private error(status: number) {
    if (status === 401 || status === 403) return new AIError('auth_failed', t('chatgptReconnectPermission'));
    if (status === 429) return new AIError('rate_limited', t('chatgptUsageLimit'));
    if (status === 404) return new AIError('model_not_found', t('chatgptModelUnavailable'));
    return new AIError('server_error', t('chatgptOpenaiRequestFailed'));
  }
  private async json(url: string, init: RequestInit = {}, signal?: AbortSignal) {
    const call = await this.request(url, init, signal);
    try {
      if (!call.response.ok) throw this.error(call.response.status);
      const value = await call.response.json();
      if (!value || typeof value !== 'object' || Array.isArray(value))
        throw new AIError('server_error', t('chatgptInvalidOpenaiResponse'));
      return value as any;
    } finally {
      call.cleanup();
    }
  }
  private async token(form: URLSearchParams, signal?: AbortSignal) {
    return this.json(
      TOKEN,
      { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form.toString() },
      signal
    );
  }
  private tokenRecord(data: any, previous: ChatGPTCredentials): ChatGPTCredentials {
    if (
      typeof data.access_token !== 'string' ||
      !data.access_token ||
      !Number.isFinite(data.expires_in) ||
      data.expires_in <= 0 ||
      data.token_type?.toLowerCase() !== 'bearer'
    )
      throw new AIError('auth_failed', t('chatgptInvalidAuthorization'));
    if (!previous.refreshToken && (typeof data.refresh_token !== 'string' || !data.refresh_token))
      throw new AIError('auth_failed', t('chatgptOfflineAccessMissing'));
    return {
      ...previous,
      accessToken: data.access_token,
      refreshToken: typeof data.refresh_token === 'string' ? data.refresh_token : previous.refreshToken,
      idToken: typeof data.id_token === 'string' ? data.id_token : previous.idToken,
      scopes: typeof data.scope === 'string' ? data.scope.split(/\s+/).filter(Boolean) : previous.scopes,
      expiresAt: this.now() + data.expires_in * 1000,
      earliestRefreshAt: typeof data.earliest_refresh_at === 'number' ? data.earliest_refresh_at * 1000 : undefined,
    };
  }
  private async identity(jwt: string, clientId: string, nonce: string, signal: AbortSignal) {
    try {
      const parts = jwt.split('.');
      if (parts.length !== 3) throw new Error();
      const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
      const claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      if (header.alg !== 'RS256' || typeof header.kid !== 'string') throw new Error();
      const discovery = await this.json(`${AUTH}/.well-known/openid-configuration`, {}, signal);
      const jwksUrl = new URL(discovery.jwks_uri);
      if (discovery.issuer !== AUTH || jwksUrl.origin !== AUTH || jwksUrl.protocol !== 'https:') throw new Error();
      const jwks = await this.json(jwksUrl.href, {}, signal);
      const key = jwks.keys?.find(
        (key: any) =>
          key.kid === header.kid &&
          key.kty === 'RSA' &&
          (!key.use || key.use === 'sig') &&
          (!key.alg || key.alg === 'RS256')
      );
      if (
        !key ||
        !verify(
          'RSA-SHA256',
          Buffer.from(`${parts[0]}.${parts[1]}`),
          createPublicKey({ key, format: 'jwk' }),
          Buffer.from(parts[2], 'base64url')
        )
      )
        throw new Error();
      const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
      if (
        claims.iss !== AUTH ||
        !audience.includes(clientId) ||
        (audience.length > 1 && claims.azp !== clientId) ||
        !Number.isFinite(claims.exp) ||
        claims.exp * 1000 <= this.now() ||
        claims.nonce !== nonce ||
        typeof claims.sub !== 'string' ||
        !claims.sub ||
        (claims.nbf && claims.nbf * 1000 > this.now() + 30000)
      )
        throw new Error();
      return { subject: claims.sub, email: typeof claims.email === 'string' ? claims.email : '' };
    } catch (error) {
      if (signal.aborted) throw new AIError('cancelled', t('chatgptSignInCancelled'));
      throw new AIError('auth_failed', t('chatgptIdentityVerificationFailed'));
    }
  }
  async signIn(): Promise<ChatGPTConnection> {
    if (this.signingOut) {
      await this.signingOut;
      return this.signIn();
    }
    if (this.login) return this.status();
    if (this.disposed) throw new AIError('cancelled', t('chatgptServiceStopped'));
    if (this.credentials?.accessToken && this.connectionState === 'ready') return this.status();
    ++this.epoch;
    this.cancelWork();
    this.refresh = undefined;
    this.modelRequest = undefined;
    const controller = new AbortController();
    const server = http.createServer((req, res) => {
      void this.callback(req, res);
    });
    const login = {
      controller,
      server,
      timer: undefined as any,
      state: random(),
      nonce: random(),
      verifier: random(),
      redirect: '',
      accepted: false,
      clientId: this.credentials?.clientId,
    };
    this.login = login;
    this.connectionState = 'signing_in';
    this.message = '';
    this.emit();
    try {
      await new Promise<void>((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', () => resolve());
      });
      if (controller.signal.aborted || this.login !== login) {
        server.close();
        server.closeAllConnections();
        return this.status();
      }
      this.assert(this.epoch, controller.signal);
      login.redirect = `http://127.0.0.1:${(server.address() as any).port}/auth/callback`;
      login.timer = setTimeout(
        () => this.finishLogin(login, 'error', 'ChatGPT sign-in timed out. Try again.'),
        this.options.authTimeoutMs || 300000
      );
      const params = new URLSearchParams({
        client_id: login.clientId || 'dynamic_agent_client',
        ext_agent_host_id: this.store.hostId,
        response_type: 'code',
        redirect_uri: login.redirect,
        scope: SCOPES,
        resource: RESOURCE,
        state: login.state,
        nonce: login.nonce,
        code_challenge_method: 'S256',
        code_challenge: createHash('sha256').update(login.verifier).digest('base64url'),
      });
      if (!login.clientId) params.set('agent_name_hint', 'NutEgg');
      if (this.credentials?.idToken) params.set('id_token_hint', this.credentials.idToken);
      // Explicit reauthorization can ask again when plan access was previously declined.
      if (this.credentials?.scopes && !this.credentials.scopes.includes(PERMISSION)) params.set('prompt', 'consent');
      await this.options.openBrowser(`${AUTH}/api/accounts/authorize?${params}`);
      return this.status();
    } catch {
      this.finishLogin(login, 'error', t('chatgptOpenFailed'));
      return this.status();
    }
  }
  private async callback(req: http.IncomingMessage, res: http.ServerResponse) {
    const login = this.login;
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    if (!login || !login.redirect || req.method !== 'GET' || req.headers.host !== new URL(login.redirect).host) {
      res.writeHead(400);
      res.end(t('chatgptInvalidSignInCallback'));
      return;
    }
    let url: URL;
    try {
      url = new URL(req.url || '/', login.redirect);
    } catch {
      res.writeHead(400);
      res.end(t('chatgptInvalidCallback'));
      return;
    }
    if (
      url.pathname !== '/auth/callback' ||
      url.searchParams.getAll('state').length !== 1 ||
      url.searchParams.get('state') !== login.state ||
      login.accepted
    ) {
      res.writeHead(400);
      res.end(t('chatgptExpiredCallback'));
      return;
    }
    login.accepted = true;
    res.end(t('chatgptReturnToApp'));
    const epoch = this.epoch;
    try {
      if (url.searchParams.has('error')) throw new AIError('auth_failed', t('chatgptSignInDeclined'));
      const issued = url.searchParams.get('client_id');
      if (login.clientId && issued && issued !== login.clientId)
        throw new AIError('auth_failed', t('chatgptRegistrationMismatch'));
      const clientId = issued || login.clientId;
      const code = url.searchParams.get('code');
      if (
        !clientId ||
        clientId === 'dynamic_agent_client' ||
        !/^[-\w]{1,256}$/.test(clientId) ||
        !code ||
        code.length > 8192
      )
        throw new AIError('auth_failed', t('chatgptRegistrationIncomplete'));
      this.assert(epoch, login.controller.signal);
      // Retain issued registration even if this authorization code later expires.
      const registration: ChatGPTCredentials = this.credentials || { clientId, scopes: [], expiresAt: 0 };
      this.store.save(registration);
      this.credentials = registration;
      const data = await this.token(
        new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: clientId,
          code,
          code_verifier: login.verifier,
          redirect_uri: login.redirect,
          resource: RESOURCE,
        }),
        login.controller.signal
      );
      this.assert(epoch, login.controller.signal);
      if (typeof data.id_token !== 'string') throw new AIError('auth_failed', t('chatgptIdentityMissing'));
      const identity = await this.identity(data.id_token, clientId, login.nonce, login.controller.signal);
      if (registration.subject && registration.subject !== identity.subject)
        throw new AIError('auth_failed', t('chatgptSignOutFirst'));
      const record = this.tokenRecord(data, { ...registration, ...identity, scopes: [] });
      this.assert(epoch, login.controller.signal);
      if (this.login !== login) return;
      this.store.save(record);
      this.credentials = record;
      this.catalog = [];
      this.catalogAt = 0;
      this.selectionInvalid = false;
      const state = record.scopes.includes(PERMISSION) ? 'ready' : 'permission_missing';
      this.finishLogin(login, state, '', true);
      if (state === 'ready') await this.models();
    } catch (error) {
      if (this.login === login)
        this.finishLogin(login, 'error', error instanceof AIError ? error.message : t('chatgptSaveFailed'));
      else if (this.epoch === epoch && !this.disposed && error instanceof AIError && error.code !== 'cancelled') {
        this.message = error.message;
        this.emit();
      }
    }
  }
  private finishLogin(
    login: NonNullable<ChatGPTService['login']>,
    state: ChatGPTConnection['state'],
    message = '',
    invalidate = false
  ) {
    if (this.login !== login) return;
    this.login = undefined;
    clearTimeout(login.timer);
    login.controller.abort();
    login.server.close();
    login.server.closeAllConnections();
    this.connectionState = state;
    this.message = message;
    this.emit(invalidate);
  }
  cancelSignIn() {
    if (this.login)
      this.finishLogin(
        this.login,
        this.credentials?.accessToken
          ? this.credentials.scopes.includes(PERMISSION)
            ? 'ready'
            : 'permission_missing'
          : 'signed_out'
      );
    return this.status();
  }
  private async access(signal?: AbortSignal) {
    if (this.connectionState !== 'ready') throw new AIError('auth_failed', t('chatgptAllowPlanUsage'));
    const record = this.credentials;
    if (!record?.refreshToken || !record.scopes.includes(PERMISSION))
      throw new AIError('auth_failed', t('chatgptAllowPlanUsage'));
    if (record.accessToken && record.expiresAt > this.now() + 60000) return record;
    if (!this.refresh) {
      const epoch = this.epoch;
      const task = (async () => {
        try {
          if (record.earliestRefreshAt && record.earliestRefreshAt > this.now()) {
            if (record.accessToken && record.expiresAt > this.now()) return record;
            throw new AIError('auth_failed', t('chatgptRefreshUnavailable'));
          }
          const data = await this.token(
            new URLSearchParams({
              grant_type: 'refresh_token',
              client_id: record.clientId,
              refresh_token: record.refreshToken!,
              resource: RESOURCE,
            })
          );
          this.assert(epoch);
          const next = this.tokenRecord(data, record);
          this.store.save(next);
          this.credentials = next;
          this.connectionState = next.scopes.includes(PERMISSION) ? 'ready' : 'permission_missing';
          if (this.connectionState !== 'ready') {
            this.emit(true);
            throw new AIError('auth_failed', t('chatgptPlanPermissionMissing'));
          }
          this.emit();
          return next;
        } catch (error) {
          if (
            epoch === this.epoch &&
            !this.disposed &&
            error instanceof AIError &&
            error.code === 'auth_failed' &&
            this.connectionState !== 'permission_missing'
          ) {
            this.connectionState = 'reauthorization_required';
            this.emit(true);
          }
          throw error;
        }
      })();
      this.refresh = task;
      void task
        .finally(() => {
          if (this.refresh === task) this.refresh = undefined;
        })
        .catch(() => {});
    }
    if (!signal) return this.refresh;
    return new Promise<ChatGPTCredentials>((resolve, reject) => {
      const abort = () => reject(new AIError('cancelled', t('chatgptRequestCancelled')));
      if (signal.aborted) {
        abort();
        return;
      }
      signal.addEventListener('abort', abort, { once: true });
      this.refresh!.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
    });
  }
  async models(force = false): Promise<Model[]> {
    if (!force && this.catalogAt && this.now() - this.catalogAt < 300000) return [...this.catalog];
    if (this.modelRequest) return this.modelRequest;
    const epoch = this.epoch;
    const task = (async () => {
      const record = await this.access();
      this.assert(epoch);
      const data = await this.json(`${RESOURCE}/models`, {
        headers: { Authorization: `Bearer ${record.accessToken}` },
      });
      this.assert(epoch);
      if (!Array.isArray(data.models)) throw new AIError('server_error', t('chatgptInvalidModelCatalog'));
      this.catalog = data.models
        .filter(
          (m: any) => m?.visibility === 'list' && typeof m.slug === 'string' && /^[\w][\w.:/-]{0,127}$/.test(m.slug)
        )
        .map((m: any) => ({ slug: m.slug, displayName: typeof m.display_name === 'string' ? m.display_name : m.slug }));
      this.catalogAt = this.now();
      if (!this.catalog.length) this.message = t('chatgptNoModels');
      if (this.model && !this.catalog.some(m => m.slug === this.model)) {
        this.model = '';
        this.selectionInvalid = true;
        this.message = t('chatgptSelectAvailable');
        this.emit(true);
      } else if (!this.model && !this.selectionInvalid && this.catalog.length) {
        this.model = this.catalog[0].slug;
        this.emit(true);
      } else this.emit();
      return [...this.catalog];
    })();
    this.modelRequest = task;
    try {
      return await task;
    } finally {
      if (this.modelRequest === task) this.modelRequest = undefined;
    }
  }
  restoreModel(model: string) {
    if (typeof model === 'string' && /^[\w][\w.:/-]{0,127}$/.test(model)) this.model = model;
  }
  selectModel(model: string) {
    if (!this.catalog.some(m => m.slug === model)) throw new AIError('model_not_found', t('chatgptSelectAvailable'));
    if (this.model !== model) {
      this.model = model;
      this.selectionInvalid = false;
      this.message = '';
      this.emit(true);
    }
    return this.status();
  }
  async chat(model: string, prompt: string, signal?: AbortSignal): Promise<string> {
    const epoch = this.epoch;
    const record = await this.access(signal);
    this.assert(epoch, signal);
    if (!model || !/^[\w][\w.:/-]{0,127}$/.test(model))
      throw new AIError('model_not_found', t('chatgptChooseModelSettings'));
    const call = await this.request(
      `${RESOURCE}/responses`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${record.accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, input: [{ role: 'user', content: prompt }], store: false, stream: true }),
      },
      signal,
      180000
    );
    try {
      if (!call.response.ok) {
        if (call.response.status === 401) {
          this.connectionState = 'reauthorization_required';
          this.emit(true);
        }
        throw this.error(call.response.status);
      }
      if (!call.response.body) throw new AIError('server_error', t('chatgptEmptyStream'));
      const reader = call.response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let result = '';
      let completed = false;
      const event = (block: string) => {
        const data = block
          .split('\n')
          .filter(line => line.startsWith('data:'))
          .map(line => line.slice(5).trimStart())
          .join('\n');
        if (!data || data === '[DONE]') return;
        let value: any;
        try {
          value = JSON.parse(data);
        } catch {
          throw new AIError('server_error', t('chatgptInvalidStream'));
        }
        if (value.type === 'response.output_text.delta' && typeof value.delta === 'string') result += value.delta;
        if (value.type === 'response.completed') {
          if (value.response?.status !== 'completed') throw new AIError('server_error', t('chatgptIncompleteResponse'));
          completed = true;
          if (!result && Array.isArray(value.response.output))
            result = value.response.output
              .flatMap((item: any) =>
                item.type === 'message' && item.role === 'assistant' && Array.isArray(item.content)
                  ? item.content
                      .filter((part: any) => part.type === 'output_text' && typeof part.text === 'string')
                      .map((part: any) => part.text)
                  : []
              )
              .join('');
        }
        if (['error', 'response.failed', 'response.incomplete'].includes(value.type))
          throw new AIError('server_error', t('chatgptResponseFailed'));
      };
      try {
        while (!completed) {
          this.assert(epoch, signal);
          const { value, done } = await reader.read();
          buffer += decoder.decode(value, { stream: !done });
          // SSE permits CRLF; normalize only after retaining a partial trailing CR.
          buffer = buffer.replace(/\r\n/g, '\n');
          let boundary: number;
          while ((boundary = buffer.indexOf('\n\n')) >= 0) {
            event(buffer.slice(0, boundary));
            buffer = buffer.slice(boundary + 2);
          }
          if (buffer.length > 8 * 1024 * 1024 || result.length > 16 * 1024 * 1024)
            throw new AIError('server_error', t('chatgptResponseTooLarge'));
          if (done) {
            if (buffer.trim()) event(buffer);
            break;
          }
        }
        this.assert(epoch, signal);
        if (!completed || !result.trim()) throw new AIError('server_error', t('chatgptEmptyOrInterrupted'));
        return result;
      } finally {
        await reader.cancel().catch(() => {});
        reader.releaseLock();
      }
    } catch (error) {
      this.assert(epoch, signal);
      if (call.signal.aborted) throw new AIError('timeout', t('chatgptRequestTimeout'));
      if (error instanceof AIError) throw error;
      throw new AIError('network_error', t('chatgptResponseInterrupted'));
    } finally {
      call.cleanup();
    }
  }
  cancelWork() {
    for (const controller of this.active) controller.abort();
  }
  signOut(): Promise<ChatGPTConnection> {
    if (this.signingOut) return this.signingOut;
    const task = this.performSignOut();
    this.signingOut = task;
    void task
      .finally(() => {
        if (this.signingOut === task) this.signingOut = undefined;
      })
      .catch(() => {});
    return task;
  }
  private async performSignOut() {
    ++this.epoch;
    const epoch = this.epoch;
    this.cancelSignIn();
    this.cancelWork();
    const previous = this.credentials;
    this.store.clear();
    this.credentials = undefined;
    this.refresh = undefined;
    this.modelRequest = undefined;
    this.catalog = [];
    this.catalogAt = 0;
    this.model = '';
    this.selectionInvalid = false;
    this.connectionState = 'signed_out';
    this.message = '';
    this.emit(true);
    if (previous?.refreshToken) {
      try {
        const discovery = await this.json(`${AUTH}/.well-known/openid-configuration`);
        const endpoint = new URL(discovery.revocation_endpoint);
        if (endpoint.origin !== AUTH) throw new Error();
        const call = await this.request(
          endpoint.href,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              token: previous.refreshToken,
              token_type_hint: 'refresh_token',
              client_id: previous.clientId,
            }).toString(),
          },
          undefined,
          5000
        );
        try {
          if (!call.response.ok) throw new Error();
        } finally {
          call.cleanup();
        }
      } catch {
        if (this.epoch === epoch && !this.credentials && !this.disposed) {
          this.message = t('chatgptRevocationUnconfirmed');
          this.emit();
        }
      }
    }
    return this.status();
  }
  dispose() {
    ++this.epoch;
    this.cancelSignIn();
    this.disposed = true;
    this.cancelWork();
    this.listeners.clear();
    this.store.close();
  }
}
