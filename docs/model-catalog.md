# Model catalog

NutEgg uses BYOKit's `latest` tag as a **development dependency**. The lockfile
records the installed version. Build-time selection generates
`shared/src/generated-models.mjs` and its `.d.mts` declaration with native BYOKit
`ExecutionModel` objects, using the official `compactModels()` build API. Chrome and
Obsidian use `byokit/client` for runtime execution; neither imports the bundled
catalog or runs model discovery at startup. Provider IDs, display names, base
URLs, and protocols come from BYOKit. There are no separate NutEgg provider IDs,
provider aliases, protocol transports, or full-request-URL catalog.
The generated provider view supplies display choices, and settings resolve to
native BYOKit client options. Only the default local server address is supplied
by NutEgg.
This controls API-key model choices; subscription and ChatGPT models still come
from their respective signed-in connections.

`shared/byok.config.json` encodes the requested query: Anthropic, Google, OpenAI,
DeepSeek; Flash/Workhorse tiers; exactly General speciality and Text output;
released within one year; `dedupe: 2`. `local: false` separates configured local
servers from the cloud filters. `asOf` pins the relative date window for
repeatable builds. Defaults use the first Flash offering in BYOKit's returned
order, falling back to the first result. Existing saved API model IDs are kept.

To refresh:

1. Run `npm update byokit --ignore-scripts` to resolve the latest published snapshot.
2. Advance `asOf` in `shared/byok.config.json` to the desired ISO timestamp.
3. Run `npm run models:update` and review `generated-models.mjs`, its declaration, and
   `shared/models.lock.json`.
4. Run `npm run build:extension` and `npm run build:plugin`.

Ordinary builds use the checked-in selection without regenerating it or using
the network. Generation fails if any selected direct provider has no results,
or if there are no matching OpenRouter offerings. Custom model IDs remain
available for supported providers. Kimi, Zhipu, and Qwen connections are no
longer supported; users must select one of the current providers.

## OpenRouter

BYOKit's `providerIds` identifies the host that receives the key. For each
selected direct offering, the generator calls `getEquivalentModels([seed],
{ ...config, providerIds: [ProviderId.OpenRouter], dedupe: false, limit: 1 })`.
BYOKit resolves canonical identity and ranks the equivalent offerings; NutEgg
keeps one result per seed for its model picker. There is no application-side
cross-catalog join or fabricated reseller ID. The returned `apiModelId` is sent
unchanged, using the OpenRouter key. The direct selection already applies the
requested cap per provider, speciality, and tier.

## Local servers

Local setup is offline and requires the exact served model ID, a base URL,
and an explicit protocol. Chrome exposes an OpenAI-compatible/Ollama selector.
Use `http://localhost:8000/v1` for an OpenAI-compatible server or
`http://localhost:11434` for Ollama. Full `/chat/completions` or `/api/chat`
request URLs are rejected; BYOKit constructs request paths. Protocol selection
is saved independently for each provider profile and synced to Obsidian.

The model ID is sent unchanged. No model is guessed, installed, or discovered.
An empty key means unauthenticated access; a supplied server key is preserved.
Authenticated endpoints require HTTPS, except for `localhost`, IPv4 loopback,
and `::1`. BYOKit's offline `validateClientConfig()` enforces URL and credential
transport safety before Chrome saves settings and Obsidian syncs secrets.
The same validation runs when resolving a local execution or connection check.
Provider calls and connection checks reject redirects so keys cannot
be forwarded to another endpoint. Unauthenticated local-network HTTP remains
available.
The explicit connection check uses `/models` or `/api/tags` at that endpoint.
Saving still runs NutEgg's existing connection check; it does not scan ports.
In connected mode, Save & continue also syncs keyless local configurations to
Obsidian and removes the previous active key. Keyless local setups do not
require SecretStorage.

See [verified BYOKit product gaps](byokit-product-gaps.md) for the fixes verified
in the published 0.2.3 package and the corresponding NutEgg cleanup.

References: [BYOKit README](https://github.com/staff-000/byokit#readme),
[build-time generation](https://github.com/staff-000/byokit#build-a-smaller-model-list),
[Local setup](https://github.com/staff-000/byokit#local-models).
