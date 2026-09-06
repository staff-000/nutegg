# Privacy Policy for NutEgg Chrome Extension

**Last updated:** September 6, 2026

NutEgg ("we", "our", or "the extension") is a privacy-first, local-first browser extension designed to help users capture web content and curate personal knowledge with Obsidian.

We strongly believe that your personal notes, reading habits, and browsing activity belong solely to you. **NutEgg does not operate any centralized servers, does not run analytics or tracking scripts, and does not collect, store, sell, or transmit your personal data to us or any third-party advertising networks.**

---

## 1. Information Handled by the Extension

### a. Web Content & Captures (Active Tab)
When you open the NutEgg side panel or initiate an extraction, NutEgg reads text, metadata, and transcripts (such as YouTube captions or webpage text) from your **currently active tab only**.
- This data is processed in-memory.
- This data is transmitted exclusively to your local machine via HTTP (`http://127.0.0.1:[port]`) to communicate with your local NutEgg Obsidian plugin.
- NutEgg does **not** monitor, record, or transmit your broader browsing history.

### b. Local Settings & Preferences
NutEgg uses Chrome's `storage.local` API to persist user preferences (such as your configured local server port) locally on your device. This data never leaves your browser.

---

## 2. How Your Data Is Processed

* **Local-First Architecture**: All content captures, indexing, and note curation occur entirely on your own device. Captured notes ("nuts") and organized knowledge trees ("eggs") are saved directly to your local Obsidian vault.
* **No Telemetry or Tracking**: We do not include any tracking pixels, analytics SDKs, session recording tools, or telemetry libraries in NutEgg.

---

## 3. Third-Party AI Services

NutEgg connects with AI model providers (such as Anthropic, OpenAI, Google Gemini, DeepSeek, or OpenRouter) to generate summaries and novelty evaluations.
* **User-Provided API Keys**: Any AI processing is configured and executed directly through your local Obsidian plugin using your own private API keys.
* **Direct Transmission**: Web content sent for AI analysis travels directly from your machine to your chosen AI provider's official API endpoint.
* Please consult the privacy policy of your selected AI provider for details on how they handle API requests.

---

## 4. Chrome Permissions Used

* **`activeTab`**: Allows NutEgg to access the URL, title, and content of the webpage you are currently viewing when you open the extension or click an action.
* **`tabs`**: Allows the persistent side panel to detect tab changes and URL navigation so it can display the correct state and cached capture status for the active page, as well as seek video playback timestamps.
* **`storage`**: Allows NutEgg to save user preferences (like your local Obsidian port) locally on your device.
* **`scripting`**: Allows NutEgg to inject packaged extractor scripts into open tabs on-demand without requiring a page reload.
* **`sidePanel`**: Allows the extension to display its user interface alongside web content for an uninterrupted, side-by-side reading and curation experience.
* **Host Permissions (`http://127.0.0.1/*`, `http://localhost/*`)**: Enables local communication between the Chrome extension and your local Obsidian sync server.

---

## 5. Data Retention & Deletion

Because NutEgg stores all captured data and settings locally on your computer:
* You retain complete ownership and control over your data.
* You can delete any captured notes or eggs at any time directly through Obsidian or your operating system's file manager.
* Uninstalling the Chrome extension immediately removes all extension settings stored in `chrome.storage.local`.

---

## 6. Children's Privacy

NutEgg does not knowingly collect or solicit any personal information from children under the age of 13.

---

## 7. Changes to This Privacy Policy

We may update this Privacy Policy from time to time to reflect changes in functionality or legal requirements. Any updates will be posted to our open-source repository with a revised "Last updated" date.

---

## 8. Contact Us

If you have any questions, feedback, or concerns regarding this Privacy Policy or NutEgg's privacy practices, please contact us:
* **Email**: [staffhacker.000@gmail.com](mailto:staffhacker.000@gmail.com)
* **GitHub Issues**: [https://github.com/staff-000/nutegg/issues](https://github.com/staff-000/nutegg/issues)
