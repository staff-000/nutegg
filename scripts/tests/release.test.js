const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync, execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
function fixture(t) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'nutegg-release-test-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  const repo = path.join(temp, 'repo'), remote = path.join(temp, 'remote.git'), bin = path.join(temp, 'bin');
  fs.mkdirSync(repo); fs.mkdirSync(bin);
  const git = (...args) => execFileSync('git', args, { cwd: repo, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const write = (name, value) => { const file = path.join(repo, name); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, typeof value === 'object' ? JSON.stringify(value, null, 2) + '\n' : value); };
  git('init', '-b', 'main'); git('config', 'user.name', 'Release Test'); git('config', 'user.email', 'release@example.test');
  git('config', 'commit.gpgsign', 'false'); git('config', 'tag.gpgsign', 'false');
  for (const name of ['release.sh', 'scripts/release-tools.mjs', 'scripts/update-download-version.js', 'scripts/publish-release-assets.sh', 'scripts/package-extension.py'])
    write(name, fs.readFileSync(path.join(root, name), 'utf8'));
  for (const dir of ['chrome-extension', 'obsidian-plugin']) {
    write(`${dir}/package.json`, { name: `@nutegg/${dir}`, version: '0.3.0' });
    write(`${dir}/manifest.json`, { version: '0.3.0' });
  }
  write('package-lock.json', { packages: { 'chrome-extension': { version: '0.3.0' }, 'obsidian-plugin': { version: '0.3.0' }, 'node_modules/byokit': { version: '0.3.0' } } });
  write('obsidian-plugin/package-lock.json', { version: '0.3.0', packages: { '': { version: '0.3.0' } } });
  write('website/src/versions.json', {
    chromeExtension: { githubVersion: '0.3.0', storeVersion: '0.2.0' },
    obsidianPlugin: { githubVersion: '0.3.0', communityVersion: '0.2.0' },
  });
  git('add', '.'); git('commit', '-m', 'Initial source');
  execFileSync('git', ['init', '--bare', remote], { stdio: 'ignore' });
  git('remote', 'add', 'origin', remote); git('push', '-u', 'origin', 'main');
  const log = path.join(temp, 'calls.log');
  fs.writeFileSync(path.join(bin, 'npm'), `#!/bin/sh
printf '%s %s\\n' "$PWD" "$*" >> "$TEST_LOG"
if [ "$1" = ci ] && [ -L node_modules ]; then exit 11; fi
if [ "$1" = update ] && [ "$2" = byokit ]; then
  if [ "$FAKE_UPDATE_FAILURE" = 1 ]; then exit 13; fi
  if [ -n "$FAKE_BYOKIT_VERSION" ]; then
    node -e 'const fs=require("fs"); const file="package-lock.json",lock=JSON.parse(fs.readFileSync(file)); lock.packages["node_modules/byokit"].version=process.env.FAKE_BYOKIT_VERSION; fs.writeFileSync(file,JSON.stringify(lock,null,2)+"\\n");'
  fi
fi
if [ "$FAKE_BUILD_FAILURE" = 1 ] && [ "$1" != ci ] && [ "$1" != update ]; then exit 9; fi
if [ -n "$EXPECTED_VERSION" ]; then node -e 'const fs=require("fs"),p=require("path"); const root=fs.existsSync("chrome-extension")?process.cwd():p.dirname(process.cwd()); for(const d of ["chrome-extension","obsidian-plugin"]) if(JSON.parse(fs.readFileSync(p.join(root,d,"manifest.json"))).version!==process.env.EXPECTED_VERSION) process.exit(8);'; fi
`, { mode: 0o755 });
  fs.writeFileSync(path.join(bin, 'sleep'), '#!/bin/sh\nexit 0\n', { mode: 0o755 });
  fs.writeFileSync(path.join(bin, 'gh'), `#!/usr/bin/env node
const fs=require('fs');const a=process.argv.slice(2);fs.appendFileSync(process.env.TEST_LOG,JSON.stringify(a)+'\\n');
if(a[0]==='api'){console.log('staff-000');process.exit(0);}
if(a[0]==='run'&&a[1]==='list'){
 const sha=a[a.indexOf('--commit')+1],workflow=a[a.indexOf('--workflow')+1];
 const tag=(workflow.includes('obsidian')?'nutegg-obsidian-plugin-':'nutegg-chrome-extension-')+process.env.EXPECTED_VERSION;
 console.log(JSON.stringify(process.env.FAKE_MISSING_RUN==='1'?[]:[{databaseId:999,headSha:sha,headBranch:'other-tag',event:'push'},{databaseId:workflow.includes('obsidian')?10:20,headSha:sha,headBranch:tag,event:'push'}]));process.exit(0);
}
if(a[0]==='run'&&a[1]==='watch')process.exit(process.env.FAKE_WORKFLOW_FAILURE==='1'?1:0);
if(a[0]==='release'&&a[1]==='view'){
 if(process.env.FAKE_EXISTING_RELEASE==='1'){
  if(a.includes('--json'))console.log(fs.readdirSync(process.env.FAKE_ASSET_DIR).join('\\n'));
  process.exit(0);
 }
 process.exit(1);
}
if(a[0]==='release'&&a[1]==='download'){
 const p=require('path'),name=a[a.indexOf('--pattern')+1],dir=a[a.indexOf('--dir')+1];
 fs.copyFileSync(p.join(process.env.FAKE_ASSET_DIR,name),p.join(dir,name));process.exit(0);
}
if(a[0]==='release'&&a[1]==='create')process.exit(process.env.FAKE_PUBLISH_FAILURE==='1'?1:0);
process.exit(0);
`, { mode: 0o755 });
  const env = { ...process.env, PATH: `${bin}:${process.env.PATH}`, TEST_LOG: log };
  const run = (args, extra = {}) => spawnSync('bash', ['release.sh', ...args], { cwd: repo, env: { ...env, ...extra }, encoding: 'utf8' });
  return { temp, repo, remote, git, write, run, env, log, read: name => JSON.parse(fs.readFileSync(path.join(repo, name), 'utf8')) };
}
function success(result) { assert.equal(result.status, 0, result.stdout + result.stderr); }

test('initial release uses pushed main, validates bumped versions, and publishes exact maintenance tags', t => {
  const f = fixture(t), main = f.git('rev-parse', 'main');
  success(f.run(['0.4.0'], { EXPECTED_VERSION: '0.4.0' }));
  assert.equal(f.git('branch', '--show-current'), 'release/0.4');
  for (const tag of ['0.4.0', 'nutegg-obsidian-plugin-0.4.0', 'nutegg-chrome-extension-0.4.0']) {
    assert.equal(f.git('rev-parse', `refs/tags/${tag}^{commit}`), f.git('rev-parse', 'HEAD'));
    assert.ok(f.git('ls-remote', '--tags', 'origin', `refs/tags/${tag}`));
  }
  assert.equal(f.git('rev-parse', 'HEAD^'), main);
  assert.equal(f.read('package-lock.json').packages['chrome-extension'].version, '0.4.0');
  assert.equal(f.read('obsidian-plugin/package-lock.json').packages[''].version, '0.4.0');
  const published = JSON.parse(f.git('show', 'origin/main:website/src/versions.json'));
  assert.equal(published.chromeExtension.githubVersion, '0.4.0');
  assert.equal(published.chromeExtension.storeVersion, '0.2.0');
  assert.equal(f.git('show', 'origin/main:chrome-extension/manifest.json'), f.git('show', 'main:chrome-extension/manifest.json'));
  const calls = fs.readFileSync(f.log, 'utf8');
  assert.match(calls, /"watch","10"/); assert.match(calls, /"watch","20"/); assert.doesNotMatch(calls, /"watch","999"/);
});

test('patch releases stay on maintenance and do not merge main features', t => {
  const f = fixture(t); success(f.run(['0.4.0'], { EXPECTED_VERSION: '0.4.0' }));
  f.git('checkout', 'main'); f.git('merge', '--ff-only', 'origin/main');
  f.write('new-main-feature.txt', 'Future feature'); f.git('add', '.'); f.git('commit', '-m', 'Main-only feature'); f.git('push', 'origin', 'main');
  f.git('checkout', 'release/0.4'); f.write('fix.txt', 'Maintenance fix'); f.git('add', '.'); f.git('commit', '-m', 'Fix');
  success(f.run(['0.4.1'], { EXPECTED_VERSION: '0.4.1' }));
  assert.equal(f.git('branch', '--show-current'), 'release/0.4');
  assert.equal(fs.existsSync(path.join(f.repo, 'new-main-feature.txt')), false);
  assert.equal(f.git('show', 'origin/main:new-main-feature.txt'), 'Future feature');
});

test('a new release refreshes BYOKit once in isolation and commits its lockfile before tagging', t => {
  const f = fixture(t);
  f.write('.gitignore', 'node_modules/\n'); f.git('add', '.gitignore'); f.git('commit', '-m', 'Ignore installed dependencies'); f.git('push', 'origin', 'main');
  f.write('node_modules/byokit/package.json', { version: '0.3.0' });
  success(f.run(['0.4.0'], { EXPECTED_VERSION: '0.4.0', FAKE_BYOKIT_VERSION: '0.3.1' }));
  const calls = fs.readFileSync(f.log, 'utf8');
  assert.equal((calls.match(/ update byokit /g) || []).length, 1);
  assert.ok(calls.indexOf(' ci ') < calls.indexOf(' update byokit '));
  assert.ok(calls.indexOf(' update byokit ') < calls.indexOf('/chrome-extension test'));
  assert.equal(f.read('package-lock.json').packages['node_modules/byokit'].version, '0.3.1');
  assert.equal(JSON.parse(f.git('show', '0.4.0:package-lock.json')).packages['node_modules/byokit'].version, '0.3.1');
  assert.equal(f.read('node_modules/byokit/package.json').version, '0.3.0', 'release preparation must not mutate the caller install');
  assert.equal(JSON.parse(f.git('show', 'origin/main:package-lock.json')).packages['node_modules/byokit'].version, '0.3.0');
});

test('a failed BYOKit refresh stops before testing, committing, or publishing', t => {
  const f = fixture(t), head = f.git('rev-parse', 'HEAD');
  const result = f.run(['0.4.0'], { EXPECTED_VERSION: '0.4.0', FAKE_UPDATE_FAILURE: '1' });
  assert.notEqual(result.status, 0);
  assert.equal(f.git('rev-parse', 'HEAD'), head);
  assert.equal(f.git('branch', '--show-current'), 'main');
  assert.equal(f.git('tag'), '');
  assert.equal(f.git('status', '--porcelain'), '');
  assert.equal(f.read('package-lock.json').packages['node_modules/byokit'].version, '0.3.0');
  assert.doesNotMatch(fs.readFileSync(f.log, 'utf8'), /\/chrome-extension test|"watch"/);
});

test('patch releases require an existing maintenance branch and new minor releases require pushed main', t => {
  const f = fixture(t);
  assert.match(f.run(['0.4.1']).stderr, /Missing maintenance branch/);
  f.write('local.txt', 'Unpushed'); f.git('add', '.'); f.git('commit', '-m', 'Unpushed');
  assert.match(f.run(['0.4.0']).stderr, /Push\/synchronize main/);
});

test('dry run checks selected release source without changing branch, tags, versions, or remote', t => {
  const f = fixture(t), head = f.git('rev-parse', 'HEAD');
  success(f.run(['0.4.0', '--dry-run'], { EXPECTED_VERSION: '0.4.0', FAKE_BYOKIT_VERSION: '0.3.1' }));
  assert.equal(f.git('rev-parse', 'HEAD'), head);
  assert.equal(f.git('branch', '--show-current'), 'main');
  assert.equal(f.git('tag'), ''); assert.equal(f.git('status', '--porcelain'), '');
  assert.equal(f.git('ls-remote', '--heads', 'origin').split('\n').length, 1);
  assert.equal(f.read('chrome-extension/manifest.json').version, '0.3.0');
  assert.equal(f.read('package-lock.json').packages['node_modules/byokit'].version, '0.3.0');
});

test('build failure publishes no refs and leaves the working checkout unchanged', t => {
  const f = fixture(t), head = f.git('rev-parse', 'HEAD');
  const result = f.run(['0.4.0'], { EXPECTED_VERSION: '0.4.0', FAKE_BUILD_FAILURE: '1' });
  assert.notEqual(result.status, 0);
  assert.equal(f.git('rev-parse', 'HEAD'), head); assert.equal(f.git('tag'), '');
  assert.equal(f.git('branch', '--show-current'), 'main');
});

test('published tags are immutable and an interrupted release resumes without re-bumping', t => {
  const f = fixture(t);
  const failed = f.run(['0.4.0'], { EXPECTED_VERSION: '0.4.0', FAKE_WORKFLOW_FAILURE: '1', FAKE_BYOKIT_VERSION: '0.3.1' });
  assert.notEqual(failed.status, 0); assert.match(failed.stderr, /Release build 10 failed/);
  const tag = f.git('rev-parse', 'refs/tags/0.4.0');
  assert.match(f.run(['0.4.0']).stderr, /already exists/);
  success(f.run(['0.4.0', '--resume'], { EXPECTED_VERSION: '0.4.0', FAKE_UPDATE_FAILURE: '1' }));
  assert.equal(f.git('rev-parse', 'refs/tags/0.4.0'), tag);
  assert.equal(f.read('chrome-extension/manifest.json').version, '0.4.0');
  assert.equal(f.read('package-lock.json').packages['node_modules/byokit'].version, '0.3.1');
  assert.equal((fs.readFileSync(f.log, 'utf8').match(/ update byokit /g) || []).length, 1);
});

test('missing workflow runs fail instead of reporting publication success', t => {
  const f = fixture(t);
  const result = f.run(['0.4.0'], { EXPECTED_VERSION: '0.4.0', FAKE_MISSING_RUN: '1' });
  assert.notEqual(result.status, 0); assert.match(result.stderr, /No release-obsidian.yml run appeared/);
});

test('dirty publication is blocked even with allow-dirty', t => {
  const f = fixture(t); f.write('dirty.txt', 'Local');
  assert.match(f.run(['0.4.0', '--allow-dirty']).stderr, /only supported for isolated dry runs/);
});

test('deterministic Chrome archives include runtime assets and ignore file timestamps', t => {
  const f = fixture(t), a = path.join(f.temp, 'a.zip'), b = path.join(f.temp, 'b.zip');
  f.write('chrome-extension/src/capture.js', 'capture'); f.write('chrome-extension/dist/ai-core.js', 'core');
  f.write('chrome-extension/_locales/en/messages.json', '{}'); f.write('chrome-extension/icons/icon.png', 'png');
  execFileSync('python3', [path.join(root, 'scripts/package-extension.py'), path.join(f.repo, 'chrome-extension'), a]);
  fs.utimesSync(path.join(f.repo, 'chrome-extension/src/capture.js'), new Date(0), new Date(0));
  execFileSync('python3', [path.join(root, 'scripts/package-extension.py'), path.join(f.repo, 'chrome-extension'), b]);
  assert.deepEqual(fs.readFileSync(a), fs.readFileSync(b));
});

test('remote maintenance fixes fast-forward locally before validation; divergence is rejected', t => {
  const f = fixture(t); success(f.run(['0.4.0'], { EXPECTED_VERSION: '0.4.0' }));
  const clone = path.join(f.temp, 'other');
  execFileSync('git', ['clone', '-b', 'release/0.4', f.remote, clone], { stdio: 'ignore' });
  const other = (...args) => execFileSync('git', args, { cwd: clone, stdio: ['ignore', 'pipe', 'pipe'] });
  other('config', 'user.name', 'Other'); other('config', 'user.email', 'other@example.test');
  fs.writeFileSync(path.join(clone, 'remote-fix.txt'), 'Remote fix'); other('add', '.'); other('commit', '-m', 'Remote fix'); other('push');
  success(f.run(['0.4.1'], { EXPECTED_VERSION: '0.4.1' }));
  assert.equal(fs.readFileSync(path.join(f.repo, 'remote-fix.txt'), 'utf8'), 'Remote fix');
  fs.writeFileSync(path.join(clone, 'another-fix.txt'), 'Another fix'); other('add', '.'); other('commit', '-m', 'Another remote fix');
  // This checkout branched from 0.4.0; create genuine divergence from local 0.4.1.
  other('push', '--force', 'origin', 'HEAD:refs/heads/release/0.4');
  const result = f.run(['0.4.2'], { EXPECTED_VERSION: '0.4.2' });
  assert.notEqual(result.status, 0); assert.match(result.stderr, /diverges/);
});

test('a dry run invoked on main validates the existing maintenance branch rather than main', t => {
  const f = fixture(t); success(f.run(['0.4.0'], { EXPECTED_VERSION: '0.4.0' }));
  f.git('checkout', 'main');
  success(f.run(['0.4.1', '--dry-run'], { EXPECTED_VERSION: '0.4.1' }));
  assert.equal(f.git('branch', '--show-current'), 'main');
  assert.equal(f.read('chrome-extension/manifest.json').version, '0.3.0');
  assert.equal(f.git('show', 'release/0.4:chrome-extension/manifest.json').includes('0.4.0'), true);
});

test('website updates never downgrade newer release lines or change store/community versions', t => {
  const f = fixture(t);
  f.write('website/src/versions.json', { chromeExtension: { githubVersion: '0.5.0', storeVersion: '0.4.0' },
    obsidianPlugin: { githubVersion: '0.5.0', communityVersion: '0.4.0' } });
  execFileSync('node', [path.join(root, 'scripts/release-tools.mjs'), 'website', f.repo, '0.4.2']);
  assert.equal(f.read('website/src/versions.json').chromeExtension.githubVersion, '0.5.0');
  assert.equal(f.read('website/src/versions.json').obsidianPlugin.communityVersion, '0.4.0');
});

test('source verification requires matching versions and maintenance-branch ancestry', t => {
  const f = fixture(t);
  execFileSync('node', [path.join(root, 'scripts/release-tools.mjs'), 'bump', f.repo, '0.4.0']);
  f.git('checkout', '-b', 'release/0.4'); f.git('add', '.'); f.git('commit', '-m', 'Release'); f.git('push', '-u', 'origin', 'release/0.4');
  const verify = () => spawnSync('node', [path.join(root, 'scripts/release-tools.mjs'), 'verify-source', f.repo, '0.4.0'], { encoding: 'utf8' });
  success(verify());
  f.write('chrome-extension/manifest.json', { version: '0.4.1' });
  assert.notEqual(verify().status, 0);
});

test('distribution publishing preserves tags on rerun and rejects changed release files', t => {
  const f = fixture(t);
  f.write('main.js', 'Published code'); f.git('add', 'main.js');
  const publish = extra => spawnSync('bash', ['scripts/publish-release-assets.sh', 'staff-000/test-release', '0.4.0', 'component-0.4.0', 'main', 'main.js'],
    { cwd: f.repo, env: { ...f.env, ...extra }, encoding: 'utf8' });
  success(publish({}));
  const tag = f.git('rev-parse', 'refs/tags/0.4.0');
  success(publish({})); assert.equal(f.git('rev-parse', 'refs/tags/0.4.0'), tag);
  f.write('main.js', 'Changed code'); f.git('add', 'main.js');
  const changed = publish({}); assert.notEqual(changed.status, 0); assert.match(changed.stderr, /different files/);
  assert.equal(f.git('rev-parse', 'refs/tags/0.4.0'), tag);
});

test('distribution publication errors propagate instead of becoming successful workflow steps', t => {
  const f = fixture(t); f.write('main.js', 'Code'); f.git('add', 'main.js');
  const result = spawnSync('bash', ['scripts/publish-release-assets.sh', 'staff-000/test-release', '0.4.0', 'component-0.4.0', 'main', 'main.js'],
    { cwd: f.repo, env: { ...f.env, FAKE_PUBLISH_FAILURE: '1' }, encoding: 'utf8' });
  assert.notEqual(result.status, 0);
});

test('resume recovers a rejected atomic push without deleting unpublished local tags', t => {
  const f = fixture(t), hook = path.join(f.remote, 'hooks/pre-receive');
  fs.writeFileSync(hook, '#!/bin/sh\necho "Simulated remote rejection" >&2\nexit 1\n', { mode: 0o755 });
  assert.notEqual(f.run(['0.4.0'], { EXPECTED_VERSION: '0.4.0' }).status, 0);
  const tag = f.git('rev-parse', 'refs/tags/0.4.0');
  assert.equal(f.git('ls-remote', '--heads', 'origin', 'release/0.4'), '');
  fs.rmSync(hook);
  success(f.run(['0.4.0', '--resume'], { EXPECTED_VERSION: '0.4.0' }));
  assert.equal(f.git('rev-parse', 'refs/tags/0.4.0'), tag);
  assert.ok(f.git('ls-remote', '--heads', 'origin', 'release/0.4'));
});

test('existing distribution assets are compared, missing assets are uploaded, and conflicts fail', t => {
  const f = fixture(t), assets = path.join(f.temp, 'assets'); fs.mkdirSync(assets);
  f.write('main.js', 'Original code'); f.write('styles.css', 'Original style'); f.git('add', '.');
  const publish = extra => spawnSync('bash', ['scripts/publish-release-assets.sh', 'staff-000/test-release', '0.4.0', 'component-0.4.0', 'main', 'main.js', 'styles.css'],
    { cwd: f.repo, env: { ...f.env, ...extra }, encoding: 'utf8' });
  success(publish({})); fs.writeFileSync(path.join(assets, 'main.js'), 'Original code');
  const extra = { FAKE_EXISTING_RELEASE: '1', FAKE_ASSET_DIR: assets };
  success(publish(extra));
  assert.match(fs.readFileSync(f.log, 'utf8'), /"upload","0.4.0","styles.css"/);
  fs.writeFileSync(path.join(assets, 'main.js'), 'Conflicting published code');
  const failed = publish(extra); assert.notEqual(failed.status, 0); assert.match(failed.stderr, /Published asset main.js differs/);
  assert.equal(fs.readFileSync(path.join(assets, 'main.js'), 'utf8'), 'Conflicting published code');
});

test('website update retries preserve concurrent main changes', t => {
  const f = fixture(t);
  assert.notEqual(f.run(['0.4.0'], { EXPECTED_VERSION: '0.4.0', FAKE_WORKFLOW_FAILURE: '1' }).status, 0);
  const clone = path.join(f.temp, 'website-writer'), once = path.join(f.temp, 'pushed');
  execFileSync('git', ['clone', '-b', 'main', f.remote, clone], { stdio: 'ignore' });
  const other = (...args) => execFileSync('git', args, { cwd: clone, stdio: ['ignore', 'pipe', 'pipe'] });
  other('config', 'user.name', 'Website Writer'); other('config', 'user.email', 'website@example.test');
  const versions = path.join(clone, 'website/src/versions.json'), data = JSON.parse(fs.readFileSync(versions));
  data.chromeExtension.storeVersion = '0.3.5'; fs.writeFileSync(versions, JSON.stringify(data));
  fs.writeFileSync(path.join(clone, 'main-only.txt'), 'Concurrent feature'); other('add', '.'); other('commit', '-m', 'Concurrent main update');
  const hook = `#!/usr/bin/env node
const fs=require('fs'),cp=require('child_process');
const input=fs.readFileSync(0,'utf8');
if(input.includes('refs/heads/main')&&!fs.existsSync(${JSON.stringify(once)})){
 fs.writeFileSync(${JSON.stringify(once)},'once');
 const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!key.startsWith('GIT_')));
 cp.execFileSync('git',['push','origin','main'],{cwd:${JSON.stringify(clone)},stdio:'inherit',env});
}
`;
  fs.writeFileSync(path.join(f.repo, '.git/hooks/pre-push'), hook, { mode: 0o755 });
  success(f.run(['0.4.0', '--resume'], { EXPECTED_VERSION: '0.4.0' }));
  const published = JSON.parse(f.git('show', 'origin/main:website/src/versions.json'));
  assert.equal(published.chromeExtension.storeVersion, '0.3.5');
  assert.equal(published.chromeExtension.githubVersion, '0.4.0');
  assert.equal(f.git('show', 'origin/main:main-only.txt'), 'Concurrent feature');
});

test('isolated release checks can load jsdom installed only in the sibling Obsidian workspace', t => {
  const f = fixture(t);
  f.write('.gitignore', 'node_modules/\n'); f.git('add', '.gitignore'); f.git('commit', '-m', 'Ignore installed dependencies'); f.git('push', 'origin', 'main');
  const installed = path.dirname(path.dirname(require.resolve('jsdom', { paths: [path.join(root, 'obsidian-plugin')] })));
  const modules = path.join(f.repo, 'obsidian-plugin/node_modules'); fs.mkdirSync(modules);
  fs.symlinkSync(installed, path.join(modules, 'jsdom'), 'dir');
  const npm = path.join(f.env.PATH.split(path.delimiter)[0], 'npm');
  fs.appendFileSync(npm, `\nif [ "$CHECK_DOM" = 1 ] && [ "$1" = test ]; then node -e 'const {JSDOM}=require("jsdom"); const dom=new JSDOM("<p>Release check</p>"); if(dom.window.document.querySelector("p").textContent!=="Release check")process.exit(7); dom.window.close();'; fi\n`);
  const head = f.git('rev-parse', 'HEAD');
  success(f.run(['--check'], { EXPECTED_VERSION: '0.3.0', CHECK_DOM: '1', NODE_PATH: '', FAKE_UPDATE_FAILURE: '1' }));
  assert.equal(f.git('rev-parse', 'HEAD'), head);
  assert.equal(f.git('branch', '--show-current'), 'main');
  assert.equal(f.git('status', '--porcelain'), '');
  assert.doesNotMatch(fs.readFileSync(f.log, 'utf8'), / update byokit | ci /);
});
