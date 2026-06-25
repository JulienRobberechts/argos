import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InMemoryChunkRepository } from "../../../tests/fakes/InMemoryChunkRepository";
import { InMemoryDocumentRepository } from "../../../tests/fakes/InMemoryDocumentRepository";
import { InMemoryEmbeddingAdapter } from "../../../tests/fakes/InMemoryEmbeddingAdapter";
import { InMemoryFileParser } from "../../../tests/fakes/InMemoryFileParser";
import { InMemoryFileStorage } from "../../../tests/fakes/InMemoryFileStorage";
import { nullLogger } from "../../../tests/fakes/NullLogger";
import type { Document } from "../../domain/entities";
import type { ChunkingConfig } from "../admin/AppSettingsService";
import { IngestDocument } from "./IngestDocument";

function makeDocument(overrides?: Partial<Document>): Document {
  return {
    id: randomUUID(),
    title: "Test Doc",
    sourceType: "text",
    status: "pending",
    filePath: "test.txt",
    createdAt: new Date(),
    ...overrides,
  };
}

describe("IngestDocument", () => {
  let docRepo: InMemoryDocumentRepository;
  let chunkRepo: InMemoryChunkRepository;
  let embeddingAdapter: InMemoryEmbeddingAdapter;
  let fileStorage: InMemoryFileStorage;
  let fileParser: InMemoryFileParser;

  beforeEach(() => {
    docRepo = new InMemoryDocumentRepository();
    chunkRepo = new InMemoryChunkRepository();
    embeddingAdapter = new InMemoryEmbeddingAdapter();
    fileStorage = new InMemoryFileStorage();
    fileStorage.seed("test.txt", Buffer.from("dummy"));
    fileParser = new InMemoryFileParser();
  });

  function makeIngest(config?: Partial<ChunkingConfig>) {
    return new IngestDocument(
      docRepo,
      chunkRepo,
      embeddingAdapter,
      fileStorage,
      fileParser,
      async () => ({
        strategy: config?.strategy ?? "recursive",
        chunkSize: config?.chunkSize ?? 512,
        chunkOverlap: config?.chunkOverlap ?? 128,
      }),
      nullLogger,
    );
  }

  it("should download the file from storage then parse it", async () => {
    const doc = makeDocument({ filePath: "test.txt" });
    await docRepo.save(doc);
    const downloadSpy = vi.spyOn(fileStorage, "download");
    const parseSpy = vi.spyOn(fileParser, "parse");
    await makeIngest().execute(doc.id);
    expect(downloadSpy).toHaveBeenCalledWith("test.txt");
    expect(parseSpy).toHaveBeenCalledWith({
      buffer: Buffer.from("dummy"),
      fileName: "test.txt",
    });
  });

  it("should split content into chunks using ChunkingStrategy", async () => {
    const text = Array(10)
      .fill("word")
      .map((w, i) => `${w}${i}`)
      .join(" ");
    fileParser.setText(text);
    const doc = makeDocument();
    await docRepo.save(doc);
    await makeIngest({ chunkSize: 3, chunkOverlap: 0 }).execute(doc.id);
    const results = await chunkRepo.searchByVector(Array(1024).fill(0.1), 100, 0);
    expect(results.length).toBeGreaterThan(1);
  });

  it("should call embedding adapter for each chunk in batches of 20", async () => {
    const text = Array(25)
      .fill("word")
      .map((w, i) => `${w}${i}`)
      .join(" ");
    fileParser.setText(text);
    const doc = makeDocument();
    await docRepo.save(doc);
    const embedManySpy = vi.spyOn(embeddingAdapter, "embedMany");
    await makeIngest({ chunkSize: 1, chunkOverlap: 0 }).execute(doc.id);
    expect(embedManySpy).toHaveBeenCalledTimes(2);
    expect(embedManySpy.mock.calls[0][0]).toHaveLength(20);
    expect(embedManySpy.mock.calls[1][0]).toHaveLength(5);
  });

  it("should save all chunks to the chunk repository", async () => {
    const doc = makeDocument();
    await docRepo.save(doc);
    await makeIngest().execute(doc.id);
    const results = await chunkRepo.searchByVector(Array(1024).fill(0.1), 100, 0);
    expect(results.length).toBeGreaterThan(0);
  });

  it('should mark document status as "ready" after successful ingestion', async () => {
    const doc = makeDocument();
    await docRepo.save(doc);
    await makeIngest().execute(doc.id);
    const updated = await docRepo.findById(doc.id);
    expect(updated?.status).toBe("ready");
  });

  it('should mark document status as "error" if embedding adapter throws', async () => {
    vi.spyOn(embeddingAdapter, "embedMany").mockRejectedValue(new Error("API error"));
    const doc = makeDocument();
    await docRepo.save(doc);
    await makeIngest().execute(doc.id);
    const updated = await docRepo.findById(doc.id);
    expect(updated?.status).toBe("error");
  });

  it('should mark document status as "error" if storage download fails', async () => {
    vi.spyOn(fileStorage, "download").mockRejectedValue(new Error("Storage error"));
    const doc = makeDocument();
    await docRepo.save(doc);
    await makeIngest().execute(doc.id);
    const updated = await docRepo.findById(doc.id);
    expect(updated?.status).toBe("error");
  });

  it("should delete existing chunks before reingest (idempotency)", async () => {
    const doc = makeDocument();
    await docRepo.save(doc);
    await makeIngest().execute(doc.id);
    const firstCount = (await chunkRepo.searchByVector(Array(1024).fill(0.1), 100, 0)).length;

    await docRepo.updateStatus(doc.id, "pending");
    await makeIngest().execute(doc.id);
    const secondCount = (await chunkRepo.searchByVector(Array(1024).fill(0.1), 100, 0)).length;
    expect(secondCount).toBe(firstCount);
  });
});
