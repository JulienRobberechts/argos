import {
  ChunkRepository,
  ChunkSearchResult,
} from "../domain/ports/ChunkRepository";
import { EmbeddingPort } from "../domain/ports/EmbeddingPort";

export class SearchKnowledge {
  constructor(
    private readonly chunkRepo: ChunkRepository,
    private readonly embeddingAdapter: EmbeddingPort,
  ) {}

  async execute(
    query: string,
    limit = 5,
    minScore = 0.7,
  ): Promise<ChunkSearchResult[]> {
    const vector = await this.embeddingAdapter.embed(query, "query");
    const results = await this.chunkRepo.search(vector, limit, minScore);
    if (results.length === 0) {
      console.warn("[SearchKnowledge] No results found", {
        query,
        limit,
        minScore,
        vectorLength: vector.length,
      });
    }
    return results;
  }
}
