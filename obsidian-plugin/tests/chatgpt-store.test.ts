import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { FileChatGPTStore, chatgptStartupDiagnostic } from '../src/chatgpt-store';

function fixture(t: any) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'nutegg-storage-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const vault = path.join(root, 'vault');
  const local = path.join(root, 'local');
  fs.mkdirSync(vault);
  return { vault, local };
}

test('identity creation and credential saves flush writable handles, as Windows requires', t => {
  const { vault, local } = fixture(t);
  const nativeFs = require('node:fs');
  const open = nativeFs.openSync;
  const flush = nativeFs.fsyncSync;
  const handles = new Map<number, string>();
  let flushes = 0;
  t.mock.method(nativeFs, 'openSync', (file: any, flags: any, ...rest: any[]) => {
    const fd = open(file, flags, ...rest);
    handles.set(fd, flags);
    return fd;
  });
  t.mock.method(nativeFs, 'fsyncSync', (fd: number) => {
    if (!/[+wa]/.test(handles.get(fd) || ''))
      throw Object.assign(new Error('Windows requires write access'), { code: 'EPERM', syscall: 'fsync' });
    ++flushes;
    return flush(fd);
  });
  const store = new FileChatGPTStore(vault, local);
  try {
    store.save({ clientId: 'test', subject: 'test', refreshToken: 'private', scopes: [], expiresAt: 1 });
    assert.equal(store.load()?.refreshToken, 'private');
    assert.equal(flushes, 2);
  } finally {
    store.close();
  }
});

test('failed initialization flush releases its lock so a retry can succeed', t => {
  const { vault, local } = fixture(t);
  const nativeFs = require('node:fs');
  const flush = t.mock.method(nativeFs, 'fsyncSync', () => {
    throw Object.assign(new Error('private path'), { code: 'EIO', syscall: 'fsync' });
  });
  assert.throws(() => new FileChatGPTStore(vault, local), { code: 'EIO' });
  flush.mock.restore();
  const store = new FileChatGPTStore(vault, local);
  store.close();
  const folder = path.join(local, fs.readdirSync(local)[0]);
  assert.deepEqual(fs.readdirSync(folder), ['host.json']);
});

test('failed lock protection removes only the lock owned by this initialization', t => {
  const { vault, local } = fixture(t);
  const original = (FileChatGPTStore.prototype as any).protect;
  const protection = t.mock.method(
    FileChatGPTStore.prototype as any,
    'protect',
    function (this: any, file: string, directory: boolean) {
      if (file.endsWith('session.lock')) throw Object.assign(new Error('ACL failure'), { code: 'storage_permissions' });
      return original.call(this, file, directory);
    }
  );
  assert.throws(() => new FileChatGPTStore(vault, local), { code: 'storage_permissions' });
  protection.mock.restore();
  const store = new FileChatGPTStore(vault, local);
  try {
    assert.throws(() => new FileChatGPTStore(vault, local), { code: 'storage_locked' });
    assert.equal(fs.existsSync(path.join(local, fs.readdirSync(local)[0], 'session.lock')), true);
  } finally {
    store.close();
  }
});

test('startup diagnostics expose only known codes and operations, never sensitive error contents', () => {
  assert.equal(
    chatgptStartupDiagnostic({ code: 'EPERM', syscall: 'fsync', message: 'token', path: '/secret' }),
    'EPERM / fsync'
  );
  assert.equal(chatgptStartupDiagnostic({ code: 'storage_locked' }), 'storage_locked');
  assert.equal(
    chatgptStartupDiagnostic({ code: 'private-token', syscall: '/secret', stderr: 'credentials' }),
    'storage_unknown'
  );
  assert.equal(chatgptStartupDiagnostic(new SyntaxError('Unexpected token in secret JSON')), 'storage_unknown');
  assert.equal(chatgptStartupDiagnostic(null), 'storage_unknown');
});

test('credentials retain private permissions, reject symlink records and clear locally', t => {
  const { vault, local } = fixture(t);
  const store = new FileChatGPTStore(vault, local);
  t.after(() => store.close());
  const directory = path.join(local, fs.readdirSync(local)[0]);
  store.save({ clientId: 'issued-client', refreshToken: 'secret', scopes: [], expiresAt: 1 });
  const record = path.join(directory, 'credentials.json');
  if (process.platform !== 'win32') {
    assert.equal(fs.statSync(directory).mode & 0o777, 0o700);
    assert.equal(fs.statSync(record).mode & 0o777, 0o600);
  }
  assert.throws(() => new FileChatGPTStore(vault, local), { code: 'storage_locked' });
  store.clear(); assert.equal(store.load(), undefined);
  const external = path.join(vault, 'private.txt'); fs.writeFileSync(external, 'private');
  fs.symlinkSync(external, record);
  assert.throws(() => store.load(), /Unsafe/);
  store.clear(); assert.equal(fs.readFileSync(external, 'utf8'), 'private');
});
