#!/usr/bin/env node
/**
 * scripts/lint.js
 *
 * Fast, comprehensive codebase linter for NutEgg.
 * Checks:
 *   1. TypeScript compilation & type safety across obsidian-plugin and shared
 *   2. JavaScript syntax validation (node --check) across all workspaces
 *   3. Python syntax & compilation validation (python3 -m py_compile)
 *   4. HTML DOM & structural validation (duplicate IDs, void elements, tags)
 *   5. JSON validity across package.json, manifests, and configs
 *   6. Build integrity and critical invariants
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

let JSDOM;
try {
  JSDOM = require('jsdom').JSDOM;
} catch {
  try {
    JSDOM = require(path.join(__dirname, '..', 'obsidian-plugin', 'node_modules', 'jsdom')).JSDOM;
  } catch {}
}

const ROOT_DIR = path.resolve(__dirname, '..');
let hasErrors = false;
const TOTAL_STEPS = 6;

function logStep(step, name) {
  console.log(`\n🔍 [${step}/${TOTAL_STEPS}] ${name}...`);
}

function logSuccess(msg) {
  console.log(`   ✅ ${msg}`);
}

function logWarn(msg) {
  console.log(`   ⚠️  ${msg}`);
}

function logError(msg) {
  console.error(`   ❌ ${msg}`);
  hasErrors = true;
}

// -------------------------------------------------------------
// 1. TypeScript Type Checking (Shared Core + Obsidian Plugin)
// -------------------------------------------------------------
logStep(1, 'TypeScript type checking (shared & obsidian-plugin)');
const tscResult = spawnSync('npx', ['tsc', '--noEmit', '--skipLibCheck'], {
  cwd: path.join(ROOT_DIR, 'obsidian-plugin'),
  encoding: 'utf8',
});

if (tscResult.status === 0) {
  logSuccess('TypeScript types verified with 0 errors');
} else {
  logError('TypeScript type errors found:');
  console.error(tscResult.stdout || tscResult.stderr);
}

// -------------------------------------------------------------
// 2. JavaScript Syntax Checking (node --check)
// -------------------------------------------------------------
logStep(2, 'JavaScript syntax validation');

const jsDirs = [
  path.join(ROOT_DIR, 'chrome-extension', 'src'),
  path.join(ROOT_DIR, 'chrome-extension', 'tests'),
  path.join(ROOT_DIR, 'scripts'),
  path.join(ROOT_DIR, 'website', 'src'),
];

function getFilesByExt(dir, exts) {
  let files = [];
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', 'dist', '.git', '.venv'].includes(entry.name)) {
        files = files.concat(getFilesByExt(full, exts));
      }
    } else if (exts.some(ext => entry.name.endsWith(ext))) {
      files.push(full);
    }
  }
  return files;
}

const allJsFiles = jsDirs.flatMap(dir => getFilesByExt(dir, ['.js', '.mjs']));
let jsErrors = 0;

for (const file of allJsFiles) {
  const check = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (check.status !== 0) {
    logError(`Syntax error in ${path.relative(ROOT_DIR, file)}:\n${check.stderr}`);
    jsErrors++;
  }
}

if (jsErrors === 0) {
  logSuccess(`All ${allJsFiles.length} JavaScript files passed syntax verification`);
}

// -------------------------------------------------------------
// 3. Python Syntax Validation (python3 -m py_compile)
// -------------------------------------------------------------
logStep(3, 'Python syntax validation');

const pyFiles = getFilesByExt(ROOT_DIR, ['.py']);
let pyErrors = 0;

if (pyFiles.length === 0) {
  logSuccess('Python scan clean: no workspace Python files found (scanned excluding .venv)');
} else {
  for (const file of pyFiles) {
    const compile = spawnSync('python3', ['-m', 'py_compile', file], { encoding: 'utf8' });
    if (compile.status !== 0) {
      logError(`Python syntax error in ${path.relative(ROOT_DIR, file)}:\n${compile.stderr}`);
      pyErrors++;
    }
  }
  if (pyErrors === 0) {
    logSuccess(`All ${pyFiles.length} Python files passed compilation verification`);
  }
}

// -------------------------------------------------------------
// 4. HTML DOM & Structural Validation
// -------------------------------------------------------------
logStep(4, 'HTML validation & DOM linting');

const htmlFiles = getFilesByExt(ROOT_DIR, ['.html']);
let htmlErrors = 0;

for (const file of htmlFiles) {
  const relPath = path.relative(ROOT_DIR, file);
  const content = fs.readFileSync(file, 'utf8');

  // Check 1: DOCTYPE
  if (!content.trim().toLowerCase().startsWith('<!doctype html')) {
    logWarn(`Missing <!DOCTYPE html> in ${relPath}`);
  }

  // Check 2: Closing void elements (e.g. </br>, </img>, </input>)
  const badVoid = content.match(/<\/(?:br|img|input|meta|link|hr|area|base|col|embed|param|source|track|wbr)>/gi);
  if (badVoid) {
    logError(`Illegal closing void tag ${badVoid.join(', ')} in ${relPath}`);
    htmlErrors++;
  }

  // Check 3: Duplicate IDs
  if (JSDOM) {
    try {
      const dom = new JSDOM(content);
      const doc = dom.window.document;
      const idNodes = doc.querySelectorAll('[id]');
      const seenIds = new Set();
      for (const node of idNodes) {
        const id = node.id;
        if (!id) continue;
        if (seenIds.has(id)) {
          logError(`Duplicate ID #${id} in ${relPath}`);
          htmlErrors++;
        }
        seenIds.add(id);
      }
    } catch (domErr) {
      logError(`HTML parsing error in ${relPath}: ${domErr.message}`);
      htmlErrors++;
    }
  } else {
    // Fallback regex duplicate ID check if JSDOM is not available
    const idMatches = [...content.matchAll(/\bid=["']([^"']+)["']/g)].map(m => m[1]);
    const seenIds = new Set();
    for (const id of idMatches) {
      if (seenIds.has(id)) {
        logError(`Duplicate ID #${id} in ${relPath}`);
        htmlErrors++;
      }
      seenIds.add(id);
    }
  }
}

if (htmlErrors === 0) {
  logSuccess(`All ${htmlFiles.length} HTML files passed DOM & structural validation`);
}

// -------------------------------------------------------------
// 5. JSON Validity Checking
// -------------------------------------------------------------
logStep(5, 'JSON files validation');

const jsonFiles = getFilesByExt(ROOT_DIR, ['.json']);
let jsonErrors = 0;

for (const file of jsonFiles) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    JSON.parse(content);
  } catch (err) {
    logError(`Invalid JSON in ${path.relative(ROOT_DIR, file)}: ${err.message}`);
    jsonErrors++;
  }
}

if (jsonErrors === 0) {
  logSuccess(`All ${jsonFiles.length} JSON files are valid`);
}

// -------------------------------------------------------------
// 6. Build Integrity & Distribution Files
// -------------------------------------------------------------
logStep(6, 'Build integrity check');

const buildExt = spawnSync(process.execPath, ['build.js'], {
  cwd: path.join(ROOT_DIR, 'chrome-extension'),
  encoding: 'utf8',
});

if (buildExt.status === 0) {
  logSuccess('Chrome extension core bundled successfully');
} else {
  logError(`Chrome extension bundle failed:\n${buildExt.stderr || buildExt.stdout}`);
}

// Summary
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
if (hasErrors) {
  console.error('❌ Linting failed. Please resolve the errors above.');
  process.exit(1);
} else {
  console.log('✨ Codebase lint passed! TypeScript, JavaScript, Python, HTML, and JSON are clean.');
  process.exit(0);
}
