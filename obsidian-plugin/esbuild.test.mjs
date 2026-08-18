// Bundles tests/*.test.ts with esbuild so Node's built-in test runner can run
// them without a TypeScript toolchain. Invoked by `npm test`.
import esbuild from "esbuild";
import fs from "fs";

await esbuild.build({
  entryPoints: ["tests/*.test.ts"],
  outdir: "tests-dist",
  bundle: true,
  format: "cjs",
  platform: "node",
  external: ["obsidian", "node:sqlite"],
  plugins: [
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
