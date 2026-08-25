// Bundles tests/*.test.ts with esbuild so Node's built-in test runner can run
// them without a TypeScript toolchain. Invoked by `npm test`.
import esbuild from "esbuild";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

await esbuild.build({
  entryPoints: ["tests/*.test.ts"],
  outdir: "tests-dist",
  bundle: true,
  format: "cjs",
  platform: "node",
  external: ["node:sqlite", "@codemirror/view", "@codemirror/state", "jsdom"],
  plugins: [
    {
      // `obsidian` has no runtime outside the app — alias it to a stub
      name: "obsidian-stub",
      setup(build) {
        build.onResolve({ filter: /^obsidian$/ }, () => ({
          path: path.join(__dirname, "tests", "obsidian-stub.ts"),
        }));
      },
    },
    {
      // Bundle prompt/template .md files as plain text strings
      name: "md-as-text",
      setup(build) {
        build.onLoad({ filter: /\.md$/ }, async (args) => ({
          contents: await fs.promises.readFile(args.path, "utf8"),
          loader: "text",
        }));
      },
    },
  ],
  logLevel: "warning",
});
