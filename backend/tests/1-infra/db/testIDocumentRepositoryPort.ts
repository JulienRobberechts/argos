import { randomUUID } from "node:crypto";
import { beforeAll, beforeEach, expect, it } from "vitest";
import type { Document } from "../../../src/domain/entities";
import type { IDocumentRepository } from "../../../src/infra-ports/persistence";

type Setup = {
  adapter: IDocumentRepository;
  cleanup: () => Promise<void>;
  verifyOnMedium: (id: string) => Promise<Pick<Document, "title" | "status" | "filePath">>;
  prepareChunkForDocument: (documentId: string) => Promise<void>;
  countChunksForDocument: (documentId: string) => Promise<number>;
};

function makeDocument(overrides?: Partial<Document>): Document {
  return {
    id: randomUUID(),
    title: "Test Document",
    sourceType: "text",
    status: "pending",
    filePath: null,
    createdAt: new Date(),
    ...overrides,
  };
}

export function testIDocumentRepository(setup: () => Setup): void {
  let adapter: IDocumentRepository;
  let cleanup: () => Promise<void>;
  let verifyOnMedium: Setup["verifyOnMedium"];
  let prepareChunkForDocument: Setup["prepareChunkForDocument"];
  let countChunksForDocument: Setup["countChunksForDocument"];

  beforeAll(() => {
    ({ adapter, cleanup, verifyOnMedium, prepareChunkForDocument, countChunksForDocument } =
      setup());
  });

  beforeEach(async () => {
    await cleanup();
  });

  it("save stores document and findById retrieves it", async () => {
    const doc = makeDocument();
    await adapter.save(doc);
    const found = await adapter.findById(doc.id);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(doc.id);
    expect(found?.title).toBe(doc.title);
    expect(found?.status).toBe("pending");
    expect(found?.sourceType).toBe("text");
    expect(found?.filePath).toBeNull();
  });

  it("save persists on the underlying medium", async () => {
    const doc = makeDocument({ title: "Medium Check" });
    await adapter.save(doc);
    const row = await verifyOnMedium(doc.id);
    expect(row.title).toBe("Medium Check");
    expect(row.status).toBe("pending");
  });

  it("findById returns null for unknown id", async () => {
    expect(await adapter.findById(randomUUID())).toBeNull();
  });

  it("findAll returns all saved documents", async () => {
    await adapter.save(makeDocument({ title: "Doc 1" }));
    await adapter.save(makeDocument({ title: "Doc 2" }));
    const all = await adapter.findAll();
    expect(all).toHaveLength(2);
  });

  it("save upserts an existing document", async () => {
    const doc = makeDocument();
    await adapter.save(doc);
    await adapter.save({ ...doc, title: "Updated Title" });
    const found = await adapter.findById(doc.id);
    expect(found?.title).toBe("Updated Title");
  });

  it("updateStatus changes document status", async () => {
    const doc = makeDocument();
    await adapter.save(doc);
    await adapter.updateStatus(doc.id, "ready");
    const found = await adapter.findById(doc.id);
    expect(found?.status).toBe("ready");
  });

  it("delete removes the document", async () => {
    const doc = makeDocument();
    await adapter.save(doc);
    await adapter.delete(doc.id);
    expect(await adapter.findById(doc.id)).toBeNull();
  });

  it("delete cascades to chunks", async () => {
    const doc = makeDocument();
    await adapter.save(doc);
    await prepareChunkForDocument(doc.id);
    expect(await countChunksForDocument(doc.id)).toBe(1);
    await adapter.delete(doc.id);
    expect(await countChunksForDocument(doc.id)).toBe(0);
  });

  it("deleteAll removes all documents", async () => {
    await adapter.save(makeDocument());
    await adapter.save(makeDocument());
    await adapter.deleteAll();
    expect(await adapter.findAll()).toHaveLength(0);
  });
}
