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

  // 4. Create .nojekyll for GitHub Pages
  fs.writeFileSync(path.join(DIST_DIR, '.nojekyll'), '');
  console.log('   ✅ Added .nojekyll configuration');

  console.log('✨ NutEgg website built successfully in website/dist/');
}

build();

