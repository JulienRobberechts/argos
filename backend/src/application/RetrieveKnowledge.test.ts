import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InMemoryChunkRepository } from "../../tests/fakes/InMemoryChunkRepository";
import { ChunkMetadata, type Chunk } from "../domain/entities/Chunk";
import { nullLogger } from "../../tests/fakes/NullLogger";
import { RetrieveKnowledge } from "./RetrieveKnowledge";

function makeChunk(embedding: number[], overrides?: Partial<Chunk>): Chunk {
  return {
    id: randomUUID(),
    documentId: randomUUID(),
    content: "test content",
    embedding,
    metadata: ChunkMetadata.create(0, 0, 12),
    ...overrides,
  };
}

function unitVec(dim: number, hotIndex: number): number[] {
  return Array.from({ length: dim }, (_, i) => (i === hotIndex ? 1 : 0));
}

describe("RetrieveKnowledge", () => {
  let chunkRepo: InMemoryChunkRepository;

  beforeEach(() => {
    chunkRepo = new InMemoryChunkRepository();
  });

  it("should embed the query using the embedding adapter", async () => {
    const embed = vi.fn().mockResolvedValue(Array(1024).fill(0.1));
    const search = new RetrieveKnowledge(
      chunkRepo,
      {
        embed,
        embedMany: vi.fn(),
      },
      nullLogger,
    );
    await search.execute("my query");
    expect(embed).toHaveBeenCalledWith("my query", "query");
  });

  it("should return chunks sorted by score descending", async () => {
    const queryVec = unitVec(1024, 0);
    const chunk1 = makeChunk(unitVec(1024, 0), { content: "best match" });
    const chunk2 = makeChunk(
      Array.from({ length: 1024 }, (_, i) =>
        i === 0 ? 0.6 : i === 1 ? 0.8 : 0,
      ),
      { content: "partial match" },
    );
    const chunk3 = makeChunk(unitVec(1024, 1), { content: "poor match" });
    await chunkRepo.saveMany([chunk1, chunk2, chunk3]);

    const search = new RetrieveKnowledge(
      chunkRepo,
      {
        embed: vi.fn().mockResolvedValue(queryVec),
        embedMany: vi.fn(),
      },
      nullLogger,
    );
    const results = await search.execute("query", 10, 0);
    expect(results[0].chunk.id).toBe(chunk1.id);
    expect(results[0].score).toBeGreaterThan(results[1].score);
    expect(results[1].score).toBeGreaterThan(results[2].score);
  });

  it("should filter out chunks below minimum score threshold", async () => {
    const queryVec = unitVec(1024, 0);
    await chunkRepo.saveMany([
      makeChunk(unitVec(1024, 0), { content: "high score" }),
      makeChunk(unitVec(1024, 1), { content: "low score" }),
    ]);

    const search = new RetrieveKnowledge(
      chunkRepo,
      {
        embed: vi.fn().mockResolvedValue(queryVec),
        embedMany: vi.fn(),
      },
      nullLogger,
    );
    const results = await search.execute("query", 10, 0.5);
    expect(results).toHaveLength(1);
    expect(results[0].chunk.content).toBe("high score");
  });

  it("should return empty array when no chunks match the threshold", async () => {
    const search = new RetrieveKnowledge(
      chunkRepo,
      {
        embed: vi.fn().mockResolvedValue(Array(1024).fill(0.1)),
        embedMany: vi.fn(),
      },
      nullLogger,
    );
    const results = await search.execute("query", 10, 0.5);
    expect(results).toHaveLength(0);
  });

  it("should respect the limit parameter", async () => {
    const queryVec = unitVec(1024, 0);
    await chunkRepo.saveMany([
      makeChunk(unitVec(1024, 0)),
      makeChunk(unitVec(1024, 0)),
      makeChunk(unitVec(1024, 0)),
    ]);

    const search = new RetrieveKnowledge(
      chunkRepo,
      {
        embed: vi.fn().mockResolvedValue(queryVec),
        embedMany: vi.fn(),
      },
      nullLogger,
    );
    const results = await search.execute("query", 2, 0);
    expect(results).toHaveLength(2);
  });

  describe("hybrid mode", () => {
    it("should call searchHybrid when searchMode is hybrid", async () => {
      const queryVec = unitVec(1024, 0);
      const searchHybrid = vi.spyOn(chunkRepo, "searchHybrid");
      const search = new RetrieveKnowledge(
        chunkRepo,
        { embed: vi.fn().mockResolvedValue(queryVec), embedMany: vi.fn() },
        nullLogger,
        null,
        3,
        "hybrid",
      );
      await search.execute("my query", 5, 0);
      expect(searchHybrid).toHaveBeenCalledWith("my query", queryVec, 5, 0);
    });

    it("should call search (vector only) when searchMode is vector", async () => {
      const queryVec = unitVec(1024, 0);
      const search = vi.spyOn(chunkRepo, "searchByVector");
      const retrieveKnowledge = new RetrieveKnowledge(
        chunkRepo,
        { embed: vi.fn().mockResolvedValue(queryVec), embedMany: vi.fn() },
        nullLogger,
        null,
        3,
        "vector",
      );
      await retrieveKnowledge.execute("my query", 5, 0);
      expect(search).toHaveBeenCalledWith(queryVec, 5, 0);
    });

    it("should return hybrid results passed to caller", async () => {
      const queryVec = unitVec(1024, 0);
      const chunk = makeChunk(unitVec(1024, 0), {
        content: "exact acronym RAG",
      });
      await chunkRepo.save(chunk);

      const search = new RetrieveKnowledge(
        chunkRepo,
        { embed: vi.fn().mockResolvedValue(queryVec), embedMany: vi.fn() },
        nullLogger,
        null,
        3,
        "hybrid",
      );
      const results = await search.execute("RAG", 5, 0);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].chunk.id).toBe(chunk.id);
    });
  });
});
