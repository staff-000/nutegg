// Minimal runtime stand-ins for `obsidian` values used by src modules under
// test (esbuild.test.mjs aliases `obsidian` to this file). Type-only imports
// are erased at compile time — this covers the few runtime imports:
// Notice, and the settings/main UI classes.
export class Notice {
  constructor(public message: string, _timeout?: number) {}
}
export class App {}
export class Plugin {}
export class MarkdownView {}
export class SuggestModal {}
export class PluginSettingTab {}
export class Setting {}
export class TAbstractFile {
  path: string = "";
  name: string = "";
}
export class TFile extends TAbstractFile {
  basename: string = "";
  extension: string = "";
}
export function getLanguage(): string {
  return "en";
}
export const moment = {
  locale: () => "en",
};
