export interface RerankPort {
  rerank(query: string, documents: string[]): Promise<number[]>;
}
