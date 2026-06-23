import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { nullLogger } from "../../../tests/fakes/NullLogger";
import type { IAppSettingsService } from "../../app-ports/admin";
import { createErrorHandler } from "../middleware/errorHandler";
import { configRouter } from "./config";

vi.mock("../../config", () => ({
  default: {
    server: { logLevel: "info" },
    rag: {
      defaults: {
        retrievalLimit: 10,
        retrievalMinScore: 0.7,
        searchMode: "hybrid",
      },
      searchMode: "hybrid",
    },
    rerank: { enabled: false, defaults: { model: "rerank-2.5" } },
    llm: {
      defaults: {
        model: "claude-haiku-4-5-20251001",
        maxTokens: 1024,
        temperature: 0.1,
      },
    },
    embeddings: { voyage: { model: "voyage-4-lite" } },
    storage: { defaults: { backend: "local" } },
  },
}));

function makeSettingsService(): IAppSettingsService {
  return {
    getSettings: vi.fn(),
    getChunkingConfig: vi.fn().mockResolvedValue({
      strategy: "recursive",
      chunkSize: 512,
      chunkOverlap: 50,
    }),
    updateSettings: vi.fn(),
  };
}

function makeApp(settingsService = makeSettingsService()) {
  const app = express();
  app.use(express.json());
  app.use("/config", configRouter(settingsService));
  app.use(createErrorHandler(nullLogger));
  return app;
}

describe("configRouter", () => {
  let settingsService: IAppSettingsService;

  beforeEach(() => {
    settingsService = makeSettingsService();
  });

  describe("GET /config", () => {
    it("returns 200", async () => {
      const res = await request(makeApp(settingsService)).get("/config");
      expect(res.status).toBe(200);
    });

    it("returns version string", async () => {
      const res = await request(makeApp(settingsService)).get("/config");
      expect(typeof res.body.version).toBe("string");
    });

    it("returns rag config with chunking from settingsService", async () => {
      const res = await request(makeApp(settingsService)).get("/config");
      expect(res.body.rag).toMatchObject({
        chunkingStrategy: "recursive",
        chunkSize: 512,
        chunkOverlap: 50,
        retrievalLimit: 10,
        retrievalMinScore: 0.7,
        searchMode: "hybrid",
        reranking: { enabled: false, model: "rerank-2.5" },
      });
    });

    it("returns llm config", async () => {
      const res = await request(makeApp(settingsService)).get("/config");
      expect(res.body.llm).toMatchObject({
        provider: "anthropic",
        model: "claude-haiku-4-5-20251001",
        maxTokens: 1024,
        temperature: 0.1,
      });
    });

    it("returns embeddings and storage config", async () => {
      const res = await request(makeApp(settingsService)).get("/config");
      expect(res.body.embeddings).toMatchObject({
        provider: "voyage",
        model: "voyage-4-lite",
      });
      expect(res.body.storage).toMatchObject({ backend: "local" });
    });
  });
});
