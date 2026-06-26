import { randomUUID } from "node:crypto";
import { beforeAll, describe } from "vitest";
import { PgDocumentRepository } from "../../../src/infra/persistence/db/PgDocumentRepository";
import pool from "../../../src/infra/persistence/db/pool";
import { testIDocumentRepository } from "./testIDocumentRepositoryPort";

describe("PgDocumentRepository", () => {
  beforeAll(async () => {
    await pool.query("SELECT 1");
  });

  testIDocumentRepository(() => ({
    adapter: new PgDocumentRepository(),
    cleanup: async () => {
      await pool.query("DELETE FROM messages");
      await pool.query("DELETE FROM chunks");
      await pool.query("DELETE FROM conversations");
      await pool.query("DELETE FROM documents");
    },
    verifyOnMedium: async (id) => {
      const { rows } = await pool.query(
        "SELECT title, status, file_path FROM documents WHERE id = $1",
        [id],
      );
      return {
        title: rows[0].title,
        status: rows[0].status,
        filePath: rows[0].file_path,
      };
    },
    prepareChunkForDocument: async (documentId) => {
      await pool.query(
        "INSERT INTO chunks (id, document_id, content, embedding, metadata) VALUES ($1, $2, $3, $4::vector, $5)",
        [
          randomUUID(),
          documentId,
          "chunk content",
          JSON.stringify(Array(1024).fill(0.1)),
          JSON.stringify({ position: 0, startChar: 0, endChar: 12 }),
        ],
      );
    },
    countChunksForDocument: async (documentId) => {
      const { rows } = await pool.query("SELECT COUNT(*) FROM chunks WHERE document_id = $1", [
        documentId,
      ]);
      return Number(rows[0].count);
    },
  }));
});
