// ============================================================
// NutEgg Build Script: Compile Prompts for Chrome Extension
// ============================================================
// Reads workflow prompt templates (.md) from obsidian-plugin/src/workflow/
// and bundles them into chrome-extension/src/ai/prompts.js as plain string
// constants.
//
// Run via: node build-prompts.js (or npm run build in chrome-extension)

const fs = require("fs");
const path = require("path");

const WORKFLOW_DIR = path.resolve(__dirname, "../obsidian-plugin/src/workflow");
const TARGET_FILE = path.resolve(__dirname, "src/ai/prompts.js");

const PROMPT_FILES = [
  { key: "CONTENT_ANALYSIS_TPL", file: "content-analysis.md" },
  { key: "CONTENT_TASK_DEFAULT_TPL", file: "content-task-default.md" },
  { key: "SHARED_OUTPUT_RULES_TPL", file: "shared-output-rules.md" },
  { key: "AGGREGATE_CONTENT_TPL", file: "aggregate-content.md" },
  { key: "FOLLOW_UP_TPL", file: "follow-up.md" },
];

function build() {
  console.log("[build-prompts] Reading prompt templates from:", WORKFLOW_DIR);

  const outDir = path.dirname(TARGET_FILE);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  let code = `// ============================================================\n`;
  code += `// Auto-generated prompt templates for Chrome Extension AI\n`;
  code += `// DO NOT EDIT DIRECTLY. Compiled from obsidian-plugin/src/workflow/*.md\n`;
  code += `// Generated: ${new Date().toISOString()}\n`;
  code += `// ============================================================\n\n`;

  for (const { key, file } of PROMPT_FILES) {
    const srcPath = path.join(WORKFLOW_DIR, file);
    if (!fs.existsSync(srcPath)) {
      console.error(`[build-prompts] ❌ Error: Missing required template: ${srcPath}`);
      process.exit(1);
    }
    const content = fs.readFileSync(srcPath, "utf-8");
    code += `// --- ${file} ---\n`;
    code += `const ${key} = ${JSON.stringify(content)};\n\n`;
  }

  code += `// Global object for Chrome extension scripts\n`;
  code += `const PROMPTS = {\n`;
  code += `  contentAnalysis: CONTENT_ANALYSIS_TPL,\n`;
  code += `  contentTaskDefault: CONTENT_TASK_DEFAULT_TPL.trim(),\n`;
  code += `  sharedOutputRules: SHARED_OUTPUT_RULES_TPL.trim(),\n`;
  code += `  aggregateContent: AGGREGATE_CONTENT_TPL,\n`;
  code += `  followUp: FOLLOW_UP_TPL,\n`;
  code += `};\n\n`;

  code += `// Export for Node/CommonJS (testing) or global scope (service worker/browser)\n`;
  code += `if (typeof module !== "undefined" && module.exports) {\n`;
  code += `  module.exports = { PROMPTS, CONTENT_ANALYSIS_TPL, CONTENT_TASK_DEFAULT_TPL, SHARED_OUTPUT_RULES_TPL, AGGREGATE_CONTENT_TPL, FOLLOW_UP_TPL };\n`;
  code += `}\n`;

  fs.writeFileSync(TARGET_FILE, code, "utf-8");
  console.log(`[build-prompts] ✅ Successfully compiled ${PROMPT_FILES.length} prompt templates to: ${TARGET_FILE}`);
}

build();

