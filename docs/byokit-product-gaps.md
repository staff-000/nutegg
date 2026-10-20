# BYOKit production integration: verified fixes and implementation

NutEgg uses the published npm package **BYOKit 0.2.3**. The dependency declaration
remains `byokit: latest`; the npm lockfile pins the installed version and
integrity. The six production integration checks pass against the published
artifact, using mocked responses without credentials or paid requests.

## Verification results

| Finding from 0.2.0 | Verified in 0.2.3 | NutEgg integration |
| --- | --- | --- |
| Thought-only Gemini responses became answers | Raises `EMPTY_RESPONSE`; reasoning stays separate | Consume normalized answer content directly; map empty responses to `invalid_response` |
| Empty responses discarded completion diagnostics | Errors expose safe `completion` metadata; types include reasoning token usage | Preserve native completion metadata on `AIError`, without raw provider data |
| Generated types were incompatible with execution APIs | Full and compact compiler output type-check with `call()` and SDK clients | Generate `.mjs` data and `.d.mts` declarations using native `ExecutionModel`; remove unsafe model and connection casts |
| Custom local models required an API key | `appendModel()` plus `call()` accepts empty keys for local models | Existing standard client supports exact local model IDs with empty keys; no local authentication shim |
| No offline configuration validation | Public `validateClientConfig()` validates URLs, protocols, headers, and credential transport without fetching | Remove NutEgg's URL/HTTPS validator; validate before Chrome saves and Obsidian syncs credentials |
| Native offerings carried bulky catalog data | Official `compactModels()` and CLI `--compact` retain execution metadata | Ship compact native offerings; exclude catalog discovery, evidence, logos, and pricing from runtime |
| OpenRouter required an application-side canonical join | Public `getEquivalentModels()` resolves linked offerings | Select one equivalent OpenRouter offering per direct seed at build time; remove the manual join and deduplication |

The thought-only case and completion metadata share one SDK integration test;
there are six targeted tests in total. The compiler test includes strict
TypeScript checking of generated compact `.mjs` output and its declarations.

## Implemented data flow

1. `npm run models:update` reads `shared/byok.config.json` and selects the four
   direct providers through `getModels()`. The existing pinned date, filters,
   defaults, and native provider/API model IDs are preserved.
2. For each selected offering, `getEquivalentModels()` selects the first ranked
   OpenRouter equivalent using the same filters, `dedupe: false`, and `limit: 1`.
   The current selection is 11 direct and 11 OpenRouter offerings. Local setup
   metadata also comes from BYOKit.
3. `compactModels()` produces the official execution objects. The generator
   writes checked-in `.mjs` data, native `.d.mts` declarations, and a lock with
   package version, catalog/config/output hashes, and selected offering IDs.
   The model JSON is approximately 25.8 kB instead of 99.6 kB for full objects.
4. Chrome and Obsidian import generated data and `byokit/client`. Ordinary builds
   and startup perform no catalog discovery or network model refresh.
5. Local settings resolve through `validateClientConfig()`. Chrome validates
   before writing profiles or synchronizing; Obsidian validates before writing
   secrets. Chat still makes one direct SDK completion request with its signal,
   timeout, selected model metadata, and native connection protocol.

No SDK compatibility layer, provider-ID aliases, handwritten provider protocol,
unsafe model cast, or alternate transport is introduced.
The unused `@anthropic-ai/sdk` dependency from the old transport is removed.

## Remaining product rules

NutEgg rejects full `/chat/completions` and `/api/chat` URLs because its Local
field accepts a server base URL. BYOKit's validator accepts those paths; this
small form rule is still required. Local setup also requires the exact served
model ID and an explicit OpenAI-compatible or Ollama protocol.

The model picker chooses one OpenRouter offering per selected direct seed.
This uses BYOKit's native lookup and limit; it does not infer equivalence from
names or manipulate API model IDs.

Credential storage, Chrome/Obsidian ownership, subscription and ChatGPT sessions,
workflow prompts, diagnostics, RPC validation, and UI error presentation remain
NutEgg responsibilities. Provider balance queries and explicit local connection
checks remain separate small HTTP requests. No automatic inference retry or
output-budget change is added.

## Regression checks

- Catalog matches the pinned native query and equivalent offerings, contains
  exactly the six requested providers, and ships compact execution objects.
- Generated declarations compile in the Obsidian build without model casts.
- Thought-only Gemini/OpenAI responses fail with safe metadata and no thought,
  prompt, key, or raw-provider-data exposure.
- Keyless OpenAI-compatible and Ollama execution preserves the exact model ID.
- Unsafe endpoints fail before fetch, Chrome persistence, or Obsidian secret sync.
- Subscription ownership, connection selection, credential redaction, cancellation,
  and job isolation continue to pass their targeted tests.

Validation completed: all six SDK integration checks and 203 NutEgg tests across
the catalog, AI, options, connection-mode, execution-session, diagnostics,
AI-client, settings-sync, and execution-wire test files pass. Both
`npm run build:extension` and `npm run build:plugin` pass. Regeneration is
deterministic, all selected offering identities and provider defaults are
unchanged, and the browser AI bundle is approximately 313 KiB.

Sources: [npm 0.2.3](https://www.npmjs.com/package/byokit/v/0.2.3),
[README](https://github.com/staff-000/byokit#readme),
[SDK reference](https://github.com/staff-000/byokit/blob/main/docs/sdk.md).
