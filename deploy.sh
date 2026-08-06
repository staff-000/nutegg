#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# NutEgg Deploy Script
# Builds the Obsidian plugin and copies it to your vault.
# Also prints instructions for reloading the Chrome extension.
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$SCRIPT_DIR/obsidian-plugin"
EXTENSION_DIR="$SCRIPT_DIR/chrome-extension"

# --- Resolve vault path ---
# Priority: --vault flag > NUTEGG_VAULT env var > auto-detect from Obsidian config

if [[ "${1:-}" == "--vault" && -n "${2:-}" ]]; then
  VAULT="$2"
elif [[ -n "${NUTEGG_VAULT:-}" ]]; then
  VAULT="$NUTEGG_VAULT"
else
  # Auto-detect from Obsidian's config
  OBSIDIAN_CONFIG="$HOME/Library/Application Support/obsidian/obsidian.json"
  if [[ -f "$OBSIDIAN_CONFIG" ]]; then
    VAULT=$(node -e "
      try {
        const c = require('$OBSIDIAN_CONFIG');
        const vaults = c.vaults ? Object.values(c.vaults) : [];
        if (vaults.length === 0) process.exit(1);
        // Prefer the most recently opened vault
        const openVaults = vaults.filter(v => v.open).sort((a, b) => (b.ts || 0) - (a.ts || 0));
        const vault = openVaults[0] || vaults[0];
        console.log(vault.path);
      } catch { process.exit(1); }
    " 2>/dev/null) || true
  fi
  if [[ -z "${VAULT:-}" ]]; then
    echo "❌ Could not auto-detect Obsidian vault."
    echo ""
    echo "   Set it with one of:"
    echo "     ./deploy.sh --vault \"/path/to/your/vault\""
    echo "     export NUTEGG_VAULT=\"/path/to/your/vault\""
    exit 1
  fi
fi

PLUGIN_OUT="$VAULT/.obsidian/plugins/nutegg"

echo "🥚 NutEgg Deploy"
echo "   Vault:  $VAULT"
echo "   Plugin: $PLUGIN_OUT"
echo ""

# --- Build plugin ---
echo "📦 Building Obsidian plugin..."
cd "$PLUGIN_DIR"
npm run build --silent 2>&1 | sed 's/^/   /'
echo "   ✅ Build complete ($(du -h main.js | cut -f1))"
echo ""

# --- Deploy plugin files ---
echo "📋 Copying plugin files..."
mkdir -p "$PLUGIN_OUT"
cp main.js "$PLUGIN_OUT/"
cp manifest.json "$PLUGIN_OUT/"
cp styles.css "$PLUGIN_OUT/"
echo "   ✅ main.js → $PLUGIN_OUT/main.js"
echo "   ✅ manifest.json → $PLUGIN_OUT/manifest.json"
echo "   ✅ styles.css → $PLUGIN_OUT/styles.css"
echo ""

# --- Hot reload support ---
# If the "Hot Reload" plugin is installed, touch a file to trigger reload
HOT_RELOAD_DIR="$VAULT/.obsidian/plugins/hot-reload"
if [[ -d "$HOT_RELOAD_DIR" ]]; then
  touch "$PLUGIN_OUT/.hot-reload"
  echo "🔥 Hot reload triggered"
  echo ""
fi

# --- Chrome extension ---
echo "🌐 Chrome Extension"
echo "   Already loaded unpacked from:"
echo "   $EXTENSION_DIR"
echo ""
echo "   To reload:"
echo "   1. Open chrome://extensions"
echo "   2. Find NutEgg → click 🔄 reload"
echo ""

# --- Done ---
echo "✅ Deploy complete!"
echo ""
echo "   Tips:"
echo "   • Run 'npm run dev' in obsidian-plugin/ for watch mode"
echo "   • Use './deploy.sh --vault <path>' if you have multiple vaults"
echo "   • Set NUTEGG_VAULT env var to skip the flag each time"
echo "   • Install 'Hot Reload' Obsidian plugin for automatic reloads"
