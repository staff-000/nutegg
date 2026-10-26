#!/usr/bin/env bash
set -euo pipefail

# Explicit releases only. Each release/X.Y branch maintains all X.Y.Z patches.
# Usage: ./release.sh VERSION [--dry-run] [--resume] [--deploy] [--vault PATH]
#        ./release.sh --check [--allow-dirty]
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
REPO_OWNER="staff-000"
REPO_MAIN="$REPO_OWNER/nutegg"
VERSION=""; DRY_RUN=false; RESUME=false; DEPLOY=false; ALLOW_DIRTY=false; VAULT=""
fail() { echo "❌ $*" >&2; exit 1; }
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run|--check) DRY_RUN=true; shift ;;
    --resume) RESUME=true; shift ;;
    --deploy) DEPLOY=true; shift ;;
    --allow-dirty) ALLOW_DIRTY=true; shift ;;
    --vault) [[ -n "${2:-}" ]] || fail '--vault requires a path'; VAULT="$2"; shift 2 ;;
    -*) fail "Unknown option: $1" ;;
    *) [[ -z "$VERSION" ]] || fail "Unexpected argument: $1"; VERSION="${1#v}"; shift ;;
  esac
done
[[ -n "$VERSION" || "$DRY_RUN" == true ]] || fail 'Usage: ./release.sh VERSION [--dry-run] [--resume] [--deploy] [--vault PATH]'
[[ -z "$VERSION" || "$VERSION" =~ ^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$ ]] || fail 'Use a stable version such as 0.4.0 (optional leading v).'
[[ "$ALLOW_DIRTY" == false || "$DRY_RUN" == true ]] || fail '--allow-dirty is only supported for isolated dry runs.'
[[ "$RESUME" == false || -n "$VERSION" ]] || fail '--resume requires a version.'
[[ -z "$(git status --porcelain)" || "$ALLOW_DIRTY" == true ]] || fail 'Commit or stash changes before releasing.'

TOOLS="$SCRIPT_DIR/scripts/release-tools.mjs"
TEMP_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/nutegg-release.XXXXXX")"
cleanup() {
  if [[ -d "$TEMP_ROOT/work/.git" || -f "$TEMP_ROOT/work/.git" ]]; then
    git -C "$SCRIPT_DIR" worktree remove --force "$TEMP_ROOT/work" >/dev/null 2>&1 || true
  fi
  rm -rf "$TEMP_ROOT"
}
trap cleanup EXIT

echo "🥚 NutEgg release ${VERSION:-preflight}"
SOURCE=HEAD
BRANCH=""
if [[ -n "$VERSION" ]]; then
  BRANCH="release/${VERSION%.*}"
  PATCH="${VERSION##*.}"
  CURRENT="$(git symbolic-ref --quiet --short HEAD || true)"
  [[ "$CURRENT" == main || "$CURRENT" == "$BRANCH" ]] || fail "Switch to main or $BRANCH first."
  # Refresh remote truth; never overwrite local published tags.
  git fetch --prune origin '+refs/heads/*:refs/remotes/origin/*'
  git fetch origin 'refs/tags/*:refs/tags/*'
  if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
    SOURCE="refs/heads/$BRANCH"
  elif git show-ref --verify --quiet "refs/remotes/origin/$BRANCH"; then
    SOURCE="refs/remotes/origin/$BRANCH"
  else
    [[ "$PATCH" == 0 && "$RESUME" == false ]] || fail "Missing maintenance branch $BRANCH. Create it with the initial $VERSION release from main."
    [[ "$CURRENT" == main ]] || fail 'Create a new maintenance branch from main.'
    [[ "$(git rev-parse HEAD)" == "$(git rev-parse refs/remotes/origin/main)" ]] || fail 'Push/synchronize main with origin/main before cutting a new release branch.'
    SOURCE=refs/remotes/origin/main
  fi
  if git show-ref --verify --quiet "refs/remotes/origin/$BRANCH"; then
    REMOTE="refs/remotes/origin/$BRANCH"
    if git merge-base --is-ancestor "$SOURCE" "$REMOTE"; then SOURCE="$REMOTE"
    elif ! git merge-base --is-ancestor "$REMOTE" "$SOURCE"; then fail "$BRANCH diverges from origin. Resolve it before releasing."
    fi
  fi
  TAGS=("$VERSION" "nutegg-obsidian-plugin-$VERSION" "nutegg-chrome-extension-$VERSION")
  RELEASE_SHA=""
  for tag in "${TAGS[@]}"; do
    if git show-ref --verify --quiet "refs/tags/$tag"; then
      [[ "$RESUME" == true ]] || fail "Tag $tag already exists; use --resume $VERSION or choose a new version."
      sha="$(git rev-parse "refs/tags/$tag^{commit}")"
      [[ -z "$RELEASE_SHA" || "$RELEASE_SHA" == "$sha" ]] || fail 'Release tags point to different commits.'
      RELEASE_SHA="$sha"
    elif [[ "$RESUME" == true ]]; then fail "Cannot resume: missing tag $tag."
    fi
  done
  if [[ "$RESUME" == true ]]; then
    git merge-base --is-ancestor "$RELEASE_SHA" "$SOURCE" || fail 'Release commit is not on its maintenance branch.'
    SOURCE="$RELEASE_SHA"
  fi
fi
SOURCE="$(git rev-parse "$SOURCE^{commit}")"

GH_USER="$(gh api user -q .login 2>/dev/null || true)"
if [[ "$GH_USER" != "$REPO_OWNER" ]]; then
  [[ "$DRY_RUN" == true ]] || fail "Authenticate gh as $REPO_OWNER before publishing."
  echo 'GitHub authentication unavailable; continuing isolated checks only.'
fi

# Check the selected source, not whichever checkout invoked a dry run.
# A normal release also validates in isolation before changing the user's branch.
git worktree add --detach "$TEMP_ROOT/work" "$SOURCE"
WORK="$TEMP_ROOT/work"
if [[ -n "$VERSION" && "$RESUME" == false ]]; then node "$TOOLS" bump "$WORK" "$VERSION"; fi
if [[ -n "$VERSION" ]]; then node "$TOOLS" verify "$WORK" "$VERSION"; fi
VERSION_FILES=(chrome-extension/package.json chrome-extension/manifest.json obsidian-plugin/package.json obsidian-plugin/manifest.json)
for file in package-lock.json chrome-extension/package-lock.json obsidian-plugin/package-lock.json; do
  if [[ -f "$WORK/$file" ]]; then VERSION_FILES+=("$file"); fi
done
if [[ -n "$VERSION" ]]; then
  # Own the release dependencies: updating a symlink would mutate the caller's install.
  (cd "$WORK" && npm ci --no-audit --no-fund)
  if [[ "$RESUME" == false ]]; then
    # Refresh once before testing/tagging; CI and resumes use this committed lockfile.
    (cd "$WORK" && npm update byokit --ignore-scripts --no-audit --no-fund)
  fi
else
  # Fast local preflight checks reuse installed dependencies without refreshing npm.
  for dir in '' chrome-extension obsidian-plugin shared website; do
    if [[ -d "$SCRIPT_DIR/${dir:+$dir/}node_modules" ]]; then
      ln -s "$SCRIPT_DIR/${dir:+$dir/}node_modules" "$WORK/${dir:+$dir/}node_modules"
    fi
  done
fi
git -C "$WORK" add -- "${VERSION_FILES[@]}"
# Chrome's DOM tests share jsdom from the Obsidian workspace. Linking sibling
# node_modules directories alone does not put them on Node's lookup path.
export NODE_PATH="$WORK/obsidian-plugin/node_modules${NODE_PATH:+:$NODE_PATH}"
(cd "$WORK/chrome-extension" && npm test)
(cd "$WORK/obsidian-plugin" && npm test)
(cd "$WORK" && npm run build)
# Builds must not silently alter the release inputs.
if [[ -n "$VERSION" ]]; then node "$TOOLS" verify "$WORK" "$VERSION"; fi
git -C "$WORK" diff --quiet || fail 'Tests/builds modified tracked source files; resolve those changes before releasing.'
if [[ "$DRY_RUN" == true ]]; then
  echo "✅ Dry run passed for ${BRANCH:-current commit}; no branch, tag, version commit or release published."
  exit 0
fi

if [[ "$RESUME" == false ]]; then
  [[ -z "$(git status --porcelain)" ]] || fail 'Working tree changed during validation; commit or stash before retrying.'
  # Recheck remote tags immediately before creating refs.
  for tag in "${TAGS[@]}"; do
    [[ -z "$(git ls-remote --tags origin "refs/tags/$tag")" ]] || fail "Remote tag $tag already exists."
  done
  if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
    git checkout "$BRANCH"
    git merge --ff-only "$SOURCE"
  else git checkout -b "$BRANCH" "$SOURCE"
  fi
  [[ "$(git rev-parse HEAD)" == "$SOURCE" ]] || fail 'Maintenance branch changed during validation; rerun the release checks.'
  for file in "${VERSION_FILES[@]}"; do cp "$WORK/$file" "$SCRIPT_DIR/$file"; done
  git add -- "${VERSION_FILES[@]}"
  git commit -m "chore: release $VERSION"
  RELEASE_SHA="$(git rev-parse HEAD)"
  for tag in "${TAGS[@]}"; do git tag -a "$tag" "$RELEASE_SHA" -m "Release $tag"; done
fi
# Publish the branch and trigger tags together, without rewriting released history.
REFS=()
for tag in "${TAGS[@]}"; do REFS+=("refs/tags/$tag:refs/tags/$tag"); done
# Resuming an older release must not rewind the maintenance branch.
if [[ "$RESUME" == false ]]; then REFS+=("refs/heads/$BRANCH:refs/heads/$BRANCH"); fi
if [[ "$RESUME" == true ]] && { ! git show-ref --verify --quiet "refs/remotes/origin/$BRANCH" ||
  ! git merge-base --is-ancestor "$RELEASE_SHA" "refs/remotes/origin/$BRANCH"; }; then
  REFS+=("$RELEASE_SHA:refs/heads/$BRANCH")
fi
git push --atomic origin "${REFS[@]}"
if [[ "$RESUME" == false ]]; then git branch --set-upstream-to="origin/$BRANCH" "$BRANCH"; fi
if ! gh release view "$VERSION" --repo "$REPO_MAIN" >/dev/null 2>&1; then
  gh release create "$VERSION" --repo "$REPO_MAIN" --verify-tag --target "$RELEASE_SHA" --title "$VERSION" --notes "NutEgg Release $VERSION"
fi

watch_release() {
  local workflow="$1" tag="$2" run="" attempt
  for ((attempt=0; attempt<30; attempt++)); do
    run="$(gh run list --repo "$REPO_MAIN" --workflow "$workflow" --event push --commit "$RELEASE_SHA" --limit 100 \
      --json databaseId,headSha,headBranch,event | node "$TOOLS" find-run "$SCRIPT_DIR" "$RELEASE_SHA" "$tag")"
    [[ -z "$run" ]] || break
    sleep 2
  done
  [[ -n "$run" ]] || fail "No $workflow run appeared for $tag at $RELEASE_SHA. Resume once GitHub schedules it."
  echo "Watching $workflow run $run for $tag ($RELEASE_SHA)"
  gh run watch "$run" --repo "$REPO_MAIN" --exit-status || fail "Release build $run failed. Inspect it, rerun it with gh run rerun $run --failed, then run ./release.sh $VERSION --resume."
}
watch_release release-obsidian.yml "nutegg-obsidian-plugin-$VERSION"
watch_release release-chrome-extension.yml "nutegg-chrome-extension-$VERSION"

# Update only download metadata on main after BOTH packages are published.
git worktree remove --force "$WORK"
for ((attempt=1; attempt<=3; attempt++)); do
  git fetch origin refs/heads/main:refs/remotes/origin/main
  if [[ ! -e "$WORK" ]]; then git worktree add --detach "$WORK" refs/remotes/origin/main
  else git -C "$WORK" reset --hard refs/remotes/origin/main
  fi
  node "$TOOLS" website "$WORK" "$VERSION"
  if git -C "$WORK" diff --quiet -- website/src/versions.json; then break; fi
  git -C "$WORK" add -- website/src/versions.json
  git -C "$WORK" commit -m "chore(release): update GitHub downloads to $VERSION"
  if git -C "$WORK" push origin HEAD:refs/heads/main; then break; fi
  [[ "$attempt" != 3 ]] || fail 'Packages published, but website update failed. Fix main-branch access/conflicts and run this release with --resume.'
done

echo "✅ Published $VERSION from $BRANCH ($RELEASE_SHA)."
echo "Bug fixes: commit on $BRANCH; cherry-pick applicable fixes into main with git cherry-pick -x COMMIT."
if [[ "$DEPLOY" == true ]]; then
  DEPLOY_ARGS=(--remote "$VERSION")
  if [[ -n "$VAULT" ]]; then DEPLOY_ARGS+=(--vault "$VAULT"); fi
  "$SCRIPT_DIR/deploy.sh" "${DEPLOY_ARGS[@]}"
fi
