import test from 'node:test';
import assert from 'node:assert/strict';
import { chmod, mkdir, mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { resolveSubscriptionCommand } from '../src/subscription-cli.mjs';
import { resolveAgyCommand } from '../src/subscription-gemini.mjs';
import {
  readWindowsPath,
  windowsSearchDirectories,
  resolveWindowsClaude,
  resolveWindowsAgy,
} from '../src/subscription-windows.mjs';

async function fixture(t: any) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'nutegg-windows-cli-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  const home = join(root, 'home');
  const env = { LOCALAPPDATA: join(root, 'local'), APPDATA: join(root, 'roaming'), PATH: join(root, 'path') };
  return { root, home, env };
}
async function executable(file: string, contents = 'MZfixture') {
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, contents);
  await chmod(file, 0o700);
  return file;
}

test('Windows discovery reads newly persisted PATH and expands quoted environment paths', async t => {
  const { root, home, env } = await fixture(t);
  const newer = join(root, 'new cli');
  const directories = await windowsSearchDirectories({
    home,
    env,
    readRegistry: async () => [`"${newer}";%localappdata%/tools`, '%USERPROFILE%/custom;%UNKNOWN%/bin;.;relative;""'],
  });
  assert.deepEqual(directories, [
    env.PATH,
    newer,
    join(env.LOCALAPPDATA, 'tools'),
    join(home, 'custom'),
    join(home, '.local', 'bin'),
    join(env.LOCALAPPDATA, 'Microsoft', 'WinGet', 'Links'),
  ]);
  for (const [resolver, name] of [
    [resolveWindowsClaude, 'claude'],
    [resolveWindowsAgy, 'agy'],
  ] as const) {
    const binary = await executable(join(newer, `${name}.exe`));
    assert.equal(await resolver({ directories, env, home, arch: 'x64' }), binary);
  }
});

for (const provider of ['claude', 'agy']) {
  for (const location of ['path', 'native', 'winget']) {
    test(`Windows ${provider} detects ${location} executable without a fresh Obsidian PATH`, async t => {
      const { env, home } = await fixture(t);
      const directory =
        location === 'path'
          ? env.PATH
          : location === 'winget'
            ? join(env.LOCALAPPDATA, 'Microsoft', 'WinGet', 'Links')
            : provider === 'claude'
              ? join(home, '.local', 'bin')
              : join(env.LOCALAPPDATA, 'agy', 'bin');
      const binary = await executable(join(directory, `${provider}.exe`));
      const directories = await windowsSearchDirectories({ env, home, readRegistry: async () => [] });
      const resolve = provider === 'claude' ? resolveWindowsClaude : resolveWindowsAgy;
      assert.equal(await resolve({ directories, env, home, arch: 'x64' }), binary);
    });
  }
}

for (const arch of ['x64', 'arm64']) {
  for (const layout of ['nested', 'sibling', 'copied', 'resolved']) {
    test(`Windows Claude finds ${arch} ${layout} npm binary in a custom prefix`, async t => {
      const { root, env, home } = await fixture(t);
      const prefix = join(root, 'custom npm');
      const packageRoot = join(prefix, 'node_modules', '@anthropic-ai', 'claude-code');
      const platformPackage = `@anthropic-ai/claude-code-win32-${arch}`;
      let platformRoot =
        layout === 'nested'
          ? join(packageRoot, 'node_modules', platformPackage)
          : layout === 'resolved'
            ? join(root, 'node_modules', platformPackage)
            : join(prefix, 'node_modules', platformPackage);
      const binary = await executable(
        layout === 'copied' ? join(packageRoot, 'bin', 'claude.exe') : join(platformRoot, 'claude.exe')
      );
      if (layout === 'resolved')
        await writeFile(join(platformRoot, 'package.json'), JSON.stringify({ name: platformPackage }));
      assert.equal(await resolveWindowsClaude({ directories: [prefix], env, home, arch }), binary);
      if (layout !== 'copied')
        assert.equal(
          await resolveWindowsClaude({ directories: [prefix], env, home, arch: arch === 'x64' ? 'arm64' : 'x64' }),
          undefined
        );
    });
  }
}

test('Windows discovery ignores shell placeholders and directories, preferring real executables', async t => {
  const { root, env, home } = await fixture(t);
  const bad = join(root, 'bad');
  const good = join(root, 'good');
  for (const [resolver, name] of [
    [resolveWindowsClaude, 'claude'],
    [resolveWindowsAgy, 'agy'],
  ] as const) {
    await executable(join(bad, `${name}.exe`), '#!/bin/sh\necho placeholder');
    await executable(join(bad, `${name}.cmd`), '@echo launcher');
    const binary = await executable(join(good, `${name}.exe`));
    assert.equal(await resolver({ directories: [bad, good], env, home, arch: 'x64' }), binary);
    assert.equal(await resolver({ directories: [bad], env, home, arch: 'x64' }), undefined);
    await rm(join(bad, `${name}.exe`));
    await mkdir(join(bad, `${name}.exe`));
    assert.equal(await resolver({ directories: [bad], env, home, arch: 'x64' }), undefined);
  }
});

test('Windows discovery respects PATH order and falls back to default npm prefix', async t => {
  const { root, env, home } = await fixture(t);
  const first = join(root, 'first');
  const second = join(root, 'second');
  const fallback = await executable(
    join(env.APPDATA, 'npm', 'node_modules', '@anthropic-ai', 'claude-code', 'bin', 'claude.exe')
  );
  assert.equal(await resolveWindowsClaude({ directories: [], env, home, arch: 'x64' }), fallback);
  const expected = await executable(join(first, 'claude.exe'));
  await executable(join(second, 'claude.exe'));
  assert.equal(await resolveWindowsClaude({ directories: [first, second], env, home, arch: 'x64' }), expected);
});

test('Windows manual paths and environment overrides take priority without falling back on invalid overrides', async t => {
  const { root } = await fixture(t);
  const descriptor = Object.getOwnPropertyDescriptor(process, 'platform')!;
  Object.defineProperty(process, 'platform', { ...descriptor, value: 'win32' });
  t.after(() => Object.defineProperty(process, 'platform', descriptor));
  for (const [name, variable, resolve] of [
    ['claude', 'NUTEGG_CLAUDE_COMMAND', (command?: string) => resolveSubscriptionCommand('claude', command)],
    ['agy', 'NUTEGG_AGY_COMMAND', resolveAgyCommand],
  ] as const) {
    const previous = process.env[variable];
    t.after(() => {
      if (previous === undefined) delete process.env[variable];
      else process.env[variable] = previous;
    });
    const configured = await executable(join(root, 'configured', `${name}.exe`));
    const override = await executable(join(root, 'override', `${name}.exe`));
    process.env[variable] = override;
    assert.equal(await resolve(configured), configured);
    assert.equal(await resolve(), override);
    await assert.rejects(resolve(join(root, 'missing', `${name}.exe`)), /not found/);
    process.env[variable] = join(root, 'missing', `${name}.exe`);
    await assert.rejects(resolve(), /not found/);
  }
});

test('persisted Windows PATH uses a fixed UTF-8 command and tolerates unavailable system tools', async () => {
  const env = { SystemRoot: 'C:\\Windows', PATH: 'untrusted;$(example)' };
  let sent: any[] = [];
  const paths = await readWindowsPath(env, async (...args: any[]) => {
    sent = args;
    return { stdout: '\uFEFF' + JSON.stringify(['C:\\工具', 'C:\\Users\\用户\\bin', null]) };
  });
  assert.deepEqual(paths, ['C:\\工具', 'C:\\Users\\用户\\bin']);
  assert.equal(sent[0], join(env.SystemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe'));
  assert.ok(sent[1].includes('-NoProfile'));
  assert.ok(sent[1].includes('-NonInteractive'));
  assert.doesNotMatch(sent[1].at(-1), /untrusted|example/);
  assert.equal(sent[2].encoding, 'utf8');
  assert.equal(sent[2].timeout, 3000);
  assert.deepEqual(
    await readWindowsPath(env, async () => {
      throw new Error('Unavailable');
    }),
    []
  );
  assert.deepEqual(await readWindowsPath(env, async () => ({ stdout: 'invalid output' })), []);
});
