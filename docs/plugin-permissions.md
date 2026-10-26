# NutEgg plugin permissions and local data

NutEgg's desktop integrations need local capabilities that Obsidian's automated review flags. These flags remain visible when the capability is present; the following boundaries explain their purpose.

| Review finding | Implementation | Boundary |
| --- | --- | --- |
| System identity/environment | `chatgpt-store.ts`, `subscription-cli.mjs`, `subscription-gemini.mjs`, `subscription-windows.mjs` | Home/application directories and executable discovery; Windows username is used locally to assign credential ACLs. No hostname or network-interface fingerprint. Installation identity is a random UUID. |
| Direct filesystem access | `chatgpt-store.ts`, CLI modules, `db.ts` | Protected local credential records; owned temporary CLI/login directories; SQLite database inside the vault. Note and workflow operations use Obsidian APIs. |
| Process execution | CLI modules, `subscription-service.ts`, credential ACL setup | Installed provider executables use argument arrays, stdin prompts, timeouts and cancellation. Login uses generated, quoted terminal scripts. Windows ACL and login helpers use system-directory paths rather than PATH lookup. |
| Vault enumeration | `vault-files.ts`, egg and workflow consumers | Walk only configured egg/workflow subtrees; direct lookup for known note paths. No whole-vault fallback. |
| Clipboard | `settings.ts` | Write a displayed installation/setup command only after clicking Copy. Never read clipboard content. |
| Browser storage | `i18n/index.ts` | No localStorage/sessionStorage access. Language uses Obsidian's API and locale/document/browser fallbacks. Ordinary settings use plugin loadData/saveData. |

## Files and credentials

ChatGPT credentials are stored outside the vault under the current user's application-data directory:

- macOS: `~/Library/Application Support/NutEgg/chatgpt/`
- Windows: `%LOCALAPPDATA%\NutEgg\chatgpt\`
- Linux: `$XDG_DATA_HOME/NutEgg/chatgpt/` or `~/.local/share/NutEgg/chatgpt/`

Each local vault has an isolated record directory, protected permissions, atomic replacement, and an exclusive ownership lock. Tokens are not included in plugin settings, Chrome messages, exports, or public diagnostics. Sign out from the ChatGPT card to revoke authorization and remove local tokens; the random installation identity remains. Provider CLI credentials are managed by the installed provider CLI, not NutEgg.

CLI inference uses temporary working directories outside the vault, with cleanup in finally blocks. Login directories are owned by the active login attempt and removed on cancellation/expiry/unload. These directories can survive an OS crash; NutEgg does not scan or delete unrelated temporary directories.

SQLite normally lives at `nutegg/.nutegg.db` (beside the configured raw-content folder). Its resolved location is checked before directory creation and opening, including symlink escapes. Notes, captures, eggs, workflows, and ordinary plugin settings remain in the vault.

## Data sent to AI providers

Requested captured content, questions, prompts, and relevant egg instructions/context are sent to the selected provider. CLI processes inherit the environment needed by installed tools, with provider API-key/billing overrides removed for subscription execution. That environment is not copied into prompts or diagnostics. Installed tools remain subject to their provider's behavior and privacy terms.

Choose another connection in NutEgg settings to stop using a particular integration. Disable CLI subscriptions where that toggle is available; disabling or unloading the plugin cancels its active work. ChatGPT sign-out removes its local authorization independently of CLI selection.

## Release provenance

Obsidian assets are built in `staff-000/nutegg` and distributed through `staff-000/nutegg-obsidian-release`. The source build signs the exact asset digests. See [release verification](releasing.md#verify-obsidian-release-provenance). Attestations establish build origin, not an audit of plugin safety.

Automated review may continue to flag filesystem, process, environment, identity, and clipboard APIs. The table above documents why they remain. A reviewer looking only in the distribution repository may need the attached provenance bundle or source-repository attestation link.
