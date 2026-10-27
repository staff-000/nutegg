import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { ChatGPTService } from '../src/chatgpt-service';
import type { ChatGPTCredentials, ChatGPTStore } from '../src/chatgpt-store';
import { FileChatGPTStore } from '../src/chatgpt-store';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

const permission = 'chatgpt.tokens.use.direct';
const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'test-key', use: 'sig', alg: 'RS256' };
const wait = async (condition: () => boolean) => {
  for (let i = 0; i < 200; i++) {
    if (condition()) return;
    await new Promise(resolve => setTimeout(resolve, 5));
  }
  throw new Error('Condition not reached');
};
function setup(
  options: { credentials?: ChatGPTCredentials; scopes?: string; invalid?: string; fetch?: any; timeout?: number } = {}
) {
  let saved = options.credentials;
  let authorization: URL;
  const requests: Array<{ url: string; init: any }> = [];
  const store: ChatGPTStore = {
    hostId: 'urn:uuid:00000000-0000-4000-8000-000000000000',
    load: () => saved,
    save: value => {
      saved = structuredClone(value);
    },
    clear: () => {
      saved = undefined;
    },
    close() {},
  };
  const jwt = () => {
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', kid: 'test-key' })).toString('base64url');
    const body = Buffer.from(
      JSON.stringify({
        iss: options.invalid === 'issuer' ? 'https://attacker.example' : 'https://auth.openai.com',
        aud: options.invalid === 'audience' ? 'another-client' : 'oaiapp_test',
        sub: options.invalid === 'subject' ? 'another' : 'user1',
        email: 'person@example.com',
        exp: Math.floor(Date.now() / 1000) + (options.invalid === 'expiry' ? -1 : 3600),
        nonce: options.invalid === 'nonce' ? 'invalid' : authorization.searchParams.get('nonce'),
      })
    ).toString('base64url');
    return `${header}.${body}.${options.invalid === 'signature' ? Buffer.from('forged').toString('base64url') : sign('RSA-SHA256', Buffer.from(`${header}.${body}`), privateKey).toString('base64url')}`;
  };
  const fetcher = async (url: string, init: any = {}) => {
    requests.push({ url, init });
    const custom = await options.fetch?.(url, init);
    if (custom) return custom;
    if (url.endsWith('openid-configuration'))
      return Response.json({
        issuer: 'https://auth.openai.com',
        jwks_uri: 'https://auth.openai.com/jwks',
        revocation_endpoint: 'https://auth.openai.com/revoke',
      });
    if (url.endsWith('/jwks')) return Response.json({ keys: [jwk] });
    if (url.endsWith('/token'))
      return Response.json({
        access_token: 'test-access',
        refresh_token: 'rotated-refresh',
        expires_in: 3600,
        token_type: 'Bearer',
        scope: options.scopes ?? `openid offline_access ${permission}`,
        ...(init.body.includes('authorization_code') ? { id_token: jwt() } : {}),
      });
    if (url.endsWith('/models'))
      return Response.json({
        models: [
          { slug: 'hidden', visibility: 'hide' },
          { slug: 'test-model', display_name: 'Test model', visibility: 'list' },
        ],
      });
    if (url.endsWith('/responses'))
      return new Response(
        'data: {"type":"response.output_text.delta","delta":"hello"}\n\ndata: {"type":"response.completed","response":{"status":"completed"}}\n\n'
      );
    if (url.endsWith('/revoke')) return new Response(null, { status: 200 });
    throw new Error('Unexpected route');
  };
  const service = new ChatGPTService(store, {
    fetch: fetcher as any,
    openBrowser: url => {
      authorization = new URL(url);
    },
    authTimeoutMs: options.timeout,
  });
  return {
    service,
    store,
    requests,
    get saved() {
      return saved;
    },
    get authorization() {
      return authorization;
    },
    callback: async (patch: Record<string, string> = {}) => {
      const callback = new URL(authorization.searchParams.get('redirect_uri')!);
      callback.search = new URLSearchParams({
        state: authorization.searchParams.get('state')!,
        code: 'code',
        client_id: 'oaiapp_test',
        ...patch,
      }).toString();
      return fetch(callback);
    },
  };
}
const credentials = (expiresAt = Date.now() + 3600000): ChatGPTCredentials => ({
  clientId: 'oaiapp_test',
  subject: 'user1',
  email: 'person@example.com',
  accessToken: 'access',
  refreshToken: 'refresh',
  scopes: [permission],
  expiresAt,
});

test('ChatGPT sign-in, models, inference, persistence and revocation work without CLI subprocesses', async t => {
  const processes = require('node:child_process');
  for (const method of ['spawn', 'spawnSync', 'exec', 'execSync', 'execFile', 'execFileSync'])
    t.mock.method(processes, method, () => assert.fail(`ChatGPT must not launch a CLI via ${method}`));
  const h = setup();
  try {
    await h.service.signIn();
    assert.equal(h.authorization.searchParams.get('client_id'), 'dynamic_agent_client');
    assert.equal(h.authorization.searchParams.get('agent_name_hint'), 'NutEgg');
    assert.equal(h.authorization.searchParams.get('code_challenge_method'), 'S256');
    const authUrl = h.authorization.href;
    await h.service.signIn();
    assert.equal(h.authorization.href, authUrl);
    assert.equal((await h.callback()).status, 200);
    await wait(() => h.service.status().state === 'ready' && !!h.service.status().model);
    assert.equal(h.saved?.subject, 'user1');
    assert.deepEqual(await h.service.models(), [{ slug: 'test-model', displayName: 'Test model' }]);
    assert.equal(await h.service.chat('test-model', 'say hello'), 'hello');
    const body = JSON.parse(h.requests.find(r => r.url.endsWith('/responses'))!.init.body);
    assert.deepEqual(body, {
      model: 'test-model',
      input: [{ role: 'user', content: 'say hello' }],
      store: false,
      stream: true,
    });
    assert.doesNotMatch(JSON.stringify(h.service.status()), /test-access|rotated-refresh|idToken|accessToken/);
    const resumed = new ChatGPTService(h.store, { openBrowser() {} });
    assert.equal(resumed.status().state, 'ready');
    resumed.dispose();
    await h.service.signOut();
    assert.equal(h.saved, undefined);
    assert.equal(h.service.status().state, 'signed_out');
    assert.ok(h.requests.some(r => r.url.endsWith('/revoke')));
  } finally {
    h.service.dispose();
  }
});

test('invalid callback state does not consume the valid sign-in attempt', async () => {
  const h = setup();
  try {
    await h.service.signIn();
    assert.equal((await h.callback({ state: 'wrong' })).status, 400);
    assert.equal(h.requests.length, 0);
    await h.callback();
    await wait(() => h.service.status().state === 'ready');
  } finally {
    h.service.dispose();
  }
});

for (const invalid of ['nonce', 'subject', 'issuer', 'audience', 'expiry', 'signature'])
  test(`rejects invalid ${invalid}`, async () => {
    const h = setup({
      invalid,
      credentials: invalid === 'subject' ? { ...credentials(), accessToken: undefined } : undefined,
    });
    try {
      await h.service.signIn();
      await h.callback();
      await wait(() => h.service.status().state === 'error');
      assert.notEqual(h.saved?.accessToken, 'test-access');
    } finally {
      h.service.dispose();
    }
  });

test('denied consent and identity-only login cannot perform inference', async () => {
  const denied = setup();
  try {
    await denied.service.signIn();
    await denied.callback({ error: 'access_denied' });
    await wait(() => denied.service.status().state === 'error');
    assert.equal(denied.requests.length, 0);
  } finally {
    denied.service.dispose();
  }
  const h = setup({ scopes: 'openid offline_access' });
  try {
    await h.service.signIn();
    await h.callback();
    await wait(() => h.service.status().state === 'permission_missing');
    await assert.rejects(h.service.chat('test-model', 'hello'), /allow ChatGPT plan/);
  } finally {
    h.service.dispose();
  }
});

test('authorization timeout and cancellation release callback listener', async () => {
  const h = setup({ timeout: 30 });
  try {
    await h.service.signIn();
    await wait(() => h.service.status().state === 'error');
    await assert.rejects(h.callback());
    await h.service.signIn();
    h.service.cancelSignIn();
    assert.equal(h.service.status().state, 'signed_out');
    await assert.rejects(h.callback());
  } finally {
    h.service.dispose();
  }
});

test('concurrent inference requests share one rotating refresh', async () => {
  const h = setup({ credentials: credentials(0) });
  try {
    const results = await Promise.all([
      h.service.chat('test-model', 'a'),
      h.service.chat('test-model', 'b'),
      h.service.chat('test-model', 'c'),
    ]);
    assert.deepEqual(results, ['hello', 'hello', 'hello']);
    assert.equal(h.requests.filter(r => r.url.endsWith('/token')).length, 1);
    assert.equal(h.saved?.refreshToken, 'rotated-refresh');
  } finally {
    h.service.dispose();
  }
});

test('late refresh cannot restore signed-out credentials', async () => {
  let release!: (value: Response) => void;
  const h = setup({
    credentials: credentials(0),
    fetch: (url: string) =>
      url.endsWith('/token')
        ? new Promise(resolve => {
            release = resolve;
          })
        : undefined,
  });
  try {
    const call = h.service.chat('test-model', 'hello');
    const rejection = assert.rejects(call, /cancelled/);
    await wait(() => !!release);
    await h.service.signOut();
    release(
      Response.json({ access_token: 'late', refresh_token: 'late-refresh', expires_in: 3600, token_type: 'Bearer' })
    );
    await rejection;
    assert.equal(h.saved, undefined);
    assert.equal(h.service.status().state, 'signed_out');
  } finally {
    h.service.dispose();
  }
});

for (const stream of [
  '',
  'data: {"type":"response.output_text.delta","delta":"partial"}\n\n',
  'data: {"type":"response.failed"}\n\n',
])
  test('empty, interrupted, or failed streams are not successful', async () => {
    const h = setup({
      credentials: credentials(),
      fetch: (url: string) => (url.endsWith('/responses') ? new Response(stream) : undefined),
    });
    try {
      await assert.rejects(h.service.chat('test-model', 'hello'));
    } finally {
      h.service.dispose();
    }
  });

test('fragmented CRLF SSE produces a complete answer', async () => {
  const text =
    'data: {"type":"response.output_text.delta","delta":"你好"}\r\n\r\ndata: {"type":"response.completed","response":{"status":"completed"}}\r\n\r\n';
  const bytes = new TextEncoder().encode(text);
  const h = setup({
    credentials: credentials(),
    fetch: (url: string) =>
      url.endsWith('/responses')
        ? new Response(
            new ReadableStream({
              start(controller) {
                for (const byte of bytes) controller.enqueue(new Uint8Array([byte]));
                controller.close();
              },
            })
          )
        : undefined,
  });
  try {
    assert.equal(await h.service.chat('test-model', 'hello'), '你好');
  } finally {
    h.service.dispose();
  }
});

test('expired model selections require reselection, catalog uses account ordering and caching', async () => {
  const h = setup({ credentials: credentials() });
  try {
    h.service.restoreModel('old-model');
    await h.service.models();
    assert.equal(h.service.status().model, '');
    await h.service.models();
    assert.equal(h.requests.filter(r => r.url.endsWith('/models')).length, 1);
    h.service.selectModel('test-model');
    assert.equal(h.service.status().model, 'test-model');
    await assert.rejects(async () => h.service.selectModel('invented'));
  } finally {
    h.service.dispose();
  }
});

test('protected filesystem store persists identity, isolates vaults and enforces exclusive ownership', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'nutegg-chatgpt-'));
  const vault = path.join(root, 'vault');
  fs.mkdirSync(vault);
  let store: FileChatGPTStore | undefined;
  try {
    store = new FileChatGPTStore(vault, path.join(root, 'local'));
    const id = store.hostId;
    store.save(credentials());
    assert.equal(store.load()?.refreshToken, 'refresh');
    assert.throws(() => new FileChatGPTStore(vault, path.join(root, 'local')), /owns/);
    store.close();
    store = new FileChatGPTStore(vault, path.join(root, 'local'));
    assert.equal(store.hostId, id);
    if (process.platform !== 'win32') {
      const folder = path.join(root, 'local', fs.readdirSync(path.join(root, 'local'))[0]);
      assert.equal(fs.statSync(path.join(folder, 'credentials.json')).mode & 0o777, 0o600);
    }
    store.clear();
    assert.equal(store.load(), undefined);
    assert.deepEqual(fs.readdirSync(vault), []);
  } finally {
    store?.close();
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('credential write failure cannot report successful authorization', async () => {
  const h = setup();
  try {
    h.store.save = () => {
      throw new Error('Disk error');
    };
    await h.service.signIn();
    await h.callback();
    await wait(() => h.service.status().state === 'error');
    assert.equal(h.saved, undefined);
    assert.ok(!h.requests.some(request => request.url.endsWith('/models')));
  } finally {
    h.service.dispose();
  }
});

test('returning callback cannot substitute a different registration', async () => {
  const h = setup({ credentials: { ...credentials(), accessToken: undefined } });
  try {
    await h.service.signIn();
    assert.equal(h.authorization.searchParams.get('client_id'), 'oaiapp_test');
    assert.equal(h.authorization.searchParams.has('agent_name_hint'), false);
    await h.callback({ client_id: 'attacker' });
    await wait(() => h.service.status().state === 'error');
    assert.equal(h.saved?.clientId, 'oaiapp_test');
    assert.equal(h.requests.length, 0);
  } finally {
    h.service.dispose();
  }
});

test('cancellation before inference sends no network request', async () => {
  const h = setup({ credentials: credentials() });
  try {
    const controller = new AbortController();
    controller.abort();
    await assert.rejects(h.service.chat('test-model', 'hello', controller.signal), { code: 'cancelled' });
    assert.equal(h.requests.length, 0);
  } finally {
    h.service.dispose();
  }
});

test('midstream cancellation discards partial text and closes the response', async () => {
  let started = false,
    cancelled = false;
  const h = setup({
    credentials: credentials(),
    fetch: (url: string, init: any) =>
      url.endsWith('/responses')
        ? new Response(
            new ReadableStream({
              start(controller) {
                started = true;
                controller.enqueue(
                  new TextEncoder().encode('data: {"type":"response.output_text.delta","delta":"partial"}\n\n')
                );
                init.signal.addEventListener(
                  'abort',
                  () => {
                    cancelled = true;
                    controller.error(new Error('aborted'));
                  },
                  { once: true }
                );
              },
            })
          )
        : undefined,
  });
  try {
    const controller = new AbortController();
    const call = h.service.chat('test-model', 'hello', controller.signal);
    const rejected = assert.rejects(call, { code: 'cancelled' });
    await wait(() => started);
    controller.abort();
    await rejected;
    assert.equal(cancelled, true);
  } finally {
    h.service.dispose();
  }
});

for (const status of [401, 403, 404, 429, 500])
  test(`HTTP ${status} is an explicit provider error`, async () => {
    const h = setup({
      credentials: credentials(),
      fetch: (url: string) =>
        url.endsWith('/responses') ? new Response('sensitive provider body', { status }) : undefined,
    });
    try {
      await assert.rejects(h.service.chat('test-model', 'hello'), error => {
        assert.doesNotMatch(String(error), /sensitive provider body/);
        return true;
      });
    } finally {
      h.service.dispose();
    }
  });

test('failed revocation remains signed out with an explicit warning', async () => {
  const h = setup({
    credentials: credentials(),
    fetch: (url: string) => (url.endsWith('/revoke') ? new Response('', { status: 500 }) : undefined),
  });
  try {
    const status = await h.service.signOut();
    assert.equal(status.state, 'signed_out');
    assert.equal(h.saved, undefined);
    assert.match(status.message!, /revocation was not confirmed/);
  } finally {
    h.service.dispose();
  }
});

test('repeated sign-out shares one revocation operation', async () => {
  const h = setup({ credentials: credentials() });
  try {
    const a = h.service.signOut(),
      b = h.service.signOut();
    assert.equal(a, b);
    await Promise.all([a, b]);
    assert.equal(h.requests.filter(request => request.url.endsWith('/revoke')).length, 1);
  } finally {
    h.service.dispose();
  }
});

test('sign-in cancellation during token exchange cannot save tokens or discover models', async () => {
  let release!: (value: Response) => void;
  const h = setup({
    fetch: (url: string) =>
      url.endsWith('/token')
        ? new Promise(resolve => {
            release = resolve;
          })
        : undefined,
  });
  try {
    await h.service.signIn();
    await h.callback();
    await wait(() => !!release);
    h.service.cancelSignIn();
    release(
      Response.json({
        access_token: 'late',
        refresh_token: 'late',
        id_token: 'invalid',
        expires_in: 3600,
        token_type: 'Bearer',
      })
    );
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(h.saved?.accessToken, undefined);
    assert.equal(h.service.status().state, 'signed_out');
    assert.ok(
      !h.requests.some(request => request.url.endsWith('openid-configuration') || request.url.endsWith('/models'))
    );
  } finally {
    h.service.dispose();
  }
});

test('credential store refuses a directory inside the vault', () => {
  const vault = fs.mkdtempSync(path.join(os.tmpdir(), 'nutegg-vault-'));
  try {
    assert.throws(() => new FileChatGPTStore(vault, path.join(vault, 'secrets')), /outside the vault/);
  } finally {
    fs.rmSync(vault, { recursive: true, force: true });
  }
});
