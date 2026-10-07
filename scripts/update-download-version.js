#!/usr/bin/env node
/**
 * scripts/update-download-version.js
 *
 * Manually or automatically update download versions and URLs for
 * Chrome Extension and Obsidian Plugin on the NutEgg website.
 *
 * Store/Community versions and GitHub release versions are decoupled because
 * Chrome Web Store review takes days, whereas GitHub Releases publish instantly.
 *
 * Usage:
 *   # Show current configured versions:
 *   node scripts/update-download-version.js --status
 *
 *   # Update GitHub release versions (both Chrome & Obsidian) - used by release.sh:
 *   node scripts/update-download-version.js 0.3.1
 *   npm run update:version -- 0.3.1
 *
 *   # Update Chrome Web Store version (e.g. after Google approves):
 *   node scripts/update-download-version.js --chrome-store 0.2.4
 *
 *   # Update Obsidian Community plugin version:
 *   node scripts/update-download-version.js --obsidian-community 0.3.1
 *
 *   # Update GitHub release download version for Chrome only:
 *   node scripts/update-download-version.js --chrome-github 0.3.1
 *
 *   # Update all 4 versions at once:
 *   node scripts/update-download-version.js --all 0.3.1
 *
 *   # Skip automatic website build:
 *   node scripts/update-download-version.js 0.3.1 --no-build
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const VERSIONS_PATH = path.join(ROOT_DIR, 'website', 'src', 'versions.json');
const BUILD_SCRIPT = path.join(ROOT_DIR, 'website', 'build.js');
const REPO_OWNER = 'staff-000';

function loadVersions() {
  if (fs.existsSync(VERSIONS_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(VERSIONS_PATH, 'utf8'));
      if (data.chromeExtension && data.obsidianPlugin) {
        return data;
      }
    } catch (e) {
      console.warn('⚠️ Warning reading versions.json, recreating defaults:', e.message);
    }
  }

  let chromeVer = '0.3.0';
  let obsidianVer = '0.3.0';

  try {
    chromeVer = require(path.join(ROOT_DIR, 'chrome-extension', 'manifest.json')).version || chromeVer;
  } catch {}

  try {
    obsidianVer = require(path.join(ROOT_DIR, 'obsidian-plugin', 'manifest.json')).version || obsidianVer;
  } catch {}

  return {
    chromeExtension: {
      storeVersion: '0.2.3',
      githubVersion: chromeVer,
      storeUrl: 'https://chromewebstore.google.com/detail/nutegg/bmdmdiicembobejibggoeiahaonphcol',
      githubZipUrl: `https://github.com/${REPO_OWNER}/nutegg-chrome-extension-release/releases/download/${chromeVer}/nutegg-chrome-extension-${chromeVer}.zip`,
      githubReleaseUrl: `https://github.com/${REPO_OWNER}/nutegg-chrome-extension-release/releases/latest`
    },
    obsidianPlugin: {
      communityVersion: obsidianVer,
      githubVersion: obsidianVer,
      communityUrl: 'https://community.obsidian.md/plugins/nutegg',
      githubReleaseUrl: `https://github.com/${REPO_OWNER}/nutegg-obsidian-release/releases/latest`
    }
  };
}

function cleanVer(v) {
  if (!v) return '';
  return String(v).replace(/^v/, '').trim();
}

function printStatus(data) {
  console.log(`
🌰/🥚 Current Download Versions in website/src/versions.json:
  ┌─ Chrome Extension
  │  • Chrome Web Store:      v${data.chromeExtension.storeVersion || 'n/a'}
  │  • GitHub Release (.zip): v${data.chromeExtension.githubVersion || 'n/a'}
  │  • Zip Download URL:      ${data.chromeExtension.githubZipUrl}
  │
  └─ Obsidian Plugin
     • Community Plugins:     v${data.obsidianPlugin.communityVersion || 'n/a'}
     • GitHub Release:        v${data.obsidianPlugin.githubVersion || 'n/a'}
     • Release URL:           ${data.obsidianPlugin.githubReleaseUrl}
`);
}

function printHelp() {
  console.log(`
🌰/🥚 NutEgg Website Download Version Updater

Usage:
  node scripts/update-download-version.js [options] [version]

Commands & Options:
  --status, -s                    Display current configured versions and URLs
  <version>                       Update GitHub release version for Chrome and Obsidian
  --chrome-store <ver>            Update Chrome Web Store button version badge
  --chrome-github <ver>           Update Chrome GitHub .zip download version and URL
  --chrome <ver>                  Alias for --chrome-github <ver>
  --obsidian-community <ver>      Update Obsidian Community button version badge
  --obsidian-github <ver>         Update Obsidian GitHub release version
  --obsidian <ver>                Alias for --obsidian-github <ver>
  --all <ver>                     Update all 4 versions (store + github for both)
  --no-build                      Skip running website/build.js after saving
  --help, -h                      Show this help message

Examples:
  # When releasing via release.sh:
  node scripts/update-download-version.js 0.3.1

  # When Chrome Web Store approves your extension:
  node scripts/update-download-version.js --chrome-store 0.3.0

  # When Obsidian Community plugin approves/updates:
  node scripts/update-download-version.js --obsidian-community 0.3.1

  # Or through npm script:
  npm run update:version -- --chrome-store 0.3.0
`);
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(args.length === 0 ? 1 : 0);
  }

  const data = loadVersions();

  if (args.includes('--status') || args.includes('-s')) {
    printStatus(data);
    process.exit(0);
  }

  let chromeStoreVer = null;
  let chromeGithubVer = null;
  let obsidianCommunityVer = null;
  let obsidianGithubVer = null;
  let shouldBuild = !args.includes('--no-build');

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if ((arg === '--chrome-store' || arg === '--chrome-web-store') && args[i + 1]) {
      chromeStoreVer = cleanVer(args[++i]);
    } else if (arg === '--chrome-github' && args[i + 1]) {
      chromeGithubVer = cleanVer(args[++i]);
    } else if (arg === '--chrome' && args[i + 1]) {
      chromeGithubVer = cleanVer(args[++i]);
    } else if ((arg === '--obsidian-community' || arg === '--obsidian-store') && args[i + 1]) {
      obsidianCommunityVer = cleanVer(args[++i]);
    } else if (arg === '--obsidian-github' && args[i + 1]) {
      obsidianGithubVer = cleanVer(args[++i]);
    } else if (arg === '--obsidian' && args[i + 1]) {
      obsidianGithubVer = cleanVer(args[++i]);
    } else if (arg === '--all' && args[i + 1]) {
      const v = cleanVer(args[++i]);
      chromeStoreVer = v;
      chromeGithubVer = v;
      obsidianCommunityVer = v;
      obsidianGithubVer = v;
    } else if (!arg.startsWith('-')) {
      // Positional version: update github release versions for both
      const v = cleanVer(arg);
      chromeGithubVer = v;
      obsidianGithubVer = v;
    }
  }

  const hasChanges = chromeStoreVer || chromeGithubVer || obsidianCommunityVer || obsidianGithubVer;
  if (!hasChanges) {
    console.error('❌ Error: No valid version changes specified.');
    printHelp();
    process.exit(1);
  }

  if (chromeStoreVer) {
    data.chromeExtension.storeVersion = chromeStoreVer;
    console.log(`🌐 Chrome Web Store version updated to: v${chromeStoreVer}`);
  }

  if (chromeGithubVer) {
    data.chromeExtension.githubVersion = chromeGithubVer;
    data.chromeExtension.githubZipUrl = `https://github.com/${REPO_OWNER}/nutegg-chrome-extension-release/releases/download/${chromeGithubVer}/nutegg-chrome-extension-${chromeGithubVer}.zip`;
    console.log(`📦 Chrome Extension GitHub .zip version updated to: v${chromeGithubVer}`);
    console.log(`   🔗 Zip URL: ${data.chromeExtension.githubZipUrl}`);
  }

  if (obsidianCommunityVer) {
    data.obsidianPlugin.communityVersion = obsidianCommunityVer;
    console.log(`🥚 Obsidian Community version updated to: v${obsidianCommunityVer}`);
  }

  if (obsidianGithubVer) {
    data.obsidianPlugin.githubVersion = obsidianGithubVer;
    console.log(`📦 Obsidian Plugin GitHub release version updated to: v${obsidianGithubVer}`);
    console.log(`   🔗 Release URL: ${data.obsidianPlugin.githubReleaseUrl}`);
  }

  fs.mkdirSync(path.dirname(VERSIONS_PATH), { recursive: true });
  fs.writeFileSync(VERSIONS_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`💾 Saved updated versions to ${path.relative(ROOT_DIR, VERSIONS_PATH)}`);

  if (shouldBuild && fs.existsSync(BUILD_SCRIPT)) {
    console.log('\n🏗️ Rebuilding website with updated versions...');
    const result = spawnSync('node', [BUILD_SCRIPT], { stdio: 'inherit' });
    if (result.status === 0) {
      console.log('✨ Website build complete! Dist files updated.');
    } else {
      console.warn('⚠️ Website build exited with code', result.status);
    }
  }
}

main();
