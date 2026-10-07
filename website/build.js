const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const SRC_DIR = path.join(ROOT_DIR, 'src');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const ICONS_SRC_DIR = path.join(ROOT_DIR, '..', 'chrome-extension', 'icons');

function copyRecursive(src, dest) {
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      if (entry.startsWith('.') && entry !== '.nojekyll') continue;
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    const parent = path.dirname(dest);
    if (!fs.existsSync(parent)) {
      fs.mkdirSync(parent, { recursive: true });
    }
    fs.copyFileSync(src, dest);
  }
}

function build() {
  console.log('🌰/🥚 Building NutEgg Website...');

  // 1. Reset dist directory
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(DIST_DIR, { recursive: true });

  // 2. Copy source files from src/ to dist/
  if (fs.existsSync(SRC_DIR)) {
    copyRecursive(SRC_DIR, DIST_DIR);
    console.log('   ✅ Copied static pages and assets from src/');
  } else {
    console.error('❌ Error: src/ directory not found!');
    process.exit(1);
  }

  // 3. Copy icons from chrome-extension/icons/ to dist/icons/
  const distIconsDir = path.join(DIST_DIR, 'icons');
  if (fs.existsSync(ICONS_SRC_DIR)) {
    copyRecursive(ICONS_SRC_DIR, distIconsDir);
    console.log('   ✅ Copied brand icons from chrome-extension/icons/');
  } else {
    console.warn('   ⚠️  Warning: chrome-extension/icons/ not found');
  }

  // 4. Inject versions into HTML files
  const versionsFile = path.join(SRC_DIR, 'versions.json');
  let versions = null;
  if (fs.existsSync(versionsFile)) {
    try {
      versions = JSON.parse(fs.readFileSync(versionsFile, 'utf8'));
    } catch (e) {
      console.warn('   ⚠️ Could not parse versions.json:', e.message);
    }
  }

  // Fallbacks if versions.json missing or partial
  const chromeStoreVer = versions?.chromeExtension?.storeVersion || versions?.chromeExtension?.version || '0.2.3';
  const chromeGithubVer = versions?.chromeExtension?.githubVersion || versions?.chromeExtension?.version || '0.3.0';
  const chromeZipUrl = versions?.chromeExtension?.githubZipUrl || `https://github.com/staff-000/nutegg-chrome-extension-release/releases/download/${chromeGithubVer}/nutegg-chrome-extension-${chromeGithubVer}.zip`;
  const chromeReleaseUrl = versions?.chromeExtension?.githubReleaseUrl || 'https://github.com/staff-000/nutegg-chrome-extension-release/releases/latest';

  const obsidianCommunityVer = versions?.obsidianPlugin?.communityVersion || versions?.obsidianPlugin?.version || '0.3.0';
  const obsidianGithubVer = versions?.obsidianPlugin?.githubVersion || versions?.obsidianPlugin?.version || '0.3.0';
  const obsidianReleaseUrl = versions?.obsidianPlugin?.githubReleaseUrl || 'https://github.com/staff-000/nutegg-obsidian-release/releases/latest';

  function templateHtmlFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    content = content
      .replaceAll('{{CHROME_STORE_VERSION}}', chromeStoreVer)
      .replaceAll('{{CHROME_GITHUB_VERSION}}', chromeGithubVer)
      .replaceAll('{{CHROME_VERSION}}', chromeStoreVer)
      .replaceAll('{{CHROME_ZIP_URL}}', chromeZipUrl)
      .replaceAll('{{CHROME_RELEASE_URL}}', chromeReleaseUrl)
      .replaceAll('{{OBSIDIAN_COMMUNITY_VERSION}}', obsidianCommunityVer)
      .replaceAll('{{OBSIDIAN_GITHUB_VERSION}}', obsidianGithubVer)
      .replaceAll('{{OBSIDIAN_VERSION}}', obsidianCommunityVer)
      .replaceAll('{{OBSIDIAN_RELEASE_URL}}', obsidianReleaseUrl);
    fs.writeFileSync(filePath, content, 'utf8');
  }

  templateHtmlFile(path.join(DIST_DIR, 'index.html'));
  const docsDir = path.join(DIST_DIR, 'docs');
  if (fs.existsSync(docsDir)) {
    const docFiles = fs.readdirSync(docsDir).filter(f => f.endsWith('.html'));
    for (const f of docFiles) {
      templateHtmlFile(path.join(docsDir, f));
    }
  }
  console.log(`   ✅ Interpolated versions (Chrome Store: v${chromeStoreVer}, Chrome GitHub: v${chromeGithubVer}, Obsidian Community: v${obsidianCommunityVer}, Obsidian GitHub: v${obsidianGithubVer}) into HTML`);

  // 5. Create .nojekyll for GitHub Pages
  fs.writeFileSync(path.join(DIST_DIR, '.nojekyll'), '');
  console.log('   ✅ Added .nojekyll configuration');

  console.log('✨ NutEgg website built successfully in website/dist/');
}

build();

