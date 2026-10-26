import * as fs from 'node:fs';
import * as path from 'node:path';

/** Fixed OS helpers must never resolve through the user's executable search PATH. */
export function windowsSystemCommand(command: 'icacls' | 'powershell', env = process.env): string {
  const root = env.SystemRoot || env.SYSTEMROOT || env.WINDIR || 'C:\\Windows';
  if (!/^[a-z]:[\\/]/i.test(root)) throw new Error('Invalid Windows system directory.');
  return command === 'icacls'
    ? path.win32.join(root, 'System32', 'icacls.exe')
    : path.win32.join(root, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
}

/** Resolve before creating folders, and again before SQLite opens the file. */
export function vaultDatabasePath(base: string, relative: string): string {
  const target = path.resolve(base, relative);
  const inside = (root: string, value: string) => {
    const suffix = path.relative(root, value);
    return suffix !== '' && suffix !== '..' && !suffix.startsWith(`..${path.sep}`) && !path.isAbsolute(suffix);
  };
  if (!inside(path.resolve(base), target)) throw new Error('Database must remain inside the vault.');
  let ancestor = target;
  while (!fs.existsSync(ancestor)) {
    // A dangling symlink must not be treated as a missing directory.
    try { if (fs.lstatSync(ancestor).isSymbolicLink()) throw new Error('Unsafe database path.'); }
    catch (error: any) { if (error.code !== 'ENOENT') throw error; }
    ancestor = path.dirname(ancestor);
  }
  const root = fs.realpathSync(base);
  const actual = fs.realpathSync(ancestor);
  if (actual !== root && !inside(root, actual)) throw new Error('Database path escapes the vault.');
  return target;
}
