import { RerankPort } from "../../domain/ports/RerankPort";

export class NoopRerankAdapter implements RerankPort {
  async rerank(_query: string, documents: string[]): Promise<number[]> {
    return documents.map((_, i) => i);
  }
}
