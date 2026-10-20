#!/usr/bin/env bash
# Run inside the checked-out distribution repository after staging its artifacts.
set -euo pipefail
REPO="$1"; VERSION="$2"; SOURCE_TAG="$3"; DEFAULT_BRANCH="$4"; shift 4
if git ls-remote --exit-code --tags origin "refs/tags/$VERSION" >/dev/null 2>&1; then
  git fetch origin "refs/tags/$VERSION:refs/tags/$VERSION"
  git diff --cached --quiet "refs/tags/$VERSION" -- || {
    echo "Published tag $VERSION contains different files; publish a new version." >&2; exit 1;
  }
else
  if ! git diff --cached --quiet; then git commit -m "Release $SOURCE_TAG (version $VERSION)"; fi
  git tag -a "$VERSION" -m "Release $VERSION from $SOURCE_TAG"
  git push --atomic origin "HEAD:refs/heads/$DEFAULT_BRANCH" "refs/tags/$VERSION:refs/tags/$VERSION"
fi
if gh release view "$VERSION" --repo "$REPO" >/dev/null 2>&1; then
  ASSET_NAMES="$(gh release view "$VERSION" --repo "$REPO" --json assets --jq '.assets[].name')"
  DOWNLOAD_DIR="$(mktemp -d)"
  trap 'rm -rf "$DOWNLOAD_DIR"' EXIT
  for asset in "$@"; do
    name="$(basename "$asset")"
    if printf '%s\n' "$ASSET_NAMES" | grep -Fxq "$name"; then
      gh release download "$VERSION" --repo "$REPO" --pattern "$name" --dir "$DOWNLOAD_DIR"
      cmp "$asset" "$DOWNLOAD_DIR/$name" || { echo "Published asset $name differs; publish a new version." >&2; exit 1; }
    else gh release upload "$VERSION" "$asset" --repo "$REPO"
    fi
  done
else
  gh release create "$VERSION" "$@" --repo "$REPO" --verify-tag --target "$DEFAULT_BRANCH" \
    --title "NutEgg $VERSION" --notes "Automated release from source tag $SOURCE_TAG."
fi
