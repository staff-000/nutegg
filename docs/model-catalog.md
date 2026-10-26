# Model catalog

NutEgg uses BYOKit **0.3.0** through the `latest` development dependency. The npm
lockfile records the installed release. Model selection is configured in
`shared/byok.config.json`. Chrome and Obsidian builds automatically compile it
with BYOKit's own CLI before bundling or TypeScript checking:

```sh
npm run models:update
# Runs:
byokit build shared/byok.config.json --out shared/generated/models.mjs --compact
```

Application access is one import and one call:

```ts
import { getModelsByProvider } from '../generated/models.mjs';
const modelsByProvider = getModelsByProvider();
```

There is no custom generation script, manual equivalent lookup, custom model
lockfile, or handwritten declaration generation. The CLI writes the compact
module, matching native `.d.mts` declarations, and `.mjs.lock.json` metadata in
`shared/generated/`. All these build artifacts are ignored by git. Commit only
the configuration and npm lockfile. Normal builds generate models offline from
the installed BYOKit snapshot, without updating packages or querying npm.
New releases refresh BYOKit once in the release worktree before validation and
commit the updated npm lockfile with the release. Resume runs and CI install
that locked version without updating it. See [releasing](releasing.md).
Chrome and Obsidian import `byokit/client` for execution; neither bundles the
full catalog or runs discovery at startup.

The direct `node chrome-extension/build.js` path also generates models, as do
Obsidian's npm build/dev/lint commands and its test-bundling script. Standalone
generation through `npm run models:update` remains available for inspection.

## Selection policy

The configuration selects Anthropic, Google, OpenAI, DeepSeek, and OpenRouter as
hosting providers, and those first four organizations as creators. Filters retain
Flash/Workhorse tiers, exactly General speciality and Text output, released
within one year. The existing `asOf` pins the relative date window.

In 0.3.0, `dedupe: 2` selects up to two newest canonical models per
creator/speciality/tier, then retains eligible offerings across the selected
hosts. This replaces the old direct-provider shortlist plus equivalent-offering
lookup. The current result is 24 offerings: 10 direct and 14 OpenRouter. A host
may have multiple offerings for one canonical model. NutEgg uses every returned
`apiModelId` unchanged; the API key always belongs to the hosting `providerId`.

Provider names, protocols, and cloud connections come from the generated native
objects. The remaining provider view only supplies settings display choices and
defaults: first Flash result, falling back to the first result. Saved exact model
IDs continue to work as custom choices even if no longer in the generated list.
No unused OpenRouter family classification remains.

Local is a separate settings option, with its default endpoint supplied by
NutEgg. It is not a creator-filtered cloud offering. Subscription and ChatGPT
model lists come from their signed-in connections.

## Refresh

1. Advance `asOf` in `shared/byok.config.json` when the selection window should move.
2. New releases update BYOKit automatically. To refresh a development install,
   run `npm update byokit --ignore-scripts` explicitly.
3. Run `npm run build:extension` or `npm run build:plugin`; either regenerates the
   model list from the installed package. Review ignored output locally if needed.
4. Run the targeted catalog tests. Commit configuration and dependency changes;
   generated files stay local.

## Local setup and validation

Local requires the exact served model ID, a base URL, and an explicit protocol.
Use `http://localhost:8000/v1` for OpenAI-compatible servers or
`http://localhost:11434` for Ollama. NutEgg rejects full `/chat/completions` and
`/api/chat` request URLs; BYOKit constructs request paths. No model is guessed
and no local ports are scanned.

The SDK's offline `validateClientConfig()` validates before Chrome saves and
Obsidian syncs credentials. Empty keys are supported. Supplied keys require HTTPS
except over loopback; execution and connection checks reject redirects. Explicit
connection checks use `/models` or `/api/tags`. Keyless local sync clears the old
active secret without requiring SecretStorage.

BYOKit 0.3.0's root TypeScript declarations omit the new creator fields.
The JSON configuration, CLI output, and `byokit/client` declarations support
them, so the generated-list integration needs no workaround.
