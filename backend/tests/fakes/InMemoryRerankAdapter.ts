import type { IRerankPort } from "../../src/infra-ports/ai/IRerankPort";

export class InMemoryRerankAdapter implements IRerankPort {
  constructor(private readonly result: number[] | null) {}

  async rerank(_query: string, _documents: string[]): Promise<number[]> {
    return this.result as unknown as number[];
  }
}
