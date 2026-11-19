#!/usr/bin/env bash
set -euo pipefail

# Sync bug-fix commits from a release/X.Y maintenance branch back into main.
# Skips "chore: release X.Y.Z" version-bump commits and any commits already
# cherry-picked into main (via `git cherry` or `(cherry picked from commit ...)`).

usage() {
  cat <<'EOF'
Usage: scripts/sync-release-fixes.sh [release/X.Y] [options]

Options:
  --dry-run    Show pending fix commits without modifying branches
  --no-pull    Skip `git pull --ff-only origin main`
  --no-lint    Skip `npm run lint` after cherry-picking
  -h, --help   Show this help message

Examples:
  ./scripts/sync-release-fixes.sh                 # auto-detect current release/* or latest release/* branch
  ./scripts/sync-release-fixes.sh release/0.4     # sync fixes from release/0.4 -> main
  ./scripts/sync-release-fixes.sh --dry-run       # preview which fix commits would be synced
EOF
}

RELEASE_BRANCH=""
DRY_RUN=0
DO_PULL=1
DO_LINT=1

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --no-pull)
      DO_PULL=0
      shift
      ;;
    --no-lint)
      DO_LINT=0
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    -*)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
    *)
      if [[ -z "$RELEASE_BRANCH" ]]; then
        RELEASE_BRANCH="$1"
      else
        echo "Unexpected argument: $1" >&2
        usage >&2
        exit 1
      fi
      shift
      ;;
  esac
done

ROOT_DIR="$(git rev-parse --show-toplevel)"
cd "$ROOT_DIR"

CURRENT_BRANCH="$(git symbolic-ref --short HEAD 2>/dev/null || true)"

if [[ -z "$RELEASE_BRANCH" ]]; then
  if [[ "$CURRENT_BRANCH" == release/* ]]; then
    RELEASE_BRANCH="$CURRENT_BRANCH"
  else
    RELEASE_BRANCH="$(git for-each-ref --sort=-v:refname --format='%(refname:short)' 'refs/heads/release/*' | head -n 1 || true)"
  fi
fi

if [[ -z "$RELEASE_BRANCH" ]]; then
  echo "No release/* branch found. Pass a branch name, e.g. release/0.4" >&2
  exit 1
fi

if ! git show-ref --verify --quiet "refs/heads/$RELEASE_BRANCH"; then
  echo "Release branch '$RELEASE_BRANCH' does not exist locally." >&2
  exit 1
fi

if [[ "$DRY_RUN" -eq 0 ]]; then
  if [[ -n "$(git status --porcelain)" ]]; then
    echo "Working tree has uncommitted changes. Commit or stash them before syncing fixes." >&2
    exit 1
  fi
fi

# Collect commits already cherry-picked into main via -x trailers
ALREADY_PICKED_FILE="$(mktemp)"
trap 'rm -f "$ALREADY_PICKED_FILE"' EXIT
git log main --grep="cherry picked from commit" --format="%B" \
  | sed -n 's/.*(cherry picked from commit \([0-9a-f]\{7,40\}\)).*/\1/p' \
  > "$ALREADY_PICKED_FILE" || true

# Use git cherry to detect patch-identical commits (`- sha` = already in main, `+ sha` = not yet in main)
PENDING_SHAS=()
while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  marker="${line:0:1}"
  sha="${line:2}"
  [[ "$marker" != "+" ]] && continue

  subject="$(git show -s --format=%s "$sha")"
  # Skip release version-bump commits
  if [[ "$subject" =~ ^chore(\(release\))?:\ release\  ]]; then
    continue
  fi
  # Skip if explicitly referenced in main's `(cherry picked from commit ...)` trailers
  if grep -q "^${sha:0:7}" "$ALREADY_PICKED_FILE" 2>/dev/null; then
    continue
  fi
  PENDING_SHAS+=("$sha")
done < <(git cherry main "$RELEASE_BRANCH")

if [[ ${#PENDING_SHAS[@]} -eq 0 ]]; then
  echo "No un-synced fix commits on '$RELEASE_BRANCH' (main is up to date)."
  exit 0
fi

echo "Found ${#PENDING_SHAS[@]} pending fix commit(s) on '$RELEASE_BRANCH':"
for sha in "${PENDING_SHAS[@]}"; do
  echo "  - $(git show -s --format='%h %s (%an)' "$sha")"
done

if [[ "$DRY_RUN" -eq 1 ]]; then
  echo "(dry-run) No changes made."
  exit 0
fi

if [[ "$CURRENT_BRANCH" != "main" ]]; then
  git switch main
fi

if [[ "$DO_PULL" -eq 1 ]] && git remote get-url origin >/dev/null 2>&1; then
  if git show-ref --verify --quiet "refs/remotes/origin/main"; then
    git pull --ff-only origin main
  fi
fi

for sha in "${PENDING_SHAS[@]}"; do
  echo "Cherry-picking $sha..."
  if ! git cherry-pick -x "$sha"; then
    echo "" >&2
    echo "Conflict while cherry-picking $sha. Resolve conflicts, then run:" >&2
    echo "  git cherry-pick --continue" >&2
    exit 1
  fi
done

if [[ "$DO_LINT" -eq 1 ]]; then
  npm run lint
fi

echo ""
echo "Synced ${#PENDING_SHAS[@]} fix commit(s) from '$RELEASE_BRANCH' into 'main'."
echo "Review with 'git log -n ${#PENDING_SHAS[@]}' and push when ready: git push origin main"

