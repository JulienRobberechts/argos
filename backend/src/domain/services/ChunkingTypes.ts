export type ChunkingStrategyName = "recursive" | "sentence";

export interface ChunkConfig {
  chunkSize: number;
  chunkOverlap: number;
}

export interface ChunkResult {
  content: string;
  metadata: {
    position: number;
    startChar: number;
    endChar: number;
  };
}

export interface IChunkingStrategy {
  chunk(text: string, config: ChunkConfig): ChunkResult[];
}
