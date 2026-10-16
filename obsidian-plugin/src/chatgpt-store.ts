import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';

export interface ChatGPTCredentials {
  clientId: string;
  subject?: string;
  email?: string;
  idToken?: string;
  accessToken?: string;
  refreshToken?: string;
  scopes: string[];
  expiresAt: number;
  earliestRefreshAt?: number;
}
export interface ChatGPTStore {
  hostId: string;
  load(): ChatGPTCredentials | undefined;
  save(value: ChatGPTCredentials): void;
  clear(): void;
  close(): void;
}

/** Local-only credentials. Nothing in this directory belongs in the vault or settings. */
export class FileChatGPTStore implements ChatGPTStore {
  readonly hostId: string;
  private directory: string;
  private lock: string;
  private owner = `${process.pid}:${randomUUID()}`;
  private closed = false;
  constructor(vaultPath: string, root?: string) {
    const base =
      root ||
      path.join(
        process.platform === 'win32'
          ? process.env.LOCALAPPDATA || os.homedir()
          : process.platform === 'darwin'
            ? path.join(os.homedir(), 'Library', 'Application Support')
            : process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share'),
        'NutEgg',
        'chatgpt'
      );
    // Canonical local path isolates vaults and avoids IDs copied by vault synchronization.
    this.directory = path.join(base, createHash('sha256').update(fs.realpathSync(vaultPath)).digest('hex'));
    fs.mkdirSync(this.directory, { recursive: true, mode: 0o700 });
    const canonicalVault = fs.realpathSync(vaultPath);
    const canonicalStorage = fs.realpathSync(this.directory);
    if (canonicalStorage === canonicalVault || canonicalStorage.startsWith(canonicalVault + path.sep))
      throw new Error('ChatGPT credentials must be stored outside the vault.');
    this.protect(this.directory, true);
    this.lock = path.join(this.directory, 'session.lock');
    try {
      this.acquire();
    } catch (error: any) {
      if (error.code !== 'EEXIST') throw error;
      const pid = Number(fs.readFileSync(this.lock, 'utf8').split(':')[0]);
      if (!Number.isSafeInteger(pid) || pid < 1) throw new Error('ChatGPT credential storage is locked.');
      try {
        process.kill(pid, 0);
      } catch (err: any) {
        if (err.code !== 'ESRCH') throw new Error('ChatGPT credential storage is locked.');
        fs.unlinkSync(this.lock);
        this.acquire();
      }
      if (fs.readFileSync(this.lock, 'utf8') !== this.owner)
        throw new Error('Another Obsidian instance owns this ChatGPT connection.');
    }
    try {
      const host = path.join(this.directory, 'host.json');
      if (!fs.existsSync(host)) this.atomic(host, JSON.stringify({ id: `urn:uuid:${randomUUID()}` }));
      this.protect(host);
      this.hostId = JSON.parse(fs.readFileSync(host, 'utf8')).id;
      if (!/^urn:uuid:[\da-f-]{36}$/i.test(this.hostId)) throw new Error('Invalid ChatGPT installation identity.');
    } catch (error) {
      this.close();
      throw error;
    }
  }
  private acquire() {
    fs.writeFileSync(this.lock, this.owner, { flag: 'wx', mode: 0o600 });
    this.protect(this.lock);
  }
  private protect(file: string, directory = false) {
    const stat = fs.lstatSync(file);
    if (stat.isSymbolicLink() || (directory ? !stat.isDirectory() : !stat.isFile()))
      throw new Error('Unsafe ChatGPT storage path.');
    if (process.platform === 'win32') {
      const user = os.userInfo().username;
      execFileSync('icacls', [file, '/reset'], { windowsHide: true, stdio: 'ignore' });
      execFileSync('icacls', [file, '/inheritance:r', '/grant:r', `${user}:${directory ? '(OI)(CI)' : ''}F`], {
        windowsHide: true,
        stdio: 'ignore',
      });
    } else {
      if (stat.uid !== process.getuid?.()) throw new Error('ChatGPT storage is owned by another user.');
      fs.chmodSync(file, directory ? 0o700 : 0o600);
    }
  }
  private atomic(file: string, value: string) {
    if (this.closed) throw new Error('ChatGPT credential storage is closed.');
    const temporary = `${file}.${randomUUID()}.tmp`;
    try {
      fs.writeFileSync(temporary, value, { flag: 'wx', mode: 0o600 });
      this.protect(temporary);
      const fd = fs.openSync(temporary, 'r');
      try {
        fs.fsyncSync(fd);
      } finally {
        fs.closeSync(fd);
      }
      fs.renameSync(temporary, file);
    } finally {
      if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
    }
  }
  load() {
    const file = path.join(this.directory, 'credentials.json');
    if (!fs.existsSync(file)) return undefined;
    this.protect(file);
    const record = JSON.parse(fs.readFileSync(file, 'utf8')) as ChatGPTCredentials;
    if (
      !record ||
      typeof record.clientId !== 'string' ||
      record.clientId === 'dynamic_agent_client' ||
      !Array.isArray(record.scopes) ||
      !Number.isFinite(record.expiresAt)
    )
      throw new Error('Invalid ChatGPT credential record.');
    return record;
  }
  save(value: ChatGPTCredentials) {
    this.atomic(path.join(this.directory, 'credentials.json'), JSON.stringify(value));
  }
  clear() {
    if (this.closed) throw new Error('ChatGPT credential storage is closed.');
    fs.rmSync(path.join(this.directory, 'credentials.json'), { force: true });
  }
  close() {
    if (this.closed) return;
    this.closed = true;
    if (fs.existsSync(this.lock) && fs.readFileSync(this.lock, 'utf8') === this.owner) fs.unlinkSync(this.lock);
  }
}
