import { randomUUID } from "node:crypto";
import { beforeAll, beforeEach, expect, it } from "vitest";
import type { IDocumentSummaryRepository } from "../../../src/infra-ports/persistence";

type Setup = {
  adapter: IDocumentSummaryRepository;
  cleanup: () => Promise<void>;
  createDocument: () => Promise<string>;
};

export function testIDocumentSummaryRepository(setup: () => Setup): void {
  let adapter: IDocumentSummaryRepository;
  let cleanup: () => Promise<void>;
  let createDocument: () => Promise<string>;

  beforeAll(() => {
    ({ adapter, cleanup, createDocument } = setup());
  });

  beforeEach(async () => {
    await cleanup();
  });

  it("findByDocumentId returns null when no summary exists", async () => {
    const result = await adapter.findByDocumentId(randomUUID());
    expect(result).toBeNull();
  });

  it("upsert creates a summary and findByDocumentId retrieves it", async () => {
    const documentId = await createDocument();
    await adapter.upsert(documentId, "Summary content");
    const result = await adapter.findByDocumentId(documentId);
    expect(result).not.toBeNull();
    expect(result?.documentId).toBe(documentId);
    expect(result?.content).toBe("Summary content");
  });

  it("upsert updates existing summary on second call", async () => {
    const documentId = await createDocument();
    await adapter.upsert(documentId, "First version");
    await adapter.upsert(documentId, "Second version");
    const result = await adapter.findByDocumentId(documentId);
    expect(result?.content).toBe("Second version");
  });

  it("upsert sets createdAt and updatedAt on creation", async () => {
    const documentId = await createDocument();
    await adapter.upsert(documentId, "content");
    const result = await adapter.findByDocumentId(documentId);
    expect(result?.createdAt).toBeInstanceOf(Date);
    expect(result?.updatedAt).toBeInstanceOf(Date);
  });

  it("deleteAll removes all summaries", async () => {
    const docId1 = await createDocument();
    const docId2 = await createDocument();
    await adapter.upsert(docId1, "summary 1");
    await adapter.upsert(docId2, "summary 2");
    await adapter.deleteAll();
    expect(await adapter.findByDocumentId(docId1)).toBeNull();
    expect(await adapter.findByDocumentId(docId2)).toBeNull();
  });
}
