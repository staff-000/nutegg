import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { access, open, stat } from 'node:fs/promises';
import { constants } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, isAbsolute, join, win32 } from 'node:path';
import { createRequire } from 'node:module';

const execute = promisify(execFile);
let cachedRegistry;

// A GUI app may still have the PATH from before a CLI was installed. A fixed
// read-only PowerShell command uses UTF-8 so non-ASCII Windows usernames survive.
export async function readWindowsPath(env = process.env, run = execute) {
  const systemRoot = env.SystemRoot || env.SYSTEMROOT || 'C:\\Windows';
  const script =
    '[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false); ' +
    "@([Environment]::GetEnvironmentVariable('Path', 'Machine'), " +
    "[Environment]::GetEnvironmentVariable('Path', 'User')) | ConvertTo-Json -Compress";
  try {
    const { stdout } = await run(
      join(systemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe'),
      ['-NoLogo', '-NoProfile', '-NonInteractive', '-Command', script],
      { windowsHide: true, timeout: 3000, maxBuffer: 32768, encoding: 'utf8' }
    );
    const paths = JSON.parse(stdout.replace(/^\uFEFF/, '').trim());
    return Array.isArray(paths) ? paths.filter(value => typeof value === 'string') : [];
  } catch {
    return [];
  } // Existing PATH and known installation locations still work.
}

async function registryPaths(env) {
  const systemRoot = env.SystemRoot || env.SYSTEMROOT || 'C:\\Windows';
  if (!cachedRegistry || Date.now() >= cachedRegistry.expires || cachedRegistry.systemRoot !== systemRoot) {
    cachedRegistry = { expires: Date.now() + 30000, systemRoot, task: readWindowsPath(env) };
  }
  return cachedRegistry.task;
}

export async function windowsSearchDirectories({
  env = process.env,
  home = homedir(),
  readRegistry = registryPaths,
} = {}) {
  const variables = new Map(Object.entries(env).map(([key, value]) => [key.toLowerCase(), value]));
  if (!variables.has('userprofile')) variables.set('userprofile', home);
  const persisted = await readRegistry(env);
  const values = [env.PATH || env.Path || '', ...persisted];
  const directories = [];
  for (const value of values) {
    for (let entry of value.split(';')) {
      entry = entry.trim().replace(/^"(.*)"$/, '$1');
      for (let round = 0; round < 4 && /%[^%]+%/.test(entry); round++)
        entry = entry.replace(/%([^%]+)%/g, (match, key) => variables.get(key.toLowerCase()) || match);
      if (entry && !entry.includes('%') && (isAbsolute(entry) || win32.isAbsolute(entry))) directories.push(entry);
    }
  }
  const local = env.LOCALAPPDATA || join(home, 'AppData', 'Local');
  directories.push(join(home, '.local', 'bin'), join(local, 'Microsoft', 'WinGet', 'Links'));
  return [...new Set(directories)];
}

// npm packages can contain a script placeholder called claude.exe when native
// postinstall failed. Only accept actual Windows executables, never shell shims.
async function nativeExecutable(candidates) {
  for (const file of new Set(candidates)) {
    let handle;
    try {
      await access(file, constants.X_OK);
      if (!(await stat(file)).isFile()) continue;
      handle = await open(file, 'r');
      const signature = Buffer.alloc(2);
      await handle.read(signature, 0, 2, 0);
      if (signature.toString('ascii') === 'MZ') return file;
    } catch {
      /* Continue to the next installed location. */
    } finally {
      await handle?.close();
    }
  }
  return undefined;
}

export async function resolveWindowsClaude({ directories, env = process.env, home = homedir(), arch = process.arch }) {
  const local = env.LOCALAPPDATA || join(home, 'AppData', 'Local');
  const candidates = directories.map(dir => join(dir, 'claude.exe'));
  candidates.push(join(local, 'Programs', 'claude', 'claude.exe'));
  if (['x64', 'arm64'].includes(arch)) {
    const platformPackage = `@anthropic-ai/claude-code-win32-${arch}`;
    for (const prefix of new Set([...directories, join(env.APPDATA || join(home, 'AppData', 'Roaming'), 'npm')])) {
      const root = join(prefix, 'node_modules', '@anthropic-ai', 'claude-code');
      try {
        const platformRoot = dirname(
          createRequire(join(root, 'package.json')).resolve(`${platformPackage}/package.json`)
        );
        candidates.push(join(platformRoot, 'claude.exe'));
      } catch {
        /* Check conventional nested and hoisted package layouts below. */
      }
      candidates.push(
        join(root, 'node_modules', platformPackage, 'claude.exe'),
        join(prefix, 'node_modules', platformPackage, 'claude.exe'),
        join(root, 'bin', 'claude.exe')
      );
    }
  }
  return nativeExecutable(candidates);
}

export async function resolveWindowsAgy({ directories, env = process.env, home = homedir() }) {
  const local = env.LOCALAPPDATA || join(home, 'AppData', 'Local');
  return nativeExecutable([...directories.map(dir => join(dir, 'agy.exe')), join(local, 'agy', 'bin', 'agy.exe')]);
}
