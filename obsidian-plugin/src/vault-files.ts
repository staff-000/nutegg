import { TFile, TFolder, type Vault } from 'obsidian';

/** Enumerate only the requested subtree. Never fall back to a whole-vault scan. */
export function filesInFolder(vault: Vault, folder: string): TFile[] {
  if (!folder || folder.split('/').some(part => !part || part === '.' || part === '..') || folder.includes('\\')) return [];
  const root = vault.getAbstractFileByPath(folder);
  if (!(root instanceof TFolder)) return [];
  const files: TFile[] = [];
  const visited = new Set<object>();
  const pending = [...root.children].reverse();
  while (pending.length) {
    const entry = pending.pop()!;
    if (visited.has(entry) || !entry.path.startsWith(`${folder}/`)) continue;
    visited.add(entry);
    if (entry instanceof TFolder) pending.push(...[...entry.children].reverse());
    else if (entry instanceof TFile) files.push(entry);
  }
  return files;
}
