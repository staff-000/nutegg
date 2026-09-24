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
function getLanguage() {
  return "en";
}
var moment = {
  locale: () => "en"
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

// src/i18n/es.ts
var es = {
  "settingsTitle": "Configuraci\xF3n de NutEgg",
  "chromeCompanionName": "Complemento de extensi\xF3n para Chrome",
  "chromeCompanionDesc": "Captura y analiza art\xEDculos, v\xEDdeos de YouTube y tweets directamente desde tu navegador en Obsidian.",
  "getChromeExtension": "Obtener extensi\xF3n de Chrome \u2197",
  "reportBugName": "Reportar un error",
  "reportBugDesc": "\xBFHas encontrado un error, comportamiento inesperado o necesitas ayuda? Inf\xF3rmanos en GitHub.",
  "reportBugBtn": "\u{1F41B} Reportar error en GitHub \u2197",
  "vaultPathsHeader": "Rutas de la b\xF3veda",
  "rawFolder": "Carpeta de contenido sin procesar",
  "rawFolderDesc": "Carpeta para contenido sin procesar guardado",
  "indexFile": "Archivo de \xEDndice",
  "indexFileDesc": "Archivo que mapea los eggs a sus archivos markdown",
  "workflowFolder": "Carpeta del motor de flujo de trabajo",
  "workflowFolderDesc": "Carpeta donde se guardan los prompts de IA, esquemas y reglas como archivos markdown editables",
  "useDefaultWorkflows": "Usar prompts de flujo de trabajo predeterminados",
  "useDefaultWorkflowsDesc": "Mueve todos los archivos actuales en nutegg/_workflow a una carpeta de respaldo con fecha en _backup/ y restaura los valores predeterminados.",
  "useDefaultsBtn": "Restaurar predeterminados",
  "devMode": "Modo desarrollador",
  "devModeOn": "La configuraci\xF3n avanzada est\xE1 visible a continuaci\xF3n",
  "devModeOff": "Mostrar configuraci\xF3n avanzada (proveedor de IA, clave API, puerto del servidor)",
  "aiModelConfig": "Configuraci\xF3n del modelo de IA",
  "localModelConfig": "Configuraci\xF3n de LLM local",
  "aiProvider": "1. Proveedor de IA",
  "aiProviderDesc": "Elige un ejecutor local (Ollama, LM Studio), OpenRouter o un proveedor en la nube",
  "localApiType": "Tipo de API",
  "localApiTypeDesc": "Formato de protocolo utilizado por tu ejecutor local",
  "localEndpoint": "Punto de enlace del servidor local",
  "localEndpointOllamaDesc": "URL nativa de chat de Ollama (por defecto: http://127.0.0.1:11434/api/chat)",
  "localEndpointOpenAiDesc": "URL de chat completions compatible con OpenAI para tu ejecutor local",
  "localPresets": "Preajustes: ",
  "localApiKeyDesc": "Opcional para LLMs locales. Dejar vac\xEDo si tu servidor local no requiere autenticaci\xF3n.",
  "aiModelFamily": "2. Familia del modelo",
  "aiModelFamilyDesc": "Elige el proveedor del modelo o grupo de arquitectura en OpenRouter",
  "modelVersion": "3. Versi\xF3n del modelo",
  "modelVersionDesc": 'Enviado a OpenRouter como "{model}"',
  "aiModel": "2. Modelo",
  "aiModelDesc": "Modelo a utilizar para el an\xE1lisis ({provider})",
  "customModel": "Nombre de modelo personalizado",
  "customModelDesc": "Introduce el ID del modelo (ej. mistralai/mistral-large)",
  "aiApiKey": "Clave API",
  "openRouterApiKeyDesc": "Tu clave API de OpenRouter (openrouter.ai/keys)",
  "providerApiKeyDesc": "Tu clave API de {provider}",
  "creditStatusTitleLocal": "Estado de conexi\xF3n del LLM local",
  "creditStatusTitleCloud": "Cr\xE9dito y saldo de IA",
  "creditCheckingLocal": "Comprobando conexi\xF3n con servidor local...",
  "creditCheckingCloud": "Comprobando saldo con el proveedor...",
  "refresh": "Actualizar",
  "checking": "Comprobando...",
  "remainingBalance": "\u{1F4B0} Saldo restante: {balance} ({status})",
  "providerStatus": "\u2139\uFE0F Proveedor: {provider} \u2014 {status}",
  "creditCheckFailed": "\u26A0\uFE0F Error al comprobar cr\xE9dito: {error}",
  "processingHeader": "Procesamiento y fragmentaci\xF3n",
  "chunkWindowChars": "Tama\xF1o de ventana de fragmento",
  "chunkWindowCharsDesc": "Longitud m\xE1xima de caracteres por fragmento (~30.000 caracteres \u2248 8.000 tokens). Contenido m\xE1s largo se divide en partes.",
  "sectionGridSeconds": "Intervalo de cuadr\xEDcula de secci\xF3n",
  "sectionGridSecondsDesc": "Intervalo de tiempo en segundos (por defecto: 300 s / 5 minutos) para generar puntos de secci\xF3n en v\xEDdeos sin cap\xEDtulos nativos.",
  "maxTokens": "Tokens m\xE1ximos de finalizaci\xF3n",
  "maxTokensDesc": "Tokens de salida m\xE1ximos asignados a llamadas de IA (por defecto: 16384).",
  "serverHeader": "Servidor",
  "serverPort": "Puerto del servidor",
  "serverPortDesc": "Puerto para el servidor HTTP local que conecta con la extensi\xF3n de Chrome (requiere reinicio)",
  "linksHeader": "Enlaces y recursos",
  "nuteggChromeStoreName": "NutEgg en Chrome Web Store",
  "nuteggChromeStoreDesc": "Instala o actualiza la extensi\xF3n complementaria NutEgg para Google Chrome.",
  "openChromeWebStore": "Abrir Chrome Web Store \u2197",
  "nuteggObsidianPluginName": "NutEgg en complementos comunitarios de Obsidian",
  "nuteggObsidianPluginDesc": "Ver NutEgg en el directorio de complementos comunitarios de Obsidian.",
  "openObsidianDirectory": "Abrir directorio de Obsidian \u2197",
  "cmdNewEgg": "Crear un nuevo archivo egg",
  "cmdOpenIndex": "Abrir archivo de \xEDndice",
  "cmdMergeCurrent": "Combinar entradas no procesadas en el egg actual",
  "cmdCheckCredit": "Comprobar cr\xE9dito y saldo del proveedor de IA",
  "cmdUseDefaultWorkflowPrompts": "Usar prompts de flujo de trabajo predeterminados (respaldar actuales)",
  "cmdReportBug": "Reportar un error en GitHub",
  "ribbonOpenIndex": "NutEgg: Abrir \xEDndice",
  "ribbonCheckCredit": "NutEgg: Comprobar cr\xE9dito y saldo de IA",
  "serverStarted": "Servidor NutEgg iniciado en el puerto {port}",
  "serverFailed": "NutEgg: Error al iniciar el servidor. Consulta la consola para m\xE1s detalles.",
  "indexNotFound": "NutEgg: no se encontr\xF3 {path}. Haz clic en el icono del egg para crearlo.",
  "noActiveFile": "NutEgg: No hay archivo activo",
  "notEggNote": "NutEgg: El archivo activo no es una nota egg",
  "mergingEntries": "NutEgg: Combinando entradas no procesadas en {name}...",
  "mergedEntries": "[NutEgg] Se combinaron {count} entradas en el \xE1rbol de conocimiento",
  "noUnprocessed": "[NutEgg] No hay entradas no procesadas para combinar o fall\xF3 la combinaci\xF3n.",
  "mergeFailed": "[NutEgg] Error al combinar: {error}",
  "workflowReset": "[NutEgg] Flujos de trabajo restablecidos a predeterminados. Archivos anteriores movidos a {folder}",
  "eggNameRequired": "NutEgg: Introduce un nombre de egg v\xE1lido.",
  "eggAlreadyExists": "NutEgg: {path} ya existe.",
  "eggCreated": "NutEgg: Creado {path}",
  "indexSynced": "[NutEgg] \xCDndice sincronizado: {summary}",
  "indexAllSynced": "[NutEgg] Todo est\xE1 sincronizado.",
  "indexSyncFailed": "[NutEgg] Fall\xF3 la sincronizaci\xF3n: {error}",
  "createEggTitle": "\u{1F423} Crear nuevo Egg",
  "eggNameLabel": "Nombre del Egg (nombre de archivo):",
  "eggNamePlaceholder": "ej. metodologia, estrategia_inversion...",
  "eggDescLabel": "Descripci\xF3n (alcance de lo que cubre):",
  "eggDescPlaceholder": "ej. m\xE9todos pr\xE1cticos y t\xE1cticas...",
  "eggLangHint": "\u{1F310} El idioma de las instrucciones coincidir\xE1 con el idioma de la descripci\xF3n.",
  "cancel": "Cancelar",
  "createEgg": "Crear Egg",
  "creatingEgg": "\u23F3 Creando egg...",
  "mergeUnprocessed": "Combinar nota no procesada",
  "mergeUnprocessedPlural": "Combinar {count} notas no procesadas",
  "merging": "Combinando...",
  "mergeButtonText": "\u26A1 Combinar en el \xE1rbol de conocimiento",
  "mergingWithAi": "\u23F3 Combinando con IA...",
  "mergedSuccess": "\u2705 \xA1Combinado!",
  "treeUpToDate": "\u2705 El \xE1rbol de conocimiento est\xE1 actualizado",
  "unprocessedEntries": "\u{1F95A} {count} {entries} sin procesar",
  "entrySingle": "entrada",
  "entryPlural": "entradas",
  "mergeNoChanges": "[NutEgg] La combinaci\xF3n no devolvi\xF3 cambios o fall\xF3. Revisa la consola.",
  "syncIndex": "Sincronizar \xEDndice",
  "syncingIndex": "Sincronizando...",
  "newEggButton": "+ Nuevo Egg",
  "unprocessedBadge": "{count} sin procesar"
};

// src/i18n/ja.ts
var ja = {
  "settingsTitle": "NutEgg \u8A2D\u5B9A",
  "chromeCompanionName": "Chrome\u62E1\u5F35\u6A5F\u80FD\u9023\u643A",
  "chromeCompanionDesc": "\u30D6\u30E9\u30A6\u30B6\u304B\u3089\u8A18\u4E8B\u3001YouTube\u52D5\u753B\u3001\u30C4\u30A4\u30FC\u30C8\u3092\u76F4\u63A5Obsidian\u306B\u30AD\u30E3\u30D7\u30C1\u30E3\u30FB\u5206\u6790\u3057\u307E\u3059\u3002",
  "getChromeExtension": "Chrome\u62E1\u5F35\u6A5F\u80FD\u3092\u5165\u624B \u2197",
  "reportBugName": "\u30D0\u30B0\u5831\u544A",
  "reportBugDesc": "\u554F\u984C\u306E\u767A\u751F\u3084\u4E88\u671F\u3057\u306A\u3044\u52D5\u4F5C\u3092\u898B\u3064\u3051\u305F\u5834\u5408\u3001GitHub\u306EIssue\u304B\u3089\u304A\u77E5\u3089\u305B\u304F\u3060\u3055\u3044\u3002",
  "reportBugBtn": "\u{1F41B} GitHub\u3067\u30D0\u30B0\u3092\u5831\u544A \u2197",
  "vaultPathsHeader": "\u4FDD\u7BA1\u5EAB\u306E\u30D1\u30B9\u8A2D\u5B9A",
  "rawFolder": "\u751F\u30B3\u30F3\u30C6\u30F3\u30C4\u30D5\u30A9\u30EB\u30C0",
  "rawFolderDesc": "\u4FDD\u5B58\u3055\u308C\u305F\u751F\u30B3\u30F3\u30C6\u30F3\u30C4\u3092\u683C\u7D0D\u3059\u308B\u30D5\u30A9\u30EB\u30C0",
  "indexFile": "\u30A4\u30F3\u30C7\u30C3\u30AF\u30B9\u30D5\u30A1\u30A4\u30EB",
  "indexFileDesc": "Egg\u3068Markdown\u30D5\u30A1\u30A4\u30EB\u3092\u30DE\u30C3\u30D4\u30F3\u30B0\u3059\u308B\u30A4\u30F3\u30C7\u30C3\u30AF\u30B9\u30D5\u30A1\u30A4\u30EB",
  "workflowFolder": "\u30EF\u30FC\u30AF\u30D5\u30ED\u30FC\u30A8\u30F3\u30B8\u30F3\u30D5\u30A9\u30EB\u30C0",
  "workflowFolderDesc": "AI\u30D7\u30ED\u30F3\u30D7\u30C8\u3001\u30B9\u30AD\u30FC\u30DE\u3001\u30D1\u30A4\u30D7\u30E9\u30A4\u30F3\u30EB\u30FC\u30EB\u3092\u4FDD\u5B58\u3059\u308B\u30D5\u30A9\u30EB\u30C0",
  "useDefaultWorkflows": "\u30C7\u30D5\u30A9\u30EB\u30C8\u306E\u30EF\u30FC\u30AF\u30D5\u30ED\u30FC\u30D7\u30ED\u30F3\u30D7\u30C8\u3092\u4F7F\u7528",
  "useDefaultWorkflowsDesc": "nutegg/_workflow\u5185\u306E\u5168\u30D5\u30A1\u30A4\u30EB\u3092_backup/\u306E\u30BF\u30A4\u30E0\u30B9\u30BF\u30F3\u30D7\u4ED8\u304D\u30D5\u30A9\u30EB\u30C0\u306B\u9000\u907F\u3057\u3001\u30AF\u30EA\u30FC\u30F3\u306A\u521D\u671F\u5024\u306B\u623B\u3057\u307E\u3059\u3002",
  "useDefaultsBtn": "\u521D\u671F\u8A2D\u5B9A\u306B\u623B\u3059",
  "devMode": "\u958B\u767A\u8005\u30E2\u30FC\u30C9",
  "devModeOn": "\u9AD8\u5EA6\u306A\u8A2D\u5B9A\u304C\u8868\u793A\u3055\u308C\u3066\u3044\u307E\u3059",
  "devModeOff": "\u9AD8\u5EA6\u306A\u8A2D\u5B9A\u3092\u8868\u793A\uFF08AI\u30D7\u30ED\u30D0\u30A4\u30C0\u30FC\u3001API\u30AD\u30FC\u3001\u30B5\u30FC\u30D0\u30FC\u30DD\u30FC\u30C8\uFF09",
  "aiModelConfig": "AI\u30E2\u30C7\u30EB\u8A2D\u5B9A",
  "localModelConfig": "\u30ED\u30FC\u30AB\u30EBLLM\u8A2D\u5B9A",
  "aiProvider": "1. AI\u30D7\u30ED\u30D0\u30A4\u30C0\u30FC",
  "aiProviderDesc": "\u30ED\u30FC\u30AB\u30EB\u5B9F\u884C\u74B0\u5883\uFF08Ollama\u3001LM Studio\uFF09\u3001OpenRouter\u3001\u307E\u305F\u306F\u30AF\u30E9\u30A6\u30C9AI\u3092\u9078\u629E",
  "localApiType": "API\u30BF\u30A4\u30D7",
  "localApiTypeDesc": "\u30ED\u30FC\u30AB\u30EB\u74B0\u5883\u3067\u4F7F\u7528\u3059\u308B\u30D7\u30ED\u30C8\u30B3\u30EB\u5F62\u5F0F",
  "localEndpoint": "\u30ED\u30FC\u30AB\u30EB\u30B5\u30FC\u30D0\u30FC\u306E\u30A8\u30F3\u30C9\u30DD\u30A4\u30F3\u30C8",
  "localEndpointOllamaDesc": "Ollama\u30CD\u30A4\u30C6\u30A3\u30D6\u306E\u30C1\u30E3\u30C3\u30C8URL\uFF08\u30C7\u30D5\u30A9\u30EB\u30C8: http://127.0.0.1:11434/api/chat\uFF09",
  "localEndpointOpenAiDesc": "\u30ED\u30FC\u30AB\u30EB\u74B0\u5883\u306EOpenAI\u4E92\u63DB\u30C1\u30E3\u30C3\u30C8URL",
  "localPresets": "\u30D7\u30EA\u30BB\u30C3\u30C8: ",
  "localApiKeyDesc": "\u30ED\u30FC\u30AB\u30EBLLM\u7528\uFF08\u4EFB\u610F\uFF09\u3002\u8A8D\u8A3C\u4E0D\u8981\u306E\u5834\u5408\u306F\u7A7A\u6B04\u306B\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
  "aiModelFamily": "2. \u30E2\u30C7\u30EB\u30D5\u30A1\u30DF\u30EA\u30FC",
  "aiModelFamilyDesc": "OpenRouter\u306E\u30E2\u30C7\u30EB\u30D9\u30F3\u30C0\u30FC\u307E\u305F\u306F\u30A2\u30FC\u30AD\u30C6\u30AF\u30C1\u30E3\u30B0\u30EB\u30FC\u30D7\u3092\u9078\u629E",
  "modelVersion": "3. \u30E2\u30C7\u30EB\u30D0\u30FC\u30B8\u30E7\u30F3",
  "modelVersionDesc": "OpenRouter\u306B\u300C{model}\u300D\u3068\u3057\u3066\u9001\u4FE1\u3055\u308C\u307E\u3059",
  "aiModel": "2. \u30E2\u30C7\u30EB",
  "aiModelDesc": "\u5206\u6790\u306B\u4F7F\u7528\u3059\u308B\u30E2\u30C7\u30EB\uFF08{provider}\uFF09",
  "customModel": "\u30AB\u30B9\u30BF\u30E0\u30E2\u30C7\u30EB\u540D",
  "customModelDesc": "\u30E2\u30C7\u30EBID\u3092\u5165\u529B\uFF08\u4F8B: mistralai/mistral-large\uFF09",
  "aiApiKey": "API\u30AD\u30FC",
  "openRouterApiKeyDesc": "OpenRouter\u306EAPI\u30AD\u30FC\uFF08openrouter.ai/keys\uFF09",
  "providerApiKeyDesc": "{provider}\u306EAPI\u30AD\u30FC",
  "creditStatusTitleLocal": "\u30ED\u30FC\u30AB\u30EBLLM\u63A5\u7D9A\u30B9\u30C6\u30FC\u30BF\u30B9",
  "creditStatusTitleCloud": "AI\u30AF\u30EC\u30B8\u30C3\u30C8\u6B8B\u9AD8",
  "creditCheckingLocal": "\u30ED\u30FC\u30AB\u30EB\u30B5\u30FC\u30D0\u30FC\u63A5\u7D9A\u3092\u78BA\u8A8D\u4E2D...",
  "creditCheckingCloud": "\u30D7\u30ED\u30D0\u30A4\u30C0\u30FC\u6B8B\u9AD8\u3092\u78BA\u8A8D\u4E2D...",
  "refresh": "\u66F4\u65B0",
  "checking": "\u78BA\u8A8D\u4E2D...",
  "remainingBalance": "\u{1F4B0} \u6B8B\u9AD8: {balance} ({status})",
  "providerStatus": "\u2139\uFE0F \u30D7\u30ED\u30D0\u30A4\u30C0\u30FC: {provider} \u2014 {status}",
  "creditCheckFailed": "\u26A0\uFE0F \u6B8B\u9AD8\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F: {error}",
  "processingHeader": "\u51E6\u7406\u3068\u30C1\u30E3\u30F3\u30AF\u5206\u5272",
  "chunkWindowChars": "\u30C1\u30E3\u30F3\u30AF\u30A6\u30A3\u30F3\u30C9\u30A6\u30B5\u30A4\u30BA",
  "chunkWindowCharsDesc": "\u30C1\u30E3\u30F3\u30AF\u3042\u305F\u308A\u306E\u6700\u5927\u6587\u5B57\u6570\uFF08\u7D0430,000\u6587\u5B57 \u2252 8,000\u30C8\u30FC\u30AF\u30F3\uFF09\u3002\u3053\u308C\u3092\u8D85\u3048\u308B\u9577\u6587\u306F\u8907\u6570\u30D1\u30FC\u30C8\u306B\u5206\u5272\u51E6\u7406\u3055\u308C\u307E\u3059\u3002",
  "sectionGridSeconds": "\u30BB\u30AF\u30B7\u30E7\u30F3\u30B0\u30EA\u30C3\u30C9\u9593\u9694",
  "sectionGridSecondsDesc": "\u6A19\u6E96\u30C1\u30E3\u30D7\u30BF\u30FC\u306E\u306A\u3044\u52D5\u753B\u306B\u30C1\u30E3\u30D7\u30BF\u30FC\u30DE\u30C3\u30D7\u3092\u751F\u6210\u3059\u308B\u6642\u9593\u9593\u9694\uFF08\u79D2\u3001\u30C7\u30D5\u30A9\u30EB\u30C8: 300\u79D2 / 5\u5206\uFF09\u3002",
  "maxTokens": "\u6700\u5927\u51FA\u529B\u30C8\u30FC\u30AF\u30F3\u6570",
  "maxTokensDesc": "AI\u547C\u3073\u51FA\u3057\u306B\u5272\u308A\u5F53\u3066\u308B\u6700\u5927\u30C8\u30FC\u30AF\u30F3\u6570\uFF08\u30C7\u30D5\u30A9\u30EB\u30C8: 16384\uFF09\u3002",
  "serverHeader": "\u30B5\u30FC\u30D0\u30FC",
  "serverPort": "\u30B5\u30FC\u30D0\u30FC\u30DD\u30FC\u30C8",
  "serverPortDesc": "Chrome\u62E1\u5F35\u6A5F\u80FD\u3068\u63A5\u7D9A\u3059\u308B\u305F\u3081\u306E\u30ED\u30FC\u30AB\u30EBHTTP\u30B5\u30FC\u30D0\u30FC\u30DD\u30FC\u30C8\uFF08\u518D\u8D77\u52D5\u304C\u5FC5\u8981\uFF09",
  "linksHeader": "\u30EA\u30F3\u30AF\u3068\u30EA\u30BD\u30FC\u30B9",
  "nuteggChromeStoreName": "Chrome Web Store\u306ENutEgg",
  "nuteggChromeStoreDesc": "Google Chrome\u7528NutEgg\u62E1\u5F35\u6A5F\u80FD\u3092\u30A4\u30F3\u30B9\u30C8\u30FC\u30EB\u307E\u305F\u306F\u66F4\u65B0\u3057\u307E\u3059\u3002",
  "openChromeWebStore": "Chrome Web Store\u3092\u958B\u304F \u2197",
  "nuteggObsidianPluginName": "Obsidian\u30B3\u30DF\u30E5\u30CB\u30C6\u30A3\u30D7\u30E9\u30B0\u30A4\u30F3\u306ENutEgg",
  "nuteggObsidianPluginDesc": "Obsidian\u30B3\u30DF\u30E5\u30CB\u30C6\u30A3\u30D7\u30E9\u30B0\u30A4\u30F3\u30C7\u30A3\u30EC\u30AF\u30C8\u30EA\u3067NutEgg\u3092\u78BA\u8A8D\u3057\u307E\u3059\u3002",
  "openObsidianDirectory": "Obsidian\u30C7\u30A3\u30EC\u30AF\u30C8\u30EA\u3092\u958B\u304F \u2197",
  "cmdNewEgg": "\u65B0\u3057\u3044Egg\u30D5\u30A1\u30A4\u30EB\u3092\u4F5C\u6210",
  "cmdOpenIndex": "\u30A4\u30F3\u30C7\u30C3\u30AF\u30B9\u30D5\u30A1\u30A4\u30EB\u3092\u958B\u304F",
  "cmdMergeCurrent": "\u73FE\u5728\u306EEgg\u3067\u672A\u51E6\u7406\u30A8\u30F3\u30C8\u30EA\u3092\u30DE\u30FC\u30B8",
  "cmdCheckCredit": "AI\u30D7\u30ED\u30D0\u30A4\u30C0\u30FC\u306E\u30AF\u30EC\u30B8\u30C3\u30C8\u6B8B\u9AD8\u3092\u78BA\u8A8D",
  "cmdUseDefaultWorkflowPrompts": "\u30C7\u30D5\u30A9\u30EB\u30C8\u306E\u30D7\u30ED\u30F3\u30D7\u30C8\u3092\u4F7F\u7528\uFF08\u65E2\u5B58\u3092\u30D0\u30C3\u30AF\u30A2\u30C3\u30D7\uFF09",
  "cmdReportBug": "GitHub\u3067\u30D0\u30B0\u3092\u5831\u544A",
  "ribbonOpenIndex": "NutEgg: \u30A4\u30F3\u30C7\u30C3\u30AF\u30B9\u3092\u958B\u304F",
  "ribbonCheckCredit": "NutEgg: AI\u30AF\u30EC\u30B8\u30C3\u30C8\u6B8B\u9AD8\u3092\u78BA\u8A8D",
  "serverStarted": "NutEgg\u30B5\u30FC\u30D0\u30FC\u304C\u30DD\u30FC\u30C8{port}\u3067\u8D77\u52D5\u3057\u307E\u3057\u305F",
  "serverFailed": "NutEgg: \u30B5\u30FC\u30D0\u30FC\u306E\u8D77\u52D5\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002\u8A73\u7D30\u306F\u30B3\u30F3\u30BD\u30FC\u30EB\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
  "indexNotFound": "NutEgg: {path}\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002Egg\u30A2\u30A4\u30B3\u30F3\u3092\u30AF\u30EA\u30C3\u30AF\u3057\u3066\u4F5C\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
  "noActiveFile": "NutEgg: \u30A2\u30AF\u30C6\u30A3\u30D6\u306A\u30D5\u30A1\u30A4\u30EB\u304C\u3042\u308A\u307E\u305B\u3093",
  "notEggNote": "NutEgg: \u30A2\u30AF\u30C6\u30A3\u30D6\u306A\u30D5\u30A1\u30A4\u30EB\u306FEgg\u30CE\u30FC\u30C8\u3067\u306F\u3042\u308A\u307E\u305B\u3093",
  "mergingEntries": "NutEgg: {name}\u306E\u672A\u51E6\u7406\u30A8\u30F3\u30C8\u30EA\u3092\u30DE\u30FC\u30B8\u4E2D...",
  "mergedEntries": "[NutEgg] {count}\u4EF6\u306E\u30A8\u30F3\u30C8\u30EA\u3092\u77E5\u8B58\u30C4\u30EA\u30FC\u306B\u30DE\u30FC\u30B8\u3057\u307E\u3057\u305F",
  "noUnprocessed": "[NutEgg] \u30DE\u30FC\u30B8\u3059\u308B\u672A\u51E6\u7406\u30A8\u30F3\u30C8\u30EA\u304C\u306A\u3044\u304B\u3001\u51E6\u7406\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002",
  "mergeFailed": "[NutEgg] \u30DE\u30FC\u30B8\u5931\u6557: {error}",
  "workflowReset": "[NutEgg] \u30EF\u30FC\u30AF\u30D5\u30ED\u30FC\u3092\u521D\u671F\u72B6\u614B\u306B\u30EA\u30BB\u30C3\u30C8\u3057\u307E\u3057\u305F\u3002\u4EE5\u524D\u306E\u30D5\u30A1\u30A4\u30EB\u306F{folder}\u306B\u9000\u907F\u3055\u308C\u307E\u3057\u305F",
  "eggNameRequired": "NutEgg: \u6709\u52B9\u306AEgg\u540D\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
  "eggAlreadyExists": "NutEgg: {path}\u306F\u65E2\u306B\u5B58\u5728\u3057\u307E\u3059\u3002",
  "eggCreated": "NutEgg: {path}\u3092\u4F5C\u6210\u3057\u307E\u3057\u305F",
  "indexSynced": "[NutEgg] \u30A4\u30F3\u30C7\u30C3\u30AF\u30B9\u540C\u671F\u5B8C\u4E86: {summary}",
  "indexAllSynced": "[NutEgg] \u3059\u3079\u3066\u6700\u65B0\u72B6\u614B\u3067\u3059\u3002",
  "indexSyncFailed": "[NutEgg] \u540C\u671F\u306B\u5931\u6557\u3057\u307E\u3057\u305F: {error}",
  "createEggTitle": "\u{1F423} \u65B0\u3057\u3044Egg\u3092\u4F5C\u6210",
  "eggNameLabel": "Egg\u540D\uFF08\u30D5\u30A1\u30A4\u30EB\u540D\uFF09:",
  "eggNamePlaceholder": "\u4F8B: methodology, invest_strategy...",
  "eggDescLabel": "\u8AAC\u660E\uFF08\u3053\u306EEgg\u304C\u30AB\u30D0\u30FC\u3059\u308B\u7BC4\u56F2\uFF09:",
  "eggDescPlaceholder": "\u4F8B: \u5B9F\u8DF5\u7684\u306A\u30E1\u30BD\u30C3\u30C9\u3068\u6226\u8853...",
  "eggLangHint": "\u{1F310} \u6307\u793A\u3068\u51FA\u529B\u306E\u8A00\u8A9E\u306F\u8AAC\u660E\u6587\u306E\u8A00\u8A9E\u306B\u4E00\u81F4\u3057\u307E\u3059\u3002",
  "cancel": "\u30AD\u30E3\u30F3\u30BB\u30EB",
  "createEgg": "Egg\u3092\u4F5C\u6210",
  "creatingEgg": "\u23F3 Egg\u3092\u4F5C\u6210\u4E2D...",
  "mergeUnprocessed": "\u672A\u51E6\u7406\u30CE\u30FC\u30C8\u3092\u30DE\u30FC\u30B8",
  "mergeUnprocessedPlural": "{count}\u4EF6\u306E\u672A\u51E6\u7406\u30CE\u30FC\u30C8\u3092\u30DE\u30FC\u30B8",
  "merging": "\u30DE\u30FC\u30B8\u4E2D...",
  "mergeButtonText": "\u26A1 \u77E5\u8B58\u30C4\u30EA\u30FC\u306B\u30DE\u30FC\u30B8",
  "mergingWithAi": "\u23F3 AI\u3067\u30DE\u30FC\u30B8\u4E2D...",
  "mergedSuccess": "\u2705 \u30DE\u30FC\u30B8\u5B8C\u4E86\uFF01",
  "treeUpToDate": "\u2705 \u77E5\u8B58\u30C4\u30EA\u30FC\u306F\u6700\u65B0\u3067\u3059",
  "unprocessedEntries": "\u{1F95A} \u672A\u51E6\u7406\u306E{entries}\uFF08{count}\u4EF6\uFF09",
  "entrySingle": "\u30A8\u30F3\u30C8\u30EA",
  "entryPlural": "\u30A8\u30F3\u30C8\u30EA",
  "mergeNoChanges": "[NutEgg] \u5909\u66F4\u304C\u306A\u3044\u304B\u3001\u30DE\u30FC\u30B8\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002\u30B3\u30F3\u30BD\u30FC\u30EB\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
  "syncIndex": "\u30A4\u30F3\u30C7\u30C3\u30AF\u30B9\u3092\u540C\u671F",
  "syncingIndex": "\u540C\u671F\u4E2D...",
  "newEggButton": "+ \u65B0\u3057\u3044Egg",
  "unprocessedBadge": "\u672A\u51E6\u7406 {count}\u4EF6"
};

// src/i18n/ko.ts
var ko = {
  "settingsTitle": "NutEgg \uC124\uC815",
  "chromeCompanionName": "Chrome \uD655\uC7A5 \uD504\uB85C\uADF8\uB7A8 \uB3D9\uBC18\uC790",
  "chromeCompanionDesc": "\uBE0C\uB77C\uC6B0\uC800\uC5D0\uC11C \uAE30\uC0AC, YouTube \uBE44\uB514\uC624, \uD2B8\uC717\uC744 Obsidian\uC73C\uB85C \uC9C1\uC811 \uCEA1\uCC98\uD558\uACE0 \uBD84\uC11D\uD569\uB2C8\uB2E4.",
  "getChromeExtension": "Chrome \uD655\uC7A5 \uD504\uB85C\uADF8\uB7A8 \uBC1B\uAE30 \u2197",
  "reportBugName": "\uBC84\uADF8 \uBCF4\uACE0",
  "reportBugDesc": "\uBB38\uC81C\uB098 \uC608\uAE30\uCE58 \uC54A\uC740 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uAC70\uB098 \uB3C4\uC6C0\uC774 \uD544\uC694\uD558\uC2E0\uAC00\uC694? GitHub \uC774\uC288\uB97C \uD1B5\uD574 \uC54C\uB824\uC8FC\uC138\uC694.",
  "reportBugBtn": "\u{1F41B} GitHub\uC5D0 \uBC84\uADF8 \uBCF4\uACE0 \u2197",
  "vaultPathsHeader": "\uBCFC\uD2B8 \uACBD\uB85C \uC124\uC815",
  "rawFolder": "\uC6D0\uC2DC \uCF58\uD150\uCE20 \uD3F4\uB354",
  "rawFolderDesc": "\uC800\uC7A5\uB41C \uC6D0\uBCF8 \uC6F9 \uCF58\uD150\uCE20\uAC00 \uBCF4\uAD00\uB418\uB294 \uD3F4\uB354",
  "indexFile": "\uC778\uB371\uC2A4 \uD30C\uC77C",
  "indexFileDesc": "Egg\uC640 Markdown \uD30C\uC77C\uC744 \uB9E4\uD551\uD558\uB294 \uC778\uB371\uC2A4 \uD30C\uC77C",
  "workflowFolder": "\uC6CC\uD06C\uD50C\uB85C\uC6B0 \uC5D4\uC9C4 \uD3F4\uB354",
  "workflowFolderDesc": "AI \uD504\uB86C\uD504\uD2B8, \uC2A4\uD0A4\uB9C8, \uD30C\uC774\uD504\uB77C\uC778 \uADDC\uCE59\uC774 \uC800\uC7A5\uB418\uB294 \uD3F4\uB354",
  "useDefaultWorkflows": "\uAE30\uBCF8 \uC6CC\uD06C\uD50C\uB85C\uC6B0 \uD504\uB86C\uD504\uD2B8 \uBCF5\uC6D0",
  "useDefaultWorkflowsDesc": "nutegg/_workflow\uC758 \uBAA8\uB4E0 \uD30C\uC77C\uC744 _backup/ \uD558\uC704\uC758 \uBC31\uC5C5 \uD3F4\uB354\uB85C \uC774\uB3D9\uD558\uACE0 \uAE68\uB057\uD55C \uAE30\uBCF8 \uD504\uB86C\uD504\uD2B8\uB97C \uBCF5\uC6D0\uD569\uB2C8\uB2E4.",
  "useDefaultsBtn": "\uAE30\uBCF8\uAC12 \uC0AC\uC6A9",
  "devMode": "\uAC1C\uBC1C\uC790 \uBAA8\uB4DC",
  "devModeOn": "\uACE0\uAE09 \uC124\uC815\uC774 \uD65C\uC131\uD654\uB418\uC5C8\uC2B5\uB2C8\uB2E4",
  "devModeOff": "\uACE0\uAE09 \uC124\uC815 \uD45C\uC2DC (AI \uC81C\uACF5\uC5C5\uCCB4, API \uD0A4, \uC11C\uBC84 \uD3EC\uD2B8)",
  "aiModelConfig": "AI \uBAA8\uB378 \uAD6C\uC131",
  "localModelConfig": "\uB85C\uCEEC LLM \uAD6C\uC131",
  "aiProvider": "1. AI \uC81C\uACF5\uC5C5\uCCB4",
  "aiProviderDesc": "\uB85C\uCEEC \uC2E4\uD589\uAE30(Ollama, LM Studio), OpenRouter \uB610\uB294 \uD074\uB77C\uC6B0\uB4DC AI \uC81C\uACF5\uC5C5\uCCB4 \uC120\uD0DD",
  "localApiType": "API \uC720\uD615",
  "localApiTypeDesc": "\uB85C\uCEEC \uC2E4\uD589\uAE30\uC5D0\uC11C \uC0AC\uC6A9\uD558\uB294 \uD504\uB85C\uD1A0\uCF5C \uD615\uC2DD",
  "localEndpoint": "\uB85C\uCEEC \uC11C\uBC84 \uC5D4\uB4DC\uD3EC\uC778\uD2B8",
  "localEndpointOllamaDesc": "Ollama \uAE30\uBCF8 \uCC44\uD305 URL (\uAE30\uBCF8\uAC12: http://127.0.0.1:11434/api/chat)",
  "localEndpointOpenAiDesc": "\uB85C\uCEEC \uC2E4\uD589\uAE30\uC6A9 OpenAI \uD638\uD658 \uCC44\uD305 \uC5D4\uB4DC\uD3EC\uC778\uD2B8",
  "localPresets": "\uD504\uB9AC\uC14B: ",
  "localApiKeyDesc": "\uB85C\uCEEC LLM\uC6A9 (\uC120\uD0DD \uC0AC\uD56D). \uC778\uC99D\uC774 \uD544\uC694 \uC5C6\uB294 \uACBD\uC6B0 \uBE44\uC6CC \uB450\uC138\uC694.",
  "aiModelFamily": "2. \uBAA8\uB378 \uD328\uBC00\uB9AC",
  "aiModelFamilyDesc": "OpenRouter\uC758 \uBAA8\uB378 \uBCA4\uB354 \uB610\uB294 \uC544\uD0A4\uD14D\uCC98 \uADF8\uB8F9 \uC120\uD0DD",
  "modelVersion": "3. \uBAA8\uB378 \uBC84\uC804",
  "modelVersionDesc": 'OpenRouter\uC5D0 "{model}"\uB85C \uC804\uB2EC\uB429\uB2C8\uB2E4',
  "aiModel": "2. \uBAA8\uB378",
  "aiModelDesc": "\uBD84\uC11D\uC5D0 \uC0AC\uC6A9\uD560 \uBAA8\uB378 ({provider})",
  "customModel": "\uC0AC\uC6A9\uC790 \uC9C0\uC815 \uBAA8\uB378 \uC774\uB984",
  "customModelDesc": "\uBAA8\uB378 ID \uC785\uB825 (\uC608: mistralai/mistral-large)",
  "aiApiKey": "API \uD0A4",
  "openRouterApiKeyDesc": "OpenRouter API \uD0A4 (openrouter.ai/keys)",
  "providerApiKeyDesc": "{provider} API \uD0A4",
  "creditStatusTitleLocal": "\uB85C\uCEEC LLM \uC5F0\uACB0 \uC0C1\uD0DC",
  "creditStatusTitleCloud": "AI \uD06C\uB808\uB527 \uBC0F \uC794\uC561",
  "creditCheckingLocal": "\uB85C\uCEEC \uC11C\uBC84 \uC5F0\uACB0 \uD655\uC778 \uC911...",
  "creditCheckingCloud": "\uC81C\uACF5\uC5C5\uCCB4 \uC794\uC561 \uD655\uC778 \uC911...",
  "refresh": "\uC0C8\uB85C\uACE0\uCE68",
  "checking": "\uD655\uC778 \uC911...",
  "remainingBalance": "\u{1F4B0} \uC794\uC561: {balance} ({status})",
  "providerStatus": "\u2139\uFE0F \uC81C\uACF5\uC5C5\uCCB4: {provider} \u2014 {status}",
  "creditCheckFailed": "\u26A0\uFE0F \uD06C\uB808\uB527 \uD655\uC778 \uC2E4\uD328: {error}",
  "processingHeader": "\uCC98\uB9AC \uBC0F \uCCAD\uD0B9",
  "chunkWindowChars": "\uCCAD\uD06C \uC708\uB3C4\uC6B0 \uD06C\uAE30",
  "chunkWindowCharsDesc": "\uCCAD\uD06C\uB2F9 \uCD5C\uB300 \uAE00\uC790 \uC218 (~30,000\uC790 \u2248 8,000\uD1A0\uD070). \uCD08\uACFC\uD558\uB294 \uAE34 \uCF58\uD150\uCE20\uB294 \uC5EC\uB7EC \uBD80\uBD84\uC73C\uB85C \uB098\uB269\uB2C8\uB2E4.",
  "sectionGridSeconds": "\uC139\uC158 \uADF8\uB9AC\uB4DC \uAC04\uACA9",
  "sectionGridSecondsDesc": "\uCC55\uD130 \uC815\uBCF4\uAC00 \uC5C6\uB294 \uC601\uC0C1\uC758 \uCC55\uD130 \uB9F5 \uC0DD\uC131\uC744 \uC704\uD55C \uC2DC\uAC04 \uAC04\uACA9(\uCD08, \uAE30\uBCF8\uAC12: 300\uCD08 / 5\uBD84).",
  "maxTokens": "\uCD5C\uB300 \uC644\uB8CC \uD1A0\uD070 \uC218",
  "maxTokensDesc": "AI \uC751\uB2F5\uC5D0 \uD560\uB2F9\uB41C \uCD5C\uB300 \uD1A0\uD070 \uC218 (\uAE30\uBCF8\uAC12: 16384).",
  "serverHeader": "\uC11C\uBC84",
  "serverPort": "\uC11C\uBC84 \uD3EC\uD2B8",
  "serverPortDesc": "Chrome \uD655\uC7A5 \uD504\uB85C\uADF8\uB7A8\uACFC \uC5F0\uACB0\uD558\uB294 \uB85C\uCEEC HTTP \uC11C\uBC84 \uD3EC\uD2B8 (\uC7AC\uC2DC\uC791 \uD544\uC694)",
  "linksHeader": "\uB9C1\uD06C \uBC0F \uB9AC\uC18C\uC2A4",
  "nuteggChromeStoreName": "Chrome \uC6F9 \uC2A4\uD1A0\uC5B4\uC758 NutEgg",
  "nuteggChromeStoreDesc": "Google Chrome\uC6A9 NutEgg \uD655\uC7A5 \uD504\uB85C\uADF8\uB7A8\uC744 \uC124\uCE58\uD558\uAC70\uB098 \uC5C5\uB370\uC774\uD2B8\uD569\uB2C8\uB2E4.",
  "openChromeWebStore": "Chrome \uC6F9 \uC2A4\uD1A0\uC5B4 \uC5F4\uAE30 \u2197",
  "nuteggObsidianPluginName": "Obsidian \uCEE4\uBBA4\uB2C8\uD2F0 \uD50C\uB7EC\uADF8\uC778\uC758 NutEgg",
  "nuteggObsidianPluginDesc": "Obsidian \uCEE4\uBBA4\uB2C8\uD2F0 \uD50C\uB7EC\uADF8\uC778 \uB514\uB809\uD130\uB9AC\uC5D0\uC11C NutEgg\uB97C \uD655\uC778\uD569\uB2C8\uB2E4.",
  "openObsidianDirectory": "Obsidian \uB514\uB809\uD130\uB9AC \uC5F4\uAE30 \u2197",
  "cmdNewEgg": "\uC0C8 Egg \uD30C\uC77C \uC0DD\uC131",
  "cmdOpenIndex": "\uC778\uB371\uC2A4 \uD30C\uC77C \uC5F4\uAE30",
  "cmdMergeCurrent": "\uD604\uC7AC Egg\uC758 \uBBF8\uCC98\uB9AC \uD56D\uBAA9 \uBCD1\uD569",
  "cmdCheckCredit": "AI \uC81C\uACF5\uC5C5\uCCB4 \uD06C\uB808\uB527 \uBC0F \uC794\uC561 \uD655\uC778",
  "cmdUseDefaultWorkflowPrompts": "\uAE30\uBCF8 \uC6CC\uD06C\uD50C\uB85C\uC6B0 \uD504\uB86C\uD504\uD2B8 \uBCF5\uC6D0 (\uAE30\uC874 \uBC31\uC5C5)",
  "cmdReportBug": "GitHub\uC5D0 \uBC84\uADF8 \uBCF4\uACE0",
  "ribbonOpenIndex": "NutEgg: \uC778\uB371\uC2A4 \uC5F4\uAE30",
  "ribbonCheckCredit": "NutEgg: AI \uD06C\uB808\uB527 \uD655\uC778",
  "serverStarted": "NutEgg \uC11C\uBC84\uAC00 \uD3EC\uD2B8 {port}\uC5D0\uC11C \uC2DC\uC791\uB418\uC5C8\uC2B5\uB2C8\uB2E4",
  "serverFailed": "NutEgg: \uC11C\uBC84 \uC2DC\uC791 \uC2E4\uD328. \uCF58\uC194 \uB85C\uADF8\uB97C \uD655\uC778\uD558\uC138\uC694.",
  "indexNotFound": "NutEgg: {path} \uD30C\uC77C\uC744 \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. Egg \uC544\uC774\uCF58\uC744 \uD074\uB9AD\uD558\uC5EC \uC0DD\uC131\uD558\uC138\uC694.",
  "noActiveFile": "NutEgg: \uD65C\uC131\uD654\uB41C \uD30C\uC77C\uC774 \uC5C6\uC2B5\uB2C8\uB2E4",
  "notEggNote": "NutEgg: \uD65C\uC131 \uD30C\uC77C\uC774 Egg \uB178\uD2B8\uAC00 \uC544\uB2D9\uB2C8\uB2E4",
  "mergingEntries": "NutEgg: {name}\uC758 \uBBF8\uCC98\uB9AC \uD56D\uBAA9 \uBCD1\uD569 \uC911...",
  "mergedEntries": "[NutEgg] {count}\uAC1C \uD56D\uBAA9\uC744 \uC9C0\uC2DD \uD2B8\uB9AC\uC5D0 \uBCD1\uD569\uD588\uC2B5\uB2C8\uB2E4",
  "noUnprocessed": "[NutEgg] \uBCD1\uD569\uD560 \uBBF8\uCC98\uB9AC \uD56D\uBAA9\uC774 \uC5C6\uAC70\uB098 \uCC98\uB9AC\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.",
  "mergeFailed": "[NutEgg] \uBCD1\uD569 \uC2E4\uD328: {error}",
  "workflowReset": "[NutEgg] \uC6CC\uD06C\uD50C\uB85C\uC6B0\uB97C \uAE30\uBCF8\uAC12\uC73C\uB85C \uC7AC\uC124\uC815\uD588\uC2B5\uB2C8\uB2E4. \uAE30\uC874 \uD30C\uC77C\uC740 {folder}\uB85C \uC774\uB3D9\uB418\uC5C8\uC2B5\uB2C8\uB2E4",
  "eggNameRequired": "NutEgg: \uC62C\uBC14\uB978 Egg \uC774\uB984\uC744 \uC785\uB825\uD558\uC138\uC694.",
  "eggAlreadyExists": "NutEgg: {path} \uD30C\uC77C\uC774 \uC774\uBBF8 \uC874\uC7AC\uD569\uB2C8\uB2E4.",
  "eggCreated": "NutEgg: {path} \uD30C\uC77C \uC0DD\uC131 \uC644\uB8CC",
  "indexSynced": "[NutEgg] \uC778\uB371\uC2A4 \uB3D9\uAE30\uD654 \uC644\uB8CC: {summary}",
  "indexAllSynced": "[NutEgg] \uBAA8\uB4E0 \uD56D\uBAA9\uC774 \uCD5C\uC2E0 \uC0C1\uD0DC\uC785\uB2C8\uB2E4.",
  "indexSyncFailed": "[NutEgg] \uB3D9\uAE30\uD654 \uC2E4\uD328: {error}",
  "createEggTitle": "\u{1F423} \uC0C8 Egg \uC0DD\uC131",
  "eggNameLabel": "Egg \uC774\uB984 (\uD30C\uC77C\uBA85):",
  "eggNamePlaceholder": "\uC608: methodology, invest_strategy...",
  "eggDescLabel": "\uC124\uBA85 (\uB2E4\uB8E8\uB294 \uBC94\uC704):",
  "eggDescPlaceholder": "\uC608: \uC2E4\uC804 \uBC29\uBC95\uB860\uACFC \uC804\uB7B5...",
  "eggLangHint": "\u{1F310} \uC9C0\uCE68 \uBC0F \uACB0\uACFC\uBB3C \uC5B8\uC5B4\uB294 \uC124\uBA85 \uC5B8\uC5B4\uC640 \uC77C\uCE58\uD558\uAC8C \uC124\uC815\uB429\uB2C8\uB2E4.",
  "cancel": "\uCDE8\uC18C",
  "createEgg": "Egg \uC0DD\uC131",
  "creatingEgg": "\u23F3 Egg \uC0DD\uC131 \uC911...",
  "mergeUnprocessed": "\uBBF8\uCC98\uB9AC \uB178\uD2B8 \uBCD1\uD569",
  "mergeUnprocessedPlural": "{count}\uAC1C \uBBF8\uCC98\uB9AC \uB178\uD2B8 \uBCD1\uD569",
  "merging": "\uBCD1\uD569 \uC911...",
  "mergeButtonText": "\u26A1 \uC9C0\uC2DD \uD2B8\uB9AC\uC5D0 \uBCD1\uD569",
  "mergingWithAi": "\u23F3 AI\uB85C \uBCD1\uD569 \uC911...",
  "mergedSuccess": "\u2705 \uBCD1\uD569 \uC644\uB8CC!",
  "treeUpToDate": "\u2705 \uC9C0\uC2DD \uD2B8\uB9AC\uAC00 \uCD5C\uC2E0 \uC0C1\uD0DC\uC785\uB2C8\uB2E4",
  "unprocessedEntries": "\u{1F95A} {count}\uAC1C \uBBF8\uCC98\uB9AC {entries}",
  "entrySingle": "\uD56D\uBAA9",
  "entryPlural": "\uD56D\uBAA9",
  "mergeNoChanges": "[NutEgg] \uBCC0\uACBD \uC0AC\uD56D\uC774 \uC5C6\uAC70\uB098 \uBCD1\uD569\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4. \uCF58\uC194\uC744 \uD655\uC778\uD558\uC138\uC694.",
  "syncIndex": "\uC778\uB371\uC2A4 \uB3D9\uAE30\uD654",
  "syncingIndex": "\uB3D9\uAE30\uD654 \uC911...",
  "newEggButton": "+ \uC0C8 Egg",
  "unprocessedBadge": "{count}\uAC1C \uBBF8\uCC98\uB9AC"
};

// src/i18n/ar.ts
var ar = {
  "settingsTitle": "\u0625\u0639\u062F\u0627\u062F\u0627\u062A NutEgg",
  "chromeCompanionName": "\u0625\u0636\u0627\u0641\u0629 \u0645\u062A\u0635\u0641\u062D Chrome \u0627\u0644\u0645\u0631\u0627\u0641\u0642\u0629",
  "chromeCompanionDesc": "\u0627\u0644\u062A\u0642\u0637 \u0627\u0644\u0645\u0642\u0627\u0644\u0627\u062A \u0648\u0641\u064A\u062F\u064A\u0648\u0647\u0627\u062A YouTube \u0648\u0627\u0644\u062A\u063A\u0631\u064A\u062F\u0627\u062A \u0648\u062D\u0644\u0644\u0647\u0627 \u0645\u0628\u0627\u0634\u0631\u0629 \u0645\u0646 \u0645\u062A\u0635\u0641\u062D\u0643 \u0625\u0644\u0649 Obsidian.",
  "getChromeExtension": "\u0627\u0644\u062D\u0635\u0648\u0644 \u0639\u0644\u0649 \u0625\u0636\u0627\u0641\u0629 Chrome \u2197",
  "reportBugName": "\u0627\u0644\u0625\u0628\u0644\u0627\u063A \u0639\u0646 \u062E\u0637\u0623",
  "reportBugDesc": "\u0647\u0644 \u0648\u0627\u062C\u0647\u062A \u0645\u0634\u0643\u0644\u0629 \u0623\u0648 \u062E\u0637\u0623 \u063A\u064A\u0631 \u0645\u062A\u0648\u0642\u0639\u061F \u062A\u0648\u0627\u0635\u0644 \u0645\u0639\u0646\u0627 \u0639\u0628\u0631 GitHub.",
  "reportBugBtn": "\u{1F41B} \u0627\u0644\u0625\u0628\u0644\u0627\u063A \u0639\u0646 \u062E\u0637\u0623 \u0641\u064A GitHub \u2197",
  "vaultPathsHeader": "\u0645\u0633\u0627\u0631\u0627\u062A \u0627\u0644\u062E\u0632\u0627\u0646\u0629",
  "rawFolder": "\u0645\u062C\u0644\u062F \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u062E\u0627\u0645",
  "rawFolderDesc": "\u0645\u062C\u0644\u062F \u0644\u062D\u0641\u0638 \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u062E\u0627\u0645 \u0627\u0644\u0645\u0644\u062A\u0642\u0637",
  "indexFile": "\u0645\u0644\u0641 \u0627\u0644\u0641\u0647\u0631\u0633",
  "indexFileDesc": "\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0630\u064A \u064A\u0631\u0628\u0637 \u0627\u0644\u0640 eggs \u0628\u0645\u0644\u0641\u0627\u062A markdown \u0627\u0644\u062E\u0627\u0635\u0629 \u0628\u0647\u0627",
  "workflowFolder": "\u0645\u062C\u0644\u062F \u0645\u062D\u0631\u0643 \u0633\u064A\u0631 \u0627\u0644\u0639\u0645\u0644",
  "workflowFolderDesc": "\u0645\u062C\u0644\u062F \u062D\u0641\u0638 \u062A\u0648\u062C\u064A\u0647\u0627\u062A \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0648\u0627\u0644\u0642\u0648\u0627\u0639\u062F \u0643\u0645\u0644\u0641\u0627\u062A markdown \u0642\u0627\u0628\u0644\u0629 \u0644\u0644\u062A\u0639\u062F\u064A\u0644",
  "useDefaultWorkflows": "\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u062A\u0648\u062C\u064A\u0647\u0627\u062A \u0633\u064A\u0631 \u0627\u0644\u0639\u0645\u0644 \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A\u0629",
  "useDefaultWorkflowsDesc": "\u064A\u0646\u0642\u0644 \u0627\u0644\u0645\u0644\u0641\u0627\u062A \u0627\u0644\u062D\u0627\u0644\u064A\u0629 \u0625\u0644\u0649 \u0645\u062C\u0644\u062F \u0646\u0633\u062E \u0627\u062D\u062A\u064A\u0627\u0637\u064A \u0645\u0624\u0631\u062E \u0641\u064A _backup/ \u0648\u064A\u0633\u062A\u0639\u064A\u062F \u0627\u0644\u062A\u0648\u062C\u064A\u0647\u0627\u062A \u0627\u0644\u0623\u0635\u0644\u064A\u0629.",
  "useDefaultsBtn": "\u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A",
  "devMode": "\u0648\u0636\u0639 \u0627\u0644\u0645\u0637\u0648\u0631",
  "devModeOn": "\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u062A\u0642\u062F\u0645\u0629 \u0645\u0631\u0626\u064A\u0629 \u0623\u062F\u0646\u0627\u0647",
  "devModeOff": "\u0625\u0638\u0647\u0627\u0631 \u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u062A\u0642\u062F\u0645\u0629 (\u0645\u0632\u0648\u062F \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A\u060C \u0645\u0641\u062A\u0627\u062D API\u060C \u0645\u0646\u0641\u0630 \u0627\u0644\u062E\u0627\u062F\u0645)",
  "aiModelConfig": "\u062A\u0643\u0648\u064A\u0646 \u0646\u0645\u0648\u0630\u062C \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A",
  "localModelConfig": "\u062A\u0643\u0648\u064A\u0646 \u0627\u0644\u0646\u0645\u0648\u0630\u062C \u0627\u0644\u0645\u062D\u0644\u064A (Local LLM)",
  "aiProvider": "1. \u0645\u0632\u0648\u062F \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A",
  "aiProviderDesc": "\u0627\u062E\u062A\u0631 \u0645\u0634\u063A\u0644\u0627\u064B \u0645\u062D\u0644\u064A\u0627\u064B (Ollama, LM Studio)\u060C OpenRouter \u0623\u0648 \u0645\u0632\u0648\u062F\u0627\u064B \u0633\u062D\u0627\u0628\u064A\u0627\u064B",
  "localApiType": "\u0646\u0648\u0639 API",
  "localApiTypeDesc": "\u0635\u064A\u063A\u0629 \u0627\u0644\u0628\u0631\u0648\u062A\u0648\u0643\u0648\u0644 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u0629 \u0645\u0646 \u0627\u0644\u0645\u0634\u063A\u0644 \u0627\u0644\u0645\u062D\u0644\u064A",
  "localEndpoint": "\u0646\u0642\u0637\u0629 \u0646\u0647\u0627\u064A\u0629 \u0627\u0644\u062E\u0627\u062F\u0645 \u0627\u0644\u0645\u062D\u0644\u064A",
  "localEndpointOllamaDesc": "\u0639\u0646\u0648\u0627\u0646 URL \u0644\u0645\u062D\u0627\u062F\u062B\u0629 Ollama \u0627\u0644\u0623\u0635\u0644\u064A (\u0627\u0641\u062A\u0631\u0627\u0636\u064A: http://127.0.0.1:11434/api/chat)",
  "localEndpointOpenAiDesc": "\u0639\u0646\u0648\u0627\u0646 URL \u0645\u062A\u0648\u0627\u0641\u0642 \u0645\u0639 OpenAI \u0644\u0644\u0645\u0634\u063A\u0644 \u0627\u0644\u0645\u062D\u0644\u064A",
  "localPresets": "\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u0633\u0628\u0642\u0629: ",
  "localApiKeyDesc": "\u0627\u062E\u062A\u064A\u0627\u0631\u064A \u0644\u0644\u0646\u0645\u0627\u0630\u062C \u0627\u0644\u0645\u062D\u0644\u064A\u0629. \u0627\u062A\u0631\u0643\u0647 \u0641\u0627\u0631\u063A\u0627\u064B \u0625\u0630\u0627 \u0644\u0645 \u064A\u062A\u0637\u0644\u0628 \u062E\u0627\u062F\u0645\u0643 \u0645\u0635\u0627\u062F\u0642\u0629.",
  "aiModelFamily": "2. \u0639\u0627\u0626\u0644\u0629 \u0627\u0644\u0646\u0645\u0648\u0630\u062C",
  "aiModelFamilyDesc": "\u0627\u062E\u062A\u0631 \u0645\u0648\u0641\u0631 \u0627\u0644\u0646\u0645\u0648\u0630\u062C \u0623\u0648 \u0645\u062C\u0645\u0648\u0639\u0629 \u0627\u0644\u0628\u0646\u064A\u0629 \u0641\u064A OpenRouter",
  "modelVersion": "3. \u0625\u0635\u062F\u0627\u0631 \u0627\u0644\u0646\u0645\u0648\u0630\u062C",
  "modelVersionDesc": '\u064A\u062A\u0645 \u0625\u0631\u0633\u0627\u0644\u0647 \u0625\u0644\u0649 OpenRouter \u0628\u0627\u0633\u0645 "{model}"',
  "aiModel": "2. \u0627\u0644\u0646\u0645\u0648\u0630\u062C",
  "aiModelDesc": "\u0627\u0644\u0646\u0645\u0648\u0630\u062C \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0644\u0644\u062A\u062D\u0644\u064A\u0644 ({provider})",
  "customModel": "\u0627\u0633\u0645 \u0646\u0645\u0648\u0630\u062C \u0645\u062E\u0635\u0635",
  "customModelDesc": "\u0623\u062F\u062E\u0644 \u0645\u0639\u0631\u0651\u0641 \u0627\u0644\u0646\u0645\u0648\u0630\u062C (\u0645\u062B\u0627\u0644: mistralai/mistral-large)",
  "aiApiKey": "\u0645\u0641\u062A\u0627\u062D API",
  "openRouterApiKeyDesc": "\u0645\u0641\u062A\u0627\u062D API \u0627\u0644\u062E\u0627\u0635 \u0628\u0643 \u0641\u064A OpenRouter (openrouter.ai/keys)",
  "providerApiKeyDesc": "\u0645\u0641\u062A\u0627\u062D API \u0644\u0640 {provider}",
  "creditStatusTitleLocal": "\u062D\u0627\u0644\u0629 \u0627\u062A\u0635\u0627\u0644 \u0627\u0644\u0646\u0645\u0648\u0630\u062C \u0627\u0644\u0645\u062D\u0644\u064A",
  "creditStatusTitleCloud": "\u0631\u0635\u064A\u062F \u0648\u0631\u0635\u064A\u062F \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A",
  "creditCheckingLocal": "\u062C\u0627\u0631\u064D \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u062A\u0635\u0627\u0644 \u0627\u0644\u062E\u0627\u062F\u0645 \u0627\u0644\u0645\u062D\u0644\u064A...",
  "creditCheckingCloud": "\u062C\u0627\u0631\u064D \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0631\u0635\u064A\u062F \u0627\u0644\u062D\u0633\u0627\u0628 \u0644\u062F\u0649 \u0627\u0644\u0645\u0632\u0648\u062F...",
  "refresh": "\u062A\u062D\u062F\u064A\u062B",
  "checking": "\u062C\u0627\u0631\u064D \u0627\u0644\u062A\u062D\u0642\u0642...",
  "remainingBalance": "\u{1F4B0} \u0627\u0644\u0631\u0635\u064A\u062F \u0627\u0644\u0645\u062A\u0628\u0642\u064A: {balance} ({status})",
  "providerStatus": "\u2139\uFE0F \u0627\u0644\u0645\u0632\u0648\u062F: {provider} \u2014 {status}",
  "creditCheckFailed": "\u26A0\uFE0F \u0641\u0634\u0644 \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0627\u0644\u0631\u0635\u064A\u062F: {error}",
  "processingHeader": "\u0627\u0644\u0645\u0639\u0627\u0644\u062C\u0629 \u0648\u0627\u0644\u062A\u0642\u0633\u064A\u0645",
  "chunkWindowChars": "\u062D\u062C\u0645 \u0646\u0627\u0641\u0630\u0629 \u0627\u0644\u062A\u0642\u0633\u064A\u0645 \u0627\u0644\u0639\u0627\u0645\u0629",
  "chunkWindowCharsDesc": "\u0627\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0644\u0639\u062F\u062F \u0627\u0644\u0623\u062D\u0631\u0641 \u0644\u0643\u0644 \u062C\u0632\u0621 (~30,000 \u062D\u0631\u0641 \u2248 8,000 \u062A\u0648\u0643\u0646). \u0627\u0644\u0645\u062D\u062A\u0648\u0649 \u0627\u0644\u0623\u0637\u0648\u0644 \u064A\u064F\u0642\u0633\u0645 \u0625\u0644\u0649 \u0623\u062C\u0632\u0627\u0621.",
  "sectionGridSeconds": "\u0641\u0627\u0635\u0644 \u0634\u0628\u0643\u0629 \u0627\u0644\u0623\u0642\u0633\u0627\u0645",
  "sectionGridSecondsDesc": "\u0627\u0644\u0641\u0627\u0635\u0644 \u0627\u0644\u0632\u0645\u0646\u064A \u0628\u0627\u0644\u062B\u0648\u0627\u0646\u064A (\u0627\u0641\u062A\u0631\u0627\u0636\u064A: 300 \u062B / 5 \u062F\u0642\u0627\u0626\u0642) \u0644\u062A\u0648\u0644\u064A\u062F \u062E\u0631\u064A\u0637\u0629 \u0627\u0644\u0641\u0635\u0648\u0644 \u0644\u0644\u0641\u064A\u062F\u064A\u0648\u0647\u0627\u062A \u0628\u062F\u0648\u0646 \u0641\u0635\u0648\u0644 \u0623\u0635\u0644\u064A\u0629.",
  "maxTokens": "\u0627\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0644\u062A\u0648\u0643\u0646\u0627\u062A \u0627\u0644\u0625\u062E\u0631\u0627\u062C",
  "maxTokensDesc": "\u0627\u0644\u062D\u062F \u0627\u0644\u0623\u0642\u0635\u0649 \u0644\u062A\u0648\u0643\u0646\u0627\u062A \u0627\u0644\u0625\u062E\u0631\u0627\u062C \u0627\u0644\u0645\u062E\u0635\u0635\u0629 \u0644\u0627\u0633\u062A\u062C\u0627\u0628\u0629 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A (\u0627\u0641\u062A\u0631\u0627\u0636\u064A: 16384).",
  "serverHeader": "\u0627\u0644\u062E\u0627\u062F\u0645",
  "serverPort": "\u0645\u0646\u0641\u0630 \u0627\u0644\u062E\u0627\u062F\u0645",
  "serverPortDesc": "\u0645\u0646\u0641\u0630 \u062E\u0627\u062F\u0645 HTTP \u0627\u0644\u0645\u062D\u0644\u064A \u0644\u0644\u0627\u062A\u0635\u0627\u0644 \u0628\u0625\u0636\u0627\u0641\u0629 Chrome (\u064A\u062A\u0637\u0644\u0628 \u0625\u0639\u0627\u062F\u0629 \u062A\u0634\u063A\u064A\u0644)",
  "linksHeader": "\u0627\u0644\u0631\u0648\u0627\u0628\u0637 \u0648\u0627\u0644\u0645\u0648\u0627\u0631\u062F",
  "nuteggChromeStoreName": "NutEgg \u0639\u0644\u0649 \u0645\u062A\u062C\u0631 Chrome \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A",
  "nuteggChromeStoreDesc": "\u062A\u062B\u0628\u064A\u062A \u0623\u0648 \u062A\u062D\u062F\u064A\u062B \u0625\u0636\u0627\u0641\u0629 NutEgg \u0644\u0645\u062A\u0635\u0641\u062D Google Chrome.",
  "openChromeWebStore": "\u0641\u062A\u062D \u0645\u062A\u062C\u0631 Chrome \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u2197",
  "nuteggObsidianPluginName": "NutEgg \u0641\u064A \u0645\u062A\u062C\u0631 \u0625\u0636\u0627\u0641\u0627\u062A Obsidian",
  "nuteggObsidianPluginDesc": "\u0639\u0631\u0636 NutEgg \u0641\u064A \u062F\u0644\u064A\u0644 \u0625\u0636\u0627\u0641\u0627\u062A \u0645\u062C\u062A\u0645\u0639 Obsidian.",
  "openObsidianDirectory": "\u0641\u062A\u062D \u062F\u0644\u064A\u0644 Obsidian \u2197",
  "cmdNewEgg": "\u0625\u0646\u0634\u0627\u0621 \u0645\u0644\u0641 egg \u062C\u062F\u064A\u062F",
  "cmdOpenIndex": "\u0641\u062A\u062D \u0645\u0644\u0641 \u0627\u0644\u0641\u0647\u0631\u0633",
  "cmdMergeCurrent": "\u062F\u0645\u062C \u0627\u0644\u0639\u0646\u0627\u0635\u0631 \u063A\u064A\u0631 \u0627\u0644\u0645\u0639\u0627\u0644\u062C\u0629 \u0641\u064A \u0627\u0644\u0640 egg \u0627\u0644\u062D\u0627\u0644\u064A",
  "cmdCheckCredit": "\u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0631\u0635\u064A\u062F \u0645\u0632\u0648\u062F \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A",
  "cmdUseDefaultWorkflowPrompts": "\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u062A\u0648\u062C\u064A\u0647\u0627\u062A \u0633\u064A\u0631 \u0627\u0644\u0639\u0645\u0644 \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A\u0629 (\u0646\u0633\u062E \u0627\u062D\u062A\u064A\u0627\u0637\u064A \u0644\u0644\u062D\u0627\u0644\u064A\u0629)",
  "cmdReportBug": "\u0627\u0644\u0625\u0628\u0644\u0627\u063A \u0639\u0646 \u062E\u0637\u0623 \u0641\u064A GitHub",
  "ribbonOpenIndex": "NutEgg: \u0641\u062A\u062D \u0627\u0644\u0641\u0647\u0631\u0633",
  "ribbonCheckCredit": "NutEgg: \u0627\u0644\u062A\u062D\u0642\u0642 \u0645\u0646 \u0631\u0635\u064A\u062F \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A",
  "serverStarted": "\u062A\u0645 \u062A\u0634\u063A\u064A\u0644 \u062E\u0627\u062F\u0645 NutEgg \u0639\u0644\u0649 \u0627\u0644\u0645\u0646\u0641\u0630 {port}",
  "serverFailed": "NutEgg: \u0641\u0634\u0644 \u0628\u062F\u0621 \u062A\u0634\u063A\u064A\u0644 \u0627\u0644\u062E\u0627\u062F\u0645. \u062A\u062D\u0642\u0642 \u0645\u0646 \u0648\u062D\u062F\u0629 \u0627\u0644\u062A\u062D\u0643\u0645 \u0644\u0644\u062A\u0641\u0627\u0635\u064A\u0644.",
  "indexNotFound": "NutEgg: \u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 {path}. \u0627\u0646\u0642\u0631 \u0639\u0644\u0649 \u0623\u064A\u0642\u0648\u0646\u0629 \u0627\u0644\u0640 egg \u0644\u0625\u0646\u0634\u0627\u0626\u0647.",
  "noActiveFile": "NutEgg: \u0644\u0627 \u064A\u0648\u062C\u062F \u0645\u0644\u0641 \u0646\u0634\u0637",
  "notEggNote": "NutEgg: \u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0646\u0634\u0637 \u0644\u064A\u0633 \u0645\u0644\u0627\u062D\u0638\u0629 egg",
  "mergingEntries": "NutEgg: \u062C\u0627\u0631\u064D \u062F\u0645\u062C \u0627\u0644\u0639\u0646\u0627\u0635\u0631 \u063A\u064A\u0631 \u0627\u0644\u0645\u0639\u0627\u0644\u062C\u0629 \u0641\u064A {name}...",
  "mergedEntries": "[NutEgg] \u062A\u0645 \u062F\u0645\u062C {count} \u0645\u0646 \u0627\u0644\u0639\u0646\u0627\u0635\u0631 \u0641\u064A \u0634\u062C\u0631\u0629 \u0627\u0644\u0645\u0639\u0631\u0641\u0629",
  "noUnprocessed": "[NutEgg] \u0644\u0627 \u062A\u0648\u062C\u062F \u0639\u0646\u0627\u0635\u0631 \u063A\u064A\u0631 \u0645\u0639\u0627\u0644\u062C\u0629 \u0644\u0644\u062F\u0645\u062C \u0623\u0648 \u0641\u0634\u0644\u062A \u0627\u0644\u0639\u0645\u0644\u064A\u0629.",
  "mergeFailed": "[NutEgg] \u0641\u0634\u0644 \u0627\u0644\u062F\u0645\u062C: {error}",
  "workflowReset": "[NutEgg] \u062A\u0645\u062A \u0627\u0633\u062A\u0639\u0627\u062F\u0629 \u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u062A\u0648\u062C\u064A\u0647\u0627\u062A \u0627\u0644\u0627\u0641\u062A\u0631\u0627\u0636\u064A\u0629. \u062A\u0645 \u0646\u0642\u0644 \u0627\u0644\u0645\u0644\u0641\u0627\u062A \u0627\u0644\u0633\u0627\u0628\u0642\u0629 \u0625\u0644\u0649 {folder}",
  "eggNameRequired": "NutEgg: \u064A\u0631\u062C\u0649 \u0625\u062F\u062E\u0627\u0644 \u0627\u0633\u0645 egg \u0635\u0627\u0644\u062D.",
  "eggAlreadyExists": "NutEgg: {path} \u0645\u0648\u062C\u0648\u062F \u0645\u0633\u0628\u0642\u0627\u064B.",
  "eggCreated": "NutEgg: \u062A\u0645 \u0625\u0646\u0634\u0627\u0621 {path}",
  "indexSynced": "[NutEgg] \u062A\u0645\u062A \u0645\u0632\u0627\u0645\u0646\u0629 \u0627\u0644\u0641\u0647\u0631\u0633: {summary}",
  "indexAllSynced": "[NutEgg] \u0643\u0644 \u0634\u064A\u0621 \u0645\u062A\u0632\u0627\u0645\u0646 \u0628\u0627\u0644\u0643\u0627\u0645\u0644.",
  "indexSyncFailed": "[NutEgg] \u0641\u0634\u0644\u062A \u0627\u0644\u0645\u0632\u0627\u0645\u0646\u0629: {error}",
  "createEggTitle": "\u{1F423} \u0625\u0646\u0634\u0627\u0621 Egg \u062C\u062F\u064A\u062F",
  "eggNameLabel": "\u0627\u0633\u0645 \u0627\u0644\u0640 Egg (\u0627\u0633\u0645 \u0627\u0644\u0645\u0644\u0641):",
  "eggNamePlaceholder": "\u0645\u062B\u0627\u0644: methodology, invest_strategy...",
  "eggDescLabel": "\u0627\u0644\u0648\u0635\u0641 (\u0646\u0637\u0627\u0642 \u0645\u0627 \u064A\u063A\u0637\u064A\u0647):",
  "eggDescPlaceholder": "\u0645\u062B\u0627\u0644: \u0627\u0644\u0637\u0631\u0642 \u0627\u0644\u0639\u0645\u0644\u064A\u0629 \u0648\u0627\u0644\u062A\u0643\u062A\u064A\u0643\u0627\u062A...",
  "eggLangHint": "\u{1F310} \u0633\u062A\u062A\u0637\u0627\u0628\u0642 \u0644\u063A\u0629 \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u0627\u062A \u0648\u0627\u0644\u0645\u062E\u0631\u062C\u0627\u062A \u0645\u0639 \u0644\u063A\u0629 \u0627\u0644\u0648\u0635\u0641 \u0627\u0644\u0645\u0643\u062A\u0648\u0628.",
  "cancel": "\u0625\u0644\u063A\u0627\u0621",
  "createEgg": "\u0625\u0646\u0634\u0627\u0621 Egg",
  "creatingEgg": "\u23F3 \u062C\u0627\u0631\u064D \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0640 egg...",
  "mergeUnprocessed": "\u062F\u0645\u062C \u0645\u0644\u0627\u062D\u0638\u0629 \u063A\u064A\u0631 \u0645\u0639\u0627\u0644\u062C\u0629",
  "mergeUnprocessedPlural": "\u062F\u0645\u062C {count} \u0645\u0644\u0627\u062D\u0638\u0627\u062A \u063A\u064A\u0631 \u0645\u0639\u0627\u0644\u062C\u0629",
  "merging": "\u062C\u0627\u0631\u064D \u0627\u0644\u062F\u0645\u062C...",
  "mergeButtonText": "\u26A1 \u062F\u0645\u062C \u0641\u064A \u0634\u062C\u0631\u0629 \u0627\u0644\u0645\u0639\u0631\u0641\u0629",
  "mergingWithAi": "\u23F3 \u062C\u0627\u0631\u064D \u0627\u0644\u062F\u0645\u062C \u0628\u0648\u0627\u0633\u0637\u0629 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A...",
  "mergedSuccess": "\u2705 \u062A\u0645 \u0627\u0644\u062F\u0645\u062C \u0628\u0646\u062C\u0627\u062D!",
  "treeUpToDate": "\u2705 \u0634\u062C\u0631\u0629 \u0627\u0644\u0645\u0639\u0631\u0641\u0629 \u0645\u062D\u062F\u062B\u0629 \u0628\u0627\u0644\u0643\u0627\u0645\u0644",
  "unprocessedEntries": "\u{1F95A} {count} {entries} \u063A\u064A\u0631 \u0645\u0639\u0627\u0644\u062C\u0629",
  "entrySingle": "\u0639\u0646\u0635\u0631",
  "entryPlural": "\u0639\u0646\u0627\u0635\u0631",
  "mergeNoChanges": "[NutEgg] \u0644\u0645 \u064A\u0646\u062A\u062C \u0639\u0646 \u0627\u0644\u062F\u0645\u062C \u0623\u064A \u062A\u063A\u064A\u064A\u0631\u0627\u062A \u0623\u0648 \u062D\u062F\u062B \u062E\u0637\u0623.",
  "syncIndex": "\u0645\u0632\u0627\u0645\u0646\u0629 \u0627\u0644\u0641\u0647\u0631\u0633",
  "syncingIndex": "\u062C\u0627\u0631\u064D \u0627\u0644\u0645\u0632\u0627\u0645\u0646\u0629...",
  "newEggButton": "+ Egg \u062C\u062F\u064A\u062F",
  "unprocessedBadge": "{count} \u063A\u064A\u0631 \u0645\u0639\u0627\u0644\u062C"
};

// src/i18n/fr.ts
var fr = {
  "settingsTitle": "Param\xE8tres NutEgg",
  "chromeCompanionName": "Compagnon extension Chrome",
  "chromeCompanionDesc": "Capturez et analysez des articles, vid\xE9os YouTube et tweets directement depuis votre navigateur dans Obsidian.",
  "getChromeExtension": "Obtenir l'extension Chrome \u2197",
  "reportBugName": "Signaler un bug",
  "reportBugDesc": "Un probl\xE8me, un comportement inattendu ou besoin d'aide ? Signalez-le sur GitHub.",
  "reportBugBtn": "\u{1F41B} Signaler un bug sur GitHub \u2197",
  "vaultPathsHeader": "Chemins du coffre",
  "rawFolder": "Dossier du contenu brut",
  "rawFolderDesc": "Dossier de stockage du contenu brut captur\xE9",
  "indexFile": "Fichier d'index",
  "indexFileDesc": "Fichier associant les eggs \xE0 leurs fichiers markdown",
  "workflowFolder": "Dossier du moteur de flux",
  "workflowFolderDesc": "Dossier o\xF9 sont stock\xE9s les prompts IA, sch\xE9mas et r\xE8gles sous forme de fichiers markdown \xE9ditables",
  "useDefaultWorkflows": "Utiliser les prompts de flux par d\xE9faut",
  "useDefaultWorkflowsDesc": "D\xE9place les fichiers actuels de nutegg/_workflow vers un dossier horodat\xE9 sous _backup/ et restaure les versions par d\xE9faut.",
  "useDefaultsBtn": "Restaurer les valeurs par d\xE9faut",
  "devMode": "Mode d\xE9veloppeur",
  "devModeOn": "Les param\xE8tres avanc\xE9s sont visibles ci-dessous",
  "devModeOff": "Afficher les param\xE8tres avanc\xE9s (fournisseur IA, cl\xE9 API, port serveur)",
  "aiModelConfig": "Configuration du mod\xE8le IA",
  "localModelConfig": "Configuration LLM local",
  "aiProvider": "1. Fournisseur d'IA",
  "aiProviderDesc": "Choisissez un moteur local (Ollama, LM Studio), OpenRouter ou un fournisseur cloud",
  "localApiType": "Type d'API",
  "localApiTypeDesc": "Format de protocole utilis\xE9 par votre moteur local",
  "localEndpoint": "Point de terminaison local",
  "localEndpointOllamaDesc": "URL de chat Ollama native (d\xE9faut : http://127.0.0.1:11434/api/chat)",
  "localEndpointOpenAiDesc": "URL compatible OpenAI pour votre moteur local",
  "localPresets": "Pr\xE9r\xE9glages : ",
  "localApiKeyDesc": "Optionnel pour les LLM locaux. Laissez vide si aucune authentification n'est requise.",
  "aiModelFamily": "2. Famille de mod\xE8le",
  "aiModelFamilyDesc": "Choisissez le fournisseur ou groupe d'architecture sur OpenRouter",
  "modelVersion": "3. Version du mod\xE8le",
  "modelVersionDesc": 'Envoy\xE9 \xE0 OpenRouter comme "{model}"',
  "aiModel": "2. Mod\xE8le",
  "aiModelDesc": "Mod\xE8le \xE0 utiliser pour l'analyse ({provider})",
  "customModel": "Nom du mod\xE8le personnalis\xE9",
  "customModelDesc": "Entrez l'identifiant du mod\xE8le (ex. mistralai/mistral-large)",
  "aiApiKey": "Cl\xE9 API",
  "openRouterApiKeyDesc": "Votre cl\xE9 API OpenRouter (openrouter.ai/keys)",
  "providerApiKeyDesc": "Votre cl\xE9 API {provider}",
  "creditStatusTitleLocal": "Statut de connexion LLM local",
  "creditStatusTitleCloud": "Cr\xE9dit & solde IA",
  "creditCheckingLocal": "V\xE9rification de la connexion au serveur local...",
  "creditCheckingCloud": "V\xE9rification du solde aupr\xE8s du fournisseur...",
  "refresh": "Actualiser",
  "checking": "V\xE9rification...",
  "remainingBalance": "\u{1F4B0} Solde restant : {balance} ({status})",
  "providerStatus": "\u2139\uFE0F Fournisseur : {provider} \u2014 {status}",
  "creditCheckFailed": "\u26A0\uFE0F \xC9chec de la v\xE9rification du cr\xE9dit : {error}",
  "processingHeader": "Traitement et d\xE9coupage",
  "chunkWindowChars": "Taille de fen\xEAtre de d\xE9coupage",
  "chunkWindowCharsDesc": "Longueur maximale de caract\xE8res par bloc (~30 000 caract\xE8res \u2248 8 000 tokens). Les longs contenus sont fractionn\xE9s.",
  "sectionGridSeconds": "Intervalle de grille de section",
  "sectionGridSecondsDesc": "Intervalle en secondes (d\xE9faut : 300 s / 5 min) pour g\xE9n\xE9rer des cartes de chapitres pour les vid\xE9os sans chapitrage.",
  "maxTokens": "Tokens de sortie max",
  "maxTokensDesc": "Tokens maximum allou\xE9s aux appels IA (d\xE9faut : 16384).",
  "serverHeader": "Serveur",
  "serverPort": "Port du serveur",
  "serverPortDesc": "Port du serveur HTTP local connect\xE9 \xE0 l'extension Chrome (red\xE9marrage requis)",
  "linksHeader": "Liens et ressources",
  "nuteggChromeStoreName": "NutEgg sur le Chrome Web Store",
  "nuteggChromeStoreDesc": "Installez ou mettez \xE0 jour l'extension NutEgg pour Google Chrome.",
  "openChromeWebStore": "Ouvrir le Chrome Web Store \u2197",
  "nuteggObsidianPluginName": "NutEgg sur les plugins communautaires Obsidian",
  "nuteggObsidianPluginDesc": "Voir NutEgg dans le catalogue des plugins Obsidian.",
  "openObsidianDirectory": "Ouvrir le catalogue Obsidian \u2197",
  "cmdNewEgg": "Cr\xE9er un nouveau fichier egg",
  "cmdOpenIndex": "Ouvrir le fichier d'index",
  "cmdMergeCurrent": "Fusionner les entr\xE9es non trait\xE9es de l'egg actuel",
  "cmdCheckCredit": "V\xE9rifier le cr\xE9dit IA et le solde",
  "cmdUseDefaultWorkflowPrompts": "Utiliser les prompts par d\xE9faut (sauvegarder l'existant)",
  "cmdReportBug": "Signaler un bug sur GitHub",
  "ribbonOpenIndex": "NutEgg : Ouvrir l'index",
  "ribbonCheckCredit": "NutEgg : V\xE9rifier le cr\xE9dit IA",
  "serverStarted": "Serveur NutEgg d\xE9marr\xE9 sur le port {port}",
  "serverFailed": "NutEgg : \xC9chec du d\xE9marrage du serveur. Consultez la console pour plus de d\xE9tails.",
  "indexNotFound": "NutEgg : {path} introuvable. Cliquez sur l'ic\xF4ne egg pour le cr\xE9er.",
  "noActiveFile": "NutEgg : Aucun fichier actif",
  "notEggNote": "NutEgg : Le fichier actif n'est pas une note egg",
  "mergingEntries": "NutEgg : Fusion des entr\xE9es non trait\xE9es dans {name}...",
  "mergedEntries": "[NutEgg] {count} entr\xE9es fusionn\xE9es dans l'arbre de connaissances",
  "noUnprocessed": "[NutEgg] Aucune entr\xE9e non trait\xE9e \xE0 fusionner ou la fusion a \xE9chou\xE9.",
  "mergeFailed": "[NutEgg] \xC9chec de la fusion : {error}",
  "workflowReset": "[NutEgg] Fichiers de flux r\xE9initialis\xE9s. Anciens fichiers d\xE9plac\xE9s vers {folder}",
  "eggNameRequired": "NutEgg : Veuillez entrer un nom d'egg valide.",
  "eggAlreadyExists": "NutEgg : {path} existe d\xE9j\xE0.",
  "eggCreated": "NutEgg : {path} cr\xE9\xE9 avec succ\xE8s",
  "indexSynced": "[NutEgg] Index synchronis\xE9 : {summary}",
  "indexAllSynced": "[NutEgg] Tout est parfaitement synchronis\xE9.",
  "indexSyncFailed": "[NutEgg] \xC9chec de la synchronisation : {error}",
  "createEggTitle": "\u{1F423} Cr\xE9er un nouvel Egg",
  "eggNameLabel": "Nom de l'Egg (nom du fichier) :",
  "eggNamePlaceholder": "ex. methodologie, strategie_investissement...",
  "eggDescLabel": "Description (champ couvert) :",
  "eggDescPlaceholder": "ex. m\xE9thodes pratiques et tactiques...",
  "eggLangHint": "\u{1F310} La langue des instructions correspondra \xE0 la langue de la description.",
  "cancel": "Annuler",
  "createEgg": "Cr\xE9er l'Egg",
  "creatingEgg": "\u23F3 Cr\xE9ation de l'egg...",
  "mergeUnprocessed": "Fusionner la note non trait\xE9e",
  "mergeUnprocessedPlural": "Fusionner {count} notes non trait\xE9es",
  "merging": "Fusion en cours...",
  "mergeButtonText": "\u26A1 Fusionner dans l'arbre de connaissances",
  "mergingWithAi": "\u23F3 Fusion par IA en cours...",
  "mergedSuccess": "\u2705 Fusionn\xE9 !",
  "treeUpToDate": "\u2705 L'arbre de connaissances est \xE0 jour",
  "unprocessedEntries": "\u{1F95A} {count} {entries} non trait\xE9e(s)",
  "entrySingle": "entr\xE9e",
  "entryPlural": "entr\xE9es",
  "mergeNoChanges": "[NutEgg] Aucun changement apport\xE9 ou \xE9chec de la fusion.",
  "syncIndex": "Synchroniser l'index",
  "syncingIndex": "Synchronisation...",
  "newEggButton": "+ Nouvel Egg",
  "unprocessedBadge": "{count} non trait\xE9(s)"
};

// src/i18n/de.ts
var de = {
  "settingsTitle": "NutEgg Einstellungen",
  "chromeCompanionName": "Chrome-Erweiterung Begleiter",
  "chromeCompanionDesc": "Erfasse und analysiere Artikel, YouTube-Videos und Tweets direkt aus deinem Browser in Obsidian.",
  "getChromeExtension": "Chrome-Erweiterung herunterladen \u2197",
  "reportBugName": "Fehler melden",
  "reportBugDesc": "Hast du ein Problem gefunden oder ben\xF6tigst Hilfe? Melde es auf GitHub.",
  "reportBugBtn": "\u{1F41B} Fehler auf GitHub melden \u2197",
  "vaultPathsHeader": "Vault-Pfade",
  "rawFolder": "Rohinhalte-Ordner",
  "rawFolderDesc": "Ordner f\xFCr gespeicherte Rohinhalte",
  "indexFile": "Index-Datei",
  "indexFileDesc": "Datei, die Eggs ihren Markdown-Dateien zuordnet",
  "workflowFolder": "Workflow-Engine-Ordner",
  "workflowFolderDesc": "Ordner, in dem KI-Prompts, Schemas und Pipelineregeln als editierbare Markdown-Dateien gespeichert werden",
  "useDefaultWorkflows": "Standard-Workflow-Prompts verwenden",
  "useDefaultWorkflowsDesc": "Verschiebt alle aktuellen Dateien in nutegg/_workflow in einen datierten Backup-Ordner in _backup/ und stellt saubere Defaults wieder her.",
  "useDefaultsBtn": "Standards wiederherstellen",
  "devMode": "Entwicklermodus",
  "devModeOn": "Erweiterte Einstellungen sind unten sichtbar",
  "devModeOff": "Erweiterte Einstellungen anzeigen (KI-Anbieter, API-Schl\xFCssel, Server-Port)",
  "aiModelConfig": "KI-Modell-Konfiguration",
  "localModelConfig": "Lokale LLM-Konfiguration",
  "aiProvider": "1. KI-Anbieter",
  "aiProviderDesc": "W\xE4hle einen lokalen Runner (Ollama, LM Studio), OpenRouter oder einen Cloud-Anbieter",
  "localApiType": "API-Typ",
  "localApiTypeDesc": "Von deinem lokalen Runner verwendetes Protokollformat",
  "localEndpoint": "Lokaler Server-Endpunkt",
  "localEndpointOllamaDesc": "Native Ollama Chat-URL (Standard: http://127.0.0.1:11434/api/chat)",
  "localEndpointOpenAiDesc": "OpenAI-kompatible Chat-URL f\xFCr deinen lokalen Runner",
  "localPresets": "Voreinstellungen: ",
  "localApiKeyDesc": "Optional f\xFCr lokale LLMs. Leer lassen, wenn keine Authentifizierung erforderlich ist.",
  "aiModelFamily": "2. Modell-Familie",
  "aiModelFamilyDesc": "W\xE4hle den Modellanbieter oder die Architekturgruppe auf OpenRouter",
  "modelVersion": "3. Modell-Version",
  "modelVersionDesc": 'Wird an OpenRouter als "{model}" gesendet',
  "aiModel": "2. Modell",
  "aiModelDesc": "Modell f\xFCr die Analyse ({provider})",
  "customModel": "Benutzerdefinierter Modellname",
  "customModelDesc": "Modell-ID eingeben (z. B. mistralai/mistral-large)",
  "aiApiKey": "API-Schl\xFCssel",
  "openRouterApiKeyDesc": "Dein OpenRouter API-Schl\xFCssel (openrouter.ai/keys)",
  "providerApiKeyDesc": "Dein API-Schl\xFCssel f\xFCr {provider}",
  "creditStatusTitleLocal": "Verbindungsstatus des lokalen LLM",
  "creditStatusTitleCloud": "KI-Guthaben & Kontostand",
  "creditCheckingLocal": "Verbindung zum lokalen Server wird gepr\xFCft...",
  "creditCheckingCloud": "Guthaben beim Anbieter wird abgefragt...",
  "refresh": "Aktualisieren",
  "checking": "Pr\xFCfen...",
  "remainingBalance": "\u{1F4B0} Verbleibendes Guthaben: {balance} ({status})",
  "providerStatus": "\u2139\uFE0F Anbieter: {provider} \u2014 {status}",
  "creditCheckFailed": "\u26A0\uFE0F Guthabenabfrage fehlgeschlagen: {error}",
  "processingHeader": "Verarbeitung & Chunking",
  "chunkWindowChars": "Chunk-Fenstergr\xF6\xDFe",
  "chunkWindowCharsDesc": "Maximale Zeichenanzahl pro Block (~30.000 Zeichen \u2248 8.000 Tokens). L\xE4ngere Inhalte werden in Teile zerlegt.",
  "sectionGridSeconds": "Abschnittsgitter-Intervall",
  "sectionGridSecondsDesc": "Zeitintervall in Sekunden (Standard: 300 s / 5 Min.) zur Erstellung von Kapitelkarten f\xFCr Videos ohne Kapitel.",
  "maxTokens": "Max. Ausgabetokens",
  "maxTokensDesc": "Maximal zugewiesene Tokens f\xFCr KI-Antworten (Standard: 16384).",
  "serverHeader": "Server",
  "serverPort": "Server-Port",
  "serverPortDesc": "Port f\xFCr den lokalen HTTP-Server zur Verbindung mit der Chrome-Erweiterung (erfordert Neustart)",
  "linksHeader": "Links & Ressourcen",
  "nuteggChromeStoreName": "NutEgg im Chrome Web Store",
  "nuteggChromeStoreDesc": "Installiere oder aktualisiere die NutEgg-Erweiterung f\xFCr Google Chrome.",
  "openChromeWebStore": "Chrome Web Store \xF6ffnen \u2197",
  "nuteggObsidianPluginName": "NutEgg in Obsidian Community-Plugins",
  "nuteggObsidianPluginDesc": "NutEgg im Verzeichnis der Obsidian Community-Plugins anzeigen.",
  "openObsidianDirectory": "Obsidian-Verzeichnis \xF6ffnen \u2197",
  "cmdNewEgg": "Neue Egg-Datei erstellen",
  "cmdOpenIndex": "Index-Datei \xF6ffnen",
  "cmdMergeCurrent": "Unverarbeitete Eintr\xE4ge im aktuellen Egg zusammenf\xFChren",
  "cmdCheckCredit": "KI-Anbieter-Guthaben pr\xFCfen",
  "cmdUseDefaultWorkflowPrompts": "Standard-Prompts verwenden (vorherige sichern)",
  "cmdReportBug": "Fehler auf GitHub melden",
  "ribbonOpenIndex": "NutEgg: Index \xF6ffnen",
  "ribbonCheckCredit": "NutEgg: KI-Guthaben pr\xFCfen",
  "serverStarted": "NutEgg-Server auf Port {port} gestartet",
  "serverFailed": "NutEgg: Serverstart fehlgeschlagen. Details in der Konsole.",
  "indexNotFound": "NutEgg: {path} nicht gefunden. Klicke auf das Egg-Symbol, um sie zu erstellen.",
  "noActiveFile": "NutEgg: Keine aktive Datei",
  "notEggNote": "NutEgg: Die aktive Datei ist keine Egg-Notiz",
  "mergingEntries": "NutEgg: Unverarbeitete Eintr\xE4ge in {name} zusammenf\xFChren...",
  "mergedEntries": "[NutEgg] {count} Eintr\xE4ge in den Wissensbaum zusammengef\xFChrt",
  "noUnprocessed": "[NutEgg] Keine unverarbeiteten Eintr\xE4ge vorhanden oder Zusammenf\xFChrung fehlgeschlagen.",
  "mergeFailed": "[NutEgg] Zusammenf\xFChrung fehlgeschlagen: {error}",
  "workflowReset": "[NutEgg] Workflow-Dateien auf Standard zur\xFCckgesetzt. Fr\xFChere Dateien nach {folder} verschoben",
  "eggNameRequired": "NutEgg: Bitte einen g\xFCltigen Egg-Namen eingeben.",
  "eggAlreadyExists": "NutEgg: {path} existiert bereits.",
  "eggCreated": "NutEgg: {path} erstellt",
  "indexSynced": "[NutEgg] Index synchronisiert: {summary}",
  "indexAllSynced": "[NutEgg] Alles ist auf dem neuesten Stand.",
  "indexSyncFailed": "[NutEgg] Synchronisierung fehlgeschlagen: {error}",
  "createEggTitle": "\u{1F423} Neues Egg erstellen",
  "eggNameLabel": "Egg-Name (Dateiname):",
  "eggNamePlaceholder": "z.B. methodik, investitionsstrategie...",
  "eggDescLabel": "Beschreibung (Themenbereich):",
  "eggDescPlaceholder": "z.B. praktische Methoden und Taktiken...",
  "eggLangHint": "\u{1F310} Die Sprache der Anweisungen und Ergebnisse entspricht der Sprache der Beschreibung.",
  "cancel": "Abbrechen",
  "createEgg": "Egg erstellen",
  "creatingEgg": "\u23F3 Egg wird erstellt...",
  "mergeUnprocessed": "Unverarbeitete Notiz zusammenf\xFChren",
  "mergeUnprocessedPlural": "{count} unverarbeitete Notizen zusammenf\xFChren",
  "merging": "Zusammenf\xFChren...",
  "mergeButtonText": "\u26A1 In Wissensbaum zusammenf\xFChren",
  "mergingWithAi": "\u23F3 Zusammenf\xFChrung mit KI...",
  "mergedSuccess": "\u2705 Zusammengef\xFChrt!",
  "treeUpToDate": "\u2705 Wissensbaum ist aktuell",
  "unprocessedEntries": "\u{1F95A} {count} unverarbeitete {entries}",
  "entrySingle": "Eintrag",
  "entryPlural": "Eintr\xE4ge",
  "mergeNoChanges": "[NutEgg] Zusammenf\xFChrung ergab keine \xC4nderungen oder ist fehlgeschlagen.",
  "syncIndex": "Index synchronisieren",
  "syncingIndex": "Synchronisiere...",
  "newEggButton": "+ Neues Egg",
  "unprocessedBadge": "{count} unverarbeitet"
};

// src/i18n/pt.ts
var pt = {
  "settingsTitle": "Configura\xE7\xF5es do NutEgg",
  "chromeCompanionName": "Extens\xE3o complementar do Chrome",
  "chromeCompanionDesc": "Capture e analise artigos, v\xEDdeos do YouTube e tweets diretamente do navegador no Obsidian.",
  "getChromeExtension": "Obter extens\xE3o do Chrome \u2197",
  "reportBugName": "Relatar um bug",
  "reportBugDesc": "Encontrou um problema, comportamento inesperado ou precisa de ajuda? Avise-nos no GitHub.",
  "reportBugBtn": "\u{1F41B} Relatar bug no GitHub \u2197",
  "vaultPathsHeader": "Caminhos do cofre",
  "rawFolder": "Pasta de conte\xFAdo bruto",
  "rawFolderDesc": "Pasta para armazenar o conte\xFAdo bruto capturado",
  "indexFile": "Arquivo de \xEDndice",
  "indexFileDesc": "Arquivo que mapeia eggs para seus respectivos arquivos markdown",
  "workflowFolder": "Pasta do motor de fluxos",
  "workflowFolderDesc": "Pasta onde os prompts de IA, esquemas e regras ficam salvos como arquivos markdown edit\xE1veis",
  "useDefaultWorkflows": "Usar prompts de fluxo padr\xE3o",
  "useDefaultWorkflowsDesc": "Move todos os arquivos atuais de nutegg/_workflow para uma pasta de backup em _backup/ e restaura os padr\xF5es limpos.",
  "useDefaultsBtn": "Restaurar padr\xF5es",
  "devMode": "Modo desenvolvedor",
  "devModeOn": "Configura\xE7\xF5es avan\xE7adas vis\xEDveis abaixo",
  "devModeOff": "Mostrar configura\xE7\xF5es avan\xE7adas (provedor de IA, chave de API, porta do servidor)",
  "aiModelConfig": "Configura\xE7\xE3o do modelo de IA",
  "localModelConfig": "Configura\xE7\xE3o de LLM local",
  "aiProvider": "1. Provedor de IA",
  "aiProviderDesc": "Escolha um executor local (Ollama, LM Studio), OpenRouter ou um provedor na nuvem",
  "localApiType": "Tipo de API",
  "localApiTypeDesc": "Formato do protocolo usado pelo executor local",
  "localEndpoint": "Endpoint do servidor local",
  "localEndpointOllamaDesc": "URL nativa de chat do Ollama (padr\xE3o: http://127.0.0.1:11434/api/chat)",
  "localEndpointOpenAiDesc": "URL de chat compat\xEDvel com OpenAI para seu executor local",
  "localPresets": "Predefini\xE7\xF5es: ",
  "localApiKeyDesc": "Opcional para LLMs locais. Deixe em branco se seu servidor local n\xE3o exigir autentica\xE7\xE3o.",
  "aiModelFamily": "2. Fam\xEDlia do modelo",
  "aiModelFamilyDesc": "Escolha o fornecedor ou grupo de arquitetura no OpenRouter",
  "modelVersion": "3. Vers\xE3o do modelo",
  "modelVersionDesc": 'Enviado ao OpenRouter como "{model}"',
  "aiModel": "2. Modelo",
  "aiModelDesc": "Modelo usado para an\xE1lise ({provider})",
  "customModel": "Nome do modelo personalizado",
  "customModelDesc": "Insira o ID do modelo (ex: mistralai/mistral-large)",
  "aiApiKey": "Chave de API",
  "openRouterApiKeyDesc": "Sua chave de API do OpenRouter (openrouter.ai/keys)",
  "providerApiKeyDesc": "Sua chave de API do {provider}",
  "creditStatusTitleLocal": "Status de conex\xE3o do LLM local",
  "creditStatusTitleCloud": "Cr\xE9dito e saldo de IA",
  "creditCheckingLocal": "Verificando conex\xE3o com o servidor local...",
  "creditCheckingCloud": "Verificando saldo com o provedor...",
  "refresh": "Atualizar",
  "checking": "Verificando...",
  "remainingBalance": "\u{1F4B0} Saldo restante: {balance} ({status})",
  "providerStatus": "\u2139\uFE0F Provedor: {provider} \u2014 {status}",
  "creditCheckFailed": "\u26A0\uFE0F Falha ao verificar cr\xE9dito: {error}",
  "processingHeader": "Processamento e divis\xE3o em partes",
  "chunkWindowChars": "Tamanho da janela de divis\xE3o",
  "chunkWindowCharsDesc": "Comprimento m\xE1ximo de caracteres por bloco (~30.000 caracteres \u2248 8.000 tokens). Conte\xFAdos longos s\xE3o particionados.",
  "sectionGridSeconds": "Intervalo de grade de se\xE7\xF5es",
  "sectionGridSecondsDesc": "Intervalo de tempo em segundos (padr\xE3o: 300 s / 5 min) para gerar mapas de cap\xEDtulos para v\xEDdeos sem cap\xEDtulos originais.",
  "maxTokens": "Tokens m\xE1ximos de conclus\xE3o",
  "maxTokensDesc": "Tokens m\xE1ximos alocados para respostas de IA (padr\xE3o: 16384).",
  "serverHeader": "Servidor",
  "serverPort": "Porta do servidor",
  "serverPortDesc": "Porta para o servidor HTTP local conectado \xE0 extens\xE3o do Chrome (requer rein\xEDcio)",
  "linksHeader": "Links e recursos",
  "nuteggChromeStoreName": "NutEgg na Chrome Web Store",
  "nuteggChromeStoreDesc": "Instale ou atualize a extens\xE3o complementar NutEgg para o Google Chrome.",
  "openChromeWebStore": "Abrir Chrome Web Store \u2197",
  "nuteggObsidianPluginName": "NutEgg nos Plugins da Comunidade do Obsidian",
  "nuteggObsidianPluginDesc": "Ver NutEgg no diret\xF3rio de plugins comunit\xE1rios do Obsidian.",
  "openObsidianDirectory": "Abrir diret\xF3rio do Obsidian \u2197",
  "cmdNewEgg": "Criar novo arquivo egg",
  "cmdOpenIndex": "Abrir arquivo de \xEDndice",
  "cmdMergeCurrent": "Mesclar entradas n\xE3o processadas no egg atual",
  "cmdCheckCredit": "Verificar cr\xE9dito e saldo do provedor de IA",
  "cmdUseDefaultWorkflowPrompts": "Usar prompts de fluxo padr\xE3o (fazer backup dos atuais)",
  "cmdReportBug": "Relatar bug no GitHub",
  "ribbonOpenIndex": "NutEgg: Abrir \xEDndice",
  "ribbonCheckCredit": "NutEgg: Verificar cr\xE9dito de IA",
  "serverStarted": "Servidor NutEgg iniciado na porta {port}",
  "serverFailed": "NutEgg: Falha ao iniciar o servidor. Verifique o console para mais detalhes.",
  "indexNotFound": "NutEgg: {path} n\xE3o encontrado. Clique no \xEDcone de egg para cri\xE1-lo.",
  "noActiveFile": "NutEgg: Nenhum arquivo ativo",
  "notEggNote": "NutEgg: O arquivo ativo n\xE3o \xE9 uma nota egg",
  "mergingEntries": "NutEgg: Mesclando entradas n\xE3o processadas em {name}...",
  "mergedEntries": "[NutEgg] {count} entradas mescladas na \xE1rvore de conhecimento",
  "noUnprocessed": "[NutEgg] Nenhuma entrada n\xE3o processada para mesclar ou a mesclagem falhou.",
  "mergeFailed": "[NutEgg] Falha na mesclagem: {error}",
  "workflowReset": "[NutEgg] Arquivos de fluxo restaurados para os padr\xF5es. Arquivos anteriores movidos para {folder}",
  "eggNameRequired": "NutEgg: Insira um nome v\xE1lido para o egg.",
  "eggAlreadyExists": "NutEgg: {path} j\xE1 existe.",
  "eggCreated": "NutEgg: {path} criado com sucesso",
  "indexSynced": "[NutEgg] \xCDndice sincronizado: {summary}",
  "indexAllSynced": "[NutEgg] Tudo est\xE1 em sincronia.",
  "indexSyncFailed": "[NutEgg] Falha na sincroniza\xE7\xE3o: {error}",
  "createEggTitle": "\u{1F423} Criar novo Egg",
  "eggNameLabel": "Nome do Egg (nome do arquivo):",
  "eggNamePlaceholder": "ex: metodologia, estrategia_investimento...",
  "eggDescLabel": "Descri\xE7\xE3o (escopo coberto):",
  "eggDescPlaceholder": "ex: m\xE9todos pr\xE1ticos e t\xE1ticas...",
  "eggLangHint": "\u{1F310} O idioma das instru\xE7\xF5es e resultados corresponder\xE1 ao idioma da descri\xE7\xE3o.",
  "cancel": "Cancelar",
  "createEgg": "Criar Egg",
  "creatingEgg": "\u23F3 Criando egg...",
  "mergeUnprocessed": "Mesclar nota n\xE3o processada",
  "mergeUnprocessedPlural": "Mesclar {count} notas n\xE3o processadas",
  "merging": "Mesclando...",
  "mergeButtonText": "\u26A1 Mesclar na \xE1rvore de conhecimento",
  "mergingWithAi": "\u23F3 Mesclando com IA...",
  "mergedSuccess": "\u2705 Mesclado!",
  "treeUpToDate": "\u2705 A \xE1rvore de conhecimento est\xE1 atualizada",
  "unprocessedEntries": "\u{1F95A} {count} {entries} n\xE3o processada(s)",
  "entrySingle": "entrada",
  "entryPlural": "entradas",
  "mergeNoChanges": "[NutEgg] Nenhuma altera\xE7\xE3o gerada ou falha na mesclagem.",
  "syncIndex": "Sincronizar \xEDndice",
  "syncingIndex": "Sincronizando...",
  "newEggButton": "+ Novo Egg",
  "unprocessedBadge": "{count} n\xE3o processada(s)"
};

// src/i18n/ru.ts
var ru = {
  "settingsTitle": "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 NutEgg",
  "chromeCompanionName": "\u0420\u0430\u0441\u0448\u0438\u0440\u0435\u043D\u0438\u0435-\u043A\u043E\u043C\u043F\u0430\u043D\u044C\u043E\u043D \u0434\u043B\u044F Chrome",
  "chromeCompanionDesc": "\u0421\u043E\u0445\u0440\u0430\u043D\u044F\u0439\u0442\u0435 \u0438 \u0430\u043D\u0430\u043B\u0438\u0437\u0438\u0440\u0443\u0439\u0442\u0435 \u0441\u0442\u0430\u0442\u044C\u0438, \u0432\u0438\u0434\u0435\u043E YouTube \u0438 \u043F\u043E\u0441\u0442\u044B \u043F\u0440\u044F\u043C\u043E \u0438\u0437 \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0430 \u0432 Obsidian.",
  "getChromeExtension": "\u0421\u043A\u0430\u0447\u0430\u0442\u044C \u0440\u0430\u0441\u0448\u0438\u0440\u0435\u043D\u0438\u0435 \u0434\u043B\u044F Chrome \u2197",
  "reportBugName": "\u0421\u043E\u043E\u0431\u0449\u0438\u0442\u044C \u043E\u0431 \u043E\u0448\u0438\u0431\u043A\u0435",
  "reportBugDesc": "\u041D\u0430\u0448\u043B\u0438 \u043E\u0448\u0438\u0431\u043A\u0443 \u0438\u043B\u0438 \u043D\u0443\u0436\u043D\u0430 \u043F\u043E\u043C\u043E\u0449\u044C? \u0421\u043E\u043E\u0431\u0449\u0438\u0442\u0435 \u043D\u0430\u043C \u043D\u0430 GitHub.",
  "reportBugBtn": "\u{1F41B} \u0421\u043E\u043E\u0431\u0449\u0438\u0442\u044C \u043E\u0431 \u043E\u0448\u0438\u0431\u043A\u0435 \u043D\u0430 GitHub \u2197",
  "vaultPathsHeader": "\u041F\u0443\u0442\u0438 \u0432 \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0435",
  "rawFolder": "\u041F\u0430\u043F\u043A\u0430 \u0438\u0441\u0445\u043E\u0434\u043D\u044B\u0445 \u043C\u0430\u0442\u0435\u0440\u0438\u0430\u043B\u043E\u0432",
  "rawFolderDesc": "\u041F\u0430\u043F\u043A\u0430 \u0434\u043B\u044F \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F \u0438\u0441\u0445\u043E\u0434\u043D\u043E\u0433\u043E \u0432\u0435\u0431-\u043A\u043E\u043D\u0442\u0435\u043D\u0442\u0430",
  "indexFile": "\u0424\u0430\u0439\u043B \u0438\u043D\u0434\u0435\u043A\u0441\u0430",
  "indexFileDesc": "\u0424\u0430\u0439\u043B, \u0441\u0432\u044F\u0437\u044B\u0432\u0430\u044E\u0449\u0438\u0439 eggs \u0441 \u0441\u043E\u043E\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0443\u044E\u0449\u0438\u043C\u0438 markdown-\u0444\u0430\u0439\u043B\u0430\u043C\u0438",
  "workflowFolder": "\u041F\u0430\u043F\u043A\u0430 \u0434\u0432\u0438\u0436\u043A\u0430 \u0440\u0430\u0431\u043E\u0447\u0438\u0445 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u043E\u0432",
  "workflowFolderDesc": "\u041F\u0430\u043F\u043A\u0430, \u0433\u0434\u0435 \u043F\u0440\u043E\u043C\u043F\u0442\u044B \u0418\u0418, \u0441\u0445\u0435\u043C\u044B \u0438 \u043F\u0440\u0430\u0432\u0438\u043B\u0430 \u0445\u0440\u0430\u043D\u044F\u0442\u0441\u044F \u0432 \u0432\u0438\u0434\u0435 \u0440\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u0443\u0435\u043C\u044B\u0445 markdown-\u0444\u0430\u0439\u043B\u043E\u0432",
  "useDefaultWorkflows": "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C \u0441\u0442\u0430\u043D\u0434\u0430\u0440\u0442\u043D\u044B\u0435 \u043F\u0440\u043E\u043C\u043F\u0442\u044B",
  "useDefaultWorkflowsDesc": "\u041F\u0435\u0440\u0435\u043C\u0435\u0449\u0430\u0435\u0442 \u0442\u0435\u043A\u0443\u0449\u0438\u0435 \u0444\u0430\u0439\u043B\u044B \u0438\u0437 nutegg/_workflow \u0432 \u0440\u0435\u0437\u0435\u0440\u0432\u043D\u0443\u044E \u043F\u0430\u043F\u043A\u0443 \u0441 \u0434\u0430\u0442\u043E\u0439 \u0432 _backup/ \u0438 \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u0430\u0432\u043B\u0438\u0432\u0430\u0435\u0442 \u0447\u0438\u0441\u0442\u044B\u0435 \u0441\u0442\u0430\u043D\u0434\u0430\u0440\u0442\u043D\u044B\u0435 \u0448\u0430\u0431\u043B\u043E\u043D\u044B.",
  "useDefaultsBtn": "\u0412\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E",
  "devMode": "\u0420\u0435\u0436\u0438\u043C \u0440\u0430\u0437\u0440\u0430\u0431\u043E\u0442\u0447\u0438\u043A\u0430",
  "devModeOn": "\u0420\u0430\u0441\u0448\u0438\u0440\u0435\u043D\u043D\u044B\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u043E\u0442\u043E\u0431\u0440\u0430\u0436\u0430\u044E\u0442\u0441\u044F \u043D\u0438\u0436\u0435",
  "devModeOff": "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u0440\u0430\u0441\u0448\u0438\u0440\u0435\u043D\u043D\u044B\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 (\u043F\u0440\u043E\u0432\u0430\u0439\u0434\u0435\u0440 \u0418\u0418, API-\u043A\u043B\u044E\u0447, \u043F\u043E\u0440\u0442 \u0441\u0435\u0440\u0432\u0435\u0440\u0430)",
  "aiModelConfig": "\u041A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u044F \u043C\u043E\u0434\u0435\u043B\u0438 \u0418\u0418",
  "localModelConfig": "\u041A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u044F \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u043E\u0439 LLM",
  "aiProvider": "1. \u041F\u0440\u043E\u0432\u0430\u0439\u0434\u0435\u0440 \u0418\u0418",
  "aiProviderDesc": "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0439 \u0437\u0430\u043F\u0443\u0441\u043A (Ollama, LM Studio), OpenRouter \u0438\u043B\u0438 \u043E\u0431\u043B\u0430\u0447\u043D\u043E\u0433\u043E \u043F\u0440\u043E\u0432\u0430\u0439\u0434\u0435\u0440\u0430",
  "localApiType": "\u0422\u0438\u043F API",
  "localApiTypeDesc": "\u0424\u043E\u0440\u043C\u0430\u0442 \u043F\u0440\u043E\u0442\u043E\u043A\u043E\u043B\u0430 \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u043E\u0433\u043E \u0434\u0432\u0438\u0436\u043A\u0430",
  "localEndpoint": "\u042D\u043D\u0434\u043F\u043E\u0438\u043D\u0442 \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u043E\u0433\u043E \u0441\u0435\u0440\u0432\u0435\u0440\u0430",
  "localEndpointOllamaDesc": "\u041F\u0440\u044F\u043C\u043E\u0439 URL \u0447\u0430\u0442\u0430 Ollama (\u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E: http://127.0.0.1:11434/api/chat)",
  "localEndpointOpenAiDesc": "OpenAI-\u0441\u043E\u0432\u043C\u0435\u0441\u0442\u0438\u043C\u044B\u0439 URL \u0434\u043B\u044F \u0432\u0430\u0448\u0435\u0433\u043E \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u043E\u0433\u043E \u0434\u0432\u0438\u0436\u043A\u0430",
  "localPresets": "\u041F\u0440\u0435\u0441\u0435\u0442\u044B: ",
  "localApiKeyDesc": "\u041D\u0435\u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E \u0434\u043B\u044F \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0445 \u043C\u043E\u0434\u0435\u043B\u0435\u0439. \u041E\u0441\u0442\u0430\u0432\u044C\u0442\u0435 \u043F\u0443\u0441\u0442\u044B\u043C, \u0435\u0441\u043B\u0438 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u044F \u043D\u0435 \u0442\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F.",
  "aiModelFamily": "2. \u0421\u0435\u043C\u0435\u0439\u0441\u0442\u0432\u043E \u043C\u043E\u0434\u0435\u043B\u0435\u0439",
  "aiModelFamilyDesc": "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0440\u0430\u0437\u0440\u0430\u0431\u043E\u0442\u0447\u0438\u043A\u0430 \u043C\u043E\u0434\u0435\u043B\u0438 \u0438\u043B\u0438 \u0433\u0440\u0443\u043F\u043F\u0443 \u0430\u0440\u0445\u0438\u0442\u0435\u043A\u0442\u0443\u0440\u044B \u0432 OpenRouter",
  "modelVersion": "3. \u0412\u0435\u0440\u0441\u0438\u044F \u043C\u043E\u0434\u0435\u043B\u0438",
  "modelVersionDesc": '\u041E\u0442\u043F\u0440\u0430\u0432\u043B\u044F\u0435\u0442\u0441\u044F \u0432 OpenRouter \u043A\u0430\u043A "{model}"',
  "aiModel": "2. \u041C\u043E\u0434\u0435\u043B\u044C",
  "aiModelDesc": "\u041C\u043E\u0434\u0435\u043B\u044C \u0434\u043B\u044F \u0430\u043D\u0430\u043B\u0438\u0437\u0430 ({provider})",
  "customModel": "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C\u0441\u043A\u043E\u0435 \u0438\u043C\u044F \u043C\u043E\u0434\u0435\u043B\u0438",
  "customModelDesc": "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0438\u0434\u0435\u043D\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0440 \u043C\u043E\u0434\u0435\u043B\u0438 (\u043D\u0430\u043F\u0440. mistralai/mistral-large)",
  "aiApiKey": "API-\u043A\u043B\u044E\u0447",
  "openRouterApiKeyDesc": "\u0412\u0430\u0448 API-\u043A\u043B\u044E\u0447 OpenRouter (openrouter.ai/keys)",
  "providerApiKeyDesc": "\u0412\u0430\u0448 API-\u043A\u043B\u044E\u0447 {provider}",
  "creditStatusTitleLocal": "\u0421\u0442\u0430\u0442\u0443\u0441 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u043E\u0439 LLM",
  "creditStatusTitleCloud": "\u0411\u0430\u043B\u0430\u043D\u0441 \u0418\u0418",
  "creditCheckingLocal": "\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F \u043A \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u043E\u043C\u0443 \u0441\u0435\u0440\u0432\u0435\u0440\u0443...",
  "creditCheckingCloud": "\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u0431\u0430\u043B\u0430\u043D\u0441\u0430 \u0443 \u043F\u0440\u043E\u0432\u0430\u0439\u0434\u0435\u0440\u0430...",
  "refresh": "\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C",
  "checking": "\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430...",
  "remainingBalance": "\u{1F4B0} \u041E\u0441\u0442\u0430\u0442\u043E\u043A \u0431\u0430\u043B\u0430\u043D\u0441\u0430: {balance} ({status})",
  "providerStatus": "\u2139\uFE0F \u041F\u0440\u043E\u0432\u0430\u0439\u0434\u0435\u0440: {provider} \u2014 {status}",
  "creditCheckFailed": "\u26A0\uFE0F \u0421\u0431\u043E\u0439 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0438 \u0431\u0430\u043B\u0430\u043D\u0441\u0430: {error}",
  "processingHeader": "\u041E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0430 \u0438 \u0444\u0440\u0430\u0433\u043C\u0435\u043D\u0442\u0430\u0446\u0438\u044F",
  "chunkWindowChars": "\u0420\u0430\u0437\u043C\u0435\u0440 \u043E\u043A\u043D\u0430 \u0444\u0440\u0430\u0433\u043C\u0435\u043D\u0442\u0430",
  "chunkWindowCharsDesc": "\u041C\u0430\u043A\u0441\u0438\u043C\u0430\u043B\u044C\u043D\u043E\u0435 \u0447\u0438\u0441\u043B\u043E \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432 \u043D\u0430 \u0444\u0440\u0430\u0433\u043C\u0435\u043D\u0442 (~30 000 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432 \u2248 8 000 \u0442\u043E\u043A\u0435\u043D\u043E\u0432). \u0414\u043B\u0438\u043D\u043D\u044B\u0435 \u0442\u0435\u043A\u0441\u0442\u044B \u0434\u0435\u043B\u044F\u0442\u0441\u044F \u043D\u0430 \u0447\u0430\u0441\u0442\u0438.",
  "sectionGridSeconds": "\u0418\u043D\u0442\u0435\u0440\u0432\u0430\u043B \u0441\u0435\u0442\u043A\u0438 \u0440\u0430\u0437\u0434\u0435\u043B\u043E\u0432",
  "sectionGridSecondsDesc": "\u0418\u043D\u0442\u0435\u0440\u0432\u0430\u043B \u0432 \u0441\u0435\u043A\u0443\u043D\u0434\u0430\u0445 (\u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E: 300 \u0441 / 5 \u043C\u0438\u043D) \u0434\u043B\u044F \u0433\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u0438 \u043A\u0430\u0440\u0442\u044B \u0433\u043B\u0430\u0432 \u0432 \u0432\u0438\u0434\u0435\u043E \u0431\u0435\u0437 \u0440\u0430\u0437\u043C\u0435\u0442\u043A\u0438.",
  "maxTokens": "\u041C\u0430\u043A\u0441\u0438\u043C\u0443\u043C \u0442\u043E\u043A\u0435\u043D\u043E\u0432 \u0432\u044B\u0432\u043E\u0434\u0430",
  "maxTokensDesc": "\u041C\u0430\u043A\u0441\u0438\u043C\u0430\u043B\u044C\u043D\u043E\u0435 \u0447\u0438\u0441\u043B\u043E \u0442\u043E\u043A\u0435\u043D\u043E\u0432 \u0434\u043B\u044F \u043E\u0442\u0432\u0435\u0442\u0430 \u0418\u0418 (\u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E: 16384).",
  "serverHeader": "\u0421\u0435\u0440\u0432\u0435\u0440",
  "serverPort": "\u041F\u043E\u0440\u0442 \u0441\u0435\u0440\u0432\u0435\u0440\u0430",
  "serverPortDesc": "\u041F\u043E\u0440\u0442 \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u043E\u0433\u043E HTTP-\u0441\u0435\u0440\u0432\u0435\u0440\u0430 \u0434\u043B\u044F \u0441\u0432\u044F\u0437\u0438 \u0441 \u0440\u0430\u0441\u0448\u0438\u0440\u0435\u043D\u0438\u0435\u043C Chrome (\u0442\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u043F\u0435\u0440\u0435\u0437\u0430\u043F\u0443\u0441\u043A)",
  "linksHeader": "\u0421\u0441\u044B\u043B\u043A\u0438 \u0438 \u0440\u0435\u0441\u0443\u0440\u0441\u044B",
  "nuteggChromeStoreName": "NutEgg \u0432 Chrome Web Store",
  "nuteggChromeStoreDesc": "\u0423\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u0435 \u0438\u043B\u0438 \u043E\u0431\u043D\u043E\u0432\u0438\u0442\u0435 \u0440\u0430\u0441\u0448\u0438\u0440\u0435\u043D\u0438\u0435 NutEgg \u0434\u043B\u044F Google Chrome.",
  "openChromeWebStore": "\u041E\u0442\u043A\u0440\u044B\u0442\u044C Chrome Web Store \u2197",
  "nuteggObsidianPluginName": "NutEgg \u0432 \u043A\u0430\u0442\u0430\u043B\u043E\u0433\u0435 \u043F\u043B\u0430\u0433\u0438\u043D\u043E\u0432 Obsidian",
  "nuteggObsidianPluginDesc": "\u0421\u0442\u0440\u0430\u043D\u0438\u0446\u0430 NutEgg \u0432 \u043A\u0430\u0442\u0430\u043B\u043E\u0433\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u0430 Obsidian.",
  "openObsidianDirectory": "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043A\u0430\u0442\u0430\u043B\u043E\u0433 Obsidian \u2197",
  "cmdNewEgg": "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043D\u043E\u0432\u044B\u0439 \u0444\u0430\u0439\u043B egg",
  "cmdOpenIndex": "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0444\u0430\u0439\u043B \u0438\u043D\u0434\u0435\u043A\u0441\u0430",
  "cmdMergeCurrent": "\u041E\u0431\u044A\u0435\u0434\u0438\u043D\u0438\u0442\u044C \u043D\u0435\u043E\u0431\u0440\u0430\u0431\u043E\u0442\u0430\u043D\u043D\u044B\u0435 \u0437\u0430\u043F\u0438\u0441\u0438 \u0432 \u0442\u0435\u043A\u0443\u0449\u0435\u043C egg",
  "cmdCheckCredit": "\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u0431\u0430\u043B\u0430\u043D\u0441 \u043F\u0440\u043E\u0432\u0430\u0439\u0434\u0435\u0440\u0430 \u0418\u0418",
  "cmdUseDefaultWorkflowPrompts": "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C \u0441\u0442\u0430\u043D\u0434\u0430\u0440\u0442\u043D\u044B\u0435 \u043F\u0440\u043E\u043C\u043F\u0442\u044B (\u0441 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435\u043C \u0442\u0435\u043A\u0443\u0449\u0438\u0445)",
  "cmdReportBug": "\u0421\u043E\u043E\u0431\u0449\u0438\u0442\u044C \u043E\u0431 \u043E\u0448\u0438\u0431\u043A\u0435 \u043D\u0430 GitHub",
  "ribbonOpenIndex": "NutEgg: \u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0438\u043D\u0434\u0435\u043A\u0441",
  "ribbonCheckCredit": "NutEgg: \u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u0431\u0430\u043B\u0430\u043D\u0441 \u0418\u0418",
  "serverStarted": "\u0421\u0435\u0440\u0432\u0435\u0440 NutEgg \u0437\u0430\u043F\u0443\u0449\u0435\u043D \u043D\u0430 \u043F\u043E\u0440\u0442\u0443 {port}",
  "serverFailed": "NutEgg: \u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u044C \u0441\u0435\u0440\u0432\u0435\u0440. \u041F\u043E\u0434\u0440\u043E\u0431\u043D\u043E\u0441\u0442\u0438 \u0432 \u043A\u043E\u043D\u0441\u043E\u043B\u0438.",
  "indexNotFound": "NutEgg: {path} \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D. \u041D\u0430\u0436\u043C\u0438\u0442\u0435 \u043D\u0430 \u0438\u043A\u043E\u043D\u043A\u0443 egg \u0434\u043B\u044F \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F.",
  "noActiveFile": "NutEgg: \u041D\u0435\u0442 \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0433\u043E \u0444\u0430\u0439\u043B\u0430",
  "notEggNote": "NutEgg: \u0410\u043A\u0442\u0438\u0432\u043D\u044B\u0439 \u0444\u0430\u0439\u043B \u043D\u0435 \u044F\u0432\u043B\u044F\u0435\u0442\u0441\u044F \u0437\u0430\u043C\u0435\u0442\u043A\u043E\u0439 egg",
  "mergingEntries": "NutEgg: \u041E\u0431\u044A\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u0435 \u0437\u0430\u043F\u0438\u0441\u0435\u0439 \u0432 {name}...",
  "mergedEntries": "[NutEgg] \u041E\u0431\u044A\u0435\u0434\u0438\u043D\u0435\u043D\u043E {count} \u0437\u0430\u043F\u0438\u0441\u0435\u0439 \u0432 \u0434\u0435\u0440\u0435\u0432\u043E \u0437\u043D\u0430\u043D\u0438\u0439",
  "noUnprocessed": "[NutEgg] \u041D\u0435\u0442 \u043D\u0435\u043E\u0431\u0440\u0430\u0431\u043E\u0442\u0430\u043D\u043D\u044B\u0445 \u0437\u0430\u043F\u0438\u0441\u0435\u0439 \u0438\u043B\u0438 \u043F\u0440\u043E\u0438\u0437\u043E\u0448\u043B\u0430 \u043E\u0448\u0438\u0431\u043A\u0430.",
  "mergeFailed": "[NutEgg] \u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u044A\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u044F: {error}",
  "workflowReset": "[NutEgg] \u041F\u0440\u043E\u043C\u043F\u0442\u044B \u0441\u0431\u0440\u043E\u0448\u0435\u043D\u044B \u043A \u0441\u0442\u0430\u043D\u0434\u0430\u0440\u0442\u043D\u044B\u043C. \u041F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0438\u0435 \u0444\u0430\u0439\u043B\u044B \u043F\u0435\u0440\u0435\u043C\u0435\u0449\u0435\u043D\u044B \u0432 {folder}",
  "eggNameRequired": "NutEgg: \u041F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430, \u0432\u0432\u0435\u0434\u0438\u0442\u0435 \u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u043E\u0435 \u0438\u043C\u044F egg.",
  "eggAlreadyExists": "NutEgg: {path} \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442.",
  "eggCreated": "NutEgg: \u0421\u043E\u0437\u0434\u0430\u043D {path}",
  "indexSynced": "[NutEgg] \u0418\u043D\u0434\u0435\u043A\u0441 \u0441\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D: {summary}",
  "indexAllSynced": "[NutEgg] \u0412\u0441\u0451 \u043F\u043E\u043B\u043D\u043E\u0441\u0442\u044C\u044E \u0441\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D\u043E.",
  "indexSyncFailed": "[NutEgg] \u0421\u0431\u043E\u0439 \u0441\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u0438: {error}",
  "createEggTitle": "\u{1F423} \u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043D\u043E\u0432\u044B\u0439 Egg",
  "eggNameLabel": "\u0418\u043C\u044F Egg (\u0438\u043C\u044F \u0444\u0430\u0439\u043B\u0430):",
  "eggNamePlaceholder": "\u043D\u0430\u043F\u0440. metodologiya, investitsii...",
  "eggDescLabel": "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 (\u043E\u0445\u0432\u0430\u0442 \u0442\u0435\u043C\u044B):",
  "eggDescPlaceholder": "\u043D\u0430\u043F\u0440. \u043F\u0440\u0430\u043A\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u043C\u0435\u0442\u043E\u0434\u044B \u0438 \u043F\u0440\u0438\u0435\u043C\u044B...",
  "eggLangHint": "\u{1F310} \u042F\u0437\u044B\u043A \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0446\u0438\u0439 \u0438 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u043E\u0432 \u0431\u0443\u0434\u0435\u0442 \u0441\u043E\u043E\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u043E\u0432\u0430\u0442\u044C \u044F\u0437\u044B\u043A\u0443 \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u044F.",
  "cancel": "\u041E\u0442\u043C\u0435\u043D\u0430",
  "createEgg": "\u0421\u043E\u0437\u0434\u0430\u0442\u044C Egg",
  "creatingEgg": "\u23F3 \u0421\u043E\u0437\u0434\u0430\u043D\u0438\u0435 egg...",
  "mergeUnprocessed": "\u041E\u0431\u044A\u0435\u0434\u0438\u043D\u0438\u0442\u044C \u043D\u0435\u043E\u0431\u0440\u0430\u0431\u043E\u0442\u0430\u043D\u043D\u0443\u044E \u0437\u0430\u043C\u0435\u0442\u043A\u0443",
  "mergeUnprocessedPlural": "\u041E\u0431\u044A\u0435\u0434\u0438\u043D\u0438\u0442\u044C {count} \u043D\u0435\u043E\u0431\u0440\u0430\u0431\u043E\u0442\u0430\u043D\u043D\u044B\u0445 \u0437\u0430\u043C\u0435\u0442\u043E\u043A",
  "merging": "\u041E\u0431\u044A\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u0435...",
  "mergeButtonText": "\u26A1 \u041E\u0431\u044A\u0435\u0434\u0438\u043D\u0438\u0442\u044C \u0432 \u0434\u0435\u0440\u0435\u0432\u043E \u0437\u043D\u0430\u043D\u0438\u0439",
  "mergingWithAi": "\u23F3 \u041E\u0431\u044A\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u0435 \u0441 \u043F\u043E\u043C\u043E\u0449\u044C\u044E \u0418\u0418...",
  "mergedSuccess": "\u2705 \u041E\u0431\u044A\u0435\u0434\u0438\u043D\u0435\u043D\u043E!",
  "treeUpToDate": "\u2705 \u0414\u0435\u0440\u0435\u0432\u043E \u0437\u043D\u0430\u043D\u0438\u0439 \u0430\u043A\u0442\u0443\u0430\u043B\u044C\u043D\u043E",
  "unprocessedEntries": "\u{1F95A} {count} \u043D\u0435\u043E\u0431\u0440\u0430\u0431\u043E\u0442\u0430\u043D\u043D\u044B\u0445 {entries}",
  "entrySingle": "\u0437\u0430\u043F\u0438\u0441\u044C",
  "entryPlural": "\u0437\u0430\u043F\u0438\u0441\u0435\u0439",
  "mergeNoChanges": "[NutEgg] \u0418\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0439 \u043D\u0435\u0442 \u043B\u0438\u0431\u043E \u043F\u0440\u043E\u0438\u0437\u043E\u0448\u043B\u0430 \u043E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u044A\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u044F.",
  "syncIndex": "\u0421\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0438\u043D\u0434\u0435\u043A\u0441",
  "syncingIndex": "\u0421\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u044F...",
  "newEggButton": "+ \u041D\u043E\u0432\u044B\u0439 Egg",
  "unprocessedBadge": "{count} \u043D\u0435\u043E\u0431\u0440\u0430\u0431\u043E\u0442\u0430\u043D\u043E"
};

// src/i18n/index.ts
var translations = {
  en,
  zh,
  es,
  ja,
  ko,
  ar,
  fr,
  de,
  pt,
  ru
};
function getLanguage2() {
  try {
    let raw;
    try {
      if (typeof getLanguage === "function") {
        raw = getLanguage();
      }
    } catch {
    }
    if (!raw && typeof window !== "undefined" && window?.localStorage) {
      raw = window.localStorage.getItem("language") || void 0;
    }
    if (!raw) {
      try {
        if (typeof moment?.locale === "function") {
          raw = moment.locale();
        } else if (typeof window?.moment?.locale === "function") {
          raw = window.moment.locale();
        }
      } catch {
      }
    }
    if (!raw && typeof document !== "undefined" && document.documentElement?.lang) {
      raw = document.documentElement.lang;
    }
    if (!raw && typeof navigator !== "undefined" && navigator?.language) {
      raw = navigator.language;
    }
    const lang = (raw || "en").toLowerCase();
    if (lang.startsWith("zh"))
      return "zh";
    if (lang.startsWith("es"))
      return "es";
    if (lang.startsWith("ja"))
      return "ja";
    if (lang.startsWith("ko"))
      return "ko";
    if (lang.startsWith("ar"))
      return "ar";
    if (lang.startsWith("fr"))
      return "fr";
    if (lang.startsWith("de"))
      return "de";
    if (lang.startsWith("pt"))
      return "pt";
    if (lang.startsWith("ru"))
      return "ru";
  } catch {
  }
  return "en";
}
function t(key, params) {
  const lang = getLanguage2();
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
