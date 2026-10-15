#!/usr/bin/env node
/**
 * scripts/format.js
 *
 * Code formatting tool for NutEgg.
 * Uses Prettier to format source code across shared, chrome-extension, obsidian-plugin, and scripts.
 * Automatically runs chrome-extension build after formatting if shared/ was touched.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const isCheck = args.includes('--check');

// Target file globs to format
const defaultTargets = [
  'shared/src/**/*.{ts,js}',
  'obsidian-plugin/src/**/*.{ts,js}',
  'chrome-extension/src/**/*.{js,html,css}',
  'website/src/**/*.{html,js,css}',
  'scripts/**/*.js',
];

// Determine prettier binary
let prettierBin = path.join(ROOT_DIR, 'promo-video', 'node_modules', '.bin', 'prettier');
let useNpx = false;
if (!fs.existsSync(prettierBin)) {
  useNpx = true;
}

const prettierArgs = [isCheck ? '--check' : '--write', ...defaultTargets];

console.log(isCheck ? '🔍 Checking code formatting with Prettier...' : '🎨 Formatting code with Prettier...');

const runCommand = useNpx ? 'npx' : prettierBin;
const runArgs = useNpx ? ['prettier', ...prettierArgs] : prettierArgs;

const result = spawnSync(runCommand, runArgs, {
  cwd: ROOT_DIR,
  stdio: 'inherit',
});

if (result.status !== 0) {
  process.exit(result.status || 1);
}

// Ensure chrome-extension bundle is in sync when writing
if (!isCheck) {
  console.log('\n📦 Rebuilding Chrome extension ai-core bundle...');
  const buildResult = spawnSync(process.execPath, ['build.js'], {
    cwd: path.join(ROOT_DIR, 'chrome-extension'),
    encoding: 'utf8',
  });
  if (buildResult.status === 0) {
    console.log('✅ Chrome extension core rebuilt successfully.');
  } else {
    console.error('❌ Failed to rebuild Chrome extension core:', buildResult.stderr);
    process.exit(1);
  }
}
