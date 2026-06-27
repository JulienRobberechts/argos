import { describe } from "vitest";
import { testIDocumentRepository } from "../../1-infra/db/testIDocumentRepositoryPort";
import { InMemoryDocumentRepository } from "../../fakes/InMemoryDocumentRepository";

describe("InMemoryDocumentRepository", () => {
  const repo = new InMemoryDocumentRepository();

  testIDocumentRepository(
    () => ({
      adapter: repo,
      cleanup: async () => repo.clear(),
      verifyOnMedium: async (id) => {
        const doc = await repo.findById(id);
        if (!doc) throw new Error(`Document not found: ${id}`);
        return { title: doc.title, status: doc.status, filePath: doc.filePath };
      },
      prepareChunkForDocument: async () => {},
      countChunksForDocument: async () => 0,
    }),
    { skipCascadeDelete: true },
  );
});
