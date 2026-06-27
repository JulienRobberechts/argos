import { describe } from "vitest";
import { testIConversationRepository } from "../../1-infra/db/testIConversationRepositoryPort";
import { InMemoryConversationRepository } from "../../fakes/InMemoryConversationRepository";

describe("InMemoryConversationRepository", () => {
  const repo = new InMemoryConversationRepository();

  testIConversationRepository(() => ({
    adapter: repo,
    cleanup: async () => repo.clear(),
    countMessagesForConversation: async (id) => {
      const conv = await repo.findById(id);
      return conv?.messages.length ?? 0;
    },
  }));
});
