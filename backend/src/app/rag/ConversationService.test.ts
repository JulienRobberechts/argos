import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryConversationRepository } from "../../../tests/fakes/InMemoryConversationRepository";
import { ConversationParams } from "../../domain/entities";
import { ConversationService } from "./ConversationService";

function makeConversation() {
  return {
    id: randomUUID(),
    title: "Test conversation",
    params: ConversationParams.create({
      retrievalLimit: 5,
      retrievalMinScore: 0.5,
      rerankEnabled: false,
      rerankModel: "model",
      rerankCandidateMultiplier: 3,
      llmModel: "claude-sonnet-4-6",
      llmTemperature: 0.5,
      llmMaxTokens: 1024,
      responseGroundingStrategies: [],
      searchMode: "vector",
    }),
    messages: [],
    createdAt: new Date(),
  };
}

describe("ConversationService", () => {
  let repo: InMemoryConversationRepository;
  let service: ConversationService;

  beforeEach(() => {
    repo = new InMemoryConversationRepository();
    service = new ConversationService(repo);
  });

  it("saves and retrieves a conversation by id", async () => {
    const conv = makeConversation();
    await service.save(conv);
    const found = await service.findById(conv.id);
    expect(found?.id).toBe(conv.id);
  });

  it("returns null for unknown id", async () => {
    expect(await service.findById("unknown")).toBeNull();
  });

  it("lists all saved conversations as summaries", async () => {
    await service.save(makeConversation());
    await service.save(makeConversation());
    const all = await service.findAll();
    expect(all).toHaveLength(2);
  });

  it("updates the title", async () => {
    const conv = makeConversation();
    await service.save(conv);
    await service.updateTitle(conv.id, "New title");
    const found = await service.findById(conv.id);
    expect(found?.title).toBe("New title");
  });

  it("deletes a conversation", async () => {
    const conv = makeConversation();
    await service.save(conv);
    await service.delete(conv.id);
    expect(await service.findById(conv.id)).toBeNull();
  });
});
