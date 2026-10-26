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
export class Modal {
  contentEl = (globalThis as any).document?.createElement?.("div") || {};
  constructor(public app: any) {}
  open() {}
  close() {}
}
export class SuggestModal {}
export class PluginSettingTab {}
export class Setting {
  setName(_name: string) { return this; }
  setDesc(_desc: string) { return this; }
  addToggle(_configure: unknown) { return this; }
  addDropdown(_configure: unknown) { return this; }
  addButton(_configure: unknown) { return this; }
  addText(_configure: unknown) { return this; }
}
export class TAbstractFile {
  path: string = "";
  name: string = "";
}
export class TFolder extends TAbstractFile {
  children: TAbstractFile[] = [];
}
export class TFile extends TAbstractFile {
  basename: string = "";
  extension: string = "";
}
export const languageState = { app: "en", moment: "en" };
export function getLanguage(): string {
  return languageState.app;
}
export const moment = {
  locale: () => languageState.moment,
};
