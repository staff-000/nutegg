#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# NutEgg Quick Release Script
#
# Usage:
#   ./release.sh <version> [--deploy] [--vault <path>] [--dry-run] [--allow-dirty]
#   ./release.sh --check
#
# Release Branch Strategy:
#   - Minor releases (e.g. 0.4.0): Cut onto a new minor branch 'release/X.Y' (e.g. release/0.4) from main.
#   - Patch releases (e.g. 0.4.1): Updated and released directly on that 'release/X.Y' branch.
#
# Examples:
#   ./release.sh --check
#   ./release.sh 0.4.0 --dry-run
#   ./release.sh 0.4.0
#   ./release.sh 0.4.1
#   ./release.sh 0.4.0 --deploy
#   ./release.sh 0.4.0 --deploy --vault "/path/to/vault"
#   npm run update:version -- --chrome-store 0.3.0
#   npm run update:version -- --obsidian-community 0.3.1
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_OWNER="staff-000"
REPO_MAIN="nutegg"
REPO_OBSIDIAN="nutegg-obsidian-release"
REPO_CHROME="nutegg-chrome-extension-release"

DO_DEPLOY=false
IS_DRY_RUN=false
ALLOW_DIRTY=false
VAULT_ARG=""
INPUT_VERSION=""

# --- Parse arguments ---
while [[ $# -gt 0 ]]; do
  case "$1" in
    --check|--dry-run)
      IS_DRY_RUN=true
      shift
      ;;
    --allow-dirty)
      ALLOW_DIRTY=true
      shift
      ;;
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
    -*)
      echo "❌ Error: Unknown option: $1"
      exit 1
      ;;
    *)
      if [[ -z "$INPUT_VERSION" ]]; then
        INPUT_VERSION="$1"
        shift
      else
        echo "❌ Error: Unexpected extra argument: $1"
        exit 1
      fi
      ;;
  esac
done

if [[ -z "$INPUT_VERSION" && "$IS_DRY_RUN" == false ]]; then
  echo "❌ Error: Version argument missing."
  echo ""
  echo "Usage:"
  echo "  ./release.sh <version> [--deploy] [--vault <path>] [--dry-run] [--allow-dirty]"
  echo "  ./release.sh --check"
  echo ""
  echo "Examples:"
  echo "  ./release.sh --check"
  echo "  ./release.sh 0.2.4 --dry-run"
  echo "  ./release.sh 0.2.4 --deploy"
  exit 1
fi

CLEAN_VERSION="${INPUT_VERSION#v}"
TAG="${CLEAN_VERSION}"
RELEASE_BRANCH=""

if [[ -n "$INPUT_VERSION" ]]; then
  if [[ ! "$CLEAN_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$ ]]; then
    echo "❌ ERROR: Invalid version format '$INPUT_VERSION'."
    echo "   Expected semantic version (e.g. 0.4.0 or v0.4.0)."
    exit 1
  fi
  MAJOR=$(echo "$CLEAN_VERSION" | cut -d. -f1)
  MINOR=$(echo "$CLEAN_VERSION" | cut -d. -f2)
  RELEASE_BRANCH="release/${MAJOR}.${MINOR}"
fi

echo "🥚 NutEgg Release Pipeline"
if [[ -n "$INPUT_VERSION" ]]; then
  echo "   Target Version: $TAG ($CLEAN_VERSION)"
  echo "   Release Branch: $RELEASE_BRANCH"
fi
echo "   GitHub User:    $REPO_OWNER"
if [[ "$IS_DRY_RUN" == true ]]; then
  echo "   Mode:           Dry run / Pre-flight check only"
fi
echo ""

# --- 1. Working Tree Cleanliness Check ---
echo "🔍 [1/6] Checking git working tree status..."
DIRTY_CHANGES=$(git -C "$SCRIPT_DIR" status --porcelain)
if [[ -n "$DIRTY_CHANGES" && "$ALLOW_DIRTY" != true ]]; then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "❌ ERROR: Working tree is not clean! You have uncommitted changes:"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  git -C "$SCRIPT_DIR" status -s
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "💡 Releases must be cut from a clean working tree so uncommitted"
  echo "   code is not omitted from release commits or tags."
  echo "   Please commit, stash, or revert these changes before releasing."
  echo "   (Or pass --allow-dirty to bypass this check if intentional)."
  exit 1
fi
echo "   ✅ Working tree is clean"
echo ""

# --- 2. Git Branch Verification & Setup ---
echo "🌿 [2/6] Verifying git branch..."
CURRENT_BRANCH=$(git -C "$SCRIPT_DIR" rev-parse --abbrev-ref HEAD)

if [[ -n "$RELEASE_BRANCH" ]]; then
  if [[ "$CURRENT_BRANCH" == "$RELEASE_BRANCH" ]]; then
    echo "   ✅ Currently on target release branch: $RELEASE_BRANCH"
  elif [[ "$CURRENT_BRANCH" == "main" ]]; then
    BRANCH_EXISTS_LOCAL=$(git -C "$SCRIPT_DIR" show-ref --verify --quiet "refs/heads/$RELEASE_BRANCH" && echo "yes" || echo "no")
    BRANCH_EXISTS_REMOTE=$(git -C "$SCRIPT_DIR" show-ref --verify --quiet "refs/remotes/origin/$RELEASE_BRANCH" && echo "yes" || echo "no")

    if [[ "$IS_DRY_RUN" == true ]]; then
      if [[ "$BRANCH_EXISTS_LOCAL" == "yes" || "$BRANCH_EXISTS_REMOTE" == "yes" ]]; then
        echo "   ℹ️  [Dry-run] Would switch from 'main' to existing branch '$RELEASE_BRANCH'"
      else
        echo "   ℹ️  [Dry-run] Would create new minor release branch '$RELEASE_BRANCH' from 'main'"
      fi
    else
      if [[ "$BRANCH_EXISTS_LOCAL" == "yes" ]]; then
        echo "   🔄 Switching to existing release branch '$RELEASE_BRANCH'..."
        git -C "$SCRIPT_DIR" checkout "$RELEASE_BRANCH"
      elif [[ "$BRANCH_EXISTS_REMOTE" == "yes" ]]; then
        echo "   🔄 Checking out remote release branch '$RELEASE_BRANCH'..."
        git -C "$SCRIPT_DIR" checkout -b "$RELEASE_BRANCH" "origin/$RELEASE_BRANCH"
      else
        echo "   🌱 Creating new minor release branch '$RELEASE_BRANCH' from 'main'..."
        git -C "$SCRIPT_DIR" checkout -b "$RELEASE_BRANCH"
      fi
      CURRENT_BRANCH="$RELEASE_BRANCH"
      echo "   ✅ Active branch is now: $CURRENT_BRANCH"
    fi
  else
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "❌ ERROR: Releases must be cut from 'main' or '$RELEASE_BRANCH' (currently on '$CURRENT_BRANCH')."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "   To release $CLEAN_VERSION, please switch to 'main' or '$RELEASE_BRANCH':"
    echo "     git checkout main"
    echo "   or:"
    echo "     git checkout $RELEASE_BRANCH"
    exit 1
  fi
else
  echo "   ℹ️  Running in check mode without target version (on branch '$CURRENT_BRANCH')"
fi
echo ""

# --- 3. Tag Collision Validation ---
if [[ -n "$INPUT_VERSION" ]]; then
  echo "🏷️  [3/6] Validating target version tag..."
  if git -C "$SCRIPT_DIR" rev-parse "$TAG" >/dev/null 2>&1; then
    echo "   ⚠️  Note: Local git tag '$TAG' already exists. Re-tagging will overwrite."
  else
    echo "   ✅ Tag '$TAG' is available"
  fi
  echo ""
else
  echo "🏷️  [3/6] Skipping tag validation (--check mode without version)..."
  echo ""
fi

# --- 4. Verify GitHub CLI authentication ---
echo "🔑 [4/6] Verifying GitHub CLI authentication..."
CURRENT_GH_USER=$(gh api user -q .login 2>/dev/null || echo "")
if [[ -z "$CURRENT_GH_USER" ]]; then
  if [[ "$IS_DRY_RUN" == true ]]; then
    echo "   ⚠️  Note: GitHub CLI ('gh') not authenticated or offline (allowed in dry-run mode)"
  else
    echo "❌ ERROR: GitHub CLI ('gh') is not authenticated or not installed."
    echo "   Please run: gh auth login"
    exit 1
  fi
elif [[ "$CURRENT_GH_USER" != "$REPO_OWNER" ]]; then
  if [[ "$IS_DRY_RUN" == true ]]; then
    echo "   ⚠️  Note: Authenticated as '$CURRENT_GH_USER' instead of '$REPO_OWNER' (allowed in dry-run mode)"
  else
    echo "❌ ERROR: Not authenticated as '$REPO_OWNER' (currently: '$CURRENT_GH_USER')."
    echo "   Please run: gh auth login"
    exit 1
  fi
else
  echo "   ✅ Authenticated as $REPO_OWNER"
fi
echo ""

# --- 5. Fail-Fast Build & Test Suites ---
echo "🧪 [5/6] Running fail-fast test suites..."

echo "   • Testing Chrome Extension (pretest builds shared core)..."
if ! (cd "$SCRIPT_DIR/chrome-extension" && npm test); then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "❌ TEST FAILURE: Chrome Extension (@nutegg/chrome-extension)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "To debug:"
  echo "  cd chrome-extension && npm test"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 1
fi
echo "   ✅ Chrome Extension tests passed"

echo "   • Testing Obsidian Plugin..."
if ! (cd "$SCRIPT_DIR/obsidian-plugin" && npm test); then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "❌ TEST FAILURE: Obsidian Plugin (@nutegg/obsidian-plugin)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "To debug:"
  echo "  cd obsidian-plugin && npm test"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 1
fi
echo "   ✅ Obsidian Plugin tests passed"
echo ""

# --- 6. Verify Workspace Distribution Builds ---
echo "🏗️  [6/6] Verifying workspace builds..."
if ! (cd "$SCRIPT_DIR" && npm run build); then
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "❌ BUILD FAILURE across workspaces"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "To debug:"
  echo "  npm run build"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 1
fi
echo "   ✅ All workspace builds passed"
echo ""

# --- If dry-run / check, exit successfully here ---
if [[ "$IS_DRY_RUN" == true ]]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🎉 Pre-flight checks passed successfully! Ready for release."
  echo "   (Dry-run mode: no version bumped, no tags pushed)."
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 0
fi

# --- 7. Update version numbers in manifests and packages ---
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

# website/src/versions.json
if [[ -f "$SCRIPT_DIR/scripts/update-download-version.js" ]]; then
  node "$SCRIPT_DIR/scripts/update-download-version.js" "$CLEAN_VERSION" --no-build
fi
echo "   ✅ Version numbers updated"
echo ""

# --- 8. Commit and push changes to GitHub ---
if git -C "$SCRIPT_DIR" status --porcelain | grep -E "(package|manifest|versions)\.json" >/dev/null; then
  echo "💾 Committing version bump..."
  git -C "$SCRIPT_DIR" add obsidian-plugin/package.json obsidian-plugin/manifest.json chrome-extension/package.json chrome-extension/manifest.json website/src/versions.json
  git -C "$SCRIPT_DIR" commit -m "chore: release $TAG" --author="$REPO_OWNER <staffhacker.000@gmail.com>"
fi

echo "🚀 Syncing release branch '$RELEASE_BRANCH' to GitHub..."
git -C "$SCRIPT_DIR" push -u origin "$RELEASE_BRANCH"
echo "   ✅ Pushed branch '$RELEASE_BRANCH' to origin"
echo ""

# --- 9. Create and push tags ---
echo "🏷️  Tagging and pushing release triggers..."
git -C "$SCRIPT_DIR" tag -fa "$TAG" -m "Release $TAG"
git -C "$SCRIPT_DIR" tag -fa "nutegg-obsidian-plugin-$TAG" -m "Release nutegg-obsidian-plugin-$TAG"
git -C "$SCRIPT_DIR" tag -fa "nutegg-chrome-extension-$TAG" -m "Release nutegg-chrome-extension-$TAG"
git -C "$SCRIPT_DIR" push origin "$TAG" "nutegg-obsidian-plugin-$TAG" "nutegg-chrome-extension-$TAG" --force
echo "   ✅ Tags pushed to GitHub ($TAG, nutegg-obsidian-plugin-$TAG, nutegg-chrome-extension-$TAG)"
echo ""

# --- 10. Create release on main repo ---
echo "🚀 Creating release on $REPO_OWNER/$REPO_MAIN..."
if gh release view "$TAG" --repo "$REPO_OWNER/$REPO_MAIN" >/dev/null 2>&1; then
  echo "   Release $TAG already exists on main repo, updating..."
else
  gh release create "$TAG" --repo "$REPO_OWNER/$REPO_MAIN" --title "$TAG" --notes "NutEgg Release $TAG" --target "$RELEASE_BRANCH"
fi
echo "   ✅ Main repo release ready: https://github.com/$REPO_OWNER/$REPO_MAIN/releases/tag/$TAG"
echo ""

# --- 11. Monitor GitHub Action release workflows ---
echo "⏳ Waiting for GitHub Actions release workflows to trigger..."
sleep 4

OBSIDIAN_RUN_ID=$(gh run list --repo "$REPO_OWNER/$REPO_MAIN" --workflow="release-obsidian.yml" --limit 1 --json databaseId -q '.[0].databaseId')
CHROME_RUN_ID=$(gh run list --repo "$REPO_OWNER/$REPO_MAIN" --workflow="release-chrome-extension.yml" --limit 1 --json databaseId -q '.[0].databaseId')

echo "   • Obsidian release run:         $OBSIDIAN_RUN_ID"
echo "   • Chrome extension release run: $CHROME_RUN_ID"
echo ""

OBS_CONCLUSION="success"
CHROME_CONCLUSION="success"

if [[ -n "$OBSIDIAN_RUN_ID" ]]; then
  echo "📦 Watching Obsidian release build ($OBSIDIAN_RUN_ID)..."
  gh run watch "$OBSIDIAN_RUN_ID" --repo "$REPO_OWNER/$REPO_MAIN" || true
  OBS_CONCLUSION=$(gh run view "$OBSIDIAN_RUN_ID" --repo "$REPO_OWNER/$REPO_MAIN" --json conclusion -q .conclusion 2>/dev/null || echo "unknown")
  if [[ "$OBS_CONCLUSION" != "success" ]]; then
    echo "❌ Error: Obsidian release build finished with status '$OBS_CONCLUSION'."
    echo "   Logs: https://github.com/$REPO_OWNER/$REPO_MAIN/actions/runs/$OBSIDIAN_RUN_ID"
  else
    echo "   ✅ Obsidian release build succeeded"
  fi
fi

if [[ -n "$CHROME_RUN_ID" ]]; then
  echo "📦 Watching Chrome extension release build ($CHROME_RUN_ID)..."
  gh run watch "$CHROME_RUN_ID" --repo "$REPO_OWNER/$REPO_MAIN" || true
  CHROME_CONCLUSION=$(gh run view "$CHROME_RUN_ID" --repo "$REPO_OWNER/$REPO_MAIN" --json conclusion -q .conclusion 2>/dev/null || echo "unknown")
  if [[ "$CHROME_CONCLUSION" != "success" ]]; then
    echo "❌ Error: Chrome extension release build finished with status '$CHROME_CONCLUSION'."
    echo "   Logs: https://github.com/$REPO_OWNER/$REPO_MAIN/actions/runs/$CHROME_RUN_ID"
  else
    echo "   ✅ Chrome extension release build succeeded"
  fi
fi

if [[ "$OBS_CONCLUSION" != "success" || "$CHROME_CONCLUSION" != "success" ]]; then
  echo ""
  echo "❌ Release workflow(s) did not complete successfully. Check the run logs above."
  exit 1
fi

echo ""
echo "🎉 Releases published successfully!"
echo "   • Obsidian Release:         https://github.com/$REPO_OWNER/$REPO_OBSIDIAN/releases/tag/$TAG"
echo "   • Chrome Extension Release: https://github.com/$REPO_OWNER/$REPO_CHROME/releases/tag/$TAG"
echo ""

# --- 12. Sanity check / deploy from remote repo ---
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
