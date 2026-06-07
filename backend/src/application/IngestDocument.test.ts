import { randomUUID } from "crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Document } from "../domain/entities/Document";
import { IngestDocument } from "./IngestDocument";
import {
  createChunkingStrategy,
  IChunkingStrategy,
} from "../domain/services/ChunkingStrategy";
import { InMemoryChunkRepository } from "../../tests/fakes/InMemoryChunkRepository";
import { InMemoryDocumentRepository } from "../../tests/fakes/InMemoryDocumentRepository";

function makeDocument(overrides?: Partial<Document>): Document {
  return {
    id: randomUUID(),
    title: "Test Doc",
    sourceType: "text",
    status: "pending",
    filePath: "/tmp/test.txt",
    createdAt: new Date(),
    ...overrides,
  };
}

function makeFileParser(text = "word1 word2 word3 word4 word5") {
  return {
    parse: vi
      .fn()
      .mockResolvedValue({ text, metadata: { fileName: "test.txt" } }),
  };
}

function makeEmbeddingAdapter() {
  return {
    embed: vi.fn(),
    embedMany: vi
      .fn()
      .mockImplementation(async (texts: string[]) =>
        texts.map(() => Array(1024).fill(0.1)),
      ),
  };
}

describe("IngestDocument", () => {
  let docRepo: InMemoryDocumentRepository;
  let chunkRepo: InMemoryChunkRepository;
  let embeddingAdapter: ReturnType<typeof makeEmbeddingAdapter>;
  let fileParser: ReturnType<typeof makeFileParser>;
  let chunkingStrategy: IChunkingStrategy;

  beforeEach(() => {
    docRepo = new InMemoryDocumentRepository();
    chunkRepo = new InMemoryChunkRepository();
    embeddingAdapter = makeEmbeddingAdapter();
    fileParser = makeFileParser();
    chunkingStrategy = createChunkingStrategy("recursive");
  });

  it("should parse the file content using the correct parser by sourceType", async () => {
    const doc = makeDocument({ filePath: "/tmp/test.txt" });
    await docRepo.save(doc);
    const ingest = new IngestDocument(
      docRepo,
      chunkRepo,
      embeddingAdapter,
      fileParser,
      chunkingStrategy,
    );
    await ingest.execute(doc.id);
    expect(fileParser.parse).toHaveBeenCalledWith(doc.filePath);
  });

  it("should split content into chunks using ChunkingStrategy", async () => {
    const text = Array(10)
      .fill("word")
      .map((w, i) => `${w}${i}`)
      .join(" ");
    const parser = makeFileParser(text);
    const doc = makeDocument();
    await docRepo.save(doc);
    const ingest = new IngestDocument(
      docRepo,
      chunkRepo,
      embeddingAdapter,
      parser,
      chunkingStrategy,
      { chunkSize: 3, chunkOverlap: 0 },
    );
    await ingest.execute(doc.id);
    const results = await chunkRepo.search(Array(1024).fill(0.1), 100, 0);
    expect(results.length).toBeGreaterThan(1);
  });

  it("should call embedding adapter for each chunk in batches of 20", async () => {
    const text = Array(25)
      .fill("word")
      .map((w, i) => `${w}${i}`)
      .join(" ");
    const parser = makeFileParser(text);
    const doc = makeDocument();
    await docRepo.save(doc);
    const ingest = new IngestDocument(
      docRepo,
      chunkRepo,
      embeddingAdapter,
      parser,
      chunkingStrategy,
      { chunkSize: 1, chunkOverlap: 0 },
    );
    await ingest.execute(doc.id);
    expect(embeddingAdapter.embedMany).toHaveBeenCalledTimes(2);
    expect(embeddingAdapter.embedMany.mock.calls[0][0]).toHaveLength(20);
    expect(embeddingAdapter.embedMany.mock.calls[1][0]).toHaveLength(5);
  });

  it("should save all chunks to the chunk repository", async () => {
    const doc = makeDocument();
    await docRepo.save(doc);
    const ingest = new IngestDocument(
      docRepo,
      chunkRepo,
      embeddingAdapter,
      fileParser,
      chunkingStrategy,
    );
    await ingest.execute(doc.id);
    const results = await chunkRepo.search(Array(1024).fill(0.1), 100, 0);
    expect(results.length).toBeGreaterThan(0);
  });

  it('should mark document status as "ready" after successful ingestion', async () => {
    const doc = makeDocument();
    await docRepo.save(doc);
    const ingest = new IngestDocument(
      docRepo,
      chunkRepo,
      embeddingAdapter,
      fileParser,
      chunkingStrategy,
    );
    await ingest.execute(doc.id);
    const updated = await docRepo.findById(doc.id);
    expect(updated!.status).toBe("ready");
  });

  it('should mark document status as "error" if embedding adapter throws', async () => {
    const errorAdapter = {
      embed: vi.fn(),
      embedMany: vi.fn().mockRejectedValue(new Error("API error")),
    };
    const doc = makeDocument();
    await docRepo.save(doc);
    const ingest = new IngestDocument(
      docRepo,
      chunkRepo,
      errorAdapter,
      fileParser,
      chunkingStrategy,
    );
    await ingest.execute(doc.id);
    const updated = await docRepo.findById(doc.id);
    expect(updated!.status).toBe("error");
  });

  it("should delete existing chunks before reingest (idempotency)", async () => {
    const doc = makeDocument();
    await docRepo.save(doc);
    const ingest = new IngestDocument(
      docRepo,
      chunkRepo,
      embeddingAdapter,
      fileParser,
      chunkingStrategy,
    );

    await ingest.execute(doc.id);
    const firstResults = await chunkRepo.search(Array(1024).fill(0.1), 100, 0);
    const firstCount = firstResults.length;

    await docRepo.updateStatus(doc.id, "pending");
    await ingest.execute(doc.id);
    const secondResults = await chunkRepo.search(Array(1024).fill(0.1), 100, 0);
    expect(secondResults.length).toBe(firstCount);
  });
});
