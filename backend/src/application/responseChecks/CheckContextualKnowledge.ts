import { ChunkSearchResult } from "../../domain/ports/IChunkRepository";
import { ILLMPort } from "../../domain/ports/ILLMPort";
import {
  KnowledgeCheckResult,
  KnowledgeCheckStrategy,
} from "../../domain/entities/Message";
import { Logger } from "../../infrastructure/logger/Logger";
import { checkFaithfulness } from "./strategies/faithfulness";
import { checkCounterfactual } from "./strategies/counterfactual";
import { checkCitationForcing } from "./strategies/citationForcing";

export class CheckContextualKnowledge {
  private readonly logger = new Logger("CheckContextualKnowledge");

  constructor(private readonly llm: ILLMPort) {}

  async run(
    query: string,
    answer: string,
    chunks: ChunkSearchResult[],
    strategies: KnowledgeCheckStrategy[],
    titleById: Map<string, string> = new Map(),
  ): Promise<KnowledgeCheckResult[]> {
    const results: KnowledgeCheckResult[] = [];
    for (const strategy of strategies) {
      try {
        if (strategy === "faithfulness") {
          results.push(
            await checkFaithfulness(this.llm, query, answer, chunks, titleById),
          );
        } else if (strategy === "counterfactual") {
          results.push(await checkCounterfactual(this.llm, query, answer));
        } else if (strategy === "citation_forcing") {
          results.push(
            await checkCitationForcing(
              this.llm,
              query,
              answer,
              chunks,
              titleById,
            ),
          );
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
}
