import { randomUUID } from "node:crypto";
import { beforeAll, describe } from "vitest";
import { PgDocumentSummaryRepository } from "../../../src/infra/persistence/db/PgDocumentSummaryRepository";
import pool from "../../../src/infra/persistence/db/pool";
import { testIDocumentSummaryRepository } from "./testIDocumentSummaryRepositoryPort";

describe("PgDocumentSummaryRepository", () => {
  beforeAll(async () => {
    await pool.query("SELECT 1");
  });

  testIDocumentSummaryRepository(() => ({
    adapter: new PgDocumentSummaryRepository(),
    cleanup: async () => {
      await pool.query("DELETE FROM document_summaries");
      await pool.query("DELETE FROM documents");
    },
    createDocument: async () => {
      const id = randomUUID();
      await pool.query(
        "INSERT INTO documents (id, title, source_type, status) VALUES ($1, $2, $3, $4)",
        [id, "Test Document", "text", "pending"],
      );
      return id;
    },
  }));
});
