// ============================================================
// NutEgg Chrome Extension Build Script
// ============================================================
//
// Bundles shared/src/index.ts and inlines workflow templates into
// a single self-contained browser IIFE bundle: src/ai/ai-core.js.

const path = require("path");
const fs = require("fs");

let esbuild;
try {
  esbuild = require("esbuild");
} catch {
  try {
    esbuild = require("../obsidian-plugin/node_modules/esbuild");
  } catch (e) {
    console.error("esbuild could not be loaded:", e);
    process.exit(1);
  }
}

const mdAsTextPlugin = {
  name: "md-as-text",
  setup(build) {
    build.onLoad({ filter: /\.md$/ }, async (args) => ({
      contents: await fs.promises.readFile(args.path, "utf8"),
      loader: "text",
    }));
  },
};

async function build() {
  const outfile = path.join(__dirname, "src/ai/ai-core.js");
  const entryPoint = path.join(__dirname, "../shared/src/index.ts");
  console.log("[NutEgg Build] Bundling shared AI engine into:", outfile);

  // Ensure output directory exists
  const outDir = path.dirname(outfile);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  await esbuild.build({
    entryPoints: [entryPoint],
    bundle: true,
    format: "iife",
    globalName: "NutEggAI",
    platform: "browser",
    target: ["chrome110"],
    outfile,
    plugins: [mdAsTextPlugin],
    sourcemap: false,
    logLevel: "info",
  });

  console.log("[NutEgg Build] Successfully generated src/ai/ai-core.js");
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});

