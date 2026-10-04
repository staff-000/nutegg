import type { AnalysisResult, ContentAnalysis, EggAnalysis, EggSaveEntry, ReadAction, SourceRef } from "./types";

/** Assemble selected egg results using the same verdict and Hatch rules for fresh and cached analysis. */
export function composeEggResults(contentAnalysis: ContentAnalysis, eggResults: EggAnalysis[], eggAnalysisCache: EggAnalysis[] = eggResults, generateKnowledgeEntries = true): AnalysisResult {
  eggResults = eggResults.map(result => generateKnowledgeEntries && result.generateKnowledgeEntries !== false ? result : { ...result, generateKnowledgeEntries: false, extractedEntries: [] });
  const newKnowledge: EggSaveEntry[] = eggResults.flatMap(result => {
    if (!generateKnowledgeEntries || result.generateKnowledgeEntries === false) return [];
    const items = (result.extractedEntries || []).map(entry => ({ egg: result.egg,
      content: saveEntryBody(entry.content, entry.sources || []) }));
    for (const answer of result.keyQuestionAnswers || []) {
      if (answer.answered === false || /^(?:not addressed in this content|not addressed in this part)[.!]?$/i.test(answer.answer.trim())) continue;
      const body = `**${answer.question}**\n${answer.answer}`;
      items.push({ egg: result.egg, content: saveEntryBody(body, answer.sources || []) });
    }
    return items.filter((item, i) => items.findIndex(other => other.content === item.content) === i);
  });
  return { ...contentAnalysis, schemaVersion: 3, ...mergeVerdict(eggResults),
    matchedEggs: eggResults.map(e => e.egg), eggResults, newKnowledge, eggAnalysisCache, generateKnowledgeEntries };
}

function saveEntryBody(body: string, sources: SourceRef[]): string {
  const refs = sources.map(s => `  - Source location: ${s.ref}${s.quote ? ` — ${s.quote}` : ""}`).join("\n");
  return `${body.startsWith("- ") ? body : `- ${body.replace(/\n/g, "\n  ")}`}${refs ? `\n${refs}` : ""}`;
}

function mergeVerdict(results: EggAnalysis[]): Pick<AnalysisResult, "readAction" | "shouldRead" | "shouldReadReason" | "readingSources"> {
  const order: ReadAction[] = ["full", "highlights", "uncertain", "summary", "skip"];
  const readAction = order.find(action => results.some(r => r.readAction === action)) || "uncertain";
  return { readAction, shouldRead: readAction === "full" || readAction === "highlights" ? true : readAction === "summary" || readAction === "skip" ? false : null,
    shouldReadReason: results.filter(r => r.readAction === readAction).map(r => `${r.egg}: ${r.readVerdictReason}`).join(" "),
    readingSources: results.filter(r => r.readAction === "full" || r.readAction === "highlights").flatMap(r => r.readingSources || []) };
}
