/**
 * Shared test doubles — an in-memory Obsidian vault and a plugin stub.
 * No Obsidian runtime is needed: modules are tested against these fakes.
 */

export function makeFakeVault(initial: Record<string, string> = {}) {
  const files = new Map<string, string>(Object.entries(initial));
  const basePath = "/fake/vault";

  const adapter = {
    exists: async (p: string) =>
      files.has(p) || [...files.keys()].some((k) => k.startsWith(p + "/")),
    read: async (p: string) => {
      if (!files.has(p)) throw new Error("File not found: " + p);
      return files.get(p)!;
    },
    remove: async (p: string) => {
      files.delete(p);
    },
    append: async (p: string, data: string) => {
      files.set(p, (files.get(p) ?? "") + data);
    },
    getBasePath: () => basePath,
  };

  const vault = {
    adapter,
    create: async (p: string, content: string) => {
      files.set(p, content);
    },
    createFolder: async (_p: string) => { /* flat store */ },
    modify: async (file: { path: string }, content: string) => {
      files.set(file.path, content);
    },
    read: async (file: { path: string }) => {
      if (!files.has(file.path)) throw new Error("File not found: " + file.path);
      return files.get(file.path)!;
    },
    getAbstractFileByPath: (p: string) => (files.has(p) ? { path: p } : null),
    getMarkdownFiles: () =>
      [...files.keys()]
        .filter((k) => k.endsWith(".md"))
        .map((p) => ({ path: p })),
  };

  return { files, basePath, vault };
}

/** Minimal NutEggPlugin-shaped stub — override anything per test. */
export function makeFakePlugin(overrides: any = {}) {
  const { vault } = makeFakeVault(overrides.vaultFiles || {});
  return {
    settings: {
      aiApiKey: "test-key",
      rawFolder: "nutegg/_raw",
      indexFile: "nutegg/_index.md",
      serverPort: 27123,
      ...(overrides.settings || {}),
    },
    app: { vault: overrides.vault ?? vault },
    aiClient: overrides.aiClient ?? {
      chat: async () => "{}",
      checkCredit: async () => ({
        provider: "anthropic",
        providerLabel: "Anthropic (Claude)",
        source: "openrouter",
        model: "claude-sonnet-5",
        hasBalance: true,
        balanceFormatted: "$8.45",
        statusText: "$8.45 left",
      }),
    },
    eggParser: overrides.eggParser ?? {
      formatEggForPrompt: (e: any) => `egg:${e.fileName}`,
      formatEggInstructionsForPrompt: (e: any) => `instructions:${e.fileName}`,
      formatEggKnowledgeForPrompt: (e: any) => `knowledge:${e.fileName}`,
    },
    indexReader: overrides.indexReader ?? {},
    knowledgeBase: overrides.knowledgeBase ?? {},
    db: overrides.db ?? null,
    ...overrides,
  };
}
