# AI subscriptions in NutEgg

Obsidian owns the shared API key, CLI subscription, or ChatGPT sign-in mode. Connected Chrome profiles can explicitly change it and all connected profiles follow. Each Chrome keeps its API settings and key; Obsidian has separate native API settings. See [execution ownership](ai-execution.md).

## ChatGPT sign-in

**ChatGPT sign-in** uses OpenAI's open-source OAuth integration directly. It requires neither an API key nor Codex CLI. NutEgg's Obsidian desktop plugin owns authorization and sends requests to the public Responses API. Native Obsidian actions and connected Chrome workflows use the same account and model. Chrome-only mode continues to use its own API configuration and does not support this connection.

1. Update both the extension and plugin; they use execution protocol 3.
2. Turn on **Use Subscription** in connected Chrome, then open Obsidian Settings → NutEgg and select **ChatGPT sign-in** from the direct connection choices: **ChatGPT sign-in**, **Codex CLI**, **Google Gemini**, and **Claude**. API keys are configured in Chrome settings. Alternatively, enable Obsidian connection in Chrome settings and select **ChatGPT sign-in** there.
3. Click **Continue with ChatGPT**, complete browser authorization, and explicitly allow ChatGPT plan usage. Identity-only login cannot run AI requests. Account and plan eligibility are determined by OpenAI.
4. Choose an available account model. The first model is selected for a new connection; an unavailable saved model requires reselection. **Refresh models** updates the account-specific list.
5. Keep Obsidian open while using connected Chrome. Analysis, questions, egg creation, Hatch, and subsequent merges use the selected connection. Signing out never enables API-key or CLI billing automatically.
6. Use **Manage usage** for ChatGPT usage controls. NutEgg does not enforce the API output-token limit in this mode because the current integration does not support that parameter.

The local callback listener binds only to `127.0.0.1` and expires after five minutes. Cancel closes the listener. NutEgg verifies state, PKCE, and ID-token identity before accepting credentials. One connected account is supported per local vault installation; sign out before changing accounts.

Credentials live outside the vault and browser storage in a protected per-installation directory under `~/Library/Application Support/NutEgg/chatgpt` (macOS), `$XDG_DATA_HOME/NutEgg/chatgpt` or `~/.local/share/NutEgg/chatgpt` (Linux), or `%LOCALAPPDATA%/NutEgg/chatgpt` (Windows). Credential files are replaced atomically and restricted to the current OS user. An exclusive lock prevents multiple Obsidian instances from refreshing the same rotating token. Vault synchronization does not carry the connection to another computer. Tokens and authorization codes are never returned to Chrome or written into plugin settings, diagnostics, or captured nuts.

Sign out cancels active ChatGPT work, clears local credentials, and attempts remote revocation. If revocation cannot be confirmed, NutEgg shows a warning; disconnect NutEgg in ChatGPT settings as well. If local storage is unavailable or another instance owns the connection, resolve that condition in Obsidian. Restarting or signing in repeatedly does not reset provider usage limits.

Implementation follows OpenAI's [registration](https://developers.openai.com/siwc/token-sharing-open-source/sign-in), [session](https://developers.openai.com/siwc/token-sharing-open-source/profiles-and-sessions), and [inference](https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference) contracts. Chrome receives only public connection metadata and generated results. The API and CLI configurations remain separately saved.

## CLI subscription setup

1. In Obsidian Settings → NutEgg, select **Codex CLI**, **Google Gemini**, or **Claude** directly under **AI connection**.
2. Complete the selected connection's authorization flow and choose its model. The existing OpenAI/Codex connection is labeled **Codex CLI**; its saved identifier, paths, models, and CLI login are unchanged.
3. Connected Chrome follows the selected connection and model. Switch directly to **ChatGPT sign-in** in Obsidian when desired.
4. Configure API keys and select API execution in Chrome settings. Obsidian has no API-key editor, including in Developer Mode. Saved API configurations remain intact, and an existing API selection is not changed merely by opening Obsidian settings.
5. Obsidian has no subscription availability toggle or enable/disable commands. In Chrome, **Use Subscription** still selects between the shared connection and API-key execution. Turning it off preserves the saved account and model.

Provider installation and sign-in stay in Obsidian. If a CLI is missing, open its official installation guide or copy the displayed command into your terminal. NutEgg does not install software automatically. Connections use an automatically exchanged local credential; there is no token to copy or separate bridge to start.

| Provider | CLI / installation | Authentication | Models |
| --- | --- | --- | --- |
| Codex CLI | [Codex](https://learn.chatgpt.com/docs/cli), `npm install -g @openai/codex` | `codex login`; device-code fallback uses `codex login --device-auth` | Discovered using [app-server model/list](https://learn.chatgpt.com/docs/app-server) |
| Anthropic | [Claude Code](https://code.claude.com/docs/en/quickstart) | `claude auth login --claudeai` | `sonnet`, `opus`, `haiku`, and custom IDs; choices are not verified account entitlements |
| Google Gemini | [Antigravity](https://antigravity.google/docs/cli/install) | Open `agy` and complete its browser flow | Discovered using `agy models`; identifiers differ from Gemini API models |

Codex and Claude readiness is verified through their authentication-status commands, not login-process exit. Antigravity displays **Sign-in needs verification** until an explicit test or analysis succeeds. Its status refresh does not generate inference. Account credentials stay in the provider CLI and never enter Chrome settings, sync responses, or NutEgg logs. Manage sign-in opens provider account instructions; NutEgg does not sign out a CLI shared with other applications.

Completed installation/sign-in controls hide automatically. One pending login per provider is reused; reopening settings resumes checks. Cancel stops NutEgg's login operation. Native terminal handoff supports macOS Terminal, Windows PowerShell, and Linux x-terminal-emulator, GNOME Terminal, Konsole, or xterm. An exact command remains available when handoff fails.

## Configuration

Obsidian settings show live authenticated Chrome sessions, non-secret provider/model details, local server status and subscription runtime activity. Different API configurations are expected; there is no last-sync-wins conflict. API mode hides subscription guidance and stops owned subscription inference, login and discovery processes.

API key and subscription preferences are retained separately across switching and restarts. Chrome sends non-secret execution metadata and its explicit shared mode choice. For inference, API keys and endpoints stay inside the initiating Chrome executor. An explicit connected API **Save & continue** also updates the native Obsidian account in SecretStorage with the saved Chrome account; each explicit save replaces the native key, while other profiles retain their own keys. Obsidian keeps the subscription provider and model; Chrome cannot overwrite them. Subscription sync contains no API key. Obsidian hides subscription setup while Chrome uses API-key execution; turning on **Use Subscription** in connected Chrome shows it again.

Provider IDs follow BYOKit directly: `openai`, `anthropic`, and `google`.
Gemini model names and CLI integration names are unchanged. Legacy provider-ID
aliases are not translated.

Model discovery refreshes after login and on demand. Obsidian retains cached choices and the selected model if discovery fails; Auto and Custom remain available. A rejected model reports **Choose another model**, with no automatic substitution.

## Offline and error recovery

A subscription selection with Obsidian offline pauses analysis and shows a red light. Open Obsidian or choose **Set up Chrome API key**. That action opens an API configuration draft; the execution mode changes only when you save. NutEgg never silently falls back to API billing.

The AI credit pill says **Subscription** in both apps. Codex can report remaining percentages for its usage windows through the non-generating **account/rateLimits/read** interface; NutEgg displays those percentages and caches the result for 30 seconds. If a CLI does not expose usable quota information (currently Claude and Antigravity), the tooltip says remaining usage is not reported. Saving and refreshing never generate a quota test. [Codex rate-limit interface](https://learn.chatgpt.com/docs/app-server).

Subscription status describes connection and provider-reported quota errors, not a monetary balance. Expired authentication, rejected models, exhausted quota, or inaccessible providers turn the light red. Initial missing installation/sign-in/verification is amber. See the [complete signal matrix](connection-status.md).

### Windows connection troubleshooting

Claude detection includes its native installer, WinGet links, and native npm packages for x64 and ARM64. Antigravity detection includes its standard `%LOCALAPPDATA%\agy\bin` directory. All CLI discovery checks the persisted Windows PATH as well as the current process PATH, so a newly installed or custom-location executable can be found even when Obsidian was opened before the PATH update. The saved PATH is refreshed within 30 seconds. Native executable detection ignores shell placeholders and launchers; explicit path overrides remain authoritative. Custom installation directories must be on PATH or supplied as an override.

If Codex runs in PowerShell but NutEgg reports it missing, check the native executable path in Obsidian Developer Mode. NutEgg searches PATH and npm platform packages, including nested packages and both `bin/codex.exe` and legacy `codex/codex.exe` layouts. A manual override must point to `codex.exe`, not a `.cmd` or `.ps1` shim; restart the plugin after changing it.

ChatGPT sign-in is independent of Codex CLI. Its output-token-limit note is informational. If local credential storage cannot initialize, settings and the shared Chrome connection state include a diagnostic code. `storage_permissions` means Windows ACL setup failed, `storage_locked` means storage ownership could not be acquired, and a filesystem code such as `EPERM / fsync` identifies the failing operation. Fully quit Obsidian and reopen the vault to rule out an active owner; include the diagnostic code when reporting a persistent failure. Diagnostics exclude credential contents and local paths. Credential writes use a writable handle for the disk flush required by Windows.

## Runtime and local access

Use current CLI versions: Codex requires restricted ephemeral execution flags; Claude requires safe mode and an empty tool list. Unsupported flags produce an update instruction. Executables are detected through PATH and standard native installation locations. Absolute executable-path overrides are always visible in Obsidian Developer Mode, including during API-key execution; restart the plugin after changing it. Windows uses native executables rather than `.cmd` wrappers.

Requests use isolated temporary workspaces, restricted tools, sanitized environments, bounded output, a serial queue of at most 32 jobs, and a three-minute inference timeout. Plugin shutdown cancels queued and running work. Login processes are tracked separately. API Max Tokens is not a hard output limit for subscription calls.

The existing Obsidian server advertises subscription and connection-approval capabilities through `/health`. Host and Origin are validated before dispatch. Chrome sends its extension identity in `X-NutEgg-Extension-Origin` because browser-generated Origin can be absent on extension requests. Any browser Origin must match that identity; the identity header alone grants no access. Sensitive requests—including configuration writes, subscription inference, models, and login controls—require a trusted extension identity and its automatically exchanged credential. Approval challenges expire after two minutes, are origin-bound, and can be consumed once. Browser Origin validation protects against ordinary websites and unrelated extensions; it is not cryptographic authentication of Chrome against malicious local software that can forge HTTP headers. Stronger browser-controlled caller identity would require a separately registered native messaging host. An outdated plugin produces an update instruction.

Chrome refreshes connection readiness while settings are visible, allowing CLI status checks up to 20 seconds. Obsidian's explicit connection test shows progress immediately, allows up to three minutes for inference, and retains a success or failure message after refreshing account status.

Captured content goes to the selected provider. Provider account settings and privacy terms still apply. NutEgg invokes the user's installed CLI; it does not embed provider OAuth or host a subscription proxy.

References: [Codex authentication](https://learn.chatgpt.com/docs/auth), [Claude authentication](https://code.claude.com/docs/en/authentication), [Claude model configuration](https://code.claude.com/docs/en/model-config), [Antigravity installation and authentication](https://antigravity.google/docs/cli/install).

## Release smoke tests

Run the following with real accounts on **macOS, Windows, and Linux** before claiming end-to-end platform validation. Automated adapter tests use controlled CLI fixtures and do not verify provider accounts or native terminal behavior.

- Start with the published NutEgg extension: verify automatic credential exchange without a dialog and successful Save/sync. For an unknown development ID, confirm analysis/config/login requests fail until its first approval. Reconnect an approved development ID after clearing Chrome storage and verify no second dialog. Confirm a claimed identity without a matching browser Origin cannot auto-connect.
- For each provider, verify missing-installation guidance, native installation detection, and the Developer Mode path override.
- Launch sign-in, confirm browser/terminal handoff, repeat the click to verify one operation, cancel it, and reopen settings to verify pending-operation recovery.
- Refresh models, choose Auto and a custom model, disconnect model discovery, and confirm the saved selection remains available.
- Save without an inference request; explicitly test/perform one short analysis. Verify rejected models, expired authentication, quota failures, and timeouts produce actionable red status.
- Close Obsidian during running/queued inference: confirm processes stop, the light becomes red, and no API request occurs. Open the API recovery flow and confirm mode/billing changes only after Save.

Windows requires native CLI executables; Linux requires a supported terminal. Provider sign-in must be completed by the account holder.
