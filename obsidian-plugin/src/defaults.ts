/**
 * Default vault boilerplate.
 *
 * The canonical egg template and examples live in shared/templates/.
 * Vault boilerplate lives in src/templates/. Both are bundled as text
 * (see the md-as-text loader in esbuild.config.mjs). To extend:
 *   - Edit a template file to change what gets created.
 *   - Add example Markdown to shared/templates/examples/ and export it in
 *     shared/src/egg-examples.ts. Add it to EXAMPLE_EGGS below to seed it on first run.
 */
import indexTemplate from "./templates/index.md";
import investmentTemplate from "../../shared/templates/examples/investment.md";
import psychologyTemplate from "../../shared/templates/examples/psychology.md";
import societyTemplate from "../../shared/templates/examples/society.md";
import aiMlTemplate from "../../shared/templates/examples/ai_ml.md";

/** Boilerplate _index.md created on first run. */
export const INDEX_TEMPLATE = indexTemplate;

/** Template for new egg files created via the "Create a new egg file" command. */
export { EGG_TEMPLATE } from "../../shared/src/egg-template";

/** Example egg files created alongside the index on first run. */
export const EXAMPLE_EGGS: Array<{ path: string; content: string }> = [
  { path: "nutegg/investment.md", content: investmentTemplate },
  { path: "nutegg/psychology.md", content: psychologyTemplate },
  { path: "nutegg/society.md", content: societyTemplate },
  { path: "nutegg/ai_ml.md", content: aiMlTemplate },
];
