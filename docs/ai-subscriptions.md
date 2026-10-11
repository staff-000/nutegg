# AI subscriptions in NutEgg

Chrome controls the active connection method. API settings belong to Chrome; subscription authorization, provider, and model settings belong to Obsidian.

## Guided setup

1. Initially both apps show only API configuration. No subscription switch appears in Obsidian settings, in either mode.
2. In Obsidian's command palette (**Cmd/Ctrl+P**), run **NutEgg: Enable experimental AI connections**. This makes the feature available without switching away from the current API key. Only a command can enable or disable the feature.
3. In Chrome settings, turn on **Obsidian connection**. NutEgg connects automatically using its trusted extension identity; an unknown development extension needs a first approval.
4. Chrome now shows **Use subscription**. Turn it on to select subscription execution. The existing API provider, key, and model are retained separately.
5. Obsidian now displays subscription details. Choose the provider and click **Authorize subscription**. Complete provider sign-in if requested; the connection test uses a small amount of subscription quota.
6. Choose the model in Obsidian: **Auto — provider default**, a discovered model, or **Custom model tag**. Chrome displays the active provider and model as read-only.
7. Turn off **Use subscription** in Chrome to restore the saved API configuration. Obsidian stops pending subscription inference, login, and model discovery, displays the synced API settings, and hides subscription details. Its local Chrome connection stays available for API configuration sync. It still has no subscription switch.
8. Turn **Use subscription** back on in Chrome to return to the subscription provider and model previously selected in Obsidian.
9. Run **NutEgg: Disable subscription mode** in Obsidian to cancel subscription work, hide Chrome's switch, and restore Chrome's saved API configuration on the next successful connection check. With no saved API key, API setup is shown. An offline Obsidian connection alone never triggers this switch.

Provider installation and sign-in stay in Obsidian. If a CLI is missing, open its official installation guide or copy the displayed command into your terminal. NutEgg does not install software automatically. Connections use an automatically exchanged local credential; there is no token to copy or separate bridge to start.

| Provider | CLI / installation | Authentication | Models |
| --- | --- | --- | --- |
| OpenAI | [Codex](https://learn.chatgpt.com/docs/cli), `npm install -g @openai/codex` | `codex login`; device-code fallback uses `codex login --device-auth` | Discovered using [app-server model/list](https://learn.chatgpt.com/docs/app-server) |
| Anthropic | [Claude Code](https://code.claude.com/docs/en/quickstart) | `claude auth login --claudeai` | `sonnet`, `opus`, `haiku`, and custom IDs; choices are not verified account entitlements |
| Google Gemini | [Antigravity](https://antigravity.google/docs/cli/install) | Open `agy` and complete its browser flow | Discovered using `agy models`; identifiers differ from Gemini API models |

Codex and Claude readiness is verified through their authentication-status commands, not login-process exit. Antigravity displays **Sign-in needs verification** until an explicit test or analysis succeeds. Its status refresh does not generate inference. Account credentials stay in the provider CLI and never enter Chrome settings, sync responses, or NutEgg logs. Manage sign-in opens provider account instructions; NutEgg does not sign out a CLI shared with other applications.

Completed installation/sign-in controls hide automatically. One pending login per provider is reused; reopening settings resumes checks. Cancel stops NutEgg's login operation. Native terminal handoff supports macOS Terminal, Windows PowerShell, and Linux x-terminal-emulator, GNOME Terminal, Konsole, or xterm. An exact command remains available when handoff fails.

## Configuration and migration

Obsidian settings show a compact connection panel: the local server, recently active Chrome connections, and AI bridge activity. Chrome activity means authenticated requests within the last 90 seconds; saved approval alone does not indicate an online browser. Activity resets when the plugin restarts. In API mode the bridge shows **Off · API key**, with no subscription controls. When Subscription is selected, it shows setup needs, authorization, running/queued requests, model discovery, or idle status. The panel refreshes while settings are open without launching extra provider requests. A warning appears when recent Chrome connections request different connection methods; Obsidian still uses the last synced configuration.

API key and subscription preferences are retained separately across switching and restarts. Chrome sends only the active API configuration or its choice to use Subscription. Obsidian keeps the subscription provider and model; Chrome cannot overwrite them. Subscription sync contains no API key. The feature availability command is separate from Chrome's active connection switch.

Legacy `codex-cli`, `claude-cli`, and `gemini-cli` settings migrate to OpenAI, Anthropic, and Gemini. When the feature is disabled, their subscription selections stay inactive until the Obsidian command enables availability and Chrome selects Subscription. Custom models survive migration; bridge endpoints and pairing tokens are cleared from active settings. Existing API configurations default to API key. Migration is repeatable. Legacy files and CLI credentials in your home directory are untouched; the separate bridge scripts and port 27124 are retired.

Model discovery refreshes after login and on demand. Chrome retains cached choices and the selected model if discovery fails; Auto and Custom remain available. A rejected model reports **Choose another model**, with no automatic substitution.

## Offline and error recovery

A subscription selection with Obsidian offline pauses analysis and shows a red light. Open Obsidian or choose **Set up Chrome API key**. That action opens an API configuration draft; the execution mode changes only when you save. NutEgg never silently falls back to API billing.

The AI credit pill says **Subscription** in both apps. Codex can report remaining percentages for its usage windows through the non-generating **account/rateLimits/read** interface; NutEgg displays those percentages and caches the result for 30 seconds. If a CLI does not expose usable quota information (currently Claude and Antigravity), the tooltip says remaining usage is not reported. Saving and refreshing never generate a quota test. [Codex rate-limit interface](https://learn.chatgpt.com/docs/app-server).

Subscription status describes connection and provider-reported quota errors, not a monetary balance. Expired authentication, rejected models, exhausted quota, or inaccessible providers turn the light red. Initial missing installation/sign-in/verification is amber. See the [complete signal matrix](connection-status.md).

## Runtime and local access

Use current CLI versions: Codex requires restricted ephemeral execution flags; Claude requires safe mode and an empty tool list. Unsupported flags produce an update instruction. Executables are detected through PATH and standard native installation locations. An absolute executable-path override is available in Obsidian Developer Mode; restart the plugin after changing it. Windows uses native executables rather than `.cmd` wrappers.

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
