import type { ChunkingStrategyName, IChunkingStrategy } from "./ChunkingTypes";
import { RecursiveChunkingStrategy } from "./RecursiveChunkingStrategy";
import { SentenceChunkingStrategy } from "./SentenceChunkingStrategy";

export type {
  ChunkConfig,
  ChunkResult,
  IChunkingStrategy,
  ChunkingStrategyName,
} from "./ChunkingTypes";

export function createChunkingStrategy(
  name: ChunkingStrategyName,
): IChunkingStrategy {
  switch (name) {
    case "sentence":
      return new SentenceChunkingStrategy();
    case "recursive":
    default:
      return new RecursiveChunkingStrategy();
  }
}
