#!/usr/bin/env node
// Small, testable release operations. No provider credentials or package publishing.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const [command, root, version, ...args] = process.argv.slice(2);
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const write = (file, value) => fs.writeFileSync(path.join(root, file), JSON.stringify(value, null, 2) + '\n');
const workspaces = ['chrome-extension', 'obsidian-plugin'];
const compare = (a, b) => {
  const aa = a.split('.').map(Number), bb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (aa[i] !== bb[i]) return aa[i] - bb[i];
  return 0;
};
try {
  if (command === 'bump') {
    for (const dir of workspaces) for (const file of ['package.json', 'manifest.json']) {
      const name = `${dir}/${file}`, value = read(name);
      if (compare(version, value.version) <= 0) throw new Error(`${version} must be newer than ${name} (${value.version})`);
    }
    for (const dir of workspaces) for (const file of ['package.json', 'manifest.json']) {
      const name = `${dir}/${file}`, value = read(name); value.version = version; write(name, value);
    }
    if (fs.existsSync(path.join(root, 'package-lock.json'))) {
      const lock = read('package-lock.json');
      for (const dir of workspaces) {
        if (lock.packages?.[dir]) lock.packages[dir].version = version;
        if (lock.dependencies?.[`@nutegg/${dir}`]) lock.dependencies[`@nutegg/${dir}`].version = version;
      }
      write('package-lock.json', lock);
    }
    for (const dir of workspaces) if (fs.existsSync(path.join(root, dir, 'package-lock.json'))) {
      const name = `${dir}/package-lock.json`, lock = read(name);
      lock.version = version;
      if (lock.packages?.['']) lock.packages[''].version = version;
      write(name, lock);
    }
  } else if (command === 'verify') {
    for (const dir of workspaces) for (const file of ['package.json', 'manifest.json']) {
      if (read(`${dir}/${file}`).version !== version) throw new Error(`${dir}/${file} does not match release ${version}`);
    }
  } else if (command === 'verify-source') {
    const branch = `release/${version.split('.').slice(0, 2).join('.')}`;
    execFileSync('git', ['merge-base', '--is-ancestor', 'HEAD', `refs/remotes/origin/${branch}`], { cwd: root });
    for (const dir of workspaces) for (const file of ['package.json', 'manifest.json']) {
      if (read(`${dir}/${file}`).version !== version) throw new Error(`${dir}/${file} does not match release ${version}`);
    }
  } else if (command === 'find-run') {
    // A SHA alone is insufficient: all three release tags share a commit.
    const runs = JSON.parse(fs.readFileSync(0, 'utf8'));
    const run = runs.find(run => run.headSha === version && run.headBranch === args[0] && run.event === 'push');
    if (run) process.stdout.write(String(run.databaseId));
  } else if (command === 'website') {
    const current = read('website/src/versions.json'), options = [];
    for (const [key, flag] of [['chromeExtension', '--chrome-github'], ['obsidianPlugin', '--obsidian-github']]) {
      const existing = current[key]?.githubVersion;
      if (existing && !/^\d+\.\d+\.\d+$/.test(existing)) throw new Error(`Cannot compare website version ${existing}`);
      if (!existing || compare(version, existing) >= 0) options.push(flag, version);
    }
    if (options.length) execFileSync(process.execPath,
      [path.join(root, 'scripts/update-download-version.js'), ...options, '--no-build'], { cwd: root, stdio: 'inherit' });
  } else throw new Error(`Unknown release operation: ${command}`);
} catch (error) {
  console.error(`Release validation failed: ${error.message}`);
  process.exitCode = 1;
}
