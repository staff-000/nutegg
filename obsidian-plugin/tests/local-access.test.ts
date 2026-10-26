import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { vaultDatabasePath, windowsSystemCommand } from '../src/local-access';
import { filesInFolder } from '../src/vault-files';
import { TFolder } from 'obsidian';
import { makeFakeVault, makeFakePlugin } from './helpers';
import { WorkflowManager } from '../src/workflow-manager';
import { EggParser } from '../src/egg-parser';

test('scoped discovery does not enumerate or visit unrelated vault trees', async () => {
  const { vault } = makeFakeVault({
    'private/secret.md': 'private', 'nutegg/Egg.md': '# Knowledge\n',
    'nutegg/_workflow/current.md': 'prompt', 'nutegg/_workflow/sub/child.md': 'nested',
    'nutegg/_workflow/_backup/old.md': 'old', 'nutegg/_raw/capture.md': 'capture',
  });
  vault.getFiles = vault.getMarkdownFiles = () => { throw new Error('Whole vault scan'); };
  const lookup = vault.getAbstractFileByPath;
  vault.getAbstractFileByPath = p => {
    assert.ok(!p.startsWith('private'));
    return lookup(p);
  };
  const plugin = makeFakePlugin({ vault });
  const workflows = new WorkflowManager(plugin as any);
  assert.deepEqual(workflows.getEggFiles().map(f => f.path), ['nutegg/Egg.md']);
  assert.deepEqual(workflows.getWorkflowFiles().map(f => f.name).sort(), ['child.md', 'current.md']);
  assert.ok(await new EggParser(plugin as any).readEgg('egg.md'));
  for (const name of ['absent', '', '../private', '/private', 'nutegg/../private', 'nutegg\\private'])
    assert.deepEqual(filesInFolder(vault as any, name), []);
});

test('scoped traversal tolerates cycles and refuses out-of-folder children', () => {
  const { vault } = makeFakeVault({ 'nutegg/egg.md': '' });
  const folder = vault.getAbstractFileByPath('nutegg') as TFolder;
  folder.children.push(folder, Object.assign(new TFolder(), { path: 'private', children: [] }));
  vault.getAbstractFileByPath = () => folder;
  assert.deepEqual(filesInFolder(vault as any, 'nutegg').map(f => f.path), ['nutegg/egg.md']);
});

test('database paths reject traversal and symlinks before writing outside the vault', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'nutegg-containment-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const vault = path.join(root, 'vault');
  const outside = path.join(root, 'outside');
  fs.mkdirSync(vault); fs.mkdirSync(outside);
  assert.equal(vaultDatabasePath(vault, 'nutegg/_raw/../.nutegg.db'), path.join(vault, 'nutegg/.nutegg.db'));
  assert.throws(() => vaultDatabasePath(vault, '../outside/file.db'));
  assert.throws(() => vaultDatabasePath(vault, outside));
  fs.symlinkSync(outside, path.join(vault, 'linked'), 'junction');
  assert.throws(() => vaultDatabasePath(vault, 'linked/new/file.db'));
  fs.writeFileSync(path.join(outside, 'existing.db'), 'untouched');
  fs.symlinkSync(path.join(outside, 'existing.db'), path.join(vault, 'existing.db'));
  assert.throws(() => vaultDatabasePath(vault, 'existing.db'));
  fs.symlinkSync(path.join(outside, 'missing.db'), path.join(vault, 'dangling.db'));
  assert.throws(() => vaultDatabasePath(vault, 'dangling.db'));
  assert.equal(fs.readFileSync(path.join(outside, 'existing.db'), 'utf8'), 'untouched');
  assert.ok(!fs.existsSync(path.join(outside, 'new')));
});

test('Windows helpers use fixed system paths independently of PATH', () => {
  const env = { SystemRoot: 'D:\\Windows', PATH: 'C:\\untrusted' };
  assert.equal(windowsSystemCommand('icacls', env), 'D:\\Windows\\System32\\icacls.exe');
  assert.equal(windowsSystemCommand('powershell', env), 'D:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe');
  assert.throws(() => windowsSystemCommand('icacls', { SystemRoot: 'relative' }));
});
