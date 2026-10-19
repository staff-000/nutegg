# BYOKit product integration findings

Checked against the installed npm package, BYOKit **0.2.0**. These are local,
mocked-response reproductions, without provider credentials or paid requests.
NutEgg declares `byokit: latest`; its lockfile pins the installed snapshot.

NutEgg now uses BYOKit's standard `OpenAI` client from `byokit/client` for all
API connections, with the native connection protocol and selected model
metadata. This includes Claude, Gemini, OpenAI-compatible services, and Ollama.
NutEgg's handwritten transports and `apiFormat` catalog are removed. Remaining
code selects settings, presents errors, tracks jobs, manages credentials, and
runs subscription executors. It does not implement provider wire protocols.

## Fix before production: thought-only Gemini responses

`call.js`, `parsed()`, copies Gemini thought text into visible `content` when
there is no answer. An input like this:

```js
{
  candidates: [{
    content: { parts: [{ thought: true, text: 'THOUGHT_ONLY' }] },
    finishReason: 'MAX_TOKENS',
  }],
}
```

returns a successful completion with both `message.content` and
`message.reasoning_content` equal to `THOUGHT_ONLY`. An application reading the
normalized answer receives reasoning text instead of an answer. Keep thought
content separate and report the missing answer explicitly. NutEgg contains no
Gemini-specific response repair for this bug.

There is a related diagnostics gap: OpenAI-compatible reasoning-only responses
throw `EMPTY_RESPONSE` and discard `finish_reason` and token details. Preserve
safe completion metadata on that error so products can distinguish exhausted
output budgets from ordinary empty responses. Do not expose raw request bodies
or credentials. The public `ChatResult` declaration also omits the
`reasoning_content` field that the implementation returns.

## Fix: precompiled TypeScript output does not fit execution APIs

The documented optimized path does not type-check directly:

```js
// Generate first: byokit build shared/byok.config.json --out models.js
import { getModels } from './models.js';
import { call } from 'byokit/client';
call(getModels()[0], 'Hi', 'provider-key');
```

TypeScript reports TS2345: `PrecompiledModel` is not assignable to `ModelOption`;
fields including `lifecycle`, `popularity`, `speciality`, `tier`, and
`modalities` are missing from its declared type. Runtime objects have them.
Generate declarations compatible with `ModelOption`, including native enums,
so the build output can be passed to `call()` and client `models` without a
cast. NutEgg currently needs type assertions at the generated JSON boundaries; it
does not reshape those model objects at runtime.

## Fix: custom local models disagree about authentication

This public API combination fails before fetching:

```js
import { appendModel, call, ApiProtocol, Deployment } from 'byokit/client';
const [model] = appendModel([], {
  providerId: 'local', modelId: 'installed-model',
  baseUrl: 'http://localhost:11434/v1',
  protocol: ApiProtocol.OpenAI, deployment: Deployment.Local,
});
await call(model, 'Hi', '');
// INVALID_REQUEST: Provide a provider API key.
```

`appendModel()` sets local deployment and optional authentication metadata, but
`call()` tests for `model.local` to allow an empty key. The standard client
already supports explicit empty keys, so NutEgg uses that supported API.
Align the public local/custom configuration APIs; do not require a consumer to
fabricate internal `local` fields or instantiate a catalog to configure one
server. The README's `getModels({ local: [...] })` path itself works.

## Improve: public offline configuration validation

The SDK constructor accepts `new OpenAI({ baseURL: 'http://remote.example/v1',
apiKey: 'mock' })`; authenticated HTTP is correctly rejected later at call time.
Products also need to validate transport safety before saving or syncing a key,
without sending a request. Expose an offline configuration validator covering
URL shape, protocol, and credential transport. NutEgg currently retains a small
URL/HTTPS validator for settings and credential sync; no execution transport
bypasses BYOKit's checks.

## Improve: smaller native compiled artifacts

The query stays at build time, and runtime imports `byokit/client`. The full
bundled catalog and discovery/query implementation are absent from the browser
bundle. However, preserving the 22 selected native offering objects contributes
about **167 kB** to the unminified browser bundle, including repeated logos and
verification/evidence metadata. BYOKit execution contributes another **64 kB**.
The browser bundle is about **427 KiB**, compared with about **215 KiB** when
NutEgg shipped only display metadata and its own transports.

Provide an official compact compiled target whose objects remain accepted by
execution APIs and preserve identity, connection, capabilities, and limits.
Avoid requiring each product to invent an unofficial reduced model schema.
NutEgg retains the native objects to make this cost visible.

## Improve: selecting equivalent OpenRouter offerings

NutEgg's build script queries the four direct providers, then joins OpenRouter
offerings by canonical `modelId`. A creator filter or an equivalent-offerings
API would remove this application-side join. It is an ergonomic improvement,
not an execution blocker. Host IDs and API model IDs already exist in BYOKit;
there is no reason to maintain separate NutEgg provider identities.

## Application responsibilities and optional scope

BYOKit already provides protocol translation, custom endpoint execution,
HTTP credential protection, redirect rejection, cancellation, timeouts,
structured error assessments, and non-streaming text/tool-call normalization.
Those are not missing features.

Credential storage, Obsidian/Chrome ownership, subscription CLI sessions,
ChatGPT sign-in, workflow prompts, and job diagnostics remain NutEgg concerns.
Provider credit/balance queries are not supplied by BYOKit and remain separate
small HTTP calls. Streaming and media execution are explicitly unsupported by
BYOKit today; neither is required by NutEgg's current API-call contract.

Sources: [README](https://github.com/staff-000/byokit#readme),
[call implementation](https://github.com/staff-000/byokit/blob/main/packages/byokit/call.js),
[client implementation](https://github.com/staff-000/byokit/blob/main/packages/byokit/sdk.js),
[custom model implementation](https://github.com/staff-000/byokit/blob/main/packages/byokit/custom-model.js),
[compiler](https://github.com/staff-000/byokit/blob/main/packages/byokit/bin.mjs).
The findings above describe the installed package; upstream main may change.
