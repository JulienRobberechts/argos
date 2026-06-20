import type {
  ChunkSearchResult,
  ResponseGroundingResult,
  ResponseGroundingStrategy,
} from "../../domain/entities";

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
