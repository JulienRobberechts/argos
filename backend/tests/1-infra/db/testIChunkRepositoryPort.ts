import { randomUUID } from "node:crypto";
import { beforeAll, beforeEach, expect, it } from "vitest";
import { type Chunk, ChunkMetadata } from "../../../src/domain/entities";
import type { IChunkRepository } from "../../../src/infra-ports/persistence";

type Setup = {
  adapter: IChunkRepository;
  cleanup: () => Promise<void>;
  createDocument: () => Promise<string>;
};

function makeChunk(documentId: string, embedding: number[], overrides?: Partial<Chunk>): Chunk {
  return {
    id: randomUUID(),
    documentId,
    content: "test content",
    embedding,
    metadata: ChunkMetadata.create(0, 0, 12),
    ...overrides,
  };
}

export function testIChunkRepository(setup: () => Setup): void {
  let adapter: IChunkRepository;
  let cleanup: () => Promise<void>;
  let createDocument: Setup["createDocument"];
  let documentId: string;

  beforeAll(() => {
    ({ adapter, cleanup, createDocument } = setup());
  });

  beforeEach(async () => {
    await cleanup();
    documentId = await createDocument();
  });

  it("save stores a chunk and searchByVector finds it", async () => {
    const embedding = Array(1024).fill(0.1);
    const chunk = makeChunk(documentId, embedding);
    await adapter.save(chunk);
    const results = await adapter.searchByVector(embedding, 10, 0.0);
    expect(results).toHaveLength(1);
    expect(results[0].chunk.id).toBe(chunk.id);
  });

  it("searchByVector returns chunks sorted by cosine similarity descending", async () => {
    const queryVector = Array(1024).fill(0);
    queryVector[0] = 1.0;

    const emb1 = Array(1024).fill(0);
    emb1[0] = 1.0;

    const emb2 = Array(1024).fill(0);
    emb2[0] = 0.6;
    emb2[1] = 0.8;

    const emb3 = Array(1024).fill(0);
    emb3[1] = 1.0;

    await adapter.saveMany([
      makeChunk(documentId, emb1, { content: "most similar" }),
      makeChunk(documentId, emb2, { content: "partially similar" }),
      makeChunk(documentId, emb3, { content: "dissimilar" }),
    ]);

    const results = await adapter.searchByVector(queryVector, 10, 0.0);
    expect(results).toHaveLength(3);
    expect(results[0].chunk.content).toBe("most similar");
    expect(results[0].score).toBeGreaterThan(results[1].score);
    expect(results[1].score).toBeGreaterThan(results[2].score);
  });

  it("searchByVector filters results below minScore", async () => {
    const queryVector = Array(1024).fill(0);
    queryVector[0] = 1.0;

    const embHigh = Array(1024).fill(0);
    embHigh[0] = 1.0;

    const embLow = Array(1024).fill(0);
    embLow[1] = 1.0;

    await adapter.saveMany([
      makeChunk(documentId, embHigh, { content: "high score" }),
      makeChunk(documentId, embLow, { content: "low score" }),
    ]);

    const results = await adapter.searchByVector(queryVector, 10, 0.5);
    expect(results).toHaveLength(1);
    expect(results[0].chunk.content).toBe("high score");
  });

  it("searchByVector respects limit", async () => {
    const embedding = Array(1024).fill(0.1);
    await adapter.saveMany([
      makeChunk(documentId, embedding),
      makeChunk(documentId, embedding),
      makeChunk(documentId, embedding),
    ]);
    const results = await adapter.searchByVector(embedding, 2, 0.0);
    expect(results).toHaveLength(2);
  });

  it("searchHybrid returns results combining text and vector", async () => {
    const embedding = Array(1024).fill(0.1);
    await adapter.save(makeChunk(documentId, embedding, { content: "hello world" }));
    const results = await adapter.searchHybrid("hello", embedding, 10, 0.0);
    expect(results.length).toBeGreaterThan(0);
  });

  it("findByDocumentId returns all chunks for a document", async () => {
    const embedding = Array(1024).fill(0.1);
    await adapter.saveMany([
      makeChunk(documentId, embedding, { content: "first" }),
      makeChunk(documentId, embedding, { content: "second" }),
    ]);
    const chunks = await adapter.findByDocumentId(documentId);
    expect(chunks).toHaveLength(2);
  });

  it("deleteByDocumentId removes all chunks for the document", async () => {
    await adapter.saveMany([
      makeChunk(documentId, Array(1024).fill(0.1)),
      makeChunk(documentId, Array(1024).fill(0.2)),
    ]);
    await adapter.deleteByDocumentId(documentId);
    const results = await adapter.searchByVector(Array(1024).fill(0.1), 10, 0.0);
    expect(results).toHaveLength(0);
  });

  it("deleteAll removes all chunks", async () => {
    const embedding = Array(1024).fill(0.1);
    await adapter.saveMany([makeChunk(documentId, embedding), makeChunk(documentId, embedding)]);
    await adapter.deleteAll();
    const results = await adapter.searchByVector(embedding, 10, 0.0);
    expect(results).toHaveLength(0);
  });
}
