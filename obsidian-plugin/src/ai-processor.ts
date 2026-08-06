import type NutEggPlugin from "./main";

/**
 * Structured result from the AI analysis.
 */
export interface AnalysisResult {
  summary: string;
  shouldRead: boolean;
  shouldReadReason: string;
  matchedTopics: string[];
  newKnowledge: Array<{
    topic: string;
    section: string;
    content: string;
  }>;
}

export class AIProcessor {
  private plugin: NutEggPlugin;

  constructor(plugin: NutEggPlugin) {
    this.plugin = plugin;
  }

  /**
   * Analyze content against the knowledge index and topic files.
   * Returns structured results for the Chrome extension to display.
   *
   * @param capture - The captured web content
   * @param indexContent - Raw content of _index.md
   * @param topicsContext - Formatted topic file contents (from TopicParser)
   */
  async analyze(
    capture: {
      url: string;
      title: string;
      content: string;
      sourceType: string;
    },
    indexContent: string,
    topicsContext: string
  ): Promise<AnalysisResult> {
    if (!this.plugin.settings.aiApiKey) {
      return this.fallbackAnalysis(capture);
    }

    const prompt = `You are a knowledge curator. Analyze the content below against the user's knowledge index and topic files.

## Topic Index
${indexContent || "(No _index.md found — all topics are new)"}

## Topic File Context
${topicsContext || "(No topic files found — all knowledge is new)"}

## Content to Analyze
**Title:** ${capture.title}
**Source:** ${capture.url}
**Type:** ${capture.sourceType}

${this.truncate(capture.content, 8000)}

## Instructions
1. Write a concise 3-line summary of the content (each line should be one clear sentence)
2. Decide: should the user spend time reading this fully? Consider the topic's reject criteria if any are specified. If the content is repetitive, basic, or doesn't add new insight, answer false.
3. Identify genuinely NEW knowledge or ideas — things not already captured in the topic files. Only flag something if it's substantive and not already present.

Respond in this EXACT JSON format (no markdown, no code fence, just the JSON object):
{
  "summary": "Line one.\nLine two.\nLine three.",
  "shouldRead": true,
  "shouldReadReason": "Brief reason explaining the verdict",
  "matchedTopics": ["topic-file-1.md"],
  "newKnowledge": [
    {"topic": "topic-file-1.md", "section": "knowledge", "content": "Specific new insight or fact"},
    {"topic": "topic-file-1.md", "section": "ideas", "content": "A new idea or perspective"}
  ]
}

IMPORTANT:
- The "summary" field must be exactly 3 lines separated by \\n.
- Only add entries to newKnowledge if they are genuinely NEW and not already in the topic files.
- If nothing is new, return an empty array for newKnowledge.
- Match sections to existing section names in the topic files (e.g., "knowledge", "ideas").`;

    try {
      const response = await this.plugin.aiClient.chat(prompt, 1500);
      return this.parseAnalysisResponse(response, capture);
    } catch (err) {
      console.error("[NutEgg] Analysis failed:", err);
      return this.fallbackAnalysis(capture);
    }
  }

  private parseAnalysisResponse(
    response: string,
    capture: { url: string; title: string }
  ): AnalysisResult {
    // Strip markdown code fences if Claude wrapped the JSON
    let jsonStr = response.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
    }

    try {
      const parsed = JSON.parse(jsonStr);

      return {
        summary: parsed.summary || "Could not generate summary.",
        shouldRead: parsed.shouldRead ?? true,
        shouldReadReason: parsed.shouldReadReason || "No reason provided.",
        matchedTopics: Array.isArray(parsed.matchedTopics)
          ? parsed.matchedTopics
          : [],
        newKnowledge: Array.isArray(parsed.newKnowledge)
          ? parsed.newKnowledge.filter(
              (k: any) =>
                k.topic && k.section && k.content
            )
          : [],
      };
    } catch {
      // If JSON parsing fails, extract what we can from the text
      console.warn("[NutEgg] Failed to parse Claude JSON response, using fallback extraction");
      return {
        summary: this.extractSummary(response) || "Analysis completed. See raw response.",
        shouldRead: !response.toLowerCase().includes('"shouldread": false'),
        shouldReadReason: "Could not parse structured response.",
        matchedTopics: [],
        newKnowledge: [],
      };
    }
  }

  private extractSummary(text: string): string {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("{") && !l.startsWith("}") && !l.startsWith('"'))
      .slice(0, 3);
    return lines.join("\n") || text.substring(0, 300);
  }

  private fallbackAnalysis(capture: {
    url: string;
    title: string;
    content: string;
  }): AnalysisResult {
    const firstSentence =
      capture.content.match(/^[^.!?]+[.!?]/)?.[0]?.trim() ||
      capture.title;
    const lines = [
      firstSentence,
      `Source: ${capture.title}`,
      "(Configure API key in NutEgg settings for AI analysis)",
    ];

    return {
      summary: lines.join("\n"),
      shouldRead: true,
      shouldReadReason: "No API key configured — cannot analyze.",
      matchedTopics: [],
      newKnowledge: [],
    };
  }

  private truncate(text: string, maxChars: number): string {
    if (text.length <= maxChars) return text;
    return text.substring(0, maxChars) + "\n\n[...truncated]";
  }
}
