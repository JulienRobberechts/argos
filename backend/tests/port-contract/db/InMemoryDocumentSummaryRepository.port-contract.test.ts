import { randomUUID } from "node:crypto";
import { describe } from "vitest";
import { testIDocumentSummaryRepository } from "../../1-infra/db/testIDocumentSummaryRepositoryPort";
import { InMemoryDocumentSummaryRepository } from "../../fakes/InMemoryDocumentSummaryRepository";

describe("InMemoryDocumentSummaryRepository", () => {
  const repo = new InMemoryDocumentSummaryRepository();

  testIDocumentSummaryRepository(() => ({
    adapter: repo,
    cleanup: async () => repo.clear(),
    createDocument: async () => randomUUID(),
  }));
});
