# Model catalog

NutEgg uses BYOKit's `latest` tag as a **development dependency**. The lockfile
records the installed version. The app imports only
`shared/src/generated-models.ts`, a compact static projection of BYOKit's CLI
output. No full catalog, query engine, SDK, or provider requests run at startup.
Chrome and Obsidian consume the same generated selection through `catalog.ts`.
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
3. Run `npm run models:update` and review `generated-models.ts` and
   `shared/models.lock.json`.
4. Run `npm run build:extension` and `npm run build:plugin`.

Ordinary builds use the checked-in selection without regenerating it or using
the network. Generation fails if any selected direct provider has no results,
or if there are no matching OpenRouter offerings. Custom model IDs remain
available for supported providers. Kimi, Zhipu, and Qwen connections are no
longer supported; users must select one of the current providers.

## OpenRouter

BYOKit's `providerIds` identifies the host that receives the key. OpenRouter
therefore needs a separate query. The generator queries its offerings with the
same content filters, joins them to selected direct models by canonical
`modelId`, and retains one offering per canonical model. It always uses the
returned `apiModelId`; prepending a vendor prefix to a direct API ID is unsafe.
OpenRouter's global `dedupe: 2` is disabled for this intermediate query so it
cannot discard an entire creator before the join. The direct selection already
applies the requested cap per provider, speciality, and tier.

BYOKit supplies the identities required for this integration. A creator
filter or an API to resolve equivalent offerings across hosts would eliminate
this small build-time join; neither is required to ship the change.

## Local servers

Following BYOKit's Local setup contract, configuration is offline and requires
the exact model ID served by the user's server. NutEgg keeps its existing
transport rather than adding an SDK for a model-list change. It accepts:

- OpenAI-compatible base URLs such as `http://localhost:8000/v1` or full
  `/v1/chat/completions` URLs.
- Ollama base URLs with `localApiType: 'ollama'`, or an explicit `/api/chat`
  URL (also usable from Chrome's endpoint field).

The model ID is sent unchanged. No model is guessed, installed, or discovered.
An empty key means unauthenticated access; a supplied server key is preserved.
The explicit connection check uses `/models` or `/api/tags` at that endpoint.
Saving still runs NutEgg's existing connection check; it does not scan ports.

References: [BYOKit README](https://github.com/staff-000/byokit#readme),
[build-time generation](https://github.com/staff-000/byokit#build-a-smaller-model-list),
[Local setup](https://github.com/staff-000/byokit#local-models).
