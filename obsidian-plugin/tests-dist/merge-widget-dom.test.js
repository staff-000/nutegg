"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// tests/merge-widget-dom.test.ts
var import_node_test = require("node:test");
var import_strict = __toESM(require("node:assert/strict"));
var import_jsdom = require("jsdom");
var import_view2 = require("@codemirror/view");
var import_state = require("@codemirror/state");

// tests/obsidian-stub.ts
var Notice = class {
  constructor(message, _timeout) {
    this.message = message;
  }
};
var TAbstractFile = class {
  path = "";
  name = "";
};
var TFile = class extends TAbstractFile {
  basename = "";
  extension = "";
};

// src/merge-widget.ts
var import_view = require("@codemirror/view");

// src/i18n/en.ts
var en = {
  // Settings
  settingsTitle: "NutEgg Settings",
  chromeCompanionName: "Chrome Extension Companion",
  chromeCompanionDesc: "Capture and analyze articles, YouTube videos, and tweets directly from your browser into Obsidian.",
  getChromeExtension: "Get Chrome Extension \u2197",
  reportBugName: "Report a Bug",
  reportBugDesc: "Found an issue, unexpected behavior, or need help? Report it on GitHub issues.",
  reportBugBtn: "\u{1F41B} Report Bug on GitHub \u2197",
  vaultPathsHeader: "Vault Paths",
  rawFolder: "Raw Content Folder",
  rawFolderDesc: "Folder for saved raw content",
  indexFile: "Index File",
  indexFileDesc: "File that maps eggs to their markdown files",
  workflowFolder: "Workflow Engine Folder",
  workflowFolderDesc: "Folder where AI prompts, schemas, and pipeline rules are stored as editable markdown files",
  useDefaultWorkflows: "Use Default Workflow Prompts",
  useDefaultWorkflowsDesc: "Moves all current files in nutegg/_workflow to a timestamped backup folder under _backup/ and restores clean built-in prompt defaults.",
  useDefaultsBtn: "Use Defaults",
  devMode: "Developer mode",
  devModeOn: "Advanced settings are visible below",
  devModeOff: "Show advanced settings (AI provider, API key, server port)",
  aiModelConfig: "AI Model Configuration",
  localModelConfig: "Local LLM Configuration",
  aiProvider: "1. AI Provider",
  aiProviderDesc: "Choose a local runner (Ollama, LM Studio), OpenRouter, or cloud AI provider",
  localApiType: "API Type",
  localApiTypeDesc: "Protocol format used by your local runner",
  localEndpoint: "Local Server Endpoint",
  localEndpointOllamaDesc: "Ollama native chat URL (default: http://127.0.0.1:11434/api/chat)",
  localEndpointOpenAiDesc: "OpenAI-compatible chat completions URL for your local runner",
  localPresets: "Presets: ",
  localApiKeyDesc: "Optional for local LLMs. Leave empty if your local server does not require authentication.",
  aiModelFamily: "2. Model Family",
  aiModelFamilyDesc: "Choose model vendor or architecture group on OpenRouter",
  modelVersion: "3. Model Version",
  modelVersionDesc: 'Sent to OpenRouter as "{model}"',
  aiModel: "2. Model",
  aiModelDesc: "Model to use for analysis ({provider})",
  customModel: "Custom Model Name",
  customModelDesc: "Enter the model ID (e.g., mistralai/mistral-large)",
  aiApiKey: "API Key",
  openRouterApiKeyDesc: "Your OpenRouter API key (openrouter.ai/keys)",
  providerApiKeyDesc: "Your {provider} API key",
  creditStatusTitleLocal: "Local LLM connection status",
  creditStatusTitleCloud: "AI credit & balance",
  creditCheckingLocal: "Checking local server connection...",
  creditCheckingCloud: "Checking credit balance with provider...",
  refresh: "Refresh",
  checking: "Checking...",
  remainingBalance: "\u{1F4B0} Remaining Balance: {balance} ({status})",
  providerStatus: "\u2139\uFE0F Provider: {provider} \u2014 {status}",
  creditCheckFailed: "\u26A0\uFE0F Failed to check credit: {error}",
  processingHeader: "Processing & Chunking",
  chunkWindowChars: "General chunk window size",
  chunkWindowCharsDesc: "Maximum character length per chunk (~30,000 chars \u2248 8,000 tokens). Long content exceeding this threshold is split into parts and processed with multi-stage map-reduce aggregation.",
  sectionGridSeconds: "Section grid interval",
  sectionGridSecondsDesc: "Time interval in seconds (default: 300s / 5 minutes) used to generate section lattice points and chapter maps for videos lacking native chapter markers.",
  maxTokens: "Max completion tokens",
  maxTokensDesc: "Maximum completion tokens allocated for AI calls (default: 16384). Cloud models (DeepSeek, OpenAI, Anthropic) support large output windows. Local LLM users can adjust this to match their model's context window.",
  serverHeader: "Server",
  serverPort: "Server Port",
  serverPortDesc: "Port for the local HTTP server connecting with Chrome Extension (requires restart)",
  linksHeader: "Links & Resources",
  nuteggChromeStoreName: "NutEgg on Chrome Web Store",
  nuteggChromeStoreDesc: "Install or update the NutEgg companion extension for Google Chrome.",
  openChromeWebStore: "Open Chrome Web Store \u2197",
  nuteggObsidianPluginName: "NutEgg on Obsidian Community Plugins",
  nuteggObsidianPluginDesc: "View NutEgg in the Obsidian Community Plugins directory.",
  openObsidianDirectory: "Open Obsidian Directory \u2197",
  // Commands & Ribbons
  cmdNewEgg: "Create a new egg file",
  cmdOpenIndex: "Open index file",
  cmdMergeCurrent: "Merge unprocessed entries in current egg",
  cmdCheckCredit: "Check AI provider credit & balance",
  cmdUseDefaultWorkflowPrompts: "Use default workflow prompts (backup existing)",
  cmdReportBug: "Report a bug on GitHub",
  ribbonOpenIndex: "NutEgg: Open Index",
  ribbonCheckCredit: "NutEgg: Check AI Credit & Balance",
  // Notices
  serverStarted: "NutEgg server started on port {port}",
  serverFailed: "NutEgg: Failed to start server. Check console for details.",
  indexNotFound: "NutEgg: {path} not found. Click the egg icon to create it.",
  noActiveFile: "NutEgg: No active file",
  notEggNote: "NutEgg: Active file is not an egg note",
  mergingEntries: "NutEgg: Merging unprocessed entries in {name}...",
  mergedEntries: "[NutEgg] Merged {count} entries into knowledge tree",
  noUnprocessed: "[NutEgg] No unprocessed entries to merge or merge failed.",
  mergeFailed: "[NutEgg] Merge failed: {error}",
  workflowReset: "[NutEgg] Reset workflow files to defaults. Previous files moved to {folder}",
  eggNameRequired: "NutEgg: Please enter a valid egg name.",
  eggAlreadyExists: "NutEgg: {path} already exists.",
  eggCreated: "NutEgg: Created {path}",
  indexSynced: "[NutEgg] Index synced: {summary}",
  indexAllSynced: "[NutEgg] Everything is in sync.",
  indexSyncFailed: "[NutEgg] Sync failed: {error}",
  // Modals & Widgets
  createEggTitle: "\u{1F423} Create New Egg",
  eggNameLabel: "Egg Name (file name):",
  eggNamePlaceholder: "e.g. methodology, invest_strategy...",
  eggDescLabel: "Description (scope of what it covers):",
  eggDescPlaceholder: "e.g. practical methods and tactics...",
  eggLangHint: "\u{1F310} Language of instructions and knowledge output will match the description language.",
  cancel: "Cancel",
  createEgg: "Create Egg",
  creatingEgg: "\u23F3 Creating egg...",
  mergeUnprocessed: "Merge Unprocessed Note",
  mergeUnprocessedPlural: "Merge {count} Unprocessed Notes",
  merging: "Merging...",
  mergeButtonText: "\u26A1 Merge into Knowledge Tree",
  mergingWithAi: "\u23F3 Merging with AI...",
  mergedSuccess: "\u2705 Merged!",
  treeUpToDate: "\u2705 Knowledge tree is up to date",
  unprocessedEntries: "\u{1F95A} {count} unprocessed {entries}",
  entrySingle: "entry",
  entryPlural: "entries",
  mergeNoChanges: "[NutEgg] Merge returned no changes or failed. Check console.",
  syncIndex: "Sync Index",
  syncingIndex: "Syncing...",
  newEggButton: "+ New Egg",
  unprocessedBadge: "{count} unprocessed"
};

// src/i18n/zh.ts
var zh = {
  // Settings
  settingsTitle: "NutEgg \u8BBE\u7F6E",
  chromeCompanionName: "Chrome \u6269\u5C55\u914D\u5957",
  chromeCompanionDesc: "\u4ECE\u6D4F\u89C8\u5668\u76F4\u63A5\u63D0\u53D6\u5E76\u5206\u6790\u6587\u7AE0\u3001YouTube \u89C6\u9891\u4E0E\u63A8\u6587\uFF0C\u7ED3\u6784\u5316\u5B58\u5165 Obsidian\u3002",
  getChromeExtension: "\u83B7\u53D6 Chrome \u6269\u5C55 \u2197",
  reportBugName: "\u53CD\u9988\u95EE\u9898",
  reportBugDesc: "\u9047\u5230\u5F02\u5E38\u3001\u95EE\u9898\u6216\u9700\u8981\u5E2E\u52A9\uFF1F\u6B22\u8FCE\u5728 GitHub \u63D0\u4EA4\u53CD\u9988\u3002",
  reportBugBtn: "\u{1F41B} \u5728 GitHub \u63D0\u4EA4\u53CD\u9988 \u2197",
  vaultPathsHeader: "\u5E93\u8DEF\u5F84\u8BBE\u7F6E",
  rawFolder: "\u539F\u59CB\u7D20\u6750\u76EE\u5F55",
  rawFolderDesc: "\u5B58\u653E\u63D0\u53D6\u7684\u539F\u59CB\u7F51\u9875\u4E0E\u97F3\u89C6\u9891\u6587\u7A3F\u76EE\u5F55",
  indexFile: "Egg \u7D22\u5F15\u6587\u4EF6",
  indexFileDesc: "\u8BB0\u5F55\u6240\u6709 Egg \u4E0E\u5BF9\u5E94\u7B14\u8BB0\u8DEF\u5F84\u7684\u7D22\u5F15\u6587\u4EF6",
  workflowFolder: "\u5DE5\u4F5C\u6D41\u5F15\u64CE\u76EE\u5F55",
  workflowFolderDesc: "\u5B58\u653E\u53EF\u7F16\u8F91\u7684 AI \u63D0\u793A\u8BCD\u3001Schema \u4E0E\u7BA1\u7EBF\u89C4\u5219 markdown \u6587\u4EF6\u7684\u76EE\u5F55",
  useDefaultWorkflows: "\u6062\u590D\u9ED8\u8BA4\u5DE5\u4F5C\u6D41\u63D0\u793A\u8BCD",
  useDefaultWorkflowsDesc: "\u5C06\u5F53\u524D nutegg/_workflow \u76EE\u5F55\u4E0B\u7684\u6587\u4EF6\u79FB\u5165\u5E26\u6709\u65F6\u95F4\u6233\u7684 _backup/ \u5907\u4EFD\u76EE\u5F55\uFF0C\u5E76\u6062\u590D\u5185\u7F6E\u7684\u63D0\u793A\u8BCD\u9ED8\u8BA4\u503C\u3002",
  useDefaultsBtn: "\u6062\u590D\u9ED8\u8BA4",
  devMode: "\u5F00\u53D1\u8005\u6A21\u5F0F",
  devModeOn: "\u5DF2\u663E\u793A\u4E0B\u65B9\u7684\u9AD8\u7EA7\u914D\u7F6E\u9879",
  devModeOff: "\u663E\u793A\u9AD8\u7EA7\u8BBE\u7F6E\uFF08AI \u4F9B\u5E94\u5546\u3001API Key\u3001\u672C\u5730\u7AEF\u53E3\u7B49\uFF09",
  aiModelConfig: "AI \u6A21\u578B\u8BBE\u7F6E",
  localModelConfig: "\u672C\u5730\u6A21\u578B\u8BBE\u7F6E",
  aiProvider: "1. AI \u4F9B\u5E94\u5546",
  aiProviderDesc: "\u9009\u62E9\u672C\u5730\u6A21\u578B\uFF08Ollama\u3001LM Studio\uFF09\u3001OpenRouter \u6216\u4E91\u7AEF\u6A21\u578B",
  localApiType: "API \u7C7B\u578B",
  localApiTypeDesc: "\u672C\u5730\u8FD0\u884C\u73AF\u5883\u4F7F\u7528\u7684\u534F\u8BAE\u683C\u5F0F",
  localEndpoint: "\u672C\u5730\u670D\u52A1\u5730\u5740",
  localEndpointOllamaDesc: "Ollama \u539F\u751F\u5BF9\u8BDD\u5730\u5740\uFF08\u9ED8\u8BA4\uFF1Ahttp://127.0.0.1:11434/api/chat\uFF09",
  localEndpointOpenAiDesc: "\u672C\u5730\u517C\u5BB9 OpenAI \u683C\u5F0F\u7684 chat completions \u63A5\u53E3\u5730\u5740",
  localPresets: "\u5FEB\u901F\u9884\u8BBE\uFF1A ",
  localApiKeyDesc: "\u672C\u5730\u6A21\u578B\u53EF\u9009\u3002\u82E5\u672C\u5730\u6A21\u578B\u670D\u52A1\u4E0D\u9700\u8981\u8EAB\u4EFD\u9A8C\u8BC1\uFF0C\u8BF7\u7559\u7A7A\u3002",
  aiModelFamily: "2. \u6A21\u578B\u5BB6\u65CF",
  aiModelFamilyDesc: "\u9009\u62E9 OpenRouter \u4E0A\u53EF\u7528\u7684 AI \u5382\u5546\u6216\u6A21\u578B\u7C7B\u522B",
  modelVersion: "3. \u6A21\u578B\u7248\u672C",
  modelVersionDesc: '\u8BF7\u6C42\u5C06\u4EE5 "{model}" \u53D1\u9001\u7ED9 OpenRouter',
  aiModel: "2. \u6A21\u578B",
  aiModelDesc: "\u7528\u4E8E\u5206\u6790\u7684\u6A21\u578B\uFF08{provider}\uFF09",
  customModel: "\u81EA\u5B9A\u4E49\u6A21\u578B\u540D\u79F0",
  customModelDesc: "\u8F93\u5165\u6A21\u578B ID\uFF08\u4F8B\u5982\uFF1Amistralai/mistral-large\uFF09",
  aiApiKey: "API Key",
  openRouterApiKeyDesc: "\u60A8\u7684 OpenRouter API Key\uFF08openrouter.ai/keys\uFF09",
  providerApiKeyDesc: "\u60A8\u7684 {provider} API Key",
  creditStatusTitleLocal: "\u672C\u5730\u5927\u6A21\u578B\u8FDE\u63A5\u72B6\u6001",
  creditStatusTitleCloud: "AI \u989D\u5EA6\u4E0E\u4F59\u989D",
  creditCheckingLocal: "\u6B63\u5728\u68C0\u67E5\u672C\u5730\u670D\u52A1\u8FDE\u63A5...",
  creditCheckingCloud: "\u6B63\u5728\u5411\u4F9B\u5E94\u5546\u67E5\u8BE2\u989D\u5EA6\u4E0E\u4F59\u989D...",
  refresh: "\u5237\u65B0",
  checking: "\u67E5\u8BE2\u4E2D...",
  remainingBalance: "\u{1F4B0} \u5269\u4F59\u4F59\u989D\uFF1A{balance}\uFF08{status}\uFF09",
  providerStatus: "\u2139\uFE0F \u4F9B\u5E94\u5546\uFF1A{provider} \u2014 {status}",
  creditCheckFailed: "\u26A0\uFE0F \u67E5\u8BE2\u5931\u8D25\uFF1A{error}",
  processingHeader: "\u5904\u7406\u4E0E\u6587\u672C\u5207\u5206",
  chunkWindowChars: "\u5206\u5757\u7A97\u53E3\u5927\u5C0F",
  chunkWindowCharsDesc: "\u8D85\u957F\u5185\u5BB9\u5207\u5206\u5B57\u7B26\u5927\u5C0F\uFF08~30,000 \u5B57\u7B26 \u2248 8,000 tokens\uFF09\u3002\u8D85\u51FA\u6B64\u9608\u503C\u7684\u5185\u5BB9\u5C06\u5206\u5757\u5904\u7406\u5E76\u901A\u8FC7 Map-Reduce \u805A\u5408\u3002",
  sectionGridSeconds: "\u89C6\u9891\u65F6\u95F4\u7F51\u683C\u95F4\u9694",
  sectionGridSecondsDesc: "\u65E0\u7AE0\u8282\u6807\u8BB0\u89C6\u9891\u7684\u65F6\u95F4\u5206\u6BB5\u79D2\u6570\uFF08\u9ED8\u8BA4\uFF1A300 \u79D2 / 5 \u5206\u949F\uFF09\uFF0C\u7528\u4E8E\u751F\u6210\u7F51\u683C\u70B9\u4E0E\u7AE0\u8282\u8109\u7EDC\u3002",
  maxTokens: "\u6700\u5927\u751F\u6210 Token \u6570",
  maxTokensDesc: "AI \u8C03\u7528\u5206\u914D\u7684\u6700\u5927\u8F93\u51FA Token \u6570\uFF08\u9ED8\u8BA4\uFF1A16384\uFF09\u3002\u4E91\u7AEF\u5927\u6A21\u578B\u652F\u6301\u5927\u7A97\u53E3\uFF0C\u672C\u5730\u6A21\u578B\u53EF\u6839\u636E\u4E0A\u4E0B\u6587\u7A97\u53E3\u8C03\u6574\u3002",
  serverHeader: "\u672C\u5730\u670D\u52A1",
  serverPort: "\u672C\u5730\u670D\u52A1\u7AEF\u53E3",
  serverPortDesc: "\u7528\u4E8E\u4E0E Chrome \u6269\u5C55\u901A\u4FE1\u7684\u672C\u5730 HTTP \u670D\u52A1\u7AEF\u53E3\uFF08\u4FEE\u6539\u540E\u9700\u91CD\u542F\uFF09",
  linksHeader: "\u76F8\u5173\u94FE\u63A5\u4E0E\u8D44\u6E90",
  nuteggChromeStoreName: "NutEgg Chrome \u6269\u5C55",
  nuteggChromeStoreDesc: "\u5B89\u88C5\u6216\u66F4\u65B0\u9002\u7528\u4E8E Google Chrome \u7684 NutEgg \u4F34\u968F\u6269\u5C55\u3002",
  openChromeWebStore: "\u8BBF\u95EE Chrome \u5E94\u7528\u5546\u5E97 \u2197",
  nuteggObsidianPluginName: "NutEgg Obsidian \u793E\u533A\u63D2\u4EF6",
  nuteggObsidianPluginDesc: "\u5728 Obsidian \u793E\u533A\u63D2\u4EF6\u5E02\u573A\u67E5\u770B NutEgg\u3002",
  openObsidianDirectory: "\u8BBF\u95EE Obsidian \u793E\u533A\u63D2\u4EF6\u76EE\u5F55 \u2197",
  // Commands & Ribbons
  cmdNewEgg: "\u521B\u5EFA\u65B0\u7684 Egg \u7B14\u8BB0",
  cmdOpenIndex: "\u6253\u5F00\u7D22\u5F15\u6587\u4EF6",
  cmdMergeCurrent: "\u5408\u5E76\u5F53\u524D Egg \u4E2D\u7684\u672A\u5904\u7406\u6761\u76EE",
  cmdCheckCredit: "\u67E5\u8BE2 AI \u4F9B\u5E94\u5546\u989D\u5EA6\u4E0E\u4F59\u989D",
  cmdUseDefaultWorkflowPrompts: "\u6062\u590D\u9ED8\u8BA4\u5DE5\u4F5C\u6D41\u63D0\u793A\u8BCD\uFF08\u5907\u4EFD\u73B0\u6709\u6587\u4EF6\uFF09",
  cmdReportBug: "\u5728 GitHub \u63D0\u4EA4\u53CD\u9988",
  ribbonOpenIndex: "NutEgg\uFF1A\u6253\u5F00\u7D22\u5F15",
  ribbonCheckCredit: "NutEgg\uFF1A\u67E5\u770B AI \u989D\u5EA6\u4E0E\u4F59\u989D",
  // Notices
  serverStarted: "NutEgg \u670D\u52A1\u5DF2\u5728\u7AEF\u53E3 {port} \u542F\u52A8",
  serverFailed: "NutEgg\uFF1A\u670D\u52A1\u542F\u52A8\u5931\u8D25\uFF0C\u8BF7\u67E5\u770B\u63A7\u5236\u53F0\u8BE6\u60C5\u3002",
  indexNotFound: "NutEgg\uFF1A\u672A\u627E\u5230 {path}\u3002\u70B9\u51FB Egg \u56FE\u6807\u4EE5\u521B\u5EFA\u3002",
  noActiveFile: "NutEgg\uFF1A\u5F53\u524D\u65E0\u6D3B\u52A8\u6587\u4EF6",
  notEggNote: "NutEgg\uFF1A\u5F53\u524D\u6D3B\u52A8\u6587\u4EF6\u4E0D\u662F Egg \u7B14\u8BB0",
  mergingEntries: "NutEgg\uFF1A\u6B63\u5728\u5408\u5E76 {name} \u4E2D\u7684\u672A\u5904\u7406\u6761\u76EE...",
  mergedEntries: "[NutEgg] \u5DF2\u5C06 {count} \u6761\u77E5\u8BC6\u5408\u5E76\u5165\u77E5\u8BC6\u5E93",
  noUnprocessed: "[NutEgg] \u6CA1\u6709\u5F85\u5408\u5E76\u7684\u672A\u5904\u7406\u6761\u76EE\uFF0C\u6216\u5408\u5E76\u5931\u8D25\u3002",
  mergeFailed: "[NutEgg] \u5408\u5E76\u5931\u8D25\uFF1A{error}",
  workflowReset: "[NutEgg] \u5DF2\u91CD\u7F6E\u5DE5\u4F5C\u6D41\u63D0\u793A\u8BCD\u4E3A\u9ED8\u8BA4\u503C\u3002\u539F\u6587\u4EF6\u5DF2\u5907\u4EFD\u81F3 {folder}",
  eggNameRequired: "NutEgg\uFF1A\u8BF7\u8F93\u5165\u6709\u6548\u7684 Egg \u540D\u79F0\u3002",
  eggAlreadyExists: "NutEgg\uFF1A{path} \u5DF2\u5B58\u5728\u3002",
  eggCreated: "NutEgg\uFF1A\u5DF2\u6210\u529F\u521B\u5EFA {path}",
  indexSynced: "[NutEgg] \u7D22\u5F15\u5DF2\u540C\u6B65\uFF1A{summary}",
  indexAllSynced: "[NutEgg] \u7D22\u5F15\u5DF2\u662F\u6700\u65B0\u72B6\u6001\u3002",
  indexSyncFailed: "[NutEgg] \u7D22\u5F15\u540C\u6B65\u5931\u8D25\uFF1A{error}",
  // Modals & Widgets
  createEggTitle: "\u{1F423} \u521B\u5EFA\u65B0\u7684 Egg",
  eggNameLabel: "Egg \u540D\u79F0\uFF08\u6587\u4EF6\u540D\uFF09\uFF1A",
  eggNamePlaceholder: "\u4F8B\u5982\uFF1Amethodology, invest_strategy, \u65B9\u6CD5\u8BBA...",
  eggDescLabel: "\u63CF\u8FF0\uFF08\u77E5\u8BC6\u5E93\u8986\u76D6\u8303\u56F4\uFF09\uFF1A",
  eggDescPlaceholder: "\u4F8B\u5982\uFF1A\u4ECB\u7ECD\u505A\u4E8B\u7684\u5177\u4F53\u65B9\u6CD5\u4E0E\u5B9E\u8DF5\u7B56\u7565...",
  eggLangHint: "\u{1F310} \u63D0\u793A\u8BCD\u4E0E\u751F\u6210\u7684\u77E5\u8BC6\u5361\u7247\u8F93\u51FA\u8BED\u8A00\u5C06\u8DDF\u968F\u8BE5\u63CF\u8FF0\u8BED\u8A00\u3002",
  cancel: "\u53D6\u6D88",
  createEgg: "\u521B\u5EFA Egg",
  creatingEgg: "\u23F3 \u6B63\u5728\u521B\u5EFA Egg...",
  mergeUnprocessed: "\u5408\u5E76\u672A\u5904\u7406\u7B14\u8BB0",
  mergeUnprocessedPlural: "\u5408\u5E76 {count} \u7BC7\u672A\u5904\u7406\u7B14\u8BB0",
  merging: "\u6B63\u5728\u5408\u5E76...",
  mergeButtonText: "\u26A1 \u5408\u5E76\u5165\u77E5\u8BC6\u5E93",
  mergingWithAi: "\u23F3 AI \u6B63\u5728\u5408\u5E76...",
  mergedSuccess: "\u2705 \u5DF2\u5408\u5E76\uFF01",
  treeUpToDate: "\u2705 \u77E5\u8BC6\u5E93\u5DF2\u662F\u6700\u65B0\u72B6\u6001",
  unprocessedEntries: "\u{1F95A} {count} \u6761\u672A\u5904\u7406\u5185\u5BB9",
  entrySingle: "\u6761\u76EE",
  entryPlural: "\u6761\u76EE",
  mergeNoChanges: "[NutEgg] \u5408\u5E76\u672A\u4EA7\u751F\u66F4\u6539\u6216\u5931\u8D25\uFF0C\u8BF7\u67E5\u770B\u63A7\u5236\u53F0\u3002",
  syncIndex: "\u540C\u6B65\u7D22\u5F15",
  syncingIndex: "\u6B63\u5728\u540C\u6B65...",
  newEggButton: "+ \u65B0\u5EFA Egg",
  unprocessedBadge: "{count} \u4E2A\u672A\u5904\u7406"
};

// src/i18n/index.ts
var translations = {
  en,
  zh
};
function getLanguage() {
  try {
    const lang = (window?.localStorage?.getItem("language") || navigator?.language || "en").toLowerCase();
    if (lang.startsWith("zh")) {
      return "zh";
    }
  } catch {
  }
  return "en";
}
function t(key, params) {
  const lang = getLanguage();
  const dict = translations[lang] || translations.en;
  let str = dict[key] || translations.en[key] || key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return str;
}

// src/merge-widget.ts
function findInstructionTargetLine(docText) {
  const lines = docText.split("\n");
  const calloutStart = lines.findIndex(
    (l) => /^>\s*\[!\w+\]-?\s*(?:instructions?|scope)?/i.test(l.trim())
  );
  if (calloutStart !== -1) {
    let calloutEnd = calloutStart;
    for (let i = calloutStart + 1; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed.startsWith(">")) {
        calloutEnd = i;
      } else if (trimmed === "") {
        let moreCallout = false;
        for (let j = i + 1; j < Math.min(lines.length, i + 10); j++) {
          const nextTrimmed = lines[j].trim();
          if (nextTrimmed === "")
            continue;
          if (nextTrimmed.startsWith(">"))
            moreCallout = true;
          break;
        }
        if (moreCallout)
          continue;
        break;
      } else {
        break;
      }
    }
    return calloutEnd + 1;
  }
  const headingIdx = lines.findIndex(
    (l) => /^#+\s*instructions?\s*:?$/i.test(l.trim())
  );
  if (headingIdx !== -1) {
    return headingIdx + 1;
  }
  const unprocIdx = lines.findIndex((l) => /^#\s*Unprocessed\s*$/i.test(l.trim()));
  if (unprocIdx !== -1) {
    return unprocIdx + 1;
  }
  return null;
}
async function runMerge(plugin, filePath, currentDoc) {
  if (currentDoc !== null) {
    const file = plugin.app.vault.getAbstractFileByPath(filePath);
    if (file) {
      const disk = await plugin.app.vault.read(file);
      if (disk !== currentDoc) {
        await plugin.app.vault.modify(file, currentDoc);
        console.log(`[NutEgg] Saved unsaved edits in ${filePath} before merge`);
      }
    }
  }
  return plugin.aiProcessor.mergeEgg(filePath);
}
function appendCreditPill(plugin, targetBadge) {
  if (typeof plugin.aiClient?.checkCredit !== "function")
    return;
  const creditPill = document.createElement("span");
  creditPill.className = "nutegg-merge-credit";
  creditPill.style.opacity = "0.75";
  creditPill.style.marginLeft = "8px";
  creditPill.style.fontSize = "0.85em";
  plugin.aiClient.checkCredit(plugin.settings).then((credit) => {
    if (credit.hasBalance && credit.balanceFormatted) {
      creditPill.textContent = `\u2022 \u{1FA99} ${credit.providerLabel}: ${credit.balanceFormatted}`;
      creditPill.title = `NutEgg AI: ${credit.statusText}`;
      targetBadge.appendChild(creditPill);
    } else if (credit.providerLabel) {
      const label = plugin.settings.aiProvider === "openrouter" ? "OpenRouter" : credit.providerLabel;
      creditPill.textContent = `\u2022 \u{1FA99} ${label}`;
      creditPill.title = `NutEgg AI: ${credit.statusText}`;
      targetBadge.appendChild(creditPill);
    }
  }).catch(() => {
  });
}
var MergeButtonWidget = class extends import_view.WidgetType {
  constructor(plugin, view, filePath, count) {
    super();
    this.plugin = plugin;
    this.view = view;
    this.filePath = filePath;
    this.count = count;
  }
  toDOM() {
    const wrap = document.createElement("div");
    wrap.className = "nutegg-merge-container nutegg-merge-editor-widget";
    const badge = document.createElement("div");
    badge.className = "nutegg-merge-badge";
    badge.textContent = this.count > 0 ? t("unprocessedEntries", {
      count: this.count,
      entries: this.count === 1 ? t("entrySingle") : t("entryPlural")
    }) : t("treeUpToDate");
    appendCreditPill(this.plugin, badge);
    wrap.appendChild(badge);
    if (this.count > 0) {
      const button = document.createElement("button");
      button.className = "nutegg-merge-btn mod-cta";
      button.textContent = t("mergeButtonText");
      button.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (button.disabled)
          return;
        button.disabled = true;
        const originalText = button.textContent;
        button.textContent = t("merging");
        try {
          const result = await runMerge(
            this.plugin,
            this.filePath,
            this.view.state.doc.toString()
          );
          if (result && result.entries > 0) {
            new Notice(t("mergedEntries", { count: result.entries }));
          } else {
            new Notice(t("mergeNoChanges"));
            button.disabled = false;
            button.textContent = originalText;
          }
        } catch (err) {
          console.error("[NutEgg] Editor merge failed:", err);
          new Notice(t("mergeFailed", { error: err instanceof Error ? err.message : String(err) }));
          button.disabled = false;
          button.textContent = originalText;
        }
      });
      wrap.appendChild(button);
    }
    return wrap;
  }
};
var EggMergeEditorPlugin = class {
  constructor(plugin, view) {
    this.plugin = plugin;
    this.view = view;
    this.decorations = this.build();
  }
  decorations;
  /** Last built state — logged once per transition, not per keystroke. */
  lastState = "";
  update(update) {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = this.build();
    }
  }
  /** The vault path of the file rendered by this editor view. */
  filePath() {
    for (const leaf of this.plugin.app.workspace.getLeavesOfType("markdown")) {
      if (leaf.view?.editor?.cm === this.view) {
        return leaf.view.file?.path || "";
      }
    }
    return this.plugin.app.workspace.getActiveFile()?.path || "";
  }
  build() {
    const docText = this.view.state.doc.toString();
    const lineNo = findInstructionTargetLine(docText);
    if (lineNo === null) {
      return this.logState("no-target", import_view.Decoration.none);
    }
    const egg = this.plugin.eggParser.parseEggFile(this.filePath(), docText);
    const count = this.plugin.eggParser.countUnprocessed(egg);
    const state = count === 0 ? "up-to-date" : `count-${count}`;
    const line = this.view.state.doc.line(lineNo);
    return this.logState(
      state,
      import_view.Decoration.set([
        import_view.Decoration.widget({
          widget: new MergeButtonWidget(this.plugin, this.view, this.filePath(), count),
          // CM block widgets can't come from plugins — an inline decoration
          // whose DOM displays as a block is the portable equivalent (the
          // CSS gives it width:100% so it sits on its own line).
          side: 1
        }).range(line.to)
      ])
    );
  }
  logState(state, decorations) {
    if (state !== this.lastState) {
      this.lastState = state;
      const detail = state === "no-target" ? "no instruction block or heading in this file" : state === "up-to-date" ? "0 entries \u2014 showing up-to-date badge" : `${state.replace("count-", "")} entries \u2014 showing merge button`;
      console.log(`[NutEgg] Editor merge widget (${this.filePath() || "?"}): ${detail}`);
    }
    return decorations;
  }
};
function mergeEditorExtension(plugin) {
  return import_view.ViewPlugin.fromClass(
    class extends EggMergeEditorPlugin {
      constructor(view) {
        super(plugin, view);
      }
    },
    // Required: fromClass only wires decorations into the editor when the
    // spec declares them — an instance `decorations` field alone is ignored.
    { decorations: (v) => v.decorations }
  );
}

// tests/helpers.ts
function makeFakeVault(initial = {}) {
  const files = new Map(Object.entries(initial));
  const basePath = "/fake/vault";
  const listeners = /* @__PURE__ */ new Map();
  const toTFile = (p) => Object.assign(new TFile(), {
    path: p,
    name: p.split("/").pop() || "",
    basename: (p.split("/").pop() || "").replace(/\.[^/.]+$/, ""),
    extension: p.split(".").pop() || ""
  });
  const adapter = {
    exists: async (p) => files.has(p) || [...files.keys()].some((k) => k.startsWith(p + "/")),
    read: async (p) => {
      if (!files.has(p))
        throw new Error("File not found: " + p);
      return files.get(p);
    },
    remove: async (p) => {
      files.delete(p);
    },
    append: async (p, data) => {
      files.set(p, (files.get(p) ?? "") + data);
    },
    getBasePath: () => basePath
  };
  const vault = {
    adapter,
    listeners,
    on: (event, callback) => {
      if (!listeners.has(event))
        listeners.set(event, []);
      listeners.get(event).push(callback);
    },
    trigger: (event, file) => {
      for (const cb of listeners.get(event) || []) {
        cb(file);
      }
    },
    create: async (p, content) => {
      files.set(p, content);
      vault.trigger("create", toTFile(p));
    },
    createFolder: async (_p) => {
    },
    modify: async (file, content) => {
      files.set(file.path, content);
      vault.trigger("modify", toTFile(file.path));
    },
    read: async (file) => {
      if (!files.has(file.path))
        throw new Error("File not found: " + file.path);
      return files.get(file.path);
    },
    delete: async (file) => {
      files.delete(file.path);
      vault.trigger("delete", toTFile(file.path));
    },
    getAbstractFileByPath: (p) => files.has(p) ? toTFile(p) : null,
    getFiles: () => [...files.keys()].map((p) => toTFile(p)),
    getMarkdownFiles: () => [...files.keys()].filter((k) => k.endsWith(".md")).map((p) => toTFile(p))
  };
  return { files, basePath, vault };
}
function makeFakePlugin(overrides = {}) {
  const { vault } = makeFakeVault(overrides.vaultFiles || {});
  return {
    manifest: overrides.manifest ?? { version: "0.1.0" },
    settings: {
      aiApiKey: "test-key",
      rawFolder: "nutegg/_raw",
      indexFile: "nutegg/_index.md",
      serverPort: 27123,
      chunkWindowChars: 3e4,
      sectionGridSeconds: 300,
      ...overrides.settings || {}
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
        statusText: "$8.45 left"
      })
    },
    eggParser: overrides.eggParser ?? {
      formatEggForPrompt: (e) => `egg:${e.fileName}`,
      formatEggInstructionsForPrompt: (e) => `instructions:${e.fileName}`,
      formatEggKnowledgeForPrompt: (e) => `knowledge:${e.fileName}`
    },
    indexReader: overrides.indexReader ?? {
      getIndexContent: async () => "",
      parseIndexContent: () => []
    },
    knowledgeBase: overrides.knowledgeBase ?? {},
    workflowManager: overrides.workflowManager ?? {
      getPrompt: () => ""
    },
    db: overrides.db ?? null,
    ...overrides
  };
}

// ../shared/src/egg-format.ts
function formatEggInstructionsForPrompt(egg) {
  const parts = [];
  parts.push(`**Scope:** ${egg.scope || "(not specified)"}`);
  if (egg.keyQuestions && egg.keyQuestions.length > 0) {
    parts.push(
      `**Key Questions:**
${egg.keyQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`
    );
  }
  if (egg.rejectionCriteria && egg.rejectionCriteria.length > 0) {
    parts.push(
      `**Rejection Criteria:**
${egg.rejectionCriteria.map((c) => `- ${c}`).join("\n")}`
    );
  }
  if (egg.formattingRules) {
    parts.push(`**Formatting Rules:**
${egg.formattingRules}`);
  }
  return parts.join("\n\n");
}
function formatEggKnowledgeForPrompt(egg) {
  const parts = [];
  parts.push(`**Current Knowledge:**
${egg.knowledge || "(empty)"}`);
  if (egg.unprocessed && egg.unprocessed.trim()) {
    parts.push(`**Unprocessed (pending merge):**
${egg.unprocessed}`);
  }
  return parts.join("\n\n");
}
function formatEggForPrompt(egg) {
  return [
    formatEggInstructionsForPrompt(egg),
    formatEggKnowledgeForPrompt(egg)
  ].join("\n\n");
}
function countUnprocessed(egg) {
  const indentOf = (l) => (l.match(/^\s*/) || [""])[0].length;
  const bullets = (egg.unprocessed || "").split("\n").map((l) => l.replace(/\s+$/, "")).filter((l) => /^\s*[-*]\s/.test(l));
  if (bullets.length === 0)
    return 0;
  const base = Math.min(...bullets.map(indentOf));
  return bullets.filter((l) => indentOf(l) === base).length;
}

// ../shared/src/egg-parser.ts
var KNOWLEDGE_HEADING = "# Knowledge";
var UNPROCESSED_HEADING = "# Unprocessed";
function isEggPath(path, vaultFolder = "nutegg") {
  if (!path || typeof path !== "string")
    return false;
  const normalized = path.replace(/\\/g, "/").replace(/^\/+/, "");
  const folder = (vaultFolder || "").replace(/^\/+|\/+$/g, "");
  if (folder) {
    if (!normalized.startsWith(folder + "/"))
      return false;
    const rel = normalized.slice(folder.length + 1);
    if (rel.includes("/"))
      return false;
    if (rel.startsWith("_") || !rel.toLowerCase().endsWith(".md"))
      return false;
    return true;
  } else {
    if (normalized.includes("/"))
      return false;
    if (normalized.startsWith("_") || !normalized.toLowerCase().endsWith(".md"))
      return false;
    return true;
  }
}
function parseEggFile(fileName, content) {
  const result = {
    fileName,
    topic: "Unknown",
    language: "",
    scope: "",
    actionGuide: "",
    keyQuestions: [],
    rejectionCriteria: [],
    formattingRules: "",
    knowledge: "",
    unprocessed: "",
    indexDescription: ""
  };
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (fmMatch) {
    for (const line of fmMatch[1].split(/\r?\n/)) {
      const kv = line.match(/^(\w+):\s*(.*)$/);
      if (!kv)
        continue;
      const key = kv[1].toLowerCase();
      const value = kv[2].trim().replace(/^"(.*)"$/, "$1");
      if (key === "topic")
        result.topic = value;
      if (key === "language")
        result.language = value;
    }
  }
  const callout = extractCallout(content);
  const sections = callout ? splitLabeledSections(callout) : /* @__PURE__ */ new Map();
  result.scope = (sections.get("scope") || "").trim();
  result.actionGuide = (sections.get("action guide") || "").trim();
  result.keyQuestions = parseListItems(sections.get("key questions") || "");
  result.rejectionCriteria = parseListItems(sections.get("rejection criteria") || "");
  result.formattingRules = (sections.get("formatting rules") || "").trim();
  const lines = content.split(/\r?\n/);
  const knowledgeSection = findSection(lines, "knowledge");
  if (knowledgeSection) {
    result.knowledge = sectionBody(lines, knowledgeSection, "knowledge");
  }
  const unprocessedSection = findSection(lines, "unprocessed");
  if (unprocessedSection) {
    result.unprocessed = sectionBody(lines, unprocessedSection, "unprocessed");
  }
  return result;
}
function findSection(lines, name) {
  const wanted = name.toLowerCase();
  const start = lines.findIndex((l) => headingName(l) === wanted);
  if (start === -1)
    return null;
  let end = -1;
  if (wanted === "knowledge") {
    end = lines.findIndex(
      (l, i) => i > start && headingName(l) === "unprocessed"
    );
  }
  if (end === -1) {
    end = lines.findIndex((l, i) => {
      if (i <= start)
        return false;
      const head = headingName(l);
      return head !== null && head !== wanted;
    });
  }
  return { start, end: end === -1 ? lines.length : end };
}
function headingName(line) {
  const m = line.trim().match(/^#\s+(.+?)\s*#*\s*$/);
  if (!m)
    return null;
  return m[1].trim().toLowerCase();
}
function sectionBody(lines, section, name) {
  const body = lines.slice(section.start + 1, section.end);
  while (body.length > 0 && (body[0].trim() === "" || headingName(body[0]) === name.toLowerCase())) {
    body.shift();
  }
  return body.join("\n").replace(/\n+$/g, "");
}
function stripSectionHeading(body, name) {
  const lines = body.split("\n");
  const wanted = name.toLowerCase();
  while (lines.length > 0 && (lines[0].trim() === "" || headingName(lines[0]) === wanted)) {
    lines.shift();
  }
  return lines.join("\n").replace(/\s+$/g, "");
}
function extractCallout(content) {
  const calloutLines = [];
  for (const line of content.split("\n")) {
    if (line.startsWith(">")) {
      calloutLines.push(line.replace(/^>\s?/, ""));
    } else if (calloutLines.length > 0) {
      break;
    }
  }
  if (calloutLines.length === 0)
    return null;
  const marker = calloutLines.findIndex((l) => l.includes("[!abstract]"));
  const body = marker >= 0 ? calloutLines.slice(marker + 1) : calloutLines.slice(1);
  return body.join("\n");
}
function splitLabeledSections(text) {
  const map = /* @__PURE__ */ new Map();
  let current = null;
  let buffer = [];
  for (const line of text.split("\n")) {
    const labelMatch = line.match(/^\*\*([^*]+?):\*\*\s*(.*)$/);
    if (labelMatch) {
      if (current)
        map.set(current, buffer.join("\n"));
      current = labelMatch[1].toLowerCase();
      buffer = labelMatch[2] ? [labelMatch[2]] : [];
    } else {
      buffer.push(line);
    }
  }
  if (current)
    map.set(current, buffer.join("\n"));
  return map;
}
function parseListItems(text) {
  return text.split("\n").map((l) => l.trim()).filter((l) => /^(?:\d+[.)]|[-*])\s+/.test(l)).map((l) => l.replace(/^(?:\d+[.)]|[-*])\s+/, ""));
}

// src/egg-parser.ts
var EggParser = class {
  plugin;
  constructor(plugin) {
    this.plugin = plugin;
  }
  async readEgg(fileName, fallbackDescription) {
    let file = this.plugin.app.vault.getAbstractFileByPath(fileName);
    if (!file && !fileName.includes("/")) {
      const parentDir = this.plugin.settings.indexFile.replace(/\/[^/]+$/, "");
      file = this.plugin.app.vault.getAbstractFileByPath(`${parentDir}/${fileName}`);
    }
    if (!file) {
      const folder = this.plugin.vaultFolder || "nutegg";
      const allFiles = (this.plugin.app.vault.getMarkdownFiles?.() || []).filter(
        (f) => isEggPath(f.path, folder)
      );
      const base = fileName.split("/").pop().toLowerCase();
      const match = allFiles.find(
        (f) => f.path.split("/").pop().toLowerCase() === base
      );
      if (match)
        file = match;
    }
    if (!file) {
      console.warn(`[NutEgg] Egg file not found: ${fileName}`);
      return null;
    }
    const content = await this.plugin.app.vault.read(file);
    const parsed = this.parseEggFile(file.path || fileName, content);
    if (fallbackDescription && !parsed.indexDescription) {
      parsed.indexDescription = fallbackDescription;
    }
    return parsed;
  }
  async readEggs(entries) {
    const eggs = [];
    for (const entry of entries) {
      const egg = await this.readEgg(entry.fileName, entry.description);
      if (egg) {
        egg.indexDescription = entry.description;
        eggs.push(egg);
      }
    }
    return eggs;
  }
  parseEggFile(fileName, content) {
    return parseEggFile(fileName, content);
  }
  formatEggInstructionsForPrompt(egg) {
    return formatEggInstructionsForPrompt(egg);
  }
  formatEggKnowledgeForPrompt(egg) {
    return formatEggKnowledgeForPrompt(egg);
  }
  formatEggForPrompt = (egg) => {
    return formatEggForPrompt(egg);
  };
  countUnprocessed(egg) {
    return countUnprocessed(egg);
  }
  /**
   * Append one new knowledge entry to the egg's Unprocessed section.
   *
   * Entries land here first and are merged into the Knowledge tree later,
   * once 20+ accumulate (see ai-processor.maybeMergeEgg). Each entry keeps
   * its insight + examples (AI-generated `content`), plus mechanical
   * `_author` / `_source` lines for provenance.
   */
  async appendUnprocessed(fileName, content, author, sourceTitle, sourceUrl) {
    const file = this.plugin.app.vault.getAbstractFileByPath(fileName);
    if (!file) {
      console.warn(`[NutEgg] Cannot append \u2014 egg file not found: ${fileName}`);
      return;
    }
    const existing = await this.plugin.app.vault.read(file);
    const lines = existing.replace(/\n+$/, "").split("\n");
    const section = findSection(lines, "unprocessed");
    const trimmed = content.trim();
    const withBullet = /^[-*]\s/.test(trimmed) ? trimmed : `- ${trimmed}`;
    const meta = [];
    if (author)
      meta.push(`_author: ${author}_`);
    const safeTitle = sourceTitle.replace(/[[\]]/g, "");
    meta.push(`_source: [${safeTitle || "source"}](${sourceUrl})_`);
    const block = [withBullet, ...meta].join("\n");
    if (section) {
      lines.splice(section.end, 0, "", block);
    } else {
      lines.push("", UNPROCESSED_HEADING, "", block);
    }
    await this.plugin.app.vault.modify(file, lines.join("\n") + "\n");
    console.log(`[NutEgg] Added unprocessed entry to ${fileName}`);
  }
  /**
   * Replace the Knowledge and Unprocessed sections with the merged output
   * from the merge AI call. Missing sections are created as needed.
   */
  async applyMerge(fileName, knowledge, unprocessed) {
    const file = this.plugin.app.vault.getAbstractFileByPath(fileName);
    if (!file) {
      console.warn(`[NutEgg] Cannot merge \u2014 egg file not found: ${fileName}`);
      return;
    }
    knowledge = stripSectionHeading(knowledge, "knowledge");
    unprocessed = stripSectionHeading(unprocessed, "unprocessed");
    const kLines = knowledge.split("\n");
    const uIdx = kLines.findIndex((l) => headingName(l) === "unprocessed");
    if (uIdx !== -1) {
      const rest = stripSectionHeading(
        kLines.slice(uIdx).join("\n"),
        "unprocessed"
      );
      knowledge = kLines.slice(0, uIdx).join("\n").replace(/\s+$/g, "");
      if (!unprocessed)
        unprocessed = rest;
    }
    const existing = await this.plugin.app.vault.read(file);
    let lines = existing.replace(/\n+$/, "").split("\n");
    const knowledgeSection = findSection(lines, "knowledge");
    if (knowledgeSection) {
      lines = [
        ...lines.slice(0, knowledgeSection.start + 1),
        "",
        ...knowledge.trim().split("\n"),
        ...lines.slice(knowledgeSection.end)
      ];
    } else {
      const unprocessedSection2 = findSection(lines, "unprocessed");
      if (unprocessedSection2) {
        lines = [
          ...lines.slice(0, unprocessedSection2.start),
          "",
          KNOWLEDGE_HEADING,
          "",
          ...knowledge.trim().split("\n"),
          "",
          ...lines.slice(unprocessedSection2.start)
        ];
      } else {
        lines = [...lines, "", KNOWLEDGE_HEADING, "", ...knowledge.trim().split("\n")];
      }
    }
    const unprocessedSection = findSection(lines, "unprocessed");
    const remainder = unprocessed.trim();
    if (unprocessedSection) {
      lines = [
        ...lines.slice(0, unprocessedSection.start + 1),
        ...remainder ? ["", ...remainder.split("\n")] : [],
        ...lines.slice(unprocessedSection.end)
      ];
    } else if (remainder) {
      lines = [...lines, "", UNPROCESSED_HEADING, "", ...remainder.split("\n")];
    }
    await this.plugin.app.vault.modify(file, lines.join("\n") + "\n");
    console.log(`[NutEgg] Merged knowledge tree in ${fileName}`);
  }
};

// tests/merge-widget-dom.test.ts
var dom = new import_jsdom.JSDOM("<!doctype html><html><body><div id='editor'></div></body></html>", {
  pretendToBeVisual: true
});
var defineGlobal = (key, value) => Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
defineGlobal("window", dom.window);
defineGlobal("document", dom.window.document);
defineGlobal("navigator", dom.window.navigator);
defineGlobal("requestAnimationFrame", (cb) => setTimeout(cb, 0));
defineGlobal("cancelAnimationFrame", (id) => clearTimeout(id));
defineGlobal("getComputedStyle", dom.window.getComputedStyle.bind(dom.window));
defineGlobal("HTMLElement", dom.window.HTMLElement);
defineGlobal("Node", dom.window.Node);
defineGlobal("Text", dom.window.Text);
defineGlobal("Range", dom.window.Range);
defineGlobal("getSelection", () => dom.window.getSelection());
defineGlobal("MutationObserver", dom.window.MutationObserver);
defineGlobal("Element", dom.window.Element);
defineGlobal("HTMLElement", dom.window.HTMLElement);
defineGlobal("MouseEvent", dom.window.MouseEvent);
defineGlobal("Event", dom.window.Event);
var EGG_WITH_ENTRIES = [
  "---",
  "topic: X",
  "---",
  "",
  "# Knowledge",
  "",
  "- tree",
  "",
  "# Unprocessed",
  "",
  "- pending one",
  "- pending two"
].join("\n");
var EGG_EMPTY = ["# Knowledge", "", "- tree", "", "# Unprocessed"].join("\n");
function makePlugin() {
  const { vault } = makeFakePlugin().app;
  const fake = makeFakePlugin({ vault });
  fake.eggParser = new EggParser(fake);
  fake.app.workspace = { getLeavesOfType: () => [], getActiveFile: () => null };
  return fake;
}
async function renderEditor(docText, plugin) {
  const parent = dom.window.document.getElementById("editor");
  parent.innerHTML = "";
  const view = new import_view2.EditorView({
    parent,
    state: import_state.EditorState.create({ doc: docText, extensions: [mergeEditorExtension(plugin)] })
  });
  for (let i = 0; i < 10; i++) {
    view.requestMeasure();
    await new Promise((r) => setTimeout(r, 10));
  }
  return view;
}
(0, import_node_test.describe)("merge-widget editor extension (DOM)", () => {
  let views = [];
  (0, import_node_test.after)(() => {
    for (const v of views)
      v.destroy();
  });
  (0, import_node_test.it)("renders the badge + merge button below # Unprocessed as a block", async () => {
    const view = await renderEditor(EGG_WITH_ENTRIES, makePlugin());
    views.push(view);
    const html = view.dom.innerHTML;
    import_strict.default.ok(html.includes("nutegg-merge-editor-widget"), `widget not in DOM: ${html.slice(0, 400)}`);
    import_strict.default.ok(html.includes("\u{1F95A} 2 unprocessed entries"));
    import_strict.default.ok(html.includes("\u26A1 Merge into Knowledge Tree"));
    const widget = view.dom.querySelector(".nutegg-merge-editor-widget");
    import_strict.default.ok(widget.classList.contains("nutegg-merge-container"), "shares reading-mode container class");
    import_strict.default.ok(widget.querySelector("button").classList.contains("nutegg-merge-btn"));
    import_strict.default.ok(widget.querySelector("button").classList.contains("mod-cta"));
    const headingLine = [...view.dom.querySelectorAll(".cm-line")].find(
      (l) => l.textContent?.includes("Unprocessed")
    );
    import_strict.default.ok(
      headingLine.compareDocumentPosition(widget) & Node.DOCUMENT_POSITION_FOLLOWING,
      "widget sits after the heading line"
    );
  });
  (0, import_node_test.it)("renders the up-to-date badge when there are no entries", async () => {
    const view = await renderEditor(EGG_EMPTY, makePlugin());
    views.push(view);
    import_strict.default.ok(view.dom.innerHTML.includes("\u2705 Knowledge tree is up to date"));
  });
  (0, import_node_test.it)("renders nothing for files without the heading", async () => {
    const view = await renderEditor("# Knowledge\n\n- tree", makePlugin());
    views.push(view);
    import_strict.default.ok(!view.dom.innerHTML.includes("nutegg-merge-editor-widget"));
  });
});
