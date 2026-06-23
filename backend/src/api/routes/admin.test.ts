import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { nullLogger } from "../../../tests/fakes/NullLogger";
import type {
  AppSettings,
  IAppSettingsService,
  ICheckStorageConsistency,
  IResetAll,
} from "../../app-ports/admin";
import { createErrorHandler } from "../middleware/errorHandler";
import { adminRouter } from "./admin";

vi.mock("../../config", () => ({
  default: {
    embeddings: { voyage: { apiKey: "voyage-key" } },
    storage: {
      r2: {
        accountId: "acct",
        accessKeyId: "key",
        secretAccessKey: "secret",
        bucketName: "bucket",
      },
    },
  },
}));

function makeAppSettings(overrides?: Partial<AppSettings>): AppSettings {
  return {
    embedding: { provider: "voyage", model: "voyage-4-lite" },
    storage: { provider: "local" },
    ...overrides,
  };
}

function makeConsistencyResult(overrides?: { orphanFiles?: string[]; missingFiles?: string[] }) {
  return {
    orphanFiles: [],
    missingFiles: [],
    totalDocuments: 2,
    totalStorageFiles: 2,
    ...overrides,
  };
}

function makeCheckConsistency(result = makeConsistencyResult()): ICheckStorageConsistency {
  return { execute: vi.fn().mockResolvedValue(result) };
}

function makeSettingsService(settings = makeAppSettings()): IAppSettingsService {
  return {
    getSettings: vi.fn().mockResolvedValue(settings),
    getChunkingConfig: vi.fn().mockResolvedValue({
      strategy: "recursive",
      chunkSize: 512,
      chunkOverlap: 50,
    }),
    updateSettings: vi.fn().mockResolvedValue(settings),
  };
}

function makeResetAll(): IResetAll {
  return { execute: vi.fn().mockResolvedValue(undefined) };
}

function makeApp(
  checkConsistency = makeCheckConsistency(),
  settingsService = makeSettingsService(),
  resetAll = makeResetAll(),
) {
  const app = express();
  app.use(express.json());
  app.use("/admin", adminRouter(checkConsistency, settingsService, resetAll));
  app.use(createErrorHandler(nullLogger));
  return app;
}

describe("adminRouter", () => {
  let checkConsistency: ICheckStorageConsistency;
  let settingsService: IAppSettingsService;
  let resetAll: IResetAll;

  beforeEach(() => {
    checkConsistency = makeCheckConsistency();
    settingsService = makeSettingsService();
    resetAll = makeResetAll();
  });

  describe("GET /admin/storage/consistency", () => {
    it("returns 200 with ok: true when no orphan or missing files", async () => {
      checkConsistency = makeCheckConsistency(makeConsistencyResult());
      const res = await request(makeApp(checkConsistency)).get("/admin/storage/consistency");
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it("returns ok: false when orphan files exist", async () => {
      checkConsistency = makeCheckConsistency(
        makeConsistencyResult({ orphanFiles: ["orphan.txt"] }),
      );
      const res = await request(makeApp(checkConsistency)).get("/admin/storage/consistency");
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(false);
    });

    it("returns ok: false when missing files exist", async () => {
      checkConsistency = makeCheckConsistency(
        makeConsistencyResult({ missingFiles: ["missing.txt"] }),
      );
      const res = await request(makeApp(checkConsistency)).get("/admin/storage/consistency");
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(false);
    });

    it("includes orphanFiles, missingFiles and totals in response", async () => {
      const res = await request(makeApp(checkConsistency)).get("/admin/storage/consistency");
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        orphanFiles: expect.any(Array),
        missingFiles: expect.any(Array),
        totalDocuments: expect.any(Number),
        totalStorageFiles: expect.any(Number),
      });
    });
  });

  describe("GET /admin/settings", () => {
    it("returns 200 with embedding and storage settings", async () => {
      const res = await request(makeApp(checkConsistency, settingsService)).get("/admin/settings");
      expect(res.status).toBe(200);
      expect(res.body.embedding.provider).toBe("voyage");
      expect(res.body.storage.provider).toBe("local");
    });

    it("includes options arrays in embedding and storage", async () => {
      const res = await request(makeApp(checkConsistency, settingsService)).get("/admin/settings");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.embedding.options)).toBe(true);
      expect(Array.isArray(res.body.storage.options)).toBe(true);
    });
  });

  describe("PUT /admin/settings", () => {
    it("returns 200 with updated settings", async () => {
      const updated = makeAppSettings({
        embedding: { provider: "openai", model: "text-embedding-3-small" },
      });
      (settingsService.updateSettings as ReturnType<typeof vi.fn>).mockResolvedValue(updated);
      const res = await request(makeApp(checkConsistency, settingsService))
        .put("/admin/settings")
        .send({ embedding: { provider: "openai" } });
      expect(res.status).toBe(200);
    });

    it("returns 200 with an empty patch", async () => {
      const res = await request(makeApp(checkConsistency, settingsService))
        .put("/admin/settings")
        .send({});
      expect(res.status).toBe(200);
    });

    it("returns 400 when embedding provider is empty string", async () => {
      const res = await request(makeApp(checkConsistency, settingsService))
        .put("/admin/settings")
        .send({ embedding: { provider: "" } });
      expect(res.status).toBe(400);
    });

    it("returns 400 when chunking strategy is invalid", async () => {
      const res = await request(makeApp(checkConsistency, settingsService))
        .put("/admin/settings")
        .send({ chunking: { strategy: "invalid" } });
      expect(res.status).toBe(400);
    });

    it("returns 400 when chunkSize is below minimum", async () => {
      const res = await request(makeApp(checkConsistency, settingsService))
        .put("/admin/settings")
        .send({ chunking: { chunkSize: 10 } });
      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /admin/reset", () => {
    it("returns 200 with ok: true", async () => {
      const res = await request(makeApp(checkConsistency, settingsService, resetAll))
        .delete("/admin/reset")
        .send({});
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it("accepts optional newSettings in body", async () => {
      const res = await request(makeApp(checkConsistency, settingsService, resetAll))
        .delete("/admin/reset")
        .send({ newSettings: { chunking: { strategy: "sentence" } } });
      expect(res.status).toBe(200);
    });

    it("returns 400 when newSettings has invalid chunking strategy", async () => {
      const res = await request(makeApp(checkConsistency, settingsService, resetAll))
        .delete("/admin/reset")
        .send({ newSettings: { chunking: { strategy: "invalid" } } });
      expect(res.status).toBe(400);
    });
  });
});
