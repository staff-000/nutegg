#!/usr/bin/env bash
# Select a verified bundle before the immutable release publisher runs.
set -euo pipefail
SOURCE_REPO="$1"; TARGET_REPO="$2"; VERSION="$3"; SOURCE_TAG="$4"; SOURCE_SHA="$5"
NEW_BUNDLE="$6"; OUTPUT="$7"; shift 7
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
BUNDLE="$NEW_BUNDLE"
# An API failure must not be mistaken for an absent provenance asset.
RELEASES="$(gh api "repos/$TARGET_REPO/releases" --paginate --jq ".[] | select(.tag_name == \"$VERSION\") | .assets[].name")"
if printf '%s\n' "$RELEASES" | grep -Fxq 'provenance.json'; then
  gh release download "$VERSION" --repo "$TARGET_REPO" --pattern provenance.json --dir "$WORK"
  BUNDLE="$WORK/provenance.json"
fi
for asset in "$@"; do
  gh attestation verify "$asset" --bundle "$BUNDLE" --repo "$SOURCE_REPO" \
    --signer-workflow "$SOURCE_REPO/.github/workflows/release-obsidian.yml" \
    --source-ref "refs/tags/$SOURCE_TAG" --source-digest "$SOURCE_SHA" --deny-self-hosted-runners
done
cp "$BUNDLE" "$OUTPUT"
