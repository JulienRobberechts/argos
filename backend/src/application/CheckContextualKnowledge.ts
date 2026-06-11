import { ChunkSearchResult } from "../domain/ports/ChunkRepository";
import { LLMPort } from "../domain/ports/LLMPort";
import {
  KnowledgeClaim,
  KnowledgeCheckResult,
  KnowledgeCheckStrategy,
} from "../domain/entities/Message";
import { Logger } from "../infrastructure/logger/Logger";

function extractJSON(raw: string): unknown {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object found in LLM response");
  return JSON.parse(match[0]);
}

export class CheckContextualKnowledge {
  private readonly logger = new Logger("CheckContextualKnowledge");

  constructor(private readonly llm: LLMPort) {}

  async run(
    query: string,
    answer: string,
    chunks: ChunkSearchResult[],
    strategies: KnowledgeCheckStrategy[],
  ): Promise<KnowledgeCheckResult[]> {
    const results: KnowledgeCheckResult[] = [];
    for (const strategy of strategies) {
      try {
        if (strategy === "faithfulness") {
          results.push(await this.faithfulness(query, answer, chunks));
        } else if (strategy === "counterfactual") {
          results.push(await this.counterfactual(query, answer));
        } else if (strategy === "citation_forcing") {
          results.push(await this.citationForcing(query, answer, chunks));
        }
      } catch (err) {
        this.logger.warn(`Strategy '${strategy}' failed`, {
          error: String(err),
        });
        results.push({
          strategy,
          score: -1,
          claims: [],
          warning: `Check failed: ${String(err)}`,
        });
      }
    }
    return results;
  }

  private async faithfulness(
    query: string,
    answer: string,
    chunks: ChunkSearchResult[],
  ): Promise<KnowledgeCheckResult> {
    const sourcesText = chunks.map((c) => c.chunk.content).join("\n---\n");
    const prompt = [
      `Question: "${query}"`,
      "",
      "Sources provided:",
      sourcesText,
      "",
      `Answer to evaluate: "${answer}"`,
      "",
      "For each factual claim in the answer, indicate whether it is explicitly supported by the sources above.",
      "Reply ONLY with valid JSON in this exact format:",
      '{"claims": [{"claim": "...", "status": "SUPPORTED|UNSUPPORTED", "sourceExcerpt": "exact quote or null"}]}',
    ].join("\n");

    const raw = await this.llm.stream(prompt, () => {});
    const parsed = extractJSON(raw) as {
      claims: Array<{
        claim: string;
        status: string;
        sourceExcerpt?: string | null;
      }>;
    };

    const claims: KnowledgeClaim[] = parsed.claims.map((c) => ({
      claim: c.claim,
      status: c.status === "SUPPORTED" ? "SUPPORTED" : "UNSUPPORTED",
      sourceExcerpt: c.sourceExcerpt ?? undefined,
    }));

    const supported = claims.filter((c) => c.status === "SUPPORTED").length;
    const score = claims.length > 0 ? supported / claims.length : 1;

    return {
      strategy: "faithfulness",
      score,
      claims,
      warning:
        score < 1
          ? "Some claims are not grounded in the retrieved documents"
          : undefined,
    };
  }

  private async counterfactual(
    query: string,
    answerWithContext: string,
  ): Promise<KnowledgeCheckResult> {
    const answerWithoutContext = await this.llm.stream(
      [
        "Answer the following question from your training knowledge only (no documents provided).",
        "Reply with just the answer, no preamble.",
        "",
        `Question: ${query}`,
      ].join("\n"),
      () => {},
    );

    const comparePrompt = [
      `Question: "${query}"`,
      "",
      `Answer A (with retrieved documents): "${answerWithContext}"`,
      `Answer B (training knowledge only): "${answerWithoutContext}"`,
      "",
      "Do these two answers convey essentially the same information?",
      'Reply ONLY with valid JSON: {"similar": true|false, "reasoning": "one sentence"}',
    ].join("\n");

    const raw = await this.llm.stream(comparePrompt, () => {});
    const parsed = extractJSON(raw) as {
      similar: boolean;
      reasoning: string;
    };

    const score = parsed.similar ? 0 : 1;

    return {
      strategy: "counterfactual",
      score,
      claims: [
        {
          claim: parsed.reasoning,
          status: parsed.similar ? "UNSUPPORTED" : "SUPPORTED",
        },
      ],
      warning: parsed.similar
        ? "Answer may rely on LLM training data rather than retrieved documents"
        : undefined,
    };
  }

  private async citationForcing(
    query: string,
    answer: string,
    chunks: ChunkSearchResult[],
  ): Promise<KnowledgeCheckResult> {
    const sourcesText = chunks
      .map((c, i) => `SOURCE ${i + 1}:\n${c.chunk.content}`)
      .join("\n\n");

    const prompt = [
      `Question: ${query}`,
      "",
      "Available sources:",
      sourcesText,
      "",
      `Answer to analyze: "${answer}"`,
      "",
      "For each factual claim in the answer, find the exact supporting quote from the sources above.",
      'If no source supports a claim, set status to "UNSUPPORTED" and sourceExcerpt to null.',
      "Reply ONLY with valid JSON:",
      '{"claims": [{"claim": "...", "status": "SUPPORTED|UNSUPPORTED", "sourceExcerpt": "exact quote or null"}]}',
    ].join("\n");

    const raw = await this.llm.stream(prompt, () => {});
    const parsed = extractJSON(raw) as {
      claims: Array<{
        claim: string;
        status: string;
        sourceExcerpt?: string | null;
      }>;
    };

    const chunkTexts = chunks.map((c) => c.chunk.content);

    const claims: KnowledgeClaim[] = parsed.claims.map((c) => {
      if (c.status !== "SUPPORTED" || !c.sourceExcerpt) {
        return { claim: c.claim, status: "UNSUPPORTED" as const };
      }
      const excerpt = c.sourceExcerpt;
      const verified = chunkTexts.some((text) =>
        text.includes(excerpt.slice(0, 40)),
      );
      return {
        claim: c.claim,
        status: verified ? ("SUPPORTED" as const) : ("UNSUPPORTED" as const),
        sourceExcerpt: verified ? excerpt : undefined,
      };
    });

    const supported = claims.filter((c) => c.status === "SUPPORTED").length;
    const score = claims.length > 0 ? supported / claims.length : 1;

    return {
      strategy: "citation_forcing",
      score,
      claims,
      warning:
        score < 1
          ? "Some claims could not be traced to the retrieved documents"
          : undefined,
    };
  }
}
