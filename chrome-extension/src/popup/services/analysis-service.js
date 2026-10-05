// ============================================================
// NutEgg Popup Services — Analysis Service
// ============================================================

// Transport only. PopupOperations owns immutable request contexts and guarded commits.
class AnalysisService {
  constructor(options = {}) {
    this.chromeApi = options.chrome || (typeof chrome !== "undefined" ? chrome : null);
  }

  /**
   * Send an analyze request via a long-lived port connection.
   * The open port prevents Chrome from terminating the service worker
   * during extended LLM calls (>30s).
   */
  sendAnalyzeViaPort(payload) {
    const api = this.chromeApi;
    if (!api || !api.runtime || !api.runtime.connect) {
      return Promise.reject(new Error("Chrome runtime.connect unavailable"));
    }

    return new Promise((resolve, reject) => {
      try {
        let settled = false;
        const port = api.runtime.connect({ name: "nutegg-analyze" });
        const heartbeat = setInterval(() => {
          if (!settled && port) {
            try {
              port.postMessage({ action: "ping" });
            } catch {
              clearInterval(heartbeat);
            }
          } else {
            clearInterval(heartbeat);
          }
        }, 10000);

        port.onMessage.addListener((response) => {
          if (settled) return;
          settled = true;
          clearInterval(heartbeat);
          try { port.disconnect(); } catch {}
          resolve(response);
        });

        port.onDisconnect.addListener(() => {
          if (settled) return;
          settled = true;
          clearInterval(heartbeat);
          if (api.runtime.lastError) {
            reject(new Error(api.runtime.lastError.message));
          } else {
            reject(new Error("Connection closed before response received"));
          }
        });

        port.postMessage({ action: "analyze", payload });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Load history for a URL.
   */
  async loadHistory(url) {
    if (!url) return null;
    const resp = await this.sendMessage({ action: "history", url });
    if (resp?.error) throw new Error(resp.error);
    return resp?.history?.length ? resp.history : null;
  }

  /**
   * Create a new egg in the Obsidian vault.
   */
  async createEgg(name, description) {
    try {
      const resp = await this.sendMessage({ action: "create-egg", name, description });
      return resp;
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to create egg" };
    }
  }

  /** Safe message sender helper */
  sendMessage(message) {
    const api = this.chromeApi;
    if (!api || !api.runtime || !api.runtime.sendMessage) {
      return Promise.reject(new Error("Chrome runtime.sendMessage unavailable"));
    }
    return api.runtime.sendMessage(message);
  }
}

const _analysisScope = typeof window !== "undefined" ? window : (typeof globalThis !== "undefined" ? globalThis : this);
_analysisScope.NutEggServices = _analysisScope.NutEggServices || {};
_analysisScope.NutEggServices.AnalysisService = AnalysisService;
_analysisScope.AnalysisService = AnalysisService;

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    AnalysisService,
  };
}
