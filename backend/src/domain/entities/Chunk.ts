export interface ChunkMetadata {
  position: number;
  startChar: number;
  endChar: number;
}

export interface Chunk {
  id: string;
  documentId: string;
  content: string;
  embedding: number[];
  metadata: ChunkMetadata;
}
