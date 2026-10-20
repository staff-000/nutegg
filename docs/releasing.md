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

The script fetches remote branches/tags, requires local `main` to match `origin/main` when creating a maintenance branch, and validates version-bumped source in a temporary worktree. It updates both package/manifest versions and tracked lockfile version metadata, runs the extension/plugin tests and workspace builds, creates `release/0.4`, and commits the version bump there. It atomically pushes that branch and these immutable annotated tags:

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

`--resume` requires all three source tags to identify the same commit on the maintenance branch. It validates that tagged source without incrementing versions or moving tags, watches its original component runs, and retries the website update. For an older release, switch to its maintenance branch first. If source or published artifacts need changing, commit the fix and publish a new patch version instead.

Distribution workflow reruns accept identical files/assets, upload missing assets, and fail on conflicting content. Chrome ZIPs use deterministic ordering and timestamps so equivalent builds produce matching archives.

## Checks and local deployment

- `./release.sh --check` tests/builds the current committed source without publishing.
- `./release.sh VERSION --dry-run` validates the selected maintenance source and prospective version without changing the current branch, versions, tags, or remote repository. It fetches remote refs; `--allow-dirty` is permitted only here and checks committed source, not uncommitted edits.
- Dependency packages must already be installed locally. Temporary worktrees reuse the installed dependencies; CI installs the committed lockfile with `npm ci`.
- `--deploy [--vault PATH]` remains opt-in. Normal release commands do not update an Obsidian vault.

Validate release-script changes with these commands from the repository root:

```bash
bash -n release.sh scripts/publish-release-assets.sh
node --test scripts/tests/release.test.js
```

These fixtures use temporary local Git remotes and stub GitHub/build commands; they do not publish a real release.
