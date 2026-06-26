import { randomUUID } from "node:crypto";
import { beforeAll, beforeEach, expect, it } from "vitest";
import { type Conversation, ConversationParams, type Message } from "../../../src/domain/entities";
import type { IConversationRepository } from "../../../src/infra-ports/persistence";

type Setup = {
  adapter: IConversationRepository;
  cleanup: () => Promise<void>;
  countMessagesForConversation: (conversationId: string) => Promise<number>;
};

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

function makeConversation(overrides?: Partial<Conversation>): Conversation {
  return {
    id: randomUUID(),
    title: "Test Conversation",
    messages: [],
    params: DEFAULT_PARAMS,
    createdAt: new Date(),
    ...overrides,
  };
}

function makeMessage(conversationId: string, overrides?: Partial<Message>): Message {
  return {
    id: randomUUID(),
    conversationId,
    role: "user",
    content: "Hello",
    sources: [],
    createdAt: new Date(),
    ...overrides,
  };
}

export function testIConversationRepository(setup: () => Setup): void {
  let adapter: IConversationRepository;
  let cleanup: () => Promise<void>;
  let countMessagesForConversation: Setup["countMessagesForConversation"];

  beforeAll(() => {
    ({ adapter, cleanup, countMessagesForConversation } = setup());
  });

  beforeEach(async () => {
    await cleanup();
  });

  it("saves and retrieves a conversation by id", async () => {
    const conv = makeConversation();
    await adapter.save(conv);
    const found = await adapter.findById(conv.id);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(conv.id);
    expect(found?.title).toBe(conv.title);
    expect(found?.messages).toHaveLength(0);
  });

  it("findById returns null for unknown id", async () => {
    expect(await adapter.findById(randomUUID())).toBeNull();
  });

  it("findAll returns all conversations", async () => {
    await adapter.save(makeConversation({ title: "Conv 1" }));
    await adapter.save(makeConversation({ title: "Conv 2" }));
    const all = await adapter.findAll();
    expect(all).toHaveLength(2);
  });

  it("addMessage persists a message on the conversation", async () => {
    const conv = makeConversation();
    await adapter.save(conv);
    const msg = makeMessage(conv.id);
    await adapter.addMessage(conv.id, msg);
    const found = await adapter.findById(conv.id);
    expect(found?.messages).toHaveLength(1);
    expect(found?.messages[0].id).toBe(msg.id);
    expect(found?.messages[0].role).toBe("user");
    expect(found?.messages[0].content).toBe("Hello");
  });

  it("messages are returned in chronological order", async () => {
    const conv = makeConversation();
    await adapter.save(conv);
    await adapter.addMessage(
      conv.id,
      makeMessage(conv.id, {
        content: "First",
        createdAt: new Date("2024-01-01T10:00:00Z"),
      }),
    );
    await adapter.addMessage(
      conv.id,
      makeMessage(conv.id, {
        role: "assistant",
        content: "Second",
        createdAt: new Date("2024-01-01T10:01:00Z"),
      }),
    );
    const found = await adapter.findById(conv.id);
    expect(found?.messages[0].content).toBe("First");
    expect(found?.messages[1].content).toBe("Second");
  });

  it("findAll includes message count for each conversation", async () => {
    const conv = makeConversation();
    await adapter.save(conv);
    await adapter.addMessage(conv.id, makeMessage(conv.id));
    const all = await adapter.findAll();
    expect(all[0].messageCount).toBe(1);
  });

  it("updateTitle changes the conversation title", async () => {
    const conv = makeConversation({ title: "Original" });
    await adapter.save(conv);
    await adapter.updateTitle(conv.id, "Updated");
    const found = await adapter.findById(conv.id);
    expect(found?.title).toBe("Updated");
  });

  it("delete removes the conversation and cascades to messages", async () => {
    const conv = makeConversation();
    await adapter.save(conv);
    await adapter.addMessage(conv.id, makeMessage(conv.id));
    await adapter.delete(conv.id);
    expect(await adapter.findById(conv.id)).toBeNull();
    expect(await countMessagesForConversation(conv.id)).toBe(0);
  });

  it("deleteAll removes all conversations", async () => {
    await adapter.save(makeConversation());
    await adapter.save(makeConversation());
    await adapter.deleteAll();
    expect(await adapter.findAll()).toHaveLength(0);
  });
}
