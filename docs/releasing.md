# Releasing NutEgg

`main` holds ongoing development. Each `release/X.Y` branch maintains one release line: `release/0.4` publishes `0.4.0`, `0.4.1`, and subsequent patches. Releases are explicit; an ordinary branch push does not publish packages.

## First release in a line

Commit and push the intended source to `main`, then run from the repository root:

```bash
git switch main
git push origin main
./release.sh 0.4.0 --dry-run
./release.sh 0.4.0
```

The script fetches remote branches/tags, requires local `main` to match `origin/main` when creating a maintenance branch, and validates version-bumped source in a temporary worktree. It updates both package/manifest versions and tracked lockfile version metadata, installs isolated dependencies with `npm ci`, and runs `npm update byokit --ignore-scripts --no-audit --no-fund` once. It then runs the extension/plugin tests and workspace builds, creates `release/0.4`, and commits the version bump and refreshed lockfile there. It atomically pushes that branch and these immutable annotated tags:

- `0.4.0`: source repository release.
- `nutegg-obsidian-plugin-0.4.0`: Obsidian package build.
- `nutegg-chrome-extension-0.4.0`: Chrome package build.

GitHub Actions checks out the tagged commit, verifies maintenance-branch ancestry and manifest versions, and publishes to the existing distribution repositories. The script watches only runs matching each component tag and source commit. It remains on the maintenance branch after a normal release.

Once both package builds succeed, the script updates only the website's GitHub download metadata on `main` using a separate temporary worktree. It preserves store/community versions and never downgrades downloads when publishing an older maintenance line. Concurrent pushes are retried three times; branch protection or unresolved conflicts produce an explicit website-update error. The publishing identity needs permission to push this metadata commit to `main`.

## Maintenance fixes and patches

```bash
git switch release/0.4
# Edit, test, and commit the fix.
./release.sh 0.4.1 --dry-run
./release.sh 0.4.1
```

The release script fast-forwards to remote maintenance fixes, preserves committed local fixes, and rejects divergent histories. It never merges newer `main` features into the maintenance branch. A patch release fails if its maintenance branch does not already exist.

Carry applicable fix commits into development explicitly:

```bash
git switch main
git pull --ff-only origin main
git cherry-pick -x FIX_COMMIT
# Review/test, then push through the normal repository process.
```

Cherry-pick the fix rather than the release-version commit. No automatic code synchronization runs.

## Interrupted releases

Published tags and existing assets are never overwritten. Inspect the reported failed run and rerun it after correcting the underlying cause:

```bash
gh run rerun RUN_ID --failed
./release.sh 0.4.0 --resume
```

`--resume` requires all three source tags to identify the same commit on the maintenance branch. It installs the tagged lockfile with `npm ci` and validates that source without updating BYOKit, incrementing versions, or moving tags, watches its original component runs, and retries the website update. For an older release, switch to its maintenance branch first. If source or published artifacts need changing, commit the fix and publish a new patch version instead.

Distribution workflow reruns accept identical files/assets, upload missing assets, and fail on conflicting content. Chrome ZIPs use deterministic ordering and timestamps so equivalent builds produce matching archives.

## Checks and local deployment

- `./release.sh --check` tests/builds the current committed source without publishing.
- `./release.sh VERSION --dry-run` validates the selected maintenance source and prospective version without changing the current branch, versions, tags, or remote repository. It fetches remote refs; `--allow-dirty` is permitted only here and checks committed source, not uncommitted edits.
- New versioned releases and their dry runs install isolated dependencies and refresh BYOKit once before validation; registry access is required. Dependency changes remain in the temporary worktree until a successful release commits the refreshed lockfile. An install/update failure stops publication without changing the caller's checkout or installed dependencies.
- `--resume` installs only the tagged lockfile, and CI uses `npm ci` without refreshing BYOKit. Both component builds therefore use the same release dependency snapshot.
- `--check` reuses locally installed dependencies without refreshing npm. Temporary worktrees expose the Obsidian workspace's shared DOM-test dependencies to Chrome tests through `NODE_PATH`.
- Normal build/dev/test/lint commands regenerate the ignored model list from installed BYOKit, without running `npm update`.
- `--deploy [--vault PATH]` remains opt-in. Normal release commands do not update an Obsidian vault.

Validate release-script changes with these commands from the repository root:

```bash
bash -n release.sh scripts/publish-release-assets.sh
node --test scripts/tests/release.test.js
```

These fixtures use temporary local Git remotes and stub GitHub/build commands; they do not publish a real release.

## Verify Obsidian release provenance

New Obsidian releases include `provenance.json`, generated by the source repository's release workflow for `main.js`, `styles.css`, and `manifest.json`. Signing and verification must succeed before publication. The distribution repository is not the builder.

Download the assets and bundle for the desired version, then verify each asset with a current GitHub CLI:

```bash
gh release download VERSION --repo staff-000/nutegg-obsidian-release \
  --pattern main.js --pattern styles.css --pattern manifest.json --pattern provenance.json
for asset in main.js styles.css manifest.json; do
  gh attestation verify "$asset" --bundle provenance.json --repo staff-000/nutegg \
    --signer-workflow staff-000/nutegg/.github/workflows/release-obsidian.yml \
    --source-ref refs/tags/nutegg-obsidian-plugin-VERSION --deny-self-hosted-runners
done
```

Replace `VERSION` with the release version. Add `--source-digest SOURCE_COMMIT_SHA` to enforce a known source commit. Omitting `--bundle provenance.json` verifies through the source repository's online attestation service instead.

Reruns retain an existing bundle only after it verifies against all three rebuilt assets, the source tag, and source commit. A newly signed bundle need not have identical bytes. Published code assets and tags remain immutable; failures require correcting the build or publishing a new version. Existing releases are not retroactively changed.

References: [GitHub attest action](https://github.com/actions/attest), [GitHub CLI verification](https://cli.github.com/manual/gh_attestation_verify).
