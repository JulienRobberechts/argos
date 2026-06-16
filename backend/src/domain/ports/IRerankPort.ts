export interface IRerankPort {
  rerank(query: string, documents: string[], model?: string): Promise<number[]>;
}
