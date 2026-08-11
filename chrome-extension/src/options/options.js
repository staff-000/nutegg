// NutEgg Options Page

const DEFAULT_PORT = 27123;

const portInput = document.getElementById("port-input");
const portDisplay = document.getElementById("port-display");
const saveBtn = document.getElementById("save-btn");
const testBtn = document.getElementById("test-btn");
const testResult = document.getElementById("test-result");
const shortcutsLink = document.getElementById("shortcuts-link");

// Load saved settings
document.addEventListener("DOMContentLoaded", async () => {
  const stored = await chrome.storage.local.get("serverPort");
  const port = stored.serverPort || DEFAULT_PORT;
  portInput.value = port;
  portDisplay.textContent = port;

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

  await chrome.storage.local.set({ serverPort: port });
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
      showResult("✅ Connected successfully.", "ok");
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
