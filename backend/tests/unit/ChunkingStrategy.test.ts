import { describe, it, expect } from "vitest";
import { ChunkingStrategy } from "../../src/domain/services/ChunkingStrategy";

const strategy = new ChunkingStrategy();

describe("ChunkingStrategy", () => {
  it("should split text into chunks of max CHUNK_SIZE tokens", () => {
    const text = Array(200).fill("word").join(" ");
    const chunks = strategy.chunk(text, { chunkSize: 50, chunkOverlap: 0 });

    expect(chunks.length).toBeGreaterThan(1);
    chunks.forEach((chunk) => {
      const tokenCount = chunk.content.trim().split(/\s+/).length;
      expect(tokenCount).toBeLessThanOrEqual(50);
    });
  });

  it("should maintain CHUNK_OVERLAP tokens overlap between consecutive chunks", () => {
    const words = Array.from({ length: 30 }, (_, i) => `word${i}`);
    const text = words.join(" ");
    const chunks = strategy.chunk(text, { chunkSize: 10, chunkOverlap: 3 });

    expect(chunks.length).toBeGreaterThanOrEqual(2);
    const chunk0Words = chunks[0].content.trim().split(/\s+/);
    const chunk1Words = chunks[1].content.trim().split(/\s+/);
    const lastThreeOfChunk0 = chunk0Words.slice(-3);
    const firstThreeOfChunk1 = chunk1Words.slice(0, 3);
    expect(firstThreeOfChunk1).toEqual(lastThreeOfChunk0);
  });

  it("should never cut a sentence mid-word", () => {
    const text =
      "The quick brown fox jumps over the lazy dog and then runs away fast today always";
    const chunks = strategy.chunk(text, { chunkSize: 5, chunkOverlap: 1 });

    const originalWords = new Set(text.split(/\s+/));
    chunks.forEach((chunk) => {
      chunk.content
        .trim()
        .split(/\s+/)
        .forEach((word) => {
          expect(originalWords.has(word)).toBe(true);
        });
    });
  });

  it("should prefer splitting on double newlines over single newlines over periods", () => {
    const text =
      "word1 word2 word3 word4\n\nword5 word6 word7 word8 word9 word10 word11 word12";
    const chunks = strategy.chunk(text, { chunkSize: 8, chunkOverlap: 0 });

    expect(chunks[0].content).toContain("word4");
    expect(chunks[0].content).not.toContain("word5");
  });

  it("should prefer single newline over period as split boundary", () => {
    const text =
      "word1 word2 word3 word4 word5. word6\nword7 word8 word9 word10 word11 word12 word13 word14";
    const chunks = strategy.chunk(text, { chunkSize: 8, chunkOverlap: 0 });

    expect(chunks[0].content).not.toContain("word7");
  });

  it("should return single chunk for text shorter than chunk size", () => {
    const text = "This is a short text.";
    const chunks = strategy.chunk(text, { chunkSize: 100, chunkOverlap: 10 });

    expect(chunks).toHaveLength(1);
    expect(chunks[0].content).toBe(text.trim());
    expect(chunks[0].metadata.position).toBe(0);
  });

  it("should preserve metadata: position, startChar, endChar per chunk", () => {
    const text =
      "word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12";
    const chunks = strategy.chunk(text, { chunkSize: 5, chunkOverlap: 0 });

    expect(chunks.length).toBeGreaterThan(1);
    chunks.forEach((chunk) => {
      const sliced = text
        .slice(chunk.metadata.startChar, chunk.metadata.endChar)
        .trim();
      expect(sliced).toBe(chunk.content);
      expect(typeof chunk.metadata.position).toBe("number");
      expect(typeof chunk.metadata.startChar).toBe("number");
      expect(typeof chunk.metadata.endChar).toBe("number");
    });
  });

  it("should assign sequential position numbers starting at 0", () => {
    const text = Array(60).fill("word").join(" ");
    const chunks = strategy.chunk(text, { chunkSize: 10, chunkOverlap: 0 });

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].metadata.position).toBe(0);
    chunks.forEach((chunk, index) => {
      expect(chunk.metadata.position).toBe(index);
    });
  });
});
