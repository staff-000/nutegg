const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
function fixture(t, extra = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nutegg-provenance-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const bin = path.join(dir, 'bin'); fs.mkdirSync(bin);
  const old = path.join(dir, 'old.json'), fresh = path.join(dir, 'new.json'), output = path.join(dir, 'provenance.json');
  fs.writeFileSync(old, 'old verified bundle'); fs.writeFileSync(fresh, 'new signed bundle');
  fs.writeFileSync(path.join(bin, 'gh'), `#!/usr/bin/env node
const fs=require('node:fs'),path=require('node:path'); const a=process.argv.slice(2);
fs.appendFileSync(process.env.LOG,JSON.stringify(a)+'\\n');
if(a[0]==='api'){if(process.env.API_FAIL)process.exit(1); if(process.env.EXISTING)console.log('provenance.json');}
if(a[0]==='release'&&a[1]==='download')fs.copyFileSync(process.env.OLD,path.join(a[a.indexOf('--dir')+1],'provenance.json'));
if(a[0]==='attestation'){
 if(process.env.VERIFY_FAIL||!fs.existsSync(a[a.indexOf('--bundle')+1]))process.exit(1);
}
`, { mode: 0o755 });
  const log = path.join(dir, 'log');
  const run = () => spawnSync('bash', [path.join(root, 'scripts/prepare-release-provenance.sh'), 'staff-000/nutegg', 'staff-000/nutegg-obsidian-release', '0.4.3', 'nutegg-obsidian-plugin-0.4.3', 'abc123', fresh, output, 'main.js', 'styles.css', 'manifest.json'], { env: { ...process.env, PATH: bin + path.delimiter + process.env.PATH, LOG: log, OLD: old, ...extra }, encoding: 'utf8' });
  return { run, old, fresh, output, calls: () => fs.readFileSync(log, 'utf8').trim().split('\n').map(JSON.parse) };
}
test('new provenance verifies all assets and pins source identity before publication', t => {
  const f = fixture(t); assert.equal(f.run().status, 0);
  assert.equal(fs.readFileSync(f.output, 'utf8'), 'new signed bundle');
  const verify = f.calls().filter(a => a[0] === 'attestation'); assert.equal(verify.length, 3);
  for (const args of verify) {
    assert.equal(args[args.indexOf('--source-digest')+1], 'abc123');
    assert.equal(args[args.indexOf('--source-ref')+1], 'refs/tags/nutegg-obsidian-plugin-0.4.3');
    assert.equal(args[args.indexOf('--signer-workflow')+1], 'staff-000/nutegg/.github/workflows/release-obsidian.yml');
  }
});
test('rerun preserves verified existing bundle even when a new signature differs', t => {
  const f = fixture(t, { EXISTING: '1' }); assert.equal(f.run().status, 0);
  assert.equal(fs.readFileSync(f.output, 'utf8'), 'old verified bundle');
});
for (const extra of [{ VERIFY_FAIL: '1' }, { API_FAIL: '1' }, { EXISTING: '1', VERIFY_FAIL: '1' }]) {
  test(`provenance fails closed: ${JSON.stringify(extra)}`, t => {
    const f = fixture(t, extra); assert.notEqual(f.run().status, 0); assert.ok(!fs.existsSync(f.output));
  });
}
test('missing generated bundle prevents publication', t => {
  const f = fixture(t); fs.unlinkSync(f.fresh); assert.notEqual(f.run().status, 0); assert.ok(!fs.existsSync(f.output));
});
