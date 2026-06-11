export interface RerankPort {
  rerank(query: string, documents: string[], model?: string): Promise<number[]>;
}
