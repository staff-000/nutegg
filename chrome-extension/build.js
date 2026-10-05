// ============================================================
// NutEgg Chrome Extension Build Script
// ============================================================
//
// Bundles shared/src/index.ts and inlines workflow and egg templates into
// a single self-contained browser IIFE bundle: src/ai/ai-core.js.

const path = require("path");
const fs = require("fs");

let esbuild;
const esbuildCandidates = [
  "esbuild",
  path.join(__dirname, "node_modules/esbuild"),
  path.join(__dirname, "../node_modules/esbuild"),
  path.join(__dirname, "../obsidian-plugin/node_modules/esbuild"),
];
for (const cand of esbuildCandidates) {
  try {
    esbuild = require(cand);
    if (esbuild) break;
  } catch {}
}
if (!esbuild) {
  console.error("esbuild could not be loaded from any of:", esbuildCandidates);
  process.exit(1);
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
  const outfile = path.join(__dirname, "dist/ai-core.js");
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
    banner: {
      js: "// ============================================================\n// AUTO-GENERATED BUNDLE FROM shared/src/index.ts — DO NOT EDIT DIRECTLY\n// Edit source files in shared/ and run 'node build.js' or 'npm run build'.\n// ============================================================",
    },
    logLevel: "info",
  });

  console.log("[NutEgg Build] Successfully generated dist/ai-core.js");
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
