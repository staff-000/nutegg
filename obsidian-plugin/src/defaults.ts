/**
 * Default vault boilerplate.
 *
 * Templates live as real .md files in src/templates/ and are bundled as text
 * (see the md-as-text loader in esbuild.config.mjs). To extend:
 *   - Edit a template file to change what gets created.
 *   - Drop a new .md into src/templates/examples/ and add one line to
 *     EXAMPLE_EGGS below to create a new example egg on first run.
 */
import indexTemplate from "./templates/index.md";
import eggTemplate from "./templates/egg.md";
import investmentTemplate from "./templates/examples/investment.md";
import psychologyTemplate from "./templates/examples/psychology.md";
import societyTemplate from "./templates/examples/society.md";
import aiMlTemplate from "./templates/examples/ai_ml.md";

/** Boilerplate _index.md created on first run. */
export const INDEX_TEMPLATE = indexTemplate;

/** Template for new egg files created via the "Create a new egg file" command. */
export const EGG_TEMPLATE = eggTemplate;

/** Example egg files created alongside the index on first run. */
export const EXAMPLE_EGGS: Array<{ path: string; content: string }> = [
  { path: "nutegg/investment.md", content: investmentTemplate },
  { path: "nutegg/psychology.md", content: psychologyTemplate },
  { path: "nutegg/society.md", content: societyTemplate },
  { path: "nutegg/ai_ml.md", content: aiMlTemplate },
];
