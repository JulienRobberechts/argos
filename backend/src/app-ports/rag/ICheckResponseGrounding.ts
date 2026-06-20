import type { ChunkSearchResult } from "../../domain/entities/ChunkSearchResult";
import type {
  ResponseGroundingResult,
  ResponseGroundingStrategy,
} from "../../domain/entities/Message";

export interface ICheckResponseGrounding {
  /** Runs the given grounding strategies and returns their aggregated results. */
  run(
    query: string,
    answer: string,
    chunks: ChunkSearchResult[],
    strategies: ResponseGroundingStrategy[],
    titleById?: Map<string, string>,
  ): Promise<ResponseGroundingResult[]>;
}
