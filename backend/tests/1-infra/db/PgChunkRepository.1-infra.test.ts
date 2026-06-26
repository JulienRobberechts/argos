import { randomUUID } from "node:crypto";
import { beforeAll, describe } from "vitest";
import { PgDocumentRepository } from "../../../src/infra/persistence/db/PgDocumentRepository";
import { PgVectorChunkRepository } from "../../../src/infra/persistence/db/PgVectorChunkRepository";
import pool from "../../../src/infra/persistence/db/pool";
import { testIChunkRepository } from "./testIChunkRepositoryPort";

describe("PgVectorChunkRepository", () => {
  beforeAll(async () => {
    await pool.query("SELECT 1");
  });

  testIChunkRepository(() => {
    const docRepo = new PgDocumentRepository();
    return {
      adapter: new PgVectorChunkRepository(),
      cleanup: async () => {
        await pool.query("DELETE FROM messages");
        await pool.query("DELETE FROM chunks");
        await pool.query("DELETE FROM conversations");
        await pool.query("DELETE FROM documents");
      },
      createDocument: async () => {
        const doc = {
          id: randomUUID(),
          title: "Test Doc",
          sourceType: "text" as const,
          status: "pending" as const,
          filePath: null,
          createdAt: new Date(),
        };
        await docRepo.save(doc);
        return doc.id;
      },
    };
  });
});
