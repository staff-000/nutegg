#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# NutEgg Deploy Script
#
# Supports:
#   1. Local mode (default): Builds local plugin and deploys to vault.
#   2. Remote mode (--remote): Downloads release from remote GitHub
#      release repository, performs sanity checks, and deploys to vault.
#
# Usage:
#   ./deploy.sh                          # local build & deploy
#   ./deploy.sh --remote                 # deploy latest remote release
#   ./deploy.sh --remote v0.0.1          # deploy specific remote version
#   ./deploy.sh --vault "/path/to/vault" # specify custom vault
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$SCRIPT_DIR/obsidian-plugin"
EXTENSION_DIR="$SCRIPT_DIR/chrome-extension"
REPO_OWNER="staff-000"
REPO_OBSIDIAN="nutegg-obsidian-release"
REPO_CHROME="nutegg-chrome-extension-release"

REMOTE_MODE=false
REMOTE_VERSION=""
VAULT=""

# --- Parse arguments ---
while [[ $# -gt 0 ]]; do
  case "$1" in
    --remote)
      REMOTE_MODE=true
      if [[ -n "${2:-}" && ! "$2" =~ ^-- ]]; then
        REMOTE_VERSION="$2"
        shift 2
      else
        shift 1
      fi
      ;;
    --vault)
      if [[ -n "${2:-}" ]]; then
        VAULT="$2"
        shift 2
      else
        echo "❌ Error: --vault requires a path"
        exit 1
      fi
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# --- Resolve vault path ---
# Priority: --vault flag > NUTEGG_VAULT env var > auto-detect from Obsidian config
if [[ -z "$VAULT" ]]; then
  if [[ -n "${NUTEGG_VAULT:-}" ]]; then
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
fi

PLUGIN_OUT="$VAULT/.obsidian/plugins/nutegg"

echo "🥚 NutEgg Deploy"
echo "   Vault:     $VAULT"
echo "   Plugin:    $PLUGIN_OUT"
echo "   Deploy:    $(if [[ "$REMOTE_MODE" == true ]]; then echo "Remote GitHub Release (Sanity Check)"; else echo "Local Build"; fi)"
echo ""

if [[ "$REMOTE_MODE" == true ]]; then
  # ==========================================================
  # Remote Mode: Download release from GitHub & Sanity Check
  # ==========================================================
  TMP_DIR=$(mktemp -d)
  trap 'rm -rf "$TMP_DIR"' EXIT

  # Resolve target tag
  if [[ -n "$REMOTE_VERSION" ]]; then
    CLEAN_VER="${REMOTE_VERSION#v}"
    TAG="v$CLEAN_VER"
  else
    echo "🔎 Discovering latest release from $REPO_OWNER/$REPO_OBSIDIAN..."
    TAG=$(gh release view --repo "$REPO_OWNER/$REPO_OBSIDIAN" --json tagName -q .tagName 2>/dev/null || echo "v0.0.0")
  fi

  echo "⬇️  Fetching Obsidian release '$TAG' from $REPO_OWNER/$REPO_OBSIDIAN..."
  mkdir -p "$TMP_DIR/obsidian"
  gh release download "$TAG" --repo "$REPO_OWNER/$REPO_OBSIDIAN" --dir "$TMP_DIR/obsidian"

  echo ""
  echo "🔬 Sanity checking remote release artifacts..."

  # Sanity Check 1: main.js
  if [[ ! -f "$TMP_DIR/obsidian/main.js" ]]; then
    echo "❌ Sanity Check Failed: main.js is missing from remote release!"
    exit 1
  fi
  MAIN_SIZE=$(wc -c < "$TMP_DIR/obsidian/main.js" | tr -d ' ')
  if [[ "$MAIN_SIZE" -lt 1000 ]]; then
    echo "❌ Sanity Check Failed: main.js is suspiciously small ($MAIN_SIZE bytes)!"
    exit 1
  fi
  echo "   ✅ main.js verified ($(du -h "$TMP_DIR/obsidian/main.js" | cut -f1))"

  # Sanity Check 2: manifest.json
  if [[ ! -f "$TMP_DIR/obsidian/manifest.json" ]]; then
    echo "❌ Sanity Check Failed: manifest.json is missing from remote release!"
    exit 1
  fi
  MANIFEST_VER=$(node -e "try { console.log(JSON.parse(require('fs').readFileSync('$TMP_DIR/obsidian/manifest.json')).version); } catch { process.exit(1); }" 2>/dev/null || echo "")
  if [[ -z "$MANIFEST_VER" ]]; then
    echo "❌ Sanity Check Failed: manifest.json is invalid JSON!"
    exit 1
  fi
  echo "   ✅ manifest.json verified (version: $MANIFEST_VER)"

  # Sanity Check 3: styles.css
  if [[ ! -f "$TMP_DIR/obsidian/styles.css" ]]; then
    echo "❌ Sanity Check Failed: styles.css is missing from remote release!"
    exit 1
  fi
  echo "   ✅ styles.css verified ($(wc -c < "$TMP_DIR/obsidian/styles.css" | tr -d ' ') bytes)"

  # Sanity Check 4: Chrome Extension release bundle
  echo ""
  echo "⬇️  Sanity checking Chrome Extension release '$TAG' from $REPO_OWNER/$REPO_CHROME..."
  mkdir -p "$TMP_DIR/chrome"
  if gh release download "$TAG" --repo "$REPO_OWNER/$REPO_CHROME" --dir "$TMP_DIR/chrome" >/dev/null 2>&1; then
    ZIP_FILE=$(find "$TMP_DIR/chrome" -name "*.zip" 2>/dev/null | head -n 1 || true)
    if [[ -n "$ZIP_FILE" && -f "$ZIP_FILE" ]]; then
      if unzip -l "$ZIP_FILE" 2>/dev/null | grep -F "manifest.json" >/dev/null 2>&1; then
        echo "   ✅ Chrome extension zip verified ($(du -h "$ZIP_FILE" | cut -f1), manifest.json included)"
      else
        echo "   ⚠️  Warning: manifest.json not found inside $ZIP_FILE"
      fi
    fi
  else
    echo "   ℹ️  Note: Chrome extension release $TAG download skipped or not found"
  fi

  # Deploy checked-out files to vault
  echo ""
  echo "📋 Deploying verified remote release to Obsidian vault..."
  mkdir -p "$PLUGIN_OUT"
  cp "$TMP_DIR/obsidian/main.js" "$PLUGIN_OUT/"
  cp "$TMP_DIR/obsidian/manifest.json" "$PLUGIN_OUT/"
  cp "$TMP_DIR/obsidian/styles.css" "$PLUGIN_OUT/"

else
  # ==========================================================
  # Local Mode: Build locally and copy
  # ==========================================================
  echo "📦 Building Obsidian plugin locally..."
  (cd "$PLUGIN_DIR" && npm run build --silent 2>&1 | sed 's/^/   /')
  echo "   ✅ Build complete ($(du -h "$PLUGIN_DIR/main.js" | cut -f1))"
  echo ""

  echo "📋 Copying plugin files to Obsidian vault..."
  mkdir -p "$PLUGIN_OUT"
  cp "$PLUGIN_DIR/main.js" "$PLUGIN_OUT/"
  cp "$PLUGIN_DIR/manifest.json" "$PLUGIN_OUT/"
  cp "$PLUGIN_DIR/styles.css" "$PLUGIN_OUT/"
fi

echo "   ✅ main.js → $PLUGIN_OUT/main.js"
echo "   ✅ manifest.json → $PLUGIN_OUT/manifest.json"
echo "   ✅ styles.css → $PLUGIN_OUT/styles.css"
echo ""

# --- Hot reload support ---
HOT_RELOAD_DIR="$VAULT/.obsidian/plugins/hot-reload"
if [[ -d "$HOT_RELOAD_DIR" ]]; then
  touch "$PLUGIN_OUT/.hot-reload"
  echo "🔥 Hot reload triggered"
  echo ""
fi

# --- Chrome extension reminder ---
echo "🌐 Chrome Extension"
echo "   Source directory: $EXTENSION_DIR"
echo "   To reload in browser:"
echo "   1. Open chrome://extensions"
echo "   2. Find NutEgg → click 🔄 reload"
echo ""

# --- Done ---
echo "✅ Deploy complete!"
