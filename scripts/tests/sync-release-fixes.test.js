const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const SCRIPT_SRC = path.resolve(__dirname, '../sync-release-fixes.sh');

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

test('sync-release-fixes.sh skips release version commits, cherry-picks fixes to main, and is idempotent', t => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'nutegg-sync-fixes-'));
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));

  git(tmp, 'init', '-b', 'main');
  git(tmp, 'config', 'user.email', 'test@example.com');
  git(tmp, 'config', 'user.name', 'Test User');

  fs.writeFileSync(path.join(tmp, 'app.txt'), 'v1\n');
  fs.writeFileSync(path.join(tmp, 'version.txt'), '0.4.0\n');
  git(tmp, 'add', '.');
  git(tmp, 'commit', '-m', 'initial');

  // Create release/0.4 branch with a version commit and a bugfix commit
  git(tmp, 'checkout', '-b', 'release/0.4');
  fs.writeFileSync(path.join(tmp, 'version.txt'), '0.4.1\n');
  git(tmp, 'add', 'version.txt');
  git(tmp, 'commit', '-m', 'chore: release 0.4.1');

  fs.writeFileSync(path.join(tmp, 'app.txt'), 'v1\nfix1\n');
  git(tmp, 'add', 'app.txt');
  git(tmp, 'commit', '-m', 'fix: handle edge case');

  // Dry run lists only the fix commit, not the release commit
  const dryOut = execFileSync('bash', [SCRIPT_SRC, 'release/0.4', '--dry-run', '--no-pull', '--no-lint'], {
    cwd: tmp,
    encoding: 'utf8',
  });
  assert.match(dryOut, /Found 1 pending fix commit/);
  assert.match(dryOut, /fix: handle edge case/);
  assert.doesNotMatch(dryOut, /chore: release 0\.4\.1/);

  // Real sync switches to main and cherry-picks only the fix commit
  const syncOut = execFileSync('bash', [SCRIPT_SRC, 'release/0.4', '--no-pull', '--no-lint'], {
    cwd: tmp,
    encoding: 'utf8',
  });
  assert.match(syncOut, /Synced 1 fix commit/);
  assert.equal(git(tmp, 'branch', '--show-current'), 'main');
  assert.equal(fs.readFileSync(path.join(tmp, 'app.txt'), 'utf8'), 'v1\nfix1\n');
  // version.txt on main must NOT have been bumped by the release commit
  assert.equal(fs.readFileSync(path.join(tmp, 'version.txt'), 'utf8'), '0.4.0\n');

  // Re-running is a no-op
  const secondOut = execFileSync('bash', [SCRIPT_SRC, 'release/0.4', '--no-pull', '--no-lint'], {
    cwd: tmp,
    encoding: 'utf8',
  });
  assert.match(secondOut, /main is up to date/);
});

