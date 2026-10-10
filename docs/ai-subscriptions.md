# AI subscriptions in NutEgg

Chrome owns AI configuration. In **Obsidian mode**, choose **Provider → Subscription → Model → Save**. Obsidian executes requests through your installed provider CLI. Chrome mode offers API keys and local models.

## Guided setup

1. Open Obsidian with the updated NutEgg plugin enabled. Subscriptions are **off by default**, including existing installations. Open the command palette (**Cmd/Ctrl+P**) and run **NutEgg: Enable experimental AI connections**. Optionally assign a shortcut in **Settings → Hotkeys**. This opt-in lives in Obsidian; Chrome cannot enable it. Run **NutEgg: Disable subscription mode** to turn it off and cancel pending work.
2. In Chrome NutEgg settings, enable **Obsidian mode**. Choose **OpenAI**, **Anthropic**, or **Google Gemini** to reveal the **Connection** selector. **Subscription** becomes selectable after Obsidian reports that the feature is enabled. Chrome shows no account setup instructions. All installation, authorization, cancellation, and testing controls live in **Obsidian Settings → NutEgg → Subscription mode enabled**. While the feature is off, neither app displays subscription settings or hints; activation uses only the generic advanced command.
3. Click **Connect NutEgg Chrome**. The published NutEgg extension connects automatically when its browser Origin matches its fixed Web Store ID. Development extensions need one approval in Obsidian; previously approved development identities also reconnect automatically. NutEgg exchanges and stores a local credential without copying a token or starting a bridge. Restarting either app reuses that credential. If Chrome clears its data, a trusted browser Origin can obtain a replacement without another prompt. A caller-supplied identity header alone never enables automatic approval.
4. Choose OpenAI, Anthropic, or Google Gemini, then **Subscription**. Obsidian’s settings guide you through installation and sign-in.
5. In Obsidian, select the provider account. If the CLI is missing, open its official installation guide or copy the displayed command into your terminal. NutEgg does not install software automatically. Click **Refresh** in Obsidian to check again.
6. In Obsidian, click **Sign in** to open your native terminal and the provider's authentication flow. If terminal launch fails, copy the displayed command. Complete sign-in in your browser/terminal, then refresh.
7. Choose **Auto — provider default**, a listed model, or **Custom model ID**, and save. Saving checks status without generating a response. **Test connection** is explicit and uses a small amount of subscription quota.

| Provider | CLI / installation | Authentication | Models |
| --- | --- | --- | --- |
| OpenAI | [Codex](https://learn.chatgpt.com/docs/cli), `npm install -g @openai/codex` | `codex login`; device-code fallback uses `codex login --device-auth` | Discovered using [app-server model/list](https://learn.chatgpt.com/docs/app-server) |
| Anthropic | [Claude Code](https://code.claude.com/docs/en/quickstart) | `claude auth login --claudeai` | `sonnet`, `opus`, `haiku`, and custom IDs; choices are not verified account entitlements |
| Google Gemini | [Antigravity](https://antigravity.google/docs/cli/install) | Open `agy` and complete its browser flow | Discovered using `agy models`; identifiers differ from Gemini API models |

Codex and Claude readiness is verified through their authentication-status commands, not login-process exit. Antigravity displays **Sign-in needs verification** until an explicit test or analysis succeeds. Its status refresh does not generate inference. Account credentials stay in the provider CLI and never enter Chrome settings, sync responses, or NutEgg logs. Manage sign-in opens provider account instructions; NutEgg does not sign out a CLI shared with other applications.

Completed installation/sign-in controls hide automatically. One pending login per provider is reused; reopening settings resumes checks. Cancel stops NutEgg's login operation. Native terminal handoff supports macOS Terminal, Windows PowerShell, and Linux x-terminal-emulator, GNOME Terminal, Konsole, or xterm. An exact command remains available when handoff fails.

## Configuration and migration

API key and subscription preferences are stored separately for each provider, preserving the key and both model choices when switching methods. Only the active configuration syncs to Obsidian. Subscription sync contains no API key. Obsidian displays the synced provider, method, model, and live connection status read-only under Developer Mode.

Legacy `codex-cli`, `claude-cli`, and `gemini-cli` settings migrate to OpenAI, Anthropic, and Gemini with Subscription selected. Custom models survive migration; bridge endpoints and pairing tokens are cleared from active settings. Existing API configurations default to API key. Migration is repeatable. Legacy files and CLI credentials in your home directory are untouched; the separate bridge scripts and port 27124 are retired.

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
