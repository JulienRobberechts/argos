import { beforeAll, describe } from "vitest";
import { ConversationParams } from "../../../src/domain/entities";
import { PgConversationRepository } from "../../../src/infra/persistence/db/PgConversationRepository";
import pool from "../../../src/infra/persistence/db/pool";
import { testIConversationRepository } from "./testIConversationRepositoryPort";

const DEFAULT_PARAMS = ConversationParams.create({
  retrievalLimit: 8,
  retrievalMinScore: 0.75,
  rerankEnabled: false,
  rerankModel: "rerank-2.5",
  rerankCandidateMultiplier: 3,
  llmModel: "claude-haiku-4-5-20251001",
  llmTemperature: 0.1,
  llmMaxTokens: 1024,
  responseGroundingStrategies: [],
  searchMode: "hybrid",
});

describe("PgConversationRepository", () => {
  beforeAll(async () => {
    await pool.query("SELECT 1");
  });

  testIConversationRepository(() => ({
    adapter: new PgConversationRepository(DEFAULT_PARAMS),
    cleanup: async () => {
      await pool.query("DELETE FROM messages");
      await pool.query("DELETE FROM chunks");
      await pool.query("DELETE FROM conversations");
      await pool.query("DELETE FROM documents");
    },
    countMessagesForConversation: async (conversationId) => {
      const { rows } = await pool.query(
        "SELECT COUNT(*) FROM messages WHERE conversation_id = $1",
        [conversationId],
      );
      return Number(rows[0].count);
    },
  }));
});
