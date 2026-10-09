# AI subscriptions in NutEgg

Subscriptions are available in Obsidian mode. Configure AI in the NutEgg Chrome
extension; Obsidian reads the synced configuration. Chrome standalone mode uses
API providers or local models. One bridge and one pairing token work with all
three subscription providers:

| NutEgg provider | Install | Sign in |
| --- | --- | --- |
| ChatGPT subscription (Codex CLI) | [Codex CLI](https://developers.openai.com/codex/cli/) | `codex login` → ChatGPT |
| Claude subscription (Claude Code) | [Claude Code](https://code.claude.com/docs/en/quickstart) | `claude auth login` → Claude account |
| Gemini subscription (local bridge) | [Antigravity CLI](https://antigravity.google/docs/cli/install/) | `agy` → Google account |

Install only the CLI you intend to use. Use an account whose plan includes access
to that CLI; a website subscription is not a general-purpose API key. Available
models and usage limits are determined by the CLI and your account.

## Connect

1. Complete sign-in in the provider's own CLI using the command above. NutEgg does
   not copy or store your subscription credentials.
2. From the NutEgg checkout, start the bridge and keep its terminal open:

   ```sh
   npm run bridge:ai
   ```

3. Open Obsidian with the NutEgg plugin enabled. In Chrome → NutEgg settings,
   enable **Obsidian mode** to show subscription providers.
4. Copy the **pairing token** printed by the bridge. In the Chrome AI settings,
   choose a subscription provider, paste the token under **Local pairing token**,
   leave the model as **auto**, then save. Obsidian receives these settings
   automatically; its AI settings are read-only.
5. Analyze a short page to verify inference access. Connection checks do not
   consume model quota. Codex and Claude checks also reject missing or API-based
   sign-ins; Gemini checks its executable, with sign-in verified during analysis.

Switching between subscription providers retains the pairing token. Switching
between a subscription and an API provider clears the credential field so tokens
cannot accidentally be sent to an API provider.

Chunk window size and max completion tokens are also configured in Chrome under
**Advanced settings** and synced to Obsidian whenever it is open. Configuration
sync works in both modes; the mode determines where analysis runs.

## Existing Gemini setup

Gemini subscription access uses **Antigravity CLI (`agy`)** with your Google AI
Pro / Ultra account. Google ended individual account access through the old
Gemini CLI on June 18, 2026. Run `agy` interactively to sign in, then exit before
starting the bridge. No Gemini API key is needed.

Stop the old bridge with Ctrl+C, then run `npm run bridge:ai`. The old
`npm run bridge:gemini` command remains an alias for the same service. Your token
and Gemini provider selection remain valid. The token stays at
`~/.nutegg/gemini-bridge/pairing-token` for compatibility. Reload the rebuilt Chrome
extension and updated Obsidian plugin, then enable Obsidian mode to select a
subscription provider in Chrome.

For Gemini-specific troubleshooting:

- The bridge also checks `~/.local/bin/agy` on macOS/Linux and
  `%LOCALAPPDATA%/agy/bin/agy.exe` on Windows. The legacy
  `NUTEGG_GEMINI_COMMAND` override remains supported but must point to `agy`.
- Run `agy models` to find available custom models. Leave NutEgg's model as
  `auto` to use the CLI's default.
- Run `agy` interactively to verify sign-in. If your CLI settings use
  `modelProvider: gemini`, follow Google's
  [account authentication instructions](https://antigravity.google/docs/cli/install/)
  to return to account-based authentication.

## Requirements and limits

- Use current CLI versions. Codex needs `exec --ignore-user-config` and
  `--ephemeral`; Claude Code needs `--safe-mode` and `--tools`. Unsupported flags
  produce an update instruction.
- If a CLI isn't on PATH, set `NUTEGG_CODEX_COMMAND`, `NUTEGG_CLAUDE_COMMAND`, or
  `NUTEGG_AGY_COMMAND` to its absolute executable path before starting the bridge.
  Standard `~/.local/bin` installations are also detected. Use native executables
  on Windows, not shell aliases or `.cmd` wrappers.
- The bridge uses subscription sign-in only. It strips API credentials and
  endpoint overrides from child environments rather than silently using paid API
  billing. If Claude was authenticated only through an environment-supplied API
  credential or gateway, sign in to your Claude account separately.
- `auto` uses the CLI's default model. Custom models must be supported by your
  CLI account. API model names and CLI model names can differ.
- Up to 32 requests queue locally and run one at a time. Each running inference
  has a three-minute timeout. CLI output limits apply; NutEgg's API Max Tokens
  setting is not a hard output limit for subscription calls.
- The bridge listens only on `127.0.0.1:27124` and requires the local pairing
  token. It must run on the same computer as Chrome or Obsidian.
  Restart it if NutEgg reports Bridge offline. To rotate the token, stop the
  bridge, delete `~/.nutegg/gemini-bridge/pairing-token`, restart, and save the
  newly printed token in NutEgg.
- Captured content is sent to the selected provider. Codex uses an ephemeral,
  read-only run with user configuration, shell tools, apps, plugins, and web search
  disabled. Claude uses safe mode with an empty tool list and no session
  persistence. Antigravity uses a temporary workspace and a dedicated primary
  agent with an empty tool allowlist. Slash command expansion is disabled, and
  prompts travel via structured stdin. Antigravity's account settings, user
  customizations, session storage, and privacy terms still apply.

Claude support runs the user's unmodified local Claude Code installation. It does
not offer Claude.ai OAuth sign-in inside NutEgg or intermediate account tokens.
Anthropic distinguishes personal CLI use from offering Claude-backed products;
review its [integration and credential-use terms](https://code.claude.com/docs/en/legal-and-compliance)
before distributing or hosting this integration. It is not a hosted subscription
proxy or a replacement for an API agreement.

References: [Codex authentication](https://learn.chatgpt.com/docs/auth),
[Codex non-interactive execution](https://learn.chatgpt.com/docs/non-interactive-mode),
[Claude Code authentication](https://code.claude.com/docs/en/authentication),
[Claude Code programmatic execution](https://code.claude.com/docs/en/headless),
[Gemini to Antigravity migration](https://github.com/google-gemini/gemini-cli/discussions/28017),
[Antigravity headless protocol](https://antigravity.google/docs/cli/headless/).
