#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# NutEgg Quick Release Script
#
# Usage:
#   ./release.sh <version> [--deploy] [--vault <path>]
#
# Examples:
#   ./release.sh v0.0.1
#   ./release.sh v0.0.1 --deploy
#   ./release.sh 0.0.1 --deploy --vault "/path/to/vault"
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_OWNER="staff-000"
REPO_MAIN="nutegg"
REPO_OBSIDIAN="nutegg-obsidian-release"
REPO_CHROME="nutegg-chrome-extension-release"

# --- Parse arguments ---
if [[ $# -lt 1 ]]; then
  echo "❌ Error: Version argument missing."
  echo ""
  echo "Usage:"
  echo "  ./release.sh <version> [--deploy] [--vault <path>]"
  echo ""
  echo "Example:"
  echo "  ./release.sh v0.0.1 --deploy"
  exit 1
fi

INPUT_VERSION="$1"
shift

# Normalize version: v0.0.1 -> 0.0.1, 0.0.1 -> 0.0.1
CLEAN_VERSION="${INPUT_VERSION#v}"
TAG="v${CLEAN_VERSION}"

DO_DEPLOY=false
VAULT_ARG=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --deploy)
      DO_DEPLOY=true
      shift
      ;;
    --vault)
      if [[ -n "${2:-}" ]]; then
        VAULT_ARG="$2"
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

echo "🥚 NutEgg Release Pipeline"
echo "   Target Version: $TAG ($CLEAN_VERSION)"
echo "   GitHub User:    $REPO_OWNER"
echo ""

# --- 1. Verify GitHub authentication ---
echo "🔑 Verifying GitHub CLI authentication..."
CURRENT_GH_USER=$(gh api user -q .login 2>/dev/null || echo "")
if [[ "$CURRENT_GH_USER" != "$REPO_OWNER" ]]; then
  echo "❌ Error: Not authenticated as '$REPO_OWNER' (currently: '$CURRENT_GH_USER')."
  echo "   Please run: gh auth login"
  exit 1
fi
echo "   ✅ Authenticated as $REPO_OWNER"
echo ""

# --- 2. Pre-flight tests ---
echo "🧪 Running pre-flight tests across workspaces..."
(cd "$SCRIPT_DIR" && npm test)
echo "   ✅ All tests passed"
echo ""

# --- 3. Update version numbers in manifests and packages ---
echo "📝 Updating version to $CLEAN_VERSION in project files..."

# obsidian-plugin/package.json
node -e "
  const p = require('./obsidian-plugin/package.json');
  p.version = '$CLEAN_VERSION';
  require('fs').writeFileSync('./obsidian-plugin/package.json', JSON.stringify(p, null, 2) + '\n');
"

# obsidian-plugin/manifest.json
node -e "
  const m = require('./obsidian-plugin/manifest.json');
  m.version = '$CLEAN_VERSION';
  require('fs').writeFileSync('./obsidian-plugin/manifest.json', JSON.stringify(m, null, 2) + '\n');
"

# chrome-extension/package.json
node -e "
  const p = require('./chrome-extension/package.json');
  p.version = '$CLEAN_VERSION';
  require('fs').writeFileSync('./chrome-extension/package.json', JSON.stringify(p, null, 2) + '\n');
"

# chrome-extension/manifest.json
node -e "
  const m = require('./chrome-extension/manifest.json');
  m.version = '$CLEAN_VERSION';
  require('fs').writeFileSync('./chrome-extension/manifest.json', JSON.stringify(m, null, 2) + '\n');
"
echo "   ✅ Version numbers updated"
echo ""

# --- 4. Commit and push changes if any ---
if git status --porcelain | grep -E "(package|manifest)\.json" >/dev/null; then
  echo "💾 Committing version bump..."
  git add obsidian-plugin/package.json obsidian-plugin/manifest.json chrome-extension/package.json chrome-extension/manifest.json
  git commit -m "chore: release $TAG" --author="$REPO_OWNER <staffhacker.000@gmail.com>"
  git push origin main
  echo "   ✅ Pushed version commit to main"
  echo ""
fi

# --- 5. Create and push tags ---
echo "🏷️  Tagging and pushing release triggers..."
git tag -fa "$TAG" -m "Release $TAG"
git tag -fa "obsidian-$TAG" -m "Release obsidian-$TAG"
git tag -fa "chrome-extension-$TAG" -m "Release chrome-extension-$TAG"
git push origin "$TAG" "obsidian-$TAG" "chrome-extension-$TAG" --force
echo "   ✅ Tags pushed to GitHub ($TAG, obsidian-$TAG, chrome-extension-$TAG)"
echo ""

# --- 6. Create release on main repo ---
echo "🚀 Creating release on $REPO_OWNER/$REPO_MAIN..."
if gh release view "$TAG" --repo "$REPO_OWNER/$REPO_MAIN" >/dev/null 2>&1; then
  echo "   Release $TAG already exists on main repo, updating..."
else
  gh release create "$TAG" --repo "$REPO_OWNER/$REPO_MAIN" --title "$TAG" --notes "NutEgg Release $TAG"
fi
echo "   ✅ Main repo release ready: https://github.com/$REPO_OWNER/$REPO_MAIN/releases/tag/$TAG"
echo ""

# --- 7. Monitor GitHub Action release workflows ---
echo "⏳ Waiting for GitHub Actions release workflows to trigger..."
sleep 4

OBSIDIAN_RUN_ID=$(gh run list --repo "$REPO_OWNER/$REPO_MAIN" --workflow="release-obsidian.yml" --limit 1 --json databaseId -q '.[0].databaseId')
CHROME_RUN_ID=$(gh run list --repo "$REPO_OWNER/$REPO_MAIN" --workflow="release-chrome-extension.yml" --limit 1 --json databaseId -q '.[0].databaseId')

echo "   • Obsidian release run:        $OBSIDIAN_RUN_ID"
echo "   • Chrome extension release run: $CHROME_RUN_ID"
echo ""

if [[ -n "$OBSIDIAN_RUN_ID" ]]; then
  echo "📦 Watching Obsidian release build..."
  gh run watch "$OBSIDIAN_RUN_ID" --repo "$REPO_OWNER/$REPO_MAIN" || true
fi

if [[ -n "$CHROME_RUN_ID" ]]; then
  echo "📦 Watching Chrome extension release build..."
  gh run watch "$CHROME_RUN_ID" --repo "$REPO_OWNER/$REPO_MAIN" || true
fi

echo ""
echo "🎉 Releases published successfully!"
echo "   • Obsidian Release:         https://github.com/$REPO_OWNER/$REPO_OBSIDIAN/releases/tag/$TAG"
echo "   • Chrome Extension Release: https://github.com/$REPO_OWNER/$REPO_CHROME/releases/tag/$TAG"
echo ""

# --- 8. Sanity check / deploy from remote repo ---
if [[ "$DO_DEPLOY" == true ]]; then
  echo "🔍 Performing remote deployment sanity check..."
  if [[ -n "$VAULT_ARG" ]]; then
    ./deploy.sh --remote "$TAG" --vault "$VAULT_ARG"
  else
    ./deploy.sh --remote "$TAG"
  fi
else
  echo "💡 Tip: To verify and deploy this release from the remote repo directly to your Obsidian vault, run:"
  echo "   ./deploy.sh --remote $TAG"
fi
