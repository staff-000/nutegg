# ChatGPT sign-in implementation verification

## Automated checks

Both `npm run build:extension` and `npm run build:plugin` pass. Tests were run as individual files, rather than a whole-suite command.

Obsidian test files: `chatgpt-service`, `chatgpt-http`, `execution-wire`, `execution-coordinator`, `ai-settings-sync`, `subscription-service`, `server`, `index-reader`, `merge-widget`, `ai-client`, and `i18n`.

Chrome test files: `options-setup`, `popup-renderer`, `execution-session`, `connection-mode`, `tab-state`, `ai`, and `i18n`.

Coverage includes OAuth identity checks, listener cleanup, protected credential storage, shared rotating refresh, sign-out races, interrupted streams, unavailable models, explicit provider failures, protocol compatibility, configuration preservation, managed routing, neutral pending states, and rejection of unavailable ChatGPT analysis without API fallback.

The unload regression checks that ChatGPT ownership is released synchronously before asynchronous server shutdown. A separate check preserves the saved model during a credential-storage failure.

## Live macOS checks (2026-10-16)

Used only the isolated vault `NutEgg-ChatGPT-Test-t74kc2al`, listening on port 27124. The live vault was not deployed to.

- The account holder completed OpenAI authorization initiated from the Obsidian settings card.
- Verified identity and plan permission were accepted, models were discovered, and the first listed model (`gpt-6.1-sol`) was selected.
- The settings UI displayed the connected account and the model's display name.
- A real follow-up request through the extension background worker and authenticated local execution protocol returned the expected answer to a synthetic orchard question in approximately 6.4 seconds. This verifies the connected request path; it is not a manual Chrome side-panel test.
- Native Obsidian egg creation completed and saved the requested English gardening egg.
- An initial question containing an appended answer-style instruction produced the existing “No answer returned” fallback. A short direct question succeeded. This was not counted as a successful response; follow-up answer matching still requires the model to echo the exact question text.
- Reload testing exposed a retained credential lock. Teardown now disposes ChatGPT before awaiting server shutdown and also closes it on renderer unload. A missing model selection is no longer silently erased by a storage-unavailable status, and unavailable analysis returns an explicit authorization error.

The account holder reopened the isolated vault with the final build. The saved OAuth connection resumed without another sign-in. Refreshing the model catalog returned seven models; the first model was selected after the earlier failed build had lost its preference. A real Stage 2 request then produced five entries in approximately 23 seconds, and Hatch successfully saved them into the gardening egg, with source locations and the synthetic source URL retained. These connected generation/Hatch requests used the actual extension background-worker code in a test harness, not the Chrome side-panel UI. No OAuth tokens were read or printed by the verification harness.

A subsequent in-app reload using the fixed teardown resumed with `available:true`, `state:ready`, and the saved `gpt-6.1-sol` selection. No credential-lock failure recurred.

## Remaining manual checks

Also verify sign-in from the actual connected Chrome settings UI, model switching, explicit refresh, live cancellation, sign-out/re-authorization, and Chrome tab/navigation changes. Automated coverage is not a substitute for these UI checks or for Windows/Linux platform verification.
