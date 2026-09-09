// NutEgg Options Page

const DEFAULT_PORT = 27123;

const portInput = document.getElementById("port-input");
const portDisplay = document.getElementById("port-display");
const modeSelect = document.getElementById("mode-select");
const fastDesc = document.getElementById("fast-desc");
const confirmDesc = document.getElementById("confirm-desc");
const saveBtn = document.getElementById("save-btn");
const testBtn = document.getElementById("test-btn");
const testResult = document.getElementById("test-result");
const shortcutsLink = document.getElementById("shortcuts-link");

function updateModeDesc(mode) {
  if (mode === "confirm") {
    confirmDesc?.classList.add("active-desc");
    fastDesc?.classList.remove("active-desc");
  } else {
    fastDesc?.classList.add("active-desc");
    confirmDesc?.classList.remove("active-desc");
  }
}

// Load saved settings
document.addEventListener("DOMContentLoaded", async () => {
  const stored = await chrome.storage.local.get(["serverPort", "analysisMode"]);
  const port = stored.serverPort || DEFAULT_PORT;
  portInput.value = port;
  portDisplay.textContent = port;

  const mode = stored.analysisMode || "fast";
  if (modeSelect) {
    modeSelect.value = mode;
    updateModeDesc(mode);
    modeSelect.addEventListener("change", async () => {
      updateModeDesc(modeSelect.value);
      await chrome.storage.local.set({ analysisMode: modeSelect.value });
      showResult("Workflow mode updated.", "ok");
      setTimeout(() => { testResult.classList.add("hidden"); }, 2000);
    });
  }

  portInput.addEventListener("input", () => {
    portDisplay.textContent = portInput.value || DEFAULT_PORT;
  });

  saveBtn.addEventListener("click", handleSave);
  testBtn.addEventListener("click", handleTest);
  shortcutsLink.addEventListener("click", (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
  });
});

async function handleSave() {
  const port = parseInt(portInput.value, 10);
  if (!port || port < 1 || port > 65535) {
    showResult("Invalid port number.", "error");
    return;
  }

  const mode = modeSelect ? modeSelect.value : "fast";
  await chrome.storage.local.set({ serverPort: port, analysisMode: mode });
  // Notify background
  await chrome.runtime.sendMessage({ action: "set-port", port });
  showResult("Saved.", "ok");
  setTimeout(() => { testResult.classList.add("hidden"); }, 2000);
}

async function handleTest() {
  const port = parseInt(portInput.value, 10);
  if (!port || port < 1 || port > 65535) {
    showResult("Invalid port.", "error");
    return;
  }

  testResult.textContent = "Testing...";
  testResult.className = "test-result";
  testResult.classList.remove("hidden");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(`http://127.0.0.1:${port}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      let creditInfo = "";
      try {
        const creditResp = await fetch(`http://127.0.0.1:${port}/credit`);
        if (creditResp.ok) {
          const credit = await creditResp.json();
          if (credit.hasBalance && credit.balanceFormatted) {
            creditInfo = ` | 🪙 ${credit.providerLabel}: ${credit.balanceFormatted}`;
          } else if (credit.providerLabel) {
            const label = credit.source === "openrouter" ? "OpenRouter" : credit.providerLabel;
            creditInfo = ` | 🪙 ${label} (${credit.statusText})`;
          }
        }
      } catch {}
      showResult(`✅ Connected successfully.${creditInfo}`, "ok");
    } else {
      showResult("❌ Server responded with error.", "error");
    }
  } catch {
    clearTimeout(timeout);
    showResult(`❌ Cannot reach server on port ${port}. Start Obsidian with NutEgg.`, "error");
  }
}

function showResult(msg, type) {
  testResult.textContent = msg;
  testResult.className = `test-result ${type}`;
  testResult.classList.remove("hidden");
}
