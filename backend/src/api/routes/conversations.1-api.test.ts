import { randomUUID } from "node:crypto";
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { nullLogger } from "../../../tests/fakes/NullLogger";
import type { IConversationService } from "../../app-ports/rag";
import {
  type Conversation,
  ConversationParams,
  type ConversationSummary,
  type Message,
} from "../../domain/entities";
import { conversationsRouter } from "./conversations";

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
    title: "Test",
    messages: [],
    params: DEFAULT_PARAMS,
    createdAt: new Date(),
    ...overrides,
  };
}

function makeConversationSummary(overrides?: Partial<ConversationSummary>): ConversationSummary {
  return {
    id: randomUUID(),
    title: "Test",
    params: DEFAULT_PARAMS,
    messageCount: 0,
    createdAt: new Date(),
    ...overrides,
  };
}

function makeAssistantMessage(conversationId: string, overrides?: Partial<Message>): Message {
  return {
    id: randomUUID(),
    conversationId,
    role: "assistant",
    content: "Answer",
    sources: [],
    createdAt: new Date(),
    ...overrides,
  };
}

type MockedConversationService = { [K in keyof IConversationService]: Mock };

function makeConversationService(): MockedConversationService {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    findAll: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
    updateTitle: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  };
}

function makeAskQuestion() {
  return {
    execute: vi.fn().mockImplementation(async (convId: string) => makeAssistantMessage(convId)),
  };
}

function makeApp(convService: MockedConversationService, askQuestion = makeAskQuestion()) {
  const app = express();
  app.use(express.json());
  app.use(
    "/conversations",
    conversationsRouter(
      convService as unknown as IConversationService,
      askQuestion as never,
      nullLogger,
    ),
  );
  return app;
}

describe("conversationsRouter", () => {
  let convService: MockedConversationService;
  let askQuestion: ReturnType<typeof makeAskQuestion>;

  beforeEach(() => {
    convService = makeConversationService();
    askQuestion = makeAskQuestion();
  });

  describe("POST /conversations", () => {
    it("returns 200 with SSE content-type", async () => {
      const res = await request(makeApp(convService, askQuestion))
        .post("/conversations")
        .send({ firstMessage: "Hello" });
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("text/event-stream");
    });

    it("emits event: created with conversationId", async () => {
      const res = await request(makeApp(convService, askQuestion))
        .post("/conversations")
        .send({ firstMessage: "Hello" });
      expect(res.text).toContain("event: created");
      expect(res.text).toMatch(/"conversationId"/);
    });

    it("emits event: sources", async () => {
      const res = await request(makeApp(convService, askQuestion))
        .post("/conversations")
        .send({ firstMessage: "Hello" });
      expect(res.text).toContain("event: sources");
    });

    it("emits event: delta for each token", async () => {
      askQuestion.execute.mockImplementation(
        async (convId: string, _: string, onToken: (t: string) => void) => {
          onToken("tok1");
          onToken("tok2");
          return makeAssistantMessage(convId);
        },
      );
      const res = await request(makeApp(convService, askQuestion))
        .post("/conversations")
        .send({ firstMessage: "Hello" });
      expect(res.text).toContain("event: delta");
      expect(res.text).toContain('"tok1"');
      expect(res.text).toContain('"tok2"');
    });

    it("emits event: response_grounding when responseGrounding is present", async () => {
      askQuestion.execute.mockResolvedValue(
        makeAssistantMessage(randomUUID(), {
          responseGrounding: [{ strategy: "faithfulness", score: 0.9, claims: [] }],
        }),
      );
      const res = await request(makeApp(convService, askQuestion))
        .post("/conversations")
        .send({ firstMessage: "Hello" });
      expect(res.text).toContain("event: response_grounding");
    });

    it("emits event: done with messageId and contentLength", async () => {
      const res = await request(makeApp(convService, askQuestion))
        .post("/conversations")
        .send({ firstMessage: "Hello" });
      expect(res.text).toContain("event: done");
      expect(res.text).toMatch(/"messageId"/);
      expect(res.text).toMatch(/"contentLength"/);
    });

    it("emits event: error when askQuestion throws", async () => {
      askQuestion.execute.mockRejectedValue(new Error("LLM down"));
      const res = await request(makeApp(convService, askQuestion))
        .post("/conversations")
        .send({ firstMessage: "Hello" });
      expect(res.status).toBe(200);
      expect(res.text).toContain("event: error");
    });

    it("returns 400 when firstMessage is missing", async () => {
      const res = await request(makeApp(convService, askQuestion)).post("/conversations").send({});
      expect(res.status).toBe(400);
    });

    it("returns 400 when firstMessage is empty", async () => {
      const res = await request(makeApp(convService, askQuestion))
        .post("/conversations")
        .send({ firstMessage: "" });
      expect(res.status).toBe(400);
    });
  });

  describe("GET /conversations", () => {
    it("returns 200 with conversations from service", async () => {
      convService.findAll.mockResolvedValue([makeConversationSummary(), makeConversationSummary()]);
      const res = await request(makeApp(convService, askQuestion)).get("/conversations");
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it("returns empty array when no conversations", async () => {
      convService.findAll.mockResolvedValue([]);
      const res = await request(makeApp(convService, askQuestion)).get("/conversations");
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe("GET /conversations/:id", () => {
    it("returns 200 with the conversation", async () => {
      const conv = makeConversation();
      convService.findById.mockResolvedValue(conv);
      const res = await request(makeApp(convService, askQuestion)).get(`/conversations/${conv.id}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(conv.id);
    });

    it("returns 404 for unknown id", async () => {
      convService.findById.mockResolvedValue(null);
      const res = await request(makeApp(convService, askQuestion)).get("/conversations/unknown");
      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /conversations/:id", () => {
    it("returns 200 with updated title", async () => {
      const conv = makeConversation({ title: "Old title" });
      convService.findById.mockResolvedValue(conv);
      const res = await request(makeApp(convService, askQuestion))
        .patch(`/conversations/${conv.id}`)
        .send({ title: "New title" });
      expect(res.status).toBe(200);
      expect(res.body.title).toBe("New title");
    });

    it("returns 400 when title is missing", async () => {
      const res = await request(makeApp(convService, askQuestion))
        .patch("/conversations/any-id")
        .send({});
      expect(res.status).toBe(400);
    });

    it("returns 400 when title is empty", async () => {
      const res = await request(makeApp(convService, askQuestion))
        .patch("/conversations/any-id")
        .send({ title: "" });
      expect(res.status).toBe(400);
    });

    it("returns 404 for unknown id", async () => {
      convService.findById.mockResolvedValue(null);
      const res = await request(makeApp(convService, askQuestion))
        .patch("/conversations/unknown")
        .send({ title: "New title" });
      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /conversations/:id", () => {
    it("returns 204 when conversation exists", async () => {
      const conv = makeConversation();
      convService.findById.mockResolvedValue(conv);
      const res = await request(makeApp(convService, askQuestion)).delete(
        `/conversations/${conv.id}`,
      );
      expect(res.status).toBe(204);
    });

    it("returns 404 for unknown id", async () => {
      convService.findById.mockResolvedValue(null);
      const res = await request(makeApp(convService, askQuestion)).delete("/conversations/unknown");
      expect(res.status).toBe(404);
    });
  });

  describe("POST /conversations/:id/messages", () => {
    it("returns 200 with SSE content-type", async () => {
      const conv = makeConversation();
      convService.findById.mockResolvedValue(conv);
      const res = await request(makeApp(convService, askQuestion))
        .post(`/conversations/${conv.id}/messages`)
        .send({ content: "Hello" });
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("text/event-stream");
    });

    it("emits event: sources and event: done", async () => {
      const conv = makeConversation();
      convService.findById.mockResolvedValue(conv);
      const res = await request(makeApp(convService, askQuestion))
        .post(`/conversations/${conv.id}/messages`)
        .send({ content: "Hello" });
      expect(res.text).toContain("event: sources");
      expect(res.text).toContain("event: done");
    });

    it("emits event: delta for each token", async () => {
      const conv = makeConversation();
      convService.findById.mockResolvedValue(conv);
      askQuestion.execute.mockImplementation(
        async (convId: string, _: string, onToken: (t: string) => void) => {
          onToken("hello");
          return makeAssistantMessage(convId);
        },
      );
      const res = await request(makeApp(convService, askQuestion))
        .post(`/conversations/${conv.id}/messages`)
        .send({ content: "Hello" });
      expect(res.text).toContain("event: delta");
      expect(res.text).toContain('"hello"');
    });

    it("emits event: error when askQuestion throws", async () => {
      const conv = makeConversation();
      convService.findById.mockResolvedValue(conv);
      askQuestion.execute.mockRejectedValue(new Error("LLM down"));
      const res = await request(makeApp(convService, askQuestion))
        .post(`/conversations/${conv.id}/messages`)
        .send({ content: "Hello" });
      expect(res.status).toBe(200);
      expect(res.text).toContain("event: error");
    });

    it("returns 400 when content is missing", async () => {
      const conv = makeConversation();
      convService.findById.mockResolvedValue(conv);
      const res = await request(makeApp(convService, askQuestion))
        .post(`/conversations/${conv.id}/messages`)
        .send({});
      expect(res.status).toBe(400);
    });

    it("returns 400 when content is empty", async () => {
      const conv = makeConversation();
      convService.findById.mockResolvedValue(conv);
      const res = await request(makeApp(convService, askQuestion))
        .post(`/conversations/${conv.id}/messages`)
        .send({ content: "" });
      expect(res.status).toBe(400);
    });

    it("returns 404 for unknown conversation", async () => {
      convService.findById.mockResolvedValue(null);
      const res = await request(makeApp(convService, askQuestion))
        .post("/conversations/unknown/messages")
        .send({ content: "Hello" });
      expect(res.status).toBe(404);
    });
  });
});
