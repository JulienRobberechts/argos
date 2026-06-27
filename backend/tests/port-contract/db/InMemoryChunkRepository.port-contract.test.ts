import { randomUUID } from "node:crypto";
import { describe } from "vitest";
import { testIChunkRepository } from "../../1-infra/db/testIChunkRepositoryPort";
import { InMemoryChunkRepository } from "../../fakes/InMemoryChunkRepository";

describe("InMemoryChunkRepository", () => {
  const repo = new InMemoryChunkRepository();

  testIChunkRepository(() => ({
    adapter: repo,
    cleanup: async () => repo.clear(),
    createDocument: async () => randomUUID(),
  }));
});
