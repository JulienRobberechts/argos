import { randomUUID } from "node:crypto";
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { nullLogger } from "../../../tests/fakes/NullLogger";
import type { ArgosKnowledgeBase } from "../../app-ports/knowledgeBase";
import type { Document, DocumentSummary } from "../../domain/entities";
import { documentsRouter } from "./documents";

function makeDoc(overrides?: Partial<Document>): Document {
  return {
    id: randomUUID(),
    title: "Test",
    sourceType: "text",
    status: "ready",
    filePath: "test.txt",
    createdAt: new Date(),
    ...overrides,
  };
}

function makeDocumentSummary(documentId: string): DocumentSummary {
  return {
    id: randomUUID(),
    documentId,
    content: "Summary content",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

type MockedKnowledgeBase = {
  createDocument: { execute: Mock };
  ingestDocument: { execute: Mock };
  summarizeDocument: { execute: Mock };
  deleteDocument: { execute: Mock };
  documentQueries: {
    list: Mock;
    get: Mock;
    getChunks: Mock;
    getContent: Mock;
    getRawBuffer: Mock;
    getSummary: Mock;
  };
};

function makeKnowledgeBase(): MockedKnowledgeBase {
  return {
    createDocument: { execute: vi.fn().mockResolvedValue(makeDoc()) },
    ingestDocument: { execute: vi.fn().mockResolvedValue(undefined) },
    summarizeDocument: { execute: vi.fn().mockResolvedValue("summary text") },
    deleteDocument: { execute: vi.fn().mockResolvedValue(undefined) },
    documentQueries: {
      list: vi.fn().mockResolvedValue([]),
      get: vi.fn().mockResolvedValue(null),
      getChunks: vi.fn().mockResolvedValue([]),
      getContent: vi.fn().mockResolvedValue(null),
      getRawBuffer: vi.fn().mockResolvedValue(null),
      getSummary: vi.fn().mockResolvedValue(null),
    },
  };
}

function makeApp(kb: MockedKnowledgeBase) {
  const app = express();
  app.use(express.json());
  app.use("/documents", documentsRouter(kb as unknown as ArgosKnowledgeBase, nullLogger));
  return app;
}

describe("documentsRouter", () => {
  let kb: MockedKnowledgeBase;

  beforeEach(() => {
    kb = makeKnowledgeBase();
  });

  describe("POST /documents", () => {
    it("returns 202 with id and pending status when file is uploaded", async () => {
      const doc = makeDoc();
      kb.createDocument.execute.mockResolvedValue(doc);
      const res = await request(makeApp(kb))
        .post("/documents")
        .attach("file", Buffer.from("hello world"), {
          filename: "test.txt",
          contentType: "text/plain",
        })
        .field("title", "My Doc");
      expect(res.status).toBe(202);
      expect(res.body.id).toBe(doc.id);
      expect(res.body.status).toBe("pending");
    });

    it("returns 202 using filename as title when title is omitted", async () => {
      const res = await request(makeApp(kb))
        .post("/documents")
        .attach("file", Buffer.from("content"), {
          filename: "myfile.txt",
          contentType: "text/plain",
        });
      expect(res.status).toBe(202);
    });

    it("returns 400 when no file is uploaded", async () => {
      const res = await request(makeApp(kb)).post("/documents").send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("No file uploaded");
    });
  });

  describe("GET /documents", () => {
    it("returns 200 with documents from documentQueries.list", async () => {
      const docs = [makeDoc(), makeDoc()];
      kb.documentQueries.list.mockResolvedValue(docs);
      const res = await request(makeApp(kb)).get("/documents");
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it("returns empty array when no documents", async () => {
      kb.documentQueries.list.mockResolvedValue([]);
      const res = await request(makeApp(kb)).get("/documents");
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe("GET /documents/:id", () => {
    it("returns 200 with the document", async () => {
      const doc = makeDoc();
      kb.documentQueries.get.mockResolvedValue(doc);
      const res = await request(makeApp(kb)).get(`/documents/${doc.id}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(doc.id);
    });

    it("returns 404 for unknown id", async () => {
      kb.documentQueries.get.mockResolvedValue(null);
      const res = await request(makeApp(kb)).get("/documents/unknown-id");
      expect(res.status).toBe(404);
    });
  });

  describe("GET /documents/:id/chunks", () => {
    it("returns 200 with chunks array", async () => {
      const doc = makeDoc();
      kb.documentQueries.get.mockResolvedValue(doc);
      kb.documentQueries.getChunks.mockResolvedValue([
        { position: 0, contentLength: 100, preview: "First chunk..." },
      ]);
      const res = await request(makeApp(kb)).get(`/documents/${doc.id}/chunks`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
    });

    it("returns 404 when document not found", async () => {
      kb.documentQueries.get.mockResolvedValue(null);
      const res = await request(makeApp(kb)).get("/documents/no-such-id/chunks");
      expect(res.status).toBe(404);
    });
  });

  describe("GET /documents/:id/content", () => {
    it("returns 200 with content", async () => {
      const doc = makeDoc();
      kb.documentQueries.get.mockResolvedValue(doc);
      kb.documentQueries.getContent.mockResolvedValue({
        content: "Full text content",
        sourceType: "text",
      });
      const res = await request(makeApp(kb)).get(`/documents/${doc.id}/content`);
      expect(res.status).toBe(200);
      expect(res.body.content).toBe("Full text content");
    });

    it("returns 404 when document not found", async () => {
      kb.documentQueries.get.mockResolvedValue(null);
      const res = await request(makeApp(kb)).get("/documents/unknown-id/content");
      expect(res.status).toBe(404);
    });

    it("returns 404 when content is not available", async () => {
      const doc = makeDoc();
      kb.documentQueries.get.mockResolvedValue(doc);
      kb.documentQueries.getContent.mockResolvedValue(null);
      const res = await request(makeApp(kb)).get(`/documents/${doc.id}/content`);
      expect(res.status).toBe(404);
    });
  });

  describe("GET /documents/:id/raw", () => {
    it("returns 200 with PDF content-type", async () => {
      const doc = makeDoc({ sourceType: "pdf", filePath: "test.pdf" });
      kb.documentQueries.get.mockResolvedValue(doc);
      kb.documentQueries.getRawBuffer.mockResolvedValue(Buffer.from("%PDF-fake"));
      const res = await request(makeApp(kb)).get(`/documents/${doc.id}/raw`);
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("application/pdf");
    });

    it("returns 404 when document not found", async () => {
      kb.documentQueries.get.mockResolvedValue(null);
      const res = await request(makeApp(kb)).get("/documents/unknown-id/raw");
      expect(res.status).toBe(404);
    });

    it("returns 404 when raw buffer is not available", async () => {
      const doc = makeDoc({ sourceType: "text" });
      kb.documentQueries.get.mockResolvedValue(doc);
      kb.documentQueries.getRawBuffer.mockResolvedValue(null);
      const res = await request(makeApp(kb)).get(`/documents/${doc.id}/raw`);
      expect(res.status).toBe(404);
    });
  });

  describe("GET /documents/:id/summary", () => {
    it("returns 200 with summary", async () => {
      const doc = makeDoc();
      const summary = makeDocumentSummary(doc.id);
      kb.documentQueries.get.mockResolvedValue(doc);
      kb.documentQueries.getSummary.mockResolvedValue(summary);
      const res = await request(makeApp(kb)).get(`/documents/${doc.id}/summary`);
      expect(res.status).toBe(200);
      expect(res.body.documentId).toBe(doc.id);
    });

    it("returns 404 when document not found", async () => {
      kb.documentQueries.get.mockResolvedValue(null);
      const res = await request(makeApp(kb)).get("/documents/unknown-id/summary");
      expect(res.status).toBe(404);
    });

    it("returns 404 when summary not generated yet", async () => {
      const doc = makeDoc();
      kb.documentQueries.get.mockResolvedValue(doc);
      kb.documentQueries.getSummary.mockResolvedValue(null);
      const res = await request(makeApp(kb)).get(`/documents/${doc.id}/summary`);
      expect(res.status).toBe(404);
    });
  });

  describe("POST /documents/:id/summary", () => {
    it("returns 200 with generated content", async () => {
      const doc = makeDoc({ status: "ready" });
      kb.documentQueries.get.mockResolvedValue(doc);
      kb.summarizeDocument.execute.mockResolvedValue("Generated summary");
      const res = await request(makeApp(kb)).post(`/documents/${doc.id}/summary`);
      expect(res.status).toBe(200);
      expect(res.body.content).toBe("Generated summary");
    });

    it("returns 409 when document is not ready", async () => {
      const doc = makeDoc({ status: "pending" });
      kb.documentQueries.get.mockResolvedValue(doc);
      const res = await request(makeApp(kb)).post(`/documents/${doc.id}/summary`);
      expect(res.status).toBe(409);
    });

    it("returns 404 when document not found", async () => {
      kb.documentQueries.get.mockResolvedValue(null);
      const res = await request(makeApp(kb)).post("/documents/unknown-id/summary");
      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /documents/:id", () => {
    it("returns 204 when document exists", async () => {
      const doc = makeDoc();
      kb.documentQueries.get.mockResolvedValue(doc);
      const res = await request(makeApp(kb)).delete(`/documents/${doc.id}`);
      expect(res.status).toBe(204);
    });

    it("returns 404 for unknown id", async () => {
      kb.documentQueries.get.mockResolvedValue(null);
      const res = await request(makeApp(kb)).delete("/documents/unknown-id");
      expect(res.status).toBe(404);
    });
  });
});
